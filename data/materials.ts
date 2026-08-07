import { MaterialDefinition, MaterialId, UnitClass } from '../types';
import { ICONS, MATERIAL_SPRITES } from '../utils/icons';

/**
 * The fusion materials are the SAME plants the heroes are built from — one per hero.
 *
 * That symmetry is the point: ten plants x ten heroes gives a 10x10 grid of hand-authored
 * recipes (data/fusionRecipes.ts) out of ten sprites. What a fusion does depends on the
 * PAIR, not on the material alone — Seed Gun grafted onto Sunbloom gives her the attack she
 * lacks, while Seed Gun grafted onto Peaburst just makes her shoot twice.
 *
 * It also forces a real choice every time one is bought: the same plant can go on the bench
 * as a spare body or be burned into a hero. Pick one, lose the other.
 *
 * Prices keep the PvZ sun scale already used elsewhere, paid in Coin.
 */
export const MATERIAL_DEFINITIONS: Record<MaterialId, MaterialDefinition> = {
    MAT_SUNBLOOM: {
        id: 'MAT_SUNBLOOM',
        name: 'Sol Battery',
        description: 'Sunlight. What it grants depends on who absorbs it.',
        coinCost: 50,
        imgUrl: MATERIAL_SPRITES.MAT_SUNBLOOM,
        // Kept for the generic UI; the real effect is looked up per hero.
        effect: { type: 'SUN_PER_TURN', value: 25 },
        benchClass: UnitClass.SOL_BATTERY,
        benchStats: { maxHp: 2, damage: 0, moveRange: 3 },
    },

    MAT_PEABURST: {
        id: 'MAT_PEABURST',
        name: 'Seed Gun',
        description: 'A firing mechanism. Grants or multiplies ranged attacks.',
        coinCost: 100,
        imgUrl: MATERIAL_SPRITES.MAT_PEABURST,
        effect: { type: 'DOUBLE_ATTACK', value: 1 },
        benchClass: UnitClass.SEED_GUN,
        benchStats: { maxHp: 2, damage: 2, moveRange: 3 },
    },

    MAT_SNAPMAW: {
        id: 'MAT_SNAPMAW',
        name: 'Steel Jaws',
        description: 'Jaws. Bites back, swallows faster, chews through downtime.',
        coinCost: 150,
        imgUrl: MATERIAL_SPRITES.MAT_SNAPMAW,
        // Fallback only (a bench plant, or a hero the matrix does not know). Set to the
        // column's real axis after the remap: the jaws leave a WOUND, they do not bite back.
        effect: { type: 'BLEED_ON_HIT' },
        benchClass: UnitClass.STEEL_JAWS,
        benchStats: { maxHp: 3, damage: 2, moveRange: 3 },
    },

    MAT_IRONHUSK: {
        id: 'MAT_IRONHUSK',
        name: 'Armor Plate',
        description: 'Shell. Turns whoever wears it into something zombies struggle to remove.',
        coinCost: 50,
        imgUrl: MATERIAL_SPRITES.MAT_IRONHUSK,
        effect: { type: 'BONUS_HP', value: 3 },
        benchClass: UnitClass.ARMOR_PLATE,
        benchStats: { maxHp: 4, damage: 1, moveRange: 2 },
    },

    /**
     * The catapult arm. Its axis is the TRAJECTORY, which nothing else in the pool touches:
     * a straight shot becomes a lobbed one that ignores whatever is standing in between, at
     * half the reach. On a melee hero the arc means nothing, so those pairings buy something
     * else entirely — the matrix is authored per pair anyway.
     */
    MAT_CORNOVA: {
        id: 'MAT_CORNOVA',
        name: 'Corn Mortar',
        description: 'A throwing arm. What it launches stops caring what is in the way.',
        coinCost: 125,
        imgUrl: MATERIAL_SPRITES.MAT_CORNOVA,
        effect: { type: 'ARC_ATTACK' },
        benchClass: UnitClass.CORN_MORTAR,
        benchStats: { maxHp: 4, damage: 1, moveRange: 3 },
    },

    // MAT_SNOW_PEA is retired (PLAN-hero-zephyr §9): it was Frostpod's plant, Frostpod is
    // retired, and the cold belongs to the ICE element. Nine heroes, nine gears — the Snow
    // Pea ITEM (data/items.ts) is a different thing and stays.

    /**
     * Rotors. Reedwing's two traits per the two-item gear rule (PLAN-hero-zephyr §4): speed
     * for the body (MOVE_BONUS), or her Smoke Pod's dust grafted onto a paid skill
     * (SKILL_DISARM) — each recipe picks whichever fits the hero. The only material whose
     * axis is MOVEMENT, which no fusion had ever touched before.
     */
    MAT_REEDWING: {
        id: 'MAT_REEDWING',
        name: 'Rotor Wing',
        description: 'Rotors. Speed for the legs it is grafted onto, or dust for the skill.',
        coinCost: 100,
        imgUrl: MATERIAL_SPRITES.MAT_REEDWING,
        effect: { type: 'MOVE_BONUS', value: 1 },
        benchClass: UnitClass.ROTOR_WING,
        benchStats: { maxHp: 2, damage: 2, moveRange: 3 },
    },

    MAT_THORNSHELL: {
        id: 'MAT_THORNSHELL',
        name: 'Spike Armor',
        description: 'Barbed husk. Turns being hit into a way of hitting back.',
        coinCost: 150,
        imgUrl: MATERIAL_SPRITES.MAT_THORNSHELL,
        // 1, matching the RETALIATION RULE in data/fusionRecipes.ts: the durian pays back
        // one on everybody but the durian.
        effect: { type: 'RETALIATE_DAMAGE', value: 1 },
        benchClass: UnitClass.SPIKE_ARMOR,
        benchStats: { maxHp: 5, damage: 1, moveRange: 2 },
    },

    /**
     * The stem. Its axis is DISTANCE on a shove, and distance is what decides whether a push
     * merely relocates a zombie or drops it in water — so this one is worth most on maps that
     * have somewhere bad to land.
     */
    MAT_CHARDSLAM: {
        id: 'MAT_CHARDSLAM',
        name: 'Spring Arm',
        description: 'A swinging stem. Whatever gets shoved, goes further.',
        coinCost: 125,
        imgUrl: MATERIAL_SPRITES.MAT_CHARDSLAM,
        effect: { type: 'PUSH_DISTANCE', value: 1 },
        benchClass: UnitClass.SPRING_ARM,
        benchStats: { maxHp: 3, damage: 0, moveRange: 3 },
    },

    MAT_GOURDWARD: {
        id: 'MAT_GOURDWARD',
        name: 'Bunker Shell',
        description: 'Shell to spare. Damage that never lands is health carried into the next fight.',
        coinCost: 150,
        imgUrl: MATERIAL_SPRITES.MAT_GOURDWARD,
        effect: { type: 'SHIELD_ON_KILL', value: 1 },
        benchClass: UnitClass.BUNKER_SHELL,
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
 * the heroes you already own long before Reedwing and company are unlocked.
 */
export const STARTING_MATERIALS: MaterialId[] = [
    'MAT_SUNBLOOM',
    'MAT_PEABURST',
    'MAT_SNAPMAW',
    'MAT_IRONHUSK',
    'MAT_CORNOVA',
    'MAT_REEDWING',
    'MAT_THORNSHELL',
    'MAT_CHARDSLAM',
    'MAT_GOURDWARD',
];

export const getMaterial = (id: MaterialId): MaterialDefinition => MATERIAL_DEFINITIONS[id];
