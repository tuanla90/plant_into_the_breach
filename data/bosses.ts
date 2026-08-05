import { BossId, Unit, UnitClass } from '../types';

/**
 * WHAT A BOSS IS MADE OF.
 *
 * Three small tables rather than one big object, because they are consumed in three different
 * places and at three different times: the encounter builder needs the body, the AI needs the
 * behaviour (utils/bossBehaviours.ts), and the reward table needs the hero (data/unlocks.ts).
 * Bolting them together would force every consumer to import all three.
 *
 * `Partial` is load-bearing here and in BOSS_BEHAVIOURS. `BossId` is the campaign roadmap —
 * ten names, most of which are still just a plan (PLAN-boards-bosses.md section 5) — while
 * these tables are what has actually been built. A boss with no entry falls back to the
 * Gargantuar body and ordinary zombie AI, which is a placeholder rather than a crash.
 */

/** The unit class each boss is fought as. */
export const BOSS_UNIT_CLASS: Partial<Record<BossId, UnitClass>> = {
    GARGANTUAR: UnitClass.GARGANTUAR,
    DISCO_ZOMBOSS: UnitClass.DISCO_ZOMBOSS,
    CINDER_COLOSSUS: UnitClass.CINDER_COLOSSUS,
    BLIGHTLORD: UnitClass.BLIGHTLORD,
    VOLTMAW: UnitClass.VOLTMAW,
    YETI: UnitClass.YETI,
    CATAPULT_LORD: UnitClass.IRONCART,
    CLOCKJAW: UnitClass.CLOCKJAW,
    BALLOON_ARMADA: UnitClass.ARMADA,
    SANDREAVER: UnitClass.SANDREAVER,
};

/**
 * Bosses too big to be eaten, frozen or shoved.
 *
 * NOT every boss. `isMassive` is a rules flag, not a rank: The Headliner is a dancer with a
 * microphone, and a squad that has bought a shove deserves to be able to use it on him. Making
 * every boss massive would quietly delete Ironhusk and Chardwall from every boss fight in the
 * game — see PLAN-boards-bosses.md section 7, where only three of the nine resist a push.
 */
export const MASSIVE_BOSSES: ReadonlySet<BossId> = new Set<BossId>(['GARGANTUAR']);

/** Telegraph text shown before a boss has planned its first intent. English source string. */
export const BOSS_OPENING_INTENT: Partial<Record<BossId, string>> = {
    GARGANTUAR: 'Stomping...',
    DISCO_ZOMBOSS: 'Taking the stage...',
    CINDER_COLOSSUS: 'Smouldering...',
    BLIGHTLORD: 'Walking it back...',
    VOLTMAW: 'Charging the grid...',
    YETI: 'Breathing frost...',
    CATAPULT_LORD: 'Building up steam...',
    CLOCKJAW: 'Winding up...',
    BALLOON_ARMADA: 'Making its approach...',
    SANDREAVER: 'Testing the sand...',
};

/**
 * How many escorts stand on the board when a boss node opens. 2 is the default and most want
 * it; it was only ever a constant because there was one boss.
 *
 * Zero is not "easier", it is "this one brought its own". The Headliner calls four dancers
 * every other turn. Clockjaw is fought in an alley that RUIN's Collapse walls up two tiles at
 * a time, so the board tightens itself and escorts would tighten it twice — see the arithmetic
 * in PLAN-boards-bosses.md III-2. Either way turnManager's reinforcement stream refills toward
 * MAX_LIVE_ENEMIES within two turns, so what the opening count really buys is those first two
 * turns: exactly the window a squad needs to pick a formation before the beating starts.
 */
export const BOSS_ESCORTS: Partial<Record<BossId, number>> = {
    DISCO_ZOMBOSS: 0,
    CLOCKJAW: 0,
    // None. Phase one summons an echo EVERY turn, so an opening escort would be adds on top
    // of adds — and the pit is 6x6, which is not enough floor to spend on bodies the fight
    // is going to produce anyway.
    BLIGHTLORD: 0,
};

/**
 * Opening state a boss's body carries that its class sheet cannot express, because the sheet is
 * shared: an ordinary Balloon Zombie has no gas cells and must not grow any. Per BOSS, which is
 * where identity already lives, and it keeps unitFactory ignorant of the roster.
 */
export const BOSS_INITIAL_STATE: Partial<Record<BossId, Partial<Unit>>> = {
    BALLOON_ARMADA: { buoyancy: 3 },
};

export const bossClassFor = (boss: BossId | undefined): UnitClass =>
    (boss && BOSS_UNIT_CLASS[boss]) || UnitClass.GARGANTUAR;
