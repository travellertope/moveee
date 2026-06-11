"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "EN" | "FR";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("EN");

  // Load preferred language from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("preferred_language") as Language;
    if (savedLang && (savedLang === "EN" || savedLang === "FR")) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("preferred_language", lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === "EN" ? "FR" : "EN";
    handleSetLanguage(nextLang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
