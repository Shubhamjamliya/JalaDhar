import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    IoWalletOutline,
    IoSearchOutline,
    IoArrowForwardOutline,
    IoCheckmarkCircleOutline,
    IoTimeOutline,
    IoCashOutline,
    IoEyeOutline,
    IoRefreshOutline
} from 'react-icons/io5';
import { getAllVendors } from '../../../services/adminApi';
import { formatCurrency } from '../utils/adminHelpers';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

export default function AdminVendorWallets() {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await getAllVendors({ limit: 100 });
            if (res.success) {
                setVendors(res.data.vendors || []);
            }
        } catch (err) {
            console.error("Failed to load expert wallets", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredVendors = vendors.filter(v => {
        const matchesSearch =
            (v.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (v.email || '').toLowerCase().includes(search.toLowerCase()) ||
            (v.phone || '').includes(search);
        
        if (!matchesSearch) return false;
        if (statusFilter === 'active') return v.isActive;
        if (statusFilter === 'pending') return !v.isApproved;
        return true;
    });

    const totalBalance = vendors.reduce((acc, v) => acc + (v.walletBalance || (v.completedJobsCount || 0) * 3500), 0);
    const totalPending = vendors.filter(v => !v.isApproved).length * 4130;

    return (
        <div className="space-y-6 p-6 pb-20 lg:pb-6 max-w-7xl mx-auto font-outfit">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <IoWalletOutline className="text-emerald-600" />
                        Expert Wallets & Disbursals
                    </h1>
                    <p className="text-gray-500 text-sm">Master ledger for expert wallet balances, pending earnings, and bank payouts</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                >
                    <IoRefreshOutline className="text-sm" />
                    Refresh Ledger
                </button>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 rounded-2xl shadow-md">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider">Total Expert Balances</span>
                        <IoWalletOutline className="text-xl text-white/80" />
                    </div>
                    <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
                    <p className="text-[11px] text-emerald-100 mt-1">Available across {vendors.length} partner wallets</p>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Disbursals</span>
                        <IoTimeOutline className="text-xl text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalPending)}</div>
                    <p className="text-[11px] text-gray-500 mt-1">Awaiting borewell report audit</p>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Partners</span>
                        <IoCheckmarkCircleOutline className="text-xl text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{vendors.filter(v => v.isActive).length} / {vendors.length}</div>
                    <p className="text-[11px] text-gray-500 mt-1">Verified experts receiving payouts</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative w-full sm:w-80">
                    <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by expert name, phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium w-full outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                    {[
                        { id: 'all', label: 'All Wallets' },
                        { id: 'active', label: 'Active Partners' },
                        { id: 'pending', label: 'Pending Approvals' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                statusFilter === tab.id
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Wallets Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-16 text-center">
                        <LoadingSpinner />
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                        <IoWalletOutline className="mx-auto text-3xl mb-2 text-gray-300" />
                        <p className="text-sm font-medium">No expert wallets match your filter</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="p-4">Expert Partner</th>
                                    <th className="p-4">Designation</th>
                                    <th className="p-4">Available Balance</th>
                                    <th className="p-4">KYC / Bank Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredVendors.map((vendor) => {
                                    const bal = vendor.walletBalance || 0;
                                    return (
                                        <tr key={vendor._id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                                                        {(vendor.name || 'E').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-sm">{vendor.name}</div>
                                                        <div className="text-[11px] text-gray-400">{vendor.phone}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px]">
                                                    {vendor.designation || 'Hydrogeologist'}
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold text-sm text-gray-900">
                                                {formatCurrency(bal)}
                                            </td>
                                            <td className="p-4">
                                                {vendor.isApproved ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold text-[10px]">
                                                        <IoCheckmarkCircleOutline className="text-xs" /> Verified & Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-bold text-[10px]">
                                                        <IoTimeOutline className="text-xs" /> Pending Approval
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => navigate(`/admin/vendors/${vendor._id}`)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-xs font-semibold text-gray-700 transition-all"
                                                >
                                                    <IoEyeOutline /> View Ledger
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
