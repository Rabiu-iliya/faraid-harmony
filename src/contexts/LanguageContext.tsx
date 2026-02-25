import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getTranslation, type TranslationKey } from "@/i18n";

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState("en");

  useEffect(() => {
    if (!user) return;
    supabase.from("user_preferences").select("language").eq("user_id", user.id).single()
      .then(({ data }) => { if (data?.language) setLanguageState(data.language); });
  }, [user]);

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback((key: TranslationKey) => getTranslation(language, key), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
