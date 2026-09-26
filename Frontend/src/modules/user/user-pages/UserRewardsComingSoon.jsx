import { useNavigate } from "react-router-dom";
import { 
  IoGiftOutline, 
  IoSparklesOutline, 
  IoWalletOutline, 
  IoPeopleOutline, 
  IoRibbonOutline, 
  IoShieldCheckmarkOutline,
  IoArrowBackOutline,
  IoWaterOutline
} from "react-icons/io5";
import PageContainer from "../../shared/components/PageContainer";

export default function UserRewardsComingSoon() {
  const navigate = useNavigate();

  return (
    <PageContainer title="Rewards & Benefits">
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        {/* Back navigation button */}
        <button
          onClick={() => navigate("/user/dashboard")}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#0A84FF] transition-colors cursor-pointer"
        >
          <IoArrowBackOutline className="text-base" />
          <span>Back to Dashboard</span>
        </button>

        {/* Hero Card */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-rose-500 via-pink-600 to-indigo-700 text-white p-6 sm:p-8 shadow-xl">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-rose-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-white text-xs font-bold">
              <IoRibbonOutline className="text-sm" />
              <span>Available for Verified Experts Only</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-3xl shadow-inner shrink-0">
                <IoGiftOutline className="animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Customer Rewards & Loyalty
                </h1>
                <p className="text-rose-100 text-xs sm:text-sm font-medium mt-1">
                  Exciting loyalty perks and referral benefits are currently in development.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notice Info Banner */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
            <IoSparklesOutline className="text-lg" />
          </div>
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-950">Expert Rewards vs Customer Rewards</p>
            <p className="text-amber-800 leading-relaxed font-medium">
              Performance tiers, machine calibration credits, and survey milestone rewards are active exclusively for verified <span className="font-bold">Groundwater Survey Experts</span>. 
              Our customer rewards program for property owners and farmers is launching soon!
            </p>
          </div>
        </div>

        {/* What's Coming for Customers */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <IoSparklesOutline className="text-rose-500" />
              <span>Upcoming Customer Perks</span>
            </h3>
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 rounded-full border border-rose-200">
              In Development
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Perk 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center text-lg mb-2.5">
                  <IoPeopleOutline />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Referral Discounts</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Recommend Jaladhaara to neighboring farmers or plot owners and receive vouchers for your next survey.
                </p>
              </div>
            </div>

            {/* Perk 2 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg mb-2.5">
                  <IoWalletOutline />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Wallet Cashback</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Earn instant cashback directly credited to your Jaladhaara Wallet on completed surveys.
                </p>
              </div>
            </div>

            {/* Perk 3 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg mb-2.5">
                  <IoShieldCheckmarkOutline />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Priority Seasonal Advisory</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Complimentary follow-up aquifer health alerts and recharge guidance before monsoon seasons.
                </p>
              </div>
            </div>

            {/* Perk 4 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center text-lg mb-2.5">
                  <IoWaterOutline />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Multi-Point Survey Vouchers</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Discounted bundle packages when surveying multiple farmland borewell drilling sites.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Navigation */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/user/wallet")}
            className="flex-1 px-5 py-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
          >
            <IoWalletOutline className="text-base text-emerald-600" />
            <span>Check My Wallet Balance</span>
          </button>

          <button
            onClick={() => navigate("/user/dashboard")}
            className="flex-1 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
