import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IoNotificationsOutline, IoTrashOutline,
  IoCheckmarkDoneOutline,
  IoCalendarOutline, IoDocumentTextOutline,
  IoAlertCircleOutline, IoWalletOutline,
  IoCashOutline, IoShieldCheckmarkOutline,
  IoPersonOutline, IoStarOutline,
} from 'react-icons/io5';
import { useNotifications } from '../contexts/NotificationContext';
import { getNotificationUrl } from '../utils/notificationUtils';

// Map notification type -> { icon, color }
const TYPE_META = {
  BOOKING_CREATED:            { icon: IoCalendarOutline,        color: 'text-blue-600 bg-blue-50' },
  BOOKING_ASSIGNED:           { icon: IoCalendarOutline,        color: 'text-blue-600 bg-blue-50' },
  BOOKING_ACCEPTED:           { icon: IoCalendarOutline,        color: 'text-green-600 bg-green-50' },
  BOOKING_REJECTED:           { icon: IoAlertCircleOutline,     color: 'text-red-600 bg-red-50' },
  BOOKING_VISITED:            { icon: IoCalendarOutline,        color: 'text-indigo-600 bg-indigo-50' },
  BOOKING_CANCELLED:          { icon: IoAlertCircleOutline,     color: 'text-red-600 bg-red-50' },
  BOOKING_COMPLETED:          { icon: IoShieldCheckmarkOutline, color: 'text-emerald-600 bg-emerald-50' },
  BOOKING_FAILED:             { icon: IoAlertCircleOutline,     color: 'text-red-600 bg-red-50' },
  BOOKING_REASSIGNED:         { icon: IoCalendarOutline,        color: 'text-orange-600 bg-orange-50' },
  REPORT_UPLOADED:            { icon: IoDocumentTextOutline,    color: 'text-purple-600 bg-purple-50' },
  REPORT_APPROVED:            { icon: IoDocumentTextOutline,    color: 'text-green-600 bg-green-50' },
  REPORT_REJECTED:            { icon: IoDocumentTextOutline,    color: 'text-red-600 bg-red-50' },
  BOREWELL_UPLOADED:          { icon: IoDocumentTextOutline,    color: 'text-teal-600 bg-teal-50' },
  BOREWELL_APPROVED:          { icon: IoShieldCheckmarkOutline, color: 'text-teal-600 bg-teal-50' },
  PAYMENT_ADVANCE_SUCCESS:    { icon: IoCashOutline,            color: 'text-green-600 bg-green-50' },
  PAYMENT_REMAINING_SUCCESS:  { icon: IoCashOutline,            color: 'text-green-600 bg-green-50' },
  PAYMENT_FAILED:             { icon: IoCashOutline,            color: 'text-red-600 bg-red-50' },
  PAYMENT_RECEIVED:           { icon: IoCashOutline,            color: 'text-green-600 bg-green-50' },
  FIRST_INSTALLMENT_PAID:     { icon: IoWalletOutline,          color: 'text-blue-600 bg-blue-50' },
  SETTLEMENT_COMPLETED:       { icon: IoWalletOutline,          color: 'text-emerald-600 bg-emerald-50' },
  FINAL_SETTLEMENT_PROCESSED: { icon: IoWalletOutline,          color: 'text-emerald-600 bg-emerald-50' },
  TRAVEL_CHARGES_REQUESTED:   { icon: IoCashOutline,            color: 'text-orange-600 bg-orange-50' },
  TRAVEL_CHARGES_APPROVED:    { icon: IoCashOutline,            color: 'text-green-600 bg-green-50' },
  TRAVEL_CHARGES_REJECTED:    { icon: IoCashOutline,            color: 'text-red-600 bg-red-50' },
  VENDOR_APPROVED:            { icon: IoPersonOutline,          color: 'text-green-600 bg-green-50' },
  VENDOR_REJECTED:            { icon: IoPersonOutline,          color: 'text-red-600 bg-red-50' },
  NEW_VENDOR_REGISTRATION:    { icon: IoPersonOutline,          color: 'text-blue-600 bg-blue-50' },
  NEW_BOOKING_PENDING:        { icon: IoCalendarOutline,        color: 'text-orange-600 bg-orange-50' },
  NEW_DISPUTE:                { icon: IoAlertCircleOutline,     color: 'text-red-600 bg-red-50' },
  DISPUTE_UPDATED:            { icon: IoAlertCircleOutline,     color: 'text-orange-600 bg-orange-50' },
  NEW_RATING:                 { icon: IoStarOutline,            color: 'text-amber-600 bg-amber-50' },
  PAYMENT_REFUNDED:           { icon: IoCashOutline,            color: 'text-blue-600 bg-blue-50' },
  REFUND_PROCESSED:           { icon: IoCashOutline,            color: 'text-blue-600 bg-blue-50' },
};

const NotificationDropdown = ({ disablePopup = false }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, userRole, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const notificationsPageUrl =
    location.pathname.startsWith('/vendor') ? '/vendor/notifications' :
    location.pathname.startsWith('/admin')  ? '/admin/notifications' :
    '/user/notifications';

  useEffect(() => {
    if (disablePopup) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, disablePopup]);

  const handleNotificationClick = async (notification) => {
    const notificationId = notification.id || notification._id;
    if (!notification.isRead) await markAsRead(notificationId);
    const url = getNotificationUrl(notification, userRole);
    if (url) { setIsOpen(false); navigate(url); }
  };

  const handleViewAll = () => { setIsOpen(false); navigate(notificationsPageUrl); };

  const handleBellClick = () => {
    if (disablePopup) {
      navigate('/notification');
    } else {
      setIsOpen((o) => !o);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  const handleDeleteItem = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const diff = Date.now() - new Date(dateString);
    const mins = Math.floor(diff / 60000);
    const hrs  = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs  < 24) return `${hrs}h ago`;
    if (days < 7)  return `${days}d ago`;
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const displayed = notifications.slice(0, 8);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell */}
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <IoNotificationsOutline className="text-2xl text-[#0A84FF]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {!disablePopup && isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 flex flex-col overflow-hidden">

            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-gray-900 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#0A84FF] text-white text-[10px] font-black rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-[11px] text-[#0A84FF] font-bold hover:underline"
                >
                  <IoCheckmarkDoneOutline className="text-sm" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto max-h-[60vh]">
              {displayed.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-3 px-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                    <IoNotificationsOutline className="text-2xl text-gray-300" />
                  </div>
                  <p className="text-sm font-bold text-gray-400">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {displayed.map((notification) => {
                    const nId      = notification.id || notification._id;
                    const isUnread = !notification.isRead;
                    const meta     = TYPE_META[notification.type] || { icon: IoNotificationsOutline, color: 'text-gray-600 bg-gray-100' };
                    const Icon     = meta.icon;
                    const url      = getNotificationUrl(notification, userRole);

                    return (
                      <div
                        key={nId}
                        onClick={() => handleNotificationClick(notification)}
                        className={`px-4 py-3.5 flex items-start gap-3 group transition-all
                          ${isUnread ? 'bg-blue-50/40' : 'bg-white'}
                          ${url ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}`}
                      >
                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                          <Icon className="text-base" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className={`text-xs font-black leading-snug line-clamp-1 ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isUnread && <span className="w-2 h-2 bg-[#0A84FF] rounded-full mt-0.5" />}
                              <button
                                type="button"
                                onClick={(e) => handleDeleteItem(e, nId)}
                                className="p-1 text-gray-300 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <IoTrashOutline className="text-xs" />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1 font-medium">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={handleViewAll}
                className="w-full text-center text-xs font-black text-[#0A84FF] hover:underline"
              >
                View all notifications →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;
