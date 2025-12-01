import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    IoImageOutline,
    IoCalendarOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoCloseOutline,
    IoChevronBackOutline,
    IoChevronDownOutline,
} from "react-icons/io5";
import { createBooking, calculateBookingCharges } from "../../../services/bookingApi";
import PageContainer from "../../shared/components/PageContainer";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import PlaceAutocompleteInput from "../../../components/PlaceAutocompleteInput";

// Get API key at module level
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export default function UserRequestService() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [service, setService] = useState(null);
    const [vendor, setVendor] = useState(null);
    const toast = useToast();
    const [fullAddress, setFullAddress] = useState("");
    const [gettingLocation, setGettingLocation] = useState(false);
    const [chargesBreakdown, setChargesBreakdown] = useState(null);
    const [calculatingCharges, setCalculatingCharges] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null); // 'purpose', 'technique', or 'time'
    const [formData, setFormData] = useState({
        scheduledDate: "",
        scheduledTime: "",
        address: {
            coordinates: null,
            geoLocation: null
        },
        notes: "",
        images: [],
        // Customer Enquiry Form fields
        village: "",
        mandal: "",
        district: "",
        state: "",
        purpose: "", // Agriculture, Industrial/Commercial, Domestic/Household, Open plots
        purposeExtent: "", // Extent value
        existingBorewell: {
            hasExisting: false,
            yearOfDrilling: "",
            depthInFeet: "",
            gapsAndDepths: "", // Number of gaps and depths
            waterQuantity: "", // In inches
            surroundingBorewellDistance: ""
        },
        techniqueUsed: "", // Coconut, Dowsing L rods, 3D Locator, Detector/Diviner, Geophysical survey
        techniqueProviderName: "" // Name of Individual/Company/Organization
    });

    useEffect(() => {
        // Get service and vendor from navigation state
        if (location.state?.service && location.state?.vendor) {
            setService(location.state.service);
            setVendor(location.state.vendor);
        } else {
            // If no service/vendor selected, redirect back
            navigate("/user/serviceprovider");
        }
    }, [location, navigate]);

    // Calculate charges when address coordinates change
    useEffect(() => {
        const calculateCharges = async () => {
            // Get service ID - handle both _id and id formats
            const serviceId = service?._id || service?.id;
            const vendorId = vendor?._id || vendor?.id;
            
            // Check if we have all required data
            if (!serviceId || !vendorId) {
                setChargesBreakdown(null);
                return;
            }

            const lat = formData.address.coordinates?.lat;
            const lng = formData.address.coordinates?.lng;
            
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                setChargesBreakdown(null);
                return;
            }

            setCalculatingCharges(true);
            try {
                const response = await calculateBookingCharges(
                    serviceId,
                    vendorId,
                    lat,
                    lng
                );
                
                if (response && response.success && response.data) {
                    setChargesBreakdown(response.data);
                } else {
                    // Show base service fee at least
                    setChargesBreakdown({
                        baseServiceFee: service.price,
                        distance: null,
                        travelCharges: 0,
                        subtotal: service.price,
                        gst: 0,
                        totalAmount: service.price,
                        advanceAmount: service.price * 0.4,
                        remainingAmount: service.price * 0.6,
                        baseRadius: 30,
                        travelChargePerKm: 10,
                        gstPercentage: 18
                    });
                }
            } catch (err) {
                // Show base service fee at least on error
                setChargesBreakdown({
                    baseServiceFee: service.price,
                    distance: null,
                    travelCharges: 0,
                    subtotal: service.price,
                    gst: 0,
                    totalAmount: service.price,
                    advanceAmount: service.price * 0.4,
                    remainingAmount: service.price * 0.6,
                    baseRadius: 30,
                    travelChargePerKm: 10,
                    gstPercentage: 18
                });
            } finally {
                setCalculatingCharges(false);
            }
        };

        // Add a small delay to ensure coordinates are set
        const timeoutId = setTimeout(() => {
            calculateCharges();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [service, vendor, formData.address.coordinates?.lat, formData.address.coordinates?.lng]);

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

    // Handle place selection from Google Places Autocomplete
    const handleAddressSelect = (placeData) => {
        const selectedFormattedAddress = placeData.formattedAddress || placeData.formatted_address || "";
        const selectedPlaceId = placeData.placeId || placeData.place_id || "";
        // Handle both direct lat/lng and nested place.geometry.location
        let selectedLat = placeData.lat;
        let selectedLng = placeData.lng;
        
        // If lat/lng not directly available, try to get from place.geometry.location
        if (!selectedLat && placeData.place?.geometry?.location) {
            if (typeof placeData.place.geometry.location.lat === 'function') {
                selectedLat = placeData.place.geometry.location.lat();
                selectedLng = placeData.place.geometry.location.lng();
            } else {
                selectedLat = placeData.place.geometry.location.lat;
                selectedLng = placeData.place.geometry.location.lng;
            }
        }
        
        // Store in registration format
        setFormData(prev => ({
            ...prev,
            address: {
                coordinates: (selectedLat && selectedLng) ? {
                    lat: parseFloat(selectedLat),
                    lng: parseFloat(selectedLng)
                } : prev.address.coordinates,
                geoLocation: (selectedPlaceId && selectedFormattedAddress) ? {
                    formattedAddress: selectedFormattedAddress,
                    placeId: selectedPlaceId,
                    geocodedAt: new Date()
                } : prev.address.geoLocation
            }
        }));
        
        setFullAddress(selectedFormattedAddress);
        toast.showSuccess("Address auto-filled from selected location");
    };

    // Get current location using browser geolocation API
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.showError("Geolocation is not supported by your browser");
            return;
        }

        setGettingLocation(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                const apiKey = GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

                let formattedAddress = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;

                // Try to reverse geocode if API key is available
                if (apiKey && apiKey.trim() !== "") {
                    try {
                        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

                        const response = await fetch(geocodeUrl);

                        if (response.ok) {
                            const data = await response.json();

                            if (data.status === 'OK' && data.results && data.results.length > 0) {
                                const result = data.results[0];
                                formattedAddress = result.formatted_address || formattedAddress;
                                
                                // Store in registration format
                                setFormData(prev => ({
                                    ...prev,
                                    address: {
                                        coordinates: {
                                            lat: lat,
                                            lng: lng
                                        },
                                        geoLocation: formattedAddress && formattedAddress !== `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}` ? {
                                            formattedAddress: formattedAddress,
                                            placeId: result.place_id || null,
                                            geocodedAt: new Date()
                                        } : prev.address.geoLocation
                                    }
                                }));
                            }
                        }
                    } catch (error) {
                        // Geocoding error - silently fail
                    }
                } else {
                    // Store coordinates even if geocoding fails
                    setFormData(prev => ({
                        ...prev,
                        address: {
                            coordinates: {
                                lat: lat,
                                lng: lng
                            },
                            geoLocation: prev.address.geoLocation
                        }
                    }));
                }

                setFullAddress(formattedAddress);
                toast.showSuccess("Location found! Address auto-filled.");
                setGettingLocation(false);
            },
            (error) => {
                let errorMessage = "Unable to get your location";
                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = "Location permission denied. Please allow location access in your browser settings.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMessage = "Location information unavailable.";
                } else if (error.code === error.TIMEOUT) {
                    errorMessage = "Location request timed out.";
                }
                toast.showError(errorMessage);
                setGettingLocation(false);
            }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate address
        if (!formData.address.geoLocation?.formattedAddress && !fullAddress) {
            toast.showError("Please select or enter an address");
            return;
        }

        if (!service || !vendor) {
            toast.showError("Service or vendor information is missing");
            return;
        }

        const loadingToast = toast.showLoading("Creating booking...");

        try {
            setLoading(true);

            // Prepare address for backend (convert to old format for compatibility)
            // Backend expects {street, city, state, pincode} but we store {coordinates, geoLocation}
            let addressToSend = formData.address;
            
            // If user manually typed address but didn't select from autocomplete,
            // store fullAddress in geoLocation as fallback
            if (fullAddress && (!addressToSend.geoLocation?.formattedAddress)) {
                addressToSend = {
                    ...addressToSend,
                    geoLocation: {
                        formattedAddress: fullAddress,
                        placeId: null,
                        geocodedAt: new Date()
                    }
                };
            }

            // Parse formattedAddress to extract street, city, state, pincode for backend compatibility
            const formattedAddr = addressToSend.geoLocation?.formattedAddress || fullAddress || "";
            const addressParts = formattedAddr.split(",").map(part => part.trim());
            
            // Try to extract components (simple parsing - backend should handle this better)
            const parsedAddress = {
                street: addressParts[0] || "",
                city: addressParts[1] || "",
                state: addressParts[2] || "",
                pincode: addressParts[addressParts.length - 1] || "",
                coordinates: addressToSend.coordinates,
                landmark: ""
            };

            // Create booking
            const bookingData = {
                serviceId: service._id || service.id,
                vendorId: vendor._id || vendor.id,
                scheduledDate: formData.scheduledDate,
                scheduledTime: formData.scheduledTime,
                address: parsedAddress,
                notes: formData.notes || undefined,
                // Customer Enquiry Form fields
                village: formData.village,
                mandal: formData.mandal,
                district: formData.district,
                state: formData.state,
                purpose: formData.purpose,
                purposeExtent: formData.purposeExtent,
                existingBorewell: formData.existingBorewell.hasExisting ? formData.existingBorewell : null,
                techniqueUsed: formData.techniqueUsed,
                techniqueProviderName: formData.techniqueProviderName || undefined,
            };

            const response = await createBooking(bookingData);

            if (response.success) {
                const booking = response.data.booking;
                const paymentData = response.data.payment;
                const razorpayOrder = response.data.razorpayOrder;

                if (!razorpayOrder) {
                    toast.dismissToast(loadingToast);
                    toast.showError("Payment order not created. Please try again.");
                    setLoading(false);
                    return;
                }

                toast.dismissToast(loadingToast);
                toast.showSuccess("Booking created successfully! Redirecting to payment...");
                setLoading(false);
                
                // Navigate to confirmation page instead of directly opening payment
                setTimeout(() => {
                    navigate("/user/booking/advance-payment/confirmation", {
                        replace: true,
                        state: {
                            booking: booking,
                            service: service,
                            vendor: vendor,
                            paymentData: paymentData,
                            razorpayOrder: razorpayOrder
                        }
                    });
                }, 500);
            } else {
                toast.dismissToast(loadingToast);
                // Check if error is due to existing active booking
                if (response.message && response.message.includes("active booking")) {
                    toast.showError(response.message || "You already have an active booking. Please complete or cancel it first.");
                } else {
                    toast.showError(response.message || "Failed to create booking");
                }
                setLoading(false);
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            const errorMessage = err.response?.data?.message || "Failed to create booking. Please try again.";

            // Check if error is due to existing active booking
            if (errorMessage.includes("active booking") || errorMessage.includes("already have")) {
                toast.showError(errorMessage);
            } else {
                handleApiError(err, "Failed to create booking. Please try again.");
            }
            setLoading(false);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openDropdown && !event.target.closest('.relative')) {
                setOpenDropdown(null);
            }
        };
        if (openDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openDropdown]);

    if (!service || !vendor) {
    return (
            <PageContainer>
                <div className="text-center py-8">
                    <p className="text-gray-600">Loading booking details...</p>
            </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>

            {/* Back Button */}
            <button
                onClick={() => navigate("/user/serviceprovider")}
                className="mb-4 flex items-center gap-2 text-[#0A84FF] hover:text-[#005BBB] transition-colors"
            >
                <IoChevronBackOutline className="text-xl" />
                <span className="font-semibold">Back</span>
            </button>

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    Book Service
                </h1>
                <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] mb-4">
                    <p className="text-sm text-gray-600 mb-1">Service</p>
                    <p className="text-base font-bold text-gray-800">{service.name}</p>
                    <p className="text-lg font-semibold text-[#0A84FF] mt-1">
                        ₹{service.price?.toLocaleString()}
                    </p>
                </div>
                <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1">Vendor</p>
                            <p className="text-base font-bold text-gray-800">{vendor.name}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate("/user/serviceprovider")}
                            className="ml-4 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                        >
                            <IoCloseOutline className="text-lg" />
                            Change Vendor
                        </button>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section: Schedule */}
                <div className="bg-white rounded-[16px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                        Schedule
                    </h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                            <IoCalendarOutline className="inline text-base mr-1" />
                            Date *
                        </label>
                        <input
                            type="date"
                            value={formData.scheduledDate}
                            onChange={(e) =>
                                setFormData({ ...formData, scheduledDate: e.target.value })
                            }
                            required
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                        />
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                            <IoTimeOutline className="inline text-base mr-1" />
                            Time *
                        </label>
                        <button
                            type="button"
                            onClick={() => setOpenDropdown(openDropdown === 'time' ? null : 'time')}
                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)] flex items-center justify-between"
                        >
                            <span className={formData.scheduledTime ? "text-gray-800" : "text-gray-400"}>
                                {formData.scheduledTime 
                                    ? (() => {
                                        const [hours, minutes] = formData.scheduledTime.split(':');
                                        const hour12 = parseInt(hours) % 12 || 12;
                                        const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                                        return `${hour12}:${minutes} ${ampm}`;
                                    })()
                                    : "---"
                                }
                            </span>
                            <IoTimeOutline className="text-gray-400" />
                        </button>
                        {openDropdown === 'time' && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                                {Array.from({ length: 24 }, (_, i) => {
                                    const hour24 = i;
                                    const hour12 = hour24 % 12 || 12;
                                    const ampm = hour24 >= 12 ? 'PM' : 'AM';
                                    const timeValue = `${String(hour24).padStart(2, '0')}:00`;
                                    const displayTime = `${hour12}:00 ${ampm}`;
                                    const isSelected = formData.scheduledTime === timeValue;
                                    
                                    return (
                                        <div
                                            key={timeValue}
                                            className={`px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 transition-colors ${
                                                isSelected ? 'bg-gray-100 text-blue-600 font-medium' : 'text-gray-800'
                                            }`}
                                            onClick={() => {
                                                setFormData({ ...formData, scheduledTime: timeValue });
                                                setOpenDropdown(null);
                                            }}
                                        >
                                            {displayTime}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    </div>
                </div>

                {/* Section: Location */}
                <div className="bg-white rounded-[16px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                        Location Details
                    </h2>
                {/* Address Input */}
                <div>
                    <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                        <IoLocationOutline className="inline text-base mr-1" />
                        Address *
                    </label>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row gap-2 mb-2">
                            <div className="relative flex-1">
                                <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 text-lg z-10">
                                    search
                                </span>
                                <PlaceAutocompleteInput
                                    onPlaceSelect={handleAddressSelect}
                                    placeholder="Start typing your address to see suggestions..."
                                    value={fullAddress}
                                    onChange={(e) => setFullAddress(e.target.value)}
                                    disabled={loading || gettingLocation}
                                    className="w-full rounded-full border-gray-200 bg-white py-2.5 pl-12 pr-4 text-[#3A3A3A] shadow-sm focus:border-[#0A84FF] focus:ring-[#0A84FF] text-sm"
                                    countryRestriction="in"
                                    types={["geocode", "establishment"]}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                disabled={loading || gettingLocation}
                                className="flex items-center justify-center gap-2 bg-[#0A84FF] text-white px-4 py-2.5 rounded-full text-sm font-medium hover:bg-[#005BBB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 whitespace-nowrap"
                                title="Use current location"
                            >
                                <IoLocationOutline className="text-lg" />
                                {gettingLocation ? "Getting..." : "Use Current Location"}
                            </button>
                        </div>
                        <p className="text-xs text-blue-700 mt-1">
                            💡 Type your address above to see suggestions, or click "Use Current Location" to auto-fill from GPS
                        </p>
                    </div>
                    {/* Display selected address */}
                    {formData.address?.geoLocation?.formattedAddress && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-xs font-medium text-green-800 mb-1">✓ Address Selected:</p>
                            <p className="text-sm text-green-700">{formData.address.geoLocation.formattedAddress}</p>
                        </div>
                    )}
                </div>

                    {/* Village / Mandal */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                            Village
                        </label>
                        <input
                            type="text"
                            value={formData.village}
                            onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                            placeholder="Enter village"
                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                            Mandal
                        </label>
                        <input
                            type="text"
                            value={formData.mandal}
                            onChange={(e) => setFormData({ ...formData, mandal: e.target.value })}
                            placeholder="Enter mandal"
                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                        />
                    </div>
                </div>

                {/* District / State */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                            District
                        </label>
                        <input
                            type="text"
                            value={formData.district}
                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                            placeholder="Enter district"
                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                            State
                        </label>
                        <input
                            type="text"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            placeholder="Enter state"
                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                        />
                    </div>
                    </div>
                </div>

                {/* Section: Project Details */}
                <div className="bg-white rounded-[16px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                        Project Details
                    </h2>
                    {/* Purpose of Bore point checking */}
                    <div className="relative">
                    <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                        Purpose of Bore point checking *
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setOpenDropdown(openDropdown === 'purpose' ? null : 'purpose')}
                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)] flex items-center justify-between"
                        >
                            <span className={formData.purpose ? "text-gray-800" : "text-gray-400"}>
                                {formData.purpose || "Select purpose"}
                            </span>
                            <IoChevronDownOutline className={`text-gray-400 transition-transform ${openDropdown === 'purpose' ? 'rotate-180' : ''}`} />
                        </button>
                        {openDropdown === 'purpose' && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                                <div 
                                    className="px-4 py-3 bg-blue-600 text-white text-sm font-medium cursor-pointer"
                                    onClick={() => {
                                        setFormData({ ...formData, purpose: "", purposeExtent: "" });
                                        setOpenDropdown(null);
                                    }}
                                >
                                    Select purpose
                                </div>
                                {["Agriculture", "Industrial/Commercial", "Domestic/Household", "Open plots"].map((option) => (
                                    <div
                                        key={option}
                                        className={`px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 transition-colors ${
                                            formData.purpose === option ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-800'
                                        }`}
                                        onClick={() => {
                                            setFormData({ ...formData, purpose: option, purposeExtent: "" });
                                            setOpenDropdown(null);
                                        }}
                                    >
                                        {option}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {formData.purpose && (
                        <div className="mt-3">
                            <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                                Extent {formData.purpose === "Agriculture" ? "(in acres)" : "(in Sq-Yards)"} *
                            </label>
                            <input
                                type="number"
                                value={formData.purposeExtent}
                                onChange={(e) => setFormData({ ...formData, purposeExtent: e.target.value })}
                                required
                                placeholder={`Enter extent ${formData.purpose === "Agriculture" ? "in acres" : "in Sq-Yards"}`}
                                min="0"
                                step="0.01"
                                className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                            />
                        </div>
                    )}
                    </div>

                    {/* Existing Borewell */}
                    <div className="bg-gray-50 border border-gray-200 rounded-[12px] p-4 mt-4">
                    <label className="flex items-center gap-2 mb-3">
                        <input
                            type="checkbox"
                            checked={formData.existingBorewell.hasExisting}
                            onChange={(e) => setFormData({
                                ...formData,
                                existingBorewell: { ...formData.existingBorewell, hasExisting: e.target.checked }
                            })}
                            className="w-4 h-4 text-[#0A84FF] border-gray-300 rounded focus:ring-[#0A84FF]"
                        />
                        <span className="text-sm font-semibold text-[#4A4A4A]">
                            Any existing borewell running or stopped in the land?
                        </span>
                    </label>
                    {formData.existingBorewell.hasExisting && (
                        <div className="mt-3 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Year of drilling
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.existingBorewell.yearOfDrilling}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            existingBorewell: { ...formData.existingBorewell, yearOfDrilling: e.target.value }
                                        })}
                                        placeholder="e.g., 2020"
                                        min="1900"
                                        max={new Date().getFullYear()}
                                        className="w-full bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Depth (in feet)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.existingBorewell.depthInFeet}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            existingBorewell: { ...formData.existingBorewell, depthInFeet: e.target.value }
                                        })}
                                        placeholder="e.g., 200"
                                        min="0"
                                        className="w-full bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Number of Gaps and depths
                                </label>
                                <input
                                    type="text"
                                    value={formData.existingBorewell.gapsAndDepths}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        existingBorewell: { ...formData.existingBorewell, gapsAndDepths: e.target.value }
                                    })}
                                    placeholder="e.g., 2 gaps at 50ft and 150ft"
                                    className="w-full bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Quantity of water (in inches)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.existingBorewell.waterQuantity}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            existingBorewell: { ...formData.existingBorewell, waterQuantity: e.target.value }
                                        })}
                                        placeholder="e.g., 2"
                                        min="0"
                                        className="w-full bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Distance of surrounding borewells
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.existingBorewell.surroundingBorewellDistance}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            existingBorewell: { ...formData.existingBorewell, surroundingBorewellDistance: e.target.value }
                                        })}
                                        placeholder="e.g., 50 meters"
                                        className="w-full bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    </div>

                    {/* Techniques used to locate a bore point */}
                    <div className="mt-4 relative">
                    <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                        Technique used to locate a bore point *
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setOpenDropdown(openDropdown === 'technique' ? null : 'technique')}
                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)] flex items-center justify-between"
                        >
                            <span className={formData.techniqueUsed ? "text-gray-800" : "text-gray-400"}>
                                {formData.techniqueUsed || "Select technique"}
                            </span>
                            <IoChevronDownOutline className={`text-gray-400 transition-transform ${openDropdown === 'technique' ? 'rotate-180' : ''}`} />
                        </button>
                        {openDropdown === 'technique' && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                                <div 
                                    className="px-4 py-3 bg-blue-600 text-white text-sm font-medium cursor-pointer"
                                    onClick={() => {
                                        setFormData({ ...formData, techniqueUsed: "" });
                                        setOpenDropdown(null);
                                    }}
                                >
                                    Select technique
                                </div>
                                {["Coconut", "Dowsing L rods", "3D Locator", "Detector / Diviner", "Geophysical survey"].map((option) => (
                                    <div
                                        key={option}
                                        className={`px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 transition-colors ${
                                            formData.techniqueUsed === option ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-800'
                                        }`}
                                        onClick={() => {
                                            setFormData({ ...formData, techniqueUsed: option });
                                            setOpenDropdown(null);
                                        }}
                                    >
                                        {option}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {formData.techniqueUsed && (
                        <div className="mt-3">
                            <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                                Name of Individual / Company / Organization
                            </label>
                            <input
                                type="text"
                                value={formData.techniqueProviderName}
                                onChange={(e) => setFormData({ ...formData, techniqueProviderName: e.target.value })}
                                placeholder="Enter name of provider"
                                className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                            />
                        </div>
                    )}
                    </div>
                </div>

                {/* Section: Additional Information */}
                <div className="bg-white rounded-[16px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                        Additional Information
                    </h2>
                {/* Notes */}
                <div>
                    <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                        Additional Notes
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                        }
                        rows="4"
                        placeholder="Any special instructions or requirements..."
                        className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)] resize-none"
                    />
                </div>
                </div>

                {/* Razorpay Test Mode Info */}
                {import.meta.env.VITE_RAZORPAY_KEY_ID && import.meta.env.VITE_RAZORPAY_KEY_ID.startsWith('rzp_test_') && (
                    <div className="bg-blue-50 border border-blue-200 rounded-[12px] p-4 mb-4">
                        <p className="text-sm font-semibold text-blue-800 mb-1">
                            💳 Razorpay Test Mode Active
                        </p>
                        <p className="text-xs text-blue-600">
                            Using Razorpay test environment. Use test card: <strong>4111 1111 1111 1111</strong> (any future expiry, any CVV)
                        </p>
                    </div>
                )}

                {/* Section: Payment Breakdown */}
                {service && (
                    <div className="bg-white rounded-[16px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] border border-gray-100">
                        <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <span className="text-xl">💳</span>
                                Payment Breakdown
                            </h2>
                            {chargesBreakdown && (
                                <span className="text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                                    Calculated
                                </span>
                            )}
                        </div>
                        
                        {calculatingCharges && !chargesBreakdown ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A84FF]"></div>
                                    <p className="text-sm text-gray-600 font-medium">Calculating charges...</p>
                                </div>
                            </div>
                        ) : chargesBreakdown ? (
                            <div className="space-y-3">
                                {/* Base Service Fee */}
                                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">Base Service Fee</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Service charge</p>
                                        </div>
                                        <span className="text-base font-bold text-gray-800">₹{chargesBreakdown.baseServiceFee?.toFixed(2) || service?.price?.toFixed(2) || '0.00'}</span>
                                    </div>
                                </div>

                                {/* Distance & Travel Charges */}
                                {chargesBreakdown.distance !== null && chargesBreakdown.distance !== undefined && (
                                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">Distance</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {chargesBreakdown.distance?.toFixed(2)} km 
                                                    <span className="ml-1">(Base: {chargesBreakdown.baseRadius || 30} km)</span>
                                                </p>
                                            </div>
                                        </div>
                                        {chargesBreakdown.travelCharges > 0 && (
                                            <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700">Travel Charges</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        ₹{chargesBreakdown.travelChargePerKm || 10}/km beyond base radius
                                                    </p>
                                                </div>
                                                <span className="text-base font-bold text-gray-800">₹{chargesBreakdown.travelCharges?.toFixed(2) || '0.00'}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Subtotal */}
                                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-semibold text-gray-700">Subtotal</p>
                                        <span className="text-base font-bold text-gray-800">₹{chargesBreakdown.subtotal?.toFixed(2) || chargesBreakdown.baseServiceFee?.toFixed(2) || '0.00'}</span>
                                    </div>
                                </div>

                                {/* GST */}
                                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">GST</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{chargesBreakdown.gstPercentage || 18}% on subtotal</p>
                                        </div>
                                        <span className="text-base font-bold text-gray-800">₹{chargesBreakdown.gst?.toFixed(2) || '0.00'}</span>
                                    </div>
                                </div>

                                {/* Total Amount - Highlighted without background color */}
                                <div className="bg-white rounded-xl p-5 border-2 border-gray-300 shadow-md">
                                    <div className="flex justify-between items-center">
                                        <p className="text-base font-bold text-gray-800">Total Amount</p>
                                        <span className="text-xl font-bold text-gray-800">₹{chargesBreakdown.totalAmount?.toFixed(2) || '0.00'}</span>
                                    </div>
                                </div>

                                {/* Payment Split */}
                                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                    <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">PAYMENT SCHEDULE</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">Advance Payment</p>
                                                <p className="text-xs text-gray-500">40% of total</p>
                                            </div>
                                            <span className="text-base font-bold text-[#0A84FF]">₹{chargesBreakdown.advanceAmount?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">Remaining Payment</p>
                                                <p className="text-xs text-gray-500">60% of total</p>
                        </div>
                                            <span className="text-base font-bold text-gray-800">₹{chargesBreakdown.remainingAmount?.toFixed(2) || '0.00'}</span>
                        </div>
                        </div>
                    </div>
                </div>
                        ) : (
                            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Base Service Fee</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Service charge</p>
                                    </div>
                                    <span className="text-base font-bold text-gray-800">₹{service?.price?.toLocaleString() || '0'}</span>
                                </div>
                                <div className="pt-3 border-t border-gray-200">
                                    <p className="text-xs text-center text-gray-500 py-2">
                                        {formData.address.coordinates?.lat && formData.address.coordinates?.lng 
                                            ? 'Calculating charges...' 
                                            : '📍 Select an address to calculate travel charges and GST'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Submit Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0A84FF] text-white font-semibold py-4 px-6 rounded-[12px] hover:bg-[#005BBB] active:bg-[#004A9A] transition-colors shadow-[0px_4px_10px_rgba(10,132,255,0.2)] text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Processing..." : "Book & Pay"}
                    </button>
                </div>
            </form>
        </PageContainer>
    );
}
