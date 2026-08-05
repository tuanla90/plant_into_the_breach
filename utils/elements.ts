import { HERO_DEFINITIONS } from '../data/heroes';
import {
    ElementId, HeroId, Position, SkillEffectDefinition, Skill, StatusEffectType, Unit, WorldType,
} from '../types';

/**
 * THE THREE ELEMENTS, AS RULES.
 *
 * Nine heroes times three elements is 36 configurations. Written as kits that would be 27 new
 * skill sets to design, balance, describe and draw — which is not affordable. Written as three
 * rules that apply to ANY hero, it is this file, and every configuration falls out of it.
 *
 * Everything here is pure and data-only. The three places that consume it are:
 *   - utils/fusion.ts       — bolts the rider onto the attack (rules L1 and L2)
 *   - utils/skillResolution — the lightning chain (rule L3)
 *   - utils/turnManager     — retaliation carries the element too (rule L4)
 */

/**
 * What carrying an element costs, in MAX health.
 *
 * Not damage. Damage across this roster runs 0, 1 or 2, so a flat -1 would be -100% for
 * Ironhusk, -50% for Shadeleaf and -0% for Sunspot — that is not a price, it is a lottery.
 * (The first draft's "-1 range" for FIRE had the same disease: Ironhusk and Maw are range 1.)
 * Health is the one stat everybody has several of, and it PERSISTS between battles, so a point
 * of it is a real bill rather than a number that resets at the next fight.
 *
 * TWO, not one, because max HP was later doubled to the 6/8/10 scale (see the header of
 * data/heroes.ts). A price charged in a stat has to move with that stat or it silently halves:
 * a flat 1 on the doubled scale is -10%/-12.5%/-16.7%, against the -20%/-25%/-33% the argument
 * above was built on. At 2 the proportion is exactly preserved — Ironhusk 10 -> 8, Maw 8 -> 6,
 * Shadeleaf 6 -> 4.
 *
 * So this is a RATIO wearing the costume of a constant. Anyone retuning hero health has to
 * retune this in the same breath, or the element stops being a decision.
 */
export const ELEMENT_HP_COST = 2;

export interface ElementDefinition {
    id: ElementId;
    /** English source string — i18n key. */
    name: string;
    /**
     * What it DOES, in the player's terms — and never what it costs.
     *
     * The price used to be spelled out here as well as computed from ELEMENT_HP_COST by the
     * picker. Two copies of one number is one copy too many: when the constant went from 1 to 2
     * the screen showed a "-2 MAX HP" badge sitting directly above the words "-1 max HP". In a
     * game whose whole premise is perfect information, that is worse than saying nothing.
     *
     * English source string — i18n key. Keeping the cost out of it also means a rebalance never
     * silently invalidates the translation.
     */
    description: string;
    /** Neon accent, matching how HERO_ACCENTS drives the showcase screens. */
    accent: string;
}

export const ELEMENT_DEFINITIONS: Record<ElementId, ElementDefinition> = {
    ICE: {
        id: 'ICE',
        name: 'Ice',
        description: 'Every attack slows what it touches.',
        accent: '#38bdf8',
    },
    FIRE: {
        id: 'FIRE',
        name: 'Fire',
        description: 'Every attack sets its target alight.',
        accent: '#f97316',
    },
    LIGHTNING: {
        id: 'LIGHTNING',
        name: 'Lightning',
        description: 'Every attack arcs on to one enemy beside the target, for half this hero\'s damage.',
        accent: '#facc15',
    },
};

export const ELEMENTS: ElementId[] = ['ICE', 'FIRE', 'LIGHTNING'];

/**
 * RULE L1 — the element attaches to the ATTACK, not to the DAMAGE.
 *
 * Two heroes deal zero damage (Sunspot, Chardwall). Phrased as "adds an effect to the damage"
 * both of them fall outside the whole system; phrased as "adds an effect to the attack" a
 * Chardwall shove now lands a target that is both thrown and slowed, and the cell works.
 *
 * LIGHTNING returns nothing here on purpose: an arc is not a status, it is a second resolution
 * against a different tile, and only skillResolution can do that (see `chainDamageFor`).
 */
export const elementRider = (element: ElementId | undefined): SkillEffectDefinition[] => {
    if (element === 'ICE') return [{ type: 'APPLY_SLOW' }];
    if (element === 'FIRE') return [{ type: 'APPLY_BURN' }];
    return [];
};

/**
 * RULE L2 — a hero whose free attack cannot touch an enemy carries the element on the PAID one.
 *
 * Sunspot's basic attack is `SELF` (+25 Sun); it has no target to put an element on, so hers
 * rides Sun Burn instead. She is the only hero in the roster who lands here today, but the test
 * is written against the SHAPE of the skill rather than against her id, so a future support
 * hero built the same way is handled without touching this file.
 */
export const elementCarrier = (heroId: HeroId | undefined): 'BASIC' | 'SKILL' => {
    if (!heroId) return 'BASIC';
    const def = HERO_DEFINITIONS[heroId];
    if (!def) return 'BASIC';
    return def.basicAttack.rangeType === 'SELF' ? 'SKILL' : 'BASIC';
};

/** Does THIS skill carry the hero's element? Answers L2 for a single skill object. */
export const skillCarriesElement = (skill: Skill, unit: Unit): boolean => {
    if (!unit.element || !unit.heroId) return false;
    // SEVERED: the Blightlord has taken this hero's element for the rest of the fight. Cut
    // here rather than at each rider site, because this function is already the single gate
    // both the resolution AND the targeting overlay ask — so the theft shows up on the card
    // before the click, exactly like the element itself does.
    if (unit.statusEffects?.includes('SEVERED')) return false;
    const def = HERO_DEFINITIONS[unit.heroId];
    if (!def) return false;
    const carrier = elementCarrier(unit.heroId);
    const target = carrier === 'BASIC' ? def.basicAttack : def.heroSkill;
    return skill.id === target.id;
};

/**
 * RULE L3 — how hard the lightning arc hits: HALF THE HERO'S DAMAGE STAT, rounded down.
 *
 * Anchoring to the hero and not to the skill is the whole rule, and it defuses three traps at
 * once. Maw's Devour is `DAMAGE 999`; read off the skill, the arc would carry 499 into the next
 * tile — which is the Melon-splash bug wearing a different hat. Read off the hero, Maw is
 * damage 2 and the arc carries 1.
 *
 * There is NO minimum. A 0- or 1-damage hero arcs for nothing, and that is deliberate: a floor
 * of 1 would quietly hand Chardwall damage and break the one thing that makes him himself. His
 * arc still carries the SHOVE (L1), so his cell is a shove that hits two bodies — which turns
 * out to be the best cell he has.
 */
export const chainDamageFor = (unit: Unit): number => Math.max(0, Math.floor((unit.damage ?? 0) / 2));

/** The four tiles a lightning arc may jump to from the tile it struck. */
export const CHAIN_OFFSETS = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];

/**
 * ONE HOP OF A LIGHTNING ARC. Everything in the game that arcs, arcs through here.
 *
 * It was written twice before it was written once — the hero's arc in skillResolution and the
 * retaliation arc in turnManager are the same fourteen lines with different variable names —
 * and the next enemy that chains would have made three. Three copies of a rule is three
 * chances to reintroduce the same bug on a different door.
 *
 * IT RETURNS BODIES AND NOTHING ELSE. No damage, no actions, no mutation, and that is the
 * whole defence rather than tidiness. The Melon-splash bug happened because a second
 * resolution INHERITED the first one's authored number — Devour's `DAMAGE 999` arcing onward
 * for 499 — so a walk that has never heard of a damage number cannot pass one on. Every caller
 * states what its own hop is worth: the element asks `chainDamageFor` (half the HERO's stat,
 * never the skill's), and an enemy counts down from its own.
 *
 * ONE HOP, not the whole chain, and that is deliberate too. Hop two has to see the board hop
 * one left behind — a body the first arc killed or shoved is not there to be hit where it used
 * to be. A function that returned the entire chain would compute it against the pre-arc
 * simulation and quietly change that.
 *
 * `struck` is read AND written: tiles already hit are refused, and whatever is found is added.
 * Keyed by tile rather than by unit id because a tile is what both callers actually mean — one
 * body stands on one square — and because the seed is naturally a set of tiles (the attack's
 * own footprint, the caster's square).
 *
 * `branching` returns every fresh body around the frontier instead of the first one. Nothing
 * uses it yet; it is the difference between an element's single-path arc and an enemy that
 * lashes outward in rings, and it is one line here versus a second copy of the walk there.
 */
export const chainStep = (
    from: Position,
    unitAt: (p: Position) => Unit | undefined,
    isTarget: (u: Unit) => boolean,
    struck: Set<string>,
    opts: { branching?: boolean } = {},
): Unit[] => {
    const found: Unit[] = [];
    for (const offset of CHAIN_OFFSETS) {
        const p = { x: from.x + offset.x, y: from.y + offset.y };
        if (p.x < 0 || p.x >= 8 || p.y < 0 || p.y >= 8) continue;
        const key = `${p.x},${p.y}`;
        if (struck.has(key)) continue;
        const occupant = unitAt(p);
        if (!occupant || occupant.hp <= 0 || !isTarget(occupant)) continue;
        struck.add(key);
        found.push(occupant);
        // Fixed CHAIN_OFFSETS order, first match wins: perfect information means no dice
        // inside a resolution, and it is what lets a player aim an arc.
        if (!opts.branching) break;
    }
    return found;
};

// ---------------------------------------------------------------------------
// RESONANCE — what an all-one-element squad gets for committing
// ---------------------------------------------------------------------------

/**
 * Is the whole squad carrying the same element?
 *
 * Without this, "an all-ice team" is a colour scheme: three heroes each paying two max HP for
 * three separate riders, which is exactly what one ice hero plus two of something else would
 * have been. Resonance is the reason to commit — you give up mixed coverage AND six max HP, so
 * the payoff has to be a rule the mixed squad cannot reach at all.
 *
 * READ FROM THE CHOSEN SQUAD, NOT FROM WHO IS STILL ALIVE. Deriving it from the units on the
 * board looks equivalent and is not: a mixed squad that loses its odd hero out would suddenly
 * SATISFY the test, so the game would reward you mid-fight for having a hero die. Anchored to
 * `GameState.heroElements`, resonance is decided when the squad is picked and cannot change —
 * which also means the player can plan around it instead of watching it flicker.
 *
 * The size check is what stops a one-hero tutorial squad, or a partially-filled map, from
 * counting as unanimous. Every hero must have paid.
 */
/**
 * What each resonance actually does, in the player's words.
 *
 * Lives here, beside the rule it describes, for the same reason `ELEMENT_DEFINITIONS` does: the
 * screen that advertises a bonus and the code that grants it must not be able to drift apart.
 *
 * English source strings — i18n keys. No numbers in them: the wording has to survive a
 * rebalance, and the one number this system has already moved once (ELEMENT_HP_COST).
 */
export const RESONANCE_DESCRIPTIONS: Record<ElementId, string> = {
    ICE: 'Slow an enemy that is already slowed and it freezes solid.',
    FIRE: 'A burning enemy that dies sets the ground it stood on alight.',
    LIGHTNING: 'The arc jumps one enemy further.',
};

export const resonanceOf = (
    heroElements: Partial<Record<HeroId, ElementId>> | undefined,
    squadSize: number,
): ElementId | undefined => {
    if (!heroElements) return undefined;
    const chosen = Object.values(heroElements).filter(Boolean) as ElementId[];
    if (chosen.length < squadSize) return undefined;
    return chosen.every(e => e === chosen[0]) ? chosen[0] : undefined;
};

/**
 * Resonance AS THE BATTLE SEES IT: the squad's promise, minus the Blightlord's theft.
 *
 * `resonanceOf` answers "did this squad commit?" and is anchored to the chosen squad so a
 * mixed team can never earn resonance by losing its odd hero out. That anchoring had a blind
 * spot: SEVERED cuts a hero's element at `skillCarriesElement`, but resonance never looked at
 * the board — so the squad bonus kept firing off an element the boss had already stolen, and
 * the theft lost half its teeth in the one fight that uses it.
 *
 * The base rule stays untouched (and SquadSelect keeps calling it — before a battle there is
 * nothing to steal). This wrapper is for resolutions: a LIVING hero under SEVERED breaks the
 * unanimity, exactly as if their chip had never been paid. A severed hero who then FALLS
 * releases the hold — the two still standing are whole-element again, and a squad down a body
 * in the final fight has larger problems than an edge-case refund.
 */
export const activeResonance = (
    heroElements: Partial<Record<HeroId, ElementId>> | undefined,
    squadSize: number,
    units: Array<Pick<Unit, 'isEnemy' | 'heroId' | 'statusEffects'>>,
): ElementId | undefined => {
    const base = resonanceOf(heroElements, squadSize);
    if (!base) return undefined;
    const stolen = units.some(u => !u.isEnemy && u.heroId && u.statusEffects?.includes('SEVERED'));
    return stolen ? undefined : base;
};

// ---------------------------------------------------------------------------
// THE BLIGHTED HORDE — Stage III zombies carry the same three elements
// ---------------------------------------------------------------------------

/**
 * In the final act the blight has soaked into the horde itself, and a zombie can come up the
 * board already carrying an element. It obeys the HEROES' rules, not a parallel set: ICE slows
 * on hit (L1), FIRE ignites on hit (L1), LIGHTNING arcs one tile for half the body's damage
 * (L3, same `chainDamageFor`). One rulebook shared by both sides is the entire point — the
 * player already paid to learn these three sentences, so the late game can raise difficulty
 * without raising the reading load.
 *
 * Zombies pay no HP price for it. The heroes' ELEMENT_HP_COST exists because an element there
 * is a CHOICE on a persistent body; a zombie is a rolled body priced by the encounter budget,
 * and docking it 2 HP would just be a stealth nerf the player cannot see the reason for.
 */
export const ELEMENT_WORLDS: ReadonlySet<WorldType> = new Set<WorldType>(['NEON', 'RUIN', 'GRID']);

/** Roughly one zombie in three. High enough to shape a fight, low enough to stay legible. */
export const ENEMY_ELEMENT_CHANCE = 0.35;

/**
 * Roll an element for a freshly built zombie, or undefined for none.
 *
 * LIGHTNING is only dealt to bodies whose arc is worth something: `chainDamageFor` has no
 * minimum (that rule protects Chardwall and must not grow one), so on a damage-1 zombie the
 * arc carries 0 and the element would be a badge that does nothing — worse than absent,
 * because the player would read it and brace for a rule that never fires.
 *
 * Bosses never roll: each boss IS its own rulebook (BOSS_HOOKS), and an element stacked on
 * top would be a second rulebook on one body.
 */
export const rollEnemyElement = (damage: number): ElementId | undefined => {
    if (Math.random() >= ENEMY_ELEMENT_CHANCE) return undefined;
    const pool = ELEMENTS.filter(e => e !== 'LIGHTNING' || Math.floor(damage / 2) > 0);
    return pool[Math.floor(Math.random() * pool.length)];
};

/**
 * The status half of the horde's element, in `Intent.statusOnHit` form.
 *
 * Riding statusOnHit rather than a bespoke branch buys everything the field already does:
 * telegraphed a turn ahead on the target's tile, refused by the target's immunities in one
 * place, skipped on a fatal blow. LIGHTNING returns nothing here for the same reason
 * `elementRider` returns nothing for it — an arc is a second resolution, not a status, and
 * only the strike loop can perform one.
 */
export const enemyElementRider = (element: ElementId | undefined): StatusEffectType[] => {
    if (element === 'ICE') return ['SLOW'];
    if (element === 'FIRE') return ['BURN'];
    return [];
};
