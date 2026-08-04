import { Position, TerrainDefinition, TileData, TurnAction, Unit, UnitType } from '../types';
import { calculateDamage, planPush } from './gameLogic';
import { getFusionEffectValue, hasFusionEffect } from './fusion';

/**
 * The two builders every attack, item and shove funnels through.
 *
 * They lived as closures inside App.tsx, which meant the only way to reach the rules they
 * encode — what a kill pays, what a collision costs, what drowning looks like — was to be
 * rendering the game. Everything here is pure: it appends to the `actions` array it is given
 * and mutates only the caller's own simulation map.
 */

/** What a resolution needs to know about the world. Passed instead of closing over App state. */
export interface ResolveContext {
    units: Unit[];
    board: TileData[];
    terrainDefs: Record<string, TerrainDefinition>;
}

/**
 * Kills no longer pay Sun by default — the free 25/50 per kill let a shooter refund
 * her own ultimate and spam it. Kill income now exists ONLY through the Sunflower
 * fusions (SUN_ON_KILL: Sunbeam Pea / Glacial Bloom), and only on the finishing blow.
 */
export const pushKill = (actions: TurnAction[], victim: Unit, killer?: Unit | null) => {
    actions.push({ type: 'UNIT_DIE', unitId: victim.id });
    if (victim.isEnemy && victim.type !== UnitType.OBSTACLE) {
        const bonus = killer ? getFusionEffectValue(killer, 'SUN_ON_KILL') : 0;
        if (bonus > 0) {
            actions.push({ type: 'GAIN_SUN', amount: bonus, pos: victim.position });
        }
    }
};

/**
 * Turns a PushPlan into actions. Kept beside pushKill so collision damage, drowning and
 * Sun-on-kill all funnel through the same place no matter which shove produced them.
 */
export const applyPushPlan = (
    plan: ReturnType<typeof planPush>,
    actions: TurnAction[],
    sim: Map<string, Unit>,
    killer?: Unit | null,
) => {
    plan.moves.forEach(m => {
        const u = sim.get(m.unitId);
        if (!u) return;
        actions.push({ type: 'UNIT_MOVE', unitId: m.unitId, path: [m.to], isForced: true });
        u.position = m.to;
    });

    plan.drowned.forEach(id => {
        const u = sim.get(id);
        if (!u) return;
        actions.push({ type: 'APPLY_DAMAGE', targetId: id, amount: 0, eventType: 'DROWN', pos: u.position });
        u.hp = 0;
        pushKill(actions, u, killer ?? undefined);
    });

    // Shoved into a live house: the brain is gone and the zombie walks off with it. Not a
    // kill — no death animation, no Sun. BRAIN_LOST is the same action a zombie that walked
    // in on its own turn produces, so the reducer's counter cannot drift between the two.
    plan.tookBrain.forEach(({ unitId, house }: { unitId: string; house: Position }) => {
        const u = sim.get(unitId);
        if (!u) return;
        actions.push({ type: 'BRAIN_LOST', pos: house, unitId });
        u.hp = 0;
    });

    plan.collided.forEach(id => {
        const u = sim.get(id);
        if (!u || u.hp <= 0) return;
        // Iron Bulwark: braced units are never hurt by being slammed into things.
        if (hasFusionEffect(u, 'STEADFAST')) {
            actions.push({ type: 'APPLY_DAMAGE', targetId: id, amount: 0, eventType: 'BLOCK', pos: u.position });
            return;
        }
        const r = calculateDamage(u, 1, false);
        actions.push({ type: 'APPLY_DAMAGE', targetId: id, amount: r.finalDamage, eventType: 'DAMAGE', pos: u.position });
        u.hp = r.remainingHp;
        if (r.isFatal) pushKill(actions, u, killer ?? undefined);
    });
};
