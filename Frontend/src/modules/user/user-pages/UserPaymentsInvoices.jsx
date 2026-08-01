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

    // Calculate totals
    const paidBookings = bookings.filter(b => b.paymentStatus?.advancePaid || b.paymentStatus?.remainingPaid);
    const totalPaidAmount = paidBookings.reduce((sum, b) => {
        let amt = 0;
        if (b.paymentStatus?.advancePaid) amt += (b.advanceAmount || 0);
        if (b.paymentStatus?.remainingPaid) amt += (b.remainingAmount || 0);
        return sum + amt;
    }, 0);

    const filteredBookings = paidBookings.filter(b => {
        return searchQuery === "" ||
            (b.bookingId && b.bookingId.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (b.vendor?.name && b.vendor.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (b.service?.name && b.service.name.toLowerCase().includes(searchQuery.toLowerCase()));
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

                {/* Search Bar */}
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
                            const isFullyPaid = booking.paymentStatus?.remainingPaid;
                            const isAdvancePaid = booking.paymentStatus?.advancePaid;
                            const totalAmount = booking.pricing?.totalPrice || booking.totalPrice || (booking.advanceAmount + booking.remainingAmount) || 0;
                            const paidSoFar = (isAdvancePaid ? (booking.advanceAmount || 0) : 0) + (isFullyPaid ? (booking.remainingAmount || 0) : 0);

                            return (
                                <div
                                    key={booking._id}
                                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-100">
                                                ID: {booking.bookingId || booking._id?.slice(-8)}
                                            </span>
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                                isFullyPaid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                            }`}>
                                                {isFullyPaid ? "Fully Paid" : "Advance Paid"}
                                            </span>
                                        </div>

                                        <h3 className="text-base font-bold text-gray-900">
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

                                    <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 shrink-0">
                                        <button
                                            onClick={() => navigate(`/user/booking/${booking._id}/invoice`)}
                                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <IoReceiptOutline className="text-base" />
                                            <span>View Invoice</span>
                                        </button>
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
