import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiAlertCircle, FiArrowRight, FiInfo } from 'react-icons/fi';

const AdminAlerts = ({ alerts }) => {
    const navigate = useNavigate();
    const alertList = alerts && alerts.length > 0 ? alerts : [];

    if (alertList.length === 0) {
        return (
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>All systems normal. No urgent system alerts requiring admin action.</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">Optimal</span>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FiBell className="text-rose-500 animate-bounce text-lg" />
                    System Alerts & Warnings
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 bg-rose-100 text-rose-700 rounded-full">
                    {alertList.length} Attention Required
                </span>
            </div>

            <div className="space-y-2">
                {alertList.map((alert, idx) => {
                    const isCritical = alert.type === 'critical';
                    const isWarning = alert.type === 'warning';

                    const borderClass = isCritical
                        ? 'border-rose-200 bg-rose-50/60 text-rose-900'
                        : isWarning
                            ? 'border-amber-200 bg-amber-50/60 text-amber-900'
                            : 'border-blue-200 bg-blue-50/60 text-blue-900';

                    const iconColor = isCritical
                        ? 'text-rose-600'
                        : isWarning
                            ? 'text-amber-600'
                            : 'text-blue-600';

                    return (
                        <motion.div
                            key={alert.id || idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => alert.link && navigate(alert.link)}
                            className={`p-3 rounded-lg border ${borderClass} flex items-center justify-between cursor-pointer hover:shadow-sm transition-all group`}
                        >
                            <div className="flex items-center gap-2.5">
                                {isCritical ? (
                                    <FiAlertCircle className={`${iconColor} text-lg shrink-0`} />
                                ) : (
                                    <FiInfo className={`${iconColor} text-lg shrink-0`} />
                                )}
                                <div>
                                    <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
                                        <span>{alert.title}</span>
                                        {alert.count && (
                                            <span className="text-[10px] px-1.5 py-0.2 bg-white/80 rounded font-semibold border border-current">
                                                {alert.count}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] opacity-80 mt-0.5">{alert.message}</p>
                                </div>
                            </div>

                            <button className="text-xs font-semibold flex items-center gap-1 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0">
                                Resolve <FiArrowRight />
                            </button>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminAlerts;
