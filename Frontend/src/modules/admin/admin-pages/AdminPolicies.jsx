import { useState, useEffect } from "react";
import { IoReaderOutline, IoShieldCheckmarkOutline } from "react-icons/io5";
import { getAllSettings, updateMultipleSettings } from "../../../services/adminApi";
import ErrorMessage from "../../shared/components/ErrorMessage";
import { useToast } from "../../../hooks/useToast";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'clean'],
    [{ 'color': [] }, { 'background': [] }],
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'link',
  'color', 'background',
];

const DEFAULT_POLICIES = {
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
  <li><strong>Late Cancellation:</strong> 50% of the advance amount will be forfeited if cancelled between 12-24 hours before the visit.</li>
  <li><strong>Same Day Cancellation:</strong> No refund for cancellations made within 12 hours of the visit.</li>
</ul>`,
  refund_policy: `<ul>
  <li><strong>Refund Processing:</strong> Approved refunds will be processed back to the original payment method within 5-7 business days.</li>
  <li><strong>Failed Survey Visits:</strong> If an expert fails to attend due to platform issues, a 100% refund will be issued.</li>
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
  terms_of_service: `<ul>
  <li>The location provided must be accurate and accessible for the expert and equipment.</li>
  <li>While we use scientific methods, water yield results are estimates based on geographical data and do not guarantee 100% success.</li>
  <li>Customers are responsible for obtaining any local permissions required for the survey.</li>
  <li>All reports are for informational purposes only.</li>
</ul>`
};

export default function AdminPolicies() {
  const toast = useToast();
  const [error, setError] = useState("");
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [policySettings, setPolicySettings] = useState(DEFAULT_POLICIES);

  // Load policy settings
  useEffect(() => {
    const loadPolicySettings = async () => {
      try {
        setLoading(true);
        const response = await getAllSettings('policy');
        if (response.success && response.data.settings) {
          const settingsObj = {};
          response.data.settings.forEach(setting => {
            if (setting.value && setting.value.trim() !== "") {
              settingsObj[setting.key] = setting.value;
            }
          });
          setPolicySettings(prev => ({
            ...DEFAULT_POLICIES,
            ...settingsObj
          }));
        }
      } catch (err) {
        console.error('Error loading policy settings:', err);
        setError("Failed to load policy settings");
      } finally {
        setLoading(false);
      }
    };
    loadPolicySettings();
  }, []);

  const handlePolicySettingsUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setPoliciesLoading(true);

    try {
      const settings = [
        { key: 'general_terms', value: policySettings.general_terms },
        { key: 'booking_policy', value: policySettings.booking_policy },
        { key: 'cancellation_policy', value: policySettings.cancellation_policy },
        { key: 'refund_policy', value: policySettings.refund_policy },
        { key: 'advance_payment_policy', value: policySettings.advance_payment_policy },
        { key: 'remaining_payment_policy', value: policySettings.remaining_payment_policy },
        { key: 'terms_of_service', value: policySettings.terms_of_service },
      ];

      const response = await updateMultipleSettings(settings);
      if (response.success) {
        toast.showSuccess("Policies updated successfully!");
      } else {
        setError(response.message || "Failed to update policies");
      }
    } catch (err) {
      console.error("Update policy settings error:", err);
      setError(err.response?.data?.message || "Failed to update policies. Please try again.");
    } finally {
      setPoliciesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A84FF]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)]">
      <style>{`
                .quill {
                    background: white;
                    border-radius: 0.5rem;
                }
                .ql-toolbar.ql-snow {
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                    border-color: #e5e7eb;
                    background: #f9fafb;
                }
                .ql-container.ql-snow {
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                    border-color: #e5e7eb;
                    min-height: 200px;
                    font-size: 0.875rem;
                }
                .ql-editor {
                    min-height: 200px;
                }
                .ql-editor.ql-blank::before {
                    color: #9ca3af;
                    font-style: normal;
                }
                .ql-snow.ql-toolbar button:hover,
                .ql-snow .ql-toolbar button:hover,
                .ql-snow.ql-toolbar button:focus,
                .ql-snow .ql-toolbar button:focus,
                .ql-snow.ql-toolbar button.ql-active,
                .ql-snow .ql-toolbar button.ql-active,
                .ql-snow.ql-toolbar .ql-picker-label:hover,
                .ql-snow .ql-toolbar .ql-picker-label:hover,
                .ql-snow.ql-toolbar .ql-picker-label.ql-active,
                .ql-snow .ql-toolbar .ql-picker-label.ql-active,
                .ql-snow.ql-toolbar .ql-picker-item:hover,
                .ql-snow .ql-toolbar .ql-picker-item:hover,
                .ql-snow.ql-toolbar .ql-picker-item.ql-selected,
                .ql-snow .ql-toolbar .ql-picker-item.ql-selected {
                    color: #0A84FF;
                }
                .ql-snow.ql-toolbar button:hover .ql-stroke,
                .ql-snow .ql-toolbar button:hover .ql-stroke,
                .ql-snow.ql-toolbar button:focus .ql-stroke,
                .ql-snow .ql-toolbar button:focus .ql-stroke,
                .ql-snow.ql-toolbar button.ql-active .ql-stroke,
                .ql-snow .ql-toolbar button.ql-active .ql-stroke,
                .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke,
                .ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke,
                .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke,
                .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke,
                .ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke,
                .ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke,
                .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke,
                .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-stroke {
                    stroke: #0A84FF;
                }
            `}</style>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <IoReaderOutline className="text-[#0A84FF]" />
          Policy Management
        </h1>
        <p className="text-gray-600">Edit the policies shown to users across the platform using a rich text editor</p>
      </div>

      <div className="max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <ErrorMessage message={error} />

          <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
            <IoShieldCheckmarkOutline className="text-green-500" />
            Use the toolbar to format your text. The changes will be saved as HTML.
          </p>

          <form onSubmit={handlePolicySettingsUpdate} className="space-y-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                General Terms & Conditions (Login / Registration)
              </label>
              <p className="text-xs text-gray-500 mb-2">Terms accepted by users during login and registration.</p>
              <ReactQuill
                theme="snow"
                value={policySettings.general_terms}
                onChange={(content) => setPolicySettings(prev => ({ ...prev, general_terms: content }))}
                modules={modules}
                formats={formats}
                placeholder="Write general terms and conditions here..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Booking Policy
              </label>
              <p className="text-xs text-gray-500 mb-2">Shown during booking requests and survey scheduling.</p>
              <ReactQuill
                theme="snow"
                value={policySettings.booking_policy}
                onChange={(content) => setPolicySettings(prev => ({ ...prev, booking_policy: content }))}
                modules={modules}
                formats={formats}
                placeholder="Write your booking policy here..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Cancellation Policy
              </label>
              <p className="text-xs text-gray-500 mb-2">Terms regarding booking cancellations.</p>
              <ReactQuill
                theme="snow"
                value={policySettings.cancellation_policy}
                onChange={(content) => setPolicySettings(prev => ({ ...prev, cancellation_policy: content }))}
                modules={modules}
                formats={formats}
                placeholder="Write your cancellation policy here..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Refund Policy
              </label>
              <p className="text-xs text-gray-500 mb-2">Terms regarding money-back conditions and refund timelines.</p>
              <ReactQuill
                theme="snow"
                value={policySettings.refund_policy}
                onChange={(content) => setPolicySettings(prev => ({ ...prev, refund_policy: content }))}
                modules={modules}
                formats={formats}
                placeholder="Write your refund policy here..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Advance Payment Policy
              </label>
              <p className="text-xs text-gray-500 mb-2">Shown during initial advance payment confirmation.</p>
              <ReactQuill
                theme="snow"
                value={policySettings.advance_payment_policy}
                onChange={(content) => setPolicySettings(prev => ({ ...prev, advance_payment_policy: content }))}
                modules={modules}
                formats={formats}
                placeholder="Write advance payment terms here..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Remaining Payment Policy
              </label>
              <p className="text-xs text-gray-500 mb-2">Shown during final balance payment confirmation.</p>
              <ReactQuill
                theme="snow"
                value={policySettings.remaining_payment_policy}
                onChange={(content) => setPolicySettings(prev => ({ ...prev, remaining_payment_policy: content }))}
                modules={modules}
                formats={formats}
                placeholder="Write remaining balance payment terms here..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Terms of Service
              </label>
              <p className="text-xs text-gray-500 mb-2">General legal terms for using JalaDhar.</p>
              <ReactQuill
                theme="snow"
                value={policySettings.terms_of_service}
                onChange={(content) => setPolicySettings(prev => ({ ...prev, terms_of_service: content }))}
                modules={modules}
                formats={formats}
                placeholder="Write your terms of service here..."
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={policiesLoading}
                className="px-8 py-3 bg-[#0A84FF] text-white rounded-lg hover:bg-[#005BBB] transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-200"
              >
                {policiesLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {policiesLoading ? "Updating Policies..." : "Save All Policies"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
