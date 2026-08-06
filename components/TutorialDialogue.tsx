import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { DialogueLine } from '../data/tutorialDialogues';
import { useI18n } from '../i18n';

interface TutorialDialogueProps {
    lines: DialogueLine[];
    /** Called when the last line is advanced past, or on Skip. */
    onDone: () => void;
    /** Fired with the line now on screen, so callers can react to what is being said. */
    onLineChange?: (line: DialogueLine | null, index: number) => void;
}

/**
 * Visual-novel style scene played before a tutorial node: one line at a time, the
 * speaker's portrait on their side, click anywhere to advance. Lightweight on purpose —
 * it must never feel more expensive than the three-second read it is.
 */
export const TutorialDialogue: React.FC<TutorialDialogueProps> = ({ lines, onDone, onLineChange }) => {
    const { t } = useI18n();
    const [index, setIndex] = useState(0);
    const line = lines[index];

    // Reported from an effect rather than from `advance`, so the FIRST line counts too —
    // advance only ever fires from the second onwards.
    React.useEffect(() => { if (line) onLineChange?.(line, index); }, [index, line]);
    // Cleared only on unmount, not on every line change: clearing between lines would blink
    // the highlight off and on again as the player reads.
    React.useEffect(() => () => onLineChange?.(null, -1), []);

    /**
     * The backdrop in force right now: the most recent line at or before this one that named
     * a scene. Scanning backwards rather than storing it means jumping to any line lands on
     * the right picture, and a scene that never names one simply has none.
     */
    const scene = React.useMemo(() => {
        for (let i = Math.min(index, lines.length - 1); i >= 0; i--) {
            if (lines[i]?.scene) return lines[i].scene;
        }
        return undefined;
    }, [lines, index]);

    /**
     * Paintings ship separately from code (art-src/ART-PROMPTS-CUTSCENES.md), so a missing
     * file drops the backdrop instead of showing a broken frame — the scene then looks exactly
     * as it did before any of this existed. Tracked per src, because one absent painting must
     * not blank the scenes that DO have art.
     */
    const [failed, setFailed] = useState<Record<string, true>>({});

    if (!line) return null;

    const advance = () => {
        if (index + 1 >= lines.length) onDone();
        else setIndex(index + 1);
    };

    const accent = line.color ?? '#facc15';
    const sceneSrc = scene && !failed[scene] ? scene : undefined;

    return (
        <div
            // The black/75 that used to live here is now its own layer below, so it can sit
            // BETWEEN the painting and the dialogue: as the parent's background it would have
            // been painted first and the image would have covered it.
            className="fixed inset-0 z-[70] flex flex-col justify-end font-pixel select-none cursor-pointer"
            onClick={advance}
        >
            {sceneSrc && (
                <img
                    src={sceneSrc}
                    alt=""
                    onError={() => setFailed(prev => ({ ...prev, [sceneSrc]: true }))}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}
            {/* The dimmer. Over a painting it is what keeps the dialogue box the thing being
                read; with no painting it is the same wash of black this screen always had. */}
            <div className="absolute inset-0 bg-black/75 pointer-events-none" />
            {/* No skip button of its own: it sat exactly where the run-wide skip now
                lives and read as "skip this scene" — TutorialSkipButton (App, top-right)
                is the single exit. A scene is short enough to click through. */}

            {/* pb-16, not pb-6: the run-wide skip button lives in the bottom-left corner
                (~46px tall with its margin), and on narrow viewports the near-full-width
                box used to slide under it. The extra padding keeps the two apart at
                every width instead of relying on the box being narrower than the screen. */}
            <div className="w-full max-w-4xl mx-auto px-4 pb-16 relative">
                {/* Portrait, standing on the dialogue box */}
                {/* max-h in dvh: at 320–400px of viewport height a fixed 160px portrait
                    ran off the top of the screen and clipped at the character's head. */}
                <img
                    src={line.img}
                    alt={line.name}
                    className={`absolute bottom-full h-40 md:h-52 max-h-[38dvh] object-contain pointer-events-none -mb-2 ${line.side === 'left' ? 'left-6' : 'right-6'}`}
                    style={{ filter: `drop-shadow(0 8px 10px rgba(0,0,0,0.8)) drop-shadow(0 0 14px ${accent}33)` }}
                />

                {/* Dialogue box */}
                <div className="relative bg-[#101018]/95 border-2 rounded-lg p-4 pt-5 shadow-2xl" style={{ borderColor: accent }}>
                    <div
                        className={`absolute -top-3.5 px-3 py-1 rounded text-[12px] font-black uppercase tracking-widest text-black ${line.side === 'left' ? 'left-4' : 'right-4'}`}
                        style={{ backgroundColor: accent, boxShadow: `0 0 10px ${accent}66` }}
                    >
                        {line.name}
                    </div>
                    <p className="text-gray-100 text-sm md:text-base leading-relaxed min-h-[3rem]">
                        {t(line.text)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-gray-600 uppercase tracking-widest">{index + 1}/{lines.length}</span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-500 uppercase tracking-widest animate-pulse">
                            {t('Click to continue')} <ChevronRight size={12} />
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
