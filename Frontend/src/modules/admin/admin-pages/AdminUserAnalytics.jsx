import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IoPeopleOutline,
  IoTrendingUpOutline,
  IoCalendarOutline,
  IoStatsChartOutline,
  IoPieChartOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
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
import { getDashboardStats, getUserGrowthMetrics } from "../../../services/adminDashboardService";
import { useTheme } from "../../../contexts/ThemeContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";

export default function AdminUserAnalytics() {
  const { theme, themeColors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [growthData, setGrowthData] = useState([]);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [statsRes, growthRes] = await Promise.all([
        getDashboardStats(),
        getUserGrowthMetrics(period)
      ]);

      if (statsRes.success) {
        setStats(statsRes.data.stats);
      }

      if (growthRes.success) {
        setGrowthData(growthRes.data.growthData || []);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) return <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>;

  const COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'];

  // Mock data for distribution if not available in API
  const userRoleDistribution = [
    { name: 'Active Users', value: stats?.totalUsers || 0, color: '#34D399' },
    { name: 'New Users', value: Math.floor((stats?.totalUsers || 0) * 0.2), color: '#60A5FA' },
  ];

  return (
    <div className="space-y-6 p-6 pb-20 lg:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Analytics</h1>
          <p className="text-gray-500">Insights and trends about your user base</p>
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

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <IoPeopleOutline className="text-xl" />
            </div>
            <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
              <IoArrowUpOutline /> 12%
            </span>
          </div>
          <p className="text-sm text-gray-500 font-medium">Total Users</p>
          <h3 className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <IoCalendarOutline className="text-xl" />
            </div>
            <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
              <IoArrowUpOutline /> 8%
            </span>
          </div>
          <p className="text-sm text-gray-500 font-medium">New Registrations</p>
          <h3 className="text-2xl font-bold text-gray-900">{Math.floor((stats?.totalUsers || 0) * 0.15)}</h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <IoTrendingUpOutline className="text-xl" />
            </div>
            <span className="flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-full">
              <IoArrowDownOutline /> 3%
            </span>
          </div>
          <p className="text-sm text-gray-500 font-medium">Churn Rate</p>
          <h3 className="text-2xl font-bold text-gray-900">2.4%</h3>
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
            <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
              <IoArrowUpOutline /> 5%
            </span>
          </div>
          <p className="text-sm text-gray-500 font-medium">Avg. Session</p>
          <h3 className="text-2xl font-bold text-gray-900">12.5m</h3>
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
            <h4 className="font-bold text-gray-800">User Growth Trend</h4>
            <IoStatsChartOutline className="text-gray-400 text-xl" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  margin={{ top: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorGrowth)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-gray-800">User Status</h4>
            <IoPieChartOutline className="text-gray-400 text-xl" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userRoleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {userRoleDistribution.map((entry, index) => (
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
    </div>
  );
}
