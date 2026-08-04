import {
    BenchPlant, HeroId, Position, Unit, UnitClass, UnitDefinition, UnitType,
} from '../types';
import { UNIT_ROLE_MAP } from '../constants';
import { HERO_DEFINITIONS } from '../data/heroes';
import { getMaterial } from '../data/materials';

/**
 * EVERY UNIT THE GAME PUTS ON A BOARD IS BUILT HERE.
 *
 * These were four separate object literals inside useGameProgression's setupCombat, and two
 * of them were the same unit built twice: the scripted branch constructed a hero from its
 * definition with an object literal that matched `freshHero` field for field except the id.
 * A hero gaining a field — `immunities` did, once — had to be remembered in both places, and
 * the second one is 200 lines away from the first.
 *
 * The enemy builder collapses three more copies (scripted wave, boss, rolled wave) that
 * differed only in hp, id and the flavour text on the intent.
 */

/**
 * A hero built from her definition alone — the fallback when no snapshot survives (a
 * reload wipes the snapshot ref) and what the scripted chain uses for a first appearance.
 * Base stats, no fusions: exactly what runPersistence already documents as the cost of
 * reloading with a fallen hero.
 */
export const freshHero = (heroId: HeroId, id = `revived-${heroId}`): Unit => {
    const def = HERO_DEFINITIONS[heroId];
    return {
        id,
        type: UnitType.PLANT, class: def.baseClass, role: UNIT_ROLE_MAP[def.baseClass],
        hp: def.maxHp, maxHp: def.maxHp, damage: def.damage, moveRange: def.moveRange,
        cooldownReduction: 0, level: 1, position: { x: -1, y: -1 },
        isEnemy: false, hasMoved: false, hasAttacked: false, statusEffects: [],
        movementType: def.movementType, immunities: def.immunities,
        imgUrl: def.boardImgUrl ?? def.imgUrl,
        isHero: true, heroId, fusions: [],
    } as Unit;
};

/**
 * Damage persists between battles (roguelike): the snapshot's hp carries into the next
 * fight instead of resetting to the definition. That is what makes every heal in the run
 * real — the shop's repair service, the campfire's sleep, the full heal on fusion. maxHp is
 * also the snapshot's, so BONUS_HP fusions survive the rebuild (resetting to def.maxHp
 * silently wiped the +3 every battle).
 *
 * `fullHeal` is for revives: a hero comes back on their feet, not on their last hp.
 */
export const buildHeroFromSnapshot = (snapshot: Unit, fullHeal = false): Unit => {
    const def = HERO_DEFINITIONS[snapshot.heroId as HeroId];
    const maxHp = snapshot.maxHp || (def ? def.maxHp : 1);
    return {
        ...snapshot,
        hp: fullHeal ? maxHp : Math.max(1, Math.min(snapshot.hp, maxHp)),
        maxHp,
        position: { x: -1, y: -1 },
        hasMoved: false,
        hasAttacked: false,
        prevPosition: undefined,
        statusEffects: [],
        intent: undefined,
        shield: 0,
        digestingTurns: 0,
        isDying: false,
        isAttacking: false,
        // Fusions survive death — the Coin spent on them is only suspended, never lost.
        fusions: snapshot.fusions ? [...snapshot.fusions] : [],
    };
};

/** A bench seedling, taking the field. Carried health, not a fresh body. */
export const buildBenchUnit = (plant: BenchPlant, idx: number): Unit => {
    const def = getMaterial(plant.materialId);
    const stats = def.benchStats;
    return {
        id: `bench-${plant.id}-${idx}`,
        type: UnitType.PLANT,
        class: def.benchClass,
        role: UNIT_ROLE_MAP[def.benchClass] || 'SUPPORT',
        // Carried health, not a fresh body: a seedling that has already served shows it.
        hp: Math.max(1, Math.min(plant.hp ?? stats.maxHp, stats.maxHp)), maxHp: stats.maxHp,
        damage: stats.damage, moveRange: stats.moveRange, cooldownReduction: 0,
        level: 1,
        position: { x: -1, y: -1 },
        isEnemy: false, hasMoved: false, hasAttacked: false, statusEffects: [],
        movementType: 'WALKING', immunities: [],
        imgUrl: def.imgUrl,
        // A base plant is not a hero: no hero skill, no fusion slots. It still blocks zombies.
        isHero: false,
        materialId: plant.materialId,
    };
};

export interface EnemyOptions {
    /** Multiplies the class sheet's HP (elite waves). */
    hpMult?: number;
    /** Flat HP on top, after the multiplier (a scripted boss tougher than its sheet). */
    hpBonus?: number;
    /** Flat damage on top (elite waves). */
    dmgAdd?: number;
    /** Gargantuar-class: too big to be eaten, frozen or shoved. */
    isMassive?: boolean;
    /** Telegraph text before the first intent is planned. */
    intentText?: string;
}

/** One zombie, from its class sheet plus whatever the encounter is doing to it. */
export const buildEnemy = (
    def: UnitDefinition,
    cls: UnitClass,
    position: Position,
    id: string,
    opts: EnemyOptions = {},
): Unit => {
    const hp = Math.floor(def.maxHp * (opts.hpMult ?? 1)) + (opts.hpBonus ?? 0);
    return {
        id,
        type: UnitType.ZOMBIE, class: cls, role: 'ENEMY',
        hp, maxHp: hp,
        damage: def.damage + (opts.dmgAdd ?? 0), moveRange: def.moveRange, cooldownReduction: 0,
        level: 1, position,
        isEnemy: true, hasMoved: false, hasAttacked: false, statusEffects: [],
        movementType: def.movementType, immunities: def.immunities, imgUrl: def.imgUrl,
        attackRange: def.attackRange ?? 1,
        intent: { type: 'MOVE', description: opts.intentText ?? 'Watching...' },
        isMassive: !!opts.isMassive,
    } as Unit;
};
