// ═══════════════════════════════════════════════════════════════
//  BUSINESS TYCOON — Strategy Panel (business identity + tech tree)
// ═══════════════════════════════════════════════════════════════

import { OFFICE_GUIDE, COMPANY_TYPES, OFFICE_TYPES, DIVERSIFICATION_CONFIG, GROWTH_MODELS } from '../config.js';
import { getRoomInstances, countRoomsByType } from '../map.js';
import { G } from '../game.js';
import { getUnlockTree, chooseTechBranch, hasDiversifyBranch } from '../progression.js';
import {
  getOfficeCategoriesForCompany, getOfficeRole, canDiversifyOffice,
  getDiversificationCost, getDiversificationSynergyBonus,
} from '../economy.js';
import { showToast } from './toast.js';
import { formatCurrency, formatNumber, t, translateLabel } from '../i18n/index.js';

let strategyEl = null;

function money(n) {
  return formatCurrency(Math.round(n || 0));
}

function getBusinessIdentity() {
  const companyDef = COMPANY_TYPES[G.companyType];
  if (companyDef) {
    const gm = GROWTH_MODELS[G.companyType];
    const gmBadge = gm ? ` · <span style="font-size:10px;padding:1px 6px;border-radius:999px;background:rgba(80,144,224,0.15);color:#80b8e8;border:1px solid rgba(80,144,224,0.3)">${gm.label}</span>` : '';
    return {
      title: `${companyDef.icon} ${translateLabel(`content.companies.${G.companyType}.name`, companyDef.name)}${gmBadge}`,
      subtitle: companyDef.tagline,
    };
  }
  return { title: t('strategy.unfocused'), subtitle: t('strategy.defineModel') };
}

function buildMoneyDrivers() {
  const builtRooms = getRoomInstances();
  const builtTypes = new Set(builtRooms.map(r => r.typeKey));
  const categories = getOfficeCategoriesForCompany();
  let html = '';

  for (const [catKey, cat] of Object.entries(categories)) {
    if (catKey === 'common') continue;
    const roomsInCat = cat.offices.filter(key => builtTypes.has(key) && key !== 'lobby');
    if (roomsInCat.length === 0) continue;

    html += `<div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:1px;margin-top:8px;margin-bottom:4px">${cat.icon} ${cat.label}</div>`;
    for (const key of roomsInCat) {
      const room = builtRooms.find(r => r.typeKey === key);
      if (!room) continue;
      const active = G.projects.filter(p => p.targetOffice === key && p.state === 'in_progress').length;
      const earned = G.metrics.officeRevenue?.[key] || 0;
      const guide = OFFICE_GUIDE[key];
      if (!guide) continue;

      // Diversification status
      let diversifyHtml = '';
      if (G.remodelingOffices[key] > 0) {
        diversifyHtml = `<div style="font-size:10px;color:var(--warning);margin-top:2px">${t('strategy.remodeling', { days: formatNumber(G.remodelingOffices[key]) })}</div>`;
      } else if (G.diversifiedOffices.has(key)) {
        diversifyHtml = `<div style="font-size:10px;color:#50c878;margin-top:2px">${t('strategy.diversified')}</div>`;
      } else if (hasDiversifyBranch() && canDiversifyOffice(key)) {
        const cost = getDiversificationCost(key);
        diversifyHtml = `<button class="diversify-btn" data-office="${key}" style="font-size:10px;padding:2px 8px;margin-top:3px;cursor:pointer;background:rgba(80,200,120,0.15);border:1px solid rgba(80,200,120,0.4);border-radius:4px;color:#89dca5">${t('strategy.diversify', { amount: formatCurrency(cost) })}</button>`;
      }

      html += `
        <div class="strategy-row">
          <div class="strategy-row-main">${room.type.icon} ${translateLabel(`content.offices.${key}`, room.type.name)}</div>
          <div class="strategy-row-meta">${guide.role}</div>
          <div class="strategy-row-sub">${guide.impact}</div>
          <div class="strategy-row-stats">${t('strategy.earned')} ${money(earned)} · ${t('strategy.active')} ${formatNumber(active)}</div>
          ${diversifyHtml}
        </div>
      `;
    }
  }

  // Diversification synergy summary
  const synergy = getDiversificationSynergyBonus();
  if (synergy.payBonus > 0) {
    html += `<div style="font-size:10px;padding:4px 6px;margin-top:6px;background:rgba(80,200,120,0.1);border:1px solid rgba(80,200,120,0.25);border-radius:4px;color:#89dca5">${t('strategy.deliverySynergy')}: ${synergy.label}</div>`;
  }

  return html || `<div class="strategy-empty">${t('strategy.noDrivers')}</div>`;
}

function getTechTreeRows() {
  const tree = getUnlockTree();
  return tree.map(node => {
    if (node.type === 'branch') {
      const stateIcon = node.unlocked ? '✅' : node.excluded ? '❌' : node.canChoose ? '🔓' : '🔒';
      const bgColor = node.unlocked ? 'rgba(80,200,120,0.1)' : node.excluded ? 'rgba(224,80,80,0.08)' : node.canChoose ? 'rgba(224,160,48,0.1)' : '';
      const borderColor = node.unlocked ? 'rgba(80,200,120,0.3)' : node.excluded ? 'rgba(224,80,80,0.2)' : node.canChoose ? 'rgba(224,160,48,0.3)' : '';
      const chooseBtn = node.canChoose
        ? `<button class="branch-choose-btn" data-branch="${node.key}" style="font-size:10px;padding:3px 10px;margin-top:4px;cursor:pointer;background:rgba(224,160,48,0.2);border:1px solid rgba(224,160,48,0.5);border-radius:4px;color:#f0c040">${t('strategy.choosePath', { amount: formatCurrency(node.cost) })}</button>`
        : '';
      return `
        <div class="tech-node ${node.unlocked ? 'done' : ''}" style="background:${bgColor};border:1px solid ${borderColor};border-radius:6px;padding:6px 8px;margin:4px 0">
          <div class="tech-title">${stateIcon} Tier ${node.tier} · ${node.icon} ${node.name}</div>
          <div class="tech-progress" style="font-size:11px">${node.requirement}</div>
          <div class="tech-progress">${node.progress}</div>
          ${chooseBtn}
        </div>
      `;
    }
    return `
      <div class="tech-node ${node.unlocked ? 'done' : ''}">
        <div class="tech-title">${node.unlocked ? '✅' : '🔒'} Tier ${node.tier} · ${node.icon} ${node.name}</div>
        <div class="tech-progress">${node.unlocked ? 'Unlocked' : `${node.requirement} (${node.progress})`}</div>
      </div>
    `;
  }).join('');
}

function getSourceMixSummary() {
  const recent = (G.completedLog || []).slice(0, 10);
  if (recent.length === 0) {
    return t('strategy.lastSources') + ` ${t('strategy.noCompleted')}`;
  }

  const counts = { paid: 0, organic: 0, referral: 0 };
  for (const p of recent) {
    const key = p.source === 'paid' || p.source === 'referral' ? p.source : 'organic';
    counts[key]++;
  }

  const total = recent.length;
  const pct = n => Math.round((n / total) * 100);
  return `${t('strategy.lastSources', { count: formatNumber(total) })} 📣 ${t('strategy.paid')} ${formatNumber(pct(counts.paid))}% · 🌿 ${t('strategy.sourceOrganic')} ${formatNumber(pct(counts.organic))}% · 🤝 ${t('employee.referral')} ${formatNumber(pct(counts.referral))}%`;
}

function getBottleneckDiagnosis() {
  if (G.agents.length === 0) return { state: 'blocked', text: t('strategy.noTeam') };

  const hasTrafficOffice = getRoomInstances().some(r =>
    ['content', 'sales', 'marketing', 'seo'].includes(r.typeKey)
  );
  if (!hasTrafficOffice) {
    return { state: 'blocked', text: t('strategy.noTraffic') };
  }

  const staffCount = G.agents.filter(a => a.roleKey !== 'ceo').length;
  if (staffCount === 0) {
    return { state: 'blocked', text: t('strategy.noDelivery') };
  }

  if ((G.metrics.totalVisitors || 0) < 20) {
    return { state: 'warn', text: t('strategy.trafficBottleneck') };
  }
  if ((G.metrics.leads || 0) < 0.5) {
    return { state: 'warn', text: t('strategy.leadBottleneck') };
  }
  if ((G.metrics.salesCapacity || 0) < 0.2) {
    return { state: 'warn', text: t('strategy.salesBottleneck') };
  }
  if ((G.metrics.clients || 0) < 0.2) {
    return { state: 'warn', text: t('strategy.pipelineWarming') };
  }

  return { state: 'ok', text: t('strategy.healthyPipeline') };
}

export function initStrategyPanel() {
  strategyEl = document.getElementById('strategy-panel');
}

export function updateStrategyPanel() {
  if (!strategyEl) return;

  const identity = getBusinessIdentity();
  const balance = G.metrics.staffingBalance ?? 100;
  const potential = G.metrics.potentialClients ?? 0;
  const actual = G.metrics.clients ?? 0;
  const capacity = G.metrics.salesCapacity ?? 0;
  const balanceNote = balance < 70
    ? t('strategy.bottleneckBalance')
    : t('strategy.healthyBalance');
  const bottleneck = getBottleneckDiagnosis();
  const bottleneckColor = bottleneck.state === 'ok'
    ? 'var(--success)'
    : bottleneck.state === 'warn' ? 'var(--warning)' : '#e09090';
  const sourceMix = getSourceMixSummary();
  strategyEl.innerHTML = `
    <div class="strategy-card">
      <h4>${t('strategy.identity')}</h4>
      <div class="strategy-business">${identity.title}</div>
      <div class="strategy-note">${identity.subtitle}</div>
    </div>

    <div class="strategy-card">
      <h4>${t('strategy.makesMoney')}</h4>
      <div class="strategy-note">${t('strategy.potential', {
        potential: formatNumber(potential), capacity: formatNumber(capacity), actual: formatNumber(actual),
      })}</div>
      <div class="strategy-note">${t('strategy.gtmBalance', { balance: formatNumber(balance), note: balanceNote })}</div>
      <div class="strategy-note" style="margin-top:6px;color:${bottleneckColor}">${t('strategy.diagnosisLine', { text: bottleneck.text })}</div>
      <div class="strategy-note" style="margin-top:4px">${sourceMix}</div>
      ${buildMoneyDrivers()}
    </div>

    <div class="strategy-card">
      <h4>${t('strategy.techTree')}</h4>
      ${getTechTreeRows()}
    </div>
  `;

  // Branch choice buttons
  strategyEl.querySelectorAll('.branch-choose-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const branchKey = btn.dataset.branch;
      const success = chooseTechBranch(branchKey);
      if (success) {
        const labelKeys = { specialize: 'specialize', diversify_branch: 'diversifyBranch', scale_ops: 'scaleOps' };
        showToast(t('strategy.branchChosen', { branch: labelKeys[branchKey] ? t(`strategy.${labelKeys[branchKey]}`) : branchKey }));
        G.uiDirty = true;
        updateStrategyPanel();
      } else {
        showToast(t('strategy.cannotChoose'));
      }
    });
  });

  // Diversify buttons
  strategyEl.querySelectorAll('.diversify-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const officeKey = btn.dataset.office;
      if (!canDiversifyOffice(officeKey)) {
        showToast(t('strategy.cannotDiversify'));
        return;
      }
      const cost = getDiversificationCost(officeKey);
      G.money -= cost;
      G.remodelingOffices[officeKey] = DIVERSIFICATION_CONFIG.remodelingDays;
      const roomDef = OFFICE_TYPES[officeKey];
      showToast(t('strategy.remodelingToast', {
        office: translateLabel(`content.offices.${officeKey}`, roomDef?.name || officeKey),
        days: formatNumber(DIVERSIFICATION_CONFIG.remodelingDays),
      }));
      G.uiDirty = true;
      updateStrategyPanel();
    });
  });
}
