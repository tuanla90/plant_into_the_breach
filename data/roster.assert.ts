import { ElementId, HeroId, HeroRole } from '../types';
import { HERO_DEFINITIONS, STARTING_HEROES } from './heroes';
import { BOSSES, STAGES, actsOfStage, bossForHero } from './unlocks';

/**
 * THE ROSTER'S TEST SUITE. Development only — loaded from index.tsx behind
 * `import.meta.env.DEV`, exactly like data/tutorial.assert.ts, so players ship none of it.
 *
 * The squad-select screen now states two things as fact for every hero: which third of the
 * roster it belongs to, and the one boss that frees it. Both are claims about DATA, and both
 * were previously nobody's job to keep true — a hero could be added with no unlock source at
 * all and the only symptom would be a card that says "Locked" and never explains itself.
 * These checks make that a build failure instead of a mystery.
 */

const ROSTER = Object.keys(HERO_DEFINITIONS) as HeroId[];

// --- every hero is REACHABLE -----------------------------------------------------------
// A hero with no source is content the player can see, want, and never obtain. The locked
// card literally has nothing to print in the "how" line.
ROSTER.forEach(id => {
    const isStarter = STARTING_HEROES.includes(id);
    const boss = bossForHero(id);
    if (!isStarter && !boss) {
        throw new Error(
            `Roster: ${HERO_DEFINITIONS[id].name} (${id}) has no way in — not a starting hero, ` +
            `and no boss in data/unlocks.ts frees them. Add them to STARTING_HEROES, or set ` +
            `\`hero: '${id}'\` on the boss that should drop them.`
        );
    }
    if (isStarter && boss) {
        throw new Error(
            `Roster: ${id} is both a starting hero and the reward for ${boss.name}. The boss ` +
            `reward would be a no-op the player has already been handed.`
        );
    }
});

// --- one boss, one hero ----------------------------------------------------------------
const claimed = new Map<HeroId, string>();
BOSSES.forEach(b => {
    if (!b.hero) return;
    if (!HERO_DEFINITIONS[b.hero]) {
        throw new Error(`Roster: boss ${b.name} frees '${b.hero}', which is not a hero.`);
    }
    const other = claimed.get(b.hero);
    if (other) {
        throw new Error(
            `Roster: ${b.hero} is dropped by both ${other} and ${b.name}. Beating the second ` +
            `one pays nothing.`
        );
    }
    claimed.set(b.hero, b.name);
});

// --- the three thirds ------------------------------------------------------------------
// PLAN-heroes-9.md's closing table is three ranged, three melee, three support — "chín
// người, hết", nine and no tenth — and the squad screen renders exactly those three groups.
// This was briefly a floor rather than an exact count, because Frostpod predated the plan
// and stayed; she is retired now, so the check says what the plan says.
const count = (r: HeroRole) => ROSTER.filter(id => HERO_DEFINITIONS[id].role === r).length;
const GROUP_SIZE = 3;
([['RANGED'], ['MELEE'], ['SUPPORT']] as Array<[HeroRole]>).forEach(([role]) => {
    const n = count(role);
    if (n !== GROUP_SIZE) {
        throw new Error(
            `Roster: ${n} ${role} hero(es); PLAN-heroes-9.md wants exactly ${GROUP_SIZE}. ` +
            `Either fix the hero's \`role\`, or update this check and the plan together.`
        );
    }
});

if (ROSTER.length !== GROUP_SIZE * 3) {
    throw new Error(
        `Roster: ${ROSTER.length} heroes. PLAN-heroes-9.md is explicit that nine is the whole ` +
        `set — there is no tenth hero. Removing one leaves a short group on the pick screen; ` +
        `adding one needs a role, a boss that frees it, and a fusion row.`
    );
}

// Nothing may sit outside the three groups: the squad screen renders group by group, so an
// unrecognised role is a hero that silently never appears on the screen at all.
const GROUPS: HeroRole[] = ['RANGED', 'MELEE', 'SUPPORT'];
ROSTER.forEach(id => {
    if (!GROUPS.includes(HERO_DEFINITIONS[id].role)) {
        throw new Error(
            `Roster: ${id} has role '${HERO_DEFINITIONS[id].role}', which squad select does ` +
            `not render — the hero would be invisible on the pick screen.`
        );
    }
});


// --- THE CAMPAIGN GRID ------------------------------------------------------------------
// PLAN-progression.md section 6: three stages, three acts each, and every stage tells the
// same shape of story — two acts hand over a squadmate, the third takes a power off the
// thing that closes the stage. The stage-select screen renders that grid literally, cell by
// cell, so a hole in the data is a hole on the screen.
const ELEMENTS_EXPECTED: ElementId[] = ['FIRE', 'ICE', 'LIGHTNING'];
const paidElements: ElementId[] = [];

STAGES.forEach(stage => {
    const acts = actsOfStage(stage.id);
    if (acts.length !== 3) {
        throw new Error(
            `Campaign: stage ${stage.id} (${stage.name}) has ${acts.length} act(s), not 3. ` +
            `The stage screen draws three cells per stage and one of them would be empty.`
        );
    }
    acts.forEach((b, i) => {
        if (b.act !== i + 1) {
            throw new Error(
                `Campaign: stage ${stage.id} act numbers are ${acts.map(a => a.act).join(',')} — ` +
                `they must be 1, 2, 3 with no gaps or repeats.`
            );
        }
        const closer = i === 2;
        if (closer && !b.element) {
            throw new Error(
                `Campaign: ${b.name} closes stage ${stage.id} but pays no element. Every stage ` +
                `ends by handing the squad a power (plan section 6).`
            );
        }
        if (!closer && !b.hero) {
            throw new Error(
                `Campaign: ${b.name} is act ${b.act} of stage ${stage.id} and pays no hero. The ` +
                `first two acts of a stage each free a squadmate.`
            );
        }
        if (b.element) paidElements.push(b.element);
    });
});

ELEMENTS_EXPECTED.forEach(el => {
    const n = paidElements.filter(e => e === el).length;
    if (n !== 1) {
        throw new Error(
            `Campaign: the ${el} element is paid out ${n} time(s). Exactly one stage-closing ` +
            `boss hands over each element.`
        );
    }
});

// The Breach stands outside the three stages and must exist: it is where the run actually
// ends, and the stage screen shows it as the locked cap on the campaign.
if (!BOSSES.some(b => b.stage === 0)) {
    throw new Error('Campaign: no stage-0 boss. The Breach is where the campaign ends.');
}
