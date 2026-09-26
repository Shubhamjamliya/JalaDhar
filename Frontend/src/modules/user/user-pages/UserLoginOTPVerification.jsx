import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    IoShieldCheckmarkOutline,
    IoArrowBackOutline,
    IoCheckmarkCircle,
    IoPersonOutline,
    IoMailOutline,
    IoSparklesOutline,
    IoGlobeOutline
} from "react-icons/io5";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { sendUserLoginOTP } from "../../../services/authApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";

import logo from "@/assets/AppLogo.png";

export default function UserLoginOTPVerification() {
    const { t, language, setLanguage, supportedLanguages, isLanguageEnabled } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const { verifyLoginOTP } = useAuth();

    const [verificationToken, setVerificationToken] = useState(() => location.state?.verificationToken);
    const phone = location.state?.phone;

    // Steps: 'otp' | 'name'
    const [step, setStep] = useState("otp");
    const [otp, setOtp] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [otpCountdown, setOtpCountdown] = useState(() => location.state?.cooldownRemaining ?? 60);
    const [loading, setLoading] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const langDropdownRef = useRef(null);
    const toast = useToast();

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

    const currentLangObj = supportedLanguages?.find(l => l.code === language) || supportedLanguages?.[0] || { code: 'en', nativeName: 'English' };

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!verificationToken || !phone) {
            navigate("/userlogin", { replace: true });
            return;
        }
    }, [navigate, phone, verificationToken]);

    useEffect(() => {
        let timer;
        if (otpCountdown > 0) {
            timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [otpCountdown]);

    const handleResendOTP = async () => {
        setLoading(true);
        const loadingToast = toast.showLoading("Resending verification code...");
        try {
            const response = await sendUserLoginOTP({ phone });
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("New OTP sent to your mobile number!");
                setOtpCountdown(60);
                if (response.data?.token) {
                    setVerificationToken(response.data.token);
                }
                if (response.data?.devOtp) {
                    setOtp(response.data.devOtp);
                }
                window.history.replaceState(
                    { ...location.state, verificationToken: response.data?.token || verificationToken },
                    ""
                );
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to resend OTP");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to resend OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Verify OTP
    const handleVerifyOTP = async (e) => {
        e?.preventDefault();

        if (!otp || otp.length !== 6) {
            toast.showError("Please enter the complete 6-digit OTP");
            return;
        }

        setLoading(true);
        const loadingToast = toast.showLoading("Verifying code...");

        try {
            const result = await verifyLoginOTP({
                token: verificationToken,
                otp: otp
            });

            if (result.success) {
                toast.dismissToast(loadingToast);

                // If user doesn't exist yet, proceed to inline profile setup
                if (result.requiresName) {
                    if (result.token) {
                        setVerificationToken(result.token);
                    }
                    toast.showSuccess("Number verified! Please tell us your name.");
                    setStep("name");
                    return;
                }

                // Existing user logged in directly
                toast.showSuccess("Login successful! Welcome back.");
                setLoginSuccess(true);
                const searchParams = new URLSearchParams(location.search);
                const redirectUrl = location.state?.redirectUrl || searchParams.get('redirect') || "/user/dashboard";
                setTimeout(() => {
                    navigate(redirectUrl, { replace: true });
                }, 700);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(result.message || "Invalid OTP. Please try again.");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Verification failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Complete profile for new user (Name required, Email optional)
    const handleCompleteProfile = async (e) => {
        e?.preventDefault();

        const cleanName = name.trim();
        if (!cleanName || cleanName.length < 2) {
            toast.showError("Please enter your full name (at least 2 characters)");
            return;
        }

        const cleanEmail = email.trim();
        if (cleanEmail && !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
            toast.showError("Please enter a valid email address, or leave it blank");
            return;
        }

        setLoading(true);
        const loadingToast = toast.showLoading("Setting up your account...");

        try {
            const result = await verifyLoginOTP({
                token: verificationToken,
                otp: otp,
                name: cleanName,
                email: cleanEmail || undefined,
                preferredLanguage: language || 'en'
            });

            if (result.success && result.user) {
                toast.dismissToast(loadingToast);
                toast.showSuccess(`Welcome to Jaladhaara, ${cleanName}!`);
                setLoginSuccess(true);
                const searchParams = new URLSearchParams(location.search);
                const redirectUrl = location.state?.redirectUrl || searchParams.get('redirect') || "/user/dashboard";
                setTimeout(() => {
                    navigate(redirectUrl, { replace: true });
                }, 700);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(result.message || "Failed to complete account setup.");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to complete account setup. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loginSuccess) {
        return (
            <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-teal-50/30 px-4 py-8 overflow-y-auto overflow-x-hidden">
                <div className="w-full max-w-md flex flex-col items-center">
                    <div className="mb-6 flex flex-col items-center text-center">
                        <img
                            src={logo}
                            alt="Jaladhaara Logo"
                            className="h-20 sm:h-24 object-contain mb-2 drop-shadow-xs"
                        />
                    </div>

                    <main className="w-full rounded-3xl bg-white/95 backdrop-blur-md p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80 text-center">
                        <IoCheckmarkCircle className="text-6xl text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-black text-slate-800 mb-2">
                            {step === 'name' ? 'Account Created!' : 'Welcome Back!'}
                        </h2>
                        <p className="text-sm text-slate-600 mb-6 font-medium">
                            Ready to access verified groundwater experts and testing services. Redirecting...
                        </p>
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-t-transparent border-[#0A84FF] mx-auto"></div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-teal-50/30 px-4 py-8 overflow-y-auto overflow-x-hidden">
            {/* Ambient Blurred Background Accents */}
            <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
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
                            {supportedLanguages?.map((lang) => (
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
                {/* Logo & Subtitle */}
                <div className="mb-6 flex flex-col items-center text-center">
                    <div className="relative mb-3 flex items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 shadow-2xs">
                        <img
                            src={logo}
                            alt="Jaladhaara Logo"
                            className="h-20 sm:h-24 object-contain"
                        />
                    </div>
                    {step === "otp" ? (
                        <>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                                {t('verifyOtpTitle', 'Verify Mobile Number')}
                            </h1>
                            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                                {t('otpSubtitle', 'Enter the 6-digit code sent to your phone')}
                            </p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-1.5 justify-center">
                                <span>Welcome to Jaladhaara!</span>
                                <span className="text-blue-500">💧</span>
                            </h1>
                            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                                Quick details to complete your free customer profile
                            </p>
                        </>
                    )}
                </div>

                {/* Main Card */}
                <main className="w-full rounded-3xl bg-white/95 backdrop-blur-md p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80">
                    {step === "otp" ? (
                        <form className="space-y-4" onSubmit={handleVerifyOTP}>
                            {/* Mobile Badge Banner */}
                            <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200/80">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        OTP Sent To
                                    </p>
                                    <p className="text-sm font-extrabold text-slate-800 tracking-wide">
                                        +91 {phone}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const searchParams = new URLSearchParams(location.search);
                                        const redirectUrl = location.state?.redirectUrl || searchParams.get('redirect');
                                        navigate(`/userlogin${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`, {
                                            state: { phone, devOtp: location.state?.devOtp, redirectUrl }
                                        });
                                    }}
                                    className="text-xs font-bold text-[#0A84FF] hover:underline cursor-pointer"
                                >
                                    Edit
                                </button>
                            </div>

                            {/* OTP Input */}
                            <div className="space-y-1.5 pt-1">
                                <label className="block text-xs font-bold text-slate-700">
                                    6-Digit Verification Code <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <IoShieldCheckmarkOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-xl" />
                                    <input
                                        type="text"
                                        placeholder="• • • • • •"
                                        value={otp}
                                        autoComplete="one-time-code"
                                        inputMode="numeric"
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            setOtp(value);
                                        }}
                                        maxLength="6"
                                        className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-slate-800 text-xl font-black shadow-2xs focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 transition-all outline-none text-center tracking-[0.4em] placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-300"
                                        disabled={loading}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Development Helper Badge */}
                            {location.state?.devOtp && (
                                <div className="text-center pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setOtp(location.state.devOtp)}
                                        className="text-[11px] font-mono bg-amber-50 text-amber-800 px-3 py-1 rounded-lg border border-amber-200/80 hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
                                    >
                                        🛠️ Dev Mode: Fill OTP (<span className="font-bold">{location.state.devOtp}</span>)
                                    </button>
                                </div>
                            )}

                            {/* Resend OTP & Back */}
                            <div className="flex items-center justify-between text-xs px-1 pt-1">
                                {otpCountdown > 0 ? (
                                    <p className="text-slate-500 font-medium">
                                        Resend code in <span className="font-bold text-[#0A84FF]">{otpCountdown}s</span>
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendOTP}
                                        className="text-[#0A84FF] hover:underline font-bold transition-all cursor-pointer"
                                        disabled={loading}
                                    >
                                        Resend OTP
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const searchParams = new URLSearchParams(location.search);
                                        const redirectUrl = location.state?.redirectUrl || searchParams.get('redirect');
                                        navigate(`/userlogin${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`, {
                                            state: { phone, devOtp: location.state?.devOtp, redirectUrl }
                                        });
                                    }}
                                    className="text-slate-500 hover:text-[#0A84FF] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                >
                                    <IoArrowBackOutline className="text-sm" />
                                    <span>Back</span>
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full rounded-2xl bg-gradient-to-r from-[#0A84FF] via-blue-600 to-[#00C2A8] py-3.5 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2 cursor-pointer flex items-center justify-center gap-2"
                            >
                                <span>{loading ? "Verifying..." : "Verify & Continue"}</span>
                                {!loading && <span className="text-base font-bold">→</span>}
                            </button>
                        </form>
                    ) : (
                        /* Step 2: New User Name + Optional Email */
                        <form className="space-y-4" onSubmit={handleCompleteProfile}>
                            {/* Verified Phone Pill */}
                            <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/80 px-4 py-2.5 rounded-2xl">
                                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                                    <IoCheckmarkCircle className="text-emerald-600 text-base" />
                                    +91 {phone}
                                </span>
                                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200">
                                    Verified
                                </span>
                            </div>

                            {/* Full Name Input (Required) */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">
                                    Full Name <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <IoPersonOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />
                                    <input
                                        type="text"
                                        placeholder="e.g. Ramesh Patel"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-800 text-sm font-semibold shadow-2xs focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                        disabled={loading}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Email Input (Optional) */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Email Address
                                    </label>
                                    <span className="text-[11px] font-semibold text-slate-400">
                                        Optional
                                    </span>
                                </div>
                                <div className="relative">
                                    <IoMailOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />
                                    <input
                                        type="email"
                                        placeholder="e.g. ramesh@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-800 text-sm font-semibold shadow-2xs focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                        disabled={loading}
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 px-1 font-medium">
                                    Used for sending digital hydrogeology inspection reports & tax invoices.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 space-y-2">
                                <button
                                    type="submit"
                                    disabled={loading || !name.trim()}
                                    className="w-full rounded-2xl bg-gradient-to-r from-[#0A84FF] via-blue-600 to-[#00C2A8] py-3.5 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <IoSparklesOutline className="text-base" />
                                    <span>{loading ? "Creating Account..." : "Complete & Continue"}</span>
                                    {!loading && <span className="text-base font-bold">→</span>}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep("otp")}
                                    className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                >
                                    ← Back to OTP verification
                                </button>
                            </div>
                        </form>
                    )}
                </main>
            </div>
        </div>
    );
}
