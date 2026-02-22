import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    IoMenuOutline,
    IoPersonCircleOutline,
    IoLogOutOutline,
    IoNotificationsOutline,
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
        if (pathname.includes('/dashboard')) return 'Dashboard Overview';
        if (pathname.includes('/vendors')) return 'Vendors Management';
        if (pathname.includes('/users')) return 'Users Directory';
        if (pathname.includes('/bookings')) return 'Service Bookings';
        if (pathname.includes('/payments')) return 'Payments & Finance';
        if (pathname.includes('/settings')) return 'System Settings';
        if (pathname.includes('/approvals')) return 'Review & Approvals';
        if (pathname.includes('/reports')) return 'Reports & Analytics';
        if (pathname.includes('/notifications')) return 'Notifications';
        if (pathname.includes('/disputes')) return 'Dispute Resolutions';
        if (pathname.includes('/ratings')) return 'Ratings & Feedback';
        if (pathname.includes('/policies')) return 'Policies Management';
        if (pathname.includes('/team')) return 'Admin Team';
        return 'Admin Portal';
    };

    return (
        <>
            <header className="fixed top-0 right-0 left-0 lg:left-[278px] h-20 bg-white/80 backdrop-blur-xl z-30 transition-all duration-300 border-b border-slate-100 font-outfit">
                <div className="flex items-center justify-between h-full px-6 md:px-8">
                    <div className="flex items-center gap-6">
                        {/* Mobile Menu Trigger */}
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="lg:hidden p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
                            aria-label="Open menu"
                        >
                            <IoMenuOutline className="text-2xl" />
                        </button>

                        {/* Breadcrumbs / Page Title */}
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-black text-slate-800 tracking-tight">
                                {getPageTitle(location.pathname)}
                            </h1>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                JALADHAARA ADMIN PANEL
                            </p>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-4 ml-auto">

                        {/* Actions */}
                        <div className="flex items-center gap-2 pr-4 border-r border-slate-100">
                            <NotificationDropdown />
                        </div>

                        {/* Admin Profile */}
                        <div className="flex items-center gap-3 pl-2 pr-4 border-r border-slate-100">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-black text-slate-800 leading-none">
                                    {admin?.name || "Admin"}
                                </p>
                                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mt-1">
                                    {admin?.role?.replace(/_/g, ' ') || "Admin"}
                                </p>
                            </div>
                            <div className="relative group cursor-pointer">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-50 border border-slate-100 flex items-center justify-center group-hover:border-blue-500/30 transition-all overflow-hidden shadow-sm">
                                    {admin?.avatar ? (
                                        <img src={admin.avatar} alt="Admin" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-slate-600 font-black text-sm">
                                            {admin?.name?.charAt(0).toUpperCase() || "A"}
                                        </span>
                                    )}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                            </div>
                        </div>

                        {/* Sign Out Button */}
                        <button
                            onClick={handleLogoutClick}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-all active:scale-95 group font-bold text-[13px]"
                        >
                            <IoLogOutOutline className="text-lg transition-transform group-hover:translate-x-0.5" />
                            <span className="hidden md:block">Sign Out</span>
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

