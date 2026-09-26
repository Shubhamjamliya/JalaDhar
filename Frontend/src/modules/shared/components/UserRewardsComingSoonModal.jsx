import { IoCloseOutline, IoGiftOutline, IoSparklesOutline, IoWalletOutline, IoPeopleOutline, IoRibbonOutline, IoShieldCheckmarkOutline } from "react-icons/io5";

export default function UserRewardsComingSoonModal({ isOpen, onClose, onGoToWallet }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Gradient Banner */}
        <div className="relative h-28 bg-gradient-to-br from-rose-500 via-pink-600 to-indigo-700 p-6 flex items-start justify-between">
          {/* Subtle geometric circles */}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-rose-400/20 rounded-full blur-lg pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-white text-[11px] font-bold shadow-xs">
            <IoRibbonOutline className="text-sm" />
            <span>Currently for Experts Only</span>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/35 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
            aria-label="Close"
          >
            <IoCloseOutline className="text-xl" />
          </button>
        </div>

        {/* Floating Icon */}
        <div className="relative px-6">
          <div className="-mt-10 mb-4 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-xl shadow-rose-500/30 border-4 border-white">
            <IoGiftOutline className="text-4xl animate-pulse" />
          </div>
        </div>

        {/* Modal Content */}
        <div className="px-6 pb-6 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Rewards & Benefits
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 rounded-full border border-rose-200">
                Coming Soon
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
              Reward tiers and milestone earnings are currently active exclusively for verified <span className="font-semibold text-slate-700">Groundwater Survey Experts</span>. We are actively tailoring exclusive perks for property owners and farmers!
            </p>
          </div>

          {/* Feature Preview Cards */}
          <div className="space-y-2.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <IoSparklesOutline className="text-rose-500 text-sm" />
              <span>Upcoming Customer Perks</span>
            </div>

            <div className="space-y-2">
              {/* Perk 1 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 text-base font-bold">
                  <IoPeopleOutline />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-800">Referral Discounts</h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Invite neighboring farmers or plot owners and earn survey fee vouchers.
                  </p>
                </div>
              </div>

              {/* Perk 2 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 text-base font-bold">
                  <IoWalletOutline />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-800">Wallet Cashback</h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Receive instant cashback credited directly to your Jaladhaara Wallet.
                  </p>
                </div>
              </div>

              {/* Perk 3 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-base font-bold">
                  <IoShieldCheckmarkOutline />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-800">Priority Seasonal Advisory</h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Complimentary follow-up aquifer health alerts and recharge guidance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            {onGoToWallet && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToWallet();
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <IoWalletOutline className="text-base text-emerald-600" />
                <span>Go to My Wallet</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center"
            >
              Got it, Thanks!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
