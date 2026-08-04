import {
    MapNode, NextBattleMods, Position, TerrainDefinition, TileData, Unit, UnitClass, UnitDefinition,
} from '../types';
import { ADVANCED_ZOMBIES, advancedZombieCap, GRID_SIZE } from '../constants';
import { buildEnemy } from './unitFactory';

/**
 * THE OPENING WAVE.
 *
 * Which zombies a generated battle starts with, and where they stand. Pulled out of
 * setupCombat because it is the one part of that function that is a *design decision* rather
 * than bookkeeping — the enemy count floor, the elite multipliers, the roll table and the
 * advanced-zombie budget are all balance, and none of them were reachable without mounting
 * a React tree and starting a fight.
 *
 * Random by nature (it rolls classes and shuffles spawn tiles), so it is not a pure function
 * — but everything it reads is an argument, which is the part that matters.
 */

export interface EncounterPlan {
    enemies: Unit[];
    /** Where the player may deploy. Derived from the same board, so it is returned together. */
    deployTiles: Position[];
}

export const buildEncounter = (
    node: MapNode,
    board: TileData[],
    /** How deep this fight sits in the run. Gates the advanced-zombie budget. */
    depth: number,
    unitDefs: Record<UnitClass, UnitDefinition>,
    terrainDefs: Record<string, TerrainDefinition>,
    mods: NextBattleMods = {},
): EncounterPlan => {
    const enemies: Unit[] = [];
    // Benched units don't occupy board tiles, so occupancy starts empty.
    const occupiedKeys = new Set<string>();

    let enemyCount = 4;
    let hpMult = 1;
    let dmgAdd = 0;
    let advancedPlaced = 0;

    if (node.type === 'ELITE') { enemyCount = 6; hpMult = 1.5; dmgAdd = 1; }
    else if (node.type === 'BOSS') { enemyCount = 1; hpMult = 1; dmgAdd = 0; }

    // Event terms shift the opening wave. Floored at 1 so "fewer zombies" can never
    // hand the player an empty board.
    if (mods.enemies) enemyCount = Math.max(1, enemyCount + mods.enemies);

    // Spawn tiles are marked 'S' in the hand-authored map (data/maps.ts).
    const validSpawnTiles: Position[] = board
        .filter(t => t.isSpawnZone
            && terrainDefs[t.terrain]?.isWalkable
            && !occupiedKeys.has(`${t.x},${t.y}`))
        .map(t => ({ x: t.x, y: t.y }));
    validSpawnTiles.sort(() => Math.random() - 0.5);

    if (node.type === 'BOSS') {
        const spawnPos = validSpawnTiles[0] || { x: 4, y: GRID_SIZE - 1 };
        occupiedKeys.add(`${spawnPos.x},${spawnPos.y}`);
        enemies.push(buildEnemy(
            unitDefs[UnitClass.GARGANTUAR], UnitClass.GARGANTUAR, spawnPos,
            `boss_gargantuar_${Date.now()}`,
            { isMassive: true, intentText: 'Stomping...' },
        ));
        enemyCount = 2;
        validSpawnTiles.shift();
    } else {
        // Three heroes should never face fewer problems than they have actions — unless
        // the player bought a quieter opening at an event, which is the whole point of
        // that reward.
        const minEnemies = 5 + Math.min(0, mods.enemies || 0);
        if (enemyCount < minEnemies) enemyCount = minEnemies;
    }

    for (let i = 0; i < enemyCount; i++) {
        if (i >= validSpawnTiles.length) break;
        const spawnPos = validSpawnTiles[i];
        occupiedKeys.add(`${spawnPos.x},${spawnPos.y}`);

        const rand = Math.random();
        let selectedClass = UnitClass.BASIC_ZOMBIE;
        // One flier or one shell-lobber in the opening wave, so the player has to
        // solve something other than "hold the corridor" from turn 1.
        if (rand < 0.12) selectedClass = UnitClass.BALLOON_ZOMBIE;
        else if (rand < 0.24) selectedClass = UnitClass.CATAPULT_ZOMBIE;
        else if (rand < 0.34) selectedClass = UnitClass.BUCKETHEAD;
        else if (rand < 0.60) selectedClass = UnitClass.CONEHEAD;

        // Same depth budget the reinforcement spawner obeys (turnManager). Without it
        // the OPENING wave could hand an early layer three wall-ignoring zombies at
        // once, which is the least answerable board the game can produce.
        if (ADVANCED_ZOMBIES.has(selectedClass)) {
            if (advancedPlaced >= advancedZombieCap(depth)) {
                selectedClass = UnitClass.CONEHEAD;
            } else {
                advancedPlaced += 1;
            }
        }

        enemies.push(buildEnemy(
            unitDefs[selectedClass], selectedClass, spawnPos,
            `enemy_${Date.now()}_${i}`,
            { hpMult, dmgAdd },
        ));
    }

    // Deploy tiles are marked 'D' in the hand-authored map (data/maps.ts).
    const deployTiles: Position[] = board
        .filter(t => t.isDeployZone && terrainDefs[t.terrain]?.isWalkable)
        .map(t => ({ x: t.x, y: t.y }));

    return { enemies, deployTiles };
};

/**
 * Which layer of the map a node sits on. `MapNode` carries no layer index, but the generator
 * gives every node in a layer the same `y` and only jitters `x`, so the sorted set of distinct
 * `y` values is the layer list. 1-based: the starting node is layer 1.
 */
export const layerOfNode = (node: MapNode, nodes: MapNode[]): number => {
    const ys = Array.from(new Set(nodes.map(n => Math.round(n.y)))).sort((a, b) => a - b);
    const y = Math.round(node.y);
    let best = 0;
    let bestDist = Infinity;
    ys.forEach((v, i) => {
        const d = Math.abs(v - y);
        if (d < bestDist) { bestDist = d; best = i; }
    });
    return best + 1;
};

/**
 * Which event tiers may appear at a given map layer (the generator builds 10 of them, and
 * sectors already change at 3 and 6 — these are the same seams).
 *
 * Late layers deliberately DROP tier 1: a 40-Coin trinket offered on the run-up to the boss
 * is not a decision, it is filler. Early layers cap at tier 1 for the opposite reason —
 * before this, node 1 could roll the Treasure Yeti and hand out 200 Coin plus a brainless
 * house while the player still had three base plants and no fusions.
 */
export const tiersForLayer = (layer: number): number[] => {
    if (layer <= 3) return [1];
    if (layer <= 6) return [1, 2];
    return [2, 3];
};
