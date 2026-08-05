import React from 'react';
import { Leaf } from 'lucide-react';
import { useI18n } from '../i18n';

interface CoachMarkProps {
    /** The one-line lesson. Twelve words max — assertTutorial enforces it at build time. */
    note: string;
    /** Which board of the chain, for the "2/7" counter. */
    index: number;
    total: number;
}

/**
 * The tutorial's entire voice.
 *
 * Plants vs Zombies never stopped the game to explain itself — a note from the neighbour
 * turned up on the lawn, one sentence long, and you got on with it. This is that note: it
 * sits under the board, never covers it, has no OK button to click through, and is replaced
 * as soon as the next turn starts.
 *
 * It has no controls at all. The X it used to carry looked like "close this tip" but
 * actually ended the whole tutorial — leaving is TutorialSkipButton's job, pinned
 * top-right by App for the entire run.
 */
export const CoachMark: React.FC<CoachMarkProps> = ({ note, index, total }) => {
    const { t } = useI18n();

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none font-pixel">
            <div className="flex items-center gap-3 px-5 py-3 bg-[#101a12]/95 border-2 border-emerald-500 rounded-lg shadow-[0_0_28px_rgba(16,185,129,0.28)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Leaf size={20} className="text-emerald-400 shrink-0" />

                <span className="text-emerald-50 text-base leading-tight max-w-[46ch]">
                    {t(note)}
                </span>

                <span className="text-[10px] font-mono text-emerald-600/80 shrink-0 tabular-nums">
                    {index}/{total}
                </span>
            </div>
        </div>
    );
};
