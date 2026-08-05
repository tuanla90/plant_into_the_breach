
import { UnitClass, UnitDefinition } from '../types';
import { ICONS } from '../utils/icons';

// Using Partial because this only contains Plants, not ALL UnitClasses
export const PLANT_DEFINITIONS: Partial<Record<UnitClass, UnitDefinition>> = {
    [UnitClass.PEASHOOTER]: {
        class: UnitClass.PEASHOOTER, name: 'Peashooter', maxHp: 3, damage: 2, moveRange: 3,
        imgUrl: ICONS.PEASHOOTER,
        movementType: 'WALKING', immunities: [],
        cost: 100,
        maxStats: { hp: 6, dmg: 4, move: 5, cdr: 2 },
        upgradeCosts: { hp: 50, dmg: 100, move: 75, cdr: 150 },
        evolvesTo: [UnitClass.REPEATER, UnitClass.SNOW_PEA],
        evolutionCost: 150
    },
    [UnitClass.SNOW_PEA]: {
        class: UnitClass.SNOW_PEA, name: 'Snow Pea', maxHp: 4, damage: 2, moveRange: 3,
        imgUrl: ICONS.SNOW_PEA,
        movementType: 'WALKING', immunities: ['FREEZE'],
        cost: 175,
        maxStats: { hp: 7, dmg: 5, move: 5, cdr: 2 },
        upgradeCosts: { hp: 75, dmg: 125, move: 100, cdr: 200 }
    },
    [UnitClass.REPEATER]: {
        class: UnitClass.REPEATER, name: 'Repeater', maxHp: 5, damage: 4, moveRange: 3,
        imgUrl: ICONS.REPEATER,
        movementType: 'WALKING', immunities: [],
        cost: 200,
        maxStats: { hp: 8, dmg: 6, move: 5, cdr: 2 },
        upgradeCosts: { hp: 75, dmg: 150, move: 100, cdr: 200 }
    },
    [UnitClass.BLOOMERANG]: {
        class: UnitClass.BLOOMERANG, name: 'Bloomerang', maxHp: 4, damage: 2, moveRange: 3,
        imgUrl: ICONS.BLOOMERANG,
        movementType: 'WALKING', immunities: [],
        cost: 125,
        maxStats: { hp: 7, dmg: 5, move: 5, cdr: 2 },
        upgradeCosts: { hp: 75, dmg: 125, move: 100, cdr: 150 }
    },
    [UnitClass.CACTUS]: {
        class: UnitClass.CACTUS, name: 'Cactus', maxHp: 4, damage: 3, moveRange: 3,
        imgUrl: ICONS.CACTUS,
        movementType: 'WALKING', immunities: [],
        cost: 150,
        maxStats: { hp: 7, dmg: 6, move: 5, cdr: 2 },
        upgradeCosts: { hp: 60, dmg: 120, move: 100, cdr: 150 }
    },
    [UnitClass.MELON_PULT]: {
        class: UnitClass.MELON_PULT, name: 'Melon-pult', maxHp: 5, damage: 4, moveRange: 2,
        imgUrl: ICONS.MELON_PULT,
        movementType: 'WALKING', immunities: [],
        cost: 225,
        maxStats: { hp: 9, dmg: 7, move: 4, cdr: 2 },
        upgradeCosts: { hp: 80, dmg: 200, move: 120, cdr: 250 }
    },
    [UnitClass.CABBAGE_PULT]: {
        class: UnitClass.CABBAGE_PULT, name: 'Cabbage-pult', maxHp: 4, damage: 2, moveRange: 3,
        imgUrl: ICONS.CABBAGE_PULT,
        movementType: 'WALKING', immunities: [],
        cost: 100,
        maxStats: { hp: 7, dmg: 5, move: 5, cdr: 2 },
        upgradeCosts: { hp: 60, dmg: 110, move: 90, cdr: 150 }
    },
    [UnitClass.MAGNET_SHROOM]: {
        class: UnitClass.MAGNET_SHROOM, name: 'Magnet-shroom', maxHp: 4, damage: 0, moveRange: 3,
        imgUrl: ICONS.MAGNET_SHROOM,
        movementType: 'WALKING', immunities: [],
        cost: 75,
        maxStats: { hp: 7, dmg: 0, move: 5, cdr: 2 },
        upgradeCosts: { hp: 50, dmg: 0, move: 75, cdr: 150 }
    },
    [UnitClass.SUN_SHROOM]: { 
        class: UnitClass.SUN_SHROOM, name: 'Sun-shroom', maxHp: 2, damage: 0, moveRange: 3,
        imgUrl: ICONS.SUN_SHROOM,
        movementType: 'WALKING', immunities: [],
        cost: 25,
        maxStats: { hp: 5, dmg: 0, move: 5, cdr: 2 },
        upgradeCosts: { hp: 25, dmg: 0, move: 50, cdr: 150 }
    },
    [UnitClass.SCAREDY_SHROOM]: { 
        class: UnitClass.SCAREDY_SHROOM, name: 'Scaredy-shroom', maxHp: 2, damage: 3, moveRange: 3,
        imgUrl: ICONS.SCAREDY_SHROOM,
        movementType: 'WALKING', immunities: [],
        cost: 25,
        maxStats: { hp: 5, dmg: 5, move: 5, cdr: 2 },
        upgradeCosts: { hp: 40, dmg: 100, move: 75, cdr: 150 }
    },
    /**
     * THE GEAR CRATE (ESCORT_GEAR).
     *
     * 8 HP and nothing else: no damage, no move, no skills. It is not meant to survive on its
     * own — 8 is roughly three ordinary bites, which is how long the squad has to get across
     * the board and stand in front of it. Making it tougher would turn the objective into
     * "ignore it and win"; making it thinner would turn it into "lose on turn two".
     *
     * `PUSH` immunity because it is a crate, and because a shove that slid the objective into
     * the sea would be a loss the player could inflict on themselves by accident with their
     * own hero.
     */
    [UnitClass.GEAR_CRATE]: {
        class: UnitClass.GEAR_CRATE, name: 'Gear Crate', maxHp: 8, damage: 0, moveRange: 0,
        imgUrl: ICONS.GEAR_CRATE,
        movementType: 'WALKING', immunities: ['PUSH'],
        cost: 0,
        maxStats: { hp: 8, dmg: 0, move: 0, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 },
    },
    [UnitClass.WALLNUT]: {
        class: UnitClass.WALLNUT, name: 'Wall-nut', maxHp: 6, damage: 2, moveRange: 2,
        imgUrl: ICONS.WALLNUT,
        movementType: 'WALKING', immunities: ['PUSH'],
        cost: 50,
        maxStats: { hp: 10, dmg: 4, move: 4, cdr: 2 },
        upgradeCosts: { hp: 50, dmg: 100, move: 100, cdr: 150 },
        evolvesTo: [UnitClass.TALL_NUT, UnitClass.ENDURIAN],
        evolutionCost: 150
    },
    [UnitClass.TALL_NUT]: {
        class: UnitClass.TALL_NUT, name: 'Tall-nut', maxHp: 12, damage: 2, moveRange: 1,
        imgUrl: ICONS.TALL_NUT, 
        movementType: 'WALKING', immunities: ['PUSH'],
        cost: 125,
        maxStats: { hp: 20, dmg: 4, move: 3, cdr: 2 },
        upgradeCosts: { hp: 80, dmg: 120, move: 120, cdr: 200 }
    },
    [UnitClass.ENDURIAN]: {
        class: UnitClass.ENDURIAN, name: 'Endurian', maxHp: 8, damage: 2, moveRange: 1,
        imgUrl: ICONS.ENDURIAN, 
        movementType: 'WALKING', immunities: ['PUSH'],
        cost: 125,
        maxStats: { hp: 15, dmg: 4, move: 3, cdr: 2 },
        upgradeCosts: { hp: 80, dmg: 120, move: 100, cdr: 200 }
    },
    [UnitClass.SWEET_POTATO]: {
        class: UnitClass.SWEET_POTATO, name: 'Sweet Potato', maxHp: 8, damage: 0, moveRange: 2,
        imgUrl: ICONS.SWEET_POTATO, 
        movementType: 'WALKING', immunities: [],
        cost: 75,
        maxStats: { hp: 12, dmg: 0, move: 4, cdr: 2 },
        upgradeCosts: { hp: 60, dmg: 0, move: 80, cdr: 150 }
    },
    [UnitClass.IRON_NUT]: {
        class: UnitClass.IRON_NUT, name: 'Iron-nut', maxHp: 10, damage: 3, moveRange: 2,
        imgUrl: ICONS.IRON_NUT, 
        movementType: 'WALKING', immunities: ['PUSH', 'BURN'],
        cost: 150,
        maxStats: { hp: 15, dmg: 5, move: 4, cdr: 2 },
        upgradeCosts: { hp: 100, dmg: 150, move: 120, cdr: 200 }
    },
    [UnitClass.PUMPKIN]: {
        class: UnitClass.PUMPKIN, name: 'Pumpkin', maxHp: 6, damage: 0, moveRange: 2,
        imgUrl: ICONS.PUMPKIN,
        movementType: 'WALKING', immunities: [],
        cost: 125,
        maxStats: { hp: 10, dmg: 0, move: 4, cdr: 2 },
        upgradeCosts: { hp: 60, dmg: 0, move: 100, cdr: 150 }
    },
    // The pusher. Damage 0 is the identity, not a gap: it relocates bodies and lets the
    // terrain do the killing, so move 3 (to reach the shove) matters more than any dmg stat.
    // dmg is capped at 0 for the same reason — upgrading it would erase what it is.
    [UnitClass.CHARD_GUARD]: {
        class: UnitClass.CHARD_GUARD, name: 'Chard Guard', maxHp: 5, damage: 0, moveRange: 3,
        imgUrl: ICONS.CHARD_GUARD,
        movementType: 'WALKING', immunities: [],
        cost: 100,
        maxStats: { hp: 9, dmg: 0, move: 5, cdr: 2 },
        upgradeCosts: { hp: 60, dmg: 0, move: 90, cdr: 150 }
    },
    [UnitClass.CHOMPER]: {
        class: UnitClass.CHOMPER, name: 'Chomper', maxHp: 5, damage: 10, moveRange: 3,
        imgUrl: ICONS.CHOMPER,
        movementType: 'WALKING', immunities: [],
        cost: 150,
        maxStats: { hp: 8, dmg: 10, move: 5, cdr: 2 },
        upgradeCosts: { hp: 75, dmg: 200, move: 100, cdr: 150 }
    },
    [UnitClass.BONK_CHOY]: {
        class: UnitClass.BONK_CHOY, name: 'Bonk Choy', maxHp: 5, damage: 3, moveRange: 3,
        imgUrl: ICONS.BONK_CHOY,
        movementType: 'WALKING', immunities: [],
        cost: 125,
        maxStats: { hp: 8, dmg: 6, move: 5, cdr: 2 },
        upgradeCosts: { hp: 75, dmg: 125, move: 100, cdr: 150 }
    },
    [UnitClass.KERNEL_PULT]: {
        class: UnitClass.KERNEL_PULT, name: 'Kernel Pult', maxHp: 4, damage: 1, moveRange: 3,
        imgUrl: ICONS.KERNEL_PULT,
        movementType: 'WALKING', immunities: [],
        cost: 100,
        maxStats: { hp: 7, dmg: 5, move: 5, cdr: 2 },
        upgradeCosts: { hp: 60, dmg: 110, move: 90, cdr: 150 }
    },
    [UnitClass.SUNFLOWER]: {
        class: UnitClass.SUNFLOWER, name: 'Sunflower', maxHp: 3, damage: 0, moveRange: 3, 
        imgUrl: ICONS.SUNFLOWER,
        movementType: 'WALKING', immunities: [],
        cost: 50,
        maxStats: { hp: 6, dmg: 0, move: 5, cdr: 2 },
        upgradeCosts: { hp: 50, dmg: 0, move: 75, cdr: 150 },
        evolvesTo: [UnitClass.TWIN_SUNFLOWER],
        evolutionCost: 200
    },
    [UnitClass.TWIN_SUNFLOWER]: {
        class: UnitClass.TWIN_SUNFLOWER, name: 'Twin Sunflower', maxHp: 5, damage: 0, moveRange: 3,
        imgUrl: ICONS.TWIN_SUNFLOWER,
        movementType: 'WALKING', immunities: [],
        cost: 125,
        maxStats: { hp: 8, dmg: 0, move: 5, cdr: 2 },
        upgradeCosts: { hp: 75, dmg: 0, move: 75, cdr: 200 }
    },
    // NEW PLANTS
    [UnitClass.COFFEE_BEAN]: {
        class: UnitClass.COFFEE_BEAN, name: 'Coffee Bean', maxHp: 3, damage: 0, moveRange: 4,
        imgUrl: ICONS.COFFEE_BEAN,
        movementType: 'WALKING', immunities: [],
        cost: 75,
        maxStats: { hp: 6, dmg: 0, move: 6, cdr: 2 },
        upgradeCosts: { hp: 50, dmg: 0, move: 50, cdr: 150 }
    },
    [UnitClass.HYPNO_SHROOM]: {
        class: UnitClass.HYPNO_SHROOM, name: 'Hypno-shroom', maxHp: 2, damage: 0, moveRange: 3,
        imgUrl: ICONS.HYPNO_SHROOM,
        movementType: 'WALKING', immunities: [],
        cost: 125,
        maxStats: { hp: 5, dmg: 0, move: 5, cdr: 2 },
        upgradeCosts: { hp: 50, dmg: 0, move: 100, cdr: 150 }
    },
    [UnitClass.BLOVER]: {
        class: UnitClass.BLOVER, name: 'Blover', maxHp: 3, damage: 0, moveRange: 3,
        imgUrl: ICONS.BLOVER,
        movementType: 'FLYING', immunities: [],
        cost: 100,
        maxStats: { hp: 5, dmg: 0, move: 6, cdr: 2 },
        upgradeCosts: { hp: 50, dmg: 0, move: 100, cdr: 150 }
    },
    [UnitClass.UMBRELLA_LEAF]: {
        class: UnitClass.UMBRELLA_LEAF, name: 'Umbrella Leaf', maxHp: 4, damage: 0, moveRange: 2,
        imgUrl: ICONS.UMBRELLA_LEAF,
        movementType: 'WALKING', immunities: [],
        cost: 100,
        maxStats: { hp: 8, dmg: 0, move: 4, cdr: 2 },
        upgradeCosts: { hp: 50, dmg: 0, move: 75, cdr: 150 }
    },
    [UnitClass.TORCHWOOD]: {
        class: UnitClass.TORCHWOOD, name: 'Torchwood', maxHp: 8, damage: 0, moveRange: 2,
        imgUrl: ICONS.TORCHWOOD,
        movementType: 'WALKING', immunities: ['BURN', 'FREEZE'],
        cost: 175,
        maxStats: { hp: 12, dmg: 0, move: 4, cdr: 2 },
        upgradeCosts: { hp: 75, dmg: 0, move: 100, cdr: 150 }
    },
};

export const PLAYER_ROSTER = [
    UnitClass.PEASHOOTER, UnitClass.BLOOMERANG, UnitClass.WALLNUT, UnitClass.CHOMPER, 
    UnitClass.BONK_CHOY, UnitClass.KERNEL_PULT, UnitClass.SUNFLOWER, 
    UnitClass.CACTUS, UnitClass.MELON_PULT, UnitClass.MAGNET_SHROOM,
    UnitClass.CABBAGE_PULT, UnitClass.TALL_NUT, UnitClass.PUMPKIN,
    UnitClass.SUN_SHROOM, UnitClass.SCAREDY_SHROOM, UnitClass.ENDURIAN, UnitClass.SWEET_POTATO,
    UnitClass.CHARD_GUARD,
    UnitClass.COFFEE_BEAN, UnitClass.HYPNO_SHROOM, UnitClass.BLOVER, UnitClass.UMBRELLA_LEAF,
    UnitClass.TORCHWOOD
];
