import { HeroDefinition, HeroId, UnitClass } from '../types';
import { HERO_ICONS, HERO_SPRITES } from '../utils/icons';

/**
 * The hero roster (DESIGN.md section 7, the final nine of PLAN-heroes-9.md).
 *
 * Nine heroes is the whole set: three ranged, three melee, three support, and no tenth.
 * Frostpod used to be here as a leftover from before that plan; she was retired because the
 * plan folds ice into an ELEMENT any hero can carry, which is a better home for it than one
 * hero who owns the cold. Her plant (MAT_SNOW_PEA) stays — it is still gear you can bench or
 * fuse. data/roster.assert.ts fails the build if a tenth hero reappears.
 *
 * Each hero's base plant is also a fusion material (data/materials.ts): one plant, two ways
 * to spend it.
 *
 * Every hero has exactly two actions:
 *   - `basicAttack` — always free, so a hero is never stranded with 0 Sun
 *   - `heroSkill`   — costs Sun; this is where the per-turn decision lives
 *
 * Two hero skills deliberately reuse skill ids that already have special handling
 * in the resolution code: 'burrow_strike' (blunted against bosses, and digesting) and
 * 'ignite' (creates a FIRE tile).
 *
 * MAX HP IS ON A DOUBLED SCALE: 6 / 8 / 10, not 3 / 4 / 5 (PLAN-boards-bosses.md section 6).
 *
 * Two rules that were settled elsewhere collided here. Hero health PERSISTS between battles
 * (utils/unitFactory.ts: "carried health, not a fresh body") and a campfire can be four layers
 * away; and carrying an element costs max HP (PLAN-progression.md section 3). On the old scale
 * that made a 3 HP hero with an element a 2 HP hero — killed outright by ONE ordinary Conehead.
 * An element was not a priced choice at that point, it was a trap.
 *
 * Doubling the floor is not a power increase: enemy health and hero damage are untouched, so
 * time-to-kill is exactly what it was. What grew is the buffer between rests, which is the
 * only thing persistence actually spends. The element price doubles with it (-2 max HP), which
 * keeps the cost at the same -20%/-25%/-33% the original argument was built on.
 */
export const HERO_DEFINITIONS: Record<HeroId, HeroDefinition> = {
    GREEN_SHADOW: {
        id: 'GREEN_SHADOW',
        name: 'Shadeleaf',
        role: 'RANGED',
        baseClass: UnitClass.PEASHOOTER,
        maxHp: 6, damage: 2, moveRange: 3,
        imgUrl: HERO_ICONS.GREEN_SHADOW, boardImgUrl: HERO_SPRITES.GREEN_SHADOW,
        movementType: 'WALKING', immunities: [],
        basicAttack: {
            id: 'gs_pea', name: 'Pea Shot',
            description: 'Fires a pea down the row. Free.',
            rangeType: 'LINE', rangeValue: 8,
            effects: [{ type: 'DAMAGE', value: 2 }],
        },
        heroSkill: {
            id: 'gs_precision_blast', name: 'Precision Blast',
            /**
             * THREE PEAS, and pierce is gone.
             *
             * It pierced, and so does Thornquill's Spine Shot — which is FREE, runs six tiles
             * instead of four, and is the thing he is named for. Two heroes doing one trick is
             * one hero too many, and the one charging 50 Sun for it was the one who should
             * stop. Pierce is his now.
             *
             * A volley answers a different question. Pierce is worth whatever the lane happens
             * to contain; three shots are worth the same every time and never waste a pea —
             * anything they overkill, they fly past (utils/skillResolution, VOLLEY). So
             * Shadeleaf becomes the one who deletes a single dangerous body, and Thornquill
             * stays the one who taxes a whole row.
             *
             * 2 a shot rather than 3: the same number as her free Pea Shot, so the skill reads
             * as "the same pea, three times" — and her act upgrade lifts all three at once
             * (BONUS_DAMAGE is folded in before the volley resolves), which takes it to 9.
             * Four shots at 3 was 12 off one click for 50 Sun, against bosses that hold 16.
             */
            description: 'Three peas down the row. Anything they overkill, the rest fly past.',
            rangeType: 'LINE', rangeValue: 4, sunCost: 50,
            effects: [{ type: 'DAMAGE', value: 2 }, { type: 'VOLLEY', value: 3 }],
        },
    },

    WALL_KNIGHT: {
        id: 'WALL_KNIGHT',
        name: 'Ironhusk',
        role: 'MELEE',
        baseClass: UnitClass.WALLNUT,
        maxHp: 10, damage: 1, moveRange: 2,
        imgUrl: HERO_ICONS.WALL_KNIGHT, boardImgUrl: HERO_SPRITES.WALL_KNIGHT,
        movementType: 'WALKING', immunities: [],
        basicAttack: {
            id: 'wk_bash', name: 'Shield Bash',
            description: 'Shoves an adjacent enemy back. Chip damage only — the shove is the point. Free.',
            rangeType: 'MELEE', rangeValue: 1,
            effects: [{ type: 'DAMAGE', value: 1 }, { type: 'PUSH', value: 1 }],
        },
        /**
         * 35, not 25 (PLAN-heroes-9.md).
         *
         * This was the best buy in the game by a wide margin: 2 damage plus a push plus three
         * tiles of movement, on the 10 HP body, for HALF what every other hero pays. Spend a
         * whole battle's Sun on nothing else and Ironhusk alone lands 14 damage and 7 shoves
         * while the rest of the squad never presses a button.
         *
         * 35 rather than 50 because the thing that already holds it back is real: the dash
         * LEAVES THE CORRIDOR she is being paid to block. Her whole job is standing in the
         * way, so every cast is a small betrayal of the position — that is a cost the other
         * two 50-Sun skills do not carry, and it is worth 15 Sun of the difference.
         */
        heroSkill: {
            id: 'wk_roll', name: 'Rolling Charge',
            description: 'Roll down a straight line and slam the first enemy hit: 2 damage and a push.',
            rangeType: 'DASH', rangeValue: 3, sunCost: 35,
            effects: [{ type: 'DAMAGE', value: 2 }, { type: 'PUSH', value: 1 }],
        },
    },

    SOLAR_FLARE: {
        id: 'SOLAR_FLARE',
        name: 'Sunspot',
        role: 'SUPPORT',
        baseClass: UnitClass.SUNFLOWER,
        maxHp: 6, damage: 0, moveRange: 2,
        imgUrl: HERO_ICONS.SOLAR_FLARE, boardImgUrl: HERO_SPRITES.SOLAR_FLARE,
        movementType: 'WALKING', immunities: ['BURN'],
        // Harvest is free but consumes her action — that is the whole cost.
        // She cannot attack at all, which is what makes her an escort problem.
        basicAttack: {
            id: 'sf_harvest', name: 'Harvest',
            description: 'Spend the turn gathering light. Gain 50 Sun. Free.',
            rangeType: 'SELF', rangeValue: 0,
            // 50, not 25. At 25 she handed the squad exactly what SUN_PER_TURN_INCOME
            // already pays it for free, so spending her whole turn bought nothing — the one
            // hero who cannot attack was also the one whose action was worth nothing. At 50
            // a Harvest DOUBLES the turn's income, which is the multiplier her drawback is
            // priced for, and it matches the plain Sunflower's own Harvest (data/skills.ts).
            effects: [{ type: 'RESOURCE_GAIN', value: 50, resource: 'SUN' }],
        },
        heroSkill: {
            id: 'sf_sunburn', name: 'Sun Burn',
            description: 'Scorch a nearby tile for heavy damage.',
            rangeType: 'LOB', rangeValue: 3, sunCost: 50,
            effects: [{ type: 'DAMAGE', value: 4 }],
        },
    },

    CHOMPZILLA: {
        id: 'CHOMPZILLA',
        name: 'Maw',
        role: 'MELEE',
        baseClass: UnitClass.CHOMPER,
        maxHp: 8, damage: 2, moveRange: 3,
        imgUrl: HERO_ICONS.CHOMPZILLA, boardImgUrl: HERO_SPRITES.CHOMPZILLA,
        movementType: 'WALKING', immunities: [],
        basicAttack: {
            id: 'cz_bite', name: 'Bite',
            description: 'A quick chomp on an adjacent enemy. Free.',
            rangeType: 'MELEE', rangeValue: 1,
            effects: [{ type: 'DAMAGE', value: 2 }],
        },
        /**
         * 7, not 999.
         *
         * The old value was an instant kill wearing a damage number, and it needed an
         * exception to survive contact with anything it was not supposed to erase — which is
         * how it ended up deleting bosses the moment bosses stopped being Massive. A magic
         * number needs a magic exception, and the exception is the part that rots.
         *
         * 7 is chosen, not rounded to: it is exactly what the toughest non-boss body in the
         * game costs to erase — an ELITE Football Zombie, floor(4 x 1.5) = 6 HP behind
         * armour 1, and 7 arrives through that armour as 6. So Maw still swallows ANYTHING
         * short of a boss in one bite, the identity is untouched, and it is now a number that
         * meets shields, armour and damage reduction like every other number.
         *
         * Against a boss it is deliberately near-nothing (utils/skillResolution.ts). Maw's
         * reward for beating the Gargantuar is an executioner for thick regular units; it was
         * never meant to be a key that skips the eight fights after it.
         *
         * Price 100 -> 75, which PLAN-heroes-9.md prescribed and nobody applied. At 100 this
         * skill was underwater against the rest of the game: the same Sun buys TWO Sun Burns
         * (8 damage, range 3, no drawback) while this costs melee range plus two turns of
         * standing still. The digest is only payable because the payoff is a body erased —
         * and note it only fires ON A KILL (skillResolution), so a bite that fails to finish
         * something is not billed for the downtime.
         */
        heroSkill: {
            id: 'burrow_strike', name: 'Devour',
            description: 'Swallow an adjacent enemy: 7 damage, enough to finish anything but a boss. Digests for 2 turns.',
            rangeType: 'MELEE', rangeValue: 1, sunCost: 75,
            effects: [{ type: 'DAMAGE', value: 7 }],
        },
    },

    /**
     * Cobb — the artillery. She is NOT a mid-point between the two peas, even though her
     * numbers sit between theirs: her identity is the trajectory.
     *
     * Every other attack in the game is a LINE, and a LINE stops at the first unit it meets,
     * friend or foe (utils/gameLogic.ts, getValidTargets). The brain rule makes you park
     * Ironhusk in a corridor, and Ironhusk then blindfolds whoever stands behind her. The
     * Catapult Zombie has had the answer to that since day one (`basketball_lob`); the plants
     * have not. Cobb is that answer.
     *
     * Range 2 and move 2 are what the arc costs, and the free shot is the half that had to
     * pay. Damage is not where she was strong — 2 is what Shadeleaf does. TARGET AVAILABILITY
     * was: a LINE reaches only the first unit in four directions and dies on a friendly body,
     * so Shadeleaf routinely has one legal target or none, while a LOB 3 covered 24 tiles
     * regardless of what stood in between and essentially always had one. In a game where
     * roughly four fifths of all hero actions are basic attacks, that gap outweighed any
     * damage number. At LOB 2 she has to stand just behind the line she is shooting over,
     * on 4 HP — which is also what finally makes Cob Bunker worth a slot.
     *
     * Butter Splat keeps the full reach: the paid skill is allowed to be the long one.
     *
     * Butter is single-target and paid, and that is load-bearing. The free-and-forever
     * version of it is `UPGRADE_SLOW_TO_FREEZE` (Blizzard) — every attack becoming a stun at
     * no cost. It belonged to Frostpod, who is retired, and is now reserved for the ICE
     * element; one 50-Sun pin per turn is the paid, honest shape of the same idea. Cobb must
     * never be handed ON_HIT_FREEZE by any fusion — see data/fusionRecipes.ts.
     */
    KERNEL_PULT: {
        id: 'KERNEL_PULT',
        name: 'Cobb',
        role: 'RANGED',
        baseClass: UnitClass.KERNEL_PULT,
        maxHp: 8, damage: 2, moveRange: 2,
        imgUrl: HERO_ICONS.KERNEL_PULT, boardImgUrl: HERO_SPRITES.KERNEL_PULT,
        movementType: 'WALKING', immunities: [],
        basicAttack: {
            id: 'kp_corn_toss', name: 'Corn Kernel',
            description: 'Lobs a kernel in an arc — straight over anything standing in the way. Free.',
            rangeType: 'LOB', rangeValue: 2,
            effects: [{ type: 'DAMAGE', value: 2 }],
        },
        heroSkill: {
            id: 'kp_butter_splat', name: 'Butter Splat',
            description: 'Butters one target: it loses its entire next turn.',
            rangeType: 'LOB', rangeValue: 3, sunCost: 50,
            effects: [{ type: 'DAMAGE', value: 1 }, { type: 'STUN' }],
        },
    },

    /**
     * Thornquill — the crowd-clearer. Pierce on the FREE attack is the whole hero, and
     * 1 damage is what that costs.
     *
     * Shadeleaf pays 50 Sun for pierce (Precision Blast). If Thornquill pierced for 2, she
     * would be Shadeleaf with the paid skill switched on permanently — strictly better on
     * every tile, and there would be no reason to field the original. At 1 damage the two
     * answer different boards instead: one 3-hp Conehead is Shadeleaf's problem (2 dmg kills
     * in two turns; Thornquill needs three), four 2-hp Zombies queued up in a corridor is
     * Thornquill's (four tiles x 1, clean in two turns).
     *
     * The consequence is that she cannot finish anything thick. Her fusion row has to buy
     * damage or extra shots — see data/fusionRecipes.ts.
     */
    THORNQUILL: {
        id: 'THORNQUILL',
        name: 'Thornquill',
        role: 'RANGED',
        baseClass: UnitClass.CACTUS,
        maxHp: 6, damage: 1, moveRange: 2,
        imgUrl: HERO_ICONS.THORNQUILL, boardImgUrl: HERO_SPRITES.THORNQUILL,
        movementType: 'WALKING', immunities: [],
        basicAttack: {
            id: 'tq_spine_shot', name: 'Spine Shot',
            description: 'A spine that runs the whole row, through every body in it. Free.',
            rangeType: 'LINE', rangeValue: 6,
            effects: [{ type: 'DAMAGE', value: 1 }, { type: 'PIERCE_ATTACK' }],
        },
        // The only hero attack that leaves TERRAIN behind: the row stays dangerous after the
        // shot lands, so it also taxes whatever walks in next turn.
        heroSkill: {
            id: 'tq_spine_wall', name: 'Spine Wall',
            description: 'A heavier volley that leaves the row bristling with spikes.',
            rangeType: 'LINE', rangeValue: 6, sunCost: 50,
            effects: [
                { type: 'DAMAGE', value: 2 },
                { type: 'PIERCE_ATTACK' },
                { type: 'SPIKE_TILE', value: 1 },
            ],
        },
    },

    /**
     * Thornhide — the hero who picks where the fight happens.
     *
     * Provoke fills a real hole, not "one more tank". Three zombies are built specifically to
     * go around a wall, and data/zombies.ts says so in its own comments: the Balloon flies
     * over everything, the Digger is `movementType: 'TELEPORT'` and surfaces behind the line,
     * and the Catapult has `attackRange: 3` and outranges every melee hero. Against all three
     * Ironhusk does nothing at all — she only stops what agrees to walk into her. Until now
     * the only answer was to kill them, i.e. back to damage. A taunt is the fourth answer, and
     * the only one that works on all three: flying, burrowing and outranging are all beaten by
     * being FORCED to swing at the spikes.
     *
     * And with retaliate 2, being hit is itself a damage source — so Provoke is not just
     * defence, it is how this hero deals damage. Four zombies dragged into contact is 8
     * damage back for no action spent.
     *
     * He is terrible on offence by design: 2 damage and move 2 catches nobody. He is only
     * strong when the enemy comes to him.
     */
    THORNHIDE: {
        id: 'THORNHIDE',
        name: 'Thornhide',
        role: 'MELEE',
        baseClass: UnitClass.ENDURIAN,
        maxHp: 10, damage: 2, moveRange: 2,
        imgUrl: HERO_ICONS.THORNHIDE, boardImgUrl: HERO_SPRITES.THORNHIDE,
        movementType: 'WALKING', immunities: [],
        // No fusion needed: the retaliation IS the baseline, and fusions raise it from there.
        retaliateDamage: 2,
        basicAttack: {
            id: 'th_thorn_swipe', name: 'Thorn Swipe',
            description: 'A spiked swipe at an adjacent enemy. Anything that hits him back bleeds for it. Free.',
            rangeType: 'MELEE', rangeValue: 1,
            effects: [{ type: 'DAMAGE', value: 2 }],
        },
        heroSkill: {
            id: 'th_provoke', name: 'Provoke',
            description: 'Every enemy within 3 tiles must come for him next turn.',
            rangeType: 'SELF', rangeValue: 0, sunCost: 50,
            effects: [{ type: 'TAUNT', value: 3 }],
        },
    },

    /**
     * Chardwall — 0 damage is not a weakness to be fixed later, it IS the hero.
     *
     * He does not kill with damage, he kills with TERRAIN. A 2-tile shove reads off the
     * existing rules: into another body, a mountain or the map edge and BOTH sides take 1
     * collision damage; into water it is an instant DROWN; into lava it is damage plus BURN;
     * and into empty ground it simply buys a turn, because that zombie no longer reaches a
     * house this turn.
     *
     * The flip side is the honest weakness: on a bare board with no water and no mountains he
     * is close to harmless. His fusion row has to hand him a damage source of his own, or
     * more distance.
     *
     * Against Ironhusk he is the opposite reading of the same corridor problem: she holds
     * position and shoves 1, he walks in and throws 2.
     */
    CHARDWALL: {
        id: 'CHARDWALL',
        name: 'Chardwall',
        role: 'SUPPORT',
        baseClass: UnitClass.CHARD_GUARD,
        maxHp: 8, damage: 0, moveRange: 3,
        imgUrl: HERO_ICONS.CHARDWALL, boardImgUrl: HERO_SPRITES.CHARDWALL,
        movementType: 'WALKING', immunities: [],
        // Deliberately no DAMAGE effect. Where the target lands is the entire payload.
        basicAttack: {
            id: 'cw_backswing', name: 'Backswing',
            description: 'Hurls an adjacent enemy two tiles back. No damage — where it lands is the point. Free.',
            rangeType: 'MELEE', rangeValue: 1,
            effects: [{ type: 'PUSH', value: 2 }],
        },
        // SELF + PUSH is the radial-push case in utils/skillResolution.ts: it fires at all
        // four neighbouring tiles at once.
        heroSkill: {
            id: 'cw_sweep', name: 'Sweep',
            description: 'Sweeps every adjacent enemy two tiles away at once.',
            rangeType: 'SELF', rangeValue: 0, sunCost: 50,
            effects: [{ type: 'PUSH', value: 2 }],
        },
    },

    /**
     * Gourdward — the one axis nothing else in the game touches: keeping the squad alive.
     *
     * Nothing in data/ uses `type: 'HEAL'`; healing exists only at the campfire, between
     * battles. And hero hp now PERSISTS between battles, so every point lost in this fight is
     * a debt carried into the next one. That makes protecting the squad ECONOMY, not a dull
     * support role — a different economy from the one Sunspot runs.
     *
     * Shield rather than heal because this game is built on telegraphs: every enemy attack is
     * announced a turn ahead. Blocking a blow the board already showed you is a READ; healing
     * afterwards is just cleanup. Shields reward looking forward.
     *
     * Alone he wins nothing — 1 damage, no control. He is worth exactly as much as whoever he
     * is covering.
     */
    GOURDWARD: {
        id: 'GOURDWARD',
        name: 'Gourdward',
        role: 'SUPPORT',
        baseClass: UnitClass.PUMPKIN,
        maxHp: 8, damage: 1, moveRange: 3,
        imgUrl: HERO_ICONS.GOURDWARD, boardImgUrl: HERO_SPRITES.GOURDWARD,
        movementType: 'WALKING', immunities: [],
        basicAttack: {
            id: 'gw_rind_bash', name: 'Rind Bash',
            description: 'A blunt shove with a hard rind. Free.',
            rangeType: 'MELEE', rangeValue: 1,
            effects: [{ type: 'DAMAGE', value: 1 }],
        },
        heroSkill: {
            id: 'gw_encase', name: 'Encase',
            // 5, not 3. A shield is measured against the body it covers: 3 on a 4 HP hero was
            // +75% of a life, and the same 3 on the doubled 8 HP body is +37% — the hero's one
            // axis quietly halving because a number somewhere else moved. 5 is the amount that
            // eats a whole boss blow (2-5 damage, section 5 of PLAN-boards-bosses.md), which is
            // the thing he exists to do.
            description: 'Wraps an ally in shell: 5 shield, soaked before any health is lost.',
            rangeType: 'LOB', rangeValue: 3, sunCost: 50,
            effects: [{ type: 'SHIELD', value: 5 }],
        },
    },
};

/**
 * Heroes available in a brand-new save.
 *
 * These three and no more: they are the trio in the opening comic and the only speakers in
 * the tutorial, so the game already introduces them as *the* squad. The other two used to be
 * in this list too, which meant nothing was ever locked and the whole unlock system was
 * dead code. They are now boss rewards — see `data/unlocks.ts`.
 */
export const STARTING_HEROES: HeroId[] = [
    'GREEN_SHADOW',
    'WALL_KNIGHT',
    'SOLAR_FLARE',
];
