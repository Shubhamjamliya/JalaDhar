import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import {
    getDashboardStats,
    getVendorProfile,
} from "../../../services/vendorApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";

export default function VendorDashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const { vendor } = useVendorAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pendingBookings: 0,
        assignedBookings: 0,
        acceptedBookings: 0,
        visitedBookings: 0,
        completedBookings: 0,
        todayBookings: 0,
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

    // Debug: Log when vendor profile data changes
    useEffect(() => {
        if (vendorProfileData) {
            // Vendor profile data updated
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
        if (!address) return "N/A";
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.pincode) parts.push(address.pincode);
        return parts.join(", ") || "N/A";
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

    // Get profile picture from fetched profile data (from DB) or fallback to context vendor
    const vendorProfileImage =
        vendorProfileData?.documents?.profilePicture?.url ||
        vendor?.documents?.profilePicture?.url ||
        null;

    // Calculate pending requests (ASSIGNED + PENDING statuses - bookings waiting for vendor action)
    const pendingRequests = (stats.assignedBookings || 0) + (stats.pendingBookings || 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 flex items-center justify-center">
                <LoadingSpinner message="Loading dashboard..." />
            </div>
        );
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
                            backgroundImage: vendorProfileImage
                                ? `url("${vendorProfileImage}")`
                                : "none",
                        }}
                    >
                        {!vendorProfileImage && (
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#BBDEFB] to-[#90CAF9] flex items-center justify-center">
                                <span className="text-2xl text-white">👤</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-[22px] font-bold tracking-tight text-gray-800">
                            Welcome, {vendorProfileData?.name ||
                                vendor?.name ||
                                "Vendor"}
                        </p>
                    </div>
                </div>
            </section>

            {/* Two Prominent Cards */}
            <section className="my-6 grid grid-cols-2 gap-4">
                {/* Pending Requests Card */}
                <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <div className="flex w-10 h-10 items-center justify-center rounded-full bg-orange-100 shrink-0">
                        <span className="material-symbols-outlined text-orange-500 text-xl">
                            pending_actions
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-[#3A3A3A]">
                            {pendingRequests}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                            Pending Requests
                        </p>
                    </div>
                </div>

                {/* Today Bookings Card */}
                <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <div className="flex w-10 h-10 items-center justify-center rounded-full bg-indigo-100 shrink-0">
                        <span className="material-symbols-outlined text-indigo-500 text-xl">
                            today
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-[#3A3A3A]">
                            {stats.todayBookings || 0}
                        </p>
                        <p className="text-xs text-[#6B7280]">Today Bookings</p>
                    </div>
                </div>
            </section>

            {/* Services Overview - Four Circular Icons */}
            <section className="my-6 flex justify-around">
                {/* Pendings */}
                <div
                    onClick={() => navigate("/vendor/requests")}
                    className="flex flex-col items-center gap-2 cursor-pointer active:scale-[0.95] transition-transform"
                >
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-b from-[#FFF3E0] via-[#FFE0B2] to-[#FFCC80] shadow-[0px_4px_10px_rgba(0,0,0,0.1)] flex items-center justify-center hover:shadow-[0px_6px_15px_rgba(0,0,0,0.15)] transition-all overflow-hidden">
                        {/* Highlight/Reflection Effect */}
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent"></div>
                        <span className="material-symbols-outlined !text-2xl text-[#EF6C00] relative z-10">
                            pending_actions
                        </span>
                    </div>
                    <span className="text-xs font-bold text-gray-800 text-center">
                        Pendings
                    </span>
                    <p className="text-[10px] text-[#6B7280] -mt-1">
                        {pendingRequests} pending
                    </p>
                </div>

                {/* Completed */}
                <div
                    onClick={() => navigate("/vendor/bookings")}
                    className="flex flex-col items-center gap-2 cursor-pointer active:scale-[0.95] transition-transform"
                >
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-b from-[#E8F5E9] via-[#C8E6C9] to-[#A5D6A7] shadow-[0px_4px_10px_rgba(0,0,0,0.1)] flex items-center justify-center hover:shadow-[0px_6px_15px_rgba(0,0,0,0.15)] transition-all overflow-hidden">
                        {/* Highlight/Reflection Effect */}
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent"></div>
                        <span className="material-symbols-outlined !text-2xl text-[#2E7D32] relative z-10">
                            check_circle
                        </span>
                    </div>
                    <span className="text-xs font-bold text-gray-800 text-center">
                        Completed
                    </span>
                    <p className="text-[10px] text-[#6B7280] -mt-1">
                        {stats.completedBookings || 0} completed
                    </p>
                </div>

                {/* Wallet */}
                <div
                    onClick={() => navigate("/vendor/wallet")}
                    className="flex flex-col items-center gap-2 cursor-pointer active:scale-[0.95] transition-transform"
                >
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-b from-[#B3E5FC] via-[#E1F5FE] to-[#81D4FA] shadow-[0px_4px_10px_rgba(0,0,0,0.1)] flex items-center justify-center hover:shadow-[0px_6px_15px_rgba(0,0,0,0.15)] transition-all overflow-hidden">
                        {/* Highlight/Reflection Effect */}
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent"></div>
                        <span className="material-symbols-outlined !text-2xl text-[#1976D2] relative z-10">
                            account_balance_wallet
                        </span>
                    </div>
                    <span className="text-xs font-bold text-gray-800 text-center">
                        Wallet
                    </span>
                    <p className="text-[10px] text-[#6B7280] -mt-1">
                        {formatAmount(
                            stats.paymentCollection?.collectedAmount || 0
                        )}
                    </p>
                </div>

                {/* Profile */}
                <div
                    onClick={() => navigate("/vendor/profile")}
                    className="flex flex-col items-center gap-2 cursor-pointer active:scale-[0.95] transition-transform"
                >
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-b from-[#B3E5FC] via-[#E1F5FE] to-[#81D4FA] shadow-[0px_4px_10px_rgba(0,0,0,0.1)] flex items-center justify-center hover:shadow-[0px_6px_15px_rgba(0,0,0,0.15)] transition-all overflow-hidden">
                        {/* Highlight/Reflection Effect */}
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent"></div>
                        <span className="material-symbols-outlined !text-2xl text-[#1976D2] relative z-10">
                            manage_accounts
                        </span>
                    </div>
                    <span className="text-xs font-bold text-gray-800 text-center">
                        Profile
                    </span>
                    <p className="text-[10px] text-[#6B7280] -mt-1">Edit details</p>
                </div>
            </section>

            {/* Upcoming Bookings Section */}
            <section className="mt-6">
                <h2 className="text-lg font-bold text-[#3A3A3A]">
                    Active Bookings
                </h2>
                {upcomingBookings.length > 0 ? (
                    <div className="mt-3 space-y-4">
                        {upcomingBookings.map((booking) => (
                            <div
                                key={booking._id}
                                className="rounded-lg bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] cursor-pointer"
                                onClick={() =>
                                    navigate(`/vendor/bookings/${booking._id}`)
                                }
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        {booking.user?.profilePicture ? (
                                            <img
                                                alt="User Avatar"
                                                className="size-12 rounded-full object-cover"
                                                src={
                                                    booking.user.profilePicture
                                                }
                                            />
                                        ) : (
                                            <div className="size-12 rounded-full bg-gray-200 flex items-center justify-center">
                                                {booking.user?.name ? (
                                                    <span className="text-lg font-semibold text-gray-600">
                                                        {booking.user.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                ) : (
                                                    <span className="text-xl">
                                                        👤
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-semibold text-[#3A3A3A]">
                                                {booking.user?.name || "User"}
                                            </h3>
                                            <p className="text-sm text-[#6B7280]">
                                                {booking.service?.name ||
                                                    "Service"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 border-t border-gray-100 pt-3">
                                    <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                                        <span className="material-symbols-outlined !text-base text-[#00C2A8]">
                                            home
                                        </span>
                                        <span>
                                            {formatAddress(booking.address)}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 text-sm text-[#6B7280]">
                                        <span className="material-symbols-outlined !text-base text-[#00C2A8]">
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
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-3 bg-white rounded-lg p-8 shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                <IoBriefcaseOutline className="text-3xl text-gray-400" />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-[#3A3A3A] mb-1">
                                    No Active Bookings
                                </p>
                                <p className="text-sm text-[#6B7280]">
                                    You don't have any active bookings at the moment.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Recent Bookings Section */}
            <section className="mt-8">
                <h2 className="text-lg font-bold text-[#3A3A3A]">
                    Completed
                </h2>
                {recentBookings.length > 0 ? (
                    <div className="mt-3 space-y-4">
                        {recentBookings.map((booking) => (
                            <div
                                key={booking._id}
                                className={`rounded-lg bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] cursor-pointer ${booking.status === "COMPLETED"
                                    ? "opacity-75"
                                    : ""
                                    }`}
                                onClick={() =>
                                    navigate(`/vendor/bookings/${booking._id}`)
                                }
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        {booking.user?.profilePicture ? (
                                            <img
                                                alt="User Avatar"
                                                className="size-12 rounded-full object-cover"
                                                src={
                                                    booking.user.profilePicture
                                                }
                                            />
                                        ) : (
                                            <div className="size-12 rounded-full bg-gray-200 flex items-center justify-center">
                                                {booking.user?.name ? (
                                                    <span className="text-lg font-semibold text-gray-600">
                                                        {booking.user.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                ) : (
                                                    <span className="text-xl">
                                                        👤
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-semibold text-[#3A3A3A]">
                                                {booking.user?.name || "User"}
                                            </h3>
                                            <p className="text-sm text-[#6B7280]">
                                                {booking.service?.name ||
                                                    "Service"}
                                            </p>
                                        </div>
                                    </div>
                                    {booking.status === "COMPLETED" && (
                                        <span className="material-symbols-outlined text-green-500">
                                            check_circle
                                        </span>
                                    )}
                                </div>
                                <div className="mt-4 border-t border-gray-100 pt-3">
                                    <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                                        <span className="material-symbols-outlined !text-base text-[#00C2A8]">
                                            home
                                        </span>
                                        <span>
                                            {formatAddress(booking.address)}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 text-sm text-[#6B7280]">
                                        <span
                                            className={`material-symbols-outlined !text-base text-[#00C2A8] ${booking.status === "COMPLETED"
                                                ? ""
                                                : ""
                                                }`}
                                        >
                                            {booking.status === "COMPLETED"
                                                ? "event_available"
                                                : "schedule"}
                                        </span>
                                        <span>
                                            {formatDateTime(
                                                booking.scheduledDate ||
                                                booking.completedAt,
                                                booking.scheduledTime
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-3 bg-white rounded-lg p-8 shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                <IoCheckmarkCircleOutline className="text-3xl text-gray-400" />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-[#3A3A3A] mb-1">
                                    No Completed Bookings
                                </p>
                                <p className="text-sm text-[#6B7280]">
                                    You don't have any completed bookings yet.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
