import { BossId, ElementId, HeroId, MaterialId, WorldType } from '../types';

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

/**
 * THE NAMED BOSSES.
 *
 * Three stages, then the one at the end (PLAN-progression.md). Each is a named encounter, not
 * the Nth boss you happened to beat: the hero it frees is the ANSWER to the threat it is. You
 * take the cold off the Yeti; the gun that shelled you all chapter changes hands.
 *
 * Nine rows, not ten: the plan closes each stage with a boss that pays an ELEMENT instead of a
 * hero, and the third of those (Voltmaw, The Grid) has no `BossId` yet. It is an entry here and
 * nothing else once elements exist.
 *
 * `hero` is optional for the same reason — a stage-ending boss pays no hero by design, and the
 * roadmap may hold a name before it holds a person. A boss with no hero simply pays nothing on
 * top of the run.
 */
export interface BossEntry {
    id: BossId;
    /**
     * Where this boss sits in the campaign: stage 1-3, act 1-3 inside it. Stage 0 is The
     * Breach, the boss rush that stands outside the three (PLAN-progression.md section 6).
     *
     * This replaced a lone `continent` field that nothing ever read and that disagreed with
     * the plan on three bosses — Neon Rose and Thornwaste were filed under the wrong stage,
     * and there was no way at all to say WHICH act of a stage a boss closed. The stage-select
     * screen needs both numbers, so both are here and roster.assert.ts proves the grid is
     * complete: three stages, three acts each, exactly one boss per cell.
     */
    stage: 0 | 1 | 2 | 3;
    act: 1 | 2 | 3;
    /** Display name. English source string — i18n key. */
    name: string;
    /** The hero freed by beating it, if that hero exists yet. */
    hero?: HeroId;
    /**
     * The element this boss pays instead of a hero. Every stage ends on one: two acts hand
     * over a squadmate, the third hands over a power the whole squad can wear.
     */
    element?: ElementId;
    /** Where it is holding out. Shown on the locked hero card. */
    city: string;
    /** One line of why it is worth going after. English source string — i18n key. */
    hint: string;
}

/**
 * The three stages, in order. Names and framing come straight from the plan: each stage is a
 * self-contained story — two squadmates join, then a power is taken from the thing that
 * closes it.
 */
export interface StageEntry {
    id: 1 | 2 | 3;
    name: string;
    subtitle: string;
    world: WorldType;
    accent: string;
}

export const STAGES: StageEntry[] = [
    // `world` is the sector the stage OPENS in, and it must agree with STAGE_SECTORS in
    // utils/mapGenerator.ts — that table owns the three-sector chain each stage walks
    // through, and this is only the first link of it.
    { id: 1, name: 'The Green Belt', subtitle: 'Home ground.',          world: 'GRASS', accent: '#4ade80' },
    { id: 2, name: 'The Far Shore',  subtitle: 'Across the water.',     world: 'COAST', accent: '#38bdf8' },
    { id: 3, name: 'The City',       subtitle: 'Where it all started.', world: 'NEON',  accent: '#f472b6' },
];

/** Every boss of a stage, in act order. */
export const actsOfStage = (stage: 1 | 2 | 3): BossEntry[] =>
    BOSSES.filter(b => b.stage === stage).sort((a, b) => a.act - b.act);

export const BOSSES: BossEntry[] = [
    // ---- STAGE I — The Green Belt -------------------------------------------------------
    {
        id: 'GRAVEHULK', stage: 1, act: 1, name: 'Gravehulk',
        hero: 'SNAPMAW', city: 'Verdant Reach',
        hint: 'The first thing too big to push. Verdant Reach answers it with a mouth to match — beat the Gravehulk and its devourer joins.',
    },
    {
        id: 'IRONCART', stage: 1, act: 2, name: 'Ironcart',
        hero: 'CORNOVA', city: 'Goldacre',
        hint: 'It shells you from three tiles away all chapter, and a wall is no answer to an arc. Break the siege and the gun changes hands.',
    },
    {
        id: 'CINDER_COLOSSUS', stage: 1, act: 3, name: 'Cinder Colossus',
        element: 'FIRE', city: 'Kiln Row',
        hint: 'It burns the ground it walks on. Take the fire from it, and any hero can carry it.',
    },

    // ---- STAGE II — The Far Shore -------------------------------------------------------
    {
        id: 'ARMADA', stage: 2, act: 1, name: 'The Armada',
        hero: 'REEDWING', city: 'Windward',
        hint: 'It owns the sky over Windward, and nothing that walks can answer it. Shoot the Armada down and the sky changes hands — the drone pilot who takes it joins you.',
    },
    {
        id: 'SANDREAVER', stage: 2, act: 2, name: 'Sandreaver',
        hero: 'THORNSHELL', city: 'Thornwaste',
        hint: 'It burrows and surfaces behind your line, where nothing you built is facing. Thornwaste answers with the one thing it cannot tunnel around — a taunt it has to walk into.',
    },
    {
        id: 'YETI', stage: 2, act: 3, name: 'Yeti',
        element: 'ICE', city: 'Frostgate',
        hint: 'It freezes everything you send at it. Break Frostgate and the cold stops being its alone.',
    },

    // ---- STAGE III — The City -----------------------------------------------------------
    {
        id: 'HEADLINER', stage: 3, act: 1, name: 'The Headliner',
        hero: 'CHARDSLAM', city: 'Neon Rose',
        hint: 'It never lays a hand on you — it turns the whole crowd into the threat. Neon Rose answers a crowd the only way that scales: one sweep that throws all of them somewhere else at once.',
    },
    {
        id: 'CLOCKJAW', stage: 3, act: 2, name: 'Clockjaw',
        hero: 'GOURDWARD', city: 'Old Quarter',
        hint: 'It acts twice a turn: nothing in the squad kills fast enough to stop the second blow. Old Quarter stops trying to prevent the hit and learns to stand in front of it.',
    },
    {
        id: 'VOLTMAW', stage: 3, act: 3, name: 'Voltmaw',
        element: 'LIGHTNING', city: 'The Grid',
        hint: 'Its shock jumps down the whole row at once. Tear the current out of it and the row becomes yours to chain.',
    },

    // ---- THE BREACH — outside the three stages ------------------------------------------
    {
        id: 'BLIGHTLORD', stage: 0, act: 1, name: 'Blightlord',
        city: 'The Breach',
        hint: 'The one who walked backwards through time. Every boss again, back to back, with no sprout rule — and then him.',
    },
];

export const bossById = (id: BossId): BossEntry | undefined => BOSSES.find(b => b.id === id);

/** The hero this boss frees, if any. */
export const heroForBoss = (id: BossId): HeroId | undefined => bossById(id)?.hero;

/** The boss that frees this hero — what the locked card has to name. */
export const bossForHero = (hero: HeroId): BossEntry | undefined => BOSSES.find(b => b.hero === hero);

/** The boss that pays this element — what a locked element chip has to name. */
export const bossForElement = (element: ElementId): BossEntry | undefined =>
    BOSSES.find(b => b.element === element);

/**
 * Elements this save has actually taken off a boss.
 *
 * DERIVED, never stored, for the same reason the act gates are: every element in the game is
 * paid out by exactly one stage-closing boss, so `bossesBeaten` already contains the answer and
 * a second copy of it in UnlockState could only ever disagree with the first.
 *
 * It matters that this is enforced and not merely advertised. The campaign screen has always
 * said an element is what act three pays; the squad screen offered all three from the first run
 * regardless, which made those three cards a promise of something the player already had. A
 * reward you can use before you win it is not a reward.
 */
export const elementsUnlocked = (beaten: BossId[]): ElementId[] =>
    BOSSES.filter(b => b.element && beaten.includes(b.id)).map(b => b.element!);

/**
 * Bosses in the order the campaign presents them.
 *
 * TEMPORARY assignment rule: the map generator only builds one boss node per run and has no
 * idea which stage it belongs to, so a run's boss is simply the first one not yet beaten.
 * When the stages exist as real map chains this is replaced by "the boss of the act you are
 * in" — everything else in this file already works off the id, so that is the only line that
 * changes.
 *
 * BLIGHTLORD must stay last in the table for that reason: this is what makes the final act the
 * final act. The order of the rows above it is the order the campaign hands them out.
 */
export const nextUnbeatenBoss = (beaten: BossId[]): BossId | undefined =>
    BOSSES.find(b => !beaten.includes(b.id))?.id;

// ---------------------------------------------------------------------------
// COMMANDER LEVEL — one number instead of three hidden counters
// ---------------------------------------------------------------------------

/**
 * Progress used to arrive through three separate channels: a personal-best layer paid a
 * recipe, a boss paid a hero, and every third bonus objective paid another recipe. All three
 * worked, and none of them were visible — the player could not answer "how close am I to the
 * next thing" about any of them, because the answer lived in three counters that were never
 * shown together.
 *
 * One level, one bar, fed by the RESULT OF A RUN. Every payout below is earned by playing the
 * run out, and all of it lands when the run ends — won or lost.
 *
 * These numbers are the whole difficulty knob for meta-progression: a run should be worth
 * two to three levels the whole way through, and an ACT is where most of that comes from.
 */
export const XP_PER_LAYER = 10;             // per map layer this run reached
export const XP_PER_BONUS_OBJECTIVE = 15;   // per optional objective actually taken
/**
 * Per ACT cleared — i.e. per boss put down. This is the big one, and it is deliberately
 * the reward for finishing a chunk of content rather than for surviving turns: a run is
 * three acts, so a full clear is worth roughly a run's whole level budget on its own.
 */
export const XP_PER_ACT = 120;
export const XP_PER_RECORD_LAYER = 10;      // extra, per layer deeper than you had ever gone

/**
 * XP for ANY level. Flat, on purpose.
 *
 * A rising curve is the RPG default and it is wrong here twice over. It makes late levels a
 * grind exactly when the player has the most content left to unlock, and it makes the payout
 * unreadable — "how many runs to the next recipe" stops having one answer. The ceiling
 * (`levelCapFor`) already stops a player from running ahead of their roster, so the curve has
 * no pacing left to do and may as well be a number you can hold in your head.
 *
 * 250 against a full three-act run (~710 XP) is a little under three levels; a run that dies
 * in act two is worth about one and a half.
 */
export const XP_PER_LEVEL = 250;
export const xpForNextLevel = (_level: number): number => XP_PER_LEVEL;

/**
 * LEVEL CAP — exactly the number of pairings that exist for what you own.
 *
 * A level buys ONE fusion recipe, so the ceiling is simply how many recipes there are to buy:
 * `heroes × plants`. Every plant ships unlocked (data/materials.ts), so in practice the only
 * moving part is the roster: a new save is 3 heroes against the 10-plant pool, cap 30, and each
 * boss that frees a hero adds another ten. At the full roster it is 9 × 10 = 90 — nine heroes
 * now that Frostpod is retired into the ICE element, against ten plants, because her Ice Grenade
 * stays in the pool as gear even though nobody is grown from it any more.
 *
 * This is the version of the cap that explains itself. Tying it to bosses worked, but "level 5
 * because you have beaten no bosses" is a rule you have to be told; "level 9 because there are
 * nine recipes you could still learn" is one you can read off the codex. It also cannot drift:
 * the ceiling is derived from the content, so adding a hero or a plant moves it automatically.
 *
 * XP over the cap is NOT lost — it stays on the pile and converts the moment a boss widens the
 * roster, so a run played past the ceiling still counts towards what comes after it.
 */
export const levelCapFor = (ownedHeroes: number, availablePlants: number): number =>
    Math.max(1, Math.max(0, ownedHeroes) * Math.max(0, availablePlants));

/** What one run was worth. Pure — the same function previews the payout and pays it. */
export interface RunResult {
    /** Deepest map layer this run reached, 1-based. */
    layers: number;
    /** Bonus objectives completed during it. */
    objectives: number;
    /**
     * Acts finished this run — one per boss put down. A run is three acts, and each boss is
     * banked the moment it falls, so dying in act three still keeps what acts one and two paid.
     */
    actsCleared: number;
    /** Layers beyond the save's previous personal best. */
    recordLayers: number;
}

export const xpForRun = (r: RunResult): number =>
    Math.max(0, r.layers) * XP_PER_LAYER
    + Math.max(0, r.objectives) * XP_PER_BONUS_OBJECTIVE
    + Math.max(0, r.actsCleared) * XP_PER_ACT
    + Math.max(0, r.recordLayers) * XP_PER_RECORD_LAYER;

/**
 * The level a save is actually ON: raw XP, held down by the boss ceiling.
 *
 * `capped` is what the UI needs to stop showing a progress bar that cannot fill — at the
 * ceiling the honest message is "go beat a boss", not "230/280".
 */
export const levelOf = (xp: number, cap: number): {
    level: number; into: number; needed: number; capped: boolean; cap: number;
} => {
    const raw = levelFromXp(xp);
    if (raw.level >= cap) return { level: cap, into: 0, needed: 0, capped: true, cap };
    return { ...raw, capped: false, cap };
};

/** Level, and how far into it, for a total XP — before the cap is applied. */
export const levelFromXp = (xp: number): { level: number; into: number; needed: number } => {
    let level = 1;
    let left = Math.max(0, xp);
    // Bounded: the curve grows, so this cannot spin. The cap is a backstop, not a design limit.
    while (level < 999 && left >= xpForNextLevel(level)) {
        left -= xpForNextLevel(level);
        level += 1;
    }
    return { level, into: left, needed: xpForNextLevel(level) };
};

/** What a locked hero card has to say: which boss holds it, and where. */
export const unlockInfoFor = (hero: HeroId): BossEntry | undefined => bossForHero(hero);

// ---------------------------------------------------------------------------
// FUSION RECIPES  — the reward bonus objectives actually pay
// ---------------------------------------------------------------------------

/**
 * A recipe is a (hero, material) pairing, keyed as `HERO:MATERIAL`. The matrix is every hero
 * against every plant (data/fusionRecipes.ts) — a hundred of them at the current roster, which
 * is a pool deep enough to keep paying out for a whole campaign, unlike the five materials this
 * replaced, which ran dry in about three fights.
 */
export const recipeKey = (hero: HeroId, material: MaterialId): string => `${hero}:${material}`;

/**
 * The pairing each hero starts knowing: its own base plant. Fusing a hero with the plant it
 * was grown from is the recipe that needs no explanation, so it is the one that ships — and
 * it means a hero arriving from a boss is immediately worth fusing rather than being a
 * portrait you cannot use yet.
 */
export const SIGNATURE_MATERIAL: Record<HeroId, MaterialId> = {
    PEABURST: 'MAT_PEABURST',
    IRONHUSK: 'MAT_IRONHUSK',
    SUNBLOOM: 'MAT_SUNBLOOM',
    SNAPMAW: 'MAT_SNAPMAW',
    CORNOVA: 'MAT_CORNOVA',
    // Nine heroes, nine gears: the plant each of the four newest heroes is grown from is also
    // the material that fuses into them, so the pairing below writes itself.
    REEDWING: 'MAT_REEDWING',
    THORNSHELL: 'MAT_THORNSHELL',
    CHARDSLAM: 'MAT_CHARDSLAM',
    GOURDWARD: 'MAT_GOURDWARD',
};

/** Recipes a brand-new save knows: the signature pairing of each starting hero. */
export const startingRecipes = (startingHeroes: HeroId[]): string[] =>
    startingHeroes.map(h => recipeKey(h, SIGNATURE_MATERIAL[h]));

/**
 * Bonus objectives completed per recipe learned. Three is roughly one recipe every two
 * fights played well — often enough that objectives feel connected to progress, slow enough
 * that the matrix lasts the campaign instead of a single run.
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
    // The chain fuses exactly one pairing (tut_6: Peaburst + Seed Gun = Repeater), and
    // it leads this list because withNextRecipe hands these out first — the first recipe a
    // bonus objective buys should be the one the player watched work. SUNBLOOM +
    // ARMOR_PLATE is kept: an earlier draft of board 6 fused it, and a lent recipe that is no
    // longer demonstrated is harmless, while removing it would silently change what the
    // first two bonus payouts award.
    'PEABURST:MAT_PEABURST',
    'SUNBLOOM:MAT_IRONHUSK',
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
