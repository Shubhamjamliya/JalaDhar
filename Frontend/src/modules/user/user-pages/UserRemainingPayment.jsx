import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    IoChevronBackOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoDocumentTextOutline,
    IoImageOutline,
} from "react-icons/io5";
import { getBookingDetails, initiateRemainingPayment, verifyRemainingPayment } from "../../../services/bookingApi";
import { loadRazorpay } from "../../../utils/razorpay";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import SuccessMessage from "../../shared/components/SuccessMessage";

export default function UserRemainingPayment() {
    const navigate = useNavigate();
    const { bookingId } = useParams();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [booking, setBooking] = useState(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    useEffect(() => {
        loadBookingDetails();
    }, [bookingId]);

    const loadBookingDetails = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getBookingDetails(bookingId);
            if (response.success) {
                const bookingData = response.data.booking;
                
                // Check if booking is in correct status (use userStatus for user view)
                const userStatus = bookingData.userStatus || bookingData.status;
                if (userStatus !== 'AWAITING_PAYMENT' && userStatus !== 'REPORT_UPLOADED') {
                    setError("This booking is not eligible for remaining payment.");
                    setLoading(false);
                    return;
                }

                if (bookingData.payment?.remainingPaid) {
                    setError("Remaining payment has already been completed.");
                    setLoading(false);
                    return;
                }

                setBooking(bookingData);
            } else {
                setError(response.message || "Failed to load booking details");
            }
        } catch (err) {
            console.error("Load booking error:", err);
            setError(err.response?.data?.message || "Failed to load booking details");
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        try {
            setProcessing(true);
            setError("");

            // Initiate payment
            const paymentResponse = await initiateRemainingPayment(bookingId);
            
            if (!paymentResponse.success) {
                setError(paymentResponse.message || "Failed to initiate payment");
                setProcessing(false);
                return;
            }

            const paymentData = paymentResponse.data;
            const razorpayOrder = {
                id: paymentData.razorpayOrderId,
                amount: paymentData.amount * 100, // Convert to paise
                currency: 'INR'
            };

            // Load Razorpay script
            await loadRazorpay();

            const options = {
                key: paymentData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency || 'INR',
                name: "Jaladhar",
                description: `Remaining payment for ${booking.service?.name || 'Service'}`,
                order_id: razorpayOrder.id,
                handler: async function (paymentResponse) {
                    try {
                        const verifyResponse = await verifyRemainingPayment(
                            bookingId,
                            paymentResponse.razorpay_order_id,
                            paymentResponse.razorpay_payment_id,
                            paymentResponse.razorpay_signature
                        );

                        if (verifyResponse.success) {
                            setPaymentSuccess(true);
                            setSuccess("Payment completed successfully! You can now view the full report.");
                            setProcessing(false);
                            
                            // Navigate to booking details after short delay
                            setTimeout(() => {
                                navigate(`/user/booking/${bookingId}`, { replace: true });
                            }, 1500);
                        } else {
                            setError(verifyResponse.message || "Payment verification failed. Please contact support.");
                            setProcessing(false);
                        }
                    } catch (verifyErr) {
                        console.error("Payment verification error:", verifyErr);
                        setError(verifyErr.response?.data?.message || "Payment verification failed. Please contact support.");
                        setProcessing(false);
                    }
                },
                theme: {
                    color: "#0A84FF",
                },
                modal: {
                    ondismiss: function () {
                        setError("Payment cancelled. Please try again when ready.");
                        setProcessing(false);
                    },
                },
            };

            // Validate Razorpay key
            if (!paymentData.keyId || paymentData.keyId === "rzp_test_key") {
                setError("Invalid Razorpay configuration. Please contact support.");
                setProcessing(false);
                return;
            }

            try {
                const razorpay = new window.Razorpay(options);
                
                razorpay.on('payment.failed', function (response) {
                    console.error("Razorpay payment failed:", response);
                    const errorMsg = response.error?.description || response.error?.reason || "Payment failed. Please try again.";
                    setError(`Payment failed: ${errorMsg}`);
                    setProcessing(false);
                });
                
                razorpay.on('payment.error', function (response) {
                    console.error("Razorpay payment error:", response);
                    const errorMsg = response.error?.description || response.error?.reason || "Payment error occurred. Please try again.";
                    setError(`Payment error: ${errorMsg}`);
                    setProcessing(false);
                });

                razorpay.open();
            } catch (razorpayError) {
                console.error("Razorpay initialization error:", razorpayError);
                setError("Failed to initialize payment gateway. Please try again later.");
                setProcessing(false);
            }
        } catch (err) {
            console.error("Payment initiation error:", err);
            setError(err.response?.data?.message || "Failed to initiate payment. Please try again.");
            setProcessing(false);
        }
    };

    const formatAmount = (amount) => {
        if (!amount) return "₹0.00";
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 flex items-center justify-center">
                <LoadingSpinner message="Loading payment details..." />
            </div>
        );
    }

    if (error && !booking) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
                <ErrorMessage message={error} />
                <button
                    onClick={() => navigate(`/user/booking/${bookingId}`)}
                    className="mt-4 flex items-center gap-2 text-[#0A84FF] hover:text-[#005BBB] transition-colors"
                >
                    <IoChevronBackOutline className="text-xl" />
                    <span className="font-semibold">Back to Booking Details</span>
                </button>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
                <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Booking not found</p>
                    <button
                        onClick={() => navigate("/user/history")}
                        className="bg-[#0A84FF] text-white px-6 py-2 rounded-[10px] font-semibold hover:bg-[#005BBB] transition-colors"
                    >
                        Back to History
                    </button>
                </div>
            </div>
        );
    }

    // Show success overlay during navigation
    if (paymentSuccess) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
                <div className="text-center px-4">
                    <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6 mx-auto animate-pulse">
                        <IoCheckmarkCircleOutline className="text-6xl text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-3">Payment Successful!</h2>
                    <p className="text-lg text-gray-600 mb-4">Your remaining payment has been processed</p>
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

    const report = booking.report || {};
    const advancePaid = booking.payment?.advancePaid || false;
    const remainingAmount = booking.payment?.remainingAmount || 0;
    const totalAmount = booking.payment?.totalAmount || 0;

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <div className="max-w-2xl mx-auto">
                <ErrorMessage message={error} />
                <SuccessMessage message={success} />

                {/* Back Button */}
                <button
                    onClick={() => navigate(`/user/booking/${bookingId}`)}
                    className="flex items-center gap-2 mb-6 text-gray-600 hover:text-[#0A84FF] transition-colors"
                >
                    <IoChevronBackOutline className="text-xl" />
                    <span className="text-sm font-medium">Back to Booking Details</span>
                </button>

                {/* Header */}
                <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Complete Payment</h1>
                    <p className="text-gray-600">Pay the remaining 60% to view your full water detection report</p>
                </div>

                {/* Report Preview */}
                {report.waterFound !== undefined && (
                    <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <IoDocumentTextOutline className="text-2xl text-[#0A84FF]" />
                            <h2 className="text-xl font-bold text-gray-800">Report Preview</h2>
                        </div>
                        
                        <div className="bg-[#F6F7F9] rounded-[10px] p-4 mb-4">
                            <div className="flex items-center gap-3 mb-3">
                                {report.waterFound ? (
                                    <>
                                        <IoCheckmarkCircleOutline className="text-3xl text-green-600" />
                                        <div>
                                            <p className="font-semibold text-gray-800">Water Found</p>
                                            <p className="text-sm text-gray-600">The vendor has detected water at your location</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <IoCloseCircleOutline className="text-3xl text-red-600" />
                                        <div>
                                            <p className="font-semibold text-gray-800">No Water Detected</p>
                                            <p className="text-sm text-gray-600">The vendor did not detect water at your location</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <p className="text-sm text-gray-600">
                            Pay the remaining amount to view complete report details including machine readings, images, and notes.
                        </p>
                    </div>
                )}

                {/* Payment Summary */}
                <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Summary</h2>
                    
                    <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Service Amount</span>
                            <span className="font-semibold text-gray-800">{formatAmount(totalAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Advance Paid (40%)</span>
                            <span className="font-semibold text-green-600">- {formatAmount(totalAmount * 0.4)}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-800">Remaining Amount (60%)</span>
                            <span className="text-lg font-bold text-[#0A84FF]">{formatAmount(remainingAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Button */}
                <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={handlePayment}
                        disabled={processing}
                        className="w-full bg-[#0A84FF] text-white py-4 rounded-[10px] font-semibold text-lg hover:bg-[#005BBB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {processing ? (
                            <>
                                <LoadingSpinner message="" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <span>Pay {formatAmount(remainingAmount)}</span>
                            </>
                        )}
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-3">
                        By proceeding, you agree to complete the payment for the remaining 60% of the service amount.
                    </p>
                </div>
            </div>
        </div>
    );
}

