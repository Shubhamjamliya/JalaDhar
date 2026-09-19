import { useState, useEffect } from 'react';

/**
 * Central Hook to detect mobile virtual keyboard visibility.
 * Works seamlessly across Android Chrome, iOS Safari, Samsung Internet, and WebViews.
 * 
 * Sets html[data-keyboard-open="true"] on the root document for instant CSS-level hiding,
 * and returns `isKeyboardOpen` boolean for React components.
 */
export function useVirtualKeyboard() {
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        // Only run in browser environment
        if (typeof window === 'undefined') return;

        // Baseline dimensions before keyboard appears
        let initialHeight = window.innerHeight;
        let initialWidth = window.innerWidth;

        const updateState = (open) => {
            setIsKeyboardOpen(open);
            if (open) {
                document.documentElement.setAttribute('data-keyboard-open', 'true');
            } else {
                document.documentElement.removeAttribute('data-keyboard-open');
            }
        };

        const checkKeyboard = () => {
            // Handle screen rotation / orientation change
            if (window.innerWidth !== initialWidth) {
                initialWidth = window.innerWidth;
                initialHeight = window.innerHeight;
                updateState(false);
                return;
            }

            const currentVisualHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            
            // Significant height reduction (typically > 140px on smartphones)
            const heightShrunk = (initialHeight - currentVisualHeight > 140) || (currentVisualHeight < initialHeight * 0.78);

            // Active element check
            const active = document.activeElement;
            const isInput = active && (
                active.tagName === 'INPUT' ||
                active.tagName === 'TEXTAREA' ||
                active.isContentEditable
            ) && active.type !== 'checkbox' && active.type !== 'radio' && active.type !== 'submit' && active.type !== 'button';

            updateState(Boolean(heightShrunk || isInput));
        };

        // Instant response on input focus
        const handleFocusIn = (e) => {
            const target = e.target;
            if (target && (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) && target.type !== 'checkbox' && target.type !== 'radio' && target.type !== 'submit' && target.type !== 'button') {
                updateState(true);
            }
        };

        // Debounced response on blur to avoid flickering when switching fields
        const handleFocusOut = () => {
            setTimeout(() => {
                const active = document.activeElement;
                const isStillInput = active && (
                    active.tagName === 'INPUT' ||
                    active.tagName === 'TEXTAREA' ||
                    active.isContentEditable
                );
                if (!isStillInput) {
                    const currentVisualHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
                    const heightShrunk = (initialHeight - currentVisualHeight > 140) || (currentVisualHeight < initialHeight * 0.78);
                    updateState(Boolean(heightShrunk));
                }
            }, 120);
        };

        const vv = window.visualViewport;
        if (vv) {
            vv.addEventListener('resize', checkKeyboard);
        }
        window.addEventListener('resize', checkKeyboard);
        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('focusout', handleFocusOut);

        return () => {
            if (vv) {
                vv.removeEventListener('resize', checkKeyboard);
            }
            window.removeEventListener('resize', checkKeyboard);
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('focusout', handleFocusOut);
            document.documentElement.removeAttribute('data-keyboard-open');
        };
    }, []);

    return isKeyboardOpen;
}

export default useVirtualKeyboard;
