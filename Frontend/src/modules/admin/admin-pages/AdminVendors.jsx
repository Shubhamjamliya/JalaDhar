import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoSearchOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoBanOutline,
    IoCheckmarkOutline,
    IoEyeOutline,
} from "react-icons/io5";
import { getAllVendors, approveVendor, rejectVendor, deactivateVendor, activateVendor } from "../../../services/adminApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";
import ErrorMessage from "../../shared/components/ErrorMessage";

export default function AdminVendors() {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(null);
    const toast = useToast();
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
    const [showActivateConfirm, setShowActivateConfirm] = useState(false);
    const [selectedVendorId, setSelectedVendorId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [filters, setFilters] = useState({
        search: "",
        isApproved: "",
        isActive: "",
        page: 1,
        limit: 10
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalVendors: 0
    });

    useEffect(() => {
        loadVendors();
    }, [filters.page, filters.isApproved, filters.isActive, filters.search]);

    const loadVendors = async () => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page: filters.page,
                limit: filters.limit,
            };

            if (filters.search) params.search = filters.search;
            if (filters.isApproved !== "") params.isApproved = filters.isApproved;
            if (filters.isActive !== "") params.isActive = filters.isActive;

            const response = await getAllVendors(params);

            if (response.success) {
                setVendors(response.data.vendors || []);
                setPagination(response.data.pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalVendors: 0
                });
            } else {
                setError("Failed to load vendors");
            }
        } catch (err) {
            console.error("Load vendors error:", err);
            setError("Failed to load vendors");
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
                await loadVendors();
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
                await loadVendors();
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

    const handleDeactivate = (vendorId) => {
        setSelectedVendorId(vendorId);
        setShowDeactivateConfirm(true);
    };

    const handleDeactivateConfirm = async () => {
        if (!selectedVendorId) return;
        const vendorId = selectedVendorId;
        setShowDeactivateConfirm(false);
        const loadingToast = toast.showLoading("Deactivating vendor...");
        try {
            setActionLoading(vendorId);
            const response = await deactivateVendor(vendorId);

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Vendor deactivated successfully!");
                await loadVendors();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to deactivate vendor");
            }
        } catch (err) {
            console.error("Deactivate vendor error:", err);
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to deactivate vendor. Please try again.");
        } finally {
            setActionLoading(null);
            setSelectedVendorId(null);
        }
    };

    const handleActivate = (vendorId) => {
        setSelectedVendorId(vendorId);
        setShowActivateConfirm(true);
    };

    const handleActivateConfirm = async () => {
        if (!selectedVendorId) return;
        const vendorId = selectedVendorId;
        setShowActivateConfirm(false);
        const loadingToast = toast.showLoading("Activating vendor...");
        try {
            setActionLoading(vendorId);
            const response = await activateVendor(vendorId);

            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Vendor activated successfully!");
                await loadVendors();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to activate vendor");
            }
        } catch (err) {
            console.error("Activate vendor error:", err);
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to activate vendor. Please try again.");
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
                    <p className="text-gray-600">Loading vendors...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-[calc(100vh-5rem)]">
                {/* Error Message */}
                <ErrorMessage message={error} />

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                        All Vendors
                    </h1>
                    <p className="text-[#4A4A4A] text-sm">
                        Manage and review all vendor accounts
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-[12px] p-4 mb-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                            <input
                                type="text"
                                placeholder="Search vendors..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                                className="w-full pl-10 pr-4 py-2 border border-[#D9DDE4] rounded-[8px] text-sm focus:outline-none focus:border-[#0A84FF]"
                            />
                        </div>

                        {/* Approval Status Filter */}
                        <select
                            value={filters.isApproved}
                            onChange={(e) => setFilters({ ...filters, isApproved: e.target.value, page: 1 })}
                            className="w-full px-4 py-2 border border-[#D9DDE4] rounded-[8px] text-sm focus:outline-none focus:border-[#0A84FF]"
                        >
                            <option value="">All Approval Status</option>
                            <option value="true">Approved</option>
                            <option value="false">Pending</option>
                        </select>

                        {/* Active Status Filter */}
                        <select
                            value={filters.isActive}
                            onChange={(e) => setFilters({ ...filters, isActive: e.target.value, page: 1 })}
                            className="w-full px-4 py-2 border border-[#D9DDE4] rounded-[8px] text-sm focus:outline-none focus:border-[#0A84FF]"
                        >
                            <option value="">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>

                        {/* Clear Filters */}
                        <button
                            onClick={() => setFilters({ search: "", isApproved: "", isActive: "", page: 1, limit: 10 })}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-[8px] text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Vendors List */}
                <div className="space-y-4">
                    {vendors.length === 0 ? (
                        <div className="bg-white rounded-[12px] p-8 text-center shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                            <p className="text-[#4A4A4A] text-sm">
                                No vendors found
                            </p>
                        </div>
                    ) : (
                        vendors.map((vendor) => (
                            <div
                                key={vendor._id}
                                className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-gray-800">
                                                {vendor.name}
                                            </h3>
                                            <span
                                                className={`px-2 py-1 rounded-[6px] text-xs font-semibold ${vendor.isApproved
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                                    }`}
                                            >
                                                {vendor.isApproved ? "Approved" : "Pending"}
                                            </span>
                                            <span
                                                className={`px-2 py-1 rounded-[6px] text-xs font-semibold ${vendor.isActive
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {vendor.isActive ? "Active" : "Inactive"}
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
                                        {vendor.approvedBy && (
                                            <p className="text-xs text-[#4A4A4A] mt-1">
                                                Approved by: {vendor.approvedBy.name} on {vendor.approvedAt ? formatDate(vendor.approvedAt) : "N/A"}
                                            </p>
                                        )}
                                        {vendor.rejectionReason && (
                                            <p className="text-xs text-red-600 mt-1">
                                                Rejection Reason: {vendor.rejectionReason}
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

                                    {!vendor.isApproved && (
                                        <>
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
                                        </>
                                    )}

                                    {vendor.isActive ? (
                                        <button
                                            onClick={() => handleDeactivate(vendor._id)}
                                            disabled={actionLoading === vendor._id}
                                            className="px-3 py-2 bg-orange-600 text-white text-sm font-semibold rounded-[8px] hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <IoBanOutline className="text-base" />
                                            {actionLoading === vendor._id ? "Processing..." : "Deactivate"}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleActivate(vendor._id)}
                                            disabled={actionLoading === vendor._id}
                                            className="px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-[8px] hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <IoCheckmarkOutline className="text-base" />
                                            {actionLoading === vendor._id ? "Processing..." : "Activate"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                            disabled={filters.page === 1}
                            className="px-4 py-2 bg-white border border-[#D9DDE4] rounded-[8px] text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-sm text-gray-600">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                            disabled={filters.page >= pagination.totalPages}
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

            {/* Deactivate Vendor Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeactivateConfirm}
                onClose={() => {
                    setShowDeactivateConfirm(false);
                    setSelectedVendorId(null);
                }}
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
                onClose={() => {
                    setShowActivateConfirm(false);
                    setSelectedVendorId(null);
                }}
                onConfirm={handleActivateConfirm}
                title="Activate Vendor"
                message="Are you sure you want to activate this vendor?"
                confirmText="Yes, Activate"
                cancelText="Cancel"
                confirmColor="primary"
            />
        </>
    );
}

