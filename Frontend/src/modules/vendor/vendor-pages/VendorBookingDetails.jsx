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
    IoNavigateOutline,
    IoAlertCircleOutline,
    IoMap,
    IoLogoGoogle,
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
    const [showMapPicker, setShowMapPicker] = useState(false);

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

        // Attempt to open native app
        window.location.href = url;
        setShowMapPicker(false);

        // Safety timeout for web-only environments/desktops
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

            {/* User Information Card */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Customer Information</h2>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        {booking.user?.profilePicture ? (
                            <img
                                src={booking.user.profilePicture}
                                alt={booking.user.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#00C2A8] flex items-center justify-center text-white text-2xl font-bold shadow-sm border-2 border-white">
                                {booking.user?.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                        )}
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
                    <button
                        onClick={handleGetDirections}
                        className="w-full mt-4 bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                    >
                        <IoNavigateOutline className="text-xl" />
                        Get Directions (Open Maps)
                    </button>
                </div>
            </div>

            {/* Payment Information Card */}
            {booking.payment && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Charges Breakdown</h2>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${booking.payment.status === "SUCCESS" ? "bg-green-100 text-green-700" :
                            booking.payment.status === "PARTIAL" ? "bg-blue-100 text-blue-700" :
                                "bg-gray-100 text-gray-500"
                            }`}>
                            {booking.payment.status === "SUCCESS" ? "Full Payment Received" :
                                booking.payment.advancePaid ? "Advance Received" : "Payment Pending"}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Summary Line */}
                        <div className="flex justify-between items-end pb-4 border-b border-gray-100">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Service Value</p>
                                <p className="text-2xl font-black text-gray-900">
                                    ₹{booking.payment.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 mb-1">Machine Type</p>
                                <p className="text-sm font-bold text-[#0A84FF]">{booking.service?.machineType || "Standard"}</p>
                            </div>
                        </div>

                        {/* Installment Breakdown */}
                        <div className="space-y-3 pt-2">
                            {/* Advance Payment (40%) */}
                            <div className={`p-4 rounded-xl border transition-all ${booking.payment.advancePaid ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50 border-gray-100 opacity-75'}`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${booking.payment.advancePaid ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                            {booking.payment.advancePaid ? <IoCheckmarkCircleOutline className="text-xl" /> : <span className="text-xs font-bold">1st</span>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Advance Payment (40%)</p>
                                            <p className="text-[11px] text-gray-500">Collected before site visit</p>
                                        </div>
                                    </div>
                                    <p className={`font-bold ${booking.payment.advancePaid ? 'text-emerald-700' : 'text-gray-600'}`}>
                                        ₹{booking.payment.advanceAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>

                            {/* Final Payment (60%) */}
                            <div className={`p-4 rounded-xl border transition-all ${booking.payment.remainingPaid ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${booking.payment.remainingPaid ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                            {booking.payment.remainingPaid ? <IoCheckmarkCircleOutline className="text-xl" /> : <span className="text-xs font-bold">2nd</span>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Final Settlement (60%)</p>
                                            <p className="text-[11px] text-gray-500">Collected after report upload</p>
                                        </div>
                                    </div>
                                    <p className={`font-bold ${booking.payment.remainingPaid ? 'text-emerald-700' : 'text-gray-600'}`}>
                                        ₹{booking.payment.remainingAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Charges Breakdown Detail */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between text-xs text-gray-600">
                                <span>Base service fee</span>
                                <span>₹{booking.payment.baseServiceFee?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600">
                                <span>Travel charges ({booking.payment.distance?.toFixed(1)}km x 2)</span>
                                <span>₹{booking.payment.travelCharges?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600 font-medium pt-1 border-t border-gray-200">
                                <span className="text-gray-800">GST (Included)</span>
                                <span>₹{booking.payment.gst?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {(booking.notes || booking.purpose || booking.purposeExtent) && (
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Survey Site Info</h2>
                    <div className="space-y-4">
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
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Additional Notes</p>
                                <p className="text-sm text-gray-600 leading-relaxed">{booking.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Report Card (if uploaded) - Only show if status is REPORT_UPLOADED or later */}
            {booking.report && ["REPORT_UPLOADED", "AWAITING_PAYMENT", "COMPLETED", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT"].includes(booking.status) && (
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
            {booking.status === "VISITED" && (
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

                    <div className="space-y-4">
                        {/* Current Applied Travel Charges */}
                        {booking.payment.travelCharges !== undefined && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm">Applied Travel Charges (To & Fro)</p>
                                        {booking.payment.distance !== null && booking.payment.distance !== undefined && (
                                            <p className="text-xs text-gray-600 mt-1">
                                                Distance: {booking.payment.distance.toFixed(2)} km × 2 (Round Trip)
                                            </p>
                                        )}
                                    </div>
                                    <p className="font-bold text-gray-800">
                                        ₹{booking.payment.travelCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Request Status or Button */}
                        {booking.travelChargesRequest ? (
                            <div className="space-y-3 border-t border-gray-100 pt-3">
                                <p className="text-sm font-semibold text-gray-800">Request Details</p>

                                {booking.travelChargesRequest.reason && (
                                    <div>
                                        <span className="text-gray-600 text-sm">Reason:</span>
                                        <p className="text-gray-800 text-sm mt-1">{booking.travelChargesRequest.reason}</p>
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
                                    <div className="text-xs text-gray-500">
                                        Requested: {formatDate(booking.travelChargesRequest.requestedAt)}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Request travel charges if you need reimbursement for travel expenses beyond the applied charges.
                                </p>
                                <button
                                    onClick={() => setShowTravelChargesModal(true)}
                                    className="w-full bg-[#0A84FF] text-white font-semibold py-3 px-6 rounded-[12px] hover:bg-[#005BBB] active:bg-[#004A9A] transition-colors flex items-center justify-center gap-2 shadow-[0px_4px_10px_rgba(10,132,255,0.2)]"
                                >
                                    <IoAddCircleOutline className="text-xl" />
                                    Request Additional Charges
                                </button>
                            </div>
                        )}
                    </div>
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

            {/* Map Application Picker Modal */}
            {showMapPicker && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
                    onClick={() => setShowMapPicker(false)}
                >
                    <div
                        className="bg-white w-full max-w-sm rounded-t-[24px] sm:rounded-[24px] overflow-hidden animate-slide-up"
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

