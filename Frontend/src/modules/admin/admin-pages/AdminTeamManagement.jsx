import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AdminActivityLogs from "./AdminActivityLogs";
import {
  IoPeopleOutline,
  IoShieldCheckmarkOutline,
  IoShieldOutline,
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
  IoCheckmarkDoneOutline,
  IoCloseOutline,
  IoMailOutline,
  IoKeyOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoArrowBackOutline,
  IoLockClosedOutline,
  IoCallOutline,
  IoChevronDown,
  IoHomeOutline,
  IoBusinessOutline,
  IoPersonCircleOutline,
  IoCalendarOutline,
  IoWalletOutline,
  IoBarChartOutline,
  IoStarOutline,
  IoAlertCircleOutline,
  IoDocumentTextOutline,
  IoSettingsOutline,
  IoCheckmarkDoneCircleOutline
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
import {
  ADMIN_MODULES,
  SIDEBAR_MODULE_PERMISSIONS,
  APPROVAL_PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
  normalizePermissions,
  sanitizePermissions,
  hasAdminPermission
} from "../../../utils/permissionUtils";
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
  const navigate = useNavigate();
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
  const [currentTab, setCurrentTab] = useState("TEAM"); // "TEAM" | "AUDIT"


  // Performance Modal
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [performanceStats, setPerformanceStats] = useState([]);
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
  const [verifyMethod, setVerifyMethod] = useState("EMAIL"); // "EMAIL" | "PHONE"

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
    phone: "",
    verifyMethod: "EMAIL",
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
    setVerifyMethod("EMAIL");
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
      phone: "",
      verifyMethod: "EMAIL",
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

  const renderModuleIcon = (iconName) => {
    switch (iconName) {
      case "IoHomeOutline":
        return <IoHomeOutline className="text-blue-500 text-sm" />;
      case "IoBusinessOutline":
        return <IoBusinessOutline className="text-amber-500 text-sm" />;
      case "IoPersonCircleOutline":
        return <IoPersonCircleOutline className="text-cyan-500 text-sm" />;
      case "IoCalendarOutline":
        return <IoCalendarOutline className="text-sky-500 text-sm" />;
      case "IoCheckmarkCircleOutline":
        return <IoCheckmarkCircleOutline className="text-emerald-500 text-sm" />;
      case "IoWalletOutline":
        return <IoWalletOutline className="text-teal-500 text-sm" />;
      case "IoBarChartOutline":
        return <IoBarChartOutline className="text-indigo-500 text-sm" />;
      case "IoStarOutline":
        return <IoStarOutline className="text-yellow-500 text-sm" />;
      case "IoAlertCircleOutline":
        return <IoAlertCircleOutline className="text-rose-500 text-sm" />;
      case "IoShieldCheckmarkOutline":
        return <IoShieldCheckmarkOutline className="text-purple-500 text-sm" />;
      case "IoDocumentTextOutline":
        return <IoDocumentTextOutline className="text-slate-500 text-sm" />;
      case "IoSettingsOutline":
        return <IoSettingsOutline className="text-gray-500 text-sm" />;
      default:
        return <IoShieldOutline className="text-blue-500 text-sm" />;
    }
  };

  const handleRegisterRoleChange = (newRole) => {
    const defaultPerms = ROLE_DEFAULT_PERMISSIONS[newRole] || ["operations"];
    setRegisterForm((prev) => ({
      ...prev,
      role: newRole,
      permissions: sanitizePermissions(defaultPerms),
    }));
  };

  const toggleRegisterPermission = (permKey) => {
    setRegisterForm((prev) => {
      const current = prev.permissions || [];
      const isCurrentlyChecked = current.includes(permKey);
      let updated;
      if (isCurrentlyChecked) {
        updated = current.filter((k) => k !== permKey);
        // If unticking a parent module, also remove dependent approval permissions
        if (permKey === "vendors") updated = updated.filter((k) => k !== "can_approve_vendors");
        if (permKey === "approvals") updated = updated.filter((k) => k !== "can_approve_reports");
        if (permKey === "payments") updated = updated.filter((k) => k !== "can_approve_disbursals");
      } else {
        // If ticking an approval permission, ensure its parent page is enabled
        const appDef = APPROVAL_PERMISSIONS.find((a) => a.key === permKey);
        if (appDef && !current.includes(appDef.requiredPage) && !current.includes("all")) {
          return prev;
        }
        updated = [...current, permKey];
      }
      return { ...prev, permissions: sanitizePermissions(updated) };
    });
  };

  const handleSelectAllRegisterPermissions = () => {
    const allKeys = [
      ...SIDEBAR_MODULE_PERMISSIONS.map((p) => p.key),
      ...APPROVAL_PERMISSIONS.map((p) => p.key),
    ];
    setRegisterForm((prev) => ({ ...prev, permissions: sanitizePermissions(allKeys) }));
  };

  const handleResetRegisterPermissions = () => {
    const defaultPerms = ROLE_DEFAULT_PERMISSIONS[registerForm.role] || ["operations"];
    setRegisterForm((prev) => ({ ...prev, permissions: sanitizePermissions(defaultPerms) }));
  };

  const handleOpenEditModal = (admin) => {
    setEditError("");
    setShowEditPassword(false);
    const rawPerms = Array.isArray(admin.permissions) && admin.permissions.length > 0
      ? admin.permissions
      : (ROLE_DEFAULT_PERMISSIONS[admin.role] || ["vendors"]);
    
    const existingPerms = sanitizePermissions(normalizePermissions(rawPerms));

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
      permissions: sanitizePermissions(defaultPerms),
    }));
  };

  const toggleEditPermission = (permKey) => {
    setEditAdminData((prev) => {
      const current = prev.permissions || [];
      const isCurrentlyChecked = current.includes(permKey);
      let updated;
      if (isCurrentlyChecked) {
        updated = current.filter((k) => k !== permKey);
        // If unticking a parent module, also remove dependent approval permissions
        if (permKey === "vendors") updated = updated.filter((k) => k !== "can_approve_vendors");
        if (permKey === "approvals") updated = updated.filter((k) => k !== "can_approve_reports");
        if (permKey === "payments") updated = updated.filter((k) => k !== "can_approve_disbursals");
      } else {
        // If ticking an approval permission, ensure its parent page is enabled
        const appDef = APPROVAL_PERMISSIONS.find((a) => a.key === permKey);
        if (appDef && !current.includes(appDef.requiredPage) && !current.includes("all")) {
          return prev;
        }
        updated = [...current, permKey];
      }
      return { ...prev, permissions: sanitizePermissions(updated) };
    });
  };

  const handleSelectAllEditPermissions = () => {
    const allKeys = [
      ...SIDEBAR_MODULE_PERMISSIONS.map((p) => p.key),
      ...APPROVAL_PERMISSIONS.map((p) => p.key),
    ];
    setEditAdminData((prev) => ({ ...prev, permissions: sanitizePermissions(allKeys) }));
  };

  const handleResetEditPermissions = () => {
    const defaultPerms = ROLE_DEFAULT_PERMISSIONS[editAdminData.role] || ["operations"];
    setEditAdminData((prev) => ({ ...prev, permissions: sanitizePermissions(defaultPerms) }));
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
        permissions: sanitizePermissions(editAdminData.permissions),
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

    if (verifyMethod === "EMAIL" && !registerForm.email.trim()) {
      setRegisterError("Admin email address is required for Email verification");
      return;
    }

    if (verifyMethod === "PHONE" && !registerForm.phone.trim()) {
      setRegisterError("Mobile number is required for SMS OTP verification");
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
        email: registerForm.email.trim() ? registerForm.email.trim().toLowerCase() : undefined,
        phone: registerForm.phone.trim() || undefined,
        verifyMethod,
      });

      if (res.success) {
        setOtpData({
          token: res.data.token,
          email: res.data.email || registerForm.email,
          phone: res.data.phone || registerForm.phone,
          verifyMethod,
          otp: "",
        });
        setRegisterStep(2);
        setOtpCountdown(60);
        const destination = verifyMethod === "PHONE" ? registerForm.phone : registerForm.email;
        toast.showSuccess(`Verification code sent to ${destination}`);
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
        email: registerForm.email.trim() ? registerForm.email.trim().toLowerCase() : undefined,
        phone: registerForm.phone.trim() || undefined,
        verifyMethod,
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
        email: registerForm.email.trim() ? registerForm.email.trim().toLowerCase() : undefined,
        phone: registerForm.phone.trim() || undefined,
        password: registerForm.password,
        role: registerForm.role,
        permissions: sanitizePermissions(registerForm.permissions),
        verifyMethod,
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
    <div className="p-4 sm:p-5 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <IoPeopleOutline className="text-blue-600 text-lg" />
            Admin Team & Governance
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage role-based admins, toggle automated workload distribution, and audit internal staff actions.
          </p>
        </div>
        {currentTab === "TEAM" && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-xs font-medium cursor-pointer"
            >
              <IoRefreshOutline className={`text-sm ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={handleOpenRegisterModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all shadow-xs text-xs font-bold cursor-pointer active:scale-95"
            >
              <IoPersonAddOutline className="text-sm" />
              Register Admin
            </button>
          </div>
        )}
      </div>

      {/* ── SUB-PAGE TAB SWITCHER ── */}
      <div className="flex items-center gap-2 bg-gray-100/80 p-1 rounded-2xl w-fit border border-gray-200/60">
        <button
          type="button"
          onClick={() => setCurrentTab("TEAM")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            currentTab === "TEAM"
              ? "bg-white text-gray-900 shadow-xs border border-gray-200/80"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <IoPeopleOutline className="text-sm" />
          <span>Team Members & Roles</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
            currentTab === "TEAM" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-gray-200 text-gray-600"
          }`}>
            {admins.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab("AUDIT")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            currentTab === "AUDIT"
              ? "bg-white text-gray-900 shadow-xs border border-gray-200/80"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <IoShieldCheckmarkOutline className="text-sm text-blue-600" />
          <span>Staff Activity & Audit Trail</span>
        </button>
      </div>

      {error && <ErrorMessage message={error} className="mb-3" />}

      {currentTab === "AUDIT" ? (
        <AdminActivityLogs embedded={true} />
      ) : (
        <>
          {/* ── DEPARTMENT MASTER AUTO-ASSIGN TOGGLE CARD ── */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm border border-blue-100">
              <IoFlashOutline />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-gray-900">Department Auto-Assignment Toggles</h2>
              <p className="text-[11px] text-gray-400">When enabled, new incoming requests are automatically distributed equally using Least-Active-Load.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {[
            { key: "AUTO_ASSIGN_VERIFICATION", label: "KYC & Verification", role: "Expert Verifiers" },
            { key: "AUTO_ASSIGN_OPERATIONS", label: "Operations", role: "Bookings & Shifts" },
            { key: "AUTO_ASSIGN_FINANCE", label: "Finance & Payouts", role: "Withdrawals & Invoices" },
            { key: "AUTO_ASSIGN_SUPPORT", label: "Customer Support", role: "Disputes & Tickets" },
            { key: "AUTO_ASSIGN_QC", label: "Quality Control", role: "Reports & Borewell QA" },
          ].map((dept) => {
            const isEnabled = toggles[dept.key] !== false;
            return (
              <div
                key={dept.key}
                className={`p-2.5 rounded-xl border transition-all ${
                  isEnabled ? "bg-blue-50/40 border-blue-200" : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11.5px] font-bold text-gray-900 truncate">{dept.label}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleDepartment(dept.key, isEnabled)}
                    disabled={togglesLoading}
                    className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isEnabled ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? "translate-x-3.5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[9.5px]">
                  <span className="text-gray-400 truncate">{dept.role}</span>
                  <span className={`font-black tracking-wider ${isEnabled ? "text-blue-600" : "text-gray-400"}`}>
                    {isEnabled ? "AUTO" : "POOL"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ADMIN TEAM MEMBERS TABLE ── */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
        {/* Table Header Bar */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <IoBriefcaseOutline className="text-gray-500 text-sm" />
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">
              Operational Staff Team ({admins.filter((a) => a.role !== "SUPER_ADMIN").length})
            </h3>
          </div>
          <span className="text-[11px] text-gray-400">
            Staff on-duty:{" "}
            <strong className="text-gray-700 font-bold">
              {admins.filter((a) => a.role !== "SUPER_ADMIN" && a.isActive && a.isAvailableForAssignment !== false).length}
            </strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-2.5">Admin</th>
                <th className="px-4 py-2.5">Account Status</th>
                <th className="px-4 py-2.5">Duty / Auto-Assign</th>
                <th className="px-4 py-2.5">Active Load</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {admins.filter((a) => a.role !== "SUPER_ADMIN").length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-xl">
                        <IoPeopleOutline />
                      </div>
                      <p className="font-bold text-xs text-gray-700">No Operational Staff Members</p>
                      <p className="text-[11px] text-gray-400 max-w-sm">
                        Click <span className="font-semibold text-blue-600">"+ Register Admin"</span> above to onboard staff admins and assign module clearances.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                admins
                  .filter((a) => a.role !== "SUPER_ADMIN")
                  .map((admin) => {
                    const isSelf = admin._id === currentAdmin.id;
                    const isUpdating = updatingId === admin._id;
                    const isDuty = admin.isAvailableForAssignment !== false;

                    return (
                      <tr key={admin._id} className="hover:bg-gray-50/60 transition-colors border-b border-gray-100">
                        {/* Name, Role Badge, Email, Phone & Permissions Preview */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-gray-900 text-xs">{admin.name}</span>
                            {isSelf && (
                              <span className="text-[9.5px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded">
                                (You)
                              </span>
                            )}
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-bold border ${getRoleBadge(
                                admin.role
                              )}`}
                            >
                              {ROLE_DEFINITIONS.find((r) => r.value === admin.role)?.label || admin.role}
                            </span>
                          </div>
                          <div className="text-[10.5px] text-gray-400 mt-0.2">{admin.email}</div>
                          {admin.phone ? (
                            <div className="text-[10.5px] text-gray-600 font-medium flex items-center gap-1 mt-0.5">
                              <IoCallOutline className="text-[10px] text-blue-500" />
                              <span>{admin.phone}</span>
                            </div>
                          ) : (
                            <div className="text-[9.5px] text-gray-300 italic mt-0.5">No mobile number</div>
                          )}

                          {/* Permissions Preview Pills (e.g. 1-2 pills + "+3 more") */}
                          <div className="flex items-center gap-1 flex-wrap mt-1.5">
                            {(() => {
                              const rawPerms = Array.isArray(admin.permissions) && admin.permissions.length > 0
                                ? admin.permissions
                                : (ROLE_DEFAULT_PERMISSIONS[admin.role] || []);

                              if (rawPerms.includes("all")) {
                                return (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                    <IoShieldCheckmarkOutline className="text-[9.5px]" />
                                    All Access
                                  </span>
                                );
                              }

                              if (rawPerms.length === 0) {
                                return (
                                  <span className="text-[9px] text-gray-400 italic">
                                    0 permissions
                                  </span>
                                );
                              }

                              const allLabels = rawPerms.map((key) => {
                                const matchModule = SIDEBAR_MODULE_PERMISSIONS.find((m) => m.key === key);
                                if (matchModule) return matchModule.label.split("&")[0].split("/")[0].trim();
                                const matchApp = APPROVAL_PERMISSIONS.find((a) => a.key === key);
                                if (matchApp) return matchApp.label.replace("Can Approve", "Approve").trim();
                                return key;
                              });

                              const visibleLabels = allLabels.slice(0, 2);
                              const remainingCount = allLabels.length - visibleLabels.length;

                              return (
                                <>
                                  {visibleLabels.map((lbl, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 truncate max-w-[120px]"
                                      title={lbl}
                                    >
                                      {lbl}
                                    </span>
                                  ))}
                                  {remainingCount > 0 && (
                                    <span
                                      className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 cursor-help"
                                      title={`Other permissions: ${allLabels.slice(2).join(", ")}`}
                                    >
                                      +{remainingCount} more
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </td>

                        {/* Account Status (Operational Staff Only) */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleActiveStatus(admin._id, admin.isActive)}
                            disabled={isUpdating}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                              admin.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                admin.isActive ? "bg-emerald-500" : "bg-gray-400"
                              }`}
                            />
                            {admin.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>

                        {/* Duty Status (Operational Staff Only) */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleDutyStatus(admin._id, isDuty)}
                            disabled={isUpdating || !admin.isActive}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                              isDuty && admin.isActive
                                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isDuty && admin.isActive ? "bg-blue-500 animate-pulse" : "bg-amber-400"
                              }`}
                            />
                            {isDuty && admin.isActive ? "On-Duty (Receiving)" : "Away (Paused)"}
                          </button>
                        </td>

                        {/* Active Workload Counter */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-bold px-2 py-0.5 rounded text-[10.5px] ${
                                (admin.activeTicketsCount || 0) > 5
                                  ? "bg-rose-100 text-rose-700"
                                  : (admin.activeTicketsCount || 0) > 0
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {admin.activeTicketsCount || 0} open
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(admin)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                              title="Edit Profile & Permissions"
                            >
                              <IoCreateOutline className="text-sm" />
                            </button>
                            {!isSelf && (
                              <button
                                onClick={() => handleDeleteClick(admin)}
                                className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="Delete Admin"
                              >
                                <IoTrashOutline className="text-sm" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

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
            <div className="flex-1 overflow-y-auto pr-1.5 space-y-3 custom-scrollbar">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-3.5 max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-base border border-blue-100">
                  <IoPersonAddOutline />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">Register Internal Admin</h3>
                  <p className="text-xs text-gray-400">
                    {registerStep === 1 
                      ? "Create account, assign role, approvals, and sidebar module access." 
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
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2 rounded-xl flex items-center justify-between">
                <span>{registerError}</span>
                <button type="button" onClick={() => setRegisterError("")} className="text-rose-500 hover:text-rose-700 text-sm font-bold">×</button>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar">
              {registerStep === 1 ? (
                /* Step 1: Details Form */
                <form onSubmit={handleSendRegistrationOTP} className="space-y-4">
                  {/* Verification Channel Selector */}
                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Choose Verification Channel *
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">
                        OTP will be dispatched via this channel
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setVerifyMethod("EMAIL")}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none outline-none ${
                          verifyMethod === "EMAIL"
                            ? "bg-white border-blue-500 text-blue-900 shadow-xs ring-1 ring-blue-500/20"
                            : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900"
                        }`}
                      >
                        <IoMailOutline className={verifyMethod === "EMAIL" ? "text-blue-600 text-sm" : "text-slate-400 text-sm"} />
                        <span>Email OTP</span>
                        {verifyMethod === "EMAIL" && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 ml-0.5"></span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => setVerifyMethod("PHONE")}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none outline-none ${
                          verifyMethod === "PHONE"
                            ? "bg-white border-blue-500 text-blue-900 shadow-xs ring-1 ring-blue-500/20"
                            : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900"
                        }`}
                      >
                        <IoCallOutline className={verifyMethod === "PHONE" ? "text-blue-600 text-sm" : "text-slate-400 text-sm"} />
                        <span>Mobile SMS OTP</span>
                        {verifyMethod === "PHONE" && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 ml-0.5"></span>}
                      </button>
                    </div>
                  </div>

                  {/* Credentials 2-Column Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <IoPeopleOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                          type="text"
                          value={registerForm.name}
                          onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                          required
                          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-800 outline-none transition-all shadow-xs"
                          placeholder="e.g. Rahul Sharma"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Email Address {verifyMethod === "EMAIL" ? <span className="text-rose-500">*</span> : <span className="text-gray-400 font-normal lowercase">(optional)</span>}
                      </label>
                      <div className="relative">
                        <IoMailOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                          type="email"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                          required={verifyMethod === "EMAIL"}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-800 outline-none transition-all shadow-xs"
                          placeholder="rahul@jaladhar.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <IoKeyOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          required
                          minLength={6}
                          className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-800 outline-none transition-all shadow-xs"
                          placeholder="Min 6 chars"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
                        >
                          {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <IoKeyOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={registerForm.confirmPassword}
                          onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                          required
                          className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-800 outline-none transition-all shadow-xs"
                          placeholder="Re-enter password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
                        >
                          {showConfirmPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Designated Role *
                        </label>
                        <select
                          value={registerForm.role}
                          onChange={(e) => handleRegisterRoleChange(e.target.value)}
                          required
                          className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-800 cursor-pointer outline-none transition-all shadow-xs"
                        >
                          {ROLE_DEFINITIONS.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Mobile Number {verifyMethod === "PHONE" ? <span className="text-rose-500">*</span> : <span className="text-gray-400 font-normal lowercase">(optional)</span>}
                        </label>
                        <div className="relative">
                          <IoCallOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                          <input
                            type="tel"
                            value={registerForm.phone}
                            onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                            required={verifyMethod === "PHONE"}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-800 outline-none transition-all shadow-xs"
                            placeholder="+91 98765 43210"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 1. SIDEBAR NAVIGATION & PAGE ACCESS SECTION */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <IoBriefcaseOutline className="text-blue-600 text-sm" />
                        <h4 className="text-xs font-bold text-gray-900">
                          Sidebar Navigation & Page Access
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAllRegisterPermissions}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                        >
                          ✓ Allow All Pages
                        </button>
                        <span className="text-gray-300">•</span>
                        <button
                          type="button"
                          onClick={handleResetRegisterPermissions}
                          className="text-[10px] text-gray-500 hover:text-gray-700 font-medium hover:underline cursor-pointer"
                        >
                          ↺ Reset Defaults
                        </button>
                        <span className="text-[10px] text-blue-700 font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full ml-1">
                          {SIDEBAR_MODULE_PERMISSIONS.filter((m) => registerForm.permissions.includes(m.key)).length} / {SIDEBAR_MODULE_PERMISSIONS.length} pages allowed
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Select which sidebar navigation pages this staff admin can visit. Items not selected will be hidden from their sidebar.
                    </p>

                    <div className="bg-gray-50/70 p-2.5 rounded-2xl border border-gray-200/80 max-h-[220px] overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SIDEBAR_MODULE_PERMISSIONS.map((mod) => {
                          const isChecked =
                            registerForm.permissions.includes(mod.key) ||
                            registerForm.permissions.includes("all");
                          return (
                            <button
                              key={mod.key}
                              type="button"
                              onClick={() => toggleRegisterPermission(mod.key)}
                              className={`flex items-start gap-2.5 p-2 px-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer select-none outline-none ${
                                isChecked
                                  ? "bg-white border-blue-400 text-blue-950 shadow-xs ring-1 ring-blue-500/20"
                                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-xs"
                              }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                                  isChecked
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "border border-gray-300 bg-white"
                                }`}
                              >
                                {isChecked && <IoCheckmarkOutline className="text-[9px] stroke-[3]" />}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {renderModuleIcon(mod.icon)}
                                    <span
                                      className={`text-[11px] font-bold truncate ${
                                        isChecked ? "text-blue-950" : "text-gray-900"
                                      }`}
                                    >
                                      {mod.label}
                                    </span>
                                  </div>
                                  <span className="text-[8px] font-bold text-gray-400 bg-gray-100 px-1 py-0.2 rounded uppercase">
                                    {mod.section.split(" ")[0]}
                                  </span>
                                </div>
                                <p
                                  className={`text-[9.5px] mt-0.5 leading-snug line-clamp-1 ${
                                    isChecked ? "text-blue-800/80" : "text-gray-400"
                                  }`}
                                >
                                  {mod.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 2. APPROVAL PERMISSIONS SECTION (Shows all, disabling unselected parent pages) */}
                  {(() => {
                    const activeApprovalCount = APPROVAL_PERMISSIONS.filter(
                      (a) =>
                        (registerForm.permissions.includes(a.requiredPage) || registerForm.permissions.includes("all")) &&
                        (registerForm.permissions.includes(a.key) || registerForm.permissions.includes("all"))
                    ).length;

                    return (
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <IoShieldCheckmarkOutline className="text-amber-600 text-sm" />
                            <h4 className="text-xs font-bold text-gray-900">
                              Approval & Action Permissions
                            </h4>
                          </div>
                          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            {activeApprovalCount} approval rights enabled
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          Grant operational authority to verify and approve actions. Requires corresponding sidebar page access enabled above.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          {APPROVAL_PERMISSIONS.map((app) => {
                            const isPageAllowed =
                              registerForm.permissions.includes(app.requiredPage) ||
                              registerForm.permissions.includes("all");
                            const isChecked =
                              isPageAllowed &&
                              (registerForm.permissions.includes(app.key) ||
                                registerForm.permissions.includes("all"));

                            return (
                              <button
                                key={app.key}
                                type="button"
                                disabled={!isPageAllowed}
                                onClick={() => isPageAllowed && toggleRegisterPermission(app.key)}
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-150 select-none outline-none ${
                                  !isPageAllowed
                                    ? "bg-gray-50/70 border-dashed border-gray-200 text-gray-400 opacity-60 cursor-not-allowed"
                                    : isChecked
                                    ? "bg-amber-50/80 border-amber-300 text-amber-950 shadow-xs ring-1 ring-amber-400/20 cursor-pointer"
                                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-xs cursor-pointer"
                                }`}
                              >
                                <div
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                                    !isPageAllowed
                                      ? "border border-dashed border-gray-300 bg-gray-100 text-gray-400"
                                      : isChecked
                                      ? "bg-amber-600 text-white shadow-xs"
                                      : "border border-gray-300 bg-white"
                                  }`}
                                >
                                  {!isPageAllowed ? (
                                    <IoLockClosedOutline className="text-[9px] text-gray-400" />
                                  ) : isChecked ? (
                                    <IoCheckmarkOutline className="text-[9px] stroke-[3]" />
                                  ) : null}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span
                                    className={`text-[11px] font-bold block truncate ${
                                      !isPageAllowed
                                        ? "text-gray-400"
                                        : isChecked
                                        ? "text-amber-950"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {app.label}
                                  </span>
                                  <p
                                    className={`text-[9.5px] mt-0.5 leading-snug line-clamp-2 ${
                                      !isPageAllowed
                                        ? "text-gray-400"
                                        : isChecked
                                        ? "text-amber-800/80"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {app.description}
                                  </p>
                                  {!isPageAllowed && (
                                    <span className="text-[8.5px] text-amber-700/80 font-semibold block mt-1">
                                      🔒 Requires '{app.pageName.split(" ")[0]}' page access
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Actions */}
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
                      {verifyMethod === "PHONE" ? (
                        <IoCallOutline className="text-base text-blue-600" />
                      ) : (
                        <IoMailOutline className="text-base text-blue-600" />
                      )}
                      Verification Code Sent via {verifyMethod === "PHONE" ? "SMS" : "Email"}
                    </div>
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      We have sent a 6-digit OTP to{" "}
                      <strong className="font-bold text-blue-900">
                        {verifyMethod === "PHONE" ? registerForm.phone : registerForm.email}
                      </strong>
                      . Please enter it below to complete registration.
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-3.5 max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-base border border-rose-100">
                  <IoShieldOutline />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">Edit Admin Profile & Security</h3>
                  <p className="text-xs text-gray-400">
                    Update credentials, role clearances, approval permissions, and sidebar page access.
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
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2 rounded-xl flex items-center justify-between">
                <span>{editError}</span>
                <button
                  type="button"
                  onClick={() => setEditError("")}
                  className="text-rose-500 hover:text-rose-700 text-sm font-bold"
                >
                  ×
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar">
              <form onSubmit={handleSaveEditAdmin} className="space-y-4">
                {/* 2-Column Grid for Credentials & Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Name * */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={editAdminData.name}
                      onChange={(e) => setEditAdminData({ ...editAdminData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-800 outline-none transition-all shadow-xs"
                      placeholder="Enter admin name"
                    />
                  </div>

                  {/* Email * (Read-only) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={editAdminData.email}
                      disabled
                      className="w-full px-3 py-2 text-xs bg-gray-50/80 border border-gray-200 rounded-xl font-medium text-gray-500 cursor-not-allowed outline-none shadow-xs"
                    />
                  </div>

                  {/* Password (leave blank to keep) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Password (leave blank to keep)
                    </label>
                    <div className="relative">
                      <input
                        type={showEditPassword ? "text" : "password"}
                        value={editAdminData.password}
                        onChange={(e) => setEditAdminData({ ...editAdminData, password: e.target.value })}
                        minLength={6}
                        className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-800 placeholder:text-gray-400 outline-none transition-all shadow-xs"
                        placeholder="Min 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
                      >
                        {showEditPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                      </button>
                    </div>
                  </div>

                  {/* Role * */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Role *
                    </label>
                    {editAdminData.role === "SUPER_ADMIN" ? (
                      <div className="px-3 py-2 text-xs bg-purple-50 text-purple-700 font-bold border border-purple-200 rounded-xl flex items-center gap-1.5 shadow-xs">
                        <IoShieldCheckmarkOutline className="text-sm text-purple-600" />
                        Super Admin (Protected Master Access)
                      </div>
                    ) : (
                      <select
                        value={editAdminData.role}
                        onChange={(e) => handleEditRoleChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-800 cursor-pointer outline-none transition-all shadow-xs"
                      >
                        {ROLE_DEFINITIONS.filter((r) => r.value !== "SUPER_ADMIN").map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Mobile Number (optional) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Mobile Number <span className="text-gray-400 font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={editAdminData.phone}
                      onChange={(e) => setEditAdminData({ ...editAdminData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-800 outline-none transition-all shadow-xs"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                {/* 1. SIDEBAR NAVIGATION & PAGE ACCESS SECTION */}
                {editAdminData.role !== "SUPER_ADMIN" && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <IoBriefcaseOutline className="text-blue-600 text-sm" />
                        <h4 className="text-xs font-bold text-gray-900">
                          Sidebar Navigation & Page Access
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAllEditPermissions}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                        >
                          ✓ Allow All Pages
                        </button>
                        <span className="text-gray-300">•</span>
                        <button
                          type="button"
                          onClick={handleResetEditPermissions}
                          className="text-[10px] text-gray-500 hover:text-gray-700 font-medium hover:underline cursor-pointer"
                        >
                          ↺ Reset Defaults
                        </button>
                        <span className="text-[10px] text-blue-700 font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full ml-1">
                          {SIDEBAR_MODULE_PERMISSIONS.filter((m) => editAdminData.permissions.includes(m.key)).length} / {SIDEBAR_MODULE_PERMISSIONS.length} pages allowed
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Select which sidebar navigation pages this staff admin can visit. Items not selected will be hidden from their sidebar.
                    </p>

                    <div className="bg-gray-50/70 p-2.5 rounded-2xl border border-gray-200/80 max-h-[240px] overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SIDEBAR_MODULE_PERMISSIONS.map((mod) => {
                          const isChecked =
                            editAdminData.permissions.includes(mod.key) ||
                            editAdminData.permissions.includes("all");
                          return (
                            <button
                              key={mod.key}
                              type="button"
                              onClick={() => toggleEditPermission(mod.key)}
                              className={`flex items-start gap-2.5 p-2 px-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer select-none outline-none ${
                                isChecked
                                  ? "bg-white border-blue-400 text-blue-950 shadow-xs ring-1 ring-blue-500/20"
                                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-xs"
                              }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                                  isChecked
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "border border-gray-300 bg-white"
                                }`}
                              >
                                {isChecked && <IoCheckmarkOutline className="text-[9px] stroke-[3]" />}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {renderModuleIcon(mod.icon)}
                                    <span
                                      className={`text-[11px] font-bold truncate ${
                                        isChecked ? "text-blue-950" : "text-gray-900"
                                      }`}
                                    >
                                      {mod.label}
                                    </span>
                                  </div>
                                  <span className="text-[8px] font-bold text-gray-400 bg-gray-100 px-1 py-0.2 rounded uppercase">
                                    {mod.section.split(" ")[0]}
                                  </span>
                                </div>
                                <p
                                  className={`text-[9.5px] mt-0.5 leading-snug line-clamp-1 ${
                                    isChecked ? "text-blue-800/80" : "text-gray-400"
                                  }`}
                                >
                                  {mod.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. APPROVAL PERMISSIONS SECTION (Shows all, disabling unselected parent pages) */}
                {editAdminData.role !== "SUPER_ADMIN" && (() => {
                  const activeApprovalCount = APPROVAL_PERMISSIONS.filter(
                    (a) =>
                      (editAdminData.permissions.includes(a.requiredPage) || editAdminData.permissions.includes("all")) &&
                      (editAdminData.permissions.includes(a.key) || editAdminData.permissions.includes("all"))
                  ).length;

                  return (
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <IoShieldCheckmarkOutline className="text-amber-600 text-sm" />
                          <h4 className="text-xs font-bold text-gray-900">
                            Approval & Action Permissions
                          </h4>
                        </div>
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          {activeApprovalCount} approval rights enabled
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Grant operational authority to verify and approve actions. Requires corresponding sidebar page access enabled above.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        {APPROVAL_PERMISSIONS.map((app) => {
                          const isPageAllowed =
                            editAdminData.permissions.includes(app.requiredPage) ||
                            editAdminData.permissions.includes("all");
                          const isChecked =
                            isPageAllowed &&
                            (editAdminData.permissions.includes(app.key) ||
                              editAdminData.permissions.includes("all"));

                          return (
                            <button
                              key={app.key}
                              type="button"
                              disabled={!isPageAllowed}
                              onClick={() => isPageAllowed && toggleEditPermission(app.key)}
                              className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-150 select-none outline-none ${
                                !isPageAllowed
                                  ? "bg-gray-50/70 border-dashed border-gray-200 text-gray-400 opacity-60 cursor-not-allowed"
                                  : isChecked
                                  ? "bg-amber-50/80 border-amber-300 text-amber-950 shadow-xs ring-1 ring-amber-400/20 cursor-pointer"
                                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-xs cursor-pointer"
                              }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                                  !isPageAllowed
                                    ? "border border-dashed border-gray-300 bg-gray-100 text-gray-400"
                                    : isChecked
                                    ? "bg-amber-600 text-white shadow-xs"
                                    : "border border-gray-300 bg-white"
                                }`}
                              >
                                {!isPageAllowed ? (
                                  <IoLockClosedOutline className="text-[9px] text-gray-400" />
                                ) : isChecked ? (
                                  <IoCheckmarkOutline className="text-[9px] stroke-[3]" />
                                ) : null}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span
                                  className={`text-[11px] font-bold block truncate ${
                                    !isPageAllowed
                                      ? "text-gray-400"
                                      : isChecked
                                      ? "text-amber-950"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {app.label}
                                </span>
                                <p
                                  className={`text-[9.5px] mt-0.5 leading-snug line-clamp-2 ${
                                    !isPageAllowed
                                      ? "text-gray-400"
                                      : isChecked
                                      ? "text-amber-800/80"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {app.description}
                                </p>
                                {!isPageAllowed && (
                                  <span className="text-[8.5px] text-amber-700/80 font-semibold block mt-1">
                                    🔒 Requires '{app.pageName.split(" ")[0]}' page access
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

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
