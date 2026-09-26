'use client';
import type {JourneyEventName} from './journey-events';

const CONSENT_COOKIE = 'olready_consent=yes';

function hasAnalyticsConsent() {
 return document.cookie.includes(CONSENT_COOKIE);
}

function sessionId() {
 let id = sessionStorage.getItem('olready_session');
 if (!id) {
  id = crypto.randomUUID();
  sessionStorage.setItem('olready_session', id);
 }
 return id;
}

function captureSessionAttribution() {
 if (sessionStorage.getItem('olready_attr_set')) return;
 try {
  if (document.referrer) {
   const ref = new URL(document.referrer);
   if (ref.origin !== location.origin) {
    sessionStorage.setItem('olready_referrer', ref.origin.slice(0, 120));
   }
  }
 } catch {
  /* ignore malformed referrer */
 }
 if (!sessionStorage.getItem('olready_landing')) {
  sessionStorage.setItem('olready_landing', location.pathname.slice(0, 100));
 }
 sessionStorage.setItem('olready_attr_set', '1');
}

function utmHint() {
 const p = new URLSearchParams(location.search);
 const parts: string[] = [];
 for (const key of ['utm_source', 'utm_medium', 'utm_campaign'] as const) {
  const v = p.get(key)?.trim();
  if (v) parts.push(`${key}=${v.slice(0, 40)}`);
 }
 return parts.length ? parts.join('&').slice(0, 120) : undefined;
}

function send(name: JourneyEventName, target?: string, path = location.pathname) {
 if (!hasAnalyticsConsent()) return;
 captureSessionAttribution();
 const referrer = sessionStorage.getItem('olready_referrer') || undefined;
 const landing = sessionStorage.getItem('olready_landing') || undefined;
 const campaign = utmHint();
 fetch('/api/events', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
   name,
   target,
   path: path.slice(0, 100),
   session: sessionId(),
   referrer,
   landing,
   campaign,
  }),
  keepalive: true,
 }).catch(() => {});
}

/** Remember paths visited before analytics consent so we can flush after opt-in. */
export function notePathForAnalytics(path: string) {
 if (hasAnalyticsConsent()) return;
 if (!sessionStorage.getItem('olready_landing')) {
  sessionStorage.setItem('olready_landing', path.slice(0, 100));
 }
 try {
  const raw = sessionStorage.getItem('olready_pending_paths');
  const paths: string[] = raw ? JSON.parse(raw) : [];
  const next = path.slice(0, 100);
  if (paths[paths.length - 1] !== next) paths.push(next);
  sessionStorage.setItem('olready_pending_paths', JSON.stringify(paths.slice(-20)));
 } catch {
  /* ignore */
 }
}

export function flushPendingAnalytics() {
 if (!hasAnalyticsConsent()) return;
 try {
  const raw = sessionStorage.getItem('olready_pending_paths');
  const paths: string[] = raw ? JSON.parse(raw) : [];
  sessionStorage.removeItem('olready_pending_paths');
  for (const p of paths) send('page_view', undefined, p);
 } catch {
  /* ignore */
 }
 send('page_view');
}

export function track(name: JourneyEventName, target?: string) {
 send(name, target);
}
