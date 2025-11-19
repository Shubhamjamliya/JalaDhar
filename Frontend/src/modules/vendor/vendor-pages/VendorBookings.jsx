import { useState, useEffect } from "react";
import {
    IoTimeOutline,
    IoLocationOutline,
    IoCallOutline,
    IoCheckmarkCircleOutline,
} from "react-icons/io5";

export default function VendorBookings() {
    const [bookings, setBookings] = useState([]);

    const loadBookings = () => {
        // Load bookings from localStorage
        const savedBookings =
            JSON.parse(localStorage.getItem("vendorBookings")) || [];
        setBookings(savedBookings);
    };

    useEffect(() => {
        loadBookings();

        // Listen for custom event (when booking is completed in Status page)
        const handleBookingsUpdate = () => {
            loadBookings();
        };
        window.addEventListener("vendorBookingsUpdated", handleBookingsUpdate);

        // Also listen for storage changes (for cross-tab updates)
        const handleStorageChange = (e) => {
            if (e.key === "vendorBookings") {
                loadBookings();
            }
        };
        window.addEventListener("storage", handleStorageChange);

        // Also check on focus (for same-tab navigation)
        const handleFocus = () => {
            loadBookings();
        };
        window.addEventListener("focus", handleFocus);

        return () => {
            window.removeEventListener("vendorBookingsUpdated", handleBookingsUpdate);
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("focus", handleFocus);
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
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
                            key={booking.id || booking.bookingId}
                            className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                {/* User Avatar */}
                                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 border-2 border-gray-200">
                                    {booking.userAvatar ? (
                                        <img
                                            src={booking.userAvatar}
                                            alt={booking.userName}
                                            className="w-full h-full rounded-full object-cover"
                                        />
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
                                            {booking.userName}
                                        </h3>
                                        <span className="px-2 py-1 rounded-[6px] text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                                            <IoCheckmarkCircleOutline className="text-sm" />
                                            Confirmed
                                        </span>
                                    </div>
                                    {booking.bookingId && (
                                        <p className="text-xs text-[#4A4A4A] mb-2">
                                            Booking ID: {booking.bookingId}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1.5 text-xs text-[#4A4A4A] mb-2">
                                        <IoTimeOutline className="text-sm" />
                                        <span>{booking.bookingTime}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-[#0A84FF] mb-2">
                                        {booking.serviceType}
                                    </p>
                                    <p className="text-sm text-[#4A4A4A] leading-relaxed mb-2">
                                        {booking.summary}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-xs text-[#4A4A4A] mb-1">
                                        <IoLocationOutline className="text-sm" />
                                        <span className="truncate">
                                            {booking.address}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-[#4A4A4A]">
                                        <IoCallOutline className="text-sm" />
                                        <a
                                            href={`tel:${booking.contact}`}
                                            className="text-[#0A84FF] hover:underline"
                                        >
                                            {booking.contact}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
