import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoPeopleOutline,
    IoCheckmarkCircleOutline,
    IoTimeOutline,
    IoBanOutline,
    IoDocumentTextOutline,
    IoPersonCircleOutline,
} from "react-icons/io5";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import { getAllVendors, getPendingVendors, getAllUsers } from "../../../services/adminApi";
import { useToast } from "../../../hooks/useToast";
import { handleApiError } from "../../../utils/toastHelper";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { admin } = useAdminAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalVendors: 0,
        pendingVendors: 0,
        approvedVendors: 0,
        activeVendors: 0,
        inactiveVendors: 0,
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0
    });
    const [recentVendors, setRecentVendors] = useState([]);
    const toast = useToast();

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            
            // Get all vendors for stats
            const allVendorsResponse = await getAllVendors({ limit: 1 });
            const approvedVendorsResponse = await getAllVendors({ isApproved: true, limit: 1 });
            const activeVendorsResponse = await getAllVendors({ isActive: true, limit: 1 });
            const inactiveVendorsResponse = await getAllVendors({ isActive: false, limit: 1 });
            const pendingVendorsResponse = await getPendingVendors({ limit: 1 });
            
            // Get user stats
            const allUsersResponse = await getAllUsers({ limit: 1 });
            const activeUsersResponse = await getAllUsers({ isActive: true, limit: 1 });
            const inactiveUsersResponse = await getAllUsers({ isActive: false, limit: 1 });
            
            // Get recent vendors
            const recentResponse = await getAllVendors({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
            
            if (allVendorsResponse.success) {
                setStats({
                    totalVendors: allVendorsResponse.data.pagination?.totalVendors || 0,
                    pendingVendors: pendingVendorsResponse.data.pagination?.totalVendors || 0,
                    approvedVendors: approvedVendorsResponse.data.pagination?.totalVendors || 0,
                    activeVendors: activeVendorsResponse.data.pagination?.totalVendors || 0,
                    inactiveVendors: inactiveVendorsResponse.data.pagination?.totalVendors || 0,
                    totalUsers: allUsersResponse.data.pagination?.totalUsers || 0,
                    activeUsers: activeUsersResponse.data.pagination?.totalUsers || 0,
                    inactiveUsers: inactiveUsersResponse.data.pagination?.totalUsers || 0
                });
            }
            
            if (recentResponse.success) {
                setRecentVendors(recentResponse.data.vendors || []);
            }
        } catch (err) {
            console.error("Dashboard error:", err);
            handleApiError(err, "Failed to load dashboard data");
        } finally {
            setLoading(false);
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
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-5rem)]">
            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-[#0A84FF] to-[#005BBB] rounded-xl p-6 mb-6 shadow-lg">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                    Welcome, {admin?.name || "Admin"}! 
                </h1>
                <p className="text-white/90 text-sm">
                    Manage vendors and oversee the platform
                </p>
            </div>

            {/* Vendor Statistics Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <IoPeopleOutline className="text-[#0A84FF]" />
                            Vendor Statistics
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">Overview of all vendor-related metrics</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div 
                    onClick={() => navigate("/admin/vendors")}
                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-[#0A84FF]/30 transition-all group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <IoPeopleOutline className="text-2xl text-[#0A84FF]" />
                        </div>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Total</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-800 mb-1">
                        {stats.totalVendors}
                    </p>
                    <p className="text-xs text-gray-500">All registered vendors</p>
                </div>

                <div 
                    onClick={() => navigate("/admin/vendors/pending")}
                    className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-yellow-500 border border-gray-200 cursor-pointer hover:shadow-md hover:border-yellow-500 transition-all group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                            <IoTimeOutline className="text-2xl text-yellow-600" />
                        </div>
                        <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Pending</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-800 mb-1">
                        {stats.pendingVendors}
                    </p>
                    <p className="text-xs text-gray-500">Awaiting approval</p>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <IoCheckmarkCircleOutline className="text-2xl text-green-600" />
                        </div>
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Approved</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-800 mb-1">
                        {stats.approvedVendors}
                    </p>
                    <p className="text-xs text-gray-500">Approved vendors</p>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <IoCheckmarkCircleOutline className="text-2xl text-emerald-600" />
                        </div>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Active</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-800 mb-1">
                        {stats.activeVendors}
                    </p>
                    <p className="text-xs text-gray-500">Currently active</p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <IoBanOutline className="text-xl text-red-600" />
                        </div>
                        <p className="text-[#4A4A4A] text-xs font-medium">Inactive</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">
                        {stats.inactiveVendors}
                    </p>
                </div>
                </div>
            </div>

            {/* User Statistics Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <IoPersonCircleOutline className="text-purple-600" />
                            User Statistics
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">Overview of all user-related metrics</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div 
                        onClick={() => navigate("/admin/users")}
                        className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                <IoPersonCircleOutline className="text-2xl text-purple-600" />
                            </div>
                            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Total</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800 mb-1">
                            {stats.totalUsers}
                        </p>
                        <p className="text-xs text-gray-500">All registered users</p>
                    </div>

                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <IoCheckmarkCircleOutline className="text-2xl text-green-600" />
                            </div>
                            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800 mb-1">
                            {stats.activeUsers}
                        </p>
                        <p className="text-xs text-gray-500">Currently active</p>
                    </div>

                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                <IoBanOutline className="text-2xl text-red-600" />
                            </div>
                            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Inactive</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800 mb-1">
                            {stats.inactiveUsers}
                        </p>
                        <p className="text-xs text-gray-500">Deactivated users</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                        onClick={() => navigate("/admin/vendors/pending")}
                        className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 shadow-sm border border-yellow-200 hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-yellow-500 flex items-center justify-center group-hover:bg-yellow-600 transition-colors shadow-lg">
                                <IoDocumentTextOutline className="text-2xl text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-gray-800 mb-1">
                                    Pending Approvals
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {stats.pendingVendors} vendors waiting
                                </p>
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => navigate("/admin/vendors")}
                        className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 shadow-sm border border-blue-200 hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-[#0A84FF] flex items-center justify-center group-hover:bg-[#005BBB] transition-colors shadow-lg">
                                <IoPeopleOutline className="text-2xl text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-gray-800 mb-1">
                                    All Vendors
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Manage all vendors
                                </p>
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => navigate("/admin/users")}
                        className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 shadow-sm border border-purple-200 hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-purple-600 flex items-center justify-center group-hover:bg-purple-700 transition-colors shadow-lg">
                                <IoPersonCircleOutline className="text-2xl text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-gray-800 mb-1">
                                    All Users
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Manage all users
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Vendors */}
            {recentVendors.length > 0 && (
                <div className="mt-8">
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">Recent Vendors</h2>
                        <p className="text-sm text-gray-600">Latest vendor registrations</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="divide-y divide-gray-200">
                            {recentVendors.map((vendor) => (
                                <div
                                    key={vendor._id}
                                    onClick={() => navigate(`/admin/vendors/${vendor._id}`)}
                                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#005BBB] flex items-center justify-center flex-shrink-0">
                                                <span className="text-white font-bold text-sm">
                                                    {vendor.name?.charAt(0).toUpperCase() || "V"}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-bold text-gray-800 mb-1">
                                                    {vendor.name}
                                                </h3>
                                                <p className="text-sm text-gray-600 truncate">
                                                    {vendor.email}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Registered: {formatDate(vendor.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    vendor.isApproved
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                }`}
                                            >
                                                {vendor.isApproved ? "Approved" : "Pending"}
                                            </span>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    vendor.isActive
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}
                                            >
                                                {vendor.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

