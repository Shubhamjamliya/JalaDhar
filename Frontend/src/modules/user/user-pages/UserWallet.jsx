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
    const [thisMonthEarnings, setThisMonthEarnings] = useState(0);
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
                setThisMonthEarnings(balanceResponse.data.thisMonthEarnings || 0);
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

    const handleWithdrawClick = () => {
        if (walletBalance >= 1000) {
            setShowWithdrawModal(true);
            setWithdrawAmount("");
        } else {
            toast.showError("Minimum withdrawal amount is ₹1,000");
        }
    };

    const handleWithdrawSubmit = async () => {
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
            const response = await createUserWithdrawalRequest(amount);
            if (response.success) {
                handleApiSuccess(response, "Withdrawal request submitted successfully!");
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
            {/* Total Balance Card */}
            <section className="relative my-4 overflow-hidden rounded-xl bg-gradient-to-br from-[#1A80E5] to-[#26D7C4] p-6 text-white shadow-md">
                <div className="absolute inset-0 z-0 opacity-10">
                    <img 
                        className="h-full w-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSWOEOG7ry6z14TFWGAz7PjaKTwn697LggEX4Vf1U2F-18-Yl362M1a0XmrCPrnxjq3HLvvisiIPbnCcLWbicHHyQVehSZEC56qo5fvTVnSjPmEPPFLj9dncg63DYDUscFj51kK5mnPvn7hznGuHDuYjMiSWsX7r6Nlpe1ss-SQVtV_G_yADjJFZVcqSA8EGeUz4tjBJlabT7hxamjtW25RfdT9g0K2O82ATNS4J1em3nBru9nIKr4YnD72XMjXgETg4PCKTSCxEva"
                        alt="Background"
                    />
                </div>
                <div className="relative z-10 flex flex-col items-center text-center">
                    <p className="text-sm font-medium opacity-80">Wallet Balance</p>
                    <p className="mt-1 text-5xl font-extrabold tracking-tighter">
                        ₹{formatAmount(walletBalance)}
                    </p>
                    {walletBalance >= 1000 && (
                        <button
                            onClick={handleWithdrawClick}
                            className="mt-4 w-full max-w-xs rounded-full bg-white/20 px-8 py-3 font-bold text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
                        >
                            Request Withdrawal
                        </button>
                    )}
                </div>
            </section>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                <div className="rounded-lg bg-white p-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <span className="material-symbols-outlined text-[#00C2A8] !text-2xl">payments</span>
                    <p className="mt-2 text-xs text-[#6B7280]">Total Refunded</p>
                    <p className="mt-0.5 text-sm font-bold text-[#3A3A3A]">
                        ₹{formatAmount(totalCredited)}
                    </p>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <span className="material-symbols-outlined text-[#00C2A8] !text-2xl">calendar_month</span>
                    <p className="mt-2 text-xs text-[#6B7280]">This Month</p>
                    <p className="mt-0.5 text-sm font-bold text-[#3A3A3A]">
                        ₹{formatAmount(thisMonthEarnings)}
                    </p>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <span className="material-symbols-outlined text-[#00C2A8] !text-2xl">account_balance_wallet</span>
                    <p className="mt-2 text-xs text-[#6B7280]">Available Balance</p>
                    <p className="mt-0.5 text-sm font-bold text-[#3A3A3A]">
                        ₹{formatAmount(walletBalance)}
                    </p>
                </div>
            </div>

            {/* Withdrawal Requests */}
            {withdrawalRequests.length > 0 && (
                <>
                    <h2 className="px-2 pt-4 pb-3 text-lg font-bold text-[#3A3A3A]">Withdrawal Requests</h2>
                    <div className="flex flex-col gap-3 mb-6">
                        {withdrawalRequests.slice().reverse().map((request) => (
                            <div
                                key={request._id}
                                className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                            >
                                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                                    request.status === 'PROCESSED' ? 'bg-green-100' :
                                    request.status === 'APPROVED' ? 'bg-blue-100' :
                                    request.status === 'REJECTED' ? 'bg-red-100' : 'bg-yellow-100'
                                }`}>
                                    <span className={`material-symbols-outlined ${
                                        request.status === 'PROCESSED' ? 'text-[#34C759]' :
                                        request.status === 'APPROVED' ? 'text-blue-500' :
                                        request.status === 'REJECTED' ? 'text-red-500' : 'text-[#FF9F0A]'
                                    }`}>
                                        {request.status === 'PROCESSED' ? 'check_circle' :
                                         request.status === 'REJECTED' ? 'cancel' : 'pending'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-[#3A3A3A]">
                                        Withdrawal Request
                                    </p>
                                    <p className="text-xs text-[#6B7280]">
                                        {formatDateTime(request.requestedAt)}
                                    </p>
                                    {request.rejectionReason && (
                                        <p className="text-xs text-red-500 mt-1">
                                            Reason: {request.rejectionReason}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-[#3A3A3A]">
                                        ₹{formatAmount(request.amount)}
                                    </p>
                                    <p className={`text-xs font-medium ${getStatusColor(request.status)}`}>
                                        {request.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Transaction History */}
            <h2 className="px-2 pt-4 pb-3 text-lg font-bold text-[#3A3A3A]">Transaction History</h2>
            <div className="flex flex-col gap-3">
                {transactions.length === 0 ? (
                    <div className="rounded-lg bg-white p-8 text-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                        <p className="text-[#6B7280] text-sm">No transactions yet</p>
                    </div>
                ) : (
                    transactions.map((transaction) => {
                        const isCredit = transaction.type === 'REFUND';
                        const isWithdrawal = ['WITHDRAWAL_REQUEST', 'WITHDRAWAL_PROCESSED', 'WITHDRAWAL_REJECTED'].includes(transaction.type);
                        const isSuccess = transaction.status === 'SUCCESS';
                        const isPending = transaction.status === 'PENDING';
                        const isFailed = transaction.status === 'FAILED';
                        
                        return (
                            <div
                                key={transaction._id}
                                className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                            >
                                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                                    isSuccess ? (isCredit ? "bg-green-100" : isWithdrawal ? "bg-blue-100" : "bg-gray-100") : 
                                    isPending ? "bg-yellow-100" : "bg-red-100"
                                }`}>
                                    <span className={`material-symbols-outlined ${
                                        isSuccess ? (isCredit ? "text-[#34C759]" : isWithdrawal ? "text-blue-500" : "text-gray-500") : 
                                        isPending ? "text-[#FF9F0A]" : "text-red-500"
                                    }`}>
                                        {isCredit ? "arrow_downward_alt" : isWithdrawal ? "account_balance_wallet" : "info"}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-[#3A3A3A]">
                                        {getTransactionTypeLabel(transaction.type)}
                                    </p>
                                    <p className="text-xs text-[#6B7280]">
                                        {formatDateTime(transaction.createdAt)}
                                    </p>
                                    {transaction.booking && (
                                        <p className="text-xs text-[#6B7280] mt-0.5">
                                            Booking #{transaction.booking._id?.toString().slice(-8).toUpperCase()}
                                        </p>
                                    )}
                                    {transaction.description && (
                                        <p className="text-xs text-[#6B7280] mt-0.5 italic">
                                            {transaction.description}
                                        </p>
                                    )}
                                    {transaction.errorMessage && (
                                        <p className="text-xs text-red-500 mt-0.5">
                                            Error: {transaction.errorMessage}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${
                                        isSuccess ? (isCredit ? "text-[#34C759]" : isWithdrawal ? "text-blue-500" : "text-gray-500") : 
                                        isPending ? "text-[#FF9F0A]" : "text-red-500"
                                    }`}>
                                        {isCredit ? "+" : isWithdrawal ? "-" : ""} ₹{formatAmount(Math.abs(transaction.amount))}
                                    </p>
                                    <p className={`text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                        {transaction.status}
                                    </p>
                                    {transaction.balanceAfter !== undefined && (
                                        <p className="text-xs text-[#6B7280] mt-0.5">
                                            Balance: ₹{formatAmount(transaction.balanceAfter)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </PageContainer>

        {/* Withdrawal Request Modal */}
        <InputModal
            isOpen={showWithdrawModal}
            onClose={() => {
                setShowWithdrawModal(false);
                setWithdrawAmount("");
            }}
            onSubmit={handleWithdrawSubmit}
            title="Request Withdrawal"
            label="Withdrawal Amount"
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder={`Min: ₹1,000 | Max: ₹${formatAmount(walletBalance)}`}
            submitText="Submit Request"
            cancelText="Cancel"
            isLoading={processingWithdraw}
            validation={(value) => {
                const amount = parseFloat(value);
                if (!amount || amount <= 0) return "Please enter a valid amount";
                if (amount < 1000) return "Minimum withdrawal amount is ₹1,000";
                if (amount > walletBalance) return "Insufficient wallet balance";
                return null;
            }}
        />
    </>);
}

