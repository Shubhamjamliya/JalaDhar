import { useState, useEffect } from 'react';
import {
    IoShieldCheckmarkOutline,
    IoSearchOutline,
    IoFilterOutline,
    IoRefreshOutline,
    IoCreateOutline,
    IoDocumentTextOutline,
    IoChevronBackOutline,
    IoChevronForwardOutline,
    IoCheckmarkCircleOutline,
    IoTimeOutline,
    IoPhonePortraitOutline,
    IoGlobeOutline,
    IoHardwareChipOutline,
    IoCloseOutline,
    IoCheckmarkOutline,
    IoListOutline,
    IoEyeOutline,
    IoCodeSlashOutline,
    IoAddCircleOutline,
    IoTrashOutline
} from 'react-icons/io5';
import api from '../../../services/api';
import { useToast } from '../../../hooks/useToast';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

const DEFAULT_CLAUSES_LIST = [
    { id: 1, title: "Platform Services", text: "Jaladhaara is a technology platform that enables Users to connect with independent Experts for groundwater survey services. Jaladhaara does not directly provide groundwater survey or borewell drilling services." },
    { id: 2, title: "User Responsibilities", text: "The User shall provide accurate information, ensure safe access to the survey location, cooperate with the Expert, and make payments through the Jaladhaara platform in accordance with the applicable policies." },
    { id: 3, title: "Expert Services", text: "Groundwater surveys are performed by independent Experts, who are solely responsible for their professional services, technical opinions, recommendations, and survey reports." },
    { id: 4, title: "Survey Scope & Disclaimer", text: "The survey is limited to identifying potential groundwater zones based on the Expert's professional assessment. Groundwater availability, borewell success, water yield, and water quality depend on natural geological conditions and cannot be guaranteed." },
    { id: 5, title: "Payments & Policies", text: "All bookings, payments, cancellations, refunds, rescheduling, and settlements shall be governed by Jaladhaara's applicable policies." },
    { id: 6, title: "User Conduct", text: "The User shall not misuse the platform, provide false information, engage in abusive or unlawful behaviour, or make unauthorized payments outside the Jaladhaara platform." },
    { id: 7, title: "Privacy & Confidentiality", text: "The User consents to the collection, processing, and use of personal information in accordance with Jaladhaara's Privacy Policy." },
    { id: 8, title: "Limitation of Liability", text: "Jaladhaara acts only as a technology platform and shall not be liable for the professional services provided by the Expert, borewell drilling outcomes, groundwater availability, property damage, financial loss, or any indirect or consequential damages arising from the use of the platform." },
    { id: 9, title: "Suspension & Termination", text: "Jaladhaara reserves the right to suspend or terminate any User account for violation of this Agreement, platform policies, or applicable laws." },
    { id: 10, title: "Intellectual Property", text: "All trademarks, logos, software, content, and other intellectual property associated with Jaladhaara are the exclusive property of Jaladhaara Groundwater Survey Pvt. Ltd. and may not be used without prior written permission." },
    { id: 11, title: "Amendments", text: "Jaladhaara may modify this Agreement or its policies from time to time. Continued use of the platform constitutes acceptance of the revised terms." },
    { id: 12, title: "Governing Law & Jurisdiction", text: "This Agreement shall be governed by the laws of India. Any dispute arising out of or relating to this Agreement or the use of the Jaladhaara platform shall be subject to the exclusive jurisdiction of the competent courts at Hyderabad, Telangana." },
    { id: 13, title: "Electronic Acceptance", text: "By clicking \"I Agree\", the User confirms that they have read, understood, and accepted this Agreement, the Terms & Conditions, Privacy Policy, Booking & Cancellation Policy, Refund Policy, No-Show Policy, and all other applicable Jaladhaara policies. This electronic acceptance shall have the same legal effect as a handwritten signature under applicable law." }
];

export default function AdminAgreementLogs() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
    const [availableVersions, setAvailableVersions] = useState([]);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVersion, setSelectedVersion] = useState('');

    // Edit Agreement Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editorTab, setEditorTab] = useState('form'); // 'form' | 'preview' | 'code'
    const [currentVersion, setCurrentVersion] = useState('v1.0.0');
    const [newVersionInput, setNewVersionInput] = useState('');
    
    // Structured Editor State
    const [headerTitle, setHeaderTitle] = useState('Jaladhaara User Agreement');
    const [introText, setIntroText] = useState('This User Agreement ("Agreement") is entered into between Jaladhaara Groundwater Survey Pvt. Ltd. ("Jaladhaara") and the registered User ("User"). By clicking "I Agree", the User accepts the following terms:');
    const [clausesList, setClausesList] = useState(DEFAULT_CLAUSES_LIST);
    
    // Raw HTML fallback state
    const [rawHtmlCode, setRawHtmlCode] = useState('');
    const [updatingAgreement, setUpdatingAgreement] = useState(false);

    const parseHtmlToClausesList = (html = '') => {
        if (!html || html.trim().length < 30) return DEFAULT_CLAUSES_LIST;

        const clauses = [];
        const liRegex = /<li>[\s\S]*?<\/li>/gi;
        const matches = html.match(liRegex);

        if (matches && matches.length > 0) {
            matches.forEach((li, idx) => {
                // Extract title inside <strong>...</strong>
                const titleMatch = li.match(/<strong>(.*?)(?::|<\/strong>)/i);
                let title = titleMatch ? titleMatch[1].replace(/^\d+\.\s*/, '').replace(/:$/, '').trim() : `Clause ${idx + 1}`;
                
                // Extract body text after title
                let text = li.replace(/<[^>]+>/g, '').trim();
                if (titleMatch) {
                    const titleText = titleMatch[0].replace(/<[^>]+>/g, '').trim();
                    text = text.replace(titleText, '').replace(/^:\s*/, '').trim();
                }

                clauses.push({
                    id: idx + 1,
                    title: title || `Clause ${idx + 1}`,
                    text: text || ''
                });
            });
            return clauses;
        }

        return DEFAULT_CLAUSES_LIST;
    };

    const buildHtmlFromClauses = (hTitle, iText, list) => {
        let html = `<p><strong>${hTitle || 'Jaladhaara User Agreement'}</strong></p>\n`;
        html += `<p>${iText || ''}</p>\n<ol>\n`;
        list.forEach((c, idx) => {
            html += `  <li><strong>${c.title || `Clause ${idx + 1}`}:</strong> ${c.text || ''}</li>\n`;
        });
        html += `</ol>`;
        return html;
    };

    const fetchLogs = async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: pagination.limit,
                ...(searchQuery ? { search: searchQuery } : {}),
                ...(selectedVersion ? { version: selectedVersion } : {})
            };

            const response = await api.get('/agreements/admin/logs', { params });

            if (response.data?.success) {
                setLogs(response.data.data.logs || []);
                setPagination(response.data.data.pagination || { page: 1, limit: 15, total: 0, pages: 1 });
                setAvailableVersions(response.data.data.availableVersions || []);
            } else {
                toast.showError(response.data?.message || 'Failed to fetch agreement logs');
            }
        } catch (err) {
            console.error('Error fetching admin agreement logs:', err);
            toast.showError(err.response?.data?.message || 'Error fetching agreement logs');
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentAgreement = async () => {
        try {
            const response = await api.get('/agreements/status');
            if (response.data?.success && response.data?.data) {
                const fetchedHtml = response.data.data.agreementText || '';
                const ver = response.data.data.activeVersion || 'v1.0.0';
                
                setCurrentVersion(ver);
                setNewVersionInput(bumpVersionString(ver));

                if (fetchedHtml && fetchedHtml.trim().length > 30) {
                    setRawHtmlCode(fetchedHtml);
                    setClausesList(parseHtmlToClausesList(fetchedHtml));
                } else {
                    setClausesList(DEFAULT_CLAUSES_LIST);
                    setRawHtmlCode(buildHtmlFromClauses(headerTitle, introText, DEFAULT_CLAUSES_LIST));
                }
            }
        } catch (err) {
            console.error('Error fetching current agreement:', err);
            setCurrentVersion('v1.0.0');
            setNewVersionInput('v1.0.1');
            setClausesList(DEFAULT_CLAUSES_LIST);
            setRawHtmlCode(buildHtmlFromClauses(headerTitle, introText, DEFAULT_CLAUSES_LIST));
        }
    };

    const bumpVersionString = (verStr = 'v1.0.0') => {
        const match = verStr.match(/v?(\d+)\.(\d+)\.(\d+)/);
        if (match) {
            const patch = parseInt(match[3], 10) + 1;
            return `v${match[1]}.${match[2]}.${patch}`;
        }
        return `${verStr}.1`;
    };

    useEffect(() => {
        fetchLogs(1);
        fetchCurrentAgreement();
    }, [selectedVersion]);

    const handleClauseChange = (index, field, value) => {
        const updated = [...clausesList];
        updated[index] = { ...updated[index], [field]: value };
        setClausesList(updated);
        setRawHtmlCode(buildHtmlFromClauses(headerTitle, introText, updated));
    };

    const handleAddClause = () => {
        const newId = clausesList.length + 1;
        const updated = [...clausesList, { id: newId, title: `Clause ${newId}`, text: '' }];
        setClausesList(updated);
        setRawHtmlCode(buildHtmlFromClauses(headerTitle, introText, updated));
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
        setRawHtmlCode(buildHtmlFromClauses(headerTitle, introText, updated));
        toast.showInfo(`Removed "${removedTitle}"`);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchLogs(1);
    };

    const handleUpdateAgreementSubmit = async (e) => {
        e.preventDefault();

        // Build final HTML depending on editor tab
        let finalHtml = rawHtmlCode;
        if (editorTab === 'form' || !rawHtmlCode) {
            finalHtml = buildHtmlFromClauses(headerTitle, introText, clausesList);
        }

        if (!newVersionInput.trim() || !finalHtml.trim()) {
            toast.showError('Please provide both a version identifier and valid agreement clauses.');
            return;
        }

        try {
            setUpdatingAgreement(true);

            const response = await api.put('/agreements/admin/update', {
                agreementText: finalHtml,
                newVersion: newVersionInput.trim()
            });

            if (response.data?.success) {
                toast.showSuccess(response.data?.message || 'User Agreement updated successfully!');
                setShowEditModal(false);
                fetchCurrentAgreement();
                fetchLogs(1);
            } else {
                toast.showError(response.data?.message || 'Failed to update agreement');
            }
        } catch (err) {
            console.error('Error updating agreement:', err);
            toast.showError(err.response?.data?.message || 'Failed to update User Agreement');
        } finally {
            setUpdatingAgreement(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
            
            {/* Header Title & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="p-2 rounded-xl bg-blue-50 text-blue-600 text-lg">
                            <IoShieldCheckmarkOutline />
                        </span>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-outfit">
                            User Agreement Audit Records
                        </h1>
                    </div>
                    <p className="text-xs text-slate-500 font-medium ml-1">
                        Immutable electronic acceptance log containing User ID, Mobile, Timestamp, IP Address, and Device ID.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => {
                            fetchCurrentAgreement();
                            setShowEditModal(true);
                        }}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                    >
                        <IoCreateOutline className="text-base" />
                        <span>Edit Agreement & Version ({currentVersion})</span>
                    </button>

                    <button
                        onClick={() => fetchLogs(pagination.page)}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                        title="Refresh Logs"
                    >
                        <IoRefreshOutline className="text-lg" />
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
                    <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Name, Phone, or IP..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 transition-all"
                    />
                </form>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                        <IoFilterOutline className="text-slate-400 text-sm" />
                        <span className="text-xs font-bold text-slate-600">Version:</span>
                        <select
                            value={selectedVersion}
                            onChange={(e) => setSelectedVersion(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
                        >
                            <option value="">All Versions</option>
                            {availableVersions.map((ver) => (
                                <option key={ver} value={ver}>
                                    {ver}
                                </option>
                            ))}
                        </select>
                    </div>

                    <span className="text-xs font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        Total Records: {pagination.total}
                    </span>
                </div>
            </div>

            {/* Electronic Audit Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <LoadingSpinner />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <IoDocumentTextOutline className="text-4xl text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold">No agreement acceptance records found</p>
                        <p className="text-xs text-slate-400 mt-1">Acceptance records will appear here as users accept the agreement.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                                    <th className="py-3.5 px-4">User Details</th>
                                    <th className="py-3.5 px-4">Mobile Number</th>
                                    <th className="py-3.5 px-4">Version</th>
                                    <th className="py-3.5 px-4">Acceptance Date & Time</th>
                                    <th className="py-3.5 px-4">IP Address</th>
                                    <th className="py-3.5 px-4">Device & App</th>
                                    <th className="py-3.5 px-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                {logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                                        
                                        {/* User Details */}
                                        <td className="py-3.5 px-4">
                                            <div className="font-extrabold text-slate-900">{log.userName}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">
                                                ID: {log.user?._id || log.user || 'N/A'}
                                            </div>
                                        </td>

                                        {/* Mobile Number */}
                                        <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-1.5 mt-2">
                                            <IoPhonePortraitOutline className="text-slate-400" />
                                            {log.mobileNumber}
                                        </td>

                                        {/* Version */}
                                        <td className="py-3.5 px-4 font-black text-blue-600">
                                            <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 font-mono">
                                                {log.agreementVersion}
                                            </span>
                                        </td>

                                        {/* Acceptance Date & Time */}
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                                <IoTimeOutline className="text-slate-400" />
                                                {new Date(log.acceptedAt || log.createdAt).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                            <div className="text-[11px] text-slate-500 font-mono pl-5">
                                                {new Date(log.acceptedAt || log.createdAt).toLocaleTimeString('en-IN', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit'
                                                })}
                                            </div>
                                        </td>

                                        {/* IP Address */}
                                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                                            <div className="flex items-center gap-1">
                                                <IoGlobeOutline className="text-slate-400" />
                                                {log.ipAddress}
                                            </div>
                                        </td>

                                        {/* Device & App */}
                                        <td className="py-3.5 px-4 max-w-xs truncate">
                                            <div className="font-semibold text-slate-800 truncate" title={log.deviceId}>
                                                {log.deviceId}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-bold">
                                                App v{log.appVersion}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="py-3.5 px-4 text-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                <IoCheckmarkCircleOutline className="text-xs text-emerald-600" />
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Bar */}
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

            {/* Non-Technical Admin Friendly Agreement Editor Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
                        
                        {/* Modal Header */}
                        <div className="bg-slate-900 p-5 text-white flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                                    <span>Update User Agreement</span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500 text-white text-xs font-bold font-mono">
                                        Current: {currentVersion}
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Edit the clauses in plain English below. Publishing a new version will require all users to accept it upon their next app visit.
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
                                    placeholder="e.g. v1.1.0"
                                    className="w-full sm:w-44 px-3.5 py-2 bg-white border border-blue-200 rounded-xl text-sm font-black font-mono text-blue-700 focus:outline-none focus:border-blue-500 shadow-2xs"
                                    required
                                />
                            </div>

                            {/* Clauses Form Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                                        Agreement Clauses ({clausesList.length} Items)
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
                                <strong>Notice:</strong> Publishing version <strong>{newVersionInput}</strong> will immediately prompt all registered platform users to read and accept the updated terms.
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
                                    disabled={updatingAgreement}
                                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                                >
                                    {updatingAgreement ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Publishing Version {newVersionInput}...</span>
                                        </>
                                    ) : (
                                        <>
                                            <IoCheckmarkOutline className="text-base" />
                                            <span>Publish Agreement ({newVersionInput})</span>
                                        </>
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
