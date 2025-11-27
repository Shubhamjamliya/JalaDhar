import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { adminResetPassword } from "../../../services/adminApi";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";

export default function AdminResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const [email] = useState(location.state?.email || "");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (!email) {
            navigate("/admin/forgot-password");
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!otp || otp.length !== 6) {
            toast.showError("Please enter a valid 6-digit OTP");
            setLoading(false);
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            toast.showError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.showError("Passwords do not match");
            setLoading(false);
            return;
        }

        const loadingToast = toast.showLoading("Resetting password...");

        try {
            const response = await adminResetPassword({
                email,
                otp,
                newPassword
            });
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Password reset successful! Redirecting to login...");
                setSuccess(true);
                setTimeout(() => {
                    navigate("/adminlogin", {
                        state: { message: "Password reset successful! Please login with your new password." }
                    });
                }, 2000);
            } else {
                toast.dismissToast(loadingToast);
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
            <div className="min-h-screen flex justify-center items-center bg-[#F6F7F9] px-5 py-8">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-10 mt-4">
                        <img
                            src="/src/assets/logo.png"
                            alt="Jaladhar"
                            className="w-auto mx-auto mb-2"
                        />
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                        <IoCheckmarkCircleOutline className="text-6xl text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Password Reset Successful!
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Your password has been reset successfully. You will be redirected to login page shortly.
                        </p>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A84FF] mx-auto"></div>
                    </div>
                </div>
            </div>
        );
    }

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
                    Reset Password
                </h2>

                {/* Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <p className="text-gray-600 text-sm mb-6 text-center">
                        Enter the OTP sent to <span className="font-semibold">{email}</span> and your new password.
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* OTP */}
                        <div className="mb-4">
                            <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                                <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                                    Enter OTP
                                </p>
                                <input
                                    type="text"
                                    placeholder="------"
                                    value={otp}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtp(value);
                                    }}
                                    maxLength="6"
                                    className="w-full text-[14px] text-gray-600 focus:outline-none text-center text-xl tracking-widest"
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="mb-4">
                            <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                                <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                                    New Password
                                </p>
                                <div className="flex items-center">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-[90%] text-[14px] text-gray-600 focus:outline-none"
                                        disabled={loading}
                                        required
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
                            <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                                <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                                    Confirm Password
                                </p>
                                <div className="flex items-center">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Re-enter new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-[90%] text-[14px] text-gray-600 focus:outline-none"
                                        disabled={loading}
                                        required
                                    />
                                    <span
                                        className="text-gray-500 text-sm cursor-pointer ml-2"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? "Hide" : "Show"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full bg-[#0A84FF] text-white font-semibold py-4 text-lg rounded-[12px] shadow-[0px_4px_10px_rgba(0,0,0,0.05)] active:bg-[#005BBB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                </div>

                {/* Back to Login */}
                <p className="text-center text-sm mt-4 text-gray-700">
                    <Link
                        to="/adminlogin"
                        className="text-[#0A84FF] font-semibold underline"
                    >
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
}

