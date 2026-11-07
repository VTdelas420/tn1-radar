import { useAuth } from '../lib/auth';
import { reportContent } from '../lib/persistence';
import React, { useState } from 'react';
import { useEscape } from '../lib/useEscape';
import { MusicProject, ReprisedReview } from '../types/music';
import {
  Play,
  Pause,
  ShoppingBag,
  MapPin,
  Share2,
  CheckCircle2,
  ArrowLeft,
  Star,
  MessageSquare,
  Bookmark,
  X,
  Flag,
  Library,
  Heart,
} from 'lucide-react';
import { formatBrl, calculateInstallments } from '../utils/monetization';

interface ProjectDetailViewProps {
  project: MusicProject;
  isPlaying: boolean;
  currentTrackIndex: number;
  currentProjectId?: string;
  isSaved?: boolean;
  onPlayTrack: (trackIndex: number) => void;
  onTogglePlay: () => void;
  onBack: () => void;
  onOpenCheckout: (project: MusicProject) => void;
  inLibrary?: boolean;
  onToggleLibrary?: (projectId: string) => void;
  onAddReview: (review: ReprisedReview) => void;
  onToggleSave?: (projectId: string) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  isPlaying,
  currentTrackIndex,
  currentProjectId,
  isSaved,
  onPlayTrack,
  onTogglePlay,
  onBack,
  onOpenCheckout,
  inLibrary,
  onToggleLibrary,
  onAddReview,
  onToggleSave,
}) => {
  const { requireAccount, profile } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  useEscape(reportOpen, () => setReportOpen(false));
  const [reportReason, setReportReason] = useState('');
  const [reportState, setReportState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportState('sending');
    try {
      await reportContent('project', project.id, project.title, reportReason);
      setReportState('sent');
      setReportReason('');
    } catch (err) {
      console.error(err);
      setReportState('error');
    }
  };
  const [copiedLink, setCopiedLink] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  useEscape(showReviewModal, () => setShowReviewModal(false));
  const [reviewScore, setReviewScore] = useState(5.0);
  const [reviewText, setReviewText] = useState('');
  const [reviewerName, setReviewerName] = useState('');

  const isCurrentActive = currentProjectId === project.id;
  const installments = calculateInstallments(project.priceBrl, 6);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePublishReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    const newRev: ReprisedReview = {
      id: `rev-${Date.now()}`,
      projectId: project.id,
      projectTitle: project.title,
      userId: `usr-local`,
      userName: reviewerName.trim() || 'Ouvinte Comunitário',
      userHandle: `@${(reviewerName.trim() || 'ouvinte').toLowerCase().replace(/\s+/g, '_')}`,
      rating: reviewScore,
      reviewText: reviewText.trim(),
      tags: [project.genre],
      date: 'Hoje',
      likesCount: 1,
      isSupporter: true,
    };

    onAddReview(newRev);
    setReviewText('');
    setShowReviewModal(false);
  };

  return (
    <div className="space-y-5 md:space-y-8 animate-in fade-in duration-200">
      {/* Top Action Bar (Fitts's Law >= 44px targets) */}
      <div className="flex items-center justify-between gap-2 md:gap-4">
        <button
          onClick={onBack}
          aria-label="Voltar ao Mapa"
          className="min-h-[44px] min-w-[44px] px-2 md:px-3 flex shrink-0 items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white rounded-xl hover:bg-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Voltar ao Mapa</span>
          <span className="sm:hidden">Mapa</span>
        </button>

        <div className="flex items-center gap-1.5 md:gap-2">
          {onToggleSave && (
            <button
              onClick={() => onToggleSave(project.id)}
              className={`min-h-[44px] flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                isSaved
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'Salvo' : 'Salvar'}</span>
            </button>
          )}

          <button
            onClick={handleCopyLink}
            className="min-h-[44px] min-w-[44px] justify-center flex items-center gap-2 px-3 md:px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 rounded-xl border border-zinc-800 transition-colors"
            aria-label="Compartilhar"
          >
            {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copiado' : 'Compartilhar'}</span>
          </button>

          <button
            onClick={() =>
              requireAccount('report', () => {
                setReportState('idle');
                setReportOpen(true);
              })
            }
            className="min-h-[44px] min-w-[44px] justify-center flex items-center gap-2 px-2 md:px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-red-200 rounded-xl transition-colors"
            aria-label="Denunciar este lançamento"
          >
            <Flag className="w-4 h-4" />
            <span className="hidden sm:inline">Denunciar</span>
          </button>
        </div>
      </div>

      {reportOpen && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center p-3 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md">
          <form
            onSubmit={handleSendReport}
            role="dialog"
            aria-modal="true"
            aria-label="Denunciar lançamento"
            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3 my-auto"
          >
            <h3 className="text-base font-bold text-white">Denunciar "{project.title}"</h3>
            {reportState === 'sent' ? (
              <p className="text-sm text-emerald-300">Denúncia enviada. A moderação vai analisar.</p>
            ) : (
              <>
                <p className="text-xs text-zinc-400">
                  Conte o motivo: conteúdo ofensivo, música de outra pessoa, artista de fora da região, spam…
                </p>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-athos-500"
                />
                {reportState === 'error' && (
                  <p className="text-xs text-red-300">Não foi possível enviar. Tente de novo.</p>
                )}
              </>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="min-h-[44px] px-4 text-sm text-zinc-400 hover:text-white"
              >
                {reportState === 'sent' ? 'Fechar' : 'Cancelar'}
              </button>
              {reportState !== 'sent' && (
                <button
                  type="submit"
                  disabled={reportState === 'sending'}
                  className="min-h-[44px] px-5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-bold disabled:opacity-50"
                >
                  {reportState === 'sending' ? 'Enviando…' : 'Enviar denúncia'}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Main 2-Column Split: Artwork & Identity on Left, Immediate Tracklist & Purchase CTA on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cover Art + Core Metadata */}
        <div className="lg:col-span-5 space-y-5">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl">
            <img
              src={project.coverArt}
              alt={project.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-5 bg-zinc-950 border border-zinc-800/80 rounded-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
              <MapPin className="w-3.5 h-3.5 text-athos-400 shrink-0" />
              <span className="text-zinc-200 font-medium">
                {project.city}, {project.state || project.country}
              </span>
              <span>{project.genre}</span>
              <span className="text-zinc-500">{project.catalogNumber}</span>
            </div>

            <p className="text-[15px] text-zinc-300 leading-relaxed">
              {project.description}
            </p>

            {project.linerNotes && (
              <p className="text-xs text-zinc-500 pt-2 border-t border-zinc-900 leading-relaxed">
                {project.linerNotes}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Title, Community Evaluation, Primary Access Box, and Direct Tracklist */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {project.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400 mt-2 tabular-nums">
              <span className="text-zinc-200 font-semibold">{project.artistName}</span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-current" />
                {project.stats.averageRating.toFixed(1)} nas avaliações
              </span>
              <span className="text-zinc-300">
                {project.tracks.length} {project.tracks.length === 1 ? 'faixa' : 'faixas'}
              </span>
            </div>
          </div>

          {/* Primary Action Card (Anchoring + Reciprocity + Von Restorff CTA) */}
          <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-zinc-400">Ouvir é livre</div>
              <div className="text-lg font-extrabold text-white mt-0.5">Apoie o artista direto no Pix</div>
              <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Tudo vai para o artista, sem taxa</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              {onToggleLibrary && (
                <button
                  onClick={() => onToggleLibrary(project.id)}
                  aria-pressed={Boolean(inLibrary)}
                  className={`min-h-[48px] px-5 py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    inLibrary
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:border-athos-500'
                  }`}
                >
                  {inLibrary ? <CheckCircle2 className="w-4 h-4" /> : <Library className="w-4 h-4" />}
                  <span>{inLibrary ? 'Na biblioteca' : 'Adicionar à biblioteca'}</span>
                </button>
              )}
              <button
                onClick={() => onOpenCheckout(project)}
                className="min-h-[48px] px-6 py-3 bg-ipe hover:brightness-110 text-black font-bold text-sm rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4" />
                <span>Apoiar com Pix</span>
              </button>
            </div>
          </div>


          {/* Tracklist right in the first viewport (Zero unnecessary scrolling) */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h2 className="text-sm font-bold text-white">
                Faixas ({project.tracks.length})
              </h2>
              <span className="text-xs text-zinc-500">{project.audioQuality}</span>
            </div>

            <div className="divide-y divide-zinc-900">
              {project.tracks.map((track, idx) => {
                const isPlayingThisTrack = isCurrentActive && isPlaying && currentTrackIndex === idx;

                return (
                  <div
                    key={track.id}
                    onClick={() => {
                      if (isCurrentActive && currentTrackIndex === idx) {
                        onTogglePlay();
                      } else {
                        onPlayTrack(idx);
                      }
                    }}
                    className={`min-h-[56px] py-2.5 px-3 rounded-xl flex items-center gap-3.5 cursor-pointer transition-colors ${
                      isPlayingThisTrack ? 'bg-zinc-900' : 'hover:bg-zinc-900/50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrentActive && currentTrackIndex === idx) {
                          onTogglePlay();
                        } else {
                          onPlayTrack(idx);
                        }
                      }}
                      className={`min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center shrink-0 transition-transform ${
                        isPlayingThisTrack
                          ? 'bg-athos-600 text-white scale-105'
                          : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                      }`}
                      aria-label={isPlayingThisTrack ? `Pausar ${track.title}` : `Tocar ${track.title}`}
                    >
                      {isPlayingThisTrack ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current translate-x-0.5" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {track.trackNumber}. {track.title}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {track.bpm} BPM, {track.keySignature}
                        {track.audioFileName ? `, ${track.audioFileName}` : ''}
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-1 h-7 w-32 px-2 overflow-hidden">
                      {track.waveform.slice(0, 20).map((bar, barIdx) => (
                        <div
                          key={barIdx}
                          style={{ height: `${bar}%` }}
                          className={`flex-1 min-w-[2px] rounded-full ${
                            isPlayingThisTrack ? 'bg-athos-400' : 'bg-zinc-700'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="text-xs text-zinc-400 tabular-nums shrink-0">
                      {Math.floor(track.durationSec / 60)}:
                      {(track.durationSec % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Physical Editions with Scarcity Signal */}
          {project.physicalMerch && project.physicalMerch.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {project.physicalMerch.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{item.title}</div>
                    <div className="text-xs text-zinc-400 mt-0.5 tabular-nums">
                      {formatBrl(item.priceBrl)}. <span className="text-amber-400">Restam {item.stock}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenCheckout(project)}
                    className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl border border-zinc-700 transition-colors shrink-0"
                  >
                    Reservar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Community Reviews Section */}
      <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-lg font-bold text-white">
              Avaliações ({project.reviews.length})
            </h3>
            <p className="text-xs text-zinc-400">
              Nota média de {project.stats.averageRating.toFixed(1)} estrelas atribuída pela comunidade.
            </p>
          </div>

          <button
            onClick={() => requireAccount('review', () => setShowReviewModal(true))}
            className="min-h-[44px] flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold border border-zinc-700 transition-colors shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Avaliar este Projeto</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-white">{rev.userName}</span>
                  <span className="text-zinc-500">{rev.date}</span>
                </div>

                <div className="flex items-center gap-1 text-amber-400 font-bold text-xs tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{rev.rating.toFixed(1)}</span>
                </div>
              </div>

              <p className="text-[15px] text-zinc-200 leading-relaxed">
                “{rev.reviewText}”
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal to Write Review */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">
                Avaliar {project.title}
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center text-zinc-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishReview} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                  Nota
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewScore(star)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= reviewScore ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-amber-400 ml-2">
                    {reviewScore.toFixed(1)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-400">
                Publicando como <span className="text-white font-semibold">{profile ? `${profile.name} (@${profile.handle})` : 'você'}</span>
              </p>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                  Sua Resenha *
                </label>
                <textarea
                  required
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Compartilhe sua impressão sobre as faixas..."
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2.5 bg-athos-600 hover:bg-athos-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors"
                >
                  Publicar Avaliação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
