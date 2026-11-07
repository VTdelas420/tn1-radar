import React, { useEffect, useState } from 'react';
import { useEscape } from '../lib/useEscape';
import { X, Mail, Music, Headphones, MapPin } from 'lucide-react';
import { authErrorMessage, useAuth, type AccountRole, type AuthReason } from '../lib/auth';
import { ENTORNO_CITIES, REGION_LOCATIONS, REGION_NAME } from '../config/region';

const REASON_TEXT: Record<AuthReason, string> = {
  publish: 'Entre para publicar seu lançamento no mapa.',
  event: 'Entre para divulgar um evento no mapa.',
  review: 'Entre para escrever uma avaliação.',
  report: 'Entre para denunciar um conteúdo.',
  generic: 'Ouvir e explorar o mapa é livre. Para publicar e avaliar, entre na sua conta.',
};

const inputClass =
  'w-full min-h-[44px] px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-athos-500';

const Shell: React.FC<{ title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  subtitle,
  onClose,
  children,
}) => {
  useEscape(true, onClose);
  return (
  <div className="fixed inset-0 z-[70] flex items-start justify-center p-3 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md">
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl my-auto"
    >
      <div className="p-5 border-b border-zinc-800 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>}
        </div>
        <button onClick={onClose} aria-label="Fechar" className="p-2 -m-2 text-zinc-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
  );
};

const LoginModal: React.FC<{ reason: AuthReason }> = ({ reason }) => {
  const { closeAuth, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell
      title={mode === 'signin' ? 'Entrar no TN1 Radar' : 'Criar conta no TN1 Radar'}
      subtitle={REASON_TEXT[reason]}
      onClose={closeAuth}
    >
      <button
        type="button"
        disabled={busy}
        onClick={() => run(signInWithGoogle)}
        className="w-full min-h-[48px] flex items-center justify-center gap-2.5 rounded-xl bg-white text-zinc-900 font-semibold text-sm hover:bg-zinc-200 disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
          <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
          <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
        </svg>
        Continuar com Google
      </button>

      <div className="flex items-center gap-3 my-4 text-[11px] text-zinc-500">
        <div className="h-px flex-1 bg-zinc-800" /> ou com e-mail <div className="h-px flex-1 bg-zinc-800" />
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => (mode === 'signin' ? signInWithEmail(email, password) : signUpWithEmail(email, password)));
        }}
      >
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          aria-label="E-mail"
          className={inputClass}
        />
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === 'signin' ? 'Senha' : 'Crie uma senha (mín. 6 caracteres)'}
          aria-label="Senha"
          className={inputClass}
        />
        {error && <p className="text-xs text-red-300">{error}</p>}
        {info && <p className="text-xs text-emerald-300">{info}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-athos-600 hover:bg-athos-500 text-white font-bold text-sm disabled:opacity-60"
        >
          <Mail className="w-4 h-4" />
          {busy ? 'Aguarde…' : mode === 'signin' ? 'Entrar com e-mail' : 'Criar conta'}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-xs">
        <button
          type="button"
          className="text-athos-300 hover:text-white"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
            setInfo(null);
          }}
        >
          {mode === 'signin' ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
        </button>
        {mode === 'signin' && (
          <button
            type="button"
            className="text-zinc-400 hover:text-white"
            onClick={() => {
              if (!email.trim()) {
                setError('Digite seu e-mail acima para receber o link.');
                return;
              }
              run(async () => {
                await resetPassword(email);
                setInfo('Enviamos um link para redefinir a senha.');
              });
            }}
          >
            Esqueci a senha
          </button>
        )}
      </div>
    </Shell>
  );
};

const ProfileSetupModal: React.FC<{ forceArtist: boolean }> = ({ forceArtist }) => {
  const { user, profile, saveProfile, closeProfileSetup, signOut } = useAuth();
  const [name, setName] = useState(profile?.name ?? user?.displayName ?? '');
  const [handle, setHandle] = useState(profile?.handle ?? '');
  const [role, setRole] = useState<AccountRole>(forceArtist ? 'artist' : profile?.role ?? 'listener');
  const [place, setPlace] = useState(
    profile?.city ? `${profile.city}|${profile.state}` : 'Brasília (Plano Piloto)|DF'
  );
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [links, setLinks] = useState(profile?.links ?? {});
  const [pixKey, setPixKey] = useState(profile?.pixKey ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (forceArtist) setRole('artist');
  }, [forceArtist]);

  // Suggest a handle from the name the first time
  useEffect(() => {
    if (!profile && !handle && name) {
      setHandle(
        name
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_|_$/g, '')
          .slice(0, 24)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHandle = handle.replace(/^@+/, '').trim();
    if (name.trim().length < 2) return setError('Escreva seu nome ou nome artístico.');
    if (!/^[a-z0-9_.]{3,30}$/i.test(cleanHandle))
      return setError('O @usuário pode ter de 3 a 30 letras, números, "_" ou ".".');
    const [city, state] = place.split('|');
    setBusy(true);
    setError(null);
    try {
      await saveProfile({
        name: name.trim().slice(0, 80),
        handle: cleanHandle,
        role,
        ...(role === 'artist'
          ? {
              city,
              state,
              bio: bio.trim().slice(0, 600),
              ...(pixKey.trim() ? { pixKey: pixKey.trim().slice(0, 77) } : {}),
              links: Object.fromEntries(
                Object.entries(links).filter(([, v]) => typeof v === 'string' && v.trim())
              ) as typeof links,
            }
          : {}),
      });
    } catch (err) {
      console.error(err);
      setError('Não foi possível salvar o perfil. Tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  const linkField = (key: keyof NonNullable<typeof links>, label: string, placeholder: string) => (
    <input
      type="url"
      value={links[key] ?? ''}
      onChange={(e) => setLinks({ ...links, [key]: e.target.value })}
      placeholder={placeholder}
      aria-label={label}
      className={inputClass}
    />
  );

  return (
    <Shell
      title={profile ? 'Editar perfil' : 'Crie seu perfil'}
      subtitle={
        forceArtist
          ? `Para publicar, complete seu perfil de artista do ${REGION_NAME}.`
          : 'Seu nome aparece nas suas avaliações e lançamentos.'
      }
      onClose={closeProfileSetup}
    >
      <form className="space-y-3.5" onSubmit={submit}>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['listener', 'Ouvinte', Headphones],
              ['artist', 'Artista', Music],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              disabled={forceArtist && value === 'listener'}
              aria-pressed={role === value}
              className={`min-h-[52px] rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
                role === value
                  ? 'bg-athos-500/15 border-athos-400 text-athos-200'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-300 block mb-1.5">
            {role === 'artist' ? 'Nome artístico *' : 'Seu nome *'}
          </label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-300 block mb-1.5">@usuário *</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace(/^@+/, ''))}
              className={`${inputClass} pl-8`}
              required
            />
          </div>
        </div>

        {role === 'artist' && (
          <>
            <div>
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-athos-400" /> Sua RA ou cidade *
              </label>
              <select value={place} onChange={(e) => setPlace(e.target.value)} className={inputClass}>
                <optgroup label="Distrito Federal">
                  {REGION_LOCATIONS.filter((c) => c.uf === 'DF').map((c) => (
                    <option key={c.n} value={`${c.n}|DF`}>
                      {c.n}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Entorno (GO)">
                  {ENTORNO_CITIES.map((c) => (
                    <option key={c.n} value={`${c.n}|GO`}>
                      {c.n}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Conte em poucas linhas quem você é e que som faz."
                className={`${inputClass} py-2.5`}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">Chave Pix para receber apoio (opcional)</label>
              <input
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Chave aleatória ou e-mail"
                className={inputClass}
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Fica visível para quem for apoiar. Prefira uma chave aleatória ou e-mail, não CPF nem telefone.
                O dinheiro vai direto para você; o TN1 Radar não recebe nada.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300 block">Links (opcional)</label>
              {linkField('instagram', 'Instagram', 'https://instagram.com/…')}
              {linkField('soundcloud', 'SoundCloud', 'https://soundcloud.com/…')}
              {linkField('youtube', 'YouTube', 'https://youtube.com/…')}
              {linkField('spotify', 'Spotify', 'https://open.spotify.com/…')}
            </div>
          </>
        )}

        {error && <p className="text-xs text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full min-h-[44px] rounded-xl bg-athos-600 hover:bg-athos-500 text-white font-bold text-sm disabled:opacity-60"
        >
          {busy ? 'Salvando…' : 'Salvar perfil'}
        </button>
        {!profile && (
          <button type="button" onClick={() => signOut()} className="w-full text-xs text-zinc-500 hover:text-zinc-300">
            Sair desta conta
          </button>
        )}
      </form>
    </Shell>
  );
};

/** Renders whichever account window is open. Mount once, near the root. */
export const AccountModals: React.FC = () => {
  const { authModal, profileModal, user } = useAuth();
  if (profileModal && user) return <ProfileSetupModal forceArtist={profileModal.forceArtist} />;
  if (authModal && !user) return <LoginModal reason={authModal} />;
  return null;
};
