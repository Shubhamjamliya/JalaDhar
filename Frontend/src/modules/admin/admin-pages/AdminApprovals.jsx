import { useState, useEffect } from "react";
import {
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoImageOutline,
    IoTimeOutline,
    IoWalletOutline,
    IoDocumentTextOutline,
    IoPersonOutline,
    IoCalendarOutline,
    IoCarOutline,
    IoCashOutline,
    IoReceiptOutline,
    IoDownloadOutline,
    IoExpandOutline,
} from "react-icons/io5";
import { 
    getBorewellPendingApprovals, 
    approveBorewellResult, 
    getReportPendingApprovals,
    approveReport,
    rejectReport,
    getTravelChargesRequests,
    approveTravelCharges,
    rejectTravelCharges,
    payTravelCharges,
} from "../../../services/adminApi";
import { useTheme } from "../../../contexts/ThemeContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";

export default function AdminApprovals() {
    const { theme, themeColors } = useTheme();
    const currentTheme = themeColors[theme] || themeColors.default;
    const [loading, setLoading] = useState(true);
    const [activeApprovalType, setActiveApprovalType] = useState("travel-charges"); // travel-charges, report, borewell
    const [travelChargesBookings, setTravelChargesBookings] = useState([]);
    const [reportBookings, setReportBookings] = useState([]);
    const [borewellBookings, setBorewellBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const toast = useToast();
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(""); // approve, reject, pay, etc.
    const [rejectionReason, setRejectionReason] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPayTravelConfirm, setShowPayTravelConfirm] = useState(false);
    const [showApproveReportConfirm, setShowApproveReportConfirm] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    
    // Pagination
    const [travelChargesPagination, setTravelChargesPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        total: 0,
    });
    const [reportPagination, setReportPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalBookings: 0,
    });
    const [borewellPagination, setBorewellPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalBookings: 0,
    });

    useEffect(() => {
        loadData();
    }, [activeApprovalType]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Reset arrays when switching tabs to prevent showing stale data
            if (activeApprovalType === "travel-charges") {
                setReportBookings([]);
                setBorewellBookings([]);
            } else if (activeApprovalType === "report") {
                setTravelChargesBookings([]);
                setBorewellBookings([]);
            } else if (activeApprovalType === "borewell") {
                setTravelChargesBookings([]);
                setReportBookings([]);
            }
            
            if (activeApprovalType === "travel-charges") {
                const response = await getTravelChargesRequests({
                    page: travelChargesPagination.currentPage,
                    limit: 10,
                    status: "PENDING",
                });
                if (response.success) {
                    setTravelChargesBookings(response.data.requests || []);
                    setTravelChargesPagination(response.data.pagination || {
                        currentPage: 1,
                        totalPages: 1,
                        total: 0,
                    });
                } else {
                    toast.showError(response.message || "Failed to load travel charges requests");
                }
            } else if (activeApprovalType === "report") {
                const response = await getReportPendingApprovals({
                    page: reportPagination.currentPage,
                    limit: 10,
                    status: "REPORT_UPLOADED",
                });
                if (response.success) {
                    const bookings = response.data.bookings || [];
                    // Debug: Log report data to check images
                    bookings.forEach(booking => {
                        if (booking.report) {
                            console.log('Booking Report Data:', {
                                bookingId: booking._id,
                                hasReport: !!booking.report,
                                hasImages: !!booking.report.images,
                                imagesLength: booking.report.images?.length || 0,
                                images: booking.report.images,
                                reportFile: booking.report.reportFile
                            });
                        }
                    });
                    setReportBookings(bookings);
                    setReportPagination(response.data.pagination || {
                        currentPage: 1,
                        totalPages: 1,
                        totalBookings: 0,
                    });
                } else {
                    toast.showError(response.message || "Failed to load report approvals");
                }
            } else if (activeApprovalType === "borewell") {
                const response = await getBorewellPendingApprovals({
                    page: borewellPagination.currentPage,
                    limit: 10,
                    status: "BOREWELL_UPLOADED",
                });
                if (response.success) {
                    setBorewellBookings(response.data.bookings || []);
                    setBorewellPagination(response.data.pagination || {
                        currentPage: 1,
                        totalPages: 1,
                        totalBookings: 0,
                    });
                } else {
                    toast.showError(response.message || "Failed to load borewell approvals");
                }
            }
        } catch (err) {
            console.error("Load data error:", err);
            handleApiError(err, "Failed to load data. Please try again.");
            // Reset arrays on error
            if (activeApprovalType === "travel-charges") {
                setTravelChargesBookings([]);
            } else if (activeApprovalType === "report") {
                setReportBookings([]);
            } else if (activeApprovalType === "borewell") {
                setBorewellBookings([]);
            }
        } finally {
            setLoading(false);
        }
    };

    // Travel Charges Handlers
    const handleApproveTravelCharges = async (bookingId) => {
        try {
            setError("");
            const response = await approveTravelCharges(bookingId);
            if (response.success) {
                toast.showSuccess("Travel charges request approved successfully!");
                await loadData();
            } else {
                setError(response.message || "Failed to approve travel charges");
            }
        } catch (err) {
            console.error("Approve travel charges error:", err);
            setError(err.response?.data?.message || "Failed to approve travel charges");
        }
    };

    const handleRejectTravelCharges = async (bookingId) => {
        if (!rejectionReason || rejectionReason.trim().length < 10) {
            setError("Rejection reason must be at least 10 characters long.");
            return;
        }

        try {
            setError("");
            const response = await rejectTravelCharges(bookingId, { rejectionReason: rejectionReason.trim() });
            if (response.success) {
                toast.showSuccess("Travel charges request rejected successfully!");
                setShowModal(false);
                setRejectionReason("");
                await loadData();
            } else {
                setError(response.message || "Failed to reject travel charges");
            }
        } catch (err) {
            console.error("Reject travel charges error:", err);
            setError(err.response?.data?.message || "Failed to reject travel charges");
        }
    };

    const handlePayTravelCharges = (bookingId) => {
        setSelectedBookingId(bookingId);
        setShowPayTravelConfirm(true);
    };

    const handlePayTravelConfirm = async () => {
        if (!selectedBookingId) return;
        const bookingId = selectedBookingId;
        setShowPayTravelConfirm(false);
        const loadingToast = toast.showLoading("Paying travel charges...");
        try {
            const response = await payTravelCharges(bookingId);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Travel charges paid successfully!");
                setSelectedBookingId(null);
                await loadData();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to pay travel charges");
            }
        } catch (err) {
            console.error("Pay travel charges error:", err);
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to pay travel charges");
        }
    };

    // Report Approval Handler (without payment)
    const handleApproveReport = (bookingId) => {
        setSelectedBookingId(bookingId);
        setShowApproveReportConfirm(true);
    };

    const handleApproveReportConfirm = async () => {
        if (!selectedBookingId) return;
        const bookingId = selectedBookingId;
        setShowApproveReportConfirm(false);
        const loadingToast = toast.showLoading("Approving report...");
        try {
            const response = await approveReport(bookingId);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Report approved successfully! Payment can be processed from payments page.");
                setSelectedBookingId(null);
                await loadData();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to approve report");
            }
        } catch (err) {
            console.error("Approve report error:", err);
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to approve report");
        }
    };

    // Report Rejection Handler
    const handleRejectReport = async (bookingId) => {
        if (!rejectionReason || rejectionReason.trim().length < 10) {
            setError("Rejection reason must be at least 10 characters long.");
            return;
        }

        try {
            setError("");
            const response = await rejectReport(bookingId, { rejectionReason: rejectionReason.trim() });
            if (response.success) {
                toast.showSuccess("Report rejected successfully! Vendor can re-upload the report.");
                setShowModal(false);
                setRejectionReason("");
                setSelectedBooking(null);
                await loadData();
            } else {
                setError(response.message || "Failed to reject report");
            }
        } catch (err) {
            console.error("Reject report error:", err);
            setError(err.response?.data?.message || "Failed to reject report");
        }
    };

    // Borewell Approval Handlers
    const handleApproveBorewell = async (booking, approved) => {
        try {
            setError("");
            const response = await approveBorewellResult(booking._id, { approved });
            if (response.success) {
                toast.showSuccess(`Borewell result ${approved ? "approved as SUCCESS" : "approved as FAILED"} successfully!`);
                setShowModal(false);
                setSelectedBooking(null);
                await loadData();
            } else {
                setError(response.message || "Failed to approve borewell result");
            }
        } catch (err) {
            console.error("Approve borewell error:", err);
            setError(err.response?.data?.message || "Failed to approve borewell result");
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Show loading spinner when loading and no data for current tab
    if (loading) {
        const hasData = 
            (activeApprovalType === "travel-charges" && travelChargesBookings.length > 0) ||
            (activeApprovalType === "report" && reportBookings.length > 0) ||
            (activeApprovalType === "borewell" && borewellBookings.length > 0);
        
        if (!hasData) {
            return (
                <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
                    <LoadingSpinner message={`Loading ${activeApprovalType === "travel-charges" ? "travel charges" : activeApprovalType === "report" ? "report" : "borewell"} approvals...`} />
                </div>
            );
        }
    }

    return (
        <>
        <div className="min-h-[calc(100vh-5rem)]">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Approvals</h1>
                <p className="text-gray-600">Manage all vendor approvals: travel charges, reports, and borewell results</p>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600">{success}</p>
                </div>
            )}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Approval Type Tabs */}
            <div className="mb-6">
                <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
                    <button
                        onClick={() => {
                            setActiveApprovalType("travel-charges");
                            setError("");
                            setTravelChargesPagination({ ...travelChargesPagination, currentPage: 1 });
                        }}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                            activeApprovalType === "travel-charges"
                                ? "border-purple-500 text-purple-600"
                                : "border-transparent text-gray-600 hover:text-gray-800"
                        }`}
                    >
                        Travel Charges
                        {activeApprovalType === "travel-charges" && 
                         travelChargesBookings.filter(b => b.travelChargesRequest?.status === "PENDING").length > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                {travelChargesBookings.filter(b => b.travelChargesRequest?.status === "PENDING").length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setActiveApprovalType("report");
                            setError("");
                            setReportPagination({ ...reportPagination, currentPage: 1 });
                        }}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                            activeApprovalType === "report"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-600 hover:text-gray-800"
                        }`}
                    >
                        Report Approval
                        {activeApprovalType === "report" && reportBookings.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                                {reportBookings.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setActiveApprovalType("borewell");
                            setError("");
                            setBorewellPagination({ ...borewellPagination, currentPage: 1 });
                        }}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                            activeApprovalType === "borewell"
                                ? "border-orange-500 text-orange-600"
                                : "border-transparent text-gray-600 hover:text-gray-800"
                        }`}
                    >
                        Borewell Approval
                        {activeApprovalType === "borewell" && 
                         borewellBookings.filter(b => !b.borewellResult?.approvedAt).length > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                {borewellBookings.filter(b => !b.borewellResult?.approvedAt).length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Travel Charges Approval Tab */}
            {activeApprovalType === "travel-charges" && (
                <div className="space-y-4">
                    {travelChargesBookings.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
                            <IoCarOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 font-semibold">No travel charges requests</p>
                            <p className="text-sm text-gray-500 mt-2">No pending travel charges requests found</p>
                        </div>
                    ) : (
                        travelChargesBookings
                            .filter(request => request.travelChargesRequest?.status === "PENDING")
                            .map((request) => (
                                <div
                                    key={request.bookingId || request._id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <IoCarOutline className="text-2xl text-purple-600" />
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-800">
                                                        Booking #{request.bookingId?.toString().slice(-8) || request._id?.toString().slice(-8)}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {request.vendor?.name || "Vendor"} → {request.user?.name || "User"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-purple-50 rounded-lg p-3">
                                                    <p className="text-xs text-gray-600 mb-1">Requested Amount</p>
                                                    <p className="text-lg font-bold text-purple-700">
                                                        {formatCurrency(request.travelChargesRequest?.amount || 0)}
                                                    </p>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <p className="text-xs text-gray-600 mb-1">Vendor</p>
                                                    <p className="text-sm font-semibold text-gray-800">{request.vendor?.name || "N/A"}</p>
                                                    <p className="text-xs text-gray-500">{request.vendor?.email || ""}</p>
                                                </div>
                                                <div className="bg-blue-50 rounded-lg p-3">
                                                    <p className="text-xs text-gray-600 mb-1">User</p>
                                                    <p className="text-sm font-semibold text-gray-800">{request.user?.name || "N/A"}</p>
                                                    <p className="text-xs text-gray-500">{request.user?.email || ""}</p>
                                                </div>
                                            </div>
                                            {request.travelChargesRequest?.reason && (
                                                <div className="mt-4 bg-gray-50 rounded-lg p-3">
                                                    <p className="text-xs text-gray-600 mb-1">Reason</p>
                                                    <p className="text-sm text-gray-800">{request.travelChargesRequest.reason}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => handleApproveTravelCharges(request.bookingId || request._id)}
                                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm whitespace-nowrap"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedBooking(request);
                                                    setModalType("reject-travel");
                                                    setShowModal(true);
                                                }}
                                                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm whitespace-nowrap"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            )}

            {/* Report Approval Tab */}
            {activeApprovalType === "report" && (
                <div className="space-y-4">
                    {reportBookings.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
                            <IoDocumentTextOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 font-semibold">No reports pending approval</p>
                            <p className="text-sm text-gray-500 mt-2">No reports are waiting for approval</p>
                        </div>
                    ) : (
                        reportBookings.map((booking) => (
                            <div
                                key={booking._id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <IoDocumentTextOutline className="text-2xl text-blue-600" />
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800">
                                                    Booking #{booking._id.toString().slice(-8)}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {booking.vendor?.name || "Vendor"} → {booking.user?.name || "User"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-xs text-gray-600 mb-1">Vendor</p>
                                                <p className="text-sm font-semibold text-gray-800">{booking.vendor?.name || "N/A"}</p>
                                                <p className="text-xs text-gray-500">{booking.vendor?.email || ""}</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-xs text-gray-600 mb-1">Report Uploaded</p>
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {formatDate(booking.report?.uploadedAt)}
                                                </p>
                                            </div>
                                        </div>
                                        {booking.report?.waterFound !== null && (
                                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                                <p className="text-xs text-gray-600 mb-1">Water Found</p>
                                                <p className={`text-sm font-semibold ${booking.report.waterFound ? "text-green-600" : "text-red-600"}`}>
                                                    {booking.report.waterFound ? "Yes" : "No"}
                                                </p>
                                            </div>
                                        )}

                                        {/* Machine Readings */}
                                        {booking.report?.machineReadings && (
                                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                                <p className="text-xs text-gray-600 mb-2 font-semibold">Machine Readings</p>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    {booking.report.machineReadings.depth && (
                                                        <div>
                                                            <span className="text-gray-600">Depth: </span>
                                                            <span className="font-semibold">{booking.report.machineReadings.depth}</span>
                                                        </div>
                                                    )}
                                                    {booking.report.machineReadings.flowRate && (
                                                        <div>
                                                            <span className="text-gray-600">Flow Rate: </span>
                                                            <span className="font-semibold">{booking.report.machineReadings.flowRate}</span>
                                                        </div>
                                                    )}
                                                    {booking.report.machineReadings.quality && (
                                                        <div>
                                                            <span className="text-gray-600">Quality: </span>
                                                            <span className="font-semibold">{booking.report.machineReadings.quality}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {booking.report.machineReadings.notes && (
                                                    <p className="text-xs text-gray-600 mt-2">
                                                        <span className="font-semibold">Notes: </span>
                                                        {booking.report.machineReadings.notes}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Report Images */}
                                        {(() => {
                                            const images = booking.report?.images;
                                            const hasImages = images && Array.isArray(images) && images.length > 0;
                                            
                                            // Show images section if images exist
                                            if (hasImages) {
                                                const validImages = images.filter(img => {
                                                    if (typeof img === 'string') return !!img;
                                                    if (img && typeof img === 'object') return !!(img.url || img.secure_url || img.src);
                                                    return false;
                                                });
                                                
                                                return (
                                                    <div className="mb-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <IoImageOutline className="text-lg text-blue-600" />
                                                            <p className="text-sm font-semibold text-gray-800">
                                                                Report Images ({validImages.length} of {images.length})
                                                            </p>
                                                        </div>
                                                        {validImages.length > 0 ? (
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {validImages.map((image, idx) => {
                                                                    // Handle different image data structures
                                                                    let imageUrl = null;
                                                                    if (typeof image === 'string') {
                                                                        imageUrl = image;
                                                                    } else if (image && typeof image === 'object') {
                                                                        imageUrl = image.url || image.secure_url || image.src;
                                                                    }
                                                                    
                                                                    if (!imageUrl) return null;
                                                                    
                                                                    return (
                                                                        <div key={idx} className="relative group">
                                                                            <img
                                                                                src={imageUrl}
                                                                                alt={`Report image ${idx + 1}`}
                                                                                className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-gray-200"
                                                                                onClick={() => window.open(imageUrl, "_blank")}
                                                                                onError={(e) => {
                                                                                    console.error('Image failed to load:', imageUrl, image);
                                                                                    e.target.parentElement.style.display = 'none';
                                                                                }}
                                                                            />
                                                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
                                                                                <IoExpandOutline className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-500 italic">No valid image URLs found</p>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            
                                            // Show message if report exists but no images
                                            if (booking.report && booking.report.uploadedAt && !hasImages) {
                                                return (
                                                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                        <p className="text-sm text-yellow-700">
                                                            <IoImageOutline className="inline mr-2" />
                                                            No images uploaded with this report
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            
                                            return null;
                                        })()}

                                        {/* Report PDF File */}
                                        {booking.report?.reportFile && booking.report.reportFile.url && (
                                            <div className="mb-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <IoDocumentTextOutline className="text-lg text-blue-600" />
                                                    <p className="text-sm font-semibold text-gray-800">Report PDF</p>
                                                </div>
                                                <a
                                                    href={booking.report.reportFile.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                                                >
                                                    <IoDownloadOutline className="text-lg" />
                                                    <span className="text-sm font-semibold">View/Download Report PDF</span>
                                                </a>
                                            </div>
                                        )}

                                        {/* Report Notes */}
                                        {booking.report?.notes && (
                                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                                <p className="text-xs text-gray-600 mb-1 font-semibold">Additional Notes</p>
                                                <p className="text-sm text-gray-800">{booking.report.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => handleApproveReport(booking._id)}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm whitespace-nowrap"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedBooking(booking);
                                                setModalType("reject-report");
                                                setShowModal(true);
                                            }}
                                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm whitespace-nowrap"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Borewell Approval Tab */}
            {activeApprovalType === "borewell" && (
                <div className="space-y-4">
                    {borewellBookings.filter(b => !b.borewellResult?.approvedAt).length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
                            <IoCheckmarkCircleOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 font-semibold">No borewell results pending approval</p>
                            <p className="text-sm text-gray-500 mt-2">No borewell results are waiting for approval</p>
                        </div>
                    ) : (
                        borewellBookings
                            .filter(b => !b.borewellResult?.approvedAt)
                            .map((booking) => (
                                <div
                                    key={booking._id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <IoCheckmarkCircleOutline className="text-2xl text-orange-600" />
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-800">
                                                        Booking #{booking._id.toString().slice(-8)}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {booking.vendor?.name || "Vendor"} → {booking.user?.name || "User"}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        booking.borewellResult?.status === "SUCCESS"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {booking.borewellResult?.status || "PENDING"}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <p className="text-xs text-gray-600 mb-1">Vendor</p>
                                                    <p className="text-sm font-semibold text-gray-800">{booking.vendor?.name || "N/A"}</p>
                                                    <p className="text-xs text-gray-500">{booking.vendor?.email || ""}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <p className="text-xs text-gray-600 mb-1">User</p>
                                                    <p className="text-sm font-semibold text-gray-800">{booking.user?.name || "N/A"}</p>
                                                    <p className="text-xs text-gray-500">{booking.user?.email || ""}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <p className="text-xs text-gray-600 mb-1">Uploaded</p>
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {formatDate(booking.borewellResult?.uploadedAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            {booking.borewellResult?.images && booking.borewellResult.images.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-xs text-gray-600 mb-2">Images ({booking.borewellResult.images.length})</p>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {booking.borewellResult.images.map((img, idx) => (
                                                            <img
                                                                key={idx}
                                                                src={img.url}
                                                                alt={`Borewell result ${idx + 1}`}
                                                                className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                                                onClick={() => window.open(img.url, "_blank")}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedBooking(booking);
                                                    setModalType("approve-borewell-success");
                                                    setShowModal(true);
                                                }}
                                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm whitespace-nowrap"
                                            >
                                                Approve as Success
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedBooking(booking);
                                                    setModalType("approve-borewell-failed");
                                                    setShowModal(true);
                                                }}
                                                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm whitespace-nowrap"
                                            >
                                                Approve as Failed
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            )}

            {/* Modals */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        {modalType === "reject-travel" && (
                            <>
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Reject Travel Charges Request</h3>
                                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-2">
                                        Booking ID: <span className="font-semibold">{selectedBooking?.bookingId?.toString().slice(-8) || selectedBooking?._id?.toString().slice(-8)}</span>
                                    </p>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Amount: <span className="font-semibold">{formatCurrency(selectedBooking?.travelChargesRequest?.amount || 0)}</span>
                                    </p>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Rejection Reason (minimum 10 characters)
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        rows="4"
                                        placeholder="Enter rejection reason..."
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            setSelectedBooking(null);
                                            setRejectionReason("");
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleRejectTravelCharges(selectedBooking?.bookingId || selectedBooking?._id)}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </>
                        )}
                        {modalType === "reject-report" && (
                            <>
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Reject Report</h3>
                                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-2">
                                        Booking ID: <span className="font-semibold">{selectedBooking?._id?.toString().slice(-8)}</span>
                                    </p>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Vendor: <span className="font-semibold">{selectedBooking?.vendor?.name || "N/A"}</span>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        User: <span className="font-semibold">{selectedBooking?.user?.name || "N/A"}</span>
                                    </p>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Rejection Reason (minimum 10 characters)
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        rows="4"
                                        placeholder="Enter rejection reason..."
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            setSelectedBooking(null);
                                            setRejectionReason("");
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleRejectReport(selectedBooking?._id)}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
                                    >
                                        Reject Report
                                    </button>
                                </div>
                            </>
                        )}
                        {(modalType === "approve-borewell-success" || modalType === "approve-borewell-failed") && (
                            <>
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Approve Borewell Result</h3>
                                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-2">
                                        Booking ID: <span className="font-semibold">{selectedBooking?._id?.toString().slice(-8)}</span>
                                    </p>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Current Status:{" "}
                                        <span
                                            className={`font-semibold ${
                                                selectedBooking?.borewellResult?.status === "SUCCESS"
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            }`}
                                        >
                                            {selectedBooking?.borewellResult?.status || "N/A"}
                                        </span>
                                    </p>
                                </div>
                                <p className="text-sm text-gray-700 mb-4">
                                    Are you sure you want to approve this borewell result as {modalType === "approve-borewell-success" ? "SUCCESS" : "FAILED"}? 
                                    This will mark the vendor status as ready for pay_second (second installment payment).
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            setSelectedBooking(null);
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleApproveBorewell(selectedBooking, modalType === "approve-borewell-success")}
                                        className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-semibold text-sm ${
                                            modalType === "approve-borewell-success"
                                                ? "bg-green-600 hover:bg-green-700"
                                                : "bg-red-600 hover:bg-red-700"
                                        }`}
                                    >
                                        Approve as {modalType === "approve-borewell-success" ? "SUCCESS" : "FAILED"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Pay Travel Charges Confirmation Modal */}
        <ConfirmModal
            isOpen={showPayTravelConfirm}
            onClose={() => {
                setShowPayTravelConfirm(false);
                setSelectedBookingId(null);
            }}
            onConfirm={handlePayTravelConfirm}
            title="Pay Travel Charges"
            message="Are you sure you want to pay travel charges to the vendor?"
            confirmText="Yes, Pay"
            cancelText="Cancel"
            confirmColor="primary"
        />

        {/* Approve Report Confirmation Modal */}
        <ConfirmModal
            isOpen={showApproveReportConfirm}
            onClose={() => {
                setShowApproveReportConfirm(false);
                setSelectedBookingId(null);
            }}
            onConfirm={handleApproveReportConfirm}
            title="Approve Report"
            message="Are you sure you want to approve this report?"
            confirmText="Yes, Approve"
            cancelText="Cancel"
            confirmColor="primary"
        />
    </>);
}

