import { useState } from "react";
import {
  IoBellOutline,
  IoCheckmarkDoneOutline,
  IoTrashOutline,
  IoInformationCircleOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoCloseCircleOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminBookingNotifications() {
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New Booking Request",
      message: "Mr. Ramesh has requested a Groundwater Survey for sector 45.",
      time: "2 mins ago",
      type: "new",
      unread: true,
    },
    {
      id: 2,
      title: "Payment Received",
      message: "Advance payment of ₹5,000 received for Booking #JD782.",
      time: "1 hour ago",
      type: "payment",
      unread: true,
    },
    {
      id: 3,
      title: "Service Completed",
      message: "Booking #JD652 has been marked as completed by Partner Anil.",
      time: "Yesterday",
      type: "success",
      unread: false,
    },
    {
      id: 4,
      title: "Booking Cancelled",
      message: "Booking #JD112 was cancelled due to vendor unavailability.",
      time: "2 days ago",
      type: "error",
      unread: false,
    }
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const filtered = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "unread") return n.unread;
    return n.type === filter;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-gray-900">Booking Alerts</h1>
          <p className="text-gray-500 text-sm">Stay updated with the latest activity across the platform</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-2xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all"
          >
            <IoCheckmarkDoneOutline className="text-lg" />
            Mark All Read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
        {['all', 'unread', 'new', 'payment', 'success', 'error'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${filter === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-gray-100"
            >
              <IoBellOutline className="text-5xl text-gray-200 mb-4" />
              <p className="text-gray-400 font-medium">No alerts found in this category</p>
            </motion.div>
          ) : (
            filtered.map((n, i) => (
              <motion.div
                layout
                key={n.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 transition-all group ${n.unread ? 'ring-1 ring-blue-500 bg-blue-50/10' : ''}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${n.type === 'new' ? 'bg-blue-50 text-blue-600' : n.type === 'payment' ? 'bg-yellow-50 text-yellow-600' : n.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {n.type === 'new' ? <IoBellOutline /> : n.type === 'payment' ? <IoInformationCircleOutline /> : n.type === 'success' ? <IoCheckmarkCircleOutline /> : <IoAlertCircleOutline />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{n.title}</h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{n.time}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="p-3 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    title="View Details"
                  >
                    <IoChevronForwardOutline className="text-lg" />
                  </button>
                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete"
                  >
                    <IoTrashOutline className="text-lg" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
