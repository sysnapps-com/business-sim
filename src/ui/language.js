import { getLocale, getSupportedLocales, setLocale, t } from '../i18n/index.js';

const languageNames = {
  en: 'English',
  es: 'Español',
};

let selector = null;

function updateSelector() {
  if (!selector) return;
  selector.value = getLocale();
  selector.setAttribute('aria-label', t('language.label'));
  selector.title = t('language.label');
}

export function initLanguageSelector() {
  selector = document.getElementById('language-selector');
  if (!selector) return;

  selector.replaceChildren(...getSupportedLocales().map(locale => {
    const option = document.createElement('option');
    option.value = locale;
    option.textContent = languageNames[locale] || locale;
    return option;
  }));
  selector.addEventListener('change', () => setLocale(selector.value));
  globalThis.addEventListener('locale-change', updateSelector);
  updateSelector();
}
