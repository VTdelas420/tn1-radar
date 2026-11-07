import React, { useEffect, useState } from 'react';
import { X, EyeOff, Check, Shield } from 'lucide-react';
import { dismissReport, hideReportedContent, listReports, type ContentReport } from '../lib/persistence';

/** Admin-only list of reports: hide the content for everyone, or dismiss the report. */
export const ModerationPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [reports, setReports] = useState<ContentReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () =>
    listReports()
      .then(setReports)
      .catch((err) => {
        console.error(err);
        setError('Não foi possível carregar as denúncias (só administradores têm acesso).');
      });

  useEffect(() => {
    load();
  }, []);

  const act = async (r: ContentReport, fn: (r: ContentReport) => Promise<void>) => {
    setBusyId(r.id);
    setError(null);
    try {
      await fn(r);
      setReports((prev) => prev?.filter((x) => x.id !== r.id) ?? null);
    } catch (err) {
      console.error(err);
      setError(
        'Não foi possível concluir. Lançamentos de exemplo [DEMO] não ficam no banco e não podem ser ocultados.'
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-3 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md">
      <div role="dialog" aria-modal="true" aria-label="Moderação" className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl my-auto">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-300" /> Moderação
          </h2>
          <button onClick={onClose} aria-label="Fechar" className="p-2 -m-2 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {error && <p className="text-xs text-red-300">{error}</p>}
          {reports === null && !error && <p className="text-sm text-zinc-400">Carregando…</p>}
          {reports?.length === 0 && <p className="text-sm text-zinc-400">Nenhuma denúncia pendente.</p>}
          {reports?.map((r) => (
            <div key={r.id} className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-mono text-zinc-500">
                    {r.targetType === 'project' ? 'Lançamento' : 'Avaliação'} ·{' '}
                    {new Date(r.createdAt).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm font-semibold text-white truncate">{r.targetTitle}</p>
                </div>
              </div>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{r.reason || '(sem motivo)'}</p>
              <div className="flex gap-2 pt-1">
                <button
                  disabled={busyId === r.id}
                  onClick={() => act(r, hideReportedContent)}
                  className="min-h-[40px] px-3 rounded-lg bg-red-500/15 border border-red-400/50 text-red-200 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <EyeOff className="w-4 h-4" /> Ocultar para todos
                </button>
                <button
                  disabled={busyId === r.id}
                  onClick={() => act(r, dismissReport)}
                  className="min-h-[40px] px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> Manter (descartar denúncia)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
