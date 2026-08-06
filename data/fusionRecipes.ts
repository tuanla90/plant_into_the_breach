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
        MAT_SUNFLOWER: {
            name: 'Twin Sol Battery',
            description: 'Harvest yields two suns instead of one — 25 more per turn.',
            // Stacks with her free Harvest for 50/turn total, but she still spends the action.
            effect: { type: 'SUN_PER_TURN', value: 25 },
            live: true,
        },
        MAT_PEASHOOTER: {
            name: 'Gunbloom',
            description: 'Gains a free ranged shot that deals 1 damage and gathers 10 Sol on hit.',
            effect: { type: 'GRANT_ATTACK', value: 0 },
            live: true,
        },
        MAT_CHOMPER: {
            // The jaws face the BLESSING, not the enemy — she has nothing to bite with. Her
            // one output is what the blessed body does next, so the gear raises that number.
            name: 'Fanged Blessing',
            description: 'Solar Blessing is worth +2 damage this turn instead of +1.',
            effect: { type: 'BLESS_POWER', value: 1 },
            live: true,
        },
        MAT_WALLNUT: {
            // The wall-nut column reads MELEE -> reduction, RANGED -> max HP. She is neither:
            // she has no attack at all. Reduction wins because the escort problem is being
            // reached repeatedly by chip damage, and because BONUS_HP is already her Bunker Shell.
            name: 'Armored Bloom',
            description: 'Takes 1 less damage from every hit.',
            effect: { type: 'DAMAGE_REDUCTION', value: 1 },
            live: true,
        },
        MAT_CORN_MORTAR: {
            // Was Mortar Bloom (+2 reach) — reach on a single-target buff only moves WHO gets
            // it. The throwing arm now scatters the blessing over the whole pocket instead.
            name: 'Solar Corona',
            description: 'Solar Blessing washes over every ally within 2 tiles, not just one.',
            effect: { type: 'SKILL_AURA' },
            live: true,
        },
        MAT_CATTAIL: {
            // Was Ashveil (SKILL_DISARM). The rotors' other half fits her better: the escort
            // problem is half a footwork problem, and move 2 is the slowest body in the game.
            name: 'Sunchaser',
            description: '+1 move — the battery keeps up with the squad it is powering.',
            effect: { type: 'MOVE_BONUS', value: 1 },
            live: true,
        },
        MAT_ENDURIAN: {
            // 1, not 2: the durian column pays ONE back on every hero but the durian himself
            // (see the RETALIATION RULE below).
            name: 'Thorned Bloom',
            description: 'Anything that hits her in melee is impaled for 1.',
            effect: { type: 'RETALIATE_DAMAGE', value: 1 },
            live: true,
        },
        MAT_SPRING_ARM: {
            // Was Guarded Bloom (RETALIATE_PUSH) — an exception cell, and one that only ever
            // paid out AFTER she had already been reached. The stem's leverage moves onto the
            // thing she actually does: the blessing lands and the ground beside it clears.
            //
            // Everything in the ring moves — enemy, ally, and the blesser herself when she is
            // standing next to the body she just blessed. That last part is the point rather
            // than a side effect: a chain-lightning arc hops between ADJACENT bodies, so a
            // squad that spends 50 Sol to bless is a squad that stops standing in a line.
            name: 'Kinetic Bloom',
            description: 'The blessing lands like a shockwave: everything beside the blessed ally is shoved a tile away, her included.',
            effect: { type: 'BLESS_SHOCKWAVE' },
            live: true,
        },
        MAT_PUMPKIN: {
            // Was +3 max HP, which is a number rather than an answer — it bought her two more
            // zombie bites, not a way through them. A LAYER is the pumpkin column's own axis
            // and it is worth far more on the one hero who cannot fight back: the first blow
            // that reaches her costs the horde a turn instead of costing her the escort.
            // NOT "Bunker Shell": that is the GEAR's own name now (data/materials.ts), and a
            // recipe that shares its material's name reads as "no result" in the shop line.
            name: 'Dawn Shell',
            description: 'She walks onto the board already shelled in a layer — the first hit of every battle is blocked in full.',
            effect: { type: 'START_SHIELDED' },
            live: true,
        },
    },

    // --- GREEN SHADOW: a plain shooter. Fusions change what a shot *does*. ---
    PEABURST: {
        MAT_SUNFLOWER: {
            name: 'Sunbeam Pea',
            description: 'Harvests 15 Sol whenever a shot finishes a zombie off.',
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
            // Was ON_HIT_PUSH. The wall-nut column now reads by RANGE: a melee hero buys
            // reduction (it is charged on every one of the many hits they take), a shooter
            // buys the buffer that keeps one bad turn from ending them.
            name: 'Armored Pea',
            description: '+3 max HP — 9 instead of 6, so one zombie reaching her is not the end of it.',
            effect: { type: 'BONUS_HP', value: 3 },
            live: true,
        },
        MAT_CORN_MORTAR: {
            name: 'Mortar Pea',
            // 4, not 5: the arc formula is ceil(range/2) off her LINE 8, and the card must
            // print what the engine computes rather than a rounder-sounding number.
            description: 'Her shot arcs over anything in the way — with a range of 4 tiles.',
            effect: { type: 'ARC_ATTACK' },
            live: true,
        },
        MAT_CATTAIL: {
            // Dust settles where the BODY ends up, not along the flight path (skillResolution's
            // one dust rule). For a lane shot that is the tile the first pea found — a scalpel,
            // not a wall, so her own squad's lines stay open behind it.
            name: 'Smokeline',
            description: 'Precision Blast leaves the tile it struck hanging with dust — nothing standing in it can swing.',
            effect: { type: 'SKILL_DISARM' },
            live: true,
        },
        MAT_ENDURIAN: {
            // The durian's OTHER half: not thorns, the SHOUT. A shooter who can choose which
            // zombie stops walking to a Greenspire is worth more than one who shoves it a tile.
            name: 'Barbed Pea',
            description: 'Anything her shots hurt turns on her — it must come for her next turn.',
            effect: { type: 'TAUNT_ON_HIT' },
            live: true,
        },
        MAT_SPRING_ARM: {
            // The stem's leverage read as SUPPORT FIRE: she does not shove, she punishes
            // everyone else's shoves. The one cell in the matrix that fires on somebody
            // ELSE's action, which is why it wants a squad built around Chardslam/Ironhusk.
            name: 'Overwatch Pea',
            description: 'Any enemy the squad shoves into her clear line eats a pea for 1 — her own turn is untouched.',
            effect: { type: 'OVERWATCH_SHOT' },
            live: true,
        },
        MAT_PUMPKIN: {
            name: 'Warded Pea',
            description: 'Every zombie she finishes off shells her in a layer — the next hit is blocked in full.',
            effect: { type: 'SHIELD_ON_KILL', value: 1 },
            live: true,
        },
    },

    // --- SNAPMAW: helpless for 2 turns after eating. Every fusion attacks that window. ---
    SNAPMAW: {
        MAT_SUNFLOWER: {
            // The card always said "while she chews"; the engine paid every turn regardless,
            // which made it the flat income cell instead of the window cell. Now it is the
            // sentence it was written as: the drawback is what pays.
            name: 'Sunlit Gut',
            description: 'Digesting is productive: 25 Sol a turn, but only while she chews.',
            effect: { type: 'SUN_WHILE_DIGESTING', value: 25 },
            live: true,
        },
        MAT_PEASHOOTER: {
            // Was Spitter — a granted LINE shot the card promised she could use while
            // digesting, which the targeting gate refused outright (a hero mid-digest has no
            // legal target for anything). A CLAW is the honest version of the same promise:
            // one small action allowed through the window, and nothing outside it.
            name: 'Rending Claws',
            description: 'While digesting she can still claw an adjacent enemy for 1. Free.',
            effect: { type: 'DIGEST_CLAW' },
            live: true,
        },
        MAT_CHOMPER: {
            name: 'Double Jaw',
            description: 'Swallows in half the time — digests for 1 turn instead of 2.',
            effect: { type: 'DIGEST_REDUCTION', value: 1 },
            live: true,
        },
        MAT_WALLNUT: {
            name: 'Armored Jaws',
            description: 'Takes 1 less damage from every hit while she is digesting.',
            // The layer version duplicated her own Gourd Gut cell, so the shell went back to
            // being a THICKER HIDE — the wall-nut column's melee reading, fenced inside the
            // window it exists to guard. Every blow of the digest is softened, not just one.
            effect: { type: 'ARMOR_WHILE_DIGESTING', value: 1 },
            live: true,
        },
        MAT_CORN_MORTAR: {
            // Was Numbed Hide (retaliation while digesting). The stun now rides the BITE,
            // which is the corn's real axis — and the STUN RULE's one written exception: it
            // fires only against a body at FULL health, so it lands once per zombie ever and
            // she has to walk into contact to spend it.
            name: 'Stun Fang',
            description: 'Her bite concusses any enemy still at full health: it loses its whole next turn.',
            effect: { type: 'STUN_ON_FULL_HP' },
            live: true,
        },
        MAT_CATTAIL: {
            // Was +1 move, and it was the one cell in this row that ignored the row's own rule:
            // every Snapmaw fusion is supposed to attack the DIGEST WINDOW, and legs do nothing
            // for the two turns she cannot act. The dust does exactly that job — she bites, the
            // thing she bit is blinded, and the helpless window opens with one fewer swing
            // pointed at her.
            name: 'Prowl Veil',
            description: 'Whatever her bite hurts is left standing in dust — it cannot swing next turn unless it walks out.',
            effect: { type: 'SMOKE_ON_HIT' },
            live: true,
        },
        MAT_ENDURIAN: {
            name: 'Bristleback',
            description: 'Anything that bites her takes 1 back — including through both digesting turns.',
            effect: { type: 'RETALIATE_DAMAGE', value: 1 },
            live: true,
        },
        MAT_SPRING_ARM: {
            // Was RETALIATE_PUSH, which paid her for being bitten — the wrong half of a hero
            // whose problem is the two turns she cannot act. On the BITE it is a tool she
            // spends herself: chew, then throw the next one out of reach before the window
            // opens, or slam it into the body behind it.
            name: 'Sprung Gullet',
            description: 'Her bite hurls what it chews a tile back — into water, into rock, or just out of reach.',
            effect: { type: 'ON_HIT_PUSH', value: 1 },
            live: true,
        },
        MAT_PUMPKIN: {
            name: 'Warded Gut',
            description: 'Every kill shells her in a layer — the next hit is blocked in full.',
            effect: { type: 'SHIELD_ON_KILL', value: 1 },
            live: true,
        },
    },

    // --- WALL-KNIGHT: blocks well, contributes little. Fusions make blocking pay. ---
    IRONHUSK: {
        MAT_SUNFLOWER: {
            name: 'Sunstone Shield',
            description: 'Plugging a spawn hole pays 35 Sol — she is rewarded for standing on it.',
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
            // Was BLEED_ON_HIT — a mark for somebody else to cash, on the hero whose problem
            // is that her own 1 damage never gets there. The jaws' other half is the one she
            // needs: the bash bites, and Rolling Charge with it.
            name: 'Fanged Bash',
            description: '+1 damage on everything she swings — the bash finally bites.',
            effect: { type: 'BONUS_DAMAGE', value: 1 },
            live: true,
        },
        MAT_WALLNUT: {
            name: 'Iron Bulwark',
            description: 'Takes 1 less damage from every hit, reduces collision damage by 50%, and plugs spawn holes painlessly.',
            effect: { type: 'STEADFAST', value: 1 },
            live: true,
        },
        MAT_CORN_MORTAR: {
            // Was Cob Turret (a granted gun), which answered a hero who is idle — she is not,
            // she is holding a corridor. The stun is the corn's real axis and it goes on
            // the PAID skill, where one pin per cast is bought rather than free.
            name: 'Stun Charge',
            description: 'Rolling Charge concusses what it slams: the target loses its whole next turn.',
            effect: { type: 'SKILL_STUN' },
            live: true,
        },
        MAT_CATTAIL: {
            name: 'Quick Bulwark',
            description: '+1 move — arriving at the corridor in time is the whole job.',
            effect: { type: 'MOVE_BONUS', value: 1 },
            live: true,
        },
        MAT_ENDURIAN: {
            // Was ADJACENT_STRIKE. The durian column's own axis fits the wall best of anyone:
            // she is the hero who gets hit the most, so being hit is where her output belongs.
            name: 'Spiked Bulwark',
            description: 'Anything that hits her in melee is impaled for 1 — blocking finally pays.',
            effect: { type: 'RETALIATE_DAMAGE', value: 1 },
            live: true,
        },
        MAT_SPRING_ARM: {
            name: 'Sprung Bash',
            description: 'Every shove she makes travels a tile further — the bash throws 2, and so does the charge.',
            effect: { type: 'PUSH_DISTANCE', value: 1 },
            live: true,
        },
        MAT_PUMPKIN: {
            // Was DAMAGE_REDUCTION, which said the same sentence as Iron Bulwark one column
            // over — a dead pick. And `SHIELD_ON_KILL` was the obvious replacement and the
            // wrong one: on a body this hard to remove it would be up again every other turn,
            // which is armour wearing a shield's name. A LAST STAND fires once, when it
            // decides the fight, and is worth nothing the rest of the time.
            name: 'Bunker Plating',
            description: 'Once a battle, the blow that would finish her raises a layer instead — and the layer eats it whole.',
            effect: { type: 'LAST_STAND_SHIELD' },
            live: true,
        },
    },

    // --- COLD SNAP: delays everything, kills almost nothing. Fusions cash that control in. ---
    // --- COBB: the arc is free, everything else about her is short. Her fusions buy back
    //     the reach, the tempo and the durability that the trajectory cost her. ---
    CORNOVA: {
        MAT_SUNFLOWER: {
            name: 'Sunlit Cob',
            description: 'Nova Shell costs 15 less Sol.',
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
            name: 'Armored Cob',
            description: '+3 max HP — artillery that has to stand this close needs to survive being reached.',
            effect: { type: 'BONUS_HP', value: 3 },
            live: true,
        },
        MAT_CORN_MORTAR: {
            name: 'Cob Howitzer',
            description: 'Nova Shell stuns the main target and slows surrounding tiles.',
            effect: { type: 'SKILL_SPLASH' },
            live: true,
        },
        MAT_CATTAIL: {
            // Was +1 move. The rotors' item B belongs to the RANGED heroes, and the reason is
            // who the payoff is worth something to: "the body I hit cannot swing" is nearly
            // worthless to a melee hero (they were going to be hit anyway, and Thornshell
            // actively wants it), and decisive for someone shooting from outside arm's reach.
            // Peaburst already carries the skill version; Reedwing owns the gear and keeps the
            // legs; Cornova is the third, and she lobs from two tiles with 8 hp.
            name: 'Ash Carriage',
            description: 'Whatever her kernels hurt is left standing in dust — it cannot swing next turn unless it walks out.',
            effect: { type: 'SMOKE_ON_HIT' },
            live: true,
        },
        MAT_ENDURIAN: {
            // Was +1 damage — a number, on the hero whose problem was never the number. The
            // durian's SHOUT is the same cell Peaburst has, and it reads the same way on the
            // artillery: she is the one piece that can reach a zombie three tiles from a
            // Greenspire, so she is the one who gets to decide it walks at her instead.
            name: 'Barbed Cob',
            description: 'Anything her kernels hurt turns on her — it must come for her next turn.',
            effect: { type: 'TAUNT_ON_HIT' },
            live: true,
        },
        MAT_SPRING_ARM: {
            // Was RETALIATE_PUSH. The stem's leverage read as SUPPORT FIRE, exactly as it is
            // on Peaburst — with one difference that falls out for free: the support shot is
            // fired with the gun she is actually holding, so hers ARCS (no line of sight, 2
            // tiles) where Peaburst's needs a clear row.
            name: 'Overwatch Cob',
            description: 'Any enemy the squad shoves within reach of her arc eats a kernel for 1 — her own turn is untouched.',
            effect: { type: 'OVERWATCH_SHOT' },
            live: true,
        },
        MAT_PUMPKIN: {
            name: 'Warded Cob',
            description: 'Every kernel that finishes a zombie off shells her in a layer — the next hit is blocked in full.',
            effect: { type: 'SHIELD_ON_KILL', value: 1 },
            live: true,
        },
    },

    // --- REEDWING: paper on wings. Both guns only land when the enemy stands where her
    //     knight's-move cells fall, and she must fly into that pocket to fire — her row buys
    //     survival, exits, and ways to hold the formation still. ---
    REEDWING: {
        MAT_SUNFLOWER: {
            name: 'Solar Rotor',
            description: 'Every zombie her wing guns finish off pays 15 Sol — two barrels, two chances a turn.',
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
        MAT_CORN_MORTAR: {
            // The throwing arm, read as GEOMETRY rather than as reach: her two wing cells sit
            // exactly two tiles apart, so there is always a hole between them — the corn drops
            // a third rocket into it. Half her formation puzzle, solved, and only for her:
            // no other kit in the game has a gap of its own to fill.
            name: 'Cluster Load',
            description: 'A third rocket drops from her belly onto the tile between the two wing shots.',
            effect: { type: 'WING_MIDSHOT' },
            live: true,
        },
        MAT_CATTAIL: {
            name: 'Overdrive Rotor',
            description: '+1 move — move 5, flying. Herself, turned up.',
            effect: { type: 'MOVE_BONUS', value: 1 },
            live: true,
        },
        MAT_ENDURIAN: {
            // Was RETALIATE_PUSH — a shove bought AFTER something already reached the 4 hp
            // frame. The shout is the version that never lets it get there: she pulls a body
            // onto herself and then simply is not there next turn. She is the only unit on the
            // board that FLIES, so "come at me" costs her nothing and costs the horde a walk.
            name: 'Barbed Skids',
            description: 'Anything her rockets hurt turns on her — and she flies away before it arrives.',
            effect: { type: 'TAUNT_ON_HIT' },
            live: true,
        },
        MAT_SPRING_ARM: {
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

    // --- THORNSHELL: catches nobody on his own, and is deadly the moment the enemy chooses to
    //     come to him. His fusions make him last longer, hurt more to touch, and call louder. ---
    THORNSHELL: {
        MAT_SUNFLOWER: {
            name: 'Sunlit Thorn',
            description: 'Provoke costs 15 less Sol.',
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
            // Was ADJACENT_STRIKE (a wider swipe), which pays him for ATTACKING — the half of
            // this hero that is deliberately bad. The jaws go on the RETALIATION instead: he
            // is the body four zombies are dragged into contact with, and now each of them
            // leaves the exchange marked for whoever swings next.
            name: 'Rending Husk',
            description: 'Anything that hits him in melee is left bleeding: the next hit against it lands +1.',
            effect: { type: 'RETALIATE_BLEED' },
            live: true,
        },
        MAT_WALLNUT: {
            // Was +3 max HP. He is the melee body every attack in the fight is aimed at, and
            // the wall-nut column's melee reading is REDUCTION — charged on every one of the
            // many small hits Provoke invites, where a one-off buffer is charged once.
            name: 'Ironthorn',
            description: 'Takes 1 less damage from every hit — the thickest hide in the game, and everything is aimed at it.',
            effect: { type: 'DAMAGE_REDUCTION', value: 1 },
            live: true,
        },
        MAT_CORN_MORTAR: {
            // Was +1 swipe reach. The throwing arm now carries the SHOUT instead of the swing,
            // which is the half of him worth extending: at 5 tiles Provoke reaches the
            // artillery and the fliers that were sitting comfortably outside a 3-tile call.
            name: 'Bellowing Thorn',
            description: 'Provoke reaches 5 tiles instead of 3 — far enough for whatever thought it could outrange him.',
            effect: { type: 'TAUNT_RADIUS', value: 2 },
            live: true,
        },
        MAT_CATTAIL: {
            name: 'Windburr',
            description: '+1 move — 2 damage and move 2 catches nobody. Now he chooses where the provoking happens.',
            effect: { type: 'MOVE_BONUS', value: 1 },
            live: true,
        },
        MAT_ENDURIAN: {
            name: 'Bristling Armor',
            description: 'Melee attackers take 3 back instead of 2.',
            effect: { type: 'RETALIATE_DAMAGE', value: 1 },
            live: true,
        },
        MAT_SPRING_ARM: {
            // The stem's leverage on the one swing he has. A shove out of contact looks like
            // anti-synergy for a taunt hero and is the opposite: he is standing in a crowd by
            // design, so almost every knock-back is a body slammed into another body.
            name: 'Sprung Thorn',
            description: 'His swipe knocks the target back a tile — into whatever is standing behind it.',
            effect: { type: 'ON_HIT_PUSH', value: 1 },
            live: true,
        },
        MAT_PUMPKIN: {
            name: 'Warded Husk',
            description: 'Every zombie he finishes off with a swipe shells him in a layer — the next hit is blocked in full.',
            effect: { type: 'SHIELD_ON_KILL', value: 1 },
            live: true,
        },
    },

    // --- CHARDSLAM: 0 damage is the hero. His row buys hazards, distance and slam damage —
    //     never a damage number, which utils/fusion.ts enforces on its side as well. ---
    CHARDSLAM: {
        MAT_SUNFLOWER: {
            name: 'Sunlit Chard',
            description: 'Every zombie he shoves into water, rock or another body pays 15 Sol.',
            effect: { type: 'SUN_ON_KILL', value: 15 },
            live: true,
        },
        MAT_PEASHOOTER: {
            // Card fixed with the kit: Backswing retired when Vault Toss became the free
            // action (PLAN-hero-zephyr §6.2), and the reach now buys the GRAB — he takes hold
            // of a body two tiles out and it still lands on the mirrored tile behind him.
            name: 'Longarm Chard',
            description: 'Vault Toss grabs from 2 tiles away — he throws without stepping into contact.',
            effect: { type: 'ATTACK_RANGE_BONUS', value: 1 },
            live: true,
        },
        MAT_CHOMPER: {
            // Bleed is not a damage number, so it passes the only gate his row enforces —
            // the hero who finishes nothing himself now marks bodies for whoever does.
            name: 'Rending Chard',
            description: 'His throws leave the target bleeding: the next hit against it lands +1.',
            effect: { type: 'BLEED_ON_HIT' },
            live: true,
        },
        MAT_WALLNUT: {
            // Melee reading of the wall-nut column: he has to walk into contact to do anything
            // at all, so he is charged the many small hits reduction is priced against.
            name: 'Armored Chard',
            description: 'Takes 1 less damage from every hit — he has to walk into contact to do anything at all.',
            effect: { type: 'DAMAGE_REDUCTION', value: 1 },
            live: true,
        },
        MAT_CORN_MORTAR: {
            // Card fixed: the swing is a TOSS now, not a push, so PUSH_DISTANCE never touched
            // it. Sweep is the one shove he owns, and this is the cell that grows it.
            name: 'Catapult Chard',
            description: 'Sweep throws 3 tiles instead of 2 — far enough to find the water from the middle of the board.',
            effect: { type: 'PUSH_DISTANCE', value: 1 },
            live: true,
        },
        MAT_CATTAIL: {
            // The dust falls where the BODIES LAND, not where they were standing — otherwise
            // the veil sits on ground the zombie has just left and cancels nothing. Same one
            // rule as Smokeline: dust settles on the finished position (skillResolution).
            name: 'Veilsweep',
            description: 'Everything Sweep throws kicks up dust where it lands — thrown back, and unable to swing.',
            effect: { type: 'SKILL_DISARM' },
            live: true,
        },
        MAT_ENDURIAN: {
            name: 'Thorned Chard',
            description: 'Melee attackers are thrown a tile back.',
            effect: { type: 'RETALIATE_PUSH' },
            live: true,
        },
        MAT_SPRING_ARM: {
            name: 'Grand Chard',
            description: 'Anything he slams into a body, a rock or the map edge takes 2 extra damage.',
            effect: { type: 'COLLISION_BONUS', value: 2 },
            live: true,
        },
        MAT_PUMPKIN: {
            // Moved off DAMAGE_REDUCTION when Bulwark Chard took that axis — two identical
            // cells in one row is a dead pick. The layer is the pumpkin's own axis anyway, and
            // he DOES finish things: every body he slams into water, rock or another body is a
            // kill in the ledger (Sunlit Guard is paid on exactly the same event).
            name: 'Warded Chard',
            description: 'Every body he slams to death shells him in a layer — the next hit is blocked in full.',
            effect: { type: 'SHIELD_ON_KILL', value: 1 },
            live: true,
        },
    },

    // --- GOURDWARD: worth exactly what the ally he is covering is worth. His fusions make the
    //     shell bigger, cheaper and able to reach more people — and give him a floor of his own. ---
    GOURDWARD: {
        MAT_SUNFLOWER: {
            // 10, not the column's 15 — the ONE cell where the discount is priced down, and
            // the reason is arithmetic rather than theme. Encase is the widest paid effect in
            // the game and Stun Shell turns it into a mass pin as well, so a full-strength
            // discount on top made "shield everyone and pin everything" a five-times-a-fight
            // play (DESIGN-fusion-matrix §9.3). Cornova and Thornshell keep 15: their skills
            // hit one target.
            name: 'Sunlit Rind',
            description: 'Encase costs 10 less Sol.',
            effect: { type: 'SKILL_DISCOUNT', value: 10 },
            live: true,
        },
        MAT_PEASHOOTER: {
            // He never wanted a gun — he wanted to reach the person who needs the shell. The
            // pea makes Reinforce a PELLET: fired down a row like a shot, stopping at the
            // first body (or Greenspire) it meets, exactly as a pea does. Stacks with Long Arm
            // Shell below, which is the one deliberate double on this axis in the matrix.
            name: 'Rind Pellet',
            description: 'Reinforce is fired down a row: it shells the first ally — or Greenspire — up to 4 tiles away.',
            effect: { type: 'ATTACK_RANGE_BONUS', value: 3 },
            live: true,
        },
        MAT_CHOMPER: {
            // Was flat thorns. The jaws go into the SHELL instead, which is the only surface
            // he actually owns: spiked glass, and whatever breaks a layer he handed out walks
            // away bleeding. His one way of hurting anything, and it is still not his swing.
            name: 'Glass Rind',
            description: 'His layers are spiked glass: whatever breaks one is left bleeding — the next hit against it lands +1.',
            effect: { type: 'BARBED_SHIELD' },
            live: true,
        },
        MAT_WALLNUT: {
            // Melee reading of the wall-nut column: he stands in contact to hand out shells,
            // and the chip damage he eats doing it is exactly what reduction is priced for.
            name: 'Ironrind',
            description: 'Takes 1 less damage from every hit — the shell around the ally only lasts while its carrier does.',
            effect: { type: 'DAMAGE_REDUCTION', value: 1 },
            live: true,
        },
        MAT_CORN_MORTAR: {
            // Was Long Arm Shell (+1 reach), which sat on the SAME axis as Rind Pellet one
            // column over and read as the weaker half of a pair. The stun is the corn's real
            // second item and this is the only kit it fits: Encase already reaches the plus
            // around him, so the pin costs him what it should — he has to be standing IN the
            // crowd, at 0 damage, on 8 hp, for a whole turn and 50 Sol.
            //
            // The STUN RULE's third priced exception, and the most expensive of the three.
            name: 'Stun Shell',
            description: 'Encase concusses every zombie it reaches: each one loses its whole next turn.',
            effect: { type: 'SKILL_STUN' },
            live: true,
        },
        MAT_CATTAIL: {
            name: 'Rolling Rind',
            description: '+1 move — his shell is worth exactly as much as his ability to reach whoever needs it.',
            effect: { type: 'MOVE_BONUS', value: 1 },
            live: true,
        },
        MAT_ENDURIAN: {
            name: 'Spined Rind',
            description: 'Anything that hits him in melee is impaled for 1 — going through him to reach his ward costs blood.',
            effect: { type: 'RETALIATE_DAMAGE', value: 1 },
            live: true,
        },
        MAT_SPRING_ARM: {
            // Was Braced Shell (STEADFAST), which was reduction wearing a longer sentence and
            // now collides with Ironrind. The stem turns the shell into a SHOCKWAVE instead:
            // going up is an event, and everything standing against him is thrown off it.
            name: 'Shockrind',
            description: 'Encase blows every enemy standing beside him a tile back as the shell goes up.',
            effect: { type: 'SKILL_REPEL' },
            live: true,
        },
        MAT_PUMPKIN: {
            name: 'Greatrind',
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
