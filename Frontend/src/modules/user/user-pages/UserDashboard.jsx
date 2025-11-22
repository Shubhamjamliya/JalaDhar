import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoDocumentTextOutline,
    IoCalendarOutline,
    IoSearchOutline,
    IoPersonCircleOutline,
    IoStar,
    IoStarOutline,
    IoCloseOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoTimeOutline,
    IoCheckmarkOutline,
    IoSettingsOutline,
} from "react-icons/io5";
import { getUserProfile } from "../../../services/authApi";
import { getUserDashboardStats, getNearbyVendors } from "../../../services/bookingApi";
import { useAuth } from "../../../contexts/AuthContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";

export default function UserDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [userName, setUserName] = useState("");
    const [userAvatar, setUserAvatar] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [requestStatuses, setRequestStatuses] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [userLocation, setUserLocation] = useState({ lat: null, lng: null });
    const [dashboardStats, setDashboardStats] = useState({
        total: 0,
        pending: 0,
        accepted: 0,
        completed: 0,
        cancelled: 0
    });

    useEffect(() => {
        loadDashboardData();
        // Get user location if available (optional - won't block if denied)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    // Silently handle location errors - location is optional
                    // Error types: PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT
                    console.log('Location access not available:', error.message);
                    // Still load vendors without location
                    loadVendors();
                },
                {
                    enableHighAccuracy: false,
                    timeout: 5000,
                    maximumAge: 300000 // Cache for 5 minutes
                }
            );
        } else {
            // Geolocation not supported - load vendors anyway
            loadVendors();
        }
    }, []);

    useEffect(() => {
        // Only reload vendors if location was successfully obtained
        if (userLocation.lat && userLocation.lng) {
            loadVendors();
        }
    }, [userLocation]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError("");

            // Load user profile and dashboard stats in parallel
            const [profileResponse, statsResponse] = await Promise.all([
                getUserProfile(),
                getUserDashboardStats()
            ]);

            if (profileResponse.success) {
                const userData = profileResponse.data.user;
                setUserName(userData.name || "");
                setUserAvatar(userData.profilePicture || null);
            }

            if (statsResponse.success) {
                setDashboardStats(statsResponse.data.stats || dashboardStats);
                // Convert recent bookings to request statuses format
                const recentBookings = statsResponse.data.recentBookings || [];
                const formattedRequests = recentBookings.map((booking, index) => ({
                    id: booking._id || index,
                    serviceType: booking.service?.name || "Service",
                    requestDate: booking.scheduledDate || booking.createdAt,
                    requestTime: booking.scheduledTime || "N/A",
                    status: booking.status?.toLowerCase() || "pending",
                    description: `Booking for ${booking.service?.name || "service"}`,
                }));
                setRequestStatuses(formattedRequests);
            }
        } catch (err) {
            console.error("Load dashboard data error:", err);
            setError("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const loadVendors = async () => {
        try {
            const params = { limit: 10 };
            // Only include location if available (optional)
            if (userLocation.lat && userLocation.lng) {
                params.lat = userLocation.lat;
                params.lng = userLocation.lng;
            }
            // Load vendors with or without location
            const response = await getNearbyVendors(params);
            if (response.success) {
                setVendors(response.data.vendors || []);
            }
        } catch (err) {
            console.error("Load vendors error:", err);
            // Even on error, try to show vendors without location
            try {
                const fallbackResponse = await getNearbyVendors({ limit: 10 });
                if (fallbackResponse.success) {
                    setVendors(fallbackResponse.data.vendors || []);
                }
            } catch (fallbackErr) {
                console.error("Fallback load vendors error:", fallbackErr);
            }
        }
    };

    useEffect(() => {
        // Prevent body scroll when modal is open
        if (showStatusModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [showStatusModal]);

    const handleRequestStatusClick = () => {
        setShowStatusModal(true);
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case "pending":
                return {
                    label: "Pending",
                    color: "bg-yellow-100 text-yellow-700",
                    icon: IoTimeOutline,
                };
            case "success":
            case "accepted":
                return {
                    label: "Accepted",
                    color: "bg-green-100 text-green-700",
                    icon: IoCheckmarkCircleOutline,
                };
            case "rejected":
                return {
                    label: "Rejected",
                    color: "bg-red-100 text-red-700",
                    icon: IoCloseCircleOutline,
                };
            default:
                return {
                    label: "Pending",
                    color: "bg-yellow-100 text-yellow-700",
                    icon: IoTimeOutline,
                };
        }
    };

    const displayRequests = requestStatuses;

    const backgroundImageUrl =
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCSWOEOG7ry6z14TFWGAz7PjaKTwn697LggEX4Vf1U2F-18-Yl362M1a0XmrCPrnxjq3HLvvisiIPbnCcLWbicHHyQVehSZEC56qo5fvTVnSjPmEPPFLj9dncg63DYDUscFj51kK5mnPvn7hznGuHDuYjMiSWsX7r6Nlpe1ss-SQVtV_G_yADjJFZVcqSA8EGeUz4tjBJlabT7hxamjtW25RfdT9g0K2O82ATNS4J1em3nBru9nIKr4YnD72XMjXgETg4PCKTSCxEva";

    const avatarImageUrl =
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDCqZRhSzmWMNhXuX4RPFuS_KD7WQ8XLgbsk2nXkV3JICy3ZcLfqjZnTbmofKaBePVQ9HQeoiASrUYaU_VYP7dBYSFBI9Z5WlMcnCKPDQIZaN5Uo8Qh4iv3tNNNnrRAnqP6QfGEIvqzMRneraT-7cwEGw9ba4Ci_wx2qsxlsRdxcPVRdPcnkz2n2vv4YM02MHGkKA3Punga2QFw4FyWv6phuBqmgoiAjWSehWquP1nyb8tigrHh5j6ir7c3uumnU1LI7khab45fuKmL";

    if (loading) {
        return <LoadingSpinner message="Loading dashboard..." />;
    }

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <ErrorMessage message={error} />

            {/* Profile Header with Background Image */}
            <section className="relative my-4 overflow-hidden rounded-[12px] bg-blue-400 p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <div className="absolute inset-0 z-0 opacity-10">
                    <img
                        className="h-full w-full object-cover"
                        src={backgroundImageUrl}
                        alt=""
                    />
                </div>
                <div className="relative z-10 flex items-center gap-4">
                    <div
                        className="h-16 w-16 rounded-full bg-cover bg-center flex-shrink-0"
                        style={{
                            backgroundImage: userAvatar
                                ? `url("${userAvatar}")`
                                : `url("${avatarImageUrl}")`,
                        }}
                    ></div>
                    <div>
                        <p className="text-[22px] font-bold tracking-tight text-gray-800">
                            Welcome, {userName}
                        </p>
                    </div>
                </div>
            </section>

            {/* Services Overview */}
            <h2 className="px-2 pt-4 pb-4 text-lg font-bold text-gray-800">
                Your Services Overview
            </h2>
            <div className="flex items-center justify-between gap-4 mb-6 px-2">
                {/* Request Status */}
                <div
                    onClick={handleRequestStatusClick}
                    className="flex flex-col items-center gap-2 cursor-pointer active:scale-[0.95] transition-transform"
                >
                    <div className="w-16 h-16 rounded-full bg-white shadow-[0px_4px_10px_rgba(0,0,0,0.05)] flex items-center justify-center hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all">
                        <IoDocumentTextOutline className="text-2xl text-[#0A84FF]" />
                    </div>
                    <span className="text-xs font-medium text-gray-800 text-center">
                        Request Status
                    </span>
                </div>

                {/* Current Booking */}
                <div
                    onClick={() => navigate("/user/status")}
                    className="flex flex-col items-center gap-2 cursor-pointer active:scale-[0.95] transition-transform"
                >
                    <div className="w-16 h-16 rounded-full bg-white shadow-[0px_4px_10px_rgba(0,0,0,0.05)] flex items-center justify-center hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all relative">
                        <IoCalendarOutline className="text-2xl text-[#0A84FF]" />
                        <IoCheckmarkOutline className="absolute -bottom-0.5 -right-0.5 text-sm text-white bg-[#0A84FF] rounded-full p-0.5" />
                    </div>
                    <span className="text-xs font-medium text-gray-800 text-center">
                        Current Booking
                    </span>
                </div>

                {/* Find Vendor */}
                <div
                    onClick={() => navigate("/user/serviceprovider")}
                    className="flex flex-col items-center gap-2 cursor-pointer active:scale-[0.95] transition-transform"
                >
                    <div className="w-16 h-16 rounded-full bg-white shadow-[0px_4px_10px_rgba(0,0,0,0.05)] flex items-center justify-center hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all">
                        <IoSearchOutline className="text-2xl text-[#0A84FF]" />
                    </div>
                    <span className="text-xs font-medium text-gray-800 text-center">
                        Find Vendor
                    </span>
                </div>

                {/* Update Profile */}
                <div
                    onClick={() => navigate("/user/profile")}
                    className="flex flex-col items-center gap-2 cursor-pointer active:scale-[0.95] transition-transform"
                >
                    <div className="w-16 h-16 rounded-full bg-white shadow-[0px_4px_10px_rgba(0,0,0,0.05)] flex items-center justify-center hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all relative">
                        <IoPersonCircleOutline className="text-2xl text-[#0A84FF]" />
                        <IoSettingsOutline className="absolute -bottom-0.5 -right-0.5 text-xs text-[#0A84FF] bg-white rounded-full p-0.5" />
                    </div>
                    <span className="text-xs font-medium text-gray-800 text-center">
                        Update Profile
                    </span>
                </div>
            </div>

            {/* Top Vendors Near You */}
            <h2 className="px-2 pt-8 pb-4 text-lg font-bold text-gray-800">
                Top Vendors Near You
            </h2>
            <div className="flex flex-col gap-4 mb-6 px-2">
                {vendors.length === 0 ? (
                    <div className="bg-white rounded-[12px] p-8 text-center shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <p className="text-gray-600 text-sm">No vendors available nearby</p>
                    </div>
                ) : (
                    vendors.map((vendor) => (
                        <div
                            key={vendor._id}
                            onClick={() => navigate(`/user/vendor-profile/${vendor._id}`)}
                            className="flex items-center gap-4 rounded-[12px] bg-white p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] cursor-pointer hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all active:scale-[0.98]"
                        >
                            {/* Vendor Image - Square with rounded corners */}
                            <div
                                className="h-20 w-20 shrink-0 rounded-[8px] bg-cover bg-center bg-no-repeat"
                                style={{
                                    backgroundImage: vendor.documents?.profilePicture?.url
                                        ? `url("${vendor.documents.profilePicture.url}")`
                                        : "none",
                                    backgroundColor: vendor.documents?.profilePicture?.url ? "transparent" : "#E5E7EB"
                                }}
                            >
                                {!vendor.documents?.profilePicture?.url && (
                                    <div className="w-full h-full flex items-center justify-center rounded-[8px]">
                                        <span className="text-3xl">👤</span>
                                    </div>
                                )}
                            </div>

                            {/* Vendor Details - Middle Section */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 mb-1">
                                    {vendor.name}
                                </h4>
                                <p className="text-sm text-gray-500 mb-1.5">
                                    {vendor.category || vendor.serviceTags?.[0] || "General Services"}
                                </p>
                                <div className="flex items-center gap-1 text-sm">
                                    <span className="material-symbols-outlined text-base text-yellow-500">star</span>
                                    <span className="font-bold text-gray-800">
                                        {vendor.averageRating?.toFixed(1) || "0.0"}
                                    </span>
                                    <span className="text-gray-500">
                                        ({vendor.totalRatings || 0})
                                    </span>
                                </div>
                            </div>

                            {/* Distance - Right Side */}
                            {vendor.distance !== null && (
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-semibold text-[#0A84FF]">
                                        {vendor.distance.toFixed(1)} km away
                                    </p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Request Status Modal */}
            {showStatusModal && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowStatusModal(false);
                        }
                    }}
                >
                    <div className="bg-white rounded-[20px] w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl">
                        {/* Fixed Header */}
                        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-[20px]">
                            <h2 className="text-xl font-bold text-gray-800">
                                Request Status
                            </h2>
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <IoCloseOutline className="text-2xl text-gray-600" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {displayRequests.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 text-sm">
                                        No requests found
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {displayRequests.map((request) => {
                                        const statusConfig = getStatusConfig(
                                            request.status
                                        );
                                        const StatusIcon = statusConfig.icon;
                                        return (
                                            <div
                                                key={request.id}
                                                className="bg-white rounded-[12px] p-5 border border-gray-200 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex-1">
                                                        <h3 className="text-base font-bold text-gray-800 mb-2">
                                                            {
                                                                request.serviceType
                                                            }
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <IoTimeOutline className="text-base" />
                                                            <span>
                                                                {new Date(
                                                                    request.requestDate
                                                                ).toLocaleDateString(
                                                                    "en-IN",
                                                                    {
                                                                        day: "numeric",
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    }
                                                                )}{" "}
                                                                at{" "}
                                                                {
                                                                    request.requestTime
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.color} flex items-center gap-1.5 flex-shrink-0`}
                                                    >
                                                        <StatusIcon className="text-sm" />
                                                        {statusConfig.label}
                                                    </span>
                                                </div>
                                                {request.description && (
                                                    <div className="pt-3 border-t border-gray-100">
                                                        <p className="text-sm text-gray-600 leading-relaxed">
                                                            {
                                                                request.description
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
