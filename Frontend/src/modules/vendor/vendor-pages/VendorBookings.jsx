import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    IoTimeOutline,
    IoLocationOutline,
    IoConstructOutline,
    IoCalendarOutline,
    IoEyeOutline,
    IoChevronForwardOutline,
} from "react-icons/io5";
import { getVendorBookings } from "../../../services/vendorApi";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";

export default function VendorBookings() {
    const navigate = useNavigate();
    const location = useLocation();
    const { vendor } = useVendorAuth();
    const { socket } = useNotifications();
    const [activeTab, setActiveTab] = useState("New");
    const [newBookings, setNewBookings] = useState([]);
    const [activeBookings, setActiveBookings] = useState([]);
    const [historyBookings, setHistoryBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    // Load data on mount and when location changes (navigation back)
    useEffect(() => {
        loadAllBookings();
    }, [location.pathname]);

    // Refetch when page becomes visible (user switches tabs/windows)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadAllBookings();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Listen for real-time notifications via Socket.IO
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification) => {
            console.log('[VendorBookings] New notification received:', notification);

            // Auto-refresh bookings for any booking-related notification
            if (notification.type === 'BOOKING_CREATED' ||
                notification.type === 'BOOKING_ASSIGNED' ||
                notification.type === 'BOOKING_STATUS_UPDATED' ||
                notification.type === 'PAYMENT_RECEIVED' ||
                notification.type === 'NEW_BOOKING' ||
                notification.type === 'BOOKING_ACCEPTED' ||
                notification.type === 'BOOKING_REJECTED' ||
                notification.type === 'BOOKING_CANCELLED') {
                console.log('[VendorBookings] Refreshing bookings list...');
                loadAllBookings();
            }
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket]);

    const loadAllBookings = async () => {
        try {
            setLoading(true);

            // Load all bookings at once, then categorize on the frontend
            const allResponse = await getVendorBookings({ limit: 200, sortBy: "createdAt", sortOrder: "desc" });

            if (allResponse.success) {
                const bookings = allResponse.data.bookings || [];

                // New: ASSIGNED, PENDING (waiting for vendor action)
                const newList = bookings.filter(b =>
                    ["ASSIGNED", "PENDING"].includes(b.status)
                );

                // Active: All in-progress statuses (vendor has accepted, work ongoing)
                const activeList = bookings.filter(b =>
                    ["ACCEPTED", "VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "APPROVED", "FINAL_SETTLEMENT", "FINAL_SETTLEMENT_COMPLETE", "AWAITING_ADVANCE"].includes(b.status)
                );

                // History: Terminal statuses
                const historyList = bookings.filter(b =>
                    ["COMPLETED", "CANCELLED", "REJECTED", "SUCCESS", "FAILED"].includes(b.status)
                );

                setNewBookings(newList);
                setActiveBookings(activeList);
                setHistoryBookings(historyList);
            }
        } catch (err) {
            handleApiError(err, "Failed to load bookings");
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
        return parts.join(", ") || "N/A";
    };

    const formatBookingId = (id) => {
        if (!id) return "#JALA0000";
        const shortId = id.toString().slice(-4).toUpperCase();
        return `#JALA${shortId}`;
    };

    const formatAmount = (amount) => {
        if (!amount) return "₹0";
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    const getStatusConfig = (status) => {
        const configs = {
            ASSIGNED: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "New Request", dot: "bg-yellow-500" },
            PENDING: { color: "bg-orange-100 text-orange-700 border-orange-200", label: "Pending", dot: "bg-orange-500" },
            ACCEPTED: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Accepted", dot: "bg-blue-500" },
            VISITED: { color: "bg-purple-100 text-purple-700 border-purple-200", label: "Visited", dot: "bg-purple-500" },
            REPORT_UPLOADED: { color: "bg-indigo-100 text-indigo-700 border-indigo-200", label: "Report Uploaded", dot: "bg-indigo-500" },
            AWAITING_PAYMENT: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Awaiting Payment", dot: "bg-amber-500" },
            AWAITING_ADVANCE: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Awaiting Advance", dot: "bg-amber-500" },
            PAYMENT_SUCCESS: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Payment Done", dot: "bg-emerald-500" },
            PAID_FIRST: { color: "bg-teal-100 text-teal-700 border-teal-200", label: "First Payment", dot: "bg-teal-500" },
            BOREWELL_UPLOADED: { color: "bg-cyan-100 text-cyan-700 border-cyan-200", label: "Borewell Result", dot: "bg-cyan-500" },
            ADMIN_APPROVED: { color: "bg-sky-100 text-sky-700 border-sky-200", label: "Admin Approved", dot: "bg-sky-500" },
            APPROVED: { color: "bg-sky-100 text-sky-700 border-sky-200", label: "Approved", dot: "bg-sky-500" },
            FINAL_SETTLEMENT: { color: "bg-violet-100 text-violet-700 border-violet-200", label: "Settlement", dot: "bg-violet-500" },
            FINAL_SETTLEMENT_COMPLETE: { color: "bg-green-100 text-green-700 border-green-200", label: "Settled", dot: "bg-green-500" },
            COMPLETED: { color: "bg-green-100 text-green-700 border-green-200", label: "Completed", dot: "bg-green-500" },
            CANCELLED: { color: "bg-gray-100 text-gray-600 border-gray-200", label: "Cancelled", dot: "bg-gray-400" },
            REJECTED: { color: "bg-red-100 text-red-700 border-red-200", label: "Rejected", dot: "bg-red-500" },
        };
        return configs[status] || { color: "bg-gray-100 text-gray-600 border-gray-200", label: status, dot: "bg-gray-400" };
    };

    // Progress percentage for visual indicator
    const getProgressPercent = (status) => {
        const progressMap = {
            ASSIGNED: 10, PENDING: 10,
            ACCEPTED: 25,
            VISITED: 40,
            REPORT_UPLOADED: 55,
            AWAITING_PAYMENT: 65, AWAITING_ADVANCE: 65,
            PAYMENT_SUCCESS: 75, PAID_FIRST: 75,
            BOREWELL_UPLOADED: 80,
            ADMIN_APPROVED: 85, APPROVED: 85,
            FINAL_SETTLEMENT: 90, FINAL_SETTLEMENT_COMPLETE: 95,
            COMPLETED: 100,
            CANCELLED: 100, REJECTED: 100,
        };
        return progressMap[status] || 0;
    };

    const getProgressColor = (status) => {
        if (["COMPLETED", "SUCCESS"].includes(status)) return "bg-green-500";
        if (["CANCELLED", "REJECTED", "FAILED"].includes(status)) return "bg-red-400";
        return "bg-[#0A84FF]";
    };

    const getCurrentBookings = () => {
        switch (activeTab) {
            case "New":
                return newBookings;
            case "Active":
                return activeBookings;
            case "History":
                return historyBookings;
            default:
                return [];
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 flex items-center justify-center">
                <LoadingSpinner message="Loading bookings..." />
            </div>
        );
    }

    const currentBookings = getCurrentBookings();
    const tabs = [
        { key: "New", label: "New", count: newBookings.length, icon: "🔔" },
        { key: "Active", label: "Active", count: activeBookings.length, icon: "⚡" },
        { key: "History", label: "History", count: historyBookings.length, icon: "📋" },
    ];

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">

            {/* Header */}
            <div className="mb-4">
                <h1 className="text-xl font-bold text-gray-800">My Bookings</h1>
                <p className="text-sm text-gray-500 mt-0.5">Manage all your service bookings</p>
            </div>

            {/* Tabs */}
            <div className="flex bg-white rounded-[12px] mb-5 p-1 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 py-2.5 px-3 text-sm font-semibold rounded-[10px] transition-all flex items-center justify-center gap-1.5 ${activeTab === tab.key
                            ? "bg-[#0A84FF] text-white shadow-[0_2px_8px_rgba(10,132,255,0.3)]"
                            : "text-gray-600 hover:bg-gray-50"
                            }`}
                    >
                        <span className="text-xs">{tab.icon}</span>
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full font-bold ${activeTab === tab.key
                                ? "bg-white/25 text-white"
                                : "bg-gray-200 text-gray-600"
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Booking Cards */}
            <div className="space-y-4">
                {currentBookings.length === 0 ? (
                    <div className="bg-white rounded-[16px] p-10 text-center shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <IoCalendarOutline className="text-3xl text-gray-400" />
                        </div>
                        <p className="text-base font-semibold text-gray-700 mb-1">
                            No {activeTab.toLowerCase()} bookings
                        </p>
                        <p className="text-sm text-gray-500">
                            {activeTab === "New"
                                ? "No new booking requests at the moment."
                                : activeTab === "Active"
                                    ? "No in-progress bookings right now."
                                    : "No completed bookings yet."}
                        </p>
                    </div>
                ) : (
                    currentBookings.map((booking) => {
                        const statusConfig = getStatusConfig(booking.status);
                        const progress = getProgressPercent(booking.status);

                        return (
                            <div
                                key={booking._id}
                                className="bg-white rounded-[16px] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] transition-shadow cursor-pointer"
                                onClick={() => navigate(`/vendor/bookings/${booking._id}`)}
                            >
                                {/* Progress Bar at Top */}
                                <div className="h-1 bg-gray-100">
                                    <div
                                        className={`h-full rounded-r-full transition-all ${getProgressColor(booking.status)}`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                <div className="p-5">
                                    {/* Top Row: Customer + Status Badge */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {/* Profile Circle */}
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BBDEFB] to-[#90CAF9] flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm">
                                                {booking.user?.name ? (
                                                    <span className="text-base font-bold text-[#1565C0]">
                                                        {booking.user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                ) : (
                                                    <span className="text-lg">👤</span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-gray-800 leading-tight">
                                                    {booking.user?.name || "Customer"}
                                                </h3>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {formatBookingId(booking._id)}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Status Badge */}
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusConfig.color} flex items-center gap-1`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
                                            {statusConfig.label}
                                        </span>
                                    </div>

                                    {/* Service & Schedule Info */}
                                    <div className="bg-gray-50 rounded-[10px] p-3 mb-3 space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <IoConstructOutline className="text-base text-[#0A84FF] flex-shrink-0" />
                                            <span className="font-medium">
                                                {booking.service?.name || "Service"}
                                                {booking.service?.machineType && ` (${booking.service.machineType})`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <IoCalendarOutline className="text-base text-gray-400 flex-shrink-0" />
                                            <span>
                                                {formatDate(booking.scheduledDate, booking.scheduledTime)}
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2 text-sm text-gray-600">
                                            <IoLocationOutline className="text-base text-gray-400 flex-shrink-0 mt-0.5" />
                                            <span className="line-clamp-1">
                                                {formatAddress(booking.address)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bottom Row: Amount + View Details */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-lg font-bold text-gray-800">
                                                {formatAmount(booking.payment?.totalAmount || booking.payment?.amount || 0)}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                {booking.payment?.advancePaid
                                                    ? (booking.payment?.remainingPaid ? "Fully Paid" : "Advance Paid")
                                                    : "Payment Pending"}
                                            </p>
                                        </div>
                                        <button
                                            className="flex items-center gap-1 text-sm font-semibold text-[#0A84FF] hover:text-[#005BBB] transition-colors bg-blue-50 px-3 py-2 rounded-[8px]"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/vendor/bookings/${booking._id}`);
                                            }}
                                        >
                                            <IoEyeOutline className="text-base" />
                                            View
                                            <IoChevronForwardOutline className="text-xs" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
