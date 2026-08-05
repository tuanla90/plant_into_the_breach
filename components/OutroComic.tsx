import React from 'react';
import { SkipForward, ArrowRight } from 'lucide-react';
import { useI18n } from '../i18n';

/**
 * ONE-PAGE OUTRO COMIC — the bookend to IntroComic, shown once, after the Blightlord falls.
 *
 * The campaign used to end on the ordinary victory screen: coins, a level bar, back to the
 * map — the same beat as any Tuesday fight. An eight-panel epilogue in the intro's own format
 * is the cheapest possible ending that still IS one, and the last caption is deliberately the
 * intro's first ("Neon Plaza. Just another quiet evening.") — the story closes on the exact
 * sentence it opened with, now true again.
 *
 * ART GATE: the artwork ships separately (art-src/ART-PROMPTS.md § outro). App checks that
 * the first panel's file actually loads before routing here — until the images exist the
 * campaign win goes straight to the victory flow, and nothing half-built is ever shown.
 * Prompts and file names are in ART-PROMPTS.md; drop the files into public/img/comic/ and
 * this screen switches itself on.
 */
export const OUTRO_PANELS = [
    { art: '/img/comic/outro-01-fall.jpg', caption: 'The staff hit the ground before the body did.', cols: 'col-span-12 md:col-span-7', h: 'h-80', pos: '50% 35%' },
    { art: '/img/comic/outro-02-silence.jpg', caption: 'And for the first time since the drains, the city went quiet.', cols: 'col-span-12 md:col-span-5', h: 'h-80' },
    { art: '/img/comic/outro-03-recede.jpg', caption: 'Without orders, the horde was only weather. It blew away.', cols: 'col-span-12 md:col-span-4', h: 'h-72' },
    { art: '/img/comic/outro-04-banners.jpg', caption: 'They unstitched his coat, and hung every flag back where it was taken from.', cols: 'col-span-12 md:col-span-8', h: 'h-96', pos: '50% 40%' },
    { art: '/img/comic/outro-05-replant.jpg', caption: 'The plaza cracked open again. This time, from seeds.', cols: 'col-span-12 md:col-span-4', h: 'h-72' },
    { art: '/img/comic/outro-06-chrona.jpg', caption: 'Chrona kept one copy of the timeline. "Just in case," she said.', cols: 'col-span-12 md:col-span-4', h: 'h-72' },
    { art: '/img/comic/outro-07-masks.jpg', caption: 'The masks stayed on. Some habits are what kept a city alive.', cols: 'col-span-12 md:col-span-4', h: 'h-72' },
    { art: '/img/comic/outro-08-plaza.jpg', caption: 'Neon Plaza. Just another quiet evening.', cols: 'col-span-12', h: 'h-[480px]', captionBottom: true },
];

interface OutroComicProps {
    onDone: () => void;
}

/** Same panel chrome as IntroComic — the bookends must look like two pages of one book. */
const Panel: React.FC<{
    className?: string;
    caption?: string;
    captionBottom?: boolean;
    art: string;
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

export const OutroComic: React.FC<OutroComicProps> = ({ onDone }) => {
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
                                {t('How it ended')}
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
                        {OUTRO_PANELS.map(p => (
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
                            data-sfx="back"
                            className="group bg-green-600 hover:bg-green-500 text-white font-black py-3.5 px-12 uppercase tracking-[0.2em] shadow-lg border-b-4 border-green-800 active:border-0 active:translate-y-1 transition-all flex items-center gap-3 rounded-sm"
                        >
                            {t('Stand Down')}
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
