import { useState, useEffect } from "react";
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
    IoChevronDownOutline,
    IoChevronUpOutline,
    IoBarChartOutline,
    IoCalendarOutline,
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
        id: "bookings",
        label: "Bookings",
        to: "/admin/bookings",
        Icon: IoCalendarOutline,
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
    const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);

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
        if (path === "/admin/dashboard" || path === "/admin/vendors" || path === "/admin/users" || path === "/admin/settings" || path === "/admin/approvals" || path === "/admin/bookings") {
            return currentPath === path || currentPath === path + "/";
        }

        // For pending, match the path and sub-routes
        if (path === "/admin/vendors/pending") {
            return currentPath === path || currentPath.startsWith(path + "/");
        }

        // For payments, check if any payment route is active
        if (path === "/admin/payments" || path.startsWith("/admin/payments/")) {
            return currentPath.startsWith("/admin/payments");
        }

        return false;
    };

    // Check if payments dropdown should be open based on current route
    const isPaymentsRouteActive = location.pathname.startsWith("/admin/payments");
    
    // Auto-open payments dropdown if on a payments route
    useEffect(() => {
        if (isPaymentsRouteActive) {
            setIsPaymentsOpen(true);
        }
    }, [isPaymentsRouteActive]);

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
                    // Special handling for payments dropdown
                    if (item.id === "payments") {
                        const isActive = isPaymentsRouteActive;
                        const Icon = item.Icon;
                        
                        return (
                            <div key={item.id} className="flex flex-col">
                                <button
                                    onClick={() => setIsPaymentsOpen(!isPaymentsOpen)}
                                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group w-full ${
                                        isActive
                                            ? "bg-[#60A5FA] text-white shadow-lg shadow-[#60A5FA]/30"
                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    <Icon className={`text-xl flex-shrink-0 ${isActive ? "text-white" : "text-white/70 group-hover:text-white"}`} />
                                    <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
                                    {isPaymentsOpen ? (
                                        <IoChevronUpOutline className="text-lg flex-shrink-0" />
                                    ) : (
                                        <IoChevronDownOutline className="text-lg flex-shrink-0" />
                                    )}
                                </button>
                                
                                {/* Dropdown Menu */}
                                {isPaymentsOpen && (
                                    <div className="ml-4 mt-2 flex flex-col gap-1">
                                        <NavLink
                                            to="/admin/payments/admin"
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                                                    isActive
                                                        ? "bg-[#60A5FA] text-white shadow-md"
                                                        : "text-white/70 hover:bg-white/10 hover:text-white"
                                                }`
                                            }
                                        >
                                            <IoBarChartOutline className="text-lg flex-shrink-0" />
                                            <span className="font-medium text-sm">Admin</span>
                                        </NavLink>
                                        <NavLink
                                            to="/admin/payments/user"
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                                                    isActive
                                                        ? "bg-[#60A5FA] text-white shadow-md"
                                                        : "text-white/70 hover:bg-white/10 hover:text-white"
                                                }`
                                            }
                                        >
                                            <IoPersonCircleOutline className="text-lg flex-shrink-0" />
                                            <span className="font-medium text-sm">User</span>
                                        </NavLink>
                                        <NavLink
                                            to="/admin/payments/vendor"
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                                                    isActive
                                                        ? "bg-[#60A5FA] text-white shadow-md"
                                                        : "text-white/70 hover:bg-white/10 hover:text-white"
                                                }`
                                            }
                                        >
                                            <IoPeopleOutline className="text-lg flex-shrink-0" />
                                            <span className="font-medium text-sm">Vendor</span>
                                        </NavLink>
                                    </div>
                                )}
                            </div>
                        );
                    }

                    // Regular nav items
                    const Icon = item.Icon;
                    const isActive = checkIsActive(item.to);
                    // Use end prop for routes that should match exactly (not sub-routes)
                    const shouldEnd = item.to === "/admin/vendors" || item.to === "/admin/users" || item.to === "/admin/dashboard" || item.to === "/admin/settings" || item.to === "/admin/approvals" || item.to === "/admin/bookings";

                    return (
                        <NavLink
                            key={item.id}
                            to={item.to}
                            end={shouldEnd}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? "bg-[#60A5FA] text-white shadow-lg shadow-[#60A5FA]/30"
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
