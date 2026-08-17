import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { IoCheckmarkCircleOutline, IoCalendarOutline, IoTimeOutline, IoLocationOutline, IoPersonOutline, IoConstructOutline, IoChevronBackOutline } from "react-icons/io5";
import { getBookingDetails } from "../../../services/bookingApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import PageContainer from "../../shared/components/PageContainer";

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
            setError("");
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
            <PageContainer className="flex items-center justify-center min-h-[50vh]">
                <LoadingSpinner message="Loading booking details..." />
            </PageContainer>
        );
    }

    if (error && !booking) {
        return (
            <PageContainer className="py-12">
                <ErrorMessage message={error} />
                <div className="mt-4">
                    <button
                        onClick={() => navigate("/user/dashboard")}
                        className="px-6 py-3 bg-[#0A84FF] text-white font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </PageContainer>
        );
    }

    if (!booking) {
        return (
            <PageContainer className="py-12">
                <ErrorMessage message="Booking not found" />
                <div className="mt-4">
                    <button
                        onClick={() => navigate("/user/dashboard")}
                        className="px-6 py-3 bg-[#0A84FF] text-white font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer className="pb-16 max-w-2xl mx-auto">
            <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <IoCheckmarkCircleOutline className="text-5xl text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h1>
                <p className="text-gray-600 text-center">Your service request has been received and is waiting for expert acceptance.</p>
            </div>

            <div className="bg-white rounded-[12px] shadow-[0px_4px_10px_rgba(0,0,0,0.05)] p-6 mb-4">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Booking Details</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Booking ID</span>
                        <span className="font-mono font-bold text-[#0A84FF]">{booking._id?.slice(-8).toUpperCase() || booking.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Service</span>
                        <span className="font-semibold text-gray-800">{booking.service?.name || "Groundwater Survey"}</span>
                    </div>
                    {booking.scheduledDate && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Date</span>
                            <span className="font-semibold text-gray-800">{new Date(booking.scheduledDate).toLocaleDateString()}</span>
                        </div>
                    )}
                    {booking.scheduledTime && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Time</span>
                            <span className="font-semibold text-gray-800">{booking.scheduledTime}</span>
                        </div>
                    )}
                    {booking.address && (
                        <div className="flex items-start justify-between">
                            <span className="text-sm text-gray-600">Location</span>
                            <span className="font-semibold text-gray-800 text-right max-w-xs">{booking.address.street || booking.address.city}</span>
                        </div>
                    )}
                    {booking.payment && (
                        <div className="pt-4 border-t space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Total Amount</span>
                                <span className="text-lg font-bold text-[#0A84FF]">₹{booking.payment.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Advance Paid (40%)</span>
                                <span className="text-green-600 font-semibold">₹{booking.payment.advanceAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Remaining (60%)</span>
                                <span className="text-base font-semibold text-gray-700">₹{booking.payment.remainingAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">Pending Expert Acceptance</span>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-[12px] p-4 mb-6">
                <p className="text-sm text-blue-800"><strong>What's next?</strong> The expert will review your request and accept it. You'll be notified once the expert accepts your booking.</p>
            </div>

            <button onClick={() => navigate("/user/status", { state: { bookingId, refresh: true } })} className="w-full h-14 bg-[#0A84FF] text-white font-semibold rounded-[12px] hover:bg-[#005BBB] transition-colors text-lg flex items-center justify-center gap-2">
                Go to Status
            </button>
        </PageContainer>
    );
}
