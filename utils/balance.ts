import { HERO_DEFINITIONS } from '../data/heroes';
import { MATERIAL_DEFINITIONS } from '../data/materials';
import { DEFAULT_UNIT_DEFINITIONS, UNIT_ROLE_MAP } from '../data/gameData';
import { SUN_ON_LEVEL_START, SUN_PER_TURN_INCOME, COIN_ON_RUN_START } from '../constants';

/**
 * Stat balancing: a flat map of `path -> number`, and nothing else.
 *
 * WHY ONLY NUMBERS. The screen this replaces stored whole objects — names, descriptions,
 * image paths — and that caused two real bugs. A save from an older build silently stopped
 * the Vietnamese translation (the dictionary is keyed by the exact English source string, so
 * stale copy simply misses), and later the same mechanism swallowed the terrain textures.
 * Both needed "always refresh this field from defaults" patches, which is a bug class that
 * regrows every time a new field is added.
 *
 * Storing only numbers ends it. A number cannot go stale against the code: if a field is
 * renamed or removed its override is dropped on load and the default stands.
 *
 * Nothing here is required for the game to run — an empty config means every default applies.
 */

export type BalanceConfig = Record<string, number>;

const STORAGE_KEY = 'pitb_balance_v1';

/** One tunable number, described once so the editor UI can be generated rather than written. */
export interface BalanceField {
    /** Stable id, also the storage key. `hero.GREEN_SHADOW.maxHp`. */
    path: string;
    /** Section heading in the editor. */
    group: string;
    /** Row label. English source string — i18n key. */
    label: string;
    /** The authored value this overrides. */
    def: number;
    min: number;
    max: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

// --- THE REGISTRY ----------------------------------------------------------
// Built from the data tables, so a hero or material added tomorrow appears here with no
// edit. That is the whole reason it is derived rather than hand-listed: the previous screen
// was hand-listed and had drifted years behind the data it claimed to edit.

const heroFields = (): BalanceField[] =>
    Object.values(HERO_DEFINITIONS).flatMap(h => {
        const g = `Hero — ${h.name}`;
        const out: BalanceField[] = [
            { path: `hero.${h.id}.maxHp`, group: g, label: 'Max HP', def: h.maxHp, min: 1, max: 20 },
            { path: `hero.${h.id}.moveRange`, group: g, label: 'Move Range', def: h.moveRange, min: 1, max: 8 },
        ];
        // Skills carry the numbers that actually decide a fight: what a shot does, and what
        // it costs. Unit.damage is only a fallback for units with no authored skill.
        [h.basicAttack, h.heroSkill].forEach(skill => {
            const dmg = skill.effects.find(e => e.type === 'DAMAGE');
            if (dmg) {
                out.push({
                    path: `skill.${skill.id}.damage`, group: g,
                    label: `${skill.name} — Damage`, def: dmg.value ?? 0, min: 0, max: 999,
                });
            }
            const sun = skill.effects.find(e => e.type === 'RESOURCE_GAIN');
            if (sun) {
                out.push({
                    path: `skill.${skill.id}.sunGain`, group: g,
                    label: `${skill.name} — Sun Gained`, def: sun.value ?? 0, min: 0, max: 200,
                });
            }
            if (skill.sunCost) {
                out.push({
                    path: `skill.${skill.id}.sunCost`, group: g,
                    label: `${skill.name} — Sun Cost`, def: skill.sunCost, min: 0, max: 300,
                });
            }
            if (skill.rangeValue !== undefined) {
                out.push({
                    path: `skill.${skill.id}.range`, group: g,
                    label: `${skill.name} — Range`, def: skill.rangeValue, min: 0, max: 8,
                });
            }
        });
        return out;
    });

const unitFields = (): BalanceField[] =>
    Object.values(DEFAULT_UNIT_DEFINITIONS).flatMap(d => {
        // UnitDefinition carries no side flag; the role map is what the rest of the game
        // uses to tell a zombie from a plant.
        const g = UNIT_ROLE_MAP[d.class] === 'ENEMY' ? 'Zombies' : 'Plants';
        return [
            { path: `unit.${d.class}.maxHp`, group: g, label: `${d.name} — HP`, def: d.maxHp, min: 1, max: 30 },
            { path: `unit.${d.class}.damage`, group: g, label: `${d.name} — Damage`, def: d.damage, min: 0, max: 20 },
            { path: `unit.${d.class}.moveRange`, group: g, label: `${d.name} — Move`, def: d.moveRange, min: 0, max: 8 },
        ];
    });

const materialFields = (): BalanceField[] =>
    Object.values(MATERIAL_DEFINITIONS).flatMap(m => {
        const g = 'Bench Plants';
        return [
            { path: `bench.${m.id}.maxHp`, group: g, label: `${m.name} — HP`, def: m.benchStats.maxHp, min: 1, max: 20 },
            { path: `bench.${m.id}.damage`, group: g, label: `${m.name} — Damage`, def: m.benchStats.damage, min: 0, max: 20 },
            { path: `bench.${m.id}.moveRange`, group: g, label: `${m.name} — Move`, def: m.benchStats.moveRange, min: 0, max: 8 },
        ];
    });

const globalFields = (): BalanceField[] => [
    { path: 'global.SUN_ON_LEVEL_START', group: 'Sun Economy', label: 'Sun at level start', def: SUN_ON_LEVEL_START, min: 0, max: 500 },
    { path: 'global.SUN_PER_TURN_INCOME', group: 'Sun Economy', label: 'Sun per turn', def: SUN_PER_TURN_INCOME, min: 0, max: 200 },
    { path: 'global.COIN_ON_RUN_START', group: 'Coin Economy', label: 'Coin at run start', def: COIN_ON_RUN_START, min: 0, max: 2000 },
];

let cachedFields: BalanceField[] | null = null;

/** Every tunable in the game. Built once; the data tables do not change at runtime. */
export const balanceFields = (): BalanceField[] => {
    if (!cachedFields) {
        cachedFields = [...globalFields(), ...heroFields(), ...unitFields(), ...materialFields()];
    }
    return cachedFields;
};

export const fieldByPath = (path: string): BalanceField | undefined =>
    balanceFields().find(f => f.path === path);

// --- STORAGE ---------------------------------------------------------------

/**
 * Loads overrides, dropping anything that is not a finite number or no longer corresponds to
 * a field in the code. That last check is what makes a stale save harmless instead of
 * dangerous: a renamed stat leaves its override behind and the default quietly wins.
 */
export const loadBalance = (): BalanceConfig => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const saved = JSON.parse(raw) ?? {};
        const out: BalanceConfig = {};
        Object.entries(saved).forEach(([path, value]) => {
            const field = fieldByPath(path);
            const n = typeof value === 'number' ? value : Number(value);
            if (field && Number.isFinite(n)) out[path] = clamp(n, field.min, field.max);
        });
        return out;
    } catch {
        return {};
    }
};

export const saveBalance = (config: BalanceConfig) => {
    try {
        // Only keep what actually differs from the default. A config that stores every value
        // would pin the game to today's numbers forever — re-tuning a default in code would
        // have no effect on anyone who had ever opened this screen.
        const diff: BalanceConfig = {};
        Object.entries(config).forEach(([path, value]) => {
            const field = fieldByPath(path);
            if (field && value !== field.def) diff[path] = clamp(value, field.min, field.max);
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(diff));
    } catch { /* private mode — tuning is simply not persisted */ }
};

/**
 * The tuning as text, for pasting into a chat, a commit, or another machine.
 *
 * Only the changed values go in. A balance pass is a short list of decisions — "Shadeleaf
 * hits for 3 now, zombies move one further" — and a dump of all 189 numbers would bury that
 * under noise, as well as pinning the reader to today's defaults.
 */
export const exportBalance = (config: BalanceConfig): string => {
    const diff: Record<string, number> = {};
    balanceFields().forEach(f => {
        const v = config[f.path];
        if (v !== undefined && v !== f.def) diff[f.path] = v;
    });
    return JSON.stringify(diff, null, 2);
};

export interface ImportResult {
    config: BalanceConfig;
    applied: number;
    /** Entries that were thrown away, with why — an import must never fail silently. */
    rejected: string[];
}

/**
 * Parses pasted text back into a config. Anything unrecognised is REPORTED, not ignored:
 * a paste that silently drops half its lines is worse than one that refuses, because the
 * player walks away believing numbers are live that never took.
 */
export const importBalance = (text: string): ImportResult | null => {
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { return null; }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

    const config: BalanceConfig = {};
    const rejected: string[] = [];
    Object.entries(parsed as Record<string, unknown>).forEach(([path, raw]) => {
        const field = fieldByPath(path);
        if (!field) { rejected.push(`${path} — no such stat`); return; }
        const n = typeof raw === 'number' ? raw : Number(raw);
        if (!Number.isFinite(n)) { rejected.push(`${path} — not a number`); return; }
        const clamped = clamp(n, field.min, field.max);
        if (clamped !== n) rejected.push(`${path} — ${n} out of range, clamped to ${clamped}`);
        config[path] = clamped;
    });
    return { config, applied: Object.keys(config).length, rejected };
};

/** Overrides that differ from the authored value. The editor's "what have I changed?" view. */
export const changedFields = (config: BalanceConfig): BalanceField[] =>
    balanceFields().filter(f => config[f.path] !== undefined && config[f.path] !== f.def);

// --- APPLYING --------------------------------------------------------------

/**
 * Writes the overrides into the data tables, in place, once at boot.
 *
 * In place is a deliberate trade. `HERO_DEFINITIONS`, `MATERIAL_DEFINITIONS` and the unit
 * table are imported directly by two dozen modules; threading a tuned copy through all of
 * them would be a large refactor whose only beneficiary is a dev tool. Mutating once, before
 * anything renders, gets every one of those call sites for free.
 *
 * The constraint that makes it safe: this runs exactly once, at startup, before any React
 * render — never mid-session. `resetBalance` reloads the page rather than trying to unwind.
 */
export const applyBalance = (config: BalanceConfig) => {
    // Globals are not mutated (they are exported primitives) — they are read back through
    // `balancedGlobal`, so this is what makes the editor's Save also move them. Without it,
    // Sun and Coin would save correctly and change nothing until the page was reloaded.
    loadedConfig = config;

    const num = (path: string): number | undefined => config[path];

    Object.values(HERO_DEFINITIONS).forEach(h => {
        const hp = num(`hero.${h.id}.maxHp`); if (hp !== undefined) h.maxHp = hp;
        const mv = num(`hero.${h.id}.moveRange`); if (mv !== undefined) h.moveRange = mv;

        [h.basicAttack, h.heroSkill].forEach(skill => {
            const dmg = skill.effects.find(e => e.type === 'DAMAGE');
            const d = num(`skill.${skill.id}.damage`);
            if (dmg && d !== undefined) dmg.value = d;

            const gain = skill.effects.find(e => e.type === 'RESOURCE_GAIN');
            const g = num(`skill.${skill.id}.sunGain`);
            if (gain && g !== undefined) gain.value = g;

            const cost = num(`skill.${skill.id}.sunCost`);
            if (cost !== undefined) skill.sunCost = cost;

            const range = num(`skill.${skill.id}.range`);
            if (range !== undefined) skill.rangeValue = range;
        });
    });

    Object.values(DEFAULT_UNIT_DEFINITIONS).forEach(d => {
        const hp = num(`unit.${d.class}.maxHp`); if (hp !== undefined) d.maxHp = hp;
        const dm = num(`unit.${d.class}.damage`); if (dm !== undefined) d.damage = dm;
        const mv = num(`unit.${d.class}.moveRange`); if (mv !== undefined) d.moveRange = mv;
    });

    Object.values(MATERIAL_DEFINITIONS).forEach(m => {
        const hp = num(`bench.${m.id}.maxHp`); if (hp !== undefined) m.benchStats.maxHp = hp;
        const dm = num(`bench.${m.id}.damage`); if (dm !== undefined) m.benchStats.damage = dm;
        const mv = num(`bench.${m.id}.moveRange`); if (mv !== undefined) m.benchStats.moveRange = mv;
    });
};

/**
 * Global numbers are read through here rather than mutated, because they are exported
 * primitives — reassigning an imported `const` is not possible, and every consumer already
 * imports the constant directly.
 */
export type GlobalPath = 'global.SUN_ON_LEVEL_START' | 'global.SUN_PER_TURN_INCOME' | 'global.COIN_ON_RUN_START';

export const balancedGlobal = (path: GlobalPath): number => {
    const override = loadedConfig[path];
    if (override !== undefined) return override;
    return fieldByPath(path)?.def ?? 0;
};

let loadedConfig: BalanceConfig = {};

/**
 * Call once, before the first render. Returns the config so the editor can seed its state.
 *
 * ORDER IS LOAD-BEARING. `loadBalance` validates against `balanceFields()`, which reads the
 * data tables to record each field's authored default — and it caches that. It therefore has
 * to run BEFORE `applyBalance` mutates those tables, or every "default" would be whatever
 * the player last tuned, and Reset would restore the override instead of the authored value.
 */
export const initBalance = (): BalanceConfig => {
    loadedConfig = loadBalance();
    applyBalance(loadedConfig);
    return loadedConfig;
};
