import { MaterialDefinition, MaterialId, UnitClass } from '../types';
import { ICONS, MATERIAL_SPRITES } from '../utils/icons';

/**
 * The fusion materials are the SAME five plants the heroes are built from.
 *
 * That symmetry is the point: five plants x five heroes gives 25 hand-authored recipes
 * (data/fusionRecipes.ts) from five sprites. What a fusion does depends on the PAIR, not on
 * the material alone — Peashooter grafted onto Sunspot gives her the attack she lacks,
 * while Peashooter grafted onto Shadeleaf just makes her shoot twice.
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

    MAT_SNOW_PEA: {
        id: 'MAT_SNOW_PEA',
        name: 'Snow Pea',
        description: 'Cold. Buys a turn back from whatever it touches.',
        coinCost: 175,
        imgUrl: MATERIAL_SPRITES.MAT_SNOW_PEA,
        effect: { type: 'ON_HIT_FREEZE' },
        benchClass: UnitClass.SNOW_PEA,
        benchStats: { maxHp: 3, damage: 2, moveRange: 3 },
    },
};

/**
 * All five materials are available from the start. What is gated is the RECIPE — which
 * (hero, material) pairings you have learned — because that is where the depth actually is:
 * five plants, twenty-five authored results.
 *
 * Gating the materials instead was the first attempt and it was worse in two ways: the pool
 * was only five deep so it emptied in about three fights, and a locked material made a
 * plant on the bench simply unusable rather than making a *combination* something to chase.
 */
export const STARTING_MATERIALS: MaterialId[] = [
    'MAT_SUNFLOWER',
    'MAT_PEASHOOTER',
    'MAT_CHOMPER',
    'MAT_WALLNUT',
    'MAT_SNOW_PEA',
    // Buyable from the start like the rest: what is gated is the RECIPE, so the corn arm
    // starts paying off for the five existing heroes long before Cobb herself is unlocked.
    'MAT_CORN',
];

export const getMaterial = (id: MaterialId): MaterialDefinition => MATERIAL_DEFINITIONS[id];
