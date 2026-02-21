import { useState, useEffect } from "react";
import {
  IoSearchOutline,
  IoEyeOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoRocketOutline,
  IoConstructOutline,
  IoDocumentTextOutline,
  IoWalletOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getAllBookings } from "../../../services/adminApi";
import { useToast } from "../../../hooks/useToast";
import LoadingSpinner from "../../shared/components/LoadingSpinner";

export default function AdminBookingTracking() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const toast = useToast();

  useEffect(() => {
    loadBookings();
  }, [search]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await getAllBookings({ search, limit: 10 });
      if (response.success) {
        setBookings(response.data.bookings || []);
        if (response.data.bookings.length > 0 && !selectedBooking) {
          setSelectedBooking(response.data.bookings[0]);
        }
      }
    } catch (err) {
      console.error("Load bookings error:", err);
      toast.showError("Failed to load tracking data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status) => {
    const statusMap = {
      'PENDING': 0,
      'ASSIGNED': 1,
      'ACCEPTED': 1,
      'VISITED': 2,
      'REPORT_UPLOADED': 3,
      'BOREWELL_UPLOADED': 3,
      'AWAITING_PAYMENT': 4,
      'PAYMENT_SUCCESS': 4,
      'FINAL_SETTLEMENT': 4,
      'COMPLETED': 5,
      'ADMIN_APPROVED': 5
    };
    return statusMap[status] ?? 0;
  };

  const steps = [
    { title: 'Requested', icon: IoTimeOutline, desc: 'Booking submitted' },
    { title: 'Assignment', icon: IoRocketOutline, desc: 'Partner assigned' },
    { title: 'Site Visit', icon: IoConstructOutline, desc: 'Partner visited site' },
    { title: 'Documentation', icon: IoDocumentTextOutline, desc: 'Reports uploaded' },
    { title: 'Payment', icon: IoWalletOutline, desc: 'Invoicing & payment' },
    { title: 'Finalized', icon: IoCheckmarkCircleOutline, desc: 'Service completed' }
  ];

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-outfit">Live Tracking</h1>
          <p className="text-gray-500 text-sm">Monitor real-time progress of active services</p>
        </div>
        <div className="relative w-full md:w-96">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            placeholder="Search Booking ID or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left: Booking List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-1">
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 sticky top-0 z-10">
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client / Service</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading && bookings.length === 0 ? (
                  <tr><td colSpan="4" className="p-20 text-center"><LoadingSpinner /></td></tr>
                ) : bookings.length === 0 ? (
                  <tr><td colSpan="4" className="p-20 text-center text-gray-500 font-medium">No active bookings found</td></tr>
                ) : (
                  bookings.map((booking) => (
                    <tr
                      key={booking._id}
                      onClick={() => setSelectedBooking(booking)}
                      className={`hover:bg-blue-50/30 transition-all cursor-pointer group ${selectedBooking?._id === booking._id ? 'bg-blue-50/80 shadow-inner' : ''}`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                            {booking.user?.name?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {booking.user?.name || 'Guest User'}
                            </p>
                            <p className="text-xs text-blue-500 font-medium font-outfit">
                              {booking.service?.name?.slice(0, 25) || 'Standard Service'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-1000"
                            style={{ width: `${((getStatusStep(booking.status) + 1) / steps.length) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-700 shadow-sm">
                          {booking.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                          <IoChevronForwardOutline className="text-lg" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Detailed Timeline */}
        <div className="w-full lg:w-[400px] bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col overflow-y-auto custom-scrollbar h-full">
          <AnimatePresence mode="wait">
            {selectedBooking ? (
              <motion.div
                key={selectedBooking._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">In Progress</p>
                    <h2 className="text-xl font-bold font-outfit text-gray-900">
                      #{selectedBooking._id.slice(-8).toUpperCase()}
                    </h2>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/bookings/${selectedBooking._id}`)}
                    className="p-3 bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all"
                  >
                    <IoEyeOutline className="text-xl" />
                  </button>
                </div>

                <div className="space-y-8 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                  {steps.map((step, idx) => {
                    const currentIdx = getStatusStep(selectedBooking.status);
                    const isDone = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div key={idx} className="relative pl-14 group">
                        <div className={`absolute left-0 top-0 w-12 h-12 rounded-2xl flex items-center justify-center z-10 transition-all duration-500 ${isDone ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-400 scale-90 opacity-50'}`}>
                          <step.icon className="text-xl" />
                        </div>
                        <div>
                          <h4 className={`font-bold text-sm ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                            {step.title}
                          </h4>
                          <p className={`text-xs ${isDone ? 'text-blue-500' : 'text-gray-400'} font-medium`}>
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-8 border-t border-gray-100 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                      <IoConstructOutline className="text-lg" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Service Partner</p>
                      <p className="text-sm font-bold text-gray-800">{selectedBooking.vendor?.name || 'Searching...'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                      <IoTimeOutline className="text-lg" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Update</p>
                      <p className="text-sm font-bold text-gray-800">{new Date(selectedBooking.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                  <IoRocketOutline className="text-4xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Select a Booking</h3>
                  <p className="text-gray-400 text-sm">Select any record from the left to view its detailed timeline</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
