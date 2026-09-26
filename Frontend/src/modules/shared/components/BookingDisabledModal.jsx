import React from "react";
import {
  IoCalendarOutline,
  IoCloseOutline,
  IoSparklesOutline,
  IoDocumentTextOutline,
  IoPersonOutline,
  IoShieldCheckmarkOutline,
  IoLogoWhatsapp,
  IoMailOutline,
  IoCallOutline,
  IoInformationCircleOutline
} from "react-icons/io5";

/**
 * BookingDisabledModal
 * Modern, responsive modal shown to customers when new survey bookings are temporarily disabled by the platform.
 * Displays admin-configured reopen date, announcement message, and guidance.
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Closes the modal
 * @param {object} settings - Admin-configured settings
 * @param {function} onExplore - Optional action handler when user clicks "Explore Services"
 */
export default function BookingDisabledModal({
  isOpen,
  onClose,
  settings = {},
  onExplore
}) {
  if (!isOpen) return null;

  const title = settings.title || settings.BOOKING_DISABLED_POPUP_TITLE || "Survey Bookings Opening Soon";
  const mainMessage = settings.message || settings.BOOKING_DISABLED_MESSAGE || "Bookings will be open from Nov. 1 onwards";
  const reopenDate = settings.reopenDate || settings.BOOKING_REOPEN_DATE || "1st November, 2026";
  const description = settings.description || settings.BOOKING_DISABLED_DESCRIPTION || "We are currently onboarding certified hydrogeologists and preparing our geoscientific survey teams for the upcoming season. Survey bookings will officially open on November 1st. In the meantime, you can explore services, review sample reports, and get ready.";
  const buttonText = settings.buttonText || settings.BOOKING_DISABLED_BUTTON_TEXT || "Got it, Explore Platform";

  const handleAction = () => {
    if (onExplore) {
      onExplore();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Gradient Ribbon */}
        <div className="h-2.5 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 w-full" />

        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer z-10"
            aria-label="Close modal"
          >
            <IoCloseOutline className="text-xl" />
          </button>
        )}

        <div className="p-6 sm:p-7 space-y-5">
          {/* Header Icon & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 text-[#0A84FF] shadow-sm mb-1">
              <IoCalendarOutline className="text-3xl" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-black uppercase tracking-wider">
              <IoSparklesOutline className="text-amber-500" />
              <span>Platform Notice</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {title}
            </h3>
          </div>

          {/* Highlighted Announcement Card */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-100/60 border border-amber-200/90 shadow-2xs space-y-2 text-center">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2.5 py-0.5 rounded-full inline-block">
              📅 Scheduled Launch
            </span>
            <p className="text-base sm:text-lg font-black text-amber-950 leading-snug">
              {mainMessage}
            </p>
            {reopenDate && (
              <p className="text-xs font-bold text-amber-900/80 flex items-center justify-center gap-1">
                <span>Official Date:</span>
                <strong className="text-amber-950 underline decoration-amber-300 underline-offset-2">{reopenDate}</strong>
              </p>
            )}
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-center px-1">
            {description}
          </p>

          {/* While you wait features card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider block text-[10.5px]">
              What you can explore right now:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                <IoDocumentTextOutline className="text-blue-600 text-base shrink-0" />
                <span className="font-semibold text-[11.5px] truncate">Certified Sample Reports</span>
              </div>
              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                <IoPersonOutline className="text-emerald-600 text-base shrink-0" />
                <span className="font-semibold text-[11.5px] truncate">Verified Hydrogeologists</span>
              </div>
              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                <IoShieldCheckmarkOutline className="text-indigo-600 text-base shrink-0" />
                <span className="font-semibold text-[11.5px] truncate">Transparent Travel Slabs</span>
              </div>
              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                <IoInformationCircleOutline className="text-amber-600 text-base shrink-0" />
                <span className="font-semibold text-[11.5px] truncate">Geoscientific FAQs</span>
              </div>
            </div>
          </div>

          {/* Contact Support Strip */}
          <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-slate-100">
            <span className="font-medium text-center sm:text-left">
              Need urgent assistance or corporate survey?
            </span>
            <div className="flex items-center gap-3 font-bold">
              <a
                href="https://wa.me/918019239898?text=Hello%20Jaladhaara%20Support,%20I%20have%20an%20inquiry%20regarding%20survey%20bookings."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                <IoLogoWhatsapp className="text-sm" />
                <span>WhatsApp</span>
              </a>
              <span className="text-slate-300">•</span>
              <a
                href="tel:+918019239898"
                className="flex items-center gap-1 text-[#0A84FF] hover:text-[#005BBB] hover:underline"
              >
                <IoCallOutline className="text-sm" />
                <span>+91 80192 39898</span>
              </a>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleAction}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#0A84FF] to-blue-700 hover:from-[#0070DF] hover:to-blue-800 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>{buttonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
