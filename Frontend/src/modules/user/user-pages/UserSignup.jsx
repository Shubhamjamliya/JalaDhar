import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    IoPersonOutline,
    IoMailOutline,
    IoCallOutline,
    IoGlobeOutline,
    IoCheckmark
} from "react-icons/io5";
import { sendUserRegistrationOTP } from "../../../services/authApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import { useLanguage } from "../../../contexts/LanguageContext";
import PolicyModal from "../../shared/components/PolicyModal";

import logo from "@/assets/AppLogo.png";

export default function UserSignup() {
    const location = useLocation();
    const { language, setLanguage, t, supportedLanguages, isLanguageEnabled } = useLanguage();
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [policyType, setPolicyType] = useState("general");
    
    const [formData, setFormData] = useState({
        name: location.state?.name || "",
        phone: location.state?.phone || "",
        email: location.state?.email || "",
        preferredLanguage: location.state?.preferredLanguage || language || "en"
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSelectLanguage = (langCode) => {
        setLanguage(langCode);
        setFormData((prev) => ({
            ...prev,
            preferredLanguage: langCode,
        }));
    };

    const handleSendOTP = async (e) => {
        e?.preventDefault();

        // Validation
        if (!formData.name || !formData.phone) {
            toast.showError("Please fill in Full Name and Mobile Number");
            return;
        }

        if (!agreedToTerms) {
            toast.showError("Please agree to the Terms & Conditions and Privacy Policy to continue");
            return;
        }

        setLoading(true);
        const loadingToast = toast.showLoading("Sending OTP...");

        try {
            const response = await sendUserRegistrationOTP({
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                preferredLanguage: formData.preferredLanguage,
            });

            if (response.success) {
                toast.dismissToast(loadingToast);
                if (response.reused) {
                    toast.showInfo(response.message || "Active OTP reused. Redirecting to verification...");
                } else {
                    toast.showSuccess("OTP sent successfully! Please verify to complete account creation.");
                }
                
                // Navigate to verify OTP step carrying registration state
                setTimeout(() => {
                    navigate("/user/verify-otp", {
                        state: {
                            registrationData: {
                                name: formData.name,
                                phone: formData.phone,
                                email: formData.email,
                                preferredLanguage: formData.preferredLanguage,
                            },
                            verificationToken: response.data?.token,
                            devOtp: response.data?.devOtp,
                            cooldownRemaining: response.data?.cooldownRemaining || 60,
                            phone: formData.phone,
                            email: formData.email,
                            otpSent: true,
                        },
                    });
                }, 600);
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

    const openPolicy = (type) => {
        setPolicyType(type);
        setShowTermsModal(true);
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#F3F7FA] px-4 py-8 overflow-y-auto">
            <div className="w-full max-w-md flex flex-col items-center">
                {/* Logo & Subtitle */}
                <div className="mb-6 flex flex-col items-center text-center">
                    <img
                        src={logo}
                        alt="Jaladhaara Logo"
                        className="h-28 sm:h-32 object-contain mb-2 drop-shadow-xs"
                    />
                    <p className="text-sm font-semibold text-gray-500 mt-1">
                        {t('createAccountHeader', 'Create your account to book professional groundwater surveys.')}
                    </p>
                </div>

                {/* Main Form Card */}
                <main className="w-full rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-gray-100/80">
                    <form className="space-y-4" onSubmit={handleSendOTP}>
                        {/* Pill Tag */}
                        <div className="flex justify-center mb-2">
                            <span className="text-xs font-bold text-[#0A84FF] bg-blue-50 px-4 py-1.5 rounded-full border border-blue-200/80 shadow-2xs">
                                {t('createAccount', 'Create Account')}
                            </span>
                        </div>

                        {/* PAN India Language Selection Component */}
                        {isLanguageEnabled && (
                            <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 mb-2">
                                <div className="flex items-center justify-between mb-2 px-0.5">
                                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                        <IoGlobeOutline className="text-[#0A84FF] text-base" />
                                        <span>{t("selectLanguage", "Select Language")}</span>
                                    </span>
                                    <span className="text-[10px] font-extrabold text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        PAN India
                                    </span>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {supportedLanguages.map((lang) => {
                                        const isSelected = (formData.preferredLanguage || language) === lang.code;
                                        return (
                                            <button
                                                key={lang.code}
                                                type="button"
                                                onClick={() => handleSelectLanguage(lang.code)}
                                                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                                    isSelected
                                                        ? "bg-[#0A84FF] text-white border-[#0A84FF] shadow-sm scale-[1.02]"
                                                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100/80"
                                                }`}
                                            >
                                                <span className={`text-[10px] font-mono font-bold ${isSelected ? "text-blue-100" : "text-gray-400"}`}>
                                                    {lang.badge}
                                                </span>
                                                <span className="truncate max-w-full text-[11px] mt-0.5">{lang.nativeName}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Full Name */}
                        <div className="relative">
                            <IoPersonOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 text-lg" />
                            <input
                                className="w-full rounded-full border border-gray-200 bg-white py-3 pl-11 pr-4 text-gray-800 text-sm font-medium shadow-2xs focus:border-[#0A84FF] focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                placeholder={t('fullName', 'Full Name')}
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                disabled={loading}
                                required
                            />
                        </div>

                        {/* Mobile Number * */}
                        <div className="relative">
                            <IoCallOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 text-lg" />
                            <input
                                className="w-full rounded-full border border-gray-200 bg-white py-3 pl-11 pr-4 text-gray-800 text-sm font-medium shadow-2xs focus:border-[#0A84FF] focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                placeholder={`${t('mobileNumber', 'Mobile Number')} *`}
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                disabled={loading}
                                required
                            />
                        </div>

                        {/* Email Address (Optional) */}
                        <div className="relative">
                            <IoMailOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 text-lg" />
                            <input
                                className="w-full rounded-full border border-gray-200 bg-white py-3 pl-11 pr-4 text-gray-800 text-sm font-medium shadow-2xs focus:border-[#0A84FF] focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                placeholder={t('emailOptional', 'Email Address (Optional)')}
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                        </div>

                        {/* Terms & Conditions Checkbox */}
                        <div className="pt-2 pb-1">
                            <label className="flex items-start gap-3 cursor-pointer group select-none">
                                <div
                                    onClick={() => setAgreedToTerms(!agreedToTerms)}
                                    className={`mt-0.5 w-5 h-5 rounded-md border transition-all flex items-center justify-center shrink-0 ${
                                        agreedToTerms
                                            ? "bg-[#0A84FF] border-[#0A84FF] text-white shadow-2xs"
                                            : "bg-white border-gray-300 group-hover:border-blue-400"
                                    }`}
                                >
                                    {agreedToTerms && <IoCheckmark className="text-sm stroke-[3]" />}
                                </div>
                                <span className="text-xs text-gray-600 leading-tight">
                                    {t('agreeTerms', 'I agree to the Terms & Conditions and Privacy Policy')}
                                </span>
                            </label>
                        </div>

                        {/* Continue Button */}
                        <button
                            className="w-full rounded-full bg-gradient-to-r from-[#0A84FF] via-blue-600 to-[#00C2A8] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2 flex items-center justify-center gap-2"
                            type="submit"
                            disabled={loading || !agreedToTerms}
                        >
                            <span>{loading ? "Sending OTP..." : t('continue', 'Continue')}</span>
                            {!loading && <span className="text-base font-bold">→</span>}
                        </button>
                    </form>
                </main>

                {/* Footer Link */}
                <div className="mt-6 text-center">
                    <p className="text-sm font-medium text-gray-500">
                        {t('alreadyHaveAccount', 'Already have an account?')}{" "}
                        <Link
                            to="/userlogin"
                            className="font-bold text-[#0A84FF] hover:text-blue-700 hover:underline transition-all"
                        >
                            {t('login', 'Log In')}
                        </Link>
                    </p>
                </div>
            </div>

            {showTermsModal && (
                <PolicyModal type={policyType} onClose={() => setShowTermsModal(false)} />
            )}
        </div>
    );
}
