const axios = require('axios');
const langService = require('./chatLanguageService');

/**
 * Jaladhaara Groundwater Survey System Prompt (static — app-level content, not language-specific)
 */
const JALADHAARA_SYSTEM_PROMPT = `
You are the official 24/7 AI Customer Support Assistant for "Jaladhaara" (जलधारा) – India's premier Groundwater Survey Booking Platform.

YOUR MISSION:
Help users with booking groundwater surveys, checking survey status, expert tracking, payments, invoices, reports, and addressing FAQs with utmost courtesy, clarity, and professionalism.

HOW TO BOOK A GROUNDWATER SURVEY:
When users ask how to book, booking steps, or how to schedule a survey, give this concise, numbered step-by-step guide:
1. Tap "Book" or go to [Book a Survey](/user/survey).
2. Select your category: Agriculture, Household (Residential), Commercial, or Industrial.
3. Set your location on the map and choose your survey package.
4. Pick your preferred survey date and time slot.
5. Pay the advance token payment to confirm your booking.
Once confirmed, a verified hydrogeology expert will be assigned to visit your site at the scheduled time!

CORE KNOWLEDGE BASE:
1. SURVEY CATEGORIES:
   - Agriculture Survey: For agricultural lands, crop fields, plantations to locate suitable borewell drilling spots.
   - Household Survey: For residential plots, houses, villas, apartments for domestic water supply.
   - Commercial Survey: For offices, hotels, shops, hospitals, institutions, and malls.
   - Industrial Survey: For manufacturing units, factories, plants, and industrial complexes.

2. IMPORTANT POLICIES & DISCLAIMERS:
   - Groundwater Survey provides scientific recommendations and assessment by certified experts.
   - Borewell drilling is NOT included with the survey (drilling is arranged separately by the customer).
   - MANDATORY DISCLAIMER: Groundwater availability, yield, quality, exact depth, and borewell success cannot be 100% guaranteed.

3. APP NAVIGATION & ACTION LINKS:
   - Book New Survey: /user/survey
   - View Bookings / Status: /user/status
   - Upcoming Survey Schedule: /user/status?tab=upcoming
   - Live Track Expert: /user/status?tab=ongoing
   - Completed Surveys / Ratings: /user/status?tab=completed
   - Payments & Invoices: /user/payments-invoices
   - Download Survey Reports (PDF): /user/survey-reports
   - Submit Dispute / Raise Ticket: /user/disputes/create
   - Helpline: +91 800-000-0000 | Email: info@jaladhaaraapp.com

RESPONSE RULES:
- Always format internal app links as Markdown links like [Book Survey](/user/survey), [View Bookings](/user/status), [Payments](/user/payments-invoices), or [Survey Reports](/user/survey-reports).
- Keep responses concise and structured (under 60-80 words). Use clean bullet points or numbered lists when explaining steps.
- Be friendly, respectful, and reassuring.
- When answering in Indian regional languages (e.g., Hindi, Telugu, Tamil, Marathi, Kannada), use natural phrasing and proper script, but keep URLs in clean English paths.
`;

/**
 * Jaladhaara Groundwater Survey System Prompt for Experts/Hydrogeologists
 */
const JALADHAARA_VENDOR_SYSTEM_PROMPT = `
You are the official 24/7 AI Partner Support Assistant for "Jaladhaara" (जलधारा) – assisting verified Groundwater Professionals, Hydrogeologists, and Survey Experts across India.

YOUR MISSION:
Assist Hydrogeologists and Groundwater Survey Experts with their assigned bookings, field navigation, site assessment protocols, digital survey report submission, mandatory geotagged photo evidence, wallet earnings, payout withdrawals, partner agreement terms, and dispute resolution with utmost professionalism and practical clarity.

CORE EXPERT GUIDELINES & STANDARDS:
1. BOOKING EXECUTION & STATUS LIFECYCLE:
   - Check assigned surveys at [Assigned Bookings](/vendor/bookings).
   - Once assigned, accept the booking promptly.
   - On the survey day, mark status as "En Route" when starting your journey, and "Visited" upon arriving at customer premises.
2. SURVEY ASSESSMENT & SITE EVIDENCE:
   - Use recognized hydrogeological/geophysical exploration methods suitable for the local subsurface geology.
   - Record depth to water table observation and estimated drilling depth where technically feasible.
   - Capture mandatory geotagged site photographs showing the survey location, geological features, and recommended borewell point.
   - MANDATORY ETHICAL RULE: Never guarantee 100% water availability, yield, or borewell drilling success. The report reflects expert scientific assessment.
3. DIGITAL REPORT SUBMISSION:
   - Complete and submit the digital report via [Upload Report](/vendor/bookings).
   - Once verified, the customer can access their official certified report.
4. EARNINGS & WALLET WITHDRAWALS:
   - Partner service fees are credited directly into your partner wallet upon survey milestones.
   - Check balance, view transaction receipts, and request instant bank withdrawal at [Wallet & Payments](/vendor/wallet).
5. DISPUTES & ISSUES:
   - If a customer disputes survey findings, refuses site access, or if severe weather disrupts the survey, log an official ticket at [Partner Resolution Center](/vendor/disputes).
   - Review partner standards at [Expert Agreement](/vendor/agreement).

EXPERT APP NAVIGATION LINKS:
- Dashboard: /vendor/dashboard
- Assigned Bookings: /vendor/bookings
- Survey Reports: /vendor/status
- Wallet & Payouts: /vendor/wallet
- Partner Resolution & Disputes: /vendor/disputes
- Expert Agreement & Terms: /vendor/agreement
- Reviews & Ratings: /vendor/reviews
- Partner Helpline: +91 800-000-0000 | Email: expert-support@jaladhaaraapp.com

RESPONSE RULES:
- Always format internal app links as Markdown links like [Assigned Bookings](/vendor/bookings), [Wallet](/vendor/wallet), [Upload Report](/vendor/bookings), or [Disputes](/vendor/disputes).
- Keep responses concise and structured (under 60-80 words). Use clean bullet points or numbered lists.
- Be supportive, respectful, and authoritative as a partner platform.
- When answering in Indian regional languages (e.g., Hindi, Telugu, Tamil, Marathi, Kannada), reply in the requested language while keeping URLs in clean English paths.
`;

/**
 * Expert action card specifications
 */
const SPECIFICATION_ACTION_CARDS_VENDOR = {
  'wallet': {
    title: 'Expert Wallet & Payouts',
    description: 'Check your available balance, survey earnings, and submit payout withdrawal requests directly to your verified bank account.',
    icon: 'card',
    url: '/vendor/wallet',
    actionLabel: 'Open Wallet',
    buttons: ['My Bookings', 'Upload Report', 'Disputes', 'Main Menu']
  },
  'payout': {
    title: 'Payouts & Earnings',
    description: 'View your completed survey payouts, platform fee breakdown, and request immediate bank settlement.',
    icon: 'card',
    url: '/vendor/wallet',
    actionLabel: 'View Payouts',
    buttons: ['Wallet', 'My Bookings', 'Disputes', 'Main Menu']
  },
  'my bookings': {
    title: 'Assigned Survey Bookings',
    description: 'Review accepted customer bookings, contact details, turn-by-turn navigation, and update live site visit status.',
    icon: 'booking',
    url: '/vendor/bookings',
    actionLabel: 'View Assigned Bookings',
    buttons: ['Wallet & Payouts', 'Upload Report', 'Disputes', 'Main Menu']
  },
  'bookings': {
    title: 'Assigned Survey Bookings',
    description: 'Review accepted customer bookings, contact details, turn-by-turn navigation, and update live site visit status.',
    icon: 'booking',
    url: '/vendor/bookings',
    actionLabel: 'View Assigned Bookings',
    buttons: ['Wallet & Payouts', 'Upload Report', 'Disputes', 'Main Menu']
  },
  'upload report': {
    title: 'Upload Survey Report & Findings',
    description: 'Submit technical survey findings, water point coordinates, estimated drilling depth, and geotagged site photographs.',
    icon: 'document',
    url: '/vendor/bookings',
    actionLabel: 'Upload Reports',
    buttons: ['My Bookings', 'Wallet & Payouts', 'Disputes', 'Main Menu']
  },
  'report': {
    title: 'Upload Survey Report & Findings',
    description: 'Submit technical survey findings, water point coordinates, estimated drilling depth, and geotagged site photographs.',
    icon: 'document',
    url: '/vendor/bookings',
    actionLabel: 'Upload Reports',
    buttons: ['My Bookings', 'Wallet & Payouts', 'Disputes', 'Main Menu']
  },
  'disputes': {
    title: 'Partner Resolution Center',
    description: 'Facing customer disputes, unreachable site locations, or payment verification issues? Raise an official partner ticket for admin resolution.',
    icon: 'support',
    url: '/vendor/disputes',
    actionLabel: 'Resolution Center',
    buttons: ['My Bookings', 'Wallet & Payouts', 'Agreement', 'Main Menu']
  },
  'support': {
    title: 'Partner Resolution Center',
    description: 'Facing customer disputes, unreachable site locations, or payment verification issues? Raise an official partner ticket for admin resolution.',
    icon: 'support',
    url: '/vendor/disputes',
    actionLabel: 'Resolution Center',
    buttons: ['My Bookings', 'Wallet & Payouts', 'Agreement', 'Main Menu']
  },
  'agreement': {
    title: 'Expert Terms & Agreement',
    description: 'View the official Jaladhaara Hydrogeology Partner Agreement, service standards, and ethical survey practices.',
    icon: 'document',
    url: '/vendor/agreement',
    actionLabel: 'View Agreement',
    buttons: ['My Bookings', 'Disputes', 'Wallet & Payouts', 'Main Menu']
  },
  'main menu': {
    title: 'Expert Partner Portal',
    description: 'Welcome to your 24/7 Jaladhaara Hydrogeology Expert Assistant. How can we assist your field operations today?',
    icon: 'water',
    url: '/vendor/dashboard',
    actionLabel: 'Expert Dashboard',
    buttons: ['My Bookings', 'Wallet & Payouts', 'Upload Report', 'Disputes']
  }
};

/**
 * Base specification action card definitions (structure only — no translations).
 * Translations and labels are loaded dynamically from ChatLanguage DB via chatLanguageService.
 */
const SPECIFICATION_ACTION_CARDS_BASE = {
  'payment':        { icon: 'card',     url: '/user/payments-invoices',          buttons: ['Pay Now', 'Payment Status', 'Main Menu'] },
  'pay now':        { icon: 'card',     url: '/user/payments-invoices',          buttons: ['Payment Status', 'My Booking', 'Main Menu'] },
  'payment status': { icon: 'invoice',  url: '/user/payments-invoices',          buttons: ['Pay Now', 'My Booking', 'Main Menu'] },
  'my booking':     { icon: 'booking',  url: '/user/status',                     buttons: ['View Booking', 'View Schedule', 'Track Expert', 'Main Menu'] },
  'view booking':   { icon: 'booking',  url: '/user/status',                     buttons: ['Track Expert', 'View Schedule', 'Main Menu'] },
  'view schedule':  { icon: 'calendar', url: '/user/status?tab=upcoming',        buttons: ['View Booking', 'Track Expert', 'Main Menu'] },
  'track expert':   { icon: 'location', url: '/user/status?tab=ongoing',         buttons: ['View Booking', 'View Schedule', 'Main Menu'] },
  'my report':      { icon: 'document', url: '/user/survey-reports',             buttons: ['View Report', 'Rate Service', 'Submit Report', 'Main Menu'] },
  'view report':    { icon: 'document', url: '/user/survey-reports',             buttons: ['Rate Service', 'Submit Report', 'Main Menu'] },
  'rate service':   { icon: 'star',     url: '/user/status?tab=completed',       buttons: ['View Report', 'Main Menu'] },
  'support':        { icon: 'support',  url: '/user/disputes/create',            buttons: ['My Booking', 'Payment', 'Main Menu'], helpline: '+91 800-000-0000' },
  'main menu':      { icon: 'water',    url: '/user/survey',                     buttons: ['My Booking', 'Payment', 'My Report', 'Track Expert', 'Support'] }
};

const findVendorSpecificationCard = (message = '') => {
  const cleanMsg = (message || '').toLowerCase().trim();
  const keys = Object.keys(SPECIFICATION_ACTION_CARDS_VENDOR);
  for (const key of keys) {
    if (cleanMsg === key || cleanMsg.includes(key)) {
      const item = SPECIFICATION_ACTION_CARDS_VENDOR[key];
      return {
        title: item.title,
        description: item.description,
        icon: item.icon,
        primaryAction: {
          label: item.actionLabel,
          url: item.url
        },
        buttons: item.buttons
      };
    }
  }
  return null;
};

// ── Card matching ─────────────────────────────────────────────────────────────

/**
 * Find a specification action card that matches the user's message.
 * Uses dynamic synonyms from DB (loaded via chatLanguageService).
 * Returns a fully localized card object or null.
 */
const findSpecificationCard = async (message = '', langKey = 'en') => {
  const config = await langService.loadConfig();
  const cleanMsg = (message || '').toLowerCase().trim();

  // Sort by descending key length so "payment status" matches before "payment"
  const sortedKeys = Object.keys(SPECIFICATION_ACTION_CARDS_BASE).sort((a, b) => b.length - a.length);

  // If user is asking a natural question (has question words or > 3 words), pass to AI
  const isQuestion =
    cleanMsg.split(/\s+/).length > 3 ||
    /\b(how|why|what|where|when|who|which|can|could|steps|step|provide|tell|guide|process)\b/i.test(cleanMsg) ||
    /(ఎలా|ఏమిటి|స్టెప్స్|ఎక్కడ|ఎప్పుడు|ఎవరు|ఎలాంటి|చెప్పండి)/.test(cleanMsg) ||
    /(कैसे|क्या|स्टेप्स|कहाँ|कब|कौन|बताओ|तरीका|प्रक्रिया)/.test(cleanMsg);

  if (isQuestion) {
    return null;
  }

  for (const key of sortedKeys) {
    const synonymSet = config.SYNONYMS_BY_CARD[key] || new Set();
    const isMatch =
      cleanMsg === key ||
      cleanMsg.includes(key) ||
      [...synonymSet].some(syn => cleanMsg === syn || cleanMsg.includes(syn));

    if (isMatch) {
      const base = SPECIFICATION_ACTION_CARDS_BASE[key];
      const localized = langService.getCardTranslation(key, langKey, config);

      // Fall back to English translations if localized is empty
      const enLocalized = langService.getCardTranslation(key, 'en', config);

      const title       = localized.title       || enLocalized.title       || key;
      const description = localized.description || enLocalized.description || '';
      const actionLabel = localized.actionLabel || enLocalized.actionLabel || 'Open';

      const translatedButtons = langService.translateButtons(base.buttons, langKey, config);

      return {
        title,
        description,
        icon: base.icon,
        primaryAction: { label: actionLabel, url: base.url },
        buttons: translatedButtons,
        helpline: base.helpline || null
      };
    }
  }

  return null;
};

// ── Context inference ─────────────────────────────────────────────────────────

/**
 * Infer an action card from conversational context (Ollama AI responses).
 * Uses dynamic inference keywords loaded from DB.
 */
const inferActionCardFromContext = async (message = '', reply = '', langKey = 'en', isVendor = false) => {
  const config = await langService.loadConfig();
  const combined = `${message} ${reply}`.toLowerCase();
  const ik = config.INFERENCE_KEYWORDS;

  if (isVendor) {
    if (combined.includes('wallet') || combined.includes('payout') || combined.includes('earnings') || combined.includes('withdraw') || combined.includes('balance')) {
      const v = SPECIFICATION_ACTION_CARDS_VENDOR['wallet'];
      return { title: v.title, description: v.description, icon: v.icon, primaryAction: { label: v.actionLabel, url: v.url }, buttons: v.buttons };
    }
    if (combined.includes('booking') || combined.includes('assigned') || combined.includes('visit') || combined.includes('customer') || combined.includes('schedule')) {
      const v = SPECIFICATION_ACTION_CARDS_VENDOR['my bookings'];
      return { title: v.title, description: v.description, icon: v.icon, primaryAction: { label: v.actionLabel, url: v.url }, buttons: v.buttons };
    }
    if (combined.includes('report') || combined.includes('upload') || combined.includes('fracture') || combined.includes('depth') || combined.includes('photo')) {
      const v = SPECIFICATION_ACTION_CARDS_VENDOR['upload report'];
      return { title: v.title, description: v.description, icon: v.icon, primaryAction: { label: v.actionLabel, url: v.url }, buttons: v.buttons };
    }
    if (combined.includes('dispute') || combined.includes('issue') || combined.includes('problem') || combined.includes('ticket')) {
      const v = SPECIFICATION_ACTION_CARDS_VENDOR['disputes'];
      return { title: v.title, description: v.description, icon: v.icon, primaryAction: { label: v.actionLabel, url: v.url }, buttons: v.buttons };
    }
    if (combined.includes('agreement') || combined.includes('terms') || combined.includes('policy')) {
      const v = SPECIFICATION_ACTION_CARDS_VENDOR['agreement'];
      return { title: v.title, description: v.description, icon: v.icon, primaryAction: { label: v.actionLabel, url: v.url }, buttons: v.buttons };
    }
    return null;
  }

  const matches = (keySet) => [...(keySet || [])].some(kw => combined.includes(kw));

  let cardKey = null;
  if (
    combined.includes('how to book') ||
    combined.includes('steps for') ||
    combined.includes('step') ||
    combined.includes('new survey') ||
    combined.includes('book a survey') ||
    combined.includes('booking process')
  ) {
    cardKey = 'main menu';
  } else if (matches(ik.payment))  cardKey = 'payment';
  else if (matches(ik.track))   cardKey = 'track expert';
  else if (matches(ik.report))  cardKey = 'my report';
  else if (matches(ik.booking)) cardKey = 'my booking';
  else if (matches(ik.dispute)) cardKey = 'support';

  if (!cardKey) return null;

  const base = SPECIFICATION_ACTION_CARDS_BASE[cardKey];
  const localized = langService.getCardTranslation(cardKey, langKey, config);
  const enLocalized = langService.getCardTranslation(cardKey, 'en', config);

  return {
    title:       localized.title       || enLocalized.title       || cardKey,
    description: localized.description || enLocalized.description || '',
    icon:        base.icon,
    primaryAction: {
      label: localized.actionLabel || enLocalized.actionLabel || 'Open',
      url:   base.url
    },
    buttons: langService.translateButtons(base.buttons, langKey, config)
  };
};

// ── Link extractor ────────────────────────────────────────────────────────────

const extractLinks = (text = '') => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [];
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    links.push({ text: match[1], url: match[2] });
  }
  return links;
};

// ── Main chat handler ─────────────────────────────────────────────────────────

/**
 * Resilient Ollama Chat Caller:
 * Automatically resolves endpoint (127.0.0.1 vs localhost) and model (llama3.2:latest vs qwen2.5:3b)
 * to prevent 404 errors if local Ollama or the SSH tunnel differs from the .env config.
 */
const requestOllamaChat = async (messages) => {
  const preferredUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const preferredModel = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

  const candidateEndpoints = [
    { url: preferredUrl, model: preferredModel },
    { url: 'http://localhost:11434', model: 'qwen2.5:3b' },
    { url: 'http://127.0.0.1:11434', model: 'qwen2.5:3b' },
    { url: 'http://127.0.0.1:11434', model: 'llama3.2:latest' }
  ];

  // Deduplicate endpoints
  const endpoints = candidateEndpoints.filter((ep, idx, arr) =>
    arr.findIndex(o => o.url === ep.url && o.model === ep.model) === idx
  );

  let lastError = null;

  for (const ep of endpoints) {
    try {
      const response = await axios.post(
        `${ep.url}/api/chat`,
        {
          model: ep.model,
          messages,
          stream: false,
          options: { temperature: 0.3, top_p: 0.85, num_predict: 280 }
        },
        { timeout: 35000 }
      );

      const reply = response.data?.message?.content?.trim();
      if (reply) {
        return { reply, model: ep.model };
      }
    } catch (err) {
      lastError = err;
      // If 404 model not found or connection refused, query /api/tags to see what model is actually loaded
      if (err.response?.status === 404 || err.code === 'ECONNREFUSED') {
        try {
          const tagsRes = await axios.get(`${ep.url}/api/tags`, { timeout: 3000 });
          const availableModels = (tagsRes.data?.models || []).map(m => m.name);
          if (availableModels.length > 0) {
            const fallbackModel = availableModels.find(m => m.includes('qwen')) || availableModels.find(m => m.includes('llama')) || availableModels[0];
            const retryRes = await axios.post(
              `${ep.url}/api/chat`,
              {
                model: fallbackModel,
                messages,
                stream: false,
                options: { temperature: 0.3, top_p: 0.85, num_predict: 280 }
              },
              { timeout: 35000 }
            );
            const retryReply = retryRes.data?.message?.content?.trim();
            if (retryReply) {
              return { reply: retryReply, model: fallbackModel };
            }
          }
        } catch {
          // Continue to next endpoint candidate
        }
      }
    }
  }

  throw lastError || new Error('All Ollama endpoints failed');
};

/**
 * Process Support Chat via Hybrid Model:
 * 1. Instant Rich Action Cards for preset specification clicks (0ms latency, zero hallucinations)
 * 2. Generative AI via Ollama for freeform questions with action card attachments
 *
 * All language config is now loaded dynamically from MongoDB via chatLanguageService.
 */
const processSupportChat = async ({
  message,
  language = 'en',
  conversationHistory = [],
  liveBookings = [],
  livePayments = [],
  userWallet = { balance: 0, totalCredited: 0 },
  recentWalletTransactions = [],
  userId = null,
  userName = null,
  userRole = 'USER'
}) => {
  const isVendor = String(userRole || '').toUpperCase() === 'VENDOR';

  // Load dynamic config from DB (cached)
  const config = await langService.loadConfig();

  // Auto-detect script if user types in a regional language
  const scriptLang = langService.detectScriptLanguageSync(message);
  const langKey = (scriptLang || language || 'en').toLowerCase().trim();
  const langInfo = config.LANGUAGE_CONFIG[langKey] || config.LANGUAGE_CONFIG.en || { name: 'English', native: 'English' };
  const cleanMsg = (message || '').toLowerCase().trim();
  const i18n = langService.getI18N(langKey, config);

  // ── 0. GREETING FAST-PATH ──────────────────────────────────────────────────
  if (langService.isGreeting(message, config)) {
    const ongoingBooking = Array.isArray(liveBookings) ? liveBookings.find(b => b.isOngoing) : null;

    if (isVendor) {
      const expertGreetingName = userName
        ? (/\bexpert\b/i.test(userName.trim()) ? userName.trim() : `Expert ${userName.trim()}`)
        : 'Expert';
      return {
        success: true,
        reply: `Hello ${expertGreetingName}! Welcome to Jaladhaara 24/7 Expert Partner Support. How can I assist you with your assigned bookings, report upload guidelines, or wallet payouts today?`,
        buttons: ['My Bookings', 'Wallet & Payouts', 'Upload Report', 'Disputes', 'Agreement'],
        links: [
          { text: 'Assigned Bookings', url: '/vendor/bookings' },
          { text: 'Wallet', url: '/vendor/wallet' },
          { text: 'Disputes', url: '/vendor/disputes' }
        ],
        actionCard: ongoingBooking ? {
          title: `Active Assignment: ${ongoingBooking.displayId}`,
          description: `${ongoingBooking.category} • Customer: ${ongoingBooking.customerName} (${ongoingBooking.customerPhone || 'In-app contact'}) • Scheduled on ${new Date(ongoingBooking.scheduledDate).toLocaleDateString()} at ${ongoingBooking.scheduledTime}. Status: ${ongoingBooking.status}`,
          icon: 'booking',
          primaryAction: {
            label: 'View Booking & Upload',
            url: `/vendor/bookings/${ongoingBooking.id}`
          }
        } : null,
        liveBooking: ongoingBooking || null,
        model: 'greeting-fast-response',
        isAiPowered: false,
        language: langKey
      };
    }

    return {
      success: true,
      reply: i18n.greeting(userName),
      buttons: i18n.buttons,
      links: i18n.links,
      actionCard: ongoingBooking ? {
        title: `${i18n.activeTag}: ${ongoingBooking.displayId}`,
        description: `${ongoingBooking.category} • Scheduled on ${new Date(ongoingBooking.scheduledDate).toLocaleDateString()} with Expert ${ongoingBooking.expertName}. Status: ${ongoingBooking.status}`,
        icon: 'booking',
        primaryAction: {
          label: i18n.trackExpertBtn,
          url: '/user/status?tab=ongoing'
        }
      } : null,
      liveBooking: ongoingBooking || null,
      model: 'greeting-fast-response',
      isAiPowered: false,
      language: langKey
    };
  }

  // ── 1. DATE-CONTEXT CHECK: route to Ollama for date-filtered queries ───────
  const hasDateContext =
    [...config.DATE_CONTEXT_KEYWORDS].some(kw => cleanMsg.includes(kw)) ||
    /\b\d{1,2}[/-]\d{1,2}/.test(cleanMsg) ||
    /\b(20\d{2})\b/.test(cleanMsg);

  // ── 2. HISTORY / BOOKING QUERY DETECTION ──────────────────────────────────
  const isHistoryQuery =
    !hasDateContext &&
    [...config.HISTORY_KEYWORDS].some(kw => cleanMsg.includes(kw));

  const isBookingQuery =
    !hasDateContext && (
      isHistoryQuery ||
      [...config.BOOKING_KEYWORDS].some(kw => cleanMsg === kw || cleanMsg.includes(kw))
    );

  // ── 3. LIVE BOOKING RESPONSE ───────────────────────────────────────────────
  if (isBookingQuery && Array.isArray(liveBookings) && liveBookings.length > 0) {
    const ongoingBooking = liveBookings.find(b => b.isOngoing);
    const completedBookings = liveBookings.filter(b => b.isCompleted);
    const targetBooking = isHistoryQuery
      ? (completedBookings[0] || liveBookings[0])
      : (ongoingBooking || liveBookings[0]);

    if (isVendor) {
      return {
        success: true,
        reply: isHistoryQuery
          ? `You have completed ${completedBookings.length} surveys out of ${liveBookings.length} total assigned bookings.`
          : `Here is your current assigned booking: **${targetBooking.displayId}** (${targetBooking.category}) for customer **${targetBooking.customerName}**. Status: **${targetBooking.status}**.`,
        liveBooking: targetBooking,
        allBookings: isHistoryQuery ? liveBookings : null,
        actionCard: {
          title: `Assignment: ${targetBooking.displayId}`,
          description: `${targetBooking.category} • Customer: ${targetBooking.customerName} • Scheduled on ${new Date(targetBooking.scheduledDate).toLocaleDateString()} at ${targetBooking.scheduledTime}. Location: ${targetBooking.location}`,
          icon: 'booking',
          primaryAction: {
            label: 'Open Booking Details',
            url: `/vendor/bookings/${targetBooking.id}`
          }
        },
        links: [
          { text: 'All Bookings', url: '/vendor/bookings' },
          { text: 'Wallet & Payouts', url: '/vendor/wallet' }
        ],
        buttons: ['My Bookings', 'Wallet & Payouts', 'Upload Report', 'Disputes'],
        model: 'live-database-query',
        isAiPowered: false,
        language: langKey
      };
    }

    if (isHistoryQuery) {
      return {
        success: true,
        reply: i18n.historyCount(userName, liveBookings.length),
        allBookings: liveBookings,
        liveBooking: null,
        actionCard: null,
        links: i18n.links,
        buttons: i18n.buttons,
        model: 'live-database-query',
        isAiPowered: false,
        language: langKey
      };
    }

    const statusNote = ongoingBooking ? i18n.activeBooking(userName) : i18n.pastBooking(userName);

    return {
      success: true,
      reply: statusNote,
      liveBooking: targetBooking,
      actionCard: {
        title: `${targetBooking.isOngoing ? i18n.activeTag : i18n.completedTag}: ${targetBooking.displayId}`,
        description: `${targetBooking.category} • Scheduled on ${new Date(targetBooking.scheduledDate).toLocaleDateString()} with Expert ${targetBooking.expertName}. Status: ${targetBooking.status}`,
        icon: targetBooking.isOngoing ? 'booking' : 'document',
        primaryAction: {
          label: targetBooking.isOngoing ? i18n.trackExpertBtn : i18n.downloadReport,
          url: targetBooking.isOngoing ? '/user/status?tab=ongoing' : '/user/survey-reports'
        }
      },
      links: i18n.links,
      buttons: i18n.buttons,
      model: 'live-database-query',
      isAiPowered: false,
      language: langKey
    };
  }

  // ── 4. ZERO BOOKINGS RESPONSE ──────────────────────────────────────────────
  if (isBookingQuery && userId && (!liveBookings || liveBookings.length === 0)) {
    if (isVendor) {
      const expertGreetingName = userName
        ? (/\bexpert\b/i.test(userName.trim()) ? userName.trim() : `Expert ${userName.trim()}`)
        : 'Expert';
      return {
        success: true,
        reply: `Hello ${expertGreetingName}, you currently have no assigned survey bookings awaiting action. Make sure your status is set to ONLINE on your dashboard to receive new bookings in your service zone!`,
        actionCard: {
          title: 'Expert Dashboard',
          description: 'Keep your status active to receive new customer bookings in your district.',
          icon: 'booking',
          primaryAction: {
            label: 'Open Dashboard',
            url: '/vendor/dashboard'
          }
        },
        links: [
          { text: 'Expert Dashboard', url: '/vendor/dashboard' },
          { text: 'Wallet', url: '/vendor/wallet' }
        ],
        buttons: ['My Bookings', 'Wallet & Payouts', 'Disputes'],
        model: 'instant-spec-card',
        isAiPowered: false,
        language: langKey
      };
    }

    return {
      success: true,
      reply: i18n.zeroBookings(userName),
      actionCard: {
        title: i18n.bookSurveyTitle,
        description: i18n.bookSurveyDesc,
        icon: 'booking',
        primaryAction: {
          label: i18n.bookSurveyBtn,
          url: '/user/services'
        }
      },
      links: i18n.links,
      buttons: i18n.buttons,
      model: 'instant-spec-card',
      isAiPowered: false,
      language: langKey
    };
  }

  // ── 5. SPECIFICATION CARD FAST-PATH ───────────────────────────────────────
  if (isVendor) {
    const vCard = findVendorSpecificationCard(message);
    if (vCard) {
      return {
        success: true,
        reply: vCard.description,
        actionCard: vCard,
        links: [{ text: vCard.primaryAction.label, url: vCard.primaryAction.url }],
        buttons: vCard.buttons,
        model: 'instant-spec-card',
        isAiPowered: false,
        language: langKey
      };
    }
  } else {
    const directCard = await findSpecificationCard(message, langKey);
    if (directCard) {
      return {
        success: true,
        reply: directCard.description,
        actionCard: directCard,
        links: [{ text: directCard.primaryAction.label, url: directCard.primaryAction.url }],
        buttons: directCard.buttons,
        model: 'instant-spec-card',
        isAiPowered: false,
        language: langKey
      };
    }
  }

  // ── 6. GENERATIVE AI PATH ─────────────────────────────────────────────────
  const languageInstruction = langKey !== 'en'
    ? `\nCRITICAL INSTRUCTION: The user has selected language: ${langInfo.name} (${langInfo.native}). You MUST reply entirely in ${langInfo.name} (${langInfo.native}) using proper script. Do NOT reply in English. Keep URL links in clean English paths.`
    : '\nReply in clear, professional English.';

  let userProfileContext = '';
  let userBookingContext = '';
  let userPaymentContext = '';

  if (isVendor) {
    if (userName) {
      userProfileContext = `\nCURRENT EXPERT PROFILE:\n- Expert's Full Name: ${userName}\nAddress them respectfully as Expert ${userName} or Dr./Mr. ${userName}.`;
    }
    if (Array.isArray(liveBookings) && liveBookings.length > 0) {
      userBookingContext = `\nEXPERT'S REAL ASSIGNED SURVEY BOOKINGS IN JALADHAARA DATABASE:\n` +
        liveBookings.map((b, i) =>
          `${i + 1}. Booking ID: ${b.displayId}, Category: ${b.category}, Status: ${b.status} (${b.isOngoing ? 'Active/Upcoming' : 'Completed'}), Scheduled: ${new Date(b.scheduledDate).toLocaleDateString()} at ${b.scheduledTime}, Customer: ${b.customerName} (Phone: ${b.customerPhone || 'In app'}), Location: ${b.location}, Payout Share: ₹${b.payoutAmount}`
        ).join('\n') +
        `\nUse this real assigned booking information to answer questions about customer visits, status, or locations!`;
    } else if (userId) {
      userBookingContext = `\nEXPERT BOOKING CONTEXT: The expert has 0 assigned survey bookings in the system right now.`;
    }

    if (userId) {
      userPaymentContext = `\nEXPERT'S FINANCIAL & WALLET CONTEXT IN JALADHAARA:\n` +
        `- Current Available Wallet Balance: ₹${userWallet?.balance || 0} (Total Earnings Credited: ₹${userWallet?.totalCredited || 0})\n` +
        `- Recent Wallet Transactions / Payouts:\n` +
        (Array.isArray(recentWalletTransactions) && recentWalletTransactions.length > 0
          ? recentWalletTransactions.map((w, i) => `  ${i + 1}. Amount: ₹${w.amount} (${w.type}), Status: ${w.status}, Date: ${new Date(w.date).toLocaleDateString()}, Note: ${w.description || 'Wallet credit'}`).join('\n')
          : '  No recent wallet transactions recorded.') +
        `\nWhen the expert asks about their earnings, wallet balance, or bank withdrawal, use these EXACT figures! Always link to [Wallet & Payouts](/vendor/wallet).`;
    }
  } else {
    if (userName) {
      userProfileContext = `\nCURRENT USER PROFILE:\n- User's Full Name: ${userName}\nWhen greeting the user or addressing them, greet them warmly by their name (e.g. "Hello ${userName}!" or in Hindi "नमस्ते ${userName} जी!"). If they ask who they are or their name, confirm their name is ${userName}.`;
    }

    if (Array.isArray(liveBookings) && liveBookings.length > 0) {
      userBookingContext = `\nUSER'S REAL SURVEY BOOKINGS IN JALADHAARA DATABASE:\n` +
        liveBookings.map((b, i) =>
          `${i + 1}. Booking ID: ${b.displayId}, Category: ${b.category}, Status: ${b.status} (${b.isOngoing ? 'Active/Upcoming' : 'Completed/Past'}), Date: ${new Date(b.scheduledDate).toLocaleDateString()} at ${b.scheduledTime}, Expert Name: ${b.expertName} (Phone: ${b.expertPhone || 'available on arrival'}), Location: ${b.location}`
        ).join('\n') +
        `\nUse this real information to answer user questions about their specific booking, expert, schedule, or past survey history!`;
    } else if (userId) {
      userBookingContext = `\nUSER CONTEXT: The user is currently logged in, but has 0 active bookings in the database. If they ask about their bookings, politely let them know they have no active surveys yet and offer to help them book one.`;
    }

    if (userId) {
      userPaymentContext = `\nUSER'S REAL FINANCIAL & PAYMENT CONTEXT IN JALADHAARA:\n` +
        `- Current Wallet Balance: ₹${userWallet?.balance || 0} (Total Credited / Refunded: ₹${userWallet?.totalCredited || 0})\n` +
        `- Recent Payments Made (Sent) by User:\n` +
        (Array.isArray(livePayments) && livePayments.length > 0
          ? livePayments.map((p, i) => `  ${i + 1}. Amount: ₹${p.amount} (${p.type}), Status: ${p.status}, Date: ${new Date(p.date).toLocaleDateString()}, Booking: ${p.bookingId}`).join('\n')
          : '  No sent payments recorded yet.') +
        `\n- Recent Wallet / Refund Transactions Received:\n` +
        (Array.isArray(recentWalletTransactions) && recentWalletTransactions.length > 0
          ? recentWalletTransactions.map((w, i) => `  ${i + 1}. Amount: ₹${w.amount} (${w.type}), Status: ${w.status}, Date: ${new Date(w.date).toLocaleDateString()}, Note: ${w.description || 'Wallet credit'}`).join('\n')
          : '  No received transactions/refunds recorded yet.') +
        `\nWhen users ask about their payments sent, payments received, refunds, wallet balance, or invoices, use these EXACT figures! If they ask "what was my last payment sent and received", explicitly state their last payment sent amount and their last refund/received amount, and provide the link [Payments & Invoices](/user/payments-invoices).`;
    }
  }

  const basePrompt = isVendor ? JALADHAARA_VENDOR_SYSTEM_PROMPT : JALADHAARA_SYSTEM_PROMPT;
  const fullSystemPrompt = `${basePrompt}\n${languageInstruction}\n${userProfileContext}\n${userBookingContext}\n${userPaymentContext}`;

  const messages = [{ role: 'system', content: fullSystemPrompt }];

  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    conversationHistory.slice(-6).forEach(item => {
      if (item.sender === 'user' || item.role === 'user') {
        messages.push({ role: 'user', content: String(item.text || item.content || '') });
      } else if (item.sender === 'bot' || item.role === 'assistant') {
        messages.push({ role: 'assistant', content: String(item.text || item.content || '') });
      }
    });
  }

  messages.push({ role: 'user', content: message });

  try {
    const { reply: rawReply, model: usedModel } = await requestOllamaChat(messages);

    if (rawReply) {
      const extractedLinks  = extractLinks(rawReply);
      const contextualCard  = await inferActionCardFromContext(message, rawReply, langKey, isVendor);
      const finalLinks      = extractedLinks.length > 0
        ? extractedLinks
        : (contextualCard ? [{ text: contextualCard.primaryAction.label, url: contextualCard.primaryAction.url }] : []);
      const defaultButtons = isVendor
        ? ['My Bookings', 'Wallet & Payouts', 'Upload Report', 'Disputes']
        : (i18n.buttons || ['My Booking', 'Payment', 'My Report', 'Track Expert']);
      const finalButtons = contextualCard ? contextualCard.buttons : defaultButtons;

      return {
        success: true,
        reply: rawReply,
        actionCard: contextualCard,
        links: finalLinks,
        buttons: finalButtons,
        model: usedModel,
        isAiPowered: true,
        language: langKey
      };
    }

    throw new Error('Empty response received from Ollama model');
  } catch (err) {
    console.warn(`[OllamaSupportService] Ollama chat unavailable (${err.message}). Using smart specification fallback.`);

    if (isVendor) {
      let fallbackKey = 'main menu';
      if (/\b(wallet|payout|earnings|withdraw|balance)\b/i.test(cleanMsg)) {
        fallbackKey = 'wallet';
      } else if (/\b(booking|assigned|customer|schedule)\b/i.test(cleanMsg)) {
        fallbackKey = 'my bookings';
      } else if (/\b(report|upload|depth|fracture|photo)\b/i.test(cleanMsg)) {
        fallbackKey = 'upload report';
      } else if (/\b(dispute|ticket|problem|issue)\b/i.test(cleanMsg)) {
        fallbackKey = 'disputes';
      } else if (/\b(agreement|terms)\b/i.test(cleanMsg)) {
        fallbackKey = 'agreement';
      }

      const vCard = SPECIFICATION_ACTION_CARDS_VENDOR[fallbackKey];
      return {
        success: true,
        reply: vCard.description,
        actionCard: {
          title: vCard.title,
          description: vCard.description,
          icon: vCard.icon,
          primaryAction: { label: vCard.actionLabel, url: vCard.url }
        },
        links: [{ text: vCard.actionLabel, url: vCard.url }],
        buttons: vCard.buttons,
        model: 'smart-specification-fallback',
        isAiPowered: false,
        language: langKey
      };
    }

    let fallbackCardKey = 'main menu';
    let fbDesc = '';

    const isPaymentQuery =
      /\b(payment|paid|pay|sent|recieved|received|refund|wallet|invoice|fee|transaction)\b/i.test(cleanMsg) ||
      /(చెల్లింపు|డబ్బు|రీఫండ్|వాలెట్)/.test(cleanMsg) ||
      /(भुगतान|पैसे|रिफंड|वॉलेट)/.test(cleanMsg);

    if (isPaymentQuery) {
      fallbackCardKey = 'payment';
      const lastSent = livePayments && livePayments[0];
      const lastRecv = recentWalletTransactions && recentWalletTransactions[0];
      if (lastSent || lastRecv) {
        fbDesc = `Here is your payment overview:\n`;
        if (lastSent) fbDesc += `• Last Payment Sent: ₹${lastSent.amount} (${lastSent.type}) on ${new Date(lastSent.date).toLocaleDateString()} [Status: ${lastSent.status}]\n`;
        if (lastRecv) fbDesc += `• Last Received / Refund: ₹${lastRecv.amount} on ${new Date(lastRecv.date).toLocaleDateString()} [Status: ${lastRecv.status}]\n`;
        fbDesc += `• Current Wallet Balance: ₹${userWallet?.balance || 0}\n\nView details in [Payments & Invoices](/user/payments-invoices).`;
      } else {
        fbDesc = `You currently have no recorded payments or refunds. Your wallet balance is ₹${userWallet?.balance || 0}. Manage your billing in [Payments & Invoices](/user/payments-invoices).`;
      }
    } else if (/\b(dispute|complaint|issue|problem|help|ticket)\b/i.test(cleanMsg)) {
      fallbackCardKey = 'support';
    } else if (/\b(report|pdf|download|document)\b/i.test(cleanMsg)) {
      fallbackCardKey = 'my report';
    } else if (/\b(track|expert|location|status|where)\b/i.test(cleanMsg)) {
      fallbackCardKey = 'track expert';
    }

    const fallbackBase = SPECIFICATION_ACTION_CARDS_BASE[fallbackCardKey] || SPECIFICATION_ACTION_CARDS_BASE['main menu'];
    const fallbackLocalized = langService.getCardTranslation(fallbackCardKey, langKey, config);
    const fallbackEn = langService.getCardTranslation(fallbackCardKey, 'en', config);

    const fbTitle = fallbackLocalized.title || fallbackEn.title || 'Jaladhaara Support';
    if (!fbDesc) {
      fbDesc = fallbackLocalized.description || fallbackEn.description || 'Welcome to Jaladhaara Support. How can we assist with your survey today?';
    }
    const fbLabel = fallbackLocalized.actionLabel || fallbackEn.actionLabel || 'Open';

    return {
      success: true,
      reply: fbDesc,
      actionCard: {
        title: fbTitle,
        description: fallbackLocalized.description || fallbackEn.description || fbDesc,
        icon: fallbackBase.icon,
        primaryAction: { label: fbLabel, url: fallbackBase.url }
      },
      links: [{ text: fbLabel, url: fallbackBase.url }],
      buttons: langService.translateButtons(fallbackBase.buttons, langKey, config),
      model: 'smart-specification-fallback',
      isAiPowered: false,
      language: langKey
    };
  }
};

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  processSupportChat,
  findSpecificationCard,
  inferActionCardFromContext,
  SPECIFICATION_ACTION_CARDS_BASE,
  // Export cache invalidation so admin routes can trigger it
  invalidateLangCache: langService.invalidateCache
};
