
import { Unit, TileData, GameState, UnitClass, UnitType, UnitDefinition, Position, TerrainDefinition, TurnAction, Intent } from '../types';
import { getTileAt, getUnitAt, findPath, calculateDamage, canStopOn, canCrossBodies, planPush } from './gameLogic';
import { planEnemyIntent } from './aiLogic';
import { tutorialBattle } from '../data/tutorial';
import { getFusionEffectValue, hasFusionEffect } from './fusion';
import { planHazard } from '../data/hazards';
import { isMissionFailed, isMissionCompleteEarly, isMissionSatisfied } from '../data/missions';
import { SUN_PER_TURN_INCOME, GRAVE_DIG_PERIOD, advancedZombieCap, ADVANCED_ZOMBIES } from '../constants';
import { balancedGlobal } from './balance';

/** Ceiling on live zombies. Reinforcements queue behind it instead of piling on. */
const MAX_LIVE_ENEMIES = 8;
/** PvZ's huge wave. From here on a Flag Zombie leads the horde. */
const FLAG_WAVE_TURN = 6;

interface TurnResult {
    actions: TurnAction[];
    finalGameState: GameState; 
}

export const processTurn = (
    currentUnits: Unit[], 
    currentBoard: TileData[], 
    gameState: GameState,
    unitDefs: Record<UnitClass, UnitDefinition>,
    terrainDefs: Record<string, TerrainDefinition>
): TurnResult => {
    
    // Simulation state
    let simUnits = currentUnits.map(u => ({ ...u }));
    const actions: TurnAction[] = [];

    // Capture stunned units BEFORE processing Phase 2
    // FREEZE belongs here too. It was checked only on the player's side (App.tsx blocks a
    // frozen hero's skills), so freezing an ENEMY did nothing whatsoever — it walked and bit
    // exactly as before.
    const stunnedUnitIds = new Set(
        simUnits.filter(u => u.statusEffects.includes('STUN') || u.statusEffects.includes('FREEZE') || u.statusEffects.includes('DORMANT'))
                .map(u => u.id)
    );

    // Kills no longer pay Sun on their own — only the SUN_ON_KILL fusions do, and those
    // resolve on the player's turn. Free kill income let shooters refund their own skills.
    const killUnit = (u: Unit) => {
        actions.push({ type: 'UNIT_DIE', unitId: u.id });
    };

    // --- PHASE 0: SECTOR HAZARD ---
    // Whatever was telegraphed last turn resolves now, before anything else moves. The player
    // has had a full turn to look at the marked tiles and get out of the way.
    const pending = gameState.hazard;
    if (pending && pending.type !== 'NONE') {
        const marked = new Set(pending.tiles.map(t => `${t.x},${t.y}`));

        if (pending.type === 'LAVA_FLOW') {
            pending.tiles.forEach(pos => {
                actions.push({ type: 'MODIFY_TERRAIN', pos, terrain: 'LAVA' });
                actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'BURN', pos });
            });
        } else {
            // WIND_GUST and RAIL_SLIDE both shove whatever stands on a marked tile.
            const dx = pending.dx || 0;
            const dy = pending.dy || 0;
            const occupied = new Set(simUnits.map(u => `${u.position.x},${u.position.y}`));
            /** Houses emptied by this hazard, so two shoves cannot take one brain twice. */
            const hazardEatenHouses = new Set<string>();

            // Shove the far side first so units don't pile into each other's old tiles.
            const order = [...simUnits].sort((a, b) =>
                (b.position.x * dx + b.position.y * dy) - (a.position.x * dx + a.position.y * dy));

            order.forEach(u => {
                if (!marked.has(`${u.position.x},${u.position.y}`)) return;
                if (u.hp <= 0) return;
                if (u.immunities.includes('PUSH')) return;

                // Same planner the skills and Blover use, so wind drowns and chains exactly
                // as a Shield Bash does. Three hand-written copies of this logic is how
                // `DROWN` ended up declared, assigned, and never once read.
                const plan = planPush(u, dx, dy, simUnits.filter(s2 => s2.hp > 0), currentBoard, terrainDefs, 3, hazardEatenHouses);

                plan.moves.forEach(m => {
                    const t = simUnits.find(s2 => s2.id === m.unitId);
                    if (!t) return;
                    actions.push({ type: 'UNIT_MOVE', unitId: m.unitId, path: [m.to], isForced: true });
                    t.position = m.to;
                });
                plan.drowned.forEach(id => {
                    const t = simUnits.find(s2 => s2.id === id);
                    if (!t) return;
                    actions.push({ type: 'APPLY_DAMAGE', targetId: id, amount: 0, eventType: 'DROWN', pos: t.position });
                    t.hp = 0;
                    killUnit(t);
                });
                plan.tookBrain.forEach(({ unitId, house }) => {
                    const t = simUnits.find(s2 => s2.id === unitId);
                    if (!t) return;
                    // Remember it here too: the board is the reducer's to change, so a second
                    // shove this same turn would otherwise claim the same brain again.
                    hazardEatenHouses.add(`${house.x},${house.y}`);
                    actions.push({ type: 'BRAIN_LOST', pos: house, unitId });
                    t.hp = 0;
                });
                plan.collided.forEach(id => {
                    const t = simUnits.find(s2 => s2.id === id);
                    if (!t || t.hp <= 0) return;
                    if (hasFusionEffect(t, 'STEADFAST')) {
                        actions.push({ type: 'APPLY_DAMAGE', targetId: id, amount: 0, eventType: 'BLOCK', pos: t.position });
                        return;
                    }
                    const r = calculateDamage(t, 1, false);
                    actions.push({ type: 'APPLY_DAMAGE', targetId: id, amount: r.finalDamage, eventType: 'DAMAGE', pos: t.position });
                    t.hp = r.remainingHp;
                    if (r.isFatal) killUnit(t);
                });
            });
        }

        actions.push({ type: 'WAIT', duration: 250 });
        simUnits = simUnits.filter(u => u.hp > 0);
    }

    // --- PHASE 1: SPAWN REINFORCEMENTS (FROM QUEUE) ---
    /**
     * A scripted battle ignores the random roller entirely: its wave table says which zombie
     * arrives on which tile on which turn, and a tutorial that teaches "two Coneheads box you
     * in on turn 4" has to actually produce two Coneheads on turn 4.
     */
    const script = gameState.scriptedBattleId ? tutorialBattle(gameState.scriptedBattleId) : undefined;
    // PHASE 1 runs while gameState.turn is still the turn that just ENDED, and PHASE 5
    // increments it afterwards — so a wave keyed to turn N has to be spawned here on N-1 to
    // be standing on the board when the player actually sees turn N.
    const scriptedWave = script?.waves?.[gameState.turn + 1] ?? (script ? [] : undefined);

    const spawnQueue = scriptedWave
        ? scriptedWave.map(sp => ({ x: sp.x, y: sp.y }))
        : (gameState.enemySpawnQueue || []);
    /** Class per queued tile, when the script names it. Index-aligned with spawnQueue. */
    const scriptedClassAt = (i: number) => scriptedWave?.[i]?.cls;
    /** At most one herald per batch, even when several tiles resolve this turn. */
    let flagQueued = false;
    /**
     * Reinforcements that arrived this very turn. In a scripted battle they must stand where
     * the script placed them: PHASE 4 runs later in this same call, so without this they walk
     * several tiles before the player ever sees them — and every "click that tile" instruction
     * the tutorial gives would point at empty grass.
     */
    const spawnedThisTurn = new Set<string>();
    
    spawnQueue.forEach((pos, spawnIndex) => {
        const occupant = getUnitAt(pos, simUnits);
        
        // BLOCK SPAWN LOGIC
        if (occupant) {
             // Iron Bulwark: plugs the hole without taking the emergence hit.
             const painless = hasFusionEffect(occupant, 'STEADFAST');
             // FIX: Use 'DAMAGE' eventType so HP is actually reduced in GameEngine
             const result = painless
                ? { finalDamage: 0, shieldDamage: 0, remainingShield: occupant.shield || 0, remainingHp: occupant.hp, isFatal: false }
                : calculateDamage(occupant, 1, false);
             actions.push({ type: 'APPLY_DAMAGE', targetId: occupant.id, amount: result.finalDamage, eventType: painless ? 'BLOCK' : 'DAMAGE', pos });

             // Sunstone Shield: plugging the hole with your body is already a real tactic —
             // this fusion is the first thing that pays for it.
             const blockReward = getFusionEffectValue(occupant, 'SUN_ON_BLOCK_SPAWN');
             if (blockReward > 0) {
                 actions.push({ type: 'GAIN_SUN', amount: blockReward, pos });
             }
             if (result.isFatal) {
                 killUnit(occupant);
                 // Remove from simUnits
                 simUnits = simUnits.filter(u => u.id !== occupant.id);
             } else {
                 // Update sim state
                 occupant.hp = result.remainingHp;
             }
        } else {
            // Randomize Zombie Type
            const rand = Math.random();
            let spawnClass = UnitClass.BASIC_ZOMBIE;
            const turnFactor = Math.min(1, gameState.turn / 10);
            
            // PvZ's huge wave lands on turn 6, and it is heralded by a Flag Zombie. Only one
            // stands at a time: while it lives every other zombie is ENRAGED, so it is the
            // single most valuable thing on the board to shoot.
            const flagOnBoard = simUnits.some(u => u.isEnemy && u.hp > 0 && u.class === UnitClass.FLAG_ZOMBIE);
            if (gameState.turn >= FLAG_WAVE_TURN && !flagOnBoard && !flagQueued) {
                spawnClass = UnitClass.FLAG_ZOMBIE;
                flagQueued = true;
            }
            // Balloon and Catapult are the two threats a melee wall cannot answer, so they
            // arrive early and stay common — they are what stops the fight being one note.
            else if (rand < 0.12) spawnClass = UnitClass.BALLOON_ZOMBIE;
            else if (rand < 0.24) spawnClass = UnitClass.CATAPULT_ZOMBIE;
            else if (rand < 0.29 + (turnFactor * 0.1)) spawnClass = UnitClass.DIGGER_ZOMBIE;
            else if (rand < 0.34 + (turnFactor * 0.1)) spawnClass = UnitClass.SCREEN_DOOR_ZOMBIE;
            else if (rand < 0.39 + (turnFactor * 0.1)) spawnClass = UnitClass.NEWSPAPER_ZOMBIE;
            else if (rand < 0.54 + (turnFactor * 0.2)) spawnClass = UnitClass.BUCKETHEAD; 
            else if (rand < 0.74 + (turnFactor * 0.2)) spawnClass = UnitClass.CONEHEAD;

            // DEPTH BUDGET: only so many wall-ignoring zombies may share the board, and the
            // allowance grows with map depth. Over budget, the spawn downgrades to a Conehead
            // rather than being skipped — the wave keeps its size, it just stops being
            // unanswerable. Counts live enemies plus anything queued earlier this same turn.
            if (ADVANCED_ZOMBIES.has(spawnClass)) {
                const advancedAlive = simUnits.filter(
                    u => u.isEnemy && u.hp > 0 && ADVANCED_ZOMBIES.has(u.class)
                ).length;
                if (advancedAlive >= advancedZombieCap(gameState.depth)) {
                    // Let the herald try again on a later turn instead of burning its one slot.
                    if (spawnClass === UnitClass.FLAG_ZOMBIE) flagQueued = false;
                    spawnClass = UnitClass.CONEHEAD;
                }
            }

            // The script wins over every roll above.
            const scripted = scriptedClassAt(spawnIndex);
            if (scripted) spawnClass = scripted;

            const enemyDef = unitDefs[spawnClass];
            
            const newUnit: Unit = {
                id: `zombie_${Date.now()}_${Math.random()}`,
                type: UnitType.ZOMBIE, class: spawnClass, role: 'ENEMY',
                hp: enemyDef.maxHp, maxHp: enemyDef.maxHp, damage: enemyDef.damage, moveRange: enemyDef.moveRange,
                cooldownReduction: 0, level: 1, position: { x: pos.x, y: pos.y },
                isEnemy: true, hasMoved: false, hasAttacked: false, statusEffects: [],
                movementType: enemyDef.movementType, immunities: enemyDef.immunities, imgUrl: enemyDef.imgUrl,
                attackRange: enemyDef.attackRange ?? 1,
                intent: { type: 'MOVE', description: 'Hungry...' },
                spawnDelay: 0
            };
            
            simUnits.push(newUnit);
            spawnedThisTurn.add(newUnit.id);
            actions.push({ type: 'SPAWN_UNIT', unit: { ...newUnit, spawnDelay: 0 } });
            actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'EMERGE', pos });
        }
    });

    if (spawnQueue.length > 0) {
        actions.push({ type: 'WAIT', duration: 300 }); 
    }

    // --- PHASE 1.5: FLAG AURA ---
    // Derived every turn rather than stored, so the buff vanishes the instant the herald
    // dies — there is no stale +1 to unwind and no base stat to corrupt.
    {
        const flagAlive = simUnits.some(u => u.isEnemy && u.hp > 0 && u.class === UnitClass.FLAG_ZOMBIE);
        simUnits.forEach(u => {
            if (!u.isEnemy || u.type === UnitType.OBSTACLE) return;
            const shouldRage = flagAlive && u.class !== UnitClass.FLAG_ZOMBIE;
            const hasRage = u.statusEffects.includes('ENRAGED');
            if (shouldRage === hasRage) return;
            u.statusEffects = shouldRage
                ? [...u.statusEffects, 'ENRAGED']
                : u.statusEffects.filter(e => e !== 'ENRAGED');
            actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { statusEffects: [...u.statusEffects] } });
        });
    }

    // --- PHASE 2: ENV & STATUS & PASSIVE ABILITIES ---
    simUnits.forEach(u => {
        const pos = u.position;
        const tile = getTileAt(pos, currentBoard);
        const isFlying = u.movementType === 'FLYING';
        const burnImmune = u.immunities.includes('BURN');
        // Capture BURN *before* a fire tile can add it this turn, so standing in fire
        // doesn't get billed twice in the same turn.
        const hadBurn = u.statusEffects.includes('BURN');
        let dead = false;

        // Each source must read the HP left by the previous source. The old code passed the
        // original `u` to every calculateDamage call, so the simulation ended up with only the
        // last source's result and drifted out of sync with the real reducer.
        const applyEnvDamage = (amount: number, piercing: boolean) => {
            if (dead) return;
            const result = calculateDamage(u, amount, piercing);
            actions.push({ type: 'APPLY_DAMAGE', targetId: u.id, amount: result.finalDamage, eventType: 'BURN', pos });
            u.hp = result.remainingHp;
            u.shield = result.remainingShield;
            if (result.isFatal) {
                killUnit(u);
                dead = true;
            }
        };

        // Lava
        if (tile?.terrain === 'LAVA' && !isFlying && !burnImmune) {
            applyEnvDamage(1, true);
        }

        // FIRE ENVIRONMENT
        if (tile?.environment === 'FIRE' && !isFlying && !burnImmune) {
            applyEnvDamage(2, false);

            if (!dead && !u.statusEffects.includes('BURN')) {
                const newEffects = [...u.statusEffects, 'BURN' as const];
                u.statusEffects = newEffects;
                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { statusEffects: newEffects } });
            }
        }

        // Lingering burn carried in from a previous turn
        if (hadBurn && !burnImmune) {
            applyEnvDamage(1, false);
        }

        // Apply Digesting Timer (Chomper)
        if (u.digestingTurns && u.digestingTurns > 0) {
            u.digestingTurns -= 1;
            actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { digestingTurns: u.digestingTurns } });
        }

        // A fused Sunflower pays out every turn without costing the hero its action —
        // that is the whole reason to spend a fusion slot on economy (DESIGN.md section 6).
        // It still follows the one rule every Sun source obeys: a turn spent walking is a
        // turn without light. Being shoved does not count (hasMoved is only set on a
        // voluntary move), so a pushed Sunflower keeps her income.
        if (!u.isEnemy && !dead && !u.hasMoved && !u.statusEffects.includes('STUN')) {
            const income = getFusionEffectValue(u, 'SUN_PER_TURN');
            if (income > 0) {
                actions.push({ type: 'GAIN_SUN', amount: income, pos });
            }
        }

        // Apply Passive Charging (Sun-shroom / Sunflower)
        if ((u.class === UnitClass.SUN_SHROOM || u.class === UnitClass.SUNFLOWER || u.class === UnitClass.TWIN_SUNFLOWER) && !u.statusEffects.includes('STUN')) {
             if (!u.sunCharge || u.sunCharge < 1) {
                 u.sunCharge = 1;
                 actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { sunCharge: 1 } });
             }
        }
    });

    // Cleanup Dead (Sim only)
    simUnits = simUnits.filter(u => u.hp > 0);

    // --- PHASE 3: ENEMY ACTIONS (EXECUTE INTENT) ---
    const enemies = simUnits.filter(u => u.isEnemy && !stunnedUnitIds.has(u.id));

    /** Houses robbed this turn, so two zombies on one doorstep cannot claim the same brain. */
    const brainsTakenThisTurn = new Set<string>();
    /** Zombies that left carrying a brain — removed from the board, not killed. */
    const brainThieves = new Set<string>();

    enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;

        const intent = enemy.intent;
        if (!intent) return;

        // BRAIN GRAB — the follow-through on the telegraph set last turn (PHASE 4). The zombie
        // stood on the house for a full turn first, so the player had a turn to answer it.
        // Still standing there, brain still in place: it leaves with it now.
        if (intent.type === 'ATTACK' && intent.target
            && intent.target.x === enemy.position.x && intent.target.y === enemy.position.y) {
            const houseTile = getTileAt(enemy.position, currentBoard);
            if (houseTile?.isHouse && houseTile.hasBrain && !brainsTakenThisTurn.has(`${enemy.position.x},${enemy.position.y}`)) {
                brainsTakenThisTurn.add(`${enemy.position.x},${enemy.position.y}`);
                brainThieves.add(enemy.id);
                actions.push({ type: 'UNIT_ATTACK', unitId: enemy.id, targetPos: enemy.position, attackRange: 'MELEE' });
                actions.push({ type: 'BRAIN_LOST', pos: { x: enemy.position.x, y: enemy.position.y }, unitId: enemy.id });
                return;
            }
        }

        if (intent.type === 'ATTACK' && intent.target) {
            actions.push({ type: 'UNIT_ATTACK', unitId: enemy.id, targetPos: intent.target, attackRange: (enemy.attackRange ?? 1) > 1 ? 'LOB' : 'MELEE' });
            
            const targetUnit = getUnitAt(intent.target, simUnits);
            if (targetUnit) {
                // Apply Damage logic consistent with App.tsx
                const result = calculateDamage(targetUnit, intent.damage || 0, false);
                
                // Shield Logic
                if (result.shieldDamage > 0) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'BLOCK', pos: intent.target });
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { shield: result.remainingShield } });
                    targetUnit.shield = result.remainingShield;
                }

                if (result.finalDamage > 0) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: result.finalDamage, eventType: 'DAMAGE', pos: intent.target });
                    targetUnit.hp = result.remainingHp;
                }

                // --- RETALIATION FUSIONS (Biting Wall / Frostbite Armor) ---
                // Resolved before the defender is cleared away: a wall built to be attacked
                // gets its answer in even on the blow that destroys it, which is the whole
                // reason the fusion is worth a slot.
                const thorns = getFusionEffectValue(targetUnit, 'RETALIATE_DAMAGE');
                if (thorns > 0) {
                    const back = calculateDamage(enemy, thorns, false);
                    actions.push({ type: 'APPLY_DAMAGE', targetId: enemy.id, amount: back.finalDamage, eventType: 'DAMAGE', pos: enemy.position });
                    enemy.hp = back.remainingHp;
                    enemy.shield = back.remainingShield;
                    if (back.isFatal) killUnit(enemy);
                }

                if (enemy.hp > 0 && hasFusionEffect(targetUnit, 'RETALIATE_FREEZE')) {
                    if (enemy.immunities.includes('FREEZE') || enemy.immunities.includes('STATUS')) {
                        actions.push({ type: 'APPLY_DAMAGE', targetId: enemy.id, amount: 0, eventType: 'IMMUNE', pos: enemy.position });
                    } else if (!enemy.statusEffects.includes('STUN')) {
                        // PHASE 4 re-reads statusEffects, so the attacker loses its move this
                        // very turn — biting the wall costs it the ground it came for.
                        const frozen: typeof enemy.statusEffects = [...enemy.statusEffects, 'STUN'];
                        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: enemy.id, updates: { statusEffects: frozen } });
                        enemy.statusEffects = frozen;
                    }
                }

                if (result.isFatal) {
                    killUnit(targetUnit);
                    // Remove from simUnits immediately
                    const idx = simUnits.findIndex(u => u.id === targetUnit.id);
                    if (idx !== -1) simUnits.splice(idx, 1);
                }
            } else {
                actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'MISS', pos: intent.target });
            }
        } else if (intent.type === 'SPAWN' && intent.target) {
            // Gargantuar logic
            const impDef = unitDefs[UnitClass.IMP];
            const newImp: Unit = {
                id: `imp_${Date.now()}_${Math.random()}`,
                type: UnitType.ZOMBIE, class: UnitClass.IMP, role: 'ENEMY',
                hp: impDef.maxHp, maxHp: impDef.maxHp, damage: impDef.damage, moveRange: impDef.moveRange,
                cooldownReduction: 0, level: 1, position: intent.target,
                isEnemy: true, hasMoved: true, hasAttacked: true, statusEffects: [],
                movementType: impDef.movementType, immunities: impDef.immunities, imgUrl: impDef.imgUrl,
                intent: { type: 'MOVE', description: 'Landing...' },
                spawnDelay: 0
            };
            
            const landingOccupant = getUnitAt(intent.target, simUnits);
            if (!landingOccupant) {
                simUnits.push(newImp);
                actions.push({ type: 'SPAWN_UNIT', unit: { ...newImp, spawnDelay: 0 } });
            }
        }
    });

    // --- PHASE 4: ENEMY MOVEMENT (PLAN NEXT TURN) ---
    // Thieves walked off the board with a brain in PHASE 3 — alive, but gone.
    const survivors = simUnits.filter(u => u.hp > 0 && !brainThieves.has(u.id));
    const movingEnemies = survivors.filter(u =>
        u.isEnemy
        && !stunnedUnitIds.has(u.id)
        // Scripted arrivals hold the tile they were authored on for one turn.
        && !(script && spawnedThisTurn.has(u.id)));
    
    // Sort by Y (Frontline moves first)
    movingEnemies.sort((a,b) => a.position.y - b.position.y); 

    const nonEnemies = survivors.filter(u => !u.isEnemy);
    const currentPositions = new Map<string, string>();
    survivors.forEach(u => currentPositions.set(`${u.position.x},${u.position.y}`, u.id));

    // Brains eaten earlier in this same turn. The board is owned by the reducer, so the sim keeps
    // its own tally to stop two zombies claiming one brain, and drops the zombies that left.
    // Seeded with anything already robbed in PHASE 3 this turn, so a second zombie does not
    // walk in and telegraph a grab on a house whose brain is already gone.
    const eatenHouses = new Set<string>(brainsTakenThisTurn);
    const eatenZombies = new Set<string>();

    movingEnemies.forEach(enemy => {
        if (enemy.statusEffects.includes('STUN') || enemy.statusEffects.includes('FREEZE')) {
             enemy.intent = { type: 'WAIT', description: enemy.statusEffects.includes('FREEZE') ? 'Frozen solid!' : 'Stunned!' };
             actions.push({ type: 'UPDATE_INTENT', unitId: enemy.id, intent: enemy.intent });
             return;
        }

        // --- GRAVES DIG ---
        // A headstone used to be pure bookkeeping: 3 HP that KILL_ALL demanded you spend a
        // hit on, threatening nothing while it waited. Now it is on a clock — every
        // GRAVE_DIG_PERIOD turns a Basic Zombie claws out onto the nearest open tile, so
        // "clear the grave" is a deadline, not a chore. The countdown is telegraphed on the
        // unit like any other intent; burning the grave before it strikes cancels the spawn,
        // because a dead grave never reaches this code.
        if (enemy.class === UnitClass.GRAVE) {
            const turnsLeft = GRAVE_DIG_PERIOD - ((gameState.turn - 1) % GRAVE_DIG_PERIOD) - 1;
            if (turnsLeft > 0) {
                enemy.intent = { type: 'WAIT', description: `The soil stirs... ${turnsLeft} turn${turnsLeft > 1 ? 's' : ''}` };
                actions.push({ type: 'UPDATE_INTENT', unitId: enemy.id, intent: enemy.intent });
                return;
            }
            const spot = [
                { x: enemy.position.x, y: enemy.position.y + 1 },
                { x: enemy.position.x + 1, y: enemy.position.y },
                { x: enemy.position.x - 1, y: enemy.position.y },
                { x: enemy.position.x, y: enemy.position.y - 1 },
            ].find(p => {
                if (p.x < 0 || p.x >= 8 || p.y < 0 || p.y >= 8) return false;
                const t = getTileAt(p, currentBoard);
                if (!t || !terrainDefs[t.terrain]?.isWalkable || t.isHouse) return false;
                return !currentPositions.has(`${p.x},${p.y}`);
            });
            if (spot) {
                const basicDef = unitDefs[UnitClass.BASIC_ZOMBIE];
                const risen: Unit = {
                    id: `grave_${enemy.id}_${gameState.turn}`,
                    type: UnitType.ZOMBIE, class: UnitClass.BASIC_ZOMBIE, role: 'ENEMY',
                    hp: basicDef.maxHp, maxHp: basicDef.maxHp, damage: basicDef.damage,
                    moveRange: basicDef.moveRange, cooldownReduction: 0, level: 1,
                    position: spot, isEnemy: true, hasMoved: true, hasAttacked: true,
                    statusEffects: [], movementType: basicDef.movementType,
                    immunities: basicDef.immunities, imgUrl: basicDef.imgUrl,
                    intent: { type: 'MOVE', description: 'Clawing free...' },
                    spawnDelay: 0,
                };
                simUnits.push(risen);
                currentPositions.set(`${spot.x},${spot.y}`, risen.id);
                actions.push({ type: 'SPAWN_UNIT', unit: { ...risen } });
            }
            enemy.intent = { type: 'WAIT', description: 'The soil stirs...' };
            actions.push({ type: 'UPDATE_INTENT', unitId: enemy.id, intent: enemy.intent });
            return;
        }

        // Only units still on the board can block a route.
        const collisionLayer = survivors.filter(u => !eatenZombies.has(u.id));

        // Find Target: the nearest house that still holds a brain. Plants are just walls on the way.
        let target: Position | null = null;
        let minDist = 999;

        currentBoard.forEach(t => {
            if (!t.isHouse || !t.hasBrain || eatenHouses.has(`${t.x},${t.y}`)) return;
            const dist = Math.abs(t.x - enemy.position.x) + Math.abs(t.y - enemy.position.y);
            if (dist < minDist) { minDist = dist; target = { x: t.x, y: t.y }; }
        });

        if (!target) {
            // Every brain on this board is gone — fall back to the nearest plant so nothing idles.
            let closest: Unit | null = null;
            let closestDist = 999;
            nonEnemies.forEach(p => {
                const dist = Math.abs(p.position.x - enemy.position.x) + Math.abs(p.position.y - enemy.position.y);
                if (dist < closestDist) { closestDist = dist; closest = p; }
            });
            if (!closest) return;
            target = { x: (closest as Unit).position.x, y: (closest as Unit).position.y };
        }

        // findPath always allows the destination tile itself, so an occupied plant tile is still a
        // valid goal — the walk-back below stops the zombie on the last free step before it.
        const bestPath = findPath(enemy, target, collisionLayer, currentBoard, terrainDefs);

        const isFree = (p: Position) => {
            const key = `${p.x},${p.y}`;
            return !currentPositions.has(key) || currentPositions.get(key) === enemy.id;
        };

        const commitMove = (path: Position[]) => {
            if (path.length === 0) return;
            const dest = path[path.length - 1];
            currentPositions.delete(`${enemy.position.x},${enemy.position.y}`);
            currentPositions.set(`${dest.x},${dest.y}`, enemy.id);
            enemy.position = dest;
            actions.push({ type: 'UNIT_MOVE', unitId: enemy.id, path });
        };

        let moved = false;

        // SLOW costs the zombie distance rather than its turn — that is the whole difference
        // between Frostpod's baseline and a full freeze.
        const slowed = enemy.statusEffects.includes('SLOW');
        const effectiveRangeBase = slowed ? Math.max(1, Math.floor(enemy.moveRange / 2)) : enemy.moveRange;
        const enraged = enemy.statusEffects.includes('ENRAGED');
        const flying = enemy.movementType === 'FLYING';
        const reach = Math.max(1, enemy.attackRange ?? 1);
        // The Flag Zombie's aura buys the horde ground as well as bite.
        const effectiveRange = enraged ? effectiveRangeBase + 1 : effectiveRangeBase;

        const distTo = (a: Position, b: Position) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        const startDist = distTo(enemy.position, target);

        /** Every tile this zombie could actually stand on this turn, with the route to it. */
        const reachable = (): Array<{ pos: Position; path: Position[] }> => {
            const out: Array<{ pos: Position; path: Position[] }> = [];
            const seen = new Set<string>([`${enemy.position.x},${enemy.position.y}`]);
            let frontier: Array<{ pos: Position; path: Position[] }> = [{ pos: enemy.position, path: [] }];

            for (let step = 0; step < effectiveRange; step++) {
                const next: Array<{ pos: Position; path: Position[] }> = [];
                frontier.forEach(({ pos, path }) => {
                    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                        const p = { x: pos.x + dx, y: pos.y + dy };
                        if (p.x < 0 || p.x >= 8 || p.y < 0 || p.y >= 8) return;
                        const key = `${p.x},${p.y}`;
                        if (seen.has(key)) return;
                        const t = getTileAt(p, currentBoard);
                        // WALL stops even a flier. Everything else — water, lava, a plant's
                        // body — is only a floor problem, so a Balloon Zombie drifts over it.
                        if (!t || t.terrain === 'WALL') return;
                        if (!flying && !terrainDefs[t.terrain]?.isWalkable) return;
                        seen.add(key);
                        const entry = { pos: p, path: [...path, p] };
                        // Landing needs a free tile the player can reach (canStopOn); crossing
                        // terrain the movement type ignores is fine.
                        const landable = isFree(p) && canStopOn(enemy, t, terrainDefs);
                        if (landable) out.push(entry);
                        // A body only lets a flier or a burrower past. For anything that walks
                        // the search stops here, which is what turns a plant into a wall — and
                        // what makes the zombie stand in front of it and bite instead.
                        if (isFree(p) || canCrossBodies(enemy)) next.push(entry);
                    });
                });
                frontier = next;
            }
            return out;
        };

        /**
         * Destination priority:
         *   1. a brain it can reach and take THIS turn
         *   2. a tile beside a plant — but only if standing there is closer to a brain than
         *      where it started, so biting is never a detour
         *   3. whatever tile gets it closest to a brain
         *
         * Choosing the tile is what makes tier 2 real: planEnemyIntent can only order an
         * attack on something already adjacent, so the zombie has to walk up to the plant
         * first. Before this it only ever aimed at the brain and bit whatever it happened
         * to brush past.
         */
        const options = reachable();

        const brainGrab = options.find(o => {
            const t = getTileAt(o.pos, currentBoard);
            return !!t?.isHouse && !!t.hasBrain && !eatenHouses.has(`${o.pos.x},${o.pos.y}`);
        });

        const engagePlant = brainGrab ? undefined : options
            .filter(o => distTo(o.pos, target) < startDist)
            .filter(o => nonEnemies.some(pl =>
                !eatenZombies.has(pl.id) && distTo(o.pos, pl.position) <= reach))
            .sort((a, b) => distTo(a.pos, target) - distTo(b.pos, target))[0];

        /**
         * Artillery does not charge. A Catapult Zombie that already has something inside its
         * arc has no reason to give up the range advantage that defines it — before this it
         * walked to the front every turn and read as an ordinary biter.
         */
        const alreadyInFiringPosition = reach > 1 && !brainGrab && nonEnemies.some(pl =>
            !eatenZombies.has(pl.id) && distTo(enemy.position, pl.position) <= reach);

        const chosen = brainGrab || (alreadyInFiringPosition ? undefined : engagePlant);
        if (alreadyInFiringPosition && !brainGrab) {
            moved = true; // holds position on purpose; skip the walk-toward-brain fallbacks
        } else if (chosen) {
            commitMove(chosen.path);
            moved = true;
        } else if (bestPath && bestPath.length > 0) {
            // Walk the path back to the furthest step that is actually free. The old code only
            // looked at the single furthest step and, if another unit had taken it, gave up and
            // stood still — so zombies queued behind each other froze permanently.
            const maxSteps = Math.min(effectiveRange, bestPath.length);
            for (let step = maxSteps - 1; step >= 0; step--) {
                // Same landing rule as `reachable()`: a flier may route over a mountain but
                // must not come to rest on one.
                if (isFree(bestPath[step]) && canStopOn(enemy, getTileAt(bestPath[step], currentBoard), terrainDefs)) {
                    commitMove(bestPath.slice(0, step + 1));
                    moved = true;
                    break;
                }
            }
        }

        if (!moved) {
            // No route to the house (walled in, corridor congested). Shuffle greedily toward the
            // target instead of idling, which used to strand enemies for the whole level.
            const greedyPath: Position[] = [];
            let from = enemy.position;

            for (let step = 0; step < effectiveRange; step++) {
                const options = [
                    { x: from.x + 1, y: from.y }, { x: from.x - 1, y: from.y },
                    { x: from.x, y: from.y + 1 }, { x: from.x, y: from.y - 1 }
                ].filter(p => {
                    if (p.x < 0 || p.x >= 8 || p.y < 0 || p.y >= 8) return false;
                    const t = getTileAt(p, currentBoard);
                    if (!t || !terrainDefs[t.terrain]?.isWalkable) return false;
                    return isFree(p) && !greedyPath.some(g => g.x === p.x && g.y === p.y);
                });

                const distFrom = Math.abs(from.x - target.x) + Math.abs(from.y - target.y);
                const better = options
                    .map(p => ({ p, d: Math.abs(p.x - target.x) + Math.abs(p.y - target.y) }))
                    .filter(o => o.d < distFrom)
                    .sort((a, b) => a.d - b.d)[0];

                if (!better) break;
                greedyPath.push(better.p);
                from = better.p;
            }

            if (greedyPath.length > 0) commitMove(greedyPath);
        }

        // Reached a house that still holds a brain. The brain is NOT taken yet: the zombie
        // spends a turn prising it loose, telegraphed like any other attack, so the player
        // always gets one turn to kill it or shove it off the doorstep. Losing a brain with
        // no warning was the one thing on this board the player could not play around.
        // The steal itself resolves in PHASE 3 next turn.
        const standingOn = getTileAt(enemy.position, currentBoard);
        const houseKey = `${enemy.position.x},${enemy.position.y}`;
        if (standingOn?.isHouse && standingOn.hasBrain && !eatenHouses.has(houseKey)) {
            const grabIntent: Intent = {
                type: 'ATTACK',
                target: { x: enemy.position.x, y: enemy.position.y },
                damage: 0,
                description: 'Reaching for the brain!',
            };
            enemy.intent = grabIntent;
            actions.push({ type: 'UPDATE_INTENT', unitId: enemy.id, intent: grabIntent });
            return;
        }

        // Plan Next Intent
        const newIntent = planEnemyIntent(enemy, nonEnemies, currentBoard, terrainDefs, collisionLayer);
        enemy.intent = newIntent;
        actions.push({ type: 'UPDATE_INTENT', unitId: enemy.id, intent: newIntent });
    });

    const remainingUnits = survivors.filter(u => !eatenZombies.has(u.id));

    // --- PHASE 5: SPAWN QUEUE GENERATION ---
    const nextSpawnQueue: Position[] = [];
    const turn = gameState.turn + 1;
    // Pressure comes from numbers, not from fat HP bars: three units, five problems.
    // Was 2 + turn/3, which peaked at four zombies by turn six — nowhere near enough
    // to force triage once every zombie also dies in one or two hits.
    // Reinforcements are pressure, not a flood. Without a ceiling the board went 1 -> 5 ->
    // 9 -> 13 -> 17 over five turns and stopped being a puzzle the player could read.
    if (script) {
        // Telegraph only: PHASE 1 re-reads the table next turn, so this just tells the board
        // where to draw the incoming-spawn markers.
        // Telegraph the wave that PHASE 1 will place at the end of the coming turn.
        const next = script.waves?.[turn + 1] ?? [];
        const nextState: GameState = {
            ...gameState,
            turn,
            enemySpawnQueue: next.map(sp => ({ x: sp.x, y: sp.y })),
            hazard: null,
            screen: gameState.screen,
        };
        const mission = gameState.mission;
        const timeUp = turn > gameState.maxTurns;
        if (isMissionFailed(mission, currentBoard)) {
            nextState.screen = 'GAME_OVER';
            if (mission) nextState.mission = { ...mission, failed: true };
        } else if (isMissionCompleteEarly(mission, remainingUnits)) {
            nextState.screen = 'VICTORY';
        } else if (timeUp) {
            nextState.screen = isMissionSatisfied(mission, remainingUnits) ? 'VICTORY' : 'GAME_OVER';
        }
        if (remainingUnits.filter(u => u.type === UnitType.PLANT).length === 0) nextState.screen = 'GAME_OVER';
        const housesOnScriptBoard = currentBoard.filter(t => t.isHouse);
        if (housesOnScriptBoard.length > 0
            && housesOnScriptBoard.filter(t => t.hasBrain && !eatenHouses.has(`${t.x},${t.y}`)).length === 0) {
            nextState.screen = 'GAME_OVER';
        }
        actions.push({ type: 'NEW_TURN_RESET' });
        return { actions, finalGameState: nextState };
    }

    const liveEnemies = remainingUnits.filter(u => u.isEnemy && u.type !== UnitType.OBSTACLE).length;
    let headroom = Math.max(0, MAX_LIVE_ENEMIES - liveEnemies);
    // The herald gets a reserved slot. Without this, a board already sitting at the cap on
    // turn 6 would queue nothing and the huge wave would simply never arrive.
    const heraldDue = turn >= FLAG_WAVE_TURN
        && !remainingUnits.some(u => u.isEnemy && u.class === UnitClass.FLAG_ZOMBIE);
    if (heraldDue) headroom = Math.max(headroom, 1);
    const spawnCount = Math.min(3 + Math.floor(turn / 2), headroom);
    
    const validSpawns: Position[] = [];
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
             const tile = getTileAt({x,y}, currentBoard);
             // Reinforcements only appear on tiles the map author marked as spawn ground.
             if (!tile?.isSpawnZone) continue;
             if (terrainDefs[tile.terrain].isWalkable && !currentPositions.has(`${x},${y}`) && !gameState.spawnPoints.some(p => p.x===x && p.y===y)) {
                 validSpawns.push({x,y});
             }
        }
    }
    
    validSpawns.sort(() => Math.random() - 0.5);
    for (let i=0; i<spawnCount; i++) {
        if (validSpawns[i]) nextSpawnQueue.push(validSpawns[i]);
    }

    // Telegraph what the sector will do next turn, so the player gets a full turn of warning.
    const nextHazard = planHazard(gameState.currentWorld, gameState.turn, currentBoard);

    const nextState: GameState = {
        ...gameState,
        hazard: nextHazard,
        turn: turn,
        enemySpawnQueue: nextSpawnQueue,
        screen: gameState.screen
    };

    // --- MISSION OUTCOME ---
    // The objective sits on top of surviving: the clock still runs out at maxTurns, but the
    // player also has to have done what the mission asked.
    const mission = gameState.mission;
    const timeUp = turn > gameState.maxTurns;

    if (isMissionFailed(mission, currentBoard)) {
        // e.g. the house the mission told you to protect just lost its brain.
        nextState.screen = 'GAME_OVER';
        if (mission) nextState.mission = { ...mission, failed: true };
    } else if (isMissionCompleteEarly(mission, remainingUnits)) {
        // KILL_ALL: the board is clear, no reason to keep playing out the clock.
        nextState.screen = 'VICTORY';
    } else if (timeUp) {
        nextState.screen = isMissionSatisfied(mission, remainingUnits) ? 'VICTORY' : 'GAME_OVER';
    }

    // Brains are a run-wide budget handled by the reducer via BRAIN_LOST. A level is also lost
    // outright when the squad is wiped out.
    const remainingPlants = remainingUnits.filter(u => u.type === UnitType.PLANT);
    if (remainingPlants.length === 0) {
        nextState.screen = 'GAME_OVER';
    }

    // ...and lost outright when this board runs dry, even with run budget to spare. Without
    // this the player could write off a map's houses, eat the budget hit and stroll to the
    // exit — the houses were a resource to spend rather than a line to hold.
    const housesOnBoard = currentBoard.filter(t => t.isHouse);
    if (housesOnBoard.length > 0) {
        const brainsStillHere = housesOnBoard.filter(
            t => t.hasBrain && !eatenHouses.has(`${t.x},${t.y}`)
        ).length;
        if (brainsStillHere === 0) nextState.screen = 'GAME_OVER';
    }

    // --- TURN STIPEND ---
    // Paid unconditionally at the end of every turn. Sun is the whole action economy and
    // kills no longer feed it, so without a floor the player simply cannot use hero skills.
    // Anchored on a living plant purely so the number floats somewhere the player is looking.
    const stipendAnchor = remainingUnits.find(u => !u.isEnemy && u.type === UnitType.PLANT && u.position.x >= 0);
    actions.push({
        type: 'GAIN_SUN',
        amount: balancedGlobal('global.SUN_PER_TURN_INCOME'),
        pos: stipendAnchor ? stipendAnchor.position : undefined,
    });

    actions.push({ type: 'NEW_TURN_RESET' });

    return { actions, finalGameState: nextState };
};
