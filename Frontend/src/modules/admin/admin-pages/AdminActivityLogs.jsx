import React, { useState, useEffect, useCallback } from "react";
import {
  IoShieldCheckmarkOutline,
  IoRefreshOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoDocumentTextOutline,
  IoWalletOutline,
  IoBusinessOutline,
  IoCheckmarkCircleOutline,
  IoSettingsOutline,
  IoAlertCircleOutline,
  IoCloseOutline,
  IoDownloadOutline,
  IoTimeOutline,
  IoFingerPrintOutline,
  IoArrowForwardOutline,
  IoHardwareChipOutline,
  IoInformationCircleOutline
} from "react-icons/io5";
import { getAdminActivityLogs, getAuditLogStats } from "../../../services/adminApi";
import { useToast } from "../../../hooks/useToast";

export default function AdminActivityLogs({ embedded = false }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [stats, setStats] = useState({
    totalCount: 0,
    last24hCount: 0,
    moduleCounts: {},
    activeAdmins: []
  });

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("ALL");
  const [selectedAdminId, setSelectedAdminId] = useState("ALL");
  const [selectedDateRange, setSelectedDateRange] = useState("ALL"); // ALL, TODAY, 7DAYS, 30DAYS
  const [selectedLogForDiff, setSelectedLogForDiff] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await getAuditLogStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch audit stats:", err);
    }
  };

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        search: search.trim() || undefined,
        module: selectedModule !== "ALL" ? selectedModule : undefined,
        adminId: selectedAdminId !== "ALL" ? selectedAdminId : undefined
      };

      if (selectedDateRange === "TODAY") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.startDate = today.toISOString();
      } else if (selectedDateRange === "7DAYS") {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        params.startDate = sevenDaysAgo.toISOString();
      } else if (selectedDateRange === "30DAYS") {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        params.startDate = thirtyDaysAgo.toISOString();
      }

      const res = await getAdminActivityLogs(params);
      if (res.success && res.data) {
        setLogs(res.data.logs || []);
        setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      }
    } catch (err) {
      console.error("Failed to fetch admin activity logs:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedModule, selectedAdminId, selectedDateRange]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  // Export logs to CSV
  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.showInfo("No logs available to export");
      return;
    }

    const headers = ["Timestamp", "Admin Name", "Admin Role", "Admin Email", "Module", "Action", "Target", "Target ID", "Notes", "IP Address"];
    const rows = logs.map(l => [
      new Date(l.createdAt).toLocaleString(),
      `"${l.adminName.replace(/"/g, '""')}"`,
      l.adminRole,
      l.adminEmail,
      l.module,
      l.action,
      `"${(l.targetLabel || l.targetEntity).replace(/"/g, '""')}"`,
      l.targetId,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      l.ipAddress
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jaladhar_admin_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.showSuccess("Audit log report downloaded successfully");
  };

  const getModuleBadge = (mod) => {
    switch (mod) {
      case "FINANCE":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700",
          icon: <IoWalletOutline className="text-emerald-600" />,
          label: "Finance & Payouts"
        };
      case "VERIFICATION":
        return {
          bg: "bg-purple-500/10 border-purple-500/20 text-purple-700",
          icon: <IoBusinessOutline className="text-purple-600" />,
          label: "Expert Verification"
        };
      case "OPERATIONS":
        return {
          bg: "bg-blue-500/10 border-blue-500/20 text-blue-700",
          icon: <IoDocumentTextOutline className="text-blue-600" />,
          label: "Operations"
        };
      case "QC":
        return {
          bg: "bg-amber-500/10 border-amber-500/20 text-amber-700",
          icon: <IoCheckmarkCircleOutline className="text-amber-600" />,
          label: "Quality Control"
        };
      case "SECURITY":
        return {
          bg: "bg-rose-500/10 border-rose-500/20 text-rose-700",
          icon: <IoShieldCheckmarkOutline className="text-rose-600" />,
          label: "Security & Access"
        };
      case "SETTINGS":
        return {
          bg: "bg-cyan-500/10 border-cyan-500/20 text-cyan-700",
          icon: <IoSettingsOutline className="text-cyan-600" />,
          label: "Platform Settings"
        };
      default:
        return {
          bg: "bg-slate-500/10 border-slate-500/20 text-slate-700",
          icon: <IoHardwareChipOutline className="text-slate-600" />,
          label: mod || "System"
        };
    }
  };

  const formatActionTitle = (action) => {
    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <IoShieldCheckmarkOutline className="text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Admin Activity & Audit Trail
                </h1>
                <p className="text-xs font-semibold text-slate-500">
                  Real-time accountability feed: Track who changed what, when, and from where
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                fetchStats();
                fetchLogs(pagination.page);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <IoRefreshOutline className={`text-base ${loading ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm shadow-slate-900/20 cursor-pointer active:scale-95"
            >
              <IoDownloadOutline className="text-base" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Audit Logs</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{stats.totalCount || 0}</div>
          </div>
          <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">Past 24 Hours</span>
            <div className="text-xl font-black text-blue-900 mt-0.5">{stats.last24hCount || 0} actions</div>
          </div>
          <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Financial Events</span>
            <div className="text-xl font-black text-emerald-900 mt-0.5">{stats.moduleCounts?.FINANCE || 0}</div>
          </div>
          <div className="bg-purple-50/80 p-3.5 rounded-2xl border border-purple-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600">KYC Approvals</span>
            <div className="text-xl font-black text-purple-900 mt-0.5">{stats.moduleCounts?.VERIFICATION || 0}</div>
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by staff name, action, target entity, or notes..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-medium outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Module Filter */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer hover:bg-slate-100/80 transition-colors"
          >
            <option value="ALL">All Categories</option>
            <option value="FINANCE">💰 Finance & Payouts</option>
            <option value="VERIFICATION">🛡️ Expert Verification</option>
            <option value="OPERATIONS">📋 Operations</option>
            <option value="QC">🔍 Quality Control</option>
            <option value="SECURITY">🔐 Security & Staff</option>
            <option value="SETTINGS">⚙️ Platform Settings</option>
          </select>

          {/* Admin Staff Member Filter */}
          <select
            value={selectedAdminId}
            onChange={(e) => setSelectedAdminId(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer hover:bg-slate-100/80 transition-colors max-w-[180px] truncate"
          >
            <option value="ALL">All Staff Members</option>
            {(stats.activeAdmins || []).map((adm) => (
              <option key={adm._id} value={adm._id}>
                {adm.name} ({adm.role?.replace(/_/g, ' ')})
              </option>
            ))}
          </select>

          {/* Date Range Filter */}
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer hover:bg-slate-100/80 transition-colors"
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="7DAYS">Past 7 Days</option>
            <option value="30DAYS">Past 30 Days</option>
          </select>
        </div>
      </div>

      {/* Audit Log Timeline Feed */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3" />
            <p className="text-xs font-bold text-slate-500">Loading audit trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-2xl">
              <IoDocumentTextOutline />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No activity logs found</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              No audit logs match your search or filter criteria. Actions performed by team members will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const moduleBadge = getModuleBadge(log.module);
              const formattedDate = new Date(log.createdAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
              });

              return (
                <div
                  key={log._id}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Admin Avatar */}
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xs font-black flex-shrink-0 shadow-xs uppercase">
                      {log.adminName ? log.adminName.slice(0, 2) : "AD"}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-slate-900 truncate">
                          {log.adminName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200 uppercase tracking-wider">
                          {log.adminRole?.replace(/_/g, " ")}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${moduleBadge.bg}`}>
                          {moduleBadge.icon}
                          {moduleBadge.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                          {formatActionTitle(log.action)}
                        </span>
                        <span className="text-xs font-medium text-slate-600 truncate">
                          ➔ <strong className="text-slate-800 font-semibold">{log.targetLabel || `${log.targetEntity} #${log.targetId}`}</strong>
                        </span>
                      </div>

                      {log.notes && (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 line-clamp-2">
                          Note: "{log.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata & Actions */}
                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                      <IoTimeOutline className="text-xs text-slate-400" />
                      <span>{formattedDate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                        IP: {log.ipAddress || "Internal"}
                      </span>

                      {(log.previousState || log.newState) && (
                        <button
                          type="button"
                          onClick={() => setSelectedLogForDiff(log)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold border border-blue-200/60 transition-colors cursor-pointer"
                        >
                          View Diff
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong> ({pagination.total} total logs)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchLogs(pagination.page + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side Diff Modal */}
      {selectedLogForDiff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <IoFingerPrintOutline className="text-blue-600 text-lg" />
                  Audit Snapshot & State Diff
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {selectedLogForDiff.targetLabel} • Modified by {selectedLogForDiff.adminName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogForDiff(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <IoCloseOutline className="text-xl" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Previous State */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Previous State
                  </span>
                  <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-3.5 text-xs font-mono text-slate-800 overflow-x-auto">
                    {selectedLogForDiff.previousState ? (
                      <pre className="text-[11px] whitespace-pre-wrap">
                        {JSON.stringify(selectedLogForDiff.previousState, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-slate-400 italic">None (Newly Created Record)</span>
                    )}
                  </div>
                </div>

                {/* New State */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> New Updated State
                  </span>
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3.5 text-xs font-mono text-slate-800 overflow-x-auto">
                    {selectedLogForDiff.newState ? (
                      <pre className="text-[11px] whitespace-pre-wrap">
                        {JSON.stringify(selectedLogForDiff.newState, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-slate-400 italic">None (Deleted / Nullified)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Extra Audit Metadata */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">EXECUTING ADMIN</span>
                  <span className="font-extrabold text-slate-800">{selectedLogForDiff.adminName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">IP ADDRESS</span>
                  <span className="font-mono text-slate-700">{selectedLogForDiff.ipAddress}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">TARGET RECORD ID</span>
                  <span className="font-mono text-slate-700 truncate block">{selectedLogForDiff.targetId}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLogForDiff(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close Diff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
