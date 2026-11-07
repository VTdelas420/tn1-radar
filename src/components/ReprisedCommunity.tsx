import { useAuth } from '../lib/auth';
import React, { useState } from 'react';
import { useEscape } from '../lib/useEscape';
import { MusicProject, ReprisedReview, UserProfile } from '../types/music';
import {
  Star,
  MessageSquare,
  Play,
  Search,
  MapPin,
  X,
} from 'lucide-react';

interface ReprisedCommunityProps {
  projects: MusicProject[];
  userProfiles: UserProfile[];
  onSelectProject: (project: MusicProject) => void;
  onPlayProject: (project: MusicProject) => void;
  onOpenUserProfile: (profile: UserProfile) => void;
  onAddReview: (review: ReprisedReview) => void;
}

export const ReprisedCommunity: React.FC<ReprisedCommunityProps> = ({
  projects,
  userProfiles,
  onSelectProject,
  onPlayProject,
  onOpenUserProfile,
  onAddReview,
}) => {
  const { requireAccount, profile } = useAuth();
  const allReviews: ReprisedReview[] = projects.flatMap((p) => p.reviews || []);

  const [activeFilter, setActiveFilter] = useState<'all' | '5stars' | '4plus'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showWriteModal, setShowWriteModal] = useState<boolean>(false);
  useEscape(showWriteModal, () => setShowWriteModal(false));

  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [newRating, setNewRating] = useState<number>(5.0);
  const [newReviewText, setNewReviewText] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>('Você');

  const filteredReviews = allReviews.filter((r) => {
    if (activeFilter === '5stars' && r.rating < 5.0) return false;
    if (activeFilter === '4plus' && r.rating < 4.0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const proj = projects.find((p) => p.id === r.projectId);
      const matchText = r.reviewText.toLowerCase().includes(q);
      const matchProject = r.projectTitle.toLowerCase().includes(q);
      const matchCity = proj?.city.toLowerCase().includes(q) || false;
      const matchState = proj?.state.toLowerCase().includes(q) || false;
      const matchArtist = proj?.artistName.toLowerCase().includes(q) || false;
      if (!matchText && !matchProject && !matchCity && !matchState && !matchArtist) {
        return false;
      }
    }
    return true;
  });

  const handlePublishReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    const targetProject = projects.find((p) => p.id === selectedProjectId);
    if (!targetProject) return;

    const newRev: ReprisedReview = {
      id: `rev-${Date.now()}`,
      projectId: targetProject.id,
      projectTitle: targetProject.title,
      userId: `usr-local`,
      userName: reviewerName.trim() || 'Ouvinte Comunitário',
      userHandle: `@${(reviewerName.trim() || 'ouvinte').toLowerCase().replace(/\s+/g, '_')}`,
      rating: newRating,
      reviewText: newReviewText.trim(),
      tags: [targetProject.genre],
      date: 'Agora mesmo',
      likesCount: 0,
      isSupporter: false,
    };

    onAddReview(newRev);
    setNewReviewText('');
    setShowWriteModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Objective Header + 1 Dominant Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Avaliações da Comunidade
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Críticas musicais diretas, sem algoritmos, sem curtidas e sem destaques pagos.
          </p>
        </div>

        <button
          onClick={() => requireAccount('review', () => setShowWriteModal(true))}
          className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 bg-athos-600 hover:bg-athos-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all active:scale-95 shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Escrever Avaliação</span>
        </button>
      </div>

      {/* User-Driven Navigation & Filter Bar (Zero Featured Profiles, 100% Navigation & Evaluation) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-7 relative">
          <Search className="w-4 h-4 text-athos-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar avaliações por cidade, estado, artista ou álbum..."
            aria-label="Filtrar avaliações por cidade, estado, artista ou álbum"
            className="w-full min-h-[44px] pl-10 pr-8 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-athos-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Limpar filtro"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="md:col-span-5 flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl min-h-[44px]">
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex-1 min-h-[36px] px-3 text-xs font-semibold rounded-lg transition-colors ${
              activeFilter === 'all'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setActiveFilter('5stars')}
            className={`flex-1 min-h-[36px] px-3 text-xs font-semibold rounded-lg transition-colors ${
              activeFilter === '5stars'
                ? 'bg-zinc-800 text-amber-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Nota 5.0 ★
          </button>
          <button
            onClick={() => setActiveFilter('4plus')}
            className={`flex-1 min-h-[36px] px-3 text-xs font-semibold rounded-lg transition-colors ${
              activeFilter === '4plus'
                ? 'bg-zinc-800 text-athos-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Nota 4.0+ ★
          </button>
        </div>
      </div>

      {/* Clean, High-Legibility Reviews Feed (Zero Likes, Zero Financial Badges) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReviews.map((review) => {
          const project = projects.find((p) => p.id === review.projectId);
          const authorProfile = userProfiles.find((u) => u.id === review.userId);

          return (
            <article
              key={review.id}
              className="p-5 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors"
            >
              <div className="space-y-3">
                {/* Reviewer & Score */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => authorProfile && onOpenUserProfile(authorProfile)}
                    className="flex items-center gap-2.5 min-w-0 text-left group"
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-200 shrink-0 group-hover:border-athos-400 transition-colors">
                      {review.userName[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-semibold text-white group-hover:text-athos-300 truncate transition-colors">
                          {review.userName}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500">{review.date}</span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 text-amber-400 font-bold text-xs tabular-nums shrink-0">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{review.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Review Prose */}
                <p className="text-[15px] text-zinc-200 leading-relaxed">
                  “{review.reviewText}”
                </p>
              </div>

              {/* Linked Album Row (Only Music & Geographic Origin — No Likes) */}
              <div className="pt-3 border-t border-zinc-900 flex items-center justify-between gap-3">
                {project ? (
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      onClick={() => onPlayProject(project)}
                      className="min-w-[40px] min-h-[40px] rounded-xl bg-zinc-900 hover:bg-athos-600 text-zinc-200 hover:text-white flex items-center justify-center transition-colors shrink-0"
                      aria-label={`Ouvir ${project.title}`}
                    >
                      <Play className="w-4 h-4 fill-current translate-x-0.5" />
                    </button>
                    <button
                      onClick={() => onSelectProject(project)}
                      className="min-w-0 text-left group"
                    >
                      <div className="text-xs font-semibold text-white group-hover:text-athos-400 truncate transition-colors">
                        {project.title}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">
                        {project.artistName}
                      </div>
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-400">{review.projectTitle}</span>
                )}

                {project && (
                  <span className="flex items-center gap-1 text-xs text-zinc-400 shrink-0">
                    <MapPin className="w-3 h-3 text-athos-400" />
                    <span>
                      {project.city}, {project.state}
                    </span>
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Write Review Modal */}
      {showWriteModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">
                Escrever Avaliação
              </h3>
              <button
                onClick={() => setShowWriteModal(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center text-zinc-400 hover:text-white rounded-lg"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishReview} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                  Projeto
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-athos-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} — {p.artistName} ({p.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                  Sua Nota
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setNewRating(starVal)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-400/50 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          starVal <= newRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-amber-400 ml-2">
                    {newRating.toFixed(1)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-400">
                Publicando como <span className="text-white font-semibold">{profile ? `${profile.name} (@${profile.handle})` : 'você'}</span>
              </p>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                  Sua Avaliação *
                </label>
                <textarea
                  required
                  rows={4}
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="O que mais chamou sua atenção na produção e nas faixas?"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-athos-500 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowWriteModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
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
