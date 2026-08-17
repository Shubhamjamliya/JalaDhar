import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
    IoShieldCheckmarkOutline,
    IoArrowBackOutline,
    IoCheckmarkCircle
} from "react-icons/io5";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { sendUserRegistrationOTP } from "../../../services/authApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";

import logo from "@/assets/AppLogo.png";

export default function UserOTPVerification() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const { register } = useAuth();

    // Get registration data from location state
    const registrationData = location.state?.registrationData;
    const initialVerificationToken = location.state?.verificationToken;
    const [currentVerificationToken, setCurrentVerificationToken] = useState(() => initialVerificationToken);
    const phone = location.state?.phone;
    const email = location.state?.email;

    const [otp, setOtp] = useState("");
    const [otpCountdown, setOtpCountdown] = useState(() => location.state?.cooldownRemaining ?? 60);
    const [loading, setLoading] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const toast = useToast();

    useEffect(() => {
        window.scrollTo(0, 0);
        // Redirect if no registration data or token
        if (!registrationData || !currentVerificationToken) {
            navigate("/usersignup");
            return;
        }
    }, [navigate, registrationData, currentVerificationToken]);

    useEffect(() => {
        let timer;
        if (otpCountdown > 0) {
            timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [otpCountdown]);

    const handleResendOTP = async () => {
        setLoading(true);
        const loadingToast = toast.showLoading("Resending OTP...");
        try {
            const response = await sendUserRegistrationOTP({
                name: registrationData.name,
                phone: registrationData.phone,
                email: registrationData.email,
                preferredLanguage: registrationData.preferredLanguage
            });
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("New OTP sent successfully!");
                setOtpCountdown(60);
                if (response.data?.otp) {
                    setOtp(response.data.otp);
                }
                if (response.data?.token) {
                    setCurrentVerificationToken(response.data.token);
                }
                // Update location state with new token
                window.history.replaceState(
                    { ...location.state, verificationToken: response.data.token },
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

    const handleVerifyOTP = async (e) => {
        e?.preventDefault();

        if (!otp || otp.length !== 6) {
            toast.showError("Please enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);
        const loadingToast = toast.showLoading("Verifying OTP...");

        try {
            const result = await register({
                name: registrationData.name,
                phone: registrationData.phone,
                email: registrationData.email,
                preferredLanguage: registrationData.preferredLanguage,
                otp: otp,
                token: currentVerificationToken
            });

            if (result.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess(result.message || "Account created successfully! Redirecting to login...");
                setRegistrationSuccess(true);
                setTimeout(() => {
                    navigate("/userlogin", {
                        state: {
                            message: "Account created successfully! Please log in to continue."
                        }
                    });
                }, 1800);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(result.message || "Verification failed. Please try again.");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (registrationSuccess) {
        return (
            <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#F3F7FA] px-4 py-8 overflow-y-auto overflow-x-hidden">
                <div className="w-full max-w-md flex flex-col items-center">
                    <div className="mb-6 flex flex-col items-center text-center">
                        <img
                            src={logo}
                            alt="Jaladhaara Logo"
                            className="h-28 sm:h-32 object-contain mb-2 drop-shadow-xs"
                        />
                    </div>

                    <main className="w-full rounded-3xl bg-white p-8 shadow-xl border border-gray-100/80 text-center">
                        <IoCheckmarkCircle className="text-6xl text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-extrabold text-gray-800 mb-2">
                            Account Created!
                        </h2>
                        <p className="text-sm text-gray-600 mb-6">
                            Your account has been created successfully. Redirecting you to login...
                        </p>
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-t-transparent border-[#0A84FF] mx-auto"></div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#F3F7FA] px-4 py-8 overflow-y-auto overflow-x-hidden">
            <div className="w-full max-w-md flex flex-col items-center">
                {/* Logo & Header */}
                <div className="mb-6 flex flex-col items-center text-center">
                    <img
                        src={logo}
                        alt="Jaladhaara Logo"
                        className="h-28 sm:h-32 object-contain mb-2 drop-shadow-xs"
                    />
                    <p className="text-sm font-semibold text-gray-600 mt-1">
                        Enter the OTP sent to complete your account setup.
                    </p>
                </div>

                {/* Main Form Card */}
                <main className="w-full rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-gray-100/80">
                    <form className="space-y-4" onSubmit={handleVerifyOTP}>
                        {/* Pill Tag */}
                        <div className="flex justify-center mb-2">
                            <span className="text-xs font-bold text-[#0A84FF] bg-blue-50 px-4 py-1.5 rounded-full border border-blue-200/80 shadow-2xs">
                                {t('verifyMobileOtp', 'Verify Mobile OTP')}
                            </span>
                        </div>

                        {/* Recipient Details Banner */}
                        <div className="text-center bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                            <p className="text-xs font-semibold text-gray-500 mb-1">
                                {t('verificationOtpSentTo', 'Verification OTP sent to')}
                            </p>
                            <p className="text-sm font-extrabold text-gray-800 tracking-wide">
                                +91 {phone}
                            </p>
                            {email && (
                                <p className="text-xs font-medium text-gray-500 mt-0.5">
                                    {email}
                                </p>
                            )}
                        </div>

                        {/* OTP Input */}
                        <div className="relative pt-2">
                            <IoShieldCheckmarkOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 text-xl" />
                            <input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                value={otp}
                                autoComplete="one-time-code"
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setOtp(value);
                                }}
                                maxLength="6"
                                className="w-full rounded-full border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-gray-800 text-lg font-bold shadow-2xs focus:border-[#0A84FF] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-center tracking-widest"
                                disabled={loading}
                                autoFocus
                            />
                        </div>

                        {/* Development Helper Badge */}
                        {location.state?.devOtp && (
                            <div className="text-center pt-1">
                                <button
                                    type="button"
                                    onClick={() => setOtp(location.state.devOtp)}
                                    className="text-[11px] font-mono bg-amber-50 text-amber-800 px-3 py-1 rounded-lg border border-amber-200/80 hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
                                >
                                    🛠️ Dev Mode: Click to fill test OTP (<span className="font-bold">{location.state.devOtp}</span>)
                                </button>
                            </div>
                        )}

                        {/* Resend OTP / Back Links */}
                        <div className="flex items-center justify-between text-xs px-2 pt-1">
                            {otpCountdown > 0 ? (
                                <p className="text-gray-500 font-medium">{t('resendIn', 'Resend in')} <span className="font-bold text-[#0A84FF]">{otpCountdown}s</span></p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    className="text-[#0A84FF] hover:underline font-bold transition-all cursor-pointer"
                                    disabled={loading}
                                >
                                    {t('resendOtp', 'Resend OTP')}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => navigate("/usersignup", { state: registrationData })}
                                className="text-gray-500 hover:text-[#0A84FF] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                                <IoArrowBackOutline className="text-sm" />
                                {t('editDetails', 'Edit Details')}
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full rounded-full bg-gradient-to-r from-[#0A84FF] via-blue-600 to-[#00C2A8] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
                        >
                            {loading ? "Verifying..." : t('verifyAndCreateAccount', 'Verify & Create Account')}
                        </button>
                    </form>
                </main>

                {/* Footer Link */}
                <div className="mt-6 text-center">
                    <p className="text-sm font-medium text-gray-500">
                        Already have an account?{" "}
                        <Link
                            to="/userlogin"
                            className="font-bold text-[#0A84FF] hover:text-blue-700 hover:underline transition-all"
                        >
                            Log In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
