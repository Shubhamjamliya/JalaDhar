import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    getVendorBookings,
    acceptBooking,
    rejectBooking,
} from "../../../services/vendorApi";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import PageContainer from "../../shared/components/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";

export default function VendorRequests() {
    const navigate = useNavigate();
    const { vendor } = useVendorAuth();
    const [activeTab, setActiveTab] = useState("New");
    const [newRequests, setNewRequests] = useState([]);
    const [confirmedRequests, setConfirmedRequests] = useState([]);
    const [historyRequests, setHistoryRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const toast = useToast();
    const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");

    useEffect(() => {
        loadAllRequests();
    }, []);

    const loadAllRequests = async () => {
        try {
            setLoading(true);

            // Load all three types in parallel
            const [newResponse, confirmedResponse, historyResponse] =
                await Promise.all([
                    getVendorBookings({ status: "ASSIGNED", limit: 50 }),
                    getVendorBookings({ status: "ACCEPTED", limit: 50 }),
                    getVendorBookings({
                        status: "COMPLETED",
                        limit: 50,
                        sortBy: "completedAt",
                        sortOrder: "desc",
                    }),
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
            handleApiError(err, "Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = (bookingId) => {
        setSelectedBookingId(bookingId);
        setShowAcceptConfirm(true);
    };

    const handleAcceptConfirm = async () => {
        if (!selectedBookingId) return;
        const bookingId = selectedBookingId;
        setShowAcceptConfirm(false);
        
        const loadingToast = toast.showLoading("Accepting booking...");
        try {
            setActionLoading(bookingId);

            const response = await acceptBooking(bookingId);

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Booking accepted successfully!");
                // Remove from new requests and reload
                setNewRequests(
                    newRequests.filter((req) => req._id !== bookingId)
                );
                setTimeout(() => {
                    loadAllRequests();
                }, 500);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to accept booking");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to accept booking");
            if (err.response?.status === 400) {
                setTimeout(() => {
                    loadAllRequests();
                }, 500);
            }
        } finally {
            setActionLoading(null);
            setSelectedBookingId(null);
        }
    };

    const handleReject = (bookingId) => {
        setSelectedBookingId(bookingId);
        setRejectionReason("");
        setShowRejectInput(true);
    };

    const handleRejectionReasonSubmit = (reason) => {
        setRejectionReason(reason);
        setShowRejectInput(false);
        setShowRejectConfirm(true);
    };

    const handleRejectConfirm = async () => {
        if (!selectedBookingId || !rejectionReason) return;
        const bookingId = selectedBookingId;
        setShowRejectConfirm(false);
        
        const loadingToast = toast.showLoading("Rejecting booking...");
        try {
            setActionLoading(bookingId);

            const response = await rejectBooking(bookingId, rejectionReason);

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Booking rejected successfully.");
                // Remove from new requests and reload
                setNewRequests(
                    newRequests.filter((req) => req._id !== bookingId)
                );
                setTimeout(() => {
                    loadAllRequests();
                }, 500);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to reject booking");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to reject booking");
            if (err.response?.status === 400) {
                setTimeout(() => {
                    loadAllRequests();
                }, 500);
            }
        } finally {
            setActionLoading(null);
            setSelectedBookingId(null);
            setRejectionReason("");
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
            <PageContainer>
                <LoadingSpinner message="Loading requests..." />
            </PageContainer>
        );
    }

    const currentRequests = getCurrentRequests();

    return (
        <>
        <PageContainer>

            {/* Heading */}
            <h1 className="text-2xl font-bold text-[#3A3A3A] mb-4">
                Your Booking
            </h1>

            {/* Tabs */}
            <div className="flex space-x-2 py-4">
                <button
                    onClick={() => setActiveTab("New")}
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-colors ${activeTab === "New"
                        ? "bg-[#0A84FF] text-white"
                        : "bg-white text-[#6B7280]"
                        }`}
                >
                    New ({newRequests.length})
                </button>
                <button
                    onClick={() => setActiveTab("Confirmed")}
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-colors ${activeTab === "Confirmed"
                        ? "bg-[#0A84FF] text-white"
                        : "bg-white text-[#6B7280]"
                        }`}
                >
                    Confirmed
                </button>
                <button
                    onClick={() => setActiveTab("History")}
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-colors ${activeTab === "History"
                        ? "bg-[#0A84FF] text-white"
                        : "bg-white text-[#6B7280]"
                        }`}
                >
                    History
                </button>
            </div>

            {/* Booking Cards */}
            <div className="space-y-4">
                {currentRequests.length === 0 ? (
                    <div className="rounded-xl bg-white p-8 text-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                        <p className="text-[#3A3A3A]">
                            No {activeTab.toLowerCase()} requests available
                        </p>
                    </div>
                ) : (
                    currentRequests.map((request) => (
                        <div
                            key={request._id}
                            className="rounded-xl bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                        >
                            {/* Customer Info Header */}
                            <div className="flex items-center gap-4">
                                {/* Profile Picture */}
                                {request.user?.profilePicture ||
                                    request.user?.documents?.profilePicture?.url ? (
                                    <img
                                        src={
                                            request.user.profilePicture ||
                                            request.user?.documents
                                                ?.profilePicture?.url
                                        }
                                        alt="User Avatar"
                                        className="h-14 w-14 rounded-full border-2 border-[#0A84FF] object-cover"
                                    />
                                ) : (
                                    <div className="h-14 w-14 rounded-full border-2 border-[#0A84FF] bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                        {request.user?.name ? (
                                            <span className="text-lg font-bold text-[#0A84FF]">
                                                {request.user.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </span>
                                        ) : (
                                            <span className="text-xl">👤</span>
                                        )}
                                    </div>
                                )}

                                {/* Customer Details */}
                                <div className="flex-1">
                                    <h3 className="font-bold text-[#3A3A3A]">
                                        {request.user?.name || "Customer"}
                                    </h3>
                                    <p className="text-xs text-[#6B7280]">
                                        Booking ID:{" "}
                                        {formatBookingId(request._id)}
                                    </p>
                                </div>

                                {/* Payment Amount */}
                                <div className="text-right">
                                    <p className="text-lg font-bold text-[#00C2A8]">
                                        {formatAmount(
                                            request.payment?.totalAmount ||
                                            request.payment?.amount ||
                                            0
                                        )}
                                    </p>
                                    <p className="text-xs text-[#6B7280]">
                                        {getPaymentMethod(request.payment)}
                                    </p>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="my-4 h-px bg-gray-200"></div>

                            {/* Service Details */}
                            <div>
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
                                            {request.service?.name || "Service"}
                                            {request.service?.machineType &&
                                                ` (${request.service.machineType})`}
                                        </span>
                                    </div>

                                    {/* Date and Time */}
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined !text-xl text-[#00C2A8]">
                                            calendar_today
                                        </span>
                                        <span className="text-[#3A3A3A]">
                                            {formatDate(
                                                request.scheduledDate,
                                                request.scheduledTime
                                            )}
                                        </span>
                                    </div>

                                    {/* Address */}
                                    <div className="flex items-start gap-2">
                                        <span className="material-symbols-outlined !text-xl text-[#00C2A8]">
                                            location_on
                                        </span>
                                        <span className="text-[#3A3A3A]">
                                            {formatAddress(request.address)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-4 flex gap-3">
                                {/* View Status Button - Always visible */}
                                <button
                                    onClick={() =>
                                        navigate(`/vendor/booking/${request._id}/status`)
                                    }
                                    className="flex-1 rounded-lg bg-[#E7F0FB] py-3 text-sm font-semibold text-[#0A84FF] transition-colors hover:bg-[#D0E1F7] flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined !text-lg">
                                        timeline
                                    </span>
                                    View Status
                                </button>

                                {/* Accept/Reject Buttons - Only for New/ASSIGNED requests */}
                                {activeTab === "New" &&
                                    (request.vendorStatus || request.status) === "ASSIGNED" && (
                                        <>
                                            <button
                                                onClick={() =>
                                                    handleReject(request._id)
                                                }
                                                disabled={
                                                    actionLoading === request._id
                                                }
                                                className="flex-1 rounded-lg bg-red-100 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {actionLoading === request._id
                                                    ? "Processing..."
                                                    : "Decline"}
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleAccept(request._id)
                                                }
                                                disabled={
                                                    actionLoading === request._id
                                                }
                                                className="flex-1 rounded-lg bg-[#0A84FF] py-3 text-sm font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-[#005BBB] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {actionLoading === request._id
                                                    ? "Processing..."
                                                    : "Accept"}
                                            </button>
                                        </>
                                    )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </PageContainer>

            {/* Accept Booking Confirmation Modal */}
            <ConfirmModal
                isOpen={showAcceptConfirm}
                onClose={() => {
                    setShowAcceptConfirm(false);
                    setSelectedBookingId(null);
                }}
                onConfirm={handleAcceptConfirm}
                title="Accept Booking"
                message="Are you sure you want to accept this booking?"
                confirmText="Yes, Accept"
                cancelText="Cancel"
                confirmColor="primary"
            />

            {/* Rejection Reason Input Modal */}
            <InputModal
                isOpen={showRejectInput}
                onClose={() => {
                    setShowRejectInput(false);
                    setSelectedBookingId(null);
                    setRejectionReason("");
                }}
                onSubmit={handleRejectionReasonSubmit}
                title="Reject Booking"
                message="Please provide a reason for rejection (minimum 10 characters):"
                placeholder="Enter rejection reason..."
                submitText="Continue"
                cancelText="Cancel"
                minLength={10}
                isTextarea={true}
                textareaRows={4}
            />

            {/* Reject Booking Confirmation Modal */}
            <ConfirmModal
                isOpen={showRejectConfirm}
                onClose={() => {
                    setShowRejectConfirm(false);
                    setSelectedBookingId(null);
                    setRejectionReason("");
                }}
                onConfirm={handleRejectConfirm}
                title="Confirm Rejection"
                message="Are you sure you want to reject this booking?"
                confirmText="Yes, Reject"
                cancelText="Cancel"
                confirmColor="danger"
            />
        </>
    );
}
