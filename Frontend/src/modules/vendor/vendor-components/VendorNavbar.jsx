import { useState, useEffect, useRef } from "react";
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
    IoGlobeOutline
} from "react-icons/io5";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import ConfirmModal from "../../shared/components/ConfirmModal";
import NotificationDropdown from "../../../components/NotificationDropdown";
import logo from "@/assets/Header-logoo.png";

import VendorSidebar from "./VendorSidebar";
import ExpertAgreementModal from "./ExpertAgreementModal";
import VendorAvailabilityModal from "./VendorAvailabilityModal";
import { getExpertLiveStatus } from "../../../utils/availabilityUtils";
import { useToast } from "../../../hooks/useToast";
import api from "../../../services/api";

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
        label: "Bookings",
        to: "/vendor/bookings",
        Icon: IoDocumentTextOutline,
        ActiveIcon: IoDocumentText,
    },
    {
        id: "status",
        label: "Reports",
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
    const { logout, vendor, updateOnlineStatus, allowAvailabilityToggle } = useVendorAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();

    // Availability State
    const [showPauseModal, setShowPauseModal] = useState(false);
    const [pauseLoading, setPauseLoading] = useState(false);
    const liveStatus = getExpertLiveStatus(vendor);


    const handleToggleClick = () => {
        // If currently Online, open the modal to choose pause duration
        if (liveStatus.status === 'ONLINE') {
            setShowPauseModal(true);
        } else {
            // If currently offline or paused, immediately turn back Online
            handleResumeOnline();
        }
    };

    const handleResumeOnline = async () => {
        setPauseLoading(true);
        try {
            const res = await updateOnlineStatus({ isOnline: true });
            if (res.success) {
                toast.showSuccess("You are now Online and receiving new booking requests!");
            } else {
                toast.showError(res.message || "Failed to update status");
            }
        } catch (err) {
            toast.showError("Failed to update status");
        } finally {
            setPauseLoading(false);
            setShowPauseModal(false);
        }
    };

    const handleConfirmPause = async (pauseDuration) => {
        setPauseLoading(true);
        try {
            const res = await updateOnlineStatus({
                isOnline: false,
                pauseDuration,
                pauseReason: pauseDuration === 'REST_OF_TODAY' ? 'BUSY_TODAY' : (pauseDuration === '2_HOURS' ? 'QUICK_BREAK' : 'MANUAL')
            });
            if (res.success) {
                toast.showSuccess(
                    pauseDuration === 'REST_OF_TODAY'
                        ? "Paused for today. Auto-resuming tomorrow morning!"
                        : pauseDuration === '2_HOURS'
                        ? "Paused for 2 hours."
                        : "You are now offline."
                );
            } else {
                toast.showError(res.message || "Failed to update status");
            }
        } catch (err) {
            toast.showError("Failed to update status");
        } finally {
            setPauseLoading(false);
            setShowPauseModal(false);
        }
    };

    const [showLangMenu, setShowLangMenu] = useState(false);
    const langDropdownRef = useRef(null);
    const { language, setLanguage, supportedLanguages, isLanguageEnabled } = useLanguage();
    const currentLangObj = supportedLanguages.find(l => l.code === language) || supportedLanguages[0];


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

    // Expert Agreement State
    const [showAgreementModal, setShowAgreementModal] = useState(false);
    const [agreementText, setAgreementText] = useState('');
    const [agreementVersion, setAgreementVersion] = useState('v1.0');

    // Check if Expert requires agreement acceptance
    const isPendingAgreement = vendor && (vendor.verificationStatus === 'VERIFIED_PENDING_AGREEMENT');

    useEffect(() => {
        const checkExpertAgreement = async () => {
            if (!vendor) return;
            try {
                const response = await api.get('/vendors/agreement/status');
                if (response.data?.success && response.data?.data) {
                    const { activeVersion, agreementText, requiresAcceptance, verificationStatus } = response.data.data;
                    setAgreementVersion(activeVersion || 'v1.0');
                    setAgreementText(agreementText || '');

                    if (requiresAcceptance || verificationStatus === 'VERIFIED_PENDING_AGREEMENT') {
                        setShowAgreementModal(true);
                    }
                }
            } catch (err) {
                console.error('Error checking expert agreement status:', err);
            }
        };

        checkExpertAgreement();
    }, [vendor]);

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
            {/* Agreement Pending Banner */}
            {isPendingAgreement && (
                <div className="fixed inset-x-0 top-0 z-[60] bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md">
                    <span>🎉 Verification Approved! Review and accept the Expert Agreement to activate your account.</span>
                    <button
                        onClick={() => navigate('/vendor/agreement')}
                        className="ml-2 px-3 py-1 bg-white text-emerald-800 rounded-lg font-black hover:bg-emerald-50 shrink-0 cursor-pointer shadow-2xs"
                    >
                        Accept & Activate Now
                    </button>
                </div>
            )}

            {/* Top Navbar - Mobile & Desktop */}
            <header className={`fixed inset-x-0 z-50 flex items-center justify-between bg-[#F6F7F9] px-4 py-2.5 md:px-6 md:py-3.5 border-b border-gray-200/60 shadow-sm ${isPendingAgreement ? 'top-8' : 'top-0'}`}>
                {/* Left Section: Back Button + Logo */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Back Button - Only for sub-pages */}
                    {!navItems.some(item => item.to === location.pathname) && (
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-gray-700 hover:text-[#0A84FF] shadow-sm border border-gray-200 transition-all active:scale-95 shrink-0"
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
                            className="h-9 sm:h-10 md:h-12 w-auto max-w-[140px] sm:max-w-[170px] md:max-w-[200px] object-contain"
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
                <div className="flex items-center gap-2 sm:gap-3.5">
                    {/* Real-time Online / Offline Availability Toggle Pill */}
                    {vendor && (
                        allowAvailabilityToggle !== false ? (
                            <button
                                onClick={handleToggleClick}
                                disabled={pauseLoading}
                                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs border cursor-pointer ${
                                    liveStatus.status === 'ONLINE'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        : liveStatus.status === 'PAUSED'
                                        ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                }`}
                                title={liveStatus.label}
                            >
                                <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                        liveStatus.status === 'ONLINE'
                                            ? 'bg-emerald-500 animate-pulse'
                                            : liveStatus.status === 'PAUSED'
                                            ? 'bg-amber-500'
                                            : 'bg-slate-400'
                                    }`}
                                />
                                <span className="hidden xs:inline sm:inline">
                                    {liveStatus.status === 'ONLINE'
                                        ? 'Online'
                                        : liveStatus.status === 'PAUSED'
                                        ? 'Paused'
                                        : 'Offline'}
                                </span>
                                {pauseLoading ? (
                                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                                ) : (
                                    <span
                                        className={`inline-block w-6 h-3.5 rounded-full transition-colors relative shrink-0 ${
                                            liveStatus.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-300'
                                        }`}
                                    >
                                        <span
                                            className={`absolute top-0.5 left-0.5 bg-white w-2.5 h-2.5 rounded-full transition-transform ${
                                                liveStatus.status === 'ONLINE' ? 'translate-x-2.5' : 'translate-x-0'
                                            }`}
                                        />
                                    </span>
                                )}
                            </button>
                        ) : (
                            <div
                                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold border bg-emerald-50/90 text-emerald-800 border-emerald-200 shadow-2xs"
                                title="Operating shift active (Centrally scheduled by Platform Policy)"
                            >
                                <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-500 animate-pulse" />
                                <span className="hidden xs:inline sm:inline">On-Duty</span>
                            </div>
                        )
                    )}

                    {/* Expert Name - Desktop Only */}
                    {vendor && (
                        <span className="hidden lg:block text-sm font-medium text-gray-700">
                            {vendor.name}
                        </span>
                    )}

                    {/* Language Switcher */}
                    {isLanguageEnabled && (
                        <div className="relative" ref={langDropdownRef}>
                            <button
                                onClick={() => setShowLangMenu(!showLangMenu)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200/90 text-xs font-bold text-gray-700 hover:border-blue-300 transition-all cursor-pointer shadow-2xs"
                                title="Change Language"
                            >
                                <IoGlobeOutline className="text-[#0A84FF] text-base" />
                                <span className="hidden sm:inline">{currentLangObj.nativeName}</span>
                            </button>

                            {showLangMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                                    {supportedLanguages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                setLanguage(lang.code);
                                                setShowLangMenu(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer ${
                                                language === lang.code ? "bg-blue-50 text-[#0A84FF]" : "text-gray-700 hover:bg-gray-50"
                                            }`}
                                        >
                                            <span>{lang.nativeName}</span>
                                            <span className="text-[10px] text-gray-400 font-mono">{lang.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
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
                                const IconComponent = isActive ? ActiveIcon : Icon;
                                return (
                                    <>
                                        <div
                                            className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 ${
                                                isActive
                                                    ? "bg-blue-50 text-[#0A84FF] shadow-xs"
                                                    : "text-gray-400 group-hover:text-gray-600"
                                            }`}
                                        >
                                            <IconComponent className="text-xl transition-transform group-hover:scale-110" />
                                        </div>
                                        <span
                                            className={`text-[10px] font-bold mt-0.5 tracking-tight transition-colors ${
                                                isActive
                                                    ? "text-[#0A84FF]"
                                                    : "text-gray-400"
                                            }`}
                                        >
                                            {label}
                                        </span>
                                    </>
                                );
                            }}
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* Availability Smart Pause Modal */}
            <VendorAvailabilityModal
                isOpen={showPauseModal}
                onClose={() => setShowPauseModal(false)}
                onConfirm={handleConfirmPause}
                loading={pauseLoading}
            />

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

            {/* Mandatory Expert Onboarding Agreement Modal Overlay */}
            <ExpertAgreementModal
                isOpen={showAgreementModal}
                agreementText={agreementText}
                agreementVersion={agreementVersion}
                onAccepted={() => {
                    setShowAgreementModal(false);
                    window.location.reload();
                }}
            />
        </>
    );
}
