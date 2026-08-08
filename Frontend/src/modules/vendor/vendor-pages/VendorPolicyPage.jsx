import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    IoDocumentTextOutline,
    IoShieldCheckmarkOutline,
    IoLockClosedOutline,
    IoMedkitOutline,
    IoCheckmarkCircle,
    IoChevronBackOutline,
    IoInformationCircleOutline
} from "react-icons/io5";

export default function VendorPolicyPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // Determine initial active tab based on path
    const getTabFromPath = (pathname) => {
        if (pathname.includes("/privacy")) return "privacy";
        if (pathname.includes("/terms")) return "terms";
        if (pathname.includes("/insurance")) return "insurance";
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
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <IoMedkitOutline className="text-rose-600 text-xl" />
                                <span>Insurance &amp; Safety Guidelines</span>
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                Safety standards, equipment protection, and field incident protocols
                            </p>
                        </div>

                        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                            <section className="space-y-1.5">
                                <h3 className="font-bold text-slate-800 text-sm">1. Field Safety Standards</h3>
                                <p>
                                    Experts are advised to follow standard safety precautions while conducting surveys on agricultural, rocky, or remote field terrains. Avoid conducting electrical sounding during active thunderstorm activity.
                                </p>
                            </section>

                            <section className="space-y-1.5">
                                <h3 className="font-bold text-slate-800 text-sm">2. Instrument Protection &amp; Third-Party Liability</h3>
                                <p>
                                    Experts are responsible for securing transit insurance for specialized geophysical testing equipment. Jaladhaara provides partner support for emergency field assistance and location dispatch logs.
                                </p>
                            </section>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-slate-500 font-medium">
                    Questions about policies? Contact <span className="font-bold text-slate-700">support@jaladhaaraapp.in</span>
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
