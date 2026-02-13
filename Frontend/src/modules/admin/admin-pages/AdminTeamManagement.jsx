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
} from "react-icons/io5";
import { getAllAdmins, updateAdmin, deleteAdmin } from "../../../services/adminApi";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import { useToast } from "../../../hooks/useToast";
import ConfirmModal from "../../shared/components/ConfirmModal";
import ErrorMessage from "../../shared/components/ErrorMessage";

export default function AdminTeamManagement() {
  const { admin: currentAdmin } = useAdminAuth();
  const toast = useToast();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAllAdmins();
      if (response.success) {
        setAdmins(response.data.admins);
      } else {
        setError(response.message || "Failed to load admins");
      }
    } catch (err) {
      console.error("Load admins error:", err);
      setError(err.response?.data?.message || "Failed to load admins. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

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

  const handleToggleStatus = async (adminId, currentStatus) => {
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

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'FINANCE_ADMIN': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'OPERATIONS_ADMIN': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'VERIFIER_ADMIN': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'SUPPORT_ADMIN': return 'bg-pink-100 text-pink-700 border-pink-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <IoPeopleOutline className="text-blue-600" />
            Admin Team Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage roles and access permissions for your administrative team.
          </p>
        </div>
        <button
          onClick={loadAdmins}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
        >
          <IoRefreshOutline className={loading ? 'animate-spin' : ''} />
          Refresh List
        </button>
      </div>

      {error && <ErrorMessage message={error} className="mb-6" />}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name & Email</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Current Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48 mb-2"></div><div className="h-3 bg-gray-100 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-20"></div></td>
                  </tr>
                ))
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No admins found in the system.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">{admin.name}</span>
                        <span className="text-xs text-gray-500">{admin.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getRoleBadgeColor(admin.role)}`}>
                          {admin.role.replace('_', ' ')}
                        </span>
                        {admin._id !== currentAdmin.id && (
                          <select
                            disabled={updatingId === admin._id}
                            value={admin.role}
                            onChange={(e) => handleRoleChange(admin._id, e.target.value)}
                            className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            <option value="FINANCE_ADMIN">FINANCE_ADMIN</option>
                            <option value="OPERATIONS_ADMIN">OPERATIONS_ADMIN</option>
                            <option value="VERIFIER_ADMIN">VERIFIER_ADMIN</option>
                            <option value="SUPPORT_ADMIN">SUPPORT_ADMIN</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        disabled={updatingId === admin._id || admin._id === currentAdmin.id}
                        onClick={() => handleToggleStatus(admin._id, admin.isActive)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${admin.isActive
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                          } disabled:opacity-50`}
                      >
                        {admin.isActive ? (
                          <IoCheckmarkCircleOutline className="text-base" />
                        ) : (
                          <IoCloseCircleOutline className="text-base" />
                        )}
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteClick(admin)}
                          disabled={admin._id === currentAdmin.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Delete Admin"
                        >
                          <IoTrashOutline className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <IoShieldCheckmarkOutline className="text-2xl text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800">Security Best Practices</h3>
          <p className="text-sm text-gray-600 mt-1">
            Regularly review admin permissions and roles. Ensure that only trusted personnel have "Super Admin" access as they can manage other admins.
          </p>
        </div>
        <div className="flex-shrink-0">
          <a
            href="/admin/settings?tab=register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm shadow-blue-200"
          >
            <IoPersonAddOutline className="text-lg" />
            Add New Admin Team Member
          </a>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Admin Account"
        message={`Are you sure you want to delete ${adminToDelete?.name}'s account? This action cannot be undone.`}
        confirmText="Delete Account"
        confirmColor="danger"
      />
    </div>
  );
}
