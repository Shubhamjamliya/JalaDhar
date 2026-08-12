import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiCheckSquare, FiAlertTriangle, FiDollarSign, FiCalendar, FiArrowRight } from 'react-icons/fi';

const PendingActions = ({ pendingActions }) => {
    const navigate = useNavigate();
    const actions = pendingActions || {
        pendingVendors: 0,
        openDisputes: 0,
        pendingSettlements: 0,
        unassignedBookings: 0
    };

    const actionList = [
        {
            title: 'Expert Applications',
            count: actions.pendingVendors,
            label: 'Pending KYC Verification',
            icon: FiCheckSquare,
            color: 'text-amber-600',
            badgeBg: 'bg-amber-100 text-amber-800',
            buttonBg: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
            link: '/admin/approvals'
        },
        {
            title: 'Customer Disputes',
            count: actions.openDisputes,
            label: 'Open & In-Progress Disputes',
            icon: FiAlertTriangle,
            color: 'text-rose-600',
            badgeBg: 'bg-rose-100 text-rose-800',
            buttonBg: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
            link: '/admin/disputes'
        },
        {
            title: 'Payout Settlements',
            count: actions.pendingSettlements,
            label: 'Completed Borewells Awaiting Payout',
            icon: FiDollarSign,
            color: 'text-blue-600',
            badgeBg: 'bg-blue-100 text-blue-800',
            buttonBg: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
            link: '/admin/payments'
        },
        {
            title: 'Unassigned Bookings',
            count: actions.unassignedBookings,
            label: 'Awaiting Expert Allocation',
            icon: FiCalendar,
            color: 'text-purple-600',
            badgeBg: 'bg-purple-100 text-purple-800',
            buttonBg: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
            link: '/admin/bookings'
        }
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span>🎯</span> Pending Actions
                    </h2>
                    <p className="text-xs text-gray-500">Tasks requiring administrative attention</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {actionList.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.06 }}
                            onClick={() => navigate(item.link)}
                            className="group p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Icon className={`${item.color} text-lg`} />
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.badgeBg}`}>
                                        {item.count} Pending
                                    </span>
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.label}</p>
                            </div>

                            <div className={`mt-4 pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-medium ${item.color}`}>
                                <span>Action required</span>
                                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default PendingActions;
