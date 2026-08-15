import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoPersonOutline,
    IoCallOutline,
    IoHomeOutline,
    IoPencilOutline,
    IoLogOutOutline,
    IoChevronForwardOutline,
    IoImageOutline,
    IoConstructOutline,
    IoAddCircleOutline,
    IoTrashOutline,
    IoCloseOutline,
    IoCheckmarkOutline,
    IoArrowBackOutline,
    IoLocationOutline,
    IoCameraOutline,
    IoStar,
    IoStarOutline,
    IoShieldCheckmarkOutline,
    IoBriefcaseOutline,
    IoWalletOutline,
    IoTimeOutline,
    IoCalendarOutline,
    IoNotificationsOutline,
    IoRibbonOutline,
    IoAlertCircleOutline,
    IoWaterOutline,
    IoSchoolOutline,
    IoDocumentTextOutline,
    IoHardwareChipOutline,
    IoCardOutline,
    IoCloudUploadOutline,
    IoCheckmarkCircle
} from "react-icons/io5";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import {
    getVendorProfile,
    updateVendorProfile,
    uploadProfilePicture,
    getMyServices,
    addService,
    updateService,
    deleteService,
    uploadServiceImages,
    getDashboardStats,
} from "../../../services/vendorApi";
import PageContainer from "../../shared/components/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import PlaceAutocompleteInput from "../../../components/PlaceAutocompleteInput";
import CustomDropdown from "../../shared/components/CustomDropdown";
import MultipleStatesDropdown from "../../shared/components/MultipleStatesDropdown";
import { getStatesList, getDistrictsList, findStateForDistrict } from "../../../utils/indianStatesDistricts";
import { useToast } from "../../../hooks/useToast";
import ConfirmModal from "../../shared/components/ConfirmModal";

// Get API key at module level
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const MACHINE_OPTIONS = [
    'Dowsing Rods',
    '3D Locator',
    'PQWT',
    'ADMT',
    'Resistivity Meter'
];

import {
    ALL_WEEKDAYS,
    WORKING_DAYS_PRESETS,
    WORKING_HOURS_PRESETS,
    detectDaysPreset,
    getDaysFromPreset,
    detectHoursPreset,
    normalizeWorkingDays,
    normalizeWorkingHours,
    formatWorkingDays,
    formatWorkingHours,
    formatTimeToAMPM
} from "../../../utils/availabilityUtils";

import VendorProfileView from "./VendorProfileView";
import GroundwaterSurveyFAQSection from "../vendor-components/GroundwaterSurveyFAQSection";

export default function VendorProfile() {
    const navigate = useNavigate();
    const { logout, vendor: authVendor } = useVendorAuth();
    const toast = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [vendor, setVendor] = useState(null);
    const [services, setServices] = useState([]);
    const [stats, setStats] = useState({
        completedBookings: 0,
        totalEarnings: 0,
        averageRating: 0,
        totalRatings: 0
    });
    const [isAddingService, setIsAddingService] = useState(false);
    const [editingServiceId, setEditingServiceId] = useState(null);
    const [previewingService, setPreviewingService] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [serviceFormData, setServiceFormData] = useState({
        name: "",
        description: "",
        machineType: "",
        skills: "",
        price: "",
        duration: "",
        category: "",
    });
    const [serviceImagePreviews, setServiceImagePreviews] = useState([]);

    // Machine Multi-select State
    const machineDropdownRef = useRef(null);
    const [isMachineDropdownOpen, setIsMachineDropdownOpen] = useState(false);
    const [selectedMachines, setSelectedMachines] = useState([]);
    const [customMachine, setCustomMachine] = useState("");

    const [fullAddress, setFullAddress] = useState("");
    const [gettingLocation, setGettingLocation] = useState(false);
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        phone: "",
        bloodGroup: "",
        gender: "",
        designation: "",
        experience: "",
        district: "",
        state: "",
        serviceRadius: "50 km",
        multipleStates: [],
        willingToTravel: "Yes",
        modeOfTravel: ['Car', 'Bike'],
        travelChargesPerKm: "",
        address: {
            coordinates: null,
            geoLocation: null
        },
        profilePicture: null,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        workingHours: { start: '08:00', end: '19:00' },
        aboutExpert: "",
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/vendor/login");
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };


    const loadProfile = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getVendorProfile();

            if (response.success && response.data.vendor) {
                const vendorData = response.data.vendor;
                setVendor(vendorData);

                // Load services if vendor is approved
                if (vendorData.isApproved) {
                    try {
                        const servicesResponse = await getMyServices();
                        if (servicesResponse.success) {
                            setServices(servicesResponse.data.services || []);
                        }
                    } catch (err) {
                    }
                }

                // Map backend data to frontend form structure
                const address = vendorData.address || {
                    coordinates: null,
                    geoLocation: null
                };

                // Get full address string from geoLocation for display
                const fullAddressStr = address?.geoLocation?.formattedAddress || "";

                setProfileData({
                    name: vendorData.name || "",
                    email: vendorData.email || "",
                    phone: vendorData.phone || "",
                    bloodGroup: vendorData.bloodGroup || "",
                    gender: vendorData.gender || "",
                    designation: vendorData.designation || "",
                    experience: vendorData.experience?.toString() || "",
                    district: vendorData.district || vendorData.address?.district || "",
                    state: vendorData.state || vendorData.address?.state || "",
                    serviceRadius: vendorData.serviceRadius || "50 km",
                    multipleStates: Array.isArray(vendorData.multipleStates)
                        ? vendorData.multipleStates
                        : (typeof vendorData.multipleStates === 'string' && vendorData.multipleStates
                            ? vendorData.multipleStates.split(',').map(s => s.trim()).filter(Boolean)
                            : []),
                    willingToTravel: vendorData.willingToTravel || "Yes",
                    modeOfTravel: Array.isArray(vendorData.modeOfTravel)
                        ? vendorData.modeOfTravel
                        : (typeof vendorData.modeOfTravel === 'string' && vendorData.modeOfTravel
                            ? vendorData.modeOfTravel.split(',').map(s => s.trim()).filter(Boolean)
                            : ['Car', 'Bike']),
                    travelChargesPerKm: vendorData.travelChargesPerKm !== undefined && vendorData.travelChargesPerKm !== null
                        ? vendorData.travelChargesPerKm.toString()
                        : "",
                    address: address,
                    profilePicture:
                        vendorData.documents?.profilePicture?.url || null,
                    workingDays: normalizeWorkingDays(vendorData.workingDays),
                    workingHours: normalizeWorkingHours(vendorData.workingHours),
                    aboutExpert: vendorData.aboutExpert || "",
                });

                setFullAddress(fullAddressStr);

                // Load Stats for Professional View
                try {
                    const statsResponse = await getDashboardStats();
                    if (statsResponse.success) {
                        setStats({
                            completedBookings: statsResponse.data.stats.completedBookings || 0,
                            totalEarnings: statsResponse.data.stats.totalEarnings || 0,
                            averageRating: vendorData.rating?.averageRating || 0,
                            totalRatings: vendorData.rating?.totalRatings || 0,
                        });
                    }
                } catch (err) {
                    console.error("Failed to load stats", err);
                }
            } else {
                setError("Failed to load profile");
            }
        } catch (err) {
            setError("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };


    // Sync machine selection to form data
    useEffect(() => {
        setServiceFormData(prev => ({
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



    const handleEdit = () => {
        setIsEditing(true);
    };

    // Handle place selection from Google Places Autocomplete
    const handleAddressSelect = (placeData) => {
        const selectedFormattedAddress = placeData.formattedAddress || "";
        const selectedPlaceId = placeData.placeId || "";
        const selectedLat = placeData.lat;
        const selectedLng = placeData.lng;

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
            const matched = findStateForDistrict(autoDistrict);
            if (matched) autoState = matched;
        }

        // Store in registration format
        setProfileData(prev => ({
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
            }
        }));

        setFullAddress(selectedFormattedAddress);
        toast.showSuccess("Address auto-filled from selected location");
    };

    // Get current location using browser geolocation API
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        setGettingLocation(true);
        setError("");

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
                                setProfileData(prev => ({
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
                    }
                } else {
                    // Store coordinates even if geocoding fails
                    setProfileData(prev => ({
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
                setError(errorMessage);
                setGettingLocation(false);
            }
        );
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError("");

            // If user manually typed address but didn't select from autocomplete,
            // store fullAddress in geoLocation as fallback
            let addressToSave = { ...profileData.address };
            if (fullAddress && (!addressToSave.geoLocation?.formattedAddress)) {
                addressToSave = {
                    ...addressToSave,
                    geoLocation: {
                        formattedAddress: fullAddress,
                        placeId: null,
                        geocodedAt: new Date()
                    }
                };
            }

            const updateData = {
                name: profileData.name || vendor?.name,
                phone: profileData.phone || vendor?.phone,
                bloodGroup: profileData.bloodGroup || null,
                gender: profileData.gender || null,
                designation: profileData.designation || null,
                experience: parseInt(profileData.experience, 10) || 0,
                district: profileData.district || null,
                state: profileData.state || null,
                serviceRadius: profileData.serviceRadius || "50 km",
                multipleStates: profileData.multipleStates || [],
                willingToTravel: profileData.willingToTravel || "Yes",
                modeOfTravel: profileData.modeOfTravel || [],
                travelChargesPerKm: profileData.travelChargesPerKm ? parseFloat(profileData.travelChargesPerKm) : 0,
                address: addressToSave, // Send as object, not stringified
                workingDays: normalizeWorkingDays(profileData.workingDays),
                workingHours: normalizeWorkingHours(profileData.workingHours),
                aboutExpert: profileData.aboutExpert || "",
            };

            const response = await updateVendorProfile(updateData);

            if (response.success) {
                // Upload profile picture if changed
                if (
                    profileData.profilePicture &&
                    typeof profileData.profilePicture === "object"
                ) {
                    try {
                        await uploadProfilePicture(profileData.profilePicture);
                    } catch (err) {
                    }
                }

                toast.showSuccess("Profile updated successfully!");
                setIsEditing(false);
                await loadProfile();
            } else {
                const errMsg = response.message || response.errors?.[0]?.msg || "Failed to update profile";
                setError(errMsg);
                toast.showError(errMsg);
            }
        } catch (err) {
            const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || "Failed to update profile. Please try again.";
            setError(errMsg);
            toast.showError(errMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setSaving(true);
            setError("");
            const response = await uploadProfilePicture(file);
            if (response.success) {
                setProfileData({
                    ...profileData,
                    profilePicture:
                        response.data.profilePicture?.url ||
                        response.data.profilePicture,
                });
                toast.showSuccess("Profile picture updated successfully!");
            } else {
                setError(
                    response.message || "Failed to upload profile picture"
                );
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to upload profile picture"
            );
        } finally {
            setSaving(false);
        }
    };

    // Service Management Functions
    const handleServiceImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newPreviews = [];
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                newPreviews.push({ file, preview: reader.result });
                if (newPreviews.length === files.length) {
                    setServiceImagePreviews([
                        ...serviceImagePreviews,
                        ...newPreviews,
                    ]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemoveServiceImage = (index) => {
        const newPreviews = serviceImagePreviews.filter((_, i) => i !== index);
        setServiceImagePreviews(newPreviews);
    };

    const handleAddService = async () => {
        try {
            setError("");

            if (
                !serviceFormData.name ||
                !serviceFormData.machineType ||
                !serviceFormData.price
            ) {
                setError("Please fill in all required service fields");
                return;
            }

            const formData = new FormData();
            formData.append("name", "Groundwater Survey"); // Force fixed name
            formData.append("description", serviceFormData.description || "");
            formData.append("machineType", serviceFormData.machineType);
            formData.append(
                "skills",
                JSON.stringify(
                    serviceFormData.skills
                        ? serviceFormData.skills.split(",").map((s) => s.trim())
                        : []
                )
            );
            formData.append("price", serviceFormData.price);
            formData.append("duration", serviceFormData.duration || "60"); // Default to 60 if empty
            formData.append("category", serviceFormData.category || "");

            // Add images
            serviceImagePreviews.forEach((item) => {
                formData.append("images", item.file);
            });

            const response = await addService(formData);

            if (response.success) {
                toast.showSuccess("Service added successfully!");
                setIsAddingService(false);
                setServiceFormData({
                    name: "Groundwater Survey",
                    description: "",
                    machineType: "",
                    skills: "",
                    price: "",
                    duration: "60",
                    category: "",
                });
                setServiceImagePreviews([]);
                setSelectedMachines([]);
                setCustomMachine("");
                // Reload services
                const servicesResponse = await getMyServices();
                if (servicesResponse.success) {
                    setServices(servicesResponse.data.services || []);
                }
            } else {
                setError(response.message || "Failed to add service");
            }
        } catch (err) {
            setError("Failed to add service. Please try again.");
        }
    };

    const handleEditService = (service) => {
        setEditingServiceId(service._id);

        // Parse existing machine types
        if (service.machineType) {
            const types = service.machineType.split(',').map(t => t.trim()).filter(Boolean);
            setSelectedMachines(types);
        } else {
            setSelectedMachines([]);
        }
        setCustomMachine("");

        setServiceFormData({
            name: "Groundwater Survey", // Force fixed name on edit
            description: service.description || "",
            machineType: service.machineType || "",
            skills: Array.isArray(service.skills)
                ? service.skills.join(", ")
                : "",
            price: service.price?.toString() || "",
            duration: service.duration?.toString() || "60", // Default to 60 if missing
            category: service.category || "",
        });
        setServiceImagePreviews(
            service.images?.map((img) => ({ preview: img.url, file: null })) ||
            []
        );
        setIsAddingService(true);
    };

    const handleUpdateService = async () => {
        try {
            setError("");

            if (
                !serviceFormData.name ||
                !serviceFormData.machineType ||
                !serviceFormData.price
            ) {
                setError("Please fill in all required service fields");
                return;
            }

            const updateData = {
                name: "Groundwater Survey", // Force fixed name
                description: serviceFormData.description || "",
                machineType: serviceFormData.machineType,
                skills: JSON.stringify(
                    serviceFormData.skills
                        ? serviceFormData.skills.split(",").map((s) => s.trim())
                        : []
                ),
                price: parseFloat(serviceFormData.price),
                duration: parseInt(serviceFormData.duration || "60"), // Default to 60
                category: serviceFormData.category || "",
            };

            const response = await updateService(editingServiceId, updateData);

            if (response.success) {
                // Upload new images if any
                const newImages = serviceImagePreviews.filter(
                    (item) => item.file
                );
                if (newImages.length > 0) {
                    const imageFiles = newImages.map((item) => item.file);
                    await uploadServiceImages(editingServiceId, imageFiles);
                }

                toast.showSuccess("Service updated successfully!");
                setIsAddingService(false);
                setEditingServiceId(null);
                setServiceFormData({
                    name: "Groundwater Survey",
                    description: "",
                    machineType: "",
                    skills: "",
                    price: "",
                    duration: "60",
                    category: "",
                });
                setServiceImagePreviews([]);
                setSelectedMachines([]);
                setCustomMachine("");
                // Reload services
                const servicesResponse = await getMyServices();
                if (servicesResponse.success) {
                    setServices(servicesResponse.data.services || []);
                }
            } else {
                setError(response.message || "Failed to update service");
            }
        } catch (err) {
            setError("Failed to update service. Please try again.");
        }
    };

    const handleDeleteService = (serviceId) => {
        setServiceToDelete(serviceId);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!serviceToDelete) return;

        try {
            setIsDeleting(true);
            const response = await deleteService(serviceToDelete);
            if (response.success) {
                toast.showSuccess("Service deleted successfully!");
                setShowDeleteConfirm(false);
                setServiceToDelete(null);
                // Reload services
                const servicesResponse = await getMyServices();
                if (servicesResponse.success) {
                    setServices(servicesResponse.data.services || []);
                }
                // Close preview modal if it was open
                if (previewingService && previewingService._id === serviceToDelete) {
                    setPreviewingService(null);
                }
            } else {
                setError(response.message || "Failed to delete service");
            }
        } catch (err) {
            setError("Failed to delete service. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const cancelServiceForm = () => {
        setIsAddingService(false);
        setEditingServiceId(null);
        setServiceFormData({
            name: "Groundwater Survey",
            description: "",
            machineType: "",
            skills: "",
            price: "",
            duration: "",
            category: "",
        });
        setServiceImagePreviews([]);
        setSelectedMachines([]);
        setCustomMachine("");
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F6F7F9]">
                <LoadingSpinner message="Loading your professional profile..." />
            </div>
        );
    }

    return (
        <PageContainer>
            <ErrorMessage message={error} />

            {/* Profile Header - Premium Compact Professional Look */}
            <section
                className="relative my-3 overflow-hidden rounded-2xl p-4 sm:p-5 text-white shadow-lg border border-white/10"
                style={{
                    background: "linear-gradient(135deg, #0A84FF 0%, #00C2A8 100%)",
                }}
            >
                {/* Decorative Elements */}
                <div className="absolute -top-8 -right-8 z-0 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
                <div className="absolute -bottom-8 -left-8 z-0 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>

                <div className="relative z-10 space-y-3.5">
                    {/* Top Header Row: Verified Badge & Action Button */}
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            {vendor?.isApproved && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-xs">
                                    <IoCheckmarkCircle className="text-white text-xs" /> Verified Expert
                                </span>
                            )}
                        </div>

                        {!isEditing && (
                            <button
                                onClick={handleEdit}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-white text-[#0A84FF] hover:bg-white/95 rounded-lg text-[11px] font-extrabold shadow-sm transition-all active:scale-95 cursor-pointer"
                            >
                                <IoPencilOutline className="text-xs" />
                                <span>Edit Profile</span>
                            </button>
                        )}
                    </div>

                    {/* Core Profile Row: Image + Main Details */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 text-center sm:text-left">
                        {/* Profile Avatar */}
                        <div className="relative group shrink-0">
                            <label htmlFor="profileImage" className="cursor-pointer block relative">
                                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl border-2 border-white/40 shadow-lg overflow-hidden bg-white/10 backdrop-blur-md flex items-center justify-center transition-transform hover:scale-[1.02]">
                                    {profileData.profilePicture ? (
                                        <img
                                            src={profileData.profilePicture}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
                                            <span className="text-2xl sm:text-3xl text-white">👤</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <IoCameraOutline className="text-white text-lg" />
                                    </div>
                                </div>
                                {/* Active Status Dot */}
                                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-white shadow-sm" title="Active & Available" />
                            </label>
                            <input
                                type="file"
                                id="profileImage"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={saving}
                            />
                        </div>

                        {/* Name, ID & Badges */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                            <div>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={profileData.name}
                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                        className="bg-white/20 border border-white/50 rounded-lg px-2.5 py-1 text-lg font-bold text-white focus:outline-none focus:bg-white/30 max-w-full"
                                    />
                                ) : (
                                    <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug">
                                        {profileData.name || "Professional"}
                                    </h1>
                                )}
                            </div>

                            {/* Single Sleek Metadata Row */}
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-[11px] font-medium text-white/90">
                                {(() => {
                                    const expertIdStr = vendor?.expertId || (vendor?._id ? `EXP-${vendor._id.toString().slice(-6).toUpperCase()}` : null);
                                    return expertIdStr ? (
                                        <span className="px-2 py-0.5 rounded-md bg-white/15 border border-white/20 font-bold">
                                            Expert ID: {expertIdStr}
                                        </span>
                                    ) : null;
                                })()}

                                <span className="px-2 py-0.5 rounded-md bg-white/15 border border-white/20 flex items-center gap-1">
                                    <IoBriefcaseOutline className="text-xs" />
                                    <span>{profileData.designation || "Hydrogeologist"}</span>
                                </span>

                                <span className="px-2 py-0.5 rounded-md bg-white/15 border border-white/20 flex items-center gap-1">
                                    <IoLocationOutline className="text-xs" />
                                    <span>{fullAddress ? fullAddress.split(',').pop() : 'India'}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Integrated Clean Stats Bar Footer */}
                    <div className="pt-1">
                        <div className="grid grid-cols-4 gap-1.5 bg-white/15 backdrop-blur-md rounded-xl p-2 border border-white/20 text-center divide-x divide-white/15">
                            <div className="px-1">
                                <p className="text-sm sm:text-base font-black text-white">{stats.averageRating.toFixed(1)}</p>
                                <p className="text-[9px] uppercase font-bold tracking-wider text-white/80">Rating</p>
                            </div>
                            <div className="px-1">
                                <p className="text-sm sm:text-base font-black text-white">{stats.completedBookings}</p>
                                <p className="text-[9px] uppercase font-bold tracking-wider text-white/80">Surveys</p>
                            </div>
                            <div className="px-1">
                                <p className="text-sm sm:text-base font-black text-white">{profileData.experience || 0}+</p>
                                <p className="text-[9px] uppercase font-bold tracking-wider text-white/80">Experience</p>
                            </div>
                            <div className="px-1">
                                <p className="text-sm sm:text-base font-black text-white">{new Date(vendor?.createdAt || Date.now()).getFullYear()}</p>
                                <p className="text-[9px] uppercase font-bold tracking-wider text-white/80">Joined</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Performance Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <StatItem
                    icon={IoStar}
                    label="Customer Rating"
                    value={stats.averageRating ? `${stats.averageRating.toFixed(1)} / 5.0` : "No Ratings"}
                    subValue={`${stats.totalRatings} Reviews`}
                    color="text-yellow-500"
                    bgColor="bg-yellow-50"
                />
                <StatItem
                    icon={IoCalendarOutline}
                    label="Total Bookings"
                    value={stats.completedBookings}
                    subValue="Completed"
                    color="text-blue-500"
                    bgColor="bg-blue-50"
                />
                <StatItem
                    icon={IoWalletOutline}
                    label="Total Earnings"
                    value={`₹${stats.totalEarnings.toLocaleString()}`}
                    subValue="Life-time"
                    color="text-green-500"
                    bgColor="bg-green-50"
                />
                <StatItem
                    icon={IoCheckmarkOutline}
                    label="Success Rate"
                    value={`${vendor?.rating?.successRatio || 0}%`}
                    subValue="Overall Performance"
                    color="text-teal-500"
                    bgColor="bg-teal-50"
                />
            </div>

            {isEditing ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                {/* Left Column: Account & Profile Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Section: Account Information */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <IoPersonOutline className="text-blue-500" />
                                Account Details
                            </h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InfoField
                                    label="Full Name"
                                    value={profileData.name}
                                    isEditing={isEditing}
                                    onChange={(val) => setProfileData({ ...profileData, name: val })}
                                    icon={IoPersonOutline}
                                />
                                <InfoField
                                    label="Email Address"
                                    value={profileData.email}
                                    isEditing={false} // Email typically not editable directly
                                    icon={IoCallOutline}
                                />
                                <InfoField
                                    label="Phone Number"
                                    value={profileData.phone}
                                    isEditing={isEditing}
                                    onChange={(val) => setProfileData({ ...profileData, phone: val })}
                                    icon={IoCallOutline}
                                />
                                <InfoField
                                    label="Experience (Years)"
                                    value={profileData.experience}
                                    isEditing={isEditing}
                                    onChange={(val) => setProfileData({ ...profileData, experience: val })}
                                    icon={IoConstructOutline}
                                    type="number"
                                />
                                <InfoField
                                    label="Designation"
                                    value={profileData.designation}
                                    isEditing={isEditing}
                                    onChange={(val) => setProfileData({ ...profileData, designation: val })}
                                    icon={IoBriefcaseOutline}
                                    type="select"
                                    options={['Hydrogeologist', 'Geophysicist', 'Earth Scientist', 'Detector', 'Devinor']}
                                />
                                <InfoField
                                    label="Gender"
                                    value={profileData.gender}
                                    isEditing={isEditing}
                                    onChange={(val) => setProfileData({ ...profileData, gender: val })}
                                    icon={IoPersonOutline}
                                    type="select"
                                    options={['Male', 'Female', 'Other']}
                                />
                                <InfoField
                                    label="Blood Group"
                                    value={profileData.bloodGroup}
                                    isEditing={isEditing}
                                    onChange={(val) => setProfileData({ ...profileData, bloodGroup: val })}
                                    icon={IoWaterOutline}
                                    type="select"
                                    options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Location and Service Area */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <IoLocationOutline className="text-blue-500 text-xl" />
                                Service Area &amp; Coverage
                            </h3>
                            {isEditing && (
                                <span className="text-xs font-bold text-[#0A84FF] bg-blue-50 px-2.5 py-1 rounded-full">
                                    Editing Service Area
                                </span>
                            )}
                        </div>
                        <div className="p-6">
                            {isEditing ? (
                                <div className="space-y-4">
                                    {/* Primary Service Location Search */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                            Primary Service Location *
                                        </label>
                                        <div className="relative">
                                            <PlaceAutocompleteInput
                                                onPlaceSelect={handleAddressSelect}
                                                placeholder="Enter colony, street, area or landmark..."
                                                value={fullAddress}
                                                onChange={(e) => setFullAddress(e.target.value)}
                                                disabled={saving || gettingLocation}
                                                className="w-full rounded-xl border-gray-200 bg-gray-50 p-4 pl-12 focus:border-blue-500 focus:ring-blue-500 text-sm font-medium"
                                                countryRestriction="in"
                                            />
                                            <IoLocationOutline className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 text-xl" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={getCurrentLocation}
                                            disabled={saving || gettingLocation}
                                            className="mt-2 w-full md:w-auto flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl text-xs font-extrabold hover:bg-blue-100 transition-colors cursor-pointer"
                                        >
                                            <IoLocationOutline className="text-base" />
                                            {gettingLocation ? "Detecting location..." : "GPS Pin (Use My Current Location)"}
                                        </button>
                                    </div>

                                    {/* State & District Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <CustomDropdown
                                                label="State *"
                                                name="state"
                                                options={[
                                                    { value: "", label: "Select State / UT" },
                                                    ...getStatesList().map(st => ({ value: st, label: st }))
                                                ]}
                                                value={profileData.state}
                                                onChange={(e) => {
                                                    const newState = e.target.value;
                                                    setProfileData(prev => ({
                                                        ...prev,
                                                        state: newState,
                                                        district: getDistrictsList(newState).includes(prev.district) ? prev.district : ""
                                                    }));
                                                }}
                                                disabled={saving}
                                            />
                                        </div>
                                        <div>
                                            <CustomDropdown
                                                label="District *"
                                                name="district"
                                                options={[
                                                    { value: "", label: profileData.state ? `Select District in ${profileData.state}` : "Select District" },
                                                    ...getDistrictsList(profileData.state).map(d => ({ value: d, label: d }))
                                                ]}
                                                value={profileData.district}
                                                onChange={(e) => setProfileData(prev => ({ ...prev, district: e.target.value }))}
                                                disabled={saving}
                                            />
                                        </div>
                                    </div>

                                    {/* Service Radius */}
                                    <div>
                                        <CustomDropdown
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
                                            value={profileData.serviceRadius}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, serviceRadius: e.target.value }))}
                                            disabled={saving}
                                        />
                                    </div>

                                    {/* Multiple States Multi-select (Shown when "Multiple states" is selected) */}
                                    {profileData.serviceRadius === "Multiple states" && (
                                        <div>
                                            <MultipleStatesDropdown
                                                label="Multiple states drop down menu *"
                                                value={profileData.multipleStates}
                                                onChange={(selected) => setProfileData(prev => ({ ...prev, multipleStates: selected }))}
                                                disabled={saving}
                                            />
                                        </div>
                                    )}

                                    {/* Willing to Travel Toggle */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                            Willing to Travel? *
                                        </label>
                                        <div className="grid grid-cols-2 gap-3 max-w-xs">
                                            {['Yes', 'No'].map((opt) => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => setProfileData(prev => ({ ...prev, willingToTravel: opt }))}
                                                    disabled={saving}
                                                    className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                                                        profileData.willingToTravel === opt
                                                            ? 'bg-[#0A84FF] text-white border-[#0A84FF] shadow-xs'
                                                            : 'bg-gray-50 text-slate-700 border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    {profileData.willingToTravel === opt && <IoCheckmarkOutline className="text-sm" />}
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Mode of travel & Travel charges */}
                                    {profileData.willingToTravel === "Yes" && (
                                        <div className="space-y-4 pt-3 border-t border-gray-100">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                                    Mode of travel *
                                                </label>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                                    {[
                                                        { mode: 'Bus', icon: '🚌' },
                                                        { mode: 'Car', icon: '🚗' },
                                                        { mode: 'Bike', icon: '🏍️' },
                                                        { mode: 'Train', icon: '🚆' }
                                                    ].map(({ mode, icon }) => {
                                                        const isChecked = profileData.modeOfTravel?.includes(mode);
                                                        return (
                                                            <button
                                                                key={mode}
                                                                type="button"
                                                                onClick={() => {
                                                                    setProfileData(prev => ({
                                                                        ...prev,
                                                                        modeOfTravel: isChecked
                                                                            ? prev.modeOfTravel.filter(m => m !== mode)
                                                                            : [...(prev.modeOfTravel || []), mode]
                                                                    }));
                                                                }}
                                                                disabled={saving}
                                                                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                                                                    isChecked
                                                                        ? 'bg-blue-50 border-[#0A84FF] text-[#0A84FF]'
                                                                        : 'bg-gray-50 border-gray-200 text-slate-700 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-base">{icon}</span>
                                                                    <span className="text-xs font-bold">{mode}</span>
                                                                </div>
                                                                <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                                                                    isChecked ? 'bg-[#0A84FF] border-[#0A84FF] text-white' : 'border-slate-300 bg-white'
                                                                }`}>
                                                                    {isChecked && <IoCheckmarkOutline className="text-xs stroke-[3]" />}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                    Travel Charges after Free Radius (₹ per km)
                                                </label>
                                                <div className="relative max-w-xs">
                                                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-500 font-extrabold text-sm">₹</span>
                                                    <input
                                                        type="number"
                                                        value={profileData.travelChargesPerKm}
                                                        onChange={(e) => setProfileData(prev => ({ ...prev, travelChargesPerKm: e.target.value }))}
                                                        placeholder="0.00"
                                                        min="0"
                                                        step="0.01"
                                                        disabled={saving}
                                                        className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 pl-9 pr-14 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-blue-500 outline-none"
                                                    />
                                                    <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 font-bold text-xs">/ km</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3.5 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                                            <IoHomeOutline className="text-lg" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Primary Operations Base</p>
                                            <p className="text-sm font-bold text-gray-800 break-words">{fullAddress || "Address details not provided"}</p>
                                            {(profileData.district || profileData.state) && (
                                                <p className="text-xs font-semibold text-[#0A84FF] mt-0.5">
                                                    {[profileData.district, profileData.state].filter(Boolean).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Service Radius</p>
                                            <p className="text-sm font-extrabold text-slate-800">
                                                {profileData.serviceRadius || "50 km"}
                                            </p>
                                        </div>
                                        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Willing to Travel</p>
                                            <p className="text-sm font-extrabold text-slate-800">
                                                {profileData.willingToTravel === 'Yes'
                                                    ? `Yes (${profileData.modeOfTravel?.length > 0 ? profileData.modeOfTravel.join(', ') : 'All Modes'})`
                                                    : 'No'}
                                            </p>
                                        </div>
                                        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Travel Rate</p>
                                            <p className="text-sm font-extrabold text-emerald-600">
                                                {profileData.willingToTravel === 'Yes' && parseFloat(profileData.travelChargesPerKm) > 0
                                                    ? `₹${profileData.travelChargesPerKm} / km`
                                                    : 'Standard Rates'}
                                            </p>
                                        </div>
                                    </div>

                                    {profileData.serviceRadius === "Multiple states" && profileData.multipleStates?.length > 0 && (
                                        <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100/80">
                                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">Covered States</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {profileData.multipleStates.map((st) => (
                                                    <span key={st} className="px-2.5 py-0.5 bg-white border border-blue-200 text-blue-700 text-xs font-bold rounded-lg shadow-2xs">
                                                        {st}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section: Professional Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <IoBriefcaseOutline className="text-purple-500" />
                                Professional Details
                            </h3>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Experience Details */}
                            <div>
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <IoDocumentTextOutline /> About the Expert
                                </h4>
                                {isEditing ? (
                                    <textarea
                                        value={profileData.aboutExpert}
                                        onChange={(e) => setProfileData({ ...profileData, aboutExpert: e.target.value })}
                                        className="w-full rounded-xl border-gray-200 bg-gray-50 p-4 focus:border-blue-500 focus:ring-blue-500 min-h-[120px]"
                                        placeholder="Describe your expertise, background, and specializations..."
                                    />
                                ) : (
                                    <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        {profileData.aboutExpert || vendor?.experienceDetails || "No detailed experience summary provided."}
                                    </p>
                                )}
                            </div>

                            {/* Availability Section */}
                            <div>
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <IoTimeOutline className="text-[#0A84FF] text-base" /> Availability & Schedule
                                </h4>
                                {isEditing ? (
                                    <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
                                        {/* Working Days Dropdown */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                                    <IoCalendarOutline className="text-blue-600" />
                                                    <span>Working Days</span>
                                                </label>
                                                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                                    {profileData.workingDays?.length || 0} / 7 Days Active
                                                </span>
                                            </div>
                                            <select
                                                value={detectDaysPreset(profileData.workingDays)}
                                                onChange={(e) => {
                                                    const presetKey = e.target.value;
                                                    if (presetKey !== 'CUSTOM') {
                                                        const newDays = getDaysFromPreset(presetKey);
                                                        setProfileData({ ...profileData, workingDays: newDays });
                                                    }
                                                }}
                                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-800 shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
                                            >
                                                {WORKING_DAYS_PRESETS.map((preset) => (
                                                    <option key={preset.key} value={preset.key} className="py-1">
                                                        {preset.label}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Interactive Day Pills */}
                                            <div className="pt-2">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                                        Select / Customize Days:
                                                    </span>
                                                    <span className="text-[11px] text-gray-400">
                                                        Click any day to toggle
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                                                    {ALL_WEEKDAYS.map((day) => {
                                                        const isSelected = profileData.workingDays?.some(
                                                            d => d.toLowerCase() === day.toLowerCase()
                                                        );
                                                        return (
                                                            <button
                                                                key={day}
                                                                type="button"
                                                                onClick={() => {
                                                                    const currentDays = normalizeWorkingDays(profileData.workingDays);
                                                                    const newDays = isSelected
                                                                        ? currentDays.filter(d => d.toLowerCase() !== day.toLowerCase())
                                                                        : [...currentDays, day];
                                                                    setProfileData({ ...profileData, workingDays: newDays });
                                                                }}
                                                                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none ${
                                                                    isSelected
                                                                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                                                                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-700'
                                                                }`}
                                                            >
                                                                <span>{day.substring(0, 3)}</span>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-transparent'}`} />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Working Hours Dropdown & Custom Times */}
                                        <div className="space-y-3 pt-2 border-t border-slate-200/80">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                                    <IoTimeOutline className="text-blue-600" />
                                                    <span>Working Hours</span>
                                                </label>
                                                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                    {formatWorkingHours(profileData.workingHours)}
                                                </span>
                                            </div>
                                            <select
                                                value={detectHoursPreset(profileData.workingHours)}
                                                onChange={(e) => {
                                                    const presetKey = e.target.value;
                                                    const matchedPreset = WORKING_HOURS_PRESETS.find(p => p.key === presetKey);
                                                    if (matchedPreset && presetKey !== 'CUSTOM') {
                                                        setProfileData({
                                                            ...profileData,
                                                            workingHours: {
                                                                start: matchedPreset.start,
                                                                end: matchedPreset.end,
                                                                preset: matchedPreset.key,
                                                                label: matchedPreset.label
                                                            }
                                                        });
                                                    } else if (presetKey === 'CUSTOM') {
                                                        setProfileData({
                                                            ...profileData,
                                                            workingHours: {
                                                                ...(profileData.workingHours || {}),
                                                                start: profileData.workingHours?.start || '08:00',
                                                                end: profileData.workingHours?.end || '19:00',
                                                                preset: 'CUSTOM'
                                                            }
                                                        });
                                                    }
                                                }}
                                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-800 shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
                                            >
                                                {WORKING_HOURS_PRESETS.map((preset) => (
                                                    <option key={preset.key} value={preset.key} className="py-1">
                                                        {preset.label}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Time Inputs for Custom Hours or fine adjustment */}
                                            <div className="grid grid-cols-2 gap-3 pt-1">
                                                <div className="bg-white p-2.5 rounded-xl border border-gray-200 space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                                                        Start Time
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="time"
                                                            value={profileData.workingHours?.start || "08:00"}
                                                            onChange={(e) => {
                                                                const newStart = e.target.value;
                                                                const currentHours = normalizeWorkingHours(profileData.workingHours);
                                                                setProfileData({
                                                                    ...profileData,
                                                                    workingHours: {
                                                                        ...currentHours,
                                                                        start: newStart,
                                                                        preset: 'CUSTOM'
                                                                    }
                                                                });
                                                            }}
                                                            className="w-full rounded-lg border-gray-200 bg-gray-50 p-2 text-sm font-bold text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-blue-600 block">
                                                        {formatTimeToAMPM(profileData.workingHours?.start || "08:00")}
                                                    </span>
                                                </div>

                                                <div className="bg-white p-2.5 rounded-xl border border-gray-200 space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                                                        End Time
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="time"
                                                            value={profileData.workingHours?.end || "19:00"}
                                                            onChange={(e) => {
                                                                const newEnd = e.target.value;
                                                                const currentHours = normalizeWorkingHours(profileData.workingHours);
                                                                setProfileData({
                                                                    ...profileData,
                                                                    workingHours: {
                                                                        ...currentHours,
                                                                        end: newEnd,
                                                                        preset: 'CUSTOM'
                                                                    }
                                                                });
                                                            }}
                                                            className="w-full rounded-lg border-gray-200 bg-gray-50 p-2 text-sm font-bold text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-blue-600 block">
                                                        {formatTimeToAMPM(profileData.workingHours?.end || "19:00")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Live Summary Preview */}
                                        <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/80 flex items-start gap-2.5 text-xs text-blue-900">
                                            <IoShieldCheckmarkOutline className="text-base text-blue-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold">
                                                    Schedule: {formatWorkingDays(profileData.workingDays)}
                                                </p>
                                                <p className="text-blue-700 font-medium text-[11px] mt-0.5">
                                                    Operating Hours: {formatWorkingHours(profileData.workingHours)} • Customers can book field visits on these days.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                <IoCalendarOutline className="text-blue-600" /> Working Days
                                            </p>
                                            <p className="font-extrabold text-sm text-gray-900">
                                                {formatWorkingDays(profileData.workingDays)}
                                            </p>
                                            <div className="flex flex-wrap gap-1 pt-1">
                                                {ALL_WEEKDAYS.map(day => {
                                                    const isSelected = profileData.workingDays?.some(
                                                        d => d.toLowerCase() === day.toLowerCase()
                                                    );
                                                    return (
                                                        <span
                                                            key={day}
                                                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                                isSelected
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-gray-100 text-gray-400 opacity-60'
                                                            }`}
                                                        >
                                                            {day.substring(0, 3)}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                <IoTimeOutline className="text-emerald-600" /> Working Hours
                                            </p>
                                            <p className="font-extrabold text-sm text-emerald-700">
                                                {formatWorkingHours(profileData.workingHours)}
                                            </p>
                                            <span className="inline-block text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                                                ⚡ Available for Field Appointments
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Education */}
                                <div>
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <IoSchoolOutline /> Education
                                    </h4>
                                    {vendor?.educationalQualifications && vendor.educationalQualifications.length > 0 ? (
                                        <div className="space-y-3">
                                            {vendor.educationalQualifications.map((edu, index) => (
                                                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div className="mt-1 h-2 w-2 rounded-full bg-purple-400 shrink-0"></div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{edu.degree}</p>
                                                        <p className="text-xs text-gray-600">{edu.institution}</p>
                                                        <p className="text-[10px] text-gray-400 mt-1">{edu.year} • {edu.percentage}%</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No education details added.</p>
                                    )}
                                </div>

                                {/* Instruments */}
                                <div>
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <IoHardwareChipOutline /> Instruments & Equipment
                                    </h4>
                                    {vendor?.instruments && vendor.instruments.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {vendor.instruments.map((inst, index) => (
                                                <span key={index} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 flex items-center gap-1.5">
                                                    {typeof inst === 'object' ? (
                                                        <>
                                                            <span>{inst.name || inst.category}</span>
                                                            {inst.model && <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">{inst.model}</span>}
                                                        </>
                                                    ) : (
                                                        inst
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No instruments listed.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Bank & Documents */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <IoCardOutline className="text-green-500" />
                                Bank & Documents
                            </h3>
                        </div>
                        <div className="p-6 space-y-8">
                            {/* Bank Details */}
                            <div>
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Bank Information</h4>
                                {vendor?.bankDetails ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InfoBlock label="Account Holder" value={vendor.bankDetails.accountHolderName} />
                                        <InfoBlock label="Bank Name" value={vendor.bankDetails.bankName} />
                                        <InfoBlock label="Account Number" value={vendor.bankDetails.accountNumber || "N/A"} />
                                        <InfoBlock label="IFSC Code" value={vendor.bankDetails.ifscCode} />
                                        {vendor.bankDetails.branchName && (
                                            <InfoBlock label="Branch" value={vendor.bankDetails.branchName} />
                                        )}
                                        <div className="md:col-span-2 mt-2">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${vendor.bankDetails.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {vendor.bankDetails.isVerified ? <IoCheckmarkCircle /> : <IoAlertCircleOutline />}
                                                {vendor.bankDetails.isVerified ? 'Verified Account' : 'Verification Pending'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-center">
                                        <p className="text-sm text-yellow-800 font-medium">No bank details added yet.</p>
                                    </div>
                                )}
                            </div>

                            {/* Documents */}
                            <div>
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Uploaded Documents</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <DocumentCard
                                        title="Aadhar Card"
                                        doc={vendor?.documents?.aadharCard}
                                    />
                                    <DocumentCard
                                        title="PAN Card"
                                        doc={vendor?.documents?.panCard}
                                    />
                                    <DocumentCard
                                        title="Cancelled Cheque"
                                        doc={vendor?.documents?.cancelledCheque}
                                    />
                                    {vendor?.documents?.certificates && vendor.documents.certificates.map((cert, idx) => (
                                        <DocumentCard
                                            key={idx}
                                            title={cert.name || `Certificate ${idx + 1}`}
                                            doc={cert}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Mini Dashboard Actions */}
                <div className="space-y-6">
                    {/* Verification Status Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden relative">
                        {vendor?.isApproved && (
                            <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-green-500/10 rounded-full"></div>
                        )}
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Account Status</h4>
                        <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${vendor?.isApproved ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                <IoShieldCheckmarkOutline className="text-2xl" />
                            </div>
                            <div>
                                <p className="font-extrabold text-gray-800">{vendor?.isApproved ? 'Verified Partner' : 'Verification Pending'}</p>
                                <p className="text-xs text-gray-500">{vendor?.isApproved ? 'You have full access to all features' : 'Your account is under review'}</p>
                            </div>
                        </div>
                    </div>



                    {/* Logout and Help Actions */}
                    <div className="space-y-3">
                        <ActionRow
                            icon={IoAlertCircleOutline}
                            label="Help & Disputes"
                            onClick={() => navigate("/vendor/disputes")}
                        />

                        <ActionRow
                            icon={IoLogOutOutline}
                            label="Sign Out"
                            isLogout
                            onClick={handleLogout}
                        />
                    </div>
                </div>
            </div>
            ) : (
                <VendorProfileView vendor={vendor} profileData={profileData} stats={stats} />
            )}

            {/* Reorganized Button Layout for Editing */}
            {isEditing && (
                <div className="fixed bottom-0 inset-x-0 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.1)] p-4 z-50 flex gap-4 max-w-lg mx-auto md:rounded-t-3xl border-t border-gray-100">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 h-14 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {saving ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : "Save Profile"}
                    </button>
                    <button
                        onClick={() => { setIsEditing(false); loadProfile(); }}
                        className="flex-1 h-14 bg-gray-100 text-gray-600 font-bold rounded-2xl active:scale-95 transition-all"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* My Services Section - Distinct and Professional */}
            {vendor?.isApproved && (
                <div className="mt-8 mb-4 px-1">
                    <div className="flex flex-col mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Professional Services</h2>
                            {services.length === 0 && !isAddingService && (
                                <button
                                    onClick={() => {
                                        setServiceFormData({
                                            name: "Groundwater Survey",
                                            description: "",
                                            machineType: "",
                                            skills: "",
                                            price: "",
                                            duration: "60",
                                            category: "",
                                        });
                                        setIsAddingService(true);
                                    }}
                                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-100"
                                >
                                    <IoAddCircleOutline className="text-lg" /> Add New Service
                                </button>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">info</span> <span><strong>Note:</strong> Service charge is the base fee excluding traveling to the site.</span></p>
                    </div>

                    {/* Add/Edit Service Form */}
                    {isAddingService && (
                        <div className="bg-white rounded-xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-4">
                            <h3 className="text-lg font-bold text-[#3A3A3A] mb-4">
                                {editingServiceId
                                    ? "Edit Service"
                                    : "Add New Service"}
                            </h3>
                            <div className="space-y-4">

                                {/* Service Name - Fixed Display */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[#0A84FF]">water_drop</span>
                                    <div>
                                        <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider">
                                            Service Name
                                        </label>
                                        <p className="text-lg font-bold text-[#3A3A3A]">
                                            Groundwater Survey
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                                    {/* Price */}
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-[#6B7280]">
                                            Price (₹) *
                                        </label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                            <input
                                                type="number"
                                                value={serviceFormData.price}
                                                onChange={(e) =>
                                                    setServiceFormData({
                                                        ...serviceFormData,
                                                        price: e.target.value,
                                                    })
                                                }
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                className="w-full rounded-xl border-gray-200 bg-[#F3F7FA] p-3 pl-8 text-sm font-bold text-[#3A3A3A] transition focus:border-[#0A84FF] focus:outline-none focus:ring-0 focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Images */}
                                <div>
                                    <label className="text-sm font-semibold text-[#4A4A4A] mb-3 block">
                                        Service Images
                                    </label>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                        {serviceImagePreviews.map((item, index) => (
                                            <div key={index} className="relative group rounded-xl overflow-hidden aspect-square shadow-sm border border-gray-100">
                                                <img
                                                    src={item.preview}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        onClick={() => handleRemoveServiceImage(index)}
                                                        className="bg-white/20 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                                                    >
                                                        <IoTrashOutline className="text-lg" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-[#D9DDE4] rounded-xl cursor-pointer hover:border-[#0A84FF] hover:bg-blue-50/50 transition-all group">
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
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                                    <button
                                        onClick={cancelServiceForm}
                                        className="px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={
                                            editingServiceId
                                                ? handleUpdateService
                                                : handleAddService
                                        }
                                        className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-[#0A84FF] text-white hover:bg-[#005BBB] shadow-md hover:shadow-lg transition-all"
                                    >
                                        {editingServiceId
                                            ? "Save Changes"
                                            : "Add Service"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Services List */}
                    {!isAddingService && services.length > 0 && (
                        <div className="flex flex-col gap-4">
                            {services.map((service) => (
                                <div
                                    key={service._id}
                                    className="group relative flex flex-col sm:flex-row gap-4.5 rounded-2xl bg-white p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all duration-300 border border-slate-100/90 overflow-hidden"
                                >
                                    {/* Service Image */}
                                    <div className="w-full sm:w-44 aspect-[16/10] sm:aspect-[4/3] shrink-0 rounded-xl bg-slate-50 overflow-hidden relative">
                                        {service.images && service.images.length > 0 ? (
                                            <img
                                                src={service.images[0].url}
                                                alt={service.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                                                <IoImageOutline className="text-3xl mb-1 opacity-50" />
                                                <span className="text-[11px] font-medium text-slate-400">No Image</span>
                                            </div>
                                        )}
                                        {/* Image Count Badge */}
                                        {service.images && service.images.length > 1 && (
                                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-md">
                                                +{service.images.length - 1} photos
                                            </div>
                                        )}

                                        {/* Status Badge Overlay */}
                                        <div className="absolute top-2 left-2">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs ${
                                                service.isActive
                                                    ? "bg-emerald-500/90 text-white"
                                                    : "bg-slate-500/90 text-white"
                                            }`}>
                                                {service.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-1 min-w-0">
                                                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug truncate">
                                                    {service.name}
                                                </h3>
                                                {service.machineType && (
                                                    <div className="inline-flex items-center gap-1 text-[#0A84FF] bg-blue-50 px-2 py-0.5 rounded-md text-[11px] font-bold">
                                                        <IoConstructOutline className="text-xs" />
                                                        <span>{service.machineType}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => setPreviewingService(service)}
                                                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                                                    title="View Details"
                                                >
                                                    <span className="material-symbols-outlined text-lg">visibility</span>
                                                </button>
                                                <button
                                                    onClick={() => handleEditService(service)}
                                                    className="p-1.5 text-slate-400 hover:text-[#0A84FF] hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Edit Service"
                                                >
                                                    <IoPencilOutline className="text-base" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="my-2.5">
                                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                                                {service.description || "Complete 2D/3D aquifer mapping and borewell point identification."}
                                            </p>
                                        </div>

                                        <div className="mt-auto pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                    Service Charge <span className="text-[9px] font-normal text-slate-400">(Excluding traveling)</span>
                                                </p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-lg sm:text-xl font-black text-slate-900">
                                                        ₹{service.price?.toLocaleString("en-IN") || "3,500"}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-semibold">/ visit</span>
                                                </div>
                                            </div>

                                            {/* Status Toggle - Pixel Perfect */}
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold transition-colors ${service.isActive ? "text-slate-900" : "text-slate-400"}`}>
                                                    {service.isActive ? "Online" : "Offline"}
                                                </span>
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={service.isActive || false}
                                                    onClick={async () => {
                                                        try {
                                                            const newActiveStatus = !service.isActive;
                                                            const response = await updateService(service._id, {
                                                                isActive: newActiveStatus
                                                            });
                                                            if (response.success) {
                                                                toast.showSuccess(
                                                                    newActiveStatus
                                                                        ? "Service activated"
                                                                        : "Service deactivated"
                                                                );
                                                                const servicesResponse = await getMyServices();
                                                                if (servicesResponse.success) {
                                                                    setServices(servicesResponse.data.services || []);
                                                                }
                                                            } else {
                                                                setError(response.message || "Failed to update status");
                                                            }
                                                        } catch (err) {
                                                            setError("Failed to update status");
                                                        }
                                                    }}
                                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                        service.isActive ? "bg-[#0A84FF]" : "bg-slate-300"
                                                    }`}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                            service.isActive ? "translate-x-5" : "translate-x-0"
                                                        }`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isAddingService && services.length === 0 && (
                        <div className="bg-white rounded-xl p-8 text-center shadow-[0_6px_16px_rgba(10,132,255,0.1)]">
                            <IoConstructOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4 font-medium">
                                You haven't added your service yet.
                            </p>
                            <button
                                onClick={() => {
                                    setServiceFormData({
                                        name: "Groundwater Survey",
                                        description: "",
                                        machineType: "",
                                        skills: "",
                                        price: "",
                                        duration: "60",
                                        category: "",
                                    });
                                    setIsAddingService(true);
                                }}
                                className="bg-[#0A84FF] text-white font-semibold py-3 px-8 rounded-xl hover:bg-[#005BBB] transition-colors shadow-lg hover:shadow-xl hover:scale-105 transform duration-200"
                            >
                                Setup Service
                            </button>
                        </div>
                    )}
                </div>
            )}


            {/* Preview Service Modal */}
            {
                previewingService && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setPreviewingService(null);
                            }
                        }}
                    >
                        <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                            {/* Header with Gradient */}
                            <div
                                className="flex-shrink-0 rounded-t-xl p-5 flex items-center justify-between"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #0A84FF 0%, #00C2A8 100%)",
                                }}
                            >
                                <h2 className="text-xl font-bold text-white">
                                    Service Details
                                </h2>
                                <button
                                    onClick={() => setPreviewingService(null)}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <IoCloseOutline className="text-2xl text-white" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6 bg-[#F3F7FA]">
                                <div className="space-y-5">
                                    {/* Service Images */}
                                    {previewingService.images &&
                                        previewingService.images.length > 0 && (
                                            <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                                        image
                                                    </span>
                                                    <h3 className="text-sm font-semibold text-[#3A3A3A]">
                                                        Service Images
                                                    </h3>
                                                </div>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {previewingService.images.map(
                                                        (image, index) => (
                                                            <div
                                                                key={index}
                                                                className="relative w-full rounded-lg overflow-hidden"
                                                            >
                                                                <img
                                                                    src={image.url}
                                                                    alt={`Service ${index + 1}`}
                                                                    className="w-full h-auto object-cover rounded-lg"
                                                                />
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {/* Service Name */}
                                    <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                                design_services
                                            </span>
                                            <label className="block text-sm font-semibold text-[#3A3A3A]">
                                                Service Name
                                            </label>
                                        </div>
                                        <p className="text-base font-bold text-[#3A3A3A]">
                                            {previewingService.name}
                                        </p>
                                    </div>

                                    {/* Description */}
                                    {previewingService.description && (
                                        <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                                    description
                                                </span>
                                                <label className="block text-sm font-semibold text-[#3A3A3A]">
                                                    Description
                                                </label>
                                            </div>
                                            <p className="text-sm text-[#6B7280] leading-relaxed">
                                                {previewingService.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Machine Type */}
                                    {previewingService.machineType && (
                                        <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                                    precision_manufacturing
                                                </span>
                                                <label className="block text-sm font-semibold text-[#3A3A3A]">
                                                    Machine Type
                                                </label>
                                            </div>
                                            <p className="text-sm text-[#3A3A3A]">
                                                {previewingService.machineType}
                                            </p>
                                        </div>
                                    )}

                                    {/* Price */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                                    payments
                                                </span>
                                                <label className="block text-sm font-semibold text-[#3A3A3A]">
                                                    Price <span className="text-xs font-normal text-gray-500">(Excluding traveling)</span>
                                                </label>
                                            </div>
                                            <p className="text-base font-semibold text-[#0A84FF]">
                                                ₹
                                                {previewingService.price?.toLocaleString(
                                                    "en-IN",
                                                    {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    }
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Category and Status in Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {previewingService.category && (
                                            <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                                        category
                                                    </span>
                                                    <label className="block text-sm font-semibold text-[#3A3A3A]">
                                                        Category
                                                    </label>
                                                </div>
                                                <p className="text-sm text-[#3A3A3A]">
                                                    {previewingService.category}
                                                </p>
                                            </div>
                                        )}

                                        {/* Status */}
                                        <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                                    info
                                                </span>
                                                <label className="block text-sm font-semibold text-[#3A3A3A]">
                                                    Status
                                                </label>
                                            </div>
                                            <span
                                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${previewingService.status ===
                                                    "APPROVED"
                                                    ? "bg-green-100 text-green-700"
                                                    : previewingService.status ===
                                                        "PENDING"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : previewingService.status ===
                                                            "REJECTED"
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-gray-100 text-gray-700"
                                                    }`}
                                            >
                                                {previewingService.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Skills */}
                                    {previewingService.skills &&
                                        previewingService.skills.length > 0 && (
                                            <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                                        star
                                                    </span>
                                                    <label className="block text-sm font-semibold text-[#3A3A3A]">
                                                        Skills
                                                    </label>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {previewingService.skills.map(
                                                        (skill, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-3 py-1.5 bg-[#0A84FF]/10 text-[#0A84FF] rounded-full text-xs font-medium"
                                                            >
                                                                {skill}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {/* Active Status */}
                                    <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                                toggle_on
                                            </span>
                                            <label className="block text-sm font-semibold text-[#3A3A3A]">
                                                Active Status
                                            </label>
                                        </div>
                                        <span
                                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${previewingService.isActive
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-100 text-gray-700"
                                                }`}
                                        >
                                            {previewingService.isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer with Actions */}
                            <form className="flex-shrink-0 border-t border-gray-100 bg-white p-5 flex gap-3 justify-start rounded-b-xl">
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleEditService(previewingService);
                                        setPreviewingService(null);
                                    }}
                                    className="bg-[#0A84FF] text-white py-3.5 px-6 rounded-lg hover:bg-[#005BBB] transition-colors flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                                    disabled={
                                        isAddingService || editingServiceId !== null
                                    }
                                >
                                    <span className="material-symbols-outlined text-base">
                                        edit
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleDeleteService(previewingService._id);
                                        setPreviewingService(null);
                                    }}
                                    className="bg-red-500 text-white py-3.5 px-6 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                                    disabled={
                                        isAddingService || editingServiceId !== null
                                    }
                                >
                                    <span className="material-symbols-outlined text-base">
                                        delete
                                    </span>
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Delete Service Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setServiceToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Service"
                message="Are you sure you want to delete this service? This action cannot be undone and the service will be permanently removed from the database."
                confirmText="Yes, Delete"
                cancelText="Cancel"
                confirmColor="danger"
                isLoading={isDeleting}
            />

            {/* Groundwater Survey FAQs & Disclaimer (at the very bottom of profile) */}
            <div className="mb-6">
                <GroundwaterSurveyFAQSection />
            </div>
        </PageContainer>
    );
}

/* -------------------- REUSABLE COMPONENTS -------------------- */

function StatItem({ icon, label, value, subValue, color, bgColor }) {
    const Icon = icon;
    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${bgColor}`}>
                <Icon className={`text-xl ${color}`} />
            </div>
            <div>
                <p className="text-[10px] items-center font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                <p className="text-lg font-extrabold text-gray-800 leading-none mt-1">{value}</p>
                <p className="text-[10px] font-medium text-gray-500 mt-1">{subValue}</p>
            </div>
        </div>
    );
}

function InfoField({ icon, label, value, isEditing, onChange, type = "text", options }) {
    const Icon = icon;
    return (
        <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Icon className="text-sm" />
                {label}
            </label>
            {isEditing ? (
                type === "select" ? (
                    <div className="relative">
                        <select
                            value={value || ""}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all appearance-none"
                        >
                            <option value="">Select Value</option>
                            {options.map((opt, i) => (
                                <option key={i} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <IoChevronForwardOutline className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
                    </div>
                ) : (
                    <input
                        type={type}
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                )
            ) : (
                <div className="px-1">
                    <p className="text-base font-extrabold text-gray-800">{value || "Not specified"}</p>
                </div>
            )}
        </div>
    );
}

function InfoRow({
    icon,
    label,
    value,
    isEditing,
    onChange,
    disabled,
    type = "text",
}) {
    const IconComponent = icon;
    return (
        <div className="flex items-start gap-4 p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 shrink-0">
                <IconComponent className="text-lg text-gray-400" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                    {label}
                </span>
                {isEditing ? (
                    <input
                        type={type}
                        value={value || ""}
                        onChange={onChange}
                        disabled={disabled}
                        className="w-full mt-1 text-sm font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                    />
                ) : (
                    <span className="text-base font-extrabold text-gray-800 mt-0.5">
                        {value || "Not provided"}
                    </span>
                )}
            </div>
        </div>
    );
}

function ActionRow({ icon, label, isLogout, onClick }) {
    const IconComponent = icon;
    return (
        <div
            onClick={onClick}
            className="flex h-14 w-full cursor-pointer items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
            <div className="flex items-center gap-4">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${isLogout ? "bg-red-50" : "bg-gray-50"
                        }`}
                >
                    <IconComponent
                        className={`text-xl ${isLogout ? "text-red-500" : "text-gray-600 group-hover:text-blue-500 transition-colors"
                            }`}
                    />
                </div>
                <p
                    className={`text-sm font-black ${isLogout ? "text-red-600" : "text-gray-800"
                        }`}
                >
                    {label}
                </p>
            </div>
            <IoChevronForwardOutline className="text-xl text-gray-300 group-hover:text-gray-500" />
        </div>
    );
}

function InfoBlock({ label, value }) {
    return (
        <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">{label}</p>
            <p className="text-sm font-bold text-gray-800">{value || "Not provided"}</p>
        </div>
    );
}

function DocumentCard({ title, doc }) {
    if (!doc) return null;
    return (
        <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100 gap-3 group hover:border-blue-200 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                <IoDocumentTextOutline className="text-xl" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-700 truncate">{title}</p>
                <p className="text-[10px] text-gray-400">
                    Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
            </div>
            {doc.url && (
                <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                    title="View Document"
                >
                    <IoCloudUploadOutline className="text-lg" />
                </a>
            )}
        </div>
    );
}