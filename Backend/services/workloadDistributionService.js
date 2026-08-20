const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Settings = require('../models/Settings');
const { ROLES } = require('../utils/constants');

/**
 * Map department to corresponding Admin Role
 */
const DEPARTMENT_ROLE_MAP = {
  VERIFICATION: [ROLES.EXPERT_VERIFICATION_ADMIN, ROLES.VERIFIER_ADMIN],
  OPERATIONS: [ROLES.OPERATIONS_ADMIN],
  FINANCE: [ROLES.FINANCE_ADMIN],
  SUPPORT: [ROLES.SUPPORT_ADMIN],
  QUALITY_CONTROL: [ROLES.QC_ADMIN]
};

/**
 * Map department to auto-assign settings key
 */
const DEPARTMENT_SETTINGS_KEY = {
  VERIFICATION: 'AUTO_ASSIGN_VERIFICATION',
  OPERATIONS: 'AUTO_ASSIGN_OPERATIONS',
  FINANCE: 'AUTO_ASSIGN_FINANCE',
  SUPPORT: 'AUTO_ASSIGN_SUPPORT',
  QUALITY_CONTROL: 'AUTO_ASSIGN_QC'
};

/**
 * Check if department auto-assignment is enabled in system settings
 * @param {string} department
 * @returns {Promise<boolean>}
 */
const isDepartmentAutoAssignEnabled = async (department) => {
  try {
    const key = DEPARTMENT_SETTINGS_KEY[department];
    if (!key) return true;

    const setting = await Settings.findOne({ key });
    if (!setting) return true; // Default to enabled if not explicitly configured

    return setting.value === true || setting.value === 'true';
  } catch (error) {
    console.error(`Error checking auto-assign settings for ${department}:`, error);
    return true; // Fallback to enabled
  }
};

/**
 * Select the optimal admin using Least-Active-Load + LRU tie-break algorithm
 * @param {string} department
 * @returns {Promise<Admin|null>}
 */
const findBestAvailableAdmin = async (department) => {
  try {
    const allowedRoles = DEPARTMENT_ROLE_MAP[department] || [];
    if (allowedRoles.length === 0) return null;

    // Find all active, on-duty admins for this department role
    const candidates = await Admin.find({
      isActive: true,
      isAvailableForAssignment: true,
      role: { $in: allowedRoles }
    })
      .sort({
        activeTicketsCount: 1, // 1. Least active load first
        lastAssignedAt: 1,     // 2. Oldest assignment timestamp (LRU)
        createdAt: 1           // 3. Seniority fallback
      })
      .limit(1);

    if (candidates && candidates.length > 0) {
      return candidates[0];
    }

    return null;
  } catch (error) {
    console.error(`Error finding best admin for department ${department}:`, error);
    return null;
  }
};

/**
 * Auto-assign a request to an available admin if enabled
 * @param {Object} params
 * @param {string} params.department - Target department
 * @param {string} params.statusAtAssignment - Initial status of the request
 * @param {string} [params.notes] - Optional context notes
 * @returns {Promise<{ assignedTo: ObjectId|null, auditRecord: Object|null }>}
 */
const autoAssignRequest = async ({ department, statusAtAssignment = 'PENDING', notes = '' }) => {
  try {
    const isEnabled = await isDepartmentAutoAssignEnabled(department);
    if (!isEnabled) {
      return { assignedTo: null, auditRecord: null };
    }

    const assignedAdmin = await findBestAvailableAdmin(department);
    if (!assignedAdmin) {
      return { assignedTo: null, auditRecord: null };
    }

    // Increment admin's active load counter and stamp assignment time
    await Admin.findByIdAndUpdate(assignedAdmin._id, {
      $inc: { activeTicketsCount: 1 },
      $set: { lastAssignedAt: new Date() }
    });

    const auditRecord = {
      assignedTo: assignedAdmin._id,
      assignedToName: assignedAdmin.name,
      assignedToRole: assignedAdmin.role,
      assignedAt: new Date(),
      reassignedBy: null,
      reassignedByName: 'SYSTEM_AUTO_ASSIGN',
      reassignmentReason: null,
      statusAtAssignment,
      notes: notes || 'Automated least-load assignment'
    };

    return {
      assignedTo: assignedAdmin._id,
      auditRecord
    };
  } catch (error) {
    console.error('Error during request auto-assignment:', error);
    return { assignedTo: null, auditRecord: null };
  }
};

/**
 * Manually reassign a request by Super Admin with full audit tracking
 * @param {Object} params
 * @param {mongoose.Model} params.model - Mongoose Model of the entity
 * @param {string|ObjectId} params.entityId - ID of the request entity
 * @param {string|ObjectId} params.newAdminId - Target Admin ID
 * @param {Object} params.reassignedByAdmin - Logged-in Super Admin user
 * @param {string} params.reason - Reassignment reason
 * @param {string} [params.notes] - Additional notes
 */
const manualReassign = async ({ model, entityId, newAdminId, reassignedByAdmin, reason, notes = '' }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const entity = await model.findById(entityId).session(session);
    if (!entity) {
      throw new Error('Request entity not found');
    }

    const newAdmin = await Admin.findById(newAdminId).session(session);
    if (!newAdmin || !newAdmin.isActive) {
      throw new Error('Target admin not found or is currently inactive');
    }

    const oldAdminId = entity.assignedTo;

    // Build audit record
    const auditRecord = {
      assignedTo: newAdmin._id,
      assignedToName: newAdmin.name,
      assignedToRole: newAdmin.role,
      assignedAt: new Date(),
      reassignedBy: reassignedByAdmin._id || reassignedByAdmin.id,
      reassignedByName: reassignedByAdmin.name || 'Super Admin',
      reassignmentReason: reason || 'Manual workload reassignment by Super Admin',
      statusAtAssignment: entity.status || 'IN_PROGRESS',
      notes: notes || ''
    };

    // Update entity
    entity.assignedTo = newAdmin._id;
    if (!entity.assignmentHistory) {
      entity.assignmentHistory = [];
    }
    entity.assignmentHistory.push(auditRecord);
    await entity.save({ session });

    // Decrement previous admin's active load (if exists and > 0)
    if (oldAdminId && oldAdminId.toString() !== newAdmin._id.toString()) {
      await Admin.updateOne(
        { _id: oldAdminId, activeTicketsCount: { $gt: 0 } },
        { $inc: { activeTicketsCount: -1 } },
        { session }
      );
    }

    // Increment new admin's active load
    await Admin.updateOne(
      { _id: newAdmin._id },
      {
        $inc: { activeTicketsCount: 1 },
        $set: { lastAssignedAt: new Date() }
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message: `Request successfully reassigned to ${newAdmin.name}`,
      entity,
      auditRecord
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Decrement active workload counter when a ticket/request is resolved/completed
 * @param {string|ObjectId} adminId
 */
const decrementActiveWorkload = async (adminId) => {
  try {
    if (!adminId) return;
    await Admin.updateOne(
      { _id: adminId, activeTicketsCount: { $gt: 0 } },
      { $inc: { activeTicketsCount: -1 } }
    );
  } catch (error) {
    console.error('Error decrementing admin active workload:', error);
  }
};

module.exports = {
  DEPARTMENT_ROLE_MAP,
  DEPARTMENT_SETTINGS_KEY,
  isDepartmentAutoAssignEnabled,
  findBestAvailableAdmin,
  autoAssignRequest,
  manualReassign,
  decrementActiveWorkload
};
