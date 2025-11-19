import { useState } from "react";
import { IoWalletOutline, IoArrowDownOutline } from "react-icons/io5";

export default function VendorWallet() {
    const [totalBalance] = useState(12500);
    const [totalEarned] = useState(45000);
    const [thisMonth] = useState(12500);
    const [pendingPayouts] = useState(8500);

    const transactions = [
        {
            id: 1,
            date: "2024-01-15",
            bookingId: "BK-001234",
            amount: 2500,
            status: "completed",
        },
        {
            id: 2,
            date: "2024-01-14",
            bookingId: "BK-001233",
            amount: 3000,
            status: "completed",
        },
        {
            id: 3,
            date: "2024-01-13",
            bookingId: "BK-001232",
            amount: 1500,
            status: "pending",
        },
        {
            id: 4,
            date: "2024-01-12",
            bookingId: "BK-001231",
            amount: 2000,
            status: "completed",
        },
        {
            id: 5,
            date: "2024-01-11",
            bookingId: "BK-001230",
            amount: 3500,
            status: "completed",
        },
    ];

    const handleWithdraw = () => {
        if (totalBalance >= 1000) {
            if (window.confirm(`Withdraw ₹${totalBalance.toLocaleString()} to your bank account?`)) {
                alert("Withdrawal request submitted successfully!");
            }
        } else {
            alert("Minimum withdrawal amount is ₹1,000");
        }
    };

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
                    Wallet
                </h1>
                <p className="text-[#4A4A4A] text-sm">
                    Manage your earnings, transactions, and withdrawals
                </p>
            </div>

            {/* Total Balance Card */}
            <div className="bg-gradient-to-r from-[#0A84FF] to-[#005BBB] rounded-[12px] p-6 mb-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-white/90 text-sm mb-1">Total Balance</p>
                        <h2 className="text-4xl font-bold text-white">
                            ₹{totalBalance.toLocaleString()}
                        </h2>
                    </div>
                    <IoWalletOutline className="text-5xl text-white/30" />
                </div>
                {totalBalance >= 1000 && (
                    <button
                        onClick={handleWithdraw}
                        className="w-full bg-white text-[#0A84FF] font-semibold py-3 px-4 rounded-[12px] hover:bg-white/90 transition-colors flex items-center justify-center gap-2 shadow-[0px_4px_10px_rgba(0,0,0,0.1)]"
                    >
                        <IoArrowDownOutline className="text-xl" />
                        Withdraw
                    </button>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <p className="text-xs text-[#4A4A4A] mb-1">Total Earned</p>
                    <p className="text-lg font-bold text-gray-800">
                        ₹{(totalEarned / 1000).toFixed(1)}k
                    </p>
                </div>
                <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <p className="text-xs text-[#4A4A4A] mb-1">This Month</p>
                    <p className="text-lg font-bold text-gray-800">
                        ₹{(thisMonth / 1000).toFixed(1)}k
                    </p>
                </div>
                <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <p className="text-xs text-[#4A4A4A] mb-1">Pending</p>
                    <p className="text-lg font-bold text-gray-800">
                        ₹{(pendingPayouts / 1000).toFixed(1)}k
                    </p>
                </div>
            </div>

            {/* Transaction List */}
            <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Recent Transactions
                </h3>
                {transactions.length === 0 ? (
                    <p className="text-[#4A4A4A] text-sm text-center py-8">
                        No transactions yet
                    </p>
                ) : (
                    <div className="space-y-4">
                        {transactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-semibold text-gray-800">
                                            {transaction.bookingId}
                                        </p>
                                        <span
                                            className={`px-2 py-1 rounded-[6px] text-xs font-semibold ${
                                                transaction.status === "completed"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                            }`}
                                        >
                                            {transaction.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#4A4A4A]">
                                        {new Date(transaction.date).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-[#0A84FF]">
                                        +₹{transaction.amount.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
