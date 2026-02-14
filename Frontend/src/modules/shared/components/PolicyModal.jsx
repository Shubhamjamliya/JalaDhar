import React, { useState, useEffect } from 'react';
import { IoClose, IoInformationCircleOutline, IoShieldCheckmarkOutline, IoRefreshCircleOutline } from "react-icons/io5";
import { getPublicSettings } from "../../../services/settingsApi";

const PolicyModal = ({ type, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [policyData, setPolicyData] = useState(null);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const response = await getPublicSettings('policy');
        if (response.success && response.data.settings) {
          const settings = response.data.settings;
          let key = '';
          if (type === 'booking') key = 'booking_policy';
          else if (type === 'refund') key = 'cancellation_policy';
          else if (type === 'terms') key = 'terms_of_service';

          const policy = settings.find(s => s.key === key);
          if (policy) {
            setPolicyData(policy.value);
          }
        }
      } catch (error) {
        console.error("Error fetching policy:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [type]);

  const policies = {
    booking: {
      title: "Booking & Payment Policy",
      icon: <IoInformationCircleOutline className="text-blue-500" />,
      fallback: (
        <ul className="list-disc pl-5 space-y-3">
          <li><strong>Advance Payment:</strong> A 40% advance payment of the total service fee is required to confirm your booking slot.</li>
          <li><strong>Payment Confirmation:</strong> Your booking is only confirmed once the payment is successfully processed.</li>
          <li><strong>Balance Payment:</strong> The remaining 60% of the service fee must be paid after the survey visit is completed and before the final report is released.</li>
          <li><strong>Pricing:</strong> Total amount includes base service fee, travel charges based on distance, and applicable GST (18%).</li>
        </ul>
      )
    },
    refund: {
      title: "Cancellation & Refund Policy",
      icon: <IoRefreshCircleOutline className="text-orange-500" />,
      fallback: (
        <ul className="list-disc pl-5 space-y-3">
          <li><strong>Cancellation Before 24h:</strong> Full refund of the advance payment if cancelled at least 24 hours before the scheduled visit.</li>
          <li><strong>Late Cancellation:</strong> 50% of the advance amount will be forfeited if cancelled between 12-24 hours before the scheduled time.</li>
          <li><strong>No Refund:</strong> No refund will be provided for cancellations made within 12 hours of the scheduled visit or if the expert has already reached the site.</li>
          <li><strong>Processing Time:</strong> Refunds, if applicable, will be processed back to the original payment method within 5-7 business days.</li>
        </ul>
      )
    },
    terms: {
      title: "Terms of Service",
      icon: <IoShieldCheckmarkOutline className="text-green-500" />,
      fallback: (
        <ul className="list-disc pl-5 space-y-3">
          <li>The location provided must be accurate and accessible for the expert and equipment.</li>
          <li>While we use scientific methods, water yield results are estimates based on geographical data and do not guarantee 100% success.</li>
          <li>Customers are responsible for obtaining any local permissions required for the survey.</li>
          <li>All reports are for informational purposes only.</li>
        </ul>
      )
    }
  };

  const policy = policies[type] || policies.terms;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{policy.icon}</span>
            <h3 className="text-xl font-bold text-gray-900">{policy.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <IoClose className="text-xl text-gray-400" />
          </button>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 leading-relaxed mb-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            policyData ? (
              <div dangerouslySetInnerHTML={{ __html: policyData }} className="policy-content" />
            ) : (
              policy.fallback
            )
          )}
        </div>
        <button
          onClick={onClose}
          className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg active:scale-[0.98] transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PolicyModal;
