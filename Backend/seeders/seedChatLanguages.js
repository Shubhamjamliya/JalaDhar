/**
 * seedChatLanguages.js
 *
 * One-time seeder that migrates ALL hardcoded chatbot language data from
 * ollamaSupportService.js into the ChatLanguage MongoDB collection.
 *
 * Run: node seeders/seedChatLanguages.js
 *
 * Safe to run multiple times — uses upsert so existing docs are updated.
 */

const mongoose = require('mongoose');
require('dotenv').config();
const ChatLanguage = require('../models/ChatLanguage');

const SEED_DATA = [
  // ─────────────────────── ENGLISH ──────────────────────────────────────────
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    isEnabled: true,
    isRTL: false,
    scriptRange: '',  // English uses ASCII, no special Unicode range needed
    greetings: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'help'],
    buttons: ['My Booking', 'Payment', 'My Report', 'Track Expert'],
    links: [
      { text: 'View Bookings', url: '/user/status' },
      { text: 'Survey Reports', url: '/user/survey-reports' }
    ],
    i18n: {
      greeting:        'Hello{name}! How can I assist you with your groundwater survey today?',
      activeBooking:   'Hello{name}! I found an active survey booking scheduled for your account:',
      pastBooking:     'Hello{name}! You do not have an active survey in progress right now, but here is your most recent completed survey:',
      historyCount:    'Hello{name}! You have {count} groundwater survey record(s) in your account. Showing all below:',
      zeroBookings:    "Hello{name}! You don't have any groundwater survey appointments booked yet. Would you like to schedule a certified expert survey for your land or borewell?",
      activeTag:       'Active Booking',
      completedTag:    'Completed Survey',
      trackExpertBtn:  'Track Expert Live',
      downloadReport:  'Download Survey Report',
      bookSurveyTitle: 'Book a Groundwater Survey',
      bookSurveyDesc:  'Certified hydrogeologists with advanced geophysical resistivity & electromagnetic meters.',
      bookSurveyBtn:   'Book Survey Now'
    },
    cardTranslations: [
      { cardKey: 'payment',        title: 'Payments & Invoices',              description: 'Manage your 25% survey advance, settle pending survey balances, or download official digital GST invoices.',                                       actionLabel: 'Open Payments & Invoices' },
      { cardKey: 'pay now',        title: 'Complete Survey Payment',          description: 'Complete your booking advance deposit or pending survey balance securely through Razorpay.',                                                          actionLabel: 'Pay Securely Now' },
      { cardKey: 'payment status', title: 'Payment History & Invoices',       description: 'View transaction receipts, advance payment confirmations, and download your official GST tax invoices.',                                             actionLabel: 'View Invoices & Receipts' },
      { cardKey: 'my booking',     title: 'My Survey Bookings',               description: 'View and manage all your active and past groundwater survey appointments, assigned experts, and schedules.',                                         actionLabel: 'View My Bookings' },
      { cardKey: 'view booking',   title: 'Survey Bookings Portal',           description: 'Check your booking details, survey address, package options, and assigned hydrogeologist credentials.',                                              actionLabel: 'Open Bookings List' },
      { cardKey: 'view schedule',  title: 'Upcoming Survey Schedule',         description: 'Check your confirmed survey date and appointed time slot for the expert site visit.',                                                                actionLabel: 'Check Survey Schedule' },
      { cardKey: 'track expert',   title: 'Live Expert GPS Tracking',         description: 'Track your assigned groundwater survey expert live on the map as they navigate towards your location.',                                              actionLabel: 'Track Expert Live' },
      { cardKey: 'my report',      title: 'Certified Survey Reports',         description: 'Download verified hydrogeological survey reports (PDF) containing GPS drilling coordinates and estimated depths.',                                   actionLabel: 'Download Survey Reports' },
      { cardKey: 'view report',    title: 'Download Survey PDF',              description: 'Access and save your official digital groundwater survey report and borewell point recommendations.',                                                 actionLabel: 'View & Download Report' },
      { cardKey: 'rate service',   title: 'Rate Survey Experience',           description: 'Submit your rating and feedback for the groundwater expert who conducted your survey.',                                                              actionLabel: 'Rate Your Expert' },
      { cardKey: 'support',        title: 'Jaladhaara Helpline & Dispute Resolution', description: 'Call our customer helpline at +91 800-000-0000 or file an official resolution ticket with support.',                                       actionLabel: 'Create Dispute Ticket' },
      { cardKey: 'main menu',      title: 'Jaladhaara Main Menu',             description: 'Welcome to Jaladhaara Groundwater Survey Services at your fingertips. How can we help you today?',                                                  actionLabel: 'Book a New Survey' }
    ],
    buttonLabelMap: {}, // English is the base — no translation needed
    synonyms: [
      { cardKey: 'payment',        keywords: ['payment', 'pay', 'invoice', 'bill'] },
      { cardKey: 'pay now',        keywords: ['pay now'] },
      { cardKey: 'payment status', keywords: ['payment status'] },
      { cardKey: 'my booking',     keywords: ['my booking', 'bookings', 'view booking', 'my survey'] },
      { cardKey: 'view schedule',  keywords: ['view schedule', 'schedule'] },
      { cardKey: 'track expert',   keywords: ['track expert', 'track', 'location'] },
      { cardKey: 'my report',      keywords: ['my report', 'report', 'pdf', 'download'] },
      { cardKey: 'support',        keywords: ['support', 'helpline', 'dispute', 'complaint'] },
      { cardKey: 'main menu',      keywords: ['main menu', 'menu'] }
    ],
    inferenceKeywords: {
      payment:  ['pay', 'invoice', 'bill'],
      track:    ['track', 'expert', 'location'],
      report:   ['report', 'pdf', 'download'],
      booking:  ['booking', 'schedule', 'appointment'],
      dispute:  ['dispute', 'problem', 'issue', 'complaint']
    },
    dateContextKeywords: ['this month', 'last month', 'this week', 'today', 'yesterday'],
    historyKeywords:     ['history', 'past booking', 'previous booking', 'completed survey'],
    bookingKeywords:     ['my booking', 'current booking', 'active booking', 'booking status', 'who is my expert', 'my survey']
  },

  // ─────────────────────── TELUGU ───────────────────────────────────────────
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    isEnabled: true,
    isRTL: false,
    scriptRange: '\\u0C00-\\u0C7F',
    greetings: ['హలో', 'నమస్కారం', 'నమస్తే', 'బాగున్నారా', 'హాయ్', 'నమస్కారము'],
    buttons: ['నా బుకింగ్', 'చెల్లింపు', 'సర్వే నివేదిక', 'నిపుణుడి ట్రాకింగ్'],
    links: [
      { text: 'బుకింగ్స్ చూడండి', url: '/user/status' },
      { text: 'సర్వే నివేదికలు', url: '/user/survey-reports' }
    ],
    i18n: {
      greeting:        'నమస్కారం{name} గారూ! జలధార భూగర్భజల సర్వే సహాయానికి స్వాగతం. ఈరోజు మీ సర్వేకి సంబంధించి నేను మీకు ఎలా సహాయపడగలను?',
      activeBooking:   'నమస్కారం{name} గారూ! మీ ఖాతాలో 1 సక్రియ సర్వే బుకింగ్ నమోదై ఉన్నది:',
      pastBooking:     'నమస్కారం{name} గారూ! మీకు ప్రస్తుతం సక్రియ సర్వే ఏదీ లేదు, కానీ మీ గత పూర్తయిన సర్వే వివరాలు ఇక్కడ ఉన్నాయి:',
      historyCount:    'నమస్కారం{name} గారూ! మీ ఖాతాలో మొత్తం {count} సర్వే బుకింగ్‌ల చరిత్ర నమోదై ఉంది:',
      zeroBookings:    'నమస్కారం{name} గారూ! మీ ఖాతాలో ఇంకా ఎటువంటి భూగర్భజల సర్వే బుకింగ్ నమోదు కాలేదు. మీ భూమి లేదా బోరుబావి కోసం సర్టిఫైడ్ నిపుణుల సర్వేను బుక్ చేయాలనుకుంటున్నారా?',
      activeTag:       'సక్రియ బుకింగ్',
      completedTag:    'పూర్తయిన సర్వే',
      trackExpertBtn:  'నిపుణుడిని లైవ్ ట్రాక్ చేయండి',
      downloadReport:  'సర్వే రిపోర్ట్ డౌన్‌లోడ్ చేయండి',
      bookSurveyTitle: 'భూగర్భజల సర్వే బుక్ చేయండి',
      bookSurveyDesc:  'ఆధునిక జియోఫిజికల్ రెసిస్టివిటీ మీటర్లతో సర్టిఫైడ్ హైడ్రోజియాలజిస్టులు.',
      bookSurveyBtn:   'ఇప్పుడే సర్వే బుక్ చేయండి'
    },
    cardTranslations: [
      { cardKey: 'payment',        title: 'చెల్లింపులు & ఇన్వాయిస్‌లు',          description: 'మీ 25% సర్వే అడ్వాన్స్ చెల్లించండి, మిగిలిన బకాయిలను క్లియర్ చేయండి లేదా జీఎస్టీ ఇన్వాయిస్ డౌన్‌లోడ్ చేసుకోండి.',                  actionLabel: 'చెల్లింపుల పోర్టల్ తెరవండి' },
      { cardKey: 'pay now',        title: 'సర్వే చెల్లింపు పూర్తి చేయండి',       description: 'మీ సర్వే అడ్వాన్స్ డిపాజిట్ లేదా బకాయి మొత్తాన్ని రేజర్‌పే ద్వారా సురక్షితంగా చెల్లించండి.',                                             actionLabel: 'ఇప్పుడే చెల్లించండి' },
      { cardKey: 'payment status', title: 'చెల్లింపు చరిత్ర & రసీదులు',           description: 'మీ లావాదేవీ రసీదులు, అడ్వాన్స్ చెల్లింపు రసీదులు చూడండి మరియు జీఎస్టీ ఇన్వాయిస్‌లు డౌన్‌లోడ్ చేసుకోండి.',                           actionLabel: 'ఇన్వాయిస్‌లు & రసీదులు చూడండి' },
      { cardKey: 'my booking',     title: 'నా సర్వే బుకింగ్స్',                  description: 'మీ సక్రియ మరియు గత భూగర్భజల సర్వే బుకింగ్‌లు, కేటాయించిన నిపుణుల వివరాలు మరియు షెడ్యూల్ చూడండి.',                                       actionLabel: 'నా బుకింగ్స్ చూడండి' },
      { cardKey: 'view booking',   title: 'సర్వే బుకింగ్స్ పోర్టల్',              description: 'మీ బుకింగ్ వివరాలు, సర్వే చిరునామా, ప్యాకేజీ మరియు హైడ్రోజియాలజిస్ట్ వివరాలను తనిఖీ చేయండి.',                                           actionLabel: 'బుకింగ్స్ జాబితా తెరవండి' },
      { cardKey: 'view schedule',  title: 'రాబోయే సర్వే షెడ్యూల్',               description: 'నిపుణుల సైట్ సందర్శన కోసం మీ నిర్ధారిత సర్వే తేదీ మరియు సమయ స్లాట్‌ను తనిఖీ చేయండి.',                                                  actionLabel: 'సర్వే షెడ్యూల్ చూడండి' },
      { cardKey: 'track expert',   title: 'నిపుణుడి లైవ్ జీపీఎస్ ట్రాకింగ్',      description: 'మీ స్థలానికి వస్తున్న సర్వే నిపుణుడి లైవ్ జీపీఎస్ లొకేషన్‌ను మ్యాప్‌లో ట్రాక్ చేయండి.',                                                actionLabel: 'నిపుణుడిని లైవ్ ట్రాక్ చేయండి' },
      { cardKey: 'my report',      title: 'సర్టిఫైడ్ సర్వే నివేదికలు',            description: 'జీపీఎస్ డ్రిల్లింగ్ కోఆర్డినేట్లు మరియు అంచనా వేసిన లోతులతో కూడిన అధికారిక సర్వే రిపోర్ట్ (PDF) డౌన్‌లోడ్ చేసుకోండి.',              actionLabel: 'సర్వే నివేదికలు డౌన్‌లోడ్ చేయండి' },
      { cardKey: 'view report',    title: 'సర్వే PDF డౌన్‌లోడ్ చేయండి',           description: 'మీ అధికారిక డిజిటల్ భూగర్భజల సర్వే నివేదిక మరియు బోరుబావి పాయింట్ సిఫార్సులను పొందండి.',                                               actionLabel: 'నివేదికను డౌన్‌లోడ్ చేయండి' },
      { cardKey: 'rate service',   title: 'సర్వే అనుభవానికి రేటింగ్ ఇవ్వండి',      description: 'మీ సర్వేను నిర్వహించిన భూగర్భజల నిపుణుడికి మీ రేటింగ్ మరియు అభిప్రాయాన్ని సమర్పించండి.',                                               actionLabel: 'నిపుణుడికి రేటింగ్ ఇవ్వండి' },
      { cardKey: 'support',        title: 'జలధార హెల్ప్‌లైన్ & సహాయం',           description: 'మా కస్టమర్ హెల్ప్‌లైన్ +91 800-000-0000 కు కాల్ చేయండి లేదా సహాయ టికెట్‌ను నమోదు చేయండి.',                                          actionLabel: 'సమస్య టికెట్ నమోదు చేయండి' },
      { cardKey: 'main menu',      title: 'జలధార ప్రధాన మెనూ',                   description: 'జలధార భూగర్భజల సర్వే సేవలకు స్వాగతం. ఈరోజు మేము మీకు ఎలా సహాయపడగలం?',                                                                actionLabel: 'కొత్త సర్వేను బుక్ చేయండి' }
    ],
    buttonLabelMap: {
      'Pay Now':        'ఇప్పుడే చెల్లించండి',
      'Payment Status': 'చెల్లింపు స్థితి',
      'Main Menu':      'ప్రధాన మెనూ',
      'My Booking':     'నా బుకింగ్',
      'View Booking':   'బుకింగ్ చూడండి',
      'View Schedule':  'షెడ్యూల్ చూడండి',
      'Track Expert':   'నిపుణుడి ట్రాకింగ్',
      'View Report':    'నివేదిక చూడండి',
      'Rate Service':   'రేటింగ్ ఇవ్వండి',
      'Submit Report':  'నివేదిక సమర్పించండి',
      'Payment':        'చెల్లింపు',
      'My Report':      'సర్వే నివేదిక',
      'Support':        'సహాయం'
    },
    synonyms: [
      { cardKey: 'payment',        keywords: ['చెల్లింపు', 'ఇన్వాయిస్', 'బిల్లు'] },
      { cardKey: 'pay now',        keywords: ['ఇప్పుడే చెల్లించండి', 'ఇప్పుడే పే చేయండి'] },
      { cardKey: 'payment status', keywords: ['చెల్లింపు స్థితి'] },
      { cardKey: 'my booking',     keywords: ['నా బుకింగ్', 'బుకింగ్', 'సర్వే బుకింగ్'] },
      { cardKey: 'view schedule',  keywords: ['షెడ్యూల్', 'సర్వే షెడ్యూల్'] },
      { cardKey: 'track expert',   keywords: ['నిపుణుడి ట్రాకింగ్', 'నిపుణుడిని ట్రాక్ చేయండి', 'ట్రాకింగ్', 'ట్రాక్'] },
      { cardKey: 'my report',      keywords: ['నివేదిక', 'సర్వే నివేదిక', 'రిపోర్ట్'] },
      { cardKey: 'support',        keywords: ['సహాయం', 'హెల్ప్‌లైన్'] },
      { cardKey: 'main menu',      keywords: ['మెనూ', 'ప్రధాన మెనూ'] }
    ],
    inferenceKeywords: {
      payment:  ['చెల్లింపు', 'ఇన్వాయిస్'],
      track:    ['ట్రాక్', 'నిపుణుడు'],
      report:   ['నివేదిక', 'రిపోర్ట్'],
      booking:  ['బుకింగ్', 'సర్వే'],
      dispute:  ['సమస్య']
    },
    dateContextKeywords: [],
    historyKeywords:     ['పురాతన బుకింగ్', 'గత బుకింగ్', 'పూర్తయిన సర్వే', 'చరిత్ర'],
    bookingKeywords:     ['నా బుకింగ్', 'బుకింగ్', 'సర్వే']
  },

  // ─────────────────────── HINDI ────────────────────────────────────────────
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    isEnabled: true,
    isRTL: false,
    scriptRange: '\\u0900-\\u097F',
    greetings: ['नमस्ते', 'नमस्कार', 'हेलो', 'प्रणाम', 'राम राम', 'हाय'],
    buttons: ['मेरी बुकिंग', 'भुगतान', 'मेरी रिपोर्ट', 'विशेषज्ञ ट्रैक करें'],
    links: [
      { text: 'बुकिंग्स देखें', url: '/user/status' },
      { text: 'सर्वे रिपोर्ट', url: '/user/survey-reports' }
    ],
    i18n: {
      greeting:        'नमस्ते{name} जी! जलधारा भूजल सहायता में आपका स्वागत है। मैं आज आपकी क्या सहायता कर सकता हूँ?',
      activeBooking:   'नमस्ते{name} जी! मुझे आपके खाते में 1 सक्रिय सर्वे मिला है:',
      pastBooking:     'नमस्ते{name} जी! आपके पास वर्तमान में कोई सक्रिय सर्वे नहीं है, लेकिन आपकी पिछली पूर्ण बुकिंग यहाँ है:',
      historyCount:    'नमस्ते{name} जी! आपके खाते में कुल {count} बुकिंग्स का इतिहास दर्ज है:',
      zeroBookings:    'नमस्ते{name} जी! आपके खाते में अभी कोई सक्रिय या पिछला भूजल सर्वे दर्ज नहीं है। क्या आप आज अपने खेत या भूखंड के लिए विशेषज्ञ सर्वे बुक करना चाहते हैं?',
      activeTag:       'सक्रिय बुकिंग',
      completedTag:    'पूर्ण सर्वे',
      trackExpertBtn:  'विशेषज्ञ को लाइव ट्रैक करें',
      downloadReport:  'सर्वे रिपोर्ट डाउनलोड करें',
      bookSurveyTitle: 'भूजल सर्वे बुक करें',
      bookSurveyDesc:  'उन्नत भूभौतिकी उपकरणों से लैस प्रमाणित हाइड्रोजियोलॉजिस्ट।',
      bookSurveyBtn:   'अभी सर्वे बुक करें'
    },
    cardTranslations: [
      { cardKey: 'payment',        title: 'भुगतान एवं इनवॉइस',                description: 'अपना 25% अग्रिम भुगतान पूरा करें, बकाया राशि चुकाएं या आधिकारिक जीएसटी इनवॉइस डाउनलोड करें।',                                         actionLabel: 'भुगतान पोर्टल खोलें' },
      { cardKey: 'pay now',        title: 'सुरक्षित भुगतान करें',              description: 'अपने सर्वे का अग्रिम या बकाया भुगतान सुरक्षित रूप से पूरा करें।',                                                                           actionLabel: 'अभी भुगतान करें' },
      { cardKey: 'payment status', title: 'भुगतान इतिहास एवं रसीदें',          description: 'अपने सभी पुराने लेनदेन देखें और आधिकारिक जीएसटी टैक्स इनवॉइस डाउनलोड करें।',                                                            actionLabel: 'इनवॉइस और रसीदें देखें' },
      { cardKey: 'my booking',     title: 'मेरी सर्वे बुकिंग्स',              description: 'अपनी सक्रिय और पिछली भूजल सर्वे बुकिंग्स, विशेषज्ञ और शेड्यूल देखें।',                                                                    actionLabel: 'मेरी बुकिंग्स देखें' },
      { cardKey: 'view booking',   title: 'सर्वे बुकिंग पोर्टल',              description: 'अपनी बुकिंग स्थिति, सर्वे का पता और विशेषज्ञ की जानकारी देखें।',                                                                           actionLabel: 'बुकिंग विवरण खोलें' },
      { cardKey: 'view schedule',  title: 'आगामी सर्वे समय-सारणी',            description: 'अपने भूजल सर्वे विशेषज्ञ के आने की निर्धारित तिथि और समय स्लॉट देखें।',                                                                    actionLabel: 'शेड्यूल चेक करें' },
      { cardKey: 'track expert',   title: 'विशेषज्ञ लाइव ट्रैकिंग',           description: 'अपने नियुक्त भूजल सर्वे विशेषज्ञ की लाइव जीपीएस लोकेशन और आगमन समय देखें।',                                                             actionLabel: 'विशेषज्ञ को लाइव ट्रैक करें' },
      { cardKey: 'my report',      title: 'प्रमाणित सर्वे रिपोर्ट',            description: 'जीपीएस कोऑर्डिनेट्स और अनुमानित गहराई वाली अपनी आधिकारिक सर्वे रिपोर्ट (PDF) डाउनलोड करें।',                                             actionLabel: 'सर्वे रिपोर्ट डाउनलोड करें' },
      { cardKey: 'view report',    title: 'सर्वे पीडीएफ डाउनलोड करें',        description: 'अपनी आधिकारिक डिजिटल भूजल सर्वे रिपोर्ट और बोरवेल पॉइंट सुझाव देखें।',                                                                   actionLabel: 'रिपोर्ट देखें और डाउनलोड करें' },
      { cardKey: 'rate service',   title: 'सर्वे अनुभव की समीक्षा करें',       description: 'अपने भूजल सर्वे विशेषज्ञ के कार्य की समीक्षा करें और रेटिंग दें।',                                                                        actionLabel: 'रेटिंग दें' },
      { cardKey: 'support',        title: 'जलधारा हेल्पलाइन एवं सहायता',      description: 'हमारी ग्राहक हेल्पलाइन +91 800-000-0000 पर कॉल करें या सहायता डेस्क पर टिकट दर्ज करें।',                                               actionLabel: 'समस्या टिकट दर्ज करें' },
      { cardKey: 'main menu',      title: 'जलधारा मुख्य मेन्यू',              description: 'जलधारा भूजल सर्वेक्षण सेवाओं में आपका स्वागत है। आज हम आपकी क्या सहायता कर सकते हैं?',                                                   actionLabel: 'नया सर्वे बुक करें' }
    ],
    buttonLabelMap: {
      'Pay Now':        'अभी भुगतान करें',
      'Payment Status': 'भुगतान स्थिति',
      'Main Menu':      'मुख्य मेन्यू',
      'My Booking':     'मेरी बुकिंग',
      'View Booking':   'बुकिंग देखें',
      'View Schedule':  'शेड्यूल देखें',
      'Track Expert':   'विशेषज्ञ ट्रैक करें',
      'View Report':    'रिपोर्ट देखें',
      'Rate Service':   'रेटिंग दें',
      'Submit Report':  'रिपोर्ट जमा करें',
      'Payment':        'भुगतान',
      'My Report':      'मेरी रिपोर्ट',
      'Support':        'सहायता'
    },
    synonyms: [
      { cardKey: 'payment',        keywords: ['भुगतान', 'बिल', 'इनवॉइस'] },
      { cardKey: 'pay now',        keywords: ['पे करें'] },
      { cardKey: 'payment status', keywords: ['भुगतान स्थिति'] },
      { cardKey: 'my booking',     keywords: ['मेरी बुकिंग'] },
      { cardKey: 'view schedule',  keywords: ['शेड्यूल'] },
      { cardKey: 'track expert',   keywords: ['ट्रैक'] },
      { cardKey: 'my report',      keywords: ['रिपोर्ट'] },
      { cardKey: 'support',        keywords: ['हेल्पलाइन'] },
      { cardKey: 'main menu',      keywords: ['मुख्य मेन्यू'] }
    ],
    inferenceKeywords: {
      payment:  ['भुगतान', 'इनवॉइस'],
      track:    ['ट्रैक'],
      report:   ['रिपोर्ट'],
      booking:  ['बुकिंग'],
      dispute:  ['शिकायत']
    },
    dateContextKeywords: ['इस महीने', 'पिछले महीने'],
    historyKeywords:     ['पुरानी बुकिंग', 'इतिहास'],
    bookingKeywords:     ['मेरी बुकिंग']
  },

  // ─────────────────────── TAMIL ────────────────────────────────────────────
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    isEnabled: true,
    isRTL: false,
    scriptRange: '\\u0B80-\\u0BFF',
    greetings: ['வணக்கம்', 'ஹலோ', 'ஹாய்'],
    buttons: ['என் முன்பதிவு', 'கட்டணம்', 'என் அறிக்கை', 'நிபுணர் டிராக்கிங்'],
    links: [
      { text: 'முன்பதிவுகளைப் பார்க்கவும்', url: '/user/status' },
      { text: 'ஆய்வு அறிக்கைகள்', url: '/user/survey-reports' }
    ],
    i18n: {
      greeting:        'வணக்கம்{name} அவர்களே! ஜலதாரா நிலத்தடி நீர் ஆய்வு உதவிக்கு வரவேற்கிறோம். இன்று உங்கள் ஆய்வுக்கு நான் எவ்வாறு உதவ முடியும்?',
      activeBooking:   'வணக்கம்{name} அவர்களே! உங்கள் கணக்கில் 1 செயலில் உள்ள ஆய்வு முன்பதிவு உள்ளது:',
      pastBooking:     'வணக்கம்{name} அவர்களே! தற்போது செயலில் உள்ள ஆய்வு எதுவும் இல்லை, ஆனால் உங்கள் முந்தைய ஆய்வு இதோ:',
      historyCount:    'வணக்கம்{name} அவர்களே! உங்கள் கணக்கில் மொத்தம் {count} ஆய்வு பதிவுகள் உள்ளன:',
      zeroBookings:    'வணக்கம்{name} அவர்களே! உங்கள் கணக்கில் இதுவரை எந்த நிலத்தடி நீர் ஆய்வும் பதிவு செய்யப்படவில்லை. ஒரு புதிய ஆய்வை முன்பதிவு செய்ய விரும்புகிறீர்களா?',
      activeTag:       'செயலில் உள்ள முன்பதிவு',
      completedTag:    'முடிந்த ஆய்வு',
      trackExpertBtn:  'நிபுணரை நேரடியாக கண்காணிக்கவும்',
      downloadReport:  'ஆய்வு அறிக்கை பதிவிறக்கம்',
      bookSurveyTitle: 'நிலத்தடி நீர் ஆய்வை முன்பதிவு செய்யுங்கள்',
      bookSurveyDesc:  'சான்றளிக்கப்பட்ட நிலத்தடி நீர் நிபுணர்களுடன் ஆய்வை திட்டமிடுங்கள்.',
      bookSurveyBtn:   'இப்போதே ஆய்வை முன்பதிவு செய்யுங்கள்'
    },
    cardTranslations: [],
    buttonLabelMap:   {},
    synonyms:         [],
    inferenceKeywords: {},
    dateContextKeywords: [],
    historyKeywords:  [],
    bookingKeywords:  []
  },

  // ─────────────────────── KANNADA ──────────────────────────────────────────
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    isEnabled: true,
    isRTL: false,
    scriptRange: '\\u0C80-\\u0CFF',
    greetings: ['ನಮಸ್ಕಾರ', 'ಹಲೋ', 'ಹಾಯ್'],
    buttons: ['ನನ್ನ ಬುಕಿಂಗ್', 'ಪಾವತಿ', 'ನನ್ನ ವರದಿ', 'ತಜ್ಞರ ಟ್ರ್ಯಾಕಿಂಗ್'],
    links: [
      { text: 'ಬುಕಿಂಗ್‌ಗಳನ್ನು ನೋಡಿ', url: '/user/status' },
      { text: 'ಸಮೀಕ್ಷಾ ವರದಿಗಳು', url: '/user/survey-reports' }
    ],
    i18n: {
      greeting:        'ನಮಸ್ಕಾರ{name} ಅವರೇ! ಜಲಧಾರ ಅಂತರ್ಜಲ ಸಮೀಕ್ಷೆ ಬೆಂಬಲಕ್ಕೆ ಸ್ವಾಗತ. ಇಂದು ನಿಮ್ಮ ಸಮೀಕ್ಷೆಗೆ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
      activeBooking:   'ನಮಸ್ಕಾರ{name} ಅವರೇ! ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ 1 ಸಕ್ರಿಯ ಸಮೀಕ್ಷೆ ಬುಕಿಂಗ್ ಕಂಡುಬಂದಿದೆ:',
      pastBooking:     'ನಮಸ್ಕಾರ{name} ಅವರೇ! ಪ್ರಸ್ತುತ ಯಾವುದೇ ಸಕ್ರಿಯ ಸಮೀಕ್ಷೆ ಇಲ್ಲ, ಆದರೆ ನಿಮ್ಮ ಹಿಂದಿನ ಸಮೀಕ್ಷೆ ಇಲ್ಲಿದೆ:',
      historyCount:    'ನಮಸ್ಕಾರ{name} ಅವರೇ! ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ ಒಟ್ಟು {count} ಸಮೀಕ್ಷಾ ದಾಖಲೆಗಳು ಇವೆ:',
      zeroBookings:    'ನಮಸ್ಕಾರ{name} ಅವರೇ! ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ ಯಾವುದೇ ಸಮೀಕ್ಷೆ ಬುಕ್ ಆಗಿಲ್ಲ. ನಿಮ್ಮ ಜಮೀನಿಗೆ ಪರಿಣಿತರ ಸಮೀಕ್ಷೆ ಬುಕ್ ಮಾಡಲು ಬಯಸುವಿರಾ?',
      activeTag:       'ಸಕ್ರಿಯ ಬುಕಿಂಗ್',
      completedTag:    'ಪೂರ್ಣಗೊಂಡ ಸಮೀಕ್ಷೆ',
      trackExpertBtn:  'ತಜ್ಞರನ್ನು ನೇರವಾಗಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
      downloadReport:  'ಸಮೀಕ್ಷಾ ವರದಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
      bookSurveyTitle: 'ಅಂತರ್ಜಲ ಸಮೀಕ್ಷೆ ಬುಕ್ ಮಾಡಿ',
      bookSurveyDesc:  'ಪ್ರಮಾಣೀಕೃತ ಅಂತರ್ಜಲ ಸಮೀಕ್ಷಾ ತಜ್ಞರೊಂದಿಗೆ ಸಮೀಕ್ಷೆ ಯೋಜಿಸಿ.',
      bookSurveyBtn:   'ಇದೀಗ ಸಮೀಕ್ಷೆ ಬುಕ್ ಮಾಡಿ'
    },
    cardTranslations: [],
    buttonLabelMap:   {},
    synonyms:         [],
    inferenceKeywords: {},
    dateContextKeywords: [],
    historyKeywords:  [],
    bookingKeywords:  []
  },

  // ─────────────────────── MARATHI ──────────────────────────────────────────
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    isEnabled: true,
    isRTL: false,
    scriptRange: '',  // Marathi uses Devanagari (same as Hindi: 0900-097F) — detected via Hindi range first
    greetings: ['नमस्कार', 'हेलो', 'हाय'],
    buttons: ['माझी बुकिंग', 'पेमेंट', 'माझा अहवाल', 'तज्ज्ञ ट्रॅक करा'],
    links: [
      { text: 'बुकिंग पहा', url: '/user/status' },
      { text: 'सर्वेक्षण अहवाल', url: '/user/survey-reports' }
    ],
    i18n: {
      greeting:        'नमस्कार{name} जी! जलधारा भूजल सर्वेक्षण सहाय्यामध्ये आपले स्वागत आहे. आज मी आपल्याला कशी मदत करू शकतो?',
      activeBooking:   'नमस्कार{name} जी! मला आपल्या खात्यात 1 सक्रिय सर्वेक्षण बुकिंग आढळले आहे:',
      pastBooking:     'नमस्कार{name} जी! आपल्याकडे सध्या कोणतेही सक्रिय सर्वेक्षण नाही, परंतु आपले मागील पूर्ण सर्वेक्षण येथे आहे:',
      historyCount:    'नमस्कार{name} जी! आपल्या खात्यात एकूण {count} सर्वेक्षणांची नोंद आहे:',
      zeroBookings:    'नमस्कार{name} जी! आपल्या खात्यात अद्याप कोणतेही सर्वेक्षण बुक केलेले नाही. आपण नवीन सर्वेक्षण बुक करू इच्छिता?',
      activeTag:       'सक्रिय बुकिंग',
      completedTag:    'पूर्ण झालेले सर्वेक्षण',
      trackExpertBtn:  'तज्ज्ञांना थेट ट्रॅक करा',
      downloadReport:  'सर्वेक्षण अहवाल डाउनलोड करा',
      bookSurveyTitle: 'भूजल सर्वेक्षण बुक करा',
      bookSurveyDesc:  'प्रमाणित हायड्रोजियोलॉजिस्टसह सर्वेक्षणाचे नियोजन करा.',
      bookSurveyBtn:   'आत्ता सर्वेक्षण बुक करा'
    },
    cardTranslations: [],
    buttonLabelMap:   {},
    synonyms:         [],
    inferenceKeywords: {},
    dateContextKeywords: [],
    historyKeywords:  [],
    bookingKeywords:  []
  },

  // ─────────────────────── MALAYALAM ────────────────────────────────────────
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    isEnabled: false,
    isRTL: false,
    scriptRange: '\\u0D00-\\u0D7F',
    greetings: ['നമസ്കാരം', 'ഹലോ', 'ഹായ്'],
    buttons: ['എന്റെ ബുക്കിംഗ്', 'പേയ്‌മെന്റ്', 'എന്റെ റിപ്പോർട്ട്', 'വിദഗ്ദ്ധൻ ട്രാക്ക്'],
    links: [
      { text: 'ബുക്കിംഗുകൾ കാണുക', url: '/user/status' },
      { text: 'സർവേ റിപ്പോർട്ടുകൾ', url: '/user/survey-reports' }
    ],
    i18n: {
      greeting:        'നമസ്കാരം{name}! ജലധാര ഭൂഗർഭ ജല സർവേ സഹായത്തിലേക്ക് സ്വാഗതം. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം?',
      activeBooking:   'നമസ്കാരം{name}! നിങ്ങളുടെ അക്കൗണ്ടിൽ 1 സജീവ സർവേ ബുക്കിംഗ് കണ്ടെത്തി:',
      pastBooking:     'നമസ്കാരം{name}! നിലവിൽ സജീവ സർവേ ഒന്നുമില്ല, എന്നാൽ ഇതാ നിങ്ങളുടെ മുൻ സർവേ:',
      historyCount:    'നമസ്കാരം{name}! നിങ്ങളുടെ അക്കൗണ്ടിൽ ആകെ {count} സർവേ രേഖകൾ ഉണ്ട്:',
      zeroBookings:    'നമസ്കാരം{name}! നിങ്ങളുടെ അക്കൗണ്ടിൽ ഇതുവരെ ഭൂഗർഭ ജല സർവേ ബുക്ക് ചെയ്തിട്ടില്ല. ഒരു പുതിയ സർവേ ബുക്ക് ചെയ്യണോ?',
      activeTag:       'സജീവ ബുക്കിംഗ്',
      completedTag:    'പൂർത്തിയായ സർവേ',
      trackExpertBtn:  'വിദഗ്ദ്ധനെ തത്സമയം ട്രാക്ക് ചെയ്യുക',
      downloadReport:  'സർവേ റിപ്പോർട്ട് ഡൗൺലോഡ് ചെയ്യുക',
      bookSurveyTitle: 'ഭൂഗർഭ ജല സർവേ ബുക്ക് ചെയ്യുക',
      bookSurveyDesc:  'സർട്ടിഫൈഡ് ഹൈഡ്രോജിയോളജിസ്റ്റുകളുമായി സർവേ ആസൂത്രണം ചെയ്യൂ.',
      bookSurveyBtn:   'ഇപ്പോൾ സർവേ ബുക്ക് ചെയ്യൂ'
    },
    cardTranslations: [],
    buttonLabelMap:   {},
    synonyms:         [],
    inferenceKeywords: {},
    dateContextKeywords: [],
    historyKeywords:  [],
    bookingKeywords:  []
  },

  // ─────────────────────── BENGALI ──────────────────────────────────────────
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    isEnabled: false,
    isRTL: false,
    scriptRange: '\\u0980-\\u09FF',
    greetings: ['নমস্কার', 'হ্যালো', 'হাই', 'সালাম'],
    buttons: ['আমার বুকিং', 'পেমেন্ট', 'আমার রিপোর্ট', 'বিশেষজ্ঞ ট্র্যাক'],
    links: [
      { text: 'বুকিং দেখুন', url: '/user/status' },
      { text: 'জরিপ প্রতিবেদন', url: '/user/survey-reports' }
    ],
    i18n: {
      greeting:        'নমস্কার{name}! জলধারা ভূগর্ভস্থ জল জরিপ সহায়তায় স্বাগতম। আজ আমি কীভাবে সাহায্য করতে পারি?',
      activeBooking:   'নমস্কার{name}! আপনার অ্যাকাউন্টে 1টি সক্রিয় জরিপ বুকিং পাওয়া গেছে:',
      pastBooking:     'নমস্কার{name}! বর্তমানে কোনো সক্রিয় জরিপ নেই, তবে আপনার সাম্প্রতিক জরিপ এখানে দেওয়া হলো:',
      historyCount:    'নমস্কার{name}! আপনার অ্যাকাউন্টে মোট {count}টি জরিপ রেকর্ড রয়েছে:',
      zeroBookings:    'নমস্কার{name}! আপনার অ্যাকাউন্টে এখনো কোনো ভূগর্ভস্থ জল জরিপ বুক করা হয়নি। একটি নতুন জরিপ বুক করতে চান?',
      activeTag:       'সক্রিয় বুকিং',
      completedTag:    'সম্পন্ন জরিপ',
      trackExpertBtn:  'বিশেষজ্ঞকে সরাসরি ট্র্যাক করুন',
      downloadReport:  'জরিপ প্রতিবেদন ডাউনলোড করুন',
      bookSurveyTitle: 'ভূগর্ভস্থ জল জরিপ বুক করুন',
      bookSurveyDesc:  'প্রত্যয়িত হাইড্রোজিওলজিস্টদের সাথে জরিপ পরিকল্পনা করুন।',
      bookSurveyBtn:   'এখনই জরিপ বুক করুন'
    },
    cardTranslations: [],
    buttonLabelMap:   {},
    synonyms:         [],
    inferenceKeywords: {},
    dateContextKeywords: [],
    historyKeywords:  [],
    bookingKeywords:  []
  },

  // ─────────────────────── ODIA ─────────────────────────────────────────────
  {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    isEnabled: false,
    isRTL: false,
    scriptRange: '\\u0B00-\\u0B7F',
    greetings: ['ନମସ୍କାର', 'ହେଲୋ', 'ହାଏ'],
    buttons: ['ମୋ ବୁକିଂ', 'ଦେୟ', 'ମୋ ରିପୋର୍ଟ', 'ବିଶେଷଜ୍ଞ ଟ୍ର୍ୟାକ'],
    links: [
      { text: 'ବୁକିଂ ଦେଖନ୍ତୁ', url: '/user/status' },
      { text: 'ସର୍ଭେ ରିପୋର୍ଟ', url: '/user/survey-reports' }
    ],
    i18n: {
      greeting:        'ନମସ୍କାର{name}! ଜଳଧାରା ଭୂଗର୍ଭ ଜଳ ସର୍ଭେ ସହାୟତାରେ ସ୍ୱାଗତ। ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?',
      activeBooking:   'ନମସ୍କାର{name}! ଆପଣଙ୍କ ଆକାଉଣ୍ଟରେ 1ଟି ସକ୍ରିୟ ସର୍ଭେ ବୁକିଂ ମିଳିଛି:',
      pastBooking:     'ନମସ୍କାର{name}! ବର୍ତ୍ତମାନ କୌଣସି ସକ୍ରିୟ ସର୍ଭେ ନାହିଁ, ତଥାପି ଆପଣଙ୍କ ପୂର୍ବ ସର୍ଭେ ଏଠାରେ ଅଛି:',
      historyCount:    'ନମସ୍କାର{name}! ଆପଣଙ୍କ ଆକାଉଣ୍ଟରେ ସର୍ବମୋଟ {count}ଟି ସର୍ଭେ ରେକର୍ଡ ଅଛି:',
      zeroBookings:    'ନମସ୍କାର{name}! ଆପଣଙ୍କ ଆକାଉଣ୍ଟରେ ଏ ପର୍ଯ୍ୟନ୍ତ କୌଣସି ଭୂଗର୍ଭ ଜଳ ସର୍ଭେ ବୁକ ହୋଇ ନାହିଁ। ଏକ ନୂଆ ସର୍ଭେ ବୁକ କରିବାକୁ ଚାହୁଁଛନ୍ତି କି?',
      activeTag:       'ସକ୍ରିୟ ବୁକିଂ',
      completedTag:    'ସମ୍ପୂର୍ଣ ସର୍ଭେ',
      trackExpertBtn:  'ବିଶେଷଜ୍ଞଙ୍କୁ ସିଧାସଳଖ ଟ୍ର୍ୟାକ କରନ୍ତୁ',
      downloadReport:  'ସର୍ଭେ ରିପୋର୍ଟ ଡାଉନଲୋଡ଼ କରନ୍ତୁ',
      bookSurveyTitle: 'ଭୂଗର୍ଭ ଜଳ ସର୍ଭେ ବୁକ କରନ୍ତୁ',
      bookSurveyDesc:  'ସାର୍ଟିଫାଇଡ ହାଇଡ୍ରୋଜୀଓଲଜିଷ୍ଟଙ୍କ ସହ ସର୍ଭେ ଯୋଜନା କରନ୍ତୁ।',
      bookSurveyBtn:   'ବର୍ତ୍ତମାନ ସର୍ଭେ ବୁକ କରନ୍ତୁ'
    },
    cardTranslations: [],
    buttonLabelMap:   {},
    synonyms:         [],
    inferenceKeywords: {},
    dateContextKeywords: [],
    historyKeywords:  [],
    bookingKeywords:  []
  },

  // ─────────────────────── GUJARATI ─────────────────────────────────────────
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    isEnabled: false,
    isRTL: false,
    scriptRange: '\\u0A80-\\u0AFF',
    greetings: ['નમસ્તે', 'નમસ્કાર', 'હેલો', 'હાય'],
    buttons: ['મારી બુકિંગ', 'પેમેન્ટ', 'મારો અહેવાલ', 'નિષ્ણાત ટ્રેક'],
    links: [
      { text: 'બુકિંગ જુઓ', url: '/user/status' },
      { text: 'સર્વે અહેવાલો', url: '/user/survey-reports' }
    ],
    i18n: {
      greeting:        'નમસ્તે{name}! જળધારા ભૂગર્ભ જળ સર્વે સહાયતામાં આપનું સ્વાગત છે. આજે હું આપને કેવી રીતે મદદ કરી શકું?',
      activeBooking:   'નમસ્તે{name}! તમારા ખાતામાં 1 સક્રિય સર્વે બુકિંગ મળ્યું છે:',
      pastBooking:     'નમસ્તે{name}! હાલ કોઈ સક્રિય સર્વે નથી, પરંતુ તમારો ભૂતકાળનો સર્વે અહીં છે:',
      historyCount:    'નમસ્તે{name}! તમારા ખાતામાં કુલ {count} સર્વે રેકોર્ડ છે:',
      zeroBookings:    'નમસ્તે{name}! તમારા ખાતામાં હજી સુધી કોઈ ભૂગર્ભ જળ સર્વે બૂક કરવામાં આવ્યો નથી. શું તમે નવો સર્વે બૂક કરવા માંગો છો?',
      activeTag:       'સક્રિય બુકિંગ',
      completedTag:    'પૂર્ણ સર્વે',
      trackExpertBtn:  'નિષ્ણાતને સીધો ટ્રેક કરો',
      downloadReport:  'સર્વે અહેવાલ ડાઉનલોડ કરો',
      bookSurveyTitle: 'ભૂગર્ભ જળ સર્વે બૂક કરો',
      bookSurveyDesc:  'પ્રમાણિત હાઇડ્રોજ્યોલોજિસ્ટ સાથે સર્વેનું આયોજન કરો.',
      bookSurveyBtn:   'હવે સર્વે બૂક કરો'
    },
    cardTranslations: [],
    buttonLabelMap:   {},
    synonyms:         [],
    inferenceKeywords: {},
    dateContextKeywords: [],
    historyKeywords:  [],
    bookingKeywords:  []
  },

  // ─────────────────────── PUNJABI ──────────────────────────────────────────
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    isEnabled: false,
    isRTL: false,
    scriptRange: '\\u0A00-\\u0A7F',
    greetings: ['ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ', 'ਹੈਲੋ', 'ਹਾਏ'],
    buttons: ['ਮੇਰੀ ਬੁਕਿੰਗ', 'ਭੁਗਤਾਨ', 'ਮੇਰੀ ਰਿਪੋਰਟ', 'ਮਾਹਰ ਟਰੈਕ'],
    links: [
      { text: 'ਬੁਕਿੰਗ ਵੇਖੋ', url: '/user/status' },
      { text: 'ਸਰਵੇ ਰਿਪੋਰਟਾਂ', url: '/user/survey-reports' }
    ],
    i18n: {
      greeting:        'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ{name}! ਜਲਧਾਰਾ ਭੂਮੀਗਤ ਜਲ ਸਰਵੇ ਸਹਾਇਤਾ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?',
      activeBooking:   'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ{name}! ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ 1 ਸਰਗਰਮ ਸਰਵੇ ਬੁਕਿੰਗ ਮਿਲੀ ਹੈ:',
      pastBooking:     'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ{name}! ਇਸ ਵੇਲੇ ਕੋਈ ਸਰਗਰਮ ਸਰਵੇ ਨਹੀਂ ਹੈ, ਪਰ ਤੁਹਾਡਾ ਪਿਛਲਾ ਸਰਵੇ ਇੱਥੇ ਹੈ:',
      historyCount:    'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ{name}! ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ਕੁੱਲ {count} ਸਰਵੇ ਰਿਕਾਰਡ ਹਨ:',
      zeroBookings:    'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ{name}! ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ਅਜੇ ਤੱਕ ਕੋਈ ਭੂਮੀਗਤ ਜਲ ਸਰਵੇ ਬੁੱਕ ਨਹੀਂ ਕੀਤਾ ਗਿਆ। ਕੀ ਤੁਸੀਂ ਨਵਾਂ ਸਰਵੇ ਬੁੱਕ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?',
      activeTag:       'ਸਰਗਰਮ ਬੁਕਿੰਗ',
      completedTag:    'ਪੂਰਨ ਸਰਵੇ',
      trackExpertBtn:  'ਮਾਹਰ ਨੂੰ ਸਿੱਧਾ ਟਰੈਕ ਕਰੋ',
      downloadReport:  'ਸਰਵੇ ਰਿਪੋਰਟ ਡਾਊਨਲੋਡ ਕਰੋ',
      bookSurveyTitle: 'ਭੂਮੀਗਤ ਜਲ ਸਰਵੇ ਬੁੱਕ ਕਰੋ',
      bookSurveyDesc:  'ਪ੍ਰਮਾਣਿਤ ਹਾਈਡ੍ਰੋਜੀਓਲੋਜਿਸਟਾਂ ਨਾਲ ਸਰਵੇ ਦੀ ਯੋਜਨਾ ਬਣਾਓ।',
      bookSurveyBtn:   'ਹੁਣੇ ਸਰਵੇ ਬੁੱਕ ਕਰੋ'
    },
    cardTranslations: [],
    buttonLabelMap:   {},
    synonyms:         [],
    inferenceKeywords: {},
    dateContextKeywords: [],
    historyKeywords:  [],
    bookingKeywords:  []
  }
];

// ── Seeder main ───────────────────────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[ChatLanguage Seeder] Connected to MongoDB');

    let inserted = 0;
    let updated  = 0;

    for (const lang of SEED_DATA) {
      const result = await ChatLanguage.findOneAndUpdate(
        { code: lang.code },
        { $set: lang },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      if (result) {
        if (result.__v === undefined || result.createdAt?.getTime() === result.updatedAt?.getTime()) {
          inserted++;
        } else {
          updated++;
        }
      }
    }

    const total = await ChatLanguage.countDocuments();
    console.log(`[ChatLanguage Seeder] Done. ${inserted} inserted, ${updated} updated. Total: ${total} language configs in DB.`);
  } catch (err) {
    console.error('[ChatLanguage Seeder] Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
