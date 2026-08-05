import { useState, useEffect } from "react";
import {
    IoWarningOutline,
    IoShieldCheckmarkOutline,
    IoCloseOutline,
    IoWalletOutline,
    IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { getPublicSettings } from "../../../services/settingsApi";

const DEFAULT_POLICY_HTML = `<ul>
  <li><strong>Cancellation Before 24h:</strong> Full refund of advance payment if cancelled at least 24 hours before the scheduled visit.</li>
  <li><strong>Late Cancellation:</strong> 50% of the advance amount will be forfeited if cancelled between 12–24 hours before the visit.</li>
  <li><strong>Same Day Cancellation:</strong> No refund for cancellations made within 12 hours of the visit.</li>
</ul>`;

/**
 * Cancellation & Refund Policy Modal
 *
 * Shown after the user selects a cancellation reason.
 * Displays the admin-configured cancellation policy and confirms
 * that any advance paid will be refunded to the user's JalaDhar wallet.
 *
 * Props:
 *   isOpen     — boolean
 *   onClose    — fn: "Keep Booking" clicked
 *   onConfirm  — fn: "Confirm Cancellation" clicked (triggers actual API call)
 *   reason     — string: the reason the user selected in the previous step
 *   isLoading  — boolean: API call in progress
 */
export default function CancellationPolicyModal({
    isOpen,
    onClose,
    onConfirm,
    reason = "",
    isLoading = false,
}) {
    const [policyHtml, setPolicyHtml] = useState("");
    const [fetchingPolicy, setFetchingPolicy] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;

        const fetchPolicy = async () => {
            setFetchingPolicy(true);
            try {
                const res = await getPublicSettings("policy");
                if (cancelled) return;
                if (res?.success && res?.data?.settings) {
                    const setting = res.data.settings.find(
                        (s) => s.key === "cancellation_policy"
                    );
                    if (setting?.value) {
                        setPolicyHtml(setting.value);
                        return;
                    }
                }
                setPolicyHtml(DEFAULT_POLICY_HTML);
            } catch {
                if (!cancelled) setPolicyHtml(DEFAULT_POLICY_HTML);
            } finally {
                if (!cancelled) setFetchingPolicy(false);
            }
        };

        fetchPolicy();
        return () => { cancelled = true; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden my-auto">

                {/* ── Header ── */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 px-5 py-4 border-b border-red-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-100 rounded-2xl text-red-600 shrink-0">
                            <IoWarningOutline className="text-xl" />
                        </div>
                        <div>
                            <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                                Confirm Cancellation
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                Please review the refund &amp; cancellation terms below
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <IoCloseOutline className="text-xl" />
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="p-5 space-y-4 max-h-[68vh] overflow-y-auto">

                    {/* Selected Reason */}
                    {reason && (
                        <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">
                                    Your Reason
                                </span>
                                <p className="text-xs font-bold text-slate-800">"{reason}"</p>
                            </div>
                        </div>
                    )}

                    {/* Wallet Refund Notice */}
                    <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3.5">
                        <div className="p-2 bg-emerald-600 rounded-xl text-white shrink-0">
                            <IoWalletOutline className="text-base" />
                        </div>
                        <div>
                            <p className="text-xs font-extrabold text-emerald-800 leading-tight">
                                Refund credited to your JalaDhar Wallet
                            </p>
                            <p className="text-[11px] text-emerald-700 font-medium mt-1 leading-relaxed">
                                If you have made an advance payment, the eligible refund amount will be automatically credited to your JalaDhar wallet as per the cancellation policy below.
                            </p>
                        </div>
                    </div>

                    {/* Admin-configured Cancellation Policy */}
                    <div className="space-y-2">
                        <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                            <IoShieldCheckmarkOutline className="text-blue-500 text-sm" />
                            Cancellation &amp; Refund Policy
                        </h4>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                            {fetchingPolicy ? (
                                <div className="space-y-2 animate-pulse">
                                    <div className="h-3 bg-slate-200 rounded w-full" />
                                    <div className="h-3 bg-slate-200 rounded w-4/5" />
                                    <div className="h-3 bg-slate-200 rounded w-3/4" />
                                </div>
                            ) : (
                                <div
                                    className="text-slate-600 policy-content overflow-hidden break-words whitespace-normal"
                                    dangerouslySetInnerHTML={{ __html: policyHtml || DEFAULT_POLICY_HTML }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Confirmation statement */}
                    <div className="flex items-start gap-2 text-[11px] text-slate-500 font-medium">
                        <IoCheckmarkCircleOutline className="text-slate-400 text-sm shrink-0 mt-0.5" />
                        By confirming, you acknowledge that you have read and agreed to the above cancellation terms.
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                        Keep Booking
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading && (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {isLoading ? "Cancelling…" : "Confirm Cancellation"}
                    </button>
                </div>
            </div>

            {/* Inline styles for rendered HTML content from Quill */}
            <style>{`
                .policy-content ul, .policy-content ol {
                    padding-left: 1.2rem;
                    margin: 0;
                }
                .policy-content li {
                    font-size: 0.75rem;
                    line-height: 1.6;
                    color: #475569;
                    margin-bottom: 0.5rem;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    white-space: normal;
                }
                .policy-content li strong {
                    color: #1e293b;
                    font-weight: 700;
                }
                .policy-content p {
                    font-size: 0.75rem;
                    line-height: 1.6;
                    color: #475569;
                    margin-bottom: 0.5rem;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    white-space: normal;
                }
            `}</style>
        </div>
    );
}
