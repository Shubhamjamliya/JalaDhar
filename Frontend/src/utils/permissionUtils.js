/**
 * Granular Admin Permission Matrix & Helper Utilities
 */

export const SIDEBAR_MODULE_PERMISSIONS = [
  {
    key: "dashboard",
    label: "Dashboard & Key Metrics",
    section: "CORE OPERATIONS",
    description: "Allows viewing live operations dashboard, KPI stats & daily workload feeds.",
    icon: "IoHomeOutline",
  },
  {
    key: "vendors",
    label: "Experts / Vendors Management",
    section: "CORE OPERATIONS",
    description: "Allows viewing expert profiles, onboarding KYC verification & wallet balances.",
    icon: "IoBusinessOutline",
  },
  {
    key: "users",
    label: "Users Management",
    section: "CORE OPERATIONS",
    description: "Allows viewing registered customers, user bookings, refunds & profiles.",
    icon: "IoPersonCircleOutline",
  },
  {
    key: "bookings",
    label: "Bookings & Live GPS Tracking",
    section: "CORE OPERATIONS",
    description: "Allows managing bookings, surveyor live GPS tracking, alerts & shifts.",
    icon: "IoCalendarOutline",
  },
  {
    key: "approvals",
    label: "Approvals & QA Review Queue",
    section: "CORE OPERATIONS",
    description: "Allows accessing survey report QA approval queue and borewell validations.",
    icon: "IoCheckmarkCircleOutline",
  },
  {
    key: "payments",
    label: "Payments, Wallets & Disbursals",
    section: "FINANCE & INTELLIGENCE",
    description: "Allows inspecting transactions, gateway settlements, and processing payouts.",
    icon: "IoWalletOutline",
  },
  {
    key: "reports",
    label: "Reports & Geo Analytics",
    section: "FINANCE & INTELLIGENCE",
    description: "Allows viewing business intelligence, demand heatmaps, and financial analytics.",
    icon: "IoBarChartOutline",
  },
  {
    key: "ratings",
    label: "Ratings & Customer Reviews",
    section: "FINANCE & INTELLIGENCE",
    description: "Allows viewing customer ratings, feedback, and expert review moderation.",
    icon: "IoStarOutline",
  },
  {
    key: "disputes",
    label: "Disputes & Customer Support",
    section: "FINANCE & INTELLIGENCE",
    description: "Allows handling customer & expert disputes, support tickets, and resolutions.",
    icon: "IoAlertCircleOutline",
  },
  {
    key: "agreement-logs",
    label: "Audit Logs & OTP Verifications",
    section: "FINANCE & INTELLIGENCE",
    description: "Allows auditing digital agreement signatures, user contracts & OTP logs.",
    icon: "IoShieldCheckmarkOutline",
  },
  {
    key: "policies",
    label: "Content & Platform Policies",
    section: "SYSTEM CONFIG",
    description: "Allows viewing and configuring platform terms, privacy policy & agreements.",
    icon: "IoDocumentTextOutline",
  },
  {
    key: "settings",
    label: "System Settings & Pricing",
    section: "SYSTEM CONFIG",
    description: "Allows configuring platform parameters, pricing matrix, and security integrations.",
    icon: "IoSettingsOutline",
  },
];

export const APPROVAL_PERMISSIONS = [
  {
    key: "can_approve_vendors",
    label: "Can Approve Expert / Vendor KYC",
    description: "Allows approving or rejecting pending vendor KYC onboarding & license requests.",
    requiredPage: "vendors",
    pageName: "Experts / Vendors Management",
  },
  {
    key: "can_approve_reports",
    label: "Can Approve Borewell Survey Reports",
    description: "Allows verifying and approving expert test reports and QA borewell certificates.",
    requiredPage: "approvals",
    pageName: "Approvals & QA Review Queue",
  },
  {
    key: "can_approve_disbursals",
    label: "Can Approve Disbursals & Refunds",
    description: "Allows authorizing expert wallet withdrawals and customer refund claims.",
    requiredPage: "payments",
    pageName: "Payments, Wallets & Disbursals",
  },
];

// Alias for backward compatibility
export const ADMIN_MODULES = SIDEBAR_MODULE_PERMISSIONS;

export const ROLE_DEFAULT_PERMISSIONS = {
  SUPER_ADMIN: ["all"],
  ADMIN: ["all"],
  OPERATIONS_ADMIN: ["dashboard", "users", "bookings", "reports"],
  EXPERT_VERIFICATION_ADMIN: ["dashboard", "vendors", "can_approve_vendors"],
  VERIFIER_ADMIN: ["dashboard", "vendors", "can_approve_vendors"],
  FINANCE_ADMIN: ["dashboard", "payments", "reports", "can_approve_disbursals"],
  SUPPORT_ADMIN: ["dashboard", "disputes", "ratings", "users"],
  QC_ADMIN: ["dashboard", "approvals", "reports", "can_approve_reports"],
};

/**
 * Normalizes legacy permission keys into the modern granular keys
 * @param {Array<string>} perms
 * @returns {Array<string>}
 */
export const normalizePermissions = (perms) => {
  if (!Array.isArray(perms)) return [];
  if (perms.includes("all")) return ["all"];

  const legacyMap = {
    verification: "vendors",
    qc: "approvals",
    finance: "payments",
    support: "disputes",
  };

  const normalized = new Set();
  perms.forEach((p) => {
    if (legacyMap[p]) {
      normalized.add(legacyMap[p]);
    } else {
      normalized.add(p);
    }
  });

  return Array.from(normalized);
};

/**
 * Strips orphaned approval permissions whose parent page is not enabled
 * @param {Array<string>} perms
 * @returns {Array<string>}
 */
export const sanitizePermissions = (perms) => {
  if (!Array.isArray(perms)) return [];
  if (perms.includes("all")) return ["all"];

  const normalized = normalizePermissions(perms);
  const allowedSet = new Set(normalized);

  APPROVAL_PERMISSIONS.forEach((app) => {
    if (!allowedSet.has(app.requiredPage)) {
      allowedSet.delete(app.key);
    }
  });

  return Array.from(allowedSet);
};

/**
 * Checks whether an admin possesses permission for a given module or action
 * @param {Object} admin - The current authenticated admin object
 * @param {string} requiredPermission - The module permission key to test
 * @returns {boolean}
 */
export const hasAdminPermission = (admin, requiredPermission) => {
  if (!admin) return false;

  // 1. Super Admins & Root Admins possess unrestricted master access
  if (admin.role === "SUPER_ADMIN" || admin.role === "ADMIN") {
    return true;
  }

  if (!requiredPermission) {
    return true;
  }

  // 2. Wildcard 'all' permission check
  const rawPerms = Array.isArray(admin.permissions) ? admin.permissions : [];
  if (rawPerms.includes("all")) {
    return true;
  }

  // 3. Normalize legacy aliases (qc -> approvals, support -> disputes, etc.)
  const permissions = normalizePermissions(rawPerms);

  // 4. Action permissions also strictly require access to the corresponding page
  const approvalDeps = {
    can_approve_vendors: "vendors",
    can_approve_reports: "approvals",
    can_approve_disbursals: "payments",
  };

  if (approvalDeps[requiredPermission]) {
    const parentPage = approvalDeps[requiredPermission];
    const hasParentPage = permissions.includes(parentPage) || permissions.includes("all");
    if (!hasParentPage) return false;
  }

  // 5. Exact permission check
  if (permissions.includes(requiredPermission)) {
    return true;
  }

  // 6. 1-to-1 legacy alias check for the requested permission
  const legacyToModernMap = {
    verification: "vendors",
    qc: "approvals",
    finance: "payments",
    support: "disputes",
  };

  const modernTarget = legacyToModernMap[requiredPermission];
  if (modernTarget && permissions.includes(modernTarget)) {
    return true;
  }

  // 7. Fallback only if permissions were NEVER initialized on the admin object
  if (!admin.permissions && ROLE_DEFAULT_PERMISSIONS[admin.role]) {
    const roleDefaults = ROLE_DEFAULT_PERMISSIONS[admin.role];
    if (roleDefaults.includes("all") || roleDefaults.includes(requiredPermission)) {
      return true;
    }
    if (modernTarget && roleDefaults.includes(modernTarget)) {
      return true;
    }
  }

  return false;
};
