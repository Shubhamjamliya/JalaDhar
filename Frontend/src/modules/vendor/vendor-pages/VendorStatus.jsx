import { useState, useEffect } from "react";
import {
    IoTimeOutline,
    IoLocationOutline,
    IoCallOutline,
    IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { getBookingHistory, markBookingAsVisited, markBookingAsCompleted } from "../../../services/vendorApi";

export default function VendorStatus() {
    const [acceptedBookings, setAcceptedBookings] = useState([]);
    const [visitedBookings, setVisitedBookings] = useState([]);
    const [completedBookings, setCompletedBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        loadStatusBookings();
    }, []);

    const loadStatusBookings = async () => {
        try {
            setLoading(true);
            setError("");
            
            // Load accepted bookings
            const acceptedResponse = await getBookingHistory({ 
                status: "ACCEPTED",
                limit: 50 
            });
            
            // Load visited bookings
            const visitedResponse = await getBookingHistory({ 
                status: "VISITED",
                limit: 50 
            });
            
            // Load completed bookings
            const completedResponse = await getBookingHistory({ 
                status: "COMPLETED",
                limit: 50,
                sortBy: "completedAt",
                sortOrder: "desc"
            });
            
            if (acceptedResponse.success) {
                setAcceptedBookings(acceptedResponse.data.bookings || []);
            }
            
            if (visitedResponse.success) {
                setVisitedBookings(visitedResponse.data.bookings || []);
            }
            
            if (completedResponse.success) {
                setCompletedBookings(completedResponse.data.bookings || []);
            }
        } catch (err) {
            console.error("Load status bookings error:", err);
            setError("Failed to load booking status");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkVisited = async (bookingId) => {
        try {
            setActionLoading(bookingId);
            const response = await markBookingAsVisited(bookingId);
            
            if (response.success) {
                // Reload to get updated list
                await loadStatusBookings();
            } else {
                alert(response.message || "Failed to mark as visited");
            }
        } catch (err) {
            console.error("Mark visited error:", err);
            alert("Failed to mark as visited. Please try again.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleMarkCompleted = async (bookingId) => {
        if (window.confirm("Are you sure you want to mark this booking as completed?")) {
            try {
                setActionLoading(bookingId);
                const response = await markBookingAsCompleted(bookingId);
                
                if (response.success) {
                    // Reload to get updated list
                    await loadStatusBookings();
                } else {
                    alert(response.message || "Failed to mark as completed");
                }
            } catch (err) {
                console.error("Mark completed error:", err);
                alert("Failed to mark as completed. Please try again.");
            } finally {
                setActionLoading(null);
            }
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
                    <p className="text-gray-600">Loading status...</p>
                </div>
            </div>
        );
    }

    const pendingCount = acceptedBookings.length;
    const visitedCount = visitedBookings.length;
    const completedCount = completedBookings.length;

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    Booking Status
                </h1>
                <p className="text-[#4A4A4A] text-sm">
                    Track and manage your booking status (Accepted / Visited / Completed)
                </p>
            </div>

            {/* Status Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] border-l-4 border-blue-500">
                    <h3 className="text-sm font-semibold text-[#4A4A4A] mb-1">
                        Accepted
                    </h3>
                    <p className="text-2xl font-bold text-gray-800">
                        {pendingCount}
                    </p>
                </div>
                <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] border-l-4 border-purple-500">
                    <h3 className="text-sm font-semibold text-[#4A4A4A] mb-1">
                        Visited
                    </h3>
                    <p className="text-2xl font-bold text-gray-800">
                        {visitedCount}
                    </p>
                </div>
                <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] border-l-4 border-green-500">
                    <h3 className="text-sm font-semibold text-[#4A4A4A] mb-1">
                        Completed
                    </h3>
                    <p className="text-2xl font-bold text-gray-800">
                        {completedCount}
                    </p>
                </div>
            </div>

            {/* Accepted Bookings */}
            {acceptedBookings.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                        Accepted Bookings ({acceptedBookings.length})
                    </h2>
                    <div className="space-y-4">
                        {acceptedBookings.map((booking) => (
                            <div
                                key={booking._id}
                                className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all"
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    {/* User Avatar */}
                                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 border-2 border-gray-200">
                                        {booking.user?.name ? (
                                            <span className="text-xl font-semibold text-gray-600">
                                                {booking.user.name.charAt(0).toUpperCase()}
                                            </span>
                                        ) : (
                                            <span className="text-2xl text-gray-400">
                                                👤
                                            </span>
                                        )}
                                    </div>

                                    {/* Booking Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1.5">
                                            <h3 className="text-base font-bold text-gray-800">
                                                {booking.user?.name || "User"}
                                            </h3>
                                            <span className="px-2 py-1 rounded-[6px] text-xs font-semibold bg-blue-100 text-blue-700">
                                                ACCEPTED
                                            </span>
                                        </div>
                                        {booking._id && (
                                            <p className="text-xs text-[#4A4A4A] mb-2">
                                                Booking ID: {booking._id.toString().slice(-8)}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-1.5 text-xs text-[#4A4A4A] mb-2">
                                            <IoTimeOutline className="text-sm" />
                                            <span>
                                                {formatDate(booking.scheduledDate)} at {formatTime(booking.scheduledTime)}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-[#0A84FF] mb-2">
                                            {booking.service?.name || "Service"}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-xs text-[#4A4A4A] mb-1">
                                            <IoLocationOutline className="text-sm" />
                                            <span className="truncate">
                                                {formatAddress(booking.address)}
                                            </span>
                                        </div>
                                        {booking.user?.phone && (
                                            <div className="flex items-center gap-1.5 text-xs text-[#4A4A4A]">
                                                <IoCallOutline className="text-sm" />
                                                <a
                                                    href={`tel:${booking.user.phone}`}
                                                    className="text-[#0A84FF] hover:underline"
                                                >
                                                    {booking.user.phone}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Mark Visited Button */}
                                <div className="pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleMarkVisited(booking._id)}
                                        disabled={actionLoading === booking._id}
                                        className="w-full bg-[#0A84FF] text-white font-semibold py-2.5 px-4 rounded-[10px] hover:bg-[#005BBB] active:bg-[#004A9A] transition-colors flex items-center justify-center gap-2 shadow-[0px_2px_8px_rgba(10,132,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <IoCheckmarkCircleOutline className="text-lg" />
                                        {actionLoading === booking._id ? "Processing..." : "Mark as Visited"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Visited Bookings */}
            {visitedBookings.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                        Visited Bookings ({visitedBookings.length})
                    </h2>
                    <div className="space-y-4">
                        {visitedBookings.map((booking) => (
                            <div
                                key={booking._id}
                                className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all"
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    {/* User Avatar */}
                                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 border-2 border-gray-200">
                                        {booking.user?.name ? (
                                            <span className="text-xl font-semibold text-gray-600">
                                                {booking.user.name.charAt(0).toUpperCase()}
                                            </span>
                                        ) : (
                                            <span className="text-2xl text-gray-400">
                                                👤
                                            </span>
                                        )}
                                    </div>

                                    {/* Booking Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1.5">
                                            <h3 className="text-base font-bold text-gray-800">
                                                {booking.user?.name || "User"}
                                            </h3>
                                            <span className="px-2 py-1 rounded-[6px] text-xs font-semibold bg-purple-100 text-purple-700">
                                                VISITED
                                            </span>
                                        </div>
                                        {booking._id && (
                                            <p className="text-xs text-[#4A4A4A] mb-2">
                                                Booking ID: {booking._id.toString().slice(-8)}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-1.5 text-xs text-[#4A4A4A] mb-2">
                                            <IoTimeOutline className="text-sm" />
                                            <span>
                                                Visited: {booking.visitedAt ? formatDate(booking.visitedAt) : "N/A"}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-[#0A84FF] mb-2">
                                            {booking.service?.name || "Service"}
                                        </p>
                                        {booking.payment && (
                                            <p className="text-sm font-semibold text-gray-800">
                                                Amount: ₹{booking.payment.amount?.toLocaleString() || "0"}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Mark Completed Button */}
                                <div className="pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleMarkCompleted(booking._id)}
                                        disabled={actionLoading === booking._id}
                                        className="w-full bg-green-600 text-white font-semibold py-2.5 px-4 rounded-[10px] hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center gap-2 shadow-[0px_2px_8px_rgba(34,197,94,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <IoCheckmarkCircleOutline className="text-lg" />
                                        {actionLoading === booking._id ? "Processing..." : "Mark as Completed"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Completed Bookings */}
            {completedBookings.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                        Completed Bookings ({completedBookings.length})
                    </h2>
                    <div className="space-y-4">
                        {completedBookings.map((booking) => (
                            <div
                                key={booking._id}
                                className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                            >
                                <div className="flex items-start gap-4">
                                    {/* User Avatar */}
                                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 border-2 border-gray-200">
                                        {booking.user?.name ? (
                                            <span className="text-xl font-semibold text-gray-600">
                                                {booking.user.name.charAt(0).toUpperCase()}
                                            </span>
                                        ) : (
                                            <span className="text-2xl text-gray-400">
                                                👤
                                            </span>
                                        )}
                                    </div>

                                    {/* Booking Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1.5">
                                            <h3 className="text-base font-bold text-gray-800">
                                                {booking.user?.name || "User"}
                                            </h3>
                                            <span className="px-2 py-1 rounded-[6px] text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                                                <IoCheckmarkCircleOutline className="text-sm" />
                                                COMPLETED
                                            </span>
                                        </div>
                                        {booking._id && (
                                            <p className="text-xs text-[#4A4A4A] mb-2">
                                                Booking ID: {booking._id.toString().slice(-8)}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-1.5 text-xs text-[#4A4A4A] mb-2">
                                            <IoTimeOutline className="text-sm" />
                                            <span>
                                                Completed: {booking.completedAt ? formatDate(booking.completedAt) : "N/A"}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-[#0A84FF] mb-2">
                                            {booking.service?.name || "Service"}
                                        </p>
                                        {booking.payment && (
                                            <p className="text-sm font-semibold text-gray-800">
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

            {/* Empty State */}
            {acceptedBookings.length === 0 && visitedBookings.length === 0 && completedBookings.length === 0 && (
                <div className="bg-white rounded-[12px] p-8 text-center shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <p className="text-[#4A4A4A] text-sm mb-2">
                        No bookings in status
                    </p>
                    <p className="text-xs text-gray-500">
                        Accepted requests will appear here
                    </p>
                </div>
            )}
        </div>
    );
}
