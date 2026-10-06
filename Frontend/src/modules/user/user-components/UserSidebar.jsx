import { useRef, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  IoChevronForwardOutline,
  IoGiftOutline,
  IoGlobeOutline,
  IoChevronDown
} from "react-icons/io5";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
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
        id: "rewards",
        label: "Rewards & Benefits",
        to: "/user/rewards",
        Icon: IoGiftOutline,
        iconBg: "bg-rose-500",
        isComingSoon: true
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
  const { language, setLanguage, supportedLanguages, isLanguageEnabled } = useLanguage();
  const currentLangObj = supportedLanguages.find(l => l.code === language) || supportedLanguages[0];
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [langAccordionOpen, setLangAccordionOpen] = useState(false);
  const closeRef = useRef(null);
  const langDropdownRef = useRef(null);

  const handleLogoutClick = () => {
    onClose();
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    await logout();
  };

  // Close language dropdown on outside click or touch
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setShowLangMenu(false);
      }
    };

    if (showLangMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showLangMenu]);

  // Reset dropdowns when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setShowLangMenu(false);
      setLangAccordionOpen(false);
    }
  }, [isOpen]);

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

  const panel = `fixed right-0 top-0 h-full w-4/5 max-w-xs bg-white z-[100] shadow-2xl p-4 sm:p-4.5 transform transition-transform duration-300 flex flex-col overscroll-contain ${
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
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">Menu</h2>

          <div className="flex items-center gap-2">
            {/* Language Switcher Pill */}
            {isLanguageEnabled && (
              <div className="relative" ref={langDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowLangMenu((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-xs font-bold text-slate-700 hover:border-blue-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Change Language"
                  aria-label="Change Language"
                >
                  <IoGlobeOutline className="text-[#0A84FF] text-base shrink-0" />
                  <span className="text-xs font-bold text-slate-700">{currentLangObj.nativeName}</span>
                </button>

                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 space-y-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 custom-scrollbar">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
                      <span>Select Language</span>
                      <span className="text-[10px] text-slate-400 font-medium">भाषा चुनें</span>
                    </div>
                    {supportedLanguages.map((lang) => {
                      const isSelected = language === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setLanguage(lang.code);
                            setShowLangMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer ${
                            isSelected
                              ? "bg-blue-50 text-[#0A84FF]"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-[#0A84FF] text-white' : 'bg-slate-100 text-slate-600'}`}>
                              {lang.badge || lang.code.toUpperCase()}
                            </span>
                            <span>{lang.nativeName}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{lang.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <button
              ref={closeRef}
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <IoCloseOutline className="text-lg" />
            </button>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="pt-2 pb-1">
          <NavLink
            to="/user/profile"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 group hover:border-blue-200 hover:bg-blue-50/50 transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#0A84FF] to-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : <IoPersonOutline className="text-base" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 truncate group-hover:text-[#0A84FF] transition-colors">
                {user?.name || "My Account"}
              </h3>
              <p className="text-[10.5px] text-slate-500 font-medium truncate">
                {user?.phone || user?.email || "View Profile"}
              </p>
            </div>
            <IoChevronForwardOutline className="text-slate-400 text-xs group-hover:translate-x-0.5 transition-transform" />
          </NavLink>
        </div>

        {/* Sectional Menu Items */}
        <nav className="flex-1 overflow-y-auto space-y-2 pr-1 py-1 text-sm font-medium custom-scrollbar overscroll-contain">
          {menuSections.map((section, sectionIdx) => (
            <div key={sectionIdx} className="space-y-0.5">
              <span className="block px-2 pt-1 pb-0.5 text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                {section.title}
              </span>
              {section.items.map(({ id, label, to, Icon, iconBg, isComingSoon }) => {
                if (isComingSoon) {
                  return (
                    <div
                      key={id}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-slate-700 font-semibold select-none cursor-default"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg} text-white shadow-2xs shrink-0 opacity-80`}>
                          <Icon className="text-sm" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-[13px] text-slate-700">{label}</span>
                          <span className="px-1.5 py-0.2 text-[8.5px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200/80 rounded-md">
                            Soon
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={id}
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all ${
                        isActive
                          ? "bg-blue-50 text-[#0A84FF] font-extrabold shadow-2xs"
                          : "text-slate-700 hover:bg-slate-50 font-semibold"
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg} text-white shadow-2xs shrink-0`}>
                        <Icon className="text-sm" />
                      </div>
                      <span className="text-xs sm:text-[13px]">{label}</span>
                    </div>
                    <IoChevronForwardOutline className="text-slate-300 text-xs" />
                  </NavLink>
                );
              })}
            </div>
          ))}

          {/* Regional Language Section */}
          {isLanguageEnabled && (
            <div className="pt-2 border-t border-slate-100">
              <span className="block px-2 pb-1 text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                Language / क्षेत्रीय भाषा
              </span>
              <button
                type="button"
                onClick={() => setLangAccordionOpen(prev => !prev)}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0A84FF] text-white shadow-2xs shrink-0">
                    <IoGlobeOutline className="text-sm" />
                  </div>
                  <div className="text-left min-w-0">
                    <span className="text-xs sm:text-[13px] font-bold text-slate-800 block truncate">
                      {currentLangObj.nativeName}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-normal truncate">
                      {currentLangObj.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-bold text-[#0A84FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    {currentLangObj.badge || currentLangObj.code.toUpperCase()}
                  </span>
                  <IoChevronDown className={`text-slate-400 text-xs transition-transform duration-200 ${langAccordionOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {langAccordionOpen && (
                <div className="mt-1.5 bg-slate-50/80 rounded-xl border border-slate-200/80 p-1.5 space-y-1 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in duration-150">
                  {supportedLanguages.map((lang) => {
                    const isSelected = language === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangAccordionOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 text-[#0A84FF] border border-blue-200/60 shadow-2xs'
                            : 'text-slate-700 hover:bg-white'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-[#0A84FF] text-white' : 'bg-slate-200/80 text-slate-600'}`}>
                            {lang.badge || lang.code.toUpperCase()}
                          </span>
                          <span>{lang.nativeName}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">{lang.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Logout Button Block */}
          <div className="pt-1.5 mt-1 border-t border-slate-100">
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-all text-left cursor-pointer font-bold"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500 text-white shadow-2xs shrink-0">
                  <IoLogOutOutline className="text-sm" />
                </div>
                <span className="text-xs sm:text-[13px]">Logout</span>
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
