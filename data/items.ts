
import { ItemDefinition } from '../types';
import { ICONS, ITEM_SPRITES } from '../utils/icons';

// Combat items are bought between levels, so they are priced in Coin, never Sun.
// Prices follow DESIGN.md section 5: Potato Mine 25 / Jalapeño 50 / Cherry Bomb 75.
export const DEFAULT_ITEM_DEFINITIONS: ItemDefinition[] = [
    // A TRAP, not click-damage — as an instant 5 it was just a cheaper Cherry Bomb, and the
    // whole PvZ identity of the thing (plant it early, let them walk into it) was gone.
    // Placement requires an EMPTY tile; the first grounded zombie to step on it detonates it.
    { id: 'potato_mine', name: 'Potato Mine', coinCost: 25, damage: 5, rangeRadius: 0, effect: 'TRAP', description: 'Arm it on an empty tile. The first zombie to step there takes 5 damage.', imgUrl: ITEM_SPRITES.POTATO_MINE },
    // At 4 damage this was strictly worse than the 50-Coin Jalapeno: more expensive, less
    // damage, and it failed to kill Screen Door and Football where the cheaper item did.
    // 6 makes 75 Coin mean something without coming near the boss's health.
    { id: 'cherry_bomb', name: 'Cherry Bomb', coinCost: 75, damage: 6, rangeRadius: 1, effect: 'BURN', description: 'Large explosion. Sets survivors on fire.', imgUrl: ITEM_SPRITES.CHERRY_BOMB },
    // 99 was an "instakill the lane" placeholder, and it read as one: piercing, whole-row,
    // 50 Coin, and it deleted the 10 HP Massive boss in a single click. Maw's Devour
    // already establishes the rule (App.tsx: burrow_strike does 1 to a Massive unit) — a
    // consumable must not assassinate a boss. At 5 it still clears an entire lane of chaff
    // (every zombie but Football and Gargantuar dies) and leaves the boss on half health,
    // so the lane-clear identity survives without the one-shot.
    { id: 'jalapeno', name: 'Jalapeno', coinCost: 50, damage: 5, rangeRadius: 0, effect: 'TERRAIN_MOD', description: 'Burns the whole row and turns it to Lava.', imgUrl: ITEM_SPRITES.JALAPENO },

    // --- Plants turned into one-shot power-ups (PvZ's own consumables) ---

    // Crowd control instead of damage. 1 damage on purpose: FREEZE now thaws the moment a
    // unit is hit (useGameEngine APPLY_DAMAGE), so a hard-hitting freeze would break its own
    // hold. The point is to buy a turn, not to kill.
    { id: 'snow_pea', name: 'Snow Pea', coinCost: 40, damage: 1, rangeRadius: 1, effect: 'FREEZE', description: 'Freezes everything in a 3x3. Frozen units lose their turn until something hits them.', imgUrl: ITEM_SPRITES.SNOW_PEA },

    // The strongest thing in the box, and priced for it. An extra action mid-crisis beats any
    // bomb here: it is a second Devour, a second wall of Armor, or the one move that reaches a
    // house before a zombie does. It grants an ACTION, never a turn — the battle clock is
    // untouched, which is what separates it from the Campfire's "+1 turn".
    { id: 'coffee_bean', name: 'Coffee Bean', coinCost: 100, damage: 0, rangeRadius: 0, effect: 'REFRESH', description: 'One hero that has already acted may move and act again this turn.', imgUrl: ITEM_SPRITES.COFFEE_BEAN },

    // The answer to Balloon Zombies, and a panic button for a collapsing line. Board-wide,
    // so it ignores the targeted tile entirely — the click only picks the wind direction.
    { id: 'blover', name: 'Blover', coinCost: 60, damage: 0, rangeRadius: 0, effect: 'GUST', description: 'A gust across the whole board: every flying zombie is blown away, every other one is shoved a tile back.', imgUrl: ITEM_SPRITES.BLOVER },
];