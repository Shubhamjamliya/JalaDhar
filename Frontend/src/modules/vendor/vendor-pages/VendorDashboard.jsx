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
import { getDashboardStats } from "../../../services/vendorApi";
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
            collectedAmount: 0
        }
    });
    const [recentBookings, setRecentBookings] = useState([]);
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getDashboardStats();

            if (response.success) {
                setStats(response.data.stats);
                setRecentBookings(response.data.recentBookings || []);
                setUpcomingBookings(response.data.upcomingBookings || []);
            } else {
                setError("Failed to load dashboard data");
            }
        } catch (err) {
            console.error("Dashboard error:", err);
            setError("Failed to load dashboard data");
        } finally {
            setLoading(false);
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
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    // Background and avatar images
    const backgroundImageUrl =
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCSWOEOG7ry6z14TFWGAz7PjaKTwn697LggEX4Vf1U2F-18-Yl362M1a0XmrCPrnxjq3HLvvisiIPbnCcLWbicHHyQVehSZEC56qo5fvTVnSjPmEPPFLj9dncg63DYDUscFj51kK5mnPvn7hznGuHDuYjMiSWsX7r6Nlpe1ss-SQVtV_G_yADjJFZVcqSA8EGeUz4tjBJlabT7hxamjtW25RfdT9g0K2O82ATNS4J1em3nBru9nIKr4YnD72XMjXgETg4PCKTSCxEva";

    const avatarImageUrl =
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDCqZRhSzmWMNhXuX4RPFuS_KD7WQ8XLgbsk2nXkV3JICy3ZcLfqjZnTbmofKaBePVQ9HQeoiASrUYaU_VYP7dBYSFBI9Z5WlMcnCKPDQIZaN5Uo8Qh4iv3tNNNnrRAnqP6QfGEIvqzMRneraT-7cwEGw9ba4Ci_wx2qsxlsRdxcPVRdPcnkz2n2vv4YM02MHGkKA3Punga2QFw4FyWv6phuBqmgoiAjWSehWquP1nyb8tigrHh5j6ir7c3uumnU1LI7khab45fuKmL";

    const vendorProfileImage = vendor?.documents?.profilePicture?.url || null;

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
                            backgroundImage: vendorProfileImage
                                ? `url("${vendorProfileImage}")`
                                : `url("${avatarImageUrl}")`,
                        }}
                    ></div>
                    <div>
                        <p className="text-[22px] font-bold tracking-tight text-gray-800">
                            Welcome, {vendor?.name || "Vendor"}
                        </p>
                    </div>
                </div>
            </section>

            {/* Two Prominent Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Pending Requests Card */}
                <div className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 rounded-[10px] bg-orange-100 flex items-center justify-center">
                            <IoCheckmarkCircleOutline className="text-2xl text-orange-500" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-800 mb-1">
                        {pendingRequests}
                    </p>
                    <p className="text-sm text-[#4A4A4A]">
                        Pending Requests
                    </p>
                </div>

                {/* Today Bookings Card */}
                <div className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 rounded-[10px] bg-purple-100 flex items-center justify-center">
                            <IoCalendarOutline className="text-2xl text-purple-500" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-800 mb-1">
                        {stats.todayBookings || 0}
                    </p>
                    <p className="text-sm text-[#4A4A4A]">
                        Today Bookings
                    </p>
                </div>
            </div>

            {/* Services Overview - Four Circular Icons */}
            <h2 className="px-2 pt-4 pb-2 text-lg font-bold text-gray-800">
                Your Services Overview
            </h2>
            <div className="flex justify-around gap-4 mb-6 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* Services */}
                <div
                    onClick={() => navigate("/vendor/services")}
                    className="flex flex-col items-center justify-center w-28 h-28 shrink-0 rounded-[12px] bg-white p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer active:scale-[0.98]"
                >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#00C2A8] flex items-center justify-center mb-2">
                        <IoBriefcaseOutline className="text-2xl text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-gray-800 text-center mb-0.5">
                        Services
                    </h3>
                    <p className="text-[10px] text-[#4A4A4A] text-center">
                        {stats.servicesCount || 0} services
                    </p>
                </div>

                {/* Requests */}
                <div
                    onClick={() => navigate("/vendor/requests")}
                    className="flex flex-col items-center justify-center w-28 h-28 shrink-0 rounded-[12px] bg-white p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer active:scale-[0.98]"
                >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#00C2A8] flex items-center justify-center mb-2">
                        <IoDocumentTextOutline className="text-2xl text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-gray-800 text-center mb-0.5">
                        Requests
                    </h3>
                    <p className="text-[10px] text-[#4A4A4A] text-center">
                        {pendingRequests} pending
                    </p>
                </div>

                {/* Wallet */}
                <div
                    onClick={() => navigate("/vendor/wallet")}
                    className="flex flex-col items-center justify-center w-28 h-28 shrink-0 rounded-[12px] bg-white p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer active:scale-[0.98]"
                >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#00C2A8] flex items-center justify-center mb-2">
                        <IoWalletOutline className="text-2xl text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-gray-800 text-center mb-0.5">
                        Wallet
                    </h3>
                    <p className="text-[10px] text-[#4A4A4A] text-center">
                        {formatAmount(stats.paymentCollection?.collectedAmount || 0)}
                    </p>
                </div>

                {/* Profile */}
                <div
                    onClick={() => navigate("/vendor/profile")}
                    className="flex flex-col items-center justify-center w-28 h-28 shrink-0 rounded-[12px] bg-white p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer active:scale-[0.98]"
                >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#00C2A8] flex items-center justify-center mb-2">
                        <IoPersonCircleOutline className="text-2xl text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-gray-800 text-center mb-0.5">
                        Profile
                    </h3>
                    <p className="text-[10px] text-[#4A4A4A] text-center">
                        Edit details
                    </p>
                </div>
            </div>

            {/* Upcoming Bookings Section */}
            {upcomingBookings.length > 0 && (
                <div className="mt-6">
                    <h2 className="px-2 pt-4 pb-2 text-lg font-bold text-gray-800">
                        Upcoming Bookings
                    </h2>
                    <div className="space-y-3">
                        {upcomingBookings.map((booking) => (
                            <div
                                key={booking._id}
                                className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer"
                                onClick={() => navigate(`/vendor/bookings/${booking._id}`)}
                            >
                                <div className="flex items-start gap-3">
                                    {/* User Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                        {booking.user?.name ? (
                                            <span className="text-lg font-semibold text-gray-600">
                                                {booking.user.name.charAt(0).toUpperCase()}
                                            </span>
                                        ) : (
                                            <span className="text-xl">👤</span>
                                        )}
                                    </div>

                                    {/* Booking Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                            <h3 className="text-base font-bold text-gray-800">
                                                {booking.user?.name || "User"}
                                            </h3>
                                            <span
                                                className={`px-2 py-1 rounded-[6px] text-xs font-semibold ${booking.status === "ACCEPTED"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                                    }`}
                                            >
                                                {booking.status}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-[#0A84FF] mb-1">
                                            {booking.service?.name || "Service"}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-[#4A4A4A] mb-1">
                                            <IoTimeOutline className="text-base" />
                                            <span>
                                                {formatDate(booking.scheduledDate)} at {formatTime(booking.scheduledTime)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-[#4A4A4A]">
                                            <IoLocationOutline className="text-base" />
                                            <span className="truncate">
                                                {formatAddress(booking.address)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Bookings Section */}
            {recentBookings.length > 0 && (
                <div className="mt-6">
                    <h2 className="px-2 pt-4 pb-2 text-lg font-bold text-gray-800">
                        Recent Bookings
                    </h2>
                    <div className="space-y-3">
                        {recentBookings.map((booking) => (
                            <div
                                key={booking._id}
                                className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer"
                                onClick={() => navigate(`/vendor/bookings/${booking._id}`)}
                            >
                                <div className="flex items-start gap-3">
                                    {/* User Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                        {booking.user?.name ? (
                                            <span className="text-lg font-semibold text-gray-600">
                                                {booking.user.name.charAt(0).toUpperCase()}
                                            </span>
                                        ) : (
                                            <span className="text-xl">👤</span>
                                        )}
                                    </div>

                                    {/* Booking Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                            <h3 className="text-base font-bold text-gray-800">
                                                {booking.user?.name || "User"}
                                            </h3>
                                            <span
                                                className={`px-2 py-1 rounded-[6px] text-xs font-semibold ${booking.status === "COMPLETED"
                                                    ? "bg-green-100 text-green-700"
                                                    : booking.status === "ACCEPTED"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                    }`}
                                            >
                                                {booking.status}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-[#0A84FF] mb-1">
                                            {booking.service?.name || "Service"}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-[#4A4A4A] mb-1">
                                            <IoTimeOutline className="text-base" />
                                            <span>
                                                {formatDate(booking.scheduledDate)} at {formatTime(booking.scheduledTime)}
                                            </span>
                                        </div>
                                        {booking.payment && (
                                            <p className="text-xs text-[#4A4A4A]">
                                                Amount: {formatAmount(booking.payment.amount || 0)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
