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
    IoInformationCircleOutline,
    IoGiftOutline,
    IoChevronForwardOutline,
    IoSparkles,
    IoAlertCircleOutline,
    IoGlobeOutline,
    IoChevronDown
} from "react-icons/io5";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import ConfirmModal from "../../shared/components/ConfirmModal";

export default function VendorSidebar({ isOpen, onClose }) {
    const closeRef = useRef(null);
    const langDropdownRef = useRef(null);
    const location = useLocation();
    const { logout, vendor } = useVendorAuth();
    const { language, setLanguage, supportedLanguages, isLanguageEnabled } = useLanguage();
    const currentLangObj = supportedLanguages.find(l => l.code === language) || supportedLanguages[0];
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [langAccordionOpen, setLangAccordionOpen] = useState(false);

    // Close language dropdown on outside click or touch
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
                setShowLangMenu(false);
            }
        };

        if (showLangMenu) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [showLangMenu]);

    // Reset dropdowns when sidebar closes
    useEffect(() => {
        if (!isOpen) {
            setShowLangMenu(false);
            setLangAccordionOpen(false);
        }
    }, [isOpen]);

    // Auto-close on route change
    useEffect(() => {
        if (isOpen) {
            onClose();
        }
    }, [location.pathname, location.search]);

    // Body & HTML scroll lock & ESC key listener for accessibility
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            const originalBodyOverflow = document.body.style.overflow;
            const originalHtmlOverflow = document.documentElement.style.overflow;
            const originalTouchAction = document.body.style.touchAction;

            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";
            document.body.style.touchAction = "none";

            closeRef.current?.focus();
            window.addEventListener("keydown", handleKeyDown);

            return () => {
                document.body.style.overflow = originalBodyOverflow;
                document.documentElement.style.overflow = originalHtmlOverflow;
                document.body.style.touchAction = originalTouchAction;
                window.removeEventListener("keydown", handleKeyDown);
            };
        }
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
            title: "Earnings & Benefits",
            items: [
                { label: "Payments & Wallet", to: "/vendor/wallet", icon: IoWalletOutline, exact: true },
                { 
                    label: "Rewards & Benefits", 
                    to: "/vendor/rewards", 
                    icon: IoGiftOutline, 
                    exact: true,
                    highlight: true,
                    showChevron: true,
                    badge: "10 Surveys"
                }
            ]
        },
        {
            title: "Support & Ratings",
            items: [
                { label: "24/7 AI Expert Chat", to: "/vendor/support-chat", icon: IoSparkles, highlight: true },
                { label: "Help & FAQs", to: "/vendor/help", icon: IoHelpBuoyOutline },
                { label: "Resolution & Disputes", to: "/vendor/disputes", icon: IoAlertCircleOutline },
                { label: "Ratings & Reviews", to: "/vendor/reviews", icon: IoStarOutline },
                { label: "Notifications", to: "/vendor/notifications", icon: IoNotificationsOutline }
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
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] transition-opacity duration-300 touch-none ${
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={onClose}
                onTouchMove={(e) => e.preventDefault()}
                aria-hidden="true"
            />

            {/* Sidebar Drawer Panel */}
            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Expert Menu"
                className={`fixed right-0 top-0 h-full w-[300px] sm:w-[320px] bg-white z-[100] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col overscroll-contain ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                {/* Fixed Header */}
                <div className="p-5 shrink-0 bg-white">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-[20px] font-black text-[#0A84FF] tracking-tight">
                            Expert Menu
                        </h2>

                        <div className="flex items-center gap-2">
                            {/* Language Switcher Pill */}
                            {isLanguageEnabled && (
                                <div className="relative" ref={langDropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => setShowLangMenu((prev) => !prev)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-xs font-bold text-slate-700 hover:border-blue-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                                        title="Change Language"
                                        aria-label="Change Language"
                                    >
                                        <IoGlobeOutline className="text-[#0A84FF] text-base shrink-0" />
                                        <span className="text-xs font-bold text-slate-700">{currentLangObj.nativeName}</span>
                                    </button>

                                    {showLangMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 space-y-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 custom-scrollbar">
                                            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
                                                <span>Select Language</span>
                                                <span className="text-[10px] text-slate-400 font-medium">भाषा चुनें</span>
                                            </div>
                                            {supportedLanguages.map((lang) => {
                                                const isSelected = language === lang.code;
                                                return (
                                                    <button
                                                        key={lang.code}
                                                        type="button"
                                                        onClick={() => {
                                                            setLanguage(lang.code);
                                                            setShowLangMenu(false);
                                                        }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer ${
                                                            isSelected
                                                                ? "bg-blue-50 text-[#0A84FF]"
                                                                : "text-slate-700 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-[#0A84FF] text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                                {lang.badge || lang.code.toUpperCase()}
                                                            </span>
                                                            <span>{lang.nativeName}</span>
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono">{lang.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                ref={closeRef}
                                onClick={onClose}
                                className="w-8.5 h-8.5 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors active:scale-95 cursor-pointer"
                                aria-label="Close Menu"
                            >
                                <IoCloseOutline className="text-xl" />
                            </button>
                        </div>
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
                <div className="flex-1 overflow-y-auto p-4 scrollbar-hide overscroll-contain">
                    <div className="flex flex-col gap-3.5 pb-4">
                        {menuGroups.map((group, groupIdx) => (
                            <div key={groupIdx} className="space-y-1.5">
                                <h4 className="text-[10px] font-black text-[#8E939C] uppercase tracking-[0.1em] px-2 pt-1">
                                    {group.title}
                                </h4>
                                <nav className="flex flex-col gap-0.5">
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
                                                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group active:scale-[0.98] ${
                                                    isActive
                                                        ? "bg-[#E3F2FD] font-bold text-[#0A84FF]"
                                                        : item.highlight
                                                        ? "bg-gradient-to-r from-blue-50/70 to-indigo-50/40 hover:bg-blue-50 text-slate-700 font-semibold hover:text-[#0A84FF] border border-blue-100/70"
                                                        : "hover:bg-slate-50 text-slate-600 font-semibold hover:text-slate-900"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Icon className={`text-base shrink-0 transition-colors ${
                                                        isActive ? "text-[#0A84FF]" : item.highlight ? "text-[#0A84FF]" : "text-slate-400 group-hover:text-blue-500"
                                                    }`} />
                                                    <span className="text-xs font-semibold tracking-wide truncate">
                                                        {item.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {item.badge && (
                                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-[#0A84FF]">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                    {item.showChevron && (
                                                        <IoChevronForwardOutline className="text-xs text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                                    )}
                                                </div>
                                            </NavLink>
                                        );
                                    })}
                                </nav>
                            </div>
                        ))}

                        {/* Regional Language Section */}
                        {isLanguageEnabled && (
                            <div className="pt-3 pb-1 border-t border-slate-100">
                                <span className="block px-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Language / क्षेत्रीय भाषा
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setLangAccordionOpen(prev => !prev)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-all cursor-pointer shadow-2xs group"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0A84FF] text-white shadow-2xs shrink-0">
                                            <IoGlobeOutline className="text-sm" />
                                        </div>
                                        <div className="text-left min-w-0">
                                            <span className="text-xs sm:text-[13px] font-bold text-slate-800 block truncate">
                                                {currentLangObj.nativeName}
                                            </span>
                                            <span className="text-[10px] text-slate-400 block font-normal truncate">
                                                {currentLangObj.name}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="text-[10px] font-bold text-[#0A84FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                            {currentLangObj.badge || currentLangObj.code.toUpperCase()}
                                        </span>
                                        <IoChevronDown className={`text-slate-400 text-xs transition-transform duration-200 ${langAccordionOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>

                                {langAccordionOpen && (
                                    <div className="mt-1.5 bg-slate-50/80 rounded-xl border border-slate-200/80 p-1.5 space-y-1 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in duration-150">
                                        {supportedLanguages.map((lang) => {
                                            const isSelected = language === lang.code;
                                            return (
                                                <button
                                                    key={lang.code}
                                                    type="button"
                                                    onClick={() => {
                                                        setLanguage(lang.code);
                                                        setLangAccordionOpen(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-blue-50 text-[#0A84FF] border border-blue-200/60 shadow-2xs'
                                                            : 'text-slate-700 hover:bg-white'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-[#0A84FF] text-white' : 'bg-slate-200/80 text-slate-600'}`}>
                                                            {lang.badge || lang.code.toUpperCase()}
                                                        </span>
                                                        <span>{lang.nativeName}</span>
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-mono font-normal">{lang.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Logout Button (Inside Scrollable Area for exact match) */}
                <div className="px-4 py-3 bg-white shrink-0 border-t border-slate-100">
                    <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-800 font-bold transition-all duration-200 group active:scale-[0.98] cursor-pointer"
                    >
                        <IoLogOutOutline className="text-xl text-[#FF3B30]" />
                        <span className="text-sm">Logout</span>
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
