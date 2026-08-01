import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoSettingsOutline,
    IoPersonOutline,
    IoLockClosedOutline,
    IoNotificationsOutline,
    IoShieldCheckmarkOutline,
    IoChevronForwardOutline,
    IoKeyOutline
} from "react-icons/io5";
import { useAuth } from "../../../contexts/AuthContext";
import PageContainer from "../../shared/components/PageContainer";
import PolicyModal from "../../shared/components/PolicyModal";

export default function UserSettingsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activePolicy, setActivePolicy] = useState(null);
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [smsAlerts, setSmsAlerts] = useState(true);

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

                {/* Section 2: Security & Password */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <IoLockClosedOutline className="text-slate-700 text-xl" />
                        Security & Authentication
                    </h3>

                    <div
                        onClick={() => navigate("/user/forgot-password")}
                        className="p-4 bg-gray-50/80 hover:bg-gray-100/80 rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-200 text-slate-800 rounded-xl">
                                <IoKeyOutline className="text-lg" />
                            </div>
                            <div>
                                <span className="text-sm font-bold text-gray-900 block">Change Password</span>
                                <span className="text-xs text-gray-500">Update your login password and security settings</span>
                            </div>
                        </div>
                        <IoChevronForwardOutline className="text-gray-400" />
                    </div>
                </div>

                {/* Section 3: Notification Preferences */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <IoNotificationsOutline className="text-amber-500 text-xl" />
                        Notification Preferences
                    </h3>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-100">
                            <div>
                                <span className="text-sm font-bold text-gray-900 block">Email Alerts</span>
                                <span className="text-xs text-gray-500">Receive booking confirmations and survey report PDFs via email</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={emailAlerts}
                                onChange={(e) => setEmailAlerts(e.target.checked)}
                                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-100">
                            <div>
                                <span className="text-sm font-bold text-gray-900 block">SMS & WhatsApp Alerts</span>
                                <span className="text-xs text-gray-500">Receive instant updates when an expert is assigned or reaches your location</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={smsAlerts}
                                onChange={(e) => setSmsAlerts(e.target.checked)}
                                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 4: Privacy & Legal */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <IoShieldCheckmarkOutline className="text-emerald-600 text-xl" />
                        Privacy & Legal Documents
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        </PageContainer>
    );
}
