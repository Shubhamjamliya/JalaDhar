import { useEffect } from "react";
import { IoWarningOutline } from "react-icons/io5";

/**
 * Reusable Confirmation Modal Component
 * Replaces browser confirm() dialogs with a styled modal
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Function to close the modal
 * @param {function} onConfirm - Function to execute when user confirms
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @param {string} confirmText - Text for confirm button (default: "Confirm")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {string} confirmColor - Color variant for confirm button (default: "danger" for red, or "primary" for blue)
 * @param {boolean} isLoading - Shows loading state on confirm button
 */
export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmColor = "danger", // "danger" (red) or "primary" (blue)
    isLoading = false,
}) {
    // Body scroll locking
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const confirmButtonClass = confirmColor === "danger"
        ? "bg-red-600 hover:bg-red-700 text-white shadow-red-200"
        : "bg-[#0A84FF] hover:bg-[#0070DF] text-white shadow-blue-200";

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-[20px] shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                            <IoWarningOutline className="text-2xl" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-700 text-base leading-relaxed font-medium">{message}</p>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 rounded-[12px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all text-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-3 rounded-[12px] font-bold transition-all text-sm shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonClass}`}
                    >
                        {isLoading ? "Processing..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
