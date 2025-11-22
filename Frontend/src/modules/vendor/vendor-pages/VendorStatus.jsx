import { useState, useEffect } from "react";
import {
    IoTimeOutline,
    IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { getBookingHistory, markBookingAsVisited, markBookingAsCompleted } from "../../../services/vendorApi";
import { useVendorAuth } from "../../../contexts/VendorAuthContext";
import PageContainer from "../../shared/components/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import ProfileHeader from "../../shared/components/ProfileHeader";
import SectionHeading from "../../shared/components/SectionHeading";
import StatCard from "../../shared/components/StatCard";
import BookingCard from "../../shared/components/BookingCard";

export default function VendorStatus() {
    const { vendor } = useVendorAuth();
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

    if (loading) {
        return <LoadingSpinner message="Loading status..." />;
    }

    const vendorProfileImage = vendor?.documents?.profilePicture?.url || null;

    return (
        <PageContainer>
            <ErrorMessage message={error} />

            {/* Profile Header */}
            <ProfileHeader 
                name={vendor?.name || "Vendor"} 
                profileImage={vendorProfileImage}
            />

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
                <StatCard label="Accepted" value={acceptedBookings.length} className="border-l-4 border-blue-500" />
                <StatCard label="Visited" value={visitedBookings.length} className="border-l-4 border-purple-500" />
                <StatCard label="Completed" value={completedBookings.length} className="border-l-4 border-green-500" />
            </div>

            {/* Accepted Bookings */}
            {acceptedBookings.length > 0 && (
                <div className="mb-6">
                    <SectionHeading title={`Accepted Bookings (${acceptedBookings.length})`} />
                    <div className="space-y-4">
                        {acceptedBookings.map((booking) => (
                            <BookingCard
                                key={booking._id}
                                booking={booking}
                                user={booking.user}
                                service={booking.service}
                                status="ACCEPTED"
                                showActions={true}
                                actions={[
                                    {
                                        icon: IoCheckmarkCircleOutline,
                                        label: "Mark as Visited",
                                        onClick: () => handleMarkVisited(booking._id),
                                        loading: actionLoading === booking._id,
                                        className: "bg-[#0A84FF] text-white hover:bg-[#005BBB]"
                                    }
                                ]}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Visited Bookings */}
            {visitedBookings.length > 0 && (
                <div className="mb-6">
                    <SectionHeading title={`Visited Bookings (${visitedBookings.length})`} />
                    <div className="space-y-4">
                        {visitedBookings.map((booking) => (
                            <BookingCard
                                key={booking._id}
                                booking={booking}
                                user={booking.user}
                                service={booking.service}
                                status="VISITED"
                                showActions={true}
                                actions={[
                                    {
                                        icon: IoCheckmarkCircleOutline,
                                        label: "Mark as Completed",
                                        onClick: () => handleMarkCompleted(booking._id),
                                        loading: actionLoading === booking._id,
                                        className: "bg-green-600 text-white hover:bg-green-700"
                                    }
                                ]}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Completed Bookings */}
            {completedBookings.length > 0 && (
                <div>
                    <SectionHeading title={`Completed Bookings (${completedBookings.length})`} />
                    <div className="space-y-4">
                        {completedBookings.map((booking) => (
                            <BookingCard
                                key={booking._id}
                                booking={booking}
                                user={booking.user}
                                service={booking.service}
                                status="COMPLETED"
                            />
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
        </PageContainer>
    );
}
