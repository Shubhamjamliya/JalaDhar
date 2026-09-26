import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    IoWalletOutline,
    IoSearchOutline,
    IoCheckmarkCircleOutline,
    IoTimeOutline,
    IoEyeOutline,
    IoRefreshOutline,
    IoAddCircleOutline,
    IoRemoveCircleOutline,
    IoCloseOutline,
    IoWarningOutline,
    IoShieldCheckmarkOutline,
    IoReceiptOutline,
    IoArrowUpOutline,
    IoArrowDownOutline,
    IoInformationCircleOutline,
    IoFilterOutline,
    IoOpenOutline,
    IoChevronBackOutline,
    IoChevronForwardOutline,
} from 'react-icons/io5';
import { getAllVendors, adminAdjustVendorWallet, getVendorWalletTransactions } from '../../../services/adminApi';
import { formatCurrency } from '../utils/adminHelpers';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { hasAdminPermission } from '../../../utils/permissionUtils';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import toast from 'react-hot-toast';

const REASON_OPTIONS = [
    { value: 'DISPUTE_REFUND',   label: 'Dispute Refund',       desc: 'Customer dispute resolved in customer\'s favour — clawback from expert wallet.' },
    { value: 'FRAUD_PENALTY',    label: 'Fraud Penalty',        desc: 'Fraudulent or fake report detected — deducting previously credited amount.' },
    { value: 'CORRECTION',       label: 'Accounting Correction',desc: 'Fixing an overpayment or underpayment due to a system or human error.' },
    { value: 'GOODWILL_CREDIT',  label: 'Goodwill Credit',      desc: 'Compensating the expert for inconvenience, delay, or exceptional performance.' },
    { value: 'BOREWELL_PENALTY', label: 'Borewell Penalty',     desc: 'Manual penalty applied for a failed borewell outcome.' },
    { value: 'BOREWELL_REWARD',  label: 'Borewell Reward',      desc: 'Manual reward for a successful borewell outcome.' },
    { value: 'OTHER',            label: 'Other',                desc: 'Any other admin-justified reason — ensure notes explain fully.' },
];

function formatTxDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

const TX_TYPE_META = {
    ADMIN_CREDIT: {
        label: 'Admin Credit',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        isCredit: true
    },
    ADMIN_DEBIT: {
        label: 'Admin Debit',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        isCredit: false
    },
    SITE_VISIT: {
        label: 'Site Visit Fee (1st)',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        isCredit: true
    },
    REPORT_UPLOAD: {
        label: 'Report Upload (2nd)',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        isCredit: true
    },
    TRAVEL_CHARGES: {
        label: 'Travel Charges',
        badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
        isCredit: true
    },
    TRAVEL_CHARGES_REVERSAL: {
        label: 'Travel Reversal',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        isCredit: false
    },
    PLATFORM_FEE_DEDUCTION: {
        label: 'Platform Fee',
        badgeClass: 'bg-gray-100 text-gray-800 border-gray-200',
        isCredit: false
    },
    WITHDRAWAL_REQUEST: {
        label: 'Withdrawal Hold',
        badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        isCredit: false
    },
    WITHDRAWAL_PROCESSED: {
        label: 'Bank Disbursal',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
        isCredit: false
    },
    WITHDRAWAL_REJECTED: {
        label: 'Withdrawal Reversal',
        badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
        isCredit: true
    },
    FINAL_SETTLEMENT_REWARD: {
        label: 'Borewell Reward',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        isCredit: true
    },
    FINAL_SETTLEMENT_PENALTY: {
        label: 'Borewell Penalty',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        isCredit: false
    }
};

/* -------------------------------------------------------------
   AdjustWalletModal
------------------------------------------------------------- */
function AdjustWalletModal({ vendor, onClose, onSuccess }) {
    const [action, setAction]   = useState('CREDIT');
    const [amount, setAmount]   = useState('');
    const [reason, setReason]   = useState('');
    const [notes, setNotes]     = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [confirmStep, setConfirmStep] = useState(false);

    const currentBalance = vendor?.paymentCollection?.walletBalance || 0;
    const parsedAmount   = parseFloat(amount) || 0;
    const previewBalance = action === 'CREDIT'
        ? currentBalance + parsedAmount
        : currentBalance - parsedAmount;
    const isInsufficient = action === 'DEBIT' && parsedAmount > currentBalance;
    const selectedReason = REASON_OPTIONS.find(r => r.value === reason);

    const canProceed =
        parsedAmount > 0 &&
        reason &&
        notes.trim().length >= 10 &&
        !isInsufficient;

    const handleSubmit = async () => {
        if (!canProceed) return;
        if (!confirmStep) {
            setConfirmStep(true);
            return;
        }

        setSubmitting(true);
        try {
            const res = await adminAdjustVendorWallet(vendor._id, {
                action,
                amount: parsedAmount,
                reason,
                notes: notes.trim()
            });
            if (res.success) {
                toast.success(`₹${parsedAmount.toFixed(2)} ${action === 'CREDIT' ? 'credited to' : 'debited from'} ${vendor.name}'s wallet`);
                onSuccess(vendor._id, res.data.balanceAfter);
                onClose();
            } else {
                toast.error(res.message || 'Adjustment failed');
                setConfirmStep(false);
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Something went wrong');
            setConfirmStep(false);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden z-10"
            >
                {/* Header */}
                <div className={`p-6 pb-5 ${action === 'CREDIT' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {action === 'CREDIT'
                                    ? <IoArrowUpOutline className="text-white text-lg" />
                                    : <IoArrowDownOutline className="text-white text-lg" />
                                }
                                <span className="text-white font-bold text-base">
                                    {action === 'CREDIT' ? 'Credit' : 'Debit'} Wallet
                                </span>
                            </div>
                            <h3 className="text-white font-extrabold text-lg leading-tight">{vendor?.name}</h3>
                            <p className="text-white/80 text-xs mt-0.5">{vendor?.phone} · Current: {formatCurrency(currentBalance)}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <IoCloseOutline className="text-2xl" />
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Action Selector (Credit / Debit) */}
                    <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold">
                        <button
                            onClick={() => { setAction('CREDIT'); setConfirmStep(false); }}
                            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 rounded-lg transition-all ${
                                action === 'CREDIT'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            <IoAddCircleOutline className="text-sm" /> Credit
                        </button>
                        <button
                            onClick={() => { setAction('DEBIT'); setConfirmStep(false); }}
                            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 rounded-lg transition-all ${
                                action === 'DEBIT'
                                    ? 'bg-red-500 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            <IoRemoveCircleOutline className="text-sm" /> Debit
                        </button>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 mb-1.5 block">Amount (₹)</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                            <input
                                type="number"
                                min="1"
                                value={amount}
                                onChange={e => { setAmount(e.target.value); setConfirmStep(false); }}
                                placeholder="0.00"
                                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-all"
                            />
                        </div>
                        {isInsufficient && (
                            <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1">
                                <IoWarningOutline /> Insufficient balance (max: {formatCurrency(currentBalance)})
                            </p>
                        )}
                        {parsedAmount > 0 && !isInsufficient && (
                            <div className="mt-2 flex items-center justify-between text-[11px]">
                                <span className="text-gray-400">Balance after adjustment</span>
                                <span className={`font-bold ${action === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {formatCurrency(previewBalance)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 mb-1.5 block">Reason</label>
                        <select
                            value={reason}
                            onChange={e => { setReason(e.target.value); setConfirmStep(false); }}
                            className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-all bg-white"
                        >
                            <option value="">Select a reason...</option>
                            {REASON_OPTIONS.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                        {selectedReason && (
                            <p className="text-[11px] text-gray-400 mt-1.5 flex items-start gap-1.5">
                                <IoInformationCircleOutline className="shrink-0 mt-px" />
                                {selectedReason.desc}
                            </p>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 mb-1.5 flex justify-between">
                            <span>Internal Notes <span className="text-red-400">*</span></span>
                            <span className={`font-normal ${notes.trim().length < 10 ? 'text-red-400' : 'text-emerald-500'}`}>
                                {notes.trim().length} / 10 min
                            </span>
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={e => { setNotes(e.target.value); setConfirmStep(false); }}
                            placeholder="e.g. Customer raised dispute #DIS-4821, investigation concluded in their favour. Clawback of site-visit fee."
                            className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-all resize-none leading-relaxed"
                        />
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                            <IoShieldCheckmarkOutline /> Stored permanently in audit log with your Admin ID.
                        </p>
                    </div>

                    {/* Confirm step */}
                    <AnimatePresence>
                        {confirmStep && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`rounded-2xl p-4 border text-xs font-medium ${
                                    action === 'CREDIT'
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                        : 'bg-red-50 border-red-200 text-red-800'
                                }`}
                            >
                                <p className="font-bold mb-1 flex items-center gap-1.5">
                                    <IoWarningOutline className="text-sm" />
                                    Confirm this adjustment
                                </p>
                                <p>
                                    You are about to <strong>{action === 'CREDIT' ? 'credit' : 'debit'}</strong> <strong>{formatCurrency(parsedAmount)}</strong> {action === 'CREDIT' ? 'to' : 'from'} <strong>{vendor?.name}</strong>'s wallet.
                                </p>
                                <p className="mt-1 text-[11px] opacity-70">Reason: {selectedReason?.label} — {notes.trim().slice(0, 60)}{notes.trim().length > 60 ? '…' : ''}</p>
                                <p className="mt-1.5 font-bold">This action is irreversible and recorded in the audit trail.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-4 pt-0 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!canProceed || submitting}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                            action === 'CREDIT'
                                ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                                : 'bg-red-500 hover:bg-red-600 active:scale-95'
                        }`}
                    >
                        {submitting ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : confirmStep ? (
                            <><IoShieldCheckmarkOutline className="text-sm" /> Confirm & Apply</>
                        ) : (
                            <><IoReceiptOutline className="text-sm" /> Review Adjustment</>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

/* -------------------------------------------------------------
   VendorLedgerDrawer (Full Transaction Ledger for Expert)
------------------------------------------------------------- */
function VendorLedgerDrawer({ vendor, onClose, onOpenAdjust, canAdjust }) {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [typeFilter, setTypeFilter]     = useState('ALL');
    const [page, setPage]                 = useState(1);
    const [pagination, setPagination]     = useState({ currentPage: 1, totalPages: 1, total: 0 });

    const fetchLedger = useCallback(async () => {
        if (!vendor?._id) return;
        setLoading(true);
        try {
            const params = { page, limit: 15 };
            if (typeFilter !== 'ALL') {
                params.type = typeFilter;
            }
            const res = await getVendorWalletTransactions(vendor._id, params);
            if (res.success) {
                setTransactions(res.data.transactions || []);
                setPagination(res.data.pagination || { currentPage: 1, totalPages: 1, total: 0 });
            }
        } catch (err) {
            console.error('Failed to load vendor ledger:', err);
            toast.error('Failed to load transaction history');
        } finally {
            setLoading(false);
        }
    }, [vendor?._id, page, typeFilter]);

    useEffect(() => {
        fetchLedger();
    }, [fetchLedger]);

    const FILTER_TABS = [
        { id: 'ALL', label: 'All' },
        { id: 'ADMIN_CREDIT,ADMIN_DEBIT', label: 'Admin Adjustments' },
        { id: 'SITE_VISIT,REPORT_UPLOAD,TRAVEL_CHARGES', label: 'Earnings' },
        { id: 'WITHDRAWAL_REQUEST,WITHDRAWAL_PROCESSED,WITHDRAWAL_REJECTED', label: 'Withdrawals' },
        { id: 'FINAL_SETTLEMENT_REWARD,FINAL_SETTLEMENT_PENALTY', label: 'Settlement' },
    ];

    const currentBalance = vendor?.paymentCollection?.walletBalance || 0;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Slide-over Drawer */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col z-10 font-outfit"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-slate-900 text-white">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 font-black text-lg flex items-center justify-center border border-emerald-500/30">
                                {(vendor?.name || 'E').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-white">{vendor?.name}</h2>
                                    {vendor?.isApproved ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                                            Verified
                                        </span>
                                    ) : (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
                                            Pending
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">{vendor?.email} · {vendor?.phone}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
                        >
                            <IoCloseOutline className="text-xl" />
                        </button>
                    </div>

                    {/* Balance Banner & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                        <div>
                            <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Current Wallet Balance</span>
                            <div className="text-2xl font-black text-emerald-400">{formatCurrency(currentBalance)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            {canAdjust && (
                                <button
                                    onClick={() => onOpenAdjust(vendor)}
                                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                                >
                                    <IoWalletOutline className="text-sm" /> Adjust Balance
                                </button>
                            )}
                            <button
                                onClick={() => navigate(`/admin/vendors/${vendor._id}`)}
                                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-medium text-xs transition-all flex items-center gap-1"
                                title="Open full profile details"
                            >
                                <IoOpenOutline className="text-sm" /> Full Profile
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/70 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {FILTER_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setTypeFilter(tab.id); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                typeFilter === tab.id
                                    ? 'bg-white text-emerald-700 shadow-xs border border-gray-200'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                    <button
                        onClick={fetchLedger}
                        className="ml-auto p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                        title="Refresh transactions"
                    >
                        <IoRefreshOutline className={`text-base ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Transactions Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                            <LoadingSpinner />
                            <p className="text-xs font-semibold mt-3">Loading transaction ledger...</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 rounded-2xl">
                            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-2">
                                <IoReceiptOutline className="text-2xl" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-800">No Transactions Found</h4>
                            <p className="text-xs text-gray-400 max-w-xs mt-1">
                                No wallet activity recorded under this filter yet.
                            </p>
                        </div>
                    ) : (
                        transactions.map(tx => {
                            const meta = TX_TYPE_META[tx.type] || {
                                label: tx.type,
                                badgeClass: 'bg-gray-100 text-gray-800 border-gray-200',
                                isCredit: tx.amount > 0
                            };
                            const isCredit = tx.amount > 0;
                            const amountVal = Math.abs(tx.amount || 0);
                            const isAdminAdjustment = tx.type === 'ADMIN_CREDIT' || tx.type === 'ADMIN_DEBIT';

                            return (
                                <div
                                    key={tx._id}
                                    className="p-4 rounded-2xl border border-gray-100 hover:border-gray-200 bg-white transition-all shadow-xs space-y-2.5"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                                isCredit
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                                            }`}>
                                                {isCredit
                                                    ? <IoArrowUpOutline className="text-base" />
                                                    : <IoArrowDownOutline className="text-base" />
                                                }
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.badgeClass}`}>
                                                        {meta.label}
                                                    </span>
                                                    {isAdminAdjustment && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                                            Manual Adjustment
                                                        </span>
                                                    )}
                                                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                                        tx.status === 'SUCCESS' ? 'text-emerald-700 bg-emerald-50' :
                                                        tx.status === 'PENDING' ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
                                                    }`}>
                                                        {tx.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-semibold text-gray-800 mt-1 leading-snug">
                                                    {tx.description || meta.label}
                                                </p>
                                                <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <IoTimeOutline className="text-xs" />
                                                        {formatTxDate(tx.createdAt)}
                                                    </span>
                                                    {tx.booking && (
                                                        <span>Booking #{typeof tx.booking === 'string' ? tx.booking.slice(-6) : tx.booking._id?.slice(-6)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <div className={`text-base font-black ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {isCredit ? '+' : '-'}{formatCurrency(amountVal)}
                                            </div>
                                            {tx.balanceBefore !== undefined && tx.balanceAfter !== undefined && (
                                                <div className="text-[10px] text-gray-400 mt-0.5 font-medium">
                                                    {formatCurrency(tx.balanceBefore)} → <strong className="text-gray-700">{formatCurrency(tx.balanceAfter)}</strong>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Admin Reason / Audit Trail details */}
                                    {isAdminAdjustment && tx.metadata?.notes && (
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-700 space-y-1">
                                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                <span className="flex items-center gap-1">
                                                    <IoShieldCheckmarkOutline className="text-emerald-600" />
                                                    Audit Trail Note
                                                </span>
                                                {tx.metadata.reason && (
                                                    <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold lowercase first-letter:uppercase">
                                                        {tx.metadata.reason}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="italic text-[11px] text-slate-600 leading-relaxed">
                                                "{tx.metadata.notes}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">
                            Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} total)
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            >
                                <IoChevronBackOutline />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            >
                                <IoChevronForwardOutline />
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

/* -------------------------------------------------------------
   Main AdminVendorWallets Component
------------------------------------------------------------- */
export default function AdminVendorWallets() {
    const navigate = useNavigate();
    const { admin: currentAdmin } = useAdminAuth();
    const canAdjust = hasAdminPermission(currentAdmin, 'can_adjust_wallets') ||
        currentAdmin?.role === 'SUPER_ADMIN' ||
        currentAdmin?.role === 'ADMIN' ||
        currentAdmin?.role === 'FINANCE_ADMIN';

    const [vendors, setVendors]           = useState([]);
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [adjustTarget, setAdjustTarget] = useState(null); // vendor to adjust
    const [ledgerTarget, setLedgerTarget] = useState(null); // vendor to view ledger

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await getAllVendors({ limit: 100 });
            if (res.success) setVendors(res.data.vendors || []);
        } catch (err) {
            console.error('Failed to load expert wallets', err);
            toast.error('Failed to load expert wallets');
        } finally {
            setLoading(false);
        }
    };

    // Optimistically update local balance after adjustment
    const handleAdjustSuccess = useCallback((vendorId, newBalance) => {
        setVendors(prev => prev.map(v =>
            v._id === vendorId
                ? { ...v, paymentCollection: { ...(v.paymentCollection || {}), walletBalance: newBalance } }
                : v
        ));
        // If ledger drawer is currently open for this vendor, update its vendor state too
        setLedgerTarget(current =>
            current?._id === vendorId
                ? { ...current, paymentCollection: { ...(current.paymentCollection || {}), walletBalance: newBalance } }
                : current
        );
    }, []);

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

    const totalBalance = vendors.reduce((acc, v) => acc + (v.paymentCollection?.walletBalance || v.walletBalance || 0), 0);
    const totalPending = vendors.filter(v => !v.isApproved).length * 4130;

    return (
        <>
            <div className="space-y-6 p-6 pb-20 lg:pb-6 max-w-7xl mx-auto font-outfit">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <IoWalletOutline className="text-emerald-600" />
                            Expert Wallets &amp; Disbursals
                        </h1>
                        <p className="text-gray-500 text-sm">Master ledger for expert wallet balances, manual adjustments, and payout history</p>
                    </div>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2 self-start md:self-auto"
                    >
                        <IoRefreshOutline /> Refresh
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl">
                            <IoWalletOutline />
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-gray-400">Total System Balance</div>
                            <div className="text-xl font-bold text-gray-900">{formatCurrency(totalBalance)}</div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl">
                            <IoTimeOutline />
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-gray-400">Est. Pending Approvals</div>
                            <div className="text-xl font-bold text-gray-900">{formatCurrency(totalPending)}</div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
                            <IoCheckmarkCircleOutline />
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-gray-400">Active Expert Wallets</div>
                            <div className="text-xl font-bold text-gray-900">{vendors.filter(v => v.isApproved).length} Experts</div>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative w-full md:w-96">
                        <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setStatusFilter('active')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                            Active Only
                        </button>
                        <button
                            onClick={() => setStatusFilter('pending')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'pending' ? 'bg-emerald-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                            Pending Only
                        </button>
                    </div>
                </div>

                {/* Wallets Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                    {loading ? (
                        <div className="p-8"><LoadingSpinner /></div>
                    ) : filteredVendors.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">No experts found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                                        <th className="p-4">Expert</th>
                                        <th className="p-4">Designation</th>
                                        <th className="p-4">Wallet Balance</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-xs">
                                    {filteredVendors.map((vendor) => {
                                        const bal = vendor.paymentCollection?.walletBalance || 0;
                                        return (
                                            <tr key={vendor._id} className="hover:bg-gray-50/80 transition-colors">
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
                                                            <IoCheckmarkCircleOutline className="text-xs" /> Verified &amp; Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-bold text-[10px]">
                                                            <IoTimeOutline className="text-xs" /> Pending Approval
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Adjust Wallet Button (Permission Gated) */}
                                                        {canAdjust && (
                                                            <button
                                                                id={`adjust-wallet-${vendor._id}`}
                                                                onClick={() => setAdjustTarget(vendor)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition-all"
                                                                title="Manually credit or debit this wallet"
                                                            >
                                                                <IoWalletOutline /> Adjust
                                                            </button>
                                                        )}
                                                        {/* View Ledger Button */}
                                                        <button
                                                            id={`view-ledger-${vendor._id}`}
                                                            onClick={() => setLedgerTarget(vendor)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-slate-200 text-gray-700 rounded-lg text-xs font-semibold transition-all"
                                                            title="Open full ledger drawer"
                                                        >
                                                            <IoEyeOutline /> View Ledger
                                                        </button>
                                                    </div>
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

            {/* Adjustment Modal */}
            <AnimatePresence>
                {adjustTarget && (
                    <AdjustWalletModal
                        key="adjust-modal"
                        vendor={adjustTarget}
                        onClose={() => setAdjustTarget(null)}
                        onSuccess={handleAdjustSuccess}
                    />
                )}
            </AnimatePresence>

            {/* Vendor Ledger Slide-Over Drawer */}
            <AnimatePresence>
                {ledgerTarget && (
                    <VendorLedgerDrawer
                        key="ledger-drawer"
                        vendor={ledgerTarget}
                        onClose={() => setLedgerTarget(null)}
                        onOpenAdjust={(v) => {
                            setAdjustTarget(v);
                        }}
                        canAdjust={canAdjust}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
