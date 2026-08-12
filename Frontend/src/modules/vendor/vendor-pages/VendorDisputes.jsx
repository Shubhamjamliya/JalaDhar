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
    IoBulbOutline,
    IoChevronDownOutline,
    IoChevronUpOutline
} from "react-icons/io5";
import { getMyDisputes } from "../../../services/vendorApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import CustomDropdown from "../../shared/components/CustomDropdown";
import { VENDOR_EXPERT_FAQS } from "./VendorHelpSupport";

const STATUS_TABS = [
    { key: "", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "RESOLVED", label: "Resolved" },
    { key: "CLOSED", label: "Closed" },
    { key: "REJECTED", label: "Rejected" },
];

export default function VendorDisputes() {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };
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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
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
                            <span className="text-[11px] font-extrabold bg-teal-100/80 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                                {pagination.totalDisputes || disputes.length}
                            </span>
                        )}
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Manage your operational tickets &amp; complaints
                    </p>
                </div>
                <button
                    onClick={() => navigate("/vendor/disputes/create")}
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-teal-500/20 transition-all cursor-pointer shrink-0"
                >
                    <IoAddOutline className="text-base" />
                    <span>Raise Dispute</span>
                </button>
            </div>

            {/* Horizontal Filter Tabs */}
            <div className="space-y-2.5">
                {/* Scrollable Status Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1 sm:px-1.5 scroll-smooth touch-pan-x">
                    {STATUS_TABS.map((tab) => {
                        const isActive = filters.status === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setFilters({ ...filters, status: tab.key, page: 1 })}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border shrink-0 cursor-pointer active:scale-95 ${
                                    isActive
                                        ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                                        : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50"
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Sub-Filters: Category & Reset */}
                <div className="flex items-center gap-2 text-xs font-bold">
                    <div className="flex-1 min-w-0">
                        <CustomDropdown
                            options={[
                                { value: "", label: "All Categories" },
                                { value: "PAYMENT_ISSUE", label: "Payment Issue" },
                                { value: "SERVICE_QUALITY", label: "Service Quality" },
                                { value: "VENDOR_BEHAVIOR", label: "Expert Behavior" },
                                { value: "REPORT_ISSUE", label: "Report Issue" },
                                { value: "CANCELLATION", label: "Cancellation" },
                                { value: "REFUND", label: "Refund" },
                                { value: "OTHER", label: "Other" },
                            ]}
                            value={filters.type}
                            onChange={(val) => setFilters({ ...filters, type: val, page: 1 })}
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
                    <div className="w-14 h-14 bg-teal-50 border border-teal-100 rounded-2xl flex items-center justify-center mx-auto text-teal-600">
                        <IoHelpCircleOutline className="text-3xl" />
                    </div>
                    <div className="max-w-xs mx-auto space-y-1">
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">No Disputes Found</h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            {filters.status || filters.type
                                ? "No disputes match your current filter settings. Try resetting filters."
                                : "You haven't raised any disputes yet. Submit a ticket if you need assistance."}
                        </p>
                    </div>
                    <div className="pt-1">
                        <button
                            onClick={() => navigate("/vendor/disputes/create")}
                            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
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
                            onClick={() => navigate(`/vendor/disputes/${dispute._id}`)}
                            className="group bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-2xs hover:shadow-sm hover:border-teal-200 transition-all cursor-pointer space-y-3"
                        >
                            {/* Card Top */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                    <span className="inline-block text-[10px] font-extrabold text-teal-700 bg-teal-50/80 px-2 py-0.5 rounded border border-teal-100 uppercase tracking-wider">
                                        {getTypeLabel(dispute.type)}
                                    </span>
                                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
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
                                            <IoTicketOutline className="text-teal-600 text-xs" />
                                            <span>#{dispute.booking.toString().slice(-8).toUpperCase()}</span>
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-0.5 text-teal-700 font-bold text-[11px] group-hover:translate-x-0.5 transition-transform">
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

            {/* Expert FAQs Section */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4 mt-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Groundwater Survey FAQs
                        </h2>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            Expert Partner Guidelines &amp; Operational FAQs
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-2xs shrink-0">
                        <IoBulbOutline className="text-2xl" />
                    </div>
                </div>

                <div className="space-y-3">
                    {VENDOR_EXPERT_FAQS.map((faq, idx) => {
                        const isOpen = openFaq === idx;
                        return (
                            <div
                                key={idx}
                                className={`border rounded-2xl transition-all overflow-hidden ${
                                    isOpen
                                        ? "border-slate-300 shadow-2xs bg-slate-50/40"
                                        : "border-slate-200/80 hover:border-slate-300 bg-white"
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-800 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                                >
                                    <span className="leading-snug text-slate-900 font-extrabold">
                                        Q{idx + 1}. {faq.q}
                                    </span>
                                    <div className="p-1 rounded-full text-slate-400 shrink-0">
                                        {isOpen ? (
                                            <IoChevronUpOutline className="text-base text-slate-600" />
                                        ) : (
                                            <IoChevronDownOutline className="text-base" />
                                        )}
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-100 bg-white">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
