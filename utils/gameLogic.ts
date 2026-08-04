
import { Unit, Position, Skill, TileData, TerrainDefinition, UnitType, UnitClass, EffectType } from '../types';
import { getFusionEffectValue, hasFusionEffect } from './fusion';

// Helper to get unit at position
export const getUnitAt = (pos: Position, units: Unit[]) => units.find(u => u.position.x === pos.x && u.position.y === pos.y);

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
 *  2. CHAINS. A body in the way is not automatically a wall — it gets shoved on. The line
 *     only jams when the far end has nowhere to go, and then the two units that actually
 *     collided take the hit. That turns positioning into a combo rather than a coin flip.
 *
 * Pure: it decides, it does not mutate. Each caller turns the plan into its own actions.
 */
export interface PushPlan {
    /** Ordered far-end first, so applying them in sequence never double-occupies a tile. */
    moves: Array<{ unitId: string; to: Position }>;
    /** Units that end up in water they cannot survive. They die. */
    drowned: string[];
    /** Units that slammed into something. One point each, per the collision rule. */
    collided: string[];
    /**
     * Enemies shoved into a house that still held a brain. They take it and leave, exactly as
     * if they had walked in — so a careless shove toward your own side feeds them. This is
     * what stops PUSH from being a free "get it away from me" button.
     */
    tookBrain: Array<{ unitId: string; house: Position }>;
}

/** Water only kills what cannot swim, fly, or is not alive to begin with. */
const survivesWater = (unit: Unit): boolean =>
    unit.immunities.includes('DROWN')
    || unit.movementType === 'FLYING'
    || unit.movementType === 'AMPHIBIOUS'
    || unit.type === UnitType.OBSTACLE;

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
): PushPlan => {
    const plan: PushPlan = { moves: [], drowned: [], collided: [], tookBrain: [] };
    if (mover.immunities.includes('PUSH')) return plan;

    const alive = units.filter(u => u.hp > 0);
    const occupantAt = (p: Position) => alive.find(u => u.position.x === p.x && u.position.y === p.y);

    // Walk the line of bodies the shove would drive.
    const train: Unit[] = [mover];
    let probe = { x: mover.position.x + dx, y: mover.position.y + dy };
    while (train.length <= maxChain) {
        const next = occupantAt(probe);
        if (!next) break;
        // An immovable body ends the line and jams everything behind it.
        if (next.immunities.includes('PUSH')) {
            plan.collided.push(mover.id, next.id);
            return plan;
        }
        train.push(next);
        probe = { x: probe.x + dx, y: probe.y + dy };
    }

    // `probe` is now the first empty tile past the train — where the front unit would land.
    const frontDest = probe;
    const inBounds = frontDest.x >= 0 && frontDest.x < 8 && frontDest.y >= 0 && frontDest.y < 8;
    const destTile = inBounds ? getTileAt(frontDest, board) : undefined;
    const front = train[train.length - 1];

    // The line is longer than one shove can drive: nothing moves, the ends take the hit.
    if (train.length > maxChain) {
        plan.collided.push(mover.id, train[1].id);
        return plan;
    }

    // A house with a brain still in it is not a wall to a zombie — it is the thing it wants.
    // Shoving one in hands over the brain, which makes pushing toward your own side a real
    // mistake rather than a free repositioning tool.
    const houseWithBrain = !!destTile
        && !!destTile.isHouse
        && !!destTile.hasBrain
        && !brainlessHouses.has(`${frontDest.x},${frontDest.y}`)
        && front.isEnemy;

    if (!inBounds || !destTile || destTile.terrain === 'WALL' || (destTile.isHouse && !houseWithBrain)) {
        // Board edge, barrier, or a house with nothing left to steal — a genuine wall.
        plan.collided.push(mover.id);
        if (train.length > 1) plan.collided.push(front.id);
        return plan;
    }

    if (houseWithBrain) {
        plan.tookBrain.push({ unitId: front.id, house: { ...frontDest } });
        // The rest of the line still shifts up behind it, same as when the front drowns.
        for (let i = train.length - 1; i >= 0; i--) {
            const u = train[i];
            plan.moves.push({ unitId: u.id, to: { x: u.position.x + dx, y: u.position.y + dy } });
        }
        return plan;
    }

    const walkable = terrainDefs[destTile.terrain]?.isWalkable;
    const isWater = destTile.terrain === 'WATER';

    if (!walkable && !isWater) {
        // Mountain and friends: solid to a shove.
        plan.collided.push(mover.id);
        if (train.length > 1) plan.collided.push(front.id);
        return plan;
    }

    // Only the FRONT unit ever meets new ground: everyone behind it steps into a tile the
    // unit ahead just vacated, which they were already standing on.
    if (!walkable && isWater && !survivesWater(front)) {
        plan.drowned.push(front.id);
    }

    // Far end first, so applying the moves in order never double-occupies a tile. A drowning
    // unit still vacates, which is what lets the one behind it take the bank.
    for (let i = train.length - 1; i >= 0; i--) {
        const u = train[i];
        plan.moves.push({ unitId: u.id, to: { x: u.position.x + dx, y: u.position.y + dy } });
    }
    return plan;
};

// --- DAMAGE CALCULATION CORE ---
export interface DamageResult {
    finalDamage: number;
    shieldDamage: number;
    remainingShield: number;
    remainingHp: number;
    isFatal: boolean;
}

export const calculateDamage = (target: Unit, amount: number, isPiercing: boolean = false): DamageResult => {
    // Shelled Chomper: the digest window is Maw's whole drawback, and this fusion
    // closes it completely. Checked before anything else so no source can chip her — the
    // same reason DAMAGE_REDUCTION lives here rather than at each call site.
    if ((target.digestingTurns ?? 0) > 0 && hasFusionEffect(target, 'ARMOR_WHILE_DIGESTING')) {
        return {
            finalDamage: 0,
            shieldDamage: 0,
            remainingShield: target.shield || 0,
            remainingHp: target.hp,
            isFatal: false
        };
    }

    // Flat reduction from an armour fusion. Applied here rather than at each damage site so
    // every source — melee, projectiles, lava, hazards, push collisions — respects it.
    // Never reduces a hit below 1, or armour would make a unit untouchable.
    const reduction = getFusionEffectValue(target, 'DAMAGE_REDUCTION')
        + getFusionEffectValue(target, 'STEADFAST');
    let damageToDeal = reduction > 0 && amount > 0 ? Math.max(1, amount - reduction) : amount;
    let shieldDmg = 0;
    let currentShield = target.shield || 0;
    
    // 1. Handle Shield (unless Piercing)
    if (currentShield > 0 && !isPiercing) {
        if (currentShield >= damageToDeal) {
            shieldDmg = damageToDeal;
            currentShield -= damageToDeal;
            damageToDeal = 0;
        } else {
            shieldDmg = currentShield;
            damageToDeal -= currentShield;
            currentShield = 0;
        }
    }

    // 3. Apply to HP
    let currentHp = target.hp - damageToDeal;
    
    return {
        finalDamage: damageToDeal,
        shieldDamage: shieldDmg,
        remainingShield: currentShield,
        remainingHp: currentHp,
        isFatal: currentHp <= 0
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
        const occupant = getUnitAt({x, y}, units);
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

    const moves: Position[] = [];
    const queue: { x: number, y: number, dist: number }[] = [{ x: unit.position.x, y: unit.position.y, dist: 0 }];
    const visited = new Set<string>();
    visited.add(`${unit.position.x},${unit.position.y}`);
    const moveRange = unit.moveRange || 2; 

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
        return u.isEnemy || u.type === UnitType.OBSTACLE;
    };

    if (skill.rangeType === 'LOB') {
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                const dist = Math.abs(x - unit.position.x) + Math.abs(y - unit.position.y);
                if (dist > 0 && dist <= skill.rangeValue) {
                    const obstacle = getUnitAt({x, y}, units);
                    if (obstacle) {
                        if (isValidTargetUnit(obstacle)) {
                             targets.push({ x, y });
                        }
                    } else if (hasSpawn || hasTerrainMod) {
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

                if (tile && terrainDefs[tile.terrain]?.type === 'MOUNTAIN') break; 
                
                if (skill.rangeType === 'DASH') {
                     if (!obstacle) {
                         targets.push({ x: tx, y: ty });
                     } else {
                         if (obstacle.isEnemy) targets.push({ x: tx, y: ty });
                         break;
                     }
                } else {
                    if (obstacle) {
                        if (isValidTargetUnit(obstacle)) {
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
        const offsets = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
        offsets.forEach(o => {
            for (let i = 1; i <= reach; i++) {
                const tx = unit.position.x + (o.x * i);
                const ty = unit.position.y + (o.y * i);
                if (tx < 0 || tx >= 8 || ty < 0 || ty >= 8) break;

                const tile = getTileAt({x: tx, y: ty}, board);
                if (tile && terrainDefs[tile.terrain]?.type === 'MOUNTAIN') break;

                const u = getUnitAt({x:tx, y:ty}, units);
                if (u) {
                    if (isValidTargetUnit(u)) targets.push({ x: tx, y: ty });
                    break;
                } else if ((hasSpawn || hasTerrainMod || hasGlobalPush) && i === 1) {
                    targets.push({ x: tx, y: ty });
                }
            }
        });
    } else if (skill.rangeType === 'SELF') {
        targets.push(unit.position);
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
    } else {
        path.push(targetPos);
    }
    return path;
};
