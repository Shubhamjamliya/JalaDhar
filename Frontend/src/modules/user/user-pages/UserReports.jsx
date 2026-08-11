import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoDocumentTextOutline,
    IoEyeOutline,
    IoCalendarOutline,
    IoPersonOutline,
    IoSearchOutline,
    IoWalletOutline,
    IoCheckmarkCircleOutline
} from "react-icons/io5";
import { getUserBookings } from "../../../services/bookingApi";
import PageContainer from "../../shared/components/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import { useToast } from "../../../hooks/useToast";

export default function UserReports() {
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [bookings, setBookings] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    useEffect(() => {
        window.scrollTo(0, 0);
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
                setError(response.message || "Failed to load reports");
            }
        } catch (err) {
            console.error("Load reports error:", err);
            setError("Failed to load survey reports");
        } finally {
            setLoading(false);
        }
    };

    // Post-report statuses
    const postReportStatuses = [
        'REPORT_UPLOADED', 'AWAITING_PAYMENT', 'PAYMENT_SUCCESS', 
        'PAID_FIRST', 'BOREWELL_UPLOADED', 'ADMIN_APPROVED', 'FINAL_SETTLEMENT', 'COMPLETED'
    ];

    const getReportPaymentInfo = (b) => {
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

        const totalAmount = p.totalAmount || b.pricing?.totalPrice || b.totalPrice || 0;
        const advAmount = p.advanceAmount || b.advanceAmount || (totalAmount ? Math.round(totalAmount * 0.4) : 0);
        const remAmount = p.remainingAmount || b.remainingAmount || (totalAmount ? totalAmount - advAmount : 0);

        return {
            isFullyPaid,
            remAmount
        };
    };

    // Filter bookings that have a report uploaded
    const allReportBookings = bookings.filter(booking => {
        const statusUpper = (booking.status || '').toUpperCase();
        return booking.visitReport || booking.reportUploadedAt || postReportStatuses.includes(statusUpper);
    });

    const readyCount = allReportBookings.filter(b => getReportPaymentInfo(b).isFullyPaid).length;
    const awaitingPaymentCount = allReportBookings.filter(b => !getReportPaymentInfo(b).isFullyPaid).length;

    const filteredBookings = allReportBookings.filter(booking => {
        const { isFullyPaid } = getReportPaymentInfo(booking);

        if (statusFilter === 'AVAILABLE' && !isFullyPaid) return false;
        if (statusFilter === 'AWAITING_PAYMENT' && isFullyPaid) return false;

        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        return (booking.bookingId && booking.bookingId.toLowerCase().includes(query)) ||
            (booking._id && booking._id.toLowerCase().includes(query)) ||
            (booking.vendor?.name && booking.vendor.name.toLowerCase().includes(query)) ||
            (booking.service?.name && booking.service.name.toLowerCase().includes(query));
    });

    return (
        <PageContainer title="Survey Reports">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
                                <IoDocumentTextOutline className="text-2xl text-white" />
                            </div>
                            <h1 className="text-2xl font-bold">Hydrogeological Survey Reports</h1>
                        </div>
                        <p className="text-blue-100 text-sm max-w-xl">
                            Access and download official survey reports, water table observations, depth estimates, and expert recommendations for all your bookings.
                        </p>
                    </div>
                </div>

                {/* Controls Bar: Search & Filter Tabs */}
                <div className="space-y-3">
                    {/* Search Bar */}
                    <div className="relative">
                        <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                        <input
                            type="text"
                            placeholder="Search report by Booking ID, Expert, or Category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 shadow-sm"
                        />
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto p-1 no-scrollbar -mx-1">
                        <button
                            onClick={() => setStatusFilter('ALL')}
                            className={`shrink-0 px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                                statusFilter === 'ALL'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                        >
                            <span>All Reports</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                {allReportBookings.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setStatusFilter('AVAILABLE')}
                            className={`shrink-0 px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                                statusFilter === 'AVAILABLE'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                        >
                            <span>Report Available</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === 'AVAILABLE' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                {readyCount}
                            </span>
                        </button>

                        <button
                            onClick={() => setStatusFilter('AWAITING_PAYMENT')}
                            className={`shrink-0 px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                                statusFilter === 'AWAITING_PAYMENT'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                        >
                            <span>Awaiting Final Payment</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === 'AWAITING_PAYMENT' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                {awaitingPaymentCount}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="py-20 flex justify-center">
                        <LoadingSpinner message="Loading survey reports..." />
                    </div>
                ) : error ? (
                    <ErrorMessage message={error} />
                ) : filteredBookings.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500 text-2xl">
                            <IoDocumentTextOutline />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                            {allReportBookings.length > 0 ? "No Matching Reports Found" : "No Survey Reports Available"}
                        </h3>
                        <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                            {allReportBookings.length > 0
                                ? "No survey reports match your current filter or search criteria."
                                : "Survey reports are generated and uploaded by expert hydrogeologists once site visits and testing are completed."}
                        </p>
                        {allReportBookings.length > 0 ? (
                            <button
                                onClick={() => {
                                    setStatusFilter('ALL');
                                    setSearchQuery('');
                                }}
                                className="px-6 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 cursor-pointer"
                            >
                                Show All Reports ({allReportBookings.length})
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate("/user/status")}
                                className="px-6 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 cursor-pointer"
                            >
                                View Active Bookings
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredBookings.map((booking) => {
                            const { isFullyPaid, remAmount } = getReportPaymentInfo(booking);
                            const expertName = booking.vendor?.name || "Hydrogeology Specialist";
                            const expertId = booking.vendor?.expertId || (booking.vendor?._id ? `EXP-${booking.vendor._id.toString().slice(-6).toUpperCase()}` : null);
                            const surveyDate = booking.scheduledDate
                                ? new Date(booking.scheduledDate).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric"
                                })
                                : "Completed";

                            return (
                                <div
                                    key={booking._id}
                                    onClick={() => navigate(`/user/booking/${booking._id}/report`)}
                                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-blue-200 group"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full border border-blue-100">
                                                ID: {booking.bookingId || booking._id?.slice(-8)}
                                            </span>
                                            <span className={`px-3 py-1 font-semibold text-xs rounded-full border ${
                                                isFullyPaid 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                            }`}>
                                                {isFullyPaid ? "Report Available" : "Awaiting Final Payment"}
                                            </span>
                                        </div>

                                        <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {booking.service?.name || "Groundwater Survey"}
                                        </h3>

                                        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <IoPersonOutline className="text-blue-500" />
                                                <strong>Expert:</strong> {expertName} {expertId && `(${expertId})`}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <IoCalendarOutline className="text-blue-500" />
                                                {surveyDate}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        {isFullyPaid ? (
                                            <button
                                                onClick={() => navigate(`/user/booking/${booking._id}/report`)}
                                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                <IoEyeOutline className="text-base" />
                                                <span>View & Download Report</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => navigate(`/user/booking/${booking._id}/report`)}
                                                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                <IoWalletOutline className="text-base" />
                                                <span>Pay Balance to Access (₹{remAmount.toLocaleString("en-IN")})</span>
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
