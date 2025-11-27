import { useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import {
    IoHomeOutline,
    IoCalendarOutline,
    IoTimeOutline,
    IoWalletOutline,
    IoPersonOutline,
    IoMenuOutline,
    IoNotificationsOutline,
    IoLogOutOutline,
    IoStarOutline,
} from "react-icons/io5";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import ConfirmModal from "../../shared/components/ConfirmModal";

import VendorSidebar from "./VendorSidebar";
import logo from "../../../assets/logo.png";

const navItems = [
    {
        id: "dashboard",
        label: "Home",
        to: "/vendor/dashboard",
        Icon: IoHomeOutline,
    },
    {
        id: "bookings",
        label: "Bookings",
        to: "/vendor/bookings",
        Icon: IoCalendarOutline,
    },
    {
        id: "status",
        label: "Status",
        to: "/vendor/status",
        Icon: IoTimeOutline,
    },
    {
        id: "wallet",
        label: "Wallet",
        to: "/vendor/wallet",
        Icon: IoWalletOutline,
    },
    {
        id: "profile",
        label: "Profile",
        to: "/vendor/profile",
        Icon: IoPersonOutline,
    },
    {
        id: "reviews",
        label: "Reviews",
        to: "/vendor/reviews",
        Icon: IoStarOutline,
    },
];

export default function VendorNavbar() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const toggleRef = useRef(null);
    const { logout, vendor } = useVendorAuth();

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
                {/* Left Logo */}
                <img
                    src={logo}
                    alt="Jaladhar"
                    className="h-8 object-contain md:h-10"
                />

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

                    <IoNotificationsOutline className="text-2xl text-[#0A84FF] md:text-2xl cursor-pointer hover:opacity-80 transition-opacity" />

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

            {/* Bottom Navigation - Mobile Only */}
            <nav className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-around gap-1 bg-white px-3 py-2 shadow-lg md:hidden">
                {navItems.filter(item => item.id !== "reviews").map(({ id, label, to, Icon }) => (
                    <NavLink
                        key={id}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center justify-center flex-1 py-2 transition-all duration-200 ${isActive ? "text-[#0A84FF]" : "text-gray-500"
                            }`
                        }
                        end={id === "dashboard"}
                    >
                        {({ isActive }) => (
                            <Icon
                                className={`text-3xl ${isActive
                                    ? "text-[#0A84FF]"
                                    : "text-gray-500"
                                    }`}
                            />
                        )}
                    </NavLink>
                ))}
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
