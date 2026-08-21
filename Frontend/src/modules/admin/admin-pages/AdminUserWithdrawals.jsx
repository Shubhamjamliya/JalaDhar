import { useState, useEffect } from "react";
import {
    IoWalletOutline,
    IoCheckmarkCircleOutline,
    IoTimeOutline,
    IoCloseCircleOutline,
    IoSearchOutline,
    IoFilterOutline,
    IoPersonOutline,
    IoSwapHorizontalOutline,
    IoLockClosedOutline
} from "react-icons/io5";
import {
    getAllUserWithdrawalRequests,
    approveUserWithdrawalRequest,
    rejectUserWithdrawalRequest,
    processUserWithdrawalRequest,
    assignUserWithdrawalRequestApi,
    getAllAdmins
} from "../../../services/adminApi";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import { useToast } from "../../../hooks/useToast";
import { handleApiError, handleApiSuccess } from "../../../utils/toastHelper";
import { hasAdminPermission } from "../../../utils/permissionUtils";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import AssignmentHistoryModal from "../admin-component/AssignmentHistoryModal";

export default function AdminUserWithdrawals() {
    const toast = useToast();
    const { admin: currentAdmin } = useAdminAuth();
    const canApproveDisbursals = hasAdminPermission(currentAdmin, "can_approve_disbursals");
    const isSuperAdmin = currentAdmin?.role === "SUPER_ADMIN";
    const [loading, setLoading] = useState(true);
    const [withdrawalRequests, setWithdrawalRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [availableFinanceAdmins, setAvailableFinanceAdmins] = useState([]);
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Modal states
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadWithdrawalRequests();
        loadAvailableFinanceAdmins();
    }, [activeTab]);

    useEffect(() => {
        filterRequests();
    }, [withdrawalRequests, activeTab, searchQuery]);

    const loadAvailableFinanceAdmins = async () => {
        try {
            const res = await getAllAdmins();
            if (res.success && res.data?.admins) {
                const financeAdmins = res.data.admins.filter(a =>
                    a.isActive && ['FINANCE_ADMIN', 'SUPER_ADMIN'].includes(a.role)
                );
                setAvailableFinanceAdmins(financeAdmins);
            }
        } catch (err) {
            console.error("Failed to load finance admins:", err);
        }
    };

    const loadWithdrawalRequests = async () => {
        try {
            setLoading(true);
            const status = activeTab !== "all" ? activeTab.toUpperCase() : undefined;
            const response = await getAllUserWithdrawalRequests({ 
                status,
                page: 1,
                limit: 100
            });
            if (response.success) {
                setWithdrawalRequests(response.data.withdrawalRequests || []);
            }
        } catch (err) {
            handleApiError(err, "Failed to load user withdrawal requests");
        } finally {
            setLoading(false);
        }
    };

    const filterRequests = () => {
        let filtered = [...withdrawalRequests];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(req =>
                req.userName?.toLowerCase().includes(query) ||
                req.userEmail?.toLowerCase().includes(query) ||
                req.userPhone?.toLowerCase().includes(query) ||
                req._id?.toString().toLowerCase().includes(query)
            );
        }

        filtered.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
        setFilteredRequests(filtered);
    };

    const handleApproveConfirm = async () => {
        if (!selectedRequest) return;
        try {
            setProcessing(true);
            const response = await approveUserWithdrawalRequest(
                selectedRequest.userId,
                selectedRequest._id
            );
            if (response.success) {
                handleApiSuccess(response, "User refund withdrawal approved!");
                setShowApproveModal(false);
                setSelectedRequest(null);
                await loadWithdrawalRequests();
            }
        } catch (err) {
            handleApiError(err, "Failed to approve request");
        } finally {
            setProcessing(false);
        }
    };

    const handleRejectConfirm = async (reason) => {
        if (!selectedRequest) return;
        try {
            setProcessing(true);
            const response = await rejectUserWithdrawalRequest(
                selectedRequest.userId,
                selectedRequest._id,
                { rejectionReason: reason }
            );
            if (response.success) {
                handleApiSuccess(response, "User refund withdrawal rejected");
                setShowRejectModal(false);
                setSelectedRequest(null);
                setRejectionReason("");
                await loadWithdrawalRequests();
            }
        } catch (err) {
            handleApiError(err, "Failed to reject request");
        } finally {
            setProcessing(false);
        }
    };

    const handleReassignUserWithdrawal = async (newAdminId, reason, notesText) => {
        if (!selectedRequest) return;
        try {
            const res = await assignUserWithdrawalRequestApi(selectedRequest._id, {
                assignedTo: newAdminId,
                reason,
                notes: notesText
            });
            if (res.success) {
                toast.showSuccess("User refund ticket reassigned successfully!");
                setShowAssignmentModal(false);
                setSelectedRequest(null);
                await loadWithdrawalRequests();
            } else {
                toast.showError(res.message || "Failed to reassign request");
            }
        } catch (err) {
            handleApiError(err, "Reassignment failed");
        }
    };

    const getStatusCount = (status) => {
        if (status === "all") return withdrawalRequests.length;
        return withdrawalRequests.filter(req => req.status.toLowerCase() === status.toLowerCase()).length;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "PENDING":
                return { bg: "bg-yellow-100", text: "text-yellow-800" };
            case "APPROVED":
                return { bg: "bg-blue-100", text: "text-blue-800" };
            case "PROCESSED":
                return { bg: "bg-green-100", text: "text-green-800" };
            case "REJECTED":
                return { bg: "bg-red-100", text: "text-red-800" };
            default:
                return { bg: "bg-gray-100", text: "text-gray-800" };
        }
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat("en-IN").format(amount || 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">User Refund Withdrawals</h1>
                <p className="text-sm text-gray-500 mt-1">Review and process wallet balance cashouts & refunds for customers.</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase">Total Requests</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{getStatusCount("all")}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-amber-600 uppercase">Pending Review</p>
                    <p className="text-2xl font-black text-amber-600 mt-1">{getStatusCount("pending")}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-blue-600 uppercase">Approved</p>
                    <p className="text-2xl font-black text-blue-600 mt-1">{getStatusCount("approved")}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-emerald-600 uppercase">Processed & Settled</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">{getStatusCount("processed")}</p>
                </div>
            </div>

            {/* Tabs and Search */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 overflow-x-auto">
                    {["all", "pending", "approved", "rejected", "processed"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                                activeTab === tab
                                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({getStatusCount(tab)})
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 max-w-md">
                    <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by customer name, email, or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {filteredRequests.length === 0 ? (
                    <div className="p-12 text-center text-xs text-gray-400">No user withdrawal requests found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="px-5 py-3">Customer</th>
                                    <th className="px-5 py-3">Amount</th>
                                    <th className="px-5 py-3">Payout Method</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Assigned Finance Admin</th>
                                    <th className="px-5 py-3">Requested</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs">
                                {filteredRequests.map((request) => {
                                    const badge = getStatusBadge(request.status);
                                    return (
                                        <tr key={request._id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="font-bold text-gray-900">{request.userName}</div>
                                                <div className="text-[11px] text-gray-400">{request.userEmail}</div>
                                            </td>
                                            <td className="px-5 py-3.5 font-bold text-gray-900 font-mono">
                                                ₹{formatAmount(request.amount)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="font-medium text-gray-700 block">{request.payoutType}</span>
                                                <span className="text-[11px] text-gray-400 font-mono">
                                                    {request.upiId || request.accountDetails?.accountNumber || "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            {/* Assigned Finance Admin Chip */}
                                            <td className="px-5 py-3.5">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                        setShowAssignmentModal(true);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-colors cursor-pointer"
                                                >
                                                    <IoPersonOutline className="text-xs" />
                                                    {request.assignedTo?.name || "Auto-Assigned"}
                                                    {isSuperAdmin && <IoSwapHorizontalOutline className="text-xs ml-1 text-emerald-500" />}
                                                </button>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-400">
                                                {new Date(request.requestedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-5 py-3.5 text-right space-x-2">
                                                {canApproveDisbursals ? (
                                                    <>
                                                        {request.status === "PENDING" && (
                                                            <>
                                                                <button
                                                                    onClick={() => { setSelectedRequest(request); setShowApproveModal(true); }}
                                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => { setSelectedRequest(request); setShowRejectModal(true); }}
                                                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg font-bold text-xs cursor-pointer"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-[11px] text-gray-400 italic">Review Only</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Approve Modal */}
            <ConfirmModal
                isOpen={showApproveModal}
                onClose={() => setShowApproveModal(false)}
                onConfirm={handleApproveConfirm}
                title="Approve User Refund"
                message={`Approve ₹${formatAmount(selectedRequest?.amount)} withdrawal for ${selectedRequest?.userName}?`}
            />

            {/* Reject Modal */}
            <InputModal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                onSubmit={handleRejectConfirm}
                title="Reject User Refund"
                message="Provide reason for rejecting this refund request:"
                placeholder="e.g. Account details invalid..."
            />

            {/* Assignment History Modal */}
            <AssignmentHistoryModal
                isOpen={showAssignmentModal}
                onClose={() => {
                    setShowAssignmentModal(false);
                    setSelectedRequest(null);
                }}
                entityTitle={`User Refund: ₹${formatAmount(selectedRequest?.amount)}`}
                assignedTo={selectedRequest?.assignedTo}
                assignmentHistory={selectedRequest?.assignmentHistory || []}
                availableAdmins={availableFinanceAdmins}
                onReassign={handleReassignUserWithdrawal}
                isSuperAdmin={isSuperAdmin}
            />
        </div>
    );
}
