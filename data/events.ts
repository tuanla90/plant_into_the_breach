import { GameEvent } from '../types';
import { COIN_REVIVE_HERO } from '../constants';

/**
 * EVENTS — the between-battle decision points.
 *
 * THE RULE THAT SHAPES ALL OF THESE: an event may only trade in things that survive to the
 * next battle. Sol is reset to SUN_ON_LEVEL_START at the start of every fight, and heroes are
 * rebuilt at full HP from HERO_DEFINITIONS, so the old "gain 100 Sol" / "heal the squad" /
 * "+1 Max HP" options were all erased before the player could ever use them — 16 of the
 * original 20 options changed nothing at all.
 *
 * What actually survives: Coin, sprouts, bench plants, items, which heroes are standing, and
 * the terms of the next battle (NEXT_BATTLE_MOD).
 *
 * Every option carries `outcomes`, which the screen renders as green/amber/red chips. The
 * player should never have to infer a consequence from the flavour text.
 */
export const GAME_EVENTS: GameEvent[] = [
    {
        // Tutorial only — never enters the random pool (the picker filters on `tier`, and
        // this has none). Board 5's whole job is "the hero you lost can come back".
        id: 'tut_revive',
        title: "The Roadside Medic",
        description: "A figure waves you down from the verge, a crate of pots at her feet. \"I heard you lost somebody. I can fix that — for a price.\"",
        imgUrl: "./img/event-medic.jpg",
        options: [
            {
                label: "Revive a Hero",
                description: "Bring one fallen hero back for the next level. Their fusions come back with them.",
                effects: [{ type: 'REVIVE_HERO', value: COIN_REVIVE_HERO }],
                outcomes: [
                    { kind: 'COST', text: '75 Coin' },
                    { kind: 'GAIN', text: 'One fallen hero returns, fusions intact' },
                ],
            },
            {
                label: "Walk On",
                description: "You keep the Coin. The gap in the squad stays where it is.",
                effects: [{ type: 'NOTHING' }],
                outcomes: [{ kind: 'GAIN', text: 'Nothing gained, nothing risked' }],
            },
        ],
    },

    {
        id: 'rest_site',
        title: "Campfire",
        description: "A safe hollow, a bank of coals, and a few hours before the next push.",
        imgUrl: "./img/event-campfire.jpg",
        options: [
            {
                // No `req` here on purpose: the Coin check for revival lives in EventScreen,
                // which also has to ask *which* hero comes back.
                label: "Revive a Hero",
                description: "Bring one fallen hero back for the next level. Their fusions come back with them.",
                effects: [{ type: 'REVIVE_HERO', value: COIN_REVIVE_HERO }],
                outcomes: [
                    { kind: 'COST', text: '75 Coin' },
                    { kind: 'GAIN', text: 'One fallen hero returns, fusions intact' },
                ],
            },
            {
                label: "Sleep It Off",
                description: "Bedrolls out, boots off. Wounds close by morning.",
                effects: [{ type: 'HEAL_SQUAD_FULL' }],
                outcomes: [{ kind: 'GAIN', text: 'Whole squad healed to full' }],
            },
            {
                label: "Search the Packs",
                description: "Turn out every pocket in the camp.",
                effects: [{ type: 'GAIN_COIN', value: 60 }],
                outcomes: [{ kind: 'GAIN', text: '+60 Coin' }],
            },
        ],
    },

    {
        id: 'crazy_dave_taco',
        tier: 1,
        title: "Old Mulch's Taco Van",
        description: "Mulch swerves out of nowhere in a van held together with taco. \"WABBY WABBO! I'll trade ya somethin' good — and I ain't takin' no for an answer, neighbour!\"",
        imgUrl: "./img/event-taco-van.jpg",
        options: [
            {
                label: "Trade a Bench Plant",
                description: "Mulch wants a plant, not money. He hands over salvage in return.",
                req: { type: 'BENCH', value: 1 },
                effects: [
                    { type: 'LOSE_BENCH_PLANT' },
                    { type: 'GAIN_ITEM' },
                    { type: 'GAIN_COIN', value: 40 },
                ],
                outcomes: [
                    { kind: 'COST', text: 'Lose 1 bench plant' },
                    { kind: 'GAIN', text: '+1 item, +40 Coin' },
                ],
            },
            {
                label: "Buy Whatever's In The Back",
                description: "He will not say what it is. It is definitely a plant.",
                req: { type: 'COIN', value: 60 },
                effects: [{ type: 'LOSE_COIN', value: 60 }, { type: 'GAIN_BENCH_PLANT' }],
                outcomes: [
                    { kind: 'COST', text: '60 Coin' },
                    { kind: 'GAIN', text: '+1 random base plant on the bench' },
                    { kind: 'RISK', text: 'Bench full? The plant is lost and you get 30 Coin back' },
                ],
            },
            {
                label: "Drive On",
                description: "You have seen what he does to a taco.",
                effects: [{ type: 'NOTHING' }],
                outcomes: [{ kind: 'GAIN', text: 'Nothing gained, nothing risked' }],
            },
        ],
    },

    {
        id: 'zen_garden',
        tier: 1,
        title: "Abandoned Zen Garden",
        description: "Someone tended this place for a long time, and then stopped. The watering can is still full.",
        imgUrl: "./img/event-zengarden.jpg",
        options: [
            {
                label: "Water the Beds",
                description: "Something down there is still alive, and it is grateful.",
                effects: [{ type: 'GAIN_BENCH_PLANT' }],
                outcomes: [
                    { kind: 'GAIN', text: '+1 random base plant on the bench' },
                    { kind: 'RISK', text: 'Bench full? The plant is lost and you get 30 Coin back' },
                ],
            },
            {
                label: "Study the Layout",
                description: "The old gardener planned for a siege. You copy the plan.",
                req: { type: 'COIN', value: 40 },
                effects: [
                    { type: 'LOSE_COIN', value: 40 },
                    { type: 'NEXT_BATTLE_MOD', mods: { turns: 1 } },
                ],
                outcomes: [
                    { kind: 'COST', text: '40 Coin' },
                    { kind: 'GAIN', text: 'Next battle: +1 turn' },
                ],
            },
        ],
    },

    {
        id: 'graveyard',
        tier: 2,
        title: "The Soft Ground",
        description: "A field of leaning headstones. Some of the soil has been turned over recently — from underneath.",
        imgUrl: "./img/event-graveyard.jpg",
        options: [
            {
                label: "Dig It Up",
                description: "Grave goods are grave goods. The digging is loud, and the noise carries.",
                effects: [
                    { type: 'GAIN_COIN', value: 130 },
                    { type: 'NEXT_BATTLE_MOD', mods: { enemies: 2 } },
                ],
                outcomes: [
                    { kind: 'GAIN', text: '+130 Coin' },
                    { kind: 'RISK', text: 'Next battle: 2 extra zombies in the opening wave' },
                ],
            },
            {
                label: "Burn the Field",
                description: "Lamp oil is not cheap, but nothing climbs out of ash.",
                req: { type: 'COIN', value: 40 },
                effects: [
                    { type: 'LOSE_COIN', value: 40 },
                    { type: 'NEXT_BATTLE_MOD', mods: { enemies: -1 } },
                ],
                outcomes: [
                    { kind: 'COST', text: '40 Coin' },
                    { kind: 'GAIN', text: 'Next battle: 1 fewer zombie' },
                ],
            },
        ],
    },

    {
        id: 'penny_glitch',
        tier: 1,
        title: "Chrona's Paradox",
        description: "Chrona is stuck replaying the same three seconds. \"User. My chronal stabilisers require calibration. I can also— I can also— I can also—\"",
        imgUrl: "./img/event-chrona.jpg",
        options: [
            {
                label: "Pay for Parts",
                description: "Straighten out the timeline. She hands you something from a future that now never happens.",
                req: { type: 'COIN', value: 80 },
                effects: [{ type: 'LOSE_COIN', value: 80 }, { type: 'GAIN_ITEM' }],
                outcomes: [
                    { kind: 'COST', text: '80 Coin' },
                    { kind: 'GAIN', text: '+1 item' },
                ],
            },
            {
                label: "Leave Her Looping",
                description: "The loop keeps leaking. Something walks out of it behind you.",
                effects: [{ type: 'NEXT_BATTLE_MOD', mods: { enemies: 1 } }],
                outcomes: [{ kind: 'RISK', text: 'Next battle: 1 extra zombie' }],
            },
        ],
    },

    {
        id: 'yeti_sighting',
        tier: 3,
        title: "The Treasure Yeti",
        description: "It is right there, arms full of somebody else's money, and it has already seen you.",
        imgUrl: "./img/event-yeti.jpg",
        options: [
            {
                label: "Chase It Down",
                description: "You catch it. The chase takes you a long way from the Greenspires, and something else gets there first.",
                effects: [
                    { type: 'GAIN_COIN', value: 200 },
                    { type: 'NEXT_BATTLE_MOD', mods: { brainlessHouses: 1 } },
                ],
                outcomes: [
                    { kind: 'GAIN', text: '+200 Coin' },
                    { kind: 'RISK', text: 'Next battle: one Greenspire starts with its sprout already gone' },
                ],
            },
            {
                label: "Let It Go",
                description: "It drops a few coins in its hurry.",
                effects: [{ type: 'GAIN_COIN', value: 40 }],
                outcomes: [{ kind: 'GAIN', text: '+40 Coin' }],
            },
        ],
    },

    {
        id: 'dark_ages_king',
        tier: 3,
        title: "The Zombie King's Sceptre",
        description: "Left in the mud where he fell. The jewel on top is still warm, and it is still beating.",
        imgUrl: "./img/event-sceptre.jpg",
        options: [
            {
                label: "Break It Open",
                description: "There is a sprout inside. It was somebody's, once.",
                effects: [{ type: 'GAIN_BRAIN', value: 1 }],
                outcomes: [
                    { kind: 'GAIN', text: '+1 sprout to your run budget' },
                    { kind: 'RISK', text: 'Budget already full? You get 100 Coin instead' },
                ],
            },
            {
                label: "Sell It Whole",
                description: "Mulch knows a guy. Mulch is the guy.",
                effects: [{ type: 'GAIN_COIN', value: 100 }],
                outcomes: [{ kind: 'GAIN', text: '+100 Coin' }],
            },
        ],
    },

    {
        id: 'zomboss_broadcast',
        tier: 3,
        title: "Blightlord Broadcast",
        description: "A hologram of the Blightlord flickers into the road. \"Greetings, grassy simpletons. Surrender the brainz and I shall make your composting… brisk.\"",
        imgUrl: "./img/event-blightlord.jpg",
        options: [
            {
                label: "Taunt Him",
                description: "He sends more. He also gets careless with the payroll drop.",
                effects: [{ type: 'NEXT_BATTLE_MOD', mods: { enemies: 2, coinOnWin: 150 } }],
                outcomes: [
                    { kind: 'RISK', text: 'Next battle: 2 extra zombies' },
                    { kind: 'GAIN', text: '+150 Coin — but only if you win it' },
                ],
            },
            {
                label: "Cut the Feed",
                description: "Boring conversation anyway.",
                effects: [{ type: 'NOTHING' }],
                outcomes: [{ kind: 'GAIN', text: 'Nothing gained, nothing risked' }],
            },
        ],
    },

    {
        id: 'pirate_booty',
        tier: 1,
        title: "The Barrel Roller's Chest",
        description: "The zombie did not survive the landing. Its cargo did — a strapped sea chest, still locked.",
        imgUrl: "./img/event-chest.jpg",
        options: [
            {
                label: "Blow the Lock",
                description: "Charges cost money. What is inside is worth more than the charge.",
                req: { type: 'COIN', value: 30 },
                effects: [{ type: 'LOSE_COIN', value: 30 }, { type: 'GAIN_ITEM' }],
                outcomes: [
                    { kind: 'COST', text: '30 Coin' },
                    { kind: 'GAIN', text: '+1 item' },
                ],
            },
            {
                label: "Kick It Open",
                description: "It works. So does the bang, on everything within a mile.",
                effects: [
                    { type: 'GAIN_COIN', value: 50 },
                    { type: 'NEXT_BATTLE_MOD', mods: { enemies: 1 } },
                ],
                outcomes: [
                    { kind: 'GAIN', text: '+50 Coin' },
                    { kind: 'RISK', text: 'Next battle: 1 extra zombie' },
                ],
            },
        ],
    },

    {
        id: 'wild_west_piano',
        tier: 1,
        title: "The Saloon Piano",
        description: "Still in tune, somehow, under an inch of dust. The Pianist Zombie is not coming back for it.",
        imgUrl: "./img/event-piano.jpg",
        options: [
            {
                label: "Play Something",
                description: "The squad sleeps properly for the first time in days.",
                effects: [{ type: 'NEXT_BATTLE_MOD', mods: { enemies: -1 } }],
                outcomes: [{ kind: 'GAIN', text: 'Next battle: 1 fewer zombie' }],
            },
            {
                label: "Strip the Ivory",
                description: "Eighty-eight keys, and a buyer for every one of them.",
                effects: [{ type: 'GAIN_COIN', value: 70 }],
                outcomes: [{ kind: 'GAIN', text: '+70 Coin' }],
            },
        ],
    },

    {
        id: 'far_future_tile',
        tier: 2,
        title: "Cracked Power Tile",
        description: "A Far Future power tile, split down the middle and venting hard enough to hum your teeth.",
        imgUrl: "./img/event-powertile.jpg",
        options: [
            {
                label: "Tap the Vent",
                description: "You siphon off a fortune. The flare is visible for miles.",
                effects: [
                    { type: 'GAIN_COIN', value: 150 },
                    { type: 'NEXT_BATTLE_MOD', mods: { enemies: 1 } },
                ],
                outcomes: [
                    { kind: 'GAIN', text: '+150 Coin' },
                    { kind: 'RISK', text: 'Next battle: 1 extra zombie' },
                ],
            },
            {
                label: "Discharge It Safely",
                description: "Ground it out and pocket the regulator.",
                effects: [{ type: 'GAIN_ITEM' }],
                outcomes: [{ kind: 'GAIN', text: '+1 item' }],
            },
        ],
    },

    {
        id: 'mummy_memory',
        tier: 1,
        title: "The Camel Formation",
        description: "Three Camel Zombies plodding in single file. The middle one is walking wrong — too heavy, too careful.",
        imgUrl: "./img/event-camel.jpg",
        options: [
            {
                label: "Hit the Middle One",
                description: "It was carrying the whole caravan's takings.",
                effects: [{ type: 'GAIN_COIN', value: 90 }],
                outcomes: [{ kind: 'GAIN', text: '+90 Coin' }],
            },
            {
                label: "Let Them Pass",
                description: "You use the time to scout the road ahead instead.",
                effects: [{ type: 'NEXT_BATTLE_MOD', mods: { enemies: -1 } }],
                outcomes: [{ kind: 'GAIN', text: 'Next battle: 1 fewer zombie' }],
            },
        ],
    },

    // ---------------------------------------------------------------------------------
    // TIER 2 — GAMBLES. Every roll is stated as a percentage on the chips, and resolved
    // exactly once in utils/eventRoll.ts so the result banner can never contradict what
    // was applied. A failed roll always still does *something*: no option is a dead click.
    // ---------------------------------------------------------------------------------

    {
        id: 'vasebreaker',
        tier: 2,
        title: "Vasebreaker",
        description: "Three sealed vases in a row, exactly as the old minigame left them. Something is inside each one. From here you cannot tell what.",
        imgUrl: "./img/event-vase.jpg",
        options: [
            {
                label: "Crack One Open",
                description: "Pick a vase. Half of these held plants. The other half did not.",
                effects: [{
                    type: 'GAIN_BENCH_PLANT', chance: 0.6,
                    fallback: [{ type: 'NEXT_BATTLE_MOD', mods: { enemies: 1 } }],
                }],
                outcomes: [
                    { kind: 'GAIN', text: '+1 random base plant on the bench', chance: 0.6 },
                    { kind: 'RISK', text: 'Next battle: 1 extra zombie', chance: 0.4 },
                ],
            },
            {
                label: "Smash All Three",
                description: "No sense doing this by halves. Three separate rolls, and you take everything that comes out.",
                effects: [
                    { type: 'GAIN_BENCH_PLANT', chance: 0.6, fallback: [{ type: 'NEXT_BATTLE_MOD', mods: { enemies: 1 } }] },
                    { type: 'GAIN_COIN', value: 70, chance: 0.6, fallback: [{ type: 'NEXT_BATTLE_MOD', mods: { enemies: 1 } }] },
                    { type: 'GAIN_ITEM', chance: 0.6, fallback: [{ type: 'NEXT_BATTLE_MOD', mods: { enemies: 1 } }] },
                ],
                outcomes: [
                    { kind: 'GAIN', text: 'Each vase: a plant, then 70 Coin, then an item', chance: 0.6 },
                    { kind: 'RISK', text: 'Each vase that fails: 1 extra zombie next battle', chance: 0.4 },
                ],
            },
            {
                label: "Walk Past Them",
                description: "You have played this one before.",
                effects: [{ type: 'NOTHING' }],
                outcomes: [{ kind: 'GAIN', text: 'Nothing gained, nothing risked' }],
            },
        ],
    },

    {
        id: 'wallnut_bowling',
        tier: 2,
        title: "Armor Plate Bowling",
        description: "A roped-off lane, a rack of Armor Plates, and a bored-looking Scrapcap at the far end acting as the pin. Somebody has set up a book on it.",
        imgUrl: "./img/event-bowling.jpg",
        options: [
            {
                label: "Take the Lane",
                description: "Pay the stake and roll. The Armor Plate is yours if you knock it down.",
                req: { type: 'COIN', value: 30 },
                effects: [
                    { type: 'LOSE_COIN', value: 30 },
                    {
                        // ONE roll decides both halves of the prize. Two effects each rolling
                        // 0.55 would let you win the plant and lose the Coin, which is not
                        // what the chip below promises.
                        type: 'GAIN_BENCH_PLANT', materialId: 'MAT_IRONHUSK', chance: 0.55,
                        then: [{ type: 'GAIN_COIN', value: 90 }],
                        fallback: [],
                    },
                ],
                outcomes: [
                    { kind: 'COST', text: '30 Coin to play' },
                    { kind: 'GAIN', text: 'Win: a Armor Plate on the bench and +90 Coin', chance: 0.55 },
                    { kind: 'RISK', text: 'Lose: the stake is gone and nothing else happens', chance: 0.45 },
                ],
            },
            {
                label: "Watch Somebody Else Roll",
                description: "You learn the lane's bias and sell the tip to the next mark.",
                effects: [{ type: 'GAIN_COIN', value: 25 }],
                outcomes: [{ kind: 'GAIN', text: '+25 Coin' }],
            },
        ],
    },

    {
        id: 'imp_nest',
        tier: 2,
        title: "The Runt Nest",
        description: "A Gravehulk's supply cache, unguarded — and the Imps stacked inside it are still asleep. For now.",
        imgUrl: "./img/event-imp-nest.jpg",
        options: [
            {
                label: "Rob the Nest",
                description: "Take the cache and go. Quietly, if you can manage it.",
                effects: [
                    { type: 'GAIN_COIN', value: 140 },
                    { type: 'NEXT_BATTLE_MOD', mods: { enemies: 2 }, chance: 0.35, fallback: [] },
                ],
                outcomes: [
                    { kind: 'GAIN', text: '+140 Coin' },
                    { kind: 'RISK', text: 'They wake up: 2 extra zombies next battle', chance: 0.35 },
                ],
            },
            {
                label: "Burn It Out",
                description: "Lose the cache, lose the Imps with it.",
                req: { type: 'COIN', value: 50 },
                effects: [
                    { type: 'LOSE_COIN', value: 50 },
                    { type: 'NEXT_BATTLE_MOD', mods: { enemies: -1 } },
                ],
                outcomes: [
                    { kind: 'COST', text: '50 Coin' },
                    { kind: 'GAIN', text: 'Next battle: 1 fewer zombie' },
                ],
            },
        ],
    },
];
