export enum UnitType {
  PLANT = 'PLANT',
  ZOMBIE = 'ZOMBIE',
  OBSTACLE = 'OBSTACLE',
}

export enum UnitClass {
  /* --- CÂY ---
     Chỉ còn chín cây thật sự ra được sân: đúng chín cây gốc của hero, mỗi cây vừa là
     `baseClass` của một hero vừa là `benchClass` của nguyên liệu cùng tên. Mười chín cây PvZ
     còn lại đã bỏ — xem chú thích đầu data/plants.ts. */
  SEED_GUN = 'SEED_GUN',
  ROTOR_WING = 'ROTOR_WING',
  // Tên CÂY, không phải tên hero: 'CORNOVA' là HeroId của Hoàng Kim Pháo Thủ, còn thân cây
  // cô ấy mọc lên từ tên là Corn Mortar (heroes.ts: `baseClass`, materials.ts: `benchClass`,
  // ICONS.CORN_MORTAR — tất cả đều gọi thế).
  CORN_MORTAR = 'CORN_MORTAR',
  ARMOR_PLATE = 'ARMOR_PLATE',
  SPIKE_ARMOR = 'SPIKE_ARMOR',
  BUNKER_SHELL = 'BUNKER_SHELL',
  /** Spring Arm. The only plant whose whole job is moving somebody else. */
  SPRING_ARM = 'SPRING_ARM',
  STEEL_JAWS = 'STEEL_JAWS',
  SOL_BATTERY = 'SOL_BATTERY',
  BARREL_PROP = 'BARREL_PROP',

  /**
    * A crate of gear left on the board. Not a plant and not a zombie: it cannot move, cannot
    * act, and has no skills — it is a body with hit points and a thing inside it.
    *
    * Its own class rather than a flag on an existing plant, because the horde has to WANT it
    * (turnManager's goal scan reads the class) and the player must never be able to select it
    * and wonder why the action bar is empty.
    */
  GEAR_CRATE = 'GEAR_CRATE',

  WALKER = 'WALKER',
  SCRAPCAP = 'SCRAPCAP',
  POTHELM = 'POTHELM',
  TATTERGUARD = 'TATTERGUARD', 
  DOORBEARER = 'DOORBEARER', 
  MINER = 'MINER', 
  LINEBREAKER = 'LINEBREAKER',
  LEAPER = 'LEAPER', 
  DANCER = 'DANCER',
  FLOATER = 'FLOATER',
  LOBBER = 'LOBBER',
  BANNERMAN = 'BANNERMAN', 
  /** The Headliner. A Dancer with a stage, an aura, and twenty times the health. */
  HEADLINER = 'HEADLINER',
  /** Cinder Colossus. Leaves the ground burning behind it. */
  CINDER_COLOSSUS = 'CINDER_COLOSSUS',
  /** Voltmaw. The board is its circuit — a tile that pays you is a tile it can reach. */
  VOLTMAW = 'VOLTMAW',
  /** Yeti. Freezes a hero on one turn and breaks them on the next. */
  YETI = 'YETI',
  /** Ironcart. Artillery on wheels — it only leaves the rail feet first. */
  IRONCART = 'IRONCART',
  /** Clockjaw. Two hands, two blows, both telegraphed and neither preventable. */
  CLOCKJAW = 'CLOCKJAW',
  /** The Armada. Flies until the gas is shot out of it, then it is furniture with a temper. */
  ARMADA = 'ARMADA',
  /** Sandreaver. It does not walk around your line; it comes up inside it. */
  SANDREAVER = 'SANDREAVER',
  /** Blightlord. The one who walked backwards through time, and the last thing standing. */
  BLIGHTLORD = 'BLIGHTLORD',
  GRAVEHULK = 'GRAVEHULK',
  RUNT = 'RUNT',
  ROCK = 'ROCK',
  GRAVE = 'GRAVE',
}

export type UnitRole = 'MELEE' | 'SHOOTER' | 'SUPPORT' | 'TACTICAL' | 'ENEMY';
/**
 * A sector of the campaign. Each one owns a hazard (data/hazards.ts) and a pool of
 * hand-authored boards (data/maps.ts); PLAN-boards-bosses.md section 1 lays out which act
 * of which stage each belongs to.
 *
 * NEON and RUIN are the same city twice: lit and intact, then shelled and collapsing. They
 * are two sectors rather than one because the pair is the point — an even, readable grid
 * against a board with no straight line left in it.
 */
export type WorldType =
    // Stage I — the Green Belt
    'GRASS' | 'DESERT' | 'VOLCANO'
    // Stage II — the Far Shore
    | 'COAST' | 'THORN' | 'ICE'
    // Stage III — the City
    | 'NEON' | 'RUIN' | 'GRID';
export type StatusEffectType = 'BURN' | 'FREEZE' | 'STUN' | 'HYPNOTIZED' | 'ENRAGED'
    /** Halves movement for a turn. Weaker than STUN, which removes the turn entirely. */
    | 'SLOW'
    /**
     * Forced to come at whoever taunted it, ignoring the sprout it actually wants.
     *
     * This is the only status that redirects an enemy rather than delaying it, and it exists
     * because three unit types are built specifically to walk AROUND a blocker: the Balloon
     * flies, the Digger teleports, the Catapult outranges. A wall answers none of them. The
     * provoker's id is on `Unit.provokedBy` — the status alone cannot say who to go after.
     */
    | 'PROVOKED'
    /**
     * Cannot act at all, and never recovers on its own. Unlike STUN (one turn) and FREEZE
     * (until hit), nothing clears this — it is set by scripted content for a unit the player
     * has to protect rather than command.
     */
    | 'DORMANT'
    /**
     * This hero's ELEMENT is cut. The body, the skills and the fusions are untouched — only
     * the rider the element grafts on (utils/elements.ts, rules L1/L2) stops arriving.
     *
     * A status and not a unit flag, because it has to travel the same road every other
     * affliction does: telegraphed a turn ahead as `statusOnHit`, refused by STATUS immunity,
     * shown on the unit, and carried in the one field the reducer already syncs. A bespoke
     * boolean would have needed its own telegraph, its own immunity check and its own UI.
     *
     * Deliberately NOT cleared by the turn reset: the reset spends STUN and SLOW because those
     * are one-turn delays. This one is a theft, and it lasts the fight — which is the whole
     * threat of the Blightlord's second phase.
     */
    | 'SEVERED'
    /**
     * An open wound: the NEXT damage instance against this body lands +1, then the wound is
     * spent. Consumed by being hit, never by the clock, and it does not stack — bitten twice
     * is still one wound. Deliberately applied outside the STATUS immunity gate (bosses bleed
     * too): it is flesh, not mind control. The +1 is added after helmet armour in
     * calculateDamage, or a Pothelm would eat the entire gear.
     */
    | 'BLEEDING'
    /**
     * Solar Blessing's mark: +1 damage on this body's attacks, and (if it carries no element
     * of its own) the blesser's element on loan (`Unit.blessedElement`) — both lasting ONLY
     * until this player turn ends. Cleared at the door of the enemy phase in turnManager,
     * which is what makes "bless first, then swing" the skill's whole sequencing lesson, and
     * what makes the buff impossible to bank in the clockless boss fights.
     */
    | 'BLESSED';
export type MovementType = 'WALKING' | 'FLYING' | 'AMPHIBIOUS' | 'TELEPORT'
    /**
     * Rides a rail line and nothing else: it may only ever ENTER a `TerrainType.RAIL` tile.
     *
     * Not a movement upgrade — a leash. Ironcart moves 3 where a Gravehulk moves 2, along
     * exactly one line, and a body parked on that line is a wall it cannot go round.
     *
     * The rule only arms once the unit is STANDING on rail (`isRailBound`, utils/gameLogic.ts).
     * Off the track it walks like anything else, which is what lets it reach the track from
     * whatever spawn tile it was placed on — four of arena_ironcart's ten have no rail beside
     * them, and a cart locked to rail from turn one would be a statue on those.
     */
    | 'RAIL'
    | 'GRAVE_DIRT'
    | 'CONVEYOR_N' | 'CONVEYOR_S' | 'CONVEYOR_E' | 'CONVEYOR_W'
    | 'SURGE_NODE'
    | 'BLIGHT'
    | 'THIN_ICE';
/**
 * NOTE: 'FREEZE' covers STUN/FREEZE only — it does NOT stop SLOW. Something too heavy to
 * freeze solid can still be chilled into moving slower, and having one immunity blank both
 * meant the Gravehulk (PUSH + FREEZE immune, Massive) shut off every control tool in the
 * game at once. 'STATUS' is the one that stops everything — that is what it is for.
 */
export type UnitImmunity = 'BURN' | 'FREEZE' | 'DROWN' | 'PUSH' | 'STATUS'
    /**
     * Electricity does not enter this body: SURGE tiles pass under it, and enemy lightning
     * arcs refuse to pick it as a hop. Exists for the element rule "a hero carrying an
     * element is immune to that element" (utils/elements.ts ELEMENT_IMMUNITY) — no zombie
     * grants it natively today.
     */
    | 'SHOCK';

/**
 * THE THREE ELEMENTS (PLAN-progression.md section 3).
 *
 * An element is a RULE applied to a whole hero, never a hand-authored kit. That distinction is
 * the only reason the system is affordable: nine heroes times three elements would be 27 kits
 * to design, balance, describe and draw — as three rules, all 36 configurations fall out for
 * free, and "an all-ice squad" becomes a strategy rather than a colour scheme.
 *
 * The price is MAX HEALTH, and it is deliberately not damage. Damage runs 0..2 across this
 * roster, so a flat deduction would be -100% for Ironhusk and -0% for Sunbloom — not a price, a
 * lottery. Everyone has health, everyone has several, and health persists between battles.
 *
 * The amount lives in ONE place, `ELEMENT_HP_COST` in utils/elements.ts, and is quoted nowhere
 * else — not here, not in the element descriptions, not in the UI. It has already been retuned
 * once (hero health doubled), and every copy of it is a chance for the screen to contradict
 * itself in a game that promises perfect information.
 */
export type ElementId = 'ICE' | 'FIRE' | 'LIGHTNING';

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
    /** Greenspire tiles occupy column y === HOUSE_COLUMN. Zombies path toward them. */
    isHouse?: boolean;
    /** A Greenspire still holding its sprout. Cleared when a zombie reaches it. */
    hasBrain?: boolean;
    /**
     * Deploy and spawn zones come from the hand-authored map, not from column constants.
     * They used to be hardcoded in three separate places that drifted out of sync.
     */
    isDeployZone?: boolean;
    isSpawnZone?: boolean;
    /**
     * An armed trap waiting on this tile (Seed Mine). Placed by an item, consumed by the
     * first grounded enemy that steps here — walking, being pushed, or being spawned onto
     * it all count, because they all move through the same UNIT_MOVE/spawn paths.
     */
    trap?: { damage: number; imgUrl: string };
    /**
     * Spines left across a tile (the Spike Trap item; formerly Thornquill's trail). Unlike
     * `trap` this is NOT consumed by the first
     * body through it — it hurts everything that enters while it lasts, and expires on its own.
     * That difference is the whole point: a trap is one answer to one zombie, spikes are a
     * piece of ground the enemy has to route around.
     */
    spikes?: { damage: number; turns: number };
    /**
     * Dust hanging over this tile (DUST_VEIL). Rides beside `environment: 'SMOKE'` rather
     * than replacing it: the environment is what the tile LOOKS like and what Tile.tsx has
     * always drawn, the counter is how long it lasts. Same split spikes make against terrain,
     * and for the same reason — one of the two is on a clock and the other is not.
     */
    smoke?: { turns: number };
    /**
     * Sea standing over this tile (TIDE). `was` is the ground underneath, and it is the whole
     * reason this is a field rather than a plain MODIFY_TERRAIN to WATER: the tide goes back
     * out, and a hazard that could not name what it covered would have to guess on the way
     * down. Guessing 'GRASS' would quietly pave over sand, bridge and rail.
     */
    flood?: { turns: number; was: TerrainType };
    /**
     * A shell LAYER on a HOUSE (Gourdward's Reinforce). Greenspires are tiles, not units, and a
     * sprout is taken by ARRIVAL/BITE rather than through calculateDamage — so the Greenspire's
     * layer lives here and is consumed at the two doors a sprout leaves through: the adjacent
     * bite (turnManager, BRAIN BITE) and the shove-into-Greenspire (gameLogic, planPush). One
     * layer eats one bite in full, then breaks — the same §6.0 contract units have, which is
     * what makes "a Greenspire is a 1-hp unit wearing one layer" the correct mental model without
     * the ~40-call-site refactor of making it a real unit.
     */
    shielded?: boolean;
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
  /**
   * Nothing can hurt this unit right now. Checked in `calculateDamage`, which is the single
   * door every source of damage in the game goes through — hazards, thorns, blasts, drowning
   * and skills alike — so it cannot be routed around by adding a tenth way to deal damage.
   *
   * Set for exactly one turn between the Blightlord's phases: the body is reforming, and the
   * turn the player cannot spend on it is what makes three 12-HP bosses feel like three
   * bosses rather than one 36-HP bar.
   */
  invulnerable?: boolean;
  /**
   * The Blightlord's phase-3 anchor: what this unit looked like at the START of last turn.
   * Restored at the end of every turn the squad failed to land enough on it at once.
   */
  rewindMark?: { hp: number; position: Position };
  /** Which phase this boss was in last turn, so a crossing can be noticed exactly once. */
  bossPhase?: number;
  /** What this crate is carrying, paid into the bench if it is still standing at the end. */
  gearMaterial?: MaterialId;
  /** Turns of `invulnerable` still owed. Counted down by the boss's own end-of-turn hook. */
  phaseGuard?: number;
  imgUrl: string;
  intent?: Intent;
  spawnDelay?: number;
  digestingTurns?: number;
  /**
   * Under the board.
   *
   * Untargetable and NON-SOLID together, never one without the other — `getSolidUnitAt`
   * (utils/gameLogic.ts) is the single lookup that enforces both, and seven call sites go
   * through it. A body you cannot shoot but still cannot walk through is an invisible wall,
   * which is a worse bug than the one this flag exists to create: the player would see an
   * unexplained hole in their own move range, on the one tile with nothing on it.
   *
   * The line it draws is "things that name a BODY miss; things that change the GROUND land".
   * Spikes on the route, a mine on the tile it surfaces through, lava, and a PROVOKE (which is a
   * radius around the shouter and never asks what it can see) all still reach it. That is what
   * keeps the buried turn a turn spent salting the ground rather than a turn spent watching.
   */
  isBurrowed?: boolean;
  /**
   * The tile this unit has PROMISED to surface on, published a turn before it dives.
   *
   * Only Sandreaver's wounded phase sets it. It could have been re-derived each turn, and that
   * is exactly the bug: re-deriving means re-choosing, against a squad that has since moved,
   * and a telegraph the boss then declines to honour is worse than no telegraph at all.
   */
  burrowTarget?: Position;
  shield?: number;
  /**
   * Gas cells left on a lighter-than-air body (The Armada).
   *
   * NOT a shield, and the two must never be merged: a shield ABSORBS damage, a gas cell is
   * spent BY damage getting through. Borrowing `shield` would have made the boss take three
   * fewer points than the board said it did, and turned every Gourdward shell into balloons.
   *
   * At 0 the body falls: WALKING, no PUSH or DROWN immunity, one tile of movement, and a much
   * heavier hit (utils/bossBehaviours.ts).
   */
  buoyancy?: number;
  /**
   * HP the last time `buoyancy` was audited — the end of the previous enemy turn.
   *
   * "One cell per TURN, however many hits" needs a way to ask "did anything get through since
   * last time", and a boolean flag needs somebody to clear it on every path every turn. A
   * high-water mark cannot fall out of step: hp only goes down, so `hp < mark` is true on
   * exactly the rounds it was hurt — including by burn, spines and its own escort's blast,
   * none of which a player-side flag would ever have seen.
   */
  buoyancyMark?: number;
  sunCharge?: number;
  prevPosition?: Position;
  visualOffset?: { x: number, y: number };
  isDying?: boolean;
  isAttacking?: boolean;
  /**
   * This body is inside a hit-stop frame RIGHT NOW (a >=4 hit landed): the sprite flashes
   * white and squashes while the engine holds the whole beat for ~80ms. Purely visual,
   * set and cleared by the engine inside one APPLY_DAMAGE — never saved, never read by rules.
   */
  isHitFlashing?: boolean;
    /** Wild board-gift plant: sleeps DORMANT until a hero stands adjacent; the run never owns it (isBattleOnlyUnit). */
    isWild?: boolean;
  flipX?: boolean;
  isMassive?: boolean;
  /**
   * Which named boss this unit IS. Set only on the one body a boss encounter is about.
   *
   * Distinct from `isMassive`, which is a rules flag about being too big to eat, freeze or
   * shove — Ironcart and The Headliner are bosses and neither is massive, while a future
   * massive add would not be a boss. Two readers: SLAY_BOSS asks "is this the objective",
   * and utils/bossBehaviours.ts asks "which behaviour do you run".
   *
   * Identity lives here rather than on the unit class because a class can serve both roles:
   * the Headliner's own dance floor is full of ordinary Dancers.
   */
  bossId?: BossId;
  /**
   * Turns this boss has acted for, counted from the moment it appeared. Behaviours with a
   * rhythm — summon every other turn, phase on a beat — read it instead of the global turn
   * number, so a boss that arrives mid-fight still starts its cycle at its own turn one.
   */
  bossClock?: number;
  /** Tiles this unit can strike from. 1 = melee (the default for everything that omits it). */
  attackRange?: number;
  /** True for the 3 squad heroes. Only heroes carry a hero skill and accept fusions. */
  isHero?: boolean;
  heroId?: HeroId;
  /** Materials fused into this hero, in the order they were applied. */
  fusions?: MaterialId[];
  /**
   * Act upgrades taken this run (`data/heroUpgrades.ts` ids), in the order they were chosen.
   *
   * Beside `fusions` rather than folded into it, because the two are earned by different
   * things and bounded by different rules — a fusion costs a bench plant and a slot, an
   * upgrade costs a boss and may be taken once ever. They MERGE at `getFusionEffects`, which
   * is the only place anything downstream reads either of them.
   */
  upgrades?: string[];
  /** Set on a bench plant deployed to fill a fallen hero's slot. */
  materialId?: MaterialId;
  /**
   * Id of the unit that taunted this one. Read together with the PROVOKED status: the status
   * says "you are not walking to a sprout this turn", this says who to go at instead. Ignored
   * the moment the provoker is dead — otherwise a corpse would keep steering the enemy line.
   */
  provokedBy?: string;
  /**
   * Damage dealt back to anything that hits this unit in melee, WITHOUT a fusion.
   *
   * RETALIATE_DAMAGE already exists as a fusion effect, but Thornshell retaliates because it is
   * a durian — the thorns are the hero, not an upgrade bought for it. Fusion retaliation adds
   * to this rather than replacing it.
   */
  retaliateDamage?: number;
  /**
   * The element this body's attacks BORROW for the current player turn (Solar Blessing's
   * loan). Never set when the unit carries its own element — own wins, no stacking — and
   * cleared together with BLESSED at the start of the enemy phase. Deliberately NOT counted
   * by resonance and carrying NO immunity: it is a borrowed blade, not borrowed skin.
   */
  blessedElement?: ElementId;
  /**
   * What the BLESSED status on this body is WORTH in damage, set by the blesser at cast time.
   * Undefined means the authored 1. Solar Blessing's Fanged Blessing gear raises it — the
   * bonus belongs to the blesser's gear, but it has to be READ off the blessed body, which is
   * the same reason `blessedElement` lives here rather than on the caster.
   */
  blessPower?: number;
  /**
   * The LAYER currently worn is spiked (Gourdward's Glass Rind): whatever breaks it starts
   * bleeding. Written at every grant site alongside `shield`, so it can never outlive the
   * layer it describes — a body re-shelled by somebody else is re-flagged false.
   */
  shieldBarbed?: boolean;
  /**
   * The LAST_STAND_SHIELD layer has already been spent this battle. Reset by unitFactory when
   * the body is built for a fight, which is also where the flag is cleared between battles —
   * a once-per-fight promise stored on a snapshot that persists between fights would be a
   * once-per-RUN promise instead.
   */
  lastStandUsed?: boolean;
  /**
   * Helmet armour: every WEAPON hit is reduced by this much, and unlike fusion armour it may
   * reduce a hit to ZERO — a pea plinking off a bucket is the whole identity (brainstorm_balance
   * § 2, the one idea from that document worth keeping). Environment ignores it on purpose:
   * burn, lava and ground spikes cook or stab the body inside the helmet, which keeps FIRE and
   * the Spike Trap item's fields as the honest answers to an armoured lane.
   */
  armor?: number;
  /**
   * The element this hero carries into the battle, or undefined for the base form.
   *
   * Lives on the UNIT rather than on the skill because that is exactly what the rules say: an
   * element is a property of the hero, so it reaches every source of damage they have —
   * including Thornshell's retaliation, which no skill object is involved in at all (rule L4).
   */
  element?: ElementId;
}

/**
 * One extra tile an intent lands on, carrying its OWN number.
 *
 * Five bosses were designed against this hole independently and each invented a different
 * field for it — extra swings, splash, an arc, a bomb, an eruption. They are not five things.
 * They are two, and the line between them is whether the hit provokes an answer:
 *
 *   - A BLAST is ground being hurt. No retaliation, no push, no element rider. Thorns answer
 *     something that came and stood in front of you; they do not answer a shell, an arc across
 *     the floor, or a bomb from altitude. That is this type.
 *   - Several SWINGS are several attacks, each of which a defender may punish. That is a
 *     different feature and it is not built yet — when it is, it belongs on `Intent` beside
 *     this one and NOT folded into it, because collapsing the two is how a boss ends up
 *     killing itself on spines it never touched.
 *
 * Positions, not unit ids: a telegraph in this game is a promise about GROUND, and a blast
 * that followed the body it was aimed at would make stepping out of it pointless.
 */
export interface AreaHit {
    pos: Position;
    damage: number;
    /** Also stuns whoever is standing there, immunities permitting. */
    stun?: boolean;
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
    /** SPAWN: what arrives. Defaults to RUNT, which is what the Gravehulk throws. */
    spawnClass?: UnitClass;
    /**
     * SPAWN: every tile a body lands on. `target` stays the first of them so the existing
     * single-tile readers (threat map, telegraph) keep working unchanged; anything that wants
     * the whole set reads this.
     */
    spawnTiles?: Position[];
    /**
     * SPAWN: HP the arrival is built with, overriding its class definition.
     *
     * Exists for one summon and is written generically anyway: the Blightlord calls back the
     * bosses you already beat as 4-HP echoes. Without it a summoned Voltmaw would arrive with
     * Voltmaw's 26, i.e. the final fight would spawn a second final fight every turn.
     */
    spawnHp?: number;
    /**
     * Tiles this intent ALSO lands on, each with its own damage — see AreaHit.
     *
     * Read for every intent type, not just ATTACK: an arc rides an attack, but a grid
     * discharging rides a WAIT, and the tiles are threatened either way. Deliberately not
     * typed to any one boss; the GRID sector's SURGE hazard is the same effect with no unit
     * behind it at all.
     */
    blast?: AreaHit[];
    /**
     * ATTACK: every tile this intent lands a SEPARATE, COMPLETE blow on, worth `damage` each.
     *
     * NOT a second spelling of `blast`, and the line between them is not how many tiles get
     * hit — it is who answers back. A blast is one weapon reaching several squares: it pays no
     * retaliation, carries no status rider, and cannot kill its own owner halfway through. A
     * strike is a whole attack, so every rule in turnManager's ATTACK branch runs once per
     * entry: thorns answer EACH beat, an ICE hero chills on each beat, and a boss that swings
     * twice can bleed out between its own two hands.
     *
     * Merging the two would mean either billing a five-tile shell four retaliations, or taking
     * retaliation away from the one hero a twice-acting boss exists to reward. Both are wrong,
     * so they are two fields.
     *
     * `target` stays the FIRST strike, exactly as it stays the first of `spawnTiles`, so every
     * single-tile reader keeps working untouched. Absent or empty means "one blow at `target`"
     * for `damage` — which is every other unit in the game, and must stay bit-for-bit what it
     * always was.
     *
     * `AreaHit[]`, the same shape as `blast`, so the two differ ONLY in how the engine resolves
     * them — one provokes an answer, one does not — and not in how they are written or read.
     * Per-tile numbers are not decoration either: a boss that comes up through the floor marks
     * the hole at 0 and the ring around it at full, in one intent.
     */
    strikes?: AreaHit[];
    /**
     * ATTACK: tiles this blow shoves whatever it lands on, away from the attacker.
     *
     * Applies to `target` and to every entry in `strikes`. Routed through planPush/applyPushPlan
     * like every other shove in the game, so it drowns, chains and hands over sprouts by identical
     * rules — the same reason RETALIATE_PUSH is not hand-rolled either.
     */
    pushOnHit?: number;
    /**
     * ATTACK: statuses this blow lands alongside (or instead of) its damage.
     *
     * An enemy attack could only ever move a health bar, so "the boss freezes you" had nowhere
     * to live but a special case inside turnManager — the exact shape data/bosses.ts and
     * utils/bossBehaviours.ts exist to prevent. A list rather than one value because the next
     * enemy that needs two should not need a second field.
     *
     * Damage stays in `damage` and is telegraphed from there, so a 0-damage intent that only
     * applies a status is legal and fully telegraphed — which is exactly what a grip is.
     */
    statusOnHit?: StatusEffectType[];
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
    type: 'IMPACT' | 'EXPLOSION' | 'SLASH' | 'MUZZLE' | 'PUSH' | 'EMERGE' | 'DROWN' | 'HIT_FIRE' | 'HIT_ICE' | 'HIT_ELEC' | 'HEAVY_SHAKE' | 'SHIELD_GRANT' | 'PROVOKE_BURST';
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
    type: 'PEA' | 'CORN';
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
    /**
     * CAMP is where a CAMPFIRE node goes. It replaced the `rest_site` EVENT, which was one
     * visit and one free choice — heal, or revive, or take 60 Coin, and the run moved on.
     * Free choices are not decisions: with nothing at stake the answer was whichever box was
     * empty at the time. The camp charges for all four services out of one purse instead.
     */
    screen: 'START_MENU' | 'STAGE_SELECT' | 'SQUAD_SELECT' | 'MAP' | 'COMBAT' | 'SHOP' | 'CAMP' | 'GAME_OVER' | 'VICTORY' | 'TUTORIAL' | 'EVENT';
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
    /** Sprouts left for the whole run. Reaching 0 ends the run. */
    brainsRemaining: number;
    brainsMax: number;
    /** Sprouts bought back this run. Drives the escalating buy-back price. */
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
    /**
     * The act this run is aimed at, chosen on the campaign screen. It picks the stage the map
     * generator lays out and names the boss waiting at the end of it; without one the run
     * falls back to "wherever the save had got to", which is what happened before there was a
     * screen to say otherwise.
     */
    targetBossId: BossId | null;
    /** Base plants bought but not yet fused or deployed. */
    bench: BenchPlant[];
    /**
     * Element chosen per hero for this run. A hero missing from the map is in its base form.
     *
     * Run-scoped, not save-scoped: the element is a build decision made when the squad is
     * picked, and re-picking it every run is what makes "all-ice this time" a thing the player
     * chooses rather than a state they drift into.
     */
    heroElements: Partial<Record<HeroId, ElementId>>;
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
    /**
     * Per-hero ledger for the battle in progress, keyed by HeroId. Reset when a battle is set
     * up, fed by TRACK_STAT actions (and by the engine for `damageTaken`), read by the boss
     * victory report. Optional so every historical save and INITIAL_GAME_STATE spread stays
     * valid — an absent ledger just means "nothing counted yet".
     */
    battleStats?: Partial<Record<HeroId, BattleHeroStats>>;
    /**
     * Act upgrades won and not yet spent. One is banked per boss put down; the player spends
     * them from the victory screen, choosing which hero gets what.
     *
     * A COUNT, not a queue of offers: the three upgrades a hero has are fixed
     * (data/heroUpgrades.ts) and each may be taken once, so what is owed is a number and what
     * is available is derived from the squad. Banking rather than forcing the choice on the
     * spot also means a boss cleared on the way out of a run does not strand its reward.
     */
    upgradePicks?: number;
    /**
     * Acts whose boss has fallen THIS RUN. Feeds the end-of-run XP, which used to be a
     * boolean ("did a boss die") — fine while a run held one act, and an undercount of two
     * thirds the moment it held three.
     */
    actsCleared?: number;
    /**
     * The act about to start, when the player has just cleared the one before it. Set by the
     * act cut and consumed by the intro card; absent the rest of the time.
     *
     * The map is swapped the instant the boss dies rather than when this is dismissed, so a
     * reload mid-announcement lands on the new act rather than on a map that no longer exists.
     */
    actIntro?: BossId;
}

export interface TurnAction {
    type: 'WAIT' | 'UNIT_MOVE' | 'UNIT_ATTACK' | 'APPLY_DAMAGE' | 'UNIT_DIE' | 'SPAWN_UNIT' | 'UPDATE_INTENT' | 'UPDATE_UNIT_STATE' | 'NEW_TURN_RESET' | 'MODIFY_TERRAIN' | 'RESOURCE_GAIN'
        /** A zombie reached a Greenspire: clear that Greenspire's sprout and remove the zombie. */
        | 'BRAIN_LOST'
        /** In-combat Sol income (zombie kills, passive generators). */
        | 'GAIN_SUN'
        /**
         * A line in a hero's battle ledger (`GameState.battleStats`). Emitted AT THE SOURCE —
         * the one place that still knows who caused what — because the action stream is
         * anonymous by the time the engine applies it: an APPLY_DAMAGE carries a target and a
         * number, and reverse-engineering its author from ordering ("the last UNIT_ATTACK
         * wins") mis-books exactly the heroes the ledger exists to defend — a thorn answer or
         * an arc lands right after the ZOMBIE's swing. No visuals, no wait; the engine just
         * adds `amount` to `battleStats[heroId][stat]`.
         */
        | 'TRACK_STAT';
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
    /**
     * Spines laid across `pos` by a MODIFY_TERRAIN action. Rides alongside `terrain` /
     * `environment` rather than becoming one of them: the tile underneath is unchanged — grass
     * that was grass stays grass — and it expires on a clock of its own, which neither of the
     * other two do.
     */
    spikes?: { damage: number; turns: number };
    /** Dust laid (or expiring) on `pos`. `turns: 0` is how the expiry writes "this is over". */
    smoke?: { turns: number };
    /** A Greenspire layer raised (true) or spent by a bite (false) on `pos`. */
    shielded?: boolean;
    /** Sea laid (or receding) on `pos`. `turns: 0` recedes, and `terrain` carries it back. */
    flood?: { turns: number; was: TerrainType };
    isForced?: boolean;
    resource?: 'SUN';
    /** How the attack should be animated. Lets the engine stay ignorant of unit classes. */
    attackRange?: SkillRangeType;
    /**
     * This UNIT_ATTACK is a lightning arc jumping onward, not the attack that started it.
     *
     * It exists only so the arc can SOUND different. Everything else about it is already a
     * normal shot on purpose (it flies, it flashes), and without the flag the engine has no way
     * to tell the two apart — an arc emits the same action, from the same caster, in the same
     * tick as the blow that spawned it.
     */
    isArc?: boolean;
    /** TRACK_STAT: whose ledger. Only heroes keep one — non-hero sources simply never emit. */
    heroId?: HeroId;
    /** TRACK_STAT: which line of the ledger `amount` lands on. */
    stat?: BattleStatKey;
}

/**
 * One hero's ledger for the current battle. The four counted things are chosen so every ROLE
 * shows up in at least one column: damage flatters the shooters, kills flatter the finishers,
 * pushes and cancelled intents are the only place Chardslam's 0-damage turns become visible —
 * which is the reason the screen exists (a support's value is real but never printed anywhere).
 *
 * `damageTaken` is counted by the engine off plain APPLY_DAMAGE (the victim needs no
 * attribution); the other four arrive as TRACK_STAT lines from whichever resolver knew the
 * author. BURN ticks lit by a FIRE element are deliberately uncounted — a tick has no author
 * by the time it fires, and a wrong ledger is worse than a short one.
 */
export interface BattleHeroStats {
    damageDealt: number;
    kills: number;
    /** Enemy bodies shoved — by skill, or by the RETALIATE_PUSH answer. One per body, not per tile. */
    pushes: number;
    /** Telegraphed enemy turns removed: doused bosses. The invisible half of a shove's value. */
    intentsCancelled: number;
    damageTaken: number;
}

export type BattleStatKey = keyof BattleHeroStats;

// ---------------------------------------------------------------------------
// HEROES, FUSION MATERIALS, RUN STATE  (see DESIGN.md sections 2, 6, 7)
// ---------------------------------------------------------------------------

/** The 5 heroes shipped in the first build. More unlock later — DESIGN.md section 7. */
export type HeroId =
    | 'PEABURST'
    | 'IRONHUSK'
    | 'SUNBLOOM'
    | 'SNAPMAW'
    /**
     * Cornova, the Corn Mortar. The only hero whose attacks ARC: every other attack in the game
     * is a straight line that stops at the first body in the way, including your own wall
     * (see getValidTargets' LINE branch). Unlocked from the third boss.
     */
    | 'CORNOVA'
    /**
     * The four heroes that complete the roster of nine (PLAN-heroes-9.md): three ranged,
     * three melee, three support. Each one occupies an axis nothing else in the cast touches.
     */
    /**
     * Reedwing, the Rotor Wing drone pilot. The roster's only FLYING body, and the only knight's-
     * move attack (WING_PAIR): two shots per turn, four tiles of reach, four hp. Replaced
     * Thornquill — the row-pierce identity retired with her.
     */
    | 'REEDWING'
    /** Thornshell, the Spike Armor. Retaliates innately, and can force enemies to come to it. */
    | 'THORNSHELL'
    /** Chardslam, the Spring Arm. 0 damage: it kills with terrain, by shoving 2 tiles. */
    | 'CHARDSLAM'
    /** Gourdward, the Bunker Shell. The only source of shields — nothing else protects an ally. */
    | 'GOURDWARD';

/** The 5 fusion materials shipped in the first build. */
/**
 * The materials are the same five plants the heroes are built from — the fusion matrix
 * is 5 heroes x 5 materials, and each pairing is authored by hand.
 */
/**
 * The seven named bosses. Lives here rather than in data/unlocks.ts because UnlockState
 * needs it and data/unlocks.ts already imports from this file — the other direction would
 * be a cycle. The table itself (which hero each one frees) stays in data/unlocks.ts.
 */
export type BossId =
    | 'GRAVEHULK' | 'IRONCART' | 'CINDER_COLOSSUS'
    | 'YETI' | 'HEADLINER' | 'ARMADA'
    /** Burrows and surfaces BEHIND your line. A taunt is the only thing it cannot walk around. */
    | 'SANDREAVER'
    /** Acts twice a turn: its damage cannot be prevented in time, only absorbed. */
    | 'CLOCKJAW'
    /**
     * Closes stage III and pays out the LIGHTNING element. Named here ahead of its unit and
     * its BOSSES row because its arena is already authored (data/maps.ts): the ground a boss
     * needs is a map decision and can land before the boss does, but `arenaFor` has to be a
     * real BossId to say so.
     */
    | 'VOLTMAW'
    | 'BLIGHTLORD';

export type MaterialId =
    | 'MAT_SUNBLOOM'
    | 'MAT_PEABURST'
    | 'MAT_SNAPMAW'
    | 'MAT_IRONHUSK'
    // MAT_SNOW_PEA is retired: it was Frostpod's plant, Frostpod is retired, and the cold
    // belongs to the ICE element now. Nine heroes, nine gears, no orphan — persistence.ts
    // filters the id out of old saves so a dead gear can never reach the shop shelf.
    /** Cornova's own plant. Grafts the arc onto somebody else's straight shot. */
    | 'MAT_CORNOVA'
    /**
     * The four gears belonging to the four newest heroes. Every hero's base plant is also a
     * material: bring it to the field as a bench body, or burn it into a hero. One or the
     * other, never both.
     */
    /** Rotor Wing. Rotors: speed for the body, and dust that takes the swing out of a zombie. */
    | 'MAT_REEDWING'
    /** Spike Armor. Thorns worn outward — being hit becomes a way of dealing damage. */
    | 'MAT_THORNSHELL'
    /** Spring Arm. Leverage: whatever it touches ends up somewhere else. */
    | 'MAT_CHARDSLAM'
    /** Bunker Shell. A shell that goes around somebody other than the wearer. */
    | 'MAT_GOURDWARD';

export type FusionEffectType =
    | 'BONUS_HP'                // +maxHp
    | 'SUN_PER_TURN'            // passive Sol income each turn
    | 'SUN_ON_KILL'             // Sol when this unit finishes something off
    | 'DAMAGE_REDUCTION'        // flat reduction on incoming damage
    | 'ON_HIT_PUSH'             // attacks push the target 1 tile
    | 'ON_HIT_FREEZE'           // attacks apply STUN
    | 'ON_HIT_BURN'             // attacks apply BURN
    /**
     * The basic attack resolves a SECOND time, for `value` damage rather than for its full
     * amount. It began as a plain flag meaning "resolves twice", which on Peaburst doubled
     * a free, full-lane attack from 2 to 4 with no cost and no drawback — strictly better
     * than every other fusion in her row, and the first one every player owned.
     */
    | 'DOUBLE_ATTACK'
    | 'GRANT_ATTACK'            // gives a ranged basic attack to a hero that had none
    | 'SKILL_DISCOUNT'          // hero skill costs less Sol
    | 'DIGEST_REDUCTION'        // Snapmaw digests for fewer turns
    /**
     * -`value` incoming damage, but ONLY on the turns Snapmaw is digesting.
     *
     * Three shapes have worn this name. It began as total immunity for the whole window
     * (checked inside calculateDamage), which deleted Snapmaw's one drawback outright; then a
     * numbered shield; then a LAYER. The layer was honest but it duplicated her Gourd Gut
     * cell, and a wall-nut grafted onto a melee body should read as a THICKER HIDE — so it
     * is a flat reduction again, still fenced inside the helpless window it exists to guard.
     * Same door as DAMAGE_REDUCTION in calculateDamage, gated on `digestingTurns`.
     */
    | 'ARMOR_WHILE_DIGESTING'
    | 'RETALIATE_BURN'          // melee attackers catch fire
    /**
     * Melee attackers are CHILLED — slowed on the first hit, frozen (STUN) only when they
     * strike while already slowed. It used to stun outright on every bite, which was a free
     * lost-turn-per-turn and the exact thing the STUN RULE in data/fusionRecipes.ts bans;
     * the two-step is the same escalation the ICE element's retaliation uses, so a player
     * who has learned one has learned both.
     */
    | 'RETALIATE_FREEZE'
    | 'ATTACK_RANGE_BONUS'      // extends the reach of this hero's attacks
    | 'BONUS_DAMAGE'            // flat damage added to this hero's attacks
    | 'SUN_ON_BLOCK_SPAWN'      // Sol for standing on a spawn hole and plugging it
    | 'UPGRADE_SLOW_TO_FREEZE'  // this hero's SLOW becomes a full STUN
    | 'RETALIATE_DAMAGE'        // melee attackers take damage back
    | 'SWALLOW_EXPLODE'         // devouring detonates, burning neighbours
    | 'FIRE_SPREAD'             // fire tiles spread to neighbours
    | 'MELEE_REACH_TRADE'       // melee attack reaches further, but loses its push
    /**
     * A straight shot becomes a lobbed one: it arcs over everything in between, at half the
     * reach. Both halves matter. A LINE attack stops at the first unit in the way — including
     * a friendly wall — which is the friction the sprout rule creates every fight: you park
     * Ironhusk in the corridor and she blindfolds whoever is standing behind her. LOB ignores
     * what is in between entirely, but its range is Manhattan distance in every direction, so
     * keeping the number would turn Peaburst's LINE 8 into most of the board.
     * Piercing skills are left alone — see applyFusionToSkill.
     */
    | 'ARC_ATTACK'
    /**
     * The hero's PAID skill also strikes the four tiles around its target. Deliberately not
     * the basic attack: free splash every turn is a different, much stronger game.
     */
    | 'SKILL_SPLASH'
    | 'STEADFAST'               // -1 incoming damage, immune to collision damage, plugs spawn holes painlessly
    | 'ON_HIT_SLOW'             // attacks apply SLOW
    // --- The palette for the four new heroes' rows (PLAN-heroes-9.md). ---
    /**
     * Every tile this hero's attack passes through is left spiked for a turn.
     * NOTE: data-orphaned since the Cactus gear retired with Thornquill (PLAN-hero-zephyr) —
     * the engine still resolves it (the Spike Trap ITEM keeps spike fields alive), so a future
     * recipe can pick it back up, but no recipe grants it today.
     */
    | 'SPIKE_TRAIL'
    /** Adds tiles to every push this hero causes. The Spring Arm axis. */
    | 'PUSH_DISTANCE'
    // --- The Rotor Wing axes (PLAN-hero-zephyr §4: each gear = two traits of its owner). ---
    /** +`value` movement. Reedwing's wings, grafted on: the one axis no fusion touched before. */
    | 'MOVE_BONUS'
    /**
     * This hero's PAID skill also drops dust on the tiles it covered — Smoke Pod's veil,
     * grafted on. Skill-only by construction (the SKILL_SPLASH precedent): a free disarm
     * every turn would be the exact shape the STUN RULE exists to ban.
     */
    | 'SKILL_DISARM'
    /** Attacks leave the target BLEEDING: the next hit against it lands +1. The Steel Jaws axis. */
    | 'BLEED_ON_HIT'
    /**
     * Shields this hero hands out spill over to whoever stands beside the recipient.
     * Replaces SHIELD_BONUS ("+2 size"), which stopped meaning anything when shields became
     * LAYERS (PLAN-hero-zephyr §6.0) — a layer has no size to enlarge, so the pumpkin axis
     * buys COVERAGE instead.
     */
    | 'SHIELD_SPREAD'
    /** Finishing something off raises a fresh layer on this hero. */
    | 'SHIELD_ON_KILL'
    /** Melee attackers are shoved back as well as hurt. */
    | 'RETALIATE_PUSH'
    /** The taunt reaches `value` tiles further. */
    | 'PROVOKE_RADIUS'
    /** Bodies slammed by this hero's pushes take `value` extra collision damage. */
    | 'COLLISION_BONUS'
    /**
     * The melee basic attack lands on EVERY adjacent enemy, not just the one aimed at.
     * NOTE: data-orphaned by the remap pass — no recipe grants it today. Kept for the same
     * reason SPIKE_TRAIL is: the engine resolves it, so a future cell can pick it back up.
     */
    | 'ADJACENT_STRIKE'
    // --- The remap pass (DESIGN-fusion-matrix.md §6). One type per cell that could not be
    //     written with the vocabulary that already existed. ---
    /**
     * Solar Blessing is worth `value` MORE damage than its authored +1. The bonus belongs to
     * the BLESSER's gear but has to be read off the blessed body at swing time, so the cast
     * stamps it onto `Unit.blessPower` exactly as it stamps `blessedElement`.
     */
    | 'BLESS_POWER'
    /**
     * The hero's PAID ally-buff lands on every ally within 2 tiles of where it was aimed,
     * not just the one body. The "move range 2" diamond — the same Manhattan reach every
     * other range in the game is measured in. Gated on the skill having no DAMAGE, so it can
     * never turn an attack into an area attack; that is SKILL_SPLASH's job and its price.
     */
    | 'SKILL_AURA'
    /**
     * SUPPORT SHOT. When one of the SQUAD'S attacks shoves an enemy, this hero puts a pea
     * into it for 1 — if she can see it down a clear row from where she stands. Her own
     * turn is not spent: it is the shove that pays. Once per body per cast.
     */
    | 'OVERWATCH_SHOT'
    /** Anything this hero's shots HURT turns on her: PROVOKED, pointed at her. */
    | 'PROVOKE_ON_HIT'
    /** Sol income, but only on the turns the wearer is DIGESTING. Snapmaw's window, monetised. */
    | 'SUN_WHILE_DIGESTING'
    /**
     * A free melee claw for 1 damage that works ONLY while digesting — the one action allowed
     * through the helpless window. Outside it she has a better bite, so the fence costs
     * nothing and keeps the card honest.
     */
    | 'DIGEST_CLAW'
    /**
     * A hit landing on a body at FULL health pins it (STUN).
     *
     * The STUN RULE's one written exception, and the condition is what earns it: it fires
     * once per body, ever — the second bite meets a wounded target and does nothing — and
     * only for a melee hero who had to walk into contact to try. That is the opposite shape
     * to the ban's target (a free stun EVERY turn, forever).
     */
    | 'STUN_ON_FULL_HP'
    /**
     * The hero's PAID damaging skill also stuns what it hits. Skill-only by construction, the
     * SKILL_SPLASH precedent: one pin per cast, bought with Sol.
     */
    | 'SKILL_STUN'
    /** Wing Guns add the cell BETWEEN the pair — a third rocket, down the middle. */
    | 'WING_MIDSHOT'
    /** Melee attackers are left BLEEDING: the next hit against them lands +1. */
    | 'RETALIATE_BLEED'
    /** The paid SHIELD skill also blows every enemy beside the caster a tile back. */
    | 'SKILL_REPEL'
    /**
     * Layers this hero hands out are spiked glass: whoever BREAKS one is left bleeding.
     * Marked on the shielded body (`Unit.shieldBarbed`) at grant time, spent when the layer
     * goes — so it belongs to the layer, not to whoever happens to be standing nearby.
     */
    | 'BARBED_SHIELD'
    /**
     * This body walks onto the board already wearing a layer. Applied in `utils/unitFactory`,
     * the one place every unit the game puts on a board is built — so it lands on the scripted
     * tutorial squad and the rolled one through the same door, once per battle.
     */
    | 'START_SHIELDED'
    /**
     * The blessing's ring: everything standing beside the BLESSED body is shoved a tile away
     * from it — ally, enemy and the blesser herself. Spacing is the payload, not damage, which
     * is what makes it the answer to a chain-lightning boss.
     */
    | 'BLESS_SHOCKWAVE'
    /**
     * ONCE PER BATTLE: the blow that would kill this body raises a layer instead, and the
     * layer eats it whole. Deliberately not `SHIELD_ON_KILL` — a tank that finishes things
     * would re-shell every other turn, and a shield you always have is armour with extra
     * steps. This one fires when it matters and then never again this fight.
     */
    | 'LAST_STAND_SHIELD'
    /**
     * skill version dusts an AREA (every tile the cast covered, three turns), which on a free
     * action would be a wall raised every turn. This dusts ONE tile, for ONE turn, under a body
     * the hero already had to hit — and dust cancels a SWING, never a turn: the zombie still
     * walks, still telegraphs, and can simply step out of the cloud. That puts it level with
     * `ON_HIT_PUSH`, which denies an attack by moving the body instead of blinding it.
     */
    | 'SMOKE_ON_HIT'
    // --- New capped fusion effect types ---
    | 'BLESS_RETALIATE'
    | 'DIGEST_RETALIATE'
    | 'DASH_DISTANCE'
    | 'ARMOR_SHRED'
    | 'REACTIVE_SHIELD'
    | 'NEEDLE_BURST'
    | 'WIND_PROVOKE'
    | 'PROVOKE_SHIELD'
    | 'FLYER_REPEL'
    | 'ENCASE_RANGE'
    | 'LASER_NEEDLE'
    | 'BLEED_EXECUTION'
    | 'HARVEST_SHIELD'
    | 'SHIELD_ON_SKILL_KILL'
    | 'SHIELD_ON_DIGEST'
    | 'DIGEST_MOVE'
    | 'DIGEST_STEADFAST'
    | 'THORN_LUNGE';

export interface FusionEffect {
    type: FusionEffectType;
    value?: number;
    // `cap` is gone with the shield numbers it policed: a LAYER (PLAN-hero-zephyr §6.0) is
    // its own ceiling — you have one or you don't — so no card promises a total any more.
}

/**
 * The three columns of PLAN-heroes-9.md's final table: three ranged, three melee, three
 * support. This is the hero's COMBAT role and is authored per hero, NOT derived from
 * `UNIT_ROLE_MAP[baseClass]` — that map answers a different question (what a plant does on
 * the field) and disagrees on two of them: it calls Cornova and Chardslam TACTICAL, where the
 * roster reads them as the arcing artillery piece and the support that repositions. A
 * player choosing a squad needs the roster's answer.
 */
export type HeroRole = 'RANGED' | 'MELEE' | 'SUPPORT';

export interface HeroDefinition {
    id: HeroId;
    name: string;
    /** Which third of the roster this hero belongs to. Drives the squad-select grouping. */
    role: HeroRole;
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
    /** Melee attackers take this back, with no fusion involved. Thornshell only, so far. */
    retaliateDamage?: number;
    /** Always free — guarantees a hero can act with 0 Sol. */
    basicAttack: Skill;
    /** Costs Sol via Skill.sunCost. */
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
    /**
     * A crate of gear sits in the middle of the board and the horde walks at it exactly as it
     * walks at a Greenspire. Keep it standing to the end and its contents go to your bench.
     *
     * The one objective that moves the FIGHT rather than adding a condition to it: every other
     * entry in this list leaves the horde marching at your Greenspires and asks you to do something
     * on the side. This one re-aims the horde, so the line you would normally hold is in the
     * wrong place — which is the whole reason it is worth having.
     */
    | 'ESCORT_GEAR'
    /** One specific Greenspire is marked; losing its sprout fails the mission outright. */
    | 'PROTECT_HOUSE'
    /** Clear every zombie off the board. Ends the moment the board is empty. */
    | 'KILL_ALL'
    /** Stand on the marked spawn tiles when the clock runs out. */
    | 'BLOCK_SPAWNS'
    /** Hold one specific tile at the end. */
    | 'HOLD_TILE'
    /**
     * Put the boss down. Ends the moment it falls, and fails if the clock beats you to it.
     *
     * Boss nodes used to roll SURVIVE_TURNS, which meant the honest way to "beat" a boss was
     * to keep away from it for seven turns and collect the hero it was holding. Every boss in
     * PLAN-boards-bosses.md is built as a problem to solve; an objective that never asks you
     * to solve it makes the whole table decorative.
     */
    | 'SLAY_BOSS';

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
    /**
     * SLAY_BOSS: which boss this fight is about.
     *
     * Recorded at build time because "the boss is dead" and "there was never a boss" look
     * identical once the fight is running: the engine strips corpses out of the unit list
     * before the objective is ever asked (`remainingUnits`, turnManager), so a check that
     * counted live bosses could not tell a victory from an empty board. It has to remember.
     */
    bossId?: BossId;
    /** PROTECT_HOUSE / HOLD_TILE marker. */
    target?: Position;
    /** BLOCK_SPAWNS markers. */
    targets?: Position[];
    /** ESCORT_GEAR: what is in the crate, so the objective card can name the prize. */
    gearMaterial?: MaterialId;
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
export type HazardType = 'NONE' | 'WIND_GUST' | 'LAVA_FLOW' | 'RAIL_SLIDE'
    /**
     * Old Quarter: a marked tile is hit, then becomes rubble for good. The only hazard whose
     * mark does not wash off — the board the fight ends on is smaller than the one it began
     * on, which is exactly the pressure a boss that acts twice a turn needs.
     */
    | 'COLLAPSE'
    /**
     * Neon Rose: a sweeping searchlight. It deals no damage and changes no ground — it picks
     * out whoever is standing in the beam and points the whole horde at them for a turn.
     */
    | 'SPOTLIGHT'
    /**
     * The Grid: every live tile discharges at once, plus one tile out. The sector's reward and
     * its hazard are the same square.
     */
    | 'SURGE'
    /**
     * Windward: the sea comes up over the marked shore for two turns and then goes back out.
     * The only hazard that DELETES ground rather than pricing it — and the only one whose
     * effect is undone on a clock, which is why the tile has to remember what it used to be.
     */
    | 'TIDE'
    /**
     * Thornwaste: a blown patch of dust. It deals nothing and blocks nothing; whatever ends
     * its turn inside it simply cannot line up a swing. The sector's question is not "where
     * is it safe to stand" but "where can anything see from".
     */
    | 'DUST_VEIL';

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
    /** Element per hero for this run. Absent = base form. Optional so old saves still load. */
    heroElements?: Partial<Record<HeroId, ElementId>>;
}

/** Progress that persists across runs. Stored separately from Admin config. */
export interface UnlockState {
    heroes: HeroId[];
    materials: MaterialId[];
    /**
     * Commander XP, total, ever. The one number meta-progression runs on: `levelFromXp`
     * turns it into a level, and every level pays a fusion recipe plus — on the levels named
     * in HERO_UNLOCKS — a hero. Paid out at the END of a run, from how that run went, so a
     * run that ends in defeat still moves the save forward.
     */
    xp: number;
    deepestChapter: number;
    runsWon: number;
    /**
     * Bosses beaten across the whole save, BY NAME. Which one fell is what matters now: the
     * hero a boss frees is the answer to the threat that boss is, so "the Yeti is down" and
     * "three bosses are down" are different facts and only the first one can pay Frostpod.
     */
    bossesBeaten: BossId[];
    /**
     * How many have fallen, kept for stats and for old saves. Derived from `bossesBeaten` on
     * every write; nothing reads it to decide an unlock.
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
    /**
     * Every ground this save has ever set foot on: WorldType names plus the 'BREACH'
     * pseudo-sector. First arrival is the moment — it permanently unlocks that sector's
     * item (data/items.ts SECTOR_ITEM) and hands one free copy to the run that walked in.
     * Missing on old saves; utils/persistence.ts derives it from bossesBeaten, because a
     * beaten boss proves its ground was walked.
     */
    sectorsVisited?: string[];
}

export interface UnitDefinition {
    class: UnitClass;
    name: string;
    maxHp: number;
    damage: number;
    moveRange: number;
    /** Reach of its attack. Omitted means 1 — melee. */
    attackRange?: number;
    /** Helmet armour — see Unit.armor. Data lives here so the codex can print it. */
    armor?: number;
    imgUrl: string;
    movementType: MovementType;
    immunities: UnitImmunity[];
    cost: number; // For Squad Selection
    maxStats: { hp: number; dmg: number; move: number; cdr: number };
    upgradeCosts: { hp: number; dmg: number; move: number; cdr: number };
    // `evolvesTo`/`evolutionCost` đã bỏ cùng đợt dọn cây: cả ba đích tiến hoá đều là cây bị
    // xoá, và cơ chế này đổi thẳng `class` của unit — nghĩa là biến một hero thành cây thường.
}

export type SkillRangeType = 'LINE' | 'LOB' | 'MELEE' | 'ADJACENT' | 'SELF' | 'DASH' | 'RADIUS'
    /**
     * Reedwing's Wing Guns: the eight knight's-move tiles, read as FOUR DIRECTED PAIRS — pick a
     * direction, both wing tiles of that direction fire at once (2 ahead, ±1 to each side).
     * Aiming either tile of a pair selects the pair; resolution strikes both. The only
     * non-orthogonal reach in the game, which is also why the "diagonal Greenspire nook" map rule
     * (data/maps.ts) is untouched: adjacent diagonals are NOT knight moves.
     */
    | 'WING_PAIR';
export type EffectType = 'DAMAGE' | 'HEAL' | 'SHIELD' | 'STUN' | 'PUSH' | 'PULL' | 'SPAWN' | 'TERRAIN_MOD' | 'PIERCE_ATTACK' |
                         /**
                          * Fires `value` shots instead of one, each rolling on to the next body in the
                          * lane when the one in front of it dies.
                          *
                          * NOT the same thing as PIERCE_ATTACK and deliberately so. Pierce hits every
                          * body in the lane for full damage: its output scales with how many enemies
                          * happen to be lined up, which is why it belongs to a 1-damage free attack and
                          * not to a 50-Sol one. A volley is a FIXED budget of shots that is never wasted
                          * — kill a 2 HP body with one pea and the other two fly past it — so it is
                          * strong into a single fat target and merely efficient into a crowd.
                          *
                          * Damage per shot is the skill's own DAMAGE value, which means the hero's
                          * BONUS_DAMAGE lifts every shot (applyFusionToSkill folds it in before this
                          * resolves): the act upgrade that adds +1 adds +3 to the volley.
                          */
                         'VOLLEY' | 'GLOBAL_PUSH' | 'CHARGE_SUN' | 'RESOURCE_GAIN' | 'REFRESH_ACTION' | 'HYPNOTIZE' | 'BUFF_STAT' |
                         /** Sets the target on fire. */
                         'APPLY_BURN' |
                         /** Halves the target's movement for a turn. Frostpod's baseline. */
                         'APPLY_SLOW' |
                         /**
                          * Forces every enemy in range to come at the caster next turn.
                          * `value` is the radius. Sets PROVOKED + Unit.provokedBy.
                          */
                         'PROVOKE' |
                         /** Leaves spikes on each tile the attack covered. `value` = damage. */
                         'SPIKE_TILE' |
                         /**
                          * Drops dust on the target tile and its four neighbours — the same
                          * `TileData.smoke` the DUST_VEIL hazard writes, so `blinded()` in
                          * turnManager is the one and only reader: whatever ends its turn
                          * inside cannot line up a swing. `value` = turns it hangs.
                          */
                         'DUST_TILE' |
                         /**
                          * Marks the target BLEEDING: the next damage instance against it
                          * lands +1 (added AFTER helmet armour, or armour would eat the whole
                          * point — see calculateDamage), then the wound is spent. Applied
                          * OUTSIDE the STATUS immunity gate on purpose: it is a physical
                          * wound, not mind control, and a gear that goes cold in every boss
                          * fight is not worth a slot.
                          */
                         'APPLY_BLEED' |
                         /**
                          * Chardslam's Vault Toss (ItB's judo throw): grab the adjacent body
                          * and hurl it to the MIRRORED tile (2·caster − target). The landing
                          * is a fall — COLLISION damage, not a DAMAGE effect, which is what
                          * keeps "0 damage is the hero" true while Grand Chard's
                          * COLLISION_BONUS scales the drop for free. Requires the landing
                          * tile to be free (the ItB rule); PUSH immunity refuses the grab.
                          */
                         'TOSS' |
                         /**
                          * Solar Blessing's rider: the ally is BLESSED — +1 damage on their
                          * attacks UNTIL THE END OF THIS PLAYER TURN (bless first, then
                          * swing), and if the blesser carries an element and the ally does
                          * not, the ally's attacks borrow it for the same window
                          * (`Unit.blessedElement`). Turn-scoped by decay in turnManager, so
                          * the loan can never be banked.
                          */
                         'BLESS' |
                         // EVENT EFFECTS
                         // NOTE: GAIN_SUN / HEAL_SQUAD / HEAL_ONE_FULL / LOSE_HP_RANDOM / GAIN_STATS are
                         // retired. Sol still resets to SUN_ON_LEVEL_START every battle. Hero hp used to
                         // reset the same way, but now PERSISTS between battles (buildHeroFromSnapshot
                         // keeps the snapshot's hp) — which is why HEAL_SQUAD_FULL below is back.
                         // Events trade in things that survive: Coin, sprouts, bench plants, items,
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
     * Sol spent to activate. Omitted or 0 means free — every hero's basic attack is free,
     * so a turn is never wasted for lack of Sol. See DESIGN.md section 4.
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
     * Paid in Coin, not Sol. Items are bought between levels, and Sol never leaves the
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
         * tile takes `damage` on the spot. This is what makes the Seed Mine a mine —
         * it used to be an instant 5-damage click, i.e. a cheaper Fire Grenade.
         */
        | 'TRAP'
        /** Hands one spent hero its action back. Needs a valid friendly target to be spent. */
        | 'REFRESH'
        | 'SPIKES'
        | 'HYPNO'
        | 'STRIP_ARMOR'
        /** Restores `damage` health to one wounded ally. The roster's only sustain. */
        | 'HEAL'
        /**
         * The Blight Core. `damage` piercing to EVERYTHING in the square — allies included,
         * bosses capped hard (utils/itemResolution.ts) — and the inner 3x3 becomes lava.
         */
        | 'NUKE';
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
    /**
     * Which named boss this node holds. Only BOSS nodes carry it. Absent on the generated
     * maps of today — the payout falls back to "the first boss not yet beaten" until the two
     * continents exist as real chains.
     */
    bossId?: BossId;
    /**
     * Does clearing this node finish the run? Only ever set to `false`, and only on the
     * Breach's gauntlet.
     *
     * Everywhere else "BOSS node" and "last fight of the run" are the same thing, and the code
     * said so directly (`endsRun = node.type === 'BOSS'`). The Breach is nine boss fights back
     * to back and then Blightlord, so that equation would end the run on the first one and pay
     * out a campaign act for a boss the player had already beaten. The flag says which of the
     * ten is the door out; the other nine are just the hardest corridor in the game.
     */
    endsRun?: boolean;
    /**
     * This CAMPFIRE is one of the Breach's paid camps rather than an ordinary rest.
     *
     * The two rest points are deliberately different economies and this flag is the seam:
     *
     *   A STAGE RUN'S CAMPFIRE is an EVENT — three separate options, take exactly one, and
     *   some of them are free (sleep it off, search the packs). Scarcity is the CHOICE. That
     *   is right for a run that is mostly ordinary battles with a shop in it: the campfire is
     *   a breath, and its cost is the two things you did not pick.
     *
     *   A BREACH CAMP opens after every boss and charges for everything — healing, gear,
     *   items, a graft. Scarcity is the PURSE. That is right for a gauntlet with no shops at
     *   all: it is the only place money means anything, and ten boss fights back to back need
     *   somewhere to convert winnings into survival.
     */
    paidCamp?: boolean;
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
    /** Greenspires that start with their sprout already gone. */
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
     *   3 — run-defining: a sprout, a lost Greenspire, a wager on the next fight
     * Omitted behaves as tier 1. Every event in the table is a random-pool event now — the
     * one that was not, `rest_site`, became the camp screen.
     */
    tier?: 1 | 2 | 3;
}