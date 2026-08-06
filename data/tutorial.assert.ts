import { HeroId, MaterialId, Position, TileData, Unit, UnitClass, UnitType } from '../types';
import { HERO_DEFINITIONS } from './heroes';
import { ZOMBIE_DEFINITIONS } from './zombies';
import { MATERIAL_DEFINITIONS } from './materials';
import { DEFAULT_ITEM_DEFINITIONS } from './items';
import { GAME_EVENTS } from './events';
import { FUSION_RECIPES } from './fusionRecipes';
import {
    COIN_ON_RUN_START, COIN_PER_LEVEL, COIN_REVIVE_HERO, BENCH_CAPACITY, BRAINS_MAX,
    DEFAULT_TERRAIN_DEFS, SUN_ON_LEVEL_START,
} from '../constants';
import { getValidMoves, findPath } from '../utils/gameLogic';
import { replayScriptedBattle } from '../utils/scriptedReplay';
import {
    TUTORIAL_CHAIN, tutorialBoard, stepActor, stepMaterial, stepItem, stepSatisfied,
    type TutorialSpawn, type TutorialStep, type TutorialBattle,
} from './tutorial';

/**
 * THE TUTORIAL'S TEST SUITE. Development only — see the bottom of this file for how it runs.
 *
 * Split out of data/tutorial.ts, where it was the larger half of the file and, more to the
 * point, where it SHIPPED. Both entry points were bare top-level calls, so every player
 * downloaded ~800 lines of assertions plus the whole replay harness and then watched their
 * browser play all seven tutorial boards through the real engine before the menu appeared.
 * The checks are worth keeping — scripted content rots faster than anything else here, and
 * each one is a lesson that broke once — but they are for whoever edits the script, not for
 * whoever plays it.
 *
 * Moving them also cut the data module's dependency graph to almost nothing: zombies, items,
 * events, fusion recipes, the pathfinder and the replay engine were imported by tutorial.ts
 * SOLELY to be tested against. data/tutorial.ts is now content and lookups, and nothing else.
 */

// ---------------------------------------------------------------------------------------
// ASSERTIONS — run at module load, exactly like assertTemplate in data/maps.ts.
//
// Scripted content rots faster than anything else in the project: hero HP, zombie HP, plant
// prices and the starting purse have all moved more than once. A tutorial that quietly
// teaches the wrong thing is worse than no tutorial, so every assumption a lesson leans on is
// written down here and checked at build time.
// ---------------------------------------------------------------------------------------

/**
 * Words allowed in one coach note.
 *
 * Raised from 12 after the campfire lesson (tut_6) needed three sentences that could not be
 * cut further without dropping a rule the player has to know: which hero receives the trait,
 * that the material leaves the bench, and that the graft is permanent.
 */
const WORD_LIMIT = 15;

/** Shared by both note lists — see the two call sites below. */
const assertNoteLength = (where: string, note: string) => {
    const words = note.trim().split(/\s+/).length;
    if (words > WORD_LIMIT) {
        throw new Error(`${where}: note is ${words} words (max ${WORD_LIMIT}). Fix the board, not the note.`);
    }
};

/**
 * The least damage the hero can take from `wave` if she plays perfectly: every tile she can
 * reach, scored by which attackers can still path into range of it. This is what makes a
 * "scripted death" a fact rather than an intention.
 */
const worstCaseDamage = (
    b: TutorialBattle,
    board: TileData[],
    start: Position,
    hero: { maxHp: number; damage: number; moveRange: number },
    wave: TutorialSpawn[],
): { tile: Position; damage: number } => {
    const mkHero = (pos: Position): Unit => ({
        id: '_h', type: UnitType.PLANT, class: UnitClass.SEED_GUN, role: 'SHOOTER',
        hp: hero.maxHp, maxHp: hero.maxHp, damage: hero.damage, moveRange: hero.moveRange,
        level: 1, position: pos, isEnemy: false, hasMoved: false, hasAttacked: false,
        statusEffects: [], movementType: 'WALKING', immunities: [], imgUrl: '',
    });
    const zombies: Unit[] = wave.map((s, i) => {
        const d = ZOMBIE_DEFINITIONS[s.cls]!;
        return {
            id: `_z${i}`, type: UnitType.ZOMBIE, class: s.cls, role: 'ENEMY',
            hp: d.maxHp, maxHp: d.maxHp, damage: d.damage, moveRange: d.moveRange, level: 1,
            position: { x: s.x, y: s.y }, isEnemy: true, hasMoved: false, hasAttacked: false,
            statusEffects: [], movementType: d.movementType, immunities: d.immunities,
            imgUrl: '', attackRange: d.attackRange ?? 1,
        };
    });

    const first = mkHero(start);
    const tiles = [start, ...getValidMoves(first, [first, ...zombies], board, DEFAULT_TERRAIN_DEFS)];

    let best = { tile: start, damage: Number.POSITIVE_INFINITY };
    tiles.forEach(tile => {
        const her = mkHero(tile);
        let damage = 0;
        zombies.forEach(z => {
            const reach = z.attackRange ?? 1;
            let strikes = false;
            for (let x = 0; x < 8 && !strikes; x++) {
                for (let y = 0; y < 8 && !strikes; y++) {
                    const dist = Math.abs(x - tile.x) + Math.abs(y - tile.y);
                    if (dist === 0 || dist > reach) continue;
                    if (z.position.x === x && z.position.y === y) { strikes = true; break; }
                    const others = zombies.filter(o => o.id !== z.id);
                    const path = findPath(z, { x, y }, [her, ...others], board, DEFAULT_TERRAIN_DEFS);
                    if (path.length > 0 && path.length <= z.moveRange) strikes = true;
                }
            }
            if (strikes) damage += z.damage;
        });
        if (damage < best.damage) best = { tile, damage };
    });
    return best;
};

export const assertTutorial = () => {
    TUTORIAL_CHAIN.forEach(node => {
        const b = node.battle;
        if (!b) return;

        // --- board shape ---
        if (b.rows.length !== 8) throw new Error(`${node.id}: expected 8 rows, got ${b.rows.length}`);
        b.rows.forEach((r, x) => {
            if (r.length !== 8) throw new Error(`${node.id} row ${x}: expected 8 chars, got ${r.length}`);
        });
        const flat = b.rows.join('');
        if (!flat.includes('H')) throw new Error(`${node.id}: no Greenspire`);
        if (!flat.includes('S')) throw new Error(`${node.id}: no spawn zone`);
        if (!flat.includes('D')) throw new Error(`${node.id}: no deploy zone`);

        // --- squad and placement agree, and every hero lands somewhere legal ---
        b.squad.forEach(h => {
            if (!HERO_DEFINITIONS[h]) throw new Error(`${node.id}: unknown hero ${h}`);
            const p = b.placement[h];
            if (!p) throw new Error(`${node.id}: ${h} has no placement`);
            const ch = b.rows[p.x]?.[p.y];
            if (ch !== 'D') throw new Error(`${node.id}: ${h} placed on '${ch}' at ${p.x},${p.y}, not a deploy tile`);
        });
        (b.dormant ?? []).forEach(h => {
            if (!b.squad.includes(h)) throw new Error(`${node.id}: dormant hero ${h} is not in the squad`);
        });

        // --- spawns land on real tiles, and never on a hero ---
        const allSpawns = [...b.opening, ...Object.values(b.waves ?? {}).flat()];
        allSpawns.forEach(sp => {
            if (!ZOMBIE_DEFINITIONS[sp.cls]) throw new Error(`${node.id}: unknown zombie ${sp.cls}`);
            const ch = b.rows[sp.x]?.[sp.y];
            if (ch === undefined) throw new Error(`${node.id}: spawn out of bounds at ${sp.x},${sp.y}`);
            if (ch === '#') throw new Error(`${node.id}: spawn inside a wall at ${sp.x},${sp.y}`);
            const onHero = b.squad.some(h => b.placement[h].x === sp.x && b.placement[h].y === sp.y);
            if (onHero) throw new Error(`${node.id}: spawn at ${sp.x},${sp.y} lands on a hero`);
        });

        // --- placement steps may only point at placement controls ---
        b.steps.filter(st => st.phase === 'PLACEMENT').forEach(st => {
            if (st.focus && st.focus.startsWith('tile-')) {
                throw new Error(
                    `${node.id}: placement step focuses ${st.focus}, but tiles do nothing useful ` +
                    `before the battle starts.`
                );
            }
        });

        // --- every focus target has to be a thing that exists ---
        b.steps.forEach(st => {
            if (!st.focus) return;
            const tile = /^tile-(\d+)-(\d+)$/.exec(st.focus);
            if (tile) {
                const [, sx, sy] = tile;
                const ch = b.rows[Number(sx)]?.[Number(sy)];
                if (ch === undefined) throw new Error(`${node.id}: focus ${st.focus} is off the board`);
                if (ch === '#') throw new Error(`${node.id}: focus ${st.focus} points at a wall`);
                return;
            }
            const hero = /^hero-(.+)$/.exec(st.focus);
            if (hero && !b.squad.includes(hero[1] as HeroId)) {
                throw new Error(`${node.id}: focus ${st.focus} names a hero not in this squad`);
            }
        });

        // --- the deploy screen must be locked on every battle ---
        // It is the one screen where the player can move units BEFORE the script starts,
        // and a single redeploy invalidates every tile the combat steps name. Board 7
        // shipped without one and a stray click proved the hole immediately.
        if (!b.steps.some(st => st.phase === 'PLACEMENT' && st.focus === 'start-battle')) {
            throw new Error(
                `${node.id}: no PLACEMENT step focusing start-battle — the deploy screen is ` +
                `free-play and the player can redeploy units out from under the script.`
            );
        }

        // --- every step must be RESOLVABLE, or the overlay strands the player ---
        //
        // Steps now advance by reading the board, so a step whose outcome cannot be observed
        // never clears and the hole never moves. Each rule below is one way that used to be
        // possible to write by accident.
        (['PLACEMENT', 'COMBAT'] as const).forEach(phase => {
            const inPhase = b.steps.filter(st => (st.phase ?? 'COMBAT') === phase);
            // The step list is re-derived per turn, so an actor selected on turn 2 says
            // nothing about turn 3 — resolution has to be checked one turn at a time.
            const turns = [...new Set(inPhase.map(st => st.turn))];
            turns.forEach(turn => {
                const steps = inPhase.filter(st => st.turn === turn);
                steps.forEach((st, i) => {
                    const isTile = /^tile-\d+-\d+$/.test(st.focus ?? '');

                    if (st.act && !isTile) {
                        throw new Error(
                            `${node.id} turn ${turn}: '${st.act}' is set on ${st.focus ?? 'a note'}, ` +
                            `but only tile steps are ambiguous enough to need it.`
                        );
                    }
                    if (isTile && !st.act) {
                        throw new Error(
                            `${node.id} turn ${turn}: ${st.focus} does not say whether it is a MOVE, ` +
                            `an ATTACK or an ITEM, so the script cannot tell when it has been done.`
                        );
                    }
                    // A tile or skill step reaches through a hero — except an ITEM tile,
                    // which detonates a consumable and needs no unit at all. Without a
                    // preceding selection there is no hero to read, and the skill button
                    // the next step points at is not even rendered.
                    const needsActor = (isTile && st.act !== 'ITEM') || /^skill-/.test(st.focus ?? '');
                    if (needsActor && !stepActor(steps, i)) {
                        throw new Error(
                            `${node.id} turn ${turn}: ${st.focus} acts through a hero, but no ` +
                            `hero- step comes before it this turn.`
                        );
                    }
                    // Firing needs something aimed first, or the click lands as a move.
                    if (isTile && st.act === 'ATTACK') {
                        const aimed = steps.slice(0, i).some(p => /^skill-/.test(p.focus ?? ''));
                        if (!aimed) {
                            throw new Error(
                                `${node.id} turn ${turn}: ${st.focus} is an ATTACK with no skill- ` +
                                `step before it, so the click would move the hero instead.`
                            );
                        }
                    }
                    // Detonating needs something armed first, same failure shape.
                    if (isTile && st.act === 'ITEM' && !stepItem(steps, i)) {
                        throw new Error(
                            `${node.id} turn ${turn}: ${st.focus} is an ITEM tile with no item- ` +
                            `step before it, so the click would just inspect the tile.`
                        );
                    }
                    // A bench-plant actor has to exist too: unit-X only renders if X was
                    // bought, and only a forced shop step guarantees that.
                    const unitFocus = /^unit-(.+)$/.exec(st.focus ?? '');
                    if (unitFocus) {
                        const mat = unitFocus[1];
                        const bought = TUTORIAL_CHAIN
                            .slice(0, TUTORIAL_CHAIN.indexOf(node))
                            .some(n => (n.steps ?? []).some(sx => sx.focus === `shop-plant-${mat}`));
                        if (!bought) {
                            throw new Error(
                                `${node.id} turn ${turn}: unit-${mat} is commanded here, but no ` +
                                `earlier shop step forces buying it.`
                            );
                        }
                    }

                    // An armed item has to exist, and the tutorial has to have FORCED its
                    // purchase — an optional buy the player skipped leaves this step armed
                    // with nothing and the run stuck.
                    const itemFocus = /^item-(.+)$/.exec(st.focus ?? '');
                    if (itemFocus) {
                        const id = itemFocus[1];
                        if (!DEFAULT_ITEM_DEFINITIONS.some(d => d.id === id)) {
                            throw new Error(`${node.id} turn ${turn}: item-${id} names no known item.`);
                        }
                        const forced = TUTORIAL_CHAIN
                            .slice(0, TUTORIAL_CHAIN.indexOf(node))
                            .some(n => (n.steps ?? []).some(s => s.focus === `shop-item-${id}`));
                        if (!forced) {
                            throw new Error(
                                `${node.id} turn ${turn}: item-${id} is used here, but no earlier ` +
                                `shop step forces buying it — a player without one is stranded.`
                            );
                        }
                    }
                });

                // The turn has to be able to END. Nothing the player does inside a turn
                // retires the last step, so a turn that trails off after (say) a move leaves
                // the overlay pinned to a lesson already finished.
                const last = steps[steps.length - 1];
                if (last && last.focus && last.focus !== 'end-turn' && last.focus !== 'start-battle') {
                    throw new Error(
                        `${node.id} turn ${turn}: the last step focuses ${last.focus}. A scripted ` +
                        `turn must finish on end-turn (or a note), or the overlay never lets go.`
                    );
                }
            });
        });

        // --- notes stay one line ---
        b.steps.forEach(st => {
            assertNoteLength(`${node.id} turn ${st.turn}`, st.note);
            if (st.turn < 1 || st.turn > b.maxTurns) {
                throw new Error(`${node.id}: note on turn ${st.turn}, outside 1..${b.maxTurns}`);
            }
        });

        // --- a scripted death must actually be inescapable ---
        // Two models, because there are two honest ways to guarantee a death:
        //
        //  BODY BOX (killers declare `boxAt`): bites resolve against TILES, so any box that
        //  leaves the hero one legal step is a box she walks out of — a player proved it on
        //  this very board. The only airtight version is physical: every walkable tile
        //  beside her is claimed by a killer's post, each killer can actually reach its
        //  post, the bites sum past her health, and she cannot shoot herself an exit.
        //
        //  CHASE (no boxAt): the older model — try every tile she can reach and require
        //  that none of them keeps her under lethal damage. Only sound when the death turn
        //  is not the last turn (otherwise a dodge simply runs out the clock).
        if (b.scriptedLoss) {
            const hero = HERO_DEFINITIONS[b.scriptedLoss];
            const start = b.placement[b.scriptedLoss];
            const board = tutorialBoard(b);

            const boxed = Object.values(b.waves ?? {}).flat().filter(sp => sp.lethal && sp.boxAt);
            if (boxed.length > 0) {
                const walkable = (x: number, y: number) => {
                    const t = board.find(tt => tt.x === x && tt.y === y);
                    return !!t && !!DEFAULT_TERRAIN_DEFS[t.terrain]?.isWalkable && !t.isHouse;
                };
                const posts = boxed.map(sp => `${sp.boxAt!.x},${sp.boxAt!.y}`);
                const neighbours = [
                    { x: start.x - 1, y: start.y }, { x: start.x + 1, y: start.y },
                    { x: start.x, y: start.y - 1 }, { x: start.x, y: start.y + 1 },
                ].filter(n => n.x >= 0 && n.x < 8 && n.y >= 0 && n.y < 8 && walkable(n.x, n.y));

                neighbours.forEach(n => {
                    if (!posts.includes(`${n.x},${n.y}`)) {
                        throw new Error(
                            `${node.id}: the body box leaves ${b.scriptedLoss} an open step at ` +
                            `${n.x},${n.y} — bites hit tiles, so she just walks out. Post a killer there.`
                        );
                    }
                });

                // Only the posts BETWEEN her and the sprout actually bite — the AI never
                // turns around to eat something behind it (aiLogic's forward-only rule).
                // Posts behind her count as walls: they seal a tile, they add no damage.
                const Greenspires = board.filter(t => t.isHouse && t.hasBrain);
                const distToBrain = (x: number, y: number) =>
                    Math.min(...Greenspires.map(hh => Math.abs(hh.x - x) + Math.abs(hh.y - y)));
                const heroDist = distToBrain(start.x, start.y);

                let bite = 0;
                boxed.forEach(sp => {
                    const d = ZOMBIE_DEFINITIONS[sp.cls]!;
                    if (heroDist < distToBrain(sp.boxAt!.x, sp.boxAt!.y)) bite += d.damage + (sp.dmgBonus ?? 0);
                    // The post must be reachable from the spawn: straight-line distance is a
                    // lower bound on the real path, and the killers are placed with open lanes.
                    const dist = Math.abs(sp.x - sp.boxAt!.x) + Math.abs(sp.y - sp.boxAt!.y);
                    if (dist > d.moveRange) {
                        throw new Error(
                            `${node.id}: box killer at ${sp.x},${sp.y} cannot reach its post ` +
                            `${sp.boxAt!.x},${sp.boxAt!.y} (distance ${dist} > move ${d.moveRange}).`
                        );
                    }
                    // A killable wall is FINE — deliberately so. Shooting a wall dead opens
                    // nothing, because attacking ends her movement for the turn
                    // (getValidMoves refuses units with hasAttacked) and the box turn is her
                    // last. Board 2 leans on this: her final pea kills the 2 HP Basic on C3,
                    // a real kill inside a box that never stops being airtight.
                });
                if (bite < hero.maxHp) {
                    throw new Error(
                        `${node.id}: the box only bites for ${bite} against ${b.scriptedLoss}'s ` +
                        `${hero.maxHp} HP. Boxed but alive is not a scripted death.`
                    );
                }
            } else {
                const killers = (wave: TutorialSpawn[]) => {
                    const marked = wave.filter(sp => sp.lethal);
                    return marked.length ? marked : wave;
                };
                const escape = Object.entries(b.waves ?? {})
                    .map(([turn, wave]) => ({ turn, worst: worstCaseDamage(b, board, start, hero, killers(wave)) }))
                    .filter(w => w.worst.damage >= hero.maxHp);
                if (escape.length === 0) {
                    const detail = Object.entries(b.waves ?? {})
                        .map(([turn, wave]) => {
                            const w = worstCaseDamage(b, board, start, hero, killers(wave));
                            return `turn ${turn}: dodges to ${w.tile.x},${w.tile.y} taking ${w.damage}`;
                        })
                        .join('; ');
                    throw new Error(
                        `${node.id}: ${b.scriptedLoss} (${hero.maxHp} HP) can survive every wave — ${detail}. ` +
                        `The scripted death is dodgeable; add or reposition attackers.`
                    );
                }
            }
        }

        // --- a scripted defeat must be genuinely out of reach ---
        if (b.scriptedDefeat) {
            // Claim 1: the board cannot be CLEARED (the KILL_ALL objective).
            const enemyHp = allSpawns.reduce((n, s) => n + (ZOMBIE_DEFINITIONS[s.cls]?.maxHp ?? 0), 0);
            const squadDps = b.squad.reduce((n, h) => n + HERO_DEFINITIONS[h].damage, 0);
            const ceiling = squadDps * b.maxTurns;
            if (ceiling >= enemyHp) {
                throw new Error(
                    `${node.id}: meant to be unwinnable, but the squad can output ${ceiling} across ` +
                    `${b.maxTurns} turns against ${enemyHp} enemy HP. Shorten the clock or add enemies.`
                );
            }

            // Claim 2: the BOSS survives even the strongest possible burst — checked by
            // exhausting every way the Sol economy can be spent, not by eyeballing.
            //
            // The whole claim hangs on two facts that are easy to break by accident:
            //   - the +25/turn stipend does NOT reach scripted battles (turnManager's
            //     scripted branch returns before the stipend block), so the entire budget
            //     is startingSun + 25 per Harvest, and Harvest costs Sunbloom her turn;
            //   - the heroes' kits are what the data tables say TODAY. A double-shot pea,
            //     a cheaper Sol Burn, a Sol stipend leak — any of these silently turns the
            //     "unwinnable" boss into a 3-turn kill, and this is where that fails loudly.
            const spawnHp = (sp: TutorialSpawn) => (ZOMBIE_DEFINITIONS[sp.cls]?.maxHp ?? 0) + (sp.hpBonus ?? 0);
            const boss = [...allSpawns].sort((a, z) => spawnHp(z) - spawnHp(a))[0];
            const bossHp = boss ? spawnHp(boss) : 0;
            // The player only lives the turns the script gives them; the overlay allows
            // nothing else, and the eaters end the board on the last scripted turn.
            // Turns on which the script actually hands the player an attack. The overlay only
            // accepts the focused element, so a turn whose only step is `end-turn` — board 7's
            // last one, where the squad is out of Sol and watching the sprout go — cannot
            // contribute damage and must not be counted against the boss's HP budget.
            const T = new Set(
                b.steps.filter(st => (st.phase ?? 'COMBAT') === 'COMBAT' && st.act === 'ATTACK')
                    .map(st => st.turn)
            ).size;

            /**
             * What one cast is worth against ONE body — damage times shots.
             *
             * The `* VOLLEY` is not decoration. Precision Blast is authored as "2 damage,
             * three shots" (data/heroes.ts), and reading only the DAMAGE value scored it at 2
             * — a third of the truth — which would have let this proof declare a boss safe
             * from a burst that actually kills it. A guarantee computed off the wrong number
             * is worse than no guarantee, because it is believed.
             */
            const dmgOf = (sk?: { effects: { type: string; value?: number }[] }) => {
                const dmg = sk?.effects.find(e => e.type === 'DAMAGE')?.value ?? 0;
                const shots = sk?.effects.find(e => e.type === 'VOLLEY')?.value ?? 1;
                return dmg * Math.max(1, shots);
            };
            const gs = HERO_DEFINITIONS.PEABURST, sf = HERO_DEFINITIONS.SUNBLOOM, wk = HERO_DEFINITIONS.IRONHUSK;
            let pea = dmgOf(gs.basicAttack), blast = dmgOf(gs.heroSkill), blastCost = gs.heroSkill.sunCost ?? 0;
            let burn = dmgOf(sf.heroSkill), burnCost = sf.heroSkill.sunCost ?? 0;
            const bash = dmgOf(wk.basicAttack);
            const harvestGain = sf.basicAttack.effects.find(e => e.type === 'RESOURCE_GAIN')?.value ?? 0;
            const start = b.startingSun ?? SUN_ON_LEVEL_START;

            // Whatever the campfire script actually fused arrives at this fight fused. Read
            // it from tut_6's own steps and apply it — "the board-6 fusion is a double shot"
            // is exactly the kind of claim this assert exists to answer with data. A
            // DOUBLE_ATTACK doubles that hero's basic; a SKILL_DISCOUNT cheapens their
            // skill; SUN_PER_TURN widens the whole budget.
            let sunPerTurn = 0;
            TUTORIAL_CHAIN.filter(n => n.type === 'CAMPFIRE').forEach(cf => {
                const heroStep = (cf.steps ?? []).find(st => /^fusion-hero-/.exec(st.focus ?? ''));
                const plantStep = (cf.steps ?? []).find(st => /^fusion-plant-/.exec(st.focus ?? ''));
                if (!heroStep || !plantStep) return;
                const heroId = heroStep.focus!.replace('fusion-hero-', '') as HeroId;
                const matId = plantStep.focus!.replace('fusion-plant-', '') as MaterialId;
                const effect = FUSION_RECIPES[heroId]?.[matId]?.effect;
                if (!effect) return;
                // Adds the second shot's damage, it does not double. The second pea is
                // deliberately weaker than the first — see the Repeater recipe.
                if (effect.type === 'DOUBLE_ATTACK' && heroId === 'PEABURST') pea += (effect.value ?? 0);
                if (effect.type === 'SKILL_DISCOUNT') {
                    if (heroId === 'PEABURST') blastCost = Math.max(0, blastCost - (effect.value ?? 0));
                    if (heroId === 'SUNBLOOM') burnCost = Math.max(0, burnCost - (effect.value ?? 0));
                }
                if (effect.type === 'SUN_PER_TURN') sunPerTurn += effect.value ?? 0;
            });

            let best = 0;
            // Sunbloom splits her T actions between h harvests and s burns; Peaburst spends
            // whatever Sol is left on blasts, peas otherwise; Ironhusk bashes every turn.
            // Adjacency and rows are assumed perfect — a deliberate overestimate, so a pass
            // here is a guarantee, not a hope.
            for (let h = 0; h <= T; h++) {
                for (let s2 = 0; s2 <= T - h; s2++) {
                    const budget = start + harvestGain * h + sunPerTurn * T;
                    if (burnCost * s2 > budget) continue;
                    const left = budget - burnCost * s2;
                    const blasts = Math.min(T, blastCost > 0 ? Math.floor(left / blastCost) : T);
                    const total = burn * s2 + blast * blasts + pea * (T - blasts) + bash * T;
                    if (total > best) best = total;
                }
            }
            if (best >= bossHp) {
                throw new Error(
                    `${node.id}: the boss (${bossHp} HP) dies to a max burst of ${best} across ` +
                    `${T} scripted turns (pea ${pea}/blast ${blast}@${blastCost}☀/burn ${burn}@${burnCost}☀/` +
                    `bash ${bash}, start ${start}☀ + ${harvestGain}/harvest). The defeat is no longer real — ` +
                    `raise the boss's HP or tighten the Sol economy.`
                );
            }
        }
    });

    // --- a scripted death has to lead somewhere ---
    // Killing a hero only teaches the backup rule if a LATER board still lists her: her slot
    // is what the bench plant drops into. Board 4 originally omitted her, so the plant the
    // player had just been told to buy never took the field.
    TUTORIAL_CHAIN.forEach((node, i) => {
        const lost = node.battle?.scriptedLoss;
        if (!lost) return;
        const later = TUTORIAL_CHAIN.slice(i + 1).filter(n => n.battle);
        const fills = later.find(n => n.battle!.squad.includes(lost) && n.battle!.placement[lost]);
        if (!fills) {
            throw new Error(
                `${node.id}: ${lost} is killed here, but no later board lists her in its squad with a ` +
                `placement. Her slot never opens, so the bench plant never deploys and the backup ` +
                `lesson silently does not happen.`
            );
        }
    });

    // --- the economy has to carry the player to the revive on board 5 ---
    const shop = TUTORIAL_CHAIN.find(n => n.type === 'SHOP');
    if (shop?.shopOffers) {
        if (shop.shopOffers.length > BENCH_CAPACITY) {
            throw new Error(`tutorial shop offers ${shop.shopOffers.length} plants but the bench holds ${BENCH_CAPACITY}`);
        }
        const stockCost = shop.shopOffers.reduce((n, id) => n + (MATERIAL_DEFINITIONS[id]?.coinCost ?? 0), 0);
        const battlesBeforeShop = TUTORIAL_CHAIN
            .slice(0, TUTORIAL_CHAIN.indexOf(shop))
            .filter(n => n.battle);
        const earned = battlesBeforeShop.reduce(
            (n, node) => n + COIN_PER_LEVEL + (node.battle!.bonuses[0]?.coins ?? 0), 0);
        const purse = COIN_ON_RUN_START + earned;

        // The budget has to survive the WORST shopping trip the shop allows, not the one the
        // script recommends. It used to check only the plants, while the item shelf silently
        // offered the entire 350-Coin catalogue — buy a Stim Shot and a Fire Grenade and the
        // 75 for the revive two nodes later is simply gone, taking the hero the boss board
        // and the whole four-board arc are built around with it.
        const itemIds = shop.itemOffers ?? DEFAULT_ITEM_DEFINITIONS.map(i => i.id);
        const itemCost = itemIds.reduce(
            (n, id) => n + (DEFAULT_ITEM_DEFINITIONS.find(i => i.id === id)?.coinCost ?? 0), 0);
        // No service costs on the SHOP screen: Squad Repair was removed from it entirely, and
        // the sprout buy-back cannot fire here (it needs a lost sprout, and the tutorial's first
        // one happens after this shop).
        const worstCase = stockCost + itemCost;

        // Downstream of the shop the chain has ONE bill: the revive on board 5. The graft at
        // the campfire on board 6 is free and has to stay free — a campfire's price is the two
        // options you did not take, and COIN_FUSE is charged only at the Breach's paid camps
        // (`MapNode.paidCamp`). If a scripted campfire ever starts charging, this is where the
        // budget has to learn about it.
        const scriptedBills = COIN_REVIVE_HERO;

        if (purse < worstCase + scriptedBills) {
            throw new Error(
                `tutorial budget: purse ${purse} cannot cover the worst shopping trip the shop ` +
                `allows (plants ${stockCost} + items ${itemCost} = ${worstCase}) and still ` +
                `pay the ${COIN_REVIVE_HERO} revive on board 5. ` +
                `Trim itemOffers, or raise a bonus payout.`
            );
        }
    }

    // AN UNSAVABLE BRAIN HAS TO BE GENUINELY UNSAVABLE.
    //
    // Give every plant its full movement AND its longest, hardest-hitting skill, point all of
    // it at the doomed doorstep on turn 1, and the total must still fall short. Blockers, Sol
    // costs and the fact that spending the whole squad there loses the other Greenspire are all
    // ignored on purpose — this is an upper bound, so passing it is a guarantee.
    //
    // The sum is over the WHOLE GROUP, not each body alone, because the guarantee changed
    // shape. It used to be one inflated health bar nobody could chew through; it is now two
    // zombies walking the same lane, and the honest claim is not "you cannot kill it" but
    // "you cannot kill BOTH — whichever one you drop, the other one walks in". A group whose
    // combined health fits inside one turn of squad damage is a sprout the player can save.
    TUTORIAL_CHAIN.forEach(node => {
        const b = node.battle;
        if (!b) return;
        const group = b.opening.filter(sp => sp.unsavable);
        if (group.length === 0) return;

        const groupHp = group.reduce(
            (n, sp) => n + (ZOMBIE_DEFINITIONS[sp.cls]?.maxHp ?? 0) + (sp.hpBonus ?? 0), 0);

        // Armour entered the arithmetic when the metal tier landed (data/zombies.ts): a raw
        // damage total against an armoured group overstates what actually arrives by 1 per
        // hit, and the gap is real — it is exactly why the tut_4 door's hpBonus is 3 and not
        // 5. Shaving by the group's SOFTEST armour keeps this an overestimate (every real hit
        // loses at least that much), and a skill that pushes gets its collision point back,
        // because a slam ignores helmets (utils/actionBuilders.ts) and assuming the shove
        // always connects is itself the generous reading.
        const minArmor = Math.min(...group.map(sp => ZOMBIE_DEFINITIONS[sp.cls]?.armor ?? 0));

        // Reach is measured to the NEAREST of them: a hero who can hit the closest body is
        // the most generous reading of "the squad can intervene here".
        let reach = 0;
        const parts: string[] = [];
        b.squad.forEach(heroId => {
            const pos = b.placement[heroId];
            const def = HERO_DEFINITIONS[heroId];
            if (!pos || !def) return;
            const dist = Math.min(...group.map(sp => Math.abs(pos.x - sp.x) + Math.abs(pos.y - sp.y)));
            const best = [def.basicAttack, def.heroSkill]
                .map(sk => {
                    const raw = sk.effects.find(e => e.type === 'DAMAGE')?.value ?? 0;
                    const collision = sk.effects.some(e => e.type === 'PUSH') ? 1 : 0;
                    return {
                        dmg: (raw > 0 ? Math.max(0, raw - minArmor) : 0) + collision,
                        span: def.moveRange + (sk.rangeValue || 1),
                    };
                })
                .filter(o => o.dmg > 0 && dist <= o.span)
                .sort((a, c) => c.dmg - a.dmg)[0];
            if (!best) return;
            reach += best.dmg;
            parts.push(`${heroId} ${best.dmg}`);
        });

        if (reach >= groupHp) {
            const roster = group.map(sp => `${sp.cls} ${(ZOMBIE_DEFINITIONS[sp.cls]?.maxHp ?? 0) + (sp.hpBonus ?? 0)}hp`).join(' + ');
            throw new Error(
                `${node.id}: the doomed Greenspire is guarded by ${roster} = ${groupHp} HP, and the ` +
                `squad can put ${reach} damage into that lane in one turn (${parts.join(' + ')}). ` +
                `The player clears the whole group and keeps the sprout, so the lesson collapses. ` +
                `Add a body, or raise hpBonus until the group is worth more than ${reach}.`
            );
        }
    });

    // NOBODY STANDS AROUND.
    //
    // The complaint that produced this check: on board 4 two plants had a free action, a
    // zombie walked into a Greenspire in plain view, and the script never gave them anything
    // to do. A plant with an unused action while the board is being lost does not read as
    // a hard choice — it reads as a bug.
    //
    // The rule: whoever the script ever puts to work on a board must be put to work on
    // EVERY turn of that board that has any actor at all. A turn with no actors at all is
    // fine (board 7's last turn: no Sol left, Peaburst dead, the run ending on purpose).
    TUTORIAL_CHAIN.forEach(node => {
        if (!node.battle?.steps) return;
        const combat = node.battle.steps.filter(st => (st.phase ?? 'COMBAT') === 'COMBAT');
        const actorOf = (st: TutorialStep) => /^(?:hero|unit)-/.exec(st.focus ?? '')
            ? st.focus!.replace(/^(?:hero|unit)-/, '') : null;
        const everyone = new Set(combat.map(actorOf).filter(Boolean) as string[]);
        // Turns where a subset is deliberate, with the reason it is deliberate.
        const exempt: Record<string, number[]> = {
            // The scripted death: Sunbloom is explicitly left to the player, because
            // nothing she can do changes the outcome and pretending otherwise would lie.
            tut_2: [4],
            // The mop-up turn: one 2 HP riser is left and a single Sol Burn kills it outright.
            // Inventing work for the other two would mean inventing a zombie, and a board that
            // spawns a body so nobody looks idle is the worse lie.
            tut_4: [5],
        };
        [...new Set(combat.map(st => st.turn))].forEach(t => {
            if ((exempt[node.id] ?? []).includes(t)) return;
            const acting = new Set(combat.filter(st => st.turn === t).map(actorOf).filter(Boolean) as string[]);
            if (acting.size === 0) return;
            const idle = [...everyone].filter(a => !acting.has(a));
            if (idle.length > 0) {
                throw new Error(
                    `${node.id} turn ${t}: ${idle.join(', ')} ${idle.length > 1 ? 'have' : 'has'} ` +
                    `no step, so the player watches ${idle.length > 1 ? 'them' : 'them'} stand there ` +
                    `with a free action. Give them work, or add turn ${t} to the exempt list ` +
                    `with the reason.`
                );
            }
        });
    });

    // --- the nodes BETWEEN fights are scripted too, and their steps have their own rules ---
    TUTORIAL_CHAIN.forEach(node => {
        if (!node.steps) return;
        if (node.battle) {
            throw new Error(`${node.id}: a battle node must keep its script on battle.steps`);
        }
        const expected = node.type === 'SHOP' ? 'SHOP' : node.type === 'CAMPFIRE' ? 'CAMPFIRE' : 'EVENT';

        node.steps.forEach((st, i) => {
            // The one-line rule applies here too. It used to be checked ONLY on battle.steps,
            // so the shop, event and campfire lessons — the wordiest in the chain, because
            // they explain an economy rather than a board — were never measured at all.
            assertNoteLength(`${node.id} (${node.type})`, st.note);
            if ((st.phase ?? 'COMBAT') !== expected) {
                throw new Error(
                    `${node.id}: step "${st.note}" is phase ${st.phase ?? 'COMBAT'} on a ${node.type} ` +
                    `node, so it would never be shown.`
                );
            }
            if (!st.focus) return;

            // Anything stepSatisfied cannot recognise never clears, and the overlay sits
            // there forever pointing at a control the player has already used.
            const known = /^(shop-plant-.+|shop-item-.+|event-option-\d+|event-hero-.+|fusion-hero-.+|fusion-plant-.+)$/.test(st.focus)
                || ['shop-leave', 'campfire-fuse', 'fusion-confirm'].includes(st.focus);
            if (!known) {
                throw new Error(`${node.id}: focus '${st.focus}' is not a shape stepSatisfied knows.`);
            }

            // An event-option index has to exist in the event this node routes to. The
            // campfire redesign shrank rest_site from 4 options to 3 and the step here
            // kept pointing at the old index — an overlay waiting on a button that was
            // simply never rendered.
            const evOpt = /^event-option-(\d+)$/.exec(st.focus);
            if (evOpt && node.eventId) {
                const ev = GAME_EVENTS.find(e => e.id === node.eventId);
                if (ev && Number(evOpt[1]) >= ev.options.length) {
                    throw new Error(
                        `${node.id}: step points at event-option-${evOpt[1]}, but ` +
                        `${node.eventId} only has ${ev.options.length} options.`
                    );
                }
            }

            // A step may only point at stock the shop is actually stocking — and now that a
            // purchase takes the card off the shelf, "stocking" means COUNT, not membership.
            // Two buy-steps for one card is a step waiting on a button that was consumed by
            // the step before it.
            const plant = /^shop-plant-(.+)$/.exec(st.focus);
            if (plant) {
                const mat = plant[1] as MaterialId;
                const onShelf = (node.shopOffers ?? []).filter(id => id === mat).length;
                const asked = (node.steps ?? []).filter(sx => sx.focus === st.focus).length;
                if (onShelf === 0) {
                    throw new Error(`${node.id}: step buys ${mat}, which this shop does not stock.`);
                }
                if (asked > onShelf) {
                    throw new Error(
                        `${node.id}: ${asked} steps buy ${mat} but the shelf holds ${onShelf}. ` +
                        `A purchase removes the card, so the extra step waits forever.`
                    );
                }
            }
            const item = /^shop-item-(.+)$/.exec(st.focus);
            if (item && !(node.itemOffers ?? []).includes(item[1])) {
                throw new Error(`${node.id}: step buys ${item[1]}, which this shop does not stock.`);
            }

            // Confirming a fusion needs a plant chosen first, or the button is disabled and
            // the hole opens over something that cannot be clicked.
            if (st.focus === 'fusion-confirm' && !stepMaterial(node.steps!, i)) {
                throw new Error(`${node.id}: fusion-confirm with no fusion-plant- step before it.`);
            }

            // Grafting needs an INTACT seedling, and every battle a bench plant is deployed
            // into costs it a point. A campfire that fuses material X therefore needs the
            // chain to have bought one more X than the number of battles that auto-deploy a
            // bench plant before it — otherwise the only copies left are worn and the step
            // waits on a button that is permanently disabled. (The tutorial buys two
            // Seed Guns for exactly this reason: board 4 spends one, board 6 grafts the
            // other.) An intervening HEAL_SQUAD_FULL would also do it, but the tutorial's
            // campfire spends its visit on the fusion itself, so it cannot rest first.
            const fusePlant = /^fusion-plant-(.+)$/.exec(st.focus ?? '');
            if (fusePlant) {
                const mat = fusePlant[1] as MaterialId;
                const earlier = TUTORIAL_CHAIN.slice(0, TUTORIAL_CHAIN.indexOf(node));
                const bought = earlier.reduce((n, prev) =>
                    n + (prev.steps ?? []).filter(sx => sx.focus === `shop-plant-${mat}`).length, 0);
                // A battle auto-deploys a bench plant whenever its squad lists a hero who
                // died earlier in the chain — that dead hero's slot is what the plant fills.
                // Order matters: a board only deploys a backup if the death already
                // happened by then. Counting deaths anywhere in the chain marked boards 1
                // and 2 as deploying too, three battles instead of the one that really does.
                const deployments = earlier.filter((prev, pi) => prev.battle?.squad.some(h =>
                    earlier.slice(0, pi).some(k => k.battle?.scriptedLoss === h))).length;
                if (bought > 0 && bought <= deployments) {
                    throw new Error(
                        `${node.id}: fuses ${mat}, but the chain buys ${bought} and spends ` +
                        `${deployments} on deployments — every remaining copy is worn below ` +
                        `full and cannot be grafted. Buy one more, or rest before fusing.`
                    );
                }
            }

            // The fusion bench lists UNITS, and between battles the units are whoever was
            // standing at the end of the last one. Two ways to name a hero who is not there:
            const fuseHero = /^fusion-hero-(.+)$/.exec(st.focus);
            if (fuseHero) {
                const who = fuseHero[1] as HeroId;
                const prevBattle = [...TUTORIAL_CHAIN.slice(0, TUTORIAL_CHAIN.indexOf(node))]
                    .reverse().find(n => n.battle)?.battle;
                if (prevBattle && !prevBattle.squad.includes(who)) {
                    throw new Error(
                        `${node.id}: fusion step names ${who}, who is not in the squad of the ` +
                        `battle before it, so no card for them exists here.`
                    );
                }
                // A hero killed earlier has no card here UNLESS the chain revived them first.
                //
                // This used to reject the revived case too, because a revive only QUEUES a
                // hero and the fusion panel was fed `units.filter(isHero)` — a queued hero
                // has no Unit, so no card. That is now handled: the panel is fed
                // `fusableHeroes()`, which adds the snapshots of pending revives, and a
                // fusion applied to one is written back to the snapshot the next battle
                // rebuilds her from. The rule that remains is the narrow, still-true one:
                // dead and NOT revived means no card.
                const before = TUTORIAL_CHAIN.slice(0, TUTORIAL_CHAIN.indexOf(node));
                const killedEarlier = before.some(n => n.battle?.scriptedLoss === who);
                const revivedSince = before.some(n =>
                    n.steps?.some(s => s.focus === `event-hero-${who}`));
                if (killedEarlier && !revivedSince) {
                    throw new Error(
                        `${node.id}: fusion step names ${who}, who dies earlier in the chain ` +
                        `and is never revived before this node, so there is no card for them ` +
                        `on this screen. Add an event-hero-${who} revive step first.`
                    );
                }
            }
        });

        // A shop the player cannot leave is a dead end: nothing else on that screen changes
        // the phase key, so the last step has to be the door.
        if (node.type === 'SHOP') {
            const last = node.steps[node.steps.length - 1];
            if (last?.focus !== 'shop-leave') {
                throw new Error(`${node.id}: the last shop step must be shop-leave, not ${last?.focus}.`);
            }
        }
    });
};

assertTutorial();

// ---------------------------------------------------------------------------------------
// THE REPLAY — every battle script, actually played, on the real engine.
//
// assertTutorial above checks facts that hold one line at a time. It cannot see the fact
// that keeps breaking: a step names a tile, and by the time the player reaches that step
// the board no longer matches the author's head. Board 7's lane was blocked by an ally;
// board 4's bash shoved a zombie into the map edge, the collision rule added a point of
// damage, the target died a turn early and a later step aimed at grass. Each shipped.
//
// So the last assertion is the whole script, click for click, against processTurn and a
// faithful copy of the click handlers (utils/scriptedReplay). Chain state — who is dead,
// what is on the bench, what got fused, how many sprouts remain — is threaded from node to
// node the same way a real run threads it.
// ---------------------------------------------------------------------------------------
const replayWholeChain = () => {
    let dead: string[] = [];
    const bench: string[] = [];
    const fusions: Record<string, string[]> = {};
    let sprouts = BRAINS_MAX;

    TUTORIAL_CHAIN.forEach(node => {
        (node.steps ?? []).forEach(st => {
            const revive = /^event-hero-(.+)$/.exec(st.focus ?? '');
            if (revive) dead = dead.filter(h => h !== revive[1]);
            const buy = /^shop-plant-(.+)$/.exec(st.focus ?? '');
            if (buy) bench.push(buy[1]);
        });
        const fuseHero = (node.steps ?? []).find(st => /^fusion-hero-/.test(st.focus ?? ''));
        const fusePlant = (node.steps ?? []).find(st => /^fusion-plant-/.test(st.focus ?? ''));
        if (fuseHero && fusePlant) {
            const h = fuseHero.focus!.replace('fusion-hero-', '');
            const m = fusePlant.focus!.replace('fusion-plant-', '');
            (fusions[h] = fusions[h] ?? []).push(m);
            const i = bench.indexOf(m);
            if (i >= 0) bench.splice(i, 1);
        }

        const b = node.battle;
        if (!b?.steps) {
            if (b?.scriptedLoss) dead.push(b.scriptedLoss);
            return;
        }
        const res = replayScriptedBattle(node.id, b, tutorialBoard(b), {
            deadHeroes: [...dead], benchMaterials: [...bench], fusions, brainsRemaining: sprouts,
        });
        const tail = res.log.slice(-18).join(String.fromCharCode(10) + '    ');
        const expected = b.scriptedDefeat ? 'GAME_OVER' : 'VICTORY';
        if (res.screen !== expected) {
            throw new Error(
                `${node.id}: the replayed script ends in ${res.screen}, but it promises ${expected}. ` + tail);
        }
        // Declared, not counted. It used to be "one sprout per unsavable spawn", which was
        // only ever true while each doomed Greenspire had exactly one eater — the moment a Greenspire
        // was guarded by a PAIR, that arithmetic said two sprouts and the board loses one.
        const expectedBrains = b.scriptedBrainLoss ?? 0;
        if (!b.scriptedDefeat && res.brainsLost !== expectedBrains) {
            throw new Error(
                `${node.id}: the replay loses ${res.brainsLost} sprout(s); the board declares scriptedBrainLoss: ${expectedBrains}. ` + tail);
        }
        if (b.scriptedLoss && res.survivors.includes(b.scriptedLoss)) {
            throw new Error(
                `${node.id}: ${b.scriptedLoss} is scripted to die here and survives the replay. ` + tail);
        }
        sprouts -= res.brainsLost;
        if (b.scriptedLoss) dead.push(b.scriptedLoss);
    });
};
replayWholeChain();

// ---------------------------------------------------------------------------------------
// HOW THIS RUNS
//
// index.tsx imports this module only under `import.meta.env.DEV`, so the dynamic import is
// statically removable and the whole file — assertions, replay harness and the six data
// tables they pull in — is dropped from the production bundle.
//
// A failure here is a hard throw during development, exactly as it was before: a tutorial
// that quietly teaches the wrong thing is worse than no tutorial.
// ---------------------------------------------------------------------------------------
