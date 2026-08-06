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
 * WILL THIS UNIT ACTUALLY GET TO ACT NEXT TURN? The one predicate, and it is exported because
 * there were two.
 *
 * Stunned and frozen units skip their turn, dead ones are gone, and a hypnotised zombie
 * (`isEnemy === false`) fights for the player now.
 *
 * `UnitComponent` used to answer the same question with its own inline copy, and the two had
 * already drifted apart in both directions: the arrow over a unit's head ignored FREEZE, so a
 * frozen zombie pointed at a hero the overlay said was safe — the board contradicting itself in
 * two places at once. Now the arrow and the overlay cannot disagree, because there is nothing
 * left to disagree with.
 */
export const willAct = (unit: Unit): boolean => {
    if (!unit.isEnemy) return false;
    /**
     * DEAD IS DEAD, and `isDying` alone was not enough to say so.
     *
     * `isDying` is a rendering flag: the reducer sets it when it starts the death animation,
     * which is a separate action from the APPLY_DAMAGE that emptied the health bar. Between
     * those two — and on any path that removes a body without animating it — the corpse is
     * still in `units` with an intent on it, so the board went on warning that a house was
     * about to lose its brain to a zombie the player had already killed. The whole point of
     * the telegraph is that it can be trusted; one warning that cannot be acted on teaches
     * people to ignore the ones that can.
     */
    if (unit.hp <= 0) return false;
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

        // Blast tiles are read for EVERY intent type, ahead of the ladder below: a bolt rides
        // an ATTACK but a grid discharging rides a WAIT, and both threaten ground. A telegraph
        // that only believed ATTACK would show the punch and hide what jumps off it.
        (intent.blast ?? []).forEach(h => { if (isValidPos(h.pos)) hits.push(h.pos); });
        // Same three lines for the same reason. `strikes` and `blast` differ in how the engine
        // RESOLVES them — one provokes an answer, one does not — and not at all in whether the
        // ground is about to be hurt. This overlay only asks the second question.
        (intent.strikes ?? []).forEach(h => { if (isValidPos(h.pos)) hits.push(h.pos); });

        if (intent.type !== 'ATTACK' && intent.type !== 'SPAWN') continue;
        // A multi-tile summon threatens every tile it lands on, not just the first. Without
        // this the player is shown one of the four and surprised by three.
        // A multi-blow attack is the same problem as a multi-tile summon: `target` is only
        // the first hand. computeThreatDetail keeps one mark per entry and sumThreatDamageAt
        // adds them by tile, so two blows on one body print -6 on one square with no new UI.
        // `target` is `strikes[0]` by contract, so a multi-blow intent has ALREADY listed it
        // above — adding it again here billed the first hand twice and printed -9 for two
        // 3-damage swings. When `strikes` speaks for the whole attack, this line says nothing.
        const landing = intent.type === 'SPAWN' && intent.spawnTiles?.length
            ? intent.spawnTiles
            : (intent.strikes?.length ? [] : [intent.target]);
        landing.filter(isValidPos).forEach(p => hits.push(p!));
    }
    return dedupePositions(hits);
};

/**
 * Houses that lose their brain next turn, and who takes it.
 *
 * A zombie takes a brain by BITING the house from the tile beside it, and that bite is an
 * ordinary ATTACK intent aimed at the house (turnManager, "BRAIN BITE"). So the telegraph is
 * simply: is something aiming an attack at a house?
 *
 * There used to be a second case — a walk whose destination was a house — and removing it is
 * the point. It fired a full turn before the zombie could do anything, on a unit the player
 * could still intercept, which trained people to read the red house marker as noise. A
 * warning that cannot be acted on yet is worse than no warning.
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
            const house = houses.get(key(intent.target));
            if (!house) continue;
            // A warded house is not "a brain about to go" — the bite will break the layer,
            // not the house (PLAN-hero-zephyr §6.3). Painting it red anyway would teach the
            // player that Reinforce does nothing.
            if (house.shielded) continue;
            threats.push({ pos: { x: intent.target.x, y: intent.target.y }, sourceId: unit.id });
            continue;
        }

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

        // Each blast tile prints its OWN number. That is the whole point of a falloff: the
        // player has to read 3 / 2 / 1 off the board and decide which body to walk out of the
        // pattern. One summed figure would hide the shape the fight is teaching.
        (intent.blast ?? []).forEach(h => {
            if (isValidPos(h.pos)) marks.push({ pos: { x: h.pos.x, y: h.pos.y }, damage: h.damage, sourceId: unit.id });
        });
        (intent.strikes ?? []).forEach(h => {
            if (isValidPos(h.pos)) marks.push({ pos: { x: h.pos.x, y: h.pos.y }, damage: h.damage, sourceId: unit.id });
        });

        if (intent.type !== 'ATTACK' && intent.type !== 'SPAWN') continue;
        // A multi-tile summon threatens every tile it lands on, not just the first. Without
        // this the player is shown one of the four and surprised by three.
        // A multi-blow attack is the same problem as a multi-tile summon: `target` is only
        // the first hand. computeThreatDetail keeps one mark per entry and sumThreatDamageAt
        // adds them by tile, so two blows on one body print -6 on one square with no new UI.
        // `target` is `strikes[0]` by contract, so a multi-blow intent has ALREADY listed it
        // above — adding it again here billed the first hand twice and printed -9 for two
        // 3-damage swings. When `strikes` speaks for the whole attack, this line says nothing.
        const landing = intent.type === 'SPAWN' && intent.spawnTiles?.length
            ? intent.spawnTiles
            : (intent.strikes?.length ? [] : [intent.target]);

        // A SPAWN telegraphs a body arriving, not damage — show it as 0.
        const damage = intent.type === 'SPAWN'
            ? (intent.damage ?? 0)
            : (intent.damage ?? unit.damage ?? 0);

        landing.filter(isValidPos).forEach(p => marks.push({
            pos: { x: p!.x, y: p!.y },
            damage,
            sourceId: unit.id,
        }));
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
