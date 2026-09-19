import { useEffect } from "react";
import { usePullToRefresh } from "../../../hooks/usePullToRefresh";
import { IoRefreshOutline } from "react-icons/io5";

/**
 * Reusable Page Container Component
 * Provides consistent layout, guarantees scroll room on short/single-item pages,
 * and seamlessly supports optional native app-like pull-to-refresh without header stretching.
 */
export default function PageContainer({
    children,
    className = "",
    onRefresh = null,
    refreshDisabled = false,
    title = null
}) {
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, []);

    const { isRefreshing, pullDistance, containerRef } = usePullToRefresh(
        onRefresh || (() => {}),
        { disabled: !onRefresh || refreshDisabled, threshold: 65 }
    );

    return (
        <div
            ref={containerRef}
            className={`w-full max-w-7xl mx-auto min-h-[calc(100dvh+2px)] relative ${className}`}
        >
            {/* Custom App-Branded Pull-to-Refresh Indicator */}
            {onRefresh && (pullDistance > 0 || isRefreshing) && (
                <div
                    className="fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-150 pointer-events-none"
                    style={{
                        top: `calc(var(--vendor-header-height, var(--user-header-height, 60px)) + ${Math.min(pullDistance * 0.55, 36)}px)`,
                        opacity: Math.min(pullDistance / 30, 1),
                        transform: `translate(-50%, 0) scale(${Math.min(0.75 + (pullDistance / 70) * 0.25, 1)})`
                    }}
                >
                    <div className="bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full shadow-[0_8px_25px_rgba(10,132,255,0.2)] border border-blue-100 flex items-center gap-2 text-xs font-bold text-[#0A84FF]">
                        <IoRefreshOutline
                            className={`text-base ${isRefreshing ? "animate-spin" : ""}`}
                            style={{ transform: isRefreshing ? undefined : `rotate(${pullDistance * 5}deg)` }}
                        />
                        <span>
                            {isRefreshing ? "Refreshing..." : pullDistance >= 65 ? "Release to refresh" : "Pull to refresh"}
                        </span>
                    </div>
                </div>
            )}

            {children}
        </div>
    );
}
