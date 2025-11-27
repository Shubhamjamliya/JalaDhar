import { useState, useEffect } from "react";
import { IoCloseOutline, IoAlertCircleOutline } from "react-icons/io5";

/**
 * Reusable Input Modal Component
 * Replaces browser prompt() dialogs with a styled modal
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Function to close the modal
 * @param {function} onSubmit - Function to execute with input value when user submits
 * @param {string} title - Modal title
 * @param {string} message - Input prompt message
 * @param {string} placeholder - Placeholder text for input
 * @param {string} submitText - Text for submit button (default: "Submit")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {number} minLength - Minimum input length (optional)
 * @param {number} maxLength - Maximum input length (optional)
 * @param {boolean} isTextarea - Use textarea instead of input (default: false)
 * @param {number} textareaRows - Number of rows for textarea (default: 4)
 * @param {string} initialValue - Initial input value (optional)
 */
export default function InputModal({
    isOpen,
    onClose,
    onSubmit,
    title = "Enter Information",
    message = "Please provide the required information:",
    placeholder = "Type here...",
    submitText = "Submit",
    cancelText = "Cancel",
    minLength,
    maxLength,
    isTextarea = false,
    textareaRows = 4,
    initialValue = "",
}) {
    const [inputValue, setInputValue] = useState(initialValue);
    const [error, setError] = useState("");

    // Reset input when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setInputValue(initialValue);
            setError("");
        }
    }, [isOpen, initialValue]);

    const handleSubmit = () => {
        const trimmedValue = inputValue.trim();

        // Validation
        if (minLength && trimmedValue.length < minLength) {
            setError(`Please enter at least ${minLength} characters.`);
            return;
        }

        if (maxLength && trimmedValue.length > maxLength) {
            setError(`Maximum ${maxLength} characters allowed.`);
            return;
        }

        if (!trimmedValue) {
            setError("This field is required.");
            return;
        }

        setError("");
        onSubmit(trimmedValue);
        onClose();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !isTextarea && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-[16px] shadow-xl max-w-md w-full mx-4 transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <IoAlertCircleOutline className="text-2xl text-[#0A84FF]" />
                        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                        <IoCloseOutline className="text-2xl" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-700 text-base mb-4 leading-relaxed">{message}</p>
                    
                    {isTextarea ? (
                        <textarea
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                setError("");
                            }}
                            onKeyPress={handleKeyPress}
                            placeholder={placeholder}
                            rows={textareaRows}
                            maxLength={maxLength}
                            className="w-full px-4 py-3 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent resize-none text-gray-800 placeholder-gray-400"
                            autoFocus
                        />
                    ) : (
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                setError("");
                            }}
                            onKeyPress={handleKeyPress}
                            placeholder={placeholder}
                            maxLength={maxLength}
                            className="w-full px-4 py-3 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent text-gray-800 placeholder-gray-400"
                            autoFocus
                        />
                    )}

                    {error && (
                        <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                            <IoAlertCircleOutline className="text-base" />
                            {error}
                        </p>
                    )}

                    {minLength && (
                        <p className="mt-2 text-xs text-gray-500">
                            Minimum {minLength} characters required. ({inputValue.trim().length}/{minLength})
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-[10px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 px-4 py-3 rounded-[10px] font-semibold bg-[#0A84FF] hover:bg-[#005BBB] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!inputValue.trim()}
                    >
                        {submitText}
                    </button>
                </div>
            </div>
        </div>
    );
}

