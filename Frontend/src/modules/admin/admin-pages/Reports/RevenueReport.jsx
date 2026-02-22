import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IoCashOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoCalendarOutline,
  IoDownloadOutline,
  IoWalletOutline,
  IoArrowUpOutline,
  IoArrowDownOutline
} from "react-icons/io5";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, Line
} from "recharts";
import { getRevenueAnalytics } from "../../../../services/adminDashboardService";
import { useToast } from "../../../../hooks/useToast";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";

export default function RevenueReport() {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [period, setPeriod] = useState("monthly");
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getRevenueAnalytics({ period });
      if (response.success && response.data) {
        setRevenueData(response.data.revenueData || []);
      }
    } catch (error) {
      console.error("Revenue report error:", error);
      toast.showError("Failed to fetch financial data");
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = revenueData.reduce((acc, curr) => acc + curr.revenue, 0);
  const avgRevenue = revenueData.length ? Math.round(totalRevenue / revenueData.length) : 0;

  if (loading) return <div className="h-[400px] flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      {/* Sub Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-xl">
            <IoCashOutline />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-outfit">Financial Intelligence</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue Audit</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 p-1 rounded-xl flex border border-gray-200">
            {["weekly", "monthly"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${period === p
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
            <IoDownloadOutline className="text-lg" />
            PDF Export
          </button>
        </div>
      </div>

      {/* Financial Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RevenueWidget
          title="Total Processed"
          amount={totalRevenue}
          trend="+14.2%"
          isUp={true}
          icon={<IoWalletOutline />}
          color="blue"
        />
        <RevenueWidget
          title="Platform Average"
          amount={avgRevenue}
          trend="-2.1%"
          isUp={false}
          icon={<IoTrendingUpOutline />}
          color="purple"
        />
      </div>

      {/* Main Chart */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-xl font-black text-gray-900 font-outfit tracking-tight">Revenue Trajectory</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Net platform earnings</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-[10px] font-bold text-gray-500 uppercase">Gross Sales</span>
            </div>
          </div>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={revenueData}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }} dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }} tickFormatter={(val) => `₹${val / 1000}k`} />
              <Tooltip
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '20px' }}
                itemStyle={{ fontWeight: 900, fontSize: '16px' }}
              />
              <Area type="monotone" dataKey="revenue" fill="url(#revenueFill)" stroke="transparent" />
              <Bar dataKey="revenue" fill="#DBEAFE" radius={[8, 8, 0, 0]} barSize={40} />
              <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={5} dot={{ r: 6, fill: '#2563EB', strokeWidth: 3, stroke: '#fff' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function RevenueWidget({ title, amount, trend, isUp, icon, color }) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
  };

  return (
    <div className="bg-white p-8 rounded-[36px] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all duration-500">
      <div className="flex items-center gap-6">
        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-3xl shadow-inner ${colorClasses[color]} border`}>
          {icon}
        </div>
        <div>
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{title}</h4>
          <p className="text-3xl font-black text-gray-900 font-outfit">₹{amount.toLocaleString()}</p>
        </div>
      </div>
      <div className={`flex items-center gap-1 font-black text-sm px-3 py-1.5 rounded-full ${isUp ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
        {isUp ? <IoArrowUpOutline shadow-sm /> : <IoArrowDownOutline shadow-sm />}
        {trend}
      </div>
    </div>
  );
}
