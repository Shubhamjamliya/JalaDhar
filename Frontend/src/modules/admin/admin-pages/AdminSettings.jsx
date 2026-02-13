import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    IoSettingsOutline,
    IoLockClosedOutline,
    IoPersonAddOutline,
    IoMailOutline,
    IoKeyOutline,
    IoCheckmarkCircleOutline,
    IoCloseOutline,
    IoCashOutline,
    IoBusinessOutline,
} from "react-icons/io5";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import { sendAdminRegistrationOTP, registerAdminWithOTP, getAllSettings, updateMultipleSettings } from "../../../services/adminApi";
import ErrorMessage from "../../shared/components/ErrorMessage";
import { useToast } from "../../../hooks/useToast";

export default function AdminSettings({ defaultTab = "general" }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { admin } = useAdminAuth();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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
        { id: "pricing", label: "Pricing", icon: IoCashOutline },
        { id: "billing", label: "Billing Info", icon: IoBusinessOutline },
        { id: "security", label: "Security", icon: IoLockClosedOutline },
        { id: "register", label: "Register Admin", icon: IoPersonAddOutline },
    ];

    // Pricing Settings State
    const [pricingSettings, setPricingSettings] = useState({
        TRAVEL_CHARGE_PER_KM: 10,
        BASE_RADIUS_KM: 30,
        GST_PERCENTAGE: 18,
    });
    const [pricingLoading, setPricingLoading] = useState(false);

    // Billing Settings State
    const [billingSettings, setBillingSettings] = useState({
        BILLING_COMPANY_NAME: "",
        BILLING_ADDRESS: "",
        BILLING_GSTIN: "",
        BILLING_PHONE: "",
        BILLING_EMAIL: "",
    });
    const [billingLoading, setBillingLoading] = useState(false);

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
                toast.showSuccess("OTP sent to email successfully!");
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

    // Sync activeTab with prop
    useEffect(() => {
        if (defaultTab && activeTab !== defaultTab) {
            setActiveTab(defaultTab);
            setError("");
        }
    }, [defaultTab]);

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
                toast.showSuccess("OTP resent successfully!");
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
                toast.showSuccess("Admin registered successfully!");
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

    // Load pricing settings
    useEffect(() => {
        const loadPricingSettings = async () => {
            try {
                const response = await getAllSettings('pricing');
                if (response.success && response.data.settings) {
                    const settingsObj = {};
                    response.data.settings.forEach(setting => {
                        settingsObj[setting.key] = setting.value;
                    });
                    setPricingSettings(prev => ({
                        ...prev,
                        ...settingsObj
                    }));
                }
            } catch (err) {
                console.error('Error loading pricing settings:', err);
            }
        };
        if (activeTab === 'pricing') {
            loadPricingSettings();
        }
    }, [activeTab]);

    // Load billing settings
    useEffect(() => {
        const loadBillingSettings = async () => {
            try {
                const response = await getAllSettings('billing');
                if (response.success && response.data.settings) {
                    const settingsObj = {};
                    response.data.settings.forEach(setting => {
                        settingsObj[setting.key] = setting.value;
                    });
                    setBillingSettings(prev => ({
                        ...prev,
                        ...settingsObj
                    }));
                }
            } catch (err) {
                console.error('Error loading billing settings:', err);
            }
        };
        if (activeTab === 'billing') {
            loadBillingSettings();
        }
    }, [activeTab]);

    // Handle pricing settings update
    const handlePricingSettingsUpdate = async (e) => {
        e.preventDefault();
        setError("");
        setPricingLoading(true);

        try {
            const settings = [
                { key: 'TRAVEL_CHARGE_PER_KM', value: parseFloat(pricingSettings.TRAVEL_CHARGE_PER_KM) },
                { key: 'BASE_RADIUS_KM', value: parseFloat(pricingSettings.BASE_RADIUS_KM) },
                { key: 'GST_PERCENTAGE', value: parseFloat(pricingSettings.GST_PERCENTAGE) },
            ];

            const response = await updateMultipleSettings(settings);
            if (response.success) {
                toast.showSuccess("Pricing settings updated successfully!");
            } else {
                setError(response.message || "Failed to update pricing settings");
            }
        } catch (err) {
            console.error("Update pricing settings error:", err);
            setError(err.response?.data?.message || "Failed to update pricing settings. Please try again.");
        } finally {
            setPricingLoading(false);
        }
    };

    // Handle billing settings update
    const handleBillingSettingsUpdate = async (e) => {
        e.preventDefault();
        setError("");
        setBillingLoading(true);

        try {
            const settings = [
                { key: 'BILLING_COMPANY_NAME', value: billingSettings.BILLING_COMPANY_NAME },
                { key: 'BILLING_ADDRESS', value: billingSettings.BILLING_ADDRESS },
                { key: 'BILLING_GSTIN', value: billingSettings.BILLING_GSTIN },
                { key: 'BILLING_PHONE', value: billingSettings.BILLING_PHONE },
                { key: 'BILLING_EMAIL', value: billingSettings.BILLING_EMAIL },
            ];

            const response = await updateMultipleSettings(settings);
            if (response.success) {
                toast.showSuccess("Billing information updated successfully!");
            } else {
                setError(response.message || "Failed to update billing information");
            }
        } catch (err) {
            console.error("Update billing settings error:", err);
            setError(err.response?.data?.message || "Failed to update billing information. Please try again.");
        } finally {
            setBillingLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-5rem)]">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
                <p className="text-gray-600">Manage your admin panel preferences and configurations</p>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
                    {settingsTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    navigate(`/admin/settings/${tab.id}`);
                                    setError("");
                                }}
                                className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${isActive
                                    ? "border-[#0A84FF] text-[#0A84FF]"
                                    : "border-transparent text-gray-600 hover:text-gray-800"
                                    }`}
                            >
                                <Icon className="text-lg" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="max-w-4xl">
                {/* Settings Content */}
                <div className="w-full">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <ErrorMessage message={error} />

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

                        {activeTab === "billing" && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-6">Billing Information</h2>
                                <p className="text-sm text-gray-500 mb-6">
                                    This information will be displayed on all invoices generated for users and vendors.
                                </p>
                                <form onSubmit={handleBillingSettingsUpdate} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Company Name
                                            </label>
                                            <input
                                                type="text"
                                                value={billingSettings.BILLING_COMPANY_NAME}
                                                onChange={(e) =>
                                                    setBillingSettings({
                                                        ...billingSettings,
                                                        BILLING_COMPANY_NAME: e.target.value,
                                                    })
                                                }
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                                                placeholder="Legal Company Name"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Billing Address
                                            </label>
                                            <textarea
                                                value={billingSettings.BILLING_ADDRESS}
                                                onChange={(e) =>
                                                    setBillingSettings({
                                                        ...billingSettings,
                                                        BILLING_ADDRESS: e.target.value,
                                                    })
                                                }
                                                required
                                                rows={3}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                                                placeholder="Complete business address"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                GSTIN
                                            </label>
                                            <input
                                                type="text"
                                                value={billingSettings.BILLING_GSTIN}
                                                onChange={(e) =>
                                                    setBillingSettings({
                                                        ...billingSettings,
                                                        BILLING_GSTIN: e.target.value,
                                                    })
                                                }
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                                                placeholder="GST Registration Number"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Contact Phone
                                            </label>
                                            <input
                                                type="text"
                                                value={billingSettings.BILLING_PHONE}
                                                onChange={(e) =>
                                                    setBillingSettings({
                                                        ...billingSettings,
                                                        BILLING_PHONE: e.target.value,
                                                    })
                                                }
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                                                placeholder="Contact Number for Invoices"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Billing Email
                                            </label>
                                            <input
                                                type="email"
                                                value={billingSettings.BILLING_EMAIL}
                                                onChange={(e) =>
                                                    setBillingSettings({
                                                        ...billingSettings,
                                                        BILLING_EMAIL: e.target.value,
                                                    })
                                                }
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                                                placeholder="Billing Support Email"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            disabled={billingLoading}
                                            className="px-6 py-3 bg-[#0A84FF] text-white rounded-lg hover:bg-[#005BBB] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {billingLoading && (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            )}
                                            {billingLoading ? "Saving..." : "Save Billing Info"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                        {activeTab === "pricing" && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-6">Pricing Settings</h2>
                                <form onSubmit={handlePricingSettingsUpdate} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Travel Charge Per Kilometer (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={pricingSettings.TRAVEL_CHARGE_PER_KM}
                                            onChange={(e) =>
                                                setPricingSettings({
                                                    ...pricingSettings,
                                                    TRAVEL_CHARGE_PER_KM: e.target.value,
                                                })
                                            }
                                            min="0"
                                            step="0.01"
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                                            placeholder="Enter travel charge per km"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Charge per kilometer beyond the base radius
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Base Radius (km)
                                        </label>
                                        <input
                                            type="number"
                                            value={pricingSettings.BASE_RADIUS_KM}
                                            onChange={(e) =>
                                                setPricingSettings({
                                                    ...pricingSettings,
                                                    BASE_RADIUS_KM: e.target.value,
                                                })
                                            }
                                            min="0"
                                            step="1"
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                                            placeholder="Enter base radius in km"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Distance within which no travel charges apply
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            GST Percentage (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={pricingSettings.GST_PERCENTAGE}
                                            onChange={(e) =>
                                                setPricingSettings({
                                                    ...pricingSettings,
                                                    GST_PERCENTAGE: e.target.value,
                                                })
                                            }
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                                            placeholder="Enter GST percentage"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            GST percentage applied on total amount (subtotal + travel charges)
                                        </p>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={pricingLoading}
                                            className="px-6 py-3 bg-[#0A84FF] text-white rounded-lg hover:bg-[#005BBB] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {pricingLoading ? "Saving..." : "Save Pricing Settings"}
                                        </button>
                                    </div>
                                </form>
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
