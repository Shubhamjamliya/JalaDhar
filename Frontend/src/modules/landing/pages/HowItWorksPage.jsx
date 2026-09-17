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
  CreditCard
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

const faqs = [
  {
    q: 'How long does an on-site groundwater survey take?',
    a: 'A standard agricultural or residential geophysical survey typically takes 1 to 3 hours depending on property size, terrain, and the geophysical method used (VES, ERT, or electromagnetic scanning).'
  },
  {
    q: 'What should the property owner prepare prior to the expert’s arrival?',
    a: 'Ensure clear access to the property, approximate boundary markings, and information on any existing or neighboring borewells. For electrical resistivity sounding (VES), having access to a small amount of water to moisten dry electrode contact points can be helpful.'
  },
  {
    q: 'How are survey charges determined?',
    a: 'Charges are fixed transparently according to property type, acreage, package tier (single-point vs multi-point), and required geophysical methodology. There are no hidden fees.'
  },
  {
    q: 'What are the eligibility criteria for experts to join Jaladhaara?',
    a: 'Experts must hold formal academic degrees in Geophysics, Geology, Earth Sciences, or Hydrogeology, possess calibrated electronic survey instruments (VES, ERT, PQWT, ADMT), and pass our verification screening.'
  }
];

export default function HowItWorksPage() {
  const { cms } = useLandingContent();
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'experts'
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    document.title = "How It Works | Jaladhaara Groundwater Exploration";
    window.scrollTo(0, 0);
  }, []);

  const steps = activeTab === 'customers' ? customerSteps : expertSteps;

  return (
    <div className="landing-page-root min-h-screen text-[var(--color-text-primary)] selection:bg-[var(--color-primary)] selection:text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-28 pb-16">
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

        {/* FAQs Accordion */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-4xl mx-auto mb-16 sm:mb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
              Common questions about booking and surveying with Jaladhaara.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="border border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-md rounded-2xl overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between focus:outline-none"
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
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed border-t border-[var(--color-border)]/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Dual CTA Section */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-[#011E36] via-[#023E8A] to-[#0077B6] rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden text-center">
            <div className="max-w-3xl mx-auto relative z-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4">
                Get Started on Jaladhaara Today
              </h2>
              <p className="text-white/85 text-sm sm:text-base leading-relaxed mb-8 max-w-xl mx-auto">
                Download the Customer App to find water scientifically, or download the Expert App to grow your professional survey practice.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/#apps"
                  className="px-6 py-3.5 rounded-xl bg-white text-[var(--color-primary)] font-bold text-sm shadow-xl hover:bg-slate-100 hover:scale-105 transition-all inline-flex items-center gap-2"
                >
                  Download Mobile Apps
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/contact"
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm backdrop-blur-md hover:scale-105 transition-all inline-flex items-center gap-2"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer cms={cms} />
    </div>
  );
}
