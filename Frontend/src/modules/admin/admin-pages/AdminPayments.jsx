import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { getAllPayments, getPaymentStatistics, getAdminPaymentOverview, getVendorPaymentOverview, getAllBookings, payFirstInstallment, paySecondInstallment, getPendingUserRefunds, processUserRefund, getAllWithdrawalRequests, getAllUserWithdrawalRequests, approveUserWithdrawalRequest, rejectUserWithdrawalRequest, processUserWithdrawalRequest, approveWithdrawalRequest, rejectWithdrawalRequest, processWithdrawal, getPendingVendorFinalSettlements, getCompletedVendorFinalSettlements, getPendingUserFinalSettlements, getCompletedUserFinalSettlements, processNewFinalSettlement, processUserFinalSettlement } from "../../../services/adminApi";
import { useTheme } from "../../../contexts/ThemeContext";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";
import TransactionInfoModal from "../../shared/components/TransactionInfoModal";
import { loadRazorpay } from "../../../utils/razorpay";

export default function AdminPayments({ defaultTab = "overview" }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, themeColors } = useTheme();
    const currentTheme = themeColors[theme] || themeColors.default;
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(defaultTab);

    // Determine if we're on user, vendor, or admin route
    const pathname = location.pathname;
    const isUserRoute = pathname === "/admin/payments/user" || pathname.startsWith("/admin/payments/user/");
    const isVendorRoute = pathname === "/admin/payments/vendor" || pathname.startsWith("/admin/payments/vendor/");
    const isAdminRoute = pathname === "/admin/payments/admin" || pathname.startsWith("/admin/payments/admin/");
    const isMainRoute = pathname === "/admin/payments";
    
    // Force show main tabs when on main payments route or admin route
    const showMainTabs = !isUserRoute && !isVendorRoute;

    // Sync activeTab with URL
    useEffect(() => {
        if (isUserRoute) {
            // Default to overview for user route
            if (activeTab !== "user-overview" && activeTab !== "user-withdrawals" && activeTab !== "user-final-settlement") {
                setActiveTab("user-overview");
            }
        } else if (isVendorRoute) {
            // Default to overview for vendor route
            if (activeTab !== "vendor-overview" && activeTab !== "vendor-withdrawals" && activeTab !== "vendor-final-settlement") {
                setActiveTab("vendor-overview");
            }
        } else if (isAdminRoute) {
            // Set to admin-overview for admin route
            if (activeTab !== "admin-overview") {
                setActiveTab("admin-overview");
            }
        } else if (isMainRoute) {
            // Only set to overview if not already on admin-overview or other main route tabs
            if (activeTab !== "overview" && activeTab !== "admin-overview" && activeTab !== "user-payments" && activeTab !== "vendor-payments") {
                setActiveTab("overview");
            }
        }
    }, [location.pathname, isUserRoute, isVendorRoute, isAdminRoute, isMainRoute]);
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
    const [vendorBookings, setVendorBookings] = useState([]);
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
    const [showPayFirstInstallConfirm, setShowPayFirstInstallConfirm] = useState(false);
    const [showProcessRefundConfirm, setShowProcessRefundConfirm] = useState(false);
    const [showPaySecondInstallConfirm, setShowPaySecondInstallConfirm] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [vendorWithdrawalRequests, setVendorWithdrawalRequests] = useState([]);
    const [userWithdrawalRequests, setUserWithdrawalRequests] = useState([]);
    const [selectedWithdrawalRequest, setSelectedWithdrawalRequest] = useState(null);
    const [selectedUserWithdrawalRequest, setSelectedUserWithdrawalRequest] = useState(null);
    const [processingWithdrawal, setProcessingWithdrawal] = useState(false);
    const [showUserApproveModal, setShowUserApproveModal] = useState(false);
    const [showUserRejectModal, setShowUserRejectModal] = useState(false);
    const [showUserProcessModal, setShowUserProcessModal] = useState(false);
    const [userRejectionReason, setUserRejectionReason] = useState("");
    const [userRazorpayPayoutId, setUserRazorpayPayoutId] = useState("");
    // Vendor withdrawal modals
    const [showVendorApproveModal, setShowVendorApproveModal] = useState(false);
    const [showVendorRejectModal, setShowVendorRejectModal] = useState(false);
    const [vendorRejectionReason, setVendorRejectionReason] = useState("");
    // Transaction Info Modal states
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [transactionModalType, setTransactionModalType] = useState(null); // "vendor" or "user"
    // Final Settlement states
    const [pendingFinalSettlements, setPendingFinalSettlements] = useState([]);
    const [completedFinalSettlements, setCompletedFinalSettlements] = useState([]);
    const [finalSettlementPagination, setFinalSettlementPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        total: 0,
    });
    const [finalSettlementHistoryPagination, setFinalSettlementHistoryPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        total: 0,
    });
    const [finalSettlementSubTab, setFinalSettlementSubTab] = useState("pending"); // "pending" or "completed"
    const [selectedFinalSettlementBooking, setSelectedFinalSettlementBooking] = useState(null);
    const [showFinalSettlementModal, setShowFinalSettlementModal] = useState(false);
    const [finalSettlementRewardAmount, setFinalSettlementRewardAmount] = useState("");
    const [finalSettlementPenaltyAmount, setFinalSettlementPenaltyAmount] = useState("");
    const [finalSettlementNotes, setFinalSettlementNotes] = useState("");
    const [processingFinalSettlement, setProcessingFinalSettlement] = useState(false);
    // User Final Settlement states
    const [pendingUserFinalSettlements, setPendingUserFinalSettlements] = useState([]);
    const [completedUserFinalSettlements, setCompletedUserFinalSettlements] = useState([]);
    const [userFinalSettlementPagination, setUserFinalSettlementPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        total: 0,
    });
    const [userFinalSettlementHistoryPagination, setUserFinalSettlementHistoryPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        total: 0,
    });
    const [userFinalSettlementSubTab, setUserFinalSettlementSubTab] = useState("pending");
    const [selectedUserFinalSettlementBooking, setSelectedUserFinalSettlementBooking] = useState(null);
    const [showUserFinalSettlementModal, setShowUserFinalSettlementModal] = useState(false);
    const [userFinalSettlementRemittanceAmount, setUserFinalSettlementRemittanceAmount] = useState("");
    const [userFinalSettlementNotes, setUserFinalSettlementNotes] = useState("");
    const [processingUserFinalSettlement, setProcessingUserFinalSettlement] = useState(false);
    // Admin Overview states
    const [adminOverview, setAdminOverview] = useState(null);
    // Vendor Overview states
    const [vendorOverview, setVendorOverview] = useState(null);

    useEffect(() => {
        loadPaymentData();
    }, [activeTab, userFilters, vendorFilters, userPagination.currentPage, vendorPagination.currentPage, location.pathname, finalSettlementSubTab, finalSettlementPagination.currentPage, finalSettlementHistoryPagination.currentPage, userFinalSettlementSubTab, userFinalSettlementPagination.currentPage, userFinalSettlementHistoryPagination.currentPage]);

    // Refetch when page becomes visible (user switches tabs/windows)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadPaymentData();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [activeTab, userFilters, vendorFilters, userPagination.currentPage, vendorPagination.currentPage]);

    const loadPaymentData = async () => {
        try {
            setLoading(true);
            setError("");

            if (activeTab === "overview") {
                const statsResponse = await getPaymentStatistics();
                if (statsResponse.success) {
                    setStats(statsResponse.data.statistics);
                }
            } else if (activeTab === "admin-overview") {
                const overviewResponse = await getAdminPaymentOverview();
                if (overviewResponse.success) {
                    setAdminOverview(overviewResponse.data.overview);
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
            } else if (activeTab === "vendor-withdrawals") {
                // Load vendor withdrawal requests (both PENDING and APPROVED)
                const response = await getAllWithdrawalRequests();
                if (response.success) {
                    setVendorWithdrawalRequests(response.data.withdrawalRequests || []);
                }
            } else if (activeTab === "vendor-final-settlement") {
                // Load vendor final settlements
                if (finalSettlementSubTab === "pending") {
                    const params = {
                        page: finalSettlementPagination.currentPage,
                        limit: 10,
                    };
                    const response = await getPendingVendorFinalSettlements(params);
                    if (response.success) {
                        setPendingFinalSettlements(response.data.bookings || []);
                        setFinalSettlementPagination(response.data.pagination || {
                            currentPage: 1,
                            totalPages: 1,
                            total: 0,
                        });
                    }
                } else {
                    const params = {
                        page: finalSettlementHistoryPagination.currentPage,
                        limit: 10,
                    };
                    const response = await getCompletedVendorFinalSettlements(params);
                    if (response.success) {
                        setCompletedFinalSettlements(response.data.bookings || []);
                        setFinalSettlementHistoryPagination(response.data.pagination || {
                            currentPage: 1,
                            totalPages: 1,
                            total: 0,
                        });
                    }
                }
            } else if (activeTab === "user-final-settlement") {
                // Load user final settlements
                if (userFinalSettlementSubTab === "pending") {
                    const params = {
                        page: userFinalSettlementPagination.currentPage,
                        limit: 10,
                    };
                    const response = await getPendingUserFinalSettlements(params);
                    if (response.success) {
                        setPendingUserFinalSettlements(response.data.bookings || []);
                        setUserFinalSettlementPagination(response.data.pagination || {
                            currentPage: 1,
                            totalPages: 1,
                            total: 0,
                        });
                    }
                } else {
                    const params = {
                        page: userFinalSettlementHistoryPagination.currentPage,
                        limit: 10,
                    };
                    const response = await getCompletedUserFinalSettlements(params);
                    if (response.success) {
                        setCompletedUserFinalSettlements(response.data.bookings || []);
                        setUserFinalSettlementHistoryPagination(response.data.pagination || {
                            currentPage: 1,
                            totalPages: 1,
                            total: 0,
                        });
                    }
                }
            } else if (activeTab === "user-overview") {
                // Load user payment statistics
                const params = {
                    page: 1,
                    limit: 100,
                };
                const [paymentsResponse, refundsResponse, pendingRefundsResponse] = await Promise.all([
                    getAllPayments(params),
                    getAllPayments({ paymentType: "REFUND", status: "SUCCESS", page: 1, limit: 100 }),
                    getPendingUserRefunds({ page: 1, limit: 100 })
                ]);

                if (paymentsResponse.success) {
                    const userPaymentsOnly = paymentsResponse.data.payments.filter(
                        (p) => p.paymentType === "ADVANCE" || p.paymentType === "REMAINING"
                    );
                    const advancePayments = userPaymentsOnly.filter(p => p.paymentType === "ADVANCE");
                    const remainingPayments = userPaymentsOnly.filter(p => p.paymentType === "REMAINING");
                    const totalAmount = userPaymentsOnly.reduce((sum, p) => sum + (p.amount || 0), 0);

                    let failedBorewellRefunds = [];
                    if (refundsResponse.success) {
                        failedBorewellRefunds = refundsResponse.data.payments.filter(
                            (payment) => {
                                return payment.description?.toLowerCase().includes('failed borewell') || 
                                       payment.description?.toLowerCase().includes('refund for failed') ||
                                       (payment.description?.toLowerCase().includes('borewell') && payment.status === 'SUCCESS');
                            }
                        );
                        setUserRefunds(failedBorewellRefunds);
                    }

                    if (pendingRefundsResponse.success) {
                        setPendingUserRefunds(pendingRefundsResponse.data.bookings || []);
                    }

                    setUserStats({
                        totalPayments: userPaymentsOnly.length,
                        totalAmount,
                        advancePayments: advancePayments.length,
                        remainingPayments: remainingPayments.length,
                        totalRefunds: failedBorewellRefunds.length,
                        refundAmount: failedBorewellRefunds.reduce((sum, r) => sum + (r.amount || 0), 0),
                    });
                }
            } else if (activeTab === "user-withdrawals") {
                // Load user withdrawal requests
                const response = await getAllUserWithdrawalRequests({ page: 1, limit: 100 });
                if (response.success) {
                    setUserWithdrawalRequests(response.data.withdrawalRequests || []);
                }
            } else if (activeTab === "user-final-settlement") {
                // Load user final settlements (same as vendor, but filtered by user perspective)
                if (userFinalSettlementSubTab === "pending") {
                    const params = {
                        page: userFinalSettlementPagination.currentPage,
                        limit: 10,
                    };
                    const response = await getPendingUserFinalSettlements(params);
                    if (response.success) {
                        setPendingUserFinalSettlements(response.data.bookings || []);
                        setUserFinalSettlementPagination(response.data.pagination || {
                            currentPage: 1,
                            totalPages: 1,
                            total: 0,
                        });
                    }
                } else {
                    const params = {
                        page: userFinalSettlementHistoryPagination.currentPage,
                        limit: 10,
                    };
                    const response = await getCompletedUserFinalSettlements(params);
                    if (response.success) {
                        setCompletedUserFinalSettlements(response.data.bookings || []);
                        setUserFinalSettlementHistoryPagination(response.data.pagination || {
                            currentPage: 1,
                            totalPages: 1,
                            total: 0,
                        });
                    }
                }
            } else if (activeTab === "vendor-overview") {
                // Load vendor payment overview statistics
                const overviewResponse = await getVendorPaymentOverview();
                if (overviewResponse.success) {
                    setVendorOverview(overviewResponse.data);
                }
            }
        } catch (err) {
            setError("Failed to load payment data");
        } finally {
            setLoading(false);
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
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to pay second installment");
        }
    };

    // User Withdrawal Request Handlers
    const handleApproveUserWithdrawal = async () => {
        if (!selectedUserWithdrawalRequest) return;
        const loadingToast = toast.showLoading("Approving withdrawal request...");
        try {
            const response = await approveUserWithdrawalRequest(
                selectedUserWithdrawalRequest.userId,
                selectedUserWithdrawalRequest._id
            );
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Withdrawal request approved successfully!");
                setShowUserApproveModal(false);
                setSelectedUserWithdrawalRequest(null);
                loadPaymentData();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to approve withdrawal request");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to approve withdrawal request");
        }
    };

    const handleRejectUserWithdrawal = async () => {
        if (!selectedUserWithdrawalRequest || !userRejectionReason.trim()) {
            toast.showError("Please provide a rejection reason");
            return;
        }
        const loadingToast = toast.showLoading("Rejecting withdrawal request...");
        try {
            const response = await rejectUserWithdrawalRequest(
                selectedUserWithdrawalRequest.userId,
                selectedUserWithdrawalRequest._id,
                { rejectionReason: userRejectionReason }
            );
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Withdrawal request rejected successfully!");
                setShowUserRejectModal(false);
                setSelectedUserWithdrawalRequest(null);
                setUserRejectionReason("");
                loadPaymentData();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to reject withdrawal request");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to reject withdrawal request");
        }
    };

    const handleProcessUserWithdrawal = () => {
        if (!selectedUserWithdrawalRequest) return;
        setTransactionModalType("user");
        setShowTransactionModal(true);
    };

    const handleProcessUserWithdrawalSubmit = async (transactionData) => {
        if (!selectedUserWithdrawalRequest) return;

        setProcessingWithdrawal(true);
        const loadingToast = toast.showLoading("Processing withdrawal payment...");
        
        try {
            const response = await processUserWithdrawalRequest(selectedUserWithdrawalRequest._id, {
                transactionId: transactionData.transactionId,
                paymentMethod: transactionData.paymentMethod,
                paymentDate: transactionData.paymentDate,
                notes: transactionData.notes || "",
            });

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("User withdrawal payment processed successfully!");
                setShowTransactionModal(false);
                setSelectedUserWithdrawalRequest(null);
                setTransactionModalType(null);
                setProcessingWithdrawal(false);
                loadPaymentData();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to process withdrawal");
                setProcessingWithdrawal(false);
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to process withdrawal payment");
            setProcessingWithdrawal(false);
        }
    };

    const handleProcessFinalSettlement = async () => {
        if (!selectedFinalSettlementBooking) return;

        const rewardAmount = parseFloat(finalSettlementRewardAmount) || 0;
        const penaltyAmount = parseFloat(finalSettlementPenaltyAmount) || 0;

        if (rewardAmount <= 0 && penaltyAmount <= 0) {
            toast.showError("Please enter a reward or penalty amount");
            return;
        }

        if (rewardAmount > 0 && penaltyAmount > 0) {
            toast.showError("Cannot set both reward and penalty for the same booking");
            return;
        }

        const borewellStatus = selectedFinalSettlementBooking.borewellResult?.status;
        if (borewellStatus === "SUCCESS" && penaltyAmount > 0) {
            toast.showError("Cannot apply penalty for successful borewell result");
            return;
        }

        if (borewellStatus === "FAILED" && rewardAmount > 0) {
            toast.showError("Cannot apply reward for failed borewell result");
            return;
        }

        setProcessingFinalSettlement(true);
        const loadingToast = toast.showLoading("Processing final settlement...");
        try {
            const response = await processNewFinalSettlement(selectedFinalSettlementBooking._id, {
                rewardAmount,
                penaltyAmount,
                notes: finalSettlementNotes
            });

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess(
                    response.message || `Final settlement processed successfully. ${
                        rewardAmount > 0 
                            ? `Reward of ₹${rewardAmount.toLocaleString('en-IN')} credited to vendor wallet.`
                            : `Penalty of ₹${penaltyAmount.toLocaleString('en-IN')} deducted from vendor wallet.`
                    }`
                );
                setShowFinalSettlementModal(false);
                setSelectedFinalSettlementBooking(null);
                setFinalSettlementRewardAmount("");
                setFinalSettlementPenaltyAmount("");
                setFinalSettlementNotes("");
                setProcessingFinalSettlement(false);
                loadPaymentData();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to process final settlement");
                setProcessingFinalSettlement(false);
            }
        } catch (err) {
            console.error("Process final settlement error:", err);
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to process final settlement");
            setProcessingFinalSettlement(false);
        }
    };

    const handleProcessUserFinalSettlement = async () => {
        if (!selectedUserFinalSettlementBooking) return;

        const borewellStatus = selectedUserFinalSettlementBooking.borewellResult?.status;

        if (borewellStatus === "SUCCESS") {
            // Just mark as complete, no payment
            setProcessingUserFinalSettlement(true);
            const loadingToast = toast.showLoading("Completing final settlement...");
            try {
                const response = await processUserFinalSettlement(selectedUserFinalSettlementBooking._id, {
                    remittanceAmount: 0,
                    notes: userFinalSettlementNotes
                });

                if (response.success) {
                    toast.dismissToast(loadingToast);
                    toast.showSuccess("Final settlement completed successfully!");
                    setShowUserFinalSettlementModal(false);
                    setSelectedUserFinalSettlementBooking(null);
                    setUserFinalSettlementRemittanceAmount("");
                    setUserFinalSettlementNotes("");
                    setProcessingUserFinalSettlement(false);
                    loadPaymentData();
                } else {
                    toast.dismissToast(loadingToast);
                    toast.showError(response.message || "Failed to complete final settlement");
                    setProcessingUserFinalSettlement(false);
                }
            } catch (err) {
                console.error("Process user final settlement error:", err);
                toast.dismissToast(loadingToast);
                handleApiError(err, "Failed to complete final settlement");
                setProcessingUserFinalSettlement(false);
            }
        } else {
            // FAILED: Process remittance
            const remittanceAmount = parseFloat(userFinalSettlementRemittanceAmount) || 0;

            if (remittanceAmount <= 0) {
                toast.showError("Please enter a remittance amount");
                return;
            }

            setProcessingUserFinalSettlement(true);
            const loadingToast = toast.showLoading("Processing remittance...");
            try {
                const response = await processUserFinalSettlement(selectedUserFinalSettlementBooking._id, {
                    remittanceAmount,
                    notes: userFinalSettlementNotes
                });

                if (response.success) {
                    toast.dismissToast(loadingToast);
                    toast.showSuccess(
                        response.message || `Remittance of ₹${remittanceAmount.toLocaleString('en-IN')} credited to user wallet successfully.`
                    );
                    setShowUserFinalSettlementModal(false);
                    setSelectedUserFinalSettlementBooking(null);
                    setUserFinalSettlementRemittanceAmount("");
                    setUserFinalSettlementNotes("");
                    setProcessingUserFinalSettlement(false);
                    loadPaymentData();
                } else {
                    toast.dismissToast(loadingToast);
                    toast.showError(response.message || "Failed to process remittance");
                    setProcessingUserFinalSettlement(false);
                }
            } catch (err) {
                console.error("Process user final settlement error:", err);
                toast.dismissToast(loadingToast);
                handleApiError(err, "Failed to process remittance");
                setProcessingUserFinalSettlement(false);
            }
        }
    };

    const handleApproveVendorWithdrawal = async () => {
        if (!selectedWithdrawalRequest) return;
        const loadingToast = toast.showLoading("Approving withdrawal request...");
        try {
            const response = await approveWithdrawalRequest(
                selectedWithdrawalRequest.vendorId,
                selectedWithdrawalRequest._id
            );
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Withdrawal request approved successfully!");
                setShowVendorApproveModal(false);
                setSelectedWithdrawalRequest(null);
                loadPaymentData();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to approve withdrawal request");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to approve withdrawal request");
        }
    };

    const handleRejectVendorWithdrawal = async () => {
        if (!selectedWithdrawalRequest || !vendorRejectionReason.trim()) {
            toast.showError("Please provide a rejection reason");
            return;
        }
        const loadingToast = toast.showLoading("Rejecting withdrawal request...");
        try {
            const response = await rejectWithdrawalRequest(
                selectedWithdrawalRequest.vendorId,
                selectedWithdrawalRequest._id,
                vendorRejectionReason
            );
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Withdrawal request rejected successfully!");
                setShowVendorRejectModal(false);
                setVendorRejectionReason("");
                setSelectedWithdrawalRequest(null);
                loadPaymentData();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to reject withdrawal request");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to reject withdrawal request");
        }
    };

    const handlePayVendorWithdrawal = (request) => {
        if (!request || !request.vendorId || !request._id) return;
        setSelectedWithdrawalRequest(request);
        setTransactionModalType("vendor");
        setShowTransactionModal(true);
    };

    const handleProcessVendorWithdrawal = async (transactionData) => {
        if (!selectedWithdrawalRequest) return;

        setProcessingWithdrawal(true);
        const loadingToast = toast.showLoading("Processing withdrawal payment...");
        
        try {
            const response = await processWithdrawal(
                selectedWithdrawalRequest.vendorId,
                selectedWithdrawalRequest._id,
                transactionData.transactionId,
                transactionData.notes || "",
                transactionData.paymentMethod,
                transactionData.paymentDate
            );

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Vendor withdrawal payment processed successfully!");
                setShowTransactionModal(false);
                setSelectedWithdrawalRequest(null);
                setTransactionModalType(null);
                setProcessingWithdrawal(false);
                loadPaymentData();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to process withdrawal");
                setProcessingWithdrawal(false);
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to process withdrawal payment");
            setProcessingWithdrawal(false);
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

    if (loading && (activeTab === "overview" || activeTab === "admin-overview")) {
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

            {/* Tabs - Different tabs based on route */}
            <div className="mb-6">
                <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
                    {/* Main route tabs - Show when not on user/vendor specific routes */}
                    {showMainTabs && (
                        <>
                            <button
                                onClick={() => {
                                    setActiveTab("overview");
                                    navigate("/admin/payments");
                                }}
                                className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === "overview"
                                    ? `border-[${currentTheme.primary}] text-[${currentTheme.primary}]`
                                    : "border-transparent text-gray-600 hover:text-gray-800"
                                    }`}
                                style={activeTab === "overview" ? { borderColor: currentTheme.primary, color: currentTheme.primary } : {}}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab("admin-overview");
                                    navigate("/admin/payments/admin");
                                }}
                                className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === "admin-overview"
                                    ? "border-indigo-500 text-indigo-600"
                                    : "border-transparent text-gray-600 hover:text-gray-800"
                                    }`}
                            >
                                Admin Overview
                            </button>
                        </>
                    )}
                    
                    {/* User route tabs */}
                    {isUserRoute && (
                        <>
                            <button
                                onClick={() => setActiveTab("user-overview")}
                                className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === "user-overview"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-600 hover:text-gray-800"
                                    }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab("user-withdrawals")}
                                className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === "user-withdrawals"
                                    ? "border-teal-500 text-teal-600"
                                    : "border-transparent text-gray-600 hover:text-gray-800"
                                    }`}
                            >
                                Withdrawal Requests
                            </button>
                            <button
                                onClick={() => setActiveTab("user-final-settlement")}
                                className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === "user-final-settlement"
                                    ? "border-purple-500 text-purple-600"
                                    : "border-transparent text-gray-600 hover:text-gray-800"
                                    }`}
                            >
                                Final Settlement
                            </button>
                        </>
                    )}
                    
                    {/* Vendor route tabs */}
                    {isVendorRoute && (
                        <>
                            <button
                                onClick={() => setActiveTab("vendor-overview")}
                                className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === "vendor-overview"
                                    ? "border-orange-500 text-orange-600"
                                    : "border-transparent text-gray-600 hover:text-gray-800"
                                    }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab("vendor-withdrawals")}
                                className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === "vendor-withdrawals"
                                    ? "border-teal-500 text-teal-600"
                                    : "border-transparent text-gray-600 hover:text-gray-800"
                                    }`}
                            >
                                Withdrawal Requests
                                {vendorWithdrawalRequests.filter(r => r.status === "PENDING").length > 0 && (
                                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                        {vendorWithdrawalRequests.filter(r => r.status === "PENDING").length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab("vendor-final-settlement")}
                                className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === "vendor-final-settlement"
                                    ? "border-purple-500 text-purple-600"
                                    : "border-transparent text-gray-600 hover:text-gray-800"
                                    }`}
                            >
                                Final Settlement
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Admin Overview Tab */}
            {activeTab === "admin-overview" && (
                <div>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : adminOverview ? (
                        <>
                            {/* Main Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {/* Total Money from Users */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-lg border border-blue-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center">
                                            <IoWalletOutline className="text-2xl text-white" />
                                        </div>
                                        <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-3 py-1 rounded-full">Total from Users</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 mb-2">{formatCurrency(adminOverview.totalFromUsers.amount)}</p>
                                    <div className="flex gap-4 text-sm text-gray-600">
                                        <span>Advance: {formatCurrency(adminOverview.totalFromUsers.breakdown.advance.amount)}</span>
                                        <span>Remaining: {formatCurrency(adminOverview.totalFromUsers.breakdown.remaining.amount)}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">{adminOverview.totalFromUsers.count} payments</p>
                                </div>

                                {/* Pending from Users */}
                                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 shadow-lg border border-yellow-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-14 h-14 rounded-xl bg-yellow-500 flex items-center justify-center">
                                            <IoTimeOutline className="text-2xl text-white" />
                                        </div>
                                        <span className="text-xs font-semibold text-yellow-700 bg-yellow-200 px-3 py-1 rounded-full">Pending from Users</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 mb-2">{formatCurrency(adminOverview.pendingFromUsers.amount)}</p>
                                    <p className="text-xs text-gray-500">{adminOverview.pendingFromUsers.count} pending payments</p>
                                </div>

                                {/* Total Admin Revenue */}
                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-lg border border-green-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-14 h-14 rounded-xl bg-green-500 flex items-center justify-center">
                                            <IoCashOutline className="text-2xl text-white" />
                                        </div>
                                        <span className="text-xs font-semibold text-green-700 bg-green-200 px-3 py-1 rounded-full">Admin Revenue</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 mb-2">{formatCurrency(adminOverview.totalAdminRevenue.amount)}</p>
                                    <p className="text-xs text-gray-500">Net profit after all expenses</p>
                                </div>

                                {/* Pending to Vendors */}
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 shadow-lg border border-orange-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-14 h-14 rounded-xl bg-orange-500 flex items-center justify-center">
                                            <IoTimeOutline className="text-2xl text-white" />
                                        </div>
                                        <span className="text-xs font-semibold text-orange-700 bg-orange-200 px-3 py-1 rounded-full">Pending to Vendors</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 mb-2">{formatCurrency(adminOverview.pendingToVendors.amount)}</p>
                                    <div className="flex gap-4 text-sm text-gray-600 mt-2">
                                        <span>Settlements: {formatCurrency(adminOverview.pendingToVendors.breakdown.settlements.amount)}</span>
                                        <span>Withdrawals: {formatCurrency(adminOverview.pendingToVendors.breakdown.withdrawals.amount)}</span>
                                    </div>
                                </div>

                                {/* Released to Vendors */}
                                <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 shadow-lg border border-teal-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-14 h-14 rounded-xl bg-teal-500 flex items-center justify-center">
                                            <IoCheckmarkCircleOutline className="text-2xl text-white" />
                                        </div>
                                        <span className="text-xs font-semibold text-teal-700 bg-teal-200 px-3 py-1 rounded-full">Released to Vendors</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 mb-2">{formatCurrency(adminOverview.releasedToVendors.amount)}</p>
                                    <p className="text-xs text-gray-500">{adminOverview.releasedToVendors.count} withdrawals processed</p>
                                </div>

                                {/* Paid to Users for Failure */}
                                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 shadow-lg border border-red-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-14 h-14 rounded-xl bg-red-500 flex items-center justify-center">
                                            <IoReceiptOutline className="text-2xl text-white" />
                                        </div>
                                        <span className="text-xs font-semibold text-red-700 bg-red-200 px-3 py-1 rounded-full">Paid to Users (Failure)</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 mb-2">{formatCurrency(adminOverview.paidToUsersForFailure.amount)}</p>
                                    <div className="flex gap-4 text-sm text-gray-600 mt-2">
                                        <span>Refunds: {formatCurrency(adminOverview.paidToUsersForFailure.breakdown.refunds)}</span>
                                        <span>Remittances: {formatCurrency(adminOverview.paidToUsersForFailure.breakdown.remittances)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Breakdown */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Total Paid to Vendors Breakdown */}
                                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <IoCashOutline className="text-orange-500" />
                                        Total Paid to Vendors
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-gray-600">Total Amount</span>
                                            <span className="text-xl font-bold text-gray-800">{formatCurrency(adminOverview.totalPaidToVendors.amount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-gray-600">Wallet Credits</span>
                                            <span className="text-gray-800">{formatCurrency(adminOverview.totalPaidToVendors.breakdown.walletCredits)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-gray-600">Settlements</span>
                                            <span className="text-gray-800">{formatCurrency(adminOverview.totalPaidToVendors.breakdown.settlements)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-gray-600">Withdrawals</span>
                                            <span className="text-gray-800">{formatCurrency(adminOverview.totalPaidToVendors.breakdown.withdrawals)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Revenue Calculation */}
                                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <IoReceiptOutline className="text-green-500" />
                                        Revenue Calculation
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-gray-600">Total from Users</span>
                                            <span className="text-gray-800 font-semibold">{formatCurrency(adminOverview.totalAdminRevenue.calculation.totalFromUsers)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-gray-600">- Total Paid to Vendors</span>
                                            <span className="text-red-600">-{formatCurrency(adminOverview.totalAdminRevenue.calculation.totalPaidToVendors)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-gray-600">- Paid to Users (Failure)</span>
                                            <span className="text-red-600">-{formatCurrency(adminOverview.totalAdminRevenue.calculation.paidToUsersForFailure)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 pt-3 border-t-2 border-gray-300">
                                            <span className="text-lg font-bold text-gray-800">Net Revenue</span>
                                            <span className="text-2xl font-bold text-green-600">{formatCurrency(adminOverview.totalAdminRevenue.amount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No data available</p>
                        </div>
                    )}
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Vendor Withdrawals Tab */}
            {activeTab === "vendor-withdrawals" && (
                <div>
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading vendor withdrawal requests...</p>
                        </div>
                    ) : vendorWithdrawalRequests.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
                            <IoWalletOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 font-semibold">No vendor withdrawal requests</p>
                            <p className="text-sm text-gray-500 mt-2">No withdrawal requests found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {vendorWithdrawalRequests
                                .filter(req => req.status === "PENDING" || req.status === "APPROVED")
                                .map((request) => (
                                    <div
                                        key={request._id}
                                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center">
                                                        <IoWalletOutline className="text-2xl text-teal-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-800">
                                                            {request.vendorName || "Vendor"}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            {request.vendorEmail} | {request.vendorPhone}
                                                        </p>
                                                    </div>
                                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                                        {request.status}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Withdrawal Amount</p>
                                                        <p className="text-2xl font-bold text-gray-800">
                                                            {formatCurrency(request.amount)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Requested At</p>
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            {formatDate(request.requestedAt)}
                                                        </p>
                                                    </div>
                                                    {request.bankDetails && (
                                                        <>
                                                            <div>
                                                                <p className="text-xs text-gray-500 mb-1">Bank Account</p>
                                                                <p className="text-sm font-semibold text-gray-700">
                                                                    {request.bankDetails.accountNumber?.slice(-4) ? `****${request.bankDetails.accountNumber.slice(-4)}` : "N/A"}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500 mb-1">IFSC Code</p>
                                                                <p className="text-sm font-semibold text-gray-700">
                                                                    {request.bankDetails.ifscCode || "N/A"}
                                                                </p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {request.status === "PENDING" && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedWithdrawalRequest(request);
                                                                setShowVendorApproveModal(true);
                                                            }}
                                                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm whitespace-nowrap shadow-md"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedWithdrawalRequest(request);
                                                                setVendorRejectionReason("");
                                                                setShowVendorRejectModal(true);
                                                            }}
                                                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm whitespace-nowrap shadow-md"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {request.status === "APPROVED" && (
                                                    <button
                                                        onClick={() => handlePayVendorWithdrawal(request)}
                                                        disabled={processingWithdrawal}
                                                        className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold text-sm whitespace-nowrap shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {processingWithdrawal ? "Processing..." : "Pay"}
                                                    </button>
                                                )}
                                                {request.status === "PROCESSED" && (
                                                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold text-center">
                                                        Processed
                                                    </span>
                                                )}
                                                {request.status === "REJECTED" && (
                                                    <div className="flex flex-col gap-2">
                                                        <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold text-center">
                                                            Rejected
                                                        </span>
                                                        {request.rejectionReason && (
                                                            <p className="text-xs text-gray-600 mt-1">
                                                                Reason: {request.rejectionReason}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            )}

            {/* Final Settlement Tab */}
            {activeTab === "vendor-final-settlement" && (
                <div>
                    {/* Sub-tabs for Pending and Completed */}
                    <div className="flex gap-2 mb-6 border-b border-gray-200">
                        <button
                            onClick={() => setFinalSettlementSubTab("pending")}
                            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
                                finalSettlementSubTab === "pending"
                                    ? "border-purple-500 text-purple-600"
                                    : "border-transparent text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            Pending
                            {pendingFinalSettlements.length > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                    {pendingFinalSettlements.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setFinalSettlementSubTab("completed")}
                            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
                                finalSettlementSubTab === "completed"
                                    ? "border-purple-500 text-purple-600"
                                    : "border-transparent text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            Completed
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading final settlements...</p>
                        </div>
                    ) : finalSettlementSubTab === "pending" ? (
                        pendingFinalSettlements.length === 0 ? (
                            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
                                <IoCheckmarkCircleOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 font-semibold">No Pending Final Settlements</p>
                                <p className="text-sm text-gray-500 mt-2">All bookings with borewell results have been settled</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingFinalSettlements.map((booking) => (
                                    <div
                                        key={booking._id}
                                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                                        booking.borewellResult?.status === "SUCCESS"
                                                            ? "bg-green-100"
                                                            : "bg-red-100"
                                                    }`}>
                                                        {booking.borewellResult?.status === "SUCCESS" ? (
                                                            <IoCheckmarkCircleOutline className="text-2xl text-green-600" />
                                                        ) : (
                                                            <IoCloseCircleOutline className="text-2xl text-red-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-800">
                                                            Booking #{booking._id.toString().slice(-6)}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            {booking.user?.name} | {booking.vendor?.name}
                                                        </p>
                                                    </div>
                                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                                                        PENDING
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Borewell Result</p>
                                                        <p className={`text-sm font-semibold ${
                                                            booking.borewellResult?.status === "SUCCESS"
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                        }`}>
                                                            {booking.borewellResult?.status || "UNKNOWN"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Service Charges</p>
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            {formatCurrency(booking.payment?.baseServiceFee || 0)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Travel Charges</p>
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            {formatCurrency(booking.payment?.travelCharges || 0)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Borewell Uploaded</p>
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            {booking.borewellUploadedAt ? formatDate(booking.borewellUploadedAt) : "N/A"}
                                                        </p>
                                                    </div>
                                                </div>
                                                {booking.borewellResult?.notes && (
                                                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-xs text-gray-500 mb-1">Borewell Notes</p>
                                                        <p className="text-sm text-gray-700">{booking.borewellResult.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedFinalSettlementBooking(booking);
                                                        setFinalSettlementRewardAmount("");
                                                        setFinalSettlementPenaltyAmount("");
                                                        setFinalSettlementNotes("");
                                                        setShowFinalSettlementModal(true);
                                                    }}
                                                    className={`px-6 py-3 rounded-lg transition-colors font-semibold text-sm whitespace-nowrap shadow-md ${
                                                        booking.borewellResult?.status === "SUCCESS"
                                                            ? "bg-green-600 text-white hover:bg-green-700"
                                                            : "bg-red-600 text-white hover:bg-red-700"
                                                    }`}
                                                >
                                                    {booking.borewellResult?.status === "SUCCESS" ? "Add Reward" : "Add Penalty"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        completedFinalSettlements.length === 0 ? (
                            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
                                <IoReceiptOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 font-semibold">No Completed Final Settlements</p>
                                <p className="text-sm text-gray-500 mt-2">No final settlements have been processed yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {completedFinalSettlements.map((booking) => (
                                    <div
                                        key={booking._id}
                                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                                        booking.finalSettlement?.borewellResult === "SUCCESS"
                                                            ? "bg-green-100"
                                                            : "bg-red-100"
                                                    }`}>
                                                        {booking.finalSettlement?.borewellResult === "SUCCESS" ? (
                                                            <IoCheckmarkCircleOutline className="text-2xl text-green-600" />
                                                        ) : (
                                                            <IoCloseCircleOutline className="text-2xl text-red-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-800">
                                                            Booking #{booking._id.toString().slice(-6)}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            {booking.user?.name} | {booking.vendor?.name}
                                                        </p>
                                                    </div>
                                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                                        COMPLETE
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">
                                                            {booking.finalSettlement?.rewardAmount > 0 ? "Reward Paid" : booking.finalSettlement?.penaltyAmount > 0 ? "Penalty Deducted" : "N/A"}
                                                        </p>
                                                        <p className={`text-lg font-bold ${
                                                            booking.finalSettlement?.rewardAmount > 0
                                                                ? "text-green-600"
                                                                : booking.finalSettlement?.penaltyAmount > 0
                                                                ? "text-red-600"
                                                                : "text-gray-600"
                                                        }`}>
                                                            {formatCurrency(
                                                                booking.finalSettlement?.rewardAmount > 0 
                                                                    ? booking.finalSettlement.rewardAmount 
                                                                    : booking.finalSettlement?.penaltyAmount > 0 
                                                                    ? booking.finalSettlement.penaltyAmount 
                                                                    : 0
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Borewell Result</p>
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            {booking.finalSettlement?.borewellResult || "N/A"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Processed At</p>
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            {booking.finalSettlement?.processedAt ? formatDate(booking.finalSettlement.processedAt) : "N/A"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Processed By</p>
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            {booking.finalSettlement?.processedBy?.name || "Admin"}
                                                        </p>
                                                    </div>
                                                </div>
                                                {booking.finalSettlement?.notes && (
                                                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-xs text-gray-500 mb-1">Notes</p>
                                                        <p className="text-sm text-gray-700">{booking.finalSettlement.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}

            {/* User Overview Tab */}
            {activeTab === "user-overview" && (
                <div>
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
                                    <IoArrowDownOutline className="text-2xl text-purple-600" />
                                </div>
                                <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded-full">Advance</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-800 mb-1">{userStats.advancePayments}</p>
                            <p className="text-xs text-gray-600">Advance payments</p>
                        </div>

                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                                    <IoArrowUpOutline className="text-2xl text-orange-600" />
                                </div>
                                <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-1 rounded-full">Remaining</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-800 mb-1">{userStats.remainingPayments}</p>
                            <p className="text-xs text-gray-600">Remaining payments</p>
                        </div>
                    </div>

                    {/* Refunds Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                    <IoArrowUpOutline className="text-2xl text-red-600" />
                                </div>
                                <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded-full">Total Refunds</span>
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

                    {/* Pending Refunds Alert */}
                    {pendingUserRefunds.length > 0 && (
                        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 mb-6 border border-orange-200">
                            <div className="flex items-center justify-between">
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
                        </div>
                    )}
                </div>
            )}

            {/* User Withdrawal Requests Tab */}
            {activeTab === "user-withdrawals" && (
                <div>
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading user withdrawal requests...</p>
                        </div>
                    ) : userWithdrawalRequests.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
                            <IoWalletOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 font-semibold">No user withdrawal requests</p>
                            <p className="text-sm text-gray-500 mt-2">No withdrawal requests found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {userWithdrawalRequests
                                .filter(req => req.status === "PENDING" || req.status === "APPROVED" || req.status === "PROCESSED" || req.status === "REJECTED")
                                .map((request) => (
                                    <div
                                        key={request._id}
                                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                                        <IoWalletOutline className="text-2xl text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-800">
                                                            {request.userName || "User"}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            {request.userEmail} | {request.userPhone}
                                                        </p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        request.status === "APPROVED" ? "bg-blue-100 text-blue-700" :
                                                        request.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                                                        "bg-gray-100 text-gray-700"
                                                    }`}>
                                                        {request.status}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Request ID</p>
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            {request._id.toString().slice(-8)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Amount</p>
                                                        <p className="text-lg font-bold text-gray-800">
                                                            {formatCurrency(request.amount || 0)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Requested At</p>
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            {formatDate(request.requestedAt)}
                                                        </p>
                                                    </div>
                                                    {request.bankDetails && (
                                                        <>
                                                            <div>
                                                                <p className="text-xs text-gray-500 mb-1">Bank Account</p>
                                                                <p className="text-sm font-semibold text-gray-700">
                                                                    {request.bankDetails.accountNumber?.slice(-4) ? `****${request.bankDetails.accountNumber.slice(-4)}` : "N/A"}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500 mb-1">IFSC Code</p>
                                                                <p className="text-sm font-semibold text-gray-700">
                                                                    {request.bankDetails.ifscCode || "N/A"}
                                                                </p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {request.status === "PENDING" && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUserWithdrawalRequest(request);
                                                                setShowUserApproveModal(true);
                                                            }}
                                                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm whitespace-nowrap shadow-md"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUserWithdrawalRequest(request);
                                                                setUserRejectionReason("");
                                                                setShowUserRejectModal(true);
                                                            }}
                                                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm whitespace-nowrap shadow-md"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {request.status === "APPROVED" && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUserWithdrawalRequest(request);
                                                            handleProcessUserWithdrawal();
                                                        }}
                                                        disabled={processingWithdrawal}
                                                        className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold text-sm whitespace-nowrap shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {processingWithdrawal ? "Processing..." : "Pay"}
                                                    </button>
                                                )}
                                                {request.status === "PROCESSED" && (
                                                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold text-center">
                                                        Processed
                                                    </span>
                                                )}
                                                {request.status === "REJECTED" && (
                                                    <div className="flex flex-col gap-2">
                                                        <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold text-center">
                                                            Rejected
                                                        </span>
                                                        {request.rejectionReason && (
                                                            <p className="text-xs text-gray-600 mt-1">
                                                                Reason: {request.rejectionReason}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            )}

            {/* User Final Settlement Tab */}
            {activeTab === "user-final-settlement" && (
                <div>
                    {/* Sub-tabs for Pending and Completed */}
                    <div className="flex gap-2 mb-6 border-b border-gray-200">
                        <button
                            onClick={() => setUserFinalSettlementSubTab("pending")}
                            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
                                userFinalSettlementSubTab === "pending"
                                    ? "border-purple-500 text-purple-600"
                                    : "border-transparent text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            Pending
                            {pendingUserFinalSettlements.length > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                    {pendingUserFinalSettlements.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setUserFinalSettlementSubTab("completed")}
                            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
                                userFinalSettlementSubTab === "completed"
                                    ? "border-purple-500 text-purple-600"
                                    : "border-transparent text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            Completed
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading final settlements...</p>
                        </div>
                    ) : userFinalSettlementSubTab === "pending" ? (
                        pendingUserFinalSettlements.length === 0 ? (
                            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
                                <IoCheckmarkCircleOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 font-semibold">No Pending Final Settlements</p>
                                <p className="text-sm text-gray-500 mt-2">All bookings with borewell results have been settled</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingUserFinalSettlements.map((booking) => (
                                    <div
                                        key={booking._id}
                                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                                        booking.borewellResult?.status === "SUCCESS"
                                                            ? "bg-green-100"
                                                            : "bg-red-100"
                                                    }`}>
                                                        {booking.borewellResult?.status === "SUCCESS" ? (
                                                            <IoCheckmarkCircleOutline className="text-2xl text-green-600" />
                                                        ) : (
                                                            <IoCloseCircleOutline className="text-2xl text-red-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-800">
                                                            Booking #{booking._id.toString().slice(-6)}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            {booking.user?.name} | {booking.vendor?.name}
                                                        </p>
                                                    </div>
                                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                                                        PENDING
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Borewell Result</p>
                                                        <p className={`text-sm font-semibold ${
                                                            booking.borewellResult?.status === "SUCCESS"
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                        }`}>
                                                            {booking.borewellResult?.status || "UNKNOWN"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Total Paid</p>
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            {formatCurrency(booking.payment?.totalAmount || 0)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Remaining Amount</p>
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            {formatCurrency(booking.payment?.remainingAmount || 0)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Borewell Uploaded</p>
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            {booking.borewellUploadedAt ? formatDate(booking.borewellUploadedAt) : "N/A"}
                                                        </p>
                                                    </div>
                                                </div>
                                                {booking.borewellResult?.notes && (
                                                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-xs text-gray-500 mb-1">Borewell Notes</p>
                                                        <p className="text-sm text-gray-700">{booking.borewellResult.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {/* Check both finalSettlement.borewellResult and borewellResult.status for old/new format */}
                                                {(booking.finalSettlement?.borewellResult === "SUCCESS" || booking.borewellResult?.status === "SUCCESS") ? (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUserFinalSettlementBooking(booking);
                                                            setUserFinalSettlementRemittanceAmount("");
                                                            setUserFinalSettlementNotes("");
                                                            setShowUserFinalSettlementModal(true);
                                                        }}
                                                        disabled={
                                                            booking.finalSettlement?.userSettlementProcessed || 
                                                            (booking.finalSettlement?.processedBy && booking.finalSettlement?.remittanceAmount !== undefined)
                                                        }
                                                        className={`px-6 py-3 rounded-lg transition-colors font-semibold text-sm whitespace-nowrap shadow-md ${
                                                            (booking.finalSettlement?.userSettlementProcessed || 
                                                            (booking.finalSettlement?.processedBy && booking.finalSettlement?.remittanceAmount !== undefined))
                                                                ? "bg-gray-400 text-white cursor-not-allowed"
                                                                : "bg-green-600 text-white hover:bg-green-700"
                                                        }`}
                                                    >
                                                        {(booking.finalSettlement?.userSettlementProcessed || 
                                                          (booking.finalSettlement?.processedBy && booking.finalSettlement?.remittanceAmount !== undefined)) 
                                                            ? "Completed" 
                                                            : "Complete Settlement"}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUserFinalSettlementBooking(booking);
                                                            setUserFinalSettlementRemittanceAmount("");
                                                            setUserFinalSettlementNotes("");
                                                            setShowUserFinalSettlementModal(true);
                                                        }}
                                                        disabled={
                                                            booking.finalSettlement?.userSettlementProcessed || 
                                                            (booking.finalSettlement?.processedBy && booking.finalSettlement?.remittanceAmount !== undefined)
                                                        }
                                                        className={`px-6 py-3 rounded-lg transition-colors font-semibold text-sm whitespace-nowrap shadow-md ${
                                                            (booking.finalSettlement?.userSettlementProcessed || 
                                                            (booking.finalSettlement?.processedBy && booking.finalSettlement?.remittanceAmount !== undefined))
                                                                ? "bg-gray-400 text-white cursor-not-allowed"
                                                                : "bg-red-600 text-white hover:bg-red-700"
                                                        }`}
                                                    >
                                                        {(booking.finalSettlement?.userSettlementProcessed || 
                                                          (booking.finalSettlement?.processedBy && booking.finalSettlement?.remittanceAmount !== undefined)) 
                                                            ? "Completed" 
                                                            : "Pay Remittance"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        completedUserFinalSettlements.length === 0 ? (
                            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
                                <IoReceiptOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 font-semibold">No Completed Final Settlements</p>
                                <p className="text-sm text-gray-500 mt-2">No final settlements have been processed yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {completedUserFinalSettlements.map((booking) => (
                                    <div
                                        key={booking._id}
                                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                                        booking.finalSettlement?.borewellResult === "SUCCESS"
                                                            ? "bg-green-100"
                                                            : "bg-red-100"
                                                    }`}>
                                                        {booking.finalSettlement?.borewellResult === "SUCCESS" ? (
                                                            <IoCheckmarkCircleOutline className="text-2xl text-green-600" />
                                                        ) : (
                                                            <IoCloseCircleOutline className="text-2xl text-red-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-800">
                                                            Booking #{booking._id.toString().slice(-6)}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            {booking.user?.name} | {booking.vendor?.name}
                                                        </p>
                                                    </div>
                                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                                        COMPLETE
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                    {booking.finalSettlement?.remittanceAmount > 0 && (
                                                        <div>
                                                            <p className="text-xs text-gray-500 mb-1">Remittance Paid</p>
                                                            <p className="text-lg font-bold text-green-600">
                                                                {formatCurrency(booking.finalSettlement.remittanceAmount)}
                                                            </p>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Borewell Result</p>
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            {booking.finalSettlement?.borewellResult || "N/A"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Processed At</p>
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            {booking.finalSettlement?.processedAt ? formatDate(booking.finalSettlement.processedAt) : "N/A"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Processed By</p>
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            {booking.finalSettlement?.processedBy?.name || "Admin"}
                                                        </p>
                                                    </div>
                                                </div>
                                                {booking.finalSettlement?.notes && (
                                                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-xs text-gray-500 mb-1">Notes</p>
                                                        <p className="text-sm text-gray-700">{booking.finalSettlement.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Vendor Overview Tab */}
            {activeTab === "vendor-overview" && (
                <div>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                        </div>
                    ) : vendorOverview ? (
                        <>
                            {/* Main Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                                            <IoReceiptOutline className="text-2xl text-orange-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-1 rounded-full">Total Payments</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 mb-1">{vendorOverview.totalPayments.count}</p>
                                    <p className="text-xs text-gray-600">Payments to vendors</p>
                                </div>

                                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                            <IoWalletOutline className="text-2xl text-green-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">Total Amount</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 mb-1">{formatCurrency(vendorOverview.totalPayments.amount)}</p>
                                    <p className="text-xs text-gray-600">All vendor payments</p>
                                </div>

                                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                            <IoCarOutline className="text-2xl text-blue-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full">Travel Charges</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 mb-1">{vendorOverview.travelCharges.count}</p>
                                    <p className="text-xs text-gray-600">{formatCurrency(vendorOverview.travelCharges.amount)} paid</p>
                                </div>

                                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                            <IoCashOutline className="text-2xl text-purple-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded-full">Total Vendors</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 mb-1">{vendorOverview.totalVendors}</p>
                                    <p className="text-xs text-gray-600">Active vendors</p>
                                </div>
                            </div>

                            {/* Payment Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                                            <IoCheckmarkCircleOutline className="text-2xl text-teal-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-full">Site Visit</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-800 mb-1">{vendorOverview.siteVisit.count}</p>
                                    <p className="text-sm text-gray-600">{formatCurrency(vendorOverview.siteVisit.amount)}</p>
                                </div>

                                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                                            <IoReceiptOutline className="text-2xl text-indigo-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full">Report Upload</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-800 mb-1">{vendorOverview.reportUpload.count}</p>
                                    <p className="text-sm text-gray-600">{formatCurrency(vendorOverview.reportUpload.amount)}</p>
                                </div>

                                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                            <IoArrowDownOutline className="text-2xl text-yellow-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">1st Installment</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-800 mb-1">{vendorOverview.firstInstallment.count}</p>
                                    <p className="text-sm text-gray-600">{formatCurrency(vendorOverview.firstInstallment.amount)}</p>
                                </div>

                                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                                            <IoArrowUpOutline className="text-2xl text-cyan-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-cyan-700 bg-cyan-50 px-2 py-1 rounded-full">2nd Installment</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-800 mb-1">{vendorOverview.secondInstallment.count}</p>
                                    <p className="text-sm text-gray-600">{formatCurrency(vendorOverview.secondInstallment.amount)}</p>
                                </div>

                                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                            <IoCheckmarkCircleOutline className="text-2xl text-green-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">Final Rewards</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-800 mb-1">{vendorOverview.finalSettlementRewards.count}</p>
                                    <p className="text-sm text-gray-600">{formatCurrency(vendorOverview.finalSettlementRewards.amount)}</p>
                                </div>

                                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                            <IoCloseCircleOutline className="text-2xl text-red-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded-full">Final Penalties</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-800 mb-1">{vendorOverview.finalSettlementPenalties.count}</p>
                                    <p className="text-sm text-gray-600">{formatCurrency(vendorOverview.finalSettlementPenalties.amount)}</p>
                                </div>
                            </div>

                            {/* Withdrawal Requests & Wallet Balance */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                                            <IoWalletOutline className="text-2xl text-teal-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-full">Total Wallet Balance</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 mb-1">{formatCurrency(vendorOverview.totalWalletBalance)}</p>
                                    <p className="text-xs text-gray-600">Across all vendors</p>
                                </div>

                                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                            <IoTimeOutline className="text-2xl text-yellow-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">Pending Withdrawals</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 mb-1">{vendorOverview.withdrawalRequests.pending.count}</p>
                                    <p className="text-xs text-gray-600">{formatCurrency(vendorOverview.withdrawalRequests.pending.amount)} pending</p>
                                </div>
                            </div>

                            {/* Withdrawal Requests Breakdown */}
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <IoWalletOutline className="text-orange-500" />
                                    Withdrawal Requests Summary
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Pending</p>
                                        <p className="text-xl font-bold text-yellow-600">{vendorOverview.withdrawalRequests.pending.count}</p>
                                        <p className="text-xs text-gray-600">{formatCurrency(vendorOverview.withdrawalRequests.pending.amount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Approved</p>
                                        <p className="text-xl font-bold text-blue-600">{vendorOverview.withdrawalRequests.approved.count}</p>
                                        <p className="text-xs text-gray-600">{formatCurrency(vendorOverview.withdrawalRequests.approved.amount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Processed</p>
                                        <p className="text-xl font-bold text-green-600">{vendorOverview.withdrawalRequests.processed.count}</p>
                                        <p className="text-xs text-gray-600">{formatCurrency(vendorOverview.withdrawalRequests.processed.amount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Rejected</p>
                                        <p className="text-xl font-bold text-red-600">{vendorOverview.withdrawalRequests.rejected.count}</p>
                                        <p className="text-xs text-gray-600">{formatCurrency(vendorOverview.withdrawalRequests.rejected.amount)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Withdrawals Alert */}
                            {vendorOverview.withdrawalRequests.approved.count > 0 && (
                                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 mb-6 border border-orange-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg">
                                                <IoTimeOutline className="text-3xl text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-800 mb-1">Pending Vendor Withdrawals</h2>
                                                <p className="text-gray-600">Approved withdrawal requests awaiting payment processing</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">Pending</p>
                                            <p className="text-2xl font-bold text-orange-700">{vendorOverview.withdrawalRequests.approved.count}</p>
                                            <p className="text-xs text-gray-500">request(s)</p>
                                            <p className="text-lg font-semibold text-orange-700 mt-1">{formatCurrency(vendorOverview.withdrawalRequests.approved.amount)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No data available</p>
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

        {/* Vendor Withdrawal Request Modals */}
        <ConfirmModal
            isOpen={showVendorApproveModal}
            onClose={() => {
                setShowVendorApproveModal(false);
                setSelectedWithdrawalRequest(null);
            }}
            onConfirm={handleApproveVendorWithdrawal}
            title="Approve Vendor Withdrawal Request"
            message={`Are you sure you want to approve the withdrawal request of ${formatCurrency(selectedWithdrawalRequest?.amount || 0)} for ${selectedWithdrawalRequest?.vendorName || "vendor"}?`}
            confirmText="Approve"
            cancelText="Cancel"
            confirmColor="success"
        />

        <InputModal
            isOpen={showVendorRejectModal}
            onClose={() => {
                setShowVendorRejectModal(false);
                setVendorRejectionReason("");
                setSelectedWithdrawalRequest(null);
            }}
            onConfirm={handleRejectVendorWithdrawal}
            title="Reject Vendor Withdrawal Request"
            message={`Are you sure you want to reject the withdrawal request of ${formatCurrency(selectedWithdrawalRequest?.amount || 0)}? Please provide a reason.`}
            confirmText="Reject"
            cancelText="Cancel"
            confirmColor="danger"
            inputValue={vendorRejectionReason}
            onInputChange={setVendorRejectionReason}
            inputPlaceholder="Enter rejection reason..."
            inputRequired={true}
        />

        {/* User Withdrawal Request Modals */}
        <ConfirmModal
            isOpen={showUserApproveModal}
            onClose={() => {
                setShowUserApproveModal(false);
                setSelectedUserWithdrawalRequest(null);
            }}
            onConfirm={handleApproveUserWithdrawal}
            title="Approve User Withdrawal Request"
            message={`Are you sure you want to approve the withdrawal request of ${formatCurrency(selectedUserWithdrawalRequest?.amount || 0)}?`}
            confirmText="Approve"
            cancelText="Cancel"
            confirmColor="success"
        />

        <InputModal
            isOpen={showUserRejectModal}
            onClose={() => {
                setShowUserRejectModal(false);
                setSelectedUserWithdrawalRequest(null);
                setUserRejectionReason("");
            }}
            onConfirm={handleRejectUserWithdrawal}
            title="Reject User Withdrawal Request"
            message="Please provide a reason for rejection:"
            confirmText="Reject"
            cancelText="Cancel"
            confirmColor="danger"
            inputValue={userRejectionReason}
            onInputChange={setUserRejectionReason}
            inputPlaceholder="Enter rejection reason..."
            inputRequired={true}
        />

        {/* Transaction Info Modal */}
        <TransactionInfoModal
            isOpen={showTransactionModal}
            onClose={() => {
                setShowTransactionModal(false);
                setTransactionModalType(null);
                if (transactionModalType === "user") {
                    setSelectedUserWithdrawalRequest(null);
                } else if (transactionModalType === "vendor") {
                    setSelectedWithdrawalRequest(null);
                }
            }}
            onSubmit={(transactionData) => {
                if (transactionModalType === "vendor") {
                    handleProcessVendorWithdrawal(transactionData);
                } else if (transactionModalType === "user") {
                    handleProcessUserWithdrawalSubmit(transactionData);
                }
            }}
            title={transactionModalType === "vendor" ? "Process Vendor Withdrawal" : "Process User Withdrawal"}
            amount={
                transactionModalType === "vendor"
                    ? selectedWithdrawalRequest?.amount
                    : selectedUserWithdrawalRequest?.amount
            }
            recipientName={
                transactionModalType === "vendor"
                    ? selectedWithdrawalRequest?.vendorName
                    : selectedUserWithdrawalRequest?.userName || selectedUserWithdrawalRequest?.userEmail
            }
            isLoading={processingWithdrawal}
        />

        {/* Final Settlement Modal */}
        {showFinalSettlementModal && selectedFinalSettlementBooking && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">
                                {selectedFinalSettlementBooking.borewellResult?.status === "SUCCESS" 
                                    ? "Add Reward" 
                                    : "Add Penalty"}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowFinalSettlementModal(false);
                                    setSelectedFinalSettlementBooking(null);
                                    setFinalSettlementRewardAmount("");
                                    setFinalSettlementPenaltyAmount("");
                                    setFinalSettlementNotes("");
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <IoCloseCircleOutline className="text-2xl" />
                            </button>
                        </div>

                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">Booking Details</p>
                            <p className="text-sm font-semibold text-gray-800">
                                Booking #{selectedFinalSettlementBooking._id.toString().slice(-6)}
                            </p>
                            <p className="text-sm text-gray-600">
                                Vendor: {selectedFinalSettlementBooking.vendor?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                                Borewell Result: <span className={`font-semibold ${
                                    selectedFinalSettlementBooking.borewellResult?.status === "SUCCESS"
                                        ? "text-green-600"
                                        : "text-red-600"
                                }`}>
                                    {selectedFinalSettlementBooking.borewellResult?.status}
                                </span>
                            </p>
                        </div>

                        {selectedFinalSettlementBooking.borewellResult?.status === "SUCCESS" ? (
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reward Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={finalSettlementRewardAmount}
                                    onChange={(e) => {
                                        setFinalSettlementRewardAmount(e.target.value);
                                        setFinalSettlementPenaltyAmount("");
                                    }}
                                    placeholder="Enter reward amount"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        ) : (
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Penalty Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={finalSettlementPenaltyAmount}
                                    onChange={(e) => {
                                        setFinalSettlementPenaltyAmount(e.target.value);
                                        setFinalSettlementRewardAmount("");
                                    }}
                                    placeholder="Enter penalty amount"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={finalSettlementNotes}
                                onChange={(e) => setFinalSettlementNotes(e.target.value)}
                                placeholder="Add any notes about this settlement..."
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowFinalSettlementModal(false);
                                    setSelectedFinalSettlementBooking(null);
                                    setFinalSettlementRewardAmount("");
                                    setFinalSettlementPenaltyAmount("");
                                    setFinalSettlementNotes("");
                                }}
                                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcessFinalSettlement}
                                disabled={processingFinalSettlement || (
                                    (finalSettlementRewardAmount === "" || parseFloat(finalSettlementRewardAmount) <= 0) &&
                                    (finalSettlementPenaltyAmount === "" || parseFloat(finalSettlementPenaltyAmount) <= 0)
                                )}
                                className={`flex-1 px-4 py-3 rounded-lg transition-colors font-semibold ${
                                    selectedFinalSettlementBooking.borewellResult?.status === "SUCCESS"
                                        ? "bg-green-600 text-white hover:bg-green-700"
                                        : "bg-red-600 text-white hover:bg-red-700"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {processingFinalSettlement ? "Processing..." : "Process Settlement"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* User Final Settlement Modal */}
        {showUserFinalSettlementModal && selectedUserFinalSettlementBooking && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">
                                {selectedUserFinalSettlementBooking.borewellResult?.status === "SUCCESS" 
                                    ? "Complete Settlement" 
                                    : "Pay Remittance"}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowUserFinalSettlementModal(false);
                                    setSelectedUserFinalSettlementBooking(null);
                                    setUserFinalSettlementRemittanceAmount("");
                                    setUserFinalSettlementNotes("");
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <IoCloseCircleOutline className="text-2xl" />
                            </button>
                        </div>

                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">Booking Details</p>
                            <p className="text-sm font-semibold text-gray-800">
                                Booking #{selectedUserFinalSettlementBooking._id.toString().slice(-6)}
                            </p>
                            <p className="text-sm text-gray-600">
                                User: {selectedUserFinalSettlementBooking.user?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                                Borewell Result: <span className={`font-semibold ${
                                    selectedUserFinalSettlementBooking.borewellResult?.status === "SUCCESS"
                                        ? "text-green-600"
                                        : "text-red-600"
                                }`}>
                                    {selectedUserFinalSettlementBooking.borewellResult?.status}
                                </span>
                            </p>
                            {selectedUserFinalSettlementBooking.borewellResult?.status === "FAILED" && (
                                <p className="text-sm text-gray-600 mt-2">
                                    Remaining Amount: <span className="font-semibold">{formatCurrency(selectedUserFinalSettlementBooking.payment?.remainingAmount || 0)}</span>
                                </p>
                            )}
                        </div>

                        {selectedUserFinalSettlementBooking.borewellResult?.status === "FAILED" ? (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Remittance Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={userFinalSettlementRemittanceAmount}
                                        onChange={(e) => setUserFinalSettlementRemittanceAmount(e.target.value)}
                                        placeholder="Enter remittance amount"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Max: {formatCurrency(selectedUserFinalSettlementBooking.payment?.remainingAmount || 0)}
                                    </p>
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={userFinalSettlementNotes}
                                        onChange={(e) => setUserFinalSettlementNotes(e.target.value)}
                                        placeholder="Add any notes about this remittance..."
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={userFinalSettlementNotes}
                                    onChange={(e) => setUserFinalSettlementNotes(e.target.value)}
                                    placeholder="Add any notes about this settlement..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowUserFinalSettlementModal(false);
                                    setSelectedUserFinalSettlementBooking(null);
                                    setUserFinalSettlementRemittanceAmount("");
                                    setUserFinalSettlementNotes("");
                                }}
                                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcessUserFinalSettlement}
                                disabled={
                                    processingUserFinalSettlement || 
                                    selectedUserFinalSettlementBooking.finalSettlement?.userSettlementProcessed ||
                                    (
                                        selectedUserFinalSettlementBooking.borewellResult?.status === "FAILED" &&
                                        (userFinalSettlementRemittanceAmount === "" || parseFloat(userFinalSettlementRemittanceAmount) <= 0)
                                    )
                                }
                                className={`flex-1 px-4 py-3 rounded-lg transition-colors font-semibold ${
                                    selectedUserFinalSettlementBooking.finalSettlement?.userSettlementProcessed
                                        ? "bg-gray-400 text-white cursor-not-allowed"
                                        : selectedUserFinalSettlementBooking.borewellResult?.status === "SUCCESS"
                                        ? "bg-green-600 text-white hover:bg-green-700"
                                        : "bg-red-600 text-white hover:bg-red-700"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {processingUserFinalSettlement 
                                    ? "Processing..." 
                                    : selectedUserFinalSettlementBooking.finalSettlement?.userSettlementProcessed
                                    ? "Already Completed"
                                    : selectedUserFinalSettlementBooking.borewellResult?.status === "SUCCESS" 
                                    ? "Complete Settlement" 
                                    : "Pay Remittance"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>);
}

