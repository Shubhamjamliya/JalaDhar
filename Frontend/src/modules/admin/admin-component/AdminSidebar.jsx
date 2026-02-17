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
    IoStarOutline,
    IoAlertCircleOutline,
    IoBuildOutline,
    IoBusinessOutline,
    IoCashOutline,
    IoLockClosedOutline,
    IoPersonAddOutline,
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
        label: "All Vendors",
        to: "/admin/vendors",
        Icon: IoPeopleOutline,
        roles: ["ADMIN", "SUPER_ADMIN", "FINANCE_ADMIN", "OPERATIONS_ADMIN", "VERIFIER_ADMIN", "SUPPORT_ADMIN"]
    },
    {
        id: "pending",
        label: "Pending Vendor Approvals",
        to: "/admin/vendors/pending",
        Icon: IoDocumentTextOutline,
        roles: ["SUPER_ADMIN", "VERIFIER_ADMIN"]
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
        id: "policies",
        label: "Policies",
        to: "/admin/policies",
        Icon: IoDocumentTextOutline,
        roles: ["SUPER_ADMIN", "ADMIN"]
    },
    {
        id: "settings",
        label: "Settings",
        to: "/admin/settings",
        Icon: IoSettingsOutline,
        roles: ["SUPER_ADMIN"]
    },
];

export default function AdminSidebar() {
    const { logout, admin } = useAdminAuth();
    const location = useLocation();
    const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Helper function to check if a route is active
    const checkIsActive = (path) => {
        const currentPath = location.pathname;

        // For routes that should match exactly
        if (path === "/admin/dashboard" || path === "/admin/vendors" || path === "/admin/users" || path === "/admin/settings" || path === "/admin/approvals" || path === "/admin/bookings" || path === "/admin/ratings" || path === "/admin/disputes" || path === "/admin/policies") {
            return currentPath === path || currentPath === path + "/";
        }

        // For pending, match the path and sub-routes
        if (path === "/admin/vendors/pending") {
            return currentPath === path || currentPath.startsWith(path + "/");
        }

        // For bookings, match the path and booking details sub-routes
        if (path === "/admin/bookings") {
            return currentPath === path || currentPath === path + "/" || currentPath.startsWith(path + "/");
        }

        // For payments, check if any payment route is active
        if (path === "/admin/payments" || path.startsWith("/admin/payments/")) {
            return currentPath.startsWith("/admin/payments");
        }

        return false;
    };

    // Check if payments or settings dropdown should be open based on current route
    const isPaymentsRouteActive = location.pathname.startsWith("/admin/payments");
    const isSettingsRouteActive = location.pathname.startsWith("/admin/settings");

    // Auto-open dropdowns if on their respective routes
    useEffect(() => {
        if (isPaymentsRouteActive) {
            setIsPaymentsOpen(true);
        }
        if (isSettingsRouteActive) {
            setIsSettingsOpen(true);
        }
    }, [isPaymentsRouteActive, isSettingsRouteActive]);

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-[#1a1f3a] to-[#2d3561] text-white z-40 shadow-2xl flex flex-col">
            {/* Logo Section */}
            <div className="flex items-center gap-3 p-6 border-b border-white/10">
                <div className="w-10 h-10 rounded-lg bg-[#0A84FF] flex items-center justify-center flex-shrink-0">
                    <IoShieldCheckmarkOutline className="text-xl text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white">Jaladhaara</h1>
                    <p className="text-xs text-white/70 font-medium capitalize">
                        {admin?.role ? admin.role.replace(/_/g, ' ').toLowerCase() : "Admin Panel"}
                    </p>
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex flex-col gap-2 p-4 mt-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {navItems
                    .filter(item => !item.roles || item.roles.includes(admin?.role))
                    .map((item) => {
                        // Special handling for payments dropdown
                        if (item.id === "payments") {
                            const isActive = isPaymentsRouteActive;
                            const Icon = item.Icon;

                            return (
                                <div key={item.id} className="flex flex-col">
                                    <button
                                        onClick={() => setIsPaymentsOpen(!isPaymentsOpen)}
                                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group w-full ${isActive
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
                                                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${isActive
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
                                                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${isActive
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
                                                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${isActive
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

                        // Special handling for settings dropdown
                        if (item.id === "settings") {
                            const isActive = isSettingsRouteActive;
                            const Icon = item.Icon;

                            return (
                                <div key={item.id} className="flex flex-col">
                                    <button
                                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group w-full ${isActive
                                            ? "bg-[#60A5FA] text-white shadow-lg shadow-[#60A5FA]/30"
                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                            }`}
                                    >
                                        <Icon className={`text-xl flex-shrink-0 ${isActive ? "text-white" : "text-white/70 group-hover:text-white"}`} />
                                        <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
                                        {isSettingsOpen ? (
                                            <IoChevronUpOutline className="text-lg flex-shrink-0" />
                                        ) : (
                                            <IoChevronDownOutline className="text-lg flex-shrink-0" />
                                        )}
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isSettingsOpen && (
                                        <div className="ml-4 mt-2 flex flex-col gap-1">
                                            <NavLink
                                                to="/admin/settings/general"
                                                className={({ isActive }) =>
                                                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                                        ? "bg-[#60A5FA] text-white shadow-md"
                                                        : "text-white/70 hover:bg-white/10 hover:text-white"
                                                    }`
                                                }
                                            >
                                                <IoBuildOutline className="text-lg flex-shrink-0" />
                                                <span className="font-medium text-sm">General</span>
                                            </NavLink>
                                            <NavLink
                                                to="/admin/settings/billing"
                                                className={({ isActive }) =>
                                                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                                        ? "bg-[#60A5FA] text-white shadow-md"
                                                        : "text-white/70 hover:bg-white/10 hover:text-white"
                                                    }`
                                                }
                                            >
                                                <IoBusinessOutline className="text-lg flex-shrink-0" />
                                                <span className="font-medium text-sm">Billing Info</span>
                                            </NavLink>
                                            <NavLink
                                                to="/admin/settings/pricing"
                                                className={({ isActive }) =>
                                                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                                        ? "bg-[#60A5FA] text-white shadow-md"
                                                        : "text-white/70 hover:bg-white/10 hover:text-white"
                                                    }`
                                                }
                                            >
                                                <IoCashOutline className="text-lg flex-shrink-0" />
                                                <span className="font-medium text-sm">Pricing</span>
                                            </NavLink>
                                            <NavLink
                                                to="/admin/settings/security"
                                                className={({ isActive }) =>
                                                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                                        ? "bg-[#60A5FA] text-white shadow-md"
                                                        : "text-white/70 hover:bg-white/10 hover:text-white"
                                                    }`
                                                }
                                            >
                                                <IoLockClosedOutline className="text-lg flex-shrink-0" />
                                                <span className="font-medium text-sm">Security</span>
                                            </NavLink>
                                            <NavLink
                                                to="/admin/settings/register"
                                                className={({ isActive }) =>
                                                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                                        ? "bg-[#60A5FA] text-white shadow-md"
                                                        : "text-white/70 hover:bg-white/10 hover:text-white"
                                                    }`
                                                }
                                            >
                                                <IoPersonAddOutline className="text-lg flex-shrink-0" />
                                                <span className="font-medium text-sm">Register Admin</span>
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
                        // Note: bookings should NOT use end because it has sub-routes (booking details)
                        const shouldEnd = item.to === "/admin/vendors" || item.to === "/admin/users" || item.to === "/admin/dashboard" || item.to === "/admin/settings" || item.to === "/admin/approvals" || item.to === "/admin/policies";

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

        </aside>
    );
}
