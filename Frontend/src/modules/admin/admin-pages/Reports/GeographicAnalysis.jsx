import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoMapOutline,
  IoLocationOutline,
  IoPeopleOutline,
  IoBusinessOutline,
  IoStatsChartOutline,
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
  IoFilterOutline,
  IoDownloadOutline,
  IoArrowUpOutline,
  IoArrowDownOutline
} from "react-icons/io5";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { getGeographicAnalysis } from "../../../../services/adminDashboardService";
import { useToast } from "../../../../hooks/useToast";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";

const GeographicAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [type, setType] = useState("district"); // village, mandal, district, state
  const toast = useToast();

  useEffect(() => {
    fetchAnalysis();
  }, [type]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const res = await getGeographicAnalysis(type);
      if (res.success) {
        setData(res.data.analysis);
      }
    } catch (error) {
      console.error("Geographic analysis error:", error);
      // toast.showError("Failed to load geographic insights");
    } finally {
      setLoading(false);
    }
  };

  const getSupplyStatus = (ratio) => {
    if (ratio === 0) return { label: "Zero Supply", color: "text-rose-600", bg: "bg-rose-50" };
    if (ratio < 0.2) return { label: "Low Supply", color: "text-orange-600", bg: "bg-orange-50" };
    if (ratio < 0.5) return { label: "Moderate", color: "text-blue-600", bg: "bg-blue-50" };
    return { label: "Healthy", color: "text-emerald-600", bg: "bg-emerald-50" };
  };

  if (loading && data.length === 0) return <div className="h-[400px] flex items-center justify-center"><LoadingSpinner /></div>;

  const chartData = data.slice(0, 10).map(item => ({
    name: item.location,
    bookings: item.bookings,
    vendors: item.vendors,
    users: item.users
  }));

  return (
    <div className="space-y-6">
      {/* Header / Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 font-outfit uppercase tracking-tight flex items-center gap-2">
            <IoMapOutline className="text-blue-600" />
            Market Intelligence
          </h2>
          <p className="text-gray-500 text-xs font-medium mt-1">Geographic distribution and supply-demand gap analysis</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
          {["village", "mandal", "district", "state"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === t
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "text-gray-400 hover:text-gray-600"
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Top Cards - Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl mb-4">
            <IoAlertCircleOutline />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-wrap">High Demand / Low Supply</p>
          <h3 className="text-lg font-black text-gray-900 mt-1">
            {data.find(d => d.supplyDemandRatio < 0.2 && d.bookings > 0)?.location || "None Detected"}
          </h3>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-4">
            <IoCheckmarkCircleOutline />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Balanced Area</p>
          <h3 className="text-lg font-black text-gray-900 mt-1">
            {data.find(d => d.supplyDemandRatio >= 0.5)?.location || "Analysis Pending"}
          </h3>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl mb-4">
            <IoStatsChartOutline />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Top Revenue Area</p>
          <h3 className="text-lg font-black text-gray-900 mt-1">
            {data.sort((a, b) => b.revenue - a.revenue)[0]?.location || "N/A"}
          </h3>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-4">
            <IoLocationOutline />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Coverage</p>
          <h3 className="text-lg font-black text-gray-900 mt-1">{data.length} {type}s</h3>
        </motion.div>
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demand vs Supply Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 font-outfit uppercase tracking-tight">
              Supply-Demand Distribution
            </h3>
            {/* <button className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
                            <IoDownloadOutline />
                        </button> */}
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }} />
                <Bar dataKey="bookings" name="Bookings (Demand)" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="vendors" name="Vendors (Supply)" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Table / List */}
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-base font-bold text-gray-900 mb-6 font-outfit uppercase tracking-tight">Area-wise Insights</h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
            {data.map((item, idx) => {
              const status = getSupplyStatus(item.supplyDemandRatio);
              return (
                <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors capitalize">{item.location}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Bookings</p>
                      <p className="text-sm font-black text-gray-900">{item.bookings}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Vendors</p>
                      <p className="text-sm font-black text-gray-900">{item.vendors}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Revenue</p>
                      <p className="text-sm font-black text-blue-600">₹{item.revenue?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeographicAnalysis;
