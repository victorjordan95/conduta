import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import AnalyticsTracker from '../components/AnalyticsTracker';
import { initializeAnalytics, trackPageView } from '../services/analytics';

afterEach(() => {
  cleanup();
  document.head.innerHTML = '';
  delete window.dataLayer;
  delete window.gtag;
});

describe('Google Analytics 4', () => {
  it('carrega a tag e desativa pageview automático', () => {
    initializeAnalytics('G-TEST123');

    expect(document.querySelector('script[src*="id=G-TEST123"]')).not.toBeNull();
    expect(window.dataLayer.some((entry) => {
      const values = Array.from(entry);
      return values[0] === 'config'
        && values[1] === 'G-TEST123'
        && values[2]?.send_page_view === false;
    })).toBe(true);
  });

  it('envia pageview com o caminho atual da SPA', async () => {
    const events = [];
    window.gtag = (...args) => events.push(args);

    render(
      <MemoryRouter initialEntries={['/cadastro?utm_source=instagram']}>
        <AnalyticsTracker />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(events).toContainEqual([
        'event',
        'page_view',
        expect.objectContaining({
          page_path: '/cadastro?utm_source=instagram',
        }),
      ]);
    });
  });

  it('não envia pageview quando o GA4 não está disponível', () => {
    delete window.gtag;

    expect(() => trackPageView('/')).not.toThrow();
  });

  it('não duplica pageview da mesma rota', () => {
    const events = [];
    window.gtag = (...args) => events.push(args);

    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/']}>
          <AnalyticsTracker />
        </MemoryRouter>
      </StrictMode>,
    );

    expect(events.filter(([type, name]) => type === 'event' && name === 'page_view')).toHaveLength(1);
  });
});
