
import React, { useEffect, useMemo, useState } from 'react';
import { Lock, Play, Image as ImageIcon } from 'lucide-react';
import { UnlockState } from '../types';
import { STAGES, actsOfStage } from '../data/unlocks';
import { BOSS_CUTSCENES, STAGE_CUTSCENES, CutsceneDef } from '../data/cutscenes';
import { useI18n } from '../i18n';

/**
 * THE SCENE GALLERY — every story beat the campaign has, and which ones this save has earned.
 *
 * It exists because the story was previously a single link on the main menu ("read the intro
 * comic") and thirteen scenes that played once, mid-run, and were then gone forever. The
 * comic had a door; the cutscenes did not. This is that door, for all of them at once.
 *
 * WHAT IS LOCKED IS THE SCENE, NOT THE FACT THAT IT EXISTS. A locked card still names the boss
 * that opens it — the campaign screen already lists all nine bosses, so hiding their names here
 * would conceal nothing and only make the list unreadable. What it hides is the captions: those
 * are the payoff, and they are the one thing worth arriving at.
 *
 * ART GATE. Most of the paintings are commissioned but not delivered (see data/cutscenes.ts),
 * and `Cutscene` silently closes itself when its image 404s — which from a gallery would read
 * as a broken button. So every unlocked scene's art is probed here first, and a scene whose
 * painting has not landed says so instead of pretending to be playable.
 */

interface SceneCard {
    key: string;
    /** i18n key. Shown whether or not the scene is unlocked. */
    title: string;
    /** i18n key, the first caption. Hidden until unlocked — this is the actual payoff. */
    blurb: string;
    /** Cutscene painting; absent for the two comics, which carry eight panels of their own. */
    art?: string;
    unlocked: boolean;
    /** i18n key: what the player has to do. Only read when locked. */
    lockHint: string;
    lockHintArgs?: Record<string, string>;
    play?: () => void;
}

interface SceneGroup {
    label: string;
    cards: SceneCard[];
}

interface SceneGalleryProps {
    unlocks?: UnlockState;
    /** Re-open the eight-panel intro. Its absence is what hides this whole tab mid-run. */
    onReplayIntro?: () => void;
    /** Only passed when the epilogue's artwork actually shipped (App probes panel one). */
    onReplayOutro?: () => void;
    onPlayCutscene?: (scene: CutsceneDef) => void;
}

export const SceneGallery: React.FC<SceneGalleryProps> = ({
    unlocks, onReplayIntro, onReplayOutro, onPlayCutscene,
}) => {
    const { t } = useI18n();
    const beaten = unlocks?.bossesBeaten ?? [];

    const groups: SceneGroup[] = useMemo(() => {
        const cutsceneCard = (key: string, def: CutsceneDef, unlocked: boolean,
                              lockHint: string, lockHintArgs?: Record<string, string>): SceneCard => ({
            key,
            title: def.kicker,
            blurb: def.captions[0] ?? '',
            art: def.art,
            unlocked,
            lockHint,
            lockHintArgs,
            play: () => onPlayCutscene?.(def),
        });

        const out: SceneGroup[] = [{
            label: t('Prologue'),
            cards: [{
                key: 'INTRO',
                title: 'The night the city fell',
                blurb: 'Eight panels: where the Blight came from, and who was left holding the gear.',
                // No art gate: the intro is the one scene the game shows itself, unprompted,
                // on a fresh save — if its panels were missing that would already be visible.
                unlocked: true,
                lockHint: '',
                play: onReplayIntro,
            }],
        }];

        for (const stage of STAGES) {
            const acts = actsOfStage(stage.id as 1 | 2 | 3);
            const cards: SceneCard[] = [];
            for (const boss of acts) {
                const def = BOSS_CUTSCENES[boss.id];
                if (!def) continue;
                cards.push(cutsceneCard(`BOSS_${boss.id}`, def, beaten.includes(boss.id),
                    'Defeat {boss} to unlock', { boss: t(boss.name) }));
            }
            const stageDef = STAGE_CUTSCENES[stage.id as 1 | 2 | 3];
            if (stageDef) {
                cards.push(cutsceneCard(`STAGE_${stage.id}`, stageDef,
                    acts.every(b => beaten.includes(b.id)),
                    'Clear {stage} to unlock', { stage: t(stage.name) }));
            }
            if (cards.length) out.push({ label: t(stage.name), cards });
        }

        out.push({
            label: t('Finale'),
            cards: [{
                key: 'OUTRO',
                title: 'What was left standing',
                blurb: 'Eight panels: the morning after the Blightlord went down.',
                unlocked: beaten.includes('BLIGHTLORD'),
                lockHint: 'Defeat {boss} to unlock',
                lockHintArgs: { boss: t('Blightlord') },
                play: onReplayOutro,
            }],
        });

        return out;
    }, [beaten.join(','), onReplayIntro, onReplayOutro, onPlayCutscene, t]);

    /* Which paintings actually exist. Only unlocked scenes are probed: a locked card shows a
       padlock either way, and probing it would fire a request for art the player cannot see. */
    const artToProbe = useMemo(
        () => groups.flatMap(g => g.cards).filter(c => c.unlocked && c.art).map(c => c.art!),
        [groups],
    );
    const [artReady, setArtReady] = useState<Record<string, boolean>>({});
    useEffect(() => {
        let live = true;
        for (const src of artToProbe) {
            const probe = new Image();
            probe.onload = () => { if (live) setArtReady(prev => (prev[src] ? prev : { ...prev, [src]: true })); };
            probe.src = src;
        }
        return () => { live = false; };
    }, [artToProbe.join('|')]);

    const total = groups.reduce((n, g) => n + g.cards.length, 0);
    const seen = groups.reduce((n, g) => n + g.cards.filter(c => c.unlocked).length, 0);

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <div className="max-w-4xl mx-auto w-full pb-6 space-y-5">

                <p className="text-[11px] text-gray-500 leading-5">
                    {t('Every scene the campaign has. Beating a boss opens the one it ends.')}
                    <span className="ml-2 font-mono text-gray-600">{seen}/{total}</span>
                </p>

                {groups.map(group => (
                    <div key={group.label}>
                        <h3 className="text-[11px] uppercase tracking-[0.2em] text-gray-500 border-b border-[#2a2f38] pb-1.5 mb-2.5">
                            {group.label}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                            {group.cards.map(card => {
                                const missingArt = !!card.art && !artReady[card.art];
                                const playable = card.unlocked && !missingArt && !!card.play;
                                return (
                                    <button
                                        key={card.key}
                                        disabled={!playable}
                                        onClick={() => card.play?.()}
                                        className={`group text-left border transition-all overflow-hidden
                                            ${playable
                                                ? 'bg-[#1a1c21] border-[#363b45] hover:border-green-500 hover:bg-[#23262f] active:scale-[0.98] cursor-pointer'
                                                : 'bg-[#131519] border-[#23262e] cursor-default'}`}
                                    >
                                        {/* Thumbnail band. A locked scene never renders its painting —
                                            the picture is half the reveal. */}
                                        <div className="relative aspect-[16/9] bg-black border-b border-[#23262e] flex items-center justify-center">
                                            {card.unlocked && card.art && !missingArt ? (
                                                <>
                                                    <img src={card.art} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                    <Play size={22} className="relative text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" fill="currentColor" />
                                                </>
                                            ) : card.unlocked && !card.art ? (
                                                <Play size={22} className="text-green-400/80" fill="currentColor" />
                                            ) : card.unlocked ? (
                                                <ImageIcon size={20} className="text-gray-700" />
                                            ) : (
                                                <Lock size={18} className="text-gray-700" />
                                            )}
                                        </div>

                                        <div className="p-2.5">
                                            <h4 className={`text-[12px] font-bold uppercase tracking-wide leading-tight mb-1
                                                ${card.unlocked ? 'text-white group-hover:text-green-400' : 'text-gray-500'}`}>
                                                {t(card.title)}
                                            </h4>
                                            <p className="text-[11px] leading-4 text-gray-500 line-clamp-3">
                                                {!card.unlocked
                                                    ? t(card.lockHint, card.lockHintArgs)
                                                    : missingArt
                                                        ? <span className="text-amber-600/80">{t('Artwork not in yet')}</span>
                                                        : t(card.blurb)}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
