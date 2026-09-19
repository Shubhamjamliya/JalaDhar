import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
    IoBriefcaseOutline,
    IoWalletOutline,
    IoDocumentTextOutline,
    IoPersonCircleOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoCalendarOutline,
    IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import {
    getDashboardStats,
    getVendorProfile,
    getMyRatings,
} from "../../../services/vendorApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import PageContainer from "../../shared/components/PageContainer";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import { getExpertLiveStatus, formatWorkingHours } from "../../../utils/availabilityUtils";
import VendorAvailabilityModal from "../vendor-components/VendorAvailabilityModal";


export default function VendorDashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const { vendor, updateOnlineStatus, allowAvailabilityToggle, availabilitySettings } = useVendorAuth();
    const { socket } = useNotifications();
    const [loading, setLoading] = useState(true);
    const [showPauseModal, setShowPauseModal] = useState(false);
    const [pauseLoading, setPauseLoading] = useState(false);
    const liveStatus = getExpertLiveStatus(vendor);


    const handleResumeOnline = async () => {
        setPauseLoading(true);
        try {
            const res = await updateOnlineStatus({ isOnline: true });
            if (res.success) {
                toast.showSuccess("You are now Online and receiving new booking requests!");
            } else {
                toast.showError(res.message || "Failed to update status");
            }
        } catch (err) {
            toast.showError("Failed to update status");
        } finally {
            setPauseLoading(false);
            setShowPauseModal(false);
        }
    };

    const handleConfirmPause = async (pauseDuration) => {
        setPauseLoading(true);
        try {
            const res = await updateOnlineStatus({
                isOnline: false,
                pauseDuration,
                pauseReason: pauseDuration === 'REST_OF_TODAY' ? 'BUSY_TODAY' : (pauseDuration === '2_HOURS' ? 'QUICK_BREAK' : 'MANUAL')
            });
            if (res.success) {
                toast.showSuccess(
                    pauseDuration === 'REST_OF_TODAY'
                        ? "Paused for today. Auto-resuming tomorrow morning!"
                        : pauseDuration === '2_HOURS'
                        ? "Paused for 2 hours."
                        : "You are now offline."
                );
            } else {
                toast.showError(res.message || "Failed to update status");
            }
        } catch (err) {
            toast.showError("Failed to update status");
        } finally {
            setPauseLoading(false);
            setShowPauseModal(false);
        }
    };

    const [stats, setStats] = useState({
        pendingBookings: 0,
        assignedBookings: 0,
        acceptedBookings: 0,
        visitedBookings: 0,
        completedBookings: 0,
        todayBookings: 0,
        totalBookings: 0,
        servicesCount: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        paymentCollection: {
            totalEarnings: 0,
            pendingAmount: 0,
            collectedAmount: 0,
        },
    });
    const [recentBookings, setRecentBookings] = useState([]);
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [vendorProfileData, setVendorProfileData] = useState(null);
    const [ratingsStats, setRatingsStats] = useState(null);
    const toast = useToast();

    // Load data on mount and when location changes (navigation back)
    useEffect(() => {
        loadDashboardData();
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

    // Listen for real-time notifications via Socket.IO
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification) => {
            console.log('[VendorDashboard] New notification received:', notification);

            // Auto-refresh dashboard for booking-related notifications
            if (notification.type === 'BOOKING_CREATED' ||
                notification.type === 'BOOKING_ASSIGNED' ||
                notification.type === 'BOOKING_STATUS_UPDATED' ||
                notification.type === 'PAYMENT_RECEIVED' ||
                notification.type === 'NEW_BOOKING') {
                console.log('[VendorDashboard] Refreshing dashboard...');
                loadDashboardData();
            }
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket]);

    // Debug: Log when vendor profile data changes
    useEffect(() => {
        if (vendorProfileData) {
            // Expert profile data updated
        }
    }, [vendorProfileData]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch dashboard stats
            const dashboardResponse = await getDashboardStats();

            if (dashboardResponse.success) {
                setStats(dashboardResponse.data.stats);
                setRecentBookings(dashboardResponse.data.recentBookings || []);
                setUpcomingBookings(
                    dashboardResponse.data.upcomingBookings || []
                );
            } else {
                toast.showError("Failed to load dashboard data");
            }
        } catch (err) {
            handleApiError(err, "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }

        // Fetch vendor profile separately (don't block dashboard if this fails)
        try {
            const profileResponse = await getVendorProfile();
            if (
                profileResponse.success &&
                profileResponse.data &&
                profileResponse.data.vendor
            ) {
                setVendorProfileData(profileResponse.data.vendor);
            }
        } catch (err) {
            // Don't set error for profile fetch failure, just log it
        }

        // Fetch real-time rating and reviews stats
        try {
            const ratingsResponse = await getMyRatings({ page: 1, limit: 1 });
            if (ratingsResponse.success && ratingsResponse.data && ratingsResponse.data.stats) {
                setRatingsStats(ratingsResponse.data.stats);
            }
        } catch (err) {
            // Silently fall back to vendor profile rating
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

    const formatTime = (timeString) => {
        return timeString || "N/A";
    };

    const formatAddress = (address) => {
        if (!address) return "Location on Map";
        if (typeof address === 'string') return address.trim();
        const street = address.street?.trim() || "";
        const city = address.city?.trim() || "";
        const state = address.state?.trim() || "";
        const pincode = address.pincode?.trim() || "";

        const parts = [];
        if (street) parts.push(street);
        if (city && !street.toLowerCase().includes(city.toLowerCase())) parts.push(city);
        if (state && !street.toLowerCase().includes(state.toLowerCase())) parts.push(state);
        if (pincode && !street.includes(pincode)) parts.push(pincode);

        return parts.join(", ") || "Location on Map";
    };

    const getBookingStatusBadge = (status) => {
        switch (status) {
            case "ASSIGNED":
            case "PENDING":
                return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200/80", dot: "bg-amber-500", label: "Assigned" };
            case "ACCEPTED":
                return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200/80", dot: "bg-blue-500", label: "Accepted" };
            case "EN_ROUTE":
                return { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200/80", dot: "bg-indigo-500", label: "En Route" };
            case "VISITED":
            case "IN_PROGRESS":
                return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200/80", dot: "bg-purple-500", label: "Survey Started" };
            case "REPORT_UPLOADED":
                return { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200/80", dot: "bg-cyan-500", label: "Report Uploaded" };
            case "COMPLETED":
                return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/80", dot: "bg-emerald-500", label: "Completed" };
            default:
                return { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200/80", dot: "bg-slate-400", label: status?.replace(/_/g, " ") || "Active" };
        }
    };

    const formatAmount = (amount) => {
        if (!amount) return "₹0";
        return `₹${amount.toLocaleString("en-IN")}`;
    };

    const formatBookingId = (bookingId) => {
        if (!bookingId) return "N/A";
        const shortId = bookingId.toString().slice(-4).toUpperCase();
        return `#JAL${shortId}`;
    };

    const formatDateTime = (dateString, timeString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const isToday = date.toDateString() === today.toDateString();
        const isYesterday = date.toDateString() === yesterday.toDateString();

        let dateStr = "";
        if (isToday) {
            dateStr = "Today";
        } else if (isYesterday) {
            dateStr = "Yesterday";
        } else {
            dateStr = date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
            });
        }

        const time = timeString || "";
        return `${time}, ${dateStr}`;
    };

    // Background and avatar images
    const backgroundImageUrl =
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCSWOEOG7ry6z14TFWGAz7PjaKTwn697LggEX4Vf1U2F-18-Yl362M1a0XmrCPrnxjq3HLvvisiIPbnCcLWbicHHyQVehSZEC56qo5fvTVnSjPmEPPFLj9dncg63DYDUscFj51kK5mnPvn7hznGuHDuYjMiSWsX7r6Nlpe1ss-SQVtV_G_yADjJFZVcqSA8EGeUz4tjBJlabT7hxamjtW25RfdT9g0K2O82ATNS4J1em3nBru9nIKr4YnD72XMjXgETg4PCKTSCxEva";

    const avatarImageUrl =
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDCqZRhSzmWMNhXuX4RPFuS_KD7WQ8XLgbsk2nXkV3JICy3ZcLfqjZnTbmofKaBePVQ9HQeoiASrUYaU_VYP7dBYSFBI9Z5WlMcnCKPDQIZaN5Uo8Qh4iv3tNNNnrRAnqP6QfGEIvqzMRneraT-7cwEGw9ba4Ci_wx2qsxlsRdxcPVRdPcnkz2n2vv4YM02MHGkKA3Punga2QFw4FyWv6phuBqmgoiAjWSehWquP1nyb8tigrHh5j6ir7c3uumnU1LI7khab45fuKmL";

    const fallbackAvatar =
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300";

    const rawProfileImage =
        vendorProfileData?.documents?.profilePicture?.url ||
        vendorProfileData?.profilePicture?.url ||
        (typeof vendorProfileData?.profilePicture === 'string' ? vendorProfileData.profilePicture : null) ||
        vendor?.documents?.profilePicture?.url ||
        vendor?.profilePicture?.url ||
        (typeof vendor?.profilePicture === 'string' ? vendor.profilePicture : null);

    const isPlaceholderImage = typeof rawProfileImage === 'string' && (rawProfileImage.includes('aida-public') || rawProfileImage.includes('AB6AXuDCqZ'));
    const displayAvatar = (!rawProfileImage || isPlaceholderImage) ? fallbackAvatar : rawProfileImage;

    // Display helpers for hero banner
    const expertName = vendorProfileData?.name || vendor?.name || "Jaladhaara Expert";
    const expertDesignation = vendorProfileData?.designation || vendor?.designation || "Geophysicist";

    // Real ratings and reviews data (connected to database - no dummy fallbacks)
    const realRatingNum =
        (typeof ratingsStats?.averageRating === 'number' ? ratingsStats.averageRating : null) ??
        (typeof vendorProfileData?.rating?.averageRating === 'number' ? vendorProfileData.rating.averageRating : null) ??
        (typeof vendor?.rating?.averageRating === 'number' ? vendor.rating.averageRating : null) ??
        0;
    const ratingScore = realRatingNum > 0 ? realRatingNum.toFixed(1) : "0.0";

    const totalReviews =
        (typeof ratingsStats?.totalRatings === 'number' ? ratingsStats.totalRatings : null) ??
        (typeof vendorProfileData?.rating?.totalRatings === 'number' ? vendorProfileData.rating.totalRatings : null) ??
        (typeof vendor?.rating?.totalRatings === 'number' ? vendor.rating.totalRatings : null) ??
        0;

    const rawCity = vendorProfileData?.district || vendorProfileData?.city || vendor?.district || vendor?.city || "Bengaluru";
    let rawState = vendorProfileData?.state || vendor?.state || "KA";
    if (typeof rawState === 'string' && rawState.toLowerCase() === "karnataka") rawState = "KA";
    const locationText = `${rawCity}, ${rawState}`;

    // Calculate pending requests (ASSIGNED + PENDING statuses - bookings waiting for vendor action)
    const pendingRequests = (stats.assignedBookings || 0) + (stats.pendingBookings || 0);

    if (loading) {
        return (
            <PageContainer className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner message="Loading dashboard..." />
            </PageContainer>
        );
    }

    return (
        <PageContainer className="w-full max-w-full overflow-x-hidden pb-12">

            {/* Profile Header — Premium Royal Blue Hydrogeology Banner */}
            <section className="relative my-3 overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#003B99] via-[#005CE2] to-[#007CFE] p-4 sm:p-5 md:p-6 shadow-xl shadow-blue-900/20 text-white border border-white/20">
                {/* Aquatic Contour Wave Lines Background Graphic */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    <svg className="absolute right-0 top-0 h-full w-full opacity-20" viewBox="0 0 1000 300" fill="none" preserveAspectRatio="none">
                        <path d="M450,300 C600,240 680,120 880,50 C930,32 970,30 1000,32 L1000,300 Z" fill="url(#wave-grad-1)" />
                        <path d="M380,300 C530,220 620,100 820,30 C880,10 940,15 1000,20 L1000,300 Z" fill="url(#wave-grad-2)" />
                        <path d="M480,300 C620,260 720,140 920,70 C960,55 980,52 1000,55" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                        <path d="M420,300 C560,230 650,110 850,40 C910,20 960,25 1000,28" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
                        <defs>
                            <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.08" />
                                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
                            </linearGradient>
                            <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.12" />
                                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.03" />
                            </linearGradient>
                        </defs>
                    </svg>
                    {/* Ambient Glows */}
                    <div className="absolute -top-10 -left-10 w-36 h-36 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute top-1/2 right-1/4 w-48 h-28 bg-sky-300/15 rounded-full blur-3xl"></div>
                </div>

                {/* Main Content Layout */}
                <div className="relative z-10 flex items-center justify-between gap-2 sm:gap-4">
                    {/* Left: Avatar & Expert Identity */}
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                        {/* Circular Avatar with White Border */}
                        <div className="relative shrink-0">
                            <div className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border-2 sm:border-[3px] border-white shadow-md overflow-hidden bg-blue-800 ring-2 ring-white/25">
                                <img
                                    src={displayAvatar}
                                    alt={expertName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = fallbackAvatar;
                                    }}
                                />
                            </div>
                            {/* Live Indicator Dot at bottom right */}
                            <div
                                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                                    liveStatus.status === 'ONLINE'
                                        ? 'bg-[#00E676]'
                                        : liveStatus.status === 'PAUSED'
                                        ? 'bg-amber-400'
                                        : 'bg-slate-400'
                                }`}
                                title={liveStatus.label}
                            >
                                {liveStatus.status === 'ONLINE' && (
                                    <span className="w-1 h-1 rounded-full bg-white animate-ping opacity-75"></span>
                                )}
                            </div>
                        </div>

                        {/* Name and Designation */}
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] sm:text-xs text-blue-100 font-medium tracking-wide leading-tight whitespace-nowrap">
                                Welcome back,
                            </p>
                            <h1 className="text-[13px] sm:text-base md:text-xl font-bold text-white tracking-tight leading-snug break-words whitespace-normal mt-0.5">
                                {expertName}
                            </h1>
                            <p className="text-[10px] sm:text-xs md:text-sm text-blue-100/85 font-normal truncate mt-0.5 leading-tight">
                                {expertDesignation}
                            </p>
                        </div>
                    </div>

                    {/* Right Section: Status Pill + Rating & Location directly below it */}
                    <div className="shrink-0 flex flex-col items-end gap-1 text-right">
                        {/* Status Pill Badge - Compact Size */}
                        <div className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full backdrop-blur-md border text-[9px] sm:text-xs font-semibold shadow-xs ${
                            liveStatus.status === 'ONLINE'
                                ? 'bg-[#002759]/80 text-white border-emerald-400/30'
                                : liveStatus.status === 'PAUSED'
                                ? 'bg-[#422006]/80 text-amber-200 border-amber-500/30'
                                : 'bg-[#0f172a]/80 text-slate-200 border-slate-600/30'
                        }`}>
                            <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${
                                liveStatus.status === 'ONLINE'
                                    ? 'bg-[#00E676] shadow-[0_0_6px_#00E676]'
                                    : liveStatus.status === 'PAUSED'
                                    ? 'bg-amber-400 shadow-[0_0_6px_#FBBF24]'
                                    : 'bg-slate-400'
                            }`}></span>
                            <span className="whitespace-nowrap leading-none">{liveStatus.label || "Available Now"}</span>
                        </div>

                        {/* Rating & Location - Placed just below Available */}
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-0.5 sm:gap-1.5 mt-0.5 text-xs sm:text-sm text-white font-medium">
                            <Link
                                to="/vendor/reviews"
                                title="View real reviews"
                                className="inline-flex items-center gap-1 shrink-0 hover:opacity-85 transition-opacity"
                            >
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#FFB800] fill-[#FFB800] drop-shadow-xs shrink-0" viewBox="0 0 24 24">
                                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                                <span className="font-bold text-white text-[10px] sm:text-xs">{ratingScore}</span>
                                <span className="text-blue-100/85 font-normal text-[10px] sm:text-xs">({totalReviews})</span>
                            </Link>
                            <div className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-white/95 truncate max-w-[120px] sm:max-w-[180px]">
                                <span className="text-white/35 font-light hidden sm:inline">|</span>
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white fill-current shrink-0" viewBox="0 0 24 24">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                </svg>
                                <span className="truncate">{locationText}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Interactive Real-Time Availability & Dispatch Control Card */}
            <section className={`my-2 sm:my-2.5 p-2.5 sm:p-3 px-3.5 sm:px-4.5 rounded-2xl border transition-all ${
                allowAvailabilityToggle === false
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-2xs'
                    : liveStatus.status === 'ONLINE'
                    ? 'bg-emerald-50/70 border-emerald-200/80 shadow-2xs'
                    : liveStatus.status === 'PAUSED'
                    ? 'bg-amber-50/80 border-amber-200 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 shadow-2xs'
            }`}>
                <div className="flex items-center justify-between gap-2.5 sm:gap-3">
                    <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                                allowAvailabilityToggle === false
                                    ? 'bg-emerald-500 animate-pulse'
                                    : liveStatus.status === 'ONLINE'
                                    ? 'bg-emerald-500 animate-pulse'
                                    : liveStatus.status === 'PAUSED'
                                    ? 'bg-amber-500'
                                    : 'bg-slate-400'
                            }`} />
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {allowAvailabilityToggle === false
                                    ? 'Scheduled Shift: On-Duty'
                                    : liveStatus.status === 'ONLINE'
                                    ? 'Instant Online Availability: Active'
                                    : liveStatus.status === 'PAUSED'
                                    ? 'Availability Paused'
                                    : 'Offline Mode: Requests Paused'}
                            </h3>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-500 font-medium line-clamp-1 sm:line-clamp-none leading-tight">
                            {allowAvailabilityToggle === false
                                ? `Active and follows shift schedule (${vendor?.workingHours ? formatWorkingHours(vendor.workingHours) : 'Configured Shift'}).`
                                : liveStatus.status === 'ONLINE'
                                ? 'Visible to nearby users for instant groundwater survey requests.'
                                : liveStatus.status === 'PAUSED'
                                ? `${liveStatus.label}. Ongoing and future bookings remain active.`
                                : 'You are currently offline. Turn online to accept survey leads.'}
                        </p>
                    </div>

                    <div className="shrink-0 flex items-center">
                        {allowAvailabilityToggle === false ? (
                            <div className="px-2.5 py-1.5 sm:px-3 rounded-xl bg-white border border-emerald-200 text-emerald-800 font-bold text-[11px] sm:text-xs shadow-2xs flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined !text-sm text-emerald-600">verified_user</span>
                                <span className="whitespace-nowrap">Shift Active</span>
                            </div>
                        ) : liveStatus.status === 'ONLINE' ? (
                            <button
                                type="button"
                                onClick={() => setShowPauseModal(true)}
                                disabled={pauseLoading}
                                className="px-2.5 py-1.5 sm:px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[11px] sm:text-xs shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                            >
                                <span className="material-symbols-outlined !text-sm text-amber-600">bedtime</span>
                                <span className="whitespace-nowrap">Take Break</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResumeOnline}
                                disabled={pauseLoading}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] sm:text-xs shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                            >
                                {pauseLoading ? (
                                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined !text-sm">bolt</span>
                                        <span className="whitespace-nowrap">Go Online</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </section>



            {/* Two Prominent KPI Stat Cards - Compact & Sleek */}
            <section className="my-2 sm:my-2.5 grid grid-cols-2 gap-2.5 sm:gap-3">
                {/* Total Bookings Card */}
                <div className="flex items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-3 shadow-2xs border border-gray-100/90 hover:border-blue-300 transition-all">
                    <div className="flex w-9 h-9 sm:w-10 sm:h-10 items-center justify-center rounded-xl bg-blue-50 text-[#0A84FF] shrink-0 border border-blue-100/80">
                        <span className="material-symbols-outlined !text-xl font-bold">
                            assignment
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-lg sm:text-xl font-black text-gray-900 leading-none mb-0.5">
                            {stats.totalBookings || 0}
                        </p>
                        <p className="text-[11px] sm:text-xs font-semibold text-gray-500 tracking-tight truncate">
                            Total Bookings
                        </p>
                    </div>
                </div>

                {/* Today Bookings Card */}
                <div className="flex items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl bg-white p-2.5 sm:p-3 shadow-2xs border border-gray-100/90 hover:border-indigo-300 transition-all">
                    <div className="flex w-9 h-9 sm:w-10 sm:h-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0 border border-indigo-100/80">
                        <span className="material-symbols-outlined !text-xl font-bold">
                            today
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-lg sm:text-xl font-black text-gray-900 leading-none mb-0.5">
                            {stats.todayBookings || 0}
                        </p>
                        <p className="text-[11px] sm:text-xs font-semibold text-gray-500 tracking-tight truncate">
                            Today's Jobs
                        </p>
                    </div>
                </div>
            </section>

            {/* Quick Actions & Navigation Hub */}
            <section className="my-3.5 sm:my-4 rounded-2xl bg-white p-3.5 sm:p-4 border border-gray-100 shadow-2xs">
                <div className="grid grid-cols-4 gap-2 text-center">
                    {/* Requests */}
                    <div
                        onClick={() => navigate("/vendor/requests")}
                        className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform group"
                    >
                        <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center transition-colors group-hover:bg-amber-100">
                            <span className="material-symbols-outlined !text-[22px] sm:!text-[24px]">
                                pending_actions
                            </span>
                            {pendingRequests > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                                    {pendingRequests}
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-semibold text-gray-800 text-center leading-tight whitespace-nowrap">
                            Requests
                        </span>
                        <span className="text-[11px] text-gray-400 font-normal">
                            {pendingRequests} new
                        </span>
                    </div>

                    {/* Completed */}
                    <div
                        onClick={() => navigate("/vendor/bookings")}
                        className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform group"
                    >
                        <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center transition-colors group-hover:bg-emerald-100">
                            <span className="material-symbols-outlined !text-[22px] sm:!text-[24px]">
                                check_circle
                            </span>
                        </div>
                        <span className="text-xs font-semibold text-gray-800 text-center leading-tight">
                            Completed
                        </span>
                        <span className="text-[11px] text-gray-400 font-normal">
                            {stats.completedBookings || 0} completed
                        </span>
                    </div>

                    {/* Wallet */}
                    <div
                        onClick={() => navigate("/vendor/wallet")}
                        className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform group"
                    >
                        <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center transition-colors group-hover:bg-blue-100">
                            <span className="material-symbols-outlined !text-[22px] sm:!text-[24px]">
                                account_balance_wallet
                            </span>
                        </div>
                        <span className="text-xs font-semibold text-gray-800 text-center leading-tight">
                            Wallet
                        </span>
                        <span className="text-[11px] text-gray-400 font-normal">
                            {formatAmount(
                                stats.paymentCollection?.collectedAmount || 0
                            )}
                        </span>
                    </div>

                    {/* Profile */}
                    <div
                        onClick={() => navigate("/vendor/profile")}
                        className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform group"
                    >
                        <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center transition-colors group-hover:bg-purple-100">
                            <span className="material-symbols-outlined !text-[22px] sm:!text-[24px]">
                                manage_accounts
                            </span>
                        </div>
                        <span className="text-xs font-semibold text-gray-800 text-center leading-tight">
                            Profile
                        </span>
                        <span className="text-[11px] text-gray-400 font-normal">
                            Edit details
                        </span>
                    </div>
                </div>
            </section>

            {/* Upcoming Bookings Section */}
            <section className="mt-6 sm:mt-7">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-gray-900">
                            Active Bookings
                        </h2>
                        {upcomingBookings.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                {upcomingBookings.length}
                            </span>
                        )}
                    </div>
                    {upcomingBookings.length > 0 && (
                        <button
                            type="button"
                            onClick={() => navigate("/vendor/bookings")}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            View All
                        </button>
                    )}
                </div>

                {upcomingBookings.length > 0 ? (
                    <div className="space-y-3">
                        {upcomingBookings.map((booking) => {
                            const statusBadge = getBookingStatusBadge(booking.status);
                            return (
                                <div
                                    key={booking._id}
                                    className="rounded-2xl bg-white p-3.5 sm:p-4 border border-gray-100 shadow-2xs hover:border-blue-200 hover:shadow-xs transition-all cursor-pointer group"
                                    onClick={() =>
                                        navigate(`/vendor/bookings/${booking._id}`)
                                    }
                                >
                                    {/* Top Row: User Avatar & Name + Status Badge */}
                                    <div className="flex items-start justify-between gap-2.5">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {booking.user?.profilePicture ? (
                                                <img
                                                    alt={booking.user?.name || "User"}
                                                    className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100 shrink-0"
                                                    src={booking.user.profilePicture}
                                                />
                                            ) : (
                                                <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 font-bold text-base flex items-center justify-center ring-2 ring-blue-50/80 shrink-0">
                                                    {booking.user?.name ? (
                                                        booking.user.name.charAt(0).toUpperCase()
                                                    ) : (
                                                        "👤"
                                                    )}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight truncate group-hover:text-blue-600 transition-colors">
                                                    {booking.user?.name || "Customer"}
                                                </h3>
                                                <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                                                    {booking.service?.name || "Groundwater Survey"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status Badge & Price */}
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusBadge.dot}`} />
                                                <span>{statusBadge.label}</span>
                                            </span>
                                            {booking.payment?.amount ? (
                                                <span className="text-xs font-bold text-gray-900">
                                                    {formatAmount(booking.payment.amount)}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* Middle Row: Address & Schedule Info */}
                                    <div className="mt-3 space-y-1.5 bg-gray-50/70 rounded-xl p-2.5 border border-gray-100/60">
                                        <div className="flex items-start gap-2 text-xs text-gray-600">
                                            <span className="material-symbols-outlined !text-[17px] text-gray-400 shrink-0 mt-0.5">
                                                location_on
                                            </span>
                                            <span className="line-clamp-2 leading-relaxed">
                                                {formatAddress(booking.address)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                            <span className="material-symbols-outlined !text-[17px] text-gray-400 shrink-0">
                                                schedule
                                            </span>
                                            <span>
                                                {formatDateTime(
                                                    booking.scheduledDate,
                                                    booking.scheduledTime
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bottom Footer: Booking ID + Action Link */}
                                    <div className="mt-3 pt-2.5 border-t border-gray-100/80 flex items-center justify-between text-xs">
                                        <span className="text-[11px] font-semibold text-gray-400 font-mono tracking-wide">
                                            {formatBookingId(booking._id)}
                                        </span>
                                        <span className="font-semibold text-blue-600 flex items-center gap-1 group-hover:text-blue-700 transition-colors">
                                            Manage Booking
                                            <span className="material-symbols-outlined !text-sm group-hover:translate-x-0.5 transition-transform">
                                                arrow_forward
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-2xl bg-white p-7 border border-gray-100 shadow-2xs text-center">
                        <div className="flex flex-col items-center gap-2.5">
                            <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                                <IoBriefcaseOutline className="text-2xl" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800 mb-0.5">
                                    No Active Bookings
                                </p>
                                <p className="text-xs text-gray-500">
                                    You don't have any active bookings at the moment.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Recent Bookings Section (Completed) */}
            <section className="mt-7 sm:mt-8">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-gray-900">
                            Completed Surveys
                        </h2>
                        {recentBookings.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                {recentBookings.length}
                            </span>
                        )}
                    </div>
                    {recentBookings.length > 0 && (
                        <button
                            type="button"
                            onClick={() => navigate("/vendor/bookings?tab=completed")}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            View All
                        </button>
                    )}
                </div>

                {recentBookings.length > 0 ? (
                    <div className="space-y-3">
                        {recentBookings.map((booking) => (
                            <div
                                key={booking._id}
                                className="rounded-2xl bg-white p-3.5 sm:p-4 border border-gray-100 shadow-2xs hover:border-emerald-200 hover:shadow-xs transition-all cursor-pointer group"
                                onClick={() =>
                                    navigate(`/vendor/bookings/${booking._id}`)
                                }
                            >
                                <div className="flex items-start justify-between gap-2.5">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {booking.user?.profilePicture ? (
                                            <img
                                                alt={booking.user?.name || "User"}
                                                className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100 shrink-0"
                                                src={booking.user.profilePicture}
                                            />
                                        ) : (
                                            <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 font-bold text-base flex items-center justify-center ring-2 ring-emerald-50/80 shrink-0">
                                                {booking.user?.name ? (
                                                    booking.user.name.charAt(0).toUpperCase()
                                                ) : (
                                                    "👤"
                                                )}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight truncate group-hover:text-emerald-600 transition-colors">
                                                {booking.user?.name || "Customer"}
                                            </h3>
                                            <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                                                {booking.service?.name || "Groundwater Survey"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200/80">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                            <span>Completed</span>
                                        </span>
                                        {booking.payment?.amount ? (
                                            <span className="text-xs font-bold text-gray-900">
                                                {formatAmount(booking.payment.amount)}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="mt-3 space-y-1.5 bg-gray-50/70 rounded-xl p-2.5 border border-gray-100/60">
                                    <div className="flex items-start gap-2 text-xs text-gray-600">
                                        <span className="material-symbols-outlined !text-[17px] text-gray-400 shrink-0 mt-0.5">
                                            location_on
                                        </span>
                                        <span className="line-clamp-2 leading-relaxed">
                                            {formatAddress(booking.address)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                        <span className="material-symbols-outlined !text-[17px] text-emerald-500 shrink-0">
                                            event_available
                                        </span>
                                        <span>
                                            {formatDateTime(
                                                booking.scheduledDate || booking.completedAt,
                                                booking.scheduledTime
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-3 pt-2.5 border-t border-gray-100/80 flex items-center justify-between text-xs">
                                    <span className="text-[11px] font-semibold text-gray-400 font-mono tracking-wide">
                                        {formatBookingId(booking._id)}
                                    </span>
                                    <span className="font-semibold text-emerald-600 flex items-center gap-1 group-hover:text-emerald-700 transition-colors">
                                        View Report
                                        <span className="material-symbols-outlined !text-sm group-hover:translate-x-0.5 transition-transform">
                                            arrow_forward
                                        </span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl bg-white p-7 border border-gray-100 shadow-2xs text-center">
                        <div className="flex flex-col items-center gap-2.5">
                            <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                                <IoCheckmarkCircleOutline className="text-2xl" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800 mb-0.5">
                                    No Completed Bookings
                                </p>
                                <p className="text-xs text-gray-500">
                                    You don't have any completed bookings yet.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Availability Smart Pause Modal */}
            <VendorAvailabilityModal
                isOpen={showPauseModal}
                onClose={() => setShowPauseModal(false)}
                onConfirm={handleConfirmPause}
                loading={pauseLoading}
            />
        </PageContainer>
    );
}

