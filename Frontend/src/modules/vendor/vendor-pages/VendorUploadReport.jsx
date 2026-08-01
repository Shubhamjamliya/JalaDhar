import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    IoChevronBackOutline,
    IoDocumentTextOutline,
    IoImageOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoWaterOutline,
    IoConstructOutline,
    IoPersonOutline,
    IoMapOutline,
    IoCloudUploadOutline,
    IoSparklesOutline,
    IoAddOutline
} from "react-icons/io5";
import { getBookingDetails, uploadVisitReport } from "../../../services/vendorApi";
import { formatAcresGuntasDisplay } from "../../../utils/landAreaHelper";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import { useToast } from "../../../hooks/useToast";

const ROCK_SUGGESTIONS = [
    "Granite",
    "Basalt",
    "Peninsular Gneiss",
    "Sandstone",
    "Limestone",
    "Schist",
    "Quartzite",
    "Laterite",
    "Alluvium"
];

const SOIL_SUGGESTIONS = [
    "Red Sandy Soil",
    "Black Cotton Soil",
    "Red Clay Soil",
    "Alluvial Soil",
    "Lateritic Soil",
    "Gravelly Loam"
];

const BOREWELL_TEMPLATES = [
    "Active nearby borewell at 280-320 ft with ~1.5 inch yield.",
    "Nearby borewells failed dry at 400 ft due to hard non-fractured rock.",
    "High yield seasonal borewell located 100m East (300 ft depth).",
    "No existing borewells found within 500m radius."
];

export default function VendorUploadReport() {
    const navigate = useNavigate();
    const { bookingId } = useParams();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [booking, setBooking] = useState(null);

    const [formData, setFormData] = useState({
        // Radio for water found
        waterFound: "",

        // Customer Details
        customerName: "",
        village: "",
        mandal: "",
        district: "",
        state: "",

        // Land Details
        landLocation: "",
        surveyNumber: "",
        extent: "",
        commandArea: "", // 'Command' or 'Non-command'

        // Geological Details
        rockType: "",
        soilType: "",
        existingBorewellDetails: "",

        // Survey Results
        pointsLocated: "",
        recommendedPointNumber: "",
        recommendedDepth: "",
        recommendedCasingDepth: "",
        expectedFractureDepths: "",
        expectedYield: "",

        // Machine Readings (Legacy/Technical)
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

    // Automatically pre-fill all Customer, Village, Mandal, District, State, Survey No, Land Location, and Extent details filled during booking
    useEffect(() => {
        if (booking) {
            setFormData(prev => ({
                ...prev,
                customerName: booking.user?.name || booking.customerName || prev.customerName,
                village: booking.village || booking.address?.village || booking.address?.city || prev.village,
                mandal: booking.mandal || booking.address?.mandal || booking.district || prev.mandal,
                district: booking.district || booking.address?.district || prev.district,
                state: booking.state || booking.address?.state || prev.state,
                landLocation: booking.address?.landmark || booking.address?.street || booking.landmark || prev.landLocation,
                surveyNumber: booking.surveyNumber || booking.surveyNo || booking.address?.surveyNumber || prev.surveyNumber,
                extent: booking.purposeExtent ? formatAcresGuntasDisplay(booking.purposeExtent) : (booking.extent || prev.extent),
            }));
        }
    }, [booking]);

    const loadBookingDetails = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getBookingDetails(bookingId);

            if (response.success) {
                const bookingData = response.data.booking;
                setBooking(bookingData);

                // Check if booking is in VISITED status
                if (bookingData.status !== "VISITED" && bookingData.status !== "REPORT_UPLOADED") {
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

    // 🪨 Geological Suggestions Handlers
    const handleAddChipSuggestion = (field, suggestion) => {
        setFormData(prev => {
            const current = prev[field] ? prev[field].trim() : "";
            if (!current) {
                return { ...prev, [field]: suggestion };
            }
            if (current.includes(suggestion)) {
                return prev;
            }
            return { ...prev, [field]: `${current}, ${suggestion}` };
        });
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
            toast.showError("Please upload a PDF file for the report.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!formData.waterFound) {
            toast.showError("Please select whether water was found or not.");
            return;
        }

        if (formData.images.length === 0 && !formData.reportFile) {
            toast.showError("Please upload at least one image or a report file.");
            return;
        }

        try {
            setSubmitting(true);

            const reportFormData = new FormData();

            Object.keys(formData).forEach(key => {
                if (key !== 'machineReadings' && key !== 'images' && key !== 'reportFile') {
                    reportFormData.append(key, formData[key]);
                }
            });

            reportFormData.append("machineReadings", JSON.stringify(formData.machineReadings));

            formData.images.forEach((image) => {
                reportFormData.append("images", image);
            });

            if (formData.reportFile) {
                reportFormData.append("reportFile", formData.reportFile);
            }

            const response = await uploadVisitReport(bookingId, reportFormData);

            if (response.success) {
                toast.showSuccess("Report uploaded successfully! User will be notified.");
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
                    className="mt-4 flex items-center gap-2 text-[#0A84FF] hover:text-[#005BBB] transition-colors font-semibold"
                >
                    <IoChevronBackOutline className="text-xl" />
                    <span>Back to Booking Details</span>
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <ErrorMessage message={error} />

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    Submit Survey Report
                </h1>
                <p className="text-[#4A4A4A] text-sm">
                    Booking ID: <span className="font-mono bg-white px-2 py-1 rounded border border-gray-200">{booking._id?.slice(-8).toUpperCase() || booking.id}</span>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* 1. Main Result */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <label className="block text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <IoWaterOutline className="text-[#0A84FF]" />
                        Survey Outcome
                    </label>
                    <div className="flex gap-4">
                        <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-[12px] border-2 cursor-pointer transition-all ${formData.waterFound === "true" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 hover:border-green-200"}`}>
                            <input
                                type="radio"
                                name="waterFound"
                                value="true"
                                checked={formData.waterFound === "true"}
                                onChange={handleInputChange}
                                className="w-5 h-5 text-green-600 focus:ring-green-500"
                            />
                            <span className="font-bold">Water Found</span>
                        </label>
                        <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-[12px] border-2 cursor-pointer transition-all ${formData.waterFound === "false" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 hover:border-red-200"}`}>
                            <input
                                type="radio"
                                name="waterFound"
                                value="false"
                                checked={formData.waterFound === "false"}
                                onChange={handleInputChange}
                                className="w-5 h-5 text-red-600 focus:ring-red-500"
                            />
                            <span className="font-bold">No Water</span>
                        </label>
                    </div>
                </div>

                {/* 2. Customer & Location Details (Auto-filled from Customer Booking) */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <IoPersonOutline className="text-[#0A84FF]" />
                        Customer & Location Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup label="Customer Name" name="customerName" value={formData.customerName} onChange={handleInputChange} placeholder="Enter customer name" />
                        <InputGroup label="Village" name="village" value={formData.village} onChange={handleInputChange} placeholder="Village name" />
                        <InputGroup label="Mandal" name="mandal" value={formData.mandal} onChange={handleInputChange} placeholder="Mandal" />
                        <InputGroup label="District" name="district" value={formData.district} onChange={handleInputChange} placeholder="District" />
                        <InputGroup label="State" name="state" value={formData.state} onChange={handleInputChange} placeholder="State" />
                        <InputGroup label="Land Location 📍" name="landLocation" value={formData.landLocation} onChange={handleInputChange} placeholder="Landmark or location" />
                        <InputGroup label="Survey No" name="surveyNumber" value={formData.surveyNumber} onChange={handleInputChange} placeholder="Survey number" />
                        <InputGroup label="Extent (Acres / Guntas)" name="extent" value={formData.extent} onChange={handleInputChange} placeholder="e.g. 3 Acres 6 Guntas" />

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Area Type</label>
                            <div className="flex gap-4">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input type="radio" name="commandArea" value="Command" checked={formData.commandArea === "Command"} onChange={handleInputChange} className="form-radio text-[#0A84FF]" />
                                    <span className="ml-2 text-gray-700 font-medium">Command Area</span>
                                </label>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input type="radio" name="commandArea" value="Non-command" checked={formData.commandArea === "Non-command"} onChange={handleInputChange} className="form-radio text-[#0A84FF]" />
                                    <span className="ml-2 text-gray-700 font-medium">Non-command Area</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Geological Information with Smart Suggestions */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center justify-between pb-2 border-b border-gray-100">
                        <span className="flex items-center gap-2">
                            <IoMapOutline className="text-[#0A84FF]" />
                            Geological Information
                        </span>
                        <span className="text-xs font-semibold text-[#0A84FF] bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <IoSparklesOutline /> Click chips for quick suggestions
                        </span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Rock Type with Chips */}
                        <div>
                            <InputGroup label="Rock Type" name="rockType" value={formData.rockType} onChange={handleInputChange} placeholder="e.g. Granite, Basalt" />
                            <div className="mt-2.5">
                                <p className="text-[11px] font-bold text-gray-500 mb-1.5 flex items-center gap-1">
                                    <span>Common Rock Suggestions:</span>
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {ROCK_SUGGESTIONS.map((rock) => (
                                        <button
                                            key={rock}
                                            type="button"
                                            onClick={() => handleAddChipSuggestion("rockType", rock)}
                                            className="text-xs bg-gray-100 hover:bg-blue-50 hover:text-[#0A84FF] hover:border-blue-200 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 font-medium"
                                        >
                                            <IoAddOutline className="text-xs" />
                                            {rock}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Soil Type with Chips */}
                        <div>
                            <InputGroup label="Soil Type" name="soilType" value={formData.soilType} onChange={handleInputChange} placeholder="e.g. Red soil, Black cotton" />
                            <div className="mt-2.5">
                                <p className="text-[11px] font-bold text-gray-500 mb-1.5 flex items-center gap-1">
                                    <span>Common Soil Suggestions:</span>
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {SOIL_SUGGESTIONS.map((soil) => (
                                        <button
                                            key={soil}
                                            type="button"
                                            onClick={() => handleAddChipSuggestion("soilType", soil)}
                                            className="text-xs bg-gray-100 hover:bg-blue-50 hover:text-[#0A84FF] hover:border-blue-200 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 font-medium"
                                        >
                                            <IoAddOutline className="text-xs" />
                                            {soil}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Existing Borewell Details with Quick Templates */}
                        <div className="md:col-span-2 mt-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Existing Borewell Details</label>
                            <textarea
                                name="existingBorewellDetails"
                                value={formData.existingBorewellDetails}
                                onChange={handleInputChange}
                                placeholder="Details of any nearby borewells..."
                                rows="3"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] text-gray-800"
                            />
                            <div className="mt-2">
                                <p className="text-[11px] font-bold text-gray-500 mb-1.5">Quick Observation Templates:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {BOREWELL_TEMPLATES.map((tmpl, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleAddChipSuggestion("existingBorewellDetails", tmpl)}
                                            className="text-left text-xs bg-gray-50 hover:bg-blue-50 hover:text-[#0A84FF] hover:border-blue-200 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl transition-all font-medium flex items-start gap-1.5"
                                        >
                                            <span className="text-[#0A84FF] font-bold">+</span>
                                            <span className="line-clamp-2">{tmpl}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Survey Recommendations */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <IoConstructOutline className="text-[#0A84FF]" />
                        Survey Recommendations
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup type="number" label="No. of Points Located" name="pointsLocated" value={formData.pointsLocated} onChange={handleInputChange} placeholder="Total points found" />
                        <InputGroup label="Recommended Point No" name="recommendedPointNumber" value={formData.recommendedPointNumber} onChange={handleInputChange} placeholder="Best point number" />
                        <InputGroup type="number" label="Recommended Depth (ft)" name="recommendedDepth" value={formData.recommendedDepth} onChange={handleInputChange} placeholder="Depth in feet" />
                        <InputGroup type="number" label="Recommended Casing Length (ft)" name="recommendedCasingDepth" value={formData.recommendedCasingDepth} onChange={handleInputChange} placeholder="Casing length in feet" />
                        <InputGroup label="Expected Fracture Depths" name="expectedFractureDepths" value={formData.expectedFractureDepths} onChange={handleInputChange} placeholder="e.g. 150, 320, 450 ft" />
                        <InputGroup type="number" label="Expected Water Yield (inches)" name="expectedYield" value={formData.expectedYield} onChange={handleInputChange} placeholder="Yield in inches" />
                    </div>
                </div>

                {/* 5. Uploads */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <IoCloudUploadOutline className="text-[#0A84FF]" />
                        Evidence & Uploads
                    </h2>

                    {/* Image Upload */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Site / Machine Photos</label>
                        <div className="flex flex-wrap gap-4 items-center">
                            <label className="flex flex-col items-center justify-center w-24 h-24 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#0A84FF] hover:bg-blue-50/50 transition-all">
                                <IoImageOutline className="text-2xl text-gray-400" />
                                <span className="text-xs text-gray-500 mt-1 font-medium">Add Photo</span>
                                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>

                            {formData.images.map((img, idx) => (
                                <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                                    <img src={URL.createObjectURL(img)} alt="preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(idx)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                    >
                                        <IoCloseCircleOutline className="text-base" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PDF Report Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Detailed Report (PDF Optional)</label>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 border border-gray-300 transition-colors font-medium text-sm">
                                <IoDocumentTextOutline />
                                <span>Choose PDF</span>
                                <input type="file" accept="application/pdf" onChange={handleReportFileChange} className="hidden" />
                            </label>
                            {formData.reportFile && (
                                <span className="text-sm text-green-600 font-medium truncate max-w-xs">{formData.reportFile.name}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Additional Notes */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Any other observations..."
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] text-gray-800"
                    />
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4 pb-8">
                    <button
                        type="button"
                        onClick={() => navigate(`/vendor/bookings/${bookingId}`)}
                        className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 px-6 rounded-[12px] hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex-[2] bg-[#0A84FF] text-white font-bold py-3.5 px-6 rounded-[12px] hover:bg-[#005BBB] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Submitting Report...
                            </>
                        ) : (
                            <>
                                <IoCheckmarkCircleOutline className="text-xl" />
                                Submit Survey Report
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

function InputGroup({ label, name, value, onChange, type = "text", placeholder }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] transition-shadow text-gray-800"
            />
        </div>
    );
}
