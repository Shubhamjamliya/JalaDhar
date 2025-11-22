import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    IoChevronBackOutline,
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
} from "react-icons/io5";
import { getBookingDetails, downloadInvoice, cancelBooking, submitRating, getBookingRating } from "../../../services/bookingApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import SuccessMessage from "../../shared/components/SuccessMessage";

export default function UserBookingDetails() {
    const navigate = useNavigate();
    const { bookingId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [booking, setBooking] = useState(null);
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

    useEffect(() => {
        loadBookingDetails();
    }, [bookingId]);

    const loadBookingDetails = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getBookingDetails(bookingId);
            if (response.success) {
                setBooking(response.data.booking);
            } else {
                setError(response.message || "Failed to load booking details");
            }
        } catch (err) {
            console.error("Load booking details error:", err);
            setError("Failed to load booking details");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadBill = async () => {
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
        } catch (err) {
            console.error("Download invoice error:", err);
            alert("Failed to download invoice");
        }
    };

    const handleCancelBooking = async () => {
        const cancellationReason = window.prompt(
            "Please provide a reason for cancellation (optional):"
        );

        if (cancellationReason === null) {
            return;
        }

        if (!window.confirm("Are you sure you want to cancel this booking?")) {
            return;
        }

        try {
            setError("");
            setSuccess("");
            const response = await cancelBooking(bookingId, cancellationReason || "");

            if (response.success) {
                setSuccess("Booking cancelled successfully!");
                await loadBookingDetails();
            } else {
                setError(response.message || "Failed to cancel booking");
            }
        } catch (err) {
            console.error("Cancel booking error:", err);
            setError(err.response?.data?.message || "Failed to cancel booking");
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
            console.error("Get rating error:", err);
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

    const handleSubmitRating = async () => {
        if (!ratingData.accuracy || !ratingData.professionalism || !ratingData.behavior || !ratingData.visitTiming) {
            setError("Please provide all ratings");
            return;
        }

        try {
            setSubmittingRating(true);
            setError("");
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
                setSuccess("Rating submitted successfully!");
                setShowRatingModal(false);
                await loadBookingDetails();
            } else {
                setError(response.message || "Failed to submit rating");
            }
        } catch (err) {
            console.error("Submit rating error:", err);
            setError(err.response?.data?.message || "Failed to submit rating");
        } finally {
            setSubmittingRating(false);
        }
    };

    const getStatusConfig = (status) => {
        const configs = {
            PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: IoHourglassOutline },
            ASSIGNED: { label: "Assigned", color: "bg-blue-100 text-blue-700", icon: IoPersonOutline },
            ACCEPTED: { label: "Accepted", color: "bg-green-100 text-green-700", icon: IoCheckmarkCircleOutline },
            VISITED: { label: "Visited", color: "bg-purple-100 text-purple-700", icon: IoConstructOutline },
            REPORT_UPLOADED: { label: "Report Uploaded", color: "bg-indigo-100 text-indigo-700", icon: IoDocumentTextOutline },
            AWAITING_PAYMENT: { label: "Awaiting Payment", color: "bg-orange-100 text-orange-700", icon: IoTimeOutline },
            COMPLETED: { label: "Completed", color: "bg-green-100 text-green-700", icon: IoCheckmarkCircleOutline },
            CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: IoCloseCircleOutline },
            REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700", icon: IoCloseCircleOutline },
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
        if (!amount) return "₹0.00";
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatAddress = (address) => {
        if (!address) return "Not provided";
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.pincode) parts.push(address.pincode);
        return parts.join(", ") || "Not provided";
    };

    if (loading) {
        return <LoadingSpinner message="Loading booking details..." />;
    }

    if (error && !booking) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
                <ErrorMessage message={error} />
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 flex items-center gap-2 text-[#0A84FF] hover:text-[#005BBB] transition-colors"
                >
                    <IoChevronBackOutline className="text-xl" />
                    <span className="font-semibold">Go Back</span>
                </button>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
                <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Booking not found</p>
                    <button
                        onClick={() => navigate("/user/history")}
                        className="bg-[#0A84FF] text-white px-6 py-2 rounded-[10px] font-semibold hover:bg-[#005BBB] transition-colors"
                    >
                        Back to History
                    </button>
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(booking.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <div className="min-h-screen w-full bg-[#F6F7F9] px-4 py-6">
                <ErrorMessage message={error} />
                <SuccessMessage message={success} />

                {/* Back Button */}
                <button
                    onClick={() => navigate("/user/history")}
                    className="flex items-center gap-2 mb-4 text-gray-600 hover:text-[#0A84FF] transition-colors"
                >
                    <IoChevronBackOutline className="text-xl" />
                    <span className="text-sm font-medium">Back to History</span>
                </button>

                {/* Booking Header Card */}
                <div className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] mb-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-800 mb-1">
                                {booking.service?.name || "Service"}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {booking.vendor?.name || "Vendor"}
                            </p>
                        </div>
                        <span className={`inline-flex items-center justify-center rounded-[6px] ${statusConfig.color} px-3 py-1`}>
                            <StatusIcon className="text-sm mr-1" />
                            <span className="text-xs font-medium">
                                {statusConfig.label}
                            </span>
                        </span>
                    </div>

                    {/* Date and Amount */}
                    <div className="flex flex-col gap-2 text-sm text-gray-600">
                        <p>
                            <span className="font-medium">Date:</span> {formatDate(booking.scheduledDate, booking.scheduledTime)}
                        </p>
                        <p>
                            <span className="font-medium">Amount:</span> {formatAmount(booking.payment?.totalAmount || booking.payment?.amount || 0)}
                        </p>
                    </div>
                </div>

                {/* Service Details */}
                <div className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Service Details</h2>
                    <div className="space-y-3">
                        <InfoRow
                            icon={IoConstructOutline}
                            label="Service Name"
                            value={booking.service?.name || "N/A"}
                        />
                        {booking.service?.description && (
                            <InfoRow
                                icon={IoDocumentTextOutline}
                                label="Description"
                                value={booking.service.description}
                            />
                        )}
                        {booking.service?.machineType && (
                            <InfoRow
                                icon={IoConstructOutline}
                                label="Machine Type"
                                value={booking.service.machineType}
                            />
                        )}
                        {booking.service?.price && (
                            <InfoRow
                                icon={IoTimeOutline}
                                label="Service Price"
                                value={formatAmount(booking.service.price)}
                            />
                        )}
                    </div>
                </div>

                {/* Vendor Details */}
                <div className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Vendor Details</h2>
                    <div className="space-y-3">
                        <InfoRow
                            icon={IoPersonOutline}
                            label="Vendor Name"
                            value={booking.vendor?.name || "N/A"}
                        />
                        {booking.vendor?.phone && (
                            <InfoRow
                                icon={IoCallOutline}
                                label="Phone"
                                value={booking.vendor.phone}
                            />
                        )}
                        {booking.vendor?.email && (
                            <InfoRow
                                icon={IoMailOutline}
                                label="Email"
                                value={booking.vendor.email}
                            />
                        )}
                        {booking.vendor?.rating?.averageRating && (
                            <InfoRow
                                icon={IoStarOutline}
                                label="Rating"
                                value={`${booking.vendor.rating.averageRating.toFixed(1)} (${booking.vendor.rating.totalRatings || 0} reviews)`}
                            />
                        )}
                    </div>
                </div>

                {/* Booking Address */}
                <div className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Service Address</h2>
                    <InfoRow
                        icon={IoLocationOutline}
                        label="Address"
                        value={formatAddress(booking.address)}
                    />
                </div>

                {/* Payment Details */}
                {booking.payment && (
                    <div className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] mb-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Payment Details</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total Amount:</span>
                                <span className="font-semibold text-gray-800">{formatAmount(booking.payment.totalAmount || booking.payment.amount || 0)}</span>
                            </div>
                            {booking.payment.advanceAmount && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Advance Paid:</span>
                                    <span className={`font-semibold ${booking.payment.advancePaid ? "text-green-600" : "text-gray-800"}`}>
                                        {formatAmount(booking.payment.advanceAmount)} {booking.payment.advancePaid ? "✓" : ""}
                                    </span>
                                </div>
                            )}
                            {booking.payment.remainingAmount && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Remaining Amount:</span>
                                    <span className={`font-semibold ${booking.payment.remainingPaid ? "text-green-600" : "text-gray-800"}`}>
                                        {formatAmount(booking.payment.remainingAmount)} {booking.payment.remainingPaid ? "✓" : ""}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-gray-200">
                                <span className="text-gray-600">Payment Status:</span>
                                <span className={`font-semibold ${
                                    booking.payment.status === "SUCCESS" ? "text-green-600" :
                                    booking.payment.status === "PENDING" ? "text-yellow-600" :
                                    "text-red-600"
                                }`}>
                                    {booking.payment.status || "PENDING"}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Work Proof Section */}
                {booking.report?.images && booking.report.images.length > 0 && (
                    <div className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] mb-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Work Proof</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {booking.report.images.slice(0, 4).map((img, index) => (
                                <img
                                    key={index}
                                    src={img.url || img}
                                    alt={`Work proof ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-[8px] cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => setShowWorkProof(true)}
                                />
                            ))}
                        </div>
                        {booking.report.images.length > 4 && (
                            <button
                                onClick={() => setShowWorkProof(true)}
                                className="mt-3 text-sm text-[#0A84FF] hover:underline"
                            >
                                View all {booking.report.images.length} images
                            </button>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 mb-6">
                    {booking.status === "COMPLETED" && (
                        <>
                            {booking.report?.images && booking.report.images.length > 0 && (
                                <button
                                    onClick={() => setShowWorkProof(true)}
                                    className="w-full h-12 bg-[#E7F0FB] text-[#0A84FF] text-sm font-medium rounded-[8px] hover:bg-[#D0E1F7] transition-colors"
                                >
                                    View Work Proof
                                </button>
                            )}
                            <button
                                onClick={handleDownloadBill}
                                className="w-full h-12 bg-[#E7F0FB] text-[#0A84FF] text-sm font-medium rounded-[8px] hover:bg-[#D0E1F7] transition-colors"
                            >
                                Download Bill
                            </button>
                            <button
                                onClick={handleRateVendor}
                                className="w-full h-12 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors"
                            >
                                Rate Vendor
                            </button>
                        </>
                    )}

                    {booking.status === "AWAITING_PAYMENT" && (
                        <button
                            onClick={() => navigate(`/user/booking/${bookingId}/payment`)}
                            className="w-full h-12 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors"
                        >
                            Pay Remaining Amount
                        </button>
                    )}

                    {["PENDING", "ASSIGNED", "ACCEPTED"].includes(booking.status) && (
                        <button
                            onClick={handleCancelBooking}
                            className="w-full h-12 bg-red-500 text-white text-sm font-semibold rounded-[8px] hover:bg-red-600 transition-colors"
                        >
                            Cancel Booking
                        </button>
                    )}
                </div>

                {/* Work Proof Modal */}
                {showWorkProof && booking.report?.images && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={() => setShowWorkProof(false)}
                    >
                        <div
                            className="bg-white rounded-[16px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-5 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-800">Work Proof</h2>
                                <button
                                    onClick={() => setShowWorkProof(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <IoCloseOutline className="text-2xl text-gray-600" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {booking.report.images.map((img, index) => (
                                        <img
                                            key={index}
                                            src={img.url || img}
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
                        onClick={() => setShowRatingModal(false)}
                    >
                        <div
                            className="bg-white rounded-[16px] w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-5 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-800">Rate Vendor</h2>
                                <button
                                    onClick={() => setShowRatingModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    disabled={submittingRating}
                                >
                                    <IoCloseOutline className="text-2xl text-gray-600" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5">
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600 mb-4">
                                        Rate your experience with {booking.vendor?.name || "the vendor"}
                                    </p>

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
                                    onClick={() => setShowRatingModal(false)}
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
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }) {
    const IconComponent = icon;
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#0A84FF] to-[#00C2A8] bg-opacity-10 shrink-0">
                <IconComponent className="text-xl text-[#0A84FF]" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs text-gray-500 mb-1">{label}</span>
                <span className="text-sm font-medium text-gray-800 break-words">
                    {value}
                </span>
            </div>
        </div>
    );
}

