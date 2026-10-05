const axios = require('axios');
const langService = require('./chatLanguageService');

/**
 * Jaladhaara Groundwater Survey System Prompt (static — app-level content, not language-specific)
 */
const JALADHAARA_SYSTEM_PROMPT = `
You are the official 24/7 AI Customer Support Assistant for "Jaladhaara" (जलधारा) – India's premier Groundwater Survey Booking Platform.

YOUR MISSION:
Help users with booking groundwater surveys, checking survey status, expert tracking, payments, invoices, reports, and addressing FAQs with utmost courtesy, clarity, and professionalism.

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
   - View Bookings / Status: /user/status
   - Upcoming Survey Schedule: /user/status?tab=upcoming
   - Live Track Expert: /user/status?tab=ongoing
   - Completed Surveys / Ratings: /user/status?tab=completed
   - Payments & Invoices: /user/payments-invoices
   - Download Survey Reports (PDF): /user/survey-reports
   - Submit Dispute / Raise Ticket: /user/disputes/create
   - Helpline: +91 800-000-0000 | Email: info@jaladhaaraapp.com

RESPONSE RULES:
- Always format internal app links as Markdown links like [View Bookings](/user/status), [Payments](/user/payments-invoices), or [Survey Reports](/user/survey-reports).
- Keep responses brief (under 50 words / 2 to 3 sentences maximum) so users get fast, clear answers.
- Be friendly, respectful, and reassuring.
- When answering in Indian regional languages (e.g., Hindi, Telugu, Tamil, Marathi, Kannada), use natural phrasing and proper script, but keep URLs in clean English paths.
`;

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
  'main menu':      { icon: 'water',    url: '/user/book-service',               buttons: ['My Booking', 'Payment', 'My Report', 'Track Expert', 'Support'] }
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
const inferActionCardFromContext = async (message = '', reply = '', langKey = 'en') => {
  const config = await langService.loadConfig();
  const combined = `${message} ${reply}`.toLowerCase();
  const ik = config.INFERENCE_KEYWORDS;

  const matches = (keySet) => [...(keySet || [])].some(kw => combined.includes(kw));

  let cardKey = null;
  if (matches(ik.payment))  cardKey = 'payment';
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
 * Process Support Chat via Hybrid Model:
 * 1. Instant Rich Action Cards for preset specification clicks (0ms latency, zero hallucinations)
 * 2. Generative AI via Ollama Qwen 2.5 3B for freeform questions with action card attachments
 *
 * All language config is now loaded dynamically from MongoDB via chatLanguageService.
 */
const processSupportChat = async ({
  message,
  language = 'en',
  conversationHistory = [],
  liveBookings = [],
  userId = null,
  userName = null
}) => {
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

  // ── 6. GENERATIVE AI PATH ─────────────────────────────────────────────────
  const languageInstruction = langKey !== 'en'
    ? `\nCRITICAL INSTRUCTION: The user has selected language: ${langInfo.name} (${langInfo.native}). You MUST reply entirely in ${langInfo.name} (${langInfo.native}) using proper script. Do NOT reply in English. Keep URL links in clean English paths.`
    : '\nReply in clear, professional English.';

  let userProfileContext = '';
  if (userName) {
    userProfileContext = `\nCURRENT USER PROFILE:\n- User's Full Name: ${userName}\nWhen greeting the user or addressing them, greet them warmly by their name (e.g. "Hello ${userName}!" or in Hindi "नमस्ते ${userName} जी!"). If they ask who they are or their name, confirm their name is ${userName}.`;
  }

  let userBookingContext = '';
  if (Array.isArray(liveBookings) && liveBookings.length > 0) {
    userBookingContext = `\nUSER'S REAL SURVEY BOOKINGS IN JALADHAARA DATABASE:\n` +
      liveBookings.map((b, i) =>
        `${i + 1}. Booking ID: ${b.displayId}, Category: ${b.category}, Status: ${b.status} (${b.isOngoing ? 'Active/Upcoming' : 'Completed/Past'}), Date: ${new Date(b.scheduledDate).toLocaleDateString()} at ${b.scheduledTime}, Expert Name: ${b.expertName} (Phone: ${b.expertPhone || 'available on arrival'}), Location: ${b.location}`
      ).join('\n') +
      `\nUse this real information to answer user questions about their specific booking, expert, schedule, or past survey history!`;
  } else if (userId) {
    userBookingContext = `\nUSER CONTEXT: The user is currently logged in, but has 0 active bookings in the database. If they ask about their bookings, politely let them know they have no active surveys yet and offer to help them book one.`;
  }

  const fullSystemPrompt = `${JALADHAARA_SYSTEM_PROMPT}\n${languageInstruction}\n${userProfileContext}\n${userBookingContext}`;

  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const ollamaModel   = process.env.OLLAMA_MODEL    || 'qwen2.5:3b';

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
    const response = await axios.post(
      `${ollamaBaseUrl}/api/chat`,
      { model: ollamaModel, messages, stream: false, options: { temperature: 0.3, top_p: 0.85, num_predict: 120 } },
      { timeout: 35000 }
    );

    const rawReply = response.data?.message?.content?.trim();

    if (rawReply) {
      const extractedLinks  = extractLinks(rawReply);
      const contextualCard  = await inferActionCardFromContext(message, rawReply, langKey);
      const finalLinks      = extractedLinks.length > 0
        ? extractedLinks
        : (contextualCard ? [{ text: contextualCard.primaryAction.label, url: contextualCard.primaryAction.url }] : []);
      const finalButtons = contextualCard ? contextualCard.buttons : (i18n.buttons || ['My Booking', 'Payment', 'My Report', 'Track Expert']);

      return {
        success: true,
        reply: rawReply,
        actionCard: contextualCard,
        links: finalLinks,
        buttons: finalButtons,
        model: ollamaModel,
        isAiPowered: true,
        language: langKey
      };
    }

    throw new Error('Empty response received from Ollama model');
  } catch (err) {
    console.warn(`[OllamaSupportService] Ollama chat unavailable (${err.message}). Using specification fallback.`);

    // Fallback to main menu card
    const mainMenuBase = SPECIFICATION_ACTION_CARDS_BASE['main menu'];
    const mainMenuLocalized = langService.getCardTranslation('main menu', langKey, config);
    const mainMenuEn = langService.getCardTranslation('main menu', 'en', config);

    const fbTitle = mainMenuLocalized.title || mainMenuEn.title || 'Jaladhaara Support';
    const fbDesc  = mainMenuLocalized.description || mainMenuEn.description || 'Welcome to Jaladhaara Support. How can we assist with your survey today?';
    const fbLabel = mainMenuLocalized.actionLabel  || mainMenuEn.actionLabel  || 'Open Portal';

    return {
      success: true,
      reply: fbDesc,
      actionCard: {
        title: fbTitle,
        description: fbDesc,
        icon: mainMenuBase.icon,
        primaryAction: { label: fbLabel, url: mainMenuBase.url }
      },
      links: [{ text: fbLabel, url: mainMenuBase.url }],
      buttons: langService.translateButtons(mainMenuBase.buttons, langKey, config),
      model: 'specification-fallback',
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
