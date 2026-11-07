import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseEnabled } from './firebase';
import { isCurrentUserAdmin } from './persistence';

export type AccountRole = 'listener' | 'artist';

/** Public profile, stored at users/{uid}. */
export interface AccountProfile {
  uid: string;
  name: string;
  handle: string; // without "@"
  role: AccountRole;
  city?: string; // RA or Entorno city (artists)
  state?: string; // 'DF' | 'GO'
  bio?: string;
  links?: { instagram?: string; soundcloud?: string; bandcamp?: string; youtube?: string; spotify?: string };
  /** Artist's Pix key for direct support (public: shown to supporters). */
  pixKey?: string;
  createdAt: number;
}

/** Why the login window was opened — shown as its subtitle. */
export type AuthReason = 'publish' | 'review' | 'report' | 'generic';

interface AuthContextValue {
  enabled: boolean;
  loading: boolean;
  user: User | null;
  profile: AccountProfile | null;
  isAdmin: boolean;
  /** Login window state (rendered by <AuthModals/> in App). */
  authModal: AuthReason | null;
  profileModal: { forceArtist: boolean } | null;
  openAuth: (reason?: AuthReason) => void;
  closeAuth: () => void;
  openProfileSetup: (forceArtist?: boolean) => void;
  closeProfileSetup: () => void;
  /**
   * Runs \`action\` only when the visitor has what it needs; otherwise opens the
   * login (no account) or profile setup (no profile / not an artist) instead.
   */
  requireAccount: (reason: AuthReason, action: () => void, opts?: { artist?: boolean }) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (data: Omit<AccountProfile, 'uid' | 'createdAt'>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Firebase error codes → short Portuguese messages. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'Não existe conta com esse e-mail.',
    'auth/email-already-in-use': 'Já existe uma conta com esse e-mail. Tente entrar.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/popup-closed-by-user': 'A janela do Google foi fechada antes de terminar.',
    'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Permita pop-ups e tente de novo.',
    'auth/too-many-requests': 'Muitas tentativas. Espere um pouco e tente de novo.',
    'auth/network-request-failed': 'Sem conexão. Verifique a internet.',
    'auth/operation-not-allowed': 'Esse método de login ainda não foi ativado no Firebase.',
  };
  return map[code] ?? 'Não foi possível concluir. Tente de novo.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(isFirebaseEnabled);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authModal, setAuthModal] = useState<AuthReason | null>(null);
  const [profileModal, setProfileModal] = useState<{ forceArtist: boolean } | null>(null);
  // Action waiting for login/profile to finish (e.g. "open the publish form")
  const [pending, setPending] = useState<{ action: () => void; artist: boolean } | null>(null);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, async (u) => {
      // Older versions signed visitors in anonymously; those sessions are not accounts
      if (u?.isAnonymous) {
        await fbSignOut(auth!);
        return;
      }
      setUser(u);
      if (!u) {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db!, 'users', u.uid));
        setProfile(snap.exists() ? (snap.data() as AccountProfile) : null);
      } catch (err) {
        console.error('Falha ao carregar perfil:', err);
        setProfile(null);
      }
      setIsAdmin(await isCurrentUserAdmin());
      setLoading(false);
    });
  }, []);

  // After login: ask for a profile if missing, then resume the pending action
  useEffect(() => {
    if (loading || !user) return;
    if (!profile) {
      // Just logged in through the window (or an action is waiting): ask for the profile once.
      // If the person closes it, it is not reopened until they try an action again.
      if (authModal || pending) {
        setAuthModal(null);
        if (!profileModal) setProfileModal({ forceArtist: pending?.artist ?? false });
      }
      return;
    }
    if (pending) {
      if (pending.artist && profile.role !== 'artist') {
        if (!profileModal) setProfileModal({ forceArtist: true });
        return;
      }
      const run = pending.action;
      setPending(null);
      setAuthModal(null);
      setProfileModal(null);
      run();
    } else if (authModal) {
      setAuthModal(null);
    }
  }, [loading, user, profile, pending, authModal, profileModal]);

  const requireAccount = useCallback<AuthContextValue['requireAccount']>(
    (reason, action, opts) => {
      if (!isFirebaseEnabled) {
        action(); // local-only mode: no accounts
        return;
      }
      const needsArtist = Boolean(opts?.artist);
      if (user && profile && (!needsArtist || profile.role === 'artist')) {
        action();
        return;
      }
      setPending({ action, artist: needsArtist });
      if (!user) setAuthModal(reason);
      else setProfileModal({ forceArtist: needsArtist });
    },
    [user, profile]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      enabled: isFirebaseEnabled,
      loading,
      user,
      profile,
      isAdmin,
      authModal,
      profileModal,
      openAuth: (reason = 'generic') => setAuthModal(reason),
      closeAuth: () => {
        setAuthModal(null);
        setPending(null);
      },
      openProfileSetup: (forceArtist = false) => setProfileModal({ forceArtist }),
      closeProfileSetup: () => {
        setProfileModal(null);
        setPending(null);
      },
      requireAccount,
      signInWithGoogle: async () => {
        await signInWithPopup(auth!, new GoogleAuthProvider());
      },
      signInWithEmail: async (email, password) => {
        await signInWithEmailAndPassword(auth!, email.trim(), password);
      },
      signUpWithEmail: async (email, password) => {
        await createUserWithEmailAndPassword(auth!, email.trim(), password);
      },
      resetPassword: async (email) => {
        await sendPasswordResetEmail(auth!, email.trim());
      },
      signOut: async () => {
        setPending(null);
        await fbSignOut(auth!);
      },
      saveProfile: async (data) => {
        if (!user) throw new Error('Entre na sua conta primeiro.');
        const full: AccountProfile = {
          ...data,
          handle: data.handle.replace(/^@+/, '').toLowerCase(),
          uid: user.uid,
          createdAt: profile?.createdAt ?? Date.now(),
        };
        await setDoc(doc(db!, 'users', user.uid), full);
        setProfile(full);
        setProfileModal(null);
      },
    }),
    [loading, user, profile, isAdmin, authModal, profileModal, requireAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
