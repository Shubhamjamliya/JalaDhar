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
    IoWaterOutline,
} from "react-icons/io5";
import {
    getBorewellPendingApprovals,
    approveBorewellResult,
    getReportPendingApprovals,
    approveReport,
    rejectReport,
    assignReportQAApi,
    getAllAdmins
} from "../../../services/adminApi";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import AssignmentHistoryModal from "../admin-component/AssignmentHistoryModal";

export default function AdminApprovals() {
    const { theme, themeColors } = useTheme();
    const currentTheme = themeColors[theme] || themeColors.default;
    const { admin: currentAdmin } = useAdminAuth();
    const [loading, setLoading] = useState(true);
    const [activeApprovalType, setActiveApprovalType] = useState("report"); // report, borewell
    const [reportBookings, setReportBookings] = useState([]);
    const [borewellBookings, setBorewellBookings] = useState([]);
    const [availableQCAdmins, setAvailableQCAdmins] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const toast = useToast();
    const [showModal, setShowModal] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [modalType, setModalType] = useState(""); // approve, reject, pay, etc.
    const [rejectionReason, setRejectionReason] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showApproveReportConfirm, setShowApproveReportConfirm] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [viewingReportBooking, setViewingReportBooking] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    const isSuperAdmin = currentAdmin?.role === "SUPER_ADMIN";

    // Pagination
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
        loadAvailableQCAdmins();
    }, [activeApprovalType]);

    const loadAvailableQCAdmins = async () => {
        try {
            const res = await getAllAdmins();
            if (res.success && res.data?.admins) {
                const qcAdmins = res.data.admins.filter(a =>
                    a.isActive && ['QC_ADMIN', 'SUPER_ADMIN'].includes(a.role)
                );
                setAvailableQCAdmins(qcAdmins);
            }
        } catch (err) {
            console.error("Failed to load QC admins:", err);
        }
    };

    const handleReassignReportQA = async (newAdminId, reason, notesText) => {
        if (!selectedBooking) return;
        try {
            const res = await assignReportQAApi(selectedBooking._id, {
                assignedTo: newAdminId,
                reason,
                notes: notesText
            });
            if (res.success) {
                toast.showSuccess("Survey report QA review reassigned successfully!");
                setShowAssignmentModal(false);
                setSelectedBooking(null);
                await loadData();
            } else {
                toast.showError(res.message || "Failed to reassign survey report review");
            }
        } catch (err) {
            console.error("Reassign error:", err);
            toast.showError("Failed to reassign survey report review");
        }
    };

    // Prevent background body scrolling when any modal is active
    useEffect(() => {
        if (viewingReportBooking || showModal || showApproveReportConfirm || previewImage) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [viewingReportBooking, showModal, showApproveReportConfirm, previewImage]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Reset arrays when switching tabs to prevent showing stale data
            if (activeApprovalType === "report") {
                setBorewellBookings([]);
            } else if (activeApprovalType === "borewell") {
                setReportBookings([]);
            }

            if (activeApprovalType === "report") {
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
            if (activeApprovalType === "report") {
                setReportBookings([]);
            } else if (activeApprovalType === "borewell") {
                setBorewellBookings([]);
            }
        } finally {
            setLoading(false);
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
                toast.showSuccess("Report rejected successfully! Expert can re-upload the report.");
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
            (activeApprovalType === "report" && reportBookings.length > 0) ||
            (activeApprovalType === "borewell" && borewellBookings.length > 0);

        if (!hasData) {
            const messages = {
                "report": "report",
                "borewell": "borewell"
            };
            return (
                <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
                    <LoadingSpinner message={`Loading ${messages[activeApprovalType] || "approvals"}...`} />
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
                    <p className="text-gray-600">Manage reports and borewell approvals</p>
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
                                setActiveApprovalType("report");
                                setError("");
                                setReportPagination({ ...reportPagination, currentPage: 1 });
                            }}
                            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeApprovalType === "report"
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
                            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeApprovalType === "borewell"
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

                {/* Report Approval Tab */}
                {activeApprovalType === "report" && (
                    <div className="space-y-6">
                        {reportBookings.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center shadow-xs border border-slate-200/80 max-w-lg mx-auto">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                                    <IoDocumentTextOutline className="text-3xl" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">No Reports Pending Approval</h3>
                                <p className="text-sm text-slate-500 mt-1">All uploaded survey reports have been reviewed and approved.</p>
                            </div>
                        ) : (
                            reportBookings.map((booking) => {
                                const images = booking.report?.images || [];
                                const validImages = Array.isArray(images)
                                    ? images.filter(img => {
                                        if (typeof img === 'string') return !!img;
                                        if (img && typeof img === 'object') return !!(img.url || img.secure_url || img.src);
                                        return false;
                                    })
                                    : [];

                                return (
                                    <div
                                        key={booking._id}
                                        className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/80 p-5 sm:p-7 relative overflow-hidden group"
                                    >
                                        {/* Top Gradient Accent Line */}
                                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500"></div>

                                        {/* Top Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100 shadow-xs">
                                                    <IoDocumentTextOutline className="text-2xl" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                                                            Booking #{booking._id.toString().slice(-8).toUpperCase()}
                                                        </h3>
                                                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                                                            Report Pending
                                                        </span>
                                                        {/* Assigned QC Admin Chip */}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedBooking(booking);
                                                                setShowAssignmentModal(true);
                                                            }}
                                                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 transition-colors cursor-pointer"
                                                        >
                                                            <IoPersonOutline className="text-xs" />
                                                            QC: {booking.report?.assignedTo?.name || "Auto-Assigned"}
                                                            {isSuperAdmin && <span className="text-[10px] ml-1 text-purple-500 font-bold">⇄</span>}
                                                        </button>
                                                    </div>
                                                    <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5 flex items-center gap-1.5">
                                                        <span>{booking.vendor?.name || "Expert"}</span>
                                                        <span className="text-slate-300">→</span>
                                                        <span>{booking.user?.name || "Customer"}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Buttons (Header on desktop) */}
                                            <div className="flex items-center gap-2 sm:self-center flex-wrap">
                                                <button
                                                    onClick={() => setViewingReportBooking(booking)}
                                                    className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <IoDocumentTextOutline className="text-lg" />
                                                    <span>View Report</span>
                                                </button>
                                                <button
                                                    onClick={() => handleApproveReport(booking._id)}
                                                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <IoCheckmarkCircleOutline className="text-lg" />
                                                    <span>Approve</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedBooking(booking);
                                                        setModalType("reject-report");
                                                        setShowModal(true);
                                                    }}
                                                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <IoCloseCircleOutline className="text-lg" />
                                                    <span>Reject</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Info Cardlets Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                                            {/* Expert Cardlet */}
                                            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                    <IoPersonOutline className="text-blue-500" /> Expert Hydrogeologist
                                                </p>
                                                <p className="text-sm font-bold text-slate-800 truncate">{booking.vendor?.name || "N/A"}</p>
                                                <p className="text-xs text-slate-500 truncate">{booking.vendor?.email || booking.vendor?.phone || "No contact info"}</p>
                                            </div>

                                            {/* Report Date Cardlet */}
                                            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                    <IoCalendarOutline className="text-indigo-500" /> Upload Timestamp
                                                </p>
                                                <p className="text-sm font-bold text-slate-800">
                                                    {formatDate(booking.report?.uploadedAt || booking.reportUploadedAt)}
                                                </p>
                                                <p className="text-xs text-slate-500">Official Survey Submission</p>
                                            </div>

                                            {/* Water Found Cardlet */}
                                            <div className={`p-3.5 rounded-xl border ${booking.report?.waterFound === true ? "bg-emerald-50/60 border-emerald-200/80" : booking.report?.waterFound === false ? "bg-rose-50/60 border-rose-200/80" : "bg-slate-50 border-slate-200"}`}>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                    <IoWaterOutline className={booking.report?.waterFound === true ? "text-emerald-600" : booking.report?.waterFound === false ? "text-rose-600" : "text-slate-500"} /> Survey Outcome
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2.5 h-2.5 rounded-full ${booking.report?.waterFound === true ? "bg-emerald-500" : booking.report?.waterFound === false ? "bg-rose-500" : "bg-slate-400"}`}></span>
                                                    <p className={`text-sm font-black ${booking.report?.waterFound === true ? "text-emerald-700" : booking.report?.waterFound === false ? "text-rose-700" : "text-slate-600"}`}>
                                                        {booking.report?.waterFound === true ? "SUITABLE POINT (WATER FOUND)" : booking.report?.waterFound === false ? "NO SUITABLE POINT" : "REPORT PENDING"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Machine Readings / Notes */}
                                        {booking.report?.machineReadings && (
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                                                <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Machine Readings & Observations</p>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                                    {booking.report.machineReadings.depth && (
                                                        <div><span className="text-slate-400">Target Depth:</span> <strong className="text-slate-800 font-bold">{booking.report.machineReadings.depth}</strong></div>
                                                    )}
                                                    {booking.report.machineReadings.flowRate && (
                                                        <div><span className="text-slate-400">Flow Rate:</span> <strong className="text-slate-800 font-bold">{booking.report.machineReadings.flowRate}</strong></div>
                                                    )}
                                                    {booking.report.machineReadings.quality && (
                                                        <div><span className="text-slate-400">Quality:</span> <strong className="text-slate-800 font-bold">{booking.report.machineReadings.quality}</strong></div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* PDF File Download Button */}
                                        {booking.report?.reportFile && booking.report.reportFile.url && (
                                            <div className="mb-6 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <IoDocumentTextOutline className="text-xl text-blue-600" />
                                                    <span className="text-xs sm:text-sm font-bold text-slate-800">Generated Survey PDF Report</span>
                                                </div>
                                                <a
                                                    href={booking.report.reportFile.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                                                >
                                                    <IoDownloadOutline className="text-sm" />
                                                    <span>View PDF</span>
                                                </a>
                                            </div>
                                        )}

                                        {/* Report Images Gallery */}
                                        <div>
                                            <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                <IoImageOutline className="text-blue-600 text-sm" />
                                                <span>Report Proof Images ({validImages.length})</span>
                                            </p>

                                            {validImages.length > 0 ? (
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    {validImages.map((image, idx) => {
                                                        let imageUrl = typeof image === 'string' ? image : (image?.url || image?.secure_url || image?.src);
                                                        if (!imageUrl) return null;

                                                        return (
                                                            <div
                                                                key={idx}
                                                                onClick={() => setPreviewImage(imageUrl)}
                                                                className="relative group rounded-xl overflow-hidden border border-slate-200/80 bg-slate-100 aspect-video sm:aspect-square cursor-pointer shadow-xs hover:shadow-md transition-all"
                                                            >
                                                                <img
                                                                    src={imageUrl}
                                                                    alt={`Proof ${idx + 1}`}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                        e.target.nextSibling.style.display = 'flex';
                                                                    }}
                                                                />
                                                                <div className="hidden absolute inset-0 bg-slate-100 flex-col items-center justify-center text-slate-400 p-2 text-center">
                                                                    <IoImageOutline className="text-2xl mb-1 text-slate-300" />
                                                                    <span className="text-[10px] font-semibold">Image Unavailable</span>
                                                                </div>
                                                                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <div className="w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-md backdrop-blur-xs">
                                                                        <IoExpandOutline className="text-base" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-400 font-medium">
                                                    No site photos uploaded with this report
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* Borewell Approval Tab */}
                {activeApprovalType === "borewell" && (
                    <div className="space-y-6">
                        {borewellBookings.filter(b => !b.borewellResult?.approvedAt).length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center shadow-xs border border-slate-200/80 max-w-lg mx-auto">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                                    <IoCheckmarkCircleOutline className="text-3xl" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">No Borewell Approvals Pending</h3>
                                <p className="text-sm text-slate-500 mt-1">All user-submitted borewell drilling outcomes have been processed.</p>
                            </div>
                        ) : (
                            borewellBookings
                                .filter(b => !b.borewellResult?.approvedAt)
                                .map((booking) => {
                                    const isSuccessOutcome = booking.borewellResult?.status === "SUCCESS";
                                    const images = booking.borewellResult?.images || [];

                                    return (
                                        <div
                                            key={booking._id}
                                            className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/80 p-5 sm:p-7 relative overflow-hidden group"
                                        >
                                            {/* Top Accent Bar */}
                                            <div className={`absolute top-0 left-0 right-0 h-1.5 ${isSuccessOutcome ? "bg-emerald-500" : "bg-rose-500"}`}></div>

                                            {/* Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-xs ${isSuccessOutcome ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                                                        <IoCheckmarkCircleOutline className="text-2xl" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                                                                Booking #{booking._id.toString().slice(-8).toUpperCase()}
                                                            </h3>
                                                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${isSuccessOutcome ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-rose-100 text-rose-800 border border-rose-200"}`}>
                                                                {isSuccessOutcome ? "Claimed: Water Found" : "Claimed: No Water"}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5 flex items-center gap-1.5">
                                                            <span>{booking.vendor?.name || "Expert"}</span>
                                                            <span className="text-slate-300">→</span>
                                                            <span>{booking.user?.name || "Customer"}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-3 sm:self-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBooking(booking);
                                                            setModalType("approve-borewell-success");
                                                            setShowModal(true);
                                                        }}
                                                        className="flex-1 sm:flex-initial px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                                    >
                                                        <IoCheckmarkCircleOutline className="text-lg" />
                                                        <span>Confirm Success</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBooking(booking);
                                                            setModalType("approve-borewell-failed");
                                                            setShowModal(true);
                                                        }}
                                                        className="flex-1 sm:flex-initial px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                                    >
                                                        <IoCloseCircleOutline className="text-lg" />
                                                        <span>Mark Failed</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                                                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                        <IoPersonOutline className="text-blue-500" /> Expert Hydrogeologist
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-800 truncate">{booking.vendor?.name || "N/A"}</p>
                                                    <p className="text-xs text-slate-500 truncate">{booking.vendor?.email || ""}</p>
                                                </div>
                                                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                        <IoPersonOutline className="text-emerald-500" /> Customer
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-800 truncate">{booking.user?.name || "N/A"}</p>
                                                    <p className="text-xs text-slate-500 truncate">{booking.user?.email || booking.user?.phone || ""}</p>
                                                </div>
                                                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                        <IoCalendarOutline className="text-indigo-500" /> Upload Timestamp
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-800">
                                                        {formatDate(booking.borewellResult?.uploadedAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Proof Images */}
                                            {images && images.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                        <IoImageOutline className="text-emerald-600 text-sm" />
                                                        <span>Borewell Site Photos ({images.length})</span>
                                                    </p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                        {images.map((img, idx) => {
                                                            const imgUrl = typeof img === 'string' ? img : (img?.url || img?.secure_url);
                                                            if (!imgUrl) return null;
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    onClick={() => setPreviewImage(imgUrl)}
                                                                    className="relative group rounded-xl overflow-hidden border border-slate-200/80 bg-slate-100 aspect-video sm:aspect-square cursor-pointer shadow-xs hover:shadow-md transition-all"
                                                                >
                                                                    <img
                                                                        src={imgUrl}
                                                                        alt={`Borewell proof ${idx + 1}`}
                                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                            e.target.nextSibling.style.display = 'flex';
                                                                        }}
                                                                    />
                                                                    <div className="hidden absolute inset-0 bg-slate-100 flex-col items-center justify-center text-slate-400 p-2 text-center">
                                                                        <IoImageOutline className="text-2xl mb-1 text-slate-300" />
                                                                        <span className="text-[10px] font-semibold">Image Unavailable</span>
                                                                    </div>
                                                                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <div className="w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-md backdrop-blur-xs">
                                                                            <IoExpandOutline className="text-base" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                        )}
                    </div>
                )}

                {/* Modals */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
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
                                                className={`font-semibold ${selectedBooking?.borewellResult?.status === "SUCCESS"
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
                                            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-semibold text-sm ${modalType === "approve-borewell-success"
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

            {/* View Full Report Inspection Modal */}
            {viewingReportBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border border-slate-200">
                        <div className="sticky top-0 bg-white p-5 border-b border-slate-100 flex justify-between items-center z-10 rounded-t-2xl">
                            <div className="flex items-center gap-2">
                                <IoDocumentTextOutline className="text-xl text-blue-600" />
                                <h2 className="text-lg font-bold text-slate-800">
                                    Survey Report — Booking #{viewingReportBooking._id?.toString().slice(-8).toUpperCase()}
                                </h2>
                            </div>
                            <button
                                onClick={() => setViewingReportBooking(null)}
                                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                                <IoCloseCircleOutline className="text-2xl" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 flex-1">
                            {/* Summary Card */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                <div>
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">Expert</p>
                                    <p className="font-bold text-slate-800 text-sm truncate">{viewingReportBooking.vendor?.name || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">Customer</p>
                                    <p className="font-bold text-slate-800 text-sm truncate">{viewingReportBooking.user?.name || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">Water Found</p>
                                    <p className={`font-bold text-sm ${viewingReportBooking.report?.waterFound !== false ? "text-emerald-600" : "text-rose-600"}`}>
                                        {viewingReportBooking.report?.waterFound !== false ? "YES" : "NO"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-400 font-bold uppercase text-[10px]">Submitted Date</p>
                                    <p className="font-bold text-slate-800 text-sm">{formatDate(viewingReportBooking.report?.uploadedAt)}</p>
                                </div>
                            </div>

                            {/* Geological & Field Data if present */}
                            {viewingReportBooking.report?.geologicalInfo && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Geological Information</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200/80 text-xs">
                                        <div><span className="text-slate-500">Rock Type:</span> <strong className="text-slate-800">{viewingReportBooking.report.geologicalInfo.rockType || "N/A"}</strong></div>
                                        <div><span className="text-slate-500">Soil Type:</span> <strong className="text-slate-800">{viewingReportBooking.report.geologicalInfo.soilType || "N/A"}</strong></div>
                                        <div><span className="text-slate-500">Terrain:</span> <strong className="text-slate-800">{viewingReportBooking.report.geologicalInfo.terrainType || "N/A"}</strong></div>
                                        <div><span className="text-slate-500">Weathered Zone:</span> <strong className="text-slate-800">{viewingReportBooking.report.geologicalInfo.weatheredZone || "N/A"} ft</strong></div>
                                        <div><span className="text-slate-500">GW Condition:</span> <strong className="text-slate-800">{viewingReportBooking.report.geologicalInfo.groundwaterCondition || "N/A"}</strong></div>
                                    </div>
                                </div>
                            )}

                            {/* Recommendations if present */}
                            {viewingReportBooking.report?.surveyRecommendations && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Primary Recommendation</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-blue-50/40 p-4 rounded-xl border border-blue-100 text-xs">
                                        <div><span className="text-slate-500">Recommended Depth:</span> <strong className="text-blue-700 block text-sm font-bold">{viewingReportBooking.report.surveyRecommendations.recommendedBoreDepth || "N/A"} ft</strong></div>
                                        <div><span className="text-slate-500">Casing Depth:</span> <strong className="text-slate-800 block text-sm font-bold">{viewingReportBooking.report.surveyRecommendations.recommendedCasingDepth || "N/A"} ft</strong></div>
                                        <div><span className="text-slate-500">Fractures:</span> <strong className="text-slate-800 block text-sm font-bold">{viewingReportBooking.report.surveyRecommendations.expectedFractureDepths || "N/A"}</strong></div>
                                        <div><span className="text-slate-500">Expected Yield:</span> <strong className="text-slate-800 block text-sm font-bold">{viewingReportBooking.report.surveyRecommendations.expectedYield ? `${viewingReportBooking.report.surveyRecommendations.expectedYield} inches` : "N/A"}</strong></div>
                                    </div>
                                </div>
                            )}

                            {/* Images */}
                            <div>
                                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Site Images & Proof</h4>
                                {viewingReportBooking.report?.images?.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {viewingReportBooking.report.images.map((img, i) => {
                                            const url = typeof img === 'string' ? img : (img?.url || img?.secure_url);
                                            if (!url) return null;
                                            return (
                                                <img
                                                    key={i}
                                                    src={url}
                                                    alt={`Proof ${i}`}
                                                    className="w-full h-36 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => setPreviewImage(url)}
                                                />
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No proof images attached</p>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                onClick={() => setViewingReportBooking(null)}
                                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    const bId = viewingReportBooking._id;
                                    setViewingReportBooking(null);
                                    handleApproveReport(bId);
                                }}
                                className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
                            >
                                Approve Report Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Lightbox Popup Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-12 right-0 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all cursor-pointer"
                        >
                            <IoCloseCircleOutline className="text-3xl" />
                        </button>
                        <img
                            src={previewImage}
                            alt="Full Resolution Proof"
                            className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                        />
                        <div className="mt-3 flex items-center gap-3">
                            <a
                                href={previewImage}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition-all flex items-center gap-1.5"
                            >
                                <IoExpandOutline className="text-sm" /> Open Original Image
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Assignment History Modal for Survey Reports */}
            <AssignmentHistoryModal
                isOpen={showAssignmentModal}
                onClose={() => {
                    setShowAssignmentModal(false);
                    setSelectedBooking(null);
                }}
                entityTitle={`Survey Report #${selectedBooking?._id?.toString().slice(-8).toUpperCase()}`}
                assignedTo={selectedBooking?.report?.assignedTo}
                assignmentHistory={selectedBooking?.report?.assignmentHistory || []}
                availableAdmins={availableQCAdmins}
                onReassign={handleReassignReportQA}
                isSuperAdmin={isSuperAdmin}
            />
        </>);
}

