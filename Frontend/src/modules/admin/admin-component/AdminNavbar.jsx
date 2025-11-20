import { useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import {
    IoHomeOutline,
    IoPeopleOutline,
    IoDocumentTextOutline,
    IoLogOutOutline,
    IoMenuOutline,
    IoPersonCircleOutline,
} from "react-icons/io5";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import AdminSidebar from "./AdminSidebar";
import logo from "../../../assets/logo.png";

const navItems = [
    {
        id: "dashboard",
        label: "Dashboard",
        to: "/admin/dashboard",
        Icon: IoHomeOutline,
    },
    {
        id: "vendors",
        label: "Vendors",
        to: "/admin/vendors",
        Icon: IoPeopleOutline,
    },
    {
        id: "pending",
        label: "Pending",
        to: "/admin/vendors/pending",
        Icon: IoDocumentTextOutline,
    },
    {
        id: "users",
        label: "Users",
        to: "/admin/users",
        Icon: IoPersonCircleOutline,
    },
];

export default function AdminNavbar() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleRef = useRef(null);
    const { logout, admin } = useAdminAuth();

    const handleLogout = async () => {
        if (window.confirm("Are you sure you want to logout?")) {
            await logout();
        }
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
                    {navItems.map((item) => {
                        const Icon = item.Icon;
                        return (
                            <NavLink
                                key={item.id}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 px-4 py-2 rounded-[10px] transition-all ${
                                        isActive
                                            ? "bg-[#0A84FF] text-white font-semibold"
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`
                                }
                            >
                                <Icon className="text-xl" />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Right Section - Desktop */}
                <div className="hidden md:flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-700">
                        {admin?.name || "Admin"}
                    </span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-[10px] hover:bg-red-700 transition-colors"
                    >
                        <IoLogOutOutline className="text-lg" />
                        <span>Logout</span>
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    ref={toggleRef}
                    onClick={() => setIsSidebarOpen(true)}
                    className="md:hidden p-2 rounded-full hover:bg-gray-200 transition-colors"
                    aria-label="Open menu"
                >
                    <IoMenuOutline className="text-2xl text-gray-700" />
                </button>
            </header>

            {/* Mobile Sidebar */}
            <AdminSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                navItems={navItems}
            />
        </>
    );
}

