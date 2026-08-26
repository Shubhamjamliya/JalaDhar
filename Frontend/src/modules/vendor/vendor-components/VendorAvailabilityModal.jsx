import React, { useState } from 'react';
import {
  IoTimeOutline,
  IoCalendarOutline,
  IoMoonOutline,
  IoShieldCheckmarkOutline,
  IoCloseOutline,
  IoCheckmarkCircle
} from 'react-icons/io5';

/**
 * VendorAvailabilityModal
 * Dialog for selecting pause duration when going offline.
 */
export default function VendorAvailabilityModal({ isOpen, onClose, onConfirm, loading = false }) {
  const [selectedDuration, setSelectedDuration] = useState('REST_OF_TODAY');

  if (!isOpen) return null;

  const options = [
    {
      id: 'REST_OF_TODAY',
      title: 'Busy for Rest of Today',
      subtitle: 'Auto-resumes tomorrow morning at your shift start time',
      badge: 'Recommended',
      Icon: IoCalendarOutline,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200'
    },
    {
      id: '2_HOURS',
      title: 'Short Break (2 Hours)',
      subtitle: 'Great for lunch break, transit, or active on-site drilling',
      badge: 'Quick Pause',
      Icon: IoTimeOutline,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    {
      id: 'INDEFINITE',
      title: 'Offline Indefinitely',
      subtitle: 'Stay offline until you manually toggle back on',
      badge: 'Manual',
      Icon: IoMoonOutline,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
      border: 'border-slate-200'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(selectedDuration);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <IoTimeOutline className="text-xl" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Pause Availability
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Choose your offline duration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <IoCloseOutline className="text-xl" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2.5">
            {options.map((opt) => {
              const isSelected = selectedDuration === opt.id;
              const { Icon } = opt;
              return (
                <label
                  key={opt.id}
                  onClick={() => setSelectedDuration(opt.id)}
                  className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-[#0A84FF] bg-blue-50/40 shadow-xs'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${opt.bg} ${opt.color}`}
                  >
                    <Icon className="text-lg" />
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        {opt.title}
                      </span>
                      {opt.badge && (
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-[#0A84FF] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                      {opt.subtitle}
                    </p>
                  </div>
                  <div className="mt-1">
                    {isSelected ? (
                      <IoCheckmarkCircle className="text-[#0A84FF] text-xl" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          {/* Reassurance Guardrails */}
          <div className="flex items-start gap-2.5 p-3 bg-emerald-50/80 rounded-xl border border-emerald-100 text-emerald-900">
            <IoShieldCheckmarkOutline className="text-emerald-600 text-base shrink-0 mt-0.5" />
            <p className="text-[11px] font-medium leading-relaxed">
              <strong className="font-bold">Ongoing Workflows Protected:</strong> Active bookings, OTP verification, survey report uploads, and wallet withdrawals remain 100% active while offline.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-[#0A84FF] hover:bg-[#0070DF] active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Confirm Offline</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
