import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoLocationOutline, IoCloseOutline, IoCheckmarkOutline, IoTrashOutline, IoImageOutline } from "react-icons/io5";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import { sendVendorRegistrationOTP } from "../../../services/vendorAuthApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import PlaceAutocompleteInput from "../../../components/PlaceAutocompleteInput";
import CustomDropdown from "../../shared/components/CustomDropdown";
import logo from "@/assets/AppLogo.png";

// Get API key at module level
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const MACHINE_OPTIONS = [
    'Dowsing Rods',
    '3D Locator',
    'PQWT',
    'ADMT',
    'Resistivity Meter'
];

export default function VendorSignup() {
    // Custom snappy animation styles
    const animationStyles = (
        <style>{`
            @keyframes snappy-slide-in {
                0% { opacity: 0; transform: translateX(15px); }
                100% { opacity: 1; transform: translateX(0); }
            }
            .tab-snappy {
                animation: snappy-slide-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .stable-tab-container {
                min-height: 480px;
                transition: min-height 0.3s ease;
            }
        `}</style>
    );

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [registrationStep, setRegistrationStep] = useState(1); // 1: form, 2: OTP
    const [activeTab, setActiveTab] = useState("basic"); // basic, qualification, training, kyc, address
    const [verificationToken, setVerificationToken] = useState("");
    const [otpCountdown, setOtpCountdown] = useState(0);
    const [loading, setLoading] = useState(false);
    const [mapsLoaded, setMapsLoaded] = useState(false);
    const [fullAddress, setFullAddress] = useState("");
    const [gettingLocation, setGettingLocation] = useState(false);

    // Machine Multi-select State
    const machineDropdownRef = useRef(null);
    const [isMachineDropdownOpen, setIsMachineDropdownOpen] = useState(false);
    const [selectedMachines, setSelectedMachines] = useState([]);
    const [customMachine, setCustomMachine] = useState("");
    // Service Image Previews
    const [serviceImagePreviews, setServiceImagePreviews] = useState([]);

    const navigate = useNavigate();
    const { register } = useVendorAuth();
    const toast = useToast();

    // Check if Google Maps is loaded
    useEffect(() => {
        const checkMapsLoaded = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
                setMapsLoaded(true);
                return true;
            }
            return false;
        };

        // Check if already loaded
        if (checkMapsLoaded()) {
            return;
        }

        // Load Google Maps API if not loaded
        if (!GOOGLE_MAPS_API_KEY) {
            // API key not set - fields will still show but without autocomplete
            // User can still use "Use Current Location" button and type manually
            return;
        }

        // Check if script already exists
        const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);

        if (existingScript) {
            // Script exists, poll until loaded
            const pollInterval = setInterval(() => {
                if (checkMapsLoaded()) {
                    clearInterval(pollInterval);
                }
            }, 200);

            // Stop polling after 10 seconds
            setTimeout(() => {
                clearInterval(pollInterval);
            }, 10000);

            // Also listen for load event
            existingScript.addEventListener('load', () => {
                setTimeout(() => {
                    checkMapsLoaded();
                }, 500);
            });
        } else {
            // Create new script
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);

            script.onload = () => {
                // Poll until places library is ready
                const pollInterval = setInterval(() => {
                    if (checkMapsLoaded()) {
                        clearInterval(pollInterval);
                    }
                }, 200);

                // Stop polling after 5 seconds
                setTimeout(() => {
                    clearInterval(pollInterval);
                }, 5000);
            };

            script.onerror = () => {
                // Failed to load Google Maps API
            };
        }
    }, []);

    useEffect(() => {
        let timer;
        if (otpCountdown > 0) {
            timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [otpCountdown]);

    // Form state
    const [formData, setFormData] = useState({
        // Basic Details
        name: "",
        email: "",
        phone: "",
        bloodGroup: "",
        gender: "",
        designation: "",
        password: "",
        confirmPassword: "",
        profilePicture: null,

        // KYC Details
        aadhaarNo: "",
        panNo: "",
        aadharCard: null,
        panCard: null,

        // Education & Experience
        education: "",
        customEducation: "",
        institution: "",
        // Experience & Registration
        experience: "",
        experienceDetails: "",
        groundwaterRegDetails: null, // New: State groundwater department registration
        trainingCertificates: [], // New: Training/Workshop certificates
        certificates: [], // Degree certificates

        // Service Details
        machineType: "",
        serviceImages: [],
        servicePrice: "", // Global expertise fee

        // Bank Details
        bankName: "",
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        branchName: "",
        cancelledCheque: null,

        // Address - only geoLocation
        address: {}
    });

    // Sync machine selection to form data
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            machineType: selectedMachines.join(', ')
        }));
    }, [selectedMachines]);

    // Handle click outside machine dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (machineDropdownRef.current && !machineDropdownRef.current.contains(event.target)) {
                setIsMachineDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleMachineToggle = (machine) => {
        if (selectedMachines.includes(machine)) {
            setSelectedMachines(prev => prev.filter(m => m !== machine));
        } else {
            setSelectedMachines(prev => [...prev, machine]);
        }
    };

    const handleAddCustomMachine = () => {
        if (customMachine.trim()) {
            const newMachine = customMachine.trim();
            if (!selectedMachines.includes(newMachine)) {
                setSelectedMachines(prev => [...prev, newMachine]);
            }
            setCustomMachine("");
        }
    };

    const handleServiceImageChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);

            // Add new files to formData
            setFormData(prev => ({
                ...prev,
                serviceImages: [...prev.serviceImages, ...files]
            }));

            // Create previews
            const newPreviews = files.map(file => ({
                file,
                preview: URL.createObjectURL(file)
            }));
            setServiceImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeServiceImage = (index) => {
        // Remove from formData
        setFormData(prev => ({
            ...prev,
            serviceImages: prev.serviceImages.filter((_, i) => i !== index)
        }));

        // Remove preview
        setServiceImagePreviews(prev => {
            const newPreviews = [...prev];
            URL.revokeObjectURL(newPreviews[index].preview);
            return newPreviews.filter((_, i) => i !== index);
        });
    };

    // Auto-scroll to top when tab changes to improve UX
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [activeTab]);

    const TABS = [
        { id: "basic", label: "Basic Info", icon: "person" },
        { id: "qualification", label: "Qualification", icon: "school" },
        { id: "training", label: "Training", icon: "workspace_premium" },
        { id: "kyc", label: "KYC & Bank", icon: "badge" },
        { id: "address", label: "Address", icon: "location_on" }
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle place selection from Google Places Autocomplete (for full address)
    const handleFullAddressSelect = (placeData) => {
        if (!placeData) {
            return;
        }

        // Get coordinates from selected place
        const selectedLat = placeData.lat;
        const selectedLng = placeData.lng;
        const selectedPlaceId = placeData.placeId || "";
        const selectedFormattedAddress = placeData.formattedAddress || "";

        // Update form data with selected place information - only geoLocation
        setFormData(prev => ({
            ...prev,
            address: {
                coordinates: (selectedLat && selectedLng) ? {
                    lat: selectedLat,
                    lng: selectedLng
                } : prev.address.coordinates,
                geoLocation: (selectedPlaceId && selectedFormattedAddress) ? {
                    formattedAddress: selectedFormattedAddress,
                    placeId: selectedPlaceId,
                    geocodedAt: new Date()
                } : prev.address.geoLocation
            },
            // Coordinates are already stored in address.coordinates above
            // Store place info for backend
            selectedPlace: {
                placeId: selectedPlaceId,
                formattedAddress: selectedFormattedAddress
            }
        }));

        // Update full address field with formatted address
        if (selectedFormattedAddress) {
            setFullAddress(selectedFormattedAddress);
        }

        toast.showSuccess("Address auto-filled from selected location");
    };

    // Get current location using browser geolocation API
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.showError("Geolocation is not supported by your browser");
            return;
        }

        setGettingLocation(true);
        const loadingToast = toast.showLoading("Getting your location...");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Use module-level API key or try to read dynamically
                const apiKey = GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

                // Always store coordinates first
                let formattedAddress = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;

                // Try to reverse geocode if API key is available
                if (apiKey && apiKey.trim() !== "") {
                    try {
                        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

                        const response = await fetch(geocodeUrl);

                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        const data = await response.json();

                        // Check for API errors
                        if (data.status === 'OK' && data.results && data.results.length > 0) {
                            const result = data.results[0];
                            formattedAddress = result.formatted_address || formattedAddress;
                        } else {
                            // Geocoding failed - provide specific error messages
                            if (data.status === 'REQUEST_DENIED') {
                                toast.showError(
                                    "API key error: Please check your Google Maps API key. " +
                                    "Make sure Geocoding API is enabled in Google Cloud Console."
                                );
                            } else if (data.status === 'OVER_QUERY_LIMIT') {
                                toast.showError("Geocoding API quota exceeded. Please try again later.");
                            } else {
                                toast.showWarning(`Geocoding failed: ${data.error_message || data.status}. Using coordinates only.`);
                            }
                        }
                    } catch (error) {
                        toast.showWarning("Failed to get address from coordinates. Using coordinates only.");
                    }
                } else {
                    toast.showError("Google Maps API key not found! Please check your .env file and restart the dev server.");
                }

                // Update form data with coordinates and geoLocation in address
                setFormData(prev => ({
                    ...prev,
                    address: {
                        coordinates: {
                            lat: lat,
                            lng: lng
                        },
                        geoLocation: formattedAddress && formattedAddress !== `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}` ? {
                            formattedAddress: formattedAddress,
                            placeId: null, // No placeId from reverse geocoding
                            geocodedAt: new Date()
                        } : prev.address.geoLocation
                    }
                }));

                // Update full address field with formatted address
                setFullAddress(formattedAddress);

                toast.dismissToast(loadingToast);

                if (formattedAddress && formattedAddress !== `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`) {
                    toast.showSuccess("Location found! Address auto-filled.");
                } else {
                    toast.showInfo(`Location found (${lat.toFixed(4)}, ${lng.toFixed(4)}). Please search for your address.`);
                }

                setGettingLocation(false);
            },
            (error) => {
                let errorMessage = "Unable to get your location";

                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = "Location permission denied. Please allow location access in your browser settings.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMessage = "Location information unavailable. Please try searching manually.";
                } else if (error.code === error.TIMEOUT) {
                    errorMessage = "Location request timed out. Please try again.";
                }

                toast.dismissToast(loadingToast);
                toast.showError(errorMessage);
                setGettingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const handleFileChange = (field, e) => {
        const file = e.target.files[0];
        if (file) {
            if (field === 'certificates' || field === 'trainingCertificates') {
                setFormData(prev => ({
                    ...prev,
                    [field]: [...prev[field], file]
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    [field]: file
                }));
            }
        }
    };

    const removeMultiFile = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const handleSendOTP = async (e) => {
        e?.preventDefault();
        setLoading(true);

        // Validation
        if (!formData.name || !formData.email || !formData.phone || !formData.password) {
            toast.showError("Please fill in all required fields");
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            toast.showError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.showError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (!formData.bankName || !formData.accountHolderName || !formData.accountNumber || !formData.ifscCode) {
            toast.showError("Please fill in all bank details");
            setLoading(false);
            return;
        }

        if (!formData.experience || isNaN(formData.experience) || parseInt(formData.experience) < 0) {
            toast.showError("Please enter a valid experience (years)");
            setLoading(false);
            return;
        }

        if (!formData.machineType) {
            toast.showError("Please select at least one Machine Type");
            setLoading(false);
            return;
        }

        if (!formData.servicePrice || parseFloat(formData.servicePrice) <= 0) {
            toast.showError("Please enter a valid Service Charge");
            setLoading(false);
            return;
        }

        if (formData.education === 'Other' && !formData.customEducation?.trim()) {
            toast.showError("Please specify your qualification");
            setLoading(false);
            return;
        }

        const loadingToast = toast.showLoading("Sending OTP...");

        try {
            const response = await sendVendorRegistrationOTP({
                name: formData.name,
                email: formData.email,
                phone: formData.phone
            });

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("OTP sent successfully! Please check your email/phone.");
                // Navigate to OTP verification page with registration data
                setTimeout(() => {
                    navigate("/vendor/verify-otp", {
                        state: {
                            registrationData: {
                                name: formData.name,
                                email: formData.email,
                                phone: formData.phone,
                                bloodGroup: formData.bloodGroup,
                                gender: formData.gender,
                                designation: formData.designation,
                                password: formData.password,
                                profilePicture: formData.profilePicture,
                                aadharCard: formData.aadharCard,
                                panCard: formData.panCard,
                                groundwaterRegDetails: formData.groundwaterRegDetails,
                                trainingCertificates: formData.trainingCertificates,
                                certificates: formData.certificates,
                                cancelledCheque: formData.cancelledCheque,
                                accountHolderName: formData.accountHolderName,
                                accountNumber: formData.accountNumber,
                                ifscCode: formData.ifscCode,
                                bankName: formData.bankName,
                                branchName: formData.branchName,
                                education: formData.education === 'Other' ? formData.customEducation : formData.education,
                                institution: formData.institution,
                                experience: formData.experience,
                                experienceDetails: formData.experienceDetails,
                                machineType: formData.machineType,
                                serviceImages: formData.serviceImages,
                                servicePrice: formData.servicePrice,
                                address: {
                                    ...formData.address,
                                    // Coordinates are already in address.coordinates
                                    coordinates: formData.address.coordinates || null
                                },
                                selectedPlace: formData.selectedPlace || null
                            },
                            verificationToken: response.data.token,
                            email: formData.email,
                            otpSent: true
                        }
                    });
                }, 800);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to send OTP");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#F3F7FA] p-4 py-6 overflow-y-auto">
            {animationStyles}
            <div className="w-full max-w-2xl">
                <div className="mt-4 mb-6 flex flex-col items-center">
                    <img
                        src={logo}
                        alt="Jaladhaara Logo"
                        className="h-32 object-contain mb-4"
                    />
                    <p className="mt-1 text-sm text-[#6B7280] text-center">
                        Create your vendor account to get started.
                    </p>
                </div>

                <main className="w-full rounded-2xl bg-white p-0 shadow-xl overflow-hidden border border-gray-100">
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-gray-100 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-[#26D7C4] transition-all duration-500 ease-out"
                            style={{ width: `${((TABS.findIndex(t => t.id === activeTab) + 1) / TABS.length) * 100}%` }}
                        />
                    </div>

                    <form className="p-6 sm:p-8" onSubmit={handleSendOTP}>
                        {/* Modern Step Indicator */}
                        <div className="flex justify-between items-center mb-8 px-2 relative">
                            {/* Connector Line behind steps */}
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>

                            {TABS.map((tab, index) => {
                                const isCompleted = TABS.findIndex(t => t.id === activeTab) > index;
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className="relative z-10 flex flex-col items-center group"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
                                            ? "bg-[#1A80E5] text-white shadow-lg scale-110 shadow-blue-200"
                                            : isCompleted
                                                ? "bg-emerald-500 text-white"
                                                : "bg-white border-2 border-gray-200 text-gray-400 group-hover:border-blue-300 group-hover:text-blue-400"
                                            }`}>
                                            <span className="material-symbols-outlined !text-xl font-bold">
                                                {isCompleted ? "check" : tab.icon}
                                            </span>
                                        </div>
                                        <span className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-300 hidden sm:block ${isActive ? "text-[#1A80E5]" : "text-gray-400"
                                            }`}>
                                            {tab.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Stable Tab Content Container */}
                        <div className="stable-tab-container relative pt-4 overflow-x-hidden">

                            {/* Step 1: Basic Info */}
                            {activeTab === "basic" && (
                                <div className="tab-snappy space-y-4">
                                    <h3 className="text-base font-bold text-[#3A3A3A] mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-500">contact_page</span>
                                        Basic Information
                                    </h3>
                                    <ProfileImageUpload
                                        file={formData.profilePicture}
                                        onChange={(e) => handleFileChange('profilePicture', e)}
                                    />
                                    <InputBox
                                        label="Full Name *"
                                        name="name"
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                    />
                                    <InputBox
                                        label="Email *"
                                        name="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                    />
                                    <InputBox
                                        label="Mobile *"
                                        name="phone"
                                        type="tel"
                                        placeholder="Enter your mobile number"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                    />
                                    <SelectBox
                                        label="Gender *"
                                        name="gender"
                                        options={[
                                            { value: "", label: "Select Gender" },
                                            { value: "Male", label: "Male" },
                                            { value: "Female", label: "Female" },
                                            { value: "Other", label: "Other" }
                                        ]}
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                        icon="person"
                                    />
                                    <SelectBox
                                        label="Blood Group *"
                                        name="bloodGroup"
                                        options={[
                                            { value: "", label: "Select Blood Group" },
                                            { value: "A+", label: "A+" },
                                            { value: "A-", label: "A-" },
                                            { value: "B+", label: "B+" },
                                            { value: "B-", label: "B-" },
                                            { value: "AB+", label: "AB+" },
                                            { value: "AB-", label: "AB-" },
                                            { value: "O+", label: "O+" },
                                            { value: "O-", label: "O-" }
                                        ]}
                                        value={formData.bloodGroup}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                        icon="bloodtype"
                                    />
                                    <SelectBox
                                        label="Designation *"
                                        name="designation"
                                        options={[
                                            { value: "", label: "Select Designation" },
                                            { value: "Hydrogeologist", label: "Hydrogeologist" },
                                            { value: "Geophysicist", label: "Geophysicist" },
                                            { value: "Earth Scientist", label: "Earth Scientist" },
                                            { value: "Detector", label: "Detector" },
                                            { value: "Devinor", label: "Devinor" }
                                        ]}
                                        value={formData.designation}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                        icon="badge"
                                    />
                                    <PasswordBox
                                        label="Password *"
                                        name="password"
                                        placeholder="Create password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        show={showPassword}
                                        toggle={() => setShowPassword(!showPassword)}
                                        disabled={loading}
                                    />
                                    <PasswordBox
                                        label="Confirm Password *"
                                        name="confirmPassword"
                                        placeholder="Re-enter password"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        show={showConfirmPassword}
                                        toggle={() => setShowConfirmPassword(!showConfirmPassword)}
                                        disabled={loading}
                                    />
                                    <div className="pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("qualification")}
                                            className="w-full bg-[#1A80E5] text-white py-3 rounded-full font-bold shadow-md hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            Next: Qualification & Experience
                                            <span className="material-symbols-outlined">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Qualification & Experience */}
                            {activeTab === "qualification" && (
                                <div className="tab-snappy space-y-4">
                                    <h3 className="text-base font-bold text-[#3A3A3A] mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-500">school</span>
                                        Qualification & Experience
                                    </h3>

                                    <SelectBox
                                        label="Qualification *"
                                        name="education"
                                        options={[
                                            { value: "", label: "Select Qualification" },
                                            { value: "MSc in Geophysics", label: "MSc in Geophysics" },
                                            { value: "MSc in Geology", label: "MSc in Geology" },
                                            { value: "MSc in Earth Sciences", label: "MSc in Earth Sciences" },
                                            { value: "Other", label: "Other" }
                                        ]}
                                        value={formData.education}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                    />

                                    {formData.education === "Other" && (
                                        <InputBox
                                            label="Specify Qualification *"
                                            name="customEducation"
                                            type="text"
                                            placeholder="Enter your qualification"
                                            value={formData.customEducation}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        />
                                    )}

                                    <InputBox
                                        label="Institution Name *"
                                        name="institution"
                                        type="text"
                                        placeholder="Enter institution name"
                                        value={formData.institution}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                    />

                                    <div className="mb-3">
                                        <label className="block text-xs font-medium text-[#6B7280] mb-1">
                                            Experience (Years) *
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="relative w-24 shrink-0">
                                                <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 text-lg">
                                                    calendar_today
                                                </span>
                                                <input
                                                    type="number"
                                                    name="experience"
                                                    placeholder="Yrs"
                                                    value={formData.experience}
                                                    onChange={handleInputChange}
                                                    min="0"
                                                    className="w-full rounded-2xl border-gray-200 bg-white py-2.5 pl-10 pr-3 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5] text-sm"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="relative flex-1">
                                                <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 text-lg">
                                                    description
                                                </span>
                                                <input
                                                    type="text"
                                                    name="experienceDetails"
                                                    placeholder="Recent project or specialization (optional)"
                                                    value={formData.experienceDetails}
                                                    onChange={handleInputChange}
                                                    className="w-full rounded-2xl border-gray-200 bg-white py-2.5 pl-12 pr-4 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5] text-sm"
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <MultiFileBox
                                        label="Degree Certificates *"
                                        files={formData.certificates}
                                        onChange={(e) => handleFileChange('certificates', e)}
                                        onRemove={(idx) => removeMultiFile('certificates', idx)}
                                        disabled={loading}
                                    />

                                    <div className="grid grid-cols-2 gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("basic")}
                                            className="bg-gray-100 text-gray-600 py-3 rounded-full font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined">arrow_back</span>
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("training")}
                                            className="bg-[#1A80E5] text-white py-3 rounded-full font-bold shadow-md hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            Next: Training
                                            <span className="material-symbols-outlined">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Training & Registration */}
                            {activeTab === "training" && (
                                <div className="tab-snappy space-y-4">
                                    <h3 className="text-base font-bold text-[#3A3A3A] mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-500">workspace_premium</span>
                                        Training & Registration
                                    </h3>

                                    <FileBox
                                        label="Groundwater Dept. Registration / ID Card"
                                        onChange={(e) => handleFileChange('groundwaterRegDetails', e)}
                                        file={formData.groundwaterRegDetails}
                                        disabled={loading}
                                    />

                                    <MultiFileBox
                                        label="Training / Workshop Certificates"
                                        files={formData.trainingCertificates}
                                        onChange={(e) => handleFileChange('trainingCertificates', e)}
                                        onRemove={(idx) => removeMultiFile('trainingCertificates', idx)}
                                        disabled={loading}
                                    />

                                    {/* Setup Your Service Section */}
                                    <div className="mt-6 pt-5 border-t border-gray-100">
                                        <h3 className="text-base font-bold text-[#3A3A3A] mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-blue-500">settings_account_box</span>
                                            Setup Your Service
                                        </h3>

                                        {/* Service Name - Fixed Display */}
                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3 mb-6">
                                            <span className="material-symbols-outlined text-[#0A84FF]">water_drop</span>
                                            <div>
                                                <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider">
                                                    Service Name
                                                </label>
                                                <p className="text-lg font-bold text-[#3A3A3A]">
                                                    Ground Water Detection
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            {/* Machine Type Multi-Select */}
                                            <div className="relative" ref={machineDropdownRef}>
                                                <label className="mb-2 block text-sm font-medium text-[#6B7280]">
                                                    Machine Type *
                                                </label>

                                                {/* Dropdown Trigger */}
                                                <div
                                                    onClick={() => !loading && setIsMachineDropdownOpen(!isMachineDropdownOpen)}
                                                    className={`w-full min-h-[46px] rounded-xl border-gray-200 bg-[#F3F7FA] p-2 text-sm font-medium text-[#3A3A3A] transition focus:border-[#0A84FF] focus:outline-none focus:ring-0 focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)] flex items-center justify-between cursor-pointer border hover:border-gray-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedMachines.length > 0 ? (
                                                            selectedMachines.map(machine => (
                                                                <span key={machine} className="bg-white border border-gray-200 text-[#0A84FF] px-2 py-1 rounded-md text-xs flex items-center gap-1">
                                                                    {machine}
                                                                    <IoCloseOutline
                                                                        className="cursor-pointer hover:text-red-500"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (!loading) handleMachineToggle(machine);
                                                                        }}
                                                                    />
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-400 px-1">Select Machines</span>
                                                        )}
                                                    </div>
                                                    <span className="material-symbols-outlined text-xl text-gray-500 px-1">expand_more</span>
                                                </div>

                                                {/* Dropdown Menu */}
                                                {isMachineDropdownOpen && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto p-2">
                                                        {MACHINE_OPTIONS.map((option) => (
                                                            <div
                                                                key={option}
                                                                onClick={() => handleMachineToggle(option)}
                                                                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                                                            >
                                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedMachines.includes(option) ? 'bg-[#0A84FF] border-[#0A84FF]' : 'border-gray-300'}`}>
                                                                    {selectedMachines.includes(option) && <IoCheckmarkOutline className="text-white text-sm" />}
                                                                </div>
                                                                <span className="text-sm text-[#3A3A3A] font-medium">{option}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Add Custom Machine Input */}
                                                <div className="mt-3 flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={customMachine}
                                                        onChange={(e) => setCustomMachine(e.target.value)}
                                                        placeholder="Add other machine type..."
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddCustomMachine();
                                                            }
                                                        }}
                                                        disabled={loading}
                                                        className="flex-1 rounded-xl border-gray-200 bg-[#F3F7FA] p-3 text-sm font-medium text-[#3A3A3A] transition focus:border-[#0A84FF] focus:outline-none focus:ring-0 focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleAddCustomMachine}
                                                        disabled={loading || !customMachine.trim()}
                                                        className="bg-[#0A84FF] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#005BBB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Service Charge */}
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-[#6B7280]">
                                                    Service Charge (₹) *
                                                </label>
                                                <div className="relative">
                                                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                                    <input
                                                        type="number"
                                                        name="servicePrice"
                                                        value={formData.servicePrice}
                                                        onChange={handleInputChange}
                                                        placeholder="0.00"
                                                        min="0"
                                                        step="0.01"
                                                        disabled={loading}
                                                        className="w-full rounded-xl border-gray-200 bg-[#F3F7FA] p-3 pl-8 text-sm font-bold text-[#3A3A3A] transition focus:border-[#0A84FF] focus:outline-none focus:ring-0 focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Service Images */}
                                        <div className="mb-4">
                                            <label className="text-sm font-semibold text-[#4A4A4A] mb-3 block">
                                                Service Images
                                            </label>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {serviceImagePreviews.map((item, index) => (
                                                    <div key={index} className="relative group rounded-xl overflow-hidden aspect-square shadow-sm border border-gray-100">
                                                        <img
                                                            src={item.preview}
                                                            alt={`Preview ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeServiceImage(index)}
                                                                className="bg-white/20 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                                                            >
                                                                <IoTrashOutline className="text-lg" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                <label className={`flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-[#D9DDE4] rounded-xl cursor-pointer hover:border-[#0A84FF] hover:bg-blue-50/50 transition-all group ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mb-2 group-hover:bg-[#0A84FF] transition-colors">
                                                        <IoImageOutline className="text-lg text-[#0A84FF] group-hover:text-white transition-colors" />
                                                    </div>
                                                    <p className="text-xs font-medium text-gray-500 group-hover:text-[#0A84FF]">Add Image</p>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={handleServiceImageChange}
                                                        disabled={loading}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>



                                    <div className="grid grid-cols-2 gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("qualification")}
                                            className="bg-gray-100 text-gray-600 py-3 rounded-full font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined">arrow_back</span>
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("kyc")}
                                            className="bg-[#1A80E5] text-white py-3 rounded-full font-bold shadow-md hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            Next: KYC
                                            <span className="material-symbols-outlined">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: KYC & Bank */}
                            {activeTab === "kyc" && (
                                <div className="tab-snappy space-y-4">
                                    <h3 className="text-base font-bold text-[#3A3A3A] mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-500">badge</span>
                                        KYC & Bank Details
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <FileBox
                                            label="Aadhar Card Image (JPG/PDF) *"
                                            onChange={(e) => handleFileChange('aadharCard', e)}
                                            file={formData.aadharCard}
                                            disabled={loading}
                                        />
                                        <FileBox
                                            label="PAN Card Image (JPG/PDF) *"
                                            onChange={(e) => handleFileChange('panCard', e)}
                                            file={formData.panCard}
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Bank Account Information</p>
                                        <InputBox
                                            label="Account Holder Name *"
                                            name="accountHolderName"
                                            type="text"
                                            placeholder="As per bank records"
                                            value={formData.accountHolderName}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                                            <InputBox
                                                label="Bank Name *"
                                                name="bankName"
                                                type="text"
                                                placeholder="SBI, HDFC, etc."
                                                value={formData.bankName}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                            />
                                            <InputBox
                                                label="IFSC Code *"
                                                name="ifscCode"
                                                type="text"
                                                placeholder="SBIN0012345"
                                                value={formData.ifscCode}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                            />
                                        </div>
                                        <InputBox
                                            label="Account Number *"
                                            name="accountNumber"
                                            type="text"
                                            placeholder="Enter full account number"
                                            value={formData.accountNumber}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        />
                                        <FileBox
                                            label="Cancelled Cheque Image"
                                            onChange={(e) => handleFileChange('cancelledCheque', e)}
                                            file={formData.cancelledCheque}
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("training")}
                                            className="bg-gray-100 text-gray-600 py-3 rounded-full font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined">arrow_back</span>
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("address")}
                                            className="bg-[#1A80E5] text-white py-3 rounded-full font-bold shadow-md hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            Next: Address
                                            <span className="material-symbols-outlined">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Address */}
                            {activeTab === "address" && (
                                <div className="tab-snappy space-y-4">
                                    <h3 className="text-base font-bold text-[#3A3A3A] mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-500">location_on</span>
                                        Service Area Address
                                    </h3>

                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                                        <label className="block text-xs font-bold text-blue-700 mb-2 px-1">
                                            Search Service Center Location *
                                        </label>
                                        <div className="flex flex-col gap-2">
                                            <div className="relative">
                                                <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-blue-400 text-lg z-10">
                                                    search
                                                </span>
                                                <PlaceAutocompleteInput
                                                    onPlaceSelect={handleFullAddressSelect}
                                                    placeholder="Enter colony, street or landmark..."
                                                    value={fullAddress}
                                                    onChange={(e) => setFullAddress(e.target.value)}
                                                    disabled={loading || gettingLocation}
                                                    className="w-full rounded-2xl border-blue-100 bg-white py-3 pl-12 pr-4 text-[#3A3A3A] shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                                    countryRestriction="in"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={getCurrentLocation}
                                                disabled={loading || gettingLocation}
                                                className="flex items-center justify-center gap-2 bg-white text-blue-600 border border-blue-200 px-4 py-3 rounded-2xl text-sm font-bold hover:bg-blue-50 transition-all shadow-sm"
                                            >
                                                <IoLocationOutline className="text-xl" />
                                                {gettingLocation ? "Locating..." : "Pin to My Current GPS"}
                                            </button>
                                        </div>
                                    </div>

                                    {formData.address?.geoLocation?.formattedAddress && (
                                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                                            <span className="material-symbols-outlined text-emerald-500 text-lg mt-0.5">check_circle</span>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-tighter">Verified Address</p>
                                                <p className="text-sm text-emerald-800 font-medium">{formData.address.geoLocation.formattedAddress}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-3 pt-6">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-full text-base font-bold shadow-xl shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? "Registering Account..." : "Complete Registration"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("kyc")}
                                            className="w-full text-gray-400 py-2 text-sm font-medium hover:text-gray-600"
                                        >
                                            Back to KYC
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                </main>

                <div className="mt-6 mb-4 text-center">
                    <p className="text-sm text-[#6B7280]">
                        Already Registered?{" "}
                        <Link
                            to="/vendorlogin"
                            className="font-semibold text-[#1A80E5] hover:text-blue-700"
                        >
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

/* -------------------- REUSABLE COMPONENTS -------------------- */

function ProfileImageUpload({ file, onChange }) {
    const [imagePreview, setImagePreview] = useState(null);

    const handleImageChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
            onChange(e);
        }
    };

    return (
        <div className="mb-6 flex justify-center">
            <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-md overflow-hidden">
                    {imagePreview || (file && URL.createObjectURL(file)) ? (
                        <img
                            src={imagePreview || URL.createObjectURL(file)}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="text-3xl text-gray-400">👤</span>
                        </div>
                    )}
                </div>
                <label className="absolute bottom-0 right-0 bg-[#0A84FF] text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-[#005BBB] transition-colors">
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                </label>
            </div>
        </div>
    );
}

function InputBox({ label, name, type, placeholder, value, onChange, disabled, icon }) {
    const getIcon = () => {
        if (icon) return icon;
        if (name === "name") return "person";
        if (name === "email") return "mail";
        if (name === "phone") return "phone";
        if (name.includes("address")) return "home";
        if (name.includes("bank") || name.includes("account") || name.includes("ifsc")) return "account_balance";
        return "edit";
    };

    return (
        <div className="mb-3">
            <label className="block text-xs font-medium text-[#6B7280] mb-1">
                {label}
            </label>
            <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 text-lg">
                    {getIcon()}
                </span>
                <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className="w-full rounded-full border-gray-200 bg-white py-2.5 pl-12 pr-4 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5] text-sm"
                    disabled={disabled}
                />
            </div>
        </div>
    );
}

function PasswordBox({ label, name, placeholder, value, onChange, show, toggle, disabled }) {
    return (
        <div className="mb-3">
            <label className="block text-xs font-medium text-[#6B7280] mb-1">
                {label}
            </label>
            <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 text-lg">
                    lock
                </span>
                <input
                    type={show ? "text" : "password"}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className="w-full rounded-full border-gray-200 bg-white py-2.5 pl-12 pr-12 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5] text-sm"
                    disabled={disabled}
                />
                <button
                    type="button"
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={toggle}
                    disabled={disabled}
                >
                    <span className="material-symbols-outlined text-xl">
                        {show ? "visibility_off" : "visibility"}
                    </span>
                </button>
            </div>
        </div>
    );
}

function FileBox({ label, onChange, file, disabled }) {
    return (
        <div className="mb-3">
            <label className="block text-xs font-medium text-[#6B7280] mb-1">
                {label}
            </label>
            <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 text-lg">
                    upload_file
                </span>
                {file && (
                    <p className="text-xs text-green-600 mb-2 pl-12">
                        ✓ {file.name}
                    </p>
                )}
                <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={onChange}
                    className="w-full rounded-full border-gray-200 bg-white py-2.5 pl-12 pr-4 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5] text-sm"
                    disabled={disabled}
                />
            </div>
        </div>
    );
}

function SelectBox({ label, name, options, value, onChange, disabled, icon }) {
    return (
        <div className="mb-3">
            <CustomDropdown
                label={label}
                name={name}
                options={options}
                value={value}
                onChange={onChange}
                disabled={disabled}
                placeholder={`Select ${label.replace('*', '').trim()}`}
            />
        </div>
    );
}

function MultiFileBox({ label, files, onChange, onRemove, disabled }) {
    return (
        <div className="mb-3">
            <label className="block text-xs font-medium text-[#6B7280] mb-1">
                {label}
            </label>
            <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 text-lg">
                    upload_file
                </span>
                {files && files.length > 0 && (
                    <div className="mb-2 space-y-1 pl-12">
                        {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                                <span className="text-gray-600">{file.name}</span>
                                <button
                                    type="button"
                                    onClick={() => onRemove(index)}
                                    className="text-red-600 hover:text-red-800"
                                    disabled={disabled}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <input
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    onChange={onChange}
                    className="w-full rounded-full border-gray-200 bg-white py-2.5 pl-12 pr-4 text-[#3A3A3A] shadow-sm focus:border-[#1A80E5] focus:ring-[#1A80E5] text-sm"
                    disabled={disabled}
                />
                <p className="text-xs text-gray-500 mt-1 pl-12">
                    You can select multiple files
                </p>
            </div>
        </div>
    );
}

function TextAreaBox({ label, name, placeholder, value, onChange, disabled }) {
    return (
        <div className="mb-4">
            <div className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <p className="text-[14px] font-semibold text-[#4A4A4A] mb-1">
                    {label}
                </p>
                <textarea
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className="w-full text-[14px] text-gray-600 focus:outline-none"
                    rows="3"
                    disabled={disabled}
                ></textarea>
            </div>
        </div>
    );
}

