import { UnitClass, UnitDefinition, Skill, TerrainDefinition, ItemDefinition, UnlockState, BossId, HeroId, MaterialId } from '../types';
import { DEFAULT_UNIT_DEFINITIONS, UNIT_SKILLS, DEFAULT_TERRAIN_DEFS, DEFAULT_ITEM_DEFINITIONS } from '../constants';
import { HERO_DEFINITIONS, STARTING_HEROES } from '../data/heroes';
import {
    startingRecipes, BOSSES, XP_PER_LAYER, XP_PER_BONUS_OBJECTIVE, XP_PER_ACT,
} from '../data/unlocks';
import { MATERIAL_DEFINITIONS, STARTING_MATERIALS } from '../data/materials';
import { STAGE_SECTORS } from './mapGenerator';

const STORAGE_KEY = 'pitb_config_v1';

/**
 * Player progress lives in its OWN key, deliberately separate from the Admin config above.
 * Admin config is development data and may be wiped at any time; unlock progress is the
 * player's and losing it loses their trust (DESIGN.md section 7).
 */
const PROGRESS_KEY = 'pitb_progress_v1';

export interface GameConfig {
    unitDefs: Record<UnitClass, UnitDefinition>;
    skillDefs: Record<UnitClass, Skill[]>;
    terrainDefs: Record<string, TerrainDefinition>;
    itemDefs: ItemDefinition[];
}

export const saveConfigToStorage = (config: GameConfig) => {
    try {
        const json = JSON.stringify(config);
        localStorage.setItem(STORAGE_KEY, json);
        console.log("Config saved to local storage.");
    } catch (e) {
        console.error("Failed to save config:", e);
    }
};

export const loadConfigFromStorage = (): GameConfig | null => {
    try {
        const json = localStorage.getItem(STORAGE_KEY);
        if (json) {
            const saved = JSON.parse(json);
            
            // Merge Unit Definitions carefully
            const mergedUnitDefs: Record<UnitClass, UnitDefinition> = { ...DEFAULT_UNIT_DEFINITIONS };
            
            if (saved.unitDefs) {
                Object.keys(saved.unitDefs).forEach(key => {
                    const k = key as UnitClass;
                    const savedDef = saved.unitDefs[k];
                    const defaultDef = DEFAULT_UNIT_DEFINITIONS[k];
                    
                    if (defaultDef && savedDef) {
                        // Check if saved image is potentially broken (old wikia or placeholder if we want to migrate away)
                        const isBroken = savedDef.imgUrl && (
                            savedDef.imgUrl.includes('static.wikia.nocookie.net') || 
                            savedDef.imgUrl.includes('placehold.co')
                        );

                        mergedUnitDefs[k] = {
                            ...defaultDef,
                            ...savedDef,
                            // If the saved URL is broken, revert to the new default (SVG), otherwise keep saved user custom URL
                            imgUrl: isBroken ? defaultDef.imgUrl : savedDef.imgUrl,
                            // Display text always comes from the current defaults: the i18n
                            // dictionary is keyed by the exact English source strings, so a
                            // stale snapshot would silently stop translating.
                            name: defaultDef.name
                        };
                    } else if (savedDef) {
                        mergedUnitDefs[k] = savedDef;
                    }
                });
            }

            // Also fix item URLs if needed
            let mergedItemDefs = saved.itemDefs || DEFAULT_ITEM_DEFINITIONS;
            if (saved.itemDefs) {
                 mergedItemDefs = (saved.itemDefs as ItemDefinition[]).map(item => {
                     const defaultItem = DEFAULT_ITEM_DEFINITIONS.find(d => d.id === item.id);
                     if (defaultItem) {
                         const isBroken = item.imgUrl && (
                             item.imgUrl.includes('static.wikia.nocookie.net') || 
                             item.imgUrl.includes('placehold.co')
                         );
                         if (isBroken) {
                             return { ...item, imgUrl: defaultItem.imgUrl };
                         }
                     }
                     return item;
                 });
            }

            // Saved snapshots keep their numeric tweaks, but display text (names and
            // descriptions) is always refreshed from the current defaults — the i18n
            // dictionary is keyed by the exact English source strings, so stale copy
            // from an old build would silently stop translating.
            let mergedSkillDefs: Record<UnitClass, Skill[]> = saved.skillDefs || UNIT_SKILLS;
            if (saved.skillDefs) {
                mergedSkillDefs = { ...UNIT_SKILLS };
                (Object.keys(saved.skillDefs) as UnitClass[]).forEach(cls => {
                    const defaults = UNIT_SKILLS[cls] || [];
                    mergedSkillDefs[cls] = (saved.skillDefs[cls] as Skill[]).map(skill => {
                        const def = defaults.find(d => d.id === skill.id);
                        return def ? { ...skill, name: def.name, description: def.description } : skill;
                    });
                });
            }

            let mergedTerrainDefs: Record<string, TerrainDefinition> = saved.terrainDefs || DEFAULT_TERRAIN_DEFS;
            if (saved.terrainDefs) {
                mergedTerrainDefs = {};
                // Union of both key sets, so a terrain type added to the defaults after this
                // config was saved still reaches the game instead of silently going missing.
                const keys = new Set([...Object.keys(DEFAULT_TERRAIN_DEFS), ...Object.keys(saved.terrainDefs)]);
                keys.forEach(key => {
                    const def = DEFAULT_TERRAIN_DEFS[key];
                    const savedDef = saved.terrainDefs[key];
                    if (!savedDef) { mergedTerrainDefs[key] = def; return; }
                    mergedTerrainDefs[key] = def
                        // name/description are i18n keys and textureUrl is an art path: all three
                        // are authored in code, never in the admin screen, so the defaults win.
                        // Without this a stale save pins the terrain to the old flat colours.
                        ? { ...savedDef, name: def.name, description: def.description, textureUrl: def.textureUrl }
                        : savedDef;
                });
            }

            mergedItemDefs = (mergedItemDefs as ItemDefinition[]).map(item => {
                const def = DEFAULT_ITEM_DEFINITIONS.find(d => d.id === item.id);
                return def ? { ...item, name: def.name, description: def.description } : item;
            });

            return {
                unitDefs: mergedUnitDefs,
                skillDefs: mergedSkillDefs,
                terrainDefs: mergedTerrainDefs,
                itemDefs: mergedItemDefs
            };
        }
    } catch (e) {
        console.error("Failed to load config:", e);
    }
    return null;
};

// ---------------------------------------------------------------------------
// PLAYER PROGRESS  (unlocked heroes / materials, run statistics)
// ---------------------------------------------------------------------------

export const defaultUnlockState = (): UnlockState => ({
    heroes: [...STARTING_HEROES],
    materials: [...STARTING_MATERIALS],
    xp: 0,
    deepestChapter: 0,
    bossesBeaten: [],
    runsWon: 0,
    bossesDefeated: 0,
    bonusObjectivesDone: 0,
    bonusObjectivesBanked: 0,
    recipes: startingRecipes(STARTING_HEROES),
    sectorsVisited: [],
});

/**
 * A legacy save carries no footstep list, but a beaten boss PROVES its ground was walked
 * (stage+act names the sector — utils/mapGenerator.ts), and any boss at all proves GRASS
 * was. Marking without gifting is the point: the sector item unlocks quietly for ground
 * already covered, and the "new land" gift moment stays reserved for genuinely new ground.
 */
const sectorsFromBosses = (beaten: BossId[]): string[] => {
    const sectors = new Set<string>();
    if (beaten.length > 0) sectors.add('GRASS');
    beaten.forEach(id => {
        const b = BOSSES.find(x => x.id === id);
        const world = b ? STAGE_SECTORS[b.stage - 1]?.[b.act - 1] : undefined;
        if (world) sectors.add(world);
    });
    return [...sectors];
};

/** Keeps only ids that still exist in the data tables, then guarantees the starting set. */
const mergeIds = <T extends string>(
    saved: unknown,
    known: object,
    starting: T[],
): T[] => {
    const fromSave = Array.isArray(saved)
        ? (saved as unknown[]).filter((id): id is T => typeof id === 'string' && id in known)
        : [];
    return Array.from(new Set<T>([...starting, ...fromSave]));
};

/**
 * Rebuilds a level for a save made before levels existed, from the counters that used to
 * drive the three separate payouts. Deliberately generous: under-crediting would look like
 * progress had been taken away, which is the one migration failure a player notices.
 */
const xpFromLegacyCounters = (saved: any): number =>
    toCount(saved?.deepestChapter) * XP_PER_LAYER
    + toCount(saved?.bonusObjectivesDone) * XP_PER_BONUS_OBJECTIVE
    + toCount(saved?.bossesDefeated) * XP_PER_ACT;

const toCount = (value: unknown): number => {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

export const loadUnlockState = (): UnlockState => {
    try {
        const json = localStorage.getItem(PROGRESS_KEY);
        if (!json) return defaultUnlockState();

        const saved = JSON.parse(json) ?? {};
        // Saves from before named bosses only counted them. Take the first N off the
        // table so the heroes they already own line up with a boss that explains them.
        // Hoisted out of the literal because the sector migration below reads it too.
        const bossesBeaten = Array.isArray(saved.bossesBeaten)
            ? (saved.bossesBeaten as unknown[]).filter((id): id is BossId =>
                  typeof id === 'string' && BOSSES.some(b => b.id === id))
            : BOSSES.slice(0, toCount(saved.bossesDefeated)).map(b => b.id);
        return {
            heroes: mergeIds<HeroId>(saved.heroes, HERO_DEFINITIONS, STARTING_HEROES),
            materials: mergeIds<MaterialId>(saved.materials, MATERIAL_DEFINITIONS, STARTING_MATERIALS),
            // Saves written before the level existed carry no `xp`, but they do carry the
            // three counters it replaced — so the level is rebuilt from them rather than
            // reset to 1. Heroes and recipes already earned are stored explicitly and are
            // never revoked by this, so the worst case is a save that is a little ahead.
            xp: saved.xp === undefined
                ? xpFromLegacyCounters(saved)
                : toCount(saved.xp),
            deepestChapter: toCount(saved.deepestChapter),
            runsWon: toCount(saved.runsWon),
            bossesBeaten,
            bossesDefeated: toCount(saved.bossesDefeated),
            bonusObjectivesDone: toCount(saved.bonusObjectivesDone),
            bonusObjectivesBanked: toCount(saved.bonusObjectivesBanked),
            // Union with the starting set, same as heroes/materials: a save written before
            // recipes existed keeps its progress and simply gains the signature pairings.
            //
            // Filtered by living hero AND living material, for the same reason mergeIds
            // filters both lists: retiring Frostpod left saves holding `COLD_SNAP:MAT_*`
            // keys, and retiring Thornquill + the Cactus/Snow Pea gears left `THORNQUILL:*`
            // and `*:MAT_CACTUS` / `*:MAT_SNOW_PEA` keys the same way. Dead keys are
            // counted, so the Archive read "34/90 recipes" against a roster that can only
            // produce 81 — owned drifting past the total, with nothing on screen to explain.
            recipes: Array.from(new Set([
                ...startingRecipes(STARTING_HEROES),
                ...(Array.isArray(saved.recipes) ? saved.recipes.filter((r: unknown) => typeof r === 'string') : []),
            ])).filter(key => {
                const [hero, material] = String(key).split(':');
                return hero in HERO_DEFINITIONS && material in MATERIAL_DEFINITIONS;
            }) as string[],
            tutorialDone: saved.tutorialDone === true,
            sectorsVisited: Array.isArray(saved.sectorsVisited)
                ? (saved.sectorsVisited as unknown[]).filter((s): s is string => typeof s === 'string')
                : sectorsFromBosses(bossesBeaten),
        };
    } catch (e) {
        console.error("Failed to load progress:", e);
        return defaultUnlockState();
    }
};

export const saveUnlockState = (state: UnlockState) => {
    try {
        // Sanitise on the way out too, so a bad in-memory state never poisons the save.
        const clean: UnlockState = {
            heroes: mergeIds<HeroId>(state?.heroes, HERO_DEFINITIONS, STARTING_HEROES),
            materials: mergeIds<MaterialId>(state?.materials, MATERIAL_DEFINITIONS, STARTING_MATERIALS),
            xp: toCount(state?.xp),
            deepestChapter: toCount(state?.deepestChapter),
            runsWon: toCount(state?.runsWon),
            bossesBeaten: Array.isArray(state?.bossesBeaten)
                ? state.bossesBeaten.filter(id => BOSSES.some(b => b.id === id))
                : [],
            // Always derived, never trusted: one list, one count.
            bossesDefeated: Array.isArray(state?.bossesBeaten) ? state.bossesBeaten.length : 0,
            bonusObjectivesDone: toCount(state?.bonusObjectivesDone),
            bonusObjectivesBanked: toCount(state?.bonusObjectivesBanked),
            recipes: Array.from(new Set([
                ...startingRecipes(STARTING_HEROES),
                ...(Array.isArray(state?.recipes) ? state.recipes.filter((r: unknown) => typeof r === 'string') : []),
            ])) as string[],
            // Was silently stripped here before, which sent every returning player
            // back to the tutorial map after a reload (types.ts marks it persisted).
            tutorialDone: state?.tutorialDone === true,
            sectorsVisited: Array.isArray(state?.sectorsVisited)
                ? state.sectorsVisited.filter((s): s is string => typeof s === 'string')
                : [],
        };
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(clean));
    } catch (e) {
        console.error("Failed to save progress:", e);
    }
};

// Simulate "Database" export (User downloads JSON)
export const exportConfigToJson = (config: GameConfig) => {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pitb_config_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Simulate "Database" import (User uploads JSON)
export const importConfigFromJson = (file: File): Promise<GameConfig> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = e.target?.result as string;
                const config = JSON.parse(json);
                // Basic validation could go here
                resolve(config);
            } catch (err) {
                reject(err);
            }
        };
        reader.readAsText(file);
    });
};

// ---------------------------------------------------------------------------
// CHRONO ECHO — the one gift a LOST run sends forward to the next one.
//
// Its own key, deliberately: it is neither Admin config (wipe-at-will) nor unlock progress
// (must never be lost) — it is a single pending voucher that a defeat writes and the next
// new run consumes. Bundling it into pitb_progress_v1 would put a frequently-rewritten
// flag inside the one blob whose integrity matters most.
//
// Written ONLY by recordRunLost — a real defeat. Abandoning a run (confirmQuit) goes
// straight to the menu without ever showing GAME_OVER, so quitting cannot farm this.
// Cleared when the player takes the offered item at the start of the next run — NOT when
// the offer is shown, so a reload between seeing and choosing postpones the gift instead
// of eating it.

const ECHO_KEY = 'pitb_echo_v1';

export interface ChronoEcho {
    /** How deep the lost run got (map layer). Sets the value cap of the next run's offer. */
    layers: number;
    /**
     * Written by the tutorial's scripted defeat (once, ever): the graduation gift. Caps the
     * offer at the starter tier — the tutorial teaches that defeat pays, it does not fund it.
     */
    tutorial?: boolean;
}

export const saveChronoEcho = (echo: ChronoEcho) => {
    try { localStorage.setItem(ECHO_KEY, JSON.stringify(echo)); } catch {}
};

export const loadChronoEcho = (): ChronoEcho | null => {
    try {
        const raw = localStorage.getItem(ECHO_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return typeof parsed?.layers === 'number'
            ? { layers: parsed.layers, tutorial: !!parsed.tutorial }
            : null;
    } catch {
        return null;
    }
};

export const clearChronoEcho = () => {
    try { localStorage.removeItem(ECHO_KEY); } catch {}
};