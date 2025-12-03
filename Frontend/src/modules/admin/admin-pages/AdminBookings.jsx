import { useState, useEffect } from "react";
import {
    IoSearchOutline,
    IoEyeOutline,
    IoCalendarOutline,
    IoLocationOutline,
    IoPersonOutline,
    IoConstructOutline,
    IoTimeOutline,
    IoCloseOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoInformationCircleOutline,
} from "react-icons/io5";
import { getAllBookings } from "../../../services/adminApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import api from "../../../services/api";

export default function AdminBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const toast = useToast();
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        page: 1,
        limit: 20,
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalBookings: 0,
    });

    useEffect(() => {
        loadBookings();
    }, [filters.page, filters.status, filters.search]);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const params = {
                page: filters.page,
                limit: filters.limit,
            };
            if (filters.search) params.search = filters.search;
            if (filters.status) params.status = filters.status;

            const response = await getAllBookings(params);
            if (response.success) {
                setBookings(response.data.bookings || []);
                setPagination(response.data.pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalBookings: 0,
                });
            } else {
                toast.showError(response.message || "Failed to load bookings");
            }
        } catch (err) {
            console.error("Load bookings error:", err);
            handleApiError(err, "Failed to load bookings");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (bookingId) => {
        try {
            setDetailsLoading(true);
            setShowDetailsModal(true);
            // Fetch full booking details
            const response = await api.get(`/bookings/${bookingId}`);
            if (response.data.success) {
                setSelectedBooking(response.data.data.booking);
            } else {
                toast.showError("Failed to load booking details");
                setShowDetailsModal(false);
            }
        } catch (err) {
            console.error("Load booking details error:", err);
            handleApiError(err, "Failed to load booking details");
            setShowDetailsModal(false);
        } finally {
            setDetailsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const formatDateTime = (dateString, timeString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        const dateStr = date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
        return timeString ? `${dateStr} at ${timeString}` : dateStr;
    };

    const formatCurrency = (amount) => {
        if (!amount) return "₹0";
        return `₹${amount.toLocaleString("en-IN")}`;
    };

    const getStatusColor = (status) => {
        const statusColors = {
            PENDING: "bg-yellow-100 text-yellow-800",
            ASSIGNED: "bg-blue-100 text-blue-800",
            ACCEPTED: "bg-green-100 text-green-800",
            VISITED: "bg-purple-100 text-purple-800",
            REPORT_UPLOADED: "bg-indigo-100 text-indigo-800",
            AWAITING_PAYMENT: "bg-orange-100 text-orange-800",
            PAYMENT_SUCCESS: "bg-teal-100 text-teal-800",
            BOREWELL_UPLOADED: "bg-cyan-100 text-cyan-800",
            ADMIN_APPROVED: "bg-emerald-100 text-emerald-800",
            FINAL_SETTLEMENT: "bg-amber-100 text-amber-800",
            COMPLETED: "bg-green-100 text-green-800",
            CANCELLED: "bg-red-100 text-red-800",
        };
        return statusColors[status] || "bg-gray-100 text-gray-800";
    };

    const formatAddress = (address) => {
        if (!address) return "N/A";
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.pincode) parts.push(address.pincode);
        return parts.join(", ") || "N/A";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Manage and view all booking requests
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                            <input
                                type="text"
                                placeholder="Search by user, vendor, or service..."
                                value={filters.search}
                                onChange={(e) => {
                                    setFilters({ ...filters, search: e.target.value, page: 1 });
                                }}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="md:w-48">
                        <select
                            value={filters.status}
                            onChange={(e) => {
                                setFilters({ ...filters, status: e.target.value, page: 1 });
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="ASSIGNED">Assigned</option>
                            <option value="ACCEPTED">Accepted</option>
                            <option value="VISITED">Visited</option>
                            <option value="REPORT_UPLOADED">Report Uploaded</option>
                            <option value="PAYMENT_SUCCESS">Payment Success</option>
                            <option value="BOREWELL_UPLOADED">Borewell Uploaded</option>
                            <option value="ADMIN_APPROVED">Admin Approved</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Bookings List */}
            {bookings.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <IoCalendarOutline className="mx-auto text-6xl text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Found</h3>
                    <p className="text-gray-600">
                        {filters.search || filters.status
                            ? "Try adjusting your filters"
                            : "No bookings have been created yet"}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Booking ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vendor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Service
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bookings.map((booking) => (
                                    <tr
                                        key={booking._id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-gray-900">
                                                #{booking._id.toString().slice(-8).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {booking.user?.name || "N/A"}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {booking.user?.email || ""}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {booking.vendor?.name || "N/A"}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {booking.vendor?.email || ""}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {booking.service?.name || "N/A"}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {formatCurrency(booking.service?.price || booking.payment?.subtotal || 0)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(booking.scheduledDate)}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {booking.scheduledTime || ""}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                                    booking.status
                                                )}`}
                                            >
                                                {booking.status || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {formatCurrency(booking.payment?.totalAmount || 0)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleViewDetails(booking._id)}
                                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                            >
                                                <IoEyeOutline className="text-lg" />
                                                View
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
                                {Math.min(pagination.currentPage * filters.limit, pagination.totalBookings)} of{" "}
                                {pagination.totalBookings} bookings
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                    disabled={filters.page === 1}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                    disabled={filters.page >= pagination.totalPages}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Booking Details Modal */}
            {showDetailsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                            <button
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setSelectedBooking(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <IoCloseOutline className="text-2xl" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        {detailsLoading ? (
                            <div className="flex items-center justify-center p-12">
                                <LoadingSpinner />
                            </div>
                        ) : selectedBooking ? (
                            <div className="p-6 space-y-6">
                                {/* Booking Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Booking ID</h3>
                                        <p className="text-lg font-semibold text-gray-900">
                                            #{selectedBooking._id.toString().slice(-8).toUpperCase()}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                                        <span
                                            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                                                selectedBooking.status
                                            )}`}
                                        >
                                            {selectedBooking.status || "N/A"}
                                        </span>
                                    </div>
                                </div>

                                {/* User Info */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <IoPersonOutline className="text-xl" />
                                        User Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Name</p>
                                            <p className="text-base font-medium text-gray-900">
                                                {selectedBooking.user?.name || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Email</p>
                                            <p className="text-base font-medium text-gray-900">
                                                {selectedBooking.user?.email || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Phone</p>
                                            <p className="text-base font-medium text-gray-900">
                                                {selectedBooking.user?.phone || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Vendor Info */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <IoConstructOutline className="text-xl" />
                                        Vendor Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Name</p>
                                            <p className="text-base font-medium text-gray-900">
                                                {selectedBooking.vendor?.name || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Email</p>
                                            <p className="text-base font-medium text-gray-900">
                                                {selectedBooking.vendor?.email || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Phone</p>
                                            <p className="text-base font-medium text-gray-900">
                                                {selectedBooking.vendor?.phone || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Service & Location */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-500">Service Name</p>
                                                <p className="text-base font-medium text-gray-900">
                                                    {selectedBooking.service?.name || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Service Price</p>
                                                <p className="text-base font-medium text-gray-900">
                                                    {formatCurrency(selectedBooking.service?.price || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <IoLocationOutline className="text-xl" />
                                            Location
                                        </h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-500">Address</p>
                                                <p className="text-base font-medium text-gray-900">
                                                    {formatAddress(selectedBooking.address)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Scheduled Date & Time</p>
                                                <p className="text-base font-medium text-gray-900">
                                                    {formatDateTime(selectedBooking.scheduledDate, selectedBooking.scheduledTime)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Info */}
                                {selectedBooking.payment && (
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Subtotal</p>
                                                <p className="text-base font-medium text-gray-900">
                                                    {formatCurrency(selectedBooking.payment.subtotal || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Travel Charges</p>
                                                <p className="text-base font-medium text-gray-900">
                                                    {formatCurrency(selectedBooking.payment.travelCharges || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">GST</p>
                                                <p className="text-base font-medium text-gray-900">
                                                    {formatCurrency(selectedBooking.payment.gst || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Total Amount</p>
                                                <p className="text-base font-medium text-gray-900">
                                                    {formatCurrency(selectedBooking.payment.totalAmount || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Advance Paid</p>
                                                <p className="text-base font-medium text-gray-900">
                                                    {selectedBooking.payment.advancePaid ? (
                                                        <span className="text-green-600 flex items-center gap-1">
                                                            <IoCheckmarkCircleOutline /> Yes
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-600 flex items-center gap-1">
                                                            <IoCloseCircleOutline /> No
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Remaining Paid</p>
                                                <p className="text-base font-medium text-gray-900">
                                                    {selectedBooking.payment.remainingPaid ? (
                                                        <span className="text-green-600 flex items-center gap-1">
                                                            <IoCheckmarkCircleOutline /> Yes
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-600 flex items-center gap-1">
                                                            <IoCloseCircleOutline /> No
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Report Info */}
                                {selectedBooking.report && (
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-500">Water Found</p>
                                                <p className="text-base font-medium text-gray-900">
                                                    {selectedBooking.report.waterFound ? "Yes" : "No"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Uploaded At</p>
                                                <p className="text-base font-medium text-gray-900">
                                                    {formatDateTime(selectedBooking.report.uploadedAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Borewell Result */}
                                {selectedBooking.borewellResult && (
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Borewell Result</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-500">Status</p>
                                                <p className="text-base font-medium text-gray-900">
                                                    {selectedBooking.borewellResult.status || "N/A"}
                                                </p>
                                            </div>
                                            {selectedBooking.borewellResult.uploadedAt && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Uploaded At</p>
                                                    <p className="text-base font-medium text-gray-900">
                                                        {formatDateTime(selectedBooking.borewellResult.uploadedAt)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Timestamps */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <IoTimeOutline className="text-xl" />
                                        Timestamps
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Created At</p>
                                            <p className="text-base font-medium text-gray-900">
                                                {formatDateTime(selectedBooking.createdAt)}
                                            </p>
                                        </div>
                                        {selectedBooking.acceptedAt && (
                                            <div>
                                                <p className="text-sm text-gray-500">Accepted At</p>
                                                <p className="text-base font-medium text-gray-900">
                                                    {formatDateTime(selectedBooking.acceptedAt)}
                                                </p>
                                            </div>
                                        )}
                                        {selectedBooking.visitedAt && (
                                            <div>
                                                <p className="text-sm text-gray-500">Visited At</p>
                                                <p className="text-base font-medium text-gray-900">
                                                    {formatDateTime(selectedBooking.visitedAt)}
                                                </p>
                                            </div>
                                        )}
                                        {selectedBooking.completedAt && (
                                            <div>
                                                <p className="text-sm text-gray-500">Completed At</p>
                                                <p className="text-base font-medium text-gray-900">
                                                    {formatDateTime(selectedBooking.completedAt)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <IoInformationCircleOutline className="mx-auto text-4xl text-gray-400 mb-4" />
                                <p className="text-gray-600">Failed to load booking details</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

