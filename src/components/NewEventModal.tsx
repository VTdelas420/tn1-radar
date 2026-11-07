import React, { useEffect, useMemo, useState } from 'react';
import { X, ImagePlus, MapPin, Trash2 } from 'lucide-react';
import { PinDropMiniMap } from './PinDropMiniMap';
import { REGION_LOCATIONS, REGION_NAME, findRegionLocation, isInRegion } from '../config/region';
import type { AccountProfile } from '../lib/auth';
import type { CityEvent } from '../types/events';

interface NewEventModalProps {
  organizer: AccountProfile | null;
  onClose: () => void;
  onSaveEvent: (event: CityEvent, flyer?: File) => void;
}

const GENRES = ['Rap', 'Batalha de MCs', 'Baile Funk', 'Trap', 'Hip-hop', 'Sarau', 'Show', 'Festa', 'Roda de samba', 'Outro'];
const MAX_FLYER_MB = 10;
const HOUR = 3_600_000;

const inputClass =
  'w-full min-h-[44px] px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-athos-500';
const labelClass = 'block text-xs font-semibold text-zinc-300 mb-1.5';

function todayIso() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function isHttpUrl(text: string) {
  try {
    const u = new URL(text);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Form to put an event happening in the city on the map (a triangle pin). */
export const NewEventModal: React.FC<NewEventModalProps> = ({ organizer, onClose, onSaveEvent }) => {
  const startPlace =
    (organizer?.city && findRegionLocation(organizer.city, organizer.state)) || REGION_LOCATIONS[0];

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Rap');
  const [date, setDate] = useState(todayIso());
  const [startTime, setStartTime] = useState('20:00');
  const [endTime, setEndTime] = useState('23:00');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [placeKey, setPlaceKey] = useState(`${startPlace.n}|${startPlace.uf}`);
  const [coords, setCoords] = useState({ lat: startPlace.lat, lng: startPlace.lng });
  const [entry, setEntry] = useState<'free' | 'paid'>('free');
  const [priceText, setPriceText] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [lineup, setLineup] = useState('');
  const [description, setDescription] = useState('');
  const [organizerName, setOrganizerName] = useState(organizer?.name ?? '');
  const [flyer, setFlyer] = useState<File | null>(null);
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [placeName, placeUf] = placeKey.split('|');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const choosePlace = (key: string) => {
    setPlaceKey(key);
    const [n, uf] = key.split('|');
    const loc = findRegionLocation(n, uf);
    if (loc) setCoords({ lat: loc.lat, lng: loc.lng });
  };

  const pickFlyer = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('O flyer precisa ser uma imagem (JPG, PNG ou WEBP).');
      return;
    }
    if (file.size > MAX_FLYER_MB * 1024 * 1024) {
      setError(`O flyer pode ter até ${MAX_FLYER_MB} MB.`);
      return;
    }
    setFlyer(file);
    setFlyerPreview(URL.createObjectURL(file));
  };

  // Start/end as timestamps; an end time earlier than the start means the next day
  const times = useMemo(() => {
    const startsAt = new Date(`${date}T${startTime}:00`).getTime();
    let endsAt = new Date(`${date}T${endTime}:00`).getTime();
    if (Number.isFinite(endsAt) && endsAt <= startsAt) endsAt += 24 * HOUR;
    return { startsAt, endsAt };
  }, [date, startTime, endTime]);

  const endsNextDay = useMemo(() => {
    const s = new Date(times.startsAt);
    const e = new Date(times.endsAt);
    return Number.isFinite(times.endsAt) && e.getDate() !== s.getDate();
  }, [times]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (title.trim().length < 3) return setError('Dê um nome ao evento.');
    if (venueName.trim().length < 2) return setError('Diga onde vai ser (o nome do lugar).');
    if (!Number.isFinite(times.startsAt) || !Number.isFinite(times.endsAt)) return setError('Confira o dia e os horários.');
    if (times.endsAt <= Date.now()) return setError('Esse horário já passou. Confira o dia e o horário de término.');
    if (times.endsAt - times.startsAt > 3 * 24 * HOUR) return setError('Um evento pode durar até 3 dias.');
    if (!isInRegion(coords.lat, coords.lng)) return setError(`O evento precisa ser no ${REGION_NAME}.`);
    // "QNM 12" is a block, fine; "nº 45" or ", 45" is a house number, not shown
    if (/(n[ºo°]\.?\s*\d|,\s*\d{1,5}\b|\bn[úu]mero\b)/i.test(address))
      return setError('No endereço, coloque só a rua, quadra ou bairro, sem o número.');
    if (entry === 'paid' && !priceText.trim()) return setError('Diga o valor da entrada (ex.: R$ 20 na porta).');
    if (ticketUrl.trim() && !isHttpUrl(ticketUrl.trim())) return setError('O link de ingresso precisa começar com https://');
    if (!organizerName.trim()) return setError('Diga quem organiza.');

    const event: CityEvent = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim().slice(0, 120),
      genre,
      description: description.trim().slice(0, 2000),
      lineup: lineup.trim().slice(0, 300) || undefined,
      startsAt: times.startsAt,
      endsAt: times.endsAt,
      venueName: venueName.trim().slice(0, 120),
      address: address.trim().slice(0, 160) || undefined,
      city: placeName,
      state: placeUf,
      coordinates: coords,
      entry,
      priceText: entry === 'paid' ? priceText.trim().slice(0, 80) : undefined,
      ticketUrl: ticketUrl.trim() || undefined,
      flyerUrl: flyerPreview ?? undefined,
      organizerName: organizerName.trim().slice(0, 80),
    };
    onSaveEvent(event, flyer ?? undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Novo evento"
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-auto"
      >
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-black/60 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white">Novo evento no mapa</h3>
            <p className="text-xs text-zinc-400">
              Batalha, baile, show ou sarau acontecendo no {REGION_NAME}. Ele aparece como um triângulo até acabar.
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col max-h-[calc(100dvh-8.5rem)] sm:max-h-[80vh]">
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto overscroll-contain flex-1">
            <div>
              <label htmlFor="ev-title" className={labelClass}>Nome do evento *</label>
              <input id="ev-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Ex.: Batalha da Praça, 3ª edição" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ev-genre" className={labelClass}>Estilo *</label>
                <select id="ev-genre" className={inputClass} value={genre} onChange={(e) => setGenre(e.target.value)}>
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ev-org" className={labelClass}>Quem organiza *</label>
                <input id="ev-org" className={inputClass} value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} maxLength={80} placeholder="Coletivo, produtora ou artista" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="ev-date" className={labelClass}>Dia *</label>
                <input id="ev-date" type="date" className={inputClass} value={date} min={todayIso()} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label htmlFor="ev-start" className={labelClass}>Começa *</label>
                <input id="ev-start" type="time" className={inputClass} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <label htmlFor="ev-end" className={labelClass}>Termina *</label>
                <input id="ev-end" type="time" className={inputClass} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            {endsNextDay && <p className="-mt-3 text-[11px] text-zinc-400">Termina no dia seguinte.</p>}

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ev-venue" className={labelClass}>Nome do lugar *</label>
                  <input id="ev-venue" className={inputClass} value={venueName} onChange={(e) => setVenueName(e.target.value)} maxLength={120} placeholder="Ex.: Praça do Cidadão" />
                </div>
                <div>
                  <label htmlFor="ev-place" className={labelClass}>RA ou cidade *</label>
                  <select id="ev-place" className={inputClass} value={placeKey} onChange={(e) => choosePlace(e.target.value)}>
                    <optgroup label="Distrito Federal">
                      {REGION_LOCATIONS.filter((c) => c.uf === 'DF').map((c) => (
                        <option key={c.n} value={`${c.n}|${c.uf}`}>{c.n}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Entorno (GO)">
                      {REGION_LOCATIONS.filter((c) => c.uf === 'GO').map((c) => (
                        <option key={c.n} value={`${c.n}|${c.uf}`}>{c.n}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="ev-address" className={labelClass}>Rua ou bairro</label>
                <input id="ev-address" className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} maxLength={160} placeholder="Ex.: Setor O (sem número)" />
              </div>
              <PinDropMiniMap
                lat={coords.lat}
                lng={coords.lng}
                focusKey={placeKey}
                shape="event"
                onChange={(lat, lng) => setCoords({ lat, lng })}
                hint="Toque no mapa ou arraste o triângulo até onde o evento vai acontecer."
              />
            </div>

            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <span className={labelClass}>Entrada *</span>
              <div role="radiogroup" aria-label="Entrada" className="grid grid-cols-2 gap-2">
                {([
                  ['free', 'Gratuita'],
                  ['paid', 'Paga'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={entry === value}
                    onClick={() => setEntry(value)}
                    className={`min-h-[44px] rounded-xl border text-sm font-semibold transition-colors ${
                      entry === value ? 'bg-athos-600 border-athos-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {entry === 'paid' && (
                <div>
                  <label htmlFor="ev-price" className={labelClass}>Valor *</label>
                  <input id="ev-price" className={inputClass} value={priceText} onChange={(e) => setPriceText(e.target.value)} maxLength={80} placeholder="Ex.: R$ 20 na porta, R$ 15 antecipado" />
                </div>
              )}
              <div>
                <label htmlFor="ev-ticket" className={labelClass}>Link de ingresso ou inscrição</label>
                <input id="ev-ticket" type="url" inputMode="url" className={inputClass} value={ticketUrl} onChange={(e) => setTicketUrl(e.target.value)} placeholder="https://" />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div>
                <label htmlFor="ev-lineup" className={labelClass}>Quem vai se apresentar</label>
                <input id="ev-lineup" className={inputClass} value={lineup} onChange={(e) => setLineup(e.target.value)} maxLength={300} placeholder="MCs, DJs, bandas" />
              </div>
              <div>
                <label htmlFor="ev-desc" className={labelClass}>Sobre o evento</label>
                <textarea id="ev-desc" rows={3} className={`${inputClass} py-3`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} placeholder="O que vai rolar, regras da batalha, classificação etária…" />
              </div>
              <div>
                <span className={labelClass}>Flyer</span>
                {flyerPreview ? (
                  <div className="flex items-center gap-3">
                    <img src={flyerPreview} alt="Flyer escolhido" className="w-24 h-24 rounded-xl object-cover border border-zinc-800" />
                    <button
                      type="button"
                      onClick={() => {
                        setFlyer(null);
                        setFlyerPreview(null);
                      }}
                      className="min-h-[44px] px-3 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Tirar flyer
                    </button>
                  </div>
                ) : (
                  <label className="min-h-[44px] px-4 rounded-xl border border-dashed border-zinc-700 hover:border-athos-500 text-sm text-zinc-300 hover:text-white flex items-center justify-center gap-2 cursor-pointer">
                    <ImagePlus className="w-4 h-4" /> Escolher imagem (até {MAX_FLYER_MB} MB)
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickFlyer(e.target.files?.[0])} />
                  </label>
                )}
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-300 bg-red-950/40 border border-red-500/40 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
          </div>

          <div className="p-3 sm:p-4 sm:px-6 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 shrink-0">
            <span className="text-xs text-zinc-400 flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-athos-400 shrink-0" />
              <span className="truncate">Local: {placeName} ({placeUf})</span>
            </span>
            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <button type="button" onClick={onClose} className="min-h-[44px] px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white">
                Cancelar
              </button>
              <button type="submit" className="flex-1 sm:flex-none min-h-[44px] px-4 sm:px-6 py-2.5 bg-athos-600 hover:bg-athos-500 text-white font-bold text-xs sm:text-sm rounded-xl active:scale-95">
                Publicar evento
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
