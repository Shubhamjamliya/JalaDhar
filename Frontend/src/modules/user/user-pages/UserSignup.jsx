import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

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
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();
    const { register } = useAuth();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSignup = async (e) => {
        e?.preventDefault();
        setError("");
        setSuccess("");
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
            const result = await register({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            });
            
            if (result.success) {
                setSuccess(result.message || "Registration successful! Please verify your email.");
                // Clear form
                setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    password: "",
                    confirmPassword: ""
                });
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    navigate("/userlogin");
                }, 2000);
            } else {
                setError(result.message || "Registration failed. Please try again.");
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
            console.error("Signup error:", err);
        } finally {
            setLoading(false);
        }
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

                {/* Full Name */}
                <div className="mb-4">
                    <div className="w-full bg-white border border-[#D9DDE4] rounded-2xl px-3 py-3 shadow-[0px_2px_6px_rgba(0,0,0,0.05)]">
                        <p className="text-[14px] font-semibold text-[#4A4A4A]">
                            Full Name
                        </p>
                        <input
                            type="text"
                            name="name"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-[95%] text-[14px] text-gray-600 mt-1 focus:outline-none"
                            disabled={loading}
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
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-[95%] text-[14px] text-gray-600 mt-1 focus:outline-none"
                            disabled={loading}
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
                            type="tel"
                            name="phone"
                            placeholder="Enter your mobile number"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-[95%] text-[14px] text-gray-600 mt-1 focus:outline-none"
                            disabled={loading}
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
                                name="password"
                                placeholder="Enter your password"
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
                    <div className="w-full bg-white border border-[#D9DDE4] rounded-2xl px-3 py-3 shadow-[0px_2px_6px_rgba(0,0,0,0.05)]">
                        <p className="text-[14px] font-semibold text-[#4A4A4A]">
                            Confirm Password
                        </p>

                        <div className="flex items-center mt-1">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                placeholder="Re-enter your password"
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
                    onClick={handleSignup}
                    disabled={loading}
                    className="
                        w-72 mx-auto block     
                        bg-[#0A84FF] text-white 
                        font-semibold 
                        py-4 text-lg 
                        rounded-4xl shadow-md
                        active:bg-[#005BBB]
                        disabled:opacity-50 disabled:cursor-not-allowed
                    "
                >
                    {loading ? "Signing up..." : "Sign Up"}
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
