import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    IoDocumentTextOutline,
    IoCalendarOutline,
    IoSearchOutline,
    IoPersonCircleOutline,
    IoStar,
    IoStarOutline,
    IoCloseOutline,
    IoCheckmarkCircleOutline,
    IoCheckmarkCircle,
    IoCloseCircleOutline,
    IoTimeOutline,
    IoCheckmarkOutline,
    IoSettingsOutline,
    IoLocationOutline,
    IoLeafOutline,
    IoHomeOutline,
    IoBusinessOutline,
    IoConstructOutline,
    IoNewspaperOutline,
    IoWalletOutline,
} from "react-icons/io5";
import { getUserProfile } from "../../../services/authApi";
import { getUserDashboardStats, getNearbyVendors, cancelBooking, getUserBookings } from "../../../services/bookingApi";
import { useAuth } from "../../../contexts/AuthContext";
import InputModal from "../../shared/components/InputModal";
import ConfirmModal from "../../shared/components/ConfirmModal";
import { useNotifications } from "../../../contexts/NotificationContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import PlaceAutocompleteInput from "../../../components/PlaceAutocompleteInput";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export default function UserDashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("");
    const toast = useToast();
    const [userAvatar, setUserAvatar] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'PENDING_PAYMENT', or 'REPORTS'
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

    // Cancellation State
    const [showCancellationInput, setShowCancellationInput] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("");
    const [selectedBookingForAction, setSelectedBookingForAction] = useState(null);

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

    // Load data on mount and when location changes (navigation back)
    useEffect(() => {
        loadDashboardData();
        loadVendors();
    }, [location.pathname]);

    // Refetch when page becomes visible (user switches tabs/windows)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadDashboardData();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    useEffect(() => {
        loadVendors();
    }, [userLocation, radius]);

    const { socket } = useNotifications();

    // Real-time updates via socket
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification) => {
            // Refresh for status updates
            if (
                notification.type === "BOOKING_STATUS_UPDATED" ||
                notification.type === "BOOKING_ACCEPTED" ||
                notification.type === "BOOKING_VISITED" ||
                notification.type === "REPORT_UPLOADED" ||
                notification.type === "ADMIN_APPROVED" ||
                notification.type === "PAYMENT_RELEASE"
            ) {
                loadDashboardData();
            }
        };

        socket.on("new_notification", handleNewNotification);
        return () => socket.off("new_notification", handleNewNotification);
    }, [socket]);

    // Auto-fetch location on mount if not already saved
    useEffect(() => {
        const savedLocation = localStorage.getItem("userLocation");
        if (!savedLocation && !userLocation.lat) {
            getCurrentLocation();
        }
    }, []);

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

                // Fetch all bookings to ensure we have older reports as well
                let allBookingsList = [];
                try {
                    const allBookingsResponse = await getUserBookings({ limit: 50 });
                    if (allBookingsResponse.success) {
                        allBookingsList = allBookingsResponse.data.bookings || [];
                    }
                } catch (err) {
                    console.error("Failed to fetch all bookings:", err);
                }

                // Combine and deduplicate bookings, prioritizing the full list
                const recentBookings = statsResponse.data.recentBookings || [];
                const combinedBookings = [...allBookingsList];
                
                recentBookings.forEach(rb => {
                    if (!combinedBookings.some(b => b._id === rb._id)) {
                        combinedBookings.push(rb);
                    }
                });

                const formattedRequests = combinedBookings.map((booking, index) => ({
                    id: booking._id || index,
                    serviceType: booking.service?.name || "Service",
                    requestDate: booking.scheduledDate || booking.createdAt,
                    requestTime: booking.scheduledTime || "N/A",
                    status: booking.status?.toLowerCase() || "pending",
                    paymentStatus: booking.payment?.advancePaid ? "PAID" : "PENDING",
                    payment: booking.payment,
                    description: `Booking for ${booking.service?.name || "service"}`,
                    bookingData: booking, // Keep full booking data reference
                    hasReport: !!booking.report && (booking.report.uploadedAt || booking.report.waterFound !== null || booking.status === 'REPORT_UPLOADED' || booking.userStatus === 'REPORT_UPLOADED'),
                    waterFound: booking.report?.waterFound === true || booking.report?.waterFound === "true"
                }));
                setRequestStatuses(formattedRequests);
            }
        } catch (err) {
            handleApiError(err, "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const lastRequestRef = useRef(0);

    const loadVendors = async () => {
        const requestId = ++lastRequestRef.current;
        try {
            const params = { limit: 50 };
            // Only include location if available
            if (userLocation.lat && userLocation.lng) {
                params.lat = userLocation.lat;
                params.lng = userLocation.lng;
                params.radius = radius;
            }
            // Load vendors with or without location
            const response = await getNearbyVendors(params);

            // Only update if this is still the latest request
            if (requestId !== lastRequestRef.current) return;

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
                // If response not successful, try without location (only if we tried with location)
                if (params.lat) {
                    const fallbackResponse = await getNearbyVendors({ limit: 50 });
                    if (requestId !== lastRequestRef.current) return;
                    if (fallbackResponse.success) {
                        setVendors(fallbackResponse.data.vendors || []);
                    }
                }
            }
        } catch (err) {
            if (requestId !== lastRequestRef.current) return;

            // Even on error, try to show vendors without location
            try {
                const fallbackResponse = await getNearbyVendors({ limit: 50 });
                if (requestId !== lastRequestRef.current) return;

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

    const handleRequestStatusClick = (filter = 'ALL') => {
        setStatusFilter(filter);
        setShowStatusModal(true);
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case "awaiting_advance":
                return {
                    label: "Advance Pending",
                    color: "bg-orange-100 text-orange-700",
                    icon: IoTimeOutline,
                };
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

    const handleResumePayment = (request) => {
        if (!request.bookingData || !request.payment) {
            toast.showError("Unable to resume payment. Missing details.");
            return;
        }

        // Navigate to payment confirmation with reconstructed state
        navigate("/user/booking/advance-payment/confirmation", {
            state: {
                booking: request.bookingData,
                service: request.bookingData.service,
                vendor: request.bookingData.vendor,
                paymentData: {
                    advanceAmount: request.payment.advanceAmount,
                    remainingAmount: request.payment.remainingAmount,
                    totalAmount: request.payment.totalAmount,
                    keyId: import.meta.env.VITE_RAZORPAY_KEY_ID // Assuming this is needed, though confirmation page might fetch it
                },
                razorpayOrder: {
                    id: request.payment.advanceRazorpayOrderId,
                    amount: request.payment.advanceAmount * 100, // Amount in paise
                    currency: "INR"
                }
            }
        });
    };

    const handleInitiateCancel = (booking) => {
        setSelectedBookingForAction(booking);
        setShowCancellationInput(true);
    };

    const handleCancellationReasonSubmit = (reason) => {
        setCancellationReason(reason);
        setShowCancellationInput(false);
        setShowCancelConfirm(true);
    };

    const handleCancelConfirm = async () => {
        if (!selectedBookingForAction) return;

        try {
            const loadingToast = toast.showLoading("Cancelling booking...");
            const response = await cancelBooking(selectedBookingForAction.id, cancellationReason);

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Booking cancelled successfully");
                setShowCancelConfirm(false);
                setSelectedBookingForAction(null);
                setCancellationReason("");
                // Refresh data
                loadDashboardData();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to cancel booking");
            }
        } catch (err) {
            toast.showError(err.response?.data?.message || "Failed to cancel booking");
        }
    };

    const filteredRequests = requestStatuses.filter(req => {
        if (statusFilter === 'PENDING_PAYMENT') {
            return (req.status === 'pending' || req.status === 'awaiting_advance') && req.paymentStatus === 'PENDING';
        }
        if (statusFilter === 'REPORTS') {
            return req.hasReport;
        }
        return true;
    });

    const displayRequests = filteredRequests;

    const backgroundImageUrl =
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCSWOEOG7ry6z14TFWGAz7PjaKTwn697LggEX4Vf1U2F-18-Yl362M1a0XmrCPrnxjq3HLvvisiIPbnCcLWbicHHyQVehSZEC56qo5fvTVnSjPmEPPFLj9dncg63DYDUscFj51kK5mnPvn7hznGuHDuYjMiSWsX7r6Nlpe1ss-SQVtV_G_yADjJFZVcqSA8EGeUz4tjBJlabT7hxamjtW25RfdT9g0K2O82ATNS4J1em3nBru9nIKr4YnD72XMjXgETg4PCKTSCxEva";

    const avatarImageUrl =
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDCqZRhSzmWMNhXuX4RPFuS_KD7WQ8XLgbsk2nXkV3JICy3ZcLfqjZnTbmofKaBePVQ9HQeoiASrUYaU_VYP7dBYSFBI9Z5WlMcnCKPDQIZaN5Uo8Qh4iv3tNNNnrRAnqP6QfGEIvqzMRneraT-7cwEGw9ba4Ci_wx2qsxlsRdxcPVRdPcnkz2n2vv4YM02MHGkKA3Punga2QFw4FyWv6phuBqmgoiAjWSehWquP1nyb8tigrHh5j6ir7c3uumnU1LI7khab45fuKmL";

    if (loading) {
        return <LoadingSpinner message="Loading dashboard..." />;
    }

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">

            {/* Profile Header with Light Blue Gradient */}
            <section className="relative my-4 overflow-hidden rounded-[12px] bg-gradient-to-b from-[#E3F2FD] via-[#BBDEFB] to-[#90CAF9] p-6 shadow-lg">
                {/* Subtle Wave Pattern Overlay */}
                <div className="absolute inset-0 z-0 opacity-20">
                    <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path fill="#64B5F6" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                    <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ transform: 'translateY(20px)' }}>
                        <path fill="#90CAF9" d="M0,128L48,138.7C96,149,192,171,288,181.3C384,192,480,192,576,186.7C672,181,768,171,864,165.3C960,160,1056,160,1152,154.7C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>
                <div className="relative z-10 flex items-center gap-4">
                    {/* White Circular Profile Picture */}
                    <div
                        className="h-16 w-16 rounded-full bg-white bg-cover bg-center flex-shrink-0 shadow-lg border-4 border-white"
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

            {/* Survey Booking CTA */}
            <div
                onClick={() => navigate("/user/survey")}
                className="mx-2 mt-4 mb-2 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
            >
                <div className="text-white">
                    <h3 className="text-lg font-bold">Book a Survey</h3>
                    <p className="text-sm opacity-90">Get expert borewell survey services</p>
                </div>
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                    <IoLeafOutline className="text-2xl text-white" />
                </div>
            </div>

            {/* Survey Categories */}
            <h2 className="px-2 pt-2 text-md font-semibold text-gray-700">Select Survey Type</h2>
            <div className="mx-2 mt-2 mb-4 grid grid-cols-2 gap-3">
                {[
                    { id: "Agriculture", label: "Agriculture", icon: IoLeafOutline, color: "bg-green-100 text-green-600" },
                    { id: "Domestic/Household", label: "Household", icon: IoHomeOutline, color: "bg-blue-100 text-blue-600" },
                    { id: "Commercial", label: "Commercial", icon: IoBusinessOutline, color: "bg-purple-100 text-purple-600" },
                    { id: "Industrial", label: "Industrial", icon: IoConstructOutline, color: "bg-orange-100 text-orange-600" }
                ].map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => navigate("/user/survey", { state: { category: cat.id } })}
                        className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-all"
                    >
                        <div className={`p-3 rounded-full ${cat.color} mb-2 text-2xl`}>
                            <cat.icon />
                        </div>
                        <span className="font-medium text-gray-700 text-xs">{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* Services Overview */}
            <h2 className="px-2 pt-4 pb-4 text-lg font-bold text-gray-800">
                Your Services Overview
            </h2>
            <div className="grid grid-cols-5 gap-1 mb-6 px-1">
                {/* Request Status */}
                <div
                    onClick={() => handleRequestStatusClick('ALL')}
                    className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-[0.95] transition-transform"
                >
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-blue-200 shadow-[0px_2px_8px_rgba(59,130,246,0.2)] flex items-center justify-center hover:shadow-[0px_4px_12px_rgba(59,130,246,0.3)] transition-all overflow-hidden shrink-0 border border-blue-100/50">
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent"></div>
                        <IoDocumentTextOutline className="text-xl text-blue-600 relative z-10" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 text-center leading-tight px-0.5">
                        Booking Status
                    </span>
                </div>

                {/* Current Booking */}
                <div
                    onClick={() => navigate("/user/status")}
                    className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-[0.95] transition-transform"
                >
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-200 shadow-[0px_2px_8px_rgba(16,185,129,0.2)] flex items-center justify-center hover:shadow-[0px_4px_12px_rgba(16,185,129,0.3)] transition-all overflow-hidden shrink-0 border border-emerald-100/50">
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent"></div>
                        <IoCalendarOutline className="text-xl text-emerald-600 relative z-10" />
                        <IoCheckmarkCircle className="absolute -bottom-0.5 -right-0.5 text-sm text-emerald-600 z-20" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 text-center leading-tight px-0.5">
                        Current Booking
                    </span>
                </div>

                {/* Pending Requests */}
                <div
                    onClick={() => handleRequestStatusClick('PENDING_PAYMENT')}
                    className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-[0.95] transition-transform"
                >
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-amber-50 to-amber-200 shadow-[0px_2px_8px_rgba(245,158,11,0.2)] flex items-center justify-center hover:shadow-[0px_4px_12px_rgba(245,158,11,0.3)] transition-all shrink-0 border border-amber-100/50">
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent rounded-t-full"></div>
                        <IoTimeOutline className="text-xl text-amber-600 relative z-10" />
                        {requestStatuses.some(r => (r.status === 'pending' || r.status === 'awaiting_advance') && r.paymentStatus === 'PENDING') && (
                            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white z-20 shadow-sm animate-pulse"></div>
                        )}
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 text-center leading-tight px-0.5">
                        Pending Payments
                    </span>
                </div>

                {/* Survey Reports */}
                <div
                    onClick={() => handleRequestStatusClick('REPORTS')}
                    className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-[0.95] transition-transform"
                >
                    <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-200 shadow-[0px_2px_8px_rgba(79,70,229,0.2)] flex items-center justify-center hover:shadow-[0px_4px_12px_rgba(79,70,229,0.3)] transition-all overflow-hidden shrink-0 border border-indigo-100/50 ${requestStatuses.some(r => r.hasReport) ? (requestStatuses.find(r => r.hasReport)?.waterFound ? 'animate-blink-green' : 'animate-blink-red') : ''}`}>
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent"></div>
                        <IoNewspaperOutline className={`text-xl relative z-10 ${requestStatuses.some(r => r.hasReport) ? 'text-white' : 'text-indigo-600'}`} />
                        {requestStatuses.some(r => r.hasReport) && (
                            <div className={`absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white z-20 shadow-sm ${requestStatuses.find(r => r.hasReport)?.waterFound ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        )}
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 text-center leading-tight px-0.5">
                        Survey Reports
                    </span>
                </div>

                {/* Update Profile */}
                <div
                    onClick={() => navigate("/user/profile")}
                    className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-[0.95] transition-transform"
                >
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-rose-50 to-rose-200 shadow-[0px_2px_8px_rgba(225,29,72,0.2)] flex items-center justify-center hover:shadow-[0px_4px_12px_rgba(225,29,72,0.3)] transition-all overflow-hidden shrink-0 border border-rose-100/50">
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent"></div>
                        <IoPersonCircleOutline className="text-xl text-rose-600 relative z-10" />
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-gray-400 border-2 border-white z-20"></div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 text-center leading-tight px-0.5">
                        Update Profile
                    </span>
                </div>
            </div>


            {
                (() => {
                    // Find the most recent active booking OR the most recent completed booking with a report
                    const activeBooking = requestStatuses.find(r =>
                        !['cancelled', 'rejected', 'failed'].includes(r.status.toLowerCase()) &&
                        (!['completed', 'success'].includes(r.status.toLowerCase()) || r.hasReport)
                    );
                    if (!activeBooking) return null;

                    return (
                        <>
                            <h2 className="px-2 pt-4 pb-4 text-lg font-bold text-gray-800">
                                Current Actions
                            </h2>
                            <div className="mx-2 mb-6 bg-white rounded-[16px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{activeBooking.serviceType}</h3>
                                        <p className="text-xs text-gray-500">Booking ID: #{activeBooking.id.toString().slice(-4).toUpperCase()}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusConfig(activeBooking.status).color}`}>
                                        {getStatusConfig(activeBooking.status).label}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {(activeBooking.status === 'awaiting_payment' || activeBooking.status === 'report_uploaded') && !activeBooking.bookingData?.payment?.remainingPaid && (
                                        <button
                                            onClick={() => navigate(`/user/booking/${activeBooking.id}/payment`)}
                                            className="w-full bg-[#0A84FF] text-white py-3 rounded-[12px] font-bold text-base hover:bg-[#005BBB] transition-all active:scale-95 shadow-[0px_4px_10px_rgba(10,132,255,0.2)] flex items-center justify-center gap-2"
                                        >
                                            Pay Remaining <IoWalletOutline />
                                        </button>
                                    )}

                                    {(activeBooking.status === 'pending' || activeBooking.status === 'awaiting_advance') && activeBooking.paymentStatus === 'PENDING' && (
                                        <button
                                            onClick={() => handleResumePayment(activeBooking)}
                                            className="w-full bg-blue-600 text-white py-3 rounded-[12px] font-bold text-base hover:bg-blue-700 transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2"
                                        >
                                            Complete Payment <IoCheckmarkCircleOutline />
                                        </button>
                                    )}

                                    {activeBooking.hasReport && (
                                        <button
                                            onClick={() => navigate(`/user/booking/${activeBooking.id}/report`)}
                                            className={`w-full py-3 rounded-[12px] font-bold text-base transition-all flex items-center justify-center gap-2 ${activeBooking.waterFound ? 'bg-emerald-600 text-white animate-blink-green' : 'bg-red-600 text-white animate-blink-red'}`}
                                        >
                                            View Report <IoNewspaperOutline />
                                        </button>
                                    )}

                                    {['pending', 'assigned', 'accepted'].includes(activeBooking.status) && (
                                        <button
                                            onClick={() => handleInitiateCancel(activeBooking)}
                                            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 py-3 rounded-[12px] font-semibold hover:bg-red-100 transition-all active:scale-95"
                                        >
                                            <IoCloseCircleOutline className="text-xl" />
                                            Cancel Booking
                                        </button>
                                    )}

                                    <button
                                        onClick={() => navigate(`/user/booking/${activeBooking.id}`)}
                                        className="w-full flex items-center justify-center gap-2 text-gray-500 py-2 text-sm font-medium hover:text-gray-700 transition-colors"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </>
                    );
                })()
            }

            {/* Top Vendors Near You */}
            <h2 className="px-2 pt-4 pb-4 text-lg font-bold text-gray-800">
                Top Vendors Near You
            </h2>

            {/* Location Selector */}
            <div className="px-2 mb-4 flex gap-3">
                {/* Address Input with Autocomplete */}
                <div className="relative flex-1">
                    <IoSearchOutline className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 text-lg z-10" />
                    <PlaceAutocompleteInput
                        onPlaceSelect={handlePlaceSelect}
                        placeholder="Search for an address..."
                        value={searchAddress}
                        onChange={(e) => setSearchAddress(e.target.value)}
                        disabled={false}
                        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:shadow-md transition-all"
                        countryRestriction="in"
                        types={["geocode"]}
                    />
                </div>

                {/* Use Current Location Button - Icon Only */}
                <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="flex items-center justify-center bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                    title={gettingLocation ? "Getting location..." : "Use Current Location"}
                >
                    <IoLocationOutline className="text-xl text-white" />
                </button>
            </div>

            <div className="flex flex-col gap-4 mb-6 px-2">
                {vendors.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
                        <p className="text-gray-600 text-sm">No vendors available nearby</p>
                    </div>
                ) : (
                    vendors.map((vendor, index) => {
                        // Generate different colored backgrounds for profile pictures
                        const colors = ['#B3E5FC', '#FFEB3B', '#C8E6C9', '#FFCCBC', '#E1BEE7'];
                        const bgColor = colors[index % colors.length];

                        return (
                            <div
                                key={vendor._id}
                                onClick={() => navigate(`/user/vendor-profile/${vendor._id}`)}
                                className="relative flex items-center gap-4 rounded-2xl bg-white p-4 shadow-lg cursor-pointer hover:shadow-xl transition-all active:scale-[0.98]"
                            >
                                {/* Distance Badge - Top Right */}
                                {userLocation.lat && userLocation.lng && vendor.distance !== null && vendor.distance !== undefined && !isNaN(vendor.distance) && (
                                    <span className="absolute top-2 right-2 text-xs font-semibold text-white bg-orange-400 px-2.5 py-1 rounded-full whitespace-nowrap z-10">
                                        {typeof vendor.distance === 'number' ? vendor.distance.toFixed(1) : vendor.distance} km away
                                    </span>
                                )}

                                {/* Vendor Image - Circular with colored background */}
                                <div className="relative shrink-0">
                                    <div
                                        className="h-20 w-20 rounded-full bg-cover bg-center bg-no-repeat border-4 border-white shadow-md"
                                        style={{
                                            backgroundImage: vendor.profilePicture
                                                ? `url("${vendor.profilePicture}")`
                                                : "none",
                                            backgroundColor: vendor.profilePicture ? "transparent" : bgColor
                                        }}
                                    >
                                        {!vendor.profilePicture && (
                                            <div className="w-full h-full flex items-center justify-center rounded-full">
                                                <span className="text-3xl">👤</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Vendor Details - Middle Section */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-800 text-base mb-1">
                                        {vendor.name}
                                    </h4>
                                    <p className="text-sm text-gray-500 mb-1.5">
                                        {vendor.experience ? `${vendor.experience} years Experience` : (vendor.category || vendor.serviceTags?.[0] || "General")}
                                    </p>
                                    <div className="flex items-center gap-1 text-sm">
                                        <IoStarOutline className="text-base text-yellow-500" />
                                        <span className="font-bold text-gray-800">
                                            {vendor.averageRating?.toFixed(1) || "0.0"}
                                        </span>
                                        <span className="text-gray-500">
                                            ({vendor.totalRatings || 0})
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Request Status Modal */}
            {
                showStatusModal && (
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
                                    {statusFilter === 'REPORTS' ? 'Survey Reports' : statusFilter === 'PENDING_PAYMENT' ? 'Pending Payments' : 'Booking Status'}
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
                                                    className="bg-white rounded-[12px] p-5 border-2 border-[#87CEEB] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
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

                                                    {/* Action Buttons */}
                                                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-3">
                                                        {request.hasReport && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/user/booking/${request.id}/report`);
                                                                }}
                                                                className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${request.waterFound ? 'bg-emerald-600 text-white animate-blink-green' : 'bg-red-600 text-white animate-blink-red'}`}
                                                            >
                                                                View Report <IoNewspaperOutline />
                                                            </button>
                                                        )}
                                                        {(request.status === 'pending' || request.status === 'awaiting_advance') && request.paymentStatus === 'PENDING' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleResumePayment(request);
                                                                }}
                                                                className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                                                            >
                                                                Complete Payment <IoCheckmarkCircleOutline />
                                                            </button>
                                                        )}
                                                        {(request.status === 'awaiting_payment' || request.status === 'report_uploaded') && !request.bookingData?.payment?.remainingPaid && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/user/booking/${request.id}/payment`);
                                                                }}
                                                                className="px-4 py-2 bg-[#0A84FF] text-white text-sm font-bold rounded-lg shadow-sm hover:bg-[#005BBB] transition-colors flex items-center gap-2"
                                                            >
                                                                Pay Remaining <IoWalletOutline />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            <InputModal
                isOpen={showCancellationInput}
                onClose={() => setShowCancellationInput(false)}
                onSubmit={handleCancellationReasonSubmit}
                title="Cancel Booking"
                message="Please tell us why you are cancelling:"
                placeholder="Reason for cancellation..."
                submitText="Continue"
                cancelText="Keep Booking"
                isTextarea={true}
            />

            <ConfirmModal
                isOpen={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                onConfirm={handleCancelConfirm}
                title="Confirm Cancellation"
                message="Are you sure? This action cannot be undone."
                confirmText="Yes, Cancel"
                cancelText="Go Back"
                confirmColor="danger"
            />
        </div >
    );
}
