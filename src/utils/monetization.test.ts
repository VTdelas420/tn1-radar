import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRevenueSplitBrl,
  validatePaymentAmountBrl,
  calculateInstallments,
  calculateGeoDistanceKm,
  validateBrazilianPayoutDestination,
  calculateReprisedRating,
  formatBrl,
} from './monetization';

test('calculateRevenueSplitBrl accurately assigns 90% to artist and 10% to platform in BRL', () => {
  const result50 = calculateRevenueSplitBrl(50.00);
  assert.equal(result50.grossAmountBrl, 50.00);
  assert.equal(result50.artistNetBrl, 45.00);
  assert.equal(result50.platformFeeBrl, 5.00);

  const result15 = calculateRevenueSplitBrl(15.00);
  assert.equal(result15.grossAmountBrl, 15.00);
  assert.equal(result15.artistNetBrl, 13.50);
  assert.equal(result15.platformFeeBrl, 1.50);
});

test('calculateInstallments computes parcelas without interest up to 6x', () => {
  const installments = calculateInstallments(60.00, 6);
  assert.equal(installments.length, 6);
  assert.equal(installments[0].installmentBrl, 60.00);
  assert.equal(installments[2].count, 3);
  assert.equal(installments[2].installmentBrl, 20.00);
});

test('validatePaymentAmountBrl checks free, fixed, and name-your-price bounds in BRL', () => {
  assert.equal(validatePaymentAmountBrl(0, 'free', 0).valid, true);
  assert.equal(validatePaymentAmountBrl(-10, 'free', 0).valid, false);

  assert.equal(validatePaymentAmountBrl(10, 'paid', 25).valid, false);
  assert.equal(validatePaymentAmountBrl(25, 'paid', 25).valid, true);

  assert.equal(validatePaymentAmountBrl(2, 'name_your_price', 0, 5).valid, false);
  assert.equal(validatePaymentAmountBrl(10, 'name_your_price', 0, 5).valid, true);
});

test('validateBrazilianPayoutDestination verifies Pix and Brazilian bank details', () => {
  assert.equal(
    validateBrazilianPayoutDestination('pix', 'produtor.sp@substream.com.br').valid,
    true
  );
  assert.equal(
    validateBrazilianPayoutDestination('pix', '11987654321').valid,
    true
  );
  assert.equal(
    validateBrazilianPayoutDestination('pix', '123').valid,
    false
  );
  assert.equal(
    validateBrazilianPayoutDestination('picpay', '@marina_produtora').valid,
    true
  );
});

test('calculateReprisedRating aggregates review scores correctly', () => {
  const result = calculateReprisedRating([5, 4, 5, 4, 5]);
  assert.equal(result.average, 4.6);
  assert.equal(result.count, 5);
  assert.equal(result.starBreakdown[5], 3);
  assert.equal(result.starBreakdown[4], 2);
});

test('formatBrl formats numbers in Brazilian Real format', () => {
  const formatted = formatBrl(25.50);
  assert.ok(formatted.includes('25,50') || formatted.includes('R$'));
});
