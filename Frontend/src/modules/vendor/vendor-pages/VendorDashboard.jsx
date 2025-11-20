import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoBriefcaseOutline,
    IoWalletOutline,
    IoDocumentTextOutline,
    IoPersonCircleOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoTrendingUpOutline,
} from "react-icons/io5";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import { getDashboardStats } from "../../../services/vendorApi";

export default function VendorDashboard() {
    const navigate = useNavigate();
    const { vendor } = useVendorAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pendingBookings: 0,
        acceptedBookings: 0,
        visitedBookings: 0,
        completedBookings: 0,
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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A84FF] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-[#0A84FF] to-[#005BBB] rounded-[12px] p-6 mb-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                    Welcome, {vendor?.name || "Vendor"}!
                </h1>
                <p className="text-white/90 text-sm">
                    How can we help you today?
                </p>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <p className="text-[#4A4A4A] text-xs mb-1">
                        Pending Requests
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                        {stats.pendingBookings}
                    </p>
                </div>
                <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <p className="text-[#4A4A4A] text-xs mb-1">
                        Accepted Bookings
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                        {stats.acceptedBookings}
                    </p>
                </div>
            </div>

            {/* Section Heading */}
            <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                    Quick Actions
                </h2>
            </div>

            {/* 2x2 Grid Cards */}
            <div className="grid grid-cols-2 gap-4 md:gap-6">
                {/* Services Card */}
                <div
                    onClick={() => navigate("/vendor/services")}
                    className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[10px] bg-[#E6F9F6] flex items-center justify-center flex-shrink-0">
                            <IoBriefcaseOutline className="text-2xl text-[#00C2A8]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-800 mb-0.5">
                                Services
                            </h3>
                            <p className="text-xs text-[#4A4A4A]">
                                Manage services
                            </p>
                        </div>
                    </div>
                </div>

                {/* Requests Card */}
                <div
                    onClick={() => navigate("/vendor/requests")}
                    className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[10px] bg-[#E6F9F6] flex items-center justify-center flex-shrink-0">
                            <IoDocumentTextOutline className="text-2xl text-[#00C2A8]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-800 mb-0.5">
                                Requests
                            </h3>
                            <p className="text-xs text-[#4A4A4A]">
                                {stats.pendingBookings} pending
                            </p>
                        </div>
                    </div>
                </div>

                {/* Wallet Card */}
                <div
                    onClick={() => navigate("/vendor/wallet")}
                    className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[10px] bg-[#E6F9F6] flex items-center justify-center flex-shrink-0">
                            <IoWalletOutline className="text-2xl text-[#00C2A8]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-800 mb-0.5">
                                Wallet
                            </h3>
                            <p className="text-xs text-[#4A4A4A]">
                                View earnings
                            </p>
                        </div>
                    </div>
                </div>

                {/* Profile Update Card */}
                <div
                    onClick={() => navigate("/vendor/profile")}
                    className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[10px] bg-[#E6F9F6] flex items-center justify-center flex-shrink-0">
                            <IoPersonCircleOutline className="text-2xl text-[#00C2A8]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-800 mb-0.5">
                                Profile
                            </h3>
                            <p className="text-xs text-[#4A4A4A]">
                                Manage profile
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upcoming Bookings Section */}
            {upcomingBookings.length > 0 && (
                <div className="mt-6">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-gray-800">
                            Upcoming Bookings
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {upcomingBookings.map((booking) => (
                            <div
                                key={booking._id}
                                className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all"
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
                                                className={`px-2 py-1 rounded-[6px] text-xs font-semibold ${
                                                    booking.status === "ACCEPTED"
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
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-gray-800">
                            Recent Bookings
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {recentBookings.map((booking) => (
                            <div
                                key={booking._id}
                                className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all"
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
                                                className={`px-2 py-1 rounded-[6px] text-xs font-semibold ${
                                                    booking.status === "COMPLETED"
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
                                                Amount: ₹{booking.payment.amount?.toLocaleString() || "0"}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Earnings Section */}
            <div className="mt-6">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                        Earnings
                    </h2>
                </div>

                <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    {/* Total Earnings */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-[#4A4A4A]">
                                Total Earnings
                            </p>
                            <IoTrendingUpOutline className="text-xl text-[#00C2A8]" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-800">
                            ₹{stats.paymentCollection.totalEarnings.toLocaleString()}
                        </h3>
                    </div>

                    {/* Earnings Breakdown */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                        <div>
                            <p className="text-xs text-[#4A4A4A] mb-1">Collected</p>
                            <p className="text-lg font-bold text-gray-800">
                                ₹{stats.paymentCollection.collectedAmount.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-[#4A4A4A] mb-1">
                                Pending
                            </p>
                            <p className="text-lg font-bold text-gray-800">
                                ₹{stats.paymentCollection.pendingAmount.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-[#4A4A4A] mb-1">
                                Completed
                            </p>
                            <p className="text-lg font-bold text-gray-800">
                                {stats.completedBookings}
                            </p>
                        </div>
                    </div>

                    {/* View Wallet Button */}
                    <button
                        onClick={() => navigate("/vendor/wallet")}
                        className="w-full mt-4 bg-[#0A84FF] text-white font-semibold py-3 px-4 rounded-[12px] hover:bg-[#005BBB] transition-colors shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                    >
                        View Wallet
                    </button>
                </div>
            </div>
        </div>
    );
}
