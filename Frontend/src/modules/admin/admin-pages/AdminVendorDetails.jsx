import { useState, useEffect } from "react";
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useParams, useNavigate } from "react-router-dom";
import {
    IoArrowBackOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoBanOutline,
    IoCheckmarkOutline,
    IoLocationOutline,
    IoCallOutline,
    IoMailOutline,
    IoTimeOutline,
    IoDocumentTextOutline,
    IoImageOutline,
} from "react-icons/io5";
import { getVendorDetails, approveVendor, rejectVendor, deactivateVendor, activateVendor } from "../../../services/adminApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";

export default function AdminVendorDetails() {
    const { vendorId } = useParams();
    const navigate = useNavigate();
    const [vendor, setVendor] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const toast = useToast();
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
    const [showActivateConfirm, setShowActivateConfirm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });

    useEffect(() => {
        loadVendorDetails();
    }, [vendorId]);

    const loadVendorDetails = async () => {
        try {
            setLoading(true);
            const response = await getVendorDetails(vendorId);

            if (response.success) {
                setVendor(response.data.vendor);
                setStatistics(response.data.statistics);
            } else {
                toast.showError(response.message || "Failed to load vendor details");
            }
        } catch (err) {
            console.error("Load vendor details error:", err);
            handleApiError(err, "Failed to load vendor details");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = () => {
        setShowApproveConfirm(true);
    };

    const handleApproveConfirm = async () => {
        setShowApproveConfirm(false);
        const loadingToast = toast.showLoading("Approving vendor...");
        try {
            setActionLoading(true);
            const response = await approveVendor(vendorId);

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Vendor approved successfully!");
                await loadVendorDetails();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to approve vendor");
            }
        } catch (err) {
            console.error("Approve vendor error:", err);
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to approve vendor. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = () => {
        setRejectionReason("");
        setShowRejectInput(true);
    };

    const handleRejectionReasonSubmit = (reason) => {
        setRejectionReason(reason);
        setShowRejectInput(false);
        setShowRejectConfirm(true);
    };

    const handleRejectConfirm = async () => {
        setShowRejectConfirm(false);
        const loadingToast = toast.showLoading("Rejecting vendor...");
        try {
            setActionLoading(true);
            const response = await rejectVendor(vendorId, rejectionReason);

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Vendor rejected successfully!");
                setRejectionReason("");
                await loadVendorDetails();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to reject vendor");
            }
        } catch (err) {
            console.error("Reject vendor error:", err);
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to reject vendor. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeactivate = () => {
        setShowDeactivateConfirm(true);
    };

    const handleDeactivateConfirm = async () => {
        setShowDeactivateConfirm(false);
        const loadingToast = toast.showLoading("Deactivating vendor...");
        try {
            setActionLoading(true);
            const response = await deactivateVendor(vendorId);

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Vendor deactivated successfully!");
                await loadVendorDetails();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to deactivate vendor");
            }
        } catch (err) {
            console.error("Deactivate vendor error:", err);
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to deactivate vendor. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleActivate = () => {
        setShowActivateConfirm(true);
    };

    const handleActivateConfirm = async () => {
        setShowActivateConfirm(false);
        const loadingToast = toast.showLoading("Activating vendor...");
        try {
            setActionLoading(true);
            const response = await activateVendor(vendorId);

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Vendor activated successfully!");
                await loadVendorDetails();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to activate vendor");
            }
        } catch (err) {
            console.error("Activate vendor error:", err);
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to activate vendor. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const formatAddress = (address) => {
        if (!address) return "N/A";
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.pincode) parts.push(address.pincode);

        const structuredAddress = parts.join(", ");
        if (structuredAddress) return structuredAddress;

        if (address.geoLocation && address.geoLocation.formattedAddress) {
            return address.geoLocation.formattedAddress;
        }

        return "N/A";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A84FF] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading vendor details...</p>
                </div>
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Vendor not found</p>
                    <button
                        onClick={() => navigate("/admin/vendors")}
                        className="px-4 py-2 bg-[#0A84FF] text-white rounded-lg hover:bg-[#005BBB] transition-colors"
                    >
                        Back to Vendors
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-[calc(100vh-5rem)]">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/admin/vendors")}
                    className="mb-4 flex items-center gap-2 text-[#0A84FF] hover:text-[#005BBB] transition-colors"
                >
                    <IoArrowBackOutline className="text-xl" />
                    <span>Back to Vendors</span>
                </button>

                {/* Header */}
                <div className="bg-white rounded-[12px] p-6 mb-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                                {vendor.name}
                            </h1>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span
                                    className={`px-3 py-1 rounded-[6px] text-sm font-semibold ${vendor.isApproved
                                        ? "bg-green-100 text-green-700"
                                        : "bg-yellow-100 text-yellow-700"
                                        }`}
                                >
                                    {vendor.isApproved ? "Approved" : "Pending Approval"}
                                </span>
                                <span
                                    className={`px-3 py-1 rounded-[6px] text-sm font-semibold ${vendor.isActive
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-red-100 text-red-700"
                                        }`}
                                >
                                    {vendor.isActive ? "Active" : "Inactive"}
                                </span>
                                {vendor.isEmailVerified && (
                                    <span className="px-3 py-1 rounded-[6px] text-sm font-semibold bg-blue-100 text-blue-700">
                                        Email Verified
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-[#4A4A4A]">
                            <IoMailOutline className="text-base" />
                            <span>{vendor.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#4A4A4A]">
                            <IoCallOutline className="text-base" />
                            <span>{vendor.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#4A4A4A]">
                            <IoLocationOutline className="text-base" />
                            <span>{formatAddress(vendor.address)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#4A4A4A]">
                            <IoTimeOutline className="text-base" />
                            <span>Registered: {formatDate(vendor.createdAt)}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                        {!vendor.isApproved && (
                            <>
                                <button
                                    onClick={handleApprove}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-[8px] hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <IoCheckmarkCircleOutline className="text-base" />
                                    {actionLoading ? "Processing..." : "Approve Vendor"}
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-[8px] hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <IoCloseCircleOutline className="text-base" />
                                    {actionLoading ? "Processing..." : "Reject Vendor"}
                                </button>
                            </>
                        )}

                        {vendor.isActive ? (
                            <button
                                onClick={handleDeactivate}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-[8px] hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <IoBanOutline className="text-base" />
                                {actionLoading ? "Processing..." : "Deactivate"}
                            </button>
                        ) : (
                            <button
                                onClick={handleActivate}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-[8px] hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <IoCheckmarkOutline className="text-base" />
                                {actionLoading ? "Processing..." : "Activate"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Statistics */}
                {statistics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                            <p className="text-xs text-[#4A4A4A] mb-1">Total Services</p>
                            <p className="text-2xl font-bold text-gray-800">{statistics.totalServices || 0}</p>
                        </div>
                        <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                            <p className="text-xs text-[#4A4A4A] mb-1">Active Services</p>
                            <p className="text-2xl font-bold text-gray-800">{statistics.activeServices || 0}</p>
                        </div>
                        <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                            <p className="text-xs text-[#4A4A4A] mb-1">Total Bookings</p>
                            <p className="text-2xl font-bold text-gray-800">{statistics.totalBookings || 0}</p>
                        </div>
                        <div className="bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                            <p className="text-xs text-[#4A4A4A] mb-1">Completed</p>
                            <p className="text-2xl font-bold text-gray-800">{statistics.completedBookings || 0}</p>
                        </div>
                    </div>
                )}

                {/* Location Section */}
                <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <IoLocationOutline className="text-red-500" />
                        Location Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 space-y-4">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Registered Address</p>
                                <p className="text-gray-800 text-sm">{formatAddress(vendor.address)}</p>
                            </div>

                            {vendor.address?.geoLocation?.formattedAddress && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Google Maps Address</p>
                                    <p className="text-gray-800 text-sm">{vendor.address.geoLocation.formattedAddress}</p>
                                </div>
                            )}

                            {vendor.address?.coordinates && (
                                <div className="pt-2">
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${vendor.address.coordinates.lat},${vendor.address.coordinates.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                                    >
                                        View on Google Maps
                                        <IoArrowBackOutline className="rotate-180" />
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-2 h-64 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                            {isLoaded && vendor.address?.coordinates ? (
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    center={{ lat: vendor.address.coordinates.lat, lng: vendor.address.coordinates.lng }}
                                    zoom={15}
                                    options={{
                                        disableDefaultUI: false,
                                        zoomControl: true,
                                        streetViewControl: false,
                                        mapTypeControl: false,
                                        fullscreenControl: true
                                    }}
                                >
                                    <Marker position={{ lat: vendor.address.coordinates.lat, lng: vendor.address.coordinates.lng }} />
                                </GoogleMap>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <IoLocationOutline className="text-4xl mb-2 opacity-20" />
                                    <p className="text-sm">{!isLoaded ? "Loading Map..." : "No coordinates available"}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bank Details */}
                    <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Bank Details</h3>
                        <div className="space-y-2 text-sm">
                            <p><span className="font-semibold">Account Holder:</span> {vendor.bankDetails?.accountHolderName || "N/A"}</p>
                            <p><span className="font-semibold">Account Number:</span> ****{vendor.bankDetails?.accountNumber?.slice(-4) || "N/A"}</p>
                            <p><span className="font-semibold">IFSC Code:</span> {vendor.bankDetails?.ifscCode || "N/A"}</p>
                            <p><span className="font-semibold">Bank Name:</span> {vendor.bankDetails?.bankName || "N/A"}</p>
                            {vendor.bankDetails?.branchName && (
                                <p><span className="font-semibold">Branch:</span> {vendor.bankDetails.branchName}</p>
                            )}
                        </div>
                    </div>

                    {/* Education & Experience */}
                    <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Education & Experience</h3>
                        <div className="space-y-4">
                            {vendor.educationalQualifications && vendor.educationalQualifications.length > 0 ? (
                                vendor.educationalQualifications.map((qual, index) => (
                                    <div key={index} className="text-sm p-3 bg-gray-50 rounded-lg">
                                        <p className="font-bold text-[#3A3A3A] mb-1">{qual.degree}</p>
                                        <p className="text-gray-600">{qual.institution}</p>
                                        <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                            <span>Year: {qual.year}</span>
                                            {qual.percentage && <span>Score: {qual.percentage}%</span>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">No qualifications provided</p>
                            )}

                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-sm"><span className="font-semibold">Experience:</span> {vendor.experience || 0} years</p>
                                {vendor.experienceDetails && (
                                    <p className="text-sm mt-1 text-gray-600"><span className="font-semibold">Details:</span> {vendor.experienceDetails}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Service Setup */}
                    <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] col-span-1 md:col-span-2">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <IoCheckmarkCircleOutline className="text-blue-500" />
                            Service Setup
                        </h3>
                        {vendor.services && vendor.services.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {vendor.services.map((service) => (
                                    <div key={service._id} className="border border-gray-200 rounded-xl overflow-hidden">
                                        <div className="bg-gray-50 p-4 border-b border-gray-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-[#3A3A3A]">{service.name}</h4>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${service.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                    service.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {service.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-1"><span className="font-semibold">Machines:</span> {service.machineType}</p>
                                            <p className="text-sm font-bold text-green-600">₹{service.price?.toLocaleString()} <span className="text-gray-400 font-normal text-xs">/ service</span></p>
                                        </div>

                                        {/* Service Images */}
                                        <div className="p-4">
                                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Service Images</p>
                                            {service.images && service.images.length > 0 ? (
                                                <div className="flex gap-2 overflow-x-auto pb-2">
                                                    {service.images.map((img, idx) => (
                                                        <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                                            <img
                                                                src={img.url}
                                                                alt={`Service ${idx + 1}`}
                                                                className="w-20 h-20 object-cover rounded-lg border border-gray-100 hover:border-blue-500 transition-colors"
                                                            />
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-400 italic">No images uploaded</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No services added yet</p>
                        )}
                    </div>

                    {/* Documents - Identity & Finance */}
                    <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <IoDocumentTextOutline className="text-purple-500" />
                            Identity & Bank Documents
                        </h3>
                        <div className="space-y-6">
                            {/* Aadhaar */}
                            <div>
                                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    Aadhaar Card
                                    {vendor.documents?.aadharCard ? <IoCheckmarkCircleOutline className="text-green-500" /> : <IoCloseCircleOutline className="text-red-500" />}
                                </p>
                                {vendor.documents?.aadharCard ? (
                                    <a href={vendor.documents.aadharCard.url} target="_blank" rel="noopener noreferrer" className="block">
                                        <img
                                            src={vendor.documents.aadharCard.url}
                                            alt="Aadhaar"
                                            className="w-full h-40 object-contain bg-gray-50 rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                                        />
                                    </a>
                                ) : <p className="text-xs text-red-500 italic">Not uploaded</p>}
                            </div>

                            {/* PAN */}
                            <div>
                                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    PAN Card
                                    {vendor.documents?.panCard ? <IoCheckmarkCircleOutline className="text-green-500" /> : <IoCloseCircleOutline className="text-red-500" />}
                                </p>
                                {vendor.documents?.panCard ? (
                                    <a href={vendor.documents.panCard.url} target="_blank" rel="noopener noreferrer" className="block">
                                        <img
                                            src={vendor.documents.panCard.url}
                                            alt="PAN"
                                            className="w-full h-40 object-contain bg-gray-50 rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                                        />
                                    </a>
                                ) : <p className="text-xs text-red-500 italic">Not uploaded</p>}
                            </div>

                            {/* Cheque */}
                            <div>
                                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    Cancelled Cheque
                                    {vendor.documents?.cancelledCheque ? <IoCheckmarkCircleOutline className="text-green-500" /> : <IoCloseCircleOutline className="text-red-500" />}
                                </p>
                                {vendor.documents?.cancelledCheque ? (
                                    <a href={vendor.documents.cancelledCheque.url} target="_blank" rel="noopener noreferrer" className="block">
                                        <img
                                            src={vendor.documents.cancelledCheque.url}
                                            alt="Cheque"
                                            className="w-full h-40 object-contain bg-gray-50 rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                                        />
                                    </a>
                                ) : <p className="text-xs text-red-500 italic">Not uploaded</p>}
                            </div>
                        </div>
                    </div>

                    {/* Documents - Professional & Regulatory */}
                    <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <IoDocumentTextOutline className="text-orange-500" />
                            Professional Documents
                        </h3>
                        <div className="space-y-6">
                            {/* Groundwater Reg */}
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <p className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                                    Groundwater Registration
                                    {vendor.documents?.groundwaterRegDetails ? <IoCheckmarkCircleOutline className="text-green-600" /> : <IoCloseCircleOutline className="text-red-500" />}
                                </p>
                                {vendor.documents?.groundwaterRegDetails ? (
                                    <a href={vendor.documents.groundwaterRegDetails.url} target="_blank" rel="noopener noreferrer" className="block">
                                        <img
                                            src={vendor.documents.groundwaterRegDetails.url}
                                            alt="Groundwater Reg"
                                            className="w-full h-40 object-contain bg-white rounded-lg border border-blue-200 hover:opacity-90 transition-opacity"
                                        />
                                    </a>
                                ) : <p className="text-xs text-red-500 italic">Not uploaded</p>}
                            </div>

                            {/* Certificates */}
                            <div>
                                <p className="text-sm font-semibold mb-2">Degree Certificates</p>
                                {vendor.documents?.certificates && vendor.documents.certificates.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {vendor.documents.certificates.map((cert, index) => (
                                            <a key={index} href={cert.url} target="_blank" rel="noopener noreferrer" className="block group">
                                                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                                                    <img
                                                        src={cert.url}
                                                        alt={`Certificate ${index + 1}`}
                                                        className="w-full h-24 object-cover"
                                                    />
                                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1">
                                                        <p className="text-[10px] text-white truncate text-center">{cert.name}</p>
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                ) : <p className="text-xs text-gray-500 italic">No certificates uploaded</p>}
                            </div>

                            {/* Training Certificates */}
                            <div>
                                <p className="text-sm font-semibold mb-2">Training Certificates</p>
                                {vendor.documents?.trainingCertificates && vendor.documents.trainingCertificates.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {vendor.documents.trainingCertificates.map((cert, index) => (
                                            <a key={index} href={cert.url} target="_blank" rel="noopener noreferrer" className="block group">
                                                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                                                    <img
                                                        src={cert.url}
                                                        alt={`Training ${index + 1}`}
                                                        className="w-full h-24 object-cover"
                                                    />
                                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1">
                                                        <p className="text-[10px] text-white truncate text-center">{cert.name}</p>
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                ) : <p className="text-xs text-gray-500 italic">No training certificates</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Approval Info */}
                {vendor.approvedBy && (
                    <div className="mt-6 bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Approval Information</h3>
                        <div className="text-sm space-y-1">
                            <p><span className="font-semibold">Approved by:</span> {vendor.approvedBy.name} ({vendor.approvedBy.email})</p>
                            <p><span className="font-semibold">Approved on:</span> {formatDate(vendor.approvedAt)}</p>
                        </div>
                    </div>
                )}

                {/* Rejection Info */}
                {vendor.rejectionReason && (
                    <div className="mt-6 bg-red-50 border border-red-200 rounded-[12px] p-6">
                        <h3 className="text-lg font-bold text-red-800 mb-2">Rejection Reason</h3>
                        <p className="text-sm text-red-700">{vendor.rejectionReason}</p>
                    </div>
                )}
            </div>

            {/* Approve Vendor Confirmation Modal */}
            <ConfirmModal
                isOpen={showApproveConfirm}
                onClose={() => setShowApproveConfirm(false)}
                onConfirm={handleApproveConfirm}
                title="Approve Vendor"
                message="Are you sure you want to approve this vendor?"
                confirmText="Yes, Approve"
                cancelText="Cancel"
                confirmColor="primary"
            />

            {/* Rejection Reason Input Modal */}
            <InputModal
                isOpen={showRejectInput}
                onClose={() => {
                    setShowRejectInput(false);
                    setRejectionReason("");
                }}
                onSubmit={handleRejectionReasonSubmit}
                title="Reject Vendor"
                message="Please provide a reason for rejection (minimum 10 characters):"
                placeholder="Enter rejection reason..."
                submitText="Continue"
                cancelText="Cancel"
                minLength={10}
                isTextarea={true}
                textareaRows={4}
            />

            {/* Reject Vendor Confirmation Modal */}
            <ConfirmModal
                isOpen={showRejectConfirm}
                onClose={() => {
                    setShowRejectConfirm(false);
                    setRejectionReason("");
                }}
                onConfirm={handleRejectConfirm}
                title="Confirm Rejection"
                message="Are you sure you want to reject this vendor?"
                confirmText="Yes, Reject"
                cancelText="Cancel"
                confirmColor="danger"
            />

            {/* Deactivate Vendor Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeactivateConfirm}
                onClose={() => setShowDeactivateConfirm(false)}
                onConfirm={handleDeactivateConfirm}
                title="Deactivate Vendor"
                message="Are you sure you want to deactivate this vendor?"
                confirmText="Yes, Deactivate"
                cancelText="Cancel"
                confirmColor="warning"
            />

            {/* Activate Vendor Confirmation Modal */}
            <ConfirmModal
                isOpen={showActivateConfirm}
                onClose={() => setShowActivateConfirm(false)}
                onConfirm={handleActivateConfirm}
                title="Activate Vendor"
                message="Are you sure you want to activate this vendor?"
                confirmText="Yes, Activate"
                cancelText="Cancel"
                confirmColor="primary"
            />
        </>);
}

