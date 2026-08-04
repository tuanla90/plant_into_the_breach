import React from 'react';
import { Leaf, X } from 'lucide-react';
import { useI18n } from '../i18n';

interface CoachMarkProps {
    /** The one-line lesson. Twelve words max — assertTutorial enforces it at build time. */
    note: string;
    /** Which board of the chain, for the "2/7" counter. */
    index: number;
    total: number;
    onSkip: () => void;
}

/**
 * The tutorial's entire voice.
 *
 * Plants vs Zombies never stopped the game to explain itself — a note from the neighbour
 * turned up on the lawn, one sentence long, and you got on with it. This is that note: it
 * sits under the board, never covers it, has no OK button to click through, and is replaced
 * as soon as the next turn starts.
 *
 * The only control is Skip, and it is always present. A returning player must be able to
 * leave in one click; a new one must not lose the tutorial by mis-clicking, which is why
 * Skip is small and off to the side rather than the obvious thing to press.
 */
export const CoachMark: React.FC<CoachMarkProps> = ({ note, index, total, onSkip }) => {
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

                <button
                    onClick={onSkip}
                    title={t('Skip the tutorial')}
                    className="pointer-events-auto shrink-0 ml-1 p-1 text-emerald-700 hover:text-emerald-200 hover:bg-emerald-900/60 rounded transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};
