import { useRef, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  IoCloseOutline,
  IoLogOutOutline,
  IoPersonOutline,
  IoCalendarOutline,
  IoDocumentTextOutline,
  IoWalletOutline,
  IoReceiptOutline,
  IoNotificationsOutline,
  IoStarOutline,
  IoAlertCircleOutline,
  IoHelpCircleOutline,
  IoSettingsOutline
} from "react-icons/io5";
import { useAuth } from "../../../contexts/AuthContext";
import ConfirmModal from "../../shared/components/ConfirmModal";
import PolicyModal from "../../shared/components/PolicyModal";

const menuItems = [
  {
    id: "profile",
    label: "My Profile",
    to: "/user/profile",
    Icon: IoPersonOutline,
    iconBg: "bg-[#0A84FF]"
  },
  {
    id: "bookings",
    label: "My Bookings",
    to: "/user/status",
    Icon: IoCalendarOutline,
    iconBg: "bg-teal-500"
  },
  {
    id: "survey_reports",
    label: "Survey Reports",
    to: "/user/survey-reports",
    Icon: IoDocumentTextOutline,
    iconBg: "bg-indigo-500"
  },
  {
    id: "wallet",
    label: "My Wallet",
    to: "/user/wallet",
    Icon: IoWalletOutline,
    iconBg: "bg-emerald-500"
  },
  {
    id: "payments",
    label: "Payments & Invoices",
    to: "/user/payments-invoices",
    Icon: IoReceiptOutline,
    iconBg: "bg-cyan-600"
  },
  {
    id: "notifications",
    label: "Notifications",
    to: "/user/notifications",
    Icon: IoNotificationsOutline,
    iconBg: "bg-amber-500"
  },
  {
    id: "reviews",
    label: "My Reviews",
    to: "/user/ratings",
    Icon: IoStarOutline,
    iconBg: "bg-yellow-500"
  },
  {
    id: "disputes",
    label: "Disputes",
    to: "/user/disputes",
    Icon: IoAlertCircleOutline,
    iconBg: "bg-orange-500"
  },
  {
    id: "help",
    label: "Help & Support",
    to: "/user/help-support",
    Icon: IoHelpCircleOutline,
    iconBg: "bg-purple-500"
  },
  {
    id: "settings",
    label: "Settings",
    to: "/user/settings",
    Icon: IoSettingsOutline,
    iconBg: "bg-slate-600"
  }
];

export default function UserSidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const closeRef = useRef(null);

  const handleLogoutClick = () => {
    onClose();
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    await logout();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      closeRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const overlay = `fixed inset-0 bg-black/40 backdrop-blur-sm md:backdrop-blur-md z-[90] transition-all duration-300 ${
    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
  }`;

  const panel = `fixed right-0 top-0 h-full w-4/5 max-w-xs bg-white z-[100] shadow-2xl p-5 transform transition-transform duration-300 flex flex-col ${
    isOpen ? "translate-x-0" : "translate-x-full"
  }`;

  return (
    <>
      <div className={overlay} onClick={onClose} />

      <aside className={panel}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Menu</h2>

          <button
            ref={closeRef}
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
            aria-label="Close menu"
          >
            <IoCloseOutline className="text-2xl" />
          </button>
        </div>

        {/* Menu Items List */}
        <nav className="flex-1 overflow-y-auto space-y-1.5 pr-1 pb-12 text-sm font-medium">
          {menuItems.map(({ id, label, to, Icon, iconBg }) => (
            <NavLink
              key={id}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3.5 p-2.5 rounded-2xl transition-all ${
                  isActive
                    ? "bg-blue-50/80 text-blue-700 font-bold"
                    : "text-gray-700 hover:bg-gray-50"
                }`
              }
            >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg} text-white shadow-sm shrink-0`}>
                  <Icon className="text-lg" />
                </div>
                <span className="text-sm font-bold text-gray-800">{label}</span>
              </NavLink>
          ))}

          {/* Logout Button */}
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3.5 p-2.5 rounded-2xl text-red-600 hover:bg-red-50 active:bg-red-100 transition-all text-left mt-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm shrink-0">
              <IoLogOutOutline className="text-lg" />
            </div>
            <span className="text-sm font-bold">Logout</span>
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

      {/* Help & Support Modal */}
      {showHelpModal && (
        <PolicyModal type="general" onClose={() => setShowHelpModal(false)} />
      )}
    </>
  );
}
