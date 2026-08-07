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
 *   - `basicAttack` — always free, so a hero is never stranded with 0 Sol
 *   - `heroSkill`   — costs Sol; this is where the per-turn decision lives
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
 * that made a 3 HP hero with an element a 2 HP hero — killed outright by ONE ordinary Scrapcap.
 * An element was not a priced choice at that point, it was a trap.
 *
 * Doubling the floor is not a power increase: enemy health and hero damage are untouched, so
 * time-to-kill is exactly what it was. What grew is the buffer between rests, which is the
 * only thing persistence actually spends. The element price doubles with it (-2 max HP), which
 * keeps the cost at the same -20%/-25%/-33% the original argument was built on.
 */
export const HERO_DEFINITIONS: Record<HeroId, HeroDefinition> = {
    PEABURST: {
        id: 'PEABURST',
        name: 'Peaburst',
        role: 'RANGED',
        baseClass: UnitClass.SEED_GUN,
        maxHp: 6, damage: 2, moveRange: 3,
        imgUrl: HERO_ICONS.PEABURST, boardImgUrl: HERO_SPRITES.PEABURST,
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
             * It pierced once, then the trick moved to Thornquill's free Spine Shot and this
             * skill became a volley — and with Thornquill retired (PLAN-hero-zephyr) the
             * volley IS the identity, not a consolation: pierce is worth whatever the lane
             * happens to contain; three shots are worth the same every time and never waste
             * a pea — anything they overkill, they fly past (utils/skillResolution, VOLLEY).
             * Peaburst is the one who deletes a single dangerous body. Nobody taxes a whole
             * row any more, and that gap is deliberate: Reedwing answers crowds with position
             * (two knight-cells a turn), not with a lane sweep.
             *
             * The volley is also the plant side's LAYER-BREAKER (§6.0, decision 15): each pea
             * is its own damage instance, so pea one pops a shell and peas two and three land.
             *
             * 2 a shot rather than 3: the same number as her free Pea Shot, so the skill reads
             * as "the same pea, three times" — and her act upgrade lifts all three at once
             * (BONUS_DAMAGE is folded in before the volley resolves), which takes it to 9.
             * Four shots at 3 was 12 off one click for 50 Sol, against bosses that hold 16.
             */
            description: 'Three peas down the row. Anything they overkill, the rest fly past.',
            rangeType: 'LINE', rangeValue: 4, sunCost: 50,
            effects: [{ type: 'DAMAGE', value: 2 }, { type: 'VOLLEY', value: 3 }],
        },
    },

    IRONHUSK: {
        id: 'IRONHUSK',
        name: 'Ironhusk',
        role: 'MELEE',
        baseClass: UnitClass.ARMOR_PLATE,
        maxHp: 10, damage: 1, moveRange: 2,
        imgUrl: HERO_ICONS.IRONHUSK, boardImgUrl: HERO_SPRITES.IRONHUSK,
        movementType: 'WALKING', immunities: [],
        basicAttack: {
            id: 'wk_bash', name: 'Plate Slam',
            description: 'Shoves an adjacent enemy back. Chip damage only — the shove is the point. Free.',
            rangeType: 'MELEE', rangeValue: 1,
            effects: [{ type: 'DAMAGE', value: 1 }, { type: 'PUSH', value: 1 }],
        },
        /**
         * 35, not 25 (PLAN-heroes-9.md).
         *
         * This was the best buy in the game by a wide margin: 2 damage plus a push plus three
         * tiles of movement, on the 10 HP body, for HALF what every other hero pays. Spend a
         * whole battle's Sol on nothing else and Ironhusk alone lands 14 damage and 7 shoves
         * while the rest of the squad never presses a button.
         *
         * 35 rather than 50 because the thing that already holds it back is real: the dash
         * LEAVES THE CORRIDOR she is being paid to block. Her whole job is standing in the
         * way, so every cast is a small betrayal of the position — that is a cost the other
         * two 50-Sol skills do not carry, and it is worth 15 Sol of the difference.
         */
        heroSkill: {
            id: 'wk_roll', name: 'Rolling Charge',
            description: 'Roll down a straight line and slam the first enemy hit: 2 damage and a push.',
            rangeType: 'DASH', rangeValue: 3, sunCost: 35,
            effects: [{ type: 'DAMAGE', value: 2 }, { type: 'PUSH', value: 1 }],
        },
    },

    SUNBLOOM: {
        id: 'SUNBLOOM',
        name: 'Sunbloom',
        role: 'SUPPORT',
        baseClass: UnitClass.SOL_BATTERY,
        maxHp: 6, damage: 0, moveRange: 2,
        imgUrl: HERO_ICONS.SUNBLOOM, boardImgUrl: HERO_SPRITES.SUNBLOOM,
        movementType: 'WALKING', immunities: ['BURN'],
        // Harvest is free but consumes her action — that is the whole cost.
        // She cannot attack at all, which is what makes her an escort problem.
        basicAttack: {
            id: 'sf_harvest', name: 'Harvest',
            description: 'Spend the turn gathering light. Gain 50 Sol. Free.',
            rangeType: 'SELF', rangeValue: 0,
            // 50, not 25. At 25 she handed the squad exactly what SUN_PER_TURN_INCOME
            // already pays it for free, so spending her whole turn bought nothing — the one
            // hero who cannot attack was also the one whose action was worth nothing. At 50
            // a Harvest DOUBLES the turn's income, which is the multiplier her drawback is
            // priced for, and it matches the plain Sol Battery's own Harvest (data/skills.ts).
            effects: [{ type: 'RESOURCE_GAIN', value: 50, resource: 'SUN' }],
        },
        /**
         * PURE OFFENSIVE & TEMPO BUFF (PLAN-hero-zephyr §6.1). Sol Burn — her
         * old 4-damage lob and only offence — is retired: the support branch deals no direct
         * damage at all now, and what she sells instead is TEMPO & SPEED. The +1 Dmg and +1 Move
         * last only until this player turn ends (BLESSED, cleared before the enemy phase).
         *
         * NO SHIELD: Shield is 100% exclusive to Gourdward's Bunker Shell identity.
         *
         * THE BATTERY: if she carries an element and the ally does not, the ally's attacks
         * borrow it for the same one-turn window (blessedElement). Fire-Sunbloom blesses Snapmaw
         * → this turn the Bite burns. Own element always wins; the loan carries no immunity
         * and no resonance weight.
         */
        heroSkill: {
            id: 'sf_blessing', name: 'Solar Blessing',
            description: 'Blesses an ally: +1 damage and +1 Move speed this turn — and this turn only. Her element rides along.',
            rangeType: 'LOB', rangeValue: 3, sunCost: 50,
            effects: [{ type: 'BLESS' }],
        },
    },

    SNAPMAW: {
        id: 'SNAPMAW',
        name: 'Snapmaw',
        role: 'MELEE',
        baseClass: UnitClass.STEEL_JAWS,
        maxHp: 8, damage: 2, moveRange: 3,
        imgUrl: HERO_ICONS.SNAPMAW, boardImgUrl: HERO_SPRITES.SNAPMAW,
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
         * game costs to erase — an ELITE Linebreaker, floor(4 x 1.5) = 6 HP behind
         * armour 1, and 7 arrives through that armour as 6. So Snapmaw still swallows ANYTHING
         * short of a boss in one bite, the identity is untouched, and it is now a number that
         * meets shields, armour and damage reduction like every other number.
         *
         * Against a boss it is deliberately near-nothing (utils/skillResolution.ts). Snapmaw's
         * reward for beating the Gravehulk is an executioner for thick regular units; it was
         * never meant to be a key that skips the eight fights after it.
         *
         * Price 100 -> 75, which PLAN-heroes-9.md prescribed and nobody applied. At 100 this
         * skill was underwater against the rest of the game: the same Sol buys TWO Sol Burns
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
     * Cornova — the artillery. She is NOT a mid-point between the two peas, even though her
     * numbers sit between theirs: her identity is the trajectory.
     *
     * Every other attack in the game is a LINE, and a LINE stops at the first unit it meets,
     * friend or foe (utils/gameLogic.ts, getValidTargets). The sprout rule makes you park
     * Ironhusk in a corridor, and Ironhusk then blindfolds whoever stands behind her. The
     * Lobber has had the answer to that since day one (`boulder_lob`); the plants
     * have not. Cornova is that answer.
     *
     * Range 2 and move 2 are what the arc costs, and the free shot is the half that had to
     * pay. Damage is not where she was strong — 2 is what Peaburst does. TARGET AVAILABILITY
     * was: a LINE reaches only the first unit in four directions and dies on a friendly body,
     * so Peaburst routinely has one legal target or none, while a LOB 3 covered 24 tiles
     * regardless of what stood in between and essentially always had one. In a game where
     * roughly four fifths of all hero actions are basic attacks, that gap outweighed any
     * damage number. At LOB 2 she has to stand just behind the line she is shooting over,
     * on 4 HP — which is also what finally makes Cob Bunker worth a slot.
     *
     * Nova Shell keeps the full reach: the paid skill is allowed to be the long one.
     *
     * The stun is single-target and paid, and that is load-bearing. The free-and-forever
     * version of it is `UPGRADE_SLOW_TO_FREEZE` (Blizzard) — every attack becoming a stun at
     * no cost. It belonged to Frostpod, who is retired, and is now reserved for the ICE
     * element; one 50-Sol pin per turn is the paid, honest shape of the same idea. Cornova must
     * never be handed ON_HIT_FREEZE by any fusion — see data/fusionRecipes.ts.
     */
    CORNOVA: {
        id: 'CORNOVA',
        name: 'Cornova',
        role: 'RANGED',
        baseClass: UnitClass.CORN_MORTAR,
        maxHp: 8, damage: 2, moveRange: 2,
        imgUrl: HERO_ICONS.CORNOVA, boardImgUrl: HERO_SPRITES.CORNOVA,
        movementType: 'WALKING', immunities: [],
        basicAttack: {
            id: 'kp_corn_toss', name: 'Corn Kernel',
            description: 'Lobs a kernel in an arc — straight over anything standing in the way. Free.',
            rangeType: 'LOB', rangeValue: 2,
            effects: [{ type: 'DAMAGE', value: 2 }],
        },
        heroSkill: {
            id: 'kp_butter_splat', name: 'Nova Shell',
            description: 'Concusses one target: it loses its entire next turn.',
            rangeType: 'LOB', rangeValue: 3, sunCost: 50,
            effects: [{ type: 'DAMAGE', value: 1 }, { type: 'STUN' }],
        },
    },

    /**
     * Reedwing — the drone pilot (PLAN-hero-zephyr §5). The differentiation is MOVEMENT, not
     * the bullet: Peaburst owns LINE+VOLLEY and Cornova owns LOB, so Reedwing's shot is the
     * knight's move — and she FLIES, the only body on the plant side that does.
     *
     * The stat line is one trade written three ways: move 4 (highest) and FLYING buy her any
     * firing position on the board; 4 hp (lowest) is what that freedom costs; and WING_PAIR's
     * fixed geometry is why the position matters — landing BOTH shots is a formation puzzle
     * (the two cells sit exactly two tiles apart), and flight is the tool that solves it.
     * None of the eight knight cells is adjacent to her, so she always fires from just past
     * arm's reach — but anything that does close the gap kills her fast, flying or not.
     */
    REEDWING: {
        id: 'REEDWING',
        name: 'Reedwing',
        role: 'RANGED',
        baseClass: UnitClass.ROTOR_WING,
        // damage 1, not 2. Two barrels firing for 2 each was 4 free damage a turn — double
        // every other basic attack in the game — for the cost of standing where both cells
        // happen to hold a body. At 1 each her free turn is worth 2, the same as a Pea Shot,
        // and what she is actually paying 4 HP for is the SHAPE: two bodies at once, chosen
        // from anywhere on the board. The formation puzzle is the product, not the number.
        maxHp: 4, damage: 1, moveRange: 4,
        imgUrl: HERO_ICONS.REEDWING, boardImgUrl: HERO_SPRITES.REEDWING,
        movementType: 'FLYING', immunities: [],
        basicAttack: {
            id: 'zp_wing_guns', name: 'Wing Guns',
            description: 'Pick a direction: both wing rockets fire at once for 1 each, two knight\'s-move tiles ahead. Free.',
            // rangeValue is nominal — WING_PAIR's geometry is fixed (the 8 knight cells).
            rangeType: 'WING_PAIR', rangeValue: 2,
            effects: [{ type: 'DAMAGE', value: 1 }],
        },
        heroSkill: {
            id: 'zp_smoke_pod', name: 'Smoke Pod',
            /**
             * The veil is DUST_VEIL's own machinery (turnManager `blinded`): nothing that
             * ends its turn inside can line up a swing. No damage, no wall — it buys the
             * TURN she needs to leave the pocket she just flew into, not the fight.
             *
             * NARROW AND LONG (2 tiles, 3 turns) rather than wide and brief. The blind rule
             * is symmetric — the squad's own damage skills are refused inside dust too
             * (gameLogic `getValidSkillTargets`) — so a five-tile plus walled off her own
             * line as often as the horde's, and a hero whose price is 4 HP should not also
             * be the hero who decides where her friends may shoot. Two tiles is a scalpel;
             * three turns is what makes laying it EARLY worth doing, which is the whole of
             * the Sandreaver answer (bossBehaviours `pickHole` refuses dusted ground).
             *
             * It cancels SWINGS, never summons: the Headliner still calls its dancers out
             * of the dust (turnManager, the blinded gate). One pod is not the answer to
             * every act.
             */
            description: 'Drops a smoke pod: two tiles of dust for 3 turns. Nothing inside can aim an attack — her squad included.',
            rangeType: 'LOB', rangeValue: 2, sunCost: 50,
            effects: [{ type: 'DUST_TILE', value: 3 }],
        },
    },

    /**
     * Thornshell — the hero who picks where the fight happens.
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
    THORNSHELL: {
        id: 'THORNSHELL',
        name: 'Thornshell',
        role: 'MELEE',
        baseClass: UnitClass.SPIKE_ARMOR,
        maxHp: 10, damage: 2, moveRange: 2,
        imgUrl: HERO_ICONS.THORNSHELL, boardImgUrl: HERO_SPRITES.THORNSHELL,
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
            effects: [{ type: 'PROVOKE', value: 3 }],
        },
    },

    /**
     * Chardslam — 0 damage is not a weakness to be fixed later, it IS the hero.
     *
     * He does not kill with damage, he kills with TERRAIN. A 2-tile shove reads off the
     * existing rules: into another body, a mountain or the map edge and BOTH sides take 1
     * collision damage; into water it is an instant DROWN; into lava it is damage plus BURN;
     * and into empty ground it simply buys a turn, because that zombie no longer reaches a
     * Greenspire this turn.
     *
     * The flip side is the honest weakness: on a bare board with no water and no mountains he
     * is close to harmless. His fusion row has to hand him a damage source of his own, or
     * more distance.
     *
     * Against Ironhusk he is the opposite reading of the same corridor problem: she holds
     * position and shoves 1, he walks in and throws 2.
     */
    CHARDSLAM: {
        id: 'CHARDSLAM',
        name: 'Chardslam',
        role: 'SUPPORT',
        baseClass: UnitClass.SPRING_ARM,
        maxHp: 8, damage: 0, moveRange: 3,
        imgUrl: HERO_ICONS.CHARDSLAM, boardImgUrl: HERO_SPRITES.CHARDSLAM,
        movementType: 'WALKING', immunities: [],
        /**
         * VAULT TOSS — ItB's judo throw, as the FREE basic (PLAN-hero-zephyr §6.2). Grab the
         * adjacent body, hurl it over his head to the mirrored tile. Still no DAMAGE effect:
         * the 1 the target takes on landing is COLLISION damage dealt by the ground
         * (armour-bypassing like every fall, and Grand Chard's +2 scales it) — "0 damage is
         * the hero" survives because gravity, not the swing, does the hurting. The landing
         * tile must be free (the ItB rule: no throwing into a body), and PUSH immunity
         * refuses the grab. Backswing retired: push OUT is Sweep's job now, and the toss is
         * the pull-through — both directions of repositioning live in one kit.
         */
        basicAttack: {
            id: 'cw_vault_toss', name: 'Vault Toss',
            description: 'Grabs an adjacent enemy and hurls it over his head to the opposite tile — it takes 1 on landing. Free.',
            rangeType: 'MELEE', rangeValue: 1,
            effects: [{ type: 'TOSS' }],
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
     * support role — a different economy from the one Sunbloom runs.
     *
     * Shield rather than heal because this game is built on telegraphs: every enemy attack is
     * announced a turn ahead. Blocking a blow the board already showed you is a READ; healing
     * afterwards is just cleanup. Shields reward looking forward.
     *
     * Alone he wins nothing — no attack at all since the rework. He is worth exactly as much
     * as whoever (and whatever: the Greenspires are his too now) he is covering.
     */
    GOURDWARD: {
        id: 'GOURDWARD',
        name: 'Gourdward',
        role: 'SUPPORT',
        baseClass: UnitClass.BUNKER_SHELL,
        // damage 0: Rind Bash retired with the rework (PLAN-hero-zephyr §6.3) — he has no
        // attack of his own. He still takes an ELEMENT (see the ward note below).
        maxHp: 8, damage: 0, moveRange: 3,
        imgUrl: HERO_ICONS.GOURDWARD, boardImgUrl: HERO_SPRITES.GOURDWARD,
        /**
         * THE WARD, and it is ONE element, not three.
         *
         * It shipped as a static `immunities: ['BURN','FREEZE','SHOCK']` — every element in
         * the game, unconditionally. That read well against the lightning boss and quietly
         * deleted his element slot: a hero who is already immune to all three has nothing
         * left to buy, so `elementSlot: 'NONE'` had to be invented to hide a picker that
         * would have been a shop selling a trap.
         *
         * Now the immunity IS the element. Pick FIRE and he cannot be cooked; pick ICE and he
         * cannot be set; pick LIGHTNING and the arc will not conduct through him — and
         * `elementalImmunities` in utils/unitFactory has done exactly that for every hero
         * since elements existed, so the ward costs zero engine code and the slot becomes a
         * real decision priced at the standard 2 max HP. It is one act of the campaign's
         * worth of protection instead of three, which is the trade.
         *
         * His element rides ENCASE (rule L2, utils/elements `elementCarrier`): neither of his
         * actions can touch an enemy, so it lands on the paid one — where Shockrind's shove
         * gives it something to ride.
         */
        movementType: 'WALKING', immunities: [],
        /**
         * Reinforce replaces Rind Bash: the free action is now a LAYER handed to anything
         * allied standing beside him — hero, seedling, and the NHÀ itself (a Greenspire takes the
         * layer as `TileData.shielded`; the sprout bite breaks the layer instead of the
         * sprout, and the tug-of-war with the zombie on the doorstep is the fantasy).
         */
        basicAttack: {
            id: 'gw_reinforce', name: 'Reinforce',
            description: 'Shells an adjacent ally — or a Greenspire — in a layer: the next hit against it is blocked in full. Free.',
            rangeType: 'MELEE', rangeValue: 1,
            effects: [{ type: 'SHIELD', value: 1 }],
        },
        /**
         * AoE now — the plus around him, everyone at once (decision 9). Under layers the
         * value of a shield skill is BREADTH, not size: one layer eats ANY single blow (boss
         * fist included), what it cannot do is eat two — Clockjaw's double swing takes one
         * on the shell and lands the second, which is exactly the texture that boss is for.
         * SELF + SHIELD + a Sol cost is the radial-shield case in skillResolution; the free
         * bench self-shields (Harden, Iron Stance) stay single-target through the same gate.
         */
        heroSkill: {
            /**
             * 60, not 50 — the one skill in the roster priced above the standard.
             *
             * Encase is the widest paid effect in the game (self plus the whole plus, every
             * time), and with Stun Shell fused it also pins everything that ring touches. At
             * 50 with his own 15 discount it landed for 35, which bought FIVE casts out of a
             * six-turn fight's 200 Sol — a full squad shield and a mass pin, every turn but
             * one. At 60 with a 10 discount it lands for 50 and buys four; bare, it buys three.
             * The breadth is the identity, so the cost is where the brake goes.
             */
            id: 'gw_encase', name: 'Encase',
            description: 'Shells himself and every ally beside him in a layer, all at once.',
            rangeType: 'SELF', rangeValue: 0, sunCost: 60,
            effects: [{ type: 'SHIELD', value: 1 }],
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
    'PEABURST',
    'IRONHUSK',
    'SUNBLOOM',
];
