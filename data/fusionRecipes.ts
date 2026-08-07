import { FusionEffect, HeroId, MaterialId } from '../types';

/**
 * The 9 x 9 fusion matrix.
 *
 * A fusion's effect depends on the PAIR, not on the material alone. This is the PvZ Fusion
 * idea applied where it is affordable: nine plants produce eighty-one authored recipes from
 * nine sprites, instead of a bespoke asset for every result. (It was 10x10 until Ice Grenade
 * retired with Frostpod — nine heroes, nine gears, no orphan; PLAN-hero-zephyr §9.)
 *
 * TWO-ITEM GEAR RULE (PLAN-hero-zephyr §4): each gear is two traits of the ONE hero it
 * belongs to — item A from their basic attack, item B from their paid skill — and every cell
 * picks whichever fits the recipient. Cells where neither fits are exceptions with their
 * reason written beside them.
 *
 * Design rule for every row: the fusion answers that hero's *core weakness*.
 *   - Sunbloom cannot attack and must be escorted -> her fusions arm or armour her.
 *   - Snapmaw is helpless while digesting        -> her fusions all attack that window.
 *   - Ironhusk blocks but contributes little     -> her fusions make blocking pay.
 *   - Peaburst is a plain shooter               -> her fusions change what a shot does.
 *   - Cornova paid for her arc with reach, tempo and durability -> her fusions buy them back.
 *   - Reedwing is paper on wings and must fly into the pocket her guns want -> her fusions buy
 *     survival, exits, and ways to hold a formation still.
 *   - Thornshell is only strong when the enemy comes to HIM -> his fusions make him last longer,
 *     hurt more to touch, and reach further when he calls.
 *   - Chardslam is close to harmless on a bare board -> his fusions hand him hazards, distance
 *     and slam damage. Never a damage number: 0 damage is the hero, not a gap (see the
 *     BONUS_DAMAGE note in utils/fusion.ts, which maps rather than appends for exactly this).
 *   - Gourdward is worth precisely what the ally he is covering is worth -> his fusions make
 *     the shell bigger, cheaper, and able to reach more people.
 *
 * SUN ECONOMY RULE: Sol is never paid for merely attacking. It comes from finishing something
 * off (SUN_ON_KILL) or from spending a whole turn on it (Harvest). Passive trickles are small
 * and belong to heroes that gave up offence for them.
 *
 * THE SOL BATTERY COLUMN, stated as its own two-item rule — because without it half the column
 * read as exceptions when it is in fact the most disciplined column in the matrix. The gear
 * sells ONE thing: **how many skills this hero gets to cast in a fight**. It sells it two ways.
 *   - Item A, MORE SOL: `SUN_PER_TURN` (Sunbloom) · `SUN_ON_KILL` (Peaburst, Reedwing,
 *     Chardslam) · `SUN_WHILE_DIGESTING` (Snapmaw) · `SUN_ON_BLOCK_SPAWN` (Ironhusk). Each one
 *     is keyed to something that hero already does, which is what keeps the SUN ECONOMY RULE
 *     above intact: nobody is paid for swinging.
 *   - Item B, CHEAPER SKILLS: `SKILL_DISCOUNT` (Cornova, Thornshell, Gourdward). Reserved for
 *     the three whose skill IS their output — a discount is worthless to a hero whose paid
 *     button is situational, and decisive for one who wants to press it every single turn.
 * Five A, three B, one signature. No exceptions in this column, and a cell that cannot pick a
 * side does not belong in it.
 *
 * STUN RULE: no fusion grants a free stun, full stop. It used to be phrased as "nobody but
 * Frostpod", who owned `UPGRADE_SLOW_TO_FREEZE` (Blizzard) — every one of her attacks
 * becoming a lost turn, free, forever. She is retired (data/heroes.ts) and no recipe grants
 * that effect today; the engine still honours it because it is what the ICE element will
 * hand out. Either way the ban on new rows is unchanged, and for the same reason: a free
 * stun every turn is a lost turn every turn. New rows get ON_HIT_SLOW instead. (The Snow
 * Pea gear that once carried the note is retired with its column — §9.)
 *
 * The rule has exactly THREE priced exceptions today, and all three are priced the same way —
 * by being something other than "every turn, forever":
 *   - `SKILL_STUN` (Stun Charge) rides the PAID skill. One pin per cast, bought with Sol,
 *     which is the shape Nova Shell has always had.
 *   - `SKILL_STUN` again (Stun Shell) on Gourdward's Encase, where it pins everything the
 *     plus reaches — and is the DEAREST of the three rather than the cheapest: a 0-damage,
 *     8 hp support has to spend a turn and 50 Sol standing inside the crowd to land it.
 *   - `STUN_ON_FULL_HP` (Stun Fang) fires ONCE PER BODY, ever: the second bite meets a
 *     wounded target and does nothing. A melee hero has to reach the fresh zombie to spend it.
 *
 * RETALIATION RULE: a durian grafted onto somebody else pays back exactly 1, on every hero
 * in the matrix. Thornshell is the sole exception and it is his own gear — his innate 2 is the
 * hero, and Bristling Armor raises it to 3, because a cell that gave the durian nothing would
 * be the one cell in his row that is not for him. Two was the old column-wide number and it
 * meant a 150-Coin plant out-damaged most heroes' actual attacks without spending a turn.
 *
 * WALL-NUT COLUMN RULE: the shell reads by RANGE. A MELEE hero buys `DAMAGE_REDUCTION` —
 * they are charged many small hits and reduction is billed on every one; a RANGED hero buys
 * `BONUS_HP` — they are hit rarely and hard, and what they need is a buffer that survives one
 * bad turn. Sunbloom has no attack at all and takes the melee reading: she is reached, and she
 * already carries BONUS_HP one column over.
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
    SUNBLOOM: {
        MAT_SUNBLOOM: {
            name: 'Twin Sol Battery',
            description: 'Harvest yields double Sol per turn — 50 Sol base, or 30 Sol if combined with Dawn Harvest.',
            effect: { type: 'SUN_PER_TURN', value: 50 },
            live: true,
        },
        MAT_PEABURST: {
            name: 'Gunbloom',
            description: 'Gains a free ranged shot that deals 1 damage and gathers 10 Sol on hit.',
            effect: { type: 'GRANT_ATTACK', value: 0 },
            live: true,
        },
        MAT_SNAPMAW: {
            name: 'Fanged Blessing',
            description: 'Solar Blessing is worth +2 damage this turn instead of +1.',
            effect: { type: 'BLESS_POWER', value: 1 },
            live: true,
        },
        MAT_IRONHUSK: {
            name: 'Armored Bloom',
            description: 'Starts the battle shielded in a layer — surviving the first turn guaranteed.',
            effect: { type: 'START_SHIELDED' },
            live: true,
        },
        MAT_CORNOVA: {
            name: 'Solar Corona',
            description: 'Solar Blessing washes over every ally within 2 tiles, not just one.',
            effect: { type: 'SKILL_AURA' },
            live: true,
        },
        MAT_REEDWING: {
            name: 'Sunchaser',
            description: '+1 move — the battery keeps up with the squad it is powering.',
            effect: { type: 'MOVE_BONUS', value: 1 },
            live: true,
        },
        MAT_THORNSHELL: {
            name: 'Thorned Bloom',
            description: 'Solar Blessing grants retaliate 1 damage to the blessed ally.',
            effect: { type: 'BLESS_RETALIATE' },
            live: true,
        },
        MAT_CHARDSLAM: {
            name: 'Kinetic Bloom',
            description: 'The blessing lands like a shockwave: everything beside the blessed ally is shoved a tile away, her included.',
            effect: { type: 'BLESS_SHOCKWAVE' },
            live: true,
        },
        MAT_GOURDWARD: {
            name: 'Dawn Harvest',
            description: 'Harvest yields 15 Sol per turn (-10 Sol penalty) but grants Sunbloom a passive 1-layer shield.',
            effect: { type: 'HARVEST_SHIELD', value: 15 },
            live: true,
        },
    },

    // --- GREEN SHADOW: a plain shooter. Fusions change what a shot *does*. ---
    PEABURST: {
        MAT_SUNBLOOM: {
            name: 'Sunbeam Pea',
            description: 'Harvests 10 Sol whenever a shot finishes a zombie off.',
            effect: { type: 'SUN_ON_KILL', value: 10 },
            live: true,
        },
        MAT_PEABURST: {
            name: 'Repeater',
            description: 'A second pea for 1 damage. If the first kills, it flies on to the next target.',
            effect: { type: 'DOUBLE_ATTACK', value: 1 },
            live: true,
        },
        MAT_SNAPMAW: {
            name: 'Serrated Pea',
            description: 'Her shots leave the target bleeding: the next hit against it lands +1.',
            effect: { type: 'BLEED_ON_HIT' },
            live: true,
        },
        MAT_IRONHUSK: {
            name: 'Armored Pea',
            description: '+2 max HP — 8 instead of 6, providing a safe backline health buffer.',
            effect: { type: 'BONUS_HP', value: 2 },
            live: true,
        },
        MAT_CORNOVA: {
            name: 'Mortar Pea',
            description: 'Her shot arcs over anything in the way — with a range of 4 tiles.',
            effect: { type: 'ARC_ATTACK' },
            live: true,
        },
        MAT_REEDWING: {
            name: 'Smokeline',
            description: 'Precision Blast leaves the tile it struck hanging with dust — nothing standing in it can swing.',
            effect: { type: 'SKILL_DISARM' },
            live: true,
        },
        MAT_THORNSHELL: {
            name: 'Barbed Pea',
            description: 'Anything her shots hurt turns on her — it must come for her next turn.',
            effect: { type: 'PROVOKE_ON_HIT' },
            live: true,
        },
        MAT_CHARDSLAM: {
            name: 'Overwatch Pea',
            description: 'Any enemy the squad shoves into her clear line eats a pea for 1 — her own turn is untouched.',
            effect: { type: 'OVERWATCH_SHOT' },
            live: true,
        },
        MAT_GOURDWARD: {
            name: 'Precision Shield',
            description: 'Finishing a zombie off with Precision Blast shells her in a layer — high risk positioning rewarded with protection.',
            effect: { type: 'SHIELD_ON_SKILL_KILL', value: 1 },
            live: true,
        },
    },

    // --- SNAPMAW: helpless for 2 turns after eating. Every fusion attacks that window. ---
    SNAPMAW: {
        MAT_SUNBLOOM: {
            name: 'Sunlit Gut',
            description: 'Digesting is productive: yields 10 Sol per turn while chewing (20 Sol total over 2 turns).',
            effect: { type: 'SUN_WHILE_DIGESTING', value: 10 },
            live: true,
        },
        MAT_PEABURST: {
            name: 'Rending Claws',
            description: 'While digesting she can still claw an adjacent enemy for 1. Free.',
            effect: { type: 'DIGEST_CLAW' },
            live: true,
        },
        MAT_SNAPMAW: {
            name: 'Double Jaw',
            description: 'Swallows in half the time — digests for 1 turn instead of 2.',
            effect: { type: 'DIGEST_REDUCTION', value: 1 },
            live: true,
        },
        MAT_IRONHUSK: {
            name: 'Armored Jaws',
            description: 'Takes 1 less damage from every hit while she is digesting.',
            effect: { type: 'ARMOR_WHILE_DIGESTING', value: 1 },
            live: true,
        },
        MAT_CORNOVA: {
            name: 'Stun Fang',
            description: 'Her bite concusses any enemy still at full health: it loses its whole next turn.',
            effect: { type: 'STUN_ON_FULL_HP' },
            live: true,
        },
        MAT_REEDWING: {
            name: 'Prowl Rotor',
            description: 'While digesting she can still move 1 tile per turn — maintaining battlefield mobility.',
            effect: { type: 'DIGEST_MOVE', value: 1 },
            live: true,
        },
        MAT_THORNSHELL: {
            name: 'Bristleback',
            description: 'Reflects full retaliate damage back while digesting.',
            effect: { type: 'DIGEST_RETALIATE' },
            live: true,
        },
        MAT_CHARDSLAM: {
            name: 'Anchored Gullet',
            description: 'Immune to collision damage and push/knockback effects while digesting.',
            effect: { type: 'DIGEST_STEADFAST' },
            live: true,
        },
        MAT_GOURDWARD: {
            name: 'Warded Gut',
            description: 'Swallowing a zombie shells her in a layer at the start of digestion — guarding her helpless 2-turn window.',
            effect: { type: 'SHIELD_ON_DIGEST', value: 1 },
            live: true,
        },
    },

    // --- WALL-KNIGHT: blocks well, contributes little. Fusions make blocking pay. ---
    IRONHUSK: {
        MAT_SUNBLOOM: {
            name: 'Sunstone Shield',
            description: 'Plugging a spawn hole pays 20 Sol — she is rewarded for standing on it.',
            effect: { type: 'SUN_ON_BLOCK_SPAWN', value: 20 },
            live: true,
        },
        MAT_PEABURST: {
            name: 'Lance Bash',
            description: 'Plate Slam reaches 1 tile further with extended lance range while keeping its push.',
            effect: { type: 'ATTACK_RANGE_BONUS', value: 1 },
            live: true,
        },
        MAT_SNAPMAW: {
            name: 'Fanged Bash',
            description: '+1 damage on everything she swings — the bash finally bites.',
            effect: { type: 'BONUS_DAMAGE', value: 1 },
            live: true,
        },
        MAT_IRONHUSK: {
            name: 'Iron Bulwark',
            description: 'Takes 1 less damage from every hit, reduces collision damage by 50%, and plugs spawn holes painlessly.',
            effect: { type: 'STEADFAST', value: 1 },
            live: true,
        },
        MAT_CORNOVA: {
            name: 'Stun Charge',
            description: 'Rolling Charge concusses what it slams: the target loses its whole next turn.',
            effect: { type: 'SKILL_STUN' },
            live: true,
        },
        MAT_REEDWING: {
            name: 'Overdrive Charge',
            description: 'Rolling Charge travels 4 tiles instead of 3, allowing long-distance engagements.',
            effect: { type: 'DASH_DISTANCE', value: 1 },
            live: true,
        },
        MAT_THORNSHELL: {
            name: 'Spiked Bulwark',
            description: 'Plate Slam deals +1 extra damage and reflects +1 retaliate damage when struck in melee.',
            effect: { type: 'RETALIATE_DAMAGE', value: 1 },
            live: true,
        },
        MAT_CHARDSLAM: {
            name: 'Sprung Bash',
            description: 'Every shove she makes travels a tile further — the bash throws 2, and so does the charge.',
            effect: { type: 'PUSH_DISTANCE', value: 1 },
            live: true,
        },
        MAT_GOURDWARD: {
            name: 'Bunker Plating',
            description: 'Once a battle, the blow that would finish her raises a layer instead — and the layer eats it whole.',
            effect: { type: 'LAST_STAND_SHIELD' },
            live: true,
        },
    },

    // --- COBB: the arc is free, everything else about her is short. ---
    CORNOVA: {
        MAT_SUNBLOOM: {
            name: 'Sunlit Cob',
            description: 'Nova Shell costs 15 less Sol.',
            effect: { type: 'SKILL_DISCOUNT', value: 15 },
            live: true,
        },
        MAT_PEABURST: {
            name: 'Twin Cob',
            description: 'The kernel is followed by a second, lighter one for 1 damage.',
            effect: { type: 'DOUBLE_ATTACK', value: 1 },
            live: true,
        },
        MAT_SNAPMAW: {
            name: 'Shrapnel Kernel',
            description: 'Her kernels leave the target bleeding: the next hit against it lands +1.',
            effect: { type: 'BLEED_ON_HIT' },
            live: true,
        },
        MAT_IRONHUSK: {
            name: 'Armored Cob',
            description: '+3 max HP — 11 instead of 8, allowing mid-range artillery to sustain side flank attacks.',
            effect: { type: 'BONUS_HP', value: 3 },
            live: true,
        },
        MAT_CORNOVA: {
            name: 'Cob Howitzer',
            description: 'Nova Shell stuns the main target and slows surrounding tiles.',
            effect: { type: 'SKILL_SPLASH' },
            live: true,
        },
        MAT_REEDWING: {
            name: 'Ash Carriage',
            description: 'Whatever her kernels hurt is left standing in dust — it cannot swing next turn unless it walks out.',
            effect: { type: 'SMOKE_ON_HIT' },
            live: true,
        },
        MAT_THORNSHELL: {
            name: 'Barbed Cob',
            description: 'Anything her kernels hurt turns on her — it must come for her next turn.',
            effect: { type: 'PROVOKE_ON_HIT' },
            live: true,
        },
        MAT_CHARDSLAM: {
            name: 'Overwatch Cob',
            description: 'Any enemy the squad shoves within reach of her arc eats a kernel for 1 — her own turn is untouched.',
            effect: { type: 'OVERWATCH_SHOT' },
            live: true,
        },
        MAT_GOURDWARD: {
            name: 'Reactive Cob Shell',
            description: 'After taking her first attack hit in battle, she immediately deploys a reactive 1-layer shield.',
            effect: { type: 'REACTIVE_SHIELD' },
            live: true,
        },
    },

    // --- REEDWING: paper on wings. ---
    REEDWING: {
        MAT_SUNBLOOM: {
            name: 'Solar Rotor',
            description: 'Every zombie her wing guns finish off pays 15 Sol — two barrels, two chances a turn.',
            effect: { type: 'SUN_ON_KILL', value: 15 },
            live: true,
        },
        MAT_PEABURST: {
            name: 'Twin Pods',
            description: 'Both wings fire a second volley for 1 damage.',
            effect: { type: 'DOUBLE_ATTACK', value: 1 },
            live: true,
        },
        MAT_SNAPMAW: {
            name: 'Executioner Pods',
            description: 'Wing guns deal +2 bonus damage (3 damage total) against targets currently suffering from Bleeding.',
            effect: { type: 'BLEED_EXECUTION', value: 2 },
            live: true,
        },
        MAT_IRONHUSK: {
            name: 'Armored Fuselage',
            description: 'Takes 1 less damage from every hit — armored flight frame replaces paper wings.',
            effect: { type: 'DAMAGE_REDUCTION', value: 1 },
            live: true,
        },
        MAT_CORNOVA: {
            name: 'Cluster Load',
            description: 'A third rocket drops from her belly onto the tile between the two wing shots.',
            effect: { type: 'WING_MIDSHOT' },
            live: true,
        },
        MAT_REEDWING: {
            name: 'Overdrive Rotor',
            description: '+1 move — move 5, flying. Herself, turned up.',
            effect: { type: 'MOVE_BONUS', value: 1 },
            live: true,
        },
        MAT_THORNSHELL: {
            name: 'Barbed Skids',
            description: 'Anything her rockets hurt turns on her — and she flies away before it arrives.',
            effect: { type: 'PROVOKE_ON_HIT' },
            live: true,
        },
        MAT_CHARDSLAM: {
            name: 'Downwash',
            description: 'Her rockets shove what they hit a tile back — both cells at once.',
            effect: { type: 'ON_HIT_PUSH', value: 1 },
            live: true,
        },
        MAT_GOURDWARD: {
            name: 'Dawn Pod Plating',
            description: 'Starts the battle shielded in a layer — aerial unit stays protected on turn one.',
            effect: { type: 'START_SHIELDED' },
            live: true,
        },
    },

    // --- THORNSHELL: taunt tank. ---
    THORNSHELL: {
        MAT_SUNBLOOM: {
            name: 'Sunlit Thorn',
            description: 'Provoke costs 15 less Sol.',
            effect: { type: 'SKILL_DISCOUNT', value: 15 },
            live: true,
        },
        MAT_PEABURST: {
            name: 'Piercing Needles',
            description: 'Thorn Swipe shoots a needle beam piercing up to 2 targets in a row — damage tapers off with distance down to 1.',
            effect: { type: 'LASER_NEEDLE', value: 2 },
            live: true,
        },
        MAT_SNAPMAW: {
            name: 'Rending Husk',
            description: 'Anything that hits him in melee is left bleeding: the next hit against it lands +1.',
            effect: { type: 'RETALIATE_BLEED' },
            live: true,
        },
        MAT_IRONHUSK: {
            name: 'Thorn Lunge',
            description: 'Basic attack transforms into a 1-tile lunge charge towards the target.',
            effect: { type: 'THORN_LUNGE', value: 1 },
            live: true,
        },
        MAT_CORNOVA: {
            name: 'Bellowing Thorn',
            description: 'Provoke reaches 5 tiles instead of 3 — far enough for whatever thought it could outrange him.',
            effect: { type: 'PROVOKE_RADIUS', value: 2 },
            live: true,
        },
        MAT_REEDWING: {
            name: 'Windburr',
            description: '+1 move — 3 move speed allows Thornshell to position flexibly for Provoke.',
            effect: { type: 'MOVE_BONUS', value: 1 },
            live: true,
        },
        MAT_THORNSHELL: {
            name: 'Bristling Armor',
            description: 'Melee attackers take 3 back instead of 2.',
            effect: { type: 'RETALIATE_DAMAGE', value: 1 },
            live: true,
        },
        MAT_CHARDSLAM: {
            name: 'Sprung Thorn',
            description: 'His swipe knocks the target back a tile — into whatever is standing behind it.',
            effect: { type: 'ON_HIT_PUSH', value: 1 },
            live: true,
        },
        MAT_GOURDWARD: {
            name: 'Warded Provoke',
            description: 'Casting Provoke grants Thornshell a 1-layer shield to absorb incoming attacks.',
            effect: { type: 'PROVOKE_SHIELD' },
            live: true,
        },
    },

    // --- CHARDSLAM: 0 damage is the hero. ---
    CHARDSLAM: {
        MAT_SUNBLOOM: {
            name: 'Sunlit Chard',
            description: 'Every zombie he shoves into water, rock or another body pays 15 Sol.',
            effect: { type: 'SUN_ON_KILL', value: 15 },
            live: true,
        },
        MAT_PEABURST: {
            name: 'Longarm Chard',
            description: 'Vault Toss grabs from 2 tiles away — he throws without stepping into contact.',
            effect: { type: 'ATTACK_RANGE_BONUS', value: 1 },
            live: true,
        },
        MAT_SNAPMAW: {
            name: 'Rending Chard',
            description: 'His throws leave the target bleeding: the next hit against it lands +1.',
            effect: { type: 'BLEED_ON_HIT' },
            live: true,
        },
        MAT_IRONHUSK: {
            name: 'Armored Chard',
            description: 'Takes 50% less collision damage and plugs spawn holes painlessly — collision specialist.',
            effect: { type: 'STEADFAST', value: 1 },
            live: true,
        },
        MAT_CORNOVA: {
            name: 'Catapult Chard',
            description: 'Sweep throws 3 tiles instead of 2 — far enough to find the water from the middle of the board.',
            effect: { type: 'PUSH_DISTANCE', value: 1 },
            live: true,
        },
        MAT_REEDWING: {
            name: 'Catapult Rotor',
            description: 'Every shove, toss, and slam throws all target enemies 1 extra tile further.',
            effect: { type: 'PUSH_DISTANCE', value: 1 },
            live: true,
        },
        MAT_THORNSHELL: {
            name: 'Thorned Chard',
            description: 'Melee attackers are thrown a tile back.',
            effect: { type: 'RETALIATE_PUSH' },
            live: true,
        },
        MAT_CHARDSLAM: {
            name: 'Grand Chard',
            description: 'Anything he slams into a body, a rock or the map edge takes 2 extra damage.',
            effect: { type: 'COLLISION_BONUS', value: 2 },
            live: true,
        },
        MAT_GOURDWARD: {
            name: 'Warded Chard',
            description: 'Every body he slams to death shells him in a layer — the next hit is blocked in full.',
            effect: { type: 'SHIELD_ON_KILL', value: 1 },
            live: true,
        },
    },

    // --- GOURDWARD: pure shield guard. ---
    GOURDWARD: {
        MAT_SUNBLOOM: {
            name: 'Sunlit Rind',
            description: 'Encase costs 10 less Sol.',
            effect: { type: 'SKILL_DISCOUNT', value: 10 },
            live: true,
        },
        MAT_PEABURST: {
            name: 'Rind Pellet',
            description: 'Reinforce is fired down a row: it shells the first ally — or Greenspire — up to 4 tiles away.',
            effect: { type: 'ATTACK_RANGE_BONUS', value: 3 },
            live: true,
        },
        MAT_SNAPMAW: {
            name: 'Glass Rind',
            description: 'His layers are spiked glass: whatever breaks one is left bleeding — the next hit against it lands +1.',
            effect: { type: 'BARBED_SHIELD' },
            live: true,
        },
        MAT_IRONHUSK: {
            name: 'Ironrind',
            description: 'Takes 1 less damage from every hit — the shell around the ally only lasts while its carrier does.',
            effect: { type: 'DAMAGE_REDUCTION', value: 1 },
            live: true,
        },
        MAT_CORNOVA: {
            name: 'Stun Shell',
            description: 'Encase concusses every zombie it reaches: each one loses its whole next turn.',
            effect: { type: 'SKILL_STUN' },
            live: true,
        },
        MAT_REEDWING: {
            name: 'Rolling Rind',
            description: 'Encase can be cast up to 2 tiles away to protect distant allies.',
            effect: { type: 'ENCASE_RANGE', value: 1 },
            live: true,
        },
        MAT_THORNSHELL: {
            name: 'Spined Rind',
            description: 'Anything that hits him in melee is impaled for 1 — going through him to reach his ward costs blood.',
            effect: { type: 'RETALIATE_DAMAGE', value: 1 },
            live: true,
        },
        MAT_CHARDSLAM: {
            name: 'Shockrind',
            description: 'Encase blows every enemy standing beside him a tile back as the shell goes up.',
            effect: { type: 'SKILL_REPEL' },
            live: true,
        },
        MAT_GOURDWARD: {
            name: 'Greatrind',
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

