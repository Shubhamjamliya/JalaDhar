import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function UserLogin() {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate("/user/dashboard");
    };

    return (
        <div className="min-h-screen flex justify-center items-center bg-[#F6F7F9] px-5 py-8">
            <div className="w-full max-w-sm">
                {/* Logo - Centered */}
                <div className="text-center mb-10 mt-4">
                    <img
                        src="/src/assets/logo.png"
                        alt="Jaladhar"
                        className="w-auto mx-auto mb-2"
                    />
                </div>

                {/* Welcome Text */}
                <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
                    Welcome Back!
                </h2>

                {/* Email Input */}
                <div className="mb-4">
                    <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                            Email
                        </p>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="w-full text-[14px] text-gray-600 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Password Input */}
                <div className="mb-4">
                    <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                            Password
                        </p>
                        <div className="flex items-center">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="w-[90%] text-[14px] text-gray-600 focus:outline-none"
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
                        to="/forgot-password"
                        className="text-[#0A84FF] text-sm underline"
                    >
                        Forgot Password?
                    </Link>
                </div>

                {/* Login Button */}
                <button
                    onClick={handleLogin}
                    className="w-full bg-[#0A84FF] text-white font-semibold py-4 text-lg rounded-[12px] shadow-[0px_4px_10px_rgba(0,0,0,0.05)] active:bg-[#005BBB] transition-colors"
                >
                    Login
                </button>

                {/* Signup Link */}
                <p className="text-center text-sm mt-4 text-gray-700">
                    Not Registered?{" "}
                    <Link
                        to="/usersignup"
                        className="text-[#0A84FF] font-semibold underline"
                    >
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
}
