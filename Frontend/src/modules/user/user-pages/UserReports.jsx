import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoDocumentTextOutline,
    IoEyeOutline,
    IoDownloadOutline,
    IoCalendarOutline,
    IoPersonOutline,
    IoLocationOutline,
    IoWaterOutline,
    IoSearchOutline,
    IoFilterOutline,
    IoChevronForwardOutline
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

    // Filter bookings that have a report or visit report uploaded
    const reportBookings = bookings.filter(booking => {
        const hasReport = booking.visitReport || booking.borewellResult || booking.status === "COMPLETED";
        const matchesSearch = searchQuery === "" ||
            (booking.bookingId && booking.bookingId.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (booking.vendor?.name && booking.vendor.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (booking.service?.name && booking.service.name.toLowerCase().includes(searchQuery.toLowerCase()));
        return hasReport && matchesSearch;
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

                {/* Content Area */}
                {loading ? (
                    <div className="py-20 flex justify-center">
                        <LoadingSpinner message="Loading survey reports..." />
                    </div>
                ) : error ? (
                    <ErrorMessage message={error} />
                ) : reportBookings.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500 text-2xl">
                            <IoDocumentTextOutline />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">No Survey Reports Available</h3>
                        <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                            Survey reports are generated and uploaded by expert hydrogeologists once site visits and testing are completed.
                        </p>
                        <button
                            onClick={() => navigate("/user/status")}
                            className="px-6 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                        >
                            View Active Bookings
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reportBookings.map((booking) => {
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
                                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full border border-blue-100">
                                                ID: {booking.bookingId || booking._id?.slice(-8)}
                                            </span>
                                            <span className="px-3 py-1 bg-green-50 text-green-700 font-semibold text-xs rounded-full border border-green-100">
                                                Report Ready
                                            </span>
                                        </div>

                                        <h3 className="text-base font-bold text-gray-900">
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

                                    <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 shrink-0">
                                        <button
                                            onClick={() => navigate(`/user/booking/${booking._id}/report`)}
                                            className="flex-1 md:flex-initial px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <IoEyeOutline className="text-base" />
                                            <span>View & Download Report</span>
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
