import { useState, useEffect, useRef } from "react";
import { IoChevronDownOutline, IoLocationOutline } from "react-icons/io5";

export default function StateDistrictInput({
  label,
  value,
  onChange,
  onSelectSuggestion,
  suggestions = [],
  placeholder = "Type to search...",
  required = false,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    if (onSelectSuggestion) {
      onSelectSuggestion(item);
    } else if (onChange) {
      onChange(item);
    }
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          required={required}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm pr-10"
        />
        <IoChevronDownOutline
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-500" : ""}`}
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 divide-y divide-gray-50 py-1 text-sm">
          {suggestions.map((item, index) => (
            <li
              key={index}
              onClick={() => handleSelect(item)}
              className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors text-gray-800 hover:text-blue-600"
            >
              <span className="font-medium">{item}</span>
              <IoLocationOutline className="text-gray-400 text-xs" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
