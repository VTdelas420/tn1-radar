import React, { useState } from 'react';
import { MusicProject } from '../types/music';
import {
  X,
  ShoppingBag,
  QrCode,
  CreditCard,
  Barcode,
  CheckCircle2,
  Download,
  Copy,
  ArrowRight,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import {
  calculateRevenueSplitBrl,
  validatePaymentAmountBrl,
  calculateInstallments,
  formatBrl,
} from '../utils/monetization';

interface CheckoutModalProps {
  project: MusicProject;
  onClose: () => void;
  onSuccessPayment: (
    project: MusicProject,
    amountBrl: number,
    supporterName: string,
    comment: string,
    method: 'pix' | 'cartao_credito' | 'boleto' | 'nupay_picpay'
  ) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  project,
  onClose,
  onSuccessPayment,
}) => {
  const defaultAmount =
    project.pricingModel === 'free'
      ? 0
      : project.pricingModel === 'name_your_price'
      ? project.minPriceBrl || 15
      : project.priceBrl;

  const [amount, setAmount] = useState<number>(defaultAmount);
  const [supporterName, setSupporterName] = useState('');
  const [comment, setComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao_credito' | 'boleto' | 'nupay_picpay'>('pix');
  const [selectedInstallment, setSelectedInstallment] = useState<number>(1);
  const [copiedPix, setCopiedPix] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const split = calculateRevenueSplitBrl(amount);
  const installments = calculateInstallments(amount, 6);

  // Mock Brazilian Pix Copia e Cola payload
  const pixCopiaCola = `00020126580014br.gov.bcb.pix0136substream-${project.slug}-${Date.now()}520400005303986540${amount.toFixed(2)}5802BR5913${project.artistName.slice(0, 13)}6009SAO_PAULO62070503***6304`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCopiaCola);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const check = validatePaymentAmountBrl(
      amount,
      project.pricingModel,
      project.priceBrl,
      project.minPriceBrl
    );

    if (!check.valid) {
      setValidationError(check.error || 'Valor inválido.');
      return;
    }

    onSuccessPayment(
      project,
      amount,
      supporterName.trim() || 'Ouvinte Anônimo',
      comment.trim(),
      paymentMethod
    );
    setIsCompleted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              {isCompleted ? 'Apoio Confirmado' : 'Apoio Direto // Pagamento Brasileiro'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isCompleted ? (
          /* Post-Purchase Success Screen */
          <div className="p-6 text-center space-y-6 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-white">
                {amount > 0 ? 'Obrigado pelo seu apoio!' : 'Download Liberado!'}
              </h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                {amount > 0
                  ? `Seu pagamento de ${formatBrl(amount)} foi processado. ${formatBrl(split.artistNetBrl)} foi creditado diretamente ao artista.`
                  : 'Os arquivos masters lossless em alta fidelidade estão liberados.'}
              </p>
            </div>

            {/* Lossless Assets Ready to Download */}
            <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-3 text-left">
              <div className="text-xs text-zinc-400 flex items-center justify-between">
                <span>PACOTE DIGITAL DISPONÍVEL</span>
                <span className="text-emerald-400 font-bold">24-BIT / 96KHZ FLAC</span>
              </div>

              <div className="space-y-2">
                <a
                  href={`#download-${project.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Iniciando download do pacote Master Lossless de "${project.title}" (FLAC + WAV + Encarte Digital).`);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Download Master Completo (.ZIP - 380MB)</span>
                  </div>
                  <span className="text-zinc-400">FLAC</span>
                </a>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-white text-zinc-950 font-bold text-xs rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Concluir & Voltar ao Mapa
            </button>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handlePay} className="p-6 space-y-5 overflow-y-auto">
            {/* Project Capsule Preview */}
            <div className="flex items-center gap-3 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
              <img
                src={project.coverArt}
                alt={project.title}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-zinc-400 truncate">
                  {project.catalogNumber} · {project.city}, {project.state || 'BR'}
                </div>
                <h4 className="text-xs font-bold text-white truncate">{project.title}</h4>
                <div className="text-[11px] text-zinc-400 truncate">{project.artistName} · {project.audioQuality}</div>
              </div>
            </div>

            {/* Amount Selection in BRL */}
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                <label>VALOR DA CONTRIBUIÇÃO (BRL)</label>
                {project.pricingModel === 'free' && (
                  <span className="text-emerald-400">Projeto Gratuito (Doação Opcional)</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
                    R$
                  </span>
                  <input
                    type="number"
                    min={project.pricingModel === 'free' ? 0 : project.minPriceBrl || 0}
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5">
                  {[15, 25, 50].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className="px-2.5 py-2 text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800"
                    >
                      R${preset}
                    </button>
                  ))}
                </div>
              </div>

              {validationError && (
                <p className="text-xs text-rose-400 mt-1">{validationError}</p>
              )}
            </div>

            {/* Transparent Split in Reais */}
            {amount > 0 && (
              <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-emerald-400 font-semibold">
                  <span>90% cai direto na conta do artista:</span>
                  <span>{formatBrl(split.artistNetBrl)}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-500">
                  <span>10% taxa de servidor e streaming:</span>
                  <span>{formatBrl(split.platformFeeBrl)}</span>
                </div>
              </div>
            )}

            {/* Brazilian Payment Rails Selection */}
            {amount > 0 && (
              <div className="space-y-3">
                <label className="text-xs text-zinc-400 block">
                  FORMA DE PAGAMENTO BRASILEIRA
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      paymentMethod === 'pix'
                        ? 'bg-zinc-900 border-white text-white'
                        : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <QrCode className="w-4 h-4 mb-1.5 text-emerald-400" />
                    <div className="text-xs font-bold">Pix Instantâneo</div>
                    <div className="text-[10px] text-zinc-500">Confirmação em 2s</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cartao_credito')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      paymentMethod === 'cartao_credito'
                        ? 'bg-zinc-900 border-white text-white'
                        : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mb-1.5 text-amber-400" />
                    <div className="text-xs font-bold">Cartão de Crédito</div>
                    <div className="text-[10px] text-zinc-500">Em até 6x sem juros</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('nupay_picpay')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      paymentMethod === 'nupay_picpay'
                        ? 'bg-zinc-900 border-white text-white'
                        : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mb-1.5 text-purple-400" />
                    <div className="text-xs font-bold">NuPay / PicPay</div>
                    <div className="text-[10px] text-zinc-500">App direto no celular</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('boleto')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      paymentMethod === 'boleto'
                        ? 'bg-zinc-900 border-white text-white'
                        : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Barcode className="w-4 h-4 mb-1.5 text-athos-400" />
                    <div className="text-xs font-bold">Boleto Bancário</div>
                    <div className="text-[10px] text-zinc-500">Vencimento em 3 dias</div>
                  </button>
                </div>

                {/* Sub-form based on Brazilian method */}
                {paymentMethod === 'pix' && (
                  <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300">PIX COPIA E COLA</span>
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedPix ? 'Chave Copiada!' : 'Copiar Código'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-500 break-all bg-zinc-950 p-2.5 rounded border border-zinc-800/80">
                      {pixCopiaCola}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Após o pagamento no app do seu banco, o download é liberado na hora.</span>
                    </div>
                  </div>
                )}

                {paymentMethod === 'cartao_credito' && (
                  <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
                    {/* Installments selection */}
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">
                        PARCELAMENTO
                      </label>
                      <select
                        value={selectedInstallment}
                        onChange={(e) => setSelectedInstallment(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none"
                      >
                        {installments.map((inst) => (
                          <option key={inst.count} value={inst.count}>
                            {inst.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="Número do Cartão (Elo, Visa, Master)"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-white placeholder-zinc-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/AA"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-white placeholder-zinc-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="CVV"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-white placeholder-zinc-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'boleto' && (
                  <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>LINHA DIGITÁVEL DO BOLETO</span>
                      <span className="text-zinc-500">Banco do Brasil</span>
                    </div>
                    <div className="bg-zinc-950 p-2.5 rounded text-[11px] text-zinc-300 border border-zinc-800">
                      00190.00009 01234.567890 12345.678901 1 9876000000{amount.toFixed(0)}00
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      O boleto é compensado em até 1 dia útil. O comprovante é enviado ao seu e-mail.
                    </p>
                  </div>
                )}

                {paymentMethod === 'nupay_picpay' && (
                  <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2 text-xs">
                    <p className="text-zinc-300">
                      Você será redirecionado para autorizar o débito direto no seu aplicativo Nubank ou PicPay com biometria.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Supporter Name & Optional Review */}
            <div className="space-y-2">
              <input
                type="text"
                value={supporterName}
                onChange={(e) => setSupporterName(e.target.value)}
                placeholder="Seu nome ou @handle de apoiador (opcional)"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />

              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Deixe uma mensagem para o mural da cápsula (opcional)"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              className="w-full py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>
                {amount === 0
                  ? 'Baixar Gratuitamente'
                  : `Confirmar e Pagar ${formatBrl(amount)} via ${
                      paymentMethod === 'pix'
                        ? 'Pix'
                        : paymentMethod === 'cartao_credito'
                        ? 'Cartão'
                        : paymentMethod === 'boleto'
                        ? 'Boleto'
                        : 'NuPay/PicPay'
                    }`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
