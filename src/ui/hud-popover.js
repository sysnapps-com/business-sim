// ═══════════════════════════════════════════════════════════════
//  BUSINESS TYCOON — HUD Tooltip Popovers
// ═══════════════════════════════════════════════════════════════

import { G } from '../game.js';
import { getRoomInstances } from '../map.js';
import { ECONOMY } from '../config.js';
import { getMarketingBudget, hasSalesCapacity, getReputationPremium } from '../economy.js';
import { getActiveBuffSummary, getCeoNetWorth } from '../events.js';
import { formatCurrency, formatNumber, t, tp } from '../i18n/index.js';

const popoverEl = () => document.getElementById('hud-popover');
let hideTimer = null;
let activeTip = null;
let activeStat = null;

function row(label, value, color) {
  const c = color ? ` style="color:${color}"` : '';
  return `<div class="hud-popover-row"><span class="lbl">${label}</span><span class="val"${c}>${value}</span></div>`;
}

function divider() {
  return `<div class="hud-popover-divider"></div>`;
}

function getContent(tipKey) {
  const m = G.metrics || {};
  const costs = m.dailyCosts || 0;
  const rev = m.dailyRevenue || 0;
  const profit = rev - costs;

  switch (tipKey) {
    case 'cash': {
      const agentCount = G.agents.length;
      const totalSalary = G.agents.reduce((s, a) => s + (a.salary || 0), 0);
      const roomCount = getRoomInstances().length;
      const mktBudget = getMarketingBudget();
      return `
        <div class="hud-popover-title">${t('popover.cashTitle')}</div>
        <div class="hud-popover-desc">${t('popover.cashDesc')}</div>
        ${row(t('popover.dailyRevenue'), formatCurrency(Math.round(rev)), '#50c878')}
        ${row(t('popover.dailyCosts'), `-${formatCurrency(Math.round(costs))}`, '#e05050')}
        ${divider()}
        ${row(t('popover.salaries'), `${formatCurrency(totalSalary)}/day · ${t('popover.staffCount', { count: formatNumber(agentCount) })}`)}
        ${row(t('popover.officeRent'), `${formatCurrency(roomCount * 15)}/day · ${t('popover.roomCount', { count: formatNumber(roomCount) })}`)}
        ${mktBudget > 0 ? row(t('popover.marketing'), `${formatCurrency(mktBudget)}/day`) : ''}
        ${divider()}
        ${row(t('popover.netProfit'), `${profit >= 0 ? '+' : '-'}${formatCurrency(Math.abs(Math.round(profit)))}/day`, profit >= 0 ? '#50c878' : '#e05050')}
        ${G.capTable.ceo < 100 ? `${divider()}${row(t('popover.ceoStake'), `${formatNumber(G.capTable.ceo)}%`, G.capTable.ceo >= 50 ? '#50c878' : '#e0a030')}${G.capTable.investors > 0 ? row(t('popover.investors'), `${formatNumber(G.capTable.investors)}%`, '#e07030') : ''}${G.capTable.esop > 0 ? row(t('popover.esop'), `${formatNumber(G.capTable.esop)}%`, '#5090e0') : ''}${row(t('popover.ceoNetWorth'), formatCurrency(getCeoNetWorth()), G.capTable.ceo >= 50 ? '#50c878' : '#e0a030')}` : ''}
        ${(() => { const buffs = getActiveBuffSummary(); return buffs.length > 0 ? `${divider()}<div class="hud-popover-title" style="font-size:11px;margin-top:2px">${t('popover.activeEvents')}</div>${buffs.map(b => `<div style="font-size:10px;color:var(--text-dim);padding:1px 0">${b}</div>`).join('')}` : ''; })()}
      `;
    }

    case 'revenue': {
      const projectsDone = G.completedLog.length;
      const premium = getReputationPremium();
      const activeProjects = G.projects.filter(p => p.state === 'in_progress').length;
      const waitingProjects = G.projects.filter(p => p.state === 'waiting').length;
      return `
        <div class="hud-popover-title">${t('popover.revenueTitle')}</div>
        <div class="hud-popover-desc">${t('popover.revenueDesc')}</div>
        ${row(t('popover.projectsCompleted'), formatNumber(projectsDone))}
        ${row(t('popover.activeQueued'), `${formatNumber(activeProjects)} / ${formatNumber(waitingProjects)}`)}
        ${divider()}
        ${row(t('popover.repPremium'), `${formatNumber(Math.round(premium * 100))}%`, premium > 1 ? '#50c878' : '')}
        ${row(t('popover.dailyRevenue'), `${formatCurrency(Math.round(rev))}/day`, '#50c878')}
      `;
    }

    case 'debt': {
      const rate = G.loanInterestRate || 0;
      const weekly = Math.round(G.debt * rate);
      return `
        <div class="hud-popover-title">${t('popover.debtTitle')}</div>
        <div class="hud-popover-desc">${t('popover.debtDesc')}</div>
        ${row(t('popover.principal'), formatCurrency(G.debt), '#e05050')}
        ${row(t('popover.interestRate'), `${formatNumber(Math.round(rate * 100))}%/week`)}
        ${row(t('popover.weeklyInterest'), `+${formatCurrency(weekly)}`, '#e0a030')}
      `;
    }

    case 'day': {
      const weekDay = ((G.day - 1) % 7) + 1;
      const weeksIn = G.week || Math.ceil(G.day / 7);
      return `
        <div class="hud-popover-title">${t('popover.dayTitle', { day: formatNumber(G.day) })}</div>
        <div class="hud-popover-desc">${t('popover.dayDesc', { week: formatNumber(weeksIn), day: formatNumber(weekDay) })}</div>
        ${row(t('popover.week'), formatNumber(weeksIn))}
        ${row(t('popover.dayOfWeek'), `${formatNumber(weekDay)}/7`)}
        ${row(t('popover.speed'), `${formatNumber(G.speed || 1)}x`)}
      `;
    }

    case 'rep': {
      const premium = getReputationPremium();
      return `
        <div class="hud-popover-title">${t('popover.reputation')}</div>
        <div class="hud-popover-desc">${t('popover.reputationDesc')}</div>
        ${row(t('popover.score'), formatNumber(Math.round(G.reputation)))}
        ${row(t('popover.payPremium'), `${formatNumber(Math.round(premium * 100))}%`, premium > 1 ? '#50c878' : '')}
        ${divider()}
        <div class="hud-popover-desc" style="margin:0;font-size:10px">
          ${t('popover.qualityProjects')}<br>
          ${t('popover.decentProjects')}<br>
          ${t('popover.lateDeliveries')}
        </div>
      `;
    }

    case 'funnel': {
      const hasSales = hasSalesCapacity();
      const flowRate = hasSales ? 1.0 : ECONOMY.no_sales_flow_rate;
      const mktBudget = getMarketingBudget();
      const acv = m.acv || 0;
      const acvFactors = m.acvFactors || [];
      return `
        <div class="hud-popover-title">${t('popover.funnelTitle')}</div>
        <div class="hud-popover-desc">${t('popover.funnelDesc')}</div>
        ${row(t('popover.visitors'), formatNumber(Math.round(m.totalVisitors || 0)))}
        ${row(t('popover.organic'), formatNumber(Math.round(m.organicVisitors || 0)), '#50c878')}
        ${row(t('popover.paid'), formatNumber(Math.round(m.paidVisitors || 0)), '#4090e0')}
        ${divider()}
        ${row(t('popover.leads'), formatNumber(m.leads || 0, { maximumFractionDigits: 1 }))}
        ${row(t('popover.deals'), formatNumber(m.clients || 0, { maximumFractionDigits: 1 }))}
        ${divider()}
        ${row(t('popover.conversion'), `${formatNumber(Math.round(flowRate * 100))}%`, hasSales ? '#50c878' : '#e0a030')}
        ${!hasSales ? `<div class="hud-popover-desc" style="margin:4px 0 0;font-size:10px;color:#e0a030">${t('popover.noSales', { percent: formatNumber(Math.round(ECONOMY.no_sales_flow_rate * 100)) })}</div>` : ''}
        ${mktBudget > 0 ? row(t('popover.marketingBudget'), `${formatCurrency(mktBudget)}/day`) : `<div class="hud-popover-desc" style="margin:4px 0 0;font-size:10px;color:var(--text-faint)">${t('popover.budgetTip')}</div>`}
        ${divider()}
        <div class="hud-popover-title" style="font-size:12px;margin-top:2px">${t('popover.acvTitle')}</div>
        <div class="hud-popover-desc">${t('popover.acvDesc')}</div>
        ${row(t('popover.acv'), formatCurrency(acv), '#50c878')}
        ${acvFactors.length > 0 ? acvFactors.map(f =>
          row(`  ${f.label}`, `${f.mult > 1 ? '+' : ''}${Math.round((f.mult - 1) * 100)}%`, f.mult > 1 ? '#50c878' : '#e0a030')
        ).join('') : row(t('popover.noBonuses'), '—', 'var(--text-faint)')}
      `;
    }

    case 'alignment': {
      const nonCeo = G.agents.filter(a => a.roleKey !== 'ceo');
      const avg = nonCeo.length > 0
        ? nonCeo.reduce((s, a) => s + a.alignment, 0) / nonCeo.length
        : 0;
      const avgPct = Math.round(avg * 100);
      const lowest = nonCeo.length > 0
        ? nonCeo.reduce((min, a) => a.alignment < min.alignment ? a : min, nonCeo[0])
        : null;
      const misaligned = nonCeo.filter(a => a.alignment < 0.35).length;
      return `
        <div class="hud-popover-title">${t('popover.alignmentTitle')}</div>
        <div class="hud-popover-desc">${t('popover.alignmentDesc')}</div>
        ${row(t('popover.average'), `${formatNumber(avgPct)}%`, avgPct > 60 ? '#50a8e8' : avgPct > 35 ? '#e0a030' : '#e05050')}
        ${row(t('popover.teamSize'), formatNumber(nonCeo.length))}
        ${misaligned > 0 ? row(t('popover.misaligned'), tp('popover.agentCount', misaligned), '#e05050') : ''}
        ${lowest ? row(t('popover.lowest'), `${lowest.name}: ${formatNumber(Math.round(lowest.alignment * 100))}%`, lowest.alignment < 0.35 ? '#e05050' : '') : ''}
        ${divider()}
        <div class="hud-popover-desc" style="margin:0;font-size:10px">
          ${t('popover.alignmentTips', {
            standup: formatNumber(Math.round(0.08 * 100)),
            teamBuilding: formatNumber(Math.round(0.15 * 100)),
          })}
        </div>
      `;
    }

    default:
      return '';
  }
}

export function initHudPopovers() {
  const el = popoverEl();
  if (!el) return;

  const showPopover = (stat, tipKey) => {
    const content = getContent(tipKey);
    if (!content) return;

    el.innerHTML = content;
    el.classList.add('visible');

    const rect = stat.getBoundingClientRect();
    el.style.left = Math.max(8, rect.left + rect.width / 2 - el.offsetWidth / 2) + 'px';
    el.style.top = (rect.bottom + 8) + 'px';

    const elRect = el.getBoundingClientRect();
    if (elRect.right > window.innerWidth - 8) {
      el.style.left = (window.innerWidth - elRect.width - 8) + 'px';
    }
  };

  globalThis.addEventListener('locale-change', () => {
    if (activeStat && activeTip) showPopover(activeStat, activeTip);
  });

  document.querySelectorAll('[data-hud-tip]').forEach(stat => {
    stat.addEventListener('mouseenter', () => {
      clearTimeout(hideTimer);
      const tipKey = stat.dataset.hudTip;
      activeTip = tipKey;
      activeStat = stat;
      showPopover(stat, tipKey);
    });

    stat.addEventListener('mouseleave', () => {
      hideTimer = setTimeout(() => {
        el.classList.remove('visible');
        if (activeStat === stat) {
          activeStat = null;
          activeTip = null;
        }
      }, 100);
    });
  });
}
