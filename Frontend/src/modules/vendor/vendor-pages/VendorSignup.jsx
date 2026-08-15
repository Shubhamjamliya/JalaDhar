import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    IoLocationOutline,
    IoCloseOutline,
    IoCheckmarkOutline,
    IoTrashOutline,
    IoImageOutline,
    IoPersonOutline,
    IoMailOutline,
    IoCallOutline,
    IoLockClosedOutline,
    IoEyeOutline,
    IoEyeOffOutline,
    IoSchoolOutline,
    IoBriefcaseOutline,
    IoCardOutline,
    IoCalendarOutline,
    IoDocumentTextOutline,
    IoWaterOutline,
    IoChevronDownOutline,
    IoCheckmarkCircleOutline,
    IoCloudUploadOutline,
    IoCreateOutline,
    IoBusinessOutline,
    IoArrowForwardOutline,
    IoArrowBackOutline,
    IoCashOutline,
    IoSearchOutline,
    IoCameraOutline,
    IoConstructOutline
} from "react-icons/io5";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import { sendVendorRegistrationOTP } from "../../../services/vendorAuthApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import PlaceAutocompleteInput from "../../../components/PlaceAutocompleteInput";
import CustomDropdown from "../../shared/components/CustomDropdown";
import MultipleStatesDropdown from "../../shared/components/MultipleStatesDropdown";
import { getStatesList, getDistrictsList, findStateForDistrict } from "../../../utils/indianStatesDistricts";
import logo from "@/assets/AppLogo.png";

// Get API key at module level
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const MACHINE_OPTIONS = [
    'Resistivity Meter',
    'PQWT',
    'ADMT',
    '3D Locator',
    'Dowsing Rods',
    'Other'
];

const DRAFT_STORAGE_KEY = "jaladhar_vendor_signup_draft";

const getSavedDraft = () => {
    try {
        const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) {
        console.error("Error reading vendor signup draft:", e);
    }
    return null;
};

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

    const navigate = useNavigate();
    const location = useLocation();
    const { register } = useVendorAuth();
    const toast = useToast();

    // Extract initial registration data if coming back from OTP verification to edit
    const initialData = location.state?.registrationData || location.state?.initialData || location.state;
    const savedDraft = getSavedDraft();

    // Helper to determine initial education values
    const STANDARD_EDUCATION_OPTIONS = ["MSc in Geophysics", "MSc in Geology", "MSc in Earth Sciences"];
    const getInitialEducation = () => {
        if (!initialData?.education) return "";
        return STANDARD_EDUCATION_OPTIONS.includes(initialData.education) ? initialData.education : "Other";
    };
    const getInitialCustomEducation = () => {
        if (!initialData?.education) return "";
        return STANDARD_EDUCATION_OPTIONS.includes(initialData.education) ? "" : initialData.education;
    };

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [registrationStep, setRegistrationStep] = useState(1); // 1: form, 2: OTP
    const [activeTab, setActiveTab] = useState(() => {
        return savedDraft?.activeTab || "basic";
    });
    const [verificationToken, setVerificationToken] = useState("");
    const [otpCountdown, setOtpCountdown] = useState(0);
    const [loading, setLoading] = useState(false);
    const [mapsLoaded, setMapsLoaded] = useState(false);
    const [fullAddress, setFullAddress] = useState(() => {
        return savedDraft?.fullAddress || initialData?.selectedPlace?.formattedAddress || initialData?.address?.geoLocation?.formattedAddress || "";
    });
    const [gettingLocation, setGettingLocation] = useState(false);

    // Machine Multi-select State
    const machineDropdownRef = useRef(null);
    const [isMachineDropdownOpen, setIsMachineDropdownOpen] = useState(false);
    const [selectedMachines, setSelectedMachines] = useState(() => {
        if (savedDraft?.selectedMachines && Array.isArray(savedDraft.selectedMachines)) {
            return savedDraft.selectedMachines;
        }
        if (initialData?.machineType) {
            return initialData.machineType.split(', ').map(m => m.trim()).filter(Boolean);
        }
        return [];
    });
    const [customMachine, setCustomMachine] = useState("");
    
    // Service Image Previews
    const [surveyPhotoPreviews, setSurveyPhotoPreviews] = useState(() => {
        if (initialData?.surveyPhotos && Array.isArray(initialData.surveyPhotos)) {
            return initialData.surveyPhotos.map(file => ({
                file,
                preview: file instanceof File || file instanceof Blob ? URL.createObjectURL(file) : (typeof file === 'string' ? file : '')
            })).filter(item => item.preview);
        }
        return [];
    });

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
            return;
        }

        // Check if script already exists
        const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);

        if (existingScript) {
            const pollInterval = setInterval(() => {
                if (checkMapsLoaded()) {
                    clearInterval(pollInterval);
                }
            }, 200);

            setTimeout(() => {
                clearInterval(pollInterval);
            }, 10000);

            existingScript.addEventListener('load', () => {
                setTimeout(() => {
                    checkMapsLoaded();
                }, 500);
            });
        } else {
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);

            script.onload = () => {
                const pollInterval = setInterval(() => {
                    if (checkMapsLoaded()) {
                        clearInterval(pollInterval);
                    }
                }, 200);

                setTimeout(() => {
                    clearInterval(pollInterval);
                }, 5000);
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

    // Cleanup URLs
    useEffect(() => {
        return () => {
            if (formData.profilePicture instanceof File) URL.revokeObjectURL(formData.profilePicture);
            if (formData.aadharCard instanceof File) URL.revokeObjectURL(formData.aadharCard);
            if (formData.panCard instanceof File) URL.revokeObjectURL(formData.panCard);
            surveyPhotoPreviews.forEach(item => URL.revokeObjectURL(item.preview));
        };
    }, []);

    // Form state
    const [formData, setFormData] = useState(() => {
        const d = savedDraft?.formData || {};
        return {
            // Basic Details
            name: initialData?.name || d.name || "",
            email: initialData?.email || d.email || "",
            phone: initialData?.phone || d.phone || "",
            dob: (initialData?.dob || d.dob || "").includes('-') ? (initialData?.dob || d.dob).split('-').reverse().join('/') : (initialData?.dob || d.dob || ""),
            bloodGroup: initialData?.bloodGroup || d.bloodGroup || "",
            gender: initialData?.gender || d.gender || "",
            designation: initialData?.designation || d.designation || "",
            languages: initialData?.languages || d.languages || "",
            password: initialData?.password || d.password || "",
            confirmPassword: initialData?.password || d.confirmPassword || "",
            profilePicture: initialData?.profilePicture || null,

            // KYC Details
            isGstRegistered: initialData?.isGstRegistered || d.isGstRegistered || "",
            gstNumber: initialData?.gstNumber || d.gstNumber || "",
            panNo: initialData?.panNo || d.panNo || "",
            panCard: initialData?.panCard || null,
            aadharCards: initialData?.aadharCards || d.aadharCards || [],

            // Education & Experience
            education: initialData?.education || d.education || "",
            specialization: initialData?.specialization || d.specialization || "",
            institution: initialData?.institution || d.institution || "",
            graduationYear: initialData?.graduationYear || d.graduationYear || "",
            experience: initialData?.experience !== undefined ? initialData.experience : (d.experience !== undefined ? d.experience : ""),
            surveysCompleted: initialData?.surveysCompleted || d.surveysCompleted || "",
            experienceDetails: initialData?.experienceDetails || d.experienceDetails || "",
            degreeCertificate: initialData?.degreeCertificate || null,
            certificates: initialData?.certificates || d.certificates || [],
            groundwaterRegDetails: initialData?.groundwaterRegDetails || null,
            professionalMembership: initialData?.professionalMembership || null,
            registrationCertificate: initialData?.registrationCertificate || null,
            trainingCertificates: initialData?.trainingCertificates || [],

            // Service Details
            machineType: initialData?.machineType || d.machineType || "",
            surveyPhotos: initialData?.surveyPhotos || d.surveyPhotos || [],
            equipmentPhoto: initialData?.equipmentPhoto || null,
            sampleReport: initialData?.sampleReport || null,
            servicePrice: initialData?.servicePrice || d.servicePrice || "",

            // Bank Details
            bankName: initialData?.bankName || d.bankName || "",
            accountHolderName: initialData?.accountHolderName || d.accountHolderName || "",
            accountNumber: initialData?.accountNumber || d.accountNumber || "",
            confirmAccountNumber: initialData?.confirmAccountNumber || d.confirmAccountNumber || "",
            ifscCode: initialData?.ifscCode || d.ifscCode || "",
            branchName: initialData?.branchName || d.branchName || "",
            cancelledCheque: initialData?.cancelledCheque || null,

            // Address & Service Area
            address: initialData?.address || d.address || {},
            selectedPlace: initialData?.selectedPlace || d.selectedPlace || null,
            district: initialData?.district || d.district || "",
            state: initialData?.state || d.state || "",
            declarations: initialData?.declarations || d.declarations || {
                certifyTrue: false,
                responsibility: false,
                timeframe: false,
                agreement: false
            },
            serviceRadius: initialData?.serviceRadius || d.serviceRadius || "50 km",
            multipleStates: Array.isArray(initialData?.multipleStates)
                ? initialData.multipleStates
                : (Array.isArray(d.multipleStates)
                    ? d.multipleStates
                    : (typeof d.multipleStates === 'string' && d.multipleStates
                        ? d.multipleStates.split(',').map(s => s.trim()).filter(Boolean)
                        : [])),
            willingToTravel: initialData?.willingToTravel || d.willingToTravel || "Yes",
            modeOfTravel: Array.isArray(initialData?.modeOfTravel)
                ? initialData.modeOfTravel
                : (Array.isArray(d.modeOfTravel)
                    ? d.modeOfTravel
                    : ['Car', 'Bike']),
            travelChargesPerKm: initialData?.travelChargesPerKm !== undefined
                ? initialData.travelChargesPerKm
                : (d.travelChargesPerKm !== undefined ? d.travelChargesPerKm : "")
        };
    });

    const handleModeOfTravelToggle = (mode) => {
        setFormData(prev => ({
            ...prev,
            modeOfTravel: prev.modeOfTravel.includes(mode)
                ? prev.modeOfTravel.filter(m => m !== mode)
                : [...prev.modeOfTravel, mode]
        }));
    };

    // Auto-save form progress to sessionStorage so details survive page refresh
    useEffect(() => {
        try {
            const textFields = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                dob: formData.dob,
                bloodGroup: formData.bloodGroup,
                gender: formData.gender,
                designation: formData.designation,
                languages: formData.languages,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                aadhaarNo: formData.aadhaarNo,
                panNo: formData.panNo,
                education: formData.education,
                customEducation: formData.customEducation,
                institution: formData.institution,
                experience: formData.experience,
                experienceDetails: formData.experienceDetails,
                machineType: formData.machineType,
                servicePrice: formData.servicePrice,
                bankName: formData.bankName,
                accountHolderName: formData.accountHolderName,
                accountNumber: formData.accountNumber,
                ifscCode: formData.ifscCode,
                branchName: formData.branchName,
                address: formData.address,
                selectedPlace: formData.selectedPlace,
                district: formData.district,
                state: formData.state,
                serviceRadius: formData.serviceRadius,
                multipleStates: formData.multipleStates,
                willingToTravel: formData.willingToTravel,
                modeOfTravel: formData.modeOfTravel,
                travelChargesPerKm: formData.travelChargesPerKm
            };
            sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
                formData: textFields,
                activeTab,
                selectedMachines,
                fullAddress
            }));
        } catch (e) {
            console.error("Draft auto-save error:", e);
        }
    }, [formData, activeTab, selectedMachines, fullAddress]);

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

    const handleSurveyPhotoChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);

            // Add new files to formData
            setFormData(prev => ({
                ...prev,
                surveyPhotos: [...prev.surveyPhotos, ...files]
            }));

            // Create previews
            const newPreviews = files.map(file => ({
                file,
                preview: URL.createObjectURL(file)
            }));
            setSurveyPhotoPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeSurveyPhoto = (index) => {
        // Remove from formData
        setFormData(prev => ({
            ...prev,
            surveyPhotos: prev.surveyPhotos.filter((_, i) => i !== index)
        }));

        // Remove preview
        setSurveyPhotoPreviews(prev => {
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
        
        if (name === "dob") {
            let val = value.replace(/\D/g, '');
            if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
            if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5, 9);
            setFormData(prev => ({ ...prev, [name]: val }));
            return;
        }

        if (name === "email") {
             setFormData(prev => ({ ...prev, [name]: value.toLowerCase() }));
             return;
        }

        if (name === "phone") {
             const onlyNums = value.replace(/[^0-9]/g, '');
             if (onlyNums.length > 10) return;
             setFormData(prev => ({ ...prev, [name]: onlyNums }));
             return;
        }

        if (name === "languages") {
             const noNums = value.replace(/[0-9]/g, '');
             setFormData(prev => ({ ...prev, [name]: noNums }));
             return;
        }

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

        // Auto-extract state and district from Google address components
        let autoState = "";
        let autoDistrict = "";
        const components = placeData.addressComponents || placeData.place?.address_components || [];
        for (const comp of components) {
            if (comp.types?.includes('administrative_area_level_1')) {
                autoState = comp.long_name || comp.short_name || "";
            }
            if (comp.types?.includes('administrative_area_level_2')) {
                autoDistrict = comp.long_name || comp.short_name || "";
            }
            if (!autoDistrict && comp.types?.includes('locality')) {
                autoDistrict = comp.long_name || comp.short_name || "";
            }
        }
        if (autoDistrict && !autoState) {
            const matchedState = findStateForDistrict(autoDistrict);
            if (matchedState) autoState = matchedState;
        }

        // Update form data with selected place information & auto-detected state/district
        setFormData(prev => ({
            ...prev,
            district: autoDistrict || prev.district,
            state: autoState || prev.state,
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

                        let autoDistrict = "";
                        let autoState = "";

                        // Check for API errors
                        if (data.status === 'OK' && data.results && data.results.length > 0) {
                            const result = data.results[0];
                            formattedAddress = result.formatted_address || formattedAddress;
                            const components = result.address_components || [];
                            for (const comp of components) {
                                if (comp.types?.includes('administrative_area_level_1')) {
                                    autoState = comp.long_name || comp.short_name || "";
                                }
                                if (comp.types?.includes('administrative_area_level_2')) {
                                    autoDistrict = comp.long_name || comp.short_name || "";
                                }
                                if (!autoDistrict && comp.types?.includes('locality')) {
                                    autoDistrict = comp.long_name || comp.short_name || "";
                                }
                            }
                            if (autoDistrict && !autoState) {
                                const matchedState = findStateForDistrict(autoDistrict);
                                if (matchedState) autoState = matchedState;
                            }
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
                    district: autoDistrict || prev.district,
                    state: autoState || prev.state,
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
            async (error) => {
                let errorMessage = "Unable to get your location via GPS";

                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = "Location permission denied. Please allow location access in your browser settings.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMessage = "Location information unavailable via GPS.";
                } else if (error.code === error.TIMEOUT) {
                    errorMessage = "Location request timed out.";
                }

                toast.dismissToast(loadingToast);
                
                // Fallback to IP-based location if not a permission issue
                if (error.code !== error.PERMISSION_DENIED) {
                    const fallbackToast = toast.showLoading("Trying network-based location...");
                    try {
                        const ipRes = await fetch("https://ipapi.co/json/");
                        const ipData = await ipRes.json();
                        
                        toast.dismissToast(fallbackToast);
                        
                        if (ipData && ipData.latitude && ipData.longitude) {
                            const lat = parseFloat(ipData.latitude);
                            const lng = parseFloat(ipData.longitude);
                            const formattedAddress = [ipData.city, ipData.region, ipData.country_name].filter(Boolean).join(", ");
                            
                            setFormData(prev => ({
                                ...prev,
                                district: ipData.city || prev.district,
                                state: ipData.region || prev.state,
                                address: {
                                    coordinates: { lat, lng },
                                    geoLocation: {
                                        formattedAddress,
                                        placeId: null,
                                        geocodedAt: new Date()
                                    }
                                }
                            }));
                            setFullAddress(formattedAddress);
                            toast.showSuccess("Location found via network!");
                            setGettingLocation(false);
                            return;
                        }
                    } catch (e) {
                        console.error("IP fallback failed:", e);
                        toast.dismissToast(fallbackToast);
                    }
                }

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

    const validateBasicInfo = () => {
        if (!formData.name) { toast.showError("Full Name is required"); return false; }
        if (!formData.email) { toast.showError("Email Address is required"); return false; }
        if (!formData.phone) { toast.showError("Mobile Number is required"); return false; }
        if (formData.phone.length !== 10) { toast.showError("Please enter a valid 10-digit mobile number"); return false; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) { toast.showError("Please enter a valid email address"); return false; }
        if (!formData.gender) { toast.showError("Gender is required"); return false; }
        if (!formData.dob) { toast.showError("Date of Birth is required"); return false; }
        if (!formData.bloodGroup) { toast.showError("Blood Group is required"); return false; }
        if (!formData.designation) { toast.showError("Designation is required"); return false; }
        if (!formData.password) { toast.showError("Password is required"); return false; }
        if (!formData.confirmPassword) { toast.showError("Confirm Password is required"); return false; }
        if (formData.password !== formData.confirmPassword) { toast.showError("Passwords do not match"); return false; }
        return true;
    };

    const validateQualification = () => {
        if (!formData.education) { toast.showError("Highest Qualification is required"); return false; }
        if (!formData.specialization) { toast.showError("Specialization is required"); return false; }
        if (!formData.institution) { toast.showError("University/Institution is required"); return false; }
        if (!formData.graduationYear) { toast.showError("Graduation Year is required"); return false; }
        if (!formData.experience) { toast.showError("Years of Experience is required"); return false; }
        if (!formData.degreeCertificate) { toast.showError("Degree Certificate is required"); return false; }
        return true;
    };

    const validateTraining = () => {
        if (formData.machineType.length === 0) { toast.showError("Survey Equipment Used is required"); return false; }
        if (!formData.servicePrice) { toast.showError("Survey Base Fee is required"); return false; }
        if (formData.surveyPhotos.length < 3) { toast.showError("Please upload a minimum of 3 survey photos"); return false; }
        if (!formData.equipmentPhoto) { toast.showError("Equipment Photo is required"); return false; }
        return true;
    };

    const validateKYC = () => {
        if (!formData.isGstRegistered) { toast.showError("GST Registered option is required"); return false; }
        if (formData.isGstRegistered === "Yes" && !formData.gstNumber) { toast.showError("GST Number is required"); return false; }
        if (!formData.panNo) { toast.showError("PAN Number is required"); return false; }
        if (!formData.panCard) { toast.showError("PAN Card upload is required"); return false; }
        if (formData.aadharCards.length === 0) { toast.showError("Aadhaar Card upload is required"); return false; }
        if (!formData.accountHolderName) { toast.showError("Account Holder Name is required"); return false; }
        if (!formData.bankName) { toast.showError("Bank Name is required"); return false; }
        if (!formData.ifscCode) { toast.showError("IFSC Code is required"); return false; }
        if (!formData.accountNumber) { toast.showError("Account Number is required"); return false; }
        if (!formData.confirmAccountNumber) { toast.showError("Confirm Account Number is required"); return false; }
        if (formData.accountNumber !== formData.confirmAccountNumber) { toast.showError("Account Numbers do not match"); return false; }
        return true;
    };

    const validateAddress = () => {
        if (!formData.district) { toast.showError("District is required"); return false; }
        if (!formData.state) { toast.showError("State is required"); return false; }
        if (!formData.serviceRadius) { toast.showError("Service Radius is required"); return false; }
        if (formData.serviceRadius === "Multiple states" && (!formData.multipleStates || formData.multipleStates.length === 0)) {
            toast.showError("Please select at least one State for Multiple States service");
            return false;
        }
        if (!formData.willingToTravel) { toast.showError("Willing to Travel option is required"); return false; }
        if (formData.willingToTravel === "Yes") {
            if (!formData.modeOfTravel || formData.modeOfTravel.length === 0) {
                toast.showError("Please select at least one Mode of Travel");
                return false;
            }
        }
        if (!formData.declarations?.certifyTrue) { toast.showError("You must certify the information provided is true"); return false; }
        if (!formData.declarations?.responsibility) { toast.showError("You must acknowledge the responsibility of survey reports"); return false; }
        if (!formData.declarations?.timeframe) { toast.showError("You must agree to the 30-minute booking acceptance timeframe"); return false; }
        if (!formData.declarations?.agreement) { toast.showError("You must agree to the Expert Agreement, Privacy Policy, and Payment Terms"); return false; }
        return true;
    };

    const handleTabChange = (targetTabId) => {
        const currentIndex = TABS.findIndex(t => t.id === activeTab);
        const targetIndex = TABS.findIndex(t => t.id === targetTabId);
        
        if (targetIndex <= currentIndex) {
            setActiveTab(targetTabId);
            return;
        }
        
        for (let i = currentIndex; i < targetIndex; i++) {
            const tabId = TABS[i].id;
            let isValid = true;
            if (tabId === "basic") isValid = validateBasicInfo();
            else if (tabId === "qualification") isValid = validateQualification();
            else if (tabId === "training") isValid = validateTraining();
            else if (tabId === "kyc") isValid = validateKYC();
            
            if (!isValid) {
                setActiveTab(tabId);
                return;
            }
        }
        
        setActiveTab(targetTabId);
    };

    const handleSendOTP = async (e) => {
        e?.preventDefault();
        setLoading(true);

        if (!validateBasicInfo()) { setActiveTab("basic"); setLoading(false); return; }
        if (!validateQualification()) { setActiveTab("qualification"); setLoading(false); return; }
        if (!validateTraining()) { setActiveTab("training"); setLoading(false); return; }
        if (!validateKYC()) { setActiveTab("kyc"); setLoading(false); return; }
        if (!validateAddress()) { setActiveTab("address"); setLoading(false); return; }

        const dobParts = formData.dob.split('/');
        if (dobParts.length !== 3 || dobParts[0].length !== 2 || dobParts[1].length !== 2 || dobParts[2].length !== 4) {
            toast.showError("Please enter Date of Birth in DD/MM/YYYY format");
            setLoading(false);
            return;
        }
        const dobDay = parseInt(dobParts[0], 10);
        const dobMonth = parseInt(dobParts[1], 10);
        const dobYear = parseInt(dobParts[2], 10);
        const dobDate = new Date(dobYear, dobMonth - 1, dobDay);
        
        if (dobDate.getFullYear() !== dobYear || dobDate.getMonth() !== dobMonth - 1 || dobDate.getDate() !== dobDay) {
            toast.showError("Please enter a valid Date of Birth");
            setLoading(false);
            return;
        }

        const today = new Date();
        let age = today.getFullYear() - dobDate.getFullYear();
        const m = today.getMonth() - dobDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
            age--;
        }
        if (age < 18) {
            toast.showError("You must be at least 18 years old to register");
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
                try {
                    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
                } catch (e) {
                    console.error("Failed to clear draft:", e);
                }
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
                                dob: formData.dob.split('/').reverse().join('-'),
                                bloodGroup: formData.bloodGroup,
                                gender: formData.gender,
                                designation: formData.designation,
                                languages: formData.languages,
                                password: formData.password,
                                profilePicture: formData.profilePicture,
                                isGstRegistered: formData.isGstRegistered,
                                gstNumber: formData.gstNumber,
                                panNo: formData.panNo,
                                aadharCards: formData.aadharCards,
                                panCard: formData.panCard,
                                groundwaterRegDetails: formData.groundwaterRegDetails,
                                professionalMembership: formData.professionalMembership,
                                registrationCertificate: formData.registrationCertificate,
                                trainingCertificates: formData.trainingCertificates,
                                certificates: formData.certificates,
                                cancelledCheque: formData.cancelledCheque,
                                accountHolderName: formData.accountHolderName,
                                accountNumber: formData.accountNumber,
                                ifscCode: formData.ifscCode,
                                bankName: formData.bankName,
                                branchName: formData.branchName,
                                education: formData.education === 'Other' ? formData.customEducation : formData.education,
                                specialization: formData.specialization,
                                institution: formData.institution,
                                graduationYear: formData.graduationYear,
                                experience: formData.experience,
                                surveysCompleted: formData.surveysCompleted,
                                experienceDetails: formData.experienceDetails,
                                degreeCertificate: formData.degreeCertificate,
                                machineType: formData.machineType,
                                surveyPhotos: formData.surveyPhotos,
                                equipmentPhoto: formData.equipmentPhoto,
                                sampleReport: formData.sampleReport,
                                servicePrice: formData.servicePrice,
                                address: {
                                    ...formData.address,
                                    coordinates: formData.address.coordinates || null
                                },
                                selectedPlace: formData.selectedPlace,
                                district: formData.district,
                                state: formData.state,
                                serviceRadius: formData.serviceRadius,
                                multipleStates: formData.multipleStates,
                                willingToTravel: formData.willingToTravel,
                                modeOfTravel: formData.modeOfTravel,
                                travelChargesPerKm: formData.travelChargesPerKm
                            },
                            verificationToken: response.data.token,
                            phone: formData.phone,
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
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-teal-50/30 p-4 py-8 overflow-y-auto">
            {animationStyles}
            {/* Ambient Blurred Background Accents */}
            <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute bottom-10 right-10 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" />

            <div className="relative z-10 w-full max-w-2xl">
                <div className="mt-2 mb-6 flex flex-col items-center text-center">
                    <div className="relative mb-3 flex items-center justify-center p-3 rounded-2xl bg-white/80 border border-slate-100 shadow-2xs backdrop-blur-md">
                        <img
                            src={logo}
                            alt="Jaladhaara Logo"
                            className="h-20 sm:h-24 object-contain"
                        />
                    </div>
                    <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-500">
                        Create your Expert account to get started.
                    </p>
                </div>

                <main className="w-full rounded-3xl bg-white/95 backdrop-blur-md shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
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
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>

                            {TABS.map((tab, index) => {
                                const isCompleted = TABS.findIndex(t => t.id === activeTab) > index;
                                const isActive = activeTab === tab.id;

                                const renderTabIcon = (tabId, completed) => {
                                    if (completed) return <IoCheckmarkOutline className="text-xl stroke-[3]" />;
                                    switch (tabId) {
                                        case "basic": return <IoPersonOutline className="text-xl" />;
                                        case "qualification": return <IoSchoolOutline className="text-xl" />;
                                        case "training": return <IoBriefcaseOutline className="text-xl" />;
                                        case "kyc": return <IoCardOutline className="text-xl" />;
                                        case "address": return <IoLocationOutline className="text-xl" />;
                                        default: return <IoPersonOutline className="text-xl" />;
                                    }
                                };

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => handleTabChange(tab.id)}
                                        className="relative z-10 flex flex-col items-center group cursor-pointer"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
                                            ? "bg-[#0A84FF] text-white shadow-md shadow-blue-500/30 scale-110"
                                            : isCompleted
                                                ? "bg-emerald-500 text-white shadow-2xs"
                                                : "bg-white border-2 border-slate-200 text-slate-400 group-hover:border-blue-300 group-hover:text-blue-500"
                                            }`}>
                                            {renderTabIcon(tab.id, isCompleted)}
                                        </div>
                                        <span className={`absolute -bottom-6 text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap transition-colors duration-300 hidden sm:block ${isActive ? "text-[#0A84FF]" : "text-slate-400"
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
                                    <h3 className="text-base font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                                        <IoPersonOutline className="text-[#0A84FF] text-xl" />
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
                                    />
                                    <InputBox
                                        label="Date of Birth * (Required for insurance)"
                                        name="dob"
                                        type="text"
                                        placeholder="DD/MM/YYYY"
                                        value={formData.dob}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                    />
                                    <SelectBox
                                        label="Blood Group * (Required for insurance)"
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
                                    />
                                    <InputBox
                                        label="Languages Known (Optional)"
                                        name="languages"
                                        type="text"
                                        placeholder="e.g. English, Hindi, Telugu"
                                        value={formData.languages}
                                        onChange={handleInputChange}
                                        disabled={loading}
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
                                            onClick={() => handleTabChange("qualification")}
                                            className="w-full rounded-2xl bg-gradient-to-r from-[#0A84FF] via-blue-600 to-[#00C2A8] py-3.5 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            Next: Qualification & Experience
                                            <IoArrowForwardOutline className="text-base" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Qualification & Experience */}
                            {activeTab === "qualification" && (
                                <div className="tab-snappy space-y-4">
                                    <h3 className="text-base font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                                        <IoSchoolOutline className="text-[#0A84FF] text-xl" />
                                        Qualification & Experience
                                    </h3>

                                    <InputBox
                                        label="Highest Qualification *"
                                        name="education"
                                        type="text"
                                        placeholder="e.g. BSc, MSc, PhD, Diploma"
                                        value={formData.education}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                    />

                                    <SelectBox
                                        label="Specialization *"
                                        name="specialization"
                                        options={[
                                            { value: "", label: "Select Specialization" },
                                            { value: "Geology", label: "Geology" },
                                            { value: "Geophysics", label: "Geophysics" },
                                            { value: "Earth Science", label: "Earth Science" },
                                            { value: "Diploma", label: "Diploma" }
                                        ]}
                                        value={formData.specialization}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                    />

                                    <InputBox
                                        label="University/Institution *"
                                        name="institution"
                                        type="text"
                                        placeholder="Enter institution name"
                                        value={formData.institution}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                    />

                                    <div className="grid grid-cols-2 gap-3 mb-3.5">
                                        <InputBox
                                            label="Graduation Year *"
                                            name="graduationYear"
                                            type="number"
                                            placeholder="e.g. 2018"
                                            value={formData.graduationYear}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        />
                                        <InputBox
                                            label="Years of Experience *"
                                            name="experience"
                                            type="number"
                                            placeholder="Yrs"
                                            value={formData.experience}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        />
                                    </div>
                                    
                                    <InputBox
                                        label="Number of Surveys Completed (Optional)"
                                        name="surveysCompleted"
                                        type="number"
                                        placeholder="Surveys"
                                        value={formData.surveysCompleted}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                    />

                                    <SelectBox
                                        label="Area of Expertise Examples *"
                                        name="experienceDetails"
                                        options={[
                                            { value: "", label: "Select Area of Expertise" },
                                            { value: "Agricultural Surveys", label: "Agricultural Surveys" },
                                            { value: "Industrial Surveys", label: "Industrial Surveys" },
                                            { value: "Residential Surveys", label: "Residential Surveys" },
                                            { value: "Commercial Surveys", label: "Commercial Surveys" }
                                        ]}
                                        value={formData.experienceDetails}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                    />

                                    <FileBox
                                        label="Degree Certificate *"
                                        file={formData.degreeCertificate}
                                        onChange={(e) => handleFileChange('degreeCertificate', e)}
                                        disabled={loading}
                                    />

                                    <MultiFileBox
                                        label="Additional Certificates (Optional)"
                                        files={formData.certificates}
                                        onChange={(e) => handleFileChange('certificates', e)}
                                        onRemove={(idx) => removeMultiFile('certificates', idx)}
                                        disabled={loading}
                                    />

                                    <div className="grid grid-cols-2 gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => handleTabChange("basic")}
                                            className="bg-slate-100 text-slate-700 py-3.5 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                                        >
                                            <IoArrowBackOutline className="text-base" />
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleTabChange("training")}
                                            className="rounded-2xl bg-gradient-to-r from-[#0A84FF] via-blue-600 to-[#00C2A8] py-3.5 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            Next: Training
                                            <IoArrowForwardOutline className="text-base" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Training & Registration */}
                            {activeTab === "training" && (
                                <div className="tab-snappy space-y-4">
                                    <h3 className="text-base font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                                        <IoBriefcaseOutline className="text-[#0A84FF] text-xl" />
                                        Registration
                                    </h3>

                                    <div className="mb-2 block text-sm font-bold text-slate-700 uppercase tracking-wider ml-1 mt-4">
                                        Government Registration / License (Optional)
                                    </div>
                                    <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                                        <FileBox
                                            label="Groundwater Department ID"
                                            onChange={(e) => handleFileChange('groundwaterRegDetails', e)}
                                            file={formData.groundwaterRegDetails}
                                            disabled={loading}
                                        />

                                        <FileBox
                                            label="Professional Membership"
                                            onChange={(e) => handleFileChange('professionalMembership', e)}
                                            file={formData.professionalMembership}
                                            disabled={loading}
                                        />

                                        <FileBox
                                            label="Registration Certificate"
                                            onChange={(e) => handleFileChange('registrationCertificate', e)}
                                            file={formData.registrationCertificate}
                                            disabled={loading}
                                        />
                                    </div>

                                    <h3 className="text-base font-extrabold text-slate-800 mb-3 flex items-center gap-2 border-t border-slate-100 pt-5 mt-2">
                                        <IoBriefcaseOutline className="text-[#0A84FF] text-xl" />
                                        Training & Professional Certifications
                                    </h3>

                                    <MultiFileBox
                                        label="Training / Workshop Certificates"
                                        files={formData.trainingCertificates}
                                        onChange={(e) => handleFileChange('trainingCertificates', e)}
                                        onRemove={(idx) => removeMultiFile('trainingCertificates', idx)}
                                        disabled={loading}
                                    />

                                    {/* Setup Your Service Section */}
                                    <div className="mt-6 pt-5 border-t border-slate-100">
                                        <h3 className="text-base font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                                            <IoConstructOutline className="text-[#0A84FF] text-xl" />
                                            Service Setup
                                        </h3>

                                        {/* Service Name - Fixed Display */}
                                        <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-100/80 flex items-center gap-3 mb-6">
                                            <IoWaterOutline className="text-[#0A84FF] text-2xl" />
                                            <div>
                                                <label className="block text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                                                    Service Name
                                                </label>
                                                <p className="text-base font-bold text-slate-800">
                                                    Groundwater Survey
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            {/* Machine Type Multi-Select */}
                                            <div className="relative" ref={machineDropdownRef}>
                                                <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                                                    Survey Equipment Used *
                                                </label>

                                                {/* Dropdown Trigger */}
                                                <div
                                                    onClick={() => !loading && setIsMachineDropdownOpen(!isMachineDropdownOpen)}
                                                    className={`w-full min-h-[46px] rounded-2xl border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 transition focus:border-[#0A84FF] focus:outline-none focus:ring-4 focus:ring-blue-100 flex items-center justify-between cursor-pointer border hover:border-slate-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedMachines.length > 0 ? (
                                                            selectedMachines.map(machine => (
                                                                <span key={machine} className="bg-blue-50 border border-blue-200/80 text-[#0A84FF] px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                                                                    {machine}
                                                                    <IoCloseOutline
                                                                        className="cursor-pointer hover:text-rose-500 text-sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (!loading) handleMachineToggle(machine);
                                                                        }}
                                                                    />
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-400 px-1 text-xs">Select Machines</span>
                                                        )}
                                                    </div>
                                                    <IoChevronDownOutline className="text-slate-400 text-lg px-1" />
                                                </div>

                                                {/* Dropdown Menu */}
                                                {isMachineDropdownOpen && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2">
                                                        {MACHINE_OPTIONS.map((option) => (
                                                            <div
                                                                key={option}
                                                                onClick={() => handleMachineToggle(option)}
                                                                className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                                                            >
                                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedMachines.includes(option) ? 'bg-[#0A84FF] border-[#0A84FF]' : 'border-slate-300'}`}>
                                                                    {selectedMachines.includes(option) && <IoCheckmarkOutline className="text-white text-sm" />}
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-800">{option}</span>
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
                                                        className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 text-xs sm:text-sm font-medium text-slate-800 transition focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleAddCustomMachine}
                                                        disabled={loading || !customMachine.trim()}
                                                        className="bg-[#0A84FF] text-white px-4 py-2.5 rounded-2xl text-xs font-extrabold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Service Charge */}
                                            <div>
                                                <label className="mb-1 block text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                                                    Survey Base Fee (₹) *
                                                </label>
                                                <span className="block text-[10px] text-slate-500 mb-1.5 ml-1 font-medium">
                                                    Excluding travel charges
                                                </span>
                                                <div className="relative">
                                                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-500 font-extrabold text-sm">₹</span>
                                                    <input
                                                        type="number"
                                                        name="servicePrice"
                                                        value={formData.servicePrice}
                                                        onChange={handleInputChange}
                                                        placeholder="0.00"
                                                        min="0"
                                                        step="0.01"
                                                        disabled={loading}
                                                        className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 pl-8 text-sm font-extrabold text-slate-800 focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Service Images */}
                                        <div className="mb-6 space-y-6">
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 block ml-1">
                                                    Survey Photos (Minimum 3) *
                                                </label>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                    {surveyPhotoPreviews.map((item, index) => (
                                                        <div key={index} className="relative group rounded-2xl overflow-hidden aspect-square shadow-2xs border border-slate-200">
                                                            <img
                                                                src={item.preview}
                                                                alt={`Preview ${index + 1}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeSurveyPhoto(index)}
                                                                    className="bg-white/20 hover:bg-rose-500 text-white p-2 rounded-full backdrop-blur-sm transition-colors cursor-pointer"
                                                                >
                                                                    <IoTrashOutline className="text-lg" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    <label className={`flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-[#0A84FF] hover:bg-blue-50/50 transition-all group ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                        <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center mb-2 group-hover:bg-[#0A84FF] transition-colors">
                                                            <IoImageOutline className="text-lg text-[#0A84FF] group-hover:text-white transition-colors" />
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-500 group-hover:text-[#0A84FF]">Add Image</p>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            multiple
                                                            onChange={handleSurveyPhotoChange}
                                                            disabled={loading}
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            <FileBox
                                                label="Equipment Photo *"
                                                onChange={(e) => handleFileChange('equipmentPhoto', e)}
                                                file={formData.equipmentPhoto}
                                                disabled={loading}
                                            />

                                            <FileBox
                                                label="Sample Survey Report (Optional)"
                                                onChange={(e) => handleFileChange('sampleReport', e)}
                                                file={formData.sampleReport}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => handleTabChange("qualification")}
                                            className="bg-slate-100 text-slate-700 py-3.5 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                                        >
                                            <IoArrowBackOutline className="text-base" />
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleTabChange("kyc")}
                                            className="rounded-2xl bg-gradient-to-r from-[#0A84FF] via-blue-600 to-[#00C2A8] py-3.5 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            Next: KYC
                                            <IoArrowForwardOutline className="text-base" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: KYC & Bank */}
                            {activeTab === "kyc" && (
                                <div className="tab-snappy space-y-4">
                                    <h3 className="text-base font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                                        <IoCardOutline className="text-[#0A84FF] text-xl" />
                                        KYC & Bank Details
                                    </h3>

                                    <div className="space-y-4">
                                        <SelectBox
                                            label="GST Registered? *"
                                            name="isGstRegistered"
                                            options={[
                                                { value: "", label: "Select Option" },
                                                { value: "Yes", label: "Yes" },
                                                { value: "No", label: "No" }
                                            ]}
                                            value={formData.isGstRegistered}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        />

                                        {formData.isGstRegistered === "Yes" && (
                                            <InputBox
                                                label="GST Number *"
                                                name="gstNumber"
                                                type="text"
                                                placeholder="Enter GST Number"
                                                value={formData.gstNumber}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                            />
                                        )}

                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                                            <InputBox
                                                label="PAN Number *"
                                                name="panNo"
                                                type="text"
                                                placeholder="Enter PAN number"
                                                value={formData.panNo}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                            />
                                            <FileBox
                                                label="Upload PAN *"
                                                onChange={(e) => handleFileChange('panCard', e)}
                                                file={formData.panCard}
                                                disabled={loading}
                                            />
                                        </div>

                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block ml-1">
                                                Aadhaar *
                                            </label>
                                            <MultiFileBox
                                                label="Upload Front & Back"
                                                files={formData.aadharCards}
                                                onChange={(e) => handleFileChange('aadharCards', e)}
                                                onRemove={(idx) => removeMultiFile('aadharCards', idx)}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4 mt-6">
                                        <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 px-1">Bank Account Information *</p>
                                        <InputBox
                                            label="Account Holder Name *"
                                            name="accountHolderName"
                                            type="text"
                                            placeholder="As per bank records"
                                            value={formData.accountHolderName}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        />
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
                                        <InputBox
                                            label="Account Number *"
                                            name="accountNumber"
                                            type="text"
                                            placeholder="Enter full account number"
                                            value={formData.accountNumber}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        />
                                        <InputBox
                                            label="Confirm Account Number *"
                                            name="confirmAccountNumber"
                                            type="text"
                                            placeholder="Re-enter full account number"
                                            value={formData.confirmAccountNumber}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        />
                                        <FileBox
                                            label="Cancelled Cheque or Passbook (Either one)"
                                            onChange={(e) => handleFileChange('cancelledCheque', e)}
                                            file={formData.cancelledCheque}
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => handleTabChange("training")}
                                            className="bg-slate-100 text-slate-700 py-3.5 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                                        >
                                            <IoArrowBackOutline className="text-base" />
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleTabChange("address")}
                                            className="rounded-2xl bg-gradient-to-r from-[#0A84FF] via-blue-600 to-[#00C2A8] py-3.5 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            Next: Address
                                            <IoArrowForwardOutline className="text-base" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Service Area */}
                            {activeTab === "address" && (
                                <div className="tab-snappy space-y-4">
                                    <h3 className="text-base font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                                        <IoLocationOutline className="text-[#0A84FF] text-xl" />
                                        Service Area
                                    </h3>

                                    <div className="p-4 bg-blue-50/80 border border-blue-100/80 rounded-2xl space-y-4">
                                        {/* Primary Service Location */}
                                        <div>
                                            <label className="block text-xs font-extrabold text-blue-700 mb-2 px-1">
                                                Primary Service Location *
                                            </label>
                                            <div className="flex flex-col gap-2">
                                                <div className="relative">
                                                    <IoSearchOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-blue-400 text-lg z-10" />
                                                    <PlaceAutocompleteInput
                                                        onPlaceSelect={handleFullAddressSelect}
                                                        placeholder="Enter colony, street, area or landmark..."
                                                        value={fullAddress}
                                                        onChange={(e) => setFullAddress(e.target.value)}
                                                        disabled={loading || gettingLocation}
                                                        className="w-full rounded-2xl border-blue-100 bg-white py-3.5 pl-11 pr-4 text-slate-800 shadow-2xs focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 text-sm outline-none font-medium"
                                                        countryRestriction="in"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={getCurrentLocation}
                                                    disabled={loading || gettingLocation}
                                                    className="flex items-center justify-center gap-2 bg-white text-[#0A84FF] border border-blue-200 px-4 py-3 rounded-2xl text-xs sm:text-sm font-extrabold hover:bg-blue-50 transition-all shadow-2xs cursor-pointer"
                                                >
                                                    <IoLocationOutline className="text-lg" />
                                                    {gettingLocation ? "Locating..." : "GPS Pin"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* State & District Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <SelectBox
                                                    label="State *"
                                                    name="state"
                                                    options={[
                                                        { value: "", label: "Select State / UT" },
                                                        ...getStatesList().map(st => ({ value: st, label: st }))
                                                    ]}
                                                    value={formData.state}
                                                    onChange={(e) => {
                                                        const newState = e.target.value;
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            state: newState,
                                                            district: getDistrictsList(newState).includes(prev.district) ? prev.district : ""
                                                        }));
                                                    }}
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div>
                                                <SelectBox
                                                    label="District *"
                                                    name="district"
                                                    options={[
                                                        { value: "", label: formData.state ? `Select District in ${formData.state}` : "Select District" },
                                                        ...getDistrictsList(formData.state).map(d => ({ value: d, label: d }))
                                                    ]}
                                                    value={formData.district}
                                                    onChange={handleInputChange}
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>

                                        {/* Service Radius */}
                                        <div>
                                            <SelectBox
                                                label="Service Radius *"
                                                name="serviceRadius"
                                                options={[
                                                    { value: "", label: "Select Service Radius" },
                                                    { value: "10 km", label: "10 km" },
                                                    { value: "20 km", label: "20 km" },
                                                    { value: "30 km", label: "30 km" },
                                                    { value: "50 km", label: "50 km" },
                                                    { value: "100 km", label: "100 km" },
                                                    { value: "200 km", label: "200 km" },
                                                    { value: "Entire District", label: "Entire District" },
                                                    { value: "Entire State", label: "Entire State" },
                                                    { value: "Multiple states", label: "Multiple states" }
                                                ]}
                                                value={formData.serviceRadius}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                            />
                                        </div>

                                        {/* Multiple States Dropdown (Shown when "Multiple states" is selected) */}
                                        {formData.serviceRadius === "Multiple states" && (
                                            <div className="pt-1">
                                                <MultipleStatesDropdown
                                                    label="Multiple states drop down menu *"
                                                    value={formData.multipleStates}
                                                    onChange={(selected) => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            multipleStates: selected
                                                        }));
                                                    }}
                                                    disabled={loading}
                                                />
                                            </div>
                                        )}

                                        {/* Willing to Travel */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 px-1">
                                                Willing to Travel? *
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['Yes', 'No'].map((opt) => (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, willingToTravel: opt }))}
                                                        disabled={loading}
                                                        className={`py-3 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                                                            formData.willingToTravel === opt
                                                                ? 'bg-[#0A84FF] text-white border-[#0A84FF] shadow-md shadow-blue-500/20'
                                                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        {formData.willingToTravel === opt && <IoCheckmarkOutline className="text-base" />}
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Mode of travel & Travel Charges (Shown when Willing to Travel is Yes) */}
                                        {formData.willingToTravel === "Yes" && (
                                            <div className="space-y-4 pt-2 border-t border-blue-100/80">
                                                <div>
                                                    <div className="flex items-center justify-between mb-2 px-1">
                                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                            Mode of travel *
                                                        </label>
                                                        <span className="text-[11px] font-semibold text-slate-400">
                                                            Select all that apply
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                                        {[
                                                            { mode: 'Bus', icon: '🚌' },
                                                            { mode: 'Car', icon: '🚗' },
                                                            { mode: 'Bike', icon: '🏍️' },
                                                            { mode: 'Train', icon: '🚆' }
                                                        ].map(({ mode, icon }) => {
                                                            const isChecked = formData.modeOfTravel.includes(mode);
                                                            return (
                                                                <button
                                                                    key={mode}
                                                                    type="button"
                                                                    onClick={() => handleModeOfTravelToggle(mode)}
                                                                    disabled={loading}
                                                                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                                                                        isChecked
                                                                            ? 'bg-blue-50 border-[#0A84FF] text-[#0A84FF] shadow-xs'
                                                                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-lg">{icon}</span>
                                                                        <span className="text-xs font-bold">{mode}</span>
                                                                    </div>
                                                                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                                                                        isChecked ? 'bg-[#0A84FF] border-[#0A84FF] text-white' : 'border-slate-300'
                                                                    }`}>
                                                                        {isChecked && <IoCheckmarkOutline className="text-xs stroke-[3]" />}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 px-1">
                                                        Travel Charges after Free Radius
                                                    </label>
                                                    <div className="relative">
                                                        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-500 font-extrabold text-sm">₹</span>
                                                        <input
                                                            type="number"
                                                            name="travelChargesPerKm"
                                                            value={formData.travelChargesPerKm}
                                                            onChange={handleInputChange}
                                                            placeholder="0.00"
                                                            min="0"
                                                            step="0.01"
                                                            disabled={loading}
                                                            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-9 pr-16 text-sm font-extrabold text-slate-800 focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                                        />
                                                        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 font-bold text-xs">/ km</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 font-medium mt-1.5 px-1">
                                                        Applicable for client visits beyond your standard service radius.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {formData.address?.geoLocation?.formattedAddress && (
                                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                                            <IoCheckmarkCircleOutline className="text-emerald-500 text-xl mt-0.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-tight">Verified Primary Address</p>
                                                <p className="text-xs sm:text-sm text-emerald-800 font-bold break-words">{formData.address.geoLocation.formattedAddress}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 pb-2 space-y-3">
                                        <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">Mandatory Declarations</p>
                                        
                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <div className="relative flex items-center justify-center mt-0.5">
                                                <input type="checkbox" className="peer sr-only" checked={formData.declarations?.certifyTrue} onChange={(e) => setFormData(prev => ({ ...prev, declarations: { ...prev.declarations, certifyTrue: e.target.checked } }))} />
                                                <div className="w-5 h-5 rounded border-2 border-slate-300 bg-white peer-checked:bg-[#0A84FF] peer-checked:border-[#0A84FF] transition-all group-hover:border-[#0A84FF]"></div>
                                                <IoCheckmarkOutline className="absolute text-white opacity-0 peer-checked:opacity-100 text-sm transition-opacity" />
                                            </div>
                                            <span className="text-xs text-slate-600 font-medium leading-relaxed group-hover:text-slate-800 transition-colors">I certify that the information provided is true.</span>
                                        </label>

                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <div className="relative flex items-center justify-center mt-0.5">
                                                <input type="checkbox" className="peer sr-only" checked={formData.declarations?.responsibility} onChange={(e) => setFormData(prev => ({ ...prev, declarations: { ...prev.declarations, responsibility: e.target.checked } }))} />
                                                <div className="w-5 h-5 rounded border-2 border-slate-300 bg-white peer-checked:bg-[#0A84FF] peer-checked:border-[#0A84FF] transition-all group-hover:border-[#0A84FF]"></div>
                                                <IoCheckmarkOutline className="absolute text-white opacity-0 peer-checked:opacity-100 text-sm transition-opacity" />
                                            </div>
                                            <span className="text-xs text-slate-600 font-medium leading-relaxed group-hover:text-slate-800 transition-colors">I understand Jaladhaara is a booking platform and survey reports are the sole responsibility of the expert.</span>
                                        </label>

                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <div className="relative flex items-center justify-center mt-0.5">
                                                <input type="checkbox" className="peer sr-only" checked={formData.declarations?.timeframe} onChange={(e) => setFormData(prev => ({ ...prev, declarations: { ...prev.declarations, timeframe: e.target.checked } }))} />
                                                <div className="w-5 h-5 rounded border-2 border-slate-300 bg-white peer-checked:bg-[#0A84FF] peer-checked:border-[#0A84FF] transition-all group-hover:border-[#0A84FF]"></div>
                                                <IoCheckmarkOutline className="absolute text-white opacity-0 peer-checked:opacity-100 text-sm transition-opacity" />
                                            </div>
                                            <span className="text-xs text-slate-600 font-medium leading-relaxed group-hover:text-slate-800 transition-colors">Experts must accept or decline a booking within 30 minutes. Otherwise, the booking is automatically reassigned to the next suitable expert.</span>
                                        </label>

                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <div className="relative flex items-center justify-center mt-0.5">
                                                <input type="checkbox" className="peer sr-only" checked={formData.declarations?.agreement} onChange={(e) => setFormData(prev => ({ ...prev, declarations: { ...prev.declarations, agreement: e.target.checked } }))} />
                                                <div className="w-5 h-5 rounded border-2 border-slate-300 bg-white peer-checked:bg-[#0A84FF] peer-checked:border-[#0A84FF] transition-all group-hover:border-[#0A84FF]"></div>
                                                <IoCheckmarkOutline className="absolute text-white opacity-0 peer-checked:opacity-100 text-sm transition-opacity" />
                                            </div>
                                            <span className="text-xs text-slate-600 font-medium leading-relaxed group-hover:text-slate-800 transition-colors">I agree to the Expert Agreement, Privacy Policy, and Payment Terms.</span>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 pt-6">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full rounded-2xl bg-gradient-to-r from-[#0A84FF] via-blue-600 to-[#00C2A8] py-4 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? "Registering Account..." : "Complete Registration"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleTabChange("kyc")}
                                            className="w-full text-slate-400 py-2 text-xs sm:text-sm font-bold hover:text-slate-600 transition-colors cursor-pointer"
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
                    <p className="text-xs sm:text-sm font-medium text-slate-500">
                        Already Registered?{" "}
                        <Link
                            to="/vendorlogin"
                            className="font-extrabold text-[#0A84FF] hover:text-blue-700 hover:underline transition-colors"
                        >
                            Log In
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
                <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                    {imagePreview || (file && URL.createObjectURL(file)) ? (
                        <img
                            src={imagePreview || URL.createObjectURL(file)}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <IoPersonOutline className="text-4xl text-slate-400" />
                    )}
                </div>
                <label className="absolute bottom-0 right-0 bg-[#0A84FF] text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-[#005BBB] transition-all hover:scale-105 active:scale-95">
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                    <IoCameraOutline className="text-base text-white" />
                </label>
            </div>
        </div>
    );
}

function InputBox({ label, name, type, placeholder, value, onChange, disabled, max, min }) {
    const renderIcon = () => {
        if (name === "name" || name.includes("Holder")) return <IoPersonOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />;
        if (name === "email") return <IoMailOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />;
        if (name === "phone") return <IoCallOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />;
        if (name === "dob") return <IoCalendarOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />;
        if (name === "languages") return <IoDocumentTextOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />;
        if (name.includes("bank") || name.includes("account") || name.includes("ifsc") || name.includes("branch")) return <IoBusinessOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />;
        if (name.includes("pan") || name.includes("aadhaar") || name.includes("No")) return <IoCardOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />;
        if (name.includes("price") || name.includes("Price")) return <IoCashOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />;
        if (name.includes("experience") || name.includes("institution")) return <IoBriefcaseOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />;
        return <IoCreateOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />;
    };

    return (
        <div className="mb-3.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                {label}
            </label>
            <div className="relative">
                {renderIcon()}
                <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    max={max}
                    min={min}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-800 text-sm font-medium shadow-2xs focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    disabled={disabled}
                />
            </div>
        </div>
    );
}

function PasswordBox({ label, name, placeholder, value, onChange, show, toggle, disabled }) {
    return (
        <div className="mb-3.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                {label}
            </label>
            <div className="relative">
                <IoLockClosedOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />
                <input
                    type={show ? "text" : "password"}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-16 text-slate-800 text-sm font-medium shadow-2xs focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    disabled={disabled}
                />
                <button
                    type="button"
                    className="absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors cursor-pointer"
                    onClick={toggle}
                    disabled={disabled}
                    title={show ? "Hide Password" : "Show Password"}
                >
                    {show ? <IoEyeOffOutline className="text-lg" /> : <IoEyeOutline className="text-lg" />}
                </button>
            </div>
        </div>
    );
}

function FileBox({ label, onChange, file, disabled }) {
    return (
        <div className="mb-3.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                {label}
            </label>
            <div className="relative">
                <IoCloudUploadOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />
                {file && (
                    <p className="text-xs font-bold text-emerald-600 mb-1.5 pl-11 flex items-center gap-1">
                        <IoCheckmarkCircleOutline className="text-sm" /> {file.name}
                    </p>
                )}
                <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={onChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-800 text-xs sm:text-sm font-medium shadow-2xs focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 transition-all outline-none file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#0A84FF]"
                    disabled={disabled}
                />
            </div>
        </div>
    );
}

function SelectBox({ label, name, options, value, onChange, disabled }) {
    return (
        <div className="mb-3.5">
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
        <div className="mb-3.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                {label}
            </label>
            <div className="relative">
                <IoCloudUploadOutline className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 text-lg" />
                {files && files.length > 0 && (
                    <div className="mb-2.5 space-y-1.5 pl-11">
                        {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200/80 p-2 rounded-xl">
                                <span className="text-slate-700 font-semibold truncate">{file.name}</span>
                                <button
                                    type="button"
                                    onClick={() => onRemove(index)}
                                    className="text-rose-600 hover:text-rose-800 font-bold ml-2 cursor-pointer"
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
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-800 text-xs sm:text-sm font-medium shadow-2xs focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 transition-all outline-none file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#0A84FF]"
                    disabled={disabled}
                />
                <p className="text-[11px] text-slate-400 font-semibold mt-1 pl-1">
                    You can select multiple files
                </p>
            </div>
        </div>
    );
}

function TextAreaBox({ label, name, placeholder, value, onChange, disabled }) {
    return (
        <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                {label}
            </label>
            <textarea
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-800 text-sm font-medium shadow-2xs focus:border-[#0A84FF] focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                rows="3"
                disabled={disabled}
            />
        </div>
    );
}

