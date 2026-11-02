// ═══════════════════════════════════════════════════════════════
//  BUSINESS TYCOON — Level Intro Overlay
// ═══════════════════════════════════════════════════════════════

import { G } from '../game.js';
import { getRoomInstances } from '../map.js';
import { formatNumber, t } from '../i18n/index.js';

let introEl = null;
let hideTimer = null;

export function initIntro() {
  introEl = document.getElementById('level-intro');
}

// ─── Company level: earned through actual progress ───────
// Revenue is the primary driver, but team size and offices give bonus XP.
// This means a broke company stays at low levels even after many weeks,
// while a fast-growing one rockets through stages.

const LEVEL_THRESHOLDS = [
  //  lvl   revenue   team  offices
  {   lvl: 1,   rev: 0,        team: 0, rooms: 0 },
  {   lvl: 2,   rev: 500,      team: 1, rooms: 1 },
  {   lvl: 3,   rev: 2000,     team: 1, rooms: 2 },
  {   lvl: 4,   rev: 5000,     team: 2, rooms: 3 },
  {   lvl: 5,   rev: 10000,    team: 3, rooms: 4 },
  {   lvl: 6,   rev: 20000,    team: 4, rooms: 5 },
  {   lvl: 7,   rev: 35000,    team: 5, rooms: 6 },
  {   lvl: 8,   rev: 55000,    team: 6, rooms: 7 },
  {   lvl: 9,   rev: 80000,    team: 7, rooms: 8 },
  {   lvl: 10,  rev: 120000,   team: 8, rooms: 9 },
  {   lvl: 11,  rev: 170000,   team: 9, rooms: 10 },
  {   lvl: 12,  rev: 250000,   team: 10, rooms: 11 },
  {   lvl: 13,  rev: 350000,   team: 11, rooms: 12 },
  {   lvl: 14,  rev: 500000,   team: 12, rooms: 13 },
  {   lvl: 15,  rev: 700000,   team: 13, rooms: 14 },
  {   lvl: 16,  rev: 1000000,  team: 14, rooms: 15 },
];

// Stages: title + eyebrow keyed to computed level
const LEVEL_STAGES = [
  { max: 1,  key: 'garage' },
  { max: 2,  key: 'firstSteps' },
  { max: 3,  key: 'scrappyStartup' },
  { max: 4,  key: 'growingPains' },
  { max: 5,  key: 'realBusiness' },
  { max: 6,  key: 'marketTraction' },
  { max: 8,  key: 'revenueEngine' },
  { max: 10, key: 'industryPlayer' },
  { max: 12, key: 'growthMachine' },
  { max: 14, key: 'marketLeader' },
  { max: 99, key: 'empire' },
];

export function getCompanyLevel() {
  const rev = G.totalRevenue;
  const team = G.agents.length;
  const rooms = getRoomInstances().length;

  let level = 1;
  for (const t of LEVEL_THRESHOLDS) {
    // Must meet revenue AND at least one of team/rooms
    if (rev >= t.rev && (team >= t.team || rooms >= t.rooms)) {
      level = t.lvl;
    } else {
      break;
    }
  }
  return level;
}

function getStage(level) {
  return LEVEL_STAGES.find(s => level <= s.max) || LEVEL_STAGES[LEVEL_STAGES.length - 1];
}

// Subtitle pools — themed by progress tier
const SUBTITLES_EARLY = [
  'Every empire starts somewhere.',
  'Your first hire is waiting.',
  'Build something great.',
  'Keep the lights on.',
  'Ramen profitable? Not yet.',
  'The journey of a thousand deals...',
];

const SUBTITLES_GROWTH = [
  'Bigger deals, bigger stakes.',
  'Time to hire smarter.',
  'The competition is watching.',
  'Revenue is oxygen. Keep breathing.',
  'Scale or stall — your call.',
  'Your reputation precedes you.',
  'The phones won\'t stop ringing.',
];

const SUBTITLES_LATE = [
  'They write about companies like yours.',
  'From startup to powerhouse.',
  'Talent is lining up at your door.',
  'The board is impressed.',
  'Acquisition offers incoming...',
  'You\'re building a legacy.',
  'The market bends to your will.',
  'IPO or keep printing cash?',
];

function pickSubtitle(level) {
  const group = level <= 4 ? 'early' : level <= 10 ? 'growth' : 'late';
  const pool = group === 'early' ? SUBTITLES_EARLY : group === 'growth' ? SUBTITLES_GROWTH : SUBTITLES_LATE;
  const index = Math.floor(Math.random() * pool.length);
  return t(`intro.subtitles.${group}.${index}`);
}

// Track last shown level so we only show the intro on actual level-ups
let lastShownLevel = 0;
let lastIntroArgs = null;

export function showLevelIntro({ week, day, subtitle } = {}) {
  lastIntroArgs = { week, day, subtitle };
  renderLevelIntro(lastIntroArgs);
}

function renderLevelIntro({ week, day, subtitle } = {}, force = false) {
  if (!introEl) return;

  const level = getCompanyLevel();

  // Don't show if company hasn't actually leveled up since last intro
  if (!force && level <= lastShownLevel && !subtitle) return;
  lastShownLevel = level;

  const stage = getStage(level);
  const dayText = day ? t('intro.weekDay', { week: formatNumber(week), day: formatNumber(day) }) : '';
  const sub = subtitle || pickSubtitle(level);
  const stageText = t(`intro.stages.${stage.key}.title`);
  const eyebrowText = t(`intro.stages.${stage.key}.eyebrow`);

  introEl.innerHTML = `
    <div class="intro-eyebrow">${eyebrowText}</div>
    <div class="intro-title">${stageText}</div>
    <div class="intro-level">${t('intro.level', { level: formatNumber(level) })}</div>
    <div class="intro-subtitle">${sub}</div>
    <div class="intro-meta">${dayText}</div>
    <div class="intro-skip">${t('intro.skip')}</div>
  `;

  introEl.classList.add('visible');

  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(hideIntro, 2400);
}

export function refreshIntro() {
  if (introEl?.classList.contains('visible') && lastIntroArgs) {
    renderLevelIntro(lastIntroArgs, true);
  }
}

export function hideIntro() {
  if (!introEl) return;
  introEl.classList.remove('visible');
}
