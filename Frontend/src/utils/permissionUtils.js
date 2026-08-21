/**
 * Granular Admin Permission Matrix & Helper Utilities
 */

export const ADMIN_MODULES = [
  {
    key: "operations",
    label: "Operations & Bookings",
    description: "Manage bookings, live GPS tracking, surveyor shifts & scheduling.",
    icon: "IoCarOutline",
    color: "text-blue-600 bg-blue-50 border-blue-200"
  },
  {
    key: "verification",
    label: "Expert KYC & Verification",
    description: "Review expert certificates, KYC documents, and pending onboarding.",
    icon: "IoShieldCheckmarkOutline",
    color: "text-amber-600 bg-amber-50 border-amber-200"
  },
  {
    key: "finance",
    label: "Finance & Payments",
    description: "Access company revenue, transactions, payouts, vendor settlements & invoices.",
    icon: "IoCardOutline",
    color: "text-emerald-600 bg-emerald-50 border-emerald-200"
  },
  {
    key: "support",
    label: "Customer Support & Disputes",
    description: "Manage customer & vendor disputes, tickets, and user ratings/reviews.",
    icon: "IoHeadsetOutline",
    color: "text-rose-600 bg-rose-50 border-rose-200"
  },
  {
    key: "qc",
    label: "Quality Control & QA Audits",
    description: "Audit groundwater survey test reports, depth readings & borewell QA.",
    icon: "IoCheckmarkDoneCircleOutline",
    color: "text-teal-600 bg-teal-50 border-teal-200"
  },
  {
    key: "reports",
    label: "Reports & Analytics",
    description: "Executive analytics, demand heatmaps, and financial/operational reports.",
    icon: "IoStatsChartOutline",
    color: "text-indigo-600 bg-indigo-50 border-indigo-200"
  },
  {
    key: "settings",
    label: "System Settings & Policies",
    description: "Platform policies, terms, pricing matrix, and administrative configuration.",
    icon: "IoSettingsOutline",
    color: "text-purple-600 bg-purple-50 border-purple-200"
  }
];

export const ROLE_DEFAULT_PERMISSIONS = {
  SUPER_ADMIN: ["all", "operations", "verification", "finance", "support", "qc", "reports", "settings"],
  ADMIN: ["all", "operations", "verification", "finance", "support", "qc", "reports", "settings"],
  OPERATIONS_ADMIN: ["operations", "reports"],
  EXPERT_VERIFICATION_ADMIN: ["verification"],
  VERIFIER_ADMIN: ["verification"],
  FINANCE_ADMIN: ["finance", "reports"],
  SUPPORT_ADMIN: ["support"],
  QC_ADMIN: ["qc"]
};

/**
 * Checks whether an admin possesses permission for a given module
 * @param {Object} admin - The current authenticated admin object
 * @param {string} requiredPermission - The module permission key to test
 * @returns {boolean}
 */
export const hasAdminPermission = (admin, requiredPermission) => {
  if (!admin) return false;

  // 1. Super Admins possess unrestricted master access
  if (admin.role === "SUPER_ADMIN" || admin.role === "ADMIN") {
    return true;
  }

  if (!requiredPermission) {
    return true; // No specific module required (e.g. Dashboard)
  }

  // 2. Wildcard 'all' permission check
  const permissions = Array.isArray(admin.permissions) ? admin.permissions : [];
  if (permissions.includes("all")) {
    return true;
  }

  // 3. Explicit module permission check
  if (permissions.includes(requiredPermission)) {
    return true;
  }

  // 4. Fallback: Role defaults if permissions array has not yet been populated
  if (permissions.length === 0 && ROLE_DEFAULT_PERMISSIONS[admin.role]) {
    return ROLE_DEFAULT_PERMISSIONS[admin.role].includes(requiredPermission);
  }

  return false;
};
