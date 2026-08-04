
import { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react';
import {
    GameState, MapNode, Unit, UnitClass, UnitType, UnitDefinition, TerrainDefinition,
    TileData, HeroId, MaterialId, BenchPlant, UnlockState, MissionBonus, StatusEffectType
} from '../types';
import {
    GENERATE_MAP, generateBoard,
    SQUAD_SIZE, BENCH_CAPACITY, SUN_ON_LEVEL_START, BASE_MAX_TURNS,
    COIN_PER_LEVEL, COIN_ELITE_BONUS, COIN_BOSS_BONUS, COIN_REVIVE_HERO,
    brainBuybackCost
} from '../constants';
import { applyFusion } from '../utils/fusion';
// This hook used to hold all of the following inline. What is left here is the part that is
// genuinely about React state and the run; the rules moved to utils/, where they can be run.
import { withRecipes, withHeroesForBoss, LAYERS_PER_UNLOCK_PACKAGE } from '../utils/unlockLogic';
import { freshHero, buildHeroFromSnapshot, buildBenchUnit, buildEnemy } from '../utils/unitFactory';
import { buildEncounter, layerOfNode, tiersForLayer } from '../utils/encounterBuilder';
import { performTurnZeroAI as runTurnZeroAI } from '../utils/turnZeroAI';
import { GAME_EVENTS } from '../data/events';
import { HERO_DEFINITIONS } from '../data/heroes';
import { getMaterial } from '../data/materials';
import { buildMission, earnedBonuses } from '../data/missions';
import {
    parseRecipeKey, unlockInfoFor,
    BONUS_OBJECTIVES_PER_RECIPE, TUTORIAL_RECIPES, UnlockAward
} from '../data/unlocks';
import { FUSION_RECIPES } from '../data/fusionRecipes';
import { tutorialNode, tutorialBattle, tutorialBoard, GENERATE_TUTORIAL_MAP, TUTORIAL_CHAIN } from '../data/tutorial';
import { loadUnlockState, saveUnlockState } from '../utils/persistence';
import { balancedGlobal } from '../utils/balance';

interface UseGameProgressionProps {
    gameState: GameState;
    setGameState: Dispatch<SetStateAction<GameState>>;
    setBoard: (board: any) => void;
    /** Live unit list — read at battle end to see which deployed bench plants survived. */
    units: Unit[];
    setUnits: Dispatch<SetStateAction<Unit[]>>;
    unitDefs: Record<UnitClass, UnitDefinition>;
    terrainDefs: Record<string, TerrainDefinition>;
}

const isHeroUnit = (u: Unit): boolean => !!u.isHero && !!u.heroId;

const newBenchId = () => `bench_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const useGameProgression = ({
    gameState, setGameState, setBoard, units, setUnits, unitDefs, terrainDefs
}: UseGameProgressionProps) => {

    // A brand-new save walks the hand-authored tutorial chain; everyone else gets the
    // generated map. `tutorialDone` lives in the persisted UnlockState.
    const [mapNodes, setMapNodes] = useState<MapNode[]>(
        loadUnlockState().tutorialDone ? GENERATE_MAP() : GENERATE_TUTORIAL_MAP()
    );

    /**
     * Last known state of every hero that has been on the field this run, keyed by hero id.
     * A dead hero's Unit is removed from the units array, but its fusions must survive —
     * "fusion đã hợp vào hero thì không mất" (DESIGN.md section 2). This is where they wait.
     */
    const heroSnapshots = useRef<Map<HeroId, Unit>>(new Map());
    /**
     * Heroes revived since the last level; they need a fresh body next battle.
     *
     * The QUEUE lives in gameState (saved across reloads). This ref is only a working
     * mirror, kept in sync every render, so the existing synchronous call sites keep
     * working — several of them run inside setUnits updaters where reading React state
     * would be stale.
     */
    const pendingRevives = useRef<Set<HeroId>>(new Set(gameState.pendingRevives ?? []));
    pendingRevives.current = new Set(gameState.pendingRevives ?? []);
    /** Brains the player had when the current level started — the coin bonus is measured from it. */
    const brainsAtLevelStart = useRef<number>(gameState.brainsMax);
    /** Same idea for the "no hero down" bonus. */
    const heroesDownAtLevelStart = useRef<number>(0);

    // --- CROSS-RUN PROGRESS (DESIGN.md section 7) ---
    // The ref is the source of truth (several updates can happen inside one handler, and
    // React state would still be stale); the state exists so the UI re-renders.
    const unlocksRef = useRef<UnlockState>(loadUnlockState());
    const [unlocks, setUnlocks] = useState<UnlockState>(unlocksRef.current);

    /**
     * Things earned since the last time the UI showed them. The victory screen drains this.
     * Kept as a queue rather than a single value because one boss clear can hand over a hero
     * AND its signature recipe in the same commit.
     */
    const [pendingUnlocks, setPendingUnlocks] = useState<UnlockAward[]>([]);
    const clearPendingUnlocks = () => setPendingUnlocks([]);

    /**
     * Turns the difference between two UnlockStates into announcements. Diffing here rather
     * than at each grant site means no future grant can forget to announce itself.
     */
    const awardsBetween = (before: UnlockState, after: UnlockState): UnlockAward[] => {
        const out: UnlockAward[] = [];

        after.heroes.filter(h => !before.heroes.includes(h)).forEach(h => {
            const def = HERO_DEFINITIONS[h];
            const info = unlockInfoFor(h);
            out.push({
                kind: 'HERO', id: h,
                title: def?.name ?? h,
                subtitle: info ? `${info.city} joins the fight.` : 'A new hero joins the squad.',
                imgUrl: def?.boardImgUrl ?? def?.imgUrl,
            });
        });

        after.recipes.filter(r => !before.recipes.includes(r)).forEach(r => {
            const parsed = parseRecipeKey(r);
            const recipe = parsed ? FUSION_RECIPES[parsed.hero]?.[parsed.material] : undefined;
            const heroName = parsed ? (HERO_DEFINITIONS[parsed.hero]?.name ?? parsed.hero) : r;
            const matName = parsed ? (getMaterial(parsed.material)?.name ?? parsed.material) : '';
            out.push({
                kind: 'RECIPE', id: r,
                title: recipe?.name ?? `${heroName} + ${matName}`,
                subtitle: recipe?.description ?? '',
                imgUrl: parsed ? getMaterial(parsed.material)?.imgUrl : undefined,
            });
        });

        return out;
    };

    /** Single write point: nothing else may touch localStorage progress. */
    const commitUnlocks = (next: UnlockState) => {
        if (next === unlocksRef.current) return;
        const awards = awardsBetween(unlocksRef.current, next);
        if (awards.length) setPendingUnlocks(prev => [...prev, ...awards]);
        unlocksRef.current = next;
        setUnlocks(next);
        saveUnlockState(next);
    };

    /**
     * Everything leaving a node is worth, as a pure function of the current progress.
     *
     * ONE function, used by both the preview and the commit. The victory screen has to show
     * the rewards BEFORE they are paid — `completeLevel` only runs when the player clicks
     * Continue — and the previous approach to that problem (`previewRewards`, a hand-copied
     * twin of the Coin maths) is exactly the kind of duplicate that drifts. Unlocks get one
     * source of truth instead: preview diffs against it, commit writes it.
     *
     * Three payouts, in this order:
     *   depth  -> recipes  (a personal-best layer pays even on a run that later dies:
     *                       DESIGN.md section 7 is explicit that requiring a win would make
     *                       new players quit before they ever see the depth)
     *   boss   -> the city's hero, plus its signature recipe
     *   bonus objectives -> banked now, converted to recipes when the RUN ends
     */
    const projectUnlocks = (node: MapNode | undefined, runEnded = false): UnlockState => {
        const current = unlocksRef.current;
        if (!node) return current;
        let next = current;
        // Clearing the boss ends the run. Running out of brains does too, and that path
        // comes in through `recordRunLost` below rather than through a node.
        const endsRun = runEnded || node.type === 'BOSS';

        const depth = Math.floor(layerOfNode(node, mapNodes));
        if (Number.isFinite(depth) && depth > next.deepestChapter) {
            const earned = Math.floor(depth / LAYERS_PER_UNLOCK_PACKAGE)
                         - Math.floor(next.deepestChapter / LAYERS_PER_UNLOCK_PACKAGE);
            next = withRecipes({ ...next, deepestChapter: depth }, Math.max(0, earned));
        }

        if (node.type === 'BOSS') {
            const bossNumber = next.bossesDefeated + 1;
            next = withHeroesForBoss(
                { ...next, runsWon: next.runsWon + 1, bossesDefeated: bossNumber },
                bossNumber,
            );
        }

        const isFight = node.type === 'BATTLE' || node.type === 'ELITE' || node.type === 'BOSS';
        if (isFight) {
            const brainsLost = Math.max(0, brainsAtLevelStart.current - gameState.brainsRemaining);
            const heroesDown = Math.max(0, gameState.fallenHeroes.length - heroesDownAtLevelStart.current);
            const taken = earnedBonuses(gameState.mission, brainsLost, heroesDown).length;
            if (taken > 0) {
                next = {
                    ...next,
                    bonusObjectivesDone: next.bonusObjectivesDone + taken,
                    bonusObjectivesBanked: next.bonusObjectivesBanked + taken,
                };
            }
        }

        // Objectives only CASH IN when the run ends. Paying them out per fight handed the
        // player new tools halfway through a plan, and made clearing an ordinary node feel
        // the same as finishing a run. The remainder stays banked for the next run.
        if (endsRun) next = cashInObjectives(next);

        return next;
    };

    /**
     * Converts banked bonus objectives into fusion recipes. The leftover under the threshold
     * is kept, not discarded — two objectives short of a recipe still count towards the next.
     */
    const cashInObjectives = (state: UnlockState): UnlockState => {
        const earned = Math.floor(state.bonusObjectivesBanked / BONUS_OBJECTIVES_PER_RECIPE);
        if (earned <= 0) return state;
        return withRecipes(
            { ...state, bonusObjectivesBanked: state.bonusObjectivesBanked - earned * BONUS_OBJECTIVES_PER_RECIPE },
            earned,
        );
    };

    /**
     * A run ended in defeat. Objectives banked along the way still pay — DESIGN.md section 7
     * is explicit that requiring a win would make new players quit before they see the depth,
     * and the same logic applies to the objectives they did complete on the way down.
     */
    const recordRunLost = () => {
        commitUnlocks(cashInObjectives(unlocksRef.current));
    };

    /**
     * What the current node is about to unlock, WITHOUT unlocking it — the twin of
     * `previewRewards`, for the victory screen's unlock panel.
     */
    const previewUnlocks = (): UnlockAward[] => {
        const nodeId = gameState.currentLevelId;
        const node = nodeId ? mapNodes.find(n => n.id === nodeId) : undefined;
        return awardsBetween(unlocksRef.current, projectUnlocks(node));
    };

    /**
     * Heroes that may receive a fusion right now: the ones on the field, PLUS the ones that
     * have been revived and are waiting for the next battle to rebuild their body.
     *
     * The queued ones used to be missing, and that was a real hole rather than a tutorial
     * quirk: the campfire is both the only place you can fuse AND a place that sells revives,
     * so a player could pay to bring a hero back and then be unable to fuse the hero they
     * had just paid for, with no explanation beyond an absent card.
     */
    const fusableHeroes = (live: Unit[]): Unit[] => {
        const onField = live.filter(isHeroUnit);
        const present = new Set(onField.map(u => u.heroId));
        const queued: Unit[] = [];
        pendingRevives.current.forEach(id => {
            if (present.has(id)) return;
            // heroSnapshots is a ref and does NOT survive a reload, so a queued hero can
            // legitimately have no snapshot. Falling back to her definition is the
            // documented trade (runPersistence: "revive then restores base stats") — what
            // is not acceptable is her having no card at all.
            queued.push(heroSnapshots.current.get(id) ?? freshHero(id));
        });
        return [...onField, ...queued];
    };

    /**
     * Fuses a hero that has no Unit yet. The snapshot IS the hero until the next battle
     * rebuilds her, so writing there is what makes the fusion survive to the field.
     */
    const fuseQueuedHero = (heroId: HeroId, materialId: MaterialId): boolean => {
        const snap = heroSnapshots.current.get(heroId);
        if (!snap) return false;
        heroSnapshots.current.set(heroId, applyFusion(snap, materialId));
        return true;
    };

    const rememberHero = (u: Unit) => {
        if (isHeroUnit(u)) heroSnapshots.current.set(u.heroId as HeroId, u);
    };

    /** Call when a new run begins so the previous run's heroes cannot leak into it. */
    const registerSquad = (heroIds: HeroId[]) => {
        heroSnapshots.current.clear();
        pendingRevives.current.clear();
        setGameState(prev => ({ ...prev, pendingRevives: [] }));
        brainsAtLevelStart.current = gameState.brainsMax;
        void heroIds;
    };

    // --- MAP LOGIC ---
    /**
     * What the current level is about to pay, WITHOUT paying it.
     *
     * The victory screen used to print a hardcoded "+100 Sun" that was wrong twice over:
     * rewards are Coin, and the amount depends on the node and the bonus objectives.
     * Because `completeLevel` only runs when the player clicks Continue, the screen has to
     * be able to ask for the figure first — hence this read-only twin of the same maths.
     */
    const previewRewards = (): { coins: number; bonuses: MissionBonus[] } => {
        const nodeId = gameState.currentLevelId;
        const nodeType = nodeId ? mapNodes.find(n => n.id === nodeId)?.type : undefined;
        const isFight = nodeType === 'BATTLE' || nodeType === 'ELITE' || nodeType === 'BOSS';

        let coins = isFight ? COIN_PER_LEVEL : 0;
        if (nodeType === 'ELITE') coins += COIN_ELITE_BONUS;
        if (nodeType === 'BOSS') coins += COIN_BOSS_BONUS;

        const brainsLost = Math.max(0, brainsAtLevelStart.current - gameState.brainsRemaining);
        const heroesDown = Math.max(0, gameState.fallenHeroes.length - heroesDownAtLevelStart.current);
        const bonuses = earnedBonuses(gameState.mission, brainsLost, heroesDown);
        bonuses.forEach(b => { coins += b.coins; });

        if (isFight) coins += gameState.nextBattleMods?.coinOnWin || 0;
        return { coins, bonuses };
    };

    /**
     * Marks the node completed and pays the Coin reward (DESIGN.md section 5).
     * Returns the coins awarded so the caller can show it.
     */
    const completeLevel = (nodeId: string): number => {
        const finishedNode = mapNodes.find(n => n.id === nodeId);
        const completedNodeType = finishedNode?.type;

        // Progress is recorded on the way out of a node, not on victory: getting further than
        // ever before is itself the milestone (DESIGN.md section 7). Same projection the
        // victory screen already showed the player, so what was promised is what is paid.
        if (finishedNode) commitUnlocks(projectUnlocks(finishedNode));
        if (completedNodeType === 'BOSS') {
            // End of chapter: the free, automatic revival safety net (DESIGN.md section 2).
            reviveAllHeroes();
        }

        setMapNodes(prev => {
            const newNodes = prev.map(n => n.id === nodeId ? { ...n, status: 'COMPLETED' as const } : n);
            const completedNode = prev.find(n => n.id === nodeId);
            if (completedNode) {
                completedNode.next.forEach(nextId => {
                    const nextNodeIndex = newNodes.findIndex(n => n.id === nextId);
                    if (nextNodeIndex !== -1) {
                        newNodes[nextNodeIndex].status = 'AVAILABLE';
                    }
                });
            }
            return newNodes;
        });

        const brainsLost = Math.max(0, brainsAtLevelStart.current - gameState.brainsRemaining);
        const heroesDown = Math.max(0, gameState.fallenHeroes.length - heroesDownAtLevelStart.current);

        // completeLevel runs for EVERY node type, events included. Only a fight pays the
        // level stipend, settles an event's wager, or consumes the next-battle terms — an
        // event node used to collect all three on the way out, which both inflated the
        // economy and wiped the terms the event had just set one line earlier.
        const isFight = completedNodeType === 'BATTLE'
            || completedNodeType === 'ELITE'
            || completedNodeType === 'BOSS';

        let reward = isFight ? COIN_PER_LEVEL : 0;
        if (completedNodeType === 'ELITE') reward += COIN_ELITE_BONUS;
        if (completedNodeType === 'BOSS') reward += COIN_BOSS_BONUS;

        // Bonus objectives replace the old flat "no brain lost" bonus — that condition is now
        // one of the bonuses the mission may or may not have rolled.
        // Coin only here. Bonus objectives also pay cross-run progress (fusion recipes), but
        // that half is applied by `projectUnlocks` above — counting it in both places would
        // award every objective twice.
        earnedBonuses(gameState.mission, brainsLost, heroesDown).forEach(b => { reward += b.coins; });

        // Wagered at an event ("taunt Blightlord"), paid only on a won fight. Losing never
        // reaches here, so the wager is forfeit.
        if (isFight) reward += gameState.nextBattleMods?.coinOnWin || 0;

        setGameState(prev => ({
            ...prev,
            coins: prev.coins + reward,
            nextBattleMods: isFight ? {} : prev.nextBattleMods,
        }));
        return reward;
    };

    /**
     * @param debug Dev travel: enter the node without consuming the run's branch choice.
     *              The node is force-unlocked and no sibling is marked SKIPPED, so the map
     *              stays intact and you can keep hopping around it.
     */
    const selectNode = (node: MapNode, benchToDeploy?: BenchPlant[], debug = false) => {
        if (debug) {
            setMapNodes(prev => prev.map(n =>
                n.id === node.id && n.status !== 'COMPLETED'
                    ? { ...n, status: 'AVAILABLE' as const }
                    : n
            ));
        } else {
            // Mark siblings as SKIPPED immediately upon selection
            setMapNodes(prev => prev.map(n => {
                if (n.id === node.id) return n; // Keep current as is (AVAILABLE)

                if (n.status === 'AVAILABLE') {
                     // Skip siblings in same layer (approx same Y)
                     if (Math.abs(n.y - node.y) < 2) {
                         return { ...n, status: 'SKIPPED' };
                     }
                }
                return n;
            }));
        }

        setGameState(prev => ({
            ...prev,
            currentLevelId: node.id,
            currentWorld: node.world
        }));

        const tut = node.tutorialId ? tutorialNode(node.tutorialId) : undefined;

        // Reaching the last node means the player has seen every lesson. Mark it done here
        // rather than on victory: board 7 is built to be lost, so waiting for a win would
        // leave the tutorial armed forever.
        if (tut && tut.id === TUTORIAL_CHAIN[TUTORIAL_CHAIN.length - 1].id) {
            commitUnlocks({ ...unlocksRef.current, tutorialDone: true });
        }

        if (node.type === 'SHOP') {
            // The tutorial shop is pinned. A random 175-Coin Snow Pea here would eat the purse
            // and strand the player before the revive two nodes later — assertTutorial checks
            // the budget against exactly this stock list.
            setGameState(prev => ({
                ...prev,
                screen: 'SHOP',
                shopRerolls: 0,
                shopOffers: tut?.shopOffers ?? prev.shopOffers,
                // null means "the whole catalogue", which is right everywhere except here.
                shopItemOffers: tut?.itemOffers ?? null,
            }));
        } else if (tut?.eventId) {
            setGameState(prev => ({ ...prev, screen: 'EVENT', currentEventId: tut.eventId }));
        } else if (node.type === 'CAMPFIRE') {
             // CHANGE: Open Rest Event instead of auto-heal
             setGameState(prev => ({
                 ...prev,
                 screen: 'EVENT',
                 currentEventId: 'rest_site'
             }));
        } else if (node.type === 'EVENT') {
             // Stakes scale with depth, then prefer one this run has not shown yet. Without
             // the second filter a three-EVENT route could roll the same encounter three
             // times, which reads as a bug rather than as variety.
             const allowed = tiersForLayer(layerOfNode(node, mapNodes));
             const pool = GAME_EVENTS.filter(e =>
                 e.id !== 'rest_site' && allowed.includes(e.tier ?? 1));
             const seen = gameState.seenEvents || [];
             const fresh = pool.filter(e => !seen.includes(e.id));
             // Each fallback is one step wider, so an exhausted tier still yields something
             // rather than dropping the player onto a blank screen.
             const candidates = fresh.length > 0
                 ? fresh
                 : (pool.length > 0 ? pool : GAME_EVENTS.filter(e => e.id !== 'rest_site'));
             const randomEvent = candidates[Math.floor(Math.random() * candidates.length)] || GAME_EVENTS[0];

             setGameState(prev => ({
                 ...prev,
                 screen: 'EVENT',
                 currentEventId: randomEvent.id,
                 // Once the pool is exhausted, start a fresh cycle rather than locking up.
                 seenEvents: fresh.length > 0 ? [...(prev.seenEvents || []), randomEvent.id] : [randomEvent.id],
             }));
        } else {
             setupCombat(node, benchToDeploy);
        }
    };

    // --- HERO LIFE CYCLE (DESIGN.md section 2) ---

    /**
     * A hero went down in combat. It does NOT turn into a base plant and nothing fills its
     * slot mid-fight — it simply leaves the run until revived. Its fusions are kept.
     */
    const handleHeroFallen = (heroId: HeroId, snapshot?: Unit) => {
        if (snapshot) heroSnapshots.current.set(heroId, snapshot);
        pendingRevives.current.delete(heroId);
        setGameState(prev => ({
            ...prev,
            fallenHeroes: prev.fallenHeroes.includes(heroId)
                ? prev.fallenHeroes
                : [...prev.fallenHeroes, heroId],
            pendingRevives: prev.pendingRevives.filter(h => h !== heroId),
        }));
    };

    const canReviveHero = (heroId: HeroId, free = false): boolean =>
        gameState.fallenHeroes.includes(heroId) && (free || gameState.coins >= COIN_REVIVE_HERO);

    /**
     * Campfire revival costs Coin; the automatic end-of-chapter revival is free.
     * Returns false when the hero is not fallen or the player cannot pay.
     */
    const reviveHero = (heroId: HeroId, free: boolean = false): boolean => {
        if (!canReviveHero(heroId, free)) return false;

        pendingRevives.current.add(heroId);
        setGameState(prev => ({
            ...prev,
            coins: free ? prev.coins : Math.max(0, prev.coins - COIN_REVIVE_HERO),
            fallenHeroes: prev.fallenHeroes.filter(h => h !== heroId),
            pendingRevives: prev.pendingRevives.includes(heroId)
                ? prev.pendingRevives
                : [...prev.pendingRevives, heroId],
        }));
        return true;
    };

    /**
     * The Campfire entry point (`REVIVE_HERO` in `data/events.ts`): always paid, never free.
     * Thin wrapper so callers cannot accidentally pass `free = true` and hand out a free revive.
     */
    const reviveHeroPaid = (heroId: HeroId): boolean => reviveHero(heroId, false);

    // --- BRAIN BUY-BACK ---
    // Losing every brain on a single board now ends the run there and then (turnManager
    // PHASE 5), so the run budget alone is no longer a cushion. This is the only way back
    // up, and it is deliberately priced above a hero revival: 150, then 225, then 300…

    /** Coin price of the next brain, given how many have already been bought this run. */
    /** Leaves the scripted chain for good and drops the player onto a generated map. */
    const finishTutorial = () => {
        // The tutorial grants NO recipes. It briefly lends the ones its script fuses
        // (TUTORIAL_RECIPES) so the campfire lesson can be completed, and that loan ends
        // here. Recipes are earned by bonus objectives — handing a stack of them over for
        // finishing the tutorial meant every recipe earned afterwards competed with a head
        // start the player never worked for.
        commitUnlocks({ ...unlocksRef.current, tutorialDone: true });
        setMapNodes(GENERATE_MAP());
        setGameState(prev => ({
            ...prev,
            screen: 'MAP',
            scriptedBattleId: null,
            tutorialStep: -1,
        }));
    };

    const brainCost = (): number => brainBuybackCost(gameState.brainsBought || 0);

    const canBuyBrain = (): boolean =>
        gameState.brainsRemaining < gameState.brainsMax && gameState.coins >= brainCost();

    /** Returns false when the budget is already full or the player cannot pay. */
    const buyBrain = (): boolean => {
        if (!canBuyBrain()) return false;
        const cost = brainCost();
        setGameState(prev => ({
            ...prev,
            coins: Math.max(0, prev.coins - cost),
            brainsRemaining: Math.min(prev.brainsMax, prev.brainsRemaining + 1),
            brainsBought: (prev.brainsBought || 0) + 1,
        }));
        return true;
    };

    /** End-of-chapter safety net: everyone comes back, no Coin spent. */
    const reviveAllHeroes = () => {
        gameState.fallenHeroes.forEach(h => pendingRevives.current.add(h));
        setGameState(prev => ({
            ...prev,
            pendingRevives: [...new Set([...prev.pendingRevives, ...prev.fallenHeroes])],
            fallenHeroes: [],
        }));
    };

    // --- BENCH (DESIGN.md section 2: insurance vs. fusion material) ---

    const benchSpaceRemaining = (): number =>
        Math.max(0, BENCH_CAPACITY - gameState.bench.length);

    const addBenchPlant = (materialId: MaterialId): boolean => {
        if (benchSpaceRemaining() <= 0) return false;
        const plant: BenchPlant = { id: newBenchId(), materialId };
        setGameState(prev => (
            prev.bench.length >= BENCH_CAPACITY
                ? prev
                : { ...prev, bench: [...prev.bench, plant] }
        ));
        return true;
    };

    /** Removes a bench plant (sold, deployed permanently, or consumed by a fusion). */
    const removeBenchPlant = (benchId: string) => {
        setGameState(prev => ({ ...prev, bench: prev.bench.filter(b => b.id !== benchId) }));
    };

    // --- COMBAT SETUP LOGIC ---
    /**
     * Bench plants deployed by the most recent setupCombat, and the battle unit each one
     * became. It has to travel by ref: the deployment is decided inside a setUnits updater
     * (it needs prevUnits to know how many slots are free), and gameState's updater is
     * processed BEFORE units' — so touching the bench inline would read a stale bench.
     *
     * A deployment is NO LONGER a purchase of one battle. The plant is a body: if it
     * survives the fight it walks back to the bench and deploys again next time; only
     * dying spends it. Striking it off at deploy time made a 100-Coin backup strictly
     * worse than fusing the same plant (one appearance vs a permanent trait) — the
     * arithmetic nobody would ever take.
     */
    const benchDeployedRef = useRef<Array<{ benchId: string; unitId: string }>>([]);

    useEffect(() => {
        // Settle the ledger only when the battle is over — mid-battle, units still moves.
        if (gameState.screen === 'COMBAT') return;
        const pairs = benchDeployedRef.current;
        if (pairs.length === 0) return;
        benchDeployedRef.current = [];
        // Three outcomes, and the tile position is what tells them apart:
        //   gone from `units`      -> it died out there; struck off the bench
        //   still benched (x < 0)  -> the player chose NOT to send it; untouched
        //   on the field (x >= 0)  -> it served a tour; one point of wear
        // That middle case is the whole reason deployment can be a choice: leaving a
        // seedling behind has to cost exactly nothing, or "choose" is not a real word.
        const survivors = new Map<string, number>();
        const dead: string[] = [];
        pairs.forEach(pr => {
            const u = units.find(z => z.id === pr.unitId && z.hp > 0);
            if (!u) { dead.push(pr.benchId); return; }
            if (u.position.x < 0) return;   // never left the bench
            survivors.set(pr.benchId, u.hp);
        });
        if (dead.length === 0 && survivors.size === 0) return;

        setGameState(prev => ({
            ...prev,
            bench: prev.bench
                .filter(b => !dead.includes(b.id))
                .map(b => {
                    if (!survivors.has(b.id)) return b;
                    const full = getMaterial(b.materialId).benchStats.maxHp;
                    // What it walked off the field with, minus one for the tour itself.
                    // Floored at 1 — attrition makes a seedling fragile, it never deletes
                    // one off the bench; only dying on the field does that.
                    const worn = Math.max(1, Math.min(survivors.get(b.id)!, full) - 1);
                    return { ...b, hp: worn };
                }),
        }));
    }, [gameState.screen, units]);

    /**
     * @param benchToDeploy Bench plants the player chose to bring. When omitted, the empty
     *                      squad slots are auto-filled from the front of the bench.
     */
    const setupCombat = (node: MapNode, benchToDeploy?: BenchPlant[]) => {
        // A scripted tutorial battle replaces every random decision in this function: the
        // board, the squad, where they stand, and which zombies arrive. Nothing here is
        // rolled, because a lesson that changes shape between playthroughs is not a lesson.
        const script = node.tutorialId ? tutorialBattle(node.tutorialId) : undefined;
        const newBoard = script ? tutorialBoard(script) : generateBoard(node.world);
        const fallen = gameState.fallenHeroes || [];

        // Terms an event imposed on exactly this battle. Read once here, cleared at the end
        // of setup so they can never leak into the fight after it.
        const mods = gameState.nextBattleMods || {};

        // "One house starts with its brain already gone" (Treasure Yeti). Applied before the
        // board is handed over, so the AI and the board-dry loss rule both see the real state.
        if (mods.brainlessHouses) {
            const houses = newBoard.filter(t => t.isHouse && t.hasBrain);
            // Never strip the last one — that would lose the battle before it began.
            const strip = Math.min(mods.brainlessHouses, Math.max(0, houses.length - 1));
            for (let i = 0; i < strip; i++) houses[i].hasBrain = false;
        }

        // The scripted branch never touches the queue; the generated one drains it inside a
        // setUnits updater. Recording it here lets the SAVED copy be cleared afterwards,
        // outside the updater, where calling setGameState is safe.
        let queueConsumed = false;

        // How deep this fight sits in the run. Gates the advanced-zombie budget.
        const depth = layerOfNode(node, mapNodes);
        // Rolled OUTSIDE the setUnits updater: React may invoke that updater twice (StrictMode
        // does, in development), and a wave rolled inside it would be a different wave each
        // time. Deploy tiles come back with it — same board, same pass.
        const { enemies: rolledEnemies, deployTiles } =
            buildEncounter(node, newBoard, depth, unitDefs, terrainDefs, mods);

        setUnits(prevUnits => {
            if (script) {
                // Keep an existing hero object when we have one so fusions carry across the
                // chain; otherwise build it fresh from the definition.
                const existing = new Map<HeroId, Unit>();
                prevUnits.filter(u => !u.isEnemy && isHeroUnit(u))
                    .forEach(u => existing.set(u.heroId as HeroId, u));

                const heroes: Unit[] = script.squad
                    .filter(h => !fallen.includes(h))
                    .map((h, idx) => {
                        const prev = existing.get(h);
                        // Was a hand-inlined copy of freshHero that differed only in the id.
                        const base = prev ? buildHeroFromSnapshot(prev) : freshHero(h, `tut-${h}-${idx}`);
                        rememberHero(base);
                        return {
                            ...base,
                            position: script.placement[h] ?? { x: -1, y: -1 },
                            // DORMANT is how board 1 says "she is the objective, not a unit".
                            statusEffects: (script.dormant ?? []).includes(h)
                                ? (['DORMANT'] as StatusEffectType[]) : [],
                        };
                    });

                // A fallen hero's slot is filled by a bench plant, exactly as in a real run —
                // that is the whole point of board 4.
                const freeSlots = Math.max(0, script.squad.length - heroes.length);
                const chosen = (gameState.bench || []).slice(0, freeSlots);
                benchDeployedRef.current = chosen.map((p, i) => ({ benchId: p.id, unitId: `bench-${p.id}-${i}` }));
                const openSpots = script.squad
                    .filter(h => fallen.includes(h))
                    .map(h => script.placement[h])
                    .filter(Boolean);
                const benchUnits = chosen.map((p, i) => ({
                    ...buildBenchUnit(p, i),
                    position: openSpots[i] ?? { x: -1, y: -1 },
                }));

                const enemies: Unit[] = script.opening.map((sp, i) => buildEnemy(
                    unitDefs[sp.cls], sp.cls, { x: sp.x, y: sp.y }, `tut-enemy-${i}-${Date.now()}`,
                    {
                        // hpBonus: the story boss is tougher than its class sheet (tut_7).
                        hpBonus: (sp as any).hpBonus ?? 0,
                        isMassive: sp.cls === UnitClass.GARGANTUAR,
                    },
                ));

                return [...heroes, ...benchUnits, ...enemies];
            }

            // ---- 1. PLAYER SIDE: heroes that are still standing, plus chosen bench plants ----
            const seen = new Set<HeroId>();
            const heroUnits: Unit[] = [];

            prevUnits
                .filter(u => !u.isEnemy && u.type === UnitType.PLANT && isHeroUnit(u))
                .forEach(u => {
                    const hid = u.heroId as HeroId;
                    rememberHero(u);
                    if (seen.has(hid) || fallen.includes(hid)) return;
                    seen.add(hid);
                    heroUnits.push(buildHeroFromSnapshot(u));
                });

            // Heroes revived at a Campfire / chapter end have no Unit left — rebuild them,
            // at full hp: the snapshot was taken at (or near) the moment they fell.
            pendingRevives.current.forEach(hid => {
                if (seen.has(hid) || fallen.includes(hid)) return;
                const snap = heroSnapshots.current.get(hid);
                seen.add(hid);
                heroUnits.push(snap ? buildHeroFromSnapshot(snap, true) : freshHero(hid));
            });
            pendingRevives.current.clear();
            queueConsumed = true;

            // Legacy squads created before heroes existed: keep them so nothing disappears.
            const legacyUnits = prevUnits
                .filter(u => !u.isEnemy && u.type === UnitType.PLANT && !isHeroUnit(u) && !u.materialId)
                .map(u => ({
                    ...u,
                    position: { x: -1, y: -1 },
                    hasMoved: false,
                    hasAttacked: false,
                    prevPosition: undefined,
                    statusEffects: [],
                    intent: undefined,
                }));

            const roster = [...heroUnits, ...legacyUnits].slice(0, SQUAD_SIZE);

            const freeSlots = Math.max(0, SQUAD_SIZE - roster.length);
            // Offered, not deployed. Every bench plant that fits an open slot is put on the
            // placement screen; whether it actually walks onto a tile is the player's call,
            // and the end-of-battle ledger only charges the ones that did.
            const chosenBench = (benchToDeploy ?? (gameState.bench || []).slice(0, freeSlots))
                .slice(0, freeSlots);
            // Spending the plant is the whole point of the "backup OR fusion material" rule
            // (DESIGN.md section 2). Nothing used to strike it off, so one purchase filled a
            // dead hero's slot in every battle for the rest of the run AND was still sitting
            // on the bench afterwards, ready to be fused. It was free forever.
            benchDeployedRef.current = chosenBench.map((p, i) => ({ benchId: p.id, unitId: `bench-${p.id}-${i}` }));
            const benchUnits = chosenBench.map(buildBenchUnit);

            return [...roster, ...benchUnits, ...rolledEnemies];
        });

        setBoard(newBoard);
        // The very first battle of a run always teaches the base rule before layering an
        // objective on top of it.
        const isFirstLevel = mapNodes.every(n => n.status !== 'COMPLETED');
        const mission = script
            ? {
                objective: script.objective,
                description: script.objectiveText,
                target: undefined,
                targets: undefined,
                bonuses: script.bonuses,
                zombiesKilled: 0,
                failed: false,
              }
            : buildMission(node.type, newBoard, isFirstLevel);

        setGameState(prev => {
            // Remember the brain count now so completeLevel can pay the "no brain lost" bonus.
            brainsAtLevelStart.current = prev.brainsRemaining;
            heroesDownAtLevelStart.current = prev.fallenHeroes.length;
            return {
                ...prev,
                // The queued revives got bodies in the setUnits updater above, so the saved
                // copy is spent too. Cleared here rather than in the updater, which must
                // stay a pure function of prevUnits.
                pendingRevives: queueConsumed ? [] : prev.pendingRevives,
                mission,
                screen: 'COMBAT',
                currentLevelId: node.id,
                // How deep this fight sits in the run. Gates the advanced-zombie budget.
                depth: layerOfNode(node, mapNodes),
                turn: 1,
                // Rebuilt from the base every battle: maxTurns lives in GameState, so without
                // this an event's +1 turn would apply to every remaining fight in the run.
                maxTurns: script ? script.maxTurns : Math.max(3, BASE_MAX_TURNS + (mods.turns || 0)),
                scriptedBattleId: script ? node.tutorialId! : null,
                // Consumed. `coinOnWin` is deliberately kept — completeLevel pays it out.
                nextBattleMods: { coinOnWin: mods.coinOnWin || 0 },
                // Sun is action economy, not savings: every level starts from the same 50.
                // A scripted board may set its own, because Sun is exactly what decides
                // which of a hero's two tools exists yet — see TutorialBattle.startingSun.
                sun: script?.startingSun ?? balancedGlobal('global.SUN_ON_LEVEL_START'),
                spawnPoints: deployTiles,
                // A scripted battle telegraphs its turn-2 wave from the very first frame —
                // processTurn keeps the marker updated every turn after, but it never runs
                // before turn 1, so without this the first wave's spawn holes are invisible
                // exactly when a lesson says "stand on that hole".
                enemySpawnQueue: script
                    ? (script.waves?.[2] ?? []).map(sp => ({ x: sp.x, y: sp.y }))
                    : [], // RESET: Clear any pending spawns from previous levels
                interactionMode: 'PLACEMENT',
                selectedUnitId: null
            };
        });
    };


    return {
        mapNodes,
        setMapNodes,
        selectNode,
        completeLevel,
        previewRewards,
        previewUnlocks,
        recordRunLost,
        // Bound to this hook's terrainDefs so App keeps the same three-argument call it had.
        performTurnZeroAI: (currentUnits: Unit[], currentBoard: TileData[], holdPositions = false) =>
            runTurnZeroAI(currentUnits, currentBoard, terrainDefs, holdPositions),
        // --- new: hero life cycle, bench, revival ---
        setupCombat,
        registerSquad,
        handleHeroFallen,
        canReviveHero,
        reviveHero,
        reviveHeroPaid,
        reviveAllHeroes,
        // --- brain buy-back ---
        finishTutorial,
        brainCost,
        canBuyBrain,
        buyBrain,
        // --- new: cross-run unlock progress (persisted) ---
        unlocks,
        pendingUnlocks,
        clearPendingUnlocks,
        addBenchPlant,
        removeBenchPlant,
        fusableHeroes,
        fuseQueuedHero,
        benchSpaceRemaining,
    };
};
