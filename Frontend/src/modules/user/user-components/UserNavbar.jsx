import { useState, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
    IoHome,
    IoHomeOutline,
    IoPeople,
    IoPeopleOutline,
    IoTime,
    IoTimeOutline,
    IoWallet,
    IoWalletOutline,
    IoPersonCircle,
    IoPersonCircleOutline,
    IoAdd,
    IoChevronBackOutline,
    IoCalendarOutline,
    IoMenuOutline,
    IoLogOutOutline,
    IoChevronUpOutline,
    IoBarChartOutline,
    IoStarOutline,
    IoAlertCircleOutline,
    IoBuildOutline,
    IoBusinessOutline,
    IoCashOutline,
    IoLockClosedOutline,
    IoPersonAddOutline,
    IoGlobeOutline
} from "react-icons/io5";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import ConfirmModal from "../../shared/components/ConfirmModal";
import NotificationDropdown from "../../../components/NotificationDropdown";
import logo from "@/assets/Header-logoo.png";

import UserSidebar from "./UserSidebar";

const navItems = [
    {
        id: "dashboard",
        labelKey: "home",
        fallbackLabel: "Home",
        to: "/user/dashboard",
        Icon: IoHomeOutline,
        ActiveIcon: IoHome,
    },
    {
        id: "status",
        labelKey: "bookings",
        fallbackLabel: "Bookings",
        to: "/user/status",
        Icon: IoTimeOutline,
        ActiveIcon: IoTime,
    },
    {
        id: "survey",
        labelKey: "book",
        fallbackLabel: "Book",
        to: "/user/survey",
        Icon: IoAdd,
        ActiveIcon: IoAdd,
        isFab: true,
    },
    {
        id: "wallet",
        labelKey: "wallet",
        fallbackLabel: "Wallet",
        to: "/user/wallet",
        Icon: IoWalletOutline,
        ActiveIcon: IoWallet,
    },
    {
        id: "profile",
        labelKey: "profile",
        fallbackLabel: "Profile",
        to: "/user/profile",
        Icon: IoPersonCircleOutline,
        ActiveIcon: IoPersonCircle,
    },
];

export default function UserNavbar() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const { language, setLanguage, t, supportedLanguages, isLanguageEnabled } = useLanguage();
    const currentLangObj = supportedLanguages.find(l => l.code === language) || supportedLanguages[0];

    const toggleRef = useRef(null);
    const { logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const handleLogoutConfirm = async () => {
        setShowLogoutConfirm(false);
        await logout();
    };

    const mobileLinkBase =
        "flex flex-1 items-center justify-center rounded-full px-1 py-1 transition-all duration-200";

    const mobileIconWrapper =
        "flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all duration-200";

    return (
        <>
            {/* Top Navbar - Mobile & Desktop */}
            <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-sm border-b border-gray-100 md:px-6 md:py-3">
                {/* Left Section: Logo */}
                <NavLink to="/user/dashboard" className="flex items-center">
                    <img
                        src={logo}
                        alt="Jaladhaara Logo"
                        className="h-10 md:h-12 w-auto object-contain"
                    />
                </NavLink>

                {/* Desktop Navigation Links - Hidden on Mobile */}
                <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
                    {navItems.map(({ id, labelKey, fallbackLabel, to, Icon }) => (
                        <NavLink
                            key={id}
                            to={to}
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive
                                    ? "text-[#0A84FF] bg-[#E7F0FB] font-semibold"
                                    : "text-gray-700 hover:text-[#0A84FF] hover:bg-[#E7F0FB]"
                                }`
                            }
                            end={id === "dashboard"}
                        >
                            <Icon className="text-xl" />
                            <span className="text-sm font-medium">{t(labelKey, fallbackLabel)}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Right Icons */}
                <div className="flex items-center gap-3">
                    {/* User Name - Desktop Only */}
                    {user && (
                        <span className="hidden md:block text-sm font-semibold text-gray-800">
                            {user.name}
                        </span>
                    )}

                    {/* Language Switcher */}
                    {isLanguageEnabled && (
                        <div className="relative">
                            <button
                                onClick={() => setShowLangMenu(!showLangMenu)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-gray-200/90 text-xs font-bold text-gray-700 hover:border-blue-300 transition-all cursor-pointer shadow-2xs"
                                title="Change Language"
                            >
                                <IoGlobeOutline className="text-[#0A84FF] text-base" />
                                <span className="hidden sm:inline">{currentLangObj.nativeName}</span>
                            </button>

                            {showLangMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                                    {supportedLanguages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                setLanguage(lang.code);
                                                setShowLangMenu(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer ${
                                                language === lang.code ? "bg-blue-50 text-[#0A84FF]" : "text-gray-700 hover:bg-gray-50"
                                            }`}
                                        >
                                            <span>{lang.nativeName}</span>
                                            <span className="text-[10px] text-gray-400 font-mono">{lang.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <NotificationDropdown disablePopup={true} />

                    {/* Logout Button - Desktop Only */}
                    <button
                        onClick={handleLogoutClick}
                        className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Logout"
                    >
                        <IoLogOutOutline className="text-xl" />
                        <span>Logout</span>
                    </button>

                    {/* Mobile Menu Button - Hidden on Desktop */}
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-gray-50 hover:bg-blue-50 text-[#0A84FF] border border-gray-200/80 transition-all active:scale-95 shrink-0"
                        aria-label="Open Menu"
                    >
                        <IoMenuOutline className="text-2xl" />
                    </button>
                </div>
            </header>

            {/* Sidebar - Mobile Only */}
            <div className="md:hidden">
                <UserSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
            </div>

            {/* Bottom Navigation — Mobile Only (Redesigned Senior UI with Floating FAB) */}
            <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-100/90 px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] md:hidden">
                <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
                    {navItems.map(({ id, labelKey, fallbackLabel, to, Icon, ActiveIcon, isFab }) => (
                        <NavLink
                            key={id}
                            to={to}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-200 group active:scale-95 ${
                                    isActive
                                        ? "text-[#0A84FF]"
                                        : "text-gray-400 hover:text-gray-600"
                                }`
                            }
                            end={id === "dashboard"}
                        >
                            {({ isActive }) => {
                                if (isFab) {
                                    return (
                                        <div className="flex flex-col items-center justify-center -mt-6">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-[#0A84FF] to-indigo-500 text-white shadow-lg shadow-blue-500/35 border-4 border-white flex items-center justify-center transition-all duration-200 group-active:scale-90 group-hover:scale-105">
                                                <IoAdd className="text-2xl font-black text-white" />
                                            </div>
                                            <span className="text-[10px] leading-none mt-1 font-bold text-[#0A84FF] tracking-tight">
                                                {t(labelKey, fallbackLabel)}
                                            </span>
                                        </div>
                                    );
                                }
                                const TargetIcon = isActive ? ActiveIcon : Icon;
                                return (
                                    <>
                                        <div className={`relative flex items-center justify-center px-3.5 py-1 rounded-full transition-all duration-200 ${
                                            isActive
                                                ? "bg-blue-50 text-[#0A84FF] scale-105"
                                                : "bg-transparent text-gray-500 group-hover:bg-gray-50"
                                        }`}>
                                            <TargetIcon className={`text-xl transition-transform duration-200 ${
                                                isActive ? "text-[#0A84FF]" : "text-gray-500"
                                            }`} />
                                        </div>
                                        <span className={`text-[10px] leading-none mt-1 tracking-tight transition-colors duration-200 ${
                                            isActive ? "font-bold text-[#0A84FF]" : "font-semibold text-gray-500"
                                        }`}>
                                            {t(labelKey, fallbackLabel)}
                                        </span>
                                    </>
                                );
                            }}
                        </NavLink>
                    ))}
                </div>
            </nav>

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
