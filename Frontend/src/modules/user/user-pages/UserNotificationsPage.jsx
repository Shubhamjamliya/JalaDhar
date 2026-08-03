import { useState, useEffect } from "react";
import {
    IoNotificationsOutline,
    IoCheckmarkDoneOutline,
    IoTimeOutline,
    IoAlertCircleOutline,
    IoCheckmarkCircleOutline,
    IoInformationCircleOutline,
    IoTrashOutline
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } from "../../../services/notificationApi";
import PageContainer from "../../shared/components/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import { useToast } from "../../../hooks/useToast";
import { useNotifications } from "../../../contexts/NotificationContext";
import { getNotificationUrl } from "../../../utils/notificationUtils";

export default function UserNotificationsPage() {
    const toast = useToast();
    const navigate = useNavigate();
    const { userRole } = useNotifications();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState("all"); // 'all' | 'unread'
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getNotifications({ limit: 50 });
            if (response.success) {
                setNotifications(response.data.notifications || []);
            } else {
                setError(response.message || "Failed to load notifications");
            }
        } catch (err) {
            console.error("Load notifications error:", err);
            setError("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            const response = await markAsRead(id);
            if (response.success) {
                setNotifications(prev =>
                    prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
                );
            }
        } catch (err) {
            console.error("Mark read error:", err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            setActionLoading(true);
            const response = await markAllAsRead();
            if (response.success) {
                toast.showSuccess("All notifications marked as read");
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            }
        } catch (err) {
            toast.showError("Failed to mark all as read");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteNotification = async (id, e) => {
        e.stopPropagation();
        try {
            const response = await deleteNotification(id);
            if (response.success) {
                toast.showSuccess("Notification deleted");
                setNotifications(prev => prev.filter(n => n._id !== id));
            }
        } catch (err) {
            toast.showError("Failed to delete notification");
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm("Are you sure you want to clear all notifications?")) return;
        try {
            setActionLoading(true);
            const response = await clearAllNotifications();
            if (response.success) {
                toast.showSuccess("All notifications cleared");
                setNotifications([]);
            }
        } catch (err) {
            toast.showError("Failed to clear notifications");
        } finally {
            setActionLoading(false);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === "unread") return !n.isRead;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <PageContainer title="Notifications">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
                                <IoNotificationsOutline className="text-2xl text-white" />
                            </div>
                            <h1 className="text-2xl font-bold">Notification Center</h1>
                        </div>
                        <p className="text-amber-100 text-sm">
                            Stay updated on your booking status, assigned hydrogeologists, report releases, and payments.
                        </p>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            disabled={actionLoading}
                            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 self-start md:self-auto shrink-0"
                        >
                            <IoCheckmarkDoneOutline className="text-base" />
                            <span>Mark All Read ({unreadCount})</span>
                        </button>
                    )}
                </div>

                {/* Filter & Action Toolbar */}
                <div className="flex items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                filter === "all"
                                    ? "bg-amber-500 text-white shadow-sm"
                                    : "text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            All ({notifications.length})
                        </button>
                        <button
                            onClick={() => setFilter("unread")}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                filter === "unread"
                                    ? "bg-amber-500 text-white shadow-sm"
                                    : "text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            Unread ({unreadCount})
                        </button>
                    </div>

                    {notifications.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                        >
                            <IoTrashOutline className="text-sm" />
                            <span>Clear All</span>
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="py-20 flex justify-center">
                        <LoadingSpinner message="Loading notifications..." />
                    </div>
                ) : error ? (
                    <ErrorMessage message={error} />
                ) : filteredNotifications.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500 text-2xl">
                            <IoNotificationsOutline />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">No Notifications</h3>
                        <p className="text-gray-500 text-sm max-w-md mx-auto">
                            {filter === "unread" ? "You have no unread notifications." : "You're all caught up!"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNotifications.map((notification) => {
                            const dateStr = notification.createdAt
                                ? new Date(notification.createdAt).toLocaleString("en-IN", {
                                    dateStyle: "medium",
                                    timeStyle: "short"
                                })
                                : "";
                            const url = getNotificationUrl(notification, userRole);

                            const handleClick = async () => {
                              if (!notification.isRead) {
                                await handleMarkAsRead(notification._id);
                              }
                              if (url) {
                                navigate(url);
                              }
                            };

                            return (
                                <div
                                    key={notification._id}
                                    onClick={handleClick}
                                    className={`p-4 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer group hover:shadow-md ${
                                        notification.isRead
                                            ? "bg-white border-gray-100 shadow-2xs hover:bg-gray-50/80"
                                            : "bg-amber-50/50 border-amber-200 shadow-sm hover:bg-amber-100/50"
                                    }`}
                                >
                                    <div className={`p-2.5 rounded-xl shrink-0 ${
                                        notification.isRead ? "bg-gray-100 text-gray-500" : "bg-amber-500 text-white"
                                    }`}>
                                        <IoInformationCircleOutline className="text-xl" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <h4 className={`text-sm font-bold ${notification.isRead ? "text-gray-800" : "text-gray-900"}`}>
                                                {notification.title || "Booking Alert"}
                                            </h4>
                                            <span className="text-[11px] text-gray-400 font-medium shrink-0">
                                                {dateStr}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            {notification.message}
                                        </p>
                                        <p className="text-[11px] text-amber-600 font-bold mt-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                            View details →
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 self-center">
                                        {!notification.isRead && (
                                            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteNotification(notification._id, e)}
                                            title="Delete notification"
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-80 group-hover:opacity-100"
                                        >
                                            <IoTrashOutline className="text-lg" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </PageContainer>
    );
}
