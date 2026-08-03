import { useState, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
    IoHome,
    IoHomeOutline,
    IoDocumentText,
    IoDocumentTextOutline,
    IoTime,
    IoTimeOutline,
    IoWallet,
    IoWalletOutline,
    IoPersonCircle,
    IoPersonCircleOutline,
    IoCalendarOutline,
    IoPersonOutline,
    IoMenuOutline,
    IoLogOutOutline,
    IoStarOutline,
    IoChevronBackOutline,
} from "react-icons/io5";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import ConfirmModal from "../../shared/components/ConfirmModal";
import NotificationDropdown from "../../../components/NotificationDropdown";
import logo from "@/assets/Header-logoo.png";

import VendorSidebar from "./VendorSidebar";

const navItems = [
    {
        id: "dashboard",
        label: "Home",
        to: "/vendor/dashboard",
        Icon: IoHomeOutline,
        ActiveIcon: IoHome,
    },
    {
        id: "bookings",
        label: "Jobs",
        to: "/vendor/bookings",
        Icon: IoDocumentTextOutline,
        ActiveIcon: IoDocumentText,
    },
    {
        id: "status",
        label: "Status",
        to: "/vendor/status",
        Icon: IoTimeOutline,
        ActiveIcon: IoTime,
    },
    {
        id: "wallet",
        label: "Wallet",
        to: "/vendor/wallet",
        Icon: IoWalletOutline,
        ActiveIcon: IoWallet,
    },
    {
        id: "profile",
        label: "Profile",
        to: "/vendor/profile",
        Icon: IoPersonCircleOutline,
        ActiveIcon: IoPersonCircle,
    },
];

export default function VendorNavbar() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const toggleRef = useRef(null);
    const { logout, vendor } = useVendorAuth();
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
            <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-[#F6F7F9] px-4 py-3 md:px-6 md:py-4">
                {/* Left Section: Back Button + Logo */}
                <div className="flex items-center gap-3">
                    {/* Back Button - Only for sub-pages */}
                    {!navItems.some(item => item.to === location.pathname) && (
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-gray-700 hover:text-[#0A84FF] shadow-sm border border-gray-100 transition-all active:scale-95"
                            aria-label="Go Back"
                        >
                            <IoChevronBackOutline className="text-lg" />
                        </button>
                    )}

                    {/* Logo */}
                    <div className="flex items-center">
                        <img
                            src={logo}
                            alt="Jaladhaara Logo"
                            className="h-12 md:h-14 w-40 md:w-48 object-contain ml-4 md:ml-6"
                        />
                    </div>
                </div>

                {/* Desktop Navigation Links - Hidden on Mobile */}
                <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
                    {navItems.map(({ id, label, to, Icon }) => (
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
                            <span className="text-sm font-medium">{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Right Icons */}
                <div className="flex items-center gap-4">
                    {/* Vendor Name - Desktop Only */}
                    {vendor && (
                        <span className="hidden md:block text-sm font-medium text-gray-700">
                            {vendor.name}
                        </span>
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
                        className="md:hidden"
                    >
                        <IoMenuOutline className="text-3xl text-[#0A84FF]" />
                    </button>
                </div>
            </header>

            {/* Sidebar - Mobile Only */}
            <div className="md:hidden">
                <VendorSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    navItems={navItems}
                />
            </div>

            {/* Bottom Navigation — Mobile Only (Redesigned Senior UI) */}
            <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-100/90 px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] md:hidden">
                <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
                    {navItems.map(({ id, label, to, Icon, ActiveIcon }) => (
                        <NavLink
                            key={id}
                            to={to}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all duration-200 group active:scale-95 ${
                                    isActive
                                        ? "text-[#0A84FF]"
                                        : "text-gray-400 hover:text-gray-600"
                                }`
                            }
                            end={id === "dashboard"}
                        >
                            {({ isActive }) => {
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
                                            {label}
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
