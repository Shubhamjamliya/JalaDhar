import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    IoDocumentTextOutline,
    IoShieldCheckmarkOutline,
    IoLockClosedOutline,
    IoMedkitOutline,
    IoCheckmarkCircle,
    IoChevronBackOutline,
    IoInformationCircleOutline,
    IoBulbOutline,
    IoChevronDownOutline,
    IoChevronUpOutline
} from "react-icons/io5";
import { VENDOR_EXPERT_FAQS } from "./VendorHelpSupport";

export default function VendorPolicyPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    // Determine initial active tab based on path
    const getTabFromPath = (pathname) => {
        if (pathname.includes("/privacy")) return "privacy";
        if (pathname.includes("/terms")) return "terms";
        if (pathname.includes("/insurance")) return "insurance";
        if (pathname.includes("/faqs") || pathname.includes("/help")) return "faqs";
        return "agreement"; // default to agreement
    };

    const [activeTab, setActiveTab] = useState(getTabFromPath(location.pathname));

    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
        navigate(`/vendor/${tabKey}`);
    };

    const tabs = [
        { id: "agreement", label: "Expert Agreement", icon: IoDocumentTextOutline },
        { id: "privacy", label: "Privacy Policy", icon: IoShieldCheckmarkOutline },
        { id: "terms", label: "Terms & Conditions", icon: IoLockClosedOutline },
        { id: "insurance", label: "Insurance Details", icon: IoMedkitOutline },
        { id: "faqs", label: "Expert FAQs", icon: IoBulbOutline },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            {/* Header Title */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span>Legal &amp; Policy Center</span>
                        <span className="text-[10px] font-extrabold bg-blue-100 text-[#0A84FF] px-2.5 py-0.5 rounded-full border border-blue-200">
                            Partner Standards
                        </span>
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Official terms, policies, and operational agreements for Jaladhaara Expert Partners
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                                isActive
                                    ? "bg-white text-[#0A84FF] shadow-xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                            }`}
                        >
                            <Icon className="text-base" />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content Box */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                {activeTab === "agreement" && (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <IoDocumentTextOutline className="text-[#0A84FF] text-xl" />
                                <span>Expert Partner Agreement</span>
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                Code of conduct, field operations, and service obligations for hydrogeology partners
                            </p>
                        </div>

                        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                            <section className="space-y-1.5">
                                <h3 className="font-bold text-slate-800 text-sm">1. Scope of Engagement</h3>
                                <p>
                                    As an Expert Partner on the Jaladhaara platform, you act as an independent geoscientific consultant providing hydrogeological field surveys, VES readings, and digital report compilation for client sites.
                                </p>
                            </section>

                            <section className="space-y-1.5">
                                <h3 className="font-bold text-slate-800 text-sm">2. Scientific Integrity &amp; Equipment Standards</h3>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Experts agree to utilize calibrated geoscientific instruments (resistivity meters, VES setups, satellite data interpretation tools).</li>
                                    <li>Surveys must adhere to standard geological methodology and objective field observations.</li>
                                    <li>Report recommendations must accurately reflect electrical sounding curves, rock formation data, and local aquifer characteristics.</li>
                                </ul>
                            </section>

                            <section className="space-y-1.5">
                                <h3 className="font-bold text-slate-800 text-sm">3. Payouts, Commissions &amp; Tax Compliance</h3>
                                <p>
                                    Payouts are credited directly to your registered Jaladhaara Wallet upon client survey completion and digital report approval. Applicable platform facilitation fees and statutory GST/TDS deductions will be itemized on your payout invoices.
                                </p>
                            </section>

                            <section className="space-y-1.5">
                                <h3 className="font-bold text-slate-800 text-sm">4. Professional Ethics &amp; Confidentiality</h3>
                                <p>
                                    Experts must maintain professionalism during client interactions, respect land boundaries, and protect client contact privacy. Solicitations outside the Jaladhaara platform are strictly prohibited.
                                </p>
                            </section>
                        </div>
                    </div>
                )}

                {activeTab === "privacy" && (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <IoShieldCheckmarkOutline className="text-emerald-600 text-xl" />
                                <span>Expert Partner Privacy Policy</span>
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                How Jaladhaara collects, protects, and handles your professional and personal data
                            </p>
                        </div>

                        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                            <section className="space-y-1.5">
                                <h3 className="font-bold text-slate-800 text-sm">1. Data Collection &amp; Identity Verification</h3>
                                <p>
                                    We collect professional verification data including educational degrees, geological experience credentials, identity proof (Aadhaar/PAN), and banking payout details to verify your expert profile.
                                </p>
                            </section>

                            <section className="space-y-1.5">
                                <h3 className="font-bold text-slate-800 text-sm">2. Location &amp; Dispatch Processing</h3>
                                <p>
                                    Location coordinates are accessed strictly while using the application to pair you with nearby survey requests and provide navigational routing to land sites.
                                </p>
                            </section>

                            <section className="space-y-1.5">
                                <h3 className="font-bold text-slate-800 text-sm">3. Data Confidentiality &amp; Security</h3>
                                <p>
                                    Your personal identity documents and banking credentials are encrypted using industry-standard AES-256 protocols. We do not sell or monetize expert partner data to third-party advertisers.
                                </p>
                            </section>
                        </div>
                    </div>
                )}

                {activeTab === "terms" && (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <IoLockClosedOutline className="text-indigo-600 text-xl" />
                                <span>General Terms &amp; Conditions</span>
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                Platform usage terms, geological liability limits, and platform rules
                            </p>
                        </div>

                        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                            <section className="space-y-1.5">
                                <h3 className="font-bold text-slate-800 text-sm">1. Platform Nature</h3>
                                <p>
                                    Jaladhaara Hydrogeological Services Pvt. Ltd. operates as an e-commerce marketplace platform under Section 9(5) / Section 52 of the CGST Act. The platform facilitates direct connections between landowners and hydrogeologists.
                                </p>
                            </section>

                            <section className="space-y-1.5">
                                <h3 className="font-bold text-slate-800 text-sm">2. Geological &amp; Drilling Limitation of Liability</h3>
                                <p>
                                    Groundwater survey reports represent scientific interpretation based on geophysical instruments and field readings. Groundwater yield, borewell depth, and drilling success depend on dynamic natural geological factors and cannot be guaranteed with 100% certainty.
                                </p>
                            </section>

                            <section className="space-y-1.5">
                                <h3 className="font-bold text-slate-800 text-sm">3. Cancellations &amp; Disputes</h3>
                                <p>
                                    Dispute claims arising from site access issues, inclement weather, or report revisions are managed through the Jaladhaara Partner Dispute Resolution Desk in accordance with standard platform SLAs.
                                </p>
                            </section>
                        </div>
                    </div>
                )}

                {activeTab === "insurance" && (
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                                <IoMedkitOutline className="text-rose-600 text-2xl" />
                                <span>Insurance &amp; Safety Guidelines</span>
                            </h2>
                            <p className="text-xs text-slate-500 font-semibold mt-1">
                                Booking-linked insurance and field safety for experts
                            </p>
                        </div>

                        <div className="space-y-5 text-xs text-slate-600 leading-relaxed font-medium">
                            <section className="space-y-1.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
                                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-[#0A84FF] text-xs flex items-center justify-center font-extrabold shrink-0">1</span>
                                    <span>1. Booking-Linked Insurance</span>
                                </h3>
                                <p className="pl-8 text-slate-600">
                                    Insurance coverage is applicable to every confirmed Jaladhaara survey booking, subject to the terms and conditions of the applicable insurance policy.
                                </p>
                                <p className="pl-8 text-slate-600">
                                    Coverage starts from the scheduled commencement of the survey and ends upon completion of the scheduled survey, or at the end of the applicable coverage period specified by the insurer, as applicable.
                                </p>
                            </section>

                            <section className="space-y-1.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
                                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs flex items-center justify-center font-extrabold shrink-0">2</span>
                                    <span>2. Coverage</span>
                                </h3>
                                <p className="pl-8 text-slate-600">
                                    Depending on the applicable policy, coverage may include accidental injury, medical expenses, accidental death/disability, or other specified risks.
                                </p>
                            </section>

                            <section className="space-y-1.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
                                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center font-extrabold shrink-0">3</span>
                                    <span>3. Field Safety</span>
                                </h3>
                                <p className="pl-8 text-slate-600">
                                    Experts must follow reasonable safety precautions while conducting surveys, particularly at agricultural, rocky, remote, construction, industrial, or other hazardous sites.
                                </p>
                                <p className="pl-8 text-slate-600">
                                    Experts should avoid field operations during lightning, thunderstorms, flooding, or other unsafe conditions.
                                </p>
                            </section>

                            <section className="space-y-1.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
                                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center font-extrabold shrink-0">4</span>
                                    <span>4. Equipment &amp; Property</span>
                                </h3>
                                <p className="pl-8 text-slate-600">
                                    Experts are responsible for the safe handling, transportation, and protection of their survey equipment.
                                </p>
                                <p className="pl-8 text-slate-600">
                                    Booking-linked insurance does not cover equipment unless specifically stated in the applicable insurance policy.
                                </p>
                                <p className="pl-8 text-slate-600">
                                    Experts must also take reasonable care to prevent injury or damage to customers, landowners, workers, livestock, vehicles, and property.
                                </p>
                            </section>

                            <section className="space-y-1.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
                                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-xs flex items-center justify-center font-extrabold shrink-0">5</span>
                                    <span>5. Accidents &amp; Incidents</span>
                                </h3>
                                <p className="pl-8 text-slate-600">
                                    Any accident, injury, property damage, or other serious incident during a confirmed survey booking must be reported to Jaladhaara through the app or support channel as soon as possible.
                                </p>
                                <p className="pl-8 text-slate-600">
                                    Where applicable, Jaladhaara will facilitate communication with the insurance provider.
                                </p>
                            </section>

                            <section className="space-y-1.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
                                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs flex items-center justify-center font-extrabold shrink-0">6</span>
                                    <span>6. Insurance Claims</span>
                                </h3>
                                <p className="pl-8 text-slate-600">
                                    Insurance claims are processed and settled by the insurance provider according to the applicable policy terms, conditions, and exclusions.
                                </p>
                            </section>

                            <div className="p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl text-xs text-slate-700 font-medium leading-relaxed mt-6">
                                <p className="font-black text-slate-900 mb-1">Disclaimer</p>
                                Jaladhaara facilitates booking-linked insurance through a licensed insurance provider and is not the insurer, underwriter, or claims decision-maker. Insurance coverage, eligibility, exclusions, claim assessment, approval, and settlement are governed solely by the applicable insurance policy and the insurer’s terms and conditions.
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 5: Expert FAQs */}
                {activeTab === "faqs" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Groundwater Survey FAQs – Expert App</h2>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Official survey assessment guidelines, report requirements, and partner standards
                                </p>
                            </div>
                            <span className="text-[10px] font-extrabold bg-blue-50 text-[#0A84FF] px-2.5 py-1 rounded-full border border-blue-200 shrink-0">
                                10 Official FAQs
                            </span>
                        </div>

                        <div className="space-y-3">
                            {VENDOR_EXPERT_FAQS.map((faq, idx) => {
                                const isOpen = openFaq === idx;
                                return (
                                    <div
                                        key={idx}
                                        className={`border rounded-2xl transition-all overflow-hidden ${
                                            isOpen
                                                ? "border-slate-300 shadow-2xs bg-slate-50/40"
                                                : "border-slate-200/80 hover:border-slate-300 bg-white"
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleFaq(idx)}
                                            className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-800 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                                        >
                                            <span className="leading-snug text-slate-900 font-extrabold">
                                                Q{idx + 1}. {faq.q}
                                            </span>
                                            <div className="p-1 rounded-full text-slate-400 shrink-0">
                                                {isOpen ? (
                                                    <IoChevronUpOutline className="text-base text-slate-600" />
                                                ) : (
                                                    <IoChevronDownOutline className="text-base" />
                                                )}
                                            </div>
                                        </button>

                                        {isOpen && (
                                            <div className="px-4 pb-4 pt-1 text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-100 bg-white">
                                                {faq.a}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-slate-500 font-medium">
                    Questions about policies? Contact <span className="font-bold text-slate-700">info@jaladhaaraapp.com</span>
                </p>
                <button
                    onClick={() => navigate("/vendor/dashboard")}
                    className="px-5 py-2 bg-[#0A84FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
}
