import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { doc, getDoc } from 'firebase/firestore';
import { X, Heart, Copy, CheckCircle2 } from 'lucide-react';
import type { MusicProject } from '../types/music';
import { db, isFirebaseEnabled } from '../lib/firebase';
import type { AccountProfile } from '../lib/auth';
import { buildPixPayload } from '../utils/pix';
import { formatBrl } from '../utils/monetization';

const PRESETS = [5, 10, 20, 50];

/**
 * Direct support: a Pix QR code to the artist's own key. The TN1 Radar never
 * touches the money and cannot see whether the payment happened.
 */
export const SupportPixModal: React.FC<{ project: MusicProject; onClose: () => void }> = ({ project, onClose }) => {
  const ownerUid = (project as MusicProject & { ownerUid?: string }).ownerUid;
  const suggested = project.pricingModel === 'free' ? 10 : project.minPriceBrl || project.priceBrl || 10;
  const [artist, setArtist] = useState<AccountProfile | null | undefined>(undefined);
  const [amount, setAmount] = useState<number>(suggested);
  const [custom, setCustom] = useState('');
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isFirebaseEnabled || !ownerUid) {
      setArtist(null);
      return;
    }
    getDoc(doc(db!, 'users', ownerUid))
      .then((snap) => setArtist(snap.exists() ? (snap.data() as AccountProfile) : null))
      .catch(() => setArtist(null));
  }, [ownerUid]);

  const payload = useMemo(() => {
    if (!artist?.pixKey || !(amount > 0)) return null;
    try {
      return buildPixPayload({
        key: artist.pixKey,
        name: artist.name,
        city: artist.city || project.city,
        amount,
        description: 'Apoio TN1 Radar',
        txid: 'TN1RADAR',
      });
    } catch {
      return null;
    }
  }, [artist, amount, project.city]);

  useEffect(() => {
    if (!payload) {
      setQr(null);
      return;
    }
    QRCode.toDataURL(payload, { margin: 1, width: 240, errorCorrectionLevel: 'M' })
      .then(setQr)
      .catch(() => setQr(null));
  }, [payload]);

  const copy = async () => {
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard blocked: the code is still visible to copy by hand */
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div role="dialog" aria-modal="true" aria-label="Apoiar com Pix" className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl my-6">
        <div className="p-5 border-b border-zinc-800 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" /> Apoiar {project.artistName}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Ouvir é livre. O apoio vai direto para o Pix do artista, sem taxa e sem passar pelo TN1 Radar.
            </p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="p-2 -m-2 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {artist === undefined && <p className="text-sm text-zinc-400">Carregando…</p>}

          {artist !== undefined && !artist?.pixKey && (
            <p className="text-sm text-zinc-300">
              Este artista ainda não cadastrou uma chave Pix para receber apoio. Você pode ouvir à vontade e voltar depois.
            </p>
          )}

          {artist?.pixKey && (
            <>
              <div>
                <p className="text-xs font-medium text-zinc-300 mb-2">Quanto você quer apoiar?</p>
                <div className="grid grid-cols-4 gap-2">
                  {PRESETS.map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        setAmount(v);
                        setCustom('');
                      }}
                      aria-pressed={amount === v && !custom}
                      className={`min-h-[44px] rounded-xl border text-sm font-bold tabular-nums ${
                        amount === v && !custom
                          ? 'bg-sky-500/15 border-sky-400 text-sky-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                      }`}
                    >
                      R$ {v}
                    </button>
                  ))}
                </div>
                <input
                  inputMode="decimal"
                  value={custom}
                  onChange={(e) => {
                    setCustom(e.target.value);
                    const v = Number(e.target.value.replace(',', '.'));
                    if (v > 0) setAmount(Math.round(v * 100) / 100);
                  }}
                  placeholder="Outro valor (R$)"
                  aria-label="Outro valor em reais"
                  className="mt-2 w-full min-h-[44px] px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white">
                {qr ? (
                  <img src={qr} alt={`QR Code Pix de ${formatBrl(amount)} para ${artist.name}`} className="w-56 h-56" />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-xs text-zinc-500">Gerando QR Code…</div>
                )}
                <p className="text-sm font-bold text-zinc-900">
                  {formatBrl(amount)} para {artist.name}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-zinc-400">Ou use o Pix copia e cola no app do seu banco:</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={payload ?? ''}
                    aria-label="Código Pix copia e cola"
                    onFocus={(e) => e.target.select()}
                    className="flex-1 min-w-0 min-h-[44px] px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 text-[11px] font-mono"
                  />
                  <button
                    onClick={copy}
                    className="min-h-[44px] px-4 rounded-xl bg-sky-400 hover:bg-sky-300 text-black text-sm font-bold flex items-center gap-1.5 shrink-0"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Confira no seu banco se o nome do recebedor é o do artista antes de confirmar. O TN1 Radar não
                recebe, não guarda e não confirma pagamentos.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
