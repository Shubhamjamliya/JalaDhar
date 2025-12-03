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
} from "react-icons/io5";
import { getAllDisputes, getDisputeStatistics, getDisputeDetails, updateDisputeStatus, assignDispute, addDisputeComment } from "../../../services/adminApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";

export default function AdminDisputes() {
    const navigate = useNavigate();
    const [disputes, setDisputes] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const toast = useToast();
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        type: "",
        priority: "",
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
    const [newComment, setNewComment] = useState("");
    const [statusUpdate, setStatusUpdate] = useState({ status: "", notes: "" });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadDisputes();
        loadStatistics();
    }, [filters.page, filters.search, filters.status, filters.type, filters.priority]);

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
            if (filters.priority) params.priority = filters.priority;

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

    const handleUpdateStatus = async () => {
        if (!statusUpdate.status) {
            toast.showError("Please select a status");
            return;
        }
        setActionLoading(true);
        const loadingToast = toast.showLoading("Updating status...");
        try {
            const response = await updateDisputeStatus(selectedDispute._id, statusUpdate);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Dispute status updated successfully!");
                setShowStatusModal(false);
                setStatusUpdate({ status: "", notes: "" });
                await loadDisputes();
                if (showDetailsModal) {
                    await handleViewDetails(selectedDispute._id);
                }
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to update status");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to update status");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) {
            toast.showError("Please enter a comment");
            return;
        }
        setActionLoading(true);
        const loadingToast = toast.showLoading("Adding comment...");
        try {
            const response = await addDisputeComment(selectedDispute._id, { comment: newComment });
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Comment added successfully!");
                setShowCommentModal(false);
                setNewComment("");
                await handleViewDetails(selectedDispute._id);
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to add comment");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to add comment");
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            PENDING: "bg-yellow-100 text-yellow-700",
            IN_PROGRESS: "bg-blue-100 text-blue-700",
            RESOLVED: "bg-green-100 text-green-700",
            CLOSED: "bg-gray-100 text-gray-700",
            REJECTED: "bg-red-100 text-red-700",
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
            VENDOR_BEHAVIOR: "Vendor Behavior",
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
                <p className="text-sm text-gray-500 mt-1">Manage all user and vendor disputes</p>
            </div>

            {/* Statistics Cards */}
            {!statsLoading && statistics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-500 mb-1">Total Disputes</p>
                        <p className="text-2xl font-bold text-gray-900">{statistics.totalDisputes || 0}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-500 mb-1">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">{statistics.pendingDisputes || 0}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-500 mb-1">In Progress</p>
                        <p className="text-2xl font-bold text-blue-600">{statistics.inProgressDisputes || 0}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-500 mb-1">Resolved</p>
                        <p className="text-2xl font-bold text-green-600">{statistics.resolvedDisputes || 0}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="relative">
                        <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                        <input
                            type="text"
                            placeholder="Search disputes..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                        />
                    </div>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                    >
                        <option value="">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                    >
                        <option value="">All Types</option>
                        <option value="PAYMENT_ISSUE">Payment Issue</option>
                        <option value="SERVICE_QUALITY">Service Quality</option>
                        <option value="VENDOR_BEHAVIOR">Vendor Behavior</option>
                        <option value="REPORT_ISSUE">Report Issue</option>
                        <option value="CANCELLATION">Cancellation</option>
                        <option value="REFUND">Refund</option>
                        <option value="OTHER">Other</option>
                    </select>
                    <select
                        value={filters.priority}
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                    >
                        <option value="">All Priorities</option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                    </select>
                    <button
                        onClick={() => setFilters({ search: "", status: "", type: "", priority: "", page: 1 })}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Disputes List */}
            {loading ? (
                <LoadingSpinner message="Loading disputes..." />
            ) : disputes.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <IoAlertCircleOutline className="mx-auto text-6xl text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Disputes Found</h3>
                    <p className="text-gray-600">No disputes match your filters</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto max-w-full">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raised By</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">Subject</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {disputes.map((dispute) => (
                                    <tr key={dispute._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <span className="text-sm font-medium text-gray-900">
                                                #{dispute._id.toString().slice(-8).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{dispute.raisedBy?.name || "N/A"}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[120px]">{dispute.raisedByModel}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-gray-900 whitespace-nowrap">{getTypeLabel(dispute.type)}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm text-gray-900 max-w-[200px] truncate" title={dispute.subject}>{dispute.subject}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(dispute.status)}`}>
                                                {dispute.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getPriorityColor(dispute.priority)}`}>
                                                {dispute.priority}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                                            {formatDate(dispute.createdAt)}
                                        </td>
                                        <td className="px-4 py-4 text-sm font-medium">
                                            <button
                                                onClick={() => handleViewDetails(dispute._id)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                <IoEyeOutline className="text-lg" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{" "}
                                {Math.min(pagination.currentPage * filters.limit, pagination.totalDisputes)} of{" "}
                                {pagination.totalDisputes} disputes
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                    disabled={filters.page === 1}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                    disabled={filters.page >= pagination.totalPages}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Dispute Details</h2>
                            <button
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setSelectedDispute(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <IoCloseOutline className="text-2xl" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedDispute.status)}`}>
                                        {selectedDispute.status}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Priority</h3>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedDispute.priority)}`}>
                                        {selectedDispute.priority}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Subject</h3>
                                <p className="text-sm text-gray-900">{selectedDispute.subject}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedDispute.description}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Raised By</h3>
                                <p className="text-sm text-gray-900">{selectedDispute.raisedBy?.name} ({selectedDispute.raisedByModel})</p>
                                <p className="text-sm text-gray-500">{selectedDispute.raisedBy?.email}</p>
                            </div>
                            {selectedDispute.booking && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Related Booking</h3>
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            navigate(`/admin/bookings/${selectedDispute.booking._id}`);
                                        }}
                                        className="text-sm text-[#0A84FF] hover:underline flex items-center gap-1"
                                    >
                                        View Booking #{selectedDispute.booking._id.toString().slice(-8).toUpperCase()}
                                        <IoArrowForwardOutline />
                                    </button>
                                </div>
                            )}
                            {selectedDispute.comments && selectedDispute.comments.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-3">Comments</h3>
                                    <div className="space-y-3">
                                        {selectedDispute.comments.map((comment, index) => (
                                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {comment.commentedBy?.name || "Admin"}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                                                </div>
                                                <p className="text-sm text-gray-700">{comment.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {selectedDispute.resolution && (
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Resolution</h3>
                                    <p className="text-sm text-gray-700 mb-2">{selectedDispute.resolution.notes}</p>
                                    <p className="text-xs text-gray-500">
                                        Resolved by {selectedDispute.resolution.resolvedBy?.name} on {formatDate(selectedDispute.resolution.resolvedAt)}
                                    </p>
                                </div>
                            )}
                            <div className="flex gap-2 pt-4 border-t">
                                <button
                                    onClick={() => {
                                        setStatusUpdate({ status: selectedDispute.status, notes: "" });
                                        setShowStatusModal(true);
                                    }}
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
                                >
                                    Update Status
                                </button>
                                <button
                                    onClick={() => setShowCommentModal(true)}
                                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700"
                                >
                                    Add Comment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Status Modal */}
            <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${showStatusModal ? "" : "hidden"}`}>
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Update Status</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={statusUpdate.status}
                                onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF]"
                            >
                                <option value="">Select Status</option>
                                <option value="PENDING">Pending</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="RESOLVED">Resolved</option>
                                <option value="CLOSED">Closed</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                            <textarea
                                value={statusUpdate.notes}
                                onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF]"
                                placeholder="Add any notes about this status update..."
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowStatusModal(false);
                                    setStatusUpdate({ status: "", notes: "" });
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateStatus}
                                disabled={actionLoading || !statusUpdate.status}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Comment Modal */}
            <InputModal
                isOpen={showCommentModal}
                onClose={() => {
                    setShowCommentModal(false);
                    setNewComment("");
                }}
                onSubmit={handleAddComment}
                title="Add Comment"
                message="Add a comment to this dispute:"
                inputLabel="Comment"
                inputValue={newComment}
                onInputChange={setNewComment}
                inputType="textarea"
                submitText="Add Comment"
                submitColor="primary"
                loading={actionLoading}
            />
        </div>
    );
}

