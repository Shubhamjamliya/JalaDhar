import { createContext, useContext, useState, useEffect } from "react";

export const SUPPORTED_LANGUAGES = [
    { code: "en", name: "English", nativeName: "English", badge: "EN" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी", badge: "हिं" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు", badge: "తె" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்", badge: "த" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", badge: "ಕ" },
    { code: "mr", name: "Marathi", nativeName: "मराठी", badge: "म" },
    { code: "or", name: "Odia (Odissi)", nativeName: "ଓଡ଼ିଆ", badge: "ଓ" }
];

const translations = {
    en: {
        userLogin: "User Login",
        createAccount: "Create Account",
        welcomeBackLogin: "Welcome back! Please login to your account.",
        createAccountHeader: "Create your account to book professional groundwater surveys.",
        mobileNumber: "Mobile Number",
        fullName: "Full Name",
        emailOptional: "Email Address (Optional)",
        sendOtp: "Send OTP",
        continue: "Continue",
        agreeTerms: "I agree to the Terms & Conditions and Privacy Policy",
        verifyMobileOtp: "Verify Mobile OTP",
        verifyLogin: "Verify & Login",
        verifyAndCreateAccount: "Verify & Create Account",
        alreadyHaveAccount: "Already have an account?",
        dontHaveAccount: "Don't have an account?",
        backToLogin: "Back to Login",
        editDetails: "Edit Details",
        signUp: "Sign Up",
        login: "Log In",
        resendOtp: "Resend OTP",
        resendIn: "Resend in",
        loginOtpSentTo: "Login OTP sent to",
        verificationOtpSentTo: "Verification OTP sent to",
        
        // Navigation & Layout
        home: "Home",
        bookings: "Bookings",
        book: "Book",
        wallet: "Wallet",
        profile: "Profile",

        // Dashboard & Purpose
        welcomeBack: "Welcome back",
        indiaFirstPlatform: "India's 1st Groundwater Survey Booking Platform",
        findExpertsDesc: "Find verified groundwater survey experts and book your survey.",
        surveyPurpose: "Survey Purpose",
        selectSiteCategory: "Select your site category to begin survey booking.",
        agriculture: "Agriculture",
        household: "Household",
        commercial: "Commercial",
        industrial: "Industrial",

        // Quick Access
        quickAccess: "Quick Access",
        bookingStatus: "Booking Status",
        currentBooking: "Current Booking",
        pendingPayments: "Pending Payments",
        surveyReports: "Survey Reports",
        updateProfile: "Update Profile",
        topExpertsNearYou: 'Top "Verified" Groundwater Experts Near You',
        certifiedSpecialists: "Certified groundwater survey specialists available for dispatch."
    },
    hi: {
        userLogin: "उपयोगकर्ता लॉगिन",
        createAccount: "खाता बनाएं",
        welcomeBackLogin: "वापसी पर स्वागत है! कृपया अपने खाते में लॉगिन करें।",
        createAccountHeader: "पेशेवर भूजल सर्वेक्षण बुक करने के लिए अपना खाता बनाएं।",
        mobileNumber: "मोबाइल नंबर",
        fullName: "पूरा नाम",
        emailOptional: "ईमेल पता (वैकल्पिक)",
        sendOtp: "ओटीपी भेजें",
        continue: "जारी रखें",
        agreeTerms: "मैं नियमों और शर्तों तथा गोपनीयता नीति से सहमत हूं",
        verifyMobileOtp: "मोबाइल ओटीपी सत्यापित करें",
        verifyLogin: "सत्यापित करें और लॉगिन करें",
        verifyAndCreateAccount: "सत्यापित करें और खाता बनाएं",
        alreadyHaveAccount: "क्या आपके पास पहले से एक खाता है?",
        dontHaveAccount: "खाता नहीं है?",
        backToLogin: "लॉगिन पर वापस जाएं",
        editDetails: "विवरण संपादित करें",
        signUp: "साइन अप करें",
        login: "लॉगिन करें",
        resendOtp: "पुनः ओटीपी भेजें",
        resendIn: "पुनः भेजें",
        loginOtpSentTo: "लॉगिन ओटीपी भेजा गया",
        verificationOtpSentTo: "सत्यापन ओटीपी भेजा गया",
        
        home: "होम",
        bookings: "बुकिंग",
        book: "बुक करें",
        wallet: "वॉलेट",
        profile: "प्रोफ़ाइल",

        welcomeBack: "वापसी पर स्वागत है",
        indiaFirstPlatform: "भारत का पहला भूजल सर्वेक्षण बुकिंग प्लेटफॉर्म",
        findExpertsDesc: "सत्यापित भूजल सर्वेक्षण विशेषज्ञों को खोजें और अपनी बुकिंग करें।",
        surveyPurpose: "सर्वेक्षण उद्देश्य",
        selectSiteCategory: "सर्वेक्षण बुकिंग शुरू करने के लिए अपनी श्रेणी चुनें।",
        agriculture: "कृषि",
        household: "घरेलू",
        commercial: "व्यावसायिक",
        industrial: "औद्योगिक",

        quickAccess: "त्वरित पहुँच",
        bookingStatus: "बुकिंग स्थिति",
        currentBooking: "वर्तमान बुकिंग",
        pendingPayments: "बकाया भुगतान",
        surveyReports: "सर्वेक्षण रिपोर्ट",
        updateProfile: "प्रोफ़ाइल अपडेट करें",
        topExpertsNearYou: "आपके निकटतम भूजल विशेषज्ञ",
        certifiedSpecialists: "सत्यापित भूजल सर्वेक्षण विशेषज्ञ उपलब्ध हैं।"
    },
    te: {
        userLogin: "యూజర్ లాగిన్",
        createAccount: "ఖాతాను సృష్టించండి",
        welcomeBackLogin: "తిరిగి స్వాగతం! దయచేసి మీ ఖాతాకు లాగిన్ చేయండి.",
        createAccountHeader: "వృత్తిపరమైన భూగర్భ జల సర్వేలను బుక్ చేయడానికి మీ ఖాతాను సృష్టించండి.",
        mobileNumber: "మొబైల్ సంఖ్య",
        fullName: "పూర్తి పేరు",
        emailOptional: "ఈమెయిల్ చిరునామా (ఐచ్ఛికం)",
        sendOtp: "OTP పంపండి",
        continue: "కొనసాగించండి",
        agreeTerms: "నేను నిబంధనలు & షరతులు మరియు గోప్యతా విధానానికి అంగీకరిస్తున్నాను",
        verifyMobileOtp: "మొబైల్ OTPని నిర్ధారించండి",
        verifyLogin: "తనిఖీ చేసి లాగిన్ అవ్వండి",
        verifyAndCreateAccount: "తనిఖీ చేసి ఖాతాను సృష్టించండి",
        alreadyHaveAccount: "ఇప్పటికే ఖాతా ఉందా?",
        dontHaveAccount: "ఖాతా లేదా?",
        backToLogin: "లాగిన్‌కి తిరిగి వెళ్లండి",
        editDetails: "వివరాలను సవరించండి",
        signUp: "సైన్ అప్",
        login: "లాగిన్",
        resendOtp: "మళ్లీ OTP పంపండి",
        resendIn: "మళ్లీ పంపండి",
        loginOtpSentTo: "లాగిన్ OTP కి పంపబడింది",
        verificationOtpSentTo: "ధృవీకరణ OTP కి పంపబడింది",
        
        home: "హోమ్",
        bookings: "బుకింగ్‌లు",
        book: "బుక్ చేయండి",
        wallet: "వాలెట్",
        profile: "ప్రొఫైల్",

        welcomeBack: "తిరిగి స్వాగతం",
        indiaFirstPlatform: "భారతదేశపు మొదటి భూగర్భ జల సర్వే బుకింగ్ వేదిక",
        findExpertsDesc: "ధృవీకరించబడిన భూగర్భ జల సర్వే నిపుణులను కనుగొనండి మరియు బుక్ చేయండి.",
        surveyPurpose: "సర్వే ఉద్దేశం",
        selectSiteCategory: "సర్వే బుకింగ్ ప్రారంభించడానికి మీ వర్గాన్ని ఎంచుకోండి.",
        agriculture: "వ్యవసాయం",
        household: "గృహ",
        commercial: "వాణిజ్య",
        industrial: "పారిశ్రామిక",

        quickAccess: "త్వరిత ప్రాప్యత",
        bookingStatus: "బుకింగ్ స్థితి",
        currentBooking: "ప్రస్తుత బుకింగ్",
        pendingPayments: "బాకీ ఉన్న చెల్లింపులు",
        surveyReports: "సర్వే నివేదికలు",
        updateProfile: "ప్రొఫైల్ తాజాకరించండి",
        topExpertsNearYou: "మీ దగ్గరలోని ప్రముఖ భూగర్భ జల నిపుణులు",
        certifiedSpecialists: "ధృవీకరించబడిన భూగర్భ జల నిపుణులు సిద్ధంగా ఉన్నారు."
    },
    ta: {
        userLogin: "பயனர் உள்நுழைவு",
        createAccount: "கணக்கை உருவாக்கவும்",
        welcomeBackLogin: "மீண்டும் வருக! உங்கள் கணக்கில் உள்நுழையவும்.",
        createAccountHeader: "நிலத்தடி நீர் ஆய்வுகளை முன்பதிவு செய்ய கணக்கை உருவாக்கவும்.",
        mobileNumber: "கைபேசி எண்",
        fullName: "முழு பெயர்",
        emailOptional: "மின்னஞ்சல் முகவரி (விருப்பத்தேர்வு)",
        sendOtp: "OTP அனுப்பவும்",
        continue: "தொடரவும்",
        agreeTerms: "விதிகள் & நிபந்தனைகள் மற்றும் தனியுரிமைக் கொள்கையை ஏற்கிறேன்",
        verifyMobileOtp: "OTP-ஐ சரிபார்க்கவும்",
        verifyLogin: "சரிபார்த்து உள்நுழைக",
        verifyAndCreateAccount: "சரிபார்த்து கணக்கை உருவாக்கவும்",
        alreadyHaveAccount: "ஏற்கனவே கணக்கு உள்ளதா?",
        dontHaveAccount: "கணக்கு இல்லையா?",
        backToLogin: "உள்நுழைவுக்குத் திரும்புக",
        editDetails: "விவரங்களைத் திருத்து",
        signUp: "பதிவு செய்ய",
        login: "உள்நுழைக",
        resendOtp: "மீண்டும் OTP அனுப்பவும்",
        resendIn: "மீண்டும் அனுப்ப",
        loginOtpSentTo: "OTP அனுப்பப்பட்ட எண்",
        verificationOtpSentTo: "OTP அனுப்பப்பட்ட எண்",
        
        home: "முகப்பு",
        bookings: "முன்பதிவுகள்",
        book: "முன்பதிவு",
        wallet: "வாலட்",
        profile: "சுயவிவரம்",

        welcomeBack: "மீண்டும் வருக",
        indiaFirstPlatform: "இந்தியாவின் 1வது நிலத்தடி நீர் ஆய்வு தளம்",
        findExpertsDesc: "நிலத்தடி நீர் ஆய்வு நிபுணர்களைக் கண்டறிந்து முன்பதிவு செய்யுங்கள்.",
        surveyPurpose: "ஆய்வு நோக்கம்",
        selectSiteCategory: "முன்பதிவைத் தொடங்க வகையைத் தேர்ந்தெடுக்கவும்.",
        agriculture: "விவசாயம்",
        household: "வீட்டு",
        commercial: "வணிக",
        industrial: "தொழில்துறை",

        quickAccess: "விரைவு அணுகல்",
        bookingStatus: "முன்பதிவு நிலை",
        currentBooking: "தற்போதைய முன்பதிவு",
        pendingPayments: "நிலுவை கட்டணங்கள்",
        surveyReports: "ஆய்வு அறிக்கைகள்",
        updateProfile: "சுயவிவரம் புதுப்பி",
        topExpertsNearYou: "உங்களுக்கு அருகிலுள்ள சிறந்த நிபுணர்கள்",
        certifiedSpecialists: "சான்றளிக்கப்பட்ட நிலத்தடி நீர் ஆய்வு நிபுணர்கள் தயார்."
    },
    kn: {
        userLogin: "ಬಳಕೆದಾರ ಲಾಗಿನ್",
        createAccount: "ಖಾತೆ ರಚಿಸಿ",
        welcomeBackLogin: "ಮತ್ತೆ ಸುಸ್ವಾಗತ! ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ.",
        createAccountHeader: "ವೃತ್ತಿಪರ ಅಂತರ್ಜಲ ಸಮೀಕ್ಷೆಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲು ನಿಮ್ಮ ಖಾತೆಯನ್ನು ರಚಿಸಿ.",
        mobileNumber: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
        fullName: "ಪೂರ್ಣ ಹೆಸರು",
        emailOptional: "ಇಮೇಲ್ ವಿಳಾಸ (ಐಚ್ಛಿಕ)",
        sendOtp: "OTP ಕಳುಹಿಸಿ",
        continue: "ಮುಂದುವರಿಸಿ",
        agreeTerms: "ನಾನು ನಿಯಮಗಳು ಮತ್ತು ನಿಬಂಧನೆಗಳು ಹಾಗೂ ಗೌಪ್ಯತಾ ನೀತಿಯನ್ನು ಒಪ್ಪುತ್ತೇನೆ",
        verifyMobileOtp: "ಮೊಬೈಲ್ OTP ಪರಿಶೀಲಿಸಿ",
        verifyLogin: "ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಲಾಗಿನ್ ಮಾಡಿ",
        verifyAndCreateAccount: "ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಖಾತೆ ರಚಿಸಿ",
        alreadyHaveAccount: "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?",
        dontHaveAccount: "ಖಾತೆ ಇಲ್ಲವೇ?",
        backToLogin: "ಲಾಗಿನ್‌ಗೆ ಹಿಂತಿರುಗಿ",
        editDetails: "ವಿವರಗಳನ್ನು ತಿದ್ದುಪಡಿ ಮಾಡಿ",
        signUp: "ಸೈನ್ ಅಪ್",
        login: "ಲಾಗಿನ್",
        resendOtp: "ಮತ್ತೆ OTP ಕಳುಹಿಸಿ",
        resendIn: "ಮತ್ತೆ ಕಳುಹಿಸಿ",
        loginOtpSentTo: "OTP ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ",
        verificationOtpSentTo: "ಪರಿಶೀಲನಾ OTP ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ",
        
        home: "ಹೋಮ್",
        bookings: "ಬುಕಿಂಗ್‌ಗಳು",
        book: "ಬುಕ್ ಮಾಡಿ",
        wallet: "ವಾಲೆಟ್",
        profile: "ಪ್ರೊಫೈಲ್",

        welcomeBack: "ಮತ್ತೆ ಸುಸ್ವಾಗತ",
        indiaFirstPlatform: "ಭಾರತದ ಮೊದಲ ಅಂತರ್ಜಲ ಸಮೀಕ್ಷೆ ಬುಕಿಂಗ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್",
        findExpertsDesc: "ಅಂತರ್ಜಲ ಸಮೀಕ್ಷೆ ತಜ್ಞರನ್ನು ಹುಡುಕಿ ಮತ್ತು ಬುಕ್ ಮಾಡಿ.",
        surveyPurpose: "ಸಮೀಕ್ಷೆಯ ಉದ್ದೇಶ",
        selectSiteCategory: "ಬುಕಿಂಗ್ ಪ್ರಾರಂಭಿಸಲು ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
        agriculture: "ಕೃಷಿ",
        household: "ಗೃಹ",
        commercial: "ವಾಣಿಜ್ಯ",
        industrial: "ಔದ್ಯೋಗಿಕ",

        quickAccess: "ತ್ವರಿತ ಪ್ರವೇಶ",
        bookingStatus: "ಬುಕಿಂಗ್ ಸ್ಥಿತಿ",
        currentBooking: "ಪ್ರಸ್ತುತ ಬುಕಿಂಗ್",
        pendingPayments: "ಬಾಕಿ ಪಾವತಿಗಳು",
        surveyReports: "ಸಮೀಕ್ಷೆ ವರದಿಗಳು",
        updateProfile: "ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಿ",
        topExpertsNearYou: "ನಿಮ್ಮ ಸಮೀಪದ ಪ್ರಮುಖ ಅಂತರ್ಜಲ ತಜ್ಞರು",
        certifiedSpecialists: "ಪರಿಶೀಲಿಸಿದ ಅಂತರ್ಜಲ ತಜ್ಞರು ಲಭ್ಯವಿದ್ದಾರೆ."
    },
    mr: {
        userLogin: "वापरकर्ता लॉगिन",
        createAccount: "खाते तयार करा",
        welcomeBackLogin: "पुन्हा स्वागत आहे! कृपया लॉगिन करा.",
        createAccountHeader: "व्यावसायिक भूजल सर्व्हेक्षण बुक करण्यासाठी तुमचे खाते तयार करा.",
        mobileNumber: "मोबाईल नंबर",
        fullName: "पूर्ण नाव",
        emailOptional: "ईमेल पत्ता (पर्यायी)",
        sendOtp: "OTP पाठवा",
        continue: "पुढे जा",
        agreeTerms: "मी नियम व अटी आणि गोपनीयता धोरणाशी सहमत आहे",
        verifyMobileOtp: "मोबाईल OTP सत्यापित करा",
        verifyLogin: "सत्यापित करा आणि लॉगिन करा",
        verifyAndCreateAccount: "सत्यापित करा आणि खाते तयार करा",
        alreadyHaveAccount: "आधीपासूनच खाते आहे?",
        dontHaveAccount: "खाते नाही?",
        backToLogin: "लॉगिनवर परत जा",
        editDetails: "माहिती संपादित करा",
        signUp: "साइन अप करा",
        login: "लॉगिन करा",
        resendOtp: "पुन्हा OTP पाठवा",
        resendIn: "पुन्हा पाठवा",
        loginOtpSentTo: "OTP पाठवला गेला",
        verificationOtpSentTo: "सत्यापन OTP पाठवला गेला",
        
        home: "होम",
        bookings: "बुकिंग्स",
        book: "बुक करा",
        wallet: "वॉलेट",
        profile: "प्रोफाइल",

        welcomeBack: "पुन्हा स्वागत आहे",
        indiaFirstPlatform: "भारतातील पहिले भूजल सर्व्हेक्षण बुकिंग प्लॅटफॉर्म",
        findExpertsDesc: "भूजल सर्व्हेक्षण तज्ज्ञांना शोधा आणि बुकिंग करा.",
        surveyPurpose: "सर्व्हेक्षण उद्देश",
        selectSiteCategory: "बुकिंग सुरू करण्यासाठी श्रेणी निवडा.",
        agriculture: "शेती",
        household: "घरगुती",
        commercial: "व्यावसायिक",
        industrial: "औद्योगिक",

        quickAccess: "जलद प्रवेश",
        bookingStatus: "बुकिंग स्थिती",
        currentBooking: "सध्याचे बुकिंग",
        pendingPayments: "थकित पेमेंट",
        surveyReports: "सर्व्हेक्षण अहवाल",
        updateProfile: "प्रोफाइल अपडेट करा",
        topExpertsNearYou: "तुमच्या जवळील सर्वोत्तम भूजल तज्ज्ञ",
        certifiedSpecialists: "प्रमाणित भूजल सर्व्हेक्षण तज्ज्ञ उपलब्ध."
    },
    or: {
        userLogin: "ବ୍ୟବହାରକାରୀ ଲଗଇନ୍",
        createAccount: "ଆକାଉଣ୍ଟ୍ ତିଆରି କରନ୍ତୁ",
        welcomeBackLogin: "ସ୍ୱାଗତ! ଦୟାକରି ଲଗଇନ୍ କରନ୍ତୁ।",
        createAccountHeader: "ପ୍ରଫେସନାଲ୍ ଭୂତଳ ଜଳ ସର୍ଭେ ବୁକ୍ କରିବାକୁ ଆପଣଙ୍କ ଆକାଉଣ୍ଟ୍ ତିଆରି କରନ୍ତୁ।",
        mobileNumber: "ମୋବାଇଲ୍ ନମ୍ବର",
        fullName: "ପୂରା ନାମ",
        emailOptional: "ଇମେଲ୍ ଠିକଣା (ଇଚ୍ଛାଧୀନ)",
        sendOtp: "OTP ପଠାନ୍ତୁ",
        continue: "ଆଗକୁ ବଢନ୍ତୁ",
        agreeTerms: "ମୁଁ ନିୟମ ଓ ସର୍ତ୍ତାବଳୀ ଏବଂ ଗୋପନୀୟତା ନୀତି ସହିତ ସହମତ",
        verifyMobileOtp: "ମୋବାଇଲ୍ OTP ଯାଞ୍ଚ କରନ୍ତୁ",
        verifyLogin: "ଯାଞ୍ଚ କରନ୍ତୁ ଏବଂ ଲଗଇନ୍ କରନ୍ତୁ",
        verifyAndCreateAccount: "ଯାଞ୍ଚ କରନ୍ତୁ ଏବଂ ଆକାଉଣ୍ଟ୍ ତିଆରି କରନ୍ତୁ",
        alreadyHaveAccount: "ପୂର୍ବରୁ ଆକାଉଣ୍ଟ୍ ଅଛି?",
        dontHaveAccount: "ଆକାଉଣ୍ଟ୍ ନାହିଁ?",
        backToLogin: "ଲଗଇନ୍ କୁ ଫେରନ୍ତୁ",
        editDetails: "ବିବରଣୀ ସଂଶୋଧନ କରନ୍ତୁ",
        signUp: "ସାଇନ୍ ଅପ୍",
        login: "ଲଗଇନ୍",
        resendOtp: "ପୁନର୍ବାର OTP ପଠାନ୍ତୁ",
        resendIn: "ପୁନର୍ବାର ପଠାନ୍ତୁ",
        loginOtpSentTo: "OTP ପଠାଗଲା",
        verificationOtpSentTo: "ଯାଞ୍ଚ OTP ପଠାଗଲା",
        
        home: "ହୋମ୍",
        bookings: "ବୁକିଂ",
        book: "ବୁକ୍ କରନ୍ତୁ",
        wallet: "ୱାଲେଟ୍",
        profile: "ପ୍ରୋଫାଇଲ୍",

        welcomeBack: "ସ୍ୱାଗତ",
        indiaFirstPlatform: "ଭାରତର ପ୍ରଥମ ଭୂତଳ ଜଳ ସର୍ଭେ ବୁକିଂ ପ୍ଲାଟଫର୍ମ",
        findExpertsDesc: "ଭୂତଳ ଜଳ ସର୍ଭେ ବିଶେଷଜ୍ଞଙ୍କୁ ଖୋଜନ୍ତୁ ଏବଂ ବୁକ୍ କରନ୍ତୁ।",
        surveyPurpose: "ସର୍ଭେ ଉଦ୍ଦେଶ୍ୟ",
        selectSiteCategory: "ବୁକିଂ ଆରମ୍ଭ କରିବାକୁ ବର୍ଗ ବାଛନ୍ତୁ।",
        agriculture: "କୃଷି",
        household: "ଘରୋଇ",
        commercial: "ବ୍ୟାବସାୟିକ",
        industrial: "ଶିଳ୍ପ",

        quickAccess: "ଦ୍ରୁତ ପ୍ରବେଶ",
        bookingStatus: "ବୁକିଂ ସ୍ଥିତି",
        currentBooking: "ବର୍ତ୍ତମାନ ବୁକିଂ",
        pendingPayments: "ବକେୟା ଦେୟ",
        surveyReports: "ସର୍ଭେ ରିପୋର୍ଟ",
        updateProfile: "ପ୍ରୋଫାଇଲ୍ ଅପଡେଟ୍",
        topExpertsNearYou: "ଆପଣଙ୍କ ନିକଟତମ ଜଳ ବିଶେଷଜ୍ଞ",
        certifiedSpecialists: "ପ୍ରମାଣିତ ଭୂତଳ ଜଳ ବିଶେଷଜ୍ଞ ଉପଲବ୍ଧ।"
    }
};

const IS_LANGUAGE_ENABLED_ENV = import.meta.env.VITE_ENABLE_LANGUAGE === "true" || import.meta.env.VITE_ENABLE_LANGUAGE === "1";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const isLanguageEnabled = IS_LANGUAGE_ENABLED_ENV;
    const [language, setLanguageState] = useState(() => {
        return localStorage.getItem("jaladhaara_language") || "en";
    });

    const setLanguage = (code) => {
        if (!isLanguageEnabled) return;
        if (SUPPORTED_LANGUAGES.some(l => l.code === code)) {
            setLanguageState(code);
            localStorage.setItem("jaladhaara_language", code);
        }
    };

    const activeLanguage = isLanguageEnabled ? language : "en";

    const t = (key, fallback = "") => {
        return translations[activeLanguage]?.[key] || translations["en"]?.[key] || fallback || key;
    };

    return (
        <LanguageContext.Provider value={{
            language: activeLanguage,
            setLanguage,
            t,
            supportedLanguages: SUPPORTED_LANGUAGES,
            isLanguageEnabled
        }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
