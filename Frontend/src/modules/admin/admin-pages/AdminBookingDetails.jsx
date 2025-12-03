import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    IoChevronBackOutline,
    IoTimeOutline,
    IoLocationOutline,
    IoCallOutline,
    IoMailOutline,
    IoPersonOutline,
    IoConstructOutline,
    IoDocumentTextOutline,
} from "react-icons/io5";
import { getBookingDetails } from "../../../services/adminApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";

export default function AdminBookingDetails() {
    const navigate = useNavigate();
    const { bookingId } = useParams();
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(null);
    const toast = useToast();

    useEffect(() => {
        loadBookingDetails();
    }, [bookingId]);

    const loadBookingDetails = async () => {
        try {
            setLoading(true);
            const response = await getBookingDetails(bookingId);
            if (response.success) {
                setBooking(response.data.booking);
            } else {
                toast.showError(response.message || "Failed to load booking details");
            }
        } catch (err) {
            handleApiError(err, "Failed to load booking details");
        } finally {
            setLoading(false);
        }
    };


    const formatDate = (dateString, timeString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        const formattedDate = date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
        if (timeString) {
            return `${formattedDate}, ${timeString}`;
        }
        return formattedDate;
    };

    const formatAmount = (amount) => {
        if (!amount) return "₹0.00";
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatAddress = (address) => {
        if (!address) return "Not provided";
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.pincode) parts.push(address.pincode);
        return parts.join(", ") || "Not provided";
    };

    const getStatusColor = (status) => {
        const colors = {
            PENDING: "bg-yellow-100 text-yellow-700",
            ASSIGNED: "bg-blue-100 text-blue-700",
            ACCEPTED: "bg-green-100 text-green-700",
            VISITED: "bg-purple-100 text-purple-700",
            REPORT_UPLOADED: "bg-indigo-100 text-indigo-700",
            AWAITING_PAYMENT: "bg-orange-100 text-orange-700",
            BOREWELL_UPLOADED: "bg-pink-100 text-pink-700",
            ADMIN_APPROVED: "bg-teal-100 text-teal-700",
            COMPLETED: "bg-green-100 text-green-700",
            CANCELLED: "bg-red-100 text-red-700",
        };
        return colors[status] || "bg-gray-100 text-gray-700";
    };

    const InfoRow = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-3 py-2">
            <Icon className="text-xl text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-sm font-medium text-gray-800 break-words">{value || "N/A"}</p>
            </div>
        </div>
    );

    if (loading) {
        return <LoadingSpinner message="Loading booking details..." />;
    }

    if (!booking) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Booking not found</p>
                <button
                    onClick={() => navigate("/admin/bookings")}
                    className="bg-[#0A84FF] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#005BBB] transition-colors"
                >
                    Back to Bookings
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate("/admin/bookings")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <IoChevronBackOutline className="text-2xl text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
                    <p className="text-sm text-gray-500">ID: #{booking._id.toString().slice(-8).toUpperCase()}</p>
                </div>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Booking Status</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">User Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.userStatus || booking.status)}`}>
                            {booking.userStatus || booking.status}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-500">Vendor Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.vendorStatus || booking.status)}`}>
                            {booking.vendorStatus || booking.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* User Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">User Details</h2>
                <div className="space-y-1">
                    <InfoRow icon={IoPersonOutline} label="Name" value={booking.user?.name} />
                    <InfoRow icon={IoMailOutline} label="Email" value={booking.user?.email} />
                    <InfoRow icon={IoCallOutline} label="Phone" value={booking.user?.phone} />
                </div>
            </div>

            {/* Vendor Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Vendor Details</h2>
                <div className="space-y-1">
                    <InfoRow icon={IoPersonOutline} label="Name" value={booking.vendor?.name} />
                    <InfoRow icon={IoMailOutline} label="Email" value={booking.vendor?.email} />
                    <InfoRow icon={IoCallOutline} label="Phone" value={booking.vendor?.phone} />
                </div>
            </div>

            {/* Service Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h2>
                <div className="space-y-1">
                    <InfoRow icon={IoConstructOutline} label="Service Name" value={booking.service?.name} />
                    <InfoRow icon={IoDocumentTextOutline} label="Description" value={booking.service?.description} />
                    <InfoRow icon={IoTimeOutline} label="Scheduled Date" value={formatDate(booking.scheduledDate, booking.scheduledTime)} />
                    <InfoRow icon={IoLocationOutline} label="Address" value={formatAddress(booking.address)} />
                </div>
            </div>

            {/* Payment Details */}
            {booking.payment && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Base Service Fee:</span>
                            <span className="font-medium">{formatAmount(booking.payment.baseServiceFee)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Travel Charges:</span>
                            <span className="font-medium">{formatAmount(booking.payment.travelCharges)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">GST:</span>
                            <span className="font-medium">{formatAmount(booking.payment.gst)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                            <span className="font-semibold text-gray-900">Total Amount:</span>
                            <span className="font-bold text-lg">{formatAmount(booking.payment.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Advance Paid:</span>
                            <span className={`font-medium ${booking.payment.advancePaid ? "text-green-600" : "text-red-600"}`}>
                                {booking.payment.advancePaid ? "✓ Yes" : "✗ No"} - {formatAmount(booking.payment.advanceAmount)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Remaining Paid:</span>
                            <span className={`font-medium ${booking.payment.remainingPaid ? "text-green-600" : "text-red-600"}`}>
                                {booking.payment.remainingPaid ? "✓ Yes" : "✗ No"} - {formatAmount(booking.payment.remainingAmount)}
                            </span>
                        </div>
                        {booking.payment.firstInstallment && (
                            <div className="flex justify-between pt-2 border-t">
                                <span className="text-gray-600">First Installment:</span>
                                <span className={`font-medium ${booking.payment.firstInstallment.paid ? "text-green-600" : "text-yellow-600"}`}>
                                    {booking.payment.firstInstallment.paid ? "✓ Paid" : "⏳ Pending"} - {formatAmount(booking.payment.firstInstallment.amount)}
                                </span>
                            </div>
                        )}
                        {booking.payment.vendorSettlement && (
                            <div className="pt-2 border-t space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Vendor Settlement Status:</span>
                                    <span className={`font-medium ${
                                        booking.payment.vendorSettlement.status === "COMPLETED" ? "text-green-600" :
                                        booking.payment.vendorSettlement.status === "PROCESSING" ? "text-yellow-600" :
                                        booking.payment.vendorSettlement.status === "FAILED" ? "text-red-600" :
                                        "text-gray-600"
                                    }`}>
                                        {booking.payment.vendorSettlement.status}
                                    </span>
                                </div>
                                {booking.payment.vendorSettlement.amount && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Settlement Amount:</span>
                                        <span className="font-medium">{formatAmount(booking.payment.vendorSettlement.amount)}</span>
                                    </div>
                                )}
                                {booking.payment.vendorSettlement.incentive && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Incentive:</span>
                                        <span className="font-medium text-green-600">{formatAmount(booking.payment.vendorSettlement.incentive)}</span>
                                    </div>
                                )}
                                {booking.payment.vendorSettlement.penalty && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Penalty:</span>
                                        <span className="font-medium text-red-600">{formatAmount(booking.payment.vendorSettlement.penalty)}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Report Section */}
            {booking.report && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Service Report</h2>
                        {booking.report.approvedAt ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                Approved
                            </span>
                        ) : booking.report.rejectedAt ? (
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                Rejected
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                Pending Approval
                            </span>
                        )}
                    </div>
                    <div className="space-y-3">
                        <div>
                            <span className="text-sm text-gray-600">Water Found: </span>
                            <span className={`font-medium ${booking.report.waterFound ? "text-green-600" : "text-red-600"}`}>
                                {booking.report.waterFound ? "Yes" : "No"}
                            </span>
                        </div>
                        {booking.report.images && booking.report.images.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-600 mb-2">Report Images:</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {booking.report.images.slice(0, 6).map((img, index) => (
                                        <img
                                            key={index}
                                            src={img.url}
                                            alt={`Report ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                            onClick={() => window.open(img.url, '_blank')}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        {booking.report.reportFile && (
                            <div>
                                <a
                                    href={booking.report.reportFile.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[#0A84FF] hover:underline"
                                >
                                    <IoDocumentTextOutline className="text-lg" />
                                    <span>View Report PDF</span>
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Borewell Result Section */}
            {booking.borewellResult && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Borewell Result</h2>
                        {booking.borewellResult.approvedAt ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                Approved
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                Pending Approval
                            </span>
                        )}
                    </div>
                    <div className="space-y-3">
                        <div>
                            <span className="text-sm text-gray-600">Status: </span>
                            <span className={`font-medium ${booking.borewellResult.status === "SUCCESS" ? "text-green-600" : "text-red-600"}`}>
                                {booking.borewellResult.status}
                            </span>
                        </div>
                        {booking.borewellResult.images && booking.borewellResult.images.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-600 mb-2">Result Images:</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {booking.borewellResult.images.map((img, index) => (
                                        <img
                                            key={index}
                                            src={img.url}
                                            alt={`Borewell ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                            onClick={() => window.open(img.url, '_blank')}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}

