import {
    BossId, MapNode, NextBattleMods, Position, TerrainDefinition, TileData, Unit, UnitClass, UnitDefinition,
    UnitType,
} from '../types';
import { ADVANCED_ZOMBIES, advancedZombieCap, GRID_SIZE } from '../constants';
import { buildEnemy } from './unitFactory';
import { ELEMENT_WORLDS, rollEnemyElement } from './elements';
import { UNIT_ROLE_MAP } from '../data/roles';
import { bossClassFor, MASSIVE_BOSSES, BOSS_OPENING_INTENT, BOSS_ESCORTS, BOSS_INITIAL_STATE } from '../data/bosses';

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

/*
 * CÂY HOANG — QUAY LẠI theo quyết định 2026-08-06 (từng bị bỏ một nhịp trong đợt dọn cây).
 * Một phần tư số trận mở màn với một mầm ngủ (DORMANT) đâu đó trên bàn; đi hero tới cạnh
 * là nó tỉnh và đánh giúp hết trận (luật tỉnh giấc nằm ở turnManager, cuối lượt địch).
 *
 * Pool giờ là CHÍN thân cây material của hero — đúng triết lý gốc của tính năng: bất ngờ
 * nằm ở VỊ TRÍ, không phải ở danh tính ("the surprise is WHERE it is, not what it is"),
 * và một thân quen mọc dại vẫn là một body miễn phí phải đi bộ tới mới nhận được.
 * Cây tỉnh dậy KHÔNG di chuyển được (moveRange 0): nó là tháp pháo cắm đất, không phải
 * thành viên squad — isBattleOnlyUnit giữ nó khỏi roster sau trận.
 */
const WILD_POOL: UnitClass[] = [
    UnitClass.SEED_GUN, UnitClass.SOL_BATTERY, UnitClass.STEEL_JAWS,
    UnitClass.ARMOR_PLATE, UnitClass.CORN_MORTAR, UnitClass.ROTOR_WING,
    UnitClass.SPIKE_ARMOR, UnitClass.SPRING_ARM, UnitClass.BUNKER_SHELL,
];
const WILD_ALLY_CHANCE = 0.25;

export interface EncounterPlan {
    enemies: Unit[];
    /**
     * Units that start on the PLAYER's side without being part of the squad — the wild plant
     * above, and nothing else yet. Returned separately from `enemies` because the caller has
     * to put them through a different door: they are not rolled against the wave budget, they
     * do not count as pressure, and they must not be struck off the bench ledger.
     */
    allies: Unit[];
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
    /**
     * Which boss this node is. Resolved by the caller because the node does not always name
     * one — an un-named BOSS node is "whichever boss the campaign owes you next", and that
     * answer lives with the unlock state, not here.
     */
    boss?: BossId,
): EncounterPlan => {
    const enemies: Unit[] = [];
    const allies: Unit[] = [];
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
        // Body, rules flag and telegraph all come from data/bosses.ts. A boss with no entry
        // there falls back to a Gravehulk, so an id can be added to the roadmap before its
        // unit exists without breaking the run it lands in.
        const bossClass = bossClassFor(boss);
        enemies.push({
            ...buildEnemy(
                unitDefs[bossClass], bossClass, spawnPos,
                `boss_${(boss ?? 'GRAVEHULK').toLowerCase()}_${Date.now()}`,
                {
                    isMassive: !boss || MASSIVE_BOSSES.has(boss),
                    bossId: boss ?? 'GRAVEHULK',
                    intentText: (boss && BOSS_OPENING_INTENT[boss]) || 'Stomping...',
                },
            ),
            // Opening state the class sheet cannot carry — the Armada's gas cells. Spread here
            // rather than taught to buildEnemy: this is the one place boss identity is
            // assembled, and the factory has no business knowing who is in the roster.
            ...(boss ? BOSS_INITIAL_STATE[boss] : undefined),
        });
        // Escort count is a property of the BOSS, not a constant — it was only ever a constant
        // because there was one boss. Table and reasoning live in data/bosses.ts.
        enemyCount = BOSS_ESCORTS[boss ?? 'GRAVEHULK'] ?? 2;
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
        let selectedClass = UnitClass.WALKER;
        // One flier or one shell-lobber in the opening wave, so the player has to
        // solve something other than "hold the corridor" from turn 1.
        if (rand < 0.12) selectedClass = UnitClass.FLOATER;
        else if (rand < 0.24) selectedClass = UnitClass.LOBBER;
        else if (rand < 0.34) selectedClass = UnitClass.POTHELM;
        else if (rand < 0.60) selectedClass = UnitClass.SCRAPCAP;

        // Same depth budget the reinforcement spawner obeys (turnManager). Without it
        // the OPENING wave could hand an early layer three wall-ignoring zombies at
        // once, which is the least answerable board the game can produce.
        if (ADVANCED_ZOMBIES.has(selectedClass)) {
            if (advancedPlaced >= advancedZombieCap(depth)) {
                selectedClass = UnitClass.SCRAPCAP;
            } else {
                advancedPlaced += 1;
            }
        }

        const zombie = buildEnemy(
            unitDefs[selectedClass], selectedClass, spawnPos,
            `enemy_${Date.now()}_${i}`,
            { hpMult, dmgAdd },
        );
        // The blighted horde (utils/elements.ts): in the Stage III city the wave itself can
        // carry ICE/FIRE/LIGHTNING, by the heroes' own rules. Rolled here for the opening
        // wave and in turnManager PHASE 1 for reinforcements — the same two doors every
        // zombie already enters the board through. Boss escorts pass through this loop too,
        // which is intended: a blighted court around an unblighted king.
        if (ELEMENT_WORLDS.has(node.world)) {
            const rolled = rollEnemyElement(zombie.damage);
            if (rolled) zombie.element = rolled;
        }
        enemies.push(zombie);
    }

    // Deploy tiles are marked 'D' in the hand-authored map (data/maps.ts).
    const deployTiles: Position[] = board
        .filter(t => t.isDeployZone && terrainDefs[t.terrain]?.isWalkable)
        .map(t => ({ x: t.x, y: t.y }));

    /**
     * THE WILD ALLY. Rolled last, so it can see every tile the wave has already taken.
     *
     * Never on a deploy tile (it would be standing in your placement screen), never on a spawn
     * hole (it would be a free plug), and never on a doorstep — a free body one tile from the
     * Greenspire it is defending is not a discovery, it is a gift, and this is supposed to be
     * worth walking to.
     *
     * DORMANT is the sleep. It is an existing status that already means "cannot act, and
     * nothing clears it on its own" (types.ts), which is exactly right: the only thing that
     * wakes this plant is a hero standing next to it, and that rule lives in turnManager.
     */
    if (node.type !== 'BOSS' && Math.random() < WILD_ALLY_CHANCE) {
        const spots = board.filter(t =>
            !t.isHouse && !t.isDeployZone && !t.isSpawnZone
            && terrainDefs[t.terrain]?.isWalkable
            && t.terrain !== 'LAVA'
            && t.y >= 2 && t.y <= 4
            && !occupiedKeys.has(`${t.x},${t.y}`)
            && !board.some(h => h.isHouse && Math.abs(h.x - t.x) + Math.abs(h.y - t.y) <= 1));
        const spot = spots[Math.floor(Math.random() * spots.length)];
        if (spot) {
            const cls = WILD_POOL[Math.floor(Math.random() * WILD_POOL.length)];
            const def = unitDefs[cls];
            if (def) {
                occupiedKeys.add(`${spot.x},${spot.y}`);
                allies.push({
                    id: `wild_${cls}_${spot.x}_${spot.y}`,
                    type: UnitType.PLANT, class: cls, role: UNIT_ROLE_MAP[cls] ?? 'TACTICAL',
                    hp: def.maxHp, maxHp: def.maxHp, damage: def.damage, moveRange: 0,
                    cooldownReduction: 0, level: 1, position: { x: spot.x, y: spot.y },
                    isEnemy: false, hasMoved: false, hasAttacked: false,
                    statusEffects: ['DORMANT'],
                    movementType: def.movementType, immunities: def.immunities, imgUrl: def.imgUrl,
                    attackRange: def.attackRange ?? 1,
                    isWild: true,
                } as Unit);
            }
        }
    }

    return { enemies, allies, deployTiles };
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
 * Greenspire while the player still had three base plants and no fusions.
 */
export const tiersForLayer = (layer: number): number[] => {
    if (layer <= 3) return [1];
    if (layer <= 6) return [1, 2];
    return [2, 3];
};
