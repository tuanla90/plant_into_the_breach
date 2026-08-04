export enum UnitType {
  PLANT = 'PLANT',
  ZOMBIE = 'ZOMBIE',
  OBSTACLE = 'OBSTACLE',
}

export enum UnitClass {
  PEASHOOTER = 'PEASHOOTER',
  SNOW_PEA = 'SNOW_PEA', 
  REPEATER = 'REPEATER', 
  BLOOMERANG = 'BLOOMERANG',
  CACTUS = 'CACTUS', 
  MELON_PULT = 'MELON_PULT', 
  CABBAGE_PULT = 'CABBAGE_PULT', 
  KERNEL_PULT = 'KERNEL_PULT', 
  MAGNET_SHROOM = 'MAGNET_SHROOM',
  SUN_SHROOM = 'SUN_SHROOM', 
  SCAREDY_SHROOM = 'SCAREDY_SHROOM',
  WALLNUT = 'WALLNUT',
  TALL_NUT = 'TALL_NUT', 
  ENDURIAN = 'ENDURIAN', 
  SWEET_POTATO = 'SWEET_POTATO', 
  IRON_NUT = 'IRON_NUT', 
  PUMPKIN = 'PUMPKIN', 
  CHOMPER = 'CHOMPER',
  BONK_CHOY = 'BONK_CHOY',
  SUNFLOWER = 'SUNFLOWER',
  TWIN_SUNFLOWER = 'TWIN_SUNFLOWER',
  // NEW UNITS
  COFFEE_BEAN = 'COFFEE_BEAN',
  HYPNO_SHROOM = 'HYPNO_SHROOM',
  BLOVER = 'BLOVER',
  UMBRELLA_LEAF = 'UMBRELLA_LEAF',
  TORCHWOOD = 'TORCHWOOD',
  
  BASIC_ZOMBIE = 'BASIC_ZOMBIE',
  CONEHEAD = 'CONEHEAD',
  BUCKETHEAD = 'BUCKETHEAD',
  NEWSPAPER_ZOMBIE = 'NEWSPAPER_ZOMBIE', 
  SCREEN_DOOR_ZOMBIE = 'SCREEN_DOOR_ZOMBIE', 
  DIGGER_ZOMBIE = 'DIGGER_ZOMBIE', 
  FOOTBALL_ZOMBIE = 'FOOTBALL_ZOMBIE',
  POLE_VAULTER = 'POLE_VAULTER', 
  DISCO_ZOMBIE = 'DISCO_ZOMBIE',
  BALLOON_ZOMBIE = 'BALLOON_ZOMBIE',
  CATAPULT_ZOMBIE = 'CATAPULT_ZOMBIE',
  FLAG_ZOMBIE = 'FLAG_ZOMBIE', 
  GARGANTUAR = 'GARGANTUAR',
  IMP = 'IMP',
  ROCK = 'ROCK',
  GRAVE = 'GRAVE',
}

export type UnitRole = 'MELEE' | 'SHOOTER' | 'SUPPORT' | 'TACTICAL' | 'ENEMY';
export type WorldType = 'GRASS' | 'ICE' | 'VOLCANO' | 'DESERT';
export type StatusEffectType = 'BURN' | 'FREEZE' | 'STUN' | 'HYPNOTIZED' | 'ENRAGED'
    /** Halves movement for a turn. Weaker than STUN, which removes the turn entirely. */
    | 'SLOW'
    /**
     * Cannot act at all, and never recovers on its own. Unlike STUN (one turn) and FREEZE
     * (until hit), nothing clears this — it is set by scripted content for a unit the player
     * has to protect rather than command.
     */
    | 'DORMANT';
export type MovementType = 'WALKING' | 'FLYING' | 'AMPHIBIOUS' | 'TELEPORT';
/**
 * NOTE: 'FREEZE' covers STUN/FREEZE only — it does NOT stop SLOW. Something too heavy to
 * freeze solid can still be chilled into moving slower, and having one immunity blank both
 * meant the Gargantuar (PUSH + FREEZE immune, Massive) shut off every control tool in the
 * game at once. 'STATUS' is the one that stops everything — that is what it is for.
 */
export type UnitImmunity = 'BURN' | 'FREEZE' | 'DROWN' | 'PUSH' | 'STATUS';

export interface Position {
    x: number;
    y: number;
}

export type TerrainType = 'GRASS' | 'WATER' | 'CONCRETE' | 'LAVA' | 'ICE' | 'SAND' | 'MOUNTAIN' | 'NONE'
    /** Hard blocker used by hand-authored maps to carve choke points. */
    | 'WALL'
    /** Walkable crossing over a water lane. */
    | 'BRIDGE'
    /** Wild West minecart track. Terrain today, conveyor behaviour later. */
    | 'RAIL';
export type EnvironmentType = 'NONE' | 'POWER_TILE' | 'SMOKE' | 'FIRE';

export interface TileData {
    x: number;
    y: number;
    terrain: TerrainType;
    environment: EnvironmentType;
    /** House tiles occupy column y === HOUSE_COLUMN. Zombies path toward them. */
    isHouse?: boolean;
    /** A house still holding its brain. Cleared when a zombie reaches it. */
    hasBrain?: boolean;
    /**
     * Deploy and spawn zones come from the hand-authored map, not from column constants.
     * They used to be hardcoded in three separate places that drifted out of sync.
     */
    isDeployZone?: boolean;
    isSpawnZone?: boolean;
    /**
     * An armed trap waiting on this tile (Potato Mine). Placed by an item, consumed by the
     * first grounded enemy that steps here — walking, being pushed, or being spawned onto
     * it all count, because they all move through the same UNIT_MOVE/spawn paths.
     */
    trap?: { damage: number; imgUrl: string };
}

export interface Unit {
  id: string;
  type: UnitType;
  class: UnitClass;
  role?: UnitRole;
  hp: number;
  maxHp: number;
  damage: number;
  moveRange: number;
  cooldownReduction?: number;
  level: number;
  position: Position;
  isEnemy: boolean;
  hasMoved: boolean;
  hasAttacked: boolean;
  statusEffects: StatusEffectType[];
  movementType: MovementType;
  immunities: UnitImmunity[];
  imgUrl: string;
  intent?: Intent;
  spawnDelay?: number;
  digestingTurns?: number;
  isBurrowed?: boolean;
  shield?: number;
  sunCharge?: number;
  prevPosition?: Position;
  visualOffset?: { x: number, y: number };
  isDying?: boolean;
  isAttacking?: boolean;
  isMassive?: boolean;
  /** Tiles this unit can strike from. 1 = melee (the default for everything that omits it). */
  attackRange?: number;
  /** True for the 3 squad heroes. Only heroes carry a hero skill and accept fusions. */
  isHero?: boolean;
  heroId?: HeroId;
  /** Materials fused into this hero, in the order they were applied. */
  fusions?: MaterialId[];
  /** Set on a bench plant deployed to fill a fallen hero's slot. */
  materialId?: MaterialId;
}

export interface Intent {
    type: 'ATTACK' | 'MOVE' | 'SPAWN' | 'WAIT';
    target?: Position;
    damage?: number;
    description?: string;
    /** Where this unit intends to walk next turn. Drives the movement telegraph. */
    moveTo?: Position;
    /** Path it will take to `moveTo`, for drawing the route. */
    movePath?: Position[];
}

export interface DamageEvent {
    id: string;
    x: number;
    y: number;
    amount: number;
    /**
     * DROWN is its own type rather than reusing BLOCKED. Being shoved into open water is a
     * kill, not a bump into a wall — sharing the type gave it the wall sound, the wall
     * burst and the word "BLOCKED" over a unit that had just died.
     */
    type: 'DAMAGE' | 'HEAL' | 'BLOCK' | 'MISS' | 'SUN' | 'COIN' | 'DIAMOND' | 'BUFF' | 'EMERGE' | 'IMMUNE' | 'BURN' | 'BLOCKED' | 'DROWN';
}

/**
 * A one-shot piece of combat feedback drawn over the board: the burst on a hit, the arc of
 * a swing, the dirt kicked up by a zombie climbing out. Purely cosmetic — nothing reads
 * these back, and dropping one changes no game state.
 *
 * The engine spawns them and removes them on a timer, so they carry their own duration
 * rather than each having a hardcoded one in CSS.
 */
export interface VisualEffect {
    id: string;
    /** Grid coordinates, same convention as Unit.position: x = row, y = column. */
    x: number;
    y: number;
    type: 'IMPACT' | 'EXPLOSION' | 'SLASH' | 'MUZZLE' | 'PUSH' | 'EMERGE' | 'DROWN';
    /** Degrees, 0 = pointing right. Only the directional types use it. */
    rotation?: number;
    /** ms. Already scaled by the fast-forward multiplier when it reaches the renderer. */
    duration: number;
}

export interface Projectile {
    id: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    rotation: number;
    type: 'PEA' | 'FROZEN_PEA' | 'CORN' | 'CABBAGE' | 'MELON';
    isLobbed?: boolean;
    duration?: number;
}

export interface GameState {
    sun: number;
    coins: number;
    diamonds: number;
    requiredSun: number;
    turn: number;
    maxTurns: number;
    selectedUnitId: string | null;
    selectedTile: Position | null;
    screen: 'START_MENU' | 'SQUAD_SELECT' | 'MAP' | 'COMBAT' | 'SHOP' | 'GAME_OVER' | 'VICTORY' | 'TUTORIAL' | 'EVENT';
    currentLevelId: string | null;
    currentWorld: WorldType;
    /** Map layer of the battle in progress, 1-based. Scales how many advanced zombies spawn. */
    depth: number;
    interactionMode: 'IDLE' | 'TARGETING' | 'ITEM_TARGETING' | 'MOVING' | 'EXECUTING' | 'PLACEMENT';
    selectedSkillId: string | null;
    selectedItemId: string | null;
    spawnPoints: Position[];
    enemySpawnQueue: Position[];
    damageEvents: DamageEvent[];
    shake: boolean;
    showAdmin: boolean;
    /** Dev travel mode: every map node is enterable and the layer gating is bypassed. */
    debugMode: boolean;
    inventory: string[];
    currentEventId?: string;
    // --- Run-scoped progress (see DESIGN.md sections 1 and 2) ---
    /** Brains left for the whole run. Reaching 0 ends the run. */
    brainsRemaining: number;
    brainsMax: number;
    /** Brains bought back this run. Drives the escalating buy-back price. */
    brainsBought: number;
    /** Heroes knocked out, waiting to be revived at a Campfire or chapter end. */
    fallenHeroes: HeroId[];
    /**
     * Heroes paid for at a revive and waiting for the next battle to rebuild their body.
     *
     * In GameState, not a ref, because GameState is what survives a reload. As a ref this
     * was a hole with real money in it: reviving clears `fallenHeroes`, so after an F5 the
     * hero was in no list at all — not on the field, not fallen, not queued. She simply
     * stopped existing, and the 75 Coin with her.
     */
    pendingRevives: HeroId[];
    /** Base plants bought but not yet fused or deployed. */
    bench: BenchPlant[];
    /** Rerolls already bought at the current shop; resets on entering a new shop. */
    shopRerolls: number;
    /** Material ids currently offered by the shop. */
    shopOffers: MaterialId[];
    /**
     * Item ids the shop may sell, or null for the whole catalogue.
     *
     * Only the tutorial sets it. Its shop used to show all six consumables — 350 Coin of
     * them — against a purse that also has to cover the revive two nodes later, so a player
     * doing nothing unreasonable could arrive at the revive unable to pay for it and lose
     * the hero the rest of the chain is built around.
     */
    shopItemOffers: string[] | null;
    /** Terms an event imposed on the next battle. Cleared once that battle starts. */
    nextBattleMods: NextBattleMods;
    /**
     * Id of the scripted tutorial battle currently being played, or null for a normal fight.
     * turnManager reads it to replace the random reinforcement roll with the script's table.
     */
    scriptedBattleId: string | null;
    /** Index of the tutorial coach step the player is on. -1 once the tutorial is over. */
    tutorialStep: number;
    /** Event ids already seen this run, so an EVENT node never repeats one. */
    seenEvents: string[];
    /** Sector hazard queued to fire at the start of the next turn. Null when the sector has none. */
    hazard: HazardTelegraph | null;
    /** What this battle is actually asking of the player. Null outside combat. */
    mission: Mission | null;
}

export interface TurnAction {
    type: 'WAIT' | 'UNIT_MOVE' | 'UNIT_ATTACK' | 'APPLY_DAMAGE' | 'UNIT_DIE' | 'SPAWN_UNIT' | 'UPDATE_INTENT' | 'UPDATE_UNIT_STATE' | 'NEW_TURN_RESET' | 'MODIFY_TERRAIN' | 'RESOURCE_GAIN'
        /** A zombie reached a house: clear that house's brain and remove the zombie. */
        | 'BRAIN_LOST'
        /** In-combat Sun income (zombie kills, passive generators). */
        | 'GAIN_SUN';
    unitId?: string;
    targetId?: string;
    targetPos?: Position;
    path?: Position[];
    duration?: number;
    amount?: number;
    eventType?: DamageEvent['type'];
    pos?: Position;
    unit?: Unit;
    intent?: Intent;
    updates?: Partial<Unit>;
    environment?: EnvironmentType;
    terrain?: TerrainType;
    isForced?: boolean;
    resource?: 'SUN';
    /** How the attack should be animated. Lets the engine stay ignorant of unit classes. */
    attackRange?: SkillRangeType;
}

// ---------------------------------------------------------------------------
// HEROES, FUSION MATERIALS, RUN STATE  (see DESIGN.md sections 2, 6, 7)
// ---------------------------------------------------------------------------

/** The 5 heroes shipped in the first build. More unlock later — DESIGN.md section 7. */
export type HeroId =
    | 'GREEN_SHADOW'
    | 'WALL_KNIGHT'
    | 'SOLAR_FLARE'
    | 'CHOMPZILLA'
    | 'COLD_SNAP'
    /**
     * Cobb, the Kernel-pult. The only hero whose attacks ARC: every other attack in the game
     * is a straight line that stops at the first body in the way, including your own wall
     * (see getValidTargets' LINE branch). Unlocked from the third boss.
     */
    | 'KERNEL_PULT';

/** The 5 fusion materials shipped in the first build. */
/**
 * The materials are the same five plants the heroes are built from — the fusion matrix
 * is 5 heroes x 5 materials, and each pairing is authored by hand.
 */
export type MaterialId =
    | 'MAT_SUNFLOWER'
    | 'MAT_PEASHOOTER'
    | 'MAT_CHOMPER'
    | 'MAT_WALLNUT'
    | 'MAT_SNOW_PEA'
    /** Cobb's own plant. Grafts the arc onto somebody else's straight shot. */
    | 'MAT_CORN';

export type FusionEffectType =
    | 'BONUS_HP'                // +maxHp
    | 'SUN_PER_TURN'            // passive Sun income each turn
    | 'SUN_ON_KILL'             // Sun when this unit finishes something off
    | 'DAMAGE_REDUCTION'        // flat reduction on incoming damage
    | 'ON_HIT_PUSH'             // attacks push the target 1 tile
    | 'ON_HIT_FREEZE'           // attacks apply STUN
    | 'ON_HIT_BURN'             // attacks apply BURN
    /**
     * The basic attack resolves a SECOND time, for `value` damage rather than for its full
     * amount. It began as a plain flag meaning "resolves twice", which on Shadeleaf doubled
     * a free, full-lane attack from 2 to 4 with no cost and no drawback — strictly better
     * than every other fusion in her row, and the first one every player owned.
     */
    | 'DOUBLE_ATTACK'
    | 'GRANT_ATTACK'            // gives a ranged basic attack to a hero that had none
    | 'SKILL_DISCOUNT'          // hero skill costs less Sun
    | 'DIGEST_REDUCTION'        // Maw digests for fewer turns
    | 'ARMOR_WHILE_DIGESTING'   // immune while digesting
    | 'RETALIATE_BURN'          // melee attackers catch fire
    | 'RETALIATE_FREEZE'        // melee attackers are frozen solid
    | 'ATTACK_RANGE_BONUS'      // extends the reach of this hero's attacks
    | 'BONUS_DAMAGE'            // flat damage added to this hero's attacks
    | 'SUN_ON_BLOCK_SPAWN'      // Sun for standing on a spawn hole and plugging it
    | 'UPGRADE_SLOW_TO_FREEZE'  // this hero's SLOW becomes a full STUN
    | 'RETALIATE_DAMAGE'        // melee attackers take damage back
    | 'SWALLOW_EXPLODE'         // devouring detonates, burning neighbours
    | 'FIRE_SPREAD'             // fire tiles spread to neighbours
    | 'MELEE_REACH_TRADE'       // melee attack reaches further, but loses its push
    /**
     * A straight shot becomes a lobbed one: it arcs over everything in between, at half the
     * reach. Both halves matter. A LINE attack stops at the first unit in the way — including
     * a friendly wall — which is the friction the brain rule creates every fight: you park
     * Ironhusk in the corridor and she blindfolds whoever is standing behind her. LOB ignores
     * what is in between entirely, but its range is Manhattan distance in every direction, so
     * keeping the number would turn Shadeleaf's LINE 8 into most of the board.
     * Piercing skills are left alone — see applyFusionToSkill.
     */
    | 'ARC_ATTACK'
    /**
     * The hero's PAID skill also strikes the four tiles around its target. Deliberately not
     * the basic attack: free splash every turn is a different, much stronger game.
     */
    | 'SKILL_SPLASH'
    | 'STEADFAST'               // -1 incoming damage, immune to collision damage, plugs spawn holes painlessly
    | 'ON_HIT_SLOW';            // attacks apply SLOW

export interface FusionEffect {
    type: FusionEffectType;
    value?: number;
}

export interface HeroDefinition {
    id: HeroId;
    name: string;
    /** Existing plant class used for the sprite and the fallback identity. */
    baseClass: UnitClass;
    maxHp: number;
    damage: number;
    moveRange: number;
    imgUrl: string;
    /** Transparent-background sprite used for the unit on the board. Falls back to imgUrl (the hero card). */
    boardImgUrl?: string;
    movementType: MovementType;
    immunities: UnitImmunity[];
    /** Always free — guarantees a hero can act with 0 Sun. */
    basicAttack: Skill;
    /** Costs Sun via Skill.sunCost. */
    heroSkill: Skill;
}

export interface MaterialDefinition {
    id: MaterialId;
    name: string;
    description: string;
    /** Price in Coin. Mirrors the PvZ sun scale already used by UnitDefinition.cost. */
    coinCost: number;
    imgUrl: string;
    /** What the hero gains when this material is fused in. */
    effect: FusionEffect;
    /** Stats used when this plant is deployed from the bench instead of being fused. */
    benchStats: { maxHp: number; damage: number; moveRange: number };
    benchClass: UnitClass;
}

/** A purchased base plant sitting on the bench, not yet spent. */
export interface BenchPlant {
    id: string;
    materialId: MaterialId;
    /**
     * Health carried between battles. Undefined = never deployed, still at full.
     *
     * A bench plant is a seedling, not a hero: every battle it is sent into costs it a
     * permanent point of health (it is not grown yet, and the air out there is filthy).
     * Fusion needs an intact plant, so this doubles as the clock on the backup-or-fuse
     * decision — and because healing writes it back up, the clock can always be rewound.
     * Floors at 1: attrition makes a plant fragile, it never deletes one behind the
     * player's back. Only dying on the field removes it from the bench.
     */
    hp?: number;
}

/**
 * Mission objectives, borrowed from Into the Breach. Every battle lasts the same number of
 * turns, but *what you must achieve* in them differs — that is what stops each node from
 * being the same fight. Bonus objectives pay extra Coin and are optional by design: they
 * ask the player to take a risk they could refuse.
 */
export type ObjectiveType =
    /** Just live through it. The baseline. */
    | 'SURVIVE_TURNS'
    /** One specific house is marked; losing its brain fails the mission outright. */
    | 'PROTECT_HOUSE'
    /** Clear every zombie off the board. Ends the moment the board is empty. */
    | 'KILL_ALL'
    /** Stand on the marked spawn tiles when the clock runs out. */
    | 'BLOCK_SPAWNS'
    /** Hold one specific tile at the end. */
    | 'HOLD_TILE';

export type BonusType = 'NO_BRAIN_LOST' | 'NO_HERO_DOWN' | 'KILL_COUNT';

export interface MissionBonus {
    type: BonusType;
    description: string;
    coins: number;
    /** Threshold for KILL_COUNT. */
    count?: number;
}

export interface Mission {
    objective: ObjectiveType;
    description: string;
    /** PROTECT_HOUSE / HOLD_TILE marker. */
    target?: Position;
    /** BLOCK_SPAWNS markers. */
    targets?: Position[];
    bonuses: MissionBonus[];
    // --- runtime tracking ---
    zombiesKilled: number;
    /** Set when the objective becomes impossible — the level ends in defeat. */
    failed: boolean;
}

/**
 * Sector hazards (DESIGN.md — environment per sector). Into the Breach gives every island
 * its own environmental threat, and critically it is telegraphed a turn ahead exactly like
 * an enemy intent. A hazard the player cannot see coming would break the perfect-information
 * promise the whole design rests on.
 */
export type HazardType = 'NONE' | 'WIND_GUST' | 'LAVA_FLOW' | 'RAIL_SLIDE';

export interface HazardTelegraph {
    type: HazardType;
    /** Tiles it will act on when it fires next turn. */
    tiles: Position[];
    /** Shown to the player while it is pending. */
    description: string;
    /** Direction for directional hazards (wind, rails). */
    dx?: number;
    dy?: number;
}

/** Progress that persists across every level of a single run. */
export interface RunState {
    brainsRemaining: number;
    brainsMax: number;
    /** Hero ids knocked out and awaiting revival. */
    fallenHeroes: HeroId[];
    bench: BenchPlant[];
}

/** Progress that persists across runs. Stored separately from Admin config. */
export interface UnlockState {
    heroes: HeroId[];
    materials: MaterialId[];
    deepestChapter: number;
    runsWon: number;
    /**
     * Bosses beaten across the whole save. Drives hero unlocks (data/unlocks.ts) and is
     * separate from `runsWon` on purpose: a run can end at a boss without being the run that
     * wins the campaign, and later chapters will have several bosses per run.
     */
    bossesDefeated: number;
    /**
     * Running total of bonus objectives completed, ever. Kept for stats; the payout is driven
     * by `bonusObjectivesBanked` below.
     */
    bonusObjectivesDone: number;
    /**
     * Objectives taken but not yet cashed in. They convert to fusion recipes at the END OF A
     * RUN, not at the end of each fight: a mid-run unlock changes the tools under a player
     * who is halfway through a plan, and it makes finishing a run feel like less of an event
     * than clearing an ordinary node. The remainder carries into the next run, so nothing an
     * objective earned is ever thrown away.
     */
    bonusObjectivesBanked: number;
    /**
     * Fusion pairings learned, as `HERO:MATERIAL` keys (data/unlocks.ts `recipeKey`).
     * Materials themselves are all available from the start; the twenty-five *combinations*
     * are the progression, because that is where the authored depth lives.
     */
    recipes: string[];
    /** Set once the player finishes or skips the scripted opening chain. */
    tutorialDone?: boolean;
}

export interface UnitDefinition {
    class: UnitClass;
    name: string;
    maxHp: number;
    damage: number;
    moveRange: number;
    /** Reach of its attack. Omitted means 1 — melee. */
    attackRange?: number;
    imgUrl: string;
    movementType: MovementType;
    immunities: UnitImmunity[];
    cost: number; // For Squad Selection
    maxStats: { hp: number; dmg: number; move: number; cdr: number };
    upgradeCosts: { hp: number; dmg: number; move: number; cdr: number };
    evolvesTo?: UnitClass[];
    evolutionCost?: number;
}

export type SkillRangeType = 'LINE' | 'LOB' | 'MELEE' | 'ADJACENT' | 'SELF' | 'DASH' | 'RADIUS';
export type EffectType = 'DAMAGE' | 'HEAL' | 'SHIELD' | 'STUN' | 'PUSH' | 'PULL' | 'SPAWN' | 'TERRAIN_MOD' | 'PIERCE_ATTACK' | 'GLOBAL_PUSH' | 'CHARGE_SUN' | 'RESOURCE_GAIN' | 'REFRESH_ACTION' | 'HYPNOTIZE' | 'BUFF_STAT' |
                         /** Sets the target on fire. */
                         'APPLY_BURN' |
                         /** Halves the target's movement for a turn. Frostpod's baseline. */
                         'APPLY_SLOW' |
                         // EVENT EFFECTS
                         // NOTE: GAIN_SUN / HEAL_SQUAD / HEAL_ONE_FULL / LOSE_HP_RANDOM / GAIN_STATS are
                         // retired. Sun still resets to SUN_ON_LEVEL_START every battle. Hero hp used to
                         // reset the same way, but now PERSISTS between battles (buildHeroFromSnapshot
                         // keeps the snapshot's hp) — which is why HEAL_SQUAD_FULL below is back.
                         // Events trade in things that survive: Coin, brains, bench plants, items,
                         // heroes, hp, next-battle terms.
                         'GAIN_ITEM' | 'NOTHING' |
                         'GAIN_COIN' | 'LOSE_COIN' |
                         'GAIN_BRAIN' | 'LOSE_BRAIN' |
                         'GAIN_BENCH_PLANT' | 'LOSE_BENCH_PLANT' |
                         /** Changes the terms of the very next battle, then clears itself. */
                         'NEXT_BATTLE_MOD' |
                         // Campfire: bring a knocked-out hero back for COIN_REVIVE_HERO.
                         'REVIVE_HERO' |
                         // Campfire: the whole squad sleeps and wakes at full hp. Un-retired
                         // from the list above — unlike the old HEAL_SQUAD it heals to FULL,
                         // so it stays correct whether or not hp ever persists across battles.
                         'HEAL_SQUAD_FULL';

export interface SkillEffectDefinition {
    type: EffectType;
    value?: number;
    targetSelf?: boolean;
    resource?: 'SUN';
    stat?: 'HP' | 'DMG';
}

export interface Skill {
    id: string;
    name: string;
    description: string;
    rangeType: SkillRangeType;
    rangeValue: number;
    effects: SkillEffectDefinition[];
    requiresSunCharge?: boolean;
    /**
     * Sun spent to activate. Omitted or 0 means free — every hero's basic attack is free,
     * so a turn is never wasted for lack of Sun. See DESIGN.md section 4.
     */
    sunCost?: number;
}

export interface TerrainDefinition {
    type: TerrainType | EnvironmentType;
    name: string;
    description: string;
    isWalkable: boolean;
    isFlyingOnly: boolean;
    baseColor: string;
    textureUrl?: string;
}

export interface ItemDefinition {
    id: string;
    name: string;
    /**
     * Paid in Coin, not Sun. Items are bought between levels, and Sun never leaves the
     * battlefield (DESIGN.md section 3). Renamed from `sunCost` so the currency is
     * unambiguous at every call site.
     */
    coinCost: number;
    damage: number;
    rangeRadius: number;
    effect: 'NONE' | 'BURN' | 'FREEZE' | 'TERRAIN_MOD'
        /** Board-wide gust: pops every flier, shoves every other zombie one tile back. */
        | 'GUST'
        /**
         * Armed on an EMPTY tile and left there. The first grounded zombie to step on the
         * tile takes `damage` on the spot. This is what makes the Potato Mine a mine —
         * it used to be an instant 5-damage click, i.e. a cheaper Cherry Bomb.
         */
        | 'TRAP'
        /** Hands one spent hero its action back. Needs a valid friendly target to be spent. */
        | 'REFRESH';
    description: string;
    imgUrl: string;
}

export interface MapNode {
    id: string;
    x: number;
    y: number;
    type: 'BATTLE' | 'ELITE' | 'BOSS' | 'SHOP' | 'CAMPFIRE' | 'EVENT';
    world: WorldType;
    status: 'LOCKED' | 'AVAILABLE' | 'COMPLETED' | 'SKIPPED';
    next: string[];
    /** Set on the hand-authored tutorial chain. Drives the scripted battle. */
    tutorialId?: string;
}

/**
 * Terms applied to the next battle only. Set by an event, consumed by setupCombat /
 * completeLevel, then cleared — never allowed to stack across two fights.
 */
export interface NextBattleMods {
    /** Added to the turn limit. Negative shortens it. */
    turns?: number;
    /** Added to the opening wave. Negative thins it. */
    enemies?: number;
    /** Houses that start with their brain already gone. */
    brainlessHouses?: number;
    /** Extra Coin paid out only if that battle is won. */
    coinOnWin?: number;
}

export interface EventEffect {
    type: EffectType;
    value?: number;
    stat?: 'HP' | 'DMG';
    /** Payload for NEXT_BATTLE_MOD. */
    mods?: NextBattleMods;
    /** Pins GAIN_BENCH_PLANT to a specific plant instead of rolling a random one. */
    materialId?: MaterialId;
    /**
     * 0..1 probability this effect lands. Omitted means certain.
     * The roll happens ONCE, in resolveEffects(), before the result text is written — so the
     * screen can never announce an outcome different from the one that was applied.
     */
    chance?: number;
    /**
     * Extra effects applied alongside this one when the roll LANDS. Use this rather than a
     * second effect with the same `chance`: two independent rolls can disagree, and then the
     * outcome chip ("win the plant AND the Coin") would be lying half the time.
     */
    then?: EventEffect[];
    /** Applied instead when the `chance` roll fails. */
    fallback?: EventEffect[];
}

/**
 * One line of the "what do I get / what do I risk" panel. The player should never have to
 * infer a consequence from flavour text.
 */
export interface EventOutcome {
    kind: 'GAIN' | 'COST' | 'RISK';
    text: string;
    /** 0..1. Rendered as a percentage on the chip. Omitted means certain. */
    chance?: number;
}

export interface EventOption {
    label: string;
    description: string;
    req?: { type: 'SUN' | 'HP' | 'COIN' | 'BENCH'; value: number };
    /** Applied in order. An option may do several things at once. */
    effects: EventEffect[];
    /** Spelled-out consequences, rendered as chips above the button. */
    outcomes?: EventOutcome[];
}

export interface GameEvent {
    id: string;
    title: string;
    description: string;
    imgUrl: string;
    options: EventOption[];
    /**
     * How deep into a run this encounter belongs, by the size of what it puts on the table.
     *   1 — small trades, tens of Coin
     *   2 — gambles and three-figure payouts
     *   3 — run-defining: a brain, a lost house, a wager on the next fight
     * Omitted behaves as tier 1. `rest_site` has no tier: it is reached by CAMPFIRE nodes,
     * never by the random EVENT pool.
     */
    tier?: 1 | 2 | 3;
}