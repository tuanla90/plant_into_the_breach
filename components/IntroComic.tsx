import React from 'react';
import { SkipForward, ArrowRight } from 'lucide-react';
import { useI18n } from '../i18n';

/**
 * ONE-PAGE INTRO COMIC (Kingdom Rush style): a single sheet of panels the player reads
 * once, on their first run, and never again unless they ask for it.
 *
 * Why a comic instead of story pages: this is a roguelike. Anything the player must click
 * through at the start of a run becomes friction by the third run, so the whole premise has
 * to land in one screenful and then get out of the way. A comic page does that — the reader
 * takes it in at a glance and leaves when they want.
 *
 * The eight panels are real artwork (art-src/comic, copied to public/img/comic): Neon Plaza
 * at peace → the alert → zombies rising from below → the gate falls → three civilians hide
 * → they find the gear → the mask goes on → three heroes on a rooftop. The art bakes in
 * comic SFX only (CRASH!, SCRAPE!) — every story line is rendered by the app so it stays
 * translatable (i18n).
 */
// Panel heights are generous on purpose: the art is ~4:3 and object-cover crops what the
// height cannot hold — too short and the characters lose their faces. The page scrolls.
const PANELS = [
    { art: './img/comic/comic-01-plaza.jpg', caption: 'Neon Plaza. Just another quiet evening.', cols: 'col-span-12 md:col-span-7', h: 'h-80', pos: '50% 65%' },
    { art: './img/comic/comic-02-alert.jpg', caption: 'Until every screen in the city screamed the same word.', cols: 'col-span-12 md:col-span-5', h: 'h-80' },
    { art: './img/comic/comic-03-drain.jpg', caption: 'They did not come from the horizon. They came from below.', cols: 'col-span-12 md:col-span-4', h: 'h-72' },
    { art: './img/comic/comic-04-gate.jpg', caption: 'The plaza gate held for exactly four seconds.', cols: 'col-span-12 md:col-span-8', h: 'h-96', pos: '50% 70%' },
    { art: './img/comic/comic-05-tunnel.jpg', caption: 'Three survived. None of them were soldiers.', cols: 'col-span-12 md:col-span-4', h: 'h-72' },
    { art: './img/comic/comic-06-gear.jpg', caption: 'But someone had left the gear behind — as if they knew this day would come.', cols: 'col-span-12 md:col-span-4', h: 'h-72' },
    { art: './img/comic/comic-07-mask.jpg', caption: 'Breathe in. Mask on. Shadeleaf walks out.', cols: 'col-span-12 md:col-span-4', h: 'h-72' },
    { art: './img/comic/comic-08-rooftop.jpg', caption: 'The city may be lost. The world is not.', cols: 'col-span-12', h: 'h-[480px]', captionBottom: true },
];

interface IntroComicProps {
    onDone: () => void;
}

/** One comic panel: thick ink border, artwork, and a caption box over the top or bottom. */
const Panel: React.FC<{
    className?: string;
    caption?: string;
    /** Caption sits at the bottom instead of the top. */
    captionBottom?: boolean;
    art: string;
    /** object-position for the crop — biases which part of the art survives object-cover. */
    pos?: string;
}> = ({ className = '', caption, captionBottom = false, art, pos }) => (
    <div className={`relative overflow-hidden border-[3px] border-black rounded-sm shadow-[4px_4px_0_rgba(0,0,0,0.55)] ${className}`}>
        <img src={art} alt="" className="absolute inset-0 w-full h-full object-cover" style={pos ? { objectPosition: pos } : undefined} />
        {caption && (
            <div
                className={`absolute left-0 right-0 ${captionBottom ? 'bottom-0' : 'top-0'} bg-[#f6e7c5] border-black ${captionBottom ? 'border-t-[3px]' : 'border-b-[3px]'} px-2.5 py-1.5`}
            >
                <p className="text-[#1b1408] text-[13px] leading-tight font-bold">{caption}</p>
            </div>
        )}
    </div>
);

export const IntroComic: React.FC<IntroComicProps> = ({ onDone }) => {
    const { t } = useI18n();

    return (
        <div className="fixed inset-0 z-[80] bg-[#0b0d12] overflow-y-auto">
            <div className="min-h-full flex flex-col items-center px-4 py-5">
                <div className="w-full max-w-6xl">

                    {/* Masthead */}
                    <div className="flex items-end justify-between mb-3 gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-emerald-400 leading-none">
                                {t('Plant Heroes: Blightfall')}
                            </h1>
                            <p className="text-gray-500 text-xs uppercase tracking-[0.25em] mt-1">
                                {t('How it started')}
                            </p>
                        </div>
                        <button
                            onClick={onDone}
                            className="shrink-0 flex items-center gap-2 px-3 py-2 text-xs uppercase font-bold tracking-widest text-gray-400 hover:text-white border border-gray-700 hover:border-gray-400 rounded-md transition-colors"
                        >
                            <SkipForward size={14} /> {t('Skip')}
                        </button>
                    </div>

                    {/* --- COMIC PAGE --- */}
                    <div className="grid grid-cols-12 gap-2.5">
                        {PANELS.map(p => (
                            <Panel
                                key={p.art}
                                className={`${p.cols} ${p.h}`}
                                caption={t(p.caption)}
                                captionBottom={p.captionBottom}
                                art={p.art}
                                pos={p.pos}
                            />
                        ))}
                    </div>

                    {/* Continue */}
                    <div className="flex justify-center mt-5 mb-2">
                        <button
                            onClick={onDone}
                            className="group bg-green-600 hover:bg-green-500 text-white font-black py-3.5 px-12 uppercase tracking-[0.2em] shadow-lg border-b-4 border-green-800 active:border-0 active:translate-y-1 transition-all flex items-center gap-3 rounded-sm"
                        >
                            {t('Hold the Line')}
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
