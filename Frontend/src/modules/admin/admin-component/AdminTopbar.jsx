import { useState } from "react";
import {
    IoMenuOutline,
    IoPersonCircleOutline,
} from "react-icons/io5";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import AdminMobileSidebar from "./AdminMobileSidebar";
import NotificationDropdown from "../../../components/NotificationDropdown";

export default function AdminTopbar() {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
                        <NotificationDropdown />

                        {/* Admin Profile */}
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-semibold text-gray-800">
                                    {admin?.name || "Admin"}
                                </p>
                                <p className="text-xs text-gray-500 font-medium">
                                    {admin?.role ? admin.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "Administrator"}
                                </p>
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

