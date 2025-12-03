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
    getAllUserWithdrawalRequests,
    approveUserWithdrawalRequest,
    rejectUserWithdrawalRequest,
    processUserWithdrawalRequest
} from "../../../services/adminApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError, handleApiSuccess } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import InputModal from "../../shared/components/InputModal";
import LoadingSpinner from "../../shared/components/LoadingSpinner";

export default function AdminUserWithdrawals() {
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
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRequests: 0
    });

    useEffect(() => {
        loadWithdrawalRequests();
    }, [activeTab]);

    useEffect(() => {
        filterRequests();
    }, [withdrawalRequests, activeTab, searchQuery]);

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
                setPagination(response.data.pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalRequests: 0
                });
            }
        } catch (err) {
            handleApiError(err, "Failed to load withdrawal requests");
        } finally {
            setLoading(false);
        }
    };

    const filterRequests = () => {
        let filtered = [...withdrawalRequests];

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(req =>
                req.userName?.toLowerCase().includes(query) ||
                req.userEmail?.toLowerCase().includes(query) ||
                req.userPhone?.toLowerCase().includes(query) ||
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
            const response = await approveUserWithdrawalRequest(
                selectedRequest.userId,
                selectedRequest._id,
                {}
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
            toast.showError("Please provide a rejection reason (minimum 10 characters)");
            return;
        }

        if (rejectionReason.trim().length < 10) {
            toast.showError("Rejection reason must be at least 10 characters");
            return;
        }

        try {
            setProcessing(true);
            const response = await rejectUserWithdrawalRequest(
                selectedRequest.userId,
                selectedRequest._id,
                { rejectionReason: rejectionReason.trim() }
            );
            if (response.success) {
                handleApiSuccess(response, "Withdrawal request rejected successfully!");
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
            toast.showError("Please enter Razorpay Payout ID");
            return;
        }

        try {
            setProcessing(true);
            const response = await processUserWithdrawalRequest(
                selectedRequest.userId,
                selectedRequest._id,
                { razorpayPayoutId: razorpayPayoutId.trim() }
            );
            if (response.success) {
                handleApiSuccess(response, "Withdrawal request processed successfully!");
                setShowProcessModal(false);
                setSelectedRequest(null);
                setRazorpayPayoutId("");
                loadWithdrawalRequests();
            }
        } catch (err) {
            handleApiError(err, "Failed to process withdrawal request");
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

    const getStatusColor = (status) => {
        const colors = {
            'PENDING': 'bg-yellow-100 text-yellow-800',
            'APPROVED': 'bg-blue-100 text-blue-800',
            'REJECTED': 'bg-red-100 text-red-800',
            'PROCESSED': 'bg-green-100 text-green-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return <LoadingSpinner message="Loading withdrawal requests..." />;
    }

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">User Withdrawal Requests</h1>
                <p className="text-sm text-gray-600">Manage user withdrawal requests and process payouts</p>
            </div>

            {/* Search and Filter */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                    <input
                        type="text"
                        placeholder="Search by name, email, phone, or request ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                {['all', 'pending', 'approved', 'rejected', 'processed'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab);
                            setSearchQuery("");
                        }}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                            activeTab === tab
                                ? 'bg-[#0A84FF] text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                    <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                        <IoWalletOutline className="mx-auto text-4xl text-gray-400 mb-4" />
                        <p className="text-gray-600">No withdrawal requests found</p>
                    </div>
                ) : (
                    filteredRequests.map((request) => (
                        <div
                            key={request._id}
                            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            {request.userName || 'Unknown User'}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                        <div>
                                            <span className="font-medium">Email:</span> {request.userEmail}
                                        </div>
                                        <div>
                                            <span className="font-medium">Phone:</span> {request.userPhone}
                                        </div>
                                        <div>
                                            <span className="font-medium">Amount:</span> ₹{formatAmount(request.amount)}
                                        </div>
                                        <div>
                                            <span className="font-medium">Requested:</span> {formatDateTime(request.requestedAt)}
                                        </div>
                                        {request.processedAt && (
                                            <div>
                                                <span className="font-medium">Processed:</span> {formatDateTime(request.processedAt)}
                                            </div>
                                        )}
                                        {request.razorpayPayoutId && (
                                            <div>
                                                <span className="font-medium">Payout ID:</span> {request.razorpayPayoutId}
                                            </div>
                                        )}
                                        {request.rejectionReason && (
                                            <div className="md:col-span-2">
                                                <span className="font-medium text-red-600">Rejection Reason:</span> {request.rejectionReason}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 md:flex-row">
                                    {request.status === 'PENDING' && (
                                        <>
                                            <button
                                                onClick={() => handleApprove(request)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <IoCheckmarkCircleOutline className="text-lg" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(request)}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <IoCloseCircleOutline className="text-lg" />
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    {request.status === 'APPROVED' && (
                                        <button
                                            onClick={() => handleProcess(request)}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <IoWalletOutline className="text-lg" />
                                            Process Payment
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
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
                message={`Are you sure you want to approve withdrawal request of ₹${selectedRequest ? formatAmount(selectedRequest.amount) : '0'} from ${selectedRequest?.userName || 'user'}?`}
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
                type="textarea"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection (minimum 10 characters)..."
                submitText="Reject"
                cancelText="Cancel"
                confirmColor="danger"
                isLoading={processing}
                validation={(value) => {
                    if (!value || value.trim().length < 10) {
                        return "Rejection reason must be at least 10 characters";
                    }
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
                title="Process Withdrawal Payment"
                label="Razorpay Payout ID"
                type="text"
                value={razorpayPayoutId}
                onChange={(e) => setRazorpayPayoutId(e.target.value)}
                placeholder="Enter Razorpay Payout ID..."
                submitText="Process"
                cancelText="Cancel"
                confirmColor="primary"
                isLoading={processing}
                validation={(value) => {
                    if (!value || !value.trim()) {
                        return "Razorpay Payout ID is required";
                    }
                    return null;
                }}
            />
        </div>
    );
}

