import { useState, useEffect, useRef } from "react";
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
    IoAddOutline,
    IoChevronDownOutline,
    IoCheckmarkOutline,
    IoShieldCheckmarkOutline
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
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [isDraftRestored, setIsDraftRestored] = useState(false);

    const [formData, setFormData] = useState({
        // Booking & Customer Details
        customerName: "",
        village: "",
        mandal: "",
        district: "",
        state: "",
        landLocation: "",
        surveyNumber: "",
        extent: "",

        // Geological Information
        geologicalInfo: {
            rockType: "",
            soilType: "",
            terrainType: "",
            weatheredZone: "",
            groundwaterCondition: ""
        },

        // Existing Borewell Details
        existingBorewell: {
            distance: "",
            depth: "",
            yield: "",
            status: ""
        },

        // Survey Recommendations
        surveyRecommendations: {
            pointsInvestigated: "",
            recommendedPointNumber: "",
            latitude: "",
            longitude: "",
            groundElevation: "",
            recommendedBoreDepth: "",
            recommendedCasingDepth: "",
            expectedFractureDepths: "",
            expectedYield: ""
        },
        
        drillingInstructions: {
            stopDrillingDepth: "",
            flushBorewell: false
        },

        confidenceLevel: "",
        drillingRecommendation: "",
        notes: "",
        
        // Survey Result
        waterFound: "",

        declaration: {
            expertDeclaration: false,
            signature: ""
        },

        evidence: {
            gpsLocation: {
                lat: null,
                lng: null
            },
            photoCount: 0
        },

        images: [],
        reportFile: null,
    });

    useEffect(() => {
        loadBookingDetails();
    }, [bookingId]);

    // Automatically pre-fill details from booking & restore unsaved draft from localStorage if page was refreshed
    useEffect(() => {
        if (booking && bookingId) {
            let extractedSurveyNo = booking.surveyNumber || booking.surveyNo || booking.address?.surveyNumber;
            
            if (!extractedSurveyNo && booking.notes) {
                const surMatch = booking.notes.match(/(?:Survey No|Plot No):\s*([^.\n]+)/i);
                if (surMatch) {
                    extractedSurveyNo = surMatch[1].trim();
                }
            }

            const initialValues = {
                customerName: booking.user?.name || booking.customerName || "",
                village: booking.village || booking.address?.village || booking.address?.city || "",
                mandal: booking.mandal || booking.address?.mandal || booking.district || "",
                district: booking.district || booking.address?.district || "",
                state: booking.state || booking.address?.state || "",
                landLocation: booking.address?.landmark || booking.address?.street || booking.landmark || "",
                surveyNumber: extractedSurveyNo || "",
                extent: booking.purposeExtent ? formatAcresGuntasDisplay(booking.purposeExtent) : (booking.extent || ""),
            };

            const savedDraftKey = `survey_report_draft_${bookingId}`;
            const savedDraft = localStorage.getItem(savedDraftKey);

            if (savedDraft) {
                try {
                    const parsedDraft = JSON.parse(savedDraft);
                    setFormData(prev => ({
                        ...prev,
                        ...initialValues,
                        ...parsedDraft,
                        images: prev.images || [],
                        reportFile: prev.reportFile || null
                    }));
                    setIsDraftRestored(true);
                } catch (err) {
                    console.error("Error loading draft:", err);
                    setFormData(prev => ({ ...prev, ...initialValues }));
                }
            } else {
                setFormData(prev => ({ ...prev, ...initialValues }));
            }
        }
    }, [booking, bookingId]);

    // Auto-save form draft to localStorage whenever form values change
    useEffect(() => {
        if (bookingId && formData) {
            const { images, reportFile, ...draftToSave } = formData;
            const hasUserChanges = 
                draftToSave.waterFound || 
                draftToSave.notes || 
                draftToSave.confidenceLevel || 
                draftToSave.geologicalInfo?.rockType || 
                draftToSave.surveyRecommendations?.recommendedBoreDepth;

            if (hasUserChanges) {
                localStorage.setItem(`survey_report_draft_${bookingId}`, JSON.stringify(draftToSave));
            }
        }
    }, [formData, bookingId]);

    const handleClearDraft = () => {
        localStorage.removeItem(`survey_report_draft_${bookingId}`);
        setIsDraftRestored(false);
        if (booking) {
            let extractedSurveyNo = booking.surveyNumber || booking.surveyNo || booking.address?.surveyNumber;
            setFormData(prev => ({
                ...prev,
                geologicalInfo: { rockType: "", soilType: "", terrainType: "", weatheredZone: "", groundwaterCondition: "" },
                existingBorewell: { distance: "", depth: "", yield: "", status: "" },
                surveyRecommendations: { pointsInvestigated: "", recommendedPointNumber: "", latitude: "", longitude: "", groundElevation: "", recommendedBoreDepth: "", recommendedCasingDepth: "", expectedFractureDepths: "", expectedYield: "" },
                drillingInstructions: { stopDrillingDepth: "", flushBorewell: false },
                confidenceLevel: "",
                drillingRecommendation: "",
                notes: "",
                waterFound: "",
                declaration: { expertDeclaration: false, signature: "" }
            }));
            toast.showInfo("Draft cleared. Form reset to default.");
        }
    };

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
        const { name, value, type, checked } = e.target;
        const inputValue = type === 'checkbox' ? checked : value;

        if (name.includes(".")) {
            const [parent, child] = name.split(".");
            setFormData((prev) => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: inputValue,
                },
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: inputValue }));
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

    const handleOpenPreview = (e) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!formData.waterFound) {
            toast.showError("Please select whether a suitable borewell point was identified or not.");
            return;
        }

        if (formData.images.length < 3) {
            toast.showError("Please upload at least 3 photos (Site, Equipment, Marked Point).");
            return;
        }

        if (!formData.declaration.expertDeclaration) {
            toast.showError("Please check the Expert Declaration to proceed.");
            return;
        }

        if (!formData.declaration.signature) {
            toast.showError("Please provide your digital signature.");
            return;
        }

        setShowPreviewModal(true);
    };

    const handleFinalSubmit = async () => {
        try {
            setSubmitting(true);

            const reportFormData = new FormData();
            
            // Create a payload without the files
            const { images, reportFile, ...dataPayload } = formData;
            reportFormData.append("reportData", JSON.stringify(dataPayload));

            formData.images.forEach((image) => {
                reportFormData.append("images", image);
            });

            if (formData.reportFile) {
                reportFormData.append("reportFile", formData.reportFile);
            }

            const response = await uploadVisitReport(bookingId, reportFormData);

            if (response.success) {
                localStorage.removeItem(`survey_report_draft_${bookingId}`);
                toast.showSuccess("Report uploaded successfully! User will be notified.");
                setShowPreviewModal(false);
                setTimeout(() => {
                    navigate(`/vendor/bookings/${bookingId}`);
                }, 2000);
            } else {
                setError(response.message || "Failed to upload report");
                setShowPreviewModal(false);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to upload report. Please try again.");
            setShowPreviewModal(false);
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

            {isDraftRestored && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-sm text-amber-900 shadow-xs">
                    <div className="flex items-center gap-2 font-medium">
                        <IoSparklesOutline className="text-amber-600 text-lg flex-shrink-0" />
                        <span>Restored unsaved draft from your last session.</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleClearDraft}
                        className="text-xs font-bold text-amber-700 underline hover:text-amber-950 transition-colors whitespace-nowrap"
                    >
                        Clear Draft
                    </button>
                </div>
            )}

            <form onSubmit={handleOpenPreview} className="space-y-6">

                {/* 1. Booking Information (Read-only) */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <IoDocumentTextOutline className="text-[#0A84FF]" />
                        Booking Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><span className="text-gray-500">Booking ID:</span> <span className="font-semibold">{booking?._id || booking?.id}</span></div>
                        <div><span className="text-gray-500">Booking Date:</span> <span className="font-semibold">{booking?.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-IN') : '-'}</span></div>
                        <div><span className="text-gray-500">Survey Category:</span> <span className="font-semibold">{booking?.service?.category?.name || booking?.service?.name || booking?.surveyCategory || '-'}</span></div>
                        <div><span className="text-gray-500">Property Type:</span> <span className="font-semibold">{booking?.purpose || booking?.propertyType || '-'}</span></div>
                        <div><span className="text-gray-500">Customer Name:</span> <span className="font-semibold">{booking?.user?.name || booking?.customerName || '-'}</span></div>
                        <div><span className="text-gray-500">Mobile Number:</span> <span className="font-semibold">{booking?.user?.phone || booking?.user?.mobileNumber || booking?.alternatePhone || '-'}</span></div>
                    </div>
                </div>

                {/* 2. Customer & Location Details (Auto-filled & Locked) */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <IoPersonOutline className="text-[#0A84FF]" />
                        Customer & Location Details (Locked)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-80">
                        <InputGroup label="Customer Name" name="customerName" value={formData.customerName} readOnly />
                        <InputGroup label="Survey No" name="surveyNumber" value={formData.surveyNumber} readOnly />
                        <InputGroup label="Survey Area (Extent)" name="extent" value={formData.extent} readOnly />
                        <InputGroup label="Village" name="village" value={formData.village} readOnly />
                        <InputGroup label="Mandal" name="mandal" value={formData.mandal} readOnly />
                        <InputGroup label="District" name="district" value={formData.district} readOnly />
                        <InputGroup label="State" name="state" value={formData.state} readOnly />
                    </div>
                </div>

                {/* 3. Geological Information */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <IoMapOutline className="text-[#0A84FF]" />
                        Geological Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectGroup label="Rock Type" name="geologicalInfo.rockType" value={formData.geologicalInfo.rockType} onChange={handleInputChange} options={["", "Granite", "Basalt", "Peninsular Gneiss", "Quartzite", "Schist", "Limestone", "Sandstone", "Alluvium", "Laterite", "Other"]} />
                        <SelectGroup label="Soil Type" name="geologicalInfo.soilType" value={formData.geologicalInfo.soilType} onChange={handleInputChange} options={["", "Red Sandy", "Black Cotton", "Clay", "Gravelly", "Lateritic", "Alluvial", "Mixed", "Other"]} />
                        <SelectGroup label="Terrain Type" name="geologicalInfo.terrainType" value={formData.geologicalInfo.terrainType} onChange={handleInputChange} options={["", "Flat", "Hilly", "Sloping", "Undulating", "Valley", "Other"]} />
                        <InputGroup label="Weathered Zone (in ft)" name="geologicalInfo.weatheredZone" value={formData.geologicalInfo.weatheredZone} onChange={handleInputChange} placeholder="e.g. 20-45 ft" />
                        <SelectGroup label="Groundwater Condition" name="geologicalInfo.groundwaterCondition" value={formData.geologicalInfo.groundwaterCondition} onChange={handleInputChange} options={["", "Poor", "Moderate", "Good", "Excellent"]} />
                    </div>
                </div>

                {/* 4. Existing Borewell Details */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <IoConstructOutline className="text-[#0A84FF]" />
                        Existing Borewell Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <InputGroup type="number" label="Nearest Distance (meters)" name="existingBorewell.distance" value={formData.existingBorewell.distance} onChange={handleInputChange} placeholder="__ meters" />
                        <InputGroup type="number" label="Nearby Depth (ft)" name="existingBorewell.depth" value={formData.existingBorewell.depth} onChange={handleInputChange} placeholder="__ ft" />
                        <InputGroup type="number" label="Yield (inches)" name="existingBorewell.yield" value={formData.existingBorewell.yield} onChange={handleInputChange} placeholder="__ inches" />
                        <SelectGroup label="Status" name="existingBorewell.status" value={formData.existingBorewell.status} onChange={handleInputChange} options={["", "Working", "Seasonal", "Dry", "Failed"]} />
                    </div>
                </div>

                {/* 5. Survey Recommendations */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <IoSparklesOutline className="text-[#0A84FF]" />
                        Survey Recommendations
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup type="number" label="No. of Points Investigated" name="surveyRecommendations.pointsInvestigated" value={formData.surveyRecommendations.pointsInvestigated} onChange={handleInputChange} />
                        <InputGroup label="Recommended Point Number" name="surveyRecommendations.recommendedPointNumber" value={formData.surveyRecommendations.recommendedPointNumber} onChange={handleInputChange} />
                        <InputGroup label="Latitude" name="surveyRecommendations.latitude" value={formData.surveyRecommendations.latitude} onChange={handleInputChange} />
                        <InputGroup label="Longitude" name="surveyRecommendations.longitude" value={formData.surveyRecommendations.longitude} onChange={handleInputChange} />
                        <InputGroup label="Ground Elevation (optional)" name="surveyRecommendations.groundElevation" value={formData.surveyRecommendations.groundElevation} onChange={handleInputChange} />
                        <InputGroup type="number" label="Recommended Bore Depth (ft)" name="surveyRecommendations.recommendedBoreDepth" value={formData.surveyRecommendations.recommendedBoreDepth} onChange={handleInputChange} />
                        <InputGroup type="number" label="Recommended Casing Depth (ft)" name="surveyRecommendations.recommendedCasingDepth" value={formData.surveyRecommendations.recommendedCasingDepth} onChange={handleInputChange} />
                        <InputGroup label="Expected Fracture Zones (depths in ft)" name="surveyRecommendations.expectedFractureDepths" value={formData.surveyRecommendations.expectedFractureDepths} onChange={handleInputChange} placeholder="e.g. 150, 220 ft" />
                        <InputGroup type="number" label="Expected Water Yield (optional, inches)" name="surveyRecommendations.expectedYield" value={formData.surveyRecommendations.expectedYield} onChange={handleInputChange} />
                    </div>
                </div>

                {/* 6. Confidence & Recommendations */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <h2 className="text-lg font-bold text-gray-800 mb-5 pb-2 border-b border-gray-100">
                        Confidence & Drilling Recommendations
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Confidence Level</label>
                            <div className="flex gap-2">
                                {["High", "Medium", "Low"].map((level) => (
                                    <label key={level} className={`flex-1 text-center py-2 rounded-lg border-2 cursor-pointer transition-all ${formData.confidenceLevel === level ? "border-[#0A84FF] bg-blue-50 text-[#0A84FF] font-bold" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                                        <input type="radio" name="confidenceLevel" value={level} checked={formData.confidenceLevel === level} onChange={handleInputChange} className="hidden" />
                                        {level === "High" ? "★★★★★ High" : level === "Medium" ? "★★★☆☆ Medium" : "★☆☆☆☆ Low"}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <SelectGroup label="Drilling Recommendation" name="drillingRecommendation" value={formData.drillingRecommendation} onChange={handleInputChange} options={["", "Proceed Immediately", "Suitable After Monsoon", "Proceed With Caution", "Not Recommended"]} />
                    </div>
                </div>

                {/* 6.5 Drilling Instructions */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border-l-4 border-l-orange-400">
                    <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <IoConstructOutline className="text-orange-500" />
                        Drilling Instructions for Contractor
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup type="number" label="Stop drilling after (ft) if no fracture is encountered" name="drillingInstructions.stopDrillingDepth" value={formData.drillingInstructions.stopDrillingDepth} onChange={handleInputChange} placeholder="e.g. 500" />
                        <div className="flex items-center h-full pt-4">
                            <label className="flex items-center gap-3 p-4 bg-orange-50/50 rounded-lg border border-orange-100 cursor-pointer w-full hover:bg-orange-50 transition-colors">
                                <input type="checkbox" name="drillingInstructions.flushBorewell" checked={formData.drillingInstructions.flushBorewell} onChange={handleInputChange} className="w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500" />
                                <span className="text-sm font-semibold text-gray-800">Flush borewell before yield testing</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* 7. Evidence & Notes */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <IoCloudUploadOutline className="text-[#0A84FF]" />
                        Evidence & Notes
                    </h2>

                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-gray-700">Upload Site Evidence (Minimum 3: Site Photograph, Marked Point, Survey Equipment)</label>
                            <button type="button" onClick={() => {
                                if(navigator.geolocation) {
                                    navigator.geolocation.getCurrentPosition((pos) => {
                                        setFormData(prev => ({...prev, evidence: {...prev.evidence, gpsLocation: {lat: pos.coords.latitude, lng: pos.coords.longitude}}}));
                                        toast.showSuccess("GPS Location captured!");
                                    }, () => toast.showError("Failed to capture GPS. Please enable permissions."));
                                }
                            }} className="text-xs bg-blue-50 text-[#0A84FF] font-bold px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                                Auto-capture GPS
                            </button>
                        </div>
                        {formData.evidence.gpsLocation.lat && <p className="text-xs text-green-600 font-bold mb-3">✓ GPS Coordinates Captured</p>}
                        <div className="flex flex-wrap gap-4 items-center">
                            <label className="flex flex-col items-center justify-center w-24 h-24 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#0A84FF] hover:bg-blue-50/50 transition-all">
                                <IoImageOutline className="text-2xl text-gray-400" />
                                <span className="text-xs text-gray-500 mt-1 font-medium">Add Photo</span>
                                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                            {formData.images.map((img, idx) => (
                                <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                                    <img src={URL.createObjectURL(img)} alt="preview" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors">
                                        <IoCloseCircleOutline className="text-base" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Detailed Report (PDF Optional)</label>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 border border-gray-300 transition-colors font-medium text-sm">
                                <IoDocumentTextOutline />
                                <span>Choose PDF</span>
                                <input type="file" accept="application/pdf" onChange={handleReportFileChange} className="hidden" />
                            </label>
                            {formData.reportFile && <span className="text-sm text-green-600 font-medium truncate max-w-xs">{formData.reportFile.name}</span>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes / Professional Remarks</label>
                        <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Professional observations..." rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] text-gray-800" />
                    </div>
                </div>

                {/* 8. Survey Result (Moved to bottom) */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <label className="block text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <IoWaterOutline className="text-[#0A84FF]" />
                        Survey Result
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-[12px] border-2 cursor-pointer transition-all ${formData.waterFound === "true" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 hover:border-green-200"}`}>
                            <input type="radio" name="waterFound" value="true" checked={formData.waterFound === "true"} onChange={handleInputChange} className="hidden" />
                            <span className="font-bold">✅ Suitable Borewell Point Identified</span>
                        </label>
                        <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-[12px] border-2 cursor-pointer transition-all ${formData.waterFound === "false" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 hover:border-red-200"}`}>
                            <input type="radio" name="waterFound" value="false" checked={formData.waterFound === "false"} onChange={handleInputChange} className="hidden" />
                            <span className="font-bold">❌ No Suitable Borewell Point Identified</span>
                        </label>
                    </div>
                </div>

                {/* 9. Declaration & Signature */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border-l-4 border-l-[#0A84FF]">
                    <h2 className="text-lg font-bold text-gray-800 mb-5 pb-2 border-b border-gray-100">
                        Expert Declaration & Signature
                    </h2>
                    
                    <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer mb-5">
                        <input type="checkbox" name="declaration.expertDeclaration" checked={formData.declaration.expertDeclaration} onChange={handleInputChange} className="mt-1 w-5 h-5 text-[#0A84FF] rounded" />
                        <span className="text-sm font-semibold text-gray-700">I confirm that this report is based on my professional survey and field observations. (Mandatory)</span>
                    </label>

                    <div className="max-w-md">
                        <InputGroup label="Digital Signature (Enter Full Name)" name="declaration.signature" value={formData.declaration.signature} onChange={handleInputChange} placeholder="Type your name..." />
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4 pb-8">
                    <button type="button" onClick={() => navigate(`/vendor/bookings/${bookingId}`)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 px-6 rounded-[12px] hover:bg-gray-200 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" className="flex-[2] bg-[#0A84FF] text-white font-bold py-3.5 px-6 rounded-[12px] hover:bg-[#005BBB] transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                        <IoCheckmarkCircleOutline className="text-xl" /> Review & Submit Report
                    </button>
                </div>
            </form>

            {/* Preview Modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                        <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex justify-between items-center z-10 rounded-t-2xl">
                            <h2 className="text-2xl font-bold text-gray-800">Review Report</h2>
                            <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                                <IoCloseCircleOutline className="text-2xl" />
                            </button>
                        </div>
                        
                        <div className="p-4 sm:p-8 pb-12 flex-1">
                            {/* Mimicking Customer PDF layout structure */}
                            <div className="border border-slate-200/80 rounded-2xl p-4 sm:p-8 bg-gradient-to-b from-slate-50/50 to-white shadow-lg relative overflow-hidden">
                                {/* Top Decorative Header Banner */}
                                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-600"></div>

                                <div className="text-center mb-6 sm:mb-8 border-b border-slate-200/60 pb-6 pt-2">
                                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs mb-3 border border-blue-200/60">
                                        <IoShieldCheckmarkOutline className="text-sm text-blue-600" /> JalaDhar Certified Geological Analysis
                                    </div>
                                    <h1 className="text-xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">Groundwater Survey Report</h1>
                                    <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">Official Technical Field Assessment Preview</p>
                                </div>
                                
                                {/* Basic Info Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm mb-8 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/60 shadow-xs">
                                    <div className="space-y-1">
                                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] sm:text-xs">Customer Name</p>
                                        <p className="font-bold text-slate-800 text-base">{formData.customerName || booking?.user?.name || "N/A"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] sm:text-xs">Booking ID</p>
                                        <p className="font-mono font-bold text-blue-600 text-base">{booking?._id?.slice(-8).toUpperCase() || booking?.id || "N/A"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] sm:text-xs">Survey Location</p>
                                        <p className="font-semibold text-slate-800">{[formData.village, formData.district].filter(Boolean).join(", ") || "Location specified on site"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] sm:text-xs">Survey Extent</p>
                                        <p className="font-semibold text-slate-800">{formData.extent ? `${formData.extent}` : "N/A"}</p>
                                    </div>
                                </div>

                                {/* Geological Assessment */}
                                <div className="mb-8 bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-xs">
                                    <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200/60 flex items-center gap-2">
                                        <IoMapOutline className="text-blue-600 text-base" />
                                        <h3 className="text-slate-800 font-bold text-xs uppercase tracking-wider">Geological Assessment</h3>
                                    </div>
                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                                            <span className="text-slate-500 font-medium">Rock Type</span>
                                            <span className="font-bold text-slate-800">{formData.geologicalInfo.rockType || "N/A"}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                                            <span className="text-slate-500 font-medium">Soil Type</span>
                                            <span className="font-bold text-slate-800">{formData.geologicalInfo.soilType || "N/A"}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                                            <span className="text-slate-500 font-medium">Terrain Type</span>
                                            <span className="font-bold text-slate-800">{formData.geologicalInfo.terrainType || "N/A"}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                                            <span className="text-slate-500 font-medium">Weathered Zone</span>
                                            <span className="font-bold text-slate-800">{formData.geologicalInfo.weatheredZone ? `${formData.geologicalInfo.weatheredZone} ft` : "N/A"}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 sm:col-span-2">
                                            <span className="text-slate-500 font-medium">GW Condition</span>
                                            <span className="font-bold text-slate-800">{formData.geologicalInfo.groundwaterCondition || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Primary Recommendation */}
                                <div className="mb-8 bg-white rounded-xl border border-blue-200/80 overflow-hidden shadow-xs">
                                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 flex justify-between items-center">
                                        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm uppercase tracking-wider">
                                            <IoSparklesOutline className="text-base text-yellow-300" />
                                            <span>Primary Recommendation</span>
                                        </div>
                                        <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-xs">
                                            Point {formData.surveyRecommendations.recommendedPointNumber || "1"}
                                        </span>
                                    </div>
                                    <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
                                        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                            <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Target Depth</p>
                                            <p className="text-lg sm:text-xl font-black text-blue-700">{formData.surveyRecommendations.recommendedBoreDepth ? `${formData.surveyRecommendations.recommendedBoreDepth} ft` : "N/A"}</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Casing Depth</p>
                                            <p className="text-lg sm:text-xl font-black text-slate-800">{formData.surveyRecommendations.recommendedCasingDepth ? `${formData.surveyRecommendations.recommendedCasingDepth} ft` : "N/A"}</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Fracture Zones</p>
                                            <p className="font-bold text-slate-800 truncate">{formData.surveyRecommendations.expectedFractureDepths || "N/A"}</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Expected Yield</p>
                                            <p className="font-bold text-slate-800">{formData.surveyRecommendations.expectedYield ? `${formData.surveyRecommendations.expectedYield} inches` : "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Drilling Instructions */}
                                <div className="mb-8 bg-amber-50/40 rounded-xl border border-amber-200/60 p-4 sm:p-5">
                                    <div className="flex items-center gap-2 mb-3 text-amber-900 font-bold text-xs uppercase tracking-wider">
                                        <IoConstructOutline className="text-amber-600 text-base" />
                                        <span>Drilling Instructions</span>
                                    </div>
                                    <div className="text-xs sm:text-sm text-slate-700 space-y-2 font-medium">
                                        <p className="flex items-start gap-2">
                                            <span className="text-amber-600 font-bold">•</span>
                                            <span>Stop drilling after <strong className="text-amber-800 font-bold underline">{formData.drillingInstructions.stopDrillingDepth || "___"} ft</strong> if no fracture is encountered.</span>
                                        </p>
                                        {formData.drillingInstructions.flushBorewell && (
                                            <p className="flex items-start gap-2">
                                                <span className="text-amber-600 font-bold">•</span>
                                                <span>Flush borewell thoroughly before yield testing.</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Final Result Card */}
                                <div className="bg-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-slate-200/80 shadow-xs">
                                    <div>
                                        <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Final Result & Suitability</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-3 h-3 rounded-full ${formData.waterFound === 'true' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                                            <p className={`text-base sm:text-lg font-black tracking-tight ${formData.waterFound === 'true' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {formData.waterFound === 'true' ? 'SUITABLE POINT IDENTIFIED' : 'NO SUITABLE POINT'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full sm:w-auto text-left sm:text-right border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                                        <p className="font-[Satisfy,cursive] text-2xl text-blue-900 border-b border-slate-300 pb-1 px-2 inline-block mb-1">
                                            {formData.declaration.signature || "Authorized Expert"}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Certified Hydrogeologist</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-200 flex gap-4 rounded-b-2xl">
                            <button onClick={() => setShowPreviewModal(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3.5 px-6 rounded-[12px] hover:bg-gray-50 transition-colors">
                                Edit Report
                            </button>
                            <button onClick={handleFinalSubmit} disabled={submitting} className="flex-[2] bg-green-500 text-white font-bold py-3.5 px-6 rounded-[12px] hover:bg-green-600 transition-colors shadow-lg shadow-green-200 flex items-center justify-center gap-2">
                                {submitting ? "Submitting..." : "Submit Final Report"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InputGroup({ label, name, value, onChange, type = "text", placeholder, readOnly = false }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                onWheel={(e) => e.target.blur()}
                placeholder={placeholder}
                readOnly={readOnly}
                className={`w-full px-4 py-2.5 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] transition-shadow text-gray-800 ${readOnly ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"}`}
            />
        </div>
    );
}

function SelectGroup({ label, name, value, onChange, options }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (opt) => {
        onChange({ target: { name, value: opt } });
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-2.5 border rounded-[10px] cursor-pointer flex justify-between items-center transition-shadow text-[14px]
                    ${isOpen ? "border-[#0A84FF] ring-2 ring-blue-100 bg-white shadow-sm" : "border-gray-300 hover:border-gray-400 bg-white"}
                    ${value ? "text-gray-900" : "text-gray-400"}
                `}
            >
                <span>{value || "Select..."}</span>
                <IoChevronDownOutline className="text-gray-500" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-[#F9F9FA]/95 backdrop-blur-xl border border-gray-200/60 rounded-[12px] shadow-[0_10px_40px_rgb(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <ul className="max-h-64 overflow-y-auto py-1.5 custom-scrollbar px-1.5">
                        {options.map((opt, idx) => {
                            const isSelected = value === opt;
                            const isPlaceholder = !opt;
                            const displayOpt = opt || "Select...";

                            return (
                                <li
                                    key={idx}
                                    onClick={() => handleSelect(opt)}
                                    className={`relative px-8 py-1.5 my-0.5 cursor-pointer text-[13px] font-medium transition-colors rounded-[6px] flex items-center
                                        ${isSelected ? "bg-[#2b86ff] text-white" : "text-gray-800 hover:bg-[#2b86ff] hover:text-white"}
                                    `}
                                >
                                    {isSelected && (
                                        <IoCheckmarkOutline className="absolute left-2.5 text-base font-bold text-white" />
                                    )}
                                    <span>{displayOpt}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
