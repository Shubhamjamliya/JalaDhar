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
    IoDocumentTextOutline,
    IoHeadsetOutline,
    IoBulbOutline
} from "react-icons/io5";
import PageContainer from "../../shared/components/PageContainer";
import PolicyModal from "../../shared/components/PolicyModal";

const FAQS = [
    {
        q: "What is an Agriculture Groundwater Survey?",
        a: "An Agriculture Groundwater Survey is conducted on agricultural land to assess the geological and subsurface conditions and relevant groundwater indicators, and to identify a suitable location for borewell drilling."
    },
    {
        q: "What is a Household Groundwater Survey?",
        a: "A Household Groundwater Survey is conducted for houses, residential plots and individual properties to assess the site and relevant subsurface conditions and identify a suitable location for borewell drilling for household water requirements."
    },
    {
        q: "What is a Commercial Groundwater Survey?",
        a: "A Commercial Groundwater Survey is conducted for commercial properties such as offices, apartments, hotels, institutions, shops and other commercial premises to assess groundwater conditions and identify suitable locations for borewell drilling."
    },
    {
        q: "What is an Industrial Groundwater Survey?",
        a: "An Industrial Groundwater Survey is conducted for factories, plants, warehouses and other industrial properties to assess geological and subsurface conditions and identify suitable borewell drilling locations based on the site's groundwater potential."
    },
    {
        q: "What does the survey cover?",
        a: "Assessment of the site, geological and subsurface conditions, and relevant groundwater indicators to recommend a drilling location."
    },
    {
        q: "Will I get the estimated drilling depth?",
        a: "Where technically feasible, the expert will provide an estimated drilling depth based on the survey findings."
    },
    {
        q: "Will I receive a survey report?",
        a: "Yes. A digital survey report will be submitted through the Jaladhaara app."
    },
    {
        q: "Can I request multiple drilling points?",
        a: "Yes, if multiple points are included in the selected survey package."
    },
    {
        q: "Does the survey guarantee water or borewell success?",
        a: "No. The survey provides a professional assessment and recommendation. Groundwater availability, yield, quality, depth and borewell success cannot be guaranteed."
    },
    {
        q: "Is borewell drilling included, and who conducts the survey?",
        a: "No. Borewell drilling is separate. The survey is conducted by a verified groundwater survey expert assigned through Jaladhaara."
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

                {/* FAQs Section — Pixel Perfect Match with Design Mockup */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                    {/* Header with Title and Lightbulb Icon */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">FAQs</h2>
                            <p className="text-sm font-semibold text-slate-500 mt-0.5">Frequently Asked Questions</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-xs">
                            <IoBulbOutline className="text-2xl" />
                        </div>
                    </div>

                    {/* Accordion List */}
                    <div className="space-y-3">
                        {FAQS.map((faq, idx) => {
                            const isOpen = openFaq === idx;
                            return (
                                <div
                                    key={idx}
                                    className={`border rounded-2xl transition-all overflow-hidden ${
                                        isOpen ? "border-slate-300 shadow-sm bg-slate-50/40" : "border-slate-200/80 hover:border-slate-300 bg-white"
                                    }`}
                                >
                                    <button
                                        onClick={() => toggleFaq(idx)}
                                        className="w-full p-4 text-left font-bold text-sm text-slate-800 flex items-center justify-between gap-4 transition-colors cursor-pointer"
                                    >
                                        <span className="leading-snug">Q{idx + 1}. {faq.q}</span>
                                        <div className="p-1 rounded-full text-slate-400 transition-colors">
                                            {isOpen ? (
                                                <IoChevronUpOutline className="text-lg text-slate-600" />
                                            ) : (
                                                <IoChevronDownOutline className="text-lg" />
                                            )}
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
