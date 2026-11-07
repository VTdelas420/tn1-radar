import React, { useEffect, useState } from 'react';
import { isFirebaseEnabled, isUsingEmulators } from './lib/firebase';
import { loadCatalog, publishProject, saveReview, type ReleaseFiles } from './lib/persistence';
import { useAuth } from './lib/auth';
import { AccountModals } from './components/AccountModals';
import { ModerationPanel } from './components/ModerationPanel';
import { SupportPixModal } from './components/SupportPixModal';
import { MusicProject, UserProfile, ReprisedReview } from './types/music';
import { INITIAL_PROJECTS, INITIAL_USER_PROFILES } from './data/mockProjects';
import { TopNav } from './components/TopNav';
import { ProjectDetailView } from './components/ProjectDetailView';
import { RegionalMapSearch } from './components/RegionalMapSearch';
import { ReprisedCommunity } from './components/ReprisedCommunity';
import { UserProfileModal } from './components/UserProfileModal';
import { UserProfileView } from './components/UserProfileView';
import { AudioPlayerBottomBar } from './components/AudioPlayerBottomBar';
import { CheckoutModal } from './components/CheckoutModal';
import { NewProjectModal } from './components/NewProjectModal';
import { audioEngine } from './utils/audioEngine';
import { formatBrl } from './utils/monetization';

export default function App() {
  const account = useAuth();
  const [isModerationOpen, setIsModerationOpen] = useState(false);
  // Publishing needs an artist account (opens login / profile setup first)
  const openNewProject = () => account.requireAccount('publish', () => setIsNewProjectModalOpen(true), { artist: true });
  const [projects, setProjects] = useState<MusicProject[]>(INITIAL_PROJECTS);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>(INITIAL_USER_PROFILES);
  const [selectedProject, setSelectedProject] = useState<MusicProject | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);

  // Cloud sync status shown in a small toast (only when Firebase is configured)
  const [syncStatus, setSyncStatus] = useState<
    { kind: 'saving' | 'saved' | 'error'; message: string } | null
  >(null);

  useEffect(() => {
    if (!isFirebaseEnabled) return;
    let cancelled = false;
    loadCatalog(INITIAL_PROJECTS)
      .then((catalog) => {
        if (cancelled) return;
        // Keep anything published in this session before the load finished
        setProjects((prev) => {
          const ids = new Set(catalog.map((p) => p.id));
          const unsaved = prev.filter((p) => !ids.has(p.id) && p.id.startsWith('proj-'));
          return [...unsaved, ...catalog];
        });
      })
      .catch((err) => {
        console.error('Falha ao carregar catálogo do Firebase:', err);
        if (!cancelled) setSyncStatus({ kind: 'error', message: 'Não foi possível carregar os lançamentos salvos.' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (syncStatus?.kind !== 'saved') return;
    const t = setTimeout(() => setSyncStatus(null), 3500);
    return () => clearTimeout(t);
  }, [syncStatus]);

  // Current logged in listener profile (Thiago Mendes, @thiagom_critica)
  // Signed-in account → its own profile entry (lists kept per account in this browser);
  // signed-out → the demo listener, only used when Firebase is off.
  const accountUid = account.profile?.uid ?? null;
  useEffect(() => {
    const prof = account.profile;
    if (!prof) return;
    let saved: Partial<UserProfile> = {};
    try {
      saved = JSON.parse(localStorage.getItem(`tn1.lists.${prof.uid}`) || '{}');
    } catch {
      /* storage unavailable: start empty */
    }
    setUserProfiles((prev) => {
      const existing = prev.find((u) => u.id === prof.uid);
      const entry: UserProfile = {
        id: prof.uid,
        name: prof.name,
        handle: `@${prof.handle}`,
        bio: prof.bio || (prof.role === 'artist' ? 'Artista do DF + Entorno.' : 'Ouvinte do TN1 Radar.'),
        city: prof.city || '',
        state: prof.state || '',
        joinedDate: new Date(prof.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        ratedProjectsCount: 0,
        reviewsCount: 0,
        favoriteGenres: [],
        recentReviews: existing?.recentReviews ?? [],
        topFavorites: existing?.topFavorites ?? saved.topFavorites ?? [],
        libraryProjectIds: existing?.libraryProjectIds ?? saved.libraryProjectIds ?? [],
        savedProjectIds: existing?.savedProjectIds ?? saved.savedProjectIds ?? [],
        createdProjectIds: existing?.createdProjectIds ?? [],
      };
      return [entry, ...prev.filter((u) => u.id !== prof.uid)];
    });
  }, [account.profile]);

  const baseUser =
    (accountUid && userProfiles.find((u) => u.id === accountUid)) ||
    userProfiles.find((u) => u.id === 'usr-1') ||
    userProfiles[0];
  // Reviews and releases of the account come from the catalog (so they survive reloads)
  const currentUser: UserProfile = accountUid
    ? (() => {
        const mine = projects.flatMap((p) => p.reviews).filter((r) => r.userId === accountUid);
        const recent = [...new Map([...baseUser.recentReviews, ...mine].map((r) => [r.id, r])).values()];
        return {
          ...baseUser,
          recentReviews: recent,
          reviewsCount: recent.length,
          ratedProjectsCount: new Set(recent.map((r) => r.projectId)).size,
          createdProjectIds: [
            ...new Set([
              ...(baseUser.createdProjectIds ?? []),
              ...projects.filter((p) => (p as { ownerUid?: string }).ownerUid === accountUid).map((p) => p.id),
            ]),
          ],
        };
      })()
    : baseUser;

  // Persist the account's lists (top 5, library, saved) in this browser
  useEffect(() => {
    if (!accountUid) return;
    try {
      localStorage.setItem(
        `tn1.lists.${accountUid}`,
        JSON.stringify({
          topFavorites: baseUser.topFavorites,
          libraryProjectIds: baseUser.libraryProjectIds,
          savedProjectIds: baseUser.savedProjectIds,
        })
      );
    } catch {
      /* storage unavailable */
    }
  }, [accountUid, baseUser.topFavorites, baseUser.libraryProjectIds, baseUser.savedProjectIds]);

  // The MAP is the primary home page by default
  const [activeTab, setActiveTab] = useState<'map' | 'reprised' | 'profile'>('map');

  // Modals
  const [checkoutProject, setCheckoutProject] = useState<MusicProject | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
  const [focusedMapProjectId, setFocusedMapProjectId] = useState<string | null>(null);

  // Audio Playback
  const [currentProject, setCurrentProject] = useState<MusicProject | null>(INITIAL_PROJECTS[0]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);

  // Brazilian financial state in BRL (90% artist share)
  const [artistBalanceBrl, setArtistBalanceBrl] = useState<number>(4140.00);
  const [payoutHistory, setPayoutHistory] = useState([
    {
      id: 'tx-01',
      amount: 1250.00,
      method: 'pix',
      destination: 'artista.sp@substream.com.br',
      txHash: 'PIX-E2E-20261104-98421094',
      timestamp: 'Hoje, 14:32',
      status: 'completed' as const,
    },
    {
      id: 'tx-02',
      amount: 800.00,
      method: 'pix',
      destination: 'chave-aleatoria-98f1-280a',
      txHash: 'PIX-E2E-20261102-14220019',
      timestamp: 'Ontem, 19:10',
      status: 'completed' as const,
    },
  ]);

  // Playback control
  const handleTogglePlay = () => {
    if (!currentProject) return;

    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      const track = currentProject.tracks[currentTrackIndex] || currentProject.tracks[0];
      audioEngine.playTrack(
        track.bpm,
        track.keySignature,
        (sec) => {
          setCurrentTime(sec);
        },
        track.audioUrl
      );
      setIsPlaying(true);
    }
  };

  const handlePlayProject = (project: MusicProject, trackIdx = 0) => {
    if (currentProject?.id === project.id && currentTrackIndex === trackIdx && isPlaying) {
      handleTogglePlay();
      return;
    }

    setCurrentProject(project);
    setCurrentTrackIndex(trackIdx);
    setCurrentTime(0);

    const track = project.tracks[trackIdx] || project.tracks[0];
    audioEngine.playTrack(
      track.bpm,
      track.keySignature,
      (sec) => {
        setCurrentTime(sec);
      },
      track.audioUrl
    );
    setIsPlaying(true);
  };

  const handleNextTrack = () => {
    if (!currentProject) return;
    const nextIdx = (currentTrackIndex + 1) % currentProject.tracks.length;
    handlePlayProject(currentProject, nextIdx);
  };

  const handlePrevTrack = () => {
    if (!currentProject) return;
    const prevIdx =
      (currentTrackIndex - 1 + currentProject.tracks.length) % currentProject.tracks.length;
    handlePlayProject(currentProject, prevIdx);
  };

  const handleSeek = (seconds: number) => {
    audioEngine.seek(seconds);
    setCurrentTime(seconds);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    audioEngine.setMasterVolume(vol);
  };

  // Update user's top 5 favorites in profile spotlight
  const handleUpdateTopFavorites = (newFavorites: string[]) => {
    setUserProfiles((prev) =>
      prev.map((u) =>
        u.id === currentUser.id ? { ...u, topFavorites: newFavorites } : u
      )
    );
  };

  // Toggle saving / wishlisting a project
  // Library = releases the listener keeps in their profile (no download)
  const handleToggleLibrary = (projectId: string) =>
    account.requireAccount('generic', () =>
      setUserProfiles((prev) =>
        prev.map((u) => {
          if (u.id !== currentUser.id) return u;
          const lib = u.libraryProjectIds || [];
          return {
            ...u,
            libraryProjectIds: lib.includes(projectId) ? lib.filter((id) => id !== projectId) : [projectId, ...lib],
          };
        })
      )
    );

  const handleToggleSaveProject = (projectId: string) => {
    setUserProfiles((prev) =>
      prev.map((u) => {
        if (u.id !== currentUser.id) return u;
        const currentSaved = u.savedProjectIds || [];
        const exists = currentSaved.includes(projectId);
        const updated = exists
          ? currentSaved.filter((id) => id !== projectId)
          : [...currentSaved, projectId];
        return {
          ...u,
          savedProjectIds: updated,
        };
      })
    );
  };

  // Add Reprised Review to state
  const handleAddReview = (incoming: ReprisedReview) => {
    if (account.enabled && (!account.user || !account.profile)) {
      account.requireAccount('review', () => {});
      return;
    }
    // The reviewer is always the signed-in account, never a typed name
    const review: ReprisedReview = account.profile
      ? {
          ...incoming,
          userId: account.profile.uid,
          userName: account.profile.name,
          userHandle: `@${account.profile.handle}`,
          isSupporter: false,
          likesCount: 0,
        }
      : incoming;
    if (isFirebaseEnabled) {
      saveReview(review).catch((err) => {
        console.error('Falha ao salvar avaliação:', err);
        setSyncStatus({ kind: 'error', message: 'A avaliação não foi salva na nuvem.' });
      });
    }
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== review.projectId) return p;
        const updatedReviews = [review, ...p.reviews];
        const newAvg = Number(
          (
            updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length
          ).toFixed(1)
        );
        return {
          ...p,
          reviews: updatedReviews,
          stats: {
            ...p.stats,
            averageRating: newAvg,
            totalReviewsCount: updatedReviews.length,
          },
        };
      })
    );

    // Also update logged in user's profile reviews
    setUserProfiles((prev) =>
      prev.map((u) => {
        if (u.id !== currentUser.id) return u;
        return {
          ...u,
          reviewsCount: u.reviewsCount + 1,
          recentReviews: [review, ...u.recentReviews],
        };
      })
    );
  };

  // Handle successful fan payment in BRL
  const handleSuccessPayment = (
    project: MusicProject,
    amountBrl: number,
    supporterName: string,
    comment: string,
    method: 'pix' | 'cartao_credito' | 'boleto' | 'nupay_picpay'
  ) => {
    const netArtist = Number((amountBrl * 0.9).toFixed(2));

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== project.id) return p;
        return {
          ...p,
          stats: {
            ...p.stats,
            grossRevenueBrl: p.stats.grossRevenueBrl + amountBrl,
            netArtistRevenueBrl: p.stats.netArtistRevenueBrl + netArtist,
            totalSalesCount: p.stats.totalSalesCount + (amountBrl > 0 ? 1 : 0),
            supportersCount: p.stats.supportersCount + (amountBrl > 0 ? 1 : 0),
            recentPurchases: [
              {
                id: `p-${Date.now()}`,
                projectTitle: p.title,
                amount: amountBrl,
                time: 'Agora mesmo',
                method,
              },
              ...p.stats.recentPurchases,
            ],
          },
          supporters: [
            {
              id: `sup-${Date.now()}`,
              name: supporterName,
              amountPaidBrl: amountBrl,
              date: new Date().toISOString().split('T')[0],
              comment,
              paymentMethod: method,
            },
            ...p.supporters,
          ],
        };
      })
    );

    // Add to current user's library and remove from saved
    setUserProfiles((prev) =>
      prev.map((u) => {
        if (u.id !== currentUser.id) return u;
        const library = u.libraryProjectIds || [];
        const isAlreadyInLib = library.includes(project.id);
        return {
          ...u,
          libraryProjectIds: isAlreadyInLib ? library : [project.id, ...library],
          savedProjectIds: (u.savedProjectIds || []).filter((id) => id !== project.id),
        };
      })
    );

    setArtistBalanceBrl((prev) => Number((prev + netArtist).toFixed(2)));
  };

  // Handle artist withdrawal in BRL
  const handleExecutePayout = async (amount: number, method: string, destination: string) => {
    await new Promise((r) => setTimeout(r, 600));

    setArtistBalanceBrl((prev) => Math.max(0, Number((prev - amount).toFixed(2))));
    setPayoutHistory((prev) => [
      {
        id: `tx-${Date.now()}`,
        amount,
        method,
        destination,
        txHash: `PIX-E2E-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`,
        timestamp: 'Agora mesmo',
        status: 'completed',
      },
      ...prev,
    ]);

    return true;
  };

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-zinc-100 flex flex-col font-sans selection:bg-white selection:text-zinc-950 pb-24 md:pb-28">
      {/* Top Bar Navigation */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedProject(null);
        }}
        onOpenNewProject={openNewProject}
        onOpenModeration={() => setIsModerationOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 md:px-8 py-2 sm:py-6">
        {/* If a project detail is open, view it */}
        {selectedProject ? (
          <ProjectDetailView
            project={selectedProject}
            isPlaying={isPlaying}
            currentTrackIndex={currentTrackIndex}
            currentProjectId={currentProject?.id}
            isSaved={currentUser.savedProjectIds?.includes(selectedProject.id)}
            onPlayTrack={(trackIdx) => handlePlayProject(selectedProject, trackIdx)}
            onTogglePlay={handleTogglePlay}
            onBack={() => setSelectedProject(null)}
            onOpenCheckout={(proj) => setCheckoutProject(proj)}
            onAddReview={handleAddReview}
            onToggleSave={handleToggleSaveProject}
            inLibrary={currentUser.libraryProjectIds?.includes(selectedProject.id)}
            onToggleLibrary={handleToggleLibrary}
          />
        ) : activeTab === 'map' ? (
          /* THE MAP IS THE PRIMARY HOME PAGE */
          <RegionalMapSearch
            projects={projects}
            onSelectProject={(proj) => setSelectedProject(proj)}
            onPlayProject={(proj) => handlePlayProject(proj, 0)}
            currentProjectId={currentProject?.id}
            isPlaying={isPlaying}
            focusedProjectId={focusedMapProjectId}
            onClearFocusedProject={() => setFocusedMapProjectId(null)}
          />
        ) : activeTab === 'reprised' ? (
          /* Reprised Community Reviews & Listener Profiles Discovery */
          <ReprisedCommunity
            projects={projects}
            userProfiles={userProfiles}
            onSelectProject={(proj) => setSelectedProject(proj)}
            onPlayProject={(proj) => handlePlayProject(proj, 0)}
            onOpenUserProfile={(prof) => setSelectedUserProfile(prof)}
            onAddReview={handleAddReview}
          />
        ) : (
          /* PERFIL TAB: Top 5, Biblioteca, Avaliações, Salvos, Meus Projetos (Condicional), Lucros & Pix */
          account.enabled && !account.profile ? (
            <section className="max-w-lg mx-auto mt-10 p-8 text-center bg-zinc-950 border border-zinc-800 rounded-2xl space-y-4">
              <h2 className="text-xl font-bold text-white">Seu perfil no TN1 Radar</h2>
              <p className="text-sm text-zinc-400">
                Entre para ver suas avaliações, seus lançamentos salvos e, se for artista, publicar no mapa.
              </p>
              <button
                onClick={() => (account.user ? account.openProfileSetup(false) : account.openAuth('generic'))}
                className="min-h-[44px] px-6 rounded-xl bg-athos-600 hover:bg-athos-500 text-white font-bold text-sm"
              >
                {account.user ? 'Criar meu perfil' : 'Entrar ou criar conta'}
              </button>
            </section>
          ) : (
          <UserProfileView
            hideEarnings={account.enabled}
            onEditProfile={account.enabled ? () => account.openProfileSetup(false) : undefined}
            user={currentUser}
            allProjects={projects}
            currentProjectId={currentProject?.id}
            isPlaying={isPlaying}
            onPlayProject={(proj, trackIdx) => handlePlayProject(proj, trackIdx ?? 0)}
            onTogglePlay={handleTogglePlay}
            onSelectProject={(proj) => setSelectedProject(proj)}
            onOpenCheckout={(proj) => setCheckoutProject(proj)}
            onUpdateTopFavorites={handleUpdateTopFavorites}
            onToggleSaveProject={handleToggleSaveProject}
            onAddNewReview={handleAddReview}
            artistBalanceBrl={artistBalanceBrl}
            payoutHistory={payoutHistory}
            onExecutePayout={handleExecutePayout}
            onOpenNewProject={openNewProject}
          />
          )
        )}
      </main>

      {/* Floating Lossless Player Bar */}
      <AudioPlayerBottomBar
        currentProject={currentProject}
        currentTrackIndex={currentTrackIndex}
        isPlaying={isPlaying}
        currentTime={currentTime}
        onTogglePlay={handleTogglePlay}
        onNextTrack={handleNextTrack}
        onPrevTrack={handlePrevTrack}
        onSeek={handleSeek}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        onOpenProjectDetail={(proj) => setSelectedProject(proj)}
      />

      {/* Checkout Modal with Brazilian Payment Rails */}
      {checkoutProject && (
        // Launch phase: support goes straight to the artist's Pix key (no payment provider)
        <SupportPixModal project={checkoutProject} onClose={() => setCheckoutProject(null)} />
      )}

      {/* Reprised User Profile Modal */}
      {selectedUserProfile && (
        <UserProfileModal
          profile={selectedUserProfile}
          projects={projects}
          onClose={() => setSelectedUserProfile(null)}
          onSelectProject={(proj) => {
            setSelectedUserProfile(null);
            setSelectedProject(proj);
          }}
          onPlayProject={(proj) => {
            setSelectedUserProfile(null);
            handlePlayProject(proj, 0);
          }}
        />
      )}

      {syncStatus && (
        <div
          role="status"
          className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] max-w-[calc(100%-2rem)] px-4 py-2.5 rounded-lg border text-sm shadow-xl flex items-center gap-3 ${
            syncStatus.kind === 'error'
              ? 'bg-red-950/90 border-red-500/50 text-red-200'
              : 'bg-black/90 border-athos-400/50 text-athos-200'
          }`}
        >
          <span>{syncStatus.message}</span>
          {syncStatus.kind === 'error' && (
            <button
              onClick={() => setSyncStatus(null)}
              className="text-red-300 hover:text-white min-w-[28px]"
              aria-label="Fechar aviso"
            >
              ×
            </button>
          )}
        </div>
      )}

      <AccountModals />
      {isModerationOpen && <ModerationPanel onClose={() => setIsModerationOpen(false)} />}

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <NewProjectModal
          artist={account.profile}
          onClose={() => setIsNewProjectModalOpen(false)}
          onSaveProject={(newProj, files: ReleaseFiles) => {
            setProjects((prev) => [newProj, ...prev]);
            if (isFirebaseEnabled) {
              setSyncStatus({ kind: 'saving', message: 'Enviando capa e faixas para a nuvem…' });
              publishProject(newProj, files)
                .then((stored) => {
                  // Swap temporary blob: URLs for the permanent ones
                  setProjects((prev) => prev.map((p) => (p.id === stored.id ? { ...stored, reviews: p.reviews } : p)));
                  setCurrentProject((cur) => (cur?.id === stored.id ? stored : cur));
                  setSyncStatus({
                    kind: 'saved',
                    message: isUsingEmulators
                      ? 'Lançamento salvo (modo teste local).'
                      : 'Lançamento salvo na nuvem.',
                  });
                })
                .catch((err) => {
                  console.error('Falha ao publicar lançamento:', err);
                  setSyncStatus({
                    kind: 'error',
                    message: 'O lançamento aparece só neste navegador: falhou o envio para a nuvem.',
                  });
                });
            }
            setUserProfiles((prev) =>
              prev.map((u) => {
                if (u.id !== currentUser.id) return u;
                const currentCreated = u.createdProjectIds || [];
                return {
                  ...u,
                  createdProjectIds: [newProj.id, ...currentCreated],
                };
              })
            );
            setSelectedProject(null);
            setActiveTab('map');
            setFocusedMapProjectId(newProj.id);
          }}
        />
      )}
    </div>
  );
}
