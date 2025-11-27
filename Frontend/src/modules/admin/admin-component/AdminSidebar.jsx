import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    IoHomeOutline,
    IoPeopleOutline,
    IoDocumentTextOutline,
    IoPersonCircleOutline,
    IoLogOutOutline,
    IoShieldCheckmarkOutline,
    IoSettingsOutline,
    IoWalletOutline,
    IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import ConfirmModal from "../../shared/components/ConfirmModal";
import logo from "../../../assets/logo.png";

const navItems = [
    {
        id: "dashboard",
        label: "Dashboard",
        to: "/admin/dashboard",
        Icon: IoHomeOutline,
    },
    {
        id: "vendors",
        label: "All Vendors",
        to: "/admin/vendors",
        Icon: IoPeopleOutline,
    },
    {
        id: "pending",
        label: "Pending Approvals",
        to: "/admin/vendors/pending",
        Icon: IoDocumentTextOutline,
    },
    {
        id: "users",
        label: "Users",
        to: "/admin/users",
        Icon: IoPersonCircleOutline,
    },
    {
        id: "approvals",
        label: "Approvals",
        to: "/admin/approvals",
        Icon: IoCheckmarkCircleOutline,
    },
    {
        id: "payments",
        label: "Payments",
        to: "/admin/payments",
        Icon: IoWalletOutline,
    },
    {
        id: "settings",
        label: "Settings",
        to: "/admin/settings",
        Icon: IoSettingsOutline,
    },
];

export default function AdminSidebar() {
    const { logout, admin } = useAdminAuth();
    const location = useLocation();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const handleLogoutConfirm = async () => {
        setShowLogoutConfirm(false);
        await logout();
    };

    // Helper function to check if a route is active
    const checkIsActive = (path) => {
        const currentPath = location.pathname;

        // For routes that should match exactly
        if (path === "/admin/dashboard" || path === "/admin/vendors" || path === "/admin/users" || path === "/admin/payments" || path === "/admin/settings" || path === "/admin/approvals") {
            return currentPath === path || currentPath === path + "/";
        }

        // For pending, match the path and sub-routes
        if (path === "/admin/vendors/pending") {
            return currentPath === path || currentPath.startsWith(path + "/");
        }

        return false;
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-[#1a1f3a] to-[#2d3561] text-white z-40 shadow-2xl">
            {/* Logo Section */}
            <div className="flex items-center gap-3 p-6 border-b border-white/10">
                <div className="w-10 h-10 rounded-lg bg-[#0A84FF] flex items-center justify-center flex-shrink-0">
                    <IoShieldCheckmarkOutline className="text-xl text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white">Jaladhar</h1>
                    <p className="text-xs text-white/70">Admin Panel</p>
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex flex-col gap-2 p-4 mt-4 flex-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.Icon;
                    const isActive = checkIsActive(item.to);
                    // Use end prop for routes that should match exactly (not sub-routes)
                    const shouldEnd = item.to === "/admin/vendors" || item.to === "/admin/users" || item.to === "/admin/dashboard" || item.to === "/admin/payments" || item.to === "/admin/settings" || item.to === "/admin/approvals";

                    return (
                        <NavLink
                            key={item.id}
                            to={item.to}
                            end={shouldEnd}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? "bg-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/30"
                                    : "text-white/70 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            <Icon className={`text-xl flex-shrink-0 ${isActive ? "text-white" : "text-white/70 group-hover:text-white"}`} />
                            <span className="font-medium text-sm">{item.label}</span>
                            {isActive && (
                                <div className="ml-auto w-2 h-2 rounded-full bg-white"></div>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Admin Profile Section */}
            <div className="p-4 border-t border-white/10">
                <div className="mb-4 p-3 rounded-xl bg-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#005BBB] flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">
                                {admin?.name?.charAt(0).toUpperCase() || "A"}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                                {admin?.name || "Admin"}
                            </p>
                            <p className="text-xs text-white/60 truncate">
                                {admin?.email || "admin@jaladhar.com"}
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                >
                    <IoLogOutOutline className="text-xl flex-shrink-0" />
                    <span className="font-medium text-sm">Logout</span>
                </button>
            </div>

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
        </aside>
    );
}
