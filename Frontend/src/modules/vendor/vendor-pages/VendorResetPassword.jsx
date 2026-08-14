import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { vendorResetPassword } from "../../../services/vendorAuthApi";
import { IoCheckmarkCircleOutline, IoLockClosedOutline, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import logo from "@/assets/AppLogo.png";

export default function VendorResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const [identifier, setIdentifier] = useState(location.state?.email || "");
    const [otp, setOtp] = useState(location.state?.otp || "");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (!identifier) {
            navigate("/vendor/forgot-password");
        }
    }, [identifier, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            toast.showError("Please enter a valid 6-digit OTP");
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            toast.showError("Password must be at least 6 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.showError("Passwords do not match");
            return;
        }

        setLoading(true);
        const loadingToast = toast.showLoading("Resetting password...");

        try {
            const response = await vendorResetPassword({
                email: identifier,
                otp: otp,
                newPassword: newPassword
            });

            toast.dismissToast(loadingToast);

            if (response.success) {
                toast.showSuccess("Password reset successful!");
                setSuccess(true);
                setTimeout(() => {
                    navigate("/vendorlogin", {
                        state: { message: "Password reset successful! Please login with your new password." }
                    });
                }, 2000);
            } else {
                toast.showError(response.message || "Password reset failed");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Password reset failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-teal-50/30 px-4 py-8">
                <div className="w-full max-w-md">
                    <div className="w-full rounded-3xl bg-white/95 backdrop-blur-md p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80 text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-2xs">
                            <IoCheckmarkCircleOutline className="text-4xl" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">
                            Password Reset Successful!
                        </h2>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Your password has been reset successfully. Redirecting to Expert Login...
                        </p>
                        <div className="pt-4 flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#0A84FF] border-t-transparent"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-teal-50/30 px-4 py-8">
            <div className="w-full max-w-md">
                {/* Main Card */}
                <div className="w-full rounded-3xl bg-white/95 backdrop-blur-md p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80">
                    {/* Header Logo */}
                    <div className="mb-6 flex flex-col items-center text-center">
                        <div className="relative mb-3 flex items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 shadow-2xs">
                            <img
                                src={logo}
                                alt="Jaladhaara Logo"
                                className="h-20 sm:h-24 object-contain"
                            />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                            Reset Password
                        </h2>
                        <p className="text-slate-500 text-xs sm:text-sm mt-1">
                            Set a new password for <span className="font-semibold text-slate-700">{identifier}</span>
                        </p>
                    </div>

                    {/* Reset Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* New Password Input */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                New Password
                            </label>
                            <div className="relative">
                                <IoLockClosedOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-[#0A84FF] focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    disabled={loading}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg focus:outline-none"
                                >
                                    {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <IoLockClosedOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-[#0A84FF] focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    disabled={loading}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg focus:outline-none"
                                >
                                    {showConfirmPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !newPassword || !confirmPassword}
                            className="w-full py-3.5 px-4 bg-[#0A84FF] hover:bg-[#0070E0] active:bg-[#005BBB] text-white font-semibold text-base rounded-2xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                </div>

                {/* Back to Login */}
                <p className="text-center text-sm mt-6 text-slate-600">
                    <Link
                        to="/vendorlogin"
                        className="text-[#0A84FF] font-semibold hover:underline"
                    >
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
