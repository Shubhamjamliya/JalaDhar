import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import useLandingContent from '../hooks/useLandingContent';
import '../landing.css';
import {
  Compass,
  ChevronRight,
  User,
  Briefcase,
  Smartphone,
  MapPin,
  Search,
  Activity,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  TrendingDown,
  Award,
  Clock,
  CreditCard,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const customerSteps = [
  {
    step: '01',
    title: 'Download the Customer App',
    desc: 'Install the Jaladhaara app from Google Play Store or Apple App Store on your smartphone.',
    icon: Smartphone
  },
  {
    step: '02',
    title: 'Select Survey Category & Location',
    desc: 'Choose your sector (Agriculture, Residential, Commercial, Industrial) and pin your exact property location.',
    icon: MapPin
  },
  {
    step: '03',
    title: 'Connect with a Verified Expert',
    desc: 'Browse certified hydrogeologists in your district, view their verified credentials, ratings, and transparent fees.',
    icon: Search
  },
  {
    step: '04',
    title: 'Scientific On-Site Survey',
    desc: 'The expert arrives at your site with electronic geophysical equipment (VES/ERT/PQWT) to investigate subsurface strata.',
    icon: Activity
  },
  {
    step: '05',
    title: 'Receive Digital Report & Drill',
    desc: 'Get a tamper-proof digital report with GPS-tagged drilling points, estimated fracture depths, and recommended casing pipe depths.',
    icon: FileCheck
  }
];

const expertSteps = [
  {
    step: '01',
    title: 'Download the Expert App',
    desc: 'Download the Jaladhaara Expert App from Google Play Store or Apple App Store.',
    icon: Smartphone
  },
  {
    step: '02',
    title: 'Submit Academic & Tool Credentials',
    desc: 'Enter your education details (M.Sc/M.Tech Geophysics/Geology), years of field practice, and equipment specifications.',
    icon: Award
  },
  {
    step: '03',
    title: 'Get Verified by Jaladhaara Panel',
    desc: 'Our technical team verifies your documents, equipment calibration records, and identity for quality assurance.',
    icon: ShieldCheck
  },
  {
    step: '04',
    title: 'Receive & Accept Survey Bookings',
    desc: 'Receive real-time booking alerts from farmers, homeowners, and developers in your operating radius.',
    icon: Clock
  },
  {
    step: '05',
    title: 'Upload Findings & Guaranteed Payouts',
    desc: 'Document GPS coordinates, depths, and observations in the app to submit the report and receive fast, secure digital payouts.',
    icon: CreditCard
  }
];

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

export default function HowItWorksPage() {
  const { cms } = useLandingContent();
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'experts'
  const [faqTab, setFaqTab] = useState('customers');
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    document.title = "How It Works | Jaladhaara Groundwater Exploration";
    window.scrollTo(0, 0);
  }, []);

  const steps = activeTab === 'customers' ? customerSteps : expertSteps;
  const currentFaqs = faqTab === 'customers' ? customerFaqs : expertFaqs;

  return (
    <div className="landing-page-root min-h-screen text-[var(--color-text-primary)] selection:bg-[var(--color-primary)] selection:text-white flex flex-col justify-between">
      <Navbar />

      <main 
        style={{ paddingTop: 'calc(var(--landing-header-height, 80px) + 14px)' }}
        className="flex-grow pb-16"
      >
        {/* Breadcrumb & Header */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-7xl mx-auto mb-10 sm:mb-14">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--color-text-secondary)] mb-4">
            <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            <span className="text-[var(--color-text-primary)] font-semibold">How It Works</span>
          </div>

          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 border border-[var(--color-primary)]/20">
              <Compass className="w-4 h-4" />
              Simple, Transparent & Scientific
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.2] mb-5">
              How Jaladhaara Works<br className="hidden sm:inline" />
              <span className="text-[var(--color-primary)]"> From Booking to Report</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto mb-8">
              Whether you are looking for a reliable borewell survey for your land or a geoscientist seeking genuine survey bookings, our app-driven workflow makes it seamless.
            </p>

            {/* Audience Switcher Tabs */}
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/70 backdrop-blur-md border border-[var(--color-border)] shadow-inner">
              <button
                onClick={() => setActiveTab('customers')}
                className={`flex items-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTab === 'customers'
                    ? 'bg-white text-[var(--color-primary)] shadow-md'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <User className="w-4 h-4" />
                For Customers & Landowners
              </button>
              <button
                onClick={() => setActiveTab('experts')}
                className={`flex items-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTab === 'experts'
                    ? 'bg-white text-[var(--color-primary)] shadow-md'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                For Groundwater Experts
              </button>
            </div>
          </div>
        </section>

        {/* Steps Grid */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-7xl mx-auto mb-16 sm:mb-20">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
              {activeTab === 'customers' ? '5 Easy Steps for Customers' : '5 Clear Steps to Join as an Expert'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
              {activeTab === 'customers'
                ? 'From app installation to your finalized digital groundwater report.'
                : 'From credential submission to receiving survey bookings and guaranteed payouts.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {steps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-[var(--color-border)] shadow-xl shadow-[#0077B6]/5 flex flex-col justify-between hover:border-[var(--color-primary)]/50 hover:-translate-y-1.5 transition-all duration-300 relative group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] text-white font-black flex items-center justify-center text-sm shadow-md shadow-[#0077B6]/20">
                        {item.step}
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-[var(--color-primary)] flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Why Choose Jaladhaara & Who Is It For (Customers View) */}
        {activeTab === 'customers' && (
          <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-7xl mx-auto mb-16 sm:mb-20">
            <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-[var(--color-border)] shadow-xl shadow-[#0077B6]/5">
              <div className="max-w-5xl mx-auto mb-10 text-center">
                <h3 className="text-xl sm:text-3xl font-bold mb-3 text-[var(--color-text-primary)]">
                  {cms('whyChoose.title', 'Why Choose Jaladhaara?')}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-6">
                  {cms('whyChoose.subtitle', 'Built to replace uncertainty with scientific verification, digital transparency, and direct expert access.')}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {cms('whyChoose.items', [
                    'Verified Experts',
                    'Live Expert Tracking',
                    'Transparent Pricing',
                    'Digital Reports',
                    'Secure & Reliable'
                  ]).map((benefit, i) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-center sm:justify-start gap-2.5 p-3.5 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-xs hover:border-[var(--color-primary)]/50 transition-all last:col-span-2 md:last:col-span-1"
                    >
                      <CheckCircle className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="max-w-4xl mx-auto text-center pt-8 border-t border-[var(--color-border)]">
                <h4 className="text-lg sm:text-xl font-bold mb-3 text-[var(--color-text-primary)]">
                  {cms('whyChoose.whoForTitle', 'Who Is Jaladhaara For?')}
                </h4>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                  {cms('whyChoose.whoForCategories', [
                    'Farmers',
                    'Homeowners',
                    'Industries',
                    'Builders',
                    'Institutions',
                    'Commercial'
                  ]).map((cat, i) => (
                    <span 
                      key={i} 
                      className="px-4 py-2 rounded-full bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] shadow-xs"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Why Join for Professionals (Experts View) */}
        {activeTab === 'experts' && (
          <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-7xl mx-auto mb-16 sm:mb-20">
            <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-[var(--color-border)] shadow-xl shadow-[#0077B6]/5">
              <div className="text-center mb-8">
                <h3 className="text-xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                  Why Join Jaladhaara as a Groundwater Expert?
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                  Grow your independent consulting practice with genuine leads, digital scheduling, and guaranteed payouts.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: 'More Genuine Client Leads',
                    desc: 'Connect directly with customers actively seeking professional borewell surveys in your service districts.'
                  },
                  {
                    title: 'Professional Digital Profile',
                    desc: 'Showcase your degrees, instrument specializations, experience, and verified customer reviews.'
                  },
                  {
                    title: 'Secure Digital Payments',
                    desc: 'No chasing customer payments. Advance deposits are held securely and released directly to your account.'
                  },
                  {
                    title: 'Grow Your Practice',
                    desc: 'Expand your operating territory and build a scalable geoscientific reputation backed by our platform.'
                  }
                ].map((item, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mb-3">
                      <TrendingDown className="w-5 h-5 rotate-180" />
                    </div>
                    <h4 className="font-bold text-sm sm:text-base text-[var(--color-text-primary)] mb-1.5">{item.title}</h4>
                    <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Who Can Join Jaladhaara? */}
              <div className="max-w-4xl mx-auto mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-[var(--color-border)] text-center">
                <h4 className="text-lg sm:text-2xl font-bold mb-2 text-[var(--color-text-primary)]">
                  Who Can Join Jaladhaara?
                </h4>
                <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm max-w-xl mx-auto mb-5">
                  Open to verified and experienced groundwater professionals across India.
                </p>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6">
                  {[
                    'Hydrogeologists',
                    'Geophysicists',
                    'Groundwater Professionals',
                    'Water Resource Consultants',
                    'Qualified Earth Science Professionals'
                  ].map((prof, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] shadow-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                      <span>{prof}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-100 max-w-2xl mx-auto">
                  <h5 className="font-bold text-sm sm:text-base text-[var(--color-text-primary)] mb-1">
                    Your Expertise. Your Opportunities.
                  </h5>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                    Turn your professional expertise into new opportunities with Jaladhaara.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* The 4-Point Expert Quality Standard */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-6xl mx-auto mb-16 sm:mb-20">
          <div className="bg-gradient-to-br from-[#011E36] to-[#023E8A] text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#7FCDFF] text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
                <ShieldCheck className="w-4 h-4" />
                Trust & Verification Standard
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4">
                How We Verify Every Groundwater Expert
              </h2>
              <p className="text-white/85 text-xs sm:text-base leading-relaxed mb-8">
                To eliminate fraudulent water dowsers and protect our customers, every professional on Jaladhaara passes a rigorous 4-step geoscientific screening:
              </p>

              <div className="grid sm:grid-cols-2 gap-5">
                {[
                  {
                    title: 'Academic Qualifications',
                    desc: 'Degree in Geophysics, Geology, Earth Sciences, or certified hydrogeological training.'
                  },
                  {
                    title: 'Calibrated Equipment',
                    desc: 'Proof of functional electronic instrumentation (VES Resistivity Meter, ERT, ADMT/PQWT).'
                  },
                  {
                    title: 'Identity & Field Track Record',
                    desc: 'Verification of identity documentation, field experience years, and professional references.'
                  },
                  {
                    title: 'Scientific Code of Conduct',
                    desc: 'Mandatory agreement to provide objective data without fraudulent guarantees or conflict of interest.'
                  }
                ].map((crit, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white/10 p-4 rounded-2xl border border-white/10">
                    <CheckCircle2 className="w-5 h-5 text-[#7FCDFF] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-white">{crit.title}</h4>
                      <p className="text-xs text-white/80 mt-1 leading-relaxed">{crit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Complete FAQs Accordion (Both Customer & Expert Categories) */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-4xl mx-auto mb-16 sm:mb-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider mb-2 border border-[var(--color-primary)]/20">
              <HelpCircle className="w-3.5 h-3.5" />
              Frequently Asked Questions
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
              Got Questions? We Have Answers.
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
              Select an audience category below to read common questions.
            </p>

            {/* FAQ Category Selector */}
            <div className="mt-5 inline-flex p-1 rounded-xl bg-slate-200/70 border border-[var(--color-border)]">
              <button
                onClick={() => { setFaqTab('customers'); setOpenFaq(null); }}
                className={`px-5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  faqTab === 'customers' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-secondary)]'
                }`}
              >
                Customer FAQs ({customerFaqs.length})
              </button>
              <button
                onClick={() => { setFaqTab('experts'); setOpenFaq(null); }}
                className={`px-5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  faqTab === 'experts' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-secondary)]'
                }`}
              >
                Expert FAQs ({expertFaqs.length})
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {currentFaqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="border border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-md rounded-2xl overflow-hidden shadow-sm transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between focus:outline-none cursor-pointer"
                  >
                    <span className="font-bold text-sm sm:text-base text-[var(--color-text-primary)] pr-4">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[var(--color-primary)] transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed border-t border-[var(--color-border)]/50 whitespace-pre-line">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer cms={cms} />
    </div>
  );
}
