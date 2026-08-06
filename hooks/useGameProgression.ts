
import { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react';
import {
    GameState, MapNode, Unit, UnitClass, UnitType, UnitDefinition, TerrainDefinition,
    TileData, ElementId, HeroId, MaterialId, BenchPlant, UnlockState, MissionBonus, StatusEffectType
} from '../types';
import {
    GENERATE_MAP, generateBoard,
    SQUAD_SIZE, BENCH_CAPACITY, SUN_ON_LEVEL_START, BASE_MAX_TURNS, BOSS_MAX_TURNS, BREACH_MAX_TURNS,
    COIN_PER_LEVEL, COIN_ELITE_BONUS, COIN_BOSS_BONUS, COIN_REVIVE_HERO,
    CAMP_ITEM_OFFERS, SHOP_OFFER_COUNT, brainBuybackCost
} from '../constants';
import { DEFAULT_ITEM_DEFINITIONS, SECTOR_ITEM } from '../data/items';
import { applyFusion, applyUpgrade } from '../utils/fusion';
// This hook used to hold all of the following inline. What is left here is the part that is
// genuinely about React state and the run; the rules moved to utils/, where they can be run.
import { withLevelUps, withBossDefeated, withSectorVisited, unlockedItemIds } from '../utils/unlockLogic';
import { freshHero, buildHeroFromSnapshot, buildBenchUnit, buildEnemy, isBattleOnlyUnit } from '../utils/unitFactory';
import { buildEncounter, layerOfNode, tiersForLayer } from '../utils/encounterBuilder';
import { performTurnZeroAI as runTurnZeroAI } from '../utils/turnZeroAI';
import { GAME_EVENTS } from '../data/events';
import { HERO_DEFINITIONS } from '../data/heroes';
import { getMaterial, STARTING_MATERIALS } from '../data/materials';
import { buildMission, earnedBonuses } from '../data/missions';
import {
    parseRecipeKey, unlockInfoFor, TUTORIAL_RECIPES, UnlockAward,
    RunResult, xpForRun, levelOf, levelCapFor, nextUnbeatenBoss, heroForBoss,
    recipeKey, BOSSES, XP_PER_LEVEL, actsOfStage, bossById,
} from '../data/unlocks';
import { FUSION_RECIPES } from '../data/fusionRecipes';
import { tutorialNode, tutorialBattle, tutorialBoard, GENERATE_TUTORIAL_MAP, TUTORIAL_CHAIN } from '../data/tutorial';
import { loadUnlockState, saveUnlockState, defaultUnlockState, saveChronoEcho } from '../utils/persistence';
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

/** Everything the level bar needs, for a run that has ended or is about to. */
export interface RunPayout {
    /** XP the run is worth. */
    gained: number;
    /** Commander level before and after cashing it in. */
    before: number;
    after: number;
    /** Progress into the resulting level, and what the next one costs. */
    into: number;
    needed: number;
    /** At the boss ceiling: XP keeps banking, but no further level can be paid out. */
    capped?: boolean;
}

const newBenchId = () => `bench_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const useGameProgression = ({
    gameState, setGameState, setBoard, units, setUnits, unitDefs, terrainDefs
}: UseGameProgressionProps) => {

    // A brand-new save walks the hand-authored tutorial chain; everyone else gets the
    // generated map. `tutorialDone` lives in the persisted UnlockState.
    const [mapNodes, setMapNodes] = useState<MapNode[]>(
        loadUnlockState().tutorialDone ? GENERATE_MAP(loadUnlockState().bossesBeaten.length) : GENERATE_TUTORIAL_MAP()
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
     * The sector gift waiting to be announced — set by visitSector, drained by the toast.
     * Hook-local React state, NOT GameState: it is a one-shot announcement, and a saved
     * snapshot must never be able to replay it.
     */
    const [sectorGift, setSectorGift] = useState<{ itemId: string } | null>(null);
    const clearSectorGift = () => setSectorGift(null);

    /**
     * FIRST FOOTSTEP ON NEW GROUND. Marks the sector visited for the whole save, and — if
     * the ground teaches a tool (data/items.ts SECTOR_ITEM) — permanently unlocks that item
     * and pockets one free copy for the run that walked in. Idempotent: old ground pays
     * nothing, which is also what keeps the legacy-save migration (utils/persistence.ts)
     * from showering a veteran with nine toasts.
     *
     * Called from selectNode for ordinary ground and from App for the Breach's door
     * ('BREACH' — a run mode, not a WorldType, so no map node can carry it).
     */
    const visitSector = (sector: string) => {
        if ((unlocksRef.current.sectorsVisited ?? []).includes(sector)) return;
        commitUnlocks(withSectorVisited(unlocksRef.current, sector));
        const gifted = SECTOR_ITEM[sector as keyof typeof SECTOR_ITEM];
        if (gifted) {
            setGameState(prev => ({ ...prev, inventory: [...prev.inventory, gifted] }));
            setSectorGift({ itemId: gifted });
        }
    };

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

    /**
     * The level ceiling for a save: one level per pairing that exists for the heroes it owns.
     * Derived, never stored — adding a hero or a plant moves it on its own.
     */
    const capOf = (state: UnlockState) => levelCapFor(state.heroes.length, STARTING_MATERIALS.length);

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
     * DEBUG: hand the save everything, or take it all back.
     *
     * Both go through `commitUnlocks`, the single write point, so the panel cannot invent a
     * shape the loader would reject — and the award queue fires exactly as it does on a real
     * unlock, which is the point: this is also how the unlock POPUPS get tested.
     */
    const unlockEverything = () => {
        const heroes = Object.keys(HERO_DEFINITIONS) as HeroId[];
        const materials = [...STARTING_MATERIALS];
        const recipes: string[] = [];
        heroes.forEach(h => materials.forEach(m => recipes.push(recipeKey(h, m))));
        commitUnlocks({
            ...unlocksRef.current,
            heroes,
            materials,
            recipes,
            // Every ground walked too, so the whole item catalogue opens with the roster.
            sectorsVisited: Object.keys(SECTOR_ITEM),
            // Enough XP to sit at the ceiling the roster allows. Not Infinity: levelOf caps
            // against it and a non-finite XP would render as "NaN" on the map header.
            xp: XP_PER_LEVEL * capOf({ ...unlocksRef.current, heroes, materials }),
            bossesBeaten: BOSSES.map(b => b.id),
            bossesDefeated: BOSSES.length,
            tutorialDone: true,
        });
    };

    /** Back to a fresh save, without touching the run in progress. */
    const resetProgress = () => commitUnlocks(defaultUnlockState());

    /**
     * Everything leaving a node is worth, as a pure function of the current progress.
     *
     * ONE function, used by both the preview and the commit. The victory screen has to show
     * the rewards BEFORE they are paid — `completeLevel` only runs when the player clicks
     * Continue — and the previous approach to that problem (`previewRewards`, a hand-copied
     * twin of the Coin maths) is exactly the kind of duplicate that drifts. Unlocks get one
     * source of truth instead: preview diffs against it, commit writes it.
     *
     * Two things happen here, and only one of them is a payout:
     *   every fight  -> bonus objectives are TALLIED (banked on the run, nothing granted)
     *   the run ends -> that tally, the depth and the boss become XP, and XP becomes levels
     *
     * Nothing unlocks mid-run any more. That is the point of the level: it is paid by the
     * RESULT of a run, so there is one moment where progress lands and one number that
     * explains it, instead of a recipe appearing after a good fight for reasons the player
     * could not name.
     */
    const projectUnlocks = (node: MapNode | undefined, runEnded = false): UnlockState => {
        const current = unlocksRef.current;
        if (!node) return current;
        let next = current;
        // Clearing the boss ends the run. Running out of brains does too, and that path
        // comes in through `recordRunLost` below rather than through a node.
        //
        // `endsRun: false` means "a boss, but not the door out" — the Breach's nine corridor
        // fights, and acts one and two of an ordinary three-act run.
        const endsRun = runEnded || (node.type === 'BOSS' && node.endsRun !== false);

        // EVERY boss banks the moment it falls, whether or not it ends the run. `RunResult`
        // has always described it that way — "each boss is banked the moment it falls, so
        // dying in act three still keeps what acts one and two paid" — and until a run had
        // three bosses in it there was no way to tell the difference. Now there is: without
        // this, clearing act 1 and dying in act 2 would pay nothing for act 1.
        //
        // Idempotent by construction (`withBossDefeated` returns the same state for a boss
        // already in the list), which is what makes the Breach's re-kills cost nothing.
        if (node.type === 'BOSS') {
            const boss = node.bossId ?? nextUnbeatenBoss(next.bossesBeaten);
            if (boss) next = withBossDefeated(next, boss);
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

        // The third argument is "did a boss fall", and it can only be true on the node that
        // both is a boss and closes the run — otherwise it is the brains-lost path arriving
        // here on some ordinary battle node.
        if (endsRun) next = withRunPayout(next, node, node.type === 'BOSS' && node.endsRun !== false);
        return next;
    };

    /**
     * The whole meta-progression payout, in one place: turn a finished run into XP, turn the
     * XP into levels, and hand over what those levels are worth.
     *
     * `deepestChapter` is read BEFORE it is updated — the record bonus is paid for beating
     * your own best, so it has to be measured against the old number.
     */
    const withRunPayout = (state: UnlockState, node: MapNode | undefined, bossDefeated: boolean): UnlockState => {
        const layer = node ? Math.floor(layerOfNode(node, mapNodes)) : 0;
        const layers = Number.isFinite(layer) ? Math.max(0, layer) : 0;

        const result: RunResult = {
            layers,
            objectives: state.bonusObjectivesBanked,
            // Every act this run put down, not just the last one. As a boolean this paid a
            // three-act run exactly what it paid a one-act run — and the field has been called
            // `actsCleared` the whole time, which is what it was always meant to count.
            actsCleared: Math.max(gameState.actsCleared ?? 0, bossDefeated ? 1 : 0),
            recordLayers: Math.max(0, layers - state.deepestChapter),
        };
        const gained = xpForRun(result);

        // The boss is banked FIRST, so the hero it frees widens the roster before the levels
        // are handed out — a boss kill can pay its hero and, in the same breath, release the
        // levels the XP had been sitting on under the old ceiling.
        const before = levelOf(state.xp, capOf(state)).level;
        let next: UnlockState = state;
        if (bossDefeated) {
            const boss = node?.bossId ?? nextUnbeatenBoss(state.bossesBeaten);
            if (boss) next = withBossDefeated(next, boss);
        }
        const after = levelOf(state.xp + gained, capOf(next)).level;

        next = {
            ...next,
            xp: state.xp + gained,
            deepestChapter: Math.max(state.deepestChapter, layers),
            runsWon: state.runsWon + (bossDefeated ? 1 : 0),
            // Spent: they are XP now. The next run starts its own tally.
            bonusObjectivesBanked: 0,
        };
        return withLevelUps(next, before, after);
    };

    /**
     * What the run would be worth if it ended right now. Pure — it reads state and computes,
     * so the victory screen can show the payout before `completeLevel` writes it.
     */
    const runPayoutPreview = (bossDefeated = false): RunPayout => {
        const state = unlocksRef.current;
        const nodeId = gameState.currentLevelId;
        const node = nodeId ? mapNodes.find(n => n.id === nodeId) : undefined;
        const layer = node ? Math.floor(layerOfNode(node, mapNodes)) : 0;
        const layers = Number.isFinite(layer) ? Math.max(0, layer) : 0;
        const result: RunResult = {
            layers,
            objectives: state.bonusObjectivesBanked,
            actsCleared: bossDefeated ? 1 : 0,
            recordLayers: Math.max(0, layers - state.deepestChapter),
        };
        const gained = xpForRun(result);
        const before = levelOf(state.xp, capOf(state)).level;
        // Preview the widened roster too, or the bar would under-report a boss victory.
        const boss = bossDefeated ? nextUnbeatenBoss(state.bossesBeaten) : undefined;
        const freed = boss ? heroForBoss(boss) : undefined;
        const heroesAfter = state.heroes.length + (freed && !state.heroes.includes(freed) ? 1 : 0);
        const after = levelOf(state.xp + gained, levelCapFor(heroesAfter, STARTING_MATERIALS.length));
        return {
            gained, before, after: after.level,
            into: after.into, needed: after.needed, capped: after.capped,
        };
    };

    /**
     * A run ended in defeat. It still pays: DESIGN.md section 7 is explicit that requiring a
     * win would make new players quit before they ever see the depth. Losing at layer seven
     * is worth more than winning nothing, and the level says so.
     *
     * Returns the payout so the defeat screen can show it — the numbers have to be read
     * BEFORE the commit, because committing is what zeroes the run's tally.
     */
    const recordRunLost = (): RunPayout => {
        const payout = runPayoutPreview(false);
        const nodeId = gameState.currentLevelId;
        const node = nodeId ? mapNodes.find(n => n.id === nodeId) : undefined;
        // A real defeat sends one item forward to the next run — the Chrono Echo
        // (utils/persistence.ts). Abandoning never reaches this function at all (App's
        // confirmQuit goes straight to the menu), so quitting cannot farm it.
        if (!gameState.scriptedBattleId) {
            const layer = node ? Math.floor(layerOfNode(node, mapNodes)) : 0;
            saveChronoEcho({ layers: Number.isFinite(layer) ? Math.max(0, layer) : 0 });
        } else if (!unlocksRef.current.tutorialDone) {
            // The tutorial's scripted defeat pays one out too — board 7's whole lesson is
            // "a real loss is not empty-handed", and the first campaign opening with the
            // echo screen is that lesson landing. Starter tier only (`tutorial` caps the
            // offer in App), and only ONCE: tutorialDone is set when the chain ends, so
            // "Chơi lại hướng dẫn" replays the fight but never re-mints the gift.
            saveChronoEcho({ layers: 0, tutorial: true });
        }
        commitUnlocks(withRunPayout(unlocksRef.current, node, false));
        // The build dies with the run. Nothing reads it after this point, but leaving it set
        // would mean the next squad screen is picking on top of a dead run's answers.
        setGameState(prev => ({ ...prev, heroElements: {} }));
        return payout;
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
            queued.push(heroSnapshots.current.get(id) ?? freshHero(id, undefined, elementFor(id)));
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

    /**
     * Same, for an act upgrade. A hero killed in the fight that just paid the upgrade is
     * exactly the hero a player most wants to spend it on, and she has no Unit until the next
     * battle rebuilds her — so the snapshot is where it has to land.
     */
    const upgradeQueuedHero = (heroId: HeroId, upgradeId: string): boolean => {
        const snap = heroSnapshots.current.get(heroId);
        if (!snap) return false;
        heroSnapshots.current.set(heroId, applyUpgrade(snap, upgradeId));
        return true;
    };

    const rememberHero = (u: Unit) => {
        if (isHeroUnit(u)) heroSnapshots.current.set(u.heroId as HeroId, u);
    };

    /**
     * Call when a new run begins so the previous run's heroes cannot leak into it.
     *
     * `heroElements` is opened here and nowhere else, which is what makes it run-scoped: the
     * squad screen is the only place the choice is made, so this is the only place it can be
     * written. Every road into a run passes through here — including the tutorial, which calls
     * `registerSquad([])` and therefore correctly starts elementless.
     */
    const registerSquad = (heroIds: HeroId[], heroElements: Partial<Record<HeroId, ElementId>> = {}) => {
        heroSnapshots.current.clear();
        pendingRevives.current.clear();
        setGameState(prev => ({ ...prev, pendingRevives: [], heroElements }));
        brainsAtLevelStart.current = gameState.brainsMax;
        void heroIds;
    };

    /** The element this run gave a hero, or undefined for the base form. */
    const elementFor = (heroId: HeroId | undefined): ElementId | undefined =>
        heroId ? (gameState.heroElements ?? {})[heroId] : undefined;

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

        /**
         * THE CRATE PAYS OUT.
         *
         * Read off the live unit list rather than off a flag set during the fight: the crate is
         * a body, so "did it survive" is the same question as "is it still there", and asking
         * the board means no bookkeeping can drift out of sync with what the player watched.
         *
         * `addBenchPlant` refuses when the bench is full, and that refusal is left alone. A
         * full bench is a decision the player made, and quietly evicting something to make room
         * for a reward would spend a plant they were saving.
         */
        if (gameState.mission?.objective === 'ESCORT_GEAR' && gameState.mission.gearMaterial) {
            const crate = units.find(u => !u.isEnemy && u.hp > 0 && u.class === UnitClass.GEAR_CRATE);
            if (crate) {
                addBenchPlant(gameState.mission.gearMaterial);
            }
        }

        // Bonus objectives replace the old flat "no brain lost" bonus — that condition is now
        // one of the bonuses the mission may or may not have rolled.
        // Coin only here. Bonus objectives also pay cross-run progress (fusion recipes), but
        // that half is applied by `projectUnlocks` above — counting it in both places would
        // award every objective twice.
        earnedBonuses(gameState.mission, brainsLost, heroesDown).forEach(b => { reward += b.coins; });

        // Wagered at an event ("taunt Blightlord"), paid only on a won fight. Losing never
        // reaches here, so the wager is forfeit.
        if (isFight) reward += gameState.nextBattleMods?.coinOnWin || 0;

        /**
         * THE ACT CUT.
         *
         * An act is a whole map, and clearing its boss lays down the next act's map rather
         * than ending the run — Slay the Spire's shape. Everything the run owns crosses over
         * untouched, because none of it lives in `mapNodes`: the squad and its wounds are in
         * `units`, the Coin, bench, inventory and brains are in `gameState`, and the fusions
         * ride on the heroes themselves.
         *
         * NOT for the Breach, and "is there a next act in this stage" is NOT the test that
         * excludes it: the Breach re-fights all nine campaign bosses, so its Gargantuar is
         * still stage 1 act 1 and would happily ask for a map of Goldacre in the middle of the
         * gauntlet.
         *
         * The test is whether this boss is the END OF ITS MAP. An act's boss is the last node
         * there is (`next` is empty); every Breach boss has a camp waiting after it. That is
         * exactly the distinction — a map that continues does not need a successor.
         */
        const endOfMap = completedNodeType === 'BOSS' && finishedNode?.next.length === 0;
        const clearedAct = endOfMap && finishedNode?.bossId ? bossById(finishedNode.bossId) : undefined;
        const nextAct = clearedAct && clearedAct.stage !== 0
            ? actsOfStage(clearedAct.stage as 1 | 2 | 3).find(b => b.act === clearedAct.act + 1)
            : undefined;
        if (nextAct) {
            setMapNodes(GENERATE_MAP(unlocksRef.current.bossesBeaten.length, nextAct.stage - 1, nextAct.id));
        }

        setGameState(prev => ({
            ...prev,
            coins: prev.coins + reward,
            nextBattleMods: isFight ? {} : prev.nextBattleMods,
            // AN ACT PAYS AN UPGRADE. One per boss, banked as a count rather than resolved
            // here, because which hero gets it is the player's decision and this function is
            // not a screen. The Breach hands out nine of these before the Blightlord, which is
            // exactly enough to finish all three heroes (data/heroUpgrades.ts).
            upgradePicks: (prev.upgradePicks ?? 0) + (completedNodeType === 'BOSS' ? 1 : 0),
            actsCleared: (prev.actsCleared ?? 0) + (completedNodeType === 'BOSS' ? 1 : 0),
            ...(nextAct
                ? {
                    actIntro: nextAct.id,
                    // The node that was just cleared belongs to a map that no longer exists.
                    currentLevelId: null,
                }
                : {}),
        }));
        return reward;
    };

    const rollGear = (): MaterialId[] => {
        const state = unlocksRef.current;
        const pool = [...(state.materials.length ? state.materials : STARTING_MATERIALS)];
        const picked: MaterialId[] = [];
        while (picked.length < SHOP_OFFER_COUNT && pool.length > 0) {
            picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        }
        return picked;
    };

    /**
     * @param debug Dev travel: enter the node without consuming the run's branch choice.
     *              The node is force-unlocked and no sibling is marked SKIPPED, so the map
     *              stays intact and you can keep hopping around it.
     */
    const selectNode = (node: MapNode, benchToDeploy?: BenchPlant[], debug = false) => {
        // New ground pays its tool on ENTRY, not on map generation — a map merely showing
        // a sector is not the same as walking it. Tutorial nodes are excluded: the scripted
        // chain owns its inventory beat for beat, and a surprise magnet in the item belt
        // would desync the very tutorial that teaches items.
        if (node.world && !node.tutorialId) visitSector(node.world);
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
        } else if (node.type === 'CAMPFIRE' && node.paidCamp) {
             // THE BREACH'S CAMP. Everything is for sale and nothing is picked for you — see
             // MapNode.paidCamp for why this is a different economy from a stage run's rest.
             //
             // Both shelves are rolled ON ARRIVAL and stored, for the same reason the shop's
             // are: rolling during render would deal a new hand on every state change, and the
             // player would watch the thing they were about to buy turn into something else.
             // Only ground already walked stocks the shelf (utils/unlockLogic.ts) — the
             // Breach demands all nine bosses, so in practice this is the full catalogue
             // plus the Doom-shroom the door itself just handed over.
             const pool = unlockedItemIds(unlocksRef.current);
             const items = DEFAULT_ITEM_DEFINITIONS.map(i => i.id).filter(id => pool.has(id));
             const itemShelf: string[] = [];
             while (itemShelf.length < CAMP_ITEM_OFFERS && items.length > 0) {
                 itemShelf.push(items.splice(Math.floor(Math.random() * items.length), 1)[0]);
             }
             setGameState(prev => ({
                 ...prev,
                 screen: 'CAMP',
                 shopItemOffers: itemShelf,
                 // Gear is the run's other half: the Breach has no shop node, so this is the
                 // only place a bench plant can be bought — and a bench plant is what a graft
                 // is made of.
                 shopOffers: rollGear(),
                 shopRerolls: 0,
             }));
        } else if (node.type === 'CAMPFIRE') {
             // An ordinary stage run's rest: the campfire EVENT, one visit and one choice,
             // and some of those choices are free.
             setGameState(prev => ({ ...prev, screen: 'EVENT', currentEventId: 'rest_site' }));
        } else if (node.type === 'EVENT') {
             // Stakes scale with depth, then prefer one this run has not shown yet. Without
             // the second filter a three-EVENT route could roll the same encounter three
             // times, which reads as a bug rather than as variety.
             const allowed = tiersForLayer(layerOfNode(node, mapNodes));
             // No rest_site exclusion any more: the campfire is its own screen, so every
             // event left in the table is a random-pool event by definition.
             const pool = GAME_EVENTS.filter(e => allowed.includes(e.tier ?? 1));
             const seen = gameState.seenEvents || [];
             const fresh = pool.filter(e => !seen.includes(e.id));
             // Each fallback is one step wider, so an exhausted tier still yields something
             // rather than dropping the player onto a blank screen.
             const candidates = fresh.length > 0
                 ? fresh
                 : (pool.length > 0 ? pool : GAME_EVENTS);
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
        setMapNodes(GENERATE_MAP(unlocksRef.current.bossesBeaten.length));
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
        // Same resolution the reward path uses (`completeLevel`): the node names its boss when
        // it has one, otherwise it is whichever boss the campaign owes you next. Passing it here
        // is what puts the fight on the arena instead of a random board of the right sector.
        const boss = node.type === 'BOSS'
            ? (node.bossId ?? nextUnbeatenBoss(unlocksRef.current.bossesBeaten))
            : undefined;
        const newBoard = script ? tutorialBoard(script) : generateBoard(node.world, boss);
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
        const { enemies: rolledEnemies, allies: rolledAllies, deployTiles } =
            buildEncounter(node, newBoard, depth, unitDefs, terrainDefs, mods, boss);

        /**
         * The mission is decided BEFORE the units are built, which is a change of order and a
         * deliberate one: ESCORT_GEAR names the tile its crate stands on, and the crate is a
         * unit. Built afterwards, as it used to be, the objective would have had to reach back
         * into a list that had already been handed to React.
         *
         * Nothing else moved. `buildMission` reads only the node, the board and the rolled
         * wave, all of which exist by this line.
         */
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
            // The rolled wave goes in because SLAY_BOSS may only be offered when a boss is
            // standing in it — see buildMission.
            : buildMission(node.type, newBoard, isFirstLevel, rolledEnemies);

        // The crate itself, if this fight has one. A body like any other, on the player's side,
        // carrying the material the objective promised.
        const gearUnits: Unit[] = [];
        if (!script && mission.objective === 'ESCORT_GEAR' && mission.target) {
            const crateDef = unitDefs[UnitClass.GEAR_CRATE];
            if (crateDef) {
                gearUnits.push({
                    id: `gear_${node.id}`,
                    type: UnitType.PLANT, class: UnitClass.GEAR_CRATE, role: 'TACTICAL',
                    hp: crateDef.maxHp, maxHp: crateDef.maxHp, damage: 0, moveRange: 0,
                    cooldownReduction: 0, level: 1, position: { ...mission.target },
                    isEnemy: false, hasMoved: true, hasAttacked: true, statusEffects: [],
                    movementType: crateDef.movementType, immunities: crateDef.immunities,
                    imgUrl: crateDef.imgUrl, attackRange: 1,
                    gearMaterial: mission.gearMaterial,
                } as Unit);
            }
        }

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
                        const base = prev
                            ? buildHeroFromSnapshot(prev, false, elementFor(h))
                            : freshHero(h, `tut-${h}-${idx}`, elementFor(h));
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
                    // The run's map is handed to EVERY rebuild, not just the ones that lack an
                    // element: it is the authority on what this hero carries, and the factory
                    // treats "the element she already has" as a no-op. That is what lets a body
                    // restored from a pre-element save still take the shape the run says it has.
                    heroUnits.push(buildHeroFromSnapshot(u, false, elementFor(hid)));
                });

            // Heroes revived at a Campfire / chapter end have no Unit left — rebuild them,
            // at full hp: the snapshot was taken at (or near) the moment they fell.
            pendingRevives.current.forEach(hid => {
                if (seen.has(hid) || fallen.includes(hid)) return;
                const snap = heroSnapshots.current.get(hid);
                seen.add(hid);
                // No snapshot means a reload wiped it, so the body is rebuilt from the sheet —
                // and the run's element has to be handed back with it, or a revived hero would
                // silently return in her base form after the player already paid the health.
                heroUnits.push(snap
                    ? buildHeroFromSnapshot(snap, true, elementFor(hid))
                    : freshHero(hid, undefined, elementFor(hid)));
            });
            pendingRevives.current.clear();
            queueConsumed = true;

            // Legacy squads created before heroes existed: keep them so nothing disappears.
            const legacyUnits = prevUnits
                // `isBattleOnlyUnit` keeps the crate and the wild plant out. They match every
                // other clause here — player side, PLANT, not a hero, no materialId — so the
                // legacy-squad rescue adopted them, and with a hero down they took the open
                // slot a bench plant should have had.
                .filter(u => !u.isEnemy && u.type === UnitType.PLANT && !isHeroUnit(u)
                    && !u.materialId && !isBattleOnlyUnit(u))
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

            // Wild plants and the gear crate are neither squad nor wave. They go in last and
            // are never recorded in `benchDeployedRef`, so the end-of-battle ledger cannot
            // charge the player for a body they did not buy.
            return [...roster, ...benchUnits, ...gearUnits, ...rolledAllies, ...rolledEnemies];
        });

        setBoard(newBoard);

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
                // A boss node runs on its own clock — see BOSS_MAX_TURNS in constants.ts for
                // the measurement. Event terms still shift it, so "one more turn" is worth the
                // same anywhere.
                maxTurns: script
                    ? script.maxTurns
                    : Math.max(3, (node.type === 'BOSS'
                        ? (boss === 'BLIGHTLORD' ? BREACH_MAX_TURNS : BOSS_MAX_TURNS)
                        : BASE_MAX_TURNS) + (mods.turns || 0)),
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
                /**
                 * RESET, for the same reason the spawn queue above is reset — and it was the
                 * one field of the pair that got missed.
                 *
                 * A hazard telegraph is planned at the END of a turn and fired at the START of
                 * the next, so a battle that ends on the wrong beat leaves one pending. Nothing
                 * cleared it, so it survived into the NEXT fight and PHASE 0 fired it on that
                 * battle's first enemy turn — tiles picked from a board that no longer exists,
                 * and a hazard belonging to a sector the player may have left.
                 *
                 * It did not stay harmless once the last two hazards landed: TIDE turns the
                 * tiles it names into open water and drowns whatever cannot swim, and COLLAPSE
                 * walls them for good. Both, on turn one, chosen against someone else's map.
                 */
                hazard: null,
                interactionMode: 'PLACEMENT',
                selectedUnitId: null,
                // Fresh ledger for a fresh fight — the boss report must never carry a line
                // from the battle before it.
                battleStats: {}
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
        runPayoutPreview,
        recordRunLost,
        // --- sector item unlocks ---
        sectorGift,
        clearSectorGift,
        visitSector,
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
        // --- debug (DebugPanel) ---
        unlockEverything,
        resetProgress,
        // --- new: cross-run unlock progress (persisted) ---
        unlocks,
        pendingUnlocks,
        clearPendingUnlocks,
        addBenchPlant,
        removeBenchPlant,
        fusableHeroes,
        fuseQueuedHero,
        upgradeQueuedHero,
        benchSpaceRemaining,
    };
};
