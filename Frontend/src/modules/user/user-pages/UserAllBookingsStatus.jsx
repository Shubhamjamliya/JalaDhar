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
import { useNotifications } from "../../../contexts/NotificationContext";
import PageContainer from "../../shared/components/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";

export default function UserAllBookingsStatus() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");

  const { socket } = useNotifications();

  useEffect(() => {
    loadAllBookings();
  }, []);

  // Real-time updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      // Refresh for status updates
      if (
        notification.type === "BOOKING_STATUS_UPDATED" ||
        notification.type === "BOOKING_ACCEPTED" ||
        notification.type === "BOOKING_VISITED" ||
        notification.type === "REPORT_UPLOADED" ||
        notification.type === "ADMIN_APPROVED" ||
        notification.type === "PAYMENT_RELEASE"
      ) {
        loadAllBookings();
      }
    };

    socket.on("new_notification", handleNewNotification);
    return () => socket.off("new_notification", handleNewNotification);
  }, [socket]);

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
        setBookings(allBookings);
      } else {
        setError(response.message || "Failed to load bookings");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBookings = () => {
    if (!bookings.length) return [];

    const ongoingStatuses = [
      "VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", 
      "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", 
      "ADMIN_APPROVED", "FINAL_SETTLEMENT"
    ];
    const completedStatuses = ["COMPLETED", "SUCCESS", "FINAL_SETTLEMENT_COMPLETE"];
    const cancelledStatuses = ["CANCELLED", "REJECTED", "FAILED"];

    switch (activeTab) {
      case "upcoming":
        return bookings.filter((booking) => {
          const status = booking.userStatus || booking.status;
          return !ongoingStatuses.includes(status) &&
            !completedStatuses.includes(status) &&
            !cancelledStatuses.includes(status);
        });
      case "ongoing":
        return bookings.filter((booking) => {
          const status = booking.userStatus || booking.status;
          return ongoingStatuses.includes(status);
        });
      case "complete":
      case "completed":
        return bookings.filter((booking) => {
          const status = booking.userStatus || booking.status;
          return completedStatuses.includes(status);
        });
      case "cancelled":
        return bookings.filter((booking) => {
          const status = booking.userStatus || booking.status;
          return cancelledStatuses.includes(status);
        });
      default:
        return bookings;
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

    const timeDisplay = (!timeString || timeString === "TBD") ? "Time TBD" : timeString;

    if (isToday) {
      return `Today, ${timeDisplay}`;
    } else if (isTomorrow) {
      return `Tomorrow, ${timeDisplay}`;
    } else {
      return `${formattedDate}, ${timeDisplay}`;
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
      AWAITING_ADVANCE: { color: "bg-amber-100 text-amber-800", label: "Awaiting Advance Payment" },
      PENDING: { color: "bg-yellow-100 text-yellow-800", label: "Expert Assignment in Progress" },
      ASSIGNED: { color: "bg-blue-100 text-blue-800", label: "Expert Assigned" },
      ACCEPTED: { color: "bg-indigo-100 text-indigo-800", label: "Survey Scheduled" },
      EN_ROUTE: { color: "bg-sky-100 text-sky-800", label: "Expert En Route" },
      VISITED: { color: "bg-purple-100 text-purple-800", label: "Survey in Progress" },
      IN_PROGRESS: { color: "bg-purple-100 text-purple-800", label: "Survey in Progress" },
      REPORT_UPLOADED: { color: "bg-emerald-100 text-emerald-800", label: "Survey Completed" },
      AWAITING_PAYMENT: { color: "bg-orange-100 text-orange-800", label: "Awaiting Final Payment" },
      PAYMENT_SUCCESS: { color: "bg-emerald-100 text-emerald-800", label: "Report Ready" },
      PAID_FIRST: { color: "bg-emerald-100 text-emerald-800", label: "Report Ready" },
      BOREWELL_UPLOADED: { color: "bg-teal-100 text-teal-800", label: "Report Ready" },
      ADMIN_APPROVED: { color: "bg-green-100 text-green-800", label: "Booking Completed" },
      FINAL_SETTLEMENT: { color: "bg-green-100 text-green-800", label: "Booking Completed" },
      COMPLETED: { color: "bg-green-100 text-green-800", label: "Booking Completed" },
      CANCELLED: { color: "bg-gray-100 text-gray-700", label: "Booking Cancelled" },
      REJECTED: { color: "bg-red-100 text-red-800", label: "Booking Rejected" },
      FAILED: { color: "bg-red-100 text-red-800", label: "Booking Failed" },
    };
    const config =
      statusConfig[status] || { color: "bg-gray-100 text-gray-700", label: status ? status.replace(/_/g, ' ') : status };
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

  const filteredBookings = getFilteredBookings();

  return (
    <PageContainer>
      <ErrorMessage message={error} />

      {/* Heading */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Bookings
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track and manage your groundwater survey requests
          </p>
        </div>
        {filteredBookings.length > 0 && (
          <span className="px-2.5 py-1 bg-blue-50 text-[#0A84FF] border border-blue-100 text-[11px] font-extrabold rounded-full font-mono whitespace-nowrap flex-shrink-0 self-start mt-0.5">
            {filteredBookings.length} {filteredBookings.length === 1 ? 'Booking' : 'Bookings'}
          </span>
        )}
      </div>

      {/* Responsive Horizontal Scrollable Tabs */}
      <div className="mb-4 flex gap-1 border-b border-slate-200 overflow-x-auto no-scrollbar pb-0.5">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-3.5 py-2 font-bold text-xs sm:text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${activeTab === "upcoming"
            ? "text-[#0A84FF] border-[#0A84FF]"
            : "text-slate-500 border-transparent hover:text-slate-800"
            }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab("ongoing")}
          className={`px-3.5 py-2 font-bold text-xs sm:text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${activeTab === "ongoing"
            ? "text-[#0A84FF] border-[#0A84FF]"
            : "text-slate-500 border-transparent hover:text-slate-800"
            }`}
        >
          Ongoing
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`px-3.5 py-2 font-bold text-xs sm:text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${activeTab === "completed" || activeTab === "complete"
            ? "text-[#0A84FF] border-[#0A84FF]"
            : "text-slate-500 border-transparent hover:text-slate-800"
            }`}
        >
          Completed
        </button>
        <button
          onClick={() => setActiveTab("cancelled")}
          className={`px-3.5 py-2 font-bold text-xs sm:text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${activeTab === "cancelled"
            ? "text-[#0A84FF] border-[#0A84FF]"
            : "text-slate-500 border-transparent hover:text-slate-800"
            }`}
        >
          Cancelled
        </button>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center border border-slate-200/80 shadow-2xs">
            <div className="mb-3 w-12 h-12 rounded-full bg-blue-50 text-[#0A84FF] border border-blue-100 flex items-center justify-center mx-auto">
              <IoCalendarOutline className="text-2xl" />
            </div>
            <p className="text-slate-900 font-bold text-sm mb-1">
              {activeTab === "upcoming" && "No Upcoming Bookings"}
              {activeTab === "ongoing" && "No Ongoing Bookings"}
              {(activeTab === "completed" || activeTab === "complete") && "No Completed Bookings"}
              {activeTab === "cancelled" && "No Cancelled Bookings"}
            </p>
            <p className="text-slate-500 text-xs">
              {activeTab === "upcoming" && "You don't have any upcoming bookings."}
              {activeTab === "ongoing" && "You don't have any in-progress bookings."}
              {(activeTab === "completed" || activeTab === "complete") && "You don't have any completed bookings yet."}
              {activeTab === "cancelled" && "You don't have any cancelled bookings."}
            </p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div
              key={booking._id}
              onClick={() => navigate(`/user/booking/${booking._id}`)}
              className="rounded-2xl bg-white p-3.5 sm:p-4 shadow-2xs border border-slate-200/80 cursor-pointer hover:border-blue-200 transition-all space-y-3"
            >
              {/* Header Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {booking.vendor?.profilePicture ? (
                    <img
                      src={booking.vendor.profilePicture}
                      alt="Vendor Avatar"
                      className="h-10 w-10 rounded-full border border-slate-200 object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full border border-blue-100 bg-blue-50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#0A84FF]">
                      {booking.vendor?.name ? (
                        booking.vendor.name.charAt(0).toUpperCase()
                      ) : (
                        "E"
                      )}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                      {booking.service?.name || "Hydrogeological Groundwater Survey"}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {formatBookingId(booking._id)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm sm:text-base font-extrabold text-emerald-600 font-mono">
                    {formatAmount(
                      booking.payment?.totalAmount ||
                      booking.payment?.amount ||
                      0
                    )}
                  </p>
                </div>
              </div>

              {/* Status Badge Line */}
              <div className="flex items-center">
                {getStatusBadge(booking.userStatus || booking.status)}
              </div>

              {/* Service Details Box */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                {booking.vendor?.name && (
                  <div className="flex items-center gap-2 text-slate-600 text-[11px] font-medium">
                    <IoPersonOutline className="text-[#0A84FF] text-sm flex-shrink-0" />
                    <span className="truncate"><strong className="text-slate-900">Vendor:</strong> {booking.vendor.name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-slate-600 text-[11px] font-medium">
                  <IoTimeOutline className="text-[#0A84FF] text-sm flex-shrink-0" />
                  <span>
                    {formatDate(
                      booking.scheduledDate,
                      booking.scheduledTime
                    )}
                  </span>
                </div>

                <div className="flex items-start gap-2 text-slate-600 text-[11px] leading-relaxed">
                  <IoLocationOutline className="text-[#0A84FF] text-sm flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">
                    {formatAddress(booking.address)}
                  </span>
                </div>
              </div>

              {/* View Status Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/user/booking/${booking._id}/status`);
                }}
                className="w-full py-2 px-3 bg-[#0A84FF] hover:bg-[#0070E0] text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <IoDocumentTextOutline className="text-sm" />
                <span>View Status Timeline</span>
              </button>
            </div>
          ))
        )}
      </div>
    </PageContainer>
  );
}

