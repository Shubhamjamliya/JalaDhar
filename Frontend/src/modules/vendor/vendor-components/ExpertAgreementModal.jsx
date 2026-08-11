import { useState } from 'react';
import {
    IoShieldCheckmarkOutline,
    IoCheckmarkCircleOutline,
    IoDownloadOutline,
    IoRibbonOutline,
    IoArrowForwardOutline,
    IoSparklesOutline
} from 'react-icons/io5';
import api from '../../../services/api';
import { useToast } from '../../../hooks/useToast';
import ExpertAgreementDocViewer from './ExpertAgreementDocViewer';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function ExpertAgreementModal({
    isOpen,
    agreementText,
    agreementVersion = 'v1.0',
    onAccepted
}) {
    const toast = useToast();
    const [isChecked, setIsChecked] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isActivated, setIsActivated] = useState(false);
    const [issuedExpertId, setIssuedExpertId] = useState('');
    const [showDocViewer, setShowDocViewer] = useState(false);

    if (!isOpen) return null;

    const handleAcceptAndActivate = async () => {
        if (!isChecked || submitting) return;

        try {
            setSubmitting(true);
            const response = await api.post('/vendors/agreement/accept', {
                deviceId: navigator.userAgent || 'Web/Browser',
                appVersion: '1.0.0'
            });

            if (response.data?.success) {
                const assignedId = response.data.data?.expertId || 'EX-2026-ACTIVE';
                setIsActivated(true);
                setIssuedExpertId(assignedId);
                toast.showSuccess('Expert Onboarding Agreement accepted & Verified Expert ID issued!');
            } else {
                toast.showError(response.data?.message || 'Failed to activate account');
            }
        } catch (err) {
            console.error('Agreement acceptance error:', err);
            toast.showError(err.response?.data?.message || 'Failed to accept agreement & activate account');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadPdf = () => {
        setShowDocViewer(true);
    };

    const handleFinishActivation = () => {
        if (onAccepted) {
            onAccepted(issuedExpertId);
        }
    };

    // Success View inside Modal
    if (isActivated) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
                <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 text-center shadow-2xl border border-slate-100 space-y-6 relative overflow-hidden">
                    
                    <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center text-4xl shadow-inner border border-emerald-100">
                        <IoCheckmarkCircleOutline />
                    </div>

                    <div className="space-y-2">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider rounded-full">
                            Account Activated & Verified
                        </span>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                            Welcome to Jaladhaara!
                        </h2>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                            Your Expert Onboarding Agreement ({agreementVersion}) has been digitally recorded. Your profile is now active for receiving customer survey bookings.
                        </p>
                    </div>

                    {/* Verified Expert ID Card */}
                    <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-blue-100">
                            <IoRibbonOutline className="text-base text-amber-300" />
                            Official Verified Expert ID
                        </div>
                        <div className="text-2xl font-black font-mono tracking-wider text-amber-300">
                            {issuedExpertId}
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                            onClick={handleDownloadPdf}
                            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <IoDownloadOutline className="text-base text-blue-600" />
                            <span>Download PDF Copy</span>
                        </button>

                        <button
                            onClick={handleFinishActivation}
                            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                        >
                            <span>Start Accepting Bookings</span>
                            <IoArrowForwardOutline />
                        </button>
                    </div>

                </div>

                <ExpertAgreementDocViewer
                    isOpen={showDocViewer}
                    onClose={() => setShowDocViewer(false)}
                    expertId={issuedExpertId}
                />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-5 sm:p-6 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white text-lg">
                                💧
                            </span>
                            <span className="text-xs font-black uppercase tracking-widest text-blue-100 bg-white/15 px-2.5 py-1 rounded-full border border-white/20">
                                Mandatory Expert Onboarding
                            </span>
                        </div>

                        <span className="text-xs font-black uppercase tracking-wider bg-emerald-500 text-white px-3 py-1 rounded-full shadow-xs">
                            {agreementVersion}
                        </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                        Jaladhaara Expert Onboarding Agreement
                    </h2>
                    <p className="text-xs text-blue-100/90 mt-1 max-w-2xl font-medium">
                        Congratulations! Your documents have been verified by Jaladhaara Admin. Please review and digitally accept the agreement below to issue your Verified Expert ID.
                    </p>
                </div>

                {/* Status Callout Banner */}
                <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-start gap-3 shrink-0">
                    <IoCheckmarkCircleOutline className="text-xl text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-950">
                        <strong className="font-extrabold block">Admin Document Verification Approved:</strong>
                        Your KYC documents, Bank details, and Qualifications are verified. Accept this click-wrap agreement to generate your <strong>Verified Expert ID</strong> and activate your profile.
                    </div>
                </div>

                {/* Agreement Body Container */}
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed custom-scrollbar">
                    
                    {/* PDF Download Button */}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-700 font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                            <IoDownloadOutline className="text-base" />
                            <span>Download PDF Copy</span>
                        </button>
                    </div>

                    {/* Formatted Agreement Text */}
                    {agreementText ? (
                        <div
                            className="prose prose-xs max-w-none text-slate-700 space-y-3"
                            dangerouslySetInnerHTML={{ __html: agreementText }}
                        />
                    ) : (
                        <div className="space-y-4">
                            <p className="font-bold text-slate-900">
                                By selecting "I Agree & Activate Account", I confirm that:
                            </p>
                            
                            <div className="space-y-3 font-normal">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 block mb-1">1. Agreement Review</strong>
                                    I have read and understood this Agreement.
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 block mb-1">2. Professional Standards</strong>
                                    I will provide groundwater survey services professionally, ethically, and in compliance with applicable laws.
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 block mb-1">3. Sole Professional Responsibility</strong>
                                    I am solely responsible for my surveys, technical opinions, recommendations, reports, and professional conduct.
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 block mb-1">4. Technology Platform Disclaimer</strong>
                                    I understand that Jaladhaara is only a technology platform connecting Customers with independent Experts and is not responsible for my professional services or survey outcomes.
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 block mb-1">5. Privacy & Confidentiality</strong>
                                    I will maintain the confidentiality of customer information and use it only for the booked service.
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 block mb-1">6. No Off-Platform Solicitation</strong>
                                    I will not solicit customers outside the platform or accept unauthorized off-platform payments.
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 block mb-1">7. Groundwater Availability Disclaimer</strong>
                                    I understand that groundwater occurrence depends on natural geological conditions, and I will not guarantee groundwater availability, borewell success, water yield, or water quality.
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 block mb-1">8. Platform Policies Compliance</strong>
                                    I agree to comply with Jaladhaara's Terms & Conditions, Privacy Policy, Booking & Cancellation Policy, Refund Policy, and all other applicable platform policies.
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 block mb-1">9. Account Suspension & Termination</strong>
                                    I understand that Jaladhaara may suspend or terminate my account if I violate this Agreement or any platform policy.
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <strong className="text-slate-900 block mb-1">10. Governing Law & Jurisdiction</strong>
                                    This Agreement shall be governed by the laws of India, and any dispute shall be subject to the exclusive jurisdiction of the competent courts at Hyderabad, Telangana.
                                </div>
                            </div>

                            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 font-medium">
                                <strong>Declaration:</strong> I declare that all information and documents submitted by me are true and correct. I voluntarily accept this Agreement and agree to be bound by its terms.
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
                        <span className="text-xs text-slate-800 font-semibold leading-snug">
                            I have read, understood, and agree to the <strong>Expert Onboarding Agreement ({agreementVersion})</strong>, Terms & Conditions, Privacy Policy, and Platform Policies.
                        </span>
                    </label>

                    <div className="flex justify-end pt-1">
                        <button
                            type="button"
                            onClick={handleAcceptAndActivate}
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
                                    <span>Recording Digital Consent & Issuing ID...</span>
                                </>
                            ) : (
                                <>
                                    <IoShieldCheckmarkOutline className="text-lg" />
                                    <span>I Agree & Activate Account</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>

            {/* In-App Responsive Document & PDF Viewer Modal */}
            <ExpertAgreementDocViewer
                isOpen={showDocViewer}
                onClose={() => setShowDocViewer(false)}
                expertId={issuedExpertId}
            />
        </div>
    );
}
