import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiFileText,
  FiDownload,
  FiCalendar,
  FiDollarSign,
  FiTrendingUp,
  FiAlertTriangle,
  FiPercent,
  FiCreditCard,
  FiUsers,
  FiRefreshCw,
  FiChevronDown,
  FiX,
  FiCheck
} from 'react-icons/fi';
import { getPaymentOverview, getPaymentDetailedReport } from '../../../../services/adminDashboardService';
import { useToast } from '../../../../hooks/useToast';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';

// Report Card Component
const ReportCard = ({ title, description, icon: Icon, color, status, onGenerate, loading }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      hover: 'hover:border-blue-500',
      hoverBg: 'group-hover:bg-blue-100',
      btn: 'text-blue-600 hover:text-blue-800'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      hover: 'hover:border-green-500',
      hoverBg: 'group-hover:bg-green-100',
      btn: 'text-green-600 hover:text-green-800'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      hover: 'hover:border-purple-500',
      hoverBg: 'group-hover:bg-purple-100',
      btn: 'text-purple-600 hover:text-purple-800'
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      hover: 'hover:border-orange-500',
      hoverBg: 'group-hover:bg-orange-100',
      btn: 'text-orange-600 hover:text-orange-800'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      hover: 'hover:border-red-500',
      hoverBg: 'group-hover:bg-red-100',
      btn: 'text-red-600 hover:text-red-800'
    },
    teal: {
      bg: 'bg-teal-50',
      text: 'text-teal-600',
      hover: 'hover:border-teal-500',
      hoverBg: 'group-hover:bg-teal-100',
      btn: 'text-teal-600 hover:text-teal-800'
    }
  };

  const classes = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`border border-gray-200 rounded-xl p-5 ${classes.hover} transition-all cursor-pointer group hover:shadow-md bg-white`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 ${classes.bg} ${classes.text} rounded-xl ${classes.hoverBg} transition-colors`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className={`${status === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} text-xs px-2.5 py-1 rounded-full font-medium`}>
          {status === 'available' ? 'Ready' : 'Beta'}
        </span>
      </div>
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{description}</p>
      <button
        onClick={(e) => { e.stopPropagation(); onGenerate(); }}
        disabled={loading}
        className={`${classes.btn} text-sm font-medium flex items-center disabled:opacity-50 transition-colors`}
      >
        {loading ? (
          <FiRefreshCw className="mr-1.5 animate-spin" />
        ) : (
          <FiDownload className="mr-1.5" />
        )}
        {loading ? 'Generating...' : 'Download CSV'}
      </button>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, subtitle, icon: Icon, color, trend }) => {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
};

// Data Table Component
const DataTable = ({ data, columns, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FiFileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p>No data available for the selected period</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col, idx) => (
              <th key={idx} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.slice(0, 20).map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50 transition-colors">
              {columns.map((col, cidx) => (
                <td key={cidx} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 20 && (
        <div className="text-center py-3 text-sm text-gray-500 bg-gray-50 border-t">
          Showing 20 of {data.length} records. Download CSV for full data.
        </div>
      )}
    </div>
  );
};

export default function PaymentReport() {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const [activeReport, setActiveReport] = useState('transactions');
  const [reportData, setReportData] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(null);
  const toast = useToast();

  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Fetch Overview Stats
  useEffect(() => {
    fetchOverview();
  }, [startDate, endDate]);

  // Fetch Report Data when tab changes
  useEffect(() => {
    fetchReportData();
  }, [activeReport, startDate, endDate]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await getPaymentOverview(startDate, endDate);
      if (response.success) {
        setOverview(response.data.overview);
      }
    } catch (error) {
      console.error('Failed to fetch overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportData = async () => {
    try {
      setReportLoading(true);
      let endpoint = '';
      switch (activeReport) {
        case 'transactions':
          endpoint = '/admin/payments/reports';
          break;
        case 'gst':
          endpoint = '/admin/payments/reports/gst';
          break;
        case 'tds':
          endpoint = '/admin/payments/reports/tds';
          break;
        case 'cod':
          endpoint = '/admin/payments/reports/cod';
          break;
        default:
          endpoint = '/admin/payments/reports';
      }

      const response = await getPaymentDetailedReport(endpoint, { startDate, endDate });
      if (response.success) {
        setReportData(response.data || []);
        setReportSummary(response.summary || response.totals || null);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
      toast.showError('Failed to load report data');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportCsv = async (reportType) => {
    try {
      setDownloadingReport(reportType);

      // Simple CSV generation from local data if available, 
      // or we can invoke a "format=csv" on the backend if implemented.
      // For now, let's trigger the download using JSON to CSV on client side for immediate result.

      const dataToExport = reportData;
      if (!dataToExport || dataToExport.length === 0) {
        toast.showWarning("No data to export");
        return;
      }

      const columns = getColumns(reportType);
      const headers = columns.map(c => c.header).join(',');
      const rows = dataToExport.map(row =>
        columns.map(col => {
          const val = row[col.key];
          return `"${val === undefined || val === null ? '' : val}"`;
        }).join(',')
      ).join('\n');

      const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${reportType}_report_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.showSuccess('Report exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.showError('Failed to export report');
    } finally {
      setDownloadingReport(null);
    }
  };

  const reports = [
    {
      id: 'transactions',
      title: 'Transaction Report',
      description: 'All payment transactions with booking details, amounts, and payment methods.',
      icon: FiCreditCard,
      color: 'blue',
      status: 'available'
    },
    {
      id: 'gst',
      title: 'GSTR-1 Sales Report',
      description: 'GST compliant sales report with CGST, SGST breakdown for filing returns.',
      icon: FiPercent,
      color: 'green',
      status: 'available'
    },
    {
      id: 'tds',
      title: 'TDS Report (194-O)',
      description: 'E-commerce TDS liability report based on 1% rate on gross sales.',
      icon: FiUsers,
      color: 'purple',
      status: 'available'
    },
    {
      id: 'cod',
      title: 'Cash Collected Analytics',
      description: 'Track cash collected vs commission owed. (Placeholder for future use)',
      icon: FiAlertTriangle,
      color: 'orange',
      status: 'beta'
    }
  ];

  const getColumns = (type = activeReport) => {
    switch (type) {
      case 'transactions':
        return [
          { key: 'date', header: 'Date', render: (val) => val ? new Date(val).toLocaleDateString('en-IN') : '-' },
          { key: 'bookingNumber', header: 'Booking ID' },
          { key: 'service', header: 'Service' },
          { key: 'customer', header: 'Customer' },
          { key: 'vendor', header: 'Vendor' },
          { key: 'amount', header: 'Amount', render: (val) => `₹${(val || 0).toLocaleString('en-IN')}` },
          { key: 'platformFee', header: 'Platform Fee', render: (val) => `₹${(val || 0).toLocaleString('en-IN')}` },
          { key: 'paymentMethod', header: 'Method' },
          {
            key: 'bookingStatus', header: 'Status', render: (val) => (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${val === 'COMPLETED' || val === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                val === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{val}</span>
            )
          }
        ];
      case 'gst':
        return [
          { key: 'invoiceDate', header: 'Date' },
          { key: 'invoiceNumber', header: 'Invoice No.' },
          { key: 'customerName', header: 'Customer' },
          { key: 'placeOfSupply', header: 'State' },
          { key: 'hsnSac', header: 'HSN/SAC' },
          { key: 'taxableValue', header: 'Taxable Val', render: (val) => `₹${(val || 0).toLocaleString('en-IN')}` },
          { key: 'gstRate', header: 'Rate' },
          { key: 'totalTax', header: 'Tax', render: (val) => `₹${(val || 0).toLocaleString('en-IN')}` },
          { key: 'invoiceValue', header: 'Total', render: (val) => `₹${(val || 0).toLocaleString('en-IN')}` }
        ];
      case 'tds':
        return [
          { key: 'vendorName', header: 'Vendor' },
          { key: 'panNumber', header: 'PAN' },
          { key: 'grossSales', header: 'Gross Sales', render: (val) => `₹${(val || 0).toLocaleString('en-IN')}` },
          { key: 'tdsRate', header: 'Rate (%)', render: (val) => `${val}%` },
          { key: 'tdsAmount', header: 'TDS Amt', render: (val) => `₹${(val || 0).toLocaleString('en-IN')}` },
          { key: 'bookingCount', header: 'Bookings' }
        ];
      case 'cod':
        return [
          { key: 'vendorName', header: 'Vendor' },
          { key: 'totalCashCollected', header: 'Collected', render: (val) => `₹${(val || 0).toLocaleString('en-IN')}` }
        ];
      default:
        return [];
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-10"
    >
      {/* Header Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="User Payments"
          value={`₹${(overview?.totalFromUsers?.amount || 0).toLocaleString('en-IN')}`}
          subtitle={`${overview?.totalFromUsers?.count || 0} Successful`}
          icon={FiTrendingUp}
          color="blue"
        />
        <StatsCard
          title="Admin Profit"
          value={`₹${(overview?.totalAdminRevenue?.amount || 0).toLocaleString('en-IN')}`}
          subtitle="Net Earnings"
          icon={FiDollarSign}
          color="green"
        />
        <StatsCard
          title="Pending Vendors"
          value={`₹${(overview?.pendingToVendors?.amount || 0).toLocaleString('en-IN')}`}
          subtitle="Awaiting Settlement"
          icon={FiAlertTriangle}
          color="orange"
        />
        <StatsCard
          title="Taxes Accrued"
          value={`₹${(reportSummary?.totalTax || 0).toLocaleString('en-IN')}`}
          subtitle="Estimated GST"
          icon={FiPercent}
          color="purple"
        />
      </div>

      {/* Control Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 font-outfit">Financial Audits</h2>
            <p className="text-sm text-gray-400 font-medium">Generate and export compliance reports</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 p-1.5 bg-gray-50 border border-gray-200 rounded-2xl">
            <div className="flex items-center gap-2 px-3">
              <FiCalendar className="text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-0 bg-transparent text-sm focus:ring-0 text-gray-700 font-bold outline-none"
              />
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-2 px-3">
              <FiCalendar className="text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-0 bg-transparent text-sm focus:ring-0 text-gray-700 font-bold outline-none"
              />
            </div>
            <button
              onClick={() => { fetchOverview(); fetchReportData(); }}
              className="ml-2 p-2.5 bg-white rounded-xl hover:bg-gray-100 transition-all border border-gray-200 shadow-sm"
            >
              <FiRefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              {...report}
              loading={downloadingReport === report.id}
              onGenerate={() => handleExportCsv(report.id)}
            />
          ))}
        </div>
      </div>

      {/* Detailed Report View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-100 bg-gray-50/50">
          <div className="flex overflow-x-auto no-scrollbar">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`flex items-center gap-2 px-8 py-5 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${activeReport === report.id
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
              >
                <report.icon className="w-4 h-4" />
                {report.title}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Mini Bar */}
        {reportSummary && (
          <div className="p-5 bg-blue-50/30 border-b border-gray-50">
            <div className="flex flex-wrap gap-x-12 gap-y-4">
              {activeReport === 'gst' && (
                <>
                  <SummaryItem label="Taxable Value" value={`₹${(reportSummary.totalTaxableValue || 0).toLocaleString()}`} />
                  <SummaryItem label="CGST (9%)" value={`₹${(reportSummary.totalCGST || 0).toLocaleString()}`} />
                  <SummaryItem label="SGST (9%)" value={`₹${(reportSummary.totalSGST || 0).toLocaleString()}`} />
                  <SummaryItem label="Total Tax" value={`₹${(reportSummary.totalTax || 0).toLocaleString()}`} color="text-green-600" />
                </>
              )}
              {activeReport === 'transactions' && (
                <>
                  <SummaryItem label="Gross Amount" value={`₹${(reportSummary.totalAmount || 0).toLocaleString()}`} />
                  <SummaryItem label="Platform Share" value={`₹${(reportSummary.totalCommission || 0).toLocaleString()}`} color="text-blue-600" />
                  <SummaryItem label="Vendor Payouts" value={`₹${(reportSummary.totalVendorEarnings || 0).toLocaleString()}`} />
                </>
              )}
              {activeReport === 'tds' && (
                <>
                  <SummaryItem label="Gross Sales" value={`₹${(reportSummary.totalGrossSales || 0).toLocaleString()}`} />
                  <SummaryItem label="TDS (1%)" value={`₹${(reportSummary.totalTDS || 0).toLocaleString()}`} color="text-purple-600" />
                  <SummaryItem label="Partners" value={reportSummary.vendorCount || 0} />
                </>
              )}
            </div>
          </div>
        )}

        <DataTable
          data={reportData}
          columns={getColumns()}
          loading={reportLoading}
        />

        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400">
            Previewing up to 20 records. Download CSV for full audit trail.
          </span>
          <button
            onClick={() => handleExportCsv(activeReport)}
            disabled={reportLoading || reportData.length === 0}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all flex items-center shadow-lg shadow-gray-200 disabled:opacity-50"
          >
            <FiDownload className="mr-2" />
            Full Export (CSV)
          </button>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
            <FiAlertTriangle className="w-5 h-5 flex-shrink-0" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 font-outfit">Indian Tax Compliance Audit</h4>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              <p className="text-xs font-medium text-amber-800 leading-relaxed">• <b>GSTR-1</b>: Monthly sales returns generated based on successful Razorpay collections.</p>
              <p className="text-xs font-medium text-amber-800 leading-relaxed">• <b>TDS 194-O</b>: 1% TDS calculated on vendor platform sales for compliance.</p>
              <p className="text-xs font-medium text-amber-800 leading-relaxed">• <b>HSN/SAC 9988</b>: Services classified under Professional/Technical business codes.</p>
              <p className="text-xs font-medium text-amber-800 leading-relaxed">• Data is provided for internal audit; consult a professional for official filing.</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SummaryItem({ label, value, color = "text-gray-900" }) {
  return (
    <div>
      <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={`text-lg font-black ${color}`}>{value}</span>
    </div>
  );
}
