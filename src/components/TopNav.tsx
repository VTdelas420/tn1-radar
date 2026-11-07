import React, { useState } from 'react';
import { MapPin, Plus, Star, User as UserIcon, LogIn, LogOut, Shield, Pencil, Disc3, CalendarPlus } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface TopNavProps {
  activeTab: 'map' | 'reprised' | 'profile';
  setActiveTab: (tab: 'map' | 'reprised' | 'profile') => void;
  onOpenNewProject: () => void;
  onOpenNewEvent: () => void;
  onOpenModeration?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewProject,
  onOpenNewEvent,
  onOpenModeration,
}) => {
  const { enabled, user, profile, isAdmin, openAuth, openProfileSetup, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-zinc-800/80 px-3 md:px-8 h-14 md:h-16 flex items-center">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-1.5 sm:gap-8">
        {/* Zone 1: Brand Wordmark (Single text element, Top Bar Contract) */}
        <button
          onClick={() => setActiveTab('map')}
          className="text-base sm:text-lg font-extrabold tracking-tight text-white hover:text-athos-400 transition-colors whitespace-nowrap shrink-0 min-h-[44px] flex items-center focus:outline-none"
          aria-label="Ir para o mapa principal"
        >
          TN1 Radar
        </button>

        {/* Zone 2: 3 Concise Single-Line Navigation Links (Hick's Law: 3 core destinations) */}
        <nav
          aria-label="Navegação principal"
          className="flex items-center gap-0.5 sm:gap-6 text-sm font-medium"
        >
          <button
            onClick={() => setActiveTab('map')}
            aria-label="Mapa"
            className={`min-h-[44px] min-w-[44px] px-2 sm:px-3 flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'map'
                ? 'border-athos-400 text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <MapPin className="w-4 h-4 text-athos-400" />
            <span className="hidden sm:inline">Mapa Principal</span>
          </button>

          <button
            onClick={() => setActiveTab('reprised')}
            aria-label="Avaliações"
            className={`min-h-[44px] min-w-[44px] px-2 sm:px-3 flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'reprised'
                ? 'border-athos-400 text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Star className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Avaliações</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            aria-label="Perfil"
            className={`min-h-[44px] min-w-[44px] px-2 sm:px-3 flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'profile'
                ? 'border-athos-400 text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <UserIcon className="w-4 h-4 text-zinc-300" />
            <span className="hidden sm:inline">Perfil</span>
          </button>
        </nav>

        {/* Zone 3: 1 Visually Dominant Primary CTA (Von Restorff Effect & Fitts's Law >= 44px) */}
        <div className="flex items-center gap-2 shrink-0">
          {enabled && !user && (
            <button
              onClick={() => openAuth('generic')}
              className="min-h-[44px] px-3 text-sm font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Entrar</span>
            </button>
          )}
          {enabled && user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Minha conta"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <span className="w-9 h-9 rounded-full bg-athos-500/20 border border-athos-400/60 text-athos-200 text-sm font-bold flex items-center justify-center">
                  {(profile?.name || user.email || '?').charAt(0).toUpperCase()}
                </span>
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-12 w-56 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-50"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-zinc-800 mb-1">
                    <p className="text-sm font-semibold text-white truncate">{profile?.name ?? 'Sem perfil'}</p>
                    <p className="text-xs text-zinc-400 truncate">
                      {profile ? `@${profile.handle}, ${profile.role === 'artist' ? 'artista' : 'ouvinte'}` : user.email}
                    </p>
                  </div>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      openProfileSetup(false);
                    }}
                    className="w-full min-h-[40px] px-3 text-left text-sm text-zinc-200 hover:bg-zinc-900 rounded-lg flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" /> {profile ? 'Editar perfil' : 'Criar perfil'}
                  </button>
                  {isAdmin && onOpenModeration && (
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenModeration();
                      }}
                      className="w-full min-h-[40px] px-3 text-left text-sm text-amber-200 hover:bg-zinc-900 rounded-lg flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" /> Moderação
                    </button>
                  )}
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut();
                    }}
                    className="w-full min-h-[40px] px-3 text-left text-sm text-zinc-400 hover:bg-zinc-900 rounded-lg flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sair
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="relative shrink-0">
            <button
              onClick={() => setCreateOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={createOpen}
              className="min-h-[44px] min-w-[44px] px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white bg-athos-600 hover:bg-athos-500 rounded-xl transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
              aria-label="Publicar no mapa"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Publicar</span>
            </button>
            {createOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCreateOpen(false)} aria-hidden="true" />
                <div role="menu" className="absolute right-0 mt-2 z-50 w-64 p-1.5 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl">
                  <button
                    role="menuitem"
                    onClick={() => {
                      setCreateOpen(false);
                      onOpenNewProject();
                    }}
                    className="w-full min-h-[52px] px-3 text-left rounded-lg hover:bg-zinc-900 flex items-center gap-3"
                  >
                    <Disc3 className="w-5 h-5 text-athos-300 shrink-0" />
                    <span>
                      <span className="block text-sm font-semibold text-white">Novo lançamento</span>
                      <span className="block text-xs text-zinc-400">Sua música no mapa (artistas)</span>
                    </span>
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setCreateOpen(false);
                      onOpenNewEvent();
                    }}
                    className="w-full min-h-[52px] px-3 text-left rounded-lg hover:bg-zinc-900 flex items-center gap-3"
                  >
                    <CalendarPlus className="w-5 h-5 text-athos-300 shrink-0" />
                    <span>
                      <span className="block text-sm font-semibold text-white">Novo evento</span>
                      <span className="block text-xs text-zinc-400">Batalha, baile, show ou sarau</span>
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
