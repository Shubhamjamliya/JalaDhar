import { useState, useEffect } from "react";
import {
  IoCashOutline,
  IoCloseOutline,
  IoCopyOutline,
  IoCheckmarkOutline,
  IoCheckmarkCircleOutline,
  IoQrCodeOutline,
  IoCardOutline,
  IoInformationCircleOutline
} from "react-icons/io5";

export default function ProcessDisbursalModal({
  isOpen,
  onClose,
  onConfirm,
  request,
  processing = false,
  isUser = false
}) {
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState("");

  useEffect(() => {
    if (isOpen && request) {
      const defaultMethod = request.payoutType === "BANK_TRANSFER" ? "BANK_TRANSFER" : "UPI";
      setPaymentMethod(defaultMethod);
      setTransactionId("");
      setNotes("");
      setError("");
      setCopiedKey("");
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  const MAX_UTR_LENGTH = 22;
  const MIN_UTR_LENGTH = 8;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanId = transactionId.trim();
    if (!cleanId) {
      setError("Please enter the UTR / Transaction Reference ID from your bank or payment gateway.");
      return;
    }
    if (cleanId.length < MIN_UTR_LENGTH) {
      setError(`Transaction Reference ID is too short (must be between ${MIN_UTR_LENGTH} and ${MAX_UTR_LENGTH} characters).`);
      return;
    }
    if (cleanId.length > MAX_UTR_LENGTH) {
      setError(`Transaction Reference ID cannot exceed ${MAX_UTR_LENGTH} characters.`);
      return;
    }
    setError("");
    onConfirm({
      transactionId: cleanId,
      paymentMethod,
      notes: notes.trim(),
      paymentDate: new Date().toISOString()
    });
  };

  const formatAmount = (val) => new Intl.NumberFormat("en-IN").format(val || 0);

  const beneficiaryName = isUser ? request.userName : request.vendorName;
  const beneficiaryContact = isUser
    ? (request.userPhone || request.userEmail)
    : (request.vendorPhone || request.vendorEmail);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-outfit overflow-y-auto">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full p-6 sm:p-7 my-8 transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shrink-0 shadow-xs">
              <IoCashOutline />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                {isUser ? "Process Customer Refund Payout" : "Process Expert Disbursal Payout"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Record transaction details to mark this request as settled and debit the wallet.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <IoCloseOutline className="text-2xl" />
          </button>
        </div>

        {/* Beneficiary & Payout Details Card */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Beneficiary Details
              </p>
              <p className="text-sm font-black text-slate-800 mt-0.5">
                {beneficiaryName || "Account Holder"}
                {beneficiaryContact && (
                  <span className="text-xs font-normal text-slate-500 ml-1.5">({beneficiaryContact})</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Disbursal Amount
              </p>
              <p className="text-xl font-black text-emerald-600 font-mono">
                ₹{formatAmount(request.amount)}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/60">
            {request.payoutType === "UPI" || request.upiId ? (
              <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <IoQrCodeOutline className="text-blue-500 text-lg shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">UPI ID</p>
                    <p className="text-xs font-black text-slate-800 font-mono truncate mt-0.5">
                      {request.upiId || "N/A"}
                    </p>
                  </div>
                </div>
                {request.upiId && (
                  <button
                    type="button"
                    onClick={() => handleCopy(request.upiId, "upi")}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedKey === "upi" ? (
                      <>
                        <IoCheckmarkOutline className="text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <IoCopyOutline />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <IoCardOutline className="text-blue-500 text-lg shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Account Number</p>
                      <p className="text-xs font-black text-slate-800 font-mono truncate mt-0.5">
                        {request.accountDetails?.accountNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                  {request.accountDetails?.accountNumber && (
                    <button
                      type="button"
                      onClick={() => handleCopy(request.accountDetails.accountNumber, "acc")}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                    >
                      {copiedKey === "acc" ? (
                        <>
                          <IoCheckmarkOutline className="text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <IoCopyOutline />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">IFSC Code</p>
                    <p className="text-xs font-black text-slate-800 font-mono mt-0.5">
                      {request.accountDetails?.ifscCode || "N/A"}
                    </p>
                  </div>
                  {request.accountDetails?.ifscCode && (
                    <button
                      type="button"
                      onClick={() => handleCopy(request.accountDetails.ifscCode, "ifsc")}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                    >
                      {copiedKey === "ifsc" ? (
                        <>
                          <IoCheckmarkOutline className="text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <IoCopyOutline />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payout Entry Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Mode
            </label>
            <div className="grid grid-cols-4 gap-2">
              {["UPI", "IMPS", "NEFT", "RAZORPAY"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMethod(mode)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === mode
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction / UTR ID */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Bank UTR / Transaction Reference ID <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md transition-colors ${
                  transactionId.length === MAX_UTR_LENGTH
                    ? "bg-amber-100 text-amber-800"
                    : transactionId.length >= MIN_UTR_LENGTH
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {transactionId.length} / {MAX_UTR_LENGTH}
              </span>
            </div>
            <input
              type="text"
              autoFocus
              maxLength={MAX_UTR_LENGTH}
              value={transactionId}
              onChange={(e) => {
                const cleaned = e.target.value
                  .replace(/[^a-zA-Z0-9/_-]/g, "")
                  .slice(0, MAX_UTR_LENGTH)
                  .toUpperCase();
                setTransactionId(cleaned);
                if (error) setError("");
              }}
              placeholder="e.g. 523910293128 or UTR98234721"
              className={`w-full px-3.5 py-2.5 text-xs font-mono font-semibold rounded-xl border transition-all tracking-wider focus:outline-none focus:ring-2 ${
                error
                  ? "border-rose-300 ring-2 ring-rose-100 bg-rose-50/20"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
              }`}
            />
            {error ? (
              <p className="text-[11px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                <IoInformationCircleOutline className="text-xs shrink-0" />
                {error}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                Standard Bank UTR / UPI RRN is 12 to 22 characters (Min 8, Max 22).
              </p>
            )}
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
              Internal Remarks (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via corporate current account..."
              className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {processing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <IoCheckmarkCircleOutline className="text-base" />
                  <span>Confirm Disbursal (₹{formatAmount(request.amount)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
