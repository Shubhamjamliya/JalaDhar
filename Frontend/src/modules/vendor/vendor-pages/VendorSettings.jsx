import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoSettingsOutline,
    IoNotificationsOutline,
    IoLocationOutline,
    IoTimeOutline,
    IoShieldCheckmarkOutline,
    IoWalletOutline,
    IoGlobeOutline,
    IoSaveOutline,
    IoCheckmarkCircle,
    IoLockClosedOutline,
    IoKeyOutline,
    IoLogoWhatsapp
} from "react-icons/io5";
import { useToast } from "../../../hooks/useToast";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import ExpertAgreementDocViewer from "../vendor-components/ExpertAgreementDocViewer";
import CustomDropdown from "../../shared/components/CustomDropdown";
import {
    ALL_WEEKDAYS,
    WORKING_DAYS_PRESETS,
    WORKING_HOURS_PRESETS,
    detectDaysPreset,
    getDaysFromPreset,
    detectHoursPreset,
    normalizeWorkingDays,
    normalizeWorkingHours,
    formatWorkingDays,
    formatWorkingHours,
    formatTimeToAMPM
} from "../../../utils/availabilityUtils";

// Senior standard pixel-perfect ToggleSwitch component
function ToggleSwitch({ checked, onChange, activeColor = "bg-[#0A84FF]", ariaLabel = "Toggle setting" }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:ring-offset-2 ${
                checked ? activeColor : "bg-slate-300"
            }`}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    checked ? "translate-x-5" : "translate-x-0"
                }`}
            />
        </button>
    );
}

export default function VendorSettings() {
    const navigate = useNavigate();
    const toast = useToast();
    const { vendor, updateOnlineStatus } = useVendorAuth();

    const { language: currentLang, setLanguage, supportedLanguages } = useLanguage();
    const [saving, setSaving] = useState(false);
    const [showDocViewer, setShowDocViewer] = useState(false);

    // Active Section State
    const [activeSection, setActiveSection] = useState("notifications");

    // Form States
    const [settings, setSettings] = useState({
        // Notifications
        pushNotifications: true,
        whatsappAlerts: true,
        smsAlerts: true,
        emailPayoutReceipts: true,

        // Service Radius
        serviceRadius: 50, // in KM
        primaryDistrict: "Bengaluru Rural",

        // Availability Schedule
        isOnline: vendor?.isOnline !== false,
        workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        workingHoursStart: "08:00",
        workingHoursEnd: "18:00",

        // Security
        twoFactorAuth: true,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",

        // Payout & Banking
        upiId: "expert@upi",
        payoutFrequency: "INSTANT",

        // App Preferences
        language: "en",
        theme: "light"
    });

    // Update settings if vendor auth changes
    useEffect(() => {
        if (vendor) {
            setSettings(prev => ({
                ...prev,
                isOnline: vendor.isOnline !== false
            }));
        }
    }, [vendor]);

    const handleToggle = async (key) => {
        if (key === "isOnline") {
            const nextVal = !settings.isOnline;
            setSettings((prev) => ({ ...prev, isOnline: nextVal }));
            const res = await updateOnlineStatus({ isOnline: nextVal });
            if (res.success) {
                toast.showSuccess(`Availability updated to ${nextVal ? "Online" : "Offline"}`);
            } else {
                setSettings((prev) => ({ ...prev, isOnline: !nextVal }));
                toast.showError(res.message || "Failed to update availability");
            }
            return;
        }
        setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleDayToggle = (day) => {
        setSettings((prev) => {
            const exists = prev.workingDays.includes(day);
            const updatedDays = exists
                ? prev.workingDays.filter((d) => d !== day)
                : [...prev.workingDays, day];
            return { ...prev, workingDays: updatedDays };
        });
    };

    const handleSave = (e) => {
        e.preventDefault();

        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            toast.showSuccess("Settings updated successfully!");
        }, 600);
    };

    const navSections = [
        { id: "notifications", label: "Notifications", icon: IoNotificationsOutline },
        { id: "radius", label: "Service Radius", icon: IoLocationOutline },
        { id: "schedule", label: "Availability Schedule", icon: IoTimeOutline },
        { id: "security", label: "Security & Access", icon: IoShieldCheckmarkOutline },
        { id: "payout", label: "Payout Preferences", icon: IoWalletOutline },
        { id: "app", label: "App Preferences", icon: IoGlobeOutline },
    ];

    const daysList = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span>Expert Settings</span>
                        <span className="text-[10px] font-extrabold bg-blue-100 text-[#0A84FF] px-2.5 py-0.5 rounded-full border border-blue-200">
                            Partner Preferences
                        </span>
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Manage your alerts, operational coverage, availability, password, and payout settings
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0A84FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                >
                    <IoSaveOutline className="text-base" />
                    <span>{saving ? "Saving..." : "Save Settings"}</span>
                </button>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
                {navSections.map((sec) => {
                    const Icon = sec.icon;
                    const isActive = activeSection === sec.id;
                    return (
                        <button
                            key={sec.id}
                            onClick={() => setActiveSection(sec.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                                isActive
                                    ? "bg-white text-[#0A84FF] shadow-xs ring-1 ring-slate-200/60"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                            }`}
                        >
                            <Icon className="text-base" />
                            <span>{sec.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Active Section Content Card */}
            <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                {/* 1. NOTIFICATIONS */}
                {activeSection === "notifications" && (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <IoNotificationsOutline className="text-[#0A84FF] text-xl" />
                                <span>Notification &amp; Alert Preferences</span>
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                Choose how you want to be notified about survey bookings, payments, and system updates
                            </p>
                        </div>

                        <div className="space-y-3.5">
                            {/* Push Notifications */}
                            <div className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors">
                                <div className="space-y-0.5 pr-2">
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">Push Notifications</h4>
                                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-relaxed">
                                        Receive real-time popups when a new booking request is assigned to you
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={settings.pushNotifications}
                                    onChange={() => handleToggle("pushNotifications")}
                                    ariaLabel="Push Notifications"
                                />
                            </div>

                            {/* WhatsApp Alerts */}
                            <div className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors">
                                <div className="space-y-0.5 pr-2">
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                        <span>WhatsApp Alerts</span>
                                        <IoLogoWhatsapp className="text-emerald-600 text-sm" />
                                    </h4>
                                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-relaxed">
                                        Get instant WhatsApp messages with site location links and customer contact info
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={settings.whatsappAlerts}
                                    onChange={() => handleToggle("whatsappAlerts")}
                                    activeColor="bg-[#0A84FF]"
                                    ariaLabel="WhatsApp Alerts"
                                />
                            </div>

                            {/* SMS Alerts */}
                            <div className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors">
                                <div className="space-y-0.5 pr-2">
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">SMS Alerts</h4>
                                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-relaxed">
                                        SMS fallback for urgent booking confirmations and OTP verifications
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={settings.smsAlerts}
                                    onChange={() => handleToggle("smsAlerts")}
                                    ariaLabel="SMS Alerts"
                                />
                            </div>

                            {/* Email Payout Statements */}
                            <div className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors">
                                <div className="space-y-0.5 pr-2">
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">Email Payout Statements</h4>
                                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-relaxed">
                                        Receive email receipts whenever funds are transferred from your wallet
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={settings.emailPayoutReceipts}
                                    onChange={() => handleToggle("emailPayoutReceipts")}
                                    ariaLabel="Email Payout Statements"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. SERVICE RADIUS */}
                {activeSection === "radius" && (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <IoLocationOutline className="text-[#0A84FF] text-xl" />
                                <span>Service Radius &amp; Operational Zones</span>
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                Set how far you are willing to travel for groundwater surveys
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                                    <span>Maximum Travel Radius</span>
                                    <span className="px-3 py-1 bg-[#0A84FF] text-white rounded-full text-xs font-extrabold shadow-2xs">
                                        {settings.serviceRadius} km
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="150"
                                    step="5"
                                    value={settings.serviceRadius}
                                    onChange={(e) => setSettings({ ...settings, serviceRadius: Number(e.target.value) })}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0A84FF]"
                                />
                                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                    <span>10 km (Local)</span>
                                    <span>50 km (Regional)</span>
                                    <span>150 km (Statewide)</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800">Primary District Coverage</label>
                                <input
                                    type="text"
                                    value={settings.primaryDistrict}
                                    onChange={(e) => setSettings({ ...settings, primaryDistrict: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0A84FF]"
                                    placeholder="e.g. Bengaluru Rural, Ramanagara, Tumakuru"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. SCHEDULE */}
                {activeSection === "schedule" && (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <IoTimeOutline className="text-[#0A84FF] text-xl" />
                                <span>Availability &amp; Working Schedule</span>
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                Control your instant availability and active survey hours
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                                <div className="space-y-0.5 pr-2">
                                    <h4 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>Instant Online Availability</span>
                                    </h4>
                                    <p className="text-[11px] sm:text-xs text-emerald-700 font-medium leading-relaxed">
                                        {settings.isOnline
                                            ? "Active — You are currently receiving new booking requests"
                                            : "Offline — New survey bookings are paused for your profile"}
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={settings.isOnline}
                                    onChange={() => handleToggle("isOnline")}
                                    activeColor="bg-emerald-500"
                                    ariaLabel="Instant Online Availability"
                                />
                            </div>

                            {/* Working Days Dropdown & Custom Days */}
                            <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <CustomDropdown
                                    label="Working Days Schedule"
                                    name="workingDaysSchedule"
                                    options={WORKING_DAYS_PRESETS.map((preset) => ({
                                        value: preset.key,
                                        label: preset.label
                                    }))}
                                    value={detectDaysPreset(settings.workingDays)}
                                    onChange={(e) => {
                                        const presetKey = e.target.value;
                                        if (presetKey !== 'CUSTOM') {
                                            const newDays = getDaysFromPreset(presetKey);
                                            setSettings(prev => ({ ...prev, workingDays: newDays }));
                                        }
                                    }}
                                />

                                <div className="pt-2">
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                                        Active Days:
                                    </span>
                                    <div className="grid grid-cols-7 gap-1.5">
                                        {ALL_WEEKDAYS.map((day) => {
                                            const isSelected = settings.workingDays?.some(
                                                d => d.toLowerCase() === day.toLowerCase() || d.toLowerCase() === day.substring(0, 3).toLowerCase()
                                            );
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => {
                                                        const currentDays = normalizeWorkingDays(settings.workingDays);
                                                        const newDays = isSelected
                                                            ? currentDays.filter(d => d.toLowerCase() !== day.toLowerCase())
                                                            : [...currentDays, day];
                                                        setSettings(prev => ({ ...prev, workingDays: newDays }));
                                                    }}
                                                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                                                        isSelected
                                                            ? "bg-[#0A84FF] text-white shadow-2xs"
                                                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                                    }`}
                                                >
                                                    {day.substring(0, 3)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Working Hours Dropdown & Custom Times */}
                            <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <CustomDropdown
                                    label="Working Hours Window"
                                    name="workingHoursWindow"
                                    options={WORKING_HOURS_PRESETS.map((preset) => ({
                                        value: preset.key,
                                        label: preset.label
                                    }))}
                                    value={detectHoursPreset({ start: settings.workingHoursStart, end: settings.workingHoursEnd })}
                                    onChange={(e) => {
                                        const presetKey = e.target.value;
                                        const matchedPreset = WORKING_HOURS_PRESETS.find(p => p.key === presetKey);
                                        if (matchedPreset && presetKey !== 'CUSTOM') {
                                            setSettings(prev => ({
                                                ...prev,
                                                workingHoursStart: matchedPreset.start,
                                                workingHoursEnd: matchedPreset.end
                                            }));
                                        }
                                    }}
                                />

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                                            Start Time
                                        </label>
                                        <input
                                            type="time"
                                            value={settings.workingHoursStart || "08:00"}
                                            onChange={(e) => setSettings(prev => ({ ...prev, workingHoursStart: e.target.value }))}
                                            className="w-full rounded-lg bg-gray-50 p-1.5 text-sm font-bold text-gray-800 outline-none"
                                        />
                                        <span className="text-[11px] font-semibold text-blue-600 block mt-0.5">
                                            {formatTimeToAMPM(settings.workingHoursStart || "08:00")}
                                        </span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                                            End Time
                                        </label>
                                        <input
                                            type="time"
                                            value={settings.workingHoursEnd || "19:00"}
                                            onChange={(e) => setSettings(prev => ({ ...prev, workingHoursEnd: e.target.value }))}
                                            className="w-full rounded-lg bg-gray-50 p-1.5 text-sm font-bold text-gray-800 outline-none"
                                        />
                                        <span className="text-[11px] font-semibold text-blue-600 block mt-0.5">
                                            {formatTimeToAMPM(settings.workingHoursEnd || "19:00")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. SECURITY */}
                {activeSection === "security" && (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <IoShieldCheckmarkOutline className="text-[#0A84FF] text-xl" />
                                <span>Security &amp; Password Access</span>
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                Update your password and enable two-factor authentication
                            </p>
                        </div>

                        <div className="space-y-4 max-w-md">
                            <div className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-100">
                                <div className="space-y-0.5 pr-2">
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">Two-Factor OTP Login</h4>
                                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-relaxed">
                                        Require SMS/Email OTP verification when logging in
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={settings.twoFactorAuth}
                                    onChange={() => handleToggle("twoFactorAuth")}
                                    ariaLabel="Two Factor Authentication"
                                />
                            </div>

                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-bold text-slate-800">Change Password</h4>
                                <input
                                    type="password"
                                    placeholder="Current Password"
                                    value={settings.currentPassword}
                                    onChange={(e) => setSettings({ ...settings, currentPassword: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0A84FF]"
                                />
                                <input
                                    type="password"
                                    placeholder="New Password"
                                    value={settings.newPassword}
                                    onChange={(e) => setSettings({ ...settings, newPassword: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0A84FF]"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-bold text-slate-800 mb-1">Signed Legal Documents</h4>
                                <p className="text-[11px] text-slate-500 mb-3">Download a stamped copy of your signed Jaladhaara Expert Onboarding Agreement.</p>
                                <button
                                    type="button"
                                    onClick={() => setShowDocViewer(true)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-xs hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <span>📥 View &amp; Download Signed Agreement (PDF)</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. PAYOUT PREFERENCES */}
                {activeSection === "payout" && (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <IoWalletOutline className="text-[#0A84FF] text-xl" />
                                <span>Payout &amp; Settlement Settings</span>
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                Manage how your survey earnings are transferred to your bank account
                            </p>
                        </div>

                        <div className="space-y-4 max-w-md">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800">Default UPI ID for Withdrawals</label>
                                <input
                                    type="text"
                                    value={settings.upiId}
                                    onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0A84FF]"
                                />
                            </div>

                            <CustomDropdown
                                label="Payout Settlement Speed"
                                name="payoutFrequency"
                                options={[
                                    { value: "INSTANT", label: "Instant Settlement (Upon Report Approval)" },
                                    { value: "DAILY", label: "Daily Batch Transfer (6:00 PM)" },
                                    { value: "WEEKLY", label: "Weekly Transfer (Every Monday)" }
                                ]}
                                value={settings.payoutFrequency || "INSTANT"}
                                onChange={(val) => {
                                    const value = typeof val === 'object' && val?.target ? val.target.value : val;
                                    setSettings({ ...settings, payoutFrequency: value });
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* 6. APP PREFERENCES */}
                {activeSection === "app" && (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <IoGlobeOutline className="text-[#0A84FF] text-xl" />
                                <span>App Preferences</span>
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                Language selection and visual appearance options
                            </p>
                        </div>

                        <div className="space-y-4 max-w-md">
                            <CustomDropdown
                                label="Portal Language"
                                name="language"
                                options={(supportedLanguages || []).map(l => ({
                                    value: l.code,
                                    label: `${l.name} (${l.nativeName})`
                                }))}
                                value={settings.language || currentLang || "en"}
                                onChange={(val) => {
                                    const value = typeof val === 'object' && val?.target ? val.target.value : val;
                                    setSettings({ ...settings, language: value });
                                    setLanguage(value);
                                    toast.showSuccess("Language preference updated");
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* In-App Responsive Document & PDF Viewer Modal */}
            <ExpertAgreementDocViewer
                isOpen={showDocViewer}
                onClose={() => setShowDocViewer(false)}
            />
        </div>
    );
}
