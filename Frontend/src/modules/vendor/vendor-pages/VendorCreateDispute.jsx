import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    IoChevronBackOutline,
    IoImageOutline,
    IoCloseOutline,
} from "react-icons/io5";
import { createDispute } from "../../../services/vendorApi";
import { getVendorBookings } from "../../../services/vendorApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";

export default function VendorCreateDispute() {
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [formData, setFormData] = useState({
        subject: "",
        description: "",
        type: "",
        priority: "MEDIUM",
        bookingId: location.state?.bookingId || "",
    });
    const [attachments, setAttachments] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            setLoadingBookings(true);
            const response = await getVendorBookings();
            if (response.success) {
                setBookings(response.data.bookings || []);
            }
        } catch (err) {
            console.error("Failed to load bookings:", err);
        } finally {
            setLoadingBookings(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter((file) => {
            const isValid = file.size <= 10 * 1024 * 1024; // 10MB
            if (!isValid) {
                toast.showError(`${file.name} is too large. Maximum size is 10MB.`);
            }
            return isValid;
        });

        setAttachments((prev) => [...prev, ...validFiles]);
    };

    const removeAttachment = (index) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.subject.trim()) {
            newErrors.subject = "Subject is required";
        } else if (formData.subject.trim().length < 5) {
            newErrors.subject = "Subject must be at least 5 characters";
        }
        if (!formData.description.trim()) {
            newErrors.description = "Description is required";
        } else if (formData.description.trim().length < 10) {
            newErrors.description = "Description must be at least 10 characters";
        }
        if (!formData.type) {
            newErrors.type = "Please select a dispute type";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        const loadingToast = toast.showLoading("Creating dispute...");
        try {
            const response = await createDispute(formData, attachments);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Dispute created successfully!");
                navigate("/vendor/disputes");
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to create dispute");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to create dispute");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate("/vendor/disputes")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <IoChevronBackOutline className="text-2xl text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Raise a Dispute</h1>
                    <p className="text-sm text-gray-500 mt-1">Report an issue or complaint</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                {/* Related Booking */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Related Booking (Optional)
                    </label>
                    <select
                        name="bookingId"
                        value={formData.bookingId}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                    >
                        <option value="">Select a booking (optional)</option>
                        {loadingBookings ? (
                            <option>Loading bookings...</option>
                        ) : (
                            bookings.map((booking) => (
                                <option key={booking._id} value={booking._id}>
                                    Booking #{booking._id.toString().slice(-8).toUpperCase()} - {booking.service?.name || "Service"} - {new Date(booking.scheduledDate).toLocaleDateString()}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                {/* Dispute Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dispute Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent ${
                            errors.type ? "border-red-500" : "border-gray-300"
                        }`}
                    >
                        <option value="">Select dispute type</option>
                        <option value="PAYMENT_ISSUE">Payment Issue</option>
                        <option value="SERVICE_QUALITY">Service Quality</option>
                        <option value="VENDOR_BEHAVIOR">Vendor Behavior</option>
                        <option value="REPORT_ISSUE">Report Issue</option>
                        <option value="CANCELLATION">Cancellation</option>
                        <option value="REFUND">Refund</option>
                        <option value="OTHER">Other</option>
                    </select>
                    {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
                </div>

                {/* Priority */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                    </label>
                    <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                    >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                    </select>
                </div>

                {/* Subject */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Brief description of the issue"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent ${
                            errors.subject ? "border-red-500" : "border-gray-300"
                        }`}
                    />
                    {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={6}
                        placeholder="Provide detailed information about the issue..."
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent ${
                            errors.description ? "border-red-500" : "border-gray-300"
                        }`}
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>

                {/* Attachments */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attachments (Optional)
                    </label>
                    <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                        id="attachments"
                    />
                    <label
                        htmlFor="attachments"
                        className="block w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#0A84FF] transition-colors"
                    >
                        <div className="text-center">
                            <IoImageOutline className="text-3xl text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Click to upload files</p>
                            <p className="text-xs text-gray-500 mt-1">Max 10MB per file (Images, PDF, DOC)</p>
                        </div>
                    </label>
                    {attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {attachments.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                                >
                                    <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(index)}
                                        className="ml-2 text-red-500 hover:text-red-700"
                                    >
                                        <IoCloseOutline className="text-xl" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate("/vendor/disputes")}
                        className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-[#0A84FF] text-white rounded-lg font-semibold hover:bg-[#005BBB] transition-colors disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Submit Dispute"}
                    </button>
                </div>
            </form>
        </div>
    );
}

