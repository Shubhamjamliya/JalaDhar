import { useState, useEffect } from "react";
import {
    IoTimeOutline,
    IoLocationOutline,
    IoCallOutline,
    IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { getBookingHistory } from "../../../services/vendorApi";

export default function VendorBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getBookingHistory({ 
                status: "ACCEPTED",
                limit: 50 
            });
            
            if (response.success) {
                setBookings(response.data.bookings || []);
            } else {
                setError("Failed to load bookings");
            }
        } catch (err) {
            console.error("Load bookings error:", err);
            setError("Failed to load bookings");
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

    const getStatusColor = (status) => {
        switch (status) {
            case "ACCEPTED":
                return "bg-blue-100 text-blue-700";
            case "VISITED":
                return "bg-purple-100 text-purple-700";
            case "COMPLETED":
                return "bg-green-100 text-green-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A84FF] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading bookings...</p>
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

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    Bookings
                </h1>
                <p className="text-[#4A4A4A] text-sm">
                    View and manage all accepted booking requests from users
                </p>
            </div>

            {/* Bookings List */}
            <div className="space-y-4">
                {bookings.length === 0 ? (
                    <div className="bg-white rounded-[12px] p-8 text-center shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <p className="text-[#4A4A4A] text-sm">
                            No bookings available
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            Accepted requests will appear here
                        </p>
                    </div>
                ) : (
                    bookings.map((booking) => (
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
                                        <span className={`px-2 py-1 rounded-[6px] text-xs font-semibold ${getStatusColor(booking.status)} flex items-center gap-1`}>
                                            <IoCheckmarkCircleOutline className="text-sm" />
                                            {booking.status}
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
                                    {booking.service && (
                                        <p className="text-xs text-[#4A4A4A] mb-2">
                                            {booking.service.machineType} • ₹{booking.service.price?.toLocaleString()}
                                        </p>
                                    )}
                                    {booking.notes && (
                                        <p className="text-sm text-[#4A4A4A] leading-relaxed mb-2">
                                            {booking.notes}
                                        </p>
                                    )}
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
                                    {booking.payment && (
                                        <p className="text-sm font-semibold text-gray-800 mt-2">
                                            Amount: ₹{booking.payment.amount?.toLocaleString() || "0"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
