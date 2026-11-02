
Updated the localization guide at `docs/i18n.md`. It now documents the architecture, key conventions, static and dynamic UI translation, locale detection and persistence, fallback behavior, formatting helpers, completeness testing, and steps for adding another language. I also updated `tools/check-i18n.js` to check every locale registered in the i18n service, rather than only English and Spanish.

## Final deliverables

### 1. Implemented architecture

The game uses frozen JavaScript catalogs and an ES-module i18n service, with native `Intl` APIs for formatting and plural selection. Static markup is translated through data attributes; dynamic components call the service directly. Locale changes refresh the UI without reloading or resetting the game.

### 2. Localization-related repository structure

- `src/i18n/`: catalogs, locale service, and static DOM translation.
- `src/ui/language.js`: HUD language selector.
- `tools/check-i18n.js`: catalog and reference checker.
- `docs/i18n.md`: implementation and contributor guide.

### 3. Created and modified files

**Created**
- `docs/i18n.md`
- `src/i18n/dom.js`
- `src/i18n/en.js`
- `src/i18n/es.js`
- `src/i18n/index.js`
- `src/ui/language.js`
- `tools/check-i18n.js`

**Modified**
- `index.html`
- `src/ai-ceo.js`
- `src/build-mode.js`
- `src/config.js`
- `src/events.js`
- `src/main.js`
- `src/renderer/effects.js`
- `src/renderer/floor.js`
- `src/renderer/walls.js`
- `src/simulation.js`
- `src/ui/build-panel.js`
- `src/ui/cashflow-graph.js`
- `src/ui/equipment-panel.js`
- `src/ui/hud-popover.js`
- `src/ui/intro.js`
- `src/ui/loan.js`
- `src/ui/panels.js`
- `src/ui/strategy-panel.js`

### 4. Translated UI areas

Translations cover key static HUD and onboarding text, the language selector, company and office labels, selected build/hire and employee panels, loan and strategy UI, chart labels, tooltips, some canvas labels, tutorial hints, and simulation notifications. Event titles and buff summaries are localized as well.

### 5. Locale detection and persistence

Startup prefers a valid saved locale from `business_tycoon_locale_v1`, then the first supported language in browser preferences, then English. Regional codes such as `es-MX` normalize to `es`. Locale changes persist by default; blocked storage does not prevent in-session switching.

### 6. Tests and regression findings

- Catalog checker passed: **2 locales, 516 matching keys**, with literal references validated.
- JavaScript syntax checks passed for files under `src/` and `tools/`.
- Runtime checks passed for locale normalization, preference fallback, storage unavailability, formatting, plural selection, and catalog immutability.
- `git diff --check` passed.
- Browser visual and gameplay testing was not run; visual regressions have not been verified.

### 7. Known limitations

Some event descriptions and choice text, analytics insights, and configuration-backed descriptions may still appear in English. The static checker cannot discover all template-generated keys or assess translation quality and layout fit; the guide describes the required manual review.

### 8. Adding a third language

For a language such as French, create a matching catalog under `src/i18n/`, register it in `src/i18n/index.js`, add its display name in `src/ui/language.js`, then run the checker and manually test locale detection, persistence, formatting, plural cases, and UI flows. The full steps are in `docs/i18n.md`.