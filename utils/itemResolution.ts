import { ItemDefinition, Position, TurnAction, Unit, UnitImmunity, UnitType } from '../types';
import { calculateDamage, getTileAt, getUnitAt, gustDirection, planPush, getSolidUnitAt } from './gameLogic';
import { applyPushPlan, pushKill, type ResolveContext } from './actionBuilders';

/**
 * What the Magnet Pulse can rip off a body: the plating itself, and the immunities that live
 * in the GEAR rather than the flesh. PUSH is a Catapult's chassis; STATUS is the Doorbearer
 * held between the zombie and the world. BURN/FREEZE/DROWN stay — they describe what a body
 * is made of, and a magnet has no opinion about meat. (The Linebreaker's metal is plain `armor`
 * since it lost its PUSH immunity — the armour strip below already covers it.)
 */
const METAL_IMMUNITIES: ReadonlyArray<UnitImmunity> = ['PUSH', 'STATUS'];

/**
 * Gear immunities come off the REGULAR horde only. A boss's immunity is its design — one
 * each, load-bearing (data/zombies.ts) — and a 50-Coin click that makes a boss shovable or
 * freezable is the "consumable deletes a boss" line the Flame Strike note in data/items.ts
 * already refuses to cross. Obstacles keep theirs too: a rock's PUSH is physics, not a helmet.
 * Armor and shield still come off ANYONE — losing plating speeds a fight up, it does not
 * skip one.
 */
const magnetStripsImmunities = (u: Unit): boolean =>
    !u.bossId && u.type === UnitType.ZOMBIE;

/** True when the magnet has anything at all to take from this unit. */
const magnetHasWork = (u: Unit): boolean =>
    (u.armor || 0) > 0
    || (u.shield || 0) > 0
    || (magnetStripsImmunities(u) && u.immunities.some(i => METAL_IMMUNITIES.includes(i)));

/**
 * ITEMS, RESOLVED. The sibling of skillResolution — same split, same reasons.
 *
 * `itemTargetInvalid` exists separately because two items can be aimed at a tile that cannot
 * take them, and the item is spent unconditionally once resolution starts: a misclick on
 * empty grass used to burn 100 Coin for nothing. The check has to happen before the caller
 * removes anything from the inventory, so it is its own exported function rather than an
 * early return buried in the planner.
 */

/** True when this tile cannot legally receive the item. The caller should show BLOCKED. */
export const itemTargetInvalid = (item: ItemDefinition, pos: Position, ctx: ResolveContext): boolean => {
    const { units, board, terrainDefs } = ctx;

    // Stim Shot: needs an ally who has actually spent something to give back.
    if (item.effect === 'REFRESH') {
        const t = getUnitAt(pos, units);
        return !t
            || t.isEnemy
            || (t.digestingTurns || 0) > 0      // still swallowing; an action cannot be used
            || (!t.hasMoved && !t.hasAttacked); // nothing spent yet, so nothing to give back
    }

    // A trap is ARMED, not detonated: it needs an empty, walkable tile to sit on.
    if (item.effect === 'TRAP') {
        const tile = getTileAt(pos, board);
        return !tile
            // Solid, not present. A mine refused on an apparently empty square is an arrow
            // pointing at the boss — the one thing the burrow rule exists to prevent. It arms
            // normally instead, and goes off the next time the digger surfaces there.
            || !!getSolidUnitAt(pos, units)
            || !!tile.trap
            || !terrainDefs[tile.terrain]?.isWalkable
            || !!tile.isHouse;
    }

    if (item.effect === 'HYPNO') {
        const t = getUnitAt(pos, units);
        return !t || !t.isEnemy || !!t.bossId;
    }

    if (item.effect === 'SPIKES') {
        const tile = getTileAt(pos, board);
        return !tile
            || !terrainDefs[tile.terrain]?.isWalkable
            || !!tile.isHouse
            || (!!tile.spikes && tile.spikes.turns > 0);
    }

    // Heal Kit: needs a wounded ally. Full-health targets are refused for the same reason an
    // empty magnet zone is — the item is spent unconditionally once resolution starts.
    if (item.effect === 'HEAL') {
        const t = getUnitAt(pos, units);
        return !t || t.isEnemy || t.type === UnitType.OBSTACLE || t.hp >= t.maxHp;
    }

    if (item.effect === 'STRIP_ARMOR') {
        const radius = item.rangeRadius || 1;
        let foundMetal = false;
        for (let x = pos.x - radius; x <= pos.x + radius; x++) {
            for (let y = pos.y - radius; y <= pos.y + radius; y++) {
                if (x >= 0 && x < 8 && y >= 0 && y < 8) {
                    const u = getUnitAt({ x, y }, units);
                    if (u && u.isEnemy && magnetHasWork(u)) {
                        foundMetal = true;
                        break;
                    }
                }
            }
        }
        return !foundMetal;
    }

    return false;
};

/**
 * Everything an item does, as actions.
 *
 * TRAP is absent on purpose: arming one writes a tile, not an action, and the ENGINE owns the
 * detonation — every way a unit can arrive on a tile (walk, push, gust, hazard) funnels
 * through UNIT_MOVE, and that is where the trigger lives. The caller writes the board.
 */
export const planItemActions = (
    item: ItemDefinition,
    pos: Position,
    ctx: ResolveContext,
    /** Whoever is credited with kills — matters only for SUN_ON_KILL fusions. */
    actor?: Unit | null,
): TurnAction[] => {
    const { units, board, terrainDefs } = ctx;
    const actions: TurnAction[] = [];

    if (item.effect === 'SPIKES') {
        actions.push({
            type: 'MODIFY_TERRAIN',
            pos,
            spikes: { damage: item.damage || 2, turns: 3 }
        });
        return actions;
    }

    if (item.effect === 'HYPNO') {
        const target = getUnitAt(pos, units);
        if (target && target.isEnemy && !target.bossId) {
            actions.push({
                type: 'UPDATE_UNIT_STATE',
                unitId: target.id,
                updates: { isEnemy: false, statusEffects: [...target.statusEffects, 'HYPNOTIZED'] }
            });
            actions.push({ type: 'APPLY_DAMAGE', targetId: target.id, amount: 0, eventType: 'BUFF', pos });
        }
        return actions;
    }

    if (item.effect === 'HEAL') {
        // itemTargetInvalid ran first, so the target is a wounded ally.
        const target = getUnitAt(pos, units)!;
        actions.push({
            type: 'UPDATE_UNIT_STATE',
            unitId: target.id,
            updates: { hp: Math.min(target.maxHp, target.hp + (item.damage || 3)) },
        });
        actions.push({ type: 'APPLY_DAMAGE', targetId: target.id, amount: 0, eventType: 'BUFF', pos });
        return actions;
    }

    /**
     * The Blight Core. Everything in the square eats the blast — the horde, the squad,
     * whoever parked badly — EXCEPT bosses, who take a hard-capped bite instead: this
     * file's oldest law is that a consumable must never assassinate a boss, and a nuke
     * is exactly the item that law was written for. Armour means nothing to it (nuclear
     * fire is environment, not a pea). The inner 3x3 becomes lava: a crater the fight
     * then has to live with, and a free meal for the one boss that heals on it.
     */
    if (item.effect === 'NUKE') {
        const radius = item.rangeRadius || 2;
        const BOSS_BITE = 4; // first-pass number — tuning pass pending (2026-08-06)
        for (let x = pos.x - radius; x <= pos.x + radius; x++) {
            for (let y = pos.y - radius; y <= pos.y + radius; y++) {
                if (x < 0 || x >= 8 || y < 0 || y >= 8) continue;
                const t = { x, y };
                const u = getSolidUnitAt(t, units);
                if (u) {
                    const amount = u.bossId ? Math.min(BOSS_BITE, item.damage) : item.damage;
                    const result = calculateDamage(u, amount, false, true);
                    actions.push({ type: 'APPLY_DAMAGE', targetId: u.id, amount: result.finalDamage, eventType: 'DAMAGE', pos: t });
                    if (result.isFatal) pushKill(actions, u, actor);
                } else {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'BURN', pos: t });
                }
                // The crater: only the inner ring melts. Greenspires are spared — losing a sprout
                // to your own bomb is a story, losing the HOUSE TILE to it is a softlock.
                if (Math.abs(x - pos.x) <= 1 && Math.abs(y - pos.y) <= 1) {
                    const tile = getTileAt(t, board);
                    if (tile && !tile.isHouse && terrainDefs[tile.terrain]?.isWalkable) {
                        actions.push({ type: 'MODIFY_TERRAIN', pos: t, terrain: 'LAVA' });
                    }
                }
            }
        }
        return actions;
    }

    if (item.effect === 'STRIP_ARMOR') {
        const radius = item.rangeRadius || 1;
        for (let x = pos.x - radius; x <= pos.x + radius; x++) {
            for (let y = pos.y - radius; y <= pos.y + radius; y++) {
                if (x >= 0 && x < 8 && y >= 0 && y < 8) {
                    const target = getUnitAt({ x, y }, units);
                    if (target && target.isEnemy && magnetHasWork(target)) {
                        const updates: Partial<Unit> = { armor: 0, shield: 0 };
                        if (magnetStripsImmunities(target)) {
                            updates.immunities = target.immunities.filter(i => !METAL_IMMUNITIES.includes(i));
                        }
                        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: target.id, updates });
                        actions.push({ type: 'APPLY_DAMAGE', targetId: target.id, amount: 0, eventType: 'BLOCK', pos: { x, y } });
                    }
                }
            }
        }
        return actions;
    }

    if (item.effect === 'REFRESH') {
        // itemTargetInvalid was called first, so this target is known good.
        const target = getUnitAt(pos, units)!;
        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: target.id, updates: { hasMoved: false, hasAttacked: false } });
        actions.push({ type: 'APPLY_DAMAGE', targetId: target.id, amount: 0, eventType: 'BUFF', pos });
        return actions;
    }

    // GUST ignores the tile you clicked: it is a board-wide effect, like Storm Fan in
    // PvZ. Fliers are removed outright; everything else on the ground is shoved one
    // tile back toward the spawn edge (+y — zombies march in from high y).
    if (item.effect === 'GUST') {
        // Direction comes from the tile you clicked: the gust blows toward the
        // nearest board edge. Shared with the hover arrow via gustDirection().
        const { dx: gdx, dy: gdy } = gustDirection(pos);
        const enemies = units.filter(u => u.isEnemy && u.hp > 0);

        enemies.forEach(e => {
            if (e.movementType === 'FLYING') {
                actions.push({ type: 'APPLY_DAMAGE', targetId: e.id, amount: 0, eventType: 'DROWN', pos: e.position });
                pushKill(actions, e, actor);
            }
        });

        // Furthest along the gust first, so each vacates its tile before the next
        // arrives. Projecting onto the direction vector keeps this correct for all
        // four headings, not just the +y default it started as.
        const along = (u: Unit) => u.position.x * gdx + u.position.y * gdy;
        const grounded = enemies
            .filter(e => e.movementType !== 'FLYING')
            .sort((a, b) => along(b) - along(a));

        // One shared simulation so the gust sees its own displacements: a zombie
        // already blown onto the bank is a body the next one can be driven into.
        const gustSim = new Map<string, Unit>(units.filter(u => u.hp > 0).map(u => [u.id, { ...u }]));
        enemies.filter(e => e.movementType === 'FLYING').forEach(e => gustSim.delete(e.id));

        grounded.forEach(e => {
            const live = gustSim.get(e.id);
            if (!live || live.hp <= 0) return;
            if (live.immunities.includes('PUSH')) {
                actions.push({ type: 'APPLY_DAMAGE', targetId: e.id, amount: 0, eventType: 'IMMUNE', pos: live.position });
                return;
            }
            const plan = planPush(live, gdx, gdy, Array.from(gustSim.values()), board, terrainDefs);
            applyPushPlan(plan, actions, gustSim, actor);
        });

        return actions;
    }

    // --- the ordinary case: a square blast centred on the clicked tile ---
    const radius = item.rangeRadius || 0;
    const targets: Position[] = [];
    for (let x = pos.x - radius; x <= pos.x + radius; x++) {
        for (let y = pos.y - radius; y <= pos.y + radius; y++) {
            if (x >= 0 && x < 8 && y >= 0 && y < 8) targets.push({ x, y });
        }
    }

    targets.forEach(t => {
        const u = getSolidUnitAt(t, units);

        // Flame Strike burns its whole column rather than a blast radius.
        if (item.effect === 'TERRAIN_MOD' && item.id === 'flame_strike') {
            for (let col = 0; col < 8; col++) {
                actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'BURN', pos: { x: t.x, y: col } });
                const target = getSolidUnitAt({ x: t.x, y: col }, units);
                if (target) {
                    const result = calculateDamage(target, item.damage, true);
                    actions.push({ type: 'APPLY_DAMAGE', targetId: target.id, amount: result.finalDamage, eventType: 'DAMAGE', pos: { x: t.x, y: col } });
                    if (result.isFatal) pushKill(actions, target, actor);
                }
                actions.push({ type: 'MODIFY_TERRAIN', pos: { x: t.x, y: col }, terrain: 'LAVA' });
            }
            return;
        }

        if (u) {
            const result = calculateDamage(u, item.damage, false);
            actions.push({ type: 'APPLY_DAMAGE', targetId: u.id, amount: result.finalDamage, eventType: 'DAMAGE', pos: t });
            if (result.isFatal) pushKill(actions, u, actor);

            if (item.effect === 'BURN') {
                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { statusEffects: [...u.statusEffects, 'BURN'] } });
            }
            /**
             * The freeze does NOT spare your own side — parking a hero inside a 5x5 you are
             * about to flash-freeze is a positioning mistake, and those bleed here. The ICE
             * hero is the exception WITHOUT being a special case: carrying the element
             * grants the matched immunity at the factory (ELEMENT_IMMUNITY, and blighted
             * zombies deliberately get none), so the ordinary FREEZE check below already
             * waves her through. The 1 damage still applies: immunity is to the ice, not
             * to the blast.
             */
            if (item.effect === 'FREEZE' && !u.immunities.includes('FREEZE') && !u.immunities.includes('STATUS')) {
                // Real FREEZE, not the STUN stand-in it used to apply: STUN was a
                // workaround for FREEZE never expiring, and it made the effect last
                // exactly one turn regardless. Frozen now holds until something hits.
                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { statusEffects: [...u.statusEffects, 'FREEZE'] } });
            }
        } else {
            actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'BURN', pos: t });
        }
    });

    return actions;
};
