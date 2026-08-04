import { Position, Skill, StatusEffectType, TurnAction, Unit, UnitType } from '../types';
import { calculateDamage, getSkillTargetPath, getTileAt, planPush } from './gameLogic';
import { getFusionEffectValue, hasFusionEffect } from './fusion';
import { applyPushPlan, pushKill, type ResolveContext } from './actionBuilders';

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
    const { units, board, terrainDefs } = ctx;
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
    }

    // Cob Cannon: the butter splatters onto the four neighbouring tiles.
    // Gated on the skill costing Sun — the same effect on a free basic attack would
    // be splash damage every turn for nothing, which is a different (and much
    // stronger) game than the one this fusion is priced for. Allies are safe by
    // construction: resolveTargets only applies damage to enemies and obstacles.
    if ((skill.sunCost ?? 0) > 0 && hasFusionEffect(caster, 'SKILL_SPLASH')) {
        [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].forEach(o => {
            const t = { x: pos.x + o.x, y: pos.y + o.y };
            if (t.x >= 0 && t.x < 8 && t.y >= 0 && t.y < 8) targets.push(t);
        });
    }

    // --- CRITICAL FIX: CREATE TEMP UNIT MAP TO SIMULATE HP LOSS WITHOUT MUTATING STATE ---
    // This prevents the "Double Damage" bug where modifying targetUnit.hp directly caused
    // the state reducer to subtract damage from an already reduced value.
    const tempUnits = new Map<string, Unit>(units.map(u => [u.id, { ...u }]));
    // Only living units occupy a tile in the simulation. Units killed earlier in this
    // same resolution must stop blocking pushes and stop being valid targets.
    const getTempUnit = (p: Position) => Array.from(tempUnits.values())
        .find(u => u.hp > 0 && u.position.x === p.x && u.position.y === p.y);

    // `damageOverride` is how the Repeater's second pass lands for less than the
    // first. Passing it here rather than mutating the skill keeps the first pass
    // reading the authored number.
    const resolveTargets = (damageOverride?: number) => targets.forEach(targetPos => {
        const targetUnit = getTempUnit(targetPos);
        const isSelf = targetPos.x === caster.position.x && targetPos.y === caster.position.y;

        if (skill.effects.some(e => e.type === 'TERRAIN_MOD')) {
            if (skill.id === 'ignite') {
                actions.push({ type: 'MODIFY_TERRAIN', pos: targetPos, environment: 'FIRE' });
                actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'BURN', pos: targetPos });
            }
        }

        if (targetUnit && !targetUnit.isEnemy) {
            skill.effects.forEach(e => {
                if (e.type === 'HEAL') actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: e.value || 0, eventType: 'HEAL', pos: targetPos });
                if (e.type === 'SHIELD') {
                    const newShield = (targetUnit.shield || 0) + (e.value || 0);
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { shield: newShield } });
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'BLOCK', pos: targetPos });
                }
                if (e.type === 'REFRESH_ACTION') {
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { hasMoved: false, hasAttacked: false } });
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

        if (targetUnit && (targetUnit.isEnemy || targetUnit.type === UnitType.OBSTACLE)) {
            const dmgEffect = skill.effects.find(e => e.type === 'DAMAGE');
            let isDead = false;

            if (dmgEffect) {
                // The override replaces the authored damage outright; terrain and
                // buff boosts still apply on top, same as the first shot.
                let rawDmg = (damageOverride ?? (dmgEffect.value || 0)) + damageBoost;
                // Chomper's swallow is an instant kill, but Massive units (Gargantuar)
                // are too big to eat — it only chips them.
                if (skill.id === 'burrow_strike' && targetUnit.isMassive) rawDmg = 1;
                const totalDmg = rawDmg;
                // Use tempUnit for calculation (safe)
                const result = calculateDamage(targetUnit, totalDmg, hasPierce);

                if (result.shieldDamage > 0) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'BLOCK', pos: targetPos });
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { shield: result.remainingShield } });
                }

                if (result.finalDamage > 0) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: result.finalDamage, eventType: 'DAMAGE', pos: targetPos });

                    // UPDATE TEMP UNIT ONLY - Do not touch real State 'units'
                    targetUnit.hp = result.remainingHp;
                    targetUnit.shield = result.remainingShield;
                }

                if (result.isFatal) {
                    isDead = true;
                    pushKill(actions, targetUnit, caster);
                    targetUnit.hp = 0; // Mark dead in temp
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
                if (stunImmune && !chillFallback) {
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
            if (!isDead && skill.effects.some(e => e.type === 'APPLY_SLOW')) {
                if (targetUnit.immunities.includes('STATUS')) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'IMMUNE', pos: targetPos });
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
                const plan = planPush(targetUnit, dx, dy, livingSim, board, terrainDefs);
                applyPushPlan(plan, actions, tempUnits, caster);
            }
        }
    });

    resolveTargets();

    // A fused Repeater sends a second, WEAKER shot after the free basic attack. The
    // second pass reads the HP left by the first (tempUnits carries it), and
    // getTempUnit skips anything already dead, so it never swings at a corpse.
    if (!skill.sunCost && hasFusionEffect(caster, 'DOUBLE_ATTACK')) {
        actions.push({
            type: 'UNIT_ATTACK',
            unitId: caster.id,
            targetPos: pos,
            attackRange: skill.rangeType,
        });
        resolveTargets(getFusionEffectValue(caster, 'DOUBLE_ATTACK'));
    }

    // Chomper is helpless while it digests. Without this the swallow had no downside.
    if (skill.id === 'burrow_strike' && actions.some(a => a.type === 'UNIT_DIE')) {
        // Double Jaw shortens the helpless window that is Maw's whole drawback.
        const digest = Math.max(1, 2 - getFusionEffectValue(caster, 'DIGEST_REDUCTION'));
        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: caster.id, updates: { digestingTurns: digest } });
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
