import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function UserSignup() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleSignup = () => {
        navigate("/user/dashboard");
    };

    return (
        <div className="min-h-screen flex justify-center items-center bg-[#F6F7F9] px-5">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-10 mt-4">
                    <img
                        src="/src/assets/logo.png"
                        alt="Jaladhar"
                        className="w- mx-auto mb-2"
                    />
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
                    Create Account
                </h2>

                {/* Full Name */}
                <div className="mb-4">
                    <div className="w-full bg-white border border-[#D9DDE4] rounded-2xl px-3 py-3 shadow-[0px_2px_6px_rgba(0,0,0,0.05)]">
                        <p className="text-[14px] font-semibold text-[#4A4A4A]">
                            Full Name
                        </p>
                        <input
                            type="text"
                            placeholder="Enter your full name"
                            className="w-[95%] text-[14px] text-gray-600 mt-1 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Email */}
                <div className="mb-4">
                    <div className="w-full bg-white border border-[#D9DDE4] rounded-2xl px-3 py-3 shadow-[0px_2px_6px_rgba(0,0,0,0.05)]">
                        <p className="text-[14px] font-semibold text-[#4A4A4A]">
                            Email
                        </p>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="w-[95%] text-[14px] text-gray-600 mt-1 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Mobile No */}
                <div className="mb-4">
                    <div className="w-full bg-white border border-[#D9DDE4] rounded-2xl px-3 py-3 shadow-[0px_2px_6px_rgba(0,0,0,0.05)]">
                        <p className="text-[14px] font-semibold text-[#4A4A4A]">
                            Mobile No.
                        </p>
                        <input
                            type="number"
                            placeholder="Enter your mobile number"
                            className="w-[95%] text-[14px] text-gray-600 mt-1 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Password */}
                <div className="mb-4">
                    <div className="w-full bg-white border border-[#D9DDE4] rounded-2xl px-3 py-3 shadow-[0px_2px_6px_rgba(0,0,0,0.05)]">
                        <p className="text-[14px] font-semibold text-[#4A4A4A]">
                            Password
                        </p>

                        <div className="flex items-center mt-1">
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

                {/* Confirm Password */}
                <div className="mb-4">
                    <div className="w-full bg-white border border-[#D9DDE4] rounded-2xl px-3 py-3 shadow-[0px_2px_6px_rgba(0,0,0,0.05)]">
                        <p className="text-[14px] font-semibold text-[#4A4A4A]">
                            Confirm Password
                        </p>

                        <div className="flex items-center mt-1">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Re-enter your password"
                                className="w-[90%] text-[14px] text-gray-600 focus:outline-none"
                            />
                            <span
                                className="text-gray-500 text-sm cursor-pointer ml-2"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                            >
                                {showConfirmPassword ? "Hide" : "Show"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sign Up Button */}
                <button
                    onClick={handleSignup}
                    className="
                        w-72 mx-auto block     
                        bg-[#0A84FF] text-white 
                        font-semibold 
                        py-4 text-lg 
                        rounded-4xl shadow-md
                        active:bg-[#005BBB]
                    "
                >
                    Sign Up
                </button>

                {/* Login Link */}
                <p className="text-center text-sm mt-4 text-gray-700">
                    Already Registered?{" "}
                    <Link
                        to="/userlogin"
                        className="text-[#0A84FF] font-semibold underline"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
