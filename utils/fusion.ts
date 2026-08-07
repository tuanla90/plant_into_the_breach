import { FUSION_SLOTS } from '../constants';
import { HERO_DEFINITIONS } from '../data/heroes';
import { getMaterial } from '../data/materials';
import { UPGRADE_HP, UPGRADE_MOVE, upgradeById, upgradesFor } from '../data/heroUpgrades';
import { getRecipe, FusionRecipe } from '../data/fusionRecipes';
import { FusionEffect, FusionEffectType, HeroId, MaterialId, Skill, SkillEffectDefinition, Unit } from '../types';
import { elementRider, skillCarriesElement } from './elements';

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

/**
 * RENDING CLAWS — the one action a DIGEST_CLAW carrier may take through the helpless window.
 *
 * Defined here, once, because three places have to agree about it or the fusion breaks in a
 * different way in each: App builds the button, FusionPanel prints the card, and
 * getValidSkillTargets holds the digest gate open by ID. The granted Fused Shot (GRANT_ATTACK)
 * predates this and is still hand-rolled in two places — the drift between those two copies is
 * exactly what this constant exists to avoid repeating.
 */
export const DIGEST_CLAW_SKILL_ID = 'fusion_digest_claw';

export const DIGEST_CLAW_SKILL: Skill = {
    id: DIGEST_CLAW_SKILL_ID,
    name: 'Rending Claws',
    description: 'Claws an adjacent enemy for 1. Only while digesting. Free.',
    rangeType: 'MELEE',
    rangeValue: 1,
    effects: [{ type: 'DAMAGE', value: 1 }],
};

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
            reason: tr('Recipe unknown: {hero} + {material}. Level up to learn it.', {
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
    // MOVE_BONUS writes the body directly, exactly as STRIDE does (applyUpgrade below):
    // nothing anywhere re-derives moveRange, so nothing can wipe it — and the snapshot
    // rebuild between battles spreads the unit, carrying the faster legs for free.
    if (effect && effect.type === 'MOVE_BONUS') {
        fused.moveRange = hero.moveRange + (effect.value ?? 1);
    }

    return fused;
};

/**
 * Every effect this unit carries — from its fusions AND from the act upgrades it has been
 * given this run (data/heroUpgrades.ts).
 *
 * The two sources are merged HERE, in the one function every consumer already reads, rather
 * than being wired separately. Damage, reach, shove distance, retaliation, Sol income and the
 * targeting overlay all come off this list, so an upgrade added here is an upgrade the player
 * can see in the overlay before committing the click — and `migrateHeroHp` keeps the +2 HP
 * across a reload for free, because it re-derives max health from `BONUS_HP` totalled right
 * here. Wiring upgrades anywhere else would mean re-solving all six of those problems.
 */
export const getFusionEffects = (unit: Unit): FusionEffect[] => {
    if (!unit) return [];
    const fromFusions = fusionsOf(unit)
        // Pair lookup first; the material's generic effect is only a fallback for a
        // bench plant or a hero id the matrix does not know.
        .map(id => getRecipe(unit.heroId, id)?.effect ?? getMaterial(id)?.effect)
        .filter((effect): effect is FusionEffect => !!effect);
    const fromUpgrades = (unit.upgrades ?? [])
        .map(id => upgradeById(id)?.effect)
        .filter((effect): effect is FusionEffect => !!effect);
    return [...fromFusions, ...fromUpgrades];
};

/**
 * Hand a hero one act upgrade. Same shape as `applyFusion`: a new Unit, nothing mutated.
 *
 * VIGOR writes maxHp AND carries a BONUS_HP effect, which is not redundancy: the write is what
 * the player feels now, and the effect is what `migrateHeroHp` re-derives the ceiling from
 * after a reload. A BONUS_HP fusion does exactly the same two things for exactly this reason.
 * STRIDE has no effect vocabulary to ride, so it is written onto the body alone — nothing
 * anywhere re-derives moveRange, so nothing can wipe it.
 */
export const applyUpgrade = (hero: Unit, upgradeId: string): Unit => {
    const up = upgradeById(upgradeId);
    if (!up || up.hero !== hero.heroId) return hero;
    if ((hero.upgrades ?? []).includes(upgradeId)) return hero;   // once each, ever

    const next: Unit = { ...hero, upgrades: [...(hero.upgrades ?? []), upgradeId] };
    if (up.kind === 'VIGOR') {
        next.maxHp = hero.maxHp + UPGRADE_HP;
        // Healed by the amount gained rather than to full: this is a bigger frame, not a
        // free rest. The camp sells the rest separately and should keep being worth buying.
        next.hp = hero.hp + UPGRADE_HP;
    }
    if (up.kind === 'STRIDE') next.moveRange = hero.moveRange + UPGRADE_MOVE;
    return next;
};

/** Upgrades this hero has not taken yet. The picker offers exactly these. */
export const upgradesLeft = (hero: Unit) =>
    upgradesFor(hero.heroId as HeroId).filter(u => !(hero.upgrades ?? []).includes(u.id));

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
 * ĐANG CHỐNG ĐƯỢC CÚ VA CHẠM — nền chung của cột Tấm Giáp, ba ô cùng mua.
 *
 * Ba tanker ghép Tấm Giáp đọc thành một câu: **cùng một nền, ba cái đuôi khác nhau.**
 *   - `STEADFAST`         (Ironhusk)   nền + `-1` mọi nguồn
 *   - `COLLISION_PLATING` (Chardslam)  nền + miễn mọi dịch chuyển cưỡng bức
 *   - `SPINED_PLATING`    (Thornshell) nền + thân va vào anh tự mất 2 máu
 *
 * Nền = miễn damage va chạm + bịt hố spawn không mất máu. Gom vào một vị ngữ vì trước đây luật
 * đó được gõ tay ở ba nơi và ĐÃ trôi khỏi nhau một lần (xem `applyCollisionDamage`); thêm hai
 * ô nữa vào ba bản chép tay là mời đúng cái bug đó quay lại.
 */
export const bracedAgainstCollision = (unit: Unit): boolean =>
    hasFusionEffect(unit, 'STEADFAST')
    || hasFusionEffect(unit, 'COLLISION_PLATING')
    || hasFusionEffect(unit, 'SPINED_PLATING');

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
 * e.g. "Peaburst — already fused"
 *      "Ironhusk — 1 slot free"
 *      "Snapmaw — no slots left"
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
 * so a fusion that changes reach (Pea Lance, Armor Plate Bowling) is reflected in the
 * targeting overlay, not just in the resolution.
 */
export const applyFusionToSkill = (skill: Skill, caster: Unit): Skill => {
    /**
     * The hero's ELEMENT rides in here too (rules L1/L2, utils/elements.ts), for the same reason
     * the fusions do: this one function feeds both the resolution AND the targeting overlay, so
     * a slow bolted on here is a slow the player can see BEFORE committing the click. Attaching
     * it at resolution time instead would leave the overlay lying about what the attack does.
     *
     * Which is why this early-out had to grow a second clause: an element is not a fusion, and a
     * hero can perfectly well carry one with no materials fused at all. Under the old test her
     * element was silently dropped for the whole first stretch of the run.
     */
    /**
     * THE LOAN (Solar Blessing): a blessed ally with no element of their own attacks with
     * the blesser's, for this one player turn. Own element always wins — the loan only fills
     * an empty hand — and it confers no immunity and no resonance weight: a borrowed blade,
     * not borrowed skin. Folded HERE so the targeting overlay shows the borrowed rider
     * before the click, on the same terms as everything else in this function.
     */
    const lentCaster = !caster.element && caster.blessedElement && caster.statusEffects?.includes('BLESSED')
        ? { ...caster, element: caster.blessedElement }
        : caster;
    const carriesElement = skillCarriesElement(skill, lentCaster);
    // Third clause, and it arrived the same way the element's did: a hero can carry an ACT
    // UPGRADE with no materials fused at all, and under the two-clause test her Heavier Peas
    // were silently dropped for the whole run — the skill came back with its authored 2 and
    // the +1 existed only in a data file. Measured, not guessed: a fresh Peaburst given all
    // three upgrades still handed back `DAMAGE 2, range 8`.
    // Fourth clause, same story as the other three: a BLESSED hero may carry no fusions, no
    // upgrades and no element, and her +1 still has to reach the card and the overlay.
    if (!caster.fusions?.length && !caster.upgrades?.length && !carriesElement
        && !caster.statusEffects?.includes('BLESSED')) return skill;

    const hasDamage = skill.effects.some(e => e.type === 'DAMAGE');
    // TOSS counts as a shove for every rule here: it is a strike that relocates a body — the
    // judo grip is Chardslam's Backswing wearing a different trajectory.
    const hasShove = skill.effects.some(e => e.type === 'PUSH' || e.type === 'PULL' || e.type === 'GLOBAL_PUSH' || e.type === 'TOSS');
    const hasShield = skill.effects.some(e => e.type === 'SHIELD');
    const hasTaunt = skill.effects.some(e => e.type === 'PROVOKE');

    /**
     * THE GATE. This used to read "no DAMAGE effect, no fusions", which was a fine shorthand
     * back when every offensive skill in the game dealt damage. Chardslam broke it: his free
     * swing carries PUSH and nothing else — 0 damage is his identity, not a gap — so under the
     * old test every single fusion in his row was dropped on the floor without a word, and so
     * was Gourdward's shield and Thornshell's taunt.
     *
     * The test is now "does this skill DO something to somebody else", which is what the
     * shorthand was reaching for all along. A self-buff (Harvest, the Sol charges) still
     * matches nothing here and still returns untouched, which is the case the original guard
     * actually existed to protect: nobody wants Sunbloom freezing herself for banking light.
     *
     * The element rider passes this gate on exactly the same terms, which is rule L1 restated:
     * Chardslam's Vault Toss is 0 damage and pure displacement, and what it throws still lands
     * carrying his element. Sunbloom's free action IS the self-buff, so rule L2 moves her
     * element onto her PAID skill — Solar Blessing, whose whole point is lending that element
     * on (the loan itself is applied at resolution, not here: a rider on an ally-buff must
     * never mean "slow the ally").
     */
    if (!hasDamage && !hasShove && !hasShield && !hasTaunt) return skill;

    const extra: SkillEffectDefinition[] = [];
    // The on-hit riders stay gated on DAMAGE specifically. They are things that happen to a
    // body the attack HURT — grafting them onto a pure shove or a shield would fire them at
    // whatever the skill happened to touch, including the ally being shielded.
    if (hasDamage) {
        if (hasFusionEffect(caster, 'ON_HIT_PUSH') && !skill.effects.some(e => e.type === 'PUSH' || e.type === 'PULL')) {
            extra.push({ type: 'PUSH', value: 1 });
        }
        /**
         * RECOIL COB (ON_HIT_PULL) — lò xo hoạt động hai chiều: đạn cối KÉO mục tiêu một ô về
         * phía cô, thay vì hất ra.
         *
         * Đối xứng hoàn toàn với `ON_HIT_PUSH` ngay trên, kể cả cái chốt "skill đã tự có
         * push/pull thì thôi": hai ô đền cùng một mức (đẩy 1 ↔ kéo 1) và đi qua đúng `planPush`,
         * nên va chạm vẫn tính damage như mọi cú đẩy khác. Không có luật thứ hai nào cả.
         *
         * Displacement CHIỀU NGƯỢC là thứ chưa ô nào trong ma trận bán trên đòn thường — và nó
         * tự combo với Overwatch Pea mà không cần một dòng code riêng: `OVERWATCH_SHOT` kích
         * theo "cú shove của đội", mà PULL cũng là một cú shove.
         */
        if (hasFusionEffect(caster, 'ON_HIT_PULL') && !skill.effects.some(e => e.type === 'PUSH' || e.type === 'PULL')) {
            extra.push({ type: 'PULL', value: 1 });
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
    }

    /**
     * The Steel Jaws axis: the strike leaves an open wound. Chỉ trên đòn CÓ SÁT THƯƠNG.
     *
     * [C2.2] Mệnh đề `|| hasShove` từng đứng ở đây là một special-case tồn tại chỉ vì type chưa
     * nói thật: nó có mặt để cú ném 0-damage của Chardslam cũng đánh dấu được, tức engine đang
     * bù cho một cái tên sai. Giờ ô đó có type riêng — `BLEED_ON_SHOVE` — và nó không cưỡi lên
     * skill nữa mà móc thẳng vào SÁT THƯƠNG VA CHẠM (utils/skillResolution), nên "đập vào mới
     * toác" là luật chứ không còn là lời kể. `BLEED_ON_HIT` thu về đúng nghĩa đen của nó.
     */
    if (hasDamage
        && hasFusionEffect(caster, 'BLEED_ON_HIT')
        && !skill.effects.some(e => e.type === 'APPLY_BLEED')) {
        extra.push({ type: 'APPLY_BLEED' });
    }

    // The Rotor Wing axis, skill-only by construction (the SKILL_SPLASH precedent): the PAID
    // skill also drops dust where it struck.
    //
    // "Free-attack dust would be a free disarm every turn" is why — and `SMOKE_ON_HIT` is not
    // a hole in that ban, it is the other side of it. THIS one dusts an AREA (every tile the
    // cast covered, two turns), which on a free action is a wall raised every single turn.
    // That one dusts ONE tile for ONE turn under a body the hero already had to hit. The ban
    // is on the footprint, not on the word "dust".
    if ((skill.sunCost ?? 0) > 0
        && (hasDamage || hasShove)
        && hasFusionEffect(caster, 'SKILL_DISARM')
        && !skill.effects.some(e => e.type === 'DUST_TILE')) {
        extra.push({ type: 'DUST_TILE', value: 2 });
    }

    /**
     * SKILL_STUN (Stun Charge, Stun Shell) — the corn's pin, on the PAID skill only,
     * which is the whole of what makes it a priced exception to the STUN RULE rather than a
     * breach of it. Refuses to stack on a skill that already pins.
     *
     * `hasShield` is in the gate beside `hasDamage` for exactly one kit: Gourdward has no
     * damaging skill at all, so a damage-only gate would have made his cell unbuildable — and
     * the shape it produces is the DEAREST version of the exception, not a loophole. He must
     * stand inside the crowd, at 0 damage on 8 hp, and spend his whole turn plus 50 Sol.
     */
    if ((skill.sunCost ?? 0) > 0
        && (hasDamage || hasShield)
        && hasFusionEffect(caster, 'SKILL_STUN')
        && !skill.effects.some(e => e.type === 'STUN')) {
        extra.push({ type: 'STUN' });
    }

    // SKILL_REPEL (Shockrind) — the paid SHIELD skill becomes a shockwave as well. GLOBAL_PUSH
    // rather than PUSH because the direction has to be read per tile (away from the caster),
    // which is exactly what that effect means in skillResolution's radial branch.
    if ((skill.sunCost ?? 0) > 0
        && hasShield
        && hasFusionEffect(caster, 'SKILL_REPEL')
        && !skill.effects.some(e => e.type === 'PUSH' || e.type === 'PULL' || e.type === 'GLOBAL_PUSH')) {
        extra.push({ type: 'GLOBAL_PUSH', value: 1 });
    }

    // The retired Cactus gear's axis: the attack leaves the ground it crossed bristling.
    // Allowed on a pure shove as well as a damaging shot — both are strikes that travel over
    // tiles — but not on a shield or a taunt, where there is no swing to leave anything
    // behind. Data-orphaned since Thornquill and her gear retired (PLAN-hero-zephyr); kept
    // because the Spike Trap item exercises the same spike fields and a future recipe can
    // pick the trail back up.
    const spikeTrail = getFusionEffectValue(caster, 'SPIKE_TRAIL');
    if ((hasDamage || hasShove)
        && hasFusionEffect(caster, 'SPIKE_TRAIL')
        && !skill.effects.some(e => e.type === 'SPIKE_TILE')) {
        extra.push({ type: 'SPIKE_TILE', value: Math.max(1, spikeTrail) });
    }

    let effects = [...skill.effects, ...extra];

    // Brittle Bite: the one fusion that lets Frostpod actually finish a kill.
    //
    // Note this MAPS rather than appends: on Chardslam, whose swing has no DAMAGE effect at
    // all, it does nothing. That is deliberate — 0 damage is the hero, and a material must not
    // be able to bolt a damage number onto him from the side.
    const bonusDamage = getFusionEffectValue(caster, 'BONUS_DAMAGE');
    if (bonusDamage > 0) {
        effects = effects.map(e =>
            e.type === 'DAMAGE' ? { ...e, value: (e.value || 0) + bonusDamage } : e);
    }

    // Solar Blessing's bonus, this player turn only (BLESSED is cleared before the enemy
    // phase). MAPS like BONUS_DAMAGE above — on a 0-damage kit the blessing buys the layer
    // and the element loan, never a damage number the hero was designed not to have.
    //
    // The amount is read off the BLESSED BODY (`blessPower`, stamped at cast time), not off a
    // constant: Fanged Blessing makes Sunbloom's gift worth 2. Same reason `blessedElement`
    // lives on the recipient — by the time this hero swings, the blesser is not in scope.
    if (caster.statusEffects?.includes('BLESSED')) {
        const gift = Math.max(1, caster.blessPower ?? 1);
        effects = effects.map(e =>
            e.type === 'DAMAGE' ? { ...e, value: (e.value || 0) + gift } : e);
    }

    /**
     * THE VOLLEY CAP — a multi-shot skill fires at the number the CARD PRINTS, and nothing
     * raises it.
     *
     * Sits here, after every buff that touches DAMAGE and before anything reads the finished
     * value, because that is the only position where one clamp covers all of them.
     *
     * The arithmetic is the whole argument. A volley multiplies its per-shot damage by the shot
     * count, so a +1 meant for a single hit arrives as +3 — and the buffs stack: Heavier Peas
     * (+1) plus a Fanged Blessing (+2) took Precision Blast from 6 to 12 in one click, which is
     * a mid-tier boss erased by two heroes spending one turn each. Capping the SHOT rather than
     * the total is what keeps the skill honest without touching the thing it is for: three
     * shots that never waste a pea. Her free Pea Shot still scales with everything, so the
     * upgrades and the blessing are not dead — they just cannot be multiplied by three.
     *
     * THE RELIC EXIT (design intent, not yet built): the cap is meant to be liftable by a late
     * relic — "strong, with a condition" rather than "strong". When relics exist, the lift is
     * one more clause on this `if` and nothing else in the file moves. No flag, no type and no
     * field is declared for it today: this codebase has been burned once by vocabulary that was
     * declared and never consumed (`RADIUS`), and a hook nobody can reach is the same mistake.
     */
    const volleyShots = effects.find(e => e.type === 'VOLLEY')?.value ?? 0;
    if (volleyShots > 1) {
        const printed = skill.effects.find(e => e.type === 'DAMAGE')?.value ?? 0;
        effects = effects.map(e =>
            e.type === 'DAMAGE' && (e.value ?? 0) > printed ? { ...e, value: printed } : e);
    }

    // The Spring Arm axis: every shove this hero throws travels further. Applied after the
    // ON_HIT_PUSH rider above so a fusion-granted shove gets the extra distance too. This is
    // the ONLY place the number is grown — skillResolution reads the finished value straight
    // off the effect and hands it to planPush as a tile count.
    const pushBonus = getFusionEffectValue(caster, 'PUSH_DISTANCE');
    if (pushBonus > 0) {
        effects = effects.map(e =>
            (e.type === 'PUSH' || e.type === 'PULL') ? { ...e, value: (e.value ?? 1) + pushBonus } : e);
    }

    // Thornshell's row: the shout carries further. SHIELD_SPREAD is the odd one out of this
    // group and is deliberately NOT here — it is applied in skillResolution instead, because
    // it changes who ELSE gets layered, not anything on the skill card itself.
    const provokeBonus = getFusionEffectValue(caster, 'PROVOKE_RADIUS');
    if (provokeBonus > 0) {
        effects = effects.map(e =>
            e.type === 'PROVOKE' ? { ...e, value: (e.value ?? 0) + provokeBonus } : e);
    }

    // Blizzard: turns every SLOW this caster deals into a full freeze. No fusion recipe
    // grants it since Frostpod was retired (data/heroes.ts) — it is kept live because it is
    // exactly what the ICE element is specified to do, and deleting it would mean writing
    // it again.
    if (hasFusionEffect(caster, 'UPGRADE_SLOW_TO_FREEZE')) {
        effects = effects.map(e => (e.type === 'APPLY_SLOW' ? { type: 'STUN' as const } : e));
    }

    /**
     * THE ELEMENT (rules L1 and L2). Note where it sits: AFTER Blizzard's map above, and that
     * position is the whole decision.
     *
     * Blizzard turns EVERY `APPLY_SLOW` on the skill into a `STUN`. Applied before it, the ICE
     * rider would be swept up as well — and any hero holding Blizzard plus ICE would own a free
     * stun on their free attack, every turn, forever. That is the exact ceiling this codebase
     * has been protecting on purpose for as long as the matrix has existed: it is why every
     * on-hit chill any recipe has ever granted is a SLOW and never a freeze (the STUN RULE at
     * the top of data/fusionRecipes.ts — the Ice Grenade column that once carried those cards is
     * retired, the rule is not). Handing the same thing to all nine
     * heroes through the element system would delete Frostpod's entire identity, and the price
     * for it is one max HP — the cheapest lockdown in the game by an order of magnitude.
     *
     * So Blizzard upgrades the slow the SKILL was authored with, and nothing else. Frostpod plus
     * ICE is therefore not a stun engine; she is a hero whose element is already in her kit, and
     * the dedup below means she gets nothing extra for it. That is the correct reading of the
     * element as a rule: it is a floor for heroes who lack the effect, never a multiplier for
     * the one hero built around it.
     */
    /**
     * ...and gated on the skill being able to reach an ENEMY, read off the FINISHED effect
     * list (so Shockrind's shove, grafted on a few lines above, counts).
     *
     * Without the gate the rider was appended to ally-only skills as well: Solar Blessing came
     * back carrying APPLY_BURN, and Gourdward's shells did too. Nothing ever fired — the
     * resolver only applies statuses inside the hostile branch — but the CARD said it did, and
     * a card that promises to set your own ally on fire is the kind of lie this file is
     * written not to tell.
     */
    const touchesEnemy = effects.some(e => e.type === 'DAMAGE' || e.type === 'PUSH'
        || e.type === 'PULL' || e.type === 'GLOBAL_PUSH' || e.type === 'TOSS');
    if (carriesElement && touchesEnemy) {
        elementRider(lentCaster.element).forEach(rider => {
            /**
             * No stacking a second copy of what the attack already does. `STUN` counts as an
             * existing slow because it is strictly the better version — Cornova's Nova Shell and
             * anything Blizzard just upgraded must not be dragged back down to a slow, nor pick
             * up a redundant one alongside it.
             *
             * LIGHTNING never reaches this loop: an arc is not a status. It is resolved against
             * a second tile in skillResolution (rule L3), which is why `elementRider` returns
             * nothing for it — and why a LIGHTNING hero still needs everything above this line.
             */
            const alreadyCovered = effects.some(e =>
                e.type === rider.type || (rider.type === 'APPLY_SLOW' && e.type === 'STUN'));
            if (!alreadyCovered) effects = [...effects, rider];
        });
    }

    // Armor Plate Bowling: extends the reach of every attack (incl. Rolling Charge).
    const reach = getFusionEffectValue(caster, 'ATTACK_RANGE_BONUS');
    let rangeValue = reach > 0 ? skill.rangeValue + reach : skill.rangeValue;

    /**
     * RIND PELLET (SHIELD_SHOT) — viên khiên bay dọc hàng tới 4 ô.
     *
     * Con số nằm ở đây chứ không mượn `ATTACK_RANGE_BONUS` để ô này TỰ CHỨA: tầm với và luật
     * "đậu vào thân đầu tiên bất kể phe" là một món, không phải hai thứ tình cờ đi cùng nhau.
     *
     * Không cần đổi `rangeType`: nhánh MELEE trong `getValidSkillTargets` vốn đã đi ra bốn
     * hướng và DỪNG ở thân đầu tiên mỗi hướng — đúng "bắn dọc hàng" mà thẻ bài vẫn hứa. Nghi
     * ngờ trong [C6.4] rằng +3 tầm sẽ cho "chọn tự do trong vùng 4" là sai; đã đối chiếu.
     */
    if (hasFusionEffect(caster, 'SHIELD_SHOT') && skill.effects.some(e => e.type === 'SHIELD')) {
        rangeValue = Math.max(rangeValue, 4);
    }

    // Pea Lance: the melee swing reaches further, but the shove is gone — reach
    // is bought with the push, not stacked on top of it.
    //
    // Gated on the swing still dealing damage. On Chardslam the push IS the attack, so paying
    // for reach with it would leave a skill whose entire effect list is empty — a free action
    // that does literally nothing, which reads as a broken button rather than a trade.
    if (skill.rangeType === 'MELEE' && hasDamage && hasFusionEffect(caster, 'MELEE_REACH_TRADE')) {
        rangeValue += getFusionEffectValue(caster, 'MELEE_REACH_TRADE');
        effects = effects.filter(e => e.type !== 'PUSH');
    }

    // Mortar Pea / Arcing Frost: the straight shot becomes a lobbed one. Two halves, both
    // deliberate. A LINE stops at the first unit in the way — including a friendly wall, which
    // is the friction the sprout rule manufactures every fight — while a LOB ignores everything
    // in between. But LOB range is Manhattan distance in EVERY direction, so keeping the number
    // would turn Peaburst's LINE 8 into most of the board: the arc is bought with the reach,
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
