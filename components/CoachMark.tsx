import React from 'react';
import { Leaf } from 'lucide-react';
import { useI18n } from '../i18n';

interface CoachMarkProps {
    /** The one-line lesson. Twelve words max — assertTutorial enforces it at build time. */
    note: string;
    /** Which board of the chain, for the "2/7" counter. */
    index: number;
    total: number;
    /** In combat the right rail belongs to the ActionPanel — recentre over the board
        instead of the viewport so the note never sits on top of End Turn. */
    avoidPanel?: boolean;
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
export const CoachMark: React.FC<CoachMarkProps> = ({ note, index, total, avoidPanel = false }) => {
    const { t } = useI18n();

    // bottom-14, not bottom-6: the run-wide TutorialSkipButton owns the bottom-left corner
    // (~46px tall) and on narrow screens a viewport-centred note reached into it.
    // The calc() variants mirror the ActionPanel width ladder (w-64/w-80/w-96).
    const centering = avoidPanel
        ? 'left-[calc((100vw-16rem)/2)] md:left-[calc((100vw-20rem)/2)] lg:left-[calc((100vw-24rem)/2)]'
        : 'left-1/2';

    return (
        <div className={`fixed bottom-14 ${centering} -translate-x-1/2 z-50 pointer-events-none font-pixel max-w-[calc(100vw-1rem)]`}>
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
