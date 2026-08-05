import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getWalletBalance, getWalletTransactions, createWithdrawalRequest } from "../../../services/vendorApi";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import PageContainer from "../../shared/components/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError, handleApiSuccess } from "../../../utils/toastHelper";
import { 
    IoDownloadOutline, 
    IoDocumentTextOutline, 
    IoCloseOutline,
    IoCheckmarkCircle,
    IoTimeOutline,
    IoCalendarOutline,
    IoStatsChartOutline,
    IoInformationCircleOutline
} from "react-icons/io5";

export default function VendorWallet() {
    const location = useLocation();
    const { vendor } = useVendorAuth();
    const [loading, setLoading] = useState(true);
    const [walletBalance, setWalletBalance] = useState(0);
    const [totalCredited, setTotalCredited] = useState(0);
    const [totalDeducted, setTotalDeducted] = useState(0);
    const [thisMonthEarnings, setThisMonthEarnings] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [withdrawalRequests, setWithdrawalRequests] = useState([]);
    const toast = useToast();
    
    // Modal State
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [processingWithdraw, setProcessingWithdraw] = useState(false);

    // Filter State
    const [typeFilter, setTypeFilter] = useState("ALL"); // ALL, CREDITS, DEBITS, WITHDRAWALS
    const [timeFilter, setTimeFilter] = useState("ALL"); // ALL, WEEK, MONTH, YEAR

    // Load data
    useEffect(() => {
        loadWalletData();
    }, [location.pathname]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadWalletData();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const loadWalletData = async () => {
        try {
            setLoading(true);
            const balanceResponse = await getWalletBalance();
            if (balanceResponse.success) {
                setWalletBalance(balanceResponse.data.walletBalance || 0);
                setTotalCredited(balanceResponse.data.totalCredited || 0);
                setTotalDeducted(balanceResponse.data.totalDeducted || 0);
                setThisMonthEarnings(balanceResponse.data.thisMonthEarnings || 0);
                setWithdrawalRequests(balanceResponse.data.withdrawalRequests || []);
            }

            const transactionsResponse = await getWalletTransactions({ limit: 100 });
            if (transactionsResponse.success) {
                setTransactions(transactionsResponse.data.transactions || []);
            }
        } catch (err) {
            handleApiError(err, "Failed to load wallet data");
        } finally {
            setLoading(false);
        }
    };

    const handleWithdrawClick = () => {
        if (walletBalance >= 1000) {
            setShowWithdrawModal(true);
            setWithdrawAmount("");
        } else {
            toast.showError("Minimum withdrawal amount is ₹1,000");
        }
    };

    const handleWithdrawSubmit = async (e) => {
        e.preventDefault();
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

        try {
            setProcessingWithdraw(true);
            const response = await createWithdrawalRequest(amount);
            if (response.success) {
                handleApiSuccess("Withdrawal request submitted successfully!");
                setShowWithdrawModal(false);
                setWithdrawAmount("");
                loadWalletData();
            }
        } catch (err) {
            handleApiError(err, "Failed to create withdrawal request");
        } finally {
            setProcessingWithdraw(false);
        }
    };

    const handleDownloadStatement = () => {
        toast.showSuccess("Statement download started");
        // Mock functionality for now
    };

    const handleDownloadEarnings = () => {
        toast.showSuccess("Earnings report download started");
        // Mock functionality for now
    };

    const formatAmount = (amount) => {
        return amount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

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

    const getExpectedSettlementDate = (dateString) => {
        const date = new Date(dateString);
        // Add 1 day
        date.setDate(date.getDate() + 1);
        // If Sunday (0), move to Monday (1)
        if (date.getDay() === 0) date.setDate(date.getDate() + 1);
        return formatDateTime(date);
    };

    const getTransactionTypeLabel = (type) => {
        const labels = {
            'TRAVEL_CHARGES': 'Travel Charges',
            'SITE_VISIT': '1st Payment (Site Visit)',
            'REPORT_UPLOAD': '2nd Payment (Report Upload)',
            'PLATFORM_FEE_DEDUCTION': 'Platform Fee Deduction',
            'WITHDRAWAL_REQUEST': 'Withdrawal Request',
            'WITHDRAWAL_PROCESSED': 'Withdrawal Processed',
            'WITHDRAWAL_REJECTED': 'Withdrawal Rejected'
        };
        return labels[type] || type;
    };

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

    // Filtering Logic
    const getFilteredTransactions = () => {
        return transactions.filter(t => {
            const isCredit = ['TRAVEL_CHARGES', 'SITE_VISIT', 'REPORT_UPLOAD'].includes(t.type);
            const isDebit = ['PLATFORM_FEE_DEDUCTION'].includes(t.type);
            const isWithdrawal = ['WITHDRAWAL_REQUEST', 'WITHDRAWAL_PROCESSED', 'WITHDRAWAL_REJECTED'].includes(t.type);

            // Type Filter
            if (typeFilter === 'CREDITS' && !isCredit) return false;
            if (typeFilter === 'DEBITS' && !isDebit) return false;
            if (typeFilter === 'WITHDRAWALS' && !isWithdrawal) return false;

            // Time Filter
            const txDate = new Date(t.createdAt);
            const now = new Date();
            if (timeFilter === 'WEEK') {
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (txDate < oneWeekAgo) return false;
            }
            if (timeFilter === 'MONTH') {
                const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                if (txDate < oneMonthAgo) return false;
            }
            if (timeFilter === 'YEAR') {
                const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                if (txDate < oneYearAgo) return false;
            }

            return true;
        });
    };

    const filteredTransactions = getFilteredTransactions();

    if (loading) {
        return <LoadingSpinner message="Loading Expert Wallet..." />;
    }

    return (
        <>
        <PageContainer>
            {/* Wallet Header */}
            <section className="relative my-3 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F52BA] via-[#0A84FF] to-[#00C49F] p-6 text-white shadow-xl shadow-cyan-500/15 border border-cyan-400/30">
                {/* Background Waves */}
                <div className="absolute inset-0 z-0 opacity-25">
                    <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path fill="#E0F7FA" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                    <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ transform: 'translateY(15px)' }}>
                        <path fill="#00E5FF" d="M0,128L48,138.7C96,149,192,171,288,181.3C384,192,480,192,576,186.7C672,181,768,171,864,165.3C960,160,1056,160,1152,154.7C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-cyan-100 border border-white/25 mb-2 shadow-sm">
                        <span>💧 Expert Wallet</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-cyan-100 opacity-90">Total Available Wallet Balance</p>
                    <p className="mt-1 text-4xl sm:text-5xl font-black font-mono tracking-tight text-white drop-shadow-md">
                        ₹{formatAmount(walletBalance)}
                    </p>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-cyan-100/90 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                        Settlement: T+1 Business Day
                    </p>
                    {walletBalance >= 1000 && (
                        <button
                            onClick={handleWithdrawClick}
                            className="mt-5 w-full max-w-xs rounded-2xl bg-white/20 px-8 py-3.5 font-extrabold text-white backdrop-blur-md border border-white/30 shadow-lg hover:bg-white/30 active:scale-95 transition-all"
                        >
                            Request Withdrawal 💸
                        </button>
                    )}
                </div>
            </section>

            {/* Wallet Breakdown Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 hover:border-teal-300 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-teal-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-teal-600 text-sm font-bold">account_balance_wallet</span>
                        </div>
                        <p className="text-[11px] font-black tracking-wider uppercase text-gray-500">Available Balance</p>
                    </div>
                    <p className="text-xl font-extrabold text-teal-700">
                        ₹{formatAmount(walletBalance)}
                    </p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 hover:border-blue-300 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#0A84FF] text-sm font-bold">schedule</span>
                        </div>
                        <p className="text-[11px] font-black tracking-wider uppercase text-gray-500">Pending Settlement</p>
                    </div>
                    <p className="text-xl font-extrabold text-[#0A84FF]">
                        ₹0.00
                    </p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 hover:border-amber-300 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-amber-500 text-sm font-bold">hourglass_top</span>
                        </div>
                        <p className="text-[11px] font-black tracking-wider uppercase text-gray-500">Processing Withdrawal</p>
                    </div>
                    <p className="text-xl font-extrabold text-amber-600">
                        ₹{formatAmount(withdrawalRequests.filter(r => r.status === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0))}
                    </p>
                </div>
            </div>

            {/* Downloads Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                <button onClick={handleDownloadStatement} className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors active:scale-95 group">
                    <div className="flex items-center gap-3">
                        <IoDocumentTextOutline className="text-2xl text-blue-600" />
                        <div className="text-left">
                            <p className="text-sm font-bold text-blue-900">Download Wallet Statement</p>
                            <p className="text-xs text-blue-600 font-medium">PDF Format</p>
                        </div>
                    </div>
                    <IoDownloadOutline className="text-xl text-blue-600 group-hover:scale-110 transition-transform" />
                </button>
                <button onClick={handleDownloadEarnings} className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors active:scale-95 group">
                    <div className="flex items-center gap-3">
                        <IoStatsChartOutline className="text-2xl text-emerald-600" />
                        <div className="text-left">
                            <p className="text-sm font-bold text-emerald-900">Download Earnings Report</p>
                            <p className="text-xs text-emerald-600 font-medium">Excel/PDF Format</p>
                        </div>
                    </div>
                    <IoDownloadOutline className="text-xl text-emerald-600 group-hover:scale-110 transition-transform" />
                </button>
            </div>

            {/* Withdrawal Requests */}
            {withdrawalRequests.length > 0 && (
                <>
                    <h2 className="px-1 pt-2 pb-3 text-lg font-black text-gray-900 tracking-tight">Withdrawal Requests</h2>
                    <div className="flex flex-col gap-3 mb-6">
                        {withdrawalRequests.slice().reverse().map((request) => (
                            <div key={request._id} className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                                            request.status === 'PROCESSED' ? 'bg-emerald-50 text-emerald-600' :
                                            request.status === 'APPROVED' ? 'bg-blue-50 text-blue-600' :
                                            request.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                        }`}>
                                            <span className="material-symbols-outlined font-bold text-lg">
                                                {request.status === 'PROCESSED' ? 'check_circle' :
                                                 request.status === 'REJECTED' ? 'cancel' : 'account_balance_wallet'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-extrabold text-gray-900 text-sm">Request #{request._id.toString().slice(-6).toUpperCase()}</p>
                                            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wide mt-0.5">
                                                Status: <span className={getStatusColor(request.status)}>{request.status}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-black text-lg text-gray-900">
                                        ₹{formatAmount(request.amount)}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Requested On</p>
                                        <p className="text-xs text-gray-800 font-bold mt-0.5">{formatDateTime(request.requestedAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Exp. Settlement</p>
                                        <p className="text-xs text-blue-600 font-bold mt-0.5">{getExpectedSettlementDate(request.requestedAt)}</p>
                                    </div>
                                </div>
                                {request.rejectionReason && (
                                    <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 flex gap-2">
                                        <IoInformationCircleOutline className="text-rose-600 text-lg shrink-0" />
                                        <p className="text-xs text-rose-700 font-medium">Reason: {request.rejectionReason}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Transaction History with Filters */}
            <h2 className="px-1 pt-2 pb-3 text-lg font-black text-gray-900 tracking-tight">Transaction History</h2>
            
            {/* Filter Pills */}
            <div className="flex flex-col gap-2 mb-4">
                <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-1">
                    {['ALL', 'CREDITS', 'DEBITS', 'WITHDRAWALS'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setTypeFilter(f)}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                typeFilter === f 
                                ? 'bg-gray-800 text-white shadow-sm' 
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {f.charAt(0) + f.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
                <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-1">
                    {['ALL', 'WEEK', 'MONTH', 'YEAR'].map((f) => {
                        const label = f === 'ALL' ? 'All Time' : `This ${f.charAt(0) + f.slice(1).toLowerCase()}`;
                        return (
                            <button
                                key={f}
                                onClick={() => setTimeFilter(f)}
                                className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                                    timeFilter === f 
                                    ? 'bg-[#E3F2FD] text-[#0A84FF] border border-blue-200' 
                                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                {f !== 'ALL' && <IoCalendarOutline className="text-sm" />}
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Transaction List */}
            <div className="flex flex-col gap-3">
                {filteredTransactions.length === 0 ? (
                    <div className="rounded-2xl bg-white p-8 text-center shadow-sm border border-gray-100 flex flex-col items-center">
                        <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-gray-300 text-2xl">receipt_long</span>
                        </div>
                        <p className="text-gray-500 text-sm font-bold">No transactions found</p>
                        <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    filteredTransactions.map((transaction) => {
                        const isCredit = ['TRAVEL_CHARGES', 'SITE_VISIT', 'REPORT_UPLOAD'].includes(transaction.type);
                        const isDebit = ['PLATFORM_FEE_DEDUCTION'].includes(transaction.type);
                        const isWithdrawal = ['WITHDRAWAL_REQUEST', 'WITHDRAWAL_PROCESSED', 'WITHDRAWAL_REJECTED'].includes(transaction.type);
                        const isSuccess = transaction.status === 'SUCCESS';
                        const isPending = transaction.status === 'PENDING';
                        
                        return (
                            <div key={transaction._id} className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${
                                        isSuccess ? (isCredit ? "bg-emerald-50 text-emerald-600" : isDebit ? "bg-amber-50 text-amber-600" : isWithdrawal ? "bg-blue-50 text-[#0A84FF]" : "bg-gray-50 text-gray-500") : 
                                        isPending ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                                    }`}>
                                        <span className="material-symbols-outlined font-bold text-xl">
                                            {isCredit ? "arrow_downward_alt" : isDebit ? "arrow_upward_alt" : isWithdrawal ? "account_balance_wallet" : "info"}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-extrabold text-gray-900 text-sm truncate">
                                                {getTransactionTypeLabel(transaction.type)}
                                            </p>
                                            <p className={`font-black text-sm whitespace-nowrap ml-2 ${
                                                isSuccess ? (isCredit ? "text-emerald-600" : isDebit ? "text-amber-600" : isWithdrawal ? "text-[#0A84FF]" : "text-gray-700") : 
                                                isPending ? "text-amber-600" : "text-rose-600"
                                            }`}>
                                                {isCredit ? "+" : isDebit || isWithdrawal ? "-" : ""} ₹{formatAmount(Math.abs(transaction.amount))}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${getStatusColor(transaction.status)} bg-gray-50 border border-gray-100`}>
                                                {transaction.status}
                                            </span>
                                            <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                                                <IoTimeOutline />
                                                {formatDateTime(transaction.createdAt)}
                                            </span>
                                        </div>

                                        {/* Detailed Breakdown */}
                                        <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 mt-2 space-y-1.5">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500 font-semibold">Transaction ID</span>
                                                <span className="text-gray-800 font-bold font-mono text-[10px]">TXN-{transaction._id.toString().slice(-8).toUpperCase()}</span>
                                            </div>
                                            
                                            {transaction.booking && (
                                                <>
                                                    <div className="flex justify-between items-center text-xs border-t border-gray-200/50 pt-1.5">
                                                        <span className="text-gray-500 font-semibold">Booking ID</span>
                                                        <span className="text-blue-600 font-bold font-mono text-[10px]">#{transaction.booking._id?.toString().slice(-6).toUpperCase()}</span>
                                                    </div>
                                                    {transaction.booking.user && (
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-gray-500 font-semibold">Customer</span>
                                                            <span className="text-gray-800 font-bold">{transaction.booking.user.name}</span>
                                                        </div>
                                                    )}
                                                    {transaction.booking.service && (
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-gray-500 font-semibold">Survey Type</span>
                                                            <span className="text-gray-800 font-bold">{transaction.booking.service.name || transaction.booking.service.category}</span>
                                                        </div>
                                                    )}
                                                    {isCredit && transaction.booking.service && transaction.booking.service.platformFee > 0 && (
                                                        <div className="flex justify-between items-center text-xs text-amber-600 bg-amber-50 p-1 rounded mt-1">
                                                            <span className="font-semibold">Platform Fee Included</span>
                                                            <span className="font-bold">₹{formatAmount(transaction.booking.service.platformFee)}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Disclaimer Note */}
            <div className="mt-8 mb-4 bg-gray-50 p-4 rounded-2xl border border-gray-200 flex gap-3 items-start">
                <IoInformationCircleOutline className="text-gray-400 text-xl shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    Payments are credited after successful completion of the survey and customer payment confirmation. Withdrawals are processed to the registered bank account as per the settlement policy.
                </p>
            </div>
        </PageContainer>

        {/* Withdrawal Request Modal with Validation */}
        {showWithdrawModal && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowWithdrawModal(false)}></div>
                <div className="relative w-full max-w-md bg-white rounded-[24px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
                        <h3 className="text-lg font-black text-gray-900 tracking-tight">Request Withdrawal</h3>
                        <button 
                            onClick={() => setShowWithdrawModal(false)}
                            className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                            <IoCloseOutline className="text-xl" />
                        </button>
                    </div>

                    <form onSubmit={handleWithdrawSubmit} className="p-6">
                        {/* Validation Information Panel */}
                        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mb-6 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Available Balance</span>
                                <span className="text-sm font-black text-[#0A84FF]">₹{formatAmount(walletBalance)}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-blue-100/50 pt-3">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Min. Withdrawal</span>
                                <span className="text-sm font-bold text-gray-700">₹1,000.00</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-blue-100/50 pt-3">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bank Account</span>
                                <div className="flex items-center gap-1.5">
                                    <IoCheckmarkCircle className="text-emerald-500" />
                                    <span className="text-xs font-bold text-emerald-700">Registered</span>
                                </div>
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                Enter Amount
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">₹</span>
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-9 pr-4 py-3.5 text-xl font-black text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-gray-300 placeholder:font-medium"
                                    autoFocus
                                />
                            </div>
                            {withdrawAmount && parseFloat(withdrawAmount) > walletBalance && (
                                <p className="text-rose-500 text-xs font-bold mt-2 flex items-center gap-1">
                                    Amount exceeds available balance!
                                </p>
                            )}
                            {withdrawAmount && parseFloat(withdrawAmount) > 0 && parseFloat(withdrawAmount) < 1000 && (
                                <p className="text-amber-500 text-xs font-bold mt-2 flex items-center gap-1">
                                    Minimum withdrawal is ₹1,000!
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowWithdrawModal(false)}
                                className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processingWithdraw || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > walletBalance || parseFloat(withdrawAmount) < 1000}
                                className="flex-[2] py-3.5 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                            >
                                {processingWithdraw ? (
                                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                ) : (
                                    "Confirm Withdrawal"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>);
}
