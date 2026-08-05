import { useState, useEffect, useCallback } from "react";
import {
  IoReaderOutline,
  IoShieldCheckmarkOutline,
  IoSaveOutline,
  IoCheckmarkCircle,
  IoDocumentTextOutline,
  IoCardOutline,
  IoReceiptOutline,
  IoCloseCircleOutline,
  IoAlertCircleOutline,
  IoWalletOutline,
} from "react-icons/io5";
import { getAllSettings, updateMultipleSettings } from "../../../services/adminApi";
import ErrorMessage from "../../shared/components/ErrorMessage";
import { useToast } from "../../../hooks/useToast";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

/* ──────────────────────────────────────────────
   Quill Configuration
   ────────────────────────────────────────────── */
const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "clean"],
    [{ color: [] }, { background: [] }],
  ],
};
const formats = [
  "header",
  "bold", "italic", "underline", "strike",
  "list", "bullet",
  "link",
  "color", "background",
];

/* ──────────────────────────────────────────────
   Default policy text values
   ────────────────────────────────────────────── */
const DEFAULT_POLICIES = {
  checkout_policy: `<p><strong>1. Booking & Service Execution</strong></p>
<ul>
  <li>You are booking a verified groundwater survey expert for your specific location.</li>
  <li>Advance payment confirms your slot. The expert will visit on the scheduled date.</li>
</ul>
<p><strong>2. Cancellation & Refunds</strong></p>
<ul>
  <li>Cancel 24+ hours before schedule for a full 100% refund of the advance.</li>
  <li>Cancel within 24 hours of schedule and incur a 50% cancellation fee.</li>
  <li>If the expert arrives at the location but cannot survey due to customer-side issues, the advance is strictly non-refundable.</li>
</ul>
<p><strong>3. Reporting & Balance Payment</strong></p>
<ul>
  <li>The remaining 60% balance is payable after the physical survey is completed.</li>
  <li>Your digital survey report is generated instantly once the balance is cleared.</li>
</ul>`,
  general_terms: `<ul>
  <li>By creating an account or logging in, you agree to abide by Jaladhaara platform guidelines and privacy terms.</li>
  <li>Users are responsible for maintaining the confidentiality of their credentials and account access.</li>
  <li>Survey requests must represent genuine land testing requirements with accurate location data.</li>
</ul>`,
  booking_policy: `<ul>
  <li><strong>Slot Booking:</strong> Bookings must be requested with an accurate land location and survey requirements.</li>
  <li><strong>Confirmation:</strong> Your booking is confirmed once the advance payment is completed.</li>
  <li><strong>Expert Assignment:</strong> A qualified groundwater survey expert will be assigned to your booking.</li>
</ul>`,
  cancellation_policy: `<ul>
  <li><strong>Cancellation Before 24h:</strong> Full refund of advance payment if cancelled at least 24 hours before the scheduled visit.</li>
  <li><strong>Late Cancellation:</strong> 50% of the advance amount will be forfeited if cancelled between 12–24 hours before the visit.</li>
  <li><strong>Same Day Cancellation:</strong> No refund for cancellations made within 12 hours of the visit.</li>
</ul>`,
  refund_policy: `<ul>
  <li><strong>Refund Processing:</strong> Approved refunds will be credited to your JalaDhar wallet instantly upon cancellation.</li>
  <li><strong>Failed Survey Visits:</strong> If an expert fails to attend due to platform issues, a 100% refund will be issued to your wallet.</li>
  <li><strong>Inquiries:</strong> Contact support for any refund status queries.</li>
</ul>`,
  advance_payment_policy: `<ul>
  <li><strong>Advance Split:</strong> A 40% advance payment of the total estimated amount is required to lock your appointment.</li>
  <li><strong>Payment Gateways:</strong> Secure online payment via Razorpay, UPI, Cards, or Net Banking.</li>
  <li><strong>Instant Receipt:</strong> Digital receipt is generated immediately upon successful transaction.</li>
</ul>`,
  remaining_payment_policy: `<ul>
  <li><strong>Remaining Split:</strong> The 60% balance amount is payable after the physical survey visit is completed.</li>
  <li><strong>Report Release:</strong> Survey findings and PDF report will be unlocked upon receipt of full payment.</li>
</ul>`,
  terms_of_service: `<ol>
  <li>Jaladhaara is a technology platform that connects customers with independent groundwater survey experts.</li>
  <li>Survey services are provided solely by the selected expert. Jaladhaara is not the survey service provider.</li>
  <li>Groundwater occurrence is governed by natural geological conditions. Jaladhaara doesn't guarantee the successful borewell drilling, groundwater availability, water quantity, or water quality.</li>
  <li>The survey report is a professional opinion based on scientific observations and available data and should not be considered a guarantee of drilling success.</li>
  <li>Customers are responsible for providing the correct survey location, site access, and obtaining any required permissions.</li>
  <li>Jaladhaara is not liable for borewell failure, dry borewells, low yield, drilling costs, financial losses, crop loss, or any indirect or consequential damages.</li>
  <li>Booking, cancellation, refund, and rescheduling are governed by the applicable policies available in the app.</li>
  <li>By proceeding with the booking, you confirm that you have read, understood, and agreed to these Terms & Conditions.</li>
</ol>`,
  privacy_policy: `<p>Jaladhaara Groundwater Survey Pvt. Ltd. ("Jaladhaara") respects your privacy and is committed to protecting your personal information.</p>
<ol>
  <li>We collect information such as your name, mobile number, email address, survey location, payment details, and other information required to provide our services.</li>
  <li>Your location is used only to facilitate groundwater survey bookings and enable experts to reach the correct survey land.</li>
  <li>Your personal information is shared only with authorised experts, payment service providers, and service partners as necessary to deliver the requested services or comply with applicable laws.</li>
  <li>We use reasonable security measures to protect your personal information from unauthorised access, loss, or misuse.</li>
  <li>We do not sell or rent your personal information to third parties.</li>
  <li>You are responsible for providing accurate information and keeping your account details up to date.</li>
  <li>By using the Jaladhaara app, you consent to the collection, use, storage, and processing of your information in accordance with this Privacy Policy.</li>
  <li>Jaladhaara may update this Privacy Policy from time to time. The latest version will always be available within the app and on our website.</li>
</ol>
<p>For more information, please refer to the full Privacy Policy available in the app or contact Jaladhaara Customer Support.</p>`,
};

/* ──────────────────────────────────────────────
   Tab definitions (3 tabs — no numeric rules tab)
   ────────────────────────────────────────────── */
const TABS = [
  { id: "legal",      label: "Legal & Terms",       icon: IoDocumentTextOutline, color: "blue"   },
  { id: "booking",    label: "Booking & Cancellation", icon: IoCardOutline,       color: "violet" },
  { id: "refund",     label: "Refund & Privacy",    icon: IoReceiptOutline,      color: "green"  },
];

const TAB_COLOR_MAP = {
  blue:   { active: "bg-blue-600 text-white shadow-blue-200",     inactive: "text-slate-600 hover:bg-blue-50 hover:text-blue-700",   accent: "#2563EB" },
  violet: { active: "bg-violet-600 text-white shadow-violet-200", inactive: "text-slate-600 hover:bg-violet-50 hover:text-violet-700", accent: "#7C3AED" },
  green:  { active: "bg-emerald-600 text-white shadow-emerald-200", inactive: "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700", accent: "#059669" },
};

/* ──────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────── */

function PolicyBlock({ label, description, value, onChange, placeholder }) {
  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-bold text-slate-800">{label}</label>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="policy-editor-wrap rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function SectionCard({ title, description, icon: Icon, color = "blue", onSave, saving, saved, children }) {
  const colors = TAB_COLOR_MAP[color];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/60 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ backgroundColor: colors.accent + "15" }}>
            <Icon className="text-lg" style={{ color: colors.accent }} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-800">{title}</h2>
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          </div>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md
            ${saved
              ? "bg-emerald-500 text-white shadow-emerald-200"
              : `text-white shadow-lg ${saving ? "opacity-60 cursor-not-allowed" : "hover:opacity-90 active:scale-95"}`
            }`}
          style={!saved ? { backgroundColor: colors.accent, boxShadow: `0 4px 14px ${colors.accent}40` } : {}}
        >
          {saving ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : saved ? (
            <IoCheckmarkCircle className="text-base" />
          ) : (
            <IoSaveOutline className="text-base" />
          )}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Section"}
        </button>
      </div>
      <div className="p-6 space-y-6">{children}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main Page Component
   ────────────────────────────────────────────── */
export default function AdminPolicies() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("legal");
  const [policySettings, setPolicySettings] = useState(DEFAULT_POLICIES);

  const [sectionState, setSectionState] = useState({
    legal:   { saving: false, saved: false },
    booking: { saving: false, saved: false },
    refund:  { saving: false, saved: false },
  });

  /* Load all settings on mount */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getAllSettings("policy");
        if (res.success && res.data?.settings) {
          const map = {};
          res.data.settings.forEach((s) => {
            if (s.value !== undefined && s.value !== null && s.value !== "") {
              map[s.key] = s.value;
            }
          });
          setPolicySettings((prev) => ({ ...DEFAULT_POLICIES, ...map }));
        }
      } catch (err) {
        console.error("Error loading policy settings:", err);
        setError("Failed to load policy settings. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const patch = useCallback((key, value) => {
    setPolicySettings((prev) => ({ ...prev, [key]: value }));
    const sectionKey = getSectionForKey(key);
    if (sectionKey) {
      setSectionState((prev) => ({
        ...prev,
        [sectionKey]: { ...prev[sectionKey], saved: false },
      }));
    }
  }, []);

  const getSectionForKey = (key) => {
    const legal = ["general_terms", "terms_of_service", "privacy_policy"];
    const booking = ["checkout_policy", "booking_policy", "cancellation_policy", "advance_payment_policy", "remaining_payment_policy"];
    const refundKeys = ["refund_policy"];
    if (legal.includes(key)) return "legal";
    if (booking.includes(key)) return "booking";
    if (refundKeys.includes(key)) return "refund";
    return null;
  };

  const saveSection = async (section) => {
    setSectionState((prev) => ({ ...prev, [section]: { saving: true, saved: false } }));
    setError("");
    try {
      let settings = [];
      if (section === "legal") {
        settings = [
          { key: "general_terms",    value: policySettings.general_terms },
          { key: "terms_of_service", value: policySettings.terms_of_service },
          { key: "privacy_policy",   value: policySettings.privacy_policy },
        ];
      } else if (section === "booking") {
        settings = [
          { key: "checkout_policy",         value: policySettings.checkout_policy },
          { key: "booking_policy",          value: policySettings.booking_policy },
          { key: "cancellation_policy",     value: policySettings.cancellation_policy },
          { key: "advance_payment_policy",  value: policySettings.advance_payment_policy },
          { key: "remaining_payment_policy", value: policySettings.remaining_payment_policy },
        ];
      } else if (section === "refund") {
        settings = [
          { key: "refund_policy", value: policySettings.refund_policy },
        ];
      }

      const res = await updateMultipleSettings(settings);
      if (res.success) {
        setSectionState((prev) => ({ ...prev, [section]: { saving: false, saved: true } }));
        toast.showSuccess("Section saved successfully!");
        setTimeout(
          () => setSectionState((prev) => ({ ...prev, [section]: { ...prev[section], saved: false } })),
          3000
        );
      } else {
        throw new Error(res.message || "Failed to save.");
      }
    } catch (err) {
      console.error("Save section error:", err);
      setError(err.message || "Failed to save section. Please try again.");
      setSectionState((prev) => ({ ...prev, [section]: { saving: false, saved: false } }));
    }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col">
        <div className="mb-6 animate-pulse">
          <div className="h-8 w-56 bg-slate-200 rounded-xl mb-2" />
          <div className="h-4 w-80 bg-slate-100 rounded-lg" />
        </div>
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 w-44 bg-slate-200 rounded-xl animate-pulse" />)}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-36 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { saving, saved } = sectionState[activeTab] || {};

  return (
    <div className="min-h-[calc(100vh-5rem)] space-y-6">
      {/* ── Quill styles ── */}
      <style>{`
        .policy-editor-wrap .ql-toolbar.ql-snow {
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          border-color: #e2e8f0;
          background: #f8fafc;
          padding: 8px 10px;
        }
        .policy-editor-wrap .ql-container.ql-snow {
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          border-color: #e2e8f0;
          min-height: 180px;
          font-size: 0.875rem;
          font-family: inherit;
        }
        .policy-editor-wrap .ql-editor {
          min-height: 180px;
          line-height: 1.7;
          color: #1e293b;
        }
        .policy-editor-wrap .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
        .policy-editor-wrap .ql-snow.ql-toolbar button:hover,
        .policy-editor-wrap .ql-snow.ql-toolbar button.ql-active {
          color: #2563eb;
        }
        .policy-editor-wrap .ql-snow.ql-toolbar button:hover .ql-stroke,
        .policy-editor-wrap .ql-snow.ql-toolbar button.ql-active .ql-stroke {
          stroke: #2563eb;
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
            <IoReaderOutline className="text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">Policy Management</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Configure all platform policies and legal documents shown to users
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
          <IoShieldCheckmarkOutline className="text-emerald-600 text-sm" />
          <span className="text-xs font-bold text-emerald-700">Saved to DB</span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 font-medium">
          <IoAlertCircleOutline className="text-lg shrink-0 mt-0.5" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">
            <IoCloseCircleOutline />
          </button>
        </div>
      )}

      {/* ── Tab Navigation ── */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const colors = TAB_COLOR_MAP[tab.color];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex-1 min-w-[160px] justify-center
                ${isActive ? `${colors.active} shadow-md` : `${colors.inactive} bg-transparent`}`}
            >
              <tab.icon className="text-base shrink-0" />
              {tab.label}
              {sectionState[tab.id]?.saved && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Legal & Terms Tab ── */}
      {activeTab === "legal" && (
        <SectionCard
          title="Legal & Terms Policies"
          description="Platform agreements accepted by users at login, signup, and booking stages"
          icon={IoDocumentTextOutline}
          color="blue"
          onSave={() => saveSection("legal")}
          saving={saving}
          saved={saved}
        >
          <PolicyBlock
            label="General Terms & Conditions (Login / Registration)"
            description="Terms accepted by users during login and registration."
            value={policySettings.general_terms}
            onChange={(v) => patch("general_terms", v)}
            placeholder="Write general terms and conditions here…"
          />
          <div className="border-t border-dashed border-slate-200" />
          <PolicyBlock
            label="Terms of Service"
            description="General legal terms shown during survey flow and booking confirmation."
            value={policySettings.terms_of_service}
            onChange={(v) => patch("terms_of_service", v)}
            placeholder="Write your terms of service here…"
          />
          <div className="border-t border-dashed border-slate-200" />
          <PolicyBlock
            label="Privacy Policy"
            description="Privacy policy details regarding user data collection and protection."
            value={policySettings.privacy_policy}
            onChange={(v) => patch("privacy_policy", v)}
            placeholder="Write your privacy policy here…"
          />
        </SectionCard>
      )}

      {/* ── Booking & Cancellation Tab ── */}
      {activeTab === "booking" && (
        <SectionCard
          title="Booking & Cancellation Policies"
          description="Policies shown during booking flow, payment confirmations, and cancellation modal"
          icon={IoCardOutline}
          color="violet"
          onSave={() => saveSection("booking")}
          saving={saving}
          saved={saved}
        >
          <PolicyBlock
            label="Combined Checkout Policy"
            description="Shown in the popup right before the user pays the advance or remaining amount."
            value={policySettings.checkout_policy}
            onChange={(v) => patch("checkout_policy", v)}
            placeholder="Write combined checkout terms here…"
          />
          <div className="border-t border-dashed border-slate-200" />
          <PolicyBlock
            label="Booking Policy"
            description="Shown during booking requests and survey scheduling."
            value={policySettings.booking_policy}
            onChange={(v) => patch("booking_policy", v)}
            placeholder="Write your booking policy here…"
          />
          <div className="border-t border-dashed border-slate-200" />

          {/* Cancellation Policy — highlighted as it drives the user's cancellation modal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-slate-800">
                  Cancellation Policy
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  This exact text is shown to users inside the cancellation confirmation modal before they confirm cancelling their booking.
                </p>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 bg-red-50 border border-red-200 text-red-600 rounded-full shrink-0 ml-3">
                Shown in Cancel Modal
              </span>
            </div>

            {/* Info notice about refund flow */}
            <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-3">
              <IoWalletOutline className="text-emerald-600 text-base shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                <strong>Refund flow:</strong> When a user cancels, the full advance payment is automatically credited to their JalaDhar wallet. Write your cancellation terms below — these will be displayed verbatim to the user.
              </p>
            </div>

            <div className="policy-editor-wrap rounded-xl overflow-hidden border-2 border-red-100 shadow-sm">
              <ReactQuill
                theme="snow"
                value={policySettings.cancellation_policy}
                onChange={(v) => patch("cancellation_policy", v)}
                modules={modules}
                formats={formats}
                placeholder="Write your cancellation terms here…"
              />
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200" />
          <PolicyBlock
            label="Advance Payment Policy"
            description="Shown during initial advance payment confirmation (40% payment screen)."
            value={policySettings.advance_payment_policy}
            onChange={(v) => patch("advance_payment_policy", v)}
            placeholder="Write advance payment terms here…"
          />
          <div className="border-t border-dashed border-slate-200" />
          <PolicyBlock
            label="Remaining Payment Policy"
            description="Shown during final balance payment confirmation (60% payment screen)."
            value={policySettings.remaining_payment_policy}
            onChange={(v) => patch("remaining_payment_policy", v)}
            placeholder="Write remaining balance payment terms here…"
          />
        </SectionCard>
      )}

      {/* ── Refund & Privacy Tab ── */}
      {activeTab === "refund" && (
        <SectionCard
          title="Refund Policy"
          description="Terms regarding refund conditions — refunds are credited to the user's JalaDhar wallet"
          icon={IoReceiptOutline}
          color="green"
          onSave={() => saveSection("refund")}
          saving={saving}
          saved={saved}
        >
          <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <IoWalletOutline className="text-emerald-600 text-xl shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-800 font-medium leading-relaxed">
              Refunds are automatically credited to the user's <strong>JalaDhar wallet</strong> upon cancellation. Ensure this policy is consistent with the cancellation terms in the <strong>Booking & Cancellation</strong> tab.
            </p>
          </div>
          <PolicyBlock
            label="Refund Policy"
            description="Terms regarding money-back conditions and refund timelines."
            value={policySettings.refund_policy}
            onChange={(v) => patch("refund_policy", v)}
            placeholder="Write your refund policy here…"
          />
        </SectionCard>
      )}
    </div>
  );
}
