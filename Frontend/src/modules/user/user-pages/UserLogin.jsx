import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    IoCallOutline,
    IoGlobeOutline,
    IoPersonOutline
} from "react-icons/io5";
import { sendUserLoginOTP } from "../../../services/authApi";
import { useToast } from "../../../hooks/useToast";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
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
    const langDropdownRef = useRef(null);
    
    const navigate = useNavigate();
    const toast = useToast();
    const { isAuthenticated } = useAuth();

    const searchParams = new URLSearchParams(location.search);
    const redirectUrl = searchParams.get("redirect") || location.state?.redirectUrl || (location.state?.from ? (location.state.from.pathname + (location.state.from.search || '')) : null);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (isAuthenticated) {
            navigate(redirectUrl || "/user/dashboard", { replace: true });
        }
    }, [isAuthenticated, navigate, redirectUrl]);

    // Close language dropdown on outside click, touch, or escape key
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
                setShowLangMenu(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setShowLangMenu(false);
            }
        };

        if (showLangMenu) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [showLangMenu]);

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
            const response = await sendUserLoginOTP({ phone: cleanPhone });

            if (response.success) {
                toast.dismissToast(loadingToast);
                if (response.reused) {
                    toast.showInfo(response.message || "Active OTP reused. Redirecting...");
                } else {
                    toast.showSuccess("OTP sent successfully to your mobile number!");
                }

                setTimeout(() => {
                    navigate(`/user/verify-login-otp${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`, {
                        state: {
                            phone: cleanPhone,
                            verificationToken: response.data?.token,
                            devOtp: response.data?.devOtp || location.state?.devOtp,
                            cooldownRemaining: response.data?.cooldownRemaining || 60,
                            redirectUrl: redirectUrl,
                            isNewUser: response.isNewUser
                        }
                    });
                }, 500);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to send OTP");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            toast.showError(err.response?.data?.message || "Failed to send OTP. Please check your network and try again.");
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
                <div className="absolute top-4 right-4 z-20" ref={langDropdownRef}>
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
                        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                            {t('login', 'Login')}
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-500">
                            {t('enterMobileSubtitle', 'Enter your mobile number to continue')}
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSendLoginOTP} autoComplete="off">
                        {/* Mobile Number Input with +91 Country Badge */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">
                                {t('mobileNumber', 'Mobile Number')} <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white shadow-2xs focus-within:border-[#0A84FF] focus-within:ring-4 focus-within:ring-blue-100 transition-all overflow-hidden">
                                <div className="flex items-center gap-1.5 px-3.5 py-3.5 bg-slate-50 border-r border-slate-200 text-slate-700 font-bold text-sm select-none shrink-0">
                                    <span className="text-base">🇮🇳</span>
                                    <span>+91</span>
                                </div>
                                <input
                                    className="w-full bg-transparent py-3.5 px-4 text-slate-800 text-base font-bold tracking-wide outline-none placeholder:font-normal placeholder:text-slate-400 placeholder:text-sm"
                                    placeholder="Enter 10-digit mobile number"
                                    type="tel"
                                    inputMode="numeric"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    maxLength={10}
                                    disabled={loading}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            className="w-full rounded-2xl bg-gradient-to-r from-[#0A84FF] via-blue-600 to-[#00C2A8] py-3.5 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 mt-4"
                            type="submit"
                            disabled={loading || phone.length !== 10}
                        >
                            <span>{loading ? "Sending OTP..." : t('getOtp', 'Get Verification Code')}</span>
                            {!loading && <span className="text-base font-bold">→</span>}
                        </button>
                    </form>

                    {/* Terms & Privacy Notice */}
                    <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            By continuing, you agree to our{" "}
                            <button
                                type="button"
                                onClick={() => setShowTermsModal(true)}
                                className="font-bold text-[#0A84FF] hover:underline cursor-pointer"
                            >
                                Terms & Conditions
                            </button>
                            {" "}and{" "}
                            <button
                                type="button"
                                onClick={() => setShowTermsModal(true)}
                                className="font-bold text-[#0A84FF] hover:underline cursor-pointer"
                            >
                                Privacy Policy
                            </button>.
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
