import React, { useState, useRef, useMemo, useEffect } from 'react';
import { MusicProject, PricingModel } from '../types/music';
import type { ReleaseFiles } from '../lib/persistence';
import { PinDropMiniMap } from './PinDropMiniMap';
import {
  REGION_LOCATIONS,
  REGION_NAME,
  ENTORNO_CITIES,
  checkDeviceInRegion,
  findRegionLocation,
} from '../config/region';
import {
  X,
  Plus,
  Trash2,
  MapPin,
  Image as ImageIcon,
  Upload,
  Music,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import {
  MAX_COVER_DIMENSION_PX,
  validateCoverDimensions,
  formatAudioFileSize,
  BRAZIL_STATE_CAPITALS,
  DF_ADMINISTRATIVE_REGIONS,
  BrazilMunicipalityEntry,
  resolveBrazilCoordinates,
  BrazilLocationPreset,
} from '../utils/releaseValidation';
import coverDefault from '../assets/images/album_baile_saopaulo_1793848443588.jpg';

interface NewProjectModalProps {
  onClose: () => void;
  onSaveProject: (project: MusicProject, files: ReleaseFiles) => void;
  /** Signed-in artist: name, @handle and RA prefill the form. */
  artist?: { name: string; handle: string; city?: string; state?: string } | null;
}

interface DraftTrack {
  file?: File;
  title: string;
  bpm: number;
  keySignature: string;
  durationSec: number;
  audioUrl?: string;
  audioFileName?: string;
  audioFileSize?: string;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  onClose,
  onSaveProject,
  artist,
}) => {
  // Smart Defaults (Hick-Hyman Law & Task Offloading)
  const [title, setTitle] = useState('');
  const [artistName, setArtistName] = useState(artist?.name ?? 'Coletivo Independente');
  const [artistHandle] = useState(artist ? `@${artist.handle}` : '@artista_som');
  const [catalogNumber, setCatalogNumber] = useState('BR-025');
  const [genre, setGenre] = useState('Baile Funk & Experimental');
  const [subgenre, setSubgenre] = useState('Bass / Post-Baile');
  const startPlace = (artist?.city && findRegionLocation(artist.city, artist.state)) || null;
  const [city, setCity] = useState(startPlace?.n ?? 'Brasília (Plano Piloto)');
  const [state, setState] = useState(startPlace?.uf ?? 'DF');
  const [country, setCountry] = useState('Brasil');
  const [lat, setLat] = useState(startPlace?.lat ?? -15.7938);
  const [lng, setLng] = useState(startPlace?.lng ?? -47.8827);

  // Device-location check: only artists physically in DF + Entorno can publish
  const [locationStatus, setLocationStatus] = useState<
    { kind: 'idle' | 'checking' | 'ok' | 'error'; message?: string }
  >({ kind: 'idle' });
  const [verifiedAt, setVerifiedAt] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricingModel, setPricingModel] = useState<PricingModel>('paid');
  const [priceBrl, setPriceBrl] = useState(20.0);
  const [minPriceBrl, setMinPriceBrl] = useState(10.0);
  const [accentColor] = useState('#38bdf8');
  const [description, setDescription] = useState('');
  const [linerNotes, setLinerNotes] = useState('');

  // Launch phase: only the 35 DF RAs + Entorno cities
  const allBrazilCities: BrazilMunicipalityEntry[] = REGION_LOCATIONS;
  const [citySearchFilter, setCitySearchFilter] = useState('');

  // Cities filtered by selected UF or global search query across all 5,453 Brazilian cities
  const availableCitiesForSelect = useMemo(() => {
    const q = citySearchFilter.trim().toLowerCase();
    if (q.length > 0) {
      return allBrazilCities.filter(
        (c) => c.n.toLowerCase().includes(q) || c.uf.toLowerCase().includes(q)
      );
    }
    return allBrazilCities.filter((c) => c.uf === state);
  }, [allBrazilCities, state, citySearchFilter]);

  // Progressive Disclosure Toggle for Advanced Studio Details
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Cover Art Upload State (Strict Max 3000x3000 px)
  const [coverArtUrl, setCoverArtUrl] = useState<string>(coverDefault);
  const [coverFileName, setCoverFileName] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | undefined>(undefined);
  const [coverDimensions, setCoverDimensions] = useState<{ width: number; height: number } | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // Tracks & Audio Upload State
  const [tracks, setTracks] = useState<DraftTrack[]>([
    { title: 'Abertura // Frequência da Cidade', bpm: 130, keySignature: 'F# minor', durationSec: 195 },
    { title: 'Madrugada no Asfalto', bpm: 130, keySignature: 'F# minor', durationSec: 220 },
  ]);
  const batchAudioInputRef = useRef<HTMLInputElement | null>(null);

  // Zeigarnik Effect: Live Completion Progress Calculation
  const completionStats = useMemo(() => {
    const hasTitle = title.trim().length > 0;
    const hasValidCover = !coverError && Boolean(coverArtUrl);
    const hasTracks = tracks.length > 0 && tracks.every((t) => t.title.trim().length > 0);
    const hasLocation = Boolean(city.trim() && state.trim());
    const completedSteps = [hasTitle, hasValidCover, hasTracks, hasLocation].filter(Boolean).length;
    const percent = Math.round((completedSteps / 4) * 100);
    return { completedSteps, totalSteps: 4, percent, isReady: hasTitle && hasValidCover };
  }, [title, coverError, coverArtUrl, tracks, city, state]);

  // Handle Cover Art Selection & 3000x3000 px Validation
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverError(null);

    if (!file.type.startsWith('image/')) {
      setCoverError('Selecione um arquivo de imagem válido (JPG, PNG ou WEBP).');
      e.target.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const validation = validateCoverDimensions(img.naturalWidth, img.naturalHeight);
      if (!validation.valid) {
        URL.revokeObjectURL(objectUrl);
        setCoverError(validation.error || 'Dimensões acima do limite permitido (3000x3000 px).');
        setCoverDimensions(null);
        setCoverFileName(null);
        e.target.value = '';
        return;
      }

      setCoverArtUrl(objectUrl);
      setCoverFile(file);
      setCoverFileName(file.name);
      setCoverDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setCoverError(null);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setCoverError('Não foi possível ler o arquivo de imagem selecionado.');
      e.target.value = '';
    };

    img.src = objectUrl;
  };

  // Extract Audio File Duration via HTMLAudioElement
  const extractAudioMetadata = (file: File): Promise<{ url: string; durationSec: number; name: string; size: string }> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = 'metadata';

      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
      const sizeStr = formatAudioFileSize(file.size);

      audio.onloadedmetadata = () => {
        const dur = Number.isFinite(audio.duration) && audio.duration > 0 ? Math.round(audio.duration) : 180;
        resolve({ url, durationSec: dur, name: cleanTitle, size: sizeStr });
      };

      audio.onerror = () => {
        resolve({ url, durationSec: 180, name: cleanTitle, size: sizeStr });
      };

      audio.src = url;
    });
  };

  // Batch upload multiple audio files to tracks
  const handleBatchAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files: File[] = Array.from(fileList);
    const extracted = await Promise.all(files.map((file) => extractAudioMetadata(file)));

    const newUploadedTracks: DraftTrack[] = extracted.map((item, idx) => ({
      file: files[idx],
      title: item.name || `Faixa ${idx + 1}`,
      bpm: 128,
      keySignature: 'C minor',
      durationSec: item.durationSec,
      audioUrl: item.url,
      audioFileName: files[idx].name,
      audioFileSize: item.size,
    }));

    const hasExistingUploads = tracks.some((t) => Boolean(t.audioUrl));
    if (!hasExistingUploads && tracks.length === 2 && tracks[0].title.startsWith('Abertura //')) {
      setTracks(newUploadedTracks);
    } else {
      setTracks((prev) => [...prev, ...newUploadedTracks]);
    }

    e.target.value = '';
  };

  // Upload audio file for a single track row
  const handleSingleTrackAudioUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const meta = await extractAudioMetadata(file);
    setTracks((prev) => {
      const updated = [...prev];
      const currentTitle = updated[index].title;
      const shouldUpdateTitle =
        !currentTitle ||
        currentTitle.startsWith('Nova Faixa') ||
        currentTitle.startsWith('Abertura //') ||
        currentTitle.startsWith('Madrugada no');

      updated[index] = {
        ...updated[index],
        file,
        title: shouldUpdateTitle ? meta.name : currentTitle,
        durationSec: meta.durationSec,
        audioUrl: meta.url,
        audioFileName: file.name,
        audioFileSize: meta.size,
      };
      return updated;
    });

    e.target.value = '';
  };

  const handleCityPreset = (preset: BrazilLocationPreset) => {
    setCitySearchFilter('');
    setCity(preset.city);
    setState(preset.state);
    setCountry(preset.country);
    setLat(preset.lat);
    setLng(preset.lng);
  };

  const handleStateSelectChange = (uf: string) => {
    setCitySearchFilter('');
    setState(uf);
    const stateCapital = BRAZIL_STATE_CAPITALS.find((c) => c.state === uf);
    if (stateCapital) {
      setCity(stateCapital.city);
      setLat(stateCapital.lat);
      setLng(stateCapital.lng);
    } else {
      const firstInState = allBrazilCities.find((c) => c.uf === uf);
      if (firstInState) {
        setCity(firstInState.n);
        setLat(firstInState.lat);
        setLng(firstInState.lng);
      }
    }
  };

  const handleCitySelectChange = (selectedValue: string) => {
    // Format is "CityName|UF"
    const [selectedCityName, selectedUf] = selectedValue.split('|');
    const found = allBrazilCities.find(
      (c) => c.n === selectedCityName && (!selectedUf || c.uf === selectedUf)
    );
    if (found) {
      setCity(found.n);
      setState(found.uf);
      setLat(found.lat);
      setLng(found.lng);
    } else if (selectedCityName) {
      setCity(selectedCityName);
    }
  };

  const handleCitySearchChange = (val: string) => {
    setCitySearchFilter(val);
    const q = val.trim().toLowerCase();
    if (q.length >= 2) {
      const exactOrFirst =
        allBrazilCities.find((c) => c.n.toLowerCase() === q) ||
        allBrazilCities.find((c) => c.n.toLowerCase().startsWith(q));
      if (exactOrFirst) {
        setCity(exactOrFirst.n);
        setState(exactOrFirst.uf);
        setLat(exactOrFirst.lat);
        setLng(exactOrFirst.lng);
      }
    }
  };

  /** Checks the device is inside the region; optionally moves the pin there (rounded to ~100 m). */
  const handleUseDeviceLocation = async (placePin: boolean) => {
    setLocationStatus({ kind: 'checking' });
    const res = await checkDeviceInRegion();
    if (!res.ok) {
      setVerifiedAt(null);
      setLocationStatus({ kind: 'error', message: res.message });
      return false;
    }
    setVerifiedAt(Date.now());
    if (placePin) {
      setLat(Number(res.lat.toFixed(3)));
      setLng(Number(res.lng.toFixed(3)));
    }
    setLocationStatus({
      kind: 'ok',
      message: placePin
        ? 'Localização confirmada. O pino vai ficar onde você está (precisão de ~100 m).'
        : 'Localização confirmada.',
    });
    return true;
  };

  const handleAddTrack = () => {
    setTracks([
      ...tracks,
      { title: `Nova Faixa ${tracks.length + 1}`, bpm: 124, keySignature: 'A minor', durationSec: 210 },
    ]);
  };

  const handleRemoveTrack = (index: number) => {
    if (tracks.length <= 1) return;
    setTracks(tracks.filter((_, i) => i !== index));
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || coverError || isSubmitting) return;

    setIsSubmitting(true);
    const verified = verifiedAt !== null || (await handleUseDeviceLocation(false));
    setIsSubmitting(false);
    if (!verified) return;

    if (!findRegionLocation(city, state)) {
      setLocationStatus({ kind: 'error', message: 'Escolha uma RA do DF ou uma cidade do Entorno.' });
      return;
    }
    const validCoords = { lat, lng };

    const newProj: MusicProject = {
      id: `proj-${Date.now()}`,
      title: title.trim(),
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      artistName: artistName.trim() || 'Coletivo Independente',
      artistHandle: artistHandle.trim() || '@artista_som',
      artistBio: `Lançamento autônomo originário de ${city} (${state}).`,
      releaseDate: new Date().toISOString().split('T')[0],
      genre: genre.trim() || 'Experimental',
      subgenre: subgenre.trim() || 'Regional',
      city: city.trim() || 'São Paulo',
      state: state.trim().toUpperCase() || 'SP',
      country: country || 'Brasil',
      coordinates: validCoords,
      coverArt: coverArtUrl,
      accentColor,
      pricingModel,
      priceBrl: pricingModel === 'free' ? 0 : priceBrl,
      minPriceBrl: pricingModel === 'name_your_price' ? minPriceBrl : undefined,
      audioQuality: '24-bit / 96kHz Lossless FLAC',
      catalogNumber: catalogNumber.trim() || `BR-${Math.floor(Math.random() * 900 + 100)}`,
      description:
        description.trim() ||
        'Lançamento independente captado em estúdio autônomo. Sem algoritmos de recomendação.',
      linerNotes:
        linerNotes.trim() ||
        'Produção 100% autônoma. 90% do valor vai direto para a conta Pix do criador.',
      tags: [genre, city, state, 'Lossless'],
      versions: [
        { id: 'v1', name: 'Master Oficial 24/96', tag: 'Master', date: 'Hoje', isLatest: true },
      ],
      tracks: tracks.map((t, idx) => ({
        id: `t-${Date.now()}-${idx}`,
        title: t.title,
        durationSec: t.durationSec,
        trackNumber: idx + 1,
        bpm: t.bpm,
        keySignature: t.keySignature,
        waveform: Array.from({ length: 30 }, () => Math.floor(Math.random() * 85 + 15)),
        audioUrl: t.audioUrl,
        audioFileName: t.audioFileName,
        audioFileSize: t.audioFileSize,
      })),
      stats: {
        totalStreams: 1,
        totalSalesCount: 0,
        grossRevenueBrl: 0,
        netArtistRevenueBrl: 0,
        supportersCount: 0,
        completionRate: 100,
        averageRating: 5.0,
        totalReviewsCount: 0,
        topRegions: [{ region: `${city} (${state})`, plays: 1, revenue: 0 }],
        recentPurchases: [],
      },
      supporters: [],
      reviews: [],
      regionVerifiedAt: verifiedAt ?? Date.now(),
    };

    onSaveProject(newProj, { cover: coverFile, tracks: tracks.map((t) => t.file) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header + Zeigarnik Progress Indicator */}
        <div className="p-5 border-b border-zinc-800 bg-black/60 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Novo Lançamento no Mapa
              </h3>
              <p className="text-xs text-zinc-400">
                Preencha o título, capa (máx. 3000×3000 px), cidade brasileira e envie os arquivos de música.
              </p>
            </div>
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Zeigarnik Effect Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono tabular-nums">
              <span className="text-zinc-400">
                Etapas concluídas: {completionStats.completedSteps} de {completionStats.totalSteps}
              </span>
              <span className={completionStats.isReady ? 'text-emerald-400 font-bold' : 'text-sky-400'}>
                {completionStats.percent}% pronto
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
              <div
                style={{ width: `${completionStats.percent}%` }}
                className={`h-full transition-all duration-300 ${
                  completionStats.isReady ? 'bg-emerald-400' : 'bg-sky-400'
                }`}
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* 1. Capa (Máx 3000x3000 px) & Identidade Essencial */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Cover Art Uploader */}
              <div className="md:col-span-4 flex flex-col gap-2.5">
                <div className="relative group aspect-square w-full max-w-[190px] mx-auto md:mx-0 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-lg">
                  <img
                    src={coverArtUrl}
                    alt="Capa do Projeto"
                    className="w-full h-full object-cover"
                  />
                  <label
                    htmlFor="cover-art-upload"
                    className="cursor-pointer absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center"
                  >
                    <ImageIcon className="w-6 h-6 text-sky-400 mb-1" />
                    <span className="text-xs font-semibold text-white">Trocar Capa</span>
                    <span className="text-[10px] font-mono text-zinc-300 mt-0.5">
                      Máx. {MAX_COVER_DIMENSION_PX}×{MAX_COVER_DIMENSION_PX} px
                    </span>
                  </label>
                </div>

                <input
                  ref={coverInputRef}
                  type="file"
                  id="cover-art-upload"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleCoverFileChange}
                  className="hidden"
                />

                <label
                  htmlFor="cover-art-upload"
                  className="min-h-[44px] cursor-pointer flex items-center justify-center gap-2 w-full px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-sky-500/60 rounded-xl text-xs font-semibold text-zinc-100 transition-all"
                >
                  <Upload className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Capa (Máx 3000x3000 px)</span>
                </label>

                {coverDimensions && !coverError && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-[11px] font-mono text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span className="truncate">
                      {coverFileName ? `${coverFileName} · ` : ''}
                      {coverDimensions.width}×{coverDimensions.height} px
                    </span>
                  </div>
                )}

                {coverError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200 leading-relaxed"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{coverError}</span>
                  </div>
                )}
              </div>

              {/* Essential Identity & All 5,453 Brazilian Cities Selector */}
              <div className="md:col-span-8 space-y-4">
                <div>
                  <label htmlFor="project-title-input" className="text-xs font-medium text-zinc-300 block mb-1.5">
                    TÍTULO DO PROJETO *
                  </label>
                  <input
                    id="project-title-input"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: BAILE FRACTAL // VOL. 1"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-semibold text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="artist-name-input" className="text-xs font-medium text-zinc-300 block mb-1.5">
                      Artista ou Coletivo
                    </label>
                    <input
                      id="artist-name-input"
                      type="text"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      placeholder="Ex: Coletivo Subgrave"
                      className="w-full min-h-[44px] px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="genre-input" className="text-xs font-medium text-zinc-300 block mb-1.5">
                      Gênero Musical
                    </label>
                    <input
                      id="genre-input"
                      type="text"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      placeholder="Ex: Baile Funk & Experimental"
                      className="w-full min-h-[44px] px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Launch region: 35 DF RAs + Entorno (GO) */}
                <div className="p-3.5 bg-zinc-900/50 border border-zinc-800/90 rounded-xl space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      <span>Onde a música foi feita ({REGION_NAME})</span>
                    </span>
                    <span className="text-[11px] font-mono text-sky-400 tabular-nums">
                      {lat.toFixed(3)}°, {lng.toFixed(3)}°
                    </span>
                  </div>

                  <div>
                    <label htmlFor="city-select" className="text-[11px] font-medium text-zinc-400 block mb-1">
                      REGIÃO ADMINISTRATIVA OU CIDADE DO ENTORNO
                    </label>
                    <select
                      id="city-select"
                      value={`${city}|${state}`}
                      onChange={(e) => handleCitySelectChange(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
                    >
                      <optgroup label="Distrito Federal (35 RAs)">
                        {REGION_LOCATIONS.filter((c) => c.uf === 'DF').map((c) => (
                          <option key={`DF-${c.n}`} value={`${c.n}|DF`}>
                            {c.n}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Entorno (GO)">
                        {ENTORNO_CITIES.map((c) => (
                          <option key={`GO-${c.n}`} value={`${c.n}|GO`}>
                            {c.n}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Pin-drop: exact street/block inside the chosen RA or city */}
                  <PinDropMiniMap
                    lat={lat}
                    lng={lng}
                    focusKey={`${city}|${state}`}
                    onChange={(la, ln) => {
                      setLat(la);
                      setLng(ln);
                    }}
                  />

                  {/* Device location: required to publish; optional to place the pin */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUseDeviceLocation(true)}
                      disabled={locationStatus.kind === 'checking'}
                      className="min-h-[40px] px-3 py-2 text-xs font-semibold rounded-lg border border-sky-500/60 text-sky-300 hover:bg-sky-500/10 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      {locationStatus.kind === 'checking' ? 'Verificando localização…' : 'Colocar o pino onde estou agora'}
                    </button>
                    <p
                      className={`text-[11px] leading-snug ${
                        locationStatus.kind === 'error'
                          ? 'text-red-300'
                          : locationStatus.kind === 'ok'
                          ? 'text-emerald-300'
                          : 'text-zinc-400'
                      }`}
                    >
                      {locationStatus.message ??
                        `Ao publicar, pedimos a localização do seu dispositivo só para confirmar que você está no ${REGION_NAME}. Ela não é guardada.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Upload de Arquivos de Música & Faixas */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Arquivos de Música ({tracks.length} {tracks.length === 1 ? 'faixa' : 'faixas'})
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Suba seus arquivos .WAV, .FLAC ou .MP3 para reprodução direta no mapa.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={batchAudioInputRef}
                    id="batch-audio-upload"
                    type="file"
                    accept="audio/*,.wav,.flac,.mp3,.ogg,.m4a,.aac"
                    multiple
                    onChange={handleBatchAudioUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="batch-audio-upload"
                    className="min-h-[44px] cursor-pointer flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-xl transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Subir Arquivos de Música</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAddTrack}
                    className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-xl border border-zinc-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Faixa</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {tracks.map((t, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-zinc-900/70 rounded-xl border border-zinc-800/90 flex flex-col sm:flex-row sm:items-center gap-2.5"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-mono text-zinc-500 w-5 shrink-0">{i + 1}.</span>
                      <input
                        type="text"
                        value={t.title}
                        onChange={(e) => {
                          const updated = [...tracks];
                          updated[i].title = e.target.value;
                          setTracks(updated);
                        }}
                        placeholder="Título da faixa..."
                        aria-label={`Título da faixa ${i + 1}`}
                        className="flex-1 min-h-[40px] px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 justify-between sm:justify-end">
                      <input
                        id={`track-audio-${i}`}
                        type="file"
                        accept="audio/*,.wav,.flac,.mp3,.ogg,.m4a,.aac"
                        onChange={(e) => handleSingleTrackAudioUpload(i, e)}
                        className="hidden"
                      />
                      <label
                        htmlFor={`track-audio-${i}`}
                        className={`min-h-[40px] cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          t.audioFileName
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
                        }`}
                      >
                        {t.audioFileName ? (
                          <>
                            <FileAudio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="max-w-[130px] truncate">{t.audioFileName}</span>
                            <span className="text-[10px] font-mono text-emerald-400/80">({t.audioFileSize})</span>
                          </>
                        ) : (
                          <>
                            <Music className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span>Subir Áudio</span>
                          </>
                        )}
                      </label>

                      <span className="text-xs font-mono text-zinc-400 tabular-nums w-11 text-right">
                        {formatDuration(t.durationSec)}
                      </span>

                      {tracks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTrack(i)}
                          className="min-w-[36px] min-h-[36px] flex items-center justify-center text-zinc-500 hover:text-rose-400 transition-colors"
                          aria-label={`Remover faixa ${i + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Preço & Repasse Direto via Pix (90% Artista) */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Modalidade de Acesso</h4>
                <span className="text-xs text-emerald-400 font-medium">
                  90% do valor vai direto para seu Pix
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPricingModel('free')}
                  className={`min-h-[56px] p-3 rounded-xl border text-left transition-all ${
                    pricingModel === 'free'
                      ? 'bg-zinc-900 border-sky-400 text-white'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-xs font-bold text-emerald-400">Gratuito</div>
                  <div className="text-[11px] text-zinc-400">Streaming e download livre</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPricingModel('paid')}
                  className={`min-h-[56px] p-3 rounded-xl border text-left transition-all ${
                    pricingModel === 'paid'
                      ? 'bg-zinc-900 border-sky-400 text-white'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-xs font-bold text-white">Preço Fixo (R$)</div>
                  <div className="text-[11px] text-zinc-400">Venda digital via Pix/Cartão</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPricingModel('name_your_price')}
                  className={`min-h-[56px] p-3 rounded-xl border text-left transition-all ${
                    pricingModel === 'name_your_price'
                      ? 'bg-zinc-900 border-sky-400 text-white'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-xs font-bold text-white">Pague Quanto Quiser</div>
                  <div className="text-[11px] text-zinc-400">Apoio voluntário dos fãs</div>
                </button>
              </div>

              {pricingModel === 'paid' && (
                <div className="flex items-center gap-3 pt-1">
                  <label htmlFor="price-brl-input" className="text-xs text-zinc-300">
                    Valor em Reais (R$):
                  </label>
                  <input
                    id="price-brl-input"
                    type="number"
                    min="5"
                    step="1"
                    value={priceBrl}
                    onChange={(e) => setPriceBrl(parseFloat(e.target.value) || 0)}
                    className="w-32 min-h-[40px] px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              )}

              {pricingModel === 'name_your_price' && (
                <div className="flex items-center gap-3 pt-1">
                  <label htmlFor="min-price-brl-input" className="text-xs text-zinc-300">
                    Valor mínimo (R$):
                  </label>
                  <input
                    id="min-price-brl-input"
                    type="number"
                    min="0"
                    step="1"
                    value={minPriceBrl}
                    onChange={(e) => setMinPriceBrl(parseFloat(e.target.value) || 0)}
                    className="w-32 min-h-[40px] px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              )}
            </div>

            {/* Progressive Disclosure: Optional Advanced Details */}
            <div className="pt-2 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 py-2 transition-colors"
              >
                {showAdvancedOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>Opções avançadas (descrição, código de catálogo e coordenadas exatas)</span>
              </button>

              {showAdvancedOptions && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 animate-in fade-in duration-150">
                  <div className="sm:col-span-2">
                    <label htmlFor="desc-input" className="text-xs text-zinc-400 block mb-1">
                      Descrição / Manifesto do Projeto
                    </label>
                    <textarea
                      id="desc-input"
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Contexto da obra, instrumentos utilizados..."
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="catalog-input" className="text-xs text-zinc-400 block mb-1">
                      Código de Catálogo
                    </label>
                    <input
                      id="catalog-input"
                      type="text"
                      value={catalogNumber}
                      onChange={(e) => setCatalogNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="subgenre-input" className="text-xs text-zinc-400 block mb-1">
                      Subgênero / Cena
                    </label>
                    <input
                      id="subgenre-input"
                      type="text"
                      value={subgenre}
                      onChange={(e) => setSubgenre(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="lat-input" className="text-xs text-zinc-400 block mb-1">
                      Latitude
                    </label>
                    <input
                      id="lat-input"
                      type="number"
                      step="0.0001"
                      value={lat}
                      onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="lng-input" className="text-xs text-zinc-400 block mb-1">
                      Longitude
                    </label>
                    <input
                      id="lng-input"
                      type="number"
                      step="0.0001"
                      value={lng}
                      onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="liner-input" className="text-xs text-zinc-400 block mb-1">
                      Ficha Técnica
                    </label>
                    <input
                      id="liner-input"
                      type="text"
                      value={linerNotes}
                      onChange={(e) => setLinerNotes(e.target.value)}
                      placeholder="Créditos de mixagem, masterização e músicos..."
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dedicated Non-Scrolling Submit Footer Bar */}
          <div className="p-4 px-6 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-zinc-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Destino: {city} ({state})</span>
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={Boolean(coverError) || isSubmitting || locationStatus.kind === 'checking'}
                className="min-h-[44px] px-6 py-2.5 bg-sky-400 hover:bg-sky-300 disabled:opacity-50 text-black font-bold text-xs sm:text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(56,189,248,0.4)] active:scale-95"
              >
                {isSubmitting ? 'Confirmando localização…' : 'Publicar no Mapa Imediatamente'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
