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
    const {
        notifications,
        loading,
        userRole,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications
    } = useNotifications();

    const [filter, setFilter] = useState("all"); // 'all' | 'unread' | 'read'
    const [actionLoading, setActionLoading] = useState(false);

    const handleMarkAllRead = async () => {
        try {
            setActionLoading(true);
            await markAllAsRead();
            toast.showSuccess("All notifications marked as read");
        } catch (err) {
            toast.showError("Failed to mark all as read");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteNotification = async (id, e) => {
        e.stopPropagation();
        try {
            await deleteNotification(id);
            toast.showSuccess("Notification deleted");
        } catch (err) {
            toast.showError("Failed to delete notification");
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm("Are you sure you want to clear all notifications?")) return;
        try {
            setActionLoading(true);
            await clearAllNotifications();
            toast.showSuccess("All notifications cleared");
        } catch (err) {
            toast.showError("Failed to clear notifications");
        } finally {
            setActionLoading(false);
        }
    };

    const readCount = notifications.filter(n => n.isRead).length;
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const filteredNotifications = notifications.filter(n => {
        if (filter === "unread") return !n.isRead;
        if (filter === "read") return n.isRead;
        return true;
    });

    return (
        <PageContainer title="Notifications">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
                                <IoNotificationsOutline className="text-2xl text-white" />
                            </div>
                            <h1 className="text-2xl font-bold">Notification Center</h1>
                        </div>
                        <p className="text-blue-100 text-sm">
                            Stay updated on your booking status, report releases, disputes, and payments in real-time.
                        </p>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            disabled={actionLoading}
                            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 self-start md:self-auto shrink-0 cursor-pointer active:scale-95"
                        >
                            <IoCheckmarkDoneOutline className="text-base" />
                            <span>Mark All Read ({unreadCount})</span>
                        </button>
                    )}
                </div>

                {/* Filter & Action Toolbar */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 bg-white p-1.5 sm:p-2 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                                filter === "all"
                                    ? "bg-[#0A84FF] text-white shadow-sm"
                                    : "text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            All ({notifications.length})
                        </button>
                        <button
                            onClick={() => setFilter("unread")}
                            className={`px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                                filter === "unread"
                                    ? "bg-[#0A84FF] text-white shadow-sm"
                                    : "text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            Unread ({unreadCount})
                        </button>
                        <button
                            onClick={() => setFilter("read")}
                            className={`px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                                filter === "read"
                                    ? "bg-[#0A84FF] text-white shadow-sm"
                                    : "text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            Read ({readCount})
                        </button>
                    </div>

                    {notifications.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            disabled={actionLoading}
                            className="px-2.5 sm:px-3 py-1.5 text-red-600 hover:bg-red-50 font-bold text-[11px] sm:text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0 ml-auto"
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
                ) : filteredNotifications.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#0A84FF] text-2xl">
                            <IoNotificationsOutline />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">No Notifications</h3>
                        <p className="text-gray-500 text-sm max-w-md mx-auto">
                            {filter === "unread"
                                ? "You have no unread notifications."
                                : filter === "read"
                                ? "You have no read notifications."
                                : "You're all caught up!"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNotifications.map((notification) => {
                            const nId = notification.id || notification._id;
                            const dateStr = notification.createdAt
                                ? new Date(notification.createdAt).toLocaleString("en-IN", {
                                    dateStyle: "medium",
                                    timeStyle: "short"
                                })
                                : "";
                            const url = getNotificationUrl(notification, userRole);

                            const handleClick = async () => {
                              if (!notification.isRead && nId) {
                                await markAsRead(nId);
                              }
                              if (url) {
                                navigate(url);
                              }
                            };

                            return (
                                <div
                                    key={nId}
                                    onClick={handleClick}
                                    className={`p-4 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer group hover:shadow-md ${
                                        notification.isRead
                                            ? "bg-white border-gray-100 shadow-2xs hover:bg-gray-50/80"
                                            : "bg-blue-50/40 border-blue-200 shadow-sm hover:bg-blue-50/70"
                                    }`}
                                >
                                    <div className={`p-2.5 rounded-xl shrink-0 ${
                                        notification.isRead ? "bg-gray-100 text-gray-500" : "bg-[#0A84FF] text-white"
                                    }`}>
                                        <IoInformationCircleOutline className="text-xl" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {/* Title row — full width, wraps cleanly */}
                                        <div className="flex items-start justify-between gap-2 mb-0.5">
                                            <h4 className={`text-sm font-bold leading-snug min-w-0 ${notification.isRead ? "text-gray-800" : "text-gray-900"}`}>
                                                {notification.title || "Alert"}
                                            </h4>
                                        </div>
                                        {/* Timestamp — always on its own line, never overlaps title */}
                                        <span className="text-[11px] text-gray-400 font-medium block mb-1">
                                            {dateStr}
                                        </span>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            {notification.message}
                                        </p>
                                        <p className="text-[11px] text-[#0A84FF] font-bold mt-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                            View details →
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 self-center">
                                        {!notification.isRead && (
                                            <div className="w-2.5 h-2.5 bg-[#0A84FF] rounded-full"></div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteNotification(nId, e)}
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
