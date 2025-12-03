import { useState, useEffect } from "react";
import { IoCloseOutline, IoAlertCircleOutline, IoCashOutline } from "react-icons/io5";

/**
 * Transaction Info Modal Component
 * Used for admin to enter transaction details when processing withdrawal payments
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Function to close the modal
 * @param {function} onSubmit - Function to execute with transaction data when user submits
 * @param {string} title - Modal title (default: "Enter Transaction Information")
 * @param {string} amount - Withdrawal amount to display
 * @param {string} recipientName - Name of the recipient (vendor/user)
 * @param {boolean} isLoading - Loading state for submit button
 */
export default function TransactionInfoModal({
    isOpen,
    onClose,
    onSubmit,
    title = "Enter Transaction Information",
    amount,
    recipientName,
    isLoading = false,
}) {
    const [formData, setFormData] = useState({
        transactionId: "",
        paymentMethod: "",
        paymentDate: new Date().toISOString().split('T')[0], // Today's date as default
        notes: "",
    });
    const [errors, setErrors] = useState({});

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                transactionId: "",
                paymentMethod: "",
                paymentDate: new Date().toISOString().split('T')[0],
                notes: "",
            });
            setErrors({});
        }
    }, [isOpen]);

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ""
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.transactionId.trim()) {
            newErrors.transactionId = "Transaction ID is required";
        }

        if (!formData.paymentMethod) {
            newErrors.paymentMethod = "Payment method is required";
        }

        if (!formData.paymentDate) {
            newErrors.paymentDate = "Payment date is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            return;
        }

        onSubmit({
            transactionId: formData.transactionId.trim(),
            paymentMethod: formData.paymentMethod,
            paymentDate: formData.paymentDate,
            notes: formData.notes.trim(),
        });
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const paymentMethods = [
        { value: "UPI", label: "UPI" },
        { value: "BANK_TRANSFER", label: "Bank Transfer" },
        { value: "NEFT", label: "NEFT" },
        { value: "IMPS", label: "IMPS" },
        { value: "RTGS", label: "RTGS" },
        { value: "RAZORPAY", label: "Razorpay" },
        { value: "CASH", label: "Cash" },
        { value: "OTHER", label: "Other" },
    ];

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-[16px] shadow-xl max-w-lg w-full mx-4 transform transition-all max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <IoCashOutline className="text-2xl text-[#0A84FF]" />
                        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        disabled={isLoading}
                    >
                        <IoCloseOutline className="text-2xl" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Amount and Recipient Info */}
                    {amount && (
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-sm text-gray-600 mb-1">Payment Amount</p>
                            <p className="text-2xl font-bold text-blue-700">
                                ₹{new Intl.NumberFormat("en-IN").format(amount)}
                            </p>
                            {recipientName && (
                                <p className="text-sm text-gray-600 mt-2">
                                    Recipient: <span className="font-semibold">{recipientName}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {/* Transaction ID */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Transaction ID <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.transactionId}
                            onChange={(e) => handleChange("transactionId", e.target.value)}
                            placeholder="Enter transaction ID or reference number"
                            className="w-full px-4 py-3 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent text-gray-800 placeholder-gray-400"
                            disabled={isLoading}
                        />
                        {errors.transactionId && (
                            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                <IoAlertCircleOutline className="text-base" />
                                {errors.transactionId}
                            </p>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Method <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.paymentMethod}
                            onChange={(e) => handleChange("paymentMethod", e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent text-gray-800 bg-white"
                            disabled={isLoading}
                        >
                            <option value="">Select payment method</option>
                            {paymentMethods.map((method) => (
                                <option key={method.value} value={method.value}>
                                    {method.label}
                                </option>
                            ))}
                        </select>
                        {errors.paymentMethod && (
                            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                <IoAlertCircleOutline className="text-base" />
                                {errors.paymentMethod}
                            </p>
                        )}
                    </div>

                    {/* Payment Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.paymentDate}
                            onChange={(e) => handleChange("paymentDate", e.target.value)}
                            max={new Date().toISOString().split('T')[0]} // Cannot select future dates
                            className="w-full px-4 py-3 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent text-gray-800"
                            disabled={isLoading}
                        />
                        {errors.paymentDate && (
                            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                <IoAlertCircleOutline className="text-base" />
                                {errors.paymentDate}
                            </p>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleChange("notes", e.target.value)}
                            placeholder="Add any additional notes or remarks..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent resize-none text-gray-800 placeholder-gray-400"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-[10px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 px-4 py-3 rounded-[10px] font-semibold text-white bg-[#0A84FF] hover:bg-[#005BBB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading || !formData.transactionId.trim() || !formData.paymentMethod || !formData.paymentDate}
                    >
                        {isLoading ? "Processing..." : "Process Payment"}
                    </button>
                </div>
            </div>
        </div>
    );
}

