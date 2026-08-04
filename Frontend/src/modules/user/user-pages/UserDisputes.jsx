import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoAddOutline,
    IoTimeOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoChevronForwardOutline,
    IoRefreshOutline,
    IoHelpCircleOutline,
    IoTicketOutline,
    IoFilterOutline
} from "react-icons/io5";
import { getMyDisputes } from "../../../services/userApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";

import CustomDropdown from "../../shared/components/CustomDropdown";

const STATUS_TABS = [
    { key: "", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "RESOLVED", label: "Resolved" },
    { key: "CLOSED", label: "Closed" },
    { key: "REJECTED", label: "Rejected" },
];

const CATEGORY_OPTIONS = [
    { value: "", label: "All Categories" },
    { value: "PAYMENT_ISSUE", label: "Payment Issue" },
    { value: "SERVICE_QUALITY", label: "Service Quality" },
    { value: "VENDOR_BEHAVIOR", label: "Expert Behavior" },
    { value: "REPORT_ISSUE", label: "Report Issue" },
    { value: "CANCELLATION", label: "Cancellation" },
    { value: "REFUND", label: "Refund" },
    { value: "OTHER", label: "Other" },
];

export default function UserDisputes() {
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

    const getStatusBadge = (status) => {
        switch (status) {
            case "PENDING":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending
                    </span>
                );
            case "IN_PROGRESS":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        In Progress
                    </span>
                );
            case "RESOLVED":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <IoCheckmarkCircleOutline className="text-xs text-emerald-600" />
                        Resolved
                    </span>
                );
            case "REJECTED":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200/80">
                        <IoCloseCircleOutline className="text-xs text-red-600" />
                        Rejected
                    </span>
                );
            case "CLOSED":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Closed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {status}
                    </span>
                );
        }
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
        <div className="max-w-3xl mx-auto space-y-5 pb-12">
            {/* Header with compact CTA on top right */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span>My Disputes</span>
                        {disputes.length > 0 && (
                            <span className="text-[11px] font-extrabold bg-blue-100/80 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                                {pagination.totalDisputes || disputes.length}
                            </span>
                        )}
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Manage your complaints &amp; support tickets
                    </p>
                </div>
                <button
                    onClick={() => navigate("/user/disputes/create")}
                    className="inline-flex items-center gap-1.5 bg-[#0A84FF] hover:bg-blue-600 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
                >
                    <IoAddOutline className="text-base" />
                    <span>Raise Dispute</span>
                </button>
            </div>

            {/* Horizontal Filter Tabs */}
            <div className="space-y-2.5">
                {/* Scrollable Status Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {STATUS_TABS.map((tab) => {
                        const isActive = filters.status === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setFilters({ ...filters, status: tab.key, page: 1 })}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border cursor-pointer ${
                                    isActive
                                        ? "bg-[#0A84FF] text-white border-[#0A84FF] shadow-xs"
                                        : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50"
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Sub-Filters: Category & Reset */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                        <CustomDropdown
                            options={CATEGORY_OPTIONS}
                            value={filters.type}
                            onChange={(val) => setFilters({ ...filters, type: val, page: 1 })}
                            size="sm"
                            activeColor="blue"
                            placeholder="All Categories"
                        />
                    </div>

                    {(filters.status || filters.type) && (
                        <button
                            onClick={() => setFilters({ status: "", type: "", page: 1 })}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200/70 text-slate-600 text-xs font-bold rounded-xl transition-all border border-slate-200 shrink-0 cursor-pointer"
                        >
                            <IoRefreshOutline className="text-sm" />
                            <span>Reset</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="bg-white rounded-2xl p-10 border border-slate-100 flex justify-center items-center">
                    <LoadingSpinner message="Loading disputes..." />
                </div>
            ) : disputes.length === 0 ? (
                /* Empty State Card */
                <div className="bg-white rounded-2xl p-6 sm:p-8 text-center border border-slate-100/90 shadow-xs space-y-4">
                    <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto text-[#0A84FF]">
                        <IoHelpCircleOutline className="text-3xl" />
                    </div>
                    <div className="max-w-xs mx-auto space-y-1">
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">No Disputes Found</h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            {filters.status || filters.type
                                ? "No disputes match your current filter settings. Try resetting filters."
                                : "You haven't raised any disputes yet. If you have an issue, we're here to assist."}
                        </p>
                    </div>
                    <div className="pt-1">
                        <button
                            onClick={() => navigate("/user/disputes/create")}
                            className="inline-flex items-center gap-1.5 bg-[#0A84FF] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
                        >
                            <IoAddOutline className="text-base" />
                            <span>Raise a Dispute</span>
                        </button>
                    </div>
                </div>
            ) : (
                /* Dispute Cards List */
                <div className="space-y-3">
                    {disputes.map((dispute) => (
                        <div
                            key={dispute._id}
                            onClick={() => navigate(`/user/disputes/${dispute._id}`)}
                            className="group bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-2xs hover:shadow-sm hover:border-blue-200 transition-all cursor-pointer space-y-3"
                        >
                            {/* Card Top */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                    <span className="inline-block text-[10px] font-extrabold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                                        {getTypeLabel(dispute.type)}
                                    </span>
                                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0A84FF] transition-colors line-clamp-1">
                                        {dispute.subject || dispute.type}
                                    </h3>
                                </div>
                                <div className="shrink-0">
                                    {getStatusBadge(dispute.status)}
                                </div>
                            </div>

                            {/* Description Preview */}
                            <p className="text-xs text-slate-600 line-clamp-2 leading-normal font-medium">
                                {dispute.description}
                            </p>

                            {/* Card Footer */}
                            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-500 font-medium">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1 text-[11px]">
                                        <IoTimeOutline className="text-slate-400 text-xs" />
                                        <span>{formatDate(dispute.createdAt)}</span>
                                    </span>
                                    {dispute.booking && (
                                        <span className="flex items-center gap-1 text-[11px] text-slate-600 font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                                            <IoTicketOutline className="text-blue-500 text-xs" />
                                            <span>#{dispute.booking.toString().slice(-8).toUpperCase()}</span>
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-0.5 text-[#0A84FF] font-bold text-[11px] group-hover:translate-x-0.5 transition-transform">
                                    <span>Details</span>
                                    <IoChevronForwardOutline className="text-xs" />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between gap-3 bg-white rounded-2xl p-3 border border-slate-100 text-xs font-semibold text-slate-600">
                            <div>
                                Page <span className="font-bold text-slate-900">{pagination.currentPage}</span> of {pagination.totalPages}
                            </div>
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                    disabled={filters.page === 1}
                                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold disabled:opacity-40 transition-colors"
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                    disabled={filters.page >= pagination.totalPages}
                                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold disabled:opacity-40 transition-colors"
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
