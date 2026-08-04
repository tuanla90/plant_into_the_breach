import { HeroId, MaterialId, UnlockState } from '../types';
import { MATERIAL_DEFINITIONS } from '../data/materials';
import {
    heroesForBossNumber, parseRecipeKey, recipeKey, SIGNATURE_MATERIAL, TUTORIAL_RECIPES,
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
 * The unlock order is simply the declaration order of the data tables. DESIGN.md section 7
 * lists the roadmap (Grass Knuckles + Cactus, Nightcap + Coffee Bean, …), so appending new
 * entries to `data/materials.ts` in that order is all that is needed — no id list to keep in
 * sync here, and nothing to update when the pool grows.
 */
const materialUnlockOrder = (): MaterialId[] => Object.keys(MATERIAL_DEFINITIONS) as MaterialId[];

/**
 * How many layers deeper a run must reach before it earns another unlock package.
 * 1 = every new personal-best layer pays out. Raise it to slow the drip once the
 * roadmap has more than a handful of packages in it.
 */
export const LAYERS_PER_UNLOCK_PACKAGE = 1;

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
    // straight into declaration order and handed out Shadeleaf + Chomper: a recipe for a
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
 * Grants whatever heroes the Nth boss clear is worth, plus each one's signature recipe so it
 * arrives usable. Idempotent per hero, so replaying a chapter or a double-fired completion
 * cannot duplicate an entry.
 */
export const withHeroesForBoss = (state: UnlockState, bossNumber: number): UnlockState => {
    const earned = heroesForBossNumber(bossNumber).filter((h: HeroId) => !state.heroes.includes(h));
    if (!earned.length) return state;

    const signatures = earned
        .map((h: HeroId) => recipeKey(h, SIGNATURE_MATERIAL[h]))
        .filter((k: string) => !state.recipes.includes(k));

    return {
        ...state,
        heroes: [...state.heroes, ...earned],
        recipes: [...state.recipes, ...signatures],
    };
};
