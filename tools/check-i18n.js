import fs from 'node:fs';
import path from 'node:path';
import { getSupportedLocales, getTranslationCatalog, getTranslationKeys } from '../src/i18n/index.js';

function valueAt(catalog, key) {
  return key.split('.').reduce((value, part) => value?.[part], catalog);
}

function collectJavaScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectJavaScriptFiles(filePath);
    return filePath.endsWith('.js') ? [filePath] : [];
  });
}

function placeholders(value) {
  return typeof value === 'string'
    ? [...value.matchAll(/\{([^{}]+)\}/g)].map(match => match[1]).sort()
    : [];
}

const locales = getSupportedLocales();
const english = getTranslationCatalog('en');
const englishKeys = getTranslationKeys(english).sort();
const knownKeys = new Set(englishKeys);
const errors = [];

for (const locale of locales) {
  if (locale === 'en') continue;
  const catalog = getTranslationCatalog(locale);
  const localeKeys = getTranslationKeys(catalog).sort();
  const localeKeySet = new Set(localeKeys);

  for (const key of englishKeys) {
    if (!localeKeySet.has(key)) {
      errors.push(`${locale} is missing: ${key}`);
      continue;
    }
    const enPlaceholders = placeholders(valueAt(english, key));
    const localePlaceholders = placeholders(valueAt(catalog, key));
    if (JSON.stringify(enPlaceholders) !== JSON.stringify(localePlaceholders)) {
      errors.push(`${locale} placeholder mismatch: ${key}`);
    }
  }
  for (const key of localeKeys) {
    if (!knownKeys.has(key)) errors.push(`${locale} has an extra key: ${key}`);
  }
}

const html = fs.readFileSync('index.html', 'utf8');
for (const [, , key] of html.matchAll(/\bdata-i18n(?:-title|-html)?=(["'])([^"']+)\1/g)) {
  if (!knownKeys.has(key)) errors.push(`index.html: missing translation key ${key}`);
}

for (const filePath of collectJavaScriptFiles('src')) {
  const source = fs.readFileSync(filePath, 'utf8');
  for (const [, functionName, , key] of source.matchAll(/\b(t|tp)\(\s*(['"])([^'"]+)\2/g)) {
    if (functionName === 'tp') {
      if (!knownKeys.has(`${key}.one`) || !knownKeys.has(`${key}.other`)) {
        errors.push(`${filePath}: missing plural entries for ${key}`);
      }
    } else if (!knownKeys.has(key)) {
      errors.push(`${filePath}: missing translation key ${key}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`i18n check passed: ${locales.length} locales, ${englishKeys.length} matching keys, and literal references.`);
}
