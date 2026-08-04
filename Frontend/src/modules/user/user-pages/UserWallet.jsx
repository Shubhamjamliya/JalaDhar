import { useState, useEffect } from "react";
import { getUserWalletBalance, getUserWalletTransactions, createUserWithdrawalRequest } from "../../../services/userApi";
import { useAuth } from "../../../contexts/AuthContext";
import PageContainer from "../../shared/components/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError, handleApiSuccess } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";

export default function UserWallet() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [walletBalance, setWalletBalance] = useState(0);
    const [totalCredited, setTotalCredited] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [withdrawalRequests, setWithdrawalRequests] = useState([]);
    const toast = useToast();
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [processingWithdraw, setProcessingWithdraw] = useState(false);

    useEffect(() => {
        loadWalletData();
    }, []);

    const loadWalletData = async () => {
        try {
            setLoading(true);
            
            // Get wallet balance and summary
            const balanceResponse = await getUserWalletBalance();
            if (balanceResponse.success) {
                setWalletBalance(balanceResponse.data.walletBalance || 0);
                setTotalCredited(balanceResponse.data.totalCredited || 0);
                setWithdrawalRequests(balanceResponse.data.withdrawalRequests || []);
            }

            // Get transaction history
            const transactionsResponse = await getUserWalletTransactions({ limit: 20 });
            if (transactionsResponse.success) {
                setTransactions(transactionsResponse.data.transactions || []);
            }
        } catch (err) {
            handleApiError(err, "Failed to load wallet data");
        } finally {
            setLoading(false);
        }
    };

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
                        <span>💧 Jaladhaara Hydro-Wallet</span>
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
                <>
                    <h2 className="px-1 pt-2 pb-3 text-lg font-black text-gray-900 tracking-tight">Withdrawal Requests</h2>
                    <div className="flex flex-col gap-3 mb-6">
                        {withdrawalRequests.slice().reverse().map((request) => (
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
                </>
            )}

            {/* Transaction History */}
            <h2 className="px-1 pt-2 pb-3 text-lg font-black text-gray-900 tracking-tight">Transaction History</h2>
            <div className="flex flex-col gap-3">
                {transactions.length === 0 ? (
                    <div className="rounded-2xl bg-white p-8 text-center shadow-xs border border-gray-100">
                        <p className="text-gray-500 text-sm font-semibold">No transactions recorded yet</p>
                    </div>
                ) : (
                    transactions.map((transaction) => {
                        const isCredit = transaction.type === 'REFUND';
                        const isWithdrawal = ['WITHDRAWAL_REQUEST', 'WITHDRAWAL_PROCESSED', 'WITHDRAWAL_REJECTED'].includes(transaction.type);
                        const isSuccess = transaction.status === 'SUCCESS';
                        const isPending = transaction.status === 'PENDING';
                        
                        return (
                            <div
                                key={transaction._id}
                                className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-xs border border-gray-100 hover:border-blue-300 transition-all"
                            >
                                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 ${
                                    isSuccess ? (isCredit ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : isWithdrawal ? "bg-blue-50 text-[#0A84FF] border border-blue-100" : "bg-gray-50 text-gray-500") : 
                                    isPending ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                                }`}>
                                    <span className="material-symbols-outlined font-bold text-xl">
                                        {isCredit ? "arrow_downward_alt" : isWithdrawal ? "account_balance_wallet" : "info"}
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
                                    {transaction.description && (
                                        <p className="text-xs text-gray-500 mt-0.5 italic">
                                            {transaction.description}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={`font-extrabold text-sm ${
                                        isSuccess ? (isCredit ? "text-emerald-600" : isWithdrawal ? "text-[#0A84FF]" : "text-gray-700") : 
                                        isPending ? "text-amber-600" : "text-rose-600"
                                    }`}>
                                        {isCredit ? "+" : isWithdrawal ? "-" : ""} ₹{formatAmount(Math.abs(transaction.amount))}
                                    </p>
                                    <span className={`inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 ${getStatusColor(transaction.status)}`}>
                                        {transaction.status}
                                    </span>
                                </div>
                            </div>
                        );
                    })
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
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Withdrawal Amount <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder={`Min: ₹1,000 | Max: ₹${formatAmount(walletBalance)}`}
                                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-[#0A84FF] outline-none text-sm font-semibold text-slate-800"
                                    required
                                />
                            </div>
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
                                disabled={processingWithdraw}
                                className="flex-1 py-3 px-4 rounded-2xl font-bold text-white bg-gradient-to-r from-[#0A84FF] to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all text-xs shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
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

