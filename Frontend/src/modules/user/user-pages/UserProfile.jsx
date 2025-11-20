import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoPersonOutline,
    IoCallOutline,
    IoHomeOutline,
    IoBookmarkOutline,
    IoHelpCircleOutline,
    IoLogOutOutline,
    IoChevronForwardOutline,
    IoPencilOutline,
} from "react-icons/io5";

export default function UserProfile() {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        fullName: "Jaladhar User",
        email: "jaladhar.user@email.com",
        mobile: "+1 (555) 123-4567",
        address: "123 Aqua Way, Waterville, WA 98858",
        profileImage:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuC63hQ7eA16a_tLf_1uuDHo3Ppu2Pg4jMt1_s8lgxTArGI-qsPziV9KMAkt-9zrFLjckYzMM-7pLGLtX79YFinPRyD6RF1w19E33bHT_I5GFy8pXr-vLS6zHzoadHiDD7iVmkpAux18ZG0osXrauHu3Xo9dmruEm56CgzfOqO37PwxkEx0sPgxMl6Ynnz1ZfB1s4oC0P5drmjSbbq7vyuBbLFkZ8IM7rSloMF1Uzta1CPj5uhXMwOno7qoSTTf86NhzVra9iqOnO9gd",
    });

    useEffect(() => {
        // Load user profile from localStorage
        const savedProfile =
            JSON.parse(localStorage.getItem("userProfile")) || {};
        if (Object.keys(savedProfile).length > 0) {
            setProfileData((prev) => ({ ...prev, ...savedProfile }));
        }
    }, []);

    const handleLogout = () => {
        navigate("/userlogin");
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = () => {
        // Save to localStorage
        localStorage.setItem("userProfile", JSON.stringify(profileData));
        setIsEditing(false);
        alert("Profile updated successfully!");
    };

    const handleSavedVendors = () => {
        // Navigate to saved vendors page
        alert("Saved Vendors feature coming soon!");
    };

    const handleHelpCenter = () => {
        // Navigate to help center
        alert("Help Center feature coming soon!");
    };

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <div className="min-h-screen w-full bg-[#F6F7F9] px-4 py-6">
                {/* Profile Header */}
                <div className="flex flex-col items-center gap-6 text-center">
                    {/* Profile Image */}
                    <div className="relative">
                        <div
                            className="h-32 w-32 rounded-full bg-gray-200 bg-cover bg-center bg-no-repeat shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                            style={{
                                backgroundImage: profileData.profileImage
                                    ? `url('${profileData.profileImage}')`
                                    : "none",
                            }}
                        >
                            {!profileData.profileImage && (
                                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-4xl text-gray-400">
                                        👤
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Name + Email */}
                    <div className="flex flex-col">
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
                                className="text-[22px] font-bold leading-tight text-center bg-white border border-[#D9DDE4] rounded-[8px] px-4 py-2 focus:outline-none focus:border-[#0A84FF]"
                            />
                        ) : (
                            <p className="text-[22px] font-bold leading-tight text-gray-800">
                                {profileData.fullName}
                            </p>
                        )}
                        {isEditing ? (
                            <input
                                type="email"
                                value={profileData.email}
                                onChange={(e) =>
                                    setProfileData({
                                        ...profileData,
                                        email: e.target.value,
                                    })
                                }
                                className="text-base text-gray-500 text-center bg-white border border-[#D9DDE4] rounded-[8px] px-4 py-2 mt-2 focus:outline-none focus:border-[#0A84FF]"
                            />
                        ) : (
                            <p className="text-base text-gray-500">
                                {profileData.email}
                            </p>
                        )}
                    </div>
                </div>

                {/* User Information Card */}
                <div className="w-full mt-8 rounded-[12px] bg-white p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col space-y-6">
                        {/* Name */}
                        <InfoRow
                            icon={IoPersonOutline}
                            label="Name"
                            value={profileData.fullName}
                            isEditing={isEditing}
                            onChange={(e) =>
                                setProfileData({
                                    ...profileData,
                                    fullName: e.target.value,
                                })
                            }
                        />

                        {/* Phone */}
                        <InfoRow
                            icon={IoCallOutline}
                            label="Phone Number"
                            value={profileData.mobile}
                            isEditing={isEditing}
                            onChange={(e) =>
                                setProfileData({
                                    ...profileData,
                                    mobile: e.target.value,
                                })
                            }
                        />

                        {/* Address */}
                        <InfoRow
                            icon={IoHomeOutline}
                            label="Primary Address"
                            value={profileData.address}
                            isEditing={isEditing}
                            onChange={(e) =>
                                setProfileData({
                                    ...profileData,
                                    address: e.target.value,
                                })
                            }
                        />
                    </div>
                </div>

                {/* Edit Profile Button */}
                {isEditing ? (
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={handleSave}
                            className="flex h-12 flex-1 items-center justify-center rounded-[10px] bg-[#0A84FF] text-white font-bold shadow-[0px_4px_10px_rgba(0,0,0,0.05)] transition-transform hover:scale-[1.02]"
                        >
                            Save Changes
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="flex h-12 flex-1 items-center justify-center rounded-[10px] bg-gray-500 text-white font-bold shadow-[0px_4px_10px_rgba(0,0,0,0.05)] transition-transform hover:scale-[1.02]"
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

                {/* Action List */}
                <div className="w-full mt-6 space-y-3">
                    <ActionRow
                        icon={IoBookmarkOutline}
                        label="Saved Vendors"
                        onClick={handleSavedVendors}
                    />
                    <ActionRow
                        icon={IoHelpCircleOutline}
                        label="Help Center"
                        onClick={handleHelpCenter}
                    />
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

function InfoRow({ icon, label, value, isEditing, onChange }) {
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
                        type="text"
                        value={value || ""}
                        onChange={onChange}
                        className="text-base font-medium text-gray-800 bg-white border border-[#D9DDE4] rounded-[8px] px-3 py-1.5 focus:outline-none focus:border-[#0A84FF]"
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
