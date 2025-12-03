import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoStar,
    IoStarOutline,
    IoSearchOutline,
    IoTrashOutline,
    IoEyeOutline,
    IoPersonOutline,
    IoConstructOutline,
    IoCalendarOutline,
    IoCloseOutline,
} from "react-icons/io5";
import { getAllRatings, getRatingStatistics, getRatingDetails, deleteRating } from "../../../services/adminApi";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";

export default function AdminRatings() {
    const navigate = useNavigate();
    const [ratings, setRatings] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const toast = useToast();
    const [filters, setFilters] = useState({
        search: "",
        vendorId: "",
        userId: "",
        minRating: "",
        maxRating: "",
        page: 1,
        limit: 20,
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRatings: 0,
    });
    const [selectedRating, setSelectedRating] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadRatings();
        loadStatistics();
    }, [filters.page, filters.search, filters.vendorId, filters.userId, filters.minRating, filters.maxRating]);

    const loadRatings = async () => {
        try {
            setLoading(true);
            const params = {
                page: filters.page,
                limit: filters.limit,
            };
            if (filters.search) params.search = filters.search;
            if (filters.vendorId) params.vendorId = filters.vendorId;
            if (filters.userId) params.userId = filters.userId;
            if (filters.minRating) params.minRating = filters.minRating;
            if (filters.maxRating) params.maxRating = filters.maxRating;

            const response = await getAllRatings(params);
            if (response.success) {
                setRatings(response.data.ratings || []);
                setPagination(response.data.pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalRatings: 0,
                });
            } else {
                toast.showError(response.message || "Failed to load ratings");
            }
        } catch (err) {
            handleApiError(err, "Failed to load ratings");
        } finally {
            setLoading(false);
        }
    };

    const loadStatistics = async () => {
        try {
            setStatsLoading(true);
            const response = await getRatingStatistics();
            if (response.success) {
                setStatistics(response.data);
            }
        } catch (err) {
            console.error("Failed to load statistics:", err);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleViewDetails = async (ratingId) => {
        try {
            const response = await getRatingDetails(ratingId);
            if (response.success) {
                setSelectedRating(response.data.rating);
                setShowDetailsModal(true);
            } else {
                toast.showError("Failed to load rating details");
            }
        } catch (err) {
            handleApiError(err, "Failed to load rating details");
        }
    };

    const handleDelete = async () => {
        if (!selectedRating) return;
        setDeleting(true);
        const loadingToast = toast.showLoading("Deleting rating...");
        try {
            const response = await deleteRating(selectedRating._id);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("Rating deleted successfully!");
                setShowDeleteModal(false);
                setSelectedRating(null);
                await loadRatings();
                await loadStatistics();
            } else {
                toast.dismissToast(loadingToast);
                toast.showError(response.message || "Failed to delete rating");
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to delete rating");
        } finally {
            setDeleting(false);
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

    const renderStars = (rating) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>
                        {star <= Math.round(rating) ? (
                            <IoStar className="text-yellow-400 text-lg" />
                        ) : (
                            <IoStarOutline className="text-gray-300 text-lg" />
                        )}
                    </span>
                ))}
                <span className="ml-2 text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage all user ratings and reviews</p>
            </div>

            {/* Statistics Cards */}
            {!statsLoading && statistics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-500 mb-1">Total Ratings</p>
                        <p className="text-2xl font-bold text-gray-900">{statistics.totalRatings || 0}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-500 mb-1">Average Rating</p>
                        <p className="text-2xl font-bold text-gray-900">{statistics.averageRating?.toFixed(1) || "0.0"}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-500 mb-1">Total Reviews</p>
                        <p className="text-2xl font-bold text-gray-900">{statistics.totalReviews || 0}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-500 mb-1">Top Rated Vendors</p>
                        <p className="text-2xl font-bold text-gray-900">{statistics.topRatedVendors?.length || 0}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                        <input
                            type="text"
                            placeholder="Search ratings..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                        />
                    </div>
                    <input
                        type="number"
                        placeholder="Min Rating (1-5)"
                        min="1"
                        max="5"
                        value={filters.minRating}
                        onChange={(e) => setFilters({ ...filters, minRating: e.target.value, page: 1 })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                    />
                    <input
                        type="number"
                        placeholder="Max Rating (1-5)"
                        min="1"
                        max="5"
                        value={filters.maxRating}
                        onChange={(e) => setFilters({ ...filters, maxRating: e.target.value, page: 1 })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                    />
                    <button
                        onClick={() => setFilters({ search: "", vendorId: "", userId: "", minRating: "", maxRating: "", page: 1 })}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Ratings List */}
            {loading ? (
                <LoadingSpinner message="Loading ratings..." />
            ) : ratings.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <IoStarOutline className="mx-auto text-6xl text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Ratings Found</h3>
                    <p className="text-gray-600">No ratings match your filters</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {ratings.map((rating) => (
                                    <tr key={rating._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{rating.user?.name || "N/A"}</div>
                                            <div className="text-sm text-gray-500">{rating.user?.email || ""}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{rating.vendor?.name || "N/A"}</div>
                                            <div className="text-sm text-gray-500">{rating.vendor?.email || ""}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {renderStars(rating.overallRating)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {rating.review || "No review"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(rating.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(rating._id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <IoEyeOutline className="text-lg" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedRating(rating);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <IoTrashOutline className="text-lg" />
                                                </button>
                                            </div>
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
                                {Math.min(pagination.currentPage * filters.limit, pagination.totalRatings)} of{" "}
                                {pagination.totalRatings} ratings
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

            {/* Rating Details Modal */}
            {showDetailsModal && selectedRating && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Rating Details</h2>
                            <button
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setSelectedRating(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <IoCloseOutline className="text-2xl" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Overall Rating</h3>
                                {renderStars(selectedRating.overallRating)}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Accuracy</h3>
                                    {renderStars(selectedRating.ratings?.accuracy)}
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Professionalism</h3>
                                    {renderStars(selectedRating.ratings?.professionalism)}
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Behavior</h3>
                                    {renderStars(selectedRating.ratings?.behavior)}
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Visit Timing</h3>
                                    {renderStars(selectedRating.ratings?.visitTiming)}
                                </div>
                            </div>
                            {selectedRating.review && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Review</h3>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRating.review}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">User</h3>
                                    <p className="text-sm text-gray-900">{selectedRating.user?.name}</p>
                                    <p className="text-sm text-gray-500">{selectedRating.user?.email}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Vendor</h3>
                                    <p className="text-sm text-gray-900">{selectedRating.vendor?.name}</p>
                                    <p className="text-sm text-gray-500">{selectedRating.vendor?.email}</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Service</h3>
                                <p className="text-sm text-gray-900">{selectedRating.service?.name}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Date</h3>
                                <p className="text-sm text-gray-900">{formatDate(selectedRating.createdAt)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setSelectedRating(null);
                }}
                onConfirm={handleDelete}
                title="Delete Rating"
                message="Are you sure you want to delete this rating? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                confirmColor="danger"
                loading={deleting}
            />
        </div>
    );
}

