import { useState } from 'react';
import {
    IoShieldCheckmarkOutline,
    IoDocumentTextOutline,
    IoCheckmarkCircleOutline,
    IoAlertCircleOutline,
    IoSparklesOutline,
    IoLockClosedOutline
} from 'react-icons/io5';
import api from '../../../services/api';
import { useToast } from '../../../hooks/useToast';

export default function UserAgreementModal({
    isOpen,
    agreementText,
    agreementVersion = 'v1.0.0',
    onAccepted
}) {
    const toast = useToast();
    const [isChecked, setIsChecked] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleAccept = async () => {
        if (!isChecked || submitting) return;

        try {
            setSubmitting(true);
            const response = await api.post('/agreements/accept', {
                deviceId: navigator.userAgent || 'Web/Browser',
                appVersion: '1.0.0'
            });

            if (response.data?.success) {
                toast.showSuccess('User Agreement accepted successfully!');
                if (onAccepted) {
                    onAccepted(response.data.data?.agreementVersion || agreementVersion);
                }
            } else {
                toast.showError(response.data?.message || 'Failed to record agreement acceptance');
            }
        } catch (err) {
            console.error('Agreement acceptance error:', err);
            toast.showError(err.response?.data?.message || 'Error accepting User Agreement');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-5 sm:p-6 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-lg">
                                💧
                            </span>
                            <span className="text-xs font-black uppercase tracking-widest text-blue-100 bg-white/15 px-2.5 py-1 rounded-full border border-white/20">
                                Official Legal Agreement
                            </span>
                        </div>

                        <span className="text-xs font-black uppercase tracking-wider bg-emerald-500 text-white px-3 py-1 rounded-full shadow-xs">
                            {agreementVersion}
                        </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                        Jaladhaara User Agreement
                    </h2>
                    <p className="text-xs text-blue-100/90 mt-1 max-w-xl font-medium">
                        Please review and accept the mandatory User Agreement before proceeding on the platform.
                    </p>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-slate-700 text-xs sm:text-sm leading-relaxed custom-scrollbar">
                    
                    {/* Notice Banner */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-start gap-3">
                        <IoAlertCircleOutline className="text-xl text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-900">
                            <strong className="font-extrabold block">Binding Terms:</strong>
                            By clicking "I Agree & Accept", you electronically sign and enter into a legal contract with Jaladhaara Groundwater Survey Pvt. Ltd.
                        </div>
                    </div>

                    {/* Agreement Text Rendered */}
                    {agreementText ? (
                        <div
                            className="prose prose-xs max-w-none text-slate-700 space-y-3"
                            dangerouslySetInnerHTML={{ __html: agreementText }}
                        />
                    ) : (
                        <div className="space-y-4">
                            <p className="font-medium text-slate-800">
                                This User Agreement ("Agreement") is entered into between <strong>Jaladhaara Groundwater Survey Pvt. Ltd.</strong> ("Jaladhaara") and the registered User ("User"). By clicking "I Agree", the User accepts the following terms:
                            </p>

                            <div className="space-y-3 font-normal">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 font-extrabold block mb-1">1. Platform Services</strong>
                                    Jaladhaara is a technology platform that enables Users to connect with independent Experts for groundwater survey services. Jaladhaara does not directly provide groundwater survey or borewell drilling services.
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 font-extrabold block mb-1">2. User Responsibilities</strong>
                                    The User shall provide accurate information, ensure safe access to the survey location, cooperate with the Expert, and make payments through the Jaladhaara platform in accordance with the applicable policies.
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 font-extrabold block mb-1">3. Expert Services</strong>
                                    Groundwater surveys are performed by independent Experts, who are solely responsible for their professional services, technical opinions, recommendations, and survey reports.
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 font-extrabold block mb-1">4. Survey Scope & Disclaimer</strong>
                                    The survey is limited to identifying potential groundwater zones based on the Expert's professional assessment. Groundwater availability, borewell success, water yield, and water quality depend on natural geological conditions and cannot be guaranteed.
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 font-extrabold block mb-1">5. Payments & Policies</strong>
                                    All bookings, payments, cancellations, refunds, rescheduling, and settlements shall be governed by Jaladhaara's applicable policies.
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 font-extrabold block mb-1">6. User Conduct</strong>
                                    The User shall not misuse the platform, provide false information, engage in abusive or unlawful behaviour, or make unauthorized payments outside the Jaladhaara platform.
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 font-extrabold block mb-1">7. Privacy & Confidentiality</strong>
                                    The User consents to the collection, processing, and use of personal information in accordance with Jaladhaara's Privacy Policy.
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 font-extrabold block mb-1">8. Limitation of Liability</strong>
                                    Jaladhaara acts only as a technology platform and shall not be liable for the professional services provided by the Expert, borewell drilling outcomes, groundwater availability, property damage, financial loss, or any indirect or consequential damages arising from the use of the platform.
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 font-extrabold block mb-1">9. Suspension & Termination</strong>
                                    Jaladhaara reserves the right to suspend or terminate any User account for violation of this Agreement, platform policies, or applicable laws.
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 font-extrabold block mb-1">10. Intellectual Property</strong>
                                    All trademarks, logos, software, content, and other intellectual property associated with Jaladhaara are the exclusive property of Jaladhaara Groundwater Survey Pvt. Ltd. and may not be used without prior written permission.
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 font-extrabold block mb-1">11. Amendments</strong>
                                    Jaladhaara may modify this Agreement or its policies from time to time. Continued use of the platform constitutes acceptance of the revised terms.
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 font-extrabold block mb-1">12. Governing Law & Jurisdiction</strong>
                                    This Agreement shall be governed by the laws of India. Any dispute arising out of or relating to this Agreement or the use of the Jaladhaara platform shall be subject to the exclusive jurisdiction of the competent courts at Hyderabad, Telangana.
                                </div>

                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                                    <strong className="text-emerald-950 font-extrabold block mb-1">13. Electronic Acceptance</strong>
                                    By clicking "I Agree", the User confirms that they have read, understood, and accepted this Agreement, the Terms & Conditions, Privacy Policy, Booking & Cancellation Policy, Refund Policy, No-Show Policy, and all other applicable Jaladhaara policies. This electronic acceptance shall have the same legal effect as a handwritten signature under applicable law.
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 shrink-0 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setIsChecked(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs text-slate-700 font-semibold leading-snug">
                            I have read, understood, and accept all 13 clauses of the <strong>Jaladhaara User Agreement ({agreementVersion})</strong>, Privacy Policy, and Booking Terms.
                        </span>
                    </label>

                    <button
                        onClick={handleAccept}
                        disabled={!isChecked || submitting}
                        className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-md ${
                            isChecked && !submitting
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 active:scale-98 cursor-pointer'
                                : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                        }`}
                    >
                        {submitting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Recording Electronic Acceptance...</span>
                            </>
                        ) : (
                            <>
                                <IoShieldCheckmarkOutline className="text-lg" />
                                <span>I Agree & Accept Agreement</span>
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
