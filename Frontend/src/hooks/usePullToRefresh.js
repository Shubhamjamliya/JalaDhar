import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for smooth, native app-like pull-to-refresh functionality.
 * Works seamlessly with whole-page scrolling and single-item/empty-state lists.
 * 
 * @param {Function} onRefresh - Async callback function to execute on refresh
 * @param {Object} options - { threshold, disabled }
 * @returns {Object} - { isRefreshing, pullDistance, containerRef, canRefresh }
 */
export const usePullToRefresh = (onRefresh, options = {}) => {
  const {
    threshold = 65, // Distance in pixels required to trigger refresh
    disabled = false,
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullDistanceRef = useRef(0);
  const isPullingRef = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => {
    pullDistanceRef.current = pullDistance;
  }, [pullDistance]);

  useEffect(() => {
    if (disabled || typeof window === 'undefined') return;

    const el = containerRef.current || document.body;
    let touchStartY = 0;
    let touchStartX = 0;
    let isEligible = false;

    const getScrollTop = () => {
      return (
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        (containerRef.current ? containerRef.current.scrollTop : 0) ||
        0
      );
    };

    const handleTouchStart = (e) => {
      // Only allow pull-down when user is at the very top of the page
      if (getScrollTop() > 2) {
        isEligible = false;
        return;
      }
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      isEligible = true;
      isPullingRef.current = false;
    };

    const handleTouchMove = (e) => {
      if (!isEligible) return;

      const touchY = e.touches[0].clientY;
      const touchX = e.touches[0].clientX;
      const diffY = touchY - touchStartY;
      const diffX = Math.abs(touchX - touchStartX);

      // If user is swiping horizontally (e.g. tabs or carousels), ignore
      if (diffX > Math.abs(diffY)) {
        return;
      }

      if (diffY > 0 && getScrollTop() <= 2) {
        isPullingRef.current = true;
        // Natural cubic/exponential resistance curve
        const dist = Math.min(85, Math.pow(diffY, 0.82) * 1.5);
        setPullDistance(dist);

        // Prevent browser rubber-banding/scroll conflict if pulling down
        if (e.cancelable && dist > 8) {
          e.preventDefault();
        }
      } else {
        if (isPullingRef.current) {
          setPullDistance(0);
          isPullingRef.current = false;
        }
      }
    };

    const handleTouchEnd = async () => {
      isEligible = false;
      const currentDist = pullDistanceRef.current;
      if (isPullingRef.current && currentDist >= threshold) {
        setIsRefreshing(true);
        setPullDistance(threshold); // Hold spinner in view while refreshing
        try {
          if (typeof onRefresh === 'function') {
            await Promise.resolve(onRefresh());
          }
        } catch (err) {
          console.error('[usePullToRefresh] Refresh error:', err);
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
      isPullingRef.current = false;
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    el.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onRefresh, threshold, disabled]);

  return {
    isRefreshing,
    pullDistance,
    containerRef,
    canRefresh: pullDistance >= threshold,
  };
};

export default usePullToRefresh;
