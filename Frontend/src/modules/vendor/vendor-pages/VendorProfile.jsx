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
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import SuccessMessage from "../../shared/components/SuccessMessage";

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
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        phone: "",
        experience: "",
        address: {
            street: "",
            city: "",
            state: "",
            pincode: "",
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
                        console.error("Load services error:", err);
                    }
                }
                
                // Map backend data to frontend form structure
                setProfileData({
                    name: vendorData.name || "",
                    email: vendorData.email || "",
                    phone: vendorData.phone || "",
                    experience: vendorData.experience?.toString() || "",
                    address: vendorData.address || {
                        street: "",
                        city: "",
                        state: "",
                        pincode: "",
                    },
                    profilePicture: vendorData.documents?.profilePicture?.url || null,
                });
            } else {
                setError("Failed to load profile");
            }
        } catch (err) {
            console.error("Load profile error:", err);
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

    const handleSave = async () => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const updateData = {
                name: profileData.name,
                phone: profileData.phone,
                experience: parseInt(profileData.experience) || 0,
                address: JSON.stringify(profileData.address),
            };

            const response = await updateVendorProfile(updateData);
            
            if (response.success) {
                // Upload profile picture if changed
                if (profileData.profilePicture && typeof profileData.profilePicture === 'object') {
                    try {
                        await uploadProfilePicture(profileData.profilePicture);
                    } catch (err) {
                        console.error("Profile picture upload error:", err);
                    }
                }

                setSuccess("Profile updated successfully!");
                setIsEditing(false);
                await loadProfile();
            } else {
                setError(response.message || "Failed to update profile");
            }
        } catch (err) {
            console.error("Save profile error:", err);
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
                    profilePicture: response.data.profilePicture?.url || response.data.profilePicture,
                });
                setSuccess("Profile picture updated successfully!");
            } else {
                setError(response.message || "Failed to upload profile picture");
            }
        } catch (err) {
            console.error("Upload image error:", err);
            setError(err.response?.data?.message || "Failed to upload profile picture");
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
                    setServiceImagePreviews([...serviceImagePreviews, ...newPreviews]);
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

            if (!serviceFormData.name || !serviceFormData.machineType || !serviceFormData.price || !serviceFormData.duration) {
                setError("Please fill in all required service fields");
                return;
            }

            const formData = new FormData();
            formData.append('name', serviceFormData.name);
            formData.append('description', serviceFormData.description || '');
            formData.append('machineType', serviceFormData.machineType);
            formData.append('skills', JSON.stringify(serviceFormData.skills ? serviceFormData.skills.split(',').map(s => s.trim()) : []));
            formData.append('price', serviceFormData.price);
            formData.append('duration', serviceFormData.duration);
            formData.append('category', serviceFormData.category || '');

            // Add images
            serviceImagePreviews.forEach((item) => {
                formData.append('images', item.file);
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
            console.error("Add service error:", err);
            setError("Failed to add service. Please try again.");
        }
    };

    const handleEditService = (service) => {
        setEditingServiceId(service._id);
        setServiceFormData({
            name: service.name || "",
            description: service.description || "",
            machineType: service.machineType || "",
            skills: Array.isArray(service.skills) ? service.skills.join(', ') : "",
            price: service.price?.toString() || "",
            duration: service.duration?.toString() || "",
            category: service.category || "",
        });
        setServiceImagePreviews(service.images?.map(img => ({ preview: img.url, file: null })) || []);
        setIsAddingService(true);
    };

    const handleUpdateService = async () => {
        try {
            setError("");
            setSuccess("");

            if (!serviceFormData.name || !serviceFormData.machineType || !serviceFormData.price || !serviceFormData.duration) {
                setError("Please fill in all required service fields");
                return;
            }

            const updateData = {
                name: serviceFormData.name,
                description: serviceFormData.description || '',
                machineType: serviceFormData.machineType,
                skills: JSON.stringify(serviceFormData.skills ? serviceFormData.skills.split(',').map(s => s.trim()) : []),
                price: parseFloat(serviceFormData.price),
                duration: parseInt(serviceFormData.duration),
                category: serviceFormData.category || ''
            };

            const response = await updateService(editingServiceId, updateData);
            
            if (response.success) {
                // Upload new images if any
                const newImages = serviceImagePreviews.filter(item => item.file);
                if (newImages.length > 0) {
                    const imageFiles = newImages.map(item => item.file);
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
            console.error("Update service error:", err);
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
            console.error("Delete service error:", err);
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
        return <LoadingSpinner message="Loading profile..." />;
    }

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <div className="min-h-screen w-full bg-[#F6F7F9] px-4 py-6">
                <ErrorMessage message={error} />
                <SuccessMessage message={success} />

                {/* Profile Header */}
                <div className="flex flex-col items-center gap-6 text-center">
                    {/* Profile Image */}
                    <div className="relative">
                        <label htmlFor="profileImage" className="cursor-pointer">
                            <div
                                className="h-32 w-32 rounded-full bg-gray-200 bg-cover bg-center bg-no-repeat shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                                style={{
                                    backgroundImage: profileData.profilePicture
                                        ? `url('${profileData.profilePicture}')`
                                        : "none",
                                }}
                            >
                                {!profileData.profilePicture && (
                                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-4xl text-gray-400">
                                            👤
                                        </span>
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
                    <div className="flex flex-col">
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
                                className="text-[22px] font-bold leading-tight text-center bg-white border border-[#D9DDE4] rounded-[8px] px-4 py-2 focus:outline-none focus:border-[#0A84FF]"
                                disabled={saving}
                            />
                        ) : (
                            <p className="text-[22px] font-bold leading-tight text-gray-800">
                                {profileData.name || "Vendor"}
                            </p>
                        )}
                        <p className="text-base text-gray-500">
                            {profileData.email}
                        </p>
                    </div>
                </div>

                {/* Vendor Information Card */}
                <div className="w-full mt-8 rounded-[12px] bg-white p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col space-y-6">
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
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#0A84FF] to-[#00C2A8] bg-opacity-10">
                                    <IoHomeOutline className="text-2xl text-[#0A84FF]" />
                                </div>
                                <div className="flex flex-col flex-1 gap-2">
                                    <span className="text-xs text-gray-500 mb-1">Primary Address</span>
                                    <input
                                        type="text"
                                        placeholder="Street"
                                        value={profileData.address.street || ""}
                                        onChange={(e) =>
                                            setProfileData({
                                                ...profileData,
                                                address: {
                                                    ...profileData.address,
                                                    street: e.target.value,
                                                },
                                            })
                                        }
                                        className="text-base font-medium text-gray-800 bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-1.5 focus:outline-none focus:border-[#0A84FF]"
                                        disabled={saving}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            placeholder="City"
                                            value={profileData.address.city || ""}
                                            onChange={(e) =>
                                                setProfileData({
                                                    ...profileData,
                                                    address: {
                                                        ...profileData.address,
                                                        city: e.target.value,
                                                    },
                                                })
                                            }
                                            className="text-base font-medium text-gray-800 bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-1.5 focus:outline-none focus:border-[#0A84FF]"
                                            disabled={saving}
                                        />
                                        <input
                                            type="text"
                                            placeholder="State"
                                            value={profileData.address.state || ""}
                                            onChange={(e) =>
                                                setProfileData({
                                                    ...profileData,
                                                    address: {
                                                        ...profileData.address,
                                                        state: e.target.value,
                                                    },
                                                })
                                            }
                                            className="text-base font-medium text-gray-800 bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-1.5 focus:outline-none focus:border-[#0A84FF]"
                                            disabled={saving}
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Pincode"
                                        value={profileData.address.pincode || ""}
                                        onChange={(e) =>
                                            setProfileData({
                                                ...profileData,
                                                address: {
                                                    ...profileData.address,
                                                    pincode: e.target.value,
                                                },
                                            })
                                        }
                                        className="text-base font-medium text-gray-800 bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-1.5 focus:outline-none focus:border-[#0A84FF]"
                                        disabled={saving}
                                    />
                                </div>
                            </div>
                        ) : (
                            <InfoRow
                                icon={IoHomeOutline}
                                label="Primary Address"
                                value={
                                    profileData.address?.street
                                        ? `${profileData.address.street}, ${profileData.address.city}, ${profileData.address.state} ${profileData.address.pincode}`
                                        : "Not provided"
                                }
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
                            className="flex h-12 flex-1 items-center justify-center rounded-[10px] bg-[#0A84FF] text-white font-bold shadow-[0px_4px_10px_rgba(0,0,0,0.05)] transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                loadProfile(); // Reload to reset changes
                            }}
                            disabled={saving}
                            className="flex h-12 flex-1 items-center justify-center rounded-[10px] bg-gray-500 text-white font-bold shadow-[0px_4px_10px_rgba(0,0,0,0.05)] transition-transform hover:scale-[1.02] disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleEdit}
                        className="mt-6 flex h-12 w-full items-center justify-center rounded-[10px] bg-[#0A84FF] text-white font-bold shadow-[0px_4px_10px_rgba(0,0,0,0.05)] transition-transform hover:scale-[1.02]"
                    >
                        <IoPencilOutline className="mr-2 text-lg" />
                        Edit Profile
                    </button>
                )}

                {/* Services Section (Only if approved) */}
                {vendor?.isApproved && (
                    <div className="w-full mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-800">My Services</h2>
                            {!isAddingService && (
                                <button
                                    onClick={() => setIsAddingService(true)}
                                    className="flex items-center gap-2 bg-[#0A84FF] text-white font-semibold py-2 px-4 rounded-[10px] shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:bg-[#005BBB] transition-colors"
                                >
                                    <IoAddCircleOutline className="text-lg" />
                                    Add Service
                                </button>
                            )}
                        </div>

                        {/* Add/Edit Service Form */}
                        {isAddingService && (
                            <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] mb-4">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                    {editingServiceId ? "Edit Service" : "Add New Service"}
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-[#4A4A4A] mb-2 block">
                                                Service Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={serviceFormData.name}
                                                onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                                                placeholder="e.g., Ground Water Detection"
                                                className="w-full bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-[#4A4A4A] mb-2 block">
                                                Machine Type *
                                            </label>
                                            <input
                                                type="text"
                                                value={serviceFormData.machineType}
                                                onChange={(e) => setServiceFormData({ ...serviceFormData, machineType: e.target.value })}
                                                placeholder="e.g., Water Detection Machine"
                                                className="w-full bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-[#4A4A4A] mb-2 block">
                                            Description
                                        </label>
                                        <textarea
                                            value={serviceFormData.description}
                                            onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                                            placeholder="Describe your service..."
                                            rows="3"
                                            className="w-full bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-[#4A4A4A] mb-2 block">
                                                Price (₹) *
                                            </label>
                                            <input
                                                type="number"
                                                value={serviceFormData.price}
                                                onChange={(e) => setServiceFormData({ ...serviceFormData, price: e.target.value })}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                className="w-full bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-[#4A4A4A] mb-2 block">
                                                Duration (minutes) *
                                            </label>
                                            <input
                                                type="number"
                                                value={serviceFormData.duration}
                                                onChange={(e) => setServiceFormData({ ...serviceFormData, duration: e.target.value })}
                                                placeholder="e.g., 120"
                                                min="1"
                                                className="w-full bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-[#4A4A4A] mb-2 block">
                                            Service Images
                                        </label>
                                        {serviceImagePreviews.length > 0 && (
                                            <div className="grid grid-cols-4 gap-2 mb-2">
                                                {serviceImagePreviews.map((item, index) => (
                                                    <div key={index} className="relative">
                                                        <img
                                                            src={item.preview}
                                                            alt={`Preview ${index + 1}`}
                                                            className="w-full h-24 object-cover rounded-[8px]"
                                                        />
                                                        <button
                                                            onClick={() => handleRemoveServiceImage(index)}
                                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                                        >
                                                            <IoCloseOutline className="text-sm" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#D9DDE4] rounded-[8px] cursor-pointer hover:border-[#0A84FF] transition-colors">
                                            <IoImageOutline className="text-2xl text-gray-400 mb-1" />
                                            <p className="text-xs text-gray-500">Add Service Images</p>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                multiple
                                                onChange={handleServiceImageChange}
                                            />
                                        </label>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={cancelServiceForm}
                                            className="px-4 py-2 border border-gray-300 rounded-[8px] text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={editingServiceId ? handleUpdateService : handleAddService}
                                            className="px-4 py-2 bg-[#0A84FF] text-white rounded-[8px] hover:bg-[#005BBB] transition-colors"
                                        >
                                            {editingServiceId ? "Update Service" : "Add Service"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Services List */}
                        <div className="space-y-4">
                            {services.length === 0 ? (
                                <div className="bg-white rounded-[12px] p-8 text-center shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                                    <IoConstructOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">No services added yet</p>
                                    <p className="text-sm text-gray-500 mt-2">Add your first service to get started</p>
                                </div>
                            ) : (
                                services.map((service) => (
                                    <div key={service._id} className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="text-lg font-bold text-gray-800">{service.name}</h4>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                        service.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                        service.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                        service.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {service.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">{service.description || "No description"}</p>
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                    <span><strong>Machine:</strong> {service.machineType}</span>
                                                    <span><strong>Price:</strong> ₹{service.price}</span>
                                                    <span><strong>Duration:</strong> {service.duration} min</span>
                                                    {service.category && <span><strong>Category:</strong> {service.category}</span>}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => handleEditService(service)}
                                                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                                >
                                                    <IoPencilOutline className="text-lg" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteService(service._id)}
                                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                >
                                                    <IoTrashOutline className="text-lg" />
                                                </button>
                                            </div>
                                        </div>
                                        {service.images && service.images.length > 0 && (
                                            <div className="grid grid-cols-4 gap-2 mt-4">
                                                {service.images.map((img, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={img.url}
                                                        alt={`${service.name} ${idx + 1}`}
                                                        className="w-full h-24 object-cover rounded-[8px]"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
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
            </div>
        </div>
    );
}

/* -------------------- REUSABLE COMPONENTS -------------------- */

function InfoRow({ icon, label, value, isEditing, onChange, disabled, type = "text" }) {
    const IconComponent = icon;
    return (
        <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#0A84FF] to-[#00C2A8] bg-opacity-10">
                <IconComponent className="text-2xl text-[#0A84FF]" />
            </div>
            <div className="flex flex-col flex-1">
                <span className="text-xs text-gray-500 mb-1">{label}</span>
                {isEditing ? (
                    <input
                        type={type}
                        value={value || ""}
                        onChange={onChange}
                        disabled={disabled}
                        className="text-base font-medium text-gray-800 bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-1.5 focus:outline-none focus:border-[#0A84FF] disabled:opacity-50"
                    />
                ) : (
                    <span className="text-base font-medium text-gray-800">
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
            className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 rounded-[12px] bg-white p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all"
        >
            <div className="flex items-center gap-4">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${
                        isLogout ? "bg-red-500/10" : "bg-[#0A84FF]/10"
                    }`}
                >
                    <IconComponent
                        className={`text-2xl ${
                            isLogout ? "text-red-500" : "text-[#0A84FF]"
                        }`}
                    />
                </div>
                <p
                    className={`flex-1 truncate text-base font-medium ${
                        isLogout ? "text-red-500" : "text-gray-800"
                    }`}
                >
                    {label}
                </p>
            </div>
            <IoChevronForwardOutline className="text-2xl text-gray-400" />
        </div>
    );
}
