import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop Component
 * Ensures every page view starts from top (0, 0) upon route change.
 */
export default function ScrollToTop() {
    const { pathname, search, hash } = useLocation();

    useEffect(() => {
        if (hash) {
            const element = document.getElementById(hash.replace("#", ""));
            if (element) {
                element.scrollIntoView({ behavior: "smooth" });
                return;
            }
        }

        // Reset window and document scroll immediately
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant"
        });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Reset scroll for any main wrapper element
        const mainElement = document.querySelector("main");
        if (mainElement) {
            mainElement.scrollTop = 0;
        }
    }, [pathname, search, hash]);

    return null;
}
