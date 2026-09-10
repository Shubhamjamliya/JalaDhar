import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/adminHelpers';

const formatChartDateLabel = (dateStr, period) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;

  if (period === 'today' || dateStr.includes('T')) {
    return d.toLocaleTimeString('en-IN', { hour: 'numeric', hour12: true });
  }
  if (period === 'year') {
    return d.toLocaleDateString('en-IN', { month: 'short' });
  }
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

const RevenueVsBookingsChart = ({ data, period = 'month' }) => {
  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      ...item,
      dateLabel: formatChartDateLabel(item.date, period),
    }));
  }, [data, period]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const revenue = payload.find((p) => p.dataKey === 'revenue')?.value ?? 0;
    const orders = payload.find((p) => p.dataKey === 'orders')?.value ?? 0;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-800 mb-2">{label}</p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Revenue:</span> {formatCurrency(revenue)}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Bookings:</span> {orders}
        </p>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200"
    >
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-extrabold text-gray-800">Revenue vs Bookings</h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Compare revenue and booking count</p>
      </div>

      <div className="w-full overflow-x-auto scrollbar-admin">
        <ResponsiveContainer width="100%" height={260} minHeight={200}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="dateLabel"
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              yAxisId="left"
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => {
                if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
                if (v >= 1000) return `₹${Math.round(v / 1000)}k`;
                return `₹${v}`;
              }}
              width={50}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar yAxisId="right" dataKey="orders" fill="#10b981" radius={[8, 8, 0, 0]} />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default RevenueVsBookingsChart;


