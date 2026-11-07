import type { CityEvent } from '../types/events';

/** Demo events for testing the map. Remove before launch (like the [DEMO] releases). */
function at(daysFromNow: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

const HOUR = 3_600_000;

export const INITIAL_EVENTS: CityEvent[] = [
  {
    id: 'evt-demo-1',
    title: '[DEMO] Batalha de MCs da Praça',
    genre: 'Batalha de MCs',
    description: 'Evento de demonstração para testar os eventos no mapa. Inscrições na hora, roda aberta.',
    lineup: 'MCs inscritos na hora',
    startsAt: at(2, 19),
    endsAt: at(2, 19) + 4 * HOUR,
    venueName: 'Praça central (exemplo)',
    address: 'Samambaia Sul',
    city: 'Samambaia',
    state: 'DF',
    coordinates: { lat: -15.8792, lng: -48.0905 },
    entry: 'free',
    organizerName: 'Coletivo Exemplo',
  },
  {
    id: 'evt-demo-2',
    title: '[DEMO] Baile do Recanto',
    genre: 'Baile Funk',
    description: 'Evento de demonstração para testar os eventos no mapa.',
    lineup: 'DJs convidados',
    startsAt: at(5, 22),
    endsAt: at(5, 22) + 5 * HOUR,
    venueName: 'Quadra de esportes (exemplo)',
    address: 'Recanto das Emas',
    city: 'Recanto das Emas',
    state: 'DF',
    coordinates: { lat: -15.9071, lng: -48.0668 },
    entry: 'paid',
    priceText: 'R$ 15 na porta',
    organizerName: 'Produtora Exemplo',
  },
  {
    id: 'evt-demo-3',
    title: '[DEMO] Sarau de Rap no Setor Comercial',
    genre: 'Rap',
    description: 'Evento de demonstração para testar os eventos no mapa. Microfone aberto depois das apresentações.',
    lineup: 'Artistas Exemplo 1 e 2',
    startsAt: at(0, Math.min(new Date().getHours(), 22)),
    endsAt: at(0, Math.min(new Date().getHours(), 22)) + 4 * HOUR,
    venueName: 'Galeria (exemplo)',
    address: 'Setor Comercial Sul',
    city: 'Brasília (Plano Piloto)',
    state: 'DF',
    coordinates: { lat: -15.7975, lng: -47.8883 },
    entry: 'free',
    organizerName: 'Sarau Exemplo',
  },
];
