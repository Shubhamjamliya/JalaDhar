import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getPublicSettings } from '../../../services/settingsApi';
import {
  ArrowLeft,
  FileText,
  Building2,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const DEFAULT_TERMS_HTML = `
<h3>1. DEFINITIONS</h3>
<p>For the purpose of these Terms & Conditions:</p>
<ul>
  <li><strong>"Customer" or "User"</strong> means any individual, farmer, landholder, builder, or legal entity that registers, accesses, or books a groundwater survey through the Jaladhaara platform.</li>
  <li><strong>"Expert Partner" or "Service Partner"</strong> means an independent hydrogeologist, geophysicist, or verified technical professional registered on the Jaladhaara platform to conduct field surveys.</li>
  <li><strong>"Platform"</strong> refers to the web portal, mobile applications (Android/iOS), software, and related services operated by Jaladhaara Groundwater Survey Pvt. Ltd.</li>
  <li><strong>"Survey Service"</strong> means geophysical investigations (such as Electrical Resistivity, ADMT, PQWT, or 3D locators) and digital reporting conducted by the assigned expert.</li>
</ul>

<h3>2. ABOUT JALADHAARA PLATFORM</h3>
<p>Jaladhaara operates as a specialized digital marketplace and intermediary connecting clients with independent, verified groundwater survey professionals. Jaladhaara facilitates slot reservations, navigation, digital payments, and automated report delivery. <strong>Jaladhaara is not a borewell drilling contractor and does not directly drill wells or pump groundwater.</strong></p>

<h3>3. SCIENTIFIC GEOPHYSICAL INVESTIGATION & DISCLAIMER</h3>
<p>All survey services facilitated through Jaladhaara utilize scientific geophysical techniques to assess subsurface hydrogeology and identify potential aquifer fracture zones. These scientific methods significantly reduce exploratory guesswork and optimize point selection.</p>
<p><strong>Strict Geological Limitation:</strong> Underground water occurrence is dictated entirely by natural subterranean hydrogeological conditions. Scientific instruments provide probabilistic subsurface data; therefore, <strong>no survey report, expert opinion, or platform representation guarantees 100% water strike success, borewell depth yield, continuous flow volume, or water quality.</strong></p>

<h3>4. CUSTOMER OBLIGATIONS & SITE ACCESS</h3>
<ul>
  <li><strong>Accurate Details:</strong> The customer must provide accurate land boundaries, survey coordinates, and point-of-contact details.</li>
  <li><strong>Lawful Site Access:</strong> The customer is strictly responsible for ensuring safe, lawful, and peaceful physical access to the land for the expert and scientific equipment on the scheduled date.</li>
  <li><strong>Statutory Clearances:</strong> The customer confirms they have lawful rights to the property and any municipal/state clearances required for groundwater testing.</li>
</ul>

<h3>5. BOOKINGS, PAYMENTS & BILLING</h3>
<ul>
  <li><strong>Advance Booking Fee:</strong> An initial advance payment (typically 40%) is required through authorized digital payment gateways (Razorpay, UPI, Net Banking) to schedule and mobilize the assigned expert.</li>
  <li><strong>Balance Payment:</strong> The remaining balance (typically 60%) becomes payable upon physical completion of field measurements before the certified digital report is unlocked.</li>
  <li><strong>Off-Platform Payment Prohibition:</strong> Cash payments or direct off-platform transactions between users and experts are strictly prohibited and void all platform protections.</li>
</ul>

<h3>6. CANCELLATION & REFUNDS</h3>
<ul>
  <li><strong>Cancellation 24+ Hours Before Visit:</strong> Full 100% refund of the advance booking fee, credited to the user's Jaladhaara wallet or original payment source.</li>
  <li><strong>Cancellation 12 to 24 Hours Before Visit:</strong> 50% mobilization fee deducted to compensate the locked expert itinerary.</li>
  <li><strong>Cancellation Under 12 Hours or Inaccessible Site:</strong> Advance fee is non-refundable once the expert is en route or at the location.</li>
  <li><strong>Expert No-Show:</strong> In the rare event an assigned expert fails to attend due to platform fault, a 100% immediate refund is processed.</li>
</ul>

<h3>7. EXPERT PARTNER PROFESSIONAL CODE</h3>
<p>Registered experts must maintain the highest geoscientific standards, use properly calibrated instruments, respect property boundaries, protect customer confidentiality, and never promise guaranteed water strikes.</p>

<h3>8. LIMITATION OF LIABILITY</h3>
<p>To the fullest extent permitted under applicable Indian law, Jaladhaara Groundwater Survey Pvt. Ltd., its directors, officers, and employees shall not be liable for drilling costs, borewell failure, dry holes, casing losses, crop damage, business interruption, or any indirect or consequential damages.</p>

<h3>9. GOVERNING LAW & JURISDICTION</h3>
<p>These Terms & Conditions shall be governed by and construed in accordance with the laws of India. Any legal disputes or claims arising hereunder shall be subject to the exclusive jurisdiction of the competent courts at Hyderabad, Telangana.</p>

<h3>10. GRIEVANCE REDRESSAL & CONTACT</h3>
<p>For questions regarding these Terms, booking terms, or grievance redressal, please contact our Legal & Compliance Desk at: <a href="mailto:info@jaladhaaraapp.com" class="text-blue-600 font-semibold underline">info@jaladhaaraapp.com</a>.</p>
`;

export default function TermsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [contentHtml, setContentHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Terms & Conditions | Jaladhaara";
    window.scrollTo(0, 0);

    const loadPolicy = async () => {
      try {
        setLoading(true);
        const res = await getPublicSettings('policy');
        if (res.success && res.data?.settings) {
          const item = res.data.settings.find(
            (s) => s.key === 'terms_of_service' || s.key === 'general_terms'
          );
          if (item?.value && item.value.trim().length > 30) {
            setContentHtml(item.value);
            return;
          }
        }
        setContentHtml(DEFAULT_TERMS_HTML);
      } catch (err) {
        console.error("Failed to load terms:", err);
        setContentHtml(DEFAULT_TERMS_HTML);
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
              Terms & Conditions
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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-3.5 border border-blue-100">
              <FileText className="w-3.5 h-3.5" />
              <span>POLICY &amp; AGREEMENT TERMS</span>
            </div>

            {/* Document Main Heading */}
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight mb-4 uppercase">
              TERMS &amp; CONDITIONS
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
                  <span>Jaladhaara Groundwater Survey Pvt. Ltd.</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Registered Office: </span>
                  <span>Hyderabad, Telangana, India</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Contact / Grievance: </span>
                  <a href="mailto:info@jaladhaaraapp.com" className="text-blue-600 font-semibold underline">
                    info@jaladhaaraapp.com
                  </a>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Effective Date: </span>
                  <span>01/09/2026</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Last Updated: </span>
                  <span>2026</span>
                </div>
              </div>
            </div>

            {/* Introductory Preamble */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 pb-5 border-b border-slate-100">
              These Terms &amp; Conditions ("Terms") govern the rules and standards for using the Jaladhaara platform, applications, and groundwater survey booking services. By accessing or using the platform, registering an account, or requesting a survey, you confirm that you have read, understood, and agreed to these Terms.
            </p>

            {/* ── Document Body Content ── */}
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold">Loading official document...</span>
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
            &copy; {new Date().getFullYear()} Jaladhaara Groundwater Survey Pvt. Ltd. All rights reserved.
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
