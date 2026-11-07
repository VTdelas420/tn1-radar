/**
 * A music event happening in the city (a rap battle, a baile, a show, a sarau).
 * Shown on the map as an inverted triangle; releases are spheres.
 */
export type EventRecurrence = 'none' | 'weekly' | 'biweekly';

export interface CityEvent {
  id: string;
  title: string;
  /** Style, e.g. "Rap", "Baile Funk", "Batalha de MCs" */
  genre: string;
  description: string;
  /** Who is on stage (free text) */
  lineup?: string;
  /**
   * Start and end of the (first) edition, in milliseconds since 1970.
   * For a repeating event the next editions follow every 7 or 14 days.
   */
  startsAt: number;
  endsAt: number;
  /** Repeats every week or every two weeks on the same weekday and time */
  recurrence?: EventRecurrence;
  /** Last day a repeating event can start (end of that day), optional */
  repeatUntil?: number;
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

const DAY = 86_400_000;
const PERIOD: Record<EventRecurrence, number> = { none: 0, weekly: 7 * DAY, biweekly: 14 * DAY };

export function isRepeating(ev: CityEvent) {
  return Boolean(ev.recurrence && ev.recurrence !== 'none');
}

/**
 * The edition happening now or the next one, or null when the event is over.
 * (Weekly steps in milliseconds: fine for Brasília, which has no daylight saving time.)
 */
export function currentOccurrence(ev: CityEvent, now = Date.now()): { startsAt: number; endsAt: number } | null {
  const length = ev.endsAt - ev.startsAt;
  if (!isRepeating(ev)) return ev.endsAt > now ? { startsAt: ev.startsAt, endsAt: ev.endsAt } : null;
  const period = PERIOD[ev.recurrence!];
  let startsAt = ev.startsAt;
  if (startsAt + length <= now) {
    const steps = Math.ceil((now - (startsAt + length)) / period);
    startsAt += steps * period;
    if (startsAt + length <= now) startsAt += period;
  }
  if (ev.repeatUntil && startsAt > ev.repeatUntil) return null;
  return { startsAt, endsAt: startsAt + length };
}

/** Events stay on the map while there is an edition to come. */
export function isEventVisible(ev: CityEvent, now = Date.now()) {
  return currentOccurrence(ev, now) !== null;
}

export function isEventHappening(ev: CityEvent, now = Date.now()) {
  const occ = currentOccurrence(ev, now);
  return Boolean(occ && occ.startsAt <= now && now < occ.endsAt);
}

/** Sort key: when the current or next edition starts */
export function nextStart(ev: CityEvent, now = Date.now()) {
  return currentOccurrence(ev, now)?.startsAt ?? Number.MAX_SAFE_INTEGER;
}

/** Google Maps search for the venue (name, street/district, city): opens directions on phones. */
export function directionsUrl(ev: CityEvent) {
  const query = [ev.venueName, ev.address, ev.city, ev.state].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

const WEEKDAY = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });
const DAY_MONTH = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' });
const HOUR = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

/** '20h', '0h', '22h30' */
function hourText(ms: number) {
  const [h, m] = HOUR.format(ms).split(':');
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "segunda" from "segunda-feira" */
function weekdayShort(ms: number) {
  return WEEKDAY.format(ms).replace('-feira', '');
}

/** "Hoje", "Amanhã", "Sexta" (this week) or "Sexta, 22 de novembro" */
function dayText(startsAt: number, now: number) {
  const start = new Date(startsAt);
  const today = new Date(now);
  const dayDiff = Math.round(
    (new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) /
      DAY
  );
  const weekday = capitalize(weekdayShort(startsAt));
  if (dayDiff === 0) return 'Hoje';
  if (dayDiff === 1) return 'Amanhã';
  if (dayDiff > 1 && dayDiff < 7) return weekday;
  return `${weekday}, ${DAY_MONTH.format(start)}`;
}

/** "Toda sexta" / "A cada 15 dias, na sexta" */
export function recurrenceText(ev: CityEvent) {
  if (!isRepeating(ev)) return '';
  const day = weekdayShort(ev.startsAt);
  const masculine = day === 'sábado' || day === 'domingo';
  return ev.recurrence === 'weekly'
    ? `${masculine ? 'Todo' : 'Toda'} ${day}`
    : `A cada 15 dias, ${masculine ? 'no' : 'na'} ${day}`;
}

/**
 * When the event happens next.
 * One-off: "Hoje, 20h às 2h" / "Sábado, 22 de novembro, 20h às 2h".
 * Repeating: "Toda sexta, 20h às 2h. Próxima: amanhã".
 */
export function eventWhen(ev: CityEvent, now = Date.now()) {
  const occ = currentOccurrence(ev, now) ?? { startsAt: ev.startsAt, endsAt: ev.endsAt };
  const hours = `${hourText(occ.startsAt)} às ${hourText(occ.endsAt)}`;
  if (!isRepeating(ev)) return `${dayText(occ.startsAt, now)}, ${hours}`;
  const next = dayText(occ.startsAt, now);
  return `${recurrenceText(ev)}, ${hours}. Próxima: ${next.charAt(0).toLowerCase() + next.slice(1)}`;
}

/** Short schedule for tight spots: "Toda segunda, 19h às 23h" (repeating) or the full one-off text */
export function eventSchedule(ev: CityEvent, now = Date.now()) {
  if (!isRepeating(ev)) return eventWhen(ev, now);
  return `${recurrenceText(ev)}, ${hourText(ev.startsAt)} às ${hourText(ev.endsAt)}`;
}

/** "Próxima: amanhã" for repeating events, empty otherwise */
export function nextEditionText(ev: CityEvent, now = Date.now()) {
  const occ = currentOccurrence(ev, now);
  if (!isRepeating(ev) || !occ) return '';
  const day = dayText(occ.startsAt, now);
  return `Próxima: ${day.charAt(0).toLowerCase() + day.slice(1)}`;
}
