import { useRef, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    IoCloseOutline,
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

export default function AdminMobileSidebar({ isOpen, onClose }) {
    const closeRef = useRef(null);
    const { logout, admin } = useAdminAuth();
    const location = useLocation();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        if (isOpen) closeRef.current?.focus();
    }, [isOpen]);

    const handleLogoutClick = () => {
        onClose();
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

    const overlay = `fixed inset-0 bg-black/30 z-40 transition-opacity ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
    }`;

    const panel = `fixed left-0 top-0 h-full w-4/5 max-w-xs bg-gradient-to-b from-[#1a1f3a] to-[#2d3561] text-white z-50 shadow-xl p-5 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
    }`;

    return (
        <>
            <div className={overlay} onClick={onClose} />

            <aside className={panel}>
                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#0A84FF] flex items-center justify-center">
                            <IoShieldCheckmarkOutline className="text-xl text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Jaladhar</h2>
                            <p className="text-xs text-white/70">Admin Panel</p>
                        </div>
                    </div>
                    <button
                        ref={closeRef}
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300"
                        aria-label="Close menu"
                    >
                        <IoCloseOutline className="text-2xl" />
                    </button>
                </div>

                {/* Admin Profile */}
                <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-white/5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#005BBB] flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                            {admin?.name?.charAt(0).toUpperCase() || "A"}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold">{admin?.name || "Admin"}</p>
                        <p className="text-xs text-white/60">{admin?.email}</p>
                    </div>
                </div>

                {/* Menu Items */}
                <nav className="flex flex-col gap-2 flex-1">
                    {navItems.map(({ id, label, to, Icon }) => {
                        const isActive = checkIsActive(to);
                        const shouldEnd = to === "/admin/vendors" || to === "/admin/users" || to === "/admin/dashboard" || to === "/admin/payments" || to === "/admin/settings" || to === "/admin/approvals";
                        return (
                            <NavLink
                                key={id}
                                to={to}
                                end={shouldEnd}
                                onClick={onClose}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                                    isActive
                                        ? "bg-[#0A84FF] text-white shadow-md"
                                        : "text-white/70 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                <Icon className="text-xl" />
                                <span className="text-sm font-medium">{label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="mt-auto pt-4 border-t border-white/10">
                    <button
                        onClick={handleLogoutClick}
                        className="flex items-center gap-3 w-full p-3 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                    >
                        <IoLogOutOutline className="text-xl" />
                        <span className="text-sm font-medium">Logout</span>
                    </button>
                </div>
            </aside>

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

