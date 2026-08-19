import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import api from "../services/api";
import { translateWithGoogleMapApi, batchTranslateWithGoogleMapApi } from "../services/googleTranslationService";
import { startDomAutoTranslator, stopDomAutoTranslator } from "../services/domAutoTranslator";

export const DEFAULT_SUPPORTED_LANGUAGES = [
    { code: "en", name: "English", nativeName: "English", badge: "EN", isEnabled: true, isDefault: true },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी", badge: "हिं", isEnabled: true, isDefault: false },
    { code: "te", name: "Telugu", nativeName: "తెలుగు", badge: "తె", isEnabled: true, isDefault: false },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்", badge: "த", isEnabled: true, isDefault: false },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", badge: "ಕ", isEnabled: true, isDefault: false },
    { code: "mr", name: "Marathi", nativeName: "मराठी", badge: "म", isEnabled: true, isDefault: false },
    { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", badge: "ଓ", isEnabled: true, isDefault: false },
    { code: "bn", name: "Bengali", nativeName: "বাংলা", badge: "বা", isEnabled: false, isDefault: false },
    { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", badge: "ગુ", isEnabled: false, isDefault: false },
    { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", badge: "ਪੰ", isEnabled: false, isDefault: false },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം", badge: "മ", isEnabled: false, isDefault: false }
];

export const SUPPORTED_LANGUAGES = DEFAULT_SUPPORTED_LANGUAGES;

// Master English Schema for baseline fallback
const MASTER_ENGLISH_DICTIONARY = {
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
    
    home: "Home",
    bookings: "Bookings",
    book: "Book",
    wallet: "Wallet",
    profile: "Profile",
    settings: "Settings",
    notifications: "Notifications",
    helpSupport: "Help & Support",
    logout: "Logout",

    welcomeBack: "Welcome back",
    indiaFirstPlatform: "India's 1st Groundwater Survey Booking Platform",
    findExpertsDesc: "Find verified groundwater survey experts and book your survey.",
    surveyPurpose: "Survey Purpose",
    selectSiteCategory: "Select your site category to begin survey booking.",
    agriculture: "Agriculture",
    household: "Household",
    commercial: "Commercial",
    industrial: "Industrial",

    quickAccess: "Quick Access",
    bookingStatus: "Booking Status",
    currentBooking: "Current Booking",
    pendingPayments: "Pending Payments",
    surveyReports: "Survey Reports",
    updateProfile: "Update Profile",
    topExpertsNearYou: 'Top "Verified" Groundwater Experts Near You',
    certifiedSpecialists: "Certified groundwater survey specialists available for dispatch.",
    bookNow: "Book Survey Now",
    viewDetails: "View Details",
    cancel: "Cancel",
    saveChanges: "Save Changes",
    advancePayment: "Advance Payment",
    finalPayment: "Final Payment",
    payNow: "Pay Now",
    borewellPoints: "Borewell Drilling Points",
    expectedWaterYield: "Expected Water Yield",
    estimatedDepth: "Estimated Depth (feet)",
    downloadReport: "Download Survey Report",
    rateExpert: "Rate & Review Expert",
    disputeRaise: "Raise a Dispute",
    language: "Language",
    changeLanguage: "Change Language",
    selectLanguage: "Select Language"
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [isLanguageEnabled, setIsLanguageEnabled] = useState(true);
    const [supportedLanguages, setSupportedLanguages] = useState(DEFAULT_SUPPORTED_LANGUAGES);
    const [language, setLanguageState] = useState(() => {
        return localStorage.getItem("jaladhaara_language") || "en";
    });
    const [loadedTranslations, setLoadedTranslations] = useState(() => {
        const initial = {};
        const savedLang = localStorage.getItem("jaladhaara_language") || "en";
        if (savedLang !== "en") {
            try {
                const cached = localStorage.getItem(`jaladhaara_dict_${savedLang}`);
                if (cached) initial[savedLang] = JSON.parse(cached);
            } catch (e) {
                // Ignore parsing errors
            }
        }
        return initial;
    });
    const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);

    // Fetch dynamic language configuration from backend
    const fetchConfig = useCallback(async () => {
        try {
            const res = await api.get("/languages/config");
            if (res.data?.success) {
                const data = res.data.data;
                if (data.isLanguageEnabled !== undefined) {
                    setIsLanguageEnabled(data.isLanguageEnabled);
                }
                if (Array.isArray(data.supportedLanguages)) {
                    setSupportedLanguages(data.supportedLanguages);

                    // If user's currently selected language was deleted by Admin, fallback to default
                    const currentLang = localStorage.getItem("jaladhaara_language") || "en";
                    const isStillSupported = data.supportedLanguages.some(l => l.code === currentLang && l.isEnabled);
                    if (currentLang !== "en" && !isStillSupported) {
                        const fallbackLang = data.defaultLanguage || "en";
                        setLanguageState(fallbackLang);
                        localStorage.setItem("jaladhaara_language", fallbackLang);
                    }
                }
            }
        } catch (err) {
            console.warn("[LanguageProvider] Using fallback language config:", err.message);
        }
    }, []);

    useEffect(() => {
        // Initial fetch
        fetchConfig();

        // 1. WebSocket Live Event from Socket.IO (Instant Sync when Admin adds/deletes languages)
        const handleLiveUpdate = (e) => {
            if (e.detail) {
                const data = e.detail;
                if (data.isLanguageEnabled !== undefined) {
                    setIsLanguageEnabled(data.isLanguageEnabled);
                }
                if (Array.isArray(data.supportedLanguages)) {
                    setSupportedLanguages(data.supportedLanguages);
                    const currentLang = localStorage.getItem("jaladhaara_language") || "en";
                    const isStillSupported = data.supportedLanguages.some(l => l.code === currentLang && l.isEnabled);
                    if (currentLang !== "en" && !isStillSupported) {
                        const fallbackLang = data.defaultLanguage || "en";
                        setLanguageState(fallbackLang);
                        localStorage.setItem("jaladhaara_language", fallbackLang);
                    }
                }
            } else {
                fetchConfig();
            }
        };
        window.addEventListener("jaladhaara_language_config_updated", handleLiveUpdate);

        // 2. Cross-Tab Instant Sync (Storage Event)
        const handleStorageChange = (e) => {
            if (e.key === "jaladhaara_language" && e.newValue) {
                setLanguageState(e.newValue);
            }
        };
        window.addEventListener("storage", handleStorageChange);

        // 3. Tab Visibility & Focus Sync
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                fetchConfig();
            }
        };
        window.addEventListener("focus", fetchConfig);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // 4. Background Heartbeat Sync every 15 seconds
        const intervalId = setInterval(fetchConfig, 15000);

        return () => {
            window.removeEventListener("jaladhaara_language_config_updated", handleLiveUpdate);
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("focus", fetchConfig);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            clearInterval(intervalId);
        };
    }, [fetchConfig]);

    // Fetch dynamic translations for a specific language from Google API translation service
    const fetchDictionary = useCallback(async (langCode) => {
        if (!langCode || langCode === "en") return;
        try {
            setIsLoadingTranslations(true);
            const res = await api.get(`/languages/translations/${langCode}`);
            if (res.data?.success && res.data.data?.translations) {
                const transObj = res.data.data.translations;
                setLoadedTranslations(prev => ({
                    ...prev,
                    [langCode]: transObj
                }));
                try {
                    localStorage.setItem(`jaladhaara_dict_${langCode}`, JSON.stringify(transObj));
                } catch (storageErr) {}
                return;
            }
        } catch (err) {
            console.warn(`[LanguageProvider] Backend dictionary call failed for ${langCode}, using client-side Google Maps API:`, err.message);
        }

        // Direct fallback to Google Maps API via frontend VITE_GOOGLE_MAPS_API_KEY
        try {
            const englishKeys = Object.keys(MASTER_ENGLISH_DICTIONARY);
            const englishValues = Object.values(MASTER_ENGLISH_DICTIONARY);
            const translatedValuesMap = await batchTranslateWithGoogleMapApi(englishValues, langCode, "en");

            const dynamicDict = {};
            englishKeys.forEach(k => {
                const enVal = MASTER_ENGLISH_DICTIONARY[k];
                dynamicDict[k] = translatedValuesMap[enVal] || enVal;
            });

            setLoadedTranslations(prev => ({
                ...prev,
                [langCode]: dynamicDict
            }));
            try {
                localStorage.setItem(`jaladhaara_dict_${langCode}`, JSON.stringify(dynamicDict));
            } catch (e) {}
        } catch (directErr) {
            console.error(`[LanguageProvider] Direct Google Maps API translation failed:`, directErr);
        } finally {
            setIsLoadingTranslations(false);
        }
    }, []);

    // Preload dictionary whenever active language changes
    useEffect(() => {
        if (language && language !== "en") {
            const hasTranslations = loadedTranslations[language] && Object.keys(loadedTranslations[language]).length > 0;
            if (!hasTranslations) {
                fetchDictionary(language);
            }
        }
    }, [language, loadedTranslations, fetchDictionary]);

    const setLanguage = useCallback((code) => {
        if (!code) return;
        const cleanCode = String(code).toLowerCase().trim();
        setLanguageState(cleanCode);
        localStorage.setItem("jaladhaara_language", cleanCode);
        startDomAutoTranslator(cleanCode);
        if (cleanCode !== "en") {
            fetchDictionary(cleanCode);
        }
    }, [fetchDictionary]);

    const activeLanguage = isLanguageEnabled ? language : "en";

    // Activate Global DOM Auto-Translator on language change
    useEffect(() => {
        if (isLanguageEnabled && activeLanguage && activeLanguage !== "en") {
            startDomAutoTranslator(activeLanguage);
        } else {
            startDomAutoTranslator("en");
        }
    }, [activeLanguage, isLanguageEnabled]);

    // Translation function with parameter interpolation e.g. t('welcomeUser', 'Welcome {name}', { name: 'Rahul' })
    const t = useCallback((key, fallback = "", params = null) => {
        if (!key) return "";

        let translatedString = 
            loadedTranslations[activeLanguage]?.[key] ||
            loadedTranslations["en"]?.[key] ||
            MASTER_ENGLISH_DICTIONARY[key] ||
            fallback ||
            key;

        // Interpolation of {variables}
        if (params && typeof params === "object") {
            Object.entries(params).forEach(([paramKey, paramVal]) => {
                translatedString = translatedString.replace(
                    new RegExp(`\\{${paramKey}\\}`, "g"),
                    String(paramVal ?? "")
                );
            });
        }

        return translatedString;
    }, [activeLanguage, loadedTranslations]);

    // Helper to translate dynamic runtime text using Google Maps API
    const translateDynamicText = useCallback(async (text, targetLang = null) => {
        const target = targetLang || activeLanguage;
        if (!text || target === "en") return text;
        try {
            return await translateWithGoogleMapApi(text, target, "en");
        } catch (err) {
            return text;
        }
    }, [activeLanguage]);

    const value = useMemo(() => ({
        language: activeLanguage,
        setLanguage,
        t,
        supportedLanguages,
        isLanguageEnabled,
        isLoadingTranslations,
        refreshLanguages: fetchConfig,
        refreshTranslations: () => fetchDictionary(activeLanguage),
        translateDynamicText
    }), [activeLanguage, supportedLanguages, isLanguageEnabled, isLoadingTranslations, t, fetchConfig, fetchDictionary, translateDynamicText]);

    return (
        <LanguageContext.Provider value={value}>
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
