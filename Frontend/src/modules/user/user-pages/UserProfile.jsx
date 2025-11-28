import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoPersonOutline,
    IoCallOutline,
    IoHomeOutline,
    IoBookmarkOutline,
    IoLogOutOutline,
    IoChevronForwardOutline,
    IoPencilOutline,
    IoHelpCircleOutline,
    IoCheckmarkCircleOutline,
    IoLeafOutline,
} from "react-icons/io5";
import { getUserProfile, updateUserProfile, uploadUserProfilePicture } from "../../../services/authApi";
import { useAuth } from "../../../contexts/AuthContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";

export default function UserProfile() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const toast = useToast();
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        phone: "",
        address: {
            street: "",
            city: "",
            state: "",
            pincode: "",
        },
        profilePicture: null,
        isEmailVerified: false,
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await getUserProfile();
            if (response.success) {
                const user = response.data.user;
                setProfileData({
                    name: user.name || "",
                    email: user.email || "",
                    phone: user.phone || "",
                    address: user.address || {
                        street: "",
                        city: "",
                        state: "",
                        pincode: "",
                    },
                    profilePicture: user.profilePicture || null,
                    isEmailVerified: user.isEmailVerified || false,
                });
            } else {
                toast.showError(response.message || "Failed to load profile");
            }
        } catch (err) {
            handleApiError(err, "Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const handleLogoutConfirm = async () => {
        setShowLogoutConfirm(false);
        await logout();
        navigate("/userlogin");
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const loadingToast = toast.showLoading("Updating profile...");

            const response = await updateUserProfile({
                name: profileData.name,
                phone: profileData.phone,
                address: profileData.address,
            });

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Profile updated successfully!");
                setIsEditing(false);
                // Reload profile to get updated data
                await loadProfile();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to update profile");
            }
        } catch (err) {
            handleApiError(err, "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setSaving(true);
            const loadingToast = toast.showLoading("Uploading profile picture...");
            const response = await uploadUserProfilePicture(file);
            if (response.success) {
                toast.dismissToast(loadingToast);
                setProfileData({
                    ...profileData,
                    profilePicture: response.data.profilePicture,
                });
                toast.showSuccess("Profile picture updated successfully!");
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to upload profile picture");
            }
        } catch (err) {
            handleApiError(err, "Failed to upload profile picture");
        } finally {
            setSaving(false);
        }
    };

    const handleSavedVendors = () => {
        // Navigate to saved vendors page
        toast.showInfo("Saved Vendors feature coming soon!");
    };

    const handleHelpCenter = () => {
        // Navigate to help center
        toast.showInfo("Help Center feature coming soon!");
    };

    if (loading) {
        return <LoadingSpinner message="Loading profile..." />;
    }

    return (
        <div className="min-h-screen -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            {/* Light Blue Background with Wave Pattern */}
            <div className="min-h-screen w-full bg-gradient-to-b from-[#E3F2FD] via-[#BBDEFB] to-[#90CAF9] relative overflow-hidden">
                {/* Wave Pattern Background */}
                <div className="absolute inset-0 opacity-20">
                    <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path fill="#64B5F6" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                    <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ transform: 'translateY(20px)' }}>
                        <path fill="#90CAF9" d="M0,128L48,138.7C96,149,192,171,288,181.3C384,192,480,192,576,186.7C672,181,768,171,864,165.3C960,160,1056,160,1152,154.7C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>

                <div className="relative z-10 px-4 py-4">
                    {/* Profile Header */}
                    <div className="flex flex-col items-center gap-4 text-center">
                    {/* Profile Image */}
                    <div className="relative">
                        <label htmlFor="profileImage" className="cursor-pointer">
                            <div
                                className="h-28 w-28 rounded-full bg-white bg-cover bg-center bg-no-repeat shadow-lg border-4 border-white"
                                style={{
                                    backgroundImage: profileData.profilePicture
                                        ? `url('${profileData.profilePicture}')`
                                        : "none",
                                }}
                            >
                                {!profileData.profilePicture && (
                                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
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

                    {/* Name + Email + Verified Badge */}
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-2xl font-bold text-gray-800">
                            {profileData.name || "User"}
                        </p>
                        <p className="text-base text-gray-600">
                            {profileData.email}
                        </p>
                        {profileData.isEmailVerified && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-blue-200 shadow-sm">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500">
                                    <IoCheckmarkCircleOutline className="text-white text-sm" />
                                </div>
                                <span className="text-sm font-medium text-teal-600">Verified Vendor</span>
                            </div>
                        )}
                    </div>
                </div>

                    {/* User Information Card */}
                    <div className="w-full mt-6 rounded-[12px] bg-white p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col space-y-4">
                        {/* Name */}
                        <InfoRow
                            icon={IoLeafOutline}
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

                        {/* Address */}
                        {isEditing ? (
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                                    <IoHomeOutline className="text-xl text-white" />
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
                        <div className="mt-5 flex gap-3">
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
                            className="mt-5 flex h-12 w-full items-center justify-center rounded-[10px] bg-[#0A84FF] text-white font-bold shadow-[0px_4px_10px_rgba(0,0,0,0.05)] transition-transform hover:scale-[1.02]"
                        >
                            <IoPencilOutline className="mr-2 text-lg" />
                            Edit Profile
                        </button>
                    )}

                    {/* Action List */}
                    <div className="w-full mt-4 space-y-2">
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
                        onClick={handleLogoutClick}
                    />
                </div>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogoutConfirm}
                title="Confirm Logout"
                message="Are you sure you want to logout?"
                confirmText="Logout"
                cancelText="Cancel"
                confirmColor="danger"
            />
        </div>
    );
}

/* -------------------- REUSABLE COMPONENTS -------------------- */

function InfoRow({ icon, label, value, isEditing, onChange, disabled }) {
    const IconComponent = icon;
    return (
        <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 flex-shrink-0">
                <IconComponent className="text-xl text-white" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs text-gray-500 mb-1">{label}</span>
                {isEditing ? (
                    <input
                        type="text"
                        value={value || ""}
                        onChange={onChange}
                        disabled={disabled}
                        className="text-base font-medium text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500 disabled:opacity-50"
                    />
                ) : (
                    <span className="text-base font-medium text-gray-800 break-words">
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
            className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 ${
                        isLogout ? "bg-red-500" : "bg-teal-500"
                    }`}
                >
                    <IconComponent
                        className="text-xl text-white"
                    />
                </div>
                <p
                    className={`flex-1 text-base font-medium ${
                        isLogout ? "text-red-600" : "text-gray-800"
                    }`}
                >
                    {label}
                </p>
            </div>
            <IoChevronForwardOutline className={`text-xl flex-shrink-0 ${
                isLogout ? "text-red-400" : "text-gray-400"
            }`} />
        </div>
    );
}
