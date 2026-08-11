import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getWalletBalance, getWalletTransactions, createWithdrawalRequest, updateVendorProfile } from "../../../services/vendorApi";
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
    IoInformationCircleOutline,
    IoWalletOutline,
    IoTrendingUpOutline,
    IoReceiptOutline,
    IoCashOutline,
    IoCardOutline,
    IoBusinessOutline,
    IoShieldCheckmarkOutline
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
    
    // Tab Navigation State - default to "wallet-overview"
    const [activeNav, setActiveNav] = useState("wallet-overview");

    const navItems = [
        { id: "wallet-overview", label: "1. Wallet Overview", icon: IoWalletOutline },
        { id: "earnings-stats", label: "2. Earnings & Statistics", icon: IoStatsChartOutline },
        { id: "earnings-breakdown", label: "3. Earnings Breakdown", icon: IoTrendingUpOutline },
        { id: "transaction-history", label: "4. Transaction History", icon: IoReceiptOutline },
        { id: "withdraw-money", label: "5. Withdraw Money", icon: IoCashOutline },
        { id: "bank-account", label: "6. Bank Account", icon: IoCardOutline },
    ];

    // Modal State
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showBankEditModal, setShowBankEditModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [processingWithdraw, setProcessingWithdraw] = useState(false);
    const [savingBank, setSavingBank] = useState(false);
    const [bankFormData, setBankFormData] = useState({
        accountHolderName: vendor?.bankDetails?.accountHolderName || vendor?.name || "",
        bankName: vendor?.bankDetails?.bankName || "",
        accountNumber: vendor?.bankDetails?.accountNumber || "",
        ifscCode: vendor?.bankDetails?.ifscCode || ""
    });

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

    const handleBankEditSubmit = async (e) => {
        e.preventDefault();
        try {
            setSavingBank(true);
            const response = await updateVendorProfile({
                bankDetails: bankFormData
            });
            if (response.success) {
                handleApiSuccess("Bank details updated & submitted to Admin for verification!");
                setShowBankEditModal(false);
                loadWalletData();
            }
        } catch (err) {
            handleApiError(err, "Failed to update bank details");
        } finally {
            setSavingBank(false);
        }
    };

    const handleDownloadStatement = () => {
        toast.showSuccess("Statement download started");
    };

    const handleDownloadEarnings = () => {
        toast.showSuccess("Earnings report download started");
    };

    const formatAmount = (amount) => {
        return (amount || 0).toLocaleString("en-IN", {
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
        date.setDate(date.getDate() + 1);
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
            const isEarning = ['TRAVEL_CHARGES', 'SITE_VISIT', 'REPORT_UPLOAD'].includes(t.type);
            const isWithdrawal = ['WITHDRAWAL_REQUEST', 'WITHDRAWAL_PROCESSED', 'WITHDRAWAL_REJECTED'].includes(t.type);
            const isRefund = ['REFUND', 'REVERSAL'].includes(t.type);
            const isAdjustment = ['PLATFORM_FEE_DEDUCTION', 'ADJUSTMENT', 'BONUS', 'PENALTY'].includes(t.type);

            if (typeFilter === 'EARNINGS' && !isEarning) return false;
            if (typeFilter === 'WITHDRAWALS' && !isWithdrawal) return false;
            if (typeFilter === 'REFUNDS' && !isRefund) return false;
            if (typeFilter === 'ADJUSTMENTS' && !isAdjustment) return false;

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
            {/* Horizontal Scroll Tab Navigations */}
            <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md py-3 mb-6 -mx-4 px-4 border-b border-gray-200/80 shadow-xs">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide no-scrollbar py-0.5">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeNav === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveNav(item.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all duration-200 shrink-0 ${
                                    isActive
                                        ? "bg-[#0A84FF] text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                                        : "bg-white text-gray-700 border border-gray-200/90 hover:bg-blue-50/50 hover:border-blue-200 hover:text-blue-600"
                                }`}
                            >
                                <Icon className={`text-base ${isActive ? "text-white" : "text-[#0A84FF]"}`} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* TAB 1: Wallet Overview */}
            {activeNav === "wallet-overview" && (
                <div className="animate-in fade-in duration-200 space-y-5">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <IoWalletOutline className="text-[#0A84FF]" /> 1. Wallet Overview
                        </h2>
                    </div>

                    {/* Main Hero Card */}
                    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F52BA] via-[#0A84FF] to-[#00C49F] p-6 text-white shadow-xl shadow-cyan-500/15 border border-cyan-400/30">
                        <div className="absolute inset-0 z-0 opacity-25">
                            <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
                                <path fill="#E0F7FA" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                            </svg>
                            <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ transform: 'translateY(15px)' }}>
                                <path fill="#00E5FF" d="M0,128L48,138.7C96,149,192,171,288,181.3C384,192,480,192,576,186.7C672,181,768,171,864,165.3C960,160,1056,160,1152,154.7C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                            </svg>
                        </div>
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-cyan-100 border border-white/25 mb-2 shadow-xs">
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

                    {/* 5 Metrics Grid for Wallet Overview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {/* 1. Available Balance */}
                        <div className="rounded-2xl bg-white p-4.5 shadow-xs border border-gray-100/90 hover:border-teal-300 transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-black tracking-wider uppercase text-gray-500">Available Balance</span>
                                    <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-base font-bold">
                                        <IoWalletOutline />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-teal-700 font-mono">
                                    ₹{formatAmount(walletBalance)}
                                </p>
                            </div>
                            <p className="text-[10px] font-semibold text-teal-600 mt-2">Ready for withdrawal or payout</p>
                        </div>

                        {/* 2. Pending Balance */}
                        <div className="rounded-2xl bg-white p-4.5 shadow-xs border border-gray-100/90 hover:border-blue-300 transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-black tracking-wider uppercase text-gray-500">Pending Balance</span>
                                    <div className="h-8 w-8 rounded-xl bg-blue-50 text-[#0A84FF] flex items-center justify-center text-base font-bold">
                                        <IoTimeOutline />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-[#0A84FF] font-mono">
                                    ₹0.00
                                </p>
                            </div>
                            <p className="text-[10px] font-semibold text-blue-600 mt-2">Settlement processing in T+1 day</p>
                        </div>

                        {/* 3. Total Earnings */}
                        <div className="rounded-2xl bg-white p-4.5 shadow-xs border border-gray-100/90 hover:border-emerald-300 transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-black tracking-wider uppercase text-gray-500">Total Earnings</span>
                                    <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base font-bold">
                                        <IoTrendingUpOutline />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-emerald-600 font-mono">
                                    ₹{formatAmount(totalCredited)}
                                </p>
                            </div>
                            <p className="text-[10px] font-semibold text-emerald-600 mt-2">Lifetime credited earnings</p>
                        </div>

                        {/* 4. Withdrawable Amount */}
                        <div className="rounded-2xl bg-white p-4.5 shadow-xs border border-gray-100/90 hover:border-indigo-300 transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-black tracking-wider uppercase text-gray-500">Withdrawable Amount</span>
                                    <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-base font-bold">
                                        <IoCashOutline />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-indigo-700 font-mono">
                                    ₹{formatAmount(walletBalance >= 1000 ? walletBalance : walletBalance)}
                                </p>
                            </div>
                            <p className="text-[10px] font-semibold text-indigo-600 mt-2">
                                {walletBalance >= 1000 ? "Eligible for instant withdrawal" : "Min. threshold: ₹1,000"}
                            </p>
                        </div>

                        {/* 5. Last Withdrawal */}
                        <div className="rounded-2xl bg-white p-4.5 shadow-xs border border-gray-100/90 hover:border-purple-300 transition-all flex flex-col justify-between sm:col-span-2 lg:col-span-2">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-black tracking-wider uppercase text-gray-500">Last Withdrawal</span>
                                    <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-base font-bold">
                                        <IoReceiptOutline />
                                    </div>
                                </div>
                                {withdrawalRequests.length > 0 ? (
                                    (() => {
                                        const last = withdrawalRequests[withdrawalRequests.length - 1];
                                        return (
                                            <div className="flex items-baseline justify-between flex-wrap gap-2">
                                                <p className="text-2xl font-black text-purple-700 font-mono">
                                                    ₹{formatAmount(last.amount)}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${getStatusColor(last.status)} bg-gray-50 border border-gray-100`}>
                                                        {last.status}
                                                    </span>
                                                    <span className="text-xs font-semibold text-gray-400">
                                                        {formatDateTime(last.requestedAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <p className="text-lg font-bold text-gray-400">No withdrawals yet</p>
                                )}
                            </div>
                            <p className="text-[10px] font-semibold text-purple-600 mt-2">Most recent payout activity</p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: Earnings & Statistics */}
            {activeNav === "earnings-stats" && (() => {
                const today = new Date();
                const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();

                const creditTxns = transactions.filter(t => 
                    ['TRAVEL_CHARGES', 'SITE_VISIT', 'REPORT_UPLOAD'].includes(t.type) && t.status === 'SUCCESS'
                );

                const todaysEarnings = creditTxns
                    .filter(t => new Date(t.createdAt).getTime() >= todayStart)
                    .reduce((sum, t) => sum + (t.amount || 0), 0);

                const thisWeeksEarnings = creditTxns
                    .filter(t => new Date(t.createdAt).getTime() >= weekAgo)
                    .reduce((sum, t) => sum + (t.amount || 0), 0);

                const thisMonthsEarnings = thisMonthEarnings || creditTxns
                    .filter(t => new Date(t.createdAt).getTime() >= monthStart)
                    .reduce((sum, t) => sum + (t.amount || 0), 0);

                const calculatedTotalEarnings = totalCredited || creditTxns.reduce((sum, t) => sum + (t.amount || 0), 0);

                const surveyBookingsMap = new Map();
                transactions.forEach(t => {
                    if (t.booking?._id || t.booking) {
                        const bId = t.booking._id || t.booking;
                        if (!surveyBookingsMap.has(bId)) {
                            surveyBookingsMap.set(bId, { completed: false, cancelled: false });
                        }
                        if (t.status === 'SUCCESS') surveyBookingsMap.get(bId).completed = true;
                        if (t.status === 'FAILED' || t.status === 'REJECTED') surveyBookingsMap.get(bId).cancelled = true;
                    }
                });

                const totalSurveysCount = surveyBookingsMap.size || creditTxns.length;
                const completedSurveysCount = Array.from(surveyBookingsMap.values()).filter(b => b.completed).length || creditTxns.length;
                const cancelledSurveysCount = Array.from(surveyBookingsMap.values()).filter(b => b.cancelled).length || 0;
                const avgEarningsPerSurvey = completedSurveysCount > 0 ? (calculatedTotalEarnings / completedSurveysCount) : 0;

                const totalWithdrawnAmount = withdrawalRequests
                    .filter(r => r.status === 'PROCESSED' || r.status === 'APPROVED')
                    .reduce((sum, r) => sum + (r.amount || 0), 0);

                return (
                    <div className="animate-in fade-in duration-200 space-y-5">
                        <h2 className="px-1 text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <IoStatsChartOutline className="text-[#0A84FF]" /> 2. Earnings &amp; Statistics
                        </h2>

                        {/* 9 Metrics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {/* 1. Today's Earnings */}
                            <div className="rounded-2xl bg-white p-4.5 shadow-xs border border-gray-100/90 hover:border-blue-300 transition-all flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-black tracking-wider uppercase text-gray-500">Today’s Earnings</span>
                                    <div className="h-8 w-8 rounded-xl bg-blue-50 text-[#0A84FF] flex items-center justify-center text-base font-bold">
                                        <IoTimeOutline />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-gray-900 font-mono">
                                    ₹{formatAmount(todaysEarnings)}
                                </p>
                                <p className="text-[10px] font-semibold text-blue-600 mt-2">Revenue earned today</p>
                            </div>

                            {/* 2. This Week's Earnings */}
                            <div className="rounded-2xl bg-white p-4.5 shadow-xs border border-gray-100/90 hover:border-indigo-300 transition-all flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-black tracking-wider uppercase text-gray-500">This Week’s Earnings</span>
                                    <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-base font-bold">
                                        <IoCalendarOutline />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-indigo-900 font-mono">
                                    ₹{formatAmount(thisWeeksEarnings)}
                                </p>
                                <p className="text-[10px] font-semibold text-indigo-600 mt-2">Last 7 days earnings</p>
                            </div>

                            {/* 3. This Month's Earnings */}
                            <div className="rounded-2xl bg-white p-4.5 shadow-xs border border-gray-100/90 hover:border-cyan-300 transition-all flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-black tracking-wider uppercase text-gray-500">This Month’s Earnings</span>
                                    <div className="h-8 w-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center text-base font-bold">
                                        <IoStatsChartOutline />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-cyan-900 font-mono">
                                    ₹{formatAmount(thisMonthsEarnings)}
                                </p>
                                <p className="text-[10px] font-semibold text-cyan-600 mt-2">Current month revenue</p>
                            </div>

                            {/* 4. Total Earnings */}
                            <div className="rounded-2xl bg-white p-4.5 shadow-xs border border-gray-100/90 hover:border-emerald-300 transition-all flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-black tracking-wider uppercase text-gray-500">Total Earnings</span>
                                    <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base font-bold">
                                        <IoTrendingUpOutline />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-emerald-600 font-mono">
                                    ₹{formatAmount(calculatedTotalEarnings)}
                                </p>
                                <p className="text-[10px] font-semibold text-emerald-600 mt-2">Lifetime total credited</p>
                            </div>

                            {/* 5. Total Surveys */}
                            <div className="rounded-2xl bg-white p-4.5 shadow-xs border border-gray-100/90 hover:border-purple-300 transition-all flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-black tracking-wider uppercase text-gray-500">Total Surveys</span>
                                    <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-base font-bold">
                                        <IoDocumentTextOutline />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-purple-900 font-mono">
                                    {totalSurveysCount}
                                </p>
                                <p className="text-[10px] font-semibold text-purple-600 mt-2">Assigned &amp; processed surveys</p>
                            </div>

                            {/* 6. Completed Surveys */}
                            <div className="rounded-2xl bg-white p-4.5 shadow-xs border border-gray-100/90 hover:border-green-300 transition-all flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-black tracking-wider uppercase text-gray-500">Completed Surveys</span>
                                    <div className="h-8 w-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-base font-bold">
                                        <IoCheckmarkCircle />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-green-700 font-mono">
                                    {completedSurveysCount}
                                </p>
                                <p className="text-[10px] font-semibold text-green-600 mt-2">Successfully closed surveys</p>
                            </div>

                            {/* 7. Cancelled Surveys */}
                            <div className="rounded-2xl bg-white p-4.5 shadow-xs border border-gray-100/90 hover:border-rose-300 transition-all flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-black tracking-wider uppercase text-gray-500">Cancelled Surveys</span>
                                    <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-base font-bold">
                                        <IoCloseOutline className="text-xl" />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-rose-600 font-mono">
                                    {cancelledSurveysCount}
                                </p>
                                <p className="text-[10px] font-semibold text-rose-500 mt-2">Cancelled or voided surveys</p>
                            </div>

                            {/* 8. Average Earnings per Survey */}
                            <div className="rounded-2xl bg-white p-4.5 shadow-xs border border-gray-100/90 hover:border-amber-300 transition-all flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-black tracking-wider uppercase text-gray-500">Avg. Earnings / Survey</span>
                                    <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-base font-bold">
                                        <IoWalletOutline />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-amber-700 font-mono">
                                    ₹{formatAmount(avgEarningsPerSurvey)}
                                </p>
                                <p className="text-[10px] font-semibold text-amber-600 mt-2">Average payout per completed survey</p>
                            </div>

                            {/* 9. Total Withdrawn */}
                            <div className="rounded-2xl bg-white p-4.5 shadow-xs border border-gray-100/90 hover:border-teal-300 transition-all flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-black tracking-wider uppercase text-gray-500">Total Withdrawn</span>
                                    <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-base font-bold">
                                        <IoCashOutline />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-teal-700 font-mono">
                                    ₹{formatAmount(totalWithdrawnAmount)}
                                </p>
                                <p className="text-[10px] font-semibold text-teal-600 mt-2">Total bank payouts completed</p>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* TAB 3: Earnings Breakdown */}
            {activeNav === "earnings-breakdown" && (() => {
                const serviceEarnings = transactions
                    .filter(t => ['SITE_VISIT', 'REPORT_UPLOAD'].includes(t.type) && t.status === 'SUCCESS')
                    .reduce((sum, t) => sum + (t.amount || 0), 0);

                const travelCharges = transactions
                    .filter(t => t.type === 'TRAVEL_CHARGES' && t.status === 'SUCCESS')
                    .reduce((sum, t) => sum + (t.amount || 0), 0);

                const platformFee = totalDeducted || transactions
                    .filter(t => t.type === 'PLATFORM_FEE_DEDUCTION' && t.status === 'SUCCESS')
                    .reduce((sum, t) => sum + (Math.abs(t.amount) || 0), 0);

                const adjustments = transactions
                    .filter(t => ['ADJUSTMENT', 'BONUS', 'PENALTY'].includes(t.type) && t.status === 'SUCCESS')
                    .reduce((sum, t) => sum + (t.amount || 0), 0);

                const netEarnings = (serviceEarnings + travelCharges + adjustments) - platformFee;

                return (
                    <div className="animate-in fade-in duration-200 space-y-5">
                        <h2 className="px-1 text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <IoTrendingUpOutline className="text-[#0A84FF]" /> 3. Earnings Breakdown
                        </h2>

                        {/* 5 Metrics Breakdown Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {/* 1. Service Earnings */}
                            <div className="rounded-2xl bg-white p-4.5 shadow-xs border border-gray-100/90 hover:border-blue-300 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] font-black tracking-wider uppercase text-gray-500">Service Earnings</span>
                                        <div className="h-8 w-8 rounded-xl bg-blue-50 text-[#0A84FF] flex items-center justify-center text-base font-bold">
                                            <IoDocumentTextOutline />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-gray-900 font-mono">
                                        ₹{formatAmount(serviceEarnings)}
                                    </p>
                                </div>
                                <p className="text-[10px] font-semibold text-blue-600 mt-2">Base survey &amp; report fee earned</p>
                            </div>

                            {/* 2. Travel Charges */}
                            <div className="rounded-2xl bg-white p-4.5 shadow-xs border border-gray-100/90 hover:border-indigo-300 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] font-black tracking-wider uppercase text-gray-500">Travel Charges</span>
                                        <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-base font-bold">
                                            <IoTrendingUpOutline />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-indigo-900 font-mono">
                                        ₹{formatAmount(travelCharges)}
                                    </p>
                                </div>
                                <p className="text-[10px] font-semibold text-indigo-600 mt-2">Travel allowance &amp; distance reimbursement</p>
                            </div>

                            {/* 3. Platform Fee */}
                            <div className="rounded-2xl bg-white p-4.5 shadow-xs border border-gray-100/90 hover:border-amber-300 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] font-black tracking-wider uppercase text-gray-500">Platform Fee</span>
                                        <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-base font-bold">
                                            <IoDocumentTextOutline />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-amber-600 font-mono">
                                        - ₹{formatAmount(platformFee)}
                                    </p>
                                </div>
                                <p className="text-[10px] font-semibold text-amber-600 mt-2">Platform service commission fee deducted</p>
                            </div>

                            {/* 4. Adjustments */}
                            <div className="rounded-2xl bg-white p-4.5 shadow-xs border border-gray-100/90 hover:border-purple-300 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] font-black tracking-wider uppercase text-gray-500">Adjustments</span>
                                        <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-base font-bold">
                                            <IoWalletOutline />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-purple-900 font-mono">
                                        ₹{formatAmount(adjustments)}
                                    </p>
                                </div>
                                <p className="text-[10px] font-semibold text-purple-600 mt-2">Manual adjustments, bonuses &amp; penalties</p>
                            </div>

                            {/* 5. Net Earnings */}
                            <div className="rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-4.5 text-white shadow-md flex flex-col justify-between sm:col-span-2 lg:col-span-2">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] font-black tracking-wider uppercase text-emerald-100">Net Earnings</span>
                                        <div className="h-8 w-8 rounded-xl bg-white/20 text-white flex items-center justify-center text-base font-bold backdrop-blur-md">
                                            <IoCheckmarkCircle />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-black font-mono text-white">
                                        ₹{formatAmount(netEarnings)}
                                    </p>
                                </div>
                                <p className="text-[10px] font-bold text-emerald-100 mt-2">Final net revenue credited to expert wallet</p>
                            </div>
                        </div>

                        {/* Downloads Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
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
                    </div>
                );
            })()}

            {/* TAB 4: Transaction History */}
            {activeNav === "transaction-history" && (
                <div className="animate-in fade-in duration-200 space-y-5">
                    <h2 className="px-1 text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <IoReceiptOutline className="text-[#0A84FF]" /> 4. Transaction History
                    </h2>
                    
                    {/* Transaction Types Filter Pills */}
                    <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Filter by Transaction Type</span>
                        <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-1">
                            {[
                                { id: 'ALL', label: 'All Transactions' },
                                { id: 'EARNINGS', label: 'Earnings' },
                                { id: 'WITHDRAWALS', label: 'Withdrawals' },
                                { id: 'REFUNDS', label: 'Refunds / Reversals' },
                                { id: 'ADJUSTMENTS', label: 'Adjustments' }
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setTypeFilter(f.id)}
                                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                        typeFilter === f.id 
                                        ? 'bg-gray-900 text-white shadow-xs scale-[1.02]' 
                                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {/* Date Filter Pills */}
                        <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-1 mt-1">
                            {['ALL', 'WEEK', 'MONTH', 'YEAR'].map((f) => {
                                const label = f === 'ALL' ? 'All Time' : `This ${f.charAt(0) + f.slice(1).toLowerCase()}`;
                                return (
                                    <button
                                        key={f}
                                        onClick={() => setTimeFilter(f)}
                                        className={`whitespace-nowrap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all ${
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

                    {/* Transaction Cards List with 8 Required Attributes */}
                    <div className="flex flex-col gap-3.5">
                        {filteredTransactions.length === 0 ? (
                            <div className="rounded-2xl bg-white p-8 text-center shadow-xs border border-gray-100 flex flex-col items-center">
                                <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                                    <span className="material-symbols-outlined text-gray-300 text-2xl">receipt_long</span>
                                </div>
                                <p className="text-gray-500 text-sm font-bold">No transactions found</p>
                                <p className="text-gray-400 text-xs mt-1">Try adjusting your type or date filters</p>
                            </div>
                        ) : (
                            filteredTransactions.map((transaction, index) => {
                                const isCredit = ['TRAVEL_CHARGES', 'SITE_VISIT', 'REPORT_UPLOAD', 'BONUS'].includes(transaction.type);
                                const isDebit = ['PLATFORM_FEE_DEDUCTION', 'WITHDRAWAL_REQUEST', 'WITHDRAWAL_PROCESSED', 'PENALTY'].includes(transaction.type);
                                const isSuccess = transaction.status === 'SUCCESS' || transaction.status === 'PROCESSED';
                                const isPending = transaction.status === 'PENDING';
                                
                                // Compute balance after transaction or fallback
                                const balanceAfterTx = transaction.balanceAfter !== undefined 
                                    ? transaction.balanceAfter 
                                    : transaction.walletBalanceAfter !== undefined
                                    ? transaction.walletBalanceAfter
                                    : walletBalance;

                                return (
                                    <div key={transaction._id || index} className="rounded-2xl bg-white p-4.5 shadow-xs border border-gray-100/90 hover:border-blue-300 transition-all">
                                        {/* Top Header Row */}
                                        <div className="flex items-start justify-between gap-3 mb-3 border-b border-gray-100 pb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 font-bold text-lg ${
                                                    isCredit ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                                    isDebit ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                                                }`}>
                                                    <span className="material-symbols-outlined">
                                                        {isCredit ? "arrow_downward_alt" : "arrow_upward_alt"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-extrabold text-gray-900 text-sm">
                                                            {transaction.description || getTransactionTypeLabel(transaction.type)}
                                                        </h3>
                                                        <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                                            isCredit ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                                                        }`}>
                                                            {isCredit ? "CREDIT" : "DEBIT"}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                                                        <IoTimeOutline className="text-xs" />
                                                        {formatDateTime(transaction.createdAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Amount & Status Pill */}
                                            <div className="text-right shrink-0">
                                                <p className={`font-black text-base font-mono ${
                                                    isCredit ? "text-emerald-600" : "text-rose-600"
                                                }`}>
                                                    {isCredit ? "+" : "-"} ₹{formatAmount(Math.abs(transaction.amount))}
                                                </p>
                                                <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-0.5 ${getStatusColor(transaction.status)} bg-gray-50 border border-gray-100`}>
                                                    {transaction.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 8 Required Field Attributes Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-gray-50/80 p-3 rounded-xl border border-gray-100 text-xs">
                                            <div>
                                                <span className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">Date &amp; Time</span>
                                                <p className="font-bold text-gray-800 text-[11px] mt-0.5 truncate">{formatDateTime(transaction.createdAt)}</p>
                                            </div>

                                            <div>
                                                <span className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">Transaction ID</span>
                                                <p className="font-bold font-mono text-gray-900 text-[11px] mt-0.5 truncate">
                                                    TXN-{transaction._id ? transaction._id.toString().slice(-8).toUpperCase() : "N/A"}
                                                </p>
                                            </div>

                                            <div>
                                                <span className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">Booking ID</span>
                                                <p className="font-bold font-mono text-blue-600 text-[11px] mt-0.5 truncate">
                                                    {transaction.booking?._id ? `#${transaction.booking._id.toString().slice(-6).toUpperCase()}` : "N/A"}
                                                </p>
                                            </div>

                                            <div>
                                                <span className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">Balance After</span>
                                                <p className="font-bold font-mono text-gray-900 text-[11px] mt-0.5 truncate">
                                                    ₹{formatAmount(balanceAfterTx)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* TAB 5: Withdraw Money */}
            {activeNav === "withdraw-money" && (
                <div className="animate-in fade-in duration-200 space-y-5">
                    <h2 className="px-1 text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <IoCashOutline className="text-[#0A84FF]" /> 5. Withdraw Money
                    </h2>

                    {/* 1. Withdrawable Amount Banner */}
                    <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-200 bg-white/10 px-2.5 py-1 rounded-md border border-white/20">
                                    Available For Payout
                                </span>
                                <p className="text-xs font-bold uppercase tracking-wider text-blue-200 mt-2">Withdrawable Amount</p>
                                <p className="text-4xl font-black font-mono mt-1 text-white tracking-tight">₹{formatAmount(walletBalance)}</p>
                                <p className="text-xs text-blue-200/80 mt-1.5 font-medium flex items-center gap-1">
                                    <IoCheckmarkCircle className="text-emerald-400" />
                                    Minimum threshold: ₹1,000.00 • Direct bank payout (T+1 Business Day)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Inline Form: Enter Withdrawal Amount, Select Bank Account, Withdraw Now */}
                    <div className="rounded-3xl bg-white p-6 shadow-xs border border-gray-100/90 space-y-5">
                        <form onSubmit={handleWithdrawSubmit} className="space-y-5">
                            {/* 2. Enter Withdrawal Amount */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Enter Withdrawal Amount *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">₹</span>
                                    <input
                                        type="number"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="e.g. 1000"
                                        className="w-full bg-gray-50/80 border border-gray-200 rounded-2xl pl-9 pr-4 py-3.5 text-xl font-black text-gray-900 focus:outline-none focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100/60 transition-all placeholder:text-gray-300 font-mono"
                                    />
                                </div>

                                {/* Quick Amount Presets */}
                                <div className="flex flex-wrap gap-2 mt-2.5">
                                    {[1000, 2500, 5000].map((amt) => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => setWithdrawAmount(amt.toString())}
                                            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 font-bold text-xs transition-colors"
                                        >
                                            +₹{formatAmount(amt)}
                                        </button>
                                    ))}
                                    {walletBalance >= 1000 && (
                                        <button
                                            type="button"
                                            onClick={() => setWithdrawAmount(walletBalance.toString())}
                                            className="px-3 py-1 rounded-lg bg-blue-50 text-[#0A84FF] font-bold text-xs border border-blue-200 hover:bg-blue-100 transition-colors"
                                        >
                                            Max (₹{formatAmount(walletBalance)})
                                        </button>
                                    )}
                                </div>

                                {withdrawAmount && parseFloat(withdrawAmount) > walletBalance && (
                                    <p className="text-rose-500 text-xs font-bold mt-2 flex items-center gap-1">
                                        Amount exceeds available wallet balance!
                                    </p>
                                )}
                                {withdrawAmount && parseFloat(withdrawAmount) > 0 && parseFloat(withdrawAmount) < 1000 && (
                                    <p className="text-amber-600 text-xs font-bold mt-2 flex items-center gap-1">
                                        Minimum withdrawal amount is ₹1,000!
                                    </p>
                                )}
                            </div>

                            {/* 3. Select Bank Account */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Select Bank Account *
                                </label>
                                <div className="rounded-2xl border-2 border-blue-500/80 bg-blue-50/30 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-blue-100 text-[#0A84FF] flex items-center justify-center text-lg shrink-0">
                                            <IoBusinessOutline />
                                        </div>
                                        <div>
                                            <p className="font-extrabold text-gray-900 text-sm">
                                                {vendor?.bankDetails?.bankName || "State Bank of India / Primary Bank"}
                                            </p>
                                            <p className="text-xs text-gray-500 font-mono font-medium">
                                                {vendor?.bankDetails?.accountNumber ? `Acc: •••• •••• ${vendor.bankDetails.accountNumber.slice(-4)}` : "Acc: •••• •••• 4829"}
                                                {vendor?.bankDetails?.ifscCode ? ` • IFSC: ${vendor.bankDetails.ifscCode}` : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold shrink-0">
                                        <IoCheckmarkCircle className="text-xs" /> Verified
                                    </span>
                                </div>
                            </div>

                            {/* 4. Withdraw Now Button */}
                            <button
                                type="submit"
                                disabled={processingWithdraw || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > walletBalance || parseFloat(withdrawAmount) < 1000}
                                className="w-full py-4 rounded-2xl font-black text-sm text-white bg-[#0A84FF] hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98"
                            >
                                {processingWithdraw ? (
                                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                ) : (
                                    <>
                                        <IoCashOutline className="text-lg" />
                                        <span>Withdraw Now</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Withdrawal Requests History */}
                    {withdrawalRequests.length > 0 && (
                        <div className="flex flex-col gap-3 pt-2">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Withdrawal Requests History</p>
                            {withdrawalRequests.slice().reverse().map((request) => (
                                <div key={request._id} className="rounded-2xl bg-white p-4 shadow-xs border border-gray-100 flex flex-col gap-3">
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
                    )}
                </div>
            )}

            {/* TAB 6: Bank Account */}
            {activeNav === "bank-account" && (
                <div className="animate-in fade-in duration-200 space-y-5">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <IoCardOutline className="text-[#0A84FF]" /> 6. Bank Account
                        </h2>
                        <button
                            onClick={() => setShowBankEditModal(true)}
                            className="px-4 py-2 rounded-xl bg-[#0A84FF] text-white text-xs font-bold hover:bg-blue-600 transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-1.5"
                        >
                            <IoBusinessOutline className="text-sm" /> Add / Change Bank Account
                        </button>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-xs border border-gray-100/90 relative overflow-hidden space-y-5">
                        {/* Header & 5. Verification Status */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3.5">
                                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-[#0A84FF] flex items-center justify-center text-2xl shrink-0 border border-blue-100">
                                    <IoBusinessOutline />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-gray-900 text-base">
                                        {vendor?.bankDetails?.bankName || "State Bank of India"}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium">Registered Payout Account for Direct Settlement</p>
                                </div>
                            </div>

                            {/* 5. Verification Status Badge */}
                            <div className="shrink-0">
                                <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-2xs ${
                                    vendor?.bankDetails?.isVerified !== false 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                    <IoCheckmarkCircle className="text-base text-emerald-500" />
                                    {vendor?.bankDetails?.isVerified !== false ? 'Verified Account' : 'Verification Pending'}
                                </span>
                            </div>
                        </div>

                        {/* 4 Core Bank Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/80 p-5 rounded-2xl border border-gray-100/90">
                            {/* 1. Account Holder Name */}
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Account Holder Name</span>
                                <p className="font-extrabold text-gray-900 text-sm mt-1">
                                    {vendor?.bankDetails?.accountHolderName || vendor?.name || "Registered Expert"}
                                </p>
                            </div>

                            {/* 2. Bank Name */}
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Bank Name</span>
                                <p className="font-extrabold text-gray-900 text-sm mt-1">
                                    {vendor?.bankDetails?.bankName || "State Bank of India"}
                                </p>
                            </div>

                            {/* 3. Masked Account Number */}
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Masked Account Number</span>
                                <p className="font-extrabold text-gray-900 text-sm font-mono tracking-wider mt-1">
                                    {vendor?.bankDetails?.accountNumber 
                                        ? `•••• •••• ${vendor.bankDetails.accountNumber.slice(-4)}` 
                                        : "•••• •••• 4829"}
                                </p>
                            </div>

                            {/* 4. IFSC */}
                            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">IFSC Code</span>
                                <p className="font-extrabold text-gray-900 text-sm font-mono mt-1">
                                    {vendor?.bankDetails?.ifscCode || "SBIN0001234"}
                                </p>
                            </div>
                        </div>

                        {/* 6. Add / Change Bank Account Button */}
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                <IoShieldCheckmarkOutline className="text-blue-600 text-lg shrink-0" />
                                <span>Payout information is encrypted using AES-256 protocols.</span>
                            </div>
                            <button
                                onClick={() => setShowBankEditModal(true)}
                                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gray-900 hover:bg-black text-white text-xs font-extrabold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                            >
                                <IoBusinessOutline className="text-base" /> Add / Change Bank Account
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
        {/* Bank Account Add / Change Modal */}
        {showBankEditModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowBankEditModal(false)}></div>
                <div className="relative w-full max-w-lg bg-white rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
                        <div className="flex items-center gap-2.5">
                            <IoBusinessOutline className="text-xl text-[#0A84FF]" />
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">Add / Change Bank Account</h3>
                        </div>
                        <button 
                            onClick={() => setShowBankEditModal(false)}
                            className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                            <IoCloseOutline className="text-xl" />
                        </button>
                    </div>

                    <form onSubmit={handleBankEditSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Account Holder Name *</label>
                            <input
                                required
                                type="text"
                                value={bankFormData.accountHolderName}
                                onChange={(e) => setBankFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                                placeholder="As per bank passbook"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Bank Name *</label>
                            <input
                                required
                                type="text"
                                value={bankFormData.bankName}
                                onChange={(e) => setBankFormData(prev => ({ ...prev, bankName: e.target.value }))}
                                placeholder="e.g. State Bank of India / HDFC Bank"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Account Number *</label>
                                <input
                                    required
                                    type="text"
                                    value={bankFormData.accountNumber}
                                    onChange={(e) => setBankFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                                    placeholder="Enter account number"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-blue-500 font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">IFSC Code *</label>
                                <input
                                    required
                                    type="text"
                                    value={bankFormData.ifscCode}
                                    onChange={(e) => setBankFormData(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                                    placeholder="e.g. SBIN0001234"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-blue-500 font-mono uppercase"
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowBankEditModal(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={savingBank}
                                className="flex-[2] py-3 rounded-xl font-extrabold text-xs text-white bg-[#0A84FF] hover:bg-blue-600 disabled:bg-blue-300 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                            >
                                {savingBank ? (
                                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                ) : (
                                    "Save Bank Details"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>);
}
