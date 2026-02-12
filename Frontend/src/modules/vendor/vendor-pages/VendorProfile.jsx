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
        address: {
            coordinates: null,
            geoLocation: null
        },
        profilePicture: null,
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
                    address: address,
                    profilePicture:
                        vendorData.documents?.profilePicture?.url || null,
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
                bloodGroup: profileData.bloodGroup,
                gender: profileData.gender,
                designation: profileData.designation,
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
            <div className="flex h-screen items-center justify-center bg-[#F6F7F9]">
                <LoadingSpinner message="Loading your professional profile..." />
            </div>
        );
    }

    return (
        <PageContainer>
            <ErrorMessage message={error} />

            {/* Profile Header - Premium Professional Look */}
            <section
                className="relative my-4 overflow-hidden rounded-2xl p-6 text-white shadow-xl"
                style={{
                    background: "linear-gradient(135deg, #0A84FF 0%, #00C2A8 100%)",
                }}
            >
                {/* Decorative Elements */}
                <div className="absolute -top-10 -right-10 z-0 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 z-0 h-40 w-40 rounded-full bg-white/5 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    {/* Profile Image with Status Indicator */}
                    <div className="relative group">
                        <label htmlFor="profileImage" className="cursor-pointer block relative">
                            <div className="h-32 w-32 rounded-2xl border-4 border-white/30 shadow-2xl overflow-hidden bg-white/20 backdrop-blur-md flex items-center justify-center transition-transform hover:scale-[1.02]">
                                {profileData.profilePicture ? (
                                    <img
                                        src={profileData.profilePicture}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
                                        <span className="text-5xl text-white">👤</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <IoCameraOutline className="text-white text-3xl" />
                                </div>
                            </div>
                            {/* Availability Dot */}
                            <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-green-500 border-4 border-white shadow-lg"></div>
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

                    {/* Name & Title */}
                    <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                        <div className="flex items-center gap-2 mb-1">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    className="bg-white/20 border border-white/50 rounded-lg px-3 py-1 text-2xl font-bold text-white focus:outline-none focus:bg-white/30 truncate max-w-[200px]"
                                />
                            ) : (
                                <h1 className="text-3xl font-extrabold tracking-tight">
                                    {profileData.name || "Professional"}
                                </h1>
                            )}
                            {vendor?.isApproved && (
                                <div className="bg-white text-[#0A84FF] p-1 rounded-full shadow-lg" title="Verified Professional">
                                    <IoShieldCheckmarkOutline className="text-xl" />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
                                <IoBriefcaseOutline className="text-sm" />
                                <span className="text-sm font-medium">{profileData.designation || "Ground Water Professional"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
                                <IoLocationOutline className="text-sm" />
                                <span className="text-sm font-medium">{fullAddress ? fullAddress.split(',').pop() : 'Location N/A'}</span>
                            </div>
                        </div>

                        {!isEditing && (
                            <button
                                onClick={handleEdit}
                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-white text-[#0A84FF] rounded-xl text-sm font-bold shadow-lg hover:bg-blue-50 transition-colors"
                            >
                                <IoPencilOutline />
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {/* Quick Stats in Header */}
                    <div className="flex gap-4 md:border-l md:border-white/20 md:pl-8">
                        <div className="text-center">
                            <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Rating</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{stats.completedBookings}</p>
                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Jobs</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{profileData.experience}+</p>
                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Years</p>
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
                    icon={IoRibbonOutline}
                    label="Membership"
                    value={vendor?.isApproved ? "Verified Pro" : "Pending"}
                    subValue="Account Status"
                    color="text-teal-500"
                    bgColor="bg-teal-50"
                />
            </div>

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

                    {/* Section: Location and Address */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <IoLocationOutline className="text-red-500" />
                                Service Location
                            </h3>
                        </div>
                        <div className="p-6">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <PlaceAutocompleteInput
                                            onPlaceSelect={handleAddressSelect}
                                            placeholder="Update your primary address..."
                                            value={fullAddress}
                                            onChange={(e) => setFullAddress(e.target.value)}
                                            disabled={saving || gettingLocation}
                                            className="w-full rounded-xl border-gray-200 bg-gray-50 p-4 pl-12 focus:border-blue-500 focus:ring-blue-500"
                                            countryRestriction="in"
                                        />
                                        <IoLocationOutline className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 text-xl" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={getCurrentLocation}
                                        disabled={saving || gettingLocation}
                                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-100 transition-colors"
                                    >
                                        <IoLocationOutline className="text-lg" />
                                        {gettingLocation ? "Detecting location..." : "Use My Current GPS Location"}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                        <IoHomeOutline className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Primary Operations Base</p>
                                        <p className="text-base font-semibold text-gray-800">{fullAddress || "Address details not provided"}</p>
                                    </div>
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
                                    <IoDocumentTextOutline /> Experience Summary
                                </h4>
                                <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    {vendor?.experienceDetails || "No detailed experience summary provided."}
                                </p>
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
                                                <span key={index} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
                                                    {inst}
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
                                        <InfoBlock label="Account Number" value={vendor.bankDetails.accountNumber ? `••••${vendor.bankDetails.accountNumber.slice(-4)}` : "N/A"} />
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
                <div className="mt-12 mb-20 px-1">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Professional Services</h2>
                        {services.length === 0 && !isAddingService && (
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
                                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-100"
                            >
                                <IoAddCircleOutline className="text-lg" /> Add New Service
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

                    {/* Services List */}
                    {!isAddingService && services.length > 0 && (
                        <div className="flex flex-col gap-6">
                            {services.map((service) => (
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