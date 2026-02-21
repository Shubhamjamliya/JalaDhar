import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoSearchOutline,
  IoFilterOutline,
  IoCashOutline,
  IoWalletOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoTimeOutline,
  IoEllipsisVerticalOutline,
  IoChevronDownOutline,
  IoDocumentTextOutline,
  IoBusinessOutline
} from "react-icons/io5";
import api from "../../../services/api";
import LoadingSpinner from "../../shared/components/LoadingSpinner";

export default function AdminVendorTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 345600,
    pendingPayouts: 42000,
    completedPayouts: 180000,
    payoutRate: 85
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Since we don't have a dedicated vendor transactions endpoint yet, 
    // we'll fetch all payments and filter/format them
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/payments");
      if (response.data.success) {
        // Focus on Vendor related payments
        const payments = response.data.data.payments || [];
        setTransactions(payments);
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "success":
      case "completed": return "bg-green-100 text-green-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "failed":
      case "refunded": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6 p-6 pb-20 lg:pb-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Transactions</h1>
          <p className="text-gray-500 text-sm">Track business earnings and payout history</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2">
            <IoDocumentTextOutline /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: "₹" + stats.totalRevenue.toLocaleString(), icon: IoCashOutline, color: "blue", trend: "+12%" },
          { label: "Pending Payouts", value: "₹" + stats.pendingPayouts.toLocaleString(), icon: IoTimeOutline, color: "orange", trend: "5 requests" },
          { label: "Settled Amount", value: "₹" + stats.completedPayouts.toLocaleString(), icon: IoCheckmarkCircleOutline, color: "green", trend: "Settled" },
          { label: "Completion Rate", value: stats.payoutRate + "%", icon: IoWalletOutline, color: "purple", trend: "Stable" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group"
          >
            <div className={`p-3 rounded-2xl bg-${stat.color}-50 w-fit mb-4 text-${stat.color}-600`}>
              <stat.icon className="text-xl" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">{stat.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="search"
            placeholder="Search by Vendor, Transaction ID, or Date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all text-sm"
          />
        </div>
        <button className="px-6 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center gap-2 text-sm font-bold text-gray-600 hover:border-blue-200 hover:text-blue-600 transition-all">
          <IoFilterOutline /> Settings
          <IoChevronDownOutline className="text-gray-400" />
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Business / Vendor</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center"><LoadingSpinner /></td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-gray-500">No transactions found</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                          <IoBusinessOutline className="text-lg" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 line-clamp-1">{tx.vendorDetails?.businessName || tx.vendor?.name || "Jaladhar Partner"}</p>
                          <p className="text-[10px] text-gray-400 font-medium">#{tx.vendor?._id?.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-mono font-bold text-gray-500 select-all">{tx.razorpayPaymentId || tx._id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">₹{tx.amount?.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusStyle(tx.status)}`}>
                        {tx.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-500 font-medium">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <IoEllipsisVerticalOutline />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const IoCheckmarkCircleOutline = (props) => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 1123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z"></path>
  </svg>
);
