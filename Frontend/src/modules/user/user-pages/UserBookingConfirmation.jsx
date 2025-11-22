import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { IoCheckmarkCircleOutline, IoCalendarOutline, IoTimeOutline, IoLocationOutline, IoPersonOutline, IoConstructOutline, IoChevronBackOutline } from "react-icons/io5";
import { getBookingDetails } from "../../../services/bookingApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";

export default function UserBookingConfirmation() {
    const navigate = useNavigate();
    const { bookingId } = useParams();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [booking, setBooking] = useState(location.state?.booking || null);

    useEffect(() => {
        if (bookingId) {
            if (location.state?.booking) {
                // Use booking from navigation state (preferred)
                setBooking(location.state.booking);
                setLoading(false);
            } else {
                // Fallback: load from API if state not available
                loadBookingDetails();
            }
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingId]);

    const loadBookingDetails = async () => {
        try {
            setLoading(true);
            const response = await getBookingDetails(bookingId);
            if (response.success) {
                setBooking(response.data.booking);
            } else {
                setError(response.message || "Failed to load booking details");
            }
        } catch (err) {
            setError("Failed to load booking details");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 flex items-center justify-center">
                <LoadingSpinner message="Loading booking details..." />
            </div>
        );
    }
    
    if (error && !booking) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
                <ErrorMessage message={error} />
                <div className="mt-4">
                    <button
                        onClick={() => navigate("/user/dashboard")}
                        className="px-6 py-3 bg-[#0A84FF] text-white font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }
    
    if (!booking) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
                <ErrorMessage message="Booking not found" />
                <div className="mt-4">
                    <button
                        onClick={() => navigate("/user/dashboard")}
                        className="px-6 py-3 bg-[#0A84FF] text-white font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <IoCheckmarkCircleOutline className="text-5xl text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h1>
                <p className="text-gray-600 text-center">Your service request has been received and is waiting for vendor acceptance.</p>
            </div>

            <div className="bg-white rounded-[12px] shadow-[0px_4px_10px_rgba(0,0,0,0.05)] p-6 mb-4">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Booking Details</h2>
                <div className="space-y-4">
                    <div className="flex justify-between pb-4 border-b">
                        <span className="text-sm text-gray-600">Booking ID</span>
                        <span className="text-base font-bold text-gray-800 font-mono">{bookingId?.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <IoConstructOutline className="text-xl text-[#0A84FF] mt-1" />
                        <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1">Service</p>
                            <p className="text-base font-semibold text-gray-800">{booking.service?.name || "N/A"}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <IoPersonOutline className="text-xl text-[#0A84FF] mt-1" />
                        <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1">Vendor</p>
                            <p className="text-base font-semibold text-gray-800">{booking.vendor?.name || "N/A"}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <IoCalendarOutline className="text-xl text-[#0A84FF] mt-1" />
                        <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1">Date & Time</p>
                            <p className="text-base font-semibold text-gray-800">
                                {new Date(booking.scheduledDate).toLocaleDateString("en-IN")} at {booking.scheduledTime}
                            </p>
                        </div>
                    </div>
                    {booking.payment && (
                        <div className="bg-green-50 rounded-[8px] p-3">
                            <div className="flex justify-between mb-1">
                                <span className="text-sm text-gray-700">Advance Paid (40%)</span>
                                <span className="text-base font-bold text-green-600">₹{booking.payment.advanceAmount?.toLocaleString()} ✓</span>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">Pending Vendor Acceptance</span>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-[12px] p-4 mb-6">
                <p className="text-sm text-blue-800"><strong>What's next?</strong> The vendor will review your request and accept it. You'll be notified once the vendor accepts your booking.</p>
            </div>

            <button onClick={() => navigate("/user/status", { state: { bookingId, refresh: true } })} className="w-full h-14 bg-[#0A84FF] text-white font-semibold rounded-[12px] hover:bg-[#005BBB] transition-colors text-lg flex items-center justify-center gap-2">
                <IoChevronBackOutline className="text-xl rotate-180" /> Back to Status
            </button>
        </div>
    );
}

