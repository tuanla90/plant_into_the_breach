import React from 'react';
import { GraduationCap, Swords } from 'lucide-react';
import { useI18n } from '../i18n';

interface TutorialPromptProps {
    /** Take the scripted seven-node chain. */
    onPlay: () => void;
    /** Skip it for good and go pick a squad. */
    onSkip: () => void;
}

/**
 * Asked once, on a player's very first Start Mission — the tutorial used to be compulsory,
 * which meant a returning player on a cleared save had no way past it and a curious one had
 * no way in without it. Both answers are final: the flag is written by the caller before
 * either branch runs, so this never appears again on this machine. The menu keeps a replay
 * entry for anyone who changes their mind.
 */
export const TutorialPrompt: React.FC<TutorialPromptProps> = ({ onPlay, onSkip }) => {
    const { t } = useI18n();

    return (
        // Scroll container + min-h-full wrapper: at ~390px of height the card is taller
        // than the screen, and flex-centering on the fixed layer clipped its footer.
        <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-sm overflow-y-auto font-pixel">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="bg-[#1a1c21] border-2 border-green-500 p-5 sm:p-8 max-w-md w-full text-center shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                <GraduationCap size={48} className="mx-auto text-green-400 mb-4" />

                <h2 className="text-2xl text-white font-bold uppercase mb-3">
                    {t('Play the tutorial?')}
                </h2>
                <p className="text-gray-400 text-base leading-relaxed mb-7">
                    {t('A short scripted chapter that teaches movement, enemy threats, fusion and the campfire.')}
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onPlay}
                        className="group relative px-5 py-4 bg-green-950/85 border-2 border-green-500 hover:bg-green-500 text-green-400 hover:text-black transition-colors duration-200 uppercase font-bold tracking-[0.06em] flex items-center justify-center gap-3"
                    >
                        <GraduationCap size={20} />
                        {t('Play the tutorial')}
                    </button>
                    <button
                        onClick={onSkip}
                        className="px-5 py-4 bg-gray-900/80 border border-gray-600 hover:border-white text-gray-400 hover:text-white transition-colors duration-200 uppercase font-bold tracking-[0.06em] flex items-center justify-center gap-3"
                    >
                        <Swords size={20} />
                        {t('Straight into the game')}
                    </button>
                </div>

                <p className="text-gray-600 text-xs mt-5 leading-relaxed">
                    {t('Asked only once — the tutorial can be replayed from the main menu at any time.')}
                </p>
            </div>
          </div>
        </div>
    );
};
