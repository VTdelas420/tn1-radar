/**
 * Core monetization and Brazilian payment calculations
 */

export const PLATFORM_FEE_PERCENTAGE = 0.10; // 10% plataforma
export const ARTIST_SHARE_PERCENTAGE = 0.90; // 90% direto para o artista
export const MIN_PAYOUT_THRESHOLD_BRL = 20.00; // Saque mínimo de R$ 20,00

export interface RevenueSplitBrl {
  grossAmountBrl: number;
  platformFeeBrl: number;
  artistNetBrl: number;
  effectiveTakeRate: number;
}

/**
 * Calculates the exact split in Brazilian Reais (90% artist, 10% platform)
 */
export function calculateRevenueSplitBrl(grossAmount: number): RevenueSplitBrl {
  const sanitizedGross = Math.max(0, Number(grossAmount.toFixed(2)));
  const platformFee = Number((sanitizedGross * PLATFORM_FEE_PERCENTAGE).toFixed(2));
  const artistNet = Number((sanitizedGross - platformFee).toFixed(2));
  const effectiveTakeRate = sanitizedGross > 0 ? Number((platformFee / sanitizedGross).toFixed(4)) : 0;

  return {
    grossAmountBrl: sanitizedGross,
    platformFeeBrl: platformFee,
    artistNetBrl: artistNet,
    effectiveTakeRate,
  };
}

/**
 * Validates whether an amount is acceptable for a given pricing model in BRL
 */
export function validatePaymentAmountBrl(
  amount: number,
  model: 'free' | 'paid' | 'name_your_price',
  basePrice: number,
  minPrice?: number
): { valid: boolean; error?: string } {
  if (model === 'free') {
    if (amount < 0) return { valid: false, error: 'O valor não pode ser negativo.' };
    return { valid: true };
  }

  if (model === 'paid') {
    if (amount < basePrice) {
      return { valid: false, error: `O valor do lançamento é de ${formatBrl(basePrice)}.` };
    }
    return { valid: true };
  }

  if (model === 'name_your_price') {
    const requiredMin = minPrice !== undefined ? minPrice : 0;
    if (amount < requiredMin) {
      return { valid: false, error: `Contribuição mínima exigida: ${formatBrl(requiredMin)}.` };
    }
    return { valid: true };
  }

  return { valid: true };
}

/**
 * Validates Brazilian payout destinations (Pix, TED Bancária, PicPay)
 */
export function validateBrazilianPayoutDestination(
  method: 'pix' | 'ted_banco' | 'picpay',
  destination: string
): { valid: boolean; error?: string } {
  const clean = destination.trim();
  if (!clean) return { valid: false, error: 'Informe a chave Pix ou dados da conta bancária.' };

  switch (method) {
    case 'pix':
      // Validates CPF (11 digits), CNPJ (14 digits), email (@), phone (+55 or DDD), or UUID key
      if (
        clean.includes('@') ||
        clean.length >= 11 ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)
      ) {
        return { valid: true };
      }
      return { valid: false, error: 'Chave Pix inválida. Use CPF, CNPJ, e-mail, celular ou chave aleatória.' };

    case 'ted_banco':
      // Bank info format: "Banco Nubank (260) Agência 0001 Conta 1234567-8"
      if (clean.length >= 8) {
        return { valid: true };
      }
      return { valid: false, error: 'Informe Banco, Agência e Conta com dígito.' };

    case 'picpay':
      if (clean.startsWith('@') || clean.length >= 4) {
        return { valid: true };
      }
      return { valid: false, error: 'Informe seu @usuario do PicPay.' };

    default:
      return { valid: true };
  }
}

/**
 * Calculates installment breakdown for Brazilian credit card
 */
export function calculateInstallments(
  totalBrl: number,
  maxInstallments = 6
): { count: number; installmentBrl: number; label: string }[] {
  const results = [];
  const safeTotal = Math.max(0, totalBrl);

  for (let i = 1; i <= maxInstallments; i++) {
    const installment = Number((safeTotal / i).toFixed(2));
    results.push({
      count: i,
      installmentBrl: installment,
      label: i === 1 ? `1x de ${formatBrl(safeTotal)} à vista` : `${i}x de ${formatBrl(installment)} sem juros`,
    });
  }
  return results;
}

/**
 * Haversine formula to calculate distance in km between two geo coordinates
 */
export function calculateGeoDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculates Reprised community rating metrics
 */
export function calculateReprisedRating(ratings: number[]): {
  average: number;
  count: number;
  starBreakdown: Record<number, number>;
} {
  if (!ratings.length) {
    return { average: 0, count: 0, starBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }

  const sum = ratings.reduce((acc, r) => acc + r, 0);
  const average = Number((sum / ratings.length).toFixed(1));

  const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratings.forEach((r) => {
    const rounded = Math.min(5, Math.max(1, Math.round(r)));
    breakdown[rounded] = (breakdown[rounded] || 0) + 1;
  });

  return {
    average,
    count: ratings.length,
    starBreakdown: breakdown,
  };
}

/**
 * Formats BRL currency neatly
 */
export function formatBrl(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
