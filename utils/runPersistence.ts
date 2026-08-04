import { GameState, MapNode, Unit, UnitType } from '../types';

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
 */

const RUN_KEY = 'pitb_run_v1';

export interface SavedRun {
    version: 1;
    gameState: GameState;
    units: Unit[];
    mapNodes: MapNode[];
}

/** Screens with no battle in progress — the only moments a snapshot is coherent. */
const SAFE_SCREENS: ReadonlyArray<GameState['screen']> = ['MAP', 'SHOP', 'EVENT'];

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
            .filter(u => u.type === UnitType.PLANT)
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
                visualOffset: undefined,
                spawnDelay: undefined,
            }));
        const payload: SavedRun = { version: 1, gameState: cleanState, units: cleanUnits, mapNodes };
        localStorage.setItem(RUN_KEY, JSON.stringify(payload));
    } catch {
        // Storage full/blocked: the run just is not resumable. Never break the game for it.
    }
};

export const loadRunState = (): SavedRun | null => {
    try {
        const json = localStorage.getItem(RUN_KEY);
        if (!json) return null;
        const saved = JSON.parse(json);
        if (saved?.version !== 1) return null;
        if (!saved.gameState || !Array.isArray(saved.units) || !Array.isArray(saved.mapNodes)) return null;
        return saved as SavedRun;
    } catch {
        return null;
    }
};

export const clearRunState = () => {
    try { localStorage.removeItem(RUN_KEY); } catch {}
};

export const hasSavedRun = (): boolean => loadRunState() !== null;
