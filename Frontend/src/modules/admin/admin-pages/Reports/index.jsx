import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  IoBarChartOutline,
  IoCashOutline,
  IoCalendarOutline,
  IoPeopleOutline,
  IoArrowForwardOutline,
  IoTrendingUpOutline,
  IoFilterOutline,
  IoDownloadOutline,
  IoPieChartOutline,
  IoStatsChartOutline,
  IoWalletOutline
} from "react-icons/io5";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from "recharts";
import { getDashboardStats, getRevenueAnalytics, getBookingTrends, getUserGrowthMetrics } from "../../../../services/adminDashboardService";
import { useToast } from "../../../../hooks/useToast";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";

// Sub-components
import BookingReport from "./BookingReport";
import RevenueReport from "./RevenueReport";
import VendorReport from "./VendorReport";
import PaymentReport from "./PaymentReport";

const ReportsOverview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [bookingTrends, setBookingTrends] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [period, setPeriod] = useState("monthly");
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, revenueRes, trendsRes, growthRes] = await Promise.all([
        getDashboardStats(),
        getRevenueAnalytics({ period }),
        getBookingTrends(30),
        getUserGrowthMetrics(30)
      ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data.stats);
      if (revenueRes.success && revenueRes.data) setRevenueData(revenueRes.data.revenueData || []);
      if (trendsRes.success && trendsRes.data) setBookingTrends(trendsRes.data.trends || []);
      if (growthRes.success && growthRes.data) {
        const userGrowth = growthRes.data.userGrowth || [];
        const vendorGrowth = growthRes.data.vendorGrowth || [];
        const merged = userGrowth.map(ug => {
          const vg = vendorGrowth.find(v => v._id === ug._id);
          return {
            date: ug._id,
            users: ug.count,
            vendors: vg ? vg.count : 0
          };
        });
        setGrowthData(merged);
      }
    } catch (error) {
      console.error("Fetch reports error:", error);
      toast.showError("Failed to load platform analytics");
    } finally {
      setLoading(false);
    }
  };

  const kpis = [
    {
      title: "Gross Revenue",
      value: `₹${stats?.totalRevenue?.toLocaleString() || 0}`,
      icon: IoCashOutline,
      color: "text-blue-600",
      bg: "bg-blue-50",
      link: "/admin/reports/revenue"
    },
    {
      title: "Active Bookings",
      value: stats?.pendingBookings || 0,
      icon: IoCalendarOutline,
      color: "text-orange-600",
      bg: "bg-orange-50",
      link: "/admin/reports/bookings"
    },
    {
      title: "Total Partners",
      value: stats?.totalVendors || 0,
      icon: IoStatsChartOutline,
      color: "text-purple-600",
      bg: "bg-purple-50",
      link: "/admin/reports/vendors"
    },
    {
      title: "App Installs",
      value: stats?.totalUsers || 0,
      icon: IoPeopleOutline,
      color: "text-green-600",
      bg: "bg-green-50",
      link: "/admin/reports/vendors"
    }
  ];

  if (loading && !stats) return <div className="h-[400px] flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportCard
          title="Revenue Streams"
          subtitle="Financial performance"
          icon={<IoCashOutline />}
          color="blue"
          link="/admin/reports/revenue"
        />
        <ReportCard
          title="Operational"
          subtitle="Booking & Service stats"
          icon={<IoBarChartOutline />}
          color="orange"
          link="/admin/reports/bookings"
        />
        <ReportCard
          title="Partner Health"
          subtitle="Vendor engagement"
          icon={<IoPieChartOutline />}
          color="purple"
          link="/admin/reports/vendors"
        />
        <ReportCard
          title="Payment Audit"
          subtitle="Transaction health"
          icon={<IoWalletOutline />}
          color="orange"
          link="/admin/reports/payments"
        />
      </div>

      {/* Filters Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm gap-4">
        <h2 className="text-lg font-bold text-gray-900 font-outfit uppercase tracking-tight">System-wide Overview</h2>
        <div className="bg-gray-50 p-1 rounded-2xl flex border border-gray-100">
          {["daily", "weekly", "monthly"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${period === p
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "text-gray-400 hover:text-gray-600"
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <motion.div
            whileHover={{ y: -5 }}
            key={idx}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => toast.showInfo(`Viewing ${kpi.title}`)}
          >
            <div className={`w-12 h-12 rounded-2xl ${kpi.bg} ${kpi.color} flex items-center justify-center text-2xl shrink-0`}>
              <kpi.icon />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.title}</p>
              <p className="text-xl font-black text-gray-900 mt-0.5">{kpi.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-8 font-outfit">
            <IoTrendingUpOutline className="text-blue-500" />
            Platform Revenue Trend
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                  itemStyle={{ fontWeight: 800, color: '#1E293B' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-8 font-outfit">
            <IoStatsChartOutline className="text-orange-500" />
            Booking Success Ratio
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 700 }} />
                <Bar dataKey="completed" name="Delivered" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="cancelled" name="Cancelled" fill="#EF4444" radius={[6, 6, 0, 0]} />
                <Bar dataKey="count" name="Total Requests" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const ReportCard = ({ title, subtitle, icon, color, link }) => {
  const colors = {
    blue: "from-blue-600 to-blue-700 shadow-blue-200",
    orange: "from-orange-500 to-orange-600 shadow-orange-200",
    purple: "from-purple-600 to-purple-700 shadow-purple-200"
  };

  return (
    <Link to={link} className="group">
      <div className={`bg-gradient-to-br ${colors[color]} p-6 rounded-[32px] text-white shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden h-full flex flex-col justify-between`}>
        <div className="relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <div>
            <p className="text-white/70 text-[10px] uppercase font-black tracking-widest">{subtitle}</p>
            <h3 className="text-xl font-black font-outfit mt-1">{title}</h3>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-2 text-xs font-bold relative z-10 w-fit py-1.5 px-3 bg-white/10 rounded-full group-hover:bg-white group-hover:text-gray-900 transition-colors">
          Analyze Now <IoArrowForwardOutline className="group-hover:translate-x-1 transition-transform" />
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12 pointer-events-none" />
      </div>
    </Link>
  );
};

export default function AdminReports() {
  const location = useLocation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 font-outfit tracking-tight">Intelligence & Reports</h1>
          <p className="text-gray-500 font-medium text-sm">Actionable insights from your platform data</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-2xl text-xs font-bold hover:bg-black transition-all shadow-xl shadow-gray-200">
            <IoDownloadOutline className="text-lg" />
            Export Global Audit
          </button>
        </div>
      </div>

      <Routes>
        <Route index element={<ReportsOverview />} />
        <Route path="revenue" element={<RevenueReport />} />
        <Route path="bookings" element={<BookingReport />} />
        <Route path="vendors" element={<VendorReport />} />
        <Route path="payments" element={<PaymentReport />} />
      </Routes>
    </div>
  );
}
