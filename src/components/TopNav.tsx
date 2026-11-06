import React from 'react';
import { MapPin, Plus, Star, User as UserIcon } from 'lucide-react';

interface TopNavProps {
  activeTab: 'map' | 'reprised' | 'profile';
  setActiveTab: (tab: 'map' | 'reprised' | 'profile') => void;
  onOpenNewProject: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewProject,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-zinc-800/80 px-4 md:px-8 h-16 flex items-center">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element, Top Bar Contract) */}
        <button
          onClick={() => setActiveTab('map')}
          className="text-lg font-extrabold tracking-tight text-white hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 min-h-[44px] flex items-center focus:outline-none"
          aria-label="Ir para o mapa principal"
        >
          Substream
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
        <div className="flex items-center shrink-0">
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
