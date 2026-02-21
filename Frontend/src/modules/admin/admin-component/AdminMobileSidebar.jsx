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
    IoChevronDownOutline,
    IoChevronUpOutline,
    IoBarChartOutline,
    IoStarOutline,
    IoAlertCircleOutline,
    IoCalendarOutline,
    IoCashOutline,
    IoLockClosedOutline,
    IoBusinessOutline,
    IoRocketOutline,
    IoNotificationsOutline,
} from "react-icons/io5";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import ConfirmModal from "../../shared/components/ConfirmModal";
import logo from "@/assets/AppLogo.png";

const navItems = [
    {
        id: "dashboard",
        label: "Dashboard",
        to: "/admin/dashboard",
        Icon: IoHomeOutline,
        roles: ["ADMIN", "SUPER_ADMIN", "FINANCE_ADMIN", "OPERATIONS_ADMIN", "VERIFIER_ADMIN", "SUPPORT_ADMIN"]
    },
    {
        id: "vendors",
        label: "Vendors",
        to: "/admin/vendors",
        Icon: IoBusinessOutline,
        roles: ["ADMIN", "SUPER_ADMIN", "FINANCE_ADMIN", "OPERATIONS_ADMIN", "VERIFIER_ADMIN", "SUPPORT_ADMIN"]
    },
    {
        id: "users",
        label: "Users",
        to: "/admin/users",
        Icon: IoPersonCircleOutline,
        roles: ["ADMIN", "SUPER_ADMIN", "FINANCE_ADMIN", "OPERATIONS_ADMIN", "VERIFIER_ADMIN", "SUPPORT_ADMIN"]
    },
    {
        id: "approvals",
        label: "Approvals",
        to: "/admin/approvals",
        Icon: IoCheckmarkCircleOutline,
        roles: ["SUPER_ADMIN", "OPERATIONS_ADMIN", "VERIFIER_ADMIN"]
    },
    {
        id: "bookings",
        label: "Bookings",
        to: "/admin/bookings",
        Icon: IoCalendarOutline,
        roles: ["ADMIN", "SUPER_ADMIN", "FINANCE_ADMIN", "OPERATIONS_ADMIN", "VERIFIER_ADMIN", "SUPPORT_ADMIN"]
    },
    {
        id: "payments",
        label: "Payments",
        to: "/admin/payments",
        Icon: IoWalletOutline,
        roles: ["SUPER_ADMIN", "FINANCE_ADMIN"]
    },
    {
        id: "ratings",
        label: "Ratings & Reviews",
        to: "/admin/ratings",
        Icon: IoStarOutline,
        roles: ["SUPER_ADMIN", "SUPPORT_ADMIN"]
    },
    {
        id: "disputes",
        label: "Disputes",
        to: "/admin/disputes",
        Icon: IoAlertCircleOutline,
        roles: ["SUPER_ADMIN", "OPERATIONS_ADMIN", "SUPPORT_ADMIN"]
    },
    {
        id: "team",
        label: "Admin Management",
        to: "/admin/team",
        Icon: IoLockClosedOutline,
        roles: ["SUPER_ADMIN"]
    },
    {
        id: "settings",
        label: "Settings",
        to: "/admin/settings",
        Icon: IoSettingsOutline,
        roles: ["SUPER_ADMIN"]
    },
];

export default function AdminMobileSidebar({ isOpen, onClose }) {
    const closeRef = useRef(null);
    const { logout, admin } = useAdminAuth();
    const location = useLocation();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
    const [isUsersOpen, setIsUsersOpen] = useState(false);
    const [isVendorsOpen, setIsVendorsOpen] = useState(false);
    const [isBookingsOpen, setIsBookingsOpen] = useState(false);

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
        if (path === "/admin/dashboard" || path === "/admin/vendors" || path === "/admin/users" || path === "/admin/settings" || path === "/admin/approvals") {
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

    // Check if payments or users dropdown should be open based on current route
    const isPaymentsRouteActive = location.pathname.startsWith("/admin/payments");
    const isUsersRouteActive = location.pathname.startsWith("/admin/users");
    const isVendorsRouteActive = location.pathname.startsWith("/admin/vendors");
    const isBookingsRouteActive = location.pathname.startsWith("/admin/bookings");

    // Auto-open dropdowns if on their respective routes
    useEffect(() => {
        if (isPaymentsRouteActive) {
            setIsPaymentsOpen(true);
        }
        if (isUsersRouteActive) {
            setIsUsersOpen(true);
        }
        if (isVendorsRouteActive) {
            setIsVendorsOpen(true);
        }
        if (isBookingsRouteActive) {
            setIsBookingsOpen(true);
        }
    }, [isPaymentsRouteActive, isUsersRouteActive, isVendorsRouteActive, isBookingsRouteActive]);

    const overlay = `fixed inset-0 bg-black/30 z-40 transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`;

    const panel = `fixed left-0 top-0 h-full w-4/5 max-w-xs bg-gradient-to-b from-[#1a1f3a] to-[#2d3561] text-white z-50 shadow-xl p-5 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"
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
                            <h2 className="text-lg font-bold text-white">Jaladhaara</h2>
                            <p className="text-xs text-white/70 font-medium capitalize">
                                {admin?.role ? admin.role.replace(/_/g, ' ').toLowerCase() : "Admin Panel"}
                            </p>
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

                {/* Menu Items */}
                <nav className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {navItems
                        .filter(item => !item.roles || item.roles.includes(admin?.role))
                        .map(({ id, label, to, Icon }) => {
                            // Special handling for payments dropdown
                            if (id === "payments") {
                                const isActive = isPaymentsRouteActive;

                                return (
                                    <div key={id} className="flex flex-col">
                                        <button
                                            onClick={() => setIsPaymentsOpen(!isPaymentsOpen)}
                                            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 w-full ${isActive
                                                ? "bg-[#60A5FA] text-white shadow-md"
                                                : "text-white/70 hover:bg-white/10 hover:text-white"
                                                }`}
                                        >
                                            <Icon className="text-xl" />
                                            <span className="text-sm font-medium flex-1 text-left">{label}</span>
                                            {isPaymentsOpen ? (
                                                <IoChevronUpOutline className="text-lg" />
                                            ) : (
                                                <IoChevronDownOutline className="text-lg" />
                                            )}
                                        </button>

                                        {/* Dropdown Menu */}
                                        {isPaymentsOpen && (
                                            <div className="ml-4 mt-1 flex flex-col gap-1">
                                                <NavLink
                                                    to="/admin/payments/admin"
                                                    onClick={onClose}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                                            ? "bg-[#60A5FA] text-white shadow-md"
                                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                                        }`
                                                    }
                                                >
                                                    <IoBarChartOutline className="text-lg" />
                                                    <span className="text-sm font-medium">Admin</span>
                                                </NavLink>
                                                <NavLink
                                                    to="/admin/payments/user"
                                                    onClick={onClose}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                                            ? "bg-[#60A5FA] text-white shadow-md"
                                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                                        }`
                                                    }
                                                >
                                                    <IoPersonCircleOutline className="text-lg" />
                                                    <span className="text-sm font-medium">User</span>
                                                </NavLink>
                                                <NavLink
                                                    to="/admin/payments/vendor"
                                                    onClick={onClose}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                                            ? "bg-[#60A5FA] text-white shadow-md"
                                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                                        }`
                                                    }
                                                >
                                                    <IoPeopleOutline className="text-lg" />
                                                    <span className="text-sm font-medium">Vendor</span>
                                                </NavLink>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            // Special handling for vendors dropdown
                            if (id === "vendors") {
                                const isActive = isVendorsRouteActive;

                                return (
                                    <div key={id} className="flex flex-col">
                                        <button
                                            onClick={() => setIsVendorsOpen(!isVendorsOpen)}
                                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group w-full ${isActive
                                                ? "bg-[#60A5FA] text-white shadow-md shadow-[#60A5FA]/30"
                                                : "text-white/70 hover:bg-white/10 hover:text-white"
                                                }`}
                                        >
                                            <Icon className={`text-xl flex-shrink-0 ${isActive ? "text-white" : "text-white/70 group-hover:text-white"}`} />
                                            <span className="font-medium text-sm flex-1 text-left">{label}</span>
                                            {isVendorsOpen ? (
                                                <IoChevronUpOutline className="text-lg flex-shrink-0" />
                                            ) : (
                                                <IoChevronDownOutline className="text-lg flex-shrink-0" />
                                            )}
                                        </button>

                                        {/* Dropdown Menu */}
                                        {isVendorsOpen && (
                                            <div className="ml-4 mt-2 flex flex-col gap-1 border-l border-white/10 pl-2">
                                                <NavLink
                                                    to="/admin/vendors"
                                                    end
                                                    onClick={onClose}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                                            ? "bg-[#60A5FA] text-white shadow-md"
                                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                                        }`
                                                    }
                                                >
                                                    <IoPeopleOutline className="text-lg" />
                                                    <span className="text-sm font-medium">All Vendors</span>
                                                </NavLink>
                                                <NavLink
                                                    to="/admin/vendors/pending"
                                                    onClick={onClose}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                                            ? "bg-[#60A5FA] text-white shadow-md"
                                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                                        }`
                                                    }
                                                >
                                                    <IoDocumentTextOutline className="text-lg" />
                                                    <span className="text-sm font-medium">Pending Approvals</span>
                                                </NavLink>
                                                <NavLink
                                                    to="/admin/vendors/bookings"
                                                    onClick={onClose}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                                            ? "bg-[#60A5FA] text-white shadow-md"
                                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                                        }`
                                                    }
                                                >
                                                    <IoCalendarOutline className="text-lg" />
                                                    <span className="text-sm font-medium">Vendor Bookings</span>
                                                </NavLink>
                                                <NavLink
                                                    to="/admin/vendors/analytics"
                                                    onClick={onClose}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                                            ? "bg-[#60A5FA] text-white shadow-md"
                                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                                        }`
                                                    }
                                                >
                                                    <IoBarChartOutline className="text-lg" />
                                                    <span className="text-sm font-medium">Vendor Analytics</span>
                                                </NavLink>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            // Special handling for users dropdown
                            if (id === "users") {
                                const isActive = isUsersRouteActive;

                                return (
                                    <div key={id} className="flex flex-col">
                                        <button
                                            onClick={() => setIsUsersOpen(!isUsersOpen)}
                                            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 w-full ${isActive
                                                ? "bg-[#60A5FA] text-white shadow-md"
                                                : "text-white/70 hover:bg-white/10 hover:text-white"
                                                }`}
                                        >
                                            <IoPersonCircleOutline className="text-xl" />
                                            <span className="text-sm font-medium flex-1 text-left">{label}</span>
                                            {isUsersOpen ? (
                                                <IoChevronUpOutline className="text-lg" />
                                            ) : (
                                                <IoChevronDownOutline className="text-lg" />
                                            )}
                                        </button>

                                        {/* Dropdown Menu */}
                                        {isUsersOpen && (
                                            <div className="ml-4 mt-1 flex flex-col gap-1">
                                                <NavLink
                                                    to="/admin/users"
                                                    end
                                                    onClick={onClose}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                                            ? "bg-[#60A5FA] text-white shadow-md"
                                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                                        }`
                                                    }
                                                >
                                                    <IoPeopleOutline className="text-lg" />
                                                    <span className="text-sm font-medium">All Users</span>
                                                </NavLink>
                                                <NavLink
                                                    to="/admin/users/bookings"
                                                    onClick={onClose}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                                            ? "bg-[#60A5FA] text-white shadow-md"
                                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                                        }`
                                                    }
                                                >
                                                    <IoCalendarOutline className="text-lg" />
                                                    <span className="text-sm font-medium">User Bookings</span>
                                                </NavLink>
                                                <NavLink
                                                    to="/admin/users/transactions"
                                                    onClick={onClose}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                                            ? "bg-[#60A5FA] text-white shadow-md"
                                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                                        }`
                                                    }
                                                >
                                                    <IoCashOutline className="text-lg" />
                                                    <span className="text-sm font-medium">Transactions</span>
                                                </NavLink>
                                                <NavLink
                                                    to="/admin/users/analytics"
                                                    onClick={onClose}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                                            ? "bg-[#60A5FA] text-white shadow-md"
                                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                                        }`
                                                    }
                                                >
                                                    <IoBarChartOutline className="text-lg" />
                                                    <span className="text-sm font-medium">User Analytics</span>
                                                </NavLink>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            // Special handling for bookings dropdown
                            if (id === "bookings") {
                                const isActive = isBookingsRouteActive;

                                return (
                                    <div key={id} className="flex flex-col">
                                        <button
                                            onClick={() => setIsBookingsOpen(!isBookingsOpen)}
                                            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 w-full ${isActive
                                                ? "bg-[#60A5FA] text-white shadow-md"
                                                : "text-white/70 hover:bg-white/10 hover:text-white"
                                                }`}
                                        >
                                            <Icon className="text-xl" />
                                            <span className="text-sm font-medium flex-1 text-left">{label}</span>
                                            {isBookingsOpen ? (
                                                <IoChevronUpOutline className="text-lg" />
                                            ) : (
                                                <IoChevronDownOutline className="text-lg" />
                                            )}
                                        </button>

                                        {/* Dropdown Menu */}
                                        {isBookingsOpen && (
                                            <div className="ml-4 mt-1 flex flex-col gap-1">
                                                <NavLink
                                                    to="/admin/bookings"
                                                    end
                                                    onClick={onClose}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                                            ? "bg-[#60A5FA] text-white shadow-md"
                                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                                        }`
                                                    }
                                                >
                                                    <IoCalendarOutline className="text-lg" />
                                                    <span className="text-sm font-medium">All Bookings</span>
                                                </NavLink>
                                                <NavLink
                                                    to="/admin/bookings/tracking"
                                                    onClick={onClose}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                                            ? "bg-[#60A5FA] text-white shadow-md"
                                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                                        }`
                                                    }
                                                >
                                                    <IoRocketOutline className="text-lg" />
                                                    <span className="text-sm font-medium">Live Tracking</span>
                                                </NavLink>
                                                <NavLink
                                                    to="/admin/bookings/notifications"
                                                    onClick={onClose}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                                            ? "bg-[#60A5FA] text-white shadow-md"
                                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                                        }`
                                                    }
                                                >
                                                    <IoNotificationsOutline className="text-lg" />
                                                    <span className="text-sm font-medium">Booking Alerts</span>
                                                </NavLink>
                                                <NavLink
                                                    to="/admin/bookings/analytics"
                                                    onClick={onClose}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${isActive
                                                            ? "bg-[#60A5FA] text-white shadow-md"
                                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                                        }`
                                                    }
                                                >
                                                    <IoBarChartOutline className="text-lg" />
                                                    <span className="text-sm font-medium">Analytics</span>
                                                </NavLink>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            // Regular nav items
                            const isActive = checkIsActive(to);
                            const shouldEnd = to === "/admin/vendors" || to === "/admin/users" || to === "/admin/dashboard" || to === "/admin/settings" || to === "/admin/approvals";
                            return (
                                <NavLink
                                    key={id}
                                    to={to}
                                    end={shouldEnd}
                                    onClick={onClose}
                                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${isActive
                                        ? "bg-[#60A5FA] text-white shadow-md"
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

