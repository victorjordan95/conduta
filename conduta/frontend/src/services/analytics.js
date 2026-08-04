const GA_SCRIPT_PREFIX = 'https://www.googletagmanager.com/gtag/js?id=';
let lastTrackedPagePath = null;

function getConfiguredMeasurementId(measurementId) {
  return measurementId || import.meta.env.VITE_GA_MEASUREMENT_ID;
}

export function initializeAnalytics(measurementId) {
  const configuredId = getConfiguredMeasurementId(measurementId);

  if (!configuredId || typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  if (window.__condutaGaMeasurementId === configuredId && typeof window.gtag === 'function') {
    return true;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  const scriptSelector = 'script[data-conduta-ga4="' + configuredId + '"]';
  if (!document.querySelector(scriptSelector)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = GA_SCRIPT_PREFIX + configuredId;
    script.dataset.condutaGa4 = configuredId;
    document.head.appendChild(script);
  }

  window.gtag('js', new Date());
  window.gtag('config', configuredId, { send_page_view: false });
  window.__condutaGaMeasurementId = configuredId;

  return true;
}

export function trackPageView(path, title = document.title) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return false;
  }

  if (path === lastTrackedPagePath) {
    return false;
  }

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
    page_location: window.location.origin + path,
  });

  lastTrackedPagePath = path;
  return true;
}
