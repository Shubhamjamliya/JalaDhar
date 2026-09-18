import React, { useEffect, useState, useCallback } from 'react';
import { IoMegaphoneOutline, IoCalendarOutline, IoCloseOutline } from 'react-icons/io5';
import { getPublicSettings } from '../../../services/settingsApi';
import { useNotifications } from '../../../contexts/NotificationContext';

/**
 * PlatformNoticeBanner
 * Displays an admin-configured announcement notice banner across designated portals.
 *
 * @param {'landing' | 'user' | 'vendor'} portal - Target portal name
 * @param {string} className - Optional additional CSS classes
 * @param {function} onVisibilityChange - Optional callback receiving (boolean)
 */
export default function PlatformNoticeBanner({ portal = 'landing', className = '', onVisibilityChange }) {
    const [noticeSettings, setNoticeSettings] = useState({
        enabled: false,
        text: 'Survey bookings will be open from 1st  November, 2026 onwards ',
        showLanding: true,
        showUser: true,
        showVendor: true,
        type: 'info'
    });
    const [dismissed, setDismissed] = useState(false);
    const [loading, setLoading] = useState(true);

    // Safely attempt to access socket from NotificationContext
    let socket = null;
    try {
        const notifContext = useNotifications();
        socket = notifContext?.socket;
    } catch {
        // Rendered outside NotificationProvider (e.g. Landing Page)
        socket = null;
    }

    const applySettingsList = useCallback((settingsList) => {
        if (!Array.isArray(settingsList)) return;

        let enabled = false;
        let text = 'Survey bookings will be open from 1st  November, 2026 onwards ';
        let showLanding = true;
        let showUser = true;
        let showVendor = true;
        let type = 'info';

        settingsList.forEach((s) => {
            if (!s || !s.key) return;
            if (s.key === 'PLATFORM_ANNOUNCEMENT_ENABLED') {
                enabled = s.value === true || s.value === 'true' || s.value === 1 || s.value === '1';
            } else if (s.key === 'PLATFORM_ANNOUNCEMENT_TEXT') {
                if (typeof s.value === 'string' && s.value.trim()) {
                    text = s.value;
                }
            } else if (s.key === 'PLATFORM_ANNOUNCEMENT_SHOW_LANDING') {
                showLanding = s.value === true || s.value === 'true' || s.value === 1 || s.value === '1';
            } else if (s.key === 'PLATFORM_ANNOUNCEMENT_SHOW_USER') {
                showUser = s.value === true || s.value === 'true' || s.value === 1 || s.value === '1';
            } else if (s.key === 'PLATFORM_ANNOUNCEMENT_SHOW_VENDOR') {
                showVendor = s.value === true || s.value === 'true' || s.value === 1 || s.value === '1';
            } else if (s.key === 'PLATFORM_ANNOUNCEMENT_TYPE') {
                type = s.value || 'info';
            }
        });

        // Check if previously dismissed in this session for the current exact text
        const sessionDismissedText = sessionStorage.getItem('dismissed_platform_notice');
        const isDismissed = sessionDismissedText === text.trim();

        setDismissed(isDismissed);
        setNoticeSettings({
            enabled,
            text,
            showLanding,
            showUser,
            showVendor,
            type
        });
    }, []);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await getPublicSettings('general');
            if (res?.success && res?.data?.settings) {
                applySettingsList(res.data.settings);
            }
        } catch (err) {
            console.warn('[PlatformNoticeBanner] Failed to fetch settings:', err?.message);
        } finally {
            setLoading(false);
        }
    }, [applySettingsList]);

    useEffect(() => {
        fetchSettings();

        // Refetch on window focus
        const onFocus = () => fetchSettings();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [fetchSettings]);

    // Real-time socket sync
    useEffect(() => {
        if (!socket) return;

        const handleSettingsUpdate = (data) => {
            if (data?.settings && Array.isArray(data.settings)) {
                // If any announcement keys were updated, reload or apply
                const hasAnnouncementKey = data.settings.some((s) => s?.key?.startsWith('PLATFORM_ANNOUNCEMENT_'));
                if (hasAnnouncementKey) {
                    fetchSettings();
                }
            } else if (data?.key && data.key.startsWith('PLATFORM_ANNOUNCEMENT_')) {
                fetchSettings();
            }
        };

        socket.on('platform_settings_updated', handleSettingsUpdate);
        return () => {
            socket.off('platform_settings_updated', handleSettingsUpdate);
        };
    }, [socket, fetchSettings]);

    // Determine target portal visibility
    const isTargetPortalActive =
        (portal === 'landing' && noticeSettings.showLanding) ||
        (portal === 'user' && noticeSettings.showUser) ||
        (portal === 'vendor' && noticeSettings.showVendor);

    const isVisible = !loading && noticeSettings.enabled && !dismissed && isTargetPortalActive;

    useEffect(() => {
        if (onVisibilityChange) {
            onVisibilityChange(isVisible);
        }
    }, [isVisible, onVisibilityChange]);

    const handleDismiss = () => {
        sessionStorage.setItem('dismissed_platform_notice', noticeSettings.text.trim());
        setDismissed(true);
    };

    if (!isVisible) return null;

    // Gradient variants
    const gradientClasses =
        noticeSettings.type === 'warning'
            ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white'
            : noticeSettings.type === 'success'
            ? 'bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white'
            : 'bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white';

    const borderClasses =
        noticeSettings.type === 'warning'
            ? 'border-b border-amber-400/40'
            : noticeSettings.type === 'success'
            ? 'border-b border-emerald-400/40'
            : 'border-b border-blue-400/30';

    return (
        <aside
            aria-label="Platform Announcement"
            className={`w-full relative z-[65] transition-all duration-300 ${gradientClasses} ${borderClasses} shadow-sm ${className}`}
        >
            <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2.5">
                {/* Notice Content */}
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    {/* Badge */}
                    <span className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] sm:text-xs tracking-wider uppercase shadow-2xs">
                        <IoCalendarOutline className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>Notice</span>
                    </span>

                    {/* Text */}
                    <p className="text-xs sm:text-sm font-medium text-white/95 leading-snug truncate sm:whitespace-normal">
                        {noticeSettings.text}
                    </p>
                </div>

                {/* Dismiss Button */}
                <button
                    type="button"
                    onClick={handleDismiss}
                    className="shrink-0 p-1 sm:p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer focus:outline-hidden"
                    title="Dismiss notification"
                    aria-label="Dismiss notice"
                >
                    <IoCloseOutline className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            </div>
        </aside>
    );
}
