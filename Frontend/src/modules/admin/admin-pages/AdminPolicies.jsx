import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  IoPersonOutline,
  IoChevronDownOutline,
} from "react-icons/io5";
import { getAllSettings, updateMultipleSettings } from "../../../services/adminApi";
import ErrorMessage from "../../shared/components/ErrorMessage";
import { useToast } from "../../../hooks/useToast";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "clean"],
    [{ color: [] }, { background: [] }],
  ],
};
const formats = ["header","bold","italic","underline","strike","list","bullet","link","color","background"];

const DEFAULT_POLICIES = {
  checkout_policy: `<p><strong>1. Booking &amp; Service Execution</strong></p><ul><li>You are booking a verified groundwater survey expert for your specific location.</li><li>Advance payment confirms your slot. The expert will visit on the scheduled date.</li></ul><p><strong>2. Cancellation &amp; Refunds</strong></p><ul><li>Cancel 24+ hours before schedule for a full 100% refund of the advance.</li><li>Cancel within 24 hours of schedule and incur a 50% cancellation fee.</li><li>If the expert arrives at the location but cannot survey due to customer-side issues, the advance is strictly non-refundable.</li></ul><p><strong>3. Reporting &amp; Balance Payment</strong></p><ul><li>The remaining 60% balance is payable after the physical survey is completed.</li><li>Your digital survey report is generated instantly once the balance is cleared.</li></ul>`,
  general_terms: `<ul><li>By creating an account or logging in, you agree to abide by Jaladhaara platform guidelines and privacy terms.</li><li>Users are responsible for maintaining the confidentiality of their credentials and account access.</li><li>Survey requests must represent genuine land testing requirements with accurate location data.</li></ul>`,
  booking_policy: `<ul><li><strong>Slot Booking:</strong> Bookings must be requested with an accurate land location and survey requirements.</li><li><strong>Confirmation:</strong> Your booking is confirmed once the advance payment is completed.</li><li><strong>Expert Assignment:</strong> A qualified groundwater survey expert will be assigned to your booking.</li></ul>`,
  cancellation_policy: `<ul><li><strong>Cancellation Before 24h:</strong> Full refund of advance payment if cancelled at least 24 hours before the scheduled visit.</li><li><strong>Late Cancellation:</strong> 50% of the advance amount will be forfeited if cancelled between 12-24 hours before the visit.</li><li><strong>Same Day Cancellation:</strong> No refund for cancellations made within 12 hours of the visit.</li></ul>`,
  refund_policy: `<ul><li><strong>Refund Processing:</strong> Approved refunds will be credited to your JalaDhar wallet instantly upon cancellation.</li><li><strong>Failed Survey Visits:</strong> If an expert fails to attend due to platform issues, a 100% refund will be issued to your wallet.</li><li><strong>Inquiries:</strong> Contact support for any refund status queries.</li></ul>`,
  advance_payment_policy: `<ul><li><strong>Advance Split:</strong> A 40% advance payment of the total estimated amount is required to lock your appointment.</li><li><strong>Payment Gateways:</strong> Secure online payment via Razorpay, UPI, Cards, or Net Banking.</li><li><strong>Instant Receipt:</strong> Digital receipt is generated immediately upon successful transaction.</li></ul>`,
  remaining_payment_policy: `<ul><li><strong>Remaining Split:</strong> The 60% balance amount is payable after the physical survey visit is completed.</li><li><strong>Report Release:</strong> Survey findings and PDF report will be unlocked upon receipt of full payment.</li></ul>`,
  terms_of_service: `<ol><li>Jaladhaara is a technology platform that connects customers with independent groundwater survey experts.</li><li>Survey services are provided solely by the selected expert. Jaladhaara is not the survey service provider.</li><li>Groundwater occurrence is governed by natural geological conditions. Jaladhaara does not guarantee the successful borewell drilling, groundwater availability, water quantity, or water quality.</li><li>The survey report is a professional opinion based on scientific observations and available data and should not be considered a guarantee of drilling success.</li><li>Customers are responsible for providing the correct survey location, site access, and obtaining any required permissions.</li><li>Jaladhaara is not liable for borewell failure, dry borewells, low yield, drilling costs, financial losses, crop loss, or any indirect or consequential damages.</li><li>Booking, cancellation, refund, and rescheduling are governed by the applicable policies available in the app.</li><li>By proceeding with the booking, you confirm that you have read, understood, and agreed to these Terms and Conditions.</li></ol>`,
  privacy_policy: `<p>Jaladhaara Groundwater Survey Pvt. Ltd. respects your privacy and is committed to protecting your personal information.</p><ol><li>We collect information such as your name, mobile number, email address, survey location, payment details, and other information required to provide our services.</li><li>Your location is used only to facilitate groundwater survey bookings and enable experts to reach the correct survey land.</li><li>Your personal information is shared only with authorised experts, payment service providers, and service partners as necessary to deliver the requested services or comply with applicable laws.</li><li>We use reasonable security measures to protect your personal information from unauthorised access, loss, or misuse.</li><li>We do not sell or rent your personal information to third parties.</li><li>You are responsible for providing accurate information and keeping your account details up to date.</li><li>By using the Jaladhaara app, you consent to the collection, use, storage, and processing of your information in accordance with this Privacy Policy.</li><li>Jaladhaara may update this Privacy Policy from time to time. The latest version will always be available within the app and on our website.</li></ol>`,
  expert_agreement: `<p><strong>EXPERT SERVICE AGREEMENT</strong></p><p>This Expert Service Agreement is entered into between Jaladhaara Hydrogeological Services Pvt. Ltd. ("Platform") and the registered expert ("Expert") upon acceptance through the Jaladhaara platform.</p><ol><li><strong>Services:</strong> The Expert agrees to provide groundwater survey and hydrogeological assessment services through the Jaladhaara platform as and when bookings are assigned.</li><li><strong>Professional Standards:</strong> The Expert shall conduct all surveys with due diligence, professional expertise, and in accordance with applicable technical standards and guidelines.</li><li><strong>Attendance and Punctuality:</strong> The Expert must arrive at the survey location on the scheduled date and time. In case of unavoidable delays, the Expert must notify the platform immediately.</li><li><strong>Report Submission:</strong> The Expert is required to submit a complete and accurate survey report through the platform within the stipulated time after completing the physical survey.</li><li><strong>Platform Fee:</strong> The Platform retains a service fee as per the current payout policy. The net payout is credited to the Expert registered bank account after deducting applicable charges.</li><li><strong>Code of Conduct:</strong> The Expert must maintain professional conduct at all times, treat customers respectfully, and not solicit offline payments or direct business outside the platform.</li><li><strong>Confidentiality:</strong> The Expert agrees to maintain strict confidentiality of customer data, survey findings, and platform information shared in connection with services.</li><li><strong>Termination:</strong> The Platform reserves the right to suspend or terminate the Expert access in case of misconduct, repeated no-shows, fraudulent activity, or violation of this agreement.</li><li><strong>Dispute Resolution:</strong> Any disputes arising from this agreement shall be subject to the jurisdiction of courts in Raipur, Chhattisgarh.</li><li><strong>Amendments:</strong> Jaladhaara reserves the right to update this agreement from time to time. Continued use of the platform after such changes constitutes acceptance of the revised terms.</li></ol>`,
};

const TABS = [
  { id: "legal",        label: "Terms & Conditions",    icon: IoDocumentTextOutline,   color: "blue",   sectionKey: "legal"        },
  { id: "privacy",      label: "Privacy Policy",         icon: IoShieldCheckmarkOutline, color: "indigo", sectionKey: "privacy"      },
  { id: "cancellation", label: "Cancellation & Refunds", icon: IoCardOutline,            color: "violet", sectionKey: "cancellation" },
  { id: "expert",       label: "Expert Agreement",       icon: IoPersonOutline,          color: "amber",  sectionKey: "expert"       },
];

const TAB_COLOR_MAP = {
  blue:   { active: "bg-blue-600 text-white",   inactive: "text-slate-600 hover:bg-blue-50 hover:text-blue-700",     accent: "#2563EB", bg: "bg-blue-50",   iconColor: "text-blue-600",   border: "border-blue-100",   badge: "bg-blue-100 text-blue-700"    },
  indigo: { active: "bg-indigo-600 text-white", inactive: "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700", accent: "#4F46E5", bg: "bg-indigo-50", iconColor: "text-indigo-600", border: "border-indigo-100", badge: "bg-indigo-100 text-indigo-700" },
  violet: { active: "bg-violet-600 text-white", inactive: "text-slate-600 hover:bg-violet-50 hover:text-violet-700", accent: "#7C3AED", bg: "bg-violet-50", iconColor: "text-violet-600", border: "border-violet-100", badge: "bg-violet-100 text-violet-700"  },
  amber:  { active: "bg-amber-600 text-white",  inactive: "text-slate-600 hover:bg-amber-50 hover:text-amber-700",   accent: "#D97706", bg: "bg-amber-50",  iconColor: "text-amber-600",  border: "border-amber-100",  badge: "bg-amber-100 text-amber-700"   },
};

const HUB_CARDS = [
  { id: "legal",        label: "Terms & Conditions",    description: "General terms, terms of service and legal agreements shown during signup and booking", icon: IoDocumentTextOutline,   color: "blue",   badge: "Legal"   },
  { id: "privacy",      label: "Privacy Policy",         description: "User data collection, storage, sharing policies and GDPR-compliant disclosures",       icon: IoShieldCheckmarkOutline, color: "indigo", badge: "Privacy" },
  { id: "cancellation", label: "Cancellation & Refunds", description: "Booking cancellation rules, refund processing, advance and balance payment policies",   icon: IoCardOutline,            color: "violet", badge: "Finance" },
  { id: "expert",       label: "Expert Agreement",       description: "Service agreement shown to experts before onboarding — conduct, payouts and terms",      icon: IoPersonOutline,          color: "amber",  badge: "Expert"  },
];

function PolicyBlock({ label, description, value, onChange, placeholder }) {
  return (
    <div className="space-y-2">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="policy-editor-wrap rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        <ReactQuill theme="snow" value={value} onChange={onChange} modules={modules} formats={formats} placeholder={placeholder} />
      </div>
    </div>
  );
}

function SectionCard({ title, description, icon: Icon, color = "blue", onSave, saving, saved, children }) {
  const colors = TAB_COLOR_MAP[color];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/60 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ backgroundColor: colors.accent + "15" }}>
            <Icon className="text-lg" style={{ color: colors.accent }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
            {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
          </div>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${saved ? "bg-emerald-500 text-white" : `text-white ${saving ? "opacity-60 cursor-not-allowed" : "hover:opacity-90 active:scale-95"}`}`}
          style={!saved ? { backgroundColor: colors.accent, boxShadow: `0 4px 14px ${colors.accent}40` } : {}}
        >
          {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : saved ? <IoCheckmarkCircle className="text-base" /> : <IoSaveOutline className="text-base" />}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Section"}
        </button>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  );
}

export default function AdminPolicies({ defaultTab = "hub" }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [policySettings, setPolicySettings] = useState(DEFAULT_POLICIES);

  useEffect(() => { if (defaultTab) setActiveTab(defaultTab); }, [defaultTab]);

  const [sectionState, setSectionState] = useState({
    legal: { saving: false, saved: false },
    privacy: { saving: false, saved: false },
    cancellation: { saving: false, saved: false },
    expert: { saving: false, saved: false },
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getAllSettings("policy");
        if (res.success && res.data?.settings) {
          const map = {};
          res.data.settings.forEach((s) => { if (s.value !== undefined && s.value !== null && s.value !== "") map[s.key] = s.value; });
          setPolicySettings((prev) => ({ ...DEFAULT_POLICIES, ...map }));
        }
      } catch (err) {
        setError("Failed to load policy settings. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const patch = useCallback((key, value) => {
    setPolicySettings((prev) => ({ ...prev, [key]: value }));
    const sk = ["general_terms","terms_of_service"].includes(key) ? "legal"
      : ["privacy_policy"].includes(key) ? "privacy"
      : ["checkout_policy","booking_policy","cancellation_policy","advance_payment_policy","remaining_payment_policy","refund_policy"].includes(key) ? "cancellation"
      : ["expert_agreement"].includes(key) ? "expert" : null;
    if (sk) setSectionState((prev) => ({ ...prev, [sk]: { ...prev[sk], saved: false } }));
  }, []);

  const saveSection = async (section) => {
    setSectionState((prev) => ({ ...prev, [section]: { saving: true, saved: false } }));
    setError("");
    try {
      const settingsMap = {
        legal: [{ key: "general_terms", value: policySettings.general_terms }, { key: "terms_of_service", value: policySettings.terms_of_service }],
        privacy: [{ key: "privacy_policy", value: policySettings.privacy_policy }],
        cancellation: [
          { key: "checkout_policy", value: policySettings.checkout_policy },
          { key: "booking_policy", value: policySettings.booking_policy },
          { key: "cancellation_policy", value: policySettings.cancellation_policy },
          { key: "advance_payment_policy", value: policySettings.advance_payment_policy },
          { key: "remaining_payment_policy", value: policySettings.remaining_payment_policy },
          { key: "refund_policy", value: policySettings.refund_policy },
        ],
        expert: [{ key: "expert_agreement", value: policySettings.expert_agreement }],
      };
      const res = await updateMultipleSettings(settingsMap[section] || []);
      if (res.success) {
        setSectionState((prev) => ({ ...prev, [section]: { saving: false, saved: true } }));
        toast.showSuccess("Section saved successfully!");
        setTimeout(() => setSectionState((prev) => ({ ...prev, [section]: { ...prev[section], saved: false } })), 3000);
      } else throw new Error(res.message || "Failed to save.");
    } catch (err) {
      setError(err.message || "Failed to save section. Please try again.");
      setSectionState((prev) => ({ ...prev, [section]: { saving: false, saved: false } }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col">
        <div className="mb-6 animate-pulse">
          <div className="h-8 w-56 bg-slate-200 rounded-xl mb-2" />
          <div className="h-4 w-80 bg-slate-100 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map((i) => <div key={i} className="h-36 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const currentTab = TABS.find(t => t.id === activeTab);
  const { saving, saved } = sectionState[activeTab] || {};

  return (
    <div className="min-h-[calc(100vh-5rem)] space-y-5">
      <style>{`
        .policy-editor-wrap .ql-toolbar.ql-snow { border-top-left-radius:.75rem;border-top-right-radius:.75rem;border-color:#e2e8f0;background:#f8fafc;padding:8px 10px; }
        .policy-editor-wrap .ql-container.ql-snow { border-bottom-left-radius:.75rem;border-bottom-right-radius:.75rem;border-color:#e2e8f0;min-height:180px;font-size:.875rem;font-family:inherit; }
        .policy-editor-wrap .ql-editor { min-height:180px;line-height:1.7;color:#1e293b; }
        .policy-editor-wrap .ql-editor.ql-blank::before { color:#94a3b8;font-style:normal; }
        .policy-editor-wrap .ql-snow.ql-toolbar button:hover,.policy-editor-wrap .ql-snow.ql-toolbar button.ql-active { color:#2563eb; }
        .policy-editor-wrap .ql-snow.ql-toolbar button:hover .ql-stroke,.policy-editor-wrap .ql-snow.ql-toolbar button.ql-active .ql-stroke { stroke:#2563eb; }
      `}</style>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 font-medium">
          <IoAlertCircleOutline className="text-lg shrink-0 mt-0.5" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600"><IoCloseCircleOutline /></button>
        </div>
      )}

      {/* ══ HUB VIEW ══ */}
      {activeTab === "hub" && (
        <div>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <IoReaderOutline className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">Content & Policies</h1>
                <p className="text-sm text-gray-500">Manage all platform policies and legal documents</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl">
            {HUB_CARDS.map((card) => {
              const CardIcon = card.icon;
              const colors = TAB_COLOR_MAP[card.color];
              return (
                <button
                  key={card.id}
                  onClick={() => { setActiveTab(card.id); navigate(`/admin/policies/${card.id}`); }}
                  className="group text-left bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-gray-300 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:ring-offset-2"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                      <CardIcon className={`text-2xl ${colors.iconColor}`} />
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${colors.badge}`}>{card.badge}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1.5 group-hover:text-[#0A84FF] transition-colors">{card.label}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{card.description}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-[#0A84FF] transition-colors">
                    <span>Edit Policy</span>
                    <IoChevronDownOutline className="-rotate-90 text-base" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ DETAIL VIEW ══ */}
      {activeTab !== "hub" && (
        <div>
          <div className="mb-6">
            <button
              onClick={() => { setActiveTab("hub"); navigate("/admin/policies"); }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#0A84FF] transition-colors mb-3 group"
            >
              <IoChevronDownOutline className="rotate-90 text-sm group-hover:-translate-x-0.5 transition-transform" />
              All Policies
            </button>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{currentTab?.label || "Policies"}</h1>
            <p className="text-sm text-gray-500">Edit and save platform policy content shown to users and experts</p>
          </div>

          {/* Pill Tab Bar */}
          <div className="mb-6">
            <div className="inline-flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto max-w-full">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); navigate(`/admin/policies/${tab.id}`); setError(""); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-150 ${isActive ? "bg-white text-[#0A84FF] shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/60"}`}
                  >
                    <Icon className="text-base" />
                    {tab.label}
                    {sectionState[tab.id]?.saved && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Terms & Conditions */}
          {activeTab === "legal" && (
            <SectionCard title="Terms & Conditions" description="Legal terms shown during login, registration, and booking confirmation" icon={IoDocumentTextOutline} color="blue" onSave={() => saveSection("legal")} saving={saving} saved={saved}>
              <PolicyBlock label="General Terms & Conditions (Login / Registration)" description="Terms accepted by users during login and registration." value={policySettings.general_terms} onChange={(v) => patch("general_terms", v)} placeholder="Write general terms and conditions here…" />
              <div className="border-t border-dashed border-slate-200" />
              <PolicyBlock label="Terms of Service" description="General legal terms shown during survey flow and booking confirmation." value={policySettings.terms_of_service} onChange={(v) => patch("terms_of_service", v)} placeholder="Write your terms of service here…" />
            </SectionCard>
          )}

          {/* Privacy Policy */}
          {activeTab === "privacy" && (
            <SectionCard title="Privacy Policy" description="Data collection, usage, and protection policies shown to users" icon={IoShieldCheckmarkOutline} color="indigo" onSave={() => saveSection("privacy")} saving={saving} saved={saved}>
              <PolicyBlock label="Privacy Policy" description="Privacy policy details regarding user data collection and protection." value={policySettings.privacy_policy} onChange={(v) => patch("privacy_policy", v)} placeholder="Write your privacy policy here…" />
            </SectionCard>
          )}

          {/* Cancellation & Refunds */}
          {activeTab === "cancellation" && (
            <SectionCard title="Cancellation & Refund Policies" description="Policies shown during booking flow, payment confirmations, and cancellation modal" icon={IoCardOutline} color="violet" onSave={() => saveSection("cancellation")} saving={saving} saved={saved}>
              <PolicyBlock label="Combined Checkout Policy" description="Shown in the popup right before the user pays the advance or remaining amount." value={policySettings.checkout_policy} onChange={(v) => patch("checkout_policy", v)} placeholder="Write combined checkout terms here…" />
              <div className="border-t border-dashed border-slate-200" />
              <PolicyBlock label="Booking Policy" description="Shown during booking requests and survey scheduling." value={policySettings.booking_policy} onChange={(v) => patch("booking_policy", v)} placeholder="Write your booking policy here…" />
              <div className="border-t border-dashed border-slate-200" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Cancellation Policy</label>
                    <p className="text-xs text-slate-400 mt-0.5">This exact text is shown to users inside the cancellation confirmation modal before they confirm cancelling their booking.</p>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 bg-red-50 border border-red-200 text-red-600 rounded-full shrink-0 ml-3">Shown in Cancel Modal</span>
                </div>
                <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-3">
                  <IoWalletOutline className="text-emerald-600 text-base shrink-0 mt-0.5" />
                  <p className="text-[11px] text-emerald-800 font-medium leading-relaxed"><strong>Refund flow:</strong> When a user cancels, the full advance payment is automatically credited to their JalaDhar wallet.</p>
                </div>
                <div className="policy-editor-wrap rounded-xl overflow-hidden border-2 border-red-100 shadow-sm">
                  <ReactQuill theme="snow" value={policySettings.cancellation_policy} onChange={(v) => patch("cancellation_policy", v)} modules={modules} formats={formats} placeholder="Write your cancellation terms here…" />
                </div>
              </div>
              <div className="border-t border-dashed border-slate-200" />
              <PolicyBlock label="Advance Payment Policy" description="Shown during initial advance payment confirmation (40% payment screen)." value={policySettings.advance_payment_policy} onChange={(v) => patch("advance_payment_policy", v)} placeholder="Write advance payment terms here…" />
              <div className="border-t border-dashed border-slate-200" />
              <PolicyBlock label="Remaining Payment Policy" description="Shown during final balance payment confirmation (60% payment screen)." value={policySettings.remaining_payment_policy} onChange={(v) => patch("remaining_payment_policy", v)} placeholder="Write remaining balance payment terms here…" />
              <div className="border-t border-dashed border-slate-200" />
              <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <IoWalletOutline className="text-emerald-600 text-xl shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 font-medium leading-relaxed">Refunds are automatically credited to the user's <strong>JalaDhar wallet</strong> upon cancellation.</p>
              </div>
              <PolicyBlock label="Refund Policy" description="Terms regarding money-back conditions and refund timelines." value={policySettings.refund_policy} onChange={(v) => patch("refund_policy", v)} placeholder="Write your refund policy here…" />
            </SectionCard>
          )}

          {/* Expert Agreement */}
          {activeTab === "expert" && (
            <SectionCard title="Expert Service Agreement" description="Agreement shown to experts before onboarding — accepted digitally on the Jaladhaara expert app" icon={IoPersonOutline} color="amber" onSave={() => saveSection("expert")} saving={saving} saved={saved}>
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <IoPersonOutline className="text-amber-600 text-xl shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800 mb-0.5">How Expert Agreement Works</p>
                  <p className="text-xs text-amber-700 leading-relaxed">This agreement is shown to experts during onboarding on the Jaladhaara Expert app. Experts must digitally accept it before they can receive bookings. All acceptances are logged under <strong>Expert Agreements</strong> in the sidebar for audit purposes.</p>
                </div>
              </div>
              <PolicyBlock label="Expert Service Agreement" description="Full agreement text — covers services, professional standards, payouts, code of conduct and termination." value={policySettings.expert_agreement} onChange={(v) => patch("expert_agreement", v)} placeholder="Write the expert service agreement here…" />
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}
