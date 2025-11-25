import { useState, useRef, useEffect } from 'react';

/**
 * Lazy loading image component
 * Only loads images when they enter the viewport
 */
export default function LazyImage({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  onLoad,
  onError,
  ...props 
}) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    // Use Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.disconnect();
      }
    };
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setHasError(true);
    if (onError) onError();
  };

  return (
    <div ref={imgRef} className={`relative ${className}`} {...props}>
      {!imageSrc && placeholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          {placeholder}
        </div>
      )}
      
      {imageSrc && (
        <>
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
              <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <img
            src={imageSrc}
            alt={alt}
            className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
          />
        </>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <span className="text-gray-400 text-sm">Failed to load</span>
        </div>
      )}
    </div>
  );
}

