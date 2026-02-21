import { useState, useEffect } from "react";
import {
  IoBarChartOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTrendingUpOutline,
  IoPeopleOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoTimeOutline,
} from "react-icons/io5";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { getDashboardStats } from "../../../services/adminDashboardService";
import { useToast } from "../../../hooks/useToast";
import LoadingSpinner from "../../shared/components/LoadingSpinner";

export default function AdminBookingAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const toast = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await getDashboardStats();
      if (response.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error("Load stats error:", err);
      toast.showError("Failed to load booking analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><LoadingSpinner /></div>;

  const bookingStatusData = [
    { name: "Pending", value: stats?.pendingBookings || 0, color: "#EAB308" },
    { name: "Completed", value: stats?.completedBookings || 0, color: "#22C55E" },
    { name: "Cancelled", value: stats?.cancelledBookings || 0, color: "#EF4444" },
  ];

  // Mock trend data for visualization
  const trendData = [
    { name: "Mon", bookings: 12 },
    { name: "Tue", bookings: 19 },
    { name: "Wed", bookings: 15 },
    { name: "Thu", bookings: 22 },
    { name: "Fri", bookings: 30 },
    { name: "Sat", bookings: 25 },
    { name: "Sun", bookings: 18 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-outfit">Booking Analytics</h1>
        <p className="text-gray-500 text-sm">Deep dive into booking performance and trends</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Bookings"
          value={stats?.totalBookings || 0}
          icon={<IoCalendarOutline />}
          trend="+12%"
          trendUp={true}
          color="blue"
        />
        <KPICard
          title="Success Rate"
          value={`${stats?.totalBookings ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}%`}
          icon={<IoCheckmarkCircleOutline />}
          trend="+5%"
          trendUp={true}
          color="green"
        />
        <KPICard
          title="Active Bookings"
          value={stats?.pendingBookings || 0}
          icon={<IoTimeOutline />}
          trend="-2%"
          trendUp={false}
          color="yellow"
        />
        <KPICard
          title="Cancellation Rate"
          value={`${stats?.totalBookings ? Math.round((stats.cancelledBookings / stats.totalBookings) * 100) : 0}%`}
          icon={<IoCloseCircleOutline />}
          trend="+1%"
          trendUp={false}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <IoTrendingUpOutline className="text-blue-500" />
            Weekly Booking Trend
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Area type="monotone" dataKey="bookings" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorBookings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <IoBarChartOutline className="text-purple-500" />
            Status Distribution
          </h3>
          <div className="h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookingStatusData}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {bookingStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-4 pr-8">
              {bookingStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{item.name}</p>
                    <p className="text-sm font-bold text-gray-900">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, trend, trendUp, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {trendUp ? <IoArrowUpOutline /> : <IoArrowDownOutline />}
          {trend}
        </div>
      </div>
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
    </motion.div>
  );
}
