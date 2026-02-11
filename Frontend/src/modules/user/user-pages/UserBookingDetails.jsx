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
    IoArrowDownOutline
} from "react-icons/io5";
import { getBookingDetails, downloadInvoice, cancelBooking, submitRating, getBookingRating, uploadBorewellResult } from "../../../services/bookingApi";
import { useNotifications } from "../../../contexts/NotificationContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";
import PageContainer from "../../shared/components/PageContainer";

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
    const { socket } = useNotifications();

    // Listen to socket notifications for real-time status updates
    useEffect(() => {
        if (!socket) return;

        const handleBookingUpdate = (data) => {
            // Check if this update relates to current booking
            // Data might come as a notification object or direct payload depending on implementation
            const updatedBookingId = data.bookingId || data.metadata?.bookingId || data.relatedEntity?.entityId;

            if (updatedBookingId === bookingId) {
                console.log("Received booking update via socket:", data);
                loadBookingDetails();
            }
        };

        // Listen for specific booking events
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

    // Refetch when page becomes visible (user switches tabs/windows)
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
            } else {
                toast.showError(response.message || "Failed to load booking details");
            }
        } catch (err) {
            handleApiError(err, "Failed to load booking details");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadBill = async () => {
        const loadingToast = toast.showLoading("Downloading invoice...");
        try {
            const blob = await downloadInvoice(bookingId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `invoice-${bookingId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.dismissToast(loadingToast);
            toast.showSuccess("Invoice downloaded successfully!");
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to download invoice");
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
        setShowCancelConfirm(false);
        const loadingToast = toast.showLoading("Cancelling booking...");
        try {
            const response = await cancelBooking(bookingId, cancellationReason || "");

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Booking cancelled successfully!");
                setCancellationReason("");
                await loadBookingDetails();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to cancel booking");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to cancel booking");
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

    const handleSubmitRating = async () => {
        if (!ratingData.accuracy || ratingData.accuracy === 0 ||
            !ratingData.professionalism || ratingData.professionalism === 0 ||
            !ratingData.behavior || ratingData.behavior === 0 ||
            !ratingData.visitTiming || ratingData.visitTiming === 0) {
            toast.showError("Please provide all ratings (1-5 stars for each category)");
            return;
        }

        const loadingToast = toast.showLoading("Submitting rating...");
        try {
            setSubmittingRating(true);
            const response = await submitRating(bookingId, {
                ratings: {
                    accuracy: ratingData.accuracy,
                    professionalism: ratingData.professionalism,
                    behavior: ratingData.behavior,
                    visitTiming: ratingData.visitTiming
                },
                review: ratingData.review || undefined
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

    const getStatusConfig = (status) => {
        const configs = {
            PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-700", borderColor: "border-yellow-200", icon: IoHourglassOutline, description: "Your request has been received. We are currently looking for expected vendors in your area." },
            ASSIGNED: { label: "Assigned", color: "bg-blue-100 text-blue-700", borderColor: "border-blue-200", icon: IoPersonOutline, description: "A vendor has been assigned to your request and is reviewing the details." },
            ACCEPTED: { label: "Accepted", color: "bg-emerald-100 text-emerald-700", borderColor: "border-emerald-200", icon: IoCheckmarkCircleOutline, description: "The vendor has accepted your request and will visit your location at the scheduled time." },
            VISITED: { label: "Visited", color: "bg-purple-100 text-purple-700", borderColor: "border-purple-200", icon: IoConstructOutline, description: "The site visit has been completed. The vendor will upload the survey report shortly." },
            REPORT_UPLOADED: { label: "Report Uploaded", color: "bg-indigo-100 text-indigo-700", borderColor: "border-indigo-200", icon: IoDocumentTextOutline, description: "The survey report is ready. Please review the findings below." },
            AWAITING_PAYMENT: { label: "Awaiting Payment", color: "bg-orange-100 text-orange-700", borderColor: "border-orange-200", icon: IoTimeOutline, description: "Please complete the remaining payment to finalize the service." },
            PAYMENT_SUCCESS: { label: "Payment Success", color: "bg-emerald-100 text-emerald-700", borderColor: "border-emerald-200", icon: IoCheckmarkCircleOutline, description: "Payment received successfully. Finalizing booking record." },
            BOREWELL_UPLOADED: { label: "Borewell Uploaded", color: "bg-teal-100 text-teal-700", borderColor: "border-teal-200", icon: IoImageOutline, description: "Borewell result has been uploaded." },
            COMPLETED: { label: "Completed", color: "bg-green-100 text-green-700", borderColor: "border-green-200", icon: IoCheckmarkCircleOutline, description: "Service has been successfully completed. Thank you for choosing JalaDhar." },
            CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700", borderColor: "border-red-200", icon: IoCloseCircleOutline, description: "This booking has been cancelled." },
            REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700", borderColor: "border-red-200", icon: IoCloseCircleOutline, description: "The vendor could not fulfill this request." },
            FAILED: { label: "Failed", color: "bg-red-100 text-red-700", borderColor: "border-red-200", icon: IoAlertCircleOutline, description: "The booking process encountered an error." },
        };
        return configs[status] || configs.PENDING;
    };

    const formatDate = (dateString, timeString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        const formattedDate = date.toLocaleDateString("en-IN", {
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
        // Handle if address is just a string
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

    if (loading) {
        return <LoadingSpinner message="Loading booking details..." />;
    }

    if (!booking) {
        return (
            <PageContainer>
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IoAlertCircleOutline className="text-3xl text-gray-400" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">Booking Not Found</h2>
                    <p className="text-gray-600 mb-6">The booking you are looking for doesn't exist or has been removed.</p>
                    <button
                        onClick={() => navigate("/user/status")}
                        className="bg-[#0A84FF] text-white px-6 py-2.5 rounded-[10px] font-semibold hover:bg-[#005BBB] transition-colors shadow-sm"
                    >
                        Back to Bookings
                    </button>
                </div>
            </PageContainer>
        );
    }

    const statusConfig = getStatusConfig(booking.status);
    const StatusIcon = statusConfig.icon;
    const isCompleted = booking.status === "COMPLETED";

    const steps = [
        { status: "PENDING", label: "Requested", date: booking.createdAt },
        { status: "ASSIGNED", label: "Assigned", date: booking.createdAt }, // Fallback to createdAt
        { status: "VISITED", label: "Site Visit", date: booking.visitedAt },
        { status: "AWAITING_PAYMENT", label: "Payment", date: booking.payment?.createdAt || booking.payment?.updatedAt }, // fallback
        { status: "COMPLETED", label: "Completed", date: booking.completedAt }
    ];

    // Determine current step index
    let currentStepIndex = 0;
    const statusMap = {
        PENDING: 0,
        ASSIGNED: 1,
        ACCEPTED: 1,
        VISITED: 2,
        REPORT_UPLOADED: 2,
        AWAITING_PAYMENT: 3,
        PAYMENT_SUCCESS: 4,
        BOREWELL_UPLOADED: 4,
        COMPLETED: 5
    };

    if (booking.status === "CANCELLED" || booking.status === "REJECTED" || booking.status === "FAILED") {
        currentStepIndex = -1; // Special case
    } else {
        currentStepIndex = statusMap[booking.status] || 0;
        // Adjust for intermediate steps
        if (booking.status === "ACCEPTED") currentStepIndex = 1;
        if (booking.status === "REPORT_UPLOADED") currentStepIndex = 2;
        if (booking.status === "PAYMENT_SUCCESS" || booking.status === "BOREWELL_UPLOADED") currentStepIndex = 4;
        if (booking.status === "COMPLETED") currentStepIndex = 4;
    }

    return (
        <PageContainer>
            {/* Header & Navigation */}
            {/* Header & Navigation */}
            <div className="flex flex-row items-center gap-4 mb-6">
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                    <span className="text-sm text-gray-500 font-medium">Booking ID:</span>
                    <span className="text-sm font-bold text-gray-800 font-mono tracking-wide">{bookingId.slice(-8).toUpperCase()}</span>
                </div>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] mb-6 border border-gray-50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-1">{booking.service?.name}</h1>
                        <p className="text-gray-500 flex items-center gap-2">
                            <IoCalendarOutline /> {formatDate(booking.scheduledDate)}
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <IoTimeOutline /> {booking.scheduledTime || "Time not set"}
                        </p>
                    </div>
                    <div className={`px-5 py-2.5 rounded-full border ${statusConfig.borderColor} ${statusConfig.color} flex items-center gap-2 shadow-sm`}>
                        <StatusIcon className="text-xl" />
                        <span className="font-bold text-sm uppercase tracking-wide">{statusConfig.label}</span>
                    </div>
                </div>

                {/* Status Insight Banner */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-start gap-3">
                    <IoInformationCircleOutline className="text-2xl text-[#0A84FF] mt-0.5" />
                    <div>
                        <p className="text-gray-800 font-medium leading-relaxed">{statusConfig.description}</p>

                        {/* Cancellation/Rejection Reason */}
                        {booking.status === "CANCELLED" && booking.cancellationReason && (
                            <p className="mt-2 text-sm text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                                Reason: {booking.cancellationReason}
                            </p>
                        )}
                        {booking.status === "REJECTED" && booking.rejectionReason && (
                            <p className="mt-2 text-sm text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                                Vendor Reason: {booking.rejectionReason}
                            </p>
                        )}
                    </div>
                </div>

                {/* Progress Stepper (Desktop) */}
                {currentStepIndex !== -1 && (
                    <div className="hidden md:flex items-center justify-between relative mt-8 px-4">
                        {/* Connecting Line */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-0 rounded-full"></div>
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#0A84FF] -z-0 rounded-full transition-all duration-500"
                            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                        ></div>

                        {steps.map((step, index) => {
                            const isCompletedStep = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;

                            return (
                                <div key={index} className="flex flex-col items-center gap-2 relative z-10">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                            ${isCompletedStep
                                                ? 'bg-[#0A84FF] border-[#0A84FF] text-white shadow-lg shadow-blue-200'
                                                : 'bg-white border-gray-300 text-gray-300'}`}
                                    >
                                        {isCompletedStep && !isCurrent ? (
                                            <IoCheckmarkCircleOutline className="text-xl" />
                                        ) : (
                                            <span className="text-xs font-bold">{index + 1}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className={`text-xs font-semibold whitespace-nowrap ${isCompletedStep ? 'text-[#0A84FF]' : 'text-gray-400'}`}>
                                            {step.label}
                                        </span>
                                        {step.date && isCompletedStep && (
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {new Date(step.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Details */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Enquiry Details */}
                    {(booking.village || booking.purpose) && (
                        <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden border border-gray-50">
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <IoInformationCircleOutline className="text-[#0A84FF]" />
                                    Enquiry Details
                                </h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                                {booking.purpose && <InfoBlock label="Purpose" value={booking.purpose} icon={IoConstructOutline} />}
                                {booking.purposeExtent && <InfoBlock label="Extent (Acres)" value={booking.purposeExtent} icon={IoMapOutline} />}
                                {booking.village && <InfoBlock label="Village" value={booking.village} icon={IoLocationOutline} />}
                                {booking.mandal && <InfoBlock label="Mandal" value={booking.mandal} icon={IoMapOutline} />}
                                {booking.district && <InfoBlock label="District" value={booking.district} icon={IoMapOutline} />}
                                {booking.state && <InfoBlock label="State" value={booking.state} icon={IoMapOutline} />}
                            </div>
                        </div>
                    )}

                    {/* Service & Vendor */}
                    <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden border border-gray-50">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <IoConstructOutline className="text-[#0A84FF]" />
                                Service & Vendor Information
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Service Details</h3>
                                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-50">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#0A84FF]">
                                                <IoConstructOutline className="text-xl" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-lg">{booking.service?.name}</p>
                                                <p className="text-sm text-gray-600 mt-1">{booking.service?.machineType || "Standard Machine"}</p>
                                                {booking.service?.description && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{booking.service.description}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Vendor Details</h3>
                                    <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-50">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                                <IoPersonOutline className="text-xl" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-800 text-lg">{booking.vendor?.name}</p>
                                                <div className="flex flex-col gap-1 mt-1">
                                                    {booking.vendor?.phone && (
                                                        <a href={`tel:${booking.vendor.phone}`} className="text-sm text-gray-600 hover:text-[#0A84FF] flex items-center gap-1">
                                                            <IoCallOutline /> {booking.vendor.phone}
                                                        </a>
                                                    )}
                                                    {booking.vendor?.rating && (
                                                        <div className="text-sm text-orange-500 flex items-center gap-1">
                                                            <IoStar />
                                                            <span className="font-semibold">{booking.vendor.rating.averageRating?.toFixed(1) || "New"}</span>
                                                            <span className="text-gray-400">({booking.vendor.rating.totalRatings || 0})</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden border border-gray-50">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <IoLocationOutline className="text-[#0A84FF]" />
                                Service Location
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 min-w-[24px]">
                                    <IoLocationOutline className="text-2xl text-red-500" />
                                </div>
                                <div>
                                    <p className="text-gray-800 font-medium text-lg leading-relaxed">
                                        {formatAddress(booking.address)}
                                    </p>
                                    {booking.address?.coordinates && (
                                        <div className="mt-3 inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                            <IoMapOutline />
                                            Lat: {booking.address.coordinates.lat?.toFixed(5)}, Lng: {booking.address.coordinates.lng?.toFixed(5)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Survey Report */}
                    {booking.report && ["REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "BOREWELL_UPLOADED", "COMPLETED"].includes(booking.status) && (
                        <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden border border-gray-50">
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <IoDocumentTextOutline className="text-[#0A84FF]" />
                                    Survey Report
                                </h2>
                                {booking.report.uploadedAt && (
                                    <span className="text-xs text-gray-500 font-medium">
                                        {new Date(booking.report.uploadedAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Report Status Hero Card */}
                                <div className={`flex items-center gap-5 p-5 rounded-2xl border mb-6 shadow-sm relative overflow-hidden ${booking.report.waterFound
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400'
                                    : 'bg-gradient-to-br from-red-500 to-pink-600 text-white border-red-400'
                                    }`}>
                                    {/* Background Pattern */}
                                    <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                                        {booking.report.waterFound ? <IoWaterOutline className="text-9xl" /> : <IoAlertCircleOutline className="text-9xl" />}
                                    </div>

                                    <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm relative z-10 border border-white/30">
                                        <IoWaterOutline className="text-3xl" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-white/80 font-semibold uppercase tracking-wider text-xs mb-1">Survey Outcome</p>
                                        <p className="text-2xl font-bold tracking-tight">
                                            {booking.report.waterFound ? "Water Source Success!" : "No Water Source Found"}
                                        </p>
                                    </div>
                                </div>

                                {/* Key Recommendations Grid */}
                                {booking.report.waterFound && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <InfoBlock label="Recommended Depth" value={booking.report.recommendedDepth ? `${booking.report.recommendedDepth} ft` : "N/A"} icon={IoArrowDownOutline} />
                                        <InfoBlock label="Casing Length" value={booking.report.recommendedCasingDepth ? `${booking.report.recommendedCasingDepth} ft` : "N/A"} icon={IoConstructOutline} />
                                        <InfoBlock label="Expected Yield" value={booking.report.expectedYield ? `${booking.report.expectedYield} inches` : "N/A"} icon={IoWaterOutline} />
                                        <InfoBlock label="Points Located" value={booking.report.pointsLocated || "N/A"} />
                                        <InfoBlock label="Best Point" value={booking.report.recommendedPointNumber || "N/A"} />
                                        <InfoBlock label="Fracture Zones" value={booking.report.expectedFractureDepths || "N/A"} />
                                    </div>
                                )}

                                {/* Geological & Land Details */}
                                <div className="space-y-3 pt-2 border-t border-gray-100">
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <IoMapOutline className="text-gray-400" />
                                        Geological & Land Details
                                    </h3>
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm">
                                        <div>
                                            <span className="text-gray-500 block">Rock Type</span>
                                            <span className="font-medium text-gray-800">{booking.report.rockType || "N/A"}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block">Soil Type</span>
                                            <span className="font-medium text-gray-800">{booking.report.soilType || "N/A"}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block">Land Area</span>
                                            <span className="font-medium text-gray-800">{booking.report.extent || "N/A"}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block">Survey No</span>
                                            <span className="font-medium text-gray-800">{booking.report.surveyNumber || "N/A"}</span>
                                        </div>
                                        {booking.report.existingBorewellDetails && (
                                            <div className="col-span-2 mt-2">
                                                <span className="text-gray-500 block">Existing Borewells</span>
                                                <p className="font-medium text-gray-800 mt-1">{booking.report.existingBorewellDetails}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Work Proof */}
                    {booking.report?.images && booking.report.images.length > 0 && (
                        <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden border border-gray-50">
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <IoImageOutline className="text-[#0A84FF]" />
                                    Work Proof
                                </h2>
                                <span className="bg-blue-100 text-[#0A84FF] text-xs font-bold px-2 py-1 rounded-md">
                                    {booking.report.images.length} Photos
                                </span>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {booking.report.images.map((img, index) => (
                                        <div key={index} className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all" onClick={() => setShowWorkProof(true)}>
                                            <img
                                                src={img.url || img}
                                                alt={`Work proof ${index + 1}`}
                                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <IoImageOutline className="text-white opacity-0 group-hover:opacity-100 text-3xl transform scale-50 group-hover:scale-100 transition-all duration-300" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Payment & Actions */}
                <div className="space-y-6">
                    {/* Payment Summary */}
                    {booking.payment && (
                        <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden border border-gray-50">
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <IoCashOutline className="text-[#0A84FF]" />
                                    Payment Details
                                </h2>
                            </div>
                            <div className="p-6 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Base Service Fee</span>
                                    <span className="font-semibold text-gray-800">{formatAmount(booking.payment.baseServiceFee)}</span>
                                </div>

                                {booking.payment.travelCharges > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Travel Charges ({Math.round(booking.payment.distance || 0)} km)</span>
                                        <span className="font-semibold text-gray-800">{formatAmount(booking.payment.travelCharges)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-gray-200">
                                    <span className="text-gray-600 font-medium">Subtotal</span>
                                    <span className="font-semibold text-gray-800">{formatAmount(booking.payment.subtotal)}</span>
                                </div>

                                {booking.payment.gst > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">GST (18%)</span>
                                        <span className="font-semibold text-gray-800">{formatAmount(booking.payment.gst)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mt-2">
                                    <span className="text-base font-bold text-gray-800">Total Amount</span>
                                    <span className="text-lg font-bold text-[#0A84FF]">{formatAmount(booking.payment.totalAmount)}</span>
                                </div>

                                {booking.payment.transactionId && (
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-400 font-mono mt-1">
                                            Txn ID: {booking.payment.transactionId}
                                        </p>
                                    </div>
                                )}

                                {/* Paid / Remaining */}
                                <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Advance (40%)</span>
                                        <span className={`font-bold ${booking.payment.advancePaid ? "text-green-600 flex items-center gap-1" : "text-gray-800"}`}>
                                            {formatAmount(booking.payment.advanceAmount)}
                                            {booking.payment.advancePaid && <IoCheckmarkCircleOutline />}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Remaining (60%)</span>
                                        <span className={`font-bold ${booking.payment.remainingPaid ? "text-green-600 flex items-center gap-1" : "text-gray-800"}`}>
                                            {formatAmount(booking.payment.remainingAmount)}
                                            {booking.payment.remainingPaid && <IoCheckmarkCircleOutline />}
                                        </span>
                                    </div>
                                </div>

                                <div className={`text-center py-2 rounded-lg text-xs font-bold uppercase tracking-wider mt-4 ${booking.payment.status === "SUCCESS" ? "bg-green-100 text-green-700" :
                                    booking.payment.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                                        "bg-red-100 text-red-700"
                                    }`}>
                                    Payment Status: {booking.payment.status || "PENDING"}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions Card */}
                    <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden border border-gray-50 p-6 space-y-3">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Actions</h2>

                        {booking.status === "COMPLETED" && (
                            <>
                                <button
                                    onClick={handleDownloadBill}
                                    className="w-full flex items-center justify-center gap-2 bg-[#E7F0FB] text-[#0A84FF] py-3 rounded-xl font-semibold hover:bg-[#D0E1F7] transition-all active:scale-95"
                                >
                                    <IoDownloadOutline className="text-xl" />
                                    Download Invoice
                                </button>
                                <button
                                    onClick={handleRateVendor}
                                    className="w-full flex items-center justify-center gap-2 bg-[#0A84FF] text-white py-3 rounded-xl font-semibold hover:bg-[#005BBB] transition-all active:scale-95 shadow-lg shadow-blue-200"
                                >
                                    <IoStarOutline className="text-xl" />
                                    Rate Vendor
                                </button>
                            </>
                        )}

                        {booking.status === "AWAITING_PAYMENT" && !booking.payment?.remainingPaid && (
                            <button
                                onClick={() => navigate(`/user/booking/${bookingId}/payment`)}
                                className="w-full bg-[#0A84FF] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#005BBB] transition-all active:scale-95 shadow-lg shadow-blue-200 flex flex-col items-center"
                            >
                                <span className="flex items-center gap-2 text-sm font-normal opacity-90">Pay Remaining Amount</span>
                                <span>{formatAmount(booking.payment?.remainingAmount)}</span>
                            </button>
                        )}

                        {["PENDING", "ASSIGNED", "ACCEPTED"].includes(booking.status) && (
                            <button
                                onClick={handleCancelBooking}
                                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 py-3 rounded-xl font-semibold hover:bg-red-100 transition-all active:scale-95 mt-4"
                            >
                                <IoCloseCircleOutline className="text-xl" />
                                Cancel Booking
                            </button>
                        )}

                        {/* Dispute / Help - Always visible unless rejected/cancelled */}
                        {!["CANCELLED", "REJECTED", "FAILED"].includes(booking.status) && (
                            <button
                                onClick={() => navigate("/user/disputes/create", { state: { bookingId: bookingId } })}
                                className="w-full flex items-center justify-center gap-2 text-orange-500 py-2 text-sm font-medium hover:text-orange-600 transition-colors mt-2"
                            >
                                <IoAlertCircleOutline className="text-lg" />
                                Report an Issue
                            </button>
                        )}
                    </div>

                    {/* Borewell Result Action (If Completed but no result) */}
                    {booking.status === "COMPLETED" && !booking.borewellResult && (
                        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-[16px] shadow-lg p-6 text-white text-center">
                            <IoImageOutline className="text-4xl mx-auto mb-3 opacity-90" />
                            <h3 className="font-bold text-lg mb-1">Result Upload</h3>
                            <p className="text-white/90 text-sm mb-4">Please upload the final borewell outcome to complete your record.</p>
                            <button
                                onClick={() => setShowBorewellModal(true)}
                                className="bg-white text-teal-600 px-6 py-2 rounded-lg font-bold shadow-sm hover:shadow-md transition-all active:scale-95 w-full"
                            >
                                Upload Result
                            </button>
                        </div>
                    )}

                    {/* Borewell Result Display */}
                    {booking.borewellResult && (
                        <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden border border-gray-50 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-800">Borewell Outcome</h2>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${booking.borewellResult.status === "SUCCESS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                    }`}>
                                    {booking.borewellResult.status}
                                </span>
                            </div>
                            {booking.borewellResult.images?.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                    {booking.borewellResult.images.slice(0, 2).map((img, i) => (
                                        <img key={i} src={img.url || img} className="w-full h-24 object-cover rounded-lg" alt="Result" />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {/* Work Proof Modal */}
            {
                showWorkProof && booking.report?.images && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowWorkProof(false)}>
                        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-black rounded-2xl" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setShowWorkProof(false)} className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 bg-black/50 rounded-full p-2">
                                <IoCloseOutline className="text-3xl" />
                            </button>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {booking.report.images.map((img, index) => (
                                    <img key={index} src={img.url || img} alt={`Full proof ${index}`} className="w-full h-auto rounded-lg" />
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Borewell Upload Modal - Kept same logic but refreshed UI if needed */}
            {
                showBorewellModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !uploadingBorewell && setShowBorewellModal(false)}>
                        <div className="bg-white rounded-[24px] w-full max-w-lg overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-xl font-bold text-gray-800">Upload Borewell Result</h2>
                                <button onClick={() => !uploadingBorewell && setShowBorewellModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                    <IoCloseOutline className="text-2xl text-gray-500" />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-3 block">Result Status</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setBorewellData({ ...borewellData, status: "SUCCESS" })}
                                            className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${borewellData.status === "SUCCESS"
                                                ? "bg-green-500 text-white shadow-lg shadow-green-200"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                }`}
                                        >
                                            <IoCheckmarkCircleOutline className="text-xl" /> Success
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBorewellData({ ...borewellData, status: "FAILED" })}
                                            className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${borewellData.status === "FAILED"
                                                ? "bg-red-500 text-white shadow-lg shadow-red-200"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                }`}
                                        >
                                            <IoCloseCircleOutline className="text-xl" /> Failed
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-2 block">Upload Photos</label>
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer relative">
                                        <input type="file" accept="image/*" multiple onChange={handleBorewellImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <IoImageOutline className="text-4xl text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500 font-medium">Click to upload images</p>
                                    </div>
                                    {borewellData.images.length > 0 && (
                                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                                            {borewellData.images.map((img, i) => (
                                                <div key={i} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden group">
                                                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                                                    <button onClick={() => handleRemoveBorewellImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <IoCloseOutline />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleSubmitBorewellResult}
                                    disabled={uploadingBorewell || !borewellData.status}
                                    className="w-full bg-[#0A84FF] text-white py-3.5 rounded-xl font-bold hover:bg-[#005BBB] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploadingBorewell ? "Uploading..." : "Submit Result"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Rating Modal */}
            {
                showRatingModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowRatingModal(false)}>
                        <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-xl font-bold text-gray-800">Rate Experience</h2>
                                <button onClick={() => setShowRatingModal(false)} className="p-2 hover:bg-gray-200 rounded-full">
                                    <IoCloseOutline className="text-2xl text-gray-500" />
                                </button>
                            </div>
                            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                <p className="text-center text-gray-600 text-sm">How was your experience with <strong>{booking.vendor?.name}</strong>?</p>

                                {[{ key: "accuracy", label: "Accuracy" }, { key: "professionalism", label: "Professionalism" }, { key: "behavior", label: "Behavior" }, { key: "visitTiming", label: "Visit Timing" }].map(cat => (
                                    <div key={cat.key} className="text-center">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">{cat.label}</label>
                                        <div className="flex justify-center gap-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button key={star} onClick={() => setRatingData({ ...ratingData, [cat.key]: star })} className="text-3xl focus:outline-none transition-transform active:scale-90 hover:scale-110">
                                                    {ratingData[cat.key] >= star ? <IoStar className="text-yellow-400" /> : <IoStarOutline className="text-gray-300" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                <textarea
                                    value={ratingData.review}
                                    onChange={e => setRatingData({ ...ratingData, review: e.target.value })}
                                    placeholder="Share additional feedback..."
                                    className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] min-h-[100px]"
                                ></textarea>

                                <button onClick={handleSubmitRating} disabled={submittingRating} className="w-full bg-[#0A84FF] text-white py-3.5 rounded-xl font-bold hover:bg-[#005BBB] transition-all disabled:opacity-70">
                                    {submittingRating ? "Submitting..." : "Submit Review"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Other Modals */}
            <InputModal
                isOpen={showCancellationInput}
                onClose={() => setShowCancellationInput(false)}
                onSubmit={handleCancellationReasonSubmit}
                title="Cancel Booking"
                message="Please tell us why you are cancelling:"
                placeholder="Reason for cancellation..."
                submitText="Continue"
                cancelText="Keep Booking"
                isTextarea={true}
            />

            <ConfirmModal
                isOpen={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                onConfirm={handleCancelConfirm}
                title="Confirm Cancellation"
                message="Are you sure? This action cannot be undone."
                confirmText="Yes, Cancel"
                cancelText="Go Back"
                confirmColor="danger"
            />
        </PageContainer >
    );
}

function InfoBlock({ label, value, icon: Icon = IoInformationCircleOutline }) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0A84FF] flex-shrink-0">
                <Icon className="text-lg" />
            </div>
            <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-base font-semibold text-gray-800 break-words">{value}</p>
            </div>
        </div>
    );
}
