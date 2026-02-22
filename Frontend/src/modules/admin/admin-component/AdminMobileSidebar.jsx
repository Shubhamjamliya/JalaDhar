import { useRef, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    IoCloseOutline,
    IoHomeOutline,
    IoPeopleOutline,
    IoDocumentTextOutline,
    IoPersonCircleOutline,
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
    IoLockClosedOutline,
    IoBusinessOutline,
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
            { label: "Market IQ", to: "/admin/reports/geo" },
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
];

export default function AdminMobileSidebar({ isOpen, onClose }) {
    const { logout, admin } = useAdminAuth();
    const location = useLocation();
    const [expandedItems, setExpandedItems] = useState({});

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

    // Close on route change
    useEffect(() => {
        onClose();
    }, [location.pathname]);

    const toggleExpand = (id) => {
        setExpandedItems(prev => ({ [id]: !prev[id] }));
    };

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99998] lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.aside
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed left-0 top-0 bottom-0 w-[280px] bg-slate-800 text-white z-[99999] lg:hidden shadow-2xl flex flex-col font-outfit"
                    >
                        {/* Header Section */}
                        <div className="px-5 py-6 border-b border-slate-700 bg-slate-900">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center">
                                        <IoShieldCheckmarkOutline className="text-xl text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-sm font-black text-white truncate">
                                            {admin?.name?.split(' ')[0] || "Admin"}
                                        </h2>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                            {admin?.role?.replace(/_/g, ' ') || "Admin"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                                >
                                    <IoCloseOutline className="text-2xl text-slate-400" />
                                </button>
                            </div>
                        </div>

                        {/* Navigation Menu */}
                        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
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
                                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group w-full ${isActive
                                                        ? "bg-blue-600/10 text-blue-400 font-bold"
                                                        : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                                                        }`}
                                                >
                                                    <Icon className={`text-lg ${isActive ? "text-blue-500" : "text-slate-500"}`} />
                                                    <span className="text-sm flex-1 text-left tracking-tight">{item.label}</span>
                                                    <motion.div
                                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <IoChevronDown className="text-slate-500 text-xs" />
                                                    </motion.div>
                                                </button>
                                            ) : (
                                                <NavLink
                                                    to={item.to}
                                                    end={item.to === "/admin/dashboard"}
                                                    onClick={onClose}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-bold"
                                                            : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                                                        }`
                                                    }
                                                >
                                                    <Icon className="text-lg" />
                                                    <span className="text-sm tracking-tight">{item.label}</span>
                                                </NavLink>
                                            )}

                                            <AnimatePresence>
                                                {hasChildren && isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="ml-6 mt-1 pl-4 border-l border-slate-700/50 space-y-1">
                                                            {item.children.map((child, idx) => (
                                                                <NavLink
                                                                    key={idx}
                                                                    to={child.to}
                                                                    end={child.end}
                                                                    onClick={onClose}
                                                                    className={({ isActive }) =>
                                                                        `block px-4 py-2 text-[13px] rounded-lg transition-colors ${isActive
                                                                            ? "text-blue-400 font-bold bg-blue-500/5"
                                                                            : "text-slate-500 hover:text-slate-300"
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
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
}

