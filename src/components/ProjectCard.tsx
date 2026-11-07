import React from 'react';
import { MusicProject } from '../types/music';
import { Play, Pause, ShoppingBag, MapPin, Star, Bookmark } from 'lucide-react';
import { formatBrl } from '../utils/monetization';

interface ProjectCardProps {
  project: MusicProject;
  isPlaying: boolean;
  isCurrentProject: boolean;
  isSaved?: boolean;
  onPlay: (project: MusicProject) => void;
  onSelectProject: (project: MusicProject) => void;
  onBuy: (project: MusicProject) => void;
  onToggleSave?: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isPlaying,
  isCurrentProject,
  isSaved,
  onPlay,
  onSelectProject,
  onBuy,
  onToggleSave,
}) => {
  const activePlaying = isCurrentProject && isPlaying;

  return (
    <article
      className="group relative flex flex-col bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl overflow-hidden transition-all duration-200"
      style={{
        boxShadow: activePlaying ? `0 0 24px -6px ${project.accentColor}33` : undefined,
      }}
    >
      {/* Artwork Box */}
      <div
        className="relative aspect-square w-full bg-zinc-950 overflow-hidden cursor-pointer"
        onClick={() => onSelectProject(project)}
      >
        <img
          src={project.coverArt}
          alt={`Capa do projeto ${project.title}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Minimal gradient scrim for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Top bar over image */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-zinc-300 z-10">
          <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[11px] border border-white/10 tracking-wider">
            {project.catalogNumber}
          </span>

          <div className="flex items-center gap-1.5">
            {onToggleSave && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(project.id);
                }}
                className={`p-1 rounded bg-black/60 backdrop-blur-md border border-white/10 transition-colors ${
                  isSaved ? 'text-amber-400' : 'text-zinc-400 hover:text-white'
                }`}
                title={isSaved ? 'Remover dos salvos' : 'Salvar no perfil (Quero Ouvir)'}
                aria-label={isSaved ? 'Remover dos salvos' : 'Salvar no perfil'}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            )}
            <span className="text-[11px] text-zinc-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
              {project.audioQuality.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Play/Pause Button overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay(project);
          }}
          className={`absolute bottom-3 right-3 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
            activePlaying
              ? 'bg-white text-zinc-950 scale-100'
              : 'bg-zinc-900/90 text-zinc-100 hover:bg-white hover:text-zinc-950 hover:scale-105 opacity-90 group-hover:opacity-100'
          }`}
          aria-label={activePlaying ? `Pausar ${project.title}` : `Tocar ${project.title}`}
        >
          {activePlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Reprised Rating score badge over image */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] font-mono">
          <span className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 text-amber-400 font-bold">
            <Star className="w-3 h-3 fill-current" />
            <span>{project.stats.averageRating.toFixed(1)}</span>
          </span>
          <span className="bg-black/80 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 text-zinc-300">
            {project.tracks.length} {project.tracks.length === 1 ? 'faixa' : 'faixas'}
          </span>
        </div>
      </div>

      {/* Project Metadata */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Geographic origin & genre */}
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1 text-zinc-200 font-medium truncate">
              <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{project.city}, {project.state || project.country}</span>
            </span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span className="truncate">{project.genre}</span>
          </div>

          {/* Project Title (Primary Focus) */}
          <h3
            onClick={() => onSelectProject(project)}
            className="text-base font-bold text-zinc-100 group-hover:text-white cursor-pointer line-clamp-1 transition-colors"
          >
            {project.title}
          </h3>

          {/* Artist handle & year */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5 font-mono">
            <span>{project.artistHandle}</span>
            <span aria-hidden="true">·</span>
            <span>{project.releaseDate.split('-')[0]}</span>
          </div>

          <p className="text-xs text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Pricing & Action */}
        <div className="pt-3.5 mt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-mono">
              {project.pricingModel === 'free'
                ? 'Lançamento'
                : project.pricingModel === 'name_your_price'
                ? 'Pague quanto quiser'
                : 'Valor digital'}
            </div>
            <div className="text-sm font-semibold font-mono text-zinc-100">
              {project.pricingModel === 'free' ? (
                <span className="text-emerald-400">Gratuito</span>
              ) : project.pricingModel === 'name_your_price' ? (
                <span>Min. {formatBrl(project.minPriceBrl || 10)}</span>
              ) : (
                <span>{formatBrl(project.priceBrl)}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectProject(project)}
              className="px-3 py-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 rounded-md transition-colors"
            >
              Ver
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBuy(project);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-zinc-200 hover:bg-white rounded-md transition-all active:scale-95"
            >
              <ShoppingBag className="w-3 h-3" />
              <span>Apoiar</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
