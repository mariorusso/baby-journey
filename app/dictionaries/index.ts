import type enDict from "./en.json";

export type Dictionary = typeof enDict;

const dictionaries: Record<string, () => Promise<Dictionary>> = {
  en: () => import("./en.json").then((m) => m.default),
  es: () => import("./es.json").then((m) => m.default),
  fr: () => import("./fr.json").then((m) => m.default),
  "pt-br": () => import("./pt-br.json").then((m) => m.default),
};

export type Locale = keyof typeof dictionaries;
export const locales = Object.keys(dictionaries);
export const defaultLocale = "en";

export async function getDictionary(lang: string): Promise<Dictionary> {
  const loader = dictionaries[lang] ?? dictionaries[defaultLocale];
  return loader();
}
