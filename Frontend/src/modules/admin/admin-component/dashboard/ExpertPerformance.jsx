import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiAward, FiStar, FiCheckCircle, FiChevronRight, FiBriefcase } from 'react-icons/fi';
import { formatCurrency } from '../../utils/adminHelpers';
import { useAdminAuth } from '../../../../contexts/AdminAuthContext';
import { hasAdminPermission } from '../../../../utils/permissionUtils';

const ExpertPerformance = ({ expertPerformance }) => {
    const navigate = useNavigate();
    const { admin } = useAdminAuth();
    const canVendors = hasAdminPermission(admin, 'vendors');
    const list = expertPerformance && expertPerformance.length > 0 ? expertPerformance : [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col justify-between"
        >
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                            <FiAward className="text-amber-500 text-xl" />
                            Expert Performance
                        </h2>
                        <p className="text-xs text-gray-500">Top hydrogeologists & ground survey specialists</p>
                    </div>
                    {canVendors && (
                        <button
                            onClick={() => navigate('/admin/vendors/analytics')}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                            View All Experts <FiChevronRight />
                        </button>
                    )}
                </div>

                {list.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <FiBriefcase className="mx-auto text-2xl mb-1 text-gray-300" />
                        <p className="text-xs font-medium text-gray-500">No completed expert job data yet</p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {list.map((expert, idx) => (
                            <div
                                key={expert.vendorId || idx}
                                onClick={() => canVendors && expert.vendorId && navigate(`/admin/vendors/${expert.vendorId}`)}
                                className={`flex items-center justify-between p-3 rounded-lg bg-gray-50/70 ${
                                    canVendors ? 'hover:bg-blue-50/50 cursor-pointer group' : 'cursor-default'
                                } border border-gray-100 transition-all`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                            {expert.name ? expert.name.charAt(0).toUpperCase() : 'E'}
                                        </div>
                                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                                            #{idx + 1}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {expert.name}
                                        </div>
                                        <div className="text-[11px] text-gray-500 flex items-center gap-2">
                                            <span>{expert.designation || 'Hydrogeologist'}</span>
                                            <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                                                <FiStar className="text-[10px] fill-amber-400 text-amber-400" />
                                                {typeof expert.rating === 'object'
                                                    ? (expert.rating?.averageRating || 4.9)
                                                    : (expert.rating || 4.9)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-xs sm:text-sm font-bold text-gray-900">
                                        {formatCurrency(expert.totalRevenue || 0)}
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-1">
                                        <FiCheckCircle className="text-[10px]" />
                                        {expert.completedJobs || 0} completed
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ExpertPerformance;
