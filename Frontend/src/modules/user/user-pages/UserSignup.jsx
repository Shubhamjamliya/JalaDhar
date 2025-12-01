import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendUserRegistrationOTP } from "../../../services/authApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";

export default function UserSignup() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSendOTP = async (e) => {
        e?.preventDefault();
        setLoading(true);

        // Validation
        if (
            !formData.name ||
            !formData.email ||
            !formData.phone ||
            !formData.password
        ) {
            toast.showError("Please fill in all fields");
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            toast.showError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.showError("Passwords do not match");
            setLoading(false);
            return;
        }

        const loadingToast = toast.showLoading("Sending OTP...");

        try {
            const response = await sendUserRegistrationOTP({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
            });

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("OTP sent successfully! Please check your email/phone.");
                
                // Small delay to show success message before navigation
                setTimeout(() => {
                    navigate("/user/verify-otp", {
                        state: {
                            registrationData: {
                                name: formData.name,
                                email: formData.email,
                                phone: formData.phone,
                                password: formData.password,
                            },
                            verificationToken: response.data.token,
                            email: formData.email,
                            otpSent: true,
                        },
                    });
                }, 800);
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
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#F3F7FA] p-4 py-6 overflow-y-auto">
            <div className="w-full max-w-sm">
                <div className="mt-4 mb-6 flex flex-col items-center">
                    <span className="material-symbols-outlined icon-gradient !text-5xl">
                        water_drop
                    </span>
                    <h1 className="mt-2 text-3xl font-bold tracking-tighter text-[#3A3A3A]">
                        JALADHAARA
                    </h1>
                    <p className="mt-3 text-sm text-[#6B7280] text-center">
                        Create your account to get started.
                    </p>
                </div>

                <main className="w-full rounded-xl bg-white p-6 shadow-lg">
                    <form className="space-y-4" onSubmit={handleSendOTP}>
                        <div className="flex justify-center mb-3">
                            <h2 className="button-white text-sm font-bold text-gradient px-3 py-1 rounded-full border-2 border-[#1A80E5]">
                                User Sign Up
                            </h2>
                        </div>

                        <div className="relative">
                            <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
                                person
                            </span>
                            <input
                                className="w-full rounded-full border-gray-200 bg-white py-2.5 pl-12 pr-4 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5] text-sm"
                                placeholder="Full Name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="relative">
                            <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
                                mail
                            </span>
                            <input
                                className="w-full rounded-full border-gray-200 bg-white py-2.5 pl-12 pr-4 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5] text-sm"
                                placeholder="Email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="relative">
                            <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
                                phone
                            </span>
                            <input
                                className="w-full rounded-full border-gray-200 bg-white py-2.5 pl-12 pr-4 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5] text-sm"
                                placeholder="Phone"
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="relative">
                            <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
                                lock
                            </span>
                            <input
                                className="w-full rounded-full border-gray-200 bg-white py-2.5 pl-12 pr-12 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5] text-sm"
                                placeholder="Password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                disabled={loading}
                                required
                            />
                            <button
                                type="button"
                                className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={loading}
                            >
                                <span className="material-symbols-outlined text-xl">
                                    {showPassword
                                        ? "visibility_off"
                                        : "visibility"}
                                </span>
                            </button>
                        </div>

                        <div className="relative">
                            <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
                                lock
                            </span>
                            <input
                                className="w-full rounded-full border-gray-200 bg-white py-2.5 pl-12 pr-12 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5] text-sm"
                                placeholder="Confirm Password"
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                disabled={loading}
                                required
                            />
                            <button
                                type="button"
                                className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                disabled={loading}
                            >
                                <span className="material-symbols-outlined text-xl">
                                    {showConfirmPassword
                                        ? "visibility_off"
                                        : "visibility"}
                                </span>
                            </button>
                        </div>

                        <button
                            className="button-gradient w-full rounded-full py-3 text-sm font-bold text-white shadow-[0_6px_15px_rgba(26,128,229,0.25)] transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Sending OTP..." : "Sign Up"}
                        </button>
                    </form>
                </main>

                <div className="mt-6 mb-4 text-center">
                    <p className="text-sm text-[#6B7280]">
                        Already have an account?{" "}
                        <Link
                            to="/userlogin"
                            className="font-semibold text-[#1A80E5] hover:text-blue-700"
                        >
                            Log In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
