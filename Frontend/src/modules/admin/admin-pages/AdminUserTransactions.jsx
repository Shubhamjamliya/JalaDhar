import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IoSearchOutline,
  IoFilterOutline,
  IoCashOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoWalletOutline,
  IoArrowDownOutline,
  IoArrowUpOutline,
  IoDownloadOutline,
  IoTrendingUpOutline,
  IoPersonCircleOutline
} from "react-icons/io5";
import { getAllPayments, getPaymentStatistics } from "../../../services/adminApi";
import { useTheme } from "../../../contexts/ThemeContext";
import { useToast } from "../../../hooks/useToast";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";

export default function AdminUserTransactions() {
  const { theme, themeColors } = useTheme();
  const currentTheme = themeColors[theme] || themeColors.default;
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    successCount: 0,
    pendingCount: 0,
    failedCount: 0
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    paymentType: "", // We'll filter for user-related types by default if needed
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalPayments: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, [filters.page, filters.status, filters.paymentType]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.page === 1) {
        fetchTransactions();
      } else {
        setFilters(prev => ({ ...prev, page: 1 }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: filters.limit,
        status: filters.status || undefined,
        paymentType: filters.paymentType || undefined,
        search: filters.search || undefined
      };

      const [response, statsResponse] = await Promise.all([
        getAllPayments(params),
        getPaymentStatistics()
      ]);

      if (response.success) {
        // Filter for user-related transactions if needed
        // For now, let's keep all and maybe filter by ADVANCE/REMAINING if user wants strictly user-paid
        const userRelevant = response.data.payments.filter(p =>
          ["ADVANCE", "REMAINING", "REFUND", "WALLET_RECHARGE"].includes(p.paymentType)
        );
        setTransactions(userRelevant);
        setPagination(response.data.pagination);
      }

      if (statsResponse.success) {
        const s = statsResponse.data.statistics;
        setStats({
          totalRevenue: s.totalRevenue || 0,
          successCount: s.successPayments || 0,
          pendingCount: s.pendingPayments || 0,
          failedCount: s.failedPayments || 0
        });
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      toast.showError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "SUCCESS": return "bg-green-100 text-green-700";
      case "PENDING": return "bg-yellow-100 text-yellow-700";
      case "FAILED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "SUCCESS": return <IoCheckmarkCircleOutline />;
      case "PENDING": return <IoTimeOutline />;
      case "FAILED": return <IoCloseCircleOutline />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 p-6 pb-20 lg:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Transactions</h1>
          <p className="text-gray-500">Monitor all payments and transactions from users</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-[#60A5FA] text-white rounded-lg shadow-sm hover:bg-[#3B82F6] transition-colors"
          onClick={() => toast.showInfo("Export feature coming soon!")}
        >
          <IoDownloadOutline />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-2xl">
            <IoWalletOutline />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
            <h3 className="text-xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</h3>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 text-2xl">
            <IoCheckmarkCircleOutline />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Successful</p>
            <h3 className="text-xl font-bold text-gray-900">{stats.successCount}</h3>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600 text-2xl">
            <IoTimeOutline />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pending</p>
            <h3 className="text-xl font-bold text-gray-900">{stats.pendingCount}</h3>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 text-2xl">
            <IoCloseCircleOutline />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Failed</p>
            <h3 className="text-xl font-bold text-gray-900">{stats.failedCount}</h3>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            placeholder="Search by transaction ID, user name or email..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
          />
        </div>
        <div className="flex gap-4">
          <select
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
          >
            <option value="">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
          <select
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            value={filters.paymentType}
            onChange={(e) => setFilters(prev => ({ ...prev, paymentType: e.target.value, page: 1 }))}
          >
            <option value="">All Types</option>
            <option value="ADVANCE">Advance</option>
            <option value="REMAINING">Remaining</option>
            <option value="REFUND">Refund</option>
            <option value="WALLET_RECHARGE">Wallet</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                    No transactions found matching your filters.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{tx.transactionId || tx._id.slice(-8).toUpperCase()}</span>
                        <span className="text-[10px] text-gray-400 uppercase">{tx.paymentGateway || 'Manual'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                          <IoPersonCircleOutline className="text-xl" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{tx.userId?.name || 'Guest'}</span>
                          <span className="text-xs text-gray-500">{tx.userId?.phone || tx.userId?.email || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${tx.status === 'SUCCESS' ? 'text-gray-900' : 'text-gray-500'}`}>
                          ₹{tx.amount?.toLocaleString()}
                        </span>
                        {tx.paymentMethod && <span className="text-[10px] text-gray-400 capitalize">{tx.paymentMethod.replace('_', ' ')}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
                        {tx.paymentType?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                        {getStatusIcon(tx.status)}
                        {tx.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && transactions.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing <span className="font-bold">{transactions.length}</span> of <span className="font-bold">{pagination.totalPayments}</span> transactions
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={filters.page === 1}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 disabled:opacity-50 hover:border-blue-500 transition-all shadow-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                disabled={filters.page === pagination.totalPages}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 disabled:opacity-50 hover:border-blue-500 transition-all shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
