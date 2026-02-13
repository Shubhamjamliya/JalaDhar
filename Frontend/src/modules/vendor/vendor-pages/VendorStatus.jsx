import { useState, useEffect, Fragment, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    IoHourglassOutline,
    IoPersonOutline,
    IoConstructOutline,
    IoCheckmarkCircleOutline,
    IoDocumentTextOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoCalendarOutline,
    IoChevronBackOutline,
    IoCloseOutline,
    IoImageOutline,
    IoWalletOutline,
    IoRefreshOutline,
    IoNavigateOutline,
    IoLogoGoogle,
    IoMap,
} from "react-icons/io5";
import {
    getBookingDetails,
    acceptBooking,
    rejectBooking,
    markBookingAsVisited,
} from "../../../services/vendorApi";
import { useNotifications } from "../../../contexts/NotificationContext";
import { usePullToRefresh } from "../../../hooks/usePullToRefresh";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";

export default function VendorStatus() {
    const navigate = useNavigate();
    const { bookingId } = useParams();
    const { socket } = useNotifications();
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const toast = useToast();
    const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);
    const [showVisitConfirm, setShowVisitConfirm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showMapPicker, setShowMapPicker] = useState(false);
    const loadBookingDetailsRef = useRef(null);
    const lastActionTimeRef = useRef(0); // Track when user performed an action
    const ACTION_COOLDOWN = 2000; // 2 seconds - ignore socket updates right after user action

    const loadBookingDetails = async () => {
        try {
            setLoading(true);
            const response = await getBookingDetails(bookingId);
            if (response.success) {
                setBooking(response.data.booking);
            } else {
                toast.showError(response.message || "Failed to load booking details");
            }
        } catch (err) {
            handleApiError(err, "Failed to load booking details");
        } finally {
            setLoading(false);
        }
    };

    // Store loadBookingDetails in ref for socket listeners
    useEffect(() => {
        loadBookingDetailsRef.current = loadBookingDetails;
    }, []);

    useEffect(() => {
        loadBookingDetails();
    }, [bookingId]);

    // Listen to socket notifications for booking status updates (ONLY for external changes)
    useEffect(() => {
        if (!socket || !bookingId) return;

        const handleNewNotification = (notification) => {
            // Ignore socket updates if user just performed an action (use React state instead)
            const timeSinceLastAction = Date.now() - lastActionTimeRef.current;
            if (timeSinceLastAction < ACTION_COOLDOWN) {
                return; // Skip - user's own action will update via React state
            }

            // Check if notification is related to current booking
            const notificationBookingId = notification.metadata?.bookingId ||
                notification.relatedEntity?.entityId?.toString();

            if (notificationBookingId === bookingId?.toString() ||
                notificationBookingId === bookingId) {
                // Only refresh for external changes (not user's own actions)
                // These are changes from other users (admin, user, etc.)
                if (notification.type === 'BOOKING_STATUS_UPDATED' ||
                    notification.type === 'REPORT_UPLOADED' ||
                    notification.type === 'BOREWELL_UPLOADED' ||
                    notification.type === 'ADMIN_APPROVED' ||
                    notification.type === 'PAYMENT_RELEASE' ||
                    notification.type === 'PAYMENT_ADVANCE_SUCCESS' ||
                    notification.type === 'PAYMENT_REMAINING_SUCCESS' ||
                    notification.type === 'FINAL_SETTLEMENT_PROCESSED') {
                    setTimeout(() => {
                        if (loadBookingDetailsRef.current) {
                            loadBookingDetailsRef.current();
                        }
                    }, 500);
                }
            }
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket, bookingId]);

    // Pull-to-refresh functionality
    const { isRefreshing, pullDistance, containerRef, canRefresh } = usePullToRefresh(
        loadBookingDetails,
        { threshold: 80, resistance: 2.5 }
    );

    const handleAccept = () => {
        setShowAcceptConfirm(true);
    };

    const handleAcceptConfirm = async () => {
        setShowAcceptConfirm(false);
        const loadingToast = toast.showLoading("Accepting booking...");
        try {
            setActionLoading(true);
            // Mark that user performed an action (prevent socket from triggering duplicate update)
            lastActionTimeRef.current = Date.now();

            const response = await acceptBooking(bookingId);

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Booking accepted successfully!");
                // Update state immediately via React (not waiting for socket)
                await loadBookingDetails();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to accept booking");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to accept booking");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = () => {
        setRejectionReason("");
        setShowRejectInput(true);
    };

    const handleRejectionReasonSubmit = (reason) => {
        setRejectionReason(reason);
        setShowRejectInput(false);
        setShowRejectConfirm(true);
    };

    const handleRejectConfirm = async () => {
        setShowRejectConfirm(false);
        const loadingToast = toast.showLoading("Rejecting booking...");
        try {
            setActionLoading(true);
            // Mark that user performed an action (prevent socket from triggering duplicate update)
            lastActionTimeRef.current = Date.now();

            const response = await rejectBooking(bookingId, rejectionReason);

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Booking rejected successfully.");
                setRejectionReason("");
                // Update state immediately via React (not waiting for socket)
                await loadBookingDetails();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to reject booking");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to reject booking");
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkVisited = () => {
        setShowVisitConfirm(true);
    };

    const handleVisitConfirm = async () => {
        setShowVisitConfirm(false);
        const loadingToast = toast.showLoading("Marking as visited...");
        try {
            setActionLoading(true);
            // Mark that user performed an action (prevent socket from triggering duplicate update)
            lastActionTimeRef.current = Date.now();

            const response = await markBookingAsVisited(bookingId);

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Booking marked as visited successfully!");
                // Update state immediately via React (not waiting for socket)
                await loadBookingDetails();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to mark as visited");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to mark as visited");
        } finally {
            setActionLoading(false);
        }
    };


    const openMapApp = (appName) => {
        if (!booking?.address) return;

        const { street, city, state, pincode, location } = booking.address;
        const [lng, lat] = location?.coordinates || [0, 0];
        const query = lat && lng ? `${lat},${lng}` : encodeURIComponent(`${street || ""}, ${city || ""}, ${state || ""} ${pincode || ""}`.trim());
        const label = encodeURIComponent(booking.user?.name || 'Customer Site');

        let url = "";
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        switch (appName) {
            case 'google':
                url = isIOS
                    ? `comgooglemaps://?q=${query}&center=${query}`
                    : `geo:${query}?q=${query}(${label})`;
                break;
            case 'apple':
                url = `maps://?q=${label}&ll=${query}`;
                break;
            case 'waze':
                url = `waze://?ll=${query}&navigate=yes`;
                break;
            default:
                url = `https://www.google.com/maps/search/?api=1&query=${query}`;
        }

        window.location.href = url;
        setShowMapPicker(false);

        setTimeout(() => {
            if (document.visibilityState === 'visible') {
                window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
            }
        }, 1500);
    };

    const handleGetDirections = () => {
        if (!booking?.address) {
            toast.showError("Address not available");
            return;
        }
        setShowMapPicker(true);
    };


    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusSteps = () => {
        if (!booking) return [];

        // Use vendorStatus for vendor view
        const status = booking.vendorStatus || booking.status;

        // Define status progression for completed check
        const statusOrder = ["ASSIGNED", "ACCEPTED", "VISITED", "REPORT_UPLOADED", "BOREWELL_UPLOADED", "APPROVED", "FINAL_SETTLEMENT", "FINAL_SETTLEMENT_COMPLETE", "COMPLETED"];
        const currentStatusIndex = statusOrder.indexOf(status);
        const effectiveIndex = currentStatusIndex === -1 ?
            (status === "SUCCESS" || status === "FAILED" ? 8 : 0) :
            currentStatusIndex;

        const steps = [
            {
                id: "assigned",
                label: "Booking Assigned",
                icon: IoPersonOutline,
                active: status === "ASSIGNED",
                completed: effectiveIndex > 0 || !!booking.acceptedAt || !!booking.visitedAt || !!booking.reportUploadedAt,
                description: "Booking has been assigned to you. Please accept or reject.",
                date: booking.assignedAt,
            },
            {
                id: "accepted",
                label: "Booking Accepted",
                icon: IoCheckmarkCircleOutline,
                active: status === "ACCEPTED",
                completed: effectiveIndex > 1 || !!booking.visitedAt || !!booking.reportUploadedAt,
                description: "You have accepted the booking. You can mark as visited.",
                date: booking.acceptedAt,
            },
            {
                id: "visited",
                label: "Site Visited",
                icon: IoConstructOutline,
                active: status === "VISITED",
                completed: effectiveIndex > 2 || !!booking.reportUploadedAt,
                description: "You have visited the customer site.",
                date: booking.visitedAt,
            },
            {
                id: "first-payment",
                label: "1st Payment Release",
                icon: IoWalletOutline,
                active: status === "VISITED" && !booking.payment?.vendorWalletPayments?.siteVisitPayment?.credited,
                completed: booking.payment?.vendorWalletPayments?.siteVisitPayment?.credited || effectiveIndex > 2,
                description: booking.payment?.vendorWalletPayments?.siteVisitPayment?.credited
                    ? "1st payment (50%) has been credited to your wallet."
                    : "1st payment (50%) is pending release from admin.",
                date: booking.payment?.vendorWalletPayments?.siteVisitPayment?.creditedAt,
            },
            {
                id: "upload-report",
                label: "Upload Report",
                icon: IoDocumentTextOutline,
                active: status === "VISITED" && !booking.reportUploadedAt,
                completed: !!booking.reportUploadedAt || effectiveIndex > 3,
                description: "Please upload the service report after receiving 1st payment.",
                date: null,
            },
            {
                id: "report-approved",
                label: "Report Approved",
                icon: IoCheckmarkCircleOutline,
                active: status === "REPORT_UPLOADED" && !booking.report?.approvedAt,
                completed: !!booking.report?.approvedAt || effectiveIndex > 4,
                description: booking.report?.approvedAt
                    ? "Your report has been approved by admin."
                    : "Waiting for admin to approve your report.",
                date: booking.report?.approvedAt,
            },
            {
                id: "second-payment",
                label: "2nd Payment Release",
                icon: IoWalletOutline,
                active: status === "REPORT_UPLOADED" && booking.report?.approvedAt && !booking.payment?.vendorWalletPayments?.reportUploadPayment?.credited,
                completed: booking.payment?.vendorWalletPayments?.reportUploadPayment?.credited || (effectiveIndex > 4 && booking.report?.approvedAt),
                description: booking.payment?.vendorWalletPayments?.reportUploadPayment?.credited
                    ? "2nd payment (50%) has been credited to your wallet."
                    : booking.report?.approvedAt
                        ? "2nd payment (50%) is pending release from admin."
                        : "Waiting for report approval before 2nd payment release.",
                date: booking.payment?.vendorWalletPayments?.reportUploadPayment?.creditedAt,
            },
            {
                id: "borewell",
                label: "Borewell Result Uploaded",
                icon: IoImageOutline,
                active: status === "BOREWELL_UPLOADED" && !!booking.borewellResult?.uploadedAt,
                completed: effectiveIndex > 6 || status === "APPROVED" || status === "FINAL_SETTLEMENT_COMPLETE",
                description: booking.borewellResult?.uploadedAt
                    ? `User has uploaded borewell result. Waiting for admin to approve and process final settlement.`
                    : "Waiting for user to upload borewell result.",
                date: booking.borewellResult?.uploadedAt,
            },
            {
                id: "approved",
                label: "Admin Approved",
                icon: IoCheckmarkCircleOutline,
                active: status === "APPROVED",
                completed: effectiveIndex > 7 || status === "FINAL_SETTLEMENT_COMPLETE" || status === "COMPLETED",
                description: "Admin has approved the borewell result. Waiting for final settlement processing.",
                date: booking.borewellResult?.approvedAt,
            },
            {
                id: "settlement",
                label: "Final Settlement Complete",
                icon: IoWalletOutline,
                active: status === "FINAL_SETTLEMENT_COMPLETE",
                // Vendor settlement is complete if:
                // 1. vendorStatus is FINAL_SETTLEMENT_COMPLETE, OR
                // 2. finalSettlement has rewardAmount or penaltyAmount (vendor settlement processed), OR
                // 3. finalSettlement.status is PROCESSED, OR
                // 4. old vendorSettlement.status is COMPLETED
                completed: status === "FINAL_SETTLEMENT_COMPLETE" ||
                    status === "COMPLETED" ||
                    booking.finalSettlement?.status === "PROCESSED" ||
                    booking.finalSettlement?.rewardAmount > 0 ||
                    booking.finalSettlement?.penaltyAmount > 0 ||
                    booking.payment?.vendorSettlement?.status === "COMPLETED",
                description: (booking.finalSettlement?.rewardAmount > 0 || booking.finalSettlement?.penaltyAmount > 0) ||
                    booking.finalSettlement?.status === "PROCESSED" ||
                    booking.vendorStatus === "FINAL_SETTLEMENT_COMPLETE" ||
                    booking.payment?.vendorSettlement?.status === "COMPLETED"
                    ? booking.finalSettlement?.status === "PROCESSED" || booking.finalSettlement?.rewardAmount > 0 || booking.finalSettlement?.penaltyAmount > 0 || booking.vendorStatus === "FINAL_SETTLEMENT_COMPLETE"
                        ? `Admin has processed your final settlement. ${booking.finalSettlement?.rewardAmount > 0 ? `Reward of ₹${booking.finalSettlement.rewardAmount.toLocaleString('en-IN')} credited.` : booking.finalSettlement?.penaltyAmount > 0 ? `Penalty of ₹${booking.finalSettlement.penaltyAmount.toLocaleString('en-IN')} deducted.` : 'All payments completed.'}`
                        : "Admin has processed your final settlement. All payments completed."
                    : "Waiting for admin to process final settlement.",
                date: booking.finalSettlement?.processedAt || booking.payment?.vendorSettlement?.settledAt,
            },
            {
                id: "completed",
                label: "Completed",
                icon: IoCheckmarkCircleOutline,
                active: ["COMPLETED", "FINAL_SETTLEMENT_COMPLETE", "SUCCESS", "FAILED"].includes(status),
                completed: ["COMPLETED", "FINAL_SETTLEMENT_COMPLETE", "SUCCESS", "FAILED"].includes(status),
                description: "Booking process completed successfully. All settlements are done.",
                date: booking.completedAt || booking.finalSettlement?.processedAt || booking.payment?.vendorSettlement?.settledAt,
            },
        ];

        return steps;
    };

    if (loading) {
        return <LoadingSpinner message="Loading booking status..." />;
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
                <div className="text-center py-8">
                    <p className="text-gray-600">Booking not found</p>
                    <button
                        onClick={() => navigate("/vendor/requests")}
                        className="mt-4 text-[#0A84FF] hover:text-[#005BBB] transition-colors"
                    >
                        Back to Bookings
                    </button>
                </div>
            </div>
        );
    }

    const steps = getStatusSteps();
    const user = booking?.user;
    // Use vendorStatus for vendor view
    const status = booking?.vendorStatus || booking?.status;

    return (
        <div
            ref={containerRef}
            className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 overflow-y-auto"
            style={{
                transform: pullDistance > 0 ? `translateY(${Math.min(pullDistance, 100)}px)` : 'none',
                transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
            }}
        >
            {/* Pull-to-refresh indicator */}
            {(pullDistance > 0 || isRefreshing) && (
                <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-transparent pointer-events-none"
                    style={{
                        height: `${Math.min(pullDistance, 100)}px`,
                        transform: `translateY(${Math.min(pullDistance - 60, 0)}px)`
                    }}
                >
                    <div className={`flex flex-col items-center gap-2 ${canRefresh || isRefreshing ? 'text-[#0A84FF]' : 'text-gray-400'}`}>
                        {isRefreshing ? (
                            <>
                                <div className="w-6 h-6 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-medium">Refreshing...</span>
                            </>
                        ) : (
                            <>
                                <IoRefreshOutline
                                    className={`text-2xl transition-transform ${canRefresh ? 'rotate-180' : ''}`}
                                    style={{ transform: `rotate(${Math.min(pullDistance * 2, 180)}deg)` }}
                                />
                                <span className="text-sm font-medium">
                                    {canRefresh ? 'Release to refresh' : 'Pull to refresh'}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Removed Back Button from here as it's now in VendorNavbar */}

            {/* Booking Info Card */}
            {booking && (
                <div className="mb-6 rounded-[12px] bg-white p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] border-2 border-[#81D4FA]">
                    <h2 className="text-lg font-bold text-gray-800 mb-2">
                        {booking.service?.name || "Service"}
                    </h2>
                    <div className="flex flex-col gap-2 text-sm text-gray-600">
                        {booking.scheduledDate && (
                            <div className="flex items-center gap-2">
                                <IoTimeOutline className="text-base" />
                                <span>
                                    {new Date(booking.scheduledDate).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}{" "}
                                    at {booking.scheduledTime || "N/A"}
                                </span>
                            </div>
                        )}
                        {booking.address && (
                            <div className="flex items-center gap-2">
                                <IoLocationOutline className="text-base" />
                                <span>
                                    {booking.address.street}, {booking.address.city}
                                </span>
                            </div>
                        )}
                        {user && (
                            <div className="flex items-center gap-2">
                                <IoPersonOutline className="text-base" />
                                <span>Customer: {user.name || "N/A"}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Status Timeline */}
            {steps.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <p className="text-gray-600">No status information available</p>
                </div>
            ) : (
                <div className="grid grid-cols-[auto_1fr] gap-x-4">
                    {steps.map((step, index) => {
                        const StepIcon = step.icon;
                        const isLast = index === steps.length - 1;
                        const isActive = step.active;
                        const isCompleted = step.completed;

                        return (
                            <Fragment key={step.id}>
                                {/* Icon */}
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-[#B3E5FC] via-[#E1F5FE] to-[#81D4FA] shadow-[0px_4px_10px_rgba(0,0,0,0.1)] overflow-hidden ${isActive || isCompleted ? "" : "opacity-60"
                                            }`}
                                    >
                                        {/* Highlight/Reflection Effect */}
                                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent"></div>
                                        <StepIcon className={`text-2xl relative z-10 ${isActive || isCompleted ? "text-[#1976D2]" : "text-gray-500"}`} />
                                    </div>
                                    {!isLast && (
                                        <div
                                            className={`w-0.5 grow ${isCompleted
                                                ? "bg-[#1976D2]"
                                                : isActive
                                                    ? "bg-[#1976D2]"
                                                    : "bg-gray-300"
                                                }`}
                                        ></div>
                                    )}
                                </div>

                                {/* Content */}
                                <div
                                    className={`mb-6 rounded-[12px] bg-white p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] border-2 ${isActive || isCompleted ? "border-[#81D4FA]" : "border-[#B3E5FC] opacity-60"
                                        }`}
                                >
                                    <p className="text-base font-bold text-gray-800 mb-1">
                                        {step.label}
                                    </p>
                                    {step.date && (
                                        <p className="mb-2 text-sm text-gray-500">
                                            {formatDate(step.date)}
                                        </p>
                                    )}
                                    <p className={`text-sm mb-3 ${isActive || isCompleted ? "text-gray-600" : "text-gray-400"}`}>{step.description}</p>

                                    {/* Action Buttons */}
                                    {/* Step 1: ASSIGNED - Accept/Reject */}
                                    {step.id === "assigned" && status === "ASSIGNED" && (
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={handleReject}
                                                disabled={actionLoading}
                                                className="flex-1 h-12 bg-red-100 text-red-600 text-sm font-semibold rounded-[8px] hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {actionLoading ? "Processing..." : "Reject"}
                                            </button>
                                            <button
                                                onClick={handleAccept}
                                                disabled={actionLoading}
                                                className="flex-1 h-12 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {actionLoading ? "Processing..." : "Accept"}
                                            </button>
                                        </div>
                                    )}

                                    {/* Step 2: ACCEPTED - Actions */}
                                    {step.id === "accepted" && (isActive || isCompleted) && (
                                        <div className="flex flex-col gap-2 mt-3">
                                            {/* Mark as Visited Button - Only show if active */}
                                            {status === "ACCEPTED" && (
                                                <button
                                                    onClick={handleMarkVisited}
                                                    disabled={actionLoading}
                                                    className="w-full h-12 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    <IoConstructOutline className="text-xl" />
                                                    {actionLoading ? "Processing..." : "Mark as Visited"}
                                                </button>
                                            )}

                                            {/* Get Directions Button - Visible as long as booking is accepted/visited */}
                                            <button
                                                onClick={handleGetDirections}
                                                className="w-full h-12 bg-emerald-600 text-white text-sm font-bold rounded-[8px] hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-emerald-100"
                                            >
                                                <IoNavigateOutline className="text-xl" />
                                                Get Directions (Open Maps)
                                            </button>
                                        </div>
                                    )}

                                    {/* Step: First Payment Release */}
                                    {step.id === "first-payment" && (
                                        <div className="mt-3">
                                            {booking.payment?.vendorWalletPayments?.siteVisitPayment?.credited ? (
                                                <div className="bg-green-50 rounded-[8px] p-3">
                                                    <p className="text-sm font-semibold text-green-700 mb-1">
                                                        ✓ 1st Payment Credited
                                                    </p>
                                                    <p className="text-xs text-green-600">
                                                        Amount: {formatAmount(booking.payment.vendorWalletPayments.siteVisitPayment.amount || 0)} has been credited to your wallet.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="bg-yellow-50 rounded-[8px] p-3">
                                                    <p className="text-sm font-semibold text-yellow-700 mb-1">
                                                        ⏳ Pending Release
                                                    </p>
                                                    <p className="text-xs text-yellow-600">
                                                        Waiting for admin to release 1st payment (50%).
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Step: Second Payment Release */}
                                    {step.id === "second-payment" && (
                                        <div className="mt-3">
                                            {booking.payment?.vendorWalletPayments?.reportUploadPayment?.credited ? (
                                                <div className="bg-green-50 rounded-[8px] p-3">
                                                    <p className="text-sm font-semibold text-green-700 mb-1">
                                                        ✓ 2nd Payment Credited
                                                    </p>
                                                    <p className="text-xs text-green-600">
                                                        Amount: {formatAmount(booking.payment.vendorWalletPayments.reportUploadPayment.amount || 0)} has been credited to your wallet.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="bg-yellow-50 rounded-[8px] p-3">
                                                    <p className="text-sm font-semibold text-yellow-700 mb-1">
                                                        ⏳ Pending Release
                                                    </p>
                                                    <p className="text-xs text-yellow-600">
                                                        Waiting for admin to release 2nd payment (50%).
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Step: Upload Report */}
                                    {step.id === "upload-report" && status === "VISITED" && !booking.reportUploadedAt && (
                                        <button
                                            onClick={() => navigate(`/vendor/bookings/${bookingId}/upload-report`)}
                                            className="w-full h-12 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors flex items-center justify-center gap-2 mt-3"
                                        >
                                            <IoDocumentTextOutline className="text-xl" />
                                            Upload Report
                                        </button>
                                    )}

                                    {/* Step: Report Approved */}
                                    {step.id === "report-approved" && status === "REPORT_UPLOADED" && (
                                        <div className="mt-3">
                                            {booking.report?.approvedAt ? (
                                                <div className="bg-green-50 rounded-[8px] p-3 mb-2">
                                                    <p className="text-sm font-semibold text-green-700 mb-1">
                                                        ✓ Report Approved
                                                    </p>
                                                    <p className="text-xs text-green-600">
                                                        Approved on {formatDate(booking.report.approvedAt)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="bg-yellow-50 rounded-[8px] p-3 mb-2">
                                                    <p className="text-sm font-semibold text-yellow-700 mb-1">
                                                        ⏳ Pending Approval
                                                    </p>
                                                    <p className="text-xs text-yellow-600">
                                                        Waiting for admin to approve your report.
                                                    </p>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => navigate(`/vendor/bookings/${bookingId}`)}
                                                className="w-full h-12 bg-[#E7F0FB] text-[#0A84FF] text-sm font-medium rounded-[8px] hover:bg-[#D0E1F7] transition-colors flex items-center justify-center gap-2"
                                            >
                                                <IoDocumentTextOutline className="text-xl" />
                                                View Report
                                            </button>
                                        </div>
                                    )}

                                    {/* Step: APPROVED - View Details */}
                                    {step.id === "approved" && status === "APPROVED" && (
                                        <button
                                            onClick={() => navigate(`/vendor/bookings/${bookingId}`)}
                                            className="w-full h-12 bg-[#E7F0FB] text-[#0A84FF] text-sm font-medium rounded-[8px] hover:bg-[#D0E1F7] transition-colors flex items-center justify-center gap-2 mt-3"
                                        >
                                            <IoDocumentTextOutline className="text-xl" />
                                            View Details
                                        </button>
                                    )}

                                    {/* Step: COMPLETED - View Details */}
                                    {step.id === "completed" && status === "COMPLETED" && (
                                        <button
                                            onClick={() => navigate(`/vendor/bookings/${bookingId}`)}
                                            className="w-full h-12 bg-[#E7F0FB] text-[#0A84FF] text-sm font-medium rounded-[8px] hover:bg-[#D0E1F7] transition-colors flex items-center justify-center gap-2 mt-3"
                                        >
                                            <IoDocumentTextOutline className="text-xl" />
                                            View Details
                                        </button>
                                    )}

                                    {/* Step 7: Borewell Result - View Result */}
                                    {step.id === "borewell" && booking.borewellResult && (
                                        <div className="mt-3">
                                            <div className="bg-gray-50 rounded-[8px] p-3 mb-2">
                                                <p className="text-xs font-semibold text-gray-700 mb-1">
                                                    Borewell Result:
                                                </p>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${booking.borewellResult.status === "SUCCESS"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                        }`}
                                                >
                                                    {booking.borewellResult.status}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/vendor/bookings/${bookingId}`)}
                                                className="w-full h-12 bg-[#E7F0FB] text-[#0A84FF] text-sm font-medium rounded-[8px] hover:bg-[#D0E1F7] transition-colors flex items-center justify-center gap-2"
                                            >
                                                <IoImageOutline className="text-xl" />
                                                View Borewell Result
                                            </button>
                                        </div>
                                    )}

                                    {/* Step 8: Settlement - View Settlement Details */}
                                    {step.id === "settlement" && (booking.finalSettlement || booking.payment?.vendorSettlement) && (
                                        <div className="mt-3">
                                            <div className="bg-gray-50 rounded-[8px] p-3 mb-2">
                                                <p className="text-xs font-semibold text-gray-700 mb-1">
                                                    Settlement Status:{" "}
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${(booking.finalSettlement?.status === "PROCESSED" || booking.payment?.vendorSettlement?.status === "COMPLETED" || booking.vendorStatus === "FINAL_SETTLEMENT_COMPLETE" || (booking.finalSettlement?.rewardAmount > 0 || booking.finalSettlement?.penaltyAmount > 0))
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                            }`}
                                                    >
                                                        {(booking.finalSettlement?.status === "PROCESSED" || booking.payment?.vendorSettlement?.status === "COMPLETED" || booking.vendorStatus === "FINAL_SETTLEMENT_COMPLETE" || (booking.finalSettlement?.rewardAmount > 0 || booking.finalSettlement?.penaltyAmount > 0))
                                                            ? "COMPLETE"
                                                            : booking.finalSettlement?.status || booking.payment?.vendorSettlement?.status || "PENDING"}
                                                    </span>
                                                </p>
                                                {(booking.finalSettlement?.rewardAmount > 0 || booking.finalSettlement?.penaltyAmount > 0) ? (
                                                    <p className={`text-sm font-bold mt-2 ${booking.finalSettlement?.rewardAmount > 0
                                                        ? "text-green-600"
                                                        : "text-red-600"
                                                        }`}>
                                                        {booking.finalSettlement?.rewardAmount > 0
                                                            ? `Reward: ${formatAmount(booking.finalSettlement.rewardAmount)}`
                                                            : `Penalty: ${formatAmount(booking.finalSettlement.penaltyAmount)}`
                                                        }
                                                    </p>
                                                ) : booking.payment?.vendorSettlement?.amount ? (
                                                    <p className="text-sm font-bold text-gray-800 mt-2">
                                                        Amount: {formatAmount(booking.payment.vendorSettlement.amount)}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <button
                                                onClick={() => navigate(`/vendor/bookings/${bookingId}`)}
                                                className="w-full h-12 bg-[#E7F0FB] text-[#0A84FF] text-sm font-medium rounded-[8px] hover:bg-[#D0E1F7] transition-colors flex items-center justify-center gap-2"
                                            >
                                                <IoWalletOutline className="text-xl" />
                                                View Settlement Details
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </Fragment>
                        );
                    })}
                </div>
            )}

            {/* Accept Confirmation Modal */}
            <ConfirmModal
                isOpen={showAcceptConfirm}
                onClose={() => setShowAcceptConfirm(false)}
                onConfirm={handleAcceptConfirm}
                title="Accept Booking"
                message="Are you sure you want to accept this booking?"
                confirmText="Yes, Accept"
                cancelText="Cancel"
                confirmColor="primary"
                isLoading={actionLoading}
            />

            {/* Reject Input Modal */}
            <InputModal
                isOpen={showRejectInput}
                onClose={() => setShowRejectInput(false)}
                onSubmit={handleRejectionReasonSubmit}
                title="Reject Booking"
                message="Please provide a reason for rejecting this booking (minimum 10 characters):"
                placeholder="Enter rejection reason..."
                submitText="Continue"
                cancelText="Cancel"
                minLength={10}
            />

            {/* Reject Confirmation Modal */}
            <ConfirmModal
                isOpen={showRejectConfirm}
                onClose={() => {
                    setShowRejectConfirm(false);
                    setRejectionReason("");
                }}
                onConfirm={handleRejectConfirm}
                title="Confirm Rejection"
                message={`Are you sure you want to reject this booking? Reason: ${rejectionReason}`}
                confirmText="Yes, Reject"
                cancelText="Cancel"
                confirmColor="danger"
                isLoading={actionLoading}
            />

            {/* Mark as Visited Confirmation Modal */}
            <ConfirmModal
                isOpen={showVisitConfirm}
                onClose={() => setShowVisitConfirm(false)}
                onConfirm={handleVisitConfirm}
                title="Mark as Visited"
                message="Have you visited the customer's location? This will mark the booking as visited."
                confirmText="Yes, Mark as Visited"
                cancelText="Cancel"
                confirmColor="primary"
                isLoading={actionLoading}
            />

            {/* Map Application Picker Modal */}
            {showMapPicker && (
                <div
                    className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
                    onClick={() => setShowMapPicker(false)}
                >
                    <div
                        className="bg-white w-full max-w-sm rounded-t-[24px] sm:rounded-[24px] overflow-hidden animate-slide-up shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800">Select Map App</h3>
                            <button onClick={() => setShowMapPicker(false)} className="p-2 bg-gray-50 rounded-full">
                                <IoCloseOutline className="text-2xl text-gray-400" />
                            </button>
                        </div>
                        <div className="p-4 grid grid-cols-1 gap-3">
                            <button
                                onClick={() => openMapApp('google')}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-all border border-blue-100 group"
                            >
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                    <IoLogoGoogle className="text-2xl text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-800">Google Maps</p>
                                    <p className="text-xs text-blue-600">Recommended for Android & iOS</p>
                                </div>
                            </button>

                            {/iPhone|iPad|iPod/.test(navigator.userAgent) && (
                                <button
                                    onClick={() => openMapApp('apple')}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200"
                                >
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                        <IoMap className="text-2xl text-gray-800" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-800">Apple Maps</p>
                                        <p className="text-xs text-gray-500">Native iOS Navigation</p>
                                    </div>
                                </button>
                            )}

                            <button
                                onClick={() => openMapApp('waze')}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-sky-50 hover:bg-sky-100 transition-all border border-sky-100"
                            >
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                    <IoNavigateOutline className="text-2xl text-sky-500" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-800">Waze</p>
                                    <p className="text-xs text-sky-600">Live Traffic Updates</p>
                                </div>
                            </button>
                        </div>
                        <div className="p-6 bg-gray-50/50">
                            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                                Selecting an app will open your device's native navigation system. <br />
                                Make sure the app is installed on your phone.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
