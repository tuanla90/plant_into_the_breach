
import { GameState, UnitClass } from './types';
export { ICONS } from './utils/icons';
export { UNIT_ROLE_MAP, UNIT_SKILLS, DEFAULT_UNIT_DEFINITIONS, DEFAULT_TERRAIN_DEFS, DEFAULT_ITEM_DEFINITIONS, PLAYER_ROSTER } from './data/gameData';
export { GENERATE_MAP, generateBoard } from './utils/mapGenerator';

export const GRID_SIZE = 8;

// Pseudo-2.5D: the whole board plane is tilted away from the camera by this many
// degrees (0 = flat top-down, like before). Unit sprites counter-rotate around their
// feet so they stand upright on the tilted ground, billboard-style. Tactical overlays
// (threat stripes, move dots, shadows) stay in the ground plane on purpose.
export const BOARD_TILT_DEG = 20;

// --- BOARD LAYOUT ---
// The battle axis is HORIZONTAL. `x` is the screen row, `y` is the screen column.
// Player side is the left (low y), zombies march in from the right (high y) — as in PvZ.
//
// House / deploy / spawn positions used to live here as column numbers, copied into three
// files that then drifted apart. They are now authored per map in `data/maps.ts` and read
// off the tile itself (`isHouse`, `isDeployZone`, `isSpawnZone`). One source of truth.

// --- RUN RULES (DESIGN.md sections 1, 7) ---
export const BASE_MAX_TURNS = 7;            // per battle; events may shift it by +/- a turn
export const BRAINS_MAX = 5;                // brains that may be lost across the whole run
export const SQUAD_SIZE = 3;
export const FUSION_SLOTS = 2;              // 2 while the material pool is 5; 3 once it reaches 7+
export const BENCH_CAPACITY = 2;

// --- SUN: in-combat action economy, resets every level (DESIGN.md section 4) ---
export const SUN_ON_LEVEL_START = 50;

/**
 * Sun paid to the player at the end of every turn, unconditionally.
 *
 * Kills stopped paying Sun (that let a shooter refund her own ultimate and spam it), which
 * left Sunspot's Harvest as the only reliable income — one hero, spending her whole
 * action, in a squad of three. That made every hero skill feel unaffordable. A flat turn
 * stipend puts a floor under the economy without rewarding aggression the way kill-Sun did.
 */
export const SUN_PER_TURN_INCOME = 25;

/**
 * How many "advanced" zombies may be alive at once, by map depth (1-based layer, 10 layers
 * per run). Balloon / Catapult / Digger ignore a melee wall entirely, so a board with three
 * of them at layer 1 is unanswerable with the starting squad. The cap does not remove them —
 * it staggers when the player has to solve more than one at a time.
 *
 * depth 1-2 -> 1, 3-4 -> 2, 5-6 -> 3, 7-8 -> 4, 9-10 -> 5.
 */
export const advancedZombieCap = (depth: number): number =>
    Math.max(1, Math.ceil(Math.max(1, depth) / 2));

/**
 * Zombies that simply walk around, over or past a defensive line. A wall answers a Conehead;
 * nothing in the starting squad answers three Balloons at once, which is why these are the
 * ones on the depth-scaled budget rather than the merely tanky ones.
 *
 * Both spawners honour it: the opening wave (useGameProgression) and the per-turn
 * reinforcements (turnManager).
 */
export const ADVANCED_ZOMBIES: ReadonlySet<UnitClass> = new Set<UnitClass>([
    UnitClass.BALLOON_ZOMBIE,
    UnitClass.CATAPULT_ZOMBIE,
    UnitClass.DIGGER_ZOMBIE,
    UnitClass.FLAG_ZOMBIE,
]);
/**
 * A GRAVE digs up a Basic Zombie onto the nearest open neighbouring tile every this-many
 * turns (turnManager PHASE 4). Headstones used to be inert HP piles that KILL_ALL made the
 * player clean up out of duty; the clock is what turns "clear the grave" into a decision
 * with a deadline. Killing the grave before its turn cancels the spawn.
 */
export const GRAVE_DIG_PERIOD = 3;

export const SUN_PER_KILL_BASIC = 10;       // basic zombies
export const SUN_PER_KILL_TOUGH = 15;       // armoured / elite zombies
export const SUN_TOUGH_HP_THRESHOLD = 4;    // maxHp at or above this counts as tough

// --- COIN: cross-level progression (DESIGN.md section 5) ---
// Was hardcoded inside App.handleStartGame, where nothing reasoning about the economy could
// see it — I mis-read the run's opening purse as 0 (INITIAL_GAME_STATE.coins) and sized the
// tutorial shop against the wrong number because of it.
export const COIN_ON_RUN_START = 150;
export const COIN_PER_LEVEL = 50;
export const COIN_NO_BRAIN_LOST = 25;
export const COIN_ELITE_BONUS = 25;
export const COIN_BOSS_BONUS = 100;
export const COIN_REVIVE_HERO = 75;
// Buying a brain back is meant to hurt: the first one costs three clean levels of income,
// and every one after that costs more. It is a way out of a bad run, not a strategy.
export const COIN_BRAIN_BASE = 150;
export const COIN_BRAIN_STEP = 75;
export const brainBuybackCost = (brainsBought: number) =>
    COIN_BRAIN_BASE + Math.max(0, brainsBought) * COIN_BRAIN_STEP;

// --- SHOP (DESIGN.md section 5) ---
export const SHOP_OFFER_COUNT = 3;
export const SHOP_REROLL_BASE_COST = 10;    // 10, then 20, 30 … reset on entering a new shop
export const SHOP_REROLL_STEP = 10;
export const shopRerollCost = (rerollsUsed: number) =>
    SHOP_REROLL_BASE_COST + rerollsUsed * SHOP_REROLL_STEP;

// --- ANIMATION CONFIG ---
export const ANIMATION_CONFIG = {
    MOVE_STEP_DURATION: 200, // ms per tile (Walking speed)
    PROJECTILE_SPEED: 50,    // ms per tile (Projectile speed)
    PROJECTILE_MIN_DURATION: 300,
    PROJECTILE_MAX_DURATION: 800,
    DEATH_DURATION: 500,
    SPAWN_DURATION: 600,
    SHAKE_DURATION: 500,
    ATTACK_LUNGE_DURATION: 150,
};

export const INITIAL_GAME_STATE: GameState = {
  sun: 0, // Hardcore economy
  coins: 0,
  diamonds: 0,
  requiredSun: 300, 
  turn: 1,
  maxTurns: BASE_MAX_TURNS,
  selectedUnitId: null,
  selectedTile: null, 
  screen: 'START_MENU', 
  currentLevelId: null,
  currentWorld: 'GRASS',
  depth: 1,
  interactionMode: 'IDLE',
  selectedSkillId: null,
  selectedItemId: null,
  spawnPoints: [], 
  enemySpawnQueue: [], 
  damageEvents: [],
  shake: false,
  showAdmin: false,
  inventory: [],
  debugMode: false,
  nextBattleMods: {},
  scriptedBattleId: null,
  tutorialStep: 0,
  seenEvents: [],
  brainsRemaining: BRAINS_MAX,
  brainsBought: 0,
  brainsMax: BRAINS_MAX,
  fallenHeroes: [],
  pendingRevives: [],
  bench: [],
  shopRerolls: 0,
  shopOffers: [],
  shopItemOffers: null,
  hazard: null,
  mission: null,
};

// Initial board is now generated via function
import { generateBoard } from './utils/mapGenerator';
export const INITIAL_BOARD = generateBoard();
