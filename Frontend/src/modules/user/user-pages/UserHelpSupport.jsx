import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoHelpCircleOutline,
    IoCallOutline,
    IoMailOutline,
    IoLogoWhatsapp,
    IoAlertCircleOutline,
    IoChevronDownOutline,
    IoChevronUpOutline,
    IoShieldCheckmarkOutline,
    IoDocumentTextOutline
} from "react-icons/io5";
import PageContainer from "../../shared/components/PageContainer";
import PolicyModal from "../../shared/components/PolicyModal";

const FAQS = [
    {
        q: "How do I book a groundwater hydrogeological survey?",
        a: "Navigate to the Book Survey section on your Dashboard, select your survey type (Agriculture, Commercial, Residential, etc.), provide your land location details, and choose your preferred hydrogeologist expert."
    },
    {
        q: "Are the survey reports 100% guaranteed for borewell success?",
        a: "Hydrogeological surveys use scientific methods and geophysical instruments (Dowsing, 3D Locators, PQWT, ADMT) to identify potential aquifers. However, groundwater occurrence is governed by natural geological formations, so reports represent professional scientific opinions."
    },
    {
        q: "How can I view or download my survey report?",
        a: "Go to the Survey Reports menu option. Once the expert completes the field visit and uploads findings, you can view and download the official PDF report."
    },
    {
        q: "What is the advance payment policy?",
        a: "A 40% advance payment is required to confirm your expert booking slot. The remaining 60% balance is payable after the physical survey visit."
    },
    {
        q: "What should I do if I have an issue with an expert or booking?",
        a: "You can raise a formal issue by visiting the Disputes section in your menu and clicking 'Create Dispute'. Our dedicated support team will review and resolve it promptly."
    }
];

export default function UserHelpSupport() {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);
    const [activePolicy, setActivePolicy] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <PageContainer title="Help & Support">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
                            <IoHelpCircleOutline className="text-2xl text-white" />
                        </div>
                        <h1 className="text-2xl font-bold">Customer Support & FAQs</h1>
                    </div>
                    <p className="text-purple-100 text-sm max-w-xl">
                        Have questions or need assistance with your booking? We are here to support you 24/7.
                    </p>
                </div>

                {/* Contact Helpline Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href="tel:+918000000000"
                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
                    >
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <IoCallOutline className="text-2xl" />
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 font-semibold block">Customer Helpline</span>
                            <span className="text-sm font-bold text-gray-900">+91 800-000-0000</span>
                        </div>
                    </a>

                    <a
                        href="mailto:support@jaladhaaraapp.in"
                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
                    >
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <IoMailOutline className="text-2xl" />
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 font-semibold block">Email Support</span>
                            <span className="text-sm font-bold text-gray-900">support@jaladhaaraapp.in</span>
                        </div>
                    </a>

                    <button
                        onClick={() => navigate("/user/disputes/create")}
                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group text-left"
                    >
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <IoAlertCircleOutline className="text-2xl" />
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 font-semibold block">Raise Issue</span>
                            <span className="text-sm font-bold text-gray-900">Create Dispute Ticket</span>
                        </div>
                    </button>
                </div>

                {/* Company Policies */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <IoShieldCheckmarkOutline className="text-purple-600 text-xl" />
                        Platform Policies & Legal Information
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <button
                            onClick={() => setActivePolicy("terms")}
                            className="p-3 bg-gray-50 hover:bg-purple-50 border border-gray-100 rounded-2xl text-center text-xs font-bold text-gray-700 hover:text-purple-700 transition-all"
                        >
                            Terms of Service
                        </button>
                        <button
                            onClick={() => setActivePolicy("privacy")}
                            className="p-3 bg-gray-50 hover:bg-purple-50 border border-gray-100 rounded-2xl text-center text-xs font-bold text-gray-700 hover:text-purple-700 transition-all"
                        >
                            Privacy Policy
                        </button>
                        <button
                            onClick={() => setActivePolicy("cancellation")}
                            className="p-3 bg-gray-50 hover:bg-purple-50 border border-gray-100 rounded-2xl text-center text-xs font-bold text-gray-700 hover:text-purple-700 transition-all"
                        >
                            Cancellation Policy
                        </button>
                        <button
                            onClick={() => setActivePolicy("refund")}
                            className="p-3 bg-gray-50 hover:bg-purple-50 border border-gray-100 rounded-2xl text-center text-xs font-bold text-gray-700 hover:text-purple-700 transition-all"
                        >
                            Refund Policy
                        </button>
                    </div>
                </div>

                {/* FAQs Section */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-gray-900 mb-2">Frequently Asked Questions</h3>

                    <div className="space-y-3">
                        {FAQS.map((faq, idx) => (
                            <div key={idx} className="border border-gray-100 rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full p-4 text-left font-bold text-sm text-gray-800 bg-gray-50/50 hover:bg-gray-50 flex items-center justify-between gap-4 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    {openFaq === idx ? (
                                        <IoChevronUpOutline className="text-purple-600 shrink-0" />
                                    ) : (
                                        <IoChevronDownOutline className="text-gray-400 shrink-0" />
                                    )}
                                </button>

                                {openFaq === idx && (
                                    <div className="p-4 bg-white text-xs text-gray-600 leading-relaxed border-t border-gray-100">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Active Policy Modal */}
            {activePolicy && (
                <PolicyModal type={activePolicy} onClose={() => setActivePolicy(null)} />
            )}
        </PageContainer>
    );
}
