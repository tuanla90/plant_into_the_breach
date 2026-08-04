
import { MapNode, WorldType, TileData, TerrainType } from '../types';
import { GRID_SIZE } from '../constants';
import { pickTemplate, materializeTemplate } from '../data/maps';

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
 */
const sectorForLayer = (layer: number): WorldType => {
    if (layer <= 3) return 'GRASS';
    if (layer <= 6) return 'DESERT';
    return 'VOLCANO';
};

// Slay the Spire style procedural generation
export const GENERATE_MAP = (): MapNode[] => {
    const nodes: MapNode[] = [];
    const layers = 10; // Reduced from 15 to 10
    
    // Generate nodes per layer logic
    // Layer 0: Start (1 node)
    // Layer 1-7: Random 2-4 nodes
    // Layer 8: Rest Site (1 node) -> Pre-Boss
    // Layer 9: Boss (1 node)
    const nodesPerLayer: number[] = [1];
    for (let i = 1; i < layers - 2; i++) {
        // Weighted random for width: mostly 2 or 3, rarely 4
        const rand = Math.random();
        if (rand > 0.9) nodesPerLayer.push(4);
        else if (rand > 0.4) nodesPerLayer.push(3);
        else nodesPerLayer.push(2);
    }
    // The pre-boss rest is ONE node, as the header comment always said it was. It was being
    // given a random 2-4 like any other layer, and since every node on it is forced to
    // CAMPFIRE that alone made rest sites about half of all the campfires on the map — while
    // the player still only ever steps on one of them. A single node also funnels every
    // branch back together before the boss, which is what a pre-boss rest is for.
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
                type = 'BOSS'; // End
            } else if (layer === layers - 2) {
                // FORCE REST SITE BEFORE BOSS (Layer 8)
                type = 'CAMPFIRE';
            } else {
                const rand = Math.random();
                // Hardcoded logic for pacing
                if (layer === 3) {
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
                world: sectorForLayer(layer), 
                status: layer === 0 ? 'AVAILABLE' : 'LOCKED',
                next: []
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
export const generateBoard = (world: WorldType = 'GRASS'): TileData[] => {
    const template = pickTemplate(world);
    const board = materializeTemplate(template);

    const unreachable = findUnreachableHouses(board);
    if (unreachable.length > 0) {
        console.warn(`Map "${template.id}": zombies cannot reach house(s) at ${unreachable.join(' ')}.`);
    }

    return board;
};
