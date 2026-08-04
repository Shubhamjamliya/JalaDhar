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
        <div className="min-h-screen bg-[#F8FAFC] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-32 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-12 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <div className="max-w-xl mx-auto space-y-4 px-1 py-1">

                {/* Profile Header Banner — Modern Hydro Gradient Card */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A84FF] via-blue-600 to-indigo-700 p-5 sm:p-6 shadow-xl shadow-blue-500/15 text-white">
                    {/* Glow Orbs */}
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 bg-white/15 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-36 h-36 bg-teal-400/25 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        {/* Profile Picture Avatar */}
                        <div className="relative mb-2.5">
                            <label htmlFor="profileImage" className="cursor-pointer group block">
                                <div className="relative">
                                    <div
                                        className="h-20 w-20 sm:h-22 sm:w-22 rounded-full bg-gradient-to-br from-blue-100 to-teal-100 bg-cover bg-center bg-no-repeat shadow-xl border-3 border-white/95 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105"
                                        style={{
                                            backgroundImage: profileData.profilePicture
                                                ? `url('${profileData.profilePicture}')`
                                                : "none",
                                        }}
                                    >
                                        {!profileData.profilePicture && (
                                            <span className="text-4xl select-none">👤</span>
                                        )}
                                    </div>

                                    {/* Camera Button Badge */}
                                    <div className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-gradient-to-tr from-[#0A84FF] to-teal-400 text-white flex items-center justify-center shadow-md border-2 border-white hover:scale-110 active:scale-95 transition-all z-10">
                                        <IoCameraOutline className="text-sm" />
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

                        {/* Name & Badge */}
                        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1.5 drop-shadow-sm">
                            <span>{profileData.name || "User"}</span>
                            <IoShieldCheckmarkOutline className="text-teal-300 text-lg shrink-0" title="Verified Account" />
                        </h1>

                        {/* Phone Badge */}
                        <p className="text-xs text-blue-100 font-semibold mt-1 flex items-center gap-1.5 bg-white/15 px-3 py-0.5 rounded-full border border-white/20 backdrop-blur-md shadow-2xs">
                            <IoCallOutline className="text-blue-200 text-xs" />
                            <span>{profileData.phone}</span>
                        </p>
                    </div>
                </section>

                {/* Personal Information Card */}
                <div className="w-full rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/50 border border-slate-200/70 overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                                Personal Information
                            </h2>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Manage your contact and primary survey location.</p>
                        </div>

                        {!isEditing && (
                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-1.5 rounded-xl bg-blue-50 text-[#0A84FF] hover:bg-blue-100/90 text-xs font-extrabold px-3 py-1.5 border border-blue-100 transition-all active:scale-95 shrink-0 cursor-pointer shadow-2xs"
                            >
                                <IoPencilOutline className="text-xs" />
                                <span>Edit Profile</span>
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col space-y-2.5 w-full">
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
                            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                                    <IoHomeOutline className="text-[#0A84FF] text-sm" />
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
                                    className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-blue-100 transition-all"
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
                                        className="text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-blue-100 transition-all"
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
                                        className="text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-blue-100 transition-all"
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
                                    className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-blue-100 transition-all"
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
                        <div className="mt-4 flex gap-2.5">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 bg-gradient-to-r from-[#0A84FF] to-[#00C2A8] text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    loadProfile();
                                }}
                                disabled={saving}
                                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-extrabold text-xs hover:bg-slate-200 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* Grouped Quick Navigation Container */}
                <div className="w-full rounded-3xl bg-white shadow-lg shadow-slate-200/50 border border-slate-200/70 overflow-hidden divide-y divide-slate-100">
                    <ActionRow
                        icon={IoCalendarOutline}
                        iconBg="bg-blue-500 text-white"
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
                        iconBg="bg-purple-500 text-white"
                        label="Survey Reports"
                        onClick={() => navigate("/user/survey-reports")}
                    />
                    <ActionRow
                        icon={IoHelpCircleOutline}
                        iconBg="bg-amber-500 text-white"
                        label="Help & Support"
                        onClick={() => navigate("/user/help-support")}
                    />
                    <ActionRow
                        icon={IoInformationCircleOutline}
                        iconBg="bg-indigo-500 text-white"
                        label="About Jaladhaara"
                        onClick={() => setShowAboutModal(true)}
                    />
                    <ActionRow
                        icon={IoLogOutOutline}
                        iconBg="bg-rose-500 text-white"
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
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/70 border border-slate-100 transition-colors">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 shadow-2xs ${iconBg}`}>
                <IconComponent className="text-lg" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {label}
                </span>
                {isEditing ? (
                    <input
                        type="text"
                        value={value || ""}
                        onChange={onChange}
                        disabled={disabled}
                        className="mt-0.5 w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                ) : (
                    <span className="text-xs sm:text-sm font-extrabold text-slate-800 truncate mt-0.5">
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
            className="flex min-h-[54px] w-full cursor-pointer items-center justify-between gap-3.5 px-4 sm:px-5 py-3 hover:bg-slate-50/80 transition-all active:bg-slate-100/80 group"
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0 transition-transform group-hover:scale-105 shadow-2xs ${
                        iconBg || (isLogout ? "bg-rose-500 text-white" : "bg-blue-500 text-white")
                    }`}
                >
                    <IconComponent className="text-base text-white" />
                </div>
                <p
                    className={`flex-1 text-xs sm:text-sm font-extrabold ${
                        isLogout ? "text-rose-600" : "text-slate-800 group-hover:text-[#0A84FF] transition-colors"
                    }`}
                >
                    {label}
                </p>
            </div>
            <IoChevronForwardOutline className={`text-sm flex-shrink-0 transition-transform group-hover:translate-x-1 ${
                isLogout ? "text-rose-400" : "text-slate-400"
            }`} />
        </div>
    );
}

function AboutJaladhaaraModal({ isOpen, onClose }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-md bg-white rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top Banner Gradient Background */}
                <div className="absolute top-0 left-0 right-0 h-20 sm:h-24 bg-gradient-to-br from-[#0A84FF] via-teal-500 to-indigo-600">
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/15 rounded-full blur-xl pointer-events-none"></div>
                </div>

                {/* Main Content */}
                <div className="relative z-10 flex flex-col items-center text-center pt-3 sm:pt-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2 shadow-xl border-2 border-white flex items-center justify-center mb-2 shrink-0">
                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#0A84FF] to-teal-400 flex items-center justify-center text-white text-2xl sm:text-3xl shadow-xs">
                            💧
                        </div>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Jaladhaara</h2>
                    <p className="text-[11px] font-bold text-teal-700 bg-teal-50/90 px-3 py-0.5 rounded-full border border-teal-200/80 mt-0.5">
                        India's First Groundwater Survey Booking Platform
                    </p>

                    <p className="text-[11px] sm:text-xs text-slate-600 leading-normal font-medium mt-2 px-1 text-justify">
                        Jaladhaara connects landowners, farmers, industries, and developers with verified groundwater survey experts. Our professionals conduct groundwater surveys using advanced geoscientific instruments and scientific interpretation to identify potential groundwater zones before drilling.
                    </p>

                    {/* Features list */}
                    <div className="w-full mt-2.5 space-y-1.5 text-left bg-slate-50/80 rounded-2xl p-3 border border-slate-100 text-[11px] sm:text-xs font-bold text-slate-700">
                        <div className="flex items-center gap-2">
                            <span className="text-[#0A84FF] text-sm font-black">✓</span>
                            <span>Professional Groundwater Surveys</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[#0A84FF] text-sm font-black">✓</span>
                            <span>Advanced Geoscientific Instruments</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[#0A84FF] text-sm font-black">✓</span>
                            <span>Verified Groundwater Experts</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[#0A84FF] text-sm font-black">✓</span>
                            <span>Digital Survey Reports</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[#0A84FF] text-sm font-black">✓</span>
                            <span>Pan-India Service Network</span>
                        </div>
                    </div>

                    {/* Small Disclaimer at bottom */}
                    <div className="mt-2.5 p-2.5 bg-amber-50/60 border border-amber-200/60 rounded-2xl text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight text-center italic">
                        <p className="font-bold text-slate-700 not-italic mb-0.5">Disclaimer:</p>
                        Survey recommendations are based on geological conditions and geophysical interpretations. Groundwater availability, yield, and borewell success cannot be guaranteed.
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between w-full text-[10px] sm:text-[11px] text-slate-400 font-medium">
                        <span>Version 1.2.0</span>
                        <span>© {new Date().getFullYear()} Jaladhaara</span>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full mt-2.5 bg-gradient-to-r from-[#0A84FF] to-[#00C2A8] text-white py-2.5 sm:py-3 rounded-2xl font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}
