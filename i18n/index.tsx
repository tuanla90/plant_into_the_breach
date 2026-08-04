import React, { createContext, useContext, useState, useCallback } from 'react';
import { VI } from './vi';

export type Lang = 'vi' | 'en';

const STORAGE_KEY = 'pitb-lang';

interface I18nContextValue {
    lang: Lang;
    setLang: (lang: Lang) => void;
    t: (text: string, vars?: Record<string, string | number>) => string;
}

export function translate(lang: Lang, text: string, vars?: Record<string, string | number>): string {
    let out = lang === 'vi' ? (VI[text] ?? text) : text;
    if (vars) {
        Object.entries(vars).forEach(([key, value]) => {
            out = out.split(`{${key}}`).join(String(value));
        });
    }
    return out;
}

const I18nContext = createContext<I18nContextValue>({
    lang: 'vi',
    setLang: () => {},
    // Was `(text) => text`, which silently dropped the interpolation vars: any component
    // rendered outside a provider printed the raw key with `{n}` still in it. Falling back
    // to the real translate keeps that failure mode readable instead of visibly broken.
    t: (text, vars) => translate('vi', text, vars),
});

function loadLang(): Lang {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'en' || saved === 'vi') return saved;
    } catch {}
    return 'vi';
}


export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lang, setLangState] = useState<Lang>(loadLang);

    const setLang = useCallback((next: Lang) => {
        setLangState(next);
        try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    }, []);

    const t = useCallback(
        (text: string, vars?: Record<string, string | number>) => translate(lang, text, vars),
        [lang]
    );

    return (
        <I18nContext.Provider value={{ lang, setLang, t }}>
            {children}
        </I18nContext.Provider>
    );
};

export function useI18n(): I18nContextValue {
    return useContext(I18nContext);
}

/** Small EN/VI switch, styled to fit the game's dark tactical theme. */
export const LanguageToggle: React.FC<{ className?: string }> = ({ className }) => {
    const { lang, setLang } = useI18n();
    const base = 'px-2.5 py-1 text-xs font-bold uppercase tracking-wider transition-colors rounded-sm';
    return (
        <div className={`inline-flex items-center gap-1 bg-black/40 border border-gray-700 rounded-md p-1 ${className || ''}`}>
            <button
                onClick={() => setLang('vi')}
                className={`${base} ${lang === 'vi' ? 'bg-green-600 text-black' : 'text-gray-400 hover:text-white'}`}
            >
                VI
            </button>
            <button
                onClick={() => setLang('en')}
                className={`${base} ${lang === 'en' ? 'bg-green-600 text-black' : 'text-gray-400 hover:text-white'}`}
            >
                EN
            </button>
        </div>
    );
};
