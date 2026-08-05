import React, { useState } from 'react';
import { HeroId, Unit } from '../types';
import { Heart, Footprints, Sparkles, ArrowLeft, Check } from 'lucide-react';
import { UPGRADE_HP, UPGRADE_MOVE, upgradesFor, type UpgradeKind } from '../data/heroUpgrades';
import { HERO_DEFINITIONS } from '../data/heroes';
import { HERO_ACCENTS, HERO_SPRITES } from '../utils/icons';
import { useI18n } from '../i18n';

const KIND_ICON: Record<UpgradeKind, React.ReactNode> = {
    VIGOR: <Heart size={18} />,
    STRIDE: <Footprints size={18} />,
    EDGE: <Sparkles size={18} />,
};

interface UpgradePickerProps {
    /** The squad as it stands — including heroes waiting on a revive. */
    squad: Unit[];
    /** How many picks are owed. Only the first is spent here; the screen reopens for the rest. */
    picks: number;
    onPick: (heroId: HeroId, upgradeId: string) => void;
}

/**
 * WHAT AN ACT PAYS: one hero, one upgrade, and it is gone off the board for good.
 *
 * Two steps rather than one grid of nine, because the two questions are not the same question.
 * WHO is a read of the run — who is dying, who is arriving late, who has the fight coming up.
 * WHAT is a read of that hero. Flattened into one screen the player scans nine cards and picks
 * whichever number is biggest; split, they pick a hero first and then think about that hero.
 *
 * Nothing here can be declined. A boss has fallen and the reward is not optional — the choice
 * is what shape it takes. Declining would only ever be a mistake a player makes once.
 */
export const UpgradePicker: React.FC<UpgradePickerProps> = ({ squad, picks, onPick }) => {
    const { t } = useI18n();
    const [chosen, setChosen] = useState<HeroId | null>(null);

    const heroes = squad.filter(u => u.isHero && u.heroId);
    const hero = chosen ? heroes.find(h => h.heroId === chosen) : undefined;
    const taken = (h: Unit) => h.upgrades ?? [];

    return (
        <div className="fixed inset-0 z-[70] bg-black/92 flex items-center justify-center font-pixel text-white p-3 sm:p-6 animate-in fade-in duration-300">
            {/* max-h-full, NOT max-h-[100dvh]: the parent's padding shrinks the box this
                sits in, and 100dvh let it grow past both ends with the overflow stuck
                outside its own scroll area. */}
            <div className="w-full max-w-[880px] flex flex-col gap-4 max-h-full overflow-y-auto custom-scrollbar">

                <div className="text-center">
                    <p className="text-[11px] uppercase tracking-[0.35em] text-amber-500">{t('Act cleared')}</p>
                    <h1 className="text-2xl font-black uppercase tracking-widest text-amber-300">
                        {chosen ? t('What does {hero} take?', { hero: t(HERO_DEFINITIONS[chosen]?.name ?? chosen) }) : t('Who takes it?')}
                    </h1>
                    {picks > 1 && (
                        <p className="text-[11px] text-gray-500 normal-case tracking-normal">
                            {t('{n} more to spend after this one.', { n: picks - 1 })}
                        </p>
                    )}
                </div>

                {/* STEP 1 — the hero. */}
                {!hero && (
                    <div className="grid grid-cols-3 gap-3">
                        {heroes.map(h => {
                            const id = h.heroId as HeroId;
                            const accent = HERO_ACCENTS[id] ?? '#facc15';
                            const left = upgradesFor(id).filter(u => !taken(h).includes(u.id)).length;
                            return (
                                <button
                                    key={h.id}
                                    onClick={() => left > 0 && setChosen(id)}
                                    disabled={left === 0}
                                    className={`rounded-lg border-2 p-3 flex flex-col items-center gap-1 transition-all
                                                ${left === 0 ? 'opacity-40 cursor-not-allowed border-[#23272f]' : 'hover:brightness-125'}`}
                                    style={{ borderColor: left ? `${accent}88` : undefined, background: left ? `${accent}12` : '#0b0c0f' }}
                                >
                                    <img src={HERO_SPRITES[id] ?? HERO_DEFINITIONS[id]?.imgUrl} alt=""
                                         className="h-[92px] w-auto object-contain"
                                         style={{ filter: left ? `drop-shadow(0 0 10px ${accent}55)` : 'grayscale(1) brightness(0.5)' }} />
                                    <span className="text-[12px] font-black uppercase tracking-wider" style={{ color: accent }}>
                                        {t(HERO_DEFINITIONS[id]?.name ?? id)}
                                    </span>
                                    {/* The three pips are the whole progression, visible at a glance:
                                        three filled means this hero is finished and the run has
                                        nothing left to give them. */}
                                    <span className="flex items-center gap-1 pt-0.5">
                                        {upgradesFor(id).map(u => (
                                            <span key={u.id} className="w-2.5 h-2.5 rounded-sm border"
                                                  title={t(u.name)}
                                                  style={{
                                                      borderColor: `${accent}88`,
                                                      background: taken(h).includes(u.id) ? accent : 'transparent',
                                                  }} />
                                        ))}
                                    </span>
                                    <span className="text-[9px] text-gray-500 normal-case tracking-normal">
                                        {left === 0 ? t('Nothing left to give') : t('{n} left', { n: left })}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* STEP 2 — the upgrade. */}
                {hero && (
                    <>
                        <div className="grid grid-cols-3 gap-3">
                            {upgradesFor(hero.heroId as HeroId).map(u => {
                                const already = taken(hero).includes(u.id);
                                const accent = HERO_ACCENTS[hero.heroId as HeroId] ?? '#facc15';
                                const delta = u.kind === 'VIGOR'
                                    ? t('{from} → {to} HP', { from: hero.maxHp, to: hero.maxHp + UPGRADE_HP })
                                    : u.kind === 'STRIDE'
                                        ? t('{from} → {to} move', { from: hero.moveRange, to: hero.moveRange + UPGRADE_MOVE })
                                        : t('Permanent, this run');
                                return (
                                    <button
                                        key={u.id}
                                        onClick={() => !already && onPick(hero.heroId as HeroId, u.id)}
                                        disabled={already}
                                        className={`rounded-lg border-2 p-4 flex flex-col items-center gap-2 text-center transition-all min-h-[150px]
                                                    ${already ? 'opacity-40 cursor-not-allowed border-[#23272f] bg-[#0b0c0f]' : 'hover:brightness-125'}`}
                                        style={already ? undefined : { borderColor: `${accent}88`, background: `${accent}12` }}
                                    >
                                        <span style={{ color: already ? '#4b5563' : accent }}>
                                            {already ? <Check size={18} /> : KIND_ICON[u.kind]}
                                        </span>
                                        <span className="text-[12px] font-black uppercase tracking-wider"
                                              style={{ color: already ? '#6b7280' : '#e5e7eb' }}>
                                            {t(u.name)}
                                        </span>
                                        <span className="text-[10px] leading-snug text-gray-400 normal-case tracking-normal">
                                            {t(u.description)}
                                        </span>
                                        <span className="mt-auto text-[10px] font-mono"
                                              style={{ color: already ? '#4b5563' : accent }}>
                                            {already ? t('Already taken') : delta}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setChosen(null)}
                            className="self-center h-9 px-4 flex items-center gap-2 border border-[#2b303b] rounded text-[11px] uppercase tracking-widest text-gray-400 hover:text-white hover:border-gray-500"
                        >
                            <ArrowLeft size={13} /> {t('Someone else')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
