import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IoSearchOutline,
  IoFilterOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoLocationOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoEllipsisVertical,
  IoEyeOutline,
  IoArrowForward
} from "react-icons/io5";
import { getAllBookings } from "../../../services/adminApi";
import { useToast } from "../../../hooks/useToast";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useNavigate } from "react-router-dom";

export default function AdminUserBookings() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBookings: 0
  });

  useEffect(() => {
    fetchBookings();
  }, [filters.page, filters.status]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.page === 1) {
        fetchBookings();
      } else {
        setFilters(prev => ({ ...prev, page: 1 }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: filters.limit,
        status: filters.status || undefined,
        search: filters.search || undefined
      };

      const response = await getAllBookings(params);
      if (response.success) {
        setBookings(response.data.bookings || []);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      toast.showError("Failed to load user bookings");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-700 border-green-200";
      case "PENDING": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
      case "ASSIGNED": return "bg-blue-100 text-blue-700 border-blue-200";
      case "ACCEPTED": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 p-6 pb-20 lg:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Bookings</h1>
          <p className="text-gray-500">View and manage all service bookings made by users</p>
        </div>
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-md">All Time</button>
          <button className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-lg text-sm font-medium transition-all">Today</button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Total Bookings</p>
          <h3 className="text-2xl font-bold text-gray-900">{pagination.totalBookings}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Active Bookings</p>
          <h3 className="text-2xl font-bold text-gray-900">{bookings.filter(b => b.status === 'PENDING' || b.status === 'ASSIGNED' || b.status === 'ACCEPTED').length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium mb-1">Completion Rate</p>
          <h3 className="text-2xl font-bold text-gray-900">88.4%</h3>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            placeholder="Search by User, Phone, Booking ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
          />
        </div>
        <select
          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Bookings Grid/List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 flex justify-center"><LoadingSpinner /></div>
        ) : bookings.length === 0 ? (
          <div className="bg-white py-20 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center">
            <IoCalendarOutline className="text-5xl text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No bookings found</p>
          </div>
        ) : (
          bookings.map((booking) => (
            <motion.div
              key={booking._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <IoPersonOutline className="text-2xl" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">{booking.user?.name || 'Guest User'}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><IoTimeOutline /> {new Date(booking.scheduledDate).toLocaleDateString()} at {booking.scheduledTime || 'N/A'}</span>
                      <span className="flex items-center gap-1 font-medium text-blue-600">ID: #{booking._id.slice(-8).toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-6 lg:gap-10">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Service</p>
                    <p className="text-sm font-bold text-gray-700">{booking.service?.name || 'Water Service'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Amount</p>
                    <p className="text-sm font-bold text-gray-900">₹{booking.payment?.totalAmount || '0'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Vendor</p>
                    <p className="text-sm font-medium text-gray-600">{booking.vendor?.name || 'Not Assigned'}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/bookings/${booking._id}`)}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-blue-600 hover:text-white transition-all transform group-hover:scale-105"
                  >
                    <IoEyeOutline />
                    <span className="text-sm font-bold text-nowrap">View Details</span>
                    <IoArrowForward className="text-xs" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={filters.page === 1}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-50 hover:border-blue-500 transition-all font-medium"
          >
            Previous
          </button>
          <span className="text-sm font-bold text-gray-500">Page {filters.page} of {pagination.totalPages}</span>
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
            disabled={filters.page === pagination.totalPages}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-50 hover:border-blue-500 transition-all font-medium"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
