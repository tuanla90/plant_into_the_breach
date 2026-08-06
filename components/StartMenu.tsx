
import React, { useState, useEffect } from 'react';
import { Play, BookOpen, Shield, Skull, ScrollText, RotateCcw, GraduationCap, Download, Settings } from 'lucide-react';
import { useI18n } from '../i18n';

/**
 * Key art for the main menu, authored at 16:9 to match the screen.
 *
 * The title is painted INTO the artwork, so when it loads the text logo is hidden rather
 * than stacked on top of it. If the file is missing the menu falls back to that text logo,
 * so the game never boots to a blank screen.
 */
const COVER_ART = './img/cover.png';

interface StartMenuProps {
    onStart: () => void;
    /** Present only when a saved run exists — resumes it from its last safe point. */
    onContinue?: () => void;
    onTutorial: () => void;
    /** Open settings modal */
    onOpenSettings?: () => void;
    /** Start a fresh run on the scripted seven-node tutorial map. */
    onReplayTutorial?: () => void;
    /** Re-open the intro comic. It only shows itself once, so this is the way back to it. */
    onReplayIntro?: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ onStart, onContinue, onTutorial, onOpenSettings, onReplayTutorial, onReplayIntro }) => {
    const { t } = useI18n();
    const [hasCover, setHasCover] = useState(true);
    const [installPrompt, setInstallPrompt] = useState<any>(null);

    useEffect(() => {
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }, []);

    const handleInstallClick = () => {
        if (installPrompt) {
            installPrompt.prompt();
            installPrompt.userChoice.then(() => setInstallPrompt(null));
        } else {
            alert(t('Để cài đặt PWA Toàn Màn Hình: Bấm nút Chia sẻ (Share) -> Thêm vào Màn hình chính (Add to Home Screen) trên trình duyệt của bạn!'));
        }
    };

    return (
        <div className="w-full min-h-[100dvh] h-auto lg:h-[100dvh] bg-[#0d0e11] flex items-end md:items-center justify-center md:justify-end font-pixel text-white relative overflow-y-auto lg:overflow-hidden">

            {/* --- KEY ART --- */}
            {hasCover && (
                <>
                    {/* The key art is authored at 16:9 (1376x768), which is the screen's own
                        shape — so it fills edge to edge with effectively no crop, and none of
                        the letterbox/blurred-bar scaffolding the old 4:3 art needed.
                        `object-top` still guards the painted title on windows that are taller
                        or narrower than 16:9: every crop is taken off the bottom. */}
                    <img
                        src={COVER_ART}
                        alt=""
                        onError={() => setHasCover(false)}
                        className="fixed inset-0 w-full h-full object-cover max-md:object-[30%_top] md:object-top z-0"
                    />

                    {/* Darken the right side only, where the buttons live. The heroes are on
                        the left and the composition's bright centre is the wet street, so a
                        uniform tint would dim exactly the parts worth showing. */}
                    <div className="fixed inset-0 z-[1] hidden md:block bg-gradient-to-l from-[#0b0d12] via-[#0b0d12]/50 to-transparent"></div>
                </>
            )}

            {/* --- FALLBACK BACKGROUND (only when the key art is missing) --- */}
            {!hasCover && (
                <>
                    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black z-0"></div>
                    <div className="fixed inset-0 bg-[linear-gradient(rgba(34,197,94,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.05)_1px,transparent_1px)] bg-[length:40px_40px] opacity-30 z-0"></div>
                    <div className="absolute top-1/4 left-1/4 animate-bounce duration-[3000ms] opacity-20">
                        <Shield size={64} className="text-green-800" />
                    </div>
                    <div className="absolute bottom-1/4 right-1/4 animate-pulse duration-[4000ms] opacity-20">
                        <Skull size={64} className="text-red-900" />
                    </div>
                </>
            )}

            {/* Mobile only: there is no right-hand column to put the buttons in, so they sit
            directly over the art's focal point. A black gradient coming up from the bottom
            preserves the title while making the buttons readable. */}
            <div className="fixed inset-0 top-1/2 z-[1] md:hidden bg-gradient-to-t from-[#0b0d12] via-[#0b0d12]/90 to-transparent"></div>

            {/* Scanlines Overlay */}
            <div className="scanlines"></div>

            {/* --- MAIN CONTENT CONTAINER --- */}
            {/* Sized to the darkened band on the right so the stack sits centred in it. */}
            <div className={`relative z-20 flex flex-col items-center gap-6 w-full max-w-sm px-6 ${hasCover ? 'md:w-[30%] md:max-w-none md:px-7 pb-10 md:pb-0' : 'max-w-2xl gap-12'}`}>

                {/* GAME TITLE — text logo only when the key art (which carries its own
                    painted title) is unavailable. */}
                {!hasCover && (
                    <div className="text-center space-y-2">
                        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-green-400 to-green-700 drop-shadow-[0_5px_0_rgba(0,0,0,1)] tracking-wider">
                            {t('PLANT HEROES')}
                        </h1>
                        <div className="flex items-center justify-center gap-4 text-gray-500 uppercase tracking-widest text-sm md:text-base">
                            <span className="w-12 h-[1px] bg-gray-600"></span>
                            {t('Blightfall')}
                            <span className="w-12 h-[1px] bg-gray-600"></span>
                        </div>
                    </div>
                )}

                {/* MENU BUTTONS */}
                <div className="flex flex-col w-full max-w-sm gap-3">

                    {/* CONTINUE */}
                    {onContinue && (
                        <button
                            onClick={onContinue}
                            className="group relative px-3 lg:px-5 py-4 bg-amber-950/85 backdrop-blur-sm border-2 border-amber-500 hover:bg-amber-500 text-amber-400 hover:text-black transition-all duration-200 uppercase font-bold tracking-[0.04em] lg:tracking-[0.08em] text-sm lg:text-base flex items-center justify-center gap-3 overflow-hidden rounded-md shadow-lg"
                        >
                            <div className="absolute inset-0 bg-amber-400 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200 z-0"></div>
                            <span className="relative z-10 flex items-center gap-2.5">
                                <RotateCcw size={22} className="shrink-0" />
                                {t('Continue Campaign')}
                            </span>
                        </button>
                    )}

                    {/* START BUTTON */}
                    <button
                        onClick={onStart}
                        className="group relative px-3 lg:px-5 py-4 bg-green-950/85 backdrop-blur-sm border-2 border-green-500 hover:bg-green-600 text-green-400 hover:text-black transition-all duration-200 uppercase font-bold tracking-[0.04em] lg:tracking-[0.08em] text-sm lg:text-base flex items-center justify-center gap-3 overflow-hidden rounded-md shadow-lg"
                    >
                        <div className="absolute inset-0 bg-green-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200 z-0"></div>
                        <span className="relative z-10 flex items-center gap-2.5">
                            <Play size={22} fill="currentColor" className="shrink-0" />
                            {t('Start Mission')}
                        </span>
                    </button>

                    {/* SECONDARY ACTIONS GRID FOR SPACE SAVING */}
                    <div className="grid grid-cols-2 gap-2 mt-1">
                        {/* TUTORIAL BUTTON */}
                        <button
                            onClick={onTutorial}
                            className="group relative px-2 py-3 bg-gray-950/85 backdrop-blur-sm border border-gray-500 hover:border-white text-gray-300 hover:text-white transition-all duration-200 uppercase font-bold tracking-[0.05em] text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1.5 rounded-md"
                        >
                            <BookOpen size={16} />
                            {t('Tactical Archive')}
                        </button>

                        {/* SETTINGS BUTTON */}
                        {onOpenSettings && (
                            <button
                                onClick={onOpenSettings}
                                className="group relative px-2 py-3 bg-slate-900/85 backdrop-blur-sm border border-slate-600 hover:border-sky-400 text-slate-200 hover:text-sky-300 transition-all duration-200 uppercase font-bold tracking-[0.05em] text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1.5 rounded-md"
                            >
                                <Settings size={16} className="text-sky-400" />
                                {t('Settings')}
                            </button>
                        )}

                        {/* REPLAY TUTORIAL BUTTON */}
                        {onReplayTutorial && (
                            <button
                                onClick={onReplayTutorial}
                                className="group relative px-2 py-3 bg-slate-900/80 backdrop-blur-sm border border-slate-700 hover:border-slate-400 text-slate-300 hover:text-white transition-all duration-200 uppercase font-bold tracking-[0.05em] text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1.5 rounded-md"
                            >
                                <GraduationCap size={16} />
                                {t('Tutorial')}
                            </button>
                        )}
                    </div>

                    {/* READ INTRO COMIC BUTTON */}
                    {onReplayIntro && (
                        <button
                            onClick={onReplayIntro}
                            className="mt-2 text-slate-500 hover:text-slate-300 transition-colors text-[10px] sm:text-xs uppercase tracking-widest font-bold underline underline-offset-4 decoration-slate-700 mx-auto"
                        >
                            {t('Read the intro comic')}
                        </button>
                    )}

                </div>

            </div>

            {/* FOOTER — pinned to the page, not to the button column, so the key-art layout
                cannot push it off screen. */}
            <div className="absolute bottom-3 left-4 z-20 text-xs text-gray-500 uppercase tracking-widest opacity-70">
                {t('System Ready // V1.0.4')}
            </div>

            {/* DOWNLOAD / INSTALL PWA BUTTON - Pinned to bottom right corner */}
            <button
                onClick={handleInstallClick}
                className="absolute bottom-3 right-4 z-20 group relative px-3 py-2 bg-sky-950/60 backdrop-blur-sm border border-sky-500/50 hover:bg-sky-500 hover:text-black text-sky-300 transition-all duration-200 uppercase font-bold tracking-widest text-[10px] flex items-center gap-2 rounded-md"
            >
                <Download size={14} />
                <span className="hidden sm:inline">{t('Install App')}</span>
                <span className="sm:hidden">{t('App')}</span>
            </button>
        </div>
    );
};
