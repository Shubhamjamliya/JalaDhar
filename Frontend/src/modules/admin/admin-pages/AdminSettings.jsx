import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    IoSettingsOutline,
    IoLockClosedOutline,
    IoPersonAddOutline,
    IoMailOutline,
    IoKeyOutline,
    IoCheckmarkCircleOutline,
    IoCloseOutline,
    IoBusinessOutline,
    IoShieldCheckmarkOutline,
    IoReaderOutline,
    IoCashOutline,
    IoGlobeOutline,
    IoLanguageOutline,
    IoRefreshOutline,
    IoFlashOutline,
    IoSearchOutline,
    IoAddOutline,
    IoCheckmarkOutline,
    IoWarningOutline,
    IoSparklesOutline,
    IoEyeOutline,
    IoEyeOffOutline,
    IoPlayOutline,
    IoTrashOutline,
    IoChevronDownOutline,
    IoCalendarOutline,
    IoTimeOutline,
    IoLogoWhatsapp
} from "react-icons/io5";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import {
    sendAdminRegistrationOTP,
    registerAdminWithOTP,
    getAllSettings,
    updateMultipleSettings,
    getWhatsAppStatusApi,
    testSendWhatsAppApi,
    getLanguageConfig,
    updateLanguageConfig,
    addLanguageApi,
    deleteLanguageApi
} from "../../../services/adminApi";
import { INDIAN_LANGUAGES_PRESETS } from "../../../utils/indianLanguages";
import ErrorMessage from "../../shared/components/ErrorMessage";
import { useToast } from "../../../hooks/useToast";

export default function AdminSettings({ defaultTab = "general" }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { admin } = useAdminAuth();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (defaultTab) {
            setActiveTab(defaultTab);
        }
    }, [defaultTab]);

    // Admin Registration State
    const [registrationStep, setRegistrationStep] = useState(1); // 1: Enter details, 2: Verify OTP
    const [registrationData, setRegistrationData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "ADMIN",
    });
    const [otpData, setOtpData] = useState({
        otp: "",
        token: "",
        email: "",
    });
    const [otpSent, setOtpSent] = useState(false);
    const [otpCountdown, setOtpCountdown] = useState(0);

    const settingsTabs = [
        { id: "general", label: "General", icon: IoSettingsOutline },
        { id: "communication", label: "WhatsApp & Alerts", icon: IoLogoWhatsapp },
        { id: "reschedule", label: "Reschedule Policy", icon: IoCalendarOutline },
        { id: "pricing", label: "Pricing", icon: IoCashOutline },
        { id: "billing", label: "Billing Info", icon: IoBusinessOutline },
        { id: "languages", label: "Languages", icon: IoGlobeOutline },
        { id: "security", label: "Security", icon: IoLockClosedOutline },
    ];

    // Communication & WhatsApp Settings State
    const [communicationSettings, setCommunicationSettings] = useState({
        ENABLE_VENDOR_WHATSAPP_ASSISTANT: true,
        ENABLE_AUTOMATED_WHATSAPP_NOTIFICATIONS: true,
        WHATSAPP_TEMPLATES_CONFIG: {
            booking_accepted: {
                enabled: true,
                title: "1. Booking Accepted",
                template: "Hello {Customer Name}, This is {Expert Name}, your assigned Jaladhaara Expert.\nI have accepted your Groundwater Survey booking (Booking ID: {Booking ID}). I will contact you shortly to confirm the survey schedule. Thank you."
            },
            on_the_way: {
                enabled: true,
                title: "2. On the Way",
                template: "Hello {Customer Name},\nI am on my way to your survey location and expect to arrive at approximately {Time}. Please keep the site accessible. Thank you."
            },
            schedule_confirmation: {
                enabled: true,
                title: "3. Schedule Confirmation",
                template: "Hello {Customer Name},\nYour groundwater survey is scheduled for {Date} at {Time}. Kindly ensure someone is available at the site to assist during the survey."
            },
            need_location: {
                enabled: true,
                title: "4. Need Location",
                template: "Hello {Customer Name},\nPlease share your live location or the exact survey site location on WhatsApp to help me reach the site without delay. Thank you."
            },
            customer_not_reachable: {
                enabled: true,
                title: "5. Customer Not Reachable",
                template: "Hello {Customer Name},\nI tried contacting you regarding your Jaladhaara survey booking but could not reach you. Please call or reply at your earliest convenience to avoid delays."
            },
            delay_notification: {
                enabled: true,
                title: "6. Delay Notification",
                template: "Hello {Customer Name},\nDue to unforeseen circumstances, I may be delayed by approximately {X} minutes. Sorry for the inconvenience, and thank you for your patience."
            }
        }
    });
    const [communicationLoading, setCommunicationLoading] = useState(false);
    const [whatsappStatus, setWhatsappStatus] = useState(null);
    const [testPhone, setTestPhone] = useState("");
    const [testSending, setTestSending] = useState(false);

    // Reschedule Policy Settings State
    const [rescheduleSettings, setRescheduleSettings] = useState({
        ALLOW_CUSTOMER_RESCHEDULE: true,
        MAX_FREE_RESCHEDULES: 2,
        RESCHEDULE_WINDOW_DAYS: 30,
    });
    const [rescheduleLoading, setRescheduleLoading] = useState(false);

    // Pricing Settings State
    const [pricingSettings, setPricingSettings] = useState({
        TRAVEL_CHARGE_PER_KM: 10,
        BASE_RADIUS_KM: 30,
        GST_PERCENTAGE: 18,
        REQUIRE_ADMIN_REPORT_APPROVAL_FOR_PAYOUT: true,
        ENABLE_AUTO_APPROVE_REPORT_SLA: true,
        AUTO_APPROVE_REPORT_SLA_HOURS: 48,
    });
    const [pricingLoading, setPricingLoading] = useState(false);

    // Billing Settings State
    const [billingSettings, setBillingSettings] = useState({
        BILLING_COMPANY_NAME: "Jaladhaara Hydrogeological Services Pvt. Ltd.",
        BILLING_ADDRESS: "123, Water Tower Complex, Near Borewell Circle, Civil Lines, Raipur, Chhattisgarh - 492001",
        BILLING_GSTIN: "22AAAAA0000A1Z5",
        BILLING_PAN: "AAACJ1234F",
        BILLING_PHONE: "+91 98765 43210",
        BILLING_EMAIL: "info@jaladhaaraapp.com",
        BILLING_WEBSITE: "https://jaladhaaraapp.in",
        BILLING_SAC_CODE: "998341",
        BILLING_PLACE_OF_SUPPLY: "Chhattisgarh (State Code: 22)",
        BILLING_DECLARATION: "This is a computer-generated Tax Invoice and does not require a physical signature.",
        BILLING_TERMS_AND_CONDITIONS: [
            "Terms & Conditions issued for groundwater survey services booked through Jaladhaara.",
            "Groundwater availability and borewell success depend on site-specific geological conditions & geophysical investigations and cannot be guaranteed.",
            "Please retain this invoice for future reference.",
            "Booking is confirmed upon receipt of the advance payment.",
            "Final payment is required to unlock the survey report.",
            "Travel charges are non-refundable once the expert begins the journey.",
            "Disputes must be raised within 10 days of the survey report submission."
        ].join('\n'),
        BILLING_EXPERT_TERMS: [
            "This invoice is issued by the Platform for facilitation services provided to the Expert.",
            "Platform fees and applicable statutory deductions are calculated as per applicable laws.",
            "Net payout is subject to successful settlement and platform policies.",
            "Any refund, dispute, or chargeback may be adjusted against future payouts.",
            "This is a computer-generated invoice and does not require a signature."
        ].join('\n')
    });
    const [billingLoading, setBillingLoading] = useState(false);

    // Dispute Types Settings State
    const [disputeTypesList, setDisputeTypesList] = useState([
        "Expert did not arrive",
        "Expert arrived late",
        "Survey not completed",
        "Incorrect survey location",
        "Payment issue",
        "Refund issue",
        "Travel charges issue",
        "Survey report issue",
        "Expert behaviour",
        "Requested offline payment",
        "Safety concern",
        "Other"
    ]);
    const [newDisputeType, setNewDisputeType] = useState("");
    const [disputeTypesLoading, setDisputeTypesLoading] = useState(false);

    // Languages & AI Localization State
    const [langConfig, setLangConfig] = useState({
        isLanguageEnabled: true,
        defaultLanguage: 'en',
        supportedLanguages: [
            { code: "en", name: "English", nativeName: "English", badge: "EN", isEnabled: true, isDefault: true, sortOrder: 1 },
            { code: "hi", name: "Hindi", nativeName: "हिन्दी", badge: "हिं", isEnabled: true, isDefault: false, sortOrder: 2 },
            { code: "te", name: "Telugu", nativeName: "తెలుగు", badge: "తె", isEnabled: true, isDefault: false, sortOrder: 3 },
            { code: "ta", name: "Tamil", nativeName: "தமிழ்", badge: "த", isEnabled: true, isDefault: false, sortOrder: 4 },
            { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", badge: "ಕ", isEnabled: true, isDefault: false, sortOrder: 5 },
            { code: "mr", name: "Marathi", nativeName: "मराठी", badge: "म", isEnabled: true, isDefault: false, sortOrder: 6 },
            { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", badge: "ଓ", isEnabled: true, isDefault: false, sortOrder: 7 },
            { code: "bn", name: "Bengali", nativeName: "বাংলা", badge: "বা", isEnabled: false, isDefault: false, sortOrder: 8 },
            { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", badge: "ગુ", isEnabled: false, isDefault: false, sortOrder: 9 },
            { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", badge: "ਪੰ", isEnabled: false, isDefault: false, sortOrder: 10 },
            { code: "ml", name: "Malayalam", nativeName: "മലയാളം", badge: "മ", isEnabled: false, isDefault: false, sortOrder: 11 }
        ],
        googleApiKey: 'AIzaSyC2UW5-Nt9KidxOfBRrZImeBRh9SOMGluo',
        translationProvider: 'auto',
        autoTranslateMissing: true
    });
    const [langLoading, setLangLoading] = useState(false);

    // Add & Delete Language Modal States
    const [showAddLangModal, setShowAddLangModal] = useState(false);
    const [newLangForm, setNewLangForm] = useState({
        code: "",
        name: "",
        nativeName: "",
        badge: "",
        autoTranslateImmediately: true
    });
    const [addingLang, setAddingLang] = useState(false);
    const [showDeleteLangModal, setShowDeleteLangModal] = useState(false);
    const [langToDelete, setLangToDelete] = useState(null);
    const [deletingLang, setDeletingLang] = useState(false);

    // Custom Preset Dropdown State & Outside Click Handler
    const [presetDropdownOpen, setPresetDropdownOpen] = useState(false);
    const [presetSearch, setPresetSearch] = useState("");
    const presetDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (presetDropdownRef.current && !presetDropdownRef.current.contains(e.target)) {
                setPresetDropdownOpen(false);
            }
        };
        if (presetDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [presetDropdownOpen]);

    // Restrict background body and document scroll when modals are open
    useEffect(() => {
        if (showAddLangModal || showDeleteLangModal) {
            const originalBodyOverflow = document.body.style.overflow;
            const originalDocOverflow = document.documentElement.style.overflow;

            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";

            const handleBackgroundWheel = (e) => {
                const scrollable = e.target.closest(".modal-scrollable-area");
                if (!scrollable) {
                    e.preventDefault();
                }
            };

            window.addEventListener("wheel", handleBackgroundWheel, { passive: false });
            window.addEventListener("touchmove", handleBackgroundWheel, { passive: false });

            return () => {
                document.body.style.overflow = originalBodyOverflow || "";
                document.documentElement.style.overflow = originalDocOverflow || "";
                window.removeEventListener("wheel", handleBackgroundWheel);
                window.removeEventListener("touchmove", handleBackgroundWheel);
            };
        }
    }, [showAddLangModal, showDeleteLangModal]);


        // Countdown timer for OTP resend
        useEffect(() => {
            if (otpCountdown > 0) {
                const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
                return () => clearTimeout(timer);
            }
        }, [otpCountdown]);

        const handleSendOTP = async (e) => {
            e.preventDefault();
            setError("");

            // Validation
            if (!registrationData.name || !registrationData.email || !registrationData.password) {
                setError("Please fill in all fields");
                return;
            }

            if (registrationData.password.length < 6) {
                setError("Password must be at least 6 characters");
                return;
            }

            if (registrationData.password !== registrationData.confirmPassword) {
                setError("Passwords do not match");
                return;
            }

            try {
                setLoading(true);
                const response = await sendAdminRegistrationOTP({
                    email: registrationData.email,
                    name: registrationData.name,
                });

                if (response.success) {
                    setOtpData({
                        token: response.data.token,
                        email: response.data.email,
                        otp: "",
                    });
                    setOtpSent(true);
                    setRegistrationStep(2);
                    setOtpCountdown(60); // 60 seconds countdown
                    toast.showSuccess("OTP sent to email successfully!");
                } else {
                    setError(response.message || "Failed to send OTP");
                }
            } catch (err) {
                console.error("Send OTP error:", err);
                setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        // Sync activeTab with prop
        useEffect(() => {
            if (defaultTab && activeTab !== defaultTab) {
                setActiveTab(defaultTab);
                setError("");
            }
        }, [defaultTab]);

        const handleResendOTP = async () => {
            if (otpCountdown > 0) return;

            setError("");
            try {
                setLoading(true);
                const response = await sendAdminRegistrationOTP({
                    email: registrationData.email,
                    name: registrationData.name,
                });

                if (response.success) {
                    setOtpData({
                        token: response.data.token,
                        email: response.data.email,
                        otp: "",
                    });
                    setOtpCountdown(60);
                    toast.showSuccess("OTP resent successfully!");
                } else {
                    setError(response.message || "Failed to resend OTP");
                }
            } catch (err) {
                console.error("Resend OTP error:", err);
                setError(err.response?.data?.message || "Failed to resend OTP. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        const handleRegisterAdmin = async (e) => {
            e.preventDefault();
            setError("");

            if (!otpData.otp || otpData.otp.length !== 6) {
                setError("Please enter a valid 6-digit OTP");
                return;
            }

            try {
                setLoading(true);
                const response = await registerAdminWithOTP({
                    name: registrationData.name,
                    email: registrationData.email,
                    password: registrationData.password,
                    role: registrationData.role,
                    otp: otpData.otp,
                    token: otpData.token,
                });

                if (response.success) {
                    toast.showSuccess("Admin registered successfully!");
                    // Reset form
                    setRegistrationStep(1);
                    setRegistrationData({
                        name: "",
                        email: "",
                        password: "",
                        confirmPassword: "",
                        role: "ADMIN",
                    });
                    setOtpData({
                        otp: "",
                        token: "",
                        email: "",
                    });
                    setOtpSent(false);
                } else {
                    setError(response.message || "Failed to register admin");
                }
            } catch (err) {
                console.error("Register admin error:", err);
                setError(err.response?.data?.message || "Failed to register admin. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        const handleBackToForm = () => {
            setRegistrationStep(1);
            setOtpData({ ...otpData, otp: "" });
        };

        // Load reschedule policy settings
        useEffect(() => {
            const loadRescheduleSettings = async () => {
                try {
                    const response = await getAllSettings('policy');
                    if (response.success && response.data?.settings) {
                        const settingsObj = {};
                        response.data.settings.forEach(setting => {
                            if (setting.key === 'ALLOW_CUSTOMER_RESCHEDULE') {
                                settingsObj[setting.key] = setting.value === true || setting.value === 'true' || setting.value === 1;
                            } else if (setting.key === 'MAX_FREE_RESCHEDULES' || setting.key === 'RESCHEDULE_WINDOW_DAYS') {
                                settingsObj[setting.key] = Number(setting.value);
                            }
                        });
                        setRescheduleSettings(prev => ({
                            ...prev,
                            ...settingsObj
                        }));
                    }
                } catch (err) {
                    console.error('Error loading reschedule settings:', err);
                }
            };
            if (activeTab === 'reschedule') {
                loadRescheduleSettings();
            }
        }, [activeTab]);

        // Load pricing settings
        useEffect(() => {
            const loadPricingSettings = async () => {
                try {
                    const response = await getAllSettings('pricing');
                    if (response.success && response.data.settings) {
                        const settingsObj = {};
                        response.data.settings.forEach(setting => {
                            settingsObj[setting.key] = setting.value;
                        });
                        setPricingSettings(prev => ({
                            ...prev,
                            ...settingsObj
                        }));
                    }
                } catch (err) {
                    console.error('Error loading pricing settings:', err);
                }
            };
            if (activeTab === 'pricing') {
                loadPricingSettings();
            }
        }, [activeTab]);

        // Load billing settings
        useEffect(() => {
            const loadBillingSettings = async () => {
                try {
                    const response = await getAllSettings('billing');
                    if (response.success && response.data.settings) {
                        const settingsObj = {};
                        response.data.settings.forEach(setting => {
                            if (setting.key === 'BILLING_TERMS_AND_CONDITIONS' || setting.key === 'BILLING_EXPERT_TERMS') {
                                try {
                                    const parsed = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
                                    if (Array.isArray(parsed)) {
                                        settingsObj[setting.key] = parsed.join('\n');
                                    } else {
                                        settingsObj[setting.key] = setting.value;
                                    }
                                } catch (e) {
                                    settingsObj[setting.key] = setting.value;
                                }
                            } else {
                                settingsObj[setting.key] = setting.value;
                            }
                        });
                        setBillingSettings(prev => ({
                            ...prev,
                            ...settingsObj
                        }));
                    }
                } catch (err) {
                    console.error('Error loading billing settings:', err);
                }
            };
            if (activeTab === 'billing') {
                loadBillingSettings();
            }
        }, [activeTab]);

        // Load general (dispute types) settings
        useEffect(() => {
            const loadGeneralSettings = async () => {
                try {
                    const response = await getAllSettings('general');
                    if (response.success && response.data.settings) {
                        const dtSetting = response.data.settings.find(s => s.key === 'DISPUTE_TYPES');
                        if (dtSetting && Array.isArray(dtSetting.value) && dtSetting.value.length > 0) {
                            setDisputeTypesList(dtSetting.value);
                        }
                    }
                } catch (err) {
                    console.error('Error loading general settings:', err);
                }
            };
            if (activeTab === 'general') {
                loadGeneralSettings();
            }
        }, [activeTab]);

        const handleAddDisputeType = () => {
            if (!newDisputeType.trim()) return;
            if (disputeTypesList.includes(newDisputeType.trim())) {
                toast.showError("This dispute type already exists");
                return;
            }
            setDisputeTypesList([...disputeTypesList, newDisputeType.trim()]);
            setNewDisputeType("");
        };

        const handleRemoveDisputeType = (index) => {
            setDisputeTypesList(disputeTypesList.filter((_, i) => i !== index));
        };

        const handleSaveDisputeTypes = async (e) => {
            if (e) e.preventDefault();
            setError("");
            setDisputeTypesLoading(true);

            try {
                const response = await updateMultipleSettings([
                    { key: 'DISPUTE_TYPES', value: disputeTypesList }
                ]);
                if (response.success) {
                    toast.showSuccess("Dispute types updated successfully!");
                } else {
                    setError(response.message || "Failed to update dispute types");
                }
            } catch (err) {
                console.error("Update dispute types error:", err);
                setError(err.response?.data?.message || "Failed to update dispute types. Please try again.");
            } finally {
                setDisputeTypesLoading(false);
            }
        };

        // Load communication settings
        useEffect(() => {
            const loadCommunicationSettings = async () => {
                try {
                    const response = await getAllSettings('notification');
                    if (response.success && response.data?.settings) {
                        const settingsObj = {};
                        response.data.settings.forEach(setting => {
                            if (setting.key === 'ENABLE_VENDOR_WHATSAPP_ASSISTANT' || setting.key === 'ENABLE_AUTOMATED_WHATSAPP_NOTIFICATIONS') {
                                settingsObj[setting.key] = setting.value === true || setting.value === 'true' || setting.value === 1;
                            } else if (setting.key === 'WHATSAPP_TEMPLATES_CONFIG') {
                                try {
                                    settingsObj[setting.key] = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
                                } catch (e) {
                                    settingsObj[setting.key] = setting.value;
                                }
                            }
                        });
                        setCommunicationSettings(prev => ({
                            ...prev,
                            ...settingsObj,
                            WHATSAPP_TEMPLATES_CONFIG: {
                                ...prev.WHATSAPP_TEMPLATES_CONFIG,
                                ...(settingsObj.WHATSAPP_TEMPLATES_CONFIG || {})
                            }
                        }));
                    }
                } catch (err) {
                    console.error('Error loading communication settings:', err);
                }
            };
            if (activeTab === 'communication') {
                loadCommunicationSettings();
                getWhatsAppStatusApi()
                    .then(res => {
                        if (res.success && res.data?.status) {
                            setWhatsappStatus(res.data.status);
                        }
                    })
                    .catch(err => console.error("Error loading WhatsApp status:", err));
            }
        }, [activeTab]);

        const handleSendTestWhatsApp = async () => {
            if (!testPhone || testPhone.trim().length < 10) {
                toast.showError("Please enter a valid 10-digit mobile number for testing");
                return;
            }
            setTestSending(true);
            try {
                const res = await testSendWhatsAppApi(testPhone.trim());
                if (res.success) {
                    toast.showSuccess(res.message || "Test message dispatched successfully!");
                } else {
                    toast.showError(res.message || "Failed to send test message");
                }
            } catch (err) {
                toast.showError(err.response?.data?.message || err.message || "Failed to send test message");
            } finally {
                setTestSending(false);
            }
        };

        const handleSaveCommunicationSettings = async (e) => {
            if (e) e.preventDefault();
            setError("");
            setCommunicationLoading(true);

            try {
                const response = await updateMultipleSettings([
                    { key: 'ENABLE_VENDOR_WHATSAPP_ASSISTANT', value: Boolean(communicationSettings.ENABLE_VENDOR_WHATSAPP_ASSISTANT), category: 'notification' },
                    { key: 'ENABLE_AUTOMATED_WHATSAPP_NOTIFICATIONS', value: Boolean(communicationSettings.ENABLE_AUTOMATED_WHATSAPP_NOTIFICATIONS), category: 'notification' },
                    { key: 'WHATSAPP_TEMPLATES_CONFIG', value: communicationSettings.WHATSAPP_TEMPLATES_CONFIG, category: 'notification' }
                ]);
                if (response.success) {
                    toast.showSuccess("WhatsApp & Communication settings updated successfully!");
                } else {
                    setError(response.message || "Failed to update communication settings");
                }
            } catch (err) {
                console.error("Update communication settings error:", err);
                setError(err.response?.data?.message || "Failed to update settings. Please try again.");
            } finally {
                setCommunicationLoading(false);
            }
        };

        // Load Language Settings
        const loadLanguageData = async () => {
            try {
                setLangLoading(true);
                const cfgRes = await getLanguageConfig();
                if (cfgRes.success && cfgRes.data) {
                    setLangConfig(prev => ({
                        ...prev,
                        ...cfgRes.data
                    }));
                }
            } catch (err) {
                console.error('Error loading language settings:', err);
            } finally {
                setLangLoading(false);
            }
        };

        useEffect(() => {
            if (activeTab === 'languages') {
                loadLanguageData();
            }
        }, [activeTab]);

        const handleToggleLanguageEnabled = async (code) => {
            const updatedLanguages = (langConfig.supportedLanguages || []).map(lang => {
                if (lang.code === code) {
                    if (lang.isDefault) {
                        toast.showError("Cannot disable default platform language");
                        return lang;
                    }
                    return { ...lang, isEnabled: !lang.isEnabled };
                }
                return lang;
            });

            const newConfig = { ...langConfig, supportedLanguages: updatedLanguages };
            setLangConfig(newConfig);
            try {
                await updateLanguageConfig(newConfig);
                toast.showSuccess(`Updated ${code.toUpperCase()} status`);
            } catch (err) {
                toast.showError("Failed to update language status");
            }
        };

        const handleSetDefaultLanguage = async (code) => {
            const updatedLanguages = (langConfig.supportedLanguages || []).map(lang => ({
                ...lang,
                isDefault: lang.code === code,
                isEnabled: lang.code === code ? true : lang.isEnabled
            }));
            const newConfig = { ...langConfig, defaultLanguage: code, supportedLanguages: updatedLanguages };
            setLangConfig(newConfig);
            try {
                await updateLanguageConfig(newConfig);
                toast.showSuccess(`Default language set to ${code.toUpperCase()}`);
            } catch (err) {
                toast.showError("Failed to update default language");
            }
        };

        const handleAddLanguageSubmit = async (e) => {
            e.preventDefault();
            if (!newLangForm.code.trim() || !newLangForm.name.trim() || !newLangForm.nativeName.trim()) {
                toast.showError("Language code, English name, and Native name are required");
                return;
            }

            setAddingLang(true);
            try {
                const res = await addLanguageApi({
                    code: newLangForm.code.trim().toLowerCase(),
                    name: newLangForm.name.trim(),
                    nativeName: newLangForm.nativeName.trim(),
                    badge: (newLangForm.badge || newLangForm.code.toUpperCase()).trim(),
                    autoTranslateImmediately: newLangForm.autoTranslateImmediately
                });

                if (res.success) {
                    toast.showSuccess(res.message || "Language added successfully!");
                    setShowAddLangModal(false);
                    setNewLangForm({
                        code: "",
                        name: "",
                        nativeName: "",
                        badge: "",
                        autoTranslateImmediately: true
                    });
                    await loadLanguageData();
                } else {
                    toast.showError(res.message || "Failed to add language");
                }
            } catch (err) {
                toast.showError(err.response?.data?.message || "Failed to add language");
            } finally {
                setAddingLang(false);
            }
        };

        const handleDeleteLanguage = async () => {
            if (!langToDelete) return;
            setDeletingLang(true);
            try {
                const res = await deleteLanguageApi(langToDelete.code);
                if (res.success) {
                    toast.showSuccess(`Language '${langToDelete.name}' deleted successfully`);
                    setShowDeleteLangModal(false);
                    setLangToDelete(null);
                    await loadLanguageData();
                } else {
                    toast.showError(res.message || "Failed to delete language");
                }
            } catch (err) {
                toast.showError(err.response?.data?.message || "Failed to delete language");
            } finally {
                setDeletingLang(false);
            }
        };

        // Handle reschedule settings update
        const handleRescheduleSettingsUpdate = async (e) => {
            e.preventDefault();
            setError("");
            setRescheduleLoading(true);

            try {
                const settings = [
                    { key: 'ALLOW_CUSTOMER_RESCHEDULE', value: Boolean(rescheduleSettings.ALLOW_CUSTOMER_RESCHEDULE), category: 'policy' },
                    { key: 'MAX_FREE_RESCHEDULES', value: Math.max(0, parseInt(rescheduleSettings.MAX_FREE_RESCHEDULES, 10) || 0), category: 'policy' },
                    { key: 'RESCHEDULE_WINDOW_DAYS', value: Math.max(1, parseInt(rescheduleSettings.RESCHEDULE_WINDOW_DAYS, 10) || 30), category: 'policy' },
                ];

                const response = await updateMultipleSettings(settings);
                if (response.success) {
                    toast.showSuccess("Reschedule policy updated successfully!");
                } else {
                    setError(response.message || "Failed to update reschedule policy settings");
                }
            } catch (err) {
                console.error("Update reschedule settings error:", err);
                setError(err.response?.data?.message || "Failed to update reschedule policy. Please try again.");
            } finally {
                setRescheduleLoading(false);
            }
        };

        // Handle pricing settings update
        const handlePricingSettingsUpdate = async (e) => {
            e.preventDefault();
            setError("");
            setPricingLoading(true);

            try {
                const settings = [
                    { key: 'TRAVEL_CHARGE_PER_KM', value: Number(pricingSettings.TRAVEL_CHARGE_PER_KM) },
                    { key: 'BASE_RADIUS_KM', value: Number(pricingSettings.BASE_RADIUS_KM) },
                    { key: 'GST_PERCENTAGE', value: Number(pricingSettings.GST_PERCENTAGE) },
                    { key: 'REQUIRE_ADMIN_REPORT_APPROVAL_FOR_PAYOUT', value: Boolean(pricingSettings.REQUIRE_ADMIN_REPORT_APPROVAL_FOR_PAYOUT) },
                    { key: 'ENABLE_AUTO_APPROVE_REPORT_SLA', value: Boolean(pricingSettings.ENABLE_AUTO_APPROVE_REPORT_SLA) },
                    { key: 'AUTO_APPROVE_REPORT_SLA_HOURS', value: Math.max(1, Number(pricingSettings.AUTO_APPROVE_REPORT_SLA_HOURS) || 48) },
                ];

                const response = await updateMultipleSettings(settings);
                if (response.success) {
                    toast.showSuccess("Pricing settings updated successfully!");
                } else {
                    setError(response.message || "Failed to update pricing settings");
                }
            } catch (err) {
                console.error("Update pricing settings error:", err);
                setError(err.response?.data?.message || "Failed to update pricing settings. Please try again.");
            } finally {
                setPricingLoading(false);
            }
        };

        // Handle billing settings update
        const handleBillingSettingsUpdate = async (e) => {
            e.preventDefault();
            setError("");
            setBillingLoading(true);

            try {
                let termsValue = billingSettings.BILLING_TERMS_AND_CONDITIONS;
                if (typeof termsValue === 'string') {
                    const termsArray = termsValue.split('\n').map(t => t.trim()).filter(Boolean);
                    termsValue = JSON.stringify(termsArray);
                }

                let expertTermsValue = billingSettings.BILLING_EXPERT_TERMS;
                if (typeof expertTermsValue === 'string') {
                    const expertArray = expertTermsValue.split('\n').map(t => t.trim()).filter(Boolean);
                    expertTermsValue = JSON.stringify(expertArray);
                }

                const settings = [
                    { key: 'BILLING_COMPANY_NAME', value: billingSettings.BILLING_COMPANY_NAME, category: 'billing' },
                    { key: 'BILLING_ADDRESS', value: billingSettings.BILLING_ADDRESS, category: 'billing' },
                    { key: 'BILLING_GSTIN', value: billingSettings.BILLING_GSTIN, category: 'billing' },
                    { key: 'BILLING_PAN', value: billingSettings.BILLING_PAN, category: 'billing' },
                    { key: 'BILLING_PHONE', value: billingSettings.BILLING_PHONE, category: 'billing' },
                    { key: 'BILLING_EMAIL', value: billingSettings.BILLING_EMAIL, category: 'billing' },
                    { key: 'BILLING_WEBSITE', value: billingSettings.BILLING_WEBSITE, category: 'billing' },
                    { key: 'BILLING_SAC_CODE', value: billingSettings.BILLING_SAC_CODE, category: 'billing' },
                    { key: 'BILLING_PLACE_OF_SUPPLY', value: billingSettings.BILLING_PLACE_OF_SUPPLY, category: 'billing' },
                    { key: 'BILLING_DECLARATION', value: billingSettings.BILLING_DECLARATION, category: 'billing' },
                    { key: 'BILLING_TERMS_AND_CONDITIONS', value: termsValue, category: 'billing' },
                    { key: 'BILLING_EXPERT_TERMS', value: expertTermsValue, category: 'billing' },
                ];

                const response = await updateMultipleSettings(settings);
                if (response.success) {
                    toast.showSuccess("Billing information & invoice settings updated successfully!");
                } else {
                    setError(response.message || "Failed to update billing information");
                }
            } catch (err) {
                console.error("Update billing settings error:", err);
                setError(err.response?.data?.message || "Failed to update billing information. Please try again.");
            } finally {
                setBillingLoading(false);
            }
        };



        // Hub card config
        const hubCards = [
            {
                id: "general",
                label: "General & App Info",
                description: "Admin name, email, time zone & configurable dispute types",
                icon: IoSettingsOutline,
                gradient: "from-blue-500 to-indigo-600",
                bg: "bg-blue-50",
                iconColor: "text-blue-600",
                border: "border-blue-100",
                badge: "Core",
                badgeBg: "bg-blue-100 text-blue-700",
            },
            {
                id: "reschedule",
                label: "Reschedule Policy",
                description: "Free reschedule limits, booking windows & expert policies",
                icon: IoCalendarOutline,
                gradient: "from-violet-500 to-purple-600",
                bg: "bg-violet-50",
                iconColor: "text-violet-600",
                border: "border-violet-100",
                badge: "Policy",
                badgeBg: "bg-violet-100 text-violet-700",
            },
            {
                id: "pricing",
                label: "Pricing & Quality Gate",
                description: "Travel charges, base radius, GST, auto-approval SLA",
                icon: IoCashOutline,
                gradient: "from-emerald-500 to-teal-600",
                bg: "bg-emerald-50",
                iconColor: "text-emerald-600",
                border: "border-emerald-100",
                badge: "Finance",
                badgeBg: "bg-emerald-100 text-emerald-700",
            },
            {
                id: "billing",
                label: "Billing & GST Declarations",
                description: "Company details, GSTIN, PAN, invoice terms & T&C",
                icon: IoBusinessOutline,
                gradient: "from-orange-500 to-amber-600",
                bg: "bg-orange-50",
                iconColor: "text-orange-600",
                border: "border-orange-100",
                badge: "Finance",
                badgeBg: "bg-orange-100 text-orange-700",
            },
            {
                id: "languages",
                label: "Languages",
                description: "Multi-language support, AI translation & locale config",
                icon: IoGlobeOutline,
                gradient: "from-cyan-500 to-sky-600",
                bg: "bg-cyan-50",
                iconColor: "text-cyan-600",
                border: "border-cyan-100",
                badge: "Localization",
                badgeBg: "bg-cyan-100 text-cyan-700",
            },
            {
                id: "security",
                label: "Security & Integrations",
                description: "Admin registration, OTP verification & access control",
                icon: IoLockClosedOutline,
                gradient: "from-rose-500 to-pink-600",
                bg: "bg-rose-50",
                iconColor: "text-rose-600",
                border: "border-rose-100",
                badge: "Security",
                badgeBg: "bg-rose-100 text-rose-700",
            },
        ];

        return (
            <div className="min-h-[calc(100vh-5rem)]">

                {/* ── HUB VIEW ─────────────────────────────────────────────── */}
                {activeTab === "hub" && (
                    <div>
                        {/* Hub Header */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0A84FF] to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                    <IoSettingsOutline className="text-white text-xl" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">Settings</h1>
                                    <p className="text-sm text-gray-500">Manage your admin panel preferences and configurations</p>
                                </div>
                            </div>
                        </div>

                        {/* Hub Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 max-w-5xl">
                            {hubCards.map((card) => {
                                const CardIcon = card.icon;
                                return (
                                    <button
                                        key={card.id}
                                        onClick={() => {
                                            setActiveTab(card.id);
                                            navigate(`/admin/settings/${card.id}`);
                                        }}
                                        className="group text-left bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-gray-300 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:ring-offset-2"
                                    >
                                        {/* Icon + Badge Row */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-12 h-12 rounded-xl ${card.bg} ${card.border} border flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                                                <CardIcon className={`text-2xl ${card.iconColor}`} />
                                            </div>
                                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${card.badgeBg}`}>
                                                {card.badge}
                                            </span>
                                        </div>

                                        {/* Text */}
                                        <h3 className="font-bold text-gray-900 text-base mb-1.5 group-hover:text-[#0A84FF] transition-colors">
                                            {card.label}
                                        </h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            {card.description}
                                        </p>

                                        {/* Chevron */}
                                        <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-[#0A84FF] transition-colors">
                                            <span>Configure</span>
                                            <IoChevronDownOutline className="-rotate-90 text-base" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── DETAIL VIEW ──────────────────────────────────────────── */}
                {activeTab !== "hub" && (
                <div>
                    {/* Header */}
                    <div className="mb-6">
                        {/* Back to settings hub breadcrumb */}
                        <button
                            onClick={() => {
                                setActiveTab("hub");
                                navigate("/admin/settings");
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#0A84FF] transition-colors mb-3 group"
                        >
                            <IoChevronDownOutline className="rotate-90 text-sm group-hover:-translate-x-0.5 transition-transform" />
                            All Settings
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">
                            {activeTab === "register" ? "Admin Management" : (settingsTabs.find(t => t.id === activeTab)?.label || "Settings")}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {activeTab === "register"
                                ? "Onboard new internal administrative team members"
                                : "Manage your admin panel preferences and configurations"}
                        </p>
                    </div>

                    {/* Premium Pill-style Tab Bar */}
                    {activeTab !== "register" && (
                        <div className="mb-6">
                            <div className="inline-flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto max-w-full">
                                {settingsTabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setActiveTab(tab.id);
                                                navigate(`/admin/settings/${tab.id}`);
                                                setError("");
                                            }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                                                isActive
                                                    ? "bg-white text-[#0A84FF] shadow-sm border border-gray-200"
                                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/60"
                                            }`}
                                        >
                                            <Icon className="text-base" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                <div className={`w-full ${activeTab === "languages" ? "max-w-7xl" : "max-w-4xl"}`}>
                    {/* Settings Content */}
                    <div className="w-full">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 ring-1 ring-black/[0.04]">
                            <ErrorMessage message={error} />

                            {activeTab === "general" && (
                                <div>
                                    <h2 className="text-base font-semibold text-gray-800 mb-5">General Settings</h2>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                Admin Name
                                            </label>
                                            <input
                                                type="text"
                                                defaultValue={admin?.name || ""}
                                                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                placeholder="Enter admin name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                defaultValue={admin?.email || ""}
                                                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                placeholder="Enter email address"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                Time Zone
                                            </label>
                                            <select className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors">
                                                <option>Asia/Kolkata (IST)</option>
                                                <option>UTC</option>
                                            </select>
                                        </div>
                                        {/* Configurable Dispute Types */}
                                        <div className="pt-5 border-t border-gray-100">
                                            <h3 className="text-sm font-semibold text-gray-800 mb-1.5">Configurable Dispute Types</h3>
                                            <p className="text-xs text-gray-400 mb-3">
                                                Manage categories available for users and vendors when creating a dispute.
                                            </p>

                                            <div className="flex gap-2 mb-4">
                                                <input
                                                    type="text"
                                                    value={newDisputeType}
                                                    onChange={(e) => setNewDisputeType(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleAddDisputeType();
                                                        }
                                                    }}
                                                    placeholder="Enter new dispute type name"
                                                    className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddDisputeType}
                                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-lg transition-colors"
                                                >
                                                    Add
                                                </button>
                                            </div>

                                            <div className="space-y-2 max-h-60 overflow-y-auto mb-4 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                                {disputeTypesList.map((dt, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between bg-white px-3 py-2 rounded border border-gray-200 text-sm"
                                                    >
                                                        <span className="text-gray-800 font-medium">{dt}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveDisputeType(index)}
                                                            className="text-red-500 hover:text-red-700 p-1"
                                                        >
                                                            <IoCloseOutline className="text-lg" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={handleSaveDisputeTypes}
                                                    disabled={disputeTypesLoading}
                                                    className="px-4 py-2 text-sm bg-[#0A84FF] text-white rounded-lg hover:bg-[#005BBB] transition-colors font-semibold disabled:opacity-50"
                                                >
                                                    {disputeTypesLoading ? "Saving..." : "Save Dispute Types"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "communication" && (
                                <div className="space-y-5">
                                    {/* Header */}
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                        <div>
                                            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                                <IoLogoWhatsapp className="text-emerald-600 text-lg" />
                                                <span>WhatsApp & Customer Communication Settings</span>
                                            </h2>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Control the 1-Tap WhatsApp Assistant in the Expert App and manage standardized message templates.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => navigate('/admin/activity-logs')}
                                                className="px-3 py-1 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full border border-gray-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                                title="View All Admin Audit History Logs"
                                            >
                                                <IoTimeOutline className="text-sm text-gray-600" />
                                                <span>Audit History</span>
                                            </button>
                                            <span className={`px-3 py-1 text-xs font-black rounded-full border ${
                                                communicationSettings.ENABLE_VENDOR_WHATSAPP_ASSISTANT
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : "bg-red-50 text-red-700 border-red-200"
                                            }`}>
                                                {communicationSettings.ENABLE_VENDOR_WHATSAPP_ASSISTANT ? "● ASSISTANT ACTIVE" : "○ ASSISTANT DISABLED"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Master Toggles Card */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-2xs">
                                        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                                            <span>Master Communication Toggles</span>
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Toggle 1: Expert App Button */}
                                            <div className="flex items-start justify-between p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80">
                                                <div className="pr-3">
                                                    <span className="text-xs font-bold text-gray-900 block">
                                                        Expert WhatsApp Action Button
                                                    </span>
                                                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                                                        Show the 1-tap WhatsApp button on booking details and card actions in the Expert App.
                                                    </p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={Boolean(communicationSettings.ENABLE_VENDOR_WHATSAPP_ASSISTANT)}
                                                        onChange={(e) =>
                                                            setCommunicationSettings(prev => ({
                                                                ...prev,
                                                                ENABLE_VENDOR_WHATSAPP_ASSISTANT: e.target.checked
                                                            }))
                                                        }
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                                </label>
                                            </div>

                                            {/* Toggle 2: Server Automated Alerts */}
                                            <div className="flex items-start justify-between p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80">
                                                <div className="pr-3">
                                                    <span className="text-xs font-bold text-gray-900 block">
                                                        Automated Server Notifications
                                                    </span>
                                                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                                                        Automatically dispatch WhatsApp alerts to customers on status changes (Acceptance, En Route, OTP).
                                                    </p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={Boolean(communicationSettings.ENABLE_AUTOMATED_WHATSAPP_NOTIFICATIONS)}
                                                        onChange={(e) =>
                                                            setCommunicationSettings(prev => ({
                                                                ...prev,
                                                                ENABLE_AUTOMATED_WHATSAPP_NOTIFICATIONS: e.target.checked
                                                            }))
                                                        }
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0A84FF]"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Meta Cloud API Diagnostics & Live Test Console */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-2xs">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                                <span>Meta WhatsApp Cloud API Diagnostics</span>
                                            </h3>
                                            <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md border ${
                                                whatsappStatus?.hasMeta
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                            }`}>
                                                {whatsappStatus?.statusText || "Checking status..."}
                                            </span>
                                        </div>

                                        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 space-y-3">
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                Test your Meta WhatsApp Cloud API credentials in real time. Enter a 10-digit mobile number to dispatch a live verification ping.
                                            </p>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <div className="flex-1 relative">
                                                    <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">+91</span>
                                                    <input
                                                        type="tel"
                                                        value={testPhone}
                                                        onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                        placeholder="Enter 10-digit mobile number"
                                                        className="w-full pl-11 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-white"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleSendTestWhatsApp}
                                                    disabled={testSending || !testPhone}
                                                    className="px-4 py-2 bg-[#0A84FF] hover:bg-[#0070DF] disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                                                >
                                                    <IoLogoWhatsapp className="text-sm" />
                                                    <span>{testSending ? "Sending..." : "Send Test WhatsApp"}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Templates Configuration Card */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-2xs">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-800">
                                                    Message Templates Management (6 Templates)
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Enable/disable templates and customize their wording for the Expert App.
                                                </p>
                                            </div>
                                            <div className="text-[11px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                                Tokens: {"{Customer Name}"}, {"{Expert Name}"}, {"{Booking ID}"}, {"{Date}"}, {"{Time}"}, {"{X}"}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {Object.entries(communicationSettings.WHATSAPP_TEMPLATES_CONFIG || {}).map(([key, tmpl]) => (
                                                <div key={key} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black text-gray-900">
                                                                {tmpl.title || key}
                                                            </span>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                                                tmpl.enabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-200 text-gray-600 border-gray-300"
                                                            }`}>
                                                                {tmpl.enabled ? "ENABLED" : "DISABLED"}
                                                            </span>
                                                        </div>
                                                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                                                            <span>Show in App</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={tmpl.enabled !== false}
                                                                onChange={(e) => {
                                                                    const updated = {
                                                                        ...communicationSettings.WHATSAPP_TEMPLATES_CONFIG,
                                                                        [key]: {
                                                                            ...tmpl,
                                                                            enabled: e.target.checked
                                                                        }
                                                                    };
                                                                    setCommunicationSettings(prev => ({
                                                                        ...prev,
                                                                        WHATSAPP_TEMPLATES_CONFIG: updated
                                                                    }));
                                                                }}
                                                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                                                            />
                                                        </label>
                                                    </div>

                                                    <textarea
                                                        rows={3}
                                                        value={tmpl.template || ""}
                                                        onChange={(e) => {
                                                            const updated = {
                                                                ...communicationSettings.WHATSAPP_TEMPLATES_CONFIG,
                                                                [key]: {
                                                                    ...tmpl,
                                                                    template: e.target.value
                                                                }
                                                            };
                                                            setCommunicationSettings(prev => ({
                                                                ...prev,
                                                                WHATSAPP_TEMPLATES_CONFIG: updated
                                                            }));
                                                        }}
                                                        className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 font-sans focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20 focus:border-[#0A84FF] transition-all resize-none"
                                                        placeholder="Template wording..."
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Submit Action */}
                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="button"
                                            onClick={handleSaveCommunicationSettings}
                                            disabled={communicationLoading}
                                            className="px-5 py-2.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                                        >
                                            {communicationLoading ? "Saving Settings..." : "Save Communication Settings"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === "reschedule" && (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                        <div>
                                            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                                <IoCalendarOutline className="text-blue-600" />
                                                <span>Customer Reschedule Policy</span>
                                            </h2>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Configure platform-wide rules for voluntary survey date rescheduling by customers.
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-black rounded-full border ${
                                            rescheduleSettings.ALLOW_CUSTOMER_RESCHEDULE
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : "bg-red-50 text-red-700 border-red-200"
                                        }`}>
                                            {rescheduleSettings.ALLOW_CUSTOMER_RESCHEDULE ? "● Reschedule Active" : "○ Reschedule Disabled"}
                                        </span>
                                    </div>

                                    <form onSubmit={handleRescheduleSettingsUpdate} className="space-y-5">
                                        {/* Master Toggle Card */}
                                        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                                            rescheduleSettings.ALLOW_CUSTOMER_RESCHEDULE
                                                ? "bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white border-blue-200"
                                                : "bg-slate-50 border-slate-200"
                                        }`}>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                        <span>Allow Customer Rescheduling</span>
                                                    </h3>
                                                    <p className="text-xs text-gray-500 leading-relaxed">
                                                        When enabled, customers can voluntarily move their survey date to an upcoming available day before the expert departs.
                                                    </p>
                                                </div>

                                                {/* Toggle Switch */}
                                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={rescheduleSettings.ALLOW_CUSTOMER_RESCHEDULE}
                                                        onChange={(e) =>
                                                            setRescheduleSettings(prev => ({
                                                                ...prev,
                                                                ALLOW_CUSTOMER_RESCHEDULE: e.target.checked
                                                            }))
                                                        }
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-12 h-6.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0A84FF]"></div>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Configuration Fields */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Max Free Reschedules */}
                                            <div className="p-4.5 bg-white rounded-xl border border-gray-200 space-y-3 shadow-2xs">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-800 mb-1">
                                                        Max Allowed Reschedules Per Booking
                                                    </label>
                                                    <p className="text-xs text-gray-500">
                                                        Number of voluntary date changes permitted before rescheduling is locked.
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        value={rescheduleSettings.MAX_FREE_RESCHEDULES}
                                                        onChange={(e) =>
                                                            setRescheduleSettings(prev => ({
                                                                ...prev,
                                                                MAX_FREE_RESCHEDULES: e.target.value
                                                            }))
                                                        }
                                                        disabled={!rescheduleSettings.ALLOW_CUSTOMER_RESCHEDULE}
                                                        className="w-24 px-3.5 py-2.5 text-sm font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0A84FF] disabled:bg-gray-100 disabled:text-gray-400"
                                                    />
                                                    <span className="text-xs font-semibold text-gray-600">
                                                        reschedules per booking
                                                    </span>
                                                </div>

                                                {/* Presets */}
                                                <div className="flex items-center gap-1.5 pt-1">
                                                    <span className="text-[11px] font-bold text-gray-400 mr-1">Presets:</span>
                                                    {[0, 1, 2, 3, 5].map((count) => (
                                                        <button
                                                            key={count}
                                                            type="button"
                                                            disabled={!rescheduleSettings.ALLOW_CUSTOMER_RESCHEDULE}
                                                            onClick={() =>
                                                                setRescheduleSettings(prev => ({
                                                                    ...prev,
                                                                    MAX_FREE_RESCHEDULES: count
                                                                }))
                                                            }
                                                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                                                Number(rescheduleSettings.MAX_FREE_RESCHEDULES) === count
                                                                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                                                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 disabled:opacity-50"
                                                            }`}
                                                        >
                                                            {count === 0 ? "0 (Disabled)" : `${count} Free`}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Reschedule Window Days */}
                                            <div className="p-4.5 bg-white rounded-xl border border-gray-200 space-y-3 shadow-2xs">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-800 mb-1">
                                                        Reschedule Advance Window (Days)
                                                    </label>
                                                    <p className="text-xs text-gray-500">
                                                        Maximum days into the future a customer is allowed to pick a new date.
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="180"
                                                        value={rescheduleSettings.RESCHEDULE_WINDOW_DAYS}
                                                        onChange={(e) =>
                                                            setRescheduleSettings(prev => ({
                                                                ...prev,
                                                                RESCHEDULE_WINDOW_DAYS: e.target.value
                                                            }))
                                                        }
                                                        disabled={!rescheduleSettings.ALLOW_CUSTOMER_RESCHEDULE}
                                                        className="w-24 px-3.5 py-2.5 text-sm font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0A84FF] disabled:bg-gray-100 disabled:text-gray-400"
                                                    />
                                                    <span className="text-xs font-semibold text-gray-600">
                                                        days in advance
                                                    </span>
                                                </div>

                                                {/* Presets */}
                                                <div className="flex items-center gap-1.5 pt-1">
                                                    <span className="text-[11px] font-bold text-gray-400 mr-1">Presets:</span>
                                                    {[15, 30, 45, 60, 90].map((days) => (
                                                        <button
                                                            key={days}
                                                            type="button"
                                                            disabled={!rescheduleSettings.ALLOW_CUSTOMER_RESCHEDULE}
                                                            onClick={() =>
                                                                setRescheduleSettings(prev => ({
                                                                    ...prev,
                                                                    RESCHEDULE_WINDOW_DAYS: days
                                                                }))
                                                            }
                                                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                                                Number(rescheduleSettings.RESCHEDULE_WINDOW_DAYS) === days
                                                                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                                                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 disabled:opacity-50"
                                                            }`}
                                                        >
                                                            {days}d
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Customer Experience Preview Card */}
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                                            <span className="font-bold text-slate-700 uppercase tracking-wider block text-[10.5px]">
                                                Customer App Preview:
                                            </span>
                                            {rescheduleSettings.ALLOW_CUSTOMER_RESCHEDULE && Number(rescheduleSettings.MAX_FREE_RESCHEDULES) > 0 ? (
                                                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/80 border border-blue-200 text-blue-950 font-bold">
                                                    <span className="flex items-center gap-1.5">
                                                        <IoCalendarOutline className="text-[#0A84FF] text-base" />
                                                        <span>Free Reschedules Remaining:</span>
                                                    </span>
                                                    <span className="px-2.5 py-0.5 rounded-full bg-[#0A84FF] text-white text-[11px] font-black">
                                                        {rescheduleSettings.MAX_FREE_RESCHEDULES} of {rescheduleSettings.MAX_FREE_RESCHEDULES} Left
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-semibold">
                                                    ⚠️ Rescheduling is locked. Customers will see: "Rescheduling is currently disabled by platform policy."
                                                </div>
                                            )}
                                        </div>

                                        {/* Submit Button */}
                                        <div className="flex justify-end pt-2">
                                            <button
                                                type="submit"
                                                disabled={rescheduleLoading}
                                                className="px-4 py-2 bg-[#0A84FF] hover:bg-[#005BBB] text-white font-semibold text-sm rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {rescheduleLoading && (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                )}
                                                {rescheduleLoading ? "Saving Policy..." : "Save Reschedule Policy"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {activeTab === "billing" && (
                                <div>
                                    <h2 className="text-base font-semibold text-gray-800 mb-5">Billing Information</h2>
                                    <p className="text-sm text-gray-500 mb-6">
                                        This information will be displayed on all invoices generated for users and vendors.
                                    </p>
                                    <form onSubmit={handleBillingSettingsUpdate} className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    Company Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={billingSettings.BILLING_COMPANY_NAME}
                                                    onChange={(e) =>
                                                        setBillingSettings({
                                                            ...billingSettings,
                                                            BILLING_COMPANY_NAME: e.target.value,
                                                        })
                                                    }
                                                    required
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                    placeholder="Legal Company Name"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    Billing Address
                                                </label>
                                                <textarea
                                                    value={billingSettings.BILLING_ADDRESS}
                                                    onChange={(e) =>
                                                        setBillingSettings({
                                                            ...billingSettings,
                                                            BILLING_ADDRESS: e.target.value,
                                                        })
                                                    }
                                                    required
                                                    rows={3}
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                    placeholder="Complete business address"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    GSTIN
                                                </label>
                                                <input
                                                    type="text"
                                                    value={billingSettings.BILLING_GSTIN}
                                                    onChange={(e) =>
                                                        setBillingSettings({
                                                            ...billingSettings,
                                                            BILLING_GSTIN: e.target.value,
                                                        })
                                                    }
                                                    required
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                    placeholder="GST Registration Number"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    PAN Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={billingSettings.BILLING_PAN || ""}
                                                    onChange={(e) =>
                                                        setBillingSettings({
                                                            ...billingSettings,
                                                            BILLING_PAN: e.target.value,
                                                        })
                                                    }
                                                    required
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent font-mono"
                                                    placeholder="Permanent Account Number (PAN)"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    Contact Phone
                                                </label>
                                                <input
                                                    type="text"
                                                    value={billingSettings.BILLING_PHONE || ""}
                                                    onChange={(e) =>
                                                        setBillingSettings({
                                                            ...billingSettings,
                                                            BILLING_PHONE: e.target.value,
                                                        })
                                                    }
                                                    required
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                    placeholder="Contact Number for Invoices"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    Billing Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={billingSettings.BILLING_EMAIL || ""}
                                                    onChange={(e) =>
                                                        setBillingSettings({
                                                            ...billingSettings,
                                                            BILLING_EMAIL: e.target.value,
                                                        })
                                                    }
                                                    required
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                    placeholder="Billing Support Email"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    Website URL
                                                </label>
                                                <input
                                                    type="text"
                                                    value={billingSettings.BILLING_WEBSITE || ""}
                                                    onChange={(e) =>
                                                        setBillingSettings({
                                                            ...billingSettings,
                                                            BILLING_WEBSITE: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                    placeholder="https://jaladhaaraapp.in"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    SAC Code
                                                </label>
                                                <input
                                                    type="text"
                                                    value={billingSettings.BILLING_SAC_CODE || ""}
                                                    onChange={(e) =>
                                                        setBillingSettings({
                                                            ...billingSettings,
                                                            BILLING_SAC_CODE: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent font-mono"
                                                    placeholder="998341"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    Place of Supply
                                                </label>
                                                <input
                                                    type="text"
                                                    value={billingSettings.BILLING_PLACE_OF_SUPPLY || ""}
                                                    onChange={(e) =>
                                                        setBillingSettings({
                                                            ...billingSettings,
                                                            BILLING_PLACE_OF_SUPPLY: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                    placeholder="Chhattisgarh (State Code: 22)"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    Invoice Declaration / Footnote
                                                </label>
                                                <textarea
                                                    value={billingSettings.BILLING_DECLARATION || ""}
                                                    onChange={(e) =>
                                                        setBillingSettings({
                                                            ...billingSettings,
                                                            BILLING_DECLARATION: e.target.value,
                                                        })
                                                    }
                                                    rows={2}
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                    placeholder="This is a computer-generated Tax Invoice..."
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                                                    <span>User Customer Invoice Terms & Conditions</span>
                                                    <span className="text-xs text-gray-400 font-normal">(Enter 1 clause per line)</span>
                                                </label>
                                                <textarea
                                                    value={billingSettings.BILLING_TERMS_AND_CONDITIONS || ""}
                                                    onChange={(e) =>
                                                        setBillingSettings({
                                                            ...billingSettings,
                                                            BILLING_TERMS_AND_CONDITIONS: e.target.value,
                                                        })
                                                    }
                                                    rows={5}
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent font-mono text-xs leading-relaxed"
                                                    placeholder="Enter each terms clause on a new line..."
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                                                    <span>Expert Facilitation Invoice Terms & Declarations</span>
                                                    <span className="text-xs text-gray-400 font-normal">(Enter 1 clause per line)</span>
                                                </label>
                                                <textarea
                                                    value={billingSettings.BILLING_EXPERT_TERMS || ""}
                                                    onChange={(e) =>
                                                        setBillingSettings({
                                                            ...billingSettings,
                                                            BILLING_EXPERT_TERMS: e.target.value,
                                                        })
                                                    }
                                                    rows={5}
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent font-mono text-xs leading-relaxed"
                                                    placeholder="Enter each expert invoice term on a new line..."
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-4">
                                            <button
                                                type="submit"
                                                disabled={billingLoading}
                                                className="px-4 py-2 text-sm bg-[#0A84FF] text-white rounded-lg hover:bg-[#005BBB] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {billingLoading && (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                )}
                                                {billingLoading ? "Saving..." : "Save Billing Info"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Pricing tab content below */}
                            {activeTab === "pricing" && (
                                <div>
                                    <h2 className="text-base font-semibold text-gray-800 mb-5">Pricing Settings</h2>
                                    <form onSubmit={handlePricingSettingsUpdate} className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                Travel Charge Per Kilometer (₹)
                                            </label>
                                            <input
                                                type="number"
                                                value={pricingSettings.TRAVEL_CHARGE_PER_KM}
                                                onChange={(e) =>
                                                    setPricingSettings({
                                                        ...pricingSettings,
                                                        TRAVEL_CHARGE_PER_KM: e.target.value,
                                                    })
                                                }
                                                min="0"
                                                step="0.01"
                                                required
                                                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                placeholder="Enter travel charge per km"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Charge per kilometer beyond the base radius
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                Base Radius (km)
                                            </label>
                                            <input
                                                type="number"
                                                value={pricingSettings.BASE_RADIUS_KM}
                                                onChange={(e) =>
                                                    setPricingSettings({
                                                        ...pricingSettings,
                                                        BASE_RADIUS_KM: e.target.value,
                                                    })
                                                }
                                                min="0"
                                                step="1"
                                                required
                                                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                placeholder="Enter base radius in km"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Distance within which no travel charges apply
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                GST Percentage (%)
                                            </label>
                                            <input
                                                type="number"
                                                value={pricingSettings.GST_PERCENTAGE}
                                                onChange={(e) =>
                                                    setPricingSettings({
                                                        ...pricingSettings,
                                                        GST_PERCENTAGE: e.target.value,
                                                    })
                                                }
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                required
                                                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                placeholder="Enter GST percentage"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                GST percentage applied on total amount (subtotal + travel charges)
                                            </p>
                                        </div>

                                        {/* 2nd Installment Payout Quality Review Gate & SLA Timer Settings (Compact Layout) */}
                                        <div className="p-4 bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-slate-50 rounded-xl border border-blue-100 shadow-2xs space-y-3">
                                            {/* Master Gate Toggle */}
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="space-y-0.5 flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs sm:text-sm font-bold text-gray-900">
                                                            2nd Installment Payout Quality Review Gate
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${pricingSettings.REQUIRE_ADMIN_REPORT_APPROVAL_FOR_PAYOUT ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/60' : 'bg-amber-100 text-amber-800 border border-amber-300/60'}`}>
                                                            {pricingSettings.REQUIRE_ADMIN_REPORT_APPROVAL_FOR_PAYOUT ? '🛡️ Escrow Active' : '⚡ Instant Auto-Release'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-600 leading-snug">
                                                        {pricingSettings.REQUIRE_ADMIN_REPORT_APPROVAL_FOR_PAYOUT
                                                            ? '2nd installment (50%) is held in escrow until Admin reviews & approves report in Approvals.'
                                                            : '2nd installment (50%) is auto-released to vendor immediately upon report upload.'}
                                                    </p>
                                                </div>

                                                {/* Toggle Switch */}
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={Boolean(pricingSettings.REQUIRE_ADMIN_REPORT_APPROVAL_FOR_PAYOUT)}
                                                    onClick={() =>
                                                        setPricingSettings(prev => ({
                                                            ...prev,
                                                            REQUIRE_ADMIN_REPORT_APPROVAL_FOR_PAYOUT: !prev.REQUIRE_ADMIN_REPORT_APPROVAL_FOR_PAYOUT
                                                        }))
                                                    }
                                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${pricingSettings.REQUIRE_ADMIN_REPORT_APPROVAL_FOR_PAYOUT ? 'bg-[#0A84FF]' : 'bg-slate-300'
                                                        }`}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${pricingSettings.REQUIRE_ADMIN_REPORT_APPROVAL_FOR_PAYOUT ? 'translate-x-5' : 'translate-x-0'
                                                            }`}
                                                    />
                                                </button>
                                            </div>

                                            {/* SLA Grace Period Section */}
                                            {pricingSettings.REQUIRE_ADMIN_REPORT_APPROVAL_FOR_PAYOUT && (
                                                <div className="pt-2.5 border-t border-blue-200/50 space-y-2.5">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                                                                ⏱️ SLA Auto-Release Timer:
                                                            </span>
                                                            <span className="text-[11px] text-gray-500">
                                                                Auto-releases if no dispute within duration
                                                            </span>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={Boolean(pricingSettings.ENABLE_AUTO_APPROVE_REPORT_SLA)}
                                                            onClick={() =>
                                                                setPricingSettings(prev => ({
                                                                    ...prev,
                                                                    ENABLE_AUTO_APPROVE_REPORT_SLA: !prev.ENABLE_AUTO_APPROVE_REPORT_SLA
                                                                }))
                                                            }
                                                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${pricingSettings.ENABLE_AUTO_APPROVE_REPORT_SLA ? 'bg-emerald-600' : 'bg-slate-300'
                                                                }`}
                                                        >
                                                            <span
                                                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${pricingSettings.ENABLE_AUTO_APPROVE_REPORT_SLA ? 'translate-x-4' : 'translate-x-0'
                                                                    }`}
                                                            />
                                                        </button>
                                                    </div>

                                                    {pricingSettings.ENABLE_AUTO_APPROVE_REPORT_SLA && (
                                                        <div className="bg-white/80 rounded-lg p-2.5 border border-blue-100 flex items-center justify-between gap-3 flex-wrap">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max="336"
                                                                    value={pricingSettings.AUTO_APPROVE_REPORT_SLA_HOURS}
                                                                    onChange={(e) =>
                                                                        setPricingSettings({
                                                                            ...pricingSettings,
                                                                            AUTO_APPROVE_REPORT_SLA_HOURS: e.target.value
                                                                        })
                                                                    }
                                                                    className="w-20 px-2 py-1 text-xs font-bold border border-gray-300 rounded-md focus:ring-1 focus:ring-[#0A84FF]"
                                                                />
                                                                <span className="text-xs text-gray-600 font-semibold">
                                                                    hrs ({((Number(pricingSettings.AUTO_APPROVE_REPORT_SLA_HOURS) || 48) / 24).toFixed(1).replace(/\.0$/, '')}d)
                                                                </span>
                                                            </div>

                                                            {/* Compact Presets */}
                                                            <div className="flex items-center gap-1">
                                                                {[24, 48, 72, 120].map((hours) => (
                                                                    <button
                                                                        key={hours}
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setPricingSettings(prev => ({
                                                                                ...prev,
                                                                                AUTO_APPROVE_REPORT_SLA_HOURS: hours
                                                                            }))
                                                                        }
                                                                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${Number(pricingSettings.AUTO_APPROVE_REPORT_SLA_HOURS) === hours
                                                                            ? 'bg-[#0A84FF] text-white border-[#0A84FF]'
                                                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                                            }`}
                                                                    >
                                                                        {hours}h
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={pricingLoading}
                                                className="px-6 py-3 bg-[#0A84FF] text-white rounded-lg hover:bg-[#005BBB] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {pricingLoading ? "Saving..." : "Save Pricing Settings"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* ================================================================= */}
                            {/* TAB: LANGUAGES & LOCALIZATION (SIMPLE ADD & DELETE)               */}
                            {/* ================================================================= */}
                            {activeTab === "languages" && (
                                <div className="space-y-5">
                                    {/* Header Section */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                                        <div>
                                            <h2 className="text-base font-semibold text-gray-800">Language Management</h2>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Add or remove languages for Users & Vendors. Any added language is automatically translated across the platform.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNewLangForm({
                                                        code: "",
                                                        name: "",
                                                        nativeName: "",
                                                        badge: "",
                                                        autoTranslateImmediately: true
                                                    });
                                                    setShowAddLangModal(true);
                                                }}
                                                className="px-4 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <IoAddOutline className="text-base" />
                                                Add Language
                                            </button>
                                        </div>
                                    </div>

                                    {/* Configured Languages Grid */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                <IoGlobeOutline className="text-[#0A84FF]" />
                                                Configured Languages ({(langConfig.supportedLanguages || []).length})
                                            </h3>
                                            <span className="text-xs text-gray-500">Visible to Users and Vendors in their language selector</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                            {(langConfig.supportedLanguages || []).map((lang) => {
                                                const isEn = lang.code === 'en';

                                                return (
                                                    <div
                                                        key={lang.code}
                                                        className="p-4 rounded-2xl border border-gray-200/90 bg-white shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center font-black text-xs text-blue-700 shadow-2xs shrink-0">
                                                                {lang.badge || lang.code.toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className="text-sm font-bold text-gray-900 block truncate">{lang.name}</span>
                                                                <span className="text-xs text-gray-500 font-semibold truncate">{lang.nativeName}</span>
                                                            </div>
                                                        </div>

                                                        {/* Simple Delete Button */}
                                                        {!isEn && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setLangToDelete(lang);
                                                                    setShowDeleteLangModal(true);
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                                                                title={`Delete ${lang.name}`}
                                                            >
                                                                <IoTrashOutline className="text-lg" />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "security" && (
                                <div>
                                    <h2 className="text-base font-semibold text-gray-800 mb-5">Security Settings</h2>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                Current Password
                                            </label>
                                            <input
                                                type="password"
                                                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                placeholder="Enter current password"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                placeholder="Enter new password"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <button className="px-4 py-2 text-sm bg-[#0A84FF] text-white rounded-lg hover:bg-[#005BBB] transition-colors font-semibold">
                                                Update Password
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "register" && (
                                <div>
                                    <h2 className="text-base font-semibold text-gray-800 mb-5">Register New Admin</h2>

                                    {registrationStep === 1 ? (
                                        <form onSubmit={handleSendOTP} className="space-y-5">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    <IoPersonAddOutline className="inline text-base mr-1" />
                                                    Admin Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={registrationData.name}
                                                    onChange={(e) =>
                                                        setRegistrationData({
                                                            ...registrationData,
                                                            name: e.target.value,
                                                        })
                                                    }
                                                    required
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                    placeholder="Enter admin name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    <IoMailOutline className="inline text-base mr-1" />
                                                    Email Address *
                                                </label>
                                                <input
                                                    type="email"
                                                    value={registrationData.email}
                                                    onChange={(e) =>
                                                        setRegistrationData({
                                                            ...registrationData,
                                                            email: e.target.value,
                                                        })
                                                    }
                                                    required
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                    placeholder="Enter email address"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    <IoKeyOutline className="inline text-base mr-1" />
                                                    Password *
                                                </label>
                                                <input
                                                    type="password"
                                                    value={registrationData.password}
                                                    onChange={(e) =>
                                                        setRegistrationData({
                                                            ...registrationData,
                                                            password: e.target.value,
                                                        })
                                                    }
                                                    required
                                                    minLength={6}
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                    placeholder="Enter password (min 6 characters)"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    <IoKeyOutline className="inline text-base mr-1" />
                                                    Confirm Password *
                                                </label>
                                                <input
                                                    type="password"
                                                    value={registrationData.confirmPassword}
                                                    onChange={(e) =>
                                                        setRegistrationData({
                                                            ...registrationData,
                                                            confirmPassword: e.target.value,
                                                        })
                                                    }
                                                    required
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                                    placeholder="Confirm password"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    <IoShieldCheckmarkOutline className="inline text-base mr-1" />
                                                    Designated Role *
                                                </label>
                                                <select
                                                    value={registrationData.role}
                                                    onChange={(e) =>
                                                        setRegistrationData({
                                                            ...registrationData,
                                                            role: e.target.value,
                                                        })
                                                    }
                                                    required
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-white"
                                                >
                                                    <option value="ADMIN">General Admin</option>
                                                    <option value="SUPER_ADMIN">Super Admin (Owner)</option>
                                                    <option value="FINANCE_ADMIN">Finance Admin</option>
                                                    <option value="OPERATIONS_ADMIN">Operations Admin</option>
                                                    <option value="VERIFIER_ADMIN">Expert Verifier Admin</option>
                                                    <option value="SUPPORT_ADMIN">Support Admin</option>
                                                </select>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    This will determine the sections the admin can access.
                                                </p>
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="px-6 py-3 bg-[#0A84FF] text-white rounded-lg hover:bg-[#005BBB] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {loading ? "Sending..." : "Send OTP"}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <form onSubmit={handleRegisterAdmin} className="space-y-5">
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                                <p className="text-sm text-blue-800">
                                                    OTP has been sent to <strong>{registrationData.email}</strong>
                                                </p>
                                                <p className="text-xs text-blue-600 mt-1">
                                                    Please check your email and enter the 6-digit OTP code.
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                    Enter OTP *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={otpData.otp}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                                                        setOtpData({ ...otpData, otp: value });
                                                    }}
                                                    required
                                                    maxLength={6}
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent text-center text-2xl tracking-widest font-mono"
                                                    placeholder="000000"
                                                />
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Enter the 6-digit code sent to your email
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <button
                                                    type="button"
                                                    onClick={handleBackToForm}
                                                    className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                                                >
                                                    Back
                                                </button>
                                                <div className="flex gap-3">
                                                    {otpCountdown > 0 ? (
                                                        <button
                                                            type="button"
                                                            disabled
                                                            className="px-4 py-2 text-sm border border-gray-200 text-gray-400 rounded-lg cursor-not-allowed"
                                                        >
                                                            Resend OTP ({otpCountdown}s)
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={handleResendOTP}
                                                            disabled={loading}
                                                            className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
                                                        >
                                                            Resend OTP
                                                        </button>
                                                    )}
                                                    <button
                                                        type="submit"
                                                        disabled={loading || otpData.otp.length !== 6}
                                                        className="px-6 py-3 bg-[#0A84FF] text-white rounded-lg hover:bg-[#005BBB] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {loading ? "Registering..." : "Register Admin"}
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                </div>
                )}

                {/* Add Language Modal (Pixel-Perfect Alignment & Contained Flow) */}
                {showAddLangModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg border border-emerald-100">
                                        <IoGlobeOutline />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900">Add Language</h3>
                                        <p className="text-xs text-gray-400">Select an Indian language to enable across the platform</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAddLangModal(false)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                    <IoCloseOutline className="text-xl" />
                                </button>
                            </div>

                            {/* Search Input */}
                            <div className="relative">
                                <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="text"
                                    autoFocus
                                    value={presetSearch}
                                    onChange={(e) => setPresetSearch(e.target.value)}
                                    placeholder="Search 22 Indian languages (e.g. Gujarati, Bengali)..."
                                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                                />
                            </div>

                            {/* In-Flow Languages List (Completely Contained, 0 Overflow) */}
                            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 border border-gray-100 rounded-2xl p-1.5 bg-gray-50/50 modal-scrollable-area">
                                {(() => {
                                    const available = INDIAN_LANGUAGES_PRESETS.filter(p => {
                                        const isAlreadyAdded = (langConfig.supportedLanguages || []).some(l => l.code === p.code);
                                        if (isAlreadyAdded) return false;
                                        if (!presetSearch.trim()) return true;
                                        return (
                                            p.name.toLowerCase().includes(presetSearch.toLowerCase()) ||
                                            p.nativeName.toLowerCase().includes(presetSearch.toLowerCase()) ||
                                            p.code.toLowerCase().includes(presetSearch.toLowerCase())
                                        );
                                    });

                                    if (available.length === 0) {
                                        return (
                                            <div className="py-8 text-center text-xs text-gray-400 font-medium">
                                                {presetSearch ? "No matching languages found" : "All available Indian languages are already added!"}
                                            </div>
                                        );
                                    }

                                    return available.map(p => {
                                        const isSelected = newLangForm.code === p.code;

                                        return (
                                            <button
                                                key={p.code}
                                                type="button"
                                                onClick={() => {
                                                    setNewLangForm({
                                                        code: p.code,
                                                        name: p.name,
                                                        nativeName: p.nativeName,
                                                        badge: p.badge
                                                    });
                                                }}
                                                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${isSelected
                                                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-2xs'
                                                    : 'bg-white hover:bg-gray-100/80 border border-gray-200/70 text-gray-700 cursor-pointer shadow-2xs'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center shrink-0 border ${isSelected
                                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                                        : 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 border-blue-100'
                                                        }`}>
                                                        {p.badge}
                                                    </span>
                                                    <div className="truncate">
                                                        <span className="text-xs font-bold block text-gray-900">{p.name}</span>
                                                        <span className="text-[11px] text-gray-500 font-medium">{p.nativeName}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[11px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                                                        {p.code}
                                                    </span>
                                                    {isSelected && (
                                                        <IoCheckmarkOutline className="text-emerald-600 text-base" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    });
                                })()}
                            </div>

                            {/* Footer / Action Form */}
                            <form onSubmit={handleAddLanguageSubmit} className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                                <div className="text-xs text-gray-500 truncate">
                                    {newLangForm.name ? (
                                        <span className="font-semibold text-gray-800">
                                            Selected: <span className="text-emerald-600 font-bold">{newLangForm.name} ({newLangForm.nativeName})</span>
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">Select a language above</span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddLangModal(false)}
                                        className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addingLang || !newLangForm.code}
                                        className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                                    >
                                        {addingLang ? (
                                            <>
                                                <IoRefreshOutline className="animate-spin text-sm" />
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <IoAddOutline className="text-base" />
                                                Add Language
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Language Confirmation Modal */}
                {showDeleteLangModal && langToDelete && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
                            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto text-xl">
                                <IoTrashOutline />
                            </div>
                            <div className="text-center space-y-1">
                                <h3 className="text-base font-bold text-gray-900">Delete {langToDelete.name}?</h3>
                                <p className="text-xs text-gray-500">
                                    Are you sure you want to remove <span className="font-bold text-gray-800">{langToDelete.name} ({langToDelete.nativeName})</span>? This will remove the language from the platform and clear its cached dictionary translations.
                                </p>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteLangModal(false);
                                        setLangToDelete(null);
                                    }}
                                    className="flex-1 px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteLanguage}
                                    disabled={deletingLang}
                                    className="flex-1 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                                >
                                    {deletingLang ? "Deleting..." : "Delete Language"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
