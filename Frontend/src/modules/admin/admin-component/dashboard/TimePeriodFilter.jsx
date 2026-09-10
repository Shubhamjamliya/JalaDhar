import React, { useState, useRef, useEffect } from 'react';
import { FiCalendar, FiDownload, FiCheck, FiX } from 'react-icons/fi';

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

  const handleApplyCustom = () => {
    if (!startDate || !endDate) return;
    onPeriodChange('custom', { startDate, endDate });
    setShowPicker(false);
  };

  const applyPreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const sStr = start.toISOString().slice(0, 10);
    const eStr = end.toISOString().slice(0, 10);
    setStartDate(sStr);
    setEndDate(eStr);
    onPeriodChange('custom', { startDate: sStr, endDate: eStr });
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
                  {new Date(customRange.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} -{' '}
                  {new Date(customRange.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </button>

            {/* Date Range Popover */}
            {showPicker && (
              <div className="absolute left-0 top-12 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 animate-enter">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Custom Date Range</h4>
                  <button
                    onClick={() => setShowPicker(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-2 gap-1.5 py-3 border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => applyPreset(7)}
                    className="px-2.5 py-1.5 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-[#0A84FF] text-xs font-semibold rounded-lg transition-colors text-center"
                  >
                    Last 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(30)}
                    className="px-2.5 py-1.5 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-[#0A84FF] text-xs font-semibold rounded-lg transition-colors text-center"
                  >
                    Last 30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(60)}
                    className="px-2.5 py-1.5 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-[#0A84FF] text-xs font-semibold rounded-lg transition-colors text-center"
                  >
                    Last 60 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(90)}
                    className="px-2.5 py-1.5 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-[#0A84FF] text-xs font-semibold rounded-lg transition-colors text-center"
                  >
                    Last 90 Days
                  </button>
                </div>

                {/* Date Inputs */}
                <div className="space-y-3 pt-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">From Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A84FF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">To Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A84FF] outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleApplyCustom}
                      disabled={!startDate || !endDate}
                      className="flex-1 py-2 bg-[#0A84FF] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
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
