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
    IoInformationCircleOutline,
    IoWaterOutline,
    IoArrowDownOutline,
    IoImageOutline,
    IoWalletOutline,
    IoNewspaperOutline,
    IoLeafOutline,
    IoHomeOutline,
    IoBusinessOutline,
    IoBuildOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoLockClosedOutline,
    IoCarOutline
} from "react-icons/io5";
import {
    HiOutlineHome,
    HiOutlineBuildingOffice2,
    HiOutlineBriefcase,
    HiOutlineWrenchScrewdriver
} from "react-icons/hi2";
import { getUserProfile } from "../../../services/authApi";
import { getUserDashboardStats, getNearbyVendors, cancelBooking, getUserBookings } from "../../../services/bookingApi";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import InputModal, { CANCELLATION_REASONS } from "../../shared/components/InputModal";
import ConfirmModal from "../../shared/components/ConfirmModal";
import CancellationPolicyModal from "../../shared/components/CancellationPolicyModal";
import { useNotifications } from "../../../contexts/NotificationContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import PlaceAutocompleteInput from "../../../components/PlaceAutocompleteInput";
import ExpertProfileCard from "../components/ExpertProfileCard";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export default function UserDashboard() {
    const { t } = useLanguage();
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
    const [cancelling, setCancelling] = useState(false);
    const [selectedBookingForAction, setSelectedBookingForAction] = useState(null);
    const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
    const [bookingToUnlock, setBookingToUnlock] = useState(null);

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
            loadDashboardData();
        };

        const handleBookingUpdate = () => {
            loadDashboardData();
        };

        socket.on("new_notification", handleNewNotification);
        socket.on("booking_updated", handleBookingUpdate);
        return () => {
            socket.off("new_notification", handleNewNotification);
            socket.off("booking_updated", handleBookingUpdate);
        };
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
                    waterFound: booking.report?.waterFound === true || booking.report?.waterFound === "true",
                    hasBorewellResult: !!booking.borewellResult?.uploadedAt
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
        // Prevent body and html scroll when modal is open
        if (showStatusModal) {
            const originalBodyOverflow = document.body.style.overflow;
            const originalHtmlOverflow = document.documentElement.style.overflow;
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = originalBodyOverflow;
                document.documentElement.style.overflow = originalHtmlOverflow;
            };
        }
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

        setCancelling(true);
        try {
            const response = await cancelBooking(selectedBookingForAction.id, cancellationReason);

            if (response.success) {
                toast.showSuccess("Booking cancelled successfully");
                setShowCancelConfirm(false);
                setSelectedBookingForAction(null);
                setCancellationReason("");
                // Refresh data
                loadDashboardData();
            } else {
                toast.showError(response.message || "Failed to cancel booking");
            }
        } catch (err) {
            toast.showError(err.response?.data?.message || "Failed to cancel booking");
        } finally {
            setCancelling(false);
        }
    };

    const handleReportClick = (e, request) => {
        if (e) e.stopPropagation();

        const isPaid = request.bookingData?.payment?.remainingPaid;

        if (!isPaid) {
            setBookingToUnlock(request);
            setShowPaymentPrompt(true);
        } else {
            navigate(`/user/booking/${request.id}/report`);
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
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 px-4 pt-24 pb-20 md:-mx-6 md:-mt-28 md:pt-28 md:pb-12 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">

            {/* Profile Header — Senior SDE Glassmorphic Banner */}
            <section className="relative my-3 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-[#0A84FF] to-indigo-600 p-6 shadow-xl shadow-blue-500/10 text-white">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] sm:text-xs font-extrabold text-white mb-2 border border-white/25 shadow-2xs">
                            <span>🇮🇳 {t('indiaFirstPlatform', "India's 1st Groundwater Survey Booking Platform")}</span>
                        </div>
                        <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-tight">
                            {t('welcomeBack', 'Welcome back')}, {userName} 👋
                        </h1>
                        <p className="text-xs sm:text-sm text-blue-100 font-medium mt-1 leading-normal">
                            {t('findExpertsDesc', 'Find verified groundwater survey experts and book your survey.')}
                        </p>
                    </div>
                    {/* White Circular Profile Picture */}
                    <div
                        className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white bg-cover bg-center flex-shrink-0 shadow-lg border-2 border-white/90"
                        style={{
                            backgroundImage: userAvatar
                                ? `url("${userAvatar}")`
                                : `url("${avatarImageUrl}")`,
                        }}
                    ></div>
                </div>
            </section>

            {/* Survey Categories Header */}
            <div className="px-1 pt-4 pb-2 flex items-center justify-between">
                <div>
                    <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">{t('surveyPurpose', 'Survey Purpose')}</h2>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">{t('selectSiteCategory', 'Select your site category to begin survey booking.')}</p>
                </div>
            </div>

            {/* Category Cards — 4 Grid Items matching Survey Flow */}
            <div className="mt-2 mb-6 grid grid-cols-2 gap-3.5">
                {[
                    { id: "Agriculture", label: t('agriculture', 'Agriculture'), icon: IoLeafOutline, color: "from-emerald-50 to-teal-50", iconColor: "text-emerald-600 bg-emerald-100/80", border: "border-emerald-200/60" },
                    { id: "Domestic/Household", label: t('household', 'Household'), icon: HiOutlineHome, color: "from-blue-50 to-indigo-50", iconColor: "text-[#0A84FF] bg-blue-100/80", border: "border-blue-200/60" },
                    { id: "Industrial/Commercial", label: t('commercial', 'Commercial'), icon: HiOutlineBuildingOffice2, color: "from-indigo-50 to-purple-50", iconColor: "text-indigo-600 bg-indigo-100/80", border: "border-indigo-200/60" },
                    { id: "Industrial", label: t('industrial', 'Industrial'), icon: HiOutlineBriefcase, color: "from-amber-50 to-orange-50", iconColor: "text-amber-600 bg-amber-100/80", border: "border-amber-200/60" }
                ].map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => navigate("/user/survey", { state: { category: cat.id } })}
                        className={`group relative flex flex-col items-center justify-center p-5 bg-gradient-to-br ${cat.color} rounded-2xl border ${cat.border} shadow-xs hover:shadow-md active:scale-[0.97] transition-all duration-200 text-center`}
                    >
                        <div className={`p-3.5 rounded-2xl ${cat.iconColor} mb-2.5 transition-transform duration-200 group-hover:scale-110 shadow-2xs`}>
                            <cat.icon className="text-2xl" />
                        </div>
                        <span className="font-extrabold text-gray-900 text-sm tracking-tight">{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* Services Overview / Quick Access */}
            <h2 className="px-2 pt-4 pb-4 text-lg font-bold text-gray-800">
                {t('quickAccess', 'Quick Access')}
            </h2>
            <div className="grid grid-cols-5 gap-1 mb-6 px-1">
                {/* Booking Status */}
                <div
                    onClick={() => navigate("/user/status")}
                    className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-[0.95] transition-transform"
                >
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-blue-200 shadow-[0px_2px_8px_rgba(59,130,246,0.2)] flex items-center justify-center hover:shadow-[0px_4px_12px_rgba(59,130,246,0.3)] transition-all overflow-hidden shrink-0 border border-blue-100/50">
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent"></div>
                        <IoDocumentTextOutline className="text-xl text-blue-600 relative z-10" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 text-center leading-tight px-0.5">
                        {t('bookingStatus', 'Booking Status')}
                    </span>
                </div>

                {/* Current Booking */}
                <div
                    onClick={() => {
                        const activeBooking = requestStatuses.find(r =>
                            !['cancelled', 'rejected', 'failed'].includes(r.status?.toLowerCase() || '') &&
                            (!['completed', 'success'].includes(r.status?.toLowerCase() || '') || r.hasReport)
                        );
                        if (activeBooking?.id || activeBooking?._id) {
                            navigate(`/user/booking/${activeBooking.id || activeBooking._id}`);
                        } else {
                            navigate("/user/status");
                        }
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-[0.95] transition-transform"
                >
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-200 shadow-[0px_2px_8px_rgba(16,185,129,0.2)] flex items-center justify-center hover:shadow-[0px_4px_12px_rgba(16,185,129,0.3)] transition-all overflow-hidden shrink-0 border border-emerald-100/50">
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent"></div>
                        <IoCalendarOutline className="text-xl text-emerald-600 relative z-10" />
                        <IoCheckmarkCircle className="absolute -bottom-0.5 -right-0.5 text-sm text-emerald-600 z-20" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 text-center leading-tight px-0.5">
                        {t('currentBooking', 'Current Booking')}
                    </span>
                </div>

                {/* Pending Payments */}
                <div
                    onClick={() => navigate("/user/payments-invoices")}
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
                        {t('pendingPayments', 'Pending Payments')}
                    </span>
                </div>

                {/* Survey Reports */}
                <div
                    onClick={() => navigate("/user/survey-reports")}
                    className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-[0.95] transition-transform"
                >
                    <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-200 shadow-[0px_2px_8px_rgba(79,70,229,0.2)] flex items-center justify-center hover:shadow-[0px_4px_12px_rgba(79,70,229,0.3)] transition-all overflow-hidden shrink-0 border border-indigo-100/50 ${requestStatuses.some(r => r.hasReport && r.bookingData?.payment?.remainingPaid) ? (requestStatuses.find(r => r.hasReport && r.bookingData?.payment?.remainingPaid)?.waterFound ? 'animate-blink-green' : 'animate-blink-red') : ''}`}>
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent"></div>
                        <IoNewspaperOutline className={`text-xl relative z-10 ${requestStatuses.some(r => r.hasReport && r.bookingData?.payment?.remainingPaid) ? 'text-white' : 'text-indigo-600'}`} />
                        {requestStatuses.some(r => r.hasReport) && (
                            <div className={`absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white z-20 shadow-sm flex items-center justify-center ${requestStatuses.find(r => r.hasReport && !r.bookingData?.payment?.remainingPaid)
                                ? 'bg-gray-400'
                                : (requestStatuses.find(r => r.hasReport)?.waterFound ? 'bg-emerald-500' : 'bg-red-500')
                                }`}>
                                {requestStatuses.some(r => r.hasReport && !r.bookingData?.payment?.remainingPaid) && (
                                    <IoLockClosedOutline className="text-[8px] text-white" />
                                )}
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 text-center leading-tight px-0.5">
                        {t('surveyReports', 'Survey Reports')}
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
                        {t('updateProfile', 'Update Profile')}
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
                                Booking in Progress
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
                                    {/* Start Survey OTP Display Box */}
                                    {(activeBooking.status?.toUpperCase() === 'EN_ROUTE' || activeBooking.bookingData?.status === 'EN_ROUTE') && !activeBooking.bookingData?.otp?.startSurvey?.verified && (
                                        <div className="bg-indigo-50/80 rounded-xl p-3.5 border border-indigo-200/80 flex items-center justify-between gap-3">
                                            <div>
                                                <span className="text-[11px] font-black uppercase text-indigo-900 block tracking-wide">Start Survey OTP</span>
                                                <span className="text-xs text-indigo-700 font-semibold">Share with expert upon arrival</span>
                                            </div>
                                            <div className="bg-white px-3 py-1.5 rounded-lg border border-indigo-300 shadow-xs">
                                                <span className="text-xl font-black text-indigo-600 tracking-widest">
                                                    {activeBooking.bookingData?.otp?.startSurvey?.code || '------'}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* End Survey OTP Display Box */}
                                    {(activeBooking.status?.toUpperCase() === 'VISITED' || activeBooking.bookingData?.status === 'VISITED') && !activeBooking.bookingData?.otp?.endSurvey?.verified && (
                                        <div className="bg-emerald-50/80 rounded-xl p-3.5 border border-emerald-200/80 flex items-center justify-between gap-3">
                                            <div>
                                                <span className="text-[11px] font-black uppercase text-emerald-900 block tracking-wide">End Survey OTP</span>
                                                <span className="text-xs text-emerald-700 font-semibold">Share with expert to confirm completion</span>
                                            </div>
                                            <div className="bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-xs">
                                                <span className="text-xl font-black text-emerald-600 tracking-widest">
                                                    {activeBooking.bookingData?.otp?.endSurvey?.code || '------'}
                                                </span>
                                            </div>
                                        </div>
                                    )}

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
                                            onClick={(e) => handleReportClick(e, activeBooking)}
                                            className={`w-full py-3 rounded-[12px] font-bold text-base transition-all flex items-center justify-center gap-2 ${!activeBooking.bookingData?.payment?.remainingPaid
                                                ? "bg-gray-100 text-gray-500 border border-gray-200"
                                                : activeBooking.waterFound ? 'bg-emerald-600 text-white animate-blink-green' : 'bg-red-600 text-white animate-blink-red'
                                                }`}
                                        >
                                            <div className="relative">
                                                <IoNewspaperOutline className="text-xl" />
                                                {!activeBooking.bookingData?.payment?.remainingPaid && (
                                                    <IoLockClosedOutline className="absolute -top-1 -right-1 text-[10px] bg-white rounded-full p-0.5 text-gray-700" />
                                                )}
                                            </div>
                                            <span>{activeBooking.bookingData?.payment?.remainingPaid ? "View Report" : "Unlock Report"}</span>
                                        </button>
                                    )}

                                    {(() => {
                                        const rawStatus = (activeBooking.bookingData?.userStatus || activeBooking.bookingData?.status || activeBooking.status || "").toLowerCase();
                                        if (['accepted', 'assigned', 'en_route', 'visited', 'pending', 'awaiting_advance'].includes(rawStatus)) {
                                            return (
                                                <button
                                                    onClick={() => navigate(`/user/booking/${activeBooking.id}/tracking`)}
                                                    className="w-full flex items-center justify-center gap-2 bg-[#0A84FF] text-white py-3.5 rounded-[12px] font-extrabold hover:bg-blue-600 transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
                                                >
                                                    <IoCarOutline className="text-xl" />
                                                    <span>Live Track Expert 🚗</span>
                                                </button>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {['pending', 'assigned', 'accepted', 'awaiting_advance'].includes(activeBooking.status.toLowerCase()) && (
                                        <button
                                            onClick={() => handleInitiateCancel(activeBooking)}
                                            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 py-3 rounded-[12px] font-semibold hover:bg-red-100 transition-all active:scale-95"
                                        >
                                            <IoCloseCircleOutline className="text-xl" />
                                            Cancel Booking
                                        </button>
                                    )}

                                    {!activeBooking.hasBorewellResult && ["PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT", "COMPLETED"].includes((activeBooking.bookingData?.userStatus || activeBooking.bookingData?.status || "").toUpperCase()) && (
                                        <button
                                            onClick={() => navigate(`/user/booking/${activeBooking.id}`, { state: { openBorewellModal: true } })}
                                            className="w-full flex items-center justify-center gap-2 bg-white text-[#0A84FF] border-2 border-[#0A84FF] py-3 rounded-[12px] font-bold hover:bg-blue-50 transition-all shadow-sm"
                                        >
                                            <IoImageOutline className="text-xl" />
                                            Upload Borewell Outcome
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

            {/* Top Verified Experts Near You */}
            <div className="px-1 pt-6 pb-2 flex items-center justify-between">
                <div>
                    <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                        Top &quot;Verified&quot; Groundwater Experts Near You 👨‍🔧
                    </h2>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">Certified groundwater survey specialists available for dispatch.</p>
                </div>
            </div>

            {/* Location Selector */}
            <div className="px-1 mb-4 flex gap-2.5">
                {/* Address Input with Autocomplete */}
                <div className="relative flex-1">
                    <IoSearchOutline className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 text-lg z-10" />
                    <PlaceAutocompleteInput
                        onPlaceSelect={handlePlaceSelect}
                        placeholder="Search address to filter nearby experts..."
                        value={searchAddress}
                        onChange={(e) => setSearchAddress(e.target.value)}
                        disabled={false}
                        className="w-full rounded-2xl border border-gray-200/80 bg-white py-3 pl-10 pr-4 text-sm text-gray-800 shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:shadow-md transition-all"
                        countryRestriction="in"
                        types={["geocode"]}
                    />
                </div>

                {/* Use Current Location Button */}
                <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="flex items-center justify-center bg-[#0A84FF] text-white p-3 rounded-2xl hover:bg-[#0070DF] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-200 active:scale-95 shrink-0"
                    title={gettingLocation ? "Getting location..." : "Use Current Location"}
                >
                    <IoLocationOutline className="text-xl text-white" />
                </button>
            </div>

            <div className="flex flex-col gap-3.5 mb-8 px-1">
                {vendors.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-xs border border-gray-100">
                        <p className="text-gray-500 text-sm font-semibold">No groundwater experts available nearby</p>
                    </div>
                ) : (
                    vendors.slice(0, 5).map((vendor) => (
                        <ExpertProfileCard
                            key={vendor._id}
                            expert={vendor}
                            actionLabel="View Profile"
                            onSelect={() => navigate(`/user/vendor-profile/${vendor._id}`)}
                        />
                    ))
                )}
            </div>

            {/* Geoscientific Instruments Survey Disclaimer Banner */}
            <div className="mx-1 mb-6 p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-3xl text-white shadow-xl relative overflow-hidden border border-slate-700/50">
                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10 flex items-start gap-4">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/15 text-2xl shrink-0 mt-0.5 shadow-xs flex items-center justify-center">
                        🔬
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="text-[10px] font-bold tracking-wide uppercase bg-blue-500/25 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-400/30 shrink-0">
                                Verified
                            </span>
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-base text-white leading-snug tracking-tight">
                            Professional Groundwater Surveys Using Advanced Geoscientific Instruments
                        </h3>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                            Our verified groundwater experts conduct professional groundwater surveys using advanced geoscientific instruments. Survey findings are based on local geological conditions and geophysical interpretations. Groundwater availability and borewell success cannot be guaranteed.
                        </p>
                    </div>
                </div>
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
                                                                onClick={(e) => handleReportClick(e, request)}
                                                                className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${!request.bookingData?.payment?.remainingPaid
                                                                    ? "bg-gray-100 text-gray-500 border border-gray-200"
                                                                    : request.waterFound ? 'bg-emerald-600 text-white animate-blink-green' : 'bg-red-600 text-white animate-blink-red'
                                                                    }`}
                                                            >
                                                                <div className="relative">
                                                                    <IoNewspaperOutline className="text-xl" />
                                                                    {!request.bookingData?.payment?.remainingPaid && (
                                                                        <IoLockClosedOutline className="absolute -top-1 -right-1 text-[10px] bg-white rounded-full p-0.5 text-gray-700" />
                                                                    )}
                                                                </div>
                                                                <span>{request.bookingData?.payment?.remainingPaid ? "View Report" : "Unlock Report"}</span>
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
                message="Please select the reason for cancelling your booking:"
                options={CANCELLATION_REASONS}
                submitText="Continue"
                cancelText="Keep Booking"
            />

            {/* Cancellation Confirmation Modal with Policy */}
            <CancellationPolicyModal
                isOpen={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                onConfirm={handleCancelConfirm}
                reason={cancellationReason}
                isLoading={cancelling}
            />

            {/* Payment Prompt Modal */}
            <PaymentPromptModal
                isOpen={showPaymentPrompt}
                onClose={() => setShowPaymentPrompt(false)}
                onPay={() => {
                    setShowPaymentPrompt(false);
                    navigate(`/user/booking/${bookingToUnlock?.id}/payment`);
                }}
                amount={bookingToUnlock?.payment?.remainingAmount}
                isReportReady={Boolean(
                    bookingToUnlock?.hasReport || 
                    bookingToUnlock?.bookingData?.report ||
                    ["REPORT_UPLOADED", "AWAITING_PAYMENT", "COMPLETED", "PAYMENT_SUCCESS", "PAID_FIRST", "BOREWELL_UPLOADED", "ADMIN_APPROVED", "FINAL_SETTLEMENT"].includes(bookingToUnlock?.rawStatus)
                )}
            />
        </div >
    );
}

/* ---------------------------
   REUSABLE COMPONENTS
---------------------------- */
function PaymentPromptModal({ isOpen, onClose, onPay, amount, isReportReady }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-[24px] w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <IoLockClosedOutline className="text-4xl text-orange-500" />
                    </div>

                    <h2 className="text-2xl font-black text-gray-900 mb-2">
                        {isReportReady ? "Awaiting Final Payment" : "Survey Report in Progress"}
                    </h2>
                    <p className="text-gray-500 mb-8 leading-relaxed text-sm">
                        {isReportReady ? (
                            <>
                                Your survey report is ready. Complete the remaining payment of <span className="text-gray-900 font-bold">₹{amount?.toLocaleString('en-IN')}</span> to access and view your detailed groundwater survey report.
                            </>
                        ) : (
                            <>
                                Your assigned expert is currently preparing your groundwater survey report. Complete the remaining payment of <span className="text-gray-900 font-bold">₹{amount?.toLocaleString('en-IN')}</span> to access it immediately once uploaded.
                            </>
                        )}
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={onPay}
                            className="w-full bg-[#0A84FF] text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-blue-200 active:scale-[0.98] transition-all"
                        >
                            {isReportReady ? "Pay and unlock report" : "Pay remaining payment"}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full bg-gray-50 text-gray-500 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all text-sm"
                        >
                            Not now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
