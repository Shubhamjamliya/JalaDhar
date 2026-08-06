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

            {/* Customer Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h2>
                <div className="space-y-3">
                    <InfoRow icon={IoPersonOutline} label="Customer Name" value={booking.user?.name || booking.customerName || "Customer"} />
                    {booking.user?.email && !booking.user.email.endsWith('@jaladhar.internal') && (
                        <InfoRow icon={IoMailOutline} label="Email" value={booking.user.email} />
                    )}
                    
                    <div className="flex items-center justify-between py-1 border-b border-gray-50">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <IoCallOutline className="text-gray-400 text-lg" />
                            <span className="w-32 text-gray-500 font-medium">Primary Mobile:</span>
                            <span className="font-bold text-gray-900">{booking.user?.phone || booking.phone || 'N/A'}</span>
                        </div>
                        {(booking.user?.phone || booking.phone) && (
                            <a
                                href={`tel:${booking.user?.phone || booking.phone}`}
                                className="px-3 py-1 bg-blue-50 text-[#0A84FF] text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                            >
                                <IoCallOutline /> Call
                            </a>
                        )}
                    </div>

                    {(booking.alternatePhone || booking.user?.alternatePhone) && (
                        <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <IoCallOutline className="text-gray-400 text-lg" />
                                <span className="w-32 text-gray-500 font-medium">Alternate Mobile:</span>
                                <span className="font-bold text-gray-900">
                                    {booking.alternatePhone || booking.user?.alternatePhone}
                                </span>
                            </div>
                            <a
                                href={`tel:${booking.alternatePhone || booking.user?.alternatePhone}`}
                                className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1 border border-amber-200"
                            >
                                <IoCallOutline /> Call Alt
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Expert Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Vendor Details</h2>
                <div className="space-y-1">
                    <InfoRow icon={IoPersonOutline} label="Name" value={booking.vendor?.name} />
                    <InfoRow icon={IoMailOutline} label="Email" value={booking.vendor?.email} />
                    <InfoRow icon={IoCallOutline} label="Phone" value={booking.vendor?.phone} />
                </div>
            </div>

            {/* Survey Information Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <IoDocumentTextOutline className="text-[#0A84FF] text-xl" />
                    <span>Survey Information</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-xs font-semibold text-gray-500 uppercase block">Survey Category</span>
                        <span className="font-bold text-gray-900 mt-1 block">
                            {booking.surveyCategory || booking.purpose || booking.service?.category || "Agriculture"}
                        </span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-xs font-semibold text-gray-500 uppercase block">Land Area</span>
                        <span className="font-bold text-gray-900 mt-1 block">
                            {booking.purposeExtent 
                                ? formatAcresGuntasDisplay(booking.purposeExtent) 
                                : (booking.areaExtent ? `${booking.areaExtent} ${booking.areaUnit || 'Acres'}` : "Not specified")
                            }
                        </span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-xs font-semibold text-gray-500 uppercase block">Purpose of Survey</span>
                        <span className="font-bold text-gray-900 mt-1 block">
                            {booking.purpose || "Groundwater Point Identification & Hydrogeological Survey"}
                        </span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-xs font-semibold text-gray-500 uppercase block">Existing Borewells</span>
                        <span className="font-bold text-gray-900 mt-1 block">
                            {booking.existingBorewellInfo || "None / No Existing Borewell"}
                        </span>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 md:col-span-2">
                        <span className="text-xs font-semibold text-emerald-700 uppercase block">Preferred Survey Date & Time</span>
                        <span className="font-bold text-emerald-950 mt-1 block">
                            {formatDate(booking.scheduledDate, booking.scheduledTime)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Service Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h2>
                <div className="space-y-1">
                    <InfoRow icon={IoConstructOutline} label="Service Name" value={booking.service?.name} />
                    <InfoRow icon={IoDocumentTextOutline} label="Description" value={booking.service?.description} />
                    <InfoRow icon={IoTimeOutline} label="Scheduled Date" value={formatDate(booking.scheduledDate, booking.scheduledTime)} />
                </div>
            </div>

            {/* Survey Location Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <IoLocationOutline className="text-[#0A84FF] text-xl" />
                        <span>Survey Location</span>
                    </h2>
                    
                    <a
                        href={(booking.address?.coordinates?.lat || booking.address?.location?.coordinates?.[1]) && (booking.address?.coordinates?.lng || booking.address?.location?.coordinates?.[0])
                            ? `https://www.google.com/maps/dir/?api=1&destination=${booking.address?.coordinates?.lat || booking.address?.location?.coordinates?.[1]},${booking.address?.coordinates?.lng || booking.address?.location?.coordinates?.[0]}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([booking.address?.street, booking.village || booking.address?.village, booking.district || booking.address?.district, booking.state || booking.address?.state, booking.address?.pincode].filter(Boolean).join(', '))}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 bg-[#0A84FF] hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                    >
                        <IoNavigateOutline className="text-sm" />
                        <span>Navigate with Google Maps</span>
                    </a>
                </div>

                <div className="space-y-3">
                    <InfoRow icon={IoLocationOutline} label="Complete Address" value={booking.address?.street || booking.address?.landmark || [booking.address?.city, booking.address?.state].filter(Boolean).join(", ") || "N/A"} />
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                        <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-[11px] text-gray-500 font-medium">Village</p>
                            <p className="text-xs font-bold text-gray-800 mt-0.5 truncate">{booking.village || booking.address?.village || booking.address?.city || "N/A"}</p>
                        </div>
                        <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-[11px] text-gray-500 font-medium">Mandal / Taluk</p>
                            <p className="text-xs font-bold text-gray-800 mt-0.5 truncate">{booking.mandal || booking.address?.mandal || "N/A"}</p>
                        </div>
                        <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-[11px] text-gray-500 font-medium">District</p>
                            <p className="text-xs font-bold text-gray-800 mt-0.5 truncate">{booking.district || booking.address?.district || "N/A"}</p>
                        </div>
                        <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-[11px] text-gray-500 font-medium">State</p>
                            <p className="text-xs font-bold text-gray-800 mt-0.5 truncate">{booking.state || booking.address?.state || "N/A"}</p>
                        </div>
                        <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-[11px] text-gray-500 font-medium">PIN Code</p>
                            <p className="text-xs font-bold text-gray-800 mt-0.5">{booking.address?.pincode || "N/A"}</p>
                        </div>
                        <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-[11px] text-gray-500 font-medium">GPS Coordinates</p>
                            <p className="text-xs font-bold text-emerald-700 mt-0.5 truncate">
                                {(booking.address?.coordinates?.lat || booking.address?.location?.coordinates?.[1]) && (booking.address?.coordinates?.lng || booking.address?.location?.coordinates?.[0])
                                    ? `${Number(booking.address?.coordinates?.lat || booking.address?.location?.coordinates?.[1]).toFixed(5)}, ${Number(booking.address?.coordinates?.lng || booking.address?.location?.coordinates?.[0]).toFixed(5)}`
                                    : "N/A"
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer Requirements Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <IoDocumentTextOutline className="text-[#0A84FF] text-xl" />
                    <span>Customer Requirements</span>
                </h2>

                <div className="space-y-4 text-sm">
                    {/* Customer Notes */}
                    <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-100">
                        <span className="text-xs font-semibold text-amber-800 uppercase block mb-1">Customer Notes / Specific Instructions</span>
                        <p className="text-gray-900 font-medium whitespace-pre-line leading-relaxed">
                            {booking.customerNotes || booking.notes || "No specific notes provided by customer."}
                        </p>
                    </div>

                    {/* Uploaded Photos */}
                    <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                        <span className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-1.5">
                            <IoImageOutline className="text-base text-[#0A84FF]" />
                            <span>Uploaded Site Photos</span>
                        </span>
                        {(booking.customerPhotos?.length > 0 || booking.images?.length > 0 || booking.sitePhotos?.length > 0) ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-1">
                                {(booking.customerPhotos || booking.images || booking.sitePhotos || []).map((photo, idx) => {
                                    const imgUrl = typeof photo === 'string' ? photo : (photo.url || photo.preview);
                                    if (!imgUrl) return null;
                                    return (
                                        <a
                                            key={idx}
                                            href={imgUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm block hover:ring-2 hover:ring-[#0A84FF] transition-all"
                                        >
                                            <img src={imgUrl} alt={`Customer Site Photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                                <IoDownloadOutline className="text-base" /> View
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs font-medium text-gray-400 italic">No site photos uploaded by customer.</p>
                        )}
                    </div>

                    {/* Supporting Documents (if any) */}
                    <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                        <span className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-1.5">
                            <IoDocumentTextOutline className="text-base text-emerald-600" />
                            <span>Supporting Documents (if any)</span>
                        </span>
                        {(booking.supportingDocuments?.length > 0 || booking.userDocuments?.length > 0) ? (
                            <div className="space-y-2 pt-1">
                                {(booking.supportingDocuments || booking.userDocuments || []).map((doc, idx) => {
                                    const docUrl = typeof doc === 'string' ? doc : doc.url;
                                    const docName = typeof doc === 'string' ? `Document ${idx + 1}` : (doc.name || `Supporting Document ${idx + 1}`);
                                    if (!docUrl) return null;
                                    return (
                                        <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200 text-xs">
                                            <div className="flex items-center gap-2 truncate pr-2">
                                                <IoDocumentTextOutline className="text-base text-[#0A84FF] shrink-0" />
                                                <span className="font-bold text-gray-800 truncate">{docName}</span>
                                            </div>
                                            <a
                                                href={docUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1 bg-blue-50 text-[#0A84FF] font-bold rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1 shrink-0"
                                            >
                                                <IoDownloadOutline /> View Document
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs font-medium text-gray-400 italic">No supporting documents attached.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Details */}
            {booking.payment && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Total Survey Fee:</span>
                            <span className="font-medium">{formatAmount(booking.payment.baseServiceFee)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Travel Charges:</span>
                            <span className="font-medium">{formatAmount(booking.payment.travelCharges)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Platform Fee:</span>
                            <span className="font-medium text-red-500">- {formatAmount(booking.vendorWalletPayments?.platformFee || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">GST (if applicable):</span>
                            <span className="font-medium">{formatAmount(booking.payment.gst)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 mt-2">
                            <span className="text-gray-600">Advance Received:</span>
                            <span className={`font-medium ${booking.payment.advancePaid ? "text-green-600" : "text-yellow-600"}`}>
                                {booking.payment.advancePaid ? formatAmount(booking.payment.advanceAmount) : 'Pending'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Balance Amount:</span>
                            <span className={`font-medium ${booking.payment.remainingPaid ? "text-green-600" : "text-yellow-600"}`}>
                                {booking.payment.remainingPaid ? `Paid (${formatAmount(booking.payment.remainingAmount)})` : formatAmount(booking.payment.remainingAmount)}
                            </span>
                        </div>
                        <div className="flex justify-between border-t-2 border-gray-200 pt-3 mt-3">
                            <span className="font-bold text-gray-900 text-base">Expert Earnings:</span>
                            <span className="font-bold text-blue-600 text-lg">
                                {formatAmount((booking.vendorWalletPayments?.totalVendorPayment) || (booking.payment.baseServiceFee + booking.payment.travelCharges - (booking.vendorWalletPayments?.platformFee || 0)))}
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
                        
                        {/* Customer Feedback */}
                        {booking.report.feedback && typeof booking.report.feedback.isUseful === 'boolean' && (
                            <div className="pt-3 mt-3 border-t border-gray-100">
                                <span className="text-sm text-gray-600 block mb-2">Customer Feedback:</span>
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${booking.report.feedback.isUseful ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                    <span className="text-lg">{booking.report.feedback.isUseful ? '👍' : '👎'}</span>
                                    <span className="text-xs font-bold uppercase tracking-wider">{booking.report.feedback.isUseful ? 'Helpful Report' : 'Not Helpful'}</span>
                                </div>
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

