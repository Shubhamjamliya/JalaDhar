import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    IoCallOutline,
    IoGlobeOutline,
    IoPersonOutline
} from "react-icons/io5";
import { sendUserLoginOTP } from "../../../services/authApi";
import { useToast } from "../../../hooks/useToast";
import { useLanguage } from "../../../contexts/LanguageContext";
import PolicyModal from "../../shared/components/PolicyModal";

import logo from "@/assets/AppLogo.png";

export default function UserLogin() {
    const location = useLocation();
    const { language, setLanguage, t, supportedLanguages, isLanguageEnabled } = useLanguage();
    
    // Form state
    const [phone, setPhone] = useState(() => location.state?.phone || location.state?.mobile || "");
    const [loading, setLoading] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Handle Mobile OTP Login
    const handleSendLoginOTP = async (e) => {
        e?.preventDefault();

        const cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length !== 10) {
            toast.showError("Please enter a valid 10-digit Mobile Number");
            return;
        }

        setLoading(true);
        const loadingToast = toast.showLoading("Sending OTP...");

        try {
            const response = await sendUserLoginOTP({ phone: phone.trim() });

            if (response.success) {
                toast.dismissToast(loadingToast);
                if (response.reused) {
                    toast.showInfo(response.message || "Active OTP reused. Redirecting...");
                } else {
                    toast.showSuccess("OTP sent successfully! Please verify to log in.");
                }

                setTimeout(() => {
                    navigate("/user/verify-login-otp", {
                        state: {
                            phone: phone.trim(),
                            verificationToken: response.data?.token,
                            devOtp: response.data?.devOtp || location.state?.devOtp,
                            cooldownRemaining: response.data?.cooldownRemaining || 60
                        }
                    });
                }, 600);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to send OTP");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            toast.showError(err.response?.data?.message || "No account found with this mobile number. Please click Sign Up to create an account.");
        } finally {
            setLoading(false);
        }
    };

    const currentLangObj = supportedLanguages.find(l => l.code === language) || supportedLanguages[0];

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-teal-50/30 px-4 py-8 overflow-y-auto overflow-x-hidden">
            {/* Ambient Blurred Background Accents */}
            <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute bottom-10 right-10 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl" />

            {/* Top Language Toggle Button */}
            {isLanguageEnabled && (
                <div className="absolute top-4 right-4 z-20">
                    <button
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs text-xs font-bold text-slate-700 hover:border-blue-300 transition-all cursor-pointer"
                    >
                        <IoGlobeOutline className="text-[#0A84FF] text-sm" />
                        <span>{currentLangObj.nativeName}</span>
                    </button>

                    {showLangMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-30 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                            {supportedLanguages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        setShowLangMenu(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer ${
                                        language === lang.code ? "bg-blue-50 text-[#0A84FF]" : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                >
                                    <span>{lang.nativeName}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{lang.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

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
                            {t('welcomeBackLogin', 'Welcome back! Please login to your account.')}
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSendLoginOTP}>
                        {/* Pill Tag */}
                        <div className="flex justify-center mb-2">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-[#0A84FF] text-xs font-extrabold border border-blue-200/80 tracking-wide shadow-2xs">
                                <IoPersonOutline className="text-sm" />
                                {t('userLogin', 'User Login')}
                            </span>
                        </div>

                        {/* Mobile Number Input */}
                        <div className="relative">
                            <IoCallOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />
                            <input
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-800 text-sm font-medium shadow-2xs focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                placeholder={`${t('mobileNumber', 'Mobile Number')} *`}
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                maxLength={10}
                                disabled={loading}
                                required
                                autoFocus
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            className="w-full rounded-2xl bg-gradient-to-r from-[#0A84FF] via-blue-600 to-[#00C2A8] py-3.5 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 mt-2"
                            type="submit"
                            disabled={loading || !phone}
                        >
                            <span>{loading ? "Sending OTP..." : t('sendOtp', 'Send OTP')}</span>
                            {!loading && <span className="text-base font-bold">→</span>}
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-2">
                        <p className="text-xs text-slate-500 font-medium">
                            By logging in, you agree to our{" "}
                            <button
                                type="button"
                                onClick={() => setShowTermsModal(true)}
                                className="font-bold text-[#0A84FF] underline hover:text-blue-700 transition-colors cursor-pointer"
                            >
                                General Terms & Conditions
                            </button>
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-slate-500">
                            {t('dontHaveAccount', "Don't have an account?")}{" "}
                            <Link
                                to="/usersignup"
                                className="font-extrabold text-[#0A84FF] hover:text-blue-700 hover:underline transition-colors"
                            >
                                {t('signUp', 'Sign Up')}
                            </Link>
                        </p>
                    </div>
                </main>
            </div>

            {showTermsModal && (
                <PolicyModal type="general" onClose={() => setShowTermsModal(false)} />
            )}
        </div>
    );
}
