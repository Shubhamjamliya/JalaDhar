import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoTimeOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
} from "react-icons/io5";
import { getUserBookings } from "../../../services/bookingApi";
import PageContainer from "../../shared/components/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";

export default function UserAllBookingsStatus() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAllBookings();
  }, []);

  const loadAllBookings = async () => {
    try {
      setLoading(true);
      setError("");

      // Get all bookings
      const response = await getUserBookings({
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (response.success) {
        const allBookings = response.data.bookings || [];
        // Show all bookings except cancelled/rejected (include completed ones)
        const validBookings = allBookings.filter(
          (booking) => {
            const status = booking.userStatus || booking.status;
            return !["CANCELLED", "REJECTED"].includes(status);
          }
        );
        setBookings(validBookings);
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
      PENDING: { color: "bg-yellow-100 text-yellow-700", label: "Pending" },
      ASSIGNED: { color: "bg-blue-100 text-blue-700", label: "Assigned" },
      ACCEPTED: { color: "bg-green-100 text-green-700", label: "Accepted" },
      VISITED: { color: "bg-purple-100 text-purple-700", label: "Visited" },
      REPORT_UPLOADED: { color: "bg-indigo-100 text-indigo-700", label: "Report Uploaded" },
      AWAITING_PAYMENT: { color: "bg-orange-100 text-orange-700", label: "Awaiting Payment" },
      PAYMENT_SUCCESS: { color: "bg-teal-100 text-teal-700", label: "Payment Success" },
      BOREWELL_UPLOADED: { color: "bg-cyan-100 text-cyan-700", label: "Borewell Uploaded" },
      ADMIN_APPROVED: { color: "bg-emerald-100 text-emerald-700", label: "Admin Approved" },
      FINAL_SETTLEMENT: { color: "bg-amber-100 text-amber-700", label: "Final Settlement" },
      COMPLETED: { color: "bg-green-100 text-green-700", label: "Completed" },
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
        <LoadingSpinner message="Loading bookings..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ErrorMessage message={error} />

      {/* Heading */}
      <h1 className="text-2xl font-bold text-[#3A3A3A] mb-4">
        My Bookings
      </h1>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <div className="mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mx-auto">
              <IoCalendarOutline className="text-3xl text-blue-500" />
            </div>
            <p className="text-[#3A3A3A] font-semibold mb-2">
              No Bookings
            </p>
            <p className="text-[#6B7280] text-sm">
              You don't have any bookings yet. Create a new booking to see them here.
            </p>
          </div>
        ) : (
          bookings.map((booking) => (
            <div
              key={booking._id}
              className="rounded-xl bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
            >
              {/* Vendor Info Header */}
              <div className="flex items-center gap-4 mb-4">
                {/* Profile Picture */}
                {booking.vendor?.documents?.profilePicture?.url ? (
                  <img
                    src={booking.vendor.documents.profilePicture.url}
                    alt="Vendor Avatar"
                    className="h-14 w-14 rounded-full border-2 border-[#0A84FF] object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full border-2 border-[#0A84FF] bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    {booking.vendor?.name ? (
                      <span className="text-lg font-bold text-[#0A84FF]">
                        {booking.vendor.name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-xl">👤</span>
                    )}
                  </div>
                )}

                {/* Vendor Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[#3A3A3A]">
                      {booking.service?.name || "Service"}
                    </h3>
                    {getStatusBadge(booking.userStatus || booking.status)}
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    Booking ID: {formatBookingId(booking._id)}
                  </p>
                </div>

                {/* Payment Amount */}
                <div className="text-right">
                  <p className="text-lg font-bold text-[#00C2A8]">
                    {formatAmount(
                      booking.payment?.totalAmount ||
                      booking.payment?.amount ||
                      0
                    )}
                  </p>
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
                  {/* Vendor Name */}
                  {booking.vendor?.name && (
                    <div className="flex items-center gap-2 text-[#6B7280]">
                      <IoPersonOutline className="text-[#00C2A8] text-xl" />
                      <span className="text-[#3A3A3A]">Vendor: {booking.vendor.name}</span>
                    </div>
                  )}

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
                onClick={() =>
                  navigate(`/user/booking/${booking._id}/status`)
                }
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

