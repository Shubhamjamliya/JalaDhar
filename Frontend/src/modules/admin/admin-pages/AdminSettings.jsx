import { useState, useEffect } from "react";
import {
    IoSettingsOutline,
    IoLockClosedOutline,
    IoPersonAddOutline,
    IoMailOutline,
    IoKeyOutline,
    IoCheckmarkCircleOutline,
    IoCloseOutline,
} from "react-icons/io5";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import { sendAdminRegistrationOTP, registerAdminWithOTP } from "../../../services/adminApi";
import ErrorMessage from "../../shared/components/ErrorMessage";
import SuccessMessage from "../../shared/components/SuccessMessage";

export default function AdminSettings() {
    const { admin } = useAdminAuth();
    const [activeTab, setActiveTab] = useState("general");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Admin Registration State
    const [registrationStep, setRegistrationStep] = useState(1); // 1: Enter details, 2: Verify OTP
    const [registrationData, setRegistrationData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [otpData, setOtpData] = useState({
        otp: "",
        token: "",
        email: "",
    });
    const [otpSent, setOtpSent] = useState(false);
    const [otpCountdown, setOtpCountdown] = useState(0);

    const settingsTabs = [
        { id: "general", label: "General", icon: IoSettingsOutline },
        { id: "security", label: "Security", icon: IoLockClosedOutline },
        { id: "register", label: "Register Admin", icon: IoPersonAddOutline },
    ];

    // Countdown timer for OTP resend
    useEffect(() => {
        if (otpCountdown > 0) {
            const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [otpCountdown]);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Validation
        if (!registrationData.name || !registrationData.email || !registrationData.password) {
            setError("Please fill in all fields");
            return;
        }

        if (registrationData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (registrationData.password !== registrationData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            setLoading(true);
            const response = await sendAdminRegistrationOTP({
                email: registrationData.email,
                name: registrationData.name,
            });

            if (response.success) {
                setOtpData({
                    token: response.data.token,
                    email: response.data.email,
                    otp: "",
                });
                setOtpSent(true);
                setRegistrationStep(2);
                setOtpCountdown(60); // 60 seconds countdown
                setSuccess("OTP sent to email successfully!");
            } else {
                setError(response.message || "Failed to send OTP");
            }
        } catch (err) {
            console.error("Send OTP error:", err);
            setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (otpCountdown > 0) return;

        setError("");
        try {
            setLoading(true);
            const response = await sendAdminRegistrationOTP({
                email: registrationData.email,
                name: registrationData.name,
            });

            if (response.success) {
                setOtpData({
                    token: response.data.token,
                    email: response.data.email,
                    otp: "",
                });
                setOtpCountdown(60);
                setSuccess("OTP resent successfully!");
            } else {
                setError(response.message || "Failed to resend OTP");
            }
        } catch (err) {
            console.error("Resend OTP error:", err);
            setError(err.response?.data?.message || "Failed to resend OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterAdmin = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!otpData.otp || otpData.otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP");
            return;
        }

        try {
            setLoading(true);
            const response = await registerAdminWithOTP({
                name: registrationData.name,
                email: registrationData.email,
                password: registrationData.password,
                otp: otpData.otp,
                token: otpData.token,
            });

            if (response.success) {
                setSuccess("Admin registered successfully!");
                // Reset form
                setRegistrationStep(1);
                setRegistrationData({
                    name: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                });
                setOtpData({
                    otp: "",
                    token: "",
                    email: "",
                });
                setOtpSent(false);
            } else {
                setError(response.message || "Failed to register admin");
            }
        } catch (err) {
            console.error("Register admin error:", err);
            setError(err.response?.data?.message || "Failed to register admin. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleBackToForm = () => {
        setRegistrationStep(1);
        setOtpData({ ...otpData, otp: "" });
    };

    return (
        <div className="min-h-[calc(100vh-5rem)]">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
                <p className="text-gray-600">Manage your admin panel preferences and configurations</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Settings Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <nav className="space-y-2">
                            {settingsTabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setError("");
                                            setSuccess("");
                                            if (tab.id !== "register") {
                                                setRegistrationStep(1);
                                                setOtpSent(false);
                                            }
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                            isActive
                                                ? "bg-[#0A84FF] text-white shadow-md"
                                                : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                    >
                                        <Icon className="text-xl" />
                                        <span className="font-medium text-sm">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Settings Content */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <ErrorMessage message={error} />
                        <SuccessMessage message={success} />

                        {activeTab === "general" && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-6">General Settings</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Admin Name
                                        </label>
                                        <input
                                            type="text"
                                            defaultValue={admin?.name || ""}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                                            placeholder="Enter admin name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            defaultValue={admin?.email || ""}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                                            placeholder="Enter email address"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Time Zone
                                        </label>
                                        <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent">
                                            <option>Asia/Kolkata (IST)</option>
                                            <option>UTC</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-end">
                                        <button className="px-6 py-3 bg-[#0A84FF] text-white rounded-lg hover:bg-[#005BBB] transition-colors font-semibold">
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "security" && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-6">Security Settings</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                                            placeholder="Enter current password"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                                            placeholder="Enter new password"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button className="px-6 py-3 bg-[#0A84FF] text-white rounded-lg hover:bg-[#005BBB] transition-colors font-semibold">
                                            Update Password
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "register" && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-6">Register New Admin</h2>
                                
                                {registrationStep === 1 ? (
                                    <form onSubmit={handleSendOTP} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <IoPersonAddOutline className="inline text-base mr-1" />
                                                Admin Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={registrationData.name}
                                                onChange={(e) =>
                                                    setRegistrationData({
                                                        ...registrationData,
                                                        name: e.target.value,
                                                    })
                                                }
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                                                placeholder="Enter admin name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <IoMailOutline className="inline text-base mr-1" />
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                value={registrationData.email}
                                                onChange={(e) =>
                                                    setRegistrationData({
                                                        ...registrationData,
                                                        email: e.target.value,
                                                    })
                                                }
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                                                placeholder="Enter email address"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <IoKeyOutline className="inline text-base mr-1" />
                                                Password *
                                            </label>
                                            <input
                                                type="password"
                                                value={registrationData.password}
                                                onChange={(e) =>
                                                    setRegistrationData({
                                                        ...registrationData,
                                                        password: e.target.value,
                                                    })
                                                }
                                                required
                                                minLength={6}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                                                placeholder="Enter password (min 6 characters)"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <IoKeyOutline className="inline text-base mr-1" />
                                                Confirm Password *
                                            </label>
                                            <input
                                                type="password"
                                                value={registrationData.confirmPassword}
                                                onChange={(e) =>
                                                    setRegistrationData({
                                                        ...registrationData,
                                                        confirmPassword: e.target.value,
                                                    })
                                                }
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                                                placeholder="Confirm password"
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="px-6 py-3 bg-[#0A84FF] text-white rounded-lg hover:bg-[#005BBB] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? "Sending..." : "Send OTP"}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <form onSubmit={handleRegisterAdmin} className="space-y-6">
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                            <p className="text-sm text-blue-800">
                                                OTP has been sent to <strong>{registrationData.email}</strong>
                                            </p>
                                            <p className="text-xs text-blue-600 mt-1">
                                                Please check your email and enter the 6-digit OTP code.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Enter OTP *
                                            </label>
                                            <input
                                                type="text"
                                                value={otpData.otp}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                                                    setOtpData({ ...otpData, otp: value });
                                                }}
                                                required
                                                maxLength={6}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent text-center text-2xl tracking-widest font-mono"
                                                placeholder="000000"
                                            />
                                            <p className="text-xs text-gray-500 mt-2">
                                                Enter the 6-digit code sent to your email
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={handleBackToForm}
                                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                                            >
                                                Back
                                            </button>
                                            <div className="flex gap-3">
                                                {otpCountdown > 0 ? (
                                                    <button
                                                        type="button"
                                                        disabled
                                                        className="px-6 py-3 border border-gray-300 text-gray-400 rounded-lg cursor-not-allowed"
                                                    >
                                                        Resend OTP ({otpCountdown}s)
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={handleResendOTP}
                                                        disabled={loading}
                                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
                                                    >
                                                        Resend OTP
                                                    </button>
                                                )}
                                                <button
                                                    type="submit"
                                                    disabled={loading || otpData.otp.length !== 6}
                                                    className="px-6 py-3 bg-[#0A84FF] text-white rounded-lg hover:bg-[#005BBB] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {loading ? "Registering..." : "Register Admin"}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
