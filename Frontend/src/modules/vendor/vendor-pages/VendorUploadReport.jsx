import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    IoChevronBackOutline,
    IoDocumentTextOutline,
    IoImageOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoWaterOutline,
} from "react-icons/io5";
import { getBookingDetails, uploadVisitReport } from "../../../services/vendorApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import { useToast } from "../../../hooks/useToast";

export default function VendorUploadReport() {
    const navigate = useNavigate();
    const { bookingId } = useParams();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [booking, setBooking] = useState(null);

    const [formData, setFormData] = useState({
        waterFound: "",
        machineReadings: {
            depth: "",
            flowRate: "",
            quality: "",
            notes: "",
        },
        notes: "",
        images: [],
        reportFile: null,
    });

    useEffect(() => {
        loadBookingDetails();
    }, [bookingId]);

    const loadBookingDetails = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getBookingDetails(bookingId);
            
            if (response.success) {
                const bookingData = response.data.booking;
                setBooking(bookingData);
                
                // Check if booking is in VISITED status
                if (bookingData.status !== "VISITED") {
                    setError("Please mark the booking as visited first before uploading the report.");
                }
            } else {
                setError(response.message || "Failed to load booking details");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load booking details");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name.startsWith("machineReadings.")) {
            const field = name.split(".")[1];
            setFormData((prev) => ({
                ...prev,
                machineReadings: {
                    ...prev.machineReadings,
                    [field]: value,
                },
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setFormData((prev) => ({
            ...prev,
            images: [...prev.images, ...files],
        }));
    };

    const handleRemoveImage = (index) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const handleReportFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "application/pdf") {
            setFormData((prev) => ({ ...prev, reportFile: file }));
        } else {
            setError("Please upload a PDF file for the report.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!formData.waterFound) {
            setError("Please select whether water was found or not.");
            return;
        }

        if (formData.images.length === 0 && !formData.reportFile) {
            setError("Please upload at least one image or a report file.");
            return;
        }

        try {
            setSubmitting(true);

            // Create FormData
            const reportFormData = new FormData();
            reportFormData.append("waterFound", formData.waterFound);
            reportFormData.append("machineReadings", JSON.stringify(formData.machineReadings));
            reportFormData.append("notes", formData.notes || "");

            // Append images
            formData.images.forEach((image, index) => {
                reportFormData.append("images", image);
            });

            // Append report file if exists
            if (formData.reportFile) {
                reportFormData.append("reportFile", formData.reportFile);
            }

            const response = await uploadVisitReport(bookingId, reportFormData);

            if (response.success) {
                toast.showSuccess("Report uploaded successfully! User will be notified to pay the remaining amount.");
                setTimeout(() => {
                    navigate(`/vendor/bookings/${bookingId}`);
                }, 2000);
            } else {
                setError(response.message || "Failed to upload report");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to upload report. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading booking details..." />;
    }

    if (error && !booking) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
                <ErrorMessage message={error} />
                <button
                    onClick={() => navigate(`/vendor/bookings/${bookingId}`)}
                    className="mt-4 flex items-center gap-2 text-[#0A84FF] hover:text-[#005BBB] transition-colors"
                >
                    <IoChevronBackOutline className="text-xl" />
                    <span className="font-semibold">Back to Booking Details</span>
                </button>
            </div>
        );
    }

    if (!booking || booking.status !== "VISITED") {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <ErrorMessage message="Please mark the booking as visited first before uploading the report." />
                    <button
                        onClick={() => navigate(`/vendor/bookings/${bookingId}`)}
                        className="mt-4 flex items-center gap-2 text-[#0A84FF] hover:text-[#005BBB] transition-colors"
                    >
                        <IoChevronBackOutline className="text-xl" />
                        <span className="font-semibold">Back to Booking Details</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <ErrorMessage message={error} />

            {/* Back Button */}
            <button
                onClick={() => navigate(`/vendor/bookings/${bookingId}`)}
                className="mb-4 flex items-center gap-2 text-gray-600 hover:text-[#0A84FF] transition-colors"
            >
                <IoChevronBackOutline className="text-xl" />
                <span className="text-sm font-medium">Back to Booking Details</span>
            </button>

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    Upload Visit Report
                </h1>
                <p className="text-[#4A4A4A] text-sm">
                    Booking ID: {booking._id || booking.id}
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                {/* Water Found */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                        <IoWaterOutline className="inline text-xl mr-2" />
                        Water Found?
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="waterFound"
                                value="true"
                                checked={formData.waterFound === "true"}
                                onChange={handleInputChange}
                                className="w-5 h-5 text-[#0A84FF]"
                            />
                            <span className="text-base font-medium text-green-600">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="waterFound"
                                value="false"
                                checked={formData.waterFound === "false"}
                                onChange={handleInputChange}
                                className="w-5 h-5 text-[#0A84FF]"
                            />
                            <span className="text-base font-medium text-red-600">No</span>
                        </label>
                    </div>
                </div>

                {/* Machine Readings */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                        <IoDocumentTextOutline className="inline text-xl mr-2" />
                        Machine Readings
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Depth (meters)</label>
                            <input
                                type="number"
                                name="machineReadings.depth"
                                value={formData.machineReadings.depth}
                                onChange={handleInputChange}
                                placeholder="e.g., 150"
                                step="0.01"
                                className="w-full px-4 py-2 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Flow Rate (L/min)</label>
                            <input
                                type="number"
                                name="machineReadings.flowRate"
                                value={formData.machineReadings.flowRate}
                                onChange={handleInputChange}
                                placeholder="e.g., 500"
                                step="0.01"
                                className="w-full px-4 py-2 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-600 mb-1">Water Quality</label>
                            <input
                                type="text"
                                name="machineReadings.quality"
                                value={formData.machineReadings.quality}
                                onChange={handleInputChange}
                                placeholder="e.g., Good, Potable, etc."
                                className="w-full px-4 py-2 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-600 mb-1">Additional Notes</label>
                            <textarea
                                name="machineReadings.notes"
                                value={formData.machineReadings.notes}
                                onChange={handleInputChange}
                                placeholder="Additional machine reading notes..."
                                rows="3"
                                className="w-full px-4 py-2 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                            />
                        </div>
                    </div>
                </div>

                {/* Images Upload */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                        <IoImageOutline className="inline text-xl mr-2" />
                        Report Images (Optional)
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                    />
                    {formData.images.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                            {formData.images.map((image, index) => (
                                <div key={index} className="relative">
                                    <img
                                        src={URL.createObjectURL(image)}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-24 object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                        <IoCloseCircleOutline className="text-sm" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Report File Upload */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                        <IoDocumentTextOutline className="inline text-xl mr-2" />
                        Report PDF (Optional)
                    </label>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleReportFileChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                    />
                    {formData.reportFile && (
                        <p className="mt-2 text-sm text-gray-600">
                            Selected: {formData.reportFile.name}
                        </p>
                    )}
                </div>

                {/* Additional Notes */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Additional Notes
                    </label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Any additional notes about the visit or report..."
                        rows="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                    />
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(`/vendor/bookings/${bookingId}`)}
                        className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-[12px] hover:bg-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 bg-[#0A84FF] text-white font-semibold py-3 px-6 rounded-[12px] hover:bg-[#005BBB] active:bg-[#004A9A] transition-colors flex items-center justify-center gap-2 shadow-[0px_4px_10px_rgba(10,132,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Uploading...
                            </span>
                        ) : (
                            <>
                                <IoCheckmarkCircleOutline className="text-xl" />
                                <span>Upload Report</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

