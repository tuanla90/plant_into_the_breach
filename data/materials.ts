import { MaterialDefinition, MaterialId, UnitClass } from '../types';
import { ICONS, MATERIAL_SPRITES } from '../utils/icons';

/**
 * The fusion materials are the SAME plants the heroes are built from — one per hero.
 *
 * That symmetry is the point: ten plants x ten heroes gives a 10x10 grid of hand-authored
 * recipes (data/fusionRecipes.ts) out of ten sprites. What a fusion does depends on the
 * PAIR, not on the material alone — Peashooter grafted onto Sunspot gives her the attack she
 * lacks, while Peashooter grafted onto Shadeleaf just makes her shoot twice.
 *
 * It also forces a real choice every time one is bought: the same plant can go on the bench
 * as a spare body or be burned into a hero. Pick one, lose the other.
 *
 * Prices keep the PvZ sun scale already used elsewhere, paid in Coin.
 */
export const MATERIAL_DEFINITIONS: Record<MaterialId, MaterialDefinition> = {
    MAT_SUNFLOWER: {
        id: 'MAT_SUNFLOWER',
        name: 'Sunflower',
        description: 'Sunlight. What it grants depends on who absorbs it.',
        coinCost: 50,
        imgUrl: MATERIAL_SPRITES.MAT_SUNFLOWER,
        // Kept for the generic UI; the real effect is looked up per hero.
        effect: { type: 'SUN_PER_TURN', value: 25 },
        benchClass: UnitClass.SUNFLOWER,
        benchStats: { maxHp: 2, damage: 0, moveRange: 3 },
    },

    MAT_PEASHOOTER: {
        id: 'MAT_PEASHOOTER',
        name: 'Peashooter',
        description: 'A firing mechanism. Grants or multiplies ranged attacks.',
        coinCost: 100,
        imgUrl: MATERIAL_SPRITES.MAT_PEASHOOTER,
        effect: { type: 'DOUBLE_ATTACK', value: 1 },
        benchClass: UnitClass.PEASHOOTER,
        benchStats: { maxHp: 2, damage: 2, moveRange: 3 },
    },

    MAT_CHOMPER: {
        id: 'MAT_CHOMPER',
        name: 'Chomper',
        description: 'Jaws. Bites back, swallows faster, chews through downtime.',
        coinCost: 150,
        imgUrl: MATERIAL_SPRITES.MAT_CHOMPER,
        effect: { type: 'RETALIATE_DAMAGE', value: 2 },
        benchClass: UnitClass.CHOMPER,
        benchStats: { maxHp: 3, damage: 2, moveRange: 3 },
    },

    MAT_WALLNUT: {
        id: 'MAT_WALLNUT',
        name: 'Wall-nut',
        description: 'Shell. Turns whoever wears it into something zombies struggle to remove.',
        coinCost: 50,
        imgUrl: MATERIAL_SPRITES.MAT_WALLNUT,
        effect: { type: 'BONUS_HP', value: 3 },
        benchClass: UnitClass.WALLNUT,
        benchStats: { maxHp: 4, damage: 1, moveRange: 2 },
    },

    /**
     * The catapult arm. Its axis is the TRAJECTORY, which nothing else in the pool touches:
     * a straight shot becomes a lobbed one that ignores whatever is standing in between, at
     * half the reach. On a melee hero the arc means nothing, so those pairings buy something
     * else entirely — the matrix is authored per pair anyway.
     */
    MAT_CORN: {
        id: 'MAT_CORN',
        name: 'Kernel-pult',
        description: 'A throwing arm. What it launches stops caring what is in the way.',
        coinCost: 125,
        imgUrl: MATERIAL_SPRITES.MAT_CORN,
        effect: { type: 'ARC_ATTACK' },
        benchClass: UnitClass.KERNEL_PULT,
        benchStats: { maxHp: 4, damage: 1, moveRange: 3 },
    },

    // MAT_SNOW_PEA is retired (PLAN-hero-zephyr §9): it was Frostpod's plant, Frostpod is
    // retired, and the cold belongs to the ICE element. Nine heroes, nine gears — the Snow
    // Pea ITEM (data/items.ts) is a different thing and stays.

    /**
     * Rotors. Zephyr's two traits per the two-item gear rule (PLAN-hero-zephyr §4): speed
     * for the body (MOVE_BONUS), or her Smoke Pod's dust grafted onto a paid skill
     * (SKILL_DISARM) — each recipe picks whichever fits the hero. The only material whose
     * axis is MOVEMENT, which no fusion had ever touched before.
     */
    MAT_CATTAIL: {
        id: 'MAT_CATTAIL',
        name: 'Cattail',
        description: 'Rotors. Speed for the legs it is grafted onto, or dust for the skill.',
        coinCost: 100,
        imgUrl: MATERIAL_SPRITES.MAT_CATTAIL,
        effect: { type: 'MOVE_BONUS', value: 1 },
        benchClass: UnitClass.CATTAIL,
        benchStats: { maxHp: 2, damage: 2, moveRange: 3 },
    },

    MAT_ENDURIAN: {
        id: 'MAT_ENDURIAN',
        name: 'Endurian',
        description: 'Barbed husk. Turns being hit into a way of hitting back.',
        coinCost: 150,
        imgUrl: MATERIAL_SPRITES.MAT_ENDURIAN,
        effect: { type: 'RETALIATE_DAMAGE', value: 2 },
        benchClass: UnitClass.ENDURIAN,
        benchStats: { maxHp: 5, damage: 1, moveRange: 2 },
    },

    /**
     * The stem. Its axis is DISTANCE on a shove, and distance is what decides whether a push
     * merely relocates a zombie or drops it in water — so this one is worth most on maps that
     * have somewhere bad to land.
     */
    MAT_CHARD: {
        id: 'MAT_CHARD',
        name: 'Chard Guard',
        description: 'A swinging stem. Whatever gets shoved, goes further.',
        coinCost: 125,
        imgUrl: MATERIAL_SPRITES.MAT_CHARD,
        effect: { type: 'PUSH_DISTANCE', value: 1 },
        benchClass: UnitClass.CHARD_GUARD,
        benchStats: { maxHp: 3, damage: 0, moveRange: 3 },
    },

    MAT_PUMPKIN: {
        id: 'MAT_PUMPKIN',
        name: 'Pumpkin',
        description: 'Shell to spare. Damage that never lands is health carried into the next fight.',
        coinCost: 150,
        imgUrl: MATERIAL_SPRITES.MAT_PUMPKIN,
        effect: { type: 'SHIELD_ON_KILL', value: 1 },
        benchClass: UnitClass.PUMPKIN,
        benchStats: { maxHp: 4, damage: 0, moveRange: 2 },
    },
};

/**
 * Every material is available from the start. What is gated is the RECIPE — which
 * (hero, material) pairings you have learned — because that is where the depth actually is:
 * nine plants, eighty-one authored results.
 *
 * Gating the materials instead was the first attempt and it was worse in two ways: the pool
 * was only a handful deep so it emptied in about three fights, and a locked material made a
 * plant on the bench simply unusable rather than making a *combination* something to chase.
 *
 * This is also why a material ships before its hero does: the newest plants pay off on
 * the heroes you already own long before Zephyr and company are unlocked.
 */
export const STARTING_MATERIALS: MaterialId[] = [
    'MAT_SUNFLOWER',
    'MAT_PEASHOOTER',
    'MAT_CHOMPER',
    'MAT_WALLNUT',
    'MAT_CORN',
    'MAT_CATTAIL',
    'MAT_ENDURIAN',
    'MAT_CHARD',
    'MAT_PUMPKIN',
];

export const getMaterial = (id: MaterialId): MaterialDefinition => MATERIAL_DEFINITIONS[id];
