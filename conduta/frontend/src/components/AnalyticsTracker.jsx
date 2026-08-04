import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../services/analytics';

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname + location.search + location.hash;
    trackPageView(path);
  }, [location.pathname, location.search, location.hash]);

  return null;
}
