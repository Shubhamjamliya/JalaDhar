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
    IoAlertCircleOutline,
    IoStar,
    IoStarOutline,
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
} from "../../../services/vendorApi";
import PageContainer from "../../shared/components/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import PlaceAutocompleteInput from "../../../components/PlaceAutocompleteInput";
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
        experience: "",
        address: {
            coordinates: null,
            geoLocation: null
        },
        profilePicture: null,
    });

    useEffect(() => {
        loadProfile();
    }, []);

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
                    experience: vendorData.experience?.toString() || "",
                    address: address,
                    profilePicture:
                        vendorData.documents?.profilePicture?.url || null,
                });

                setFullAddress(fullAddressStr);
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

    const handleLogout = async () => {
        if (window.confirm("Are you sure you want to logout?")) {
            await logout();
            navigate("/vendorlogin");
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

        // Store in registration format
        setProfileData(prev => ({
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
                name: profileData.name,
                phone: profileData.phone,
                experience: parseInt(profileData.experience) || 0,
                address: addressToSave, // Send as object, not stringified
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
                setError(response.message || "Failed to update profile");
            }
        } catch (err) {
            setError("Failed to update profile. Please try again.");
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
            formData.append("name", "Ground Water Detection"); // Force fixed name
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
                    name: "Ground Water Detection",
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
            name: "Ground Water Detection", // Force fixed name on edit
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
                name: "Ground Water Detection", // Force fixed name
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
                    name: "Ground Water Detection",
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
            name: "Ground Water Detection",
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
            <PageContainer>
                <LoadingSpinner message="Loading profile..." />
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <ErrorMessage message={error} />

            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="mb-4 flex items-center gap-2 text-[#3A3A3A] hover:text-[#0A84FF] transition-colors"
            >
                <IoArrowBackOutline className="text-lg" />
                <span className="text-sm font-medium">Back</span>
            </button>

            {/* Profile Header with Light Blue Gradient */}
            <section
                className="relative my-4 overflow-hidden rounded-xl p-8 text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                style={{
                    background: "linear-gradient(to bottom, #E3F2FD 0%, #BBDEFB 50%, #90CAF9 100%)",
                }}
            >
                <div className="absolute -top-1/4 -right-1/4 z-0 h-48 w-48 rounded-full bg-white/10"></div>
                <div className="absolute -bottom-1/4 -left-1/4 z-0 h-40 w-40 rounded-full bg-white/5"></div>

                <div className="relative z-10 flex flex-col items-center gap-5 pt-4">
                    {/* Profile Image with Camera Overlay */}
                    <div className="relative">
                        <label
                            htmlFor="profileImage"
                            className="cursor-pointer"
                        >
                            <div className="relative">
                                {/* Light Blue Background Circle */}
                                <div className="absolute inset-0 bg-blue-200 rounded-full scale-110 blur-sm opacity-30 transition-opacity"></div>
                                <div className="relative h-28 w-28 shrink-0 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center ring-4 ring-white/30">
                                    {profileData.profilePicture ? (
                                        <img
                                            src={profileData.profilePicture}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-[#BBDEFB] to-[#90CAF9] flex items-center justify-center">
                                            <span className="text-4xl">👤</span>
                                        </div>
                                    )}
                                </div>
                                {/* Camera Icon Overlay - Outside circle to overlap */}
                                <div className="absolute -bottom-1 -right-1 h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg border-4 border-white hover:bg-blue-700 transition-colors z-10">
                                    <IoCameraOutline className="text-white text-lg" />
                                </div>
                            </div>
                            <input
                                type="file"
                                id="profileImage"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={saving}
                            />
                        </label>
                    </div>

                    {/* Name + Email */}
                    <div className="flex flex-col items-center text-center space-y-1 w-full px-4">
                        {isEditing ? (
                            <input
                                type="text"
                                value={profileData.name}
                                onChange={(e) =>
                                    setProfileData({
                                        ...profileData,
                                        name: e.target.value,
                                    })
                                }
                                className="w-full max-w-xs text-xl font-bold leading-tight text-center bg-white/20 backdrop-blur-sm border border-white/50 rounded-xl px-4 py-2.5 text-white placeholder-white/70 focus:outline-none focus:border-white/80 focus:bg-white/30 transition-all"
                                placeholder="Your Name"
                                disabled={saving}
                            />
                        ) : (
                            <>
                                <p className="text-2xl font-bold leading-tight tracking-tight break-words max-w-full px-4 text-gray-800">
                                    {profileData.name || "Vendor"}
                                </p>
                            </>
                        )}
                        <p className="text-sm font-medium text-gray-700 mt-1 break-words max-w-full px-4">
                            {profileData.email}
                        </p>
                        {/* Rating Display */}
                        {vendor?.rating && vendor.rating.totalRatings > 0 && (
                            <div className="flex flex-col items-center gap-1 mt-2">
                                <div className="flex items-center gap-1">
                                    <span className="text-2xl font-bold text-gray-800">
                                        {vendor.rating.averageRating.toFixed(1)}
                                    </span>
                                    <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <IoStar
                                                key={star}
                                                className={`text-lg ${star <= Math.round(vendor.rating.averageRating)
                                                    ? "text-yellow-500"
                                                    : "text-gray-300"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-600">
                                    {vendor.rating.totalRatings} {vendor.rating.totalRatings === 1 ? "rating" : "ratings"}
                                    {vendor.rating.successRatio > 0 && (
                                        <span className="ml-2">
                                            • {vendor.rating.successRatio}% success rate
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Vendor Information Card */}
            <div className="w-full mt-6 rounded-xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-[#3A3A3A]">
                        Personal Information
                    </h3>
                    {/* Edit Profile Button - Top Right */}
                    {!isEditing && (
                        <button
                            onClick={handleEdit}
                            className="flex h-8 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#0A84FF] to-[#00C2A8] text-white text-xs font-semibold px-3 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] shrink-0"
                        >
                            <IoPencilOutline className="text-sm" />
                            <span>Edit Profile</span>
                        </button>
                    )}
                </div>
                <div className="flex flex-col space-y-4 w-full">
                    {/* Name */}
                    <InfoRow
                        icon={IoPersonOutline}
                        label="Name"
                        value={profileData.name}
                        isEditing={isEditing}
                        onChange={(e) =>
                            setProfileData({
                                ...profileData,
                                name: e.target.value,
                            })
                        }
                        disabled={saving}
                    />

                    {/* Phone */}
                    <InfoRow
                        icon={IoCallOutline}
                        label="Phone Number"
                        value={profileData.phone}
                        isEditing={isEditing}
                        onChange={(e) =>
                            setProfileData({
                                ...profileData,
                                phone: e.target.value,
                            })
                        }
                        disabled={saving}
                    />

                    {/* Experience */}
                    <InfoRow
                        icon={IoConstructOutline}
                        label="Experience (Years)"
                        value={profileData.experience}
                        isEditing={isEditing}
                        onChange={(e) =>
                            setProfileData({
                                ...profileData,
                                experience: e.target.value,
                            })
                        }
                        disabled={saving}
                        type="number"
                    />

                    {/* Address */}
                    {isEditing ? (
                        <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-[#F3F7FA] transition-colors">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 shrink-0 border-2 border-white shadow-sm">
                                <IoHomeOutline className="text-xl text-white" />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0 gap-3 w-full overflow-hidden">
                                <span className="text-xs text-[#6B7280] mb-1 font-semibold uppercase tracking-wide">
                                    Primary Address
                                </span>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="relative flex-1">
                                        <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 text-lg z-10">
                                            search
                                        </span>
                                        <PlaceAutocompleteInput
                                            onPlaceSelect={handleAddressSelect}
                                            placeholder="Start typing your address to see suggestions..."
                                            value={fullAddress}
                                            onChange={(e) => setFullAddress(e.target.value)}
                                            disabled={saving || gettingLocation}
                                            className="w-full rounded-full border-gray-200 bg-[#F3F7FA] py-2.5 pl-12 pr-4 text-[#3A3A3A] shadow-sm focus:border-[#0A84FF] focus:ring-[#0A84FF] text-sm"
                                            countryRestriction="in"
                                            types={["geocode", "establishment"]}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={getCurrentLocation}
                                        disabled={saving || gettingLocation}
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
                        </div>
                    ) : (
                        <InfoRow
                            icon={IoHomeOutline}
                            label="Primary Address"
                            value={fullAddress || "Not provided"}
                            isEditing={false}
                        />
                    )}
                </div>
            </div>

            {/* Save/Cancel Buttons - When Editing */}
            {isEditing && (
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex h-14 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[#0A84FF] to-[#00C2A8] text-white font-bold shadow-[0_4px_12px_rgba(10,132,255,0.3)] transition-all hover:shadow-[0_6px_16px_rgba(10,132,255,0.4)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                Saving...
                            </span>
                        ) : (
                            <>
                                <IoCheckmarkOutline className="mr-2 text-xl" />
                                Save Changes
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setIsEditing(false);
                            loadProfile(); // Reload to reset changes
                        }}
                        disabled={saving}
                        className="flex h-14 flex-1 items-center justify-center rounded-xl bg-gray-200 text-[#3A3A3A] font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all hover:bg-gray-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Services Section (Only if approved) */}
            {vendor?.isApproved && (
                <div className="w-full mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-[#3A3A3A]">
                            My Services
                        </h2>
                        {/* Only show Add button if no services exist and not currently adding */}
                        {services.length === 0 && !isAddingService && (
                            <button
                                onClick={() => {
                                    setServiceFormData({
                                        name: "Ground Water Detection",
                                        description: "",
                                        machineType: "",
                                        skills: "",
                                        price: "",
                                        duration: "60", // Default duration
                                        category: "",
                                    });
                                    setIsAddingService(true);
                                }}
                                className="flex items-center gap-2 bg-[#0A84FF] text-white font-semibold py-2 px-4 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:bg-[#005BBB] transition-colors"
                            >
                                <IoAddCircleOutline className="text-lg" />
                                Add Service
                            </button>
                        )}
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
                                            Ground Water Detection
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

                    {/* Services List - Only Show First Service if Exists */}
                    {!isAddingService && services.length > 0 && (
                        <div className="flex flex-col">
                            {/* We only show the first service as per requirement */}
                            {[services[0]].map((service) => (
                                <div
                                    key={service._id}
                                    className="group relative flex flex-col sm:flex-row gap-6 rounded-2xl bg-white p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden"
                                >
                                    {/* Service Image */}
                                    <div className="w-full sm:w-64 aspect-[4/3] sm:aspect-square shrink-0 rounded-xl bg-gray-50 overflow-hidden relative">
                                        {service.images && service.images.length > 0 ? (
                                            <img
                                                src={service.images[0].url}
                                                alt={service.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                                                <IoImageOutline className="text-4xl mb-2 opacity-50" />
                                                <span className="text-xs font-medium">No Image</span>
                                            </div>
                                        )}
                                        {/* Image Count Badge */}
                                        {service.images && service.images.length > 1 && (
                                            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded-md backdrop-blur-md">
                                                +{service.images.length - 1} photos
                                            </div>
                                        )}

                                        {/* Status Badge Overlay */}
                                        <div className="absolute top-3 left-3">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-md shadow-sm ${service.isActive
                                                ? "bg-green-500/90 text-white"
                                                : "bg-gray-500/90 text-white"
                                                }`}>
                                                {service.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                                                    {service.name}
                                                </h2>
                                                {service.machineType && (
                                                    <div className="flex items-center gap-1.5 text-blue-600">
                                                        <IoConstructOutline className="text-sm" />
                                                        <span className="text-sm font-semibold">{service.machineType}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setPreviewingService(service)}
                                                    className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                                                    title="View Details"
                                                >
                                                    <span className="material-symbols-outlined text-xl">visibility</span>
                                                </button>
                                                <button
                                                    onClick={() => handleEditService(service)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                    title="Edit Service"
                                                >
                                                    <IoPencilOutline className="text-xl" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4 mb-6">
                                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                                                {service.description || "No description provided."}
                                            </p>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-gray-50 flex items-end justify-between">
                                            <div>
                                                <p className="text-xs text-gray-400 font-medium mb-0.5 uppercase tracking-wider">Service Charge</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-bold text-gray-900">
                                                        ₹{service.price?.toLocaleString("en-IN")}
                                                    </span>
                                                    <span className="text-sm text-gray-500 font-medium">/ visit</span>
                                                </div>
                                            </div>

                                            {/* Status Toggle */}
                                            <div className="flex items-center gap-3">
                                                <span className={`text-sm font-medium transition-colors ${service.isActive ? "text-gray-700" : "text-gray-400"}`}>
                                                    {service.isActive ? "Online" : "Offline"}
                                                </span>
                                                <label className="relative inline-flex cursor-pointer items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        checked={service.isActive || false}
                                                        onChange={async (e) => {
                                                            try {
                                                                const newActiveStatus = e.target.checked;
                                                                const response = await updateService(service._id, {
                                                                    isActive: newActiveStatus
                                                                });
                                                                if (response.success) {
                                                                    toast.showSuccess(
                                                                        newActiveStatus
                                                                            ? "Service activated"
                                                                            : "Service deactivated"
                                                                    );
                                                                    // Reload services
                                                                    const servicesResponse = await getMyServices();
                                                                    if (servicesResponse.success) {
                                                                        setServices(servicesResponse.data.services || []);
                                                                    }
                                                                } else {
                                                                    setError(response.message || "Failed to update status");
                                                                    e.target.checked = !newActiveStatus;
                                                                }
                                                            } catch (err) {
                                                                setError("Failed to update status");
                                                                e.target.checked = !e.target.checked;
                                                            }
                                                        }}
                                                    />
                                                    <div className="peer h-7 w-12 rounded-full bg-gray-200 after:absolute after:top-[2px] after:left-[2px] after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:bg-[#0A84FF] peer-checked:after:translate-x-full peer-focus:outline-none ring-2 ring-transparent peer-focus:ring-blue-100"></div>
                                                </label>
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
                                        name: "Ground Water Detection",
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
            {previewingService && (
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
                                                                alt={`Service ${index + 1
                                                                    }`}
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

                                {/* Price and Duration */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                                payments
                                            </span>
                                            <label className="block text-sm font-semibold text-[#3A3A3A]">
                                                Price
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
                                    {previewingService.duration && (
                                        <div className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-[#00C2A8] text-lg">
                                                    schedule
                                                </span>
                                                <label className="block text-sm font-semibold text-[#3A3A3A]">
                                                    Duration
                                                </label>
                                            </div>
                                            <p className="text-sm text-[#3A3A3A]">
                                                {previewingService.duration}{" "}
                                                minutes
                                            </p>
                                        </div>
                                    )}
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
            )}

            {/* Action List */}
            <div className="w-full mt-6 space-y-3">
                <ActionRow
                    icon={IoAlertCircleOutline}
                    label="Dispute & Help"
                    onClick={() => navigate("/vendor/disputes")}
                />
                <ActionRow
                    icon={IoLogOutOutline}
                    label="Logout"
                    isLogout
                    onClick={handleLogout}
                />
            </div>

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
        </PageContainer>
    );
}

/* -------------------- REUSABLE COMPONENTS -------------------- */

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
        <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#F3F7FA] transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500 shrink-0 flex-shrink-0 border-2 border-white shadow-sm">
                <IconComponent className="text-lg text-white" />
            </div>
            <div className="flex flex-col flex-1 min-w-0 w-full overflow-hidden">
                <span className="text-xs text-[#6B7280] mb-1 font-semibold uppercase tracking-wide truncate">
                    {label}
                </span>
                {isEditing ? (
                    <input
                        type={type}
                        value={value || ""}
                        onChange={onChange}
                        disabled={disabled}
                        className="w-full text-base font-semibold text-[#3A3A3A] bg-[#F3F7FA] border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#0A84FF] focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)] disabled:opacity-50 transition-all"
                    />
                ) : (
                    <span className="text-base font-semibold text-[#3A3A3A] break-words">
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
            className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.12)] transition-all"
        >
            <div className="flex items-center gap-4">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${isLogout ? "bg-red-100" : "bg-[#00C2A8]/10"
                        }`}
                >
                    <IconComponent
                        className={`text-xl ${isLogout ? "text-red-500" : "text-[#00C2A8]"
                            }`}
                    />
                </div>
                <p
                    className={`flex-1 truncate text-base font-medium ${isLogout ? "text-red-500" : "text-[#3A3A3A]"
                        }`}
                >
                    {label}
                </p>
            </div>
            <IoChevronForwardOutline className="text-xl text-[#6B7280]" />
        </div>
    );
}