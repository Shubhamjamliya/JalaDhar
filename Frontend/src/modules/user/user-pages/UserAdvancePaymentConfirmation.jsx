import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    IoChevronBackOutline,
    IoCheckmarkCircleOutline,
    IoCalendarOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoPersonOutline,
    IoConstructOutline,
    IoDocumentTextOutline,
} from "react-icons/io5";
import { verifyAdvancePayment, cancelBooking } from "../../../services/bookingApi";
import { useAuth } from "../../../contexts/AuthContext";
import { loadRazorpay } from "../../../utils/razorpay";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import SuccessMessage from "../../shared/components/SuccessMessage";
import PageContainer from "../../shared/components/PageContainer";

export default function UserAdvancePaymentConfirmation() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    
    // Get booking data from navigation state
    const booking = location.state?.booking;
    const service = location.state?.service;
    const vendor = location.state?.vendor;
    const paymentData = location.state?.paymentData;
    const razorpayOrder = location.state?.razorpayOrder;

    useEffect(() => {
        // If no booking data, redirect back
        if (!booking || !service || !vendor || !paymentData || !razorpayOrder) {
            navigate("/user/request-service", { replace: true });
        }
    }, [booking, service, vendor, paymentData, razorpayOrder, navigate]);

    const handlePayment = async () => {
        try {
            setLoading(true);
            setError("");
            setSuccess("");

            // Load Razorpay script
            await loadRazorpay();

            const options = {
                key: paymentData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_key",
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency || 'INR',
                name: "Jaladhar",
                description: `Advance payment for ${service.name}`,
                order_id: razorpayOrder.id,
                handler: async function (paymentResponse) {
                    // Payment successful - verify payment on backend
                    try {
                        const verifyResponse = await verifyAdvancePayment(
                            booking.id,
                            paymentResponse.razorpay_order_id,
                            paymentResponse.razorpay_payment_id,
                            paymentResponse.razorpay_signature
                        );

                        if (verifyResponse.success) {
                            setPaymentSuccess(true);
                            setSuccess("Booking created successfully! Payment completed.");
                            setLoading(false);
                            // Navigate after a short delay to show success overlay
                            setTimeout(() => {
                                navigate(`/user/booking/confirmation/${booking.id}`, {
                                    replace: true,
                                    state: {
                                        booking: {
                                            ...booking,
                                            service: service,
                                            vendor: vendor
                                        }
                                    }
                                });
                            }, 500);
                        } else {
                            // Cancel booking if payment verification fails
                            try {
                                await cancelBooking(booking.id, "Payment verification failed");
                            } catch (cancelErr) {
                            }
                            setError(verifyResponse.message || "Payment verification failed. Booking has been cancelled. Please contact support.");
                            setLoading(false);
                            // Navigate back after a delay
                            setTimeout(() => {
                                navigate("/user/request-service", { 
                                    state: { service, vendor },
                                    replace: true 
                                });
                            }, 3000);
                        }
                    } catch (verifyErr) {
                        // Cancel booking if verification error occurs
                        try {
                            await cancelBooking(booking.id, "Payment verification error");
                        } catch (cancelErr) {
                        }
                        setError(verifyErr.response?.data?.message || "Payment verification failed. Booking has been cancelled. Please contact support.");
                        setLoading(false);
                        // Navigate back after a delay
                        setTimeout(() => {
                            navigate("/user/request-service", { 
                                state: { service, vendor },
                                replace: true 
                            });
                        }, 3000);
                    }
                },
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                    contact: user?.phone || "",
                },
                theme: {
                    color: "#0A84FF",
                },
                modal: {
                    ondismiss: async function () {
                        // Cancel the booking if payment is cancelled
                        try {
                            await cancelBooking(booking.id, "Payment cancelled by user");
                        } catch (cancelErr) {
                        }
                        setError("Payment cancelled. Booking has been cancelled.");
                        setLoading(false);
                        // Navigate back to request service page after a delay
                        setTimeout(() => {
                            navigate("/user/request-service", { 
                                state: { service, vendor },
                                replace: true 
                            });
                        }, 2000);
                    },
                },
            };

            // Validate Razorpay key before opening
            if (!paymentData.keyId || paymentData.keyId === "rzp_test_key" || !razorpayOrder?.id) {
                setError("Invalid Razorpay configuration. Please contact support or check your payment settings.");
                setLoading(false);
                return;
            }

            try {
                const razorpay = new window.Razorpay(options);

                // Handle payment failure
                razorpay.on('payment.failed', async function (response) {
                    const errorMsg = response.error?.description || response.error?.reason || response.error?.code || "Payment failed. Please try again.";
                    
                    // Cancel the booking if payment fails
                    try {
                        await cancelBooking(booking.id, `Payment failed: ${errorMsg}`);
                    } catch (cancelErr) {
                        // Failed to cancel booking - silently continue
                    }
                    
                    setError(`Payment failed: ${errorMsg}. Booking has been cancelled.`);
                    setLoading(false);
                    
                    // Navigate back to request service page after a delay
                    setTimeout(() => {
                        navigate("/user/request-service", { 
                            state: { service, vendor },
                            replace: true 
                        });
                    }, 3000);
                });

                // Handle payment errors
                razorpay.on('payment.error', async function (response) {
                    const errorMsg = response.error?.description || response.error?.reason || response.error?.code || "Payment error occurred. Please try again.";
                    
                    // Cancel the booking if payment error occurs
                    try {
                        await cancelBooking(booking.id, `Payment error: ${errorMsg}`);
                    } catch (cancelErr) {
                        // Failed to cancel booking - silently continue
                    }
                    
                    setError(`Payment error: ${errorMsg}. Booking has been cancelled.`);
                    setLoading(false);
                    
                    // Navigate back to request service page after a delay
                    setTimeout(() => {
                        navigate("/user/request-service", { 
                            state: { service, vendor },
                            replace: true 
                        });
                    }, 3000);
                });

                // Handle Razorpay API errors
                const errorHandler = (event) => {
                    if (event.message && (
                        event.message.includes('razorpay') ||
                        event.message.includes('api.razorpay.com') ||
                        event.target?.src?.includes('razorpay.com')
                    )) {
                        setError("Payment gateway error. Please try again or contact support.");
                        setLoading(false);
                        window.removeEventListener('error', errorHandler);
                    }
                };

                window.addEventListener('error', errorHandler, { once: true });

                const rejectionHandler = (event) => {
                    if (event.reason && (
                        event.reason.message?.includes('razorpay') ||
                        event.reason.message?.includes('api.razorpay.com') ||
                        event.reason?.config?.url?.includes('razorpay.com')
                    )) {
                        setError("Payment gateway error. Please try again or contact support.");
                        setLoading(false);
                        window.removeEventListener('unhandledrejection', rejectionHandler);
                    }
                };
                window.addEventListener('unhandledrejection', rejectionHandler, { once: true });

                // Cleanup error listeners when modal closes
                const originalOndismiss = options.modal.ondismiss;
                options.modal.ondismiss = async function () {
                    window.removeEventListener('error', errorHandler);
                    window.removeEventListener('unhandledrejection', rejectionHandler);
                    setLoading(false);
                    if (originalOndismiss) {
                        await originalOndismiss();
                    }
                };

                razorpay.open();
            } catch (razorpayError) {
                setError("Failed to initialize payment gateway. Please check your Razorpay configuration or try again later.");
                setLoading(false);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to initiate payment. Please try again.");
            setLoading(false);
        }
    };

    const formatAmount = (amount) => {
        if (!amount) return "₹0.00";
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Not set";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return "Not set";
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const formatAddress = (address) => {
        if (!address) return "Not provided";
        const parts = [
            address.street,
            address.city,
            address.state,
            address.pincode
        ].filter(Boolean);
        return parts.join(", ") || "Not provided";
    };

    // Show success overlay during navigation
    if (paymentSuccess) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
                <div className="text-center px-4">
                    <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6 mx-auto animate-pulse">
                        <IoCheckmarkCircleOutline className="text-6xl text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-3">Payment Successful!</h2>
                    <p className="text-lg text-gray-600 mb-4">Your booking has been confirmed</p>
                    <div className="flex items-center justify-center gap-2 text-[#0A84FF]">
                        <div className="w-2 h-2 rounded-full bg-[#0A84FF] animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-[#0A84FF] animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 rounded-full bg-[#0A84FF] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <span className="ml-2 text-sm font-medium">Redirecting...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!booking || !service || !vendor || !paymentData || !razorpayOrder) {
        return (
            <PageContainer>
                <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Loading booking details...</p>
                    <LoadingSpinner message="" />
                </div>
            </PageContainer>
        );
    }

    const advanceAmount = Math.round(service.price * 0.4);
    const remainingAmount = Math.round(service.price * 0.6);
    const totalAmount = service.price;

    return (
        <PageContainer>
            <ErrorMessage message={error} />
            <SuccessMessage message={success} />

            {/* Back Button */}
            <button
                onClick={() => navigate("/user/request-service", { state: { service, vendor } })}
                className="mb-4 flex items-center gap-2 text-[#0A84FF] hover:text-[#005BBB] transition-colors"
            >
                <IoChevronBackOutline className="text-xl" />
                <span className="font-semibold">Back</span>
            </button>

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    Confirm Booking & Payment
                </h1>
                <p className="text-gray-600">Please review your booking details before proceeding to payment</p>
            </div>

            {/* Booking Details Card */}
            <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <IoDocumentTextOutline className="text-2xl text-[#0A84FF]" />
                    Booking Details
                </h2>
                
                <div className="space-y-4">
                    {/* Service Info */}
                    <div className="bg-[#F6F7F9] rounded-[10px] p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <IoConstructOutline className="text-xl text-[#0A84FF]" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-600">Service</p>
                                <p className="text-base font-bold text-gray-800">{service.name}</p>
                            </div>
                            <p className="text-lg font-semibold text-[#0A84FF]">
                                {formatAmount(service.price)}
                            </p>
                        </div>
                    </div>

                    {/* Vendor Info */}
                    <div className="bg-[#F6F7F9] rounded-[10px] p-4">
                        <div className="flex items-center gap-3">
                            <IoPersonOutline className="text-xl text-[#0A84FF]" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-600">Vendor</p>
                                <p className="text-base font-bold text-gray-800">{vendor.name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#F6F7F9] rounded-[10px] p-4">
                            <div className="flex items-center gap-3">
                                <IoCalendarOutline className="text-xl text-[#0A84FF]" />
                                <div>
                                    <p className="text-sm text-gray-600">Scheduled Date</p>
                                    <p className="text-base font-semibold text-gray-800">
                                        {formatDate(booking.scheduledDate)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#F6F7F9] rounded-[10px] p-4">
                            <div className="flex items-center gap-3">
                                <IoTimeOutline className="text-xl text-[#0A84FF]" />
                                <div>
                                    <p className="text-sm text-gray-600">Scheduled Time</p>
                                    <p className="text-base font-semibold text-gray-800">
                                        {formatTime(booking.scheduledTime)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="bg-[#F6F7F9] rounded-[10px] p-4">
                        <div className="flex items-start gap-3">
                            <IoLocationOutline className="text-xl text-[#0A84FF] mt-1" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-600 mb-1">Service Address</p>
                                <p className="text-base font-semibold text-gray-800">
                                    {formatAddress(booking.address)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {booking.notes && (
                        <div className="bg-[#F6F7F9] rounded-[10px] p-4">
                            <p className="text-sm text-gray-600 mb-1">Additional Notes</p>
                            <p className="text-base text-gray-800">{booking.notes}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Summary Card */}
            <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Summary</h2>
                
                <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Amount</span>
                        <span className="font-semibold text-gray-800">{formatAmount(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Advance Payment (40%)</span>
                        <span className="font-semibold text-[#0A84FF]">{formatAmount(advanceAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Remaining (60%)</span>
                        <span className="font-semibold text-gray-800">{formatAmount(remainingAmount)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-800">Amount to Pay Now</span>
                        <span className="text-lg font-bold text-[#0A84FF]">{formatAmount(advanceAmount)}</span>
                    </div>
                </div>
            </div>

            {/* Razorpay Test Mode Info */}
            {import.meta.env.VITE_RAZORPAY_KEY_ID && import.meta.env.VITE_RAZORPAY_KEY_ID.startsWith('rzp_test_') && (
                <div className="bg-blue-50 border border-blue-200 rounded-[12px] p-4 mb-6">
                    <p className="text-sm font-semibold text-blue-800 mb-1">
                        💳 Razorpay Test Mode Active
                    </p>
                    <p className="text-xs text-blue-600">
                        Using Razorpay test environment. Use test card: <strong>4111 1111 1111 1111</strong> (any future expiry, any CVV)
                    </p>
                </div>
            )}

            {/* Payment Button */}
            <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full bg-[#0A84FF] text-white py-4 rounded-[10px] font-semibold text-lg hover:bg-[#005BBB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <LoadingSpinner message="" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <span>Pay {formatAmount(advanceAmount)} & Confirm Booking</span>
                        </>
                    )}
                </button>
                <p className="text-xs text-gray-500 text-center mt-3">
                    By proceeding, you agree to pay the advance amount of 40% to confirm your booking.
                </p>
            </div>
        </PageContainer>
    );
}

