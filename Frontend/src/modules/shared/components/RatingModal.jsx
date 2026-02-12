import { useState } from 'react';
import { IoCloseOutline, IoStar, IoStarOutline } from "react-icons/io5";

export default function RatingModal({ isOpen, onClose, onSubmit, vendorName, initialData }) {
  const [ratingData, setRatingData] = useState(initialData || {
    accuracy: 0,
    professionalism: 0,
    behavior: 0,
    visitTiming: 0,
    review: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit(ratingData);
    setSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">Rate Experience</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
            <IoCloseOutline className="text-2xl text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <p className="text-center text-gray-600 text-sm">How was your experience with <strong>{vendorName}</strong>?</p>
          {[{ key: "accuracy", label: "Accuracy" }, { key: "professionalism", label: "Professionalism" }, { key: "behavior", label: "Behavior" }, { key: "visitTiming", label: "Visit Timing" }].map(cat => (
            <div key={cat.key} className="text-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">{cat.label}</label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setRatingData({ ...ratingData, [cat.key]: star })} className="text-3xl focus:outline-none transition-transform active:scale-90 hover:scale-110">
                    {ratingData[cat.key] >= star ? <IoStar className="text-yellow-400" /> : <IoStarOutline className="text-gray-300" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <textarea
            value={ratingData.review}
            onChange={e => setRatingData({ ...ratingData, review: e.target.value })}
            placeholder="Share additional feedback..."
            className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] min-h-[100px]"
          ></textarea>
          <button onClick={handleSubmit} disabled={submitting} className="w-full bg-[#0A84FF] text-white py-3.5 rounded-xl font-bold hover:bg-[#005BBB] transition-all disabled:opacity-70">
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
