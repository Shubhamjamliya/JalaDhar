import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IoBusinessOutline,
  IoTrendingUpOutline,
  IoCalendarOutline,
  IoStatsChartOutline,
  IoPieChartOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline
} from "react-icons/io5";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { getDashboardStats } from "../../../services/adminDashboardService";
import { getAllVendors } from "../../../services/adminApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";

export default function AdminVendorAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [statsRes, vendorsRes] = await Promise.all([
        getDashboardStats(),
        getAllVendors({ limit: 1000 }) // Get all for distribution calculation
      ]);

      if (statsRes.success) {
        setStats(statsRes.data.stats);
      }

      if (vendorsRes.success) {
        setVendors(vendorsRes.data.vendors || []);
      }
    } catch (err) {
      console.error("Error fetching vendor analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) return <div className="h-full flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div>;

  const COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'];

  // Distribution by Approval Status
  const statusDistribution = [
    { name: 'Approved', value: vendors.filter(v => v.isApproved).length, color: '#34D399' },
    { name: 'Pending', value: vendors.filter(v => !v.isApproved && !v.rejectionReason).length, color: '#FBBF24' },
    { name: 'Rejected', value: vendors.filter(v => v.rejectionReason).length, color: '#F87171' },
  ].filter(item => item.value > 0);

  // Growth Trend (Mocked from stats or actual if available)
  const growthData = [
    { date: 'Mon', vendors: 12 },
    { date: 'Tue', vendors: 15 },
    { date: 'Wed', vendors: 14 },
    { date: 'Thu', vendors: 18 },
    { date: 'Fri', vendors: 22 },
    { date: 'Sat', vendors: 20 },
    { date: 'Sun', vendors: 25 },
  ];

  return (
    <div className="space-y-6 p-6 pb-20 lg:pb-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vendor Analytics</h1>
          <p className="text-gray-500">Business performance and registration insights</p>
        </div>
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === d
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <IoBusinessOutline className="text-xl" />
            </div>
            <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
              <IoArrowUpOutline /> 5%
            </span>
          </div>
          <p className="text-sm text-gray-500 font-medium">Total Vendors</p>
          <h3 className="text-2xl font-bold text-gray-900">{stats?.totalVendors || 0}</h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <IoCheckmarkCircleOutline className="text-xl" />
            </div>
            <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
              <IoArrowUpOutline /> 12%
            </span>
          </div>
          <p className="text-sm text-gray-500 font-medium">Approved Vendors</p>
          <h3 className="text-2xl font-bold text-gray-900">{vendors.filter(v => v.isApproved).length}</h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <IoCalendarOutline className="text-xl" />
            </div>
            <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
              <IoArrowUpOutline /> 15%
            </span>
          </div>
          <p className="text-sm text-gray-500 font-medium">Total Bookings</p>
          <h3 className="text-2xl font-bold text-gray-900">{stats?.totalBookings || 0}</h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <IoTimeOutline className="text-xl" />
            </div>
            <span className="text-xs font-bold text-gray-400">Target: 85%</span>
          </div>
          <p className="text-sm text-gray-500 font-medium">Response Rate</p>
          <h3 className="text-2xl font-bold text-gray-900">92%</h3>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-gray-800">Registration Trend</h4>
            <IoStatsChartOutline className="text-gray-400 text-xl" />
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorVendors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="vendors"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorVendors)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-gray-800">Status Distribution</h4>
            <IoPieChartOutline className="text-gray-400 text-xl" />
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Top Performing Vendors (Simplified) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
      >
        <h4 className="font-bold text-gray-800 mb-6">Recently Active Vendors</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50 text-xs text-gray-400 uppercase tracking-wider font-bold">
                <th className="pb-4">Vendor Name</th>
                <th className="pb-4">Email</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vendors.slice(0, 5).map((vendor) => (
                <tr key={vendor._id} className="text-sm">
                  <td className="py-4 font-medium text-gray-900">{vendor.name}</td>
                  <td className="py-4 text-gray-500">{vendor.email}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${vendor.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {vendor.isApproved ? 'APPROVED' : 'PENDING'}
                    </span>
                  </td>
                  <td className="py-4 text-right text-gray-400">{new Date(vendor.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
