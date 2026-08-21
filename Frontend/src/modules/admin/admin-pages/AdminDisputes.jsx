import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoAlertCircleOutline,
    IoSearchOutline,
    IoEyeOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoTimeOutline,
    IoPersonOutline,
    IoDocumentTextOutline,
    IoCloseOutline,
    IoChatbubbleOutline,
    IoArrowForwardOutline,
    IoSwapHorizontalOutline
} from "react-icons/io5";
import {
    getAllDisputes,
    getDisputeStatistics,
    getDisputeDetails,
    updateDisputeStatus,
    assignDispute,
    addDisputeComment,
    getAllAdmins
} from "../../../services/adminApi";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import { getPublicSettings } from "../../../services/settingsApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";
import AssignmentHistoryModal from "../admin-component/AssignmentHistoryModal";

const DEFAULT_DISPUTE_TYPES = [
    "Expert did not arrive",
    "Expert arrived late",
    "Survey not completed",
    "Incorrect survey location",
    "Payment issue",
    "Refund issue",
    "Travel charges issue",
    "Survey report issue",
    "Expert behaviour",
    "Requested offline payment",
    "Safety concern",
    "Other"
];

export default function AdminDisputes() {
    const navigate = useNavigate();
    const { admin: currentAdmin } = useAdminAuth();
    const toast = useToast();
    const [disputes, setDisputes] = useState([]);
    const [disputeTypes, setDisputeTypes] = useState(DEFAULT_DISPUTE_TYPES);
    const [availableSupportAdmins, setAvailableSupportAdmins] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        type: "",
        page: 1,
        limit: 20,
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalDisputes: 0,
    });
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [statusUpdate, setStatusUpdate] = useState({ status: "", notes: "" });
    const [actionLoading, setActionLoading] = useState(false);

    const isSuperAdmin = currentAdmin?.role === "SUPER_ADMIN";

    useEffect(() => {
        loadDisputes();
        loadStatistics();
        loadDisputeTypes();
        loadAvailableSupportAdmins();
    }, [filters.page, filters.search, filters.status, filters.type]);

    const loadAvailableSupportAdmins = async () => {
        try {
            const res = await getAllAdmins();
            if (res.success && res.data?.admins) {
                const supportAdmins = res.data.admins.filter(a =>
                    a.isActive && ['SUPPORT_ADMIN', 'CUSTOMER_SUPPORT_ADMIN', 'SUPER_ADMIN'].includes(a.role)
                );
                setAvailableSupportAdmins(supportAdmins);
            }
        } catch (err) {
            console.error("Failed to load support admins:", err);
        }
    };

    const loadDisputeTypes = async () => {
        try {
            const res = await getPublicSettings({ category: "general" });
            if (res.success && res.data?.settings) {
                const setting = res.data.settings.find(s => s.key === "DISPUTE_TYPES");
                if (setting && Array.isArray(setting.value) && setting.value.length > 0) {
                    setDisputeTypes(setting.value);
                }
            }
        } catch (err) {
            console.error("Failed to load dispute types setting:", err);
        }
    };

    const loadDisputes = async () => {
        try {
            setLoading(true);
            const params = {
                page: filters.page,
                limit: filters.limit,
            };
            if (filters.search) params.search = filters.search;
            if (filters.status) params.status = filters.status;
            if (filters.type) params.type = filters.type;

            const response = await getAllDisputes(params);
            if (response.success) {
                setDisputes(response.data.disputes || []);
                setPagination(response.data.pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalDisputes: 0,
                });
            } else {
                toast.showError(response.message || "Failed to load disputes");
            }
        } catch (err) {
            handleApiError(err, "Failed to load disputes");
        } finally {
            setLoading(false);
        }
    };

    const loadStatistics = async () => {
        try {
            setStatsLoading(true);
            const response = await getDisputeStatistics();
            if (response.success) {
                setStatistics(response.data);
            }
        } catch (err) {
            console.error("Failed to load statistics:", err);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleViewDetails = async (disputeId) => {
        try {
            const response = await getDisputeDetails(disputeId);
            if (response.success) {
                setSelectedDispute(response.data.dispute);
                setShowDetailsModal(true);
            } else {
                toast.showError("Failed to load dispute details");
            }
        } catch (err) {
            handleApiError(err, "Failed to load dispute details");
        }
    };

    const handleStatusUpdate = async () => {
        if (!statusUpdate.status) {
            toast.showError("Please select a status");
            return;
        }

        try {
            setActionLoading(true);
            const response = await updateDisputeStatus(selectedDispute._id, statusUpdate);
            if (response.success) {
                toast.showSuccess("Dispute status updated successfully");
                setShowStatusModal(false);
                setStatusUpdate({ status: "", notes: "" });
                await loadDisputes();
                await loadStatistics();
                if (showDetailsModal) {
                    await handleViewDetails(selectedDispute._id);
                }
            } else {
                toast.showError(response.message || "Failed to update dispute status");
            }
        } catch (err) {
            handleApiError(err, "Failed to update dispute status");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) {
            toast.showError("Please enter a comment");
            return;
        }

        try {
            setActionLoading(true);
            const response = await addDisputeComment(selectedDispute._id, { comment: newComment });
            if (response.success) {
                toast.showSuccess("Comment added successfully");
                setShowCommentModal(false);
                setNewComment("");
                if (showDetailsModal) {
                    await handleViewDetails(selectedDispute._id);
                }
            } else {
                toast.showError(response.message || "Failed to add comment");
            }
        } catch (err) {
            handleApiError(err, "Failed to add comment");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReassignDispute = async (newAdminId, reason, notesText) => {
        if (!selectedDispute) return;
        try {
            const res = await assignDispute(selectedDispute._id, {
                assignedTo: newAdminId,
                reason,
                notes: notesText
            });
            if (res.success) {
                toast.showSuccess("Dispute reassigned successfully!");
                setShowAssignmentModal(false);
                setSelectedDispute(null);
                await loadDisputes();
                await loadStatistics();
            } else {
                toast.showError(res.message || "Failed to reassign dispute");
            }
        } catch (err) {
            handleApiError(err, "Reassignment failed");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            PENDING: "bg-yellow-100 text-yellow-700",
            IN_PROGRESS: "bg-blue-100 text-blue-700",
            RESOLVED: "bg-green-100 text-green-700",
            REJECTED: "bg-red-100 text-red-700",
            CLOSED: "bg-gray-100 text-gray-700",
        };
        return colors[status] || "bg-gray-100 text-gray-700";
    };

    const getPriorityColor = (priority) => {
        const colors = {
            LOW: "bg-gray-100 text-gray-700",
            MEDIUM: "bg-yellow-100 text-yellow-700",
            HIGH: "bg-orange-100 text-orange-700",
            URGENT: "bg-red-100 text-red-700",
        };
        return colors[priority] || "bg-gray-100 text-gray-700";
    };

    const getTypeLabel = (type) => {
        const labels = {
            PAYMENT_ISSUE: "Payment Issue",
            SERVICE_QUALITY: "Service Quality",
            VENDOR_BEHAVIOR: "Expert Behavior",
            REPORT_ISSUE: "Report Issue",
            CANCELLATION: "Cancellation",
            REFUND: "Refund",
            OTHER: "Other",
        };
        return labels[type] || type;
    };

    return (
        <div className="space-y-6 w-full max-w-full overflow-hidden">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Disputes & Complaints</h1>
                <p className="text-sm text-gray-500 mt-1">Manage all user and expert partner disputes and resolutions.</p>
            </div>

            {/* Statistics Cards */}
            {!statsLoading && statistics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase">Total Disputes</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{statistics.totalDisputes || 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs font-bold text-amber-600 uppercase">Open / Pending</p>
                        <p className="text-2xl font-black text-amber-600 mt-1">{statistics.pendingDisputes || 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs font-bold text-blue-600 uppercase">Under Review</p>
                        <p className="text-2xl font-black text-blue-600 mt-1">{statistics.inProgressDisputes || 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs font-bold text-emerald-600 uppercase">Resolved</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1">{statistics.resolvedDisputes || 0}</p>
                    </div>
                </div>
            )}

            {/* Dispute Resolution Quick Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                    { id: 'all', label: 'All Disputes', status: '' },
                    { id: 'pending', label: 'Open / Pending', status: 'PENDING' },
                    { id: 'in_progress', label: 'Under Review', status: 'IN_PROGRESS' },
                    { id: 'resolved', label: 'Resolved', status: 'RESOLVED' },
                    { id: 'rejected', label: 'Rejected', status: 'REJECTED' },
                    { id: 'refund', label: 'Refund / Compensation', status: 'CLOSED' },
                ].map((tab) => {
                    const isSelected = filters.status === tab.status;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setFilters({ ...filters, status: tab.status, page: 1 })}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                isSelected
                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative md:col-span-2">
                        <IoSearchOutline className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                            type="text"
                            placeholder="Search by dispute ID, user, vendor, or description..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">All Dispute Types</option>
                        {disputeTypes.map((typeOption, idx) => (
                            <option key={idx} value={typeOption}>
                                {typeOption}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => setFilters({ search: "", status: "", type: "", page: 1 })}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <LoadingSpinner message="Loading disputes..." />
            ) : disputes.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
                    <IoAlertCircleOutline className="mx-auto text-5xl text-gray-300 mb-3" />
                    <h3 className="text-base font-bold text-gray-900 mb-1">No Disputes Found</h3>
                    <p className="text-xs text-gray-400">No disputes match your current filter settings</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto max-w-full">
                        <table className="w-full min-w-[850px] text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="px-5 py-3">Dispute ID</th>
                                    <th className="px-5 py-3">Raised By</th>
                                    <th className="px-5 py-3">Type</th>
                                    <th className="px-5 py-3 min-w-[180px]">Subject</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Assigned Agent</th>
                                    <th className="px-5 py-3">Date</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs">
                                {disputes.map((dispute) => (
                                    <tr key={dispute._id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-5 py-3.5 font-bold font-mono text-gray-900">
                                            #{dispute._id.toString().slice(-8).toUpperCase()}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="font-bold text-gray-900">{dispute.raisedBy?.name || "N/A"}</div>
                                            <div className="text-[11px] text-gray-400">{dispute.raisedByModel}</div>
                                        </td>
                                        <td className="px-5 py-3.5 font-medium text-gray-700 whitespace-nowrap">
                                            {getTypeLabel(dispute.type)}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="text-gray-900 max-w-[200px] truncate" title={dispute.subject}>{dispute.subject}</div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(dispute.status)}`}>
                                                {dispute.status}
                                            </span>
                                        </td>
                                        {/* Assigned Support Agent Chip */}
                                        <td className="px-5 py-3.5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedDispute(dispute);
                                                    setShowAssignmentModal(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 transition-colors cursor-pointer"
                                            >
                                                <IoPersonOutline className="text-xs" />
                                                {dispute.assignedTo?.name || "Auto-Assigned"}
                                                {isSuperAdmin && <IoSwapHorizontalOutline className="text-xs ml-1 text-amber-500" />}
                                            </button>
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                                            {formatDate(dispute.createdAt)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <button
                                                onClick={() => handleViewDetails(dispute._id)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                                title="View Details"
                                            >
                                                <IoEyeOutline className="text-base" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="bg-gray-50/60 px-6 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <div>
                                Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{" "}
                                {Math.min(pagination.currentPage * filters.limit, pagination.totalDisputes)} of{" "}
                                {pagination.totalDisputes} disputes
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                    disabled={filters.page === 1}
                                    className="px-3 py-1.5 font-bold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                    disabled={filters.page >= pagination.totalPages}
                                    className="px-3 py-1.5 font-bold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Dispute Details Modal */}
            {showDetailsModal && selectedDispute && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Dispute #{selectedDispute._id?.toString().slice(-8).toUpperCase()}
                                </h2>
                                <p className="text-xs text-gray-400">Created on {formatDate(selectedDispute.createdAt)}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setSelectedDispute(null);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                            >
                                <IoCloseOutline className="text-2xl" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Status</h3>
                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(selectedDispute.status)}`}>
                                        {selectedDispute.status}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Assigned Agent</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowAssignmentModal(true)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 transition-colors cursor-pointer"
                                    >
                                        <IoPersonOutline className="text-xs" />
                                        {selectedDispute.assignedTo?.name || "Auto-Assigned"}
                                        {isSuperAdmin && <IoSwapHorizontalOutline className="text-xs ml-1 text-amber-500" />}
                                    </button>
                                </div>
                                {selectedDispute.priority && (
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Priority</h3>
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${getPriorityColor(selectedDispute.priority)}`}>
                                            {selectedDispute.priority}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Subject</h3>
                                <p className="text-sm font-semibold text-gray-900">{selectedDispute.subject}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Description</h3>
                                <p className="text-xs text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed">{selectedDispute.description}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Raised By</h3>
                                <p className="text-xs font-semibold text-gray-900">{selectedDispute.raisedBy?.name} ({selectedDispute.raisedByModel})</p>
                                <p className="text-xs text-gray-400">{selectedDispute.raisedBy?.email}</p>
                            </div>
                            {selectedDispute.booking && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Related Booking</h3>
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            navigate(`/admin/bookings/${selectedDispute.booking._id}`);
                                        }}
                                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        View Booking #{selectedDispute.booking._id.toString().slice(-8).toUpperCase()}
                                        <IoArrowForwardOutline />
                                    </button>
                                </div>
                            )}
                            {selectedDispute.comments && selectedDispute.comments.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Comments ({selectedDispute.comments.length})</h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {selectedDispute.comments.map((comment, index) => (
                                            <div key={index} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-gray-900">
                                                        {comment.commentedBy?.name || "Admin"}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">{formatDate(comment.createdAt)}</span>
                                                </div>
                                                <p className="text-xs text-gray-600">{comment.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {selectedDispute.resolution && (
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                    <h3 className="text-xs font-bold text-emerald-800 uppercase mb-1">Resolution</h3>
                                    <p className="text-xs text-emerald-900 mb-1">{selectedDispute.resolution.notes}</p>
                                    <p className="text-[10px] text-emerald-600">
                                        Resolved by {selectedDispute.resolution.resolvedBy?.name} on {formatDate(selectedDispute.resolution.resolvedAt)}
                                    </p>
                                </div>
                            )}
                            <div className="flex gap-2 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => {
                                        setStatusUpdate({ status: selectedDispute.status, notes: "" });
                                        setShowStatusModal(true);
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer"
                                >
                                    Update Status
                                </button>
                                <button
                                    onClick={() => setShowCommentModal(true)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                    <IoChatbubbleOutline className="text-sm" />
                                    Add Comment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-gray-100">
                        <h3 className="text-base font-bold text-gray-900">Update Dispute Status</h3>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Status</label>
                            <select
                                value={statusUpdate.status}
                                onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="PENDING">PENDING</option>
                                <option value="IN_PROGRESS">IN PROGRESS</option>
                                <option value="RESOLVED">RESOLVED</option>
                                <option value="REJECTED">REJECTED</option>
                                <option value="CLOSED">CLOSED</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Resolution Notes</label>
                            <textarea
                                value={statusUpdate.notes}
                                onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                                placeholder="Explain reason or resolution taken..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStatusUpdate}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                            >
                                {actionLoading ? "Saving..." : "Save Update"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Comment Modal */}
            {showCommentModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-gray-100">
                        <h3 className="text-base font-bold text-gray-900">Add Dispute Comment</h3>
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Type internal comment or communication..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <div className="flex gap-2 justify-end pt-2">
                            <button
                                onClick={() => setShowCommentModal(false)}
                                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddComment}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                            >
                                {actionLoading ? "Adding..." : "Post Comment"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Universal Assignment History Modal */}
            <AssignmentHistoryModal
                isOpen={showAssignmentModal}
                onClose={() => {
                    setShowAssignmentModal(false);
                    setSelectedDispute(null);
                }}
                entityTitle={`Dispute #${selectedDispute?._id?.toString().slice(-8).toUpperCase()}`}
                assignedTo={selectedDispute?.assignedTo}
                assignmentHistory={selectedDispute?.assignmentHistory || []}
                availableAdmins={availableSupportAdmins}
                onReassign={handleReassignDispute}
                isSuperAdmin={isSuperAdmin}
            />
        </div>
    );
}
