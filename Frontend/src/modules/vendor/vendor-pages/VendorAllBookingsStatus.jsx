import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoTimeOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
} from "react-icons/io5";
import { getVendorBookings } from "../../../services/vendorApi";
import PageContainer from "../../shared/components/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";

export default function VendorAllBookingsStatus() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadConfirmedBookings();
  }, []);

  const loadConfirmedBookings = async () => {
    try {
      setLoading(true);
      setError("");

      // Get all bookings - confirmed bookings are those where user has paid (ASSIGNED or beyond)
      const response = await getVendorBookings({
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (response.success) {
        const allBookings = response.data.bookings || [];
        // Filter bookings where user has confirmed by paying (advance payment done)
        // Include: ASSIGNED (user paid advance - booking confirmed), ACCEPTED, and all statuses beyond
        // Exclude: PENDING (user hasn't paid yet), REJECTED, CANCELLED
        const confirmedBookings = allBookings.filter(
          (booking) => {
            const status = booking.vendorStatus || booking.status;
            // Show bookings where user has paid (ASSIGNED = user confirmed by paying)
            // or where booking has progressed beyond user confirmation
            return !["PENDING", "REJECTED", "CANCELLED"].includes(status);
          }
        );
        setBookings(confirmedBookings);
      } else {
        setError(response.message || "Failed to load bookings");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString, timeString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const formattedDate = date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });

    if (isToday) {
      return `Today, ${timeString || "N/A"}`;
    } else if (isTomorrow) {
      return `Tomorrow, ${timeString || "N/A"}`;
    } else {
      return `${formattedDate}, ${timeString || "N/A"}`;
    }
  };

  const formatAddress = (address) => {
    if (!address) return "N/A";
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.pincode) parts.push(address.pincode);
    return parts.join(", ") || "N/A";
  };

  const formatBookingId = (id) => {
    if (!id) return "#JALA0000";
    const shortId = id.toString().slice(-4).toUpperCase();
    return `#JALA${shortId}`;
  };

  const formatAmount = (amount) => {
    if (!amount) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACCEPTED: { color: "bg-blue-100 text-blue-700", label: "Accepted" },
      VISITED: { color: "bg-purple-100 text-purple-700", label: "Visited" },
      REPORT_UPLOADED: {
        color: "bg-indigo-100 text-indigo-700",
        label: "Report Uploaded",
      },
      AWAITING_PAYMENT: {
        color: "bg-orange-100 text-orange-700",
        label: "Awaiting Payment",
      },
      COMPLETED: { color: "bg-green-100 text-green-700", label: "Completed" },
      SUCCESS: { color: "bg-green-100 text-green-700", label: "Success" },
      FAILED: { color: "bg-red-100 text-red-700", label: "Failed" },
    };
    const config =
      statusConfig[status] || { color: "bg-gray-100 text-gray-700", label: status };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner message="Loading confirmed bookings..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ErrorMessage message={error} />

      {/* Heading */}
      <h1 className="text-2xl font-bold text-[#3A3A3A] mb-4">
        All Confirmed Bookings
      </h1>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <div className="mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mx-auto">
              <IoCalendarOutline className="text-3xl text-blue-500" />
            </div>
            <p className="text-[#3A3A3A] font-semibold mb-2">
              No Confirmed Bookings
            </p>
            <p className="text-[#6B7280] text-sm">
              You don't have any confirmed bookings yet. Accept bookings from the
              requests page to see them here.
            </p>
          </div>
        ) : (
          bookings.map((booking) => (
            <div
              key={booking._id}
              onClick={() => navigate(`/vendor/bookings/${booking._id}`)}
              className="rounded-xl bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] cursor-pointer hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all"
            >
              {/* Customer Info Header */}
              <div className="mb-4">
                <div className="flex items-start gap-4 mb-3">
                  {/* Profile Picture */}
                  {booking.user?.profilePicture ||
                    booking.user?.documents?.profilePicture?.url ? (
                    <img
                      src={
                        booking.user.profilePicture ||
                        booking.user?.documents?.profilePicture?.url
                      }
                      alt="User Avatar"
                      className="h-14 w-14 rounded-full border-2 border-[#0A84FF] object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full border-2 border-[#0A84FF] bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                      {booking.user?.name ? (
                        <span className="text-lg font-bold text-[#0A84FF]">
                          {booking.user.name.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-xl">👤</span>
                      )}
                    </div>
                  )}

                  {/* Customer Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#3A3A3A] mb-1 truncate">
                      {booking.user?.name || "Customer"}
                    </h3>
                    <p className="text-xs text-[#6B7280] mb-2">
                      Booking ID: {formatBookingId(booking._id)}
                    </p>
                    {/* Status Badge - Separate line */}
                    <div className="flex items-center gap-2">
                      {getStatusBadge(booking.vendorStatus || booking.status)}
                    </div>
                  </div>

                  {/* Payment Amount */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-[#00C2A8]">
                      {formatAmount(
                        booking.payment?.totalAmount ||
                        booking.payment?.amount ||
                        0
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="my-4 h-px bg-gray-200"></div>

              {/* Service Details */}
              <div className="mb-4">
                <h4 className="mb-2 font-semibold text-[#3A3A3A]">
                  Service Details
                </h4>
                <div className="space-y-2 text-sm">
                  {/* Service Name */}
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <span className="material-symbols-outlined !text-xl text-[#00C2A8]">
                      design_services
                    </span>
                    <span className="text-[#3A3A3A]">
                      {booking.service?.name || "Service"}
                      {booking.service?.machineType &&
                        ` (${booking.service.machineType})`}
                    </span>
                  </div>

                  {/* Date and Time */}
                  <div className="flex items-center gap-2">
                    <IoTimeOutline className="text-[#00C2A8] text-xl" />
                    <span className="text-[#3A3A3A]">
                      {formatDate(
                        booking.scheduledDate,
                        booking.scheduledTime
                      )}
                    </span>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-2">
                    <IoLocationOutline className="text-[#00C2A8] text-xl mt-0.5" />
                    <span className="text-[#3A3A3A]">
                      {formatAddress(booking.address)}
                    </span>
                  </div>
                </div>
              </div>

              {/* View Status Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/vendor/booking/${booking._id}/status`);
                }}
                className="w-full rounded-lg bg-[#0A84FF] py-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-[#005BBB] flex items-center justify-center gap-2"
              >
                <IoDocumentTextOutline className="text-xl" />
                View Status Timeline
              </button>
            </div>
          ))
        )}
      </div>
    </PageContainer>
  );
}

