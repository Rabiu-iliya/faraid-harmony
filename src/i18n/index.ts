import en from "./en";
import ha from "./ha";

export type TranslationKey = keyof typeof en;

const translations: Record<string, Record<string, string>> = { en, ha };

export function getTranslation(lang: string, key: TranslationKey): string {
  return translations[lang]?.[key] || translations.en[key] || key;
}

export function getRelationshipKey(relationship: string): TranslationKey {
  return `rel_${relationship}` as TranslationKey;
}

export function getCategoryKey(category: string): TranslationKey {
  return `assets_cat_${category}` as TranslationKey;
}
