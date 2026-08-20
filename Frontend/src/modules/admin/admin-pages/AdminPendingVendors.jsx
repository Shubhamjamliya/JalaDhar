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
    IoBusinessOutline,
    IoPersonOutline,
    IoSwapHorizontalOutline
} from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { getPendingVendors, approveVendor, rejectVendor, assignVendorKYCApi, getAllAdmins } from "../../../services/adminApi";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import AssignmentHistoryModal from "../admin-component/AssignmentHistoryModal";

export default function AdminPendingVendors() {
    const navigate = useNavigate();
    const { admin: currentAdmin } = useAdminAuth();
    const [vendors, setVendors] = useState([]);
    const [availableAdmins, setAvailableAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const toast = useToast();
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [selectedVendorId, setSelectedVendorId] = useState(null);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalVendors: 0
    });
    const [page, setPage] = useState(1);

    const isSuperAdmin = currentAdmin?.role === "SUPER_ADMIN";

    useEffect(() => {
        loadPendingVendors();
        loadAvailableAdmins();
    }, [page]);

    const loadAvailableAdmins = async () => {
        try {
            const res = await getAllAdmins();
            if (res.success && res.data?.admins) {
                const verifiers = res.data.admins.filter(a =>
                    a.isActive &&
                    ['EXPERT_VERIFICATION_ADMIN', 'VERIFIER_ADMIN', 'SUPER_ADMIN'].includes(a.role)
                );
                setAvailableAdmins(verifiers);
            }
        } catch (err) {
            console.error("Failed to load verifier admins:", err);
        }
    };

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
                toast.showSuccess("Expert approved successfully!");
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
        setShowRejectInput(false);
        const loadingToast = toast.showLoading("Rejecting...");
        try {
            setActionLoading(selectedVendorId);
            const response = await rejectVendor(selectedVendorId, rejectionReason);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Expert application rejected");
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

    const handleReassignKYC = async (newAdminId, reason, notes) => {
        if (!selectedVendor) return;
        try {
            const res = await assignVendorKYCApi(selectedVendor._id, {
                assignedTo: newAdminId,
                reason,
                notes
            });
            if (res.success) {
                toast.showSuccess("KYC request reassigned successfully!");
                setShowAssignmentModal(false);
                setSelectedVendor(null);
                await loadPendingVendors();
            } else {
                toast.showError(res.message || "Failed to reassign KYC");
            }
        } catch (err) {
            handleApiError(err, "Reassignment failed");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Expert KYC Approvals</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Review, assign, and verify partner onboarding applications & certifications.
                </p>
            </div>

            {/* List View */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <LoadingSpinner message="Fetching pending expert applications..." />
                    ) : vendors.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm"
                        >
                            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                                <IoAlertCircleOutline />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
                            <p className="text-gray-500 text-sm">No pending expert applications at the moment.</p>
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

                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {vendor.businessName || vendor.name}
                                        </h3>
                                        <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-black tracking-widest uppercase">
                                            Needs Review
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <IoMailOutline className="text-blue-500 text-sm" />
                                            {vendor.email}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <IoCallOutline className="text-blue-500 text-sm" />
                                            {vendor.phone}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <IoTimeOutline className="text-sm" />
                                            Applied {new Date(vendor.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {/* Assigned Verifier Badge */}
                                    <div className="pt-1 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedVendor(vendor);
                                                setShowAssignmentModal(true);
                                            }}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
                                            title="Click to view assignment history or reassign"
                                        >
                                            <IoPersonOutline className="text-xs" />
                                            Assigned: {vendor.assignedTo?.name || "Auto-Assigned"}
                                            {isSuperAdmin && <IoSwapHorizontalOutline className="text-xs ml-1 text-blue-500" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => navigate(`/admin/vendors/${vendor._id}`)}
                                        className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                                        title="View Details"
                                    >
                                        <IoEyeOutline className="text-xl" />
                                    </button>
                                    <button
                                        onClick={() => { setSelectedVendorId(vendor._id); setShowApproveConfirm(true); }}
                                        className="px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2 cursor-pointer"
                                    >
                                        <IoCheckmarkCircleOutline className="text-lg" />
                                        Approve &amp; Send Agreement
                                    </button>
                                    <button
                                        onClick={() => { setSelectedVendorId(vendor._id); setShowRejectInput(true); }}
                                        className="px-4 py-2.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 border border-red-100 cursor-pointer"
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
                        className="p-2 bg-white border border-gray-100 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
                    >
                        <IoChevronForwardOutline className="rotate-180" />
                    </button>
                    <span className="text-sm font-bold text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                        {page} / {pagination.totalPages}
                    </span>
                    <button
                        disabled={page === pagination.totalPages}
                        onClick={() => setPage(page + 1)}
                        className="p-2 bg-white border border-gray-100 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
                    >
                        <IoChevronForwardOutline />
                    </button>
                </div>
            )}

            {/* Confirm Approval Modal */}
            <ConfirmModal
                isOpen={showApproveConfirm}
                onClose={() => setShowApproveConfirm(false)}
                onConfirm={handleApproveConfirm}
                title="Approve Expert Application"
                message="Are you sure you want to approve this expert's documents? They will receive an invitation to accept the digital agreement."
            />

            {/* Reject Input Modal */}
            <InputModal
                isOpen={showRejectInput}
                onClose={() => setShowRejectInput(false)}
                onSubmit={(reason) => {
                    setRejectionReason(reason);
                    handleRejectConfirm();
                }}
                title="Reject Expert Application"
                message="Please provide a clear reason for rejecting this application. This will be sent to the applicant."
                placeholder="e.g., Incomplete Aadhaar document, invalid certificates..."
            />

            {/* Assignment Audit History Modal */}
            <AssignmentHistoryModal
                isOpen={showAssignmentModal}
                onClose={() => {
                    setShowAssignmentModal(false);
                    setSelectedVendor(null);
                }}
                entityTitle={`Expert KYC: ${selectedVendor?.name || ""}`}
                assignedTo={selectedVendor?.assignedTo}
                assignmentHistory={selectedVendor?.assignmentHistory || []}
                availableAdmins={availableAdmins}
                onReassign={handleReassignKYC}
                isSuperAdmin={isSuperAdmin}
            />
        </div>
    );
}
