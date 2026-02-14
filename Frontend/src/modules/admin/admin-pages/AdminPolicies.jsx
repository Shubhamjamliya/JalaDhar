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

export default function AdminPolicies() {
  const toast = useToast();
  const [error, setError] = useState("");
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [policySettings, setPolicySettings] = useState({
    booking_policy: "",
    cancellation_policy: "",
    terms_of_service: "",
  });

  // Load policy settings
  useEffect(() => {
    const loadPolicySettings = async () => {
      try {
        setLoading(true);
        const response = await getAllSettings('policy');
        if (response.success && response.data.settings) {
          const settingsObj = {};
          response.data.settings.forEach(setting => {
            settingsObj[setting.key] = setting.value;
          });
          setPolicySettings(prev => ({
            ...prev,
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
        { key: 'booking_policy', value: policySettings.booking_policy },
        { key: 'cancellation_policy', value: policySettings.cancellation_policy },
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
                Booking & Payment Policy
              </label>
              <p className="text-xs text-gray-500 mb-2">Shown during the final step of the booking process.</p>
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
                Cancellation & Refund Policy
              </label>
              <p className="text-xs text-gray-500 mb-2">Terms regarding cancellations and money back.</p>
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
