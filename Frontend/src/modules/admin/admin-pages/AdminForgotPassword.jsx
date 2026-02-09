import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminForgotPassword } from "../../../services/adminApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import logo from "@/assets/Logo.png";

export default function AdminForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!email) {
            toast.showError("Please enter your email address");
            setLoading(false);
            return;
        }

        const loadingToast = toast.showLoading("Sending OTP...");

        try {
            const response = await adminForgotPassword({ email });
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess(response.message || "OTP sent to your email");
                setTimeout(() => {
                    navigate("/admin/reset-password", {
                        state: { email }
                    });
                }, 1000);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to send OTP");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex justify-center items-center bg-[#F6F7F9] px-5 py-8">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-10 mt-4">
                    <img
                        src={logo}
                        alt="Jaladhaara Logo"
                        className="h-32 w-auto mx-auto mb-2 object-contain"
                    />
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
                    Forgot Password
                </h2>

                {/* Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <p className="text-gray-600 text-sm mb-6 text-center">
                        Enter your email address and we'll send you an OTP to reset your password.
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Email */}
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
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#0A84FF] text-white font-semibold py-4 text-lg rounded-[12px] shadow-[0px_4px_10px_rgba(0,0,0,0.05)] active:bg-[#005BBB] transition-colors disabled:opacity-50"
                        >
                            {loading ? "Sending OTP..." : "Send OTP"}
                        </button>
                    </form>
                </div>

                {/* Back to Login */}
                <p className="text-center text-sm mt-4 text-gray-700">
                    Remember your password?{" "}
                    <Link
                        to="/adminlogin"
                        className="text-[#0A84FF] font-semibold underline"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}

