import { useState, useEffect } from "react";
import { getDashboardStats, getBookingHistory } from "../../../services/vendorApi";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import PageContainer from "../../shared/components/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";

export default function VendorWallet() {
    const { vendor } = useVendorAuth();
    const [loading, setLoading] = useState(true);
    const [paymentCollection, setPaymentCollection] = useState({
        totalEarnings: 0,
        pendingAmount: 0,
        collectedAmount: 0
    });
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        loadWalletData();
    }, []);

    const loadWalletData = async () => {
        try {
            setLoading(true);
            setError("");
            
            // Get dashboard stats for payment collection
            const statsResponse = await getDashboardStats();
            if (statsResponse.success) {
                setPaymentCollection(statsResponse.data.stats.paymentCollection || {
                    totalEarnings: 0,
                    pendingAmount: 0,
                    collectedAmount: 0
                });
            }

            // Get all bookings for transactions (completed and pending)
            const bookingsResponse = await getBookingHistory({ 
                limit: 50,
                sortBy: "createdAt",
                sortOrder: "desc"
            });
            
            if (bookingsResponse.success) {
                const allBookings = bookingsResponse.data.bookings || [];
                const transactionList = allBookings
                    .filter(booking => {
                        // Include bookings with payment amount or completed bookings
                        return (booking.payment?.amount > 0) || (booking.status === "COMPLETED");
                    })
                    .map((booking) => {
                        const paymentStatus = booking.payment?.status;
                        const isCompleted = paymentStatus === "SUCCESS" || booking.status === "COMPLETED";
                        
                        return {
                            id: booking._id,
                            date: booking.completedAt || booking.createdAt,
                            bookingId: booking._id.toString().slice(-8).toUpperCase(),
                            amount: booking.payment?.amount || booking.service?.price || 0,
                            status: isCompleted ? "completed" : "pending",
                            type: "booking"
                        };
                    });
                setTransactions(transactionList);
            }
        } catch (err) {
            console.error("Load wallet error:", err);
            setError("Failed to load wallet data");
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = () => {
        const totalBalance = paymentCollection.collectedAmount;
        if (totalBalance >= 1000) {
            if (window.confirm(`Withdraw ₹${totalBalance.toLocaleString()} to your bank account?`)) {
                alert("Withdrawal request submitted successfully!");
            }
        } else {
            alert("Minimum withdrawal amount is ₹1,000");
        }
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
        <PageContainer>
            <ErrorMessage message={error} />

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
                    <p className="text-sm font-medium opacity-80">Total Balance</p>
                    <p className="mt-1 text-5xl font-extrabold tracking-tighter">
                        ₹{formatAmount(paymentCollection.collectedAmount)}
                    </p>
                    {paymentCollection.collectedAmount >= 1000 && (
                        <button
                            onClick={handleWithdraw}
                            className="mt-4 w-full max-w-xs rounded-full bg-white/20 px-8 py-3 font-bold text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
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
            <h2 className="px-2 pt-8 pb-3 text-lg font-bold text-[#3A3A3A]">Transaction History</h2>
            <div className="flex flex-col gap-3">
                {transactions.length === 0 ? (
                    <div className="rounded-lg bg-white p-8 text-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                        <p className="text-[#6B7280] text-sm">No transactions yet</p>
                    </div>
                ) : (
                    transactions.map((transaction) => {
                        const isCompleted = transaction.status === "completed";
                        const isPending = transaction.status === "pending";
                        
                        return (
                            <div
                                key={transaction.id}
                                className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                            >
                                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                                    isCompleted ? "bg-green-100" : isPending ? "bg-yellow-100" : "bg-red-100"
                                }`}>
                                    <span className={`material-symbols-outlined ${
                                        isCompleted ? "text-[#34C759]" : isPending ? "text-[#FF9F0A]" : "text-red-500"
                                    }`}>
                                        {isCompleted ? "arrow_downward_alt" : "arrow_upward_alt"}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-[#3A3A3A]">
                                        {transaction.type === "booking" ? `Booking #JAL${transaction.bookingId}` : "Withdrawal"}
                                    </p>
                                    <p className="text-xs text-[#6B7280]">
                                        {formatDateTime(transaction.date)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${
                                        isCompleted ? "text-[#34C759]" : isPending ? "text-[#FF9F0A]" : "text-red-500"
                                    }`}>
                                        {isCompleted || isPending ? "+" : "-"} ₹{formatAmount(transaction.amount)}
                                    </p>
                                    <p className={`text-xs font-medium ${
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
        </PageContainer>
    );
}
