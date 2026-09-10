import { useState, useEffect } from "react";
import { getUserWalletBalance, getUserWalletTransactions, createUserWithdrawalRequest } from "../../../services/userApi";
import { useNotifications } from "../../../contexts/NotificationContext";
import PageContainer from "../../shared/components/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError, handleApiSuccess } from "../../../utils/toastHelper";
import {
    IoSearchOutline,
    IoChevronBackOutline,
    IoChevronForwardOutline,
    IoCloseOutline
} from "react-icons/io5";

export default function UserWallet() {
    const { socket } = useNotifications();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [totalCredited, setTotalCredited] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [withdrawalRequests, setWithdrawalRequests] = useState([]);
    const toast = useToast();
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [processingWithdraw, setProcessingWithdraw] = useState(false);

    // Filter & Pagination States for Transactions
    const [typeFilter, setTypeFilter] = useState("ALL"); // ALL, REFUND, WITHDRAWAL
    const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, SUCCESS, PENDING, FAILED
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalTransactions: 0, limit: 10 });
    const [transactionsLoading, setTransactionsLoading] = useState(false);

    // Filter & Pagination States for Withdrawal Requests
    const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState("ALL"); // ALL, PENDING, APPROVED, PROCESSED, REJECTED
    const [withdrawalPage, setWithdrawalPage] = useState(1);
    const withdrawalItemsPerPage = 3;

    // Filtered & Paginated Withdrawal Requests
    const filteredWithdrawalRequests = withdrawalRequests.filter((req) => {
        if (withdrawalStatusFilter === "ALL") return true;
        return req.status === withdrawalStatusFilter;
    });
    const totalWithdrawalPages = Math.max(1, Math.ceil(filteredWithdrawalRequests.length / withdrawalItemsPerPage));
    const paginatedWithdrawalRequests = filteredWithdrawalRequests.slice(
        (withdrawalPage - 1) * withdrawalItemsPerPage,
        withdrawalPage * withdrawalItemsPerPage
    );

    const loadTransactions = async (page = 1, limit = 10, type = "ALL", status = "ALL", search = "", showSpinner = false) => {
        try {
            if (showSpinner) setTransactionsLoading(true);
            const params = { page, limit };
            if (type && type !== "ALL") params.type = type;
            if (status && status !== "ALL") params.status = status;
            if (search && search.trim()) params.search = search.trim();

            const res = await getUserWalletTransactions(params);
            if (res.success) {
                setTransactions(res.data.transactions || []);
                if (res.data.pagination) {
                    setPagination(res.data.pagination);
                }
            }
        } catch (err) {
            handleApiError(err, "Failed to load transactions");
        } finally {
            if (showSpinner) setTransactionsLoading(false);
        }
    };

    const loadWalletData = async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }
            
            // Get wallet balance and summary
            const balanceResponse = await getUserWalletBalance();
            if (balanceResponse.success) {
                setWalletBalance(balanceResponse.data.walletBalance || 0);
                setTotalCredited(balanceResponse.data.totalCredited || 0);
                setWithdrawalRequests(balanceResponse.data.withdrawalRequests || []);
            }

            // Load transactions with current filters
            await loadTransactions(currentPage, itemsPerPage, typeFilter, statusFilter, debouncedSearch, false);
        } catch (err) {
            handleApiError(err, "Failed to load wallet data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadWalletData(true);
    }, []);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch transactions when filters or page change
    useEffect(() => {
        if (!loading) {
            loadTransactions(currentPage, itemsPerPage, typeFilter, statusFilter, debouncedSearch, true);
        }
    }, [currentPage, itemsPerPage, typeFilter, statusFilter, debouncedSearch]);

    // Auto-refresh when tab/window gains focus or visibility
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadWalletData(false);
            }
        };
        window.addEventListener('focus', handleVisibilityChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            window.removeEventListener('focus', handleVisibilityChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Real-time socket updates (auto-updates withdrawal requests & balance without manual refresh)
    useEffect(() => {
        if (!socket) return;

        const handleWalletUpdate = (data) => {
            console.log('[UserWallet] Real-time wallet update received:', data);
            loadWalletData(false);
        };

        const handleNotification = (notif) => {
            if (
                notif?.type?.startsWith('WITHDRAWAL_') ||
                notif?.type?.startsWith('WALLET_') ||
                notif?.relatedEntity?.entityType === 'UserWithdrawalRequest' ||
                notif?.relatedEntity?.entityType === 'Wallet' ||
                notif?.metadata?.link === '/user/wallet'
            ) {
                console.log('[UserWallet] Withdrawal/wallet notification received:', notif);
                loadWalletData(false);
            }
        };

        socket.on('wallet_updated', handleWalletUpdate);
        socket.on('withdrawal_updated', handleWalletUpdate);
        socket.on('new_notification', handleNotification);

        return () => {
            socket.off('wallet_updated', handleWalletUpdate);
            socket.off('withdrawal_updated', handleWalletUpdate);
            socket.off('new_notification', handleNotification);
        };
    }, [socket]);

    const [payoutType, setPayoutType] = useState("UPI");
    const [upiId, setUpiId] = useState(() => localStorage.getItem("user_withdrawal_upi") || "");
    const [accountDetails, setAccountDetails] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user_withdrawal_bank")) || { accountHolderName: "", accountNumber: "", ifscCode: "", bankName: "" };
        } catch {
            return { accountHolderName: "", accountNumber: "", ifscCode: "", bankName: "" };
        }
    });

    const handleWithdrawClick = () => {
        if (walletBalance >= 1000) {
            setShowWithdrawModal(true);
            setWithdrawAmount("");
        } else {
            toast.showError("Minimum withdrawal amount is ₹1,000");
        }
    };

    const handleAmountChange = (e) => {
        const val = e.target.value;
        if (val === '') {
            setWithdrawAmount('');
            return;
        }
        if (val.startsWith('-')) return;

        const num = parseFloat(val);
        if (!isNaN(num) && num > walletBalance) {
            setWithdrawAmount(walletBalance.toString());
        } else {
            setWithdrawAmount(val);
        }
    };

    const handleWithdrawSubmit = async (e) => {
        if (e) e.preventDefault();
        const amount = parseFloat(withdrawAmount);
        
        if (!amount || amount <= 0) {
            toast.showError("Please enter a valid amount");
            return;
        }

        if (amount < 1000) {
            toast.showError("Minimum withdrawal amount is ₹1,000");
            return;
        }

        if (amount > walletBalance) {
            toast.showError("Insufficient wallet balance");
            return;
        }

        if (payoutType === "UPI" && !upiId.trim()) {
            toast.showError("Please enter a valid UPI ID (e.g. name@upi)");
            return;
        }

        if (payoutType === "BANK_TRANSFER" && (!accountDetails.accountNumber.trim() || !accountDetails.ifscCode.trim())) {
            toast.showError("Please enter Account Number and IFSC Code");
            return;
        }

        try {
            setProcessingWithdraw(true);
            
            // Save payout details for future withdrawals
            if (payoutType === "UPI") {
                localStorage.setItem("user_withdrawal_upi", upiId.trim());
            } else {
                localStorage.setItem("user_withdrawal_bank", JSON.stringify(accountDetails));
            }

            const response = await createUserWithdrawalRequest(amount, {
                payoutType,
                upiId: payoutType === "UPI" ? upiId.trim() : null,
                accountDetails: payoutType === "BANK_TRANSFER" ? accountDetails : null
            });

            if (response.success) {
                handleApiSuccess("Withdrawal request submitted successfully!");
                setShowWithdrawModal(false);
                setWithdrawAmount("");
                loadWalletData(); // Reload data
            }
        } catch (err) {
            handleApiError(err, "Failed to create withdrawal request");
        } finally {
            setProcessingWithdraw(false);
        }
    };

    // Format amount with 2 decimal places
    const formatAmount = (amount) => {
        return amount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // Format date and time
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Get transaction type label
    const getTransactionTypeLabel = (type) => {
        const labels = {
            'REFUND': 'Refund',
            'WITHDRAWAL_REQUEST': 'Withdrawal Request',
            'WITHDRAWAL_PROCESSED': 'Withdrawal Processed',
            'WITHDRAWAL_REJECTED': 'Withdrawal Rejected'
        };
        return labels[type] || type;
    };

    // Get status badge color
    const getStatusColor = (status) => {
        const colors = {
            'SUCCESS': 'text-[#34C759]',
            'PENDING': 'text-[#FF9F0A]',
            'FAILED': 'text-red-500',
            'APPROVED': 'text-blue-500',
            'REJECTED': 'text-red-500',
            'PROCESSED': 'text-[#34C759]'
        };
        return colors[status] || 'text-gray-500';
    };

    if (loading) {
        return <LoadingSpinner message="Loading wallet..." />;
    }

    return (
        <>
        <PageContainer>
            {/* Hydro Aqua Ocean Balance Card */}
            <section className="relative my-3 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F52BA] via-[#0A84FF] to-[#00C49F] p-6 text-white shadow-xl shadow-cyan-500/15 border border-cyan-400/30">
                {/* Hydro Ripple Background Waves */}
                <div className="absolute inset-0 z-0 opacity-25">
                    <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path fill="#E0F7FA" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                    <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ transform: 'translateY(15px)' }}>
                        <path fill="#00E5FF" d="M0,128L48,138.7C96,149,192,171,288,181.3C384,192,480,192,576,186.7C672,181,768,171,864,165.3C960,160,1056,160,1152,154.7C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-cyan-100 border border-white/25 mb-2 shadow-2xs">
                        <span>My Wallet</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-cyan-100 opacity-90">Available Refund & Credit Balance</p>
                    <p className="mt-1 text-4xl sm:text-5xl font-black font-mono tracking-tight text-white drop-shadow-md">
                        ₹{formatAmount(walletBalance)}
                    </p>
                    {walletBalance >= 1000 && (
                        <button
                            onClick={handleWithdrawClick}
                            className="mt-4 w-full max-w-xs rounded-2xl bg-white/20 px-8 py-3 font-extrabold text-white backdrop-blur-md border border-white/30 shadow-lg shadow-cyan-500/20 hover:bg-white/30 active:scale-95 transition-all"
                        >
                            Request Withdrawal 💸
                        </button>
                    )}
                </div>
            </section>

            {/* Hydro Summary Cards */}
            <div className="grid grid-cols-2 gap-3.5 mb-6">
                <div className="rounded-2xl bg-white p-4 shadow-xs border border-gray-100/90 hover:border-emerald-300 transition-all">
                    <span className="material-symbols-outlined text-emerald-500 !text-2xl font-bold">payments</span>
                    <p className="mt-1.5 text-xs font-bold text-gray-500">Total Refunded</p>
                    <p className="mt-0.5 text-lg font-extrabold text-emerald-600">
                        ₹{formatAmount(totalCredited)}
                    </p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-xs border border-gray-100/90 hover:border-teal-300 transition-all">
                    <span className="material-symbols-outlined text-teal-600 !text-2xl font-bold">account_balance_wallet</span>
                    <p className="mt-1.5 text-xs font-bold text-gray-500">Available Balance</p>
                    <p className="mt-0.5 text-lg font-extrabold text-teal-700">
                        ₹{formatAmount(walletBalance)}
                    </p>
                </div>
            </div>

            {/* Withdrawal Requests */}
            {withdrawalRequests.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between flex-wrap gap-2 px-1 pt-2 pb-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">Withdrawal Requests</h2>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {withdrawalRequests.length}
                            </span>
                        </div>
                        {refreshing && (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                                Syncing...
                            </span>
                        )}
                    </div>

                    {/* Status Filter for Withdrawal Requests */}
                    {withdrawalRequests.length > 1 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
                            {[
                                { id: "ALL", label: `All (${withdrawalRequests.length})` },
                                { id: "PENDING", label: `Pending (${withdrawalRequests.filter(r => r.status === 'PENDING').length})` },
                                { id: "APPROVED", label: `Approved (${withdrawalRequests.filter(r => r.status === 'APPROVED').length})` },
                                { id: "PROCESSED", label: `Settled (${withdrawalRequests.filter(r => r.status === 'PROCESSED').length})` },
                                { id: "REJECTED", label: `Rejected (${withdrawalRequests.filter(r => r.status === 'REJECTED').length})` },
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => {
                                        setWithdrawalStatusFilter(f.id);
                                        setWithdrawalPage(1);
                                    }}
                                    className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
                                        withdrawalStatusFilter === f.id
                                            ? "bg-slate-900 text-white shadow-xs"
                                            : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Cards */}
                    {paginatedWithdrawalRequests.length === 0 ? (
                        <div className="p-6 text-center bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs font-medium">
                            No withdrawal requests match the selected status.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {paginatedWithdrawalRequests.map((request) => (
                                <div
                                    key={request._id}
                                    className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-xs border border-gray-100"
                                >
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 ${
                                        request.status === 'PROCESSED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        request.status === 'APPROVED' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                        request.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                    }`}>
                                        <span className="material-symbols-outlined font-bold text-xl">
                                            {request.status === 'PROCESSED' ? 'check_circle' :
                                             request.status === 'REJECTED' ? 'cancel' : 'pending'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-extrabold text-gray-900 text-sm">
                                            Withdrawal Request
                                        </p>
                                        <p className="text-xs text-gray-500 font-medium">
                                            {formatDateTime(request.requestedAt)}
                                        </p>
                                        {request.rejectionReason && (
                                            <p className="text-xs text-rose-500 mt-0.5 font-semibold">
                                                Reason: {request.rejectionReason}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-extrabold text-gray-900 text-sm">
                                            ₹{formatAmount(request.amount)}
                                        </p>
                                        <span className={`inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-full ${getStatusColor(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Withdrawal Requests Pagination if > 1 page */}
                    {totalWithdrawalPages > 1 && (
                        <div className="flex items-center justify-between pt-3 px-1 text-xs font-semibold text-slate-500">
                            <span>Page {withdrawalPage} of {totalWithdrawalPages}</span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    disabled={withdrawalPage === 1}
                                    onClick={() => setWithdrawalPage(p => Math.max(1, p - 1))}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    aria-label="Previous Page"
                                >
                                    <IoChevronBackOutline className="text-sm" />
                                </button>
                                <button
                                    type="button"
                                    disabled={withdrawalPage === totalWithdrawalPages}
                                    onClick={() => setWithdrawalPage(p => Math.min(totalWithdrawalPages, p + 1))}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    aria-label="Next Page"
                                >
                                    <IoChevronForwardOutline className="text-sm" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Transaction History Section */}
            <div className="space-y-3 mb-8">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-2 px-1">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-gray-900 tracking-tight">Transaction History</h2>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {pagination.totalTransactions}
                        </span>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-3">
                    {/* Search Input */}
                    <div className="relative">
                        <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by description or reference..."
                            className="w-full pl-9 pr-9 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20 focus:border-[#0A84FF] transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer text-sm"
                            >
                                <IoCloseOutline />
                            </button>
                        )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                        {/* Type Filters */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Type:</span>
                            {[
                                { id: "ALL", label: "All Activities" },
                                { id: "REFUND", label: "Refund Credits" },
                                { id: "WITHDRAWAL", label: "Withdrawals" },
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => {
                                        setTypeFilter(t.id);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                        typeFilter === t.id
                                            ? "bg-[#0A84FF] text-white shadow-xs"
                                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Status Filters */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
                            {[
                                { id: "ALL", label: "All" },
                                { id: "SUCCESS", label: "Success" },
                                { id: "PENDING", label: "Pending" },
                                { id: "FAILED", label: "Rejected" },
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => {
                                        setStatusFilter(s.id);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                        statusFilter === s.id
                                            ? "bg-slate-900 text-white shadow-xs"
                                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                                    }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Transaction Cards List */}
                {transactionsLoading ? (
                    <div className="py-12 text-center bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center justify-center">
                        <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                        <p className="text-xs font-semibold text-slate-500">Loading transactions...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="rounded-2xl bg-white p-10 text-center shadow-xs border border-gray-100">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">receipt_long</span>
                        <p className="text-gray-700 text-sm font-bold">No transactions found</p>
                        <p className="text-gray-400 text-xs mt-1">
                            {(typeFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery)
                                ? "Try adjusting your filters or search query"
                                : "Transactions will appear here once you receive refunds or request withdrawals"}
                        </p>
                        {(typeFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setTypeFilter("ALL");
                                    setStatusFilter("ALL");
                                    setSearchQuery("");
                                    setCurrentPage(1);
                                }}
                                className="mt-3 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {transactions.map((transaction) => {
                            const isCredit = transaction.type === 'REFUND';
                            const isWithdrawal = ['WITHDRAWAL_REQUEST', 'WITHDRAWAL_PROCESSED', 'WITHDRAWAL_REJECTED'].includes(transaction.type);
                            const isFailed = transaction.status === 'FAILED' || transaction.status === 'REJECTED' || transaction.type === 'WITHDRAWAL_REJECTED';
                            const isSuccess = transaction.status === 'SUCCESS' && !isFailed;
                            const isPending = transaction.status === 'PENDING' && !isFailed;
                            
                            return (
                                <div
                                    key={transaction._id}
                                    className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-xs border border-gray-100 hover:border-blue-300 transition-all"
                                >
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 ${
                                        isFailed ? "bg-rose-50 text-rose-500 border border-rose-100" :
                                        isSuccess ? (isCredit ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : isWithdrawal ? "bg-blue-50 text-[#0A84FF] border border-blue-100" : "bg-gray-50 text-gray-500") : 
                                        isPending ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                                    }`}>
                                        <span className="material-symbols-outlined font-bold text-xl">
                                            {isFailed ? "cancel" : isCredit ? "arrow_downward_alt" : isWithdrawal ? "account_balance_wallet" : "info"}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-extrabold text-gray-900 text-sm truncate">
                                            {getTransactionTypeLabel(transaction.type)}
                                        </p>
                                        <p className="text-xs text-gray-500 font-medium">
                                            {formatDateTime(transaction.createdAt)}
                                        </p>
                                        {transaction.booking && (
                                            <p className="text-xs text-blue-600 font-bold mt-0.5">
                                                Booking #{transaction.booking._id?.toString().slice(-8).toUpperCase()}
                                            </p>
                                        )}
                                        {(transaction.errorMessage || transaction.metadata?.rejectionReason) && (
                                            <p className="text-xs text-rose-500 mt-0.5 font-semibold">
                                                Reason: {transaction.errorMessage || transaction.metadata?.rejectionReason}
                                            </p>
                                        )}
                                        {transaction.description && !transaction.errorMessage && (
                                            <p className="text-xs text-gray-500 mt-0.5 italic">
                                                {transaction.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`font-extrabold text-sm ${
                                            isFailed ? "text-slate-400 line-through" :
                                            isSuccess ? (isCredit ? "text-emerald-600" : isWithdrawal ? "text-[#0A84FF]" : "text-gray-700") : 
                                            isPending ? "text-amber-600" : "text-rose-600"
                                        }`}>
                                            {isFailed ? "" : isCredit ? "+" : isWithdrawal ? "-" : ""} ₹{formatAmount(Math.abs(transaction.amount))}
                                        </p>
                                        <span className={`inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 ${
                                            isFailed ? "text-rose-600" : getStatusColor(transaction.status)
                                        }`}>
                                            {isFailed ? "REJECTED" : transaction.status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination Controls */}
                {pagination.totalTransactions > 0 && (
                    <div className="flex items-center justify-between flex-wrap gap-3 pt-4 px-1 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-500">
                            Showing <span className="font-bold text-slate-800">{(pagination.currentPage - 1) * pagination.limit + 1}</span>–<span className="font-bold text-slate-800">{Math.min(pagination.currentPage * pagination.limit, pagination.totalTransactions)}</span> of <span className="font-bold text-slate-800">{pagination.totalTransactions}</span>
                        </p>

                        <div className="flex items-center gap-2">
                            {/* Rows Selector */}
                            <div className="flex items-center gap-1.5 mr-1">
                                <span className="text-[11px] font-semibold text-slate-400">Rows:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>

                            {/* Prev Page Button */}
                            <button
                                type="button"
                                disabled={pagination.currentPage <= 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            >
                                <IoChevronBackOutline />
                                <span>Prev</span>
                            </button>

                            {/* Page Numbers */}
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                .filter(page => {
                                    return page === 1 || page === pagination.totalPages || Math.abs(page - pagination.currentPage) <= 1;
                                })
                                .map((page, idx, arr) => {
                                    const prev = arr[idx - 1];
                                    return (
                                        <div key={page} className="flex items-center">
                                            {prev && page - prev > 1 && (
                                                <span className="px-1 text-slate-400 font-bold text-xs">...</span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-7 h-7 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                                    pagination.currentPage === page
                                                        ? "bg-[#0A84FF] text-white shadow-xs"
                                                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        </div>
                                    );
                                })}

                            {/* Next Page Button */}
                            <button
                                type="button"
                                disabled={pagination.currentPage >= pagination.totalPages}
                                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            >
                                <span>Next</span>
                                <IoChevronForwardOutline />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </PageContainer>

        {/* Withdrawal Request Modal */}
        {showWithdrawModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-slate-100 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-[#0A84FF] font-bold text-lg">
                                💸
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">Request Withdrawal</h3>
                                <p className="text-xs text-slate-500 font-semibold">Available: ₹{formatAmount(walletBalance)}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowWithdrawModal(false)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Body Form */}
                    <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                        {/* Amount */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Withdrawal Amount <span className="text-red-500">*</span>
                                </label>
                                {walletBalance > 0 && (
                                    <span className="text-[11px] font-semibold text-slate-400">
                                        Max: ₹{formatAmount(walletBalance)}
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                                <input
                                    type="number"
                                    step="any"
                                    min="1000"
                                    max={walletBalance}
                                    value={withdrawAmount}
                                    onChange={handleAmountChange}
                                    placeholder={`Min: ₹1,000 | Max: ₹${formatAmount(walletBalance)}`}
                                    className="w-full pl-8 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-[#0A84FF] outline-none text-sm font-semibold text-slate-800 transition-all"
                                    required
                                />
                                {walletBalance > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setWithdrawAmount(walletBalance.toString())}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-extrabold text-[#0A84FF] bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                                        title="Use maximum available balance"
                                    >
                                        MAX
                                    </button>
                                )}
                            </div>

                            {/* Live Hints */}
                            {withdrawAmount && parseFloat(withdrawAmount) > walletBalance && (
                                <p className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1">
                                    ⚠️ Amount cannot exceed available balance of ₹{formatAmount(walletBalance)}
                                </p>
                            )}
                            {withdrawAmount && parseFloat(withdrawAmount) > 0 && parseFloat(withdrawAmount) < 1000 && (
                                <p className="text-xs font-bold text-amber-600 flex items-center gap-1 mt-1">
                                    ℹ️ Minimum withdrawal amount is ₹1,000
                                </p>
                            )}
                        </div>

                        {/* Payout Mode Tabs */}
                        <div className="space-y-1.5 pt-1">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Preferred Payout Method <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                                <button
                                    type="button"
                                    onClick={() => setPayoutType("UPI")}
                                    className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                        payoutType === "UPI" ? "bg-white text-[#0A84FF] shadow-xs" : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    ⚡ UPI ID
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPayoutType("BANK_TRANSFER")}
                                    className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                        payoutType === "BANK_TRANSFER" ? "bg-white text-[#0A84FF] shadow-xs" : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    🏦 Bank Account
                                </button>
                            </div>
                        </div>

                        {/* UPI Details */}
                        {payoutType === "UPI" ? (
                            <div className="space-y-1.5 pt-1">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Your UPI ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    placeholder="e.g. 7389279971@ybl, name@upi"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-[#0A84FF] outline-none text-xs font-semibold text-slate-800"
                                    required
                                />
                                <p className="text-[11px] text-slate-400 font-medium">Admin will send refund payout to this UPI address.</p>
                            </div>
                        ) : (
                            /* Bank Details */
                            <div className="space-y-3 pt-1">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                        Account Holder Name
                                    </label>
                                    <input
                                        type="text"
                                        value={accountDetails.accountHolderName}
                                        onChange={(e) => setAccountDetails({ ...accountDetails, accountHolderName: e.target.value })}
                                        placeholder="Full name as per bank"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                        Account Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={accountDetails.accountNumber}
                                        onChange={(e) => setAccountDetails({ ...accountDetails, accountNumber: e.target.value })}
                                        placeholder="Enter Bank Account Number"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                            IFSC Code <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={accountDetails.ifscCode}
                                            onChange={(e) => setAccountDetails({ ...accountDetails, ifscCode: e.target.value.toUpperCase() })}
                                            placeholder="e.g. SBIN0001234"
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 uppercase"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                            Bank Name
                                        </label>
                                        <input
                                            type="text"
                                            value={accountDetails.bankName}
                                            onChange={(e) => setAccountDetails({ ...accountDetails, bankName: e.target.value })}
                                            placeholder="e.g. SBI, HDFC"
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer Buttons */}
                        <div className="flex items-center gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setShowWithdrawModal(false)}
                                className="flex-1 py-3 px-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-xs cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    processingWithdraw ||
                                    !withdrawAmount ||
                                    parseFloat(withdrawAmount) < 1000 ||
                                    parseFloat(withdrawAmount) > walletBalance
                                }
                                className="flex-1 py-3 px-4 rounded-2xl font-bold text-white bg-gradient-to-r from-[#0A84FF] to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all text-xs shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {processingWithdraw ? "Submitting..." : "Submit Request"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>);
}

