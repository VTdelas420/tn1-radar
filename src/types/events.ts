/**
 * A music event happening in the city (a rap battle, a baile, a show, a sarau).
 * Shown on the map as an inverted triangle; releases are spheres.
 */
export interface CityEvent {
  id: string;
  title: string;
  /** Style, e.g. "Rap", "Baile Funk", "Batalha de MCs" */
  genre: string;
  description: string;
  /** Who is on stage (free text) */
  lineup?: string;
  /** Start and end, as milliseconds since 1970 (local time chosen in the form) */
  startsAt: number;
  endsAt: number;
  venueName: string;
  /** Street and district only (no house number) */
  address?: string;
  city: string; // RA or Entorno city
  state: string; // 'DF' | 'GO'
  coordinates: { lat: number; lng: number };
  entry: 'free' | 'paid';
  /** Shown as written, e.g. "R$ 20 na porta" */
  priceText?: string;
  ticketUrl?: string;
  flyerUrl?: string;
  organizerName: string;
  ownerUid?: string;
  createdAt?: number;
}

/** Events stay on the map until they end. */
export function isEventVisible(ev: CityEvent, now = Date.now()) {
  return ev.endsAt > now;
}

export function isEventHappening(ev: CityEvent, now = Date.now()) {
  return ev.startsAt <= now && now < ev.endsAt;
}

/** Google Maps search for the venue (name, street/district, city): opens directions on phones. */
export function directionsUrl(ev: CityEvent) {
  const query = [ev.venueName, ev.address, ev.city, ev.state].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

const WEEKDAY =new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });
const DAY = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' });
const HOUR = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

function hourText(ms: number) {
  const s = HOUR.format(ms);
  return s.endsWith(':00') ? `${s.slice(0, -3)}h` : s.replace(':', 'h');
}

/** "Hoje, 20h às 2h", "Amanhã, 18h às 23h", "Sábado, 22 de novembro, 20h às 2h" */
export function eventWhen(ev: CityEvent, now = Date.now()) {
  const start = new Date(ev.startsAt);
  const today = new Date(now);
  const dayDiff = Math.round(
    (new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) /
      86_400_000
  );
  const weekday = WEEKDAY.format(start);
  const day =
    dayDiff === 0
      ? 'Hoje'
      : dayDiff === 1
        ? 'Amanhã'
        : dayDiff > 1 && dayDiff < 7
          ? weekday.charAt(0).toUpperCase() + weekday.slice(1)
          : `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${DAY.format(start)}`;
  return `${day}, ${hourText(ev.startsAt)} às ${hourText(ev.endsAt)}`;
}
