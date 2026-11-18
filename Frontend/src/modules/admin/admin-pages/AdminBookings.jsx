import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    IoSwapHorizontalOutline
} from "react-icons/io5";
import { getAllBookings, assignBookingOperationsApi, getAllAdmins } from "../../../services/adminApi";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import AssignmentHistoryModal from "../admin-component/AssignmentHistoryModal";
import api from "../../../services/api";

export default function AdminBookings() {
    const navigate = useNavigate();
    const { admin: currentAdmin } = useAdminAuth();
    const [bookings, setBookings] = useState([]);
    const [availableOpsAdmins, setAvailableOpsAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
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

    const isSuperAdmin = currentAdmin?.role === "SUPER_ADMIN";

    useEffect(() => {
        loadBookings();
        loadAvailableOpsAdmins();
    }, [filters.page, filters.status, filters.search]);

    const loadAvailableOpsAdmins = async () => {
        try {
            const res = await getAllAdmins();
            if (res.success && res.data?.admins) {
                const opsAdmins = res.data.admins.filter(a =>
                    a.isActive && ['OPERATIONS_ADMIN', 'SUPER_ADMIN'].includes(a.role)
                );
                setAvailableOpsAdmins(opsAdmins);
            }
        } catch (err) {
            console.error("Failed to load operations admins:", err);
        }
    };

    const handleReassignBooking = async (newAdminId, reason, notesText) => {
        if (!selectedBooking) return;
        try {
            const res = await assignBookingOperationsApi(selectedBooking._id, {
                assignedTo: newAdminId,
                reason,
                notes: notesText
            });
            if (res.success) {
                toast.showSuccess("Booking operations reassigned successfully!");
                setShowAssignmentModal(false);
                setSelectedBooking(null);
                await loadBookings();
            } else {
                toast.showError(res.message || "Failed to reassign booking");
            }
        } catch (err) {
            console.error("Reassign error:", err);
            toast.showError("Failed to reassign booking");
        }
    };

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
        if (!amount && amount !== 0) return "₹0";
        return `₹${Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
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
            EXPERT_CANCELLED: "bg-amber-100 text-amber-900 font-bold border border-amber-300",
            UNABLE_TO_COMPLETE: "bg-orange-100 text-orange-900 font-bold border border-orange-300",
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
        <div className="space-y-4">
            {/* Header with Integrated Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">All Bookings</h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Manage and track all customer booking requests ({pagination.totalBookings || 0} total)
                    </p>
                </div>
                <div className="w-full sm:w-72 md:w-80 relative">
                    <IoSearchOutline className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-base" />
                    <input
                        type="text"
                        placeholder="Search user, expert, or service..."
                        value={filters.search}
                        onChange={(e) => {
                            setFilters({ ...filters, search: e.target.value, page: 1 });
                        }}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Workflow Lifecycle Quick Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                    { id: 'all', label: 'All Bookings', status: '' },
                    { id: 'pending', label: 'New / Pending', status: 'PENDING' },
                    { id: 'accepted', label: 'Accepted', status: 'ACCEPTED' },
                    { id: 'visited', label: 'Site Visited', status: 'VISITED' },
                    { id: 'report_uploaded', label: 'Report Uploaded', status: 'REPORT_UPLOADED' },
                    { id: 'borewell_uploaded', label: 'Borewell Uploaded', status: 'BOREWELL_UPLOADED' },
                    { id: 'expert_cancelled', label: 'Expert Cancelled', status: 'EXPERT_CANCELLED' },
                    { id: 'unable_to_complete', label: 'Unable to Complete', status: 'UNABLE_TO_COMPLETE' },
                    { id: 'completed', label: 'Completed', status: 'COMPLETED' },
                    { id: 'cancelled', label: 'Cancelled', status: 'CANCELLED' },
                ].map((tab) => {
                    const isSelected = filters.status === tab.status;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setFilters({ ...filters, status: tab.status, page: 1 })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                isSelected
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200/70 hover:border-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Bookings List */}
            {bookings.length === 0 ? (
                <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-12 text-center">
                    <IoCalendarOutline className="mx-auto text-5xl text-gray-300 mb-3" />
                    <h3 className="text-base font-semibold text-gray-900 mb-1">No Bookings Found</h3>
                    <p className="text-xs text-gray-500">
                        {filters.search || filters.status
                            ? "Try adjusting your filters"
                            : "No bookings have been created yet"}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-xs border border-gray-200/70 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[960px]">
                            <thead className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="pl-5 pr-3 py-3 w-[115px] whitespace-nowrap">
                                        Booking ID
                                    </th>
                                    <th className="px-3 py-3 w-[150px] whitespace-nowrap">
                                        User
                                    </th>
                                    <th className="px-3 py-3 w-[160px] whitespace-nowrap">
                                        Expert
                                    </th>
                                    <th className="px-3 py-3 w-[160px] whitespace-nowrap">
                                        Service
                                    </th>
                                    <th className="px-3 py-3 w-[115px] whitespace-nowrap">
                                        Date & Time
                                    </th>
                                    <th className="px-3 py-3 w-[100px] whitespace-nowrap">
                                        Status
                                    </th>
                                    <th className="px-3 py-3 w-[125px] whitespace-nowrap">
                                        Assigned Ops
                                    </th>
                                    <th className="px-3 py-3 w-[85px] whitespace-nowrap text-right">
                                        Amount
                                    </th>
                                    <th className="pl-3 pr-5 py-3 w-[80px] whitespace-nowrap text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100 text-xs">
                                {bookings.map((booking) => (
                                    <tr
                                        key={booking._id}
                                        className="hover:bg-blue-50/30 transition-colors"
                                    >
                                        {/* Booking ID */}
                                        <td className="pl-5 pr-3 py-3 whitespace-nowrap">
                                            <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                                                #{booking._id.toString().slice(-8).toUpperCase()}
                                            </span>
                                        </td>

                                        {/* User */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <div className="font-semibold text-gray-900 leading-tight">
                                                {booking.user?.name || "N/A"}
                                            </div>
                                            <div className="text-[11px] text-gray-400 font-normal truncate max-w-[140px]" title={booking.user?.email}>
                                                {booking.user?.email || "—"}
                                            </div>
                                        </td>

                                        {/* Expert */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <div className="font-semibold text-gray-900 leading-tight">
                                                {booking.vendor?.name || "N/A"}
                                            </div>
                                            <div className="text-[11px] text-gray-400 font-normal truncate max-w-[150px]" title={booking.vendor?.email}>
                                                {booking.vendor?.email || "—"}
                                            </div>
                                        </td>

                                        {/* Service */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <div className="font-medium text-gray-900 truncate max-w-[160px]" title={booking.service?.name}>
                                                {booking.service?.name || "N/A"}
                                            </div>
                                            <div className="text-[11px] text-gray-500 font-medium">
                                                {formatCurrency(booking.service?.price || booking.payment?.subtotal || 0)}
                                            </div>
                                        </td>

                                        {/* Date */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <div className="font-medium text-gray-800">
                                                {formatDate(booking.scheduledDate)}
                                            </div>
                                            <div className="text-[11px] text-gray-400 font-normal">
                                                {booking.scheduledTime || "TBD"}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <span
                                                className={`inline-flex px-2 py-0.5 text-[11px] font-bold rounded-full ${getStatusColor(
                                                    booking.status
                                                )}`}
                                            >
                                                {booking.status || "N/A"}
                                            </span>
                                        </td>

                                        {/* Assigned Operations Admin Chip */}
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedBooking(booking);
                                                    setShowAssignmentModal(true);
                                                }}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors cursor-pointer"
                                                title={booking.assignedTo?.name ? `Assigned to ${booking.assignedTo.name}` : "Auto-Assigned"}
                                            >
                                                <IoPersonOutline className="text-xs shrink-0" />
                                                <span className="truncate max-w-[90px]">{booking.assignedTo?.name || "Auto-Assigned"}</span>
                                                {isSuperAdmin && <IoSwapHorizontalOutline className="text-xs ml-0.5 text-indigo-500 shrink-0" />}
                                            </button>
                                        </td>

                                        {/* Amount */}
                                        <td className="px-3 py-3 whitespace-nowrap text-right">
                                            <span className="font-bold text-gray-900 text-xs">
                                                {formatCurrency(booking.payment?.totalAmount || 0)}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="pl-3 pr-5 py-3 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => navigate(`/admin/bookings/${booking._id}`)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors cursor-pointer"
                                            >
                                                <IoEyeOutline className="text-sm" />
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
                        <div className="bg-gray-50/80 px-5 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
                            <div>
                                Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{" "}
                                {Math.min(pagination.currentPage * filters.limit, pagination.totalBookings)} of{" "}
                                {pagination.totalBookings} bookings
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                    disabled={filters.page === 1}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                    disabled={filters.page >= pagination.totalPages}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
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

                                 {/* Expert Info */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <IoConstructOutline className="text-xl" />
                                        Expert Information
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

                                {/* Cancellation & Audit Information */}
                                {(selectedBooking.status === "EXPERT_CANCELLED" || selectedBooking.cancellationDetails?.cancelledBy || selectedBooking.status === "CANCELLED") && (
                                    <div className="border border-amber-200 bg-amber-50/40 rounded-lg p-4">
                                        <h3 className="text-base font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                                            <span>Cancellation & Audit Info</span>
                                            {selectedBooking.cancellationDetails?.isSameDay && (
                                                <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full uppercase">
                                                    Same-Day
                                                </span>
                                            )}
                                        </h3>
                                        <div className="text-xs space-y-1.5 text-gray-700">
                                            <p><span className="font-semibold text-gray-500">Cancelled By:</span> {selectedBooking.cancellationDetails?.cancelledBy || selectedBooking.cancelledBy || "N/A"}</p>
                                            <p><span className="font-semibold text-gray-500">Reason:</span> {selectedBooking.cancellationDetails?.reason || selectedBooking.cancellationReason || "N/A"}</p>
                                            {selectedBooking.cancellationDetails?.userResolution && (
                                                <p><span className="font-semibold text-blue-600">Resolution Status:</span> {selectedBooking.cancellationDetails.userResolution.status}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* On-Site Infeasibility Information */}
                                {(selectedBooking.status === "UNABLE_TO_COMPLETE" || selectedBooking.unableToCompleteDetails?.reported) && (
                                    <div className="border border-orange-200 bg-orange-50/40 rounded-lg p-4">
                                        <h3 className="text-base font-bold text-orange-900 mb-2">On-Site Infeasibility</h3>
                                        <div className="text-xs space-y-1.5 text-gray-700">
                                            <p><span className="font-semibold text-gray-500">Category:</span> {selectedBooking.unableToCompleteDetails?.reasonCategory || "N/A"}</p>
                                            <p><span className="font-semibold text-gray-500">Description:</span> {selectedBooking.unableToCompleteDetails?.reasonDescription || "N/A"}</p>
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

            {/* Universal Assignment History Modal for Operations */}
            <AssignmentHistoryModal
                isOpen={showAssignmentModal}
                onClose={() => {
                    setShowAssignmentModal(false);
                    setSelectedBooking(null);
                }}
                entityTitle={`Booking #${selectedBooking?._id?.toString().slice(-8).toUpperCase()}`}
                assignedTo={selectedBooking?.assignedTo}
                assignmentHistory={selectedBooking?.assignmentHistory || []}
                availableAdmins={availableOpsAdmins}
                onReassign={handleReassignBooking}
                isSuperAdmin={isSuperAdmin}
            />
        </div>
    );
}

