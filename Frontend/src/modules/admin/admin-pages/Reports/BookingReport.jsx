import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoCalendarOutline,
  IoFilterOutline,
  IoDownloadOutline,
  IoSearchOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoAlertCircleOutline,
  IoStatsChartOutline,
  IoPieChartOutline
} from "react-icons/io5";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import { getBookingTrends } from "../../../../services/adminDashboardService";
import { useToast } from "../../../../hooks/useToast";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";

export default function BookingReport() {
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState([]);
  const [period, setPeriod] = useState(30);
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getBookingTrends(period);
      if (response.success && response.data) {
        setTrends(response.data.trends || []);
      }
    } catch (error) {
      console.error("Booking report error:", error);
      toast.showError("Failed to fetch booking trends");
    } finally {
      setLoading(false);
    }
  };

  const statusTotals = trends.reduce((acc, curr) => ({
    total: acc.total + curr.count,
    completed: acc.completed + curr.completed,
    cancelled: acc.cancelled + curr.cancelled
  }), { total: 0, completed: 0, cancelled: 0 });

  const pieData = [
    { name: "Successful", value: statusTotals.completed, color: "#10B981" },
    { name: "Failed/Cancelled", value: statusTotals.cancelled, color: "#EF4444" },
    { name: "In Progress", value: statusTotals.total - (statusTotals.completed + statusTotals.cancelled), color: "#3B82F6" }
  ];

  if (loading) return <div className="h-[400px] flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      {/* Sub Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
            <IoCalendarOutline />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-outfit">Booking Analytics</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Performance audit</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="px-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
          <button className="p-2.5 bg-gray-900 text-white rounded-xl shadow-lg shadow-gray-200">
            <IoDownloadOutline className="text-lg" />
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricBox title="Volume" value={statusTotals.total} sub="Total Requests" icon={<IoStatsChartOutline />} color="blue" />
        <MetricBox title="Fulfilled" value={statusTotals.completed} sub="Success Jobs" icon={<IoCheckmarkCircleOutline />} color="green" />
        <MetricBox title="Bounce Rate" value={`${statusTotals.total ? Math.round((statusTotals.cancelled / statusTotals.total) * 100) : 0}%`} sub="Cancellations" icon={<IoCloseCircleOutline />} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            <IoTimeOutline className="text-blue-500 text-lg" />
            Daily Traffic Volume
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="count" name="Total" stroke="#3B82F6" strokeWidth={4} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="completed" name="Success" stroke="#10B981" strokeWidth={3} dot={{ r: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Share */}
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            <IoPieChartOutline className="text-purple-500 text-lg" />
            Outcome Distribution
          </h3>
          <div className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto space-y-3">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-bold text-gray-500">{item.name}</span>
                </div>
                <span className="font-black text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ title, value, sub, icon, color }) {
  const colors = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    red: "text-red-600 bg-red-50",
  };
  return (
    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex items-center gap-5">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{sub}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-2xl font-black text-gray-900">{value}</h4>
          <span className="text-[10px] font-bold text-gray-400">{title}</span>
        </div>
      </div>
    </div>
  );
}
