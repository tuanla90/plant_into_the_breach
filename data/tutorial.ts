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
 * chain does the same: real Coin, real brains, real losses, on a linear map.
 *
 * Three rules held throughout:
 *   1. CONSTRAINT TEACHES. Board 1 gives one usable hero, so there is nothing else to try.
 *   2. NOTES ARE ONE LINE. Twelve words maximum, enforced by assertTutorial(). If a lesson
 *      needs more prose than that, the board is wrong — fix the board, not the note.
 *   3. NOTHING IS FAKE. Losing a brain on board 4 really costs a brain.
 *
 * The four-board arc is the spine: the Peashooter hero DIES on board 2, you buy a base
 * Peashooter as insurance on board 3, it takes the field on board 4, and the hero comes back
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
     * Gargantuar stays 16 for real runs; the STORY one has eaten well, and needs to shrug
     * off a squad that now owns a Repeater fusion.
     */
    hpBonus?: number;
    /**
     * "This one takes a brain and the squad cannot stop it." Declaring it makes
     * assertTutorial prove the claim: every plant on the board is given its full movement
     * plus its longest-range, hardest-hitting skill, all of it aimed at this tile on turn 1,
     * and the total must come up SHORT of this spawn's health.
     *
     * Written after a player asked why the Peashooter walked away from a zombie standing on
     * the doorstep. The answer was that it should not have: a Pea Shot is a LINE in all four
     * directions, one step put the tile in range, and the "unsavable" brain died to a single
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
    /** Forced squad — the tutorial never shows the hero picker. */
    squad: HeroId[];
    /** Fixed deployment, so the player is never asked to place before being taught how. */
    placement: Record<string, Position>;
    /** Heroes that start DORMANT: alive, targetable, unable to act. */
    dormant?: HeroId[];
    /**
     * Sun in the bank when the fight opens. Defaults to the game's SUN_ON_LEVEL_START.
     *
     * The tutorial needs to control this because Sun is what gates a hero's second tool.
     * At the standard 50 the player can fire Precision Blast on board 1, turn 1 — before
     * anything has explained Sun, and against a board built on the promise that Pea Shot is
     * the only thing they own. Setting it to 0 there makes the locked button part of the
     * lesson, and board 2 then earns the skill through Sunspot instead of being handed it.
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
    // Sunspot is DORMANT: she is the thing being protected, not a second unit to
    // command. One usable hero means the player cannot pick the wrong tool.
    // -----------------------------------------------------------------------------------
    {
        id: 'tut_1',
        title: 'Sân Trước',
        type: 'BATTLE',
        brief: 'Sunspot bất tỉnh. Giữ cô ấy sống.',
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
            squad: ['GREEN_SHADOW', 'SOLAR_FLARE'],
            placement: { SOLAR_FLARE: { x: 3, y: 2 }, GREEN_SHADOW: { x: 3, y: 3 } },
            dormant: ['SOLAR_FLARE'],
            // No Sun at all. The default 50 is exactly Precision Blast's price, so board 1
            // was quietly handing the player a pierce attack on turn 1 — on a board whose
            // whole design is "one hero, one free shot, nothing else to get wrong". The
            // greyed-out second button now teaches that Sun is a thing before board 2
            // teaches where it comes from.
            startingSun: 0,
            // D5, not D7. From three tiles out its intent is MOVE, and because the two
            // plants block row D it routes *around* them — so the first thing a new player
            // ever saw was a zombie ambling sideways with an amber arrow. Board 1's job is to
            // teach the red attack telegraph, and D5 is the only opening tile that produces
            // one: adjacent to Green Shadow, and closer to the brain than she is, which is
            // what makes the AI bite instead of walk past.
            opening: [{ cls: UnitClass.BASIC_ZOMBIE, x: 3, y: 4 }],
            waves: {
                // Turn 2 needs a target of its own. The opening zombie shares her row and has
                // 2 HP against her 2 damage, so it is dead on turn 1 and turn 2 had nothing
                // left to shoot — the "move, then attack" lesson pointed at empty grass.
                //
                // This one arrives one row ABOVE her. Pea Shot is a LINE attack, so range was
                // never the reason to move: alignment is. She has to step into row C before
                // the shot exists at all, which is the actual lesson.
                2: [{ cls: UnitClass.BASIC_ZOMBIE, x: 2, y: 6 }],
                3: [
                    { cls: UnitClass.BASIC_ZOMBIE, x: 2, y: 7 },
                    { cls: UnitClass.BASIC_ZOMBIE, x: 4, y: 7 },
                ],
            },
            objective: 'SURVIVE_TURNS',
            objectiveText: 'Sống sót 3 lượt.',
            bonuses: [
                // Reuses the existing NO_HERO_DOWN rule with tutorial copy and a bigger
                // payout — this 50 is what funds the shop on board 3.
                { type: 'NO_HERO_DOWN', description: 'Cứu Sunspot', coins: 50 },
                { type: 'NO_BRAIN_LOST', description: 'Không mất não nào', coins: 25 },
            ],
            // Board 1 is walked through one click at a time: the overlay blocks everything
            // except the single control named by `focus`, so there is no wrong move available.
            // The hand-holding thins out from board 2 onward.
            steps: [
                { phase: 'PLACEMENT', turn: 1, note: 'Đội hình đã xếp sẵn. Bấm Bắt Đầu Trận.', focus: 'start-battle' },
                { turn: 1, note: 'Đây là Shadeleaf. Bấm vào cô ấy.', focus: 'hero-GREEN_SHADOW' },
                { turn: 1, note: 'Chọn Bắn Đậu. Đòn thường luôn miễn phí.', focus: 'skill-gs_pea' },
                { turn: 1, note: 'Mũi tên đỏ: nó sắp cắn. Bắn nó trước.', focus: 'tile-3-4', act: 'ATTACK' },
                { turn: 1, note: 'Xong lượt. Bấm Kết Thúc Lượt.', focus: 'end-turn' },
                { turn: 2, note: 'Con mới ở hàng trên. Chọn cô ấy.', focus: 'hero-GREEN_SHADOW' },
                { turn: 2, note: 'Đậu bay thẳng hàng. Bước lên hàng của nó.', focus: 'tile-2-3', act: 'MOVE' },
                { turn: 2, note: 'Giờ mới bắn được. Chọn Bắn Đậu.', focus: 'skill-gs_pea' },
                { turn: 2, note: 'Bấm vào con zombie.', focus: 'tile-2-6', act: 'ATTACK' },
                // The kill deserves a beat before the button. "Kết thúc lượt." alone read
                // like the game hadn't noticed the player just did the thing it asked for.
                { turn: 2, note: 'Đẹp. Hạ gọn nó. Kết thúc lượt.', focus: 'end-turn' },

                // Turn 3 used to be "bạn tự chơi" — the one free stretch in the whole chain,
                // and the place a lost new player could still lose Sunspot. Scripted now:
                // she is already standing in row C from turn 2, so the row-C zombie is one
                // shot, and the row-E one measurably cannot reach the brain before the clock.
                { turn: 3, note: 'Đợt cuối: hai con. Chọn Shadeleaf.', focus: 'hero-GREEN_SHADOW' },
                { turn: 3, note: 'Bắn Đậu.', focus: 'skill-gs_pea' },
                { turn: 3, note: 'Bắn con hàng C.', focus: 'tile-2-7', act: 'ATTACK' },
                // The lesson Into the Breach players take years to internalise, said out
                // loud on board ONE: the objective is the clock, not the body count. A
                // note-only full stop so it cannot be clicked past without dismissing it.
                { turn: 3, note: 'Mục tiêu là SỐNG SÓT — không cần diệt sạch lũ zombie.' },
                { turn: 3, note: 'Con hàng E không kịp tới não. Kết thúc lượt.', focus: 'end-turn' },
            ],
        },
    },

    // -----------------------------------------------------------------------------------
    // 2. Brains, the spawn hole, Sun, the pierce skill — and the death that starts the arc.
    // -----------------------------------------------------------------------------------
    {
        id: 'tut_2',
        title: 'Cái Hố',
        // An ELITE node, not a plain battle. The map already draws these differently and pays
        // COIN_ELITE_BONUS for clearing one, so the step up in danger is something the player
        // can see coming on the map before they walk into it — which is the whole point of
        // having node types at all.
        type: 'ELITE',
        brief: 'Tinh nhuệ. Chúng dày hơn, và chúng biết đường tới não.',
        battle: {
            // ONE house, in Shadeleaf's own row — she IS the way to the brain, which is what
            // makes zombies bite her instead of strolling past (a replay of the real engine
            // proved the old two-house layout never killed her at all).
            //
            // The WATER strip behind her is the second fix from the same replay: with open
            // grass at her back she could walk three tiles out of the turn-4 kill box, so the
            // box needed four Bucketheads just to seal the exits. The river closes her escape
            // with terrain instead of bodies — and quietly introduces water itself, one board
            // before Ironhusk's shove can start drowning things in it.
            //
            // The lone 'S' at F3 is the spawn hole Sunspot spends the battle standing on.
            // Her four neighbours are the whole design: river at B4, and the turn-4 wave
            // fills the other three — a 2 HP Basic on C3 and a Buckethead on each of C5 and
            // D4. The two cans stand between her and the brain, so they BITE; the Basic is
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
            // the player alone with Sunspot — a 3 HP hero who deals no damage — against a
            // board still full of zombies. The lesson is the loss, not the mopping up.
            maxTurns: 4,
            squad: ['GREEN_SHADOW', 'SOLAR_FLARE'],
            placement: { GREEN_SHADOW: { x: 2, y: 3 }, SOLAR_FLARE: { x: 3, y: 2 } },
            // 25 banked, and Harvest pays 25. So Precision Blast (50) is exactly one harvest
            // away: unreachable on turn 1 however the player plays, and guaranteed by turn 3
            // if they follow the Sun lesson. That is what makes the lesson load-bearing
            // rather than a caption over something they already had.
            startingSun: 25,
            // One zombie, in HER row, walking at HER brain. Turn 1 is then a clean shot down
            // the lane with no move, which also pins her at C4 for the rest of the board —
            // and that is what lets turn 3's pierce lesson name a tile and still be right.
            //
            // Just one, because a second opener anywhere else reaches the house while the
            // script has her locked into the Sun lesson and unable to answer it. Measured:
            // every placement tried cost a brain on turn 3 or 4.
            opening: [
                { cls: UnitClass.BASIC_ZOMBIE, x: 2, y: 6 },
            ],
            waves: {
                // Two spawns: one AT THE HOLE Sunspot is standing on — blocked, 1 chip damage
                // to her, and the "plug the hole" lesson pays off on screen — and one at the
                // row's edge so Shadeleaf has a real target on the harvest turn. Without it
                // she spent turn 2 idle, and idle heroes are how players learn to waste
                // actions.
                2: [
                    { cls: UnitClass.BASIC_ZOMBIE, x: 5, y: 2 },
                    { cls: UnitClass.BASIC_ZOMBIE, x: 2, y: 7 },
                ],
                // Three Coneheads in ONE row, all inside Precision Blast's 4 tiles. 3 HP each
                // against 3 piercing damage: the skill the player just learned to afford kills
                // the entire wave in a single click. Basic Pea Shot would kill none of them.
                // Six at once — the elite spike. Two jobs in one wave, which is why they all
                // arrive together on turn 3 rather than one wave per turn: a wave that lands
                // on the LAST turn never acts at all (spawns are held still the turn they
                // appear), so the killers have to be on the board a full turn early.
                3: [
                    // The pierce row: 3 HP each, and Precision Blast's four tiles from C4 are
                    // exactly C5..C8, so one click removes the entire lane. Pea Shot would
                    // kill none of them — 2 damage against 3 health — which is the argument
                    // for Sun made in units rather than in words.
                    { cls: UnitClass.CONEHEAD, x: 2, y: 4 },
                    { cls: UnitClass.CONEHEAD, x: 2, y: 5 },
                    { cls: UnitClass.CONEHEAD, x: 2, y: 6 },
                    { cls: UnitClass.CONEHEAD, x: 2, y: 7 },
                    // The kill box, deliberately OFF row C so the pierce cannot thin it, and
                    // every tile 4+ from the house so no brain is in reach. The AI takes a
                    // brain over a plant whenever it can, which is exactly why the old box
                    // failed silently: its Coneheads strolled past her to the houses and she
                    // survived the board she was scripted to die on.
                    // Both cans reach BOTH of their posts (C5, D4) — whichever order the AI
                    // walks them in, greedy assignment fills the box; no tie can leave a post
                    // empty. Neither can reach any tile beside Sunspot. The Basic is FORCED
                    // onto C3: its only entrance is D3, C3 sits strictly nearest the brain
                    // (distance 2 beats every alternative), and the AI sorts by exactly that.
                    { cls: UnitClass.BUCKETHEAD, x: 1, y: 4, lethal: true, boxAt: { x: 2, y: 4 } },
                    { cls: UnitClass.BUCKETHEAD, x: 3, y: 5, lethal: true, boxAt: { x: 3, y: 3 } },
                    { cls: UnitClass.BASIC_ZOMBIE, x: 4, y: 2, lethal: true, boxAt: { x: 2, y: 2 } },
                ],
            },
            objective: 'SURVIVE_TURNS',
            objectiveText: 'Sống sót 4 lượt.',
            bonuses: [
                { type: 'NO_BRAIN_LOST', description: 'Không mất não nào', coins: 25 },
                { type: 'KILL_COUNT', description: 'Diệt 4 zombie', coins: 25, count: 4 },
            ],
            scriptedLoss: 'GREEN_SHADOW',
            // Hand-held all the way through, for one reason: turn 3 names the tile to fire
            // at, and that tile is only correct if Shadeleaf is still standing at C4. One
            // free turn anywhere before it and she could be three tiles away, aimed at
            // nothing. So every turn up to the lesson ends on Kết Thúc Lượt.
            steps: [
                // Without this the deploy screen is unguarded, and a player who drags
                // Shadeleaf off C4 invalidates every tile the rest of the script names.
                { phase: 'PLACEMENT', turn: 1, note: 'Đội hình giữ nguyên. Bấm Bắt Đầu Trận.', focus: 'start-battle' },
                // Every turn keeps BOTH heroes busy. The old script parked one of them each
                // turn, and an idle hero on a teaching board reads as "actions are optional"
                // — the exact habit that gets squads killed later.
                { turn: 1, note: 'Zombie trong hàng của bạn. Chọn Shadeleaf.', focus: 'hero-GREEN_SHADOW' },
                { turn: 1, note: 'Bắn Đậu.', focus: 'skill-gs_pea' },
                { turn: 1, note: 'Bắn nó. Đừng rời hàng C.', focus: 'tile-2-6', act: 'ATTACK' },
                // The claw marks the hole (telegraphed from turn 1). Standing on it blocks
                // the spawn — the dialogue promised this rule; here it happens on screen.
                { turn: 1, note: 'Cái hố dưới kia sắp phun zombie. Chọn Sunspot.', focus: 'hero-SOLAR_FLARE' },
                { turn: 1, note: 'Đứng đè lên miệng hố. Bịt lại.', focus: 'tile-5-2', act: 'MOVE' },
                { turn: 1, note: 'Kết thúc lượt.', focus: 'end-turn' },

                // --- the Sun lesson, standing on the plugged hole ---
                { turn: 2, note: 'Hố bị bịt — nó không chui lên nổi. Chọn Sunspot.', focus: 'hero-SOLAR_FLARE' },
                { turn: 2, note: 'Thu Hoạch cần ĐỨNG YÊN. Đứng chặn hố thì tiện luôn.', focus: 'skill-sf_harvest' },
                { turn: 2, note: 'Bấm vào chính cô ấy.', focus: 'tile-5-2', act: 'ATTACK' },
                { turn: 2, note: 'Con mới ngoài rìa. Chọn Shadeleaf.', focus: 'hero-GREEN_SHADOW' },
                { turn: 2, note: 'Bắn Đậu.', focus: 'skill-gs_pea' },
                { turn: 2, note: 'Bắn.', focus: 'tile-2-7', act: 'ATTACK' },
                { turn: 2, note: 'Đủ 50 Mặt Trời. Kết thúc lượt.', focus: 'end-turn' },

                // --- what the Sun was for. Sunspot is three moves away — the price of
                // plugging the hole — so she keeps harvesting where she stands. (And the
                // economy is load-bearing: starting at 25, even with this extra harvest she
                // holds only 25 on turn 4 — one Sun Burn short of blowing a wall off the
                // box that kills Shadeleaf.) ---
                { turn: 3, note: 'Sunspot quá xa, không về kịp — cứ gom nắng tiếp.', focus: 'hero-SOLAR_FLARE' },
                { turn: 3, note: 'Thu Hoạch.', focus: 'skill-sf_harvest' },
                { turn: 3, note: 'Bấm vào cô ấy.', focus: 'tile-5-2', act: 'ATTACK' },
                { turn: 3, note: 'Shadeleaf: "Đông quá. Tôi sẽ diệt nhiều nhất có thể."', focus: 'hero-GREEN_SHADOW' },
                { turn: 3, note: 'Bắn Chuẩn Xác: 50 Mặt Trời, xuyên thủng cả hàng.', focus: 'skill-gs_precision_blast' },
                { turn: 3, note: 'Bắn dọc hàng C. Cả bốn cùng chết.', focus: 'tile-2-5', act: 'ATTACK' },
                { turn: 3, note: 'Kết thúc lượt.', focus: 'end-turn' },

                // Turn 4 is hand-held down to the single button too, and that is the whole
                // point of it. The note says she cannot be saved; leaving the player free to
                // walk her three tiles away would make the note a lie — measurement showed a
                // retreat on this turn dodges the wave outright, because the bites resolve
                // against the tile she was standing on when the intents were set.
                // Her last stand is played, not narrated: one more kill, then the walls
                // close. The final step is a note with NO focus on purpose — after "Đã
                // hiểu" the overlay stands down and Sunspot's action belongs to the player,
                // because nothing she can do changes anything: 25 Sun is one Burn short,
                // the box is out of her reach, and the clock ends this turn.
                { turn: 4, note: 'Bị vây ba phía. Cô ấy không đầu hàng.', focus: 'hero-GREEN_SHADOW' },
                { turn: 4, note: 'Bắn Đậu.', focus: 'skill-gs_pea' },
                { turn: 4, note: 'Hạ nốt một con.', focus: 'tile-2-2', act: 'ATTACK' },
                { turn: 4, note: 'Quân địch quá đông. Sunspot làm gì cũng không kịp. Thử đi.' },
            ],
        },
    },

    // -----------------------------------------------------------------------------------
    // 3. Coin. Stock is pinned to the two cheapest plants: a random Snow Pea at 175 would
    // eat the whole purse and strand the player before the revive on board 5.
    // -----------------------------------------------------------------------------------
    {
        id: 'tut_3',
        title: 'Xe Hàng',
        type: 'SHOP',
        brief: 'Mất một hero. Mua đồ thay thế.',
        shopOffers: ['MAT_PEASHOOTER', 'MAT_PEASHOOTER'],
        // ONE item, the cheapest. Enough to teach that the second shelf exists and is paid
        // for in Coin, without putting the revive at risk — the full shelf is 350 Coin.
        itemOffers: ['potato_mine'],
        // Both offers are the same plant now, so buy order no longer matters: board 4
        // auto-deploys `bench[0]` into the dead hero's slot, and whichever Peashooter that
        // is, an identical one is left for board 6's fusion. The second offer used to be a
        // Wall-nut, and buying out of order left the campfire step pointing at a plant that
        // had already taken the field.
        steps: [
            { phase: 'SHOP', turn: 1, note: 'Chỗ trống của Shadeleaf cần người. Mua Xạ Thủ Đậu.', focus: 'shop-plant-MAT_PEASHOOTER' },
            { phase: 'SHOP', turn: 1, note: 'Ghế dự bị chứa hai. Mua thêm một Xạ Thủ nữa.', focus: 'shop-plant-MAT_PEASHOOTER' },
            { phase: 'SHOP', turn: 1, note: 'Kệ dưới là vật phẩm dùng một lần. Mua Mìn.', focus: 'shop-item-potato_mine' },
            { phase: 'SHOP', turn: 1, note: 'Xong. Giữ số Xu còn lại — bạn sẽ cần.', focus: 'shop-leave' },
        ],
    },

    // -----------------------------------------------------------------------------------
    // 4. Push, the bench plant taking the field, and a brain that genuinely cannot be saved.
    //
    // THREE zombies converge on the lower house, not one. With a single attacker down there
    // the board read as a rescue the squad simply refused to attempt — the player could see
    // a free shot and watched the plants ignore it. Three attackers is a front, and the
    // squad spends all three turns holding the other one. Every plant acts on every turn;
    // that is measured, not assumed (see the idle assertion below).
    // -----------------------------------------------------------------------------------
    {
        id: 'tut_4',
        title: 'Hai Căn Nhà',
        type: 'BATTLE',
        brief: 'Ba con dồn vào nhà dưới. Không giữ nổi.',
        battle: {
            // The '#' at A1 is what makes the mine lesson DETERMINISTIC: the Buckethead gets
            // shoved from B2 up to A2, and with A1 walled the only route back to house B1 is
            // through B2 — the exact tile the player just mined. Without that wall the
            // pathfinder could come home via A1 and stroll past the trap.
            // The pond at C5 is the second determinism wall: without it the row-D zombie's
            // path search found a tile beside SUNSPOT at the same brain-distance as the tile
            // beside the Peashooter, and the replay showed it taking the wrong one — biting
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
            maxTurns: 3,
            // GREEN_SHADOW is listed even though she is dead. That is the point: her slot is
            // what the bench Peashooter fills. Leave her out and no slot opens, the bought
            // plant stays on the bench, and board 4 teaches nothing about backups — which is
            // exactly what it did until assertTutorial started checking for it.
            squad: ['WALL_KNIGHT', 'SOLAR_FLARE', 'GREEN_SHADOW'],
            placement: {
                WALL_KNIGHT: { x: 1, y: 2 },
                SOLAR_FLARE: { x: 2, y: 3 },
                GREEN_SHADOW: { x: 4, y: 2 },
            },
            // 75 Sun, not 50: Sunspot burns on turn 1 and again on turn 3, with a harvest
            // between. One burn left her with two turns of nothing to do but watch.
            startingSun: 75,
            opening: [
                // IRONHUSK's: 4 HP, so his 1 damage cannot kill it — shove it onto the mine.
                { cls: UnitClass.BUCKETHEAD, x: 1, y: 1 },
                // THE EATER, and the whole story of this board. The squad does NOT write the
                // lower house off — turn 1 pours everything that can reach this zombie into
                // it: pea 2 + Sun Burn 4, both plants' entire turn, said out loud in the
                // step notes. 6 of 10. It walks onto the house anyway, and the brain-loss
                // lesson lands as "we tried with everything and the arithmetic said no",
                // never "the squad stood and watched".
                //
                // 10 HP is measured, not chosen. A Pea Shot is a LINE in all four directions
                // with range 8, so as a 2 HP basic this thing died to one sidestep and the
                // 'unsavable' premise was a lie the player could see through in one click.
                // The squad's absolute best turn-1 burst on this tile is 9 — counting even a
                // hero who is dead — and the unsavable assertion re-derives that ceiling
                // from hero data on every build.
                { cls: UnitClass.SCREEN_DOOR_ZOMBIE, x: 5, y: 1, hpBonus: 5, unsavable: true },
                // SUNSPOT's turn-3 target, and no longer mere bookkeeping: a GRAVE digs up
                // a Basic Zombie every GRAVE_DIG_PERIOD turns (turnManager), telegraphed on
                // the unit as a countdown. Its clock strikes at the end of turn 3 — the
                // exact turn the script has her burn it, so the lesson is a deadline met
                // with one turn's margin, watched ticking down the whole board.
                { cls: UnitClass.GRAVE, x: 2, y: 5 },
                // The Peashooter's turn-2 kill, marching down row D at the upper flank.
                { cls: UnitClass.BASIC_ZOMBIE, x: 3, y: 6 },
                // The second lower-house attacker. It arrives too late to help the eater;
                // once the brain is gone it turns for the LAST house, and turn 3 is the
                // squad closing ranks around B1 and finishing the fight.
                { cls: UnitClass.CONEHEAD, x: 5, y: 4 },
            ],
            objective: 'KILL_ALL',
            objectiveText: 'Diệt sạch lũ zombie.',
            bonuses: [
                { type: 'KILL_COUNT', description: 'Diệt 2 zombie', coins: 25, count: 2 },
                { type: 'NO_HERO_DOWN', description: 'Không mất hero nào', coins: 25 },
            ],
            steps: [
                { phase: 'PLACEMENT', turn: 1, note: 'Cây dự bị đã đứng vào chỗ Shadeleaf. Bắt Đầu Trận.', focus: 'start-battle' },

                // --- turn 1: hold the top door, and POUR everything into the bottom one ---
                { turn: 1, note: 'Hai nhà bị đánh cùng lúc. Chia nhau ra!' },
                { turn: 1, note: 'Đội xô 4 máu — đập không chết. Chọn Ironhusk.', focus: 'hero-WALL_KNIGHT' },
                { turn: 1, note: 'Đứng DƯỚI nó — cú đẩy văng theo hướng từ bạn ra.', focus: 'tile-2-1', act: 'MOVE' },
                { turn: 1, note: 'Đập Khiên.', focus: 'skill-wk_bash' },
                { turn: 1, note: 'Hất nó văng khỏi cửa nhà.', focus: 'tile-1-1', act: 'ATTACK' },
                { turn: 1, note: 'Gài Mìn Khoai Tây vào lối về của nó.', focus: 'item-potato_mine' },
                { turn: 1, note: 'Đặt vào đúng ô nó vừa bị hất khỏi.', focus: 'tile-1-1', act: 'ITEM' },
                { turn: 1, note: 'Nhà dưới: Cửa Lưới 10 máu. Xạ Thủ, bắn nó!', focus: 'unit-MAT_PEASHOOTER' },
                { turn: 1, note: 'Xuống hàng F cho thẳng đường đạn.', focus: 'tile-5-2', act: 'MOVE' },
                { turn: 1, note: 'Bắn Đậu.', focus: 'skill-pea_shot' },
                { turn: 1, note: 'Bắn! Mới trầy da nó.', focus: 'tile-5-1', act: 'ATTACK' },
                { turn: 1, note: 'Sunspot, dồn nốt. Chọn cô ấy.', focus: 'hero-SOLAR_FLARE' },
                { turn: 1, note: 'Tiến sát cho đủ tầm.', focus: 'tile-4-3', act: 'MOVE' },
                { turn: 1, note: 'Thiêu Đốt — dồn cả 50 Mặt Trời.', focus: 'skill-sf_sunburn' },
                { turn: 1, note: 'Nướng nó!', focus: 'tile-5-1', act: 'ATTACK' },
                { turn: 1, note: 'Cả đội dồn 6 máu — nó còn 4. Kết thúc lượt.', focus: 'end-turn' },

                // --- turn 2: the arithmetic says no. Say it, then hold the second front ---
                { turn: 2, note: 'Nó đứng ngay cửa. Bắn nữa cũng thiếu 2 máu.' },
                { turn: 2, note: 'Não mất là mất VĨNH VIỄN. Hết 5 quả: thua cả run.' },
                { turn: 2, note: 'Đừng chết chùm theo nhà dưới. Chọn Xạ Thủ.', focus: 'unit-MAT_PEASHOOTER' },
                { turn: 2, note: 'Né cú cắn — về hàng D chặn địch.', focus: 'tile-3-2', act: 'MOVE' },
                { turn: 2, note: 'Bắn Đậu.', focus: 'skill-pea_shot' },
                { turn: 2, note: 'Hạ con hàng D.', focus: 'tile-3-3', act: 'ATTACK' },
                { turn: 2, note: 'Ironhusk lui về trấn giữa sân. Chọn anh ấy.', focus: 'hero-WALL_KNIGHT' },
                { turn: 2, note: 'Đứng đây — mai chặn được cả hai lối.', focus: 'tile-3-1', act: 'MOVE' },
                { turn: 2, note: 'Sunspot gom nắng cho đòn cuối. Chọn cô ấy.', focus: 'hero-SOLAR_FLARE' },
                { turn: 2, note: 'Thu Hoạch.', focus: 'skill-sf_harvest' },
                { turn: 2, note: 'Bấm vào cô ấy.', focus: 'tile-4-3', act: 'ATTACK' },
                { turn: 2, note: 'Hết cách với nhà dưới. Kết thúc lượt.', focus: 'end-turn' },

                // --- turn 3: the loss lands, the fight is still winnable — finish it.
                // The Conehead walks to E2, straight into Ironhusk: his bash chips it and
                // SHOVES it to F2, into the Peashooter's row — the push taught on turn 1 as
                // defence comes back one board later as a set-up. Every tile is replay-measured.
                { turn: 3, note: 'Mất một não... nhưng trận CHƯA thua. Diệt sạch.' },
                { turn: 3, note: 'Con Đội Nón tới sát. Ironhusk chặn nó.', focus: 'hero-WALL_KNIGHT' },
                { turn: 3, note: 'Đập Khiên.', focus: 'skill-wk_bash' },
                { turn: 3, note: 'Đập — và hất nó vào làn đạn.', focus: 'tile-4-1', act: 'ATTACK' },
                { turn: 3, note: 'Nó nằm thẳng hàng F rồi. Chọn Xạ Thủ.', focus: 'unit-MAT_PEASHOOTER' },
                { turn: 3, note: 'Xuống hàng F.', focus: 'tile-5-2', act: 'MOVE' },
                { turn: 3, note: 'Bắn Đậu.', focus: 'skill-pea_shot' },
                { turn: 3, note: 'Dứt điểm.', focus: 'tile-5-1', act: 'ATTACK' },
                { turn: 3, note: 'Nấm mồ sắp trồi zombie! Sunspot, đốt ngay.', focus: 'hero-SOLAR_FLARE' },
                { turn: 3, note: 'Tiến lên cho đủ tầm.', focus: 'tile-3-4', act: 'MOVE' },
                { turn: 3, note: 'Thiêu Đốt.', focus: 'skill-sf_sunburn' },
                { turn: 3, note: 'Đốt — trước khi nó kịp trồi lên.', focus: 'tile-2-5', act: 'ATTACK' },
                { turn: 3, note: 'Xong. Nhà trên vẫn còn não.', focus: 'end-turn' },
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
        brief: 'Có người đang đợi ở khúc quanh.',
        eventId: 'tut_revive',
        // Two clicks, because reviving is two decisions: take the offer, then choose who.
        // Walking on is a real option in a real run, but not on the board that exists to
        // teach what the offer IS — and the arc needs her back for the boss.
        steps: [
            { phase: 'EVENT', turn: 1, note: 'Sự kiện: chọn một, và gánh hậu quả. Chọn Hồi Sinh.', focus: 'event-option-0' },
            { phase: 'EVENT', turn: 1, note: 'Giờ chọn ai quay lại. Shadeleaf.', focus: 'event-hero-GREEN_SHADOW' },
        ],
    },

    // -----------------------------------------------------------------------------------
    // 6. The rest point — and the only place in the game where fusion happens.
    // -----------------------------------------------------------------------------------
    {
        id: 'tut_6',
        title: 'Lửa Trại',
        type: 'CAMPFIRE',
        brief: 'Chỗ duy nhất ghép được cây.',
        eventId: 'rest_site',
        // Two Peashooters were bought on board 3 and they end up doing different jobs: the
        // first was consumed on board 4 filling Shadeleaf's slot (deploying a bench plant
        // strikes it off the bench — see `benchDeployedRef`), the second is still here. That
        // is the lesson the bench has been teaching for three boards — a bought plant is
        // EITHER a backup or fusion material, never both — and the same plant twice makes it
        // impossible to miss.
        //
        // The recipient is Shadeleaf, revived on board 5. Pairing her with a Peashooter is
        // the Repeater: her basic shot simply fires twice. That visibility is the point —
        // the previous version fused armour onto Sunspot, and a new player has no way to see
        // that anything happened at all.
        steps: [
            { phase: 'CAMPFIRE', turn: 1, note: 'Điểm nghỉ. Chỉ ở đây mới ghép cây được.', focus: 'campfire-fuse' },
            // Shadeleaf, revived on board 5. This used to have to be Sunspot: a revive only
            // QUEUES a hero, and the fusion panel was fed the live units, so a queued hero
            // had no card and the overlay stalled pointing at nothing. The panel now takes
            // `fusableHeroes()`, which includes pending revives, so the hero the player just
            // paid to bring back is the hero they can fuse.
            { phase: 'CAMPFIRE', turn: 1, note: 'Chọn hero sẽ nhận đặc tính. Shadeleaf — cô vừa được hồi sinh.', focus: 'fusion-hero-GREEN_SHADOW' },
            { phase: 'CAMPFIRE', turn: 1, note: 'Xạ Thủ còn lại trên ghế. Cùng loại cây, hai công dụng khác nhau.', focus: 'fusion-plant-MAT_PEASHOOTER' },
            { phase: 'CAMPFIRE', turn: 1, note: 'Ghép. Vĩnh viễn — từ giờ đòn bắn thường của cô nổ hai phát.', focus: 'fusion-confirm' },
            // No rest-option step: at the campfire, fusing IS the visit's one choice —
            // closing the bench after a fuse resolves the event (App.closeFusionPanel),
            // so after fusion-confirm the screen changes on its own. A step pointing at a
            // rest option here would wait for a screen that has already left.
        ],
    },

    // -----------------------------------------------------------------------------------
    // 7. Gargantuar, and the lesson that losing is part of the loop.
    // 20 HP behind a rolling escort is arithmetically out of reach for the squad even with
    // the Repeater fusion in hand — the max-burst assertion below re-derives the exact
    // ceiling from hero data every build and fails the moment the defeat stops being real.
    // -----------------------------------------------------------------------------------
    {
        id: 'tut_7',
        title: 'Kẻ Khổng Lồ',
        type: 'BOSS',
        brief: 'Cái này không đánh thắng được. Cứ đánh.',
        battle: {
            // Three brains, and a boss that CANNOT wander. Row D is a walled corridor
            // (the '^' rubble either side of house D1), so the route to the last brain runs
            // through Shadeleaf and nowhere else. That is the whole reason the script works:
            // with an open board the pathfinder detoured around her on turn 1 and every
            // scripted tile after it pointed at empty grass.
            //
            // The clock: A1 falls turn 2, G1 turn 3, and on turn 3 the boss smashes
            // Shadeleaf, walks over her, and takes D1 itself on turn 4. Every tool the squad
            // owns has been spent by then and the thing is still standing — a loss by being
            // devoured, not by running out of turns.
            // The two side houses sit in rows A and G, NOT B and F, and that gap is load-
            // bearing. Shadeleaf stands in row D between the boss and house D1, which adds
            // two tiles to that path; with the side houses only one row out, D1 tied with
            // them and the boss wandered off down another lane, leaving every scripted shot
            // pointing at empty grass. Three rows out, D1 stays strictly the shortest walk
            // and the boss never leaves Shadeleaf's line.
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
            squad: ['GREEN_SHADOW', 'WALL_KNIGHT', 'SOLAR_FLARE'],
            placement: {
                // ROW D IS SHADELEAF'S LANE AND NOBODY ELSE STANDS IN IT.
                //
                // A LINE shot is stopped by any body in the way, ALLY INCLUDED. Ironhusk
                // used to start at D3, directly between her and the boss, so every scripted
                // "shoot down row D" step pointed at a tile the game would not accept — the
                // tutorial locked up on turn 1 and the player could not proceed. (My first
                // simulation missed it by only counting enemies as blockers.)
                //
                // Ironhusk now works from row C and Sunspot from row E: he can still reach
                // the boss diagonally-adjacent to bash it, she is still inside Sun Burn's
                // three tiles, and her line stays clear all three turns.
                GREEN_SHADOW: { x: 3, y: 1 },
                WALL_KNIGHT: { x: 2, y: 2 },
                SOLAR_FLARE: { x: 4, y: 2 },
            },
            opening: [
                { cls: UnitClass.GARGANTUAR, x: 3, y: 5, hpBonus: 4 },
                // The side eaters, in lanes no hero can cover: A1 falls on turn 2, G1 on
                // turn 3. Nobody is sent at D1 — that house must keep its brain to the very
                // end, because D1 is the only thing keeping the boss walking down ROW D.
                // The one turn D1 went dark early, the boss retargeted mid-fight and every
                // scripted shot after it named a tile it no longer stood on.
                { cls: UnitClass.BASIC_ZOMBIE, x: 0, y: 1 },
                { cls: UnitClass.BASIC_ZOMBIE, x: 6, y: 5 },
            ],
            waves: {
                // Pressure, not participants: they arrive too far away to land a hit before
                // the end, but the board visibly fills while the squad empties its pockets.
                2: [
                    { cls: UnitClass.CONEHEAD, x: 1, y: 6 },
                    { cls: UnitClass.BUCKETHEAD, x: 5, y: 7 },
                    { cls: UnitClass.BASIC_ZOMBIE, x: 0, y: 5 },
                    { cls: UnitClass.CONEHEAD, x: 6, y: 7 },
                ],
                3: [
                    { cls: UnitClass.CONEHEAD, x: 0, y: 7 },
                    { cls: UnitClass.BUCKETHEAD, x: 1, y: 7 },
                    { cls: UnitClass.CONEHEAD, x: 6, y: 4 },
                ],
            },
            objective: 'KILL_ALL',
            objectiveText: 'Diệt sạch. (Bạn sẽ không kịp.)',
            bonuses: [
                { type: 'KILL_COUNT', description: 'Diệt 2 zombie', coins: 25, count: 2 },
            ],
            scriptedDefeat: true,
            // Every turn spends every hero, and the ledger is the lesson: pea 2 + blast 3 +
            // pea 2 from Shadeleaf, two shield bashes, a 4-damage Sun Burn — 13 into a
            // 16 HP boss. Measured, so the defeat can never be mistaken for a misplay.
            steps: [
                { phase: 'PLACEMENT', turn: 1, note: 'Đội hình đã vào vị trí. Bắt Đầu Trận.', focus: 'start-battle' },

                { turn: 1, note: 'Nó đang đi thẳng hàng D vào nhà. Chọn Shadeleaf.', focus: 'hero-GREEN_SHADOW' },
                { turn: 1, note: 'Bắn Đậu.', focus: 'skill-gs_pea' },
                { turn: 1, note: 'Bắn từ xa. 20 máu — cứ bào dần.', focus: 'tile-3-5', act: 'ATTACK' },
                { turn: 1, note: 'Ironhusk lên làm MỒI NHỬ. Chọn anh ấy.', focus: 'hero-WALL_KNIGHT' },
                { turn: 1, note: 'Đi hàng C — hàng D là làn đạn của Shadeleaf.', focus: 'tile-2-4', act: 'MOVE' },
                { turn: 1, note: 'Sunspot gom nắng cho hai đòn lớn.', focus: 'hero-SOLAR_FLARE' },
                { turn: 1, note: 'Thu Hoạch.', focus: 'skill-sf_harvest' },
                { turn: 1, note: 'Bấm vào cô ấy.', focus: 'tile-4-2', act: 'ATTACK' },
                { turn: 1, note: 'Kết thúc lượt.', focus: 'end-turn' },

                // Turn 2: the boss has closed to D5 and Ironhusk is already standing beside
                // it, so he swings without moving. Every tile named here is measured against
                // the boss's real march down the corridor — D6, D5, D3 — not guessed.
                { turn: 2, note: 'Nó đã kề bên Ironhusk. Chọn anh ấy.', focus: 'hero-WALL_KNIGHT' },
                { turn: 2, note: 'Đập Khiên.', focus: 'skill-wk_bash' },
                { turn: 2, note: 'Đập vào sườn nó.', focus: 'tile-3-4', act: 'ATTACK' },
                { turn: 2, note: 'Nó quá to — không đẩy lùi nổi. Chỉ trầy vỏ.' },
                { turn: 2, note: 'Hai nhà sắp mất, không cứu kịp. Chọn Shadeleaf.', focus: 'hero-GREEN_SHADOW' },
                { turn: 2, note: 'Bắn Chuẩn Xác.', focus: 'skill-gs_precision_blast' },
                { turn: 2, note: 'Dồn 50 Mặt Trời vào nó.', focus: 'tile-3-4', act: 'ATTACK' },
                { turn: 2, note: 'Sunspot: gom thêm.', focus: 'hero-SOLAR_FLARE' },
                { turn: 2, note: 'Thu Hoạch.', focus: 'skill-sf_harvest' },
                { turn: 2, note: 'Lần nữa.', focus: 'tile-4-2', act: 'ATTACK' },
                { turn: 2, note: 'Kết thúc lượt.', focus: 'end-turn' },

                // Turn 3 is the whole arsenal into one tile. The boss walks two columns a
                // turn straight down row D — D8, D6, D4 — so every tile below is measured,
                // not guessed, and all three heroes can name the same square.
                { turn: 3, note: 'Nó đã vào giữa sân. Dốc hết. Chọn Ironhusk.', focus: 'hero-WALL_KNIGHT' },
                { turn: 3, note: 'Bám theo bằng hàng C.', focus: 'tile-2-2', act: 'MOVE' },
                { turn: 3, note: 'Đập Khiên.', focus: 'skill-wk_bash' },
                { turn: 3, note: 'Đập.', focus: 'tile-3-2', act: 'ATTACK' },
                { turn: 3, note: 'Đòn cuối của Sunspot. Chọn cô ấy.', focus: 'hero-SOLAR_FLARE' },
                { turn: 3, note: 'Thiêu Đốt — 50 Mặt Trời.', focus: 'skill-sf_sunburn' },
                { turn: 3, note: 'Nướng nó.', focus: 'tile-3-2', act: 'ATTACK' },
                { turn: 3, note: 'Shadeleaf, nốt đi. Chọn cô ấy.', focus: 'hero-GREEN_SHADOW' },
                { turn: 3, note: 'Bắn Đậu.', focus: 'skill-gs_pea' },
                { turn: 3, note: 'Mọi thứ đã dốc hết. Nó vẫn đứng đó.', focus: 'tile-3-2', act: 'ATTACK' },
                { turn: 3, note: 'Não sắp bị ăn sạch. Thua là hết run.', focus: 'end-turn' },

                // Nothing left to spend: no Sun, no Shadeleaf, and the boss is standing on
                // the last house. The final step exists so the player is never left guessing
                // what to click while the run ends.
                { turn: 4, note: 'Hết Mặt Trời, hết cách. Xem nó lấy quả não cuối.', focus: 'end-turn' },
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
