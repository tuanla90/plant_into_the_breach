
import { Unit, Position, Skill, TileData, TerrainDefinition, UnitType, UnitClass, EffectType } from '../types';
import { getFusionEffectValue, hasFusionEffect } from './fusion';

// Helper to get unit at position
export const getUnitAt = (pos: Position, units: Unit[]) => units.find(u => u.position.x === pos.x && u.position.y === pos.y);

/**
 * The unit on this tile that the rest of the game is allowed to see.
 *
 * `getUnitAt` answers "what is here". This answers "what is here that can be shot at, walked
 * into, blown up or shoved", and the two stopped being the same question the moment something
 * learned to travel under the board. Seven call sites ask it — the four targeting doors, the
 * pathfinder, the push planner and the click handler — because untargetable and non-solid have
 * to travel together. A body the player cannot shoot but still cannot walk round is an
 * invisible wall: worse than the thing this hides, because it also keeps moving.
 */
export const getSolidUnitAt = (pos: Position, units: Unit[]): Unit | undefined => {
    const u = getUnitAt(pos, units);
    return u && !u.isBurrowed ? u : undefined;
};

// Helper to get tile at position
export const getTileAt = (pos: Position, board: TileData[]) => board.find(t => t.x === pos.x && t.y === pos.y);

// Helper to format coordinates consistently (0,0 -> A1)
export const formatGridPosition = (x: number | undefined, y: number | undefined): string => {
    if (x === undefined || y === undefined) return '??';
    return `${String.fromCharCode(65 + x)}${y + 1}`;
};

/**
 * Which way a Blover gust blows: toward whichever board edge the targeted tile sits closest
 * to. One function so the hover arrow and the actual shove can never disagree — the same
 * discipline the event rolls use.
 *
 * Ties break right, then left, then down, then up: +y is toward the spawn edge, which is the
 * direction the player wants nine times out of ten.
 */
export const gustDirection = (tile: Position): { dx: number; dy: number } => {
    const toUp = tile.x, toDown = 7 - tile.x, toLeft = tile.y, toRight = 7 - tile.y;
    const nearest = Math.min(toUp, toDown, toLeft, toRight);
    if (nearest === toRight) return { dx: 0, dy: 1 };
    if (nearest === toLeft) return { dx: 0, dy: -1 };
    if (nearest === toDown) return { dx: 1, dy: 0 };
    return { dx: -1, dy: 0 };
};

/**
 * PUSH RESOLUTION — one planner, used by every shove in the game.
 *
 * Two rules live here that the three separate copies of this logic never had:
 *
 *  1. DROWNING. Open water was treated as a wall: a shove into it dealt 1 collision damage
 *     and the unit stayed dry. `DROWN` existed as a UnitImmunity and was assigned to three
 *     units, but nothing in the codebase ever read it. Water now kills whatever cannot
 *     survive it, which is the whole reason a hand-authored map puts a lake beside a lane.
 *
 *  2. BODIES BLOCK. A shove into an occupied tile moves NOTHING: the two that collided each
 *     take a point and the shove is spent. This planner used to chain instead, driving the
 *     whole line along like dominoes. It was a deliberate deviation and it was wrong — it
 *     meant shoving a zombie into your own plant pushed the PLANT back, so the tool you use
 *     to hold a corridor gave up a tile of that corridor, and the enemy could walk a hero
 *     backwards into water by standing in front of them.
 *
 * Pure: it decides, it does not mutate. Each caller turns the plan into its own actions.
 */
export interface PushPlan {
    /** Ordered far-end first, so applying them in sequence never double-occupies a tile. */
    moves: Array<{ unitId: string; to: Position }>;
    /** Units that end up in water they cannot survive. They die. */
    drowned: string[];
    /**
     * Bosses shoved into water that would have drowned anything else. They live — see
     * `survivesWater` — but the shove costs them the action they had already telegraphed.
     *
     * A separate list from `drowned` rather than a flag on it, because the two produce
     * completely different actions and sharing a list is how a caller ends up killing one.
     */
    doused: string[];
    /** Units that slammed into something. One point each, per the collision rule. */
    collided: string[];
    /**
     * Enemies shoved into a house that still held a brain. They take it and leave, exactly as
     * if they had walked in — so a careless shove toward your own side feeds them. This is
     * what stops PUSH from being a free "get it away from me" button.
     */
    tookBrain: Array<{ unitId: string; house: Position }>;
    /**
     * Houses whose SHELL LAYER (TileData.shielded — Gourdward's Reinforce) ate a shove this
     * plan aimed at their doorway. The layer breaks, the brain stays, the shover is billed a
     * collision like any wall. The caller owns the MODIFY_TERRAIN that clears the flag.
     */
    wardedHouses: Position[];
}

/**
 * Water only kills what cannot swim, fly, or is not alive to begin with.
 *
 * Exported because a body can now STOP being able to survive water mid-battle (The Armada's
 * crash, utils/bossBehaviours.ts). A second copy of this test living in a boss file is exactly
 * how `DROWN` once spent months declared, assigned and never read.
 */
/** Can this body be in water at all — by swimming, flying, or not being alive? */
export const swims = (unit: Unit): boolean =>
    unit.immunities.includes('DROWN')
    || unit.movementType === 'FLYING'
    || unit.movementType === 'AMPHIBIOUS'
    || unit.type === UnitType.OBSTACLE;

export const survivesWater = (unit: Unit): boolean =>
    swims(unit)
    /**
     * A BOSS NEVER DROWNS, and this is the same rule Devour already follows.
     *
     * Drowning is an instant kill, and this codebase has one standing answer for those: check
     * `bossId`, never `isMassive` (utils/skillResolution.ts caps burrow_strike the same way).
     * Without it, thinning boss PUSH immunity down to one boss would have handed the player a
     * one-action delete on any watery arena — Windward Sound has sea down both flanks.
     *
     * It survives; it does NOT get away with it. A boss that cannot swim and lands in the water
     * anyway comes out of the plan as `doused`, and loses the turn it had already telegraphed.
     */
    || !!unit.bossId;

/**
 * ONE TILE of a shove. `planPush` below is just this, run again for each tile of distance.
 *
 * `bumped` is passed in rather than owned here because it has to survive across tiles: a body
 * slammed on the first tile and again on the second still bleeds exactly once — which is what
 * a two-tile shove into a wall must cost, one point and not two.
 */
interface PushStep {
    moves: Array<{ unitId: string; to: Position }>;
    drowned: string[];
    /** Bosses that landed in water and survived it. See PushPlan.doused. */
    doused: string[];
    tookBrain: Array<{ unitId: string; house: Position }>;
    wardedHouses: Position[];
    /**
     * Did anything actually move? False means the shove met something it cannot shift, and
     * every remaining tile of distance would meet the same thing — the caller stops.
     */
    advanced: boolean;
}

const planPushStep = (
    mover: Unit,
    dx: number,
    dy: number,
    alive: Unit[],
    board: TileData[],
    terrainDefs: Record<string, TerrainDefinition>,
    maxChain: number,
    brainlessHouses: Set<string>,
    bumped: Set<string>,
): PushStep => {
    const step: PushStep = { moves: [], drowned: [], doused: [], tookBrain: [], wardedHouses: [], advanced: false };
    // Solid, not merely present: without this a burrowed body JAMS an entire shove chain, and
    // the player watches a gust die against an apparently empty square of sand.
    const occupantAt = (p: Position) => alive.find(u => !u.isBurrowed && u.position.x === p.x && u.position.y === p.y);

    const dest = { x: mover.position.x + dx, y: mover.position.y + dy };

    // A BODY IS A WALL. Into the Breach's rule, and it was the one thing this planner had
    // wrong: it treated a blocker as a domino, shoving the whole line along and billing every
    // body a collision point. That reads fine in isolation and is a different game — shoving
    // a zombie into your own plant moved the PLANT, so the shove you used to hold a corridor
    // quietly gave up a tile of it, and a hero could be walked backwards into water by the
    // enemy standing in front of them.
    //
    // Now: nothing moves, the two that collided each take a point, and the shove is spent.
    // `maxChain` survives in the signature because every caller passes it, but there is no
    // chain left to bound.
    const blocker = occupantAt(dest);
    if (blocker) {
        bumped.add(mover.id);
        bumped.add(blocker.id);
        return step;
    }

    const inBounds = dest.x >= 0 && dest.x < 8 && dest.y >= 0 && dest.y < 8;
    const destTile = inBounds ? getTileAt(dest, board) : undefined;

    // A house with a brain still in it is not a wall to a zombie — it is the thing it wants.
    // Shoving one in hands over the brain, which makes pushing toward your own side a real
    // mistake rather than a free repositioning tool.
    const houseWithBrain = !!destTile
        && !!destTile.isHouse
        && !!destTile.hasBrain
        && !brainlessHouses.has(`${dest.x},${dest.y}`)
        && mover.isEnemy;

    if (!inBounds || !destTile || destTile.terrain === 'WALL' || (destTile.isHouse && !houseWithBrain)) {
        // Board edge, barrier, or a house with nothing left to steal — a genuine wall. Only
        // one body is involved now, so only one takes the hit.
        bumped.add(mover.id);
        return step;
    }

    if (houseWithBrain) {
        /**
         * A SHIELDED house (Gourdward's Reinforce, TileData.shielded) answers the shove the
         * way a wall does — the zombie slams into the shell instead of the doorway, the
         * layer breaks, the brain stays. The careless-push tax survives in a smaller coin:
         * the collision point still lands, the layer the player spent an action raising is
         * gone, but the brain is not.
         */
        if (destTile.shielded) {
            step.wardedHouses.push({ ...dest });
            bumped.add(mover.id);
            return step;
        }
        step.tookBrain.push({ unitId: mover.id, house: { ...dest } });
        step.moves.push({ unitId: mover.id, to: { ...dest } });
        step.advanced = true;
        return step;
    }

    const walkable = terrainDefs[destTile.terrain]?.isWalkable;
    const isWater = destTile.terrain === 'WATER';

    if (!walkable && !isWater) {
        // Mountain and friends: solid to a shove.
        bumped.add(mover.id);
        return step;
    }

    if (!walkable && isWater && !survivesWater(mover)) {
        step.drowned.push(mover.id);
    } else if (!walkable && isWater && !swims(mover)) {
        // Only a boss reaches here: it cannot swim, and the only thing keeping it alive is the
        // guard in `survivesWater`. Standing in the sea costs it its telegraphed turn.
        step.doused.push(mover.id);
    }

    step.moves.push({ unitId: mover.id, to: { ...dest } });
    step.advanced = true;
    return step;
};

export const planPush = (
    mover: Unit,
    dx: number,
    dy: number,
    units: Unit[],
    board: TileData[],
    terrainDefs: Record<string, TerrainDefinition>,
    /** How many bodies a single shove can drive. Bounded so a packed lane cannot loop. */
    maxChain: number = 3,
    /**
     * Houses whose brain has already been taken earlier in the same turn, keyed "x,y". The
     * board itself is only updated by the reducer, so a caller resolving several shoves in one
     * pass has to tell us, or two zombies could claim the same brain.
     */
    brainlessHouses: Set<string> = new Set(),
    /**
     * How many TILES the shove drives the mover. Chardwall throws 2, and PUSH_DISTANCE buys
     * more on top; everything else still shoves the 1 tile this defaults to.
     *
     * Resolved one tile at a time on purpose. A long shove is NOT a teleport: each tile is its
     * own chance to jam on a body, hit the map edge, drop into water, or hand a live house its
     * brain, so a 2-tile throw that meets a mountain on the first tile stops there and still
     * pays the collision. Sliding the target `distance` tiles in one calculation would let it
     * skip over exactly the obstacles this hero exists to slam things into.
     */
    distance: number = 1,
): PushPlan => {
    const plan: PushPlan = { moves: [], drowned: [], doused: [], collided: [], tookBrain: [], wardedHouses: [] };
    // PUSH immunity as a STATE rather than a stat. Sandreaver is not push-immune — it is
    // push-immune while it is under the board, and an entry in `immunities` could never be
    // turned back off when it surfaces.
    if (mover.immunities.includes('PUSH') || mover.isBurrowed) return plan;

    // Collision damage collects in a set that outlives the individual tiles: a middle unit in
    // a three-body train is bumped from both sides — and now, over a long shove, possibly on
    // several tiles — but still bleeds exactly once.
    const bumped = new Set<string>();

    // Private copies. Each tile has to see where the previous one left everybody, and the
    // caller's array must come back untouched.
    const working = new Map<string, Unit>(
        units.filter(u => u.hp > 0).map(u => [u.id, { ...u, position: { ...u.position } }]),
    );
    if (!working.has(mover.id)) {
        working.set(mover.id, { ...mover, position: { ...mover.position } });
    }
    const claimedHouses = new Set(brainlessHouses);

    const tiles = Math.max(1, Math.floor(distance));
    for (let i = 0; i < tiles; i++) {
        const current = working.get(mover.id);
        // The mover drowned, or walked off with a brain. There is nothing left to shove.
        if (!current) break;

        const step = planPushStep(
            current, dx, dy, [...working.values()], board, terrainDefs, maxChain, claimedHouses, bumped,
        );
        plan.moves.push(...step.moves);
        plan.drowned.push(...step.drowned);
        // A doused boss is NOT removed from `working`: it is still standing there, still
        // blocking the tiles behind it, and still shovable next turn. Only its plan is gone.
        //
        // Deduped, because a two-tile shove that lands in water twice is still ONE dunking —
        // undeduped it emitted the splash and the cancelled intent once per tile travelled.
        step.doused.forEach(id => { if (!plan.doused.includes(id)) plan.doused.push(id); });
        plan.tookBrain.push(...step.tookBrain);
        step.wardedHouses.forEach(p => {
            if (!plan.wardedHouses.some(q => q.x === p.x && q.y === p.y)) plan.wardedHouses.push(p);
        });

        // Jammed. Whatever stopped this tile stops every tile after it too.
        if (!step.advanced) break;

        step.moves.forEach(m => {
            const u = working.get(m.unitId);
            if (u) u.position = { ...m.to };
        });
        // A body that drowned or took a brain is off the board: it must stop blocking the
        // tiles still to come, and must never be moved a second time.
        step.drowned.forEach(id => working.delete(id));
        step.tookBrain.forEach(({ unitId, house }) => {
            working.delete(unitId);
            claimedHouses.add(`${house.x},${house.y}`);
        });
    }

    plan.collided = [...bumped];
    return plan;
};

// --- DAMAGE CALCULATION CORE ---
export interface DamageResult {
    finalDamage: number;
    shieldDamage: number;
    remainingShield: number;
    remainingHp: number;
    isFatal: boolean;
    /** A weapon hit that helmet armour zeroed out — the caller should SHOW the clang. */
    absorbedByArmor?: boolean;
    /**
     * This instance spent the target's BLEEDING wound (+1 already folded into finalDamage).
     * The target object's statusEffects have been updated in place — sites that emit
     * UPDATE_UNIT_STATE for the hit should include them so the board icon clears with it.
     */
    bleedConsumed?: boolean;
}

export const calculateDamage = (
    target: Unit,
    amount: number,
    isPiercing: boolean = false,
    /**
     * Environment damage — burn ticks, lava, ground spikes — says true and walks straight
     * past helmet armour: a bucket keeps a pea out, not the fire cooking the body inside it.
     * That carve-out is what keeps FIRE and spike fields as real answers to an armoured lane
     * instead of armour blanking every 1-damage tool in the game at once.
     */
    ignoresArmor: boolean = false,
): DamageResult => {
    // Untouchable. First line of the one function every damage source in the game funnels
    // through, so "nothing hurts it this turn" needs no cooperation from any caller.
    if (target.invulnerable) {
        return {
            finalDamage: 0,
            shieldDamage: 0,
            remainingShield: target.shield || 0,
            remainingHp: target.hp,
            isFatal: false,
        };
    }

    // Shelled Chomper used to early-return here — total immunity for the whole digest
    // window, which deleted Maw's one drawback and contradicted its own card ("gains 3
    // shield"). The fusion now grants real shield when digestion begins (skillResolution),
    // and the shield arithmetic below handles the rest with no special case.

    // Flat reduction from an armour fusion. Applied here rather than at each damage site so
    // every source — melee, projectiles, lava, hazards, push collisions — respects it.
    // Never reduces a hit below 1, or armour would make a unit untouchable.
    const reduction = getFusionEffectValue(target, 'DAMAGE_REDUCTION')
        + getFusionEffectValue(target, 'STEADFAST');
    let damageToDeal = reduction > 0 && amount > 0 ? Math.max(1, amount - reduction) : amount;

    /**
     * HELMET ARMOUR (Unit.armor) — innate, and deliberately under the OPPOSITE floor rule to
     * the fusion reduction above. Fusion armour never drops a hit below 1 because a hero built
     * untouchable breaks the game. A Buckethead that shrugs a pea to ZERO is the point: the
     * player is being told "bring a bigger answer" — push it, burn it, spike its path — which
     * is exactly the triage this game is made of. Environment damage bypasses via the
     * `ignoresArmor` flag, so armour can never make a body unkillable, only pea-proof.
     */
    const armor = ignoresArmor ? 0 : (target.armor ?? 0);
    const beforeArmor = damageToDeal;
    if (armor > 0 && damageToDeal > 0) damageToDeal = Math.max(0, damageToDeal - armor);
    const absorbedByArmor = beforeArmor > 0 && damageToDeal === 0 && armor > 0;

    let shieldDmg = 0;
    let currentShield = target.shield || 0;

    /**
     * THE SHIELD IS A LAYER, NOT A NUMBER (PLAN-hero-zephyr §6.0) — ItB's shield: one layer
     * blocks ONE damage instance IN FULL, whatever its size, then breaks. Blocking the
     * Gargantuar's 5-damage fist and blocking an imp's 1-damage bite cost the same layer,
     * which is the whole design: the skill is in reading WHICH telegraphed blow to spend it
     * on, not in stacking a number tall enough to stop caring.
     *
     * `isPiercing` is deliberately NOT consulted any more. It used to mean "skip the shield
     * arithmetic"; there is no arithmetic left to skip, and the ruling is that a single
     * source never gets through a layer — Devour included. What DOES get through is a
     * multi-instance attack: each VOLLEY pea and each boss strike is its own call into this
     * function, so the first instance breaks the layer and the rest land. That boundary is
     * the strikes-vs-blast distinction the engine already draws (turnManager, STRIKES), not
     * anything new.
     *
     * Old saves may carry shield values > 1; they behave as one layer (any block zeroes
     * them), so no migration is needed — grant sites only ever write 1 from now on.
     */
    if (currentShield > 0 && damageToDeal > 0) {
        shieldDmg = damageToDeal;
        damageToDeal = 0;
        currentShield = 0;
    }

    /**
     * BLEEDING — the open wound spends itself on the next damage instance (PLAN-hero-zephyr
     * §8). Three orderings are load-bearing:
     *  - AFTER helmet armour, or a Buckethead would eat the whole gear: the +1 lands even on
     *    a hit the helmet clanged to zero — the wound is under the armour.
     *  - AFTER the layer check: a blocked instance carries nothing in and spends nothing
     *    (decision 16 — riders die with the blow the layer ate).
     *  - Gated on `amount > 0`, so zero-amount marker events (MISS, EMERGE...) neither
     *    trigger nor spend the wound.
     * The status is removed IN PLACE on the passed unit — sim copies stay coherent, and
     * `bleedConsumed` tells the caller to sync statusEffects to the board.
     */
    let bleedConsumed = false;
    if (amount > 0
        && shieldDmg === 0 && currentShield === 0   // no layer between the blow and the wound
        && target.statusEffects?.includes('BLEEDING')) {
        damageToDeal += 1;
        target.statusEffects = target.statusEffects.filter(s => s !== 'BLEEDING');
        bleedConsumed = true;
    }

    // 3. Apply to HP
    let currentHp = target.hp - damageToDeal;

    return {
        finalDamage: damageToDeal,
        shieldDamage: shieldDmg,
        remainingShield: currentShield,
        remainingHp: currentHp,
        isFatal: currentHp <= 0,
        absorbedByArmor,
        bleedConsumed,
    };
};

// Check if a specific tile is passable for a unit
const isTilePassable = (x: number, y: number, unit: Unit, units: Unit[], board: TileData[], terrainDefs: Record<string, TerrainDefinition>, ignoreUnits: boolean = false): boolean => {
    if (x < 0 || x >= 8 || y < 0 || y >= 8) return false;
    
    // Check Terrain
    const tile = getTileAt({x, y}, board);
    if (!tile) return false;
    const tDef = terrainDefs[tile.terrain];
    
    // WALL is absolute. Hand-authored maps use it to build choke points, and a choke point
    // that flyers or Diggers can ignore is not a choke point — the map's whole shape would
    // stop meaning anything.
    if (tile.terrain === 'WALL') return false;

    // A rail-bound unit has one road and this is not it. Checked separately rather than folded
    // into the walkability branch below because RAIL is not a passability problem — rail is
    // ordinary walkable ground for everybody; it is the ONLY ground for one unit.
    if (!canRideTo(unit, tile, board)) return false;

    // Terrain passability logic
    let canPassTerrain = true;
    if (tDef && !tDef.isWalkable) {
        canPassTerrain = false;
        if (unit.movementType === 'FLYING') canPassTerrain = true;
        if (unit.movementType === 'AMPHIBIOUS' && tile.terrain === 'WATER') canPassTerrain = true;
        if (unit.movementType === 'TELEPORT') canPassTerrain = true; // Teleport ignores terrain
    }
    
    if (!canPassTerrain) return false;

    // Check Unit Collision. Landing on an occupied tile is forbidden for everyone; the
    // movement code walks the path back to the last free step.
    if (!ignoreUnits && !canCrossBodies(unit)) {
        // Solid, not present: a burrowed body is not standing there as far as anything above
        // the sand is concerned. getValidMoves runs through here, so leaving it out puts an
        // unexplained hole in every hero's move range on the one tile showing nothing.
        const occupant = getSolidUnitAt({x, y}, units);
        if (occupant && occupant.id !== unit.id) return false;
    }

    return true;
};

/**
 * May this unit move THROUGH a tile another unit is standing on?
 *
 * Only two movement types may: a Balloon Zombie drifts over bodies and a Digger tunnels
 * under them, and bypassing a held line is the entire reason both units exist. For anything
 * that walks, a plant's body is a wall — that is what makes a defensive line a line at all.
 * Getting this wrong makes ground zombies stroll straight through the squad, and because
 * the AI only bites what actually blocks its route, a zombie that can walk through never
 * stops to attack either.
 */
export const canCrossBodies = (unit: Unit): boolean =>
    unit.movementType === 'FLYING' || unit.movementType === 'TELEPORT';

/**
 * May this unit END its move on this tile? Crossing and stopping are separate questions.
 *
 * A Balloon Zombie drifts over a mountain and a Digger tunnels under a lake, and both of
 * those are the point of the unit. Parking there is a different matter: a mountain blocks
 * projectiles as well as bodies, and nothing that walks can step beside open water — so a
 * unit that stops on either is a threat with no counterplay at all. That is not difficulty,
 * it is a dead end, so the rule is simply "land where you can be answered".
 *
 * Only a genuine swimmer settles in water. Lava and fire stay legal on purpose: they hurt
 * whoever stands in them, which is answer enough.
 */
export const canStopOn = (
    unit: Unit,
    tile: TileData | undefined,
    terrainDefs: Record<string, TerrainDefinition>
): boolean => {
    if (!tile) return false;
    if (terrainDefs[tile.terrain]?.isWalkable) return true;
    return unit.movementType === 'AMPHIBIOUS' && tile.terrain === 'WATER';
};

/**
 * Is this unit currently held to the rails?
 *
 * `movementType === 'RAIL'` alone is NOT the answer, and that gap is the whole design of the
 * rule. The leash only bites once the unit is STANDING on rail: a cart placed on open ground
 * walks to the nearest track like anything else, and only then can never leave it.
 */
export const isRailBound = (unit: Unit, board: TileData[]): boolean =>
    unit.movementType === 'RAIL' && getTileAt(unit.position, board)?.terrain === 'RAIL';

/** May this unit enter this tile, asking the RAIL rule and nothing else? True for everyone else. */
export const canRideTo = (unit: Unit, tile: TileData | undefined, board: TileData[]): boolean =>
    !isRailBound(unit, board) || tile?.terrain === 'RAIL';

// --- PATHFINDING (BFS with Path Reconstruction) ---
export const findPath = (
    unit: Unit, 
    targetPos: Position,
    units: Unit[], 
    board: TileData[], 
    terrainDefs: Record<string, TerrainDefinition>
): Position[] => {
    // Basic validation
    if (unit.position.x === targetPos.x && unit.position.y === targetPos.y) return [];
    
    const startNode = { x: unit.position.x, y: unit.position.y, dist: 0, path: [] as Position[] };
    const queue = [startNode];
    const visited = new Set<string>();
    visited.add(`${startNode.x},${startNode.y}`);
    
    let iterations = 0;

    while (queue.length > 0 && iterations < 500) {
        iterations++;
        const current = queue.shift()!;
        
        if (current.x === targetPos.x && current.y === targetPos.y) {
            return current.path;
        }

        const neighbors = [ 
            { x: current.x + 1, y: current.y }, 
            { x: current.x - 1, y: current.y }, 
            { x: current.x, y: current.y + 1 }, 
            { x: current.x, y: current.y - 1 } 
        ];

        for (const n of neighbors) {
            const key = `${n.x},${n.y}`;
            if (visited.has(key)) continue;

            const isTarget = n.x === targetPos.x && n.y === targetPos.y;
            
            if (isTarget || isTilePassable(n.x, n.y, unit, units, board, terrainDefs)) {
                visited.add(key);
                queue.push({
                    x: n.x, y: n.y,
                    dist: current.dist + 1,
                    path: [...current.path, { x: n.x, y: n.y }] 
                });
            }
        }
    }
    return [];
};


// --- MOVEMENT VALIDITY (Uses BFS) ---
/**
 * True for any skill whose payout is Sun — Harvest, the Sun-shroom charges, and anything
 * added later. Moving forfeits these for the turn: a sun producer may reposition OR bank
 * light, never both. Keyed on the effect rather than the unit class so a new producer
 * inherits the rule for free.
 */
export const isSunProducingSkill = (skill: Skill): boolean =>
    skill.effects.some(e =>
        (e.type === 'RESOURCE_GAIN' && (!e.resource || e.resource === 'SUN')) || e.type === 'CHARGE_SUN');

export const getValidMoves = (
    unit: Unit, 
    units: Unit[], 
    board: TileData[], 
    terrainDefs: Record<string, TerrainDefinition>
): Position[] => {
    // Sun producers used to be rooted to the spot. They can walk now — the cost is that
    // moving forfeits this turn's Sun (see isSunProducingSkill), which is a choice the
    // player makes rather than a restriction the board imposes.
    if (unit.isEnemy || unit.hasMoved || unit.hasAttacked || (unit.digestingTurns && unit.digestingTurns > 0) || unit.statusEffects?.includes('STUN') || unit.statusEffects?.includes('DORMANT')) {
        return [];
    }

    // SLOW costs distance rather than the turn — that is the whole difference between a chill
    // and a freeze. It has to cost the SQUAD what it costs the horde: turnManager PHASE 4 halves
    // an enemy's range on exactly this rule, while a slowed plant walked its full range because
    // nothing on this side of the board ever read the status. Same formula, floored at 1: a
    // chill must never root anything, that is what STUN is for.
    const slowed = unit.statusEffects?.includes('SLOW');

    const moves: Position[] = [];
    const queue: { x: number, y: number, dist: number }[] = [{ x: unit.position.x, y: unit.position.y, dist: 0 }];
    const visited = new Set<string>();
    visited.add(`${unit.position.x},${unit.position.y}`);
    const baseRange = unit.moveRange || 2;
    const moveRange = slowed ? Math.max(1, Math.floor(baseRange / 2)) : baseRange;

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (current.dist >= moveRange) continue;
        
        const neighbors = [ 
            { x: current.x + 1, y: current.y }, 
            { x: current.x - 1, y: current.y }, 
            { x: current.x, y: current.y + 1 }, 
            { x: current.x, y: current.y - 1 } 
        ];

        for (const n of neighbors) {
            const key = `${n.x},${n.y}`;
            if (visited.has(key)) continue;

            // Houses belong to the zombies — a plant may never stand in one, nor walk through it.
            // Pathfinding is untouched: zombies still need the tile to be reachable.
            if (getTileAt(n, board)?.isHouse) continue;

            if (isTilePassable(n.x, n.y, unit, units, board, terrainDefs)) {
                visited.add(key);
                queue.push({ x: n.x, y: n.y, dist: current.dist + 1 });
                moves.push({ x: n.x, y: n.y });
            }
        }
    }
    return moves;
};

/**
 * WING_PAIR (Zephyr's Wing Guns): the eight knight's-move cells, read as four DIRECTED pairs
 * — nose the drone one way, both wing rockets drop two tiles ahead, one to each side.
 *
 *      . X . X .        UP    = (x-2, y-1) + (x-2, y+1)
 *      . . . . .        DOWN  = (x+2, y-1) + (x+2, y+1)
 *      . . Z . .        LEFT  = (x-1, y-2) + (x+1, y-2)
 *      . . . . .        RIGHT = (x-1, y+2) + (x+1, y+2)
 *      . X . X .
 *
 * One table and one twin function, exported so the targeting overlay, the resolver and the
 * path preview can never disagree about which two cells a direction means — the same
 * discipline gustDirection keeps for the Blover.
 */
export const WING_OFFSETS: ReadonlyArray<{ x: number; y: number }> = [
    { x: -2, y: -1 }, { x: -2, y: 1 }, { x: 2, y: -1 }, { x: 2, y: 1 },
    { x: -1, y: -2 }, { x: 1, y: -2 }, { x: -1, y: 2 }, { x: 1, y: 2 },
];

/** The other cell of the aimed cell's direction pair. */
export const wingTwin = (origin: Position, cell: Position): Position => {
    const dx = cell.x - origin.x;
    const dy = cell.y - origin.y;
    // A vertical pair shares its x and mirrors the ±1; a horizontal pair the reverse.
    return Math.abs(dx) === 2
        ? { x: cell.x, y: origin.y - dy }
        : { x: origin.x - dx, y: cell.y };
};

// --- SKILL GEOMETRY ---
export const getSkillGeometry = (
    unit: Unit,
    skill: Skill
): Position[] => {
    const tiles: Position[] = [];

    if (skill.rangeType === 'LOB' || skill.rangeType === 'RADIUS') {
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                const dist = Math.abs(x - unit.position.x) + Math.abs(y - unit.position.y);
                if (dist > 0 && dist <= skill.rangeValue) {
                    tiles.push({ x, y });
                }
            }
        }
    } 
    else if (skill.rangeType === 'LINE' || skill.rangeType === 'DASH') {
        const directions = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
        directions.forEach(dir => {
            for (let i = 1; i <= skill.rangeValue; i++) {
                const tx = unit.position.x + (dir.dx * i);
                const ty = unit.position.y + (dir.dy * i);
                if (tx >= 0 && tx < 8 && ty >= 0 && ty < 8) {
                    tiles.push({ x: tx, y: ty });
                }
            }
        });
    } 
    else if (skill.rangeType === 'MELEE' || skill.rangeType === 'ADJACENT') {
        // Melee historically ignored rangeValue (always the 4 adjacent tiles). The Pea
        // Lance fusion extends it, so walk each direction up to rangeValue like a short line.
        const reach = Math.max(1, skill.rangeValue || 1);
        const offsets = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
        offsets.forEach(o => {
            for (let i = 1; i <= reach; i++) {
                const tx = unit.position.x + (o.x * i);
                const ty = unit.position.y + (o.y * i);
                if (tx < 0 || tx >= 8 || ty < 0 || ty >= 8) break;
                tiles.push({ x: tx, y: ty });
            }
        });
    }
    else if (skill.rangeType === 'SELF') {
        tiles.push(unit.position);
    }
    else if (skill.rangeType === 'WING_PAIR') {
        WING_OFFSETS.forEach(o => {
            const tx = unit.position.x + o.x;
            const ty = unit.position.y + o.y;
            if (tx >= 0 && tx < 8 && ty >= 0 && ty < 8) tiles.push({ x: tx, y: ty });
        });
    }

    return tiles;
};

// --- TARGETING LOGIC ---
export const getValidSkillTargets = (
    unit: Unit,
    skill: Skill,
    units: Unit[],
    board: TileData[],
    terrainDefs: Record<string, TerrainDefinition>
): Position[] => {
    if (unit.hasAttacked || (unit.digestingTurns && unit.digestingTurns > 0) || unit.statusEffects?.includes('STUN') || unit.statusEffects?.includes('DORMANT')) return [];

    /**
     * DUST VEIL, the player's half. A hero standing in the dust cannot aim either.
     *
     * Symmetric on purpose, and the symmetry is what makes the hazard a tool rather than a
     * tax: the veil is worth walking into to deny a boss its swing, and the price for doing
     * it is your own. An asymmetric version would be either a free wall or pure punishment,
     * and neither is a decision.
     *
     * Only offensive skills are stopped — "blinds units, cancels attacks" (data/terrain.ts).
     * A shield, a taunt or a harvest needs no line of sight and is left alone, which is also
     * what keeps Gourdward and Thornhide from being switched off by weather.
     */
    if (skill.effects.some(e => e.type === 'DAMAGE')) {
        const here = getTileAt(unit.position, board);
        if (here?.smoke && here.smoke.turns > 0) return [];
    }

    if (unit.class === UnitClass.SCAREDY_SHROOM) {
        const adjacentOffsets = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
        let isScared = false;
        for (const o of adjacentOffsets) {
            const adjPos = { x: unit.position.x + o.x, y: unit.position.y + o.y };
            const u = getUnitAt(adjPos, units);
            if (u && u.isEnemy) {
                isScared = true;
                break;
            }
        }
        if (isScared) return [];
    }

    const targets: Position[] = [];
    const hasSpawn = skill.effects.some(e => e.type === 'SPAWN');
    const hasTerrainMod = skill.effects.some(e => e.type === 'TERRAIN_MOD');
    const hasPierce = skill.effects.some(e => e.type === 'PIERCE_ATTACK');
    const hasGlobalPush = skill.effects.some(e => e.type === 'GLOBAL_PUSH');
    // Smoke Pod: pure area denial, so BARE GROUND is a legal aim. Gated on the skill dealing
    // no damage — a damaging skill that merely CARRIES dust (a SKILL_DISARM fusion) keeps
    // needing a body, or fusing would quietly change what the base skill may aim at.
    const hasGroundDust = skill.effects.some(e => e.type === 'DUST_TILE')
        && !skill.effects.some(e => e.type === 'DAMAGE');

    const isValidTargetUnit = (u: Unit) => {
        const isAllyTargeting = skill.effects.some(e =>
            e.type === 'BUFF_STAT' ||
            e.type === 'HEAL' ||
            e.type === 'SHIELD' ||
            e.type === 'REFRESH_ACTION'
        );

        if (isAllyTargeting) {
            return !u.isEnemy && u.id !== unit.id;
        }
        // FRIENDLY FIRE: a damaging skill may be aimed at whatever stands in its geometry,
        // ally included (never the caster). Allied bodies already STOPPED every line shot —
        // pretending the impact was then harmless made stray fire read as a glitch, and it
        // let a careless lane assignment cost nothing. Positioning mistakes should bleed.
        if (skill.effects.some(e => e.type === 'DAMAGE')) {
            return u.id !== unit.id;
        }
        // A skill with NO damage at all is still an attack. Chardwall's free swing carries
        // only PUSH — where the target lands is its whole payload — so it has to reach this
        // branch and come back valid against anything hostile. It deliberately stops short of
        // the friendly-fire rule above: shoving is not an accident you can make with an ally
        // in the way, so a 0-damage skill only ever aims at enemies and obstacles.
        return u.isEnemy || u.type === UnitType.OBSTACLE;
    };

    if (skill.rangeType === 'LOB') {
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                const dist = Math.abs(x - unit.position.x) + Math.abs(y - unit.position.y);
                if (dist > 0 && dist <= skill.rangeValue) {
                    const obstacle = getSolidUnitAt({x, y}, units);
                    if (obstacle) {
                        if (isValidTargetUnit(obstacle)) {
                             targets.push({ x, y });
                        }
                    } else if (hasSpawn || hasTerrainMod || hasGroundDust) {
                        targets.push({ x, y });
                    }
                }
            }
        }
    } 
    else if (skill.rangeType === 'LINE' || skill.rangeType === 'DASH') {
        const directions = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
        directions.forEach(dir => {
            for (let i = 1; i <= skill.rangeValue; i++) {
                const tx = unit.position.x + (dir.dx * i);
                const ty = unit.position.y + (dir.dy * i);
                if (tx < 0 || tx >= 8 || ty < 0 || ty >= 8) break;

                const tile = getTileAt({x: tx, y: ty}, board);
                const obstacle = getUnitAt({x: tx, y: ty}, units);
                // Two lookups, and the split matters most on DASH. `solid` is what may be SHOT
                // — a burrowed body is not, and must not stop the lane either, or it becomes a
                // wall nobody can see. `obstacle` is what OCCUPIES the tile, a different
                // question the moment a skill wants to LAND there.
                const solid = obstacle && !obstacle.isBurrowed ? obstacle : undefined;

                if (tile && terrainDefs[tile.terrain]?.type === 'MOUNTAIN') break; 
                
                if (skill.rangeType === 'DASH') {
                     // Neither a target nor a landing spot, and the lane carries on past it:
                     // Rolling Charge rolls over the sand, and must not come to rest on top of
                     // a body it could not see.
                     if (obstacle?.isBurrowed) continue;
                     if (!obstacle) {
                         targets.push({ x: tx, y: ty });
                     } else {
                         if (obstacle.isEnemy) targets.push({ x: tx, y: ty });
                         break;
                     }
                } else {
                    if (solid) {
                        if (isValidTargetUnit(solid)) {
                            targets.push({ x: tx, y: ty });
                        }
                        if (!hasPierce) {
                             break; 
                        }
                    }
                }
            }
        });
    } else if (skill.rangeType === 'MELEE' || skill.rangeType === 'ADJACENT') {
        // Reach beyond 1 comes from the Pea Lance fusion. The swing stops at the first
        // unit in each direction — melee never pierces — and mountains block it.
        const reach = Math.max(1, skill.rangeValue || 1);
        const hasToss = skill.effects.some(e => e.type === 'TOSS');
        const hasShieldEffect = skill.effects.some(e => e.type === 'SHIELD');
        const offsets = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
        offsets.forEach(o => {
            for (let i = 1; i <= reach; i++) {
                const tx = unit.position.x + (o.x * i);
                const ty = unit.position.y + (o.y * i);
                if (tx < 0 || tx >= 8 || ty < 0 || ty >= 8) break;

                const tile = getTileAt({x: tx, y: ty}, board);
                if (tile && terrainDefs[tile.terrain]?.type === 'MOUNTAIN') break;

                // Reinforce aims at a HOUSE the same way it aims at an ally: the layer goes
                // on the tile. Only an unshielded, brain-holding house is worth the action.
                if (hasShieldEffect && tile?.isHouse && tile.hasBrain && !tile.shielded) {
                    targets.push({ x: tx, y: ty });
                    break;
                }

                const u = getSolidUnitAt({x:tx, y:ty}, units);
                if (u) {
                    if (isValidTargetUnit(u)) {
                        /**
                         * TOSS aims are only legal when the throw can LAND: the mirrored
                         * tile (2·C − T) must be on the board, free of solid bodies, and
                         * somewhere a body can exist — not a wall, not a mountain, not a
                         * house. Water is fine: drowning them is the point. The ItB rule,
                         * enforced at aim time so the overlay never offers a broken throw.
                         */
                        if (hasToss) {
                            const dest = { x: 2 * unit.position.x - tx, y: 2 * unit.position.y - ty };
                            const destTile = dest.x >= 0 && dest.x < 8 && dest.y >= 0 && dest.y < 8
                                ? getTileAt(dest, board) : undefined;
                            const destBlocked = !destTile
                                || destTile.terrain === 'WALL'
                                || terrainDefs[destTile.terrain]?.type === 'MOUNTAIN'
                                || destTile.isHouse
                                || !!getSolidUnitAt(dest, units);
                            if (!destBlocked) targets.push({ x: tx, y: ty });
                        } else {
                            targets.push({ x: tx, y: ty });
                        }
                    }
                    break;
                } else if ((hasSpawn || hasTerrainMod || hasGlobalPush) && i === 1) {
                    targets.push({ x: tx, y: ty });
                }
            }
        });
    } else if (skill.rangeType === 'SELF') {
        targets.push(unit.position);
    } else if (skill.rangeType === 'WING_PAIR') {
        // Either cell of a direction is aimable when EITHER cell of that direction holds a
        // valid target — the player picks a heading, not a tile, and the twin fires with it.
        // No line of sight and no mountain check, like LOB: the rockets drop in from above.
        WING_OFFSETS.forEach(o => {
            const t = { x: unit.position.x + o.x, y: unit.position.y + o.y };
            if (t.x < 0 || t.x >= 8 || t.y < 0 || t.y >= 8) return;
            const here = getSolidUnitAt(t, units);
            const hereValid = !!here && isValidTargetUnit(here);
            const tw = wingTwin(unit.position, t);
            const twinUnit = (tw.x >= 0 && tw.x < 8 && tw.y >= 0 && tw.y < 8)
                ? getSolidUnitAt(tw, units) : undefined;
            const twinValid = !!twinUnit && isValidTargetUnit(twinUnit);
            if (hereValid || twinValid) targets.push(t);
        });
    }

    return targets;
};

export const getSkillTargetPath = (
    unit: Unit,
    skill: Skill,
    targetPos: Position,
    board: TileData[]
): Position[] => {
    const path: Position[] = [];
    const hasPierce = skill.effects.some(e => e.type === 'PIERCE_ATTACK');

    if (skill.rangeType === 'LOB') {
        const dx = Math.sign(targetPos.x - unit.position.x);
        const dy = Math.sign(targetPos.y - unit.position.y);
        let cx = unit.position.x;
        let cy = unit.position.y;
        while(true) {
            if (cx === targetPos.x && cy === targetPos.y) break;
            if (cx !== targetPos.x) cx += dx;
            else if (cy !== targetPos.y) cy += dy;
            path.push({ x: cx, y: cy });
            if (Math.abs(cx - unit.position.x) > 8 || Math.abs(cy - unit.position.y) > 8) break;
        }
    } else if (skill.rangeType === 'LINE' || skill.rangeType === 'DASH') {
        const dx = Math.sign(targetPos.x - unit.position.x);
        const dy = Math.sign(targetPos.y - unit.position.y);
        if (dx !== 0 && dy !== 0) return []; 
        let cx = unit.position.x + dx;
        let cy = unit.position.y + dy;
        while (true) {
            path.push({ x: cx, y: cy });
            if (!hasPierce && cx === targetPos.x && cy === targetPos.y) break;
            const dist = Math.abs(cx - unit.position.x) + Math.abs(cy - unit.position.y);
            if (dist >= skill.rangeValue) break;
            if (cx === targetPos.x && cy === targetPos.y && !hasPierce) break;
            cx += dx;
            cy += dy;
            if (Math.abs(cx - unit.position.x) > 8 || Math.abs(cy - unit.position.y) > 8) break;
        }
    } else if (skill.rangeType === 'WING_PAIR') {
        // The pair, so the hover preview lights BOTH cells the heading will strike.
        path.push(targetPos);
        const tw = wingTwin(unit.position, targetPos);
        if (tw.x >= 0 && tw.x < 8 && tw.y >= 0 && tw.y < 8) path.push(tw);
    } else {
        path.push(targetPos);
    }
    return path;
};
