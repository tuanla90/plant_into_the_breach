import { FusionEffect, HeroId, MaterialId } from '../types';

/**
 * The 9 x 9 fusion matrix.
 *
 * A fusion's effect depends on the PAIR, not on the material alone. This is the PvZ Fusion
 * idea applied where it is affordable: nine plants produce eighty-one authored recipes from
 * nine sprites, instead of a bespoke asset for every result. (It was 10x10 until Snow Pea
 * retired with Frostpod — nine heroes, nine gears, no orphan; PLAN-hero-zephyr §9.)
 *
 * TWO-ITEM GEAR RULE (PLAN-hero-zephyr §4): each gear is two traits of the ONE hero it
 * belongs to — item A from their basic attack, item B from their paid skill — and every cell
 * picks whichever fits the recipient. Cells where neither fits are exceptions with their
 * reason written beside them.
 *
 * Design rule for every row: the fusion answers that hero's *core weakness*.
 *   - Sunspot cannot attack and must be escorted -> her fusions arm or armour her.
 *   - Maw is helpless while digesting        -> her fusions all attack that window.
 *   - Ironhusk blocks but contributes little     -> her fusions make blocking pay.
 *   - Shadeleaf is a plain shooter               -> her fusions change what a shot does.
 *   - Cobb paid for her arc with reach, tempo and durability -> her fusions buy them back.
 *   - Zephyr is paper on wings and must fly into the pocket her guns want -> her fusions buy
 *     survival, exits, and ways to hold a formation still.
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
 * stun every turn is a lost turn every turn. New rows get ON_HIT_SLOW instead. (The Snow
 * Pea gear that once carried the note is retired with its column — §9.)
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
        MAT_CORN: {
            name: 'Mortar Bloom',
            description: 'Solar Blessing reaches 2 tiles further.',
            effect: { type: 'ATTACK_RANGE_BONUS', value: 2 },
            live: true,
        },
        MAT_CATTAIL: {
            name: 'Ashveil',
            // Ally-centred dust lands as a RING around the recipient, never on them —
            // skillResolution's rule, or the veil would disarm the very body it blesses.
            description: 'Solar Blessing wraps the tiles around its ally in dust — nothing standing beside them can swing.',
            effect: { type: 'SKILL_DISARM' },
            live: true,
        },
        MAT_ENDURIAN: {
            name: 'Thorned Bloom',
            description: 'Anything that hits her in melee is impaled for 2.',
            effect: { type: 'RETALIATE_DAMAGE', value: 2 },
            live: true,
        },
        MAT_CHARD: {
            // Was Shoving Bloom (ON_HIT_PUSH) — a rider with nothing to ride once her kit
            // stopped touching enemies. The chard stem turns defensive: leverage as an exit.
            name: 'Guarded Bloom',
            description: 'Melee attackers are thrown a tile back — the battery buys herself an exit.',
            effect: { type: 'RETALIATE_PUSH' },
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
            // Was Vampire Pea (SHIELD_ON_KILL) — under the layer model that duplicated her
            // own Gourd Sniper cell, so the jaws take their true axis here instead.
            name: 'Serrated Pea',
            description: 'Her shots leave the target bleeding: the next hit against it lands +1.',
            effect: { type: 'BLEED_ON_HIT' },
            live: true,
        },
        MAT_WALLNUT: {
            name: 'Pea-nut',
            description: 'Her shots knock the target back a tile — every hit buys ground.',
            effect: { type: 'ON_HIT_PUSH', value: 1 },
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
        MAT_CATTAIL: {
            name: 'Smokeline',
            description: 'Precision Blast leaves the lane it crossed hanging with dust — nothing inside can swing.',
            effect: { type: 'SKILL_DISARM' },
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
            description: 'Every zombie she finishes off shells her in a layer — the next hit is blocked in full.',
            effect: { type: 'SHIELD_ON_KILL', value: 1 },
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
            description: 'Digestion begins behind a fresh layer — the first blow of the helpless window is blocked in full.',
            // Once a bare flag meaning "immune for the whole window" (a lie in the player's
            // favour), then a numbered 3-shield; now a LAYER (§6.0). The window stays a
            // window: one blow eaten, everything after lands.
            effect: { type: 'ARMOR_WHILE_DIGESTING' },
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
        MAT_CATTAIL: {
            name: 'Prowl Drive',
            description: '+1 move — she has to reach the meal before she can eat it, and digesting roots her after.',
            effect: { type: 'MOVE_BONUS', value: 1 },
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
            description: 'Every kill shells her in a layer — the next hit is blocked in full.',
            effect: { type: 'SHIELD_ON_KILL', value: 1 },
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
            name: 'Rending Bash',
            description: 'Her bash leaves the target bleeding: the next hit against it lands +1.',
            effect: { type: 'BLEED_ON_HIT' },
            live: true,
        },
        MAT_WALLNUT: {
            name: 'Iron Bulwark',
            description: 'Takes 1 less damage from every hit, reduces collision damage by 50%, and plugs spawn holes painlessly.',
            effect: { type: 'STEADFAST', value: 1 },
            live: true,
        },
        MAT_CORN: {
            name: 'Cob Turret',
            description: 'Gains a free ranged shot — the wall is no longer idle when nothing is next to it.',
            effect: { type: 'GRANT_ATTACK', value: 0 },
            live: true,
        },
        MAT_CATTAIL: {
            name: 'Quick Bulwark',
            description: '+1 move — arriving at the corridor in time is the whole job.',
            effect: { type: 'MOVE_BONUS', value: 1 },
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
            name: 'Shrapnel Kernel',
            description: 'Her kernels leave the target bleeding: the next hit against it lands +1.',
            effect: { type: 'BLEED_ON_HIT' },
            live: true,
        },
        MAT_WALLNUT: {
            name: 'Cob Bunker',
            description: '+3 max HP — artillery that has to stand this close needs to survive being reached.',
            effect: { type: 'BONUS_HP', value: 3 },
            live: true,
        },
        MAT_CORN: {
            name: 'Cob Cannon',
            description: 'Butter Splat stuns the main target and slows surrounding tiles.',
            effect: { type: 'SKILL_SPLASH' },
            live: true,
        },
        MAT_CATTAIL: {
            name: 'Skid Carriage',
            description: '+1 move — the short arc keeps her pressed against her own line, and extra legs are the way back out.',
            effect: { type: 'MOVE_BONUS', value: 1 },
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
            description: 'Every kernel that finishes a zombie off shells her in a layer — the next hit is blocked in full.',
            effect: { type: 'SHIELD_ON_KILL', value: 1 },
            live: true,
        },
    },

    // --- ZEPHYR: paper on wings. Both guns only land when the enemy stands where her
    //     knight's-move cells fall, and she must fly into that pocket to fire — her row buys
    //     survival, exits, and ways to hold the formation still. ---
    ZEPHYR: {
        MAT_SUNFLOWER: {
            name: 'Solar Rotor',
            description: 'Every zombie her wing guns finish off pays 15 Sun — two barrels, two chances a turn.',
            effect: { type: 'SUN_ON_KILL', value: 15 },
            live: true,
        },
        MAT_PEASHOOTER: {
            name: 'Twin Pods',
            description: 'Both wings fire a second volley for 1 damage.',
            effect: { type: 'DOUBLE_ATTACK', value: 1 },
            live: true,
        },
        MAT_CHOMPER: {
            name: 'Grinder Pods',
            description: 'Her rockets leave both targets bleeding: the next hit against each lands +1.',
            effect: { type: 'BLEED_ON_HIT' },
            live: true,
        },
        MAT_WALLNUT: {
            name: 'Armored Fuselage',
            description: '+3 max HP — 7 instead of 4, and the wings stop being made of paper.',
            effect: { type: 'BONUS_HP', value: 3 },
            live: true,
        },
        MAT_CORN: {
            // Exception cell: the arc means nothing to a fixed knight's-move geometry, and a
            // stun stapled to an area skill breaks the STUN RULE. So the corn buys the pod.
            name: 'Cluster Load',
            description: 'Smoke Pod costs 15 less Sun.',
            effect: { type: 'SKILL_DISCOUNT', value: 15 },
            live: true,
        },
        MAT_CATTAIL: {
            name: 'Overdrive Rotor',
            description: '+1 move — move 5, flying. Herself, turned up.',
            effect: { type: 'MOVE_BONUS', value: 1 },
            live: true,
        },
        MAT_ENDURIAN: {
            name: 'Barbed Skids',
            description: 'Melee attackers are thrown a tile back — on a 4 hp frame, the shove IS the escape.',
            effect: { type: 'RETALIATE_PUSH' },
            live: true,
        },
        MAT_CHARD: {
            name: 'Downwash',
            description: 'Her rockets shove what they hit a tile back — both cells at once.',
            effect: { type: 'ON_HIT_PUSH', value: 1 },
            live: true,
        },
        MAT_PUMPKIN: {
            name: 'Pod Plating',
            description: 'A kill raises a fresh layer over her — insurance bought with her own guns.',
            effect: { type: 'SHIELD_ON_KILL', value: 1 },
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
        MAT_CORN: {
            name: 'Reaching Thorn',
            description: 'His swipe reaches 2 tiles instead of 1.',
            effect: { type: 'ATTACK_RANGE_BONUS', value: 1 },
            live: true,
        },
        MAT_CATTAIL: {
            name: 'Windburr',
            description: '+1 move — 2 damage and move 2 catches nobody. Now he chooses where the provoking happens.',
            effect: { type: 'MOVE_BONUS', value: 1 },
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
            description: 'Every zombie he finishes off with a swipe shells him in a layer — the next hit is blocked in full.',
            effect: { type: 'SHIELD_ON_KILL', value: 1 },
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
            // Bleed is not a damage number, so it passes the only gate his row enforces —
            // the hero who finishes nothing himself now marks bodies for whoever does.
            name: 'Rending Guard',
            description: 'His throws leave the target bleeding: the next hit against it lands +1.',
            effect: { type: 'BLEED_ON_HIT' },
            live: true,
        },
        MAT_WALLNUT: {
            name: 'Bulwark Chard',
            description: '+3 max HP — he has to walk into contact to do anything at all.',
            effect: { type: 'BONUS_HP', value: 3 },
            live: true,
        },
        MAT_CORN: {
            name: 'Cob Catapult',
            description: 'Every shove he throws travels a tile further — 3 from the swing, 3 from the sweep.',
            effect: { type: 'PUSH_DISTANCE', value: 1 },
            live: true,
        },
        MAT_CATTAIL: {
            name: 'Veilsweep',
            description: 'The tiles Sweep clears are left hanging with dust — thrown back, and unable to swing.',
            effect: { type: 'SKILL_DISARM' },
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
            // Was Rind Repeater (DOUBLE_ATTACK) — nothing left to repeat. The pea gives
            // the guard a gun instead: the one row where GRANT_ATTACK is a comeback story.
            name: 'Pea Turret',
            description: 'Gains a free ranged shot for 1 damage — the guard learns to shoot back.',
            effect: { type: 'GRANT_ATTACK', value: 0 },
            live: true,
        },
        MAT_CHOMPER: {
            // Was Fanged Gourd (+1 damage) — there is no swing to raise. The jaws face
            // outward instead: an exception cell, reasoned like the Cluster Load one.
            name: 'Fanged Rind',
            description: 'Anything that bites him takes 2 back.',
            effect: { type: 'RETALIATE_DAMAGE', value: 2 },
            live: true,
        },
        MAT_WALLNUT: {
            name: 'Ironrind',
            description: '+3 max HP — the shell around the ally only lasts while its carrier does.',
            effect: { type: 'BONUS_HP', value: 3 },
            live: true,
        },
        MAT_CORN: {
            // Was Gourd Cannon (SKILL_SPLASH) — Encase grew its own plus-shape, so splash
            // became a no-op. The throwing arm buys reach for the free hand instead.
            name: 'Long Arm Shell',
            description: 'Reinforce reaches a tile further — he shells allies and houses from 2 tiles away.',
            effect: { type: 'ATTACK_RANGE_BONUS', value: 1 },
            live: true,
        },
        MAT_CATTAIL: {
            name: 'Rolling Rind',
            description: '+1 move — his shell is worth exactly as much as his ability to reach whoever needs it.',
            effect: { type: 'MOVE_BONUS', value: 1 },
            live: true,
        },
        MAT_ENDURIAN: {
            name: 'Spined Shell',
            description: 'Anything that hits him is thrown a tile back — going through him to reach his ward costs ground.',
            effect: { type: 'RETALIATE_PUSH' },
            live: true,
        },
        MAT_CHARD: {
            // Was Chard Rind (ON_HIT_PUSH) — no bash left to ride. The stem braces instead.
            name: 'Braced Shell',
            description: 'Takes 1 less damage from every hit, shrugs collisions, and plugs spawn holes painlessly.',
            effect: { type: 'STEADFAST', value: 1 },
            live: true,
        },
        MAT_PUMPKIN: {
            name: 'Great Gourd',
            // SHIELD_BONUS ("+2 size") died with shield sizes (§6.0) — coverage is the axis now.
            description: 'Every shield he hands out spills over, layering whoever stands beside the recipient too.',
            effect: { type: 'SHIELD_SPREAD' },
            live: true,
        },
    },
};

export const getRecipe = (heroId: HeroId | undefined, materialId: MaterialId): FusionRecipe | null => {
    if (!heroId) return null;
    return FUSION_RECIPES[heroId]?.[materialId] ?? null;
};
