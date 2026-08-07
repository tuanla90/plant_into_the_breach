import { AreaHit, Intent, Position, TerrainDefinition, TileData, TurnAction, Unit, UnitClass, BossId } from '../types';
import { chainStep } from './elements';
import { canStopOn, findPath, getTileAt, isRailBound, survivesWater } from './gameLogic';
import { DEFAULT_TERRAIN_DEFS } from '../data/terrain';

/**
 * ONE TABLE, NOT NINE `if` BLOCKS.
 *
 * The Gravehulk's special case used to live inline in `planEnemyIntent`, ahead of the
 * standard ladder. That was fine for one boss. Nine of them written the same way is an
 * 800-line function where the ordinary zombie AI — the thing that runs for every unit in
 * every fight — is buried in the middle of nine exceptions that never apply to it.
 *
 * So: `planEnemyIntent` computes the shared facts once (where the sprout is, what is blocking,
 * what the damage number is) and hands them to a behaviour looked up by boss id. A behaviour
 * returns an Intent to override the standard plan, or `null` to say "nothing special this
 * turn, walk and bite like anything else". Returning null is the common case and it should
 * be: a boss that ignores the base rules every single turn is not a boss, it is a cutscene.
 *
 * Keyed by `Unit.bossId`, not by unit class. Two bosses may share a class (a Gravehulk and a
 * bigger Gravehulk), and a class used by a boss may also turn up as an ordinary add — the
 * Headliner's dance floor is full of Dancers. Identity has to be on the unit.
 */

export interface BossContext {
    /** The boss itself. `hp`/`maxHp` are live, so phase changes read straight off it. */
    enemy: Unit;
    /** Everything the boss could target. */
    playerUnits: Unit[];
    board: TileData[];
    terrainDefs: Record<string, TerrainDefinition>;
    /** The tile this unit is walking toward — the nearest Greenspire that still holds a sprout. */
    goal: Position;
    /** Damage this unit would deal right now, aura included. */
    damage: number;
    /**
     * The plant the standard ladder would bite this turn, if any. Behaviours use it to answer
     * "is anything actually in reach" without re-deriving reach rules.
     */
    blocker: Unit | null;
}

export type BossBehaviour = (ctx: BossContext) => Intent | null;

/**
 * Not every boss trait is an intent.
 *
 * Cinder Colossus does not DECIDE to leave lava behind — the ground burns because it walked
 * on it. Yeti's chill is a radius, not an action. Those are side effects of a turn, and they
 * would naturally be written as `if (unit.bossId === ...)` inside turnManager, which is how
 * boss logic gets scattered across the engine one boss at a time. So they get hooks here
 * instead, and turnManager calls the table at two fixed points knowing nothing about who is
 * in it.
 *
 * Both hooks return TurnActions to append. They must NOT mutate the unit: the caller owns
 * the simulation, and an action list that disagrees with it is the classic desync in this
 * codebase (see the note on `applyEnvDamage` in turnManager).
 */
export interface BossHooks {
    /** Overrides the standard intent for this turn, or null to fall through to it. */
    plan?: BossBehaviour;
    /** Fires after this boss has walked, with the tiles it walked through. */
    onMoved?: (ctx: { enemy: Unit; path: Position[]; board: TileData[] }) => TurnAction[];
    /**
     * Overrides where this boss walks. `[]` means "stay exactly here"; null means "no opinion,
     * use the standard rules". The path is walked step by step and truncated at the first tile
     * that is no longer free, so a body dropped in the way still stops it.
     *
     * The hooks around it are about what a boss DOES. This one is about where it ENDS UP, and
     * it exists because the standard ladder answers one question — which tile gets me closest
     * to a sprout — and two bosses are not asking it. The Yeti grips a hero and would otherwise
     * stroll past to the Greenspires, so the smash it spent a turn setting up never lands. Ironcart
     * wants the exact opposite of closest: the furthest tile that still has somebody in its arc.
     */
    move?: (ctx: {
        enemy: Unit;
        playerUnits: Unit[];
        board: TileData[];
        range: number;
    }) => Position[] | null;
    /**
     * Fires once at the end of the enemy turn, after everything has moved.
     *
     * `units` is the live board, not just the boss. The Colossus only ever needed the tiles
     * under its own feet, but a trait with a RADIUS has to know who ended the turn standing
     * in it, and there is no way to derive that from `board`.
     */
    onTurnEnd?: (ctx: { enemy: Unit; units: Unit[]; board: TileData[] }) => TurnAction[];
}

const manhattan = (a: Position, b: Position) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/** Closest player unit, or null on an empty field. */
const nearest = (from: Position, units: Unit[]): Unit | null => {
    let best: Unit | null = null;
    let bestDist = Infinity;
    for (const u of units) {
        const d = manhattan(u.position, from);
        if (d < bestDist) { bestDist = d; best = u; }
    }
    return best;
};

/**
 * Free tiles beside `pos` — somewhere a body could actually be put down.
 *
 * GROUND IS CHECKED. It was not, and that was a real bug rather than an omission: every caller
 * here feeds the result straight into a SPAWN intent, and PHASE 3 only tests the tile for
 * OCCUPANCY before dropping a unit on it. So a wall counted as "open", and the Gravehulk could
 * throw an imp into one. It went unnoticed for as long as it did because the boards in play had
 * walls at the edges and the summons happened in the middle; the Breach arena is a wall RING,
 * which put one directly in reach and made it show up in the first test.
 *
 * Water and lava are refused as well. Neither is a wall, but a summon that drowns or burns on
 * arrival is a turn the boss spent doing nothing, and it would read to the player as the
 * telegraph having lied.
 */
const openNeighbours = (pos: Position, board: TileData[], occupied: Unit[]): Position[] =>
    [
        { x: pos.x + 1, y: pos.y },
        { x: pos.x - 1, y: pos.y },
        { x: pos.x, y: pos.y + 1 },
        { x: pos.x, y: pos.y - 1 },
    ].filter(n => {
        if (n.x < 0 || n.x >= 8 || n.y < 0 || n.y >= 8) return false;
        const tile = board.find(t => t.x === n.x && t.y === n.y);
        if (!tile || tile.isHouse) return false;
        if (!DEFAULT_TERRAIN_DEFS[tile.terrain]?.isWalkable) return false;
        if (tile.terrain === 'WATER' || tile.terrain === 'LAVA') return false;
        return !occupied.some(u => u.hp > 0 && u.position.x === n.x && u.position.y === n.y);
    });

/** The four tiles around a position that are actually on the board. */
const ring = (pos: Position): Position[] =>
    [
        { x: pos.x + 1, y: pos.y },
        { x: pos.x - 1, y: pos.y },
        { x: pos.x, y: pos.y + 1 },
        { x: pos.x, y: pos.y - 1 },
    ].filter(p => p.x >= 0 && p.x < 8 && p.y >= 0 && p.y < 8);

/** Below half health. The one phase line every boss in the plan shares. */
const wounded = (enemy: Unit) => enemy.hp <= Math.floor(enemy.maxHp / 2);

// ---------------------------------------------------------------------------------------
// I-1 · GRAVEHULK — the first thing too big to push
// ---------------------------------------------------------------------------------------

/**
 * Migrated verbatim from `aiLogic.planEnemyIntent`, with one addition: the phase line.
 *
 * The original rule was `shouldThrow = minDist > 4` — throw when too far to swing, walk in and
 * swing when close. Deterministic on purpose: it replaced a `Math.random() < 0.3` that made the
 * same board play differently every attempt, which a scripted tutorial cannot tolerate.
 *
 * Wounded, that distance drops to 2. It does not gain a new move or a bigger number; it simply
 * stops closing and starts throwing, which reads on screen as "it has given up on reaching you
 * itself" and puts a body behind the line every turn instead of every few.
 */
const gargantuar: BossBehaviour = ({ enemy, playerUnits, board, blocker }) => {
    // Anything in reach is smashed, always. A 5-damage swing beats any amount of cleverness.
    if (blocker) return { type: 'ATTACK', target: blocker.position, damage: enemy.damage };

    const closest = nearest(enemy.position, playerUnits);
    if (!closest) return null;

    const throwRange = wounded(enemy) ? 2 : 4;
    if (manhattan(closest.position, enemy.position) <= throwRange) return null;

    const landing = openNeighbours(closest.position, board, playerUnits)[0];
    if (!landing) return null;

    return {
        type: 'SPAWN',
        target: landing,
        spawnClass: UnitClass.RUNT,
        spawnTiles: [landing],
        description: 'Throwing Runt!',
    };
};

// ---------------------------------------------------------------------------------------
// III-1 · THE HEADLINER — the crowd is the threat, not the body holding the microphone
// ---------------------------------------------------------------------------------------

/**
 * It deals 1 damage and it is the most dangerous thing on the board, because everything else
 * on the board is +1 damage while it is alive (the ENRAGED aura, turnManager PHASE 1.5 — the
 * same aura the Bannerman carries, which is why this boss needed no new status).
 *
 * The assumption it breaks is "shoot the biggest thing". Here the biggest thing is nearly
 * harmless and the correct target is the one multiplying everyone else.
 *
 * CALL THE DANCERS every other turn, four bodies at once. Every other, not every turn: four a
 * turn outruns any squad's ability to clear them, and the fight stops being a decision about
 * targeting and becomes a losing race. On the off-turn it walks at a sprout like anything else,
 * which is what gives the player the window the whole fight is built around.
 */
const headliner: BossBehaviour = ({ enemy, playerUnits, board, blocker, damage }) => {
    // Parity comes off the boss's own clock rather than the global turn, so a boss that
    // arrives mid-fight still alternates from the moment it appears.
    const beat = (enemy.bossClock ?? 0) % 2 === 0;

    if (beat) {
        const landings = openNeighbours(enemy.position, board, playerUnits).slice(0, 4);
        if (landings.length > 0) {
            return {
                type: 'SPAWN',
                target: landings[0],
                spawnClass: UnitClass.WALKER,
                spawnTiles: landings,
                description: 'Calling the dancers!',
            };
        }
    }

    if (blocker) return { type: 'ATTACK', target: blocker.position, damage };
    return null;
};

// ---------------------------------------------------------------------------------------
// I-3 · CINDER COLOSSUS — the board is not a constant
// ---------------------------------------------------------------------------------------

const isLava = (board: TileData[], x: number, y: number) =>
    board.some(t => t.x === x && t.y === y && t.terrain === 'LAVA');

/**
 * Every tile it walks on turns to lava, permanently.
 *
 * The assumption being broken is that the arena is furniture. Seven turns of this and the
 * corridor you were holding is a wall of fire you laid out for it by choosing where to make
 * it walk — which is also the counterplay, because you decide where it walks by deciding
 * where to stand.
 *
 * The tile it LEAVES burns, not the one it arrives on: standing in your own trail should be
 * survivable for the thing that made it, and more importantly the arriving tile is where the
 * player is about to shove it, and a tile that burns on arrival would price that play twice.
 */
const cinderTrail: BossHooks['onMoved'] = ({ enemy, path, board }) => {
    const walked = [enemy.position, ...path];
    const actions: TurnAction[] = [];
    // The final tile is where it now stands — everything before it is trail.
    walked.slice(0, -1).forEach(pos => {
        const tile = board.find(t => t.x === pos.x && t.y === pos.y);
        // Never a Greenspire, never water: it scorches ground, it does not redraw the map.
        if (!tile || tile.isHouse || tile.terrain === 'LAVA'
            || tile.terrain === 'WATER' || tile.terrain === 'WALL' || tile.terrain === 'MOUNTAIN') return;
        actions.push({ type: 'MODIFY_TERRAIN', pos, terrain: 'LAVA' });
        actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'BURN', pos });
    });
    return actions;
};

/**
 * Standing in its own fire feeds it, and cracking open is what it does when hurt.
 *
 * The heal is 1 and it is conditional on TWO adjacent lava tiles, which means it is only ever
 * paid while the Colossus sits in the middle of the mess it made. Pushing it one tile out —
 * Ironhusk's free shove, the cheapest action in the game — turns the tap off. That is the
 * whole reason the number is small: it is not a race against a health bar, it is a reason to
 * spend a shove on something other than damage.
 *
 * At half health the shell splits: it loses FREEZE immunity. A hard reward for a player who
 * kept a control tool in hand instead of spending everything on the opening.
 */
const cinderTurnEnd: BossHooks['onTurnEnd'] = ({ enemy, board }) => {
    const actions: TurnAction[] = [];
    const { x, y } = enemy.position;
    const adjacentLava = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        .filter(([dx, dy]) => isLava(board, x + dx, y + dy)).length;

    if (adjacentLava >= 2 && enemy.hp < enemy.maxHp) {
        actions.push({ type: 'APPLY_DAMAGE', targetId: enemy.id, amount: 1, eventType: 'HEAL', pos: enemy.position });
    }

    if (wounded(enemy) && enemy.immunities.includes('FREEZE')) {
        actions.push({
            type: 'UPDATE_UNIT_STATE',
            unitId: enemy.id,
            updates: { immunities: enemy.immunities.filter(i => i !== 'FREEZE') },
        });
        actions.push({ type: 'APPLY_DAMAGE', targetId: enemy.id, amount: 0, eventType: 'BUFF', pos: enemy.position });
    }

    return actions;
};

// ---------------------------------------------------------------------------------------
// III-3 · VOLTMAW — distance is not safety, and the tile that pays you is the trap
// ---------------------------------------------------------------------------------------

/**
 * Every boss above breaks an assumption about the RULES. This one breaks an assumption about
 * the BOARD: that a square handing you +1 damage is a square you want to be standing on.
 *
 * CONDUCTION. Anything standing on a POWER_TILE is in reach, at any distance — and that is
 * deliberately NOT written as `attackRange: 8` on the body. A range is a radius, and a radius
 * that big would also let it bite the hero on dry ground behind a wall, which inverts the
 * lesson. The reach follows the WIRE, so it is a property of the target's tile and lives here.
 *
 * ARC LASH. 3 on the target, 2 on the bodies beside it, 1 one step further. The walk is
 * `chainStep` (utils/elements.ts) — the same one the LIGHTNING element uses, with `branching`
 * on. That sharing is the point: the function returns bodies and never a damage number, so
 * each ring's worth is stated here and cannot be inherited from anywhere. Two hand-rolled
 * copies of this loop is exactly how a 999 once arced onward for 499.
 *
 * OVERLOAD. Below half, every live tile discharges — including the one under its own feet,
 * with no line of code about Voltmaw anywhere: the blast list is TILES, and it is standing on
 * one. It rides the intent rather than an end-of-turn hook so that it is telegraphed a full
 * turn like everything else; a hook fires in the turn it is decided, which would make it the
 * one thing on the board nobody could see coming.
 */
const isLive = (board: TileData[], p: Position) =>
    board.some(t => t.x === p.x && t.y === p.y && t.environment === 'POWER_TILE');

/**
 * Who the wire reaches, and which of them it takes: the body with the most neighbours, then
 * the weakest, then reading order. Never the nearest and never a roll — a game promising
 * perfect information cannot decide a telegraph with dice, and "most neighbours" is the whole
 * lesson stated as a targeting rule. Seven acts taught the squad to hold a corridor shoulder
 * to shoulder; this is the turn that habit picks its own victim.
 */
const conducted = (playerUnits: Unit[], board: TileData[]): Unit | null => {
    const live = playerUnits.filter(u => u.hp > 0);
    const wired = live.filter(u => isLive(board, u.position));
    if (wired.length === 0) return null;
    const neighbours = (u: Unit) =>
        live.filter(o => o.id !== u.id && manhattan(o.position, u.position) === 1).length;
    return [...wired].sort((a, b) =>
        neighbours(b) - neighbours(a)
        || a.hp - b.hp
        || a.position.x - b.position.x
        || a.position.y - b.position.y)[0];
};

/**
 * The two rings behind the primary hit.
 *
 * Falloff is `damage - ring`, floored at 1, so 3/2/1 is DERIVED from the stat rather than
 * typed out three times. A Bannerman's ENRAGED aura is already folded into `damage`, so an
 * escorted Voltmaw arcs 4/3/2 with no code — and one balance change retunes all three rings.
 */
const arcLash = (origin: Position, damage: number, playerUnits: Unit[]): AreaHit[] => {
    const unitAt = (p: Position) =>
        playerUnits.find(u => u.hp > 0 && u.position.x === p.x && u.position.y === p.y);
    // Seeded with the primary tile: that body is billed by the ordinary ATTACK path, and an
    // arc that came back to it would charge one swing twice.
    const struck = new Set<string>([`${origin.x},${origin.y}`]);
    const hits: AreaHit[] = [];
    let frontier: Position[] = [origin];

    for (let ring = 1; ring <= 2; ring++) {
        const found: Unit[] = [];
        frontier.forEach(from => found.push(
            // SHOCK-immune bodies are not conductors (the lightning hero's element perk):
            // Voltmaw's lash arcs around her, which is her counter-pick in this fight.
            ...chainStep(from, unitAt, u => !u.isEnemy && !u.immunities.includes('SHOCK'), struck, { branching: true })));
        if (found.length === 0) break;
        const amount = Math.max(1, damage - ring);
        found.forEach(u => hits.push({ pos: { ...u.position }, damage: amount }));
        frontier = found.map(u => ({ ...u.position }));
    }
    return hits;
};

/** One hit per live tile, aimed at nobody — the ground itself letting go. */
const overload = (board: TileData[]): AreaHit[] =>
    board.filter(t => t.environment === 'POWER_TILE')
         .map(t => ({ pos: { x: t.x, y: t.y }, damage: 1, stun: true }));

const voltmaw: BossBehaviour = ({ enemy, playerUnits, board, blocker, damage }) => {
    // Below half the grid is going off whatever else it decides to do this turn.
    const surge = wounded(enemy) ? overload(board) : [];

    // The wire first, the teeth second. `blocker` is the ordinary reach the standard ladder
    // already worked out, so nothing here re-derives adjacency.
    const victim = conducted(playerUnits, board) ?? blocker;
    if (victim) {
        // Two sources landing on one tile collapse to the LARGER rather than summing: the
        // player has to add these up by eye. The primary's own tile is dropped outright — it
        // is already telegraphed by `target`, and one body should not print two numbers.
        const byTile = new Map<string, AreaHit>();
        [...arcLash(victim.position, damage, playerUnits), ...surge].forEach(hit => {
            if (hit.pos.x === victim.position.x && hit.pos.y === victim.position.y) return;
            const k = `${hit.pos.x},${hit.pos.y}`;
            const prev = byTile.get(k);
            if (!prev) { byTile.set(k, { ...hit, pos: { ...hit.pos } }); return; }
            prev.damage = Math.max(prev.damage, hit.damage);
            prev.stun = prev.stun || hit.stun;
        });
        return {
            type: 'ATTACK',
            target: { ...victim.position },
            damage,
            blast: [...byTile.values()],
            description: 'Arc Lash!',
        };
    }

    // Nothing on the wire and nothing in reach. In phase two the grid still lets go, so the
    // turn is not empty — and neither is the telegraph.
    if (surge.length > 0) return { type: 'WAIT', blast: surge, description: 'Overloading!' };
    return null;
};

// ---------------------------------------------------------------------------------------
// II-3 · YETI — the kill takes two turns, and you are shown both of them
// ---------------------------------------------------------------------------------------

/**
 * STUN and FREEZE are two spellings of "this one does not get its turn". Either opens the
 * smash — a hero the PLAYER froze is exactly as helpless as one the bear gripped, and it has
 * no reason to be polite about whose ice it is standing on.
 */
const helpless = (u: Unit) =>
    u.statusEffects.includes('STUN') || u.statusEffects.includes('FREEZE');

/**
 * FROST GRIP on turn one, ICE SMASH on turn two: 0 damage, then double.
 *
 * 6 is not a round number chosen for weight — it is the health of the three thinnest heroes in
 * the roster (6, data/heroes.ts). The pair is a KILL, not a scare, and that is the encounter:
 * the player is shown a death two turns out and has one turn to spend on somebody other than
 * the victim, because the victim cannot move. Kill it, body-block it, or shove it — it is not
 * PUSH-immune, on purpose.
 *
 * THE DOUBLING LIVES HERE, NOT IN calculateDamage, and the reason is the telegraph.
 * `Intent.damage` is the number the tile prints (utils/threat.ts). Double it at resolution and
 * the board would advertise 3 while dealing 6 — the one thing this game promises never to do.
 * The other reason is blast radius: calculateDamage is the funnel EVERY source runs through,
 * so "hits harder on a held target" at that altitude would also double the player's own
 * freeze-then-hit combos and every lava tick under a stunned body.
 *
 * The victim is looked up directly rather than trusting `blocker`, which the standard ladder
 * picks by LOWEST HP. Once a grip has landed, the frozen hero is often no longer the weakest
 * thing adjacent — and the bear would wander off and grip a SECOND target instead of cashing
 * the first. A combo that never completes is not a combo.
 */
const yeti: BossBehaviour = ({ enemy, playerUnits, blocker, damage }) => {
    const reach = Math.max(1, enemy.attackRange ?? 1);
    const held = playerUnits.find(p =>
        p.hp > 0 && helpless(p) && manhattan(p.position, enemy.position) <= reach);

    if (held) {
        return {
            type: 'ATTACK',
            target: { ...held.position },
            // Doubled off `damage`, not off the literal 3, so a Bannerman's aura rides the
            // smash exactly the way it rides every other bite on the board.
            damage: damage * 2,
            description: 'Ice Smash!',
        };
    }

    // Nothing helpless in reach. No grip at range, ever: keeping the bear off the squad is the
    // entire counterplay, and an arm longer than its arm would delete it.
    if (!blocker) return null;

    return {
        type: 'ATTACK',
        target: { ...blocker.position },
        // Zero damage on purpose. The grip costs a turn, not health. A hero who also took 3
        // walking in would be dead to the smash whatever the squad did about it, which turns a
        // two-turn decision back into a one-turn ambush.
        damage: 0,
        statusOnHit: ['STUN'],
        description: 'Frost Grip!',
    };
};

/**
 * CHILL — a radius, not an action, which is exactly why it is a hook and not an intent.
 *
 * Anything that ENDS its turn beside the Yeti is slowed. Deliberately not telegraphed, because
 * there is nothing to warn about: the trigger tiles are the four the player can see it standing
 * on, and the payload is lost ground rather than damage, so nothing can die to a surprise here.
 * The assumption it breaks is "melee is safe until it swings" — walking up to the bear costs
 * half your movement next turn whether or not it ever touches you.
 *
 * Radius 2 below half health, and that IS phase two, all of it. The plan also had it freezing
 * two tiles to ICE per turn; dropped, and the reason is in the data — `arena_yeti` is already
 * ice wall to wall, and nothing in the engine reads `terrain === 'ICE'` at all. It would have
 * been a no-op painted onto a no-op.
 *
 * Enemies are skipped: NEW_TURN_RESET still wipes SLOW off the horde on the way out of this
 * same turn, so a chill on its own escorts would be erased before anything could read it.
 */
/**
 * It does not walk away from something it has already frozen.
 *
 * Without this the bear grips a hero, then the standard ladder walks it three tiles toward the
 * nearest sprout, and next turn the victim it spent an action setting up is out of reach. The
 * hero is stunned and cannot follow — so the combo the whole encounter is built on would break
 * on the one turn it is supposed to be unavoidable.
 *
 * Only while the victim is HELD. The rest of the time it marches like anything else, which is
 * what stops "stand next to it forever" being a way to park the fight.
 */
const yetiHold: BossHooks['move'] = ({ enemy, playerUnits }) => {
    const reach = Math.max(1, enemy.attackRange ?? 1);
    const holding = playerUnits.some(p =>
        p.hp > 0 && helpless(p) && manhattan(p.position, enemy.position) <= reach);
    // [] is "stand still"; null is "no opinion, march like anything else".
    return holding ? [] : null;
};

const yetiChill: BossHooks['onTurnEnd'] = ({ enemy, units }) => {
    const radius = wounded(enemy) ? 2 : 1;
    const actions: TurnAction[] = [];

    units.forEach(u => {
        // `isEnemy` also excludes the bear itself, which matters: FREEZE immunity does not stop
        // SLOW (see UnitImmunity), so it would otherwise chill its own feet.
        if (u.isEnemy || u.hp <= 0) return;
        if (manhattan(u.position, enemy.position) > radius) return;
        // STATUS is the immunity that stops everything. FREEZE is deliberately not checked
        // here, matching skillResolution and the retaliation block in turnManager.
        if (u.immunities.includes('STATUS')) {
            actions.push({ type: 'APPLY_DAMAGE', targetId: u.id, amount: 0, eventType: 'IMMUNE', pos: u.position });
            return;
        }
        if (u.statusEffects.includes('SLOW')) return;
        const chilled: typeof u.statusEffects = [...u.statusEffects, 'SLOW'];
        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { statusEffects: chilled } });
    });

    return actions;
};

// ---------------------------------------------------------------------------------------
// I-2 · IRONCART — the turn standing in the right place stopped being enough
// ---------------------------------------------------------------------------------------

/** Splash on the four tiles around the shell. 1, not 2, on purpose — see the note below. */
const IRONCART_SPLASH = 1;

/**
 * SHELL BARRAGE is 3 where it lands and 1 on the four beside it.
 *
 * 3 is picked to be survivable by every body in the roster and by none of them twice: the
 * thinnest hero is 6, or 4 once an element has been bought. So one shell is a decision and two
 * on one hero is a death — the Gravehulk's swing, moved from one tile to five.
 *
 * The splash is 1 rather than 2 from the other direction: it has to be worth stepping out of,
 * and it must never be the thing that loses the fight. A hero clipped for 1 has had a turn's
 * warning and can be healed; clipped for 2 twice they are dead for standing next to a friend,
 * which taxes the formation instead of asking a question about it.
 *
 * Every tile in the arc is a candidate, not only the ones heroes stand on: the empty square
 * BETWEEN two heroes is often the better shot, and it is what makes the splash a threat rather
 * than a rounding error. Scored by the damage it would actually deal, so retuning the numbers
 * retunes the aim with them. Fixed scan order and a strictly-greater test: a boss that rolls
 * dice cannot be telegraphed honestly, and the scripted replays could not tolerate it.
 *
 * Greenspires are excluded outright — `computeBrainThreats` reads an ATTACK aimed at a Greenspire as
 * "the sprout goes next turn", so aiming there would print a sprout-theft warning for a shell.
 */
const aimShell = (from: Position, range: number, targets: Unit[], board: TileData[]): Position | null => {
    let best: Position | null = null;
    let bestScore = 0;
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            const dist = manhattan(from, { x, y });
            if (dist === 0 || dist > range) continue;
            const tile = getTileAt({ x, y }, board);
            if (!tile || tile.isHouse) continue;
            const direct = targets.some(u => u.position.x === x && u.position.y === y) ? 3 : 0;
            const splash = ring({ x, y }).filter(p =>
                targets.some(u => u.position.x === p.x && u.position.y === p.y)).length;
            const score = direct + splash;
            if (score > bestScore) { bestScore = score; best = { x, y }; }
        }
    }
    return best;
};

/** Every rail tile the cart could roll to this turn, with the route that gets it there. */
const railReach = (from: Position, board: TileData[], range: number): Array<{ pos: Position; path: Position[] }> => {
    const out: Array<{ pos: Position; path: Position[] }> = [];
    const seen = new Set<string>([`${from.x},${from.y}`]);
    let frontier: Array<{ pos: Position; path: Position[] }> = [{ pos: from, path: [] }];

    for (let step = 0; step < range; step++) {
        const next: Array<{ pos: Position; path: Position[] }> = [];
        frontier.forEach(({ pos, path }) => {
            ring(pos).forEach(p => {
                const k = `${p.x},${p.y}`;
                if (seen.has(k)) return;
                if (getTileAt(p, board)?.terrain !== 'RAIL') return;
                seen.add(k);
                const entry = { pos: p, path: [...path, p] };
                out.push(entry);
                next.push(entry);
            });
        });
        frontier = next;
    }
    return out;
};

/**
 * REVERSE DOWN THE LINE — the whole boss in one sentence.
 *
 * Of every tile it can roll to, including the one it is on, it takes the one FURTHEST from the
 * nearest hero that still keeps somebody inside its 4-tile arc.
 *
 * Both halves are load-bearing. Retreating out of range entirely would make it harmless and the
 * fight would stall against the clock; holding station — which is what the standard ladder makes
 * every other ranged unit do — would make it a Lobber with a bigger health bar. Maximum
 * standoff WITH a shot is the pressure: the tile you spent your turn walking to is empty, and
 * the shell arrives anyway.
 *
 * With nothing in the arc it rolls the OTHER way, toward the nearest hero. A cart that cannot
 * shoot has lost the fight for free, and a boss you can simply walk away from is not a boss.
 */
const railStandoff = (enemy: Unit, targets: Unit[], board: TileData[], range: number): Position[] => {
    if (targets.length === 0) return [];
    const reach = Math.max(1, enemy.attackRange ?? 1);
    const options = [{ pos: enemy.position, path: [] as Position[] }, ...railReach(enemy.position, board, range)];
    const gap = (p: Position) => Math.min(...targets.map(u => manhattan(p, u.position)));

    const armed = options.filter(o => gap(o.pos) <= reach);
    const pool = armed.length > 0 ? armed : options;
    // Ties break on the shorter walk, then the deeper tile. Deterministic, like aimShell.
    pool.sort((a, b) => (armed.length > 0 ? gap(b.pos) - gap(a.pos) : gap(a.pos) - gap(b.pos))
        || a.path.length - b.path.length
        || b.pos.y - a.pos.y);
    return pool[0].path;
};

const ironcart: BossBehaviour = ({ enemy, playerUnits, board, terrainDefs, damage }) => {
    const alive = playerUnits.filter(u => u.hp > 0);
    if (alive.length === 0) return null;

    // It opens on a spawn tile, and a spawn tile is grass: its first turn is spent getting onto
    // the track. `isRailBound` is false until it is standing on rail, which is what lets it walk
    // here at all (utils/gameLogic.ts).
    if (!isRailBound(enemy, board)) {
        const rails = board.filter(t => t.terrain === 'RAIL')
            .sort((a, b) => manhattan(a, enemy.position) - manhattan(b, enemy.position) || a.x - b.x || a.y - b.y);
        for (const rail of rails) {
            const route = findPath(enemy, { x: rail.x, y: rail.y }, alive, board, terrainDefs);
            if (route.length > 0) {
                const walk = route.slice(0, Math.max(1, enemy.moveRange));
                return { type: 'MOVE', description: 'Rolling onto the track...', moveTo: walk[walk.length - 1], movePath: walk };
            }
        }
        return null;
    }

    const reach = Math.max(1, enemy.attackRange ?? 1);
    const inArc = alive.filter(u => manhattan(u.position, enemy.position) <= reach);
    if (inArc.length === 0) return null;

    const centre = aimShell(enemy.position, reach, alive, board);
    if (!centre) return null;

    return {
        type: 'ATTACK',
        target: centre,
        // ctx.damage, not enemy.damage: a Bannerman in the escort buys the cart its +1 like
        // anything else, and the telegraph has to say so.
        damage,
        blast: ring(centre)
            .filter(p => !getTileAt(p, board)?.isHouse)
            .map(p => ({ pos: p, damage: IRONCART_SPLASH })),
        description: 'Shell barrage!',
    };
};

/** The retreat, chosen fresh each turn. Truncated by turnManager at the first blocked tile. */
const ironcartMove: BossHooks['move'] = ({ enemy, playerUnits, board, range }) => {
    if (!isRailBound(enemy, board)) return null;   // still walking to the track: ordinary rules
    return railStandoff(enemy, playerUnits.filter(u => u.hp > 0), board, range);
};

// ---------------------------------------------------------------------------------------
// III-2 · CLOCKJAW — what a telegraph never gave you is TIME
// ---------------------------------------------------------------------------------------

/**
 * Every boss above breaks an assumption about a rule, a board or a target. This one breaks the
 * CONTRACT: that being shown the enemy turn is the same as being able to answer it. It is shown
 * in full, a turn early, like everything else — and there is still no line of play that stops
 * all of it. The verbs left are ABSORB and SPREAD, which is precisely why the act pays out
 * Gourdward's 5-point shell.
 *
 * TWO FULL BLOWS a turn, three below half. Deliberately `strikes` and not `blast`: each is a
 * complete attack running the whole PHASE 3 path, because a hand coming down twice is two hits,
 * not one hit with a footprint. That has a consequence worth saying out loud — THORNSHELL
 * ANSWERS EVERY BEAT. His 2 spines are 4 a turn here and 6 once it winds down, which is the
 * whole 22 HP bar in four turns from a hero standing still. The boss whose gimmick is "more
 * actions" is undone by the one hero paid per action taken against him, and he is the reward
 * for the PREVIOUS act.
 *
 * WHO GETS HIT: one blow per body in reach, weakest first, wrapping back to the front when
 * there are more blows than bodies. Both halves matter.
 *   - Weakest-first is not a new rule; it is the standard ladder's `blocker` pick generalised
 *     from one blow to N, with reading order breaking ties. No roll — a game promising perfect
 *     information cannot decide a telegraph with dice.
 *   - The WRAP is the fight. Alone in the alley a hero eats 3+3 = 6, the health of the three
 *     thinnest heroes in the roster. Stand two abreast and it is 3 and 3 and nobody dies. So
 *     the answer to "you cannot prevent this" is BODIES — and RUIN's Collapse spends the whole
 *     fight taking that answer away two permanent walls at a time, without one line here
 *     knowing the hazard exists.
 *
 * It bites in ANY direction, unlike an ordinary melee zombie. The forward-only rule in aiLogic
 * exists so a zombie never detours from the sprout it is walking to; a boss is struck off the
 * sprout-grab path entirely (turnManager PHASE 4), so it has no errand to detour from and no
 * reason to ignore what is standing behind it.
 *
 * WINDING BACKWARDS (half health): three blows instead of two, each worth one less. 2x3 and 3x2
 * are the same six damage ON PURPOSE — phase two is not more damage, it is one more decision
 * per turn on a board with one fewer lane. Both numbers derive from `damage`, so a Bannerman's
 * aura rides them and one balance change retunes both phases.
 *
 * The plan's WIND UP — skip a turn to act three times on the next — is deliberately absent. It
 * fires below a third of health, already inside the phase above, so it is a second spelling of
 * the same escalation; and it hands the player a free turn at the exact moment they are closest
 * to killing it, which is the pressure curve running backwards.
 */

/** Bodies in reach right now, weakest first, then reading order. Deterministic, no roll. */
const inJaws = (enemy: Unit, playerUnits: Unit[]): Unit[] => {
    const reach = Math.max(1, enemy.attackRange ?? 1);
    return playerUnits
        .filter(u => u.hp > 0 && manhattan(u.position, enemy.position) <= reach)
        .sort((a, b) => a.hp - b.hp
            || a.position.x - b.position.x
            || a.position.y - b.position.y);
};

const clockjaw: BossBehaviour = ({ enemy, playerUnits, damage }) => {
    const bodies = inJaws(enemy, playerUnits);
    // Nothing in reach: it marches like anything else, telegraphed the ordinary way. A boss
    // that overrides the base rules every single turn is a cutscene.
    if (bodies.length === 0) return null;

    const beats = wounded(enemy) ? 3 : 2;
    const blow = wounded(enemy) ? Math.max(1, damage - 1) : damage;

    // Every beat carries the same number here — Clockjaw's hands are identical. `strikes` is
    // per-tile anyway because the next user of it is not: a boss coming up through the floor
    // marks the hole at 0 and the ring at full, in one intent.
    const strikes: AreaHit[] = [];
    for (let i = 0; i < beats; i++) {
        strikes.push({ pos: { ...bodies[i % bodies.length].position }, damage: blow });
    }

    return {
        type: 'ATTACK',
        // The first blow, copied rather than aliased. `target` stays the single-tile answer
        // every existing reader wants — the arrow on the unit, the action panel,
        // computeBrainThreats — the same contract `spawnTiles` keeps with its first tile.
        target: { ...strikes[0].pos },
        damage: blow,
        strikes,
        description: wounded(enemy) ? 'Winding backwards!' : 'Second hand!',
    };
};

// ---------------------------------------------------------------------------------------
// II-1 · THE ARMADA — a wall has a behind, and the sky has a floor
// ---------------------------------------------------------------------------------------

/**
 * Three gas cells, and the number is a CLOCK rather than a health bar.
 *
 * It loses ONE per turn it is hit, however many times it is hit, and that ceiling is the whole
 * mechanic. Count hits instead and any multi-hit action — Peaburst's three-pea volley, both
 * of Reedwing's wing cells, once Thornquill's free row-pierce — pops all three in a single
 * action, and the two-problem fight this boss exists to teach (ground it, THEN drown it)
 * collapses back into "shoot the big thing".
 *
 * Three, not two or five. Two is a rounding error against a squad putting out five a turn; five
 * means the flying half outlasts the clock and the player never reaches the half the arena's sea
 * was drawn for. Three guarantees it survives to turn three however hard the opening goes, and
 * is on the ground by turn four however soft.
 */
const ARMADA_CELLS = 3;
/** The wreck. Slower than anything on the board, and it hits harder than it did in the air. */
const ARMADA_WRECK_DAMAGE = 4;

/**
 * How many cells it has once THIS round is accounted for.
 *
 * A high-water mark on HP, not a "was hit this turn" flag, and the difference is who has to
 * remember to reset it. A flag needs an owner at the top of every turn; miss one path and the
 * ship either never falls or falls instantly. A mark is self-correcting — hp only goes down, so
 * `hp < mark` is true on exactly the rounds something got through, including damage taken during
 * the ENEMY turn that no player-side flag would ever see: spines, a spike field, a lava tile,
 * its own escort's blast.
 *
 * Pure, and read from three places on purpose. `plan` and `move` run in PHASE 4; `onTurnEnd`
 * runs after. All three ask this one function, so the turn it falls it already plans and moves
 * like a wreck. Split those readings and the board would telegraph a bomb run from something
 * about to be a hulk — the one promise this game does not break.
 */
const armadaCellsLeft = (enemy: Unit): number => {
    const cells = enemy.buoyancy ?? ARMADA_CELLS;
    const mark = enemy.buoyancyMark ?? enemy.maxHp;
    return enemy.hp < mark ? cells - 1 : cells;
};

/** Down, or going down before this turn ends. Phase two for every reader. */
const armadaWrecked = (enemy: Unit) =>
    enemy.movementType !== 'FLYING' || armadaCellsLeft(enemy) <= 0;

/**
 * Where a landing party goes: one step from a hero TOWARD THE BRAIN IT IS GUARDING.
 *
 * Derived from `goal` — the nearest Greenspire that still holds a sprout — rather than from an
 * assumption about which end of the board the Greenspires sit on. The boards are hand-authored and
 * one of them will eventually put a Greenspire somewhere else.
 *
 * This is the lesson as a targeting rule: a line has a behind, and the answer to a flier is not
 * a thicker wall. Deepest tile first, so the tighter the formation the worse the drop.
 */
const armadaLandingSites = (alive: Unit[], goal: Position, board: TileData[]): Position[] => {
    const taken = new Set(alive.map(u => `${u.position.x},${u.position.y}`));
    const seen = new Set<string>();
    const out: Position[] = [];

    const candidates = alive.map(u => {
        const dx = goal.x - u.position.x;
        const dy = goal.y - u.position.y;
        // Longer leg wins, so the drop stays cardinal — the convention RETALIATE_PUSH uses.
        return Math.abs(dy) >= Math.abs(dx)
            ? { x: u.position.x, y: u.position.y + Math.sign(dy) }
            : { x: u.position.x + Math.sign(dx), y: u.position.y };
    }).sort((a, b) => manhattan(a, goal) - manhattan(b, goal) || a.x - b.x || a.y - b.y);

    for (const p of candidates) {
        if (p.x < 0 || p.x >= 8 || p.y < 0 || p.y >= 8) continue;
        const k = `${p.x},${p.y}`;
        if (seen.has(k) || taken.has(k)) continue;
        const tile = getTileAt(p, board);
        // Never a Greenspire — a body dropped on a doorstep is telegraphed as a sprout theft by
        // computeBrainThreats. WALL stops even a balloon.
        if (!tile || tile.isHouse || tile.terrain === 'WALL') continue;
        seen.add(k);
        out.push(p);
        if (out.length === 2) break;
    }
    return out;
};

/**
 * Where the bombs go, scored by BODIES — one point each, not Ironcart's 3-for-the-centre.
 *
 * `aimShell` is deliberately not reused, and the reason is the payload rather than the shape. A
 * shell is 3 in the middle and 1 around it, so its aim weights the middle three times. A bomb
 * rack empties evenly: every tile in the plus takes the same number, so two bodies on the wings
 * beats one dead centre. Sharing the function would have handed the bomb a centre bias its own
 * damage numbers contradict.
 *
 * The ship's own tile scores nothing — the bombs fell from there. Greenspires are excluded, or a
 * bomb run would print a sprout warning.
 */
const aimBombRun = (from: Position, range: number, targets: Unit[], board: TileData[]): Position | null => {
    let best: Position | null = null;
    let bestScore = 0;
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            const centre = { x, y };
            const dist = manhattan(from, centre);
            if (dist === 0 || dist > range) continue;
            const tile = getTileAt(centre, board);
            if (!tile || tile.isHouse) continue;
            const score = [centre, ...ring(centre)]
                .filter(p => !(p.x === from.x && p.y === from.y))
                .filter(p => targets.some(u => u.position.x === p.x && u.position.y === p.y))
                .length;
            if (score > bestScore) { bestScore = score; best = centre; }
        }
    }
    return best;
};

/**
 * The boss whose phase line is not a health bar.
 *
 * Every other boss cracks at half HP. This one changes when the PLAYER has spent three separate
 * turns landing a hit — so phase two arrives on a schedule the player sets, and the damage they
 * poured in on the way is still on the bar when it does.
 */
const armada: BossBehaviour = ({ enemy, playerUnits, board, goal, damage }) => {
    const alive = playerUnits.filter(u => u.hp > 0);
    if (alive.length === 0) return null;
    const reach = Math.max(1, enemy.attackRange ?? 1);
    // The aura as a delta: `damage` already carries ENRAGED, and the wreck's flat 4 has to
    // inherit it the same way every other bite on the board does.
    const aura = damage - enemy.damage;

    // --- PHASE TWO: THE WRECK ---
    if (armadaWrecked(enemy)) {
        const victim = alive
            .filter(u => manhattan(u.position, enemy.position) <= reach)
            .sort((a, b) => a.hp - b.hp || a.position.x - b.position.x || a.position.y - b.position.y)[0];
        if (!victim) return null;   // nothing in reach: it crawls, at one tile a turn
        return {
            type: 'ATTACK',
            target: { ...victim.position },
            damage: ARMADA_WRECK_DAMAGE + aura,
            // No blast. The racks are empty — but the real reason is arithmetic: a 4-damage plus
            // is 20 across five tiles, which no formation survives and no positioning answers.
            // One tile for 4 is a decision.
            description: 'Wreck salvo!',
        };
    }

    // --- LANDING PARTY, every other turn ---
    // Odd beat, so the FIRST thing it ever does is put two bodies behind the line — the lesson
    // stated before the player has built anything. Every other turn and not every turn: two
    // flying 4-move bodies a turn outruns any squad and the fight stops being about the ship.
    if ((enemy.bossClock ?? 0) % 2 === 1) {
        const sites = armadaLandingSites(alive, goal, board);
        if (sites.length > 0) {
            return {
                type: 'SPAWN',
                target: sites[0],
                spawnClass: UnitClass.FLOATER,
                spawnTiles: sites,
                description: 'Landing party!',
            };
        }
        // Nowhere to put them — the squad is already backed onto the Greenspires. Bomb instead
        // rather than spending the turn on nothing.
    }

    // --- BOMB RUN ---
    // `damage` for the centre AND every wing: the plus IS the stat, not a multiple of it. One
    // number retunes all five tiles, and a Bannerman's aura raises the whole pattern.
    const centre = aimBombRun(enemy.position, reach, alive, board);
    if (!centre) return null;

    return {
        type: 'ATTACK',
        target: centre,
        damage,
        // `blast`, not `strikes`, and the distinction is the point: a bomb from altitude does
        // not walk up and stand in front of a durian, so it must not eat thorns for it.
        blast: ring(centre)
            .filter(p => !(p.x === enemy.position.x && p.y === enemy.position.y))
            .filter(p => !getTileAt(p, board)?.isHouse)
            .map(p => ({ pos: { ...p }, damage })),
        description: 'Bomb run!',
    };
};

/**
 * It does not fly the turn it falls.
 *
 * Without this the last cell pops and the ship still makes a full three-tile crossing before
 * hitting the ground, which reads as the crash landing somewhere the player did not shoot it
 * down. The tile it comes down on has to be the tile it was over — that is the shot they lined up.
 */
const armadaFall: BossHooks['move'] = ({ enemy }) =>
    (enemy.movementType === 'FLYING' && armadaCellsLeft(enemy) <= 0) ? [] : null;

/**
 * The cells, spent at the end of the round.
 *
 * End of turn rather than per hit, because "one per TURN" is the rule and this is the only place
 * in the frame where a turn is over: the player's whole turn, the hazard, the burn tick, the
 * retaliation and the spikes it drifted over have all resolved by now.
 *
 * The crash is not telegraphed and does not need to be — it is not something the boss DECIDES,
 * it is the receipt for damage the player chose to deal. Same shape as the Colossus's shell
 * splitting at half health.
 */
const armadaCells: BossHooks['onTurnEnd'] = ({ enemy, board }) => {
    if (enemy.movementType !== 'FLYING') return [];      // already down, nothing left to lose
    const cells = enemy.buoyancy ?? ARMADA_CELLS;
    const mark = enemy.buoyancyMark ?? enemy.maxHp;
    if (enemy.hp >= mark) return [];                     // untouched this round: it keeps them all

    const left = cells - 1;
    const actions: TurnAction[] = [];

    if (left > 0) {
        // The mark moves to the CURRENT hp, which is what makes next round's test correct
        // whether or not anything happens in it.
        actions.push({
            type: 'UPDATE_UNIT_STATE',
            unitId: enemy.id,
            updates: { buoyancy: left, buoyancyMark: enemy.hp },
        });
        actions.push({ type: 'APPLY_DAMAGE', targetId: enemy.id, amount: 0, eventType: 'BUFF', pos: enemy.position });
        return actions;
    }

    // --- THE CRASH --- one action, six fields. DROWN has to go with PUSH, or the shove into the
    // sea would land it in the water unharmed and delete the fight's whole second half.
    actions.push({
        type: 'UPDATE_UNIT_STATE',
        unitId: enemy.id,
        updates: {
            buoyancy: 0,
            buoyancyMark: enemy.hp,
            movementType: 'WALKING',
            immunities: [],
            moveRange: 1,
            damage: ARMADA_WRECK_DAMAGE,
        },
    });
    actions.push({ type: 'APPLY_DAMAGE', targetId: enemy.id, amount: 0, eventType: 'BUFF', pos: enemy.position });

    // Came down over open water: it drowns like anything else that cannot swim. `survivesWater`
    // is the SAME predicate planPush consults, asked of the body it has just become — there is
    // one drowning rule in this codebase and this is not a second one.
    const grounded: Unit = { ...enemy, movementType: 'WALKING', immunities: [] };
    const tile = getTileAt(enemy.position, board);
    if (tile?.terrain === 'WATER' && !survivesWater(grounded)) {
        actions.push({ type: 'APPLY_DAMAGE', targetId: enemy.id, amount: 0, eventType: 'DROWN', pos: enemy.position });
        actions.push({ type: 'UNIT_DIE', unitId: enemy.id });
    }
    return actions;
};

// ---------------------------------------------------------------------------------------
// II-2 · SANDREAVER — the line stopped having a front
// ---------------------------------------------------------------------------------------

/**
 * 4 where it comes up, 5 once it is hurt. Read off their own constants rather than `damage`,
 * deliberately: `damage` is what the ordinary ladder bites for on its above-ground turn, and the
 * eruption is a different blow that happens to be thrown by the same body. A Bannerman's aura
 * rides the bite and NOT this — the escort is not helping it dig.
 */
const SANDREAVER_ERUPTION = 4;
const SANDREAVER_ERUPTION_WOUNDED = 5;

/**
 * Its clock, and the whole encounter in one line.
 *
 * ODD turns it is under the sand; EVEN turns it comes up, erupts, and STAYS up for the player's
 * whole turn. The parity is off `bossClock` for the Headliner's reason, but the SHAPE of the
 * cycle is the balance decision and it is worth stating:
 *
 * A boss that dived again in the same PHASE 4 it surfaced in would never once be on the board
 * while the player has a turn — `bossClock` is ticked before intents are planned, so the surface
 * and the next dive land in the same call. The player would be shown a health bar they can never
 * touch. Staying up for one full turn is what makes this a fight rather than a countdown: over
 * BASE_MAX_TURNS = 7 it is targetable on turns 1, 3, 5 and 7, and four windows is exactly what
 * 22 HP costs at act II output. Three windows is not a harder fight, it is an impossible one —
 * which is why the plan's "dive twice in a row" phase two is NOT what got built.
 */
const diving = (enemy: Unit) => (enemy.bossClock ?? 0) % 2 === 1;

/**
 * WHERE IT COMES UP — the assumption being broken, written as a scoring function.
 *
 * Seven acts have taught the player to build a LINE. This scores every legal tile by how many
 * heroes stand on its four neighbours, so the best hole on the board is the middle of that
 * formation. The line does not get flanked, it gets opened from inside, and the counterplay is
 * to stop standing in a shape that has an inside.
 *
 * `canStopOn` does the MOUNTAIN rule for free — rock is the only safe ground, there are four of
 * them and three heroes, and that subtraction needed no new terrain code.
 *
 * NEVER A HOUSE, and this one is not cosmetic: the eruption aims at the tile the boss is standing
 * on, and PHASE 3 reads an attack on your own tile that is a sprout-holding Greenspire as a theft.
 * Surface on a doorstep and it would rob the Greenspire instead of erupting.
 */
const pickHole = (
    from: Position,
    range: number,
    targets: Unit[],
    board: TileData[],
    occupied: Unit[],
    terrainDefs: Record<string, TerrainDefinition>,
): Position | null => {
    const alive = targets.filter(u => u.hp > 0);
    let best: Position | null = null;
    let bestScore = -1;
    let bestGap = Infinity;

    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            const p = { x, y };
            if (manhattan(from, p) > range) continue;
            const tile = getTileAt(p, board);
            if (!tile || tile.isHouse) continue;
            if (!canStopOn({ movementType: 'TELEPORT' } as Unit, tile, terrainDefs)) continue;
            /**
             * IT WILL NOT COME UP INSIDE DUST — and this is the one line that makes Reedwing,
             * the reward of the act before this one, the answer to this one.
             *
             * The rest of the counterplay against a burrower is reactive: the hole is
             * published a full player turn early, so a pod dropped ON it cancels the eruption
             * (turnManager's `blinded`, which reads the same `TileData.smoke`). This is the
             * PREVENTIVE half — dust laid before the dive is ground the sand refuses, so the
             * hole gets pushed out of the middle of the formation and the squad chooses where
             * this fight happens instead of it.
             *
             * No stall is possible: with nowhere legal left, `pickHole` returns null and
             * `sandreaverMove` leaves it where it stands to erupt from there (and if THAT tile
             * is dusted, `blinded` cancels the swing and it surfaces into the open anyway).
             * The pod is two tiles for two turns against a hole chosen from a move-4 diamond,
             * so denying ground is a scalpel here, never a blanket.
             */
            if (tile.smoke && tile.smoke.turns > 0) continue;
            if (occupied.some(u => u.hp > 0 && u.position.x === x && u.position.y === y)) continue;

            const caught = ring(p).filter(r =>
                alive.some(u => u.position.x === r.x && u.position.y === r.y)).length;
            const gap = alive.length > 0 ? Math.min(...alive.map(u => manhattan(p, u.position))) : 0;
            // Bodies in the ring first; ties to the hole nearest the squad, so with nothing
            // catchable it still moves TOWARD the fight rather than sulking in a corner.
            if (caught > bestScore || (caught === bestScore && gap < bestGap)) {
                bestScore = caught; bestGap = gap; best = p;
            }
        }
    }
    return best;
};

/**
 * THE ERUPTION — four full swings, and the reason `strikes` had to exist beside `blast`.
 *
 * `blast` is right there and it is the WRONG field: a blast is ground being hurt, so it provokes
 * nothing. This is a body coming up out of the sand and hitting four people, and Thornshell — the
 * hero THIS act pays out — answers something that comes and stands in front of him. Routed
 * through `blast` the boss would walk through a wall of spines untouched, and the reward for
 * beating it would be useless against it.
 *
 * The CENTRE rides `target` at 0 damage and is not in `strikes`. Three things fall out with no
 * new overlay: the hole is lit (ATTACK targets are always threatened), it prints 0 (which Tile
 * renders as no badge — a marked square with no number, which is exactly what a hole is), and
 * PHASE 3 finds the boss itself standing there, deals it 0, and animates the swing from its own
 * square. That last is not a workaround; a swing thrown from the tile it is climbing out of is
 * the right picture.
 */
const eruption = (at: Position, damage: number, board: TileData[]): Intent => ({
    type: 'ATTACK',
    target: { ...at },
    damage: 0,
    strikes: ring(at)
        .filter(p => !getTileAt(p, board)?.isHouse)
        .map(p => ({ pos: p, damage })),
    // One tile out, not two: the ring already deals 4, and the shove is here to break the
    // formation rather than to add a second death to it. It is also the one mercy in the move —
    // a hero thrown clear of the ring is a hero who survives the NEXT one.
    pushOnHit: 1,
    description: 'Surfacing!',
});

const sandreaver: BossBehaviour = ({ enemy, playerUnits, board, blocker, damage, terrainDefs }) => {
    const hurt = wounded(enemy);
    const hit = hurt ? SANDREAVER_ERUPTION_WOUNDED : SANDREAVER_ERUPTION;

    // THE DIVE TURN. `move` has already run, so `enemy.position` IS the hole: the eruption is
    // aimed at the ground under its own feet and the ring around it, one full player turn early.
    if (diving(enemy)) return eruption(enemy.position, hit, board);

    /**
     * PHASE TWO — "it stops coming up for air", read as EARLIER WARNING rather than LONGER
     * BURIAL, and that difference is the difference between a hard fight and an unwinnable one.
     *
     * The plan asked for two consecutive dives. Counted against BASE_MAX_TURNS = 7 that takes
     * the player from four targetable turns to three, and three turns of act II output is 21
     * against a 22 HP bar: the boss becomes unkillable at the exact moment it is supposed to be
     * dying. So the extra warning is bought where the clock does not pay for it — the hole is
     * chosen and published HERE, while it is still standing in the open, so the ring is lit for
     * two player turns instead of one.
     *
     * The price is this turn's Drag Under. That IS the phase change, and it is visible: it stops
     * grabbing people and starts winding up.
     */
    if (hurt) {
        const hole = pickHole(enemy.position, Math.max(1, enemy.moveRange), playerUnits, board, playerUnits, terrainDefs);
        if (hole) return eruption(hole, hit, board);
    }

    /**
     * DRAG UNDER — the Yeti's grip with the opposite payoff.
     *
     * Same shape on purpose: 0 damage, one STUN, telegraphed a turn out. What differs is what it
     * sets up. The bear's grip buys a KILL and the arithmetic is exact. This buys a POSITION —
     * the stun lands at the end of this turn and PLAYER STATUS EXPIRY spends it at the top of the
     * next, so the victim loses precisely the buried turn, the one they needed to walk out of the
     * ring. It does not kill anybody. It removes the answer.
     *
     * The HIGHEST HP body in reach, not the lowest, and that inversion is the point: the standard
     * ladder picks the weakest because it wants a kill, this wants the tank, because the tank is
     * the one body that could have stood in the hole and denied it.
     */
    const reach = Math.max(1, enemy.attackRange ?? 1);
    const held = playerUnits
        .filter(p => p.hp > 0 && manhattan(p.position, enemy.position) <= reach)
        .sort((a, b) => b.hp - a.hp || a.position.x - b.position.x || a.position.y - b.position.y)[0];

    if (held) {
        return {
            type: 'ATTACK',
            target: { ...held.position },
            // Zero, for the Yeti's reason: a hero who also took 4 walking past would be dead to
            // the eruption whatever the squad did, and a two-turn decision would collapse back
            // into a one-turn ambush.
            damage: 0,
            statusOnHit: ['STUN'],
            description: 'Dragged under!',
        };
    }

    if (blocker) return { type: 'ATTACK', target: { ...blocker.position }, damage };
    return null;
};

/**
 * THE SWIM — one tile of path, and that single element IS the "through everything" rule.
 *
 * turnManager re-walks a boss path against live occupancy and cuts it at the first blocked tile,
 * which is the counterplay that makes Ironcart's retreat blockable. A burrower must not be
 * blockable that way — going UNDER the line is the entire unit — so the path handed back is the
 * destination and nothing else. There are no intervening tiles to truncate at, which is a more
 * honest spelling of "it tunnels" than any flag would be.
 *
 * Returns null when PROVOKED, and that is not an oversight, it is the fight: with no opinion here
 * the standard taunt walk takes over and drags it at Thornshell, and `planEnemyIntent`'s taunt
 * branch — which runs AHEAD of every boss behaviour — makes it bite him instead of erupting where
 * it chose. Provoke is the only tool in the game that does not care where this thing is, and this
 * null is where that becomes true in code.
 */
const sandreaverMove: BossHooks['move'] = ({ enemy, playerUnits, board, range }) => {
    if (enemy.statusEffects.includes('PROVOKED')) return null;
    if (!diving(enemy)) return null;   // its above-ground turn: march like anything else
    if (enemy.burrowTarget) return [enemy.burrowTarget];   // a hole already promised, and kept

    const hole = pickHole(enemy.position, range, playerUnits, board, playerUnits, DEFAULT_TERRAIN_DEFS);
    // Nowhere legal in reach — every tile is rock, Greenspire or occupied. It stays and erupts from
    // where it is, which is a worse hole and entirely the player's doing.
    return hole ? [hole] : [];
};

/**
 * THE BANNERMAN ITSELF — written here and nowhere else, because a state machine spread across three
 * hooks that each guess at it is a state machine with three answers.
 *
 * TWO GUARDS, both of which are bugs when missing:
 *  - A boss that did not ACT does not change state. PHASE 4 returns early for anything stunned,
 *    but this hook runs regardless — the end-of-turn loop only asks for a live `bossId`. Without
 *    the guard a stunned Sandreaver buries itself on a turn it never took, while its telegraph
 *    still reads "Stunned!".
 *  - ...and it does not hold its breath through one either. Frozen underground it comes UP.
 *    Without this line, freezing it while buried is the worst play available: the player pays for
 *    a control tool and is rewarded with an extra turn of an invisible boss. With it, the stun
 *    cancels an eruption AND opens a window — which is what a control tool is supposed to buy.
 */
const sandreaverTurnEnd: BossHooks['onTurnEnd'] = ({ enemy }) => {
    if (enemy.statusEffects.includes('STUN') || enemy.statusEffects.includes('FREEZE')) {
        if (!enemy.isBurrowed) return [];
        return [
            { type: 'UPDATE_UNIT_STATE', unitId: enemy.id, updates: { isBurrowed: false, burrowTarget: undefined } },
            { type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'EMERGE', pos: enemy.position },
        ];
    }

    const dive = diving(enemy);
    // The promise, kept or spent. A hole published on the above-ground turn (phase two) is stored
    // so next turn's `move` goes exactly there; a hole already dived into is cleared.
    const promise = !dive && wounded(enemy) && enemy.intent?.description === 'Surfacing!'
        ? enemy.intent.target
        : undefined;

    return [{
        type: 'UPDATE_UNIT_STATE',
        unitId: enemy.id,
        updates: { isBurrowed: dive, burrowTarget: promise },
    }];
};

// ---------------------------------------------------------------------------------------
// FINAL · BLIGHTLORD — three bosses sharing one body
// ---------------------------------------------------------------------------------------

/** The nine acts, in campaign order. Phase one walks back through them one per turn. */
const FALLEN: UnitClass[] = [
    UnitClass.GRAVEHULK, UnitClass.IRONCART, UnitClass.CINDER_COLOSSUS,
    UnitClass.ARMADA, UnitClass.SANDREAVER, UnitClass.YETI,
    UnitClass.HEADLINER, UnitClass.CLOCKJAW, UnitClass.VOLTMAW,
];

/** 36 HP in three equal bands. Read off live hp, so it is always the truth. */
const blightPhase = (enemy: Unit): 1 | 2 | 3 => {
    const band = Math.ceil(enemy.maxHp / 3);
    if (enemy.hp > band * 2) return 1;
    if (enemy.hp > band) return 2;
    return 3;
};

/** Damage that has to land in ONE turn to stop phase three undoing it. */
const REWIND_THRESHOLD = 6;

/**
 * THE LAST FIGHT, and it is three of them.
 *
 * The whole campaign teaches one habit at a time and this boss charges rent on all of them at
 * once — but never on two at once, which is the part that makes it playable. Each 12-HP band
 * changes exactly one rule, and between bands the body is untouchable for a turn so the change
 * is something the player is SHOWN rather than something they discover by dying to it.
 *
 *   1 · THEY ARE STILL HERE  a boss you already beat comes back each turn, at 4 HP.
 *   2 · WHAT IS YOURS IS MINE  it cuts one hero's element per turn, for the rest of the fight.
 *   3 · I WALK IT BACK  every turn it undoes, unless the squad lands 6 in one turn.
 *
 * Phase three is the thesis of the game stated backwards. Nine acts teach you to spread damage
 * so nothing is wasted; the last one asks you to pile it into a single turn, and refuses to
 * die to anything less. There is exactly one answer and it is a squad acting together.
 */
const blightlord: BossBehaviour = ({ enemy, playerUnits, board, blocker }) => {
    /**
     * No `invulnerable` branch here, deliberately, and the reason is a timing one worth
     * writing down: `plan` chooses the intent for NEXT turn, so a check here would announce
     * the reforming turn one turn late — the body would be untouchable on the turn it was
     * still swinging, and idle on the turn it could already be hit.
     *
     * The crossing is caught in `blightlordTurnEnd` instead, which emits the UPDATE_INTENT
     * itself and therefore lands both halves — untouchable AND idle — on the same turn.
     */
    const phase = blightPhase(enemy);

    if (phase === 1) {
        // One echo a turn, walked back through the campaign in order. The summon is the class
        // and nothing else: no bossId, so no BOSS_HOOKS entry fires for it and it does not get
        // that boss's sprout — it gets its BODY. An Ironcart echo still rides rail and lobs from
        // four, an Armada echo still flies over the wall. That is the honest engine reading of
        // "carrying exactly one of its skills", and it is also the only one that cannot
        // accidentally spawn a second final boss.
        /**
         * THEY COME BACK BESIDE YOU, NOT BESIDE IT.
         *
         * The first version landed the echo next to the BOSS, and that made phase one a pure
         * damage race with no position in it at all: the only way to deny a landing was to
         * stand a body on the tile, the squad is three heroes against four neighbours, and the
         * boss walks two — so it simply strolls away and has four fresh tiles. A "counterplay"
         * whose target can relocate is not one, and a squad built around a shooter and a
         * support should never be told that walking into a 4-damage melee range is the answer.
         *
         * Landing beside a HERO asks a question that roster can actually answer, with the tools
         * it already has: how many open tiles are there around me? Backs to the wall, tucked
         * behind the pit's two pillars, standing close enough to block each other's ring — all
         * of it is formation, none of it is contact. And it is the same sentence the campaign
         * has been teaching since Sandreaver: the thing you already beat comes back BEHIND the
         * line, not in front of it.
         *
         * The victim is the hero with the MOST room around them, which is the whole rule stated
         * once: being alone in the open is what gets punished. A tie goes to the one nearest
         * the boss, so it stays deterministic — the telegraph has to be trustworthy, and
         * `scriptedReplay` has to land on the same board twice.
         */
        const heroes = playerUnits.filter(u => u.hp > 0);
        let victim: Unit | null = null;
        let victimSites: Position[] = [];
        heroes.forEach(h => {
            const open = openNeighbours(h.position, board, playerUnits);
            if (open.length === 0) return;
            if (!victim
                || open.length > victimSites.length
                || (open.length === victimSites.length
                    && manhattan(h.position, enemy.position) < manhattan(victim.position, enemy.position))) {
                victim = h;
                victimSites = open;
            }
        });

        // Rotated by the boss's own clock rather than always `[0]`. `openNeighbours` is only
        // told about the PLAYER's units (that is all a BossContext carries), so it cannot see
        // the echo it dropped last turn — and PHASE 3 refuses an occupied tile in silence.
        // Always taking the first free-looking tile therefore produced one echo for the whole
        // phase and then aimed at its head forever.
        const site = victimSites.length
            ? victimSites[(enemy.bossClock ?? 0) % victimSites.length]
            : undefined;
        if (site) {
            const cls = FALLEN[(enemy.bossClock ?? 0) % FALLEN.length];
            return {
                type: 'SPAWN',
                target: site,
                spawnClass: cls,
                spawnTiles: [site],
                spawnHp: 4,
                description: 'They are still here!',
            };
        }
        // Every hero is boxed in — no ring left to come back into. The phase produces nothing
        // this turn and the boss walks and bites like anything else.
        //
        // That is not a failure case, it is the payoff: a squad that has read the pit and put
        // its backs against the wall has switched the phase off, and it did it with positioning
        // rather than with damage. Falling through to the ordinary ladder rather than skipping
        // the turn is what keeps that from being free.
        return null;
    }

    if (phase === 2) {
        /**
         * The theft rides `statusOnHit`, which means it is an ATTACK like any other: it has to
         * REACH the hero, it is telegraphed a full turn ahead on that hero's tile, and STATUS
         * immunity refuses it. None of that needed a new mechanism — the field was already
         * there for the Yeti's grip.
         *
         * 0 damage on purpose. Losing an element for the rest of the fight is the price; adding
         * 4 damage on top would make the correct play "stand out of range", and standing out of
         * range is not an interesting answer to a thief.
         *
         * It goes for whoever still HAS something to take, nearest first. A squad that has
         * already been stripped stops being a target for this and the boss falls back to the
         * ordinary ladder — it does not stand there miming at people with nothing left.
         */
        const carriers = playerUnits.filter(u =>
            u.hp > 0 && !!u.element && !u.statusEffects.includes('SEVERED'));
        const victim = nearest(enemy.position, carriers);
        if (victim && manhattan(victim.position, enemy.position) <= Math.max(1, enemy.attackRange ?? 1)) {
            return {
                type: 'ATTACK',
                target: { ...victim.position },
                damage: 0,
                statusOnHit: ['SEVERED'],
                description: 'What is yours is mine!',
            };
        }
        return null;
    }

    // Phase 3 walks and bites like anything else. The rewind is not an action it takes — it is
    // what happens to it at the end of the turn — so there is nothing to plan here, and the
    // telegraph the player needs is the one already on the board: their own damage undone.
    if (blocker) {
        return {
            type: 'ATTACK', target: blocker.position, damage: enemy.damage,
            description: 'Walking it back!',
        };
    }
    return null;
};

/**
 * The two things that are states rather than actions: the untouchable turn between bands, and
 * phase three's rewind.
 *
 * Both live here for the same reason the Colossus's lava does — they are consequences of a turn
 * having happened, not decisions. Written as intents they would have had to be announced, and
 * "I am about to become untouchable" is not a threat the player can answer.
 */
const blightlordTurnEnd: BossHooks['onTurnEnd'] = ({ enemy }) => {
    const actions: TurnAction[] = [];
    const phase = blightPhase(enemy);

    // --- the untouchable turn, spent ---------------------------------------
    if (enemy.invulnerable) {
        const left = (enemy.phaseGuard ?? 1) - 1;
        if (left <= 0) {
            actions.push({
                type: 'UPDATE_UNIT_STATE', unitId: enemy.id,
                updates: { invulnerable: false, phaseGuard: 0, bossPhase: phase,
                           rewindMark: { hp: enemy.hp, position: { ...enemy.position } } },
            });
        } else {
            actions.push({ type: 'UPDATE_UNIT_STATE', unitId: enemy.id, updates: { phaseGuard: left } });
        }
        return actions;
    }

    // --- crossing a band ----------------------------------------------------
    // `bossPhase` is seeded on the first end-of-turn rather than at spawn, so the opening band
    // never counts as a crossing and the fight does not begin with a free untouchable turn.
    const known = enemy.bossPhase;
    if (known === undefined) {
        actions.push({
            type: 'UPDATE_UNIT_STATE', unitId: enemy.id,
            updates: { bossPhase: phase, rewindMark: { hp: enemy.hp, position: { ...enemy.position } } },
        });
        return actions;
    }
    if (phase !== known) {
        actions.push({
            type: 'UPDATE_UNIT_STATE', unitId: enemy.id,
            updates: { invulnerable: true, phaseGuard: 1, bossPhase: phase },
        });
        // Overwrites whatever PHASE 4 just planned, moments ago in this same call. That is the
        // point: the intent already on the board is the one the untouchable turn would have
        // spent swinging, and a boss nothing can hurt should not also be allowed to hit back.
        actions.push({
            type: 'UPDATE_INTENT', unitId: enemy.id,
            intent: { type: 'WAIT', description: 'Reforming...' },
        });
        // Announced through the damage channel so the board actually says something happened;
        // BUFF is the same event the Armada uses when it sheds a cell.
        actions.push({ type: 'APPLY_DAMAGE', targetId: enemy.id, amount: 0, eventType: 'BUFF', pos: { ...enemy.position } });
        return actions;
    }

    // --- I WALK IT BACK -----------------------------------------------------
    if (phase === 3) {
        const mark = enemy.rewindMark;
        if (mark) {
            const taken = mark.hp - enemy.hp;
            if (taken > 0 && taken < REWIND_THRESHOLD) {
                // Undone: hp AND position, because undoing only the damage would leave a boss
                // that walks forward for free every turn while nothing sticks to it.
                actions.push({
                    type: 'UPDATE_UNIT_STATE', unitId: enemy.id,
                    updates: { hp: mark.hp, position: { ...mark.position },
                               rewindMark: { hp: mark.hp, position: { ...mark.position } } },
                });
                actions.push({ type: 'APPLY_DAMAGE', targetId: enemy.id, amount: 0, eventType: 'HEAL', pos: { ...mark.position } });
                return actions;
            }
        }
        // Either it was hit hard enough or it was not hit at all — the anchor moves up to now,
        // and the damage stands.
        actions.push({
            type: 'UPDATE_UNIT_STATE', unitId: enemy.id,
            updates: { rewindMark: { hp: enemy.hp, position: { ...enemy.position } } },
        });
    }
    return actions;
};

export const BOSS_HOOKS: Partial<Record<BossId, BossHooks>> = {
    GRAVEHULK: { plan: gargantuar },
    HEADLINER: { plan: headliner },
    CINDER_COLOSSUS: { onMoved: cinderTrail, onTurnEnd: cinderTurnEnd },
    VOLTMAW: { plan: voltmaw },
    YETI: { plan: yeti, move: yetiHold, onTurnEnd: yetiChill },
    IRONCART: { plan: ironcart, move: ironcartMove },
    // One hook only. It walks like anything else, and phase two announces itself through
    // the telegraph — the turn it drops to 11 the board prints a third red tile.
    CLOCKJAW: { plan: clockjaw },
    ARMADA: { plan: armada, move: armadaFall, onTurnEnd: armadaCells },
    SANDREAVER: { plan: sandreaver, move: sandreaverMove, onTurnEnd: sandreaverTurnEnd },
    // Two hooks, three bosses. Everything phase-specific is read off live hp inside them
    // rather than stored, so a rewind that puts 5 HP back also puts the previous phase's
    // RULES back — which is the correct reading and would have been a bug to write twice.
    BLIGHTLORD: { plan: blightlord, onTurnEnd: blightlordTurnEnd },
};

export const hooksFor = (boss: BossId | undefined): BossHooks | undefined =>
    boss ? BOSS_HOOKS[boss] : undefined;

export const behaviourFor = (boss: BossId | undefined): BossBehaviour | undefined =>
    hooksFor(boss)?.plan;
