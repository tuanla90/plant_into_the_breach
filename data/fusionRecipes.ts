import { FusionEffect, HeroId, MaterialId } from '../types';

/**
 * The 5 x 5 fusion matrix.
 *
 * A fusion's effect depends on the PAIR, not on the material alone. This is the PvZ Fusion
 * idea applied where it is affordable: five plants produce twenty-five authored recipes from
 * five sprites, instead of four hundred bespoke ones.
 *
 * Design rule for every row: the fusion answers that hero's *core weakness*.
 *   - Sunspot cannot attack and must be escorted -> her fusions arm or armour her.
 *   - Maw is helpless while digesting        -> her fusions all attack that window.
 *   - Ironhusk blocks but contributes little     -> her fusions make blocking pay.
 *   - Shadeleaf is a plain shooter               -> her fusions change what a shot does.
 *   - Frostpod delays but barely damages           -> her fusions convert control into value.
 *
 * SUN ECONOMY RULE: Sun is never paid for merely attacking. It comes from finishing something
 * off (SUN_ON_KILL) or from spending a whole turn on it (Harvest). Passive trickles are small
 * and belong to heroes that gave up offence for them.
 *
 * `live: false` marks a recipe whose effect is authored but not yet wired into combat.
 */
export interface FusionRecipe {
    name: string;
    description: string;
    effect: FusionEffect;
    /** False while the effect exists as data but does nothing in a fight yet. */
    live: boolean;
}

type Matrix = Record<HeroId, Record<MaterialId, FusionRecipe>>;

export const FUSION_RECIPES: Matrix = {
    // --- SOLAR FLARE: no attack, must be protected. Every fusion fixes one of those. ---
    SOLAR_FLARE: {
        MAT_SUNFLOWER: {
            name: 'Twin Sunflower',
            description: 'Harvest yields two suns instead of one — 25 more per turn.',
            // Stacks with her free Harvest for 50/turn total, but she still spends the action.
            effect: { type: 'SUN_PER_TURN', value: 25 },
            live: true,
        },
        MAT_PEASHOOTER: {
            name: 'Sun Shooter',
            description: 'Gains a ranged shot — but every shot spends 25 Sun.',
            effect: { type: 'GRANT_ATTACK', value: 25 },
            live: true,
        },
        MAT_CHOMPER: {
            name: 'Hungry Bloom',
            description: 'Hero skill costs 25 less Sun.',
            effect: { type: 'SKILL_DISCOUNT', value: 25 },
            live: true,
        },
        MAT_WALLNUT: {
            name: 'Armored Bloom',
            description: 'Takes 1 less damage from every hit.',
            effect: { type: 'DAMAGE_REDUCTION', value: 1 },
            live: true,
        },
        MAT_SNOW_PEA: {
            name: 'Winter Flare',
            description: 'Sun Burn freezes whatever it lands on.',
            effect: { type: 'ON_HIT_FREEZE' },
            live: true,
        },
        MAT_CORN: {
            name: 'Mortar Bloom',
            // The arc is useless to her — Sun Burn is already lobbed. What the catapult arm
            // gives her instead is REACH, which answers the escort problem at its root: the
            // further back she can stand, the less of the squad has to stand around her.
            description: 'Sun Burn reaches 2 tiles further.',
            effect: { type: 'ATTACK_RANGE_BONUS', value: 2 },
            live: true,
        },
    },

    // --- GREEN SHADOW: a plain shooter. Fusions change what a shot *does*. ---
    GREEN_SHADOW: {
        MAT_SUNFLOWER: {
            name: 'Sunbeam Pea',
            description: 'Harvests 15 Sun whenever a shot finishes a zombie off.',
            // Deliberately on the kill, not the hit: shooting alone must never pay.
            effect: { type: 'SUN_ON_KILL', value: 15 },
            live: true,
        },
        MAT_PEASHOOTER: {
            name: 'Repeater',
            description: 'The basic shot fires two full peas.',
            // A true double: both peas hit for her full 2. It used to be 2+1 to keep the
            // other fusions competitive, but the mismatched second number read as a BUG in
            // play — the same click dealt 3 into a tank and 2 into anything the first pea
            // killed, and a player watching the popups cannot tell design from glitch.
            // Consistency wins; the tutorial boss's HP is asserted against this value, so
            // the scripted defeat stays arithmetically real either way.
            effect: { type: 'DOUBLE_ATTACK', value: 2 },
            live: true,
        },
        MAT_CHOMPER: {
            name: 'Snapping Pea',
            description: 'Anything she hits is dragged one tile toward her.',
            effect: { type: 'ON_HIT_PUSH', value: -1 },
            live: true,
        },
        MAT_WALLNUT: {
            name: 'Pea-nut',
            description: 'Her shots knock the target back a tile — every hit buys ground.',
            effect: { type: 'ON_HIT_PUSH', value: 1 },
            live: true,
        },
        MAT_SNOW_PEA: {
            name: 'Frost Pea',
            // Was a full freeze — a permanent lockdown on one zombie for zero Sun.
            // A slow keeps the tempo advantage without deleting the target.
            description: 'Her shots slow the target — half movement for a turn.',
            effect: { type: 'ON_HIT_SLOW' },
            live: true,
        },
        MAT_CORN: {
            name: 'Mortar Pea',
            // The single fusion that fixes the game's oldest self-inflicted problem: the brain
            // rule tells you to plug the corridor with Ironhusk, and Ironhusk then stands
            // directly in Shadeleaf's line. Now the pea goes over her.
            description: 'Her shot arcs over anything in the way — at half the range.',
            effect: { type: 'ARC_ATTACK' },
            live: true,
        },
    },

    // --- CHOMPZILLA: helpless for 2 turns after eating. Every fusion attacks that window. ---
    CHOMPZILLA: {
        MAT_SUNFLOWER: {
            name: 'Photosynthetic Gut',
            description: 'Digesting is productive: 15 Sun per turn while she chews.',
            effect: { type: 'SUN_PER_TURN', value: 15 },
            live: true,
        },
        MAT_PEASHOOTER: {
            name: 'Spitter',
            description: 'Gains a short-range spit she can still use while digesting.',
            effect: { type: 'GRANT_ATTACK', value: 0 },
            live: true,
        },
        MAT_CHOMPER: {
            name: 'Double Jaw',
            description: 'Swallows in half the time — digests for 1 turn instead of 2.',
            effect: { type: 'DIGEST_REDUCTION', value: 1 },
            live: true,
        },
        MAT_WALLNUT: {
            name: 'Shelled Chomper',
            description: 'Immune to damage while digesting.',
            effect: { type: 'ARMOR_WHILE_DIGESTING' },
            live: true,
        },
        MAT_SNOW_PEA: {
            name: 'Flash Freeze',
            description: 'Her bite leaves the target frozen — cover while she chews.',
            effect: { type: 'ON_HIT_FREEZE' },
            live: true,
        },
        MAT_CORN: {
            name: 'Buttered Hide',
            // Nothing to arc — she is melee. The butter goes on her back instead, and it
            // covers the two turns she cannot defend herself at all.
            description: 'Anything that bites her is buttered stiff — including while she digests.',
            effect: { type: 'RETALIATE_FREEZE' },
            live: true,
        },
    },

    // --- WALL-KNIGHT: blocks well, contributes little. Fusions make blocking pay. ---
    WALL_KNIGHT: {
        MAT_SUNFLOWER: {
            name: 'Sunstone Shield',
            description: 'Plugging a spawn hole pays 50 Sun — she is rewarded for standing on it.',
            // Ties the economy to the spawn-blocking mechanic, which already existed but paid
            // nothing. Conditional by design: no block, no Sun.
            effect: { type: 'SUN_ON_BLOCK_SPAWN', value: 50 },
            live: true,
        },
        MAT_PEASHOOTER: {
            name: 'Pea Lance',
            description: 'Shield Bash reaches 1 tile further — but loses its push.',
            // Reach is bought WITH the push, not stacked on it: the bash becomes a poke.
            effect: { type: 'MELEE_REACH_TRADE', value: 1 },
            live: true,
        },
        MAT_CHOMPER: {
            name: 'Biting Wall',
            description: 'Bites back: melee attackers take 2 damage.',
            effect: { type: 'RETALIATE_DAMAGE', value: 2 },
            live: true,
        },
        MAT_WALLNUT: {
            name: 'Iron Bulwark',
            description: 'Takes 1 less damage from every hit, is never hurt by collisions, and plugs spawn holes painlessly.',
            effect: { type: 'STEADFAST', value: 1 },
            live: true,
        },
        MAT_SNOW_PEA: {
            name: 'Frostbite Armor',
            description: 'Zombies that bite the wall freeze solid.',
            effect: { type: 'RETALIATE_FREEZE' },
            live: true,
        },
        MAT_CORN: {
            name: 'Cob Turret',
            // The wall's whole problem is that everything it is good at happens at range 1.
            // A free ranged shot means holding the corridor is no longer the same as being
            // switched off for the turn.
            description: 'Gains a free ranged shot — the wall is no longer idle when nothing is next to it.',
            effect: { type: 'GRANT_ATTACK', value: 0 },
            live: true,
        },
    },

    // --- COLD SNAP: delays everything, kills almost nothing. Fusions cash that control in. ---
    COLD_SNAP: {
        MAT_SUNFLOWER: {
            name: 'Glacial Bloom',
            description: 'Harvests 15 Sun whenever a shot finishes a zombie off.',
            effect: { type: 'SUN_ON_KILL', value: 15 },
            live: true,
        },
        MAT_PEASHOOTER: {
            name: 'Frost Repeater',
            description: 'Ice Shot fires a second, weaker shot for 1 damage — another target delayed, or one hit harder.',
            effect: { type: 'DOUBLE_ATTACK', value: 1 },
            live: true,
        },
        MAT_CHOMPER: {
            name: 'Brittle Bite',
            description: '+2 damage — the one fusion that lets her actually finish a kill.',
            effect: { type: 'BONUS_DAMAGE', value: 2 },
            live: true,
        },
        MAT_WALLNUT: {
            name: 'Icicle Wall',
            description: '+3 max HP — she can stand in the front rank she is slowing.',
            effect: { type: 'BONUS_HP', value: 3 },
            live: true,
        },
        MAT_SNOW_PEA: {
            name: 'Blizzard',
            description: 'Her slow becomes a full freeze — targets lose the turn entirely.',
            effect: { type: 'UPGRADE_SLOW_TO_FREEZE' },
            live: true,
        },
        MAT_CORN: {
            name: 'Arcing Frost',
            description: 'Ice Shot arcs over anything in the way — at half the range.',
            effect: { type: 'ARC_ATTACK' },
            live: true,
        },
    },

    // --- COBB: the arc is free, everything else about her is short. Her fusions buy back
    //     the reach, the tempo and the durability that the trajectory cost her. ---
    KERNEL_PULT: {
        MAT_SUNFLOWER: {
            name: 'Buttered Sun',
            // Her whole ceiling is how often she can afford to pin something. At 25 the butter
            // becomes a play she can make most turns instead of a once-a-fight event.
            description: 'Butter Splat costs 25 less Sun.',
            effect: { type: 'SKILL_DISCOUNT', value: 25 },
            live: true,
        },
        MAT_PEASHOOTER: {
            name: 'Twin Cob',
            description: 'The kernel is followed by a second, lighter one for 1 damage.',
            effect: { type: 'DOUBLE_ATTACK', value: 1 },
            live: true,
        },
        MAT_CHOMPER: {
            name: 'Cob Grinder',
            description: 'Bites back: melee attackers take 2 damage.',
            effect: { type: 'RETALIATE_DAMAGE', value: 2 },
            live: true,
        },
        MAT_WALLNUT: {
            name: 'Cob Bunker',
            description: '+3 max HP — artillery that has to stand this close needs to survive being reached.',
            effect: { type: 'BONUS_HP', value: 3 },
            live: true,
        },
        MAT_SNOW_PEA: {
            name: 'Frostbutter',
            // DELIBERATELY a slow and not a freeze. Frostpod's entire ceiling is Blizzard —
            // every attack becoming a stun, free, forever. Handing Cobb a free stun on every
            // arcing shot would be that ceiling, on a better chassis, three recipes early.
            description: 'Her kernels slow the target — half movement for a turn.',
            effect: { type: 'ON_HIT_SLOW' },
            live: true,
        },
        MAT_CORN: {
            name: 'Cob Cannon',
            description: 'Butter Splat also hits the four tiles around the target.',
            effect: { type: 'SKILL_SPLASH' },
            live: true,
        },
    },
};

export const getRecipe = (heroId: HeroId | undefined, materialId: MaterialId): FusionRecipe | null => {
    if (!heroId) return null;
    return FUSION_RECIPES[heroId]?.[materialId] ?? null;
};
