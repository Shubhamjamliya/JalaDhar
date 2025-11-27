import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoEyeOutline,
    IoTimeOutline,
} from "react-icons/io5";
import { getPendingVendors, approveVendor, rejectVendor } from "../../../services/adminApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";

export default function AdminPendingVendors() {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const toast = useToast();
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);
    const [selectedVendorId, setSelectedVendorId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalVendors: 0
    });
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadPendingVendors();
    }, [page]);

    const loadPendingVendors = async () => {
        try {
            setLoading(true);
            
            const response = await getPendingVendors({ page, limit: 10 });
            
            if (response.success) {
                setVendors(response.data.vendors || []);
                setPagination(response.data.pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalVendors: 0
                });
            } else {
                toast.showError("Failed to load pending vendors");
            }
        } catch (err) {
            console.error("Load pending vendors error:", err);
            handleApiError(err, "Failed to load pending vendors");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = (vendorId) => {
        setSelectedVendorId(vendorId);
        setShowApproveConfirm(true);
    };

    const handleApproveConfirm = async () => {
        if (!selectedVendorId) return;
        const vendorId = selectedVendorId;
        setShowApproveConfirm(false);
        const loadingToast = toast.showLoading("Approving vendor...");
        try {
            setActionLoading(vendorId);
            const response = await approveVendor(vendorId);
            
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Vendor approved successfully!");
                await loadPendingVendors();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to approve vendor");
            }
        } catch (err) {
            console.error("Approve vendor error:", err);
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to approve vendor. Please try again.");
        } finally {
            setActionLoading(null);
            setSelectedVendorId(null);
        }
    };

    const handleReject = (vendorId) => {
        setSelectedVendorId(vendorId);
        setRejectionReason("");
        setShowRejectInput(true);
    };

    const handleRejectionReasonSubmit = (reason) => {
        setRejectionReason(reason);
        setShowRejectInput(false);
        setShowRejectConfirm(true);
    };

    const handleRejectConfirm = async () => {
        if (!selectedVendorId || !rejectionReason) return;
        const vendorId = selectedVendorId;
        setShowRejectConfirm(false);
        const loadingToast = toast.showLoading("Rejecting vendor...");
        try {
            setActionLoading(vendorId);
            const response = await rejectVendor(vendorId, rejectionReason);
            
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Vendor rejected successfully!");
                setRejectionReason("");
                await loadPendingVendors();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to reject vendor");
            }
        } catch (err) {
            console.error("Reject vendor error:", err);
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to reject vendor. Please try again.");
        } finally {
            setActionLoading(null);
            setSelectedVendorId(null);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A84FF] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading pending vendors...</p>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className="min-h-[calc(100vh-5rem)]">

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    Pending Vendor Approvals
                </h1>
                <p className="text-[#4A4A4A] text-sm">
                    Review and approve vendor registration requests
                </p>
                <p className="text-sm font-semibold text-yellow-600 mt-2">
                    {pagination.totalVendors} vendor(s) waiting for approval
                </p>
            </div>

            {/* Vendors List */}
            <div className="space-y-4">
                {vendors.length === 0 ? (
                    <div className="bg-white rounded-[12px] p-8 text-center shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <IoCheckmarkCircleOutline className="text-5xl text-green-500 mx-auto mb-4" />
                        <p className="text-[#4A4A4A] text-sm font-semibold mb-2">
                            No pending vendors
                        </p>
                        <p className="text-xs text-gray-500">
                            All vendor registrations have been processed
                        </p>
                    </div>
                ) : (
                    vendors.map((vendor) => (
                        <div
                            key={vendor._id}
                            className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all border-l-4 border-yellow-500"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-800">
                                            {vendor.name}
                                        </h3>
                                        <span className="px-2 py-1 rounded-[6px] text-xs font-semibold bg-yellow-100 text-yellow-700 flex items-center gap-1">
                                            <IoTimeOutline className="text-sm" />
                                            Pending Approval
                                        </span>
                                    </div>
                                    <p className="text-sm text-[#4A4A4A] mb-1">
                                        {vendor.email}
                                    </p>
                                    <p className="text-sm text-[#4A4A4A] mb-1">
                                        {vendor.phone}
                                    </p>
                                    <p className="text-xs text-[#4A4A4A]">
                                        Registered: {formatDate(vendor.createdAt)}
                                    </p>
                                    {vendor.address && (
                                        <p className="text-xs text-[#4A4A4A] mt-1">
                                            {vendor.address.city}, {vendor.address.state} - {vendor.address.pincode}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => navigate(`/admin/vendors/${vendor._id}`)}
                                    className="px-3 py-2 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors flex items-center gap-2"
                                >
                                    <IoEyeOutline className="text-base" />
                                    View Details
                                </button>
                                
                                <button
                                    onClick={() => handleApprove(vendor._id)}
                                    disabled={actionLoading === vendor._id}
                                    className="px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-[8px] hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <IoCheckmarkCircleOutline className="text-base" />
                                    {actionLoading === vendor._id ? "Processing..." : "Approve"}
                                </button>
                                
                                <button
                                    onClick={() => handleReject(vendor._id)}
                                    disabled={actionLoading === vendor._id}
                                    className="px-3 py-2 bg-red-600 text-white text-sm font-semibold rounded-[8px] hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <IoCloseCircleOutline className="text-base" />
                                    {actionLoading === vendor._id ? "Processing..." : "Reject"}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 bg-white border border-[#D9DDE4] rounded-[8px] text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-600">
                        Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={page >= pagination.totalPages}
                        className="px-4 py-2 bg-white border border-[#D9DDE4] rounded-[8px] text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>

        {/* Approve Vendor Confirmation Modal */}
        <ConfirmModal
            isOpen={showApproveConfirm}
            onClose={() => {
                setShowApproveConfirm(false);
                setSelectedVendorId(null);
            }}
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
                setSelectedVendorId(null);
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
                setSelectedVendorId(null);
                setRejectionReason("");
            }}
            onConfirm={handleRejectConfirm}
            title="Confirm Rejection"
            message="Are you sure you want to reject this vendor?"
            confirmText="Yes, Reject"
            cancelText="Cancel"
            confirmColor="danger"
        />
    </>);
}

