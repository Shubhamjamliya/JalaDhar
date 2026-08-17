import { useEffect } from "react";

/**
 * Reusable Page Container Component
 * Provides consistent layout and styling for all pages and guarantees scroll reset to top.
 */
export default function PageContainer({ children, className = "" }) {
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, []);

    return (
        <div className={`w-full max-w-7xl mx-auto ${className}`}>
            {children}
        </div>
    );
}

