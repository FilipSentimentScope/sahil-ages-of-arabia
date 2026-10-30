/** Text lookup with English and Arabic. Switching to Arabic flips the whole layout to right-to-left. */
import en from '../../content/en/strings.json';
import ar from '../../content/ar/strings.json';

export type Lang = 'en' | 'ar';
const tables: Record<Lang, Record<string, string>> = { en, ar };

let current: Lang = 'en';

export function setLang(lang: Lang): void {
  current = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

export function lang(): Lang {
  return current;
}

/** Look up a key. A missing key shows as [key] so gaps are visible in testing, never silent. */
export function t(key: string): string {
  return tables[current][key] ?? tables.en[key] ?? `[${key}]`;
}

export function fmt(n: number): string {
  return Math.floor(n).toLocaleString(current === 'ar' ? 'ar-AE' : 'en-GB');
}
