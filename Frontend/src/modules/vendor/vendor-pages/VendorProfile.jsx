import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoPencilOutline,
    IoLogOutOutline,
    IoImageOutline,
    IoCheckmarkOutline,
    IoCloseOutline,
} from "react-icons/io5";

export default function VendorProfile() {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        profileImage: null,
        fullName: "John Doe",
        email: "johndoe@email.com",
        mobile: "+91 9876543210",
        aadhaarNo: "",
        panNo: "",
        aadhaarImage: null,
        panImage: null,
        education: "",
        experienceYears: "",
        experienceDetails: "",
        certificates: [],
        bankName: "",
        accountNo: "",
        ifsc: "",
        cancelledCheck: null,
        serviceDescription: "",
        fullAddress: "",
    });

    useEffect(() => {
        // Load vendor profile from localStorage
        const savedProfile =
            JSON.parse(localStorage.getItem("vendorProfile")) || {};
        if (Object.keys(savedProfile).length > 0) {
            setProfileData(savedProfile);
        }
    }, []);

    const handleLogout = () => {
        navigate("/vendorlogin");
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = () => {
        // Save to localStorage
        localStorage.setItem("vendorProfile", JSON.stringify(profileData));
        setIsEditing(false);
        alert("Profile updated successfully!");
    };

    const handleCancel = () => {
        // Reload from localStorage
        const savedProfile =
            JSON.parse(localStorage.getItem("vendorProfile")) || {};
        if (Object.keys(savedProfile).length > 0) {
            setProfileData(savedProfile);
        }
        setIsEditing(false);
    };

    const handleImageChange = (field, e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileData({ ...profileData, [field]: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCertificateChange = (e) => {
        const files = Array.from(e.target.files);
        const fileReaders = files.map((file) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
        });

        Promise.all(fileReaders).then((results) => {
            setProfileData({
                ...profileData,
                certificates: [...profileData.certificates, ...results],
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

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <div className="max-w-2xl mx-auto">
                {/* Profile Header */}
                <div className="flex flex-col items-center mb-8">
                    {/* Profile Picture */}
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-white shadow-md mb-4 flex items-center justify-center overflow-hidden">
                            {profileData.profileImage ? (
                                <img
                                    src={profileData.profileImage}
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
                                {profileData.fullName || "Vendor Name"}
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
                                    className="bg-[#0A84FF] text-white font-semibold py-2 px-4 rounded-[10px] shadow-md hover:bg-[#005BBB] transition-colors flex items-center gap-2"
                                >
                                    <IoCheckmarkOutline className="text-lg" />
                                    Save
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="bg-gray-500 text-white font-semibold py-2 px-4 rounded-[10px] shadow-md hover:bg-gray-600 transition-colors flex items-center gap-2"
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
                        <EditableField
                            label="Aadhaar No"
                            value={profileData.aadhaarNo}
                            onChange={(e) =>
                                setProfileData({
                                    ...profileData,
                                    aadhaarNo: e.target.value,
                                })
                            }
                            isEditing={isEditing}
                            placeholder="Enter Aadhaar number"
                        />
                        <EditableField
                            label="PAN No"
                            value={profileData.panNo}
                            onChange={(e) =>
                                setProfileData({
                                    ...profileData,
                                    panNo: e.target.value,
                                })
                            }
                            isEditing={isEditing}
                            placeholder="Enter PAN number"
                        />
                        <EditableImageField
                            label="Aadhaar Image"
                            imageSrc={profileData.aadhaarImage}
                            isEditing={isEditing}
                            onChange={(e) => handleImageChange("aadhaarImage", e)}
                        />
                        <EditableImageField
                            label="PAN Image"
                            imageSrc={profileData.panImage}
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
                        <div>
                            <label className="text-sm font-semibold text-[#4A4A4A] mb-2 block">
                                Experience
                            </label>
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <>
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
                                            className="w-24 bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Experience details"
                                            value={profileData.experienceDetails}
                                            onChange={(e) =>
                                                setProfileData({
                                                    ...profileData,
                                                    experienceDetails: e.target.value,
                                                })
                                            }
                                            className="flex-1 bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <div className="w-24 bg-gray-50 rounded-[8px] px-3 py-2">
                                            <p className="text-sm text-gray-600">
                                                {profileData.experienceYears
                                                    ? `${profileData.experienceYears} Years`
                                                    : "N/A"}
                                            </p>
                                        </div>
                                        <div className="flex-1 bg-gray-50 rounded-[8px] px-3 py-2">
                                            <p className="text-sm text-gray-600">
                                                {profileData.experienceDetails ||
                                                    "Not provided"}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
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
                        <EditableImageField
                            label="Cancelled Check"
                            imageSrc={profileData.cancelledCheck}
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
                        <EditableTextAreaField
                            label="Description of Services"
                            value={profileData.serviceDescription}
                            onChange={(e) =>
                                setProfileData({
                                    ...profileData,
                                    serviceDescription: e.target.value,
                                })
                            }
                            isEditing={isEditing}
                            placeholder="Describe your services"
                        />
                        <EditableTextAreaField
                            label="Full Address"
                            value={profileData.fullAddress}
                            onChange={(e) =>
                                setProfileData({
                                    ...profileData,
                                    fullAddress: e.target.value,
                                })
                            }
                            isEditing={isEditing}
                            placeholder="Enter full address"
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                {!isEditing && (
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Change Password Button */}
                        <button className="border-2 border-[#0A84FF] text-[#0A84FF] font-semibold py-3 px-6 rounded-[10px] hover:bg-[#E7F0FB] transition-colors">
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
                    className="w-full bg-white border border-[#D9DDE4] rounded-[8px] px-4 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF]"
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
