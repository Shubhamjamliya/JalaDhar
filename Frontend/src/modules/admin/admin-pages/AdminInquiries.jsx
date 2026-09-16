import { useState, useEffect, useCallback } from 'react';
import {
  IoMailOutline,
  IoCallOutline,
  IoLogoWhatsapp,
  IoSearchOutline,
  IoRefreshOutline,
  IoTrashOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoPersonOutline,
  IoChatbubblesOutline,
  IoAlertCircleOutline,
  IoFilterOutline
} from 'react-icons/io5';
import {
  getAdminInquiries,
  getAdminInquiryStats,
  updateAdminInquiry,
  deleteAdminInquiry
} from '../../../services/inquiryApi';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { useToast } from '../../../hooks/useToast';

export default function AdminInquiries() {
  const toast = useToast();
  const [inquiries, setInquiries] = useState([]);
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [userTypeFilter, setUserTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 15 });
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchStats = async () => {
    try {
      const res = await getAdminInquiryStats();
      if (res?.success && res?.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load inquiry stats:', err);
    }
  };

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        status: statusFilter,
        userType: userTypeFilter,
        search: debouncedSearch
      };
      const res = await getAdminInquiries(params);
      if (res?.success) {
        setInquiries(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load inquiries:', err);
      toast?.error?.(err.response?.data?.message || 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, userTypeFilter, debouncedSearch]);

  useEffect(() => {
    fetchInquiries();
    fetchStats();
  }, [fetchInquiries]);

  const handleStatusChange = async (inquiryId, newStatus) => {
    setUpdatingId(inquiryId);
    try {
      const res = await updateAdminInquiry(inquiryId, { status: newStatus });
      if (res?.success) {
        setInquiries(prev =>
          prev.map(inq => inq._id === inquiryId ? { ...inq, status: newStatus, respondedAt: new Date() } : inq)
        );
        fetchStats();
        toast?.success?.(`Inquiry status marked as ${newStatus}`);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      toast?.error?.(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (inquiryId) => {
    if (!window.confirm('Are you sure you want to delete this inquiry? This cannot be undone.')) {
      return;
    }
    setDeletingId(inquiryId);
    try {
      const res = await deleteAdminInquiry(inquiryId);
      if (res?.success) {
        setInquiries(prev => prev.filter(inq => inq._id !== inquiryId));
        fetchStats();
        toast?.success?.('Inquiry deleted successfully');
      }
    } catch (err) {
      console.error('Failed to delete inquiry:', err);
      toast?.error?.(err.response?.data?.message || 'Failed to delete inquiry');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <IoMailOutline className="text-blue-600" /> Contact Inquiries & Leads
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review customer messages and inquiries submitted via the Jaladhaara Landing Page
          </p>
        </div>
        <button
          onClick={() => { fetchInquiries(); fetchStats(); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs self-start sm:self-auto"
        >
          <IoRefreshOutline className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Leads</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <IoChatbubblesOutline className="text-lg" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.total}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700">New / Uncontacted</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-xs">
              <IoAlertCircleOutline className="text-lg" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">{stats.new}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700">In Contact</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <IoTimeOutline className="text-lg" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{stats.contacted}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">Resolved</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <IoCheckmarkCircleOutline className="text-lg" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{stats.resolved}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, email, or message..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'NEW', label: 'New' },
            { id: 'CONTACTED', label: 'Contacted' },
            { id: 'RESOLVED', label: 'Resolved' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* User Type Dropdown Filter */}
        <div className="shrink-0 flex items-center gap-2">
          <IoFilterOutline className="text-slate-400" />
          <select
            value={userTypeFilter}
            onChange={(e) => { setUserTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Customer / User">Customer / User</option>
            <option value="Groundwater Expert">Groundwater Expert</option>
            <option value="Business / Organization">Business / Org</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Inquiry List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <IoMailOutline className="text-3xl" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Inquiries Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL' || userTypeFilter !== 'ALL'
              ? 'No inquiries match your current search or filter criteria.'
              : 'Messages submitted through the Landing Page Contact form will show up here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => {
            const cleanPhone = (inq.mobile || '').replace(/\D/g, '');
            const whatsappUrl = cleanPhone ? `https://wa.me/91${cleanPhone.slice(-10)}` : null;

            return (
              <div
                key={inq._id}
                className={`bg-white rounded-2xl border transition-all shadow-xs hover:shadow-md p-5 sm:p-6 ${
                  inq.status === 'NEW'
                    ? 'border-blue-300 ring-1 ring-blue-100'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Lead Profile & Details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                        {(inq.name || 'U')[0].toUpperCase()}
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{inq.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {inq.userType}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          inq.status === 'NEW'
                            ? 'bg-blue-100 text-blue-700'
                            : inq.status === 'CONTACTED'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {inq.status}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-auto sm:ml-0">
                        {formatDateTime(inq.createdAt)}
                      </span>
                    </div>

                    {/* Contact details */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5">
                        <IoCallOutline className="text-blue-600 text-sm" />
                        <span>{inq.mobile}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <IoMailOutline className="text-blue-600 text-sm" />
                        <span>{inq.email}</span>
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="bg-slate-50 border-l-4 border-blue-500 rounded-r-xl p-3.5 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {inq.message}
                    </div>

                    {/* Admin Response info if any */}
                    {inq.respondedAt && (
                      <p className="text-[11px] text-slate-400 italic">
                        Last status change: {formatDateTime(inq.respondedAt)}
                        {inq.respondedBy?.name ? ` by ${inq.respondedBy.name}` : ''}
                      </p>
                    )}
                  </div>

                  {/* Right: Quick Action Buttons & Status Manager */}
                  <div className="flex lg:flex-col items-center lg:items-end gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    <div className="flex items-center gap-1.5">
                      {/* Call Link */}
                      <a
                        href={`tel:${inq.mobile}`}
                        title="Call Lead"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors"
                      >
                        <IoCallOutline />
                        <span className="hidden sm:inline">Call</span>
                      </a>

                      {/* WhatsApp Link */}
                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Chat on WhatsApp"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors"
                        >
                          <IoLogoWhatsapp className="text-emerald-600" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </a>
                      )}

                      {/* Email Link */}
                      <a
                        href={`mailto:${inq.email}?subject=Regarding your inquiry with Jaladhaara`}
                        title="Send Email"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                      >
                        <IoMailOutline />
                        <span className="hidden sm:inline">Email</span>
                      </a>
                    </div>

                    {/* Status Changer Dropdown */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">Status:</span>
                      <select
                        value={inq.status}
                        disabled={updatingId === inq._id}
                        onChange={(e) => handleStatusChange(inq._id, e.target.value)}
                        className={`text-xs font-bold rounded-xl px-2.5 py-1.5 border outline-none transition-colors ${
                          inq.status === 'NEW'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : inq.status === 'CONTACTED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <option value="NEW">New</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(inq._id)}
                        disabled={deletingId === inq._id}
                        title="Delete inquiry"
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                      >
                        <IoTrashOutline className="text-base" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold">
            Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total leads)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
