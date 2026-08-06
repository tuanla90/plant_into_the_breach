import { FusionEffect, HeroId } from '../types';

/**
 * ACT UPGRADES — what a boss pays the squad, inside the run that killed it.
 *
 * Three per hero, each takeable ONCE, so a squad of three has exactly nine on the table. That
 * is not a coincidence: the Breach is nine bosses before the Blightlord, so a player who takes
 * every pick walks into the last fight with all three heroes finished. An ordinary three-act
 * run pays three of the nine, which is a third of a build — enough to steer the run, nowhere
 * near enough to finish it.
 *
 * RUN-SCOPED, like a fusion and unlike anything in UnlockState. The next run starts over. That
 * is the whole reason this can be generous: nothing here compounds across a save, so a strong
 * pick is a strong run rather than a permanently easier game.
 *
 * WHY IT RIDES THE FUSION PIPELINE. `EDGE` upgrades are expressed as ordinary `FusionEffect`s
 * and read back through `getFusionEffects`, which means every consumer already handles them:
 * damage, reach, shove distance, retaliation and Sun income are all summed in one place, and —
 * the part that matters — `applyFusionToSkill` feeds both the resolution AND the targeting
 * overlay. An upgrade wired anywhere else would be a buff the player cannot see until after
 * they have committed the click, in a game whose whole promise is that they can.
 *
 * THE RULE THE ATTACK UPGRADES FOLLOW: a free upgrade must never eat the identity of a skill
 * somebody pays Sun for, nor duplicate a generic pick already on the card (that is why no
 * EDGE is ever +move — STRIDE is +move, and an EDGE that repeats it is not "the hero's own
 * thing").
 */
export type UpgradeKind =
    /** +2 max HP, healed on the spot. */
    | 'VIGOR'
    /** +1 move. The strongest of the three in a game about reaching the right tile. */
    | 'STRIDE'
    /** The hero's own thing, sharpened. One per hero, no two alike. */
    | 'EDGE';

export interface HeroUpgrade {
    id: string;
    hero: HeroId;
    kind: UpgradeKind;
    /** English source string — i18n key. */
    name: string;
    /** One line, what it actually does. English source string. */
    description: string;
    /** EDGE only: the effect the unit starts carrying. */
    effect?: FusionEffect;
}

export const UPGRADE_HP = 2;
export const UPGRADE_MOVE = 1;

export const upgradeId = (hero: HeroId, kind: UpgradeKind) => `${hero}:${kind}`;

/**
 * The nine EDGE upgrades, one per hero, each aimed at what that hero is FOR.
 *
 * Ironhusk gets shove distance rather than damage because her 1 damage is not the point and
 * never was; Chardwall gets reach on a swing that deals nothing at all, so he can throw a body
 * without standing next to it; Thornhide gets retaliation, which is the only stat on the sheet
 * that is his alone. Sunspot's is Sun, because Sun is her whole contribution — passive income
 * rather than a bigger Harvest, since that is the shape the engine already resolves and it
 * pays her on the turns she spends doing something else.
 */
const EDGE: Record<HeroId, { name: string; description: string; effect: FusionEffect }> = {
    GREEN_SHADOW: {
        name: 'Heavier Peas',
        description: 'Every attack hits one harder.',
        effect: { type: 'BONUS_DAMAGE', value: 1 },
    },
    WALL_KNIGHT: {
        name: 'Full Weight',
        description: 'Her shove drives one tile further.',
        effect: { type: 'PUSH_DISTANCE', value: 1 },
    },
    SOLAR_FLARE: {
        name: 'Second Sun',
        description: 'She banks Sun every turn, even on the turns she spends elsewhere.',
        effect: { type: 'SUN_PER_TURN', value: 10 },
    },
    CHOMPZILLA: {
        name: 'Deeper Bite',
        description: 'Every attack hits one harder.',
        effect: { type: 'BONUS_DAMAGE', value: 1 },
    },
    KERNEL_PULT: {
        name: 'Longer Arc',
        description: 'The lob reaches one tile further.',
        effect: { type: 'ATTACK_RANGE_BONUS', value: 1 },
    },
    // NOT the plan's first suggestion (MOVE_BONUS): +1 move already exists as STRIDE on every
    // hero's card, and an EDGE that duplicates a generic pick is not "the hero's own thing".
    // Damage is honest here: WING_PAIR fires two cells, so +1 lands on both — the same rule
    // that makes Shadeleaf's identical upgrade lift her whole volley.
    ZEPHYR: {
        name: 'Heavier Payload',
        description: 'Every attack hits one harder — both wings at once.',
        effect: { type: 'BONUS_DAMAGE', value: 1 },
    },
    THORNHIDE: {
        name: 'Longer Thorns',
        description: 'Anything that hits him bleeds one more for it.',
        effect: { type: 'RETALIATE_DAMAGE', value: 1 },
    },
    CHARDWALL: {
        name: 'Long Handle',
        description: 'He throws bodies from a tile away instead of arm\'s length.',
        effect: { type: 'ATTACK_RANGE_BONUS', value: 1 },
    },
    // BONUS_DAMAGE until the rework took his last attack away (PLAN-hero-zephyr §6.3);
    // now the rind itself thickens — the one stat a pure guardian actually spends.
    GOURDWARD: {
        name: 'Hard Rind',
        description: 'Takes 1 less damage from every hit.',
        effect: { type: 'DAMAGE_REDUCTION', value: 1 },
    },
};

const HEROES = Object.keys(EDGE) as HeroId[];

export const HERO_UPGRADES: HeroUpgrade[] = HEROES.flatMap(hero => [
    {
        id: upgradeId(hero, 'VIGOR'),
        hero,
        kind: 'VIGOR' as UpgradeKind,
        name: 'Vigor',
        description: 'Toughens up: +2 max health, and the wound closes with it.',
        // Carried as an EFFECT as well as written onto the body, exactly as a BONUS_HP fusion
        // is. `migrateHeroHp` rebuilds max health after every reload as "the sheet, plus every
        // BONUS_HP the unit carries, minus the element" — a +2 that existed only on the body
        // would be silently deleted by the next F5.
        effect: { type: 'BONUS_HP', value: UPGRADE_HP },
    },
    {
        id: upgradeId(hero, 'STRIDE'),
        hero,
        kind: 'STRIDE' as UpgradeKind,
        name: 'Stride',
        description: 'Covers one more tile every turn.',
    },
    {
        id: upgradeId(hero, 'EDGE'),
        hero,
        kind: 'EDGE' as UpgradeKind,
        name: EDGE[hero].name,
        description: EDGE[hero].description,
        effect: EDGE[hero].effect,
    },
]);

export const upgradeById = (id: string): HeroUpgrade | undefined =>
    HERO_UPGRADES.find(u => u.id === id);

/** The three upgrades this hero has, in a fixed order so the picker never reshuffles. */
export const upgradesFor = (hero: HeroId): HeroUpgrade[] =>
    HERO_UPGRADES.filter(u => u.hero === hero);
