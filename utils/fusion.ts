import { FUSION_SLOTS } from '../constants';
import { HERO_DEFINITIONS } from '../data/heroes';
import { getMaterial } from '../data/materials';
import { getRecipe, FusionRecipe } from '../data/fusionRecipes';
import { FusionEffect, FusionEffectType, MaterialId, Skill, SkillEffectDefinition, Unit } from '../types';

/**
 * Fusion rules (DESIGN.md section 6).
 *
 * A purchased base plant has two mutually exclusive uses: sit on the bench as
 * insurance, or be fused into a hero — permanently, and it is consumed.
 * Fusion replaces stat buying entirely: you are not buying a number, you are
 * buying a trait.
 *
 * Three constraints do all the work here:
 *   - only heroes accept fusions (a bench plant deployed to the field never does)
 *   - a hero has FUSION_SLOTS slots, and that is the whole budget
 *   - the same material fuses into a given hero ONCE — no stacking. The same
 *     material can still go into a *different* hero.
 *
 * That last rule is what makes the shop's per-hero status line meaningful: it
 * is the thing that turns "buy the strongest material twice" into a dead end
 * and forces builds to spread across effects.
 *
 * Everything in this file is pure. No React, no mutation — `applyFusion`
 * returns a new Unit so the caller stays in control of state updates.
 */

/** Display name for a unit, preferring the hero definition. */
const unitName = (unit: Unit): string => {
    if (unit.heroId && HERO_DEFINITIONS[unit.heroId]) return HERO_DEFINITIONS[unit.heroId].name;
    // Fallback for a bench plant or an unregistered hero: prettify the class enum.
    return String(unit.class)
        .toLowerCase()
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('-');
};

/** Fusions already applied, always as an array. */
const fusionsOf = (unit: Unit): MaterialId[] => unit.fusions ?? [];

/** Free fusion slots left on a hero. Never negative. */
const slotsLeft = (unit: Unit): number => Math.max(0, FUSION_SLOTS - fusionsOf(unit).length);

/**
 * Can this material be fused into this hero?
 *
 * `reason` is written to be shown to the player verbatim — the UI should never
 * have to translate a failure code into a sentence.
 *
 * The duplicate check runs before the slot check on purpose: when a hero is both
 * full and already carrying the material, "already has it" is the fact the
 * player can act on (buy it for a different hero), while "no slots left" would
 * send them looking for a slot that would not have helped anyway.
 */
export const canFuse = (
    hero: Unit,
    materialId: MaterialId,
    tr: (text: string, vars?: Record<string, string | number>) => string = (text) => text,
    /**
     * Recipes the save has learned (`HERO:MATERIAL` keys). Omit it to skip the check
     * entirely — scripted content and the tutorial fuse without consulting player progress,
     * and gating those would break a hand-authored lesson on a fresh save.
     */
    knownRecipes?: string[],
    /**
     * The bench entry being fused, when there is one. Grafting needs intact tissue: a
     * seedling worn down by deployments has to be healed back to full first (a Campfire's
     * "Sleep It Off" does it). Omit for shop offers — those are brand new by definition.
     */
    plant?: { hp?: number; materialId: MaterialId },
): { ok: boolean; reason?: string } => {
    if (!hero || !hero.isHero) {
        return { ok: false, reason: tr('Only heroes can absorb a fusion.') };
    }

    const material = getMaterial(materialId);
    const materialName = tr(material ? material.name : 'That plant');

    if (knownRecipes && hero.heroId && !knownRecipes.includes(`${hero.heroId}:${materialId}`)) {
        return {
            ok: false,
            reason: tr('Recipe unknown: {hero} + {material}. Complete bonus objectives to learn it.', {
                hero: tr(unitName(hero)), material: materialName,
            }),
        };
    }

    if (fusionsOf(hero).includes(materialId)) {
        return { ok: false, reason: tr('{hero} already has {material}. It does not stack.', { hero: tr(unitName(hero)), material: materialName }) };
    }

    if (fusionsOf(hero).length >= FUSION_SLOTS) {
        return { ok: false, reason: tr('{hero} has no fusion slots left ({slots}/{slots} used).', { hero: tr(unitName(hero)), slots: FUSION_SLOTS }) };
    }

    if (plant && material) {
        const full = material.benchStats.maxHp;
        const hp = plant.hp ?? full;
        if (hp < full) {
            return {
                ok: false,
                reason: tr('{material} is worn down ({hp}/{full}). Heal it to full before grafting.', {
                    material: materialName, hp, full,
                }),
            };
        }
    }

    return { ok: true };
};

/**
 * Fuse a material into a hero and return a NEW Unit. Never mutates.
 *
 * Only BONUS_HP resolves immediately (it raises both maxHp and current hp, so
 * the fusion is felt right away instead of on the next heal). Every other
 * effect is passive: it is recorded in `fusions` and queried at resolution time
 * by the combat code via the helpers below.
 *
 * Fusing something the hero cannot take is a no-op — the same unit comes back
 * unchanged, so a mis-wired caller can never corrupt the fusion list.
 */
export const applyFusion = (hero: Unit, materialId: MaterialId): Unit => {
    if (!canFuse(hero, materialId).ok) return hero;

    const fused: Unit = {
        ...hero,
        fusions: [...fusionsOf(hero), materialId],
    };

    // The effect comes from the (hero, material) pair — see data/fusionRecipes.ts.
    const effect = getRecipe(hero.heroId, materialId)?.effect ?? getMaterial(materialId)?.effect;
    if (effect && effect.type === 'BONUS_HP') {
        const bonus = effect.value ?? 0;
        fused.maxHp = hero.maxHp + bonus;
        fused.hp = hero.hp + bonus;
    }

    return fused;
};

/** Every effect this unit carries from its fusions, in the order they were applied. */
export const getFusionEffects = (unit: Unit): FusionEffect[] => {
    if (!unit) return [];
    return fusionsOf(unit)
        // Pair lookup first; the material's generic effect is only a fallback for a
        // bench plant or a hero id the matrix does not know.
        .map(id => getRecipe(unit.heroId, id)?.effect ?? getMaterial(id)?.effect)
        .filter((effect): effect is FusionEffect => !!effect);
};

/** The authored recipes a hero currently carries, for UI that wants their names. */
export const getFusionRecipes = (unit: Unit): FusionRecipe[] =>
    fusionsOf(unit)
        .map(id => getRecipe(unit.heroId, id))
        .filter((r): r is FusionRecipe => !!r);

/** What this exact pairing would produce. Null when the matrix has no entry. */
export const previewFusion = (hero: Unit, materialId: MaterialId): FusionRecipe | null =>
    getRecipe(hero?.heroId, materialId);

/**
 * Does this unit carry an effect of this type?
 *
 * This is the right check for flag-shaped effects — ON_HIT_FREEZE, DOUBLE_ATTACK,
 * ON_HIT_PUSH — which are either present or not.
 */
export const hasFusionEffect = (unit: Unit, type: FusionEffectType): boolean =>
    getFusionEffects(unit).some(effect => effect.type === type);

/**
 * Total value of every effect of this type. Returns 0 when the unit has none.
 *
 * Values sum, which matters only if two different materials ever share an effect
 * type (the same material cannot be fused twice into one hero). For a flag-shaped
 * effect that carries no value this returns 0 even when present — use
 * `hasFusionEffect` for those.
 */
export const getFusionEffectValue = (unit: Unit, type: FusionEffectType): number =>
    getFusionEffects(unit)
        .filter(effect => effect.type === type)
        .reduce((total, effect) => total + (effect.value ?? 0), 0);

/**
 * One-line status of a material against one hero, for the shop tooltip.
 *
 * e.g. "Shadeleaf — already fused"
 *      "Ironhusk — 1 slot free"
 *      "Maw — no slots left"
 *
 * DESIGN.md section 5 calls this the most important line in the shop: it is what
 * stops the two purchases that waste Coin — buying a duplicate of what a hero
 * already has, and buying for a hero with nothing left to fill.
 */
export const describeFusionForHero = (
    hero: Unit,
    materialId: MaterialId,
    tr: (text: string, vars?: Record<string, string | number>) => string = (text) => text
): string => {
    const name = tr(unitName(hero));

    if (!hero || !hero.isHero) return `${name} — ${tr('not a hero')}`;
    if (fusionsOf(hero).includes(materialId)) return `${name} — ${tr('already fused')}`;

    const free = slotsLeft(hero);
    if (free <= 0) return `${name} — ${tr('no slots left')}`;

    // Naming the result is the whole value of this line: the same material does
    // something different on every hero.
    const recipe = getRecipe(hero.heroId, materialId);
    if (recipe) return `${name} — ${tr(recipe.name)}: ${tr(recipe.description)}`;

    return `${name} — ${tr('{free} slot(s) free', { free })}`;
};

/**
 * Graft the hero's fused materials onto a skill. Only offensive skills get them —
 * a self-buff shouldn't freeze anything.
 *
 * Pure and shared: App uses it both at cast time AND when computing valid targets,
 * so a fusion that changes reach (Pea Lance, Wall-nut Bowling) is reflected in the
 * targeting overlay, not just in the resolution.
 */
export const applyFusionToSkill = (skill: Skill, caster: Unit): Skill => {
    if (!caster.fusions?.length) return skill;
    if (!skill.effects.some(e => e.type === 'DAMAGE')) return skill;

    const extra: SkillEffectDefinition[] = [];
    if (hasFusionEffect(caster, 'ON_HIT_PUSH') && !skill.effects.some(e => e.type === 'PUSH' || e.type === 'PULL')) {
        extra.push({ type: 'PUSH', value: 1 });
    }
    if (hasFusionEffect(caster, 'ON_HIT_FREEZE') && !skill.effects.some(e => e.type === 'STUN')) {
        extra.push({ type: 'STUN' });
    }
    if (hasFusionEffect(caster, 'ON_HIT_BURN')) {
        extra.push({ type: 'APPLY_BURN' });
    }
    // Frost Pea: a delay on every hit — never a full freeze (that is Blizzard's job).
    if (hasFusionEffect(caster, 'ON_HIT_SLOW') && !skill.effects.some(e => e.type === 'APPLY_SLOW' || e.type === 'STUN')) {
        extra.push({ type: 'APPLY_SLOW' });
    }

    let effects = [...skill.effects, ...extra];

    // Brittle Bite: the one fusion that lets Frostpod actually finish a kill.
    const bonusDamage = getFusionEffectValue(caster, 'BONUS_DAMAGE');
    if (bonusDamage > 0) {
        effects = effects.map(e =>
            e.type === 'DAMAGE' ? { ...e, value: (e.value || 0) + bonusDamage } : e);
    }

    // Blizzard: Frostpod only ever slows on her own. This is the upgrade that turns
    // every one of her slows into a full freeze.
    if (hasFusionEffect(caster, 'UPGRADE_SLOW_TO_FREEZE')) {
        effects = effects.map(e => (e.type === 'APPLY_SLOW' ? { type: 'STUN' as const } : e));
    }

    // Wall-nut Bowling: extends the reach of every attack (incl. Rolling Charge).
    const reach = getFusionEffectValue(caster, 'ATTACK_RANGE_BONUS');
    let rangeValue = reach > 0 ? skill.rangeValue + reach : skill.rangeValue;

    // Pea Lance: the melee swing reaches further, but the shove is gone — reach
    // is bought with the push, not stacked on top of it.
    if (skill.rangeType === 'MELEE' && hasFusionEffect(caster, 'MELEE_REACH_TRADE')) {
        rangeValue += getFusionEffectValue(caster, 'MELEE_REACH_TRADE');
        effects = effects.filter(e => e.type !== 'PUSH');
    }

    // Mortar Pea / Arcing Frost: the straight shot becomes a lobbed one. Two halves, both
    // deliberate. A LINE stops at the first unit in the way — including a friendly wall, which
    // is the friction the brain rule manufactures every fight — while a LOB ignores everything
    // in between. But LOB range is Manhattan distance in EVERY direction, so keeping the number
    // would turn Shadeleaf's LINE 8 into most of the board: the arc is bought with the reach,
    // exactly like Pea Lance buys reach with its push.
    //
    // Piercing skills are left as lines on purpose. Pierce is resolved along a path
    // (getSkillTargetPath) that only LINE and DASH produce, so converting Precision Blast or
    // Deep Chill would silently delete the pierce rather than trade it for anything.
    let rangeType = skill.rangeType;
    if (rangeType === 'LINE'
        && hasFusionEffect(caster, 'ARC_ATTACK')
        && !effects.some(e => e.type === 'PIERCE_ATTACK')) {
        rangeType = 'LOB';
        rangeValue = Math.max(2, Math.ceil(rangeValue / 2));
    }

    const changed = effects.length !== skill.effects.length
        || rangeValue !== skill.rangeValue
        || rangeType !== skill.rangeType
        || effects.some((e, i) => e !== skill.effects[i]);
    return changed ? { ...skill, effects, rangeValue, rangeType } : skill;
};
