import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoChevronBackOutline,
    IoMenuOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoConstructOutline,
    IoCalendarOutline,
} from "react-icons/io5";
import { getVendorBookings, acceptBooking, rejectBooking } from "../../../services/vendorApi";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import SuccessMessage from "../../shared/components/SuccessMessage";

export default function VendorRequests() {
    const navigate = useNavigate();
    const { vendor } = useVendorAuth();
    const [activeTab, setActiveTab] = useState("New");
    const [newRequests, setNewRequests] = useState([]);
    const [confirmedRequests, setConfirmedRequests] = useState([]);
    const [historyRequests, setHistoryRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        loadAllRequests();
    }, []);

    const loadAllRequests = async () => {
        try {
            setLoading(true);
            setError("");

            // Load all three types in parallel
            const [newResponse, confirmedResponse, historyResponse] = await Promise.all([
                getVendorBookings({ status: "ASSIGNED", limit: 50 }),
                getVendorBookings({ status: "ACCEPTED", limit: 50 }),
                getVendorBookings({ status: "COMPLETED", limit: 50, sortBy: "completedAt", sortOrder: "desc" })
            ]);

            if (newResponse.success) {
                setNewRequests(newResponse.data.bookings || []);
            }
            if (confirmedResponse.success) {
                setConfirmedRequests(confirmedResponse.data.bookings || []);
            }
            if (historyResponse.success) {
                setHistoryRequests(historyResponse.data.bookings || []);
            }
        } catch (err) {
            console.error("Load requests error:", err);
            setError("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (bookingId) => {
        if (!window.confirm("Are you sure you want to accept this booking?")) {
            return;
        }

        try {
            setActionLoading(bookingId);
            setError("");
            setSuccess("");

            const response = await acceptBooking(bookingId);

            if (response.success) {
                setSuccess("Booking accepted successfully!");
                // Remove from new requests and reload
                setNewRequests(newRequests.filter((req) => req._id !== bookingId));
                setTimeout(() => {
                    loadAllRequests();
                }, 1000);
            } else {
                setError(response.message || "Failed to accept booking");
            }
        } catch (err) {
            console.error("Accept booking error:", err);
            setError(err.response?.data?.message || "Failed to accept booking");
            if (err.response?.status === 400) {
                setTimeout(() => {
                    loadAllRequests();
                }, 1000);
            }
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (bookingId) => {
        const rejectionReason = window.prompt(
            "Please provide a reason for rejection (minimum 10 characters):"
        );

        if (!rejectionReason || rejectionReason.trim().length < 10) {
            if (rejectionReason !== null) {
                setError("Rejection reason must be at least 10 characters long.");
            }
            return;
        }

        if (!window.confirm("Are you sure you want to reject this booking?")) {
            return;
        }

        try {
            setActionLoading(bookingId);
            setError("");
            setSuccess("");

            const response = await rejectBooking(bookingId, rejectionReason);

            if (response.success) {
                setSuccess("Booking rejected successfully.");
                // Remove from new requests and reload
                setNewRequests(newRequests.filter((req) => req._id !== bookingId));
                setTimeout(() => {
                    loadAllRequests();
                }, 1000);
            } else {
                setError(response.message || "Failed to reject booking");
            }
        } catch (err) {
            console.error("Reject booking error:", err);
            setError(err.response?.data?.message || "Failed to reject booking");
            if (err.response?.status === 400) {
                setTimeout(() => {
                    loadAllRequests();
                }, 1000);
            }
        } finally {
            setActionLoading(null);
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

    const getCurrentRequests = () => {
        switch (activeTab) {
            case "New":
                return newRequests;
            case "Confirmed":
                return confirmedRequests;
            case "History":
                return historyRequests;
            default:
                return [];
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 flex items-center justify-center">
                <LoadingSpinner message="Loading requests..." />
            </div>
        );
    }

    const currentRequests = getCurrentRequests();

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <ErrorMessage message={error} />
            <SuccessMessage message={success} />

            {/* Header */}
            <div className="bg-gray-100 rounded-t-[12px] px-4 py-3 flex items-center justify-between mb-0">
                <button
                    onClick={() => navigate("/vendor/dashboard")}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                    <IoChevronBackOutline className="text-xl text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-800">Booking Requests</h1>
                <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <IoMenuOutline className="text-xl text-gray-700" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-b-[12px] mb-4 overflow-hidden">
                <button
                    onClick={() => setActiveTab("New")}
                    className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${activeTab === "New"
                            ? "bg-[#0A84FF] text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                >
                    New ({newRequests.length})
                </button>
                <button
                    onClick={() => setActiveTab("Confirmed")}
                    className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${activeTab === "Confirmed"
                            ? "bg-[#0A84FF] text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                >
                    Confirmed
                </button>
                <button
                    onClick={() => setActiveTab("History")}
                    className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${activeTab === "History"
                            ? "bg-[#0A84FF] text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                >
                    History
                </button>
            </div>

            {/* Booking Cards */}
            <div className="space-y-4">
                {currentRequests.length === 0 ? (
                    <div className="bg-white rounded-[12px] p-8 text-center shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <p className="text-[#4A4A4A]">No {activeTab.toLowerCase()} requests available</p>
                    </div>
                ) : (
                    currentRequests.map((request) => (
                        <div
                            key={request._id}
                            className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                        >
                            {/* Customer Info Header */}
                            <div className="flex items-start gap-4 mb-4">
                                {/* Profile Picture */}
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 border-2 border-blue-200">
                                    {request.user?.name ? (
                                        <span className="text-lg font-bold text-blue-600">
                                            {request.user.name.charAt(0).toUpperCase()}
                                        </span>
                                    ) : (
                                        <span className="text-xl">👤</span>
                                    )}
                                </div>

                                {/* Customer Details */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold text-gray-800 mb-1">
                                        {request.user?.name || "Customer"}
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Booking ID: {formatBookingId(request._id)}
                                    </p>
                                </div>

                                {/* Payment Amount */}
                                <div className="text-right flex-shrink-0">
                                    <p className="text-lg font-bold text-green-600 mb-1">
                                        {formatAmount(request.payment?.totalAmount || request.payment?.amount || 0)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {getPaymentMethod(request.payment)}
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
                                            {request.service?.name || "Service"}
                                            {request.service?.machineType && ` (${request.service.machineType})`}
                                        </span>
                                    </div>

                                    {/* Date and Time */}
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <IoCalendarOutline className="text-base text-gray-500" />
                                        <span>
                                            {formatDate(request.scheduledDate, request.scheduledTime)}
                                        </span>
                                    </div>

                                    {/* Address */}
                                    <div className="flex items-start gap-2 text-sm text-gray-700">
                                        <IoLocationOutline className="text-base text-gray-500 mt-0.5" />
                                        <span className="flex-1">
                                            {formatAddress(request.address)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons - Only for New/ASSIGNED requests */}
                            {activeTab === "New" && request.status === "ASSIGNED" && (
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleReject(request._id)}
                                        disabled={actionLoading === request._id}
                                        className="flex-1 h-11 bg-red-50 text-red-600 text-sm font-semibold rounded-[8px] hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {actionLoading === request._id ? "Processing..." : "Decline"}
                                    </button>
                                    <button
                                        onClick={() => handleAccept(request._id)}
                                        disabled={actionLoading === request._id}
                                        className="flex-1 h-11 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {actionLoading === request._id ? "Processing..." : "Accept"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
