
import { Unit, TileData, GameState, UnitClass, UnitType, UnitDefinition, Position, TerrainDefinition, TurnAction, Intent, StatusEffectType, AreaHit, TerrainType } from '../types';
import { addBleedStack, grantLayer, getTileAt, getUnitAt, findPath, calculateDamage, canStopOn, canCrossBodies, planPush, canRideTo, shieldUpdatesFor, survivesWater } from './gameLogic';
import { applyPushPlan, applyCollisionDamage } from './actionBuilders';
import { planEnemyIntent } from './aiLogic';
import { tutorialBattle } from '../data/tutorial';
import { getFusionEffectValue, hasFusionEffect, bracedAgainstCollision } from './fusion';
import { activeResonance, chainDamageFor, chainStep, ELEMENT_WORLDS, rollEnemyElement } from './elements';
import { planHazard } from '../data/hazards';
import { hooksFor } from './bossBehaviours';
import { isMissionFailed, isMissionCompleteEarly, isMissionSatisfied } from '../data/missions';
import { SUN_PER_TURN_INCOME, GRAVE_DIG_PERIOD, advancedZombieCap, ADVANCED_ZOMBIES, SQUAD_SIZE } from '../constants';
import { balancedGlobal } from './balance';

/** Ceiling on live zombies. Reinforcements queue behind it instead of piling on. */
const MAX_LIVE_ENEMIES = 8;
/**
 * PvZ's huge wave. From here on a Bannerman leads the horde.
 *
 * 4, not 6: a battle is BASE_MAX_TURNS = 5 turns long now, so a herald that first appeared
 * on turn 6 was a mechanic no player would ever see. 4 puts it one turn before the clock
 * runs out, which is where a "final wave" belongs.
 */
const FLAG_WAVE_TURN = 4;

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

    /**
     * The squad's resonance, if it has one. Derived from the SQUAD THAT WAS PICKED
     * (`gameState.heroElements`) and never from who is still standing — the reasoning is on
     * `resonanceOf` itself, and it matters most right here: this file is where heroes die, and
     * a resonance read off the board would switch itself on the moment the odd hero out fell.
     *
     * processTurn already receives gameState, so nothing about the signature changes.
     */
    // `activeResonance`, not the raw rule: a hero under SEVERED suspends the squad bonus for
    // as long as the theft lasts. Read off simUnits so it sees the statuses this very turn.
    const resonance = activeResonance(gameState.heroElements, SQUAD_SIZE, simUnits);

    /** Tiles this turn has already set alight, so two corpses on one tile emit one fire. */
    const ignitedTiles = new Set<string>();

    // Kills no longer pay Sol on their own — only the SUN_ON_KILL fusions do, and those
    // resolve on the player's turn. Free kill income let shooters refund their own skills.
    //
    // FIRE RESONANCE rides in here rather than at the individual death sites for the same
    // reason skillResolution scans its finished action list: an enemy in this file can die to
    // a hazard, a blocked spawn, a spike field, the burn tick, retaliation or a chain arc, and
    // every one of those funnels through this one function. Put it here and the rule cannot be
    // forgotten by whoever adds the seventh way to die.
    const killUnit = (u: Unit) => {
        actions.push({ type: 'UNIT_DIE', unitId: u.id });
        if (resonance !== 'FIRE') return;
        if (!u.isEnemy || u.type === UnitType.OBSTACLE) return;
        if (!u.statusEffects.includes('BURN')) return;
        const key = `${u.position.x},${u.position.y}`;
        if (ignitedTiles.has(key)) return;
        const tile = getTileAt(u.position, currentBoard);
        // Ground something could stand on, and not already ablaze — a burning zombie that
        // drowns is put out, and re-lighting the fire tile that killed it is noise.
        if (!tile || !terrainDefs[tile.terrain]?.isWalkable) return;
        if (tile.environment === 'FIRE') return;
        ignitedTiles.add(key);
        // The same pair of actions `ignite` emits, so the game has exactly one kind of fire
        // tile. Written to the board by the reducer, so PHASE 2 above (which reads
        // currentBoard) will not bite anyone with it until next turn — the corpse's fire is a
        // problem the horde walks into, not a free second tick.
        actions.push({ type: 'MODIFY_TERRAIN', pos: { ...u.position }, environment: 'FIRE' });
        actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'BURN', pos: { ...u.position } });
    };

    /**
     * SPIKE FIELDS, simulated. The board belongs to the reducer, so the countdown is kept
     * here and only the damage leaves as actions — the same split PHASE 0 uses for terrain.
     *
     * The countdown DOES reach the board: after PHASE 4 every field still in this map is
     * written back through MODIFY_TERRAIN's `spikes`, carrying its post-decrement value. That
     * write-back is not optional — without it the counter would only ever age inside one
     * `processTurn` call and a spike wall would bite for the rest of the fight.
     */
    const simSpikes = new Map<string, { damage: number; turns: number }>();
    currentBoard.forEach(t => {
        if (t.spikes && t.spikes.turns > 0) simSpikes.set(`${t.x},${t.y}`, { ...t.spikes });
    });

    /**
     * DUST and SEA, on the same clock and for the same reason.
     *
     * Both were blocked for months on "state that outlives one telegraph", and both turned out
     * to need exactly what a spike field already needed: a counter that lives on the TILE, is
     * aged once per turn here, and is written back through MODIFY_TERRAIN. Written as a third
     * and fourth bespoke system they would each have needed a home in GameState; sharing the
     * spike lifecycle they cost two maps and one line in the ageing block.
     */
    const simSmoke = new Map<string, { turns: number }>();
    const simFlood = new Map<string, { turns: number; was: TerrainType }>();
    currentBoard.forEach(t => {
        if (t.smoke && t.smoke.turns > 0) simSmoke.set(`${t.x},${t.y}`, { ...t.smoke });
        if (t.flood && t.flood.turns > 0) simFlood.set(`${t.x},${t.y}`, { ...t.flood });
    });

    /**
     * Blinded: this tile is under dust right now.
     *
     * Read off `currentBoard` and not off `simSmoke`, because a veil laid THIS turn (PHASE 0)
     * must not blind on the turn it lands — the player is owed the turn of warning every
     * hazard in this file gives, and the telegraph already showed them the patch.
     */
    const blinded = (pos: Position): boolean => {
        const t = getTileAt(pos, currentBoard);
        return !!t?.smoke && t.smoke.turns > 0;
    };

    /**
     * Spines hurt everything that walks in and are NOT spent doing it. That difference from a
     * trap is the entire point of the effect: a mine is one answer to one zombie, a spike field
     * is a piece of ground the horde has to route around. Read off the whole route rather than
     * the destination, because walking ACROSS spikes has to cost the same as stopping on them.
     *
     * Same exemptions a trap gets: enemies only, and never a flier.
     */
    const stepOnSpikes = (u: Unit, path: Position[]) => {
        if (simSpikes.size === 0 || !u.isEnemy || u.movementType === 'FLYING') return;
        for (const step of path) {
            const field = simSpikes.get(`${step.x},${step.y}`);
            if (!field) continue;
            // Spikes come up under the boots, not against the helmet — armour is bypassed,
            // which keeps spike fields (the Spike Trap item; formerly Thornquill's trail) an
            // honest answer to an armoured lane.
            const r = calculateDamage(u, field.damage, false, true);
            actions.push({ type: 'APPLY_DAMAGE', targetId: u.id, amount: r.finalDamage, eventType: 'DAMAGE', pos: step });
            if (r.bleedConsumed) {
                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { statusEffects: [...u.statusEffects] } });
            }
            u.hp = r.remainingHp;
            u.shield = r.remainingShield;
            // Sim-only shield write on this path, so the ONCE-PER-BATTLE flag needs its own
            // action or the death save comes back next time something steps on a spike.
            if (r.lastStandSpent) {
                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { lastStandUsed: true } });
            }
            if (r.isFatal) {
                killUnit(u);
                return;
            }
        }
    };

    /**
     * SOLAR BLESSING EXPIRES HERE — at the door of the enemy phase, which IS "the end of the
     * player turn" (PLAN-hero-zephyr §6.1). The +1 and the borrowed element exist only
     * between the bless and this line, so blessing an ally who has already acted buys
     * nothing: bless first, then swing. Cleared before anything else so no enemy-phase code
     * ever sees a blessed body.
     */
    simUnits.forEach(u => {
        if (!u.isEnemy && (u.statusEffects?.includes('BLESSED') || u.blessedElement)) {
            u.statusEffects = (u.statusEffects ?? []).filter(s => s !== 'BLESSED');
            u.blessedElement = undefined;
            actions.push({
                type: 'UPDATE_UNIT_STATE', unitId: u.id,
                updates: { statusEffects: [...u.statusEffects], blessedElement: undefined },
            });
        }
    });

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
        } else if (pending.type === 'SPOTLIGHT') {
            /**
             * The beam picks its people, and the horde looks where it is pointed.
             *
             * PROVOKED normally names the unit that shouted (`provokedBy`), because a taunt is a
             * hero making itself the problem. A searchlight has no shouter — so every enemy is
             * pointed at whichever CAUGHT hero is nearest to it, which is the same sentence the
             * hazard says in English: the crowd goes for whoever is lit.
             *
             * Deliberately no damage. It is the one hazard that cannot kill anybody by itself,
             * and that is what makes stepping out of the beam a real choice rather than an
             * obligation — a squad that is winning the corridor may well decide to eat it.
             */
            const caught = simUnits.filter(u =>
                !u.isEnemy && u.hp > 0 && marked.has(`${u.position.x},${u.position.y}`));
            if (caught.length > 0) {
                caught.forEach(u => actions.push({
                    type: 'APPLY_DAMAGE', targetId: u.id, amount: 0, eventType: 'BUFF', pos: u.position,
                }));
                simUnits.forEach(u => {
                    if (!u.isEnemy || u.hp <= 0 || u.type === UnitType.OBSTACLE) return;
                    if (u.immunities.includes('STATUS')) return;
                    const lit = caught.reduce((best, c) =>
                        !best || (Math.abs(c.position.x - u.position.x) + Math.abs(c.position.y - u.position.y))
                               < (Math.abs(best.position.x - u.position.x) + Math.abs(best.position.y - u.position.y))
                            ? c : best, null as Unit | null);
                    if (!lit) return;
                    const next: typeof u.statusEffects = u.statusEffects.includes('PROVOKED')
                        ? u.statusEffects
                        : [...u.statusEffects, 'PROVOKED'];
                    u.statusEffects = next;
                    u.provokedBy = lit.id;
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { statusEffects: [...next], provokedBy: lit.id } });
                });
            }
        } else if (pending.type === 'SURGE') {
            /**
             * The grid lets go: 1 damage and a STUN on everything standing in it, friend or
             * horde. Symmetric on purpose — the tiles belong to the board, not to either side,
             * and a hazard that only hurt the player would make the +1 damage they grant a
             * straight gift instead of a bargain.
             */
            pending.tiles.forEach(pos => {
                const victim = simUnits.find(u => u.hp > 0 && u.position.x === pos.x && u.position.y === pos.y);
                if (!victim) return;
                // Electricity does not enter a SHOCK-immune body (the lightning hero's
                // element perk): no bite, no stun — standing on the live grid is her whole
                // counter-pick against this sector.
                if (victim.immunities.includes('SHOCK')) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: victim.id, amount: 0, eventType: 'IMMUNE', pos });
                    return;
                }
                const r = calculateDamage(victim, 1, false);
                actions.push({ type: 'APPLY_DAMAGE', targetId: victim.id, amount: r.finalDamage, eventType: 'DAMAGE', pos });
                victim.hp = r.remainingHp;
                victim.shield = r.remainingShield;
                if (r.isFatal) { killUnit(victim); return; }
                // Same immunity split the rest of the file uses: STATUS stops everything,
                // FREEZE stops a stun.
                if (victim.immunities.includes('STATUS') || victim.immunities.includes('FREEZE')) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: victim.id, amount: 0, eventType: 'IMMUNE', pos });
                } else if (!victim.statusEffects.includes('STUN')) {
                    const stunned: typeof victim.statusEffects = [...victim.statusEffects, 'STUN'];
                    victim.statusEffects = stunned;
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: victim.id, updates: { statusEffects: stunned } });
                }
            });
        } else if (pending.type === 'TIDE') {
            /**
             * The sea comes over, and it does not care whose side anything is on.
             *
             * DROWN, not damage, and it is the same rule `planPush` has always used for a body
             * shoved into water — `survivesWater` is that predicate, asked here of a unit the
             * water arrived at instead of the other way round. Two spellings of drowning would
             * have been two bugs; there is one.
             *
             * `was` is captured from the board BEFORE the write, which is the whole reason
             * TIDE needed a field of its own: the recede below has to put back sand on sand and
             * bridge on bridge, and by then the tile no longer knows.
             */
            pending.tiles.forEach(pos => {
                const tile = getTileAt(pos, currentBoard);
                if (!tile || tile.isHouse || tile.terrain === 'WATER') return;
                actions.push({
                    type: 'MODIFY_TERRAIN', pos,
                    terrain: 'WATER',
                    flood: { turns: 2, was: tile.terrain },
                });
                const victim = simUnits.find(u => u.hp > 0 && u.position.x === pos.x && u.position.y === pos.y);
                if (!victim) return;
                if (survivesWater(victim)) return;
                actions.push({ type: 'APPLY_DAMAGE', targetId: victim.id, amount: 0, eventType: 'DROWN', pos });
                victim.hp = 0;
                killUnit(victim);
            });
        } else if (pending.type === 'DUST_VEIL') {
            /**
             * Nothing is hurt and nothing is blocked. The tile is simply dark for two turns,
             * and `blinded` above is the whole of the rule.
             *
             * `environment: 'SMOKE'` is set alongside the counter because that is the field
             * Tile.tsx has been drawing since long before anything could put it there — the
             * art for this hazard already existed and was waiting for a writer.
             */
            pending.tiles.forEach(pos => {
                const tile = getTileAt(pos, currentBoard);
                if (!tile) return;
                actions.push({
                    type: 'MODIFY_TERRAIN', pos,
                    environment: 'SMOKE',
                    smoke: { turns: 2 },
                });
            });
        } else if (pending.type === 'COLLAPSE') {
            // Hit first, THEN wall the tile. The other order would drop rubble on a living
            // unit and leave it standing inside a wall — every movement rule downstream
            // assumes a body is on walkable ground.
            //
            // 3 damage, and it does not care what the unit is: this is the one hazard that
            // reads the same to both sides, which is what makes standing a zombie on a marked
            // tile a real play rather than a coincidence.
            pending.tiles.forEach(pos => {
                const victim = simUnits.find(u => u.hp > 0 && u.position.x === pos.x && u.position.y === pos.y);
                if (victim) {
                    const r = calculateDamage(victim, 3, false);
                    actions.push({ type: 'APPLY_DAMAGE', targetId: victim.id, amount: r.finalDamage, eventType: 'DAMAGE', pos });
                    victim.hp = r.remainingHp;
                    victim.shield = r.remainingShield;
                    if (r.isFatal) killUnit(victim);
                }
                actions.push({ type: 'MODIFY_TERRAIN', pos, terrain: 'WALL' });
            });
        } else {
            // WIND_GUST and RAIL_SLIDE both shove whatever stands on a marked tile.
            const dx = pending.dx || 0;
            const dy = pending.dy || 0;
            const occupied = new Set(simUnits.map(u => `${u.position.x},${u.position.y}`));
            /** Greenspires emptied by this hazard, so two shoves cannot take one sprout twice. */
            const hazardEatenHouses = new Set<string>();

            // Shove the far side first so units don't pile into each other's old tiles.
            const order = [...simUnits].sort((a, b) =>
                (b.position.x * dx + b.position.y * dy) - (a.position.x * dx + a.position.y * dy));

            order.forEach(u => {
                if (!marked.has(`${u.position.x},${u.position.y}`)) return;
                if (u.hp <= 0) return;
                if (u.immunities.includes('PUSH')) return;

                // Same planner the skills and Storm Fan use, so wind drowns and chains exactly
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
                // Same trade the skill path makes (utils/actionBuilders.ts, applyPushPlan): a
                // boss blown into the sea by the wind lives, and pays for it with the turn it
                // had already telegraphed. Written here too because this hazard path builds its
                // own actions rather than going through applyPushPlan.
                plan.doused.forEach(id => {
                    const t = simUnits.find(s2 => s2.id === id);
                    if (!t) return;
                    actions.push({ type: 'APPLY_DAMAGE', targetId: id, amount: 0, eventType: 'DROWN', pos: t.position });
                    const wait: Intent = { type: 'WAIT', description: 'Dragged out of the water...' };
                    actions.push({ type: 'UPDATE_INTENT', unitId: id, intent: wait });
                    t.intent = wait;
                });
                plan.tookBrain.forEach(({ unitId, Greenspire }) => {
                    const t = simUnits.find(s2 => s2.id === unitId);
                    if (!t) return;
                    // Remember it here too: the board is the reducer's to change, so a second
                    // shove this same turn would otherwise claim the same sprout again.
                    hazardEatenHouses.add(`${Greenspire.x},${Greenspire.y}`);
                    actions.push({ type: 'BRAIN_LOST', pos: Greenspire, unitId });
                    t.hp = 0;
                });
                // Cùng cửa với mọi va chạm khác (`applyCollisionDamage`, utils/actionBuilders).
                // Bản gõ tay ở đây từng thiếu ba thứ: cờ bỏ-qua-giáp-mũ, ghi lại lớp chắn, và
                // cờ last-stand — nên va chạm trong lượt địch cư xử khác lượt người chơi.
                plan.collided.forEach(id => {
                    const t = simUnits.find(s2 => s2.id === id);
                    if (!t) return;
                    const r = applyCollisionDamage(t, 1, actions);
                    if (r?.isFatal) killUnit(t);
                });
            });
        }

        actions.push({ type: 'WAIT', duration: 250 });
        simUnits = simUnits.filter(u => u.hp > 0);
    }

    // --- PHASE 1: SPAWN REINFORCEMENTS (FROM QUEUE) ---
    /**
     * A scripted battle ignores the random roller entirely: its wave table says which zombie
     * arrives on which tile on which turn, and a tutorial that teaches "two Scrapcaps box you
     * in on turn 4" has to actually produce two Scrapcaps on turn 4.
     */
    const script = gameState.scriptedBattleId ? tutorialBattle(gameState.scriptedBattleId) : undefined;
    // PHASE 1 runs while gameState.turn is still the turn that just ENDED, and PHASE 5
    // increments it afterwards — so a wave keyed to turn N has to be spawned here on N-1 to
    // be standing on the board when the player actually sees turn N.
    const scriptedWave = script?.waves?.[gameState.turn + 1] ?? (script ? [] : undefined);

    const spawnQueue = scriptedWave
        ? scriptedWave.map(sp => ({ x: sp.x, y: sp.y }))
        : (gameState.enemySpawnQueue || []);
    /** The script's entry for a queued tile, when it names one. Index-aligned with spawnQueue. */
    const scriptedSpawnAt = (i: number) => scriptedWave?.[i];
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
             const painless = bracedAgainstCollision(occupant);
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
            let spawnClass = UnitClass.WALKER;
            const turnFactor = Math.min(1, gameState.turn / 10);
            
            // PvZ's huge wave lands on turn 6, and it is heralded by a Bannerman. Only one
            // stands at a time: while it lives every other zombie is ENRAGED, so it is the
            // single most valuable thing on the board to shoot.
            const flagOnBoard = simUnits.some(u => u.isEnemy && u.hp > 0 && u.class === UnitClass.BANNERMAN);
            if (gameState.turn >= FLAG_WAVE_TURN && !flagOnBoard && !flagQueued) {
                spawnClass = UnitClass.BANNERMAN;
                flagQueued = true;
            }
            // Balloon and Catapult are the two threats a melee wall cannot answer, so they
            // arrive early and stay common — they are what stops the fight being one note.
            else if (rand < 0.12) spawnClass = UnitClass.FLOATER;
            else if (rand < 0.24) spawnClass = UnitClass.LOBBER;
            else if (rand < 0.29 + (turnFactor * 0.1)) spawnClass = UnitClass.MINER;
            else if (rand < 0.34 + (turnFactor * 0.1)) spawnClass = UnitClass.DOORBEARER;
            else if (rand < 0.39 + (turnFactor * 0.1)) spawnClass = UnitClass.TATTERGUARD;
            else if (rand < 0.54 + (turnFactor * 0.2)) spawnClass = UnitClass.POTHELM; 
            else if (rand < 0.74 + (turnFactor * 0.2)) spawnClass = UnitClass.SCRAPCAP;

            // DEPTH BUDGET: only so many wall-ignoring zombies may share the board, and the
            // allowance grows with map depth. Over budget, the spawn downgrades to a Scrapcap
            // rather than being skipped — the wave keeps its size, it just stops being
            // unanswerable. Counts live enemies plus anything queued earlier this same turn.
            if (ADVANCED_ZOMBIES.has(spawnClass)) {
                const advancedAlive = simUnits.filter(
                    u => u.isEnemy && u.hp > 0 && ADVANCED_ZOMBIES.has(u.class)
                ).length;
                if (advancedAlive >= advancedZombieCap(gameState.depth)) {
                    // Let the herald try again on a later turn instead of burning its one slot.
                    if (spawnClass === UnitClass.BANNERMAN) flagQueued = false;
                    spawnClass = UnitClass.SCRAPCAP;
                }
            }

            // The script wins over every roll above.
            const scripted = scriptedSpawnAt(spawnIndex);
            if (scripted?.cls) spawnClass = scripted.cls;

            const enemyDef = unitDefs[spawnClass];
            // A scripted entry may hand-tune the body it places. Reinforcements are built here
            // and NOWHERE else, while `opening` spawns are built in useGameProgression — so
            // before this, an hpBonus/dmgBonus written on a WAVE entry silently did nothing.
            const scriptedHp = enemyDef.maxHp + (scripted?.hpBonus ?? 0);

            const newUnit: Unit = {
                id: `zombie_${Date.now()}_${Math.random()}`,
                type: UnitType.ZOMBIE, class: spawnClass, role: 'ENEMY',
                hp: scriptedHp, maxHp: scriptedHp, damage: enemyDef.damage + (scripted?.dmgBonus ?? 0), moveRange: enemyDef.moveRange,
                cooldownReduction: 0, level: 1, position: { x: pos.x, y: pos.y },
                isEnemy: true, hasMoved: false, hasAttacked: false, statusEffects: [],
                movementType: enemyDef.movementType, immunities: enemyDef.immunities, imgUrl: enemyDef.imgUrl,
                attackRange: enemyDef.attackRange ?? 1,
                armor: enemyDef.armor,
                intent: { type: 'MOVE', description: 'Hungry...' },
                spawnDelay: 0
            };

            // The blighted horde (utils/elements.ts): Stage III reinforcements roll the same
            // element the opening wave does. Skipped for scripted bodies — a replayed tutorial
            // or authored wave has to land exactly the unit its script promised.
            if (!scripted && ELEMENT_WORLDS.has(gameState.currentWorld)) {
                const rolled = rollEnemyElement(newUnit.damage);
                if (rolled) newUnit.element = rolled;
            }

            simUnits.push(newUnit);
            spawnedThisTurn.add(newUnit.id);
            actions.push({ type: 'SPAWN_UNIT', unit: { ...newUnit, spawnDelay: 0 } });
            actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'EMERGE', pos });
        }
    });

    if (spawnQueue.length > 0) {
        actions.push({ type: 'WAIT', duration: 300 }); 
    }

    // --- PHASE 1.5: BANNERMAN AURA ---
    // Derived every turn rather than stored, so the buff vanishes the instant the herald
    // dies — there is no stale +1 to unwind and no base stat to corrupt.
    {
        // Two things carry the aura, for the same reason: the Bannerman heralds a wave, and
        // The Headliner IS one. Sharing the status rather than inventing a second is what let
        // that boss ship without a new rule — see utils/bossBehaviours.ts.
        const AURA_SOURCES: UnitClass[] = [UnitClass.BANNERMAN, UnitClass.HEADLINER];
        const auraAlive = simUnits.some(u => u.isEnemy && u.hp > 0 && AURA_SOURCES.includes(u.class));
        simUnits.forEach(u => {
            if (!u.isEnemy || u.type === UnitType.OBSTACLE) return;
            const shouldRage = auraAlive && !AURA_SOURCES.includes(u.class);
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
            // Environment ignores helmet armour (gameLogic): the fire is inside the bucket.
            const result = calculateDamage(u, amount, piercing, true);
            actions.push({ type: 'APPLY_DAMAGE', targetId: u.id, amount: result.finalDamage, eventType: 'BURN', pos });
            if (result.bleedConsumed) {
                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { statusEffects: [...u.statusEffects] } });
            }
            u.hp = result.remainingHp;
            u.shield = result.remainingShield;
            // Same reason as the spike walk above: no shield action on this path.
            if (result.lastStandSpent) {
                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { lastStandUsed: true } });
            }
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

        // Apply Digesting Timer (Steel Jaws)
        // Read BEFORE the tick: a hero on the last turn of the window is still digesting
        // during it, and Photosynthetic Gut is paid for exactly that turn.
        const wasDigesting = !!u.digestingTurns && u.digestingTurns > 0;
        if (u.digestingTurns && u.digestingTurns > 0) {
            u.digestingTurns -= 1;
            actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { digestingTurns: u.digestingTurns } });
        }

        // A fused Sol Battery pays out every turn without costing the hero its action —
        // that is the whole reason to spend a fusion slot on economy (DESIGN.md section 6).
        // It still follows the one rule every Sol source obeys: a turn spent walking is a
        // turn without light. Being shoved does not count (hasMoved is only set on a
        // voluntary move), so a pushed Sol Battery keeps her income.
        //
        // SUN_WHILE_DIGESTING joins on the same terms but is fenced inside Snapmaw's helpless
        // window — the drawback IS the meter. Her card always said "while she chews"; the flat
        // SUN_PER_TURN it used to carry paid every turn of the fight regardless.
        if (!u.isEnemy && !dead && !u.hasMoved && !u.statusEffects.includes('STUN')) {
            const income = getFusionEffectValue(u, 'SUN_PER_TURN')
                + (wasDigesting ? getFusionEffectValue(u, 'SUN_WHILE_DIGESTING') : 0);
            if (income > 0) {
                actions.push({ type: 'GAIN_SUN', amount: income, pos });
            }
        }

        // Apply Passive Charging (Sol Battery — hai thân sinh Sol còn lại đã bỏ cùng đợt dọn cây)
        if (u.class === UnitClass.SOL_BATTERY && !u.statusEffects.includes('STUN')) {
             if (!u.sunCharge || u.sunCharge < 1) {
                 u.sunCharge = 1;
                 actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { sunCharge: 1 } });
             }
        }
    });

    // Spike fields age here, with the BURN tick, so everything that happens "just because a
    // turn passed" resolves in one block the player can predict. The field is only REMOVED at
    // the end of the turn (after PHASE 4), never here: a one-turn spike that expired before the
    // horde had moved could not be stepped on once, which is not an effect at all.
    simSpikes.forEach(field => { field.turns -= 1; });
    simSmoke.forEach(field => { field.turns -= 1; });
    simFlood.forEach(field => { field.turns -= 1; });

    // Cleanup Dead (Sim only)
    simUnits = simUnits.filter(u => u.hp > 0);

    /**
     * PLAYER STATUS EXPIRY — the other half of NEW_TURN_RESET.
     *
     * The reducer no longer clears STUN/SLOW off the squad, because that reset runs at the end
     * of THIS call and would erase a status the horde applied moments earlier. So the squad's
     * clock is spent here instead, and the placement is the whole of it:
     *   - AFTER PHASE 2, so a hero who sat out the last turn under a stun is correctly denied
     *     that turn's Sol (the income gates read STUN);
     *   - BEFORE PHASE 3, so an enemy is free to land a fresh stun on the same hero this turn,
     *     and PHASE 4 plans against the new one rather than an expired one.
     *
     * Cleared here rather than in the reducer for the same reason PROVOKED is: that reset lives
     * in the engine and knows nothing about which side of the turn a status came from.
     */
    simUnits.forEach(u => {
        if (u.isEnemy) return;
        if (!u.statusEffects.includes('STUN') && !u.statusEffects.includes('SLOW')) return;
        const cleared = u.statusEffects.filter(e => e !== 'STUN' && e !== 'SLOW');
        u.statusEffects = cleared;
        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { statusEffects: cleared } });
    });

    /**
     * GUARDED BLOOM (`ESCORTED`) — tính NGAY TRƯỚC pha địch đánh, và đó là toàn bộ lý do nó
     * nằm đúng chỗ này.
     *
     * `calculateDamage` chỉ nhận `target`, không hề thấy bàn cờ, nên "đang kề ally hay không"
     * phải được chốt thành một status trước khi đòn rơi. Khoảnh khắc đúng để chốt là lúc người
     * chơi vừa xếp xong đội hình và địch sắp vung tay — chốt sớm hơn thì một hero đi ra khỏi
     * nhóm vẫn mang giáp, chốt muộn hơn thì đòn đầu tiên đã tính bằng dữ liệu cũ.
     *
     * Quét sạch rồi dán lại mỗi lượt, cùng kỷ luật với `CONVOYED`.
     */
    {
        const allies = simUnits.filter(u => !u.isEnemy && u.hp > 0);
        allies.forEach(u => {
            const should = hasFusionEffect(u, 'ESCORTED_REDUCTION')
                && allies.some(o => o.id !== u.id
                    && Math.abs(o.position.x - u.position.x) + Math.abs(o.position.y - u.position.y) === 1);
            const had = u.statusEffects.includes('ESCORTED');
            if (had === should) return;
            const next = should
                ? [...u.statusEffects, 'ESCORTED' as const]
                : u.statusEffects.filter(e => e !== 'ESCORTED');
            u.statusEffects = next;
            actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { statusEffects: next } });
        });
    }

    // --- PHASE 3: ENEMY ACTIONS (EXECUTE INTENT) ---
    const enemies = simUnits.filter(u => u.isEnemy && !stunnedUnitIds.has(u.id));

    /** Greenspires robbed this turn, so two zombies on one doorstep cannot claim the same sprout. */
    const brainsTakenThisTurn = new Set<string>();
    /** Zombies that left carrying a sprout — removed from the board, not killed. */
    const brainThieves = new Set<string>();
    // BUTTER_RETALIATE and its `butteredThisTurn` limiter retired with Numbed Hide: the
    // stun rides Snapmaw's BITE now (STUN_ON_FULL_HP), where the "once per body, ever" condition
    // does the same policing without a per-turn set to keep in step.

    enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;

        const intent = enemy.intent;
        if (!intent) return;

        /**
         * BLINDED. The telegraph was made last turn in clear air; the dust arrived, or the
         * player shoved this body into it. Either way the swing does not happen.
         *
         * Placed ahead of everything — ahead of the burrow surface, the sprout grab, the strike
         * loop and the blast — because "cancels attacks" has to mean the whole action and not
         * its damage line. A Sandreaver blinded underground stays underground, which is the
         * correct reading of both rules at once.
         *
         * ATTACK ONLY. `SPAWN` used to be cancelled here too, and that was the two sides of
         * one rule disagreeing: the player's half (utils/gameLogic.ts, `getValidSkillTargets`)
         * stops a skill only when it carries a DAMAGE effect, because "dust takes away AIM" —
         * a shield, a taunt or a harvest needs no line of sight. A summon needs none either.
         * The Headliner shouting for four dancers is not a swing, and a veil that cancelled it
         * would make one 50-Sol pod the answer to the act whose whole thesis is the crowd.
         * Four callers ride this line — the Headliner, the Blightlord's echoes, the
         * Gravehulk's imp toss and `summon_backup` — and none of them is blinded now.
         *
         * KEYED ON THE INTENT TYPE, never on comparing `intent.target` to the unit's own
         * tile. Sandreaver's eruption is an ATTACK aimed at the square it is standing in
         * (damage 0, the ring lives in `strikes`), so a "only blocks attacks aimed elsewhere"
         * reading would let the one attack this hazard is most needed against sail straight
         * through, and nothing would look broken.
         */
        if (intent.type === 'ATTACK' && blinded(enemy.position)) {
            actions.push({ type: 'APPLY_DAMAGE', targetId: enemy.id, amount: 0, eventType: 'MISS', pos: enemy.position });
            return;
        }

        /**
         * COMING UP TO SWING. Written generically — "anything that attacks from under the board
         * surfaces to do it" — rather than as a Sandreaver branch, so the Miner inherits
         * it the day it sets the flag.
         *
         * It has to be HERE and not in a hook. Every boss hook runs in PHASE 4, after the blow
         * has already landed, so a flag cleared there would leave the eruption being thrown by
         * something the board is still drawing as empty sand — and the retaliation it eats would
         * come from a hero swinging at nothing.
         */
        if (enemy.isBurrowed && intent.type === 'ATTACK') {
            enemy.isBurrowed = false;
            actions.push({ type: 'UPDATE_UNIT_STATE', unitId: enemy.id, updates: { isBurrowed: false, burrowTarget: undefined } });
            actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'EMERGE', pos: { ...enemy.position } });
        }

        // BRAIN BITE — the follow-through on the telegraph set last turn (PHASE 4). The zombie
        // stood beside the Greenspire for a full turn first, so the player had a turn to kill it or
        // shove it away.
        //
        // It does NOT leave with the sprout. It used to: the thief was struck off the board,
        // which made robbing a Greenspire the safest thing a zombie could do and quietly removed
        // the unit the player most wanted to punish. Under ITB's rule the building loses what
        // it was holding and the thing that took it is still standing there next turn, with
        // one fewer Greenspire between it and the next one.
        if (intent.type === 'ATTACK' && intent.target) {
            const houseTile = getTileAt(intent.target, currentBoard);
            const houseKey = `${intent.target.x},${intent.target.y}`;
            const adjacent = Math.abs(intent.target.x - enemy.position.x)
                + Math.abs(intent.target.y - enemy.position.y) === 1;
            /**
             * THE WARDED DOOR (PLAN-hero-zephyr §6.3). A Greenspire wearing Gourdward's layer
             * (TileData.shielded) answers the bite the way any layer answers any blow: the
             * layer breaks, the sprout does not move, and the zombie is still standing on the
             * doorstep — it re-telegraphs next turn, and Reinforce next turn is the
             * tug-of-war the mechanic exists for. Mutating the sim tile matters: a SECOND
             * biter this same phase must find the shell already gone.
             */
            if (adjacent && houseTile?.isHouse && houseTile.hasBrain && houseTile.shielded) {
                houseTile.shielded = false;
                actions.push({ type: 'UNIT_ATTACK', unitId: enemy.id, targetPos: intent.target, attackRange: 'MELEE' });
                actions.push({ type: 'MODIFY_TERRAIN', pos: { x: intent.target.x, y: intent.target.y }, shielded: false });
                actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'BLOCK', pos: intent.target });
                return;
            }
            if (adjacent && houseTile?.isHouse && houseTile.hasBrain && !brainsTakenThisTurn.has(houseKey)) {
                brainsTakenThisTurn.add(houseKey);
                actions.push({ type: 'UNIT_ATTACK', unitId: enemy.id, targetPos: intent.target, attackRange: 'MELEE' });
                actions.push({ type: 'BRAIN_LOST', pos: { x: intent.target.x, y: intent.target.y } });
                return;
            }
        }

        if (intent.type === 'ATTACK' && intent.target) {
          /**
           * STRIKES — this intent is N SEPARATE BLOWS, not one blow with a footprint.
           *
           * The difference from BLAST below is not how many tiles are hit, it is who answers
           * back. A blast is one weapon reaching several squares: no retaliation, no status
           * rider, and it cannot kill its own owner partway through. A strike is a whole
           * attack, so everything in this branch — thorns, the element rider, RETALIATE_FREEZE,
           * RETALIATE_PUSH, statusOnHit, the fatal-blow cleanup — runs once per blow. That is
           * what makes Thornshell the answer to a boss that swings twice, and it is exactly why
           * the two fields were not merged.
           *
           * THE INVARIANT. With `strikes` absent — every other unit in every fight, including
           * all seven tutorial replays — `blows` is `[intent.target]`, the SAME object, the
           * loop turns once, and the actions emitted are identical element for element to what
           * they were before. The break at the bottom fires on a loop that was ending anyway
           * and pushes nothing. data/tutorial.assert.ts replays the whole chain through
           * processTurn on every dev boot; that is the check.
           */
          const blows: AreaHit[] = intent.strikes?.length
              ? intent.strikes
              : [{ pos: intent.target, damage: intent.damage ?? 0 }];
          for (const blow of blows) {
            const at = blow.pos;
            actions.push({ type: 'UNIT_ATTACK', unitId: enemy.id, targetPos: at, attackRange: (enemy.attackRange ?? 1) > 1 ? 'LOB' : 'MELEE' });
            
            const targetUnit = getUnitAt(at, simUnits);
            if (targetUnit) {
                /**
                 * IN CONTACT? Everything the defender answers WITH is gated on this.
                 *
                 * Every retaliation card in the game says "anything that hits her IN MELEE",
                 * and the engine never checked — so a Catapult lobbing from three tiles away
                 * was impaled by thorns it never touched, and a provoked artillery piece was
                 * the single most profitable thing Thornshell could shout at. Spines cut what
                 * reaches them. Ranged attackers still come when Provoked; they simply do not
                 * bleed for it, which is the trade Provoke has always been described as making.
                 */
                const inMelee = Math.abs(enemy.position.x - targetUnit.position.x)
                    + Math.abs(enemy.position.y - targetUnit.position.y) <= 1;

                // Apply Damage logic consistent with App.tsx
                // Each blow's own number. With `strikes` absent this is `intent.damage`
                // verbatim — the seeded single entry above carries it — so the ordinary path
                // is unchanged.
                const result = calculateDamage(targetUnit, blow.damage || 0, false);

                // Shield Logic
                if (result.shieldDamage > 0) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'BLOCK', pos: at });
                    // GLASS RIND (BARBED_SHIELD): the layer that just broke was spiked, so the
                    // flag dies with it — written in the same update as the shield it belongs
                    // to, which is what keeps the two from ever disagreeing.
                    const barbed = !!targetUnit.shieldBarbed;
                    // PAYBACK SHELL (SHIELD_BREAK_STUN): cùng kỷ luật với Glass Rind — cờ nằm
                    // trên LỚP, đọc trước khi lớp vỡ, và chết trong cùng một update với nó.
                    const stuns = !!targetUnit.shieldStuns;
                    // SUNLIT RIND (SHIELD_REFUND): khiên phải LÀM VIỆC mới được trả. Đọc trước
                    // khi lớp vỡ, và số tiền nằm trên LỚP nên nó vẫn hoàn kể cả khi Gourdward
                    // đã chết — cùng lý do Glass Rind không tra ngược về người phát.
                    const refund = targetUnit.shieldRefund ?? 0;
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { ...shieldUpdatesFor(result), shieldBarbed: false, shieldStuns: false, shieldRefund: 0, shieldSpined: false } });
                    targetUnit.shield = result.remainingShield;
                    targetUnit.shieldBarbed = false;
                    targetUnit.shieldStuns = false;
                    targetUnit.shieldRefund = 0;
                    targetUnit.shieldSpined = false;
                    if (refund > 0) {
                        actions.push({ type: 'GAIN_SUN', amount: refund, pos: targetUnit.position });
                    }
                    // Melee only, like every other answer below: a stone lobbed from three
                    // tiles away shatters the glass without ever touching it.
                    if (barbed && inMelee && enemy.hp > 0) {
                        const upd = addBleedStack(enemy);
                        if (upd) actions.push({ type: 'UPDATE_UNIT_STATE', unitId: enemy.id, updates: upd });
                    }
                    // Payback Shell: kẻ ĐẬP VỠ lớp bị ghim lượt kế. Melee-only cùng lý do Glass
                    // Rind — hòn đá ném từ ba ô làm vỡ kính mà không hề chạm vào nó. Cái giá của
                    // ngoại lệ STUN RULE này nằm ở chỗ nó đến CHẬM một nhịp và địch phải tự đấm.
                    if (stuns && inMelee && enemy.hp > 0 && !enemy.statusEffects.includes('STUN')) {
                        const stunned: typeof enemy.statusEffects = [...enemy.statusEffects, 'STUN'];
                        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: enemy.id, updates: { statusEffects: stunned } });
                        enemy.statusEffects = stunned;
                    }
                }

                if (result.finalDamage > 0) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: result.finalDamage, eventType: 'DAMAGE', pos: at });
                    targetUnit.hp = result.remainingHp;

                    /**
                     * REACTIVE COB SHELL (`REACTIVE_SHIELD`) — ăn đòn xong thì vỏ bọc lại.
                     *
                     * Gate trên `finalDamage > 0`, tức đòn phải thực sự VÀO MÁU: đòn bị lớp
                     * chắn cũ nuốt hoặc bị giáp mũ clang về 0 không kích — nếu không thì lớp
                     * này tự tái sinh ngay chính cú đánh nó vừa chặn, tức bất tử.
                     *
                     * `grantLayer` từ chối khi thân đã có lớp, nên nó cũng không mọc chồng: một
                     * lớp, vỡ, đòn sau mới mọc lại. Đúng nhịp "pháo thủ chịu được đúng một cú
                     * áp sát mỗi lần".
                     */
                    if (targetUnit.hp > 0 && hasFusionEffect(targetUnit, 'REACTIVE_SHIELD')) {
                        const upd = grantLayer(targetUnit);
                        if (upd) {
                            actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: upd });
                            actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'BLOCK', pos: at });
                        }
                    }
                }

                /**
                 * STATUS ON THE SWING (Intent.statusOnHit).
                 *
                 * Immunity rules are the ones the rest of this file already uses: STATUS stops
                 * everything, FREEZE stops STUN and FREEZE only, and a plain SLOW gets through
                 * FREEZE immunity on purpose — that carve-out (see UnitImmunity in types.ts) is
                 * what keeps control tools alive against a Gravehulk.
                 *
                 * Skipped on a fatal blow: a corpse does not need freezing, and the update
                 * would land on a unit UNIT_DIE is about to remove.
                 */
                if (!result.isFatal && intent.statusOnHit?.length) {
                    // BURN joined this list with the blighted horde's FIRE rider — before
                    // that no enemy ever put a burn on statusOnHit, so the gap was invisible.
                    const blocked = (e: StatusEffectType) =>
                        targetUnit.immunities.includes('STATUS')
                        || ((e === 'STUN' || e === 'FREEZE') && targetUnit.immunities.includes('FREEZE'))
                        || (e === 'BURN' && targetUnit.immunities.includes('BURN'));
                    if (intent.statusOnHit.some(blocked)) {
                        actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'IMMUNE', pos: at });
                    }
                    const landed = intent.statusOnHit.filter(e => !blocked(e) && !targetUnit.statusEffects.includes(e));
                    if (landed.length > 0) {
                        const next: typeof targetUnit.statusEffects = [...targetUnit.statusEffects, ...landed];
                        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: next } });
                        targetUnit.statusEffects = next;
                    }
                }

                /**
                 * THE HORDE'S RULE L3 — a blighted LIGHTNING zombie's blow arcs one tile on.
                 *
                 * Part of the BLOW, so it sits here with the statusOnHit rider and ahead of
                 * the retaliation blocks: thorns are the defender ANSWERING the swing, and the
                 * arc must not be silenced by the answer killing the swinger. It also runs on
                 * a fatal primary hit — the heroes' arc jumps onward from a body it just
                 * killed, and one rulebook for both sides is the whole feature.
                 *
                 * `chainDamageFor` off the ZOMBIE's stat, exactly as heroes arc off theirs —
                 * never off the blow (an ENRAGED +1 must not compound into the next tile).
                 * `rollEnemyElement` already refuses LIGHTNING to damage-1 bodies, so the
                 * zero-arc guard here is a backstop, not the rule.
                 *
                 * The struck set seeds the swinger's tile AND the target's: an arc that came
                 * back to the attacker is nonsense, and the primary target already took the
                 * whole blow. No resonance hop — resonance is the SQUAD's reward for a
                 * unanimous pick, and the horde never picked anything.
                 */
                if (enemy.element === 'LIGHTNING' && !enemy.bossId) {
                    const arcDamage = chainDamageFor(enemy);
                    if (arcDamage > 0) {
                        const struck = new Set<string>([
                            `${enemy.position.x},${enemy.position.y}`, `${at.x},${at.y}`,
                        ]);
                        const [arcTarget] = chainStep(at,
                            p => simUnits.find(u => u.hp > 0 && u.position.x === p.x && u.position.y === p.y),
                            // SHOCK-immune bodies are not conductors: the horde's arc cannot
                            // pick a lightning hero as its hop, same rule as SURGE.
                            u => !u.isEnemy && u.type !== UnitType.OBSTACLE && !u.immunities.includes('SHOCK'), struck);
                        if (arcTarget) {
                            actions.push({ type: 'UNIT_ATTACK', unitId: enemy.id, targetPos: { ...arcTarget.position }, attackRange: 'LINE', isArc: true });
                            const arc = calculateDamage(arcTarget, arcDamage, false);
                            if (arc.shieldDamage > 0) {
                                actions.push({ type: 'APPLY_DAMAGE', targetId: arcTarget.id, amount: 0, eventType: 'BLOCK', pos: arcTarget.position });
                                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: arcTarget.id, updates: { shield: arc.remainingShield } });
                            }
                            if (arc.finalDamage > 0) {
                                actions.push({ type: 'APPLY_DAMAGE', targetId: arcTarget.id, amount: arc.finalDamage, eventType: 'DAMAGE', pos: arcTarget.position });
                            }
                            arcTarget.hp = arc.remainingHp;
                            arcTarget.shield = arc.remainingShield;
                            if (arc.isFatal) {
                                killUnit(arcTarget);
                                const idx = simUnits.findIndex(u => u.id === arcTarget.id);
                                if (idx !== -1) simUnits.splice(idx, 1);
                            }
                        }
                    }
                }

                // --- RETALIATION (innate thorns + Biting Wall / Frostbite Armor) ---
                // Resolved before the defender is cleared away: a wall built to be attacked
                // gets its answer in even on the blow that destroys it, which is the whole
                // reason the fusion is worth a slot.
                //
                // The two sources ADD. Thornshell's spines are the hero itself, so a fusion
                // bought on top has to be an upgrade — if it replaced the innate value, the
                // one hero the fusion is thematically for would gain nothing from it.
                //
                // ...and only against something IN CONTACT (see `inMelee` above): the thorns
                // are on the body, so they answer what reached the body.
                // SPINED RIND (SHIELD_RETALIATE): gai nằm trên LỚP CHẮN, không nằm trên thân —
                // nên nó đi cùng lớp sang bất kỳ ai Gourdward bọc, và tắt ngay khi lớp vỡ. Đây
                // là cách anh trả đòn THAY người anh hộ vệ. Cộng vào cùng con số `thorns` để
                // RETALIATION RULE vẫn chỉ có MỘT nơi cộng, không phải hai đường phản đòn.
                const shieldThorns = (targetUnit.shield ?? 0) > 0 && targetUnit.shieldSpined ? 1 : 0;
                /**
                 * BRISTLEBACK (`DIGEST_RETALIATE`) — gai chỉ dựng lên trong lúc anh đang nhai.
                 *
                 * Luật của cả hàng Snapmaw: mọi ô phải đánh vào CỬA SỔ TIÊU HOÁ. Ô này biến
                 * quãng bất lực thành cái bẫy — đàn zombie xúm vào lúc anh không đỡ được là
                 * lúc chúng phải trả tiền. Ngoài cửa sổ thì bằng 0, nên nó KHÔNG phải một bản
                 * `RETALIATE_DAMAGE` rẻ tiền.
                 *
                 * Đúng **1** theo RETALIATION RULE (L3) — sầu riêng ghép lên người khác phản 1;
                 * ngoại lệ 3 chỉ thuộc về Bristling Armor nội tại của Thornshell. Cộng vào cùng
                 * biến `thorns` để cả game vẫn chỉ có MỘT nơi cộng phản đòn.
                 */
                const digestThorns = (targetUnit.digestingTurns ?? 0) > 0
                    && hasFusionEffect(targetUnit, 'DIGEST_RETALIATE') ? 1 : 0;
                // THORNED BLOOM (`BLESS_RETALIATE`): gai Sunbloom gửi kèm lời ban phước. Cộng
                // vào cùng chỗ với ba nguồn trên — RETALIATION RULE có MỘT nơi cộng, và ô này
                // là ô CỘNG DỒN nên nó phải nằm đúng trong phép cộng đó chứ không đứng riêng.
                const blessThorns = targetUnit.blessThorns ? 1 : 0;
                const thorns = inMelee
                    ? (targetUnit.retaliateDamage ?? 0) + getFusionEffectValue(targetUnit, 'RETALIATE_DAMAGE') + shieldThorns + digestThorns + blessThorns
                    : 0;
                if (thorns > 0) {
                    const back = calculateDamage(enemy, thorns, false);
                    actions.push({ type: 'APPLY_DAMAGE', targetId: enemy.id, amount: back.finalDamage, eventType: 'DAMAGE', pos: enemy.position });
                    if (back.bleedConsumed) {
                        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: enemy.id, updates: { statusEffects: [...enemy.statusEffects] } });
                    }
                    // Battle ledger. Retaliation is the one damage source with no skill cast
                    // behind it, so without this line Thornshell's whole output happens during
                    // the ENEMY's turn and the report prints him as a bystander.
                    const ledgered = back.shieldDamage + back.finalDamage;
                    if (targetUnit.heroId && ledgered > 0) {
                        actions.push({ type: 'TRACK_STAT', heroId: targetUnit.heroId, stat: 'damageDealt', amount: ledgered });
                    }
                    enemy.hp = back.remainingHp;
                    enemy.shield = back.remainingShield;
                    if (back.isFatal) {
                        killUnit(enemy);
                        // Same credit pushKill hands out: the wall finished what bit it.
                        if (targetUnit.heroId) {
                            actions.push({ type: 'TRACK_STAT', heroId: targetUnit.heroId, stat: 'kills', amount: 1 });
                        }
                    }
                }

                /**
                 * RULE L4 — the element rides the retaliation too (PLAN-progression.md § 3).
                 *
                 * An element belongs to the HERO, not to a skill object, so it has to reach
                 * every source of damage that hero has. Retaliation is the one source no skill
                 * is involved in at all — it is billed right here, off `retaliateDamage` — so
                 * without this block Thornshell would be the single hero in the roster whose
                 * element does nothing on the thing he is actually built to do.
                 *
                 * Gated on `thorns > 0` because the element rides the RETALIATION: a hero who
                 * does not answer back has no attack here to attach anything to.
                 *
                 * This lands before PHASE 4, which is the point. PHASE 4 re-reads
                 * statusEffects, so an ICE hero's SLOW halves the biter's ground on the very
                 * turn it bit — the same immediacy RETALIATE_FREEZE below relies on.
                 */
                if (thorns > 0 && enemy.hp > 0 && targetUnit.element) {
                    if (targetUnit.element === 'ICE') {
                        // FREEZE immunity is deliberately NOT checked, matching skillResolution:
                        // something too heavy to freeze solid can still be chilled into moving
                        // slower. STATUS immunity (Doorbearer) still stops everything.
                        if (enemy.immunities.includes('STATUS')) {
                            actions.push({ type: 'APPLY_DAMAGE', targetId: enemy.id, amount: 0, eventType: 'IMMUNE', pos: enemy.position });
                        } else if (resonance === 'ICE'
                            && enemy.statusEffects.includes('SLOW')
                            && !enemy.statusEffects.includes('STUN')
                            && !enemy.immunities.includes('FREEZE')) {
                            // ICE RESONANCE, same rule as skillResolution: a chill landing on
                            // something already chilled sets it solid. Retaliation is a slow
                            // like any other, and leaving it out would make the one hero built
                            // to be attacked the one hero the resonance ignores.
                            //
                            // FREEZE immunity IS checked on this branch only, because this
                            // branch lands a STUN — the plain slow below stays exempt for the
                            // Gravehulk reasons above.
                            //
                            // The set-up has to come from the player's own turn: SLOW is wiped
                            // by NEW_TURN_RESET at the end of this call, so what triggers this
                            // is a hero who slowed the biter before it ever reached the wall.
                            const frozen: typeof enemy.statusEffects = [...enemy.statusEffects, 'STUN'];
                            actions.push({ type: 'UPDATE_UNIT_STATE', unitId: enemy.id, updates: { statusEffects: frozen } });
                            enemy.statusEffects = frozen;
                        } else if (!enemy.statusEffects.includes('SLOW')) {
                            const slowed: typeof enemy.statusEffects = [...enemy.statusEffects, 'SLOW'];
                            actions.push({ type: 'UPDATE_UNIT_STATE', unitId: enemy.id, updates: { statusEffects: slowed } });
                            enemy.statusEffects = slowed;
                        }
                    } else if (targetUnit.element === 'FIRE') {
                        if (enemy.immunities.includes('BURN')) {
                            actions.push({ type: 'APPLY_DAMAGE', targetId: enemy.id, amount: 0, eventType: 'IMMUNE', pos: enemy.position });
                        } else if (!enemy.statusEffects.includes('BURN')) {
                            const burning: typeof enemy.statusEffects = [...enemy.statusEffects, 'BURN'];
                            actions.push({ type: 'UPDATE_UNIT_STATE', unitId: enemy.id, updates: { statusEffects: burning } });
                            // PHASE 2 has already run this turn, so the first tick is next
                            // turn's — the bite costs the horde a turn of standing still.
                            actions.push({ type: 'APPLY_DAMAGE', targetId: enemy.id, amount: 0, eventType: 'BURN', pos: enemy.position });
                            enemy.statusEffects = burning;
                        }
                    } else if (targetUnit.element === 'LIGHTNING') {
                        // Half the HERO's damage stat, never the retaliation value: `thorns`
                        // carries the RETALIATE_DAMAGE fusions on top of it, and letting the
                        // arc compound off a stacked number is exactly the runaway L3 exists
                        // to prevent. No minimum, so a 0-1 damage body arcs for nothing —
                        // and unlike the skill arc there is no shove to carry, so an arc worth
                        // 0 is skipped outright rather than emitted as an empty hit.
                        const arcDamage = chainDamageFor(targetUnit);
                        /**
                         * LIGHTNING RESONANCE — one further hop, on from the body just struck.
                         *
                         * `arced` is what keeps the chain honest: the biter is in it from the
                         * start (an arc that came back to the thing that bit you is a second
                         * retaliation, not a chain) and every body it reaches joins it, so the
                         * two hops can never share a target. The second hop carries the SAME
                         * undiminished arcDamage — halving a half is 0 across most of the
                         * roster, and a reward for committing three heroes that deals 0 is not
                         * a reward.
                         */
                        // Keyed by TILE now that the walk is shared (chainStep, utils/elements.ts).
                        // Same set as the old id-based one: a body stands on one square, and the
                        // biter's own square going in is the same rule as the biter's id.
                        const arced = new Set<string>([`${enemy.position.x},${enemy.position.y}`]);
                        let arcFrom = enemy.position;
                        for (let hop = 0; arcDamage > 0 && hop < (resonance === 'LIGHTNING' ? 2 : 1); hop++) {
                            // One hop per iteration, so hop two reads the board hop one left.
                            // Fixed CHAIN_OFFSETS order lives in chainStep now, for the same
                            // reason it lived here: perfect information means no dice inside a
                            // resolution.
                            const [arcTarget] = chainStep(arcFrom,
                                p => simUnits.find(u => u.position.x === p.x && u.position.y === p.y),
                                u => u.isEnemy && u.type !== UnitType.OBSTACLE, arced);
                            // Nothing adjacent left: the chain stops rather than reaching.
                            if (!arcTarget) break;
                            const arc = calculateDamage(arcTarget, arcDamage, false);
                            actions.push({ type: 'APPLY_DAMAGE', targetId: arcTarget.id, amount: arc.finalDamage, eventType: 'DAMAGE', pos: arcTarget.position });
                            // Battle ledger: the retaliation arc is the hero's element working,
                            // same authorship as the thorns it rode in on.
                            const arcLedgered = arc.shieldDamage + arc.finalDamage;
                            if (targetUnit.heroId && arcLedgered > 0) {
                                actions.push({ type: 'TRACK_STAT', heroId: targetUnit.heroId, stat: 'damageDealt', amount: arcLedgered });
                            }
                            arcTarget.hp = arc.remainingHp;
                            arcTarget.shield = arc.remainingShield;
                            if (arc.isFatal) {
                                killUnit(arcTarget);
                                if (targetUnit.heroId) {
                                    actions.push({ type: 'TRACK_STAT', heroId: targetUnit.heroId, stat: 'kills', amount: 1 });
                                }
                            }
                            arcFrom = arcTarget.position;
                        }
                    }
                }

                /**
                 * RETALIATE_FREEZE — the TWO-STEP chill (Frostbite Armor / Frostguard).
                 *
                 * It used to stun outright on every bite: a free lost-turn-per-turn, the
                 * exact thing the STUN RULE in data/fusionRecipes.ts bans, and stronger than
                 * either card's own text. Now the first bite slows; a bite landed while the
                 * attacker is ALREADY slowed sets it solid — the same escalation the ICE
                 * element and its resonance use, so one lesson covers all three.
                 *
                 * Immunity split matches the rest of the file: STATUS refuses everything,
                 * FREEZE refuses only the escalation to STUN — a Gravehulk still gets
                 * chilled, it just never locks. Note the enemy-side SLOW is wiped by
                 * NEW_TURN_RESET, so the freeze needs two bites in ONE turn (a boss's double
                 * strike, two zombies on one wall) or a slow the player landed themselves.
                 */
                if (enemy.hp > 0 && inMelee && hasFusionEffect(targetUnit, 'RETALIATE_FREEZE')) {
                    if (enemy.immunities.includes('STATUS')) {
                        actions.push({ type: 'APPLY_DAMAGE', targetId: enemy.id, amount: 0, eventType: 'IMMUNE', pos: enemy.position });
                    } else if (enemy.statusEffects.includes('SLOW')
                        && !enemy.statusEffects.includes('STUN')
                        && !enemy.immunities.includes('FREEZE')) {
                        // PHASE 4 re-reads statusEffects, so the attacker loses its move this
                        // very turn — biting the wall twice costs it the ground it came for.
                        const frozen: typeof enemy.statusEffects = [...enemy.statusEffects, 'STUN'];
                        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: enemy.id, updates: { statusEffects: frozen } });
                        enemy.statusEffects = frozen;
                    } else if (!enemy.statusEffects.includes('SLOW')) {
                        const chilled: typeof enemy.statusEffects = [...enemy.statusEffects, 'SLOW'];
                        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: enemy.id, updates: { statusEffects: chilled } });
                        enemy.statusEffects = chilled;
                    }
                }

                /**
                 * RETALIATE_BLEED (Rending Husk) — the Steel Jaws axis worn facing OUTWARD.
                 *
                 * Outside the STATUS immunity gate, exactly like the APPLY_BLEED rider it
                 * mirrors (PLAN-hero-zephyr §8, decision 13): a wound is physical, and bosses
                 * bleed. No stacking — bitten twice is still one wound — and no damage of its
                 * own: it MARKS the biter for whoever swings next, which is the whole point on
                 * a hero who drags four bodies into contact and cannot finish any of them.
                 */
                if (enemy.hp > 0 && inMelee
                    && hasFusionEffect(targetUnit, 'RETALIATE_BLEED')) {
                    const upd = addBleedStack(enemy);
                    if (upd) actions.push({ type: 'UPDATE_UNIT_STATE', unitId: enemy.id, updates: upd });
                }

                // --- RETALIATE_PUSH (the Spring Arm row) ---
                // Damage is not the answer this fusion sells: the biter is thrown off the wall
                // it just spent its turn walking up to, so it has to pay for the same ground
                // twice. Routed through planPush/applyPushPlan like every other shove in the
                // game, so it drowns, chains and hands over sprouts by identical rules.
                /**
                 * JAMMING PLATE (RETALIATE_ROOT) — thứ gì đấm vào giáp cô thì kẹt lại đó.
                 *
                 * Hai nửa của một câu, đặt cùng lúc: `ROOTED` cắt nửa di chuyển của lượt sau,
                 * và `PROVOKED` + `provokedBy` khoá nó vào chính cô — nên nó không đi được mà
                 * cũng không quay sang tìm ai khác. Vẫn ĐÁNH được, và đó là chỗ ô này khác
                 * STUN: không lượt nào bị xoá, con zombie vẫn hành động, chỉ là hành động vào
                 * đúng người vừa kẹp nó. Ăn đòn là nghề của cô — Sunstone Shield còn trả tiền
                 * cho việc đó. Vì thế STUN RULE không bị đụng tới.
                 *
                 * Melee-only như mọi phản đòn khác (L4): gai cắt thứ chạm tới nó.
                 */
                if (enemy.hp > 0 && inMelee && hasFusionEffect(targetUnit, 'RETALIATE_ROOT')
                    && !enemy.immunities.includes('STATUS')) {
                    const next: typeof enemy.statusEffects = [...enemy.statusEffects];
                    if (!next.includes('ROOTED')) next.push('ROOTED');
                    if (!next.includes('PROVOKED')) next.push('PROVOKED');
                    actions.push({
                        type: 'UPDATE_UNIT_STATE',
                        unitId: enemy.id,
                        updates: { statusEffects: next, provokedBy: targetUnit.id },
                    });
                    enemy.statusEffects = next;
                    enemy.provokedBy = targetUnit.id;
                }

                if (enemy.hp > 0 && inMelee && hasFusionEffect(targetUnit, 'RETALIATE_PUSH')) {
                    const offX = enemy.position.x - targetUnit.position.x;
                    const offY = enemy.position.y - targetUnit.position.y;
                    // "Away from me" along one axis. A melee attacker is always axis-aligned;
                    // a ranged one may not be, so the longer leg wins and the shove stays cardinal.
                    const dx = Math.abs(offX) >= Math.abs(offY) ? Math.sign(offX) : 0;
                    const dy = dx === 0 ? Math.sign(offY) : 0;
                    if (dx !== 0 || dy !== 0) {
                        const living = simUnits.filter(u => u.hp > 0);
                        const plan = planPush(enemy, dx, dy, living, currentBoard, terrainDefs, 3, brainsTakenThisTurn);
                        // applyPushPlan works on a map of the very same objects, so the sim
                        // sees the new positions and hp without a second pass.
                        applyPushPlan(plan, actions, new Map(living.map(u => [u.id, u])), targetUnit);
                        plan.tookBrain.forEach(({ unitId, Greenspire }) => {
                            brainsTakenThisTurn.add(`${Greenspire.x},${Greenspire.y}`);
                            brainThieves.add(unitId);
                        });
                    }
                }

                /**
                 * A blow that MOVES what it hits (Intent.pushOnHit). RETALIATE_PUSH above is
                 * the defender's version of exactly this; this is the attacker's. It lives on
                 * the INTENT rather than the unit because the shove belongs to the BLOW — the
                 * eruption throws, the ordinary swipe does not — and it is routed through
                 * planPush/applyPushPlan so it drowns, chains and hands over sprouts by the same
                 * rules as every other shove in the game.
                 */
                if ((intent.pushOnHit ?? 0) > 0 && !result.isFatal && targetUnit.hp > 0) {
                    const offX = targetUnit.position.x - enemy.position.x;
                    const offY = targetUnit.position.y - enemy.position.y;
                    const dx = Math.abs(offX) >= Math.abs(offY) ? Math.sign(offX) : 0;
                    const dy = dx === 0 ? Math.sign(offY) : 0;
                    if (dx !== 0 || dy !== 0) {
                        const living = simUnits.filter(u => u.hp > 0);
                        const plan = planPush(targetUnit, dx, dy, living, currentBoard, terrainDefs, 3, brainsTakenThisTurn, intent.pushOnHit);
                        applyPushPlan(plan, actions, new Map(living.map(u => [u.id, u])), enemy);
                        plan.tookBrain.forEach(({ unitId, Greenspire }) => {
                            brainsTakenThisTurn.add(`${Greenspire.x},${Greenspire.y}`);
                            brainThieves.add(unitId);
                        });
                    }
                }

                if (result.isFatal) {
                    killUnit(targetUnit);
                    // Remove from simUnits immediately
                    const idx = simUnits.findIndex(u => u.id === targetUnit.id);
                    if (idx !== -1) simUnits.splice(idx, 1);
                }
            } else {
                actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'MISS', pos: at });
            }
            // A boss can die BETWEEN its own blows. Thornshell's spines answer each beat
            // separately and RETALIATE_PUSH can drown the attacker outright — either way a
            // corpse does not finish its swing. `killUnit` has already run above; this only
            // stops a second UNIT_ATTACK being emitted after the death.
            if (enemy.hp <= 0) break;
          }
        } else if (intent.type === 'SPAWN' && intent.target) {
            // Whatever the behaviour named, on every tile it named. This was hardcoded to one
            // Runt on one tile because the Gravehulk was the only thing that summoned; the
            // Headliner calls four dancers at once, and a summon that silently dropped three
            // of them would make its own telegraph a lie.
            const spawnClass = intent.spawnClass ?? UnitClass.RUNT;
            const def = unitDefs[spawnClass];
            const tiles = intent.spawnTiles?.length ? intent.spawnTiles : [intent.target];

            tiles.forEach((tile, i) => {
                // Re-checked per tile against the LIVE sim: an earlier body in this same
                // summon may have taken the tile a moment ago.
                if (getUnitAt(tile, simUnits)) return;
                // `spawnHp` overrides the class's own bar. An echo of a boss is that boss's
                // body at 4 HP, not that boss.
                const bodyHp = intent.spawnHp ?? def.maxHp;
                const spawned: Unit = {
                    id: `spawn_${Date.now()}_${i}_${Math.random()}`,
                    type: UnitType.ZOMBIE, class: spawnClass, role: 'ENEMY',
                    hp: bodyHp, maxHp: bodyHp, damage: def.damage, moveRange: def.moveRange,
                    cooldownReduction: 0, level: 1, position: tile,
                    isEnemy: true, hasMoved: true, hasAttacked: true, statusEffects: [],
                    movementType: def.movementType, immunities: def.immunities, imgUrl: def.imgUrl,
                    attackRange: def.attackRange ?? 1,
                    armor: def.armor,
                    intent: { type: 'MOVE', description: 'Landing...' },
                    spawnDelay: 0
                };
                simUnits.push(spawned);
                actions.push({ type: 'SPAWN_UNIT', unit: { ...spawned, spawnDelay: 0 } });
            });
        }

        /**
         * BLAST — every extra tile this intent lands on (Intent.blast).
         *
         * OUTSIDE the type ladder on purpose. An arc rides an ATTACK, a grid discharging rides
         * a WAIT, and the GRID sector's hazard will ride nothing at all: three callers, one
         * resolution. Written inside the ladder it would have to be written three times, which
         * is the mistake the shared field exists to prevent.
         *
         * PLAIN DAMAGE. No retaliation, no element rider, no shove, no sprout grab. Thorns
         * answer something that came and stood in front of you; a shell, a bolt across the
         * floor and a bomb from altitude are none of those, and a Thornshell answering four
         * blast tiles would kill a boss through a wall it never touched.
         *
         * Whoever is standing there, friend or horde. That is what lets a boss hurt ITSELF
         * with no special case anywhere: the tile under its feet is in the list like any other.
         */
        (intent.blast ?? []).forEach(hit => {
            const victim = getUnitAt(hit.pos, simUnits);
            if (!victim || victim.hp <= 0) return;
            actions.push({ type: 'UNIT_ATTACK', unitId: enemy.id, targetPos: hit.pos, attackRange: 'LINE' });

            const res = calculateDamage(victim, hit.damage, false);
            if (res.shieldDamage > 0) {
                actions.push({ type: 'APPLY_DAMAGE', targetId: victim.id, amount: 0, eventType: 'BLOCK', pos: hit.pos });
                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: victim.id, updates: shieldUpdatesFor(res) });
                victim.shield = res.remainingShield;
            }
            if (res.finalDamage > 0) {
                actions.push({ type: 'APPLY_DAMAGE', targetId: victim.id, amount: res.finalDamage, eventType: 'DAMAGE', pos: hit.pos });
                victim.hp = res.remainingHp;
            }

            if (hit.stun && !res.isFatal) {
                // Same immunity split the rest of the file uses: STATUS stops everything,
                // FREEZE stops a stun. Voltmaw's own STATUS immunity is why the grid shocks it
                // without stopping it — it takes the damage and keeps acting, which is the race.
                if (victim.immunities.includes('STATUS') || victim.immunities.includes('FREEZE')) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: victim.id, amount: 0, eventType: 'IMMUNE', pos: hit.pos });
                } else if (!victim.statusEffects.includes('STUN')) {
                    const stunned: typeof victim.statusEffects = [...victim.statusEffects, 'STUN'];
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: victim.id, updates: { statusEffects: stunned } });
                    victim.statusEffects = stunned;
                }
            }

            if (res.isFatal) {
                killUnit(victim);
                const idx = simUnits.findIndex(u => u.id === victim.id);
                if (idx !== -1) simUnits.splice(idx, 1);
            }
        });
    });

    // --- PHASE 4: ENEMY MOVEMENT (PLAN NEXT TURN) ---
    // Thieves walked off the board with a sprout in PHASE 3 — alive, but gone.
    const survivors = simUnits.filter(u => u.hp > 0 && !brainThieves.has(u.id));
    const movingEnemies = survivors.filter(u =>
        u.isEnemy
        && !stunnedUnitIds.has(u.id)
        // Scripted arrivals hold the tile they were authored on for one turn.
        && !(script && spawnedThisTurn.has(u.id)));
    
    // A boss counts its own turns. Behaviours with a rhythm read this instead of the global
    // turn number so a boss that arrives mid-fight starts its cycle at its own turn one
    // (utils/bossBehaviours.ts). Ticked here, once, before the next intents are planned.
    movingEnemies.forEach(u => {
        if (!u.bossId) return;
        u.bossClock = (u.bossClock ?? 0) + 1;
        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { bossClock: u.bossClock } });
    });

    // Sort by Y (Frontline moves first)
    movingEnemies.sort((a,b) => a.position.y - b.position.y); 

    const nonEnemies = survivors.filter(u => !u.isEnemy);
    const currentPositions = new Map<string, string>();
    survivors.forEach(u => currentPositions.set(`${u.position.x},${u.position.y}`, u.id));

    // Sprouts eaten earlier in this same turn. The board is owned by the reducer, so the sim keeps
    // its own tally to stop two zombies claiming one sprout, and drops the zombies that left.
    // Seeded with anything already robbed in PHASE 3 this turn, so a second zombie does not
    // walk in and telegraph a grab on a Greenspire whose sprout is already gone.
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
        // GRAVE_DIG_PERIOD turns something claws out onto the nearest open tile, so "clear
        // the grave" is a deadline, not a chore. The countdown is telegraphed on the unit
        // like any other intent; burning the grave before it strikes cancels the spawn,
        // because a dead grave never reaches this code.
        //
        // WHAT climbs out scales with how deep the run is. A fixed Basic Zombie made the
        // grave a rounding error by act three — 2 HP against a squad that by then deletes
        // that in one free attack — so the deadline stopped being a deadline. The seams are
        // the same ones the sector chain and the event tiers use (3 and 6), so a grave in
        // the Green Belt still coughs up a shambler and one in the City does not.
        //
        // Scripted battles are exempt: a tutorial board authors its own threat, and a
        // Scrapcap appearing where the script measured a Basic would break the lesson.
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
                const depth = script ? 1 : Math.max(1, gameState.depth || 1);
                const risenClass = depth >= 7 ? UnitClass.POTHELM
                    : depth >= 4 ? UnitClass.SCRAPCAP
                    : UnitClass.WALKER;
                const basicDef = unitDefs[risenClass];
                const risen: Unit = {
                    id: `grave_${enemy.id}_${gameState.turn}`,
                    type: UnitType.ZOMBIE, class: risenClass, role: 'ENEMY',
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
        const collisionLayer = survivors.filter(u => u.hp > 0 && !eatenZombies.has(u.id));

        /**
         * A taunt has to move the body, not just the telegraph. planEnemyIntent redirects what
         * this zombie will DO next turn, but the walk itself is chosen right here — leave this
         * out and a provoked zombie announces "coming for you" while strolling on to the Greenspire.
         *
         * Cleared at the end of this same turn (see PROVOKE EXPIRY below), so it buys exactly one
         * enemy turn of the horde walking the wrong way. A dead provoker steers nobody.
         */
        const provoker = enemy.statusEffects.includes('PROVOKED') && enemy.provokedBy
            ? collisionLayer.find(u => !u.isEnemy && u.id === enemy.provokedBy)
            : undefined;

        // Find Target: the nearest Greenspire that still holds a sprout. Plants are just walls on the way.
        let target: Position | null = provoker ? { x: provoker.position.x, y: provoker.position.y } : null;
        let minDist = 999;

        if (!provoker) currentBoard.forEach(t => {
            if (!t.isHouse || !t.hasBrain || eatenHouses.has(`${t.x},${t.y}`)) return;
            const dist = Math.abs(t.x - enemy.position.x) + Math.abs(t.y - enemy.position.y);
            if (dist < minDist) { minDist = dist; target = { x: t.x, y: t.y }; }
        });

        /**
         * THE CRATE IS A HOUSE.
         *
         * Considered in the same sweep and at the same priority — nearest wins — rather than
         * ahead of or behind the sprouts. Ahead of them, the objective would empty the lanes and
         * the Greenspires would be free; behind them, nothing would ever walk at the crate and the
         * objective would be a decoration. At equal priority the crate sits mid-board and is
         * simply CLOSER to most of the horde, which splits the march in two without a single
         * special case about which half goes where.
         */
        if (!provoker) nonEnemies.forEach(u => {
            if (u.hp <= 0 || u.class !== UnitClass.GEAR_CRATE) return;
            const dist = Math.abs(u.position.x - enemy.position.x) + Math.abs(u.position.y - enemy.position.y);
            if (dist < minDist) { minDist = dist; target = { x: u.position.x, y: u.position.y }; }
        });

        if (!target) {
            // Every sprout on this board is gone — fall back to the nearest plant so nothing idles.
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
            const from = { ...enemy.position };
            enemy.position = dest;
            actions.push({ type: 'UNIT_MOVE', unitId: enemy.id, path });
            // Side effects of a boss having WALKED — the Colossus scorching its trail is the
            // first, and the hook exists so the next one does not become another `if` in here.
            const moveHook = hooksFor(enemy.bossId)?.onMoved;
            if (moveHook) actions.push(...moveHook({ enemy: { ...enemy, position: from }, path, board: currentBoard }));
            stepOnSpikes(enemy, path);
            // Bled out on the way in: free the tile again so the zombies behind it can path
            // through, exactly as if it had never arrived.
            if (enemy.hp <= 0) currentPositions.delete(`${dest.x},${dest.y}`);
        };

        let moved = false;

        // SLOW costs the zombie distance rather than its turn — that is the whole difference
        // between Frostpod's baseline and a full freeze.
        const slowed = enemy.statusEffects.includes('SLOW');
        const effectiveRangeBase = slowed ? Math.max(1, Math.floor(enemy.moveRange / 2)) : enemy.moveRange;
        const enraged = enemy.statusEffects.includes('ENRAGED');
        const flying = enemy.movementType === 'FLYING';
        const reach = Math.max(1, enemy.attackRange ?? 1);
        // The Bannerman's aura buys the horde ground as well as bite.
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
                        // body — is only a floor problem, so a Floater drifts over it.
                        if (!t || t.terrain === 'WALL') return;
                        // PHASE 4 does not route through findPath — it has its own search — so
                        // the rail leash has to be asked here too or it would only apply to the
                        // telegraph and not to the walk.
                        if (!canRideTo(enemy, t, currentBoard)) return;
                        if (!flying && !terrainDefs[t.terrain]?.isWalkable) return;
                        seen.add(key);
                        const entry = { pos: p, path: [...path, p] };
                        // Landing needs a free tile the player can reach (canStopOn); crossing
                        // terrain the movement type ignores is fine.
                        //
                        // A HOUSE IS NEVER A LANDING TILE. It is a building to be bitten from
                        // beside, not a square to stand on — see the BRAIN BITE branch. Without
                        // this the walk still finishes on top of the Greenspire and the zombie ends
                        // up adjacent to nothing, telegraphing at a building underneath itself.
                        const landable = isFree(p) && canStopOn(enemy, t, terrainDefs) && !t.isHouse;
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
         *   1. a sprout it can reach and take THIS turn
         *   2. a tile beside a plant — but only if standing there is closer to a sprout than
         *      where it started, so biting is never a detour
         *   3. whatever tile gets it closest to a sprout
         *
         * Choosing the tile is what makes tier 2 real: planEnemyIntent can only order an
         * attack on something already adjacent, so the zombie has to walk up to the plant
         * first. Before this it only ever aimed at the sprout and bit whatever it happened
         * to brush past.
         */
        const options = reachable();

        // A provoked zombie walks past an open Greenspire: that is the price the provoker paid for.
        // A provoked zombie walks past an open Greenspire: that is the price the provoker paid for.
        //
        // A BOSS walks past for a different reason. A unit that leaves with a sprout is struck
        // off the board entirely (`brainThieves`, filtered out of `survivors` above) — and on
        // a SLAY_BOSS node the objective is "no live boss left", so a boss that ate a sprout
        // and walked off would be scored as a WIN for the fight the player just lost. The
        // alternative reading, counting it as a loss, is no better: either way the outcome
        // turns on bookkeeping rather than on play.
        //
        // None of the nine is a thief anyway (PLAN-boards-bosses.md section 5) — every one of
        // them is a problem you have to solve standing there. This makes that explicit rather
        // than leaving it to the fact that the Gravehulk happens to move 2.
        /**
         * A tile from which this zombie can BITE a Greenspire — beside it, not on it.
         *
         * It used to be the Greenspire tile itself: a zombie walked on top of the building, spent a
         * turn "prising the sprout loose", then vanished off the board with it. Three things
         * were wrong with that and all three were visible in play. The player was warned a
         * turn early, because the telegraph fired as soon as a WALK was going to end on the
         * Greenspire. Arriving was not enough — the zombie had to finish its move exactly there.
         * And taking the sprout deleted the zombie, so the strongest thing you could do about
         * a Greenspire was let it be robbed.
         *
         * Into the Breach's rule instead: stand next to the building, telegraph the hit, and
         * still be standing there afterwards.
         */
        const brainStrike = (provoker || enemy.bossId) ? undefined : options.find(o =>
            [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].some(d => {
                const t = getTileAt({ x: o.pos.x + d.x, y: o.pos.y + d.y }, currentBoard);
                return !!t?.isHouse && !!t.hasBrain && !eatenHouses.has(`${t.x},${t.y}`);
            }));
        const brainGrab = brainStrike;

        const engagePlant = brainGrab ? undefined : options
            .filter(o => distTo(o.pos, target) < startDist)
            .filter(o => nonEnemies.some(pl =>
                !eatenZombies.has(pl.id) && distTo(o.pos, pl.position) <= reach))
            .sort((a, b) => distTo(a.pos, target) - distTo(b.pos, target))[0];

        /**
         * Artillery does not charge. A Lobber that already has something inside its
         * arc has no reason to give up the range advantage that defines it — before this it
         * walked to the front every turn and read as an ordinary biter.
         */
        // Under a taunt only the provoker counts: holding station because some OTHER plant is in
        // the arc is precisely the "shoot whatever is convenient" behaviour the taunt overrides.
        const alreadyInFiringPosition = reach > 1 && !brainGrab && (provoker
            ? distTo(enemy.position, provoker.position) <= reach
            : nonEnemies.some(pl => !eatenZombies.has(pl.id) && distTo(enemy.position, pl.position) <= reach));

        // A boss may own its destination. The ladder below asks "which tile is closest to a
        // sprout", which is the wrong question for a boss holding a victim still, and the exact
        // opposite of the right one for artillery that wants maximum standoff. Kept as a hook
        // rather than an `if (enemy.bossId === ...)` for the same reason the others are.
        //
        // The path is re-walked against LIVE occupancy and cut at the first blocked tile —
        // that truncation is the counterplay: a hero standing on the track shortens the run.
        const bossPath = hooksFor(enemy.bossId)?.move?.({
            enemy, playerUnits: nonEnemies, board: currentBoard, range: effectiveRange,
        });

        const chosen = brainGrab || (alreadyInFiringPosition ? undefined : engagePlant);
        if (bossPath) {
            const legal: Position[] = [];
            for (const step of bossPath.slice(0, effectiveRange)) {
                if (!isFree(step)) break;
                if (!canRideTo(enemy, getTileAt(step, currentBoard), currentBoard)) break;
                if (!canStopOn(enemy, getTileAt(step, currentBoard), terrainDefs)) break;
                legal.push(step);
            }
            if (legal.length > 0) commitMove(legal);
            moved = true;
        } else if (alreadyInFiringPosition && !brainGrab) {
            moved = true; // holds position on purpose; skip the walk-toward-sprout fallbacks
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
            // No route to the Greenspire (walled in, corridor congested). Shuffle greedily toward the
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

        // Spikes finished it somewhere along the walk: nothing left to telegraph.
        if (enemy.hp <= 0) return;

        // Standing NEXT TO a Greenspire that still holds a sprout: the bite is telegraphed now and
        // lands in PHASE 3 next turn, exactly like any other attack, so the player always has
        // one turn to kill the zombie or shove it off the doorstep. Losing a sprout with no
        // warning is the one thing on this board a player cannot play around — but the
        // warning has to come when the threat is real, not while the zombie is still walking.
        /**
         * Telegraphed blindness, read off where the walk ENDED rather than where it began.
         *
         * That order is the tactic: a zombie that starts in the dust and walks out of it is
         * free to aim, and one that walks in is not. Otherwise the veil would be a wall — five
         * tiles of frozen horde — instead of a shape the player pushes bodies into and out of.
         *
         * Ahead of the sprout grab on purpose. A veil laid over a doorstep protects the Greenspire,
         * which is the one case where this hazard is the defender's tool rather than the
         * attacker's, and skipping the grab is what makes it true.
         */
        if (blinded(enemy.position)) {
            enemy.intent = { type: 'WAIT', description: 'Blinded by dust!' };
            actions.push({ type: 'UPDATE_INTENT', unitId: enemy.id, intent: enemy.intent });
            return;
        }

        const houseBeside = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]
            .map(d => getTileAt({ x: enemy.position.x + d.x, y: enemy.position.y + d.y }, currentBoard))
            .find(t => !!t?.isHouse && !!t.hasBrain && !eatenHouses.has(`${t.x},${t.y}`));
        const houseKey = houseBeside ? `${houseBeside.x},${houseBeside.y}` : '';
        // ...unless it was provoked: a taunted zombie standing on a Greenspire is not reaching for
        // the sprout, it is turning around, and planEnemyIntent below says so.
        if (!provoker && !enemy.bossId && houseBeside) {
            const grabIntent: Intent = {
                type: 'ATTACK',
                target: { x: houseBeside.x, y: houseBeside.y },
                damage: 0,
                description: 'Reaching for the sprout!',
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

    /**
     * THE WILD PLANT WAKES (khôi phục 2026-08-06 cùng cây hoang — encounterBuilder).
     *
     * Checked here, at the end of the enemy turn, because that is the moment the board has
     * finished moving: the player walked a hero over during their turn, the horde has just
     * had its answer, and whoever is still standing beside the sleeper is standing there for
     * real. Waking it during the player's turn would have meant a body that appears mid-drag.
     *
     * DORMANT is simply removed. There is no partial state and no timer — a plant is either
     * asleep or it is fighting for you, and the second one lasts the rest of the battle.
     * (Tutorial's DORMANT heroes are untouched: they carry no `isWild`, so this loop skips
     * them and nothing in a scripted board wakes them.)
     */
    simUnits.forEach(u => {
        if (u.isEnemy || u.hp <= 0 || !u.isWild) return;
        if (!u.statusEffects.includes('DORMANT')) return;
        const woken = simUnits.some(h =>
            !h.isEnemy && h.hp > 0 && h.isHero && h.id !== u.id
            && Math.abs(h.position.x - u.position.x) + Math.abs(h.position.y - u.position.y) <= 1);
        if (!woken) return;
        const cleared = u.statusEffects.filter(e => e !== 'DORMANT');
        u.statusEffects = cleared;
        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { statusEffects: cleared } });
        actions.push({ type: 'APPLY_DAMAGE', targetId: u.id, amount: 0, eventType: 'BUFF', pos: { ...u.position } });
    });

    // --- BOSS END OF TURN ---
    // Traits that are a state of the board rather than an action: the Colossus feeding off its
    // own lava, and its shell cracking at half health. Runs after movement so it reads the
    // tiles the boss actually ended on.
    simUnits.forEach(u => {
        if (!u.bossId || u.hp <= 0) return;
        const hook = hooksFor(u.bossId)?.onTurnEnd;
        if (!hook) return;
        const emitted = hook({ enemy: u, units: simUnits.filter(x => x.hp > 0), board: currentBoard });
        actions.push(...emitted);
        // A hook may FINISH something — the Armada's wreck coming down in open water is the
        // first that can. Hooks are forbidden to mutate (the caller owns the sim), so the sim
        // has to be told, or `remainingUnits` below still sees a live boss and SLAY_BOSS scores
        // the win a whole turn late.
        emitted.forEach(act => {
            if (act.type !== 'UNIT_DIE') return;
            const dead = simUnits.find(x => x.id === act.unitId);
            if (dead) dead.hp = 0;
        });
    });

    // --- PROVOKE EXPIRY ---
    // PROVOKED lasts exactly one enemy turn: PHASE 4 above has just spent it, on the walk and on
    // the intent, and it is gone before the next one is planned. It is cleared here rather than
    // in NEW_TURN_RESET because that reset lives in the engine and only knows STUN/BURN/SLOW.
    // `provokedBy` goes with it — a provoker that dies three turns later must not still be
    // steering the horde from the grave.
    simUnits.forEach(u => {
        if (!u.statusEffects.includes('PROVOKED')) return;
        const cleared = u.statusEffects.filter(e => e !== 'PROVOKED');
        u.statusEffects = cleared;
        u.provokedBy = undefined;
        actions.push({
            type: 'UPDATE_UNIT_STATE',
            unitId: u.id,
            updates: { statusEffects: cleared, provokedBy: undefined },
        });
    });

    // Spike fields whose counter ran out during PHASE 2 stop existing now that the horde has
    // finished walking through them.
    //
    // Every surviving field is written back too, not just the expiring ones: the countdown has
    // to reach the real board or a spike wall would bite forever. One MODIFY_TERRAIN per field
    // carrying the POST-decrement value makes this idempotent — replaying the turn lands on the
    // same board — where emitting "aged by one" deltas would not.
    simSpikes.forEach((field, key) => {
        const [x, y] = key.split(',').map(Number);
        actions.push({
            type: 'MODIFY_TERRAIN',
            pos: { x, y },
            spikes: field.turns > 0 ? { ...field } : { damage: field.damage, turns: 0 },
        });
        if (field.turns <= 0) simSpikes.delete(key);
    });

    // Dust and sea, written back on exactly the same terms: post-decrement value, one action
    // per tile, idempotent on replay. The tide additionally carries the ground back with it —
    // `was` is the only thing that knows what this tile is supposed to look like once dry.
    simSmoke.forEach((field, key) => {
        const [x, y] = key.split(',').map(Number);
        actions.push({
            type: 'MODIFY_TERRAIN',
            pos: { x, y },
            smoke: { turns: Math.max(0, field.turns) },
            ...(field.turns <= 0 ? { environment: 'NONE' as const } : {}),
        });
        if (field.turns <= 0) simSmoke.delete(key);
    });
    simFlood.forEach((field, key) => {
        const [x, y] = key.split(',').map(Number);
        actions.push({
            type: 'MODIFY_TERRAIN',
            pos: { x, y },
            flood: { turns: Math.max(0, field.turns), was: field.was },
            ...(field.turns <= 0 ? { terrain: field.was } : {}),
        });
        if (field.turns <= 0) simFlood.delete(key);
    });

    const remainingUnits = survivors.filter(u => u.hp > 0 && !eatenZombies.has(u.id));

    /**
     * SQUAD WIPED — and the test is "is there anything left I can still give an order to",
     * not "is there anything left on my side of the board".
     *
     * The gear crate is on the player's side and is `UnitType.PLANT`, so a plain headcount let
     * a fight go on forever with every hero dead and a box standing in the middle: it has no
     * skills and cannot move, so nothing could ever happen again. Một unit đang DORMANT là
     * đúng thế bí đó vì lý do khác: nó không hành động được, và từ khi cây hoang bị bỏ thì
     * KHÔNG CÒN GÌ đánh thức nó nữa — bản DORMANT còn lại là của kịch bản tutorial
     * (Sunbloom là thứ được bảo vệ). Điều kiện cũ chỉ loại cây hoang, nên một màn kịch bản
     * chỉ còn lại Sunbloom ngủ sẽ treo vô hạn.
     */
    const commandable = (u: Unit) =>
        u.type === UnitType.PLANT
        && u.class !== UnitClass.GEAR_CRATE
        && !u.statusEffects.includes('DORMANT');


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
        /**
     * EVERY objective runs on the clock, SLAY_BOSS included.
     *
     * This briefly did not: the arithmetic said a boss could not be killed inside five turns,
     * and exempting SLAY_BOSS was one way to answer that. It is the wrong one. Without a limit
     * a boss fight becomes attrition that the squad cannot lose while a single hero is standing
     * — and "cannot lose" is not a fight, it is a formality with extra steps.
     *
     * The fix went to the number instead: a boss node gets BOSS_MAX_TURNS and the Breach gets
     * BREACH_MAX_TURNS (constants.ts, with the measured reasoning). Failing to finish inside it
     * is a defeat, exactly as failing to hold a tile is.
     */
    const timeUp = turn > gameState.maxTurns;
        if (isMissionFailed(mission, currentBoard)) {
            nextState.screen = 'GAME_OVER';
            if (mission) nextState.mission = { ...mission, failed: true };
        } else if (isMissionCompleteEarly(mission, remainingUnits)) {
            nextState.screen = 'VICTORY';
        } else if (timeUp) {
            nextState.screen = isMissionSatisfied(mission, remainingUnits) ? 'VICTORY' : 'GAME_OVER';
        }
        if (remainingUnits.filter(commandable).length === 0) nextState.screen = 'GAME_OVER';
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
        && !remainingUnits.some(u => u.isEnemy && u.class === UnitClass.BANNERMAN);
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
    /**
     * EVERY objective runs on the clock, SLAY_BOSS included.
     *
     * This briefly did not: the arithmetic said a boss could not be killed inside five turns,
     * and exempting SLAY_BOSS was one way to answer that. It is the wrong one. Without a limit
     * a boss fight becomes attrition that the squad cannot lose while a single hero is standing
     * — and "cannot lose" is not a fight, it is a formality with extra steps.
     *
     * The fix went to the number instead: a boss node gets BOSS_MAX_TURNS and the Breach gets
     * BREACH_MAX_TURNS (constants.ts, with the measured reasoning). Failing to finish inside it
     * is a defeat, exactly as failing to hold a tile is.
     */
    const timeUp = turn > gameState.maxTurns;

    if (isMissionFailed(mission, currentBoard)) {
        // e.g. the Greenspire the mission told you to protect just lost its sprout.
        nextState.screen = 'GAME_OVER';
        if (mission) nextState.mission = { ...mission, failed: true };
    } else if (isMissionCompleteEarly(mission, remainingUnits)) {
        // KILL_ALL: the board is clear, no reason to keep playing out the clock.
        nextState.screen = 'VICTORY';
    } else if (timeUp) {
        nextState.screen = isMissionSatisfied(mission, remainingUnits) ? 'VICTORY' : 'GAME_OVER';
    }

    // Sprouts are a run-wide budget handled by the reducer via BRAIN_LOST. A level is also lost
    // outright when the squad is wiped out.
    const remainingPlants = remainingUnits.filter(commandable);
    if (remainingPlants.length === 0) {
        nextState.screen = 'GAME_OVER';
    }

    // ...and lost outright when this board runs dry, even with run budget to spare. Without
    // this the player could write off a map's Greenspires, eat the budget hit and stroll to the
    // exit — the Greenspires were a resource to spend rather than a line to hold.
    const housesOnBoard = currentBoard.filter(t => t.isHouse);
    if (housesOnBoard.length > 0) {
        const brainsStillHere = housesOnBoard.filter(
            t => t.hasBrain && !eatenHouses.has(`${t.x},${t.y}`)
        ).length;
        if (brainsStillHere === 0) nextState.screen = 'GAME_OVER';
    }

    // --- TURN STIPEND ---
    // Paid unconditionally at the end of every turn. Sol is the whole action economy and
    // kills no longer feed it, so without a floor the player simply cannot use hero skills.
    // Anchored on a living plant purely so the number floats somewhere the player is looking.
    const stipendAnchor = remainingUnits.find(u => !u.isEnemy && u.type === UnitType.PLANT && u.position.x >= 0);
    actions.push({
        type: 'GAIN_SUN',
        amount: balancedGlobal('global.SUN_PER_TURN_INCOME'),
        pos: stipendAnchor ? stipendAnchor.position : undefined,
    });

    /**
     * SUNCHASER (CONVOY_AURA) — trạm sạc cấp điện cho đoàn xe.
     *
     * Đầu lượt người chơi, nếu Sunbloom đứng kề ít nhất một ally thì CÔ và MỌI ally đang kề cô
     * được +1 ô đi trong lượt đó. Buff tạm, đi qua status `CONVOYED` — đúng đường mà `BLESSED`
     * đã dùng để cộng move (`gameLogic.ts`), nên không có phép cộng move thứ hai nào.
     *
     * Tính ở ĐÂY, sau khi địch đã đi xong, vì adjacency phải đọc trên bàn cờ mà người chơi sắp
     * nhìn thấy — tính sớm hơn thì một zombie chen vào giữa đội sau đó sẽ làm cái aura nói dối.
     *
     * Quét sạch trước rồi mới dán lại: buff một lượt mà không tự dọn thì lượt sau nó vẫn còn,
     * và "một lượt" âm thầm thành "vĩnh viễn" — cùng cái bẫy `lastStandUsed` và `killsThisTurn`.
     *
     * Giá của nó tự cân: muốn ăn aura thì phải đứng dính chùm, đúng thứ mà AoE, tia lan điện và
     * Blast Chard trừng phạt.
     */
    {
        const allies = remainingUnits.filter(u => !u.isEnemy && u.hp > 0);
        const adjacent = (a: Unit, b: Unit) =>
            Math.abs(a.position.x - b.position.x) + Math.abs(a.position.y - b.position.y) === 1;
        const convoyed = new Set<string>();
        allies.forEach(src => {
            if (!hasFusionEffect(src, 'CONVOY_AURA')) return;
            const neighbours = allies.filter(u => u.id !== src.id && adjacent(u, src));
            if (neighbours.length === 0) return;
            convoyed.add(src.id);
            neighbours.forEach(n => convoyed.add(n.id));
        });
        allies.forEach(u => {
            const had = u.statusEffects.includes('CONVOYED');
            const should = convoyed.has(u.id);
            if (had === should) return;
            const next = should
                ? [...u.statusEffects, 'CONVOYED' as const]
                : u.statusEffects.filter(e => e !== 'CONVOYED');
            u.statusEffects = next;
            actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { statusEffects: next } });
        });
    }

    /**
     * GAI CỦA LỜI BAN PHƯỚC TÀN Ở ĐÂY (Thorned Bloom) — muộn hơn `BLESSED` đúng một pha.
     *
     * `BLESSED` chết ở cửa VÀO lượt địch (dòng ~180) vì nửa +1 sát thương của nó là chuyện
     * của lượt người chơi. Gai thì chỉ có việc để làm trong pha vừa chạy xong, nên nó phải
     * sống qua pha đó rồi mới tắt — dọn ở cửa vào thì ô này rỗng y như lúc chưa wire.
     *
     * Dọn ở đây, không dựa vào NEW_TURN_RESET: một buff một-lượt mà không tự dọn thì lượt sau
     * vẫn còn, và "một lượt" âm thầm thành "vĩnh viễn" — cùng cái bẫy `CONVOYED` ngay trên.
     */
    remainingUnits.forEach(u => {
        if (!u.blessThorns) return;
        u.blessThorns = false;
        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { blessThorns: false } });
    });

    /**
     * VẾT THƯƠNG SE LẠI — mỗi thân rụng MỘT vết mỗi vòng, tính ở cuối lượt địch.
     *
     * Cuối VÒNG chứ không cuối lượt người chơi: vết do Rending Husk và Glass Rind đặt trong
     * lượt địch phải còn nguyên giá trị cho lượt người chơi kế tiếp, không thì hai ô thụ động
     * đó bị thiệt trọn một nhịp.
     *
     * Đây là thứ biến bleed thành cơ chế TEMPO: nạp rồi phải tiêu ngay, không để dành. Và nó
     * cũng là cái phanh của máy kích hoạt hàng loạt — ví không phình được thì không có cú burst
     * nào để nuôi.
     */
    remainingUnits.forEach(u => {
        const now = u.bleedStacks ?? (u.statusEffects.includes('BLEEDING') ? 1 : 0);
        if (now <= 0) return;
        const left = now - 1;
        const statusEffects = left > 0 ? u.statusEffects : u.statusEffects.filter(e => e !== 'BLEEDING');
        u.bleedStacks = left;
        u.statusEffects = statusEffects;
        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: u.id, updates: { bleedStacks: left, statusEffects } });
    });

    actions.push({ type: 'NEW_TURN_RESET' });

    return { actions, finalGameState: nextState };
};
