import { useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { IoCloseOutline, IoLogOutOutline } from "react-icons/io5";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";

export default function VendorSidebar({ isOpen, onClose, navItems }) {
    const closeRef = useRef(null);
    const { logout } = useVendorAuth();

    useEffect(() => {
        if (isOpen) closeRef.current?.focus();
    }, [isOpen]);

    const handleLogout = async () => {
        onClose();
        if (window.confirm("Are you sure you want to logout?")) {
            await logout();
        }
    };

    const overlay = `fixed inset-0 bg-black/30 z-40 transition-opacity ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
    }`;

    const panel = `fixed right-0 top-0 h-full w-4/5 max-w-xs bg-white z-50 shadow-xl p-5 transform transition-transform ${
        isOpen ? "translate-x-0" : "translate-x-full"
    }`;

    return (
        <>
            <div className={overlay} onClick={onClose} />

            <aside className={panel}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-[#0A84FF]">Menu</h2>

                    <button
                        ref={closeRef}
                        onClick={onClose}
                        className="p-2 rounded-full bg-gray-200"
                    >
                        <IoCloseOutline className="text-2xl text-gray-700" />
                    </button>
                </div>

                {/* Menu Items */}
                <nav className="flex flex-col gap-3">
                    {navItems.map(({ id, label, to, Icon }) => (
                        <NavLink
                            key={id}
                            to={to}
                            onClick={onClose}
                            className="flex items-center gap-3 p-3 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-[#0A84FF]"
                        >
                            <Icon className="text-xl text-[#0A84FF]" />
                            {label}
                        </NavLink>
                    ))}

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 p-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 mt-4"
                    >
                        <IoLogOutOutline className="text-xl text-red-600" />
                        Logout
                    </button>
                </nav>
            </aside>
        </>
    );
}
