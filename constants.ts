
import { GameState, UnitClass } from './types';
export { ICONS } from './utils/icons';
export { UNIT_ROLE_MAP, UNIT_SKILLS, DEFAULT_UNIT_DEFINITIONS, DEFAULT_TERRAIN_DEFS, DEFAULT_ITEM_DEFINITIONS } from './data/gameData';
export { GENERATE_MAP, GENERATE_BREACH_MAP, generateBoard } from './utils/mapGenerator';

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
// Greenspire / deploy / spawn positions used to live here as column numbers, copied into three
// files that then drifted apart. They are now authored per map in `data/maps.ts` and read
// off the tile itself (`isHouse`, `isDeployZone`, `isSpawnZone`). One source of truth.

// --- RUN RULES (DESIGN.md sections 1, 7) ---
/**
 * Turns per battle. FIVE, the same as Into the Breach, and for the reason ITB picked it.
 *
 * It was 7. The reinforcement rule is `min(3 + turn/2, headroom)` against a live-enemy cap
 * of 8 (utils/turnManager.ts), and the opening wave is already 5 — so the board hits that
 * cap at the END OF TURN 1 and every turn after it only refills what the player killed.
 * The escalation term never gets to matter. Seven turns therefore bought six repetitions of
 * one unchanging board rather than a rising curve, and every scripted tutorial board
 * resolves in three or four turns without feeling cut short.
 */
export const BASE_MAX_TURNS = 5;            // per battle; events may shift it by +/- a turn
/**
 * A boss fight gets a longer clock than a defence, because it is asking a different question.
 *
 * Every other battle is "survive the timer", so the timer IS the win condition and five turns
 * is the whole design. A boss node asks "kill this thing", which makes the same five turns a
 * DAMAGE CHECK — and the arithmetic says the squad fails it. Three fully-fused heroes cap out
 * near 10 damage a turn (Cornova 4 + Peaburst 3 + both of Reedwing's wings 3+), so five turns buys 50, against
 * bosses at 16-26. That is fine for the nine acts and nowhere near enough for the last one.
 *
 * THE BREACH gets more again: the Blightlord is 36 health AND spends two turns untouchable
 * while it reforms between phases, so a five-turn clock leaves a perfect squad — never moving,
 * never missing, never losing anyone — finishing on 6 health remaining. Measured, not guessed.
 * Nine turns lands the kill on turn six and leaves three turns of slack for the walking, the
 * echoes and the mistakes that a real fight actually contains.
 *
 * The clock stays, though. Running out of it is still a defeat: a boss you could not finish is
 * a boss that won, and dropping the limit entirely would turn every boss into a war of
 * attrition the squad cannot lose while one hero is alive.
 */
export const BOSS_MAX_TURNS = 7;
export const BREACH_MAX_TURNS = 9;
export const BRAINS_MAX = 5;                // sprouts that may be lost across the whole run
export const SQUAD_SIZE = 3;
export const FUSION_SLOTS = 2;              // 2 while the material pool is 5; 3 once it reaches 7+
export const BENCH_CAPACITY = 2;

// --- SUN: in-combat action economy, resets every level (DESIGN.md section 4) ---
export const SUN_ON_LEVEL_START = 50;

/**
 * Sol paid to the player at the end of every turn, unconditionally.
 *
 * Kills stopped paying Sol (that let a shooter refund her own ultimate and spam it), which
 * left Sunbloom's Harvest as the only reliable income — one hero, spending her whole
 * action, in a squad of three. That made every hero skill feel unaffordable. A flat turn
 * stipend puts a floor under the economy without rewarding aggression the way kill-Sol did.
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
    // Clamped at 5. The doc above was written for a ten-layer run; a run is fifteen layers now
    // (three acts, utils/mapGenerator LAYERS_PER_ACT), and unclamped this reaches 8 — which is
    // MAX_LIVE_ENEMIES exactly, i.e. the cap silently stops existing for the last third of
    // every run. Five keeps the stagger meaningful at the deepest layers instead.
    Math.max(1, Math.min(5, Math.ceil(Math.max(1, depth) / 2)));

/**
 * Zombies that simply walk around, over or past a defensive line. A wall answers a Scrapcap;
 * nothing in the starting squad answers three Balloons at once, which is why these are the
 * ones on the depth-scaled budget rather than the merely tanky ones.
 *
 * Both spawners honour it: the opening wave (useGameProgression) and the per-turn
 * reinforcements (turnManager).
 */
export const ADVANCED_ZOMBIES: ReadonlySet<UnitClass> = new Set<UnitClass>([
    UnitClass.FLOATER,
    UnitClass.LOBBER,
    UnitClass.MINER,
    UnitClass.BANNERMAN,
]);
/**
 * A GRAVE digs up a zombie onto the nearest open neighbouring tile every this-many turns
 * (turnManager PHASE 4).
 *
 * TWO, because a battle is five turns. At three the grave dug exactly once — turn 6 never
 * arrives — and what climbed out was a 2 HP Basic, which is less than the three points of
 * damage the player had to spend clearing the headstone itself. The thing cost more to
 * answer than it threatened. At two it digs on turns 2 and 4: the first riser has three
 * turns to walk at a Greenspire, and ignoring the grave compounds instead of costing one body. Headstones used to be inert HP piles that KILL_ALL made the
 * player clean up out of duty; the clock is what turns "clear the grave" into a decision
 * with a deadline. Killing the grave before its turn cancels the spawn.
 */
export const GRAVE_DIG_PERIOD = 2;

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

/**
 * WHAT A RUN OPENS WITH, by the stage it is aimed at.
 *
 * A correction to something I got wrong out loud: I claimed a player who jumps straight to act
 * 3 from the campaign screen arrives poorer than one who walked there. They do not. Coin is
 * RUN-scoped — every run starts at this number and earns its own way — so there was never a
 * gap to compensate. What is true is that a stage III run is a harder run of the same length
 * for the same money, so the opening purse scales with the difficulty rather than with a
 * shortfall that does not exist.
 *
 * THE BREACH IS THE EXCEPTION. It has no shop node at all — its economy is the camp at the
 * door and the one after every boss (GENERATE_BREACH_MAP), all of them paid. The opening purse
 * is what kits the squad out before the first Gravehulk; after that the gauntlet funds itself
 * out of what the bosses drop. See COIN_BREACH_PURSE for the arithmetic.
 */
export const COIN_PER_STAGE = 75;
/**
 * 400 rather than the 800 this started at, because the Breach stopped being one purse spent up
 * front. It has a camp at the door AND after every boss, and every boss pays out
 * COIN_PER_LEVEL + COIN_BOSS_BONUS = 150 — about 1500 over the gauntlet. Against roughly 2400
 * of things worth buying across ten camps, 400 leaves the player able to afford most of what
 * they want and never all of it, which is the only setting at which a camp is a decision.
 */
export const COIN_BREACH_PURSE = 400;
/**
 * `base` is threaded rather than read so the Balance screen's live override of
 * COIN_ON_RUN_START still moves every stage together — a tuning dial that only affected
 * stage I would be worse than no dial.
 */
export const coinOnRunStart = (stage: 0 | 1 | 2 | 3, base: number = COIN_ON_RUN_START): number =>
    stage === 0 ? COIN_BREACH_PURSE : base + (stage - 1) * COIN_PER_STAGE;

// --- THE CAMP (a CAMPFIRE node) -------------------------------------------------------
// Every service here is priced against the same purse the shop draws on, which is the entire
// design: a camp used to be one free choice out of three, and a choice that costs nothing is
// answered by whichever box happens to be empty. Now reviving Peaburst is not free, it is
// two items, or a fusion, or most of a hero's patch-up.
//
// Priced PER POINT, not per hero. A flat fee would make patching a hero who lost 1 HP a waste
// and patching one on death's door a steal, and the player would learn to only ever do the
// second — which quietly removes the decision this is here to create.
export const COIN_HEAL_PER_HP = 15;
// A seedling is cheap to patch because the fusion it unlocks is not: an intact bench plant is
// the entry fee for a graft, so this is really the first instalment on COIN_FUSE.
export const COIN_REPAIR_SEEDLING = 25;
// A fusion is permanent, run-long and the strongest thing money buys here. It used to cost a
// bench plant and nothing else, which made "fuse at every campfire" the only sane line.
export const COIN_FUSE = 60;
/** Items on the camp's shelf. Fewer than a shop's: this is a field kit, not a market. */
export const CAMP_ITEM_OFFERS = 3;

// Buying a sprout back is meant to hurt: the first one costs three clean levels of income,
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
  targetBossId: null,
  bench: [],
  // Empty means every hero is in its base form — an element is opted into at squad select,
  // never a state a run drifts into.
  heroElements: {},
  shopRerolls: 0,
  shopOffers: [],
  shopItemOffers: null,
  hazard: null,
  mission: null,
};

// Initial board is now generated via function
import { generateBoard } from './utils/mapGenerator';
export const INITIAL_BOARD = generateBoard();
