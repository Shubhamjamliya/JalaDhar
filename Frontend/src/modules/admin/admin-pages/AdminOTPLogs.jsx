import { useState, useEffect } from 'react';
import {
    IoShieldCheckmarkOutline,
    IoSearchOutline,
    IoRefreshOutline,
    IoCheckmarkCircleOutline,
    IoTimeOutline,
    IoPhonePortraitOutline,
    IoGlobeOutline,
    IoKeyOutline,
    IoLocationOutline,
    IoPersonOutline,
    IoRibbonOutline,
    IoDocumentTextOutline
} from 'react-icons/io5';
import api from '../../../services/api';
import { useToast } from '../../../hooks/useToast';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

export default function AdminOTPLogs() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });

    const fetchOTPLogs = async (targetPage = 1) => {
        try {
            setLoading(true);
            const response = await api.get('/admin/bookings', {
                params: {
                    page: targetPage,
                    limit: pagination.limit,
                    search: searchQuery
                }
            });

            if (response.data?.success && response.data?.data) {
                const bookingsList = response.data.data.bookings || [];
                // Filter or map bookings that have OTP records
                const otpRecords = bookingsList.map(b => ({
                    id: b._id,
                    bookingNumber: b.bookingNumber || b._id.substring(0, 8),
                    customerName: b.user?.name || b.address?.contactName || 'Customer',
                    customerPhone: b.user?.phone || b.address?.contactPhone || 'N/A',
                    expertName: b.vendor?.name || 'Assigned Expert',
                    expertId: b.vendor?.expertId || 'EX-2026',
                    startOtp: b.otp?.startSurvey || {},
                    endOtp: b.otp?.endSurvey || {},
                    surveyStartTime: b.surveyStartTime,
                    surveyEndTime: b.surveyEndTime,
                    coordinates: b.address?.coordinates,
                    status: b.status
                }));

                setLogs(otpRecords);
                setPagination(response.data.data.pagination || { page: 1, limit: 15, total: otpRecords.length, pages: 1 });
            }
        } catch (err) {
            console.error('Error fetching OTP logs:', err);
            toast.showError('Failed to load OTP verification audit logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOTPLogs(1);
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchOTPLogs(1);
    };

    return (
        <div className="space-y-6 pb-12">
            
            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <IoKeyOutline className="text-blue-600 text-2xl sm:text-3xl" />
                        <span>Two-Stage Survey OTP Audit Logs</span>
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        Immutable verification records for Start Survey OTP &amp; End Survey OTP at customer site
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchOTPLogs(pagination.page)}
                        className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                        <IoRefreshOutline className="text-base" />
                        <span>Refresh Logs</span>
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
                    <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by Booking ID, Customer, or Expert Name..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
                    />
                </form>

                <div className="text-xs text-slate-500 font-bold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                    Total Audit Records: <strong className="text-blue-600">{pagination.total}</strong>
                </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center"><LoadingSpinner /></div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <IoDocumentTextOutline className="text-4xl text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold">No OTP audit records found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                                    <th className="py-3.5 px-4">Booking Ref</th>
                                    <th className="py-3.5 px-4">Customer Details</th>
                                    <th className="py-3.5 px-4">Assigned Expert</th>
                                    <th className="py-3.5 px-4">Stage 1: Start Survey OTP</th>
                                    <th className="py-3.5 px-4">Stage 2: End Survey OTP</th>
                                    <th className="py-3.5 px-4">Site Location / GPS</th>
                                    <th className="py-3.5 px-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                        
                                        {/* Booking Ref */}
                                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                                            #{log.bookingNumber}
                                        </td>

                                        {/* Customer */}
                                        <td className="py-3.5 px-4">
                                            <div className="font-extrabold text-slate-900">{log.customerName}</div>
                                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                <IoPhonePortraitOutline />
                                                {log.customerPhone}
                                            </div>
                                        </td>

                                        {/* Expert */}
                                        <td className="py-3.5 px-4">
                                            <div className="font-extrabold text-slate-900">{log.expertName}</div>
                                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono font-bold text-[10px] border border-blue-200">
                                                <IoRibbonOutline className="text-amber-500" />
                                                {log.expertId}
                                            </span>
                                        </td>

                                        {/* Stage 1: Start OTP */}
                                        <td className="py-3.5 px-4">
                                            {log.startOtp?.code ? (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 text-xs">
                                                            {log.startOtp.code}
                                                        </span>
                                                        {log.startOtp.verified ? (
                                                            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">VERIFIED</span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">PENDING</span>
                                                        )}
                                                    </div>
                                                    {log.startOtp.verifiedAt && (
                                                        <div className="text-[10px] text-slate-400 font-medium">
                                                            Verified: {new Date(log.startOtp.verifiedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-slate-400 italic">Not Generated</span>
                                            )}
                                        </td>

                                        {/* Stage 2: End OTP */}
                                        <td className="py-3.5 px-4">
                                            {log.endOtp?.code ? (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono font-black px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200 text-xs">
                                                            {log.endOtp.code}
                                                        </span>
                                                        {log.endOtp.verified ? (
                                                            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">VERIFIED</span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">PENDING</span>
                                                        )}
                                                    </div>
                                                    {log.endOtp.verifiedAt && (
                                                        <div className="text-[10px] text-slate-400 font-medium">
                                                            Verified: {new Date(log.endOtp.verifiedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-slate-400 italic">Not Generated</span>
                                            )}
                                        </td>

                                        {/* Location / GPS */}
                                        <td className="py-3.5 px-4 text-xs">
                                            {log.coordinates?.lat ? (
                                                <div className="font-mono text-[11px] text-slate-600 flex items-center gap-1">
                                                    <IoLocationOutline className="text-rose-500" />
                                                    <span>{log.coordinates.lat.toFixed(4)}, {log.coordinates.lng.toFixed(4)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 font-medium">Site Address Recorded</span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="py-3.5 px-4 text-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                                                {log.status}
                                            </span>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}
