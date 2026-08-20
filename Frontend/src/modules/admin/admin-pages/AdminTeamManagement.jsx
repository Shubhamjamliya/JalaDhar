import { useState, useEffect } from "react";
import {
  IoPeopleOutline,
  IoShieldCheckmarkOutline,
  IoTrashOutline,
  IoCreateOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoRefreshOutline,
  IoPersonAddOutline,
  IoTimeOutline,
  IoToggleOutline,
  IoFlashOutline,
  IoStatsChartOutline,
  IoRadioButtonOnOutline,
  IoBriefcaseOutline,
  IoCheckmarkOutline,
  IoCloseOutline
} from "react-icons/io5";
import {
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  getAssignmentTogglesApi,
  updateAssignmentToggleApi,
  getTeamPerformanceApi
} from "../../../services/adminApi";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import { useToast } from "../../../hooks/useToast";
import ConfirmModal from "../../shared/components/ConfirmModal";
import ErrorMessage from "../../shared/components/ErrorMessage";

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "EXPERT_VERIFICATION_ADMIN", label: "Expert Verification Admin", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "OPERATIONS_ADMIN", label: "Operations Admin", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "FINANCE_ADMIN", label: "Finance Admin", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "SUPPORT_ADMIN", label: "Customer Support Admin", color: "bg-rose-100 text-rose-700 border-rose-200" },
  { value: "QC_ADMIN", label: "Quality Control Admin", color: "bg-cyan-100 text-cyan-700 border-cyan-200" }
];

export default function AdminTeamManagement() {
  const { admin: currentAdmin } = useAdminAuth();
  const toast = useToast();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Department Master Toggles State
  const [toggles, setToggles] = useState({
    AUTO_ASSIGN_VERIFICATION: true,
    AUTO_ASSIGN_OPERATIONS: true,
    AUTO_ASSIGN_FINANCE: true,
    AUTO_ASSIGN_SUPPORT: true,
    AUTO_ASSIGN_QC: true
  });
  const [togglesLoading, setTogglesLoading] = useState(false);

  // Team Performance Analytics Modal State
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [performanceStats, setPerformanceStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [adminsRes, togglesRes] = await Promise.all([
        getAllAdmins(),
        getAssignmentTogglesApi().catch(() => ({ success: false }))
      ]);

      if (adminsRes.success) {
        setAdmins(adminsRes.data.admins);
      } else {
        setError(adminsRes.message || "Failed to load admins");
      }

      if (togglesRes.success && togglesRes.data?.toggles) {
        setToggles(togglesRes.data.toggles);
      }
    } catch (err) {
      console.error("Load admins error:", err);
      setError(err.response?.data?.message || "Failed to load admins. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleDepartment = async (key, currentValue) => {
    try {
      setTogglesLoading(true);
      const newValue = !currentValue;
      setToggles(prev => ({ ...prev, [key]: newValue }));
      
      const res = await updateAssignmentToggleApi(key, newValue);
      if (res.success) {
        toast.showSuccess(`Auto-assignment ${newValue ? 'enabled' : 'disabled'} for ${key.replace('AUTO_ASSIGN_', '')}`);
      } else {
        setToggles(prev => ({ ...prev, [key]: currentValue }));
        toast.showError(res.message || "Failed to update toggle");
      }
    } catch (err) {
      setToggles(prev => ({ ...prev, [key]: currentValue }));
      toast.showError("Failed to update auto-assignment toggle");
    } finally {
      setTogglesLoading(false);
    }
  };

  const handleRoleChange = async (adminId, newRole) => {
    try {
      setUpdatingId(adminId);
      const response = await updateAdmin(adminId, { role: newRole });
      if (response.success) {
        toast.showSuccess(`Role updated to ${newRole}`);
        setAdmins(admins.map(a => a._id === adminId ? response.data.admin : a));
      } else {
        toast.showError(response.message || "Failed to update role");
      }
    } catch (err) {
      toast.showError(err.response?.data?.message || "Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleActiveStatus = async (adminId, currentStatus) => {
    try {
      setUpdatingId(adminId);
      const response = await updateAdmin(adminId, { isActive: !currentStatus });
      if (response.success) {
        toast.showSuccess(`Admin ${!currentStatus ? 'activated' : 'deactivated'}`);
        setAdmins(admins.map(a => a._id === adminId ? response.data.admin : a));
      } else {
        toast.showError(response.message || "Failed to update status");
      }
    } catch (err) {
      toast.showError(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleDutyStatus = async (adminId, currentDuty) => {
    try {
      setUpdatingId(adminId);
      const response = await updateAdmin(adminId, { isAvailableForAssignment: !currentDuty });
      if (response.success) {
        toast.showSuccess(`Assignment status updated to ${!currentDuty ? 'On-Duty' : 'Away'}`);
        setAdmins(admins.map(a => a._id === adminId ? response.data.admin : a));
      } else {
        toast.showError(response.message || "Failed to update duty status");
      }
    } catch (err) {
      toast.showError(err.response?.data?.message || "Failed to update duty status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenStats = async () => {
    setShowStatsModal(true);
    try {
      setStatsLoading(true);
      const res = await getTeamPerformanceApi();
      if (res.success && res.data?.performance) {
        setPerformanceStats(res.data.performance);
      }
    } catch (err) {
      toast.showError("Failed to fetch performance stats");
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDeleteClick = (admin) => {
    if (admin._id === currentAdmin.id) {
      toast.showError("You cannot delete your own account");
      return;
    }
    setAdminToDelete(admin);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await deleteAdmin(adminToDelete._id);
      if (response.success) {
        toast.showSuccess("Admin deleted successfully");
        setAdmins(admins.filter(a => a._id !== adminToDelete._id));
      } else {
        toast.showError(response.message || "Failed to delete admin");
      }
    } catch (err) {
      toast.showError(err.response?.data?.message || "Failed to delete admin");
    } finally {
      setShowDeleteModal(false);
      setAdminToDelete(null);
    }
  };

  const getRoleBadge = (role) => {
    const matched = ROLE_OPTIONS.find(r => r.value === role || (role === 'VERIFIER_ADMIN' && r.value === 'EXPERT_VERIFICATION_ADMIN'));
    return matched ? matched.color : 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <IoPeopleOutline className="text-blue-600" />
            Admin Team & Workload Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage role-based admins, toggle automated workload distribution, and evaluate team statistics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenStats}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition-colors text-sm font-semibold cursor-pointer"
          >
            <IoStatsChartOutline />
            Team Evaluation
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-sm font-medium cursor-pointer"
          >
            <IoRefreshOutline className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} className="mb-6" />}

      {/* ── DEPARTMENT MASTER AUTO-ASSIGN TOGGLE CARD ── */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-base border border-blue-100">
              <IoFlashOutline />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Department Auto-Assignment Toggles</h2>
              <p className="text-xs text-gray-400">When enabled, new incoming requests are automatically distributed equally using Least-Active-Load.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {[
            { key: 'AUTO_ASSIGN_VERIFICATION', label: 'KYC & Verification', role: 'Expert Verifiers' },
            { key: 'AUTO_ASSIGN_OPERATIONS',   label: 'Operations',          role: 'Bookings & Shifts' },
            { key: 'AUTO_ASSIGN_FINANCE',      label: 'Finance & Payouts',   role: 'Withdrawals & Invoices' },
            { key: 'AUTO_ASSIGN_SUPPORT',      label: 'Customer Support',    role: 'Disputes & Tickets' },
            { key: 'AUTO_ASSIGN_QC',           label: 'Quality Control',     role: 'Reports & Borewell QA' },
          ].map((dept) => {
            const isEnabled = toggles[dept.key] !== false;
            return (
              <div
                key={dept.key}
                className={`p-3 rounded-xl border transition-all ${isEnabled ? 'bg-blue-50/40 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-900 truncate">{dept.label}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleDepartment(dept.key, isEnabled)}
                    disabled={togglesLoading}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-400 truncate">{dept.role}</span>
                  <span className={`font-bold ${isEnabled ? 'text-blue-600' : 'text-gray-400'}`}>
                    {isEnabled ? 'AUTO' : 'POOL'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ADMIN TEAM MEMBERS TABLE ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <IoBriefcaseOutline className="text-gray-500 text-base" />
            <h3 className="text-sm font-bold text-gray-900">Active Team Members ({admins.length})</h3>
          </div>
          <span className="text-xs text-gray-400">Total capacity: {admins.filter(a => a.isActive && a.isAvailableForAssignment !== false).length} on-duty</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3">Admin</th>
                <th className="px-5 py-3">Assigned Role</th>
                <th className="px-5 py-3">Account Status</th>
                <th className="px-5 py-3">Duty / Auto-Assign</th>
                <th className="px-5 py-3">Active Load</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {admins.map((admin) => {
                const isSelf = admin._id === currentAdmin.id;
                const isUpdating = updatingId === admin._id;
                const isDuty = admin.isAvailableForAssignment !== false;

                return (
                  <tr key={admin._id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Name & Email */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900">{admin.name} {isSelf && <span className="text-[10px] text-blue-600 font-bold">(You)</span>}</div>
                      <div className="text-[11px] text-gray-400">{admin.email}</div>
                    </td>

                    {/* Role Dropdown */}
                    <td className="px-5 py-3.5">
                      <select
                        value={admin.role}
                        onChange={(e) => handleRoleChange(admin._id, e.target.value)}
                        disabled={isUpdating}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer ${getRoleBadge(admin.role)}`}
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Account Status */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleActiveStatus(admin._id, admin.isActive)}
                        disabled={isUpdating || (isSelf && admin.role === 'SUPER_ADMIN')}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                          admin.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${admin.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Duty Status (Individual Toggle) */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleDutyStatus(admin._id, isDuty)}
                        disabled={isUpdating || !admin.isActive}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          isDuty && admin.isActive
                            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isDuty && admin.isActive ? 'bg-blue-500 animate-pulse' : 'bg-amber-400'}`} />
                        {isDuty && admin.isActive ? 'On-Duty (Receiving)' : 'Away (Paused)'}
                      </button>
                    </td>

                    {/* Active Workload Counter */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                          (admin.activeTicketsCount || 0) > 5
                            ? 'bg-rose-100 text-rose-700'
                            : (admin.activeTicketsCount || 0) > 0
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {admin.activeTicketsCount || 0} open
                        </span>
                      </div>
                    </td>

                    {/* Delete Action */}
                    <td className="px-5 py-3.5 text-right">
                      {!isSelf && (
                        <button
                          onClick={() => handleDeleteClick(admin)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Admin"
                        >
                          <IoTrashOutline className="text-base" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TEAM PERFORMANCE & EVALUATION MODAL ── */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg border border-indigo-100">
                  <IoStatsChartOutline />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Admin Performance & Evaluation</h3>
                  <p className="text-xs text-gray-400">Statistical breakdown of workload, resolution rate, and activity per team member.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <IoCloseOutline className="text-xl" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {statsLoading ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  <IoRefreshOutline className="animate-spin text-2xl mx-auto mb-2 text-indigo-600" />
                  Calculating performance statistics...
                </div>
              ) : performanceStats.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">No performance records found</div>
              ) : (
                <div className="space-y-3">
                  {performanceStats.map((st) => (
                    <div key={st.adminId} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-gray-900 block">{st.name}</span>
                          <span className="text-[11px] text-gray-400">{st.role.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                          {st.resolutionRate} Resolution Rate
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                        <div className="p-2 bg-white rounded-xl border border-gray-100">
                          <span className="text-[10px] text-gray-400 block">Total Assigned</span>
                          <span className="text-xs font-bold text-gray-800">{st.totalAssigned}</span>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-gray-100">
                          <span className="text-[10px] text-gray-400 block">Resolved / Closed</span>
                          <span className="text-xs font-bold text-emerald-600">{st.resolvedCount}</span>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-gray-100">
                          <span className="text-[10px] text-gray-400 block">Current Active</span>
                          <span className="text-xs font-bold text-blue-600">{st.activeTicketsCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="px-5 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Team Member"
        message={`Are you sure you want to delete ${adminToDelete?.name}? This action cannot be undone.`}
      />
    </div>
  );
}
