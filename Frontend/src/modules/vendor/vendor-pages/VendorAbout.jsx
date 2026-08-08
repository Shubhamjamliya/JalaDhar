import { useNavigate } from "react-router-dom";
import {
    IoInformationCircleOutline,
    IoCheckmarkCircle,
    IoShieldCheckmarkOutline,
    IoBriefcaseOutline,
    IoWalletOutline,
    IoDocumentTextOutline,
    IoHelpBuoyOutline,
    IoChevronBackOutline,
    IoStarOutline,
    IoGlobeOutline,
    IoSparkles,
    IoCallOutline,
    IoMailOutline
} from "react-icons/io5";
import logo from "@/assets/Header-logoo.png";

export default function VendorAbout() {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            {/* Top Navigation Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span>About Jaladhaara</span>
                        <span className="text-[10px] font-extrabold bg-blue-100 text-[#0A84FF] px-2.5 py-0.5 rounded-full border border-blue-200">
                            Expert Ecosystem
                        </span>
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                        India's 1st Hydrogeological &amp; Groundwater Survey Partner Network
                    </p>
                </div>
            </div>

            {/* Main Hero Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-3 shadow-2xl shrink-0 flex items-center justify-center border-2 border-white/20">
                        <img src={logo} alt="Jaladhaara" className="w-full h-full object-contain" />
                    </div>

                    <div className="flex-1 space-y-3">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold backdrop-blur-md">
                            <IoSparkles className="text-amber-400" />
                            <span>Empowering Geoscientists & Survey Experts</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                            Connecting Grounded Science with Landowners Across India
                        </h2>
                        <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl">
                            Jaladhaara is India's dedicated groundwater exploration e-commerce platform. We empower hydrogeologists, geophysicists, and water exploration experts with digital booking tools, automated payout management, field survey reporting software, and direct client access.
                        </p>
                    </div>
                </div>
            </div>

            {/* Core Value Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A84FF] flex items-center justify-center text-xl font-bold">
                        <IoBriefcaseOutline />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Verified Booking Flow</h3>
                    <p className="text-xs text-slate-500 font-medium leading-normal">
                        Receive verified client requests in your service areas with transparent location parameters and site details.
                    </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
                        <IoWalletOutline />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Protected Wallet & Settlements</h3>
                    <p className="text-xs text-slate-500 font-medium leading-normal">
                        Guaranteed payouts upon survey report upload with full visibility into platform fees and final settlements.
                    </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold">
                        <IoDocumentTextOutline />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Digital Field Survey Reports</h3>
                    <p className="text-xs text-slate-500 font-medium leading-normal">
                        Upload VES curves, aquifer depth findings, and yield estimations directly into standardized digital PDFs.
                    </p>
                </div>
            </div>

            {/* Detailed Platform Capabilities */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <IoShieldCheckmarkOutline className="text-[#0A84FF]" />
                        <span>Platform Standards for Expert Partners</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        High benchmarks designed to elevate expert credibility and client trust
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100/80">
                        <IoCheckmarkCircle className="text-teal-600 text-lg shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-xs font-bold text-slate-800">Equipment Integrity & Calibration</h4>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                Experts utilize calibrated vertical electrical sounding (VES), resistivity meters, or satellite data interpretation instruments.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100/80">
                        <IoCheckmarkCircle className="text-teal-600 text-lg shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-xs font-bold text-slate-800">Fair Dispute Resolution Protocol</h4>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                Dedicated partner dispute desk ensures fair review of client feedback, cancellation claims, or scope adjustments.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100/80">
                        <IoCheckmarkCircle className="text-teal-600 text-lg shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-xs font-bold text-slate-800">Pan-India Network Standard</h4>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                Expanding coverage across agricultural belts, industrial zones, urban developments, and rural watersheds.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Legal Company Information & Disclaimer */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                    <div>
                        <h4 className="text-sm font-black text-slate-800">Jaladhaara Hydrogeological Services Pvt. Ltd.</h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Official Platform Operator &amp; E-Commerce Marketplace Provider
                        </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                        App Version 1.4.0 (Enterprise)
                    </span>
                </div>

                <div className="p-3.5 bg-amber-50/80 border border-amber-200/70 rounded-2xl text-xs text-slate-600 font-medium leading-relaxed">
                    <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <IoInformationCircleOutline className="text-amber-600 text-base" />
                        <span>Hydrogeological Survey Disclaimer:</span>
                    </p>
                    Groundwater survey interpretations and drilling recommendations provided by experts are based on geophysical observations, local hydrogeology, and field measurements. Groundwater yield and borewell success depend on natural aquifer characteristics and cannot be guaranteed with 100% absolute certainty.
                </div>
            </div>

            {/* Bottom Quick Links / Contact Support */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                    <button
                        onClick={() => navigate("/vendor/disputes")}
                        className="hover:text-[#0A84FF] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                        <IoHelpBuoyOutline className="text-base text-slate-400" />
                        <span>Partner Support</span>
                    </button>
                    <span>•</span>
                    <button
                        onClick={() => navigate("/vendor/agreement")}
                        className="hover:text-[#0A84FF] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                        <IoDocumentTextOutline className="text-base text-slate-400" />
                        <span>Terms &amp; Policies</span>
                    </button>
                </div>

                <button
                    onClick={() => navigate("/vendor/dashboard")}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#0A84FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer text-center"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
}
