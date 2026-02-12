import { useState, useRef, useEffect } from 'react';
import { IoChevronDownOutline } from "react-icons/io5";

export default function CustomDropdown({
  options,
  value,
  onChange,
  label,
  name,
  placeholder = "Select an option",
  disabled = false,
  className = ""
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

  return (
    <div className={`relative min-w-0 ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-bold text-gray-700 mb-2">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full h-12 px-4 text-left border rounded-2xl flex items-center justify-between transition-all duration-200 bg-white
                    ${isOpen ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-200 hover:border-gray-300'}
                    ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-75' : 'cursor-pointer'}
                `}
      >
        <span className={`truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900 font-medium'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <IoChevronDownOutline
          className={`text-gray-400 text-lg transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="p-1">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  if (name) {
                    // Imitate event object for form handlers
                    onChange({ target: { name, value: option.value } });
                  } else {
                    onChange(option.value);
                  }
                  setIsOpen(false);
                }}
                className={`px-4 py-3 text-sm cursor-pointer rounded-xl transition-colors truncate mb-1 last:mb-0
                                    ${value === option.value
                    ? "bg-green-50 text-green-700 font-bold"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }
                                `}
              >
                {option.label}
              </div>
            ))}
            {options.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-400 text-center italic">
                No options available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
