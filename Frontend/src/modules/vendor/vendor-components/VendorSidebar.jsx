import { useRef, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { IoCloseOutline, IoLogOutOutline } from "react-icons/io5";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import ConfirmModal from "../../shared/components/ConfirmModal";

export default function VendorSidebar({ isOpen, onClose, navItems }) {
    const closeRef = useRef(null);
    const { logout } = useVendorAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        if (isOpen) closeRef.current?.focus();
    }, [isOpen]);

    const handleLogoutClick = () => {
        onClose();
        setShowLogoutConfirm(true);
    };

    const handleLogoutConfirm = async () => {
        setShowLogoutConfirm(false);
        await logout();
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
                            className={({ isActive }) =>
                                `flex items-center gap-3 p-2 rounded-xl transition-all ${
                                    isActive
                                        ? "bg-[#E3F2FD]"
                                        : "hover:bg-gray-50"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 shadow-sm ${
                                        isActive ? "bg-teal-500" : "bg-teal-500"
                                    }`}>
                                        <Icon className="text-xl text-white" />
                                    </div>
                                    <span className={`text-sm font-medium ${
                                        isActive ? "text-[#0A84FF]" : "text-gray-700"
                                    }`}>
                                        {label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}

                    {/* Logout Button */}
                    <button
                        onClick={handleLogoutClick}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 mt-4 transition-all"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 shrink-0 shadow-sm">
                            <IoLogOutOutline className="text-xl text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                            Logout
                        </span>
                    </button>
                </nav>
            </aside>

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
