import { useState, useEffect } from "react";
import {
    IoTimeOutline,
    IoLocationOutline,
    IoCallOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
} from "react-icons/io5";

export default function VendorStatus() {
    const [statusBookings, setStatusBookings] = useState([]);

    useEffect(() => {
        // Load status bookings from localStorage
        const savedStatus =
            JSON.parse(localStorage.getItem("vendorStatus")) || [];
        setStatusBookings(savedStatus);
    }, []);

    const handleMarkComplete = (bookingId) => {
        // Update status to completed
        const updatedStatus = statusBookings.map((booking) =>
            booking.bookingId === bookingId
                ? { ...booking, status: "completed" }
                : booking
        );
        setStatusBookings(updatedStatus);
        localStorage.setItem("vendorStatus", JSON.stringify(updatedStatus));

        // Remove from bookings localStorage
        const existingBookings =
            JSON.parse(localStorage.getItem("vendorBookings")) || [];
        const updatedBookings = existingBookings.filter(
            (booking) => booking.bookingId !== bookingId
        );
        localStorage.setItem(
            "vendorBookings",
            JSON.stringify(updatedBookings)
        );

        // Dispatch custom event to notify Bookings page
        window.dispatchEvent(new Event("vendorBookingsUpdated"));
    };

    const pendingBookings = statusBookings.filter(
        (booking) => booking.status === "pending"
    );
    const completedBookings = statusBookings.filter(
        (booking) => booking.status === "completed"
    );

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    Booking Status
                </h1>
                <p className="text-[#4A4A4A] text-sm">
                    Track and manage your booking status (Pending / Completed)
                </p>
            </div>

            {/* Status Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] border-l-4 border-yellow-500">
                    <h3 className="text-sm font-semibold text-[#4A4A4A] mb-1">
                        Pending
                    </h3>
                    <p className="text-2xl font-bold text-gray-800">
                        {pendingBookings.length}
                    </p>
                </div>
                <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] border-l-4 border-green-500">
                    <h3 className="text-sm font-semibold text-[#4A4A4A] mb-1">
                        Completed
                    </h3>
                    <p className="text-2xl font-bold text-gray-800">
                        {completedBookings.length}
                    </p>
                </div>
            </div>

            {/* Pending Bookings */}
            {pendingBookings.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                        Pending Bookings ({pendingBookings.length})
                    </h2>
                    <div className="space-y-4">
                        {pendingBookings.map((booking) => (
                            <div
                                key={booking.bookingId || booking.id}
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
                                            <span className="px-2 py-1 rounded-[6px] text-xs font-semibold bg-yellow-100 text-yellow-700">
                                                Pending
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

                                {/* Mark Complete Button */}
                                <div className="pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() =>
                                            handleMarkComplete(
                                                booking.bookingId || booking.id
                                            )
                                        }
                                        className="w-full bg-[#0A84FF] text-white font-semibold py-2.5 px-4 rounded-[10px] hover:bg-[#005BBB] active:bg-[#004A9A] transition-colors flex items-center justify-center gap-2 shadow-[0px_2px_8px_rgba(10,132,255,0.2)]"
                                    >
                                        <IoCheckmarkCircleOutline className="text-lg" />
                                        Mark as Completed
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
                                key={booking.bookingId || booking.id}
                                className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                            >
                                <div className="flex items-start gap-4">
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
                                                Completed
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
                                        <p className="text-sm text-[#4A4A4A] leading-relaxed">
                                            {booking.summary}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {statusBookings.length === 0 && (
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
