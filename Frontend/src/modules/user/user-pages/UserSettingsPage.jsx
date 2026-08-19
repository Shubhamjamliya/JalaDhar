import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoSettingsOutline,
    IoPersonOutline,
    IoLockClosedOutline,
    IoNotificationsOutline,
    IoShieldCheckmarkOutline,
    IoChevronForwardOutline,
    IoKeyOutline,
    IoGlobeOutline
} from "react-icons/io5";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import PageContainer from "../../shared/components/PageContainer";
import PolicyModal from "../../shared/components/PolicyModal";
import ChangePasswordModal from "../components/ChangePasswordModal";
import { updateUserNotificationPreferences } from "../../../services/userApi";
import { useToast } from "../../../hooks/useToast";

export default function UserSettingsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { language, setLanguage, supportedLanguages, isLanguageEnabled, t } = useLanguage();
    const toast = useToast();
    const [activePolicy, setActivePolicy] = useState(null);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [emailAlerts, setEmailAlerts] = useState(user?.notificationPreferences?.emailAlerts ?? true);
    const [smsAlerts, setSmsAlerts] = useState(user?.notificationPreferences?.smsAlerts ?? true);
    const [savingPreference, setSavingPreference] = useState(false);

    useEffect(() => {
        if (user?.notificationPreferences) {
            setEmailAlerts(user.notificationPreferences.emailAlerts ?? true);
            setSmsAlerts(user.notificationPreferences.smsAlerts ?? true);
        }
    }, [user]);

    const handleToggleEmailAlerts = async () => {
        if (savingPreference) return;
        const newValue = !emailAlerts;
        setEmailAlerts(newValue);
        try {
            setSavingPreference(true);
            await updateUserNotificationPreferences({ emailAlerts: newValue, smsAlerts });
            toast.showSuccess(`Email alerts ${newValue ? "enabled" : "disabled"}`);
        } catch (err) {
            setEmailAlerts(!newValue);
            toast.showError("Failed to save preference");
        } finally {
            setSavingPreference(false);
        }
    };

    const handleToggleSmsAlerts = async () => {
        if (savingPreference) return;
        const newValue = !smsAlerts;
        setSmsAlerts(newValue);
        try {
            setSavingPreference(true);
            await updateUserNotificationPreferences({ emailAlerts, smsAlerts: newValue });
            toast.showSuccess(`SMS & WhatsApp alerts ${newValue ? "enabled" : "disabled"}`);
        } catch (err) {
            setSmsAlerts(!newValue);
            toast.showError("Failed to save preference");
        } finally {
            setSavingPreference(false);
        }
    };

    return (
        <PageContainer title="Settings">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-slate-700 to-gray-900 rounded-3xl p-6 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl">
                            <IoSettingsOutline className="text-2xl text-white" />
                        </div>
                        <h1 className="text-2xl font-bold">Account Settings & Preferences</h1>
                    </div>
                    <p className="text-gray-300 text-sm">
                        Manage your profile details, security preferences, notification alerts, and platform policies.
                    </p>
                </div>

                {/* Section 1: Account Profile */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <IoPersonOutline className="text-blue-600 text-xl" />
                        Account & Profile
                    </h3>

                    <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-100">
                        <div>
                            <span className="text-sm font-bold text-gray-900 block">{user?.name || "User Account"}</span>
                            <span className="text-xs text-gray-500">{user?.email} • {user?.phone}</span>
                        </div>
                        <button
                            onClick={() => navigate("/user/profile")}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                        >
                            Edit Profile
                        </button>
                    </div>
                </div>

                {/* Section 2: Language Preferences */}
                {isLanguageEnabled && (
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <IoGlobeOutline className="text-[#0A84FF] text-xl" />
                                {t("language", "Language")} & Regional Localization
                            </h3>
                            <span className="text-xs font-bold text-[#0A84FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                                {supportedLanguages.find(l => l.code === language)?.nativeName || "English"}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">
                            Choose your preferred language. The entire application interface will adapt immediately.
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                            {supportedLanguages.map((lang) => {
                                const isSelected = language === lang.code;
                                return (
                                    <button
                                        key={lang.code}
                                        type="button"
                                        onClick={() => {
                                            setLanguage(lang.code);
                                            toast.showSuccess(`Language changed to ${lang.nativeName}`);
                                        }}
                                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                                            isSelected
                                                ? "bg-blue-50/80 border-[#0A84FF] ring-2 ring-blue-500/20 shadow-2xs"
                                                : "bg-gray-50/60 border-gray-100 hover:bg-gray-100/70 text-gray-700"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? "bg-[#0A84FF] text-white" : "bg-gray-200/80 text-gray-600"}`}>
                                                {lang.badge || lang.code.toUpperCase()}
                                            </span>
                                            {isSelected && (
                                                <span className="w-2 h-2 rounded-full bg-[#0A84FF]" />
                                            )}
                                        </div>
                                        <div>
                                            <span className={`text-xs font-bold block ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                                                {lang.nativeName}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {lang.name}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Section 3: Notification Preferences */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <IoNotificationsOutline className="text-amber-500 text-xl" />
                        Notification Preferences
                    </h3>

                    <div className="space-y-3">
                        {/* Email Alerts Card */}
                        <div
                            onClick={handleToggleEmailAlerts}
                            className="flex items-center justify-between p-4 bg-gray-50/80 hover:bg-gray-100/80 rounded-2xl border border-gray-100 cursor-pointer transition-all select-none"
                        >
                            <div className="pr-4 min-w-0 flex-1">
                                <span className="text-sm font-bold text-gray-900 block">Email Alerts</span>
                                <span className="text-xs text-gray-500 block leading-relaxed mt-0.5">
                                    Receive booking confirmations and survey report PDFs via email
                                </span>
                            </div>
                            <div className="shrink-0 flex items-center">
                                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailAlerts ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                                </div>
                            </div>
                        </div>

                        {/* SMS & WhatsApp Alerts Card */}
                        <div
                            onClick={handleToggleSmsAlerts}
                            className="flex items-center justify-between p-4 bg-gray-50/80 hover:bg-gray-100/80 rounded-2xl border border-gray-100 cursor-pointer transition-all select-none"
                        >
                            <div className="pr-4 min-w-0 flex-1">
                                <span className="text-sm font-bold text-gray-900 block">SMS & WhatsApp Alerts</span>
                                <span className="text-xs text-gray-500 block leading-relaxed mt-0.5">
                                    Receive instant updates when an expert is assigned or reaches your location
                                </span>
                            </div>
                            <div className="shrink-0 flex items-center">
                                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${smsAlerts ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${smsAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 4: Privacy & Legal */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <IoShieldCheckmarkOutline className="text-emerald-600 text-xl" />
                        Privacy & Legal Documents
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div
                            onClick={() => setActivePolicy("user_agreement")}
                            className="p-4 bg-blue-50/60 hover:bg-blue-100/80 rounded-2xl border border-blue-100 flex items-center justify-between cursor-pointer transition-colors"
                        >
                            <span className="text-xs font-black text-blue-900">Jaladhaara User Agreement</span>
                            <IoChevronForwardOutline className="text-blue-500" />
                        </div>
                        <div
                            onClick={() => setActivePolicy("terms")}
                            className="p-4 bg-gray-50/80 hover:bg-gray-100 rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer transition-colors"
                        >
                            <span className="text-xs font-bold text-gray-800">Terms of Service</span>
                            <IoChevronForwardOutline className="text-gray-400" />
                        </div>
                        <div
                            onClick={() => setActivePolicy("privacy")}
                            className="p-4 bg-gray-50/80 hover:bg-gray-100 rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer transition-colors"
                        >
                            <span className="text-xs font-bold text-gray-800">Privacy Policy</span>
                            <IoChevronForwardOutline className="text-gray-400" />
                        </div>
                    </div>
                </div>
            </div>

            {activePolicy && (
                <PolicyModal type={activePolicy} onClose={() => setActivePolicy(null)} />
            )}

            <ChangePasswordModal
                isOpen={showChangePasswordModal}
                onClose={() => setShowChangePasswordModal(false)}
            />
        </PageContainer>
    );
}
