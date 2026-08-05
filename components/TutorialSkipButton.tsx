import React, { useEffect, useRef, useState } from 'react';
import { SkipForward } from 'lucide-react';
import { useI18n } from '../i18n';

interface TutorialSkipButtonProps {
    /** Abandons the whole tutorial run. */
    onSkip: () => void;
}

/**
 * THE one way out of the tutorial, pinned to the top-right corner for the entire run.
 *
 * It used to travel with the content instead: a "skip the tutorial" button under every
 * Spotlight note, an X on every CoachMark, a "Skip" in the corner of every dialogue
 * scene. Three surfaces, three positions — and each read as "dismiss THIS text", so
 * players tapped one to close a chat line and lost the whole tutorial. One fixed button
 * in one fixed place says what it actually is: an exit door, not a dismiss control.
 *
 * Because it is now always present (and the only copy), a single misclick must not end
 * the run: the first press arms it, the second within a short window confirms. The arm
 * state announces itself by changing text and colour, then disarms on its own.
 */
export const TutorialSkipButton: React.FC<TutorialSkipButtonProps> = ({ onSkip }) => {
    const { t } = useI18n();
    const [armed, setArmed] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

    const click = () => {
        if (armed) { onSkip(); return; }
        setArmed(true);
        timer.current = setTimeout(() => setArmed(false), 3000);
    };

    return (
        <button
            onClick={click}
            // BOTTOM-LEFT, because it is the only corner nothing important lives in:
            // top-right belongs to the map controls and the pinned legend (the first
            // position put this button squarely over the legend while the intro dialogue
            // was pointing at it), the combat sidebars and End Turn own the right edge,
            // and the top-left carries the zone header. z-[120] keeps it above every
            // tutorial layer — Spotlight walls (90–95), the pinned legend (80), dialogue
            // scenes (70) — and the solid fill is what reads "on top of the shade";
            // a translucent button over black looked like part of the shade itself.
            className={`fixed bottom-3 left-3 z-[120] flex items-center gap-2 px-3 py-2 font-pixel text-[10px] uppercase tracking-widest rounded-md border-2 transition-colors shadow-lg
                ${armed
                    ? 'bg-red-950 border-red-500 text-red-200 hover:bg-red-900 shadow-red-900/50'
                    : 'bg-[#14161b] border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 shadow-black/60'}`}
        >
            <SkipForward size={13} />
            {armed ? t('Click again to skip it all') : t('Skip the tutorial')}
        </button>
    );
};
