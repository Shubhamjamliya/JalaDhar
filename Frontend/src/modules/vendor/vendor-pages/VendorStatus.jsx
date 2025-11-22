import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBookingHistory, markBookingAsVisited, markBookingAsCompleted } from "../../../services/vendorApi";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import PageContainer from "../../shared/components/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";

export default function VendorStatus() {
    const navigate = useNavigate();
    const { vendor } = useVendorAuth();
    const [activeTab, setActiveTab] = useState("Pending");
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
            
            const [acceptedResponse, visitedResponse, completedResponse] = await Promise.all([
                getBookingHistory({ status: "ACCEPTED", limit: 50 }),
                getBookingHistory({ status: "VISITED", limit: 50 }),
                getBookingHistory({ status: "COMPLETED", limit: 50, sortBy: "completedAt", sortOrder: "desc" })
            ]);
            
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

    // Combine accepted and visited into pending
    const pendingBookings = [...acceptedBookings, ...visitedBookings];

    // Format date and time
    const formatDateTime = (dateString, timeString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const isToday = date.toDateString() === today.toDateString();
        const isTomorrow = date.toDateString() === tomorrow.toDateString();

        const formattedDate = date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
        });

        if (isToday) {
            return `${timeString || "N/A"}, Today`;
        } else if (isTomorrow) {
            return `${timeString || "N/A"}, Tomorrow`;
        } else {
            return `${timeString || "N/A"}, ${formattedDate}`;
        }
    };

    // Format completed date
    const formatCompletedDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const isToday = date.toDateString() === today.toDateString();
        const isYesterday = date.toDateString() === yesterday.toDateString();

        if (isToday) {
            return `Today, ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
        } else if (isYesterday) {
            return `Yesterday, ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
        } else {
            return date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
            });
        }
    };

    // Format address
    const formatAddress = (address) => {
        if (!address) return "N/A";
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.pincode) parts.push(address.pincode);
        return parts.join(", ") || "N/A";
    };

    // Format booking ID
    const formatBookingId = (id) => {
        if (!id) return "#JAL0000";
        const shortId = id.toString().slice(-4).toUpperCase();
        return `#JAL${shortId}`;
    };

    if (loading) {
        return <LoadingSpinner message="Loading status..." />;
    }

    return (
        <PageContainer>
            <ErrorMessage message={error} />

            {/* Tabs */}
            <div className="mt-4 flex w-full gap-2 rounded-full bg-gray-200/50 p-1">
                <button
                    onClick={() => setActiveTab("Pending")}
                    className={`w-1/2 rounded-full py-2.5 text-sm font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-colors ${
                        activeTab === "Pending"
                            ? "bg-[#0A84FF] text-white"
                            : "text-[#6B7280]"
                    }`}
                >
                    Pending
                </button>
                <button
                    onClick={() => setActiveTab("Completed")}
                    className={`w-1/2 rounded-full py-2.5 text-sm font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-colors ${
                        activeTab === "Completed"
                            ? "bg-[#0A84FF] text-white"
                            : "text-[#6B7280]"
                    }`}
                >
                    Completed
                </button>
            </div>

            {/* Pending Section */}
            {activeTab === "Pending" && (
                <section className="mt-6">
                    <h2 className="text-lg font-bold text-[#3A3A3A]">Pending</h2>
                    <div className="mt-3 space-y-4">
                        {pendingBookings.length === 0 ? (
                            <div className="rounded-lg bg-white p-8 text-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                <p className="text-[#6B7280] text-sm">No pending requests available</p>
                            </div>
                        ) : (
                            pendingBookings.map((booking) => (
                                <div
                                    key={booking._id}
                                    className="rounded-lg bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] cursor-pointer"
                                    onClick={() => navigate(`/vendor/bookings/${booking._id}`)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {booking.user?.profilePicture || booking.user?.documents?.profilePicture?.url ? (
                                                <img
                                                    alt="User Avatar"
                                                    className="size-12 rounded-full object-cover"
                                                    src={booking.user.profilePicture || booking.user?.documents?.profilePicture?.url}
                                                />
                                            ) : (
                                                <div className="size-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                                    {booking.user?.name ? (
                                                        <span className="text-lg font-bold text-[#0A84FF]">
                                                            {booking.user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xl">👤</span>
                                                    )}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-semibold text-[#3A3A3A]">
                                                    {booking.user?.name || "Customer"}
                                                </h3>
                                                <p className="text-sm text-[#6B7280]">
                                                    Booking ID: {formatBookingId(booking._id)}
                                                </p>
                                            </div>
                                        </div>
                                        <button className="text-[#0A84FF]">
                                            <span className="material-symbols-outlined">chevron_right</span>
                                        </button>
                                    </div>
                                    <div className="mt-4 border-t border-gray-100 pt-3">
                                        <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                                            <span className="material-symbols-outlined !text-base text-[#00C2A8]">home</span>
                                            <span>{formatAddress(booking.address)}</span>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2 text-sm text-[#6B7280]">
                                            <span className="material-symbols-outlined !text-base text-[#00C2A8]">schedule</span>
                                            <span>{formatDateTime(booking.scheduledDate, booking.scheduledTime)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            )}

            {/* Completed Section */}
            {activeTab === "Completed" && (
                <section className="mt-8">
                    <h2 className="text-lg font-bold text-[#3A3A3A]">Completed</h2>
                    <div className="mt-3 space-y-4">
                        {completedBookings.length === 0 ? (
                            <div className="rounded-lg bg-white p-8 text-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                <p className="text-[#6B7280] text-sm">No completed requests available</p>
                            </div>
                        ) : (
                            completedBookings.map((booking) => (
                                <div
                                    key={booking._id}
                                    className="rounded-lg bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] opacity-75 cursor-pointer"
                                    onClick={() => navigate(`/vendor/bookings/${booking._id}`)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {booking.user?.profilePicture || booking.user?.documents?.profilePicture?.url ? (
                                                <img
                                                    alt="User Avatar"
                                                    className="size-12 rounded-full object-cover"
                                                    src={booking.user.profilePicture || booking.user?.documents?.profilePicture?.url}
                                                />
                                            ) : (
                                                <div className="size-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                                    {booking.user?.name ? (
                                                        <span className="text-lg font-bold text-[#0A84FF]">
                                                            {booking.user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xl">👤</span>
                                                    )}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-semibold text-[#3A3A3A]">
                                                    {booking.user?.name || "Customer"}
                                                </h3>
                                                <p className="text-sm text-[#6B7280]">
                                                    Booking ID: {formatBookingId(booking._id)}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-green-500">check_circle</span>
                                    </div>
                                    <div className="mt-4 border-t border-gray-100 pt-3">
                                        <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                                            <span className="material-symbols-outlined !text-base text-[#00C2A8]">home</span>
                                            <span>{formatAddress(booking.address)}</span>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2 text-sm text-[#6B7280]">
                                            <span className="material-symbols-outlined !text-base text-[#00C2A8]">event_available</span>
                                            <span>{formatCompletedDate(booking.completedAt || booking.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            )}
        </PageContainer>
    );
}
