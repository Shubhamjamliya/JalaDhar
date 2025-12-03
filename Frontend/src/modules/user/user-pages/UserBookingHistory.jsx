import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    IoSearchOutline,
    IoDownloadOutline,
    IoImageOutline,
    IoStarOutline,
    IoStar,
    IoCloseOutline,
    IoTimeOutline,
    IoLocationOutline,
} from "react-icons/io5";
import { getUserBookings, downloadInvoice, submitRating, getBookingRating, cancelBooking, getBookingDetails } from "../../../services/bookingApi";
import { useAuth } from "../../../contexts/AuthContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";

export default function UserBookingHistory() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const toast = useToast();
    const [activeFilter, setActiveFilter] = useState("All");
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showCancellationInput, setShowCancellationInput] = useState(false);
    const [cancelBookingData, setCancelBookingData] = useState(null);
    const [showWorkProof, setShowWorkProof] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(null);
    const [ratingData, setRatingData] = useState({
        accuracy: 0,
        professionalism: 0,
        behavior: 0,
        visitTiming: 0,
        review: ""
    });
    const [submittingRating, setSubmittingRating] = useState(false);
    const location = useLocation();

    // Load data on mount and when location changes (navigation back)
    useEffect(() => {
        loadBookings();
    }, [location.pathname]);

    // Refetch when page becomes visible (user switches tabs/windows)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadBookings();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const response = await getUserBookings();
            if (response.success) {
                setBookings(response.data.bookings || []);
            } else {
                toast.showError(response.message || "Failed to load bookings");
            }
        } catch (err) {
            handleApiError(err, "Failed to load bookings");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadBill = async (bookingId) => {
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

    const handleViewWorkProof = (booking) => {
        if (booking.report?.images && booking.report.images.length > 0) {
            setShowWorkProof(booking.report.images.map(img => img.url));
        }
    };

    const handleRateVendor = async (booking) => {
        // Check if rating already exists
        try {
            const ratingResponse = await getBookingRating(booking._id);
            if (ratingResponse.success && ratingResponse.data.rating) {
                // Rating already exists, show it
                const existingRating = ratingResponse.data.rating;
                setRatingData({
                    accuracy: existingRating.ratings?.accuracy || 0,
                    professionalism: existingRating.ratings?.professionalism || 0,
                    behavior: existingRating.ratings?.behavior || 0,
                    visitTiming: existingRating.ratings?.visitTiming || 0,
                    review: existingRating.review || ""
                });
            } else {
                // Reset rating data for new rating
                setRatingData({
                    accuracy: 0,
                    professionalism: 0,
                    behavior: 0,
                    visitTiming: 0,
                    review: ""
                });
            }
            setShowRatingModal(booking);
        } catch (err) {
            // If error, assume no rating exists and proceed
            setRatingData({
                accuracy: 0,
                professionalism: 0,
                behavior: 0,
                visitTiming: 0,
                review: ""
            });
            setShowRatingModal(booking);
        }
    };

    const handleSubmitRating = async () => {
        if (!showRatingModal) return;

        // Validate ratings
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
            const response = await submitRating(showRatingModal._id, {
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
                setShowRatingModal(null);
                // Reload bookings to reflect the rating
                await loadBookings();
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

    const handleCancelBooking = (booking) => {
        setCancelBookingData(booking);
        setShowCancellationInput(true);
    };

    const handleCancellationReasonSubmit = (reason) => {
        setCancelBookingData(prev => ({ ...prev, cancellationReason: reason }));
        setShowCancellationInput(false);
        setShowCancelConfirm(true);
    };

    const handleCancelConfirm = async () => {
        if (!cancelBookingData) return;
        
        setShowCancelConfirm(false);
        const loadingToast = toast.showLoading("Cancelling booking...");
        
        try {
            const response = await cancelBooking(cancelBookingData._id, cancelBookingData.cancellationReason || "");

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Booking cancelled successfully!");
                setCancelBookingData(null);
                // Reload bookings
                await loadBookings();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to cancel booking");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to cancel booking");
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pending" },
            ASSIGNED: { bg: "bg-blue-100", text: "text-blue-700", label: "Assigned" },
            ACCEPTED: { bg: "bg-green-100", text: "text-green-700", label: "Accepted" },
            VISITED: { bg: "bg-purple-100", text: "text-purple-700", label: "Visited" },
            REPORT_UPLOADED: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Report Ready" },
            AWAITING_PAYMENT: { bg: "bg-orange-100", text: "text-orange-700", label: "Payment Due" },
            COMPLETED: { bg: "bg-green-100", text: "text-green-700", label: "Completed" },
            CANCELLED: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
            REJECTED: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
        };
        const config = statusConfig[status] || statusConfig.PENDING;
        return (
            <span className={`inline-flex items-center justify-center rounded-[6px] ${config.bg} px-3 py-1`}>
                <span className={`text-xs font-medium ${config.text}`}>
                    {config.label}
                </span>
            </span>
        );
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
        if (!amount) return "₹0.00";
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const filteredBookings = bookings.filter((booking) => {
        const matchesSearch =
            booking.service?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter =
            activeFilter === "All" ||
            (activeFilter === "Completed" && (booking.userStatus || booking.status) === "COMPLETED") ||
            (activeFilter === "Upcoming" && ["PENDING", "ASSIGNED", "ACCEPTED", "VISITED"].includes(booking.userStatus || booking.status)) ||
            (activeFilter === "Cancelled" && ["CANCELLED", "REJECTED"].includes(booking.userStatus || booking.status));

        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return <LoadingSpinner message="Loading booking history..." />;
    }

                return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <div className="min-h-screen w-full bg-[#F6F7F9] px-4 py-6">

                {/* Search Bar */}
                <div className="mb-4">
                    <div className="flex h-12 w-full items-stretch rounded-[10px] border border-gray-200 bg-white">
                        <div className="flex items-center justify-center rounded-l-[10px] pl-4">
                                <IoSearchOutline className="text-gray-600" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-full w-full flex-1 rounded-r-[10px] px-3 text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#0A84FF]"
                                placeholder="Search by vendor or service"
                            />
                        </div>
                </div>

                {/* Filters - Sticky */}
                <div className="sticky top-0 z-10 bg-[#F6F7F9] -mx-4 px-4 pt-2 pb-2 mb-4 overflow-hidden">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {["All", "Upcoming", "Completed", "Cancelled"].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`flex h-8 shrink-0 items-center justify-center rounded-[8px] px-4 border border-gray-200 shadow-[0px_2px_8px_rgba(0,0,0,0.05)] transition-colors ${activeFilter === filter
                                        ? "bg-[#0A84FF] text-white border-[#0A84FF]"
                                        : "bg-white text-gray-800"
                                }`}
                            >
                                <p className="text-xs font-medium whitespace-nowrap">{filter}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Booking Cards */}
                <div className="flex flex-col gap-4">
                    {filteredBookings.length === 0 ? (
                        <div className="bg-white rounded-[12px] p-8 text-center shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                            <p className="text-[#4A4A4A] text-sm">No bookings found</p>
                        </div>
                    ) : (
                        filteredBookings.map((booking) => (
                            <div
                                key={booking._id}
                                className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all"
                            >
                                {/* Header with Service Title, Vendor Name, and Status Badge */}
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                                            {booking.service?.name || "Service"}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {booking.vendor?.name || "Vendor"}
                                        </p>
                                    </div>
                                    {getStatusBadge(booking.userStatus || booking.status)}
                                </div>

                                {/* Date and Amount */}
                                <div className="flex flex-col gap-2 mb-4 text-sm text-gray-600">
                                    <p>
                                        <span className="font-medium">Date:</span> {formatDate(booking.scheduledDate, booking.scheduledTime)}
                                    </p>
                                    <p>
                                        <span className="font-medium">Amount:</span> {formatAmount(booking.payment?.totalAmount || booking.payment?.amount || 0)}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-2">
                                    {/* View Details Button - Only button visible */}
                                    <button
                                        onClick={() => navigate(`/user/booking/${booking._id}`)}
                                        className="w-full h-10 bg-gradient-to-b from-[#E3F2FD] via-[#BBDEFB] to-[#90CAF9] text-[#0A84FF] text-sm font-medium rounded-full shadow-[0px_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0px_3px_10px_rgba(0,0,0,0.2)] transition-all"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
            </div>

            {/* Work Proof Modal */}
            {showWorkProof && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setShowWorkProof(null)}
                >
                    <div
                        className="bg-white rounded-[16px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-800">Work Proof</h2>
                            <button
                                onClick={() => setShowWorkProof(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <IoCloseOutline className="text-2xl text-gray-600" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {showWorkProof.map((imageUrl, index) => (
                                    <img
                                        key={index}
                                            src={imageUrl}
                                        alt={`Work proof ${index + 1}`}
                                        className="w-full h-64 object-cover rounded-[12px]"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

                {/* Rating Modal */}
                {showRatingModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={() => setShowRatingModal(null)}
                    >
                        <div
                            className="bg-white rounded-[16px] w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-5 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-800">Rate Vendor</h2>
                                <button
                                    onClick={() => setShowRatingModal(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    disabled={submittingRating}
                                >
                                    <IoCloseOutline className="text-2xl text-gray-600" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5">
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600 mb-4">
                                        Rate your experience with {showRatingModal.vendor?.name || "the vendor"}
                                    </p>

                                    {/* Rating Categories */}
                                    {[
                                        { key: "accuracy", label: "Accuracy" },
                                        { key: "professionalism", label: "Professionalism" },
                                        { key: "behavior", label: "Behavior" },
                                        { key: "visitTiming", label: "Visit Timing" }
                                    ].map((category) => (
                                        <div key={category.key}>
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                {category.label}
                                            </label>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setRatingData({
                                                            ...ratingData,
                                                            [category.key]: star
                                                        })}
                                                        className="focus:outline-none"
                                                        disabled={submittingRating}
                                                    >
                                                        {ratingData[category.key] >= star ? (
                                                            <IoStar className="text-2xl text-yellow-500" />
                                                        ) : (
                                                            <IoStarOutline className="text-2xl text-gray-300" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Review Text */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                                            Review (Optional)
                                        </label>
                                        <textarea
                                            value={ratingData.review}
                                            onChange={(e) => setRatingData({ ...ratingData, review: e.target.value })}
                                            placeholder="Share your experience..."
                                            rows="4"
                                            className="w-full border border-gray-300 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#0A84FF]"
                                            disabled={submittingRating}
                                            maxLength={500}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {ratingData.review.length}/500 characters
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 p-5 border-t border-gray-200">
                                <button
                                    onClick={() => setShowRatingModal(null)}
                                    className="flex-1 h-10 bg-gray-200 text-gray-700 text-sm font-medium rounded-[8px] hover:bg-gray-300 transition-colors"
                                    disabled={submittingRating}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitRating}
                                    disabled={submittingRating || !ratingData.accuracy || !ratingData.professionalism || !ratingData.behavior || !ratingData.visitTiming}
                                    className="flex-1 h-10 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submittingRating ? "Submitting..." : "Submit Rating"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cancellation Reason Input Modal */}
                <InputModal
                    isOpen={showCancellationInput}
                    onClose={() => {
                        setShowCancellationInput(false);
                        setCancelBookingData(null);
                    }}
                    onSubmit={handleCancellationReasonSubmit}
                    title="Cancel Booking"
                    message="Please provide a reason for cancellation (optional):"
                    placeholder="Enter cancellation reason..."
                    submitText="Continue"
                    cancelText="Cancel"
                    isTextarea={true}
                    textareaRows={3}
                />

                {/* Cancel Booking Confirmation Modal */}
                <ConfirmModal
                    isOpen={showCancelConfirm}
                    onClose={() => {
                        setShowCancelConfirm(false);
                        setCancelBookingData(null);
                    }}
                    onConfirm={handleCancelConfirm}
                    title="Confirm Cancellation"
                    message="Are you sure you want to cancel this booking?"
                    confirmText="Yes, Cancel Booking"
                    cancelText="Keep Booking"
                    confirmColor="danger"
                />
            </div>
        </div>
    );
}
  