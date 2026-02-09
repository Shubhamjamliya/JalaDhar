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
    IoChevronDownOutline
} from "react-icons/io5";
import { createBooking, calculateBookingCharges } from "../../../services/bookingApi";
import PageContainer from "../../shared/components/PageContainer";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import PlaceAutocompleteInput from "../../../components/PlaceAutocompleteInput";

// --- Sub-components ---

const PurposeSelection = ({ onSelect }) => {
    const purposes = [
        { id: "Agriculture", label: "Agriculture", icon: IoLeafOutline, color: "bg-green-100 text-green-600" },
        { id: "Domestic/Household", label: "Domestic/Household", icon: IoHomeOutline, color: "bg-blue-100 text-blue-600" },
        { id: "Industrial/Commercial", label: "Industrial/Commercial", icon: IoBusinessOutline, color: "bg-purple-100 text-purple-600" },
        { id: "Open plots", label: "Open plots", icon: IoConstructOutline, color: "bg-orange-100 text-orange-600" }
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
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-300">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Terms & Conditions</h3>
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-600 space-y-2 max-h-60 overflow-y-auto">
                    <p>By proceeding with the <strong>{purpose}</strong> service request, you agree to the following:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>The service is provided by independent vendors.</li>
                        <li>Advance payment is required to book the slot.</li>
                        <li>Cancellation charges may apply as per company policy.</li>
                        <li>Safe access to the site must be provided by the customer.</li>
                    </ul>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onAccept}
                        className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    >
                        I Agree
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProjectDetailsForm = ({ data, onSubmit, onBack }) => {
    // Initialize with data or defaults
    const [formData, setFormData] = useState(data || {
        village: "",
        mandal: "",
        district: "",
        state: "",
        purposeExtent: "",
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
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm"
                            placeholder="Mandal"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                        <input
                            required
                            value={formData.district}
                            onChange={(e) => handleChange("district", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm"
                            placeholder="District"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <input
                            required
                            value={formData.state}
                            onChange={(e) => handleChange("state", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm"
                            placeholder="State"
                        />
                    </div>
                </div>
            </div>

            {/* Extent */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-1">Extent (Acres / Sq Yards)</label>
                <input
                    type="number"
                    required
                    value={formData.purposeExtent}
                    onChange={(e) => handleChange("purposeExtent", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                    placeholder="Enter extent"
                    min="0"
                    step="0.01"
                />
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
            toast.showError("Geolocation not supported");
            return;
        }
        setSearching(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                let address = "Current Location";

                // Keep reverse geocoding simple or implement if API key available
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
            },
            (err) => {
                toast.showError("Could not get location");
                setSearching(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleConfirm = () => {
        if (selectedLocation) {
            onLocationSelect(selectedLocation);
        } else {
            toast.showError("Please pick a location");
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Pin Location</h2>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-800 mb-3">Get accurate pricing by pinning location.</p>
                <button
                    onClick={getCurrentLocation}
                    disabled={searching}
                    className="w-full flex items-center justify-center gap-2 bg-white text-blue-600 border border-blue-200 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors shadow-sm"
                >
                    <IoLocationSharp /> {searching ? "Locating..." : "Use Current Location"}
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
    const [charges, setCharges] = useState(null);
    const [loading, setLoading] = useState(false);
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

            {/* Vendor Info */}
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
                <div className="grid grid-cols-2 gap-3">
                    <input
                        type="date"
                        className="w-full p-2 border rounded-lg text-sm"
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    <select
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none bg-white"
                        onChange={(e) => setTime(e.target.value)}
                    >
                        <option value="">Select Time</option>
                        {Array.from({ length: 24 }, (_, i) => {
                            const hour = i;
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const hour12 = hour % 12 || 12;
                            const display = `${hour12}:00 ${ampm}`;
                            const value = `${String(hour).padStart(2, '0')}:00`;
                            return <option key={value} value={value}>{display}</option>
                        })}
                    </select>
                </div>
            </div>

            {/* Charges */}
            <div className="bg-gray-50 p-5 rounded-xl space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                    <span>Base Fee</span>
                    <span>₹{charges?.baseServiceFee || service?.price}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>Travel ({charges?.distance?.toFixed(1) || '0'} km)</span>
                    <span>₹{charges?.travelCharges || 0}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>GST ({charges?.gstPercentage || 18}%)</span>
                    <span>₹{charges?.gst || 0}</span>
                </div>
                <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between font-bold text-gray-900 text-base">
                    <span>Total Estimate</span>
                    <span>₹{charges?.totalAmount?.toFixed(2) || 'Calculating...'}</span>
                </div>
                <div className="bg-blue-100 p-2 rounded text-blue-800 text-xs font-medium text-center">
                    Advance Payable: ₹{charges?.advanceAmount?.toFixed(2) || '0.00'}
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-3 z-40 md:relative md:bg-transparent md:border-0 md:p-0">
                <button onClick={onBack} className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Back</button>
                <button
                    onClick={handlePay}
                    disabled={!charges || loading}
                    className="flex-1 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? <div className="spinner-border w-4 h-4 rounded-full border-2 border-white"></div> : <><IoCashOutline /> Pay Advance</>}
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
    const [step, setStep] = useState(1);

    // Initial state from navigation
    const [service, setService] = useState(null);
    const [vendor, setVendor] = useState(null);

    const [formState, setFormState] = useState({
        category: "", // purpose
        details: null,
        location: null
    });

    const [showTerms, setShowTerms] = useState(false);

    useEffect(() => {
        if (location.state?.service && location.state?.vendor) {
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
                purposeExtent: formState.details.purposeExtent,
                existingBorewell: formState.details.existingBorewell?.hasExisting ? formState.details.existingBorewell : null,
                techniqueUsed: formState.details.techniqueUsed,
                techniqueProviderName: formState.details.techniqueProviderName,
                notes: formState.details.notes
            };

            const response = await createBooking(bookingPayload);

            if (response.success) {
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
                <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="p-2 -ml-2 text-gray-600">
                    <IoArrowBack className="text-xl" />
                </button>
                <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    ))}
                </div>
            </div>

            <div className="max-w-md mx-auto min-h-[60vh] flex flex-col">
                {step === 1 && <PurposeSelection onSelect={handlePurposeSelect} />}
                {step === 2 && <ProjectDetailsForm data={formState.details} onSubmit={handleDetailsSubmit} onBack={() => setStep(1)} />}
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
