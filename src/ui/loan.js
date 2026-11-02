// ═══════════════════════════════════════════════════════════════
//  BUSINESS TYCOON — Loan Modal
// ═══════════════════════════════════════════════════════════════

import { G } from '../game.js';
import { showToast } from './toast.js';
import { sfxGameOver } from '../sfx.js';
import { isAiCeoEnabled } from '../ai-ceo.js';
import { formatCurrency, formatNumber, t } from '../i18n/index.js';

let initialized = false;

function ensureListeners() {
  if (initialized) return;
  initialized = true;

  const slider = document.getElementById('loan-amount-slider');
  const amountDisplay = document.getElementById('loan-amount-display');
  const interestPreview = document.getElementById('loan-interest-preview');

  if (slider) {
    slider.addEventListener('input', () => {
      const amount = parseInt(slider.value, 10);
      amountDisplay.textContent = formatCurrency(amount);
      interestPreview.textContent = formatCurrency(Math.round(amount * G.loanInterestRate));
    });
  }

  document.getElementById('loan-take-btn')?.addEventListener('click', () => {
    const amount = parseInt(slider.value, 10);
    G.takeLoan(amount);
    hideLoanModal();
    G.gameSpeed = 1;
    showToast(t('toast.loanReceived', { amount: formatCurrency(amount) }));
  });

  document.getElementById('loan-decline-btn')?.addEventListener('click', () => {
    hideLoanModal();
    G.loanModalOpen = false;
    G.gameOver = true;
    sfxGameOver();
    showToast(t('toast.bankrupt'));
  });
}

export function showLoanModal() {
  ensureListeners();

  const modal = document.getElementById('loan-modal');
  if (!modal) return;

  // Update display values
  document.getElementById('loan-cash').textContent = formatCurrency(G.money);
  document.getElementById('loan-existing-debt').textContent = formatCurrency(G.debt);

  const slider = document.getElementById('loan-amount-slider');
  const amountDisplay = document.getElementById('loan-amount-display');
  const interestPreview = document.getElementById('loan-interest-preview');

  // Update dynamic interest rate display
  const rateDisplay = document.getElementById('loan-rate-display');
  if (rateDisplay) rateDisplay.textContent = `${formatNumber(Math.round(G.loanInterestRate * 100))}% ${t('loan.perWeek')}`;

  // Scale loan options based on current costs
  const defaultAmount = Math.max(2000, Math.ceil(G.metrics.dailyCosts * 5 / 1000) * 1000);
  slider.value = defaultAmount;
  amountDisplay.textContent = formatCurrency(defaultAmount);
  interestPreview.textContent = formatCurrency(Math.round(defaultAmount * G.loanInterestRate));

  modal.style.display = 'flex';

  // AI CEO auto-accepts loans
  if (isAiCeoEnabled()) {
    const amount = parseInt(slider.value, 10);
    G.takeLoan(amount);
    hideLoanModal();
    G.gameSpeed = 2;
    showToast(t('toast.aiLoan', { amount: formatCurrency(amount) }));
  }
}

function hideLoanModal() {
  const modal = document.getElementById('loan-modal');
  if (modal) modal.style.display = 'none';
}
