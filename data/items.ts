
import { ItemDefinition, WorldType } from '../types';
import { ICONS, ITEM_SPRITES } from '../utils/icons';

/**
 * WHICH GROUND TEACHES WHICH TOOL. First arrival in a sector permanently unlocks its item
 * (shops and camps only shelve what is unlocked — utils/unlockLogic.ts) and hands the run
 * one free copy. Each pairing is the sector's own lesson:
 *
 *   GRASS    Magnet     Bucketheads are act I's armour — the counter arrives with the threat.
 *   DESERT   Spikeweed  A rail is a guaranteed path; spikes on it are guaranteed damage.
 *   VOLCANO  Snow Pea   Cold against the fire sector, and a freeze keeps feet out of lava.
 *   COAST    Blover     The flier act. Wind is the direct answer, and the sea is right there.
 *   THORN    Aloe       Mid-game is when squads start bleeding; DUST also blinds every gun,
 *                       and items are the one thing the veil cannot stop.
 *   ICE      Jalapeno   Fire against the ice sector; its lava turns the map's own gusts hostile.
 *   NEON     Hypno      SPOTLIGHT points the whole crowd at one hero — steal a body from it.
 *   RUIN     Cherry     Collapse packs the alley tighter every round. Clumps meet the bomb.
 *   GRID     Coffee     The overload race — one extra action at the right moment is the fight.
 *   BREACH   Doom       The gauntlet's entry gift: nine bosses beaten buys the red button.
 *
 * The tutorial's Potato Mine rides the Chrono Echo instead (utils/persistence.ts) — the
 * scripted defeat mints it, so it needs no ground of its own here.
 */
export const SECTOR_ITEM: Record<WorldType | 'BREACH', string> = {
    GRASS: 'magnet_shroom',
    DESERT: 'spikeweed',
    VOLCANO: 'snow_pea',
    COAST: 'blover',
    THORN: 'aloe',
    ICE: 'jalapeno',
    NEON: 'hypno_shroom',
    RUIN: 'cherry_bomb',
    GRID: 'coffee_bean',
    BREACH: 'doom_shroom',
};

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
    // (every common in the game dies to it, the Gargantuar does not) and leaves the boss on
    // half health, so the lane-clear identity survives without the one-shot.
    { id: 'jalapeno', name: 'Jalapeno', coinCost: 50, damage: 5, rangeRadius: 0, effect: 'TERRAIN_MOD', description: 'Burns the whole row and turns it to Lava.', imgUrl: ITEM_SPRITES.JALAPENO },

    // --- Plants turned into one-shot power-ups (PvZ's own consumables) ---

    // Crowd control instead of damage. 1 damage on purpose: FREEZE now thaws the moment a
    // unit is hit (useGameEngine APPLY_DAMAGE), so a hard-hitting freeze would break its own
    // hold. The point is to buy a turn, not to kill.
    //
    // 50 Coin and a 5x5, up from 40 and a 3x3 (rebalance 2026-08-06): in role this is the
    // ICE-SHROOM — PvZ's whole-screen freeze — not a pea shooter, so its blast matches the
    // Doom-shroom's footprint and its price sits exactly on the Jalapeno, its elemental
    // opposite number. A freeze this wide stays honest for the same reason the damage is 1:
    // every unit you hit afterwards thaws itself, so the radius scales CONTROL, not kills —
    // 25 tiles of stopped clocks is a plan, not a wipe.
    { id: 'snow_pea', name: 'Snow Pea', coinCost: 50, damage: 1, rangeRadius: 2, effect: 'FREEZE', description: 'Freezes everything in a 5x5, allies included — ICE heroes shrug it off. Frozen units lose their turn until something hits them.', imgUrl: ITEM_SPRITES.SNOW_PEA },

    // The strongest thing in the box, and priced for it. An extra action mid-crisis beats any
    // bomb here: it is a second Devour, a second wall of Armor, or the one move that reaches a
    // house before a zombie does. It grants an ACTION, never a turn — the battle clock is
    // untouched, which is what separates it from the Campfire's "+1 turn".
    { id: 'coffee_bean', name: 'Coffee Bean', coinCost: 100, damage: 0, rangeRadius: 0, effect: 'REFRESH', description: 'One hero that has already acted may move and act again this turn.', imgUrl: ITEM_SPRITES.COFFEE_BEAN },

    // The answer to Balloon Zombies, and a panic button for a collapsing line. Board-wide,
    // so it ignores the targeted tile entirely — the click only picks the wind direction.
    { id: 'blover', name: 'Blover', coinCost: 60, damage: 0, rangeRadius: 0, effect: 'GUST', description: 'A gust across the whole board: every flying zombie is blown away, every other one is shoved a tile back.', imgUrl: ITEM_SPRITES.BLOVER },

    // Area hazard: lays sharp spikes on a tile. Any zombie stepping or pushed across takes 2 damage per turn. Lasts 3 turns.
    { id: 'spikeweed', name: 'Spikeweed', coinCost: 35, damage: 2, rangeRadius: 0, effect: 'SPIKES', description: 'Lays a field of sharp spikes on a tile. Any zombie entering or pushed across takes 2 damage per turn. Lasts 3 turns.', imgUrl: ITEM_SPRITES.SPIKEWEED },

    // Mind control: turns a target non-boss zombie into an ally that attacks other zombies.
    { id: 'hypno_shroom', name: 'Hypno-shroom', coinCost: 65, damage: 0, rangeRadius: 0, effect: 'HYPNO', description: 'Mind-controls a non-boss zombie: turns it into an ally that attacks other zombies.', imgUrl: ITEM_SPRITES.HYPNO_SHROOM },

    // Disarms the horde's METAL, and metal now means exactly three armoured commons —
    // Buckethead, Screen Door, Football (data/zombies.ts: armour is metal, the plastic cone
    // is not) — plus the immunities gear grants a regular zombie: a Catapult's PUSH chassis,
    // a Screen Door's STATUS door (METAL_IMMUNITIES, utils/itemResolution.ts). Bosses keep
    // their immunities — each carries exactly one and it is load-bearing (data/zombies.ts),
    // and a 50-Coin click that makes a boss shovable would end fights the way the 99-damage
    // Jalapeno used to.
    { id: 'magnet_shroom', name: 'Magnet-shroom', coinCost: 50, damage: 0, rangeRadius: 1, effect: 'STRIP_ARMOR', description: 'Rips the metal off zombies in a 3x3 area: armor, shields, and the Push/Status immunities of regular zombies. Bosses keep their gear.', imgUrl: ITEM_SPRITES.MAGNET_SHROOM },

    // The roster's ONLY sustain. Every other coin sink answers a zombie; this one answers
    // the 75-Coin revive bill before it exists. 3, not more: a heal that outpaces a
    // Gargantuar swing (5) would turn tanking into an economy, not an emergency.
    // Numbers are a first pass — the table is being tuned live (design call, 2026-08-06).
    { id: 'aloe', name: 'Aloe', coinCost: 50, damage: 3, rangeRadius: 0, effect: 'HEAL', description: 'Soothes one wounded ally, restoring 3 health.', imgUrl: ITEM_SPRITES.ALOE },

    // THE RED BUTTON, and the Breach's entry gift. Expensive on purpose: the Breach has no
    // shops, so 125 Coin is bought INSTEAD of a revive-and-change at a paid camp.
    // Guardrails over raw power, per this file's oldest law ("a consumable must not
    // assassinate a boss"): full 8 pierces everything ordinary off the board, bosses take a
    // hard-capped bite instead (utils/itemResolution.ts), allies burn like anyone else, and
    // the crater is real — the inner 3x3 turns to lava, which is a GIFT to one boss in
    // particular (the Colossus heals on it). A nuke you must aim with your feet.
    { id: 'doom_shroom', name: 'Doom-shroom', coinCost: 125, damage: 8, rangeRadius: 2, effect: 'NUKE', description: 'A nuclear blast: 8 piercing damage to everything in a 5x5 area — allies too, bosses only flinch. The crater turns to lava.', imgUrl: ITEM_SPRITES.DOOM_SHROOM },
];