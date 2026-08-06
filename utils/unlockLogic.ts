import { BossId, HeroId, MaterialId, UnlockState } from '../types';
import { HERO_DEFINITIONS } from '../data/heroes';
import { MATERIAL_DEFINITIONS } from '../data/materials';
import { SECTOR_ITEM } from '../data/items';
import {
    heroForBoss, parseRecipeKey, recipeKey, SIGNATURE_MATERIAL, TUTORIAL_RECIPES,
} from '../data/unlocks';

/**
 * WHAT A REWARD ACTUALLY GRANTS.
 *
 * Three pure state transitions, lifted out of useGameProgression. Each takes an UnlockState
 * and returns the next one; none of them touch React, localStorage or the run. That is worth
 * having on its own because these are the functions where a payout can silently go nowhere —
 * handing out a recipe for a hero the player does not own reads as "the objective paid
 * nothing", and the only way to see it is to run the transition and look at the result.
 */

/**
 * The order recipes are handed out in is simply the declaration order of the data tables, so
 * appending an entry to `data/materials.ts` is all it takes to put that plant in the rotation —
 * there is no id list to keep in sync here, and nothing to update when the pool grows. The four
 * gears of PLAN-heroes-9.md joined the payout this way, without a line changing in this file.
 */
const materialUnlockOrder = (): MaterialId[] => Object.keys(MATERIAL_DEFINITIONS) as MaterialId[];

/**
 * How many layers deeper a run must reach before it earns another unlock package.
 * 1 = every new personal-best layer pays out. Raise it to slow the drip once the
 * roadmap has more than a handful of packages in it.
 */
export const LAYERS_PER_UNLOCK_PACKAGE = 1;

/**
 * Which combat items this save may see — in shops, camps, event rewards and Chrono Echo
 * offers alike. Ground is the teacher: each sector's first footstep unlocks its item
 * (data/items.ts SECTOR_ITEM), the tutorial's diploma is the Seed Mine, and nothing
 * else exists yet. Pure and cheap enough to recompute at every shelf roll.
 */
export const unlockedItemIds = (state: UnlockState): Set<string> => {
    const out = new Set<string>();
    if (state.tutorialDone) out.add('seed_mine');
    (state.sectorsVisited ?? []).forEach(s => {
        const item = SECTOR_ITEM[s as keyof typeof SECTOR_ITEM];
        if (item) out.add(item);
    });
    return out;
};

/** First footstep on new ground: record it. Idempotent, like every transition in this file. */
export const withSectorVisited = (state: UnlockState, sector: string): UnlockState => {
    const visited = state.sectorsVisited ?? [];
    if (visited.includes(sector)) return state;
    return { ...state, sectorsVisited: [...visited, sector] };
};

/**
 * Opens the next fusion recipe the player can actually use.
 *
 * "Can actually use" is the whole rule: only pairings for heroes already owned are offered.
 * Handing out a recipe for a hero still locked behind a boss would be a reward the player
 * cannot touch, and would burn the payout that should have gone somewhere useful.
 *
 * Heroes deliberately do NOT come through here. They used to be handed out in a "package"
 * alongside a material, which meant the player was given a hero for getting deep with no
 * idea which act caused it. Heroes are granted by name, by boss — `withHeroesForBoss`.
 */
export const withNextRecipe = (state: UnlockState): UnlockState => {
    // The recipes the tutorial DEMONSTRATED come first. The tutorial only lends them — the
    // loan ends when the chain does — so the natural first thing a bonus objective should
    // buy is the pairing the player has already watched work. Before this the reward rolled
    // straight into declaration order and handed out Peaburst + Steel Jaws: a recipe for a
    // plant the player does not own, for a fusion nothing had ever shown them.
    for (const key of TUTORIAL_RECIPES) {
        const parsed = parseRecipeKey(key);
        if (!parsed) continue;
        if (!state.heroes.includes(parsed.hero)) continue;
        if (!state.recipes.includes(key)) {
            return { ...state, recipes: [...state.recipes, key] };
        }
    }

    for (const hero of state.heroes) {
        for (const material of materialUnlockOrder()) {
            const key = recipeKey(hero, material);
            if (!state.recipes.includes(key)) {
                return { ...state, recipes: [...state.recipes, key] };
            }
        }
    }
    return state;
};

export const withRecipes = (state: UnlockState, count: number): UnlockState => {
    let next = state;
    for (let i = 0; i < count; i++) next = withNextRecipe(next);
    return next;
};

/**
 * A boss has fallen. Record it, and hand over the hero it was holding — plus that hero's
 * own-plant recipe, so it arrives usable rather than as a portrait with nothing to fuse.
 *
 * Granted the MOMENT the boss dies, not at the end of the run. A run is three acts; dying in
 * the third must not take back what the first two freed, or "three bosses per run" becomes
 * all-or-nothing and a new player never sees the fourth hero.
 *
 * Idempotent: re-clearing a boss already in the list changes nothing. `bossesBeaten` is the one
 * source of truth and `bossesDefeated` is derived from its length here, so the two cannot drift
 * however long the table grows.
 *
 * The `HERO_DEFINITIONS` check is not paranoia. `BossEntry.hero` is a ROADMAP field — the table
 * is allowed to name the hero a boss will free before that hero has a definition — and
 * `saveUnlockState` drops any hero id the data tables do not know. Granting one anyway would
 * announce a hero on the victory screen and then lose it on the next reload, which reads to the
 * player as progress being taken away. Better to pay nothing than to pay something that
 * evaporates.
 */
export const withBossDefeated = (state: UnlockState, boss: BossId): UnlockState => {
    if (state.bossesBeaten.includes(boss)) return state;

    const beaten = [...state.bossesBeaten, boss];
    let next: UnlockState = { ...state, bossesBeaten: beaten, bossesDefeated: beaten.length };

    const hero = heroForBoss(boss);
    if (hero && HERO_DEFINITIONS[hero] && !next.heroes.includes(hero)) {
        const signature = recipeKey(hero, SIGNATURE_MATERIAL[hero]);
        next = {
            ...next,
            heroes: [...next.heroes, hero],
            recipes: next.recipes.includes(signature) ? next.recipes : [...next.recipes, signature],
        };
    }
    return next;
};

/**
 * Fusion recipes paid per commander level: exactly ONE.
 *
 * That is not a balance number, it is the definition. The level ceiling is the number of
 * pairings that exist for the heroes you own (`levelCapFor`), so one recipe per level makes
 * the level literally a count of what you know — reach the ceiling and you have learned every
 * pairing available to your roster, with nothing left stranded above it.
 */
export const RECIPES_PER_LEVEL = 1;

/**
 * Everything gained by climbing from one level to another. Recipes only — heroes come from
 * bosses now, by name, and are granted the moment the boss falls rather than at a level.
 *
 * Applied level by level rather than in one jump so nothing between the two is skipped.
 */
export const withLevelUps = (state: UnlockState, fromLevel: number, toLevel: number): UnlockState => {
    let next = state;
    for (let level = fromLevel + 1; level <= toLevel; level++) {
        next = withRecipes(next, RECIPES_PER_LEVEL);
    }
    return next;
};
