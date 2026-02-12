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

                // Check if booking is completed and not rated yet
                if (response.data.booking.status === 'COMPLETED' || response.data.booking.status === 'ADMIN_APPROVED' || response.data.booking.status === 'FINAL_SETTLEMENT') {
                    // We might need to check if user has already rated.
                    // Ideally the booking object or a separate calls tells us.
                    // Let's assume we need to call getBookingRating to be sure, or check a flag.
                    try {
                        const ratingResponse = await getBookingRating(bookingId);
                        if (ratingResponse.success && !ratingResponse.data?.rating) {
                            // No rating found, prompt user
                            setRatingData({
                                accuracy: 0,
                                professionalism: 0,
                                behavior: 0,
                                visitTiming: 0,
                                review: ""
                            });
                            setTimeout(() => setShowRatingModal(true), 1500);
                        } else if (ratingResponse.success && ratingResponse.data?.rating) {
                            // Rating exists, load it
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
                        // Fallback: If API errors (e.g. 404), assume not rated and prompt
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

    const handleDownloadBill = async () => {
        const loadingToast = toast.showLoading("Downloading invoice...");
        try {
            const response = await downloadInvoice(bookingId);

            // Check if response contains a blob directly or data object
            // The service might return the blob directly based on axios config
            // Assuming standard handling here:

            // If the service function already handles creating the blob/link, we might just need to check success
            // But usually for explicit download buttons we handle the blob creation 

            // Let's assume the previous implementation was correct about blob
            // But usually my service pattern returns {success: true, data: ...}
            // If downloadInvoice returns a blob directly (which is common for file downloads):

            const blob = response; // Assuming response IS the blob if headers are set correctly in service

            // However, the previous code had: const blob = await downloadInvoice(bookingId);
            // Let's stick to that pattern but add error checking if it returns a JSON error structure

            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${bookingId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

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
            PENDING: { color: "bg-yellow-100 text-yellow-700", label: "Requested" },
            ASSIGNED: { color: "bg-orange-100 text-orange-700", label: "Assigned" },
            ACCEPTED: { color: "bg-blue-100 text-blue-700", label: "Accepted" },
            VISITED: { color: "bg-purple-100 text-purple-700", label: "Visited" },
            REPORT_UPLOADED: { color: "bg-indigo-100 text-indigo-700", label: "Report Ready" },
            AWAITING_PAYMENT: { color: "bg-orange-100 text-orange-700", label: "Awaiting Payment" },
            PAYMENT_SUCCESS: { color: "bg-emerald-100 text-emerald-700", label: "Payment Success" },
            PAID_FIRST: { color: "bg-emerald-100 text-emerald-700", label: "Payment Success" },
            BOREWELL_UPLOADED: { color: "bg-teal-100 text-teal-700", label: "Borewell Uploaded" },
            ADMIN_APPROVED: { color: "bg-green-100 text-green-700", label: "Completed" },
            FINAL_SETTLEMENT: { color: "bg-green-100 text-green-700", label: "Completed" },
            COMPLETED: { color: "bg-green-100 text-green-700", label: "Completed" },
            CANCELLED: { color: "bg-gray-100 text-gray-700", label: "Cancelled" },
            REJECTED: { color: "bg-red-100 text-red-700", label: "Rejected" },
            FAILED: { color: "bg-red-100 text-red-700", label: "Failed" },
        };
        const config = statusConfig[status] || { color: "bg-gray-100 text-gray-700", label: status };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const getStatusDescription = (status) => {
        const descriptions = {
            PENDING: "Finding the best expert for you... Our team is broadcasting your request to top-rated vendors nearby.",
            ASSIGNED: "Expert matched! A specialized vendor is currently reviewing your request's specific requirements.",
            ACCEPTED: "Visit Confirmed! Your expert has accepted the task and will arrive at your location as scheduled.",
            VISITED: "Inspection Complete! Your site visit is done. Our expert is now preparing your detailed detection report.",
            REPORT_UPLOADED: "Report Ready! Your detailed survey report has been uploaded and is waiting for your review.",
            AWAITING_PAYMENT: "Unlock Your Report: Please complete the final payment to access your survey results.",
            PAYMENT_SUCCESS: "Payment Confirmed! Your report is now available for download and view.",
            PAID_FIRST: "Payment Confirmed! You can now access your survey results.",
            BOREWELL_UPLOADED: "Result Submitted: Thank you for updating your borewell outcome. We're processing it now.",
            ADMIN_APPROVED: "Approved: Your borewell result has been verified. Final settlement is in progress.",
            FINAL_SETTLEMENT: "Settling: We are finalizing the accounts for this booking.",
            COMPLETED: "Service Complete: Thank you for choosing JalaDhar. We hope you found your expert helpful!",
            CANCELLED: "Booking Cancelled: This request has been successfully cancelled.",
            REJECTED: "No Expert Available: Unfortunately, our vendors couldn't fulfill this specific request at this time.",
            FAILED: "Process Error: Something went wrong. Our support team has been notified.",
        };
        return descriptions[status] || "Track your real-time booking progress here.";
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
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
                <div className="text-center py-8">
                    <p className="text-gray-600">Booking not found</p>
                    <button
                        onClick={() => navigate("/user/status")}
                        className="mt-4 text-[#0A84FF] hover:text-[#005BBB] transition-colors"
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
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[#4A4A4A] text-sm">
                        Booking ID: {booking._id || booking.id || bookingId}
                    </p>
                    {getStatusBadge(booking.status)}
                </div>
            </div>

            {/* Visual Status Timeline */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Booking Status</h2>
                </div>

                {/* Status Insight Banner */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3 mb-6">
                    <IoInformationCircleOutline className="text-2xl text-[#0A84FF] flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-gray-800 font-medium leading-relaxed">
                            {getStatusDescription(booking.status)}
                        </p>
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

                {/* Visual Step Timeline */}
                {(() => {
                    const status = booking.status;
                    const timelineSteps = [
                        { id: "requested", label: "Request Sent", icon: <IoDocumentTextOutline />, statuses: ["PENDING"], date: booking.createdAt },
                        { id: "assigned", label: "Expert Match", icon: <IoPersonOutline />, statuses: ["ASSIGNED"], date: booking.assignedAt },
                        { id: "accepted", label: "Visit Scheduled", icon: <IoCheckmarkCircleOutline />, statuses: ["ACCEPTED"], date: booking.acceptedAt },
                        { id: "visited", label: "Site Visit", icon: <IoConstructOutline />, statuses: ["VISITED"], date: booking.visitedAt },
                        { id: "report", label: "Report Ready", icon: <IoDocumentTextOutline />, statuses: ["REPORT_UPLOADED"], date: booking.reportUploadedAt },
                        { id: "payment", label: "Payment Paid", icon: <IoCashOutline />, statuses: ["AWAITING_PAYMENT", "PAYMENT_SUCCESS", "PAID_FIRST"], date: booking.payment?.remainingPaidAt || booking.payment?.updatedAt },
                        { id: "completed", label: "Service Finished", icon: <IoCheckmarkCircleOutline />, statuses: ["COMPLETED", "ADMIN_APPROVED", "FINAL_SETTLEMENT"], date: booking.completedAt },
                    ];

                    const statusOrder = ["PENDING", "ASSIGNED", "ACCEPTED", "VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT", "COMPLETED"];
                    let currentIndex = -1;
                    if (!["CANCELLED", "REJECTED", "FAILED"].includes(status)) {
                        currentIndex = statusOrder.indexOf(status);
                        if (["PAYMENT_SUCCESS", "BOREWELL_UPLOADED"].includes(status)) currentIndex = Math.max(currentIndex, statusOrder.indexOf("PAYMENT_SUCCESS"));
                    }

                    return (
                        <div className="relative pt-4 pb-2">
                            <div className="flex items-center justify-between">
                                {timelineSteps.map((step, index) => {
                                    const stepPrimaryStatusIndex = statusOrder.indexOf(step.statuses[0]);
                                    const isCompleted = currentIndex >= 0 && currentIndex > stepPrimaryStatusIndex;
                                    const isActive = currentIndex >= 0 && step.statuses.includes(status);
                                    const isPast = index < timelineSteps.findIndex(s => s.statuses.includes(status)) || (timelineSteps.findIndex(s => s.statuses.includes(status)) === -1 && currentIndex > stepPrimaryStatusIndex);

                                    return (
                                        <div key={step.id} className="flex flex-col items-center relative flex-1">
                                            {/* Connector Line */}
                                            {index < timelineSteps.length - 1 && (
                                                <div className="absolute left-[50%] right-[-50%] top-4 h-[2px] bg-gray-100 z-0">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${isCompleted || isPast ? "bg-emerald-400 w-full" : "w-0"}`}
                                                    />
                                                </div>
                                            )}

                                            {/* Step Circle */}
                                            <div
                                                className={`w-9 h-9 rounded-full flex items-center justify-center relative z-10 transition-all duration-300 ${isCompleted || isPast
                                                    ? "bg-emerald-500 text-white"
                                                    : isActive
                                                        ? "bg-[#0A84FF] text-white ring-4 ring-blue-50"
                                                        : "bg-white border-2 border-gray-200 text-gray-400"
                                                    }`}
                                            >
                                                {isCompleted || isPast ? (
                                                    <IoCheckmarkCircleOutline className="text-lg" />
                                                ) : (
                                                    <span className="text-base">{step.icon}</span>
                                                )}
                                            </div>

                                            {/* Label & Date */}
                                            <div className="mt-2 text-center flex flex-col items-center">
                                                <span
                                                    className={`text-[8px] font-bold uppercase leading-tight tracking-tight block max-w-[55px] ${isCompleted || isPast ? "text-emerald-600" : isActive ? "text-[#0A84FF]" : "text-gray-400"
                                                        }`}
                                                >
                                                    {step.label.split(' ').map((word, i) => (
                                                        <span key={i} className="block">{word}</span>
                                                    ))}
                                                </span>
                                                {step.date && (isCompleted || isPast || isActive) && (
                                                    <span className="text-[7px] text-gray-400 mt-1 font-medium">
                                                        {new Date(step.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Active Indicator Pulse */}
                                            {isActive && (
                                                <span className="absolute -top-1 right-1/2 translate-x-3.5 w-2.5 h-2.5 bg-[#0A84FF] rounded-full border-2 border-white shadow-sm animate-pulse z-20" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {/* Big View Timeline Button at the bottom of Status Section */}
                <div className="mt-8">
                    <button
                        onClick={() => navigate(`/user/booking/${bookingId}/status`)}
                        className="w-full bg-[#0A84FF] text-white py-4 rounded-[16px] font-bold text-lg shadow-[0_4px_12px_rgba(10,132,255,0.3)] hover:bg-[#005BBB] transition-all hover:shadow-[0_6px_20px_rgba(10,132,255,0.4)] active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        <IoTimeOutline className="text-2xl" />
                        View Detailed Timeline
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
                        <IoInformationCircleOutline />
                        Track real-time progress of your service request
                    </p>
                </div>
            </div>

            {/* Vendor Information Card */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Vendor Information</h2>
                {booking.vendor ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            {(() => {
                                const profileImg = booking.vendor.profilePicture?.url ||
                                    booking.vendor.profilePicture ||
                                    booking.vendor.documents?.profilePicture?.url;

                                return profileImg ? (
                                    <img
                                        src={profileImg}
                                        alt={booking.vendor.name}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-sm border-2 border-white">
                                        {booking.vendor.name?.charAt(0).toUpperCase() || <IoPersonOutline />}
                                    </div>
                                );
                            })()}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">
                                    {booking.vendor.name}
                                </h3>
                                <div className="flex items-center gap-1 text-sm text-yellow-500 mt-1">
                                    <IoStar />
                                    <span className="font-semibold text-gray-700">{booking.vendor?.rating?.averageRating?.toFixed(1) || "New"}</span>
                                </div>
                                {booking.vendor.phone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                        <IoCallOutline className="text-base" />
                                        <a href={`tel:${booking.vendor.phone}`} className="hover:text-[#0A84FF]">
                                            {booking.vendor.phone}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 text-gray-500 bg-gray-50 p-4 rounded-xl">
                        <IoHourglassOutline className="text-2xl" />
                        <p>We are currently searching for the best expert for your request.</p>
                    </div>
                )}
            </div>

            {/* Service & Schedule Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Service Information Card */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Service Details</h2>
                    </div>

                    <div className="space-y-4">
                        {/* Service Name & Desc */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-sm text-gray-500 mb-1 font-medium">Service Selected</p>
                            <p className="text-lg font-bold text-gray-800">{booking.service?.name}</p>
                            {booking.service?.description && (
                                <p className="text-sm text-gray-600 mt-2 leading-relaxed border-t border-gray-200 pt-2">
                                    {booking.service.description}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1 font-medium">Machine Type</p>
                                <div className="flex items-center gap-2">
                                    <IoConstructOutline className="text-[#0A84FF]" />
                                    <p className="text-base font-semibold text-gray-800">{booking.service?.machineType || "Standard"}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1 font-medium">Base Price</p>
                                <div className="flex items-center gap-2">
                                    <IoCashOutline className="text-[#0A84FF]" />
                                    <p className="text-base font-bold text-gray-800">
                                        {formatAmount(booking.service?.price)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Report Statuses */}
                        <div className="pt-2">
                            <p className="text-sm text-gray-500 mb-3 font-medium uppercase tracking-wider">Deliverable Status</p>
                            <div className="space-y-3">
                                {/* Survey Report Status */}
                                <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden relative">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${booking.report && typeof booking.report.waterFound === 'boolean' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <IoDocumentTextOutline />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700">Survey Report</span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${booking.report && typeof booking.report.waterFound === 'boolean'
                                        ? "bg-indigo-100 text-indigo-700"
                                        : ["VISITED", "REPORT_UPLOADED"].includes(booking.status)
                                            ? "bg-orange-50 text-orange-600 animate-pulse"
                                            : "bg-gray-100 text-gray-500"
                                        }`}>
                                        {booking.report && typeof booking.report.waterFound === 'boolean' ? "Available" : ["VISITED", "REPORT_UPLOADED"].includes(booking.status) ? "Processing" : "Pending"}
                                    </span>
                                </div>

                                {/* Borewell Report Status */}
                                <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden relative">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${booking.borewellResult && (booking.borewellResult.status === 'SUCCESS' || booking.borewellResult.status === 'FAILED') ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <IoImageOutline />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700">Borewell Result</span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${booking.borewellResult && (booking.borewellResult.status === 'SUCCESS' || booking.borewellResult.status === 'FAILED')
                                        ? "bg-teal-100 text-teal-700"
                                        : booking.status === 'COMPLETED'
                                            ? "bg-orange-50 text-orange-600 animate-pulse"
                                            : "bg-gray-100 text-gray-500"
                                        }`}>
                                        {booking.borewellResult && (booking.borewellResult.status === 'SUCCESS' || booking.borewellResult.status === 'FAILED') ? "Uploaded" : booking.status === 'COMPLETED' ? "Awaiting Input" : "Locked"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Schedule Card */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Schedule</h2>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <IoTimeOutline className="text-2xl text-[#0A84FF]" />
                            <div>
                                <p className="text-sm text-gray-500">Scheduled Date & Time</p>
                                <p className="text-base font-semibold text-gray-800">
                                    {formatDate(booking.scheduledDate)} at {booking.scheduledTime || "N/A"}
                                </p>
                            </div>
                        </div>
                        {booking.address && (
                            <div className="flex items-start gap-3">
                                <IoLocationOutline className="text-2xl text-[#0A84FF] mt-1" />
                                <div>
                                    <p className="text-sm text-gray-500">Service Address</p>
                                    <p className="text-base text-gray-800">
                                        {formatAddress(booking.address)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Survey Site Info */}
            {(booking.purpose || booking.purposeExtent || booking.notes) && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Survey Site Info</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {booking.purpose && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Purpose</p>
                                <p className="text-base font-semibold text-gray-800">{booking.purpose}</p>
                            </div>
                        )}
                        {booking.purposeExtent && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Extent</p>
                                <p className="text-base font-semibold text-gray-800">{booking.purposeExtent} Acres</p>
                            </div>
                        )}
                        {booking.notes && (
                            <div className="col-span-1 md:col-span-2">
                                <p className="text-sm text-gray-500 mb-1">Additional Notes</p>
                                <p className="text-sm text-gray-600 leading-relaxed">{booking.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Payment Information Card */}
            {booking.payment && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Charges Breakdown</h2>
                    <div className="space-y-4">
                        <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-5 space-y-4 border border-gray-100 shadow-inner">
                            {/* Base Fee */}
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Base Service Fee</span>
                                <span className="text-gray-900 font-bold">{formatAmount(booking.payment.baseServiceFee)}</span>
                            </div>

                            {/* Travel Section */}
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                                {/* Travel KM */}
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500">Travel Distance</span>
                                    <span className="text-gray-700 font-semibold">{booking.payment.distance?.toFixed(2)} km</span>
                                </div>
                                {/* One Way */}
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500">One Way Charge</span>
                                    <span className="text-gray-700 font-semibold">{formatAmount(booking.payment.travelCharges / 2)}</span>
                                </div>
                                {/* Two Way */}
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500">Round Trip (Two Way)</span>
                                    <span className="text-blue-600 font-bold text-[10px] uppercase">Included (X 2)</span>
                                </div>
                                {/* Total Travel Charges */}
                                <div className="flex justify-between items-center text-sm pt-1 border-t border-gray-100/50">
                                    <span className="text-gray-600 font-bold">Total Travel Charges</span>
                                    <span className="text-gray-900 font-bold">{formatAmount(booking.payment.travelCharges)}</span>
                                </div>
                            </div>

                            {/* GST */}
                            <div className="flex justify-between items-center text-xs font-medium pt-2 border-t border-gray-200">
                                <span className="text-gray-500">GST (18%)</span>
                                <span className="text-gray-900 font-bold">{formatAmount(booking.payment.gst)}</span>
                            </div>

                            {/* TOTAL */}
                            <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
                                <span className="text-base font-black text-gray-800">TOTAL AMOUNT</span>
                                <span className="text-xl font-black text-blue-600">{formatAmount(booking.payment.totalAmount)}</span>
                            </div>

                            {/* Payment Timeline */}
                            <div className="pt-6 border-t border-gray-100 mt-6 space-y-3">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Payment Timeline</p>

                                {/* Advance Payment */}
                                <div className={`flex items-center justify-between p-4 rounded-xl border ${booking.payment?.advancePaid ? 'bg-green-50/30 border-green-100' : 'bg-blue-50/30 border-blue-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${booking.payment?.advancePaid ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                            <span className="text-[10px] font-black">ADV</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Advance (40%)</p>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${booking.payment?.advancePaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {booking.payment?.advancePaid ? 'PAID' : 'PENDING'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-base font-black text-gray-900">{formatAmount(booking.payment?.advanceAmount)}</p>
                                </div>

                                {/* Remaining Payment */}
                                <div className={`flex items-center justify-between p-4 rounded-xl border ${booking.payment?.remainingPaid ? 'bg-green-50/30 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${booking.payment?.remainingPaid ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                            <span className="text-[10px] font-black">REM</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Remaining (60%)</p>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${booking.payment?.remainingPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {booking.payment?.remainingPaid ? 'PAID' : 'PENDING'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-base font-black text-gray-900">{formatAmount(booking.payment?.remainingAmount)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* Visit Report Card - Always visible but shows professional empty state until uploaded */}
            {
                !["CANCELLED", "REJECTED", "FAILED"].includes(booking.status) && (
                    <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6 overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Survey Report</h2>
                            {(!booking.report || !["REPORT_UPLOADED", "AWAITING_PAYMENT", "COMPLETED", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT"].includes(booking.status)) && (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full uppercase tracking-wider">
                                    <IoHourglassOutline className="animate-spin" />
                                    Processing
                                </span>
                            )}
                        </div>

                        {booking.report &&
                            ["REPORT_UPLOADED", "AWAITING_PAYMENT", "COMPLETED", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT"].includes(booking.status) &&
                            typeof booking.report.waterFound === 'boolean' ? (
                            <>
                                {/* Status Banner */}
                                <div className={`flex items-center gap-4 p-4 rounded-[12px] mb-6 ${booking.report.waterFound
                                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100'
                                    : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-100'
                                    }`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${booking.report.waterFound ? 'bg-white text-emerald-500 shadow-sm' : 'bg-white text-red-500 shadow-sm'
                                        }`}>
                                        {booking.report.waterFound ? <IoWaterOutline className="text-2xl" /> : <IoAlertCircleOutline className="text-2xl" />}
                                    </div>
                                    <div>
                                        <p className={`font-semibold ${booking.report.waterFound ? 'text-emerald-800' : 'text-red-800'}`}>
                                            {booking.report.waterFound ? "Water Source Found!" : "No Water Source Found"}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {booking.report.waterFound
                                                ? "Based on the survey, potential water sources have been identified."
                                                : "Unfortunately, no significant water sources were located in the surveyed area."}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {booking.report.waterFound && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <span className="text-xs text-gray-500 uppercase">Rec. Depth</span>
                                                <p className="font-semibold text-gray-800">{booking.report.recommendedDepth || "N/A"}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <span className="text-xs text-gray-500 uppercase">Yield</span>
                                                <p className="font-semibold text-gray-800">{booking.report.expectedYield || "N/A"}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <span className="text-xs text-gray-500 uppercase">Casing</span>
                                                <p className="font-semibold text-gray-800">{booking.report.recommendedCasingDepth || "N/A"}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <span className="text-xs text-gray-500 uppercase">Points</span>
                                                <p className="font-semibold text-gray-800">{booking.report.pointsLocated || "N/A"}</p>
                                            </div>
                                        </div>
                                    )}

                                    {booking.report.images && booking.report.images.length > 0 && (
                                        <div>
                                            <p className="text-sm text-gray-500 mb-2 font-medium">Site Photos</p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                {booking.report.images.map((image, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
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
                                        <div className="pt-2">
                                            <a
                                                href={booking.report.reportFile.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 p-3 border border-dashed border-[#0A84FF] rounded-xl text-[#0A84FF] hover:bg-blue-50 transition-colors"
                                            >
                                                <IoDownloadOutline className="text-xl" />
                                                <span>Download Full Report PDF</span>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <IoDocumentTextOutline className="text-3xl text-gray-300" />
                                </div>
                                <h3 className="text-gray-800 font-bold mb-1">Awaiting Survey Report</h3>
                                <p className="text-sm text-gray-500 max-w-[260px] mx-auto">
                                    Our expert will upload the detailed survey findings here once the visit and initial analysis are complete.
                                </p>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Borewell Outcome Card - Always visible but shows professional empty state until uploaded */}
            {
                !["CANCELLED", "REJECTED", "FAILED"].includes(booking.status) && (
                    <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6 overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Borewell Outcome</h2>
                            {booking.borewellResult ? (
                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${booking.borewellResult.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {booking.borewellResult.status}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-full uppercase tracking-wider">
                                    <IoHourglassOutline className="text-[12px]" />
                                    Pending
                                </span>
                            )}
                        </div>

                        {booking.borewellResult && (booking.borewellResult.status === 'SUCCESS' || booking.borewellResult.status === 'FAILED') ? (
                            <div className="space-y-4">
                                <div className={`flex items-center gap-4 p-4 rounded-[12px] ${booking.borewellResult.status === 'SUCCESS'
                                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100'
                                    : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-100'
                                    }`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${booking.borewellResult.status === 'SUCCESS' ? 'bg-white text-emerald-500' : 'bg-white text-red-500'
                                        }`}>
                                        {booking.borewellResult.status === 'SUCCESS' ? <IoCheckmarkCircleOutline className="text-2xl" /> : <IoCloseCircleOutline className="text-2xl" />}
                                    </div>
                                    <div>
                                        <p className={`font-bold ${booking.borewellResult.status === 'SUCCESS' ? 'text-emerald-800' : 'text-red-800'}`}>
                                            {booking.borewellResult.status === 'SUCCESS' ? "Drilling Successful!" : "Drilling Failed"}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            The outcome of the drilling process has been recorded for this point.
                                        </p>
                                    </div>
                                </div>

                                {booking.borewellResult.images && booking.borewellResult.images.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {booking.borewellResult.images.map((image, index) => (
                                            <img
                                                key={index}
                                                src={image.url || image}
                                                alt={`Borewell ${index + 1}`}
                                                className="w-full aspect-square object-cover rounded-lg border border-gray-100"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-10 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <IoConstructOutline className="text-3xl text-gray-300" />
                                </div>
                                <h3 className="text-gray-800 font-bold mb-1">
                                    {!booking.report ? "Awaiting Survey Report" : "No Outcome Shared Yet"}
                                </h3>
                                <p className="text-sm text-gray-500 max-w-[260px] mx-auto">
                                    {!booking.report
                                        ? "Borewell outcome can be shared once the official survey report is generated."
                                        : "Once the drilling is completed at the surveyed point, share the outcome to help us improve."}
                                </p>
                                {booking.status === "COMPLETED" && (
                                    <button
                                        onClick={() => setShowBorewellModal(true)}
                                        className="mt-4 text-[#0A84FF] text-sm font-bold flex items-center justify-center gap-1 mx-auto hover:underline"
                                    >
                                        Share Result Now
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )
            }

            {/* Actions Card */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Actions</h2>
                <div className="space-y-3">
                    {(booking.status === "AWAITING_PAYMENT" || booking.status === "REPORT_UPLOADED") && !booking.payment?.remainingPaid && (
                        <button
                            onClick={() => navigate(`/user/booking/${bookingId}/payment`)}
                            className="w-full bg-[#0A84FF] text-white py-4 rounded-[12px] font-bold text-lg hover:bg-[#005BBB] transition-all active:scale-95 shadow-[0px_4px_10px_rgba(10,132,255,0.2)] flex flex-col items-center justify-center"
                        >
                            <span className="flex items-center gap-2 text-sm font-normal opacity-90">Pay Remaining Amount</span>
                            <span>{formatAmount(booking.payment?.remainingAmount)}</span>
                        </button>
                    )}

                    {booking.status === "COMPLETED" && (
                        <>
                            <button
                                onClick={handleDownloadBill}
                                className="w-full flex items-center justify-center gap-2 bg-[#E7F0FB] text-[#0A84FF] py-3 rounded-[12px] font-semibold hover:bg-[#D0E1F7] transition-all"
                            >
                                <IoDownloadOutline className="text-xl" />
                                Download Invoice
                            </button>
                            <button
                                onClick={handleRateVendor}
                                className="w-full flex items-center justify-center gap-2 bg-[#0A84FF] text-white py-3 rounded-[12px] font-semibold hover:bg-[#005BBB] transition-all shadow-md"
                            >
                                <IoStarOutline className="text-xl" />
                                Rate Vendor
                            </button>
                            {!booking.borewellResult && (
                                <button
                                    onClick={() => setShowBorewellModal(true)}
                                    className="w-full flex items-center justify-center gap-2 bg-teal-500 text-white py-3 rounded-[12px] font-semibold hover:bg-teal-600 transition-all shadow-md"
                                >
                                    <IoImageOutline className="text-xl" />
                                    Upload Borewell Outcome
                                </button>
                            )}
                        </>
                    )}



                    {["PENDING", "ASSIGNED", "ACCEPTED"].includes(booking.status) && (
                        <button
                            onClick={handleCancelBooking}
                            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 py-3 rounded-[12px] font-semibold hover:bg-red-100 transition-all active:scale-95"
                        >
                            <IoCloseCircleOutline className="text-xl" />
                            Cancel Booking
                        </button>
                    )}


                </div>
            </div>

            {/* Need Help Card */}
            {
                !["CANCELLED", "REJECTED", "FAILED"].includes(booking.status) && (
                    <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6 border-l-4 border-orange-500">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                <IoInformationCircleOutline className="text-2xl" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Need Help?</h2>
                                <p className="text-sm text-gray-500">Having trouble with your booking?</p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                            If you have any concerns regarding the service, payment, or vendor behavior, please let us know. Our support team is here to assist you.
                        </p>

                        <button
                            onClick={() => navigate("/user/disputes/create", { state: { bookingId: bookingId } })}
                            className="w-full flex items-center justify-center gap-3 bg-orange-500 text-white py-4 rounded-[12px] font-bold text-lg hover:bg-orange-600 transition-all active:scale-[0.98] shadow-lg shadow-orange-200"
                        >
                            <IoAlertCircleOutline className="text-2xl" />
                            Raise a Dispute
                        </button>
                    </div>
                )
            }

            {/* Reuse existing modals */}
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

            {/* Borewell Upload Modal */}
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
            <RatingModal
                isOpen={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                onSubmit={async (data) => {
                    setRatingData(data);
                    await handleSubmitRating(data); // Pass data directly
                }}
                vendorName={booking.vendor?.name}
                initialData={ratingData}
            />

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
        </div >
    );
}
