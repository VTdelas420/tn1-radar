import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage, ensureSignedIn, isFirebaseEnabled } from './firebase';
import type { MusicProject, ReprisedReview } from '../types/music';
import { isEventVisible, type CityEvent } from '../types/events';

/** Files picked in the "Novo Lançamento" modal, uploaded when the release is saved. */
export interface ReleaseFiles {
  cover?: File;
  /** Same order as project.tracks; undefined for tracks without an uploaded file. */
  tracks: (File | undefined)[];
}

const PROJECTS = 'projects';
const REVIEWS = 'reviews';
const REPORTS = 'reports';
const ADMINS = 'admins';
const EVENTS = 'events';

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
  if (!uid) throw new Error('Entre na sua conta para continuar.');

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
  // Keep ownerUid on the in-memory copy too (support modal and profile use it)
  return { ...stored, ownerUid: uid, reviews: project.reviews } as MusicProject;
}

export async function saveReview(review: ReprisedReview): Promise<void> {
  if (!isFirebaseEnabled) return;
  const uid = await ensureSignedIn();
  if (!uid) throw new Error('Entre na sua conta para continuar.');
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

  // Releases/reviews hidden by moderation never reach the map
  const saved = projectSnap.docs
    .map((d) => d.data() as MusicProject & { createdAt?: number; hidden?: boolean })
    .filter((p) => !p.hidden)
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  const reviewsByProject = new Map<string, ReprisedReview[]>();
  reviewSnap.docs
    .map((d) => d.data() as ReprisedReview & { createdAt?: number; hidden?: boolean })
    .filter((r) => !r.hidden)
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

// ---------- Events ----------

/** Uploads the flyer (if any) and writes the event. Returns it with the permanent flyer URL. */
export async function publishEvent(event: CityEvent, flyer?: File): Promise<CityEvent> {
  if (!isFirebaseEnabled) return event;
  const uid = await ensureSignedIn();
  if (!uid) throw new Error('Entre na sua conta para continuar.');
  const flyerUrl = flyer
    ? await uploadFile(`events/${event.id}/flyer-${safeName(flyer.name)}`, flyer)
    : event.flyerUrl?.startsWith('blob:')
      ? undefined
      : event.flyerUrl;
  const stored: CityEvent = { ...event, flyerUrl, ownerUid: uid, createdAt: Date.now() };
  await setDoc(doc(db!, EVENTS, event.id), stored);
  return stored;
}

/** Saved events that have not ended yet, merged with the demo events, soonest first. */
export async function loadEvents(seed: CityEvent[]): Promise<CityEvent[]> {
  const now = Date.now();
  if (!isFirebaseEnabled) return seed.filter((e) => isEventVisible(e, now));
  await ensureSignedIn();
  const snap = await getDocs(collection(db!, EVENTS));
  const saved = snap.docs
    .map((d) => d.data() as CityEvent & { hidden?: boolean })
    .filter((e) => !e.hidden);
  const ids = new Set(saved.map((e) => e.id));
  return [...saved, ...seed.filter((e) => !ids.has(e.id))]
    .filter((e) => isEventVisible(e, now))
    .sort((a, b) => a.startsAt - b.startsAt);
}

// ---------- Moderation ----------

export type ReportTarget = 'project' | 'review' | 'event';

export interface ContentReport {
  id: string;
  targetType: ReportTarget;
  targetId: string;
  targetTitle: string;
  reason: string;
  reporterUid: string;
  createdAt: number;
}

/** Any signed-in account can report a release or a review. */
export async function reportContent(
  targetType: ReportTarget,
  targetId: string,
  targetTitle: string,
  reason: string
): Promise<void> {
  if (!isFirebaseEnabled) return;
  const uid = await ensureSignedIn();
  if (!uid) throw new Error('Entre na sua conta para denunciar.');
  await addDoc(collection(db!, REPORTS), {
    targetType,
    targetId,
    targetTitle: targetTitle.slice(0, 200),
    reason: reason.trim().slice(0, 1000),
    reporterUid: uid,
    createdAt: Date.now(),
  });
}

/** Admins are listed in the `admins` collection (document id = user id), set by hand in the console. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!isFirebaseEnabled) return false;
  const uid = await ensureSignedIn();
  if (!uid) return false;
  try {
    return (await getDoc(doc(db!, ADMINS, uid))).exists();
  } catch {
    return false;
  }
}

export async function listReports(): Promise<ContentReport[]> {
  const snap = await getDocs(collection(db!, REPORTS));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<ContentReport, 'id'>) }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Hides the reported release, review or event for everyone and closes the report. */
export async function hideReportedContent(report: ContentReport): Promise<void> {
  const col = report.targetType === 'project' ? PROJECTS : report.targetType === 'event' ? EVENTS : REVIEWS;
  await updateDoc(doc(db!, col, report.targetId), { hidden: true, hiddenAt: Date.now() });
  await deleteDoc(doc(db!, REPORTS, report.id));
}

export async function dismissReport(report: ContentReport): Promise<void> {
  await deleteDoc(doc(db!, REPORTS, report.id));
}
