import { useState } from "react";
import {
    IoSettingsOutline,
    IoLockClosedOutline,
} from "react-icons/io5";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";

export default function AdminSettings() {
    const { admin } = useAdminAuth();
    const [activeTab, setActiveTab] = useState("general");

    const settingsTabs = [
        { id: "general", label: "General", icon: IoSettingsOutline },
        { id: "security", label: "Security", icon: IoLockClosedOutline },
    ];

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
                                        onClick={() => setActiveTab(tab.id)}
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
                    </div>
                </div>
            </div>
        </div>
    );
}

