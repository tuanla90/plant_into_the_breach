
import { Unit, Intent, Position, TileData, TerrainDefinition } from '../types';
import { findPath } from './gameLogic';
import { behaviourFor } from './bossBehaviours';
import { enemyElementRider } from './elements';

const manhattan = (a: Position, b: Position) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/**
 * Zombies want brains, not plants (DESIGN.md section 1). The goal is the nearest house that
 * still holds one; plants only matter when they stand in the way.
 */
const findGoal = (enemy: Unit, board: TileData[]): Position => {
    let goal: Position | null = null;
    let minDist = 999;

    for (const t of board) {
        if (!t.isHouse || !t.hasBrain) continue;
        const dist = manhattan(t, enemy.position);
        if (dist < minDist) {
            minDist = dist;
            goal = { x: t.x, y: t.y };
        }
    }

    // Every brain is gone. Head for the nearest house anyway (maps are hand-authored, so
    // houses are wherever the author put them), otherwise just keep walking left.
    if (goal) return goal;

    let fallback: Position | null = null;
    let fallbackDist = 999;
    for (const t of board) {
        if (!t.isHouse) continue;
        const dist = manhattan(t, enemy.position);
        if (dist < fallbackDist) {
            fallbackDist = dist;
            fallback = { x: t.x, y: t.y };
        }
    }
    return fallback || { x: enemy.position.x, y: 0 };
};

/**
 * THE HORDE'S ELEMENT RIDER (utils/elements.ts, "blighted horde").
 *
 * A wrapper over the planner rather than edits inside it, because an ATTACK leaves this file
 * through four different doors (taunt, boss hook, blocker, brain bite) and a rider stapled to
 * each one is four chances to miss the fifth. Decorating the finished intent means every
 * current and future attack path pays the same way.
 *
 * Boss intents pass through untouched: bosses never roll an element (`rollEnemyElement`), and
 * the guard here keeps a hand-tuned `statusOnHit` on a boss intent from ever being appended to.
 */
const withElementRider = (enemy: Unit, intent: Intent): Intent => {
    if (!enemy.element || enemy.bossId || intent.type !== 'ATTACK') return intent;
    const rider = enemyElementRider(enemy.element).filter(e => !intent.statusOnHit?.includes(e));
    if (rider.length === 0) return intent;
    return { ...intent, statusOnHit: [...(intent.statusOnHit ?? []), ...rider] };
};

export const planEnemyIntent = (
    enemy: Unit,
    playerUnits: Unit[],
    board: TileData[] = [],
    terrainDefs: Record<string, TerrainDefinition> = {},
    collisionUnits: Unit[] = playerUnits
): Intent => withElementRider(enemy, planIntentCore(enemy, playerUnits, board, terrainDefs, collisionUnits));

const planIntentCore = (
    enemy: Unit,
    playerUnits: Unit[],
    board: TileData[] = [],
    terrainDefs: Record<string, TerrainDefinition> = {},
    collisionUnits: Unit[] = playerUnits
): Intent => {
    const goal = findGoal(enemy, board);
    // A Flag Zombie on the board hands every other zombie +1 damage (turnManager PHASE 1.5).
    const damage = enemy.damage + (enemy.statusEffects.includes('ENRAGED') ? 1 : 0);

    /**
     * TAUNT — the one status that redirects rather than delays, and the reason Thornhide exists.
     *
     * It runs ahead of every rule below, including the Gargantuar's private branch: a provoked
     * Gargantuar swings at the plant that provoked it instead of lobbing an Imp over the wall.
     * That is the whole promise of the skill — the three units built to go AROUND a blocker
     * (Balloon flies, Digger burrows, Catapult outranges) have to come at it instead.
     *
     * A dead taunter steers nobody: with no living unit behind `tauntedBy` this falls straight
     * through to the normal brain hunt rather than freezing the zombie on an empty tile.
     */
    const taunter = enemy.statusEffects.includes('TAUNTED') && enemy.tauntedBy
        ? playerUnits.find(u => u.id === enemy.tauntedBy && u.hp > 0)
        : undefined;

    if (taunter) {
        const tauntReach = Math.max(1, enemy.attackRange ?? 1);
        if (manhattan(enemy.position, taunter.position) <= tauntReach) {
            return { type: 'ATTACK', target: { ...taunter.position }, damage };
        }

        // Close the distance. Deliberately NOT subject to the "never turn around to eat what
        // is behind you" rule that governs the blocker search below — making the horde turn
        // around IS the effect being paid for.
        const tauntRoute = board.length > 0
            ? findPath(enemy, taunter.position, collisionUnits, board, terrainDefs)
            : [];
        const tauntIdeal = board.length > 0 && tauntRoute.length === 0
            ? findPath(enemy, taunter.position, [], board, terrainDefs)
            : tauntRoute;
        // moveTo / movePath drive the telegraph, so they must be set on every MOVE intent.
        const tauntWalk = tauntIdeal.slice(0, Math.max(1, enemy.moveRange));
        if (tauntWalk.length > 0) {
            return {
                type: 'MOVE',
                description: 'Provoked! Coming for you...',
                moveTo: tauntWalk[tauntWalk.length - 1],
                movePath: tauntWalk,
            };
        }
        // Walled off from the taunter: still telegraph that it is straining toward the taunt
        // rather than silently reverting to hunting brains, which would read as the skill failing.
        return { type: 'MOVE', description: 'Provoked, but blocked...' };
    }

    // Route with the board empty of units, and the route it can actually walk today.
    const idealRoute = board.length > 0 ? findPath(enemy, goal, [], board, terrainDefs) : [];
    const realRoute = board.length > 0 ? findPath(enemy, goal, collisionUnits, board, terrainDefs) : [];
    const distToGoal = manhattan(enemy.position, goal);

    /**
     * Priority ladder:
     *   1. brain within reach this turn  -> take it, ignore everything else
     *   2. a plant in the way            -> bite it
     *   3. otherwise                     -> walk to whatever tile gets closest to a brain
     *
     * The previous version weighed "is chewing faster than walking around?" and the answer was
     * almost always no: a 1-damage zombie needs eight bites to clear an 8 HP wall, so it always
     * walked round. Measured over six turns, six zombies were adjacent to a plant twice in the
     * entire fight — they simply strolled past the squad to the brains. Reaching a brain is the
     * only thing that beats eating what is in front of you.
     */
    // "In reach" means attack range — standing next to the house — not movement range.
    // Using movement range instead made rule 1 fire almost every turn on an open board (a
    // brain is nearly always within 3 steps), so nothing was ever bitten. Adjacency is the
    // reading that keeps rule 2 alive.
    //
    // And the goal must still HOLD something. `findGoal` falls back to the nearest house when
    // every brain is gone, which is the right heading to walk in — but a zombie that has
    // already robbed the house it is standing beside would otherwise keep telegraphing a bite
    // on an empty building for the rest of the fight, red arrow and all. It survives the theft
    // now (see turnManager's BRAIN BITE), so this stopped being a state nobody could reach.
    const goalTile = board.find(t => t.x === goal.x && t.y === goal.y);
    const goalIsWorthBiting = !goalTile?.isHouse || !!goalTile.hasBrain;
    const brainWithinReach = distToGoal <= 1 && goalIsWorthBiting;

    // Melee bites at 1. Catapult Zombie shells from 3 and never has to close.
    const reach = Math.max(1, enemy.attackRange ?? 1);

    let blocker: Unit | null = null;
    if (!brainWithinReach) {
        for (const p of playerUnits) {
            if (manhattan(p.position, enemy.position) > reach) continue;
            // A melee zombie must not turn around to eat something behind it — the bite has to
            // be on the way to a brain. A shooter has no such constraint: firing costs it no
            // ground, so anything inside its arc is fair game.
            //
            // `>=` and `>` are equivalent here and always will be: an adjacent tile's distance
            // to the goal differs from the zombie's by exactly one, never zero (one step of
            // Manhattan distance flips parity), so no adjacent plant is ever "level" with it.
            if (reach === 1 && manhattan(p.position, goal) >= distToGoal) continue;
            // Lowest HP first: chew through the wall it can actually break.
            if (!blocker || p.hp < blocker.hp) blocker = p;
        }
    }

    // --- BOSS BEHAVIOUR ---
    //
    // One lookup, ahead of the standard ladder, and nothing else in this file knows a boss
    // exists. The Gargantuar's rules used to sit here inline; they now live in
    // utils/bossBehaviours.ts alongside every other boss, because nine of them written this
    // way would bury the ordinary zombie AI under nine exceptions that never apply to it.
    //
    // A behaviour returning null means "nothing special this turn" and falls through to the
    // standard ladder below — which is the common case, and should be.
    const behaviour = behaviourFor(enemy.bossId);
    if (behaviour) {
        const special = behaviour({
            enemy, playerUnits, board, terrainDefs, goal, damage, blocker,
        });
        if (special) return special;
    }

    // --- STANDARD AI ---

    // Something is blocking the way to the brain: eat it first.
    // This runs AFTER movement, so a zombie that walked up to a plant telegraphs the hit here.
    if (blocker) {
        return { type: 'ATTACK', target: blocker.position, damage };
    }

    // Otherwise walk. moveTo / movePath drive the movement telegraph, so they must always be set.
    const route = findPath(enemy, goal, collisionUnits, board, terrainDefs);
    let walk = (route.length > 0 ? route : idealRoute).slice(0, Math.max(1, enemy.moveRange));

    if (walk.length === 0) {
        // Walled in, or called without board data: still telegraph a straight march at the brain.
        const straight: Position[] = [];
        let cur = enemy.position;
        for (let i = 0; i < Math.max(1, enemy.moveRange); i++) {
            if (cur.y > goal.y) cur = { x: cur.x, y: cur.y - 1 };
            else if (cur.y < goal.y) cur = { x: cur.x, y: cur.y + 1 };
            else if (cur.x > goal.x) cur = { x: cur.x - 1, y: cur.y };
            else if (cur.x < goal.x) cur = { x: cur.x + 1, y: cur.y };
            else break;
            straight.push(cur);
        }
        walk = straight;
    }

    if (walk.length === 0) {
        return { type: 'MOVE', description: 'Blocked...' };
    }

    return {
        type: 'MOVE',
        description: 'Smells brains...',
        moveTo: walk[walk.length - 1],
        movePath: walk
    };
};
