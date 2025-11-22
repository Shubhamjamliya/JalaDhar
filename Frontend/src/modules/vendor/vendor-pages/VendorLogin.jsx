import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";

export default function VendorLogin() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { login } = useVendorAuth();

    const handleVendorLogin = async (e) => {
        e?.preventDefault();
        setError("");
        setLoading(true);

        // Basic validation
        if (!email || !password) {
            setError("Please fill in all fields");
            setLoading(false);
            return;
        }

        try {
            const result = await login({ email, password });
            
            if (result.success) {
                // Navigate to dashboard on success
                navigate("/vendor/dashboard");
            } else {
                setError(result.message || "Login failed. Please try again.");
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
            console.error("Login error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex justify-center items-center bg-[#F6F7F9] px-5">
            {/* Whole content */}
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-10 mt-4">
                    <img
                        src="/src/assets/logo.png"
                        alt="Jaladhar"
                        className="w- mx-auto mb-2"
                    />
                </div>

                {/* Welcome Text */}
                <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
                    Vendor Login
                </h2>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Email Input */}
                <div className="mb-4">
                    <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                            Email
                        </p>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full text-[14px] text-gray-600 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Password */}
                <div className="mb-4">
                    <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                            Password
                        </p>
                        <div className="flex items-center">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-[90%] text-[14px] text-gray-600 focus:outline-none"
                                disabled={loading}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleVendorLogin(e);
                                    }
                                }}
                            />
                            <span
                                className="text-gray-500 text-sm cursor-pointer ml-2"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Forgot Password */}
                <div className="text-right mb-5">
                    <Link
                        to="/vendor/forgot-password"
                        className="text-[#0A84FF] text-sm underline"
                    >
                        Forgot Password?
                    </Link>
                </div>

                {/* Login Button */}
                <button
                    onClick={handleVendorLogin}
                    disabled={loading || !email || !password}
                    className="w-full bg-[#0A84FF] text-white font-semibold py-4 text-lg rounded-[12px] shadow-[0px_4px_10px_rgba(0,0,0,0.05)] active:bg-[#005BBB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>

                {/* Signup Link */}
                <p className="text-center text-sm mt-4 text-gray-700">
                    Not Registered?{" "}
                    <Link
                        to="/vendorsignup"
                        className="text-[#0A84FF] font-semibold underline"
                    >
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
}
