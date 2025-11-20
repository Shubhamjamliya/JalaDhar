import { useState } from "react";
import {
    IoMenuOutline,
    IoNotificationsOutline,
    IoPersonCircleOutline,
} from "react-icons/io5";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import AdminMobileSidebar from "./AdminMobileSidebar";

export default function AdminTopbar() {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const { admin } = useAdminAuth();

    return (
        <>
            <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-white shadow-sm border-b border-gray-200 z-30 transition-all duration-300">
                <div className="flex items-center justify-between h-full px-4 md:px-6">
                    {/* Left Section - Mobile Menu */}
                    <button
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Open menu"
                    >
                        <IoMenuOutline className="text-2xl text-gray-700" />
                    </button>

                    {/* Right Section */}
                    <div className="flex items-center gap-4 ml-auto">
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label="Notifications"
                            >
                                <IoNotificationsOutline className="text-2xl text-gray-700" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                            
                            {showNotifications && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowNotifications(false)}
                                    ></div>
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                                        <div className="p-4 border-b border-gray-200">
                                            <h3 className="font-semibold text-gray-800">Notifications</h3>
                                        </div>
                                        <div className="p-4">
                                            <p className="text-sm text-gray-500 text-center py-4">
                                                No new notifications
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Admin Profile */}
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-semibold text-gray-800">
                                    {admin?.name || "Admin"}
                                </p>
                                <p className="text-xs text-gray-500">Administrator</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#005BBB] flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                    {admin?.name?.charAt(0).toUpperCase() || "A"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar */}
            <AdminMobileSidebar
                isOpen={isMobileSidebarOpen}
                onClose={() => setIsMobileSidebarOpen(false)}
            />
        </>
    );
}

