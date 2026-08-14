import React, { useState } from "react";
import {
  IoHelpCircleOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoInformationCircleOutline,
  IoShieldCheckmarkOutline,
  IoAlertCircleOutline
} from "react-icons/io5";

const FAQS = [
  {
    id: 1,
    question: "What is an Agriculture Groundwater Survey?",
    answer:
      "An Agriculture Groundwater Survey is conducted for agricultural land and farming activities, including crop fields, plantations, orchards, nurseries and other agricultural properties, to assess groundwater conditions and identify a suitable borewell drilling location."
  },
  {
    id: 2,
    question: "What is a Household Groundwater Survey?",
    answer:
      "A Household Groundwater Survey is conducted for residential properties, including individual houses, residential plots, villas, apartments and residential layouts, to assess the site's groundwater conditions and identify a suitable location for borewell drilling for household water requirements."
  },
  {
    id: 3,
    question: "What is a Commercial Groundwater Survey?",
    answer:
      "A Commercial Groundwater Survey is conducted for properties used for commercial activities, including shops, offices, hotels, restaurants, hospitals, schools, colleges, commercial complexes, malls, apartments used for commercial purposes and other business establishments, to identify suitable borewell drilling locations."
  },
  {
    id: 4,
    question: "What is an Industrial Groundwater Survey?",
    answer:
      "An Industrial Groundwater Survey is conducted for industrial and manufacturing properties, including factories, manufacturing units, industrial plants, warehouses, processing units, industrial parks and other industrial facilities, to assess groundwater conditions and identify suitable borewell drilling locations."
  },
  {
    id: 5,
    question: "What should I assess during the survey?",
    answer:
      "Assess the site using applicable groundwater exploration methods, considering geological, geophysical and subsurface conditions and relevant groundwater indicators, and identify the most suitable drilling location."
  },
  {
    id: 6,
    question: "What information should I provide in the survey report?",
    answer:
      "Record the survey findings, recommended drilling point, estimated drilling depth where technically feasible, observations, applicable technical details and required site evidence as specified in the app."
  },
  {
    id: 7,
    question: "What evidence is required after completing the survey?",
    answer:
      "Submit the required site photographs, survey observations, location details and other supporting evidence through the Jaladhaara app as applicable to the booking."
  },
  {
    id: 8,
    question: "Can I recommend multiple drilling points?",
    answer:
      "Yes, where the customer's selected package includes multiple points. Each recommended point should be clearly identified and documented in the survey report."
  },
  {
    id: 9,
    question: "Can I guarantee water or borewell success?",
    answer:
      "No. You must not guarantee groundwater availability, yield, quality, drilling depth or borewell success. The report should reflect your professional assessment based on the survey findings."
  },
  {
    id: 10,
    question: "Is borewell drilling part of my responsibility?",
    answer:
      "No. Your responsibility is to conduct the assigned groundwater survey professionally and submit the required findings and report through Jaladhaara. Borewell drilling is a separate activity arranged by the customer."
  }
];

export default function GroundwaterSurveyFAQSection() {
  const [openIds, setOpenIds] = useState([1]); // First FAQ open by default

  const toggleFAQ = (id) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const expandAll = () => {
    if (openIds.length === FAQS.length) {
      setOpenIds([]);
    } else {
      setOpenIds(FAQS.map((f) => f.id));
    }
  };

  return (
    <div className="mt-3 space-y-3.5">
      {/* FAQ Header & Container */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0A84FF] flex items-center justify-center text-lg shrink-0">
              <IoHelpCircleOutline />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Groundwater Survey FAQs
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Standard guidelines, survey scope, and reporting standards
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={expandAll}
            className="text-xs font-bold text-[#0A84FF] hover:text-blue-700 transition-colors self-start sm:self-auto px-2.5 py-1 rounded-lg bg-blue-50/70 border border-blue-100/80 cursor-pointer"
          >
            {openIds.length === FAQS.length ? "Collapse All" : "Expand All"}
          </button>
        </div>

        {/* FAQ Accordion List */}
        <div className="divide-y divide-slate-100 pt-1">
          {FAQS.map((faq) => {
            const isOpen = openIds.includes(faq.id);
            return (
              <div key={faq.id} className="py-2.5 first:pt-2.5 last:pb-0">
                <button
                  type="button"
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full flex items-start justify-between gap-3 text-left group cursor-pointer focus:outline-none"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-black text-[#0A84FF] shrink-0 mt-0.5">
                      Q{faq.id}.
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#0A84FF] transition-colors leading-snug">
                      {faq.question}
                    </span>
                  </div>
                  <div className="p-0.5 rounded-md bg-slate-50 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0 mt-0.5">
                    {isOpen ? (
                      <IoChevronUpOutline className="text-xs" />
                    ) : (
                      <IoChevronDownOutline className="text-xs" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-2 pl-5 sm:pl-6 pr-1">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Disclaimer Box */}
      <div className="bg-gradient-to-br from-amber-50/90 to-amber-100/40 rounded-2xl p-4 sm:p-5 border border-amber-200/90 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-base shrink-0 shadow-xs">
            <IoShieldCheckmarkOutline />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wide">
              Disclaimer
            </h4>
            <p className="text-[11px] sm:text-xs text-amber-900 leading-relaxed font-medium">
              Experts are required to conduct surveys professionally and provide findings based on the applicable survey methodology and actual site conditions. Experts must not guarantee groundwater availability, quantity, quality, drilling depth or borewell success. Survey reports must contain accurate observations, recommendations and required supporting evidence. Borewell drilling is separate from the survey service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
