import { useState, useRef, useEffect } from 'react';
import { IoChevronDownOutline, IoCheckmarkOutline } from "react-icons/io5";

export default function CustomDropdown({
  options,
  value,
  onChange,
  label,
  name,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  activeColor = "blue", // "blue" | "teal" | "green"
  size = "md", // "sm" | "md"
  isInline = false // If true, menu expands in-flow inside parent containers/modals instead of absolute floating
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const selectedOption = options.find(opt => opt.value === value);

  // Styling maps based on activeColor
  const focusRingStyles = {
    blue: "border-[#0A84FF] ring-4 ring-blue-50",
    teal: "border-teal-500 ring-4 ring-teal-50",
    green: "border-green-500 ring-4 ring-green-50",
  }[activeColor] || "border-[#0A84FF] ring-4 ring-blue-50";

  const selectedItemStyles = {
    blue: "bg-blue-50 text-blue-700 font-bold",
    teal: "bg-teal-50 text-teal-700 font-bold",
    green: "bg-green-50 text-green-700 font-bold",
  }[activeColor] || "bg-blue-50 text-blue-700 font-bold";

  const checkmarkStyles = {
    blue: "text-blue-600",
    teal: "text-teal-600",
    green: "text-green-600",
  }[activeColor] || "text-blue-600";

  const heightStyle = size === "sm" ? "h-10 text-xs px-3 rounded-xl" : "h-12 text-sm px-4 rounded-2xl";

  const menuContainerStyle = isInline
    ? "relative z-10 w-full mt-2 bg-slate-50/70 border border-slate-200/80 rounded-2xl max-h-56 overflow-y-auto overflow-x-hidden custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-150"
    : "absolute z-[120] w-full mt-1.5 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-52 overflow-y-auto overflow-x-hidden custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-150";

  return (
    <div className={`relative min-w-0 ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full ${heightStyle} text-left border flex items-center justify-between transition-all duration-200 bg-white shadow-2xs
                    ${isOpen ? focusRingStyles : 'border-slate-200/90 hover:border-slate-300'}
                    ${disabled ? 'bg-slate-50 cursor-not-allowed opacity-75' : 'cursor-pointer'}
                `}
      >
        <span className={`truncate ${!selectedOption ? 'text-slate-400 font-normal' : 'text-slate-800 font-semibold'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <IoChevronDownOutline
          className={`text-slate-400 text-base shrink-0 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className={menuContainerStyle}>
          <div className="p-1.5 space-y-0.5">
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <div
                  key={option.value}
                  onClick={() => {
                    if (name) {
                      onChange({ target: { name, value: option.value } });
                    } else {
                      onChange(option.value);
                    }
                    setIsOpen(false);
                  }}
                  className={`px-3.5 py-2.5 text-xs font-semibold cursor-pointer rounded-xl transition-all flex items-center justify-between truncate
                    ${isSelected
                      ? selectedItemStyles
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }
                  `}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <IoCheckmarkOutline className={`text-base shrink-0 ml-2 ${checkmarkStyles}`} />}
                </div>
              );
            })}
            {options.length === 0 && (
              <div className="px-4 py-3 text-xs text-slate-400 text-center italic">
                No options available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
