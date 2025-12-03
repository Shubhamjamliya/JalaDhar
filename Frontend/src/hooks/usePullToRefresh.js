import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for pull-to-refresh functionality
 * @param {Function} onRefresh - Callback function to execute on refresh
 * @param {Object} options - Configuration options
 * @returns {Object} - { isRefreshing, pullDistance, containerProps }
 */
export const usePullToRefresh = (onRefresh, options = {}) => {
  const {
    threshold = 80, // Distance in pixels to trigger refresh
    resistance = 2.5, // Resistance factor for pull (higher = harder to pull)
    disabled = false,
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullDistanceRef = useRef(0);
  const isPulling = useRef(false);
  const containerRef = useRef(null);

  // Update ref when state changes
  useEffect(() => {
    pullDistanceRef.current = pullDistance;
  }, [pullDistance]);

  useEffect(() => {
    if (disabled || !containerRef.current) return;

    const container = containerRef.current;
    let touchStartY = 0;
    let scrollTop = 0;
    let mouseStartY = 0;
    let mouseScrollTop = 0;
    let isMousePulling = false;

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
      scrollTop = container.scrollTop;
      isPulling.current = false;
    };

    const handleTouchMove = (e) => {
      if (scrollTop > 0) {
        // User is scrolling down, not at top
        return;
      }

      const touchY = e.touches[0].clientY;
      const currentPullDistance = Math.max(0, (touchY - touchStartY) / resistance);

      if (currentPullDistance > 0) {
        isPulling.current = true;
        e.preventDefault(); // Prevent default scroll
        setPullDistance(currentPullDistance);
      }
    };

    const handleTouchEnd = () => {
      const currentPullDistance = pullDistanceRef.current;
      if (isPulling.current && currentPullDistance >= threshold) {
        setIsRefreshing(true);
        setPullDistance(0);
        
        // Call refresh callback
        Promise.resolve(onRefresh()).finally(() => {
          setIsRefreshing(false);
        });
      } else {
        setPullDistance(0);
      }
      
      isPulling.current = false;
    };

    // Mouse events for desktop (optional, for testing)
    const handleMouseDown = (e) => {
      if (container.scrollTop > 0) return;
      mouseStartY = e.clientY;
      mouseScrollTop = container.scrollTop;
      isMousePulling = false;
    };

    const handleMouseMove = (e) => {
      if (mouseScrollTop > 0 || !mouseStartY) return;
      
      const mouseY = e.clientY;
      const pullDist = Math.max(0, (mouseY - mouseStartY) / resistance);

      if (pullDist > 0) {
        isMousePulling = true;
        setPullDistance(pullDist);
      }
    };

    const handleMouseUp = () => {
      const currentPullDistance = pullDistanceRef.current;
      if (isMousePulling && currentPullDistance >= threshold) {
        setIsRefreshing(true);
        setPullDistance(0);
        
        Promise.resolve(onRefresh()).finally(() => {
          setIsRefreshing(false);
        });
      } else {
        setPullDistance(0);
      }
      
      isMousePulling = false;
      mouseStartY = 0;
    };

    // Add touch event listeners
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    // Add mouse event listeners for desktop
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [onRefresh, threshold, resistance, disabled]);

  return {
    isRefreshing,
    pullDistance,
    containerRef,
    canRefresh: pullDistance >= threshold,
  };
};

