import { useState, useEffect } from "react";
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

export default function AdminVendorDetails() {
    const { vendorId } = useParams();
    const navigate = useNavigate();
    const [vendor, setVendor] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadVendorDetails();
    }, [vendorId]);

    const loadVendorDetails = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getVendorDetails(vendorId);
            
            if (response.success) {
                setVendor(response.data.vendor);
                setStatistics(response.data.statistics);
            } else {
                setError("Failed to load vendor details");
            }
        } catch (err) {
            console.error("Load vendor details error:", err);
            setError("Failed to load vendor details");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (window.confirm("Are you sure you want to approve this vendor?")) {
            try {
                setActionLoading(true);
                const response = await approveVendor(vendorId);
                
                if (response.success) {
                    await loadVendorDetails();
                    alert("Vendor approved successfully!");
                } else {
                    alert(response.message || "Failed to approve vendor");
                }
            } catch (err) {
                console.error("Approve vendor error:", err);
                alert("Failed to approve vendor. Please try again.");
            } finally {
                setActionLoading(false);
            }
        }
    };

    const handleReject = async () => {
        const rejectionReason = window.prompt(
            "Please provide a reason for rejection (minimum 10 characters):"
        );

        if (!rejectionReason || rejectionReason.trim().length < 10) {
            if (rejectionReason !== null) {
                alert("Rejection reason must be at least 10 characters long.");
            }
            return;
        }

        if (window.confirm("Are you sure you want to reject this vendor?")) {
            try {
                setActionLoading(true);
                const response = await rejectVendor(vendorId, rejectionReason);
                
                if (response.success) {
                    await loadVendorDetails();
                    alert("Vendor rejected successfully!");
                } else {
                    alert(response.message || "Failed to reject vendor");
                }
            } catch (err) {
                console.error("Reject vendor error:", err);
                alert("Failed to reject vendor. Please try again.");
            } finally {
                setActionLoading(false);
            }
        }
    };

    const handleDeactivate = async () => {
        if (window.confirm("Are you sure you want to deactivate this vendor?")) {
            try {
                setActionLoading(true);
                const response = await deactivateVendor(vendorId);
                
                if (response.success) {
                    await loadVendorDetails();
                    alert("Vendor deactivated successfully!");
                } else {
                    alert(response.message || "Failed to deactivate vendor");
                }
            } catch (err) {
                console.error("Deactivate vendor error:", err);
                alert("Failed to deactivate vendor. Please try again.");
            } finally {
                setActionLoading(false);
            }
        }
    };

    const handleActivate = async () => {
        if (window.confirm("Are you sure you want to activate this vendor?")) {
            try {
                setActionLoading(true);
                const response = await activateVendor(vendorId);
                
                if (response.success) {
                    await loadVendorDetails();
                    alert("Vendor activated successfully!");
                } else {
                    alert(response.message || "Failed to activate vendor");
                }
            } catch (err) {
                console.error("Activate vendor error:", err);
                alert("Failed to activate vendor. Please try again.");
            } finally {
                setActionLoading(false);
            }
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
        return parts.join(", ") || "N/A";
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

    if (error || !vendor) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || "Vendor not found"}</p>
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
                                className={`px-3 py-1 rounded-[6px] text-sm font-semibold ${
                                    vendor.isApproved
                                        ? "bg-green-100 text-green-700"
                                        : "bg-yellow-100 text-yellow-700"
                                }`}
                            >
                                {vendor.isApproved ? "Approved" : "Pending Approval"}
                            </span>
                            <span
                                className={`px-3 py-1 rounded-[6px] text-sm font-semibold ${
                                    vendor.isActive
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
                    <div className="space-y-3">
                        {vendor.educationalQualifications && vendor.educationalQualifications.length > 0 ? (
                            vendor.educationalQualifications.map((qual, index) => (
                                <div key={index} className="text-sm">
                                    <p><span className="font-semibold">Degree:</span> {qual.degree}</p>
                                    <p><span className="font-semibold">Institution:</span> {qual.institution}</p>
                                    <p><span className="font-semibold">Year:</span> {qual.year}</p>
                                    {qual.percentage && (
                                        <p><span className="font-semibold">Percentage:</span> {qual.percentage}%</p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">No qualifications provided</p>
                        )}
                        <p className="text-sm"><span className="font-semibold">Experience:</span> {vendor.experience || 0} years</p>
                    </div>
                </div>

                {/* Documents */}
                <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Documents</h3>
                    <div className="space-y-3">
                        {vendor.documents?.profilePicture && (
                            <div>
                                <p className="text-sm font-semibold mb-2">Profile Picture</p>
                                <img
                                    src={vendor.documents.profilePicture.url}
                                    alt="Profile"
                                    className="w-32 h-32 object-cover rounded-lg"
                                />
                            </div>
                        )}
                        {vendor.documents?.aadharCard && (
                            <div>
                                <p className="text-sm font-semibold mb-2">Aadhaar Card</p>
                                <img
                                    src={vendor.documents.aadharCard.url}
                                    alt="Aadhaar"
                                    className="w-full max-w-xs h-48 object-contain rounded-lg border border-gray-200"
                                />
                            </div>
                        )}
                        {vendor.documents?.panCard && (
                            <div>
                                <p className="text-sm font-semibold mb-2">PAN Card</p>
                                <img
                                    src={vendor.documents.panCard.url}
                                    alt="PAN"
                                    className="w-full max-w-xs h-48 object-contain rounded-lg border border-gray-200"
                                />
                            </div>
                        )}
                        {vendor.documents?.cancelledCheque && (
                            <div>
                                <p className="text-sm font-semibold mb-2">Cancelled Cheque</p>
                                <img
                                    src={vendor.documents.cancelledCheque.url}
                                    alt="Cheque"
                                    className="w-full max-w-xs h-48 object-contain rounded-lg border border-gray-200"
                                />
                            </div>
                        )}
                        {vendor.documents?.certificates && vendor.documents.certificates.length > 0 && (
                            <div>
                                <p className="text-sm font-semibold mb-2">Certificates</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {vendor.documents.certificates.map((cert, index) => (
                                        <img
                                            key={index}
                                            src={cert.url}
                                            alt={`Certificate ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Services */}
                <div className="bg-white rounded-[12px] p-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Services</h3>
                    {vendor.services && vendor.services.length > 0 ? (
                        <div className="space-y-2">
                            {vendor.services.map((service) => (
                                <div key={service._id} className="p-3 bg-gray-50 rounded-lg">
                                    <p className="font-semibold text-sm">{service.name}</p>
                                    <p className="text-xs text-gray-600">{service.machineType}</p>
                                    <p className="text-xs text-gray-600">₹{service.price?.toLocaleString()}</p>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                        service.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                        service.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {service.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No services added yet</p>
                    )}
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
    );
}

