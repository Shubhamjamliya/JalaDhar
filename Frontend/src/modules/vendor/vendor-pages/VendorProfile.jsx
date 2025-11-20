import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoPencilOutline,
    IoLogOutOutline,
    IoImageOutline,
    IoCheckmarkOutline,
    IoCloseOutline,
} from "react-icons/io5";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import { 
    getVendorProfile, 
    updateVendorProfile, 
    uploadProfilePicture 
} from "../../../services/vendorApi";

export default function VendorProfile() {
    const navigate = useNavigate();
    const { logout, vendor: authVendor } = useVendorAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
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
        serviceDescription: "",
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
                const vendor = response.data.vendor;
                
                // Map backend data to frontend form structure
                setProfileData({
                    profileImage: null,
                    profileImageUrl: vendor.documents?.profilePicture?.url || null,
                    fullName: vendor.name || "",
                    email: vendor.email || "",
                    mobile: vendor.phone || "",
                    aadhaarNo: "", // Not stored in backend separately
                    panNo: "", // Not stored in backend separately
                    aadhaarImage: null,
                    aadhaarImageUrl: vendor.documents?.aadharCard?.url || null,
                    panImage: null,
                    panImageUrl: vendor.documents?.panCard?.url || null,
                    education: vendor.educationalQualifications?.[0]?.degree || "",
                    institution: vendor.educationalQualifications?.[0]?.institution || "",
                    experienceYears: vendor.experience?.toString() || "",
                    experienceDetails: "",
                    certificates: vendor.documents?.certificates?.map(cert => cert.url) || [],
                    bankName: vendor.bankDetails?.bankName || "",
                    accountHolderName: vendor.bankDetails?.accountHolderName || "",
                    accountNo: vendor.bankDetails?.accountNumber || "",
                    ifsc: vendor.bankDetails?.ifscCode || "",
                    branchName: vendor.bankDetails?.branchName || "",
                    cancelledCheck: null,
                    cancelledCheckUrl: vendor.documents?.cancelledCheque?.url || null,
                    serviceDescription: "",
                    fullAddress: "",
                    address: {
                        street: vendor.address?.street || "",
                        city: vendor.address?.city || "",
                        state: vendor.address?.state || "",
                        pincode: vendor.address?.pincode || ""
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

                {/* Section 5: Service & Address */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Service & Address
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
