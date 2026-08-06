import {
    BenchPlant, ElementId, HeroId, Position, Unit, UnitClass, UnitDefinition, UnitImmunity, UnitType, BossId } from '../types';
import { UNIT_ROLE_MAP } from '../constants';
import { HERO_DEFINITIONS } from '../data/heroes';
import { getMaterial } from '../data/materials';
import { ELEMENT_HP_COST, ELEMENT_IMMUNITY } from './elements';
import { hasFusionEffect } from './fusion';

/**
 * The element's second gift, beside the damage rider: matched immunity (ELEMENT_IMMUNITY —
 * ice does not freeze, fire does not burn, lightning does not conduct). Computed from the
 * DEFINITION plus the element actually carried, never trusted from a snapshot — a hero who
 * swaps element between runs must swap immunity with it, and a stale 'FREEZE' riding in a
 * saved immunities array would be a free pass she no longer pays for.
 */
const elementalImmunities = (base: UnitImmunity[], element?: ElementId): UnitImmunity[] =>
    element ? Array.from(new Set([...base, ELEMENT_IMMUNITY[element]])) : base;

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
 * THE ELEMENT BILL, AND THE ONE PLACE IT IS EVER CHARGED.
 *
 * Carrying an element costs max HP (PLAN-progression.md section 3), and hero health PERSISTS
 * between battles here — so the failure mode to design against is not "the cost is missing",
 * it is "the cost is taken twice". A hero rebuilt from her snapshot every battle, every
 * revive and every reload would quietly shed a point of max HP each time until she was
 * unplayable, and nothing in the UI would ever name the culprit.
 *
 * The rule that makes it impossible: THE COST IS SUBTRACTED FROM A DEFINITION'S maxHp, NEVER
 * FROM A SNAPSHOT'S. A number that came off `HERO_DEFINITIONS` has never paid; a number that
 * came off a snapshot always has. Every path below is one or the other, so the deduction is
 * idempotent by construction rather than by a flag someone has to remember to set.
 *
 * It also composes with BONUS_HP in either order: the element subtracts from the sheet number
 * and the fusion adds on top of the result, and `a - 1 + 3` is `a + 3 - 1`. (The floor is the
 * single exception, and it cannot bite while the thinnest body in the roster is 6.)
 *
 * That floor is 1: a hero built at 0 max HP is a corpse the instant she is placed. No hero can
 * reach it today, but a factory that is *able* to emit an unplayable unit eventually will.
 */
const pricedMaxHp = (baseMaxHp: number, element?: ElementId): number =>
    Math.max(1, baseMaxHp - (element ? ELEMENT_HP_COST : 0));

/**
 * A hero built from her definition alone — the fallback when no snapshot survives (a
 * reload wipes the snapshot ref) and what the scripted chain uses for a first appearance.
 * Base stats, no fusions: exactly what runPersistence already documents as the cost of
 * reloading with a fallen hero.
 *
 * `element` is the run's choice for this hero (RunState.heroElements). This is the sheet-reading
 * path, so it is here that the max HP is actually charged for.
 */
/**
 * A body that belongs to THIS BATTLE and to nothing else.
 *
 * One thing qualifies today: the ESCORT_GEAR crate (an objective wearing a unit, because the
 * horde has to be able to walk at it and break it). It is `UnitType.PLANT` and it is on the
 * player's side, which is exactly what every "is this part of my squad" filter in the run has
 * always tested for — so without a name for it it was quietly adopted: saved into the run on
 * the next map screen, and handed back as a roster member in the next fight.
 *
 * The wild plant was the second case and is gone (utils/encounterBuilder). The helper stays
 * because the rule is not about crates: the run never owns a body the board handed out.
 */
export const isBattleOnlyUnit = (u: Unit): boolean =>
    u.class === UnitClass.GEAR_CRATE;

/**
 * TÊN HIỂN THỊ CỦA MỘT UNIT — hero đọc theo hero, còn lại đọc theo thân cây.
 *
 * Tồn tại vì hai màn hình từng tự trả lời câu này và cùng trả lời sai: bảng Đội Hình tra
 * `unitDefs[unit.class].name`, danh sách triển khai in thẳng `unit.class`. Cả hai đều cho
 * ra TÊN CÂY, nên Peaburst hiện là "Seed Gun" và Ironhusk là "Armor Plate" — hero mang
 * `class` bằng đúng cây gốc của mình, nên hai lối đó không bao giờ phân biệt được.
 *
 * Chuỗi trả về là khoá i18n tiếng Anh, giống mọi chuỗi khác trong code; nơi gọi tự bọc t().
 */
export const unitDisplayName = (u: Unit, plantName?: string): string => {
    if (u.isHero && u.heroId && HERO_DEFINITIONS[u.heroId]) return HERO_DEFINITIONS[u.heroId].name;
    if (plantName) return plantName;
    return String(u.class).replace(/_/g, ' ');
};

export const freshHero = (heroId: HeroId, id = `revived-${heroId}`, element?: ElementId): Unit => {
    const def = HERO_DEFINITIONS[heroId];
    const maxHp = pricedMaxHp(def.maxHp, element);
    return {
        id,
        type: UnitType.PLANT, class: def.baseClass, role: UNIT_ROLE_MAP[def.baseClass],
        hp: maxHp, maxHp, damage: def.damage, moveRange: def.moveRange,
        cooldownReduction: 0, level: 1, position: { x: -1, y: -1 },
        isEnemy: false, hasMoved: false, hasAttacked: false, statusEffects: [],
        movementType: def.movementType, immunities: elementalImmunities(def.immunities, element),
        // Innate thorns are part of the body, like immunities — not something bought. The
        // Biting Wall fusion adds to this rather than replacing it (turnManager sums them).
        retaliateDamage: def.retaliateDamage,
        imgUrl: def.boardImgUrl ?? def.imgUrl,
        isHero: true, heroId, fusions: [],
        // On the UNIT, not on a skill: the element has to reach every source of damage the
        // hero has, including retaliation, which no skill object is involved in (rule L4).
        element,
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
 *
 * `element` is an OVERRIDE, not the hero's element — omit it and the snapshot's own is kept.
 * Pass one only to state what the run says this hero should be carrying now; see the
 * re-pricing note below for why passing the element she already has changes nothing.
 */
export const buildHeroFromSnapshot = (snapshot: Unit, fullHeal = false, element?: ElementId): Unit => {
    const def = HERO_DEFINITIONS[snapshot.heroId as HeroId];

    /**
     * The snapshot's maxHp is the authoritative, ALREADY-PRICED number: it carries her BONUS_HP
     * fusions, and if she was built carrying an element the cost came out at `freshHero`. So it
     * is taken as-is — subtracting here is the double-charge this file exists to prevent.
     *
     * The legacy fallback is the exception that proves the rule: it reads the DEFINITION, which
     * has never paid, so it pays here. (It only fires for a snapshot from before maxHp was
     * persisted; such a snapshot cannot carry an element either, so in practice it pays nothing.)
     */
    const paidMaxHp = snapshot.maxHp || (def ? pricedMaxHp(def.maxHp, snapshot.element) : 1);

    /**
     * Re-pricing, for the one case that is not a plain rebuild: the caller naming an element the
     * snapshot does not already carry — picked at squad select, or swapped later (the plan is
     * explicit that changing element must not cost a hero her fusions).
     *
     * Refunding the old bill before charging the new one is what makes the ordinary case — every
     * rebuild between battles, handed the element she is already wearing — a no-op. Calling this
     * ten times in a row yields the same body as calling it once.
     */
    const nextElement = element ?? snapshot.element;
    const maxHp = nextElement === snapshot.element
        ? paidMaxHp
        : pricedMaxHp(paidMaxHp + (snapshot.element ? ELEMENT_HP_COST : 0), nextElement);

    return {
        ...snapshot,
        element: nextElement,
        // Recomputed from the sheet for the element ACTUALLY carried now — see
        // elementalImmunities: a snapshot's array may hold the OLD element's immunity.
        immunities: elementalImmunities(def ? def.immunities : snapshot.immunities, nextElement),
        // Clamped, so taking on an element mid-run trims the wound rather than leaving a hero
        // standing at 7/6. Dropping one never heals: only maxHp moves back up.
        hp: fullHeal ? maxHp : Math.max(1, Math.min(snapshot.hp, maxHp)),
        maxHp,
        // Re-read from the definition, unlike maxHp: no fusion writes this field (fusion
        // retaliation is a separate effect that stacks on top), so the sheet is always right
        // — and a snapshot saved before the field existed still comes back with its thorns.
        retaliateDamage: def?.retaliateDamage ?? snapshot.retaliateDamage,
        position: { x: -1, y: -1 },
        hasMoved: false,
        hasAttacked: false,
        prevPosition: undefined,
        statusEffects: [],
        intent: undefined,
        /**
         * BUNKER SHELL (`START_SHIELDED`): the one fusion that is spent before a turn is
         * taken. It lives here rather than at battle setup because this file is where EVERY
         * unit the game puts on a board is built — the scripted tutorial squad and the rolled
         * one both come through, so one line covers both and neither can drift.
         *
         * `lastStandUsed` is cleared on the same line of reasoning and it is the load-bearing
         * half: the flag rides the snapshot between battles, so without the reset "once a
         * battle" would quietly become "once a run".
         */
        shield: hasFusionEffect(snapshot, 'START_SHIELDED') ? 1 : 0,
        shieldBarbed: false,
        lastStandUsed: false,
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
    /** Gravehulk-class: too big to be eaten, frozen or shoved. */
    isMassive?: boolean;
    /** The encounter's named boss — what SLAY_BOSS and the behaviour table ask about. */
    bossId?: BossId;
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
        armor: def.armor,
        intent: { type: 'MOVE', description: opts.intentText ?? 'Watching...' },
        isMassive: !!opts.isMassive,
        bossId: opts.bossId,
        bossClock: opts.bossId ? 0 : undefined,
    } as Unit;
};
