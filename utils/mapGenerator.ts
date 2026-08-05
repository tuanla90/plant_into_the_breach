
import { BossId, MapNode, WorldType, TileData, TerrainType } from '../types';
import { GRID_SIZE } from '../constants';
import { pickTemplate, pickArena, materializeTemplate } from '../data/maps';
import { actsOfStage, bossById } from '../data/unlocks';

/**
 * A run must never go more than this many layers without a place to revive a hero — measured
 * along the worst path, not the luckiest one (see the reachability pass in GENERATE_MAP).
 *
 * This is the dial for how forgiving a run is. Every step up removes roughly one rest per
 * run. 3 put campfires on 29% of all nodes, which read as too generous.
 */
const MAX_LAYERS_BETWEEN_CAMPFIRES = 4;

/**
 * The run walks through three sectors, each with its own hazard (see data/hazards.ts).
 * GRASS is deliberately calm so the opening levels teach the base rules first.
 *
 * Which THREE depends on how far the campaign has got. A stage is three acts and three bosses
 * (PLAN-boards-bosses.md section 1), so the stage a save is on is simply how many bosses it
 * has put down, divided by three — no new counter, and it cannot drift out of sync with the
 * boss table because it IS the boss table.
 */
const STAGE_SECTORS: WorldType[][] = [
    ['GRASS', 'DESERT', 'VOLCANO'],  // I  — the Green Belt
    ['COAST', 'THORN', 'ICE'],       // II — the Far Shore
    ['NEON', 'RUIN', 'GRID'],        // III— the City
];

/** 0-based stage index, clamped: a finished campaign keeps replaying the last chain. */
export const stageForBosses = (bossesBeaten: number): number =>
    Math.max(0, Math.min(STAGE_SECTORS.length - 1, Math.floor(bossesBeaten / 3)));

/**
 * Layers in ONE ACT, and an act is one map.
 *
 * TEN, which is what a map here has always been. It was briefly five, when three acts shared a
 * single fifteen-layer page, and five is not a chapter — it is one ordinary battle, a shop, a
 * rest and then a boss. The fights are the game; a map that reaches its boss before the player
 * has had a run of fights is a corridor.
 *
 * So the acts are not stacked into one page any more. Each is a full map with its own boss at
 * the bottom, and clearing that boss builds the next one (useGameProgression, "the act cut").
 * Slay the Spire's shape, and for its reason: an act should END, visibly, before the next one
 * starts.
 */
const LAYERS_PER_ACT = 10;

/**
 * ONE ACT'S MAP.
 *
 * A run is still three acts — `RunResult` has said so since before there was a campaign screen
 * — but they are three MAPS, walked one after another, not three bands of one. This builds the
 * one the player is standing in; clearing its boss is what asks for the next.
 *
 * `endsRun` is the whole seam. The boss of acts one and two carries `endsRun: false`, which
 * says "banked, but not the door out": the payout waits, the run keeps its Coin, its bench and
 * its wounded, and the next act's map is generated underneath it. Only the act that closes the
 * stage ends the run.
 *
 * @param bossesBeaten  how far the save has got; picks the stage when nothing overrides it.
 * @param stageOverride 0-based stage the player CHOSE on the campaign screen. The count is
 *                      only ever a guess at where someone wants to be, and once there is a
 *                      screen for saying so, the saying wins.
 * @param bossId        the act being played. Its boss goes on the last node, and its sector is
 *                      the ground the whole map is drawn on.
 */
export const GENERATE_MAP = (bossesBeaten = 0, stageOverride?: number, bossId?: BossId): MapNode[] => {
    const stage = stageOverride !== undefined
        ? Math.max(0, Math.min(STAGE_SECTORS.length - 1, stageOverride))
        : stageForBosses(bossesBeaten);
    const chain = STAGE_SECTORS[stage] ?? STAGE_SECTORS[0];
    const stageActs = actsOfStage((stage + 1) as 1 | 2 | 3);

    // The act this map IS. Falling back to the stage's first act keeps every other entry point
    // — tutorial skip, debug jump, a save with no chosen act — behaving exactly as it did.
    const act = (bossId ? bossById(bossId) : undefined) ?? stageActs[0];
    const world = chain[(act?.act ?? 1) - 1] ?? chain[0];
    const isLastAct = !act || act.act === stageActs[stageActs.length - 1]?.act;

    const nodes: MapNode[] = [];
    const layers = LAYERS_PER_ACT;

    // Layer 0: start. Layers 1..7: 2-4 wide. Layer 8: the pre-boss rest. Layer 9: the boss.
    // The last two are ONE node each — a single node funnels every branch back together before
    // the fight, which is what a pre-boss rest is for, and a boss the player could walk past is
    // not a boss.
    const nodesPerLayer: number[] = [1];
    for (let i = 1; i < layers - 2; i++) {
        // Weighted random for width: mostly 2 or 3, rarely 4
        const rand = Math.random();
        if (rand > 0.9) nodesPerLayer.push(4);
        else if (rand > 0.4) nodesPerLayer.push(3);
        else nodesPerLayer.push(2);
    }
    nodesPerLayer.push(1); // Pre-boss campfire
    nodesPerLayer.push(1); // Boss

    let nodeIdCounter = 0;
    const layerNodes: MapNode[][] = [];

    for (let layer = 0; layer < layers; layer++) {
        const currentLayer: MapNode[] = [];
        const count = nodesPerLayer[layer];
        
        // Vertical Position: Top Down Strategy
        // Layer 0 (Start) is at ~5% height (Top)
        // Layer 9 (Boss) is at ~95% height (Bottom)
        const yPos = 5 + (layer * (90 / (layers - 1))); 

        for (let i = 0; i < count; i++) {
            // Horizontal Distribution
            // Spread nodes evenly across the width (10% to 90%)
            const segmentWidth = 100 / (count + 1);
            // Add some jitter to xPos so it's not perfectly straight lines
            const jitter = (Math.random() * 6) - 3; // +/- 3%
            const xPos = (segmentWidth * (i + 1)) + jitter;
            
            // Determine Type
            let type: MapNode['type'] = 'BATTLE';

            if (layer === 0) {
                type = 'BATTLE'; // Start
            } else if (layer === layers - 1) {
                type = 'BOSS';
            } else if (layer === layers - 2) {
                type = 'CAMPFIRE';
            } else {
                const rand = Math.random();
                // One guaranteed shop per act, on ONE node of its layer rather than all of
                // them, so taking it still costs whatever the branch beside it was offering.
                if (layer === 3 && i === 0) {
                     type = 'SHOP';
                } else {
                    // INCREASED EVENT FREQUENCY
                    // Elite: 15% (High Risk)
                    // Event: 25% (Narrative/Reward) -> Increased from 10%
                    // Shop:  10% (Spending)
                    // Camp:  10% (Recovery)
                    // Battle: 40% (Standard)
                    // No random CAMPFIRE band any more. Rest sites used to be rolled here at
                    // 10% AND forced in afterwards, so the two stacked and campfires ended up
                    // 29% of the map. The reachability pass below now guarantees the spacing
                    // on its own, so rolling extra ones on top only dilutes the run.
                    if (rand > 0.85) type = 'ELITE';
                    else if (rand > 0.60) type = 'EVENT';
                    else if (rand > 0.50) type = 'SHOP';
                    else type = 'BATTLE';
                }
            }

            const node: MapNode = {
                id: `node_${nodeIdCounter++}`,
                x: xPos,
                y: yPos,
                type,
                // One sector for the whole map: this map IS one act, and an act is one place.
                world,
                status: layer === 0 ? 'AVAILABLE' : 'LOCKED',
                next: [],
                ...(type === 'BOSS' && act
                    ? {
                        bossId: act.id,
                        // Acts one and two hand over to the next map instead of ending the
                        // run — the same flag the Breach's gauntlet uses for its corridors.
                        ...(isLastAct ? {} : { endsRun: false }),
                    }
                    : {}),
            };
            currentLayer.push(node);
            nodes.push(node);
        }

        layerNodes.push(currentLayer);
    }

    // Link Layers
    for (let i = 0; i < layers - 1; i++) {
        const current = layerNodes[i];
        const next = layerNodes[i+1];

        current.forEach(parentNode => {
             // Path linkage logic
             // Always connect to the nearest node in next layer, 
             // plus potential neighbors to create branching paths.
             
             // Sort next layer nodes by distance to parent X
             const sortedNext = [...next].sort((a, b) => Math.abs(a.x - parentNode.x) - Math.abs(b.x - parentNode.x));
             
             // Always connect to the closest one
             parentNode.next.push(sortedNext[0].id);

             // If there are more nodes, maybe connect to the second closest (branching)
             if (sortedNext.length > 1) {
                 // 40% chance to create a branch if it's not too far
                 if (Math.random() > 0.6 && Math.abs(sortedNext[1].x - parentNode.x) < 40) {
                     parentNode.next.push(sortedNext[1].id);
                 }
             }
        });

        // SAFETY CHECK: Ensure every node in 'next' layer has at least one parent
        // If a node in 'next' has no incoming connections, connect it to the closest 'current' node
        next.forEach(childNode => {
            const hasParent = current.some(p => p.next.includes(childNode.id));
            if (!hasParent) {
                const closestParent = [...current].sort((a, b) => Math.abs(a.x - childNode.x) - Math.abs(b.x - childNode.x))[0];
                closestParent.next.push(childNode.id);
            }
        });
    }

    // --- CAMPFIRE REACHABILITY -------------------------------------------------------
    //
    // Rest sites are the only place a hero is revived, and since the shop's repair service
    // was removed they are also the only place a damaged squad heals. So "the run always has
    // a campfire within N layers" has to be true of the PATH THE PLAYER WALKS, not of the map.
    //
    // The old rule converted one random node in a layer that had gone too long without one.
    // But the player occupies a single node per layer, so on a 3-wide layer that is a ~1 in 3
    // chance of the campfire being on their branch — and it might not even be linked to where
    // they are standing. Measured over 12,498 generated paths: 26.5% reached the pre-boss rest
    // site having passed no campfire at all, with stretches of up to 8 layers.
    //
    // This runs AFTER linking, and walks forward carrying, per node, the length of the WORST
    // path that reaches it. Taking the max over parents is what makes the guarantee hold for
    // every route rather than the luckiest one; a node that would break the limit becomes a
    // campfire itself, so only the nodes that actually need converting are touched.
    const layerIndexOf = new Map<string, number>();
    layerNodes.forEach((row, i) => row.forEach(n => layerIndexOf.set(n.id, i)));

    const parentsOf = new Map<string, MapNode[]>();
    nodes.forEach(p => p.next.forEach(id => {
        if (!parentsOf.has(id)) parentsOf.set(id, []);
        parentsOf.get(id)!.push(p);
    }));

    // Layers since the last campfire on the worst route into this node. The start counts as
    // a rest: the squad begins a run at full health.
    const sinceRest = new Map<string, number>();
    layerNodes[0].forEach(n => sinceRest.set(n.id, 0));

    for (let layer = 1; layer < layers; layer++) {
        layerNodes[layer].forEach(node => {
            if (node.type === 'CAMPFIRE') { sinceRest.set(node.id, 0); return; }

            const parents = parentsOf.get(node.id) ?? [];
            const worst = parents.reduce((n, p) => Math.max(n, sinceRest.get(p.id) ?? 0), 0) + 1;

            // The boss layer is exempt: the layer before it is already all campfires, so a
            // conversion here would only delete the boss.
            if (worst > MAX_LAYERS_BETWEEN_CAMPFIRES && layer < layers - 1) {
                node.type = 'CAMPFIRE';
                sinceRest.set(node.id, 0);
            } else {
                sinceRest.set(node.id, worst);
            }
        });
    }

    return nodes;
};

/**
 * THE BREACH — a gauntlet, not a map.
 *
 * It used to be neither. Picking it generated an ordinary ten-layer stage III run with
 * Blightlord swapped onto the final node: the same branching walk through Neon Rose, the same
 * shops and campfires and random events, and the campaign screen's promise — "every boss
 * again, back to back, with no brain rule, and then him" — delivered as one boss at the end of
 * a normal Tuesday. The last act in the game was the third act again with different lighting.
 *
 * So it is authored rather than rolled, and it is authored as the opposite of a map:
 *
 *   NO BRANCHES. A Slay-the-Spire map is a route-planning game — take the elite for the
 *   reward, skip the shop, reach the rest with health to spare. The Breach is a test of a
 *   finished build against every problem the campaign posed, in order. There is nothing to
 *   plan around, and a fork that offers no choice is worse than a line.
 *
 *   NO SHOPS, NO EVENTS. Whatever the squad walks in with is what fights. Buying a counter to
 *   Voltmaw two nodes before Voltmaw is exactly the answer this run is meant to refuse.
 *
 *   NINE SECTORS, IN CAMPAIGN ORDER. Each boss is fought on its own arena, in its own sector,
 *   so its own hazard fires (data/hazards.ts) — the rails still slide under Ironcart, the tide
 *   still comes in on the Armada. Fighting a boss on neutral ground is fighting half of it.
 *
 *   A CAMP AFTER EVERY BOSS, and every service in it costs money (`paidCamp`). Ten boss
 *   fights with no revives is not difficulty, it is a coin toss settled in the first ten
 *   minutes — but a FREE rest between each one is no decision either. Each boss pays out
 *   (COIN_PER_LEVEL + COIN_BOSS_BONUS), the camp on the other side of it is the only place
 *   that money can go, and it never stretches to everything: patch the squad, or buy the gear
 *   that might mean nobody needs patching next time.
 *
 * Nine of the ten bosses carry `endsRun: false`. Only Blightlord is the way out.
 */
export const GENERATE_BREACH_MAP = (): MapNode[] => {
    // Campaign order, and the sector each one is fought in — the same pairing STAGE_SECTORS
    // makes for an ordinary run, so a boss's act (stage 1 act 2) IS its ground (DESERT).
    const run: { boss: BossId; world: WorldType }[] = [
        { boss: 'GARGANTUAR', world: 'GRASS' },
        { boss: 'CATAPULT_LORD', world: 'DESERT' },
        { boss: 'CINDER_COLOSSUS', world: 'VOLCANO' },
        { boss: 'BALLOON_ARMADA', world: 'COAST' },
        { boss: 'SANDREAVER', world: 'THORN' },
        { boss: 'YETI', world: 'ICE' },
        { boss: 'DISCO_ZOMBOSS', world: 'NEON' },
        { boss: 'CLOCKJAW', world: 'RUIN' },
        { boss: 'VOLTMAW', world: 'GRID' },
    ];

    const nodes: MapNode[] = [];
    const push = (n: Omit<MapNode, 'id' | 'x' | 'y' | 'next'>): MapNode => {
        const node: MapNode = { id: `breach_${nodes.length}`, x: 50, y: 0, next: [], ...n };
        nodes.push(node);
        return node;
    };

    // A camp AT THE DOOR as well as after each boss. Gear is only sold at camps here, so
    // without this one the opening purse is money the player cannot spend until the first
    // Gargantuar is already dead — they would walk into it with a bare bench and no way to
    // have done anything about it.
    push({ type: 'CAMPFIRE', world: run[0].world, status: 'LOCKED', paidCamp: true });
    run.forEach(step => {
        push({ type: 'BOSS', world: step.world, status: 'LOCKED', bossId: step.boss, endsRun: false });
        // One camp per boss, in the sector that boss was fought in.
        push({ type: 'CAMPFIRE', world: step.world, status: 'LOCKED', paidCamp: true });
    });
    // Blightlord fights on the Breach's own board (arena_breach, RUIN, no houses at all), and
    // this is the node that ends the run and banks the win.
    push({ type: 'BOSS', world: 'RUIN', status: 'LOCKED', bossId: 'BLIGHTLORD' });

    // A straight line down the page, evenly spaced, first node live.
    nodes.forEach((node, i) => {
        node.y = 5 + (i * (90 / (nodes.length - 1)));
        // A gauntlet is a column, but a perfectly straight one reads as a progress bar rather
        // than ground. A small alternating offset keeps it a path without ever implying a
        // choice — there is only one link out of every node.
        node.x = 50 + (i % 2 === 0 ? -6 : 6);
        node.status = i === 0 ? 'AVAILABLE' : 'LOCKED';
        node.next = i < nodes.length - 1 ? [nodes[i + 1].id] : [];
    });

    return nodes;
};

const IMPASSABLE_FOR_CHECK: TerrainType[] = ['WATER', 'MOUNTAIN', 'WALL'];

/**
 * Hand-authored maps must be correct by construction, so this no longer *repairs* anything —
 * it reports. A map where a house is unreachable is an authoring mistake and should be fixed
 * in `data/maps.ts`, not silently patched at runtime.
 *
 * Returns the ids of houses no walker can reach.
 */
export const findUnreachableHouses = (board: TileData[]): string[] => {
    const at = (x: number, y: number) => board[x * GRID_SIZE + y];
    const walkable = (t: TileData) => !IMPASSABLE_FOR_CHECK.includes(t.terrain);

    const seed = board.find(t => t.isSpawnZone && walkable(t));
    if (!seed) return board.filter(t => t.isHouse).map(t => `${t.x},${t.y}`);

    const seen = new Set<string>([`${seed.x},${seed.y}`]);
    const queue: TileData[] = [seed];

    while (queue.length > 0) {
        const cur = queue.shift()!;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
            const nx = cur.x + dx, ny = cur.y + dy;
            if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) return;
            const key = `${nx},${ny}`;
            if (seen.has(key)) return;
            const next = at(nx, ny);
            // A house is the goal, so reaching its tile counts even though it is the end of the walk.
            if (!walkable(next) && !next.isHouse) return;
            seen.add(key);
            if (!next.isHouse) queue.push(next);
        });
    }

    return board.filter(t => t.isHouse && !seen.has(`${t.x},${t.y}`)).map(t => `${t.x},${t.y}`);
};

/**
 * Picks one of the hand-authored maps for this sector (see `data/maps.ts` for why they are
 * authored rather than generated) and materialises it.
 */
export const generateBoard = (world: WorldType = 'GRASS', boss?: BossId): TileData[] => {
    // A named boss is fought on its own ground when that ground has been drawn — the arena is
    // where its mechanic becomes a mechanic rather than a stat line (see MapTemplate.arenaFor).
    const template = boss ? pickArena(boss, world) : pickTemplate(world);
    const board = materializeTemplate(template);

    const unreachable = findUnreachableHouses(board);
    if (unreachable.length > 0) {
        console.warn(`Map "${template.id}": zombies cannot reach house(s) at ${unreachable.join(' ')}.`);
    }

    return board;
};
