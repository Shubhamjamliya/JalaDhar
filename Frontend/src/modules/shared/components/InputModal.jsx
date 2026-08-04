import { useState, useEffect } from "react";
import { IoAlertCircleOutline, IoCloseOutline } from "react-icons/io5";
import CustomDropdown from "./CustomDropdown";

export const CANCELLATION_REASONS = [
    "Change of plans",
    "Booked by mistake",
    "Survey no longer required",
    "Borewell drilling postponed",
    "Incorrect survey location selected",
    "Unable to be available on the scheduled date",
    "Want to reschedule the survey",
    "Expert unavailable or delayed",
    "Charges are higher than expected",
    "Found an alternative service",
    "Personal or family emergency",
    "Weather or site conditions not suitable",
    "Duplicate booking",
    "Other (Please specify)"
];

/**
 * Reusable Input / Dropdown Modal Component
 * Supports single-line input, multi-line textarea, or CustomDropdown option selection with blurred backdrop.
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
    options, // Optional array of strings or { value, label } objects for dropdown selection
    validation,
    isLoading = false,
    confirmColor = "primary",
}) {
    const [inputValue, setInputValue] = useState(value !== undefined ? value : initialValue);
    const [selectedDropdownValue, setSelectedDropdownValue] = useState("");
    const [otherReasonText, setOtherReasonText] = useState("");
    const [error, setError] = useState("");
    
    // Controlled vs uncontrolled input handling
    const currentValue = value !== undefined ? value : inputValue;
    const handleValueChange = onChange || ((e) => setInputValue(e.target.value));

    // Formatted dropdown options
    const formattedOptions = options ? options.map(opt => {
        if (typeof opt === 'string') {
            return { value: opt, label: opt };
        }
        return opt;
    }) : null;

    // Lock body and html scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            const originalBodyOverflow = document.body.style.overflow;
            const originalHtmlOverflow = document.documentElement.style.overflow;
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";
            if (value === undefined) {
                setInputValue(initialValue);
            }
            setSelectedDropdownValue("");
            setOtherReasonText("");
            setError("");

            return () => {
                document.body.style.overflow = originalBodyOverflow;
                document.documentElement.style.overflow = originalHtmlOverflow;
            };
        }
    }, [isOpen, initialValue, value]);

    const isOtherSelected = selectedDropdownValue.includes("Other");

    const handleSubmit = () => {
        // If options dropdown mode is enabled
        if (options && options.length > 0) {
            if (!selectedDropdownValue) {
                setError("Please select a reason from the list.");
                return;
            }
            if (isOtherSelected && !otherReasonText.trim()) {
                setError("Please specify your reason for cancellation.");
                return;
            }
            const finalReason = isOtherSelected 
                ? `Other: ${otherReasonText.trim()}`
                : selectedDropdownValue;
            
            setError("");
            onSubmit(finalReason);
            return;
        }

        // Standard text/textarea mode
        const trimmedValue = currentValue.trim();

        if (validation) {
            const validationError = validation(trimmedValue);
            if (validationError) {
                setError(validationError);
                return;
            }
        }

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
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !isTextarea && !e.shiftKey && !options) {
            e.preventDefault();
            handleSubmit();
        }
    };

    if (!isOpen) return null;

    const isSubmitDisabled = options && options.length > 0
        ? (!selectedDropdownValue || (isOtherSelected && !otherReasonText.trim()) || isLoading)
        : (!currentValue.trim() || isLoading);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200 touch-none"
            onClick={handleBackdropClick}
            onTouchMove={(e) => {
                if (e.target === e.currentTarget) {
                    e.preventDefault();
                }
            }}
        >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 relative transform transition-all duration-300 ease-out animate-in zoom-in-95 border border-slate-100 max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-100/80 flex items-center justify-center text-[#0A84FF] shadow-2xs">
                            <IoAlertCircleOutline className="text-2xl" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        <IoCloseOutline className="text-xl" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                    {message && <p className="text-slate-600 text-xs font-semibold leading-relaxed">{message}</p>}
                    {label && <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</label>}
                    
                    {/* Dropdown Options Mode */}
                    {formattedOptions && formattedOptions.length > 0 ? (
                        <div className="space-y-3">
                            <CustomDropdown
                                options={formattedOptions}
                                value={selectedDropdownValue}
                                onChange={(val) => {
                                    setSelectedDropdownValue(val);
                                    setError("");
                                }}
                                placeholder="Select reason for cancellation..."
                                activeColor="blue"
                                size="md"
                                isInline={true}
                            />

                            {/* Additional Textarea for "Other" specification */}
                            {isOtherSelected && (
                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150 pt-1">
                                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                        Please Specify Details <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={otherReasonText}
                                        onChange={(e) => {
                                            setOtherReasonText(e.target.value);
                                            setError("");
                                        }}
                                        rows={3}
                                        placeholder="Describe your reason in detail..."
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-50 outline-none transition-all resize-y"
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>
                    ) : isTextarea || type === "textarea" ? (
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
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-[#0A84FF] outline-none transition-all resize-none text-xs text-slate-800 placeholder:text-slate-400 font-medium"
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
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-[#0A84FF] outline-none transition-all text-xs text-slate-800 placeholder:text-slate-400 font-medium"
                            autoFocus
                        />
                    )}

                    {error && (
                        <p className="text-xs text-red-500 flex items-center gap-1 font-bold">
                            <IoAlertCircleOutline className="text-sm shrink-0" />
                            <span>{error}</span>
                        </p>
                    )}

                    {!formattedOptions && minLength && (
                        <p className="text-[11px] text-slate-400 font-medium">
                            Minimum {minLength} characters required. ({currentValue.trim().length}/{minLength})
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-2xl font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-colors text-xs cursor-pointer"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        className={`flex-1 py-3 px-4 rounded-2xl font-bold text-white transition-all text-xs shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                            confirmColor === "danger" 
                                ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" 
                                : confirmColor === "success"
                                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                                : "bg-gradient-to-r from-[#0A84FF] to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/20"
                        }`}
                    >
                        {isLoading ? "Processing..." : submitText}
                    </button>
                </div>
            </div>
        </div>
    );
}
