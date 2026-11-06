import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage, ensureSignedIn, isFirebaseEnabled } from './firebase';
import type { MusicProject, ReprisedReview } from '../types/music';

/** Files picked in the "Novo Lançamento" modal, uploaded when the release is saved. */
export interface ReleaseFiles {
  cover?: File;
  /** Same order as project.tracks; undefined for tracks without an uploaded file. */
  tracks: (File | undefined)[];
}

const PROJECTS = 'projects';
const REVIEWS = 'reviews';

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80);
}

async function uploadFile(path: string, file: File): Promise<string> {
  const fileRef = ref(storage!, path);
  await uploadBytes(fileRef, file, { contentType: file.type || undefined });
  return getDownloadURL(fileRef);
}

/**
 * Uploads cover + audio to Storage and writes the release to Firestore.
 * Returns the project with permanent URLs in place of the temporary blob: URLs.
 */
export async function publishProject(
  project: MusicProject,
  files: ReleaseFiles
): Promise<MusicProject> {
  if (!isFirebaseEnabled) return project;
  const uid = await ensureSignedIn();
  if (!uid) throw new Error('Não foi possível autenticar no Firebase.');

  const base = `releases/${project.id}`;
  const coverArt = files.cover
    ? await uploadFile(`${base}/cover-${safeName(files.cover.name)}`, files.cover)
    : project.coverArt.startsWith('blob:')
      ? ''
      : project.coverArt;

  const tracks = await Promise.all(
    project.tracks.map(async (track, idx) => {
      const file = files.tracks[idx];
      if (!file) return { ...track, audioUrl: track.audioUrl?.startsWith('blob:') ? undefined : track.audioUrl };
      const audioUrl = await uploadFile(`${base}/${idx + 1}-${safeName(file.name)}`, file);
      return { ...track, audioUrl };
    })
  );

  // Reviews live in their own collection so anyone can add one without rewriting the release.
  const stored: MusicProject = { ...project, coverArt, tracks, reviews: [] };
  await setDoc(doc(db!, PROJECTS, project.id), { ...stored, ownerUid: uid, createdAt: Date.now() });
  return { ...stored, reviews: project.reviews };
}

export async function saveReview(review: ReprisedReview): Promise<void> {
  if (!isFirebaseEnabled) return;
  const uid = await ensureSignedIn();
  if (!uid) throw new Error('Não foi possível autenticar no Firebase.');
  await setDoc(doc(db!, REVIEWS, review.id), { ...review, ownerUid: uid, createdAt: Date.now() });
}

function withReviews(project: MusicProject, extra: ReprisedReview[]): MusicProject {
  if (extra.length === 0) return project;
  const known = new Set(project.reviews.map((r) => r.id));
  const reviews = [...extra.filter((r) => !known.has(r.id)), ...project.reviews];
  const averageRating = Number(
    (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
  );
  return {
    ...project,
    reviews,
    stats: { ...project.stats, averageRating, totalReviewsCount: reviews.length },
  };
}

/**
 * Loads saved releases and reviews and merges them with the built-in demo releases.
 * Saved releases come first (newest first).
 */
export async function loadCatalog(seed: MusicProject[]): Promise<MusicProject[]> {
  if (!isFirebaseEnabled) return seed;
  await ensureSignedIn();

  const [projectSnap, reviewSnap] = await Promise.all([
    getDocs(collection(db!, PROJECTS)),
    getDocs(collection(db!, REVIEWS)),
  ]);

  const saved = projectSnap.docs
    .map((d) => d.data() as MusicProject & { createdAt?: number })
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  const reviewsByProject = new Map<string, ReprisedReview[]>();
  reviewSnap.docs
    .map((d) => d.data() as ReprisedReview & { createdAt?: number })
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    .forEach((r) => {
      const list = reviewsByProject.get(r.projectId) ?? [];
      list.push(r);
      reviewsByProject.set(r.projectId, list);
    });

  const savedIds = new Set(saved.map((p) => p.id));
  const all = [...saved, ...seed.filter((p) => !savedIds.has(p.id))];
  return all.map((p) => withReviews({ ...p, reviews: p.reviews ?? [] }, reviewsByProject.get(p.id) ?? []));
}
