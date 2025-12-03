import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    IoChevronBackOutline,
    IoMenuOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoConstructOutline,
    IoCalendarOutline,
} from "react-icons/io5";
import { getVendorBookings } from "../../../services/vendorApi";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";

export default function VendorBookings() {
    const navigate = useNavigate();
    const location = useLocation();
    const { vendor } = useVendorAuth();
    const [activeTab, setActiveTab] = useState("New");
    const [newBookings, setNewBookings] = useState([]);
    const [confirmedBookings, setConfirmedBookings] = useState([]);
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

    const loadAllBookings = async () => {
        try {
            setLoading(true);

            // Load all three types in parallel
            const [newResponse, confirmedResponse, historyResponse] = await Promise.all([
                getVendorBookings({ status: "ASSIGNED", limit: 50 }),
                getVendorBookings({ status: "ACCEPTED", limit: 50 }),
                getVendorBookings({ status: "COMPLETED", limit: 100, sortBy: "completedAt", sortOrder: "desc" })
            ]);

            if (newResponse.success) {
                setNewBookings(newResponse.data.bookings || []);
            }
            if (confirmedResponse.success) {
                setConfirmedBookings(confirmedResponse.data.bookings || []);
            }
            if (historyResponse.success) {
                setHistoryBookings(historyResponse.data.bookings || []);
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

    const getPaymentMethod = (payment) => {
        if (!payment) return "Pay on Delivery";
        if (payment.advancePaid) {
            return payment.remainingPaid ? "Online Payment" : "Partially Paid";
        }
        return "Pay on Delivery";
    };

    const getCurrentBookings = () => {
        switch (activeTab) {
            case "New":
                return newBookings;
            case "Confirmed":
                return confirmedBookings;
            case "History":
                return historyBookings;
            default:
                return [];
        }
    };

    const handleViewDetails = (bookingId) => {
        navigate(`/vendor/bookings/${bookingId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 flex items-center justify-center">
                <LoadingSpinner message="Loading bookings..." />
            </div>
        );
    }

    const currentBookings = getCurrentBookings();

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">

            

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-b-[12px] mb-4 overflow-hidden">
                <button
                    onClick={() => setActiveTab("New")}
                    className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${
                        activeTab === "New"
                            ? "bg-[#0A84FF] text-white"
                            : "bg-gray-100 text-gray-700"
                    }`}
                >
                    New ({newBookings.length})
                </button>
                <button
                    onClick={() => setActiveTab("Confirmed")}
                    className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${
                        activeTab === "Confirmed"
                            ? "bg-[#0A84FF] text-white"
                            : "bg-gray-100 text-gray-700"
                    }`}
                >
                    Confirmed
                </button>
                <button
                    onClick={() => setActiveTab("History")}
                    className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${
                        activeTab === "History"
                            ? "bg-[#0A84FF] text-white"
                            : "bg-gray-100 text-gray-700"
                    }`}
                >
                    History
                </button>
            </div>

            {/* Booking Cards */}
            <div className="space-y-4">
                {currentBookings.length === 0 ? (
                    <div className="bg-white rounded-[12px] p-8 text-center shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <p className="text-[#4A4A4A]">No {activeTab.toLowerCase()} bookings available</p>
                    </div>
                ) : (
                    currentBookings.map((booking) => (
                        <div
                            key={booking._id}
                            className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                        >
                            {/* Customer Info Header */}
                            <div className="flex items-start gap-4 mb-4">
                                {/* Profile Picture */}
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 border-2 border-blue-200">
                                    {booking.user?.name ? (
                                        <span className="text-lg font-bold text-blue-600">
                                            {booking.user.name.charAt(0).toUpperCase()}
                                        </span>
                                    ) : (
                                        <span className="text-xl">👤</span>
                                    )}
                                </div>

                                {/* Customer Details */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold text-gray-800 mb-1">
                                        {booking.user?.name || "Customer"}
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Booking ID: {formatBookingId(booking._id)}
                                    </p>
                                </div>

                                {/* Payment Amount */}
                                <div className="text-right flex-shrink-0">
                                    <p className="text-lg font-bold text-green-600 mb-1">
                                        {formatAmount(booking.payment?.totalAmount || booking.payment?.amount || 0)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {getPaymentMethod(booking.payment)}
                                    </p>
                                </div>
                            </div>

                            {/* Service Details */}
                            <div className="mb-4">
                                <h4 className="text-sm font-bold text-gray-800 mb-3">Service Details</h4>
                                <div className="space-y-2">
                                    {/* Service Name */}
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <IoConstructOutline className="text-base text-gray-500" />
                                        <span>
                                            {booking.service?.name || "Service"}
                                            {booking.service?.machineType && ` (${booking.service.machineType})`}
                                        </span>
                                    </div>

                                    {/* Date and Time */}
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <IoCalendarOutline className="text-base text-gray-500" />
                                        <span>
                                            {formatDate(booking.scheduledDate, booking.scheduledTime)}
                                        </span>
                                    </div>

                                    {/* Address */}
                                    <div className="flex items-start gap-2 text-sm text-gray-700">
                                        <IoLocationOutline className="text-base text-gray-500 mt-0.5" />
                                        <span className="flex-1">
                                            {formatAddress(booking.address)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
