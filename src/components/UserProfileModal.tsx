import React from 'react';
import { UserProfile, MusicProject } from '../types/music';
import {
  X,
  User,
  Star,
  MapPin,
  Calendar,
  Disc3,
  Play,
  Heart,
} from 'lucide-react';

interface UserProfileModalProps {
  profile: UserProfile | null;
  projects: MusicProject[];
  onClose: () => void;
  onSelectProject: (project: MusicProject) => void;
  onPlayProject: (project: MusicProject) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  profile,
  projects,
  onClose,
  onSelectProject,
  onPlayProject,
}) => {
  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col my-auto">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-white">
              Perfil do Ouvinte // Reprised.App
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xl font-bold text-white shrink-0">
              {profile.name[0]}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-white truncate">{profile.name}</h2>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-0.5">
                <span>{profile.handle}</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-zinc-300">
                  <MapPin className="w-3 h-3 text-zinc-500" />
                  {profile.city}, {profile.state}
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-2 leading-relaxed font-sans">{profile.bio}</p>
            </div>
          </div>

          {/* Favorite Genres */}
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
              Gêneros Favoritos
            </span>
            <div className="flex flex-wrap gap-1.5">
              {profile.favoriteGenres.map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-1 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* User's Reviews and Ratings */}
          <div className="space-y-3 pt-3 border-t border-zinc-900">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
              Diário de Audições Recentes ({profile.recentReviews.length})
            </span>

            <div className="space-y-3">
              {profile.recentReviews.map((rev) => {
                const proj = projects.find((p) => p.id === rev.projectId);
                return (
                  <div
                    key={rev.id}
                    className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{rev.projectTitle}</span>
                        <div className="flex items-center text-amber-400 text-xs">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="ml-1 font-mono font-bold">{rev.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">{rev.date}</span>
                    </div>

                    <p className="text-xs text-zinc-300 italic">"{rev.reviewText}"</p>

                    {proj && (
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] font-mono text-zinc-500">
                          {proj.city} · {proj.genre}
                        </span>
                        <button
                          onClick={() => {
                            onClose();
                            onPlayProject(proj);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Ouvir</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
