import React from 'react';
import { motion } from 'framer-motion';
import { FiPieChart, FiDollarSign, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import { formatCurrency } from '../../utils/adminHelpers';

const PlatformFeesWidget = ({ platformFees }) => {
    const data = platformFees || {
        totalGrossVolume: 0,
        platformFeeEarnings: 0,
        vendorNetPayouts: 0,
        feePercentage: 10
    };

    const gross = data.totalGrossVolume || 0;
    const fee = data.platformFeeEarnings || Math.round(gross * 0.10);
    const payout = data.vendorNetPayouts || (gross - fee);
    const feePercent = gross > 0 ? ((fee / gross) * 100).toFixed(1) : '10.0';

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col justify-between"
        >
            <div>
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                            <FiPieChart className="text-indigo-600" />
                            Revenue & Platform Fees
                        </h2>
                        <p className="text-xs text-gray-500">Gross volume vs admin commission earnings</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                        {feePercent}% Platform Fee
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                            <FiDollarSign className="text-gray-400" />
                            Gross Volume
                        </div>
                        <div className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(gross)}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Total customer bookings</div>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1">
                            <FiTrendingUp className="text-emerald-600" />
                            Platform Fee (Net Admin)
                        </div>
                        <div className="text-base sm:text-lg font-extrabold text-emerald-800">{formatCurrency(fee)}</div>
                        <div className="text-[10px] text-emerald-600 mt-0.5">Admin earnings</div>
                    </div>

                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <div className="flex items-center gap-1.5 text-xs text-blue-700 mb-1">
                            <FiCheckCircle className="text-blue-600" />
                            Vendor Net Disbursal
                        </div>
                        <div className="text-base sm:text-lg font-bold text-blue-900">{formatCurrency(payout)}</div>
                        <div className="text-[10px] text-blue-600 mt-0.5">Paid out to hydrogeologists</div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-600 font-medium">
                        <span>Platform Fee Split</span>
                        <span>{feePercent}% Admin / {(100 - parseFloat(feePercent)).toFixed(1)}% Vendor</span>
                    </div>
                    <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden flex">
                        <div
                            className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                            style={{ width: `${Math.max(5, Math.min(95, parseFloat(feePercent)))}%` }}
                            title={`Platform Fee: ${feePercent}%`}
                        />
                        <div
                            className="h-full bg-blue-500 rounded-r-full transition-all duration-500"
                            style={{ width: `${100 - Math.max(5, Math.min(95, parseFloat(feePercent)))}%` }}
                            title={`Vendor Payout: ${(100 - parseFloat(feePercent)).toFixed(1)}%`}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PlatformFeesWidget;
