import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/api";
import {
    IoWalletOutline,
    IoCheckmarkCircleOutline,
    IoTimeOutline,
    IoCloseCircleOutline,
    IoSearchOutline,
    IoFilterOutline,
    IoPersonOutline,
    IoSwapHorizontalOutline,
    IoLockClosedOutline,
    IoCashOutline
} from "react-icons/io5";
import ProcessDisbursalModal from "../admin-component/ProcessDisbursalModal";
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
    const [pendingVendorCount, setPendingVendorCount] = useState(0);

    // Modal states
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadWithdrawalRequests();
        loadAvailableFinanceAdmins();
        api.get('/admin/dashboard/sidebar-counts')
            .then(res => {
                if (res.data?.data?.counts?.withdrawals !== undefined) {
                    setPendingVendorCount(res.data.data.counts.withdrawals);
                }
            })
            .catch(() => {});
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

    const handleProcessConfirm = async (payoutData) => {
        if (!selectedRequest) return;
        try {
            setProcessing(true);
            const response = await processUserWithdrawalRequest(selectedRequest._id, payoutData);
            if (response.success) {
                handleApiSuccess(response, "Customer refund payout marked as processed & settled!");
                setShowProcessModal(false);
                setSelectedRequest(null);
                await loadWithdrawalRequests();
            }
        } catch (err) {
            handleApiError(err, "Failed to process withdrawal");
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
            {/* Header & Page Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customer Refund Withdrawals</h1>
                    <p className="text-sm text-gray-500 mt-1">Review and process wallet balance cashouts & refunds for customers.</p>
                </div>
                <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                    <Link
                        to="/admin/withdrawals"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <span>👨‍💼 Expert Disbursals</span>
                        {pendingVendorCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded-full font-black">
                                {pendingVendorCount}
                            </span>
                        )}
                    </Link>
                    <Link
                        to="/admin/user-withdrawals"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-white text-blue-600 shadow-sm"
                    >
                        <span>👤 Customer Refunds</span>
                        {getStatusCount("pending") > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-indigo-600 text-white rounded-full font-black">
                                {getStatusCount("pending")}
                            </span>
                        )}
                    </Link>
                </div>
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
                                                <span className="font-medium text-gray-800 flex items-center gap-1">
                                                    {request.payoutType === 'BANK_TRANSFER' ? '🏦 Bank Transfer' : '⚡ UPI'}
                                                </span>
                                                <span className="text-[11px] text-gray-500 font-mono block mt-0.5">
                                                    {request.payoutType === 'BANK_TRANSFER' ? (
                                                        request.accountDetails?.accountNumber ? (
                                                            <>A/C: {request.accountDetails.accountNumber} {request.accountDetails.ifscCode ? `(${request.accountDetails.ifscCode})` : ''}</>
                                                        ) : (
                                                            'Bank Details N/A'
                                                        )
                                                    ) : (
                                                        request.upiId || 'UPI N/A'
                                                    )}
                                                </span>
                                                {request.payoutType === 'BANK_TRANSFER' && request.accountDetails?.bankName && (
                                                    <span className="text-[10px] text-gray-400 block truncate max-w-[160px]">
                                                        {request.accountDetails.bankName}
                                                    </span>
                                                )}
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
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <button
                                                                    onClick={() => { setSelectedRequest(request); setShowApproveModal(true); }}
                                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => { setSelectedRequest(request); setShowRejectModal(true); }}
                                                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg font-bold text-xs cursor-pointer"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                        {request.status === "APPROVED" && (
                                                            <button
                                                                onClick={() => { setSelectedRequest(request); setShowProcessModal(true); }}
                                                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                                                            >
                                                                <IoCashOutline className="text-sm" />
                                                                <span>Process Disbursal</span>
                                                            </button>
                                                        )}
                                                        {request.status === "PROCESSED" && (
                                                            <div className="text-right">
                                                                <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1">
                                                                    <IoCheckmarkCircleOutline className="text-sm" /> Disbursed
                                                                </span>
                                                                {request.transactionId && (
                                                                    <span className="text-[10px] text-gray-400 font-mono block">
                                                                        Ref: {request.transactionId}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {request.status === "REJECTED" && (
                                                            <span className="text-[11px] text-rose-500 font-medium italic">Rejected</span>
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

            {/* Approve Modal with Bank / Payout Details Verification */}
            {showApproveModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-outfit">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 transition-all animate-in fade-in zoom-in-95">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                                <IoCheckmarkCircleOutline />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 leading-tight">
                                    Approve Refund Withdrawal
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Verify user payout details before approving for disbursal.
                                </p>
                            </div>
                        </div>

                        <div className="my-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-medium">Customer:</span>
                                <span className="font-bold text-slate-900">{selectedRequest.userName}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-medium">Refund Amount:</span>
                                <span className="font-black text-emerald-600 font-mono text-base">₹{formatAmount(selectedRequest.amount)}</span>
                            </div>

                            <div className="pt-2 border-t border-slate-200/60">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                                    Payout Destination: {selectedRequest.payoutType === 'BANK_TRANSFER' ? '🏦 Bank Transfer' : '⚡ UPI'}
                                </span>
                                {selectedRequest.payoutType === 'BANK_TRANSFER' ? (
                                    <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-800">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-sans">A/C Name:</span>
                                            <span className="font-bold">{selectedRequest.accountDetails?.accountHolderName || selectedRequest.userName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-sans">A/C Number:</span>
                                            <span className="font-black text-blue-700">{selectedRequest.accountDetails?.accountNumber || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-sans">IFSC Code:</span>
                                            <span className="font-bold">{selectedRequest.accountDetails?.ifscCode || 'N/A'}</span>
                                        </div>
                                        {selectedRequest.accountDetails?.bankName && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 font-sans">Bank:</span>
                                                <span className="font-medium text-slate-600">{selectedRequest.accountDetails.bankName}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 flex items-center justify-between">
                                        <span className="text-slate-500 font-sans font-medium">UPI ID:</span>
                                        <span className="text-blue-600">{selectedRequest.upiId || 'N/A'}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowApproveModal(false);
                                    setSelectedRequest(null);
                                }}
                                disabled={processing}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleApproveConfirm}
                                disabled={processing}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {processing ? 'Approving...' : '✓ Approve Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

            {/* Process Disbursal Modal */}
            <ProcessDisbursalModal
                isOpen={showProcessModal}
                onClose={() => {
                    setShowProcessModal(false);
                    setSelectedRequest(null);
                }}
                onConfirm={handleProcessConfirm}
                onReject={async (reason) => {
                    await handleRejectConfirm(reason);
                    setShowProcessModal(false);
                }}
                request={selectedRequest}
                processing={processing}
                isUser={true}
            />
        </div>
    );
}
