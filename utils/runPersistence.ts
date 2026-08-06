import { aliasHeroId, aliasClassId, aliasBossId, aliasItemId } from './idAliases';
import { GameState, MapNode, Unit, UnitType } from '../types';
import { HERO_DEFINITIONS } from '../data/heroes';
import { getFusionEffectValue } from './fusion';
import { isBattleOnlyUnit } from './unitFactory';
import { ELEMENT_HP_COST } from './elements';

/**
 * RUN PERSISTENCE — survives a page reload mid-run.
 *
 * Before this existed, gameState/units/mapNodes lived only in React state: an accidental
 * F5 between battles threw away the whole run (map progress, Coin, bench, heroes and
 * their fusions). This module snapshots the run at SAFE points only — the map, the shop,
 * an event — never mid-battle. A battle interrupted by a reload is simply not resumed:
 * the run restarts from the map with the state it had when that battle began... minus the
 * battle node, which stays available to try again.
 *
 * What is deliberately NOT saved:
 *   - combat state (board, enemies, turn) — resuming a half-played tactics turn correctly
 *     is a project of its own, and restarting the fight is fair;
 *   - the useGameProgression heroSnapshots ref — alive heroes are in `units`; only a
 *     FALLEN hero's fusion list is lost across a reload (revive then restores base stats).
 *
 * `gameState.heroElements` rides along inside the snapshot and is NOT optional to keep: the
 * element was bought with max HP at the squad screen, and a reload that dropped the map would
 * hand every hero back her base form while the health stayed spent. A fallen hero rebuilt by
 * `freshHero` after a reload reads her element from exactly this map.
 */

const RUN_KEY = 'pitb_run_v1';

export interface SavedRun {
    version: 1;
    gameState: GameState;
    units: Unit[];
    mapNodes: MapNode[];
}

/** Screens with no battle in progress — the only moments a snapshot is coherent. */
const SAFE_SCREENS: ReadonlyArray<GameState['screen']> = ['MAP', 'SHOP', 'CAMP', 'EVENT'];

/** No-op outside safe screens, so the caller can just invoke it on every state change. */
export const saveRunState = (gameState: GameState, units: Unit[], mapNodes: MapNode[]) => {
    if (!SAFE_SCREENS.includes(gameState.screen)) return;
    try {
        const cleanState: GameState = {
            ...gameState,
            // Restore always lands on the map: an event/shop half-read is re-enterable there.
            screen: 'MAP',
            currentEventId: undefined,
            selectedUnitId: null,
            selectedTile: null,
            interactionMode: 'IDLE',
            selectedSkillId: null,
            selectedItemId: null,
            damageEvents: [],
            shake: false,
            showAdmin: false,
            spawnPoints: [],
            enemySpawnQueue: [],
        };
        // Only the player's roster persists; enemies never outlive a battle.
        // Per-battle flags are scrubbed the same way the hero revive snapshot does.
        const cleanUnits = units
            // The gear crate and any wild plant are battle furniture, not squad — see
            // `isBattleOnlyUnit`. Saved, they would come back on the map screen as members of
            // the roster and stay there for the rest of the run.
            .filter(u => u.type === UnitType.PLANT && !isBattleOnlyUnit(u))
            .map(u => ({
                ...u,
                position: { x: -1, y: -1 },
                prevPosition: undefined,
                hasMoved: false,
                hasAttacked: false,
                statusEffects: [],
                intent: undefined,
                shield: 0,
                digestingTurns: 0,
                isDying: false,
                isAttacking: false,
                isHitFlashing: false,
                visualOffset: undefined,
                spawnDelay: undefined,
            }));
        const payload: SavedRun = { version: 1, gameState: cleanState, units: cleanUnits, mapNodes };
        localStorage.setItem(RUN_KEY, JSON.stringify(payload));
    } catch {
        // Storage full/blocked: the run just is not resumable. Never break the game for it.
    }
};

/**
 * Re-derive every hero's HP ceiling from the CURRENT definitions.
 *
 * Max HP is a balance number, and balance numbers move — they were doubled once already
 * (data/heroes.ts, PLAN-boards-bosses.md section 6). A run saved before such a change carries
 * the old ceiling, so the squad would come back from a reload at 3/6 with nothing on screen
 * explaining why. Worse, it is silent: nothing crashes, the run is just quietly harder.
 *
 * The expected ceiling is the definition plus whatever BONUS_HP fusions added, because
 * `applyFusion` bakes that straight into maxHp — MINUS the element's price, which is the one
 * subtraction anything rebuilding a ceiling from the sheet has to remember (utils/unitFactory:
 * "the cost is subtracted from a definition's maxHp"). Without it this function would hand
 * back the point of health the player paid for at the squad screen on every single reload,
 * while the element itself stayed on the unit: a free element, granted by pressing F5.
 *
 * When the ceiling has moved the hero is topped up rather than scaled: a save that predates a
 * balance change should not be a punishment for having been mid-run when it landed.
 */
const migrateHeroHp = (units: Unit[]): Unit[] => units.map(u => {
    if (!u.isHero || !u.heroId) return u;
    const def = HERO_DEFINITIONS[u.heroId];
    if (!def) return u;
    const expected = Math.max(
        1,
        def.maxHp + getFusionEffectValue(u, 'BONUS_HP') - (u.element ? ELEMENT_HP_COST : 0),
    );
    if (expected === u.maxHp) return u;
    return { ...u, maxHp: expected, hp: expected };
});

export const loadRunState = (): SavedRun | null => {
    try {
        const json = localStorage.getItem(RUN_KEY);
        if (!json) return null;
        const saved = JSON.parse(json);
        if (saved?.version !== 1) return null;
        if (!saved.gameState || !Array.isArray(saved.units) || !Array.isArray(saved.mapNodes)) return null;
        const run = saved as SavedRun;
        // ID MIGRATION (NAMING.md Phase 2, 2026-08-06): snapshot cũ mang id cũ trong
        // class/heroId/skills/inventory/heroElements/fallenHeroes/bossId. Dịch ngay tại
        // biên nạp, TRƯỚC mọi lookup theo definition — thiếu bước này run đang dở vỡ im lặng.
        const migratedUnits = run.units.map(u => ({
            ...u,
            class: aliasClassId(u.class as unknown as string) as Unit['class'],
            heroId: u.heroId ? aliasHeroId(u.heroId as unknown as string) as Unit['heroId'] : u.heroId,
        }));
        return {
            ...run,
            mapNodes: run.mapNodes.map(n => n.bossId
                ? { ...n, bossId: aliasBossId(n.bossId as unknown as string) as MapNode['bossId'] }
                : n),
            gameState: {
                ...run.gameState,
                inventory: Array.isArray(run.gameState.inventory)
                    ? run.gameState.inventory.map(aliasItemId)
                    : run.gameState.inventory,
                fallenHeroes: Array.isArray(run.gameState.fallenHeroes)
                    ? (run.gameState.fallenHeroes.map(id => aliasHeroId(id as unknown as string)) as GameState['fallenHeroes'])
                    : run.gameState.fallenHeroes,
                // Optional in the snapshot on purpose: a run saved before elements existed has
                // no map at all, and "no map" is exactly the base-form squad it was played as.
                // Materialised to {} here so nothing downstream has to guard the lookup.
                heroElements: Object.fromEntries(
                    Object.entries(run.gameState.heroElements ?? {}).map(([k, v]) => [aliasHeroId(k), v]),
                ) as GameState['heroElements'],
            },
            /**
             * Scrubbed on the way IN as well as on the way out.
             *
             * `saveRunState` stopped writing the gear crate and wild plants, but a save made
             * before that fix already has them, and a save is exactly the thing that outlives
             * the bug that made it. Filtering on load is what makes those runs recover rather
             * than carry a box around for the rest of the game.
             */
            units: migrateHeroHp(migratedUnits.filter(u => !isBattleOnlyUnit(u))),
        };
    } catch {
        return null;
    }
};

export const clearRunState = () => {
    try { localStorage.removeItem(RUN_KEY); } catch {}
};

export const hasSavedRun = (): boolean => loadRunState() !== null;
