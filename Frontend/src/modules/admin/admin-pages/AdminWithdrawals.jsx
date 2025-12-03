import { useState, useEffect } from "react";
import {
    IoWalletOutline,
    IoCheckmarkCircleOutline,
    IoTimeOutline,
    IoCloseCircleOutline,
    IoSearchOutline,
    IoFilterOutline,
} from "react-icons/io5";
import {
    getAllWithdrawalRequests,
    approveWithdrawalRequest,
    rejectWithdrawalRequest,
    processWithdrawal
} from "../../../services/adminApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError, handleApiSuccess } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";
import LoadingSpinner from "../../shared/components/LoadingSpinner";

export default function AdminWithdrawals() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [withdrawalRequests, setWithdrawalRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [activeTab, setActiveTab] = useState("all"); // all, pending, approved, rejected, processed
    const [searchQuery, setSearchQuery] = useState("");

    // Modal states
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [razorpayPayoutId, setRazorpayPayoutId] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadWithdrawalRequests();
    }, []);

    useEffect(() => {
        filterRequests();
    }, [withdrawalRequests, activeTab, searchQuery]);

    const loadWithdrawalRequests = async () => {
        try {
            setLoading(true);
            const response = await getAllWithdrawalRequests();
            if (response.success) {
                setWithdrawalRequests(response.data.withdrawalRequests || []);
            }
        } catch (err) {
            handleApiError(err, "Failed to load withdrawal requests");
        } finally {
            setLoading(false);
        }
    };

    const filterRequests = () => {
        let filtered = [...withdrawalRequests];

        // Filter by status
        if (activeTab !== "all") {
            filtered = filtered.filter(req => req.status.toLowerCase() === activeTab.toUpperCase());
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(req =>
                req.vendorName?.toLowerCase().includes(query) ||
                req.vendorEmail?.toLowerCase().includes(query) ||
                req.vendorPhone?.toLowerCase().includes(query) ||
                req._id?.toString().toLowerCase().includes(query)
            );
        }

        // Sort by requestedAt descending
        filtered.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

        setFilteredRequests(filtered);
    };

    const handleApprove = (request) => {
        setSelectedRequest(request);
        setShowApproveModal(true);
    };

    const handleApproveConfirm = async () => {
        if (!selectedRequest) return;
        try {
            setProcessing(true);
            const response = await approveWithdrawalRequest(
                selectedRequest.vendorId,
                selectedRequest._id
            );
            if (response.success) {
                handleApiSuccess(response, "Withdrawal request approved successfully!");
                setShowApproveModal(false);
                setSelectedRequest(null);
                loadWithdrawalRequests();
            }
        } catch (err) {
            handleApiError(err, "Failed to approve withdrawal request");
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = (request) => {
        setSelectedRequest(request);
        setRejectionReason("");
        setShowRejectModal(true);
    };

    const handleRejectConfirm = async () => {
        if (!selectedRequest || !rejectionReason.trim()) {
            toast.showError("Please provide a rejection reason");
            return;
        }
        try {
            setProcessing(true);
            const response = await rejectWithdrawalRequest(
                selectedRequest.vendorId,
                selectedRequest._id,
                rejectionReason
            );
            if (response.success) {
                handleApiSuccess(response, "Withdrawal request rejected");
                setShowRejectModal(false);
                setSelectedRequest(null);
                setRejectionReason("");
                loadWithdrawalRequests();
            }
        } catch (err) {
            handleApiError(err, "Failed to reject withdrawal request");
        } finally {
            setProcessing(false);
        }
    };

    const handleProcess = (request) => {
        setSelectedRequest(request);
        setRazorpayPayoutId("");
        setShowProcessModal(true);
    };

    const handleProcessConfirm = async () => {
        if (!selectedRequest || !razorpayPayoutId.trim()) {
            toast.showError("Please provide Razorpay payout ID");
            return;
        }
        try {
            setProcessing(true);
            const response = await processWithdrawal(
                selectedRequest.vendorId,
                selectedRequest._id,
                razorpayPayoutId
            );
            if (response.success) {
                handleApiSuccess(response, "Withdrawal processed successfully!");
                setShowProcessModal(false);
                setSelectedRequest(null);
                setRazorpayPayoutId("");
                loadWithdrawalRequests();
            }
        } catch (err) {
            handleApiError(err, "Failed to process withdrawal");
        } finally {
            setProcessing(false);
        }
    };

    const formatAmount = (amount) => {
        return amount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            PENDING: { color: "bg-yellow-100 text-yellow-800", icon: IoTimeOutline },
            APPROVED: { color: "bg-blue-100 text-blue-800", icon: IoCheckmarkCircleOutline },
            REJECTED: { color: "bg-red-100 text-red-800", icon: IoCloseCircleOutline },
            PROCESSED: { color: "bg-green-100 text-green-800", icon: IoCheckmarkCircleOutline }
        };
        return badges[status] || badges.PENDING;
    };

    const getStatusCount = (status) => {
        if (status === "all") return withdrawalRequests.length;
        return withdrawalRequests.filter(req => req.status === status.toUpperCase()).length;
    };

    if (loading) {
        return <LoadingSpinner message="Loading withdrawal requests..." />;
    }

    return (
        <>
        <div className="min-h-[calc(100vh-5rem)] p-4 md:p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Withdrawal Management</h1>
                <p className="text-gray-600">Manage vendor withdrawal requests</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Requests</p>
                            <p className="text-2xl font-bold text-gray-800">{getStatusCount("all")}</p>
                        </div>
                        <IoWalletOutline className="text-3xl text-blue-500" />
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{getStatusCount("pending")}</p>
                        </div>
                        <IoTimeOutline className="text-3xl text-yellow-500" />
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Approved</p>
                            <p className="text-2xl font-bold text-blue-600">{getStatusCount("approved")}</p>
                        </div>
                        <IoCheckmarkCircleOutline className="text-3xl text-blue-500" />
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Processed</p>
                            <p className="text-2xl font-bold text-green-600">{getStatusCount("processed")}</p>
                        </div>
                        <IoCheckmarkCircleOutline className="text-3xl text-green-500" />
                    </div>
                </div>
            </div>

            {/* Tabs and Search */}
            <div className="bg-white rounded-lg p-4 shadow-md mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto">
                        {["all", "pending", "approved", "rejected", "processed"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                                    activeTab === tab
                                        ? "bg-[#0A84FF] text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({getStatusCount(tab)})
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by vendor name, email, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                        />
                    </div>
                </div>
            </div>

            {/* Withdrawal Requests List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {filteredRequests.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">No withdrawal requests found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Details</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredRequests.map((request) => {
                                    const badge = getStatusBadge(request.status);
                                    const StatusIcon = badge.icon;
                                    return (
                                        <tr key={request._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4">
                                                <div>
                                                    <p className="font-semibold text-gray-800">{request.vendorName}</p>
                                                    <p className="text-sm text-gray-500">{request.vendorEmail}</p>
                                                    <p className="text-xs text-gray-400">{request.vendorPhone}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="font-bold text-gray-800">₹{formatAmount(request.amount)}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm text-gray-600">{formatDateTime(request.requestedAt)}</p>
                                                {request.processedAt && (
                                                    <p className="text-xs text-gray-400">Processed: {formatDateTime(request.processedAt)}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                                                    <StatusIcon className="text-sm" />
                                                    {request.status}
                                                </span>
                                                {request.rejectionReason && (
                                                    <p className="text-xs text-red-500 mt-1">{request.rejectionReason}</p>
                                                )}
                                                {request.razorpayPayoutId && (
                                                    <p className="text-xs text-gray-500 mt-1">Payout ID: {request.razorpayPayoutId}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {request.bankDetails ? (
                                                    <div className="text-sm">
                                                        <p className="text-gray-800">{request.bankDetails.accountHolderName}</p>
                                                        <p className="text-gray-600">{request.bankDetails.bankName}</p>
                                                        <p className="text-gray-500 text-xs">{request.bankDetails.accountNumber}</p>
                                                        <p className="text-gray-500 text-xs">{request.bankDetails.ifscCode}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-400">Not available</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex gap-2">
                                                    {request.status === "PENDING" && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(request)}
                                                                className="px-3 py-1 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(request)}
                                                                className="px-3 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {request.status === "APPROVED" && (
                                                        <button
                                                            onClick={() => handleProcess(request)}
                                                            className="px-3 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600"
                                                        >
                                                            Process
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>

        {/* Approve Modal */}
        <ConfirmModal
            isOpen={showApproveModal}
            onClose={() => {
                setShowApproveModal(false);
                setSelectedRequest(null);
            }}
            onConfirm={handleApproveConfirm}
            title="Approve Withdrawal Request"
            message={`Approve withdrawal of ₹${selectedRequest ? formatAmount(selectedRequest.amount) : '0'} for ${selectedRequest?.vendorName}?`}
            confirmText="Approve"
            cancelText="Cancel"
            confirmColor="primary"
            isLoading={processing}
        />

        {/* Reject Modal */}
        <InputModal
            isOpen={showRejectModal}
            onClose={() => {
                setShowRejectModal(false);
                setSelectedRequest(null);
                setRejectionReason("");
            }}
            onSubmit={handleRejectConfirm}
            title="Reject Withdrawal Request"
            label="Rejection Reason"
            type="text"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter reason for rejection"
            submitText="Reject"
            cancelText="Cancel"
            isLoading={processing}
            validation={(value) => {
                if (!value.trim()) return "Rejection reason is required";
                return null;
            }}
        />

        {/* Process Modal */}
        <InputModal
            isOpen={showProcessModal}
            onClose={() => {
                setShowProcessModal(false);
                setSelectedRequest(null);
                setRazorpayPayoutId("");
            }}
            onSubmit={handleProcessConfirm}
            title="Process Withdrawal"
            label="Razorpay Payout ID"
            type="text"
            value={razorpayPayoutId}
            onChange={(e) => setRazorpayPayoutId(e.target.value)}
            placeholder="Enter Razorpay payout ID after manual transfer"
            submitText="Mark as Processed"
            cancelText="Cancel"
            isLoading={processing}
            validation={(value) => {
                if (!value.trim()) return "Razorpay payout ID is required";
                return null;
            }}
        />
    </>);
}

