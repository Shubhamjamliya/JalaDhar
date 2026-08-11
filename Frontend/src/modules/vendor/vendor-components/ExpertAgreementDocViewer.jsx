import { useState, useEffect } from 'react';
import {
    IoCloseOutline,
    IoPrintOutline,
    IoRibbonOutline,
    IoCheckmarkCircleOutline,
    IoShieldCheckmarkOutline,
    IoGlobeOutline,
    IoDocumentTextOutline
} from 'react-icons/io5';
import api from '../../../services/api';
import { useToast } from '../../../hooks/useToast';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

export default function ExpertAgreementDocViewer({
    isOpen,
    onClose,
    expertId
}) {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [vendorData, setVendorData] = useState(null);
    const [agreementVersion, setAgreementVersion] = useState('v1.0');
    const [logDetails, setLogDetails] = useState(null);

    useEffect(() => {
        if (!isOpen) return;

        const fetchDetails = async () => {
            try {
                setLoading(true);
                const response = await api.get('/vendors/agreement/status');
                if (response.data?.success && response.data?.data) {
                    setAgreementVersion(response.data.data.activeVersion || 'v1.0');
                }

                // Fetch Vendor Profile
                const profileRes = await api.get('/vendors/profile');
                if (profileRes.data?.success && profileRes.data?.data) {
                    setVendorData(profileRes.data.data.vendor || profileRes.data.data);
                }
            } catch (err) {
                console.error('Error loading agreement details:', err);
                toast.showError('Failed to load agreement document details');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
                
                {/* Modal Top Bar */}
                <div className="bg-slate-900 px-4 py-3.5 sm:px-6 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-black">
                            💧
                        </span>
                        <div>
                            <h3 className="text-sm sm:text-base font-black tracking-tight leading-none text-white">
                                Expert Agreement Certificate
                            </h3>
                            <span className="text-[10px] text-slate-400 font-mono">
                                Official Digital Consent Document
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        >
                            <IoPrintOutline className="text-sm" />
                            <span className="hidden sm:inline">Save PDF / Print</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <IoCloseOutline className="text-xl" />
                        </button>
                    </div>
                </div>

                {/* Printable Container Body */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar text-slate-800">
                    
                    {loading ? (
                        <div className="p-12 flex justify-center"><LoadingSpinner /></div>
                    ) : (
                        <div className="printable-certificate space-y-5">
                            
                            {/* Certificate Header */}
                            <div className="text-center pb-4 border-b border-slate-200">
                                <div className="text-lg sm:text-2xl font-black text-blue-700 uppercase tracking-tight">
                                    💧 Jaladhaara Groundwater Survey
                                </div>
                                <div className="text-xs sm:text-sm font-bold text-slate-500 mt-0.5">
                                    Official Expert Onboarding Agreement &amp; Digital Consent Certificate
                                </div>
                                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-mono font-black text-xs">
                                    <IoRibbonOutline className="text-amber-500 text-sm" />
                                    <span>VERIFIED EXPERT ID: {vendorData?.expertId || expertId || 'EX-2026-ACTIVE'}</span>
                                </div>
                            </div>

                            {/* Expert Metadata Grid (Mobile Responsive: 1 col on mobile, 2 col on sm) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                                <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Expert Name</span>
                                    <span className="font-extrabold text-slate-900">{vendorData?.name || 'Registered Hydrogeologist'}</span>
                                </div>

                                <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Registered Mobile</span>
                                    <span className="font-extrabold text-slate-900">{vendorData?.phone || 'N/A'}</span>
                                </div>

                                <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Email Address</span>
                                    <span className="font-semibold text-slate-700">{vendorData?.email || 'N/A'}</span>
                                </div>

                                <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Agreement Version</span>
                                    <span className="font-mono font-black text-blue-600">{agreementVersion}</span>
                                </div>

                                <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Date &amp; Time of Acceptance</span>
                                    <span className="font-medium text-slate-700">
                                        {new Date(vendorData?.expertAgreementAcceptedAt || Date.now()).toLocaleString('en-IN')}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Digital Verification Seal</span>
                                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                                        <IoCheckmarkCircleOutline className="text-sm" /> Digitally Signed &amp; Recorded
                                    </span>
                                </div>
                            </div>

                            {/* 10 Clauses List */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                                    <IoDocumentTextOutline className="text-blue-600 text-base" />
                                    <span>Agreement Clauses (10 Points)</span>
                                </h4>

                                <div className="space-y-2 text-xs leading-relaxed">
                                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                                        <strong className="text-slate-900 block mb-0.5">1. Agreement Review:</strong>
                                        I have read and understood this Agreement.
                                    </div>
                                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                                        <strong className="text-slate-900 block mb-0.5">2. Professional Standards:</strong>
                                        I will provide groundwater survey services professionally, ethically, and in compliance with applicable laws.
                                    </div>
                                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                                        <strong className="text-slate-900 block mb-0.5">3. Sole Professional Responsibility:</strong>
                                        I am solely responsible for my surveys, technical opinions, recommendations, reports, and professional conduct.
                                    </div>
                                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                                        <strong className="text-slate-900 block mb-0.5">4. Technology Platform Disclaimer:</strong>
                                        I understand that Jaladhaara is only a technology platform connecting Customers with independent Experts and is not responsible for my professional services or survey outcomes.
                                    </div>
                                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                                        <strong className="text-slate-900 block mb-0.5">5. Privacy &amp; Confidentiality:</strong>
                                        I will maintain the confidentiality of customer information and use it only for the booked service.
                                    </div>
                                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                                        <strong className="text-slate-900 block mb-0.5">6. No Off-Platform Solicitation:</strong>
                                        I will not solicit customers outside the platform or accept unauthorized off-platform payments.
                                    </div>
                                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                                        <strong className="text-slate-900 block mb-0.5">7. Groundwater Availability Disclaimer:</strong>
                                        I understand that groundwater occurrence depends on natural geological conditions, and I will not guarantee groundwater availability, borewell success, water yield, or water quality.
                                    </div>
                                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                                        <strong className="text-slate-900 block mb-0.5">8. Platform Policies Compliance:</strong>
                                        I agree to comply with Jaladhaara's Terms &amp; Conditions, Privacy Policy, Booking &amp; Cancellation Policy, Refund Policy, and all other applicable platform policies.
                                    </div>
                                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                                        <strong className="text-slate-900 block mb-0.5">9. Account Suspension &amp; Termination:</strong>
                                        I understand that Jaladhaara may suspend or terminate my account if I violate this Agreement or any platform policy.
                                    </div>
                                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                                        <strong className="text-slate-900 block mb-0.5">10. Governing Law &amp; Jurisdiction:</strong>
                                        This Agreement shall be governed by the laws of India, and any dispute shall be subject to the exclusive jurisdiction of the competent courts at Hyderabad, Telangana.
                                    </div>
                                </div>
                            </div>

                            {/* Digital Consent Declaration Card */}
                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                                <strong className="font-extrabold uppercase tracking-wider text-emerald-800 text-[11px] block">
                                    Digital Consent Declaration
                                </strong>
                                <p className="leading-relaxed font-medium">
                                    I declare that all information and documents submitted by me are true and correct. I voluntarily accept this Agreement and agree to be bound by its terms. (Digitally Accepted via Click-wrap Consent)
                                </p>
                            </div>

                            {/* Document Footer */}
                            <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-medium">
                                Jaladhaara Groundwater Survey Pvt. Ltd. • Legal &amp; Compliance Division • Hyderabad, Telangana, India
                            </div>

                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
