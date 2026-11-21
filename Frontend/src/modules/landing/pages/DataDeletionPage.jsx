import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublicSettings } from '../../../services/settingsApi';
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  Mail,
  MapPin,
  Clock,
  Trash2,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function DataDeletionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [docConfig, setDocConfig] = useState({
    platform: 'Jaladhaara (Web, Android & iOS)',
    companyName: 'Jaladhaara Groundwater Survey Pvt. Ltd.',
    address: '2-41/13/PMR/5F, 5th Floor, Melkiors Pride, Khanamet, Hitex Road, Hyderabad, Telangana, India',
    email: 'info@jaladhaaraapp.com',
    effectiveDate: '01/09/2026',
    lastUpdated: '2026',
    preamble: "In accordance with Meta Platform Terms, Google Play Policies, and India's Digital Personal Data Protection (DPDP) Act, you have full control over your personal data.",
    customPolicyHtml: ''
  });

  useEffect(() => {
    document.title = "User Data Deletion Instructions | Jaladhaara";
    window.scrollTo(0, 0);

    let isMounted = true;
    const loadSettings = async () => {
      try {
        setLoading(true);
        const [policyRes, billingRes] = await Promise.allSettled([
          getPublicSettings('policy'),
          getPublicSettings('billing')
        ]);

        if (!isMounted) return;

        const pSettings = policyRes.status === 'fulfilled' && policyRes.value?.success ? (policyRes.value.data?.settings || []) : [];
        const bSettings = billingRes.status === 'fulfilled' && billingRes.value?.success ? (billingRes.value.data?.settings || []) : [];

        const getP = (k) => pSettings.find(s => s.key === k)?.value;
        const getB = (k) => bSettings.find(s => s.key === k)?.value;

        const companyName = getP('data_deletion_company_name') || getP('privacy_company_name') || getB('BILLING_COMPANY_NAME') || 'Jaladhaara Groundwater Survey Pvt. Ltd.';
        const address = getP('data_deletion_company_address') || getP('privacy_company_address') || getB('BILLING_ADDRESS') || '2-41/13/PMR/5F, 5th Floor, Melkiors Pride, Khanamet, Hitex Road, Hyderabad, Telangana, India';
        const email = getP('data_deletion_contact_email') || getP('privacy_contact_email') || getB('BILLING_EMAIL') || 'info@jaladhaaraapp.com';
        const platform = getP('data_deletion_platform_scope') || getP('privacy_platform_scope') || 'Jaladhaara (Web, Android & iOS)';
        const effectiveDate = getP('data_deletion_effective_date') || getP('privacy_effective_date') || '01/09/2026';
        const lastUpdated = getP('data_deletion_last_updated') || getP('privacy_last_updated') || new Date().getFullYear().toString();
        const preamble = getP('data_deletion_preamble') || `In accordance with Meta Platform Terms, Google Play Policies, and India's Digital Personal Data Protection (DPDP) Act, you have full control over your personal data.`;
        const customPolicyHtml = getP('data_deletion_policy') || '';

        setDocConfig({
          platform,
          companyName,
          address,
          email,
          effectiveDate,
          lastUpdated,
          preamble,
          customPolicyHtml
        });
      } catch (err) {
        // Fallback to default state
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans antialiased">
      {/* ── Fixed Clean Header ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-emerald-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            aria-label="Back to previous page"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight truncate max-w-[200px] sm:max-w-none">
              {docConfig.companyName}
            </span>
          </div>

          <div className="text-[11px] sm:text-xs text-slate-500 font-medium hidden sm:block">
            User Data Deletion
          </div>
        </div>
      </header>

      {/* ── Document Container ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Header Title Banner */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 sm:p-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-emerald-100 mb-3 border border-white/15">
              <Trash2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>META PLATFORM &amp; DPDP COMPLIANCE</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              User Data Deletion Instructions
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              {docConfig.preamble}
            </p>
          </div>

          <div className="p-5 sm:p-8">
            {/* Metadata Box */}
            <div className="bg-slate-50/90 rounded-xl sm:rounded-2xl border border-slate-200/70 p-3.5 sm:p-5 mb-6 text-xs text-slate-600 space-y-1.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-700">Platform: </span>
                  <span>{docConfig.platform}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Legal Entity: </span>
                  <span>{docConfig.companyName}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Support / Privacy Email: </span>
                  <a href={`mailto:${docConfig.email}`} className="text-blue-600 font-semibold underline">
                    {docConfig.email}
                  </a>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Effective Date: </span>
                  <span>{docConfig.effectiveDate}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="font-semibold text-slate-700">Registered Office: </span>
                  <span>{docConfig.address}</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold">Loading data deletion instructions...</span>
              </div>
            ) : docConfig.customPolicyHtml ? (
              /* Custom Admin-configured Rich Text Policy */
              <div
                className="clean-legal-body text-xs sm:text-sm text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: docConfig.customPolicyHtml }}
              />
            ) : (
              /* Standard Meta-Compliant Instructions Template */
              <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
                {/* Section 1 */}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight mb-2 pb-1 border-b border-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    1. How to Request Deletion of Your Data
                  </h3>
                  <p className="mb-3">
                    If you have registered an account on <strong>Jaladhaara</strong> or interacted with our services through Meta (Facebook / Instagram) ads, Facebook Login, or WhatsApp, you can request full erasure of your account and personal information through any of the following methods:
                  </p>

                  <div className="space-y-3 mt-3">
                    {/* Method A */}
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm mb-1">
                        Method A: Email Our Privacy Desk (Direct &amp; Fast)
                      </h4>
                      <p className="text-slate-600 mb-2">
                        Send an email from your registered email address or mentioning your registered mobile number:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-600">
                        <li><strong>Recipient:</strong> <a href={`mailto:${docConfig.email}`} className="text-blue-600 font-semibold underline">{docConfig.email}</a></li>
                        <li><strong>Subject line:</strong> <code>Data Deletion Request - [Your Phone / Name]</code></li>
                        <li><strong>Details to provide:</strong> Your registered full name, mobile number, and the email address linked to your Jaladhaara account.</li>
                      </ul>
                    </div>

                    {/* Method B */}
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm mb-1">
                        Method B: Disconnect Jaladhaara from Facebook / Meta
                      </h4>
                      <p className="text-slate-600 mb-2">
                        If you interacted with our platform through your Facebook or Meta account:
                      </p>
                      <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                        <li>Go to your Facebook profile&apos;s <strong>Settings &amp; Privacy</strong> &gt; <strong>Settings</strong>.</li>
                        <li>Click on <strong>Apps and Websites</strong> in the left menu.</li>
                        <li>Locate <strong>Jaladhaara</strong> in the list of active apps.</li>
                        <li>Click <strong>Remove</strong> to revoke all future access and data sharing permissions.</li>
                        <li>Check the option to delete your activities or data that the app may have interacted with.</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight mb-2 pb-1 border-b border-slate-100 flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-emerald-600" />
                    2. What Data Will Be Deleted
                  </h3>
                  <p className="mb-2">Upon processing your verified request, we permanently delete:</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Your user account profile (Name, phone number, email address, password hash).</li>
                    <li>GPS coordinates, survey location pins, and survey plot addresses.</li>
                    <li>Uploaded property documents and land survey media photos.</li>
                    <li>Push notification device tokens and communication logs.</li>
                  </ul>
                </div>

                {/* Section 3 */}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight mb-2 pb-1 border-b border-slate-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    3. Data Retention for Legal &amp; Audit Compliance
                  </h3>
                  <p className="text-slate-600">
                    In accordance with applicable statutory regulations (including the Indian Companies Act, Goods &amp; Services Tax (GST) laws, and Prevention of Money Laundering rules), completed financial transaction records, tax invoices, and payment receipts must be preserved for statutory audit purposes for the duration mandated by law (generally 7 to 8 years). Such records are strictly restricted from any operational processing or marketing use.
                  </p>
                </div>

                {/* Section 4 */}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight mb-2 pb-1 border-b border-slate-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    4. Processing Timeline &amp; Confirmation
                  </h3>
                  <p className="text-slate-600 mb-2">
                    - <strong>Acknowledgment:</strong> Your deletion request is acknowledged within <strong>48 hours</strong> of receipt.<br />
                    - <strong>Completion:</strong> Complete data purge is finalized within <strong>30 calendar days</strong>.<br />
                    - <strong>Confirmation:</strong> A final written confirmation of data deletion will be emailed to you upon completion.
                  </p>
                </div>

                {/* Section 5 */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1">Grievance &amp; Compliance Officer</h4>
                  <p className="text-xs text-slate-600">
                    For questions or escalations regarding user data protection, contact our Grievance Desk:<br />
                    <strong>Email:</strong> <a href={`mailto:${docConfig.email}`} className="text-blue-600 font-semibold underline">{docConfig.email}</a><br />
                    <strong>Entity:</strong> {docConfig.companyName}<br />
                    <strong>Office:</strong> {docConfig.address}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="text-center py-6 text-xs text-slate-400 border-t border-slate-100">
            &copy; {new Date().getFullYear()} {docConfig.companyName}. All rights reserved.
          </div>
        </div>
      </main>

      {/* ── Scoped Document Reader Styling ── */}
      <style>{`
        .clean-legal-body h3 {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: -0.01em;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          padding-bottom: 0.25rem;
          border-bottom: 1px dashed #e2e8f0;
        }
        @media (min-width: 640px) {
          .clean-legal-body h3 {
            font-size: 1.05rem;
            margin-top: 1.75rem;
          }
        }
        .clean-legal-body h4 {
          font-size: 0.875rem;
          font-weight: 700;
          color: #1e293b;
          margin-top: 1rem;
          margin-bottom: 0.35rem;
        }
        .clean-legal-body p {
          margin-bottom: 0.75rem;
          line-height: 1.7;
          color: #334155;
        }
        .clean-legal-body ul {
          list-style-type: disc;
          padding-left: 1.25rem;
          margin-bottom: 0.9rem;
        }
        .clean-legal-body ol {
          list-style-type: decimal;
          padding-left: 1.25rem;
          margin-bottom: 0.9rem;
        }
        .clean-legal-body li {
          margin-bottom: 0.4rem;
          line-height: 1.65;
          color: #334155;
        }
        .clean-legal-body strong {
          color: #0f172a;
          font-weight: 700;
        }
        .clean-legal-body a {
          color: #2563eb;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
