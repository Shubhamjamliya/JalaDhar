import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    IoChevronBackOutline,
    IoGift,
    IoGiftOutline,
    IoShieldCheckmark,
    IoShieldCheckmarkOutline,
    IoLockClosed,
    IoCheckmarkCircle,
    IoCheckmarkCircleOutline,
    IoShirtOutline,
    IoSparkles,
    IoCloseOutline,
    IoLocationOutline,
    IoCallOutline,
    IoPersonOutline,
    IoDocumentTextOutline,
    IoCheckmark
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
    
    // Preview Mode toggle: 'auto' (real stats), 'in_progress' (8/10 as in mockup), 'completed' (10/10 as in mockup)
    const [previewMode, setPreviewMode] = useState("auto");

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
                        const completed = res.data.bookings.filter(b => b.status === 'COMPLETED' || b.status === 'REPORT_UPLOADED').length;
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

    // Determine current count based on real stats or preview mode
    const realCompletedCount = stats?.completedBookings ?? 0;
    const completedSurveys = 
        previewMode === "in_progress" 
            ? 8 
            : previewMode === "completed" 
            ? 10 
            : realCompletedCount;

    const TARGET_SURVEYS = 10;
    const isEligible = completedSurveys >= TARGET_SURVEYS;
    const remainingSurveys = Math.max(0, TARGET_SURVEYS - completedSurveys);
    const progressPercent = Math.min(100, Math.round((completedSurveys / TARGET_SURVEYS) * 100));

    const handleConfirmKit = (e) => {
        e.preventDefault();
        setKitSubmitted(true);
        toast.showSuccess("Kit dispatch request recorded! You will receive a notification with tracking details once verified.");
        setTimeout(() => setShowKitModal(false), 1200);
    };

    const handleConfirmInsurance = (e) => {
        e.preventDefault();
        if (!insuranceAgreed) {
            toast.showError("Please agree to the insurance terms.");
            return;
        }
        setInsuranceSubmitted(true);
        toast.showSuccess("Insurance enrollment details submitted successfully!");
        setTimeout(() => setShowInsuranceModal(false), 1200);
    };

    return (
        <div className="min-h-screen pb-16 bg-[#F8FAFC]">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3.5 transition-all">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95 cursor-pointer"
                        aria-label="Back to dashboard"
                    >
                        <IoChevronBackOutline className="text-xl" />
                    </button>
                    <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight text-center">
                        Rewards &amp; Benefits
                    </h1>
                    <div className="w-9" /> {/* Spacer for symmetry */}
                </div>
            </div>

            {/* Interactive Preview Switcher (Allows testing both mockup states) */}
            <div className="max-w-md mx-auto px-4 pt-3 pb-1">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100/90 border border-slate-200/70 text-xs">
                    <span className="font-bold text-slate-600 pl-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Preview State:
                    </span>
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg shadow-2xs border border-slate-200/50">
                        <button
                            type="button"
                            onClick={() => setPreviewMode("in_progress")}
                            className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                previewMode === "in_progress"
                                    ? "bg-[#0A84FF] text-white shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            8 / 10
                        </button>
                        <button
                            type="button"
                            onClick={() => setPreviewMode("completed")}
                            className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                previewMode === "completed"
                                    ? "bg-emerald-600 text-white shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            10 / 10 (Eligible)
                        </button>
                        <button
                            type="button"
                            onClick={() => setPreviewMode("auto")}
                            className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                previewMode === "auto"
                                    ? "bg-slate-800 text-white shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                            title={`Real Completed Surveys: ${realCompletedCount}`}
                        >
                            Live ({realCompletedCount})
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-md mx-auto px-4 py-4 space-y-4">
                {/* ----------------- STATE 1: CELEBRATION BANNER (If >= 10) ----------------- */}
                {isEligible ? (
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-50/70 via-white to-white p-6 border border-emerald-200/80 shadow-sm text-center">
                        <div className="relative z-10 flex flex-col items-center">
                            {/* Green Checkmark Circle */}
                            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4 animate-bounce">
                                <IoCheckmark className="text-4xl stroke-[3]" />
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                Congratulations!
                            </h2>
                            <p className="mt-1 text-sm font-semibold text-slate-600 max-w-[280px]">
                                You have successfully completed {completedSurveys} Jaladhaara surveys.
                            </p>

                            <div className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-black shadow-xs">
                                <IoSparkles className="text-sm" />
                                <span>You are now eligible!</span>
                            </div>
                        </div>

                        {/* Subtle decorative background glow */}
                        <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-200/30 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-teal-200/30 rounded-full blur-2xl pointer-events-none" />
                    </div>
                ) : (
                    /* ----------------- STATE 2: IMPACT HERO BANNER (If < 10) ----------------- */
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#EDF6FF] via-[#E8F8F0] to-[#DCF5E8] p-5 sm:p-6 border border-blue-100 shadow-xs">
                        <div className="relative z-10">
                            {/* Water & Sprout graphic tag in top right */}
                            <div className="flex justify-between items-start">
                                <div className="max-w-[190px] sm:max-w-[210px]">
                                    <h2 className="text-xl sm:text-[22px] font-black text-slate-900 leading-tight">
                                        Your Experience Creates Impact
                                    </h2>
                                    <p className="mt-2 text-xs font-semibold text-slate-600 leading-relaxed">
                                        Complete 10 successful surveys and unlock exclusive benefits.
                                    </p>
                                </div>

                                {/* Jaladhaara graphic emblem */}
                                <div className="flex flex-col items-center shrink-0">
                                    <span className="text-[10px] font-black italic tracking-wide text-emerald-700 bg-white/70 backdrop-blur-xs px-2 py-0.5 rounded-full border border-emerald-200/60 mb-1.5 shadow-2xs text-center">
                                        Experts for a<br />Better Tomorrow
                                    </span>
                                    {/* Jaladhaara Stylized Leaf Drop */}
                                    <div className="w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-sm p-2 shadow-xs border border-white flex items-center justify-center">
                                        <svg viewBox="0 0 100 100" className="w-full h-full">
                                            <path
                                                d="M50 8 C50 8, 20 45, 20 66 A30 30 0 0 0 80 66 C80 45, 50 8, 50 8 Z"
                                                fill="#0A84FF"
                                            />
                                            <path
                                                d="M50 40 Q65 55 50 86 Q40 68 50 40 Z"
                                                fill="#34C759"
                                            />
                                            <circle cx="50" cy="62" r="6" fill="#FFFFFF" opacity="0.8" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Background subtle curve */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-300/20 rounded-full blur-xl pointer-events-none" />
                    </div>
                )}

                {/* ----------------- PROGRESS CARD (Shown on in-progress) ----------------- */}
                {!isEligible && (
                    <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-slate-800 tracking-tight">
                                Your Progress
                            </span>
                            <span className="text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                                {completedSurveys} / {TARGET_SURVEYS}
                            </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-[#0A84FF] transition-all duration-700 ease-out shadow-xs"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        <p className="text-xs font-semibold text-slate-600">
                            <span className="font-extrabold text-slate-900">{remainingSurveys} more</span> successful surveys to unlock your Expert Kit &amp; Insurance eligibility.
                        </p>
                    </div>
                )}

                {/* ----------------- CARD 1: JALADHAARA EXPERT KIT ----------------- */}
                <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5 transition-all hover:border-slate-300">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            {/* Gift Icon Box */}
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0 shadow-2xs">
                                <IoGift className="text-2xl" />
                            </div>

                            <div>
                                <h3 className="text-base font-black text-slate-900">
                                    Jaladhaara Expert Kit
                                </h3>
                                <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5">
                                    {isEligible
                                        ? "Your Expert Kit will be dispatched soon after admin verification"
                                        : "Available after 10 successful surveys."}
                                </p>
                            </div>
                        </div>

                        {/* Status Badge / Lock */}
                        {isEligible ? (
                            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <IoCheckmarkCircle className="text-xs text-emerald-600" />
                                Eligible
                            </span>
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0" title="Locked until 10 surveys completed">
                                <IoLockClosed className="text-xs" />
                            </div>
                        )}
                    </div>

                    {/* Kit Item Bullets */}
                    <div className="pl-2 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>Jaladhaara T-shirt</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>Jaladhaara Cap</span>
                        </div>
                    </div>

                    {/* Action Button (When Eligible) */}
                    {isEligible && (
                        <button
                            type="button"
                            onClick={() => setShowKitModal(true)}
                            className="w-full mt-1 py-2.5 px-4 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] active:scale-[0.99] text-white font-black text-xs sm:text-sm tracking-wide shadow-xs hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                            <span>{kitSubmitted ? "View Requested Kit Details" : "View Kit Details"}</span>
                        </button>
                    )}
                </div>

                {/* ----------------- CARD 2: INSURANCE ELIGIBILITY ----------------- */}
                <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5 transition-all hover:border-slate-300">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            {/* Shield Icon Box */}
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-[#0A84FF] flex items-center justify-center shrink-0 shadow-2xs">
                                <IoShieldCheckmark className="text-2xl" />
                            </div>

                            <div>
                                <h3 className="text-base font-black text-slate-900">
                                    Insurance Eligibility
                                </h3>
                                {isEligible && (
                                    <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5">
                                        Please complete the required documents for insurance enrollment.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Status Badge / Lock */}
                        {isEligible ? (
                            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <IoCheckmarkCircle className="text-xs text-emerald-600" />
                                Eligible
                            </span>
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0" title="Locked until 10 surveys completed">
                                <IoLockClosed className="text-xs" />
                            </div>
                        )}
                    </div>

                    {/* Insurance Terms Bullets */}
                    <div className="pl-2 space-y-1.5">
                        {!isEligible && (
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                <span>Eligible after 10 successful surveys</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span>Coverage for field work (as per policy)</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span>Subject to insurer&apos;s terms &amp; conditions</span>
                        </div>
                    </div>

                    {/* Action Button (When Eligible) */}
                    {isEligible && (
                        <button
                            type="button"
                            onClick={() => setShowInsuranceModal(true)}
                            className="w-full mt-1 py-2.5 px-4 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] active:scale-[0.99] text-white font-black text-xs sm:text-sm tracking-wide shadow-xs hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                            <span>{insuranceSubmitted ? "Update Insurance Details" : "Submit Details"}</span>
                        </button>
                    )}
                </div>

                {/* ----------------- INSPIRATIONAL FOOTER ----------------- */}
                <div className="pt-2 pb-6 text-center">
                    <p className="text-xs font-semibold text-slate-500 leading-relaxed px-4">
                        {isEligible ? (
                            <>
                                Thank you for your contribution!<br />
                                <span className="text-emerald-700 font-bold">Together we bring water security to every community.</span>
                            </>
                        ) : (
                            <>
                                Keep delivering quality surveys and be a part of our mission for a water secure India.
                            </>
                        )}
                    </p>
                </div>
            </main>

            {/* ------------------------------------------------------------- */}
            {/* MODAL 1: VIEW KIT DETAILS & SIZE SELECTION                    */}
            {/* ------------------------------------------------------------- */}
            {showKitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
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

                        {/* Content */}
                        <form onSubmit={handleConfirmKit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 text-center">
                                    <div className="text-2xl mb-1">👕</div>
                                    <h4 className="text-xs font-black text-slate-900">Official T-shirt</h4>
                                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Dry-Fit Breathable</p>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 text-center">
                                    <div className="text-2xl mb-1">🧢</div>
                                    <h4 className="text-xs font-black text-slate-900">Field Sun Cap</h4>
                                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">UV Shield Embroidered</p>
                                </div>
                            </div>

                            {/* T-Shirt Size Selector */}
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
                                            className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
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

                            {/* Shipping Confirmation */}
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
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

                            {/* Submit Button */}
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
                        {/* Header */}
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

                        {/* Content Form */}
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
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-blue-100"
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
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#0A84FF]"
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
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#0A84FF]"
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
