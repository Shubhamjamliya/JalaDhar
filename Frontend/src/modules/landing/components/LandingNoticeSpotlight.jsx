import React, { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { getPublicSettings } from '../../../services/settingsApi';
import { useNotifications } from '../../../contexts/NotificationContext';

const THEMES = {
  warning: {
    bar: 'bg-[#FFF9E6] border-t border-b border-[#FDE68A] text-amber-950',
    icon: AlertTriangle,
    iconClass: 'text-amber-600',
    badgeClass: 'text-amber-950',
    textClass: 'text-slate-800'
  },
  info: {
    bar: 'bg-[#EFF6FF] border-t border-b border-[#BFDBFE] text-blue-950',
    icon: Info,
    iconClass: 'text-[#0077B6]',
    badgeClass: 'text-blue-950',
    textClass: 'text-slate-800'
  },
  success: {
    bar: 'bg-[#F0FDF4] border-t border-b border-[#BBF7D0] text-emerald-950',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
    badgeClass: 'text-emerald-950',
    textClass: 'text-slate-800'
  }
};

/**
 * LandingNoticeSpotlight / PlatformNoticeSpotlight
 * Sub-Navbar Announcement Bar (Naukri Campus Reference Style).
 * Dynamically styled with Admin-configurable enable/disable, text, and color themes.
 * Rendered full-width directly beneath Navbar across Landing, User, and Vendor portals.
 *
 * @param {'landing' | 'user' | 'vendor'} portal - Target portal
 */
export default function LandingNoticeSpotlight({ variant = 'subnav', portal = 'landing' }) {
  const [noticeSettings, setNoticeSettings] = useState({
    enabled: true,
    text: 'Survey bookings will be open from 1st  November, 2026 onwards ',
    showLanding: true,
    showUser: true,
    showVendor: true,
    type: 'warning'
  });
  const [loading, setLoading] = useState(true);

  let socket = null;
  try {
    const notifContext = useNotifications();
    socket = notifContext?.socket;
  } catch {
    socket = null;
  }

  // Parse settings from backend
  const applySettingsList = useCallback((settingsList) => {
    if (!Array.isArray(settingsList)) return;

    let enabled = false;
    let text = 'Survey bookings will be open from 1st  November, 2026 onwards ';
    let showLanding = true;
    let showUser = true;
    let showVendor = true;
    let type = 'warning';

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
        type = s.value || 'warning';
      }
    });

    setNoticeSettings({ enabled, text, showLanding, showUser, showVendor, type });
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await getPublicSettings('general');
      if (res?.success && res?.data?.settings) {
        applySettingsList(res.data.settings);
      }
    } catch (err) {
      console.warn('[LandingNoticeSpotlight] Fetch error:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [applySettingsList]);

  useEffect(() => {
    fetchSettings();

    const onFocus = () => fetchSettings();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchSettings]);

  // Real-time sync with admin updates
  useEffect(() => {
    if (!socket) return;

    const handleSettingsUpdate = (data) => {
      if (data?.settings && Array.isArray(data.settings)) {
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

  // Determine visibility per target portal
  const isPortalActive =
    (portal === 'landing' && noticeSettings.showLanding) ||
    (portal === 'user' && noticeSettings.showUser) ||
    (portal === 'vendor' && noticeSettings.showVendor);

  const isVisible = !loading && noticeSettings.enabled && isPortalActive;

  if (!isVisible) return null;

  const currentTheme = THEMES[noticeSettings.type] || THEMES.warning;
  const IconComponent = currentTheme.icon;

  return (
    <aside
      aria-label="Platform Announcement"
      className={`w-full py-1.5 sm:py-2 px-3 sm:px-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-colors duration-300 ${currentTheme.bar}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-1.5 sm:gap-2 text-center text-xs sm:text-sm font-medium">
        <IconComponent className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 inline-block -mt-0.5 ${currentTheme.iconClass}`} />
        <p className="leading-snug">
          <strong className={`font-bold mr-1 ${currentTheme.badgeClass}`}>Notice:</strong>
          <span className={`font-semibold ${currentTheme.textClass}`}>{noticeSettings.text}</span>
        </p>
      </div>
    </aside>
  );
}

