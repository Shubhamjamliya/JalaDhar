import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoSearchOutline,
  IoFilterOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoBusinessOutline,
  IoChevronForwardOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoEllipsisVerticalOutline,
  IoArrowForwardOutline
} from "react-icons/io5";
import { Link } from "react-router-dom";
import api from "../../../services/api";
import LoadingSpinner from "../../shared/components/LoadingSpinner";

export default function AdminVendorBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/bookings");
      if (response.data.success) {
        setBookings(response.data.data.bookings || []);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed": return "text-green-600 bg-green-50";
      case "pending": return "text-yellow-600 bg-yellow-50";
      case "rejected":
      case "cancelled": return "text-red-600 bg-red-50";
      case "ongoing":
      case "assigned": return "text-blue-600 bg-blue-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.bookingId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || b.status?.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="h-full flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6 p-6 pb-20 lg:pb-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Bookings</h1>
          <p className="text-gray-500 text-sm">Monitor and manage service bookings across all vendors</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Find by ID, Vendor, or User..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full md:w-64 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: bookings.length, icon: IoCalendarOutline, color: "blue" },
          { label: "Ongoing Jobs", value: bookings.filter(b => ["ongoing", "assigned"].includes(b.status?.toLowerCase())).length, icon: IoTimeOutline, color: "orange" },
          { label: "Success Rate", value: bookings.length ? Math.round((bookings.filter(b => b.status?.toLowerCase() === "completed").length / bookings.length) * 100) + "%" : "0%", icon: IoCheckmarkCircleOutline, color: "green" },
          { label: "Cancelled", value: bookings.filter(b => b.status?.toLowerCase() === "cancelled").length, icon: IoCloseCircleOutline, color: "red" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600`}>
              <stat.icon className="text-xl" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Categories/Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {["all", "pending", "ongoing", "completed", "cancelled"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${filter === cat
                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                : "bg-white text-gray-500 border-gray-100 hover:border-blue-200"
              }`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Bookings Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredBookings.map((booking, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              key={booking._id}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </div>
                  <Link to={`/admin/bookings/${booking._id}`} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                    <IoEllipsisVerticalOutline />
                  </Link>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                      <IoBusinessOutline className="text-2xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {booking.vendor?.businessName || booking.vendor?.name || "Unassigned"}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <IoCalendarOutline className="text-blue-500" />
                        {new Date(booking.createdAt).toLocaleDateString()} at {new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 py-4 border-y border-dashed border-gray-100">
                    <div className="flex items-center gap-2 text-sm">
                      <IoPersonOutline className="text-gray-400 shrink-0" />
                      <span className="text-gray-600">User: <span className="font-bold text-gray-900">{booking.user?.name || "N/A"}</span></span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <IoLocationOutline className="text-gray-400 shrink-0 mt-1" />
                      <span className="text-gray-600 line-clamp-2">{booking.address?.address || "Location not provided"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Booking ID</p>
                      <p className="text-sm font-mono font-bold text-gray-900 select-all">#{booking.bookingId}</p>
                    </div>
                    <Link
                      to={`/admin/bookings/${booking._id}`}
                      className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all group/btn shadow-sm"
                    >
                      <IoArrowForwardOutline className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredBookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
            <IoCalendarOutline className="text-4xl" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No bookings found</h3>
          <p className="text-gray-500">Try changing your filters or search query</p>
        </div>
      )}
    </div>
  );
}
