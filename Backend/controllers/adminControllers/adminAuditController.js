const AdminActivityLog = require('../../models/AdminActivityLog');
const Admin = require('../../models/Admin');

/**
 * Get Paginated & Filtered Admin Activity Logs
 */
const getAdminActivityLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      module: selectedModule,
      adminId,
      action,
      startDate,
      endDate
    } = req.query;

    const query = {};

    // Filter by category / module
    if (selectedModule && selectedModule !== 'ALL') {
      query.module = selectedModule;
    }

    // Filter by specific staff member
    if (adminId && adminId !== 'ALL') {
      query.adminId = adminId;
    }

    // Filter by specific action
    if (action && action !== 'ALL') {
      query.action = action;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Full text search across targetLabel, adminName, adminEmail, notes
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { adminName: searchRegex },
        { adminEmail: searchRegex },
        { targetLabel: searchRegex },
        { targetId: searchRegex },
        { action: searchRegex },
        { notes: searchRegex }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AdminActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AdminActivityLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin activity logs',
      error: error.message
    });
  }
};

/**
 * Get Activity Logs KPI Statistics
 */
const getAuditLogStats = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalCount,
      last24hCount,
      moduleAgg,
      activeAdmins
    ] = await Promise.all([
      AdminActivityLog.countDocuments(),
      AdminActivityLog.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      AdminActivityLog.aggregate([
        { $group: { _id: '$module', count: { $sum: 1 } } }
      ]),
      Admin.find({ isActive: { $ne: false } }).select('_id name email role').lean()
    ]);

    const moduleCounts = {
      OPERATIONS: 0,
      FINANCE: 0,
      QC: 0,
      VERIFICATION: 0,
      SUPPORT: 0,
      SECURITY: 0,
      SETTINGS: 0
    };

    moduleAgg.forEach((m) => {
      if (m._id) {
        moduleCounts[m._id] = m.count;
      }
    });

    res.json({
      success: true,
      data: {
        totalCount,
        last24hCount,
        moduleCounts,
        activeAdmins
      }
    });
  } catch (error) {
    console.error('Error fetching audit log stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit stats',
      error: error.message
    });
  }
};

/**
 * Get Specific Log Details
 */
const getAuditLogDetails = async (req, res) => {
  try {
    const { logId } = req.params;
    const log = await AdminActivityLog.findById(logId).lean();

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log entry not found'
      });
    }

    res.json({
      success: true,
      data: {
        log
      }
    });
  } catch (error) {
    console.error('Error fetching log details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch log details',
      error: error.message
    });
  }
};

module.exports = {
  getAdminActivityLogs,
  getAuditLogStats,
  getAuditLogDetails
};
