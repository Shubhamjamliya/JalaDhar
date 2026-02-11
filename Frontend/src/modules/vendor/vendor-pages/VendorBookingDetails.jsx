import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
    IoCarOutline,
    IoAddCircleOutline,
    IoCloseOutline,
    IoAlertCircleOutline,
} from "react-icons/io5";
import { getBookingDetails, acceptBooking, rejectBooking, markBookingAsVisited, requestTravelCharges, downloadInvoice } from "../../../services/vendorApi";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";

export default function VendorBookingDetails() {
    const navigate = useNavigate();
    const location = useLocation();
    const { bookingId } = useParams();
    const { vendor } = useVendorAuth();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [booking, setBooking] = useState(null);
    const toast = useToast();
    const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);
    const [showVisitConfirm, setShowVisitConfirm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showTravelChargesModal, setShowTravelChargesModal] = useState(false);
    const [travelChargesData, setTravelChargesData] = useState({
        amount: "",
        reason: ""
    });
    const [submittingTravelCharges, setSubmittingTravelCharges] = useState(false);

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

    const handleAccept = () => {
        setShowAcceptConfirm(true);
    };

    const handleAcceptConfirm = async () => {
        setShowAcceptConfirm(false);
        const loadingToast = toast.showLoading("Accepting booking...");
        try {
            setActionLoading(true);

            const response = await acceptBooking(bookingId);

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Booking accepted successfully!");
                await loadBookingDetails(); // Reload to get updated status
                navigate("/vendor/bookings");
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to accept booking");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to accept booking");
            // Reload booking details to see current status
            if (err.response?.status === 400) {
                await loadBookingDetails();
            }
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

            const response = await rejectBooking(bookingId, rejectionReason);

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Booking rejected successfully.");
                setRejectionReason("");
                setTimeout(() => {
                    navigate("/vendor/bookings");
                }, 2000);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to reject booking");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to reject booking");
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

    const handleMarkAsVisited = () => {
        setShowVisitConfirm(true);
    };

    const handleVisitConfirm = async () => {
        setShowVisitConfirm(false);
        const loadingToast = toast.showLoading("Marking as visited...");
        try {
            setActionLoading(true);

            const response = await markBookingAsVisited(bookingId);

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Booking marked as visited successfully!");
                await loadBookingDetails(); // Reload to get updated status
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to mark booking as visited");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to mark booking as visited");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubmitTravelCharges = async () => {
        if (!travelChargesData.amount || parseFloat(travelChargesData.amount) <= 0) {
            toast.showError("Please enter a valid amount");
            return;
        }

        const loadingToast = toast.showLoading("Submitting travel charges request...");
        try {
            setSubmittingTravelCharges(true);

            const response = await requestTravelCharges(bookingId, {
                amount: parseFloat(travelChargesData.amount),
                reason: travelChargesData.reason || ""
            });

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Travel charges request submitted successfully!");
                setShowTravelChargesModal(false);
                setTravelChargesData({ amount: "", reason: "" });
                await loadBookingDetails();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to submit travel charges request");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to submit travel charges request");
        } finally {
            setSubmittingTravelCharges(false);
        }
    };

    const handleDownloadInvoice = async () => {
        const loadingToast = toast.showLoading("Downloading invoice...");
        try {
            const response = await downloadInvoice(bookingId);

            if (response.success && response.data.invoiceUrl) {
                // Open invoice URL in new tab
                window.open(response.data.invoiceUrl, '_blank');
                toast.dismissToast(loadingToast);
                toast.showSuccess("Invoice opened successfully!");
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Invoice not available");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to download invoice");
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

            {/* Removed Back Button from here as it's now in VendorNavbar */}

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[#4A4A4A] text-sm">
                        Booking ID: {booking._id || booking.id}
                    </p>
                    {/* Pending Status Badge - Right Side Top with Orange Color */}
                    {(booking.status === "PENDING" || booking.status === "ASSIGNED") ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                            Pending
                        </span>
                    ) : (
                        getStatusBadge(booking.status)
                    )}
                </div>
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
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Charges Breakdown</h2>
                    <div className="space-y-3">
                        {/* Service Charges */}
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-sm text-gray-600">Service Charges</span>
                                {booking.service?.name && (
                                    <p className="text-xs text-gray-500 mt-0.5">{booking.service.name}</p>
                                )}
                            </div>
                            <span className="font-semibold text-gray-800">
                                ₹{booking.payment.baseServiceFee?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || booking.service?.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                            </span>
                        </div>

                        {/* Travel Charges with Distance */}
                        {booking.payment.travelCharges !== undefined && booking.payment.travelCharges > 0 && (
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="text-sm text-gray-600">Travel Charges</span>
                                    {booking.payment.distance !== null && booking.payment.distance !== undefined && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Distance: {booking.payment.distance.toFixed(2)} km
                                        </p>
                                    )}
                                </div>
                                <span className="font-semibold text-gray-800">
                                    ₹{booking.payment.travelCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}

                        {/* Total (Service + Travel) */}
                        <div className="pt-2 border-t-2 border-gray-300 flex justify-between items-center">
                            <span className="text-base font-bold text-gray-800">Total (Service + Travel)</span>
                            <span className="text-lg font-bold text-[#0A84FF]">
                                ₹{booking.payment.subtotal !== undefined
                                    ? booking.payment.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    : ((booking.payment.baseServiceFee || 0) + (booking.payment.travelCharges || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                            </span>
                        </div>

                        {/* Payment Status */}
                        <div className="pt-2 border-t border-gray-200 mt-2">
                            <span className="text-xs text-gray-500">Payment Status: </span>
                            <span className={`text-xs font-semibold ${booking.payment.status === "SUCCESS" ? "text-green-600" :
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

            {/* Mark as Visited Button */}
            {booking.status === "ACCEPTED" && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Actions</h2>
                    <button
                        onClick={handleMarkAsVisited}
                        disabled={actionLoading}
                        className="w-full bg-[#0A84FF] text-white font-semibold py-3 px-6 rounded-[12px] hover:bg-[#005BBB] active:bg-[#004A9A] transition-colors flex items-center justify-center gap-2 shadow-[0px_4px_10px_rgba(10,132,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <IoCheckmarkCircleOutline className="text-xl" />
                        {actionLoading ? "Processing..." : "Mark as Visited"}
                    </button>
                </div>
            )}

            {/* Upload Report Button */}
            {booking.status === "VISITED" && !booking.report && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Actions</h2>
                    <button
                        onClick={() => navigate(`/vendor/bookings/${bookingId}/upload-report`)}
                        className="w-full bg-[#0A84FF] text-white font-semibold py-3 px-6 rounded-[12px] hover:bg-[#005BBB] active:bg-[#004A9A] transition-colors flex items-center justify-center gap-2 shadow-[0px_4px_10px_rgba(10,132,255,0.2)]"
                    >
                        <IoDocumentTextOutline className="text-xl" />
                        Upload Report
                    </button>
                </div>
            )}

            {/* Travel Charges Request Section */}
            {["ACCEPTED", "VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "COMPLETED"].includes(booking.status) && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Travel Charges</h2>
                        {booking.travelChargesRequest?.status && (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.travelChargesRequest.status === "APPROVED"
                                ? "bg-green-100 text-green-700"
                                : booking.travelChargesRequest.status === "REJECTED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}>
                                {booking.travelChargesRequest.status}
                            </span>
                        )}
                    </div>

                    {booking.travelChargesRequest ? (
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Requested Amount:</span>
                                <span className="font-semibold text-gray-800">₹{booking.travelChargesRequest.amount?.toLocaleString() || 0}</span>
                            </div>
                            {booking.travelChargesRequest.reason && (
                                <div>
                                    <span className="text-gray-600">Reason:</span>
                                    <p className="text-gray-800 mt-1">{booking.travelChargesRequest.reason}</p>
                                </div>
                            )}
                            {booking.travelChargesRequest.status === "REJECTED" && booking.travelChargesRequest.rejectionReason && (
                                <div className="bg-red-50 border border-red-200 rounded-[8px] p-3">
                                    <p className="text-sm text-red-700">
                                        <strong>Rejection Reason:</strong> {booking.travelChargesRequest.rejectionReason}
                                    </p>
                                </div>
                            )}
                            {booking.travelChargesRequest.requestedAt && (
                                <div className="text-sm text-gray-500">
                                    Requested: {formatDate(booking.travelChargesRequest.requestedAt)}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-gray-600 mb-4">
                                Request travel charges if you need reimbursement for travel expenses.
                            </p>
                            <button
                                onClick={() => setShowTravelChargesModal(true)}
                                className="w-full bg-[#0A84FF] text-white font-semibold py-3 px-6 rounded-[12px] hover:bg-[#005BBB] active:bg-[#004A9A] transition-colors flex items-center justify-center gap-2 shadow-[0px_4px_10px_rgba(10,132,255,0.2)]"
                            >
                                <IoAddCircleOutline className="text-xl" />
                                Request Travel Charges
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Travel Charges Request Modal */}
            {showTravelChargesModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => !submittingTravelCharges && setShowTravelChargesModal(false)}
                >
                    <div
                        className="bg-white rounded-[16px] w-full max-w-md flex flex-col shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800">Request Travel Charges</h2>
                            <button
                                onClick={() => !submittingTravelCharges && setShowTravelChargesModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                disabled={submittingTravelCharges}
                            >
                                <IoCloseOutline className="text-2xl text-gray-600" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Amount (₹) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={travelChargesData.amount}
                                        onChange={(e) => setTravelChargesData({ ...travelChargesData, amount: e.target.value })}
                                        placeholder="Enter amount"
                                        className="w-full border border-gray-300 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#0A84FF]"
                                        disabled={submittingTravelCharges}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Reason (Optional)
                                    </label>
                                    <textarea
                                        value={travelChargesData.reason}
                                        onChange={(e) => setTravelChargesData({ ...travelChargesData, reason: e.target.value })}
                                        placeholder="Explain why you need travel charges..."
                                        rows="4"
                                        className="w-full border border-gray-300 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#0A84FF]"
                                        disabled={submittingTravelCharges}
                                        maxLength={500}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {travelChargesData.reason.length}/500 characters
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 p-5 border-t border-gray-200">
                            <button
                                onClick={() => setShowTravelChargesModal(false)}
                                className="flex-1 h-10 bg-gray-200 text-gray-700 text-sm font-medium rounded-[8px] hover:bg-gray-300 transition-colors"
                                disabled={submittingTravelCharges}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitTravelCharges}
                                disabled={submittingTravelCharges || !travelChargesData.amount || parseFloat(travelChargesData.amount) <= 0}
                                className="flex-1 h-10 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submittingTravelCharges ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Request"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Visual Status Timeline */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Booking Timeline</h2>
                    <button
                        onClick={() => navigate(`/vendor/booking/${booking._id || booking.id}/status`)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-[#0A84FF] hover:text-[#005BBB] transition-colors"
                    >
                        <IoDocumentTextOutline className="text-base" />
                        View Full Status
                    </button>
                </div>

                {/* Visual Step Timeline */}
                {(() => {
                    const status = booking.vendorStatus || booking.status;
                    const timelineSteps = [
                        { id: "assigned", label: "Assigned", icon: "📋", statuses: ["ASSIGNED"], date: booking.assignedAt },
                        { id: "accepted", label: "Accepted", icon: "✅", statuses: ["ACCEPTED"], date: booking.acceptedAt },
                        { id: "visited", label: "Visited", icon: "🏠", statuses: ["VISITED"], date: booking.visitedAt },
                        { id: "report", label: "Report", icon: "📄", statuses: ["REPORT_UPLOADED"], date: booking.reportUploadedAt },
                        { id: "payment", label: "Payment", icon: "💰", statuses: ["AWAITING_PAYMENT", "PAYMENT_SUCCESS", "PAID_FIRST"], date: booking.payment?.remainingPaidAt },
                        { id: "completed", label: "Completed", icon: "🎉", statuses: ["COMPLETED"], date: booking.completedAt },
                    ];

                    const statusOrder = ["ASSIGNED", "ACCEPTED", "VISITED", "REPORT_UPLOADED", "AWAITING_PAYMENT", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT", "COMPLETED"];
                    const currentIndex = statusOrder.indexOf(status);

                    return (
                        <div className="flex items-center justify-between gap-1">
                            {timelineSteps.map((step, index) => {
                                const stepStatusIndex = statusOrder.indexOf(step.statuses[0]);
                                const isCompleted = currentIndex >= 0 && currentIndex > stepStatusIndex;
                                const isActive = step.statuses.includes(status);
                                const isPending = !isCompleted && !isActive;

                                return (
                                    <div key={step.id} className="flex items-center flex-1">
                                        <div className="flex flex-col items-center flex-1">
                                            {/* Step Circle */}
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${isCompleted
                                                    ? "bg-green-100 border-2 border-green-500"
                                                    : isActive
                                                        ? "bg-blue-100 border-2 border-[#0A84FF] ring-2 ring-blue-200 animate-pulse"
                                                        : "bg-gray-100 border-2 border-gray-300"
                                                    }`}
                                            >
                                                {isCompleted ? (
                                                    <IoCheckmarkCircleOutline className="text-green-600 text-xl" />
                                                ) : (
                                                    <span className={`text-sm ${isPending ? "grayscale opacity-50" : ""}`}>{step.icon}</span>
                                                )}
                                            </div>
                                            {/* Label */}
                                            <span
                                                className={`text-[10px] font-semibold mt-1.5 text-center leading-tight ${isCompleted ? "text-green-700" : isActive ? "text-[#0A84FF]" : "text-gray-400"
                                                    }`}
                                            >
                                                {step.label}
                                            </span>
                                            {/* Date */}
                                            {step.date && (isCompleted || isActive) && (
                                                <span className="text-[9px] text-gray-400 mt-0.5">
                                                    {new Date(step.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                </span>
                                            )}
                                        </div>
                                        {/* Connector Line */}
                                        {index < timelineSteps.length - 1 && (
                                            <div
                                                className={`h-0.5 flex-1 min-w-2 -mt-4 ${isCompleted ? "bg-green-400" : "bg-gray-200"
                                                    }`}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}

                {/* Detailed dates */}
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
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

            {/* Accept Booking Confirmation Modal */}
            <ConfirmModal
                isOpen={showAcceptConfirm}
                onClose={() => setShowAcceptConfirm(false)}
                onConfirm={handleAcceptConfirm}
                title="Accept Booking"
                message="Are you sure you want to accept this booking?"
                confirmText="Yes, Accept"
                cancelText="Cancel"
                confirmColor="primary"
            />

            {/* Rejection Reason Input Modal */}
            <InputModal
                isOpen={showRejectInput}
                onClose={() => {
                    setShowRejectInput(false);
                    setRejectionReason("");
                }}
                onSubmit={handleRejectionReasonSubmit}
                title="Reject Booking"
                message="Please provide a reason for rejection (minimum 10 characters):"
                placeholder="Enter rejection reason..."
                submitText="Continue"
                cancelText="Cancel"
                minLength={10}
                isTextarea={true}
                textareaRows={4}
            />

            {/* Reject Booking Confirmation Modal */}
            <ConfirmModal
                isOpen={showRejectConfirm}
                onClose={() => {
                    setShowRejectConfirm(false);
                    setRejectionReason("");
                }}
                onConfirm={handleRejectConfirm}
                title="Confirm Rejection"
                message="Are you sure you want to reject this booking?"
                confirmText="Yes, Reject"
                cancelText="Cancel"
                confirmColor="danger"
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
            />

            {/* Download Invoice - Available when final settlement is done */}
            {booking && ["FINAL_SETTLEMENT", "COMPLETED", "SUCCESS"].includes(booking.status) && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Invoice</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Download your invoice with all payment information and settlement details.
                    </p>
                    <button
                        onClick={handleDownloadInvoice}
                        className="w-full bg-[#0A84FF] text-white font-semibold py-3 px-6 rounded-[12px] hover:bg-[#005BBB] active:bg-[#004A9A] transition-colors flex items-center justify-center gap-2 shadow-[0px_4px_10px_rgba(10,132,255,0.2)]"
                    >
                        <IoDownloadOutline className="text-xl" />
                        Download Invoice
                    </button>
                </div>
            )}

            {/* Raise Dispute Button - Available for all bookings */}
            {booking && !["CANCELLED", "REJECTED"].includes(booking.status) && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Need Help?</h2>
                    <button
                        onClick={() => navigate("/vendor/disputes/create", { state: { bookingId: bookingId } })}
                        className="w-full bg-orange-500 text-white font-semibold py-3 px-6 rounded-[12px] hover:bg-orange-600 active:bg-orange-700 transition-colors flex items-center justify-center gap-2 shadow-[0px_4px_10px_rgba(249,115,22,0.2)]"
                    >
                        <IoAlertCircleOutline className="text-xl" />
                        Raise Dispute
                    </button>
                </div>
            )}
        </div>
    );
}

