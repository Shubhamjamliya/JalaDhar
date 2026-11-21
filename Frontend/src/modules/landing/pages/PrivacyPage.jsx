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
  FileCheck2,
  Lock
} from 'lucide-react';

const DEFAULT_PRIVACY_HTML = `
<h3>1. WHO WE ARE</h3>
<p>The Jaladhaara platform, applications, and groundwater survey coordination services are owned and operated by:</p>
<p><strong>Legal Entity:</strong> Jaladhaara Groundwater Survey Pvt. Ltd.<br />
<strong>Registered Office:</strong> Hyderabad, Telangana, India<br />
<strong>Support &amp; Grievance Email:</strong> <a href="mailto:info@jaladhaaraapp.com" class="text-blue-600 font-semibold underline">info@jaladhaaraapp.com</a><br />
<strong>Website:</strong> jaladhaaraapp.com</p>

<h3>2. INFORMATION WE MAY COLLECT</h3>
<p>We collect only the minimum necessary information required to operate our groundwater survey booking platform safely and effectively:</p>
<ul>
  <li><strong>Customer Account &amp; Contact Information:</strong> Name, mobile phone number, email address, and profile settings.</li>
  <li><strong>Survey Site &amp; Geospatial Data:</strong> Physical land address, GPS location coordinates, property boundary landmarks, and site contact details to enable the expert to reach the survey point.</li>
  <li><strong>Payment &amp; Transaction Details:</strong> Encrypted transaction IDs, booking tokens, and payment status through certified payment aggregators (Razorpay / UPI networks). We do not store complete debit/credit card numbers or net banking passwords.</li>
  <li><strong>Expert Partner Verification Data:</strong> Government ID proofs (Aadhaar / PAN for mandatory KYC), educational hydrogeology credentials, instrument calibration certificates, and bank account numbers for survey fee disbursals.</li>
  <li><strong>Technical Logs:</strong> Device identifier, IP address, operating system, and push notification tokens for live survey status updates.</li>
</ul>

<h3>3. HOW WE USE YOUR INFORMATION</h3>
<p>Your information is processed strictly for legitimate operational purposes:</p>
<ul>
  <li>To match customers with qualified, nearby hydrogeology experts and schedule survey appointments.</li>
  <li>To provide turn-by-turn navigation for the expert to reach the exact survey plot.</li>
  <li>To verify advance slot bookings and finalize balance payments.</li>
  <li>To generate, cryptographically sign, and digitally store certified survey reports and invoices.</li>
  <li>To send real-time service notifications, survey arrival alerts, and report download links via SMS, WhatsApp, and push notifications.</li>
  <li>To comply with statutory GST, taxation, and law enforcement requirements under Indian regulations.</li>
</ul>

<h3>4. DATA SHARING &amp; DISCLOSURE</h3>
<p><strong>We have a strict policy: We do not sell, rent, or trade your personal or property data to third-party advertisers.</strong></p>
<p>Data is shared solely with authorized entities strictly required for service delivery:</p>
<ul>
  <li><strong>Assigned Survey Expert:</strong> The assigned hydrogeologist receives only the survey land location, user contact name, and phone number necessary to conduct the field survey.</li>
  <li><strong>Payment Gateways:</strong> Encrypted payment metadata is routed through certified payment aggregators (Razorpay) adhering to RBI guidelines.</li>
  <li><strong>Legal &amp; Regulatory Authorities:</strong> When required by court order, law enforcement, or statutory compliance under Indian law.</li>
</ul>

<h3>5. DATA SECURITY &amp; STORAGE</h3>
<p>We deploy robust administrative, technical, and physical safeguards to protect information against unauthorized access, loss, or alteration. All communication is transmitted via 256-bit SSL/TLS encryption. Data is stored in secure, access-restricted cloud facilities.</p>

<h3>6. YOUR DATA RIGHTS &amp; CHOICES</h3>
<p>Under the Digital Personal Data Protection (DPDP) Act and platform rules, you have the right to:</p>
<ul>
  <li>Review and verify the personal and survey details associated with your account.</li>
  <li>Request updates to inaccurate profile or property details.</li>
  <li>Request the deletion of your account and personal information (subject to statutory audit retention periods).</li>
  <li>Opt-out of non-transactional promotional messages.</li>
</ul>

<h3>7. GRIEVANCE REDRESSAL OFFICER</h3>
<p>In accordance with the Information Technology Act and DPDP rules, our designated Grievance Officer can be contacted for any privacy concerns, complaints, or account data requests:</p>
<p><strong>Grievance Officer:</strong> Jaladhaara Compliance Desk<br />
<strong>Email:</strong> <a href="mailto:info@jaladhaaraapp.com" class="text-blue-600 font-semibold underline">info@jaladhaaraapp.com</a><br />
<strong>Company:</strong> Jaladhaara Groundwater Survey Pvt. Ltd.<br />
<strong>Jurisdiction:</strong> Hyderabad, Telangana, India.</p>
`;

export default function PrivacyPage() {
  const navigate = useNavigate();
  const [contentHtml, setContentHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Jaladhaara Groundwater Survey Pvt. Ltd.',
    address: 'Hyderabad, Telangana, India',
    email: 'info@jaladhaaraapp.com'
  });

  useEffect(() => {
    document.title = "Privacy Policy | Jaladhaara";
    window.scrollTo(0, 0);

    const loadPolicy = async () => {
      try {
        setLoading(true);
        const [policyRes, billingRes] = await Promise.allSettled([
          getPublicSettings('policy'),
          getPublicSettings('billing')
        ]);

        if (billingRes.status === 'fulfilled' && billingRes.value?.success && billingRes.value.data?.settings) {
          const bSettings = billingRes.value.data.settings;
          const getVal = (k) => bSettings.find(s => s.key === k)?.value;
          setCompanyInfo({
            name: getVal('BILLING_COMPANY_NAME') || 'Jaladhaara Groundwater Survey Pvt. Ltd.',
            address: getVal('BILLING_ADDRESS') || 'Hyderabad, Telangana, India',
            email: getVal('BILLING_EMAIL') || 'info@jaladhaaraapp.com'
          });
        }

        if (policyRes.status === 'fulfilled' && policyRes.value?.success && policyRes.value.data?.settings) {
          const item = policyRes.value.data.settings.find((s) => s.key === 'privacy_policy');
          if (item?.value && item.value.trim().length > 30) {
            setContentHtml(item.value);
            return;
          }
        }
        setContentHtml(DEFAULT_PRIVACY_HTML);
      } catch (err) {
        console.error("Failed to load privacy policy:", err);
        setContentHtml(DEFAULT_PRIVACY_HTML);
      } finally {
        setLoading(false);
      }
    };

    loadPolicy();
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* ── Minimalist DoorMeets/DietVala Top Bar ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="p-1.5 -ml-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Privacy &amp; Data
            </h1>
          </div>
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
            Jaladhaara Legal
          </span>
        </div>
      </header>

      {/* ── Document Container ── */}
      <main className="flex-1 px-3 sm:px-6 py-5 sm:py-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs sm:shadow-sm p-4 sm:p-10 lg:p-12">
            {/* Top Document Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-3.5 border border-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>POLICY DETAILS</span>
            </div>

            {/* Document Main Heading */}
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight mb-4 uppercase">
              PRIVACY POLICY
            </h2>

            {/* ── Corporate & App Metadata Box (DietVala/DoorMeets Style) ── */}
            <div className="bg-slate-50/90 rounded-xl sm:rounded-2xl border border-slate-200/70 p-3.5 sm:p-5 mb-6 text-xs text-slate-600 space-y-1.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-700">Platform: </span>
                  <span>Jaladhaara (Web, Android &amp; iOS)</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Legal Entity: </span>
                  <span>{companyInfo.name}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Registered Office: </span>
                  <span>{companyInfo.address}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Support Email: </span>
                  <a href={`mailto:${companyInfo.email}`} className="text-blue-600 font-semibold underline">
                    {companyInfo.email}
                  </a>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Effective Date: </span>
                  <span>01/09/2026</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Last Updated: </span>
                  <span>{new Date().getFullYear()}</span>
                </div>
              </div>
            </div>

            {/* Introductory Preamble */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 pb-5 border-b border-slate-100">
              {companyInfo.name} ("Jaladhaara", "we", "our") respects your privacy and works to keep your personal information safe. This Privacy Policy explains what personal data Jaladhaara collects, how it uses and stores it, who it may share it with, and how it protects it when you use the Jaladhaara applications, website, and related services.
            </p>

            {/* ── Document Body Content ── */}
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold">Loading official privacy policy...</span>
              </div>
            ) : (
              <div
                className="clean-legal-body text-xs sm:text-sm text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            )}
          </div>

          {/* Simple Bottom Copyright */}
          <div className="text-center py-6 text-xs text-slate-400">
            &copy; {new Date().getFullYear()} {companyInfo.name}. All rights reserved.
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
