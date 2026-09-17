import { useState, useEffect, useCallback } from 'react';
import { getLandingContent } from '../../../services/landingApi';

export function useLandingContent() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getLandingContent()
      .then((res) => {
        if (isMounted && res?.data?.content) {
          setContent(res.data.content);
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
      return val !== undefined && val !== null ? val : fallback;
    },
    [content]
  );

  return { content, loading, cms };
}

export default useLandingContent;
