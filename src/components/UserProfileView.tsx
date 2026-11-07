import React, { useState } from 'react';
import { UserProfile, MusicProject, ReprisedReview } from '../types/music';
import {
  User,
  Star,
  MapPin,
  Calendar,
  Disc3,
  Play,
  Pause,
  ShoppingBag,
  Download,
  Bookmark,
  Trash2,
  Plus,
  Edit3,
  CheckCircle2,
  Search,
  Sparkles,
  ArrowUpRight,
  SlidersHorizontal,
  BarChart3,
  Radio,
  Layers,
} from 'lucide-react';
import { formatBrl } from '../utils/monetization';
import { AnalyticsDashboard } from './AnalyticsDashboard';

interface UserProfileViewProps {
  user: UserProfile;
  allProjects: MusicProject[];
  currentProjectId?: string;
  isPlaying: boolean;
  onPlayProject: (project: MusicProject, trackIdx?: number) => void;
  onTogglePlay: () => void;
  onSelectProject: (project: MusicProject) => void;
  onOpenCheckout: (project: MusicProject) => void;
  onUpdateTopFavorites: (newFavorites: string[]) => void;
  onToggleSaveProject: (projectId: string) => void;
  onAddNewReview?: (review: ReprisedReview) => void;
  artistBalanceBrl: number;
  payoutHistory: {
    id: string;
    amount: number;
    method: string;
    destination: string;
    txHash: string;
    timestamp: string;
    status: 'completed' | 'processing';
  }[];
  onExecutePayout: (amount: number, method: string, destination: string) => Promise<boolean>;
  onOpenNewProject: () => void;
  /** Real accounts: payments are not live yet, so the simulated balance/payout tab is hidden. */
  hideEarnings?: boolean;
  onEditProfile?: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  allProjects,
  currentProjectId,
  isPlaying,
  onPlayProject,
  onTogglePlay,
  onSelectProject,
  onOpenCheckout,
  onUpdateTopFavorites,
  onToggleSaveProject,
  artistBalanceBrl,
  payoutHistory,
  onExecutePayout,
  onOpenNewProject,
  hideEarnings = false,
  onEditProfile,
}) => {
  type ProfileSubTab = 'library' | 'reviews' | 'saved' | 'my_projects' | 'earnings';
  const [activeSubTab, setActiveSubTab] = useState<ProfileSubTab>('library');
  const [isEditingTop5ModalOpen, setIsEditingTop5ModalOpen] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Top 5 slots resolution
  const top5Projects = (user.topFavorites || []).map((id) =>
    allProjects.find((p) => p.id === id)
  );

  // Library projects
  const libraryProjects = allProjects.filter((p) =>
    user.libraryProjectIds?.includes(p.id)
  );

  // Saved / wishlist projects
  const savedProjects = allProjects.filter((p) =>
    user.savedProjectIds?.includes(p.id)
  );

  // User reviews
  const userReviews = user.recentReviews || [];

  // User's own launched or in-progress projects
  const myProjects = allProjects.filter(
    (p) =>
      (user.createdProjectIds && user.createdProjectIds.includes(p.id)) ||
      p.artistHandle.toLowerCase() === user.handle.toLowerCase()
  );
  const hasLaunchedProjects = myProjects.length > 0;

  // Simulate FLAC download
  const handleDownloadFlac = (project: MusicProject) => {
    setDownloadNotice(
      `Iniciando download de "${project.title}" em ${project.audioQuality} (.zip com metadados e encarte)...`
    );
    setTimeout(() => {
      setDownloadNotice(null);
    }, 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notice for Lossless Downloads */}
      {downloadNotice && (
        <div className="fixed top-18 right-6 z-50 max-w-md bg-zinc-900 border border-emerald-500/60 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <Download className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
          <p className="text-xs text-zinc-200 font-medium leading-tight">{downloadNotice}</p>
        </div>
      )}

      {/* Clean Profile Header (Miller's Law: Essential Identity + 3 Core Counters) */}
      <section className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-2xl font-bold text-white shrink-0">
            {user.name.charAt(0)}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {user.name}
              </h1>
              <span className="text-xs font-mono text-zinc-400">
                {user.handle}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              {user.city && (
                <>
                  <span className="text-zinc-200">{user.city}, {user.state}</span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span>Desde {user.joinedDate}</span>
            </div>

            <p className="text-sm text-zinc-300 max-w-xl leading-relaxed pt-0.5">
              {user.bio}
            </p>
          </div>
        </div>

        {/* Musical Identity & Genres (Zero Vanity Numbers) */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
          {onEditProfile && (
            <button
              onClick={onEditProfile}
              className="min-h-[40px] px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-semibold hover:border-sky-500"
            >
              Editar perfil
            </button>
          )}
          {user.favoriteGenres.map((genre) => (
            <span
              key={genre}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-medium"
            >
              {genre}
            </span>
          ))}
        </div>
      </section>

      {/* Top 5 Favorite Albums Shelf */}
      <section className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Meus 5 Álbuns Favoritos
            </h2>
            <p className="text-xs text-zinc-400">
              Sua seleção pessoal de obras independentes.
            </p>
          </div>

          <button
            onClick={() => setIsEditingTop5ModalOpen(true)}
            className="min-h-[44px] flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-100 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl transition-all shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5 text-sky-400" />
            <span>Editar Top 5</span>
          </button>
        </div>

        {/* 5 Spotlight Slots Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 md:gap-4">
          {[0, 1, 2, 3, 4].map((slotIdx) => {
            const project = top5Projects[slotIdx];
            const isThisPlaying = project && currentProjectId === project.id && isPlaying;

            if (project) {
              return (
                <div
                  key={`slot-${slotIdx}-${project.id}`}
                  className="group relative flex flex-col bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 rounded-xl overflow-hidden transition-all duration-200"
                >
                  {/* Artwork Container */}
                  <div
                    className="relative aspect-square w-full bg-zinc-950 overflow-hidden cursor-pointer"
                    onClick={() => onSelectProject(project)}
                  >
                    <img
                      src={project.coverArt}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Number Badge (1 to 5) */}
                    <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-black/85 backdrop-blur-md border border-amber-500/40 text-amber-400 font-mono font-extrabold text-xs flex items-center justify-center shadow-lg">
                      #{slotIdx + 1}
                    </div>

                    {/* Play Overlay */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isThisPlaying) {
                          onTogglePlay();
                        } else {
                          onPlayProject(project);
                        }
                      }}
                      className={`absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xl ${
                        isThisPlaying
                          ? 'bg-white text-zinc-950 scale-100 opacity-100'
                          : 'bg-zinc-900/90 text-white hover:bg-white hover:text-zinc-950 opacity-0 group-hover:opacity-100 hover:scale-105'
                      }`}
                      aria-label={isThisPlaying ? `Pausar ${project.title}` : `Tocar ${project.title}`}
                    >
                      {isThisPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current translate-x-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col justify-between flex-1">
                    <div>
                      <h3
                        onClick={() => onSelectProject(project)}
                        className="text-xs font-bold text-white group-hover:text-amber-300 truncate cursor-pointer"
                      >
                        {project.title}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-400 truncate mt-0.5">
                        <span>{project.artistName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 mt-1">
                        <MapPin className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{project.city}</span>
                        <span>·</span>
                        <span className="text-amber-400 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          {project.stats.averageRating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => onSelectProject(project)}
                        className="text-zinc-400 hover:text-white transition-colors"
                      >
                        Ver detalhes
                      </button>
                      <button
                        onClick={() => setIsEditingTop5ModalOpen(true)}
                        className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300"
                        title="Substituir álbum neste slot"
                      >
                        Trocar
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // Empty Slot Placeholder
            return (
              <button
                key={`empty-slot-${slotIdx}`}
                onClick={() => setIsEditingTop5ModalOpen(true)}
                className="group flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-900/30 rounded-xl p-6 text-center transition-all min-h-[220px]"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-amber-400 group-hover:border-amber-500/40 transition-colors mb-2">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-zinc-400 group-hover:text-white">
                  Favorito #{slotIdx + 1}
                </span>
                <span className="text-[11px] text-zinc-600 mt-1">
                  Clique para escolher
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* SUB-TABS: BIBLIOTECA // AVALIAÇÕES // SALVOS */}
      <section className="space-y-6">
        {/* Tab Headers */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('library')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeSubTab === 'library'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Disc3 className="w-4 h-4 text-emerald-400" />
            <span>Minha Biblioteca</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-md bg-zinc-900 text-[10px] font-mono text-zinc-300">
              {libraryProjects.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('reviews')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeSubTab === 'reviews'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Star className="w-4 h-4 text-amber-400" />
            <span>Minhas Avaliações (Reprised)</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-md bg-zinc-900 text-[10px] font-mono text-zinc-300">
              {userReviews.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('saved')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeSubTab === 'saved'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Bookmark className="w-4 h-4 text-zinc-300" />
            <span>Salvos / Quero Ouvir</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-md bg-zinc-900 text-[10px] font-mono text-zinc-300">
              {savedProjects.length}
            </span>
          </button>

          {/* MEUS PROJETOS: CONDITIONAL TAB */}
          {/* Aparece exclusivamente para quem já lançou ou está trabalhando em projetos */}
          {hasLaunchedProjects && (
            <button
              onClick={() => setActiveSubTab('my_projects')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeSubTab === 'my_projects'
                  ? 'bg-zinc-800 text-purple-300 shadow-sm border border-purple-500/30'
                  : 'text-zinc-400 hover:text-purple-300 hover:bg-zinc-900/60'
              }`}
            >
              <Radio className="w-4 h-4 text-purple-400" />
              <span>Meus Projetos</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-md bg-purple-950/80 border border-purple-800/60 text-[10px] font-mono text-purple-300 font-bold">
                {myProjects.length}
              </span>
            </button>
          )}

          {/* LUCROS & PIX: MOVED INTO PERFIL */}
          {!hideEarnings && (
          <button
            onClick={() => setActiveSubTab('earnings')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeSubTab === 'earnings'
                ? 'bg-zinc-800 text-emerald-300 shadow-sm border border-emerald-500/30'
                : 'text-zinc-400 hover:text-emerald-300 hover:bg-zinc-900/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Lucros & Pix</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-md bg-zinc-900 text-[10px] font-mono text-emerald-400 font-bold">
              {formatBrl(artistBalanceBrl)}
            </span>
          </button>
          )}
        </div>

        {/* 1. MINHA BIBLIOTECA (Purchased/Unlocked) */}
        {activeSubTab === 'library' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span>LANÇAMENTOS ADQUIRIDOS ({libraryProjects.length})</span>
              <span className="text-emerald-400">Streaming Ilimitado + Download Lossless FLAC</span>
            </div>

            {libraryProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {libraryProjects.map((project) => {
                  const isThisPlaying = currentProjectId === project.id && isPlaying;

                  return (
                    <div
                      key={project.id}
                      className="p-4 bg-zinc-950 border border-zinc-800/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-zinc-700 transition-colors"
                    >
                      <div
                        className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-zinc-900 shrink-0 cursor-pointer group"
                        onClick={() => onSelectProject(project)}
                      >
                        <img
                          src={project.coverArt}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isThisPlaying) onTogglePlay();
                            else onPlayProject(project);
                          }}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {isThisPlaying ? (
                            <Pause className="w-6 h-6 fill-current" />
                          ) : (
                            <Play className="w-6 h-6 fill-current" />
                          )}
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 font-bold">
                            Na Sua Biblioteca
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500">
                            {project.audioQuality}
                          </span>
                        </div>

                        <h3
                          onClick={() => onSelectProject(project)}
                          className="text-sm font-bold text-white hover:text-emerald-300 cursor-pointer truncate mt-1"
                        >
                          {project.title}
                        </h3>

                        <p className="text-xs text-zinc-400 truncate">
                          {project.artistName} · {project.city}, {project.state || project.country}
                        </p>

                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <button
                            onClick={() => {
                              if (isThisPlaying) onTogglePlay();
                              else onPlayProject(project);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-lg transition-colors"
                          >
                            {isThisPlaying ? (
                              <>
                                <Pause className="w-3.5 h-3.5 fill-current" />
                                <span>Pausar</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Ouvir</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDownloadFlac(project)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 hover:text-white border border-zinc-800 rounded-lg transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Baixar FLAC (Zip)</span>
                          </button>

                          <button
                            onClick={() => onSelectProject(project)}
                            className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                          >
                            Ver detalhes
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center bg-zinc-950 border border-zinc-800/80 rounded-2xl space-y-3">
                <Disc3 className="w-10 h-10 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">Sua biblioteca está vazia</h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Apoie lançamentos no mapa ou baixe os projetos gratuitos para tê-los salvos com qualidade FLAC master em sua conta.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 2. MINHAS AVALIAÇÕES (Reprised style diary) */}
        {activeSubTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span>CRÍTICAS & NOTAS ATRIBUÍDAS ({userReviews.length})</span>
              <span className="text-amber-400">Padrão Reprised.app</span>
            </div>

            {userReviews.length > 0 ? (
              <div className="space-y-3">
                {userReviews.map((rev) => {
                  const proj = allProjects.find((p) => p.id === rev.projectId);

                  return (
                    <div
                      key={rev.id}
                      className="p-5 bg-zinc-950 border border-zinc-800/80 rounded-2xl space-y-3 hover:border-zinc-700/80 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {proj && (
                            <img
                              src={proj.coverArt}
                              alt={proj.title}
                              className="w-10 h-10 rounded-lg object-cover cursor-pointer"
                              onClick={() => onSelectProject(proj)}
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4
                                onClick={() => proj && onSelectProject(proj)}
                                className="text-sm font-bold text-white hover:text-amber-300 cursor-pointer"
                              >
                                {rev.projectTitle}
                              </h4>
                              {proj && (
                                <span className="text-xs text-zinc-400">
                                  por {proj.artistName}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                              <span>{rev.date}</span>
                              {proj && (
                                <>
                                  <span>·</span>
                                  <span>{proj.city}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Star Rating */}
                        <div className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1 bg-amber-950/30 border border-amber-800/30 rounded-lg text-amber-400 font-mono font-bold text-xs">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{rev.rating.toFixed(1)} / 5.0</span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans pl-1 border-l-2 border-zinc-800">
                        "{rev.reviewText}"
                      </p>

                      <div className="flex items-center justify-between pt-2 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {rev.tags?.map((t) => (
                            <span
                              key={t}
                              className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>

                        {proj && (
                          <button
                            onClick={() => onPlayProject(proj)}
                            className="flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-white"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Tocar álbum</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center bg-zinc-950 border border-zinc-800/80 rounded-2xl space-y-3">
                <Star className="w-10 h-10 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">Nenhuma crítica escrita ainda</h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Abra qualquer projeto na plataforma e clique em "Avaliar este Projeto" para compartilhar sua percepção sonora com a comunidade.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3. SALVOS / QUERO OUVIR (Wishlist of interested projects) */}
        {activeSubTab === 'saved' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span>PROJETOS DE INTERESSE ({savedProjects.length})</span>
              <span className="text-zinc-400">Salve para ouvir com calma ou apoiar mais tarde</span>
            </div>

            {savedProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 bg-zinc-950 border border-zinc-800/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-zinc-700 transition-colors"
                  >
                    <div
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-zinc-900 shrink-0 cursor-pointer group"
                      onClick={() => onSelectProject(project)}
                    >
                      <img
                        src={project.coverArt}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-zinc-400">
                          {project.genre}
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          {project.pricingModel === 'free' ? (
                            <span className="text-emerald-400">Gratuito</span>
                          ) : (
                            <span>{formatBrl(project.priceBrl)}</span>
                          )}
                        </span>
                      </div>

                      <h3
                        onClick={() => onSelectProject(project)}
                        className="text-sm font-bold text-white hover:text-amber-300 cursor-pointer truncate mt-0.5"
                      >
                        {project.title}
                      </h3>

                      <p className="text-xs text-zinc-400 truncate">
                        {project.artistName} · {project.city}, {project.state || project.country}
                      </p>

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <button
                          onClick={() => onPlayProject(project)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-lg transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Ouvir</span>
                        </button>

                        <button
                          onClick={() => onOpenCheckout(project)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold rounded-lg transition-all active:scale-95 shadow-sm"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{project.pricingModel === 'free' ? 'Baixar' : 'Comprar Agora'}</span>
                        </button>

                        <button
                          onClick={() => onToggleSaveProject(project.id)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors ml-auto"
                          title="Remover dos salvos"
                          aria-label="Remover dos salvos"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-zinc-950 border border-zinc-800/80 rounded-2xl space-y-3">
                <Bookmark className="w-10 h-10 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">Nenhum projeto salvo no momento</h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Ao navegar pelo mapa regional ou pelos lançamentos, clique no ícone de marcador para salvar álbuns que você quer ouvir ou comprar depois.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 4. MEUS PROJETOS: CONDITIONAL TAB BODY */}
        {/* Apenas para quem já lançou um projeto ou está trabalhando em algum */}
        {activeSubTab === 'my_projects' && hasLaunchedProjects && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 bg-zinc-950 border border-zinc-800/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-purple-400 mb-1">
                  <Radio className="w-3.5 h-3.5" />
                  <span>HUB DO ARTISTA // MEUS PROJETOS</span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Projetos & Lançamentos Independentes ({myProjects.length})
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Gerencie cápsulas sonoras, áudio lossless master e acompanhe o apoio direto recebido pelo mapa do Brasil.
                </p>
              </div>

              <button
                onClick={onOpenNewProject}
                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Lançamento</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {myProjects.map((proj) => {
                const isThisPlaying = currentProjectId === proj.id && isPlaying;

                return (
                  <div
                    key={proj.id}
                    className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:border-zinc-700/80 transition-all"
                  >
                    <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                      <div
                        className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-zinc-900 shrink-0 cursor-pointer group shadow-lg"
                        onClick={() => onSelectProject(proj)}
                      >
                        <img
                          src={proj.coverArt}
                          alt={proj.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isThisPlaying) onTogglePlay();
                            else onPlayProject(proj);
                          }}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {isThisPlaying ? (
                            <Pause className="w-6 h-6 fill-current" />
                          ) : (
                            <Play className="w-6 h-6 fill-current" />
                          )}
                        </button>
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 font-bold">
                            Lançado no Mapa ({proj.city}, {proj.state})
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                            {proj.catalogNumber}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {proj.audioQuality}
                          </span>
                        </div>

                        <h4
                          onClick={() => onSelectProject(proj)}
                          className="text-base font-bold text-white hover:text-purple-300 cursor-pointer truncate"
                        >
                          {proj.title}
                        </h4>

                        <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                          <span>{proj.genre}</span>
                          <span>·</span>
                          <span>{proj.tracks.length} {proj.tracks.length === 1 ? 'faixa' : 'faixas'}</span>
                          <span>·</span>
                          <span className="text-amber-400">★ {proj.stats.averageRating.toFixed(1)} ({proj.reviews.length} avaliações)</span>
                        </div>

                        {/* Versions */}
                        <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-zinc-500">
                          <span>Versões:</span>
                          {proj.versions.map((v) => (
                            <span key={v.id} className="text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                              {v.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Financial & Performance Stats for this Project */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 w-full lg:w-auto shrink-0 justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-zinc-800">
                      <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-center min-w-[200px]">
                        <div>
                          <span className="text-sm font-bold font-mono text-white block">
                            {formatBrl(proj.stats.grossRevenueBrl)}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">
                            Arrecadação
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-bold font-mono text-emerald-400 block">
                            {formatBrl(proj.stats.netArtistRevenueBrl)}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">
                            90% Artista (Pix)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (isThisPlaying) onTogglePlay();
                            else onPlayProject(proj);
                          }}
                          className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          {isThisPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                          <span>{isThisPlaying ? 'Pausar' : 'Ouvir Master'}</span>
                        </button>
                        <button
                          onClick={() => onSelectProject(proj)}
                          className="px-3 py-2 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-xl transition-colors shadow-sm"
                        >
                          Página do Projeto
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. LUCROS & PIX: DENTRO DO PERFIL */}
        {activeSubTab === 'earnings' && !hideEarnings && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <AnalyticsDashboard
              projects={myProjects.length > 0 ? myProjects : allProjects}
              artistBalanceBrl={artistBalanceBrl}
              onExecutePayout={onExecutePayout}
              payoutHistory={payoutHistory}
            />
          </div>
        )}
      </section>

      {/* MODAL: EDITAR TOP 5 ÁLBUNS FAVORITOS */}
      {isEditingTop5ModalOpen && (
        <EditTop5Modal
          allProjects={allProjects}
          currentTopFavorites={user.topFavorites || []}
          onClose={() => setIsEditingTop5ModalOpen(false)}
          onSave={(newFavs) => {
            onUpdateTopFavorites(newFavs);
            setIsEditingTop5ModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

// Sub-component: Edit Top 5 Albums Modal
interface EditTop5ModalProps {
  allProjects: MusicProject[];
  currentTopFavorites: string[];
  onClose: () => void;
  onSave: (favorites: string[]) => void;
}

const EditTop5Modal: React.FC<EditTop5ModalProps> = ({
  allProjects,
  currentTopFavorites,
  onClose,
  onSave,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([
    ...currentTopFavorites,
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSlotToSelect, setActiveSlotToSelect] = useState<number | null>(null);

  const filteredProjects = allProjects.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.artistName.toLowerCase().includes(q) ||
      p.genre.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q)
    );
  });

  const handleSetSlotProject = (slotIdx: number, projectId: string) => {
    const updated = [...selectedIds];
    // Remove if already in another slot
    const existingIdx = updated.indexOf(projectId);
    if (existingIdx !== -1 && existingIdx !== slotIdx) {
      updated[existingIdx] = '';
    }
    updated[slotIdx] = projectId;
    setSelectedIds(updated.filter(Boolean));
    setActiveSlotToSelect(null);
  };

  const handleClearSlot = (slotIdx: number) => {
    const updated = [...selectedIds];
    updated.splice(slotIdx, 1);
    setSelectedIds(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CURADORIA PESSOAL</span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              Editar Meus 5 Álbuns Favoritos
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-sm font-mono px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Current 5 Slots Status */}
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/30">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-2.5">
            Álbuns Favoritos no Perfil (1 a 5)
          </span>

          <div className="grid grid-cols-5 gap-2.5">
            {[0, 1, 2, 3, 4].map((slotIdx) => {
              const projId = selectedIds[slotIdx];
              const proj = allProjects.find((p) => p.id === projId);

              return (
                <div
                  key={`edit-slot-${slotIdx}`}
                  className={`p-2 rounded-xl border text-center flex flex-col items-center justify-between relative transition-all ${
                    activeSlotToSelect === slotIdx
                      ? 'bg-amber-950/20 border-amber-500/80 ring-2 ring-amber-500/40'
                      : proj
                      ? 'bg-zinc-900/80 border-zinc-700'
                      : 'bg-zinc-950 border-dashed border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-amber-400 mb-1">
                    #{slotIdx + 1}
                  </span>

                  {proj ? (
                    <>
                      <img
                        src={proj.coverArt}
                        alt={proj.title}
                        className="w-12 h-12 rounded-lg object-cover mb-1.5 shadow"
                      />
                      <span className="text-[11px] font-bold text-white truncate w-full px-1">
                        {proj.title}
                      </span>
                      <button
                        onClick={() => handleClearSlot(slotIdx)}
                        className="text-[10px] text-zinc-500 hover:text-rose-400 mt-1 transition-colors"
                      >
                        Remover
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setActiveSlotToSelect(slotIdx)}
                      className="flex-1 flex flex-col items-center justify-center py-2 text-zinc-500 hover:text-amber-400"
                    >
                      <Plus className="w-4 h-4 mb-1" />
                      <span className="text-[10px] font-mono">Escolher</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Project Selector List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              {activeSlotToSelect !== null
                ? `Selecione um projeto para o Slot #${activeSlotToSelect + 1}:`
                : 'Clique em um projeto para adicionar ao próximo slot vago:'}
            </span>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome, artista, cidade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredProjects.map((project) => {
              const currentSlotIndex = selectedIds.indexOf(project.id);
              const isSelected = currentSlotIndex !== -1;

              return (
                <div
                  key={project.id}
                  onClick={() => {
                    if (activeSlotToSelect !== null) {
                      handleSetSlotProject(activeSlotToSelect, project.id);
                    } else if (isSelected) {
                      handleClearSlot(currentSlotIndex);
                    } else if (selectedIds.length < 5) {
                      setSelectedIds([...selectedIds, project.id]);
                    }
                  }}
                  className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-950/20 border-amber-500/50'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <img
                    src={project.coverArt}
                    alt={project.title}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white truncate">
                        {project.title}
                      </h4>
                      {isSelected && (
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                          #{currentSlotIndex + 1}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {project.artistName} · {project.city}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 mt-0.5">
                      <span>{project.genre}</span>
                      <span>·</span>
                      <span className="text-amber-400">★ {project.stats.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-950">
          <span className="text-xs font-mono text-zinc-500">
            {selectedIds.length}/5 slots preenchidos
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave(selectedIds)}
              className="px-5 py-2 text-xs font-bold bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl transition-all shadow-sm"
            >
              Salvar Top 5 no Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
