import { useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { IoCloseOutline, IoLogOutOutline } from "react-icons/io5";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";

export default function AdminSidebar({ isOpen, onClose, navItems }) {
    const closeRef = useRef(null);
    const { logout } = useAdminAuth();

    useEffect(() => {
        if (isOpen) closeRef.current?.focus();
    }, [isOpen]);

    const handleLogout = async () => {
        onClose();
        if (window.confirm("Are you sure you want to logout?")) {
            await logout();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50 md:hidden"
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-xl md:hidden">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-800">Menu</h2>
                        <button
                            ref={closeRef}
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Close menu"
                        >
                            <IoCloseOutline className="text-2xl text-gray-600" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4">
                        <ul className="space-y-2">
                            {navItems.map((item) => {
                                const Icon = item.Icon;
                                return (
                                    <li key={item.id}>
                                        <NavLink
                                            to={item.to}
                                            onClick={onClose}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all ${
                                                    isActive
                                                        ? "bg-[#0A84FF] text-white font-semibold"
                                                        : "text-gray-600 hover:bg-gray-100"
                                                }`
                                            }
                                        >
                                            <Icon className="text-xl" />
                                            <span>{item.label}</span>
                                        </NavLink>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Logout Button */}
                    <div className="p-4 border-t border-gray-200">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 text-white rounded-[10px] hover:bg-red-700 transition-colors font-semibold"
                        >
                            <IoLogOutOutline className="text-xl" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

