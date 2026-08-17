import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    IoPersonOutline,
    IoMailOutline,
    IoCallOutline,
    IoGlobeOutline,
    IoCheckmark,
    IoPersonAddOutline
} from "react-icons/io5";
import { sendUserRegistrationOTP } from "../../../services/authApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import { useLanguage } from "../../../contexts/LanguageContext";
import PolicyModal from "../../shared/components/PolicyModal";

import logo from "@/assets/AppLogo.png";

const DRAFT_USER_STORAGE_KEY = "jaladhar_user_signup_draft";

const getSavedUserDraft = () => {
    try {
        const saved = sessionStorage.getItem(DRAFT_USER_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) {
        console.error("Error reading user signup draft:", e);
    }
    return null;
};

export default function UserSignup() {
    const location = useLocation();
    const { language, setLanguage, t, supportedLanguages, isLanguageEnabled } = useLanguage();
    const savedDraft = getSavedUserDraft();
    const [agreedToTerms, setAgreedToTerms] = useState(() => !!savedDraft?.agreedToTerms);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [policyType, setPolicyType] = useState("general");
    
    const [formData, setFormData] = useState(() => ({
        name: location.state?.name || savedDraft?.name || "",
        phone: location.state?.phone || savedDraft?.phone || "",
        email: location.state?.email || savedDraft?.email || "",
        preferredLanguage: location.state?.preferredLanguage || savedDraft?.preferredLanguage || language || "en"
    }));
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Auto-save draft on input change
    useEffect(() => {
        try {
            sessionStorage.setItem(DRAFT_USER_STORAGE_KEY, JSON.stringify({
                ...formData,
                agreedToTerms
            }));
        } catch (e) {
            console.error("Draft save failed:", e);
        }
    }, [formData, agreedToTerms]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSelectLanguage = (langCode) => {
        setLanguage(langCode);
        setFormData((prev) => ({
            ...prev,
            preferredLanguage: langCode,
        }));
    };

    const handleSendOTP = async (e) => {
        e?.preventDefault();

        // Validation
        if (!formData.name || !formData.phone) {
            toast.showError("Please fill in Full Name and Mobile Number");
            return;
        }

        if (!agreedToTerms) {
            toast.showError("Please agree to the Terms & Conditions and Privacy Policy to continue");
            return;
        }

        setLoading(true);
        const loadingToast = toast.showLoading("Sending OTP...");

        try {
            const response = await sendUserRegistrationOTP({
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                preferredLanguage: formData.preferredLanguage,
            });

            if (response.success) {
                toast.dismissToast(loadingToast);
                if (response.reused) {
                    toast.showInfo(response.message || "Active OTP reused. Redirecting to verification...");
                } else {
                    toast.showSuccess("OTP sent successfully! Please verify to complete account creation.");
                }
                
                // Navigate to verify OTP step carrying registration state
                setTimeout(() => {
                    navigate("/user/verify-otp", {
                        state: {
                            registrationData: {
                                name: formData.name,
                                phone: formData.phone,
                                email: formData.email,
                                preferredLanguage: formData.preferredLanguage,
                            },
                            verificationToken: response.data?.token,
                            devOtp: response.data?.devOtp,
                            cooldownRemaining: response.data?.cooldownRemaining || 60,
                            phone: formData.phone,
                            email: formData.email,
                            otpSent: true,
                        },
                    });
                }, 600);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to send OTP");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const openPolicy = (type) => {
        setPolicyType(type);
        setShowTermsModal(true);
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-teal-50/30 px-4 py-8 overflow-y-auto overflow-x-hidden">
            {/* Ambient Blurred Background Accents */}
            <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute bottom-10 right-10 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl" />

            <div className="relative z-10 w-full max-w-md flex flex-col items-center">
                {/* Main Card Container */}
                <main className="w-full rounded-3xl bg-white/95 backdrop-blur-md p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80">
                    {/* Logo & Subtitle */}
                    <div className="mb-6 flex flex-col items-center text-center">
                        <div className="relative mb-3 flex items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 shadow-2xs">
                            <img
                                src={logo}
                                alt="Jaladhaara Logo"
                                className="h-20 sm:h-24 object-contain"
                            />
                        </div>
                        <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-500">
                            {t('createAccountHeader', 'Create your account to book professional groundwater surveys.')}
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSendOTP}>
                        {/* Pill Tag */}
                        <div className="flex justify-center mb-2">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-[#0A84FF] text-xs font-extrabold border border-blue-200/80 tracking-wide shadow-2xs">
                                <IoPersonAddOutline className="text-sm" />
                                {t('createAccount', 'Create Account')}
                            </span>
                        </div>

                        {/* PAN India Language Selection Component */}
                        {isLanguageEnabled && (
                            <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 mb-2">
                                <div className="flex items-center justify-between mb-2 px-0.5">
                                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <IoGlobeOutline className="text-[#0A84FF] text-base" />
                                        <span>{t("selectLanguage", "Select Language")}</span>
                                    </span>
                                    <span className="text-[10px] font-extrabold text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        PAN India
                                    </span>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {supportedLanguages.map((lang) => {
                                        const isSelected = (formData.preferredLanguage || language) === lang.code;
                                        return (
                                            <button
                                                key={lang.code}
                                                type="button"
                                                onClick={() => handleSelectLanguage(lang.code)}
                                                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                                    isSelected
                                                        ? "bg-[#0A84FF] text-white border-[#0A84FF] shadow-sm scale-[1.02]"
                                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80"
                                                }`}
                                            >
                                                <span className={`text-[10px] font-mono font-bold ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                                                    {lang.badge}
                                                </span>
                                                <span className="truncate max-w-full text-[11px] mt-0.5">{lang.nativeName}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Full Name */}
                        <div className="relative">
                            <IoPersonOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />
                            <input
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-800 text-sm font-medium shadow-2xs focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                placeholder={t('fullName', 'Full Name')}
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                disabled={loading}
                                required
                            />
                        </div>

                        {/* Mobile Number * */}
                        <div className="relative">
                            <IoCallOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />
                            <input
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-800 text-sm font-medium shadow-2xs focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                placeholder={`${t('mobileNumber', 'Mobile Number')} *`}
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                disabled={loading}
                                required
                            />
                        </div>

                        {/* Email Address (Optional) */}
                        <div className="relative">
                            <IoMailOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />
                            <input
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-800 text-sm font-medium shadow-2xs focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                placeholder={t('emailOptional', 'Email Address (Optional)')}
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                        </div>

                        {/* Terms & Conditions Checkbox */}
                        <div className="pt-2 pb-1">
                            <div className="flex items-start gap-3 select-none">
                                <button
                                    type="button"
                                    onClick={() => setAgreedToTerms(!agreedToTerms)}
                                    className={`mt-0.5 w-5 h-5 rounded-md border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                                        agreedToTerms
                                            ? "bg-[#0A84FF] border-[#0A84FF] text-white shadow-2xs"
                                            : "bg-white border-slate-300 hover:border-blue-400"
                                    }`}
                                >
                                    {agreedToTerms && <IoCheckmark className="text-sm stroke-[3]" />}
                                </button>
                                <span className="text-xs text-slate-600 leading-tight">
                                    I agree to the{" "}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openPolicy("general");
                                        }}
                                        className="font-bold text-[#0A84FF] underline hover:text-blue-700 transition-colors cursor-pointer"
                                    >
                                        Terms & Conditions
                                    </button>{" "}
                                    and{" "}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openPolicy("privacy");
                                        }}
                                        className="font-bold text-[#0A84FF] underline hover:text-blue-700 transition-colors cursor-pointer"
                                    >
                                        Privacy Policy
                                    </button>
                                </span>
                            </div>
                        </div>

                        {/* Continue Button */}
                        <button
                            className="w-full rounded-2xl bg-gradient-to-r from-[#0A84FF] via-blue-600 to-[#00C2A8] py-3.5 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2 flex items-center justify-center gap-2"
                            type="submit"
                            disabled={loading || !agreedToTerms}
                        >
                            <span>{loading ? "Sending OTP..." : t('continue', 'Continue')}</span>
                            {!loading && <span className="text-base font-bold">→</span>}
                        </button>
                    </form>

                    {/* Footer Link */}
                    <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                        <p className="text-xs sm:text-sm font-medium text-slate-500">
                            {t('alreadyHaveAccount', 'Already have an account?')}{" "}
                            <Link
                                to="/userlogin"
                                className="font-extrabold text-[#0A84FF] hover:text-blue-700 hover:underline transition-colors"
                            >
                                {t('login', 'Log In')}
                            </Link>
                        </p>
                    </div>
                </main>
            </div>

            {showTermsModal && (
                <PolicyModal type={policyType} onClose={() => setShowTermsModal(false)} />
            )}
        </div>
    );
}
