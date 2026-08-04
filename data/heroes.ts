import { HeroDefinition, HeroId, UnitClass } from '../types';
import { HERO_ICONS, HERO_SPRITES } from '../utils/icons';

/**
 * The 5 heroes shipped in the first build (DESIGN.md section 7).
 *
 * Every hero has exactly two actions:
 *   - `basicAttack` — always free, so a hero is never stranded with 0 Sun
 *   - `heroSkill`   — costs Sun; this is where the per-turn decision lives
 *
 * Two hero skills deliberately reuse skill ids that already have special handling
 * in the resolution code: 'burrow_strike' (instant kill + digesting) and
 * 'ignite' (creates a FIRE tile).
 */
export const HERO_DEFINITIONS: Record<HeroId, HeroDefinition> = {
    GREEN_SHADOW: {
        id: 'GREEN_SHADOW',
        name: 'Shadeleaf',
        baseClass: UnitClass.PEASHOOTER,
        maxHp: 3, damage: 2, moveRange: 3,
        imgUrl: HERO_ICONS.GREEN_SHADOW, boardImgUrl: HERO_SPRITES.GREEN_SHADOW,
        movementType: 'WALKING', immunities: [],
        basicAttack: {
            id: 'gs_pea', name: 'Pea Shot',
            description: 'Fires a pea down the row. Free.',
            rangeType: 'LINE', rangeValue: 8,
            effects: [{ type: 'DAMAGE', value: 2 }],
        },
        heroSkill: {
            id: 'gs_precision_blast', name: 'Precision Blast',
            // Was 4 damage across the whole row — with pierce that deleted entire lanes.
            description: 'A focused shot that pierces everything within 4 tiles.',
            rangeType: 'LINE', rangeValue: 4, sunCost: 50,
            effects: [{ type: 'DAMAGE', value: 3 }, { type: 'PIERCE_ATTACK' }],
        },
    },

    WALL_KNIGHT: {
        id: 'WALL_KNIGHT',
        name: 'Ironhusk',
        baseClass: UnitClass.WALLNUT,
        maxHp: 5, damage: 1, moveRange: 2,
        imgUrl: HERO_ICONS.WALL_KNIGHT, boardImgUrl: HERO_SPRITES.WALL_KNIGHT,
        movementType: 'WALKING', immunities: [],
        basicAttack: {
            id: 'wk_bash', name: 'Shield Bash',
            description: 'Shoves an adjacent enemy back. Chip damage only — the shove is the point. Free.',
            rangeType: 'MELEE', rangeValue: 1,
            effects: [{ type: 'DAMAGE', value: 1 }, { type: 'PUSH', value: 1 }],
        },
        heroSkill: {
            id: 'wk_roll', name: 'Rolling Charge',
            description: 'Roll down a straight line and slam the first enemy hit: 2 damage and a push.',
            rangeType: 'DASH', rangeValue: 3, sunCost: 25,
            effects: [{ type: 'DAMAGE', value: 2 }, { type: 'PUSH', value: 1 }],
        },
    },

    SOLAR_FLARE: {
        id: 'SOLAR_FLARE',
        name: 'Sunspot',
        baseClass: UnitClass.SUNFLOWER,
        maxHp: 3, damage: 0, moveRange: 2,
        imgUrl: HERO_ICONS.SOLAR_FLARE, boardImgUrl: HERO_SPRITES.SOLAR_FLARE,
        movementType: 'WALKING', immunities: ['BURN'],
        // Harvest is free but consumes her action — that is the whole cost.
        // She cannot attack at all, which is what makes her an escort problem.
        basicAttack: {
            id: 'sf_harvest', name: 'Harvest',
            description: 'Spend the turn gathering light. Gain 25 Sun. Free.',
            rangeType: 'SELF', rangeValue: 0,
            effects: [{ type: 'RESOURCE_GAIN', value: 25, resource: 'SUN' }],
        },
        heroSkill: {
            id: 'sf_sunburn', name: 'Sun Burn',
            description: 'Scorch a nearby tile for heavy damage.',
            rangeType: 'LOB', rangeValue: 3, sunCost: 50,
            effects: [{ type: 'DAMAGE', value: 4 }],
        },
    },

    CHOMPZILLA: {
        id: 'CHOMPZILLA',
        name: 'Maw',
        baseClass: UnitClass.CHOMPER,
        maxHp: 4, damage: 2, moveRange: 3,
        imgUrl: HERO_ICONS.CHOMPZILLA, boardImgUrl: HERO_SPRITES.CHOMPZILLA,
        movementType: 'WALKING', immunities: [],
        basicAttack: {
            id: 'cz_bite', name: 'Bite',
            description: 'A quick chomp on an adjacent enemy. Free.',
            rangeType: 'MELEE', rangeValue: 1,
            effects: [{ type: 'DAMAGE', value: 2 }],
        },
        // Reuses the existing 'burrow_strike' handling: instant kill, cannot eat
        // Massive units, and leaves the hero digesting for 2 turns.
        heroSkill: {
            id: 'burrow_strike', name: 'Devour',
            description: 'Swallow an adjacent non-Massive enemy whole. Digests for 2 turns.',
            rangeType: 'MELEE', rangeValue: 1, sunCost: 100,
            effects: [{ type: 'DAMAGE', value: 999 }],
        },
    },

    COLD_SNAP: {
        id: 'COLD_SNAP',
        name: 'Frostpod',
        baseClass: UnitClass.SNOW_PEA,
        maxHp: 3, damage: 1, moveRange: 3,
        imgUrl: HERO_ICONS.COLD_SNAP, boardImgUrl: HERO_SPRITES.COLD_SNAP,
        movementType: 'WALKING', immunities: ['FREEZE'],
        // Low damage on purpose: her job is to cost a zombie ground, not to kill it.
        // She only ever SLOWS — a full freeze is what the Snow Pea fusion (Blizzard) unlocks.
        basicAttack: {
            id: 'cs_ice_shot', name: 'Ice Shot',
            description: 'A chilled pea down the row. Slows the target. Free.',
            rangeType: 'LINE', rangeValue: 6,
            effects: [{ type: 'DAMAGE', value: 1 }, { type: 'APPLY_SLOW' }],
        },
        heroSkill: {
            id: 'cs_deep_chill', name: 'Deep Chill',
            description: 'A piercing shot that slows everything in the row.',
            rangeType: 'LINE', rangeValue: 6, sunCost: 50,
            effects: [{ type: 'DAMAGE', value: 2 }, { type: 'APPLY_SLOW' }, { type: 'PIERCE_ATTACK' }],
        },
    },

    /**
     * Cobb — the artillery. She is NOT a mid-point between the two peas, even though her
     * numbers sit between theirs: her identity is the trajectory.
     *
     * Every other attack in the game is a LINE, and a LINE stops at the first unit it meets,
     * friend or foe (utils/gameLogic.ts, getValidTargets). The brain rule makes you park
     * Ironhusk in a corridor, and Ironhusk then blindfolds whoever stands behind her. The
     * Catapult Zombie has had the answer to that since day one (`basketball_lob`); the plants
     * have not. Cobb is that answer.
     *
     * Range 2 and move 2 are what the arc costs, and the free shot is the half that had to
     * pay. Damage is not where she was strong — 2 is what Shadeleaf does. TARGET AVAILABILITY
     * was: a LINE reaches only the first unit in four directions and dies on a friendly body,
     * so Shadeleaf routinely has one legal target or none, while a LOB 3 covered 24 tiles
     * regardless of what stood in between and essentially always had one. In a game where
     * roughly four fifths of all hero actions are basic attacks, that gap outweighed any
     * damage number. At LOB 2 she has to stand just behind the line she is shooting over,
     * on 4 HP — which is also what finally makes Cob Bunker worth a slot.
     *
     * Butter Splat keeps the full reach: the paid skill is allowed to be the long one.
     *
     * Butter is single-target and paid, and that is load-bearing: Frostpod's entire ceiling
     * is `UPGRADE_SLOW_TO_FREEZE` (Blizzard), which turns EVERY one of her attacks into a stun
     * for free, forever. One 50-Sun pin per turn does not compete with that. Cobb must never
     * be handed ON_HIT_FREEZE by any fusion — see data/fusionRecipes.ts.
     */
    KERNEL_PULT: {
        id: 'KERNEL_PULT',
        name: 'Cobb',
        baseClass: UnitClass.KERNEL_PULT,
        maxHp: 4, damage: 2, moveRange: 2,
        imgUrl: HERO_ICONS.KERNEL_PULT, boardImgUrl: HERO_SPRITES.KERNEL_PULT,
        movementType: 'WALKING', immunities: [],
        basicAttack: {
            id: 'kp_corn_toss', name: 'Corn Kernel',
            description: 'Lobs a kernel in an arc — straight over anything standing in the way. Free.',
            rangeType: 'LOB', rangeValue: 2,
            effects: [{ type: 'DAMAGE', value: 2 }],
        },
        heroSkill: {
            id: 'kp_butter_splat', name: 'Butter Splat',
            description: 'Butters one target: it loses its entire next turn.',
            rangeType: 'LOB', rangeValue: 3, sunCost: 50,
            effects: [{ type: 'DAMAGE', value: 1 }, { type: 'STUN' }],
        },
    },
};

/**
 * Heroes available in a brand-new save.
 *
 * These three and no more: they are the trio in the opening comic and the only speakers in
 * the tutorial, so the game already introduces them as *the* squad. The other two used to be
 * in this list too, which meant nothing was ever locked and the whole unlock system was
 * dead code. They are now boss rewards — see `data/unlocks.ts`.
 */
export const STARTING_HEROES: HeroId[] = [
    'GREEN_SHADOW',
    'WALL_KNIGHT',
    'SOLAR_FLARE',
];
