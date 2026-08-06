import React from 'react';
import { BossId } from '../types';
import { ArrowRight, Crown, Skull } from 'lucide-react';
import { bossById, STAGES } from '../data/unlocks';
import { BOSS_UNIT_CLASS } from '../data/bosses';
import { ZOMBIE_DEFINITIONS } from '../data/zombies';
import { ACT_INTRO_ART } from '../data/cutscenes';
import { useI18n } from '../i18n';

/**
 * THE CUT BETWEEN ACTS.
 *
 * An act is a whole map now, and clearing its boss lays the next one down underneath the
 * player. Without a beat between them the transition is invisible: the map screen simply
 * blinks and every node is locked again, which reads as a bug rather than as progress.
 *
 * So this is the curtain. It names the new place, its boss and what that boss is holding, and
 * it is the only screen in the run that exists purely to say "that was a chapter". Slay the
 * Spire spends a full screen on the same beat for the same reason.
 *
 * Deliberately NOT a decision — one button. The choices belong to the map behind it; a screen
 * that both announces and asks is a screen people click through without reading either half.
 */
export const ActIntro: React.FC<{ boss: BossId; onContinue: () => void }> = ({ boss, onContinue }) => {
    const { t } = useI18n();
    /**
     * The act's painting, behind everything else. Optional in the strongest sense: these are
     * commissioned separately (art-src/ART-PROMPTS-CUTSCENES.md), so the image removes itself
     * on error and the screen falls back to the flat gradient it has always had. Same contract
     * as Cutscene's probe, done inline because there is nothing here to skip — a curtain with
     * no picture is still a curtain.
     */
    const [sceneFailed, setSceneFailed] = React.useState(false);
    // Reset when the act changes, or one missing painting would blank every later act too.
    React.useEffect(() => setSceneFailed(false), [boss]);

    const act = bossById(boss);
    if (!act) return null;

    const stage = STAGES.find(st => st.id === act.stage);
    const cls = BOSS_UNIT_CLASS[boss];
    const art = cls ? (ZOMBIE_DEFINITIONS as any)[cls]?.imgUrl as string | undefined : undefined;
    const scene = ACT_INTRO_ART[boss];
    const accent = stage?.accent ?? '#facc15';

    return (
        // Scrollable, centred via min-h-full: on a 320px-tall landscape phone this screen
        // is taller than the viewport, and pure flex centering clipped the Move out button
        // — the only way forward — off the bottom with no way to reach it.
        <div className="fixed inset-0 z-[75] bg-black overflow-y-auto font-pixel text-white animate-in fade-in duration-500">
            {scene && !sceneFailed && (
                // Dimmed hard: this is a backdrop for a wall of text, not a picture to look
                // at. At full brightness the city swallowed the boss sprite standing on it.
                <img src={scene} alt="" onError={() => setSceneFailed(true)}
                     className="fixed inset-0 w-full h-full object-cover opacity-40" />
            )}
            <div className="fixed inset-0 pointer-events-none"
                 style={{ background: `radial-gradient(ellipse at 50% 60%, ${accent}18 0%, #000d 65%)` }} />

            <div className="relative z-10 min-h-full w-full max-w-[820px] mx-auto px-8 py-6 flex flex-col items-center justify-center gap-3 sm:gap-5 text-center">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[11px] uppercase tracking-[0.4em]" style={{ color: accent }}>
                        {t('Act {n}', { n: act.act })}
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-widest">{t(act.city)}</h1>
                    {stage && (
                        <span className="text-[11px] uppercase tracking-widest text-gray-500">
                            {t(stage.name)}
                        </span>
                    )}
                </div>

                <div className="w-24 h-[2px] rounded" style={{ background: accent }} />

                <div className="flex items-center gap-4 sm:gap-6">
                    {art ? (
                        <img src={art} alt="" className="h-[190px] max-h-[32dvh] w-auto object-contain"
                             style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.9)) drop-shadow(0 0 16px rgba(248,113,113,0.35))' }} />
                    ) : (
                        <Skull size={64} className="text-red-500" />
                    )}
                    <div className="max-w-[380px] text-left flex flex-col gap-2 min-w-0">
                        <span className="flex items-center gap-2 text-[13px] font-black uppercase tracking-widest text-red-300">
                            <Crown size={15} /> {t(act.name)}
                        </span>
                        <p className="text-[12px] leading-relaxed text-gray-300 normal-case tracking-normal">
                            {t(act.hint)}
                        </p>
                    </div>
                </div>

                {/* Said out loud, because it is the thing that separates this from a new run:
                    everything the last act was played with is still here. */}
                <p className="text-[11px] text-gray-500 normal-case tracking-normal">
                    {t('Your squad, your Coin and your bench carry over. Wounds do too.')}
                </p>

                <button data-sfx="confirm"
                        onClick={onContinue}
                        className="h-12 px-8 flex items-center gap-2 rounded-lg border-2 text-[13px] font-black uppercase tracking-widest transition-all hover:brightness-125"
                        style={{ borderColor: accent, color: accent, background: `${accent}14` }}>
                    {t('Move out')} <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};
