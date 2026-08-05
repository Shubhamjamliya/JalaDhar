import { useRef, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { IoCloseOutline, IoLogOutOutline, IoCheckmarkCircle, IoPersonOutline } from "react-icons/io5";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import ConfirmModal from "../../shared/components/ConfirmModal";

export default function VendorSidebar({ isOpen, onClose, navItems }) {
    const closeRef = useRef(null);
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
                aria-label="Vendor Menu"
                className={`fixed right-0 top-0 h-full w-[290px] sm:w-[320px] bg-white z-[100] shadow-2xl p-5 transform transition-transform duration-300 ease-in-out flex flex-col justify-between ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-extrabold text-[#0A84FF] tracking-tight">
                            Menu
                        </h2>

                        <button
                            ref={closeRef}
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors active:scale-95 cursor-pointer"
                            aria-label="Close Menu"
                        >
                            <IoCloseOutline className="text-2xl" />
                        </button>
                    </div>

                    {/* Vendor Profile Card */}
                    {vendor && (
                        <div className="mb-5 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                                {vendor.name ? vendor.name.charAt(0).toUpperCase() : <IoPersonOutline className="text-lg" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                    <h3 className="text-sm font-bold text-slate-800 truncate">
                                        {vendor.name || "Vendor Partner"}
                                    </h3>
                                    {vendor.isApproved && (
                                        <IoCheckmarkCircle className="text-teal-500 text-sm shrink-0" title="Verified Partner" />
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 font-medium truncate">
                                    {vendor.phone || vendor.email || "Vendor Account"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation Menu Items */}
                    <nav className="flex flex-col gap-2.5">
                        {navItems.map(({ id, label, to, Icon, ActiveIcon }) => (
                            <NavLink
                                key={id}
                                to={to}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-3.5 px-3 py-2.5 rounded-2xl transition-all duration-200 group active:scale-[0.98] ${
                                        isActive
                                            ? "bg-[#E3F2FD] font-bold text-[#0A84FF]"
                                            : "hover:bg-slate-50 text-slate-700 font-semibold"
                                    }`
                                }
                                end={id === "dashboard"}
                            >
                                {({ isActive }) => {
                                    const CurrentIcon = (isActive && ActiveIcon) ? ActiveIcon : Icon;
                                    return (
                                        <>
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 shadow-xs transition-all duration-200 ${
                                                isActive
                                                    ? "bg-teal-500 text-white scale-105"
                                                    : "bg-teal-500 text-white group-hover:scale-105"
                                            }`}>
                                                <CurrentIcon className="text-xl" />
                                            </div>
                                            <span className={`text-[15px] tracking-wide ${
                                                isActive ? "text-[#0A84FF] font-bold" : "text-slate-800 font-semibold"
                                            }`}>
                                                {label}
                                            </span>
                                        </>
                                    );
                                }}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* Logout Button Footer */}
                <div className="pt-4 border-t border-slate-100">
                    <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-2xl hover:bg-red-50 text-slate-800 font-semibold transition-all duration-200 group active:scale-[0.98] cursor-pointer"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF3B30] text-white shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200">
                            <IoLogOutOutline className="text-xl" />
                        </div>
                        <span className="text-[15px] font-semibold text-slate-800 group-hover:text-red-600 transition-colors">
                            Logout
                        </span>
                    </button>
                </div>
            </aside>

            {/* Logout Confirmation Modal */}
            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogoutConfirm}
                title="Confirm Logout"
                message="Are you sure you want to logout from your vendor account?"
                confirmText="Logout"
                cancelText="Cancel"
                confirmColor="danger"
            />
        </>
    );
}
