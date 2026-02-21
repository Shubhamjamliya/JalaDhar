import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoEyeOutline,
    IoTimeOutline,
    IoChevronForwardOutline,
    IoAlertCircleOutline,
    IoMailOutline,
    IoCallOutline,
    IoBusinessOutline
} from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { getPendingVendors, approveVendor, rejectVendor } from "../../../services/adminApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";
import LoadingSpinner from "../../shared/components/LoadingSpinner";

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
                setPagination(response.data.pagination);
            }
        } catch (err) {
            console.error("Load pending vendors error:", err);
            handleApiError(err, "Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    const handleApproveConfirm = async () => {
        setShowApproveConfirm(false);
        const loadingToast = toast.showLoading("Approving partner...");
        try {
            setActionLoading(selectedVendorId);
            const response = await approveVendor(selectedVendorId);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Vendor approved successfully!");
                await loadPendingVendors();
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Approval failed");
        } finally {
            setActionLoading(null);
            setSelectedVendorId(null);
        }
    };

    const handleRejectConfirm = async () => {
        setShowRejectConfirm(false);
        const loadingToast = toast.showLoading("Rejecting...");
        try {
            setActionLoading(selectedVendorId);
            const response = await rejectVendor(selectedVendorId, rejectionReason);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Vendor application rejected");
                await loadPendingVendors();
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Rejection failed");
        } finally {
            setActionLoading(null);
            setSelectedVendorId(null);
            setRejectionReason("");
        }
    };

    return (
        <div className="space-y-6 p-6 pb-20 lg:pb-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-outfit">Pending Approvals</h1>
                    <p className="text-gray-500 text-sm">Review applications from potential service partners</p>
                </div>
                {pagination.totalVendors > 0 && (
                    <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-2xl border border-yellow-100 flex items-center gap-2 text-sm font-bold">
                        <IoTimeOutline className="text-lg" />
                        {pagination.totalVendors} Requests Waiting
                    </div>
                )}
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="py-20 flex justify-center"><LoadingSpinner /></div>
                    ) : vendors.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-gray-100"
                        >
                            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-500 mb-4">
                                <IoCheckmarkCircleOutline className="text-3xl" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
                            <p className="text-gray-500 text-sm">No pending vendor applications at the moment.</p>
                        </motion.div>
                    ) : (
                        vendors.map((vendor, i) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05 }}
                                key={vendor._id}
                                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all group flex flex-col md:flex-row md:items-center gap-6"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 text-2xl font-bold shrink-0">
                                    {vendor.businessName?.charAt(0) || vendor.name?.charAt(0)}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {vendor.businessName || vendor.name}
                                        </h3>
                                        <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-black tracking-widest uppercase">
                                            Needs Review
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <IoMailOutline className="text-blue-500" />
                                            {vendor.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <IoCallOutline className="text-blue-500" />
                                            {vendor.phone}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <IoTimeOutline />
                                            Applied {new Date(vendor.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => navigate(`/admin/vendors/${vendor._id}`)}
                                        className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        title="View Details"
                                    >
                                        <IoEyeOutline className="text-xl" />
                                    </button>
                                    <button
                                        onClick={() => { setSelectedVendorId(vendor._id); setShowApproveConfirm(true); }}
                                        className="px-4 py-2.5 bg-green-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all flex items-center gap-2"
                                    >
                                        <IoCheckmarkCircleOutline className="text-lg" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => { setSelectedVendorId(vendor._id); setShowRejectInput(true); }}
                                        className="px-4 py-2.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 border border-red-100"
                                    >
                                        <IoCloseCircleOutline className="text-lg" />
                                        Reject
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-6">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="p-2 bg-white border border-gray-100 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <IoChevronForwardOutline className="rotate-180" />
                    </button>
                    <span className="text-sm font-bold text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                        {page} / {pagination.totalPages}
                    </span>
                    <button
                        disabled={page === pagination.totalPages}
                        onClick={() => setPage(page + 1)}
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
                title="Confirm Business Partnership"
                message="This will approve the vendor and allow them to start serving customers on the platform. Proceed?"
                confirmText="Verify & Approve"
                confirmColor="primary"
            />

            <InputModal
                isOpen={showRejectInput}
                onClose={() => setShowRejectInput(false)}
                onSubmit={(reason) => { setRejectionReason(reason); setShowRejectInput(false); setShowRejectConfirm(true); }}
                title="Decline Application"
                message="Please state the reason why this application doesn't meet our criteria."
                placeholder="Missing documents, invalid phone number, etc."
                submitText="Continue"
                minLength={10}
                isTextarea={true}
            />

            <ConfirmModal
                isOpen={showRejectConfirm}
                onClose={() => setShowRejectConfirm(false)}
                onConfirm={handleRejectConfirm}
                title="Finalize Rejection"
                message="Are you sure you want to reject this vendor? They will be notified of the reason."
                confirmText="Yes, Reject"
                confirmColor="danger"
            />
        </div>
    );
}
