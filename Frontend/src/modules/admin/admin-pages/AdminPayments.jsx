import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoWalletOutline,
    IoCheckmarkCircleOutline,
    IoTimeOutline,
    IoCloseCircleOutline,
    IoArrowDownOutline,
    IoArrowUpOutline,
    IoCashOutline,
    IoReceiptOutline,
    IoSearchOutline,
    IoFilterOutline,
    IoCarOutline,
} from "react-icons/io5";
import { getAllPayments, getPaymentStatistics, getAllBookings, getTravelChargesRequests, approveTravelCharges, rejectTravelCharges, payTravelCharges, payFirstInstallment, paySecondInstallment, getPendingUserRefunds, processUserRefund } from "../../../services/adminApi";
import { useTheme } from "../../../contexts/ThemeContext";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";

export default function AdminPayments() {
    const navigate = useNavigate();
    const { theme, themeColors } = useTheme();
    const currentTheme = themeColors[theme] || themeColors.default;
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [stats, setStats] = useState({
        totalPayments: 0,
        successPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
        totalRevenue: 0,
        advancePayments: { total: 0, count: 0 },
        remainingPayments: { total: 0, count: 0 },
        settlements: { total: 0, count: 0 },
    });
    const [userPayments, setUserPayments] = useState([]);
    const [userRefunds, setUserRefunds] = useState([]);
    const [pendingUserRefunds, setPendingUserRefunds] = useState([]);
    const [userStats, setUserStats] = useState({
        totalPayments: 0,
        totalAmount: 0,
        advancePayments: 0,
        remainingPayments: 0,
        totalRefunds: 0,
        refundAmount: 0,
    });
    const [vendorPayments, setVendorPayments] = useState([]);
    const [travelChargesRequests, setTravelChargesRequests] = useState([]);
    const [vendorBookings, setVendorBookings] = useState([]);
    const [travelChargesPagination, setTravelChargesPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        total: 0,
    });
    const [travelChargesFilter, setTravelChargesFilter] = useState({
        status: "PENDING",
    });
    const [userPagination, setUserPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalPayments: 0,
    });
    const [vendorPagination, setVendorPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalPayments: 0,
    });
    const [userFilters, setUserFilters] = useState({
        status: "",
        paymentType: "",
        search: "",
    });
    const [vendorFilters, setVendorFilters] = useState({
        status: "",
        search: "",
    });
    const [error, setError] = useState("");
    const [showApproveTravelConfirm, setShowApproveTravelConfirm] = useState(false);
    const [showRejectTravelInput, setShowRejectTravelInput] = useState(false);
    const [showRejectTravelConfirm, setShowRejectTravelConfirm] = useState(false);
    const [showPayTravelConfirm, setShowPayTravelConfirm] = useState(false);
    const [showPayFirstInstallConfirm, setShowPayFirstInstallConfirm] = useState(false);
    const [showProcessRefundConfirm, setShowProcessRefundConfirm] = useState(false);
    const [showPaySecondInstallConfirm, setShowPaySecondInstallConfirm] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");

    useEffect(() => {
        loadPaymentData();
    }, [activeTab, userFilters, vendorFilters, userPagination.currentPage, vendorPagination.currentPage, travelChargesFilter, travelChargesPagination.currentPage]);

    const loadPaymentData = async () => {
        try {
            setLoading(true);
            setError("");

            if (activeTab === "overview") {
                const statsResponse = await getPaymentStatistics();
                if (statsResponse.success) {
                    setStats(statsResponse.data.statistics);
                }
            } else if (activeTab === "user-payments") {
                // Load user payments (ADVANCE and REMAINING)
                const params = {
                    page: userPagination.currentPage,
                    limit: 10,
                    paymentType: userFilters.paymentType || undefined, // Will filter to ADVANCE or REMAINING
                    ...(userFilters.status && { status: userFilters.status }),
                    ...(userFilters.search && { search: userFilters.search }),
                };
                
                // Load refunds for failed borewell bookings first
                const refundParams = {
                    page: 1,
                    limit: 50,
                    paymentType: "REFUND",
                    status: "SUCCESS",
                };
                
                const [paymentsResponse, refundsResponse, pendingRefundsResponse] = await Promise.all([
                    getAllPayments(params),
                    getAllPayments(refundParams),
                    getPendingUserRefunds({ page: 1, limit: 50 })
                ]);

                if (paymentsResponse.success) {
                    // Filter to only show ADVANCE and REMAINING payments
                    const userPaymentsOnly = paymentsResponse.data.payments.filter(
                        (p) => p.paymentType === "ADVANCE" || p.paymentType === "REMAINING"
                    );
                    setUserPayments(userPaymentsOnly);
                    setUserPagination(paymentsResponse.data.pagination);

                    // Calculate payment stats
                    const advancePayments = userPaymentsOnly.filter(p => p.paymentType === "ADVANCE");
                    const remainingPayments = userPaymentsOnly.filter(p => p.paymentType === "REMAINING");
                    const totalAmount = userPaymentsOnly.reduce((sum, p) => sum + (p.amount || 0), 0);

                    // Process refunds
                    let failedBorewellRefunds = [];
                    if (refundsResponse.success) {
                        // Filter refunds related to failed borewells (after admin approval)
                        failedBorewellRefunds = refundsResponse.data.payments.filter(
                            (payment) => {
                                // Check if description contains "failed borewell" or booking has failed borewell result
                                return payment.description?.toLowerCase().includes('failed borewell') || 
                                       payment.description?.toLowerCase().includes('refund for failed') ||
                                       (payment.description?.toLowerCase().includes('borewell') && payment.status === 'SUCCESS');
                            }
                        );
                        setUserRefunds(failedBorewellRefunds);
                    }

                    // Load pending refunds
                    if (pendingRefundsResponse.success) {
                        setPendingUserRefunds(pendingRefundsResponse.data.bookings || []);
                    }

                    // Set all stats together
                    setUserStats({
                        totalPayments: userPaymentsOnly.length,
                        totalAmount,
                        advancePayments: advancePayments.length,
                        remainingPayments: remainingPayments.length,
                        totalRefunds: failedBorewellRefunds.length,
                        refundAmount: failedBorewellRefunds.reduce((sum, r) => sum + (r.amount || 0), 0),
                    });
                }
            } else if (activeTab === "vendor-payments") {
                // Load bookings with vendor payment information
                const bookingsResponse = await getAllBookings({
                    page: 1,
                    limit: 100,
                });
                if (bookingsResponse.success) {
                    // Filter bookings that have vendor-related payments (travel charges, settlements, or report uploaded)
                    // For first installment: only show bookings with approved reports
                    const bookingsWithPayments = bookingsResponse.data.bookings.filter(
                        (booking) => {
                            // Travel charges requests
                            if (booking.travelChargesRequest) return true;
                            
                            // Vendor settlements
                            if (booking.payment?.vendorSettlement) return true;
                            
                            // First installment - only show if report is approved
                            if (booking.firstInstallment || 
                                (booking.report && booking.report.uploadedAt && booking.report.approvedAt && !booking.firstInstallment?.paid)) {
                                // Only include if report is approved
                                if (booking.report?.approvedAt) return true;
                            }
                            
                            // Other statuses (completed, borewell uploaded, etc.)
                            if (booking.vendorStatus === "COMPLETED" ||
                                booking.vendorStatus === "BOREWELL_UPLOADED" ||
                                booking.vendorStatus === "PAID_FIRST") {
                                return true;
                            }
                            
                            return false;
                        }
                    );
                    console.log("Vendor bookings loaded:", bookingsWithPayments.length);
                    console.log("Sample booking:", bookingsWithPayments[0] ? {
                        id: bookingsWithPayments[0]._id,
                        vendorStatus: bookingsWithPayments[0].vendorStatus,
                        status: bookingsWithPayments[0].status,
                        reportUploadedAt: bookingsWithPayments[0].reportUploadedAt,
                        hasReport: !!bookingsWithPayments[0].report,
                        firstInstallment: bookingsWithPayments[0].firstInstallment
                    } : "No bookings");
                    setVendorBookings(bookingsWithPayments);
                }

                // Also load vendor payments (SETTLEMENT) for history
                const params = {
                    page: vendorPagination.currentPage,
                    limit: 10,
                    paymentType: "SETTLEMENT",
                    ...(vendorFilters.status && { status: vendorFilters.status }),
                    ...(vendorFilters.search && { search: vendorFilters.search }),
                };
                const paymentsResponse = await getAllPayments(params);
                if (paymentsResponse.success) {
                    setVendorPayments(paymentsResponse.data.payments);
                    setVendorPagination(paymentsResponse.data.pagination);
                }
            } else if (activeTab === "travel-charges") {
                const params = {
                    page: travelChargesPagination.currentPage,
                    limit: 10,
                    ...(travelChargesFilter.status && { status: travelChargesFilter.status }),
                };
                const response = await getTravelChargesRequests(params);
                if (response.success) {
                    setTravelChargesRequests(response.data.requests);
                    setTravelChargesPagination(response.data.pagination);
                }
            }
        } catch (err) {
            console.error("Payment data error:", err);
            setError("Failed to load payment data");
        } finally {
            setLoading(false);
        }
    };

    const handleApproveTravelCharges = (bookingId) => {
        setSelectedBookingId(bookingId);
        setShowApproveTravelConfirm(true);
    };

    const handleApproveTravelConfirm = async () => {
        if (!selectedBookingId) return;
        const bookingId = selectedBookingId;
        setShowApproveTravelConfirm(false);
        const loadingToast = toast.showLoading("Approving travel charges...");
        try {
            const response = await approveTravelCharges(bookingId);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Travel charges request approved successfully!");
                setSelectedBookingId(null);
                loadPaymentData();
            }
        } catch (err) {
            console.error("Approve travel charges error:", err);
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to approve travel charges request");
        }
    };

    const handleRejectTravelCharges = (bookingId) => {
        setSelectedBookingId(bookingId);
        setRejectionReason("");
        setShowRejectTravelInput(true);
    };

    const handleRejectTravelReasonSubmit = (reason) => {
        setRejectionReason(reason);
        setShowRejectTravelInput(false);
        setShowRejectTravelConfirm(true);
    };

    const handleRejectTravelConfirm = async () => {
        if (!selectedBookingId || !rejectionReason) return;
        const bookingId = selectedBookingId;
        setShowRejectTravelConfirm(false);
        const loadingToast = toast.showLoading("Rejecting travel charges...");
        try {
            const response = await rejectTravelCharges(bookingId, { rejectionReason: rejectionReason.trim() });
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Travel charges request rejected successfully!");
                setSelectedBookingId(null);
                setRejectionReason("");
                loadPaymentData();
            }
        } catch (err) {
            console.error("Reject travel charges error:", err);
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to reject travel charges request");
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
                loadPaymentData();
            }
        } catch (err) {
            console.error("Pay travel charges error:", err);
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to pay travel charges");
        }
    };

    const handlePayFirstInstallment = (bookingId) => {
        setSelectedBookingId(bookingId);
        setShowPayFirstInstallConfirm(true);
    };

    const handlePayFirstInstallConfirm = async () => {
        if (!selectedBookingId) return;
        const bookingId = selectedBookingId;
        setShowPayFirstInstallConfirm(false);
        const loadingToast = toast.showLoading("Paying first installment...");
        try {
            const response = await payFirstInstallment(bookingId);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("First installment (50%) paid successfully! Vendor status updated to COMPLETED.");
                setSelectedBookingId(null);
                loadPaymentData();
            }
        } catch (err) {
            console.error("Pay first installment error:", err);
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to pay first installment");
        }
    };

    const [secondInstallmentModal, setSecondInstallmentModal] = useState({
        open: false,
        booking: null,
        incentive: 0,
        penalty: 0
    });

    const [userRefundModal, setUserRefundModal] = useState({
        open: false,
        booking: null,
        refundAmount: 0
    });

    const handleOpenSecondInstallmentModal = (booking) => {
        const isSuccess = booking.borewellResult?.status === "SUCCESS";
        setSecondInstallmentModal({
            open: true,
            booking,
            incentive: isSuccess ? 0 : undefined,
            penalty: !isSuccess ? 0 : undefined
        });
    };

    const handleCloseSecondInstallmentModal = () => {
        setSecondInstallmentModal({
            open: false,
            booking: null,
            incentive: 0,
            penalty: 0
        });
    };

    const handleOpenUserRefundModal = (booking) => {
        setUserRefundModal({
            open: true,
            booking,
            refundAmount: booking.payment?.remainingAmount || 0
        });
    };

    const handleCloseUserRefundModal = () => {
        setUserRefundModal({
            open: false,
            booking: null,
            refundAmount: 0
        });
    };

    const handleProcessUserRefund = () => {
        const { booking, refundAmount } = userRefundModal;
        if (!booking) return;

        if (!refundAmount || refundAmount <= 0) {
            toast.showError("Refund amount must be greater than 0");
            return;
        }

        setShowProcessRefundConfirm(true);
    };

    const handleProcessRefundConfirm = async () => {
        setShowProcessRefundConfirm(false);
        const { booking, refundAmount } = userRefundModal;
        if (!booking) return;

        const loadingToast = toast.showLoading("Processing refund...");
        try {
            const response = await processUserRefund(booking._id, { refundAmount });
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess(response.message || "User refund processed successfully!");
                handleCloseUserRefundModal();
                loadPaymentData();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to process user refund");
            }
        } catch (err) {
            console.error("Process user refund error:", err);
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to process user refund");
        }
    };

    const handlePaySecondInstallment = () => {
        setShowPaySecondInstallConfirm(true);
    };

    const handlePaySecondInstallConfirm = async () => {
        setShowPaySecondInstallConfirm(false);
        const { booking, incentive, penalty } = secondInstallmentModal;
        if (!booking) return;
        
        const isSuccess = booking.borewellResult?.status === "SUCCESS";
        const baseAmount = booking.payment?.totalAmount * 0.5;
        const finalAmount = isSuccess
            ? baseAmount + (incentive || 0)
            : Math.max(0, baseAmount - (penalty || 0));

        const loadingToast = toast.showLoading("Paying second installment...");
        try {
            const response = await paySecondInstallment(booking._id, {
                incentive: isSuccess ? (incentive || 0) : 0,
                penalty: !isSuccess ? (penalty || 0) : 0
            });
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess(response.message || "Second installment (Final Settlement) paid successfully!");
                handleCloseSecondInstallmentModal();
                loadPaymentData();
            }
        } catch (err) {
            console.error("Pay second installment error:", err);
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to pay second installment");
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

    const getStatusBadge = (status) => {
        const badges = {
            SUCCESS: "bg-green-100 text-green-700",
            PENDING: "bg-yellow-100 text-yellow-700",
            FAILED: "bg-red-100 text-red-700",
            REFUNDED: "bg-gray-100 text-gray-700",
        };
        return badges[status] || "bg-gray-100 text-gray-700";
    };

    const getPaymentTypeBadge = (type) => {
        const badges = {
            ADVANCE: "bg-blue-100 text-blue-700",
            REMAINING: "bg-purple-100 text-purple-700",
            SETTLEMENT: "bg-orange-100 text-orange-700",
        };
        return badges[type] || "bg-gray-100 text-gray-700";
    };

    if (loading && activeTab === "overview") {
        return (
            <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A84FF] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading payment data...</p>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className="min-h-[calc(100vh-5rem)]">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Management</h1>
                <p className="text-gray-600">Manage all payments, settlements, and transactions</p>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === "overview"
                            ? `border-[${currentTheme.primary}] text-[${currentTheme.primary}]`
                            : "border-transparent text-gray-600 hover:text-gray-800"
                            }`}
                        style={activeTab === "overview" ? { borderColor: currentTheme.primary, color: currentTheme.primary } : {}}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab("user-payments")}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === "user-payments"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-600 hover:text-gray-800"
                            }`}
                    >
                        User Payments
                    </button>
                    <button
                        onClick={() => setActiveTab("vendor-payments")}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === "vendor-payments"
                            ? "border-orange-500 text-orange-600"
                            : "border-transparent text-gray-600 hover:text-gray-800"
                            }`}
                    >
                        Vendor Settlements
                    </button>
                    <button
                        onClick={() => setActiveTab("travel-charges")}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === "travel-charges"
                            ? "border-purple-500 text-purple-600"
                            : "border-transparent text-gray-600 hover:text-gray-800"
                            }`}
                    >
                        Travel Charges
                        {travelChargesRequests.filter(r => r.travelChargesRequest?.status === "PENDING").length > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                {travelChargesRequests.filter(r => r.travelChargesRequest?.status === "PENDING").length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Overview Tab */}
            {activeTab === "overview" && (
                <div>
                    {/* Revenue Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 shadow-sm border border-green-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                                    <IoWalletOutline className="text-2xl text-white" />
                                </div>
                                <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-full">Total Revenue</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-800 mb-1">{formatCurrency(stats.totalRevenue)}</p>
                            <p className="text-xs text-gray-600">All successful payments</p>
                        </div>

                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: currentTheme.primary }}>
                                    <IoCheckmarkCircleOutline className="text-2xl text-white" />
                                </div>
                                <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ color: currentTheme.primaryDark, backgroundColor: `${currentTheme.primary}20` }}>Success</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-800 mb-1">{stats.successPayments}</p>
                            <p className="text-xs text-gray-600">Successful payments</p>
                        </div>


                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                    <IoTimeOutline className="text-2xl text-yellow-600" />
                                </div>
                                <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Pending</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-800 mb-1">{stats.pendingPayments}</p>
                            <p className="text-xs text-gray-600">Pending payments</p>
                        </div>

                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                    <IoCloseCircleOutline className="text-2xl text-red-600" />
                                </div>
                                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Failed</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-800 mb-1">{stats.failedPayments}</p>
                            <p className="text-xs text-gray-600">Failed payments</p>
                        </div>
                    </div>

                    {/* Payment Type Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <IoArrowDownOutline className="text-xl text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800">Advance Payments</h3>
                            </div>
                            <p className="text-2xl font-bold text-gray-800 mb-1">{formatCurrency(stats.advancePayments.total)}</p>
                            <p className="text-sm text-gray-600">{stats.advancePayments.count} transactions</p>
                        </div>

                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <IoArrowUpOutline className="text-xl text-purple-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800">Remaining Payments</h3>
                            </div>
                            <p className="text-2xl font-bold text-gray-800 mb-1">{formatCurrency(stats.remainingPayments.total)}</p>
                            <p className="text-sm text-gray-600">{stats.remainingPayments.count} transactions</p>
                        </div>

                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                    <IoCashOutline className="text-xl text-orange-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800">Vendor Settlements</h3>
                            </div>
                            <p className="text-2xl font-bold text-gray-800 mb-1">{formatCurrency(stats.settlements.total)}</p>
                            <p className="text-sm text-gray-600">{stats.settlements.count} settlements</p>
                        </div>
                    </div>
                </div>
            )}

            {/* User Payments Tab */}
            {activeTab === "user-payments" && (
                <div>
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 mb-6 border border-blue-200">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: currentTheme.primary }}>
                                <IoArrowDownOutline className="text-3xl text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-1">User Payments</h2>
                                <p className="text-gray-600">Track all payments received from users (40% Advance + 60% Remaining)</p>
                            </div>
                        </div>
                    </div>

                    {/* User Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <IoReceiptOutline className="text-2xl text-blue-600" />
                                </div>
                                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full">Total Payments</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-800 mb-1">{userStats.totalPayments}</p>
                            <p className="text-xs text-gray-600">Payments received</p>
                        </div>

                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                    <IoWalletOutline className="text-2xl text-green-600" />
                                </div>
                                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">Total Amount</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-800 mb-1">{formatCurrency(userStats.totalAmount)}</p>
                            <p className="text-xs text-gray-600">All user payments</p>
                        </div>

                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <IoArrowUpOutline className="text-2xl text-purple-600" />
                                </div>
                                <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded-full">Total Refunds</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-800 mb-1">{userStats.totalRefunds}</p>
                            <p className="text-xs text-gray-600">Failed borewell refunds</p>
                        </div>

                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                    <IoCashOutline className="text-2xl text-red-600" />
                                </div>
                                <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded-full">Refund Amount</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-800 mb-1">{formatCurrency(userStats.refundAmount)}</p>
                            <p className="text-xs text-gray-600">Total refunded</p>
                        </div>
                    </div>

                    {/* Pending Refunds Card - Shows bookings awaiting refund processing */}
                    {pendingUserRefunds.length > 0 && (
                        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 mb-6 border border-orange-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg">
                                        <IoTimeOutline className="text-3xl text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800 mb-1">Pending User Refunds</h2>
                                        <p className="text-gray-600">Failed borewell bookings awaiting refund processing</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Pending</p>
                                    <p className="text-2xl font-bold text-orange-700">{pendingUserRefunds.length}</p>
                                    <p className="text-xs text-gray-500">booking(s)</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                {pendingUserRefunds.map((booking) => (
                                    <div
                                        key={booking._id}
                                        className="bg-white rounded-lg p-4 shadow-sm border border-orange-200 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 mb-1">Booking ID</p>
                                                <p className="text-sm font-semibold text-gray-800">
                                                    #{booking._id.toString().slice(-8)}
                                                </p>
                                            </div>
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                                FAILED
                                            </span>
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            <div>
                                                <p className="text-xs text-gray-500">User</p>
                                                <p className="text-sm font-semibold text-gray-800">{booking.user?.name || "N/A"}</p>
                                                <p className="text-xs text-gray-500">{booking.user?.email || ""}</p>
                                            </div>
                                            <div className="pt-2 border-t border-gray-200">
                                                <p className="text-xs text-gray-500">Total Amount</p>
                                                <p className="text-sm font-bold text-gray-800">{formatCurrency(booking.payment?.totalAmount || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Remaining Amount (Refundable)</p>
                                                <p className="text-lg font-bold text-orange-600">{formatCurrency(booking.payment?.remainingAmount || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Borewell Approved</p>
                                                <p className="text-sm text-gray-800">{formatDate(booking.borewellResult?.approvedAt)}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleOpenUserRefundModal(booking)}
                                            className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors text-sm flex items-center justify-center gap-2"
                                        >
                                            <IoWalletOutline className="text-lg" />
                                            Process Refund
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Refunds Card for Failed Borewell - Completed Refunds */}
                    {userRefunds.length > 0 && (
                        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-6 mb-6 border border-red-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-red-500 flex items-center justify-center shadow-lg">
                                        <IoArrowUpOutline className="text-3xl text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800 mb-1">Refunds & Compensation</h2>
                                        <p className="text-gray-600">Refunds processed for users due to failed borewell results (after admin approval)</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Total Refunds</p>
                                    <p className="text-2xl font-bold text-red-700">
                                        {formatCurrency(userRefunds.reduce((sum, refund) => sum + (refund.amount || 0), 0))}
                                    </p>
                                    <p className="text-xs text-gray-500">{userRefunds.length} refund(s)</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                {userRefunds.map((refund) => (
                                    <div
                                        key={refund._id}
                                        className="bg-white rounded-lg p-4 shadow-sm border border-red-200 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 mb-1">Booking ID</p>
                                                <p className="text-sm font-semibold text-gray-800">
                                                    #{refund.booking?.bookingId?.toString().slice(-8) || refund.booking?._id?.toString().slice(-8) || "N/A"}
                                                </p>
                                            </div>
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                                REFUND
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs text-gray-500">User</p>
                                                <p className="text-sm font-semibold text-gray-800">{refund.user?.name || "N/A"}</p>
                                                <p className="text-xs text-gray-500">{refund.user?.email || ""}</p>
                                            </div>
                                            <div className="pt-2 border-t border-gray-200">
                                                <p className="text-xs text-gray-500">Refund Amount</p>
                                                <p className="text-lg font-bold text-red-600">{formatCurrency(refund.amount || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Processed Date</p>
                                                <p className="text-sm text-gray-800">{formatDate(refund.refundedAt || refund.paidAt || refund.createdAt)}</p>
                                            </div>
                                            {refund.description && (
                                                <div className="pt-2 border-t border-gray-200">
                                                    <p className="text-xs text-gray-500">Reason</p>
                                                    <p className="text-xs text-gray-700 italic">{refund.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by Order ID..."
                                    value={userFilters.search}
                                    onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                                    onFocus={(e) => {
                                        e.target.style.borderColor = currentTheme.primary;
                                        e.target.style.setProperty('--tw-ring-color', currentTheme.primary);
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '';
                                    }}
                                />
                            </div>
                            <select
                                value={userFilters.status}
                                onChange={(e) => setUserFilters({ ...userFilters, status: e.target.value })}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Status</option>
                                <option value="SUCCESS">Success</option>
                                <option value="PENDING">Pending</option>
                                <option value="FAILED">Failed</option>
                                <option value="REFUNDED">Refunded</option>
                            </select>
                            <select
                                value={userFilters.paymentType}
                                onChange={(e) => setUserFilters({ ...userFilters, paymentType: e.target.value })}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Types</option>
                                <option value="ADVANCE">Advance (40%)</option>
                                <option value="REMAINING">Remaining (60%)</option>
                            </select>
                            <button
                                onClick={() => setUserFilters({ status: "", paymentType: "", search: "" })}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {/* Payments Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: currentTheme.primary }}></div>
                                <p className="text-gray-600">Loading user payments...</p>
                            </div>
                        ) : userPayments.length === 0 ? (
                            <div className="p-8 text-center">
                                <IoReceiptOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No user payments found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b" style={{ backgroundColor: `${currentTheme.primary}15`, borderColor: `${currentTheme.primary}30` }}>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: currentTheme.primaryDark }}>Payment ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: currentTheme.primaryDark }}>Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: currentTheme.primaryDark }}>User</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: currentTheme.primaryDark }}>Vendor</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: currentTheme.primaryDark }}>Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: currentTheme.primaryDark }}>Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: currentTheme.primaryDark }}>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {userPayments.map((payment) => (
                                            <tr
                                                key={payment._id}
                                                className="hover:bg-opacity-50"
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${currentTheme.primary}10`}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                                            >
                                                <td className="px-6 py-4 text-sm font-mono text-gray-600">
                                                    {payment.razorpayOrderId?.slice(-8) || "N/A"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${payment.paymentType === "ADVANCE"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-purple-100 text-purple-700"
                                                        }`}>
                                                        {payment.paymentType === "ADVANCE" ? "40% Advance" : "60% Remaining"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                                                    {payment.user?.name || "N/A"}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-800">
                                                    {payment.vendor?.name || "N/A"}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-800">
                                                    {formatCurrency(payment.amount)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(payment.status)}`}>
                                                        {payment.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {formatDate(payment.paidAt || payment.createdAt)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {userPagination.totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Page {userPagination.currentPage} of {userPagination.totalPages} ({userPagination.totalPayments} total)
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setUserPagination({ ...userPagination, currentPage: userPagination.currentPage - 1 })}
                                    disabled={userPagination.currentPage === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setUserPagination({ ...userPagination, currentPage: userPagination.currentPage + 1 })}
                                    disabled={userPagination.currentPage === userPagination.totalPages}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Vendor Payments Tab */}
            {activeTab === "vendor-payments" && (
                <div>
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 mb-6 border border-orange-200">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg">
                                <IoCashOutline className="text-3xl text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-1">Vendor Payments</h2>
                                <p className="text-gray-600">Manage travel charges, first installment (50%), and final settlement payments</p>
                            </div>
                        </div>
                    </div>

                    {/* Bookings with Payment Cards */}
                    <div className="space-y-6">
                        {loading ? (
                            <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-200">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading vendor payments...</p>
                            </div>
                        ) : vendorBookings.length === 0 ? (
                            <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-200">
                                <IoCashOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No vendor payments found</p>
                            </div>
                        ) : (
                            vendorBookings.map((booking) => (
                                <div key={booking._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    {/* Booking Header */}
                                    <div className="mb-6 pb-4 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800">
                                                    Booking #{booking._id.toString().slice(-8)}
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Vendor: <span className="font-semibold">{booking.vendor?.name || "N/A"}</span> |
                                                    User: <span className="font-semibold">{booking.user?.name || "N/A"}</span> |
                                                    Service: <span className="font-semibold">{booking.service?.name || "N/A"}</span>
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.vendorStatus === "COMPLETED" || booking.vendorStatus === "SUCCESS" || booking.vendorStatus === "FAILED"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-yellow-100 text-yellow-700"
                                                }`}>
                                                {booking.vendorStatus || booking.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Payment Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Travel Charges Card */}
                                        <div className={`border-2 rounded-lg p-4 ${booking.travelChargesRequest?.paid
                                            ? "border-green-200 bg-green-50"
                                            : booking.travelChargesRequest?.status === "APPROVED"
                                                ? "border-orange-200 bg-orange-50"
                                                : "border-gray-200 bg-gray-50"
                                            }`}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <IoCarOutline className="text-xl text-orange-600" />
                                                <h4 className="font-bold text-gray-800">Travel Charges</h4>
                                            </div>
                                            <div className="mb-3">
                                                <p className="text-2xl font-bold text-gray-800">
                                                    {booking.travelChargesRequest?.amount
                                                        ? formatCurrency(booking.travelChargesRequest.amount)
                                                        : "N/A"}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    {booking.travelChargesRequest?.status || "Not Requested"}
                                                </p>
                                            </div>
                                            {booking.travelChargesRequest?.status === "APPROVED" && !booking.travelChargesRequest?.paid && (
                                                <button
                                                    onClick={() => handlePayTravelCharges(booking._id)}
                                                    className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm"
                                                >
                                                    Pay Travel Charges
                                                </button>
                                            )}
                                            {booking.travelChargesRequest?.paid && (
                                                <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                                                    <IoCheckmarkCircleOutline className="text-lg" />
                                                    <span>Paid</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* First Installment (50%) Card */}
                                        <div className={`border-2 rounded-lg p-4 ${booking.firstInstallment?.paid
                                            ? "border-green-200 bg-green-50"
                                            : (booking.vendorStatus === "AWAITING_PAYMENT" || booking.vendorStatus === "REPORT_UPLOADED") && booking.report?.approvedAt && (booking.reportUploadedAt || booking.report)
                                                ? "border-blue-200 bg-blue-50"
                                                : "border-gray-200 bg-gray-50"
                                            }`}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <IoCashOutline className="text-xl text-blue-600" />
                                                <h4 className="font-bold text-gray-800">First Installment</h4>
                                            </div>
                                            <div className="mb-3">
                                                <p className="text-2xl font-bold text-gray-800">
                                                    {booking.payment?.totalAmount
                                                        ? formatCurrency(booking.payment.totalAmount * 0.5)
                                                        : "N/A"}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-1">50% of Total</p>
                                                {/* Debug info - remove later */}
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Status: {booking.vendorStatus || booking.status} |
                                                    Report: {booking.reportUploadedAt || booking.report ? "Yes" : "No"} |
                                                    Approved: {booking.report?.approvedAt ? "Yes" : "No"} |
                                                    Paid: {booking.firstInstallment?.paid ? "Yes" : "No"}
                                                </p>
                                            </div>
                                            {((booking.vendorStatus === "AWAITING_PAYMENT" ||
                                                booking.vendorStatus === "REPORT_UPLOADED") &&
                                                booking.report?.approvedAt &&
                                                (booking.reportUploadedAt || booking.report) &&
                                                !booking.firstInstallment?.paid) && (
                                                    <button
                                                        onClick={() => handlePayFirstInstallment(booking._id)}
                                                        className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm"
                                                    >
                                                        Pay First Installment
                                                    </button>
                                                )}
                                            {((booking.vendorStatus === "REPORT_UPLOADED" ||
                                                booking.vendorStatus === "AWAITING_PAYMENT") &&
                                                (booking.reportUploadedAt || booking.report) &&
                                                !booking.report?.approvedAt &&
                                                !booking.firstInstallment?.paid) && (
                                                    <p className="text-xs text-yellow-600 font-semibold">
                                                        ⚠️ Report must be approved first
                                                    </p>
                                                )}
                                            {booking.firstInstallment?.paid && (
                                                <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                                                    <IoCheckmarkCircleOutline className="text-lg" />
                                                    <span>Paid</span>
                                                </div>
                                            )}
                                            {!booking.reportUploadedAt && !booking.report && (
                                                <p className="text-xs text-gray-500 italic">Waiting for report upload</p>
                                            )}
                                        </div>

                                        {/* Second Installment (Final Settlement - 50% Remaining) Card */}
                                        <div className={`border-2 rounded-lg p-4 ${booking.payment?.vendorSettlement?.status === "COMPLETED" && (booking.vendorStatus === "SUCCESS" || booking.vendorStatus === "FAILED")
                                                ? "border-green-200 bg-green-50"
                                                : booking.borewellResult?.approvedAt && booking.borewellResult?.uploadedAt
                                                    ? "border-purple-200 bg-purple-50"
                                                    : "border-gray-200 bg-gray-50"
                                            }`}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <IoWalletOutline className="text-xl text-purple-600" />
                                                <h4 className="font-bold text-gray-800">Second Installment</h4>
                                            </div>
                                            <div className="mb-3">
                                                {booking.payment?.vendorSettlement?.status === "COMPLETED" ? (
                                                    <>
                                                        <p className="text-2xl font-bold text-gray-800">
                                                            {formatCurrency(booking.payment.vendorSettlement.amount)}
                                                        </p>
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            {booking.borewellResult?.status === "SUCCESS"
                                                                ? `50% + Incentive: ${formatCurrency(booking.payment.vendorSettlement.incentive || 0)}`
                                                                : `50% - Penalty: ${formatCurrency(booking.payment.vendorSettlement.penalty || 0)}`}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-2xl font-bold text-gray-800">
                                                            {booking.payment?.totalAmount
                                                                ? formatCurrency(booking.payment.totalAmount * 0.5)
                                                                : "N/A"}
                                                        </p>
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            {booking.borewellResult?.status === "SUCCESS"
                                                                ? "50% + Incentive (to be added)"
                                                                : "50% - Penalty (to be deducted)"}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                            {booking.borewellResult?.approvedAt &&
                                                booking.borewellResult?.uploadedAt &&
                                                booking.payment?.vendorSettlement?.status !== "COMPLETED" && (
                                                    <button
                                                        onClick={() => handleOpenSecondInstallmentModal(booking)}
                                                        className="w-full bg-purple-500 text-white py-2 rounded-lg font-semibold hover:bg-purple-600 transition-colors text-sm"
                                                    >
                                                        Pay Second Installment
                                                    </button>
                                                )}
                                            {booking.payment?.vendorSettlement?.status === "COMPLETED" && (
                                                <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                                                    <IoCheckmarkCircleOutline className="text-lg" />
                                                    <span>Paid</span>
                                                </div>
                                            )}
                                            {!booking.borewellResult?.uploadedAt && (
                                                <p className="text-xs text-gray-500 italic">Waiting for borewell result</p>
                                            )}
                                            {booking.borewellResult?.uploadedAt && !booking.borewellResult?.approvedAt && (
                                                <p className="text-xs text-gray-500 italic">Waiting for borewell approval</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {vendorPagination.totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Page {vendorPagination.currentPage} of {vendorPagination.totalPages} ({vendorPagination.totalPayments} total)
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setVendorPagination({ ...vendorPagination, currentPage: vendorPagination.currentPage - 1 })}
                                    disabled={vendorPagination.currentPage === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setVendorPagination({ ...vendorPagination, currentPage: vendorPagination.currentPage + 1 })}
                                    disabled={vendorPagination.currentPage === vendorPagination.totalPages}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Travel Charges Tab */}
            {activeTab === "travel-charges" && (
                <div>
                    {/* Filter */}
                    <div className="mb-6 flex gap-4">
                        <select
                            value={travelChargesFilter.status}
                            onChange={(e) => setTravelChargesFilter({ ...travelChargesFilter, status: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading travel charges requests...</p>
                        </div>
                    ) : travelChargesRequests.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
                            <IoCarOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 font-semibold">No travel charges requests</p>
                            <p className="text-sm text-gray-500 mt-2">No travel charges requests found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {travelChargesRequests.map((request) => (
                                <div
                                    key={request.bookingId}
                                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                                    <IoCarOutline className="text-2xl text-purple-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-800">
                                                        Booking #{request.bookingId?.toString().slice(-8)}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {request.vendor?.name || "Vendor"} → {request.user?.name || "User"}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${request.travelChargesRequest?.status === "APPROVED"
                                                    ? "bg-green-100 text-green-700"
                                                    : request.travelChargesRequest?.status === "REJECTED"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                    }`}>
                                                    {request.travelChargesRequest?.status || "PENDING"}
                                                </span>
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
                                            {request.travelChargesRequest?.status === "REJECTED" && request.travelChargesRequest?.rejectionReason && (
                                                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                                                    <p className="text-xs text-red-700 mb-1 font-semibold">Rejection Reason</p>
                                                    <p className="text-sm text-red-800">{request.travelChargesRequest.rejectionReason}</p>
                                                </div>
                                            )}
                                            {request.travelChargesRequest?.requestedAt && (
                                                <p className="text-xs text-gray-500 mt-3">
                                                    Requested: {new Date(request.travelChargesRequest.requestedAt).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                        {request.travelChargesRequest?.status === "PENDING" && (
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => handleApproveTravelCharges(request.bookingId)}
                                                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm whitespace-nowrap shadow-md"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRejectTravelCharges(request.bookingId)}
                                                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm whitespace-nowrap shadow-md"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Pagination */}
                            {travelChargesPagination.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6">
                                    <button
                                        onClick={() => setTravelChargesPagination({ ...travelChargesPagination, currentPage: travelChargesPagination.currentPage - 1 })}
                                        disabled={travelChargesPagination.currentPage === 1}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        Page {travelChargesPagination.currentPage} of {travelChargesPagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => setTravelChargesPagination({ ...travelChargesPagination, currentPage: travelChargesPagination.currentPage + 1 })}
                                        disabled={travelChargesPagination.currentPage === travelChargesPagination.totalPages}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Second Installment Payment Modal */}
            {secondInstallmentModal.open && secondInstallmentModal.booking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Pay Second Installment (Final Settlement)</h3>

                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">Booking ID: <span className="font-semibold">{secondInstallmentModal.booking._id.toString().slice(-8)}</span></p>
                            <p className="text-sm text-gray-600 mb-2">Vendor: <span className="font-semibold">{secondInstallmentModal.booking.vendor?.name || "N/A"}</span></p>
                            <p className="text-sm text-gray-600 mb-2">Borewell Result: <span className={`font-semibold ${secondInstallmentModal.booking.borewellResult?.status === "SUCCESS" ? "text-green-600" : "text-red-600"}`}>
                                {secondInstallmentModal.booking.borewellResult?.status || "N/A"}
                            </span></p>
                            <p className="text-sm text-gray-600">Base Amount (50%): <span className="font-semibold">{formatCurrency(secondInstallmentModal.booking.payment?.totalAmount * 0.5)}</span></p>
                        </div>

                        {secondInstallmentModal.booking.borewellResult?.status === "SUCCESS" ? (
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Incentive Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={secondInstallmentModal.incentive || ""}
                                    onChange={(e) => setSecondInstallmentModal({
                                        ...secondInstallmentModal,
                                        incentive: parseFloat(e.target.value) || 0
                                    })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter incentive amount"
                                />
                                <p className="text-xs text-gray-500 mt-1">Final Amount: {formatCurrency((secondInstallmentModal.booking.payment?.totalAmount * 0.5) + (secondInstallmentModal.incentive || 0))}</p>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Penalty Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max={secondInstallmentModal.booking.payment?.totalAmount * 0.5}
                                    value={secondInstallmentModal.penalty || ""}
                                    onChange={(e) => setSecondInstallmentModal({
                                        ...secondInstallmentModal,
                                        penalty: parseFloat(e.target.value) || 0
                                    })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter penalty amount"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Final Amount: {formatCurrency(Math.max(0, (secondInstallmentModal.booking.payment?.totalAmount * 0.5) - (secondInstallmentModal.penalty || 0)))}
                                    {secondInstallmentModal.penalty > (secondInstallmentModal.booking.payment?.totalAmount * 0.5) && (
                                        <span className="text-red-600 ml-2">(Penalty cannot exceed 50%)</span>
                                    )}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleCloseSecondInstallmentModal}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePaySecondInstallment}
                                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold text-sm"
                            >
                                Pay Settlement
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Refund Modal */}
            {userRefundModal.open && userRefundModal.booking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Process User Refund</h3>

                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">Booking ID: <span className="font-semibold">{userRefundModal.booking._id.toString().slice(-8)}</span></p>
                            <p className="text-sm text-gray-600 mb-2">User: <span className="font-semibold">{userRefundModal.booking.user?.name || "N/A"}</span></p>
                            <p className="text-sm text-gray-600 mb-2">Borewell Result: <span className="font-semibold text-red-600">FAILED</span></p>
                            <p className="text-sm text-gray-600">Remaining Amount: <span className="font-semibold">{formatCurrency(userRefundModal.booking.payment?.remainingAmount || 0)}</span></p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Refund Amount (₹)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max={userRefundModal.booking.payment?.remainingAmount || 0}
                                value={userRefundModal.refundAmount || ""}
                                onChange={(e) => setUserRefundModal({
                                    ...userRefundModal,
                                    refundAmount: parseFloat(e.target.value) || 0
                                })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="Enter refund amount"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Max Refund: {formatCurrency(userRefundModal.booking.payment?.remainingAmount || 0)}
                                {userRefundModal.refundAmount > (userRefundModal.booking.payment?.remainingAmount || 0) && (
                                    <span className="text-red-600 ml-2">(Cannot exceed remaining amount)</span>
                                )}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCloseUserRefundModal}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcessUserRefund}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
                            >
                                Process Refund
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Approve Travel Charges Confirmation Modal */}
        <ConfirmModal
            isOpen={showApproveTravelConfirm}
            onClose={() => {
                setShowApproveTravelConfirm(false);
                setSelectedBookingId(null);
            }}
            onConfirm={handleApproveTravelConfirm}
            title="Approve Travel Charges"
            message="Are you sure you want to approve this travel charges request?"
            confirmText="Yes, Approve"
            cancelText="Cancel"
            confirmColor="primary"
        />

        {/* Reject Travel Charges Reason Input Modal */}
        <InputModal
            isOpen={showRejectTravelInput}
            onClose={() => {
                setShowRejectTravelInput(false);
                setSelectedBookingId(null);
                setRejectionReason("");
            }}
            onSubmit={handleRejectTravelReasonSubmit}
            title="Reject Travel Charges"
            message="Please provide a reason for rejection (minimum 10 characters):"
            placeholder="Enter rejection reason..."
            submitText="Continue"
            cancelText="Cancel"
            minLength={10}
            isTextarea={true}
            textareaRows={4}
        />

        {/* Reject Travel Charges Confirmation Modal */}
        <ConfirmModal
            isOpen={showRejectTravelConfirm}
            onClose={() => {
                setShowRejectTravelConfirm(false);
                setSelectedBookingId(null);
                setRejectionReason("");
            }}
            onConfirm={handleRejectTravelConfirm}
            title="Confirm Rejection"
            message="Are you sure you want to reject this travel charges request?"
            confirmText="Yes, Reject"
            cancelText="Cancel"
            confirmColor="danger"
        />

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

        {/* Pay First Installment Confirmation Modal */}
        <ConfirmModal
            isOpen={showPayFirstInstallConfirm}
            onClose={() => {
                setShowPayFirstInstallConfirm(false);
                setSelectedBookingId(null);
            }}
            onConfirm={handlePayFirstInstallConfirm}
            title="Pay First Installment"
            message="Are you sure you want to pay first installment (50%) to the vendor? This will change vendor status to COMPLETED."
            confirmText="Yes, Pay"
            cancelText="Cancel"
            confirmColor="primary"
        />

        {/* Process Refund Confirmation Modal */}
        <ConfirmModal
            isOpen={showProcessRefundConfirm}
            onClose={() => setShowProcessRefundConfirm(false)}
            onConfirm={handleProcessRefundConfirm}
            title="Process Refund"
            message={`Are you sure you want to process refund of ${formatCurrency(userRefundModal.refundAmount)} for this user?`}
            confirmText="Yes, Process Refund"
            cancelText="Cancel"
            confirmColor="warning"
        />

        {/* Pay Second Installment Confirmation Modal */}
        <ConfirmModal
            isOpen={showPaySecondInstallConfirm}
            onClose={() => setShowPaySecondInstallConfirm(false)}
            onConfirm={handlePaySecondInstallConfirm}
            title="Pay Second Installment"
            message={`Are you sure you want to pay second installment (Final Settlement) of ${formatCurrency(
                secondInstallmentModal.booking
                    ? (() => {
                          const isSuccess = secondInstallmentModal.booking.borewellResult?.status === "SUCCESS";
                          const baseAmount = secondInstallmentModal.booking.payment?.totalAmount * 0.5;
                          return isSuccess
                              ? baseAmount + (secondInstallmentModal.incentive || 0)
                              : Math.max(0, baseAmount - (secondInstallmentModal.penalty || 0));
                      })()
                    : 0
            )} to the vendor?`}
            confirmText="Yes, Pay"
            cancelText="Cancel"
            confirmColor="primary"
        />
    </>);
}

