import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoHelpCircleOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoShieldCheckmarkOutline,
  IoBulbOutline,
  IoSearchOutline
} from "react-icons/io5";

export const VENDOR_EXPERT_FAQS = [
  {
    q: "What is an Agriculture Groundwater Survey?",
    a: "An Agriculture Groundwater Survey is conducted for agricultural land and farming activities, including crop fields, plantations, orchards, nurseries and other agricultural properties, to assess groundwater conditions and identify a suitable borewell drilling location."
  },
  {
    q: "What is a Household Groundwater Survey?",
    a: "A Household Groundwater Survey is conducted for residential properties, including individual houses, residential plots, villas, apartments and residential layouts, to assess the site's groundwater conditions and identify a suitable location for borewell drilling for household water requirements."
  },
  {
    q: "What is a Commercial Groundwater Survey?",
    a: "A Commercial Groundwater Survey is conducted for properties used for commercial activities, including shops, offices, hotels, restaurants, hospitals, schools, colleges, commercial complexes, malls, apartments used for commercial purposes and other business establishments, to identify suitable borewell drilling locations."
  },
  {
    q: "What is an Industrial Groundwater Survey?",
    a: "An Industrial Groundwater Survey is conducted for industrial and manufacturing properties, including factories, manufacturing units, industrial plants, warehouses, processing units, industrial parks and other industrial facilities, to assess groundwater conditions and identify suitable borewell drilling locations."
  },
  {
    q: "What should I assess during the survey?",
    a: "Assess the site using the applicable groundwater exploration methods, considering geological, geophysical and subsurface conditions and relevant groundwater indicators, and identify the most suitable drilling location."
  },
  {
    q: "What information should I provide in the survey report?",
    a: "Record the survey findings, recommended drilling point, estimated drilling depth where technically feasible, observations, applicable technical details and required site evidence as specified in the app."
  },
  {
    q: "What evidence is required after completing the survey?",
    a: "Submit the required site photographs, survey observations, location details and other supporting evidence through the Jaladhaara app as applicable to the booking."
  },
  {
    q: "Can I recommend multiple drilling points?",
    a: "Yes, where the customer's selected package includes multiple points. Each recommended point should be clearly identified and documented in the survey report."
  },
  {
    q: "Can I guarantee water or borewell success?",
    a: "No. You must not guarantee groundwater availability, yield, quality, drilling depth or borewell success. The report should reflect your professional assessment based on the survey findings."
  },
  {
    q: "Is borewell drilling part of my responsibility?",
    a: "No. Your responsibility is to conduct the assigned groundwater survey professionally and submit the required findings and report through Jaladhaara. Borewell drilling is a separate activity arranged by the customer."
  }
];

export default function VendorHelpSupport() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const filteredFaqs = VENDOR_EXPERT_FAQS.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-extrabold">
            <IoBulbOutline className="text-amber-400 text-sm" />
            <span>Expert Knowledge Base</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Groundwater Survey FAQs – Expert App
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl">
            Official guidelines, survey standards, assessment procedures, and reporting expectations for Jaladhaara Hydrogeological Survey Experts.
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search expert FAQs (e.g. report evidence, drilling depth, multiple points)..."
          className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-slate-200 shadow-2xs text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0A84FF] transition-all"
        />
      </div>

      {/* FAQ Accordion List Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              10 Official Guidelines for Groundwater Survey Experts
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-2xs shrink-0">
            <IoBulbOutline className="text-2xl" />
          </div>
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No FAQs matching your search query "{searchQuery}".
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`border rounded-2xl transition-all overflow-hidden ${
                    isOpen
                      ? "border-slate-300 shadow-2xs bg-slate-50/40"
                      : "border-slate-200/80 hover:border-slate-300 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-800 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <span className="leading-snug text-slate-900 font-extrabold">
                      Q{idx + 1}. {faq.q}
                    </span>
                    <div className="p-1 rounded-full text-slate-400 shrink-0">
                      {isOpen ? (
                        <IoChevronUpOutline className="text-base text-slate-600" />
                      ) : (
                        <IoChevronDownOutline className="text-base" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-100 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Support Action Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => navigate("/vendor/disputes")}
          className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-[#0A84FF] transition-all flex items-center gap-4 text-left group cursor-pointer"
        >
          <div className="p-3 rounded-2xl bg-blue-50 text-[#0A84FF] text-2xl group-hover:scale-105 transition-transform">
            <IoHelpCircleOutline />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Partner Resolution Center</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Need help with a booking dispute or issue?</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/vendor/agreement")}
          className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-500 transition-all flex items-center gap-4 text-left group cursor-pointer"
        >
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 text-2xl group-hover:scale-105 transition-transform">
            <IoShieldCheckmarkOutline />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Expert Standards & Agreement</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">View your official Jaladhaara Partner terms</p>
          </div>
        </button>
      </div>
    </div>
  );
}
