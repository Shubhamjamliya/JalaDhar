import { useState, useEffect, Fragment, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
    IoHourglassOutline,
    IoPersonOutline,
    IoConstructOutline,
    IoCheckmarkCircleOutline,
    IoDocumentTextOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoCalendarOutline,
    IoSearchOutline,
    IoCloseOutline,
    IoImageOutline,
    IoCloseCircleOutline,
    IoWalletOutline,
    IoRefreshOutline,
    IoCarOutline,
    IoCallOutline,
    IoChatbubbleEllipsesOutline,
    IoHelpCircleOutline,
    IoNavigateOutline,
    IoStarOutline,
    IoReloadOutline,
    IoDownloadOutline,

} from "react-icons/io5";
import {
    getUserBookings,
    uploadBorewellResult,
    getBookingDetails,
    cancelBooking,
    getAvailableReplacementVendors,
    reassignReplacementVendor,
    claimFullRefundForExpertCancellation
} from "../../../services/bookingApi";
import { useNotifications } from "../../../contexts/NotificationContext";
import { usePullToRefresh } from "../../../hooks/usePullToRefresh";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import PageContainer from "../../shared/components/PageContainer";
import InputModal, { CANCELLATION_REASONS } from "../../shared/components/InputModal";
import ConfirmModal from "../../shared/components/ConfirmModal";
import CancellationPolicyModal from "../../shared/components/CancellationPolicyModal";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";

export default function UserStatus() {
    const navigate = useNavigate();
    const location = useLocation();
    const { bookingId: bookingIdFromParams } = useParams();
    const { socket } = useNotifications();
    const [loading, setLoading] = useState(true);
    const [currentBooking, setCurrentBooking] = useState(null);
    const toast = useToast();
    const [showBorewellModal, setShowBorewellModal] = useState(false);
    const [borewellData, setBorewellData] = useState({
        status: "",
        images: []
    });
    const [uploadingBorewell, setUploadingBorewell] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [showCancellationInput, setShowCancellationInput] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("");
    
    // Expert Cancellation Resolution States
    const [showReplacementModal, setShowReplacementModal] = useState(false);
    const [replacementVendors, setReplacementVendors] = useState([]);
    const [loadingReplacements, setLoadingReplacements] = useState(false);
    const [selectedReplacementVendor, setSelectedReplacementVendor] = useState(null);
    const [selectedNewDate, setSelectedNewDate] = useState("");
    const [selectedNewTime, setSelectedNewTime] = useState("10:00 AM");
    const [reassigning, setReassigning] = useState(false);
    const [showRefundConfirmModal, setShowRefundConfirmModal] = useState(false);
    const [claimingRefund, setClaimingRefund] = useState(false);

    const loadCurrentBookingRef = useRef(null);
    const lastActionTimeRef = useRef(0); // Track when user performed an action
    const ACTION_COOLDOWN = 2000; // 2 seconds - ignore socket updates right after user action

    // Retry loading booking if it was just created (define before loadCurrentBooking uses it)
    const loadWithRetry = async (bookingId, retries = 3) => {
        try {
            for (let i = 0; i < retries; i++) {
                try {
                    const response = await getUserBookings({
                        status: undefined,
                        limit: 10
                    });

                    if (response.success) {
                        const bookings = response.data.bookings || [];
                        // Find booking by ID (check both id and _id formats)
                        const booking = bookings.find(b => {
                            const bid = b.id || b._id;
                            return bid === bookingId || bid?.toString() === bookingId?.toString();
                        }) || bookings.find(b => !["COMPLETED", "CANCELLED", "REJECTED", "FAILED", "SUCCESS"].includes(b.status))
                            || bookings[0];

                        if (booking) {
                            setCurrentBooking(booking);
                            setLoading(false);
                            return;
                        }
                    }

                    // If not found and not last retry, wait a bit
                    if (i < retries - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (err) {
                    if (i === retries - 1) {
                        throw err;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            // If still not found after retries, try to get any active booking
            const response = await getUserBookings({
                status: undefined,
                limit: 10
            });

            if (response.success) {
                const bookings = response.data.bookings || [];
                const activeBooking = bookings.find(b => !["COMPLETED", "CANCELLED", "REJECTED", "FAILED", "SUCCESS"].includes(b.status)) || bookings[0];
                if (activeBooking) {
                    setCurrentBooking(activeBooking);
                }
            } else {
                toast.showWarning("Booking not found. It may still be processing.");
            }
        } catch (err) {
            handleApiError(err, "Failed to load booking. Please try refreshing the page.");
        } finally {
            setLoading(false);
        }
    };

    const loadCurrentBooking = async () => {
        try {
            setLoading(true);

            // Get bookingId from URL params or location state
            const bookingId = bookingIdFromParams || location.state?.bookingId;

            if (bookingId) {
                // If specific booking ID provided, try to get it directly using getBookingDetails
                try {
                    const response = await getBookingDetails(bookingId);
                    if (response.success) {
                        setCurrentBooking(response.data.booking);
                        setLoading(false);
                        return;
                    } else {
                        // Fallback to loadWithRetry if getBookingDetails fails
                        await loadWithRetry(bookingId);
                        return;
                    }
                } catch (err) {
                    // Fallback to loadWithRetry
                    await loadWithRetry(bookingId);
                    return;
                }
            } else {
                // No bookingId provided - find the most recent active booking
                try {
                    const response = await getUserBookings({
                        status: undefined,
                        limit: 10
                    });

                    if (response.success) {
                        const bookings = response.data.bookings || [];
                        // Find the most recent active (non-terminal) booking
                        const activeBooking = bookings.find(b =>
                            !["COMPLETED", "CANCELLED", "REJECTED", "FAILED", "SUCCESS"].includes(b.status)
                        ) || bookings[0]; // Fall back to most recent booking

                        if (activeBooking) {
                            setCurrentBooking(activeBooking);
                        }
                    }
                } catch (err) {
                    handleApiError(err, "Failed to load bookings");
                }
            }
        } catch (err) {
            handleApiError(err, "Failed to load booking status");
        } finally {
            setLoading(false);
        }
    };

    // Store loadCurrentBooking in ref for socket listeners
    useEffect(() => {
        loadCurrentBookingRef.current = loadCurrentBooking;
    }, []);

    // Load data on mount and when location changes (navigation back)
    useEffect(() => {
        loadCurrentBooking();
    }, [location.pathname, bookingIdFromParams]);

    // Reload booking when bookingId from URL params changes
    useEffect(() => {
        if (bookingIdFromParams) {
            loadCurrentBooking();
        }
    }, [bookingIdFromParams]);

    // Refetch when page becomes visible (user switches tabs/windows)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadCurrentBooking();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Listen to socket notifications for booking status updates (ONLY for external changes)
    useEffect(() => {
        if (!socket || !currentBooking) return;

        const bookingId = currentBooking.id || currentBooking._id;
        if (!bookingId) return;

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
                // These are changes from other users (vendor, admin, etc.)
                if (notification.type === 'BOOKING_STATUS_UPDATED' ||
                    notification.type === 'BOOKING_ACCEPTED' ||
                    notification.type === 'BOOKING_EN_ROUTE' ||
                    notification.type === 'BOOKING_VISITED' ||
                    notification.type === 'REPORT_UPLOADED' ||
                    notification.type === 'ADMIN_APPROVED' ||
                    notification.type === 'PAYMENT_RELEASE') {
                    if (loadCurrentBookingRef.current) {
                        loadCurrentBookingRef.current();
                    }
                }
            }
        };

        const handleDirectBookingUpdate = (data) => {
            console.log('[UserStatus] Direct booking update received via socket:', data);
            if (loadCurrentBookingRef.current) {
                loadCurrentBookingRef.current();
            }
        };

        socket.on('new_notification', handleNewNotification);
        socket.on('booking_status_updated', handleDirectBookingUpdate);
        socket.on('booking_updated', handleDirectBookingUpdate);
        socket.on('booking_assigned', handleDirectBookingUpdate);

        return () => {
            socket.off('new_notification', handleNewNotification);
            socket.off('booking_status_updated', handleDirectBookingUpdate);
            socket.off('booking_updated', handleDirectBookingUpdate);
            socket.off('booking_assigned', handleDirectBookingUpdate);
        };
    }, [socket, currentBooking]);

    // Pull-to-refresh functionality
    const { isRefreshing, pullDistance, containerRef, canRefresh } = usePullToRefresh(
        loadCurrentBooking,
        { threshold: 80, resistance: 2.5 }
    );

    const getStatusSteps = () => {
        if (!currentBooking) return [];

        // Use userStatus for user view
        const status = currentBooking.userStatus || currentBooking.status;
        const remainingPaid = currentBooking.payment?.remainingPaid || false;
        const borewellUploaded = !!currentBooking.borewellResult?.uploadedAt;

        // Define status progression for completed check
        const statusOrder = ["PENDING", "ASSIGNED", "ACCEPTED", "EN_ROUTE", "VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT", "COMPLETED"];
        const currentStatusIndex = statusOrder.indexOf(status);
        // If status not found, assume we're past all steps if we have payment or borewell
        const effectiveIndex = currentStatusIndex === -1 ? (remainingPaid || borewellUploaded ? 11 : 0) : currentStatusIndex;

        const steps = [
            {
                id: "booking-requested",
                label: "Booking Requested",
                icon: IoDocumentTextOutline,
                active: ["AWAITING_ADVANCE", "PENDING"].includes(status) && !currentBooking.payment?.advancePaid,
                completed: true, // Always completed when booking is created
                description: "Booking request submitted successfully.",
                date: currentBooking.createdAt,
            },
            {
                id: "advance-payment-received",
                label: "Advance Payment Received",
                icon: IoWalletOutline,
                active: status === "PENDING" && currentBooking.payment?.advancePaid && !currentBooking.acceptedAt,
                completed: currentBooking.payment?.advancePaid || !["AWAITING_ADVANCE"].includes(status),
                description: "40% survey fee and applicable travel charges paid.",
                date: currentBooking.payment?.advancePaidAt || currentBooking.createdAt,
            },
            {
                id: "booking-confirmed",
                label: "Booking Confirmed",
                icon: IoCheckmarkCircleOutline,
                active: ["ASSIGNED", "ACCEPTED"].includes(status) && !["EN_ROUTE", "ARRIVED", "IN_PROGRESS", "VISITED"].includes(status),
                completed: ["ACCEPTED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS", "VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT", "COMPLETED"].includes(status) || !!currentBooking.acceptedAt,
                description: "Expert assigned and survey scheduled.",
                date: currentBooking.acceptedAt || currentBooking.assignedAt,
            },
            {
                id: "expert-en-route",
                label: "Expert En Route",
                icon: IoCarOutline,
                active: status === "EN_ROUTE",
                completed: ["ARRIVED", "IN_PROGRESS", "VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT", "COMPLETED"].includes(status) || !!currentBooking.visitedAt || !!currentBooking.reportUploadedAt,
                description: "Expert is travelling to the survey location.",
                date: currentBooking.enRouteAt,
            },
            {
                id: "expert-arrived",
                label: "Expert Arrived",
                icon: IoLocationOutline,
                active: status === "ARRIVED",
                completed: ["IN_PROGRESS", "VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT", "COMPLETED"].includes(status) || !!currentBooking.visitedAt || !!currentBooking.reportUploadedAt,
                description: "Expert has reached the survey land.",
                date: currentBooking.arrivedAt,
            },
            {
                id: "survey-started",
                label: "Survey Started",
                icon: IoConstructOutline,
                active: ["IN_PROGRESS", "VISITED"].includes(status) && !currentBooking.otp?.endSurvey?.verified && !currentBooking.reportUploadedAt,
                completed: !!currentBooking.otp?.endSurvey?.verified || ["REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT", "COMPLETED"].includes(status) || !!currentBooking.reportUploadedAt,
                description: "Groundwater survey is in progress.",
                date: currentBooking.visitedAt,
            },
            {
                id: "survey-completed",
                label: "Survey Completed",
                icon: IoDocumentTextOutline,
                active: (!!currentBooking.otp?.endSurvey?.verified || status === "REPORT_UPLOADED") && !currentBooking.payment?.remainingPaid,
                completed: ["REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT", "COMPLETED"].includes(status) || !!currentBooking.reportUploadedAt,
                bullets: currentBooking.reportUploadedAt ? [
                    "Survey completed successfully.",
                    "Survey report securely uploaded by the expert.",
                    "Report will be available once final payment is completed."
                ] : [
                    "Site survey completed & verified with End OTP.",
                    "Expert is currently compiling the technical survey report.",
                    "Report will be available once uploaded."
                ],
                date: currentBooking.endSurveyVerifiedAt || currentBooking.otp?.endSurvey?.verifiedAt || currentBooking.reportUploadedAt,
            },
            {
                id: "final-payment-pending",
                label: "Final Payment Pending",
                icon: IoHourglassOutline,
                active: ["REPORT_UPLOADED", "AWAITING_PAYMENT"].includes(status) && !currentBooking.payment?.remainingPaid,
                completed: currentBooking.payment?.remainingPaid || ["PAYMENT_SUCCESS", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT", "COMPLETED"].includes(status),
                description: "Please pay the remaining 60% of the survey fee to access your survey report.",
                date: currentBooking.reportUploadedAt,
            },
            {
                id: "final-payment-successful",
                label: "Final Payment Successful",
                icon: IoCheckmarkCircleOutline,
                active: currentBooking.payment?.remainingPaid && status === "PAYMENT_SUCCESS" && !borewellUploaded,
                completed: currentBooking.payment?.remainingPaid || ["PAYMENT_SUCCESS", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT", "COMPLETED"].includes(status),
                bullets: [
                    "Remaining payment received successfully.",
                    "Payment receipt generated."
                ],
                date: currentBooking.payment?.remainingPaidAt,
            },
            {
                id: "survey-report-unlocked",
                label: "Survey Report Available",
                icon: IoDocumentTextOutline,
                active: currentBooking.payment?.remainingPaid && ["PAYMENT_SUCCESS", "BOREWELL_UPLOADED"].includes(status),
                completed: currentBooking.payment?.remainingPaid && ["PAYMENT_SUCCESS", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT", "COMPLETED"].includes(status),
                description: "Survey report is now available to view and download.",
                date: currentBooking.payment?.remainingPaidAt,
            },
            {
                id: "booking-completed",
                label: "Booking Completed",
                icon: IoCheckmarkCircleOutline,
                active: status === "COMPLETED",
                completed: status === "COMPLETED",
                bullets: [
                    "Service completed successfully.",
                    "Rate & Review the expert.",
                    "Download invoice.",
                    "Raise a dispute (within the applicable dispute period)."
                ],
                date: currentBooking.completedAt || currentBooking.payment?.vendorSettlement?.settledAt,
            },
        ];

        return steps;
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

    const handleContactSupport = () => {
        navigate("/user/help-support");
    };

    const handleCallExpert = (phone) => {
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (phone && isMobile) {
            window.location.href = `tel:${phone}`;
        } else {
            setShowSupportModal(true);
        }
    };

    const handleChat = () => {
        toast.showInfo("Opening expert live chat...");
    };

    const handleTrackExpert = () => {
        if (currentBooking) {
            navigate(`/user/booking/${currentBooking.id || currentBooking._id}/tracking`);
        }
    };

    const handleReschedule = () => {
        toast.showInfo("To reschedule your survey appointment, please contact support.");
    };

    const handleCancelBooking = () => {
        setShowCancellationInput(true);
    };

    const handleCancellationReasonSubmit = (reason) => {
        setCancellationReason(reason);
        setShowCancellationInput(false);
        setShowCancelConfirm(true);
    };

    const handleConfirmCancellation = async () => {
        setShowCancelConfirm(false);
        try {
            setCancelling(true);
            const bookingId = currentBooking.id || currentBooking._id;
            const res = await cancelBooking(bookingId, cancellationReason || "Cancelled by user");
            if (res.success) {
                toast.showSuccess("Booking cancelled successfully. Refund initiated.");
                if (loadCurrentBookingRef.current) {
                    await loadCurrentBookingRef.current();
                }
            } else {
                toast.showError(res.message || "Failed to cancel booking");
            }
        } catch (err) {
            handleApiError(err, "Failed to cancel booking. Please try again.");
        } finally {
            setCancelling(false);
        }
    };

    const handleRebook = () => {
        navigate("/user/booking");
    };

    const handleRateReview = () => {
        navigate("/user/ratings");
    };

    const handleViewRefundStatus = () => {
        navigate("/user/wallet");
    };

    const handleViewDisputeStatus = () => {
        navigate("/user/disputes");
    };

    // Expert Cancellation Handlers
    const handleOpenReplacementModal = async () => {
        const bookingId = currentBooking?.id || currentBooking?._id;
        if (!bookingId) return;
        try {
            setLoadingReplacements(true);
            setShowReplacementModal(true);
            const res = await getAvailableReplacementVendors(bookingId);
            if (res.success && res.data?.replacementVendors) {
                setReplacementVendors(res.data.replacementVendors);
                if (res.data.replacementVendors.length > 0) {
                    setSelectedReplacementVendor(res.data.replacementVendors[0]);
                }
                // Pre-fill next day date if available
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedNewDate(tomorrow.toISOString().split('T')[0]);
            }
        } catch (err) {
            handleApiError(err, "Failed to load replacement experts");
        } finally {
            setLoadingReplacements(false);
        }
    };

    const handleConfirmReassign = async () => {
        if (!selectedReplacementVendor) {
            toast.showError("Please select a replacement expert");
            return;
        }
        if (!selectedNewDate) {
            toast.showError("Please choose a new survey date");
            return;
        }
        const bookingId = currentBooking?.id || currentBooking?._id;
        try {
            setReassigning(true);
            const res = await reassignReplacementVendor(bookingId, {
                vendorId: selectedReplacementVendor._id || selectedReplacementVendor.id,
                scheduledDate: selectedNewDate,
                scheduledTime: selectedNewTime || "10:00 AM"
            });
            if (res.success) {
                toast.showSuccess("Survey rescheduled with replacement expert at ₹0 extra fee!");
                setShowReplacementModal(false);
                if (loadCurrentBookingRef.current) {
                    await loadCurrentBookingRef.current();
                }
            } else {
                toast.showError(res.message || "Failed to reassign expert");
            }
        } catch (err) {
            handleApiError(err, "Failed to reassign expert");
        } finally {
            setReassigning(false);
        }
    };

    const handleConfirmClaimRefund = async () => {
        const bookingId = currentBooking?.id || currentBooking?._id;
        try {
            setClaimingRefund(true);
            const res = await claimFullRefundForExpertCancellation(bookingId);
            if (res.success) {
                toast.showSuccess(res.message || "100% Full Refund credited to your wallet!");
                setShowRefundConfirmModal(false);
                if (loadCurrentBookingRef.current) {
                    await loadCurrentBookingRef.current();
                }
            } else {
                toast.showError(res.message || "Failed to claim refund");
            }
        } catch (err) {
            handleApiError(err, "Failed to process 100% refund");
        } finally {
            setClaimingRefund(false);
        }
    };

    const handleBorewellImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setBorewellData({
            ...borewellData,
            images: [...borewellData.images, ...newImages],
        });
    };

    const handleRemoveBorewellImage = (index) => {
        const newImages = borewellData.images.filter((_, i) => i !== index);
        setBorewellData({ ...borewellData, images: newImages });
    };

    const handleSubmitBorewellResult = async () => {
        if (!borewellData.status) {
            toast.showError("Please select a result status (Success or Failed)");
            return;
        }

        if (!currentBooking) {
            toast.showError("Booking not found");
            return;
        }

        const bookingId = currentBooking.id || currentBooking._id;

        const loadingToast = toast.showLoading("Uploading borewell result...");
        try {
            setUploadingBorewell(true);
            // Mark that user performed an action (prevent socket from triggering duplicate update)
            lastActionTimeRef.current = Date.now();

            const response = await uploadBorewellResult(bookingId, {
                status: borewellData.status,
                images: borewellData.images.map((img) => img.file),
            });

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Borewell result uploaded successfully!");
                setShowBorewellModal(false);
                setBorewellData({ status: "", images: [] });
                // Update state immediately via React (not waiting for socket)
                await loadCurrentBooking();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to upload borewell result");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to upload borewell result");
        } finally {
            setUploadingBorewell(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading booking status..." />;
    }

    // Show nice message if no booking found
    if (!currentBooking) {
        return (
            <PageContainer className="py-12">
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                    {/* Empty State Illustration */}
                    <div className="mb-6 w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <IoCalendarOutline className="text-5xl text-blue-500" />
                    </div>

                    {/* Heading */}
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">
                        No Active Booking
                    </h2>

                    {/* Description */}
                    <p className="text-gray-600 mb-6 max-w-md">
                        You don't have any active bookings at the moment. Start by booking a service to track its status here.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => navigate("/user/serviceprovider")}
                            className="flex items-center justify-center gap-2 bg-[#0A84FF] text-white px-6 py-3 rounded-[12px] font-semibold hover:bg-[#005BBB] transition-colors shadow-[0px_4px_10px_rgba(10,132,255,0.2)]"
                        >
                            <IoSearchOutline className="text-xl" />
                            Find an Expert
                        </button>
                        <button
                            onClick={() => navigate("/user/status")}
                            className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-[12px] font-semibold hover:bg-gray-50 transition-colors shadow-[0px_4px_10px_rgba(0,0,0,0.05)] border border-gray-200"
                        >
                            <IoDocumentTextOutline className="text-xl" />
                            View Bookings
                        </button>
                    </div>
                </div>
            </PageContainer>
        );
    }


    const steps = getStatusSteps();
    const vendor = currentBooking?.vendor;
    // Use userStatus for user view
    const status = currentBooking?.userStatus || currentBooking?.status;

    const completedStepsCount = steps.filter(s => s.completed).length;
    const progressPercent = steps.length ? Math.min(100, Math.round(((completedStepsCount + (steps.some(s => s.active) ? 0.5 : 0)) / steps.length) * 100)) : 0;


    return (
        <div
            ref={containerRef}
            className="w-full max-w-7xl mx-auto overflow-y-auto pb-12"
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

            {/* Back button removed - handled by UserNavbar */}

            {/* Inner Compact Container */}
            <div className="max-w-2xl mx-auto space-y-3">
            {/* Booking Info Header Card (Light Professional Theme) */}
            {currentBooking && (
                <div className="rounded-2xl bg-white p-3.5 sm:p-4 shadow-2xs border border-[#E1F5FE] relative overflow-hidden">
                    <div className="flex items-start justify-between gap-2.5 mb-2.5">
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-50 text-[#0A84FF] border border-blue-100">
                                    #{currentBooking.id ? currentBooking.id.slice(-8) : (currentBooking._id ? currentBooking._id.toString().slice(-8) : 'N/A')}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                                    Verified
                                </span>
                            </div>
                            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 leading-snug">
                                {currentBooking.service?.name || "Hydrogeological Groundwater Survey"}
                            </h1>
                        </div>
                        {currentBooking.payment?.totalAmount && (
                            <div className="text-right flex-shrink-0">
                                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Total Fee</span>
                                <span className="text-base sm:text-lg font-extrabold text-emerald-600 font-mono">
                                    ₹{Number(currentBooking.payment.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                {currentBooking.payment?.advancePaid && !currentBooking.payment?.remainingPaid && (
                                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                                        Adv. Paid (₹{Number(currentBooking.payment.advanceAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 text-[11px] font-medium text-slate-600">
                        {currentBooking.scheduledDate && (
                            <div className="flex items-center gap-1.5 bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                <IoTimeOutline className="text-xs text-[#0A84FF] flex-shrink-0" />
                                <span className="truncate">
                                    {new Date(currentBooking.scheduledDate).toLocaleDateString("en-IN", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}{" "}
                                    at {(!currentBooking.scheduledTime || currentBooking.scheduledTime === "TBD") ? "Time TBD by expert" : currentBooking.scheduledTime}
                                </span>
                            </div>
                        )}
                        {currentBooking.address && (
                            <div className="flex items-center gap-1.5 bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                <IoLocationOutline className="text-xs text-[#0A84FF] flex-shrink-0" />
                                <span className="truncate">
                                    {currentBooking.address.street}, {currentBooking.address.city}, {currentBooking.address.state} {currentBooking.address.pincode}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Expert Information Card with Direct Call Button */}
            {vendor && (
                <div className="rounded-2xl bg-white p-3.5 sm:p-4 shadow-2xs border border-slate-200/80">
                    <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2.5">Expert Information</h2>
                    <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <img
                                className="h-10 w-10 rounded-full object-cover border border-slate-200 shadow-2xs flex-shrink-0"
                                src={vendor.profilePicture?.url || (typeof vendor.profilePicture === 'string' && vendor.profilePicture.startsWith('http') ? vendor.profilePicture : `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.name || 'Expert')}&background=0A84FF&color=fff`)}
                                onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.name || 'Expert')}&background=0A84FF&color=fff`;
                                }}
                                alt={vendor.name}
                            />
                            <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                    <p className="text-xs font-bold text-slate-900 truncate">{vendor.name}</p>
                                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">Verified</span>
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-amber-500 text-[11px] font-bold">★ {vendor.rating?.averageRating?.toFixed(1) || "4.9"}</span>
                                    <span className="text-[11px] text-slate-500">• Hydrogeological Expert</span>
                                </div>
                            </div>
                        </div>
                        <a
                            href={`tel:${vendor.phone || vendor.mobile || '+919876543210'}`}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
                        >
                            <IoCallOutline className="text-sm" />
                            <span>Call Expert</span>
                        </a>
                    </div>
                </div>
            )}

            {/* Expert Cancellation Resolution Banner (Choice A: Reassign at ₹0 vs Choice B: 100% Full Refund) */}
            {(status === "EXPERT_CANCELLED" || (currentBooking?.cancellationDetails?.cancelledBy === "VENDOR" && currentBooking?.cancellationDetails?.userResolution?.status === "PENDING")) && (
                <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-blue-500/10 border-2 border-amber-400/80 shadow-md relative overflow-hidden">
                    <div className="flex items-start gap-3 mb-3">
                        <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-sm flex-shrink-0 mt-0.5">
                            <IoAlertCircleOutline className="text-2xl" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm sm:text-base font-black text-slate-900">
                                    {currentBooking?.cancellationDetails?.isSameDay ? "Expert Unable to Attend Today's Survey" : "Expert Unable to Attend Scheduled Survey"}
                                </h3>
                                {currentBooking?.cancellationDetails?.isSameDay && (
                                    <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-rose-100 text-rose-700 border border-rose-200 uppercase">
                                        Same-Day Notice
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                We sincerely apologise for the inconvenience. Your 40% advance deposit is completely protected. Please choose your preferred resolution:
                            </p>
                            {currentBooking?.cancellationDetails?.reason && (
                                <div className="mt-2 text-[11px] bg-white/80 p-2 rounded-lg border border-amber-200/80 text-amber-900">
                                    <strong>Expert Reason:</strong> {currentBooking.cancellationDetails.reason}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-amber-200/60">
                        <button
                            onClick={handleOpenReplacementModal}
                            className="py-2.5 px-4 bg-[#0A84FF] hover:bg-[#0070E0] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        >
                            <IoPersonOutline className="text-base" />
                            <span>Select Replacement Expert (₹0 Extra)</span>
                        </button>
                        <button
                            onClick={() => setShowRefundConfirmModal(true)}
                            className="py-2.5 px-4 bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        >
                            <IoWalletOutline className="text-base text-rose-600" />
                            <span>Cancel & 100% Full Refund</span>
                        </button>
                    </div>
                </div>
            )}

            {/* On-Site Infeasible Survey Banner */}
            {status === "UNABLE_TO_COMPLETE" && (
                <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-300 shadow-xs">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-amber-500 text-white flex-shrink-0">
                            <IoConstructOutline className="text-xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-amber-900">Survey Infeasible on Site</h3>
                            <p className="text-xs text-amber-800 mt-0.5">
                                The expert reached your land, but physical on-site conditions prevented completing the groundwater survey:
                            </p>
                            {currentBooking?.unableToCompleteDetails?.reasonDescription && (
                                <p className="text-[11px] font-semibold text-slate-800 bg-white p-2 rounded-lg mt-1.5 border border-amber-200">
                                    {currentBooking.unableToCompleteDetails.reasonDescription}
                                </p>
                            )}
                            <p className="text-[11px] text-amber-700 mt-2">
                                ℹ️ Our operations and quality review team has been notified to arbitrate and resolve your case.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Special Banners & Action Buttons for Cancelled / Refund / Dispute Statuses */}
            {status === "CANCELLED" && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold text-rose-900">Booking Cancelled</p>
                        <p className="text-[11px] text-rose-700">Check refund status or rebook a new groundwater survey</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleViewRefundStatus}
                            className="flex-1 sm:flex-initial px-3 py-1.5 bg-white text-rose-700 border border-rose-300 hover:bg-rose-100 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                            <IoWalletOutline className="text-sm" />
                            View Refund Status
                        </button>
                        <button
                            onClick={handleRebook}
                            className="flex-1 sm:flex-initial px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                            <IoReloadOutline className="text-sm" />
                            Rebook
                        </button>
                    </div>
                </div>
            )}

            {(status === "REFUND_INITIATED" || currentBooking?.payment?.refundStatus === "PROCESSING") && (
                <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold text-amber-900">Refund Initiated</p>
                        <p className="text-[11px] text-amber-700">Your refund is being processed by our finance team</p>
                    </div>
                    <button
                        onClick={handleViewRefundStatus}
                        className="w-full sm:w-auto px-3.5 py-1.5 bg-amber-600 text-white hover:bg-amber-700 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                        <IoWalletOutline className="text-sm" />
                        Track Refund
                    </button>
                </div>
            )}

            {(status === "DISPUTE_RAISED" || currentBooking?.dispute) && (
                <div className="mb-4 p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold text-indigo-900">Dispute Raised</p>
                        <p className="text-[11px] text-indigo-700">Support team is currently investigating your dispute request</p>
                    </div>
                    <button
                        onClick={handleViewDisputeStatus}
                        className="w-full sm:w-auto px-3.5 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                        <IoHelpCircleOutline className="text-sm" />
                        View Dispute Status
                    </button>
                </div>
            )}

            {/* Survey Overall Progress Meter Bar */}
            {steps.length > 0 && (
                <div className="rounded-2xl bg-white p-3 sm:p-3.5 shadow-2xs border border-slate-200/80">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#0A84FF] animate-pulse" />
                            <span>Survey Overall Progress</span>
                        </span>
                        <span className="text-[#0A84FF] font-mono font-extrabold">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5 border border-slate-100">
                        <div
                            className="bg-gradient-to-r from-[#0A84FF] via-blue-500 to-emerald-500 h-full transition-all duration-500 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Timeline Section Title */}
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5 uppercase">
                    <span>Booking Status Timeline</span>
                </h2>
                <button
                    onClick={() => {
                        if (loadCurrentBookingRef.current) loadCurrentBookingRef.current();
                        toast.showSuccess("Timeline refreshed");
                    }}
                    className="p-1.5 px-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-[#0A84FF] shadow-2xs transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    title="Refresh Status"
                >
                    <IoRefreshOutline className={`text-sm ${loading ? 'animate-spin text-[#0A84FF]' : ''}`} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Status Timeline */}
            {steps.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
                    <p className="text-slate-500 text-xs font-medium">No status information available</p>
                </div>
            ) : (
                <div className="relative pl-1">
                    {/* Compact Connector Line */}
                    <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-slate-200" />

                    {steps.map((step, index) => {
                        const StepIcon = step.icon;
                        const isLast = index === steps.length - 1;
                        const isActive = step.active;
                        const isCompleted = step.completed;
                        const isUpcoming = !isActive && !isCompleted;

                        return (
                            <div key={step.id} className="relative mb-4 last:mb-0">
                                <div className="flex gap-3.5">
                                    {/* Timeline Marker (Compact 32px Node) */}
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${isCompleted
                                                ? "bg-emerald-500 text-white shadow-2xs"
                                                : isActive
                                                    ? "bg-[#0A84FF] text-white shadow-sm ring-4 ring-blue-100"
                                                    : "bg-white border border-slate-300 text-slate-400"
                                                }`}
                                        >
                                            {isCompleted ? (
                                                <IoCheckmarkCircleOutline className="text-lg" />
                                            ) : (
                                                <StepIcon className="text-base" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Compact Content Card */}
                                    <div className="flex-1">
                                        <div
                                            className={`rounded-xl p-4 transition-all duration-200 ${isActive
                                                ? "bg-white border-l-4 border-l-[#0A84FF] border border-slate-200 shadow-sm"
                                                : isCompleted
                                                    ? "bg-white border border-slate-200/80 shadow-2xs"
                                                    : "bg-slate-50/70 border border-slate-200/60 opacity-60"
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-1 gap-2">
                                                <h3 className={`font-bold text-sm ${isActive ? "text-[#0A84FF]" : isCompleted ? "text-slate-900" : "text-slate-500"}`}>
                                                    {step.label}
                                                </h3>
                                                {isCompleted ? (
                                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase">
                                                        Done
                                                    </span>
                                                ) : isActive ? (
                                                    <span className="text-[10px] font-bold text-[#0A84FF] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded uppercase">
                                                        Active
                                                    </span>
                                                ) : null}
                                            </div>

                                            {step.date && (
                                                <p className="text-[11px] text-slate-400 font-medium mb-2 flex items-center gap-1">
                                                    <IoTimeOutline className="text-xs text-slate-400" />
                                                    {formatDate(step.date)}
                                                </p>
                                            )}

                                            {step.description && (
                                                <p className={`text-xs leading-relaxed ${isActive ? "text-slate-700 font-medium" : "text-slate-500"}`}>
                                                    {step.description}
                                                </p>
                                            )}

                                            {step.bullets && step.bullets.length > 0 && (
                                                <div className="space-y-1 mt-1.5">
                                                    {step.bullets.map((bullet, idx) => (
                                                        <div key={idx} className="flex items-start gap-2 text-xs font-medium leading-relaxed">
                                                            <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${isActive ? 'bg-[#0A84FF]' : 'bg-slate-400'}`} />
                                                            <span className={isActive ? "text-slate-800" : "text-slate-500"}>{bullet}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Expert Card for Confirmed/Assigned step */}
                                            {["booking-confirmed", "expert-en-route", "expert-arrived", "survey-started"].includes(step.id) && vendor && (
                                                <div className="mt-3 flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                                                    <img
                                                        className="h-10 w-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                                                        src={vendor.profilePicture?.url || (typeof vendor.profilePicture === 'string' && vendor.profilePicture.startsWith('http') ? vendor.profilePicture : `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.name || 'Expert')}&background=0A84FF&color=fff`)}
                                                        onError={(e) => {
                                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.name || 'Expert')}&background=0A84FF&color=fff`;
                                                        }}
                                                        alt={vendor.name}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs font-bold text-slate-900 truncate">{vendor.name}</p>
                                                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">Expert</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <span className="text-amber-500 text-[11px] font-bold">★ {vendor.rating?.averageRating?.toFixed(1) || "4.9"}</span>
                                                            <span className="text-[11px] text-slate-500">• {vendor.designation || currentBooking?.service?.category || currentBooking?.service?.name || "Groundwater Professional"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Buttons Based on Status Table Specification */}
                                            {step.id === "booking-requested" && isActive && (
                                                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                                                    {!currentBooking.payment?.advancePaid && (
                                                        <button
                                                            onClick={() => navigate(`/user/booking/${currentBooking.id || currentBooking._id}/advance-payment`)}
                                                            className="flex-1 py-2 bg-[#0A84FF] hover:bg-[#0070E0] text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                                        >
                                                            <IoWalletOutline className="text-base" />
                                                            Complete Advance Payment (40%)
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={handleCancelBooking}
                                                        className="py-2 px-3 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                                    >
                                                        <IoCloseCircleOutline className="text-base" />
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}

                                            {step.id === "booking-confirmed" && isActive && (
                                                <div className="mt-3 grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={handleCancelBooking}
                                                        className="py-2 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                                    >
                                                        <IoCloseCircleOutline className="text-sm" />
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleContactSupport}
                                                        className="py-2 bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                                    >
                                                        <IoHelpCircleOutline className="text-sm" />
                                                        Support
                                                    </button>
                                                </div>
                                            )}

                                            {step.id === "expert-en-route" && isActive && (
                                                <div className="mt-3 grid grid-cols-3 gap-1.5">
                                                    <button
                                                        onClick={handleTrackExpert}
                                                        className="py-2 bg-blue-50 text-[#0A84FF] border border-blue-100 hover:bg-blue-100 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                                    >
                                                        <IoNavigateOutline className="text-sm" />
                                                        Track Expert
                                                    </button>
                                                    <button
                                                        onClick={() => handleCallExpert(vendor?.phone)}
                                                        className="py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                                    >
                                                        <IoCallOutline className="text-sm" />
                                                        Call Expert
                                                    </button>
                                                    <button
                                                        onClick={handleChat}
                                                        className="py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                                    >
                                                        <IoChatbubbleEllipsesOutline className="text-sm" />
                                                        Chat
                                                    </button>
                                                </div>
                                            )}

                                            {step.id === "survey-started" && isActive && (
                                                <div className="mt-3">
                                                    <button
                                                        onClick={handleContactSupport}
                                                        className="w-full py-2 bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                                    >
                                                        <IoHelpCircleOutline className="text-base" />
                                                        Contact Support
                                                    </button>
                                                </div>
                                            )}

                                            {(step.id === "survey-completed" || step.id === "final-payment-pending") && isActive && (
                                                <div className="mt-3 grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => navigate(`/user/booking/${currentBooking.id || currentBooking._id}/payment`)}
                                                        className="py-2.5 bg-[#0A84FF] hover:bg-[#0070E0] text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                                                    >
                                                        <IoWalletOutline className="text-base" />
                                                        Make Final Payment
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/user/booking/${currentBooking.id || currentBooking._id}/report`)}
                                                        className="py-2.5 bg-blue-50 text-[#0A84FF] border border-blue-100 hover:bg-blue-100 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                                    >
                                                        <IoDocumentTextOutline className="text-base" />
                                                        View Report
                                                    </button>
                                                </div>
                                            )}

                                            {step.id === "survey-report-unlocked" && (isActive || isCompleted) && (
                                                <button
                                                    onClick={() => navigate(`/user/booking/${currentBooking.id || currentBooking._id}/report`)}
                                                    className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <IoDocumentTextOutline className="text-base" />
                                                    View & Download Survey Report
                                                </button>
                                            )}

                                            {step.id === "booking-completed" && (isCompleted || isActive) && (
                                                <div className="mt-3 grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => navigate(`/user/booking/${currentBooking.id || currentBooking._id}/invoice`)}
                                                        className="py-2 bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                                    >
                                                        <IoDownloadOutline className="text-sm" />
                                                        Download Invoice
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/user/booking/${currentBooking.id || currentBooking._id}/report`)}
                                                        className="py-2 bg-blue-50 text-[#0A84FF] border border-blue-100 hover:bg-blue-100 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                                    >
                                                        <IoDocumentTextOutline className="text-sm" />
                                                        Download Report
                                                    </button>
                                                    <button
                                                        onClick={handleRateReview}
                                                        className="py-2 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                                    >
                                                        <IoStarOutline className="text-sm" />
                                                        Rate & Review
                                                    </button>
                                                    <button
                                                        onClick={handleRebook}
                                                        className="py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                                    >
                                                        <IoReloadOutline className="text-sm" />
                                                        Rebook
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            </div>

            {/* Borewell Result Upload Modal */}
            {showBorewellModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => !uploadingBorewell && setShowBorewellModal(false)}
                >
                    <div
                        className="bg-white rounded-[16px] w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800">Upload Borewell Result</h2>
                            <button
                                onClick={() => !uploadingBorewell && setShowBorewellModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                disabled={uploadingBorewell}
                            >
                                <IoCloseOutline className="text-2xl text-gray-600" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Result Status <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setBorewellData({ ...borewellData, status: "SUCCESS" })}
                                            disabled={uploadingBorewell}
                                            className={`flex-1 h-12 rounded-[8px] font-semibold transition-colors flex items-center justify-center gap-2 ${borewellData.status === "SUCCESS"
                                                ? "bg-green-500 text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                        >
                                            <IoCheckmarkCircleOutline className="text-xl" />
                                            Success
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBorewellData({ ...borewellData, status: "FAILED" })}
                                            disabled={uploadingBorewell}
                                            className={`flex-1 h-12 rounded-[8px] font-semibold transition-colors flex items-center justify-center gap-2 ${borewellData.status === "FAILED"
                                                ? "bg-red-500 text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                        >
                                            <IoCloseCircleOutline className="text-xl" />
                                            Failed
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Upload Photos (Optional)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleBorewellImageUpload}
                                        disabled={uploadingBorewell}
                                        className="hidden"
                                        id="borewell-images"
                                    />
                                    <label
                                        htmlFor="borewell-images"
                                        className="block w-full h-32 border-2 border-dashed border-gray-300 rounded-[8px] flex items-center justify-center cursor-pointer hover:border-[#0A84FF] transition-colors"
                                    >
                                        <div className="text-center">
                                            <IoImageOutline className="text-3xl text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600">Click to upload images</p>
                                            <p className="text-xs text-gray-500 mt-1">Max 10 images</p>
                                        </div>
                                    </label>
                                    {borewellData.images.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2 mt-3">
                                            {borewellData.images.map((img, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={img.preview}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded-[8px]"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveBorewellImage(index)}
                                                        disabled={uploadingBorewell}
                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                    >
                                                        <IoCloseOutline className="text-sm" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 p-5 border-t border-gray-200">
                            <button
                                onClick={() => setShowBorewellModal(false)}
                                className="flex-1 h-10 bg-gray-200 text-gray-700 text-sm font-medium rounded-[8px] hover:bg-gray-300 transition-colors"
                                disabled={uploadingBorewell}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitBorewellResult}
                                disabled={uploadingBorewell || !borewellData.status}
                                className="flex-1 h-10 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {uploadingBorewell ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Uploading...
                                    </>
                                ) : (
                                    "Upload Result"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancellation Input Modal */}
            <InputModal
                isOpen={showCancellationInput}
                onClose={() => setShowCancellationInput(false)}
                onSubmit={handleCancellationReasonSubmit}
                title="Cancel Booking"
                message="Please select the reason for cancelling your booking:"
                options={CANCELLATION_REASONS}
                submitText="Continue"
                cancelText="Keep Booking"
            />

            {/* Cancellation Confirmation Modal with Policy */}
            <CancellationPolicyModal
                isOpen={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                onConfirm={handleConfirmCancellation}
                reason={cancellationReason}
                isLoading={cancelling}
            />

            {/* Replacement Expert Selection Modal */}
            {showReplacementModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
                    onClick={() => !reassigning && setShowReplacementModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-extrabold flex items-center gap-1.5">
                                    <IoPersonOutline className="text-lg" />
                                    <span>Select Replacement Expert (₹0 Extra Fee)</span>
                                </h2>
                                <p className="text-xs text-blue-100 mt-0.5">
                                    Your 40% advance deposit carries over seamlessly.
                                </p>
                            </div>
                            <button
                                onClick={() => !reassigning && setShowReplacementModal(false)}
                                className="p-1.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer text-white"
                                disabled={reassigning}
                            >
                                <IoCloseOutline className="text-xl" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {loadingReplacements ? (
                                <div className="py-12 text-center">
                                    <LoadingSpinner message="Searching top verified experts in your area..." />
                                </div>
                            ) : replacementVendors.length === 0 ? (
                                <div className="py-10 text-center bg-slate-50 rounded-xl border border-slate-200 p-4">
                                    <p className="text-sm font-bold text-slate-700">No other available experts found in your exact area</p>
                                    <p className="text-xs text-slate-500 mt-1">You can claim a 100% full refund to your wallet immediately.</p>
                                    <button
                                        onClick={() => {
                                            setShowReplacementModal(false);
                                            setShowRefundConfirmModal(true);
                                        }}
                                        className="mt-3 px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                                    >
                                        Claim 100% Full Refund
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                                        1. Choose Available Expert
                                    </label>
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        {replacementVendors.map((v) => {
                                            const isSelected = (selectedReplacementVendor?._id || selectedReplacementVendor?.id) === (v._id || v.id);
                                            return (
                                                <div
                                                    key={v._id || v.id}
                                                    onClick={() => setSelectedReplacementVendor(v)}
                                                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                        isSelected
                                                            ? "border-[#0A84FF] bg-blue-50/50 shadow-xs"
                                                            : "border-slate-200 hover:border-slate-300 bg-white"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <img
                                                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                                            src={v.profilePicture?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(v.name || 'Expert')}&background=0A84FF&color=fff`}
                                                            alt={v.name}
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <h4 className="text-xs font-bold text-slate-900 truncate">{v.name}</h4>
                                                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                                                    Verified
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                                                <span className="text-amber-500 font-bold">★ {v.rating?.averageRating?.toFixed(1) || "4.9"}</span>
                                                                <span>• {v.surveysCompleted || 10}+ Surveys</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                            isSelected ? "border-[#0A84FF] bg-[#0A84FF] text-white" : "border-slate-300"
                                                        }`}>
                                                            {isSelected && <IoCheckmarkCircleOutline className="text-xs" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Date & Time Selection */}
                                    <div className="pt-3 border-t border-slate-200 space-y-3">
                                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                                            2. Select Rescheduled Date & Slot
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <span className="text-[11px] font-semibold text-slate-600 block mb-1">New Survey Date</span>
                                                <input
                                                    type="date"
                                                    value={selectedNewDate}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    onChange={(e) => setSelectedNewDate(e.target.value)}
                                                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0A84FF]"
                                                />
                                            </div>
                                            <div>
                                                <span className="text-[11px] font-semibold text-slate-600 block mb-1">Preferred Time Window</span>
                                                <select
                                                    value={selectedNewTime}
                                                    onChange={(e) => setSelectedNewTime(e.target.value)}
                                                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0A84FF]"
                                                >
                                                    <option value="09:00 AM">09:00 AM - 11:00 AM (Morning)</option>
                                                    <option value="11:00 AM">11:00 AM - 01:00 PM (Noon)</option>
                                                    <option value="02:00 PM">02:00 PM - 04:00 PM (Afternoon)</option>
                                                    <option value="04:00 PM">04:00 PM - 06:00 PM (Evening)</option>
                                                    <option value="TBD">Time TBD by Expert</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2.5">
                            <button
                                onClick={() => setShowReplacementModal(false)}
                                disabled={reassigning}
                                className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleConfirmReassign}
                                disabled={reassigning || replacementVendors.length === 0 || !selectedNewDate}
                                className="flex-2 py-2.5 bg-[#0A84FF] hover:bg-[#0070E0] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {reassigning ? (
                                    <span>Rescheduling...</span>
                                ) : (
                                    <>
                                        <IoCheckmarkCircleOutline className="text-base" />
                                        <span>Confirm Reschedule (₹0 Extra)</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 100% Full Refund Confirmation Modal */}
            {showRefundConfirmModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
                    onClick={() => !claimingRefund && setShowRefundConfirmModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
                            <IoWalletOutline className="text-2xl" />
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 mb-1">
                            Claim 100% Full Refund
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            Since the cancellation was caused by the expert, you are entitled to a <strong>100% full refund</strong> of all amounts paid (including 40% advance deposit and applicable travel charges).
                        </p>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs space-y-1 font-medium text-slate-700">
                            <div className="flex justify-between">
                                <span>Refund Destination:</span>
                                <strong className="text-emerald-700">Jaladhaara User Wallet</strong>
                            </div>
                            <div className="flex justify-between">
                                <span>Refund Rate:</span>
                                <strong className="text-emerald-700">100% (₹0 Cancellation Fee)</strong>
                            </div>
                        </div>

                        <div className="flex gap-2.5">
                            <button
                                onClick={() => setShowRefundConfirmModal(false)}
                                disabled={claimingRefund}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                            >
                                Keep Booking
                            </button>
                            <button
                                onClick={handleConfirmClaimRefund}
                                disabled={claimingRefund}
                                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {claimingRefund ? "Processing Refund..." : "Confirm 100% Refund"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Support Modal (For Desktop / Web) */}
            {showSupportModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setShowSupportModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 p-5 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                                <IoHelpCircleOutline className="text-xl text-[#0A84FF]" />
                                <span>Customer Support</span>
                            </div>
                            <button
                                onClick={() => setShowSupportModal(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                                <IoCloseOutline className="text-xl" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
                                <span className="text-[10px] font-bold text-blue-900 uppercase block mb-1">Helpline Phone Number</span>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-black text-slate-900 font-mono">+91 98765 43210</span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText("+919876543210");
                                            toast.showSuccess("Phone number copied!");
                                        }}
                                        className="text-xs font-bold text-[#0A84FF] hover:underline cursor-pointer"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setShowSupportModal(false);
                                    navigate("/user/help-support");
                                }}
                                className="w-full py-2.5 bg-[#0A84FF] hover:bg-[#0070E0] text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <IoHelpCircleOutline className="text-base" />
                                Open Help & Support Center
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
