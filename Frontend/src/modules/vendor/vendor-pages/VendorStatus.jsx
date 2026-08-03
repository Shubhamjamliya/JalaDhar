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

        // Derive robust effectiveStatus checking milestone fields first
        // so the timeline always reflects actual progress, not just the raw status string
        // Pick the MORE ADVANCED of vendorStatus vs booking.status to avoid divergence
        const _progressOrder = ["ASSIGNED", "ACCEPTED", "VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "APPROVED", "FINAL_SETTLEMENT", "FINAL_SETTLEMENT_COMPLETE", "COMPLETED"];
        const _vIdx = _progressOrder.indexOf(booking.vendorStatus);
        const _sIdx = _progressOrder.indexOf(booking.status);
        const rawStatus = (_vIdx >= _sIdx ? (booking.vendorStatus || booking.status) : booking.status) || booking.status;

        // Build effectiveStatus from actual milestone data
        const hasBorell = booking.borewellResult && booking.borewellResult.uploadedAt && (booking.borewellResult.status === 'SUCCESS' || booking.borewellResult.status === 'FAILED');
        const hasFullPayment = booking.payment?.remainingPaid
            || booking.payment?.status === "SUCCESS"
            || rawStatus === "PAYMENT_SUCCESS"
            || rawStatus === "PAID_FIRST";
        const hasReport = !!(booking.reportUploadedAt || booking.report);
        const hasVisited = !!(booking.visitedAt || ["VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "APPROVED", "FINAL_SETTLEMENT", "FINAL_SETTLEMENT_COMPLETE", "COMPLETED"].includes(rawStatus));
        const hasAccepted = !!(booking.acceptedAt || rawStatus !== "ASSIGNED");

        // Map to statusOrder-compatible string
        // IMPORTANT: always prefer rawStatus when it's already at a later stage
        // to avoid locking the timeline at BOREWELL_UPLOADED when it has already progressed
        const lateStatuses = ["APPROVED", "FINAL_SETTLEMENT", "FINAL_SETTLEMENT_COMPLETE", "COMPLETED", "SUCCESS", "FAILED"];
        const status = lateStatuses.includes(rawStatus) ? rawStatus
            : hasBorell ? "BOREWELL_UPLOADED"
            : hasFullPayment ? "PAYMENT_SUCCESS"
            : hasReport ? "REPORT_UPLOADED"
            : rawStatus;

        // Define status progression for completed check
        const statusOrder = [
            "ASSIGNED", "ACCEPTED", "VISITED",
            "REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "PAID_FIRST",
            "BOREWELL_UPLOADED", "APPROVED", "FINAL_SETTLEMENT", "FINAL_SETTLEMENT_COMPLETE", "COMPLETED"
        ];
        const currentStatusIndex = statusOrder.indexOf(status);
        const effectiveIndex = currentStatusIndex === -1
            ? (rawStatus === "SUCCESS" || rawStatus === "FAILED" ? 11 : 0)
            : currentStatusIndex;

        const steps = [
            {
                id: "assigned",
                label: "Booking Assigned",
                icon: IoPersonOutline,
                active: rawStatus === "ASSIGNED",
                completed: hasAccepted && rawStatus !== "ASSIGNED",
                description: "Booking has been assigned to you. Please accept or reject.",
                date: booking.assignedAt,
            },
            {
                id: "accepted",
                label: "Booking Accepted",
                icon: IoCheckmarkCircleOutline,
                active: rawStatus === "ACCEPTED",
                completed: hasVisited,
                description: "You have accepted the booking. You can mark as visited.",
                date: booking.acceptedAt,
            },
            {
                id: "visited",
                label: "Site Visited",
                icon: IoConstructOutline,
                active: rawStatus === "VISITED" && !hasReport,
                completed: hasReport || effectiveIndex > 2,
                description: "You have visited the customer site.",
                date: booking.visitedAt,
            },
            {
                id: "first-payment",
                label: "1st Payment Release",
                icon: IoWalletOutline,
                active: hasVisited && !booking.payment?.vendorWalletPayments?.siteVisitPayment?.credited && !hasReport,
                completed: booking.payment?.vendorWalletPayments?.siteVisitPayment?.credited || hasReport,
                description: booking.payment?.vendorWalletPayments?.siteVisitPayment?.credited
                    ? "1st payment (50%) has been credited to your wallet."
                    : "1st payment (50%) is pending release from admin.",
                date: booking.payment?.vendorWalletPayments?.siteVisitPayment?.creditedAt,
            },
            {
                id: "upload-report",
                label: "Upload Report",
                icon: IoDocumentTextOutline,
                active: hasVisited && !hasReport,
                completed: hasReport,
                description: "Please upload the service report after receiving 1st payment.",
                date: booking.reportUploadedAt || booking.report?.uploadedAt || null,
            },
            {
                id: "report-approved",
                label: "Report Approved",
                icon: IoCheckmarkCircleOutline,
                active: hasReport && !booking.report?.approvedAt && !hasFullPayment,
                completed: !!booking.report?.approvedAt || hasFullPayment,
                description: booking.report?.approvedAt
                    ? "Your report has been approved by admin."
                    : hasReport
                        ? "Waiting for admin to approve your report."
                        : "Report not yet uploaded.",
                date: booking.report?.approvedAt,
            },
            {
                id: "customer-payment",
                label: "Customer Final Payment",
                icon: IoWalletOutline,
                active: hasReport && !hasFullPayment,
                completed: hasFullPayment,
                description: hasFullPayment
                    ? "Customer has completed the 60% final payment. ✅"
                    : booking.report?.approvedAt
                        ? "Awaiting customer's 60% final payment."
                        : "Waiting for report approval before customer can pay.",
                date: booking.payment?.remainingPaidAt,
            },
            {
                id: "second-payment",
                label: "2nd Platform Payout",
                icon: IoWalletOutline,
                active: hasFullPayment && !booking.payment?.vendorWalletPayments?.reportUploadPayment?.credited,
                completed: booking.payment?.vendorWalletPayments?.reportUploadPayment?.credited || hasBorell,
                description: booking.payment?.vendorWalletPayments?.reportUploadPayment?.credited
                    ? "2nd payout (50%) has been credited to your wallet."
                    : hasFullPayment
                        ? "Your 2nd payout is pending release from admin after customer payment."
                        : "Waiting for customer payment before payout release.",
                date: booking.payment?.vendorWalletPayments?.reportUploadPayment?.creditedAt,
            },
            {
                id: "borewell",
                label: "Borewell Result Uploaded",
                icon: IoImageOutline,
                active: hasFullPayment && !hasBorell,
                completed: hasBorell && (effectiveIndex > statusOrder.indexOf("BOREWELL_UPLOADED")),
                description: hasBorell
                    ? "Customer has uploaded borewell result. Waiting for admin to approve and process final settlement."
                    : hasFullPayment
                        ? "Customer will now drill borewell at your report location points and upload result."
                        : "Waiting for customer to complete payment before borewell phase.",
                date: booking.borewellResult?.uploadedAt,
            },
            {
                id: "approved",
                label: "Admin Approved",
                icon: IoCheckmarkCircleOutline,
                active: rawStatus === "APPROVED",
                completed: effectiveIndex > statusOrder.indexOf("APPROVED") || rawStatus === "FINAL_SETTLEMENT_COMPLETE" || rawStatus === "COMPLETED",
                description: "Admin has approved the borewell result. Waiting for final settlement processing.",
                date: booking.borewellResult?.approvedAt,
            },
            {
                id: "settlement",
                label: "Final Settlement Complete",
                icon: IoWalletOutline,
                active: rawStatus === "FINAL_SETTLEMENT_COMPLETE",
                completed: rawStatus === "FINAL_SETTLEMENT_COMPLETE" ||
                    rawStatus === "COMPLETED" ||
                    booking.finalSettlement?.status === "PROCESSED" ||
                    booking.finalSettlement?.rewardAmount > 0 ||
                    booking.finalSettlement?.penaltyAmount > 0 ||
                    booking.payment?.vendorSettlement?.status === "COMPLETED",
                description: (booking.finalSettlement?.rewardAmount > 0 || booking.finalSettlement?.penaltyAmount > 0) ||
                    booking.finalSettlement?.status === "PROCESSED" ||
                    booking.vendorStatus === "FINAL_SETTLEMENT_COMPLETE" ||
                    booking.payment?.vendorSettlement?.status === "COMPLETED"
                    ? `Admin has processed your final settlement. ${booking.finalSettlement?.rewardAmount > 0 ? `Reward of ₹${booking.finalSettlement.rewardAmount.toLocaleString('en-IN')} credited.` : booking.finalSettlement?.penaltyAmount > 0 ? `Penalty of ₹${booking.finalSettlement.penaltyAmount.toLocaleString('en-IN')} deducted.` : 'All payments completed.'}`
                    : "Waiting for admin to process final settlement.",
                date: booking.finalSettlement?.processedAt || booking.payment?.vendorSettlement?.settledAt,
            },
            {
                id: "completed",
                label: "Completed",
                icon: IoCheckmarkCircleOutline,
                active: ["COMPLETED", "FINAL_SETTLEMENT_COMPLETE", "SUCCESS", "FAILED"].includes(rawStatus),
                completed: ["COMPLETED", "FINAL_SETTLEMENT_COMPLETE", "SUCCESS", "FAILED"].includes(rawStatus),
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
    // Pick the MORE ADVANCED of vendorStatus vs booking.status to avoid divergence
    const _progressOrder = ["ASSIGNED", "ACCEPTED", "VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "APPROVED", "FINAL_SETTLEMENT", "FINAL_SETTLEMENT_COMPLETE", "COMPLETED"];
    const _vIdx2 = _progressOrder.indexOf(booking?.vendorStatus);
    const _sIdx2 = _progressOrder.indexOf(booking?.status);
    const rawStatus = (_vIdx2 >= _sIdx2 ? (booking?.vendorStatus || booking?.status) : booking?.status) || booking?.status;

    // Derive milestone flags at component level for use in JSX
    const hasBorell = booking?.borewellResult && booking.borewellResult.uploadedAt && (booking.borewellResult.status === 'SUCCESS' || booking.borewellResult.status === 'FAILED');
    const hasFullPayment = booking?.payment?.remainingPaid
        || booking?.payment?.status === "SUCCESS"
        || rawStatus === "PAYMENT_SUCCESS"
        || rawStatus === "PAID_FIRST";
    const hasReport = !!(booking?.reportUploadedAt || booking?.report);

    return (
        <div
            ref={containerRef}
            className="min-h-screen bg-[#F6F7F9] pb-10"
            style={{
                transform: pullDistance > 0 ? `translateY(${Math.min(pullDistance, 100)}px)` : 'none',
                transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
            }}
        >
            {/* Header with Title and "View Details" button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-4">
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Booking Status</h1>
                <button
                    onClick={() => navigate(`/vendor/bookings/${bookingId}`)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#0A84FF] rounded-xl text-base font-bold shadow-sm border border-blue-50 hover:bg-blue-50 transition-all active:scale-95"
                >
                    <IoDocumentTextOutline className="text-xl" />
                    Full Booking Details
                </button>
            </div>
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
                <div className="text-center py-12 bg-white rounded-3xl p-6 shadow-sm border border-gray-50">
                    <p className="text-gray-500 font-medium">No status information available</p>
                </div>
            ) : (
                <div className="relative pl-2">
                    {/* Continuous Vertical Line */}
                    <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-gray-100 z-0"></div>

                    <div className="space-y-8">
                        {steps.map((step, index) => {
                            const StepIcon = step.icon;
                            const isActive = step.active;
                            const isCompleted = step.completed;

                            return (
                                <div key={step.id} className="relative flex gap-6">
                                    {/* Timeline Marker */}
                                    <div className="relative z-10 flex-shrink-0">
                                        <div
                                            className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 ${isCompleted
                                                ? "bg-[#00C2A8] text-white"
                                                : isActive
                                                    ? "bg-[#0A84FF] text-white scale-110 shadow-lg shadow-blue-100"
                                                    : "bg-white border border-gray-100 text-gray-300"
                                                }`}
                                        >
                                            {isCompleted ? (
                                                <IoCheckmarkCircleOutline className="text-2xl" />
                                            ) : (
                                                <StepIcon className="text-xl" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Step Content Card */}
                                    <div
                                        className={`flex-1 rounded-2xl bg-white p-5 shadow-sm border transition-all duration-300 ${isActive
                                            ? "border-[#0A84FF] ring-4 ring-blue-50/50"
                                            : isCompleted
                                                ? "border-emerald-50"
                                                : "border-gray-50 opacity-80"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className={`text-base font-black tracking-tight ${isActive ? "text-[#0A84FF]" : "text-gray-800"}`}>
                                                {step.label}
                                            </h3>
                                            {step.date && (
                                                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                                                    {formatDate(step.date)}
                                                </span>
                                            )}
                                        </div>

                                        <p className={`text-sm leading-relaxed ${isActive || isCompleted ? "text-gray-600" : "text-gray-400"}`}>
                                            {step.description}
                                        </p>

                                        {/* Simplified card content - removed internal actions */}
                                        {(step.id === "first-payment" || step.id === "second-payment") && (
                                            <div className={`mt-3 p-3 rounded-xl border flex items-center gap-3 ${(step.id === "first-payment" ? booking.payment?.vendorWalletPayments?.siteVisitPayment?.credited : booking.payment?.vendorWalletPayments?.reportUploadPayment?.credited)
                                                    ? "bg-emerald-50 border-emerald-100" : "bg-orange-50 border-orange-100"
                                                }`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${(step.id === "first-payment" ? booking.payment?.vendorWalletPayments?.siteVisitPayment?.credited : booking.payment?.vendorWalletPayments?.reportUploadPayment?.credited) ? "bg-emerald-500 text-white" : "bg-orange-500 text-white"}`}>
                                                    <IoWalletOutline className="text-lg" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-800">
                                                        {(step.id === "first-payment" ? booking.payment?.vendorWalletPayments?.siteVisitPayment?.credited : booking.payment?.vendorWalletPayments?.reportUploadPayment?.credited) ? "Payment Credited" : "Pending Release"}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500">
                                                        {formatAmount((step.id === "first-payment" ? booking.payment?.vendorWalletPayments?.siteVisitPayment?.amount : booking.payment?.vendorWalletPayments?.reportUploadPayment?.amount) || 0)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Active Actions Section - Below Booking Status */}
            {rawStatus && !["CANCELLED", "REJECTED", "COMPLETED"].includes(rawStatus) && (
                <div className="mt-12 mb-8 animate-slide-up">
                    <div className="bg-white rounded-[24px] p-6 shadow-[0px_20px_40px_rgba(0,0,0,0.08)] border border-blue-50/50 relative overflow-hidden">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/30 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                        <div className="relative z-10">
                            <h2 className="text-lg font-black text-gray-800 mb-5 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-[#0A84FF] rounded-full"></span>
                                {hasFullPayment && !hasBorell ? "What Happens Next?" : "Required Action"}
                            </h2>

                            {/* ASSIGNED ACTIONS */}
                            {rawStatus === "ASSIGNED" && (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={handleReject}
                                        disabled={actionLoading}
                                        className="flex-1 h-14 bg-red-50 text-red-600 text-base font-bold rounded-2xl hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        Reject Booking
                                    </button>
                                    <button
                                        onClick={handleAccept}
                                        disabled={actionLoading}
                                        className="flex-[2] h-14 bg-[#0A84FF] text-white text-base font-black rounded-2xl hover:bg-[#005BBB] transition-all active:scale-95 shadow-xl shadow-blue-100 disabled:opacity-50"
                                    >
                                        Accept Booking Now
                                    </button>
                                </div>
                            )}

                            {/* ACCEPTED ACTIONS */}
                            {rawStatus === "ACCEPTED" && (
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleMarkVisited}
                                        disabled={actionLoading}
                                        className="w-full h-14 bg-[#0A84FF] text-white text-base font-black rounded-2xl hover:bg-[#005BBB] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-blue-100"
                                    >
                                        <IoConstructOutline className="text-2xl" />
                                        Mark Site Visited
                                    </button>
                                    <button
                                        onClick={handleGetDirections}
                                        className="w-full h-13 bg-white text-emerald-600 text-sm font-bold rounded-2xl border-2 border-emerald-50 hover:bg-emerald-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <IoNavigateOutline className="text-xl" />
                                        Get Site Directions
                                    </button>
                                </div>
                            )}

                            {/* VISITED ACTIONS — upload report */}
                            {rawStatus === "VISITED" && !hasReport && (
                                <button
                                    onClick={() => navigate(`/vendor/bookings/${bookingId}/upload-report`)}
                                    className="w-full h-14 bg-[#0A84FF] text-white text-base font-black rounded-2xl hover:bg-[#005BBB] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-blue-100"
                                >
                                    <IoDocumentTextOutline className="text-2xl" />
                                    Upload Technical Report
                                </button>
                            )}

                            {/* REPORT UPLOADED / AWAITING CUSTOMER PAYMENT */}
                            {hasReport && !hasFullPayment && (
                                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white shrink-0">
                                        <IoTimeOutline className="text-2xl" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-orange-800 text-sm">Waiting for Customer's Final 60% Payment</p>
                                        <p className="text-xs text-orange-600 mt-0.5">Customer is reviewing your report and will complete payment soon. Your 2nd payout will be released automatically.</p>
                                    </div>
                                </div>
                            )}

                            {/* CUSTOMER PAID — waiting for borewell */}
                            {hasFullPayment && !hasBorell && (
                                <div className="space-y-3">
                                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0">
                                            <IoCheckmarkCircleOutline className="text-2xl" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-emerald-800 text-sm">Customer Has Paid 100% — Job Done! ✅</p>
                                            <p className="text-xs text-emerald-700 mt-0.5">Customer is now proceeding to drill borewell at your recommended GPS location points.</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 text-center font-medium">Your 2nd payout will be processed by admin after report approval. No action needed from you at this stage.</p>
                                </div>
                            )}
                        </div>
                    </div>
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
