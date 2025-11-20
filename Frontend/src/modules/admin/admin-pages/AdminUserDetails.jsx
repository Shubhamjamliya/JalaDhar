import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    IoArrowBackOutline,
    IoBanOutline,
    IoCheckmarkOutline,
    IoLocationOutline,
    IoCallOutline,
    IoMailOutline,
    IoTimeOutline,
    IoPersonOutline,
} from "react-icons/io5";
import { getUserDetails, deactivateUser, activateUser } from "../../../services/adminApi";

export default function AdminUserDetails() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadUserDetails();
    }, [userId]);

    const loadUserDetails = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getUserDetails(userId);
            
            if (response.success) {
                setUser(response.data.user);
                setStatistics(response.data.statistics);
            } else {
                setError("Failed to load user details");
            }
        } catch (err) {
            console.error("Load user details error:", err);
            setError("Failed to load user details");
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async () => {
        if (window.confirm("Are you sure you want to deactivate this user?")) {
            try {
                setActionLoading(true);
                const response = await deactivateUser(userId);
                
                if (response.success) {
                    await loadUserDetails();
                    alert("User deactivated successfully!");
                } else {
                    alert(response.message || "Failed to deactivate user");
                }
            } catch (err) {
                console.error("Deactivate user error:", err);
                alert("Failed to deactivate user. Please try again.");
            } finally {
                setActionLoading(false);
            }
        }
    };

    const handleActivate = async () => {
        if (window.confirm("Are you sure you want to activate this user?")) {
            try {
                setActionLoading(true);
                const response = await activateUser(userId);
                
                if (response.success) {
                    await loadUserDetails();
                    alert("User activated successfully!");
                } else {
                    alert(response.message || "Failed to activate user");
                }
            } catch (err) {
                console.error("Activate user error:", err);
                alert("Failed to activate user. Please try again.");
            } finally {
                setActionLoading(false);
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const formatAddress = (address) => {
        if (!address) return "N/A";
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.pincode) parts.push(address.pincode);
        return parts.join(", ") || "N/A";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A84FF] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading user details...</p>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || "User not found"}</p>
                    <button
                        onClick={() => navigate("/admin/users")}
                        className="px-4 py-2 bg-[#0A84FF] text-white rounded-lg hover:bg-[#005BBB] transition-colors"
                    >
                        Back to Users
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-5rem)]">
            {/* Back Button */}
            <button
                onClick={() => navigate("/admin/users")}
                className="mb-4 flex items-center gap-2 text-[#0A84FF] hover:text-[#005BBB] transition-colors"
            >
                <IoArrowBackOutline className="text-xl" />
                <span>Back to Users</span>
            </button>

            {/* Header */}
            <div className="bg-white rounded-[12px] p-6 mb-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                            {user.name}
                        </h1>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className={`px-3 py-1 rounded-[6px] text-sm font-semibold ${
                                    user.isActive
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-red-100 text-red-700"
                                }`}
                            >
                                {user.isActive ? "Active" : "Inactive"}
                            </span>
                            {user.isEmailVerified && (
                                <span className="px-3 py-1 rounded-[6px] text-sm font-semibold bg-green-100 text-green-700">
                                    Email Verified
                                </span>
                            )}
                            {!user.isEmailVerified && (
                                <span className="px-3 py-1 rounded-[6px] text-sm font-semibold bg-yellow-100 text-yellow-700">
                                    Email Unverified
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-[#4A4A4A]">
                        <IoMailOutline className="text-base" />
                        <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#4A4A4A]">
                        <IoCallOutline className="text-base" />
                        <span>{user.phone}</span>
                    </div>
                    {user.address && (
                        <div className="flex items-center gap-2 text-sm text-[#4A4A4A]">
                            <IoLocationOutline className="text-base" />
                            <span>{formatAddress(user.address)}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-[#4A4A4A]">
                        <IoTimeOutline className="text-base" />
                        <span>Registered: {formatDate(user.createdAt)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                    {user.isActive ? (
                        <button
                            onClick={handleDeactivate}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-[8px] hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <IoBanOutline className="text-base" />
                            {actionLoading ? "Processing..." : "Deactivate User"}
                        </button>
                    ) : (
                        <button
                            onClick={handleActivate}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-[8px] hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <IoCheckmarkOutline className="text-base" />
                            {actionLoading ? "Processing..." : "Activate User"}
                        </button>
                    )}
                </div>
            </div>

            {/* Statistics */}
            {statistics && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <p className="text-xs text-[#4A4A4A] mb-1">Total Bookings</p>
                        <p className="text-2xl font-bold text-gray-800">{statistics.totalBookings || 0}</p>
                    </div>
                    <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <p className="text-xs text-[#4A4A4A] mb-1">Completed</p>
                        <p className="text-2xl font-bold text-gray-800">{statistics.completedBookings || 0}</p>
                    </div>
                    <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <p className="text-xs text-[#4A4A4A] mb-1">Pending</p>
                        <p className="text-2xl font-bold text-gray-800">{statistics.pendingBookings || 0}</p>
                    </div>
                </div>
            )}

            {/* Profile Picture */}
            {user.profilePicture && (
                <div className="bg-white rounded-[12px] p-6 mb-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Profile Picture</h3>
                    <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                    />
                </div>
            )}

            {/* Address Details */}
            {user.address && (
                <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <IoLocationOutline className="text-xl" />
                        Address
                    </h3>
                    <div className="text-sm space-y-1">
                        {user.address.street && (
                            <p><span className="font-semibold">Street:</span> {user.address.street}</p>
                        )}
                        {user.address.city && (
                            <p><span className="font-semibold">City:</span> {user.address.city}</p>
                        )}
                        {user.address.state && (
                            <p><span className="font-semibold">State:</span> {user.address.state}</p>
                        )}
                        {user.address.pincode && (
                            <p><span className="font-semibold">Pincode:</span> {user.address.pincode}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

