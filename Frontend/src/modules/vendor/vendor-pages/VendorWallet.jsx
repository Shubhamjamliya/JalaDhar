import { useState, useEffect } from "react";
import { getDashboardStats, getBookingHistory } from "../../../services/vendorApi";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import PageContainer from "../../shared/components/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";

export default function VendorWallet() {
    const { vendor } = useVendorAuth();
    const [loading, setLoading] = useState(true);
    const [paymentCollection, setPaymentCollection] = useState({
        totalEarnings: 0,
        pendingAmount: 0,
        collectedAmount: 0
    });
    const [transactions, setTransactions] = useState([]);
    const toast = useToast();
    const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

    useEffect(() => {
        loadWalletData();
    }, []);

    const loadWalletData = async () => {
        try {
            setLoading(true);
            
            // Get dashboard stats for payment collection
            const statsResponse = await getDashboardStats();
            if (statsResponse.success) {
                setPaymentCollection(statsResponse.data.stats.paymentCollection || {
                    totalEarnings: 0,
                    pendingAmount: 0,
                    collectedAmount: 0
                });
            }

            // Get all bookings for transactions - fetch more to get all user payments
            const bookingsResponse = await getBookingHistory({ 
                limit: 100,
                sortBy: "createdAt",
                sortOrder: "desc"
            });
            
            if (bookingsResponse.success) {
                const allBookings = bookingsResponse.data.bookings || [];
                const transactionList = [];
                
                // Extract user payments from each booking
                allBookings.forEach((booking) => {
                    const bookingId = booking._id.toString().slice(-8).toUpperCase();
                    
                    // 1. User Advance Payment (40%) - When user pays advance
                    if (booking.payment?.advancePaid && booking.payment?.advanceAmount > 0) {
                        transactionList.push({
                            id: `${booking._id}_advance`,
                            date: booking.payment.advancePaidAt || booking.createdAt,
                            bookingId: bookingId,
                            amount: booking.payment.advanceAmount,
                            status: booking.payment.status === "SUCCESS" ? "completed" : "pending",
                            type: "advance_payment",
                            description: "Advance Payment (40%)",
                            user: booking.user?.name || "Customer"
                        });
                    }
                    
                    // 2. User Remaining Payment (60%) - When user pays remaining amount
                    if (booking.payment?.remainingPaid && booking.payment?.remainingAmount > 0) {
                        transactionList.push({
                            id: `${booking._id}_remaining`,
                            date: booking.payment.remainingPaidAt || booking.updatedAt || booking.createdAt,
                            bookingId: bookingId,
                            amount: booking.payment.remainingAmount,
                            status: booking.payment.status === "SUCCESS" ? "completed" : "pending",
                            type: "remaining_payment",
                            description: "Remaining Payment (60%)",
                            user: booking.user?.name || "Customer"
                        });
                    }
                    
                    // 3. Vendor Settlement (COMPLETED) - When admin pays vendor
                    if (booking.payment?.vendorSettlement?.status === "COMPLETED" && booking.payment?.vendorSettlement?.amount > 0) {
                        transactionList.push({
                            id: `${booking._id}_settlement`,
                            date: booking.payment.vendorSettlement.settledAt || booking.updatedAt || booking.createdAt,
                            bookingId: bookingId,
                            amount: booking.payment.vendorSettlement.amount,
                            status: "completed",
                            type: "settlement",
                            description: `Settlement - ${booking.payment.vendorSettlement.settlementType || "Payment"}`,
                            user: booking.user?.name || "Customer"
                        });
                    }
                    
                    // 4. First Installment (50% after report upload)
                    if (booking.payment?.firstInstallment?.paid && booking.payment?.firstInstallment?.amount > 0) {
                        transactionList.push({
                            id: `${booking._id}_first_installment`,
                            date: booking.payment.firstInstallment.paidAt || booking.updatedAt || booking.createdAt,
                            bookingId: bookingId,
                            amount: booking.payment.firstInstallment.amount,
                            status: "completed",
                            type: "installment",
                            description: "First Installment (50%)",
                            user: booking.user?.name || "Customer"
                        });
                    }
                    
                    // 5. Travel Charges Payment
                    if (booking.travelChargesRequest?.paid && booking.travelChargesRequest?.amount > 0) {
                        transactionList.push({
                            id: `${booking._id}_travel`,
                            date: booking.travelChargesRequest.paidAt || booking.updatedAt || booking.createdAt,
                            bookingId: bookingId,
                            amount: booking.travelChargesRequest.amount,
                            status: "completed",
                            type: "travel",
                            description: "Travel Charges",
                            user: booking.user?.name || "Customer"
                        });
                    }
                });
                
                // Sort by date, newest first
                transactionList.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                setTransactions(transactionList);
            }
        } catch (err) {
            handleApiError(err, "Failed to load wallet data");
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = () => {
        const totalBalance = paymentCollection.collectedAmount;
        if (totalBalance >= 1000) {
            setShowWithdrawConfirm(true);
        } else {
            toast.showError("Minimum withdrawal amount is ₹1,000");
        }
    };

    const handleWithdrawConfirm = () => {
        setShowWithdrawConfirm(false);
        toast.showSuccess("Withdrawal request submitted successfully!");
    };

    // Calculate this month earnings
    const getThisMonthEarnings = () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return transactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= startOfMonth && t.status === "completed";
            })
            .reduce((sum, t) => sum + t.amount, 0);
    };

    const thisMonthEarnings = getThisMonthEarnings();

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

    if (loading) {
        return <LoadingSpinner message="Loading wallet..." />;
    }

    return (
        <>
        <PageContainer>

            {/* Total Balance Card */}
            <section className="relative my-4 overflow-hidden rounded-[12px] bg-gradient-to-b from-[#E3F2FD] via-[#BBDEFB] to-[#90CAF9] p-6 shadow-lg">
                {/* Subtle Wave Pattern Overlay */}
                <div className="absolute inset-0 z-0 opacity-20">
                    <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path fill="#64B5F6" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                    <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ transform: 'translateY(20px)' }}>
                        <path fill="#90CAF9" d="M0,128L48,138.7C96,149,192,171,288,181.3C384,192,480,192,576,186.7C672,181,768,171,864,165.3C960,160,1056,160,1152,154.7C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>
                <div className="relative z-10 flex flex-col items-center text-center">
                    <p className="text-sm font-medium text-gray-800 opacity-90">Total Balance</p>
                    <p className="mt-1 text-5xl font-extrabold tracking-tighter text-gray-800">
                        ₹{formatAmount(paymentCollection.collectedAmount)}
                    </p>
                    {paymentCollection.collectedAmount >= 1000 && (
                        <button
                            onClick={handleWithdraw}
                            className="mt-4 w-full max-w-xs rounded-full bg-blue-600 px-8 py-3 font-bold text-white hover:bg-blue-700 transition-colors shadow-md"
                        >
                            Withdraw
                        </button>
                    )}
                </div>
            </section>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="rounded-lg bg-white p-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <span className="material-symbols-outlined text-[#00C2A8] !text-2xl">payments</span>
                    <p className="mt-2 text-xs text-[#6B7280]">Total earned</p>
                    <p className="mt-0.5 text-sm font-bold text-[#3A3A3A]">
                        ₹{paymentCollection.totalEarnings.toLocaleString()}
                    </p>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <span className="material-symbols-outlined text-[#00C2A8] !text-2xl">calendar_month</span>
                    <p className="mt-2 text-xs text-[#6B7280]">This month</p>
                    <p className="mt-0.5 text-sm font-bold text-[#3A3A3A]">
                        ₹{thisMonthEarnings.toLocaleString()}
                    </p>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <span className="material-symbols-outlined text-[#00C2A8] !text-2xl">hourglass_top</span>
                    <p className="mt-2 text-xs text-[#6B7280]">Pending</p>
                    <p className="mt-0.5 text-sm font-bold text-[#3A3A3A]">
                        ₹{paymentCollection.pendingAmount.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Transaction History */}
            <section className="mt-6">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="text-lg font-bold text-[#3A3A3A]">Transaction History</h2>
                    {transactions.length > 0 && (
                        <p className="text-sm text-[#6B7280]">{transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}</p>
                    )}
                </div>
                <div className="flex flex-col gap-3">
                    {transactions.length === 0 ? (
                        <div className="rounded-lg bg-white p-8 text-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                            <span className="material-symbols-outlined text-[#6B7280] text-4xl mb-2">receipt_long</span>
                            <p className="text-[#6B7280] text-sm">No transactions yet</p>
                            <p className="text-[#6B7280] text-xs mt-1">Your transaction history will appear here</p>
                        </div>
                    ) : (
                        transactions.map((transaction) => {
                            const isCompleted = transaction.status === "completed";
                            const isPending = transaction.status === "pending";
                            
                            // Determine transaction label based on type
                            let transactionLabel = `Booking #JAL${transaction.bookingId}`;
                            if (transaction.type === "advance_payment") {
                                transactionLabel = `Booking #JAL${transaction.bookingId} - Advance Payment`;
                            } else if (transaction.type === "remaining_payment") {
                                transactionLabel = `Booking #JAL${transaction.bookingId} - Remaining Payment`;
                            } else if (transaction.type === "settlement") {
                                transactionLabel = `Booking #JAL${transaction.bookingId} - ${transaction.description || "Settlement"}`;
                            } else if (transaction.type === "installment") {
                                transactionLabel = `Booking #JAL${transaction.bookingId} - ${transaction.description || "Installment"}`;
                            } else if (transaction.type === "travel") {
                                transactionLabel = `Booking #JAL${transaction.bookingId} - ${transaction.description || "Travel Charges"}`;
                            }
                            
                            return (
                                <div
                                    key={transaction.id}
                                    className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.12)] transition-shadow"
                                >
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-full shrink-0 ${
                                        isCompleted ? "bg-green-100" : isPending ? "bg-yellow-100" : "bg-red-100"
                                    }`}>
                                        <span className={`material-symbols-outlined text-xl ${
                                            isCompleted ? "text-[#34C759]" : isPending ? "text-[#FF9F0A]" : "text-red-500"
                                        }`}>
                                            {isCompleted ? "check_circle" : isPending ? "schedule" : "error"}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-[#3A3A3A] truncate">
                                            {transactionLabel}
                                        </p>
                                        {transaction.user && (
                                            <p className="text-xs text-[#6B7280] mt-0.5">
                                                Customer: {transaction.user}
                                            </p>
                                        )}
                                        <p className="text-xs text-[#6B7280] mt-0.5">
                                            {formatDateTime(transaction.date)}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`font-bold text-base ${
                                            isCompleted ? "text-[#34C759]" : isPending ? "text-[#FF9F0A]" : "text-red-500"
                                        }`}>
                                            {isCompleted || isPending ? "+" : "-"} ₹{formatAmount(transaction.amount)}
                                        </p>
                                        <p className={`text-xs font-medium mt-0.5 ${
                                            isCompleted ? "text-[#34C759]" : "text-[#FF9F0A]"
                                        }`}>
                                            {transaction.status === "completed" ? "Completed" : "Pending"}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>
        </PageContainer>

        {/* Withdrawal Confirmation Modal */}
        <ConfirmModal
            isOpen={showWithdrawConfirm}
            onClose={() => setShowWithdrawConfirm(false)}
            onConfirm={handleWithdrawConfirm}
            title="Confirm Withdrawal"
            message={`Withdraw ₹${paymentCollection.collectedAmount.toLocaleString()} to your bank account?`}
            confirmText="Confirm Withdrawal"
            cancelText="Cancel"
            confirmColor="primary"
        />
    </>);
}
