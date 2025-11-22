import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    IoChevronBackOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoCallOutline,
    IoMailOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoDocumentTextOutline,
    IoImageOutline,
    IoDownloadOutline,
} from "react-icons/io5";
import { getBookingDetails, acceptBooking, rejectBooking, uploadVisitReport } from "../../../services/vendorApi";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import SuccessMessage from "../../shared/components/SuccessMessage";

export default function VendorBookingDetails() {
    const navigate = useNavigate();
    const { bookingId } = useParams();
    const { vendor } = useVendorAuth();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [booking, setBooking] = useState(null);

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
            setError(err.response?.data?.message || "Failed to load booking details");
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!window.confirm("Are you sure you want to accept this booking?")) {
            return;
        }

        try {
            setActionLoading(true);
            setError("");
            setSuccess("");
            
            console.log("Accepting booking with ID:", bookingId);
            const response = await acceptBooking(bookingId);
            
            if (response.success) {
                setSuccess("Booking accepted successfully!");
                await loadBookingDetails(); // Reload to get updated status
                setTimeout(() => {
                    navigate("/vendor/bookings");
                }, 2000);
            } else {
                setError(response.message || "Failed to accept booking");
            }
        } catch (err) {
            console.error("Accept booking error:", err);
            const errorMessage = err.response?.data?.message || "Failed to accept booking";
            setError(errorMessage);
            // Reload booking details to see current status
            if (err.response?.status === 400) {
                setTimeout(() => {
                    loadBookingDetails();
                }, 1000);
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        const rejectionReason = window.prompt(
            "Please provide a reason for rejection (minimum 10 characters):"
        );

        if (!rejectionReason || rejectionReason.trim().length < 10) {
            if (rejectionReason !== null) {
                setError("Rejection reason must be at least 10 characters long.");
            }
            return;
        }

        if (!window.confirm("Are you sure you want to reject this booking?")) {
            return;
        }

        try {
            setActionLoading(true);
            setError("");
            setSuccess("");
            
            console.log("Rejecting booking with ID:", bookingId);
            const response = await rejectBooking(bookingId, rejectionReason);
            
            if (response.success) {
                setSuccess("Booking rejected successfully.");
                setTimeout(() => {
                    navigate("/vendor/bookings");
                }, 2000);
            } else {
                setError(response.message || "Failed to reject booking");
            }
        } catch (err) {
            console.error("Reject booking error:", err);
            const errorMessage = err.response?.data?.message || "Failed to reject booking";
            setError(errorMessage);
            // Reload booking details to see current status
            if (err.response?.status === 400) {
                setTimeout(() => {
                    loadBookingDetails();
                }, 1000);
            }
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            ASSIGNED: { color: "bg-yellow-100 text-yellow-700", label: "Assigned" },
            ACCEPTED: { color: "bg-blue-100 text-blue-700", label: "Accepted" },
            VISITED: { color: "bg-purple-100 text-purple-700", label: "Visited" },
            REPORT_UPLOADED: { color: "bg-indigo-100 text-indigo-700", label: "Report Uploaded" },
            AWAITING_PAYMENT: { color: "bg-orange-100 text-orange-700", label: "Awaiting Payment" },
            COMPLETED: { color: "bg-green-100 text-green-700", label: "Completed" },
            REJECTED: { color: "bg-red-100 text-red-700", label: "Rejected" },
            CANCELLED: { color: "bg-gray-100 text-gray-700", label: "Cancelled" },
        };
        const config = statusConfig[status] || { color: "bg-gray-100 text-gray-700", label: status };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                {config.label}
            </span>
        );
    };

    if (loading) {
        return <LoadingSpinner message="Loading booking details..." />;
    }

    if (error && !booking) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
                <ErrorMessage message={error} />
                <button
                    onClick={() => navigate("/vendor/bookings")}
                    className="mt-4 flex items-center gap-2 text-[#0A84FF] hover:text-[#005BBB] transition-colors"
                >
                    <IoChevronBackOutline className="text-xl" />
                    <span className="font-semibold">Back to Bookings</span>
                </button>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
                <div className="text-center py-8">
                    <p className="text-gray-600">Booking not found</p>
                    <button
                        onClick={() => navigate("/vendor/bookings")}
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
            <ErrorMessage message={error} />
            <SuccessMessage message={success} />

            {/* Back Button */}
            <button
                onClick={() => navigate("/vendor/bookings")}
                className="mb-4 flex items-center gap-2 text-gray-600 hover:text-[#0A84FF] transition-colors"
            >
                <IoChevronBackOutline className="text-xl" />
                <span className="text-sm font-medium">Back to Bookings</span>
            </button>

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        Booking Details
                    </h1>
                    {getStatusBadge(booking.status)}
                </div>
                <p className="text-[#4A4A4A] text-sm">
                    Booking ID: {booking._id || booking.id}
                </p>
            </div>

            {/* User Information Card */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Customer Information</h2>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#00C2A8] flex items-center justify-center text-white text-2xl font-bold">
                            {booking.user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">
                                {booking.user?.name || "User"}
                            </h3>
                            {booking.user?.email && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                    <IoMailOutline className="text-base" />
                                    <a href={`mailto:${booking.user.email}`} className="hover:text-[#0A84FF]">
                                        {booking.user.email}
                                    </a>
                                </div>
                            )}
                            {booking.user?.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                    <IoCallOutline className="text-base" />
                                    <a href={`tel:${booking.user.phone}`} className="hover:text-[#0A84FF]">
                                        {booking.user.phone}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Service Information Card */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Service Information</h2>
                <div className="space-y-3">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Service Name</p>
                        <p className="text-lg font-bold text-gray-800">{booking.service?.name || "Service"}</p>
                    </div>
                    {booking.service?.machineType && (
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Machine Type</p>
                            <p className="text-base text-gray-800">{booking.service.machineType}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Service Price</p>
                        <p className="text-xl font-bold text-[#0A84FF]">
                            ₹{booking.service?.price?.toLocaleString() || "0"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Booking Schedule Card */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Schedule</h2>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <IoTimeOutline className="text-2xl text-[#0A84FF]" />
                        <div>
                            <p className="text-sm text-gray-500">Scheduled Date & Time</p>
                            <p className="text-base font-semibold text-gray-800">
                                {booking.scheduledDate 
                                    ? new Date(booking.scheduledDate).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })
                                    : "N/A"
                                } at {booking.scheduledTime || "N/A"}
                            </p>
                        </div>
                    </div>
                    {booking.address && (
                        <div className="flex items-start gap-3">
                            <IoLocationOutline className="text-2xl text-[#0A84FF] mt-1" />
                            <div>
                                <p className="text-sm text-gray-500">Service Address</p>
                                <p className="text-base text-gray-800">
                                    {booking.address.street && `${booking.address.street}, `}
                                    {booking.address.city && `${booking.address.city}, `}
                                    {booking.address.state && `${booking.address.state} - `}
                                    {booking.address.pincode}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Information Card */}
            {booking.payment && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Information</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Amount:</span>
                            <span className="font-semibold text-gray-800">
                                ₹{booking.payment.totalAmount?.toLocaleString() || "0"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Advance Paid (40%):</span>
                            <span className={`font-semibold ${booking.payment.advancePaid ? "text-green-600" : "text-gray-800"}`}>
                                ₹{booking.payment.advanceAmount?.toLocaleString() || "0"} 
                                {booking.payment.advancePaid ? " ✓" : " (Pending)"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Remaining (60%):</span>
                            <span className={`font-semibold ${booking.payment.remainingPaid ? "text-green-600" : "text-gray-800"}`}>
                                ₹{booking.payment.remainingAmount?.toLocaleString() || "0"}
                                {booking.payment.remainingPaid ? " ✓" : " (Pending)"}
                            </span>
                        </div>
                        <div className="pt-2 border-t border-gray-200 mt-2">
                            <span className="text-xs text-gray-500">Payment Status: </span>
                            <span className={`text-xs font-semibold ${
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

            {/* Notes Card */}
            {booking.notes && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Customer Notes</h2>
                    <p className="text-sm text-gray-600 leading-relaxed">{booking.notes}</p>
                </div>
            )}

            {/* Report Card (if uploaded) */}
            {booking.report && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Visit Report</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Water Found</p>
                            <p className={`text-base font-semibold ${booking.report.waterFound ? "text-green-600" : "text-red-600"}`}>
                                {booking.report.waterFound ? "Yes" : "No"}
                            </p>
                        </div>
                        {booking.report.images && booking.report.images.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Report Images</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {booking.report.images.map((image, index) => (
                                        <img
                                            key={index}
                                            src={image.url}
                                            alt={`Report ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        {booking.report.reportFile && (
                            <div>
                                <a
                                    href={booking.report.reportFile.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-[#0A84FF] hover:text-[#005BBB]"
                                >
                                    <IoDownloadOutline className="text-xl" />
                                    <span>Download Report PDF</span>
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {booking.status === "ASSIGNED" && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Actions</h2>
                    <div className="flex gap-4">
                        <button
                            onClick={handleAccept}
                            disabled={actionLoading}
                            className="flex-1 bg-[#0A84FF] text-white font-semibold py-3 px-6 rounded-[12px] hover:bg-[#005BBB] active:bg-[#004A9A] transition-colors flex items-center justify-center gap-2 shadow-[0px_4px_10px_rgba(10,132,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <IoCheckmarkCircleOutline className="text-xl" />
                            {actionLoading ? "Processing..." : "Accept Booking"}
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={actionLoading}
                            className="flex-1 bg-red-500 text-white font-semibold py-3 px-6 rounded-[12px] hover:bg-red-600 active:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-[0px_4px_10px_rgba(239,68,68,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <IoCloseCircleOutline className="text-xl" />
                            {actionLoading ? "Processing..." : "Reject Booking"}
                        </button>
                    </div>
                </div>
            )}

            {/* Timeline Information */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Timeline</h2>
                <div className="space-y-3 text-sm">
                    {booking.createdAt && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Created:</span>
                            <span className="text-gray-800 font-medium">{formatDate(booking.createdAt)}</span>
                        </div>
                    )}
                    {booking.assignedAt && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Assigned:</span>
                            <span className="text-gray-800 font-medium">{formatDate(booking.assignedAt)}</span>
                        </div>
                    )}
                    {booking.acceptedAt && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Accepted:</span>
                            <span className="text-gray-800 font-medium">{formatDate(booking.acceptedAt)}</span>
                        </div>
                    )}
                    {booking.visitedAt && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Visited:</span>
                            <span className="text-gray-800 font-medium">{formatDate(booking.visitedAt)}</span>
                        </div>
                    )}
                    {booking.completedAt && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Completed:</span>
                            <span className="text-gray-800 font-medium">{formatDate(booking.completedAt)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

