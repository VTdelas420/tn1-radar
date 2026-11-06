import React, { useState } from 'react';
import { MusicProject } from '../types/music';
import {
  DollarSign,
  TrendingUp,
  Activity,
  QrCode,
  Building,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  Globe2,
} from 'lucide-react';
import {
  formatBrl,
  validateBrazilianPayoutDestination,
  MIN_PAYOUT_THRESHOLD_BRL,
} from '../utils/monetization';

interface AnalyticsDashboardProps {
  projects: MusicProject[];
  artistBalanceBrl: number;
  onExecutePayout: (amount: number, method: string, destination: string) => Promise<boolean>;
  payoutHistory: {
    id: string;
    amount: number;
    method: string;
    destination: string;
    txHash: string;
    timestamp: string;
    status: 'completed' | 'processing';
  }[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  projects,
  artistBalanceBrl,
  onExecutePayout,
  payoutHistory,
}) => {
  const totalStreams = projects.reduce((acc, p) => acc + p.stats.totalStreams, 0);
  const totalGrossRevenue = projects.reduce((acc, p) => acc + p.stats.grossRevenueBrl, 0);
  const totalNetArtist = projects.reduce((acc, p) => acc + p.stats.netArtistRevenueBrl, 0);
  const totalSupporters = projects.reduce((acc, p) => acc + p.stats.supportersCount, 0);

  // Brazilian Payout State
  const [payoutMethod, setPayoutMethod] = useState<'pix' | 'ted_banco' | 'picpay'>('pix');
  const [destination, setDestination] = useState<string>('artista.sp@substream.com.br');
  const [payoutAmount, setPayoutAmount] = useState<number>(Math.min(artistBalanceBrl, 500));
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; txHash?: string } | null>(null);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (payoutAmount < MIN_PAYOUT_THRESHOLD_BRL) {
      setFeedback({
        type: 'error',
        message: `O valor mínimo para saque é de ${formatBrl(MIN_PAYOUT_THRESHOLD_BRL)}.`,
      });
      return;
    }

    if (payoutAmount > artistBalanceBrl) {
      setFeedback({
        type: 'error',
        message: `Saldo insuficiente. Disponível para saque: ${formatBrl(artistBalanceBrl)}.`,
      });
      return;
    }

    const validation = validateBrazilianPayoutDestination(payoutMethod, destination);
    if (!validation.valid) {
      setFeedback({ type: 'error', message: validation.error || 'Destino de saque inválido.' });
      return;
    }

    setIsProcessing(true);
    try {
      const success = await onExecutePayout(payoutAmount, payoutMethod, destination);
      if (success) {
        setFeedback({
          type: 'success',
          message: `Saque imediato de ${formatBrl(payoutAmount)} realizado com sucesso!`,
          txHash: `PIX-E2E-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`,
        });
        setPayoutAmount(0);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mb-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>PAINEL DE DESEMPENHO BRASILEIRO // MONETIZAÇÃO TRANSPARENTE</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Lucros & Relatórios do Artista
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Repasse direto de 90% das vendas com liquidação imediata via Pix e rede bancária nacional.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-mono uppercase text-zinc-400 block">Saldo Disponível</span>
          <span className="text-2xl font-extrabold font-mono text-emerald-400">
            {formatBrl(artistBalanceBrl)}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Artist Revenue */}
        <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>SEU LUCRO LÍQUIDO (90%)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {formatBrl(totalNetArtist)}
          </div>
          <p className="text-[11px] text-zinc-400">
            Total bruto gerado: <strong className="text-zinc-200">{formatBrl(totalGrossRevenue)}</strong>
          </p>
        </div>

        {/* Total Streams */}
        <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>STREAMS TOTAIS</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {totalStreams.toLocaleString('pt-BR')}
          </div>
          <p className="text-[11px] text-zinc-400">
            Audições orgânicas pelo mapa regional
          </p>
        </div>

        {/* Supporters Count */}
        <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>APOIADORES & COMPRADORES</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {totalSupporters.toLocaleString('pt-BR')}
          </div>
          <p className="text-[11px] text-zinc-400">
            Ticket médio: <strong className="text-zinc-200">{formatBrl(totalGrossRevenue / (totalSupporters || 1))}</strong>
          </p>
        </div>

        {/* Community Reviews */}
        <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>AVALIAÇÕES REPRISED</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">
            4.8 ★
          </div>
          <p className="text-[11px] text-zinc-400">
            Média de aprovação comunitária
          </p>
        </div>
      </div>

      {/* Brazilian Fast Withdrawal Hub */}
      <div className="p-6 md:p-8 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SAQUE IMEDIATO BRASIL // SEM INTERMEDIÁRIOS</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Resgate Imediato de Lucros
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Envio instantâneo para sua chave Pix, conta bancária (TED) ou PicPay sem taxa de saque.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
            <span>Taxa de saque:</span>
            <span className="text-emerald-400 font-bold">R$ 0,00 (Gratuito)</span>
          </div>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`p-4 rounded-xl flex items-start gap-3 border ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800 text-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-medium">{feedback.message}</p>
              {feedback.txHash && (
                <p className="text-[11px] font-mono text-zinc-400 mt-1">
                  Identificador Pix E2E: <span className="text-zinc-200">{feedback.txHash}</span>
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleWithdraw} className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Rail Selector */}
          <div className="md:col-span-5 space-y-2">
            <label className="text-xs font-mono text-zinc-400 block">
              MÉTODO DE RECEBIMENTO BRASILEIRO
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPayoutMethod('pix');
                  setDestination('artista.sp@substream.com.br');
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  payoutMethod === 'pix'
                    ? 'bg-zinc-900 border-white text-white'
                    : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <QrCode className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Pix Instantâneo (Recomendado)</div>
                  <div className="text-[10px] text-zinc-500 font-mono">Cai em 2 segundos na sua conta</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPayoutMethod('ted_banco');
                  setDestination('Nubank (260) Ag. 0001 Conta 842109-2');
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  payoutMethod === 'ted_banco'
                    ? 'bg-zinc-900 border-white text-white'
                    : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Building className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Transferência Bancária (TED)</div>
                  <div className="text-[10px] text-zinc-500 font-mono">Nubank, Itaú, Bradesco, Inter, BB, Caixa</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPayoutMethod('picpay');
                  setDestination('@coletivourbano_sp');
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  payoutMethod === 'picpay'
                    ? 'bg-zinc-900 border-white text-white'
                    : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Smartphone className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold">PicPay / Carteira Digital</div>
                  <div className="text-[10px] text-zinc-500 font-mono">Crédito direto no seu @usuário</div>
                </div>
              </button>
            </div>
          </div>

          {/* Amount & Destination Input */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-1.5">
                <label>VALOR DO RESGATE (BRL)</label>
                <button
                  type="button"
                  onClick={() => setPayoutAmount(artistBalanceBrl)}
                  className="text-zinc-300 hover:text-white underline"
                >
                  Sacar Tudo ({formatBrl(artistBalanceBrl)})
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs">
                  R$
                </span>
                <input
                  type="number"
                  min="20"
                  max={artistBalanceBrl}
                  step="1"
                  value={payoutAmount || ''}
                  onChange={(e) => setPayoutAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1.5">
                {payoutMethod === 'pix'
                  ? 'CHAVE PIX (CPF, CNPJ, E-MAIL, CELULAR OU ALEATÓRIA)'
                  : payoutMethod === 'ted_banco'
                  ? 'DADOS BANCÁRIOS (BANCO, AGÊNCIA E CONTA CORRENTE)'
                  : 'NOME DE USUÁRIO DO PICPAY (@)'}
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Insira os dados..."
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-zinc-500"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing || artistBalanceBrl <= 0}
              className="w-full py-3 bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Enviando Pix...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Confirmar Saque Imediato</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Payout History Ledger */}
        <div className="pt-6 border-t border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>HISTÓRICO DE SAQUES PROCESSADOS</span>
            <span>{payoutHistory.length} saques liquidados</span>
          </div>

          <div className="divide-y divide-zinc-900 overflow-x-auto">
            {payoutHistory.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-zinc-200 font-bold">{formatBrl(item.amount)}</span>
                  <span className="text-zinc-500">·</span>
                  <span className="text-zinc-400 uppercase">{item.method}</span>
                  <span className="text-zinc-500 hidden sm:inline">({item.destination})</span>
                </div>
                <div className="flex items-center gap-4 text-zinc-500 text-[11px]">
                  <span className="truncate max-w-[140px]">{item.txHash}</span>
                  <span>{item.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
