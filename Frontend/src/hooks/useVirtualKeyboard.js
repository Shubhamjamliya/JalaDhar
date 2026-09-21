import { useState, useEffect } from 'react';

/**
 * Central Hook to detect mobile virtual keyboard visibility.
 * Uses a robust multi-tiered strategy:
 * 1. window.visualViewport API (modern Chromium, Safari iOS 13+, Edge)
 * 2. Focus tracking on editable text inputs / textareas on touch devices
 * 3. navigator.virtualKeyboard API (Chromium)
 * 4. Window innerHeight shrinkage fallback
 * 
 * Synchronizes 'keyboard-open' class on document.body and
 * 'data-keyboard-open="true"' on document.documentElement for instant CSS-level suppression,
 * and returns `isKeyboardOpen` boolean for React components.
 */
export function useVirtualKeyboard() {
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        // Only run in browser environment
        if (typeof window === 'undefined') return;

        const isTouchDevice =
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

        // Baseline dimensions before keyboard appears
        let initialHeight = window.innerHeight;
        let initialWidth = window.innerWidth;

        const updateState = (open) => {
            setIsKeyboardOpen(open);
            if (open) {
                document.documentElement.setAttribute('data-keyboard-open', 'true');
                if (document.body) {
                    document.body.classList.add('keyboard-open');
                }
            } else {
                document.documentElement.removeAttribute('data-keyboard-open');
                if (document.body) {
                    document.body.classList.remove('keyboard-open');
                }
            }
        };

        const isTextInput = (element) => {
            if (!element) return false;
            const tag = element.tagName ? element.tagName.toLowerCase() : '';
            if (tag === 'textarea' || element.isContentEditable) return true;
            if (tag === 'input') {
                const type = (element.type || 'text').toLowerCase();
                const nonTextTypes = [
                    'checkbox',
                    'radio',
                    'button',
                    'submit',
                    'reset',
                    'file',
                    'color',
                    'range',
                    'image',
                ];
                return !nonTextTypes.includes(type);
            }
            return false;
        };

        const checkKeyboard = () => {
            // Screen rotation / orientation change
            if (window.innerWidth !== initialWidth) {
                initialWidth = window.innerWidth;
                initialHeight = window.innerHeight;
                updateState(false);
                return;
            }

            // 1. Chromium VirtualKeyboard API
            if (
                navigator.virtualKeyboard &&
                navigator.virtualKeyboard.boundingRect &&
                navigator.virtualKeyboard.boundingRect.height > 0
            ) {
                updateState(true);
                return;
            }

            // 2. Visual Viewport API (Standard on iOS Safari 13+ and Chrome Android)
            const currentVisualHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            const heightShrunk = (initialHeight - currentVisualHeight > 140) || (currentVisualHeight < initialHeight * 0.78);

            // 3. Active element check on touch devices
            const active = document.activeElement;
            const activeInput = isTextInput(active);

            if (isTouchDevice && activeInput) {
                updateState(true);
            } else {
                updateState(Boolean(heightShrunk));
            }
        };

        // Instant response on input focus on touch devices
        const handleFocusIn = (e) => {
            if (!isTouchDevice) return;
            if (isTextInput(e.target)) {
                updateState(true);
            }
        };

        // Debounced response on blur to avoid flickering when switching fields
        const handleFocusOut = () => {
            setTimeout(() => {
                const active = document.activeElement;
                if (!isTextInput(active)) {
                    const currentVisualHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
                    const heightShrunk = (initialHeight - currentVisualHeight > 140) || (currentVisualHeight < initialHeight * 0.78);
                    updateState(Boolean(heightShrunk));
                }
            }, 120);
        };

        const vv = window.visualViewport;
        if (vv) {
            vv.addEventListener('resize', checkKeyboard);
            vv.addEventListener('scroll', checkKeyboard);
        }

        if (navigator.virtualKeyboard) {
            navigator.virtualKeyboard.addEventListener('geometrychange', checkKeyboard);
        }

        window.addEventListener('resize', checkKeyboard);
        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('focusout', handleFocusOut);

        return () => {
            if (vv) {
                vv.removeEventListener('resize', checkKeyboard);
                vv.removeEventListener('scroll', checkKeyboard);
            }
            if (navigator.virtualKeyboard) {
                navigator.virtualKeyboard.removeEventListener('geometrychange', checkKeyboard);
            }
            window.removeEventListener('resize', checkKeyboard);
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('focusout', handleFocusOut);
            document.documentElement.removeAttribute('data-keyboard-open');
            if (document.body) {
                document.body.classList.remove('keyboard-open');
            }
        };
    }, []);

    return isKeyboardOpen;
}

export default useVirtualKeyboard;
