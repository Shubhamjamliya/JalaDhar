import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    IoMenuOutline,
    IoPersonCircleOutline,
    IoLogOutOutline
} from "react-icons/io5";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import AdminMobileSidebar from "./AdminMobileSidebar";
import NotificationDropdown from "../../../components/NotificationDropdown";
import ConfirmModal from "../../shared/components/ConfirmModal";

export default function AdminTopbar() {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const { admin, logout } = useAdminAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const handleLogoutConfirm = async () => {
        setShowLogoutConfirm(false);
        await logout();
        navigate('/adminlogin');
    };

    const getPageTitle = (pathname) => {
        if (pathname.includes('/dashboard')) return 'Dashboard';
        if (pathname.includes('/vendors')) return 'Vendors';
        if (pathname.includes('/users')) return 'Users';
        if (pathname.includes('/bookings')) return 'Bookings';
        if (pathname.includes('/payments')) return 'Payments';
        if (pathname.includes('/settings')) return 'Settings';
        if (pathname.includes('/approvals')) return 'Approvals';
        if (pathname.includes('/reports')) return 'Reports';
        if (pathname.includes('/notifications')) return 'Notifications';
        if (pathname.includes('/disputes')) return 'Disputes';
        if (pathname.includes('/ratings')) return 'Ratings';
        if (pathname.includes('/policies')) return 'Policies';
        if (pathname.includes('/team')) return 'Team Management';
        return 'Admin Panel';
    };

    return (
        <>
            <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-white shadow-sm border-b border-gray-200 z-30 transition-all duration-300">
                <div className="flex items-center justify-between h-full px-4 md:px-6">
                    <div className="flex items-center gap-4">
                        {/* Left Section - Mobile Menu */}
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Open menu"
                        >
                            <IoMenuOutline className="text-2xl text-gray-700" />
                        </button>

                        {/* Page Title */}
                        <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
                            {getPageTitle(location.pathname)}
                        </h1>
                    </div>

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

                        {/* Logout Button */}
                        <button
                            onClick={handleLogoutClick}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Logout"
                        >
                            <IoLogOutOutline className="text-xl" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar */}
            <AdminMobileSidebar
                isOpen={isMobileSidebarOpen}
                onClose={() => setIsMobileSidebarOpen(false)}
            />

            {/* Logout Confirmation Modal */}
            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogoutConfirm}
                title="Confirm Logout"
                message="Are you sure you want to logout?"
                confirmText="Logout"
                cancelText="Cancel"
                confirmColor="danger"
            />
        </>
    );
}

