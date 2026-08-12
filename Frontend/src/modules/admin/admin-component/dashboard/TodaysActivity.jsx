import React from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiCheckCircle, FiUserPlus, FiDollarSign } from 'react-icons/fi';
import { formatCurrency } from '../../utils/adminHelpers';

const TodaysActivity = ({ todaysActivity }) => {
    const data = todaysActivity || {
        revenue: 0,
        newBookings: 0,
        completedBookings: 0,
        newUsers: 0,
        newVendors: 0
    };

    const metrics = [
        {
            label: "Today's Revenue",
            value: formatCurrency(data.revenue || 0),
            sub: "Total earned today",
            icon: FiDollarSign,
            color: "text-emerald-600",
            bgColor: "bg-emerald-50 border-emerald-200"
        },
        {
            label: "New Bookings",
            value: data.newBookings || 0,
            sub: "Requests created today",
            icon: FiClock,
            color: "text-blue-600",
            bgColor: "bg-blue-50 border-blue-200"
        },
        {
            label: "Jobs Completed",
            value: data.completedBookings || 0,
            sub: "Surveys finished today",
            icon: FiCheckCircle,
            color: "text-purple-600",
            bgColor: "bg-purple-50 border-purple-200"
        },
        {
            label: "New Signups",
            value: (data.newUsers || 0) + (data.newVendors || 0),
            sub: `${data.newUsers || 0} clients, ${data.newVendors || 0} experts`,
            icon: FiUserPlus,
            color: "text-amber-600",
            bgColor: "bg-amber-50 border-amber-200"
        }
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Today's Activity
                    </h2>
                    <p className="text-xs text-gray-500">Real-time snapshot of daily platform operations</p>
                </div>
                <span className="text-[11px] font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {metrics.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`p-3.5 rounded-lg border ${item.bgColor} flex flex-col justify-between`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                                <Icon className={`${item.color} text-base`} />
                            </div>
                            <div>
                                <div className="text-lg sm:text-xl font-bold text-gray-900">{item.value}</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">{item.sub}</div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default TodaysActivity;
