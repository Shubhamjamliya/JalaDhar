import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminForgotPassword } from "../../../services/adminApi";

export default function AdminForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        if (!email) {
            setError("Please enter your email address");
            setLoading(false);
            return;
        }

        try {
            const response = await adminForgotPassword({ email });
            if (response.success) {
                setSuccess(response.message || "OTP sent to your email");
                setTimeout(() => {
                    navigate("/admin/reset-password", {
                        state: { email }
                    });
                }, 1500);
            } else {
                setError(response.message || "Failed to send OTP");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
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
                        src="/src/assets/logo.png"
                        alt="Jaladhar"
                        className="w-auto mx-auto mb-2"
                    />
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
                    Forgot Password
                </h2>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-600">{success}</p>
                    </div>
                )}

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

