import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { vendorForgotPassword, vendorVerifyResetOTP } from "../../../services/vendorAuthApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import { IoMailOutline, IoShieldCheckmarkOutline, IoArrowBackOutline } from "react-icons/io5";
import logo from "@/assets/AppLogo.png";

export default function VendorForgotPassword() {
    const [identifier, setIdentifier] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState(1); // 1 = Send OTP, 2 = Verify OTP
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    // Step 1: Send OTP
    const handleSendOTP = async (e) => {
        e?.preventDefault();

        if (!identifier.trim()) {
            toast.showError("Please enter your mobile number or email address");
            return;
        }

        setLoading(true);
        const loadingToast = toast.showLoading("Sending OTP...");

        try {
            const response = await vendorForgotPassword({ email: identifier.trim() });
            toast.dismissToast(loadingToast);

            if (response.success) {
                toast.showSuccess(response.message || "OTP sent successfully!");
                setStep(2);
            } else {
                toast.showError(response.message || "Failed to send OTP");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP on the same page
    const handleVerifyOTP = async (e) => {
        e?.preventDefault();

        if (!otp || otp.length !== 6) {
            toast.showError("Please enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);
        const loadingToast = toast.showLoading("Verifying OTP...");

        try {
            const response = await vendorVerifyResetOTP({
                email: identifier.trim(),
                otp: otp.trim()
            });
            toast.dismissToast(loadingToast);

            if (response.success) {
                toast.showSuccess("OTP verified! Set your new password.");
                setTimeout(() => {
                    navigate("/vendor/reset-password", {
                        state: { email: identifier.trim(), otp: otp.trim() }
                    });
                }, 500);
            } else {
                toast.showError(response.message || "Invalid OTP. Please try again.");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "OTP verification failed. Please check the code.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-teal-50/30 px-4 py-8">
            <div className="w-full max-w-md">
                {/* Main Card */}
                <div className="w-full rounded-3xl bg-white/95 backdrop-blur-md p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80">
                    {/* Logo Header */}
                    <div className="mb-6 flex flex-col items-center text-center">
                        <div className="relative mb-3 flex items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 shadow-2xs">
                            <img
                                src={logo}
                                alt="Jaladhaara Logo"
                                className="h-20 sm:h-24 object-contain"
                            />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                            Expert Forgot Password
                        </h2>
                    </div>

                    {step === 1 ? (
                        /* STEP 1: Enter Mobile / Email */
                        <form onSubmit={handleSendOTP} className="space-y-4">
                            <p className="text-slate-600 text-sm mb-4 text-center leading-relaxed">
                                Enter your registered mobile number or email address to receive an OTP.
                            </p>

                            <div className="relative">
                                <IoMailOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />
                                <input
                                    type="text"
                                    placeholder="Mobile Number or Email"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-[#0A84FF] focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 px-4 bg-[#0A84FF] hover:bg-[#0070E0] active:bg-[#005BBB] text-white font-semibold text-base rounded-2xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Sending OTP..." : "Send OTP"}
                            </button>
                        </form>
                    ) : (
                        /* STEP 2: Enter & Verify OTP */
                        <form onSubmit={handleVerifyOTP} className="space-y-5">
                            <div className="text-center">
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-[#0A84FF] text-xs font-extrabold border border-blue-200/80 mb-2">
                                    <IoShieldCheckmarkOutline className="text-sm" />
                                    OTP Verification
                                </span>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Enter the 6-digit OTP sent to <span className="font-bold text-slate-800">{identifier}</span>
                                </p>
                            </div>

                            {/* Styled 6-Digit Input */}
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider text-center">
                                    Enter 6-Digit OTP Code
                                </label>
                                <input
                                    type="text"
                                    placeholder="••••••"
                                    value={otp}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtp(val);
                                    }}
                                    maxLength="6"
                                    className="w-full py-3.5 px-4 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:border-[#0A84FF] focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:tracking-normal placeholder:text-slate-300"
                                    disabled={loading}
                                    autoFocus
                                    required
                                />
                            </div>

                            {/* Verify Button */}
                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full py-3.5 px-4 bg-[#0A84FF] hover:bg-[#0070E0] active:bg-[#005BBB] text-white font-semibold text-base rounded-2xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Verifying..." : "Verify OTP"}
                            </button>

                            {/* Resend / Change Number Controls */}
                            <div className="flex items-center justify-between text-xs pt-2 text-slate-500 font-medium">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep(1);
                                        setOtp("");
                                    }}
                                    className="flex items-center gap-1 text-slate-600 hover:text-[#0A84FF] transition-colors"
                                >
                                    <IoArrowBackOutline /> Change Mobile / Email
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSendOTP}
                                    disabled={loading}
                                    className="text-[#0A84FF] font-semibold hover:underline"
                                >
                                    Resend OTP
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Back to Login */}
                <p className="text-center text-sm mt-6 text-slate-600">
                    Remember your password?{" "}
                    <Link
                        to="/vendorlogin"
                        className="text-[#0A84FF] font-semibold hover:underline"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
