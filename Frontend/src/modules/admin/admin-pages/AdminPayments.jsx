import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoWalletOutline,
    IoCheckmarkCircleOutline,
    IoTimeOutline,
    IoCloseCircleOutline,
    IoArrowDownOutline,
    IoArrowUpOutline,
    IoCashOutline,
    IoReceiptOutline,
    IoSearchOutline,
    IoFilterOutline,
} from "react-icons/io5";
import { getAllPayments, getPaymentStatistics, getAllBookings, processVendorSettlement } from "../../../services/adminApi";
import { useTheme } from "../../../contexts/ThemeContext";

export default function AdminPayments() {
    const navigate = useNavigate();
    const { theme, themeColors } = useTheme();
    const currentTheme = themeColors[theme] || themeColors.default;
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [stats, setStats] = useState({
        totalPayments: 0,
        successPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
        totalRevenue: 0,
        advancePayments: { total: 0, count: 0 },
        remainingPayments: { total: 0, count: 0 },
        settlements: { total: 0, count: 0 },
        pendingSettlements: 0,
    });
    const [userPayments, setUserPayments] = useState([]);
    const [vendorPayments, setVendorPayments] = useState([]);
    const [settlements, setSettlements] = useState([]);
    const [userPagination, setUserPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalPayments: 0,
    });
    const [vendorPagination, setVendorPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalPayments: 0,
    });
    const [userFilters, setUserFilters] = useState({
        status: "",
        paymentType: "",
        search: "",
    });
    const [vendorFilters, setVendorFilters] = useState({
        status: "",
        search: "",
    });
    const [error, setError] = useState("");

    useEffect(() => {
        loadPaymentData();
    }, [activeTab, userFilters, vendorFilters, userPagination.currentPage, vendorPagination.currentPage]);

    const loadPaymentData = async () => {
        try {
            setLoading(true);
            setError("");

            if (activeTab === "overview") {
                const statsResponse = await getPaymentStatistics();
                if (statsResponse.success) {
                    setStats(statsResponse.data.statistics);
                }
            } else if (activeTab === "user-payments") {
                // Load user payments (ADVANCE and REMAINING)
                const params = {
                    page: userPagination.currentPage,
                    limit: 10,
                    paymentType: userFilters.paymentType || undefined, // Will filter to ADVANCE or REMAINING
                    ...(userFilters.status && { status: userFilters.status }),
                    ...(userFilters.search && { search: userFilters.search }),
                };
                const paymentsResponse = await getAllPayments(params);
                if (paymentsResponse.success) {
                    // Filter to only show ADVANCE and REMAINING payments
                    const userPaymentsOnly = paymentsResponse.data.payments.filter(
                        (p) => p.paymentType === "ADVANCE" || p.paymentType === "REMAINING"
                    );
                    setUserPayments(userPaymentsOnly);
                    setUserPagination(paymentsResponse.data.pagination);
                }
            } else if (activeTab === "vendor-payments") {
                // Load vendor payments (SETTLEMENT)
                const params = {
                    page: vendorPagination.currentPage,
                    limit: 10,
                    paymentType: "SETTLEMENT",
                    ...(vendorFilters.status && { status: vendorFilters.status }),
                    ...(vendorFilters.search && { search: vendorFilters.search }),
                };
                const paymentsResponse = await getAllPayments(params);
                if (paymentsResponse.success) {
                    setVendorPayments(paymentsResponse.data.payments);
                    setVendorPagination(paymentsResponse.data.pagination);
                }
            } else if (activeTab === "settlements") {
                const bookingsResponse = await getAllBookings({
                    page: 1,
                    limit: 50,
                });
                if (bookingsResponse.success) {
                    const pendingSettlements = bookingsResponse.data.bookings.filter(
                        (booking) => booking.payment?.vendorSettlement?.status === "PENDING"
                    );
                    setSettlements(pendingSettlements);
                }
            }
        } catch (err) {
            console.error("Payment data error:", err);
            setError("Failed to load payment data");
        } finally {
            setLoading(false);
        }
    };

    const handleSettlement = async (bookingId) => {
        if (!window.confirm("Are you sure you want to process this settlement?")) {
            return;
        }

        try {
            const response = await processVendorSettlement(bookingId);
            if (response.success) {
                alert("Settlement processed successfully!");
                loadPaymentData();
            }
        } catch (err) {
            console.error("Settlement error:", err);
            alert("Failed to process settlement");
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            SUCCESS: "bg-green-100 text-green-700",
            PENDING: "bg-yellow-100 text-yellow-700",
            FAILED: "bg-red-100 text-red-700",
            REFUNDED: "bg-gray-100 text-gray-700",
        };
        return badges[status] || "bg-gray-100 text-gray-700";
    };

    const getPaymentTypeBadge = (type) => {
        const badges = {
            ADVANCE: "bg-blue-100 text-blue-700",
            REMAINING: "bg-purple-100 text-purple-700",
            SETTLEMENT: "bg-orange-100 text-orange-700",
        };
        return badges[type] || "bg-gray-100 text-gray-700";
    };

    if (loading && activeTab === "overview") {
        return (
            <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A84FF] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading payment data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-5rem)]">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Management</h1>
                <p className="text-gray-600">Manage all payments, settlements, and transactions</p>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === "overview"
                                ? `border-[${currentTheme.primary}] text-[${currentTheme.primary}]`
                                : "border-transparent text-gray-600 hover:text-gray-800"
                        }`}
                        style={activeTab === "overview" ? { borderColor: currentTheme.primary, color: currentTheme.primary } : {}}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab("user-payments")}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === "user-payments"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-600 hover:text-gray-800"
                        }`}
                    >
                        User Payments
                    </button>
                    <button
                        onClick={() => setActiveTab("vendor-payments")}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === "vendor-payments"
                                ? "border-orange-500 text-orange-600"
                                : "border-transparent text-gray-600 hover:text-gray-800"
                        }`}
                    >
                        Vendor Settlements
                    </button>
                    <button
                        onClick={() => setActiveTab("settlements")}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === "settlements"
                                ? "border-green-500 text-green-600"
                                : "border-transparent text-gray-600 hover:text-gray-800"
                        }`}
                    >
                        Pending Settlements
                        {stats.pendingSettlements > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                {stats.pendingSettlements}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Overview Tab */}
            {activeTab === "overview" && (
                <div>
                    {/* Revenue Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 shadow-sm border border-green-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                                    <IoWalletOutline className="text-2xl text-white" />
                                </div>
                                <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-full">Total Revenue</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-800 mb-1">{formatCurrency(stats.totalRevenue)}</p>
                            <p className="text-xs text-gray-600">All successful payments</p>
                        </div>

                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: currentTheme.primary }}>
                                    <IoCheckmarkCircleOutline className="text-2xl text-white" />
                                </div>
                                <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ color: currentTheme.primaryDark, backgroundColor: `${currentTheme.primary}20` }}>Success</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-800 mb-1">{stats.successPayments}</p>
                            <p className="text-xs text-gray-600">Successful payments</p>
                        </div>


                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                    <IoTimeOutline className="text-2xl text-yellow-600" />
                                </div>
                                <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Pending</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-800 mb-1">{stats.pendingPayments}</p>
                            <p className="text-xs text-gray-600">Pending payments</p>
                        </div>

                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                    <IoCloseCircleOutline className="text-2xl text-red-600" />
                                </div>
                                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Failed</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-800 mb-1">{stats.failedPayments}</p>
                            <p className="text-xs text-gray-600">Failed payments</p>
                        </div>
                    </div>

                    {/* Payment Type Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <IoArrowDownOutline className="text-xl text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800">Advance Payments</h3>
                            </div>
                            <p className="text-2xl font-bold text-gray-800 mb-1">{formatCurrency(stats.advancePayments.total)}</p>
                            <p className="text-sm text-gray-600">{stats.advancePayments.count} transactions</p>
                        </div>

                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <IoArrowUpOutline className="text-xl text-purple-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800">Remaining Payments</h3>
                            </div>
                            <p className="text-2xl font-bold text-gray-800 mb-1">{formatCurrency(stats.remainingPayments.total)}</p>
                            <p className="text-sm text-gray-600">{stats.remainingPayments.count} transactions</p>
                        </div>

                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                    <IoCashOutline className="text-xl text-orange-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800">Vendor Settlements</h3>
                            </div>
                            <p className="text-2xl font-bold text-gray-800 mb-1">{formatCurrency(stats.settlements.total)}</p>
                            <p className="text-sm text-gray-600">{stats.settlements.count} settlements</p>
                        </div>
                    </div>

                    {/* Pending Settlements Alert */}
                    {stats.pendingSettlements > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <IoTimeOutline className="text-2xl text-yellow-600" />
                                    <div>
                                        <h3 className="font-semibold text-gray-800">Pending Settlements</h3>
                                        <p className="text-sm text-gray-600">{stats.pendingSettlements} vendor settlements awaiting processing</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveTab("settlements")}
                                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold text-sm"
                                >
                                    View All
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* User Payments Tab */}
            {activeTab === "user-payments" && (
                <div>
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 mb-6 border border-blue-200">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: currentTheme.primary }}>
                                    <IoArrowDownOutline className="text-3xl text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-1">User Payments</h2>
                                    <p className="text-gray-600">Track all payments received from users (40% Advance + 60% Remaining)</p>
                                </div>
                            </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by Order ID..."
                                    value={userFilters.search}
                                    onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                                    onFocus={(e) => {
                                        e.target.style.borderColor = currentTheme.primary;
                                        e.target.style.setProperty('--tw-ring-color', currentTheme.primary);
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '';
                                    }}
                                />
                            </div>
                            <select
                                value={userFilters.status}
                                onChange={(e) => setUserFilters({ ...userFilters, status: e.target.value })}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Status</option>
                                <option value="SUCCESS">Success</option>
                                <option value="PENDING">Pending</option>
                                <option value="FAILED">Failed</option>
                                <option value="REFUNDED">Refunded</option>
                            </select>
                            <select
                                value={userFilters.paymentType}
                                onChange={(e) => setUserFilters({ ...userFilters, paymentType: e.target.value })}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Types</option>
                                <option value="ADVANCE">Advance (40%)</option>
                                <option value="REMAINING">Remaining (60%)</option>
                            </select>
                            <button
                                onClick={() => setUserFilters({ status: "", paymentType: "", search: "" })}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {/* Payments Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: currentTheme.primary }}></div>
                                <p className="text-gray-600">Loading user payments...</p>
                            </div>
                        ) : userPayments.length === 0 ? (
                            <div className="p-8 text-center">
                                <IoReceiptOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No user payments found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b" style={{ backgroundColor: `${currentTheme.primary}15`, borderColor: `${currentTheme.primary}30` }}>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: currentTheme.primaryDark }}>Payment ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: currentTheme.primaryDark }}>Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: currentTheme.primaryDark }}>User</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: currentTheme.primaryDark }}>Vendor</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: currentTheme.primaryDark }}>Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: currentTheme.primaryDark }}>Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: currentTheme.primaryDark }}>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {userPayments.map((payment) => (
                                            <tr 
                                                key={payment._id} 
                                                className="hover:bg-opacity-50"
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${currentTheme.primary}10`}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                                            >
                                                <td className="px-6 py-4 text-sm font-mono text-gray-600">
                                                    {payment.razorpayOrderId?.slice(-8) || "N/A"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        payment.paymentType === "ADVANCE" 
                                                            ? "bg-blue-100 text-blue-700" 
                                                            : "bg-purple-100 text-purple-700"
                                                    }`}>
                                                        {payment.paymentType === "ADVANCE" ? "40% Advance" : "60% Remaining"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                                                    {payment.user?.name || "N/A"}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-800">
                                                    {payment.vendor?.name || "N/A"}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-800">
                                                    {formatCurrency(payment.amount)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(payment.status)}`}>
                                                        {payment.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {formatDate(payment.paidAt || payment.createdAt)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {userPagination.totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Page {userPagination.currentPage} of {userPagination.totalPages} ({userPagination.totalPayments} total)
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setUserPagination({ ...userPagination, currentPage: userPagination.currentPage - 1 })}
                                    disabled={userPagination.currentPage === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setUserPagination({ ...userPagination, currentPage: userPagination.currentPage + 1 })}
                                    disabled={userPagination.currentPage === userPagination.totalPages}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Vendor Payments Tab */}
            {activeTab === "vendor-payments" && (
                <div>
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 mb-6 border border-orange-200">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg">
                                <IoCashOutline className="text-3xl text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-1">Vendor Settlements</h2>
                                <p className="text-gray-600">Track all payments made to vendors (50% + Incentive/Penalty)</p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by Order ID..."
                                    value={vendorFilters.search}
                                    onChange={(e) => setVendorFilters({ ...vendorFilters, search: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            <select
                                value={vendorFilters.status}
                                onChange={(e) => setVendorFilters({ ...vendorFilters, status: e.target.value })}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            >
                                <option value="">All Status</option>
                                <option value="SUCCESS">Success</option>
                                <option value="PENDING">Pending</option>
                                <option value="FAILED">Failed</option>
                            </select>
                            <button
                                onClick={() => setVendorFilters({ status: "", search: "" })}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {/* Payments Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading vendor settlements...</p>
                            </div>
                        ) : vendorPayments.length === 0 ? (
                            <div className="p-8 text-center">
                                <IoCashOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No vendor settlements found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-orange-50 border-b border-orange-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-orange-700 uppercase">Payment ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-orange-700 uppercase">Vendor</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-orange-700 uppercase">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-orange-700 uppercase">Settlement Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-orange-700 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-orange-700 uppercase">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {vendorPayments.map((payment) => (
                                            <tr key={payment._id} className="hover:bg-orange-50/50">
                                                <td className="px-6 py-4 text-sm font-mono text-gray-600">
                                                    {payment.razorpayOrderId?.slice(-8) || "N/A"}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                                                    {payment.vendor?.name || "N/A"}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-800">
                                                    {payment.user?.name || "N/A"}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-800">
                                                    {formatCurrency(payment.amount)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(payment.status)}`}>
                                                        {payment.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {formatDate(payment.paidAt || payment.createdAt)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {vendorPagination.totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Page {vendorPagination.currentPage} of {vendorPagination.totalPages} ({vendorPagination.totalPayments} total)
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setVendorPagination({ ...vendorPagination, currentPage: vendorPagination.currentPage - 1 })}
                                    disabled={vendorPagination.currentPage === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setVendorPagination({ ...vendorPagination, currentPage: vendorPagination.currentPage + 1 })}
                                    disabled={vendorPagination.currentPage === vendorPagination.totalPages}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Pending Settlements Tab */}
            {activeTab === "settlements" && (
                <div>
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 mb-6 border border-green-200">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-green-500 flex items-center justify-center shadow-lg">
                                <IoTimeOutline className="text-3xl text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-1">Pending Settlements</h2>
                                <p className="text-gray-600">Process vendor settlements after borewell result approval</p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading pending settlements...</p>
                        </div>
                    ) : settlements.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
                            <IoCashOutline className="text-4xl text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 font-semibold">No pending settlements</p>
                            <p className="text-sm text-gray-500 mt-2">All settlements have been processed</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {settlements.map((booking) => (
                                <div
                                    key={booking._id}
                                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                                                    <IoReceiptOutline className="text-2xl text-green-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-800">
                                                        Booking #{booking.bookingId || booking._id.toString().slice(-8)}
                                                    </h3>
                                                    <p className="text-xs text-gray-500">
                                                        {formatDate(booking.createdAt)}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    booking.payment?.vendorSettlement?.settlementType === "SUCCESS"
                                                        ? "bg-green-100 text-green-700"
                                                        : booking.payment?.vendorSettlement?.settlementType === "FAILED"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                }`}>
                                                    {booking.payment?.vendorSettlement?.settlementType || "Pending Approval"}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <p className="text-xs text-gray-600 mb-1">Vendor</p>
                                                    <p className="text-sm font-semibold text-gray-800">{booking.vendor?.name || "N/A"}</p>
                                                    <p className="text-xs text-gray-500">{booking.vendor?.email || ""}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <p className="text-xs text-gray-600 mb-1">User</p>
                                                    <p className="text-sm font-semibold text-gray-800">{booking.user?.name || "N/A"}</p>
                                                    <p className="text-xs text-gray-500">{booking.user?.email || ""}</p>
                                                </div>
                                                <div className="bg-blue-50 rounded-lg p-3">
                                                    <p className="text-xs text-gray-600 mb-1">Settlement Amount</p>
                                                    <p className="text-lg font-bold text-blue-700">
                                                        {formatCurrency(booking.payment?.vendorSettlement?.amount || 0)}
                                                    </p>
                                                </div>
                                                <div className={`rounded-lg p-3 ${
                                                    booking.payment?.vendorSettlement?.incentive
                                                        ? "bg-green-50"
                                                        : booking.payment?.vendorSettlement?.penalty
                                                        ? "bg-red-50"
                                                        : "bg-gray-50"
                                                }`}>
                                                    <p className="text-xs text-gray-600 mb-1">Incentive/Penalty</p>
                                                    <p className={`text-lg font-bold ${
                                                        booking.payment?.vendorSettlement?.incentive
                                                            ? "text-green-700"
                                                            : booking.payment?.vendorSettlement?.penalty
                                                            ? "text-red-700"
                                                            : "text-gray-700"
                                                    }`}>
                                                        {booking.payment?.vendorSettlement?.incentive
                                                            ? `+${formatCurrency(booking.payment.vendorSettlement.incentive)}`
                                                            : booking.payment?.vendorSettlement?.penalty
                                                            ? `-${formatCurrency(booking.payment.vendorSettlement.penalty)}`
                                                            : "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleSettlement(booking._id)}
                                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm whitespace-nowrap shadow-md"
                                        >
                                            Process Settlement
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

