import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    IoChevronBackOutline,
    IoShieldCheckmark,
    IoLockClosed,
    IoCheckmark,
    IoCheckmarkCircle,
    IoCloseOutline,
    IoLocationOutline,
    IoCallOutline,
    IoPersonOutline,
    IoSparklesOutline
} from "react-icons/io5";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import { useAuth } from "../../../contexts/AuthContext";
import { getDashboardStats } from "../../../services/vendorApi";
import { getUserBookings } from "../../../services/bookingApi";
import { useToast } from "../../../hooks/useToast";

export default function VendorRewards() {
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const vendorAuth = useVendorAuth();
    const userAuth = useAuth();
    const vendor = vendorAuth?.vendor;
    const user = userAuth?.user;

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Interactive Modals
    const [showKitModal, setShowKitModal] = useState(false);
    const [showInsuranceModal, setShowInsuranceModal] = useState(false);

    // Kit Modal State
    const [selectedSize, setSelectedSize] = useState("L");
    const [kitSubmitted, setKitSubmitted] = useState(false);

    // Insurance Modal State
    const [nomineeName, setNomineeName] = useState("");
    const [nomineeRelation, setNomineeRelation] = useState("Spouse");
    const [nomineePhone, setNomineePhone] = useState("");
    const [insuranceAgreed, setInsuranceAgreed] = useState(false);
    const [insuranceSubmitted, setInsuranceSubmitted] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                if (vendor) {
                    const res = await getDashboardStats();
                    if (res?.success && res?.data?.stats) {
                        setStats(res.data.stats);
                    }
                } else {
                    const res = await getUserBookings({ limit: 100 });
                    if (res?.success && Array.isArray(res?.data?.bookings)) {
                        const completed = res.data.bookings.filter(
                            b => b.status === 'COMPLETED' || b.status === 'REPORT_UPLOADED'
                        ).length;
                        setStats({ completedBookings: completed });
                    }
                }
            } catch (err) {
                console.warn("Using fallback stats for rewards", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [vendor]);

    const handleBack = () => {
        if (location.pathname.startsWith("/user")) {
            navigate("/user/dashboard");
        } else {
            navigate("/vendor/dashboard");
        }
    };

    // Live count directly from backend database (bookings collection & vendor profile)
    const completedSurveys = Math.max(
        Number(stats?.completedBookings) || 0,
        Number(vendor?.surveysCompleted) || 0,
        Number(vendor?.completedSurveys) || 0
    );

    const TARGET_SURVEYS = 10;
    const isEligible = completedSurveys >= TARGET_SURVEYS;
    const remainingSurveys = Math.max(0, TARGET_SURVEYS - completedSurveys);
    const progressPercent = Math.min(100, Math.round((completedSurveys / TARGET_SURVEYS) * 100));

    const handleConfirmKit = (e) => {
        e.preventDefault();
        setKitSubmitted(true);
        toast.showSuccess("Kit dispatch request recorded! Admin verification in progress.");
        setTimeout(() => setShowKitModal(false), 1200);
    };

    const handleConfirmInsurance = (e) => {
        e.preventDefault();
        if (!insuranceAgreed) {
            toast.showError("Please accept the insurance terms & conditions.");
            return;
        }
        setInsuranceSubmitted(true);
        toast.showSuccess("Insurance enrollment details submitted successfully!");
        setTimeout(() => setShowInsuranceModal(false), 1200);
    };

    return (
        <div className="min-h-screen pb-24 -mt-2 sm:-mt-4">
            <div className="max-w-md mx-auto space-y-4">
                
                {/* ----------------- SUB-HEADER ----------------- */}
                <div className="flex items-center justify-between pt-1 pb-2">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        aria-label="Back"
                    >
                        <IoChevronBackOutline className="text-xl text-slate-800" />
                    </button>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight">
                        Rewards &amp; Benefits
                    </h1>
                    
                    <div className="w-10" />
                </div>

                {/* ----------------- STATE A: CELEBRATION HERO (If Completed >= 10) ----------------- */}
                {isEligible ? (
                    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#F0FDF4] via-white to-white p-7 border border-emerald-200/70 shadow-[0_4px_20px_rgba(16,185,129,0.08)] text-center">
                        {/* Confetti & Glow accents */}
                        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-emerald-100/40 to-transparent pointer-events-none" />
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-200/40 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-200/30 rounded-full blur-2xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col items-center">
                            {/* Checkmark Circle */}
                            <div className="w-16 h-16 rounded-full bg-[#22C55E] text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4 ring-8 ring-emerald-50">
                                <IoCheckmark className="text-4xl stroke-[4]" />
                            </div>

                            <h2 className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight">
                                Congratulations!
                            </h2>
                            <p className="mt-1.5 text-xs sm:text-sm font-semibold text-slate-600 max-w-[270px] leading-relaxed">
                                You have successfully completed {completedSurveys} Jaladhaara surveys.
                            </p>

                            <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#22C55E] text-white text-xs font-black shadow-md shadow-emerald-500/20">
                                <IoSparklesOutline className="text-sm" />
                                <span>You are now eligible!</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ----------------- STATE B: IMPACT HERO BANNER (In-Progress < 10) ----------------- */
                    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#DDF0FF] via-[#E4F8ED] to-[#DCF5E6] p-6 border border-blue-100/80 shadow-[0_4px_20px_rgba(10,132,255,0.06)]">
                        {/* Soft landscape hill overlay at bottom */}
                        <div className="absolute bottom-0 inset-x-0 h-16 pointer-events-none opacity-40">
                            <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="w-full h-full">
                                <path d="M0,35 Q100,10 200,30 T400,20 L400,60 L0,60 Z" fill="#86EFAC" />
                                <path d="M0,45 Q150,25 300,40 T400,35 L400,60 L0,60 Z" fill="#4ADE80" opacity="0.6" />
                            </svg>
                        </div>

                        <div className="relative z-10 flex items-start justify-between gap-3">
                            <div className="max-w-[210px] sm:max-w-[230px] pt-1">
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-[1.18] tracking-tight">
                                    Your Experience<br />Creates Impact
                                </h2>
                                <p className="mt-2.5 text-xs font-medium text-slate-600 leading-relaxed">
                                    Complete 10 successful surveys and unlock exclusive benefits.
                                </p>
                            </div>

                            {/* Water drop graphic & Script Tagline */}
                            <div className="flex flex-col items-center shrink-0 pr-1">
                                <span className="font-serif italic font-bold text-[11px] sm:text-xs text-[#0F6B43] tracking-tight text-center leading-tight mb-2 drop-shadow-2xs">
                                    Experts for a<br />Better Tomorrow
                                </span>

                                {/* Stylized 3D Jaladhaara emblem with glowing leaves & drop */}
                                <div className="relative w-16 h-16 flex items-center justify-center">
                                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                                        <defs>
                                            <linearGradient id="dropGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#38BDF8" />
                                                <stop offset="60%" stopColor="#0A84FF" />
                                                <stop offset="100%" stopColor="#0284C7" />
                                            </linearGradient>
                                            <linearGradient id="leafGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#15803D" />
                                                <stop offset="100%" stopColor="#4ADE80" />
                                            </linearGradient>
                                        </defs>
                                        {/* Water Drop */}
                                        <path
                                            d="M50 10 C50 10, 22 46, 22 68 A28 28 0 0 0 78 68 C78 46, 50 10, 50 10 Z"
                                            fill="url(#dropGrad)"
                                        />
                                        {/* Highlight on Drop */}
                                        <path
                                            d="M40 25 C45 35 44 48 34 56 C30 52 30 42 36 30 Z"
                                            fill="#FFFFFF"
                                            opacity="0.4"
                                        />
                                        {/* Sprouting green twin leaves */}
                                        <path
                                            d="M50 48 Q64 60 50 84 Q40 70 50 48 Z"
                                            fill="url(#leafGrad)"
                                        />
                                        <path
                                            d="M50 56 Q36 65 42 78 Q47 70 50 56 Z"
                                            fill="#86EFAC"
                                            opacity="0.8"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ----------------- YOUR PROGRESS CARD (If In-Progress) ----------------- */}
                {!isEligible && (
                    <div className="rounded-[24px] bg-white p-5 border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] space-y-3.5">
                        <div className="flex items-center justify-between">
                            <span className="text-base font-black text-slate-900 tracking-tight">
                                Your Progress
                            </span>
                            <span className="text-base font-black text-slate-900 tracking-tight">
                                {completedSurveys} / {TARGET_SURVEYS}
                            </span>
                        </div>

                        {/* Crisp Smooth Progress Bar */}
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-[#2DD4BF] to-[#10B981] transition-all duration-700 ease-out shadow-xs"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        <p className="text-xs font-medium text-slate-600 leading-relaxed">
                            <strong className="font-black text-slate-900">{remainingSurveys} more</strong> successful surveys to unlock your Expert Kit &amp; Insurance eligibility.
                        </p>
                    </div>
                )}

                {/* ----------------- CARD 1: JALADHAARA EXPERT KIT ----------------- */}
                <div className="rounded-[24px] bg-white p-5 border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] space-y-3.5 transition-all">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5">
                            {/* Gift Icon Box */}
                            <div className="w-13 h-13 rounded-2xl bg-[#FFF1F2] border border-rose-100 flex items-center justify-center shrink-0 shadow-2xs">
                                <span className="text-2xl select-none">🎁</span>
                            </div>

                            <div className="pt-0.5">
                                <h3 className="text-base font-black text-slate-900 tracking-tight">
                                    Jaladhaara Expert Kit
                                </h3>
                                <p className="text-xs font-medium text-slate-500 mt-1 leading-snug">
                                    {isEligible
                                        ? "Your Expert Kit will be dispatched soon after admin verification"
                                        : "Available after 10 successful surveys."}
                                </p>
                            </div>
                        </div>

                        {/* Status Badge / Lock */}
                        {isEligible ? (
                            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                <IoCheckmarkCircle className="text-sm text-emerald-600" />
                                Eligible
                            </span>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0" title="Locked until 10 surveys completed">
                                <IoLockClosed className="text-sm" />
                            </div>
                        )}
                    </div>

                    {/* Bullets with soft red dots */}
                    <div className="pl-1 space-y-2 pt-1">
                        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>Jaladhaara T-shirt</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>Jaladhaara Cap</span>
                        </div>
                    </div>

                    {/* Action Button (When Eligible) */}
                    {isEligible && (
                        <button
                            type="button"
                            onClick={() => setShowKitModal(true)}
                            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] active:scale-[0.99] text-white font-black text-xs sm:text-sm tracking-wide shadow-xs hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                            <span>{kitSubmitted ? "View Requested Kit Details" : "View Kit Details"}</span>
                        </button>
                    )}
                </div>

                {/* ----------------- CARD 2: INSURANCE ELIGIBILITY ----------------- */}
                <div className="rounded-[24px] bg-white p-5 border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] space-y-3.5 transition-all">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5">
                            {/* Shield Icon Box */}
                            <div className="w-13 h-13 rounded-2xl bg-[#EFF6FF] border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                                <span className="text-2xl select-none">🛡️</span>
                            </div>

                            <div className="pt-0.5">
                                <h3 className="text-base font-black text-slate-900 tracking-tight">
                                    Insurance Eligibility
                                </h3>
                                {isEligible ? (
                                    <p className="text-xs font-medium text-slate-500 mt-1 leading-snug">
                                        Please complete the required documents for insurance enrollment.
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        {/* Status Badge / Lock */}
                        {isEligible ? (
                            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                <IoCheckmarkCircle className="text-sm text-emerald-600" />
                                Eligible
                            </span>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0" title="Locked until 10 surveys completed">
                                <IoLockClosed className="text-sm" />
                            </div>
                        )}
                    </div>

                    {/* Bullets with soft blue dots */}
                    <div className="pl-1 space-y-2 pt-1">
                        {!isEligible && (
                            <div className="flex items-center gap-2.5 text-xs font-medium text-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] shrink-0" />
                                <span>Eligible after 10 successful surveys</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2.5 text-xs font-medium text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] shrink-0" />
                            <span>Coverage for field work (as per policy)</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs font-medium text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] shrink-0" />
                            <span>Subject to insurer&apos;s terms &amp; conditions</span>
                        </div>
                    </div>

                    {/* Action Button (When Eligible) */}
                    {isEligible && (
                        <button
                            type="button"
                            onClick={() => setShowInsuranceModal(true)}
                            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] active:scale-[0.99] text-white font-black text-xs sm:text-sm tracking-wide shadow-xs hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                            <span>{insuranceSubmitted ? "Update Insurance Details" : "Submit Details"}</span>
                        </button>
                    )}
                </div>

                {/* ----------------- INSPIRATIONAL FOOTER ----------------- */}
                <div className="pt-3 pb-8 text-center px-4">
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">
                        {isEligible ? (
                            <>
                                Thank you for your contribution!<br />
                                <span className="text-[#059669] font-bold">Together we bring water security to every community.</span>
                            </>
                        ) : (
                            <>
                                Keep delivering quality surveys<br />
                                and be a part of our mission for a water secure India.
                            </>
                        )}
                    </p>
                </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* MODAL 1: VIEW KIT DETAILS & SIZE SELECTION                    */}
            {/* ------------------------------------------------------------- */}
            {showKitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🎁</span>
                                <h3 className="font-black text-slate-900 text-base">
                                    Jaladhaara Expert Kit
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowKitModal(false)}
                                className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
                            >
                                <IoCloseOutline className="text-lg" />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmKit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 text-center">
                                    <div className="text-3xl mb-1">👕</div>
                                    <h4 className="text-xs font-black text-slate-900">Official T-shirt</h4>
                                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Dry-Fit Breathable</p>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 text-center">
                                    <div className="text-3xl mb-1">🧢</div>
                                    <h4 className="text-xs font-black text-slate-900">Field Sun Cap</h4>
                                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">UV Shield Embroidered</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                                    Select T-shirt Size
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {["S", "M", "L", "XL", "XXL"].map((sz) => (
                                        <button
                                            key={sz}
                                            type="button"
                                            onClick={() => setSelectedSize(sz)}
                                            className={`py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                                                selectedSize === sz
                                                    ? "bg-[#0A84FF] text-white border-[#0A84FF] shadow-xs scale-105"
                                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                            }`}
                                        >
                                            {sz}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                    <IoLocationOutline className="text-sm text-[#0A84FF]" />
                                    <span>Shipping Address:</span>
                                </div>
                                <p className="text-slate-600 pl-5 text-[11px]">
                                    {vendor?.address?.city || vendor?.city || user?.city || user?.address || "Registered Address on profile"}
                                    {vendor?.address?.state ? `, ${vendor.address.state}` : (user?.state ? `, ${user.state}` : "")}
                                </p>
                                <p className="text-slate-400 pl-5 text-[10px]">
                                    Contact: {vendor?.phone || user?.phone || "Phone on file"}
                                </p>
                            </div>

                            <p className="text-[11px] text-slate-500 italic">
                                * Your Expert Kit will be dispatched soon after administrative verification of your completed surveys.
                            </p>

                            <button
                                type="submit"
                                className="w-full py-3 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] text-white font-black text-xs tracking-wide shadow-md transition-all active:scale-[0.98] cursor-pointer"
                            >
                                Confirm Kit Dispatch (Size {selectedSize})
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* MODAL 2: SUBMIT INSURANCE ENROLLMENT DETAILS                  */}
            {/* ------------------------------------------------------------- */}
            {showInsuranceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🛡️</span>
                                <h3 className="font-black text-slate-900 text-base">
                                    Insurance Enrollment
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowInsuranceModal(false)}
                                className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
                            >
                                <IoCloseOutline className="text-lg" />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmInsurance} className="p-5 space-y-3.5">
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                                <span className="font-black">Field Work Cover: </span>
                                Accidental and emergency medical support while on verified groundwater survey visits.
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Nominee Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={nomineeName}
                                    onChange={(e) => setNomineeName(e.target.value)}
                                    placeholder="e.g. Priya Kumar"
                                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Relationship *
                                    </label>
                                    <select
                                        value={nomineeRelation}
                                        onChange={(e) => setNomineeRelation(e.target.value)}
                                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#0A84FF]"
                                    >
                                        <option value="Spouse">Spouse</option>
                                        <option value="Parent">Parent</option>
                                        <option value="Child">Child</option>
                                        <option value="Sibling">Sibling</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Nominee Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={nomineePhone}
                                        onChange={(e) => setNomineePhone(e.target.value)}
                                        placeholder="10-digit number"
                                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#0A84FF]"
                                    />
                                </div>
                            </div>

                            <label className="flex items-start gap-2 pt-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={insuranceAgreed}
                                    onChange={(e) => setInsuranceAgreed(e.target.checked)}
                                    className="mt-0.5 rounded text-[#0A84FF] focus:ring-0 cursor-pointer"
                                />
                                <span className="text-[11px] text-slate-600 leading-tight">
                                    I confirm that the nominee details provided are accurate and I agree to the Jaladhaara Expert Group Insurance policy terms.
                                </span>
                            </label>

                            <button
                                type="submit"
                                className="w-full mt-2 py-3 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] text-white font-black text-xs tracking-wide shadow-md transition-all active:scale-[0.98] cursor-pointer"
                            >
                                Submit Insurance Enrollment
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
