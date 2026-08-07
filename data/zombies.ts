
import { UnitClass, UnitDefinition } from '../types';
import { ICONS } from '../utils/icons';

// Using Partial because this only contains Zombies, not ALL UnitClasses
export const ZOMBIE_DEFINITIONS: Partial<Record<UnitClass, UnitDefinition>> = {
    [UnitClass.WALKER]: {
        class: UnitClass.WALKER, name: 'Walker', maxHp: 2, damage: 1, moveRange: 3,
        imgUrl: ICONS.WALKER,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 2, dmg: 1, move: 3, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    /**
     * ARMOUR IS METAL, AND ONLY METAL (the Magnet Pulse rule made it literal). `armor: 1`
     * shaves every weapon hit, and may shave it to ZERO — and because armour is metal, the
     * Magnet Pulse rips it off. That one sentence now decides who gets the stat:
     *
     *   Scrapcap      3 HP, no armour   a PLASTIC cone is not a helmet, and PvZ's magnet
     *                                   famously leaves it alone. Its toughness is padding.
     *   Pothelm    3 HP + armor 1    the metal bucket.
     *   Doorbearer   2 HP + armor 1    the metal door — see its own note.
     *   Linebreaker      4 HP + armor 1    helmet and pads — see its own note.
     *
     * Time-to-kill against the MAIN damage tier (2 — Peaburst, Snapmaw, Cornova, Thornshell) is
     * preserved where it matters: Scrapcap two hits (was two through armour), Pothelm
     * three, Doorbearer two. The CHIP tier (1 damage) now has a real split instead of a
     * uniform wall: it works on the Scrapcap again (three hits of honest plastic) and clangs
     * off the three metal bodies until something answers the metal — push it, burn it
     * (environment bypasses armour), spike its lane, or magnet the armour off outright.
     *
     * Interactions that keep this honest: FIRE (element or terrain) ignores armour, ground
     * spikes ignore armour, the Seed Mine's trap applies raw damage — so nothing here can
     * make a body unkillable, only pea-proof.
     */
    [UnitClass.SCRAPCAP]: {
        // 3 HP, up from 2, because the armour left: 2 HP bare is a Basic Zombie with a hat.
        // Three keeps it exactly two main-tier hits, one more than the Basic — same ladder
        // rung it held when the cone was (wrongly) worth an armour point.
        class: UnitClass.SCRAPCAP, name: 'Scrapcap', maxHp: 3, damage: 2, moveRange: 3,
        imgUrl: ICONS.SCRAPCAP,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 3, dmg: 2, move: 3, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.POTHELM]: {
        class: UnitClass.POTHELM, name: 'Pothelm', maxHp: 3, damage: 2, moveRange: 3, armor: 1,
        imgUrl: ICONS.POTHELM,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 3, dmg: 2, move: 3, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.TATTERGUARD]: {
        class: UnitClass.TATTERGUARD, name: 'Tatterguard', maxHp: 3, damage: 1, moveRange: 3,
        imgUrl: ICONS.TATTERGUARD,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 3, dmg: 3, move: 4, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.DOORBEARER]: {
        // The door is METAL now, so it is armour (Magnet Pulse takes it) — and the body
        // behind it dropped to 2 HP to pay for keeping STATUS. History demands the care:
        // this zombie once out-tanked the Pothelm while ALSO ignoring every status in
        // the game — strictly better on both axes. The split today: the bucket is the
        // tougher grind (3 HP behind the same armour), the door is control-proof but only
        // two main-tier hits of meat — and one magnet pulse leaves a 2 HP nobody that
        // every status in the game suddenly sticks to.
        class: UnitClass.DOORBEARER, name: 'Doorbearer', maxHp: 2, damage: 2, moveRange: 3, armor: 1,
        imgUrl: ICONS.DOORBEARER,
        movementType: 'WALKING', immunities: ['STATUS'],
        cost: 0,
        maxStats: { hp: 2, dmg: 2, move: 3, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.MINER]: {
        class: UnitClass.MINER, name: 'Miner', maxHp: 3, damage: 2, moveRange: 3,
        imgUrl: ICONS.MINER,
        movementType: 'TELEPORT',
        immunities: [],
        cost: 0,
        maxStats: { hp: 3, dmg: 2, move: 3, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.LINEBREAKER]: {
        // The helmet and pads are METAL: armour 1, and no immunities at all — the PUSH
        // immunity it used to carry is gone by design (PvZ's linebacker is fast and tough,
        // not unshovable). 4 HP behind armour makes it the bulk king of the commons — four
        // main-tier hits, chip-proof — but every answer armour teaches now works on it:
        // shove it into a hazard, burn it, spike its sprint lane, or magnet the pads off
        // and watch a 4 HP body arrive at the line naked.
        class: UnitClass.LINEBREAKER, name: 'Linebreaker', maxHp: 4, damage: 2, moveRange: 4, armor: 1,
        imgUrl: ICONS.LINEBREAKER,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 4, dmg: 2, move: 4, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.LEAPER]: {
        class: UnitClass.LEAPER, name: 'Leaper', maxHp: 3, damage: 2, moveRange: 4,
        imgUrl: ICONS.LEAPER,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 3, dmg: 2, move: 4, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.DANCER]: {
        class: UnitClass.DANCER, name: 'Dancer', maxHp: 4, damage: 1, moveRange: 3,
        imgUrl: ICONS.DANCER,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 4, dmg: 1, move: 3, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    /**
     * The answer to a turtled squad. It ignores walls, water and bodies entirely, so a
     * hard-held choke point does nothing to it — but 2 HP means a single pea pops it.
     */
    [UnitClass.FLOATER]: {
        class: UnitClass.FLOATER, name: 'Floater', maxHp: 2, damage: 2, moveRange: 4,
        imgUrl: ICONS.FLOATER,
        movementType: 'FLYING', immunities: ['DROWN'],
        cost: 0,
        maxStats: { hp: 2, dmg: 2, move: 4, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    /**
     * Outranges every melee hero: it shells plants from 3 tiles away and never has to close.
     * Slow on purpose — the counterplay is to walk to it, not to wait for it.
     */
    [UnitClass.LOBBER]: {
        class: UnitClass.LOBBER, name: 'Lobber', maxHp: 3, damage: 2, moveRange: 2,
        attackRange: 3,
        imgUrl: ICONS.LOBBER,
        movementType: 'WALKING', immunities: ['PUSH'],
        cost: 0,
        maxStats: { hp: 3, dmg: 2, move: 2, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    /**
     * PvZ's huge-wave herald, turned into a priority target. On its own it is nearly
     * harmless (1 damage); the threat is the ENRAGED aura it hands every other zombie
     * on the board. Killing it is worth more than killing anything standing next to it.
     */
    [UnitClass.BANNERMAN]: {
        class: UnitClass.BANNERMAN, name: 'Bannerman', maxHp: 4, damage: 1, moveRange: 3,
        imgUrl: ICONS.BANNERMAN,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 4, dmg: 1, move: 3, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    /**
     * THE HEADLINER (PLAN-boards-bosses.md III-1).
     *
     * 1 damage on a 20 HP body, and that is the design rather than an oversight: the threat is
     * the ENRAGED aura it hands every other zombie, plus the four it calls in every other turn.
     * Killing it is worth more than killing anything standing next to it — which is the exact
     * sentence already written above the Bannerman, turned into a boss.
     *
     * STATUS-immune so the answer cannot be "stun it and walk away"; it has to be killed.
     */
    /**
     * BOSS IMMUNITIES — ONE EACH, AND ONLY WHERE IT IS THE POINT.
     *
     * An immunity exists to make ONE tool fail, so the player has to reach for another. That
     * only works while it is rare. It was not: PUSH sat on six of the ten bosses and FREEZE on
     * five, so more than half of every boss fight in the game deleted Ironhusk, Chardslam and
     * the whole ICE element — and Chardslam deals zero damage, which made him a spectator in
     * six of the fights he was unlocked for. A tool that fails in most boss fights is not
     * situational; it is cut from the game with extra steps.
     *
     * The rule now: at most ONE immunity per boss, at most TWO bosses per immunity, and only
     * where it IS that boss's idea.
     *
     *   Gravehulk       PUSH     the act-one lesson: the first thing too big to move
     *   Cinder Colossus  BURN     it is made of the fire
     *   The Armada       DROWN    it flies, over an arena that is half sea
     *   Yeti             FREEZE   it is the cold
     *   Blightlord       FREEZE   see below — a lock-out guard, not toughness
     *   the other five   none
     *
     * STATUS is now on NO boss. It blocks every control effect at once, which is a fine
     * one-tile puzzle on a Doorbearer zombie and far too blunt across a whole boss fight.
     *
     * Blightlord takes FREEZE and nothing else, and the choice is load-bearing twice over.
     * FREEZE stops STUN but deliberately NOT SLOW (see the note on UnitImmunity in types.ts) —
     * so ICE still slows it and FIRE still burns it, which is the difference between the
     * element system mattering in the last fight and being switched off for it. And it is
     * needed at all because SLAY_BOSS no longer runs on a clock: Sol accrues every turn
     * forever, so a stun every turn would otherwise lock the final boss out of the game.
     */
    [UnitClass.HEADLINER]: {
        class: UnitClass.HEADLINER, name: 'The Headliner', maxHp: 20, damage: 1, moveRange: 3,
        imgUrl: ICONS.HEADLINER,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 20, dmg: 1, move: 3, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    /**
     * CINDER COLOSSUS (PLAN-boards-bosses.md I-3).
     *
     * 20 HP and only 3 damage: the body is not the threat, the trail is. It is immune to its
     * own element and to cold — until half health, when the shell cracks and the cold starts
     * working (utils/bossBehaviours.ts). Not PUSH-immune, deliberately: shoving it off its own
     * lava is the counterplay to its healing, and that has to stay available.
     */
    [UnitClass.CINDER_COLOSSUS]: {
        class: UnitClass.CINDER_COLOSSUS, name: 'Cinder Colossus', maxHp: 20, damage: 3, moveRange: 2,
        imgUrl: ICONS.CINDER_COLOSSUS,
        movementType: 'WALKING', immunities: ['BURN'],
        cost: 0,
        maxStats: { hp: 20, dmg: 3, move: 2, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    /**
     * VOLTMAW (PLAN-boards-bosses.md III-3).
     *
     * The longest health bar in the campaign, and the only body that ends up hurting itself:
     * below half, its own grid discharges under its feet. 26 is not padding — the second half
     * of this fight is a race, and the bar has to be long enough that "let it cook itself" is
     * a real line without being the only one.
     *
     * `attackRange` stays 1 ON PURPOSE. Conduction is not a radius — the reach follows the
     * WIRE, so it lives in the behaviour (utils/bossBehaviours.ts). Written here as range 8 it
     * would also let the thing bite a hero standing on dry ground behind a wall, which inverts
     * the entire lesson: the board is meant to be safe everywhere except the bright tiles.
     *
     * PUSH because it is one of only three in nine allowed to resist a shove; STATUS because
     * "stun it and walk away" would answer the overload race for free, and the race is the fight.
     */
    [UnitClass.VOLTMAW]: {
        class: UnitClass.VOLTMAW, name: 'Voltmaw', maxHp: 26, damage: 3, moveRange: 2,
        imgUrl: ICONS.VOLTMAW,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 26, dmg: 3, move: 2, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    /**
     * YETI (PLAN-boards-bosses.md II-3).
     *
     * 24 HP: a five-turn body against the Gravehulk's three and the Colossus's four — the
     * act II rung of one ladder, not a new kind of wall.
     *
     * FREEZE, and nothing else. NOT PUSH, and that is the most important line here: shoving
     * the bear off the squad is the designed answer to the whole fight, and only three of the
     * nine bosses may resist a shove (data/bosses.ts). Not BURN-immune either, so a FIRE squad
     * keeps a second answer.
     *
     * 3 damage reads small next to the Gravehulk's 5 — until it doubles against something
     * that cannot move, which is the exact health of the thinnest heroes in the roster.
     */
    [UnitClass.YETI]: {
        class: UnitClass.YETI, name: 'Yeti', maxHp: 24, damage: 3, moveRange: 3,
        imgUrl: ICONS.YETI,
        movementType: 'WALKING', immunities: ['FREEZE'],
        cost: 0,
        maxStats: { hp: 24, dmg: 3, move: 3, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    /**
     * IRONCART (PLAN-boards-bosses.md I-2).
     *
     * 18 HP and 3 damage, and the two numbers that actually define it are `moveRange: 3` and
     * `attackRange: 4`. A 4-tile arc from the middle of the board covers most of it, so there
     * is no such thing as a safe TILE against this thing — only a safe turn. The 3 movement is
     * worthless anywhere except on a rail: it goes further than anything else in the game,
     * along exactly one line, and that is the trade.
     *
     * PUSH-immune and NOT massive (the two are different questions — see data/bosses.ts).
     * Freeze it, slow it, eat it, taunt it; the one tool that does nothing is the shove,
     * because one shove off the track would end the fight in a single free action. Blocking
     * the rail with a body does that same job and costs a hero its position for a turn, which
     * is a price rather than a delete button.
     */
    [UnitClass.IRONCART]: {
        class: UnitClass.IRONCART, name: 'Ironcart', maxHp: 18, damage: 3, moveRange: 3,
        attackRange: 4,
        imgUrl: ICONS.IRONCART,
        movementType: 'RAIL', immunities: [],
        cost: 0,
        maxStats: { hp: 18, dmg: 3, move: 3, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    /**
     * CLOCKJAW (PLAN-boards-bosses.md III-2).
     *
     * 22 HP and 3 damage — and the stat that defines it is not here, it is on the intent: it
     * swings TWICE a turn (utils/bossBehaviours.ts). 6 a turn from a 1-tile reach, which is
     * the same figure Voltmaw puts on a clumped squad and one more than a Gravehulk's swing.
     *
     * `moveRange: 3` matters more than usual: arena_clockjaw is an alley and RUIN's Collapse
     * walls it up further every three turns, so 3 means contact by turn two and no kiting
     * after it — which is the point, because this fight has no answer that is not standing
     * there and taking it.
     *
     * PUSH because it is one of only three in nine allowed to resist a shove. FREEZE because
     * a STUN removes it from PHASE 3 for a WHOLE turn, and a whole turn is 6 of the ~24 damage
     * it deals across a fight: one skill press erasing a quarter of the boss. A thing whose
     * promise is "you cannot prevent this" must not be preventable twice by one control tool.
     * NOT STATUS-immune, deliberately — SLOW still lands (the FREEZE carve-out on
     * UnitImmunity), halving its move so it reaches the line a turn later, and PROVOKE still
     * lands, which is the real counterplay: dragged onto Thornshell, its own second hand
     * becomes 4 damage a turn against itself.
     */
    [UnitClass.CLOCKJAW]: {
        class: UnitClass.CLOCKJAW, name: 'Clockjaw', maxHp: 22, damage: 3, moveRange: 3,
        imgUrl: ICONS.CLOCKJAW,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 22, dmg: 3, move: 3, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    /**
     * BLIGHTLORD (PLAN-boards-bosses.md, final act).
     *
     * 36 HP is not one boss with a long bar — the plan is THREE bosses sharing a body, 12 each,
     * with a rule change and one untouchable turn between them. None of that exists yet: there
     * is no entry in BOSS_HOOKS, so it fights with ordinary zombie AI for now.
     *
     * Declaring it anyway is still a strict improvement, because `bossClassFor` falls back to
     * UnitClass.GRAVEHULK — which meant the final boss of the campaign was literally being
     * fought as a Gravehulk, wearing its art and its 16 HP.
     *
     * NOT in MASSIVE_BOSSES, deliberately. `isMassive` also blocks being eaten and frozen, so
     * it would delete Ironhusk and Chardslam from the last fight in the game. The immunities
     * below say exactly what it resists and nothing more; Snapmaw's Devour is already held off by
     * the `bossId` check in utils/skillResolution.ts rather than by `isMassive`.
     */
    [UnitClass.BLIGHTLORD]: {
        class: UnitClass.BLIGHTLORD, name: 'Blightlord', maxHp: 36, damage: 4, moveRange: 2,
        attackRange: 2,
        imgUrl: ICONS.BLIGHTLORD,
        movementType: 'WALKING', immunities: ['FREEZE'],
        cost: 0,
        maxStats: { hp: 36, dmg: 4, move: 2, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    /**
     * THE ARMADA (PLAN-boards-bosses.md II-1).
     *
     * 22 HP, the act II rung between the Colossus's 20 and the Yeti's 24 — but the number that
     * paces this fight is the three gas cells, which are a floor of three turns however hard
     * the squad hits.
     *
     * `movementType: 'FLYING'` IS the boss: walls, water, mountains and bodies are all scenery,
     * which is the assumption act II-1 exists to break. `canStopOn` still refuses to let it PARK
     * on water or rock, so it is never hovering somewhere a melee hero cannot reach — flying
     * makes it unblockable, not untouchable, and that distinction was already enforced.
     *
     * DROWN and PUSH, both conditional on being airborne: the crash strips the whole list. DROWN
     * has to go with PUSH, or a shove would put a downed hull in the sea and it would bob there.
     *
     * `attackRange: 2` with `damage: 2`. Two is a chip on every body in the roster and a kill on
     * none — the bomb run's threat is its SHAPE, five tiles at once with nothing behind anything,
     * not its number.
     */
    [UnitClass.ARMADA]: {
        class: UnitClass.ARMADA, name: 'The Armada', maxHp: 22, damage: 2, moveRange: 3,
        attackRange: 2,
        imgUrl: ICONS.ARMADA,
        movementType: 'FLYING', immunities: ['DROWN'],
        cost: 0,
        maxStats: { hp: 22, dmg: 2, move: 3, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    /**
     * SANDREAVER (PLAN-boards-bosses.md II-2).
     *
     * 22 HP is four windows' worth, not five. It is targetable on player turns 1, 3, 5 and 7 of
     * seven, and act II output is 5-7 a turn — so 22 is beatable with about a turn of slack and
     * unbeatable the moment the fight loses a window. That is the number the whole rhythm was
     * tuned around; changing it without re-counting the windows breaks it.
     *
     * `movementType: 'TELEPORT'` IS the dive, and it is not a new rule: TELEPORT already means
     * "crosses terrain and bodies, but must LAND somewhere legal" — word for word what burrowing
     * is. `canStopOn` then delivers the whole rock rule free of charge, because MOUNTAIN is
     * `isWalkable: false`: it tunnels UNDER the rock and can never come up through it. Four
     * rocks on arena_sandreaver, three heroes — that subtraction is the encounter, and it cost
     * no terrain code at all.
     *
     * `immunities: []`, and specifically NOT 'PUSH'. The plan grants push immunity while buried,
     * which is a STATE and not a stat, so it lives in planPush reading `isBurrowed` rather than
     * in a static array that could never be switched off. Surfaced it is shoveable, because it
     * has to be: the eruption is a ring you want broken up, and Chardslam was the reward for the
     * act immediately before this one.
     *
     * moveRange 4 reads enormous for a melee body until you notice it spends the turn it can use
     * that reach INVISIBLE, and the turn it is visible is the turn the squad is shooting it.
     */
    [UnitClass.SANDREAVER]: {
        class: UnitClass.SANDREAVER, name: 'Sandreaver', maxHp: 22, damage: 4, moveRange: 4,
        imgUrl: ICONS.SANDREAVER,
        movementType: 'TELEPORT', immunities: [],
        cost: 0,
        maxStats: { hp: 22, dmg: 4, move: 4, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.GRAVEHULK]: {
        // 16, not 10. Three heroes put out roughly 5 damage a turn, so a 10 HP boss folded in
        // two turns — and any two consumables did it outright. At 16 it takes sustained focus
        // while the horde keeps coming, which is the only thing that makes it a boss.
        class: UnitClass.GRAVEHULK, name: 'Gravehulk', maxHp: 16, damage: 5, moveRange: 2,
        imgUrl: ICONS.GRAVEHULK,
        movementType: 'WALKING', immunities: ['PUSH'],
        cost: 0,
        maxStats: { hp: 16, dmg: 5, move: 2, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.RUNT]: {
        class: UnitClass.RUNT, name: 'Runt', maxHp: 1, damage: 1, moveRange: 4,
        imgUrl: ICONS.RUNT,
        movementType: 'WALKING', immunities: [],
        cost: 0,
        maxStats: { hp: 1, dmg: 1, move: 4, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.ROCK]: {
        class: UnitClass.ROCK, name: 'Rock', maxHp: 99, damage: 0, moveRange: 0,
        imgUrl: ICONS.ROCK, 
        movementType: 'WALKING', immunities: ['PUSH', 'BURN', 'FREEZE', 'DROWN'],
        cost: 0,
        maxStats: { hp: 99, dmg: 0, move: 0, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
    [UnitClass.GRAVE]: {
        class: UnitClass.GRAVE, name: 'Grave', maxHp: 3, damage: 0, moveRange: 0,
        imgUrl: ICONS.GRAVE,
        movementType: 'WALKING', immunities: ['PUSH', 'BURN', 'FREEZE', 'DROWN'],
        cost: 0,
        maxStats: { hp: 3, dmg: 0, move: 0, cdr: 0 },
        upgradeCosts: { hp: 0, dmg: 0, move: 0, cdr: 0 }
    },
};
