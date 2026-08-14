import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    IoMailOutline,
    IoLockClosedOutline,
    IoEyeOutline,
    IoEyeOffOutline,
    IoShieldCheckmarkOutline
} from "react-icons/io5";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import { useToast } from "../../../hooks/useToast";
import PolicyModal from "../../shared/components/PolicyModal";

import logo from "@/assets/AppLogo.png";

export default function VendorLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const navigate = useNavigate();
    const { login } = useVendorAuth();
    const toast = useToast();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleVendorLogin = async (e) => {
        e?.preventDefault();
        setLoading(true);

        // Basic validation
        if (!email || !password) {
            toast.showError("Please fill in all fields");
            setLoading(false);
            return;
        }

        const loadingToast = toast.showLoading("Logging in...");

        try {
            const result = await login({ email, password });

            if (result.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Login successful! Redirecting...");
                setTimeout(() => {
                    navigate("/vendor/dashboard");
                }, 500);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(result.message || "Login failed. Please try again.");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            toast.showError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-teal-50/30 px-4 py-8 overflow-y-auto">
            {/* Ambient Blurred Background Accents */}
            <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute bottom-10 right-10 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl" />

            <div className="relative z-10 w-full max-w-md">
                {/* Main Card Container */}
                <div className="w-full rounded-3xl bg-white/95 backdrop-blur-md p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80">
                    {/* Header / Logo */}
                    <div className="mb-6 flex flex-col items-center text-center">
                        <div className="relative mb-3 flex items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 shadow-2xs">
                            <img
                                src={logo}
                                alt="Jaladhaara Logo"
                                className="h-20 sm:h-24 object-contain"
                            />
                        </div>
                        <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-500">
                            Welcome back! Please login to your account.
                        </p>
                    </div>

                    {/* Form */}
                    <form className="space-y-4" onSubmit={handleVendorLogin}>
                        {/* Badge Pill */}
                        <div className="flex justify-center mb-2">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-[#0A84FF] text-xs font-extrabold border border-blue-200/80 tracking-wide shadow-2xs">
                                <IoShieldCheckmarkOutline className="text-sm" />
                                Expert Login
                            </span>
                        </div>

                        {/* Email / Phone Input */}
                        <div className="relative">
                            <IoMailOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />
                            <input
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-800 text-sm font-medium shadow-2xs focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                placeholder="Email or Phone"
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                autoComplete="off"
                                required
                                autoFocus
                            />
                        </div>

                        {/* Password Input */}
                        <div className="relative">
                            <IoLockClosedOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />
                            <input
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-11 text-slate-800 text-sm font-medium shadow-2xs focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                placeholder="Password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                autoComplete="new-password"
                                required
                                onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                        handleVendorLogin(e);
                                    }
                                }}
                            />
                            <button
                                type="button"
                                className="absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={loading}
                                title={showPassword ? "Hide Password" : "Show Password"}
                            >
                                {showPassword ? <IoEyeOffOutline className="text-lg" /> : <IoEyeOutline className="text-lg" />}
                            </button>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="text-right pt-0.5">
                            <Link
                                to="/vendor/forgot-password"
                                className="text-xs font-extrabold text-[#0A84FF] hover:text-blue-700 transition-colors"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            className="w-full rounded-2xl bg-gradient-to-r from-[#0A84FF] via-blue-600 to-[#00C2A8] py-3.5 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 mt-2"
                            type="submit"
                            disabled={loading}
                        >
                            <span>{loading ? "Logging in..." : "Login"}</span>
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
                            Don't have an account?{" "}
                            <Link
                                to="/vendorsignup"
                                className="font-extrabold text-[#0A84FF] hover:text-blue-700 hover:underline transition-colors"
                            >
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {showTermsModal && (
                <PolicyModal type="general" onClose={() => setShowTermsModal(false)} />
            )}
        </div>
    );
}
