import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoSearchOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoEllipsisVerticalOutline,
  IoEyeOutline,
  IoFilterOutline,
  IoBusinessOutline,
  IoPersonOutline,
  IoDownloadOutline
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useToast } from "../../../hooks/useToast";

export default function AdminVendorBookings() {
  const navigate = useNavigate();
  const toast = useToast();
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
      toast.showError("Failed to fetch vendor bookings");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    const s = status?.toUpperCase();
    switch (s) {
      case "COMPLETED": return "bg-green-100 text-green-700 ring-green-500/10";
      case "PENDING": return "bg-yellow-100 text-yellow-700 ring-yellow-500/10";
      case "CANCELLED":
      case "REJECTED": return "bg-red-100 text-red-700 ring-red-500/10";
      case "ONGOING":
      case "ASSIGNED":
      case "ACCEPTED": return "bg-blue-100 text-blue-700 ring-blue-500/10";
      case "VISITED": return "bg-purple-100 text-purple-700 ring-purple-500/10";
      default: return "bg-gray-100 text-gray-700 ring-gray-500/10";
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch =
      b.bookingId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vendor?.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filter === "all" || b.status?.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const handleExport = () => {
    // Mock export logic
    toast.showSuccess("Exporting vendor bookings...");
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-outfit">Vendor Bookings</h1>
          <p className="text-gray-500 text-sm">Overview of all service requests handled by vendors</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 shadow-sm transition-all"
          >
            <IoDownloadOutline className="text-lg" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Orders"
          value={bookings.length}
          icon={<IoCalendarOutline />}
          color="blue"
        />
        <StatCard
          label="Successful"
          value={bookings.filter(b => b.status === "COMPLETED").length}
          icon={<IoCheckmarkCircleOutline />}
          color="green"
        />
        <StatCard
          label="Active Jobs"
          value={bookings.filter(b => ["ONGOING", "ASSIGNED", "PENDING"].includes(b.status?.toUpperCase())).length}
          icon={<IoTimeOutline />}
          color="yellow"
        />
        <StatCard
          label="Cancellations"
          value={bookings.filter(b => ["CANCELLED", "REJECTED"].includes(b.status?.toUpperCase())).length}
          icon={<IoCloseCircleOutline />}
          color="red"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
          {["all", "pending", "ongoing", "completed", "cancelled"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === cat
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium text-sm outline-none transition-all"
          />
        </div>
      </div>

      {/* List View Table */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Order ID</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Vendor</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Customer</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Total Amount</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Date</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                          <IoCalendarOutline className="text-3xl" />
                        </div>
                        <p className="text-gray-400 font-bold">No results found for your search</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={booking._id}
                      className="hover:bg-blue-50/20 transition-all group"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-gray-900 text-sm">#{booking.bookingId || booking._id.slice(-8).toUpperCase()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                            <IoBusinessOutline />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 line-clamp-1">{booking.vendor?.businessName || booking.vendor?.name || "Unassigned"}</p>
                            <p className="text-[10px] text-gray-400 font-medium">#{booking.vendor?._id?.slice(-6).toUpperCase() || "N/A"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                            <IoPersonOutline />
                          </div>
                          <p className="text-sm font-bold text-gray-700">{booking.user?.name || "Guest"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-gray-900">₹{booking.payment?.totalAmount?.toLocaleString() || booking.finalAmount?.toLocaleString() || '0'}</p>
                        <p className="text-[10px] text-blue-500 font-bold">{booking.paymentMethod?.replace('_', ' ') || 'CASH'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ring-1 ring-inset ${getStatusStyle(booking.status)}`}>
                          {booking.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-600">{new Date(booking.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/bookings/${booking._id}`)}
                            className="p-2 bg-gray-50 text-gray-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"
                            title="View Details"
                          >
                            <IoEyeOutline className="text-lg" />
                          </button>
                          <button className="p-2 bg-gray-50 text-gray-400 hover:bg-gray-100 rounded-xl transition-all shadow-sm">
                            <IoEllipsisVerticalOutline className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-500",
    green: "bg-green-50 text-green-500",
    yellow: "bg-yellow-50 text-yellow-500",
    red: "bg-red-50 text-red-500",
  };

  return (
    <div className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center text-2xl shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
