import { useRef, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
    IoCloseOutline, 
    IoLogOutOutline, 
    IoCheckmarkCircle, 
    IoPersonOutline,
    IoHomeOutline,
    IoMapOutline,
    IoTimeOutline,
    IoStarOutline,
    IoWalletOutline,
    IoNotificationsOutline,
    IoHelpBuoyOutline,
    IoDocumentTextOutline,
    IoShieldCheckmarkOutline,
    IoSettingsOutline,
    IoInformationCircleOutline
} from "react-icons/io5";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import ConfirmModal from "../../shared/components/ConfirmModal";

export default function VendorSidebar({ isOpen, onClose }) {
    const closeRef = useRef(null);
    const location = useLocation();
    const { logout, vendor } = useVendorAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Body scroll lock & ESC key listener for accessibility
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = "hidden";
            closeRef.current?.focus();
            window.addEventListener("keydown", handleKeyDown);
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    const handleLogoutClick = () => {
        onClose();
        setShowLogoutConfirm(true);
    };

    const handleLogoutConfirm = async () => {
        setShowLogoutConfirm(false);
        await logout();
    };

    const menuGroups = [
        {
            title: "Dashboard",
            items: [
                { label: "Home", to: "/vendor/dashboard", icon: IoHomeOutline, exact: true }
            ]
        },
        {
            title: "My Account",
            items: [
                { label: "My Profile", to: "/vendor/profile", icon: IoPersonOutline, exact: true }
            ]
        },
        {
            title: "Earnings",
            items: [
                { label: "Wallet", to: "/vendor/wallet", icon: IoWalletOutline, exact: true }
            ]
        },
        {
            title: "Support",
            items: [
                { label: "Notifications", to: "/vendor/notifications", icon: IoNotificationsOutline },
                { label: "Help & Support", to: "/vendor/disputes", icon: IoHelpBuoyOutline }
            ]
        },
        {
            title: "Legal & Policies",
            items: [
                { label: "Expert Agreement", to: "/vendor/agreement", icon: IoDocumentTextOutline },
                { label: "Privacy Policy", to: "/vendor/privacy", icon: IoShieldCheckmarkOutline },
                { label: "Terms & Conditions", to: "/vendor/terms", icon: IoDocumentTextOutline },
                { label: "Insurance Details", to: "/vendor/insurance", icon: IoDocumentTextOutline }
            ]
        },
        {
            title: "Settings",
            items: [
                { label: "Settings", to: "/vendor/settings", icon: IoSettingsOutline },
                { label: "About Jaladhaara", to: "/vendor/about", icon: IoInformationCircleOutline }
            ]
        }
    ];

    return (
        <>
            {/* Backdrop Overlay */}
            <div
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] transition-opacity duration-300 ${
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sidebar Drawer Panel */}
            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Expert Menu"
                className={`fixed right-0 top-0 h-full w-[300px] sm:w-[320px] bg-white z-[100] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                {/* Fixed Header */}
                <div className="p-5 shrink-0 bg-white">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-[22px] font-black text-[#0A84FF] tracking-tight">
                            Expert Menu
                        </h2>

                        <button
                            ref={closeRef}
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors active:scale-95 cursor-pointer"
                            aria-label="Close Menu"
                        >
                            <IoCloseOutline className="text-xl" />
                        </button>
                    </div>

                    {/* Expert Profile Card */}
                    {vendor && (
                        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-[#F0F7FF] border border-[#D0E7FF] shadow-xs space-y-3">
                            {/* Section Header */}
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                    <span className="text-xs">👤</span> EXPERT PROFILE
                                </span>
                                {vendor.isApproved !== false && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#0A84FF] border border-blue-200">
                                        <IoCheckmarkCircle className="text-xs text-[#0A84FF]" /> Verified Expert
                                    </span>
                                )}
                            </div>

                            {/* Name, ID & Availability */}
                            <div className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                    <div className="w-11 h-11 rounded-full bg-[#0A84FF] text-white flex items-center justify-center font-bold text-base shadow-xs border-2 border-white">
                                        {vendor.name ? vendor.name.charAt(0).toUpperCase() : <IoPersonOutline />}
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" title="Active & Available" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-slate-900 truncate">
                                        {vendor.name || "Expert Partner"}
                                    </h3>
                                    <p className="text-[11px] font-semibold text-slate-500 truncate">
                                        ID: {vendor.expertId || vendor.phone || "EXP-9123456789"}
                                    </p>
                                    <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>Status: Active &amp; Available</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Scrollable Navigation Menu Items */}
                <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
                    <div className="flex flex-col gap-6 pb-6">
                        {menuGroups.map((group, groupIdx) => (
                            <div key={groupIdx} className="space-y-3">
                                <h4 className="text-[11px] font-black text-[#8E939C] uppercase tracking-[0.1em] px-2">
                                    {group.title}
                                </h4>
                                <nav className="flex flex-col gap-1">
                                    {group.items.map((item, itemIdx) => {
                                        const Icon = item.icon;
                                        
                                        // Determine active state manually to handle hash links correctly
                                        const isHashLink = item.to.includes('#');
                                        const isActive = isHashLink 
                                            ? location.pathname + location.hash === item.to
                                            : location.pathname === item.to && (!item.exact || !location.hash);

                                        return (
                                            <NavLink
                                                key={itemIdx}
                                                to={item.to}
                                                onClick={onClose}
                                                className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all duration-200 group active:scale-[0.98] ${
                                                    isActive
                                                        ? "bg-[#E3F2FD] font-bold text-[#0A84FF]"
                                                        : "hover:bg-slate-50 text-slate-600 font-semibold hover:text-slate-900"
                                                }`}
                                            >
                                                <Icon className={`text-lg transition-colors ${
                                                    isActive ? "text-[#0A84FF]" : "text-gray-400 group-hover:text-blue-500"
                                                }`} />
                                                <span className="text-sm tracking-wide">
                                                    {item.label}
                                                </span>
                                            </NavLink>
                                        );
                                    })}
                                </nav>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Logout Button (Inside Scrollable Area for exact match) */}
                <div className="px-5 pb-8 bg-white shrink-0">
                    <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-red-200 hover:bg-red-50 text-slate-800 font-bold transition-all duration-200 group active:scale-[0.98] cursor-pointer"
                    >
                        <IoLogOutOutline className="text-2xl text-[#FF3B30]" />
                        <span className="text-[15px]">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Logout Confirmation Modal */}
            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogoutConfirm}
                title="Logout Confirmation"
                message="Are you sure you want to log out of your expert account?"
                confirmText="Yes, Logout"
                cancelText="Cancel"
                confirmColor="danger"
            />
        </>
    );
}
