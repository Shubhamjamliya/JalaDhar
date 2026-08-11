import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoReceiptOutline,
    IoCheckmarkCircle,
    IoDownloadOutline,
    IoCalendarOutline,
    IoPersonOutline,
    IoWalletOutline,
    IoSearchOutline,
    IoEyeOutline,
    IoCashOutline
} from "react-icons/io5";
import { getUserBookings } from "../../../services/bookingApi";
import PageContainer from "../../shared/components/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";

export default function UserPaymentsInvoices() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [bookings, setBookings] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getUserBookings({ limit: 50 });
            if (response.success) {
                setBookings(response.data.bookings || []);
            } else {
                setError(response.message || "Failed to load payments");
            }
        } catch (err) {
            console.error("Load payments error:", err);
            setError("Failed to load payments & invoices");
        } finally {
            setLoading(false);
        }
    };

    // Post-advance payment statuses
    const postAdvanceStatuses = [
        'ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'VISITED', 'REPORT_UPLOADED', 
        'AWAITING_PAYMENT', 'PAYMENT_SUCCESS', 'PAID_FIRST', 'BOREWELL_UPLOADED', 
        'ADMIN_APPROVED', 'FINAL_SETTLEMENT', 'COMPLETED'
    ];

    // Helper to evaluate payment flags for a booking
    const getBookingPaymentInfo = (b) => {
        const p = b.payment || b.paymentStatus || {};
        const statusUpper = (b.status || '').toUpperCase();
        const pStatusUpper = (p.status || '').toUpperCase();

        const isFullyPaid = Boolean(
            p.remainingPaid || 
            b.remainingPaid || 
            statusUpper === 'COMPLETED' || 
            statusUpper === 'FINAL_SETTLEMENT' ||
            pStatusUpper === 'COMPLETED' ||
            pStatusUpper === 'PAID'
        );

        const isAdvancePaid = Boolean(
            isFullyPaid || 
            p.advancePaid || 
            b.advancePaid || 
            postAdvanceStatuses.includes(statusUpper) ||
            pStatusUpper === 'ADVANCE_PAID' ||
            pStatusUpper === 'PAID_FIRST'
        );

        const totalAmount = p.totalAmount || b.pricing?.totalPrice || b.totalPrice || ((p.advanceAmount || b.advanceAmount || 0) + (p.remainingAmount || b.remainingAmount || 0)) || 0;
        const advAmount = p.advanceAmount || b.advanceAmount || (totalAmount ? Math.round(totalAmount * 0.4) : 0);
        const remAmount = p.remainingAmount || b.remainingAmount || (totalAmount ? totalAmount - advAmount : 0);

        const paidSoFar = isFullyPaid ? totalAmount : (isAdvancePaid ? advAmount : 0);

        return {
            isAdvancePaid,
            isFullyPaid,
            totalAmount,
            advAmount,
            remAmount,
            paidSoFar
        };
    };

    // Calculate dynamic totals & filter paid bookings
    const paidBookings = bookings.filter(b => {
        const { isAdvancePaid, isFullyPaid } = getBookingPaymentInfo(b);
        return isAdvancePaid || isFullyPaid;
    });

    const totalPaidAmount = paidBookings.reduce((sum, b) => {
        const { paidSoFar } = getBookingPaymentInfo(b);
        return sum + paidSoFar;
    }, 0);

    const advanceOnlyCount = paidBookings.filter(b => {
        const info = getBookingPaymentInfo(b);
        return info.isAdvancePaid && !info.isFullyPaid;
    }).length;

    const fullyPaidCount = paidBookings.filter(b => getBookingPaymentInfo(b).isFullyPaid).length;

    const filteredBookings = paidBookings.filter(b => {
        const info = getBookingPaymentInfo(b);

        // Status Filter
        if (statusFilter === 'ADVANCE_PAID' && (info.isFullyPaid || !info.isAdvancePaid)) return false;
        if (statusFilter === 'FULLY_PAID' && !info.isFullyPaid) return false;

        // Search Query
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        return (b.bookingId && b.bookingId.toLowerCase().includes(query)) ||
            (b._id && b._id.toLowerCase().includes(query)) ||
            (b.vendor?.name && b.vendor.name.toLowerCase().includes(query)) ||
            (b.service?.name && b.service.name.toLowerCase().includes(query));
    });

    return (
        <PageContainer title="Payments & Invoices">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Stats Header Card */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
                                    <IoReceiptOutline className="text-2xl text-white" />
                                </div>
                                <h1 className="text-2xl font-bold">Payments & Receipts</h1>
                            </div>
                            <p className="text-teal-100 text-sm">
                                View advance payment receipts, final invoices, and transaction histories.
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shrink-0">
                            <span className="text-xs text-teal-100 uppercase tracking-wide block font-semibold">Total Paid Amount</span>
                            <span className="text-2xl font-extrabold text-white">₹{totalPaidAmount.toLocaleString("en-IN")}</span>
                        </div>
                    </div>
                </div>

                {/* Controls Bar: Search & Filter Tabs */}
                <div className="space-y-3">
                    {/* Search Input */}
                    <div className="relative">
                        <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                        <input
                            type="text"
                            placeholder="Search invoice by Booking ID or Expert..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
                        />
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <button
                            onClick={() => setStatusFilter('ALL')}
                            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                statusFilter === 'ALL'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                        >
                            <span>All Payments</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                {paidBookings.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setStatusFilter('ADVANCE_PAID')}
                            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                statusFilter === 'ADVANCE_PAID'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                        >
                            <span>Advance Paid</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === 'ADVANCE_PAID' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                {advanceOnlyCount}
                            </span>
                        </button>

                        <button
                            onClick={() => setStatusFilter('FULLY_PAID')}
                            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                statusFilter === 'FULLY_PAID'
                                    ? 'bg-green-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                        >
                            <span>Fully Paid</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === 'FULLY_PAID' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                {fullyPaidCount}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="py-20 flex justify-center">
                        <LoadingSpinner message="Loading payments and invoices..." />
                    </div>
                ) : error ? (
                    <ErrorMessage message={error} />
                ) : filteredBookings.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500 text-2xl">
                            <IoReceiptOutline />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">No Invoices Found</h3>
                        <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                            Invoices and official receipts are generated automatically once payment transactions are completed.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredBookings.map((booking) => {
                            const { isFullyPaid, totalAmount, remAmount, paidSoFar } = getBookingPaymentInfo(booking);

                            return (
                                <div
                                    key={booking._id}
                                    onClick={() => navigate(`/user/booking/${booking._id}`)}
                                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-emerald-200 group"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-100">
                                                ID: {booking.bookingId || booking._id?.slice(-8)}
                                            </span>
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                                isFullyPaid ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                                            }`}>
                                                {isFullyPaid ? "Fully Paid" : "Advance Paid"}
                                            </span>
                                            {!isFullyPaid && remAmount > 0 && (
                                                <span className="px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 bg-amber-50 rounded-full border border-amber-200">
                                                    Remaining: ₹{remAmount.toLocaleString("en-IN")}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                                            {booking.service?.name || "Groundwater Survey"}
                                        </h3>

                                        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <IoPersonOutline className="text-emerald-600" />
                                                <strong>Expert:</strong> {booking.vendor?.name || "Assigned Expert"}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <IoCashOutline className="text-emerald-600" />
                                                <strong>Amount Paid:</strong> ₹{paidSoFar.toLocaleString("en-IN")} / ₹{totalAmount.toLocaleString("en-IN")}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => navigate(`/user/booking/${booking._id}/invoice`)}
                                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <IoReceiptOutline className="text-base text-emerald-600" />
                                            <span>{isFullyPaid ? "Tax Invoice" : "Advance Receipt"}</span>
                                        </button>

                                        {!isFullyPaid && (
                                            <button
                                                onClick={() => navigate(`/user/booking/${booking._id}`)}
                                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <IoWalletOutline className="text-base" />
                                                <span>Pay Balance (₹{remAmount.toLocaleString("en-IN")})</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </PageContainer>
    );
}
