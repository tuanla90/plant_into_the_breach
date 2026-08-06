import { Position, Skill, StatusEffectType, TurnAction, Unit, UnitType } from '../types';
import { calculateDamage, getSkillTargetPath, getTileAt, planPush, survivesWater, wingTwin } from './gameLogic';
import { getFusionEffects, getFusionEffectValue, hasFusionEffect } from './fusion';
import { applyPushPlan, pushKill, type ResolveContext } from './actionBuilders';
import { chainDamageFor, chainStep, skillCarriesElement } from './elements';

/**
 * EVERY HERO ATTACK IN THE GAME, RESOLVED.
 *
 * This was ~300 lines inside App.tsx's click handler — the rules for pierce, splash, the
 * Repeater's second pass, digestion, every status and every push all reachable only by
 * clicking a tile in a rendered React tree. That is why the fusion bugs in here were each
 * found by playing rather than by reading, and why none of it could be exercised by the
 * tutorial replay without a hand-copied twin (utils/scriptedReplay).
 *
 * It is a pure function: units, board and terrain in, TurnAction[] out. Nothing is mutated
 * except the simulation map it builds for itself.
 *
 * The caller still owns the two things that are NOT actions: spending the Sun (which must be
 * inside the snapshot handed to the engine) and burning a Sun charge.
 */
export const planSkillActions = (
    caster: Unit,
    /** Fusion effects must already be folded in — see applyFusionToSkill. */
    skill: Skill,
    pos: Position,
    ctx: ResolveContext,
): TurnAction[] => {
    const { units, board, terrainDefs, resonance } = ctx;
    const actions: TurnAction[] = [];

    actions.push({
        type: 'UNIT_ATTACK',
        unitId: caster.id,
        targetPos: pos,
        attackRange: skill.rangeType,
    });

    // Check for POWER TILE boost
    let damageBoost = 0;
    const standingTile = getTileAt(caster.position, board);
    if (standingTile?.environment === 'POWER_TILE') {
        damageBoost = 1;
    }

    const targets = [pos];
    const hasPierce = skill.effects.some(e => e.type === 'PIERCE_ATTACK');

    const hasRadialPush = skill.rangeType === 'SELF'
        && skill.effects.some(e => e.type === 'PUSH' || e.type === 'PULL');

    // Encase's shape (PLAN-hero-zephyr §6.3): a PAID self-shield covers the caster AND the
    // four tiles beside him — under layers the worth of a shield skill is breadth. Gated on
    // the Sun cost so the bench plants' free self-shells (Harden, Iron Stance) stay personal.
    const hasRadialShield = skill.rangeType === 'SELF'
        && (skill.sunCost ?? 0) > 0
        && skill.effects.some(e => e.type === 'SHIELD');

    if (skill.rangeType === 'DASH' || skill.rangeType === 'LINE') {
        if (hasPierce) {
            const path = getSkillTargetPath(caster, skill, pos, board);
            path.forEach(p => {
                if (p.x !== pos.x || p.y !== pos.y) targets.push(p);
            });
        }
    } else if (skill.id === 'gust') {
        targets.length = 0;
        units.filter(u => u.isEnemy).forEach(u => {
            targets.push(u.position);
        });
    } else if (hasRadialPush) {
        // SELF-range push (Seismic Slam, Bounce Away) hits every adjacent tile.
        // Without this the skill resolved against the caster's own tile and did nothing.
        targets.length = 0;
        [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].forEach(o => {
            const t = { x: caster.position.x + o.x, y: caster.position.y + o.y };
            if (t.x >= 0 && t.x < 8 && t.y >= 0 && t.y < 8) targets.push(t);
        });
    } else if (skill.rangeType === 'WING_PAIR') {
        // The aimed cell selects a HEADING; its twin fires with it (utils/gameLogic,
        // wingTwin). Two cells, two separate instances — which is exactly how a layer reads
        // them: the first pops it, the second lands (§6.0, decision 15).
        const tw = wingTwin(caster.position, pos);
        if (tw.x >= 0 && tw.x < 8 && tw.y >= 0 && tw.y < 8
            && !(tw.x === pos.x && tw.y === pos.y)) {
            targets.push(tw);
        }
    } else if (hasRadialShield) {
        // Self plus the four beside him, allies filtered by the SHIELD branch itself.
        targets.length = 0;
        targets.push(caster.position);
        [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].forEach(o => {
            const t = { x: caster.position.x + o.x, y: caster.position.y + o.y };
            if (t.x >= 0 && t.x < 8 && t.y >= 0 && t.y < 8) targets.push(t);
        });
    }

    // Cob Cannon: the butter splatters onto the four neighbouring tiles.
    // Gated on the skill costing Sun — the same effect on a free basic attack would
    // be splash damage every turn for nothing, which is a different (and much
    // stronger) game than the one this fusion is priced for. NOTE: allies in the
    // splash ring take the damage since friendly fire — aim the big shots accordingly.
    //
    // THE RING IS HALF-STRENGTH. Splash tiles used to resolve the FULL skill — Needle
    // Bloom's card said "4 to the target, 2 around it" while the engine dealt 4 everywhere,
    // and Butter Splat's ring landed a full STUN on five tiles at once, which is the free
    // mass-stun the STUN RULE in data/fusionRecipes.ts exists to ban. Membership in this
    // set is what resolveTargets uses to halve damage and shield, and to soften STUN to
    // SLOW — one rule, and all three splash cards read true at once.
    const splashRing = new Set<string>();
    if ((skill.sunCost ?? 0) > 0 && hasFusionEffect(caster, 'SKILL_SPLASH')) {
        [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].forEach(o => {
            const t = { x: pos.x + o.x, y: pos.y + o.y };
            if (t.x >= 0 && t.x < 8 && t.y >= 0 && t.y < 8) {
                targets.push(t);
                splashRing.add(`${t.x},${t.y}`);
            }
        });
    }

    // ADJACENT_STRIKE: the free melee swing lands on everything beside the hero, not only the
    // body it was aimed at. Built on SKILL_SPLASH above, with both of its lessons inverted:
    //
    //  - SPLASH is gated on the skill COSTING Sun, because free splash every turn is a much
    //    stronger game than the one it is priced for. This one is gated the other way, on the
    //    attack being FREE, because a swing that fires every turn IS the fusion — putting it
    //    on the paid skill as well would just be splash a second time.
    //  - SPLASH accepts friendly fire: one big deliberate shot, aim it properly. A swing that
    //    happens every single turn cannot, or it would quietly grind down whichever ally is
    //    standing beside the hero — so this only ever adds tiles that hold something hostile.
    if (!skill.sunCost && skill.rangeType === 'MELEE' && hasFusionEffect(caster, 'ADJACENT_STRIKE')) {
        [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].forEach(o => {
            const t = { x: caster.position.x + o.x, y: caster.position.y + o.y };
            if (t.x < 0 || t.x >= 8 || t.y < 0 || t.y >= 8) return;
            if (targets.some(p => p.x === t.x && p.y === t.y)) return;
            const occupant = units.find(u => u.hp > 0 && u.position.x === t.x && u.position.y === t.y);
            if (occupant && (occupant.isEnemy || occupant.type === UnitType.OBSTACLE)) targets.push(t);
        });
    }

    // --- CRITICAL FIX: CREATE TEMP UNIT MAP TO SIMULATE HP LOSS WITHOUT MUTATING STATE ---
    // This prevents the "Double Damage" bug where modifying targetUnit.hp directly caused
    // the state reducer to subtract damage from an already reduced value.
    const tempUnits = new Map<string, Unit>(units.map(u => [u.id, { ...u }]));
    // Only living units occupy a tile in the simulation. Units killed earlier in this
    // same resolution must stop blocking pushes and stop being valid targets.
    // ...and anything under the sand. This ONE predicate is why the burrow rule did not become
    // five: the pierced lane, the splash ring, the lightning arc, the Repeater's second shot
    // and Blover's sweep all route through here and NONE of them go anywhere near
    // getValidSkillTargets. Filtering only at the door would have missed every one.
    const getTempUnit = (p: Position) => Array.from(tempUnits.values())
        .find(u => u.hp > 0 && !u.isBurrowed && u.position.x === p.x && u.position.y === p.y);

    /**
     * COLLISION_BONUS — extra damage for bodies THIS hero slams into something.
     *
     * The base collision point is dealt inside applyPushPlan (utils/actionBuilders.ts), which
     * knows nothing about the pusher's fusions and is shared with the hazard, item and enemy
     * shoves. Rather than teach every one of those about a fusion only a hero can carry, the
     * extra is charged here, on top of whatever the plan already billed. STEADFAST is honoured
     * exactly as it is there: a braced unit takes nothing from a slam, so there is nothing to
     * add to.
     */
    const collisionBonus = getFusionEffectValue(caster, 'COLLISION_BONUS');
    const applyCollisionBonus = (plan: { collided: string[] }) => {
        if (collisionBonus <= 0) return;
        plan.collided.forEach(id => {
            const u = tempUnits.get(id);
            // Already dead from the base collision, the drown or the attack itself.
            if (!u || u.hp <= 0) return;
            if (hasFusionEffect(u, 'STEADFAST')) return;
            // Same door the base collision point uses: a slam ignores helmet armour.
            const r = calculateDamage(u, collisionBonus, false, true);
            if (r.shieldDamage > 0) {
                actions.push({ type: 'APPLY_DAMAGE', targetId: id, amount: 0, eventType: 'BLOCK', pos: u.position });
                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: id, updates: { shield: r.remainingShield } });
            }
            if (r.finalDamage > 0) {
                actions.push({ type: 'APPLY_DAMAGE', targetId: id, amount: r.finalDamage, eventType: 'DAMAGE', pos: u.position });
            }
            if (r.bleedConsumed) {
                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: id, updates: { statusEffects: [...u.statusEffects] } });
            }
            u.hp = r.remainingHp;
            u.shield = r.remainingShield;
            if (r.isFatal) pushKill(actions, u, caster);
        });
    };

    // `damageOverride` is how the Repeater's second pass lands for less than the
    // first. Passing it here rather than mutating the skill keeps the first pass
    // reading the authored number. `targetList` lets that second pass re-aim (the
    // roll-over below) without disturbing the first pass's target set.
    const resolveTargets = (damageOverride?: number, targetList: Position[] = targets) => targetList.forEach(targetPos => {
        const targetUnit = getTempUnit(targetPos);
        const isSelf = targetPos.x === caster.position.x && targetPos.y === caster.position.y;
        // Half-strength ring — see the SKILL_SPLASH note above. Read once per tile so the
        // damage, the shield and the stun-softening below cannot disagree about membership.
        const isSplash = splashRing.has(`${targetPos.x},${targetPos.y}`);

        if (skill.effects.some(e => e.type === 'TERRAIN_MOD')) {
            if (skill.id === 'ignite') {
                actions.push({ type: 'MODIFY_TERRAIN', pos: targetPos, environment: 'FIRE' });
                actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'BURN', pos: targetPos });
            }
        }

        // Reinforce on a HOUSE (PLAN-hero-zephyr §6.3): no unit stands there — the layer
        // lives on the tile (TileData.shielded) and the brain bite consumes it in
        // turnManager. Idempotent like every layer: a shielded house gains nothing more.
        if (!getTempUnit(targetPos) && skill.effects.some(e => e.type === 'SHIELD')) {
            const houseTile = getTileAt(targetPos, board);
            if (houseTile?.isHouse && houseTile.hasBrain && !houseTile.shielded) {
                actions.push({ type: 'MODIFY_TERRAIN', pos: { ...targetPos }, shielded: true });
                actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'BLOCK', pos: targetPos });
            }
        }

        if (targetUnit && !targetUnit.isEnemy) {
            skill.effects.forEach(e => {
                if (e.type === 'HEAL') actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: e.value || 0, eventType: 'HEAL', pos: targetPos });
                if (e.type === 'SHIELD') {
                    /**
                     * A shield is a LAYER now (PLAN-hero-zephyr §6.0): granting one to a body
                     * that already has one is a no-op, never a stack — which is also why
                     * every cap that used to police shield totals is gone. The authored
                     * `value` only answers "does this effect grant at all" (splash ring
                     * included: half of any positive shell still rounds to a real layer).
                     *
                     * SHIELD_SPREAD (the old SHIELD_BONUS's replacement — "+2 size" cannot
                     * exist when shields have no size): the caster's layers spill over,
                     * covering whoever stands beside the recipient too.
                     */
                    if ((e.value || 0) > 0 && (targetUnit.shield || 0) === 0) {
                        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { shield: 1 } });
                        // Keep the simulation in step, so a second pass sees the layer.
                        targetUnit.shield = 1;
                        actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'BLOCK', pos: targetPos });
                    }
                    if ((e.value || 0) > 0 && hasFusionEffect(caster, 'SHIELD_SPREAD')) {
                        [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].forEach(d => {
                            const n = getTempUnit({ x: targetPos.x + d.x, y: targetPos.y + d.y });
                            if (n && !n.isEnemy && (n.shield || 0) === 0) {
                                n.shield = 1;
                                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: n.id, updates: { shield: 1 } });
                                actions.push({ type: 'APPLY_DAMAGE', targetId: n.id, amount: 0, eventType: 'BLOCK', pos: n.position });
                            }
                        });
                    }
                }
                if (e.type === 'REFRESH_ACTION') {
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { hasMoved: false, hasAttacked: false } });
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'BUFF', pos: targetPos });
                }
                if (e.type === 'BLESS') {
                    /**
                     * Solar Blessing (PLAN-hero-zephyr §6.1): +1 damage until the END OF THIS
                     * PLAYER TURN — bless first, then swing; the decay in turnManager makes a
                     * blessing after the ally has acted a wasted cast. The element LOAN rides
                     * the same status: only into an empty hand (own element wins), spent by
                     * the same decay.
                     */
                    const updates: Partial<Unit> = {};
                    if (!targetUnit.statusEffects.includes('BLESSED')) {
                        const blessed: StatusEffectType[] = [...targetUnit.statusEffects, 'BLESSED'];
                        updates.statusEffects = blessed;
                        targetUnit.statusEffects = blessed;
                    }
                    if (caster.element && !targetUnit.element && !targetUnit.blessedElement) {
                        updates.blessedElement = caster.element;
                        targetUnit.blessedElement = caster.element;
                    }
                    if (Object.keys(updates).length > 0) {
                        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates });
                    }
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'BUFF', pos: targetPos });
                }
                if (e.type === 'BUFF_STAT') {
                    const amount = e.value || 0;
                    const updates = e.stat === 'HP'
                        ? { maxHp: targetUnit.maxHp + amount, hp: targetUnit.hp + amount }
                        : { damage: targetUnit.damage + amount };
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates });
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'BUFF', pos: targetPos });
                }
            });
        }

        const resEffect = skill.effects.find(e => e.type === 'RESOURCE_GAIN');
        if (resEffect && isSelf) {
            actions.push({ type: 'RESOURCE_GAIN', amount: resEffect.value, resource: 'SUN' });
            actions.push({ type: 'APPLY_DAMAGE', targetId: caster.id, amount: resEffect.value || 0, eventType: 'SUN', pos: caster.position });
        }

        const chargeEffect = skill.effects.find(e => e.type === 'CHARGE_SUN');
        if (chargeEffect && isSelf) {
            actions.push({ type: 'UPDATE_UNIT_STATE', unitId: caster.id, updates: { sunCharge: 1 } });
            actions.push({ type: 'APPLY_DAMAGE', targetId: caster.id, amount: 0, eventType: 'BUFF', pos: caster.position });
        }

        // FRIENDLY FIRE: an ally standing where a damaging skill lands is a combat target
        // like any other — same damage, same status, same shove. Allied bodies always
        // STOPPED the shot; taking the hit too is what makes lane discipline real. Only
        // the caster is exempt (reachable solely through their own splash ring).
        const friendlyFire = !!targetUnit
            && !targetUnit.isEnemy
            && targetUnit.id !== caster.id
            && skill.effects.some(e => e.type === 'DAMAGE');
        if (targetUnit && (targetUnit.isEnemy || targetUnit.type === UnitType.OBSTACLE || friendlyFire)) {
            const dmgEffect = skill.effects.find(e => e.type === 'DAMAGE');
            let isDead = false;

            if (dmgEffect) {
                // The override replaces the authored damage outright; terrain and
                // buff boosts still apply on top, same as the first shot.
                let rawDmg = (damageOverride ?? (dmgEffect.value || 0)) + damageBoost;
                /**
                 * Chomper's swallow is an instant kill, but some things cannot be eaten.
                 *
                 * `isMassive` alone was enough while the Gargantuar was the only boss in the
                 * game — it is massive, so the check covered it by accident rather than on
                 * purpose. It stopped covering anything the moment bosses started shipping
                 * that are deliberately NOT massive (data/bosses.ts: only three of the nine
                 * resist a shove, because two shove heroes need work in the other six). The
                 * Headliner, the Colossus and every boss after them were one 75-Sun button
                 * away from being deleted on the turn they appeared.
                 *
                 * So the rule is named rather than inferred: a NAMED BOSS is not food. Maw's
                 * reward for beating the Gargantuar is an executioner for thick regular
                 * units — it was never meant to be a key that skips the next eight fights.
                 *
                 * The bite itself is 7 now rather than 999 (data/heroes.ts), so this line is
                 * no longer holding back an instant kill — it is holding back a large hit.
                 * That is a much smaller thing to get wrong, which is the point of having
                 * changed the number: the exception stopped being load-bearing.
                 */
                if (skill.id === 'burrow_strike' && (targetUnit.isMassive || targetUnit.bossId)) rawDmg = 1;
                // The splash ring lands at half strength, floored — Needle Bloom's 4 bursts
                // for 2, and Butter Splat's ring (1 damage) grazes for 0 and only chills.
                if (isSplash) rawDmg = Math.floor(rawDmg / 2);
                const totalDmg = rawDmg;
                // Use tempUnit for calculation (safe)
                const result = calculateDamage(targetUnit, totalDmg, hasPierce);

                if (result.shieldDamage > 0) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'BLOCK', pos: targetPos });
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { shield: result.remainingShield } });
                }

                // A hit the helmet zeroed out must CLANG. Silence here reads as a bug — the
                // player clicked, the animation played, and nothing happened — when what
                // actually happened is a rule they need to learn: bring a bigger answer.
                if (result.absorbedByArmor) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'BLOCKED', pos: targetPos });
                }

                if (result.finalDamage > 0) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: result.finalDamage, eventType: 'DAMAGE', pos: targetPos });

                    // UPDATE TEMP UNIT ONLY - Do not touch real State 'units'
                    targetUnit.hp = result.remainingHp;
                    targetUnit.shield = result.remainingShield;
                }
                // The wound was spent (+1 already inside finalDamage) — clear the icon too.
                if (result.bleedConsumed) {
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: [...targetUnit.statusEffects] } });
                }

                // The battle ledger. Shield damage counts — chewing armour is work the squad
                // did — but friendly fire does not: hurting your own wall is a cost, and a
                // ledger that prints costs as output teaches the player to farm their tank.
                const ledgered = result.shieldDamage + result.finalDamage;
                if (caster.heroId && targetUnit.isEnemy && targetUnit.type !== UnitType.OBSTACLE && ledgered > 0) {
                    actions.push({ type: 'TRACK_STAT', heroId: caster.heroId, stat: 'damageDealt', amount: ledgered });
                }

                if (result.isFatal) {
                    isDead = true;
                    pushKill(actions, targetUnit, caster);
                    targetUnit.hp = 0; // Mark dead in temp

                    // SHIELD_ON_KILL: a finish raises a fresh LAYER (PLAN-hero-zephyr §6.0) —
                    // already shielded means nothing more to gain, which is the layer model's
                    // own cap, so the per-recipe `cap` field is no longer consulted. Obstacles
                    // are excluded for the same reason SUN_ON_KILL excludes them — a rock is
                    // scenery, and a board with three of them would hand out free armour.
                    const casterSim = tempUnits.get(caster.id);
                    if (casterSim && targetUnit.isEnemy && targetUnit.type !== UnitType.OBSTACLE
                        && (casterSim.shield || 0) === 0
                        && hasFusionEffect(caster, 'SHIELD_ON_KILL')) {
                        casterSim.shield = 1;
                        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: caster.id, updates: { shield: 1 } });
                        actions.push({ type: 'APPLY_DAMAGE', targetId: caster.id, amount: 0, eventType: 'BLOCK', pos: casterSim.position });
                    }
                }
            }

            const stunImmune = targetUnit.immunities.includes('STATUS') || targetUnit.immunities.includes('FREEZE');
            // Blizzard turns every one of Frostpod's slows into a freeze — which, on a
            // FREEZE-immune target, used to turn her capstone fusion into a straight
            // DOWNGRADE: the slow she would have landed was upgraded into a status the
            // target ignores. The chill still lands, it just fails to set.
            const chillFallback = hasFusionEffect(caster, 'UPGRADE_SLOW_TO_FREEZE')
                && !targetUnit.immunities.includes('STATUS');
            if (!isDead && skill.effects.some(e => e.type === 'STUN')) {
                if (isSplash) {
                    // Cob Cannon: the RING is chilled, never pinned. A stun on five tiles for
                    // one cast is the mass lost-turn the STUN RULE bans; the card says "slows
                    // surrounding tiles" and this branch is that sentence. STATUS immunity
                    // still refuses it — that is the Screen Door's whole job.
                    if (targetUnit.immunities.includes('STATUS')) {
                        actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'IMMUNE', pos: targetPos });
                    } else if (!targetUnit.statusEffects.includes('SLOW')) {
                        const chilled: StatusEffectType[] = [...targetUnit.statusEffects, 'SLOW'];
                        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: chilled } });
                        targetUnit.statusEffects = chilled;
                    }
                } else if (stunImmune && !chillFallback) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'IMMUNE', pos: targetPos });
                } else if (stunImmune && chillFallback) {
                    if (!targetUnit.statusEffects.includes('SLOW')) {
                        const slowed: StatusEffectType[] = [...targetUnit.statusEffects, 'SLOW'];
                        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: slowed } });
                        targetUnit.statusEffects = slowed;
                    }
                } else if (!targetUnit.statusEffects.includes('STUN')) {
                    const stunned: StatusEffectType[] = [...targetUnit.statusEffects, 'STUN'];
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: stunned } });
                    targetUnit.statusEffects = stunned;
                }
            }

            // Frostpod's baseline: costs the target ground rather than its whole turn.
            //
            // SLOW deliberately does NOT check FREEZE immunity. It used to, and the
            // knock-on effect landed squarely on the fight that decides a run: the
            // Gargantuar is PUSH- and FREEZE-immune and Massive, so the push, the
            // freeze, the butter AND the slow were all blanked at once — Ironhusk,
            // Frostpod, Cobb and Maw were each reduced to 1-2 chip damage a turn, and
            // squad select quietly became "bring damage or lose the boss". Something
            // too heavy to freeze solid can still be chilled into moving slower.
            // STATUS immunity (Screen Door) still stops everything: that is its job.
            //
            // ICE RESONANCE — a slow landing on something ALREADY slowed sets instead of chills.
            //
            // The condition is what makes this a rule and not a stat: a lone ICE hero can never
            // trigger it, because SLOW is wiped by NEW_TURN_RESET at the end of every turn, so
            // the first slow and the second have to land inside the SAME player turn. That means
            // two heroes, or one hero attacking twice — a play the squad has to set up, which is
            // exactly what an all-in commitment should be buying.
            //
            // FREEZE immunity IS checked here, and only here, which looks like a contradiction
            // of the long note below until you read what is being applied: the fallback branch
            // lands a SLOW (never checked against FREEZE, deliberately), this branch lands a
            // STUN. A Gargantuar that cannot be frozen still gets chilled by the plain slow it
            // was always going to get; it just never escalates.
            //
            // BLIZZARD does not interact with this at all, and that is by construction rather
            // than by luck. applyFusionToSkill maps every APPLY_SLOW to STUN *before* the skill
            // reaches this function, so a Blizzard carrier never enters this block — its slows
            // are already stuns, on the first hit, with no set-up and against a fresh target.
            // Blizzard therefore stays strictly the stronger effect and loses none of its value,
            // and the two can never compound into "stun, then stun harder": there is only ever
            // one STUN on a unit, and this branch refuses to add a second.
            if (!isDead && skill.effects.some(e => e.type === 'APPLY_SLOW')) {
                if (targetUnit.immunities.includes('STATUS')) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'IMMUNE', pos: targetPos });
                } else if (resonance === 'ICE'
                    && targetUnit.statusEffects.includes('SLOW')
                    && !targetUnit.statusEffects.includes('STUN')
                    && !targetUnit.immunities.includes('FREEZE')) {
                    // The chill it already carries is left in place: STUN is what stops the turn,
                    // and dropping the SLOW would quietly make the escalation a downgrade once
                    // the stun wears off in the same NEW_TURN_RESET that would have cleared both.
                    const frozen: StatusEffectType[] = [...targetUnit.statusEffects, 'STUN'];
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: frozen } });
                    targetUnit.statusEffects = frozen;
                } else if (!targetUnit.statusEffects.includes('SLOW')) {
                    const slowed: StatusEffectType[] = [...targetUnit.statusEffects, 'SLOW'];
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: slowed } });
                    targetUnit.statusEffects = slowed;
                }
            }

            // Fire Pea / Flame Thrower: a fusion that sets whatever it hits alight.
            // BURN then ticks in turnManager's environment phase and expires after a turn.
            if (!isDead && skill.effects.some(e => e.type === 'APPLY_BURN')) {
                if (targetUnit.immunities.includes('BURN')) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'IMMUNE', pos: targetPos });
                } else if (!targetUnit.statusEffects.includes('BURN')) {
                    const burning: StatusEffectType[] = [...targetUnit.statusEffects, 'BURN'];
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: burning } });
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'BURN', pos: targetPos });
                    targetUnit.statusEffects = burning;
                }
            }

            /**
             * BLEEDING — deliberately OUTSIDE the STATUS immunity gate every other status
             * respects (PLAN-hero-zephyr §8, decision 13): it is a physical wound, not mind
             * control, and bosses bleed too. A gear that goes cold in exactly the nine
             * fights that matter most would not be worth its slot. No stacking — bitten
             * twice is still one wound.
             */
            if (!isDead && skill.effects.some(e => e.type === 'APPLY_BLEED')) {
                if (!targetUnit.statusEffects.includes('BLEEDING')) {
                    const bleeding: StatusEffectType[] = [...targetUnit.statusEffects, 'BLEEDING'];
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: bleeding } });
                    targetUnit.statusEffects = bleeding;
                }
            }

            if (!isDead && skill.effects.some(e => e.type === 'HYPNOTIZE')) {
                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { isEnemy: false, statusEffects: [...targetUnit.statusEffects, 'HYPNOTIZED'] } });
                actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'BUFF', pos: targetPos });
            }

            const pushEffect = skill.effects.find(e => e.type === 'PUSH' || e.type === 'PULL' || e.type === 'GLOBAL_PUSH');
            if (!isDead && pushEffect && targetUnit.immunities.includes('PUSH')) {
                actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'IMMUNE', pos: targetPos });
            } else if (!isDead && pushEffect) {
                let dx = 0, dy = 0;

                if (pushEffect.type === 'GLOBAL_PUSH') {
                    const gx = Math.sign(pos.x - caster.position.x);
                    const gy = Math.sign(pos.y - caster.position.y);
                    dx = gx; dy = gy;
                } else {
                    dx = targetPos.x - caster.position.x;
                    dy = targetPos.y - caster.position.y;

                    if (Math.abs(dx) > Math.abs(dy)) { dx = Math.sign(dx); dy = 0; }
                    else { dy = Math.sign(dy); dx = 0; }

                    if (pushEffect.type === 'PULL') {
                        dx = -dx; dy = -dy;
                    }
                }

                // Read from the simulation, not live state: a unit killed earlier in
                // this same resolution no longer blocks the push.
                const livingSim = Array.from(tempUnits.values()).filter(u => u.hp > 0);
                // A PUSH's `value` is a DISTANCE in tiles. Chardwall throws 2, and the
                // PUSH_DISTANCE fusions add to that number in applyFusionToSkill, so this is
                // the single place the whole game reads it. Every shove authored before
                // Chardwall carries value 1 and GLOBAL_PUSH carries none, which is what the
                // fallback preserves — nothing existing changes reach.
                const pushTiles = pushEffect.type === 'GLOBAL_PUSH' ? 1 : (pushEffect.value ?? 1);
                const plan = planPush(targetUnit, dx, dy, livingSim, board, terrainDefs, 3, new Set(), pushTiles);
                applyPushPlan(plan, actions, tempUnits, caster);
                applyCollisionBonus(plan);
            }

            /**
             * VAULT TOSS (PLAN-hero-zephyr §6.2) — the judo throw. Not a push: the body does
             * not slide through tiles, it goes OVER the caster's head to the mirrored tile
             * (2·C − T). Targeting already refused any aim whose landing tile is not free
             * (getValidSkillTargets), so by the time we are here the destination holds
             * nobody; it is re-checked against the simulation anyway, because an earlier
             * effect this same cast may have moved someone.
             */
            const tossEffect = skill.effects.find(e => e.type === 'TOSS');
            if (!isDead && tossEffect && targetUnit.isEnemy) {
                if (targetUnit.immunities.includes('PUSH')) {
                    // Massive: the grip has nothing it can lift. Same door the shove uses.
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'IMMUNE', pos: targetPos });
                } else {
                    const dest = {
                        x: 2 * caster.position.x - targetUnit.position.x,
                        y: 2 * caster.position.y - targetUnit.position.y,
                    };
                    const destTile = getTileAt(dest, board);
                    const occupied = Array.from(tempUnits.values())
                        .some(u => u.hp > 0 && !u.isBurrowed && u.position.x === dest.x && u.position.y === dest.y);
                    if (destTile && !occupied
                        && destTile.terrain !== 'WALL' && destTile.terrain !== 'MOUNTAIN'
                        && !destTile.isHouse) {
                        // UNIT_MOVE, so mines, spikes and dust greet the landing exactly as
                        // they greet every other way a body arrives on a tile.
                        actions.push({ type: 'UNIT_MOVE', unitId: targetUnit.id, path: [dest] });
                        targetUnit.position = { ...dest };

                        if (destTile.terrain === 'WATER' && !survivesWater(targetUnit)) {
                            // The sea finishes what the throw started — planPush's own rule.
                            actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'DROWN', pos: dest });
                            pushKill(actions, targetUnit, caster);
                            targetUnit.hp = 0;
                            isDead = true;
                        } else {
                            // THE FALL: collision damage, not a DAMAGE effect — armour is
                            // bypassed like every slam, COLLISION_BONUS scales it (Grand
                            // Chard turns the 1 into 3), and a layer eats it whole.
                            const fall = 1 + getFusionEffectValue(caster, 'COLLISION_BONUS');
                            const r = calculateDamage(targetUnit, fall, false, true);
                            if (r.shieldDamage > 0) {
                                actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'BLOCK', pos: dest });
                                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { shield: r.remainingShield } });
                            }
                            if (r.finalDamage > 0) {
                                actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: r.finalDamage, eventType: 'DAMAGE', pos: dest });
                            }
                            if (r.bleedConsumed) {
                                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: [...targetUnit.statusEffects] } });
                            }
                            targetUnit.hp = r.remainingHp;
                            targetUnit.shield = r.remainingShield;
                            if (caster.heroId && r.finalDamage > 0) {
                                actions.push({ type: 'TRACK_STAT', heroId: caster.heroId, stat: 'damageDealt', amount: r.finalDamage });
                            }
                            if (r.isFatal) {
                                pushKill(actions, targetUnit, caster);
                                targetUnit.hp = 0;
                                isDead = true;
                            }
                        }
                    }
                }
            }
        }
    });

    /**
     * TAUNT — resolved OUTSIDE the per-tile loop, on purpose.
     *
     * Provoke's rangeType is SELF, so `targets` holds nothing but the caster's own tile and
     * resolveTargets would never once look at the enemies this is aimed at. The reach is the
     * effect's `value`, measured from the caster in Manhattan distance like every other range
     * in the game — the geometry is a ring around the shouter, not a shape aimed at a tile.
     */
    const tauntEffect = skill.effects.find(e => e.type === 'TAUNT');
    if (tauntEffect) {
        const radius = tauntEffect.value ?? 1;
        units.forEach(u => {
            // Obstacles are excluded even though they are hostile: a rock does not walk, so
            // redirecting it is a wasted 50 Sun and a confusing status icon.
            if (!u.isEnemy || u.hp <= 0 || u.type === UnitType.OBSTACLE) return;
            const dist = Math.abs(u.position.x - caster.position.x) + Math.abs(u.position.y - caster.position.y);
            if (dist > radius) return;

            if (u.immunities.includes('STATUS')) {
                actions.push({ type: 'APPLY_DAMAGE', targetId: u.id, amount: 0, eventType: 'IMMUNE', pos: u.position });
                return;
            }

            // Never fall back to `u` itself: that array belongs to the caller, and this
            // function is only allowed to write to its own simulation.
            const sim = tempUnits.get(u.id);
            if (!sim) return;
            const taunted: StatusEffectType[] = sim.statusEffects.includes('TAUNTED')
                ? sim.statusEffects
                : [...sim.statusEffects, 'TAUNTED'];
            // `tauntedBy` is rewritten even when the status is already set. Whoever shouted
            // last owns the enemy — otherwise a second Provoke would land as a silent no-op
            // on anything still pointed at a taunter that has since died.
            actions.push({
                type: 'UPDATE_UNIT_STATE',
                unitId: u.id,
                updates: { statusEffects: taunted, tauntedBy: caster.id },
            });
            actions.push({ type: 'APPLY_DAMAGE', targetId: u.id, amount: 0, eventType: 'BUFF', pos: u.position });
            sim.statusEffects = taunted;
            sim.tauntedBy = caster.id;
        });
    }

    resolveTargets();

    /**
     * RULE L3 — the LIGHTNING arc (PLAN-progression.md section 3).
     *
     * One extra resolution, against ONE tile beside the tile the player aimed at. Everything
     * that makes this correct is in the three words "once, from `pos`, `damageOverride`":
     *
     *  - ONCE, and from the PRIMARY target only. A multi-tile attack (a PIERCE_ATTACK lane
     *    once, Zephyr's WING_PAIR today) resolves against several tiles, so arcing from every
     *    tile in `targets` would double the hit count for nothing. `targetList` is a single
     *    tile, chosen off `pos`, and the other struck tiles never arc.
     *  - THROUGH `damageOverride`, which is why this reuses resolveTargets instead of copying
     *    the effect list the way SKILL_SPLASH does. Maw's Devour is `DAMAGE 999`; a naive copy
     *    would carry 499 into the next tile — the Melon-splash bug again. The override replaces
     *    the authored number outright with the HERO's stat, so Maw (damage 2) arcs for 1.
     *  - WITH THE WHOLE ATTACK, not just its damage. chainDamageFor has no minimum, so
     *    Chardwall arcs for 0 — and that cell would be a dead no-op if the arc were damage.
     *    Routed through resolveTargets it carries the SHOVE as well, so his one arc is a single
     *    swing that throws two bodies. That is the best cell he has, and it falls out for free.
     *
     * Target choice is CHAIN_OFFSETS order, first match wins: right, left, down, up. Fixed, not
     * random — a game that promises perfect information cannot roll dice inside a resolution,
     * and a player who learns the order can aim the arc. Read off the simulation AFTER the main
     * pass, so a body the attack just killed or shoved is not arced at where it used to be.
     *
     * LIGHTNING RESONANCE adds exactly one more hop, jumping on from the tile the arc just
     * struck. Everything above holds unchanged for it — same offsets in the same order, same
     * chainDamageFor (no falloff: halving a half is 0 for most of the roster, which would make
     * the reward for committing three heroes an animation), and the same "never a tile this
     * resolution already touched" rule, now extended to cover the first arc as well. `struck`
     * is what carries that across the hops.
     */
    if (caster.element === 'LIGHTNING' && skillCarriesElement(skill, caster)) {
        /**
         * Every tile this chain is forbidden to strike: the attack's own footprint (pierced
         * lane, splash ring, the primary target) plus each tile already arced to. The arc is
         * always a NEW body, never a second hit on one the swing has already paid for.
         */
        // Seeded with the attack's own footprint and the caster's square: an arc that came
        // back to either is not a chain. `chainStep` reads this and adds to it (utils/elements.ts).
        const struck = new Set(targets.map(t => `${t.x},${t.y}`));
        struck.add(`${caster.position.x},${caster.position.y}`);

        let from = pos;
        for (let hop = 0; hop < (resonance === 'LIGHTNING' ? 2 : 1); hop++) {
            // One hop per iteration, not the whole chain in one call: hop two has to see the
            // board hop one left behind (`getTempUnit` carries the damage already dealt).
            const [next] = chainStep(from, getTempUnit,
                // Obstacles are skipped for the same reason Provoke skips them: an arc spent
                // on scenery is an arc the player cannot use.
                u => u.isEnemy && u.type !== UnitType.OBSTACLE, struck);
            // A chain that runs out of bodies simply stops. No searching further afield: the
            // arc is adjacency, and a hop that skipped a gap would be a second attack.
            if (!next) break;
            const arcPos = { ...next.position };
            // Animated as a shot regardless of what the parent skill was — the arc leaves the
            // hero, not the tile it jumped from, and a melee lunge at a tile two steps away
            // reads as a bug.
            actions.push({ type: 'UNIT_ATTACK', unitId: caster.id, targetPos: arcPos, attackRange: 'LINE', isArc: true });
            resolveTargets(chainDamageFor(caster), [arcPos]);
            from = arcPos;
        }
    }

    // A fused Repeater sends a second, WEAKER shot after the free basic attack. The
    // second pass reads the HP left by the first (tempUnits carries it).
    //
    // The second shot is not allowed to FIZZLE. It used to resolve against the same
    // tile and skip corpses, so whenever the first pea killed, the second one simply
    // vanished — the same click dealt 2+1 into a tank and plain 2 into a kill, and
    // players filed the mismatch as a bug. On a LINE skill an overkill second shot now
    // rolls over: it flies past the corpse to the next body in the lane, exactly as a
    // real pea would. Any body still stops it (an ally blocker takes no damage — the
    // resolver only hurts enemies and obstacles), and mountains still end the lane.
    /**
     * Where the NEXT shot goes: the tile clicked, unless whatever stood there is dead, in
     * which case the pea carries on down the lane to the first body still standing.
     *
     * Lifted out of the Repeater's second shot because the volley needs exactly the same walk,
     * twice more. Any body stops it (an ally blocker simply takes nothing — the resolver only
     * hurts enemies and obstacles) and a mountain ends the lane.
     */
    const rollOverFrom = (from: Position): Position => {
        if (skill.rangeType !== 'LINE' || getTempUnit(from)) return from;
        const dx = Math.sign(from.x - caster.position.x);
        const dy = Math.sign(from.y - caster.position.y);
        for (let i = 1; i <= skill.rangeValue; i++) {
            const p = { x: caster.position.x + dx * i, y: caster.position.y + dy * i };
            if (p.x < 0 || p.x >= 8 || p.y < 0 || p.y >= 8) break;
            const tile = getTileAt(p, board);
            if (tile && terrainDefs[tile.terrain]?.type === 'MOUNTAIN') break;
            if (getTempUnit(p)) return p;
        }
        return from;
    };

    if (!skill.sunCost && hasFusionEffect(caster, 'DOUBLE_ATTACK')) {
        const secondPos = rollOverFrom(pos);
        actions.push({
            type: 'UNIT_ATTACK',
            unitId: caster.id,
            targetPos: secondPos,
            attackRange: skill.rangeType,
        });
        resolveTargets(
            getFusionEffectValue(caster, 'DOUBLE_ATTACK'),
            secondPos === pos ? targets : [secondPos],
        );
    }

    /**
     * A VOLLEY — shots two and three of Precision Blast.
     *
     * The first shot is the ordinary resolution above; these are the rest, each aimed by the
     * same roll-over the Repeater uses, so a pea is never spent on a corpse. No damageOverride:
     * every shot is worth what the skill is worth, which is what makes the hero's BONUS_DAMAGE
     * lift the whole volley rather than a third of it.
     */
    const volley = skill.effects.find(e => e.type === 'VOLLEY');
    if (volley) {
        const shots = Math.max(1, volley.value ?? 1);
        for (let shot = 2; shot <= shots; shot++) {
            const nextPos = rollOverFrom(pos);
            actions.push({
                type: 'UNIT_ATTACK',
                unitId: caster.id,
                targetPos: nextPos,
                attackRange: skill.rangeType,
            });
            resolveTargets(undefined, nextPos === pos ? targets : [nextPos]);
        }
    }

    /**
     * SPIKE_TILE — the row stays dangerous after the volley has landed.
     *
     * Every tile the attack COVERED is spiked, not just the one the player clicked. On a
     * piercing LINE that is the whole lane (getSkillTargetPath already walks it for the damage
     * pass), and the lane is the point of the skill: the shot taxes what is standing there
     * now, the spikes tax whatever walks in next turn. Emitted after both damage passes so the
     * ground appears once the shot is over.
     */
    const spikeEffect = skill.effects.find(e => e.type === 'SPIKE_TILE');
    if (spikeEffect) {
        const covered = (skill.rangeType === 'LINE' || skill.rangeType === 'DASH')
            ? getSkillTargetPath(caster, skill, pos, board)
            : targets;
        const spiked = new Set<string>();
        covered.forEach(p => {
            if (p.x < 0 || p.x >= 8 || p.y < 0 || p.y >= 8) return;
            // Never under the caster's own feet: a hero standing in his own spines is a bug
            // report, not a trade-off.
            if (p.x === caster.position.x && p.y === caster.position.y) return;
            const key = `${p.x},${p.y}`;
            if (spiked.has(key)) return;
            spiked.add(key);
            const tile = getTileAt(p, board);
            // Nothing can ever stand on a WALL, so nothing can ever be hurt by spiking one.
            if (!tile || tile.terrain === 'WALL') return;

            // Spines ride MODIFY_TERRAIN on their own `spikes` field, with `terrain` and
            // `environment` both left undefined so the reducer copies the ground through
            // untouched — grass that was grass stays grass, and the spines sit on top of it.
            //
            // Two turns, not one: the field is laid during the PLAYER's turn, and turnManager
            // ages it in the very next environment phase. At one turn it would expire before
            // the horde that it was aimed at had finished walking into it.
            actions.push({
                type: 'MODIFY_TERRAIN',
                pos: { ...p },
                spikes: { damage: spikeEffect.value ?? 1, turns: 2 },
            });
        });
    }

    /**
     * DUST_TILE — the veil the DUST_VEIL hazard writes, cast by hand (PLAN-hero-zephyr §5.3).
     *
     * Same field, same reader: `TileData.smoke` plus `environment: 'SMOKE'`, aged by
     * turnManager's one ageing block, read by its one `blinded()` — whatever ends its turn
     * inside cannot line up a swing. Two shapes:
     *  - Smoke Pod itself drops the hazard's own PLUS (centre + 4 neighbours) — one mechanic,
     *    one shape, so a player who has met the weather already knows the skill.
     *  - A SKILL_DISARM fusion dusts the tiles the carrying skill actually covered, exactly
     *    like the spike trail above.
     * Unlike spikes, the caster's own tile is NOT skipped: standing in your own smoke is a
     * real trade (the symmetric rule in getValidSkillTargets), not a bug.
     */
    const dustEffect = skill.effects.find(e => e.type === 'DUST_TILE');
    if (dustEffect) {
        /**
         * Where the dust settles. Three shapes, one rule each:
         *  - an ALLY-targeted carrier (Ashveil on Solar Blessing) dusts the RING around the
         *    recipient and never their own tile — the veil protects the blessed body, it must
         *    not disarm it (the symmetric can't-aim-from-dust rule would hit the ally too);
         *  - a pure ground pod (Smoke Pod) drops the hazard's own plus, centre included;
         *  - a strike carrier dusts what the strike covered, like the spike trail.
         */
        const centreOccupant = getTempUnit(pos);
        const allyCentred = !!centreOccupant && !centreOccupant.isEnemy;
        const ring: Position[] = [
            { x: pos.x + 1, y: pos.y }, { x: pos.x - 1, y: pos.y },
            { x: pos.x, y: pos.y + 1 }, { x: pos.x, y: pos.y - 1 }];
        /**
         * A pure ground pod is TWO tiles, not the hazard's five.
         *
         * DUST_VEIL is weather — a plus dropped on the board by the sector, and nobody chose
         * where. A pod is a hero spending a turn, and the same footprint made that turn far
         * too wide: five tiles is a third of a corridor, and because the blind rule is
         * SYMMETRIC (gameLogic's `getValidSkillTargets` stops the squad's own damage skills
         * inside dust) the wide version walled off its own line as often as the horde's.
         *
         * The second tile is the neighbour on the CASTER'S side, which is not an arbitrary
         * pick: the cloud always ends up between Zephyr and what she just blinded, so the
         * pod covers her way out — the exact thing the skill exists to buy ("it buys the TURN
         * she needs to leave the pocket she just flew into"). Deterministic tie-break in
         * reading order, like every other aim in this file: a telegraph decided by a coin
         * flip is not a telegraph.
         */
        const podTrail = ring
            .filter(p => p.x >= 0 && p.x < 8 && p.y >= 0 && p.y < 8)
            .sort((a, b) =>
                (Math.abs(a.x - caster.position.x) + Math.abs(a.y - caster.position.y))
                - (Math.abs(b.x - caster.position.x) + Math.abs(b.y - caster.position.y))
                || a.x - b.x || a.y - b.y)
            .slice(0, 1);
        const covered: Position[] = allyCentred
            ? ring
            : !skill.effects.some(e => e.type === 'DAMAGE' || e.type === 'PUSH')
                ? [pos, ...podTrail]
                : ((skill.rangeType === 'LINE' || skill.rangeType === 'DASH')
                    ? getSkillTargetPath(caster, skill, pos, board)
                    : targets);
        const dusted = new Set<string>();
        covered.forEach(p => {
            if (p.x < 0 || p.x >= 8 || p.y < 0 || p.y >= 8) return;
            const key = `${p.x},${p.y}`;
            if (dusted.has(key)) return;
            dusted.add(key);
            const tile = getTileAt(p, board);
            if (!tile || tile.terrain === 'WALL' || tile.terrain === 'MOUNTAIN') return;
            actions.push({
                type: 'MODIFY_TERRAIN',
                pos: { ...p },
                environment: 'SMOKE',
                smoke: { turns: dustEffect.value ?? 2 },
            });
        });
    }

    /**
     * FIRE RESONANCE — a body that dies burning leaves its ground alight.
     *
     * Read off the finished action list rather than bolted onto each death site, and that is
     * the only version of this that is actually correct. A hero attack can kill through five
     * different doors — the damage pass, the Repeater's second pass, the lightning arc, the
     * collision bonus, a shove into a wall inside applyPushPlan — and four of them are reached
     * through code that knows nothing about elements. One pass over `UNIT_DIE` catches all of
     * them, cannot drift when a sixth is added, and reads the simulation's LAST word on where
     * the body was standing and what it was carrying (a corpse that was shoved before it died
     * burns where it landed, not where it was hit).
     *
     * It reuses `ignite`'s exact pair of actions — MODIFY_TERRAIN + the BURN tile event — so
     * there is one kind of fire tile in this game and PHASE 2 of turnManager needs no new case.
     *
     * A target killed OUTRIGHT by a fire hero does not qualify, and should not: the status
     * blocks above are all gated on `!isDead`, so nothing that dies to the blow was ever
     * burning. The rule pays for damage over time that finished its job, not for a kill.
     */
    if (resonance === 'FIRE') {
        const ignited = new Set<string>();
        // Snapshotted before the loop appends to `actions` — the fire tiles must not be
        // rescanned as if they were deaths of their own.
        const dead = actions.filter(a => a.type === 'UNIT_DIE' && a.unitId).map(a => a.unitId!);
        dead.forEach(id => {
            const victim = tempUnits.get(id);
            if (!victim || !victim.isEnemy || victim.type === UnitType.OBSTACLE) return;
            if (!victim.statusEffects.includes('BURN')) return;
            const key = `${victim.position.x},${victim.position.y}`;
            if (ignited.has(key)) return;
            const tile = getTileAt(victim.position, board);
            // Ground a body could have stood on, and not already burning. Water is the reason
            // this check exists: a burning zombie shoved into the lake drowns, and a lake that
            // catches fire is a bug report rather than a reward.
            if (!tile || !terrainDefs[tile.terrain]?.isWalkable) return;
            if (tile.environment === 'FIRE') return;
            ignited.add(key);
            actions.push({ type: 'MODIFY_TERRAIN', pos: { ...victim.position }, environment: 'FIRE' });
            actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'BURN', pos: { ...victim.position } });
        });
    }

    // Chomper is helpless while it digests. Without this the swallow had no downside.
    if (skill.id === 'burrow_strike' && actions.some(a => a.type === 'UNIT_DIE')) {
        // Double Jaw shortens the helpless window that is Maw's whole drawback.
        const digest = Math.max(1, 2 - getFusionEffectValue(caster, 'DIGEST_REDUCTION'));
        const updates: Partial<Unit> = { digestingTurns: digest };
        // Shelled Chomper: the helpless window opens behind a fresh LAYER (§6.0) — the first
        // blow of the digest is eaten whole, the window itself stays a window. The old
        // version was total immunity checked inside calculateDamage, which made the digest
        // window not a drawback at all; the numbered 3-shield replaced that, and the layer
        // replaces the number.
        if (hasFusionEffect(caster, 'ARMOR_WHILE_DIGESTING')) {
            const casterSim = tempUnits.get(caster.id);
            if (((casterSim ?? caster).shield || 0) === 0) {
                updates.shield = 1;
                if (casterSim) casterSim.shield = 1;
                actions.push({ type: 'APPLY_DAMAGE', targetId: caster.id, amount: 0, eventType: 'BLOCK', pos: caster.position });
            }
        }
        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: caster.id, updates });
    }

    if (skill.rangeType === 'DASH') {
        const targetUnit = getTempUnit(pos);
        if (!targetUnit) {
            actions.push({ type: 'UNIT_MOVE', unitId: caster.id, path: [pos] });
        } else {
            const path = getSkillTargetPath(caster, skill, pos, board);
            if (path.length > 1) {
                actions.push({ type: 'UNIT_MOVE', unitId: caster.id, path: [path[path.length - 2]] });
            }
        }
    }

    return actions;
};
