import { HeroId, MaterialId } from '../types';

/**
 * What opens up, and what opens it.
 *
 * Two separate currencies on purpose, because they answer different questions:
 *
 *   HEROES come from bosses. One boss holds one city; break the siege and that city's
 *   defender joins the squad. It is a story beat, so it must be specific and announced —
 *   "you beat the thing, you got the person". Handing heroes out of a random pool by depth
 *   made the player unable to say why they got anything.
 *
 *   MATERIALS come from bonus objectives. Those measure how well a fight was played, not
 *   how far the run went, and they are small and frequent — which is exactly the shape of
 *   reward that suits a fusion pool growing one piece at a time.
 *
 * Adding chapter 3's hero is an entry in the table below and nothing else.
 */

export interface HeroUnlock {
    hero: HeroId;
    /**
     * Which boss clear grants it, counted across the whole save: 1 is the first boss this
     * player has ever beaten. Deliberately an ordinal rather than a map/node id — the map is
     * generated per run, so there is no stable boss id to key on yet. When hand-authored
     * chapters land, this becomes a chapter id and the table is the only thing that changes.
     */
    bossNumber: number;
    /** The city the boss is holding. Shown on the locked card so the goal is legible. */
    city: string;
    /** One line of why this hero is worth going after. English source string — i18n key. */
    hint: string;
}

export const HERO_UNLOCKS: HeroUnlock[] = [
    {
        hero: 'CHOMPZILLA',
        bossNumber: 1,
        city: 'Verdant Reach',
        hint: 'Break the first siege and Verdant Reach sends its devourer.',
    },
    {
        hero: 'COLD_SNAP',
        bossNumber: 2,
        city: 'Frostgate',
        hint: 'Frostgate holds out under the second siege. Reach it and its marksman joins.',
    },
    {
        hero: 'KERNEL_PULT',
        bossNumber: 3,
        city: 'Goldacre',
        hint: 'Goldacre held its wall by shooting over it. Break the third siege and its gunner joins.',
    },
];

/** Heroes granted by beating the Nth boss, in table order. */
export const heroesForBossNumber = (n: number): HeroId[] =>
    HERO_UNLOCKS.filter(u => u.bossNumber === n).map(u => u.hero);

export const unlockInfoFor = (hero: HeroId): HeroUnlock | undefined =>
    HERO_UNLOCKS.find(u => u.hero === hero);

// ---------------------------------------------------------------------------
// FUSION RECIPES  — the reward bonus objectives actually pay
// ---------------------------------------------------------------------------

/**
 * A recipe is a (hero, material) pairing, keyed as `HERO:MATERIAL`. Twenty-five of them
 * exist (data/fusionRecipes.ts), which is a pool deep enough to keep paying out for a whole
 * campaign — unlike the five materials this replaced, which ran dry in about three fights.
 */
export const recipeKey = (hero: HeroId, material: MaterialId): string => `${hero}:${material}`;

/**
 * The pairing each hero starts knowing: its own base plant. Fusing a hero with the plant it
 * was grown from is the recipe that needs no explanation, so it is the one that ships — and
 * it means a hero arriving from a boss is immediately worth fusing rather than being a
 * portrait you cannot use yet.
 */
export const SIGNATURE_MATERIAL: Record<HeroId, MaterialId> = {
    GREEN_SHADOW: 'MAT_PEASHOOTER',
    WALL_KNIGHT: 'MAT_WALLNUT',
    SOLAR_FLARE: 'MAT_SUNFLOWER',
    CHOMPZILLA: 'MAT_CHOMPER',
    COLD_SNAP: 'MAT_SNOW_PEA',
    KERNEL_PULT: 'MAT_CORN',
};

/** Recipes a brand-new save knows: the signature pairing of each starting hero. */
export const startingRecipes = (startingHeroes: HeroId[]): string[] =>
    startingHeroes.map(h => recipeKey(h, SIGNATURE_MATERIAL[h]));

/**
 * Bonus objectives completed per recipe learned. Three is roughly one recipe every two
 * fights played well — often enough that objectives feel connected to progress, slow enough
 * that the twenty-five pairings last the campaign instead of a single run.
 */
export const BONUS_OBJECTIVES_PER_RECIPE = 3;

/**
 * Recipes the scripted tutorial is ALLOWED TO FUSE while it is running — and nothing more.
 * Finishing the tutorial grants none of them.
 *
 * The allowance is not optional: the campfire lesson fuses a pairing that is not one of the
 * starting signatures, and gating fusion on player progress made that hand-authored lesson
 * impossible to complete — the overlay sat pointing at a button that would never work.
 *
 * But being taught something is not the same as owning it. The tutorial used to hand these
 * over permanently, which meant a new player's very first fusions were free, and every
 * recipe earned afterwards had to compete with a head start it never asked for. Recipes are
 * earned by bonus objectives; the tutorial's job is to show what a fusion IS.
 */
export const TUTORIAL_RECIPES: string[] = [
    // The chain fuses exactly one pairing (tut_6: Shadeleaf + Peashooter = Repeater), and
    // it leads this list because withNextRecipe hands these out first — the first recipe a
    // bonus objective buys should be the one the player watched work. SOLAR_FLARE +
    // WALLNUT is kept: an earlier draft of board 6 fused it, and a lent recipe that is no
    // longer demonstrated is harmless, while removing it would silently change what the
    // first two bonus payouts award.
    'GREEN_SHADOW:MAT_PEASHOOTER',
    'SOLAR_FLARE:MAT_WALLNUT',
];

// ---------------------------------------------------------------------------
// ANNOUNCING WHAT WAS EARNED
// ---------------------------------------------------------------------------

/**
 * One thing the player just earned, ready to be shown.
 *
 * Progress that is never announced is progress the player does not know they made: before
 * this, a hero simply appeared in the roster on the next run and read as a bug. Every grant
 * produces one of these, and the victory screen shows them.
 *
 * `title`/`subtitle` are English source strings, i.e. i18n keys.
 */
export interface UnlockAward {
    kind: 'HERO' | 'RECIPE';
    /** HeroId, or a `HERO:MATERIAL` recipe key. */
    id: string;
    title: string;
    subtitle: string;
    /** Art to show beside it, when there is any. */
    imgUrl?: string;
}

export const parseRecipeKey = (key: string): { hero: HeroId; material: MaterialId } | null => {
    const [hero, material] = key.split(':');
    return hero && material ? { hero: hero as HeroId, material: material as MaterialId } : null;
};
