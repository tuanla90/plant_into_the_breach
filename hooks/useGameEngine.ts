
import { useState, useEffect, useRef, useCallback } from 'react';
import { BattleHeroStats, GameState, HeroId, Unit, TileData, DamageEvent, Position, TurnAction, Projectile, UnitClass, VisualEffect } from '../types';
import { INITIAL_GAME_STATE, INITIAL_BOARD, ANIMATION_CONFIG } from '../constants';
import { sfx, SfxName } from '../utils/audio';

/** Fast-forward multiplier used by the HUD toggle. 1 = authored pacing. */
export const FAST_SPEED = 4;

/**
 * HIT-STOP — the freeze-frame on a heavy hit. One class on <body> so a single flag can
 * pause every looping sprite animation at once (index.css `body.hitstop`); the action loop
 * pauses itself alongside it in APPLY_DAMAGE. Imperative DOM on purpose, exactly like
 * sfx(): this is an ~80ms cosmetic pulse, and routing it through React state would
 * re-render the whole board twice just to pause some pixels.
 */
const HIT_STOP_MS = 80;
let hitStopTimer: ReturnType<typeof setTimeout> | null = null;
const triggerHitStop = (ms: number) => {
    try {
        document.body.classList.add('hitstop');
        if (hitStopTimer) clearTimeout(hitStopTimer);
        hitStopTimer = setTimeout(() => document.body.classList.remove('hitstop'), ms);
    } catch { /* SSR/headless: a missing freeze-frame is not an error */ }
};

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [board, setBoard] = useState<TileData[]>(INITIAL_BOARD);
  const [units, setUnits] = useState<Unit[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);

  // Ref to hold state during async execution to avoid stale closures
  const unitsRef = useRef(units);
  useEffect(() => { unitsRef.current = units; }, [units]);
  // Same stale-closure problem as unitsRef: the async action loop needs to read traps armed
  // after the loop started (a mine placed this turn must trigger this same turn's moves).
  const boardRef = useRef(board);
  useEffect(() => { boardRef.current = board; }, [board]);

  // --- ANIMATION SPEED ---------------------------------------------------
  // A full turn with ~20 zombies used to take 6-9 seconds because every action
  // awaited its own animation. `speed` divides every wait; `skipRef` collapses
  // whatever is left of the current turn to ~0ms. Both live in refs so the
  // already-running async loop sees the change immediately (same reason
  // unitsRef exists).
  const [speed, setSpeedState] = useState<number>(1);
  const speedRef = useRef(1);
  const skipRef = useRef(false);

  const setSpeed = useCallback((n: number) => {
      const clamped = Math.max(0.25, Math.min(16, Number.isFinite(n) && n > 0 ? n : 1));
      speedRef.current = clamped;
      setSpeedState(clamped);
  }, []);

  /** Collapse the remaining waits of the turn currently executing. Auto-resets when it ends. */
  const skipAnimation = useCallback(() => { skipRef.current = true; }, []);

  /** Every duration in the engine goes through here. */
  const scaleMs = (ms: number) => {
      if (skipRef.current) return 0;
      const s = speedRef.current > 0 ? speedRef.current : 1;
      return Math.max(0, (ms || 0) / s);
  };

  /** Wait a scaled duration. */
  const wait = (ms: number) => new Promise(r => setTimeout(r, scaleMs(ms)));
  /** Wait an already-scaled duration (used when the same value drives a CSS transition). */
  const waitExact = (ms: number) => new Promise(r => setTimeout(r, Math.max(0, ms)));

  // --- REWIND TURN (Chrona) -----------------------------------------------
  // PLAN-progression.md: one free rewind per battle, snapshotting exactly ONE moment —
  // the start of the player's turn, AFTER enemy intents are locked. Restoring returns
  // the very board the player mis-clicked on: same intents, same telegraphs, no re-roll.
  // A rewind whose intents change is a slot machine, not an undo button.
  //
  // The snapshot is three refs written inside no-op reducers rather than one object
  // built from `units`/`board` closures, because this hook's async loops taught the
  // same lesson three times already: closures here are stale the moment an await runs.
  // Reading `prev` inside a setter is the one always-fresh source.
  const snapUnitsRef = useRef<Unit[] | null>(null);
  const snapBoardRef = useRef<TileData[] | null>(null);
  const snapGsRef = useRef<Pick<GameState,
      'sun' | 'brainsRemaining' | 'inventory' | 'mission' | 'fallenHeroes' | 'battleStats'> | null>(null);
  const [turnResetsUsed, setTurnResetsUsed] = useState(0);

  /** Photograph the board as it stands right now (start of a player turn). */
  const captureTurnSnapshot = useCallback(() => {
      setUnits(prev => { snapUnitsRef.current = structuredClone(prev); return prev; });
      setBoard(prev => { snapBoardRef.current = structuredClone(prev); return prev; });
      setGameState(prev => {
          snapGsRef.current = {
              sun: prev.sun,
              brainsRemaining: prev.brainsRemaining,
              inventory: [...prev.inventory],
              mission: prev.mission ? { ...prev.mission } : null,
              // A hero can die during the player's OWN turn now (friendly fire, a shove
              // into water) — the rewind must un-record that death too.
              fallenHeroes: [...prev.fallenHeroes],
              // The ledger rewinds with the board: damage the rewind un-dealt must not
              // stay on the report, or the screen inflates exactly when Chrona was used.
              battleStats: structuredClone(prev.battleStats),
          };
          return prev;
      });
  }, []);

  /** Called by App when a battle actually begins (Start Battle): fresh charge + photo. */
  const beginTurnRewindWindow = useCallback(() => {
      setTurnResetsUsed(0);
      captureTurnSnapshot();
  }, [captureTurnSnapshot]);

  /** Chrona's rewind. True if the board went back; false if the button lied. */
  const resetTurn = useCallback((): boolean => {
      if (turnResetsUsed >= 1) return false;
      const su = snapUnitsRef.current, sb = snapBoardRef.current, sg = snapGsRef.current;
      if (!su || !sb || !sg) return false;
      setUnits(structuredClone(su));
      setBoard(structuredClone(sb));
      setGameState(prev => ({
          ...prev,
          ...structuredClone(sg),
          selectedUnitId: null,
          selectedTile: null,
          selectedSkillId: null,
          selectedItemId: null,
          interactionMode: 'IDLE',
          damageEvents: [],
      }));
      setTurnResetsUsed(1);
      return true;
  }, [turnResetsUsed]);

  // Use a ref for shake timer to handle overlaps
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerShake = (durationMs: number = ANIMATION_CONFIG.SHAKE_DURATION) => {
      setGameState(prev => ({ ...prev, shake: true }));
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
      shakeTimeoutRef.current = setTimeout(() => {
          setGameState(prev => ({ ...prev, shake: false }));
      }, Math.max(80, scaleMs(durationMs)));
  };

  // --- VISUAL EFFECT SYSTEM ---
  // Kept out of `gameState` on purpose: these are cosmetic, they churn several times per
  // action, and folding them into game state would make every burst a state write that the
  // turn-snapshot reconcile has to reason about. Projectiles already live outside it too.
  const [effects, setEffects] = useState<VisualEffect[]>([]);

  const EFFECT_MS: Record<VisualEffect['type'], number> = {
      // DROWN runs long on purpose: the ripples have to outlive the death animation, or the
      // water closes before the player has registered what went into it.
      IMPACT: 380, EXPLOSION: 620, SLASH: 300, MUZZLE: 220, PUSH: 420, EMERGE: 700, DROWN: 900,
      HIT_FIRE: 550, HIT_ICE: 500, HIT_ELEC: 480, HEAVY_SHAKE: 600, SHIELD_GRANT: 550, PROVOKE_BURST: 600,
  };

  const addEffect = (x: number, y: number, type: VisualEffect['type'], rotation = 0) => {
      // Floored: below ~120ms an effect is a single frame and reads as a flicker, so
      // fast-forward makes effects brief rather than subliminal.
      const duration = Math.max(120, scaleMs(EFFECT_MS[type]));
      const id = `fx_${Date.now()}_${Math.random()}`;
      setEffects(prev => [...prev, { id, x, y, type, rotation, duration }]);
      // +80ms so the element is not yanked out from under its own closing frame.
      setTimeout(() => setEffects(prev => prev.filter(e => e.id !== id)), duration + 80);
  };

  /** Screen angle from one tile to another. y is the column, so it drives the X axis. */
  const angleBetween = (from: Position, to: Position) =>
      Math.atan2(to.x - from.x, to.y - from.y) * (180 / Math.PI);

  // --- DAMAGE EVENT SYSTEM ---
  const addDamageEvent = (x: number, y: number, amount: number | string, type: DamageEvent['type'] = 'DAMAGE') => {
      const id = Date.now() + Math.random().toString();

      // Trigger Shake
      // CHANGED: Threshold increased to > 3. Basic attacks (2 dmg) won't shake. Heavy hits (4+) will.
      const shouldShake = (type === 'DAMAGE' && typeof amount === 'number' && amount > 3) || type === 'BLOCK' || type === 'BLOCKED';

      if (shouldShake) {
          triggerShake(ANIMATION_CONFIG.SHAKE_DURATION);
      }

      // Add Floating Text
      setGameState(prev => ({
          ...prev,
          damageEvents: [...prev.damageEvents, { id, x, y, amount: amount as number, type }]
      }));

      // Cleanup Floating Text. Scaled too, with a floor so text is never invisible.
      setTimeout(() => {
          setGameState(prev => ({
              ...prev,
              damageEvents: prev.damageEvents.filter(e => e.id !== id)
          }));
      }, Math.max(250, scaleMs(1500)));
  };

  // --- ASYNC TURN EXECUTION ---
  const executeTurnActions = async (actions: TurnAction[], finalState: GameState) => {
      setGameState(prev => ({ ...prev, interactionMode: 'EXECUTING' }));

      // Deltas the engine owns. `finalState` is a snapshot taken before the actions
      // ran, so anything mutated inside the loop has to be re-applied at the end or
      // it gets clobbered. Held on one object so the closures below read live values.
      const turnDelta = {
          sunGained: 0,        // from GAIN_SUN / RESOURCE_GAIN
          brainsAfter: -1,     // authoritative sprout count after BRAIN_LOST; -1 = untouched
          runEnded: false,     // sprouts hit 0
          zombiesKilled: 0,    // from UNIT_DIE, for the KILL_COUNT bonus objective
          // The battle ledger's inbox: TRACK_STAT lines (and engine-counted damageTaken)
          // land here, then fold into gameState.battleStats in the reconcile below — the
          // same clobber-avoidance route Sol and kills already take past `finalState`.
          stats: {} as Partial<Record<HeroId, Partial<BattleHeroStats>>>
      };
      const bumpStat = (heroId: HeroId, stat: keyof BattleHeroStats, amount: number) => {
          const row = (turnDelta.stats[heroId] ??= {});
          row[stat] = (row[stat] ?? 0) + amount;
      };

      for (const action of actions) {
          switch (action.type) {
              case 'WAIT':
                  await wait(action.duration);
                  break;

              case 'NEW_TURN_RESET':
                  sfx('turn-start');
                  setUnits(prev => prev.map(u => ({
                      ...u,
                      hasMoved: false,
                      hasAttacked: false,
                      // Solar Rotor đếm kết liễu THEO LƯỢT. Quên dòng này thì "mỗi lượt một
                      // lần" âm thầm thành "mỗi trận một lần" — cùng cái bẫy `lastStandUsed`.
                      killsThisTurn: 0,
                      isAttacking: false,
                      visualOffset: undefined,
                      prevPosition: undefined, // Reset undo history at start of turn
                      // STUN and BURN last exactly one turn. Nothing used to clear them, so a
                      // stunned zombie was disabled permanently and a burning unit burned to death.
                      // HYPNOTIZED is intentionally kept — that one is meant to be permanent.
                      // DORMANT is absent from this list on purpose: it is scripted content's way of
                      // saying "this unit is out of the fight", and nothing should hand it back.
                      //
                      // ...and STUN/SLOW only for the HORDE. This reset fires at the END of the
                      // enemy turn, which is the right clock for something the PLAYER applied
                      // during their own turn: the zombie skips one turn, then thaws. It is the
                      // wrong clock for the other direction. Anything an ENEMY applies is applied
                      // inside this same call, so it was being erased in the same action batch it
                      // was created in — which is why nothing in the horde has ever been able to
                      // cost a hero a turn. The squad's clock is spent at the top of the next
                      // processTurn instead (see PLAYER STATUS EXPIRY in utils/turnManager.ts).
                      // BURN stays on both sides: it ticks in PHASE 2 for everyone and is billed
                      // there, so its clock is already correct.
                      statusEffects: u.isEnemy
                          ? u.statusEffects.filter(e => e !== 'STUN' && e !== 'BURN' && e !== 'SLOW' && e !== 'ROOTED')
                          : u.statusEffects.filter(e => e !== 'BURN')
                  })));
                  await wait(50);
                  break;

              case 'SPAWN_UNIT':
                  sfx('spawn');
                  if (action.unit?.position) addEffect(action.unit.position.x, action.unit.position.y, 'EMERGE');
                  await wait(100);
                  setUnits(prev => [...prev, action.unit]);
                  await wait(ANIMATION_CONFIG.SPAWN_DURATION);
                  setUnits(prev => prev.map(u => u.id === action.unit.id ? { ...u, spawnDelay: undefined } : u));
                  break;

              case 'MODIFY_TERRAIN':
                  // Spines only announce themselves when they are LAID. The same action carries
                  // the per-turn countdown back to the board (turnManager writes every surviving
                  // field after PHASE 4), so keying the sound off "this action has spikes" would
                  // rattle once per field per turn for as long as the field lived.
                  if (action.spikes && action.spikes.turns > 0
                      && !boardRef.current.find(t => t.x === action.pos.x && t.y === action.pos.y)?.spikes) {
                      sfx('spikes');
                  }
                  setBoard(prev => prev.map(t => {
                      if (t.x === action.pos.x && t.y === action.pos.y) {
                          return {
                              ...t,
                              environment: action.environment !== undefined ? action.environment : t.environment,
                              terrain: action.terrain !== undefined ? action.terrain : t.terrain,
                              // Spines ride on the same action but are neither terrain nor
                              // environment: the ground underneath is untouched. `turns: 0` is
                              // how the expiry writes "this field is over" — storing it would
                              // leave a dead husk that renders as a hazard and hurts nobody.
                              spikes: action.spikes !== undefined
                                  ? (action.spikes.turns > 0 ? action.spikes : undefined)
                                  : t.spikes,
                              // Dust and sea keep the same contract spines do: `turns: 0`
                              // means the field is over, and storing it would leave a husk
                              // that renders as weather and does nothing.
                              smoke: action.smoke !== undefined
                                  ? (action.smoke.turns > 0 ? action.smoke : undefined)
                                  : t.smoke,
                              flood: action.flood !== undefined
                                  ? (action.flood.turns > 0 ? action.flood : undefined)
                                  : t.flood,
                              // A Greenspire's shell layer (Reinforce): raised true, bitten false.
                              shielded: action.shielded !== undefined ? action.shielded : t.shielded,
                          };
                      }
                      return t;
                  }));
                  // Slight delay for visual update
                  await wait(100);
                  break;

              case 'UNIT_ATTACK':
                  const attacker = unitsRef.current.find(u => u.id === action.unitId);

                  if (attacker) {
                      // Mark attacked, prevents Undo
                      setUnits(prev => prev.map(u => u.id === action.unitId ? { ...u, hasAttacked: true, hasMoved: true } : u));

                      if (action.targetPos) {
                          // Driven by the skill's range, not a hardcoded class list — adding a new
                          // unit no longer requires editing the engine to get the right animation.
                          const range = action.attackRange;
                          const isMelee = !range || range === 'MELEE' || range === 'ADJACENT' || range === 'SELF' || range === 'DASH';
                          const isLob = range === 'LOB';

                          // Determine exact sound for specific attack types (bite, claw, throw, lob, shot, arc, explosion)
                          let attackSfx: SfxName = 'attack-shot';
                          const actAny = action as Record<string, any>;
                          const skillId = String(actAny.skillId || '');
                          const effectType = String(actAny.effectType || '');
                          if (action.isArc) {
                              attackSfx = 'arc';
                          } else if (skillId === 'cw_vault_toss' || effectType === 'TOSS') {
                              attackSfx = 'attack-throw';
                          } else if (skillId.includes('bite') || skillId.includes('devour') || skillId === 'cz_bite') {
                              attackSfx = 'attack-bite';
                          } else if (skillId.includes('claw') || skillId.includes('swipe')) {
                              attackSfx = 'attack-claw';
                          } else if (skillId === 'sf_sunburn' || skillId === 'nuke') {
                              attackSfx = 'explosion';
                          } else if (isLob) {
                              attackSfx = 'attack-lob';
                          } else if (isMelee) {
                              attackSfx = 'attack-melee';
                          }
                          sfx(attackSfx);

                          // A swing lands on the target; a shot flashes at the muzzle. Both
                          // point along the line of attack, which is what sells the direction
                          // when the sprite itself never turns to face anything.
                          const aim = angleBetween(attacker.position, action.targetPos);
                          if (isMelee) addEffect(action.targetPos.x, action.targetPos.y, 'SLASH', aim);
                          else addEffect(attacker.position.x, attacker.position.y, 'MUZZLE', aim);

                          const dx = action.targetPos.x - attacker.position.x;
                          const dy = action.targetPos.y - attacker.position.y;
                          // Enemy (Zombie) faces left (negative y direction). Plant faces right (positive y direction).
                          const shouldFlip = attacker.isEnemy ? dy > 0 : dy < 0;

                          if (isMelee) {
                              // --- MELEE ANIMATION (Step & Retract) ---
                              // Lunge towards target
                              const lungeX = dx * 0.4;
                              const lungeY = dy * 0.4;

                              setUnits(prev => prev.map(u => u.id === action.unitId ? { ...u, isAttacking: true, visualOffset: { x: lungeX, y: lungeY }, flipX: shouldFlip } : u));
                              await wait(ANIMATION_CONFIG.ATTACK_LUNGE_DURATION);

                              if (attacker.element === 'FIRE') addEffect(action.targetPos.x, action.targetPos.y, 'HIT_FIRE');
                              else if (attacker.element === 'ICE') addEffect(action.targetPos.x, action.targetPos.y, 'HIT_ICE');
                              else if (attacker.element === 'LIGHTNING') addEffect(action.targetPos.x, action.targetPos.y, 'HIT_ELEC');

                              // Retract
                              setUnits(prev => prev.map(u => u.id === action.unitId ? { ...u, visualOffset: { x: 0, y: 0 }, flipX: undefined } : u));
                              await wait(100);
                          } else {
                              // --- PROJECTILE ANIMATION ---
                              // Recoil slightly away from target
                              const recoilX = -dx * 0.15;
                              const recoilY = -dy * 0.15;
                              setUnits(prev => prev.map(u => u.id === action.unitId ? { ...u, isAttacking: true, visualOffset: { x: recoilX, y: recoilY }, flipX: shouldFlip } : u));

                              let projType: Projectile['type'] = 'PEA';
                              if (attacker.class === UnitClass.CORN_MORTAR) projType = 'CORN';

                              const pid = `proj_${Date.now()}_${Math.random()}`;
                              // Calculate pixel-perfect centers (12.5% per tile, center is +6.25%)
                              const startX = attacker.position.y * 12.5 + 6.25;
                              const startY = attacker.position.x * 12.5 + 6.25;
                              const targetX = action.targetPos.y * 12.5 + 6.25;
                              const targetY = action.targetPos.x * 12.5 + 6.25;

                              // Distance calculation for variable speed
                              const dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

                              // Calculate Duration: Min 300ms, then add distance factor
                              let duration = Math.max(ANIMATION_CONFIG.PROJECTILE_MIN_DURATION, dist * ANIMATION_CONFIG.PROJECTILE_SPEED * 2);
                              if (isLob) duration *= 1.5; // Lobbed takes longer
                              duration = Math.min(duration, ANIMATION_CONFIG.PROJECTILE_MAX_DURATION); // Cap max
                              // The same number drives the CSS transition and the await, so it has
                              // to be scaled once, here — not divided again by `wait`.
                              const flightMs = scaleMs(duration);

                              const angle = Math.atan2(action.targetPos.x - attacker.position.x, action.targetPos.y - attacker.position.y) * (180 / Math.PI);

                              // 1. Create
                              setProjectiles(prev => [...prev, {
                                  id: pid,
                                  startX, startY,
                                  currentX: startX, currentY: startY,
                                  rotation: angle,
                                  type: projType,
                                  isLobbed: isLob
                              }]);

                              // Force Reflow/Render
                              await wait(20);

                              // Reset recoil/flip quickly
                              setTimeout(() => {
                                  setUnits(prev => prev.map(u => u.id === action.unitId ? { ...u, visualOffset: { x: 0, y: 0 }, flipX: undefined } : u));
                              }, scaleMs(80));

                              // 2. Move (Trigger CSS Transition)
                              setProjectiles(prev => prev.map(p => p.id === pid ? { ...p, currentX: targetX, currentY: targetY, duration: flightMs } : p));

                              // Wait exact duration minus a tiny buffer to prevent hanging
                              await waitExact(flightMs);

                              // 3. Remove
                              setProjectiles(prev => prev.filter(p => p.id !== pid));

                              if (attacker.element === 'FIRE') addEffect(action.targetPos.x, action.targetPos.y, 'HIT_FIRE');
                              else if (attacker.element === 'ICE') addEffect(action.targetPos.x, action.targetPos.y, 'HIT_ICE');
                              else if (attacker.element === 'LIGHTNING') addEffect(action.targetPos.x, action.targetPos.y, 'HIT_ELEC');
                          }
                      }
                  } else {
                      // Fallback
                      await wait(200);
                  }
                  break;

              case 'APPLY_DAMAGE':
                  addDamageEvent(action.pos.x, action.pos.y, action.amount, action.eventType);

                  // The victim's line of the battle ledger. Counted off the wire rather than
                  // emitted at a source, because the victim needs no attribution — the action
                  // already names them.
                  if (action.eventType === 'DAMAGE' && (action.amount || 0) > 0) {
                      const victim = unitsRef.current.find(u => u.id === action.targetId);
                      if (victim && !victim.isEnemy && victim.heroId) {
                          bumpStat(victim.heroId, 'damageTaken', action.amount || 0);
                      }
                  }

                  // The floating number and the sound describe the same beat, so they are
                  // chosen from the same field. Currency pickups are deliberately silent
                  // here — GAIN_SUN and the shop own those, and doubling up sounds broken.
                  switch (action.eventType) {
                      case 'HEAL': sfx('heal'); break;
                      case 'BLOCK':
                      case 'BLOCKED':
                      case 'IMMUNE': sfx('hit-blocked'); break;
                      case 'DROWN': sfx('splash'); sfx('drown'); break;
                      case 'BURN': sfx('hit-fire'); break;
                      case 'MISS':
                      case 'SUN': case 'COIN': case 'DIAMOND': case 'BUFF': case 'EMERGE': break;
                      default: if (action.amount > 0) sfx(action.amount >= 4 ? 'hit-heavy' : 'hit');
                  }

                  if (action.eventType === 'DROWN') {
                      addEffect(action.pos.x, action.pos.y, 'DROWN');
                  } else if (action.eventType === 'BURN') {
                      addEffect(action.pos.x, action.pos.y, 'HIT_FIRE');
                  } else if (typeof action.amount === 'number' && action.amount > 0
                      && !['SUN', 'COIN', 'DIAMOND', 'BUFF', 'EMERGE', 'MISS'].includes(action.eventType)) {
                      if (action.amount >= 5) {
                          addEffect(action.pos.x, action.pos.y, 'HEAVY_SHAKE');
                      } else if (action.amount >= 4) {
                          addEffect(action.pos.x, action.pos.y, 'EXPLOSION');
                      } else {
                          addEffect(action.pos.x, action.pos.y, 'IMPACT');
                      }
                  }

                  setUnits(prev => prev.map(u => {
                      if (u.id === action.targetId) {
                          // DROWN belongs on this list: the water is what kills, and the
                          // UNIT_DIE action right behind it removes the unit. Letting it fall
                          // through would subtract its (zero) amount for no reason.
                          if (['SUN', 'COIN', 'DIAMOND', 'BUFF', 'EMERGE', 'IMMUNE', 'BLOCKED', 'DROWN'].includes(action.eventType)) return u;

                          if (action.eventType === 'HEAL') return { ...u, hp: Math.min(u.maxHp, u.hp + action.amount) };
                          // 'MISS' is a whiff — it must not touch the unit at all. This used to
                          // apply STUN, which would have silently frozen whatever it hit.
                          if (action.eventType === 'MISS') return u;

                          // Ice breaks when you hit it. FREEZE has no timer — NEW_TURN_RESET
                          // clears STUN/BURN/SLOW but deliberately not this — so without a
                          // thaw it disabled a unit permanently. Taking a hit is the release,
                          // which is also what makes freezing a *choice*: shoot it and you
                          // undo your own crowd control.
                          const thawed = action.amount > 0
                              ? u.statusEffects.filter(e => e !== 'FREEZE')
                              : u.statusEffects;
                          return { ...u, hp: u.hp - action.amount, statusEffects: thawed };
                      }
                      return u;
                  }));

                  /**
                   * HIT-STOP: a heavy hit (the EXPLOSION tier above, >=4) holds the whole
                   * frame for one beat while the victim flashes white and crumples
                   * (UnitComponent reads isHitFlashing). The hold is real on both axes:
                   * `body.hitstop` pauses every sprite animation (index.css) and the action
                   * loop itself waits, so the freeze-frame cannot be walked over by the
                   * next action. Units only — a nuked empty tile has nothing to punch.
                   */
                  if (action.eventType === 'DAMAGE' && (action.amount || 0) >= 4 && action.targetId !== 'tile') {
                      setUnits(prev => prev.map(u => u.id === action.targetId ? { ...u, isHitFlashing: true } : u));
                      triggerHitStop(HIT_STOP_MS);
                      await wait(HIT_STOP_MS);
                      setUnits(prev => prev.map(u => u.id === action.targetId ? { ...u, isHitFlashing: false } : u));
                  }

                  setUnits(prev => prev.map(u => ({ ...u, isAttacking: false })));
                  await wait(100);
                  break;

              case 'UNIT_DIE': {
                  // Count it for the KILL_COUNT bonus objective before the unit is gone —
                  // afterwards there is no way to tell whether it was an enemy.
                  const dying = unitsRef.current.find(u => u.id === action.unitId);
                  if (dying?.isEnemy) {
                      // Counted on turnDelta as well as in state: the live update keeps the HUD
                      // ticking during the animation, but `finalState` predates this loop and
                      // would clobber `mission` at the end — so the total is re-applied there.
                      turnDelta.zombiesKilled += 1;
                      setGameState(prev => prev.mission
                          ? { ...prev, mission: { ...prev.mission, zombiesKilled: prev.mission.zombiesKilled + 1 } }
                          : prev);
                  }
                  sfx(dying?.isEnemy ? 'die-enemy' : 'die-plant');
                  setUnits(prev => prev.map(u => u.id === action.unitId ? { ...u, isDying: true } : u));
                  await wait(ANIMATION_CONFIG.DEATH_DURATION);
                  setUnits(prev => prev.filter(u => u.id !== action.unitId));
                  break;
              }

              // --- MOVEMENT ---
              case 'UNIT_MOVE':
                  const unitToMove = unitsRef.current.find(u => u.id === action.unitId);

                  if (unitToMove && action.path.length > 0) {

                      // SAVE PREVIOUS POSITION FOR UNDO (If not forced movement)
                      if (!action.isForced) {
                          setUnits(prev => prev.map(u => u.id === action.unitId ? { ...u, prevPosition: u.position } : u));
                      } else {
                          // ONE thud per body shoved, not one per tile travelled. Chardslam throws
                          // two tiles and his Sweep throws four bodies at once; per-tile would be
                          // eight impacts for a single click and would drown the turn.
                          sfx('push');
                      }

                      // Process each tile in the path sequentially
                      let from = unitToMove.position;
                      for (const step of action.path) {
                          // Being shoved is not walking. A forced move gets motion streaks and
                          // no footstep, so a knockback cannot be mistaken for the unit choosing
                          // to walk there — which matters, because push damage and collisions
                          // hang off it.
                          if (action.isForced) addEffect(step.x, step.y, 'PUSH', angleBetween(from, step));
                          else sfx('step');
                          from = step;
                          // 1. Update Position
                          setUnits(prev => prev.map(u => {
                              if (u.id === action.unitId) {
                                  // Update intent target relative to self if currently targeting
                                  let updatedIntent = u.intent;
                                  if (u.intent?.type === 'ATTACK' && u.intent.target) {
                                       const dx = step.x - u.position.x;
                                       const dy = step.y - u.position.y;
                                       updatedIntent = { ...u.intent, target: { x: u.intent.target.x + dx, y: u.intent.target.y + dy } };
                                  }
                                  return { ...u, position: step, intent: updatedIntent };
                              }
                              return u;
                          }));

                          // 2. Wait for animation
                          await wait(ANIMATION_CONFIG.MOVE_STEP_DURATION);

                          // 3. TRAP CHECK — here, mid-path, because "the first zombie to STEP
                          // on it" includes walking across, not just stopping there. All ways
                          // of arriving on a tile (walk, shove, gust, hazard) are UNIT_MOVE
                          // actions, so this one hook covers every one of them. Fliers drift
                          // over it, exactly as in PvZ.
                          const trapped = boardRef.current.find(t => t.x === step.x && t.y === step.y)?.trap;
                          const stepper = unitsRef.current.find(u => u.id === action.unitId);
                          if (trapped && stepper && stepper.isEnemy && stepper.movementType !== 'FLYING') {
                              setBoard(prev => prev.map(t =>
                                  t.x === step.x && t.y === step.y ? { ...t, trap: undefined } : t));
                              sfx('explosion');
                              addEffect(step.x, step.y, 'EXPLOSION');
                              triggerShake();
                              addDamageEvent(step.x, step.y, trapped.damage, 'DAMAGE');
                              // The mine detonation bypasses APPLY_DAMAGE (traps are an
                              // engine rule, not an action), so it buys its hit-stop here —
                              // a 5-damage boom without the freeze-frame read as weaker
                              // than a 4-damage skill hit with one.
                              const hpAfter = stepper.hp - trapped.damage;
                              setUnits(prev => prev.map(u => u.id === action.unitId ? { ...u, hp: hpAfter, isHitFlashing: true } : u));
                              triggerHitStop(HIT_STOP_MS);
                              await wait(HIT_STOP_MS);
                              setUnits(prev => prev.map(u => u.id === action.unitId ? { ...u, isHitFlashing: false } : u));
                              await wait(ANIMATION_CONFIG.DEATH_DURATION);
                              if (hpAfter <= 0) {
                                  // The mine ends the walk as well as the walker. Counted like
                                  // any other kill so KILL_COUNT and KILL_ALL both see it.
                                  turnDelta.zombiesKilled += 1;
                                  setGameState(prev => prev.mission
                                      ? { ...prev, mission: { ...prev.mission, zombiesKilled: prev.mission.zombiesKilled + 1 } }
                                      : prev);
                                  sfx('die-enemy');
                                  setUnits(prev => prev.map(u => u.id === action.unitId ? { ...u, isDying: true } : u));
                                  await wait(ANIMATION_CONFIG.DEATH_DURATION);
                                  setUnits(prev => prev.filter(u => u.id !== action.unitId));
                                  break;
                              }
                          }
                      }

                      // Finalize state
                      if (!action.isForced) {
                          setUnits(prev => prev.map(u => u.id === action.unitId ? { ...u, hasMoved: true } : u));
                      }
                  }
                  break;

              case 'UPDATE_INTENT':
                  setUnits(prev => prev.map(u => u.id === action.unitId ? { ...u, intent: action.intent } : u));
                  break;

              case 'UPDATE_UNIT_STATE': {
                  // Two of the nine-hero mechanics move no unit and deal no damage, so this
                  // bookkeeping action is the only place they exist. Without a sound they are
                  // the quietest things in the game despite being among the loudest decisions.
                  const before = unitsRef.current.find(u => u.id === action.unitId);
                  if (before && action.updates?.statusEffects?.includes('PROVOKED')
                      && !before.statusEffects.includes('PROVOKED')) {
                      sfx('taunt');
                      addEffect(before.position.x, before.position.y, 'PROVOKE_BURST');
                  }
                  if (before && typeof action.updates?.shield === 'number'
                      && action.updates.shield > (before.shield ?? 0)) {
                      sfx('shield');
                      addEffect(before.position.x, before.position.y, 'SHIELD_GRANT');
                  }
                  if (before && action.updates?.statusEffects
                      && (['SLOW', 'FREEZE'] as const).some(s =>
                          action.updates!.statusEffects!.includes(s) && !before.statusEffects.includes(s))) {
                      sfx('hit-ice');
                      addEffect(before.position.x, before.position.y, 'HIT_ICE');
                  }
                  setUnits(prev => prev.map(u => u.id === action.unitId ? { ...u, ...action.updates } : u));
                  break;
              }

              case 'RESOURCE_GAIN':
                  if (action.resource === 'SUN') {
                       turnDelta.sunGained += (action.amount || 0);
                       setGameState(prev => ({ ...prev, sun: prev.sun + (action.amount || 0) }));
                  }
                  break;

              // --- IN-COMBAT SUN INCOME (DESIGN.md section 4) ---
              // Zombie kills and passive generators. `pos` is optional: pass it to get
              // the floating "+N sun" over the tile that produced it.
              case 'GAIN_SUN': {
                  const gain = action.amount || 0;
                  if (gain !== 0) {
                      turnDelta.sunGained += gain;
                      setGameState(prev => ({ ...prev, sun: Math.max(0, prev.sun + gain) }));
                  }
                  if (action.pos) {
                      sfx('gain-sun');
                      addDamageEvent(action.pos.x, action.pos.y, gain, 'SUN');
                      await wait(80);
                  }
                  break;
              }

              // --- A ZOMBIE ATE A BRAIN (DESIGN.md section 1) ---
              // This is the single most expensive thing that can happen in a run, so it
              // gets the loudest feedback in the engine: long shake, red floating text,
              // and a beat of silence before the zombie leaves the board.
              case 'BRAIN_LOST': {
                  const eater = unitsRef.current.find(u => u.id === action.unitId);
                  const pos: Position | undefined = action.pos || eater?.position;

                  // 1. The Greenspire goes dark.
                  if (pos) {
                      setBoard(prev => prev.map(t =>
                          (t.x === pos.x && t.y === pos.y) ? { ...t, hasBrain: false } : t
                      ));
                  }

                  // 2. Loud feedback. 'DAMAGE' with a string renders as "-BRAIN" in red.
                  sfx('sprout-lost');
                  triggerShake(ANIMATION_CONFIG.SHAKE_DURATION * 2);
                  if (pos) addDamageEvent(pos.x, pos.y, 'BRAIN', 'DAMAGE');

                  // 3. Run budget. Engine is authoritative here — see the reconcile below.
                  setGameState(prev => {
                      const next = Math.max(0, (prev.brainsRemaining || 0) - 1);
                      turnDelta.brainsAfter = next;
                      if (next <= 0) turnDelta.runEnded = true;
                      return { ...prev, brainsRemaining: next };
                  });

                  await wait(ANIMATION_CONFIG.SHAKE_DURATION);

                  // 4. The zombie leaves the field. It did NOT die — no death animation,
                  //    no kill reward.
                  if (action.unitId) {
                      setUnits(prev => prev.filter(u => u.id !== action.unitId));
                  }
                  await wait(120);
                  break;
              }

              // A ledger line from a resolver. Pure bookkeeping: no sound, no effect, no wait.
              case 'TRACK_STAT':
                  if (action.heroId && action.stat && (action.amount || 0) > 0) {
                      bumpStat(action.heroId, action.stat, action.amount || 0);
                  }
                  break;
          }
      }

      setGameState(prev => {
          let resolvedScreen = finalState.screen;
          if (prev.screen === 'SQUAD_SELECT') resolvedScreen = 'SQUAD_SELECT';
          else if (prev.screen === 'VICTORY' && resolvedScreen === 'COMBAT') resolvedScreen = 'VICTORY';
          // Out of sprouts beats every other outcome, including a level that "completed".
          if (turnDelta.runEnded) resolvedScreen = 'GAME_OVER';

          // `finalState` predates the loop. Re-apply what the loop owns:
          //  - sprouts only ever go down, so min() is safe whether or not the turn
          //    resolver already accounted for the loss.
          //  - Sol income arrives exclusively as GAIN_SUN / RESOURCE_GAIN actions;
          //    finalState carries only what was *spent*.
          const resolvedBrains = turnDelta.brainsAfter < 0
              ? finalState.brainsRemaining
              : Math.min(finalState.brainsRemaining, turnDelta.brainsAfter);

          // Kills are counted inside the loop, so they live on turnDelta for the same reason
          // Sol does. `finalState.mission` still carries anything processTurn decided (e.g.
          // marking the objective failed), so fold the delta onto that rather than onto prev.
          const resolvedMission = finalState.mission
              ? { ...finalState.mission, zombiesKilled: finalState.mission.zombiesKilled + turnDelta.zombiesKilled }
              : finalState.mission;

          // The ledger folds in additively, like Sol: `finalState` predates the loop, so it
          // carries every earlier batch's totals and this batch's inbox is added on top.
          let resolvedStats = finalState.battleStats;
          const inbox = Object.entries(turnDelta.stats) as Array<[HeroId, Partial<BattleHeroStats>]>;
          if (inbox.length > 0) {
              resolvedStats = { ...(finalState.battleStats ?? {}) };
              inbox.forEach(([heroId, d]) => {
                  const cur = resolvedStats![heroId] ?? {
                      damageDealt: 0, kills: 0, pushes: 0, intentsCancelled: 0, damageTaken: 0,
                  };
                  resolvedStats![heroId] = {
                      damageDealt: cur.damageDealt + (d.damageDealt ?? 0),
                      kills: cur.kills + (d.kills ?? 0),
                      pushes: cur.pushes + (d.pushes ?? 0),
                      intentsCancelled: cur.intentsCancelled + (d.intentsCancelled ?? 0),
                      damageTaken: cur.damageTaken + (d.damageTaken ?? 0),
                  };
              });
          }

          return {
              ...finalState,
              brainsRemaining: resolvedBrains,
              sun: Math.max(0, finalState.sun + turnDelta.sunGained),
              mission: resolvedMission,
              battleStats: resolvedStats,
              screen: resolvedScreen,
              interactionMode: 'IDLE',
              // IDLE means "nothing is being aimed", so the aim has to be dropped with it.
              // `finalState` is the pre-execution snapshot, and the skill path builds it as
              // `{...gameState, sun: ...}` — so a skill fired here stayed selected forever
              // while the mode said IDLE. Nothing SHOWED it (targeting highlights need
              // TARGETING), but click-to-move is gated on `!selectedSkillId`, so the first
              // click on empty ground after any attack silently deselected the hero instead
              // of moving her, for the rest of the battle. Cleared here rather than in each
              // caller because this is the one place every action path funnels through.
              selectedSkillId: null,
              selectedItemId: null,
              // Taken from `prev`, NOT from the snapshot. A hero who dies during this loop is
              // recorded by an effect in App while the loop is still running, and `finalState`
              // predates all of it — so spreading it here rolled the list back to empty and
              // the hero was simply gone from the run: not on the board, not revivable, not
              // anywhere. Same reason damageEvents is read from `prev`.
              fallenHeroes: prev.fallenHeroes,
              damageEvents: prev.damageEvents
          };
      });

      setUnits(prev => prev.map(u => ({ ...u, isAttacking: false, visualOffset: undefined })));

      // A NEW_TURN_RESET in this batch means a fresh player turn just began — enemy
      // intents re-planned and locked. That is the one moment the rewind photographs.
      // Taken AFTER the cleanup writes above, so the photo holds the same board the
      // player is about to click on, not one mid-teardown.
      if (actions.some(a => a.type === 'NEW_TURN_RESET')) {
          captureTurnSnapshot();
      }

      // Skip is per-turn: the next turn plays at the chosen speed again.
      skipRef.current = false;
  };

  return {
      gameState,
      setGameState,
      board,
      setBoard,
      units,
      setUnits,
      projectiles,
      effects,
      addDamageEvent,
      addEffect,
      executeTurnActions,
      // --- Chrona's rewind (wire to ActionPanel) ---
      turnResetsUsed,
      resetTurn,
      beginTurnRewindWindow,
      // --- pacing controls (wire to HUD) ---
      speed,
      setSpeed,
      skipAnimation
  };
};
