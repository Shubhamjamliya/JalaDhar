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
    IoLocationOutline,
} from "react-icons/io5";
import { getUserProfile } from "../../../services/authApi";
import { getUserDashboardStats, getNearbyVendors } from "../../../services/bookingApi";
import { useAuth } from "../../../contexts/AuthContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import PlaceAutocompleteInput from "../../../components/PlaceAutocompleteInput";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export default function UserDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("");
    const toast = useToast();
    const [userAvatar, setUserAvatar] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [requestStatuses, setRequestStatuses] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [userLocation, setUserLocation] = useState({ lat: null, lng: null, address: null });
    const [radius, setRadius] = useState(50);
    const [searchAddress, setSearchAddress] = useState("");
    const [gettingLocation, setGettingLocation] = useState(false);
    const [mapsLoaded, setMapsLoaded] = useState(false);
    const [dashboardStats, setDashboardStats] = useState({
        total: 0,
        pending: 0,
        accepted: 0,
        completed: 0,
        cancelled: 0
    });

    // Load Google Maps API
    useEffect(() => {
        if (!GOOGLE_MAPS_API_KEY) {
            return;
        }

        const checkMapsLoaded = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
                setMapsLoaded(true);
                return true;
            }
            return false;
        };

        // Check if already loaded
        if (checkMapsLoaded()) {
            return;
        }

        // Check if script already exists
        const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
        if (existingScript) {
            // Script exists, wait for it to load
            const checkLoaded = setInterval(() => {
                if (checkMapsLoaded()) {
                    clearInterval(checkLoaded);
                }
            }, 100);
            return () => clearInterval(checkLoaded);
        }

        // Create and load script
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            setTimeout(() => {
                checkMapsLoaded();
            }, 100);
        };

        script.onerror = () => {
            // Failed to load Google Maps API
        };

        document.head.appendChild(script);
    }, []);

    // Load saved location from localStorage
    useEffect(() => {
        const savedLocation = localStorage.getItem("userLocation");
        if (savedLocation) {
            try {
                const parsed = JSON.parse(savedLocation);
                if (parsed.lat && parsed.lng) {
                    setUserLocation(parsed);
                    setSearchAddress(parsed.address || "");
                }
            } catch (e) {
                // Error loading saved location
            }
        }
    }, []);

    useEffect(() => {
        loadDashboardData();
        loadVendors();
    }, []);

    useEffect(() => {
            loadVendors();
    }, [userLocation, radius]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

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
            handleApiError(err, "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const loadVendors = async () => {
        try {
            const params = { limit: 50 };
            // Only include location if available (optional)
            if (userLocation.lat && userLocation.lng) {
                params.lat = userLocation.lat;
                params.lng = userLocation.lng;
                params.radius = radius;
            }
            // Load vendors with or without location
            const response = await getNearbyVendors(params);
            if (response.success) {
                const vendorsData = response.data.vendors || [];
                // Ensure distance is properly set and log for debugging
                const vendorsWithDistance = vendorsData.map(vendor => {
                    const distance = vendor.distance !== undefined && vendor.distance !== null && !isNaN(vendor.distance) ? vendor.distance : null;
                    return {
                        ...vendor,
                        distance: distance
                    };
                });
                setVendors(vendorsWithDistance);
            } else {
                // If response not successful, try without location
                const fallbackResponse = await getNearbyVendors({ limit: 50 });
                if (fallbackResponse.success) {
                    setVendors(fallbackResponse.data.vendors || []);
                }
            }
        } catch (err) {
            // Even on error, try to show vendors without location
            try {
                const fallbackResponse = await getNearbyVendors({ limit: 50 });
                if (fallbackResponse.success) {
                    setVendors(fallbackResponse.data.vendors || []);
                }
            } catch (fallbackErr) {
                setVendors([]);
            }
        }
    };

    // Get current location using browser geolocation API
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.showError("Geolocation is not supported by your browser");
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const newLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    address: null
                };

                // Try to reverse geocode to get address
                if (GOOGLE_MAPS_API_KEY) {
                    try {
                        const response = await fetch(
                            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${newLocation.lat},${newLocation.lng}&key=${GOOGLE_MAPS_API_KEY}`
                        );
                        const data = await response.json();
                        if (data.results && data.results.length > 0) {
                            newLocation.address = data.results[0].formatted_address;
                            setSearchAddress(data.results[0].formatted_address);
                        }
                    } catch (error) {
                        // Reverse geocoding error
                    }
                }

                setUserLocation(newLocation);
                localStorage.setItem("userLocation", JSON.stringify(newLocation));
                setGettingLocation(false);
            },
            (error) => {
                let errorMessage = "Unable to get your location";
                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = "Location permission denied. Please allow location access or search manually.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMessage = "Location information unavailable. Please search manually.";
                } else if (error.code === error.TIMEOUT) {
                    errorMessage = "Location request timed out. Please try again or search manually.";
                }
                toast.showError(errorMessage);
                setGettingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    // Handle place selection from Google Places Autocomplete
    const handlePlaceSelect = (placeData) => {
        if (!placeData || !placeData.lat || !placeData.lng) {
            return;
        }

        const newLocation = {
            lat: placeData.lat,
            lng: placeData.lng,
            address: placeData.formattedAddress || placeData.address
        };

        setUserLocation(newLocation);
        setSearchAddress(newLocation.address);
        localStorage.setItem("userLocation", JSON.stringify(newLocation));
    };

    const clearLocation = () => {
        setUserLocation({ lat: null, lng: null, address: null });
        setSearchAddress("");
        localStorage.removeItem("userLocation");
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

            {/* Location Selector */}
            <div className="px-2 mb-4 space-y-3">
                {/* Address Input with Autocomplete */}
                <div className="relative">
                    <IoSearchOutline className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 text-lg z-10" />
                    <PlaceAutocompleteInput
                        onPlaceSelect={handlePlaceSelect}
                        placeholder="Search for an address..."
                        value={searchAddress}
                        onChange={(e) => setSearchAddress(e.target.value)}
                        disabled={false}
                        className="w-full rounded-lg border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        countryRestriction="in"
                        types={["geocode"]}
                    />
                </div>

                {/* Use Current Location Button */}
                <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <IoLocationOutline className="text-lg" />
                    {gettingLocation ? "Getting location..." : "Use Current Location"}
                </button>

                {/* Current Location Display */}
                {userLocation.lat && userLocation.lng && (
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <IoLocationOutline className="text-blue-600 text-xl flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-blue-900 truncate">
                                    {userLocation.address || `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`}
                                </p>
                                <p className="text-xs text-blue-600">Location set</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={clearLocation}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Clear location"
                        >
                            <IoCloseOutline className="text-xl" />
                        </button>
                    </div>
                )}

                {/* Radius Selector */}
                {userLocation.lat && userLocation.lng && (
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            Search Radius:
                        </label>
                        <div className="flex gap-2 flex-1">
                            {[50, 75, 100].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRadius(r)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${radius === r
                                        ? "bg-blue-600 text-white"
                                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                                        }`}
                                >
                                    {r} km
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

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
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h4 className="font-bold text-gray-800">
                                    {vendor.name}
                                </h4>
                                    {userLocation.lat && userLocation.lng && vendor.distance !== null && vendor.distance !== undefined && !isNaN(vendor.distance) && (
                                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                            {vendor.distance <= 50 && "Near Me • "}{typeof vendor.distance === 'number' ? vendor.distance.toFixed(1) : vendor.distance} km away
                                        </span>
                                    )}
                                </div>
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
