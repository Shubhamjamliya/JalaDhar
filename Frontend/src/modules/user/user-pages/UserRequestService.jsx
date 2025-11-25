import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    IoImageOutline,
    IoCalendarOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoCloseOutline,
    IoChevronBackOutline,
} from "react-icons/io5";
import { createBooking } from "../../../services/bookingApi";
import PageContainer from "../../shared/components/PageContainer";
import ErrorMessage from "../../shared/components/ErrorMessage";
import SuccessMessage from "../../shared/components/SuccessMessage";

export default function UserRequestService() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [service, setService] = useState(null);
    const [vendor, setVendor] = useState(null);
    const [formData, setFormData] = useState({
        scheduledDate: "",
        scheduledTime: "",
        address: {
            street: "",
            city: "",
            state: "",
            pincode: "",
        },
        notes: "",
        images: [],
    });

    useEffect(() => {
        // Get service and vendor from navigation state
        if (location.state?.service && location.state?.vendor) {
            setService(location.state.service);
            setVendor(location.state.vendor);
        } else {
            // If no service/vendor selected, redirect back
            navigate("/user/serviceprovider");
        }
    }, [location, navigate]);

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setFormData({
            ...formData,
            images: [...formData.images, ...newImages],
        });
    };

    const handleRemoveImage = (index) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        setFormData({ ...formData, images: newImages });
    };

    const handleAddressChange = (field, value) => {
        setFormData({
            ...formData,
            address: {
                ...formData.address,
                [field]: value,
            },
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Validate address
        if (!formData.address.street || !formData.address.city || !formData.address.state || !formData.address.pincode) {
            setError("Please fill in all address fields");
            return;
        }

        if (!service || !vendor) {
            setError("Service or vendor information is missing");
            return;
        }

        try {
            setLoading(true);

            // Create booking
            const bookingData = {
                serviceId: service._id || service.id,
                vendorId: vendor._id || vendor.id,
                scheduledDate: formData.scheduledDate,
                scheduledTime: formData.scheduledTime,
                address: formData.address,
                notes: formData.notes || undefined,
            };

            const response = await createBooking(bookingData);

            if (response.success) {
                const booking = response.data.booking;
                const paymentData = response.data.payment;
                const razorpayOrder = response.data.razorpayOrder;

                if (!razorpayOrder) {
                    setError("Payment order not created. Please try again.");
                    setLoading(false);
                    return;
                }

                setLoading(false);
                
                // Navigate to confirmation page instead of directly opening payment
                navigate("/user/booking/advance-payment/confirmation", {
                                        replace: true,
                                        state: {
                        booking: booking,
                                                service: service,
                        vendor: vendor,
                        paymentData: paymentData,
                        razorpayOrder: razorpayOrder
                    }
                });
            } else {
                // Check if error is due to existing active booking
                if (response.message && response.message.includes("active booking")) {
                    setError(response.message || "You already have an active booking. Please complete or cancel it first.");
                } else {
                    setError(response.message || "Failed to create booking");
                }
                setLoading(false);
            }
        } catch (err) {
            console.error("Create booking error:", err);
            const errorMessage = err.response?.data?.message || "Failed to create booking. Please try again.";

            // Check if error is due to existing active booking
            if (errorMessage.includes("active booking") || errorMessage.includes("already have")) {
                setError(errorMessage);
            } else {
                setError(errorMessage);
            }
            setLoading(false);
        }
    };

    if (!service || !vendor) {
    return (
            <PageContainer>
                <div className="text-center py-8">
                    <p className="text-gray-600">Loading booking details...</p>
            </div>
            </PageContainer>
        );
    }

    // Check if error is about active booking
    const hasActiveBookingError = error && (error.includes("active booking") || error.includes("already have"));

    return (
        <PageContainer>
            <ErrorMessage message={error} />
            {hasActiveBookingError && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-[12px] p-4">
                    <p className="text-sm text-blue-800 mb-3 font-medium">
                        You can view your current booking status or cancel it to create a new booking.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={() => navigate("/user/status")}
                            className="flex-1 bg-[#0A84FF] text-white px-4 py-2 rounded-[8px] text-sm font-semibold hover:bg-[#005BBB] transition-colors"
                        >
                            View Current Booking
                        </button>
                                        <button
                            onClick={() => navigate("/user/history")}
                            className="flex-1 bg-white text-[#0A84FF] border border-[#0A84FF] px-4 py-2 rounded-[8px] text-sm font-semibold hover:bg-blue-50 transition-colors"
                                        >
                            View Booking History
                                        </button>
                                    </div>
                            </div>
                        )}
            <SuccessMessage message={success} />

            {/* Back Button */}
            <button
                onClick={() => navigate("/user/serviceprovider")}
                className="mb-4 flex items-center gap-2 text-[#0A84FF] hover:text-[#005BBB] transition-colors"
            >
                <IoChevronBackOutline className="text-xl" />
                <span className="font-semibold">Back</span>
            </button>

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    Book Service
                </h1>
                <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] mb-4">
                    <p className="text-sm text-gray-600 mb-1">Service</p>
                    <p className="text-base font-bold text-gray-800">{service.name}</p>
                    <p className="text-lg font-semibold text-[#0A84FF] mt-1">
                        ₹{service.price?.toLocaleString()}
                    </p>
                </div>
                <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <p className="text-sm text-gray-600 mb-1">Vendor</p>
                    <p className="text-base font-bold text-gray-800">{vendor.name}</p>
                    </div>
                </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                            <IoCalendarOutline className="inline text-base mr-1" />
                            Date *
                        </label>
                        <input
                            type="date"
                            value={formData.scheduledDate}
                            onChange={(e) =>
                                setFormData({ ...formData, scheduledDate: e.target.value })
                            }
                            required
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                            <IoTimeOutline className="inline text-base mr-1" />
                            Time *
                        </label>
                        <input
                            type="time"
                            value={formData.scheduledTime}
                            onChange={(e) =>
                                setFormData({ ...formData, scheduledTime: e.target.value })
                            }
                            required
                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                        />
                    </div>
                </div>

                {/* Address Fields */}
                <div>
                    <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                        <IoLocationOutline className="inline text-base mr-1" />
                        Address *
                    </label>
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Street Address"
                            value={formData.address.street}
                            onChange={(e) => handleAddressChange("street", e.target.value)}
                            required
                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="City"
                                value={formData.address.city}
                                onChange={(e) => handleAddressChange("city", e.target.value)}
                                required
                                className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                            />
                            <input
                                type="text"
                                placeholder="State"
                                value={formData.address.state}
                                onChange={(e) => handleAddressChange("state", e.target.value)}
                                required
                                className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="Pincode"
                            value={formData.address.pincode}
                            onChange={(e) => handleAddressChange("pincode", e.target.value)}
                            required
                            pattern="[0-9]{6}"
                            className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
                        />
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                        Additional Notes
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                        }
                        rows="4"
                        placeholder="Any special instructions or requirements..."
                        className="w-full bg-white border border-[#D9DDE4] rounded-[12px] px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0A84FF] shadow-[0px_4px_10px_rgba(0,0,0,0.05)] resize-none"
                    />
                </div>


                {/* Razorpay Test Mode Info */}
                {import.meta.env.VITE_RAZORPAY_KEY_ID && import.meta.env.VITE_RAZORPAY_KEY_ID.startsWith('rzp_test_') && (
                    <div className="bg-blue-50 border border-blue-200 rounded-[12px] p-4 mb-4">
                        <p className="text-sm font-semibold text-blue-800 mb-1">
                            💳 Razorpay Test Mode Active
                        </p>
                        <p className="text-xs text-blue-600">
                            Using Razorpay test environment. Use test card: <strong>4111 1111 1111 1111</strong> (any future expiry, any CVV)
                        </p>
                    </div>
                )}

                {/* Payment Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-[12px] p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-2">Payment Breakdown</p>
                    <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Total Amount:</span>
                            <span className="font-semibold">₹{service.price?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Advance Payment (40%):</span>
                            <span className="font-semibold text-[#0A84FF]">
                                ₹{Math.round(service.price * 0.4).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Remaining (60%):</span>
                            <span className="font-semibold">
                                ₹{Math.round(service.price * 0.6).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0A84FF] text-white font-semibold py-4 px-6 rounded-[12px] hover:bg-[#005BBB] active:bg-[#004A9A] transition-colors shadow-[0px_4px_10px_rgba(10,132,255,0.2)] text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Processing..." : "Book & Pay"}
                    </button>
                </div>
            </form>
        </PageContainer>
    );
}
