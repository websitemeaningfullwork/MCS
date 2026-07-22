"use client";

import { useLanguage } from "@/components/shared/language-provider";

/**
 * Bilingual text leaf. Server Components stay statically rendered and simply
 * write `<T en="Hello" bn="হ্যালো" />` wherever copy appears; this tiny client
 * island picks the active language from the LanguageProvider context, so the
 * EN/বাংলা toggle switches every wrapped string instantly — no dynamic
 * rendering, no page reload.
 *
 * For attribute strings (aria-label, placeholder, title) inside client
 * components, use `localize(lang, bi)` from `lib/i18n` instead.
 */
export function T({ en, bn }: { en: string; bn: string }) {
  const { lang } = useLanguage();
  return <>{lang === "bn" ? bn : en}</>;
}
