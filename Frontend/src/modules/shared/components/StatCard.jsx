/**
 * Reusable Stat Card Component
 */
export default function StatCard({ label, value, className = "" }) {
    return (
        <div className={`bg-white rounded-[12px] p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] ${className}`}>
            <p className="text-[#4A4A4A] text-xs mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    );
}

