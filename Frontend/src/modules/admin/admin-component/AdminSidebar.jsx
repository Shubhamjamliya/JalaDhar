import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    IoHomeOutline,
    IoPeopleOutline,
    IoDocumentTextOutline,
    IoPersonCircleOutline,
    IoShieldCheckmarkOutline,
    IoSettingsOutline,
    IoWalletOutline,
    IoCheckmarkCircleOutline,
    IoBarChartOutline,
    IoCalendarOutline,
    IoStarOutline,
    IoAlertCircleOutline,
    IoBusinessOutline,
    IoLockClosedOutline,
    IoNotificationsOutline,
    IoChevronDown,
} from "react-icons/io5";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";

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
        roles: ["ADMIN", "SUPER_ADMIN", "FINANCE_ADMIN", "OPERATIONS_ADMIN", "VERIFIER_ADMIN", "SUPPORT_ADMIN"],
        children: [
            { label: "All Vendors", to: "/admin/vendors", end: true },
            { label: "Pending Approvals", to: "/admin/vendors/pending" },
            { label: "Vendor Bookings", to: "/admin/vendors/bookings" },
            { label: "Vendor Analytics", to: "/admin/vendors/analytics" }
        ]
    },
    {
        id: "users",
        label: "Users",
        to: "/admin/users",
        Icon: IoPersonCircleOutline,
        roles: ["ADMIN", "SUPER_ADMIN", "FINANCE_ADMIN", "OPERATIONS_ADMIN", "VERIFIER_ADMIN", "SUPPORT_ADMIN"],
        children: [
            { label: "All Users", to: "/admin/users", end: true },
            { label: "User Bookings", to: "/admin/users/bookings" },
            { label: "Transactions", to: "/admin/users/transactions" },
            { label: "User Analytics", to: "/admin/users/analytics" }
        ]
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
        roles: ["ADMIN", "SUPER_ADMIN", "FINANCE_ADMIN", "OPERATIONS_ADMIN", "VERIFIER_ADMIN", "SUPPORT_ADMIN"],
        children: [
            { label: "All Bookings", to: "/admin/bookings", end: true },
            { label: "Live Tracking", to: "/admin/bookings/tracking" },
            { label: "Booking Alerts", to: "/admin/bookings/notifications" },
            { label: "Analytics", to: "/admin/bookings/analytics" }
        ]
    },
    {
        id: "payments",
        label: "Payments",
        to: "/admin/payments",
        Icon: IoWalletOutline,
        roles: ["SUPER_ADMIN", "FINANCE_ADMIN"],
        children: [
            { label: "Admin Payments", to: "/admin/payments/admin" },
            { label: "User Payments", to: "/admin/payments/user" },
            { label: "Vendor Payments", to: "/admin/payments/vendor" }
        ]
    },
    {
        id: "reports",
        label: "Reports",
        to: "/admin/reports",
        Icon: IoBarChartOutline,
        roles: ["SUPER_ADMIN", "FINANCE_ADMIN", "OPERATIONS_ADMIN"],
        children: [
            { label: "Overview", to: "/admin/reports", end: true },
            { label: "Revenue", to: "/admin/reports/revenue" },
            { label: "Bookings", to: "/admin/reports/bookings" },
            { label: "Payments", to: "/admin/reports/payments" },
            { label: "Vendors", to: "/admin/reports/vendors" }
        ]
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
        roles: ["SUPER_ADMIN"],
        children: [
            { label: "General", to: "/admin/settings/general" },
            { label: "Billing Info", to: "/admin/settings/billing" },
            { label: "Pricing", to: "/admin/settings/pricing" },
            { label: "Security", to: "/admin/settings/security" },
            { label: "Register Admin", to: "/admin/settings/register" }
        ]
    },
];

export default function AdminSidebar() {
    const { logout, admin } = useAdminAuth();
    const location = useLocation();
    const [expandedItems, setExpandedItems] = useState({});
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Auto-expand based on route
    useEffect(() => {
        const currentPath = location.pathname;
        const activeParent = navItems.find(item =>
            item.children && item.children.some(child =>
                child.to === currentPath || currentPath.startsWith(child.to + "/")
            )
        );
        if (activeParent) {
            setExpandedItems(prev => ({ ...prev, [activeParent.id]: true }));
        }
    }, [location.pathname]);

    const toggleExpand = (id) => {
        setExpandedItems(prev => ({ [id]: !prev[id] })); // Accordion style
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-[278px] bg-slate-800 text-white z-40 shadow-2xl hidden lg:flex flex-col font-outfit">
            {/* Header Section */}
            <div className="px-5 py-8 border-b border-slate-700 bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                            <IoShieldCheckmarkOutline className="text-2xl text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full shadow-sm"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-black text-white truncate leading-tight tracking-tight">
                            {admin?.name || "Admin User"}
                        </h2>
                        <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-md bg-blue-500/10 text-[10px] font-black text-blue-400 uppercase tracking-widest border border-blue-500/20">
                            {admin?.role?.replace(/_/g, ' ') || "Admin"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar scrollbar-hide">
                {navItems
                    .filter(item => !item.roles || item.roles.includes(admin?.role))
                    .map((item) => {
                        const hasChildren = item.children && item.children.length > 0;
                        const isExpanded = expandedItems[item.id];
                        const isActive = location.pathname.startsWith(item.to);
                        const Icon = item.Icon;

                        return (
                            <div key={item.id} className="flex flex-col">
                                {hasChildren ? (
                                    <button
                                        onClick={() => toggleExpand(item.id)}
                                        className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 group w-full ${isActive
                                            ? "bg-blue-600/10 text-blue-400"
                                            : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                                            }`}
                                    >
                                        <Icon className={`text-xl transition-colors ${isActive ? "text-blue-500" : "text-slate-500 group-hover:text-slate-300"}`} />
                                        <span className="font-bold text-[13px] flex-1 text-left tracking-tight">{item.label}</span>
                                        <motion.div
                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <IoChevronDown className="text-slate-500 text-sm" />
                                        </motion.div>
                                    </button>
                                ) : (
                                    <NavLink
                                        to={item.to}
                                        end={item.to === "/admin/dashboard" || item.to === "/admin/approvals"}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                                                ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20"
                                                : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                                            }`
                                        }
                                    >
                                        <Icon className="text-xl" />
                                        <span className="font-bold text-[13px] tracking-tight">{item.label}</span>
                                    </NavLink>
                                )}

                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                    {hasChildren && isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="ml-[22px] mt-1 pl-6 border-l-2 border-slate-700/50 space-y-1 py-1">
                                                {item.children.map((child, idx) => (
                                                    <NavLink
                                                        key={idx}
                                                        to={child.to}
                                                        end={child.end}
                                                        className={({ isActive }) =>
                                                            `block px-4 py-2.5 text-[12px] font-bold rounded-xl transition-all duration-200 ${isActive
                                                                ? "text-blue-400 bg-blue-500/5"
                                                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-700/30"
                                                            }`
                                                        }
                                                    >
                                                        {child.label}
                                                    </NavLink>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
            </nav>
        </aside>
    );
}
