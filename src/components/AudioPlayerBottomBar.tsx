import React from 'react';
import { MusicProject, Track } from '../types/music';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface AudioPlayerBottomBarProps {
  currentProject: MusicProject | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  currentTime: number;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onSeek: (seconds: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  onOpenProjectDetail: (project: MusicProject) => void;
}

export const AudioPlayerBottomBar: React.FC<AudioPlayerBottomBarProps> = ({
  currentProject,
  currentTrackIndex,
  isPlaying,
  currentTime,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  onSeek,
  volume,
  onVolumeChange,
  onOpenProjectDetail,
}) => {
  if (!currentProject) return null;

  const currentTrack: Track | undefined =
    currentProject.tracks[currentTrackIndex] || currentProject.tracks[0];
  const duration = currentTrack?.durationSec || 180;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-zinc-800/90 px-4 md:px-8 h-20 flex items-center transition-all">
      {/* Interactive Scrubber Track on Top Edge */}
      <div
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickPos = (e.clientX - rect.left) / rect.width;
          onSeek(clickPos * duration);
        }}
        className="absolute -top-1.5 left-0 right-0 h-3 bg-transparent flex items-center cursor-pointer group"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        aria-label="Progresso da faixa"
        tabIndex={0}
      >
        <div className="w-full h-1 group-hover:h-1.5 bg-zinc-900 transition-all">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-sky-400 relative transition-all duration-75"
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-opacity" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
        {/* Left: Project Artwork & Track Meta */}
        <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xs">
          <button
            onClick={() => onOpenProjectDetail(currentProject)}
            className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-zinc-800 group focus:outline-none"
            aria-label={`Ver detalhes do projeto ${currentProject.title}`}
          >
            <img
              src={currentProject.coverArt}
              alt={currentProject.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </button>

          <div className="min-w-0">
            <button
              onClick={() => onOpenProjectDetail(currentProject)}
              className="text-sm font-semibold text-white hover:text-sky-400 truncate block text-left transition-colors"
            >
              {currentTrack?.title || currentProject.title}
            </button>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate mt-0.5">
              <span className="truncate">{currentProject.artistName}</span>
              <span aria-hidden="true">·</span>
              <span className="text-zinc-500 truncate">{currentProject.city}</span>
            </div>
          </div>
        </div>

        {/* Center: Playback Controls (Fitts's Law >= 44px touch targets in thumb zone) */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onPrevTrack}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition-colors"
            aria-label="Faixa anterior"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className="min-w-[48px] min-h-[48px] rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition-transform shadow-lg active:scale-95"
            aria-label={isPlaying ? 'Pausar reprodução' : 'Iniciar reprodução'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onNextTrack}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition-colors"
            aria-label="Próxima faixa"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Time & Volume */}
        <div className="hidden sm:flex items-center justify-end gap-4 flex-1 max-w-xs">
          <div className="text-xs font-mono text-zinc-400 tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span className="mx-1 text-zinc-600">/</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onVolumeChange(volume === 0 ? 0.85 : 0)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-400 hover:text-white rounded-lg transition-colors"
              aria-label={volume === 0 ? 'Desmutar' : 'Mutar'}
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              aria-label="Volume geral"
              className="w-20 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};
