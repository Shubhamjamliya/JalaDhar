import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoAlertCircleOutline,
    IoSearchOutline,
    IoEyeOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoTimeOutline,
    IoPersonOutline,
    IoDocumentTextOutline,
    IoCloseOutline,
    IoChatbubbleOutline,
    IoArrowForwardOutline,
    IoSwapHorizontalOutline,
    IoWalletOutline,
    IoArrowDownOutline,
    IoWarningOutline
} from "react-icons/io5";
import {
    getAllDisputes,
    getDisputeStatistics,
    getDisputeDetails,
    updateDisputeStatus,
    assignDispute,
    addDisputeComment,
    getAllAdmins,
    adminAdjustVendorWallet
} from "../../../services/adminApi";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import { getPublicSettings } from "../../../services/settingsApi";
import { hasAdminPermission } from "../../../utils/permissionUtils";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";
import AssignmentHistoryModal from "../admin-component/AssignmentHistoryModal";

/* ─────────────────────────────────────────────────────────────────────────
   DisputeWalletDebitModal — Smart Expert Wallet Clawback
   Shows payment trail, dispute-type recommendation, preset scenarios &
   edge case guards (empty wallet, nothing credited, partial balance).
───────────────────────────────────────────────────────────────────────── */
function DisputeWalletDebitModal({ dispute, onClose, onSuccess, toast }) {
    const vendor = dispute?.booking?.vendor;
    const payments = dispute?.booking?.payment?.vendorWalletPayments;
    const bookingStatus = dispute?.booking?.status;
    const currentBalance = vendor?.paymentCollection?.walletBalance || 0;
    const totalCredited = payments?.totalCredited || 0;

    // ── Recommendation engine (keyed by dispute type) ──────────────────────
    const siteVisit    = payments?.siteVisitPayment  || {};
    const reportPmt    = payments?.reportUploadPayment || {};
    const walletEmpty  = currentBalance <= 0;
    const nothingCredited = totalCredited === 0;

    const CLAWBACK_MAP = {
        "Expert did not arrive":      { scenarioKey: "full",          reasonCode: "FRAUD_PENALTY",   severity: "critical", label: "Full Clawback — Expert Never Arrived (Fraud)", logic: "Expert was paid for site visit and/or report but never arrived. Both payments should be fully clawed back." },
        "Expert arrived late":        { scenarioKey: "siteVisitHalf", reasonCode: "DISPUTE_REFUND",  severity: "medium",   label: "50% of Site Visit Payment",                   logic: "Expert arrived significantly late. Partial refund of the site visit installment is suggested." },
        "Survey not completed":       { scenarioKey: "siteVisit",     reasonCode: "DISPUTE_REFUND",  severity: "high",     label: "Clawback Site Visit Payment",                 logic: "Expert visited but did not finish the survey. Site visit payment should be reversed." },
        "Incorrect survey location":  { scenarioKey: "report",        reasonCode: "DISPUTE_REFUND",  severity: "high",     label: "Clawback Report Upload Payment",              logic: "Expert surveyed the wrong location. Report payment is invalid and should be clawed back." },
        "Survey report issue":        { scenarioKey: "report",        reasonCode: "DISPUTE_REFUND",  severity: "high",     label: "Clawback Report Upload Payment",              logic: "Expert was paid for the report but it has quality or accuracy issues. Report payment should be reversed." },
        "Expert behaviour":           { scenarioKey: "siteVisit",     reasonCode: "FRAUD_PENALTY",   severity: "high",     label: "Clawback Site Visit Payment",                 logic: "Expert misconduct during the visit. Site visit payment should be penalised." },
        "Requested offline payment":  { scenarioKey: "custom",        reasonCode: "FRAUD_PENALTY",   severity: "high",     label: "Custom Penalty Amount",                       logic: "Expert requested cash payment — a policy violation. Apply a penalty as decided." },
        "Safety concern":             { scenarioKey: "full",          reasonCode: "FRAUD_PENALTY",   severity: "critical", label: "Full Clawback + Fraud Penalty",               logic: "Serious safety violation. Full clawback is recommended." },
        "Payment issue":              { scenarioKey: "custom",        reasonCode: "CORRECTION",      severity: "low",      label: "Ledger Correction",                           logic: "Payment discrepancy. Review and enter the exact correction amount." },
        "Refund issue":               { scenarioKey: "custom",        reasonCode: "DISPUTE_REFUND",  severity: "medium",   label: "Custom Refund Amount",                        logic: "User refund dispute. Enter the exact amount based on your refund policy." },
        "Travel charges issue":       { scenarioKey: "custom",        reasonCode: "CORRECTION",      severity: "low",      label: "Custom Clawback Amount",                      logic: "Travel charges were disputed. Enter the specific disputed travel amount." },
    };
    const rec = CLAWBACK_MAP[dispute?.type] || { scenarioKey: "custom", reasonCode: "DISPUTE_REFUND", severity: "low", label: "Custom Amount", logic: "No specific recommendation. Review the dispute and enter an appropriate amount." };

    // Scenario → computed amounts (capped at available balance)
    const siteVisitAmt     = siteVisit.credited  ? (siteVisit.amount  || 0) : 0;
    const reportAmt        = reportPmt.credited  ? (reportPmt.amount  || 0) : 0;
    const siteVisitHalfAmt = Math.round(siteVisitAmt / 2);
    const SCENARIO_AMOUNTS = {
        full:          Math.min(totalCredited, currentBalance),
        siteVisit:     Math.min(siteVisitAmt, currentBalance),
        siteVisitHalf: Math.min(siteVisitHalfAmt, currentBalance),
        report:        Math.min(reportAmt, currentBalance),
        custom:        0,
    };

    const [selectedScenario, setSelectedScenario] = useState(rec.scenarioKey);
    const [amount,    setAmount]    = useState(() => { const a = SCENARIO_AMOUNTS[rec.scenarioKey]; return a > 0 ? String(a) : ""; });
    const [reason,    setReason]    = useState(rec.reasonCode);
    const [notes,     setNotes]     = useState(
        `Clawback for Dispute #${dispute?._id?.toString().slice(-8).toUpperCase()} ` +
        `(Booking #${dispute?.booking?._id?.toString().slice(-8).toUpperCase()}) — ` +
        `${dispute?.type || dispute?.subject || ''}`
    );
    const [confirmStep, setConfirmStep] = useState(false);
    const [submitting,  setSubmitting]  = useState(false);

    const parsedAmount = parseFloat(amount) || 0;
    const isOverdraft  = parsedAmount > currentBalance;
    const previewBal   = currentBalance - parsedAmount;

    const canProceed =
        parsedAmount > 0 && reason &&
        notes.trim().length >= 10 &&
        !isOverdraft && !walletEmpty;

    const applyScenario = (key, amt, reasonCode) => {
        setSelectedScenario(key);
        setAmount(amt > 0 ? String(amt) : "");
        setReason(reasonCode || rec.reasonCode);
        setConfirmStep(false);
    };

    const severityStyle = {
        critical: "bg-rose-50 border-rose-300 text-rose-900",
        high:     "bg-amber-50 border-amber-300 text-amber-900",
        medium:   "bg-yellow-50 border-yellow-300 text-yellow-900",
        low:      "bg-blue-50 border-blue-200 text-blue-900",
    }[rec.severity] || "bg-gray-50 border-gray-200 text-gray-800";

    const handleSubmit = async () => {
        if (!canProceed) return;
        if (!confirmStep) { setConfirmStep(true); return; }

        setSubmitting(true);
        try {
            const res = await adminAdjustVendorWallet(vendor._id, {
                action: 'DEBIT', amount: parsedAmount, reason, notes: notes.trim()
            });
            if (res.success) {
                const scenarioLabel = { full: "Full Clawback", siteVisit: "Site Visit Clawback", siteVisitHalf: "50% Site Visit Clawback", report: "Report Upload Clawback", custom: "Custom Clawback" }[selectedScenario] || "Clawback";
                try {
                    await addDisputeComment(dispute._id, {
                        comment:
                            `ADMIN WALLET CLAWBACK [${scenarioLabel}]\n` +
                            `Debited: Rs.${parsedAmount.toFixed(2)} from ${vendor.name}\n` +
                            `Reason: ${reason} | Dispute type: ${dispute?.type}\n` +
                            `Notes: ${notes.trim()}`,
                    });
                } catch (e) { console.error("Audit comment failed:", e); }
                toast.showSuccess(`Rs.${parsedAmount.toFixed(2)} clawed back from ${vendor.name}'s wallet`);
                onSuccess();
                onClose();
            } else {
                toast.showError(res.message || 'Debit failed');
                setConfirmStep(false);
            }
        } catch (err) {
            toast.showError(err?.response?.data?.message || err?.message || 'Failed to adjust wallet');
            setConfirmStep(false);
        } finally {
            setSubmitting(false);
        }
    };

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-4 border border-gray-100">

                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <IoArrowDownOutline className="text-xl" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Expert Wallet Clawback</h3>
                            <p className="text-[11px] text-gray-400">
                                Dispute #{dispute?._id?.toString().slice(-8).toUpperCase()}&nbsp;&middot;&nbsp;
                                Booking #{dispute?.booking?._id?.toString().slice(-8).toUpperCase()}&nbsp;&middot;&nbsp;
                                <span className="font-semibold text-gray-500">{dispute?.type}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={submitting} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer">
                        <IoCloseOutline className="text-2xl" />
                    </button>
                </div>

                <div className="p-6 space-y-5">

                    {/* EDGE CASE: No Booking */}
                    {!dispute?.booking && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-500">
                            No booking linked — clawback not applicable.
                        </div>
                    )}

                    {/* EDGE CASE: Wallet Empty */}
                    {dispute?.booking && walletEmpty && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
                            <IoWarningOutline className="text-rose-500 text-xl mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-rose-800">Wallet is empty</p>
                                <p className="text-xs text-rose-600 mt-0.5">Balance is ₹0. Expert may have withdrawn. Use the Refunds workflow instead.</p>
                            </div>
                        </div>
                    )}

                    {/* EDGE CASE: Nothing Credited for this booking yet */}
                    {dispute?.booking && !walletEmpty && nothingCredited && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                            <IoWarningOutline className="text-amber-500 text-xl mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-amber-800">No payments for this booking</p>
                                <p className="text-xs text-amber-700 mt-0.5">Balance (₹{currentBalance.toFixed(2)}) is from other bookings. Any debit here is a manual correction.</p>
                            </div>
                        </div>
                    )}

                    {/* Expert summary card */}
                    {dispute?.booking && (
                        <div className="bg-gradient-to-r from-gray-50 to-amber-50/30 rounded-2xl p-4 border border-amber-100 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <IoWalletOutline className="text-xl" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Expert</span>
                                        {vendor?.designation && <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-semibold">{vendor.designation}</span>}
                                    </div>
                                    <p className="text-sm font-bold text-gray-900">{vendor?.name}</p>
                                    <p className="text-[11px] text-gray-400">{vendor?.email} &middot; {vendor?.phone}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold uppercase text-gray-400 block">Wallet Balance</span>
                                <span className={`text-lg font-black ${currentBalance > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    ₹{Number(currentBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] text-gray-400 block mt-0.5">Booking: <strong>{bookingStatus}</strong></span>
                            </div>
                        </div>
                    )}

                    {/* Payment Trail Table */}
                    {dispute?.booking && (
                        <div>
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Payment Trail</h4>
                            <div className="rounded-xl border border-gray-100 overflow-hidden text-xs">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="text-left px-4 py-2.5 font-bold text-gray-500">Payment Stage</th>
                                            <th className="text-right px-4 py-2.5 font-bold text-gray-500">Amount</th>
                                            <th className="text-center px-4 py-2.5 font-bold text-gray-500">Status</th>
                                            <th className="text-right px-4 py-2.5 font-bold text-gray-500">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        <tr className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-gray-800">Site Visit</p>
                                                <p className="text-[10px] text-gray-400">On OTP-verified survey start</p>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-800">
                                                {siteVisit.amount > 0 ? `₹${Number(siteVisit.amount).toLocaleString('en-IN')}` : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {siteVisit.credited ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold"><IoCheckmarkCircleOutline />Paid</span>
                                                ) : siteVisit.failed ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold"><IoCloseCircleOutline />Failed</span>
                                                ) : siteVisit.amount > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold"><IoTimeOutline />Pending</span>
                                                ) : <span className="text-gray-300 font-semibold">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-500">{fmtDate(siteVisit.creditedAt)}</td>
                                        </tr>
                                        <tr className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-gray-800">Report Upload</p>
                                                <p className="text-[10px] text-gray-400">On report submission</p>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-800">
                                                {reportPmt.amount > 0 ? `₹${Number(reportPmt.amount).toLocaleString('en-IN')}` : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {reportPmt.credited ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold"><IoCheckmarkCircleOutline />Paid</span>
                                                ) : reportPmt.failed ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold"><IoCloseCircleOutline />Failed</span>
                                                ) : reportPmt.amount > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold"><IoTimeOutline />Pending</span>
                                                ) : <span className="text-gray-300 font-semibold">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-500">{fmtDate(reportPmt.creditedAt)}</td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-50 border-t border-gray-100">
                                            <td className="px-4 py-2.5 font-bold text-gray-700">Total Credited</td>
                                            <td className="px-4 py-2.5 text-right font-black text-gray-900">₹{Number(totalCredited).toLocaleString('en-IN')}</td>
                                            <td colSpan={2} className="px-4 py-2.5 text-right text-[10px] text-gray-400">
                                                Max: ₹{Math.min(totalCredited, currentBalance).toFixed(0)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            {/* Partial balance warning */}
                            {totalCredited > 0 && currentBalance < totalCredited && !walletEmpty && (
                                <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-800">
                                    <IoWarningOutline className="text-amber-500 text-base mt-0.5 shrink-0" />
                                    <span>Balance (<strong>₹{currentBalance.toFixed(2)}</strong>) &lt; credited (<strong>₹{totalCredited}</strong>). Expert may have withdrawn. Debit is capped at balance.</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Smart Recommendation Banner */}
                    {dispute?.booking && !walletEmpty && (
                        <div className={`rounded-xl border p-4 ${severityStyle}`}>
                            <div className="flex items-start gap-2.5">
                                <IoAlertCircleOutline className="text-xl mt-0.5 shrink-0 opacity-70" />
                                <div className="flex-1">
                                    <div className="flex items-center flex-wrap gap-2 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Suggested Action</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white ${
                                            rec.severity === 'critical' ? 'bg-rose-600' : rec.severity === 'high' ? 'bg-amber-500' : rec.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                        }`}>{rec.severity?.toUpperCase()}</span>
                                    </div>
                                    <p className="font-bold text-sm mb-1">{rec.label}</p>
                                    <p className="text-[11px] leading-relaxed opacity-75">{rec.logic}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preset Scenario Buttons */}
                    {dispute?.booking && !walletEmpty && (
                        <div>
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Scenario</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                                {totalCredited > 0 && (
                                    <button type="button" onClick={() => applyScenario('full', SCENARIO_AMOUNTS.full, 'FRAUD_PENALTY')}
                                        className={`text-left px-4 py-3 rounded-xl border text-xs transition-all cursor-pointer ${selectedScenario === 'full' ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200' : 'border-gray-200 hover:border-rose-300 hover:bg-rose-50/40'}`}>
                                        <p className="font-bold text-rose-700 flex items-center gap-1">{selectedScenario === 'full' && <IoCheckmarkCircleOutline />}Full Clawback</p>
                                        <p className="text-gray-500 text-[10px] mt-0.5">₹{Math.min(totalCredited, currentBalance).toFixed(2)}</p>
                                        <p className="text-gray-400 text-[10px] mt-1">No-show · fraud · safety</p>
                                    </button>
                                )}

                                {siteVisitAmt > 0 && (
                                    <button type="button" onClick={() => applyScenario('siteVisit', SCENARIO_AMOUNTS.siteVisit, 'DISPUTE_REFUND')}
                                        className={`text-left px-4 py-3 rounded-xl border text-xs transition-all cursor-pointer ${selectedScenario === 'siteVisit' ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200' : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/40'}`}>
                                        <p className="font-bold text-amber-700 flex items-center gap-2">{selectedScenario === 'siteVisit' && <IoCheckmarkCircleOutline />}
                                            Site Visit
                                            {rec.scenarioKey === 'siteVisit' && <span className="text-[9px] px-1.5 py-0.5 bg-amber-500 text-white rounded-full font-bold">RECOMMENDED</span>}
                                        </p>
                                        <p className="text-gray-500 text-[10px] mt-0.5">₹{siteVisitAmt.toFixed(2)}</p>
                                        <p className="text-gray-400 text-[10px] mt-1">Survey incomplete · misconduct</p>
                                    </button>
                                )}

                                {siteVisitAmt > 0 && (
                                    <button type="button" onClick={() => applyScenario('siteVisitHalf', SCENARIO_AMOUNTS.siteVisitHalf, 'DISPUTE_REFUND')}
                                        className={`text-left px-4 py-3 rounded-xl border text-xs transition-all cursor-pointer ${selectedScenario === 'siteVisitHalf' ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-200' : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/30'}`}>
                                        <p className="font-bold text-yellow-700 flex items-center gap-2">{selectedScenario === 'siteVisitHalf' && <IoCheckmarkCircleOutline />}
                                            50% Site Visit
                                            {rec.scenarioKey === 'siteVisitHalf' && <span className="text-[9px] px-1.5 py-0.5 bg-yellow-500 text-white rounded-full font-bold">RECOMMENDED</span>}
                                        </p>
                                        <p className="text-gray-500 text-[10px] mt-0.5">₹{siteVisitHalfAmt.toFixed(2)}</p>
                                        <p className="text-gray-400 text-[10px] mt-1">Late arrival · partial service</p>
                                    </button>
                                )}

                                {reportAmt > 0 && (
                                    <button type="button" onClick={() => applyScenario('report', SCENARIO_AMOUNTS.report, 'DISPUTE_REFUND')}
                                        className={`text-left px-4 py-3 rounded-xl border text-xs transition-all cursor-pointer ${selectedScenario === 'report' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40'}`}>
                                        <p className="font-bold text-indigo-700 flex items-center gap-2">{selectedScenario === 'report' && <IoCheckmarkCircleOutline />}
                                            Report Upload
                                            {rec.scenarioKey === 'report' && <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500 text-white rounded-full font-bold">RECOMMENDED</span>}
                                        </p>
                                        <p className="text-gray-500 text-[10px] mt-0.5">₹{reportAmt.toFixed(2)}</p>
                                        <p className="text-gray-400 text-[10px] mt-1">Bad report · wrong location</p>
                                    </button>
                                )}

                                <button type="button" onClick={() => applyScenario('custom', 0, rec.reasonCode)}
                                    className={`text-left px-4 py-3 rounded-xl border text-xs transition-all cursor-pointer ${selectedScenario === 'custom' ? 'border-gray-500 bg-gray-50 ring-2 ring-gray-200' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}>
                                    <p className="font-bold text-gray-700 flex items-center gap-2">{selectedScenario === 'custom' && <IoCheckmarkCircleOutline />}
                                        Custom
                                        {rec.scenarioKey === 'custom' && <span className="text-[9px] px-1.5 py-0.5 bg-gray-500 text-white rounded-full font-bold">RECOMMENDED</span>}
                                    </p>
                                    <p className="text-gray-500 text-[10px] mt-0.5">Enter any amount</p>
                                    <p className="text-gray-400 text-[10px] mt-1">Ledger fix · travel · other</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Amount / Reason / Notes */}
                    {dispute?.booking && !walletEmpty && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Debit Amount (₹) <span className="text-rose-500">*</span>
                                    {selectedScenario !== 'custom' && <span className="ml-2 text-[10px] text-blue-500 font-semibold">Pre-filled from scenario</span>}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                    <input type="number" step="0.01" min="1" max={currentBalance} value={amount}
                                        onChange={(e) => { setAmount(e.target.value); setSelectedScenario('custom'); setConfirmStep(false); }}
                                        placeholder="Enter amount"
                                        className={`w-full pl-8 pr-4 py-2.5 text-sm font-semibold rounded-xl border outline-none transition-all ${isOverdraft ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-300' : 'border-gray-200 focus:ring-2 focus:ring-blue-400'}`}
                                    />
                                </div>
                                {isOverdraft && (
                                    <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                                        <IoWarningOutline /> Exceeds balance (₹{currentBalance.toFixed(2)}). Overdrafts not allowed.
                                    </p>
                                )}
                                {!isOverdraft && parsedAmount > 0 && (
                                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                                        <span>Balance after:</span>
                                        <span className="font-bold text-gray-800">₹{previewBal.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Reason Code <span className="text-rose-500">*</span></label>
                                <select value={reason} onChange={(e) => { setReason(e.target.value); setConfirmStep(false); }}
                                    className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="DISPUTE_REFUND">DISPUTE_REFUND — Survey / Report issue</option>
                                    <option value="FRAUD_PENALTY">FRAUD_PENALTY — No-show / Fraud / Safety</option>
                                    <option value="BOREWELL_PENALTY">BOREWELL_PENALTY — Borewell settlement</option>
                                    <option value="CORRECTION">CORRECTION — Ledger correction</option>
                                    <option value="OTHER">OTHER — Other</option>
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-gray-700">Audit Notes <span className="text-rose-500">*</span></label>
                                    <span className={`text-[10px] ${notes.trim().length >= 10 ? 'text-gray-400' : 'text-rose-500 font-bold'}`}>{notes.trim().length} chars (min 10)</span>
                                </div>
                                <textarea value={notes} onChange={(e) => { setNotes(e.target.value); setConfirmStep(false); }} rows={2}
                                    placeholder="Reason for this debit..."
                                    className="w-full px-3.5 py-2.5 text-xs text-gray-800 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* 2-Step Confirmation */}
                    {confirmStep && (
                        <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-rose-900">
                                <IoWarningOutline className="text-rose-600 text-lg" />
                                Confirm Clawback
                            </div>
                            <div className="text-xs text-rose-800 space-y-1">
                                <p>Debit <strong>₹{parsedAmount.toFixed(2)}</strong> from <strong>{vendor?.name}</strong>.</p>
                                <p>Creates a permanent ledger entry + audit comment.</p>
                                <p className="text-rose-600">{selectedScenario} &middot; {reason}</p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                        <button type="button"
                            onClick={() => { if (confirmStep) setConfirmStep(false); else onClose(); }}
                            disabled={submitting}
                            className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 cursor-pointer">
                            {confirmStep ? "← Back" : "Cancel"}
                        </button>
                        {!walletEmpty && (
                            <button type="button" onClick={handleSubmit}
                                disabled={!canProceed || submitting}
                                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${confirmStep ? 'bg-rose-700 hover:bg-rose-800 ring-2 ring-rose-400 shadow-lg' : 'bg-rose-600 hover:bg-rose-700'} disabled:opacity-40 disabled:cursor-not-allowed`}>
                                {submitting ? "Processing..." : confirmStep ? "✓ Confirm & Debit Now" : "Review Debit →"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const DEFAULT_DISPUTE_TYPES = [
    "Expert did not arrive",
    "Expert arrived late",
    "Survey not completed",
    "Incorrect survey location",
    "Payment issue",
    "Refund issue",
    "Travel charges issue",
    "Survey report issue",
    "Expert behaviour",
    "Requested offline payment",
    "Safety concern",
    "Other"
];

export default function AdminDisputes() {
    const navigate = useNavigate();
    const { admin: currentAdmin } = useAdminAuth();
    const toast = useToast();
    const [disputes, setDisputes] = useState([]);
    const [disputeTypes, setDisputeTypes] = useState(DEFAULT_DISPUTE_TYPES);
    const [availableSupportAdmins, setAvailableSupportAdmins] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        type: "",
        page: 1,
        limit: 20,
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalDisputes: 0,
    });
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [showDebitModal, setShowDebitModal] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [statusUpdate, setStatusUpdate] = useState({ status: "", notes: "" });
    const [actionLoading, setActionLoading] = useState(false);

    const isSuperAdmin = currentAdmin?.role === "SUPER_ADMIN";
    const canAdjustWallet = hasAdminPermission(currentAdmin, 'can_adjust_wallets') || ['SUPER_ADMIN', 'FINANCE_ADMIN'].includes(currentAdmin?.role);

    useEffect(() => {
        loadDisputes();
        loadStatistics();
        loadDisputeTypes();
        loadAvailableSupportAdmins();
    }, [filters.page, filters.search, filters.status, filters.type]);

    const loadAvailableSupportAdmins = async () => {
        try {
            const res = await getAllAdmins();
            if (res.success && res.data?.admins) {
                const supportAdmins = res.data.admins.filter(a =>
                    a.isActive && ['SUPPORT_ADMIN', 'CUSTOMER_SUPPORT_ADMIN', 'SUPER_ADMIN'].includes(a.role)
                );
                setAvailableSupportAdmins(supportAdmins);
            }
        } catch (err) {
            console.error("Failed to load support admins:", err);
        }
    };

    const loadDisputeTypes = async () => {
        try {
            const res = await getPublicSettings({ category: "general" });
            if (res.success && res.data?.settings) {
                const setting = res.data.settings.find(s => s.key === "DISPUTE_TYPES");
                if (setting && Array.isArray(setting.value) && setting.value.length > 0) {
                    setDisputeTypes(setting.value);
                }
            }
        } catch (err) {
            console.error("Failed to load dispute types setting:", err);
        }
    };

    const loadDisputes = async () => {
        try {
            setLoading(true);
            const params = {
                page: filters.page,
                limit: filters.limit,
            };
            if (filters.search) params.search = filters.search;
            if (filters.status) params.status = filters.status;
            if (filters.type) params.type = filters.type;

            const response = await getAllDisputes(params);
            if (response.success) {
                setDisputes(response.data.disputes || []);
                setPagination(response.data.pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalDisputes: 0,
                });
            } else {
                toast.showError(response.message || "Failed to load disputes");
            }
        } catch (err) {
            handleApiError(err, "Failed to load disputes");
        } finally {
            setLoading(false);
        }
    };

    const loadStatistics = async () => {
        try {
            setStatsLoading(true);
            const response = await getDisputeStatistics();
            if (response.success) {
                setStatistics(response.data);
            }
        } catch (err) {
            console.error("Failed to load statistics:", err);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleViewDetails = async (disputeId) => {
        try {
            const response = await getDisputeDetails(disputeId);
            if (response.success) {
                setSelectedDispute(response.data.dispute);
                setShowDetailsModal(true);
            } else {
                toast.showError("Failed to load dispute details");
            }
        } catch (err) {
            handleApiError(err, "Failed to load dispute details");
        }
    };

    const handleStatusUpdate = async () => {
        if (!statusUpdate.status) {
            toast.showError("Please select a status");
            return;
        }

        try {
            setActionLoading(true);
            const response = await updateDisputeStatus(selectedDispute._id, statusUpdate);
            if (response.success) {
                toast.showSuccess("Dispute status updated successfully");
                setShowStatusModal(false);
                setStatusUpdate({ status: "", notes: "" });
                await loadDisputes();
                await loadStatistics();
                if (showDetailsModal) {
                    await handleViewDetails(selectedDispute._id);
                }
            } else {
                toast.showError(response.message || "Failed to update dispute status");
            }
        } catch (err) {
            handleApiError(err, "Failed to update dispute status");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) {
            toast.showError("Please enter a comment");
            return;
        }

        try {
            setActionLoading(true);
            const response = await addDisputeComment(selectedDispute._id, { comment: newComment });
            if (response.success) {
                toast.showSuccess("Comment added successfully");
                setShowCommentModal(false);
                setNewComment("");
                if (showDetailsModal) {
                    await handleViewDetails(selectedDispute._id);
                }
            } else {
                toast.showError(response.message || "Failed to add comment");
            }
        } catch (err) {
            handleApiError(err, "Failed to add comment");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReassignDispute = async (newAdminId, reason, notesText) => {
        if (!selectedDispute) return;
        try {
            const res = await assignDispute(selectedDispute._id, {
                assignedTo: newAdminId,
                reason,
                notes: notesText
            });
            if (res.success) {
                toast.showSuccess("Dispute reassigned successfully!");
                setShowAssignmentModal(false);
                setSelectedDispute(null);
                await loadDisputes();
                await loadStatistics();
            } else {
                toast.showError(res.message || "Failed to reassign dispute");
            }
        } catch (err) {
            handleApiError(err, "Reassignment failed");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            PENDING: "bg-yellow-100 text-yellow-700",
            IN_PROGRESS: "bg-blue-100 text-blue-700",
            RESOLVED: "bg-green-100 text-green-700",
            REJECTED: "bg-red-100 text-red-700",
            CLOSED: "bg-gray-100 text-gray-700",
        };
        return colors[status] || "bg-gray-100 text-gray-700";
    };

    const getPriorityColor = (priority) => {
        const colors = {
            LOW: "bg-gray-100 text-gray-700",
            MEDIUM: "bg-yellow-100 text-yellow-700",
            HIGH: "bg-orange-100 text-orange-700",
            URGENT: "bg-red-100 text-red-700",
        };
        return colors[priority] || "bg-gray-100 text-gray-700";
    };

    const getTypeLabel = (type) => {
        const labels = {
            PAYMENT_ISSUE: "Payment Issue",
            SERVICE_QUALITY: "Service Quality",
            VENDOR_BEHAVIOR: "Expert Behavior",
            REPORT_ISSUE: "Report Issue",
            CANCELLATION: "Cancellation",
            REFUND: "Refund",
            OTHER: "Other",
        };
        return labels[type] || type;
    };

    return (
        <div className="space-y-6 w-full max-w-full overflow-hidden">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Disputes & Complaints</h1>
                <p className="text-sm text-gray-500 mt-1">Manage all user and expert partner disputes and resolutions.</p>
            </div>

            {/* Statistics Cards */}
            {!statsLoading && statistics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase">Total Disputes</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{statistics.totalDisputes || 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs font-bold text-amber-600 uppercase">Open / Pending</p>
                        <p className="text-2xl font-black text-amber-600 mt-1">{statistics.pendingDisputes || 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs font-bold text-blue-600 uppercase">Under Review</p>
                        <p className="text-2xl font-black text-blue-600 mt-1">{statistics.inProgressDisputes || 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs font-bold text-emerald-600 uppercase">Resolved</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1">{statistics.resolvedDisputes || 0}</p>
                    </div>
                </div>
            )}

            {/* Dispute Resolution Quick Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                    { id: 'all', label: 'All Disputes', status: '' },
                    { id: 'pending', label: 'Open / Pending', status: 'PENDING' },
                    { id: 'in_progress', label: 'Under Review', status: 'IN_PROGRESS' },
                    { id: 'resolved', label: 'Resolved', status: 'RESOLVED' },
                    { id: 'rejected', label: 'Rejected', status: 'REJECTED' },
                    { id: 'refund', label: 'Refund / Compensation', status: 'CLOSED' },
                ].map((tab) => {
                    const isSelected = filters.status === tab.status;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setFilters({ ...filters, status: tab.status, page: 1 })}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                isSelected
                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative md:col-span-2">
                        <IoSearchOutline className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                            type="text"
                            placeholder="Search by dispute ID, user, vendor, or description..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">All Dispute Types</option>
                        {disputeTypes.map((typeOption, idx) => (
                            <option key={idx} value={typeOption}>
                                {typeOption}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => setFilters({ search: "", status: "", type: "", page: 1 })}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <LoadingSpinner message="Loading disputes..." />
            ) : disputes.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
                    <IoAlertCircleOutline className="mx-auto text-5xl text-gray-300 mb-3" />
                    <h3 className="text-base font-bold text-gray-900 mb-1">No Disputes Found</h3>
                    <p className="text-xs text-gray-400">No disputes match your current filter settings</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto max-w-full">
                        <table className="w-full min-w-[850px] text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="px-5 py-3">Dispute ID</th>
                                    <th className="px-5 py-3">Raised By</th>
                                    <th className="px-5 py-3">Type</th>
                                    <th className="px-5 py-3 min-w-[180px]">Subject</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Assigned Agent</th>
                                    <th className="px-5 py-3">Date</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs">
                                {disputes.map((dispute) => (
                                    <tr key={dispute._id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-5 py-3.5 font-bold font-mono text-gray-900">
                                            #{dispute._id.toString().slice(-8).toUpperCase()}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="font-bold text-gray-900">{dispute.raisedBy?.name || "N/A"}</div>
                                            <div className="text-[11px] text-gray-400">{dispute.raisedByModel}</div>
                                        </td>
                                        <td className="px-5 py-3.5 font-medium text-gray-700 whitespace-nowrap">
                                            {getTypeLabel(dispute.type)}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="text-gray-900 max-w-[200px] truncate" title={dispute.subject}>{dispute.subject}</div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(dispute.status)}`}>
                                                {dispute.status}
                                            </span>
                                        </td>
                                        {/* Assigned Support Agent Chip */}
                                        <td className="px-5 py-3.5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedDispute(dispute);
                                                    setShowAssignmentModal(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 transition-colors cursor-pointer"
                                            >
                                                <IoPersonOutline className="text-xs" />
                                                {dispute.assignedTo?.name || "Auto-Assigned"}
                                                {isSuperAdmin && <IoSwapHorizontalOutline className="text-xs ml-1 text-amber-500" />}
                                            </button>
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                                            {formatDate(dispute.createdAt)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <button
                                                onClick={() => handleViewDetails(dispute._id)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                                title="View Details"
                                            >
                                                <IoEyeOutline className="text-base" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="bg-gray-50/60 px-6 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <div>
                                Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{" "}
                                {Math.min(pagination.currentPage * filters.limit, pagination.totalDisputes)} of{" "}
                                {pagination.totalDisputes} disputes
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                    disabled={filters.page === 1}
                                    className="px-3 py-1.5 font-bold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                    disabled={filters.page >= pagination.totalPages}
                                    className="px-3 py-1.5 font-bold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Dispute Details Modal */}
            {showDetailsModal && selectedDispute && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Dispute #{selectedDispute._id?.toString().slice(-8).toUpperCase()}
                                </h2>
                                <p className="text-xs text-gray-400">Created on {formatDate(selectedDispute.createdAt)}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setSelectedDispute(null);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                            >
                                <IoCloseOutline className="text-2xl" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Status</h3>
                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(selectedDispute.status)}`}>
                                        {selectedDispute.status}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Assigned Agent</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowAssignmentModal(true)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 transition-colors cursor-pointer"
                                    >
                                        <IoPersonOutline className="text-xs" />
                                        {selectedDispute.assignedTo?.name || "Auto-Assigned"}
                                        {isSuperAdmin && <IoSwapHorizontalOutline className="text-xs ml-1 text-amber-500" />}
                                    </button>
                                </div>
                                {selectedDispute.priority && (
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Priority</h3>
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${getPriorityColor(selectedDispute.priority)}`}>
                                            {selectedDispute.priority}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Subject</h3>
                                <p className="text-sm font-semibold text-gray-900">{selectedDispute.subject}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Description</h3>
                                <p className="text-xs text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed">{selectedDispute.description}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Raised By</h3>
                                <p className="text-xs font-semibold text-gray-900">{selectedDispute.raisedBy?.name} ({selectedDispute.raisedByModel})</p>
                                <p className="text-xs text-gray-400">{selectedDispute.raisedBy?.email}</p>
                            </div>
                            {selectedDispute.booking && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Related Booking</h3>
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            navigate(`/admin/bookings/${selectedDispute.booking._id}`);
                                        }}
                                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        View Booking #{selectedDispute.booking._id.toString().slice(-8).toUpperCase()}
                                        <IoArrowForwardOutline />
                                    </button>
                                </div>
                            )}

                            {/* Assigned Expert & Wallet Clawback Card */}
                            {selectedDispute.booking?.vendor && (
                                <div className="bg-gradient-to-br from-amber-50/50 via-white to-rose-50/30 rounded-2xl p-4 sm:p-5 border border-amber-200/70 shadow-xs space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-lg">
                                                <IoWalletOutline className="text-2xl" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Assigned Expert</span>
                                                    {selectedDispute.booking.vendor.designation && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
                                                            {selectedDispute.booking.vendor.designation}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-sm font-bold text-gray-900">{selectedDispute.booking.vendor.name}</h4>
                                                <p className="text-xs text-gray-500">
                                                    {selectedDispute.booking.vendor.email} • {selectedDispute.booking.vendor.phone}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 ml-auto sm:ml-0">
                                            <div className="text-right">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 block">Expert Balance</span>
                                                <span className={`text-base font-extrabold ${Number(selectedDispute.booking.vendor.paymentCollection?.walletBalance || 0) > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                                                    ₹{Number(selectedDispute.booking.vendor.paymentCollection?.walletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>

                                            {canAdjustWallet && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowDebitModal(true)}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
                                                    title="Directly deduct funds from this expert's wallet"
                                                >
                                                    <IoArrowDownOutline className="text-sm" />
                                                    Debit Expert Wallet
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Booking Financial Snapshot */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-amber-200/50 text-xs">
                                        <div className="bg-white/80 rounded-xl p-2.5 border border-amber-100/70">
                                            <span className="text-[10px] text-gray-400 uppercase font-bold block">Booking Fee</span>
                                            <span className="font-extrabold text-gray-800">
                                                ₹{Number(selectedDispute.booking.totalAmount || 0).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <div className="bg-white/80 rounded-xl p-2.5 border border-amber-100/70">
                                            <span className="text-[10px] text-gray-400 uppercase font-bold block">Paid to Expert</span>
                                            <span className="font-extrabold text-emerald-600">
                                                ₹{Number(selectedDispute.booking.payment?.vendorWalletPayments?.totalCredited || 0).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <div className="bg-white/80 rounded-xl p-2.5 border border-amber-100/70 col-span-2 sm:col-span-1">
                                            <span className="text-[10px] text-gray-400 uppercase font-bold block">Booking Status</span>
                                            <span className="font-bold text-gray-700">
                                                {selectedDispute.booking.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedDispute.comments && selectedDispute.comments.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Comments ({selectedDispute.comments.length})</h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {selectedDispute.comments.map((comment, index) => (
                                            <div key={index} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-gray-900">
                                                        {comment.commentedBy?.name || "Admin"}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">{formatDate(comment.createdAt)}</span>
                                                </div>
                                                <p className="text-xs text-gray-600">{comment.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {selectedDispute.resolution && (
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                    <h3 className="text-xs font-bold text-emerald-800 uppercase mb-1">Resolution</h3>
                                    <p className="text-xs text-emerald-900 mb-1">{selectedDispute.resolution.notes}</p>
                                    <p className="text-[10px] text-emerald-600">
                                        Resolved by {selectedDispute.resolution.resolvedBy?.name} on {formatDate(selectedDispute.resolution.resolvedAt)}
                                    </p>
                                </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => {
                                        setStatusUpdate({ status: selectedDispute.status, notes: "" });
                                        setShowStatusModal(true);
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer"
                                >
                                    Update Status
                                </button>
                                <button
                                    onClick={() => setShowCommentModal(true)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                    <IoChatbubbleOutline className="text-sm" />
                                    Add Comment
                                </button>
                                {canAdjustWallet && selectedDispute.booking?.vendor && (
                                    <button
                                        type="button"
                                        onClick={() => setShowDebitModal(true)}
                                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1.5 ml-auto cursor-pointer"
                                    >
                                        <IoArrowDownOutline className="text-sm" />
                                        Debit Expert Wallet
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-gray-100">
                        <h3 className="text-base font-bold text-gray-900">Update Dispute Status</h3>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Status</label>
                            <select
                                value={statusUpdate.status}
                                onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="PENDING">PENDING</option>
                                <option value="IN_PROGRESS">IN PROGRESS</option>
                                <option value="RESOLVED">RESOLVED</option>
                                <option value="REJECTED">REJECTED</option>
                                <option value="CLOSED">CLOSED</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Resolution Notes</label>
                            <textarea
                                value={statusUpdate.notes}
                                onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                                placeholder="Explain reason or resolution taken..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStatusUpdate}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                            >
                                {actionLoading ? "Saving..." : "Save Update"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Comment Modal */}
            {showCommentModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-gray-100">
                        <h3 className="text-base font-bold text-gray-900">Add Dispute Comment</h3>
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Type internal comment or communication..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <div className="flex gap-2 justify-end pt-2">
                            <button
                                onClick={() => setShowCommentModal(false)}
                                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddComment}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                            >
                                {actionLoading ? "Adding..." : "Post Comment"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Universal Assignment History Modal */}
            <AssignmentHistoryModal
                isOpen={showAssignmentModal}
                onClose={() => {
                    setShowAssignmentModal(false);
                    setSelectedDispute(null);
                }}
                entityTitle={`Dispute #${selectedDispute?._id?.toString().slice(-8).toUpperCase()}`}
                assignedTo={selectedDispute?.assignedTo}
                assignmentHistory={selectedDispute?.assignmentHistory || []}
                availableAdmins={availableSupportAdmins}
                onReassign={handleReassignDispute}
                isSuperAdmin={isSuperAdmin}
            />

            {/* Dispute Expert Wallet Debit Modal */}
            {showDebitModal && selectedDispute?.booking?.vendor && (
                <DisputeWalletDebitModal
                    dispute={selectedDispute}
                    onClose={() => setShowDebitModal(false)}
                    onSuccess={async () => {
                        await handleViewDetails(selectedDispute._id);
                        await loadDisputes();
                        await loadStatistics();
                    }}
                    toast={toast}
                />
            )}
        </div>
    );
}
