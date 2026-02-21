import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoSearchOutline,
    IoFilterOutline,
    IoBusinessOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoBanOutline,
    IoCheckmarkOutline,
    IoEyeOutline,
    IoMailOutline,
    IoCallOutline,
    IoLocationOutline,
    IoTimeOutline,
    IoArrowForwardOutline,
    IoEllipsisVerticalOutline
} from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { getAllVendors, approveVendor, rejectVendor, deactivateVendor, activateVendor } from "../../../services/adminApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";
import LoadingSpinner from "../../shared/components/LoadingSpinner";

export default function AdminVendors() {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
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
    const toast = useToast();

    useEffect(() => {
        loadVendors();
    }, [filters.page, filters.isApproved, filters.isActive, filters.search]);

    const loadVendors = async () => {
        try {
            setLoading(true);
            const params = {
                page: filters.page,
                limit: filters.limit,
                search: filters.search,
                isApproved: filters.isApproved,
                isActive: filters.isActive
            };
            const response = await getAllVendors(params);
            if (response.success) {
                setVendors(response.data.vendors || []);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            console.error("Load vendors error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveConfirm = async () => {
        setShowApproveConfirm(false);
        const loadingToast = toast.showLoading("Approving vendor...");
        try {
            const response = await approveVendor(selectedVendorId);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Vendor approved successfully!");
                await loadVendors();
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to approve vendor");
        } finally {
            setSelectedVendorId(null);
        }
    };

    const handleRejectConfirm = async () => {
        setShowRejectConfirm(false);
        const loadingToast = toast.showLoading("Rejecting vendor...");
        try {
            const response = await rejectVendor(selectedVendorId, rejectionReason);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Vendor rejected successfully!");
                await loadVendors();
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to reject vendor");
        } finally {
            setSelectedVendorId(null);
            setRejectionReason("");
        }
    };

    const handleDeactivateConfirm = async () => {
        setShowDeactivateConfirm(false);
        const loadingToast = toast.showLoading("Deactivating...");
        try {
            const response = await deactivateVendor(selectedVendorId);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Vendor deactivated");
                await loadVendors();
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to deactivate");
        } finally {
            setSelectedVendorId(null);
        }
    };

    const handleActivateConfirm = async () => {
        setShowActivateConfirm(false);
        const loadingToast = toast.showLoading("Activating...");
        try {
            const response = await activateVendor(selectedVendorId);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Vendor activated");
                await loadVendors();
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to activate");
        } finally {
            setSelectedVendorId(null);
        }
    };

    return (
        <div className="space-y-6 p-6 pb-20 lg:pb-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-outfit">Vendor Management</h1>
                    <p className="text-gray-500 text-sm">Review, approve, and manage service providers</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Business name, email..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                            className="pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 outline-none w-full md:w-64 text-sm transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Partner Base", value: pagination.totalVendors || 0, icon: IoBusinessOutline, color: "blue" },
                    { label: "In Review", value: vendors.filter(v => !v.isApproved && !v.rejectionReason).length, icon: IoTimeOutline, color: "orange" },
                    { label: "Approved", value: vendors.filter(v => v.isApproved).length, icon: IoCheckmarkCircleOutline, color: "green" },
                    { label: "Status Range", value: "Verified", icon: IoCheckmarkOutline, color: "purple" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600`}>
                            <stat.icon className="text-xl" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                <select
                    value={filters.isApproved}
                    onChange={(e) => setFilters({ ...filters, isApproved: e.target.value, page: 1 })}
                    className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 outline-none focus:border-blue-500"
                >
                    <option value="">All Verification</option>
                    <option value="true">Approved</option>
                    <option value="false">Pending</option>
                </select>
                <select
                    value={filters.isActive}
                    onChange={(e) => setFilters({ ...filters, isActive: e.target.value, page: 1 })}
                    className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 outline-none focus:border-blue-500"
                >
                    <option value="">All Access</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
            </div>

            {/* Vendor Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="col-span-full py-20 flex justify-center"><LoadingSpinner /></div>
                    ) : vendors.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-100">
                            <IoBusinessOutline className="text-4xl text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-500">No vendors matching your search</p>
                        </div>
                    ) : (
                        vendors.map((vendor, i) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2, delay: i * 0.05 }}
                                key={vendor._id}
                                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all group flex flex-col"
                            >
                                <div className="p-6 flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold font-outfit shadow-lg shadow-blue-500/20">
                                            {vendor.profilePicture ? (
                                                <img src={vendor.profilePicture} className="w-full h-full rounded-2xl object-cover" />
                                            ) : (
                                                vendor.businessName?.charAt(0) || vendor.name?.charAt(0)
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${vendor.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {vendor.isApproved ? 'VERIFIED' : 'PENDING'}
                                            </span>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${vendor.isActive ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                {vendor.isActive ? 'ACTIVE' : 'BLOCKED'}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                                        {vendor.businessName || vendor.name}
                                    </h3>
                                    <p className="text-xs text-gray-400 font-medium mb-4">Partnered since {new Date(vendor.createdAt).toLocaleDateString()}</p>

                                    <div className="space-y-3 py-4 border-t border-gray-50">
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <IoMailOutline className="text-blue-500 shrink-0" />
                                            <span className="truncate">{vendor.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <IoCallOutline className="text-blue-500 shrink-0" />
                                            <span>{vendor.phone}</span>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm text-gray-600">
                                            <IoLocationOutline className="text-blue-500 shrink-0 mt-0.5" />
                                            <span className="line-clamp-1">{vendor.address || 'Address unlisted'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50/50 flex items-center justify-between gap-2 border-t border-gray-100">
                                    <button
                                        onClick={() => navigate(`/admin/vendors/${vendor._id}`)}
                                        className="flex-1 py-2 bg-white text-gray-700 text-xs font-bold rounded-xl border border-gray-200 hover:border-blue-200 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        <IoEyeOutline /> View Profile
                                    </button>
                                    {!vendor.isApproved && !vendor.rejectionReason && (
                                        <button
                                            onClick={() => { setSelectedVendorId(vendor._id); setShowApproveConfirm(true); }}
                                            className="w-10 h-10 bg-green-600 text-white rounded-xl shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all flex items-center justify-center"
                                        >
                                            <IoCheckmarkOutline className="text-lg" />
                                        </button>
                                    )}
                                    {vendor.isActive ? (
                                        <button
                                            onClick={() => { setSelectedVendorId(vendor._id); setShowDeactivateConfirm(true); }}
                                            className="w-10 h-10 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center border border-red-100"
                                        >
                                            <IoBanOutline className="text-lg" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => { setSelectedVendorId(vendor._id); setShowActivateConfirm(true); }}
                                            className="w-10 h-10 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all flex items-center justify-center border border-green-100"
                                        >
                                            <IoCheckmarkOutline className="text-lg" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-6">
                    <button
                        disabled={filters.page === 1}
                        onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                        className="p-2 bg-white border border-gray-100 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <IoChevronForwardOutline className="rotate-180" />
                    </button>
                    <span className="text-sm font-bold text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                        {pagination.currentPage} / {pagination.totalPages}
                    </span>
                    <button
                        disabled={filters.page === pagination.totalPages}
                        onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                        className="p-2 bg-white border border-gray-100 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <IoChevronForwardOutline />
                    </button>
                </div>
            )}

            <ConfirmModal
                isOpen={showApproveConfirm}
                onClose={() => setShowApproveConfirm(false)}
                onConfirm={handleApproveConfirm}
                title="Approve Business Partner"
                message="This will grant the vendor full access to accept bookings and manage their services. Proceed?"
                confirmText="Yes, Approve"
                confirmColor="primary"
            />

            <ConfirmModal
                isOpen={showDeactivateConfirm}
                onClose={() => setShowDeactivateConfirm(false)}
                onConfirm={handleDeactivateConfirm}
                title="Suspend Vendor Account"
                message="This will prevent the vendor from appearing in searches or accepting new jobs. Continue?"
                confirmText="Yes, Suspend"
                confirmColor="warning"
            />

            <ConfirmModal
                isOpen={showActivateConfirm}
                onClose={() => setShowActivateConfirm(false)}
                onConfirm={handleActivateConfirm}
                title="Restore Vendor Access"
                message="This will allow the vendor to resume normal business operations. Continue?"
                confirmText="Yes, Restore"
                confirmColor="primary"
            />
        </div>
    );
}
