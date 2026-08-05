import { FusionEffect, HeroId, MaterialId } from '../types';

/**
 * The 10 x 10 fusion matrix.
 *
 * A fusion's effect depends on the PAIR, not on the material alone. This is the PvZ Fusion
 * idea applied where it is affordable: ten plants produce one hundred authored recipes from
 * ten sprites, instead of a bespoke asset for every result.
 *
 * Design rule for every row: the fusion answers that hero's *core weakness*.
 *   - Sunspot cannot attack and must be escorted -> her fusions arm or armour her.
 *   - Maw is helpless while digesting        -> her fusions all attack that window.
 *   - Ironhusk blocks but contributes little     -> her fusions make blocking pay.
 *   - Shadeleaf is a plain shooter               -> her fusions change what a shot does.
 *   - Cobb paid for her arc with reach, tempo and durability -> her fusions buy them back.
 *   - Thornquill sweeps a whole row but finishes nothing thick -> her fusions buy damage or
 *     extra shots.
 *   - Thornhide is only strong when the enemy comes to HIM -> his fusions make him last longer,
 *     hurt more to touch, and reach further when he calls.
 *   - Chardwall is close to harmless on a bare board -> his fusions hand him hazards, distance
 *     and slam damage. Never a damage number: 0 damage is the hero, not a gap (see the
 *     BONUS_DAMAGE note in utils/fusion.ts, which maps rather than appends for exactly this).
 *   - Gourdward is worth precisely what the ally he is covering is worth -> his fusions make
 *     the shell bigger, cheaper, and able to reach more people.
 *
 * SUN ECONOMY RULE: Sun is never paid for merely attacking. It comes from finishing something
 * off (SUN_ON_KILL) or from spending a whole turn on it (Harvest). Passive trickles are small
 * and belong to heroes that gave up offence for them.
 *
 * STUN RULE: no fusion grants a free stun, full stop. It used to be phrased as "nobody but
 * Frostpod", who owned `UPGRADE_SLOW_TO_FREEZE` (Blizzard) — every one of her attacks
 * becoming a lost turn, free, forever. She is retired (data/heroes.ts) and no recipe grants
 * that effect today; the engine still honours it because it is what the ICE element will
 * hand out. Either way the ban on new rows is unchanged, and for the same reason: a free
 * stun every turn is a lost turn every turn. New rows get ON_HIT_SLOW instead; see the note
 * on KERNEL_PULT.MAT_SNOW_PEA.
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
            name: 'Solar Pea',
            description: 'Gains a free ranged shot that deals 1 damage and gathers 10 Sun on hit.',
            effect: { type: 'GRANT_ATTACK', value: 0 },
            live: true,
        },
        MAT_CHOMPER: {
            name: 'Hungry Bloom',
            description: 'Hero skill costs 15 less Sun.',
            effect: { type: 'SKILL_DISCOUNT', value: 15 },
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
            description: 'Sun Burn slows whatever it lands on.',
            effect: { type: 'ON_HIT_SLOW' },
            live: true,
        },
        MAT_CORN: {
            name: 'Mortar Bloom',
            description: 'Sun Burn reaches 2 tiles further.',
            effect: { type: 'ATTACK_RANGE_BONUS', value: 2 },
            live: true,
        },
        MAT_CACTUS: {
            name: 'Needle Bloom',
            description: 'Sun Burn bursts into needles, dealing 4 damage to the target and 2 damage to surrounding tiles.',
            effect: { type: 'SKILL_SPLASH' },
            live: true,
        },
        MAT_ENDURIAN: {
            name: 'Thorned Bloom',
            description: 'Anything that hits her in melee is impaled for 2.',
            effect: { type: 'RETALIATE_DAMAGE', value: 2 },
            live: true,
        },
        MAT_CHARD: {
            name: 'Shoving Bloom',
            description: 'Sun Burn knocks whatever survives it a tile further away from her.',
            effect: { type: 'ON_HIT_PUSH', value: 1 },
            live: true,
        },
        MAT_PUMPKIN: {
            name: 'Gourd Bloom',
            description: '+3 max HP — the escort she has always needed, worn instead of assigned.',
            effect: { type: 'BONUS_HP', value: 3 },
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
            description: 'A second pea for 1 damage. If the first kills, it flies on to the next target.',
            // 2+1, and the second pea NEVER fizzles. The old failure mode: whenever the
            // first pea killed, the second resolved against a corpse and vanished — the
            // same click read 3 into a tank and 2 into a kill, which players filed as a
            // bug. A brief "both peas hit for 2" experiment fixed the optics but doubled
            // her free damage forever; the real fix keeps the 1 and re-aims instead — an
            // overkill second shot rolls over to the next body in the lane
            // (skillResolution's DOUBLE_ATTACK pass). Every shot now reads 2+1, always.
            effect: { type: 'DOUBLE_ATTACK', value: 1 },
            live: true,
        },
        MAT_CHOMPER: {
            name: 'Vampire Pea',
            description: 'Finishing off a zombie with a shot restores 1 HP or grants 1 Shield.',
            effect: { type: 'SHIELD_ON_KILL', value: 1 },
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
            description: 'Her shots slow the target — half movement for a turn.',
            effect: { type: 'ON_HIT_SLOW' },
            live: true,
        },
        MAT_CORN: {
            name: 'Mortar Pea',
            // 4, not 5: the arc formula is ceil(range/2) off her LINE 8, and the card must
            // print what the engine computes rather than a rounder-sounding number.
            description: 'Her shot arcs over anything in the way — with a range of 4 tiles.',
            effect: { type: 'ARC_ATTACK' },
            live: true,
        },
        MAT_CACTUS: {
            name: 'Spike Lane',
            description: 'Precision Blast leaves every tile it crosses spiked for two turns.',
            effect: { type: 'SPIKE_TRAIL' },
            live: true,
        },
        MAT_ENDURIAN: {
            name: 'Spineguard',
            description: 'Anything that hits her in melee is thrown a tile back — into the range she shoots at.',
            effect: { type: 'RETALIATE_PUSH' },
            live: true,
        },
        MAT_CHARD: {
            name: 'Sling Pea',
            description: 'Every shove she lands travels a tile further — take it with Pea-nut or Sling Pea.',
            effect: { type: 'PUSH_DISTANCE', value: 1 },
            live: true,
        },
        MAT_PUMPKIN: {
            name: 'Gourd Sniper',
            description: 'Every zombie she finishes off wraps her in 1 shield, up to 3 max.',
            effect: { type: 'SHIELD_ON_KILL', value: 1, cap: 3 },
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
            description: 'Gains 3 shield while digesting.',
            // The value IS the 3 on the card. It used to be a bare flag meaning "immune for
            // the whole window" — stronger than the text in the player's favour, which is
            // still a lie the player plans around.
            effect: { type: 'ARMOR_WHILE_DIGESTING', value: 3 },
            live: true,
        },
        MAT_SNOW_PEA: {
            name: 'Flash Freeze',
            description: 'Her bite slows the target — half movement for a turn.',
            effect: { type: 'ON_HIT_SLOW' },
            live: true,
        },
        MAT_CORN: {
            name: 'Buttered Hide',
            description: 'The first enemy that bites her per digesting turn is buttered stiff.',
            // Its own type, not RETALIATE_FREEZE: butter pins on the FIRST hit but only
            // guards the digest window, once per turn. The shared type is why this card and
            // Frostbite Armor drifted from the engine in opposite directions.
            effect: { type: 'BUTTER_RETALIATE' },
            live: true,
        },
        MAT_CACTUS: {
            name: 'Spineclamp',
            description: 'The tile she bites is left spiked for two turns.',
            effect: { type: 'SPIKE_TRAIL' },
            live: true,
        },
        MAT_ENDURIAN: {
            name: 'Bristleback',
            description: 'Anything that bites her takes 2 back — including through both digesting turns.',
            effect: { type: 'RETALIATE_DAMAGE', value: 2 },
            live: true,
        },
        MAT_CHARD: {
            name: 'Chard Gullet',
            description: 'Anything that hits her is hurled a tile back, digesting or not.',
            effect: { type: 'RETALIATE_PUSH' },
            live: true,
        },
        MAT_PUMPKIN: {
            name: 'Gourd Gut',
            description: 'Every kill wraps her in 2 shield, up to 4 max.',
            effect: { type: 'SHIELD_ON_KILL', value: 2, cap: 4 },
            live: true,
        },
    },

    // --- WALL-KNIGHT: blocks well, contributes little. Fusions make blocking pay. ---
    WALL_KNIGHT: {
        MAT_SUNFLOWER: {
            name: 'Sunstone Shield',
            description: 'Plugging a spawn hole pays 35 Sun — she is rewarded for standing on it.',
            effect: { type: 'SUN_ON_BLOCK_SPAWN', value: 35 },
            live: true,
        },
        MAT_PEASHOOTER: {
            name: 'Spear Bash',
            description: 'Shield Bash reaches 1 tile further while keeping its push.',
            effect: { type: 'ATTACK_RANGE_BONUS', value: 1 },
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
            description: 'Takes 1 less damage from every hit, reduces collision damage by 50%, and plugs spawn holes painlessly.',
            effect: { type: 'STEADFAST', value: 1 },
            live: true,
        },
        MAT_SNOW_PEA: {
            name: 'Frostbite Armor',
            description: 'Zombies that bite the wall are slowed (frozen on second hit).',
            effect: { type: 'RETALIATE_FREEZE' },
            live: true,
        },
        MAT_CORN: {
            name: 'Cob Turret',
            description: 'Gains a free ranged shot — the wall is no longer idle when nothing is next to it.',
            effect: { type: 'GRANT_ATTACK', value: 0 },
            live: true,
        },
        MAT_CACTUS: {
            name: 'Bramble Charge',
            description: 'Every tile she bashes or rolls through is left spiked for one turn.',
            effect: { type: 'SPIKE_TRAIL' },
            live: true,
        },
        MAT_ENDURIAN: {
            name: 'Spiked Bulwark',
            description: 'Shield Bash lands on every enemy beside her, not just the one she aimed at.',
            effect: { type: 'ADJACENT_STRIKE' },
            live: true,
        },
        MAT_CHARD: {
            name: 'Chard Bash',
            description: 'Every shove she makes travels a tile further — the bash throws 2, and so does the charge.',
            effect: { type: 'PUSH_DISTANCE', value: 1 },
            live: true,
        },
        MAT_PUMPKIN: {
            name: 'Pumpkin Shell',
            description: 'Takes 1 less damage from every hit and gains +2 max HP.',
            effect: { type: 'DAMAGE_REDUCTION', value: 1 },
            live: true,
        },
    },

    // --- COLD SNAP: delays everything, kills almost nothing. Fusions cash that control in. ---
    // --- COBB: the arc is free, everything else about her is short. Her fusions buy back
    //     the reach, the tempo and the durability that the trajectory cost her. ---
    KERNEL_PULT: {
        MAT_SUNFLOWER: {
            name: 'Buttered Sun',
            description: 'Butter Splat costs 15 less Sun.',
            effect: { type: 'SKILL_DISCOUNT', value: 15 },
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
            description: 'Her kernels slow the target — half movement for a turn.',
            effect: { type: 'ON_HIT_SLOW' },
            live: true,
        },
        MAT_CORN: {
            name: 'Cob Cannon',
            description: 'Butter Splat stuns the main target and slows surrounding tiles.',
            effect: { type: 'SKILL_SPLASH' },
            live: true,
        },
        MAT_CACTUS: {
            name: 'Longspine Cob',
            description: 'Every kernel reaches 1 tile further.',
            effect: { type: 'ATTACK_RANGE_BONUS', value: 1 },
            live: true,
        },
        MAT_ENDURIAN: {
            name: 'Durian Shot',
            description: '+1 damage on everything she throws.',
            effect: { type: 'BONUS_DAMAGE', value: 1 },
            live: true,
        },
        MAT_CHARD: {
            name: 'Chard Recoil',
            description: 'Anything that hits her in melee is thrown a tile back.',
            effect: { type: 'RETALIATE_PUSH' },
            live: true,
        },
        MAT_PUMPKIN: {
            name: 'Gourd Battery',
            description: 'Every kernel that finishes a zombie off wraps her in 1 shield, up to 3 max.',
            effect: { type: 'SHIELD_ON_KILL', value: 1, cap: 3 },
            live: true,
        },
    },

    // --- THORNQUILL: pierces a whole row for free, and cannot finish anything thick. Her
    //     fusions buy damage or extra shots — and one of them buys the ground itself. ---
    THORNQUILL: {
        MAT_SUNFLOWER: {
            name: 'Sunspine',
            description: 'Every zombie her row-sweep finishes off pays 15 Sun.',
            effect: { type: 'SUN_ON_KILL', value: 15 },
            live: true,
        },
        MAT_PEASHOOTER: {
            name: 'Repeating Quill',
            description: 'A second spine follows down the same row for 1 damage.',
            effect: { type: 'DOUBLE_ATTACK', value: 1 },
            live: true,
        },
        MAT_CHOMPER: {
            name: 'Barbed Quill',
            description: '+1 damage — one sweep now kills a whole row of 2-hp zombies.',
            effect: { type: 'BONUS_DAMAGE', value: 1 },
            live: true,
        },
        MAT_WALLNUT: {
            name: 'Barrel Cactus',
            description: '+3 max HP — she has to stand in the row she is sweeping.',
            effect: { type: 'BONUS_HP', value: 3 },
            live: true,
        },
        MAT_SNOW_PEA: {
            name: 'Frostquill',
            description: 'Her spine slows the first zombie hit in the row — half movement for a turn.',
            effect: { type: 'ON_HIT_SLOW' },
            live: true,
        },
        MAT_CORN: {
            name: 'Longbarrel Quill',
            description: 'Her spine runs 2 tiles further — end to end, that is the whole board.',
            effect: { type: 'ATTACK_RANGE_BONUS', value: 2 },
            live: true,
        },
        MAT_CACTUS: {
            name: 'Spikeweed',
            description: 'Spine Wall leaves every tile it flies through spiked for two turns.',
            effect: { type: 'SPIKE_TRAIL' },
            live: true,
        },
        MAT_ENDURIAN: {
            name: 'Bristlequill',
            description: 'Anything that hits her in melee is impaled for 2.',
            effect: { type: 'RETALIATE_DAMAGE', value: 2 },
            live: true,
        },
        MAT_CHARD: {
            name: 'Sweeping Spine',
            description: 'The first zombie hit in the row is shoved a tile back.',
            effect: { type: 'ON_HIT_PUSH', value: 1 },
            live: true,
        },
        MAT_PUMPKIN: {
            name: 'Gourd Quill',
            description: 'Every zombie she finishes off wraps her in 1 shield, up to 3 max.',
            effect: { type: 'SHIELD_ON_KILL', value: 1, cap: 3 },
            live: true,
        },
    },

    // --- THORNHIDE: catches nobody on his own, and is deadly the moment the enemy chooses to
    //     come to him. His fusions make him last longer, hurt more to touch, and call louder. ---
    THORNHIDE: {
        MAT_SUNFLOWER: {
            name: 'Sunlit Thorn',
            description: 'Provoke costs 15 less Sun.',
            effect: { type: 'SKILL_DISCOUNT', value: 15 },
            live: true,
        },
        MAT_PEASHOOTER: {
            name: 'Twin Thorn',
            description: 'His swipe lands a second time for 1 damage.',
            effect: { type: 'DOUBLE_ATTACK', value: 1 },
            live: true,
        },
        MAT_CHOMPER: {
            name: 'Gnashing Husk',
            description: 'His free swipe hits every enemy standing beside him.',
            effect: { type: 'ADJACENT_STRIKE' },
            live: true,
        },
        MAT_WALLNUT: {
            name: 'Ironthorn',
            description: '+3 max HP — 13, the largest body in the game, because everything is aimed at it.',
            effect: { type: 'BONUS_HP', value: 3 },
            live: true,
        },
        MAT_SNOW_PEA: {
            name: 'Chill Thorns',
            description: 'His swipe slows the target — half movement for a turn.',
            effect: { type: 'ON_HIT_SLOW' },
            live: true,
        },
        MAT_CORN: {
            name: 'Reaching Thorn',
            description: 'His swipe reaches 2 tiles instead of 1.',
            effect: { type: 'ATTACK_RANGE_BONUS', value: 1 },
            live: true,
        },
        MAT_CACTUS: {
            name: 'Needlecoat',
            description: 'Melee attackers are hurled a tile back as well as bled.',
            effect: { type: 'RETALIATE_PUSH' },
            live: true,
        },
        MAT_ENDURIAN: {
            name: 'Spiked Endurian',
            description: 'Melee attackers take 3 back instead of 2.',
            effect: { type: 'RETALIATE_DAMAGE', value: 1 },
            live: true,
        },
        MAT_CHARD: {
            name: 'Far Provoke',
            description: 'Provoke reaches 4 tiles instead of 3.',
            effect: { type: 'TAUNT_RADIUS', value: 1 },
            live: true,
        },
        MAT_PUMPKIN: {
            name: 'Gourd Husk',
            description: 'Every zombie he finishes off with a swipe wraps him in 1 shield, up to 3 max.',
            effect: { type: 'SHIELD_ON_KILL', value: 1, cap: 3 },
            live: true,
        },
    },

    // --- CHARDWALL: 0 damage is the hero. His row buys hazards, distance and slam damage —
    //     never a damage number, which utils/fusion.ts enforces on its side as well. ---
    CHARDWALL: {
        MAT_SUNFLOWER: {
            name: 'Sunlit Guard',
            description: 'Every zombie he shoves into water, rock or another body pays 15 Sun.',
            effect: { type: 'SUN_ON_KILL', value: 15 },
            live: true,
        },
        MAT_PEASHOOTER: {
            name: 'Longarm Chard',
            description: 'Backswing reaches 2 tiles — he throws without stepping into contact.',
            effect: { type: 'ATTACK_RANGE_BONUS', value: 1 },
            live: true,
        },
        MAT_CHOMPER: {
            name: 'Snapping Guard',
            description: 'Melee attackers take 2 back.',
            effect: { type: 'RETALIATE_DAMAGE', value: 2 },
            live: true,
        },
        MAT_WALLNUT: {
            name: 'Bulwark Chard',
            description: '+3 max HP — he has to walk into contact to do anything at all.',
            effect: { type: 'BONUS_HP', value: 3 },
            live: true,
        },
        MAT_SNOW_PEA: {
            name: 'Frostguard',
            description: 'Anything that hits him in melee is slowed (frozen on second hit).',
            effect: { type: 'RETALIATE_FREEZE' },
            live: true,
        },
        MAT_CORN: {
            name: 'Cob Catapult',
            description: 'Every shove he throws travels a tile further — 3 from the swing, 3 from the sweep.',
            effect: { type: 'PUSH_DISTANCE', value: 1 },
            live: true,
        },
        MAT_CACTUS: {
            name: 'Bramble Guard',
            description: 'The tiles he sweeps are left spiked for one turn.',
            effect: { type: 'SPIKE_TRAIL' },
            live: true,
        },
        MAT_ENDURIAN: {
            name: 'Thorned Guard',
            description: 'Melee attackers are thrown a tile back.',
            effect: { type: 'RETALIATE_PUSH' },
            live: true,
        },
        MAT_CHARD: {
            name: 'Grand Chard',
            description: 'Anything he slams into a body, a rock or the map edge takes 2 extra damage.',
            effect: { type: 'COLLISION_BONUS', value: 2 },
            live: true,
        },
        MAT_PUMPKIN: {
            name: 'Gourd Guard',
            description: 'Takes 1 less damage from every hit.',
            effect: { type: 'DAMAGE_REDUCTION', value: 1 },
            live: true,
        },
    },

    // --- GOURDWARD: worth exactly what the ally he is covering is worth. His fusions make the
    //     shell bigger, cheaper and able to reach more people — and give him a floor of his own. ---
    GOURDWARD: {
        MAT_SUNFLOWER: {
            name: 'Sunlit Shell',
            description: 'Encase costs 15 less Sun.',
            effect: { type: 'SKILL_DISCOUNT', value: 15 },
            live: true,
        },
        MAT_PEASHOOTER: {
            name: 'Rind Repeater',
            description: 'His bash lands a second time for 1 damage.',
            effect: { type: 'DOUBLE_ATTACK', value: 1 },
            live: true,
        },
        MAT_CHOMPER: {
            name: 'Fanged Gourd',
            description: '+1 damage — 2 a swing, so he cannot simply be walked past.',
            effect: { type: 'BONUS_DAMAGE', value: 1 },
            live: true,
        },
        MAT_WALLNUT: {
            name: 'Ironrind',
            description: '+3 max HP — the shell around the ally only lasts while its carrier does.',
            effect: { type: 'BONUS_HP', value: 3 },
            live: true,
        },
        MAT_SNOW_PEA: {
            name: 'Frostrind',
            description: 'His bash slows the target — half movement for a turn.',
            effect: { type: 'ON_HIT_SLOW' },
            live: true,
        },
        MAT_CORN: {
            name: 'Gourd Cannon',
            description: 'Encase also shells everyone standing beside the target for 2 shield.',
            effect: { type: 'SKILL_SPLASH' },
            live: true,
        },
        MAT_CACTUS: {
            name: 'Thornrind',
            description: 'The tile he bashes is left spiked for two turns — a hazard laid in front of whoever he is covering.',
            effect: { type: 'SPIKE_TRAIL' },
            live: true,
        },
        MAT_ENDURIAN: {
            name: 'Spined Shell',
            description: 'Anything that hits him takes 2 back — going through him to reach his ward costs.',
            effect: { type: 'RETALIATE_DAMAGE', value: 2 },
            live: true,
        },
        MAT_CHARD: {
            name: 'Chard Rind',
            description: 'His bash shoves the target a tile back — off whoever he is guarding.',
            effect: { type: 'ON_HIT_PUSH', value: 1 },
            live: true,
        },
        MAT_PUMPKIN: {
            name: 'Great Gourd',
            description: 'Every shield he hands out is 2 bigger — 7 instead of 5.',
            effect: { type: 'SHIELD_BONUS', value: 2 },
            live: true,
        },
    },
};

export const getRecipe = (heroId: HeroId | undefined, materialId: MaterialId): FusionRecipe | null => {
    if (!heroId) return null;
    return FUSION_RECIPES[heroId]?.[materialId] ?? null;
};
