/**
 * Reusable Action Card Component
 * Matches user dashboard action card design
 */
export default function ActionCard({ icon: Icon, label, subtitle, onClick, className = "" }) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-3 rounded-[12px] bg-white p-4 shadow-[0px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_15px_rgba(0,0,0,0.1)] transition-all cursor-pointer active:scale-[0.98] ${className}`}
        >
            <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#0A84FF] to-[#00C2A8] flex items-center justify-center flex-shrink-0">
                <Icon className="text-xl text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-800 mb-0.5">{label}</h3>
                {subtitle && <p className="text-xs text-[#4A4A4A]">{subtitle}</p>}
            </div>
        </div>
    );
}

