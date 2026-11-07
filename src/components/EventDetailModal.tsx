import React, { useEffect, useState } from 'react';
import { X, CalendarDays, MapPin, Ticket, Users, Flag, ExternalLink } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { reportContent } from '../lib/persistence';
import { pinMarkup } from '../utils/pin';
import { directionsUrl, eventWhen, isEventHappening, type CityEvent } from '../types/events';

interface EventDetailModalProps {
  event: CityEvent;
  onClose: () => void;
}

/** Everything about one event: flyer, when, where, entry, who plays; directions and report. */
export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  const { requireAccount } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reportState, setReportState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const happening = isEventHappening(event);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) return;
    setReportState('sending');
    try {
      await reportContent('event', event.id, event.title, reason);
      setReportState('sent');
    } catch {
      setReportState('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={event.title}
        className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-black/70 text-zinc-300 hover:text-white"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {event.flyerUrl ? (
          <img src={event.flyerUrl} alt={`Flyer de ${event.title}`} className="w-full max-h-[50vh] object-contain bg-black" />
        ) : (
          <div
            aria-hidden="true"
            className="h-32 bg-black flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: pinMarkup(event.id, 'idle', 40, 56, 'event') }}
          />
        )}

        <div className="p-5 space-y-4">
          <div>
            <p className={`text-xs font-semibold ${happening ? 'text-ipe' : 'text-athos-300'}`}>
              {happening ? 'Acontecendo agora' : event.genre}
            </p>
            <h2 className="text-xl font-bold text-white mt-1">{event.title}</h2>
            <p className="text-sm text-zinc-400 mt-0.5">Organização: {event.organizerName}</p>
          </div>

          <ul className="space-y-2.5 text-sm text-zinc-200">
            <li className="flex gap-2.5">
              <CalendarDays className="w-4 h-4 mt-0.5 text-athos-400 shrink-0" />
              <span>{eventWhen(event)}</span>
            </li>
            <li className="flex gap-2.5">
              <MapPin className="w-4 h-4 mt-0.5 text-athos-400 shrink-0" />
              <span>
                {event.venueName}
                {event.address ? `, ${event.address}` : ''}, {event.city} ({event.state})
              </span>
            </li>
            <li className="flex gap-2.5">
              <Ticket className="w-4 h-4 mt-0.5 text-athos-400 shrink-0" />
              <span className={event.entry === 'free' ? 'text-athos-300 font-semibold' : 'text-ipe font-semibold'}>
                {event.entry === 'free' ? 'Entrada gratuita' : event.priceText || 'Entrada paga'}
              </span>
            </li>
            {event.lineup && (
              <li className="flex gap-2.5">
                <Users className="w-4 h-4 mt-0.5 text-athos-400 shrink-0" />
                <span>{event.lineup}</span>
              </li>
            )}
          </ul>

          {event.description && <p className="text-sm text-zinc-300 whitespace-pre-line">{event.description}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href={directionsUrl(event)}
              target="_blank"
              rel="noreferrer"
              className="min-h-[44px] flex items-center justify-center gap-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 text-sm font-semibold rounded-xl border border-zinc-800"
            >
              <MapPin className="w-4 h-4 text-athos-400" /> Como chegar
            </a>
            {event.ticketUrl ? (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noreferrer nofollow"
                className="min-h-[44px] flex items-center justify-center gap-2 px-3 bg-athos-600 hover:bg-athos-500 text-white text-sm font-bold rounded-xl"
              >
                <ExternalLink className="w-4 h-4" /> {event.entry === 'paid' ? 'Comprar ingresso' : 'Fazer inscrição'}
              </a>
            ) : (
              <button
                onClick={onClose}
                className="min-h-[44px] px-3 bg-athos-600 hover:bg-athos-500 text-white text-sm font-bold rounded-xl"
              >
                Voltar ao mapa
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-800">
            {!reportOpen ? (
              <button
                onClick={() => requireAccount('report', () => setReportOpen(true))}
                className="min-h-[44px] px-2 text-xs font-semibold text-zinc-400 hover:text-red-200 flex items-center gap-2"
              >
                <Flag className="w-4 h-4" /> Denunciar este evento
              </button>
            ) : reportState === 'sent' ? (
              <p role="status" className="text-sm text-zinc-300">Denúncia enviada. A moderação vai olhar.</p>
            ) : (
              <form onSubmit={sendReport} className="space-y-2">
                <label htmlFor="ev-report" className="block text-xs font-semibold text-zinc-300">
                  O que há de errado com este evento?
                </label>
                <textarea
                  id="ev-report"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={1000}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-athos-500"
                />
                {reportState === 'error' && <p className="text-xs text-red-300">Não deu para enviar. Tente de novo.</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setReportOpen(false)} className="min-h-[44px] px-3 text-xs text-zinc-400 hover:text-white">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={reason.trim().length < 5 || reportState === 'sending'}
                    className="min-h-[44px] px-4 rounded-xl bg-red-900/60 hover:bg-red-800/70 text-red-100 text-xs font-bold disabled:opacity-50"
                  >
                    {reportState === 'sending' ? 'Enviando…' : 'Enviar denúncia'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
