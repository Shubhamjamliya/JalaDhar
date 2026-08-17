import { useRef, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  IoSettingsOutline,
  IoChevronForwardOutline
} from "react-icons/io5";
import { useAuth } from "../../../contexts/AuthContext";
import ConfirmModal from "../../shared/components/ConfirmModal";
import PolicyModal from "../../shared/components/PolicyModal";

const menuSections = [
  {
    title: "Services & Reports",
    items: [
      {
        id: "bookings",
        label: "My Bookings",
        to: "/user/status",
        Icon: IoCalendarOutline,
        iconBg: "bg-[#0A84FF]"
      },
      {
        id: "survey_reports",
        label: "Survey Reports",
        to: "/user/survey-reports",
        Icon: IoDocumentTextOutline,
        iconBg: "bg-teal-500"
      }
    ]
  },
  {
    title: "Finance & Billing",
    items: [
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
      }
    ]
  },
  {
    title: "Support & Activity",
    items: [
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
      }
    ]
  },
  {
    title: "Preferences",
    items: [
      {
        id: "settings",
        label: "Settings",
        to: "/user/settings",
        Icon: IoSettingsOutline,
        iconBg: "bg-slate-600"
      }
    ]
  }
];

export default function UserSidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();
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

  // Close sidebar on route change
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname, location.search]);

  // Lock document scroll & handle Escape key
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

  const overlay = `fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] transition-all duration-300 touch-none ${
    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
  }`;

  const panel = `fixed right-0 top-0 h-full w-4/5 max-w-xs bg-white z-[100] shadow-2xl p-5 transform transition-transform duration-300 flex flex-col overscroll-contain ${
    isOpen ? "translate-x-0" : "translate-x-full"
  }`;

  return (
    <>
      <div 
        className={overlay} 
        onClick={onClose} 
        onTouchMove={(e) => e.preventDefault()}
        aria-hidden="true"
      />

      <aside className={panel} role="dialog" aria-modal="true" aria-label="Menu">
        {/* Top Bar Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Menu</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <IoCloseOutline className="text-xl" />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="pt-3.5 pb-2">
          <NavLink
            to="/user/profile"
            onClick={onClose}
            className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 group hover:border-blue-200 hover:bg-blue-50/50 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0A84FF] to-blue-600 text-white flex items-center justify-center font-extrabold text-base shadow-sm shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : <IoPersonOutline className="text-lg" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 truncate group-hover:text-[#0A84FF] transition-colors">
                {user?.name || "My Account"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {user?.phone || user?.email || "View Profile"}
              </p>
            </div>
            <IoChevronForwardOutline className="text-slate-400 text-sm group-hover:translate-x-0.5 transition-transform" />
          </NavLink>
        </div>

        {/* Sectional Menu Items */}
        <nav className="flex-1 overflow-y-auto space-y-4 pr-1 py-2 text-sm font-medium custom-scrollbar overscroll-contain">
          {menuSections.map((section, sectionIdx) => (
            <div key={sectionIdx} className="space-y-1">
              <span className="block px-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                {section.title}
              </span>
              {section.items.map(({ id, label, to, Icon, iconBg }) => (
                <NavLink
                  key={id}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between p-2.5 rounded-2xl transition-all ${
                      isActive
                        ? "bg-blue-50 text-[#0A84FF] font-extrabold shadow-2xs"
                        : "text-slate-700 hover:bg-slate-50 font-semibold"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconBg} text-white shadow-2xs shrink-0`}>
                      <Icon className="text-base" />
                    </div>
                    <span className="text-xs sm:text-sm">{label}</span>
                  </div>
                  <IoChevronForwardOutline className="text-slate-300 text-xs" />
                </NavLink>
              ))}
            </div>
          ))}

          {/* Logout Button Block */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-all text-left cursor-pointer font-bold"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500 text-white shadow-2xs shrink-0">
                  <IoLogOutOutline className="text-base" />
                </div>
                <span className="text-xs sm:text-sm">Logout</span>
              </div>
              <IoChevronForwardOutline className="text-rose-300 text-xs" />
            </button>
          </div>
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
