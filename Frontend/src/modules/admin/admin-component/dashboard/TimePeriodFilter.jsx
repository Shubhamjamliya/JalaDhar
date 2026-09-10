import React, { useState, useRef, useEffect } from 'react';
import { FiCalendar, FiDownload, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';

// Convert a Date object to YYYY-MM-DD using local time (avoids UTC timezone shifts)
export const toLocalIsoDate = (d) => {
  if (!d) return '';
  const dateObj = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format YYYY-MM-DD to DD/MM/YYYY
export const formatToDDMMYYYY = (isoDateStr) => {
  if (!isoDateStr) return '';
  const parts = String(isoDateStr).slice(0, 10).split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return isoDateStr;
};

// Parse user entered DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD
export const parseFromDDMMYYYY = (displayStr) => {
  if (!displayStr) return '';
  const clean = displayStr.trim();
  const parts = clean.split(/[-/.]/);
  if (parts.length === 3) {
    let [d, m, y] = parts;
    if (d.length === 1) d = '0' + d;
    if (m.length === 1) m = '0' + m;
    if (y.length === 2) y = '20' + y;
    const numD = Number(d);
    const numM = Number(m);
    const numY = Number(y);
    if (numY >= 2000 && numY <= 2100 && numM >= 1 && numM <= 12 && numD >= 1 && numD <= 31) {
      return `${y}-${m}-${d}`;
    }
  }
  return '';
};

// Format YYYY-MM-DD to friendly string like "25 Sep 2026"
export const formatFriendlyDate = (isoDateStr) => {
  if (!isoDateStr) return '';
  const parts = String(isoDateStr).slice(0, 10).split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (!Number.isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
  return isoDateStr;
};

// Date input field with DD/MM/YYYY display, direct typing, and calendar picker
const DateInputField = ({ label, value, onChange, min, max, error }) => {
  const [displayText, setDisplayText] = useState(() => formatToDDMMYYYY(value));
  const hiddenInputRef = useRef(null);

  useEffect(() => {
    setDisplayText(formatToDDMMYYYY(value));
  }, [value]);

  const handleTextChange = (e) => {
    const text = e.target.value;
    setDisplayText(text);
    const parsed = parseFromDDMMYYYY(text);
    if (parsed) {
      onChange(parsed);
    }
  };

  const handleNativePickerChange = (e) => {
    const pickedIso = e.target.value;
    if (pickedIso) {
      onChange(pickedIso);
      setDisplayText(formatToDDMMYYYY(pickedIso));
    }
  };

  const openPicker = () => {
    try {
      hiddenInputRef.current?.showPicker();
    } catch {
      hiddenInputRef.current?.focus();
    }
  };

  const friendly = formatFriendlyDate(value);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[11px] font-bold text-gray-600">
          {label} <span className="font-normal text-gray-400">(DD/MM/YYYY)</span>
        </label>
        {friendly && (
          <span className="text-[10px] font-bold text-[#0A84FF] bg-blue-50 px-1.5 py-0.5 rounded">
            {friendly}
          </span>
        )}
      </div>

      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="DD/MM/YYYY"
          value={displayText}
          onChange={handleTextChange}
          maxLength={10}
          className={`w-full pl-3 pr-10 py-2 text-xs font-bold text-gray-800 bg-white border ${
            error ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100 focus:border-[#0A84FF]'
          } rounded-xl focus:ring-2 outline-none transition-all`}
        />

        {/* Calendar button and overlay */}
        <div className="absolute right-1.5 flex items-center justify-center">
          <button
            type="button"
            onClick={openPicker}
            title="Open calendar picker"
            className="p-1.5 text-gray-500 hover:text-[#0A84FF] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
          >
            <FiCalendar className="w-4 h-4" />
          </button>
          <input
            ref={hiddenInputRef}
            type="date"
            value={value || ''}
            min={min || undefined}
            max={max || undefined}
            onChange={handleNativePickerChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
      </div>
      {error && (
        <p className="text-[10px] font-semibold text-red-500 mt-1 flex items-center gap-1">
          <FiAlertCircle className="w-3 h-3 flex-shrink-0" /> {error}
        </p>
      )}
    </div>
  );
};

const TimePeriodFilter = ({
  selectedPeriod,
  onPeriodChange,
  onExport,
  customRange = { startDate: '', endDate: '' }
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [startDate, setStartDate] = useState(customRange.startDate || '');
  const [endDate, setEndDate] = useState(customRange.endDate || '');
  const pickerRef = useRef(null);

  const periods = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' },
  ];

  // Sync state if customRange prop changes externally
  useEffect(() => {
    if (customRange.startDate) setStartDate(customRange.startDate);
    if (customRange.endDate) setEndDate(customRange.endDate);
  }, [customRange.startDate, customRange.endDate]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  const isRangeInvalid = Boolean(startDate && endDate && startDate > endDate);

  const handleApplyCustom = () => {
    if (!startDate || !endDate || isRangeInvalid) return;
    onPeriodChange('custom', { startDate, endDate });
    setShowPicker(false);
  };

  const applyPreset = (days) => {
    const now = new Date();
    const endStr = toLocalIsoDate(now);
    const startObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
    const startStr = toLocalIsoDate(startObj);

    setStartDate(startStr);
    setEndDate(endStr);
    onPeriodChange('custom', { startDate: startStr, endDate: endStr });
    setShowPicker(false);
  };

  const isCustomActive = selectedPeriod === 'custom';

  return (
    <div className="w-full relative">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left group: calendar toggle + segmented control */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Calendar button with active indicator */}
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              title="Select custom date range"
              className={`h-10 px-3 rounded-xl border flex items-center gap-2 text-sm font-semibold transition-all cursor-pointer shadow-xs ${
                isCustomActive
                  ? 'bg-blue-50 text-[#0A84FF] border-[#0A84FF] ring-2 ring-blue-100'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              aria-label="Calendar"
            >
              <FiCalendar className="w-4 h-4" />
              {isCustomActive && customRange.startDate && customRange.endDate && (
                <span className="text-xs font-bold whitespace-nowrap">
                  {formatToDDMMYYYY(customRange.startDate)} - {formatToDDMMYYYY(customRange.endDate)}
                </span>
              )}
            </button>

            {/* Date Range Popover */}
            {showPicker && (
              <div className="absolute left-0 top-12 z-50 w-84 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 animate-enter">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Custom Date Range</h4>
                  <button
                    onClick={() => setShowPicker(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-2 gap-1.5 py-3 border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => applyPreset(7)}
                    className="px-2.5 py-1.5 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-[#0A84FF] text-xs font-bold rounded-lg transition-colors text-center cursor-pointer"
                  >
                    Last 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(30)}
                    className="px-2.5 py-1.5 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-[#0A84FF] text-xs font-bold rounded-lg transition-colors text-center cursor-pointer"
                  >
                    Last 30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(60)}
                    className="px-2.5 py-1.5 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-[#0A84FF] text-xs font-bold rounded-lg transition-colors text-center cursor-pointer"
                  >
                    Last 60 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(90)}
                    className="px-2.5 py-1.5 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-[#0A84FF] text-xs font-bold rounded-lg transition-colors text-center cursor-pointer"
                  >
                    Last 90 Days
                  </button>
                </div>

                {/* Date Inputs in DD/MM/YYYY format */}
                <div className="space-y-3 pt-3">
                  <DateInputField
                    label="From Date"
                    value={startDate}
                    onChange={(newStart) => setStartDate(newStart)}
                    max={endDate || undefined}
                    error={isRangeInvalid ? 'From Date cannot be after To Date' : ''}
                  />

                  <DateInputField
                    label="To Date"
                    value={endDate}
                    onChange={(newEnd) => setEndDate(newEnd)}
                    min={startDate || undefined}
                  />

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleApplyCustom}
                      disabled={!startDate || !endDate || isRangeInvalid}
                      className="flex-1 py-2 bg-[#0A84FF] hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FiCheck className="w-3.5 h-3.5" />
                      Apply Filter
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPicker(false)}
                      className="px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Segmented Period Tabs */}
          <div className="flex items-center bg-gray-100 rounded-2xl p-1.5 overflow-x-auto scrollbar-hide">
            {periods.map((p) => {
              const active = selectedPeriod === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => onPeriodChange(p.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-700 hover:bg-white/60'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Export CSV */}
        <button
          type="button"
          onClick={onExport}
          className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center gap-2 shadow-sm active:scale-[0.98] whitespace-nowrap cursor-pointer"
        >
          <FiDownload className="w-4 h-4" />
          Export CSV
        </button>
      </div>
    </div>
  );
};

export default TimePeriodFilter;
