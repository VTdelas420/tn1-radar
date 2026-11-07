import React, { useState } from 'react';
import { MapPin, Plus, Star, User as UserIcon, LogIn, LogOut, Shield, Pencil } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface TopNavProps {
  activeTab: 'map' | 'reprised' | 'profile';
  setActiveTab: (tab: 'map' | 'reprised' | 'profile') => void;
  onOpenNewProject: () => void;
  onOpenModeration?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewProject,
  onOpenModeration,
}) => {
  const { enabled, user, profile, isAdmin, openAuth, openProfileSetup, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-zinc-800/80 px-4 md:px-8 h-16 flex items-center">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element, Top Bar Contract) */}
        <button
          onClick={() => setActiveTab('map')}
          className="text-lg font-extrabold tracking-tight text-white hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 min-h-[44px] flex items-center focus:outline-none"
          aria-label="Ir para o mapa principal"
        >
          TN1 Radar
        </button>

        {/* Zone 2: 3 Concise Single-Line Navigation Links (Hick's Law: 3 core destinations) */}
        <nav
          aria-label="Navegação principal"
          className="flex items-center gap-2 sm:gap-6 text-sm font-medium overflow-x-auto no-scrollbar"
        >
          <button
            onClick={() => setActiveTab('map')}
            className={`min-h-[44px] px-3 flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'map'
                ? 'border-sky-400 text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <MapPin className="w-4 h-4 text-sky-400" />
            <span>Mapa Principal</span>
          </button>

          <button
            onClick={() => setActiveTab('reprised')}
            className={`min-h-[44px] px-3 flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'reprised'
                ? 'border-sky-400 text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Star className="w-4 h-4 text-amber-400" />
            <span>Avaliações</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`min-h-[44px] px-3 flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'profile'
                ? 'border-sky-400 text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <UserIcon className="w-4 h-4 text-zinc-300" />
            <span>Perfil</span>
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
                <span className="w-9 h-9 rounded-full bg-sky-500/20 border border-sky-400/60 text-sky-200 text-sm font-bold flex items-center justify-center">
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
                      {profile ? `@${profile.handle} · ${profile.role === 'artist' ? 'Artista' : 'Ouvinte'}` : user.email}
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
          <button
            onClick={onOpenNewProject}
            className="min-h-[44px] px-4 py-2 text-xs sm:text-sm font-bold text-black bg-sky-400 hover:bg-sky-300 rounded-xl transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] active:scale-95 flex items-center gap-2 whitespace-nowrap shrink-0"
            aria-label="Publicar novo projeto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>
    </header>
  );
};
