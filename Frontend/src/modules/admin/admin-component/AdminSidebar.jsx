import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    IoHomeOutline,
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
    IoChevronDown,
} from "react-icons/io5";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import { hasAdminPermission } from "../../../utils/permissionUtils";
import api from "../../../services/api";

const navSections = [
    {
        section: "CORE OPERATIONS",
        items: [
            {
                id: "dashboard",
                label: "Dashboard",
                to: "/admin/dashboard",
                Icon: IoHomeOutline,
                roles: ["ADMIN", "SUPER_ADMIN", "FINANCE_ADMIN", "OPERATIONS_ADMIN", "EXPERT_VERIFICATION_ADMIN", "VERIFIER_ADMIN", "SUPPORT_ADMIN", "QC_ADMIN"]
            },
            {
                id: "vendors",
                label: "Experts",
                to: "/admin/vendors",
                Icon: IoBusinessOutline,
                permission: "verification",
                roles: ["SUPER_ADMIN", "EXPERT_VERIFICATION_ADMIN", "VERIFIER_ADMIN"],
                children: [
                    { label: "All Experts", to: "/admin/vendors", end: true },
                    { label: "KYC & Approvals", to: "/admin/vendors/pending" },
                    { label: "Wallets & Settlements", to: "/admin/vendors/wallets" },
                    { label: "Performance Analytics", to: "/admin/vendors/analytics" }
                ]
            },
            {
                id: "users",
                label: "Users",
                to: "/admin/users",
                Icon: IoPersonCircleOutline,
                permission: "operations",
                roles: ["SUPER_ADMIN", "OPERATIONS_ADMIN", "SUPPORT_ADMIN"],
                children: [
                    { label: "All Users", to: "/admin/users", end: true },
                    { label: "User Bookings", to: "/admin/users/bookings" },
                    { label: "User Wallets & Refunds", to: "/admin/users/transactions" },
                    { label: "User Analytics", to: "/admin/users/analytics" }
                ]
            },
            {
                id: "approvals",
                label: "Approvals",
                to: "/admin/approvals",
                Icon: IoCheckmarkCircleOutline,
                permission: "qc",
                roles: ["SUPER_ADMIN", "EXPERT_VERIFICATION_ADMIN", "VERIFIER_ADMIN", "QC_ADMIN"]
            },
            {
                id: "bookings",
                label: "Bookings",
                to: "/admin/bookings",
                Icon: IoCalendarOutline,
                permission: "operations",
                roles: ["SUPER_ADMIN", "OPERATIONS_ADMIN"],
                children: [
                    { label: "All Bookings", to: "/admin/bookings", end: true },
                    { label: "Live GPS Tracking", to: "/admin/bookings/tracking" },
                    { label: "Booking Alerts", to: "/admin/bookings/notifications" },
                    { label: "Booking Analytics", to: "/admin/bookings/analytics" }
                ]
            },
        ]
    },
    {
        section: "FINANCE & INTELLIGENCE",
        items: [
            {
                id: "payments",
                label: "Payments",
                to: "/admin/payments",
                Icon: IoWalletOutline,
                permission: "finance",
                roles: ["SUPER_ADMIN", "FINANCE_ADMIN"],
                children: [
                    { label: "All Transactions", to: "/admin/payments", end: true },
                    { label: "Expert Disbursals", to: "/admin/withdrawals" },
                    { label: "User Refunds & Claims", to: "/admin/user-withdrawals" }
                ]
            },
            {
                id: "reports",
                label: "Reports",
                to: "/admin/reports",
                Icon: IoBarChartOutline,
                permission: "reports",
                roles: ["SUPER_ADMIN", "FINANCE_ADMIN", "OPERATIONS_ADMIN", "QC_ADMIN"],
                children: [
                    { label: "Executive Overview", to: "/admin/reports", end: true },
                    { label: "Market IQ & Geo Heatmaps", to: "/admin/reports/geo" },
                    { label: "Revenue & Settlements", to: "/admin/reports/revenue" },
                    { label: "Bookings & Cancellations", to: "/admin/reports/bookings" },
                    { label: "Expert & User Performance", to: "/admin/reports/vendors" }
                ]
            },
            {
                id: "ratings",
                label: "Ratings & Reviews",
                to: "/admin/ratings",
                Icon: IoStarOutline,
                permission: "support",
                roles: ["SUPER_ADMIN", "SUPPORT_ADMIN"]
            },
            {
                id: "disputes",
                label: "Disputes & Support",
                to: "/admin/disputes",
                Icon: IoAlertCircleOutline,
                permission: "support",
                roles: ["SUPER_ADMIN", "SUPPORT_ADMIN"]
            },
            {
                id: "agreement-logs",
                label: "Audit Logs",
                to: "/admin/agreements",
                Icon: IoShieldCheckmarkOutline,
                permission: "settings",
                roles: ["SUPER_ADMIN", "QC_ADMIN"],
                children: [
                    { label: "User Agreement Logs", to: "/admin/agreements" },
                    { label: "Expert Agreement Logs", to: "/admin/expert-agreements" },
                    { label: "Survey OTP Audit Logs", to: "/admin/otp-logs" }
                ]
            },
        ]
    },
    {
        section: "SYSTEM CONFIG",
        items: [
            {
                id: "team",
                label: "Admin Management",
                to: "/admin/team",
                Icon: IoLockClosedOutline,
                roles: ["SUPER_ADMIN"]
            },
            {
                id: "policies",
                label: "Content & Policies",
                to: "/admin/policies",
                Icon: IoDocumentTextOutline,
                permission: "settings",
                roles: ["SUPER_ADMIN"],
                children: [
                    { label: "Terms & Conditions", to: "/admin/policies/legal" },
                    { label: "Privacy Policy", to: "/admin/policies/privacy" },
                    { label: "Cancellation & Refunds", to: "/admin/policies/cancellation" },
                    { label: "Expert Agreement", to: "/admin/policies/expert" }
                ]
            },
            {
                id: "settings",
                label: "Settings",
                to: "/admin/settings",
                Icon: IoSettingsOutline,
                permission: "settings",
                roles: ["SUPER_ADMIN"],
                children: [
                    { label: "General & App Info", to: "/admin/settings/general" },
                    { label: "Pricing & Quality Gate", to: "/admin/settings/pricing" },
                    { label: "Billing & GST Declarations", to: "/admin/settings/billing" },
                    { label: "Languages", to: "/admin/settings/languages" },
                    { label: "Security & Integrations", to: "/admin/settings/security" }
                ]
            },
        ]
    }
];

export default function AdminSidebar() {
    const { admin, refreshProfile } = useAdminAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [expandedItems, setExpandedItems] = useState({});
    const [counts, setCounts] = useState({
        approvals: 0,
        disputes: 0,
        payments: 0,
        bookings: 0
    });

    useEffect(() => {
        let isMounted = true;
        const fetchCounts = async () => {
            try {
                const res = await api.get('/admin/dashboard/sidebar-counts');
                if (isMounted && res.data?.data?.counts) {
                    setCounts(res.data.data.counts);
                }
            } catch (err) {
                console.error("Failed to fetch admin sidebar counts", err);
            }
        };

        fetchCounts();
        if (refreshProfile) refreshProfile();

        const interval = setInterval(() => {
            fetchCounts();
            if (refreshProfile) refreshProfile();
        }, 20000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [refreshProfile]);

    // Auto-expand based on route
    useEffect(() => {
        const currentPath = location.pathname;
        for (const section of navSections) {
            const activeParent = section.items.find(item =>
                item.children && item.children.some(child =>
                    child.to === currentPath || currentPath.startsWith(child.to + "/")
                )
            );
            if (activeParent) {
                setExpandedItems(prev => ({ ...prev, [activeParent.id]: true }));
                break;
            }
        }
    }, [location.pathname]);

    const toggleExpand = (id, to, e) => {
        // Navigate to the parent route
        if (to) navigate(to);
        setExpandedItems(prev => {
            const isNowExpanded = !prev[id];
            if (isNowExpanded && e?.currentTarget) {
                const containerEl = e.currentTarget.parentElement;
                setTimeout(() => {
                    containerEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 120);
            }
            return { [id]: isNowExpanded };
        });
    };

    const renderBadge = (id) => {
        const val = counts[id];
        if (!val || val <= 0) return null;

        let badgeStyle = "bg-blue-500/20 text-blue-400 border-blue-500/30";
        if (id === "approvals") badgeStyle = "bg-amber-500/20 text-amber-400 border-amber-500/30";
        if (id === "disputes") badgeStyle = "bg-rose-500/20 text-rose-400 border-rose-500/30";
        if (id === "payments") badgeStyle = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
        if (id === "bookings") badgeStyle = "bg-sky-500/20 text-sky-400 border-sky-500/30";

        return (
            <span className={`px-1.5 py-0.2 text-[10px] font-black rounded-full border shadow-sm ${badgeStyle}`}>
                {val > 99 ? '99+' : val}
            </span>
        );
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-[264px] bg-slate-900 text-white z-40 shadow-2xl hidden lg:flex flex-col font-outfit border-r border-slate-800/80 select-none">
            {/* Compact Header Section */}
            <div className="px-4 py-4 border-b border-slate-800 bg-slate-950/60 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-md shadow-blue-500/20">
                            <IoShieldCheckmarkOutline className="text-lg text-white" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-bold text-white truncate leading-tight">
                            {admin?.name || "Super Admin"}
                        </h2>
                        <span className="inline-flex items-center px-1.5 py-0.5 mt-0.5 rounded bg-blue-500/15 text-[9px] font-black text-blue-400 uppercase tracking-wider border border-blue-500/20">
                            {admin?.role?.replace(/_/g, ' ') || "Admin"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation Menu (Ergonomic & Space-Efficient) */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-3.5 custom-scrollbar scrollbar-hide overscroll-contain">
                {navSections.map((section, sIdx) => {
                    const visibleItems = section.items.filter(item => {
                        if (admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN') return true;
                        if (item.id === "team") return false;
                        return hasAdminPermission(admin, item.id) || (item.permission && hasAdminPermission(admin, item.permission));
                    });
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={sIdx} className="space-y-0.5">
                            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {section.section}
                            </div>

                            {visibleItems.map((item) => {
                                const hasChildren = item.children && item.children.length > 0;
                                const isExpanded = expandedItems[item.id];
                                const isActive = location.pathname.startsWith(item.to);
                                const Icon = item.Icon;

                                return (
                                    <div key={item.id} className="flex flex-col">
                                        {hasChildren ? (
                                            <button
                                                type="button"
                                                onClick={(e) => toggleExpand(item.id, item.to, e)}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 group w-full cursor-pointer ${
                                                    isActive
                                                        ? "bg-blue-600/15 text-blue-400 font-semibold"
                                                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                                                }`}
                                            >
                                                <Icon className={`text-lg flex-shrink-0 transition-colors ${isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"}`} />
                                                <span className="font-semibold text-[13px] flex-1 text-left tracking-tight truncate">{item.label}</span>
                                                {renderBadge(item.id)}
                                                <motion.div
                                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="flex-shrink-0"
                                                >
                                                    <IoChevronDown className="text-slate-400 text-xs ml-0.5" />
                                                </motion.div>
                                            </button>
                                        ) : (
                                            <NavLink
                                                to={item.to}
                                                end={item.to === "/admin/dashboard" || item.to === "/admin/approvals" || item.to === "/admin/team"}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 group ${
                                                        isActive
                                                            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold shadow-sm shadow-blue-600/30"
                                                            : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                                                    }`
                                                }
                                            >
                                                <Icon className="text-lg flex-shrink-0" />
                                                <span className="font-semibold text-[13px] tracking-tight flex-1 truncate">{item.label}</span>
                                                {renderBadge(item.id)}
                                            </NavLink>
                                        )}

                                        {/* Dropdown Menu */}
                                        <AnimatePresence>
                                            {hasChildren && isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="ml-4 mt-0.5 pl-3 border-l border-slate-700/60 space-y-0.5 py-1">
                                                        {item.children.map((child, idx) => {
                                                            let childCount = 0;
                                                            let childBadgeStyle = "bg-blue-500/20 text-blue-400 border-blue-500/30";
                                                            if (child.to === "/admin/vendors/pending") {
                                                                childCount = counts.approvals;
                                                                childBadgeStyle = "bg-amber-500/20 text-amber-400 border-amber-500/30";
                                                            } else if (child.to === "/admin/withdrawals") {
                                                                childCount = counts.payments;
                                                                childBadgeStyle = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
                                                            } else if (child.to === "/admin/bookings" && child.end) {
                                                                childCount = counts.bookings;
                                                                childBadgeStyle = "bg-sky-500/20 text-sky-400 border-sky-500/30";
                                                            }

                                                            return (
                                                                <NavLink
                                                                    key={idx}
                                                                    to={child.to}
                                                                    end={child.end}
                                                                    className={({ isActive }) =>
                                                                        `flex items-center justify-between px-2.5 py-1.5 text-[12px] font-medium rounded-lg transition-all duration-150 ${
                                                                            isActive
                                                                                ? "text-blue-400 bg-blue-500/10 font-bold"
                                                                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                                                                        }`
                                                                    }
                                                                >
                                                                    <span className="truncate">{child.label}</span>
                                                                    {childCount > 0 && (
                                                                        <span className={`px-1.5 py-0.2 text-[9px] font-black rounded-full border shadow-sm ${childBadgeStyle}`}>
                                                                            {childCount > 99 ? '99+' : childCount}
                                                                        </span>
                                                                    )}
                                                                </NavLink>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}
