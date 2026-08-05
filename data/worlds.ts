import { WorldType } from '../types';

/**
 * WHAT EACH SECTOR LOOKS AND SOUNDS LIKE.
 *
 * The map screen used to be one picture. Every run, every stage, every sector: the same black
 * radial, the same 50px grid, and a title bar that said "Sector 1: Grasslands" as a hardcoded
 * string — so a player standing in Kiln Row was told they were in the Green Belt. Nine
 * different places existed in the data (`STAGE_SECTORS` in utils/mapGenerator.ts) and none of
 * them existed on screen.
 *
 * That is worse than plain. A run walks THROUGH three sectors and each one brings its own
 * hazard (data/hazards.ts): the moment the ground starts sliding on rails or the tide starts
 * coming in, the player needs to already know they crossed a border. A backdrop that never
 * changes actively hides the one thing about the map that has rules attached.
 *
 * NAMES ARE THE ACT CITIES, deliberately, not new invented ones. Stage I's three sectors ARE
 * Verdant Reach, Goldacre and Kiln Row — the same three places the campaign screen offers as
 * acts — so a player who chose "Kiln Row" on that screen sees Kiln Row written on the map they
 * are dropped into. Every string here is already in the i18n table for that reason.
 */
export interface WorldMeta {
    /** Display name — the act city this sector is. English source string, i18n key. */
    name: string;
    /** Backdrop tint and header colour. */
    accent: string;
    /**
     * The sector's own texture, as a CSS background-image. Colour alone separates two sectors
     * side by side; texture is what separates them a week apart, from memory, at a glance.
     */
    texture: string;
    textureSize: string;
}

export const WORLD_META: Record<WorldType, WorldMeta> = {
    // ---- Stage I — the Green Belt -----------------------------------------------------
    GRASS: {
        name: 'Verdant Reach',
        accent: '#4ade80',
        // Blades, leaning.
        texture: 'repeating-linear-gradient(115deg, rgba(74,222,128,0.10) 0 2px, transparent 2px 15px)',
        textureSize: 'auto',
    },
    DESERT: {
        name: 'Goldacre',
        accent: '#e0a44a',
        // Sleepers under a rail line — DESERT's hazard is the runaway cart.
        texture: 'repeating-linear-gradient(0deg, rgba(224,164,74,0.13) 0 2px, transparent 2px 22px)',
        textureSize: 'auto',
    },
    VOLCANO: {
        name: 'Kiln Row',
        accent: '#f0653a',
        // Embers rising off the floor.
        texture: 'radial-gradient(circle at 30% 70%, rgba(240,101,58,0.16) 0 2px, transparent 3px), radial-gradient(circle at 75% 25%, rgba(240,101,58,0.12) 0 2px, transparent 3px)',
        textureSize: '46px 46px',
    },

    // ---- Stage II — the Far Shore -----------------------------------------------------
    COAST: {
        name: 'Windward',
        accent: '#38bdf8',
        // Swell lines running across the shore.
        texture: 'repeating-linear-gradient(0deg, rgba(56,189,248,0.12) 0 1px, transparent 1px 12px)',
        textureSize: 'auto',
    },
    THORN: {
        name: 'Thornwaste',
        accent: '#b8836a',
        // Crosshatch: thorn scrub, and the dust veil that hangs in it.
        texture: 'repeating-linear-gradient(45deg, rgba(184,131,106,0.11) 0 1px, transparent 1px 13px), repeating-linear-gradient(-45deg, rgba(184,131,106,0.11) 0 1px, transparent 1px 13px)',
        textureSize: 'auto',
    },
    ICE: {
        name: 'Frostgate',
        accent: '#a5f3fc',
        // Shards, all facing one way.
        texture: 'repeating-linear-gradient(60deg, rgba(165,243,252,0.12) 0 2px, transparent 2px 24px)',
        textureSize: 'auto',
    },

    // ---- Stage III — the City ---------------------------------------------------------
    NEON: {
        name: 'Neon Rose',
        accent: '#f472b6',
        // Scanlines. The lights still work here, which is exactly the problem.
        texture: 'repeating-linear-gradient(90deg, rgba(244,114,182,0.12) 0 2px, transparent 2px 16px)',
        textureSize: 'auto',
    },
    RUIN: {
        name: 'Old Quarter',
        accent: '#94a3b8',
        // Courses of brick, offset — a wall seen from the inside after the roof went.
        texture: 'repeating-linear-gradient(0deg, rgba(148,163,184,0.12) 0 1px, transparent 1px 20px), repeating-linear-gradient(90deg, rgba(148,163,184,0.09) 0 1px, transparent 1px 40px)',
        textureSize: 'auto',
    },
    GRID: {
        name: 'The Grid',
        accent: '#facc15',
        // Live circuit. The one sector whose floor pays you and bites you.
        texture: 'repeating-linear-gradient(0deg, rgba(250,204,21,0.10) 0 1px, transparent 1px 32px), repeating-linear-gradient(90deg, rgba(250,204,21,0.10) 0 1px, transparent 1px 32px)',
        textureSize: 'auto',
    },
};
