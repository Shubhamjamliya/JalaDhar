import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../hooks/useToast";

import logo from "@/assets/AppLogo.png";

export default function UserLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();
    const toast = useToast();

    const handleLogin = async (e) => {
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
                // Small delay to show success message
                setTimeout(() => {
                    navigate("/user/dashboard");
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
        <div className="relative flex h-screen w-full flex-col items-center justify-center bg-[#F3F7FA] p-6">
            <div className="w-full max-w-sm">
                <div className="mb-8 flex flex-col items-center">
                    <img
                        src={logo}
                        alt="Jaladhaara Logo"
                        className="h-32 object-contain mb-4"
                    />
                    <p className="mt-4 text-[#6B7280] text-center">
                        Welcome back! Please login to your account.
                    </p>
                </div>

                <form className="space-y-6 " onSubmit={handleLogin}>
                    <div className="flex justify-center mb-4">
                        <h2 className="button-white text-sm font-bold text-gradient px-3 py-1 rounded-full border-2 border-[#1A80E5]">
                            User Login
                        </h2>
                    </div>
                    <div className="relative">
                        <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
                            mail
                        </span>
                        <input
                            className="w-full rounded-full border-gray-200 bg-white py-3 pl-12 pr-4 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5]"
                            placeholder="Email or Phone"
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="relative">
                        <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
                            lock
                        </span>
                        <input
                            className="w-full rounded-full border-gray-200 bg-white py-3 pl-12 pr-12 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5]"
                            placeholder="Password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    handleLogin(e);
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={loading}
                        >
                            <span className="material-symbols-outlined text-xl">
                                {showPassword ? "visibility_off" : "visibility"}
                            </span>
                        </button>
                    </div>

                    <div className="text-right">
                        <Link
                            to="/user/forgot-password"
                            className="text-sm font-medium text-[#1A80E5] hover:text-blue-700"
                        >
                            Forgot Password?
                        </Link>
                    </div>

                    <button
                        className="button-gradient w-full rounded-full py-3.5 text-base font-bold text-white shadow-[0_6px_15px_rgba(26,128,229,0.25)] transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-[#6B7280]">
                        Don't have an account?{" "}
                        <Link
                            to="/usersignup"
                            className="font-semibold text-[#1A80E5] hover:text-blue-700"
                        >
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
