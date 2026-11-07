import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MapPin, Play, Pause, Heart, CalendarDays, Pencil, Trash2, ExternalLink, Share2, CheckCircle2 } from 'lucide-react';
import type { MusicProject } from '../types/music';
import { eventWhen, isEventHappening, isEventVisible, nextStart, type CityEvent } from '../types/events';
import type { AccountProfile } from '../lib/auth';
import { fetchPublicProfile } from '../lib/persistence';
import { pinMarkup } from '../utils/pin';

/** Who the page is about: an account (uid) or, for demo releases, just a name. */
export interface ArtistRef {
  uid?: string;
  name: string;
}

interface ArtistPageViewProps {
  artist: ArtistRef;
  projects: MusicProject[];
  events: CityEvent[];
  /** The signed-in account's uid: on its own page, events can be edited and deleted */
  viewerUid?: string | null;
  currentProjectId?: string;
  isPlaying: boolean;
  onBack: () => void;
  onSelectProject: (project: MusicProject) => void;
  onPlayProject: (project: MusicProject) => void;
  onTogglePlay: () => void;
  onOpenEvent: (event: CityEvent) => void;
  onSupport: (project: MusicProject) => void;
  onEditEvent?: (event: CityEvent) => void;
  onDeleteEvent?: (event: CityEvent) => void;
  onEditProfile?: () => void;
}

const LINK_LABELS: [keyof NonNullable<AccountProfile['links']>, string][] = [
  ['instagram', 'Instagram'],
  ['soundcloud', 'SoundCloud'],
  ['youtube', 'YouTube'],
  ['spotify', 'Spotify'],
  ['bandcamp', 'Bandcamp'],
];

const isWebLink = (url?: string): url is string => !!url && /^https?:\/\//i.test(url);
const ownerOf = (item: { ownerUid?: string }) => item.ownerUid;

/**
 * Public page of an artist (or of whoever organises events): releases, upcoming
 * events, bio, links and direct Pix support. No follower or play counts.
 */
export const ArtistPageView: React.FC<ArtistPageViewProps> = ({
  artist,
  projects,
  events,
  viewerUid,
  currentProjectId,
  isPlaying,
  onBack,
  onSelectProject,
  onPlayProject,
  onTogglePlay,
  onOpenEvent,
  onSupport,
  onEditEvent,
  onDeleteEvent,
  onEditProfile,
}) => {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setProfile(null);
    if (artist.uid) fetchPublicProfile(artist.uid).then((p) => !cancelled && setProfile(p));
    return () => {
      cancelled = true;
    };
  }, [artist.uid]);

  const releases = useMemo(
    () =>
      projects.filter((p) =>
        artist.uid ? ownerOf(p as MusicProject & { ownerUid?: string }) === artist.uid : !ownerOf(p as MusicProject & { ownerUid?: string }) && p.artistName === artist.name
      ),
    [projects, artist]
  );
  const myEvents = useMemo(
    () =>
      events
        .filter((e) => (artist.uid ? e.ownerUid === artist.uid : !e.ownerUid && e.organizerName === artist.name))
        .filter((e) => isEventVisible(e))
        .sort((a, b) => nextStart(a) - nextStart(b)),
    [events, artist]
  );

  const isOwnPage = Boolean(artist.uid && viewerUid && artist.uid === viewerUid);
  const name = profile?.name ?? artist.name;
  const handle = profile?.handle ? `@${profile.handle}` : releases[0]?.artistHandle;
  const city = profile?.city ?? releases[0]?.city ?? myEvents[0]?.city;
  const state = profile?.state ?? releases[0]?.state ?? myEvents[0]?.state;
  const bio = profile?.bio || releases[0]?.artistBio;
  const links = LINK_LABELS.filter(([key]) => isWebLink(profile?.links?.[key]));
  const supportRelease = releases.find((p) => ownerOf(p as MusicProject & { ownerUid?: string }));
  const canSupport = Boolean(profile?.pixKey && supportRelease);

  const share = async () => {
    const text = `${name} no TN1 Radar`;
    try {
      if (navigator.share) {
        await navigator.share({ title: text, text, url: window.location.origin });
        return;
      }
      await navigator.clipboard.writeText(`${text}: ${window.location.origin}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* share sheet closed */
    }
  };

  return (
    <div className="space-y-5 md:space-y-8 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          aria-label="Voltar"
          className="min-h-[44px] min-w-[44px] px-2 md:px-3 flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white rounded-xl hover:bg-zinc-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>
        <button
          onClick={share}
          aria-label="Compartilhar página"
          className="min-h-[44px] min-w-[44px] px-3 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 rounded-xl border border-zinc-800"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{copied ? 'Link copiado' : 'Compartilhar'}</span>
        </button>
      </div>

      {/* Header: the light of the TN1 pin behind the name */}
      <header className="relative overflow-hidden p-5 md:p-8 bg-zinc-950 border border-zinc-800 rounded-2xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -top-6 opacity-70 scale-[2.2] origin-top-right"
          dangerouslySetInnerHTML={{ __html: pinMarkup(artist.uid ?? artist.name, 'idle', 40, 56) }}
        />
        <div className="relative max-w-2xl space-y-3">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white break-words">{name}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
            {handle && <span>{handle}</span>}
            {city && (
              <span className="flex items-center gap-1 text-zinc-200">
                <MapPin className="w-4 h-4 text-athos-400" /> {city}
                {state ? `, ${state}` : ''}
              </span>
            )}
          </div>
          {bio && <p className="text-base text-zinc-300 leading-relaxed">{bio}</p>}

          {links.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {links.map(([key, label]) => (
                <a
                  key={key}
                  href={profile!.links![key]}
                  target="_blank"
                  rel="noreferrer nofollow"
                  className="min-h-[40px] px-3 flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200"
                >
                  {label} <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                </a>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {canSupport && (
              <button
                onClick={() => onSupport(supportRelease!)}
                className="min-h-[44px] px-5 flex items-center gap-2 rounded-xl bg-ipe hover:brightness-110 text-black text-sm font-bold"
              >
                <Heart className="w-4 h-4" /> Apoiar no Pix
              </button>
            )}
            {isOwnPage && onEditProfile && (
              <button
                onClick={onEditProfile}
                className="min-h-[44px] px-4 flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-semibold text-zinc-200"
              >
                <Pencil className="w-4 h-4" /> Editar perfil
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Releases */}
      <section aria-labelledby="artist-releases" className="space-y-3">
        <h2 id="artist-releases" className="text-lg font-bold text-white">
          Lançamentos
        </h2>
        {releases.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {isOwnPage ? 'Você ainda não publicou música. Use o botão + para pôr sua primeira no mapa.' : 'Nenhuma música publicada ainda.'}
          </p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {releases.map((p) => {
              const playingThis = currentProjectId === p.id && isPlaying;
              return (
                <li key={p.id} className="group bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
                  <button onClick={() => onSelectProject(p)} className="block w-full text-left">
                    <img src={p.coverArt} alt="" className="w-full aspect-square object-cover group-hover:scale-[1.02] transition-transform" />
                  </button>
                  <div className="p-3 flex items-start gap-2">
                    <button onClick={() => onSelectProject(p)} className="flex-1 min-w-0 text-left">
                      <span className="block text-sm font-bold text-white truncate">{p.title}</span>
                      <span className="block text-xs text-zinc-400 truncate">
                        {p.genre} em {p.city}
                      </span>
                    </button>
                    <button
                      onClick={() => (currentProjectId === p.id ? onTogglePlay() : onPlayProject(p))}
                      aria-label={playingThis ? `Pausar ${p.title}` : `Ouvir ${p.title}`}
                      className="min-w-[40px] min-h-[40px] shrink-0 rounded-full bg-athos-600 hover:bg-athos-500 text-white flex items-center justify-center"
                    >
                      {playingThis ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Events */}
      <section aria-labelledby="artist-events" className="space-y-3">
        <h2 id="artist-events" className="text-lg font-bold text-white">
          {isOwnPage ? 'Meus eventos' : 'Próximos eventos'}
        </h2>
        {myEvents.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {isOwnPage ? 'Nenhum evento marcado. Use o botão + e escolha Novo evento.' : 'Nenhum evento marcado.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {myEvents.map((ev) => (
              <li key={ev.id} className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-2xl">
                <span
                  aria-hidden="true"
                  className="shrink-0"
                  dangerouslySetInnerHTML={{ __html: pinMarkup(ev.id, 'idle', 26, 40, 'event') }}
                />
                <button onClick={() => onOpenEvent(ev)} className="flex-1 min-w-0 text-left">
                  <span className="block text-sm font-bold text-white truncate">{ev.title}</span>
                  <span className={`block text-xs truncate ${isEventHappening(ev) ? 'text-ipe' : 'text-zinc-400'}`}>
                    {isEventHappening(ev) ? 'Acontecendo agora' : eventWhen(ev)}
                  </span>
                  <span className="block text-xs text-zinc-500 truncate">
                    {ev.venueName}, {ev.city}
                  </span>
                </button>
                {isOwnPage && (onEditEvent || onDeleteEvent) && (
                  <div className="flex items-center gap-1 shrink-0">
                    {confirmDelete === ev.id ? (
                      <>
                        <button
                          onClick={() => {
                            setConfirmDelete(null);
                            onDeleteEvent?.(ev);
                          }}
                          className="min-h-[40px] px-3 rounded-xl bg-red-900/60 hover:bg-red-800/70 text-red-100 text-xs font-bold"
                        >
                          Apagar
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="min-h-[40px] px-2 text-xs text-zinc-400 hover:text-white">
                          Manter
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onEditEvent?.(ev)}
                          aria-label={`Editar ${ev.title}`}
                          className="min-w-[40px] min-h-[40px] rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center justify-center"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(ev.id)}
                          aria-label={`Apagar ${ev.title}`}
                          className="min-w-[40px] min-h-[40px] rounded-xl text-zinc-400 hover:text-red-200 hover:bg-zinc-900 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {!isOwnPage && releases.length === 0 && myEvents.length === 0 && (
        <p className="flex items-center gap-2 text-sm text-zinc-500">
          <CalendarDays className="w-4 h-4" /> Quando publicar música ou eventos, eles aparecem aqui.
        </p>
      )}
    </div>
  );
};
