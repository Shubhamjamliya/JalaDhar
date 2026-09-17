import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import useLandingContent from '../hooks/useLandingContent';
import '../landing.css';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Users,
  Briefcase,
  ChevronRight,
  ArrowRight,
  MessageCircle,
  Download,
  CheckCircle2,
  X
} from 'lucide-react';

const customerFaqs = [
  {
    q: "What is Jaladhaara?",
    a: "Jaladhaara is India's first dedicated groundwater survey booking platform that connects customers with verified and trained experts for conducting scientific borewell surveys."
  },
  {
    q: "How do I book a groundwater survey?",
    a: "Simply download the Jaladhaara app from the Google Play Store or Apple App Store, select your location, choose a verified expert, and confirm your booking."
  },
  {
    q: "Who can use Jaladhaara app?",
    a: "Jaladhaara is designed for farmers, home owners, industries, commercial real estate developers, institutions and anyone planning to drill a borewell."
  },
  {
    q: "What survey methods are available?",
    a: "Our experts conduct Geophysical Investigations using advanced scientific methods such as Electrical resistivity, PQWT, ADMT, 3D locator and other approved groundwater survey techniques depending on the site requirements."
  },
  {
    q: "Can Jaladhaara guarantee borewell success?",
    a: "No. Groundwater occurrence depends on natural geological conditions. Jaladhaara connects customers with verified experts who use geoscientific survey methods to drastically improve borewell planning and reduce dry-bore risks."
  },
  {
    q: "How are experts verified?",
    a: "Experts undergo a strict verification process based on their qualifications, field experience, years of service, identity, and background documentation before joining the platform."
  },
  {
    q: "How do I pay for the survey?",
    a: "Payments are made securely through the Jaladhaara platform using standard digital payment options (UPI, Net Banking, Cards)."
  },
  {
    q: "Will I receive a survey report?",
    a: "Yes. The expert will provide a comprehensive digital survey report through the Jaladhaara platform after completing the on-site survey."
  },
  {
    q: "Can groundwater survey experts join Jaladhaara?",
    a: "Yes. Qualified, trained and eligible groundwater survey professionals can download the Jaladhaara Expert app and complete the verification process."
  },
  {
    q: "Which sectors does Jaladhaara serve?",
    a: "Jaladhaara provides bookings for groundwater survey services for:\n1. Agriculture\n2. Residential\n3. Industrial\n4. Commercial (including open plot ventures, gated communities, and real estate developments)"
  },
  {
    q: "Is Jaladhaara available across India?",
    a: "Jaladhaara is building a nationwide network of verified and trained groundwater survey experts to serve customers across India."
  },
  {
    q: "How can I contact Jaladhaara?",
    a: "You can contact us through the Jaladhaara app, website, email, phone or WhatsApp for booking assistance and support."
  }
];

const expertFaqs = [
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
    a: "Assess the site using applicable groundwater exploration methods, considering geological, geophysical and subsurface conditions and relevant groundwater indicators, and identify the most suitable drilling location."
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

export default function FaqsPage() {
  const { cms } = useLandingContent();
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'experts'
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    document.title = "Frequently Asked Questions (FAQs) | Jaladhaara";
    window.scrollTo(0, 0);
  }, []);

  const currentList = activeTab === 'customers'
    ? cms('faqs.customer', customerFaqs)
    : cms('faqs.expert', expertFaqs);

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const q = searchQuery.toLowerCase();
    return currentList.filter(
      (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    );
  }, [currentList, searchQuery]);

  return (
    <div className="landing-page-root min-h-screen text-[var(--color-text-primary)] selection:bg-[var(--color-primary)] selection:text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-28 pb-16">
        {/* Breadcrumb & Header */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-7xl mx-auto mb-10 sm:mb-14">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--color-text-secondary)] mb-4">
            <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            <span className="text-[var(--color-text-primary)] font-semibold">FAQs</span>
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 border border-[var(--color-primary)]/20">
              <HelpCircle className="w-4 h-4" />
              Help & Knowledge Base
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.2] mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto mb-8">
              Find answers to common questions about groundwater surveys, booking procedures, scientific methodologies, and professional expert standards.
            </p>

            {/* Audience Switcher Tabs */}
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/70 backdrop-blur-md border border-[var(--color-border)] shadow-inner mb-6">
              <button
                onClick={() => {
                  setActiveTab('customers');
                  setOpenIndex(null);
                }}
                className={`flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTab === 'customers'
                    ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>For Customers</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'customers' ? 'bg-white/25 text-white' : 'bg-slate-300 text-slate-700'
                }`}>
                  {customerFaqs.length}
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('experts');
                  setOpenIndex(null);
                }}
                className={`flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTab === 'experts'
                    ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>For Experts</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'experts' ? 'bg-white/25 text-white' : 'bg-slate-300 text-slate-700'
                }`}>
                  {expertFaqs.length}
                </span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative max-w-lg mx-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab === 'customers' ? 'customer' : 'expert'} FAQs...`}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* FAQs Accordion Section */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-4xl mx-auto mb-16 sm:mb-20">
          {activeTab === 'experts' && (
            <div className="mb-5 p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] block">
                  Groundwater Survey Guidelines & Field FAQs
                </span>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Standard operating procedures for professional surveyors on the Jaladhaara platform.
                </p>
              </div>
              <span className="text-xs font-bold text-[var(--color-primary)] bg-white px-2.5 py-1 rounded-lg border border-blue-200 shrink-0 ml-3">
                10 Field FAQs
              </span>
            </div>
          )}

          {filteredFaqs.length === 0 ? (
            <div className="p-10 text-center bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)]">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-base text-[var(--color-text-primary)]">No matching questions found</p>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
                Try searching with a different keyword or switch categories.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <div
                    key={`${activeTab}-${index}`}
                    className="border border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-md rounded-2xl overflow-hidden shadow-sm transition-all duration-200"
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="w-full text-left px-5 py-4 flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/50 cursor-pointer"
                    >
                      <span className="font-bold text-[var(--color-text-primary)] pr-4 text-sm sm:text-base leading-snug">
                        {faq.q}
                      </span>
                      <div
                        className={`w-7 h-7 rounded-full bg-[var(--color-bg)] flex items-center justify-center shrink-0 transition-transform duration-300 ${
                          isOpen ? 'rotate-180 bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)]'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-in-out px-5 sm:px-6 ${
                        isOpen ? 'grid-rows-[1fr] opacity-100 pb-5' : 'grid-rows-[0fr] opacity-0 pb-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="text-[var(--color-text-secondary)] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap pt-2 border-t border-[var(--color-border)]/50">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Still Have Questions Banner */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-6xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-blue-50/80 via-white to-sky-50/80 rounded-3xl p-6 sm:p-10 border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-1 block">
                Need Specific Help?
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)]">
                Still have unanswered questions?
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1 max-w-xl">
                Our support team and senior hydrogeologists in Hyderabad are available to help you plan your survey or answer onboarding queries.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/contact"
                className="px-5 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-xs sm:text-sm shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contact Our Office</span>
              </Link>
              <Link
                to="/how-it-works"
                className="px-5 py-3 rounded-xl bg-white border border-slate-200 hover:border-[var(--color-primary)] text-[var(--color-text-primary)] font-bold text-xs sm:text-sm shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>How It Works</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer cms={cms} />
    </div>
  );
}
