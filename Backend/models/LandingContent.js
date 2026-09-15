const mongoose = require('mongoose');

// ─── Sub-schemas ────────────────────────────────────────────────────────────

const ImageSchema = new mongoose.Schema({
  url: { type: String, default: '' },
  publicId: { type: String, default: '' }
}, { _id: false });

const HeroSchema = new mongoose.Schema({
  badgeText: { type: String, default: 'Groundwater Survey Platform' },
  headline1: { type: String, default: 'Find Verified Groundwater' },
  headline2: { type: String, default: 'Experts Near You.' },
  subtitle: { type: String, default: 'Book professional hydrogeologists for scientific borewell surveys — for Agriculture, Residential, Commercial and Industrial needs.' },
  cta1Label: { type: String, default: 'Book a Survey' },
  cta2Label: { type: String, default: 'Join as Expert' },
  bgImage: { type: ImageSchema, default: () => ({}) }
}, { _id: false });

const ServiceCardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: ImageSchema, default: () => ({}) }
}, { _id: false });

const StepSchema = new mongoose.Schema({
  step: { type: String, default: '' },
  title: { type: String, default: '' },
  desc: { type: String, default: '' }
}, { _id: false });

const HowItWorksSchema = new mongoose.Schema({
  eyebrow: { type: String, default: '' },
  heading1: { type: String, default: '' },
  heading2: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  steps: { type: [StepSchema], default: [] }
}, { _id: false });

const PillarSchema = new mongoose.Schema({
  icon: { type: String, default: '' },
  title: { type: String, default: '' },
  desc: { type: String, default: '' }
}, { _id: false });

const FounderSchema = new mongoose.Schema({
  name: { type: String, default: 'Bommala Anjaiah' },
  role: { type: String, default: 'Founder & Managing Director' },
  subDesignation: { type: String, default: 'Jaladhaara Groundwater Survey Pvt. Ltd.' },
  bio: { type: String, default: '' },
  quote: { type: String, default: '' },
  educationBadge: { type: String, default: 'M.Sc. Geophysics – Osmania University, Hyderabad' },
  experienceBadge: { type: String, default: '14+ Years of Professional Experience' },
  pillars: { type: [PillarSchema], default: [] }
}, { _id: false });

const StatSchema = new mongoose.Schema({
  number: { type: String, default: '' },
  label: { type: String, default: '' }
}, { _id: false });

const FaqSchema = new mongoose.Schema({
  q: { type: String, required: true },
  a: { type: String, required: true }
}, { _id: false });

const FaqsSchema = new mongoose.Schema({
  customer: { type: [FaqSchema], default: [] },
  expert: { type: [FaqSchema], default: [] }
}, { _id: false });

const AppCardSchema = new mongoose.Schema({
  eyebrow: { type: String, default: '' },
  heading: { type: String, default: '' },
  subheading: { type: String, default: '' },
  description: { type: String, default: '' },
  playStoreUrl: { type: String, default: '#' },
  appStoreUrl: { type: String, default: '#' },
  appImage: { type: ImageSchema, default: () => ({}) }
}, { _id: false });

const CtaBannerSchema = new mongoose.Schema({
  heading: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  cta1Label: { type: String, default: '' }
}, { _id: false });

const SocialLinksSchema = new mongoose.Schema({
  whatsapp: { type: String, default: '' },
  twitter: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  youtube: { type: String, default: '' }
}, { _id: false });

const FooterSchema = new mongoose.Schema({
  tagline: { type: String, default: 'Making groundwater decisions easier for every Indian.' },
  socialLinks: { type: SocialLinksSchema, default: () => ({}) }
}, { _id: false });

// ─── Main Schema ─────────────────────────────────────────────────────────────

const LandingContentSchema = new mongoose.Schema({
  page: {
    type: String,
    default: 'landing',
    unique: true,
    trim: true
  },
  hero: { type: HeroSchema, default: () => ({}) },
  services: {
    type: [ServiceCardSchema],
    default: () => [
      { title: 'Agriculture', description: 'Connect with experts for scientific site selection to ensure reliable irrigation and support rural agricultural development.' },
      { title: 'Residential', description: 'Book verified professionals for groundwater detection for individual homes, gated villas, apartments, and layouts.' },
      { title: 'Commercial', description: 'Access top surveyors for infrastructure development, commercial complexes, hospitals, and educational institutions.' },
      { title: 'Industrial', description: 'Comprehensive groundwater resource assessment and digital documentation for large-scale industrial and manufacturing plants.' }
    ]
  },
  howItWorksCustomers: {
    type: HowItWorksSchema,
    default: () => ({
      eyebrow: 'For Customers',
      heading1: 'Find Trusted Experts',
      heading2: 'in Minutes.',
      subtitle: 'Everything you need for groundwater solutions — in one platform.',
      steps: [
        { step: '1', title: 'Download App', desc: 'Get the Jaladhaara app from Play Store or App Store.' },
        { step: '2', title: 'Select Service', desc: 'Choose the type and location of groundwater survey you need.' },
        { step: '3', title: 'Connect', desc: 'Get connected with a verified hydrogeologist in your area.' },
        { step: '4', title: 'Receive Report', desc: 'Get a professional, digital survey report on your device.' }
      ]
    })
  },
  howItWorksExperts: {
    type: HowItWorksSchema,
    default: () => ({
      eyebrow: 'For Experts',
      heading1: 'Grow Your Practice',
      heading2: 'with Jaladhaara.',
      subtitle: "Join India's largest groundwater professional network.",
      steps: [
        { step: '1', title: 'Register & KYC', desc: 'Sign up and complete your professional KYC verification.' },
        { step: '2', title: 'Set Availability', desc: 'Define your working zones and available time slots.' },
        { step: '3', title: 'Accept Bookings', desc: 'Receive booking assignments directly on the Expert app.' },
        { step: '4', title: 'Receive Direct & Secure Disbursals', desc: 'Get paid directly and securely after every successful survey.' }
      ]
    })
  },
  founder: {
    type: FounderSchema,
    default: () => ({
      name: 'Bommala Anjaiah',
      role: 'Founder & Managing Director',
      subDesignation: 'Jaladhaara Groundwater Survey Pvt. Ltd.',
      bio: 'A Geophysics professional with over 14 years of experience in groundwater exploration and geophysical investigations, Bommala Anjaiah brings strong technical and field expertise to Jaladhaara.',
      quote: 'Our goal is simple — help people make better-informed groundwater decisions before they drill.',
      educationBadge: 'M.Sc. Geophysics – Osmania University, Hyderabad',
      experienceBadge: '14+ Years of Professional Experience',
      pillars: [
        { icon: '🎓', title: 'Education', desc: 'M.Sc. Geophysics • Osmania University, Hyderabad, Telangana' },
        { icon: '🌍', title: 'Experience', desc: '14+ Years • Geophysics • Groundwater Exploration • Geophysical Investigations' },
        { icon: '🚀', title: 'Vision', desc: 'Pan-India Reach • Building a trusted technology platform for groundwater exploration across India' }
      ]
    })
  },
  stats: {
    type: [StatSchema],
    default: () => [
      { number: '500+', label: 'Verified Experts' },
      { number: '10,000+', label: 'Surveys Done' },
      { number: '25+', label: 'States Covered' }
    ]
  },
  faqs: { type: FaqsSchema, default: () => ({}) },
  ecosystemApps: {
    type: [AppCardSchema],
    default: () => [
      {
        eyebrow: 'For Customers',
        heading: 'Jaladhaara Customer App',
        subheading: 'Book. Track. Report.',
        description: 'Book verified groundwater experts, track your survey in real-time, receive digital reports instantly.',
        playStoreUrl: '#',
        appStoreUrl: '#'
      },
      {
        eyebrow: 'For Experts',
        heading: 'Jaladhaara Expert App',
        subheading: 'Accept. Survey. Earn.',
        description: 'Accept bookings, manage your availability, complete surveys, submit reports and receive secure disbursals.',
        playStoreUrl: '#',
        appStoreUrl: '#'
      }
    ]
  },
  ctaBanner: {
    type: CtaBannerSchema,
    default: () => ({
      heading: 'Ready to Find Water?',
      subtitle: 'Book a professional groundwater survey today and make better-informed borewell decisions.',
      cta1Label: 'Book a Survey Now'
    })
  },
  footer: { type: FooterSchema, default: () => ({}) },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LandingContent', LandingContentSchema);
