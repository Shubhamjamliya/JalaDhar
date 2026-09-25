const mongoose = require('mongoose');

// ─── Sub-schemas ────────────────────────────────────────────────────────────

const ImageSchema = new mongoose.Schema({
  url: { type: String, default: '' },
  publicId: { type: String, default: '' }
}, { _id: false });

const HeroSchema = new mongoose.Schema({
  badgeText: { type: String, default: 'Dedicated Scientific Groundwater Survey Booking Platform' },
  headline1: { type: String, default: 'Find Verified Groundwater' },
  headline2: { type: String, default: 'Experts Near You.' },
  subtitle: { type: String, default: 'Find and connect with verified groundwater experts for Agricultural, Residential, Commercial and Industrial water needs.' },
  cta1Label: { type: String, default: 'Download app' },
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
  educationBadge2: { type: String, default: 'M.Sc. Environmental Science (BRAOU)' },
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

const DEFAULT_CUSTOMER_FAQS = [
  {
    q: "What is Jaladhaara?",
    a: "Jaladhaara is India's first dedicated groundwater survey booking platform that connects customers with verified and trained experts for conducting scientific borewell surveys."
  },
  {
    q: "How do I book a groundwater survey?",
    a: "Simply download the Jaladhaara app or use our web portal, select your location, choose a verified expert, and confirm your booking."
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
    a: "Yes. Qualified, trained and eligible groundwater survey professionals can register through the Jaladhaara Expert portal and complete the verification process."
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

const DEFAULT_EXPERT_FAQS = [
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

const FaqsSchema = new mongoose.Schema({
  customer: { type: [FaqSchema], default: () => DEFAULT_CUSTOMER_FAQS },
  expert: { type: [FaqSchema], default: () => DEFAULT_EXPERT_FAQS }
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
  tagline: { type: String, default: 'Simplifying groundwater exploration by connecting customers with verified experts through secure booking, professional surveys, and digital reports.' },
  socialLinks: { type: SocialLinksSchema, default: () => ({}) }
}, { _id: false });

const WhyChooseSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  whyChooseEnabled: { type: Boolean, default: true },
  title: { type: String, default: 'Why Choose Jaladhaara?' },
  items: {
    type: [String],
    default: () => [
      'Verified Experts',
      'Live Expert Tracking',
      'Transparent Pricing',
      'Digital Reports',
      'Secure & Reliable'
    ]
  },
  whoForEnabled: { type: Boolean, default: true },
  whoForTitle: { type: String, default: 'Who Is Jaladhaara For?' },
  whoForCategories: {
    type: [String],
    default: () => [
      'Farmers',
      'Homeowners',
      'Industries',
      'Builders',
      'Institutions',
      'Commercial'
    ]
  }
}, { _id: false });

const VideoItemSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  title: { type: String, default: '' },
  url: { type: String, default: '' },
  publicId: { type: String, default: '' }
}, { _id: false });

const AppVideosSchema = new mongoose.Schema({
  userAppVideo: { 
    type: VideoItemSchema, 
    default: () => ({
      enabled: true,
      title: 'Introducing User App',
      url: '',
      publicId: ''
    }) 
  },
  expertAppVideo: { 
    type: VideoItemSchema, 
    default: () => ({
      enabled: true,
      title: 'Introducing Expert App',
      url: '',
      publicId: ''
    }) 
  },
  userPlayStoreUrl: { type: String, default: '' },
  userAppStoreUrl: { type: String, default: '' },
  expertPlayStoreUrl: { type: String, default: '' },
  expertAppStoreUrl: { type: String, default: '' }
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
      eyebrow: 'FOR USERS',
      heading1: 'Find Trusted Groundwater Experts',
      heading2: 'in Minutes.',
      subtitle: 'Find and connect with verified groundwater survey professionals for your specific requirements.',
      steps: [
        { step: '01', title: 'Download the App', desc: 'Get the Jaladhaara app from the Play Store or App Store.' },
        { step: '02', title: 'Select a Service', desc: 'Choose the groundwater survey service you need.' },
        { step: '03', title: 'Connect with an Expert', desc: 'Get connected with a verified expert in your area.' },
        { step: '04', title: 'Get Your Report', desc: 'Receive your professional digital survey report.' }
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
        { step: '01', title: 'Create Your Profile', desc: 'Showcase your qualifications, expertise and service areas.' },
        { step: '02', title: 'Receive Service Requests', desc: 'Get relevant groundwater survey opportunities in your area.' },
        { step: '03', title: 'Connect & Deliver', desc: 'Connect with customers and provide professional survey services.' },
        { step: '04', title: 'Receive Secure Payments', desc: 'Get paid securely through the Jaladhaara platform.' }
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
      educationBadge2: 'M.Sc. Environmental Science (BRAOU)',
      experienceBadge: '14+ Years of Professional Experience',
      pillars: [
        { icon: '🎓', title: 'Education', desc: 'M.Sc. Geophysics (OU) • M.Sc. Environmental Science (BRAOU)' },
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
  whyChoose: { type: WhyChooseSchema, default: () => ({}) },
  appVideos: { type: AppVideosSchema, default: () => ({}) },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LandingContent', LandingContentSchema);
