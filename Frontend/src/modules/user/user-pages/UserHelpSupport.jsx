import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoCallOutline,
    IoMailOutline,
    IoAlertCircleOutline,
    IoChevronDownOutline,
    IoChevronUpOutline,
    IoShieldCheckmarkOutline,
    IoBulbOutline,
    IoSparkles,
    IoChatbubblesOutline,
    IoArrowForward,
    IoSearchOutline,
    IoNavigateOutline,
    IoReceiptOutline,
    IoDocumentTextOutline,
    IoWaterOutline
} from "react-icons/io5";
import PageContainer from "../../shared/components/PageContainer";
import PolicyModal from "../../shared/components/PolicyModal";
import { useAuth } from "../../../contexts/AuthContext";

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
    const { user } = useAuth();
    const [openFaq, setOpenFaq] = useState(null);
    const [activePolicy, setActivePolicy] = useState(null);
    const [faqSearch, setFaqSearch] = useState("");

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const handleEmailSupport = (e) => {
        if (e) e.preventDefault();
        const email = "info@jaladhaaraapp.com";
        const userName = user?.name || "Valued Customer";
        const userPhone = user?.phone || "N/A";
        const subject = encodeURIComponent(`Jaladhaara Support Request - ${userName}`);
        const body = encodeURIComponent(
            `Hello Jaladhaara Support Team,\n\nI need assistance with my groundwater survey booking.\n\nUser Name: ${userName}\nPhone: ${userPhone}\n\nDetails:\n`
        );

        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
        const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;

        if (isMobile) {
            // On mobile devices, trigger system intent to launch native Gmail/Email app
            window.location.href = mailtoUrl;

            // Seamless fallback to Gmail Web if no native mail client catches the intent
            setTimeout(() => {
                window.open(gmailWebUrl, "_blank", "noopener,noreferrer");
            }, 600);
        } else {
            // On desktop/browsers where mailto fails if no local app is configured,
            // directly opening Gmail Compose in a new tab is 100% reliable
            window.open(gmailWebUrl, "_blank", "noopener,noreferrer");
        }
    };

    const filteredFaqs = useMemo(() => {
        const query = faqSearch.trim().toLowerCase();
        if (!query) return FAQS;
        return FAQS.filter(
            (f) =>
                f.q.toLowerCase().includes(query) ||
                f.a.toLowerCase().includes(query)
        );
    }, [faqSearch]);

    return (
        <PageContainer title="Help & Support">
            <div className="max-w-4xl mx-auto space-y-3.5 sm:space-y-4 pt-3 sm:pt-4 pb-8">
                {/* 24/7 AI-Powered Support Banner - Compact & Professional */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-3.5 sm:p-4 text-white shadow-md border border-indigo-900/40 relative overflow-hidden">
                    {/* Subtle ambient light */}
                    <div className="absolute -top-10 -right-10 w-36 h-36 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            {/* AI Sparkle Icon Avatar */}
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                                <IoSparkles className="text-xl text-amber-300" />
                            </div>

                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                                        Chat with Jaladhaara AI
                                    </h2>
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 shrink-0">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        Online
                                    </span>
                                </div>
                                <p className="text-[11px] sm:text-xs text-slate-300 truncate mt-0.5">
                                    24/7 instant answers for surveys &amp; bookings
                                </p>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <button
                            onClick={() => navigate("/user/support-chat")}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
                        >
                            <IoChatbubblesOutline className="text-base" />
                            <span>Start Live Chat</span>
                            <IoArrowForward className="text-sm" />
                        </button>
                    </div>
                </div>

                {/* 3-Column Quick Helpline Action Grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <a
                        href="tel:+918000000000"
                        className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs hover:border-blue-200 transition-all flex flex-col items-center text-center group cursor-pointer active:scale-98"
                    >
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-1.5 group-hover:scale-105 transition-transform shrink-0">
                            <IoCallOutline />
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold text-slate-900 leading-tight">Customer Call</span>
                        <span className="text-[10px] sm:text-xs text-blue-600 font-semibold mt-0.5 truncate max-w-full">
                            1800-000-0000
                        </span>
                    </a>

                    <button
                        type="button"
                        onClick={handleEmailSupport}
                        className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs hover:border-purple-200 transition-all flex flex-col items-center text-center group cursor-pointer active:scale-98 w-full"
                        title="Open in Gmail or Mail App"
                    >
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl mb-1.5 group-hover:scale-105 transition-transform shrink-0">
                            <IoMailOutline />
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold text-slate-900 leading-tight">Email Support</span>
                        <span className="text-[10px] sm:text-xs text-purple-600 font-semibold mt-0.5 truncate max-w-full">
                            Quick Reply
                        </span>
                    </button>

                    <button
                        onClick={() => navigate("/user/disputes/create")}
                        className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs hover:border-orange-200 transition-all flex flex-col items-center text-center group cursor-pointer active:scale-98"
                    >
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl mb-1.5 group-hover:scale-105 transition-transform shrink-0">
                            <IoAlertCircleOutline />
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold text-slate-900 leading-tight">Raise Issue</span>
                        <span className="text-[10px] sm:text-xs text-orange-600 font-semibold mt-0.5 truncate max-w-full">
                            File Ticket
                        </span>
                    </button>
                </div>

                {/* Company Policies & Legal Information */}
                <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-2xs">
                    <div className="flex items-center gap-2 mb-2.5">
                        <IoShieldCheckmarkOutline className="text-purple-600 text-base sm:text-lg" />
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                            Platform Policies &amp; Terms
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <button
                            onClick={() => setActivePolicy("user_agreement")}
                            className="py-2 px-2.5 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-100 rounded-xl text-center text-[11px] sm:text-xs font-bold text-blue-900 transition-all col-span-2 sm:col-span-1 active:scale-98 cursor-pointer"
                        >
                            User Agreement
                        </button>
                        <button
                            onClick={() => setActivePolicy("terms")}
                            className="py-2 px-2.5 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 border border-slate-100 rounded-xl text-center text-[11px] sm:text-xs font-semibold text-slate-700 transition-all active:scale-98 cursor-pointer"
                        >
                            Terms of Service
                        </button>
                        <button
                            onClick={() => setActivePolicy("privacy")}
                            className="py-2 px-2.5 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 border border-slate-100 rounded-xl text-center text-[11px] sm:text-xs font-semibold text-slate-700 transition-all active:scale-98 cursor-pointer"
                        >
                            Privacy Policy
                        </button>
                        <button
                            onClick={() => setActivePolicy("cancellation")}
                            className="py-2 px-2.5 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 border border-slate-100 rounded-xl text-center text-[11px] sm:text-xs font-semibold text-slate-700 transition-all active:scale-98 cursor-pointer"
                        >
                            Cancellation
                        </button>
                        <button
                            onClick={() => setActivePolicy("refund")}
                            className="py-2 px-2.5 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 border border-slate-100 rounded-xl text-center text-[11px] sm:text-xs font-semibold text-slate-700 transition-all active:scale-98 cursor-pointer"
                        >
                            Refund Policy
                        </button>
                    </div>
                </div>

                {/* FAQs Section */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-2xs space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">FAQs</h2>
                            <p className="text-xs text-slate-500">Frequently Asked Questions</p>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-500 shrink-0">
                            <IoBulbOutline className="text-lg" />
                        </div>
                    </div>

                    {/* FAQ Search */}
                    <div className="relative">
                        <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                        <input
                            type="text"
                            value={faqSearch}
                            onChange={(e) => setFaqSearch(e.target.value)}
                            placeholder="Search questions or keywords..."
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 transition-colors"
                        />
                    </div>

                    {/* Accordion List */}
                    <div className="space-y-2 pt-1">
                        {filteredFaqs.length === 0 ? (
                            <div className="text-center py-6 text-xs text-slate-400">
                                No questions found matching "{faqSearch}"
                            </div>
                        ) : (
                            filteredFaqs.map((faq, idx) => {
                                const isOpen = openFaq === idx;
                                return (
                                    <div
                                        key={idx}
                                        className={`border rounded-xl transition-all overflow-hidden ${
                                            isOpen
                                                ? "border-slate-300 shadow-2xs bg-slate-50/50"
                                                : "border-slate-100 hover:border-slate-200 bg-white"
                                        }`}
                                    >
                                        <button
                                            onClick={() => toggleFaq(idx)}
                                            className="w-full p-3 sm:p-3.5 text-left font-semibold text-xs sm:text-sm text-slate-800 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                                        >
                                            <span className="leading-snug">{faq.q}</span>
                                            <div className="p-1 rounded-full text-slate-400 shrink-0">
                                                {isOpen ? (
                                                    <IoChevronUpOutline className="text-base text-slate-600" />
                                                ) : (
                                                    <IoChevronDownOutline className="text-base" />
                                                )}
                                            </div>
                                        </button>

                                        {isOpen && (
                                            <div className="px-3 sm:px-3.5 pb-3 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-white pt-2">
                                                {faq.a}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
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
