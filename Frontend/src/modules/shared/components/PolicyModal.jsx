import React, { useState, useEffect } from 'react';
import { 
  IoClose, 
  IoInformationCircleOutline, 
  IoShieldCheckmarkOutline, 
  IoRefreshCircleOutline,
  IoCheckmarkCircle,
  IoDocumentTextOutline
} from "react-icons/io5";
import { getPublicSettings } from "../../../services/settingsApi";

const PolicyModal = ({ type, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [policyData, setPolicyData] = useState(null);

  // Lock body scroll when modal is active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const response = await getPublicSettings('policy');
        if (response.success && response.data.settings) {
          const settings = response.data.settings;
          let key = '';
          if (type === 'general' || type === 'login') key = 'general_terms';
          else if (type === 'booking') key = 'booking_policy';
          else if (type === 'cancellation') key = 'cancellation_policy';
          else if (type === 'refund') key = 'refund_policy';
          else if (type === 'advance') key = 'advance_payment_policy';
          else if (type === 'remaining') key = 'remaining_payment_policy';
          else if (type === 'terms') key = 'terms_of_service';
          else if (type === 'privacy') key = 'privacy_policy';

          const policyItem = settings.find(s => s.key === key);
          if (policyItem && policyItem.value && policyItem.value.trim().length > 30) {
            setPolicyData(policyItem.value);
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
    terms: {
      title: "Terms of Service",
      icon: <IoShieldCheckmarkOutline className="text-emerald-500 text-2xl" />,
      sections: [
        {
          heading: "1. Platform Nature & Scope",
          points: [
            "Jaladhaara is a technology platform connecting customers with independent certified groundwater survey experts.",
            "Survey services are executed solely by the assigned hydrogeological expert. Jaladhaara acts as the facilitator and technology platform."
          ]
        },
        {
          heading: "2. Geological & Drilling Disclaimer",
          points: [
            "Groundwater occurrence depends on complex natural hydrogeological conditions.",
            "Survey reports represent scientific opinions based on surface observations and equipment readings.",
            "Jaladhaara does not guarantee drilling success, borewell depth, water yield, or water quality."
          ]
        },
        {
          heading: "3. Customer Responsibilities",
          points: [
            "Provide accurate survey location coordinates, land boundaries, and landmark details.",
            "Ensure safe physical site access for the survey expert and testing equipment.",
            "Obtain any necessary local permissions required for land inspection."
          ]
        },
        {
          heading: "4. Limitation of Liability",
          points: [
            "Jaladhaara is not liable for borewell drilling failure, dry borewells, financial losses, or drilling costs.",
            "Booking, cancellation, and refund requests are strictly governed by standard platform policies."
          ]
        }
      ]
    },
    privacy: {
      title: "Privacy Policy",
      icon: <IoShieldCheckmarkOutline className="text-blue-500 text-2xl" />,
      sections: [
        {
          heading: "1. Information Collection",
          points: [
            "We collect essential details including your name, contact phone number, email address, and survey location.",
            "Payment details are securely processed via certified payment gateways (Razorpay)."
          ]
        },
        {
          heading: "2. Purpose & Data Usage",
          points: [
            "Your location coordinates are used exclusively to enable assigned experts to navigate to your survey site.",
            "Contact details are utilized for booking notifications, OTP verifications, and report delivery."
          ]
        },
        {
          heading: "3. Information Sharing",
          points: [
            "Personal information is shared strictly with your assigned hydrogeological expert and authorized payment partners.",
            "We do not sell, rent, or trade your personal information to third-party advertisers."
          ]
        },
        {
          heading: "4. Security & User Rights",
          points: [
            "Industry-standard encryption and security protocols protect your data against unauthorized access.",
            "You retain full rights to update your personal details or request account data deletion at any time."
          ]
        }
      ]
    },
    general: {
      title: "General Terms & Conditions",
      icon: <IoShieldCheckmarkOutline className="text-blue-500 text-2xl" />,
      sections: [
        {
          heading: "1. General Guidelines",
          points: [
            "By logging in or creating an account, you agree to comply with Jaladhaara platform policies.",
            "Users must maintain account security and confidentiality of login credentials.",
            "Survey requests must represent genuine land testing requirements."
          ]
        }
      ]
    },
    booking: {
      title: "Booking Policy",
      icon: <IoInformationCircleOutline className="text-blue-500 text-2xl" />,
      sections: [
        {
          heading: "1. Appointment & Assignment",
          points: [
            "Bookings must be placed with valid site address and land details.",
            "Bookings are confirmed upon successful payment of advance fee.",
            "A qualified groundwater expert will be assigned based on locality and availability."
          ]
        }
      ]
    },
    cancellation: {
      title: "Cancellation Policy",
      icon: <IoRefreshCircleOutline className="text-amber-500 text-2xl" />,
      sections: [
        {
          heading: "1. Cancellation Terms",
          points: [
            "Full refund if cancelled at least 24 hours prior to scheduled visit.",
            "50% deduction if cancelled between 12-24 hours prior to visit.",
            "Non-refundable for cancellations made within 12 hours of appointment."
          ]
        }
      ]
    },
    refund: {
      title: "Refund Policy",
      icon: <IoRefreshCircleOutline className="text-emerald-500 text-2xl" />,
      sections: [
        {
          heading: "1. Refund Execution",
          points: [
            "Approved refunds are credited to the original payment source within 5-7 business days.",
            "100% refund provided if an expert fails to attend a confirmed appointment."
          ]
        }
      ]
    },
    advance: {
      title: "Advance Payment Policy",
      icon: <IoInformationCircleOutline className="text-blue-600 text-2xl" />,
      sections: [
        {
          heading: "1. Advance Structure",
          points: [
            "A 40% advance payment is required to lock your appointment slot.",
            "Instant digital payment receipts are issued upon payment completion."
          ]
        }
      ]
    },
    remaining: {
      title: "Remaining Payment Policy",
      icon: <IoInformationCircleOutline className="text-indigo-600 text-2xl" />,
      sections: [
        {
          heading: "1. Final Balance Settlement",
          points: [
            "The 60% balance is payable after site visit completion.",
            "Survey PDF report is unlocked immediately upon balance settlement."
          ]
        }
      ]
    }
  };

  const activePolicy = policies[type] || policies.terms;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh] transition-all transform scale-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-gray-100">
              {activePolicy.icon}
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900 leading-tight">
                {activePolicy.title}
              </h3>
              <p className="text-[11px] font-semibold text-gray-400 mt-0.5">
                Official Jaladhaara Document • Updated 2026
              </p>
            </div>
          </div>
        </div>

        {/* Policy Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-semibold">Loading document...</span>
            </div>
          ) : (
            /* Professional Point-by-Point Sections */
            activePolicy.sections.map((section, idx) => (
              <div key={idx} className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 space-y-2.5">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  {section.heading}
                </h4>
                <ul className="space-y-2.5 pl-1">
                  {section.points.map((pt, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed">
                      <IoCheckmarkCircle className="text-blue-500 text-sm shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.99]"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyModal;

