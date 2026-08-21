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
  IoCloseOutline,
  IoMailOutline,
  IoKeyOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoArrowBackOutline,
  IoLockClosedOutline,
  IoCallOutline,
  IoChevronDown
} from "react-icons/io5";
import {
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  getAssignmentTogglesApi,
  updateAssignmentToggleApi,
  getTeamPerformanceApi,
  sendAdminRegistrationOTP,
  registerAdminWithOTP
} from "../../../services/adminApi";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import { useToast } from "../../../hooks/useToast";
import { ADMIN_MODULES, ROLE_DEFAULT_PERMISSIONS, hasAdminPermission } from "../../../utils/permissionUtils";
import ConfirmModal from "../../shared/components/ConfirmModal";
import ErrorMessage from "../../shared/components/ErrorMessage";

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "EXPERT_VERIFICATION_ADMIN", label: "Expert Verification Admin", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "OPERATIONS_ADMIN", label: "Operations Admin", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "FINANCE_ADMIN", label: "Finance Admin", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "SUPPORT_ADMIN", label: "Customer Support Admin", color: "bg-rose-100 text-rose-700 border-rose-200" },
  { value: "QC_ADMIN", label: "Quality Control Admin", color: "bg-teal-100 text-teal-700 border-teal-200" },
];

const ROLE_DEFINITIONS = [
  { 
    value: "EXPERT_VERIFICATION_ADMIN", 
    label: "Expert Verification Admin", 
    description: "Reviews expert KYC documents, certificates, and onboardings.",
    department: "Verification"
  },
  { 
    value: "OPERATIONS_ADMIN", 
    label: "Operations Admin", 
    description: "Oversees booking dispatches, live GPS tracking, and surveyor scheduling.",
    department: "Operations"
  },
  { 
    value: "FINANCE_ADMIN", 
    label: "Finance Admin", 
    description: "Processes expert withdrawals, user refunds, and invoice payouts.",
    department: "Finance"
  },
  { 
    value: "SUPPORT_ADMIN", 
    label: "Customer Support Admin", 
    description: "Resolves customer & vendor disputes, tickets, and reviews ratings.",
    department: "Support"
  },
  { 
    value: "QC_ADMIN", 
    label: "Quality Control Admin", 
    description: "Audits groundwater survey reports, depth readings, and borewell QA.",
    department: "Quality Control"
  },
  { 
    value: "SUPER_ADMIN", 
    label: "Super Admin", 
    description: "Full master governance, policies, pricing, and team IAM control.",
    department: "Governance"
  },
];

export default function AdminTeamManagement() {
  const { admin: currentAdmin } = useAdminAuth();
  const toast = useToast();
  const [admins, setAdmins] = useState([]);
  const [toggles, setToggles] = useState({
    AUTO_ASSIGN_VERIFICATION: true,
    AUTO_ASSIGN_OPERATIONS: true,
    AUTO_ASSIGN_FINANCE: true,
    AUTO_ASSIGN_SUPPORT: true,
    AUTO_ASSIGN_QC: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [togglesLoading, setTogglesLoading] = useState(false);

  // Direct Table Permissions Dropdown State
  const [openPermissionDropdownId, setOpenPermissionDropdownId] = useState(null);

  // Performance Modal
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsData, setStatsData] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);

  // Registration Modal State (2-Step)
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerStep, setRegisterStep] = useState(1); // 1: Details, 2: OTP
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "OPERATIONS_ADMIN",
    permissions: ["operations", "reports"],
  });

  const [otpData, setOtpData] = useState({
    otp: "",
    token: "",
    email: "",
  });

  // Edit Admin Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAdminData, setEditAdminData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    role: "OPERATIONS_ADMIN",
    permissions: [],
    password: "",
  });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenPermissionDropdownId(null);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleUpdatePermissionsDirect = async (adminId, updatedPermissions) => {
    try {
      setUpdatingId(adminId);
      // Optimistically update
      setAdmins((prev) =>
        prev.map((a) => (a._id === adminId ? { ...a, permissions: updatedPermissions } : a))
      );

      const res = await updateAdmin(adminId, { permissions: updatedPermissions });
      if (res.success) {
        toast.showSuccess("Module clearances updated!");
      } else {
        toast.showError(res.message || "Failed to update clearances");
        await loadData();
      }
    } catch (err) {
      console.error("Direct permission update error:", err);
      toast.showError("Failed to update module clearances");
      await loadData();
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

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

  const handleOpenRegisterModal = () => {
    setRegisterStep(1);
    setRegisterError("");
    setRegisterForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "OPERATIONS_ADMIN",
      permissions: ROLE_DEFAULT_PERMISSIONS["OPERATIONS_ADMIN"] || ["operations", "reports"],
    });
    setOtpData({
      otp: "",
      token: "",
      email: "",
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setOtpCountdown(0);
    setShowRegisterModal(true);
  };

  const handleCloseRegisterModal = () => {
    if (registerLoading) return;
    setShowRegisterModal(false);
    setRegisterError("");
  };

  const handleRegisterRoleChange = (newRole) => {
    const defaultPerms = ROLE_DEFAULT_PERMISSIONS[newRole] || ["operations"];
    setRegisterForm((prev) => ({
      ...prev,
      role: newRole,
      permissions: defaultPerms,
    }));
  };

  const toggleRegisterPermission = (permKey) => {
    setRegisterForm((prev) => {
      const current = prev.permissions || [];
      const updated = current.includes(permKey)
        ? current.filter((k) => k !== permKey)
        : [...current, permKey];
      return { ...prev, permissions: updated };
    });
  };

  const handleOpenEditModal = (admin) => {
    setEditError("");
    setShowEditPassword(false);
    const existingPerms = Array.isArray(admin.permissions) && admin.permissions.length > 0
      ? admin.permissions
      : (ROLE_DEFAULT_PERMISSIONS[admin.role] || ["operations"]);

    setEditAdminData({
      id: admin._id,
      name: admin.name || "",
      email: admin.email || "",
      phone: admin.phone || "",
      role: admin.role || "OPERATIONS_ADMIN",
      permissions: existingPerms,
      password: "",
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    if (editLoading) return;
    setShowEditModal(false);
    setEditError("");
  };

  const handleEditRoleChange = (newRole) => {
    const defaultPerms = ROLE_DEFAULT_PERMISSIONS[newRole] || ["operations"];
    setEditAdminData((prev) => ({
      ...prev,
      role: newRole,
      permissions: defaultPerms,
    }));
  };

  const toggleEditPermission = (permKey) => {
    setEditAdminData((prev) => {
      const current = prev.permissions || [];
      const updated = current.includes(permKey)
        ? current.filter((k) => k !== permKey)
        : [...current, permKey];
      return { ...prev, permissions: updated };
    });
  };

  const handleSaveEditAdmin = async (e) => {
    e.preventDefault();
    setEditError("");

    if (!editAdminData.name.trim()) {
      setEditError("Admin name cannot be empty");
      return;
    }

    if (editAdminData.password && editAdminData.password.length < 6) {
      setEditError("New password must be at least 6 characters");
      return;
    }

    try {
      setEditLoading(true);
      const payload = {
        name: editAdminData.name.trim(),
        phone: editAdminData.phone.trim() || undefined,
        role: editAdminData.role,
      };

      if (editAdminData.password.trim()) {
        payload.password = editAdminData.password.trim();
      }

      const res = await updateAdmin(editAdminData.id, payload);
      if (res.success) {
        toast.showSuccess(`Admin "${editAdminData.name}" profile updated!`);
        setShowEditModal(false);
        await loadData();
      } else {
        setEditError(res.message || "Failed to update admin profile");
      }
    } catch (err) {
      console.error("Update admin error:", err);
      setEditError(err.response?.data?.message || "Failed to update admin");
    } finally {
      setEditLoading(false);
    }
  };

  const handleSendRegistrationOTP = async (e) => {
    e.preventDefault();
    setRegisterError("");

    if (!registerForm.name.trim()) {
      setRegisterError("Admin name is required");
      return;
    }

    if (!registerForm.email.trim()) {
      setRegisterError("Admin email is required");
      return;
    }

    if (registerForm.password.length < 6) {
      setRegisterError("Password must be at least 6 characters");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError("Passwords do not match");
      return;
    }

    try {
      setRegisterLoading(true);
      const res = await sendAdminRegistrationOTP({
        name: registerForm.name.trim(),
        email: registerForm.email.trim().toLowerCase(),
      });

      if (res.success) {
        setOtpData({
          token: res.data.token,
          email: res.data.email,
          otp: "",
        });
        setRegisterStep(2);
        setOtpCountdown(60);
        toast.showSuccess(`Verification code sent to ${registerForm.email}`);
      } else {
        setRegisterError(res.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      setRegisterError(err.response?.data?.message || "Failed to send verification code. Please try again.");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpCountdown > 0 || registerLoading) return;
    setRegisterError("");

    try {
      setRegisterLoading(true);
      const res = await sendAdminRegistrationOTP({
        name: registerForm.name.trim(),
        email: registerForm.email.trim().toLowerCase(),
      });

      if (res.success) {
        setOtpData((prev) => ({
          ...prev,
          token: res.data.token,
          otp: "",
        }));
        setOtpCountdown(60);
        toast.showSuccess("New verification code sent!");
      } else {
        setRegisterError(res.message || "Failed to resend OTP");
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      setRegisterError(err.response?.data?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");

    if (!otpData.otp || otpData.otp.length !== 6) {
      setRegisterError("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setRegisterLoading(true);
      const res = await registerAdminWithOTP({
        name: registerForm.name.trim(),
        email: registerForm.email.trim().toLowerCase(),
        phone: registerForm.phone.trim() || undefined,
        password: registerForm.password,
        role: registerForm.role,
        permissions: registerForm.permissions,
        otp: otpData.otp,
        token: otpData.token,
      });

      if (res.success) {
        toast.showSuccess(`Admin "${registerForm.name}" registered successfully!`);
        setShowRegisterModal(false);
        await loadData();
      } else {
        setRegisterError(res.message || "Failed to register admin");
      }
    } catch (err) {
      console.error("Register admin error:", err);
      setRegisterError(err.response?.data?.message || "Registration failed. Please check OTP and try again.");
    } finally {
      setRegisterLoading(false);
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
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenStats}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition-colors text-sm font-semibold cursor-pointer"
          >
            <IoStatsChartOutline />
            Team Evaluation
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-sm font-medium cursor-pointer"
          >
            <IoRefreshOutline className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleOpenRegisterModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all shadow-sm shadow-blue-500/20 text-sm font-semibold cursor-pointer active:scale-95"
          >
            <IoPersonAddOutline className="text-base" />
            Register Admin
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
          <span className="text-xs text-gray-400">Operational staff on-duty: {admins.filter(a => a.role !== 'SUPER_ADMIN' && a.isActive && a.isAvailableForAssignment !== false).length}</span>
        </div>

        <div className="overflow-x-auto min-h-[380px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3">Admin</th>
                <th className="px-5 py-3">Assigned Role</th>
                <th className="px-5 py-3">Module Clearances (RBAC)</th>
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
                const currentPerms = Array.isArray(admin.permissions) && admin.permissions.length > 0
                  ? admin.permissions
                  : (ROLE_DEFAULT_PERMISSIONS[admin.role] || ["operations"]);
                const isDropdownOpen = openPermissionDropdownId === admin._id;

                return (
                  <tr key={admin._id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Name, Email & Phone */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        {admin.name} {isSelf && <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded">(You)</span>}
                      </div>
                      <div className="text-[11px] text-gray-400">{admin.email}</div>
                      {admin.phone ? (
                        <div className="text-[11px] text-gray-600 font-medium flex items-center gap-1 mt-0.5">
                          <IoCallOutline className="text-[10px] text-blue-500" />
                          <span>{admin.phone}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-300 italic mt-0.5">No mobile number</div>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5">
                      {admin.role === 'SUPER_ADMIN' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 select-none shadow-xs">
                          <IoShieldCheckmarkOutline className="text-sm text-purple-600" />
                          Super Admin
                        </span>
                      ) : (
                        <select
                          value={admin.role}
                          onChange={(e) => handleRoleChange(admin._id, e.target.value)}
                          disabled={isUpdating}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer ${getRoleBadge(admin.role)}`}
                        >
                          {ROLE_OPTIONS.filter(opt => opt.value !== 'SUPER_ADMIN').map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Module Access Clearance (Interactive RBAC Dropdown Card) */}
                    <td className="px-5 py-3.5">
                      {admin.role === 'SUPER_ADMIN' ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 select-none shadow-xs">
                          <IoShieldCheckmarkOutline className="text-sm text-purple-600" />
                          <span>Full Root Access (All Modules)</span>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          {/* Unified Full-Card Dropdown Trigger */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenPermissionDropdownId(isDropdownOpen ? null : admin._id);
                            }}
                            className={`group flex flex-col items-start gap-1.5 p-2.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${
                              isDropdownOpen
                                ? "bg-blue-600 text-white border-blue-600 ring-4 ring-blue-500/20 shadow-md shadow-blue-500/20"
                                : "bg-blue-50/70 hover:bg-blue-100/80 border-blue-200 hover:border-blue-300 text-blue-900 shadow-xs"
                            }`}
                          >
                            {/* Card Top Row: Icon + Count + Chevron */}
                            <div className="flex items-center justify-between gap-3 w-full">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <IoShieldCheckmarkOutline className={`text-sm flex-shrink-0 ${isDropdownOpen ? "text-white" : "text-blue-600"}`} />
                                <span className="text-xs font-black tracking-tight whitespace-nowrap">
                                  {currentPerms.length} Module{currentPerms.length !== 1 ? "s" : ""} Granted
                                </span>
                              </div>
                              <IoChevronDown
                                className={`text-xs flex-shrink-0 transition-transform duration-200 ${
                                  isDropdownOpen ? "rotate-180 text-white" : "text-blue-500 group-hover:text-blue-700"
                                }`}
                              />
                            </div>

                            {/* Card Bottom Row: Module Pills */}
                            <div className="flex flex-wrap gap-1 max-w-[240px]">
                              {currentPerms.map((permKey) => {
                                const mod = ADMIN_MODULES.find((m) => m.key === permKey);
                                return (
                                  <span
                                    key={permKey}
                                    className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                                      isDropdownOpen
                                        ? "bg-white/20 text-white border-white/30"
                                        : mod?.color || "text-blue-700 bg-blue-100/70 border-blue-200"
                                    }`}
                                  >
                                    {permKey}
                                  </span>
                                );
                              })}
                            </div>
                          </button>

                          {/* Floating Dropdown Matrix Popover */}
                          {isDropdownOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute left-0 top-full mt-2 w-[460px] max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 space-y-3 z-[999] animate-in fade-in zoom-in-95 duration-150"
                            >
                              {/* Header */}
                              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                <div>
                                  <div className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                    MODULE ACCESS CLEARANCE (RBAC MATRIX)
                                  </div>
                                  <p className="text-[11px] text-gray-500 mt-0.5">
                                    Customize which dashboard modules this admin is authorized to view and manage.
                                  </p>
                                </div>
                                <span className="text-[10px] text-blue-700 font-black bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  {currentPerms.length} module{currentPerms.length !== 1 ? "s" : ""} granted
                                </span>
                              </div>

                              {/* Quick Actions */}
                              <div className="flex items-center justify-between text-[10px] font-bold px-1 text-gray-500">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdatePermissionsDirect(
                                      admin._id,
                                      ADMIN_MODULES.map((m) => m.key)
                                    )
                                  }
                                  className="text-blue-600 hover:underline cursor-pointer"
                                >
                                  ✓ Grant All Access
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdatePermissionsDirect(
                                      admin._id,
                                      ROLE_DEFAULT_PERMISSIONS[admin.role] || ["operations"]
                                    )
                                  }
                                  className="text-amber-600 hover:underline cursor-pointer"
                                >
                                  ↺ Reset to Role Defaults
                                </button>
                              </div>

                              {/* Checkbox Grid (2 Columns) - Full Card Clickable */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                {ADMIN_MODULES.map((mod) => {
                                  const isChecked =
                                    currentPerms.includes(mod.key) || currentPerms.includes("all");
                                  return (
                                    <button
                                      key={mod.key}
                                      type="button"
                                      onClick={() => {
                                        const updated = isChecked
                                          ? currentPerms.filter((k) => k !== mod.key)
                                          : [...currentPerms, mod.key];
                                        handleUpdatePermissionsDirect(admin._id, updated);
                                      }}
                                      className={`group relative flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer select-none outline-none active:scale-[0.98] ${
                                        isChecked
                                          ? "bg-blue-50/90 border-blue-400 text-blue-950 shadow-sm ring-2 ring-blue-500/20"
                                          : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-slate-50/80 hover:shadow-xs"
                                      }`}
                                    >
                                      {/* Custom Stylized Checkbox */}
                                      <div
                                        className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-150 ${
                                          isChecked
                                            ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30 scale-105"
                                            : "border-2 border-gray-300 bg-gray-50 group-hover:border-blue-400 group-hover:bg-white"
                                        }`}
                                      >
                                        {isChecked && <IoCheckmarkOutline className="text-xs stroke-[3]" />}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                          <span
                                            className={`text-xs font-bold leading-tight ${
                                              isChecked
                                                ? "text-blue-950"
                                                : "text-gray-900 group-hover:text-blue-900"
                                            }`}
                                          >
                                            {mod.label}
                                          </span>
                                        </div>
                                        <div
                                          className={`text-[10px] line-clamp-1 mt-0.5 ${
                                            isChecked ? "text-blue-800/80" : "text-gray-500"
                                          }`}
                                        >
                                          {mod.description}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Footer */}
                              <div className="pt-2 border-t border-gray-100 flex items-center justify-end">
                                <button
                                  type="button"
                                  onClick={() => setOpenPermissionDropdownId(null)}
                                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Account Status (Operational Staff Only) */}
                    <td className="px-5 py-3.5">
                      {admin.role === 'SUPER_ADMIN' ? (
                        <span className="text-gray-400 font-semibold text-xs">—</span>
                      ) : (
                        <button
                          onClick={() => handleToggleActiveStatus(admin._id, admin.isActive)}
                          disabled={isUpdating}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                            admin.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${admin.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </button>
                      )}
                    </td>

                    {/* Duty Status (Operational Staff Only) */}
                    <td className="px-5 py-3.5">
                      {admin.role === 'SUPER_ADMIN' ? (
                        <span className="text-gray-400 font-semibold text-xs">—</span>
                      ) : (
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
                      )}
                    </td>

                    {/* Active Workload Counter */}
                    <td className="px-5 py-3.5">
                      {admin.role === 'SUPER_ADMIN' ? (
                        <span className="text-gray-400 font-semibold text-xs">—</span>
                      ) : (
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
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(admin)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Profile & Password"
                        >
                          <IoCreateOutline className="text-base" />
                        </button>
                        {!isSelf && admin.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => handleDeleteClick(admin)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Admin"
                          >
                            <IoTrashOutline className="text-base" />
                          </button>
                        )}
                      </div>
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

      {/* ── REGISTER ADMIN MODAL (2-STEP WITH OTP) ── */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg border border-blue-100">
                  <IoPersonAddOutline />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Register Internal Admin</h3>
                  <p className="text-xs text-gray-400">
                    {registerStep === 1 
                      ? "Create account and assign department permissions." 
                      : "Verify email to activate new admin account."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseRegisterModal}
                disabled={registerLoading}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                <IoCloseOutline className="text-xl" />
              </button>
            </div>

            {/* Error Message */}
            {registerError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between">
                <span>{registerError}</span>
                <button type="button" onClick={() => setRegisterError("")} className="text-rose-500 hover:text-rose-700 text-sm font-bold">×</button>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto pr-1">
              {registerStep === 1 ? (
                /* Step 1: Details Form */
                <form onSubmit={handleSendRegistrationOTP} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <div className="relative">
                      <IoPeopleOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                      <input
                        type="text"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-colors font-medium text-gray-800"
                        placeholder="e.g. Rahul Sharma"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <div className="relative">
                      <IoMailOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                      <input
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-colors font-medium text-gray-800"
                        placeholder="rahul@jaladhar.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                      Mobile Number <span className="text-gray-400 font-normal lowercase">(optional)</span>
                    </label>
                    <div className="relative">
                      <IoCallOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                      <input
                        type="tel"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-colors font-medium text-gray-800"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                        Password *
                      </label>
                      <div className="relative">
                        <IoKeyOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          required
                          minLength={6}
                          className="w-full pl-10 pr-9 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-colors font-medium text-gray-800"
                          placeholder="Min 6 chars"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base cursor-pointer"
                        >
                          {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <IoKeyOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={registerForm.confirmPassword}
                          onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                          required
                          className="w-full pl-10 pr-9 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-colors font-medium text-gray-800"
                          placeholder="Re-enter password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base cursor-pointer"
                        >
                          {showConfirmPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                      Designated Role & Access Level *
                    </label>
                    <select
                      value={registerForm.role}
                      onChange={(e) => handleRegisterRoleChange(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-colors font-medium text-gray-800 cursor-pointer"
                    >
                      {ROLE_DEFINITIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label} — {r.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Module Access Clearance Checkboxes */}
                  <div className="space-y-2 pt-1 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Module Access Clearance (RBAC Matrix)
                      </label>
                      <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                        {registerForm.permissions.length} module{registerForm.permissions.length !== 1 ? 's' : ''} granted
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Select which modules this staff admin can view and access in the dashboard.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {ADMIN_MODULES.map((mod) => {
                        const isChecked =
                          registerForm.permissions.includes(mod.key) ||
                          registerForm.permissions.includes("all");
                        return (
                          <button
                            key={mod.key}
                            type="button"
                            onClick={() => toggleRegisterPermission(mod.key)}
                            className={`group relative flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer select-none outline-none active:scale-[0.98] ${
                              isChecked
                                ? "bg-blue-50/90 border-blue-400 text-blue-950 shadow-sm ring-2 ring-blue-500/20"
                                : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-slate-50/80 hover:shadow-xs"
                            }`}
                          >
                            {/* Custom Stylized Checkbox */}
                            <div
                              className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-150 ${
                                isChecked
                                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30 scale-105"
                                  : "border-2 border-gray-300 bg-gray-50 group-hover:border-blue-400 group-hover:bg-white"
                              }`}
                            >
                              {isChecked && <IoCheckmarkOutline className="text-xs stroke-[3]" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`text-xs font-bold leading-tight ${
                                    isChecked
                                      ? "text-blue-950"
                                      : "text-gray-900 group-hover:text-blue-900"
                                  }`}
                                >
                                  {mod.label}
                                </span>
                              </div>
                              <div
                                className={`text-[10px] line-clamp-1 mt-0.5 ${
                                  isChecked ? "text-blue-800/80" : "text-gray-500"
                                }`}
                              >
                                {mod.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={handleCloseRegisterModal}
                      className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={registerLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {registerLoading ? (
                        <>
                          <IoRefreshOutline className="animate-spin text-sm" />
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          <span>Send Verification OTP</span>
                          <IoShieldCheckmarkOutline className="text-sm" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: OTP Verification */
                <form onSubmit={handleVerifyAndRegister} className="space-y-4">
                  <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center gap-2 text-blue-800 text-xs font-bold">
                      <IoShieldCheckmarkOutline className="text-base text-blue-600" />
                      Verification Code Sent
                    </div>
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      We have sent a 6-digit OTP to <strong className="font-bold text-blue-900">{registerForm.email}</strong>. Please enter it below to complete registration.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 text-center">
                      Enter 6-Digit Code
                    </label>
                    <input
                      type="text"
                      value={otpData.otp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setOtpData({ ...otpData, otp: val });
                      }}
                      required
                      maxLength={6}
                      autoFocus
                      className="w-full py-3 px-4 text-center font-mono text-2xl tracking-[0.4em] font-black bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-colors text-gray-900"
                      placeholder="000000"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setRegisterStep(1);
                        setOtpData({ ...otpData, otp: "" });
                      }}
                      className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-semibold cursor-pointer"
                    >
                      <IoArrowBackOutline />
                      Edit Details
                    </button>

                    {otpCountdown > 0 ? (
                      <span className="text-gray-400 font-medium flex items-center gap-1">
                        <IoTimeOutline />
                        Resend in {otpCountdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={registerLoading}
                        className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer disabled:opacity-50"
                      >
                        Resend OTP Code
                      </button>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={handleCloseRegisterModal}
                      className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={registerLoading || otpData.otp.length !== 6}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {registerLoading ? (
                        <>
                          <IoRefreshOutline className="animate-spin text-sm" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <IoCheckmarkCircleOutline className="text-sm" />
                          Verify & Register Admin
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT ADMIN PROFILE & SECURITY MODAL ── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg border border-blue-100">
                  <IoCreateOutline />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Edit Admin Profile & Security</h3>
                  <p className="text-xs text-gray-400">
                    Update profile, mobile number, role, or reset password.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseEditModal}
                disabled={editLoading}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                <IoCloseOutline className="text-xl" />
              </button>
            </div>

            {/* Error Message */}
            {editError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between">
                <span>{editError}</span>
                <button type="button" onClick={() => setEditError("")} className="text-rose-500 hover:text-rose-700 text-sm font-bold">×</button>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto pr-1">
              <form onSubmit={handleSaveEditAdmin} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <IoPeopleOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                    <input
                      type="text"
                      value={editAdminData.name}
                      onChange={(e) => setEditAdminData({ ...editAdminData, name: e.target.value })}
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-colors font-medium text-gray-800"
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-gray-400 font-normal lowercase">(read-only)</span>
                  </label>
                  <div className="relative">
                    <IoMailOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                    <input
                      type="email"
                      value={editAdminData.email}
                      disabled
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-gray-100 border border-gray-200 rounded-xl font-medium text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Mobile / Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Mobile Number <span className="text-gray-400 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <IoCallOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                    <input
                      type="tel"
                      value={editAdminData.phone}
                      onChange={(e) => setEditAdminData({ ...editAdminData, phone: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-colors font-medium text-gray-800"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                {/* Role (Protected for Super Admin) */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Assigned Role
                  </label>
                  {editAdminData.role === 'SUPER_ADMIN' ? (
                    <div className="px-3.5 py-2.5 text-xs bg-purple-50 text-purple-700 font-bold border border-purple-200 rounded-xl flex items-center gap-2">
                      <IoShieldCheckmarkOutline className="text-base text-purple-600" />
                      Super Admin (Root Governance - Protected)
                    </div>
                  ) : (
                    <select
                      value={editAdminData.role}
                      onChange={(e) => handleEditRoleChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-colors font-medium text-gray-800 cursor-pointer"
                    >
                      {ROLE_DEFINITIONS.filter(r => r.value !== 'SUPER_ADMIN').map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label} — {r.description}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Reset Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Reset Password
                    </label>
                    <span className="text-[10px] text-gray-400">Leave blank to keep unchanged</span>
                  </div>
                  <div className="relative">
                    <IoKeyOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                    <input
                      type={showEditPassword ? "text" : "password"}
                      value={editAdminData.password}
                      onChange={(e) => setEditAdminData({ ...editAdminData, password: e.target.value })}
                      minLength={6}
                      className="w-full pl-10 pr-9 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-colors font-medium text-gray-800"
                      placeholder="Enter new password (min 6 chars)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base cursor-pointer"
                    >
                      {showEditPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                    </button>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    disabled={editLoading}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editLoading ? (
                      <>
                        <IoRefreshOutline className="animate-spin text-sm" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <IoCheckmarkOutline className="text-sm" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
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
