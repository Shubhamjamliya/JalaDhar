import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoSearchOutline,
    IoBanOutline,
    IoCheckmarkOutline,
    IoEyeOutline,
    IoMailOutline,
    IoCallOutline,
} from "react-icons/io5";
import { getAllUsers, deactivateUser, activateUser } from "../../../services/adminApi";

export default function AdminUsers() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(null);
    const [filters, setFilters] = useState({
        search: "",
        isActive: "",
        isEmailVerified: "",
        page: 1,
        limit: 10
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0
    });

    useEffect(() => {
        loadUsers();
    }, [filters.page, filters.isActive, filters.isEmailVerified, filters.search]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError("");
            
            const params = {
                page: filters.page,
                limit: filters.limit,
            };
            
            if (filters.search) params.search = filters.search;
            if (filters.isActive !== "") params.isActive = filters.isActive;
            if (filters.isEmailVerified !== "") params.isEmailVerified = filters.isEmailVerified;
            
            const response = await getAllUsers(params);
            
            if (response.success) {
                setUsers(response.data.users || []);
                setPagination(response.data.pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalUsers: 0
                });
            } else {
                setError("Failed to load users");
            }
        } catch (err) {
            console.error("Load users error:", err);
            setError("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async (userId) => {
        if (window.confirm("Are you sure you want to deactivate this user?")) {
            try {
                setActionLoading(userId);
                const response = await deactivateUser(userId);
                
                if (response.success) {
                    await loadUsers();
                } else {
                    alert(response.message || "Failed to deactivate user");
                }
            } catch (err) {
                console.error("Deactivate user error:", err);
                alert("Failed to deactivate user. Please try again.");
            } finally {
                setActionLoading(null);
            }
        }
    };

    const handleActivate = async (userId) => {
        if (window.confirm("Are you sure you want to activate this user?")) {
            try {
                setActionLoading(userId);
                const response = await activateUser(userId);
                
                if (response.success) {
                    await loadUsers();
                } else {
                    alert(response.message || "Failed to activate user");
                }
            } catch (err) {
                console.error("Activate user error:", err);
                alert("Failed to activate user. Please try again.");
            } finally {
                setActionLoading(null);
            }
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F7F9] -mx-4 -mt-24 -mb-28 px-4 pt-24 pb-28 md:-mx-6 md:-mt-28 md:-mb-8 md:pt-28 md:pb-8 md:relative md:left-1/2 md:-ml-[50vw] md:w-screen md:px-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A84FF] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-5rem)]">
            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    All Users
                </h1>
                <p className="text-[#4A4A4A] text-sm">
                    Manage and review all user accounts
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-[12px] p-4 mb-6 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                            className="w-full pl-10 pr-4 py-2 border border-[#D9DDE4] rounded-[8px] text-sm focus:outline-none focus:border-[#0A84FF]"
                        />
                    </div>

                    {/* Active Status Filter */}
                    <select
                        value={filters.isActive}
                        onChange={(e) => setFilters({ ...filters, isActive: e.target.value, page: 1 })}
                        className="w-full px-4 py-2 border border-[#D9DDE4] rounded-[8px] text-sm focus:outline-none focus:border-[#0A84FF]"
                    >
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>

                    {/* Email Verified Filter */}
                    <select
                        value={filters.isEmailVerified}
                        onChange={(e) => setFilters({ ...filters, isEmailVerified: e.target.value, page: 1 })}
                        className="w-full px-4 py-2 border border-[#D9DDE4] rounded-[8px] text-sm focus:outline-none focus:border-[#0A84FF]"
                    >
                        <option value="">All Verification</option>
                        <option value="true">Verified</option>
                        <option value="false">Unverified</option>
                    </select>

                    {/* Clear Filters */}
                    <button
                        onClick={() => setFilters({ search: "", isActive: "", isEmailVerified: "", page: 1, limit: 10 })}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-[8px] text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Users List */}
            <div className="space-y-4">
                {users.length === 0 ? (
                    <div className="bg-white rounded-[12px] p-8 text-center shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
                        <p className="text-[#4A4A4A] text-sm">
                            No users found
                        </p>
                    </div>
                ) : (
                    users.map((user) => (
                        <div
                            key={user._id}
                            className="bg-white rounded-[12px] p-5 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-800">
                                            {user.name}
                                        </h3>
                                        <span
                                            className={`px-2 py-1 rounded-[6px] text-xs font-semibold ${
                                                user.isActive
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                        >
                                            {user.isActive ? "Active" : "Inactive"}
                                        </span>
                                        {user.isEmailVerified && (
                                            <span className="px-2 py-1 rounded-[6px] text-xs font-semibold bg-green-100 text-green-700">
                                                Verified
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-[#4A4A4A] mb-1">
                                        <div className="flex items-center gap-1">
                                            <IoMailOutline className="text-base" />
                                            <span>{user.email}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <IoCallOutline className="text-base" />
                                            <span>{user.phone}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-[#4A4A4A]">
                                        Registered: {formatDate(user.createdAt)}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => navigate(`/admin/users/${user._id}`)}
                                    className="px-3 py-2 bg-[#0A84FF] text-white text-sm font-semibold rounded-[8px] hover:bg-[#005BBB] transition-colors flex items-center gap-2"
                                >
                                    <IoEyeOutline className="text-base" />
                                    View Details
                                </button>
                                
                                {user.isActive ? (
                                    <button
                                        onClick={() => handleDeactivate(user._id)}
                                        disabled={actionLoading === user._id}
                                        className="px-3 py-2 bg-orange-600 text-white text-sm font-semibold rounded-[8px] hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <IoBanOutline className="text-base" />
                                        {actionLoading === user._id ? "Processing..." : "Deactivate"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleActivate(user._id)}
                                        disabled={actionLoading === user._id}
                                        className="px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-[8px] hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <IoCheckmarkOutline className="text-base" />
                                        {actionLoading === user._id ? "Processing..." : "Activate"}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                        onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                        disabled={filters.page === 1}
                        className="px-4 py-2 bg-white border border-[#D9DDE4] rounded-[8px] text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-600">
                        Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                        disabled={filters.page >= pagination.totalPages}
                        className="px-4 py-2 bg-white border border-[#D9DDE4] rounded-[8px] text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

