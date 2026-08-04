
import { UnitClass, UnitDefinition } from '../types';
import { ICONS } from '../utils/icons';

// Using Partial because this only contains Zombies, not ALL UnitClasses
export const ZOMBIE_DEFINITIONS: Partial<Record<UnitClass, UnitDefinition>> = {
    [UnitClass.BASIC_ZOMBIE]: {
        class: UnitClass.BASIC_ZOMBIE, name: 'Zombie', maxHp: 2, damage: 1, moveRange: 3,
        imgUrl: ICONS.ZOMBIE,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 2, dmg: 1, move: 3, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.CONEHEAD]: {
        class: UnitClass.CONEHEAD, name: 'Conehead', maxHp: 3, damage: 2, moveRange: 3,
        imgUrl: ICONS.CONEHEAD,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 3, dmg: 2, move: 3, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.BUCKETHEAD]: {
        class: UnitClass.BUCKETHEAD, name: 'Buckethead', maxHp: 4, damage: 2, moveRange: 3,
        imgUrl: ICONS.BUCKETHEAD,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 4, dmg: 2, move: 3, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.NEWSPAPER_ZOMBIE]: {
        class: UnitClass.NEWSPAPER_ZOMBIE, name: 'Newspaper Zombie', maxHp: 3, damage: 1, moveRange: 3,
        imgUrl: ICONS.NEWSPAPER,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 3, dmg: 3, move: 4, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.SCREEN_DOOR_ZOMBIE]: {
        class: UnitClass.SCREEN_DOOR_ZOMBIE, name: 'Screen Door Zombie', maxHp: 5, damage: 2, moveRange: 3,
        imgUrl: ICONS.SCREEN_DOOR,
        movementType: 'WALKING', immunities: ['STATUS'], 
        cost: 0,
        maxStats: { hp: 5, dmg: 2, move: 3, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.DIGGER_ZOMBIE]: {
        class: UnitClass.DIGGER_ZOMBIE, name: 'Digger Zombie', maxHp: 3, damage: 2, moveRange: 3,
        imgUrl: ICONS.DIGGER,
        movementType: 'TELEPORT',
        immunities: [],
        cost: 0,
        maxStats: { hp: 3, dmg: 2, move: 3, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.FOOTBALL_ZOMBIE]: {
        class: UnitClass.FOOTBALL_ZOMBIE, name: 'Football Zombie', maxHp: 5, damage: 2, moveRange: 4,
        imgUrl: ICONS.FOOTBALL,
        movementType: 'WALKING', immunities: ['PUSH'],
        cost: 0,
        maxStats: { hp: 5, dmg: 2, move: 4, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.POLE_VAULTER]: {
        class: UnitClass.POLE_VAULTER, name: 'Pole Vaulter', maxHp: 3, damage: 2, moveRange: 4,
        imgUrl: ICONS.POLE_VAULTER,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 3, dmg: 2, move: 4, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.DISCO_ZOMBIE]: {
        class: UnitClass.DISCO_ZOMBIE, name: 'Disco Zombie', maxHp: 4, damage: 1, moveRange: 3,
        imgUrl: ICONS.DISCO,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 4, dmg: 1, move: 3, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    /**
     * The answer to a turtled squad. It ignores walls, water and bodies entirely, so a
     * hard-held choke point does nothing to it — but 2 HP means a single pea pops it.
     */
    [UnitClass.BALLOON_ZOMBIE]: {
        class: UnitClass.BALLOON_ZOMBIE, name: 'Balloon Zombie', maxHp: 2, damage: 2, moveRange: 4,
        imgUrl: ICONS.BALLOON,
        movementType: 'FLYING', immunities: ['DROWN'],
        cost: 0,
        maxStats: { hp: 2, dmg: 2, move: 4, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    /**
     * Outranges every melee hero: it shells plants from 3 tiles away and never has to close.
     * Slow on purpose — the counterplay is to walk to it, not to wait for it.
     */
    [UnitClass.CATAPULT_ZOMBIE]: {
        class: UnitClass.CATAPULT_ZOMBIE, name: 'Catapult Zombie', maxHp: 3, damage: 2, moveRange: 2,
        attackRange: 3,
        imgUrl: ICONS.CATAPULT,
        movementType: 'WALKING', immunities: ['PUSH'],
        cost: 0,
        maxStats: { hp: 3, dmg: 2, move: 2, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    /**
     * PvZ's huge-wave herald, turned into a priority target. On its own it is nearly
     * harmless (1 damage); the threat is the ENRAGED aura it hands every other zombie
     * on the board. Killing it is worth more than killing anything standing next to it.
     */
    [UnitClass.FLAG_ZOMBIE]: {
        class: UnitClass.FLAG_ZOMBIE, name: 'Flag Zombie', maxHp: 4, damage: 1, moveRange: 3,
        imgUrl: ICONS.FLAG,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 4, dmg: 1, move: 3, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.GARGANTUAR]: {
        // 16, not 10. Three heroes put out roughly 5 damage a turn, so a 10 HP boss folded in
        // two turns — and any two consumables did it outright. At 16 it takes sustained focus
        // while the horde keeps coming, which is the only thing that makes it a boss.
        class: UnitClass.GARGANTUAR, name: 'Gargantuar', maxHp: 16, damage: 5, moveRange: 2,
        imgUrl: ICONS.GARGANTUAR,
        movementType: 'WALKING', immunities: ['PUSH', 'FREEZE'],
        cost: 0,
        maxStats: { hp: 16, dmg: 5, move: 2, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.IMP]: {
        class: UnitClass.IMP, name: 'Imp', maxHp: 1, damage: 1, moveRange: 4,
        imgUrl: ICONS.IMP,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 1, dmg: 1, move: 4, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.ROCK]: {
        class: UnitClass.ROCK, name: 'Rock', maxHp: 99, damage: 0, moveRange: 0,
        imgUrl: ICONS.ROCK, 
        movementType: 'WALKING', immunities: ['PUSH', 'BURN', 'FREEZE', 'DROWN'],
        cost: 0,
        maxStats: { hp: 99, dmg: 0, move: 0, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.GRAVE]: {
        class: UnitClass.GRAVE, name: 'Grave', maxHp: 3, damage: 0, moveRange: 0,
        imgUrl: ICONS.GRAVE,
        movementType: 'WALKING', immunities: ['PUSH', 'BURN', 'FREEZE', 'DROWN'],
        cost: 0,
        maxStats: { hp: 3, dmg: 0, move: 0, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
};
