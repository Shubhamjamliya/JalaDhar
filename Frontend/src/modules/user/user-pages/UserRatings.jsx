import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoStar,
    IoStarOutline,

    IoPersonOutline,
    IoTimeOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoConstructOutline,
} from "react-icons/io5";
import { getMyRatings } from "../../../services/userApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorMessage from "../../shared/components/ErrorMessage";
import { useToast } from "../../../hooks/useToast";

export default function UserRatings() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [ratings, setRatings] = useState([]);
    const [stats, setStats] = useState({
        totalRatings: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        categoryAverages: {
            accuracy: 0,
            professionalism: 0,
            behavior: 0,
            visitTiming: 0
        },
        successCount: 0,
        failureCount: 0
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRatings: 0
    });
    const [currentPage, setCurrentPage] = useState(1);
    const toast = useToast();

    useEffect(() => {
        loadRatings();
    }, [currentPage]);

    const loadRatings = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getMyRatings({ page: currentPage, limit: 10 });

            if (response.success) {
                setRatings(response.data.ratings || []);
                setStats(response.data.stats || stats);
                setPagination(response.data.pagination || pagination);
            } else {
                setError(response.message || "Failed to load ratings");
            }
        } catch (err) {
            setError("Failed to load ratings");
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating || 0);
        const hasHalfStar = (rating || 0) % 1 >= 0.5;
        return [...Array(5)].map((_, i) => {
            if (i < fullStars) {
                return <IoStar key={i} className="text-lg text-yellow-500" />;
            } else if (i === fullStars && hasHalfStar) {
                return <IoStarOutline key={i} className="text-lg text-yellow-500" />;
            } else {
                return <IoStarOutline key={i} className="text-lg text-gray-300" />;
            }
        });
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

    const getRatingPercentage = (count) => {
        if (stats.totalRatings === 0) return 0;
        return Math.round((count / stats.totalRatings) * 100);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 flex items-center justify-center">
                <LoadingSpinner message="Loading your ratings..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6">
            <ErrorMessage message={error} />

            {/* Header */}
            <div className="bg-gray-100 rounded-t-[12px] px-4 py-3 flex items-center justify-between mb-0">
                {/* Back button removed - handled by UserNavbar */}
                <h1 className="text-lg font-bold text-gray-800">My Ratings & Reviews</h1>
                <div className="w-10"></div>
            </div>

            {/* Statistics Card */}
            <div className="bg-white rounded-b-[12px] mb-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] p-6">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    {/* Overall Rating */}
                    <div className="text-center md:text-left">
                        <div className="text-5xl font-bold text-gray-800 mb-2">
                            {stats.averageRating.toFixed(1)}
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
                            {renderStars(stats.averageRating)}
                        </div>
                        <p className="text-sm text-gray-600">
                            {stats.totalRatings} {stats.totalRatings === 1 ? 'rating' : 'ratings'} submitted
                        </p>
                    </div>

                    {/* Rating Distribution */}
                    <div className="flex-1 w-full md:w-auto">
                        {[5, 4, 3, 2, 1].map((star) => (
                            <div key={star} className="flex items-center gap-2 mb-2">
                                <div className="flex items-center gap-1 w-20">
                                    <span className="text-sm font-medium text-gray-700">{star}</span>
                                    <IoStar className="text-sm text-yellow-500" />
                                </div>
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-500 transition-all"
                                        style={{ width: `${getRatingPercentage(stats.ratingDistribution[star])}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs text-gray-600 w-10 text-right">
                                    {stats.ratingDistribution[star]} ({getRatingPercentage(stats.ratingDistribution[star])}%)
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Category Averages */}
                    <div className="w-full md:w-auto">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Category Averages</h3>
                        <div className="space-y-2">
                            <CategoryBar label="Accuracy" value={stats.categoryAverages.accuracy} />
                            <CategoryBar label="Professionalism" value={stats.categoryAverages.professionalism} />
                            <CategoryBar label="Behavior" value={stats.categoryAverages.behavior} />
                            <CategoryBar label="Visit Timing" value={stats.categoryAverages.visitTiming} />
                        </div>
                    </div>
                </div>

                {/* Success/Failure Stats */}
                {(stats.successCount > 0 || stats.failureCount > 0) && (
                    <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2">
                            <IoCheckmarkCircleOutline className="text-xl text-green-500" />
                            <span className="text-sm text-gray-700">
                                <span className="font-semibold">{stats.successCount}</span> Success
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <IoCloseCircleOutline className="text-xl text-red-500" />
                            <span className="text-sm text-gray-700">
                                <span className="font-semibold">{stats.failureCount}</span> Failure
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Ratings List */}
            <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-800 mb-4 px-2">
                    My Submitted Ratings ({pagination.totalRatings})
                </h2>
                <div className="space-y-4">
                    {ratings.length === 0 ? (
                        <div className="bg-white rounded-[12px] p-8 text-center shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                            <IoStarOutline className="text-5xl text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 mb-2">No ratings submitted yet</p>
                            <p className="text-sm text-gray-500 mb-4">
                                Rate vendors after completing bookings to see them here
                            </p>
                            <button
                                onClick={() => navigate("/user/status")}
                                className="bg-[#0A84FF] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#005BBB] transition-colors"
                            >
                                View Bookings
                            </button>
                        </div>
                    ) : (
                        ratings.map((rating) => (
                            <RatingCard key={rating._id} rating={rating} renderStars={renderStars} formatDate={formatDate} navigate={navigate} />
                        ))
                    )}
                </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mb-6">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-[8px] text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                        Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                        disabled={currentPage === pagination.totalPages}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-[8px] text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

function CategoryBar({ label, value }) {
    const percentage = (value / 5) * 100;
    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-24">{label}</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-[#0A84FF] transition-all"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <span className="text-xs font-semibold text-gray-700 w-8 text-right">
                {value.toFixed(1)}
            </span>
        </div>
    );
}

function RatingCard({ rating, renderStars, formatDate, navigate }) {
    return (
        <div className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3 flex-1">
                    {/* Vendor Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                        {rating.vendor?.name ? (
                            <span className="text-lg font-bold text-blue-600">
                                {rating.vendor.name.charAt(0).toUpperCase()}
                            </span>
                        ) : (
                            <IoPersonOutline className="text-xl text-blue-600" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-800 truncate">
                            {rating.vendor?.name || "Vendor"}
                        </h3>
                        {rating.service && (
                            <p className="text-xs text-gray-500 truncate">
                                {rating.service.name}
                            </p>
                        )}
                        {rating.booking && (
                            <p className="text-xs text-gray-400 mt-1">
                                <IoTimeOutline className="inline mr-1" />
                                {formatDate(rating.booking.scheduledDate)} {rating.booking.scheduledTime || ""}
                            </p>
                        )}
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 mb-1">
                        {renderStars(rating.overallRating)}
                    </div>
                    <p className="text-xs text-gray-500">
                        {formatDate(rating.createdAt)}
                    </p>
                </div>
            </div>

            {/* Rating Breakdown */}
            {rating.ratings && (
                <div className="mb-3 p-3 bg-gray-50 rounded-[8px]">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Accuracy:</span>
                            <span className="font-semibold text-gray-800">{rating.ratings.accuracy}/5</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Professionalism:</span>
                            <span className="font-semibold text-gray-800">{rating.ratings.professionalism}/5</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Behavior:</span>
                            <span className="font-semibold text-gray-800">{rating.ratings.behavior}/5</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Visit Timing:</span>
                            <span className="font-semibold text-gray-800">{rating.ratings.visitTiming}/5</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Text */}
            {rating.review && (
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                    {rating.review}
                </p>
            )}

            {/* Success/Failure Badge */}
            {rating.isSuccess !== null && (
                <div className="flex items-center gap-2">
                    {rating.isSuccess ? (
                        <>
                            <IoCheckmarkCircleOutline className="text-lg text-green-500" />
                            <span className="text-xs font-medium text-green-700">Borewell Result: Success</span>
                        </>
                    ) : (
                        <>
                            <IoCloseCircleOutline className="text-lg text-red-500" />
                            <span className="text-xs font-medium text-red-700">Borewell Result: Failed</span>
                        </>
                    )}
                </div>
            )}

            {/* View Booking Button */}
            {rating.booking && (
                <button
                    onClick={() => navigate(`/user/booking/${rating.booking._id || rating.booking}`)}
                    className="mt-3 w-full text-center text-sm text-[#0A84FF] hover:text-[#005BBB] font-medium py-2 border border-[#0A84FF] rounded-[8px] hover:bg-[#0A84FF]/5 transition-colors"
                >
                    View Booking Details
                </button>
            )}
        </div>
    );
}

