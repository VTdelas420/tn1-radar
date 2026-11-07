import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentOccurrence, eventWhen, isEventHappening, isEventVisible, recurrenceText, type CityEvent } from './events';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
// Friday 7 Nov 2025, 20:00 in Brasília (UTC-3)
const FRIDAY_20H = Date.UTC(2025, 10, 7, 23, 0, 0);

const base = (extra: Partial<CityEvent> = {}): CityEvent => ({
  id: 'e1',
  title: 'Batalha',
  genre: 'Batalha de MCs',
  description: '',
  startsAt: FRIDAY_20H,
  endsAt: FRIDAY_20H + 4 * HOUR,
  venueName: 'Praça',
  city: 'Ceilândia',
  state: 'DF',
  coordinates: { lat: -15.82, lng: -48.11 },
  entry: 'free',
  organizerName: 'Coletivo',
  ...extra,
});

test('a one-off event disappears after it ends', () => {
  const ev = base();
  assert.equal(isEventVisible(ev, FRIDAY_20H + HOUR), true);
  assert.equal(isEventHappening(ev, FRIDAY_20H + HOUR), true);
  assert.equal(isEventVisible(ev, FRIDAY_20H + 5 * HOUR), false);
});

test('a weekly event moves to the next Friday after each edition', () => {
  const ev = base({ recurrence: 'weekly' });
  const occ = currentOccurrence(ev, FRIDAY_20H + 2 * DAY);
  assert.deepEqual(occ, { startsAt: FRIDAY_20H + 7 * DAY, endsAt: FRIDAY_20H + 7 * DAY + 4 * HOUR });
  // during the third edition it is happening
  assert.equal(isEventHappening(ev, FRIDAY_20H + 14 * DAY + HOUR), true);
});

test('an edition that just ended points to the next one', () => {
  const ev = base({ recurrence: 'weekly' });
  const occ = currentOccurrence(ev, FRIDAY_20H + 4 * HOUR);
  assert.equal(occ?.startsAt, FRIDAY_20H + 7 * DAY);
});

test('every two weeks skips a week', () => {
  const ev = base({ recurrence: 'biweekly' });
  assert.equal(currentOccurrence(ev, FRIDAY_20H + 8 * DAY)?.startsAt, FRIDAY_20H + 14 * DAY);
});

test('a repeating event stops after its last date', () => {
  const ev = base({ recurrence: 'weekly', repeatUntil: FRIDAY_20H + 7 * DAY + 2 * HOUR });
  assert.equal(isEventVisible(ev, FRIDAY_20H + 8 * DAY), false);
  assert.equal(isEventVisible(ev, FRIDAY_20H + 6 * DAY), true);
});

test('texts say the weekday and the next date', () => {
  const ev = base({ recurrence: 'weekly' });
  assert.match(recurrenceText(ev), /^Toda sexta$/);
  assert.match(eventWhen(ev, FRIDAY_20H - 2 * DAY), /^Toda sexta, 20h às 0h\. Próxima: /);
  assert.match(recurrenceText({ ...ev, startsAt: FRIDAY_20H + DAY, recurrence: 'biweekly' }), /^A cada 15 dias, no sábado$/);
});
