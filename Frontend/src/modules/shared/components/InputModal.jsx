import { useState, useEffect } from "react";
import { IoAlertCircleOutline } from "react-icons/io5";

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
    label,
    placeholder = "Type here...",
    submitText = "Submit",
    cancelText = "Cancel",
    minLength,
    maxLength,
    isTextarea = false,
    textareaRows = 4,
    initialValue = "",
    value,
    onChange,
    type = "text",
    validation,
    isLoading = false,
    confirmColor = "primary",
}) {
    const [inputValue, setInputValue] = useState(value !== undefined ? value : initialValue);
    const [error, setError] = useState("");
    
    // Use controlled value if provided
    const currentValue = value !== undefined ? value : inputValue;
    const handleValueChange = onChange || ((e) => setInputValue(e.target.value));

    // Reset input and lock body scroll when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            if (value === undefined) {
                setInputValue(initialValue);
            }
            setError("");
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen, initialValue, value]);

    const handleSubmit = () => {
        const trimmedValue = currentValue.trim();

        // Custom validation function
        if (validation) {
            const validationError = validation(trimmedValue);
            if (validationError) {
                setError(validationError);
                return;
            }
        }

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
        if (!isLoading) {
            onClose();
        }
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-[20px] shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0A84FF]">
                            <IoAlertCircleOutline className="text-2xl" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    {message && <p className="text-gray-600 text-sm mb-4 leading-relaxed font-medium">{message}</p>}
                    {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
                    
                    {isTextarea || type === "textarea" ? (
                        <textarea
                            value={currentValue}
                            onChange={(e) => {
                                handleValueChange(e);
                                setError("");
                            }}
                            onKeyPress={handleKeyPress}
                            placeholder={placeholder}
                            rows={textareaRows}
                            maxLength={maxLength}
                            className="w-full px-4 py-3 border border-blue-500 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent resize-none text-gray-800 placeholder-gray-400 font-normal shadow-sm"
                            autoFocus
                        />
                    ) : (
                        <input
                            type={type}
                            value={currentValue}
                            onChange={(e) => {
                                handleValueChange(e);
                                setError("");
                            }}
                            onKeyPress={handleKeyPress}
                            placeholder={placeholder}
                            maxLength={maxLength}
                            className="w-full px-4 py-3 border border-blue-500 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent text-gray-800 placeholder-gray-400 font-normal shadow-sm"
                            autoFocus
                        />
                    )}

                    {error && (
                        <p className="mt-2 text-sm text-red-500 flex items-center gap-1 font-medium">
                            <IoAlertCircleOutline className="text-base" />
                            {error}
                        </p>
                    )}

                    {minLength && (
                        <p className="mt-2 text-xs text-gray-500">
                            Minimum {minLength} characters required. ({currentValue.trim().length}/{minLength})
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-[12px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all text-sm active:scale-[0.98]"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={`flex-1 px-4 py-3 rounded-[12px] font-bold text-white transition-all text-sm shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                            confirmColor === "danger" 
                                ? "bg-red-600 hover:bg-red-700 shadow-red-200" 
                                : confirmColor === "success"
                                ? "bg-green-600 hover:bg-green-700 shadow-green-200"
                                : "bg-[#0A84FF] hover:bg-[#0070DF] shadow-blue-200"
                        }`}
                        disabled={!currentValue.trim() || isLoading}
                    >
                        {isLoading ? "Processing..." : submitText}
                    </button>
                </div>
            </div>
        </div>
    );
}
