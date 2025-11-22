import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import ErrorMessage from "../../shared/components/ErrorMessage";

export default function VendorDashboard() {
    const navigate = useNavigate();
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
    const [error, setError] = useState("");

    useEffect(() => {
        loadDashboardData();
    }, []);

    // Debug: Log when vendor profile data changes
    useEffect(() => {
        if (vendorProfileData) {
            console.log("Vendor profile data updated:", vendorProfileData);
            console.log(
                "Profile picture URL:",
                vendorProfileData?.documents?.profilePicture?.url
            );
        }
    }, [vendorProfileData]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError("");

            // Fetch dashboard stats
            const dashboardResponse = await getDashboardStats();

            if (dashboardResponse.success) {
                setStats(dashboardResponse.data.stats);
                setRecentBookings(dashboardResponse.data.recentBookings || []);
                setUpcomingBookings(
                    dashboardResponse.data.upcomingBookings || []
                );
            } else {
                setError("Failed to load dashboard data");
            }
        } catch (err) {
            console.error("Dashboard error:", err);
            setError("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }

        // Fetch vendor profile separately (don't block dashboard if this fails)
        try {
            const profileResponse = await getVendorProfile();
            console.log("Profile response:", profileResponse);
            if (
                profileResponse.success &&
                profileResponse.data &&
                profileResponse.data.vendor
            ) {
                console.log(
                    "Setting vendor profile data:",
                    profileResponse.data.vendor
                );
                setVendorProfileData(profileResponse.data.vendor);
            } else {
                console.log(
                    "Profile response not successful or missing data:",
                    profileResponse
                );
            }
        } catch (err) {
            console.error("Profile fetch error:", err);
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

    // Calculate pending requests (ASSIGNED status)
    const pendingRequests = stats.assignedBookings || 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 flex items-center justify-center">
                <LoadingSpinner message="Loading dashboard..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <ErrorMessage message={error} />

            {/* Profile Header with Gradient Background */}
            <section
                className="relative my-4 overflow-hidden rounded-xl p-6 text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                style={{
                    background:
                        "linear-gradient(135deg, #0A84FF 0%, #00C2A8 100%)",
                }}
            >
                <div className="absolute -top-1/4 -right-1/4 z-0 h-48 w-48 rounded-full bg-white/10"></div>
                <div className="absolute -bottom-1/4 -left-1/4 z-0 h-40 w-40 rounded-full bg-white/5"></div>

                <div className="relative z-10 flex items-center gap-4">
                    <div className="h-16 w-16 shrink-0 rounded-full border-2 border-white/50 shadow-md overflow-hidden bg-white/20 flex items-center justify-center">
                        {vendorProfileImage ? (
                            <img
                                src={vendorProfileImage}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-2xl text-white">👤</span>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium opacity-80">
                            Welcome Back,
                        </p>
                        <p className="text-xl font-bold leading-tight tracking-[-0.015em]">
                            {vendorProfileData?.name ||
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
                {/* Services */}
                <div
                    onClick={() => navigate("/vendor/services")}
                    className="flex flex-col items-center text-center cursor-pointer"
                >
                    <div className="flex size-12 items-center justify-center rounded-full bg-[#00C2A8]/10">
                        <span className="material-symbols-outlined !text-2xl text-[#00C2A8]">
                            design_services
                        </span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-[#3A3A3A]">
                        Services
                    </h3>
                    <p className="text-[10px] text-[#6B7280]">
                        {stats.servicesCount || 0} services
                    </p>
                </div>

                {/* Requests */}
                <div
                    onClick={() => navigate("/vendor/requests")}
                    className="flex flex-col items-center text-center cursor-pointer"
                >
                    <div className="flex size-12 items-center justify-center rounded-full bg-[#00C2A8]/10">
                        <span className="material-symbols-outlined !text-2xl text-[#00C2A8]">
                            receipt_long
                        </span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-[#3A3A3A]">
                        Requests
                    </h3>
                    <p className="text-[10px] text-[#6B7280]">
                        {pendingRequests} pending
                    </p>
                </div>

                {/* Wallet */}
                <div
                    onClick={() => navigate("/vendor/wallet")}
                    className="flex flex-col items-center text-center cursor-pointer"
                >
                    <div className="flex size-12 items-center justify-center rounded-full bg-[#00C2A8]/10">
                        <span className="material-symbols-outlined !text-2xl text-[#00C2A8]">
                            account_balance_wallet
                        </span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-[#3A3A3A]">
                        Wallet
                    </h3>
                    <p className="text-[10px] text-[#6B7280]">
                        {formatAmount(
                            stats.paymentCollection?.collectedAmount || 0
                        )}
                    </p>
                </div>

                {/* Profile */}
                <div
                    onClick={() => navigate("/vendor/profile")}
                    className="flex flex-col items-center text-center cursor-pointer"
                >
                    <div className="flex size-12 items-center justify-center rounded-full bg-[#00C2A8]/10">
                        <span className="material-symbols-outlined !text-2xl text-[#00C2A8]">
                            manage_accounts
                        </span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-[#3A3A3A]">
                        Profile
                    </h3>
                    <p className="text-[10px] text-[#6B7280]">Edit details</p>
                </div>
            </section>

            {/* Upcoming Bookings Section */}
            {upcomingBookings.length > 0 && (
                <section className="mt-6">
                    <h2 className="text-lg font-bold text-[#3A3A3A]">
                        Pending
                    </h2>
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
                                    <button className="text-[#0A84FF]">
                                        <span className="material-symbols-outlined">
                                            chevron_right
                                        </span>
                                    </button>
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
                </section>
            )}

            {/* Recent Bookings Section */}
            {recentBookings.length > 0 && (
                <section className="mt-8">
                    <h2 className="text-lg font-bold text-[#3A3A3A]">
                        Completed
                    </h2>
                    <div className="mt-3 space-y-4">
                        {recentBookings.map((booking) => (
                            <div
                                key={booking._id}
                                className={`rounded-lg bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] cursor-pointer ${
                                    booking.status === "COMPLETED"
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
                                    {booking.status === "COMPLETED" ? (
                                        <span className="material-symbols-outlined text-green-500">
                                            check_circle
                                        </span>
                                    ) : (
                                        <button className="text-[#0A84FF]">
                                            <span className="material-symbols-outlined">
                                                chevron_right
                                            </span>
                                        </button>
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
                                            className={`material-symbols-outlined !text-base text-[#00C2A8] ${
                                                booking.status === "COMPLETED"
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
                </section>
            )}
        </div>
    );
}
