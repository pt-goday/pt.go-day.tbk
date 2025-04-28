import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import idTranslations from "../locales/id.json";
import enTranslations from "../locales/en.json";
import zhTranslations from "../locales/zh.json";

// Tipe bahasa yang didukung
export type Language = "id" | "en" | "zh";

// Tipe objek terjemahan
type TranslationObject = {
  [key: string]: string | TranslationObject;
};

// Pemetaan bahasa ke file terjemahan
const translations: Record<Language, TranslationObject> = {
  id: idTranslations,
  en: enTranslations,
  zh: zhTranslations,
};

// Tipe untuk context bahasa
interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
  availableLanguages: { code: Language; name: string }[];
}

// Membuat context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Provider bahasa
interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export function LanguageProvider({
  children,
  defaultLanguage = "id",
}: LanguageProviderProps) {
  // Gunakan localStorage untuk menyimpan preferensi bahasa pengguna
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("language") as Language;
    return savedLanguage || defaultLanguage;
  });

  // Efek samping untuk menyimpan bahasa ke localStorage saat berubah
  useEffect(() => {
    localStorage.setItem("language", language);
    // Opsional: Perbarui atribut lang pada elemen HTML untuk SEO
    document.documentElement.lang = language;
  }, [language]);

  // Daftar bahasa yang tersedia untuk UI pemilih bahasa
  const availableLanguages = [
    { code: "id" as Language, name: "Bahasa Indonesia" },
    { code: "en" as Language, name: "English" },
    { code: "zh" as Language, name: "中文" },
  ];

  // Fungsi terjemahan - mendukung dot notation (e.g., "app.title")
  // dan parameter penggantian (e.g., "hello {{name}}")
  const t = (key: string, params?: Record<string, string>): string => {
    // Cari nilai berdasarkan kunci dengan dot notation
    const getNestedTranslation = (
      obj: TranslationObject,
      path: string
    ): string => {
      const keys = path.split(".");
      let current: any = obj;

      for (const k of keys) {
        if (current === undefined || current === null) return key;
        current = current[k];
      }

      if (typeof current !== "string") return key;
      return current;
    };

    // Dapatkan terjemahan
    const translatedText = getNestedTranslation(translations[language], key);

    // Jika kunci tidak ditemukan, kembalikan kunci
    if (translatedText === key) return key;

    // Ganti parameter jika ada
    if (params) {
      return Object.entries(params).reduce((text, [paramKey, paramValue]) => {
        return text.replace(new RegExp(`{{${paramKey}}}`, "g"), paramValue);
      }, translatedText);
    }

    return translatedText;
  };

  const value = {
    language,
    setLanguage,
    t,
    availableLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook untuk menggunakan konteks bahasa
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}