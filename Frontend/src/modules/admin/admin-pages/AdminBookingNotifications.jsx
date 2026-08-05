import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoNotificationsOutline,
  IoCheckmarkDoneOutline,
  IoTrashOutline,
  IoInformationCircleOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoDocumentTextOutline,
  IoCashOutline,
  IoCarOutline,
  IoPersonAddOutline,
  IoRefreshOutline,
  IoChevronForwardOutline,
  IoEllipseOutline,
} from "react-icons/io5";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../../../services/notificationApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";

const NOTIFICATION_TYPE_CONFIG = {
  REPORT_UPLOADED: {
    icon: IoDocumentTextOutline,
    color: "bg-purple-50 text-purple-600",
    badge: "bg-purple-100 text-purple-700",
    label: "Report Upload",
    actionLabel: "Review Report",
    actionPath: (meta) => `/admin/approvals`,
  },
  PAYMENT_RECEIVED: {
    icon: IoCashOutline,
    color: "bg-emerald-50 text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
    label: "Payment",
    actionPath: (meta) => meta?.bookingId ? `/admin/bookings/${meta.bookingId}` : `/admin/payments`,
  },
  PAYMENT_SUCCESS: {
    icon: IoCashOutline,
    color: "bg-emerald-50 text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
    label: "Payment",
    actionPath: (meta) => meta?.bookingId ? `/admin/bookings/${meta.bookingId}` : `/admin/payments`,
  },
  BOOKING_CREATED: {
    icon: IoNotificationsOutline,
    color: "bg-blue-50 text-blue-600",
    badge: "bg-blue-100 text-blue-700",
    label: "New Booking",
    actionPath: (meta) => meta?.bookingId ? `/admin/bookings/${meta.bookingId}` : `/admin/bookings`,
  },
  BOOKING_CANCELLED: {
    icon: IoAlertCircleOutline,
    color: "bg-red-50 text-red-600",
    badge: "bg-red-100 text-red-700",
    label: "Cancelled",
    actionPath: (meta) => meta?.bookingId ? `/admin/bookings/${meta.bookingId}` : `/admin/bookings`,
  },
  BOOKING_REJECTED: {
    icon: IoAlertCircleOutline,
    color: "bg-red-50 text-red-600",
    badge: "bg-red-100 text-red-700",
    label: "Rejected",
    actionPath: (meta) => meta?.bookingId ? `/admin/bookings/${meta.bookingId}` : `/admin/bookings`,
  },
  VENDOR_REGISTERED: {
    icon: IoPersonAddOutline,
    color: "bg-indigo-50 text-indigo-600",
    badge: "bg-indigo-100 text-indigo-700",
    label: "Vendor",
    actionPath: (meta) => meta?.vendorId ? `/admin/vendors/${meta.vendorId}` : `/admin/vendors`,
  },
  BOREWELL_UPLOADED: {
    icon: IoCarOutline,
    color: "bg-amber-50 text-amber-600",
    badge: "bg-amber-100 text-amber-700",
    label: "Borewell",
    actionLabel: "Review Borewell",
    actionPath: (meta) => `/admin/approvals`,
  },
  FINAL_SETTLEMENT_PROCESSED: {
    icon: IoCashOutline,
    color: "bg-teal-50 text-teal-600",
    badge: "bg-teal-100 text-teal-700",
    label: "Settlement",
    actionPath: (meta) => meta?.bookingId ? `/admin/bookings/${meta.bookingId}` : `/admin/payments`,
  },
  REPORT_APPROVED: {
    icon: IoCheckmarkCircleOutline,
    color: "bg-green-50 text-green-600",
    badge: "bg-green-100 text-green-700",
    label: "Approved",
    actionPath: (meta) => meta?.bookingId ? `/admin/bookings/${meta.bookingId}` : `/admin/approvals`,
  },
};

const DEFAULT_CONFIG = {
  icon: IoInformationCircleOutline,
  color: "bg-gray-50 text-gray-500",
  badge: "bg-gray-100 text-gray-600",
  label: "Update",
  actionPath: () => `/admin/bookings`,
};

function getConfig(type) {
  return NOTIFICATION_TYPE_CONFIG[type] || DEFAULT_CONFIG;
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function AdminBookingNotifications() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const loadNotifications = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      const params = { page: pageNum, limit: 20 };
      if (filter === "unread") params.isRead = false;
      const res = await getNotifications(params);
      if (res.success) {
        const incoming = res.data?.notifications || [];
        setNotifications((prev) => append ? [...prev, ...incoming] : incoming);
        setTotalCount(res.data?.pagination?.total || incoming.length);
        setHasMore(
          res.data?.pagination
            ? pageNum < res.data.pagination.totalPages
            : false
        );
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setPage(1);
    loadNotifications(1, false);
  }, [filter]);

  const handleMarkRead = async (notifId) => {
    try {
      await markAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => n._id === notifId ? { ...n, isRead: true } : n)
      );
    } catch {
      toast.showError("Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.showSuccess("All notifications marked as read");
    } catch {
      toast.showError("Failed to mark all as read");
    }
  };

  const handleDelete = async (notifId) => {
    try {
      await deleteNotification(notifId);
      setNotifications((prev) => prev.filter((n) => n._id !== notifId));
    } catch {
      toast.showError("Failed to delete notification");
    }
  };

  const handleNavigate = (notif) => {
    const config = getConfig(notif.type);
    const path = config.actionPath(notif.metadata || {});
    if (!notif.isRead) handleMarkRead(notif._id);
    navigate(path);
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadNotifications(next, true);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const FILTER_TABS = [
    { id: "all", label: "All" },
    { id: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    { id: "REPORT_UPLOADED", label: "Reports" },
    { id: "BOREWELL_UPLOADED", label: "Borewell" },
    { id: "PAYMENT_RECEIVED", label: "Payments" },
    { id: "BOOKING_CREATED", label: "Bookings" },
    { id: "VENDOR_REGISTERED", label: "Vendors" },
  ];

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    return n.type === filter;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-gray-900">
            Booking Alerts
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {totalCount} total notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadNotifications(1, false)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-600 rounded-2xl text-xs font-bold hover:bg-gray-100 transition-all"
          >
            <IoRefreshOutline className="text-lg" />
            Refresh
          </button>
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-2xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all"
          >
            <IoCheckmarkDoneOutline className="text-lg" />
            Mark All Read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
              filter === tab.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {loading ? (
        <LoadingSpinner message="Loading notifications..." />
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-gray-100">
          <IoNotificationsOutline className="text-5xl text-gray-200 mb-4" />
          <p className="text-gray-400 font-medium">No notifications in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const config = getConfig(n.type);
            const Icon = config.icon;
            return (
              <div
                key={n._id}
                className={`bg-white p-4 rounded-2xl border shadow-sm flex items-start gap-4 transition-all group ${
                  !n.isRead ? "ring-1 ring-blue-400/30 border-blue-100" : "border-gray-100"
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${config.color}`}
                >
                  <Icon />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-bold text-sm ${!n.isRead ? "text-gray-900" : "text-gray-700"}`}>
                        {n.title}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.badge}`}>
                        {config.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-400 whitespace-nowrap shrink-0">
                      {formatTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {n.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n._id)}
                      className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Mark as read"
                    >
                      <IoEllipseOutline className="text-lg" />
                    </button>
                  )}
                  <button
                    onClick={() => handleNavigate(n)}
                    className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    title="View Details"
                  >
                    <IoChevronForwardOutline className="text-lg" />
                  </button>
                  <button
                    onClick={() => handleDelete(n._id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete"
                  >
                    <IoTrashOutline className="text-lg" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Load More */}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              className="w-full py-3 text-sm font-bold text-blue-600 bg-white rounded-2xl border border-blue-100 hover:bg-blue-50 transition-all"
            >
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
}
