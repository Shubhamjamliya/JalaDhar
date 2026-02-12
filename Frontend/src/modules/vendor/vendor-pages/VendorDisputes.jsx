import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoAlertCircleOutline,
    IoAddOutline,
    IoEyeOutline,
    IoTimeOutline,
} from "react-icons/io5";
import { getMyDisputes } from "../../../services/vendorApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";

export default function VendorDisputes() {
    const navigate = useNavigate();
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const [filters, setFilters] = useState({
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

    useEffect(() => {
        loadDisputes();
    }, [filters.page, filters.status, filters.type]);

    const loadDisputes = async () => {
        try {
            setLoading(true);
            const params = {
                page: filters.page,
                limit: filters.limit,
            };
            if (filters.status) params.status = filters.status;
            if (filters.type) params.type = filters.type;

            const response = await getMyDisputes(params);
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

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
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

    const getPriorityColor = (priority) => {
        const colors = {
            LOW: "bg-gray-100 text-gray-700",
            MEDIUM: "bg-yellow-100 text-yellow-700",
            HIGH: "bg-orange-100 text-orange-700",
            URGENT: "bg-red-100 text-red-700",
        };
        return colors[priority] || "bg-gray-100 text-gray-700";
    };

    const CustomDropdown = ({ options, value, onChange }) => {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useState(null)[1]; // simplified ref for outside click if needed, but simple toggle is enough for now

        // Close logic could be added with a click-outside hook, but for now simple toggle

        return (
            <div className="relative min-w-0">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full h-10 px-4 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-white flex items-center justify-between truncate"
                >
                    <span className="truncate">{options.find(o => o.value === value)?.label || options[0].label}</span>
                    <span className="ml-2 text-gray-400 text-xs">▼</span>
                </button>

                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                        ></div>
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {options.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 truncate ${value === option.value ? "text-[#0A84FF] font-medium bg-blue-50" : "text-gray-700"
                                        }`}
                                >
                                    {option.label}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Disputes</h1>
                    <p className="text-sm text-gray-500 mt-1">View and manage your disputes</p>
                </div>
                <button
                    onClick={() => navigate("/vendor/disputes/create")}
                    className="bg-[#0A84FF] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#005BBB] transition-colors flex items-center gap-2"
                >
                    <IoAddOutline className="text-xl" />
                    <span>Raise Dispute</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm md:text-base">
                    <CustomDropdown
                        options={[
                            { value: "", label: "All Status" },
                            { value: "PENDING", label: "Pending" },
                            { value: "IN_PROGRESS", label: "In Progress" },
                            { value: "RESOLVED", label: "Resolved" },
                            { value: "CLOSED", label: "Closed" },
                            { value: "REJECTED", label: "Rejected" },
                        ]}
                        value={filters.status}
                        onChange={(val) => setFilters({ ...filters, status: val, page: 1 })}
                    />
                    <CustomDropdown
                        options={[
                            { value: "", label: "All Types" },
                            { value: "PAYMENT_ISSUE", label: "Payment Issue" },
                            { value: "SERVICE_QUALITY", label: "Service Quality" },
                            { value: "VENDOR_BEHAVIOR", label: "Vendor Behavior" },
                            { value: "REPORT_ISSUE", label: "Report Issue" },
                            { value: "CANCELLATION", label: "Cancellation" },
                            { value: "REFUND", label: "Refund" },
                            { value: "OTHER", label: "Other" },
                        ]}
                        value={filters.type}
                        onChange={(val) => setFilters({ ...filters, type: val, page: 1 })}
                    />
                    <div className="min-w-0">
                        <button
                            onClick={() => setFilters({ status: "", type: "", page: 1 })}
                            className="w-full h-10 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors bg-white font-medium border border-gray-300"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Disputes List */}
            {loading ? (
                <LoadingSpinner message="Loading disputes..." />
            ) : disputes.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <IoAlertCircleOutline className="mx-auto text-6xl text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Disputes Found</h3>
                    <p className="text-gray-600 mb-4">You haven't raised any disputes yet</p>
                    <button
                        onClick={() => navigate("/vendor/disputes/create")}
                        className="bg-[#0A84FF] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#005BBB] transition-colors"
                    >
                        Raise Your First Dispute
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {disputes.map((dispute) => (
                        <div
                            key={dispute._id}
                            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/vendor/disputes/${dispute._id}`)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{dispute.subject}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-2">{dispute.description}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2 ml-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}>
                                        {dispute.status}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(dispute.priority)}`}>
                                        {dispute.priority}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <IoTimeOutline />
                                        {formatDate(dispute.createdAt)}
                                    </span>
                                    <span>{getTypeLabel(dispute.type)}</span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/vendor/disputes/${dispute._id}`);
                                    }}
                                    className="text-[#0A84FF] hover:text-[#005BBB] flex items-center gap-1"
                                >
                                    <IoEyeOutline className="text-lg" />
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
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
        </div>
    );
}

