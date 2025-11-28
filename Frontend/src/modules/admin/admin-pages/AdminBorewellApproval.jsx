import { useState, useEffect } from "react";
import {
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoImageOutline,
    IoTimeOutline,
    IoWalletOutline,
    IoDocumentTextOutline,
    IoPersonOutline,
    IoCalendarOutline,
    IoSearchOutline,
    IoRefreshOutline,
} from "react-icons/io5";
import { getBorewellPendingApprovals, approveBorewellResult, processFinalSettlement } from "../../../services/adminApi";
import { useTheme } from "../../../contexts/ThemeContext";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";

export default function AdminBorewellApproval() {
    const { theme, themeColors } = useTheme();
    const currentTheme = themeColors[theme] || themeColors.default;
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("pending"); // pending, approved, completed
    const [bookings, setBookings] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalBookings: 0,
    });
    const [error, setError] = useState("");
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showSettlementModal, setShowSettlementModal] = useState(false);
    const [settlementData, setSettlementData] = useState({
        incentive: 0,
        penalty: 0,
        refundAmount: 0,
    });

    useEffect(() => {
        loadBookings();
    }, [activeTab, pagination.currentPage]);

    const loadBookings = async () => {
        try {
            setLoading(true);
            setError("");
            const status = activeTab === "pending" ? "BOREWELL_UPLOADED" : 
                          activeTab === "approved" ? "ADMIN_APPROVED" : 
                          "COMPLETED";
            const response = await getBorewellPendingApprovals({
                page: pagination.currentPage,
                limit: 10,
                status,
            });
            if (response.success) {
                setBookings(response.data.bookings);
                setPagination(response.data.pagination);
            } else {
                setError(response.message || "Failed to load bookings");
            }
        } catch (err) {
            console.error("Load bookings error:", err);
            setError(err.response?.data?.message || "Failed to load bookings");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (booking, approved) => {
        try {
            setError("");
            const response = await approveBorewellResult(booking._id, { approved });
            if (response.success) {
                toast.showSuccess(`Borewell result ${approved ? "approved as SUCCESS" : "approved as FAILED"} successfully!`);
                setShowApproveModal(false);
                setSelectedBooking(null);
                await loadBookings();
            } else {
                setError(response.message || "Failed to approve borewell result");
            }
        } catch (err) {
            console.error("Approve borewell error:", err);
            setError(err.response?.data?.message || "Failed to approve borewell result");
        }
    };

    const handleProcessSettlement = async () => {
        if (!selectedBooking) return;

        try {
            setError("");
            const response = await processFinalSettlement(selectedBooking._id, settlementData);
            if (response.success) {
                toast.showSuccess(response.message || "Final settlement processed successfully!");
                setShowSettlementModal(false);
                setSelectedBooking(null);
                setSettlementData({ incentive: 0, penalty: 0, refundAmount: 0 });
                await loadBookings();
            } else {
                setError(response.message || "Failed to process final settlement");
            }
        } catch (err) {
            console.error("Process settlement error:", err);
            setError(err.response?.data?.message || "Failed to process final settlement");
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const openApproveModal = (booking) => {
        setSelectedBooking(booking);
        setShowApproveModal(true);
    };

    const openSettlementModal = (booking) => {
        const isSuccess = booking.borewellResult?.status === "SUCCESS";
        const baseAmount = booking.payment?.totalAmount * 0.5 || 0;
        const remainingAmount = booking.payment?.remainingAmount || 0;
        
        setSelectedBooking(booking);
        setSettlementData({
            incentive: isSuccess ? 0 : undefined,
            penalty: !isSuccess ? 0 : undefined,
            refundAmount: !isSuccess ? remainingAmount : 0,
        });
        setShowSettlementModal(true);
    };

    if (loading && bookings.length === 0) {
        return (
            <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
                <LoadingSpinner message="Loading borewell approvals..." />
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-5rem)]">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Borewell Approval & Final Settlement</h1>
                <p className="text-gray-600">Approve borewell results and process final settlements</p>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600">{success}</p>
                </div>
            )}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Tabs */}
            <div className="mb-6">
                <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
                    <button
                        onClick={() => {
                            setActiveTab("pending");
                            setPagination({ ...pagination, currentPage: 1 });
                        }}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === "pending"
                                ? "border-orange-500 text-orange-600"
                                : "border-transparent text-gray-600 hover:text-gray-800"
                        }`}
                    >
                        Pending Approval
                        {activeTab === "pending" && bookings.filter(b => !b.borewellResult?.approvedAt).length > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                {bookings.filter(b => !b.borewellResult?.approvedAt).length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("approved");
                            setPagination({ ...pagination, currentPage: 1 });
                        }}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === "approved"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-600 hover:text-gray-800"
                        }`}
                    >
                        Approved - Pending Settlement
                        {activeTab === "approved" && bookings.filter(b => b.borewellResult?.approvedAt && b.userStatus !== "COMPLETED").length > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                                {bookings.filter(b => b.borewellResult?.approvedAt && b.userStatus !== "COMPLETED").length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("completed");
                            setPagination({ ...pagination, currentPage: 1 });
                        }}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === "completed"
                                ? "border-green-500 text-green-600"
                                : "border-transparent text-gray-600 hover:text-gray-800"
                        }`}
                    >
                        Completed
                    </button>
                </div>
            </div>

            {/* Bookings List */}
            <div className="space-y-4">
                {bookings.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
                        <IoDocumentTextOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-semibold">No bookings found</p>
                        <p className="text-sm text-gray-500 mt-2">
                            {activeTab === "pending"
                                ? "No borewell results pending approval"
                                : activeTab === "approved"
                                ? "No approved bookings pending settlement"
                                : "No completed settlements"}
                        </p>
                    </div>
                ) : (
                    bookings.map((booking) => (
                        <div
                            key={booking._id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            {/* Booking Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-800">
                                            Booking #{booking._id.toString().slice(-8)}
                                        </h3>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                booking.borewellResult?.status === "SUCCESS"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                        >
                                            {booking.borewellResult?.status || "PENDING"}
                                        </span>
                                        {booking.borewellResult?.approvedAt && (
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                                Approved
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-600">User</p>
                                            <p className="font-semibold text-gray-800">{booking.user?.name || "N/A"}</p>
                                            <p className="text-xs text-gray-500">{booking.user?.email || ""}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Vendor</p>
                                            <p className="font-semibold text-gray-800">{booking.vendor?.name || "N/A"}</p>
                                            <p className="text-xs text-gray-500">{booking.vendor?.email || ""}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Service</p>
                                            <p className="font-semibold text-gray-800">{booking.service?.name || "N/A"}</p>
                                            <p className="text-xs text-gray-500">
                                                {booking.payment?.totalAmount ? formatCurrency(booking.payment.totalAmount) : "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Borewell Result Details */}
                            {booking.borewellResult && (
                                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <IoImageOutline className="text-xl text-gray-600" />
                                        <h4 className="font-semibold text-gray-800">Borewell Result</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">Status</p>
                                            <p
                                                className={`font-semibold ${
                                                    booking.borewellResult.status === "SUCCESS"
                                                        ? "text-green-600"
                                                        : "text-red-600"
                                                }`}
                                            >
                                                {booking.borewellResult.status}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">Uploaded</p>
                                            <p className="font-semibold text-gray-800">
                                                {formatDate(booking.borewellResult.uploadedAt)}
                                            </p>
                                        </div>
                                    </div>
                                    {booking.borewellResult.images && booking.borewellResult.images.length > 0 && (
                                        <div>
                                            <p className="text-xs text-gray-600 mb-2">Images ({booking.borewellResult.images.length})</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {booking.borewellResult.images.map((img, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={img.url}
                                                        alt={`Borewell result ${idx + 1}`}
                                                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => window.open(img.url, "_blank")}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                {!booking.borewellResult?.approvedAt && (
                                    <>
                                        <button
                                            onClick={() => openApproveModal(booking)}
                                            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                                        >
                                            <IoCheckmarkCircleOutline className="text-lg" />
                                            Approve as Success
                                        </button>
                                        <button
                                            onClick={() => handleApprove(booking, false)}
                                            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                                        >
                                            <IoCloseCircleOutline className="text-lg" />
                                            Approve as Failed
                                        </button>
                                    </>
                                )}
                                {booking.borewellResult?.approvedAt && booking.userStatus !== "COMPLETED" && (
                                    <button
                                        onClick={() => openSettlementModal(booking)}
                                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                                    >
                                        <IoWalletOutline className="text-lg" />
                                        Process Final Settlement
                                    </button>
                                )}
                                {booking.userStatus === "COMPLETED" && (
                                    <div className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
                                        <IoCheckmarkCircleOutline className="text-lg" />
                                        Settlement Complete
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalBookings} total)
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                            disabled={pagination.currentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Approve Modal */}
            {showApproveModal && selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Approve Borewell Result</h3>
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">
                                Booking ID: <span className="font-semibold">{selectedBooking._id.toString().slice(-8)}</span>
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                                User: <span className="font-semibold">{selectedBooking.user?.name || "N/A"}</span>
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                                Borewell Status:{" "}
                                <span
                                    className={`font-semibold ${
                                        selectedBooking.borewellResult?.status === "SUCCESS"
                                            ? "text-green-600"
                                            : "text-red-600"
                                    }`}
                                >
                                    {selectedBooking.borewellResult?.status || "N/A"}
                                </span>
                            </p>
                        </div>
                        <p className="text-sm text-gray-700 mb-4">
                            Are you sure you want to approve this borewell result? This will allow you to process the final settlement.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowApproveModal(false);
                                    setSelectedBooking(null);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleApprove(selectedBooking, true)}
                                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-sm"
                            >
                                Approve as Success
                            </button>
                            <button
                                onClick={() => handleApprove(selectedBooking, false)}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm"
                            >
                                Approve as Failed
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settlement Modal */}
            {showSettlementModal && selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Process Final Settlement</h3>
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">
                                Booking ID: <span className="font-semibold">{selectedBooking._id.toString().slice(-8)}</span>
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                                Vendor: <span className="font-semibold">{selectedBooking.vendor?.name || "N/A"}</span>
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                                Borewell Result:{" "}
                                <span
                                    className={`font-semibold ${
                                        selectedBooking.borewellResult?.status === "SUCCESS"
                                            ? "text-green-600"
                                            : "text-red-600"
                                    }`}
                                >
                                    {selectedBooking.borewellResult?.status || "N/A"}
                                </span>
                            </p>
                            <p className="text-sm text-gray-600">
                                Base Amount (50%):{" "}
                                <span className="font-semibold">
                                    {formatCurrency((selectedBooking.payment?.totalAmount || 0) * 0.5)}
                                </span>
                            </p>
                        </div>

                        {selectedBooking.borewellResult?.status === "SUCCESS" ? (
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Incentive Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={settlementData.incentive || ""}
                                    onChange={(e) =>
                                        setSettlementData({
                                            ...settlementData,
                                            incentive: parseFloat(e.target.value) || 0,
                                        })
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter incentive amount"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Final Vendor Payment:{" "}
                                    {formatCurrency(
                                        (selectedBooking.payment?.totalAmount || 0) * 0.5 + (settlementData.incentive || 0)
                                    )}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Penalty Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max={(selectedBooking.payment?.totalAmount || 0) * 0.5}
                                        value={settlementData.penalty || ""}
                                        onChange={(e) =>
                                            setSettlementData({
                                                ...settlementData,
                                                penalty: parseFloat(e.target.value) || 0,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter penalty amount"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Final Vendor Payment:{" "}
                                        {formatCurrency(
                                            Math.max(
                                                0,
                                                (selectedBooking.payment?.totalAmount || 0) * 0.5 - (settlementData.penalty || 0)
                                            )
                                        )}
                                    </p>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        User Refund Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max={selectedBooking.payment?.remainingAmount || 0}
                                        value={settlementData.refundAmount || ""}
                                        onChange={(e) =>
                                            setSettlementData({
                                                ...settlementData,
                                                refundAmount: parseFloat(e.target.value) || 0,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter refund amount"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Max Refund: {formatCurrency(selectedBooking.payment?.remainingAmount || 0)}
                                    </p>
                                </div>
                            </>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowSettlementModal(false);
                                    setSelectedBooking(null);
                                    setSettlementData({ incentive: 0, penalty: 0, refundAmount: 0 });
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcessSettlement}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold text-sm"
                            >
                                Process Settlement
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

