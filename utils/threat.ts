import { Position, TileData, Unit } from '../types';

/**
 * TELEGRAPH — pure helpers that turn enemy `intent` data into board overlays.
 *
 * Into the Breach's core promise is that the player can always see the next enemy turn
 * before committing to their own. Everything here is derived, side-effect free and
 * React-free so it can be unit tested or reused by the HUD.
 *
 * COORDINATES: `x` is the screen ROW (vertical), `y` is the screen COLUMN (horizontal).
 * Houses live at column `y === HOUSE_COLUMN` (0), zombies march in from high `y`.
 */

/** A single incoming hit on a tile, attributed to the unit that will deliver it. */
export interface ThreatMark {
    pos: Position;
    damage: number;
    sourceId: string;
}

/**
 * A brain that will be carried off on the enemy's next turn.
 *
 * This is the single most expensive thing that can happen — brains are a run-wide budget
 * and running out ends the run — yet it used to be drawn as an ordinary amber "walks here"
 * marker, indistinguishable from a zombie shuffling one tile forward. It gets its own
 * overlay so the player can never miss the turn they had to react.
 */
export interface BrainThreat {
    /** The house about to be robbed. */
    pos: Position;
    /** The zombie that will take it, so the culprit can be marked too. */
    sourceId: string;
}

/** One tile of a telegraphed enemy walk. `isDestination` marks where it stops. */
export interface EnemyPathTile {
    pos: Position;
    isDestination: boolean;
    sourceId: string;
    /** 0-based order along the path, used to fade the trail out. */
    step: number;
}

const key = (p: Position) => `${p.x},${p.y}`;

const isValidPos = (p?: Position | null): p is Position =>
    !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.y >= 0;

/**
 * A unit only telegraphs if it will actually get to act next turn.
 * Stunned units skip their turn, dying units are already gone, and a hypnotised
 * zombie (`isEnemy === false`) now fights for the player.
 */
const willAct = (unit: Unit): boolean => {
    if (!unit.isEnemy) return false;
    if (unit.isDying) return false;
    // FREEZE skips the turn exactly like STUN (turnManager builds stunnedUnitIds from both),
    // but only STUN was listed here — so a frozen zombie went on telegraphing an attack it
    // would never make, and the threat overlay showed damage that could not arrive.
    if (unit.statusEffects?.includes('STUN')) return false;
    if (unit.statusEffects?.includes('FREEZE')) return false;
    return !!unit.intent;
};

/** Dedupe a list of positions, keeping first-seen order. */
export const dedupePositions = (positions: Position[]): Position[] => {
    const seen = new Set<string>();
    const out: Position[] = [];
    for (const p of positions) {
        if (!isValidPos(p)) continue;
        const k = key(p);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push({ x: p.x, y: p.y });
    }
    return out;
};

/**
 * Every tile that will be hit on the enemy's next turn.
 * ATTACK and SPAWN intents both resolve onto `intent.target`.
 */
export const computeThreatenedTiles = (units: Unit[]): Position[] => {
    const hits: Position[] = [];
    for (const unit of units || []) {
        if (!willAct(unit)) continue;
        const intent = unit.intent!;
        if (intent.type !== 'ATTACK' && intent.type !== 'SPAWN') continue;
        if (!isValidPos(intent.target)) continue;
        hits.push(intent.target);
    }
    return dedupePositions(hits);
};

/**
 * Houses that lose their brain next turn, and who takes it.
 *
 * A zombie steals a brain by ENDING its move on a house that still holds one — see
 * turnManager's "Reached a house that still holds a brain" branch. So the telegraph is
 * simply: does this unit's walk finish on an occupied house? Attack intents never take a
 * brain, only movement does, which is exactly why the plain threat overlay missed it.
 */
export const computeBrainThreats = (units: Unit[], board: TileData[]): BrainThreat[] => {
    const houses = new Map<string, TileData>();
    for (const tile of board || []) {
        if (tile.isHouse && tile.hasBrain !== false) houses.set(key(tile), tile);
    }
    if (houses.size === 0) return [];

    const threats: BrainThreat[] = [];
    for (const unit of units || []) {
        if (!willAct(unit)) continue;
        const intent = unit.intent!;

        // Two ways a brain is about to go. The ATTACK case is the urgent one: the zombie is
        // already standing on the doorstep and takes the brain when the turn resolves, so
        // this is the player's last chance to kill it or shove it off.
        if (intent.type === 'ATTACK') {
            if (!isValidPos(intent.target)) continue;
            if (!houses.has(key(intent.target))) continue;
            threats.push({ pos: { x: intent.target.x, y: intent.target.y }, sourceId: unit.id });
            continue;
        }

        if (intent.type !== 'MOVE') continue;

        // Where the walk actually ends: the last path step, or a bare moveTo.
        const path = intent.movePath;
        const destination = path && path.length > 0 ? path[path.length - 1] : intent.moveTo;
        if (!isValidPos(destination)) continue;
        if (!houses.has(key(destination))) continue;

        threats.push({ pos: { x: destination.x, y: destination.y }, sourceId: unit.id });
    }
    return threats;
};

/** Ids of the zombies that will carry a brain off next turn. */
export const brainThiefIds = (threats: BrainThreat[]): Set<string> =>
    new Set((threats || []).map(threat => threat.sourceId));

/**
 * Normalises the spawn queue the Board already receives. Kept here so every
 * telegraph overlay goes through the same dedupe/validation path.
 */
export const computeIncomingSpawnTiles = (spawnQueue: Position[]): Position[] =>
    dedupePositions(spawnQueue || []);

/**
 * Same set as `computeThreatenedTiles`, but keeps one entry per attacker so the
 * board can print how much damage a tile is about to take. Two zombies hitting the
 * same tile produce two marks — sum them with `sumThreatDamageAt`.
 */
export const computeThreatDetail = (units: Unit[]): ThreatMark[] => {
    const marks: ThreatMark[] = [];
    for (const unit of units || []) {
        if (!willAct(unit)) continue;
        const intent = unit.intent!;
        if (intent.type !== 'ATTACK' && intent.type !== 'SPAWN') continue;
        if (!isValidPos(intent.target)) continue;

        // A SPAWN telegraphs a body arriving, not damage — show it as 0.
        const damage = intent.type === 'SPAWN'
            ? (intent.damage ?? 0)
            : (intent.damage ?? unit.damage ?? 0);

        marks.push({
            pos: { x: intent.target.x, y: intent.target.y },
            damage,
            sourceId: unit.id,
        });
    }
    return marks;
};

/** Total incoming damage on one tile across every attacker aimed at it. */
export const sumThreatDamageAt = (marks: ThreatMark[], x: number, y: number): number =>
    (marks || []).reduce(
        (total, mark) => (mark.pos.x === x && mark.pos.y === y ? total + mark.damage : total),
        0
    );

/**
 * Tiles the enemy intends to walk through next turn, from `intent.movePath`.
 * Falls back to a bare `intent.moveTo` when no path was computed.
 * The unit's own tile is dropped — it is already occupied, marking it adds noise.
 */
export const computeEnemyPathTiles = (units: Unit[]): EnemyPathTile[] => {
    const byTile = new Map<string, EnemyPathTile>();

    for (const unit of units || []) {
        if (!willAct(unit)) continue;
        const intent = unit.intent!;

        const rawPath = (intent.movePath && intent.movePath.length > 0)
            ? intent.movePath
            : (isValidPos(intent.moveTo) ? [intent.moveTo] : []);

        const path = rawPath.filter(
            p => isValidPos(p) && !(p.x === unit.position.x && p.y === unit.position.y)
        );
        if (path.length === 0) continue;

        const destination = isValidPos(intent.moveTo) ? intent.moveTo : path[path.length - 1];

        path.forEach((p, index) => {
            const isDestination = p.x === destination.x && p.y === destination.y;
            const k = key(p);
            const existing = byTile.get(k);
            // A destination marker always wins over a plain pass-through marker.
            if (existing && !(isDestination && !existing.isDestination)) return;
            byTile.set(k, {
                pos: { x: p.x, y: p.y },
                isDestination,
                sourceId: unit.id,
                step: index,
            });
        });
    }

    return Array.from(byTile.values());
};

/** Convenience lookup for the render layer. */
export const findEnemyPathTile = (
    pathTiles: EnemyPathTile[],
    x: number,
    y: number
): EnemyPathTile | undefined =>
    (pathTiles || []).find(t => t.pos.x === x && t.pos.y === y);
