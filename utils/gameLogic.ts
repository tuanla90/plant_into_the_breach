
import { Unit, Position, Skill, TileData, TerrainDefinition, UnitType, UnitClass, EffectType } from '../types';
import { DIGEST_CLAW_SKILL_ID, getFusionEffectValue, hasFusionEffect } from './fusion';

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
 * Which way a Storm Fan gust blows: toward whichever board edge the targeted tile sits closest
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
     * Các cú va chạm THÂN-VÀO-THÂN, giữ nguyên CẶP và VỊ TRÍ.
     *
     * `collided` ở trên là một mảng ID phẳng — đủ để tính "ai ăn một điểm", nhưng đã mất thông
     * tin "ai đâm vào ai". Blast Chard (`COLLISION_SPLASH`) cần đúng thông tin đó: tâm nổ là
     * điểm giữa HAI thân, nên phải biết chúng là cặp nào và đứng ở đâu.
     *
     * Va chạm vào TƯỜNG / mép bàn / Greenspire KHÔNG sinh entry ở đây — chỉ có một thân, không
     * có điểm giữa, nên không có vụ nổ. Cùng lý do cú ném (TOSS) không nổ: nó chỉ va với mặt đất.
     */
    impacts: Array<{ a: Position; b: Position }>;
    /**
     * Enemies shoved into a Greenspire that still held a sprout. They take it and leave, exactly as
     * if they had walked in — so a careless shove toward your own side feeds them. This is
     * what stops PUSH from being a free "get it away from me" button.
     */
    tookBrain: Array<{ unitId: string; Greenspire: Position }>;
    /**
     * Greenspires whose SHELL LAYER (TileData.shielded — Gourdward's Reinforce) ate a shove this
     * plan aimed at their doorway. The layer breaks, the sprout stays, the shover is billed a
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
    tookBrain: Array<{ unitId: string; Greenspire: Position }>;
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
    /** Cặp thân-vào-thân, kèm vị trí — xem `PushPlan.impacts`. Chỉ ca có HAI thân mới ghi. */
    impacts: Array<{ a: Position; b: Position }>,
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
        // Hai thân, hai ô kề nhau — đây là ca DUY NHẤT có điểm giữa để đặt tâm nổ.
        impacts.push({ a: { ...mover.position }, b: { ...blocker.position } });
        return step;
    }

    const inBounds = dest.x >= 0 && dest.x < 8 && dest.y >= 0 && dest.y < 8;
    const destTile = inBounds ? getTileAt(dest, board) : undefined;

    // A Greenspire with a sprout still in it is not a wall to a zombie — it is the thing it wants.
    // Shoving one in hands over the sprout, which makes pushing toward your own side a real
    // mistake rather than a free repositioning tool.
    const houseWithBrain = !!destTile
        && !!destTile.isHouse
        && !!destTile.hasBrain
        && !brainlessHouses.has(`${dest.x},${dest.y}`)
        && mover.isEnemy;

    if (!inBounds || !destTile || destTile.terrain === 'WALL' || (destTile.isHouse && !houseWithBrain)) {
        // Board edge, barrier, or a Greenspire with nothing left to steal — a genuine wall. Only
        // one body is involved now, so only one takes the hit.
        bumped.add(mover.id);
        return step;
    }

    if (houseWithBrain) {
        /**
         * A SHIELDED Greenspire (Gourdward's Reinforce, TileData.shielded) answers the shove the
         * way a wall does — the zombie slams into the shell instead of the doorway, the
         * layer breaks, the sprout stays. The careless-push tax survives in a smaller coin:
         * the collision point still lands, the layer the player spent an action raising is
         * gone, but the sprout is not.
         */
        if (destTile.shielded) {
            step.wardedHouses.push({ ...dest });
            bumped.add(mover.id);
            return step;
        }
        step.tookBrain.push({ unitId: mover.id, Greenspire: { ...dest } });
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
     * Greenspires whose sprout has already been taken earlier in the same turn, keyed "x,y". The
     * board itself is only updated by the reducer, so a caller resolving several shoves in one
     * pass has to tell us, or two zombies could claim the same sprout.
     */
    brainlessHouses: Set<string> = new Set(),
    /**
     * How many TILES the shove drives the mover. Chardslam throws 2, and PUSH_DISTANCE buys
     * more on top; everything else still shoves the 1 tile this defaults to.
     *
     * Resolved one tile at a time on purpose. A long shove is NOT a teleport: each tile is its
     * own chance to jam on a body, hit the map edge, drop into water, or hand a live Greenspire its
     * sprout, so a 2-tile throw that meets a mountain on the first tile stops there and still
     * pays the collision. Sliding the target `distance` tiles in one calculation would let it
     * skip over exactly the obstacles this hero exists to slam things into.
     */
    distance: number = 1,
): PushPlan => {
    const plan: PushPlan = { moves: [], drowned: [], doused: [], collided: [], impacts: [], tookBrain: [], wardedHouses: [] };
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
        // The mover drowned, or walked off with a sprout. There is nothing left to shove.
        if (!current) break;

        const step = planPushStep(
            current, dx, dy, [...working.values()], board, terrainDefs, maxChain, claimedHouses, bumped, plan.impacts,
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
        // A body that drowned or took a sprout is off the board: it must stop blocking the
        // tiles still to come, and must never be moved a second time.
        step.drowned.forEach(id => working.delete(id));
        step.tookBrain.forEach(({ unitId, Greenspire }) => {
            working.delete(unitId);
            claimedHouses.add(`${Greenspire.x},${Greenspire.y}`);
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
    /**
     * This instance was eaten by the LAST_STAND_SHIELD layer. The target object's
     * `lastStandUsed` has been set in place — sites that emit UPDATE_UNIT_STATE for the hit
     * must carry it, or the once-per-battle promise resets on the next write-back.
     */
    lastStandSpent?: boolean;
}

/**
 * The state write-back for a hit that met a shell: the layer, and the last stand if this was
 * the blow that spent it.
 *
 * One helper rather than a literal at each site because `lastStandUsed` is a ONCE-PER-BATTLE
 * promise — a site that forgets it does not crash, it quietly hands the player a second free
 * death save, which is the kind of bug that never gets reported.
 */
export const shieldUpdatesFor = (r: DamageResult): Partial<Unit> =>
    r.lastStandSpent
        ? { shield: r.remainingShield, lastStandUsed: true }
        : { shield: r.remainingShield };

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

    // Armored Jaws used to early-return here — total immunity for the whole digest
    // window, which deleted Snapmaw's one drawback and contradicted its own card ("gains 3
    // shield"). The fusion now grants real shield when digestion begins (skillResolution),
    // and the shield arithmetic below handles the rest with no special case.

    // Flat reduction from an armour fusion. Applied here rather than at each damage site so
    // every source — melee, projectiles, lava, hazards, push collisions — respects it.
    // Never reduces a hit below 1, or armour would make a unit untouchable.
    //
    // Armored Jaws joins the same sum, fenced inside the window it is sold for: the hide
    // thickens for the two turns Snapmaw cannot act and is worth nothing the rest of the fight.
    const reduction = getFusionEffectValue(target, 'DAMAGE_REDUCTION')
        + getFusionEffectValue(target, 'STEADFAST')
        + ((target.digestingTurns ?? 0) > 0 ? getFusionEffectValue(target, 'ARMOR_WHILE_DIGESTING') : 0);
    let damageToDeal = reduction > 0 && amount > 0 ? Math.max(1, amount - reduction) : amount;

    /**
     * HELMET ARMOUR (Unit.armor) — innate, and deliberately under the OPPOSITE floor rule to
     * the fusion reduction above. Fusion armour never drops a hit below 1 because a hero built
     * untouchable breaks the game. A Pothelm that shrugs a pea to ZERO is the point: the
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
     * Gravehulk's 5-damage fist and blocking an imp's 1-damage bite cost the same layer,
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
     *  - AFTER helmet armour, or a Pothelm would eat the whole gear: the +1 lands even on
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

    /**
     * THE LAST STAND (Bunker Plating) — the layer that is not there until it is needed.
     *
     * Checked LAST, after armour, the layer and the wound, because the promise is about the
     * OUTCOME rather than about the blow: whatever finally gets through and would end her
     * raises a shell instead, and the shell eats that instance whole — the same thing an
     * ordinary layer does, on the same terms.
     *
     * It can only fire on a bare body: a standing layer would have absorbed the hit twenty
     * lines up and `currentHp` would never have gone under. So there is no double-block to
     * guard against, and the bleed above cannot be spent by a blow this refuses either — it
     * already ran on the same "no layer between the blow and the wound" test.
     *
     * Reported AND mutated in place, exactly like `bleedConsumed`: the simulation copies stay
     * coherent inside one resolution, and the flag reaches the board through the caller.
     */
    let lastStandSpent = false;
    if (currentHp <= 0 && damageToDeal > 0
        && !target.lastStandUsed
        && hasFusionEffect(target, 'LAST_STAND_SHIELD')) {
        shieldDmg = damageToDeal;
        damageToDeal = 0;
        currentHp = target.hp;
        target.lastStandUsed = true;
        lastStandSpent = true;
        // Decision 16 restated: riders die with the blow a layer ate. The wound was spent a
        // few lines up on a hit that is now blocked, so it is put back.
        if (bleedConsumed && target.statusEffects) {
            target.statusEffects = [...target.statusEffects, 'BLEEDING'];
            bleedConsumed = false;
        }
    }

    return {
        finalDamage: damageToDeal,
        shieldDamage: shieldDmg,
        remainingShield: currentShield,
        remainingHp: currentHp,
        isFatal: currentHp <= 0,
        absorbedByArmor,
        bleedConsumed,
        lastStandSpent,
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
 * Only two movement types may: a Floater drifts over bodies and a Digger tunnels
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
 * A Floater drifts over a mountain and a Digger tunnels under a lake, and both of
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
 * True for any skill whose payout is Sol — Harvest, the Sol Cap charges, and anything
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
    // Sol producers used to be rooted to the spot. They can walk now — the cost is that
    // moving forfeits this turn's Sol (see isSunProducingSkill), which is a choice the
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
    const blessedBonus = unit.statusEffects?.includes('BLESSED') ? 1 : 0;
    const baseRange = (unit.moveRange || 2) + blessedBonus;
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

            // Greenspires belong to the zombies — a plant may never stand in one, nor walk through it.
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
 * WING_PAIR (Reedwing's Wing Guns): the eight knight's-move cells, read as four DIRECTED pairs
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
 * discipline gustDirection keeps for the Storm Fan.
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

/**
 * The tile BETWEEN a direction's two cells — the hole in the middle of the wing pattern, which
 * only Cluster Load (WING_MIDSHOT) ever fills. Always an exact integer: the pair shares one
 * coordinate and its other legs are ±1 off the same line, so the midpoint lands on a square.
 * UP's pair (x-2, y∓1) has (x-2, y) between it; LEFT's (x∓1, y-2) has (x, y-2).
 */
export const wingMid = (origin: Position, cell: Position): Position => {
    const tw = wingTwin(origin, cell);
    return { x: (cell.x + tw.x) / 2, y: (cell.y + tw.y) / 2 };
};

/**
 * Ô KỀ CHÉO nằm ngay trong ô knight, về phía Reedwing — thứ Underslung Pods (EXTENDED_BARRELS)
 * thêm vào. Lùi đúng một bước trên trục "2" của nước mã:
 *
 *      . X . X .        X = cặp knight của hướng LÊN
 *      . n . n .        n = hai ô hàm này trả về
 *      . . Z . .
 *
 * Mỗi bên thành một cột dọc 2 ô — "súng hai bên bắn thành một hàng dọc".
 *
 * Vì sao lấp vào TRONG chứ không kéo ra ngoài: hình knight có một vùng chết ngay quanh thân cô,
 * nên thứ đứng sát là thứ nguy hiểm nhất mà cô lại bó tay. Và vì `inMelee` là Manhattan ≤ 1,
 * ĐƯỜNG CHÉO KHÔNG TÍNH LÀ KỀ — một zombie đứng chéo cô thì nó không đánh cô được, mà sau ô này
 * thì cô bắn được nó. Một ô bắn-mà-không-bị-bắn-lại, hợp đúng thân 4 máu.
 */
export const wingNear = (origin: Position, cell: Position): Position => {
    const dx = cell.x - origin.x;
    const dy = cell.y - origin.y;
    return Math.abs(dx) === 2
        ? { x: origin.x + dx / 2, y: cell.y }
        : { x: cell.x, y: origin.y + dy / 2 };
};

/** On the 8x8 board. */
const onBoard = (p: Position): boolean => p.x >= 0 && p.x < 8 && p.y >= 0 && p.y < 8;

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
        const midshot = hasFusionEffect(unit, 'WING_MIDSHOT');
        const extended = hasFusionEffect(unit, 'EXTENDED_BARRELS');
        WING_OFFSETS.forEach(o => {
            const cell = { x: unit.position.x + o.x, y: unit.position.y + o.y };
            if (onBoard(cell)) tiles.push(cell);
            // Underslung Pods: ô chéo kề, tô cùng lúc với ô knight — người chơi phải thấy đủ
            // vùng bắn trước khi bấm, đúng luật "không giấu gì" của cả game.
            if (extended) {
                const near = wingNear(unit.position, cell);
                if (onBoard(near) && !tiles.some(t => t.x === near.x && t.y === near.y)) tiles.push(near);
            }
            // Cluster Load's belly rocket. Shown in the overlay too, or the fusion would be
            // invisible until the moment it resolved.
            if (midshot) {
                const mid = wingMid(unit.position, cell);
                if (onBoard(mid) && !tiles.some(t => t.x === mid.x && t.y === mid.y)) tiles.push(mid);
            }
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
    /**
     * THE DIGEST GATE, with exactly one door in it.
     *
     * Everything a digesting hero owns is refused here — which is the drawback, and is also
     * why Spitter's card ("a spit she can still use while digesting") was a lie for as long as
     * it existed: the gate never looked at which skill was being asked about. Rending Claws is
     * the honest version, so the gate now names the one id that is allowed through and nothing
     * else changes. `hasAttacked` still applies: the claw is her action, not a free extra.
     */
    const digesting = !!unit.digestingTurns && unit.digestingTurns > 0;
    if (digesting && skill.id !== DIGEST_CLAW_SKILL_ID) return [];
    if (unit.hasAttacked || unit.statusEffects?.includes('STUN') || unit.statusEffects?.includes('DORMANT')) return [];

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
     * what keeps Gourdward and Thornshell from being switched off by weather.
     */
    if (skill.effects.some(e => e.type === 'DAMAGE')) {
        const here = getTileAt(unit.position, board);
        if (here?.smoke && here.smoke.turns > 0) return [];
    }

    // Luật "sợ khi có địch đứng cạnh" của Shy Cap đã đi cùng cái cây — nó là cây duy nhất
    // trong game có luật này, và cây đã bị bỏ khỏi data/plants.ts.

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
            e.type === 'REFRESH_ACTION' ||
            e.type === 'BLESS'
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
        // A skill with NO damage at all is still an attack. Chardslam's free swing carries
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
                // on the tile. Only an unshielded, sprout-holding Greenspire is worth the action.
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
                         * Greenspire. Water is fine: drowning them is the point. The ItB rule,
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
        const midshot = hasFusionEffect(unit, 'WING_MIDSHOT');
        const extended = hasFusionEffect(unit, 'EXTENDED_BARRELS');
        WING_OFFSETS.forEach(o => {
            const t = { x: unit.position.x + o.x, y: unit.position.y + o.y };
            if (!onBoard(t)) return;
            const holdsTarget = (p: Position) => {
                if (!onBoard(p)) return false;
                const u = getSolidUnitAt(p, units);
                return !!u && isValidTargetUnit(u);
            };
            // With Cluster Load the belly tile counts as well: a lone zombie standing in the
            // gap is a legal heading, or the third rocket could never be the reason to fire.
            //
            // Underslung Pods joins on the same terms: một con đứng CHÉO kề cô cũng làm hướng
            // đó bắn được, nếu không thì hai ô mới sẽ không bao giờ là lý do để nổ súng.
            const anyValid = holdsTarget(t)
                || holdsTarget(wingTwin(unit.position, t))
                || (midshot && holdsTarget(wingMid(unit.position, t)))
                || (extended && (holdsTarget(wingNear(unit.position, t))
                    || holdsTarget(wingNear(unit.position, wingTwin(unit.position, t)))));
            if (anyValid) targets.push(t);
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
        // Underslung Pods: preview phải sáng đủ 4 ô, không thì hai ô mới thành thông tin ẩn.
        if (hasFusionEffect(unit, 'EXTENDED_BARRELS')) {
            [targetPos, tw].forEach(c => {
                const near = wingNear(unit.position, c);
                if (near.x >= 0 && near.x < 8 && near.y >= 0 && near.y < 8
                    && !path.some(p => p.x === near.x && p.y === near.y)) path.push(near);
            });
        }
    } else {
        path.push(targetPos);
    }

    /**
     * Split Shell: ô viên phụ sáng cùng ô chính. Nằm NGOÀI mọi nhánh rangeType vì nó đọc đường
     * hình học caster → target, không đọc hình dạng đòn — và vì cam kết của game là người chơi
     * cộng nhẩm được kết quả TRƯỚC khi bấm, nên một ô có sát thương mà không sáng là vi phạm.
     */
    if (hasFusionEffect(unit, 'SPLIT_SHOT')) {
        const dx = Math.sign(targetPos.x - unit.position.x);
        const dy = Math.sign(targetPos.y - unit.position.y);
        if (dx !== 0 || dy !== 0) {
            const t = { x: targetPos.x + dx, y: targetPos.y + dy };
            if (t.x >= 0 && t.x < 8 && t.y >= 0 && t.y < 8
                && !path.some(p => p.x === t.x && p.y === t.y)) path.push(t);
        }
    }
    return path;
};
