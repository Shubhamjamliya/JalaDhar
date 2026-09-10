import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiBriefcase, FiShoppingBag, FiDollarSign, FiActivity } from 'react-icons/fi';
import RevenueLineChart from '../admin-component/dashboard/RevenueLineChart';
import BookingsBarChart from '../admin-component/dashboard/BookingsBarChart';
import BookingStatusPieChart from '../admin-component/dashboard/BookingStatusPieChart';
import PaymentBreakdownPieChart from '../admin-component/dashboard/PaymentBreakdownPieChart';
import RevenueVsBookingsChart from '../admin-component/dashboard/RevenueVsBookingsChart';
import TimePeriodFilter from '../admin-component/dashboard/TimePeriodFilter';
import { formatCurrency } from '../utils/adminHelpers';
import CustomerGrowthAreaChart from '../admin-component/dashboard/CustomerGrowthAreaChart';
import TopServices from '../admin-component/dashboard/TopServices';
import RecentBookings from '../admin-component/dashboard/RecentBookings';
import TodaysActivity from '../admin-component/dashboard/TodaysActivity';
import PendingActions from '../admin-component/dashboard/PendingActions';
import PlatformFeesWidget from '../admin-component/dashboard/PlatformFeesWidget';
import ExpertPerformance from '../admin-component/dashboard/ExpertPerformance';
import AdminAlerts from '../admin-component/dashboard/AdminAlerts';
import { getDashboardStats, getRevenueAnalytics } from '../../../services/adminDashboardService';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { hasAdminPermission } from '../../../utils/permissionUtils';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { admin } = useAdminAuth();
    const [period, setPeriod] = useState('month');
    const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' });
    const [revenueData, setRevenueData] = useState([]);
    const [recentBookingsList, setRecentBookingsList] = useState([]);
    const [todaysActivityData, setTodaysActivityData] = useState(null);
    const [pendingActionsData, setPendingActionsData] = useState(null);
    const [platformFeesData, setPlatformFeesData] = useState(null);
    const [expertPerformanceData, setExpertPerformanceData] = useState([]);
    const [alertsData, setAlertsData] = useState([]);
    const [statusDistributionData, setStatusDistributionData] = useState([]);
    const [vendorPaymentBreakdownData, setVendorPaymentBreakdownData] = useState([]);
    const [topServicesData, setTopServicesData] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalVendors: 0,
        activeBookings: 0,
        completedBookings: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        periodRevenue: 0,
        periodBookings: 0,
        periodCompletedBookings: 0,
        periodNewUsers: 0,
        periodNewVendors: 0,
    });

    const canReports = hasAdminPermission(admin, 'reports');
    const canBookings = hasAdminPermission(admin, 'bookings');
    const canUsers = hasAdminPermission(admin, 'users');
    const canVendors = hasAdminPermission(admin, 'vendors');
    const canPayments = hasAdminPermission(admin, 'payments');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Compute range & API grouping
                const now = new Date();
                let startDate = new Date();
                let endDate = new Date();
                let apiPeriod = 'daily';

                if (period === 'today') {
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                    apiPeriod = 'hourly';
                } else if (period === 'week') {
                    const day = now.getDay();
                    const diffToMonday = day === 0 ? 6 : day - 1;
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
                    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                    apiPeriod = 'daily';
                } else if (period === 'month') {
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
                    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                    apiPeriod = 'daily';
                } else if (period === 'year') {
                    startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
                    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                    apiPeriod = 'monthly';
                } else if (period === 'custom' && customRange.startDate && customRange.endDate) {
                    startDate = new Date(customRange.startDate);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(customRange.endDate);
                    endDate.setHours(23, 59, 59, 999);
                    const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 1) {
                        apiPeriod = 'hourly';
                    } else if (diffDays > 60) {
                        apiPeriod = 'monthly';
                    } else {
                        apiPeriod = 'daily';
                    }
                }

                const startIso = startDate.toISOString();
                const endIso = endDate.toISOString();

                // 1. Fetch Stats & Dashboard Analytics with period range
                const statsRes = await getDashboardStats({ startDate: startIso, endDate: endIso });
                if (statsRes.success) {
                    const s = statsRes.data.stats;
                    setStats({
                        totalUsers: s.totalUsers,
                        totalVendors: s.totalVendors,
                        activeBookings: s.pendingBookings,
                        completedBookings: s.completedBookings,
                        totalRevenue: s.totalRevenue,
                        todayRevenue: s.todayRevenue || 0,
                        periodRevenue: s.periodRevenue,
                        periodBookings: s.periodBookings,
                        periodCompletedBookings: s.periodCompletedBookings,
                        periodNewUsers: s.periodNewUsers,
                        periodNewVendors: s.periodNewVendors,
                    });
                    setRecentBookingsList(statsRes.data.recentBookings || []);
                    setTodaysActivityData(statsRes.data.todaysActivity || null);
                    setPendingActionsData(statsRes.data.pendingActions || null);
                    setPlatformFeesData(statsRes.data.platformFees || null);
                    setExpertPerformanceData(statsRes.data.expertPerformance || []);
                    setAlertsData(statsRes.data.alerts || []);
                    setStatusDistributionData(statsRes.data.bookingStatusDistribution || []);
                    setVendorPaymentBreakdownData(statsRes.data.vendorPaymentBreakdown || []);
                    setTopServicesData(statsRes.data.topServices || []);
                }

                // 2. Fetch Revenue Analytics based on Period
                const revRes = await getRevenueAnalytics({
                    period: apiPeriod,
                    startDate: startIso,
                    endDate: endIso
                });

                if (revRes.success) {
                    const mapped = revRes.data.revenueData.map(item => ({
                        date: item._id,
                        revenue: item.revenue,
                        orders: item.bookings
                    }));
                    mapped.sort((a, b) => new Date(a.date) - new Date(b.date));
                    setRevenueData(mapped);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchData();
    }, [period, customRange.startDate, customRange.endDate]);

    const handlePeriodChange = (newPeriod, newCustomRange) => {
        setPeriod(newPeriod);
        if (newCustomRange) {
            setCustomRange(newCustomRange);
        }
    };

    const handleExportCsv = () => {
        try {
            const rows = revenueData.map((r) => ({
                date: r.date,
                bookings: r.orders,
                revenue: r.revenue,
            }));

            const headers = ['date', 'bookings', 'revenue'];
            const csv = [
                headers.join(','),
                ...rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')),
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `admin_dashboard_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('CSV export failed', e);
            alert('Export failed.');
        }
    };

    const onViewBooking = (booking) => {
        if (canBookings && (booking?._id || booking?.id)) {
            navigate(`/admin/bookings/${booking._id || booking.id}`);
        }
    };

    const periodLabel = period === 'today'
        ? 'Today'
        : period === 'week'
        ? 'This Week'
        : period === 'month'
        ? 'This Month'
        : period === 'year'
        ? 'This Year'
        : 'Selected Range';

    const statsCards = [
        {
            title: `Revenue (${periodLabel})`,
            value: formatCurrency(stats.periodRevenue !== undefined ? stats.periodRevenue : stats.totalRevenue),
            subtitle: `All-time: ${formatCurrency(stats.totalRevenue || 0)}`,
            change: 0,
            icon: FiDollarSign,
            color: 'text-white',
            bgColor: 'bg-gradient-to-br from-green-500 to-emerald-600',
            cardBg: 'bg-gradient-to-br from-green-50 to-emerald-50',
            iconBg: 'bg-white/20',
            link: canReports ? '/admin/reports/revenue' : (canPayments ? '/admin/payments' : null)
        },
        {
            title: `Bookings (${periodLabel})`,
            value: (stats.periodBookings !== undefined ? stats.periodBookings : stats.activeBookings || 0).toLocaleString(),
            subtitle: `${stats.activeBookings || 0} active now`,
            change: 0,
            icon: FiShoppingBag,
            color: 'text-white',
            bgColor: 'bg-gradient-to-br from-blue-500 to-indigo-600',
            cardBg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
            iconBg: 'bg-white/20',
            link: canBookings ? '/admin/bookings' : (canReports ? '/admin/reports/bookings' : null)
        },
        {
            title: `Completed (${periodLabel})`,
            value: (stats.periodCompletedBookings !== undefined ? stats.periodCompletedBookings : stats.completedBookings || 0).toLocaleString(),
            subtitle: `${stats.completedBookings || 0} total completed`,
            change: 0,
            icon: FiActivity,
            color: 'text-white',
            bgColor: 'bg-gradient-to-br from-purple-500 to-violet-600',
            cardBg: 'bg-gradient-to-br from-purple-50 to-violet-50',
            iconBg: 'bg-white/20',
            link: canBookings ? '/admin/bookings' : (canReports ? '/admin/reports/bookings' : null)
        },
        {
            title: `New Users (${periodLabel})`,
            value: (stats.periodNewUsers !== undefined ? stats.periodNewUsers : stats.totalUsers || 0).toLocaleString(),
            subtitle: `${stats.totalUsers || 0} total users`,
            change: 0,
            icon: FiUser,
            color: 'text-white',
            bgColor: 'bg-gradient-to-br from-orange-500 to-amber-600',
            cardBg: 'bg-gradient-to-br from-orange-50 to-amber-50',
            iconBg: 'bg-white/20',
            link: canUsers ? '/admin/users' : null
        },
        {
            title: `New Experts (${periodLabel})`,
            value: (stats.periodNewVendors !== undefined ? stats.periodNewVendors : stats.totalVendors || 0).toLocaleString(),
            subtitle: `${stats.totalVendors || 0} total experts`,
            change: 0,
            icon: FiBriefcase,
            color: 'text-white',
            bgColor: 'bg-gradient-to-br from-teal-500 to-cyan-600',
            cardBg: 'bg-gradient-to-br from-teal-50 to-cyan-50',
            iconBg: 'bg-white/20',
            link: canVendors ? '/admin/vendors' : null
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <div className="flex flex-col gap-3">
                <div className="w-full">
                    <TimePeriodFilter
                        selectedPeriod={period}
                        onPeriodChange={handlePeriodChange}
                        onExport={handleExportCsv}
                        customRange={customRange}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                {statsCards.map((card, index) => {
                    const Icon = card.icon;
                    const isPositive = (card.change || 0) >= 0;
                    const isClickable = Boolean(card.link);

                    return (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 }}
                            onClick={() => isClickable && navigate(card.link)}
                            className={`${card.cardBg} rounded-xl p-3 sm:p-4 shadow-sm border border-transparent ${
                                isClickable ? 'hover:shadow-md cursor-pointer group' : 'cursor-default'
                            } transition-all duration-300 relative overflow-hidden`}
                        >
                            <div className={`absolute top-0 right-0 w-24 h-24 ${card.bgColor} opacity-10 rounded-full -mr-12 -mt-12 ${
                                isClickable ? 'group-hover:scale-110' : ''
                            } transition-transform`} />

                            <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-10">
                                <div className={`${card.bgColor} ${card.iconBg} p-1.5 sm:p-2 rounded-lg shadow-sm`}>
                                    <Icon className={`${card.color} text-base sm:text-lg`} />
                                </div>
                                {card.change !== 0 && (
                                    <div
                                        className={`text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-full ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}
                                    >
                                        {isPositive ? '+' : ''}
                                        {Math.abs(card.change || 0)}%
                                    </div>
                                )}
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-gray-600 text-[10px] sm:text-xs font-medium mb-0.5 truncate">{card.title}</h3>
                                <p className="text-gray-800 text-lg sm:text-xl font-bold">{card.value}</p>
                                {card.subtitle && (
                                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5 truncate">{card.subtitle}</p>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Admin Alerts Widget */}
            <AdminAlerts alerts={alertsData} />

            {/* Today's Activity Widget */}
            <TodaysActivity todaysActivity={todaysActivityData} />

            {/* Pending Actions Widget */}
            <PendingActions pendingActions={pendingActionsData} />

            {/* Revenue & Platform Fees + Expert Performance Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PlatformFeesWidget platformFees={platformFeesData} />
                <ExpertPerformance expertPerformance={expertPerformanceData} />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RevenueLineChart data={revenueData} period={period} />
                <BookingsBarChart data={revenueData} period={period} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BookingStatusPieChart bookings={recentBookingsList} statusDistribution={statusDistributionData} />
                <PaymentBreakdownPieChart bookings={recentBookingsList} vendorPaymentBreakdown={vendorPaymentBreakdownData} />
            </div>

            <div className="grid grid-cols-1 gap-4">
                <RevenueVsBookingsChart data={revenueData} period={period} />
            </div>

            <div className="grid grid-cols-1 gap-4">
                <CustomerGrowthAreaChart timelineData={revenueData} bookings={recentBookingsList} period={period} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TopServices
                    bookings={recentBookingsList}
                    topServicesList={topServicesData}
                    periodLabel="Top Booked Services"
                />
                <RecentBookings bookings={recentBookingsList} onViewBooking={onViewBooking} />
            </div>
        </motion.div>
    );
};

export default AdminDashboard;
