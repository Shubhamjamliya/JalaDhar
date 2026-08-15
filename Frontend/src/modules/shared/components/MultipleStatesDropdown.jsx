import { useState, useRef, useEffect } from 'react';
import {
  IoChevronDownOutline,
  IoCheckmarkOutline,
  IoSearchOutline,
  IoCloseOutline
} from "react-icons/io5";
import { getStatesList } from '../../../utils/indianStatesDistricts';

export default function MultipleStatesDropdown({
  value = [],
  onChange,
  label = "Select Multiple States *",
  placeholder = "Select states where you provide service...",
  disabled = false,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const allStates = getStatesList();
  const selectedValues = Array.isArray(value)
    ? value
    : typeof value === 'string' && value.trim()
      ? value.split(',').map(s => s.trim()).filter(Boolean)
      : [];

  const filteredStates = allStates.filter(state =>
    state.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const toggleState = (state) => {
    let updated;
    if (selectedValues.includes(state)) {
      updated = selectedValues.filter(s => s !== state);
    } else {
      updated = [...selectedValues, state];
    }
    onChange(updated);
  };

  const removeState = (state, e) => {
    e?.stopPropagation();
    const updated = selectedValues.filter(s => s !== state);
    onChange(updated);
  };

  const handleSelectAll = (e) => {
    e?.stopPropagation();
    onChange([...allStates]);
  };

  const handleClearAll = (e) => {
    e?.stopPropagation();
    onChange([]);
  };

  return (
    <div className={`relative min-w-0 ${className}`} ref={dropdownRef}>
      {label && (
        <div className="flex items-center justify-between mb-1.5 px-1">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            {label}
          </label>
          {selectedValues.length > 0 && (
            <span className="text-[11px] font-extrabold text-[#0A84FF] bg-blue-50 px-2 py-0.5 rounded-full">
              {selectedValues.length} {selectedValues.length === 1 ? 'state' : 'states'} selected
            </span>
          )}
        </div>
      )}

      {/* Main trigger button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[48px] p-2.5 px-3.5 rounded-2xl border bg-white flex items-center justify-between gap-2 transition-all cursor-pointer shadow-2xs
          ${isOpen ? 'border-[#0A84FF] ring-4 ring-blue-50' : 'border-slate-200 hover:border-slate-300'}
          ${disabled ? 'bg-slate-50 cursor-not-allowed opacity-75' : ''}
        `}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {selectedValues.length === 0 ? (
            <span className="text-sm text-slate-400 font-medium truncate py-0.5">
              {placeholder}
            </span>
          ) : (
            selectedValues.slice(0, 3).map((state) => (
              <span
                key={state}
                className="inline-flex items-center gap-1 text-xs font-bold bg-blue-50 text-[#0A84FF] border border-blue-100/80 px-2.5 py-1 rounded-xl"
              >
                <span>{state}</span>
                <button
                  type="button"
                  onClick={(e) => removeState(state, e)}
                  className="hover:text-red-500 rounded p-0.5 transition-colors cursor-pointer"
                  title={`Remove ${state}`}
                >
                  <IoCloseOutline className="text-sm" />
                </button>
              </span>
            ))
          )}
          {selectedValues.length > 3 && (
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-xl">
              +{selectedValues.length - 3} more
            </span>
          )}
        </div>

        <IoChevronDownOutline
          className={`text-slate-400 text-base shrink-0 ml-1 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#0A84FF]' : ''
          }`}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-[130] left-0 right-0 mt-2 bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Header */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2">
            <div className="relative">
              <IoSearchOutline className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 text-base" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search state or union territory..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs sm:text-sm font-medium text-slate-800 focus:border-[#0A84FF] focus:ring-2 focus:ring-blue-100 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <IoCloseOutline className="text-base" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-[11px] font-semibold text-slate-500">
                Showing {filteredStates.length} states
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] font-extrabold text-[#0A84FF] hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] font-extrabold text-slate-500 hover:text-rose-600 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* List of States */}
          <div className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredStates.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 font-medium">
                No matching states found for "{searchQuery}"
              </div>
            ) : (
              filteredStates.map((state) => {
                const isSelected = selectedValues.includes(state);
                return (
                  <div
                    key={state}
                    onClick={() => toggleState(state)}
                    className={`flex items-center justify-between p-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{state}</span>
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[#0A84FF] border-[#0A84FF] text-white shadow-xs'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <IoCheckmarkOutline className="text-sm stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer action bar */}
          <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 px-1">
              {selectedValues.length} selected
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-[#0A84FF] text-white text-xs font-bold px-4 py-1.5 rounded-xl hover:bg-blue-600 transition-colors cursor-pointer shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Selected tags list below dropdown if more than 3 selected */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 px-1">
          {selectedValues.map((state) => (
            <span
              key={state}
              className="inline-flex items-center gap-1 text-[11px] font-bold bg-white text-slate-700 border border-slate-200/90 px-2 py-0.5 rounded-lg shadow-2xs"
            >
              <span>{state}</span>
              <button
                type="button"
                onClick={(e) => removeState(state, e)}
                className="text-slate-400 hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                title={`Remove ${state}`}
              >
                <IoCloseOutline className="text-xs" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
