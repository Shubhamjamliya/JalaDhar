import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {

    IoCheckmarkCircleOutline,
    IoCalendarOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoPersonOutline,
    IoConstructOutline,
    IoDocumentTextOutline,
    IoCashOutline,
} from "react-icons/io5";
import { verifyAdvancePayment, cancelBooking, getBookingDetails } from "../../../services/bookingApi";
import { useAuth } from "../../../contexts/AuthContext";
import { loadRazorpay } from "../../../utils/razorpay";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import PageContainer from "../../shared/components/PageContainer";
import { useToast } from "../../../hooks/useToast";

export default function UserAdvancePaymentConfirmation() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [fetchedPaymentConfig, setFetchedPaymentConfig] = useState(null);
    const [fullBooking, setFullBooking] = useState(null);

    // Get booking data from location state or try to recover from persisted state
    // We prioritize location state, but robustly handle _id vs id
    const stateBooking = location.state?.booking;
    const bookingId = stateBooking?.id || stateBooking?._id || location.state?.bookingId;

    // Construct a minimal booking object if we only have ID, to allow fetching
    const booking = stateBooking || (bookingId ? { id: bookingId } : null);

    const stateService = location.state?.service;
    const stateVendor = location.state?.vendor;
    const statePaymentData = location.state?.paymentData;
    const stateRazorpayOrder = location.state?.razorpayOrder;

    // Use fetched data or state data
    const service = fullBooking?.service || stateService;
    const vendor = fullBooking?.vendor || stateVendor;
    const paymentData = fetchedPaymentConfig || statePaymentData;
    // Use full booking details if available, otherwise fall back to initial state
    const displayBooking = fullBooking || booking;

    // Ensure razorpayOrder is available even if refreshing (using fetched config)
    const razorpayOrder = stateRazorpayOrder || (fetchedPaymentConfig ? {
        id: fetchedPaymentConfig.razorpayOrderId,
        amount: fetchedPaymentConfig.amount,
        currency: fetchedPaymentConfig.currency
    } : null);

    // Fetch full booking details to get payment breakdown
    useEffect(() => {
        const fetchBookingDetails = async () => {
            if (bookingId && bookingId !== "undefined") {
                try {
                    const response = await getBookingDetails(bookingId);
                    if (response.success) {
                        setFullBooking(response.data.booking);
                        if (response.data.paymentConfig) {
                            setFetchedPaymentConfig(response.data.paymentConfig);
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch booking details:", err);
                    toast.showError("Failed to load booking details. Please try again.");
                }
            }
        };
        fetchBookingDetails();
    }, [bookingId]);

    useEffect(() => {
        // Only redirect if absolutely no booking info and NO ID
        if (!booking && !bookingId) {
            navigate("/user/dashboard", { replace: true });
        }
    }, [booking, bookingId, navigate]);

    const handlePayment = async () => {
        try {
            setLoading(true);
            setError("");

            // Determine config sources with fallbacks
            let keyId = fetchedPaymentConfig?.keyId || statePaymentData?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
            let orderId = fetchedPaymentConfig?.razorpayOrderId || stateRazorpayOrder?.id || stateRazorpayOrder?.orderId || fullBooking?.payment?.advanceRazorpayOrderId;
            let amount = fetchedPaymentConfig?.amount || stateRazorpayOrder?.amount || (fullBooking?.payment?.advanceAmount ? fullBooking.payment.advanceAmount * 100 : 0);
            let currency = fetchedPaymentConfig?.currency || stateRazorpayOrder?.currency || 'INR';

            // If key or order ID is still missing, try to reload details one last time
            if (!keyId || !orderId) {
                console.warn("Payment config missing, retrying fetch...", { keyId, orderId });
                try {
                    const response = await getBookingDetails(bookingId);
                    if (response.success && response.data.booking) {
                        const newBooking = response.data.booking;
                        setFullBooking(newBooking);

                        // Retry extraction
                        keyId = response.data.paymentConfig?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
                        orderId = response.data.paymentConfig?.razorpayOrderId || newBooking.payment?.advanceRazorpayOrderId;
                        amount = response.data.paymentConfig?.amount || (newBooking.payment?.advanceAmount * 100);
                    }
                } catch (e) {
                    console.error("Retry fetch failed", e);
                }
            }

            if (!keyId || !orderId) {
                console.error("Payment Config Missing:", { keyId, orderId, amount, currency });
                setError("Payment configuration missing. Please return to dashboard and try again.");
                setLoading(false);
                return;
            }

            // Load Razorpay script
            await loadRazorpay();

            const options = {
                key: keyId,
                amount: amount,
                currency: currency,
                name: "Jaladhar",
                description: `Advance payment for ${service?.name || 'Service'}`,
                order_id: orderId,
                handler: async function (paymentResponse) {
                    // Payment successful - verify payment on backend
                    try {
                        const verifyResponse = await verifyAdvancePayment(
                            bookingId,
                            paymentResponse.razorpay_order_id,
                            paymentResponse.razorpay_payment_id,
                            paymentResponse.razorpay_signature
                        );

                        if (verifyResponse.success) {
                            setPaymentSuccess(true);
                            toast.showSuccess("Booking created successfully! Payment completed.");
                            setLoading(false);
                            // Navigate after a short delay to show success overlay
                            setTimeout(() => {
                                navigate(`/user/booking/confirmation/${bookingId}`, {
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
                                await cancelBooking(bookingId, "Payment verification failed");
                            } catch (cancelErr) {
                            }
                            setError(verifyResponse.message || "Payment verification failed. Booking has been cancelled. Please contact support.");
                            setLoading(false);
                            // Navigate back after a delay
                            setTimeout(() => {
                                navigate("/user/survey", {
                                    state: { service, vendor },
                                    replace: true
                                });
                            }, 3000);
                        }
                    } catch (verifyErr) {
                        // Cancel booking if verification error occurs
                        try {
                            await cancelBooking(bookingId, "Payment verification error");
                        } catch (cancelErr) {
                        }
                        setError(verifyErr.response?.data?.message || "Payment verification failed. Booking has been cancelled. Please contact support.");
                        setLoading(false);
                        // Navigate back after a delay
                        setTimeout(() => {
                            navigate("/user/survey", {
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
                        // User closed the popup without paying.
                        // Do NOT cancel the booking. Keep it PENDING so they can pay later via dashboard.
                        setLoading(false);
                        toast.showInfo("Payment cancelled. You can complete payment from your Dashboard.");

                        // Navigate to dashboard to show them the new "Pending Payment" status
                        setTimeout(() => {
                            navigate("/user/dashboard", { replace: true });
                        }, 1000);
                    },
                },
            };

            // Validate Razorpay key before opening
            let razorpayKeyId = paymentData.keyId;
            if (!razorpayKeyId || razorpayKeyId === "rzp_test_key") {
                // Fallback to frontend environment variable if backend key is missing
                razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
            }

            if (!razorpayKeyId || razorpayKeyId === "rzp_test_key" || !razorpayOrder?.id) {
                console.error("Razorpay Key Missing. Backend:", paymentData.keyId, "Frontend:", import.meta.env.VITE_RAZORPAY_KEY_ID);
                setError("Invalid Razorpay configuration. Please contact support or check your payment settings.");
                setLoading(false);
                return;
            }

            // Ensure key is set in options
            options.key = razorpayKeyId;

            try {
                const razorpay = new window.Razorpay(options);

                // Handle payment failure
                razorpay.on('payment.failed', async function (response) {
                    const errorMsg = response.error?.description || response.error?.reason || response.error?.code || "Payment failed. Please try again.";

                    // Cancel the booking if payment fails
                    try {
                        await cancelBooking(bookingId, `Payment failed: ${errorMsg}`);
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
                        await cancelBooking(bookingId, `Payment error: ${errorMsg}`);
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
        // fallback if address is just a string
        if (typeof address === 'string') return address;

        // NEW: Check if there's a nested 'address' object (common in some geocoding responses)
        const target = (address.address && typeof address.address === 'object') ? address.address : address;

        // fallback if address object has a display string
        if (target.address && typeof target.address === 'string') return target.address;
        if (target.formatted_address) return target.formatted_address;

        const parts = [
            target.street,
            target.village,
            target.city,
            target.mandal,
            target.district,
            target.state,
            target.pincode
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : "Not provided";
    };

    // Preload Razorpay script for faster button interaction
    useEffect(() => {
        loadRazorpay().catch(() => { });
    }, []);

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

    // Use payment data from paymentData object (includes travel charges and GST)
    // The backend returns payment details in a separate paymentData object, not in booking.payment
    // Priority: fullBooking.payment > booking.payment > paymentData > fallback calculation
    const bookingPayment = fullBooking?.payment || booking?.payment;
    const totalAmount = bookingPayment?.totalAmount || paymentData?.totalAmount || service.price;
    const advanceAmount = bookingPayment?.advanceAmount || paymentData?.advanceAmount || Math.round(totalAmount * 0.4);
    const remainingAmount = bookingPayment?.remainingAmount || paymentData?.remainingAmount || Math.round(totalAmount * 0.6);

    // Get breakdown details for display from full booking or initial booking object
    const baseServiceFee = bookingPayment?.baseServiceFee || service.price;
    const travelCharges = bookingPayment?.travelCharges || 0;
    const gst = bookingPayment?.gst || 0;
    const subtotal = bookingPayment?.subtotal || (baseServiceFee + travelCharges);
    const gstPercentage = bookingPayment?.gstPercentage || 18;


    return (
        <PageContainer>
            <ErrorMessage message={error} />

            {/* Removed Back Button from here as it's now in UserNavbar */}

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
                                        {formatDate(displayBooking.scheduledDate)}
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
                                        {formatTime(displayBooking.scheduledTime)}
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
                                    {formatAddress(displayBooking.address)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {displayBooking.notes && (
                        <div className="bg-[#F6F7F9] rounded-[10px] p-4">
                            <p className="text-sm text-gray-600 mb-1">Additional Notes</p>
                            <p className="text-base text-gray-800">{displayBooking.notes}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Summary Card */}
            <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <IoCashOutline className="text-xl text-[#0A84FF]" />
                        <h2 className="text-xl font-bold text-gray-800">Payment Breakdown</h2>
                    </div>
                </div>

                <div className="space-y-3">
                    {/* Base Service Fee */}
                    <div className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                        <div>
                            <p className="font-semibold text-gray-800 text-sm">Base Service Fee</p>
                            <p className="text-xs text-gray-500">Service charge</p>
                        </div>
                        <p className="font-bold text-gray-900">{formatAmount(baseServiceFee)}</p>
                    </div>

                    {/* Travel Charges */}
                    <div className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                        <div>
                            <p className="font-semibold text-gray-800 text-sm">Travel Charges (Two-way)</p>
                            <p className="text-xs text-gray-500">
                                {bookingPayment?.distance ? `${Number(bookingPayment.distance).toFixed(2)} km` : 'Standard'} from vendor
                            </p>
                            {travelCharges > 0 && (
                                <p className="text-xs font-bold text-gray-500">
                                    2 x ₹{(Number(travelCharges) / 2).toFixed(2)}
                                </p>
                            )}
                        </div>
                        {travelCharges > 0 ? (
                            <p className="font-bold text-gray-900">{formatAmount(travelCharges)}</p>
                        ) : (
                            <p className="font-bold text-green-600 text-xs">Free (Within Range)</p>
                        )}
                    </div>

                    {/* Subtotal */}
                    <div className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                        <p className="font-semibold text-gray-800 text-sm">Subtotal</p>
                        <p className="font-bold text-gray-900">{formatAmount(subtotal)}</p>
                    </div>

                    {/* GST */}
                    <div className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                        <div>
                            <p className="font-semibold text-gray-800 text-sm">GST</p>
                            <p className="text-xs text-gray-500">{gstPercentage}% on subtotal</p>
                        </div>
                        <p className="font-bold text-gray-900">{formatAmount(gst)}</p>
                    </div>

                    {/* Total Amount */}
                    <div className="flex justify-between items-center p-3 border border-gray-200 rounded-xl bg-white shadow-sm">
                        <p className="font-bold text-gray-800 text-sm">Total Amount</p>
                        <p className="font-bold text-xl text-gray-900">{formatAmount(totalAmount)}</p>
                    </div>
                </div>

                <div className="mt-6">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Payment Schedule</p>
                    <div className="space-y-3">
                        {/* Advance Payment */}
                        <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <div>
                                <p className="font-semibold text-gray-800 text-sm">Advance Payment</p>
                                <p className="text-xs text-blue-600">40% of total</p>
                            </div>
                            <p className="font-bold text-blue-600 text-lg">{formatAmount(advanceAmount)}</p>
                        </div>

                        {/* Remaining Payment */}
                        <div className="flex justify-between items-center p-4 bg-gray-50 border border-gray-100 rounded-xl">
                            <div>
                                <p className="font-semibold text-gray-800 text-sm">Remaining Payment</p>
                                <p className="text-xs text-gray-500">60% of total</p>
                            </div>
                            <p className="font-bold text-gray-800 text-lg">{formatAmount(remainingAmount)}</p>
                        </div>
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
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <span>Pay {formatAmount(advanceAmount)} with UPI / Online</span>
                        </>
                    )}
                </button>
                <p className="text-xs text-gray-500 text-center mt-3">
                    By proceeding, you agree to pay the advance amount of 40% to confirm your booking.
                </p>
            </div>
        </PageContainer >
    );
}

