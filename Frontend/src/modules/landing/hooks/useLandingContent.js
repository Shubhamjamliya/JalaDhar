import { useState, useEffect, useCallback } from 'react';
import { getLandingContent } from '../../../services/landingApi';

export function useLandingContent() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getLandingContent()
      .then((res) => {
        if (isMounted) {
          const payload = res?.data?.content || res?.data;
          if (payload && typeof payload === 'object') {
            setContent(payload);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not fetch landing CMS content, using fallbacks:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const cms = useCallback(
    (path, fallback) => {
      if (!content) return fallback;
      const parts = path.split('.');
      let val = content;
      for (const p of parts) {
        if (val && typeof val === 'object' && p in val) {
          val = val[p];
        } else {
          return fallback;
        }
      }
      if (val === '' || val === null || val === undefined) return fallback;
      if (Array.isArray(val) && val.length === 0) return fallback;
      return val;
    },
    [content]
  );

  return { content, loading, cms };
}

export default useLandingContent;
