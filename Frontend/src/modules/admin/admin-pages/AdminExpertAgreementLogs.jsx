import { useState, useEffect } from 'react';
import {
    IoShieldCheckmarkOutline,
    IoSearchOutline,
    IoRefreshOutline,
    IoPhonePortraitOutline,
    IoGlobeOutline,
    IoChevronBackOutline,
    IoChevronForwardOutline,
    IoDocumentTextOutline,
    IoRibbonOutline,
    IoCheckmarkCircleOutline,
    IoCreateOutline,
    IoCloseOutline,
    IoAddCircleOutline,
    IoTrashOutline
} from 'react-icons/io5';
import api from '../../../services/api';
import { useToast } from '../../../hooks/useToast';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

const DEFAULT_10_CLAUSES = [
    { title: 'Agreement Review', text: 'I have read and understood this Agreement.' },
    { title: 'Professional Standards', text: 'I will provide groundwater survey services professionally, ethically, and in compliance with applicable laws.' },
    { title: 'Sole Professional Responsibility', text: 'I am solely responsible for my surveys, technical opinions, recommendations, reports, and professional conduct.' },
    { title: 'Technology Platform Disclaimer', text: 'I understand that Jaladhaara is only a technology platform connecting Customers with independent Experts and is not responsible for my professional services or survey outcomes.' },
    { title: 'Privacy & Confidentiality', text: 'I will maintain the confidentiality of customer information and use it only for the booked service.' },
    { title: 'No Off-Platform Solicitation', text: 'I will not solicit customers outside the platform or accept unauthorized off-platform payments.' },
    { title: 'Groundwater Availability Disclaimer', text: 'I understand that groundwater occurrence depends on natural geological conditions, and I will not guarantee groundwater availability, borewell success, water yield, or water quality.' },
    { title: 'Platform Policies Compliance', text: 'I agree to comply with Jaladhaara\'s Terms & Conditions, Privacy Policy, Booking & Cancellation Policy, Refund Policy, and all other applicable platform policies.' },
    { title: 'Account Suspension & Termination', text: 'I understand that Jaladhaara may suspend or terminate my account if I violate this Agreement or any platform policy.' },
    { title: 'Governing Law & Jurisdiction', text: 'This Agreement shall be governed by the laws of India, and any dispute shall be subject to the exclusive jurisdiction of the competent courts at Hyderabad, Telangana.' }
];

export default function AdminExpertAgreementLogs() {
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 15,
        pages: 1
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVersion, setSelectedVersion] = useState('');
    const [availableVersions, setAvailableVersions] = useState([]);

    // Modal & Editing States
    const [showEditModal, setShowEditModal] = useState(false);
    const [savingAgreement, setSavingAgreement] = useState(false);
    const [currentVersion, setCurrentVersion] = useState('v1.0');
    const [newVersionInput, setNewVersionInput] = useState('v1.1');
    const [clausesList, setClausesList] = useState(DEFAULT_10_CLAUSES);
    const [headerTitle, setHeaderTitle] = useState('Jaladhaara Expert Onboarding Agreement');
    const [introText, setIntroText] = useState('By selecting "I Agree & Activate Account", I confirm that:');

    const parseHtmlToClauses = (html) => {
        if (!html) return DEFAULT_10_CLAUSES;
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const items = doc.querySelectorAll('ol li');
            
            if (items && items.length > 0) {
                const parsed = [];
                items.forEach((item, idx) => {
                    const strong = item.querySelector('strong');
                    let title = `Clause ${idx + 1}`;
                    let text = item.textContent || '';
                    if (strong) {
                        title = strong.textContent.replace(/:$/, '').trim();
                        text = text.replace(strong.textContent, '').trim();
                    }
                    parsed.push({ id: idx + 1, title, text });
                });
                return parsed.length > 0 ? parsed : DEFAULT_10_CLAUSES;
            }
        } catch (err) {
            console.error('Error parsing agreement HTML:', err);
        }
        return DEFAULT_10_CLAUSES;
    };

    const buildHtmlFromClauses = (title, intro, clauses) => {
        const itemsHtml = clauses
            .map(c => `      <li><strong>${c.title}:</strong> ${c.text}</li>`)
            .join('\n');

        return `<p><strong>${title}</strong></p>\n<p>${intro}</p>\n<ol>\n${itemsHtml}\n</ol>\n<p><strong>Declaration:</strong> I declare that all information and documents submitted by me are true and correct. I voluntarily accept this Agreement and agree to be bound by its terms.</p>`;
    };

    const bumpVersionString = (ver) => {
        if (!ver) return 'v1.1';
        const match = ver.match(/v?(\d+)\.(\d+)/i);
        if (match) {
            const major = parseInt(match[1], 10);
            const minor = parseInt(match[2], 10) + 1;
            return `v${major}.${minor}`;
        }
        return 'v1.1';
    };

    const fetchCurrentAgreement = async () => {
        try {
            const response = await api.get('/vendors/agreement/status');
            if (response.data?.success && response.data?.data) {
                const { activeVersion, agreementText } = response.data.data;
                if (activeVersion) {
                    setCurrentVersion(activeVersion);
                    setNewVersionInput(bumpVersionString(activeVersion));
                }
                if (agreementText) {
                    setClausesList(parseHtmlToClauses(agreementText));
                }
            }
        } catch (err) {
            console.error('Error fetching current agreement:', err);
        }
    };

    const fetchLogs = async (targetPage = 1) => {
        try {
            setLoading(true);
            const response = await api.get('/vendors/agreement/admin/logs', {
                params: {
                    page: targetPage,
                    limit: pagination.limit,
                    search: searchQuery,
                    version: selectedVersion
                }
            });

            if (response.data?.success && response.data?.data) {
                setLogs(response.data.data.logs || []);
                setAvailableVersions(response.data.data.availableVersions || []);
                setPagination(response.data.data.pagination || {
                    total: 0,
                    page: targetPage,
                    limit: 15,
                    pages: 1
                });
            }
        } catch (err) {
            console.error('Error fetching admin expert agreement logs:', err);
            toast.showError('Failed to load Expert agreement logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
        fetchCurrentAgreement();
    }, [selectedVersion]);

    const handleOpenEditModal = () => {
        fetchCurrentAgreement();
        setShowEditModal(true);
    };

    const handleClauseChange = (index, field, value) => {
        const updated = [...clausesList];
        updated[index] = { ...updated[index], [field]: value };
        setClausesList(updated);
    };

    const handleAddClause = () => {
        const newId = clausesList.length + 1;
        const updated = [...clausesList, { id: newId, title: `Clause ${newId}`, text: '' }];
        setClausesList(updated);
        toast.showSuccess(`New clause added (Clause ${newId})`);
    };

    const handleRemoveClause = (index) => {
        if (clausesList.length <= 1) {
            toast.showError('Agreement must contain at least one clause.');
            return;
        }
        const removedTitle = clausesList[index]?.title || `Clause ${index + 1}`;
        const updated = clausesList.filter((_, idx) => idx !== index);
        setClausesList(updated);
        toast.showInfo(`Removed "${removedTitle}"`);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchLogs(1);
    };

    const handleUpdateAgreementSubmit = async (e) => {
        e.preventDefault();

        const finalHtml = buildHtmlFromClauses(headerTitle, introText, clausesList);

        if (!newVersionInput.trim() || !finalHtml.trim()) {
            toast.showError('Please provide both a version identifier and valid agreement clauses.');
            return;
        }

        try {
            setSavingAgreement(true);
            const response = await api.put('/vendors/agreement/admin/update', {
                agreementText: finalHtml,
                newVersion: newVersionInput.trim()
            });

            if (response.data?.success) {
                toast.showSuccess(`Expert Onboarding Agreement updated to version ${newVersionInput}!`);
                setCurrentVersion(newVersionInput.trim());
                setShowEditModal(false);
                fetchLogs(1);
            } else {
                toast.showError(response.data?.message || 'Failed to update agreement');
            }
        } catch (err) {
            console.error('Error publishing expert agreement update:', err);
            toast.showError(err.response?.data?.message || 'Failed to update agreement');
        } finally {
            setSavingAgreement(false);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            
            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <IoShieldCheckmarkOutline className="text-blue-600 text-2xl sm:text-3xl" />
                        <span>Expert Agreement Audit Logs</span>
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        Legally binding click-wrap consent records captured for activated Jaladhaara Experts
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleOpenEditModal}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 active:scale-95"
                    >
                        <IoCreateOutline className="text-base" />
                        <span>Edit Expert Agreement &amp; Version</span>
                    </button>

                    <button
                        onClick={() => fetchLogs(pagination.page)}
                        className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                        <IoRefreshOutline className="text-base" />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
                    <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by Expert Name, ID, Phone or IP..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
                    />
                </form>

                <div className="flex items-center gap-3">
                    {/* Version Filter */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                        <span>Version:</span>
                        <select
                            value={selectedVersion}
                            onChange={(e) => setSelectedVersion(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value="">All Versions</option>
                            {availableVersions.map((v) => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                        </select>
                    </div>

                    <div className="text-xs text-slate-500 font-bold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                        Total Records: <strong className="text-blue-600">{pagination.total}</strong>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <LoadingSpinner />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <IoDocumentTextOutline className="text-4xl text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold">No Expert agreement acceptance records found</p>
                        <p className="text-xs text-slate-400 mt-1">Records will appear here as verified Experts accept their onboarding agreement.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                                    <th className="py-3.5 px-4">Expert Details</th>
                                    <th className="py-3.5 px-4">Verified Expert ID</th>
                                    <th className="py-3.5 px-4">Mobile Number</th>
                                    <th className="py-3.5 px-4">Agreement Version</th>
                                    <th className="py-3.5 px-4">Acceptance Date &amp; Time</th>
                                    <th className="py-3.5 px-4">IP Address</th>
                                    <th className="py-3.5 px-4">Device &amp; App</th>
                                    <th className="py-3.5 px-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                {logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                                        
                                        {/* Expert Name */}
                                        <td className="py-3.5 px-4">
                                            <div className="font-extrabold text-slate-900">{log.expertName}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">
                                                Vendor Ref: {log.vendor?._id || log.vendor || 'N/A'}
                                            </div>
                                        </td>

                                        {/* Expert ID */}
                                        <td className="py-3.5 px-4">
                                            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-mono font-black border border-blue-200 text-xs flex items-center gap-1 w-fit">
                                                <IoRibbonOutline className="text-amber-500" />
                                                {log.expertId}
                                            </span>
                                        </td>

                                        {/* Mobile Number */}
                                        <td className="py-3.5 px-4 font-bold text-slate-800">
                                            <div className="flex items-center gap-1.5">
                                                <IoPhonePortraitOutline className="text-slate-400" />
                                                {log.mobileNumber}
                                            </div>
                                        </td>

                                        {/* Version */}
                                        <td className="py-3.5 px-4 font-black text-indigo-600 font-mono">
                                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100">
                                                {log.agreementVersion}
                                            </span>
                                        </td>

                                        {/* Timestamp */}
                                        <td className="py-3.5 px-4 font-medium text-slate-600">
                                            {new Date(log.acceptedAt || log.createdAt).toLocaleString('en-IN', {
                                                dateStyle: 'medium',
                                                timeStyle: 'short'
                                            })}
                                        </td>

                                        {/* IP Address */}
                                        <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                                            <div className="flex items-center gap-1">
                                                <IoGlobeOutline className="text-slate-400" />
                                                {log.ipAddress}
                                            </div>
                                        </td>

                                        {/* Device & App */}
                                        <td className="py-3.5 px-4 max-w-[180px] truncate text-[11px] text-slate-500 font-mono" title={log.deviceId}>
                                            <div className="font-semibold text-slate-700 truncate">{log.deviceId || 'Browser / Native App'}</div>
                                            <div className="text-[10px] text-slate-400">App v{log.appVersion || '1.0.0'}</div>
                                        </td>

                                        {/* Status */}
                                        <td className="py-3.5 px-4 text-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                                                <IoCheckmarkCircleOutline className="text-xs" />
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {pagination.pages > 1 && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-semibold">
                            Page {pagination.page} of {pagination.pages}
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => fetchLogs(pagination.page - 1)}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                            >
                                <IoChevronBackOutline /> Prev
                            </button>

                            <button
                                disabled={pagination.page >= pagination.pages}
                                onClick={() => fetchLogs(pagination.page + 1)}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                            >
                                Next <IoChevronForwardOutline />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Admin Expert Agreement Editor Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
                        
                        {/* Modal Header */}
                        <div className="bg-slate-900 p-5 text-white flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                                    <span>Update Expert Onboarding Agreement</span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500 text-white text-xs font-bold font-mono">
                                        Current: {currentVersion}
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Edit the expert clauses in plain English below. Publishing a new version will prompt experts to re-accept.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            >
                                <IoCloseOutline className="text-2xl" />
                            </button>
                        </div>

                        {/* Modal Form Body */}
                        <form onSubmit={handleUpdateAgreementSubmit} className="p-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                            
                            {/* Version Identifier Input */}
                            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-blue-900">
                                        Publish New Version Identifier
                                    </label>
                                    <p className="text-[11px] text-blue-700/80">
                                        Bump version string (e.g., from {currentVersion} to {bumpVersionString(currentVersion)}) to require re-acceptance.
                                    </p>
                                </div>
                                <input
                                    type="text"
                                    value={newVersionInput}
                                    onChange={(e) => setNewVersionInput(e.target.value)}
                                    placeholder="e.g. v1.1"
                                    className="w-full sm:w-44 px-3.5 py-2 bg-white border border-blue-200 rounded-xl text-sm font-black font-mono text-blue-700 focus:outline-none focus:border-blue-500 shadow-2xs"
                                    required
                                />
                            </div>

                            {/* Clauses Form Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                                        Expert Agreement Clauses ({clausesList.length} Items)
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={handleAddClause}
                                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                        <IoAddCircleOutline className="text-base" />
                                        <span>Add New Clause</span>
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {clausesList.map((clause, idx) => (
                                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 hover:border-slate-300 transition-colors">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={clause.title}
                                                    onChange={(e) => handleClauseChange(idx, 'title', e.target.value)}
                                                    placeholder={`Clause ${idx + 1} Title`}
                                                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-blue-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveClause(idx)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                                                    title="Delete Clause"
                                                >
                                                    <IoTrashOutline className="text-lg" />
                                                </button>
                                            </div>

                                            <textarea
                                                value={clause.text}
                                                onChange={(e) => handleClauseChange(idx, 'text', e.target.value)}
                                                rows={2}
                                                placeholder="Enter clause description text in plain English..."
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed focus:outline-none focus:border-blue-500 font-medium"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                                <strong>Notice:</strong> Publishing version <strong>{newVersionInput}</strong> will immediately prompt all registered Experts to read and accept the updated terms.
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={savingAgreement}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                                >
                                    {savingAgreement ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Publishing...</span>
                                        </>
                                    ) : (
                                        <span>Publish &amp; Update Expert Agreement</span>
                                    )}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}

        </div>
    );
}
