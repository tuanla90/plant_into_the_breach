import { EventEffect } from '../types';

/**
 * Collapses an option's effect list into the flat list that actually happened.
 *
 * Every `chance` is rolled exactly once, HERE, and nowhere else. That matters: the result
 * banner is written from the return value of this function, so the screen can never announce
 * one outcome while a second roll applies a different one. `handleEventResolve` receives a
 * list with no `chance` left on it and simply executes.
 *
 * `fallback` chains are expanded recursively, so a failed roll may itself branch.
 */
export const resolveEffects = (
    effects: EventEffect[],
    rng: () => number = Math.random,
): EventEffect[] => {
    const out: EventEffect[] = [];

    for (const effect of effects) {
        if (typeof effect.chance === 'number' && effect.chance < 1) {
            if (rng() < effect.chance) {
                // Landed. Strip the roll so nothing downstream is tempted to re-roll it.
                const { chance, then, fallback, ...landed } = effect;
                out.push(landed);
                // One roll, several consequences — all tied to that single result.
                if (then && then.length > 0) out.push(...resolveEffects(then, rng));
            } else if (effect.fallback && effect.fallback.length > 0) {
                out.push(...resolveEffects(effect.fallback, rng));
            }
            continue;
        }
        const { chance, then, fallback, ...certain } = effect;
        out.push(certain);
    }

    return out;
};
