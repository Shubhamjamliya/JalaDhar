import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoPersonOutline,
    IoCallOutline,
    IoHomeOutline,
    IoWalletOutline,
    IoLogOutOutline,
    IoChevronForwardOutline,
    IoPencilOutline,
    IoCheckmarkCircleOutline,
    IoCameraOutline,
    IoCalendarOutline,
    IoNewspaperOutline,
    IoHelpCircleOutline,
    IoInformationCircleOutline,
    IoCloseOutline,
    IoShieldCheckmarkOutline,
    IoMailOutline,
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
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
        window.scrollTo(0, 0);
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

    if (loading) {
        return <LoadingSpinner message="Loading profile..." />;
    }

    const formattedAddress = profileData.address?.street
        ? `${profileData.address.street}, ${profileData.address.city || ""}, ${profileData.address.state || ""} ${profileData.address.pincode || ""}`.trim().replace(/^,\s*|,\s*$/g, "")
        : "Not provided";

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <div className="max-w-2xl mx-auto space-y-5 px-1 py-3">

                {/* Profile Header Banner — Premium Glassmorphic Gradient */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A84FF] via-blue-600 to-indigo-700 p-6 md:p-8 shadow-xl shadow-blue-500/10 text-white">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-36 h-36 bg-teal-400/20 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        {/* Profile Picture Container */}
                        <div className="relative mb-3">
                            <label htmlFor="profileImage" className="cursor-pointer group block">
                                <div className="relative">
                                    <div
                                        className="h-28 w-28 rounded-full bg-gradient-to-br from-blue-100 to-teal-100 bg-cover bg-center bg-no-repeat shadow-2xl border-4 border-white/90 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105"
                                        style={{
                                            backgroundImage: profileData.profilePicture
                                                ? `url('${profileData.profilePicture}')`
                                                : "none",
                                        }}
                                    >
                                        {!profileData.profilePicture && (
                                            <span className="text-5xl select-none">👤</span>
                                        )}
                                    </div>

                                    {/* Camera Button Badge */}
                                    <div className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-[#0A84FF] text-white flex items-center justify-center shadow-lg border-2 border-white hover:bg-blue-700 transition-colors z-10">
                                        <IoCameraOutline className="text-base" />
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

                        {/* Name */}
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                            <span>{profileData.name || "User"}</span>
                            <IoShieldCheckmarkOutline className="text-teal-300 text-xl shrink-0" title="Verified Account" />
                        </h1>

                        {/* Phone */}
                        <p className="text-xs sm:text-sm text-blue-100 font-medium mt-1 flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/15 backdrop-blur-md">
                            <IoCallOutline className="text-blue-200 text-sm" />
                            <span>{profileData.phone}</span>
                        </p>
                    </div>
                </section>

                {/* Personal Information Card */}
                <div className="w-full rounded-3xl bg-white p-6 shadow-xs border border-gray-100/90 overflow-hidden">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">
                                Personal Information
                            </h2>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Manage your contact and primary survey location.</p>
                        </div>

                        {!isEditing && (
                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-1.5 rounded-xl bg-blue-50 text-[#0A84FF] hover:bg-blue-100 text-xs font-bold px-3.5 py-2 border border-blue-100 transition-all active:scale-95 shrink-0"
                            >
                                <IoPencilOutline className="text-sm" />
                                <span>Edit Profile</span>
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col space-y-3.5 w-full">
                        {/* Name */}
                        <InfoRow
                            icon={IoPersonOutline}
                            iconBg="bg-blue-50 text-blue-600 border border-blue-100"
                            label="Full Name"
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
                            iconBg="bg-emerald-50 text-emerald-600 border border-emerald-100"
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

                        {/* Primary Address */}
                        {isEditing ? (
                            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-extrabold text-gray-700 uppercase tracking-wide">
                                    <IoHomeOutline className="text-blue-600 text-base" />
                                    <span>Primary Address Details</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Street Address / House No."
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
                                    className="w-full text-sm font-semibold text-gray-800 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                    disabled={saving}
                                />
                                <div className="grid grid-cols-2 gap-2.5">
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
                                        className="text-sm font-semibold text-gray-800 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
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
                                        className="text-sm font-semibold text-gray-800 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
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
                                    className="w-full text-sm font-semibold text-gray-800 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                    disabled={saving}
                                />
                            </div>
                        ) : (
                            <InfoRow
                                icon={IoHomeOutline}
                                iconBg="bg-purple-50 text-purple-600 border border-purple-100"
                                label="Primary Address"
                                value={formattedAddress}
                                isEditing={false}
                            />
                        )}
                    </div>

                    {/* Save/Cancel Buttons when Editing */}
                    {isEditing && (
                        <div className="mt-5 flex gap-3">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 bg-[#0A84FF] text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    loadProfile();
                                }}
                                disabled={saving}
                                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* Quick Menu Options */}
                <div className="w-full space-y-2.5">
                    <ActionRow
                        icon={IoCalendarOutline}
                        iconBg="bg-teal-500 text-white"
                        label="My Bookings"
                        onClick={() => navigate("/user/my-bookings")}
                    />
                    <ActionRow
                        icon={IoWalletOutline}
                        iconBg="bg-teal-500 text-white"
                        label="Wallet"
                        onClick={() => navigate("/user/wallet")}
                    />
                    <ActionRow
                        icon={IoNewspaperOutline}
                        iconBg="bg-teal-500 text-white"
                        label="Survey Reports"
                        onClick={() => navigate("/user/survey-reports")}
                    />
                    <ActionRow
                        icon={IoHelpCircleOutline}
                        iconBg="bg-teal-500 text-white"
                        label="Help & Support"
                        onClick={() => navigate("/user/help-support")}
                    />
                    <ActionRow
                        icon={IoInformationCircleOutline}
                        iconBg="bg-teal-500 text-white"
                        label="About Jaladhaara"
                        onClick={() => setShowAboutModal(true)}
                    />
                    <ActionRow
                        icon={IoLogOutOutline}
                        iconBg="bg-red-500 text-white"
                        label="Logout"
                        isLogout
                        onClick={handleLogoutClick}
                    />
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

            {/* About Jaladhaara Modal */}
            <AboutJaladhaaraModal
                isOpen={showAboutModal}
                onClose={() => setShowAboutModal(false)}
            />
        </div>
    );
}

/* -------------------- REUSABLE COMPONENTS -------------------- */

function InfoRow({ icon: IconComponent, iconBg, label, value, isEditing, onChange, disabled }) {
    return (
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50/70 border border-slate-100/90 transition-colors">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 shadow-2xs ${iconBg}`}>
                <IconComponent className="text-xl" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {label}
                </span>
                {isEditing ? (
                    <input
                        type="text"
                        value={value || ""}
                        onChange={onChange}
                        disabled={disabled}
                        className="mt-0.5 w-full text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                ) : (
                    <span className="text-sm font-extrabold text-gray-800 truncate mt-0.5">
                        {value || "Not provided"}
                    </span>
                )}
            </div>
        </div>
    );
}

function ActionRow({ icon: IconComponent, iconBg, label, isLogout, onClick }) {
    return (
        <div
            onClick={onClick}
            className="flex min-h-[58px] w-full cursor-pointer items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-xs border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all active:scale-[0.98] group"
        >
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 transition-transform group-hover:scale-105 shadow-2xs ${
                        iconBg || (isLogout ? "bg-red-500 text-white" : "bg-teal-500 text-white")
                    }`}
                >
                    <IconComponent className="text-xl text-white" />
                </div>
                <p
                    className={`flex-1 text-base font-semibold ${
                        isLogout ? "text-red-600 font-bold" : "text-gray-800"
                    }`}
                >
                    {label}
                </p>
            </div>
            <IoChevronForwardOutline className={`text-xl flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${
                isLogout ? "text-red-400" : "text-gray-400"
            }`} />
        </div>
    );
}

function AboutJaladhaaraModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top Banner Gradient Background */}
                <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-br from-[#0A84FF] via-teal-500 to-indigo-600">
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/15 rounded-full blur-xl pointer-events-none"></div>
                </div>

                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md transition-colors"
                >
                    <IoCloseOutline className="text-xl" />
                </button>

                {/* Main Content */}
                <div className="relative z-10 flex flex-col items-center text-center pt-8">
                    <div className="w-20 h-20 rounded-2xl bg-white p-3 shadow-xl border-2 border-white flex items-center justify-center mb-3">
                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#0A84FF] to-teal-400 flex items-center justify-center text-white text-3xl shadow-xs">
                            💧
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Jaladhaara</h2>
                    <p className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/80 mt-1">
                        India's 1st Groundwater Survey Platform
                    </p>

                    <p className="text-xs text-gray-600 leading-relaxed font-medium mt-4 px-2">
                        Jaladhaara connects landowners, farmers, and commercial developers with verified hydrogeologists using advanced geoscientific instruments for precise groundwater location before drilling.
                    </p>

                    {/* Features list */}
                    <div className="w-full mt-5 space-y-2.5 text-left bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2.5 text-gray-700 font-semibold">
                            <span className="text-base">🔬</span>
                            <span>Advanced ESI & VLF Geophysics</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-gray-700 font-semibold">
                            <span className="text-base">👨‍🔧</span>
                            <span>Certified Groundwater Experts</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-gray-700 font-semibold">
                            <span className="text-base">📊</span>
                            <span>Digital Soil & Depth Reports</span>
                        </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between w-full text-[11px] text-gray-400 font-medium">
                        <span>Version 1.2.0</span>
                        <span>© {new Date().getFullYear()} Jaladhaara</span>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full mt-4 bg-gradient-to-r from-[#0A84FF] to-[#00C2A8] text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}
