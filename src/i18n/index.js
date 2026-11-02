import en from './en.js';
import es from './es.js';

function deepFreeze(value) {
  Object.values(value).forEach(item => {
    if (item && typeof item === 'object' && !Object.isFrozen(item)) deepFreeze(item);
  });
  return Object.freeze(value);
}

const catalogs = deepFreeze({ en, es });
const supportedLocales = Object.freeze(Object.keys(catalogs));
const STORAGE_KEY = 'business_tycoon_locale_v1';
const CURRENCY = 'USD';

let currentLocale = 'en';

function normalizeLocale(locale) {
  if (typeof locale !== 'string') return null;
  const language = locale.trim().toLowerCase().split(/[-_]/, 1)[0];
  return supportedLocales.includes(language) ? language : null;
}

function lookup(catalog, key) {
  return key.split('.').reduce((value, part) => (
    value && typeof value === 'object' ? value[part] : undefined
  ), catalog);
}

function interpolate(value, params) {
  return value.replace(/\{([^{}]+)\}/g, (placeholder, name) => (
    params && Object.prototype.hasOwnProperty.call(params, name)
      ? String(params[name] ?? '')
      : placeholder
  ));
}

function readStoredLocale() {
  try {
    return normalizeLocale(globalThis.localStorage?.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function readBrowserLocale() {
  const languages = globalThis.navigator?.languages;
  const candidates = Array.isArray(languages) && languages.length
    ? languages
    : [globalThis.navigator?.language];
  return candidates.map(normalizeLocale).find(Boolean) || 'en';
}

function persistLocale(locale) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, locale);
  } catch {
    // Language changes still apply for this session when storage is unavailable.
  }
}

export function t(key, params) {
  if (typeof key !== 'string' || !key) return '⟦invalid-translation-key⟧';
  const translated = lookup(catalogs[currentLocale], key);
  const fallback = translated ?? lookup(catalogs.en, key);
  if (typeof fallback !== 'string') return `⟦${key}⟧`;
  return interpolate(fallback, params);
}

export function tp(key, count, params = {}) {
  const category = pluralCategory(count);
  const countParams = { ...params, count: formatNumber(count) };
  const keys = [`${key}.${category}`, `${key}.other`];
  for (const candidate of keys) {
    const translated = lookup(catalogs[currentLocale], candidate);
    const fallback = translated ?? lookup(catalogs.en, candidate);
    if (typeof fallback === 'string') return interpolate(fallback, countParams);
  }
  return `⟦${key}⟧`;
}

export function translateLabel(key, fallback) {
  const translated = lookup(catalogs[currentLocale], key);
  const english = lookup(catalogs.en, key);
  return typeof translated === 'string'
    ? translated
    : typeof english === 'string' ? english : fallback;
}

export function setLocale(locale, { persist = true, dispatch = true } = {}) {
  const normalized = normalizeLocale(locale) || 'en';
  const changed = normalized !== currentLocale;
  currentLocale = normalized;
  if (persist) persistLocale(normalized);
  if (changed && dispatch && typeof globalThis.dispatchEvent === 'function') {
    globalThis.dispatchEvent(new CustomEvent('locale-change', { detail: { locale: normalized } }));
  }
  return currentLocale;
}

export function getLocale() {
  return currentLocale;
}

export function getSupportedLocales() {
  return [...supportedLocales];
}

export function initializeLocale() {
  const locale = readStoredLocale() || readBrowserLocale();
  return setLocale(locale, { persist: false, dispatch: false });
}

export function formatNumber(value, options) {
  return new Intl.NumberFormat(currentLocale, options).format(value);
}

export function formatCurrency(value, options = {}) {
  return new Intl.NumberFormat(currentLocale, {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

export function formatDate(value, options) {
  return new Intl.DateTimeFormat(currentLocale, options).format(value);
}

export function formatRelativeTime(value, unit, options) {
  return new Intl.RelativeTimeFormat(currentLocale, options).format(value, unit);
}

export function pluralCategory(value, options) {
  return new Intl.PluralRules(currentLocale, options).select(value);
}

export function getTranslationCatalog(locale = currentLocale) {
  const normalized = normalizeLocale(locale);
  return normalized ? catalogs[normalized] : null;
}

export function getTranslationKeys(catalog = catalogs.en, prefix = '') {
  return Object.entries(catalog).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object'
      ? getTranslationKeys(value, fullKey)
      : [fullKey];
  });
}
