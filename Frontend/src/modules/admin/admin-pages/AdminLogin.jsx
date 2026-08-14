import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    IoMailOutline,
    IoLockClosedOutline
} from "react-icons/io5";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import { useToast } from "../../../hooks/useToast";

import logo from "@/assets/AppLogo.png";

export default function AdminLogin() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAdminAuth();
    const toast = useToast();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleAdminLogin = async (e) => {
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
                    navigate("/admin/dashboard");
                }, 500);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(result.message || "Login failed. Please try again.");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            toast.showError("An unexpected error occurred. Please try again.");
            console.error("Login error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-teal-50/30 px-4 py-8 overflow-y-auto">
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
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                            Admin Login
                        </h2>
                    </div>

                    <form className="space-y-4" onSubmit={handleAdminLogin}>
                        {/* Email Input */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                                Email
                            </label>
                            <div className="relative">
                                <IoMailOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-800 text-sm font-medium shadow-2xs focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                    disabled={loading}
                                    autoComplete="off"
                                    required
                                    autoFocus
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAdminLogin(e);
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5 ml-1">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Password
                                </label>
                                <Link
                                    to="/admin/forgot-password"
                                    className="text-xs font-bold text-[#0A84FF] hover:underline"
                                >
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative">
                                <IoLockClosedOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-16 text-slate-800 text-sm font-medium shadow-2xs focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                    disabled={loading}
                                    autoComplete="new-password"
                                    required
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAdminLogin(e);
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    className="absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-extrabold text-[#0A84FF] hover:text-blue-700 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100/80 transition-colors cursor-pointer select-none"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={loading}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="text-right pt-0.5">
                            <Link
                                to="/admin/forgot-password"
                                className="text-xs font-extrabold text-[#0A84FF] hover:text-blue-700 underline transition-colors"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            onClick={handleAdminLogin}
                            disabled={loading || !email || !password}
                            className="w-full rounded-2xl bg-gradient-to-r from-[#0A84FF] via-blue-600 to-[#00C2A8] py-3.5 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 mt-2"
                        >
                            <span>{loading ? "Logging in..." : "Login"}</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
