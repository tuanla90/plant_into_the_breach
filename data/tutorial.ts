import {
    HeroId, MapNode, MaterialId, MissionBonus, ObjectiveType, Position, TileData, Unit, UnitClass,
} from '../types';
import { materializeTemplate } from './maps';
import { SUN_ON_LEVEL_START } from '../constants';

/**
 * THE TUTORIAL IS THE FIRST SEVEN NODES OF A REAL RUN.
 *
 * Plants vs Zombies has no "tutorial mode" — level 1-1 *is* the tutorial, and it teaches by
 * handing you exactly one new thing and a board where only the right move is available. This
 * chain does the same: real Coin, real sprouts, real losses, on a linear map.
 *
 * Three rules held throughout:
 *   1. CONSTRAINT TEACHES. Board 1 gives one usable hero, so there is nothing else to try.
 *   2. NOTES ARE ONE LINE. Twelve words maximum, enforced by assertTutorial(). If a lesson
 *      needs more prose than that, the board is wrong — fix the board, not the note.
 *   3. NOTHING IS FAKE. Losing a sprout on board 4 really costs a sprout.
 *
 * The four-board arc is the spine: the Seed Gun hero DIES on board 2, you buy a base
 * Seed Gun as insurance on board 3, it takes the field on board 4, and the hero comes back
 * on board 5. The player lives all four beats instead of reading about them.
 */

export interface TutorialSpawn {
    cls: UnitClass;
    /** x = screen row, y = screen column (zombies come from high y). */
    x: number;
    y: number;
    /**
     * The tile this lethal spawn will HOLD on the death turn, filling one side of a body
     * box. When a scripted loss declares these, assertTutorial stops asking "can she
     * outrun the damage" and starts asking the real question: is every walkable tile
     * beside her claimed, can each killer actually reach its post, and do the bites add
     * up past her health.
     */
    boxAt?: Position;
    /**
     * Extra HP on top of the class definition — the tutorial boss wears this. The global
     * Gravehulk stays 16 for real runs; the STORY one has eaten well, and needs to shrug
     * off a squad that now owns a Repeater fusion.
     */
    hpBonus?: number;
    /**
     * Extra damage on top of the class definition, for a scripted body that has to bite
     * harder than its sheet.
     *
     * The tut_2 kill box needs it: the board has room for exactly two biting posts (the third
     * neighbour sits between her and the sprout, and aiLogic never turns a melee zombie around,
     * so that one is a wall), and two Pothelms bite for 4 against a hero who now has 6 HP.
     * This is also the node's own rule catching up with it — tut_2 is an ELITE node, and every
     * non-scripted elite wave in the game already gets `dmgAdd: 1` (utils/encounterBuilder.ts).
     */
    dmgBonus?: number;
    /**
     * "This one takes a sprout and the squad cannot stop it." Declaring it makes
     * assertTutorial prove the claim: every plant on the board is given its full movement
     * plus its longest-range, hardest-hitting skill, all of it aimed at this tile on turn 1,
     * and the total must come up SHORT of this spawn's health.
     *
     * Written after a player asked why the Seed Gun walked away from a zombie standing on
     * the doorstep. The answer was that it should not have: a Pea Shot is a LINE in all four
     * directions, one step put the tile in range, and the "unsavable" sprout died to a single
     * click. A scripted sacrifice the player can see through is worse than no sacrifice.
     */
    unsavable?: boolean;
    /**
     * This one is here to kill the scripted hero, and assertTutorial judges the death on
     * these alone.
     *
     * A wave usually mixes the bodies the player is meant to clear with the bodies that then
     * finish her off. Measuring the whole wave would count the ones she is scripted to
     * destroy, and a death that only looks inescapable because of corpses is not a guarantee.
     */
    lethal?: boolean;
}

export interface TutorialStep {
    /**
     * Which screen this step belongs to. 'PLACEMENT' is the deploy board the player lands on
     * *before* turn 1 — the very first thing a new player ever sees. Steps written for combat
     * are wrong there: pointing at a hero on the deploy screen just re-picks it for placing,
     * while the only move that matters is Start Battle.
     *
     * The three non-combat phases hand-hold the nodes BETWEEN fights. Those used to be
     * completely unguarded — the overlay was gated to the combat screen — so the shop, the
     * revive and the campfire were the three lessons the tutorial merely narrated.
     */
    phase?: 'PLACEMENT' | 'COMBAT' | 'SHOP' | 'EVENT' | 'CAMPFIRE';
    /**
     * 1-based turn this note appears on. Several steps may share a turn. Screens that have
     * no turns use 1: the phase is what separates them.
     */
    turn: number;
    /** Max 12 words — see rule 2. */
    note: string;
    /**
     * `data-tut` key of the one thing the player may touch while this step is up. Everything
     * else on screen is physically blocked by the Spotlight overlay. Omit for a note with no
     * target, which the player dismisses with "Got it".
     *
     * Tiles are `tile-<x>-<y>` (x = row, y = column). Because scripted battles hold their
     * authored opening positions, a tile key stays correct for the turn it is written on.
     *
     * Outside combat: `shop-plant-<materialId>`, `shop-item-<itemId>`, `shop-leave`,
     * `event-option-<index>`, `event-hero-<heroId>`, `campfire-fuse`,
     * `fusion-hero-<heroId>`, `fusion-plant-<materialId>`, `fusion-confirm`.
     */
    focus?: string;
    /**
     * What a tile click is FOR. Every other target says what it does in its own name — a
     * `hero-` key selects, a `skill-` key aims — but a tile is where a move, an attack and
     * an item all land, and the script has to know which one it is waiting for. Required on
     * tile steps, meaningless anywhere else; assertTutorial enforces both.
     *
     * 'ITEM' detonates the consumable armed by the most recent `item-` step; unlike the
     * other two it acts through no hero at all.
     */
    act?: 'MOVE' | 'ATTACK' | 'ITEM';
}

/**
 * The slice of live battle state a step is judged against.
 *
 * Steps advance on OUTCOME, not on the click that was supposed to cause it. The click-driven
 * version desynced the moment a click failed to do what the script assumed: it counted the
 * click, moved to the next lesson, and pointed at a button that was not on screen. Reading
 * the result instead makes the script self-correcting — an action that did not happen leaves
 * its step unsatisfied, and one that happened some other way (a hero shoved onto the target
 * tile, a skill fired by hotkey) still counts.
 */
export interface TutorialProbe {
    units: Unit[];
    selectedUnitId: string | null;
    selectedSkillId: string | null;
    /** Consumable currently armed for targeting — how an `item-` step knows it was clicked. */
    selectedItemId?: string | null;
    /** Base plants sitting on the bench — what a shop purchase produces. */
    bench?: { materialId: MaterialId }[];
    /** Consumables owned. */
    inventory?: string[];
    /** Heroes currently down, so a revive is observable as one of them leaving the list. */
    fallenHeroes?: HeroId[];
    /** The event screen has armed its hero picker. */
    eventPicking?: boolean;
    /** Chrona rewinds spent this battle — how a reset-turn step knows the button landed. */
    turnResetsUsed?: number;
    /** The fusion panel is open, and what it currently has selected. */
    fusionOpen?: boolean;
    fusionHeroId?: HeroId | null;
    fusionPlantId?: MaterialId | null;
}

/**
 * Which unit a step acts through: named by the most recent `hero-<HeroId>` or
 * `unit-<MaterialId>` step before it — the second form is how a script commands a bench
 * plant, whose battle unit id does not exist at authoring time. A tile or skill step is
 * meaningless without a selection, and the script is linear, so the nearest preceding
 * selection is unambiguous. assertTutorial proves one always exists.
 */
export const stepActor = (steps: TutorialStep[], index: number): string | null => {
    for (let k = index; k >= 0; k--) {
        const m = /^(?:hero|unit)-(.+)$/.exec(steps[k].focus ?? '');
        if (m) return m[1];
    }
    return null;
};

/**
 * The plant a fusion step is working with: named by the most recent `fusion-plant-` step
 * before it, the same way `stepActor` names the hero. Lets the confirm step know what to
 * watch for without repeating the id.
 */
export const stepMaterial = (steps: TutorialStep[], index: number): MaterialId | null => {
    for (let k = index; k >= 0; k--) {
        const m = /^fusion-plant-(.+)$/.exec(steps[k].focus ?? '');
        if (m) return m[1] as MaterialId;
    }
    return null;
};

/**
 * How many copies of the same purchase this step is waiting for: the Nth step with an
 * identical `shop-plant-` focus requires N copies on the bench. Without this, a script
 * that sells the same plant twice self-destructed — buying ONE satisfied both steps,
 * the second purchase was silently skipped, and the campfire had nothing left to fuse.
 */
export const stepCopies = (steps: TutorialStep[], index: number): number => {
    const f = steps[index]?.focus;
    if (!f || !/^shop-plant-/.test(f)) return 1;
    return steps.slice(0, index + 1).filter(st => st.focus === f).length;
};

/** The consumable an ITEM tile detonates: named by the nearest `item-` step before it. */
export const stepItem = (steps: TutorialStep[], index: number): string | null => {
    for (let k = index; k >= 0; k--) {
        const m = /^item-(.+)$/.exec(steps[k].focus ?? '');
        if (m) return m[1];
    }
    return null;
};

/** True when the world already shows what this step was asking for. */
export const stepSatisfied = (
    st: TutorialStep,
    actor: string | null,
    p: TutorialProbe,
    material: MaterialId | null = null,
    item: string | null = null,
    copies: number = 1,
): boolean => {
    // No target: an intentional full stop, cleared by its own button and nothing else.
    // start-battle and end-turn are not "satisfied" either — the phase or turn they change
    // re-keys the whole step list, which retires them without this ever being asked.
    // `shop-leave` and `event-option-` join the two combat controls here: each one changes
    // the SCREEN, which re-keys the whole step list and retires them without a predicate.
    if (!st.focus || st.focus === 'start-battle' || st.focus === 'end-turn') return false;

    // --- outside combat ------------------------------------------------------------------
    if (st.focus === 'shop-leave') return false;

    const plant = /^shop-plant-(.+)$/.exec(st.focus);
    if (plant) return (p.bench ?? []).filter(b => b.materialId === plant[1]).length >= copies;

    const bought = /^shop-item-(.+)$/.exec(st.focus);
    if (bought) return (p.inventory ?? []).includes(bought[1]);

    // Arming the revive opens a hero picker on the same screen, so unlike every other event
    // choice this one has an observable in-place result.
    if (/^event-option-\d+$/.test(st.focus)) return !!p.eventPicking;

    // Picking the hero resolves the event and leaves the screen, so like every other
    // screen-changing control this one is retired by the re-key rather than by a predicate.
    // "X is no longer fallen" looked like the obvious test and was actively wrong: it is
    // already true before the lesson starts if X was never down, which marked the step done
    // on arrival and suppressed the whole overlay.
    if (/^event-hero-.+$/.test(st.focus)) return false;

    if (st.focus === 'campfire-fuse') return !!p.fusionOpen;

    // Chrona's rewind. Spent-count rather than any board reading, and that is what makes
    // the lesson stable: the rewind un-does the very move the script just asked for, so
    // every earlier step of the turn reads unsatisfied again — but this one stays true
    // for the rest of the battle, and the backward scan never rewinds past it.
    if (st.focus === 'reset-turn') return (p.turnResetsUsed ?? 0) > 0;

    const fuseHero = /^fusion-hero-(.+)$/.exec(st.focus);
    if (fuseHero) return p.fusionHeroId === fuseHero[1];

    const fusePlant = /^fusion-plant-(.+)$/.exec(st.focus);
    if (fusePlant) return p.fusionPlantId === fusePlant[1];

    // The fusion landed when the plant it consumed is no longer on the bench. Reading the
    // bench rather than the hero's fusion list means this stays true after the panel closes,
    // so the step cannot un-satisfy itself the moment the UI it lived in disappears.
    // Like shop-leave and event-option-: confirming CHANGES THE SCREEN (the fuse spends
    // the campfire visit, which resolves the event), and the re-key retires this step.
    // Reading the bench instead was wrong whenever two copies of the same species were
    // benched — consuming one left the other, so "the material is gone" never came true.
    if (st.focus === 'fusion-confirm') return false;

    // One lookup for both spellings: heroes carry heroId, bench plants carry materialId.
    const actorOf = (key: string) => p.units.find(u => u.heroId === key || u.materialId === key) ?? null;

    const sel = /^(?:hero|unit)-(.+)$/.exec(st.focus);
    if (sel) {
        const u = actorOf(sel[1]);
        return !!u && p.selectedUnitId === u.id;
    }

    const skill = /^skill-(.+)$/.exec(st.focus);
    if (skill) return p.selectedSkillId === skill[1];

    // Arming a consumable, mirroring the skill-aim pattern: satisfied while it is armed,
    // un-satisfied again the moment the detonation consumes it — which is fine, because by
    // then the ITEM tile after it is satisfied and the backward scan looks no further.
    const armed = /^item-(.+)$/.exec(st.focus);
    if (armed) return p.selectedItemId === armed[1];

    const tile = /^tile-(\d+)-(\d+)$/.exec(st.focus);
    if (tile && st.act === 'ITEM') {
        // Consumed = gone from the pockets. The tutorial hands out exactly one of each, so
        // absence is unambiguous.
        return !!item && !(p.inventory ?? []).includes(item);
    }
    if (tile && actor) {
        const u = actorOf(actor);
        if (!u) return false;
        // Deliberately checks the hero, not the corpse count: "she attacked" is the lesson,
        // and a shot that missed or under-damaged still taught it.
        if (st.act === 'ATTACK') return !!u.hasAttacked;
        return u.position.x === Number(tile[1]) && u.position.y === Number(tile[2]);
    }

    return false;
};

export interface TutorialBattle {
    rows: string[];
    maxTurns: number;
    /**
     * Sprouts this board is BUILT to lose, and the replay holds it to exactly that: one fewer
     * is a guarantee that quietly stopped working, one more is a board that got harder
     * without anyone deciding it should.
     */
    scriptedBrainLoss?: number;
    /** Forced squad — the tutorial never shows the hero picker. */
    squad: HeroId[];
    /** Fixed deployment, so the player is never asked to place before being taught how. */
    placement: Record<string, Position>;
    /** Heroes that start DORMANT: alive, targetable, unable to act. */
    dormant?: HeroId[];
    /**
     * Sol in the bank when the fight opens. Defaults to the game's SUN_ON_LEVEL_START.
     *
     * The tutorial needs to control this because Sol is what gates a hero's second tool.
     * At the standard 50 the player can fire Precision Blast on board 1, turn 1 — before
     * anything has explained Sol, and against a board built on the promise that Pea Shot is
     * the only thing they own. Setting it to 0 there makes the locked button part of the
     * lesson, and board 2 then earns the skill through Sunbloom instead of being handed it.
     */
    startingSun?: number;
    opening: TutorialSpawn[];
    /** turn number -> reinforcements that arrive at the start of it. */
    waves?: Record<number, TutorialSpawn[]>;
    objective: ObjectiveType;
    objectiveText: string;
    bonuses: MissionBonus[];
    steps: TutorialStep[];
    /**
     * A hero the script intends to lose here. Recorded so assertTutorial can prove the
     * incoming damage really is lethal, instead of trusting that it looks lethal.
     */
    scriptedLoss?: HeroId;
    /** True when the board is built so the player cannot win. Board 7 only. */
    scriptedDefeat?: boolean;
}

export interface TutorialNode {
    id: string;
    title: string;
    type: MapNode['type'];
    battle?: TutorialBattle;
    /** SHOP nodes pin their stock: a random 175-Coin plant would break the budget. */
    shopOffers?: MaterialId[];
    /**
     * Consumables the shop may sell. The plant list was pinned from the start; the item
     * shelf was not, and it was the bigger hole — 350 Coin of consumables against a purse
     * that also owes 75 for the revive on board 5.
     */
    itemOffers?: string[];
    /** Hand-holding for a node with no battle: shop, event, campfire. */
    steps?: TutorialStep[];
    /** EVENT / CAMPFIRE nodes route to a specific encounter. */
    eventId?: string;
    /** One line shown on the map before entering. */
    brief: string;
}

// ---------------------------------------------------------------------------------------
// THE CHAIN
// ---------------------------------------------------------------------------------------

export const TUTORIAL_CHAIN: TutorialNode[] = [
    // -----------------------------------------------------------------------------------
    // 1. Move, attack, and watch where zombies come from.
    // Sunbloom is DORMANT: she is the thing being protected, not a second unit to
    // command. One usable hero means the player cannot pick the wrong tool.
    // -----------------------------------------------------------------------------------
    {
        id: 'tut_1',
        title: 'Sân Trước',
        type: 'BATTLE',
        brief: 'Sunbloom kiệt sức giữa vòng vây. Hãy lấy thân mình che chở cho cô ấy.',
        battle: {
            rows: [
                '........',
                '........',
                '..DD...S',
                'H.DD...S',
                '..DD...S',
                '........',
                '........',
                '........',
            ],
            maxTurns: 3,
            squad: ['PEABURST', 'SUNBLOOM'],
            placement: { SUNBLOOM: { x: 3, y: 2 }, PEABURST: { x: 3, y: 3 } },
            dormant: ['SUNBLOOM'],
            // No Sol at all. The default 50 is exactly Precision Blast's price, so board 1
            // was quietly handing the player a pierce attack on turn 1 — on a board whose
            // whole design is "one hero, one free shot, nothing else to get wrong". The
            // greyed-out second button now teaches that Sol is a thing before board 2
            // teaches where it comes from.
            startingSun: 0,
            // D5, not D7. From three tiles out its intent is MOVE, and because the two
            // plants block row D it routes *around* them — so the first thing a new player
            // ever saw was a zombie ambling sideways with an amber arrow. Board 1's job is to
            // teach the red attack telegraph, and D5 is the only opening tile that produces
            // one: adjacent to Green Shadow, and closer to the sprout than she is, which is
            // what makes the AI bite instead of walk past.
            opening: [{ cls: UnitClass.WALKER, x: 3, y: 4 }],
            waves: {
                // Turn 2 needs a target of its own. The opening zombie shares her row and has
                // 2 HP against her 2 damage, so it is dead on turn 1 and turn 2 had nothing
                // left to shoot — the "move, then attack" lesson pointed at empty grass.
                //
                // This one arrives one row ABOVE her. Pea Shot is a LINE attack, so range was
                // never the reason to move: alignment is. She has to step into row C before
                // the shot exists at all, which is the actual lesson.
                2: [{ cls: UnitClass.WALKER, x: 2, y: 6 }],
                3: [
                    { cls: UnitClass.WALKER, x: 2, y: 7 },
                    { cls: UnitClass.WALKER, x: 4, y: 7 },
                ],
            },
            objective: 'SURVIVE_TURNS',
            objectiveText: 'Trụ vững qua 3 đợt tấn công sinh tử.',
            bonuses: [
                // Reuses the existing NO_HERO_DOWN rule with tutorial copy and a bigger
                // payout — this 50 is what funds the shop on board 3.
                { type: 'NO_HERO_DOWN', description: 'Cứu Sunbloom', coins: 50 },
                { type: 'NO_BRAIN_LOST', description: 'Không mất mầm nào', coins: 25 },
            ],
            // Board 1 is walked through one click at a time: the overlay blocks everything
            // except the single control named by `focus`, so there is no wrong move available.
            // The hand-holding thins out from board 2 onward.
            steps: [
                { phase: 'PLACEMENT', turn: 1, note: 'Trận địa vây sẵn rồi. Bấm Bắt Đầu Trận!', focus: 'start-battle' },
                { turn: 1, note: 'Bóng Peaburst đứng đó. Hãy bấm vào cô ấy.', focus: 'hero-PEABURST' },
                { turn: 1, note: 'Nạp Đậu Bắn Thường. Đòn này hoàn toàn miễn phí!', focus: 'skill-gs_pea' },
                { turn: 1, note: 'Mũi tên đỏ chỉ trúng target. Bắn nó ngay!', focus: 'tile-3-4', act: 'ATTACK' },
                { turn: 1, note: 'Lượt một an toàn. Bấm Kết Thúc Lượt.', focus: 'end-turn' },
                { turn: 2, note: 'Kẻ thù mới ở hàng trên. Bấm chọn Peaburst.', focus: 'hero-PEABURST' },
                { turn: 2, note: 'Đạn bắn thẳng hàng. Bước lên hàng của nó!', focus: 'tile-2-3', act: 'MOVE' },
                { turn: 2, note: 'Thấy đường đạn rồi! Chọn Bắn Đậu ngay.', focus: 'skill-gs_pea' },
                { turn: 2, note: 'Chỉ định mục tiêu: Bấm vào con zombie.', focus: 'tile-2-6', act: 'ATTACK' },
                // The kill deserves a beat before the button. "Kết thúc lượt." alone read
                // like the game hadn't noticed the player just did the thing it asked for.
                { turn: 2, note: 'Mục tiêu gục ngã! Bấm Kết Thúc Lượt.', focus: 'end-turn' },

                // Turn 3 used to be "bạn tự chơi" — the one free stretch in the whole chain,
                // and the place a lost new player could still lose Sunbloom. Scripted now:
                // she is already standing in row C from turn 2, so the row-C zombie is one
                // shot, and the row-E one measurably cannot reach the sprout before the clock.
                { turn: 3, note: 'Đợt cuối: hai tên nữa. Chọn Peaburst.', focus: 'hero-PEABURST' },
                { turn: 3, note: 'Giơ súng: Bắn Đậu.', focus: 'skill-gs_pea' },
                { turn: 3, note: 'Khóa mục tiêu: Bắn con hàng C!', focus: 'tile-2-7', act: 'ATTACK' },
                // The lesson Into the Breach players take years to internalise, said out
                // loud on board ONE: the objective is the clock, not the body count. A
                // note-only full stop so it cannot be clicked past without dismissing it.
                { turn: 3, note: 'Nhiệm vụ là SỐNG SÓT — không cần diệt sạch!' },
                { turn: 3, note: 'Tên hàng E không chạm nổi nhà. Kết thúc lượt!', focus: 'end-turn' },
            ],
        },
    },

    // -----------------------------------------------------------------------------------
    // 2. Sprouts, the spawn hole, Sol, the pierce skill — and the death that starts the arc.
    // -----------------------------------------------------------------------------------
    {
        id: 'tut_2',
        title: 'Cái Hố',
        // An ELITE node, not a plain battle. The map already draws these differently and pays
        // COIN_ELITE_BONUS for clearing one, so the step up in danger is something the player
        // can see coming on the map before they walk into it — which is the whole point of
        // having node types at all.
        type: 'ELITE',
        brief: 'Lũ quái tinh nhuệ tràn lên từ lòng đất. Bảo vệ mạch sống bằng mọi giá.',
        battle: {
            // ONE Greenspire, in Peaburst's own row — she IS the way to the sprout, which is what
            // makes zombies bite her instead of strolling past (a replay of the real engine
            // proved the old two-Greenspire layout never killed her at all).
            //
            // The WATER strip behind her is the second fix from the same replay: with open
            // grass at her back she could walk three tiles out of the turn-4 kill box, so the
            // box needed four Pothelms just to seal the exits. The river closes her escape
            // with terrain instead of bodies — and quietly introduces water itself, one board
            // before Ironhusk's shove can start drowning things in it.
            //
            // The lone 'S' at F3 is the spawn hole Sunbloom spends the battle standing on.
            // Her four neighbours are the whole design: river at B4, and the turn-4 wave
            // fills the other three — a 2 HP Basic on C3 and a Pothelm on each of C5 and
            // D4. The two cans stand between her and the sprout, so they BITE; the Basic is
            // wall AND script beat: her last pea kills it ("hạ nốt một con"), but killing a
            // wall opens nothing — attacking ends her movement for the turn, and the turn
            // is her last. Bites resolve against TILES, so any box that leaves her a legal
            // step is a box she walks out of — the player proved it. This one leaves zero.
            rows: [
                '........',
                '.~~~..#S',
                'H~DD...S',
                '.~DD..#S',
                '........',
                '..S.....',
                '........',
                '........',
            ],
            // Four, not six. She dies on turn 4, and the two turns that used to follow left
            // the player alone with Sunbloom — a 3 HP hero who deals no damage — against a
            // board still full of zombies. The lesson is the loss, not the mopping up.
            maxTurns: 4,
            squad: ['PEABURST', 'SUNBLOOM'],
            placement: { PEABURST: { x: 2, y: 3 }, SUNBLOOM: { x: 3, y: 2 } },
            // 25 banked, and Harvest pays 25. So Precision Blast (50) is exactly one harvest
            // away: unreachable on turn 1 however the player plays, and guaranteed by turn 3
            // if they follow the Sol lesson. That is what makes the lesson load-bearing
            // rather than a caption over something they already had.
            startingSun: 25,
            // One zombie, in HER row, walking at HER sprout. Turn 1 is then a clean shot down
            // the lane with no move, which also pins her at C4 for the rest of the board —
            // and that is what lets turn 3's pierce lesson name a tile and still be right.
            //
            // Just one, because a second opener anywhere else reaches the Greenspire while the
            // script has her locked into the Sol lesson and unable to answer it. Measured:
            // every placement tried cost a sprout on turn 3 or 4.
            opening: [
                { cls: UnitClass.WALKER, x: 2, y: 6 },
            ],
            waves: {
                // Two spawns: one AT THE HOLE Sunbloom is standing on — blocked, 1 chip damage
                // to her, and the "plug the hole" lesson pays off on screen — and one at the
                // row's edge so Peaburst has a real target on the harvest turn. Without it
                // she spent turn 2 idle, and idle heroes are how players learn to waste
                // actions.
                2: [
                    { cls: UnitClass.WALKER, x: 5, y: 2 },
                    { cls: UnitClass.WALKER, x: 2, y: 7 },
                ],
                // Four Scrapcaps in ONE row, all inside Precision Blast's 4 tiles. 3 HP each
                // against 3 piercing damage: the skill the player just learned to afford kills
                // the entire wave in a single click. Basic Pea Shot would kill none of them.
                // Seven at once — the elite spike. Two jobs in one wave, which is why they all
                // arrive together on turn 3 rather than one wave per turn: a wave that lands
                // on the LAST turn never acts at all (spawns are held still the turn they
                // appear), so the killers have to be on the board a full turn early.
                3: [
                    // The pierce row: 3 HP of plain plastic — the cone lost its armour when
                    // armour became metal (data/zombies.ts) — and Precision Blast's four
                    // tiles from C4 are exactly C5..C8, so one click (3 damage, exactly
                    // lethal) removes the entire lane. Pea Shot would kill none of them —
                    // 2 damage against 3 health — which is the argument for Sol made in
                    // units rather than in words.
                    { cls: UnitClass.SCRAPCAP, x: 2, y: 4 },
                    { cls: UnitClass.SCRAPCAP, x: 2, y: 5 },
                    { cls: UnitClass.SCRAPCAP, x: 2, y: 6 },
                    { cls: UnitClass.SCRAPCAP, x: 2, y: 7 },
                    // The kill box, deliberately OFF row C so the pierce cannot thin it, and
                    // every tile 4+ from the Greenspire so no sprout is in reach. The AI takes a
                    // sprout over a plant whenever it can, which is exactly why the old box
                    // failed silently: its Scrapcaps strolled past her to the Greenspires and she
                    // survived the board she was scripted to die on.
                    // Both cans reach BOTH of their posts (C5, D4) — whichever order the AI
                    // walks them in, greedy assignment fills the box; no tie can leave a post
                    // empty. Neither can reach any tile beside Sunbloom. The Basic is FORCED
                    // onto C3: its only entrance is D3, C3 sits strictly nearest the sprout
                    // (distance 2 beats every alternative), and the AI sorts by exactly that.
                    // dmgBonus 1 apiece: elite cans, 3 damage each, 6 total against her 6 HP.
                    // Exactly lethal and no more — the box is a guarantee, not a massacre.
                    // +1 HP each, and it is Sunbloom's Harvest that made it necessary. Turn 4
                    // is hers to spend freely, on the promise that nothing she does matters —
                    // and when Harvest went 25 -> 50 she could suddenly bank her paid skill
                    // (a 4-damage Sol Burn in that era), kill
                    // one of these, and drop the box from 7 damage to 4 against 6 HP. She
                    // rescued the hero the whole arc is built on losing. Behind helmet armour
                    // a 4-damage burn arrives as 3 against these 4 HP (3+1 bonus), so a wall
                    // still cannot be burned away and the promise is true again. The Basic
                    // below stays at 2 on purpose: burning IT still leaves 6, exactly lethal,
                    // and it is the body Peaburst's own last shot is scripted to take.
                    { cls: UnitClass.POTHELM, x: 1, y: 4, lethal: true, hpBonus: 1, dmgBonus: 1, boxAt: { x: 2, y: 4 } },
                    { cls: UnitClass.POTHELM, x: 3, y: 5, lethal: true, hpBonus: 1, dmgBonus: 1, boxAt: { x: 3, y: 3 } },
                    // Spawned at E4, not E3, and the shift is load-bearing under the new Greenspire
                    // rule: from E3 the tile BESIDE the Greenspire (D1) was three steps away, so this
                    // zombie preferred biting the sprout over closing the box and Peaburst walked
                    // out of a trap that was supposed to be sealed. From E4 every tile beside the
                    // Greenspire is four steps off — out of reach — and the post beside her is exactly three.
                    { cls: UnitClass.WALKER, x: 4, y: 3, lethal: true, boxAt: { x: 2, y: 2 } },
                ],
            },
            objective: 'SURVIVE_TURNS',
            objectiveText: 'Sống sót qua 4 đợt cuồng phong.',
            bonuses: [
                { type: 'NO_BRAIN_LOST', description: 'Không mất mầm nào', coins: 25 },
                { type: 'KILL_COUNT', description: 'Diệt 4 zombie', coins: 25, count: 4 },
            ],
            scriptedLoss: 'PEABURST',
            // Hand-held all the way through, for one reason: turn 3 names the tile to fire
            // at, and that tile is only correct if Peaburst is still standing at C4. One
            // free turn anywhere before it and she could be three tiles away, aimed at
            // nothing. So every turn up to the lesson ends on Kết Thúc Lượt.
            steps: [
                // Without this the deploy screen is unguarded, and a player who drags
                // Peaburst off C4 invalidates every tile the rest of the script names.
                { phase: 'PLACEMENT', turn: 1, note: 'Vị trí đã cố định. Bấm Bắt Đầu Trận!', focus: 'start-battle' },
                // Every turn keeps BOTH heroes busy. The old script parked one of them each
                // turn, and an idle hero on a teaching board reads as "actions are optional"
                // — the exact habit that gets squads killed later.
                { turn: 1, note: 'Zombie xông vào hàng bạn. Bấm chọn Peaburst!', focus: 'hero-PEABURST' },
                { turn: 1, note: 'Chuẩn bị đạn: Bắn Đậu.', focus: 'skill-gs_pea' },
                { turn: 1, note: 'Nhắm chuẩn. Giữ nguyên hàng C!', focus: 'tile-2-6', act: 'ATTACK' },
                // The claw marks the hole (telegraphed from turn 1). Standing on it blocks
                // the spawn — the dialogue promised this rule; here it happens on screen.
                { turn: 1, note: 'Miệng hố đất rung lắc. Bấm chọn Sunbloom!', focus: 'hero-SUNBLOOM' },
                { turn: 1, note: 'Bước đè lên hố đất. Bịt lối chui!', focus: 'tile-5-2', act: 'MOVE' },
                { turn: 1, note: 'Gió im lặng. Kết thúc lượt.', focus: 'end-turn' },

                // --- the Sol lesson, standing on the plugged hole ---
                { turn: 2, note: 'Miệng hố đã bịt kín. Bấm chọn Sunbloom!', focus: 'hero-SUNBLOOM' },
                { turn: 2, note: 'Thu Hoạch cần ĐỨNG YÊN. Giữ chặt miệng hố!', focus: 'skill-sf_harvest' },
                { turn: 2, note: 'Kích hoạt năng lượng: Bấm vào Sunbloom.', focus: 'tile-5-2', act: 'ATTACK' },
                { turn: 2, note: 'Tên gầy ngoài rìa. Bấm chọn Peaburst!', focus: 'hero-PEABURST' },
                { turn: 2, note: 'Sẵn sàng đạn: Bắn Đậu.', focus: 'skill-gs_pea' },
                { turn: 2, note: 'Khai hỏa!', focus: 'tile-2-7', act: 'ATTACK' },
                { turn: 2, note: 'Nạp đầy 50 Sol. Kết thúc lượt.', focus: 'end-turn' },

                // --- what the Sol was for. Sunbloom is three moves away — the price of
                // plugging the hole — so she keeps harvesting where she stands. (And the
                // economy is load-bearing: starting at 25, even with this extra harvest she
                // holds only 25 on turn 4 — one paid skill short of interfering with the
                // box that kills Peaburst. Truer still since the rework: her Blessing
                // deals nothing, so the scripted death cannot be shot off at all.) ---
                { turn: 3, note: 'Sunbloom kẹt lại rồi. Tiếp tục gom Sol!', focus: 'hero-SUNBLOOM' },
                { turn: 3, note: 'Thu Hoạch năng lượng.', focus: 'skill-sf_harvest' },
                { turn: 3, note: 'Chạm vào Sunbloom.', focus: 'tile-5-2', act: 'ATTACK' },
                { turn: 3, note: 'Peaburst nghiến răng: "Dồn hết đạn cho tôi!"', focus: 'hero-PEABURST' },
                { turn: 3, note: 'Bắn Chuẩn Xác: 50 Sol, ba viên liên tiếp!', focus: 'skill-gs_precision_blast' },
                // C5, the FIRST body in the lane, not C6. Precision Blast stopped piercing
                // when pierce went back to Thornquill, so a LINE shot can only be aimed at the
                // nearest target — and it does not need to reach past: each pea that overkills
                // rolls on to the next zombie by itself, which is the whole lesson.
                { turn: 3, note: 'Bắn vào tên gần nhất. Đạn thừa tự bay tiếp!', focus: 'tile-2-4', act: 'ATTACK' },
                { turn: 3, note: 'Màn đêm sụp xuống. Kết thúc lượt.', focus: 'end-turn' },

                // Turn 4 is hand-held down to the single button too, and that is the whole
                // point of it. The note says she cannot be saved; leaving the player free to
                // walk her three tiles away would make the note a lie — measurement showed a
                // retreat on this turn dodges the wave outright, because the bites resolve
                // against the tile she was standing on when the intents were set.
                // Her last stand is played, not narrated: one more kill, then the walls
                // close. The final step is a note with NO focus on purpose — after "Đã
                // hiểu" the overlay stands down and Sunbloom's action belongs to the player,
                // because nothing she can do changes anything: 25 Sol is one Burn short,
                // the box is out of her reach, and the clock ends this turn.
                { turn: 4, note: 'Bị bao vây ba phía. Peaburst không lùi!', focus: 'hero-PEABURST' },
                { turn: 4, note: 'Nạp phát đạn cuối: Bắn Đậu.', focus: 'skill-gs_pea' },
                { turn: 4, note: 'Bắn ngã thêm một tên!', focus: 'tile-2-2', act: 'ATTACK' },
                { turn: 4, note: 'Quân địch quá đông. Sunbloom bất lực. Hãy thử!' },
            ],
        },
    },

    // -----------------------------------------------------------------------------------
    // 3. Coin. Stock is pinned to the two cheapest plants: a random Ice Grenade at 175 would
    // eat the whole purse and strand the player before the revive on board 5.
    // -----------------------------------------------------------------------------------
    {
        id: 'tut_3',
        title: 'Xe Hàng',
        type: 'SHOP',
        brief: 'Nỗi đau mất mát Peaburst. Mua trang bị lấp khoảng trống.',
        shopOffers: ['MAT_PEASHOOTER', 'MAT_PEASHOOTER'],
        // ONE item, the cheapest. Enough to teach that the second shelf exists and is paid
        // for in Coin, without putting the revive at risk — the full shelf is 350 Coin.
        itemOffers: ['seed_mine'],
        // Both offers are the same plant now, so buy order no longer matters: board 4
        // auto-deploys `bench[0]` into the dead hero's slot, and whichever Seed Gun that
        // is, an identical one is left for board 6's fusion. The second offer used to be a
        // Armor Plate, and buying out of order left the campfire step pointing at a plant that
        // had already taken the field.
        steps: [
            { phase: 'SHOP', turn: 1, note: 'Thành hàng trống chỗ. Mua một Súng Hạt!', focus: 'shop-plant-MAT_PEASHOOTER' },
            { phase: 'SHOP', turn: 1, note: 'Ghế dự bị còn chỗ. Mua thêm một Xạ Thủ!', focus: 'shop-plant-MAT_PEASHOOTER' },
            { phase: 'SHOP', turn: 1, note: 'Kệ dưới là đồ một lần. Mua Mìn Hạt!', focus: 'shop-item-seed_mine' },
            { phase: 'SHOP', turn: 1, note: 'Giữ chặt túi Xu — bạn sẽ cần sau này!', focus: 'shop-leave' },
        ],
    },

    // -----------------------------------------------------------------------------------
    // 4. Push, the bench plant taking the field, and a sprout that genuinely cannot be saved.
    //
    // THREE zombies converge on the lower Greenspire, not one. With a single attacker down there
    // the board read as a rescue the squad simply refused to attempt — the player could see
    // a free shot and watched the plants ignore it. Three attackers is a front, and the
    // squad spends all three turns holding the other one. Every plant acts on every turn;
    // that is measured, not assumed (see the idle assertion below).
    // -----------------------------------------------------------------------------------
    {
        id: 'tut_4',
        title: 'Hai Căn Nhà',
        type: 'BATTLE',
        brief: 'Áp lực dồn nén từ hai ngả. Bạn buộc phải chọn thứ để hy sinh.',
        battle: {
            // The '#' at A1 is what makes the mine lesson DETERMINISTIC: the Pothelm gets
            // shoved from B2 up to A2, and with A1 walled the only route back to Greenspire B1 is
            // through B2 — the exact tile the player just mined. Without that wall the
            // pathfinder could come home via A1 and stroll past the trap.
            // The pond at C5 is the second determinism wall: without it the row-D zombie's
            // path search found a tile beside SUNSPOT at the same sprout-distance as the tile
            // beside the Seed Gun, and the replay showed it taking the wrong one — biting
            // the escort and leaving the backup's scripted shot with nothing to hit.
            rows: [
                '#.......',
                'H.DD...S',
                '..DD~..S',
                '..DD...S',
                '..DD...S',
                'H.DD...S',
                '........',
                '........',
            ],
            maxTurns: 5,
            // PEABURST is listed even though she is dead. That is the point: her slot is
            // what the bench Seed Gun fills. Leave her out and no slot opens, the bought
            // plant stays on the bench, and board 4 teaches nothing about backups — which is
            // exactly what it did until assertTutorial started checking for it.
            squad: ['IRONHUSK', 'SUNBLOOM', 'PEABURST'],
            placement: {
                IRONHUSK: { x: 1, y: 2 },
                SUNBLOOM: { x: 2, y: 3 },
                PEABURST: { x: 4, y: 2 },
            },
            // The global 50, deliberately. Boards 1 and 2 override this DOWNWARD (0 and 25)
            // to make a lesson bite; overriding it upward hands the player an opening purse
            // no real fight ever pays, and then teaches an economy that does not exist. Three
            // Blessings fit inside 50 only with a Harvest between each pair — bless, gather,
            // bless, gather, bless is the whole economy lesson, same rhythm the Sol Burns
            // taught before the rework (PLAN-hero-zephyr §6.1) with the support kit's verbs.
            startingSun: 50,
            scriptedBrainLoss: 1,
            opening: [
                // IRONHUSK's: armoured, so his bash deals literally 0 — the shove onto the
                // mine is not merely faster, it is the ONLY answer he has. The helmet-armour
                // change made this lesson truer than it was written.
                { cls: UnitClass.POTHELM, x: 1, y: 1 },
                // THE EATERS, and the whole story of this board. The squad does NOT write the
                // lower Greenspire off — turn 1 pours everything that can reach down there into
                // them: Sunbloom's Blessing on the Seed Gun and the boosted shot it buys,
                // both plants' entire turn, said out loud in the step notes. It is not
                // enough, and the sprout-loss lesson lands as "we tried with everything and
                // the arithmetic said no", never "the squad stood and watched".
                //
                // TWO bodies, not one inflated health bar. A single 10 HP zombie made the
                // point arithmetically but read as a bug — a Doorbearer with triple the
                // health of any other Doorbearer. A pair says the same thing in a language
                // the board already speaks: kill either one and the OTHER one walks in. The
                // unsavable assertion proves it over their combined health, so neither can
                // quietly become killable on its own.
                // hpBonus 1: the door's base body is 2 HP behind metal armour
                // (data/zombies.ts), and the number is chosen so the script's exact damage
                // stream — one BLESSED pea on turn 1 ((2+1) shaved to 2 by the armour), then
                // turn 3's bash-collision for the 1 it has left — kills it on TURN 3 at D1,
                // the same cue the old Sol-Burn stream hit. That death is load-bearing: the
                // eater behind it re-paths through the freed row-0 lane to C1, which is the
                // tile turn 4's slam-and-pea close-out clicks on. One point more and the door
                // outlives its cue, the second eater parks on D1 instead, and the replay
                // desyncs on the Seed Gun's scripted step into that exact tile.
                { cls: UnitClass.DOORBEARER, x: 5, y: 1, hpBonus: 1, unsavable: true },
                // SUNSPOT's turn-3 target, and no longer mere bookkeeping: a GRAVE digs up
                // a zombie every GRAVE_DIG_PERIOD turns (turnManager), telegraphed on
                // the unit as a countdown. Its clock strikes at the end of turn 2 — the
                // exact turn the script has her burn it, so the lesson is a deadline met
                // on the last possible turn, watched ticking down since the board opened.
                { cls: UnitClass.GRAVE, x: 2, y: 5 },
                // The Seed Gun's turn-2 kill, marching down row D at the upper flank.
                { cls: UnitClass.WALKER, x: 3, y: 6 },
                // The second lower-Greenspire attacker. It arrives too late to help the eater;
                // once the sprout is gone it turns for the LAST Greenspire, and turn 3 is the
                // squad closing ranks around B1 and finishing the fight.
                // The second eater, and the reason the sprout is gone whatever the player does:
                // drop the Doorbearer and THIS walks the last two tiles instead. Back to a
                // Scrapcap now that Blessing replaced the burn: the support kit's whole
                // output into the pair is one boosted pea, so even a helmetless second body
                // keeps them beyond saving — see the unsavable assertion — and its 3 HP is
                // exactly what turn 4's close-out stream (slam 1 + pea 2) removes on cue.
                { cls: UnitClass.SCRAPCAP, x: 5, y: 4, unsavable: true },
            ],
            objective: 'KILL_ALL',
            objectiveText: 'Quét sạch lực lượng quái vật.',
            bonuses: [
                { type: 'KILL_COUNT', description: 'Diệt 2 zombie', coins: 25, count: 2 },
                { type: 'NO_HERO_DOWN', description: 'Không mất hero nào', coins: 25 },
            ],
            steps: [
                { phase: 'PLACEMENT', turn: 1, note: 'Chiến sĩ dự bị lấp chỗ trống. Bắt Đầu Trận!', focus: 'start-battle' },

                // --- turn 1: hold the top door, and POUR everything into the bottom one ---
                { turn: 1, note: 'Hai Tháp Xanh nguy ngập. Chia lửa ra!' },
                // The bucket is the tutorial's first ARMOURED body: the note teaches the rule
                // ("light hits bounce"), and the lesson then demonstrates the answer — a shove
                // onto a mine, because mines (and slams) do not care about helmets.
                { turn: 1, note: 'Đội Xô bọc giáp — đòn nhẹ bật ra. Bấm Ironhusk!', focus: 'hero-IRONHUSK' },
                { turn: 1, note: 'Đứng DƯỚI nó — hướng đẩy tính từ bạn ra.', focus: 'tile-2-1', act: 'MOVE' },
                { turn: 1, note: 'Vung khiên: Đập Khiên!', focus: 'skill-wk_bash' },
                { turn: 1, note: 'Hất văng nó khỏi hiên nhà!', focus: 'tile-1-1', act: 'ATTACK' },
                { turn: 1, note: 'Gài Mìn Hạt chặn bước nó quay lại.', focus: 'item-seed_mine' },
                { turn: 1, note: 'Đặt mìn vào đúng ô vừa hất ra.', focus: 'tile-1-1', act: 'ITEM' },
                { turn: 1, note: 'Nhà dưới: Cửa Lưới bọc giáp. Xạ Thủ, xuống góc bắn!', focus: 'unit-MAT_PEASHOOTER' },
                { turn: 1, note: 'Di chuyển xuống hàng F lấy góc bắn!', focus: 'tile-5-2', act: 'MOVE' },
                // Bless BEFORE the shot — the +1 dies at end of turn, so the order IS the
                // lesson. The blessed pea is (2+1) through armour 1 = 2 into the door's 3.
                { turn: 1, note: 'Sunbloom dồn lực cùng! Bấm chọn cô ấy.', focus: 'hero-SUNBLOOM' },
                { turn: 1, note: 'Tiến lại gần Xạ Thủ.', focus: 'tile-4-3', act: 'MOVE' },
                { turn: 1, note: 'Ban Phước — 50 Sol: +1 sát thương TRONG LƯỢT NÀY!', focus: 'skill-sf_blessing' },
                { turn: 1, note: 'Phước lành cho Xạ Thủ — buff TRƯỚC, bắn SAU!', focus: 'tile-5-2', act: 'ATTACK' },
                { turn: 1, note: 'Giờ Xạ Thủ khai hỏa. Chọn lại nó!', focus: 'unit-MAT_PEASHOOTER' },
                { turn: 1, note: 'Bắn Đậu!', focus: 'skill-pea_shot' },
                { turn: 1, note: 'Đạn được ban phước xuyên giáp sâu hơn!', focus: 'tile-5-1', act: 'ATTACK' },
                { turn: 1, note: 'Nó còn 1 máu. Kết thúc lượt!', focus: 'end-turn' },

                // --- turn 2: the arithmetic says no. Say it, then hold the second front ---
                { turn: 2, note: 'Nó sát cửa rồi, bắn không kịp nữa!' },
                { turn: 2, note: 'Mất mầm là vĩnh viễn. Mất 5 quả: Thua!' },
                { turn: 2, note: 'Rút quân nhà dưới! Bấm chọn Xạ Thủ.', focus: 'unit-MAT_PEASHOOTER' },
                { turn: 2, note: 'Về hàng D chặn lối zombie khác!', focus: 'tile-3-2', act: 'MOVE' },
                { turn: 2, note: 'Bắn Đậu!', focus: 'skill-pea_shot' },
                { turn: 2, note: 'Bắn gục con hàng D!', focus: 'tile-3-3', act: 'ATTACK' },
                { turn: 2, note: 'Ironhusk lui về trung tâm. Chọn anh ấy!', focus: 'hero-IRONHUSK' },
                { turn: 2, note: 'Đứng đây để mai chặn cả hai ngả.', focus: 'tile-3-1', act: 'MOVE' },
                { turn: 2, note: 'Sunbloom gom Sol cho đòn sau. Chọn cô ấy.', focus: 'hero-SUNBLOOM' },
                { turn: 2, note: 'Thu Hoạch — 50 Sol một nhát.', focus: 'skill-sf_harvest' },
                { turn: 2, note: 'Chạm vào Sunbloom.', focus: 'tile-4-3', act: 'ATTACK' },
                { turn: 2, note: 'Đành hy sinh nhà dưới. Kết thúc lượt.', focus: 'end-turn' },

                // --- turn 3: the thief does not get to walk away ---
                // Under the Greenspire rule a zombie that takes a sprout is still standing there
                // afterwards, on 1 HP, already walking at the NEXT Greenspire. Ironhusk answers it
                // with the board's own opening lesson: shoved with the map edge behind it —
                // the bash itself bounces off the door's metal (1 - armour = 0), and the
                // collision is exactly the 1 it has left.
                { turn: 3, note: 'Con cướp mầm vẫn còn đó! Chọn Ironhusk.', focus: 'hero-IRONHUSK' },
                { turn: 3, note: 'Đập Khiên.', focus: 'skill-wk_bash' },
                { turn: 3, note: 'Hất nó vào tường — giáp chặn đập, cú va kết liễu.', focus: 'tile-3-0', act: 'ATTACK' },
                // The grave's clock is the deadline; the answer is the same one-two from
                // turn 1 — bless the shooter, then the boosted pea (2+1 = 3) fells the
                // 3-HP grave in a single shot, on the last turn before its second dig.
                { turn: 3, note: 'Nấm mồ sắp trồi thêm! Sunbloom, ban phước!', focus: 'hero-SUNBLOOM' },
                { turn: 3, note: 'Ban Phước.', focus: 'skill-sf_blessing' },
                { turn: 3, note: 'Phước cho Xạ Thủ — nó sẽ dập cái mồ.', focus: 'tile-3-2', act: 'ATTACK' },
                { turn: 3, note: 'Xạ Thủ, lấy đường đạn dọc hàng C!', focus: 'unit-MAT_PEASHOOTER' },
                { turn: 3, note: 'Sang C4 — thẳng làn tới cái mồ.', focus: 'tile-2-3', act: 'MOVE' },
                { turn: 3, note: 'Bắn Đậu!', focus: 'skill-pea_shot' },
                { turn: 3, note: 'Một phát được ban phước — dập tận gốc!', focus: 'tile-2-5', act: 'ATTACK' },
                { turn: 3, note: 'Còn con Nón Chóp phía dưới. Kết thúc lượt.', focus: 'end-turn' },

                // --- turn 4: the one already on the doorstep dies now ---
                // Its bite lands at the END of this turn, so chipping it is not an option —
                // shove and shot together, or the upper Greenspire goes the way of the lower one.
                // Close-out arithmetic, and the ORDER is the arithmetic: the pea fires
                // first, down the C column Ironhusk is about to stand in — 2 into the cone's
                // 3 — and then he steps in and finishes with bash 1 + wall-slam 1. Swap the
                // two and his own body blocks the shot that sets his kill up.
                { turn: 4, note: 'Nón Chóp đã kề nhà trên! Xạ Thủ bắn trước!', focus: 'unit-MAT_PEASHOOTER' },
                { turn: 4, note: 'Bắn Đậu.', focus: 'skill-pea_shot' },
                { turn: 4, note: 'Xuyên dọc hàng C, bào nó còn 1 máu!', focus: 'tile-2-0', act: 'ATTACK' },
                { turn: 4, note: 'Ironhusk khoá sổ. Chọn anh ấy!', focus: 'hero-IRONHUSK' },
                { turn: 4, note: 'Áp sát nó.', focus: 'tile-2-1', act: 'MOVE' },
                { turn: 4, note: 'Đập Khiên.', focus: 'skill-wk_bash' },
                { turn: 4, note: 'Hất vào tường — cú va kết liễu. Giữ được nhà trên!', focus: 'tile-2-0', act: 'ATTACK' },
                { turn: 4, note: 'Sunbloom gom Sol. Chọn cô ấy.', focus: 'hero-SUNBLOOM' },
                { turn: 4, note: 'Thu Hoạch.', focus: 'skill-sf_harvest' },
                { turn: 4, note: 'Chạm vào Sunbloom.', focus: 'tile-4-3', act: 'ATTACK' },
                { turn: 4, note: 'Còn con chui từ mộ. Kết thúc lượt.', focus: 'end-turn' },

                // --- turn 5: the grave's riser, and the payoff for gathering ---
                // Sunbloom has spent and re-gathered twice by now, so the last blessing is
                // hers to give. That rhythm — bless, harvest, bless, harvest, bless — is the
                // whole economy lesson, and it fits inside the standard 50 opening exactly.
                // The finisher is Ironhusk's blessed bash: (1+1) into the riser's 2.
                { turn: 5, note: 'Con chui từ mộ đã tới cửa. Sunbloom còn 50 Sol!', focus: 'hero-SUNBLOOM' },
                { turn: 5, note: 'Bước tới gần Ironhusk.', focus: 'tile-3-2', act: 'MOVE' },
                { turn: 5, note: 'Ban Phước.', focus: 'skill-sf_blessing' },
                { turn: 5, note: 'Phước cuối cho Ironhusk!', focus: 'tile-2-1', act: 'ATTACK' },
                { turn: 5, note: 'Ironhusk, kết liễu! Chọn anh ấy.', focus: 'hero-IRONHUSK' },
                { turn: 5, note: 'Đập Khiên.', focus: 'skill-wk_bash' },
                { turn: 5, note: 'Sạch bóng. Mất một mầm, giữ được một.', focus: 'tile-1-1', act: 'ATTACK' },
                { turn: 5, note: 'Kết thúc lượt.', focus: 'end-turn' },
            ],
        },
    },

    // -----------------------------------------------------------------------------------
    // 5. The event system, and the hero comes back.
    // -----------------------------------------------------------------------------------
    {
        id: 'tut_5',
        title: 'Người Lạ Trên Đường',
        type: 'EVENT',
        brief: 'Một bóng hình quen thuộc đứng chờ trong vòng xoay thời gian.',
        eventId: 'tut_revive',
        // Two clicks, because reviving is two decisions: take the offer, then choose who.
        // Walking on is a real option in a real run, but not on the board that exists to
        // teach what the offer IS — and the arc needs her back for the boss.
        steps: [
            { phase: 'EVENT', turn: 1, note: 'Vòng xoay thời gian. Bấm chọn Hồi Sinh!', focus: 'event-option-0' },
            { phase: 'EVENT', turn: 1, note: 'Gọi người xưa trở lại: Chọn Peaburst!', focus: 'event-hero-PEABURST' },
        ],
    },

    // -----------------------------------------------------------------------------------
    // 6. The rest point — and the only place in the game where fusion happens.
    // -----------------------------------------------------------------------------------
    {
        id: 'tut_6',
        title: 'Lửa Trại',
        type: 'CAMPFIRE',
        brief: 'Nơi trú ẩn bình yên. Nơi duy nhất để ghép nguồn sức mạnh mới.',
        // The campfire EVENT, exactly as an ordinary stage run gets it: one visit, one choice,
        // and the choices may be free. The Breach's paid camp is a different node entirely
        // (`paidCamp`, utils/mapGenerator GENERATE_BREACH_MAP) and the tutorial must teach the
        // rest point the player will actually meet for the next nine acts.
        eventId: 'rest_site',
        // Two Seed Guns were bought on board 3 and they end up doing different jobs: the
        // first was consumed on board 4 filling Peaburst's slot (deploying a bench plant
        // strikes it off the bench — see `benchDeployedRef`), the second is still here. That
        // is the lesson the bench has been teaching for three boards — a bought plant is
        // EITHER a backup or fusion material, never both — and the same plant twice makes it
        // impossible to miss.
        //
        // The recipient is Peaburst, revived on board 5. Pairing her with a Seed Gun is
        // the Repeater: her basic shot simply fires twice. That visibility is the point —
        // the previous version fused armour onto Sunbloom, and a new player has no way to see
        // that anything happened at all.
        steps: [
            { phase: 'CAMPFIRE', turn: 1, note: 'Bên đống lửa hồng. Nơi duy nhất ghép cây!', focus: 'campfire-fuse' },
            // Peaburst, revived on board 5. This used to have to be Sunbloom: a revive only
            // QUEUES a hero, and the fusion panel was fed the live units, so a queued hero
            // had no card and the overlay stalled pointing at nothing. The panel now takes
            // `fusableHeroes()`, which includes pending revives, so the hero the player just
            // paid to bring back is the hero they can fuse.
            { phase: 'CAMPFIRE', turn: 1, note: 'Chọn người nhận sức mạnh: Peaburst tái sinh!', focus: 'fusion-hero-PEABURST' },
            { phase: 'CAMPFIRE', turn: 1, note: 'Chọn cây dự bị cùng loại để hợp nhất.', focus: 'fusion-plant-MAT_PEASHOOTER' },
            { phase: 'CAMPFIRE', turn: 1, note: 'Ghép! Từ giờ đòn bắn thường nổ đôi!', focus: 'fusion-confirm' },
            // No rest-option step: at the campfire, fusing IS the visit's one choice —
            // closing the bench after a fuse resolves the event (App.closeFusionPanel),
            // so after fusion-confirm the screen changes on its own. A step pointing at a
            // rest option here would wait for a screen that has already left.
        ],
    },

    // -----------------------------------------------------------------------------------
    // 7. Gravehulk, and the lesson that losing is part of the loop.
    // 20 HP behind a rolling escort is arithmetically out of reach for the squad even with
    // the Repeater fusion in hand — the max-burst assertion below re-derives the exact
    // ceiling from hero data every build and fails the moment the defeat stops being real.
    // -----------------------------------------------------------------------------------
    {
        id: 'tut_7',
        title: 'Kẻ Khổng Lồ',
        type: 'BOSS',
        brief: 'Trận chiến không thể chiến thắng. Hãy chiến đấu đến hơi thở cuối cùng.',
        battle: {
            // Three sprouts, and a boss that CANNOT wander. Row D is a walled corridor
            // (the '^' rubble either side of Greenspire D1), so the route to the last sprout runs
            // through Peaburst and nowhere else. That is the whole reason the script works:
            // with an open board the pathfinder detoured around her on turn 1 and every
            // scripted tile after it pointed at empty grass.
            //
            // The clock: A1 falls turn 2, G1 turn 3, and on turn 3 the boss smashes
            // Peaburst, walks over her, and takes D1 itself on turn 4. Every tool the squad
            // owns has been spent by then and the thing is still standing — a loss by being
            // devoured, not by running out of turns.
            // The two side Greenspires sit in rows A and G, NOT B and F, and that gap is load-
            // bearing. Peaburst stands in row D between the boss and Greenspire D1, which adds
            // two tiles to that path; with the side Greenspires only one row out, D1 tied with
            // them and the boss wandered off down another lane, leaving every scripted shot
            // pointing at empty grass. Three rows out, D1 stays strictly the shortest walk
            // and the boss never leaves Peaburst's line.
            rows: [
                'H.......',
                '..DD...S',
                '^^DD...S',
                'HDDD...S',
                '^^DD...S',
                '..DD...S',
                'H.......',
                '........',
            ],
            maxTurns: 4,
            squad: ['PEABURST', 'IRONHUSK', 'SUNBLOOM'],
            placement: {
                // ROW D IS SHADELEAF'S LANE AND NOBODY ELSE STANDS IN IT.
                //
                // A LINE shot is stopped by any body in the way, ALLY INCLUDED. Ironhusk
                // used to start at D3, directly between her and the boss, so every scripted
                // "shoot down row D" step pointed at a tile the game would not accept — the
                // tutorial locked up on turn 1 and the player could not proceed. (My first
                // simulation missed it by only counting enemies as blockers.)
                //
                // Ironhusk now works from row C and Sunbloom from row E: he can still reach
                // the boss diagonally-adjacent to bash it, she is still inside Blessing's
                // three tiles of him, and her line stays clear all three turns.
                PEABURST: { x: 3, y: 1 },
                IRONHUSK: { x: 2, y: 2 },
                SUNBLOOM: { x: 4, y: 2 },
            },
            opening: [
                { cls: UnitClass.GRAVEHULK, x: 3, y: 5, hpBonus: 9 },
                // The side eaters, in lanes no hero can cover: A1 falls on turn 2, G1 on
                // turn 3. Nobody is sent at D1 — that Greenspire must keep its sprout to the very
                // end, because D1 is the only thing keeping the boss walking down ROW D.
                // The one turn D1 went dark early, the boss retargeted mid-fight and every
                // scripted shot after it named a tile it no longer stood on.
                { cls: UnitClass.WALKER, x: 0, y: 1 },
                { cls: UnitClass.WALKER, x: 6, y: 5 },
            ],
            waves: {
                // Pressure, not participants: they arrive too far away to land a hit before
                // the end, but the board visibly fills while the squad empties its pockets.
                2: [
                    { cls: UnitClass.SCRAPCAP, x: 1, y: 6 },
                    { cls: UnitClass.POTHELM, x: 5, y: 7 },
                    { cls: UnitClass.WALKER, x: 0, y: 5 },
                    { cls: UnitClass.SCRAPCAP, x: 6, y: 7 },
                ],
                3: [
                    { cls: UnitClass.SCRAPCAP, x: 0, y: 7 },
                    { cls: UnitClass.POTHELM, x: 1, y: 7 },
                    { cls: UnitClass.SCRAPCAP, x: 6, y: 4 },
                ],
            },
            objective: 'KILL_ALL',
            objectiveText: 'Tiêu diệt quái vật. (Bạn chắc chắn sẽ thất bại).',
            bonuses: [
                { type: 'KILL_COUNT', description: 'Diệt 2 zombie', coins: 25, count: 2 },
            ],
            scriptedDefeat: true,
            // Every turn spends every hero, and the ledger is the lesson: pea 2, the
            // three-pea blast for 6 and a last pea 2 from Peaburst, two shield bashes (the
            // second one blessed to 2), 13 into a 25 HP boss. Measured, so the defeat can
            // never be mistaken for a misplay — and the blessing teaches its one rule
            // (buff first, swing after) in the fight built to be lost.
            steps: [
                { phase: 'PLACEMENT', turn: 1, note: 'Kẻ hủy diệt xuất hiện. Bắt Đầu Trận!', focus: 'start-battle' },

                { turn: 1, note: 'Nó rầm rộ vào hàng D. Chọn Peaburst!', focus: 'hero-PEABURST' },
                { turn: 1, note: 'Bắn Đậu!', focus: 'skill-gs_pea' },
                { turn: 1, note: 'Xả đạn từ xa. 25 máu — bào dần!', focus: 'tile-3-5', act: 'ATTACK' },
                { turn: 1, note: 'Ironhusk làm mồi nhử. Bấm chọn anh ấy!', focus: 'hero-IRONHUSK' },
                { turn: 1, note: 'Đi hàng C né làn đạn của Peaburst!', focus: 'tile-2-4', act: 'MOVE' },
                { turn: 1, note: 'Sunbloom tích Sol dồn đòn chí mạng.', focus: 'hero-SUNBLOOM' },
                { turn: 1, note: 'Thu Hoạch.', focus: 'skill-sf_harvest' },
                { turn: 1, note: 'Chạm vào Sunbloom.', focus: 'tile-4-2', act: 'ATTACK' },
                { turn: 1, note: 'Dốc sức lượt đầu. Kết thúc lượt!', focus: 'end-turn' },

                // Turn 2 opens with CHRONA'S REWIND, taught by doing the thing it exists
                // for: the script orders a deliberately bad move — Peaburst stepping to D4,
                // straight into the Gravehulk's path, where a blocker gets smashed — then
                // has Chrona pull the whole board back to the start of the turn. Teaching it
                // on the boss board is the point: she was introduced two nodes ago as a time
                // machine, the defeat ahead is her jump, and this is the small rehearsal.
                // The reset un-satisfies the bad-move step by design; the reset-turn step
                // reads the spent charge, which stays true, so the overlay never rewinds.
                { turn: 2, note: 'Chrona: "Tôi lưu được ĐẦU LƯỢT. Cứ thử sai đi!"' },
                { turn: 2, note: 'Chọn Peaburst.', focus: 'hero-PEABURST' },
                { turn: 2, note: 'Bước liều lên D4, sát con quái!', focus: 'tile-3-3', act: 'MOVE' },
                { turn: 2, note: 'Chắn đường nó là ăn búa 5 máu!' },
                { turn: 2, note: 'Bấm TUA LẠI LƯỢT — Chrona giữ lời.', focus: 'reset-turn' },
                { turn: 2, note: 'Bàn cờ về đầu lượt. Nước đi được hoàn lại.' },

                // The boss has closed to D5 and Ironhusk is already standing beside
                // it, so he swings without moving. Every tile named here is measured against
                // the boss's real march down the corridor — D6, D5, D3 — not guessed.
                { turn: 2, note: 'Nó đã đến sát Ironhusk. Chọn anh ấy!', focus: 'hero-IRONHUSK' },
                { turn: 2, note: 'Đập Khiên!', focus: 'skill-wk_bash' },
                { turn: 2, note: 'Đập mạnh vào sườn nó!', focus: 'tile-3-4', act: 'ATTACK' },
                { turn: 2, note: 'Nó quá đồ sộ, không lùi một bước!' },
                { turn: 2, note: 'Hai nhà sắp sụp. Chọn Peaburst dồn lực!', focus: 'hero-PEABURST' },
                { turn: 2, note: 'Bắn Chuẩn Xác!', focus: 'skill-gs_precision_blast' },
                { turn: 2, note: 'Trút 50 Sol vào ngực nó!', focus: 'tile-3-4', act: 'ATTACK' },
                { turn: 2, note: 'Sunbloom, tích thêm năng lượng!', focus: 'hero-SUNBLOOM' },
                { turn: 2, note: 'Thu Hoạch.', focus: 'skill-sf_harvest' },
                { turn: 2, note: 'Thu hoạch lần nữa.', focus: 'tile-4-2', act: 'ATTACK' },
                { turn: 2, note: 'Mạn tháo chạy! Kết thúc lượt.', focus: 'end-turn' },

                // Turn 3 is the whole arsenal into one tile. The boss walks two columns a
                // turn straight down row D — D8, D6, D4 — so every tile below is measured,
                // not guessed, and all three heroes can name the same square.
                // Move first, bless second, bash third: the +1 lives only inside this
                // turn, so the order the clicks happen in IS the mechanic being taught.
                { turn: 3, note: 'Nó vào giữa sân. Dốc cạn sức lực!', focus: 'hero-IRONHUSK' },
                { turn: 3, note: 'Ironhusk áp sát bằng hàng C!', focus: 'tile-2-2', act: 'MOVE' },
                { turn: 3, note: 'Sunbloom dồn 50 Sol cuối. Chọn cô ấy!', focus: 'hero-SUNBLOOM' },
                { turn: 3, note: 'Ban Phước!', focus: 'skill-sf_blessing' },
                { turn: 3, note: 'Phước cho Ironhusk — buff trước, đập sau!', focus: 'tile-2-2', act: 'ATTACK' },
                { turn: 3, note: 'Giờ Ironhusk vung đòn. Chọn lại anh ấy!', focus: 'hero-IRONHUSK' },
                { turn: 3, note: 'Đập Khiên!', focus: 'skill-wk_bash' },
                { turn: 3, note: 'Cú đập được ban phước!', focus: 'tile-3-2', act: 'ATTACK' },
                { turn: 3, note: 'Peaburst, trút nốt viên đạn cuối!', focus: 'hero-PEABURST' },
                { turn: 3, note: 'Bắn Đậu!', focus: 'skill-gs_pea' },
                { turn: 3, note: 'Tất cả đã dốc hết. Nó vẫn đứng!', focus: 'tile-3-2', act: 'ATTACK' },
                { turn: 3, note: 'Không thể cứu vãn. Thua là trắng tay!', focus: 'end-turn' },

                // Nothing left to spend: no Sol, no Peaburst, and the boss is standing on
                // the last Greenspire. Before the last click, Chrona overturns turn 3's "losing
                // is empty-handed" ON PURPOSE — these four note-only beats are where the
                // Chrono Echo is taught (utils/persistence.ts): a real defeat sends one item
                // to the next campaign, abandoning sends nothing, and THIS defeat mints the
                // player's first one. The mechanic must be said here, in the loss it applies
                // to, or the echo screen that opens their first real campaign reads as a bug.
                { turn: 4, note: 'Chrona: "Khoan! Thất bại thật sự không trắng tay đâu."' },
                { turn: 4, note: 'Mỗi lần thua trận, tôi kịp gửi 1 vật phẩm về chiến dịch sau.' },
                { turn: 4, note: 'Nhưng bỏ chạy giữa chừng thì không có gì nhé!' },
                { turn: 4, note: 'Trận này là bài học — quà đầu tiên chờ ở chiến dịch thật.' },
                // The final step exists so the player is never left guessing what to click
                // while the run ends.
                { turn: 4, note: 'Hết Sol, hết hy vọng. Nhìn nó tàn phá!', focus: 'end-turn' },
            ],
        },
    },
];

// ---------------------------------------------------------------------------------------
// LOOKUPS
// ---------------------------------------------------------------------------------------

export const tutorialNode = (id: string): TutorialNode | undefined =>
    TUTORIAL_CHAIN.find(n => n.id === id);

export const tutorialBattle = (id: string): TutorialBattle | undefined =>
    tutorialNode(id)?.battle;

/**
 * Every step a node owns, wherever it is written. A battle keeps its script next to the
 * board it describes; a shop or a campfire has no board, so its steps live on the node.
 * Callers should not have to know which.
 */
export const tutorialSteps = (id: string | null | undefined): TutorialStep[] => {
    if (!id) return [];
    const node = tutorialNode(id);
    if (!node) return [];
    return node.battle?.steps ?? node.steps ?? [];
};

/** The board a scripted battle is played on. */
export const tutorialBoard = (battle: TutorialBattle): TileData[] =>
    materializeTemplate({
        id: 'tutorial', name: 'Tutorial', world: 'GRASS', concept: 'scripted', rows: battle.rows,
    });


// ---------------------------------------------------------------------------------------
// THE MAP
// ---------------------------------------------------------------------------------------

/**
 * A straight line of seven nodes, no branches. The tutorial teaches what a map node IS;
 * teaching how to *choose* between them comes after, on the generated map, once the player
 * knows what a Shop and a Campfire actually do.
 */
export const GENERATE_TUTORIAL_MAP = (): MapNode[] =>
    TUTORIAL_CHAIN.map((node, i) => ({
        id: node.id,
        x: 50,
        y: 8 + i * (84 / (TUTORIAL_CHAIN.length - 1)),
        type: node.type,
        world: 'GRASS' as const,
        status: i === 0 ? ('AVAILABLE' as const) : ('LOCKED' as const),
        next: i < TUTORIAL_CHAIN.length - 1 ? [TUTORIAL_CHAIN[i + 1].id] : [],
        tutorialId: node.id,
    }));
