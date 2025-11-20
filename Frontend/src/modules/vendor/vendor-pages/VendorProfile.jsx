import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoPencilOutline,
    IoLogOutOutline,
    IoImageOutline,
    IoCheckmarkOutline,
    IoCloseOutline,
    IoAddCircleOutline,
    IoTrashOutline,
    IoConstructOutline,
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
    deleteServiceImage
} from "../../../services/vendorApi";

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
        images: []
    });
    const [serviceImagePreviews, setServiceImagePreviews] = useState([]);
    const [profileData, setProfileData] = useState({
        profileImage: null,
        profileImageUrl: null,
        fullName: "",
        email: "",
        mobile: "",
        aadhaarNo: "",
        panNo: "",
        aadhaarImage: null,
        aadhaarImageUrl: null,
        panImage: null,
        panImageUrl: null,
        education: "",
        institution: "",
        experienceYears: "",
        experienceDetails: "",
        certificates: [],
        bankName: "",
        accountHolderName: "",
        accountNo: "",
        ifsc: "",
        branchName: "",
        cancelledCheck: null,
        cancelledCheckUrl: null,
        fullAddress: "",
        address: {
            street: "",
            city: "",
            state: "",
            pincode: ""
        }
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
                    profileImage: null,
                    profileImageUrl: vendorData.documents?.profilePicture?.url || null,
                    fullName: vendorData.name || "",
                    email: vendorData.email || "",
                    mobile: vendorData.phone || "",
                    aadhaarNo: "", // Not stored in backend separately
                    panNo: "", // Not stored in backend separately
                    aadhaarImage: null,
                    aadhaarImageUrl: vendorData.documents?.aadharCard?.url || null,
                    panImage: null,
                    panImageUrl: vendorData.documents?.panCard?.url || null,
                    education: vendorData.educationalQualifications?.[0]?.degree || "",
                    institution: vendorData.educationalQualifications?.[0]?.institution || "",
                    experienceYears: vendorData.experience?.toString() || "",
                    experienceDetails: "",
                    certificates: vendorData.documents?.certificates?.map(cert => cert.url) || [],
                    bankName: vendorData.bankDetails?.bankName || "",
                    accountHolderName: vendorData.bankDetails?.accountHolderName || "",
                    accountNo: vendorData.bankDetails?.accountNumber || "",
                    ifsc: vendorData.bankDetails?.ifscCode || "",
                    branchName: vendorData.bankDetails?.branchName || "",
                    cancelledCheck: null,
                    cancelledCheckUrl: vendorData.documents?.cancelledCheque?.url || null,
                    fullAddress: "",
                    address: {
                        street: vendorData.address?.street || "",
                        city: vendorData.address?.city || "",
                        state: vendorData.address?.state || "",
                        pincode: vendorData.address?.pincode || ""
                    }
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
        await logout();
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");

            // Prepare profile update data
            const updateData = {
                name: profileData.fullName,
                phone: profileData.mobile,
                experience: parseInt(profileData.experienceYears) || 0,
                address: JSON.stringify(profileData.address),
                bankDetails: JSON.stringify({
                    accountHolderName: profileData.accountHolderName,
                    accountNumber: profileData.accountNo,
                    ifscCode: profileData.ifsc,
                    bankName: profileData.bankName,
                    branchName: profileData.branchName || ""
                }),
                educationalQualifications: JSON.stringify([{
                    degree: profileData.education,
                    institution: profileData.institution,
                    year: new Date().getFullYear(),
                    percentage: null
                }])
            };

            // Update profile
            const response = await updateVendorProfile(updateData);
            
            if (response.success) {
                // Upload profile picture if changed
                if (profileData.profileImage) {
                    try {
                        await uploadProfilePicture(profileData.profileImage);
                    } catch (err) {
                        console.error("Profile picture upload error:", err);
                        // Continue even if picture upload fails
                    }
                }

                setSuccess("Profile updated successfully!");
                setIsEditing(false);
                // Reload profile to get updated data
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

    const handleCancel = () => {
        // Reload from backend
        loadProfile();
        setIsEditing(false);
    };

    const handleImageChange = (field, e) => {
        const file = e.target.files[0];
        if (file) {
            // Store file for upload
            setProfileData({ ...profileData, [field]: file });
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileData(prev => ({ 
                    ...prev, 
                    [field]: file,
                    [`${field}Url`]: reader.result 
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCertificateChange = (e) => {
        const files = Array.from(e.target.files);
        const fileReaders = files.map((file) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve({ file, url: reader.result });
                reader.readAsDataURL(file);
            });
        });

        Promise.all(fileReaders).then((results) => {
            setProfileData({
                ...profileData,
                certificates: [...profileData.certificates, ...results.map(r => r.url)],
            });
        });
    };

    const handleRemoveCertificate = (index) => {
        const newCertificates = profileData.certificates.filter(
            (_, i) => i !== index
        );
        setProfileData({ ...profileData, certificates: newCertificates });
    };

    const maskAccountNo = (accountNo) => {
        if (!accountNo) return "";
        if (accountNo.length <= 4) return accountNo;
        return "****" + accountNo.slice(-4);
    };

    const maskIFSC = (ifsc) => {
        if (!ifsc) return "";
        if (ifsc.length <= 2) return ifsc;
        return ifsc.slice(0, 2) + "****" + ifsc.slice(-2);
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
                setSuccess("Service added successfully! Waiting for admin approval.");
                setIsAddingService(false);
                setServiceFormData({
                    name: "",
                    description: "",
                    machineType: "",
                    skills: "",
                    price: "",
                    duration: "",
                    category: "",
                    images: []
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
            images: []
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
                    images: []
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
            images: []
        });
        setServiceImagePreviews([]);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A84FF] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <div className="max-w-2xl mx-auto">
                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-600">{success}</p>
                    </div>
                )}

                {/* Profile Header */}
                <div className="flex flex-col items-center mb-8">
                    {/* Profile Picture */}
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-white shadow-md mb-4 flex items-center justify-center overflow-hidden">
                            {profileData.profileImageUrl ? (
                                <img
                                    src={profileData.profileImageUrl}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-4xl text-gray-400">👤</span>
                            )}
                        </div>
                        {isEditing && (
                            <label className="absolute bottom-0 right-0 bg-[#0A84FF] text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-[#005BBB] transition-colors">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) =>
                                        handleImageChange("profileImage", e)
                                    }
                                />
                                <IoPencilOutline className="text-sm" />
                            </label>
                        )}
                    </div>

                    {/* User Name and Edit Button */}
                    <div className="flex items-center gap-4 w-full justify-center">
                        {isEditing ? (
                            <input
                                type="text"
                                value={profileData.fullName}
                                onChange={(e) =>
                                    setProfileData({
                                        ...profileData,
                                        fullName: e.target.value,
                                    })
                                }
                                className="text-2xl font-bold text-gray-800 bg-white border border-[#D9DDE4] rounded-[8px] px-4 py-2 focus:outline-none focus:border-[#0A84FF]"
                            />
                        ) : (
                            <h1 className="text-2xl font-bold text-gray-800">
                                {profileData.fullName || authVendor?.name || "Vendor Name"}
                            </h1>
                        )}
                        {!isEditing ? (
                            <button
                                onClick={handleEdit}
                                className="bg-gradient-to-r from-[#0A84FF] to-[#005BBB] text-white font-semibold py-2 px-6 rounded-[10px] shadow-md hover:opacity-90 transition-opacity flex items-center gap-2"
                            >
                                <IoPencilOutline className="text-lg" />
                                Edit Profile
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-[#0A84FF] text-white font-semibold py-2 px-4 rounded-[10px] shadow-md hover:bg-[#005BBB] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <IoCheckmarkOutline className="text-lg" />
                                    {saving ? "Saving..." : "Save"}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={saving}
                                    className="bg-gray-500 text-white font-semibold py-2 px-4 rounded-[10px] shadow-md hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <IoCloseOutline className="text-lg" />
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 1: Basic Details */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Basic Details
                    </h3>
                    <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] space-y-4">
                        <EditableField
                            label="Full Name"
                            value={profileData.fullName}
                            onChange={(e) =>
                                setProfileData({
                                    ...profileData,
                                    fullName: e.target.value,
                                })
                            }
                            isEditing={isEditing}
                        />
                        <EditableField
                            label="Email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) =>
                                setProfileData({
                                    ...profileData,
                                    email: e.target.value,
                                })
                            }
                            isEditing={isEditing}
                            disabled={true}
                        />
                        <EditableField
                            label="Mobile"
                            type="tel"
                            value={profileData.mobile}
                            onChange={(e) =>
                                setProfileData({
                                    ...profileData,
                                    mobile: e.target.value,
                                })
                            }
                            isEditing={isEditing}
                        />
                    </div>
                </div>

                {/* Section 2: KYC Details */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        KYC Details
                    </h3>
                    <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] space-y-4">
                        <EditableImageField
                            label="Aadhaar Image"
                            imageSrc={profileData.aadhaarImageUrl}
                            isEditing={isEditing}
                            onChange={(e) => handleImageChange("aadhaarImage", e)}
                        />
                        <EditableImageField
                            label="PAN Image"
                            imageSrc={profileData.panImageUrl}
                            isEditing={isEditing}
                            onChange={(e) => handleImageChange("panImage", e)}
                        />
                    </div>
                </div>

                {/* Section 3: Education & Experience */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Education & Experience
                    </h3>
                    <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] space-y-4">
                        <EditableField
                            label="Education/Qualification"
                            value={profileData.education}
                            onChange={(e) =>
                                setProfileData({
                                    ...profileData,
                                    education: e.target.value,
                                })
                            }
                            isEditing={isEditing}
                            placeholder="Enter your qualification"
                        />
                        <EditableField
                            label="Institution Name"
                            value={profileData.institution}
                            onChange={(e) =>
                                setProfileData({
                                    ...profileData,
                                    institution: e.target.value,
                                })
                            }
                            isEditing={isEditing}
                            placeholder="Enter institution name"
                        />
                        <div>
                            <label className="text-sm font-semibold text-[#4A4A4A] mb-2 block">
                                Experience (Years)
                            </label>
                            {isEditing ? (
                                <input
                                    type="number"
                                    placeholder="Years"
                                    value={profileData.experienceYears}
                                    onChange={(e) =>
                                        setProfileData({
                                            ...profileData,
                                            experienceYears: e.target.value,
                                        })
                                    }
                                    className="w-full bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                />
                            ) : (
                                <div className="bg-gray-50 rounded-[8px] px-3 py-2">
                                    <p className="text-sm text-gray-600">
                                        {profileData.experienceYears
                                            ? `${profileData.experienceYears} Years`
                                            : "Not provided"}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-[#4A4A4A] mb-2 block">
                                Certificates
                            </label>
                            {profileData.certificates &&
                            profileData.certificates.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                    {profileData.certificates.map((cert, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={cert}
                                                alt={`Certificate ${index + 1}`}
                                                className="w-full h-24 object-cover rounded-[8px]"
                                            />
                                            {isEditing && (
                                                <button
                                                    onClick={() =>
                                                        handleRemoveCertificate(index)
                                                    }
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                                >
                                                    <IoCloseOutline className="text-sm" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                            {isEditing && (
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#D9DDE4] rounded-[8px] cursor-pointer hover:border-[#0A84FF] transition-colors">
                                    <IoImageOutline className="text-2xl text-gray-400 mb-1" />
                                    <p className="text-xs text-gray-500">
                                        Add Certificates
                                    </p>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        multiple
                                        onChange={handleCertificateChange}
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 4: Bank Details */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Bank Details
                    </h3>
                    <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] space-y-4">
                        <EditableField
                            label="Account Holder Name"
                            value={profileData.accountHolderName}
                            onChange={(e) =>
                                setProfileData({
                                    ...profileData,
                                    accountHolderName: e.target.value,
                                })
                            }
                            isEditing={isEditing}
                            placeholder="Enter account holder name"
                        />
                        <EditableField
                            label="Bank Name"
                            value={profileData.bankName}
                            onChange={(e) =>
                                setProfileData({
                                    ...profileData,
                                    bankName: e.target.value,
                                })
                            }
                            isEditing={isEditing}
                            placeholder="Enter bank name"
                        />
                        <EditableField
                            label="Account No"
                            value={
                                isEditing
                                    ? profileData.accountNo
                                    : maskAccountNo(profileData.accountNo)
                            }
                            onChange={(e) =>
                                setProfileData({
                                    ...profileData,
                                    accountNo: e.target.value,
                                })
                            }
                            isEditing={isEditing}
                            placeholder="Enter account number"
                            type={isEditing ? "text" : undefined}
                        />
                        <EditableField
                            label="IFSC"
                            value={
                                isEditing
                                    ? profileData.ifsc
                                    : maskIFSC(profileData.ifsc)
                            }
                            onChange={(e) =>
                                setProfileData({
                                    ...profileData,
                                    ifsc: e.target.value,
                                })
                            }
                            isEditing={isEditing}
                            placeholder="Enter IFSC code"
                            type={isEditing ? "text" : undefined}
                        />
                        <EditableField
                            label="Branch Name"
                            value={profileData.branchName}
                            onChange={(e) =>
                                setProfileData({
                                    ...profileData,
                                    branchName: e.target.value,
                                })
                            }
                            isEditing={isEditing}
                            placeholder="Enter branch name (optional)"
                        />
                        <EditableImageField
                            label="Cancelled Cheque"
                            imageSrc={profileData.cancelledCheckUrl}
                            isEditing={isEditing}
                            onChange={(e) =>
                                handleImageChange("cancelledCheck", e)
                            }
                        />
                    </div>
                </div>

                {/* Section 5: Services (Only if approved) */}
                {vendor?.isApproved && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">
                                My Services
                            </h3>
                            {!isAddingService && (
                                <button
                                    onClick={() => setIsAddingService(true)}
                                    className="bg-[#0A84FF] text-white font-semibold py-2 px-4 rounded-[10px] shadow-md hover:bg-[#005BBB] transition-colors flex items-center gap-2"
                                >
                                    <IoAddCircleOutline className="text-lg" />
                                    Add Service
                                </button>
                            )}
                        </div>

                        {/* Add/Edit Service Form */}
                        {isAddingService && (
                            <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] mb-4">
                                <h4 className="text-md font-bold text-gray-800 mb-4">
                                    {editingServiceId ? "Edit Service" : "Add New Service"}
                                </h4>
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
                                                Skills (comma separated)
                                            </label>
                                            <input
                                                type="text"
                                                value={serviceFormData.skills}
                                                onChange={(e) => setServiceFormData({ ...serviceFormData, skills: e.target.value })}
                                                placeholder="e.g., Water Detection, Survey, Analysis"
                                                className="w-full bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-[#4A4A4A] mb-2 block">
                                                Category
                                            </label>
                                            <input
                                                type="text"
                                                value={serviceFormData.category}
                                                onChange={(e) => setServiceFormData({ ...serviceFormData, category: e.target.value })}
                                                placeholder="e.g., Water Services"
                                                className="w-full bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                            />
                                        </div>
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
                                                {service.skills && service.skills.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-xs text-gray-500 mb-1">Skills:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {service.skills.map((skill, idx) => (
                                                                <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
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

                {/* Section 6: Address */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Address
                    </h3>
                    <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-[#4A4A4A] mb-2 block">
                                Address
                            </label>
                            {isEditing ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Street"
                                        value={profileData.address.street}
                                        onChange={(e) =>
                                            setProfileData({
                                                ...profileData,
                                                address: {
                                                    ...profileData.address,
                                                    street: e.target.value,
                                                },
                                            })
                                        }
                                        className="bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                    />
                                    <input
                                        type="text"
                                        placeholder="City"
                                        value={profileData.address.city}
                                        onChange={(e) =>
                                            setProfileData({
                                                ...profileData,
                                                address: {
                                                    ...profileData.address,
                                                    city: e.target.value,
                                                },
                                            })
                                        }
                                        className="bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                    />
                                    <input
                                        type="text"
                                        placeholder="State"
                                        value={profileData.address.state}
                                        onChange={(e) =>
                                            setProfileData({
                                                ...profileData,
                                                address: {
                                                    ...profileData.address,
                                                    state: e.target.value,
                                                },
                                            })
                                        }
                                        className="bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Pincode"
                                        value={profileData.address.pincode}
                                        onChange={(e) =>
                                            setProfileData({
                                                ...profileData,
                                                address: {
                                                    ...profileData.address,
                                                    pincode: e.target.value,
                                                },
                                            })
                                        }
                                        className="bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                    />
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-[8px] px-4 py-2">
                                    <p className="text-sm text-gray-600">
                                        {profileData.address.street || profileData.address.city || profileData.address.state || profileData.address.pincode
                                            ? `${profileData.address.street || ""}, ${profileData.address.city || ""}, ${profileData.address.state || ""} - ${profileData.address.pincode || ""}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',')
                                            : "Not provided"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                {!isEditing && (
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Change Password Button */}
                        <button 
                            onClick={() => navigate("/vendor/change-password")}
                            className="border-2 border-[#0A84FF] text-[#0A84FF] font-semibold py-3 px-6 rounded-[10px] hover:bg-[#E7F0FB] transition-colors"
                        >
                            Change Password
                        </button>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 text-white font-semibold py-3 px-6 rounded-[10px] hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <IoLogOutOutline className="text-xl" />
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* -------------------- REUSABLE COMPONENTS -------------------- */

function EditableField({
    label,
    value,
    onChange,
    isEditing,
    type = "text",
    placeholder = "",
    disabled = false,
}) {
    return (
        <div>
            <label className="text-sm font-semibold text-[#4A4A4A] mb-2 block">
                {label}
            </label>
            {isEditing ? (
                <input
                    type={type}
                    value={value || ""}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full bg-white border border-[#D9DDE4] rounded-[8px] px-4 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
            ) : (
                <div className="bg-gray-50 rounded-[8px] px-4 py-2">
                    <p className="text-sm text-gray-600">
                        {value || "Not provided"}
                    </p>
                </div>
            )}
        </div>
    );
}

function EditableTextAreaField({
    label,
    value,
    onChange,
    isEditing,
    placeholder = "",
}) {
    return (
        <div>
            <label className="text-sm font-semibold text-[#4A4A4A] mb-2 block">
                {label}
            </label>
            {isEditing ? (
                <textarea
                    value={value || ""}
                    onChange={onChange}
                    placeholder={placeholder}
                    rows="3"
                    className="w-full bg-white border border-[#D9DDE4] rounded-[8px] px-4 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                />
            ) : (
                <div className="bg-gray-50 rounded-[8px] px-4 py-2">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {value || "Not provided"}
                    </p>
                </div>
            )}
        </div>
    );
}

function EditableImageField({ label, imageSrc, isEditing, onChange }) {
    return (
        <div>
            <label className="text-sm font-semibold text-[#4A4A4A] mb-2 block flex items-center gap-2">
                <IoImageOutline className="text-base" />
                {label}
            </label>
            {imageSrc ? (
                <div className="bg-gray-50 rounded-[8px] p-2">
                    <img
                        src={imageSrc}
                        alt={label}
                        className="w-full h-48 object-contain rounded-[8px] mb-2"
                    />
                    {isEditing && (
                        <label className="flex items-center justify-center w-full border-2 border-dashed border-[#D9DDE4] rounded-[8px] px-4 py-2 cursor-pointer hover:border-[#0A84FF] transition-colors text-sm text-gray-600">
                            Change Image
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={onChange}
                            />
                        </label>
                    )}
                </div>
            ) : (
                isEditing ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#D9DDE4] rounded-[8px] cursor-pointer hover:border-[#0A84FF] transition-colors">
                        <IoImageOutline className="text-3xl text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Upload {label}</p>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={onChange}
                        />
                    </label>
                ) : (
                    <div className="bg-gray-50 rounded-[8px] px-4 py-2">
                        <p className="text-sm text-gray-600">Not provided</p>
                    </div>
                )
            )}
        </div>
    );
}
