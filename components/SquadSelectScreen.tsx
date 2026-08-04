
import React, { useState } from 'react';
import { HeroId, Skill, UnitClass, UnitDefinition } from '../types';
import { SQUAD_SIZE } from '../constants';
import { HERO_DEFINITIONS, STARTING_HEROES } from '../data/heroes';
import { unlockInfoFor } from '../data/unlocks';
import { HandFist, Heart, ArrowRight, Sun, Footprints, Swords, Sparkles, Lock } from 'lucide-react';
import { HERO_ACCENTS } from '../utils/icons';
import { useI18n } from '../i18n';

interface SquadSelectScreenProps {
  /** Heroes the save has unlocked. Defaults to the 5 starting heroes (DESIGN.md section 7). */
  unlockedHeroes?: HeroId[];
  onStartGame: (selectedHeroes: HeroId[]) => void;
  /** Legacy prop, no longer used: heroes are defined in data/heroes.ts, not in unitDefs. */
  unitDefs?: Record<UnitClass, UnitDefinition>;
}

const prettyClass = (cls: UnitClass) =>
    cls.toString().toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

/** One line of a hero card: the free basic attack, or the Sun-priced hero skill. */
const SkillLine: React.FC<{ skill: Skill; isSkill?: boolean }> = ({ skill, isSkill }) => {
    const { t } = useI18n();
    const cost = skill.sunCost ?? 0;
    const damage = skill.effects?.find(e => e.type === 'DAMAGE')?.value ?? 0;
    return (
        <div className={`flex flex-col gap-0.5 p-2 rounded border ${isSkill ? 'border-yellow-900/60 bg-yellow-950/30' : 'border-gray-800 bg-black/40'}`}>
            <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-200 truncate">
                    {isSkill ? <Sparkles size={11} className="text-yellow-400 shrink-0" /> : <Swords size={11} className="text-gray-400 shrink-0" />}
                    <span className="truncate">{t(skill.name)}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                    {damage > 0 && (
                        <span className="flex items-center gap-1 text-[11px] font-black text-orange-400">
                            <HandFist size={10} /> {damage}
                        </span>
                    )}
                    {cost > 0 ? (
                        <span className="flex items-center gap-1 text-[11px] font-black text-yellow-400">
                            <Sun size={10} fill="currentColor" /> {cost}
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold uppercase text-green-400">{t('Free')}</span>
                    )}
                </span>
            </div>
            <p className="text-[11px] leading-tight text-gray-400">{t(skill.description)}</p>
        </div>
    );
};

/**
 * Campaign-select style roster (one full-height showcase column per hero, like the
 * StarCraft 2 episode picker): the big transparent sprites ARE the screen. Clicking
 * a column toggles the hero; the slot number appears as a badge on the column, so
 * there is no separate "selected slots" strip eating vertical space.
 */
export const SquadSelectScreen: React.FC<SquadSelectScreenProps> = ({
    unlockedHeroes = STARTING_HEROES,
    onStartGame,
}) => {
  const { t } = useI18n();
  const [selectedSquad, setSelectedSquad] = useState<HeroId[]>([]);

  // Every hero in the game, not just the owned ones. Locked heroes used to be filtered out
  // entirely, so a player had no idea more existed — and a hero that appears out of nowhere
  // after a boss reads as a bug, not a reward. Showing the locked slot and what opens it is
  // what turns the unlock into a goal.
  const roster = (Object.keys(HERO_DEFINITIONS) as HeroId[]);
  const isSquadReady = selectedSquad.length === SQUAD_SIZE;

  const handleToggleHero = (heroId: HeroId) => {
      setSelectedSquad(prev => {
          if (prev.includes(heroId)) return prev.filter(h => h !== heroId);
          if (prev.length >= SQUAD_SIZE) return prev;
          return [...prev, heroId];
      });
  };

  return (
    <div className="w-full h-screen bg-[#0d0e11] flex flex-col font-pixel text-white relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,#1a2130_0%,#0d0e11_55%,#000_100%)] z-0"></div>
        <div className="absolute top-0 w-full h-1 bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)] z-10"></div>

        <div className="z-10 w-full h-full flex flex-col px-8 pt-5 pb-6 gap-4 max-w-[1800px] mx-auto">

            {/* HEADER */}
            <div className="flex justify-between items-end border-b border-gray-800 pb-3 shrink-0">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-widest">{t('Choose Your Heroes')}</h1>
                    <p className="text-gray-500 text-sm uppercase tracking-widest">
                        {t('Squad:')} <span className={`font-bold ${isSquadReady ? 'text-green-400' : 'text-white'}`}>{selectedSquad.length}/{SQUAD_SIZE}</span>
                        <span className="ml-3 text-gray-600 normal-case tracking-normal">{t('Sun is earned in battle — heroes cost nothing to bring.')}</span>
                    </p>
                </div>
                <button
                    onClick={() => isSquadReady && onStartGame(selectedSquad)}
                    disabled={!isSquadReady}
                    className={`
                        h-12 px-6 uppercase tracking-widest font-bold text-base transition-all flex items-center gap-3 border-b-4 active:border-b-0 active:translate-y-1 rounded-sm
                        ${isSquadReady
                            ? 'bg-green-600 border-green-800 text-white hover:bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                            : 'bg-gray-800 border-gray-900 text-gray-600 cursor-not-allowed opacity-50'
                        }
                    `}
                >
                    {t('Launch')} <ArrowRight size={20} />
                </button>
            </div>

            {/* HERO SHOWCASE COLUMNS */}
            <div className="flex-1 min-h-0 flex gap-3 overflow-x-auto custom-scrollbar">
                {roster.map(heroId => {
                    const hero = HERO_DEFINITIONS[heroId];
                    const locked = !unlockedHeroes.includes(heroId);
                    const unlockInfo = locked ? unlockInfoFor(heroId) : undefined;
                    const isSelected = selectedSquad.includes(heroId);
                    const slotIndex = selectedSquad.indexOf(heroId);
                    const isSquadFull = selectedSquad.length >= SQUAD_SIZE;
                    const isDisabled = locked || (isSquadFull && !isSelected);
                    const accent = HERO_ACCENTS[heroId] ?? '#facc15';
                    const sprite = hero.boardImgUrl ?? hero.imgUrl;

                    return (
                        <button
                            key={heroId}
                            onClick={() => handleToggleHero(heroId)}
                            disabled={isDisabled}
                            className={`
                                group relative flex-1 min-w-[200px] flex flex-col rounded-lg border-2 text-left transition-all overflow-hidden
                                ${isSelected
                                    ? 'bg-[#161b24]'
                                    : locked
                                        // Dimmer than the "squad is full" state, and not the same
                                        // look: one means "not yet yours", the other "no room".
                                        ? 'bg-[#0b0c0f] border-[#1e2128] cursor-not-allowed'
                                        : isDisabled
                                            ? 'bg-[#0f1012] border-gray-800 opacity-40 grayscale cursor-not-allowed'
                                            : 'bg-[#12141a] border-[#252a35] hover:border-gray-500 hover:bg-[#171a22]'
                                }
                            `}
                            style={isSelected ? { borderColor: accent, boxShadow: `0 0 24px ${accent}33, inset 0 0 40px ${accent}11` } : undefined}
                        >
                            {/* Accent wash behind the sprite, brighter when picked */}
                            <div
                                className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none transition-opacity"
                                style={{
                                    background: `radial-gradient(ellipse at 50% 100%, ${accent}${isSelected ? '2e' : '14'} 0%, transparent 65%)`,
                                }}
                            ></div>

                            {/* LOCKED VEIL — the hero is a silhouette and the card states the
                                one thing that opens it. */}
                            {locked && (
                                <div className="absolute inset-0 z-30 flex flex-col items-center justify-end gap-2 px-4 pb-6
                                                bg-gradient-to-t from-[#0b0c0f] via-[#0b0c0f]/85 to-[#0b0c0f]/45 pointer-events-none">
                                    <Lock size={26} className="text-gray-500 mb-1" />
                                    {unlockInfo ? (
                                        <>
                                            <div className="text-[11px] uppercase tracking-widest text-gray-500">
                                                {t('Locked')}
                                            </div>
                                            <div className="text-sm font-bold uppercase tracking-wider text-center"
                                                 style={{ color: accent }}>
                                                {t(unlockInfo.city)}
                                            </div>
                                            <p className="text-[11px] leading-snug text-gray-400 text-center normal-case tracking-normal">
                                                {t(unlockInfo.hint)}
                                            </p>
                                            <div className="mt-1 px-2 py-1 border border-[#2b303b] text-[10px] uppercase tracking-widest text-gray-400">
                                                {t('Defeat boss {n}', { n: unlockInfo.bossNumber })}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-[11px] uppercase tracking-widest text-gray-500">
                                            {t('Locked')}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Slot badge */}
                            {isSelected && (
                                <div
                                    className="absolute top-2 right-2 z-20 px-2 py-1 rounded text-[11px] font-black uppercase tracking-widest text-black"
                                    style={{ backgroundColor: accent, boxShadow: `0 0 10px ${accent}` }}
                                >
                                    {t('Slot {n}', { n: slotIndex + 1 })}
                                </div>
                            )}

                            {/* THE HERO — the point of this screen. Takes all free height. */}
                            <div className="relative flex-1 min-h-0 flex items-end justify-center pt-3 px-2">
                                <img
                                    src={sprite}
                                    alt={hero.name}
                                    className={`
                                        relative z-10 max-h-full w-auto object-contain object-bottom transition-transform duration-200
                                        ${isDisabled ? '' : 'group-hover:scale-[1.04]'}
                                        ${isSelected ? 'scale-[1.02]' : ''}
                                    `}
                                    style={{
                                        // A locked hero is a silhouette: you can see the shape of
                                        // what you are working towards without being shown the art.
                                        filter: locked
                                            ? 'brightness(0.18) grayscale(1) drop-shadow(0 10px 12px rgba(0,0,0,0.7))'
                                            : `drop-shadow(0 10px 12px rgba(0,0,0,0.7))${isSelected ? ` drop-shadow(0 0 14px ${accent}55)` : ''}`,
                                    }}
                                />
                                {/* Platform the hero stands on */}
                                <div
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[72%] h-5 rounded-[100%] pointer-events-none"
                                    style={{
                                        background: `radial-gradient(ellipse at center, ${accent}${isSelected ? '66' : '2a'} 0%, transparent 70%)`,
                                        boxShadow: isSelected ? `0 0 18px ${accent}44` : undefined,
                                    }}
                                ></div>
                            </div>

                            {/* NAME PLATE + STATS */}
                            <div className="relative z-10 flex flex-col items-center gap-1 px-3 pt-2">
                                <div
                                    className="text-lg font-black uppercase tracking-widest leading-none text-center"
                                    style={{ color: isSelected ? accent : '#e5e7eb' }}
                                >
                                    {t(hero.name)}
                                </div>
                                <div className="text-[11px] uppercase tracking-widest text-gray-500">{t(prettyClass(hero.baseClass))}</div>
                                <div className="flex items-center gap-4 mt-1 text-[12px] font-mono font-bold">
                                    <span className="flex items-center gap-1 text-red-400"><Heart size={12} fill="currentColor" />{hero.maxHp}</span>
                                    <span className="flex items-center gap-1 text-orange-400"><HandFist size={12} />{hero.damage}</span>
                                    <span className="flex items-center gap-1 text-sky-400"><Footprints size={12} />{hero.moveRange}</span>
                                </div>
                            </div>

                            {/* SKILLS */}
                            <div className="relative z-10 flex flex-col gap-1.5 p-3 shrink-0">
                                <SkillLine skill={hero.basicAttack} />
                                <SkillLine skill={hero.heroSkill} isSkill />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>

        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: #0f1012; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
        `}</style>
    </div>
  );
};
