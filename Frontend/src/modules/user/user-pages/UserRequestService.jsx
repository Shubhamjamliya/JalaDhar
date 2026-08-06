import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    IoArrowBack,
    IoCheckmarkCircle,
    IoLocationSharp,
    IoCalendarOutline,
    IoTimeOutline,
    IoLeafOutline,
    IoHomeOutline,
    IoBusinessOutline,
    IoConstructOutline,
    IoCashOutline,
    IoSearchOutline,
    IoChevronDownOutline,
    IoInformationCircleOutline,
    IoShieldCheckmarkOutline,
    IoCheckmarkCircleOutline,
    IoCloseOutline
} from "react-icons/io5";
import { createBooking, calculateBookingCharges } from "../../../services/bookingApi";
import PageContainer from "../../shared/components/PageContainer";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import PlaceAutocompleteInput from "../../../components/PlaceAutocompleteInput";
import PolicyModal from "../../shared/components/PolicyModal";
import { parseAcresGuntas, isAgriCategory } from "../../../utils/landAreaHelper";
import StateDistrictInput from "../../../components/StateDistrictInput";
import { getStatesList, getDistrictsList, findStateForDistrict } from "../../../utils/indianStatesDistricts";
import { formatDateToDDMMYYYY, formatDateToLongString } from "../../../utils/dateFormatter";

// --- Sub-components ---

const PurposeSelection = ({ onSelect }) => {
    const purposes = [
        { id: "Agriculture", label: "Agriculture", icon: IoLeafOutline, color: "bg-green-100 text-green-600" },
        { id: "Domestic/Household", label: "Domestic/Household", icon: IoHomeOutline, color: "bg-blue-100 text-blue-600" },
        { id: "Industrial/Commercial", label: "Industrial/Commercial", icon: IoBusinessOutline, color: "bg-purple-100 text-purple-600" },
        { id: "Industrial", label: "Industrial", icon: IoConstructOutline, color: "bg-orange-100 text-orange-600" }
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">Select Purpose</h2>
            <div className="grid grid-cols-2 gap-4">
                {purposes.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => onSelect(p.id)}
                        className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-500 hover:shadow-md transition-all aspect-square"
                    >
                        <div className={`p-4 rounded-full ${p.color} mb-3 text-3xl`}>
                            <p.icon />
                        </div>
                        <span className="font-semibold text-gray-700 text-sm text-center">{p.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const TermsAndConditions = ({ purpose, onAccept, onCancel }) => {
    const [loading, setLoading] = useState(true);
    const [termsContent, setTermsContent] = useState("");

    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const response = await getPublicSettings('policy');
                if (response.success && response.data.settings) {
                    const terms = response.data.settings.find(s => s.key === 'terms_of_service');
                    if (terms) {
                        setTermsContent(terms.value);
                    }
                }
            } catch (error) {
                console.error("Error fetching terms:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTerms();
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150" onClick={onCancel}>
            <div className="bg-white rounded-[22px] shadow-2xl max-w-md w-full p-5 sm:p-6 border border-gray-100 space-y-4 transform transition-all animate-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
                
                {/* Header — Tight & Aligned */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A84FF] flex items-center justify-center shrink-0">
                            <IoShieldCheckmarkOutline className="text-2xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 leading-none">Terms & Conditions</h3>
                            <span className="text-[11px] font-semibold text-[#0A84FF] inline-block mt-1">
                                {purpose || "Survey"} Category
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors active:scale-95"
                    >
                        <IoCloseOutline className="text-xl" />
                    </button>
                </div>

                {/* Content Body — Zero Scroll, Perfectly Aligned */}
                {loading ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-semibold text-gray-400">Loading terms...</span>
                    </div>
                ) : (
                    <div className="space-y-2.5 text-xs text-gray-700 font-medium">
                        <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100/90 flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-md bg-blue-100/80 text-[#0A84FF] flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                            <p className="leading-snug text-gray-700">
                                <strong className="text-gray-900 font-bold">Scientific Assessment:</strong> Reports use geophysical methods; groundwater occurrence is natural and yield is not 100% guaranteed.
                            </p>
                        </div>

                        <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100/90 flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-md bg-blue-100/80 text-[#0A84FF] flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                            <p className="leading-snug text-gray-700">
                                <strong className="text-gray-900 font-bold">Advance Payment:</strong> 40% advance payment is required to confirm expert assignment and lock your slot.
                            </p>
                        </div>

                        <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100/90 flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-md bg-blue-100/80 text-[#0A84FF] flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                            <p className="leading-snug text-gray-700">
                                <strong className="text-gray-900 font-bold">Site Access:</strong> Customer presence inside the survey land and safe site access are mandatory during the visit.
                            </p>
                        </div>

                        <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100/90 flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-md bg-blue-100/80 text-[#0A84FF] flex items-center justify-center text-xs shrink-0 mt-0.5">4</span>
                            <p className="leading-snug text-gray-700">
                                <strong className="text-gray-900 font-bold">Platform Policy:</strong> Cancellations, refunds, and rescheduling are governed by standard Jaladhaara policies.
                            </p>
                        </div>
                    </div>
                )}

                {/* Action Buttons — Aligned Footer */}
                <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        className="w-1/3 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all text-xs active:scale-98"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onAccept}
                        disabled={loading}
                        className="w-2/3 py-2.5 rounded-xl font-bold text-white bg-[#0A84FF] hover:bg-[#0070DF] shadow-sm active:scale-98 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                        <IoCheckmarkCircleOutline className="text-base" />
                        <span>I Agree & Continue</span>
                    </button>
                </div>

            </div>
        </div>
    );
};

const ProjectDetailsForm = ({ data, onSubmit, onBack, category }) => {
    // Initialize with data or defaults
    const [formData, setFormData] = useState(data || {
        village: "",
        mandal: "",
        district: "",
        state: "",
        purposeExtent: "",
        areaUnit: "sqft",
        surveyNumber: "",
        plotNumber: "",
        notes: "",
        existingBorewell: {
            hasExisting: false,
            yearOfDrilling: "",
            depthInFeet: "",
            gapsAndDepths: "",
            waterQuantity: "",
            surroundingBorewellDistance: ""
        },
        techniqueUsed: "",
        techniqueProviderName: "",
        notes: "",
        images: []
    });

    const [openDropdown, setOpenDropdown] = useState(null);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleExistingBorewellChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            existingBorewell: { ...prev.existingBorewell, [field]: value }
        }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setFormData({
            ...formData,
            images: [...formData.images, ...newImages],
        });
    };

    const handleRemoveImage = (index) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        setFormData({ ...formData, images: newImages });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5 pb-20">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Project Details</h2>

            {/* Location Details */}
            <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-2">Location Info</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
                        <input
                            required
                            value={formData.village}
                            onChange={(e) => handleChange("village", e.target.value)}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="words"
                            spellCheck={false}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm"
                            placeholder="Village Name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mandal</label>
                        <input
                            required
                            value={formData.mandal}
                            onChange={(e) => handleChange("mandal", e.target.value)}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="words"
                            spellCheck={false}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm"
                            placeholder="Mandal"
                        />
                    </div>
                    <div>
                        <StateDistrictInput
                            required
                            label="District"
                            value={formData.district}
                            onChange={(val) => {
                                handleChange("district", val);
                                const matchedState = findStateForDistrict(val);
                                if (matchedState && !formData.state) {
                                    handleChange("state", matchedState);
                                }
                            }}
                            onSelectSuggestion={(selectedDistrict) => {
                                handleChange("district", selectedDistrict);
                                const matchedState = findStateForDistrict(selectedDistrict);
                                if (matchedState) {
                                    handleChange("state", matchedState);
                                }
                            }}
                            suggestions={getDistrictsList(formData.state, formData.district)}
                            placeholder="Search or enter district..."
                        />
                    </div>
                    <div>
                        <StateDistrictInput
                            required
                            label="State"
                            value={formData.state}
                            onChange={(val) => {
                                handleChange("state", val);
                            }}
                            onSelectSuggestion={(selectedState) => {
                                handleChange("state", selectedState);
                            }}
                            suggestions={getStatesList(formData.state)}
                            placeholder="Search or enter state..."
                        />
                    </div>
                </div>
            </div>

            {/* Extent Input Block — Senior UI Redesign */}
            <div className="bg-white p-4.5 rounded-2xl border border-gray-200/80 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-1">
                        <span>Area Extent</span>
                        <span className="text-red-500">*</span>
                    </label>
                    {isAgriCategory(category) ? (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0A84FF] border border-blue-100/80">
                            🌾 Acres & Guntas
                        </span>
                    ) : (
                        <select
                            name="areaUnit"
                            value={formData.areaUnit || 'sqft'}
                            onChange={(e) => handleChange("areaUnit", e.target.value)}
                            className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#0A84FF] border border-blue-100/80 outline-none cursor-pointer"
                        >
                            <option value="sqft">📐 Square Feet (Sq. Ft.)</option>
                            <option value="sqyd">📐 Square Yards (Sq. Yd.)</option>
                        </select>
                    )}
                </div>

                <div className="relative flex items-center">
                    <input
                        type="number"
                        required
                        value={formData.purposeExtent}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val && isAgriCategory(category)) {
                                const parsed = parseAcresGuntas(val);
                                if (val.includes('.') && parseInt(val.split('.')[1], 10) >= 40) {
                                    handleChange("purposeExtent", String(parsed.decimalValue));
                                    return;
                                }
                            }
                            handleChange("purposeExtent", val);
                        }}
                        onBlur={(e) => {
                            const val = e.target.value;
                            if (val && isAgriCategory(category)) {
                                const parsed = parseAcresGuntas(val);
                                if (parsed.decimalValue > 0) {
                                    handleChange("purposeExtent", String(parsed.decimalValue));
                                }
                            }
                        }}
                        className="w-full pl-4 pr-24 py-3 rounded-xl border border-gray-200 focus:border-[#0A84FF] focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium text-gray-900 placeholder-gray-400 transition-all"
                        placeholder={isAgriCategory(category) ? "e.g. 2.20 (2 Acres 20 Guntas)" : "e.g. 1800"}
                        min="0"
                        step="any"
                    />
                    <div className="absolute right-2.5 px-3 py-1 bg-gray-100/90 text-gray-600 text-xs font-bold rounded-lg pointer-events-none select-none border border-gray-200/60">
                        {isAgriCategory(category) ? "Acres" : (formData.areaUnit === 'sqyd' ? "Sq. Yd." : "Sq. Ft.")}
                    </div>
                </div>

                {/* Live Conversion & Formatted Summary Card */}
                {formData.purposeExtent && !isNaN(parseFloat(formData.purposeExtent)) && parseFloat(formData.purposeExtent) > 0 && isAgriCategory(category) && (
                    <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-r from-blue-50/70 to-indigo-50/50 border border-blue-100/80 flex items-center justify-between text-xs transition-all animate-in fade-in duration-200">
                        {(() => {
                            const parsed = parseAcresGuntas(formData.purposeExtent);
                            return (
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">🌾</span>
                                        <span className="font-bold text-gray-900 text-xs">
                                            {parsed.formatted}
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-medium text-[#0A84FF] bg-white/90 px-2 py-0.5 rounded-md border border-gray-200/60 shadow-2xs">
                                        40 Guntas = 1 Acre
                                    </span>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Existing Borewell */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.existingBorewell.hasExisting}
                        onChange={(e) => handleExistingBorewellChange("hasExisting", e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">Any existing borewell?</span>
                </label>

                {formData.existingBorewell.hasExisting && (
                    <div className="grid grid-cols-2 gap-3 mt-3 animate-in fade-in slide-in-from-top-2">
                        <input
                            type="number"
                            placeholder="Year"
                            value={formData.existingBorewell.yearOfDrilling}
                            onChange={(e) => handleExistingBorewellChange("yearOfDrilling", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500"
                        />
                        <input
                            type="number"
                            placeholder="Depth (ft)"
                            value={formData.existingBorewell.depthInFeet}
                            onChange={(e) => handleExistingBorewellChange("depthInFeet", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500"
                        />
                        <input
                            type="text"
                            placeholder="Gaps & Depths"
                            value={formData.existingBorewell.gapsAndDepths}
                            onChange={(e) => handleExistingBorewellChange("gapsAndDepths", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500 col-span-2"
                        />
                    </div>
                )}
            </div>

            {/* Technique */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Technique Used</label>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setOpenDropdown(openDropdown === 'technique' ? null : 'technique')}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-blue-500 flex items-center justify-between"
                    >
                        <span className={formData.techniqueUsed ? "text-gray-800" : "text-gray-400"}>
                            {formData.techniqueUsed || "Select technique"}
                        </span>
                        <IoChevronDownOutline className={`text-gray-400 transition-transform ${openDropdown === 'technique' ? 'rotate-180' : ''}`} />
                    </button>
                    {openDropdown === 'technique' && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                            {["Coconut", "Dowsing L rods", "3D Locator", "Detector / Diviner", "Geophysical survey"].map((option) => (
                                <div
                                    key={option}
                                    className="px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => {
                                        handleChange("techniqueUsed", option);
                                        setOpenDropdown(null);
                                    }}
                                >
                                    {option}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Images & Notes */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Images (Optional)</label>
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                />
                <label
                    htmlFor="image-upload"
                    className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
                >
                    <span className="text-gray-500 text-sm">Tap to upload images</span>
                </label>
                {formData.images.length > 0 && (
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                        {formData.images.map((img, idx) => (
                            <div key={idx} className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
                                <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(idx)}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Additional Notes</label>
                <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm resize-none"
                    placeholder="Any specific instructions..."
                />
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-3 z-40 md:relative md:bg-transparent md:border-0 md:p-0">
                <button type="button" onClick={onBack} className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Back</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors">Continue</button>
            </div>
        </form>
    );
};

const LocationPicker = ({ onLocationSelect, onBack, initialLocation }) => {
    const [searching, setSearching] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
    const toast = useToast();

    const handlePlaceSelect = (place) => {
        if (place.lat && place.lng) {
            setSelectedLocation({
                lat: place.lat,
                lng: place.lng,
                address: place.formattedAddress
            });
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.showError("Geolocation is not supported by your browser");
            return;
        }
        setSearching(true);

        const handleSuccess = async (pos) => {
            const { latitude, longitude } = pos.coords;
            let address = "Current Location";

            if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
                try {
                    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`);
                    const data = await response.json();
                    if (data.results && data.results[0]) {
                        address = data.results[0].formatted_address;
                    }
                } catch (e) {
                    console.error(e);
                }
            }

            setSelectedLocation({
                lat: latitude,
                lng: longitude,
                address: address
            });
            setSearching(false);
        };

        const handleError = (err) => {
            console.warn("High accuracy geolocation failed, retrying with standard accuracy...", err);
            navigator.geolocation.getCurrentPosition(
                handleSuccess,
                (finalErr) => {
                    console.error("Geolocation failed:", finalErr);
                    if (finalErr.code === 1) {
                        toast.showError("Location permission denied. Please allow location access or search your land address below.");
                    } else {
                        toast.showError("Unable to detect GPS. Please search and select your land address below.");
                    }
                    setSearching(false);
                },
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
            );
        };

        navigator.geolocation.getCurrentPosition(
            handleSuccess,
            handleError,
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const handleConfirm = () => {
        if (selectedLocation && selectedLocation.lat !== undefined && selectedLocation.lng !== undefined) {
            onLocationSelect(selectedLocation);
        } else {
            toast.showError("Please pin the exact location of your survey land with valid GPS coordinates.");
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Pin Location</h2>

            {/* ─── SURVEY LAND LOCATION WARNING BANNER ─── */}
            <div className="rounded-2xl overflow-hidden border-2 border-red-200 shadow-md">
                {/* Header */}
                <div className="bg-red-600 px-4 py-3 flex items-center gap-2">
                    <span className="text-xl">📍</span>
                    <p className="text-white font-extrabold text-sm tracking-wide uppercase">Important — Pin the Correct Location</p>
                </div>
                {/* Body */}
                <div className="bg-red-50 px-4 py-3 space-y-3">
                    <div className="flex items-start gap-2">
                        <span className="text-green-600 font-black text-base mt-0.5">✅</span>
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="text-green-700 font-extrabold">DO: </span>
                            Stand inside the actual survey land and pin your exact GPS location.
                        </p>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-red-600 font-black text-base mt-0.5">❌</span>
                        <p className="text-sm font-semibold text-gray-800">
                            <span className="text-red-700 font-extrabold">DON'T: </span>
                            Pin your village, home, office, road junction, or any nearby landmark unless it is the actual survey land.
                        </p>
                    </div>
                    <p className="text-[11px] text-red-700 font-bold border-t border-red-200 pt-2">
                        ⚠️ Incorrect location pinning may result in expert dispatch to the wrong site and non-refundable charges.
                    </p>
                </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-800 mb-3">Get accurate pricing by pinning location.</p>
                <button
                    onClick={getCurrentLocation}
                    disabled={searching}
                    className="relative w-full flex items-center justify-center bg-white text-blue-600 border border-blue-200 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors shadow-sm text-[13px] sm:text-sm"
                >
                    <IoLocationSharp className="absolute left-4 text-lg" />
                    <span>{searching ? "Locating..." : "Use Current Location of Your Land / Plot"}</span>
                </button>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Address</label>
                <PlaceAutocompleteInput
                    onPlaceSelect={handlePlaceSelect}
                    placeholder="Search village or landmark..."
                    value={selectedLocation?.address || ""}
                    onChange={(e) => setSelectedLocation(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 shadow-sm transition-all"
                />
            </div>

            <div className="pt-4 flex gap-3">
                <button onClick={onBack} className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Back</button>
                <button
                    onClick={handleConfirm}
                    disabled={!selectedLocation}
                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors disabled:opacity-50"
                >
                    Confirm Location
                </button>
            </div>
        </div>
    );
};

const ReviewAndBook = ({ surveyData, service, vendor, onConfirm, onBack }) => {
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [loading, setLoading] = useState(false);
    const [charges, setCharges] = useState(null);
    const [activePolicy, setActivePolicy] = useState(null);
    const toast = useToast();

    useEffect(() => {
        const fetchCharges = async () => {
            // Use service/vendor from props
            if (!service || !vendor || !surveyData.location) return;

            try {
                const res = await calculateBookingCharges(
                    service.id || service._id,
                    vendor.id || vendor._id,
                    surveyData.location.lat,
                    surveyData.location.lng
                );
                if (res.success) setCharges(res.data);
            } catch (e) {
                console.error(e);
            }
        };
        fetchCharges();
    }, []);

    const handlePay = async () => {
        if (!date || !time) {
            toast.showError("Select Date & Time");
            return;
        }
        setLoading(true);
        await onConfirm({ scheduledDate: date, scheduledTime: time });
        setLoading(false);
    };

    return (
        <div className="space-y-6 pb-20">
            <h2 className="text-xl font-bold text-gray-800">Review & Book</h2>

            {/* Expert Info */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-500">Service Provider</p>
                    <p className="font-bold text-gray-800">{vendor?.name}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500">Service</p>
                    <p className="font-bold text-gray-800">{service?.name}</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-semibold text-gray-700 text-sm">Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                        type="date"
                        value={date || ''}
                        className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none font-medium text-gray-800"
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    <select
                        className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none bg-white font-medium text-gray-800"
                        onChange={(e) => setTime(e.target.value)}
                    >
                        <option value="">Select Time</option>
                        {Array.from({ length: 24 }, (_, i) => {
                            const hour = i;
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour % 12 || 12;
                            const timeString = `${displayHour.toString().padStart(2, '0')}:00 ${ampm}`;
                            return (
                                <option key={i} value={timeString}>
                                    {timeString}
                                </option>
                            );
                        })}
                    </select>
                </div>
                {date && (
                    <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2.5 flex items-center justify-between text-xs text-blue-900 font-semibold">
                        <span>Selected Visit Date:</span>
                        <span className="bg-white px-2.5 py-1 rounded border border-blue-200 font-bold text-blue-700 shadow-sm">
                            {formatDateToDDMMYYYY(date)} ({formatDateToLongString(date)})
                        </span>
                    </div>
                )}
            </div>

            {/* Charges */}
            <div className="bg-gray-50 p-5 rounded-xl space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                    <span>Base Service Fee</span>
                    <span className="font-semibold text-gray-800">₹{charges?.baseServiceFee || service?.price}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-xs">
                    <span>GST ({charges?.gstPercentage || 18}% on Base Fee)</span>
                    <span className="font-medium text-gray-700">₹{charges?.gst || 0}</span>
                </div>
                <div className="flex justify-between text-gray-700 font-semibold border-t border-gray-200/60 pt-2">
                    <span>Subtotal</span>
                    <span>₹{charges?.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-xs">
                    <span>Travel Charges ({charges?.distance?.toFixed(1) || '0'} km)</span>
                    <span className="font-medium text-gray-700">₹{charges?.travelCharges || 0}</span>
                </div>
                <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between font-bold text-gray-900 text-base">
                    <span>Total Estimate</span>
                    <span className="text-blue-600">₹{charges?.totalAmount?.toFixed(2) || 'Calculating...'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="bg-blue-100/70 p-2 rounded text-blue-900 text-xs font-bold text-center">
                        Advance ({charges?.advancePercentage || 40}%): ₹{charges?.advanceAmount?.toFixed(2) || '0.00'}
                    </div>
                    <div className="bg-gray-200/70 p-2 rounded text-gray-800 text-xs font-semibold text-center">
                        Remaining ({charges?.remainingPercentage || 60}%): ₹{(charges?.totalAmount - charges?.advanceAmount)?.toFixed(2) || '0.00'}
                    </div>
                </div>
            </div>

            {activePolicy && (
                <PolicyModal 
                  type={activePolicy} 
                  onClose={() => setActivePolicy(null)} 
                  onAgree={activePolicy === 'checkout' ? handlePay : undefined}
                  loadingAction={loading}
                />
            )}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-3 z-40 md:relative md:bg-transparent md:border-0 md:p-0">
                <button onClick={onBack} className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Back</button>
                <button
                    onClick={() => {
                        if (!date) {
                            toast.showError("Please scroll up and select a visit date");
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            return;
                        }
                        setActivePolicy('checkout');
                    }}
                    disabled={!charges || loading}
                    className={`flex-1 py-3 font-bold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${!date ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-black hover:bg-gray-800 text-white'}`}
                >
                    {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (
                        <>
                            {!date ? <IoCalendarOutline /> : <IoCashOutline />}
                            {!date ? "Select Date to Book" : "Pay Advance"}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

// --- Main Wizard ---

export default function UserRequestService() {
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const [step, setStep] = useState(() => {
        const saved = sessionStorage.getItem('urs_step');
        return saved ? parseInt(saved, 10) : 1;
    });

    // Initial state from navigation
    const [service, setService] = useState(null);
    const [vendor, setVendor] = useState(null);

    const [formState, setFormState] = useState(() => {
        const saved = sessionStorage.getItem('urs_formState');
        return saved ? JSON.parse(saved) : {
            category: "", // purpose
            details: null,
            location: null
        };
    });

    const [showTerms, setShowTerms] = useState(() => {
        return sessionStorage.getItem('urs_showTerms') === 'true';
    });

    useEffect(() => {
        sessionStorage.setItem('urs_step', step);
        sessionStorage.setItem('urs_formState', JSON.stringify(formState));
        sessionStorage.setItem('urs_showTerms', showTerms);
    }, [step, formState, showTerms]);

    useEffect(() => {
        if (location.state?.service && location.state?.vendor) {
            const currentVendorId = location.state.vendor.id || location.state.vendor._id;
            const savedVendorId = sessionStorage.getItem('urs_currentVendorId');
            
            if (savedVendorId !== currentVendorId) {
                // New vendor! Clear session storage
                sessionStorage.removeItem('urs_step');
                sessionStorage.removeItem('urs_formState');
                sessionStorage.removeItem('urs_showTerms');
                sessionStorage.setItem('urs_currentVendorId', currentVendorId);
                
                // Reset state in memory for this render
                setStep(1);
                setFormState({ category: "", details: null, location: null });
                setShowTerms(false);
            }
            
            setService(location.state.service);
            setVendor(location.state.vendor);
        } else {
            navigate("/user/serviceprovider");
        }

    }, [location, navigate]);

    // Steps Handlers
    const handlePurposeSelect = (purpose) => {
        setFormState(prev => ({ ...prev, category: purpose }));
        setShowTerms(true);
    };

    const handleTermsAccept = () => {
        setShowTerms(false);
        setStep(2);
    };

    const handleDetailsSubmit = (details) => {
        setFormState(prev => ({ ...prev, details }));
        setStep(3);
    };

    const handleLocationSelect = (loc) => {
        setFormState(prev => ({ ...prev, location: loc }));
        setStep(4);
    };

    const handleFinalBooking = async ({ scheduledDate, scheduledTime }) => {
        try {
            const bookingPayload = {
                serviceId: service.id || service._id,
                vendorId: vendor.id || vendor._id,
                scheduledDate,
                scheduledTime,
                address: {
                    coordinates: { lat: formState.location.lat, lng: formState.location.lng },
                    street: formState.location.address,
                    city: formState.details.village,
                    state: formState.details.state,
                    pincode: "000000"
                },
                // Flatten details into booking root as per backend expectation
                village: formState.details.village,
                mandal: formState.details.mandal,
                district: formState.details.district,
                purpose: formState.category,
                purposeExtent: parseFloat(formState.details.purposeExtent),
                existingBorewell: formState.details.existingBorewell?.hasExisting ? formState.details.existingBorewell : null,
                techniqueUsed: formState.details.techniqueUsed,
                techniqueProviderName: formState.details.techniqueProviderName,
                notes: formState.details.notes
            };

            const response = await createBooking(bookingPayload);

            if (response.success) {
                // Clear session storage upon successful booking
                sessionStorage.removeItem('urs_step');
                sessionStorage.removeItem('urs_formState');
                sessionStorage.removeItem('urs_showTerms');
                sessionStorage.removeItem('urs_currentVendorId');

                navigate("/user/booking/advance-payment/confirmation", {
                    replace: true,
                    state: {
                        booking: response.data.booking,
                        service: service,
                        vendor: vendor,
                        paymentData: response.data.payment,
                        razorpayOrder: response.data.razorpayOrder
                    }
                });
            } else {
                toast.showError(response.message || "Booking failed");
            }

        } catch (err) {
            handleApiError(err, "Failed to create booking");
        }
    };

    if (!service || !vendor) return null;

    return (
        <PageContainer>
            {/* Header Steps */}
            <div className="mb-6 flex items-center justify-between">
                {step > 1 && (
                    <button onClick={() => setStep(step - 1)} className="p-2 -ml-2 text-gray-600">
                        <IoArrowBack className="text-xl" />
                    </button>
                )}
                <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    ))}
                </div>
            </div>

            <div className="max-w-md mx-auto min-h-[60vh] flex flex-col">
                {step === 1 && <PurposeSelection onSelect={handlePurposeSelect} />}
                {step === 2 && <ProjectDetailsForm data={formState.details} category={formState.category} onSubmit={handleDetailsSubmit} onBack={() => setStep(1)} />}
                {step === 3 && <LocationPicker initialLocation={formState.location} onLocationSelect={handleLocationSelect} onBack={() => setStep(2)} />}
                {step === 4 && <ReviewAndBook surveyData={formState} service={service} vendor={vendor} onConfirm={handleFinalBooking} onBack={() => setStep(3)} />}
            </div>

            {showTerms && (
                <TermsAndConditions
                    purpose={formState.category}
                    onAccept={handleTermsAccept}
                    onCancel={() => setShowTerms(false)}
                />
            )}
        </PageContainer>
    );
}
