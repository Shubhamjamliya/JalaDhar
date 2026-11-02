import { useState, useEffect, useCallback, useRef } from 'react';
import { getPublicSettings } from '../services/settingsApi';
import { useOptionalNotifications } from '../contexts/NotificationContext';

const POLL_INTERVAL_MS = 60 * 1000;

export const BOOKING_NOTICE_DEFAULTS = {
  title: 'Survey Bookings Opening Soon',
  message: 'Bookings will be open from Nov. 1 onwards',
  reopenDate: '1st November, 2026',
  description:
    'We are currently onboarding verified hydrogeologists and calibrating scientific survey equipment for the new season. Booking will officially open on November 1st. In the meantime, you can explore services and sample survey reports.',
  buttonText: 'Got it, Explore Platform'
};

const toBool = (v) => v === true || v === 'true' || v === 1 || v === '1';

/**
 * Turns the public "general" settings list into a booking-disabled config.
 * Returns null when new bookings are allowed.
 * (A missing ALLOW_NEW_BOOKINGS key is treated as "paused", matching the backend default.)
 */
export const parseBookingAvailability = (settingsList) => {
  if (!Array.isArray(settingsList)) return undefined;
  const get = (key) => settingsList.find((s) => s?.key === key)?.value;

  const allowRaw = get('ALLOW_NEW_BOOKINGS');
  const isAllowed = allowRaw === undefined ? false : toBool(allowRaw);
  if (isAllowed) return null;

  const popupEnabled = get('BOOKING_DISABLED_POPUP_ENABLED');
  const str = (key, fallback) => {
    const v = get(key);
    return typeof v === 'string' && v.trim() ? v : fallback;
  };

  return {
    title: str('BOOKING_DISABLED_POPUP_TITLE', BOOKING_NOTICE_DEFAULTS.title),
    message: str('BOOKING_DISABLED_MESSAGE', BOOKING_NOTICE_DEFAULTS.message),
    reopenDate: str('BOOKING_REOPEN_DATE', BOOKING_NOTICE_DEFAULTS.reopenDate),
    description: str('BOOKING_DISABLED_DESCRIPTION', BOOKING_NOTICE_DEFAULTS.description),
    buttonText: str('BOOKING_DISABLED_BUTTON_TEXT', BOOKING_NOTICE_DEFAULTS.buttonText),
    popupEnabled: popupEnabled === undefined ? true : toBool(popupEnabled)
  };
};

/**
 * Single source of truth for the "new bookings paused" state set in
 * Admin → Settings → Booking Controls.
 *
 * Returns `null` while bookings are open (or before the first load), otherwise the
 * notice config. Stays in sync with admin edits via socket (when available),
 * window focus, tab visibility, and a light poll — so it also works on the public
 * landing page, which has no socket.
 */
export default function useBookingAvailability() {
  const [config, setConfig] = useState(null);

  // null outside NotificationProvider (public landing page) — falls back to focus/poll refresh
  const socket = useOptionalNotifications()?.socket || null;

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await getPublicSettings('general');
      if (!mounted.current || !res?.success) return;
      const parsed = parseBookingAvailability(res.data?.settings);
      if (parsed !== undefined) setConfig(parsed);
    } catch (err) {
      console.warn('[useBookingAvailability] Could not load booking availability:', err?.message);
    }
  }, []);

  useEffect(() => {
    refresh();

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(refresh, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, [refresh]);

  useEffect(() => {
    if (!socket) return;
    socket.on('platform_settings_updated', refresh);
    return () => socket.off('platform_settings_updated', refresh);
  }, [socket, refresh]);

  return config;
}
