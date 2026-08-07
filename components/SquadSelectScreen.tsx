
import React, { useState } from 'react';
import { ElementId, HeroId, HeroRole, Skill, UnitClass, UnitDefinition } from '../types';
import { SQUAD_SIZE } from '../constants';
import { HERO_DEFINITIONS, STARTING_HEROES } from '../data/heroes';
import { bossForElement, unlockInfoFor } from '../data/unlocks';
import { HandFist, Heart, ArrowLeft, ArrowRight, Sun as Sol, Footprints, Swords, Sparkles, Lock, Ban, Snowflake, Flame, Zap, Atom, Settings } from 'lucide-react';
import { HERO_ACCENTS } from '../utils/icons';
import { IS_COARSE_POINTER } from '../utils/platform';
import { ELEMENTS, ELEMENT_DEFINITIONS, ELEMENT_HP_COST, RESONANCE_DESCRIPTIONS, resonanceOf } from '../utils/elements';
import { ROLE_META, ROLE_ORDER, HeroRoleChip } from './HeroRoleChip';
import { useI18n } from '../i18n';

/** Element chosen per hero for the run about to start. Missing = base form. */
export type HeroElementMap = Partial<Record<HeroId, ElementId>>;

interface SquadSelectScreenProps {
  /** Heroes the save has unlocked. Defaults to the starting heroes (DESIGN.md section 7). */
  unlockedHeroes?: HeroId[];
  /**
   * Elements the save has won, from `elementsUnlocked(bossesBeaten)`. Each one is paid out by
   * the boss that closes a stage, so before that boss falls its chip is a padlock.
   *
   * Optional, and omitting it offers all three — a caller that has not been taught about the
   * gate must not silently take the choice away. App is the only caller and does pass it.
   */
  unlockedElements?: ElementId[];
  onStartGame: (selectedHeroes: HeroId[], heroElements: HeroElementMap) => void;
  /** Back to the campaign screen. The act was chosen one step earlier, so it must be
   *  changeable one step later — without this the only way out was abandoning the run. */
  onBack?: () => void;
  onOpenSettings?: () => void;
  /** Legacy prop, no longer used: heroes are defined in data/heroes.ts, not in unitDefs. */
  unitDefs?: Record<UnitClass, UnitDefinition>;
}

/** The face of each choice. Base is deliberately a "no" sign, not a fourth element. */
const ELEMENT_ICONS: Record<ElementId, React.ReactNode> = {
    ICE: <Snowflake size={11} className="shrink-0" />,
    FIRE: <Flame size={11} className="shrink-0" />,
    LIGHTNING: <Zap size={11} className="shrink-0" />,
};

const prettyClass = (cls: UnitClass) =>
    cls.toString().toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');


/** One line of a hero card: the free basic attack, or the Sol-priced hero skill. */
const SkillLine: React.FC<{ skill: Skill; isSkill?: boolean }> = ({ skill, isSkill }) => {
    const { t } = useI18n();
    const cost = skill.sunCost ?? 0;
    const damage = skill.effects?.find(e => e.type === 'DAMAGE')?.value ?? 0;
    return (
        <div className={`flex items-center justify-between gap-2 px-2 py-1 rounded border ${isSkill ? 'border-yellow-900/60 bg-yellow-950/30' : 'border-gray-800 bg-black/40'}`}>
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-200 truncate">
                {isSkill ? <Sparkles size={10} className="text-yellow-400 shrink-0" /> : <Swords size={10} className="text-gray-400 shrink-0" />}
                <span className="truncate">{t(skill.name)}</span>
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
                {damage > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] font-black text-orange-400">
                        <HandFist size={9} /> {damage}
                    </span>
                )}
                {cost > 0 ? (
                    <span className="flex items-center gap-0.5 text-[10px] font-black text-yellow-400">
                        <Sol size={9} fill="currentColor" /> {cost}
                    </span>
                ) : (
                    <span className="text-[9px] font-bold uppercase text-green-400">{t('Free')}</span>
                )}
            </span>
        </div>
    );
};

/**
 * THE ELEMENT PICKER, one per hero that has actually been picked.
 *
 * Four mutually exclusive states — base, ice, fire, lightning — and three of them are paid for
 * in MAX health (PLAN-progression.md section 3). This game is built on perfect information, so
 * the price is never something the player works out afterwards: the card's health number drops
 * the instant a chip is pressed (see the stat line in `renderCard`), and this panel names both
 * the bill and what the element actually DOES while the finger is still on the button.
 *
 * The figure is READ from `ELEMENT_HP_COST`, never written here. That constant is a ratio in
 * disguise — it moved from 1 to 2 when hero health doubled — and a screen that hardcoded the
 * old number would go on quoting a price the game had stopped charging.
 *
 * It sits OUTSIDE the card's <button> rather than inside it, because a button inside a button
 * is invalid DOM and React says so out loud.
 */
const ElementPicker: React.FC<{
    chosen?: ElementId;
    onChoose: (element?: ElementId) => void;
    /** Elements the save has won. Undefined means "caller has not said" — all three offered. */
    unlocked?: ElementId[];
}> = ({ chosen, onChoose, unlocked }) => {
    const { t } = useI18n();
    const def = chosen ? ELEMENT_DEFINITIONS[chosen] : undefined;
    // Neutral grey for the base form: it is the absence of an element, not a colour of its own.
    const accent = def?.accent ?? '#4b5563';
    const isLocked = (id: ElementId) => !!unlocked && !unlocked.includes(id);

    const chip = (
        label: string,
        icon: React.ReactNode,
        colour: string,
        active: boolean,
        pick: () => void,
        locked = false,
        why?: string,
    ) => (
        <button
            key={label}
            onClick={locked ? undefined : pick}
            disabled={locked}
            // The requirement, not just the padlock: the whole point of gating this is to tell
            // the player where to go and get it, and there is no room on a 9px chip to say so.
            title={locked ? why : undefined}
            className={`flex items-center gap-1 px-1.5 py-1 rounded border text-[9px] font-bold uppercase tracking-wider transition-colors
                        ${locked ? 'cursor-not-allowed' : ''}`}
            style={locked
                ? { borderColor: '#1b1f27', color: '#4b5563', backgroundColor: '#0a0c10' }
                : active
                    ? { borderColor: colour, backgroundColor: `${colour}26`, color: colour, boxShadow: `0 0 8px ${colour}33` }
                    : { borderColor: '#252a35', color: '#6b7280' }}
        >
            {locked ? <Lock size={10} className="shrink-0" /> : icon}
            <span className="truncate">{t(label)}</span>
        </button>
    );

    return (
        <div
            className="rounded-lg border bg-[#0b0d12] px-2 py-1.5 flex flex-col gap-1.5"
            style={{ borderColor: `${accent}66` }}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{t('Element')}</span>
                <span
                    className="text-[9px] font-black uppercase tracking-widest shrink-0"
                    style={{ color: chosen ? '#f87171' : '#4b5563' }}
                >
                    {chosen ? t('-{n} max HP', { n: ELEMENT_HP_COST }) : t('No cost')}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-1">
                {chip('Base', <Ban size={11} className="shrink-0" />, '#9ca3af', !chosen, () => onChoose(undefined))}
                {ELEMENTS.map(id => {
                    const locked = isLocked(id);
                    const from = locked ? bossForElement(id) : undefined;
                    return chip(
                        ELEMENT_DEFINITIONS[id].name,
                        ELEMENT_ICONS[id],
                        ELEMENT_DEFINITIONS[id].accent,
                        chosen === id,
                        () => onChoose(id),
                        locked,
                        from ? t('Take it from {boss} at {city}', { boss: t(from.name), city: t(from.city) }) : undefined,
                    );
                })}
            </div>
            {/* Fixed floor so a card does not jump a row taller when an element is picked.
                short:hidden — trên màn thấp mỗi px dọc là đất của sprite; chip đã tự nói
                bằng màu + tên, phần diễn giải đọc ở màn rộng. */}
            <p className="short:hidden text-[9px] leading-snug text-gray-400 normal-case tracking-normal min-h-[26px]">
                {def ? t(def.description) : t('Base form. No rider on this hero\'s attacks, and no health paid.')}
            </p>
            {/* Said once, under the row, rather than three times inside it: with nothing unlocked
                yet the padlocks alone read as "broken", and a player owed an explanation should
                not have to hover a 9px chip to find one. */}
            {unlocked && unlocked.length < ELEMENTS.length && (
                <span className="short:hidden flex items-center gap-1 text-[8px] leading-tight text-gray-600 normal-case tracking-normal">
                    <Lock size={9} className="shrink-0" />
                    {t('Elements are taken from the boss that closes a stage.')}
                </span>
            )}
        </div>
    );
};

/**
 * RESONANCE, SAID OUT LOUD.
 *
 * A squad that carries one element between all three heroes gets a fourth rule (see
 * `resonanceOf`) — and pays `SQUAD_SIZE * ELEMENT_HP_COST` max health plus the whole of its
 * mixed coverage for it. The engine had that bonus working before any screen mentioned it,
 * which is the worst arrangement available: the bill is on every card and the payoff is
 * nowhere, so nobody would ever commit far enough to discover it. An invisible reward is not
 * a reward, it is a tax.
 *
 * TWO states, and the difference between them matters more than the styling:
 *   - ACTIVE — the loud one, keyed off `resonanceOf` and nothing else. Everything here is
 *     read from the same function the engine calls, so this card cannot claim a bonus the
 *     rules are not granting.
 *   - NEAR MISS — one quiet line, and the whole reason this component exists. A player who
 *     never happens to pick three of a kind would otherwise finish the game without learning
 *     the system is there. Two matching heroes is the earliest moment the hint is a lead
 *     rather than a lecture, and it names the actual payoff, because "there is a secret" is
 *     a worse prompt than the rule itself in a game built on perfect information.
 *
 * It stays a HINT and not a second banner on purpose: the decision this screen is for is
 * which heroes go, and an element that shouts louder than the roster inverts that.
 */
const ResonanceBar: React.FC<{ heroElements: HeroElementMap }> = ({ heroElements }) => {
    const { t } = useI18n();
    // The same call the run itself is judged by — never a local re-derivation of the rule.
    const resonance = resonanceOf(heroElements, SQUAD_SIZE);

    // The biggest group of heroes already sharing an element. One is not a near miss, it is
    // just the chip that was clicked a second ago, so nothing below two is worth a line.
    const chosen = Object.values(heroElements).filter(Boolean) as ElementId[];
    const partial = resonance
        ? undefined
        : ELEMENTS
            .map(id => ({ id, n: chosen.filter(e => e === id).length }))
            .filter(entry => entry.n >= 2)
            .sort((a, b) => b.n - a.n)[0];

    if (resonance) {
        const def = ELEMENT_DEFINITIONS[resonance];
        return (
            <div
                className="shrink-0 rounded-lg border px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1"
                style={{
                    borderColor: def.accent,
                    backgroundColor: `${def.accent}14`,
                    boxShadow: `0 0 18px ${def.accent}26`,
                }}
            >
                <span
                    className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest shrink-0"
                    style={{ color: def.accent }}
                >
                    <Atom size={14} className="shrink-0" />
                    {t('{element} resonance', { element: t(def.name) })}
                </span>
                {/* Straight from RESONANCE_DESCRIPTIONS, beside the rule it describes. */}
                <span className="text-[12px] leading-snug text-gray-200 normal-case tracking-normal">
                    {t(RESONANCE_DESCRIPTIONS[resonance])}
                </span>
                {/* COMPUTED, never typed. The per-hero price already moved once (1 -> 2) and
                    a hand-written total would have gone on quoting 3 while the cards said 6. */}
                <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-red-400 shrink-0">
                    {t('-{n} max HP in total', { n: SQUAD_SIZE * ELEMENT_HP_COST })}
                </span>
            </div>
        );
    }

    if (!partial) return null;
    const nearDef = ELEMENT_DEFINITIONS[partial.id];
    return (
        <p className="shrink-0 flex items-start gap-1.5 px-1 text-[11px] leading-snug text-gray-500 normal-case tracking-normal">
            <Atom size={12} className="shrink-0 mt-[1px]" style={{ color: `${nearDef.accent}99` }} />
            <span>
                {t('{n} of {total} heroes carry {element}. Match all {total} and the squad resonates: {rule}', {
                    n: partial.n,
                    total: SQUAD_SIZE,
                    element: t(nearDef.name),
                    rule: t(RESONANCE_DESCRIPTIONS[partial.id]),
                })}
            </span>
        </p>
    );
};

/**
 * ROSTER SELECT, grouped by role.
 *
 * The previous version was one horizontal strip of full-height showcase columns. It worked
 * at five heroes and broke at ten: measured in a 666px-wide pane, the ten cards came to
 * 2108px of content, so 3.3 of them were on screen and the other seven lived behind a
 * horizontal scrollbar most players never touch. A hero nobody scrolls to cannot be a goal,
 * which is the entire reason locked cards are on this screen at all.
 *
 * So the strip is now a wrapping grid split into the roster's three thirds. Vertical
 * overflow scrolls the way every page does; on a normal desktop each group lands on its own
 * row and the screen reads like the plan's final table. Every card carries the two facts a
 * pick depends on — what the hero DOES (role chip, stats, both actions) and, when locked,
 * the one boss that frees them.
 */
export const SquadSelectScreen: React.FC<SquadSelectScreenProps> = ({
    unlockedHeroes = STARTING_HEROES,
    unlockedElements,
    onStartGame,
    onBack,
    onOpenSettings,
}) => {
  const { t } = useI18n();
  const [selectedSquad, setSelectedSquad] = useState<HeroId[]>([]);
  /**
   * Run-scoped, exactly like the squad itself: the element is a build decision made here and
   * re-made next run. Dropping a hero drops her element with her, so re-picking her never
   * quietly reinstates a choice the player made and then walked away from.
   */
  const [heroElements, setHeroElements] = useState<HeroElementMap>({});

  // Every hero in the game, not just the owned ones. Locked heroes used to be filtered out
  // entirely, so a player had no idea more existed — and a hero that appears out of nowhere
  // after a boss reads as a bug, not a reward. Showing the locked slot and what opens it is
  // what turns the unlock into a goal.
  const roster = Object.keys(HERO_DEFINITIONS) as HeroId[];
  const isSquadReady = selectedSquad.length === SQUAD_SIZE;
  const ownedCount = roster.filter(h => unlockedHeroes.includes(h)).length;

  const handleToggleHero = (heroId: HeroId) => {
      setSelectedSquad(prev => {
          if (prev.includes(heroId)) {
              setHeroElements(els => {
                  const { [heroId]: _dropped, ...rest } = els;
                  return rest;
              });
              return prev.filter(h => h !== heroId);
          }
          if (prev.length >= SQUAD_SIZE) return prev;
          return [...prev, heroId];
      });
  };

  const handleChooseElement = (heroId: HeroId, element?: ElementId) => {
      setHeroElements(prev => {
          if (!element) {
              const { [heroId]: _dropped, ...rest } = prev;
              return rest;
          }
          return { ...prev, [heroId]: element };
      });
  };

  const renderCard = (heroId: HeroId) => {
      const hero = HERO_DEFINITIONS[heroId];
      const locked = !unlockedHeroes.includes(heroId);
      const unlockInfo = locked ? unlockInfoFor(heroId) : undefined;
      const isSelected = selectedSquad.includes(heroId);
      const slotIndex = selectedSquad.indexOf(heroId);
      const isSquadFull = selectedSquad.length >= SQUAD_SIZE;
      const isDisabled = locked || (isSquadFull && !isSelected);
      const accent = HERO_ACCENTS[heroId] ?? '#facc15';
      const sprite = hero.boardImgUrl ?? hero.imgUrl;
      const element = heroElements[heroId];
      // The whole point of showing this here: the bill lands on the card the player is
      // already reading, in the same number they compared heroes on.
      const shownMaxHp = Math.max(1, hero.maxHp - (element ? ELEMENT_HP_COST : 0));

      const card = (
          <button
              onClick={() => handleToggleHero(heroId)}
              disabled={isDisabled}
              style={isSelected
                  ? { borderColor: accent, boxShadow: `0 0 24px ${accent}33, inset 0 0 40px ${accent}11` }
                  : undefined}
              className={`
                  group relative flex-1 min-h-0 flex flex-col rounded-lg border-2 text-left transition-all overflow-hidden
                  ${isSelected
                      ? 'bg-[#161b24]'
                      : locked
                          // Dimmer than the "squad is full" state, and not the same look:
                          // one means "not yet yours", the other "no room".
                          ? 'bg-[#0b0c0f] border-[#1e2128] cursor-not-allowed'
                          : isDisabled
                              ? 'bg-[#0f1012] border-gray-800 opacity-40 grayscale cursor-not-allowed'
                              : 'bg-[#12141a] border-[#252a35] hover:border-gray-500 hover:bg-[#171a22]'
                  }
              `}

          >
              {/* Accent wash behind the sprite, brighter when picked */}
              <div
                  className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none transition-opacity"
                  style={{ background: `radial-gradient(ellipse at 50% 100%, ${accent}${isSelected ? '2e' : '14'} 0%, transparent 65%)` }}
              />

              {/* LOCKED VEIL — the hero is a silhouette and the card states the one thing
                  that opens it. roster.assert.ts guarantees that thing always exists. */}
              {locked && (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-1.5 px-3 text-center
                                  bg-gradient-to-t from-[#0b0c0f] via-[#0b0c0f]/90 to-[#0b0c0f]/55 pointer-events-none">
                      <Lock size={22} className="text-gray-500" />
                      <div className="text-[10px] uppercase tracking-widest text-gray-500">{t('Locked')}</div>
                      {unlockInfo && (
                          <>
                              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
                                  {t(unlockInfo.city)}
                              </div>
                              <div className="px-2 py-1 border border-[#2b303b] rounded text-[10px] uppercase tracking-widest text-gray-300">
                                  {t('Defeat {boss}', { boss: t(unlockInfo.name) })}
                              </div>
                              <p className="text-[10px] leading-snug text-gray-500 normal-case tracking-normal">
                                  {t(unlockInfo.hint)}
                              </p>
                          </>
                      )}
                  </div>
              )}

              {/* Slot badge */}
              {isSelected && (
                  <div
                      className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest text-black"
                      style={{ backgroundColor: accent, boxShadow: `0 0 10px ${accent}` }}
                  >
                      {t('Slot {n}', { n: slotIndex + 1 })}
                  </div>
              )}

              {/* THE HERO, taking every pixel the card can spare — this is what made the
                  original showcase columns worth looking at, and a fixed 172px box was what
                  lost it. `flex-1` is safe here because the grid below sizes every row to
                  1fr: rows are equal height, so equal-height cards, so one sprite scale. */}
              {/* Takes every pixel the card has left over, which is the whole point of a
                  full-height column: the art is as big as the window allows. `min-h-0` lets
                  it SHRINK too — selecting a hero opens its element picker below, and the
                  sprite giving up the room is what keeps the card's height constant. */}
              <div className="relative flex-1 min-h-0 flex items-end justify-center pt-2 px-2">
                  <img
                      src={sprite}
                      alt={hero.name}
                      className={`
                          relative z-10 max-h-full w-auto object-contain object-bottom transition-transform duration-200
                          ${isDisabled ? '' : 'group-hover:scale-[1.05]'}
                          ${isSelected ? 'scale-[1.02]' : ''}
                      `}
                      style={{
                          // A locked hero is a silhouette: you can see the shape of what you
                          // are working towards without being shown the art.
                          // Trên cảm ứng, bỏ các drop-shadow trang trí: filter trên 9 sprite
                          // lớn buộc GPU iOS render từng ảnh qua lớp riêng mỗi khung hình khi
                          // lướt ngang — nguồn giật chính của màn này. Silhouette (brightness/
                          // grayscale) mang nghĩa nên giữ ở mọi thiết bị.
                          filter: locked
                              ? `brightness(0.18) grayscale(1)${IS_COARSE_POINTER ? '' : ' drop-shadow(0 10px 12px rgba(0,0,0,0.7))'}`
                              : IS_COARSE_POINTER
                                  ? undefined
                                  : `drop-shadow(0 10px 12px rgba(0,0,0,0.7))${isSelected ? ` drop-shadow(0 0 14px ${accent}55)` : ''}`,
                      }}
                      decoding="async"
                  />
                  <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[72%] h-4 rounded-[100%] pointer-events-none"
                      style={{
                          background: `radial-gradient(ellipse at center, ${accent}${isSelected ? '66' : '2a'} 0%, transparent 70%)`,
                          boxShadow: isSelected ? `0 0 18px ${accent}44` : undefined,
                      }}
                  />
              </div>

              {/* NAME PLATE + CLASS + STATS */}
              <div className="relative z-10 flex flex-col items-center gap-1 px-2 pt-1.5">
                  {/* tracking-wide/text-sm, not tracking-widest/text-base: at widest every
                      two-word Vietnamese title overran the 221px card and truncated. */}
                  <div
                      className="text-sm font-black uppercase tracking-wide leading-none text-center truncate max-w-full"
                      style={{ color: isSelected ? accent : '#e5e7eb' }}
                      title={t(hero.name)}
                  >
                      {t(hero.name)}
                  </div>
                  {/* Both labels, because they answer different questions: the ROLE chip is
                      what a squad needs a spread of, the plant name is what this hero fuses
                      with and where the sprite comes from. */}
                  <div className="flex items-center gap-1.5 max-w-full">
                      <HeroRoleChip role={hero.role} dim={locked} />
                      <span className="text-[9px] uppercase tracking-widest text-gray-600 truncate">
                          {t(prettyClass(hero.baseClass))}
                      </span>
                  </div>
                  {/* Đã chọn + màn thấp: stats và skills nhường chỗ cho ElementPicker bên
                      dưới — trước đây SPRITE là thứ bị bóp (flex-1 min-h-0) và trên điện
                      thoại ngang nó teo còn một mẩu. Bỏ chọn là thông tin hiện lại. */}
                  <div className={`flex items-center gap-3 mt-0.5 text-[11px] font-mono font-bold ${isSelected ? 'short:hidden' : ''}`}>
                      <span className="flex items-center gap-1 text-red-400">
                          <Heart size={11} fill="currentColor" />
                          {/* Old number kept, struck through: "6 -> 5" is a price, a lone "5" is a mystery. */}
                          {element && <span className="text-gray-600 line-through">{hero.maxHp}</span>}
                          <span style={element ? { color: ELEMENT_DEFINITIONS[element].accent } : undefined}>{shownMaxHp}</span>
                      </span>
                      <span className="flex items-center gap-1 text-orange-400"><HandFist size={11} />{hero.damage}</span>
                      <span className="flex items-center gap-1 text-sky-400"><Footprints size={11} />{hero.moveRange}</span>
                  </div>
              </div>

              {/* SKILLS */}
              <div className={`relative z-10 flex flex-col gap-1 px-2 pb-2 pt-1.5 shrink-0 ${isSelected ? 'short:hidden' : ''}`}>
                  <SkillLine skill={hero.basicAttack} />
                  <SkillLine skill={hero.heroSkill} isSkill />
              </div>
          </button>
      );

      // The picker only exists for a hero who is actually going: it is a decision about a
      // slot, and offering it on the other seven cards would read as "pick an element" rather
      // than "pick a squad".
      //
      // The COLUMN is this wrapper, not the card inside it — that is why the width and the
      // full height live here. Sizing the button instead left the wrapper free to stretch to
      // the strip's height while the button kept its content height, so the art collapsed to
      // 92px and the picker floated in dead space below it.
      return (
          <div
              key={heroId}
              className="h-full flex flex-col gap-1.5 shrink-0"
              style={{ flex: '0 0 240px', width: 240, transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
          >
              {card}
              {/* Every hero picks. Gourdward used to be hidden here (`elementSlot: 'NONE'`)
                  because his ward granted all three immunities outright, which left nothing to
                  buy; the ward is ONE element now — the one he picks — so the slot is a real
                  decision for him too. */}
              {isSelected && !locked && (
                  <ElementPicker
                      chosen={element}
                      onChoose={el => handleChooseElement(heroId, el)}
                      unlocked={unlockedElements}
                  />
              )}
          </div>
      );
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#0d0e11] flex flex-col font-pixel text-white overflow-y-auto lg:overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,#1a2130_0%,#0d0e11_55%,#000_100%)] z-0" />
        <div className="absolute top-0 w-full h-1 bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)] z-10" />

        <div className="z-10 w-full min-h-full lg:h-full flex flex-col px-6 pt-5 pb-5 gap-3 max-w-[1800px] mx-auto">

            {/* HEADER */}
            <div className="flex flex-wrap justify-between items-end gap-3 border-b border-gray-800 pb-3 shrink-0">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-widest">{t('Choose Your Heroes')}</h1>
                    <p className="text-gray-500 text-xs uppercase tracking-widest">
                        {t('Squad:')} <span className={`font-bold ${isSquadReady ? 'text-green-400' : 'text-white'}`}>{selectedSquad.length}/{SQUAD_SIZE}</span>
                        <span className="ml-3 text-gray-600">{t('Roster: {n}/{total} unlocked', { n: ownedCount, total: roster.length })}</span>
                    </p>
                </div>

                {/* flex-wrap + justify-end: hàng này chở bốn thứ (quay lại, cài đặt, ba ô
                    đội hình, nút xuất kích) và ở 375px nó dài 365px trong khung 336px —
                    XUẤT KÍCH, nút chính của cả màn, bị đẩy một phần ra ngoài mép phải.
                    Nhãn "Quay lại" rụng đi trên màn dọc là đủ để cả hàng lọt vào. */}
                <div className="flex flex-wrap justify-end items-center gap-2 lg:gap-3">
                    {onBack && (
                        <button
                            data-sfx="back"
                            onClick={onBack}
                            title={t('Back')}
                            className="h-11 px-4 portrait:px-3 flex items-center gap-2 border border-[#2b303b] rounded text-[11px] uppercase tracking-widest text-gray-400 hover:text-white hover:border-gray-500"
                        >
                            <ArrowLeft size={14} /> <span className="portrait:hidden">{t('Back')}</span>
                        </button>
                    )}

                    {onOpenSettings && (
                        <button
                            onClick={onOpenSettings}
                            className="h-11 px-3 flex items-center justify-center border border-[#2b303b] rounded text-gray-400 hover:text-sky-400 hover:border-sky-500 transition-colors"
                            title={t('Cài Đặt')}
                        >
                            <Settings size={18} />
                        </button>
                    )}

                    {/* The picked squad, always visible. The roster scrolls vertically now, so
                        a chosen hero can be off screen — without this the only record of the
                        pick is a badge the player has already scrolled past. */}
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: SQUAD_SIZE }).map((_, i) => {
                            const id = selectedSquad[i];
                            const accent = id ? (HERO_ACCENTS[id] ?? '#facc15') : '#252a35';
                            // The roster scrolls, so this strip is often the only thing on
                            // screen that still knows what the squad is — the element badge
                            // has to be here too, or a scrolled-away pick is invisible.
                            const el = id ? heroElements[id] : undefined;
                            const elDef = el ? ELEMENT_DEFINITIONS[el] : undefined;
                            return (
                                <div
                                    key={i}
                                    className="relative w-11 h-11 portrait:w-10 portrait:h-10 rounded border flex items-center justify-center overflow-hidden bg-black/50"
                                    style={{ borderColor: accent }}
                                    title={id
                                        ? (elDef
                                            ? `${t(HERO_DEFINITIONS[id].name)} — ${t(elDef.name)}`
                                            : t(HERO_DEFINITIONS[id].name))
                                        : t('Empty')}
                                >
                                    {id
                                        ? <img src={HERO_DEFINITIONS[id].boardImgUrl ?? HERO_DEFINITIONS[id].imgUrl} alt="" className="w-full h-full object-contain p-1" />
                                        : <span className="text-[10px] font-mono text-gray-700">{i + 1}</span>}
                                    {el && (
                                        <span
                                            className="absolute bottom-0 right-0 px-0.5 rounded-tl bg-black/80"
                                            style={{ color: ELEMENT_DEFINITIONS[el].accent }}
                                        >
                                            {ELEMENT_ICONS[el]}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => isSquadReady && onStartGame(selectedSquad, heroElements)}
                        disabled={!isSquadReady}
                        className={`
                            h-11 px-5 portrait:px-4 uppercase tracking-widest font-bold text-sm transition-all flex items-center gap-2 border-b-4 active:border-b-0 active:translate-y-1 rounded-sm
                            ${isSquadReady
                                ? 'bg-green-600 border-green-800 text-white hover:bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                                : 'bg-gray-800 border-gray-900 text-gray-600 cursor-not-allowed opacity-50'}
                        `}
                    >
                        {t('Launch')} <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            {/* RESONANCE, directly under the squad counter and the Launch button and OUTSIDE
                the scrolling roster. The roster is what moves on this screen, so anything
                parked inside it is a notice the player scrolls past exactly once; here the
                bonus sits in the same eyeline as the pick counter it depends on, and is still
                on screen at the moment the player commits. */}
            <ResonanceBar heroElements={heroElements} />

            {/* THE ROSTER — one grid, not three stacked rows.
                Three sections looked orderly on paper and wrong on screen: each held only
                three cards while the grid was built with `auto-fill`, which keeps making
                empty columns to fill the width, so every row was three cards hugging the
                left with half the screen blank beside them. Stacking three of those also
                came to ~910px and scrolled by default on a 860px window.

                One `auto-fit` grid instead: auto-fit COLLAPSES the empty tracks, so the nine
                cards always span the full width. `grid-auto-rows: 1fr` splits the leftover
                height between the rows, which is what lets each card's sprite grow — the
                cards get taller as the window does, exactly like the original columns.

                The roster is sorted by role so ranged / melee / support still arrive in
                blocks as you read, and every card wears its role chip. The grouping is not
                lost, only the three headers that were costing a screenful of height. */}
            {/* THE ROSTER — one full-height row that scrolls sideways.
                This is the original showcase-column layout, restored on purpose. The grid
                that replaced it kept every hero on screen but paid for it twice: the cards
                had to be short, which shrank the art the screen exists to show, and nine
                items never divide evenly into a wrapped row, so the last line always left a
                blank slab beside it.

                A fixed card WIDTH is what makes the strip stable: selecting a hero reveals
                its element picker, and with flexible widths that extra content re-flowed the
                whole row and made every card jump. Fixed width plus `h-full` means a click
                changes what is inside a card and never its size. */}
            <div className="flex-1 min-h-0 flex gap-3 overflow-x-auto overflow-y-hidden custom-scrollbar pb-2">
                {ROLE_ORDER.flatMap(role => roster.filter(h => HERO_DEFINITIONS[h].role === role))
                    .map(renderCard)}
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
