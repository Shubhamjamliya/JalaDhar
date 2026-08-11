import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
    IoTimeOutline,
    IoLocationOutline,
    IoCallOutline,
    IoMailOutline,
    IoDownloadOutline,
    IoImageOutline,
    IoStarOutline,
    IoStar,
    IoCloseOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoHourglassOutline,
    IoPersonOutline,
    IoConstructOutline,
    IoDocumentTextOutline,
    IoAlertCircleOutline,
    IoMapOutline,
    IoCashOutline,
    IoCalendarOutline,
    IoInformationCircleOutline,
    IoWaterOutline,
    IoArrowDownOutline,
    IoLockClosedOutline,
    IoChevronForwardOutline,
    IoHelpCircleOutline,
    IoArrowBackOutline,
    IoCarOutline
} from "react-icons/io5";
import { getBookingDetails, downloadInvoice, cancelBooking, submitRating, getBookingRating, uploadBorewellResult } from "../../../services/bookingApi";
import { formatAcresGuntasDisplay } from "../../../utils/landAreaHelper";
import { useNotifications } from "../../../contexts/NotificationContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal, { CANCELLATION_REASONS } from "../../shared/components/InputModal";
import CancellationPolicyModal from "../../shared/components/CancellationPolicyModal";
import RatingModal from "../../shared/components/RatingModal";

export default function UserBookingDetails() {
    const navigate = useNavigate();
    const { bookingId } = useParams();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(null);
    const toast = useToast();
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showCancellationInput, setShowCancellationInput] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("");
    const [cancelling, setCancelling] = useState(false);
    const [showWorkProof, setShowWorkProof] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [ratingData, setRatingData] = useState({
        accuracy: 0,
        professionalism: 0,
        behavior: 0,
        visitTiming: 0,
        review: ""
    });
    const [submittingRating, setSubmittingRating] = useState(false);
    const [showBorewellModal, setShowBorewellModal] = useState(false);
    const [borewellData, setBorewellData] = useState({
        status: "",
        images: []
    });
    const [uploadingBorewell, setUploadingBorewell] = useState(false);
    const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
    const { socket } = useNotifications();

    // Listen to socket notifications for real-time status updates
    useEffect(() => {
        if (!socket) return;

        const handleBookingUpdate = (data) => {
            const updatedBookingId = data.bookingId || data.metadata?.bookingId || data.relatedEntity?.entityId;

            if (updatedBookingId === bookingId) {
                console.log("Received booking update via socket:", data);
                loadBookingDetails();
            }
        };

        socket.on('booking_updated', handleBookingUpdate);
        socket.on('new_notification', handleBookingUpdate);

        return () => {
            socket.off('booking_updated', handleBookingUpdate);
            socket.off('new_notification', handleBookingUpdate);
        };
    }, [socket, bookingId]);

    // Load data on mount and when location/bookingId changes
    useEffect(() => {
        loadBookingDetails();
    }, [bookingId, location.pathname]);

    // Handle auto-opening modal from navigation state
    useEffect(() => {
        if (location.state?.openBorewellModal) {
            setShowBorewellModal(true);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Lock background scroll when any modal is open
    const isAnyModalOpen = showCancelModal || showCancelPolicyModal || showBorewellModal || showWorkProof || showPaymentPrompt;
    useEffect(() => {
        if (isAnyModalOpen) {
            const originalBodyOverflow = document.body.style.overflow;
            const originalHtmlOverflow = document.documentElement.style.overflow;
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = originalBodyOverflow;
                document.documentElement.style.overflow = originalHtmlOverflow;
            };
        }
    }, [isAnyModalOpen]);

    // Refetch when page becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadBookingDetails();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const loadBookingDetails = async () => {
        try {
            setLoading(true);
            const response = await getBookingDetails(bookingId);
            if (response.success) {
                setBooking(response.data.booking);

                if (response.data.booking.status === 'COMPLETED' || response.data.booking.status === 'ADMIN_APPROVED' || response.data.booking.status === 'FINAL_SETTLEMENT') {
                    try {
                        const ratingResponse = await getBookingRating(bookingId);
                        if (ratingResponse.success && !ratingResponse.data?.rating) {
                            setRatingData({
                                accuracy: 0,
                                professionalism: 0,
                                behavior: 0,
                                visitTiming: 0,
                                review: ""
                            });
                            setTimeout(() => setShowRatingModal(true), 1500);
                        } else if (ratingResponse.success && ratingResponse.data?.rating) {
                            const existingRating = ratingResponse.data.rating;
                            setRatingData({
                                accuracy: existingRating.ratings?.accuracy || 0,
                                professionalism: existingRating.ratings?.professionalism || 0,
                                behavior: existingRating.ratings?.behavior || 0,
                                visitTiming: existingRating.ratings?.visitTiming || 0,
                                review: existingRating.review || ""
                            });
                        }
                    } catch (e) {
                        setRatingData({
                            accuracy: 0,
                            professionalism: 0,
                            behavior: 0,
                            visitTiming: 0,
                            review: ""
                        });
                        setTimeout(() => setShowRatingModal(true), 1500);
                    }
                }
            } else {
                toast.showError(response.message || "Failed to load booking details");
            }
        } catch (err) {
            handleApiError(err, "Failed to load booking details");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadBill = () => {
        navigate(`/user/booking/${bookingId}/invoice`);
    };

    const handleReportClick = () => {
        if (!booking?.payment?.remainingPaid) {
            setShowPaymentPrompt(true);
        } else {
            navigate(`/user/booking/${bookingId}/report`);
        }
    };

    const handleCancelBooking = () => {
        setCancellationReason("");
        setShowCancellationInput(true);
    };

    const handleCancellationReasonSubmit = (reason) => {
        setCancellationReason(reason);
        setShowCancellationInput(false);
        setShowCancelConfirm(true);
    };

    const handleCancelConfirm = async () => {
        setCancelling(true);
        const loadingToast = toast.showLoading("Cancelling booking...");
        try {
            const response = await cancelBooking(bookingId, cancellationReason || "");

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Booking cancelled successfully!");
                setShowCancelConfirm(false);
                setCancellationReason("");
                await loadBookingDetails();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to cancel booking");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to cancel booking");
        } finally {
            setCancelling(false);
        }
    };

    const handleRateVendor = async () => {
        try {
            const ratingResponse = await getBookingRating(bookingId);
            if (ratingResponse.success && ratingResponse.data.rating) {
                const existingRating = ratingResponse.data.rating;
                setRatingData({
                    accuracy: existingRating.ratings?.accuracy || 0,
                    professionalism: existingRating.ratings?.professionalism || 0,
                    behavior: existingRating.ratings?.behavior || 0,
                    visitTiming: existingRating.ratings?.visitTiming || 0,
                    review: existingRating.review || ""
                });
            } else {
                setRatingData({
                    accuracy: 0,
                    professionalism: 0,
                    behavior: 0,
                    visitTiming: 0,
                    review: ""
                });
            }
            setShowRatingModal(true);
        } catch (err) {
            setRatingData({
                accuracy: 0,
                professionalism: 0,
                behavior: 0,
                visitTiming: 0,
                review: ""
            });
            setShowRatingModal(true);
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

        const loadingToast = toast.showLoading("Uploading borewell result...");
        try {
            setUploadingBorewell(true);

            const response = await uploadBorewellResult(bookingId, {
                status: borewellData.status,
                images: borewellData.images.map((img) => img.file),
            });

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Borewell result uploaded successfully!");
                setShowBorewellModal(false);
                setBorewellData({ status: "", images: [] });
                await loadBookingDetails();
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

    const handleSubmitRating = async (submittedData = ratingData) => {
        if (!submittedData.accuracy || submittedData.accuracy === 0 ||
            !submittedData.professionalism || submittedData.professionalism === 0 ||
            !submittedData.behavior || submittedData.behavior === 0 ||
            !submittedData.visitTiming || submittedData.visitTiming === 0) {
            toast.showError("Please provide all ratings (1-5 stars for each category)");
            return;
        }

        const loadingToast = toast.showLoading("Submitting rating...");
        try {
            setSubmittingRating(true);
            const response = await submitRating(bookingId, {
                ratings: {
                    accuracy: submittedData.accuracy,
                    professionalism: submittedData.professionalism,
                    behavior: submittedData.behavior,
                    visitTiming: submittedData.visitTiming
                },
                review: submittedData.review || undefined
            });

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Rating submitted successfully!");
                setShowRatingModal(false);
                await loadBookingDetails();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to submit rating");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to submit rating");
        } finally {
            setSubmittingRating(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            AWAITING_ADVANCE: { color: "bg-amber-50 text-amber-700 border-amber-200/80", label: "Awaiting Advance Payment" },
            PENDING: { color: "bg-amber-50 text-amber-700 border-amber-200/80", label: "Expert Assignment in Progress" },
            ASSIGNED: { color: "bg-blue-50 text-blue-700 border-blue-200/80", label: "Expert Assigned" },
            ACCEPTED: { color: "bg-indigo-50 text-indigo-700 border-indigo-200/80", label: "Survey Scheduled" },
            EN_ROUTE: { color: "bg-sky-50 text-sky-700 border-sky-200/80", label: "Expert En Route" },
            VISITED: { color: "bg-purple-50 text-purple-700 border-purple-200/80", label: "Survey in Progress" },
            IN_PROGRESS: { color: "bg-purple-50 text-purple-700 border-purple-200/80", label: "Survey in Progress" },
            REPORT_UPLOADED: { color: "bg-emerald-50 text-emerald-700 border-emerald-200/80", label: "Survey Completed" },
            AWAITING_PAYMENT: { color: "bg-orange-50 text-orange-700 border-orange-200/80", label: "Awaiting Final Payment" },
            PAYMENT_SUCCESS: { color: "bg-emerald-50 text-emerald-700 border-emerald-200/80", label: "Report Ready" },
            PAID_FIRST: { color: "bg-emerald-50 text-emerald-700 border-emerald-200/80", label: "Report Ready" },
            BOREWELL_UPLOADED: { color: "bg-teal-50 text-teal-700 border-teal-200/80", label: "Report Ready" },
            ADMIN_APPROVED: { color: "bg-emerald-50 text-emerald-700 border-emerald-200/80", label: "Booking Completed" },
            FINAL_SETTLEMENT: { color: "bg-emerald-50 text-emerald-700 border-emerald-200/80", label: "Booking Completed" },
            COMPLETED: { color: "bg-emerald-50 text-emerald-700 border-emerald-200/80", label: "Booking Completed" },
            CANCELLED: { color: "bg-slate-100 text-slate-600 border-slate-200", label: "Booking Cancelled" },
            REJECTED: { color: "bg-rose-50 text-rose-700 border-rose-200/80", label: "Booking Rejected" },
            FAILED: { color: "bg-rose-50 text-rose-700 border-rose-200/80", label: "Booking Failed" },
        };
        const config = statusConfig[status] || { color: "bg-slate-100 text-slate-600 border-slate-200", label: status ? status.replace(/_/g, ' ') : status };
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide border shadow-2xs ${config.color}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse flex-shrink-0" />
                {config.label}
            </span>
        );
    };

    const getStatusDescription = (status) => {
        const expertName = booking?.vendor?.name;
        const rawDesignation = booking?.vendor?.designation || booking?.service?.category || booking?.service?.name || "Groundwater Professional";
        
        let expertDisplay = `a specialized ${rawDesignation.toLowerCase()}`;
        if (expertName) {
            const nameLower = expertName.toLowerCase();
            const desigLower = rawDesignation.toLowerCase();
            if (nameLower.includes(desigLower) || desigLower.includes(nameLower)) {
                expertDisplay = expertName;
            } else {
                expertDisplay = `${expertName} (${rawDesignation})`;
            }
        }

        const descriptions = {
            AWAITING_ADVANCE: "Please complete advance payment to confirm your groundwater survey request.",
            PENDING: "Finding the best expert for you... Our team is broadcasting your request to top-rated experts nearby.",
            ASSIGNED: `Expert matched! ${expertDisplay} is currently reviewing your site location.`,
            ACCEPTED: `Survey Scheduled! ${expertName ? expertName : 'Your assigned expert'} will arrive at your site location as scheduled.`,
            EN_ROUTE: `Expert En Route! ${expertName ? expertName : 'Your assigned survey expert'} is traveling to your property.`,
            VISITED: "Survey in Progress! Site inspection and hydrogeological scanning are currently underway.",
            IN_PROGRESS: "Survey in Progress! Site inspection and hydrogeological scanning are currently underway.",
            REPORT_UPLOADED: "Survey Completed! The expert has compiled your detection data into a scientific report.",
            AWAITING_PAYMENT: "Awaiting Final Payment: Please complete the remaining payment to unlock your report.",
            PAYMENT_SUCCESS: "Report Ready! Your detailed groundwater report is available for download.",
            PAID_FIRST: "Report Ready! You can now view and download your groundwater report.",
            BOREWELL_UPLOADED: "Report Ready! Your groundwater survey report is available.",
            ADMIN_APPROVED: "Booking Completed: Your survey request has been fully completed and verified.",
            FINAL_SETTLEMENT: "Booking Completed: Your survey request has been fully completed.",
            COMPLETED: "Booking Completed: Thank you for choosing Jaladhaara!",
            CANCELLED: "Booking Cancelled: This survey request has been cancelled.",
            REJECTED: "Booking Rejected: Unfortunately, experts could not fulfill this request at this time.",
            FAILED: "Booking Failed: Process error encountered. Our support team is investigating.",
        };
        return descriptions[status] || "Track your real-time booking progress here.";
    };

    const formatDate = (dateString, timeString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        const formattedDate = date.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "short",
            year: "numeric",
        });
        if (timeString) {
            return `${formattedDate}, ${timeString}`;
        }
        return formattedDate;
    };

    const formatAmount = (amount) => {
        if (!amount && amount !== 0) return "₹0.00";
        return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatAddress = (address) => {
        if (!address) return "Not provided";
        if (typeof address === 'string') return address;

        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.village) parts.push(address.village);
        if (address.city) parts.push(address.city);
        if (address.district) parts.push(address.district);
        if (address.state) parts.push(address.state);
        if (address.pincode) parts.push(address.pincode);
        return parts.join(", ") || "Not provided";
    };

    const parseSurveySiteInfo = (booking) => {
        if (!booking) return {};
        
        let category = booking.purpose || '';
        let extent = '';
        if (booking.purposeExtent) {
            extent = category === 'Agriculture' 
                ? formatAcresGuntasDisplay(booking.purposeExtent) 
                : `${booking.purposeExtent} Sq. Ft.`;
        } else {
            extent = booking.extent || '';
        }
        let surveyNo = booking.surveyNumber || booking.address?.surveyNumber || '';
        let landmark = booking.address?.landmark || booking.landmark || '';
        let remarks = '';

        let notes = booking.notes || '';

        if (notes) {
            const catMatch = notes.match(/Category:\s*([^.]+)/i);
            const surMatch = notes.match(/(?:Survey No|Plot No):\s*([^.]+)/i);
            const landMatch = notes.match(/Landmark:\s*([^.]+)/i);

            if (catMatch && !category) category = catMatch[1].trim();
            if (surMatch && !surveyNo) surveyNo = surMatch[1].trim();
            if (landMatch && !landmark) landmark = landMatch[1].trim();

            if (catMatch || surMatch || landMatch) {
                let cleaned = notes
                    .replace(/Category:[^.]*\.?/gi, '')
                    .replace(/(?:Survey No|Plot No):[^.]*\.?/gi, '')
                    .replace(/Landmark:[^.]*\.?/gi, '')
                    .replace(/Remarks:\s*/gi, '')
                    .trim();
                remarks = cleaned;
            } else {
                remarks = notes;
            }
        }

        return {
            category,
            extent,
            surveyNo,
            landmark,
            remarks,
            village: booking.village || booking.address?.city || '',
            mandal: booking.mandal || '',
            district: booking.district || '',
            state: booking.address?.state || '',
            pincode: booking.address?.pincode || '',
            coordinates: booking.address?.coordinates || null
        };
    };

    if (loading) {
        return <LoadingSpinner message="Loading booking details..." />;
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 shadow-2xs max-w-md mx-auto my-12">
                    <p className="text-slate-600 font-semibold mb-3">Booking not found</p>
                    <button
                        onClick={() => navigate("/user/status")}
                        className="px-5 py-2.5 bg-[#0A84FF] text-white text-xs font-bold rounded-xl hover:bg-[#005BBB] transition-all cursor-pointer shadow-2xs"
                    >
                        Back to Bookings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">

            {/* Header */}
            <div className="mb-5 max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-2xs border border-slate-200/80 flex items-center justify-between gap-2.5">
                    {/* Left: Back Button & Booking ID */}
                    <div className="flex items-center gap-2 min-w-0">
                        <button
                            onClick={() => navigate("/user/status")}
                            className="p-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 transition-colors cursor-pointer flex items-center justify-center flex-shrink-0"
                            title="Back to Bookings"
                        >
                            <IoArrowBackOutline className="text-base" />
                        </button>
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-slate-500 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider flex-shrink-0">Booking ID:</span>
                            <span className="font-mono font-extrabold text-[11px] sm:text-xs text-slate-900 bg-slate-100/90 border border-slate-200/80 px-2 py-0.5 rounded-lg select-all truncate">
                                {booking._id || booking.id || bookingId}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-5">
                {/* OTP Verification Card */}
                {booking.status === "EN_ROUTE" && !booking.otp?.startSurvey?.verified && (
                    <div className="bg-white rounded-2xl p-6 shadow-2xs border border-indigo-200 bg-indigo-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-lg font-black text-indigo-900 mb-1">Start Survey OTP</h3>
                            <p className="text-sm text-indigo-700 font-medium">Please share this OTP with your expert when they arrive at the site to begin the survey.</p>
                        </div>
                        <div className="bg-white px-6 py-3 rounded-xl border-2 border-indigo-200 shadow-sm flex items-center justify-center">
                            <span className="text-3xl font-black text-indigo-600 tracking-[0.2em]">{booking.otp?.startSurvey?.code || '------'}</span>
                        </div>
                    </div>
                )}

                {booking.status === "VISITED" && !booking.otp?.endSurvey?.verified && (
                    <div className="bg-white rounded-2xl p-6 shadow-2xs border border-emerald-200 bg-emerald-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-lg font-black text-emerald-900 mb-1">End Survey OTP</h3>
                            <p className="text-sm text-emerald-700 font-medium">Please share this OTP with your expert to confirm the physical survey is complete.</p>
                        </div>
                        <div className="bg-white px-6 py-3 rounded-xl border-2 border-emerald-200 shadow-sm flex items-center justify-center">
                            <span className="text-3xl font-black text-emerald-600 tracking-[0.2em]">{booking.otp?.endSurvey?.code || '------'}</span>
                        </div>
                    </div>
                )}

                {/* Visual Status Timeline */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xs border border-slate-200/80">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">Booking Status</h2>
                    </div>

                    {/* Status Insight Banner */}
                    <div className="bg-blue-50/80 rounded-xl p-3.5 sm:p-4 border border-blue-100/90 flex items-start gap-3 mb-5">
                        <IoInformationCircleOutline className="text-xl sm:text-2xl text-[#0A84FF] flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-slate-800 text-xs sm:text-sm font-medium leading-relaxed">
                                {getStatusDescription(booking.status)}
                            </p>
                            {booking.status === "CANCELLED" && booking.cancellationReason && (
                                <p className="mt-2 text-xs text-rose-700 font-bold bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                                    Reason: {booking.cancellationReason}
                                </p>
                            )}
                            {booking.status === "REJECTED" && booking.rejectionReason && (
                                <p className="mt-2 text-xs text-rose-700 font-bold bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                                    Expert Reason: {booking.rejectionReason}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Visual Step Timeline */}
                    {(() => {
                        const status = booking.userStatus || booking.status;
                        const timelineSteps = [
                            { id: "requested", label: "Booking Confirmed", icon: <IoDocumentTextOutline />, statuses: ["PENDING"], date: booking.createdAt, alwaysComplete: true },
                            { id: "assigned",  label: "Expert Assigned",   icon: <IoPersonOutline />,         statuses: ["ASSIGNED"],  date: booking.assignedAt,       proofKey: "assignedAt" },
                            { id: "accepted",  label: "Expert Accepted",   icon: <IoCheckmarkCircleOutline />, statuses: ["ACCEPTED"],  date: booking.acceptedAt,       proofKey: "acceptedAt" },
                            { id: "en_route",  label: "Expert En Route",   icon: <IoCarOutline />,            statuses: ["EN_ROUTE"],  date: booking.enRouteAt,        proofKey: "enRouteAt" },
                            { id: "visited",   label: "Survey Done",       icon: <IoConstructOutline />,       statuses: ["VISITED"],   date: booking.visitedAt,        proofKey: "visitedAt" },
                            { id: "report",    label: "Report Ready",      icon: <IoDocumentTextOutline />,    statuses: ["REPORT_UPLOADED"], date: booking.reportUploadedAt, proofKey: "reportUploadedAt" },
                            { id: "payment",   label: "Final Payment",     icon: <IoCashOutline />,            statuses: ["AWAITING_PAYMENT"], date: booking.payment?.remainingPaidAt },
                            { id: "completed", label: "Report Available",  icon: <IoCheckmarkCircleOutline />, statuses: ["PAYMENT_SUCCESS", "PAID_FIRST", "COMPLETED", "ADMIN_APPROVED", "FINAL_SETTLEMENT"], date: booking.completedAt || booking.payment?.remainingPaidAt },
                        ];

                        const statusOrder = ["PENDING", "ASSIGNED", "ACCEPTED", "EN_ROUTE", "VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT", "COMPLETED"];
                        let currentIndex = -1;
                        if (!["CANCELLED", "REJECTED", "FAILED"].includes(status)) {
                            currentIndex = statusOrder.indexOf(status);
                            if (["PAYMENT_SUCCESS", "BOREWELL_UPLOADED"].includes(status)) currentIndex = Math.max(currentIndex, statusOrder.indexOf("PAYMENT_SUCCESS"));
                        }

                        return (
                            <div className="relative pt-2 pb-1 overflow-x-auto no-scrollbar -mx-2 px-2">
                                <div className="flex items-start justify-between min-w-[620px] sm:min-w-full relative">
                                    {timelineSteps.map((step, index) => {
                                        const stepPrimaryStatusIndex = statusOrder.indexOf(step.statuses[0]);
                                        const isActive = currentIndex >= 0 && step.statuses.includes(status);

                                        const hasTimestampProof = step.alwaysComplete
                                            ? true
                                            : step.proofKey
                                                ? !!booking[step.proofKey]
                                                : currentIndex > stepPrimaryStatusIndex;

                                        // A step is completed if it's strictly before the current index, or if we're past its index in the array
                                        const isCompleted = !isActive && currentIndex >= 0 && (currentIndex > stepPrimaryStatusIndex || index < timelineSteps.findIndex(s => s.statuses.includes(status)));
                                        const isPast = isCompleted;

                                        return (
                                            <div key={step.id} className="flex flex-col items-center relative flex-1 min-w-[76px]">
                                                {/* Connector Line */}
                                                {index < timelineSteps.length - 1 && (
                                                    <div className="absolute left-[50%] right-[-50%] top-[16px] h-[2px] bg-slate-100 z-0">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${isCompleted || isPast ? "bg-emerald-500 w-full" : "w-0"}`}
                                                        />
                                                    </div>
                                                )}

                                                {/* Step Circle */}
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 transition-all duration-300 ${isCompleted || isPast
                                                        ? "bg-emerald-500 text-white shadow-2xs"
                                                        : isActive
                                                            ? "bg-[#0A84FF] text-white ring-4 ring-blue-50 shadow-xs"
                                                            : "bg-white border border-slate-200 text-slate-400"
                                                        }`}
                                                >
                                                    {isCompleted || isPast ? (
                                                        <IoCheckmarkCircleOutline className="text-lg" />
                                                    ) : (
                                                        <span className="text-sm">{step.icon}</span>
                                                    )}
                                                </div>

                                                {/* Label & Date */}
                                                <div className="mt-2 text-center flex flex-col items-center px-0.5">
                                                    <span
                                                        className={`text-[9px] sm:text-[10px] font-bold uppercase leading-tight tracking-tight block text-center max-w-[74px] ${isCompleted || isPast ? "text-emerald-700" : isActive ? "text-[#0A84FF]" : "text-slate-400"
                                                            }`}
                                                    >
                                                        {step.label}
                                                    </span>
                                                    {step.date && (isCompleted || isPast || isActive) && (
                                                        <span className="text-[9px] text-slate-400 mt-0.5 font-semibold block whitespace-nowrap">
                                                            {new Date(step.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Active Indicator Pulse */}
                                                {isActive && (
                                                    <span className="absolute -top-1 right-1/2 translate-x-3.5 w-2.5 h-2.5 bg-[#0A84FF] rounded-full border-2 border-white shadow-xs animate-pulse z-20" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Big View Timeline Button at the bottom of Status Section */}
                    <div className="mt-5 pt-3 border-t border-slate-100">
                        <button
                            onClick={() => navigate(`/user/booking/${bookingId}/status`)}
                            className="w-full bg-[#0A84FF] text-white py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs hover:bg-[#005BBB] transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <IoTimeOutline className="text-lg sm:text-xl" />
                            View Detailed Timeline
                        </button>
                        <p className="text-center text-[10px] sm:text-xs text-slate-400 mt-2 flex items-center justify-center gap-1 font-medium">
                            <IoInformationCircleOutline className="text-xs" />
                            Track real-time progress of your service request
                        </p>
                    </div>
                </div>

                {/* Actions Card */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xs border border-slate-200/80">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight mb-3">Actions</h2>
                    <div className="space-y-3">
                        {/* Expert Acceptance Pending Banner */}
                        {booking.status === "ASSIGNED" && (
                            <div className="flex items-start gap-3 bg-amber-50/90 border border-amber-200/80 rounded-xl p-3.5">
                                <IoHourglassOutline className="text-xl text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
                                <div>
                                    <p className="font-bold text-amber-900 text-xs sm:text-sm">Awaiting Expert Acceptance</p>
                                    <p className="text-amber-800 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
                                        Your assigned expert is reviewing this booking. Online payment will be available only after the expert formally accepts the booking.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Main Action Buttons */}
                        {(booking.status === "AWAITING_PAYMENT" || booking.status === "REPORT_UPLOADED") && !booking.payment?.remainingPaid && (
                            <button
                                onClick={() => navigate(`/user/booking/${bookingId}/payment`)}
                                className="w-full bg-[#0A84FF] text-white py-3.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-[#005BBB] transition-all active:scale-[0.98] shadow-xs flex flex-col items-center justify-center cursor-pointer"
                            >
                                <span className="flex items-center gap-1.5 text-xs font-normal opacity-90">Pay Remaining Amount</span>
                                <span className="font-extrabold text-sm">{formatAmount(booking.payment?.remainingAmount)}</span>
                            </button>
                        )}

                        {(() => {
                            const effectiveStatus = booking.userStatus || booking.status;
                            const isPostReportPhase = ["REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT", "COMPLETED"].includes(effectiveStatus);

                            return (
                                <div className="space-y-2.5">
                                    {/* Report Button */}
                                    {(booking.report || isPostReportPhase) && (
                                        <button
                                            onClick={handleReportClick}
                                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${!booking.payment?.remainingPaid
                                                ? "bg-slate-100 text-slate-500 border border-slate-200"
                                                : "bg-indigo-50 text-indigo-700 border border-indigo-200/80 hover:bg-indigo-100/80"
                                                }`}
                                        >
                                            <div className="relative">
                                                <IoDocumentTextOutline className="text-lg" />
                                                {!booking.payment?.remainingPaid && (
                                                    <IoLockClosedOutline className="absolute -top-1 -right-1 text-[9px] bg-white rounded-full p-0.5 text-slate-500" />
                                                )}
                                            </div>
                                            <span>{booking.payment?.remainingPaid ? "View Survey Report" : "Unlock Survey Report"}</span>
                                        </button>
                                    )}

                                    {/* Borewell Upload Button */}
                                    {!(booking.borewellResult?.uploadedAt) && ["PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT", "COMPLETED"].includes(effectiveStatus.toUpperCase()) && (
                                        <button
                                            onClick={() => setShowBorewellModal(true)}
                                            className="w-full flex items-center justify-center gap-2 bg-white text-[#0A84FF] border border-[#0A84FF] py-3 rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-50/50 transition-all cursor-pointer shadow-2xs"
                                        >
                                            <IoImageOutline className="text-lg" />
                                            Upload Borewell Outcome
                                        </button>
                                    )}

                                    {/* Rating & Invoice for Completed and Post-Payment stages */}
                                    {["PAYMENT_SUCCESS", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT", "COMPLETED"].includes(effectiveStatus.toUpperCase()) && (
                                        <div className="grid grid-cols-2 gap-2.5">
                                            <button
                                                onClick={() => navigate(`/user/booking/${bookingId}/invoice`)}
                                                className="flex items-center justify-center gap-1.5 bg-[#E7F0FB] text-[#0A84FF] py-2.5 rounded-xl font-bold text-xs hover:bg-[#D0E1F7] transition-all cursor-pointer"
                                            >
                                                <IoDownloadOutline className="text-base" />
                                                Invoice
                                            </button>
                                            <button
                                                onClick={handleRateVendor}
                                                className="flex items-center justify-center gap-1.5 bg-[#0A84FF] text-white py-2.5 rounded-xl font-bold text-xs hover:bg-[#005BBB] transition-all shadow-2xs cursor-pointer"
                                            >
                                                <IoStarOutline className="text-base" />
                                                Rate
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {["AWAITING_ADVANCE", "PENDING", "ASSIGNED", "ACCEPTED"].includes(booking.status) && (
                            <button
                                onClick={handleCancelBooking}
                                className="w-full flex items-center justify-center gap-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100/80 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
                            >
                                <IoCloseCircleOutline className="text-base" />
                                Cancel Booking
                            </button>
                        )}
                    </div>
                </div>

                {/* Expert Information Card */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xs border border-slate-200/80">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight mb-3">Expert Information</h2>
                    {booking.vendor ? (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
                            {(() => {
                                const profileImg = booking.vendor.profilePicture?.url ||
                                    booking.vendor.profilePicture ||
                                    booking.vendor.documents?.profilePicture?.url;

                                return profileImg ? (
                                    <img
                                        src={profileImg}
                                        alt={booking.vendor.name}
                                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-2xs flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-base font-extrabold shadow-2xs flex-shrink-0">
                                        {booking.vendor.name?.charAt(0).toUpperCase() || <IoPersonOutline />}
                                    </div>
                                );
                            })()}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                                        {booking.vendor.name}
                                    </h3>
                                    {(() => {
                                        const expertId = booking.vendor.expertId || (booking.vendor._id ? `EXP-${booking.vendor._id.toString().slice(-6).toUpperCase()}` : null);
                                        return expertId ? (
                                            <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/80 flex-shrink-0">
                                                ID: {expertId}
                                            </span>
                                        ) : null;
                                    })()}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1 text-xs text-amber-500">
                                        <IoStar className="text-xs" />
                                        <span className="font-bold text-slate-700 text-[11px]">{booking.vendor?.rating?.averageRating?.toFixed(1) || "New"}</span>
                                    </div>
                                    {booking.vendor.phone && (
                                        <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                                            <IoCallOutline className="text-xs text-slate-500" />
                                            <a href={`tel:${booking.vendor.phone}`} className="hover:text-[#0A84FF] transition-colors">
                                                {booking.vendor.phone}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                            <IoHourglassOutline className="text-xl text-amber-500 flex-shrink-0" />
                            <p className="font-medium">We are currently searching for the best expert for your request.</p>
                        </div>
                    )}
                </div>

                {/* Service & Schedule Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Service Information Card */}
                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xs border border-slate-200/80 flex flex-col justify-between">
                        <div>
                            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight mb-3">Service Details</h2>

                            <div className="space-y-3">
                                {/* Service Name & Desc */}
                                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
                                    <p className="text-[10px] text-slate-500 mb-0.5 font-bold uppercase tracking-wider">Service Selected</p>
                                    <p className="text-xs sm:text-sm font-extrabold text-slate-900">{booking.service?.name}</p>
                                    {booking.service?.description && (
                                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed border-t border-slate-200/60 pt-1.5">
                                            {booking.service.description}
                                        </p>
                                    )}
                                </div>

                                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
                                    <p className="text-[10px] text-slate-500 mb-0.5 font-bold uppercase tracking-wider">Base Price</p>
                                    <div className="flex items-center gap-1.5">
                                        <IoCashOutline className="text-[#0A84FF] text-base" />
                                        <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                                            {formatAmount(booking.service?.price)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Report Statuses */}
                        <div className="pt-3 mt-3 border-t border-slate-100">
                            <p className="text-[10px] text-slate-500 mb-2 font-bold uppercase tracking-wider">Deliverable Status</p>
                            <div className="space-y-2">
                                {/* Survey Report Status */}
                                <div
                                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200/80 bg-white shadow-2xs cursor-pointer active:scale-[0.98] transition-all hover:bg-slate-50"
                                    onClick={handleReportClick}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${booking.report && typeof booking.report.waterFound === 'boolean' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                            <IoDocumentTextOutline className="text-sm" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-bold text-slate-800 truncate">Survey Report</span>
                                            {!booking.payment?.remainingPaid && booking.report && (
                                                <span className="text-[9px] text-amber-600 font-bold flex items-center gap-0.5">
                                                    <IoLockClosedOutline className="text-[10px]" /> PAY TO UNLOCK
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight flex-shrink-0 ${booking.report && typeof booking.report.waterFound === 'boolean'
                                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                                        : ["VISITED", "REPORT_UPLOADED"].includes(booking.status)
                                            ? "bg-amber-50 text-amber-700 border border-amber-200/80 animate-pulse"
                                            : "bg-slate-100 text-slate-500"
                                        }`}>
                                        {booking.report && typeof booking.report.waterFound === 'boolean' ? "Available" : ["VISITED", "REPORT_UPLOADED"].includes(booking.status) ? "In Progress" : "Pending"}
                                    </span>
                                </div>

                                {/* Borewell Result Status */}
                                <div 
                                    onClick={() => setShowBorewellModal(true)}
                                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200/80 bg-white shadow-2xs cursor-pointer hover:border-teal-200 hover:bg-teal-50/30 transition-all"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${booking.borewellResult && (booking.borewellResult.status === 'SUCCESS' || booking.borewellResult.status === 'FAILED') ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
                                            <IoImageOutline className="text-sm" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-bold text-slate-800 truncate">Borewell Result</span>
                                            <span className="text-[9px] text-slate-400 font-medium">Click to {booking.borewellResult ? "view or update" : "upload outcome"}</span>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight flex-shrink-0 ${booking.borewellResult && (booking.borewellResult.status === 'SUCCESS' || booking.borewellResult.status === 'FAILED')
                                        ? "bg-teal-50 text-teal-700 border border-teal-200/80"
                                        : "bg-blue-50 text-blue-700 border border-blue-200/80"
                                        }`}>
                                        {booking.borewellResult && (booking.borewellResult.status === 'SUCCESS' || booking.borewellResult.status === 'FAILED') ? "Uploaded" : "Upload Result"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Card */}
                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xs border border-slate-200/80">
                        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight mb-3">Schedule</h2>
                        <div className="space-y-3">
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                                <IoTimeOutline className="text-xl text-[#0A84FF] flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Scheduled Date & Time</p>
                                    <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                                        {formatDate(booking.scheduledDate)} &bull; {(!booking.scheduledTime || booking.scheduledTime === "TBD") ? "Time TBD by expert" : booking.scheduledTime}
                                    </p>
                                </div>
                            </div>
                            {booking.address && (
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                                    <IoLocationOutline className="text-xl text-[#0A84FF] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Service Address</p>
                                        <p className="text-xs sm:text-sm font-medium text-slate-800 mt-0.5 leading-relaxed">
                                            {formatAddress(booking.address)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Survey Site Info */}
                {(() => {
                    const siteInfo = parseSurveySiteInfo(booking);
                    const hasInfo = siteInfo.category || siteInfo.extent || siteInfo.surveyNo || siteInfo.landmark || siteInfo.remarks;
                    if (!hasInfo) return null;

                    return (
                        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xs border border-slate-200/80">
                            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight mb-3">Survey Site Info</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {siteInfo.category && (
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Property Category</p>
                                        <p className="text-xs sm:text-sm font-bold text-slate-900">{siteInfo.category}</p>
                                    </div>
                                )}
                                {siteInfo.extent && (
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Land / Plot Area</p>
                                        <p className="text-xs sm:text-sm font-bold text-slate-900">{siteInfo.extent}</p>
                                    </div>
                                )}
                                {siteInfo.surveyNo && (
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{siteInfo.category === 'Agriculture' ? 'Survey No.' : 'Survey No / Plot No'}</p>
                                        <p className="text-xs sm:text-sm font-bold text-slate-900">{siteInfo.surveyNo}</p>
                                    </div>
                                )}
                                {siteInfo.village && (
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Village</p>
                                        <p className="text-xs sm:text-sm font-bold text-slate-900">{siteInfo.village}</p>
                                    </div>
                                )}
                                {siteInfo.mandal && (
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Mandal</p>
                                        <p className="text-xs sm:text-sm font-bold text-slate-900">{siteInfo.mandal}</p>
                                    </div>
                                )}
                                {siteInfo.district && (
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">District</p>
                                        <p className="text-xs sm:text-sm font-bold text-slate-900">{siteInfo.district}</p>
                                    </div>
                                )}
                                {siteInfo.state && (
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">State</p>
                                        <p className="text-xs sm:text-sm font-bold text-slate-900">{siteInfo.state}</p>
                                    </div>
                                )}
                                {siteInfo.pincode && siteInfo.pincode !== "000000" && (
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Pin code (optional)</p>
                                        <p className="text-xs sm:text-sm font-bold text-slate-900">{siteInfo.pincode}</p>
                                    </div>
                                )}
                                {siteInfo.landmark && (
                                    <div className="col-span-1 sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Landmark</p>
                                        <p className="text-xs sm:text-sm font-bold text-slate-900">{siteInfo.landmark}</p>
                                    </div>
                                )}
                                {siteInfo.coordinates && siteInfo.coordinates.lat && siteInfo.coordinates.lng && (
                                    <div className="col-span-1 sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">GPS Coordinates</p>
                                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                            <p className="text-xs sm:text-sm font-mono bg-white px-3 py-2 rounded-lg border border-slate-200 flex-1 w-full sm:w-auto overflow-hidden text-ellipsis whitespace-nowrap">
                                                {siteInfo.coordinates.lat.toFixed(6)}, {siteInfo.coordinates.lng.toFixed(6)}
                                            </p>
                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${siteInfo.coordinates.lat},${siteInfo.coordinates.lng}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors w-full sm:w-auto text-xs sm:text-sm"
                                            >
                                                <IoMapOutline className="text-base" />
                                                <span>Google Maps Navigation</span>
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {siteInfo.remarks && (
                                    <div className="col-span-1 sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Remarks</p>
                                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{siteInfo.remarks}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* Payment Information Card */}
                {booking.payment && (
                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xs border border-slate-200/80">
                        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight mb-3">Charges Breakdown</h2>
                        <div className="space-y-3">
                            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200/80">
                                {/* Base Fee */}
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-medium">Base Service Fee</span>
                                    <span className="text-slate-900 font-bold">{formatAmount(booking.payment.baseServiceFee)}</span>
                                </div>

                                {/* Travel Section */}
                                <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                                    {/* Travel KM */}
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-slate-500">Travel Distance</span>
                                        <span className="text-slate-700 font-semibold">{booking.payment.distance?.toFixed(2)} km</span>
                                    </div>
                                    {/* One Way */}
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-slate-500">One Way Charge</span>
                                        <span className="text-slate-700 font-semibold">{formatAmount(booking.payment.travelCharges / 2)}</span>
                                    </div>
                                    {/* Two Way */}
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-slate-500">Round Trip (Two Way)</span>
                                        <span className="text-blue-600 font-bold text-[10px] uppercase">Included (X 2)</span>
                                    </div>
                                    {/* Total Travel Charges */}
                                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/50">
                                        <span className="text-slate-700 font-bold">Total Travel Charges</span>
                                        <span className="text-slate-900 font-bold">{formatAmount(booking.payment.travelCharges)}</span>
                                    </div>
                                </div>

                                {/* GST */}
                                <div className="flex justify-between items-center text-xs font-medium pt-2 border-t border-slate-200/80">
                                    <span className="text-slate-500">GST (18%)</span>
                                    <span className="text-slate-900 font-bold">{formatAmount(booking.payment.gst)}</span>
                                </div>

                                {/* TOTAL */}
                                <div className="flex justify-between items-center pt-2.5 border-t-2 border-slate-200">
                                    <span className="text-xs sm:text-sm font-black text-slate-900 uppercase">TOTAL AMOUNT</span>
                                    <span className="text-base sm:text-lg font-black text-[#0A84FF]">{formatAmount(booking.payment.totalAmount)}</span>
                                </div>

                                {/* Payment Timeline */}
                                <div className="pt-4 border-t border-slate-200/80 mt-4 space-y-2.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Timeline</p>

                                    {/* Advance Payment */}
                                    <div className={`flex items-center justify-between p-3 rounded-xl border ${booking.payment?.advancePaid ? 'bg-emerald-50/50 border-emerald-200/80' : 'bg-blue-50/50 border-blue-200/80'}`}>
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${booking.payment?.advancePaid ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                <span className="text-[9px] font-black">ADV</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">Advance (40%)</p>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${booking.payment?.advancePaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {booking.payment?.advancePaid ? 'PAID' : 'PENDING'}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs sm:text-sm font-black text-slate-900">{formatAmount(booking.payment?.advanceAmount)}</p>
                                    </div>

                                    {/* Remaining Payment */}
                                    <div className={`flex items-center justify-between p-3 rounded-xl border ${booking.payment?.remainingPaid ? 'bg-emerald-50/50 border-emerald-200/80' : 'bg-slate-100/60 border-slate-200/80'}`}>
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${booking.payment?.remainingPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                <span className="text-[9px] font-black">REM</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">Remaining (60%)</p>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${booking.payment?.remainingPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {booking.payment?.remainingPaid ? 'PAID' : 'PENDING'}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs sm:text-sm font-black text-slate-900">{formatAmount(booking.payment?.remainingAmount)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* Visit Report Card - Always visible but shows professional empty state until uploaded */}
                {
                    !["CANCELLED", "REJECTED", "FAILED"].includes(booking.status) && (
                        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xs border border-slate-200/80 overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">Survey Report</h2>
                                {(!booking.report || !["REPORT_UPLOADED", "AWAITING_PAYMENT", "COMPLETED", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT"].includes(booking.status)) && (
                                    <span className="flex items-center gap-1 text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        <IoHourglassOutline className="animate-spin text-xs" />
                                        In Progress
                                    </span>
                                )}
                            </div>

                            {booking.report &&
                                ["REPORT_UPLOADED", "AWAITING_PAYMENT", "COMPLETED", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT"].includes(booking.status) &&
                                typeof booking.report.waterFound === 'boolean' ? (
                                <>
                                    {/* Status Banner */}
                                    <div className={`flex items-center gap-3.5 p-3.5 rounded-xl mb-4 ${booking.report.waterFound
                                        ? 'bg-emerald-50/80 border border-emerald-200/80'
                                        : 'bg-rose-50/80 border border-rose-200/80'
                                        }`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${booking.report.waterFound ? 'bg-white text-emerald-600 shadow-2xs' : 'bg-white text-rose-600 shadow-2xs'
                                            }`}>
                                            {booking.report.waterFound ? <IoWaterOutline className="text-xl" /> : <IoAlertCircleOutline className="text-xl" />}
                                        </div>
                                        <div>
                                            <p className={`font-extrabold text-xs sm:text-sm ${booking.report.waterFound ? 'text-emerald-900' : 'text-rose-900'}`}>
                                                {booking.report.waterFound ? "Water Source Found!" : "No Water Source Found"}
                                            </p>
                                            <p className="text-xs text-slate-600 mt-0.5">
                                                {booking.report.waterFound
                                                    ? "Based on the survey, potential water sources have been identified."
                                                    : "Unfortunately, no significant water sources were located in the surveyed area."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {booking.report.waterFound && (
                                            <div className="grid grid-cols-2 gap-2.5">
                                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Rec. Depth</span>
                                                    <p className="font-bold text-xs sm:text-sm text-slate-900">{booking.report.recommendedDepth || "N/A"}</p>
                                                </div>
                                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Yield</span>
                                                    <p className="font-bold text-xs sm:text-sm text-slate-900">{booking.report.expectedYield || "N/A"}</p>
                                                </div>
                                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Casing</span>
                                                    <p className="font-bold text-xs sm:text-sm text-slate-900">{booking.report.recommendedCasingDepth || "N/A"}</p>
                                                </div>
                                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Points</span>
                                                    <p className="font-bold text-xs sm:text-sm text-slate-900">{booking.report.pointsLocated || "N/A"}</p>
                                                </div>
                                            </div>
                                        )}

                                        {booking.report.images && booking.report.images.length > 0 && (
                                            <div>
                                                <p className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-wider">Site Photos</p>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                    {booking.report.images.map((image, index) => (
                                                        <div
                                                            key={index}
                                                            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-slate-200"
                                                            onClick={() => setShowWorkProof(true)}
                                                        >
                                                            <img
                                                                src={image.url || image}
                                                                alt={`Report ${index + 1}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {booking.report.reportFile && (
                                            <div className="pt-1">
                                                <a
                                                    href={booking.report.reportFile.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 p-3 border border-dashed border-[#0A84FF] rounded-xl text-[#0A84FF] font-bold text-xs hover:bg-blue-50/50 transition-colors"
                                                >
                                                    <IoDownloadOutline className="text-base" />
                                                    <span>Download Full Report PDF</span>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 px-4 bg-slate-50/80 rounded-xl border border-dashed border-slate-200">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-2xs border border-slate-200/80">
                                        <IoDocumentTextOutline className="text-2xl text-slate-400" />
                                    </div>
                                    <h3 className="text-slate-900 font-extrabold text-xs sm:text-sm mb-1">Survey report is being prepared</h3>
                                    <p className="text-[11px] sm:text-xs text-slate-500 max-w-[260px] mx-auto leading-relaxed font-medium">
                                        Your assigned expert will upload the detailed report after completing the survey and analysis.
                                    </p>
                                </div>
                            )}
                        </div>
                    )
                }

                {/* Borewell Outcome Card - Always visible but shows professional empty state until uploaded */}
                {
                    !["CANCELLED", "REJECTED", "FAILED"].includes(booking.status) && (
                        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xs border border-slate-200/80 overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">Borewell Outcome</h2>
                                {booking.borewellResult && (booking.borewellResult.status === 'SUCCESS' || booking.borewellResult.status === 'FAILED') ? (
                                    <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider border ${booking.borewellResult.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' : 'bg-rose-50 text-rose-700 border-rose-200/80'}`}>
                                        {booking.borewellResult.status}
                                    </span>
                                ) : (
                                    <span className="text-[9px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                        PENDING
                                    </span>
                                )}
                            </div>

                            {booking.borewellResult && (booking.borewellResult.status === 'SUCCESS' || booking.borewellResult.status === 'FAILED') ? (
                                <div className="space-y-3">
                                    <div className={`flex items-center gap-3.5 p-3.5 rounded-xl ${booking.borewellResult.status === 'SUCCESS'
                                        ? 'bg-emerald-50/80 border border-emerald-200/80'
                                        : 'bg-rose-50/80 border border-rose-200/80'
                                        }`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-2xs flex-shrink-0 ${booking.borewellResult.status === 'SUCCESS' ? 'bg-white text-emerald-600' : 'bg-white text-rose-600'
                                            }`}>
                                            {booking.borewellResult.status === 'SUCCESS' ? <IoCheckmarkCircleOutline className="text-xl" /> : <IoCloseCircleOutline className="text-xl" />}
                                        </div>
                                        <div>
                                            <p className={`font-extrabold text-xs sm:text-sm ${booking.borewellResult.status === 'SUCCESS' ? 'text-emerald-900' : 'text-rose-900'}`}>
                                                {booking.borewellResult.status === 'SUCCESS' ? "Drilling Successful!" : "Drilling Failed"}
                                            </p>
                                            <p className="text-xs text-slate-600 mt-0.5">
                                                The outcome of the drilling process has been recorded for this point.
                                            </p>
                                        </div>
                                    </div>

                                    {booking.borewellResult.images && booking.borewellResult.images.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {booking.borewellResult.images.map((image, index) => (
                                                <img
                                                    key={index}
                                                    src={image.url || image}
                                                    alt={`Borewell ${index + 1}`}
                                                    className="w-full aspect-square object-cover rounded-xl border border-slate-200"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 px-4 bg-slate-50/80 rounded-xl border border-dashed border-slate-200">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-2xs border border-slate-200/80">
                                        <IoConstructOutline className="text-2xl text-slate-400" />
                                    </div>
                                    <h3 className="text-slate-900 font-extrabold text-xs sm:text-sm mb-1">
                                        Outcome Not Submitted Yet
                                    </h3>
                                    <p className="text-[11px] sm:text-xs text-slate-500 max-w-xs mx-auto leading-relaxed font-medium">
                                        After borewell drilling is completed, please share the drilling outcome to help improve our survey accuracy and service quality.
                                    </p>
                                    {booking.status === "COMPLETED" && (
                                        <button
                                            onClick={() => setShowBorewellModal(true)}
                                            className="mt-3 text-[#0A84FF] text-xs font-bold flex items-center justify-center gap-1 mx-auto hover:underline cursor-pointer"
                                        >
                                            Share Result Now
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                }

                {/* Need Help Card */}
                {
                    !["CANCELLED", "REJECTED", "FAILED"].includes(booking.status) && (
                        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xs border border-slate-200/80 border-l-4 border-l-orange-500">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-full bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600 flex-shrink-0">
                                    <IoInformationCircleOutline className="text-xl" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">Need Help?</h2>
                                    <p className="text-xs text-slate-500 font-medium">Having trouble with your booking?</p>
                                </div>
                            </div>

                            <p className="text-xs text-slate-600 mb-4 leading-relaxed font-medium">
                                If you have any concerns regarding the service, payment, or expert behavior, please let us know. Our support team is here to assist you.
                            </p>

                            <button
                                onClick={() => navigate("/user/disputes/create", { state: { bookingId: bookingId } })}
                                className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-xl font-bold text-xs sm:text-sm hover:bg-orange-600 transition-all active:scale-[0.98] shadow-xs cursor-pointer"
                            >
                                <IoAlertCircleOutline className="text-lg" />
                                Raise a Dispute
                            </button>
                        </div>
                    )
                }
            </div>

            {/* Reuse existing modals */}
            {
                showWorkProof && booking.report?.images && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4" onClick={() => setShowWorkProof(false)}>
                        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setShowWorkProof(false)} className="absolute top-4 right-4 text-white hover:text-slate-300 z-50 bg-slate-800/80 rounded-full p-2 cursor-pointer">
                                <IoCloseOutline className="text-2xl" />
                            </button>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {booking.report.images.map((img, index) => (
                                    <img key={index} src={img.url || img} alt={`Full proof ${index}`} className="w-full h-auto rounded-xl" />
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Borewell Upload Modal */}
            {
                showBorewellModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4" onClick={() => !uploadingBorewell && setShowBorewellModal(false)}>
                        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-slate-200/80" onClick={(e) => e.stopPropagation()}>
                            <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-base font-extrabold text-slate-900">Upload Borewell Result</h2>
                                <button onClick={() => !uploadingBorewell && setShowBorewellModal(false)} className="p-1.5 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer">
                                    <IoCloseOutline className="text-xl text-slate-500" />
                                </button>
                            </div>
                            <div className="p-5 space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider">Result Status</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setBorewellData({ ...borewellData, status: "SUCCESS" })}
                                            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${borewellData.status === "SUCCESS"
                                                ? "bg-emerald-600 text-white shadow-xs"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                                                }`}
                                        >
                                            <IoCheckmarkCircleOutline className="text-base" /> Success
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBorewellData({ ...borewellData, status: "FAILED" })}
                                            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${borewellData.status === "FAILED"
                                                ? "bg-rose-600 text-white shadow-xs"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                                                }`}
                                        >
                                            <IoCloseCircleOutline className="text-base" /> Failed
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider">Upload Photos</label>
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/20 transition-all cursor-pointer relative">
                                        <input type="file" accept="image/*" multiple onChange={handleBorewellImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <IoImageOutline className="text-3xl text-slate-300 mx-auto mb-1.5" />
                                        <p className="text-xs text-slate-500 font-semibold">Click to upload images</p>
                                    </div>
                                    {borewellData.images.length > 0 && (
                                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                                            {borewellData.images.map((img, i) => (
                                                <div key={i} className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden group border border-slate-200">
                                                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                                                    <button onClick={() => handleRemoveBorewellImage(i)} className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                        <IoCloseOutline className="text-xs" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleSubmitBorewellResult}
                                    disabled={uploadingBorewell || !borewellData.status}
                                    className="w-full bg-[#0A84FF] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#005BBB] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                                >
                                    {uploadingBorewell ? "Uploading..." : "Submit Result"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Rating Modal */}
            <RatingModal
                isOpen={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                onSubmit={async (data) => {
                    setRatingData(data);
                    await handleSubmitRating(data);
                }}
                vendorName={booking.vendor?.name}
                initialData={ratingData}
            />

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
                onConfirm={handleCancelConfirm}
                reason={cancellationReason}
                isLoading={cancelling}
            />

            {/* Payment Prompt Modal */}
            <PaymentPromptModal
                isOpen={showPaymentPrompt}
                onClose={() => setShowPaymentPrompt(false)}
                onPay={() => {
                    setShowPaymentPrompt(false);
                    navigate(`/user/booking/${bookingId}/payment`);
                }}
                amount={booking?.payment?.remainingAmount}
                isReportReady={Boolean(
                    booking?.report &&
                    ["REPORT_UPLOADED", "AWAITING_PAYMENT", "COMPLETED", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT"].includes(booking?.status) &&
                    typeof booking?.report?.waterFound === 'boolean'
                )}
            />
        </div>
    );
}

/* ---------------------------
   REUSABLE COMPONENTS
---------------------------- */
function PaymentPromptModal({ isOpen, onClose, onPay, amount, isReportReady }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl border border-slate-200/80 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <div className="w-14 h-14 bg-amber-50 border border-amber-200/80 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IoLockClosedOutline className="text-2xl text-amber-600" />
                    </div>

                    <h2 className="text-lg font-extrabold text-slate-900 mb-1.5">
                        {isReportReady ? "Awaiting Final Payment" : "Survey Report in Progress"}
                    </h2>
                    <p className="text-slate-600 mb-6 leading-relaxed text-xs">
                        {isReportReady ? (
                            <>
                                Your survey report is ready. Complete the remaining payment of <span className="text-slate-900 font-bold">₹{amount?.toLocaleString('en-IN')}</span> to access and view your detailed groundwater survey report.
                            </>
                        ) : (
                            <>
                                Your assigned expert is currently preparing your groundwater survey report. Complete the remaining payment of <span className="text-slate-900 font-bold">₹{amount?.toLocaleString('en-IN')}</span> to access it immediately once uploaded.
                            </>
                        )}
                    </p>

                    <div className="space-y-2">
                        <button
                            onClick={onPay}
                            className="w-full bg-[#0A84FF] text-white py-3 rounded-xl font-bold text-xs shadow-xs active:scale-[0.98] hover:bg-[#005BBB] transition-all cursor-pointer"
                        >
                            {isReportReady ? "Pay balance to access report" : "Pay remaining payment"}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200/70 transition-all text-xs cursor-pointer"
                        >
                            Not now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
