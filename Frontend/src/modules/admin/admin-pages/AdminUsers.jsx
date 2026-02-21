import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    IoSearchOutline,
    IoBanOutline,
    IoCheckmarkOutline,
    IoEyeOutline,
    IoMailOutline,
    IoCallOutline,
    IoPersonOutline,
    IoFilterOutline,
    IoEllipsisVertical,
    IoShieldCheckmarkOutline,
    IoCalendarOutline
} from "react-icons/io5";
import { getAllUsers, deactivateUser, activateUser } from "../../../services/adminApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";
import ConfirmModal from "../../shared/components/ConfirmModal";
import LoadingSpinner from "../../shared/components/LoadingSpinner";

export default function AdminUsers() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const toast = useToast();
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
    const [showActivateConfirm, setShowActivateConfirm] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
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
    }, [filters.page, filters.isActive, filters.isEmailVerified]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (filters.page === 1) {
                loadUsers();
            } else {
                setFilters(prev => ({ ...prev, page: 1 }));
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [filters.search]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const params = {
                page: filters.page,
                limit: filters.limit,
                isActive: filters.isActive !== "" ? filters.isActive : undefined,
                isEmailVerified: filters.isEmailVerified !== "" ? filters.isEmailVerified : undefined,
                search: filters.search || undefined
            };

            const response = await getAllUsers(params);

            if (response.success) {
                setUsers(response.data.users || []);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            console.error("Load users error:", err);
            toast.showError("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivateConfirm = async () => {
        if (!selectedUserId) return;
        const userId = selectedUserId;
        setShowDeactivateConfirm(false);
        const loadingToast = toast.showLoading("Deactivating user...");
        try {
            setActionLoading(userId);
            const response = await deactivateUser(userId);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("User deactivated successfully!");
                await loadUsers();
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to deactivate user");
        } finally {
            setActionLoading(null);
            setSelectedUserId(null);
        }
    };

    const handleActivateConfirm = async () => {
        if (!selectedUserId) return;
        const userId = selectedUserId;
        setShowActivateConfirm(false);
        const loadingToast = toast.showLoading("Activating user...");
        try {
            setActionLoading(userId);
            const response = await activateUser(userId);
            if (response.success) {
                toast.dismissToast(loadingToast);
                toast.showSuccess("User activated successfully!");
                await loadUsers();
            }
        } catch (err) {
            toast.dismissToast(loadingToast);
            handleApiError(err, "Failed to activate user");
        } finally {
            setActionLoading(null);
            setSelectedUserId(null);
        }
    };

    return (
        <div className="space-y-6 p-6 pb-20 lg:pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">All Users</h1>
                    <p className="text-gray-500">Manage and oversee all registered user accounts</p>
                </div>
                <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-md">Total: {pagination.totalUsers}</button>
                </div>
            </div>

            {/* Quick Stats/Summary Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <IoPersonOutline className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total</p>
                        <h4 className="text-lg font-bold text-gray-900">{pagination.totalUsers}</h4>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                        <IoCheckmarkOutline className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Active</p>
                        <h4 className="text-lg font-bold text-gray-900">{users.filter(u => u.isActive).length}+</h4>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                        <IoShieldCheckmarkOutline className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Verified</p>
                        <h4 className="text-lg font-bold text-gray-900">{users.filter(u => u.isEmailVerified).length}+</h4>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                        <IoCalendarOutline className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">New (Today)</p>
                        <h4 className="text-lg font-bold text-gray-900">12+</h4>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                    <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                    />
                </div>
                <div className="flex gap-4">
                    <select
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={filters.isActive}
                        onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value, page: 1 }))}
                    >
                        <option value="">Account Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                    <select
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={filters.isEmailVerified}
                        onChange={(e) => setFilters(prev => ({ ...prev, isEmailVerified: e.target.value, page: 1 }))}
                    >
                        <option value="">Verification</option>
                        <option value="true">Verified</option>
                        <option value="false">Unverified</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Registered</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-10 text-center"><LoadingSpinner /></td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">No users found</td></tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                                    {user.name?.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900">{user.name}</span>
                                                    <span className="text-[10px] text-gray-400 font-medium">ID: {user._id.slice(-8).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <div className="flex flex-col gap-1">
                                                <span className="flex items-center gap-1.5"><IoMailOutline /> {user.email}</span>
                                                <span className="flex items-center gap-1.5"><IoCallOutline /> {user.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-2">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                                                </span>
                                                {user.isEmailVerified && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 tracking-wider">
                                                        <IoShieldCheckmarkOutline /> VERIFIED
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/users/${user._id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <IoEyeOutline className="text-xl" />
                                                </button>
                                                {user.isActive ? (
                                                    <button
                                                        onClick={() => { setSelectedUserId(user._id); setShowDeactivateConfirm(true); }}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Deactivate Account"
                                                    >
                                                        <IoBanOutline className="text-xl" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => { setSelectedUserId(user._id); setShowActivateConfirm(true); }}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Activate Account"
                                                    >
                                                        <IoCheckmarkOutline className="text-xl" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                        <p className="text-sm text-gray-500 font-medium">Page {filters.page} of {pagination.totalPages}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                disabled={filters.page === 1}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 disabled:opacity-50 hover:border-blue-500 transition-all shadow-sm"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                                disabled={filters.page === pagination.totalPages}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 disabled:opacity-50 hover:border-blue-500 transition-all shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={showDeactivateConfirm}
                onClose={() => setShowDeactivateConfirm(false)}
                onConfirm={handleDeactivateConfirm}
                title="Deactivate Account"
                message="This will prevent the user from logging in or making any bookings. Continue?"
                confirmText="Yes, Deactivate"
                cancelText="Cancel"
                confirmColor="warning"
            />

            <ConfirmModal
                isOpen={showActivateConfirm}
                onClose={() => setShowActivateConfirm(false)}
                onConfirm={handleActivateConfirm}
                title="Activate Account"
                message="This will restore the user's access to their account. Continue?"
                confirmText="Yes, Activate"
                cancelText="Cancel"
                confirmColor="primary"
            />
        </div>
    );
}
