import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    IoImageOutline,
    IoCloseOutline,
    IoAlertCircleOutline,
    IoTicketOutline,
    IoDocumentTextOutline,
    IoCloudUploadOutline,
    IoTrashOutline,
    IoSendOutline,
    IoHelpCircleOutline
} from "react-icons/io5";
import { createDispute, getVendorBookings } from "../../../services/vendorApi";
import { getPublicSettings } from "../../../services/settingsApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import CustomDropdown from "../../shared/components/CustomDropdown";

const DEFAULT_DISPUTE_TYPES = [
    "Expert did not arrive",
    "Expert arrived late",
    "Survey not completed",
    "Incorrect survey location",
    "Payment issue",
    "Refund issue",
    "Travel charges issue",
    "Survey report issue",
    "Expert behaviour",
    "Requested offline payment",
    "Safety concern",
    "Other"
];

export default function VendorCreateDispute() {
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [disputeTypes, setDisputeTypes] = useState(DEFAULT_DISPUTE_TYPES);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [formData, setFormData] = useState({
        description: "",
        type: "",
        bookingId: location.state?.bookingId || "",
    });
    const [attachments, setAttachments] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadBookings();
        loadDisputeTypes();
    }, []);

    const loadDisputeTypes = async () => {
        try {
            const res = await getPublicSettings({ category: "general" });
            if (res.success && res.data?.settings) {
                const setting = res.data.settings.find(s => s.key === "DISPUTE_TYPES");
                if (setting && Array.isArray(setting.value) && setting.value.length > 0) {
                    setDisputeTypes(setting.value);
                }
            }
        } catch (err) {
            console.error("Failed to load dispute types setting:", err);
        }
    };

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
            const payload = {
                ...formData,
                subject: formData.type || "Dispute Issue"
            };
            const response = await createDispute(payload, attachments);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Dispute submitted successfully!");
                navigate("/vendor/disputes");
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to submit dispute");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to create dispute");
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + " B";
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
        else return (bytes / 1048576).toFixed(1) + " MB";
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
            {/* Header Banner */}
            <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-teal-950/20 relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold uppercase tracking-wider mb-3">
                            <IoHelpCircleOutline className="text-sm" /> Vendor Resolution Center
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Raise a Dispute</h1>
                        <p className="text-sm text-teal-200/80 mt-1 font-medium max-w-md">
                            Report an operational or booking issue. Admin will inspect and resolve it promptly.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Form Card */}
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-6">
                
                {/* Related Booking Selector */}
                <div className="space-y-2">
                    <CustomDropdown
                        name="bookingId"
                        label="Related Booking (Optional)"
                        value={formData.bookingId}
                        onChange={handleInputChange}
                        options={[
                            { value: "", label: "Select a booking reference (optional)" },
                            ...(loadingBookings
                                ? [{ value: "", label: "Loading bookings..." }]
                                : bookings.map(booking => ({
                                    value: booking._id,
                                    label: `#${booking._id.toString().slice(-8).toUpperCase()} — ${booking.service?.name || "Service"} (${new Date(booking.scheduledDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })})`
                                }))
                            )
                        ]}
                    />
                </div>

                {/* Dispute Category / Type */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <IoAlertCircleOutline className="text-teal-600 text-base" />
                        <span>Dispute Category</span>
                        <span className="text-red-500 font-bold">*</span>
                    </label>
                    <CustomDropdown
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className={errors.type ? "border-red-400 focus:border-red-500 focus:ring-red-50" : ""}
                        options={[
                            { value: "", label: "Select issue category" },
                            ...disputeTypes.map(t => ({ value: t, label: t }))
                        ]}
                    />
                    {errors.type && <p className="text-red-500 text-xs font-medium mt-1 flex items-center gap-1"><IoAlertCircleOutline /> {errors.type}</p>}
                </div>

                {/* Detailed Description */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <IoDocumentTextOutline className="text-teal-600 text-base" />
                            <span>Detailed Explanation</span>
                            <span className="text-red-500 font-bold">*</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">min. 10 characters</span>
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={5}
                        placeholder="Please describe what went wrong in detail so our team can review and assist you..."
                        className={`w-full p-4 bg-slate-50/70 border rounded-2xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-4 outline-none transition-all resize-y ${
                            errors.description
                                ? "border-red-400 focus:border-red-500 focus:ring-red-50"
                                : "border-slate-200 focus:border-teal-600 focus:ring-teal-50"
                        }`}
                    />
                    {errors.description && <p className="text-red-500 text-xs font-medium mt-1 flex items-center gap-1"><IoAlertCircleOutline /> {errors.description}</p>}
                </div>

                {/* Attachments Section */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <IoCloudUploadOutline className="text-teal-600 text-base" />
                            <span>Supporting Evidence</span>
                            <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Max 10MB per file</span>
                    </label>
                    
                    <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                        id="vendor-attachments"
                    />
                    <label
                        htmlFor="vendor-attachments"
                        className="group flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-2xl bg-slate-50/50 hover:bg-teal-50/30 transition-all cursor-pointer text-center"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-teal-100/80 group-hover:bg-teal-600 group-hover:text-white text-teal-700 flex items-center justify-center mb-3 transition-colors shadow-sm">
                            <IoCloudUploadOutline className="text-2xl" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                            Click to upload photos or documents
                        </p>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                            PNG, JPG, PDF, DOC up to 10MB
                        </p>
                    </label>

                    {/* Attached File List */}
                    {attachments.length > 0 && (
                        <div className="space-y-2 pt-1">
                            {attachments.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-3 rounded-2xl transition-all"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="p-2 bg-teal-100 text-teal-700 rounded-xl shrink-0">
                                            <IoImageOutline className="text-lg" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{formatFileSize(file.size)}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(index)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0 ml-2"
                                        title="Remove file"
                                    >
                                        <IoTrashOutline className="text-lg" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Form Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => navigate("/vendor/disputes")}
                        className="flex-1 py-3.5 px-5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-sm font-bold shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Submitting...</span>
                            </>
                        ) : (
                            <>
                                <IoSendOutline className="text-base" />
                                <span>Submit Dispute</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
