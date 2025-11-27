import { useState, useEffect } from "react";
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
import SuccessMessage from "../../shared/components/SuccessMessage";
import PlaceAutocompleteInput from "../../../components/PlaceAutocompleteInput";

// Get API key at module level
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export default function VendorProfile() {
    const navigate = useNavigate();
    const { logout, vendor: authVendor } = useVendorAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [vendor, setVendor] = useState(null);
    const [services, setServices] = useState([]);
    const [isAddingService, setIsAddingService] = useState(false);
    const [editingServiceId, setEditingServiceId] = useState(null);
    const [previewingService, setPreviewingService] = useState(null);
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
        setSuccess("Address auto-filled from selected location");
    };

    // Get current location using browser geolocation API
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        setGettingLocation(true);
        setError("");
        setSuccess("");

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
                setSuccess("Location found! Address auto-filled.");
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
            setSuccess("");

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

                setSuccess("Profile updated successfully!");
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
                setSuccess("Profile picture updated successfully!");
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
            setSuccess("");

            if (
                !serviceFormData.name ||
                !serviceFormData.machineType ||
                !serviceFormData.price ||
                !serviceFormData.duration
            ) {
                setError("Please fill in all required service fields");
                return;
            }

            const formData = new FormData();
            formData.append("name", serviceFormData.name);
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
            formData.append("duration", serviceFormData.duration);
            formData.append("category", serviceFormData.category || "");

            // Add images
            serviceImagePreviews.forEach((item) => {
                formData.append("images", item.file);
            });

            const response = await addService(formData);

            if (response.success) {
                setSuccess("Service added successfully!");
                setIsAddingService(false);
                setServiceFormData({
                    name: "",
                    description: "",
                    machineType: "",
                    skills: "",
                    price: "",
                    duration: "",
                    category: "",
                });
                setServiceImagePreviews([]);
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
        setServiceFormData({
            name: service.name || "",
            description: service.description || "",
            machineType: service.machineType || "",
            skills: Array.isArray(service.skills)
                ? service.skills.join(", ")
                : "",
            price: service.price?.toString() || "",
            duration: service.duration?.toString() || "",
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
            setSuccess("");

            if (
                !serviceFormData.name ||
                !serviceFormData.machineType ||
                !serviceFormData.price ||
                !serviceFormData.duration
            ) {
                setError("Please fill in all required service fields");
                return;
            }

            const updateData = {
                name: serviceFormData.name,
                description: serviceFormData.description || "",
                machineType: serviceFormData.machineType,
                skills: JSON.stringify(
                    serviceFormData.skills
                        ? serviceFormData.skills.split(",").map((s) => s.trim())
                        : []
                ),
                price: parseFloat(serviceFormData.price),
                duration: parseInt(serviceFormData.duration),
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

                setSuccess("Service updated successfully!");
                setIsAddingService(false);
                setEditingServiceId(null);
                setServiceFormData({
                    name: "",
                    description: "",
                    machineType: "",
                    skills: "",
                    price: "",
                    duration: "",
                    category: "",
                });
                setServiceImagePreviews([]);
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

    const handleDeleteService = async (serviceId) => {
        if (!window.confirm("Are you sure you want to delete this service?")) {
            return;
        }

        try {
            const response = await deleteService(serviceId);
            if (response.success) {
                setSuccess("Service deleted successfully!");
                // Reload services
                const servicesResponse = await getMyServices();
                if (servicesResponse.success) {
                    setServices(servicesResponse.data.services || []);
                }
            } else {
                setError(response.message || "Failed to delete service");
            }
        } catch (err) {
            setError("Failed to delete service. Please try again.");
        }
    };

    const cancelServiceForm = () => {
        setIsAddingService(false);
        setEditingServiceId(null);
        setServiceFormData({
            name: "",
            description: "",
            machineType: "",
            skills: "",
            price: "",
            duration: "",
            category: "",
        });
        setServiceImagePreviews([]);
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
            <SuccessMessage message={success} />

            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="mb-4 flex items-center gap-2 text-[#3A3A3A] hover:text-[#0A84FF] transition-colors"
            >
                <IoArrowBackOutline className="text-lg" />
                <span className="text-sm font-medium">Back</span>
            </button>

            {/* Profile Header with Gradient */}
            <section
                className="relative my-4 overflow-hidden rounded-xl p-8 text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                style={{
                    background:
                        "linear-gradient(135deg, #0A84FF 0%, #00C2A8 100%)",
                }}
            >
                <div className="absolute -top-1/4 -right-1/4 z-0 h-48 w-48 rounded-full bg-white/10"></div>
                <div className="absolute -bottom-1/4 -left-1/4 z-0 h-40 w-40 rounded-full bg-white/5"></div>
                <div className="absolute top-4 left-6 z-10">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium opacity-90">
                            Profile
                        </p>
                        <div className="h-2 w-2 rounded-full bg-red-400"></div>
                    </div>
                </div>

                <div className="relative z-10 flex flex-col items-center gap-5 pt-4">
                    {/* Profile Image with Yellow Background Circle */}
                    <div className="relative">
                        <label
                            htmlFor="profileImage"
                            className="cursor-pointer group"
                        >
                            <div className="relative">
                                {/* Yellow Background Circle */}
                                <div className="absolute inset-0 bg-yellow-400 rounded-full scale-110 blur-sm opacity-30 group-hover:opacity-50 transition-opacity"></div>
                                <div className="relative h-28 w-28 shrink-0 rounded-full border-4 border-white/80 shadow-xl overflow-hidden bg-white flex items-center justify-center ring-4 ring-white/30">
                                    {profileData.profilePicture ? (
                                        <img
                                            src={profileData.profilePicture}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-[#0A84FF] to-[#00C2A8] flex items-center justify-center">
                                            <span className="text-4xl">👤</span>
                                        </div>
                            )}
                        </div>
                        {isEditing && (
                                    <div className="absolute -bottom-1 -right-1 bg-[#0A84FF] rounded-full p-2 shadow-lg border-2 border-white">
                                        <IoPencilOutline className="text-white text-sm" />
                                    </div>
                                )}
                            </div>
                            {isEditing && (
                                <input
                                    type="file"
                                    id="profileImage"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={saving}
                                />
                            )}
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
                                <p className="text-2xl font-bold leading-tight tracking-tight break-words max-w-full px-4">
                                    {profileData.name || "Vendor"}
                                </p>
                            </>
                        )}
                        <p className="text-sm font-medium opacity-90 mt-1 break-words max-w-full px-4">
                            {profileData.email}
                        </p>
                            </div>
                    </div>
            </section>

            {/* Vendor Information Card */}
            <div className="w-full mt-6 rounded-xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden">
                <h3 className="text-lg font-bold text-[#3A3A3A] mb-6">
                    Personal Information
                    </h3>
                <div className="flex flex-col space-y-6 w-full">
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
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00C2A8]/10 shrink-0">
                                <IoHomeOutline className="text-xl text-[#00C2A8]" />
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

            {/* Edit Profile Button */}
                                {isEditing ? (
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
            ) : (
                <button
                    onClick={handleEdit}
                    className="mt-6 flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#0A84FF] to-[#00C2A8] text-white font-bold shadow-[0_4px_12px_rgba(10,132,255,0.3)] transition-all hover:shadow-[0_6px_16px_rgba(10,132,255,0.4)] hover:scale-[1.02]"
                >
                    <IoPencilOutline className="mr-2 text-xl" />
                    Edit Profile
                </button>
            )}

            {/* Services Section (Only if approved) */}
            {vendor?.isApproved && (
                <div className="w-full mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-[#3A3A3A]">
                            My Services
                        </h2>
                        {!isAddingService && (
                            <button
                                onClick={() => setIsAddingService(true)}
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-[#6B7280]">
                                            Service Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={serviceFormData.name}
                                            onChange={(e) =>
                                                setServiceFormData({
                                                    ...serviceFormData,
                                                    name: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., Ground Water Detection"
                                            className="w-full rounded-lg border-gray-200 bg-[#F3F7FA] p-3 text-sm transition focus:border-[#0A84FF] focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-[#6B7280]">
                                            Machine Type *
                                        </label>
                                        <input
                                            type="text"
                                            value={serviceFormData.machineType}
                                            onChange={(e) =>
                                                setServiceFormData({
                                                    ...serviceFormData,
                                                    machineType: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., Water Detection Machine"
                                            className="w-full rounded-lg border-gray-200 bg-[#F3F7FA] p-3 text-sm transition focus:border-[#0A84FF] focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
                                        />
                                        </div>
                                        </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-[#6B7280]">
                                        Description
                                    </label>
                                    <textarea
                                        value={serviceFormData.description}
                                        onChange={(e) =>
                                            setServiceFormData({
                                                ...serviceFormData,
                                                description: e.target.value,
                                            })
                                        }
                                        placeholder="Describe your service..."
                                        rows="3"
                                        className="w-full rounded-lg border-gray-200 bg-[#F3F7FA] p-3 text-sm transition focus:border-[#0A84FF] focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-[#6B7280]">
                                            Price (₹) *
                                        </label>
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
                                            className="w-full rounded-lg border-gray-200 bg-[#F3F7FA] p-3 text-sm transition focus:border-[#0A84FF] focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-[#6B7280]">
                                            Duration (minutes) *
                                        </label>
                                        <input
                                            type="number"
                                            value={serviceFormData.duration}
                                            onChange={(e) =>
                                                setServiceFormData({
                                                    ...serviceFormData,
                                                    duration: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., 120"
                                            min="1"
                                            className="w-full rounded-lg border-gray-200 bg-[#F3F7FA] p-3 text-sm transition focus:border-[#0A84FF] focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
                                        />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-[#4A4A4A] mb-2 block">
                                        Service Images
                            </label>
                                    {serviceImagePreviews.length > 0 && (
                                        <div className="grid grid-cols-4 gap-2 mb-2">
                                            {serviceImagePreviews.map(
                                                (item, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative"
                                                    >
                                                        <img
                                                            src={item.preview}
                                                            alt={`Preview ${
                                                                index + 1
                                                            }`}
                                                className="w-full h-24 object-cover rounded-[8px]"
                                            />
                                                <button
                                                    onClick={() =>
                                                                handleRemoveServiceImage(
                                                                    index
                                                                )
                                                    }
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                                >
                                                    <IoCloseOutline className="text-sm" />
                                                </button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#D9DDE4] rounded-[8px] cursor-pointer hover:border-[#0A84FF] transition-colors">
                                    <IoImageOutline className="text-2xl text-gray-400 mb-1" />
                                    <p className="text-xs text-gray-500">
                                            Add Service Images
                                    </p>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        multiple
                                            onChange={handleServiceImageChange}
                                    />
                                </label>
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={cancelServiceForm}
                                        className="px-6 bg-gray-200 text-[#3A3A3A] font-semibold py-3 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={
                                            editingServiceId
                                                ? handleUpdateService
                                                : handleAddService
                                        }
                                        className="px-6 bg-[#0A84FF] text-white font-semibold py-3 rounded-lg hover:bg-[#005BBB] transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                                    >
                                        {editingServiceId
                                            ? "Update"
                                            : "Add Service"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Services List */}
                    <div className="flex flex-col gap-5">
                        {services.length === 0 ? (
                            <div className="bg-white rounded-xl p-8 text-center shadow-[0_6px_16px_rgba(10,132,255,0.1)]">
                                <IoConstructOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 mb-4">
                                    No services added yet
                                </p>
                                <button
                                    onClick={() => setIsAddingService(true)}
                                    className="bg-[#0A84FF] text-white font-semibold py-2 px-6 rounded-lg hover:bg-[#005BBB] transition-colors"
                                >
                                    Add Your First Service
                                </button>
                        </div>
                        ) : (
                            services.map((service) => (
                                <div
                                    key={service._id}
                                    className="flex flex-col rounded-xl bg-white p-4 shadow-[0_6px_16px_rgba(10,132,255,0.1)]"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Service Image */}
                                        {service.images &&
                                        service.images.length > 0 ? (
                                            <div
                                                className="h-24 w-24 shrink-0 rounded-lg bg-cover bg-center bg-no-repeat"
                                                style={{
                                                    backgroundImage: `url("${service.images[0].url}")`,
                                                }}
                                            ></div>
                                        ) : (
                                            <div className="h-24 w-24 shrink-0 rounded-lg bg-gray-200 flex items-center justify-center">
                                                <IoImageOutline className="text-3xl text-gray-400" />
                    </div>
                                        )}

                                        <div className="flex-1">
                                            <h2 className="text-base font-bold text-[#3A3A3A]">
                                                {service.name}
                                            </h2>
                                            {service.description && (
                                                <p className="mt-1 text-xs text-[#6B7280]">
                                                    {service.description}
                                                </p>
                                            )}
                                            <p className="mt-2 text-base font-semibold text-[#0A84FF]">
                                                ₹
                                                {service.price?.toLocaleString(
                                                    "en-IN",
                                                    {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    }
                                                )}
                                                {service.duration &&
                                                    ` / ${service.duration} min`}
                                            </p>
                </div>

                                        <button
                                            onClick={() =>
                                                setPreviewingService(service)
                                            }
                                            className="text-[#00C2A8] self-start"
                                            disabled={
                                                isAddingService ||
                                                editingServiceId !== null
                                            }
                                        >
                                            <span className="material-symbols-outlined">
                                                visibility
                                            </span>
                                        </button>
                                    </div>

                                    <div className="mt-4 flex items-center justify-end border-t border-gray-100 pt-3">
                                        <label className="switch-container relative inline-flex cursor-pointer items-center">
                                            <input
                                                checked={
                                                    service.isActive || false
                                                }
                                                className="peer sr-only"
                                                type="checkbox"
                                                readOnly
                                            />
                                            <div
                                                className={`slider peer h-6 w-10 rounded-full after:absolute after:top-[4px] after:left-[4px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:content-[''] peer-focus:outline-none transition-all ${
                                                    service.isActive
                                                        ? "bg-[#0A84FF] after:translate-x-4"
                                                        : "bg-gray-200"
                                                }`}
                                            ></div>
                                            <span className="ml-3 text-sm font-medium text-[#3A3A3A]">
                                                {service.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
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
                                                                alt={`Service ${
                                                                    index + 1
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
                                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                                previewingService.status ===
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
                                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                            previewingService.isActive
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
                                    if (
                                        window.confirm(
                                            "Are you sure you want to delete this service?"
                                        )
                                    ) {
                                        handleDeleteService(
                                            previewingService._id
                                        );
                                        setPreviewingService(null);
                                    }
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
                    icon={IoLogOutOutline}
                    label="Logout"
                    isLogout
                    onClick={handleLogout}
                />
            </div>
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
        <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-[#F3F7FA] transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00C2A8]/10 shrink-0 flex-shrink-0">
                <IconComponent className="text-xl text-[#00C2A8]" />
            </div>
            <div className="flex flex-col flex-1 min-w-0 w-full overflow-hidden">
                <span className="text-xs text-[#6B7280] mb-2 font-semibold uppercase tracking-wide truncate">
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
                    className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${
                        isLogout ? "bg-red-100" : "bg-[#00C2A8]/10"
                    }`}
                >
                    <IconComponent
                        className={`text-xl ${
                            isLogout ? "text-red-500" : "text-[#00C2A8]"
                        }`}
                    />
                </div>
                <p
                    className={`flex-1 truncate text-base font-medium ${
                        isLogout ? "text-red-500" : "text-[#3A3A3A]"
                    }`}
                >
                {label}
                </p>
                </div>
            <IoChevronForwardOutline className="text-xl text-[#6B7280]" />
        </div>
    );
}