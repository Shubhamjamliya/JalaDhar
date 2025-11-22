import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendUserRegistrationOTP } from "../../../services/authApi";

export default function UserSignup() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSendOTP = async (e) => {
        e?.preventDefault();
        setError("");
        setLoading(true);

        // Validation
        if (!formData.name || !formData.email || !formData.phone || !formData.password) {
            setError("Please fill in all fields");
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            console.log("Sending OTP request:", { name: formData.name, email: formData.email, phone: formData.phone });
            const response = await sendUserRegistrationOTP({
                name: formData.name,
                email: formData.email,
                phone: formData.phone
            });
            console.log("OTP response:", response);

            if (response.success) {
                // Navigate to OTP verification page with registration data
                navigate("/user/verify-otp", {
                    state: {
                        registrationData: {
                            name: formData.name,
                            email: formData.email,
                            phone: formData.phone,
                            password: formData.password
                        },
                        verificationToken: response.data.token,
                        email: formData.email,
                        otpSent: true
                    }
                });
            } else {
                setError(response.message || "Failed to send OTP");
            }
        } catch (err) {
            console.error("Send OTP error:", err);
            console.error("Error details:", {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            setError(err.response?.data?.message || err.message || "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
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

                {/* Title */}
                <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
                    Create Account
                </h2>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSendOTP}>
                    {/* Full Name */}
                <div className="mb-4">
                    <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                            Full Name
                        </p>
                        <input
                            type="text"
                            name="name"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full text-[14px] text-gray-600 focus:outline-none"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Email */}
                <div className="mb-4">
                    <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                            Email
                        </p>
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full text-[14px] text-gray-600 focus:outline-none"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Mobile */}
                <div className="mb-4">
                    <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                            Mobile
                        </p>
                        <input
                            type="tel"
                            name="phone"
                            placeholder="Enter your mobile number"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full text-[14px] text-gray-600 focus:outline-none"
                            disabled={loading}
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
                                name="password"
                                placeholder="Create password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-[90%] text-[14px] text-gray-600 focus:outline-none"
                                disabled={loading}
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
                                name="confirmPassword"
                                placeholder="Re-enter password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className="w-[90%] text-[14px] text-gray-600 focus:outline-none"
                                disabled={loading}
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
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0A84FF] text-white font-semibold py-4 text-lg rounded-[12px] shadow-[0px_4px_10px_rgba(0,0,0,0.05)] active:bg-[#005BBB] transition-colors disabled:opacity-50"
                    >
                        {loading ? "Sending OTP..." : "Send OTP"}
                    </button>
                </form>

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
