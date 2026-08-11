import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
    getVendorBookings,
    acceptBooking,
    rejectBooking,
    verifyStartOTP,
    verifyEndOTP,
    resendSurveyOTP,
} from "../../../services/vendorApi";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import PageContainer from "../../shared/components/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal, { VENDOR_REJECTION_REASONS } from "../../shared/components/InputModal";
import OTPInputModal from "../../shared/components/OTPInputModal";
import VendorOngoingBookingCard from "../vendor-components/VendorOngoingBookingCard";
import {
    IoNotificationsOutline,
    IoTimeOutline,
    IoCheckmarkCircleOutline,
    IoStarOutline,
    IoCloseCircleOutline,
    IoBriefcaseOutline,
    IoCalendarOutline,
    IoLockClosedOutline,
    IoLocationOutline,
    IoChevronForwardOutline,
    IoEyeOutline
} from "react-icons/io5";

export default function VendorRequests() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { vendor } = useVendorAuth();
    const { socket } = useNotifications();

    // Determine initial active tab from URL search params or location state or sessionStorage
    const getInitialTab = () => {
        const urlTab = searchParams.get("tab") || location.state?.tab;
        if (urlTab) {
            const normalized = urlTab.toLowerCase().replace(/_/g, " ");
            if (normalized.includes("progress")) return "In Progress";
            if (normalized.includes("complete")) return "Completed";
            if (normalized.includes("history")) return "History";
            if (normalized.includes("new") || normalized.includes("request")) return "New";
        }
        const savedTab = sessionStorage.getItem("vendor_active_tab");
        return savedTab || "New";
    };

    const [activeTab, setActiveTabState] = useState(getInitialTab);

    const setActiveTab = (tab) => {
        setActiveTabState(tab);
        sessionStorage.setItem("vendor_active_tab", tab);
        setSearchParams({ tab: tab.toLowerCase().replace(/\s+/g, "_") }, { replace: true });
    };

    // Keep active tab in sync if URL search params or location state change
    useEffect(() => {
        const urlTab = searchParams.get("tab") || location.state?.tab;
        if (urlTab) {
            const normalized = urlTab.toLowerCase().replace(/_/g, " ");
            let target = "New";
            if (normalized.includes("progress")) target = "In Progress";
            else if (normalized.includes("complete")) target = "Completed";
            else if (normalized.includes("history")) target = "History";
            else if (normalized.includes("new") || normalized.includes("request")) target = "New";

            if (target !== activeTab) {
                setActiveTabState(target);
                sessionStorage.setItem("vendor_active_tab", target);
            }
        }
    }, [searchParams, location.state]);
    const [newRequests, setNewRequests] = useState([]);
    const [confirmedRequests, setConfirmedRequests] = useState([]);
    const [completedRequests, setCompletedRequests] = useState([]);
    const [historyRequests, setHistoryRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const toast = useToast();
    const [showAcceptScheduler, setShowAcceptScheduler] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);
    const [showStartOTPModal, setShowStartOTPModal] = useState(false);
    const [showEndOTPModal, setShowEndOTPModal] = useState(false);
    const [verifyingOTP, setVerifyingOTP] = useState(false);
    const [resendingOTP, setResendingOTP] = useState(false);

    const handleResendOTP = async (type) => {
        if (!selectedBookingId) return;
        try {
            setResendingOTP(true);
            const response = await resendSurveyOTP(selectedBookingId, type);
            if (response.success) {
                toast.showSuccess(response.message || "Survey OTP resent to customer successfully!");
            } else {
                toast.showError(response.message || "Failed to resend OTP");
            }
        } catch (err) {
            handleApiError(err, "Failed to resend OTP");
        } finally {
            setResendingOTP(false);
        }
    };
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const rejectionReasonRef = useRef("");
    const [acceptScheduleDate, setAcceptScheduleDate] = useState("");
    const [acceptScheduleTime, setAcceptScheduleTime] = useState("");
    const loadAllRequestsRef = useRef(null);

    const handleVerifyStartOTP = async (otpCode) => {
        if (!selectedBookingId) return;
        try {
            setVerifyingOTP(true);
            const response = await verifyStartOTP(selectedBookingId, otpCode);
            if (response.success) {
                toast.showSuccess("Start Survey OTP verified successfully!");
                setShowStartOTPModal(false);
                setSelectedBookingId(null);
                await loadAllRequests();
            } else {
                toast.showError(response.message || "Invalid OTP code");
            }
        } catch (err) {
            handleApiError(err, "Failed to verify OTP");
        } finally {
            setVerifyingOTP(false);
        }
    };

    const handleVerifyEndOTP = async (otpCode) => {
        if (!selectedBookingId) return;
        try {
            setVerifyingOTP(true);
            const response = await verifyEndOTP(selectedBookingId, otpCode);
            if (response.success) {
                toast.showSuccess("End Survey OTP verified successfully!");
                setShowEndOTPModal(false);
                setSelectedBookingId(null);
                await loadAllRequests();
            } else {
                toast.showError(response.message || "Invalid OTP code");
            }
        } catch (err) {
            handleApiError(err, "Failed to verify OTP");
        } finally {
            setVerifyingOTP(false);
        }
    };

    const loadAllRequests = async () => {
        try {
            setLoading(true);

            // Load all three types in parallel
            // Fetch both ASSIGNED and PENDING bookings for "New" requests
            const [assignedResponse, pendingResponse, confirmedResponse, completedResponse, historyResponse] =
                await Promise.all([
                    getVendorBookings({ status: "ASSIGNED", limit: 50, sortBy: "createdAt", sortOrder: "desc" }),
                    getVendorBookings({ status: "PENDING,AWAITING_ADVANCE", limit: 50, sortBy: "createdAt", sortOrder: "desc" }),
                    getVendorBookings({
                        status: "ACCEPTED,VISITED,REPORT_UPLOADED,AWAITING_PAYMENT,PAYMENT_SUCCESS,PAID_FIRST,BOREWELL_UPLOADED,ADMIN_APPROVED,APPROVED",
                        excludeStatus: "COMPLETED,FINAL_SETTLEMENT_COMPLETE",
                        limit: 50,
                        sortBy: "createdAt",
                        sortOrder: "desc"
                    }),
                    getVendorBookings({ status: "COMPLETED,FINAL_SETTLEMENT_COMPLETE,SUCCESS,FINAL_SETTLEMENT", limit: 50, sortBy: "createdAt", sortOrder: "desc" }),
                    getVendorBookings({
                        status: "CANCELLED,REJECTED,FAILED",
                        limit: 50,
                        sortBy: "createdAt",
                        sortOrder: "desc",
                    }),
                ]);

            if (assignedResponse && assignedResponse.success) {
                setNewRequests(assignedResponse.data.bookings || []);
            }

            const inProgress = [];
            if (confirmedResponse && confirmedResponse.success) {
                inProgress.push(...(confirmedResponse.data.bookings || []));
            }
            if (pendingResponse && pendingResponse.success) {
                inProgress.push(...(pendingResponse.data.bookings || []));
            }
            setConfirmedRequests(inProgress);

            if (completedResponse && completedResponse.success) {
                setCompletedRequests(completedResponse.data.bookings || []);
            }
            if (historyResponse && historyResponse.success) {
                setHistoryRequests(historyResponse.data.bookings || []);
            }
        } catch (err) {
            handleApiError(err, "Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    // Store loadAllRequests function in ref so it can be used in socket listeners
    useEffect(() => {
        loadAllRequestsRef.current = loadAllRequests;
    }, []);

    // Load data on mount and when location changes (navigation back)
    useEffect(() => {
        loadAllRequests();
    }, [location.pathname]);

    // Refresh when tab changes
    useEffect(() => {
        loadAllRequests();
    }, [activeTab]);

    // Refetch when page becomes visible (user switches tabs/windows)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadAllRequests();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Listen to socket notifications for new bookings
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification) => {
            console.log('[VendorRequests] New notification received:', notification);

            // Refresh for any booking-related assigned or status update
            if (notification.type === 'BOOKING_ASSIGNED' ||
                notification.type === 'BOOKING_CREATED' ||
                notification.type === 'NEW_BOOKING' ||
                notification.type === 'BOOKING_ASSIGNED_TO_VENDOR' ||
                notification.type === 'BOOKING_ACCEPTED' ||
                notification.type === 'BOOKING_REJECTED' ||
                notification.type === 'BOOKING_STATUS_UPDATED' ||
                notification.type === 'PAYMENT_RECEIVED') {

                console.log('[VendorRequests] Refreshing requests list...');
                if (loadAllRequestsRef.current) {
                    loadAllRequestsRef.current();
                }
            }
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket]);

    const handleAccept = (bookingId) => {
        setSelectedBookingId(bookingId);
        const req = newRequests.find(r => r._id === bookingId);
        const fixedDate = req?.scheduledDate || req?.scheduleDate
            ? new Date(req.scheduledDate || req.scheduleDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];
        setAcceptScheduleDate(fixedDate);
        setAcceptScheduleTime(req?.scheduledTime && req?.scheduledTime !== "TBD" ? req.scheduledTime : "09:00 AM - 10:00 AM");
        setShowAcceptScheduler(true);
    };

    const handleAcceptConfirm = async () => {
        if (!selectedBookingId) return;
        if (!acceptScheduleTime) {
            toast.showError("Please select a visit time slot.");
            return;
        }
        const bookingId = selectedBookingId;
        setShowAcceptScheduler(false);

        const loadingToast = toast.showLoading("Accepting booking...");
        try {
            setActionLoading(bookingId);

            const response = await acceptBooking(bookingId, {
                scheduledDate: acceptScheduleDate,
                scheduledTime: acceptScheduleTime,
            });

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Booking accepted! Visit scheduled for " + acceptScheduleTime + " on " + new Date(acceptScheduleDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }));
                setNewRequests(
                    newRequests.filter((req) => req._id !== bookingId)
                );
                await loadAllRequests();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to accept booking");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to accept booking");
            if (err.response?.status === 400) {
                await loadAllRequests();
            }
        } finally {
            setActionLoading(null);
            setSelectedBookingId(null);
            setAcceptScheduleDate("");
            setAcceptScheduleTime("");
        }
    };

    const handleReject = (bookingId) => {
        setSelectedBookingId(bookingId);
        setRejectionReason("");
        setShowRejectInput(true);
    };

    const handleRejectionReasonSubmit = (reason) => {
        setRejectionReason(reason);
        rejectionReasonRef.current = reason;
        setShowRejectInput(false);
        setShowRejectConfirm(true);
    };

    const handleRejectConfirm = async () => {
        const currentReason = rejectionReasonRef.current || rejectionReason;
        if (!selectedBookingId || !currentReason) return;

        const bookingId = selectedBookingId;
        setShowRejectConfirm(false);
        console.log(`[VendorRequests] Rejecting booking ${bookingId} with reason: ${currentReason}`);

        const loadingToast = toast.showLoading("Rejecting booking...");
        try {
            setActionLoading(bookingId);

            const response = await rejectBooking(bookingId, currentReason);

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Booking rejected successfully.");
                // Immediately update state and reload
                setNewRequests(
                    newRequests.filter((req) => req._id !== bookingId)
                );
                // Reload immediately without delay
                await loadAllRequests();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to reject booking");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to reject booking");
            if (err.response?.status === 400) {
                await loadAllRequests();
            }
        } finally {
            setActionLoading(null);
            setSelectedBookingId(null);
            setRejectionReason("");
            rejectionReasonRef.current = "";
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
            case "In Progress":
                return confirmedRequests;
            case "Completed":
                return completedRequests;
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
                <h1 className="text-2xl font-bold text-[#3A3A3A] pt-4 mb-4">
                    Your Booking
                </h1>

                <div className="flex bg-white/80 backdrop-blur-md sticky top-20 z-20 -mx-4 px-4 py-3 mb-6 border-b border-gray-100 overflow-x-auto no-scrollbar gap-2">
                    {[
                        { id: "New", label: "Requests", count: newRequests.length, icon: <IoNotificationsOutline /> },
                        { id: "In Progress", label: "In Progress", count: confirmedRequests.length, icon: <IoBriefcaseOutline /> },
                        { id: "Completed", label: "Completed", count: completedRequests.length, icon: <IoStarOutline /> },
                        { id: "History", label: "History", count: historyRequests.length, icon: <IoCloseCircleOutline /> }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                if (["In Progress", "Completed", "History"].includes(tab.id)) {
                                    setTimeout(() => loadAllRequests(), 100);
                                }
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 ${activeTab === tab.id
                                ? "bg-[#0A84FF] text-white shadow-lg shadow-blue-200"
                                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                }`}
                        >
                            <span className={`text-lg transition-transform ${activeTab === tab.id ? "rotate-12" : ""}`}>
                                {tab.icon}
                            </span>
                            <span className="text-sm font-bold whitespace-nowrap">
                                {tab.label}
                            </span>
                            {tab.count > 0 && (
                                <span className={`text-[10px] min-w-[20px] h-[20px] flex items-center justify-center rounded-full font-black ${activeTab === tab.id
                                    ? "bg-white text-[#0A84FF]"
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
                    {currentRequests.length === 0 ? (
                        <div className="rounded-xl bg-white p-8 text-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                            <p className="text-[#3A3A3A]">
                                No {activeTab.toLowerCase()} requests available
                            </p>
                        </div>
                    ) : (
                        currentRequests.map((request) => (
                            activeTab === "In Progress" ? (
                                <VendorOngoingBookingCard
                                    key={request._id}
                                    booking={request}
                                    onViewStatus={(id) => navigate(`/vendor/bookings/${id}`)}
                                    onUploadReport={(b) => navigate(`/vendor/bookings/${b._id}/upload-report`)}
                                    onVerifyStartOTP={(b) => {
                                        setSelectedBookingId(b._id);
                                        setShowStartOTPModal(true);
                                    }}
                                    onVerifyEndOTP={(b) => {
                                        setSelectedBookingId(b._id);
                                        setShowEndOTPModal(true);
                                    }}
                                    onUploadPhotos={(b) => navigate(`/vendor/bookings/${b._id}`)}
                                />
                            ) : (
                                <div
                                    key={request._id}
                                    onClick={() => navigate(`/vendor/bookings/${request._id}`)}
                                    className="rounded-xl bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] cursor-pointer hover:shadow-[0_6px_16px_rgba(0,0,0,0.12)] transition-all"
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
                                        {(request.vendorStatus || request.status) === "PENDING" && (
                                            <span className="inline-block mt-1 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                                                Waiting for Payment
                                            </span>
                                        )}
                                        {(request.vendorStatus || request.status) === "CANCELLED" && (
                                            <span className="inline-block mt-1 text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                                                Cancelled
                                            </span>
                                        )}
                                        {(request.vendorStatus || request.status) === "REJECTED" && (
                                            <span className="inline-block mt-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                                Rejected
                                            </span>
                                        )}
                                    </div>

                                    {/* Payment Amount - Show only service charges + travel charges (no GST) */}
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-[#00C2A8]">
                                            {formatAmount(
                                                request.payment?.subtotal !== undefined
                                                    ? request.payment.subtotal
                                                    : (request.payment?.baseServiceFee || 0) + (request.payment?.travelCharges || 0) ||
                                                    request.payment?.amount ||
                                                    0
                                            )}
                                        </p>
                                        <p className="text-xs text-[#6B7280]">
                                            {getPaymentMethod(request.payment)}
                                        </p>
                                        {request.payment?.subtotal && request.payment?.totalAmount && (
                                            <p className="text-xs text-[#6B7280] mt-1">
                                                Service + Travel
                                            </p>
                                        )}
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
                                <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                                    {/* View Details/Status Button - Changes based on tab */}
                                    <button
                                        onClick={() => {
                                            if (activeTab === "New") {
                                                navigate(`/vendor/bookings/${request._id}`);
                                            } else {
                                                navigate(`/vendor/booking/${request._id}/status`);
                                            }
                                        }}
                                        className="relative flex-1 rounded-full bg-gradient-to-b from-[#B3E5FC] via-[#E1F5FE] to-[#81D4FA] text-[#1976D2] py-2 px-3 text-xs font-semibold hover:from-[#90CAF9] hover:via-[#BBDEFB] hover:to-[#64B5F6] transition-all shadow-sm hover:shadow-md active:scale-[0.98] overflow-hidden flex items-center justify-center"
                                    >
                                        {/* Glossy/Highlight Effect */}
                                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent"></div>
                                        <span className="relative z-10">
                                            {activeTab === "New" ? "View Details" : "View Status"}
                                        </span>
                                    </button>

                                    {/* Accept/Reject Buttons - Only for New/ASSIGNED requests (PENDING bookings don't have action buttons) */}
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
                                                    className="flex-1 rounded-full bg-red-50 py-2 px-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
                                                    className="flex-1 rounded-full bg-green-500 py-2 px-3 text-xs font-bold text-white shadow-sm hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {actionLoading === request._id
                                                        ? "Processing..."
                                                        : "Accept"}
                                                </button>
                                            </>
                                        )}
                                </div>
                            </div>
                            )
                        ))
                    )}
                </div>
            </PageContainer>

            {/* Accept Booking — Schedule Time Modal */}
            {showAcceptScheduler && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-green-100 rounded-2xl">
                                <IoCalendarOutline className="text-green-600 text-xl" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Set Visit Time Slot</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Select your arrival time slot for the survey</p>
                            </div>
                        </div>

                        {/* Read-Only Locked Date Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-600 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <IoCalendarOutline className="text-gray-400" /> Survey Date
                                </span>
                                <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                                    <IoLockClosedOutline className="text-[10px]" /> User Selected
                                </span>
                            </label>
                            <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 flex items-center justify-between cursor-not-allowed">
                                <span>
                                    {acceptScheduleDate
                                        ? new Date(acceptScheduleDate).toLocaleDateString("en-IN", {
                                            weekday: "short",
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric"
                                        })
                                        : new Date().toLocaleDateString("en-IN", {
                                            weekday: "short",
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric"
                                        })
                                    }
                                </span>
                                <IoLockClosedOutline className="text-gray-400" />
                            </div>
                        </div>

                        {/* Interactive Time Slot Selector Grid */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <IoTimeOutline className="text-emerald-600 text-sm" /> Select Time Slot
                                </span>
                                {acceptScheduleTime && (
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        {acceptScheduleTime}
                                    </span>
                                )}
                            </label>

                            <div className="max-h-52 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                                {/* Morning */}
                                <div>
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        🌅 Morning Slots
                                    </span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {[
                                            "06:00 AM - 07:00 AM",
                                            "07:00 AM - 08:00 AM",
                                            "08:00 AM - 09:00 AM",
                                            "09:00 AM - 10:00 AM",
                                            "10:00 AM - 11:00 AM",
                                            "11:00 AM - 12:00 PM"
                                        ].map((slot) => {
                                            const isSelected = acceptScheduleTime === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setAcceptScheduleTime(slot)}
                                                    className={`px-2.5 py-2 text-[11px] font-bold rounded-xl border transition-all duration-200 text-left flex items-center justify-between ${
                                                        isSelected
                                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20 scale-[1.02]"
                                                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300"
                                                    }`}
                                                >
                                                    <span>{slot}</span>
                                                    {isSelected && <span className="text-xs font-black">✓</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Afternoon */}
                                <div>
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        ☀️ Afternoon Slots
                                    </span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {[
                                            "12:00 PM - 01:00 PM",
                                            "01:00 PM - 02:00 PM",
                                            "02:00 PM - 03:00 PM",
                                            "03:00 PM - 04:00 PM"
                                        ].map((slot) => {
                                            const isSelected = acceptScheduleTime === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setAcceptScheduleTime(slot)}
                                                    className={`px-2.5 py-2 text-[11px] font-bold rounded-xl border transition-all duration-200 text-left flex items-center justify-between ${
                                                        isSelected
                                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20 scale-[1.02]"
                                                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300"
                                                    }`}
                                                >
                                                    <span>{slot}</span>
                                                    {isSelected && <span className="text-xs font-black">✓</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Evening */}
                                <div>
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        🌆 Evening Slots
                                    </span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {[
                                            "04:00 PM - 05:00 PM",
                                            "05:00 PM - 06:00 PM",
                                            "06:00 PM - 07:00 PM"
                                        ].map((slot) => {
                                            const isSelected = acceptScheduleTime === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setAcceptScheduleTime(slot)}
                                                    className={`px-2.5 py-2 text-[11px] font-bold rounded-xl border transition-all duration-200 text-left flex items-center justify-between ${
                                                        isSelected
                                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20 scale-[1.02]"
                                                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300"
                                                    }`}
                                                >
                                                    <span>{slot}</span>
                                                    {isSelected && <span className="text-xs font-black">✓</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Confirmation Banner */}
                        {acceptScheduleTime && (
                            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-green-800 flex items-center gap-2">
                                <span className="text-green-600 text-sm">✓</span>
                                <span>Visit set for <strong>{acceptScheduleTime}</strong></span>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={() => {
                                    setShowAcceptScheduler(false);
                                    setSelectedBookingId(null);
                                    setAcceptScheduleDate("");
                                    setAcceptScheduleTime("");
                                }}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAcceptConfirm}
                                disabled={!acceptScheduleTime}
                                className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Confirm &amp; Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Reason Input Modal */}
            <InputModal
                isOpen={showRejectInput}
                onClose={() => {
                    setShowRejectInput(false);
                    setRejectionReason("");
                }}
                onSubmit={handleRejectionReasonSubmit}
                title="Decline / Reject Booking"
                message="Please select a reason for rejecting this survey booking:"
                options={VENDOR_REJECTION_REASONS}
                submitText="Continue"
                cancelText="Cancel"
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

            {/* Start Survey OTP Modal */}
            <OTPInputModal
                isOpen={showStartOTPModal}
                onClose={() => {
                    setShowStartOTPModal(false);
                    setSelectedBookingId(null);
                }}
                onSubmit={handleVerifyStartOTP}
                onResend={() => handleResendOTP("start")}
                resending={resendingOTP}
                title="Start Survey OTP"
                message="Please ask the customer for the Start Survey OTP to begin the survey."
                submitText="Verify OTP"
                isLoading={verifyingOTP}
            />

            {/* End Survey OTP Modal */}
            <OTPInputModal
                isOpen={showEndOTPModal}
                onClose={() => {
                    setShowEndOTPModal(false);
                    setSelectedBookingId(null);
                }}
                onSubmit={handleVerifyEndOTP}
                onResend={() => handleResendOTP("end")}
                resending={resendingOTP}
                title="End Survey OTP"
                message="Please ask the customer for the End Survey OTP to complete the survey."
                submitText="Verify OTP"
                isLoading={verifyingOTP}
            />
        </>
    );
}
