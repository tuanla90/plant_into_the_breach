import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useI18n } from '../i18n';

/**
 * A SINGLE-PANEL CUTSCENE: one painting, a line or two over it, and the thing it just paid out.
 *
 * The comic pages (IntroComic, OutroComic) are the campaign's bookends and can afford to be
 * pages. This is the beat that happens thirteen times a playthrough — after a boss, at the end
 * of a chapter — and it sits between a victory report and an upgrade choice. So it is one image
 * and one click, in the comics' own caption chrome so the three still read as one book.
 *
 * SELF-GATING, and this is the whole reason the callers stay simple: none of the paintings
 * exist yet (art-src/ART-PROMPTS-CUTSCENES.md is the commission). Rather than make every call
 * site ask "has this art landed", the scene probes its own image and calls `onDone` the moment
 * it fails — so a missing file is not a broken frame, not an empty black screen, but a beat
 * that simply did not happen. Drop the jpg into public/img/comic/ and the same scene switches
 * itself on with no code change.
 *
 * This replaces the older pattern next door in App (`outroReady`), where the gate lived at the
 * decision point. That worked for one screen. It does not scale to thirteen, and thirteen
 * booleans in App is how a gate turns into a bug.
 */

export interface CutsceneReward {
    /** What KIND of thing was won — "New hero", "New element". Translated by the caller's key. */
    label: string;
    /** Its name. Already an i18n source string. */
    name: string;
    /** Optional portrait, for a hero. */
    img?: string;
    accent?: string;
}

interface CutsceneProps {
    art: string;
    kicker?: string;
    /** Beats over the same image, one click each. */
    captions: string[];
    reward?: CutsceneReward;
    onDone: () => void;
}

export const Cutscene: React.FC<CutsceneProps> = ({ art, kicker, captions, reward, onDone }) => {
    const { t } = useI18n();
    const [index, setIndex] = useState(0);
    /**
     * 'probing' renders a plain black hold rather than nothing: this mounts over a victory
     * screen, and returning null would flash the screen underneath for as long as the image
     * takes to decode, which reads as the button having failed.
     */
    const [art_, setArtState] = useState<'probing' | 'ready' | 'missing'>('probing');

    useEffect(() => {
        let alive = true;
        const probe = new Image();
        probe.onload = () => { if (alive) setArtState('ready'); };
        // The scene is skipped, not shown broken — see the gate note above.
        probe.onerror = () => { if (alive) { setArtState('missing'); onDone(); } };
        probe.src = art;
        return () => { alive = false; };
    }, [art]);

    if (art_ === 'missing') return null;

    const last = index >= captions.length - 1;
    const advance = () => { if (last) onDone(); else setIndex(index + 1); };

    // Above ActIntro (z-75) because a boss scene hands over to the next act's curtain, and
    // below the comic pages (z-80) which are the campaign's own bookends.
    if (art_ === 'probing') return <div className="fixed inset-0 z-[78] bg-black" />;

    const accent = reward?.accent ?? '#facc15';

    return (
        <div
            className="fixed inset-0 z-[78] bg-black font-pixel select-none cursor-pointer animate-in fade-in duration-500"
            onClick={advance}
        >
            {/* The painting. object-cover, because these are 4:3 and the viewport is not —
                letterboxing a story panel on a phone leaves more bar than picture. */}
            <img src={art} alt="" className="absolute inset-0 w-full h-full object-cover" />
            {/* Vignette: the caption box is cream on a painting that may be bright anywhere,
                and without this the top kicker had nothing to sit against. */}
            <div className="absolute inset-0 pointer-events-none"
                 style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.85) 100%)' }} />

            <div className="relative z-10 h-full flex flex-col justify-between px-4 py-5 sm:px-8 sm:py-7">
                {kicker && (
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.4em] text-center" style={{ color: accent }}>
                        {t(kicker)}
                    </span>
                )}

                <div className="w-full max-w-3xl mx-auto flex flex-col items-stretch gap-3">
                    {/* The reward rides in with the LAST beat, not the first: the scene is
                        about the moment, and the loot is its closing line — landing it early
                        turns a story panel into a receipt with a picture on it. */}
                    {reward && last && (
                        <div className="self-center flex items-center gap-3 px-4 py-2 rounded-lg border-2 bg-black/70 animate-in fade-in slide-in-from-bottom-2 duration-500"
                             style={{ borderColor: accent }}>
                            {reward.img && (
                                <img src={reward.img} alt="" className="h-12 w-auto object-contain"
                                     style={{ filter: `drop-shadow(0 0 10px ${accent}66)` }} />
                            )}
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase tracking-[0.3em] text-gray-400">{t(reward.label)}</span>
                                <span className="text-[15px] font-black uppercase tracking-widest" style={{ color: accent }}>
                                    {t(reward.name)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Caption box: the comics' chrome exactly (IntroComic's Panel), because
                        these three screens have to read as pages of one book. */}
                    <div className="bg-[#f6e7c5] border-[3px] border-black rounded-sm shadow-[4px_4px_0_rgba(0,0,0,0.55)] px-4 py-3">
                        <p className="text-[#1b1408] text-[13px] sm:text-[15px] leading-snug font-bold">
                            {t(captions[index])}
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 text-[10px] uppercase tracking-[0.25em] text-gray-400">
                        {/* Progress, so a two-beat scene does not look like a stuck one-beat
                            scene. Hidden when there is only one beat — nothing to count. */}
                        {captions.length > 1 && <span>{index + 1}/{captions.length}</span>}
                        <span>{last ? t('Continue') : t('Next')}</span>
                        <ChevronRight size={13} className="animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
};
