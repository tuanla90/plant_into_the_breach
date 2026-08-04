/**
 * SCRIPTED-BATTLE REPLAY — the tutorial's steps, actually played.
 *
 * Three shipped bugs share one shape: a step named a tile, the board at that moment did
 * not match the author's mental model, and the overlay locked on a square with nothing in
 * it (a lane blocked by an ally on board 7; a bash on board 4 whose edge-collision bonus
 * damage killed the target a later step still pointed at; a "unsavable" zombie that one
 * sidestep could shoot). Static assertions never catch these, because the mistake is not
 * in any single number — it is in the interaction, and the only way to check an
 * interaction is to run it.
 *
 * So this runs it. Every scripted battle is replayed click-for-click at module load,
 * against the same code the game executes: processTurn for the enemy half, and a faithful
 * copy of App.tsx's action semantics for the player half (getValidMoves / gettValidSkillTargets
 * for legality, calculateDamage, planPush + collision/drown/brain rules, mid-path mine
 * triggers, Sun costs, the Repeater's weaker second shot). A step that would strand the
 * real overlay throws here, with the board state attached.
 *
 * Deliberately NOT modelled: hero HP carried between boards (each board replays from full
 * health — campfires and story beats heal between the boards where it would matter), and
 * fusion effects beyond the ones the tutorial actually grants. Any skill effect outside
 * the modelled set fails loudly rather than silently resolving wrong.
 *
 * No imports from data/tutorial — turnManager already imports tutorialBattle from there,
 * so this module stays cycle-free by taking the battle as a plain argument.
 */
import { processTurn } from './turnManager';
import {
    getValidMoves, getValidSkillTargets, getSkillTargetPath,
    calculateDamage, planPush, getTileAt,
} from './gameLogic';
import { applyFusionToSkill, hasFusionEffect, getFusionEffectValue } from './fusion';
import { HERO_DEFINITIONS } from '../data/heroes';
import { ZOMBIE_DEFINITIONS } from '../data/zombies';
import { MATERIAL_DEFINITIONS } from '../data/materials';
import { UNIT_SKILLS } from '../data/skills';
import { DEFAULT_TERRAIN_DEFS, DEFAULT_ITEM_DEFINITIONS, INITIAL_GAME_STATE, SUN_ON_LEVEL_START, UNIT_ROLE_MAP } from '../constants';
import { Unit, UnitType, UnitClass, GameState, TileData, Skill, Position, StatusEffectType } from '../types';

const TILE = (x: number, y: number) => `${String.fromCharCode(65 + x)}${y + 1}`;

/** Everything the chain knows about the run when this node starts. */
export interface ReplayContext {
    /** Heroes killed by an earlier node's script and not revived since. */
    deadHeroes: string[];
    /** Bench materials still owned (bought minus fused); auto-deployed into dead slots. */
    benchMaterials: string[];
    /** heroId -> material ids fused at earlier campfires. */
    fusions: Record<string, string[]>;
    /** Brains left in the run when the board starts. */
    brainsRemaining: number;
}

export interface ReplayResult {
    screen: string;
    brainsLost: number;
    /** heroIds alive when the battle ended. */
    survivors: string[];
    log: string[];
}

/** The only skill-effect types the executor models. Anything else must fail, not guess. */
const MODELLED_EFFECTS = new Set(['DAMAGE', 'PIERCE_ATTACK', 'PUSH', 'RESOURCE_GAIN']);

export const replayScriptedBattle = (
    nodeId: string,
    battle: any,
    board: TileData[],
    ctx: ReplayContext,
): ReplayResult => {
    const log: string[] = [];
    const fail = (msg: string): never => {
        throw new Error(
            `${nodeId} replay: ${msg}\n  last moves:\n    ${log.slice(-14).join('\n    ')}`
        );
    };

    // ------------------------------------------------------------------ setup
    // Mirrors useGameProgression's scripted branch: heroes minus the fallen, bench
    // plants auto-deployed into the fallen slots, opening zombies with their hpBonus.
    let units: Unit[] = [];
    (battle.squad as string[]).filter(h => !ctx.deadHeroes.includes(h)).forEach((h, idx) => {
        const def = HERO_DEFINITIONS[h as keyof typeof HERO_DEFINITIONS];
        if (!def) fail(`squad names unknown hero ${h}`);
        units.push({
            id: `tut-${h}-${idx}`, type: UnitType.PLANT, class: def.baseClass,
            role: UNIT_ROLE_MAP[def.baseClass], hp: def.maxHp, maxHp: def.maxHp,
            damage: def.damage, moveRange: def.moveRange, cooldownReduction: 0, level: 1,
            position: { ...(battle.placement[h] ?? { x: -1, y: -1 }) },
            isEnemy: false, hasMoved: false, hasAttacked: false,
            statusEffects: ((battle.dormant ?? []).includes(h) ? ['DORMANT'] : []) as StatusEffectType[],
            movementType: def.movementType, immunities: def.immunities, imgUrl: '',
            isHero: true, heroId: h, fusions: [...(ctx.fusions[h] ?? [])],
        } as Unit);
    });
    const openSpots = (battle.squad as string[])
        .filter(h => ctx.deadHeroes.includes(h))
        .map(h => battle.placement[h])
        .filter(Boolean);
    ctx.benchMaterials.slice(0, openSpots.length).forEach((matId, i) => {
        const m = MATERIAL_DEFINITIONS[matId as keyof typeof MATERIAL_DEFINITIONS];
        if (!m?.benchClass || !m.benchStats) fail(`bench material ${matId} cannot deploy`);
        units.push({
            id: `bench-${matId}-${i}`, type: UnitType.PLANT, class: m.benchClass,
            role: UNIT_ROLE_MAP[m.benchClass], hp: m.benchStats.maxHp, maxHp: m.benchStats.maxHp,
            damage: m.benchStats.damage, moveRange: m.benchStats.moveRange,
            cooldownReduction: 0, level: 1, position: { ...openSpots[i] }, isEnemy: false,
            hasMoved: false, hasAttacked: false, statusEffects: [], movementType: 'WALKING',
            immunities: [], imgUrl: '',
        } as Unit);
    });
    (battle.opening as any[]).forEach((sp, i) => {
        const def = ZOMBIE_DEFINITIONS[sp.cls as UnitClass]!;
        const hp = def.maxHp + (sp.hpBonus ?? 0);
        units.push({
            id: `tut-enemy-${i}`, type: UnitType.ZOMBIE, class: sp.cls, role: 'ENEMY',
            hp, maxHp: hp, damage: def.damage, moveRange: def.moveRange,
            cooldownReduction: 0, level: 1, position: { x: sp.x, y: sp.y }, isEnemy: true,
            hasMoved: false, hasAttacked: false, statusEffects: [],
            movementType: def.movementType, immunities: def.immunities, imgUrl: '',
            attackRange: def.attackRange ?? 1,
            intent: { type: 'MOVE', description: 'Watching...' },
            isMassive: sp.cls === UnitClass.GARGANTUAR,
        } as Unit);
    });

    let sun = battle.startingSun ?? SUN_ON_LEVEL_START;
    let brainsLost = 0;
    let turn = 1;
    let gs: GameState = {
        ...INITIAL_GAME_STATE, screen: 'COMBAT', turn, maxTurns: battle.maxTurns,
        scriptedBattleId: nodeId, brainsRemaining: ctx.brainsRemaining, sun,
        interactionMode: 'IDLE',
        mission: { objective: battle.objective, description: '', zombiesKilled: 0, failed: false },
    } as GameState;

    const living = () => units.filter(u => u.hp > 0);
    const unitAt = (x: number, y: number) => living().find(u => u.position.x === x && u.position.y === y);
    const describeTile = (x: number, y: number) => {
        const u = unitAt(x, y);
        return u ? `${u.heroId || u.class}@${TILE(x, y)} hp${u.hp}` : `${TILE(x, y)} EMPTY`;
    };
    const boardLine = () =>
        `plants=[${living().filter(u => !u.isEnemy).map(u => `${u.heroId || u.class}@${TILE(u.position.x, u.position.y)}hp${u.hp}`).join(' ')}] ` +
        `zombies=[${living().filter(u => u.isEnemy).map(u => `${u.class}@${TILE(u.position.x, u.position.y)}hp${u.hp}`).join(' ')}]`;

    const killUnit = (u: Unit) => {
        u.hp = 0;
        log.push(`${u.heroId || u.class} dies at ${TILE(u.position.x, u.position.y)}`);
        units = units.filter(z => z.id !== u.id);
    };
    const loseBrain = (house: Position, taker?: Unit) => {
        brainsLost += 1;
        log.push(`BRAIN LOST at ${TILE(house.x, house.y)}`);
        board.forEach(t => { if (t.x === house.x && t.y === house.y) (t as any).hasBrain = false; });
        if (taker) units = units.filter(z => z.id !== taker.id);
    };
    /** The engine's trap rule: first enemy to enter the tile eats it and stops. */
    const stepThroughTraps = (u: Unit, path: Position[]) => {
        for (const step of path) {
            u.position = { ...step };
            const t = getTileAt(step, board) as any;
            if (t?.trap && u.isEnemy && u.movementType !== 'FLYING') {
                u.hp -= t.trap.damage;
                t.trap = undefined;
                log.push(`MINE at ${TILE(step.x, step.y)} hits ${u.class} -> hp${u.hp}`);
                if (u.hp <= 0) killUnit(u);
                return;
            }
        }
    };

    // -------------------------------------------------- player-half: skill resolution
    // A faithful copy of App.tsx's resolveTargets, narrowed to the effects the tutorial
    // uses. planPush/applyPushPlan semantics are the real ones: chain shoves, collision
    // damage at walls and edges, drowning, and shoved-into-a-live-house brain theft.
    const applyPush = (target: Unit, caster: Unit, pos: Position) => {
        if (target.immunities.includes('PUSH')) return;
        let dx = pos.x - caster.position.x, dy = pos.y - caster.position.y;
        if (Math.abs(dx) > Math.abs(dy)) { dx = Math.sign(dx); dy = 0; } else { dy = Math.sign(dy); dx = 0; }
        const plan = planPush(target, dx, dy, living(), board, DEFAULT_TERRAIN_DEFS);
        plan.moves.forEach(m => {
            const u = living().find(z => z.id === m.unitId);
            if (u) stepThroughTraps(u, [m.to]);
        });
        plan.drowned.forEach(id => { const u = living().find(z => z.id === id); if (u) { log.push(`${u.class} drowns`); killUnit(u); } });
        plan.tookBrain.forEach(({ unitId, house }) => {
            const u = living().find(z => z.id === unitId);
            if (u) loseBrain(house, u);
        });
        plan.collided.forEach(id => {
            const u = living().find(z => z.id === id);
            if (!u || hasFusionEffect(u, 'STEADFAST')) return;
            const r = calculateDamage(u, 1, false);
            u.hp = r.remainingHp;
            log.push(`collision: ${u.heroId || u.class} -> hp${u.hp}`);
            if (r.isFatal) killUnit(u);
        });
    };

    const castSkill = (caster: Unit, skill: Skill, pos: Position, damageOverride?: number) => {
        const targets: Position[] = [{ ...pos }];
        const hasPierce = skill.effects.some(e => e.type === 'PIERCE_ATTACK');
        if ((skill.rangeType === 'LINE' || skill.rangeType === 'DASH') && hasPierce) {
            getSkillTargetPath(caster, skill, pos, board).forEach(p => {
                if (p.x !== pos.x || p.y !== pos.y) targets.push(p);
            });
        }
        targets.forEach(targetPos => {
            const tgt = unitAt(targetPos.x, targetPos.y);
            const isSelf = targetPos.x === caster.position.x && targetPos.y === caster.position.y;
            const res = skill.effects.find(e => e.type === 'RESOURCE_GAIN');
            if (res && isSelf) {
                sun += res.value ?? 0;
                log.push(`${caster.heroId} harvests -> ${sun} sun`);
            }
            if (tgt && (tgt.isEnemy || tgt.type === UnitType.OBSTACLE)) {
                const dmgEffect = skill.effects.find(e => e.type === 'DAMAGE');
                let dead = false;
                if (dmgEffect) {
                    const raw = damageOverride ?? (dmgEffect.value ?? 0);
                    const r = calculateDamage(tgt, raw, hasPierce);
                    tgt.hp = r.remainingHp;
                    log.push(`${caster.heroId || caster.class} ${skill.id} hits ${tgt.class}@${TILE(targetPos.x, targetPos.y)} -> hp${tgt.hp}`);
                    if (r.isFatal) { dead = true; killUnit(tgt); }
                }
                if (!dead && skill.effects.some(e => e.type === 'PUSH')) applyPush(tgt, caster, targetPos);
            }
        });
    };

    // ---------------------------------------------------------------- engine half
    const runEngineTurn = () => {
        const res = processTurn(units, board, { ...gs, turn, sun }, ZOMBIE_DEFINITIONS as any, DEFAULT_TERRAIN_DEFS);
        for (const a of res.actions as any[]) {
            switch (a.type) {
                case 'NEW_TURN_RESET': units = units.map(u => ({ ...u, hasMoved: false, hasAttacked: false })); break;
                case 'SPAWN_UNIT': units.push({ ...a.unit }); break;
                case 'UNIT_MOVE': { const u = living().find(z => z.id === a.unitId); if (u) stepThroughTraps(u, a.path); break; }
                case 'APPLY_DAMAGE': {
                    const u = living().find(z => z.id === (a.targetId ?? a.unitId));
                    if (u && a.amount > 0 && a.eventType === 'DAMAGE') {
                        u.hp -= a.amount;
                        log.push(`${u.heroId || u.class} takes ${a.amount} -> hp${u.hp}`);
                        if (u.hp <= 0) killUnit(u);
                    }
                    break;
                }
                case 'UNIT_DIE': { const u = living().find(z => z.id === a.unitId); if (u) killUnit(u); break; }
                case 'BRAIN_LOST': loseBrain(a.pos, living().find(z => z.id === a.unitId)); break;
                case 'UPDATE_INTENT': { const u = living().find(z => z.id === a.unitId); if (u) u.intent = a.intent; break; }
                case 'UPDATE_UNIT_STATE': { const u = living().find(z => z.id === a.unitId); if (u) Object.assign(u, a.updates); break; }
            }
        }
        units = units.filter(u => u.hp > 0);
        gs = { ...(res.finalGameState as GameState), sun };
        turn += 1;
        log.push(`--- turn ${turn} begins: ${boardLine()}`);
    };

    // ------------------------------------------------------------------ the script
    log.push(`turn 1: ${boardLine()}`);
    let selected: Unit | null = null;
    let pendingSkill: Skill | null = null;

    const steps = (battle.steps as any[]).filter(st => (st.phase ?? 'COMBAT') === 'COMBAT');
    for (const st of steps) {
        if (gs.screen !== 'COMBAT') fail(`battle ended (${gs.screen}) but turn-${st.turn} steps remain`);
        if (st.turn !== turn && st.turn !== turn) { /* turns advance only via end-turn */ }
        if (st.turn < turn) fail(`step for turn ${st.turn} arrived after the board reached turn ${turn}`);
        while (st.turn > turn) fail(`turn ${turn} has no end-turn step before turn ${st.turn} begins`);

        const f: string | undefined = st.focus;
        if (!f) continue;                       // note-only beat
        if (f === 'start-battle') continue;

        if (f === 'end-turn') { runEngineTurn(); selected = null; pendingSkill = null; continue; }

        if (f.startsWith('hero-')) {
            const id = f.slice(5);
            selected = living().find(u => u.heroId === id) ?? null;
            if (!selected) fail(`step selects hero ${id}, who is not on the board`);
            pendingSkill = null;
            continue;
        }
        if (f.startsWith('unit-')) {
            const matId = f.slice(5);
            const cls = MATERIAL_DEFINITIONS[matId as keyof typeof MATERIAL_DEFINITIONS]?.benchClass;
            selected = living().find(u => !u.isEnemy && !u.isHero && u.class === cls) ?? null;
            if (!selected) fail(`step selects bench unit ${matId}, none on the board`);
            pendingSkill = null;
            continue;
        }
        if (f.startsWith('skill-')) {
            if (!selected) fail(`skill step '${f}' with no unit selected`);
            const id = f.slice(6);
            const sel = selected!;
            const def = sel.isHero ? HERO_DEFINITIONS[sel.heroId as keyof typeof HERO_DEFINITIONS] : undefined;
            const base = def
                ? [def.basicAttack, def.heroSkill].find(s => s.id === id)
                : (UNIT_SKILLS[sel.class] ?? []).find(s => s.id === id);
            if (!base) fail(`${sel.heroId || sel.class} has no skill ${id}`);
            const unmodelled = base!.effects.find(e => !MODELLED_EFFECTS.has(e.type));
            if (unmodelled) fail(`skill ${id} uses effect ${unmodelled.type}, which the replay does not model — extend scriptedReplay before scripting it`);
            pendingSkill = applyFusionToSkill(base as Skill, sel);
            continue;
        }
        if (f.startsWith('item-')) continue;    // arming is validated at the tile step

        if (f.startsWith('tile-')) {
            const [x, y] = f.slice(5).split('-').map(Number);
            const act = st.act ?? 'ATTACK';

            if (act === 'MOVE') {
                if (!selected) fail(`move step with no unit selected`);
                const sel = selected!;
                if (sel.hasMoved || sel.hasAttacked) fail(`${sel.heroId || sel.class} has already acted this turn`);
                const moves = getValidMoves(sel, units, board, DEFAULT_TERRAIN_DEFS);
                if (!moves.some(m => m.x === x && m.y === y)) {
                    fail(`${sel.heroId || sel.class}@${TILE(sel.position.x, sel.position.y)} cannot MOVE to ${describeTile(x, y)} (turn ${turn})`);
                }
                sel.position = { x, y };
                sel.hasMoved = true;
                log.push(`${sel.heroId || sel.class} moves to ${TILE(x, y)}`);
                continue;
            }

            if (act === 'ITEM') {
                const itemId = steps.slice(0, steps.indexOf(st)).reverse()
                    .find(s => s.focus?.startsWith('item-'))?.focus?.slice(5);
                const item = DEFAULT_ITEM_DEFINITIONS.find(i => i.id === itemId);
                if (!item) fail(`ITEM step at ${TILE(x, y)} with no item-<id> step before it`);
                const tile = getTileAt({ x, y }, board) as any;
                const bad = !tile || unitAt(x, y) || tile.trap
                    || !DEFAULT_TERRAIN_DEFS[tile.terrain]?.isWalkable || tile.isHouse;
                if (bad) fail(`cannot arm ${item!.id} on ${describeTile(x, y)} — needs an empty walkable non-house tile`);
                tile.trap = { damage: item!.damage, imgUrl: item!.imgUrl };
                log.push(`${item!.id} armed at ${TILE(x, y)}`);
                continue;
            }

            // ATTACK
            if (!selected) fail(`attack step at ${TILE(x, y)} with no unit selected`);
            if (!pendingSkill) fail(`attack step at ${TILE(x, y)} with no skill selected`);
            const sel = selected!;
            const skill = pendingSkill!;
            if (sel.hasAttacked) fail(`${sel.heroId || sel.class} has already attacked this turn`);
            const legal = getValidSkillTargets(sel, skill, units, board, DEFAULT_TERRAIN_DEFS);
            if (!legal.some(t => t.x === x && t.y === y)) {
                fail(`${sel.heroId || sel.class}@${TILE(sel.position.x, sel.position.y)} cannot target ${describeTile(x, y)} with ${skill.id} (turn ${turn}) — ${boardLine()}`);
            }
            const cost = Math.max(0, (skill.sunCost ?? 0) - getFusionEffectValue(sel, 'SKILL_DISCOUNT'));
            if (cost > sun) fail(`${skill.id} costs ${cost} Sun, only ${sun} banked (turn ${turn})`);
            sun -= cost;
            castSkill(sel, skill, { x, y });
            // The Repeater fusion: a second, weaker shot rides every free basic attack.
            if (!skill.sunCost && hasFusionEffect(sel, 'DOUBLE_ATTACK')) {
                castSkill(sel, skill, { x, y }, getFusionEffectValue(sel, 'DOUBLE_ATTACK'));
            }
            sel.hasAttacked = true;
            sel.hasMoved = true;
            continue;
        }

        // Anything else (shop-, fusion-, event- foci) has no business inside a battle.
        fail(`unhandled step focus '${f}' inside a battle script`);
    }

    // The script has run out; let the battle end on the engine's own terms.
    let guard = 0;
    while (gs.screen === 'COMBAT' && turn <= battle.maxTurns && guard++ < 12) runEngineTurn();

    return {
        screen: gs.screen,
        brainsLost,
        survivors: living().filter(u => u.isHero).map(u => u.heroId as string),
        log,
    };
};
