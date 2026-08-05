import { Unit, UnitClass } from '../types';

// All game art is stored LOCALLY in `public/img/` and referenced by absolute path
// (`/img/<name>.<ext>`) — Vite serves `public/` at the site root.
//
// Why local instead of hotlinking: these images used to be hotlinked from
// static.wikia.nocookie.net (plus two other CDNs). That was fragile — corporate /
// MITM proxies block wiki hosts (plantsvszombies.wiki.gg and pvzfusion.wiki.gg were
// already blocked outright, and a proxy once broke 19 of 40 icons on a live machine),
// so the art silently vanished. Downloading the assets makes the game render offline
// and immune to whatever the network decides to block next.
//
// PLACEHOLDER ART: every entry under `/img/placeholder/` is a generated token, not final
// art. They replaced 30 images taken from the Plants vs. Zombies wiki. Keeping those made
// the rename of the game and its whole cast pointless — the artwork was still the original
// IP — and they clashed on the board with the cut-out chibi sprites the zombies use.
//
// Regenerate them with `node art-src/make_plant_placeholders.mjs`. To retire one, drop the
// real file into `public/img/` and repoint its entry below; nothing else needs to change,
// so the art can be replaced one unit at a time.
//
// To add art: save it under `public/img/` using the ICONS key lowercased in kebab-case
// (`SNOW_PEA` -> `snow-pea`), with the `hero-` prefix for HERO_ICONS entries. These files
// are game assets and ARE committed.

// Hero art, used for the 3-hero squad. The `.jpg` files are original AI-generated
// tactical hero cards (full card: HUD frame + hex diorama base), replacing the old
// PvZ Heroes portraits (`hero-*.webp`, kept on disk as fallbacks). Transparent-background
// sprite versions for the board are planned; until then the card art is used everywhere.
// hero-captain-combustible.webp is kept for when Captain Combustible returns as an unlockable.
export const HERO_ICONS = {
    GREEN_SHADOW: `/img/hero-green-shadow.jpg`,
    WALL_KNIGHT: `/img/hero-wall-knight.jpg`,
    SOLAR_FLARE: `/img/hero-solar-flare.jpg`,
    CHOMPZILLA: `/img/hero-chompzilla.jpg`,
    KERNEL_PULT: `/img/hero-cobb.jpg`,
    // The four heroes that finish the roster of nine. These four were rendered on white and
    // cut out (art-src/make_sprites.py), so there is no separate card art for them — both
    // this table and HERO_SPRITES point at the same cut-out, which is what the two 32-48px
    // codex thumbnails want anyway.
    THORNQUILL: `/img/sprite-thornquill.png`,
    THORNHIDE: `/img/sprite-thornhide.png`,
    CHARDWALL: `/img/sprite-chardwall.png`,
    GOURDWARD: `/img/sprite-gourdward.png`,
};

// Transparent-background board sprites (512x512 PNG, normalized: shared baseline and scale).
// Generated from the card art, cut out and aligned by scratchpad/make_sprites.py-style processing.
export const HERO_SPRITES = {
    GREEN_SHADOW: `/img/sprite-green-shadow.png`,
    WALL_KNIGHT: `/img/sprite-wall-knight.png`,
    SOLAR_FLARE: `/img/sprite-solar-flare.png`,
    CHOMPZILLA: `/img/sprite-chompzilla.png`,
    KERNEL_PULT: `/img/sprite-cobb.png`,
    THORNQUILL: `/img/sprite-thornquill.png`,
    THORNHIDE: `/img/sprite-thornhide.png`,
    CHARDWALL: `/img/sprite-chardwall.png`,
    GOURDWARD: `/img/sprite-gourdward.png`,
};

// Fusion-material art: bio-mech "gear" walkers (single-purpose war machines with a small
// plant core piloting them). Used by MATERIAL_DEFINITIONS only — the plain plant classes in
// ICONS below stay untouched because plants.ts shares them.
export const MATERIAL_SPRITES = {
    MAT_PEASHOOTER: `/img/gear-peashooter.png`,
    MAT_SUNFLOWER: `/img/gear-sunflower.png`,
    MAT_WALLNUT: `/img/gear-wallnut.png`,
    MAT_CHOMPER: `/img/gear-chomper.png`,
    MAT_SNOW_PEA: `/img/gear-snow-pea.png`,
    MAT_CORN: `/img/gear-corn.png`,
    // The four gears belonging to the four new heroes.
    MAT_CACTUS: `/img/gear-cactus.png`,
    MAT_ENDURIAN: `/img/gear-endurian.png`,
    MAT_CHARD: `/img/gear-chard.png`,
    MAT_PUMPKIN: `/img/gear-pumpkin.png`,
};

// Combat-item icons: handheld bio-mech consumables (pins, triggers, rip-cords), centered
// in-frame like inventory icons. data/items.ts points here.
export const ITEM_SPRITES = {
    POTATO_MINE: `/img/item-potato-mine.png`,
    CHERRY_BOMB: `/img/item-cherry-bomb.png`,
    JALAPENO: `/img/item-jalapeno.png`,
    SNOW_PEA: `/img/item-snow-pea.png`,
    COFFEE_BEAN: `/img/item-coffee-bean.png`,
    BLOVER: `/img/item-blover.png`,
};

// Neon accent per hero — mirrors the accent color baked into each hero's card art.
// Shared by every screen that showcases a hero (squad select, fusion bench, ...).
export const HERO_ACCENTS: Record<string, string> = {
    GREEN_SHADOW: '#4ade80',
    WALL_KNIGHT: '#f59e0b',
    SOLAR_FLARE: '#fb923c',
    CHOMPZILLA: '#d946ef',
    KERNEL_PULT: '#eab308',
    THORNQUILL: '#22c55e',   // cactus green
    THORNHIDE: '#b45309',    // durian husk
    CHARDWALL: '#ef4444',    // chard stem red
    GOURDWARD: '#f97316',    // pumpkin orange
};

// Plant / zombie art. ROCK and GRAVE used to be inline SVG data URIs written by hand here —
// two rectangles that predated the token set and looked it, sitting on the board beside art
// made to a different brief. They are generated tokens now like everything else.
/**
 * Sprites drawn facing RIGHT, which every renderer has to mirror.
 *
 * EMPTY, and that is the correct state: the whole zombie set marches leftward toward the lawn
 * and is now drawn that way, Gargantuar included — his art was redrawn facing left, so the
 * mirror that used to correct him would now be the thing turning him around.
 *
 * The table stays because the fix belongs in ONE place. When it lived inline in the board
 * component, the campaign screen kept showing him walking away from the heroes he is fighting;
 * two renderers read this now, so the next sprite that arrives facing the wrong way is one
 * entry here rather than a bug hunt across the screens that draw it.
 */
export const SPRITES_FACING_RIGHT: ReadonlySet<UnitClass> = new Set<UnitClass>([]);

/** CSS transform fragment that turns a right-facing sprite around, or '' for the rest. */
export const facingFlip = (cls: UnitClass | undefined): string =>
    cls && SPRITES_FACING_RIGHT.has(cls) ? ' scaleX(-1)' : '';

/**
 * SECOND STATES — a unit whose art changes when its rules change.
 *
 * Three bosses already switch behaviour mid-fight, and until now all three did it invisibly:
 * the board kept drawing the same picture while the thing in front of the player quietly
 * became a different problem. In a game that promises perfect information, a phase the player
 * can only discover by being surprised is the promise broken.
 *
 * Each predicate is written to fire on EXACTLY the condition the behaviour reads, so the art
 * and the rule flip on the same tick — a sprite that changed a turn early would be worse than
 * no sprite change at all, because the player would trust it.
 *
 * This is a pure lookup over the unit's own fields. It deliberately does NOT live in
 * `utils/bossBehaviours.ts`: the renderer asking "what does this look like right now" must not
 * be able to disturb the simulation, and the boss table must not grow a second reason to exist.
 */
interface SpriteVariant {
    when: (u: Unit) => boolean;
    src: string;
    /** Why this state exists, for whoever reads the board and wonders. */
    note: string;
}

export const SPRITE_VARIANTS: Partial<Record<UnitClass, SpriteVariant[]>> = {
    // Underground. `isBurrowed` is set while it is travelling to wherever it will surface,
    // and a mound of heaving earth is the only warning the player gets.
    [UnitClass.SANDREAVER]: [{
        when: u => !!u.isBurrowed,
        src: `/img/sprite-sandreaver-mound.png`,
        note: 'burrowed — the tile it will erupt from',
    }],

    // Shot out of the sky. Mirrors `armadaWrecked` in utils/bossBehaviours.ts: the moment it
    // stops flying it stops being a flier for every rule too — it can be pushed, it can drown,
    // and a melee wall finally means something to it.
    [UnitClass.ARMADA]: [{
        when: u => u.movementType !== 'FLYING',
        src: `/img/sprite-armada-wreck.png`,
        note: 'grounded — no longer a flier for any rule',
    }],

    // The imp on its back is the tell. It is NOT "has thrown its imp" — the Gargantuar throws
    // imps repeatedly and nothing tracks a count — it is the shared boss phase line,
    // `hp <= floor(maxHp / 2)`, which is the moment its throw range drops from 4 to 2.
    // Losing the passenger is the most readable way to say "this thing changed".
    [UnitClass.GARGANTUAR]: [{
        when: u => u.hp <= Math.floor(u.maxHp / 2),
        src: `/img/sprite-gargantuar-wounded.png`,
        note: 'below half health — throw range 4 -> 2',
    }],
};

/**
 * The art a unit should be drawn with RIGHT NOW. First matching variant wins; otherwise the
 * unit keeps whatever `imgUrl` its definition gave it.
 */
export const spriteFor = (unit: Unit): string => {
    const variants = SPRITE_VARIANTS[unit.class];
    if (variants) {
        for (const v of variants) if (v.when(unit)) return v.src;
    }
    return unit.imgUrl;
};

export const ICONS = {
    PEASHOOTER: `/img/placeholder/peashooter.svg`,
    SNOW_PEA: `/img/placeholder/snow-pea.svg`,
    REPEATER: `/img/placeholder/repeater.svg`,
    BLOOMERANG: `/img/placeholder/bloomerang.svg`,
    CACTUS: `/img/placeholder/cactus.svg`,
    MELON_PULT: `/img/placeholder/melon-pult.svg`,
    CABBAGE_PULT: `/img/placeholder/cabbage-pult.svg`,
    KERNEL_PULT: `/img/placeholder/kernel-pult.svg`,
    MAGNET_SHROOM: `/img/placeholder/magnet-shroom.svg`,
    SUN_SHROOM: `/img/placeholder/sun-shroom.svg`,
    SCAREDY_SHROOM: `/img/placeholder/scaredy-shroom.svg`,
    WALLNUT: `/img/placeholder/wallnut.svg`,
    // Borrowed art on purpose: a crate reads as a nut-shaped lump at board scale, and a
    // wrong-but-legible placeholder beats a missing image. One line to swap when the
    // crate sprite lands (art-src/ART-PROMPTS.md).
    GEAR_CRATE: `/img/placeholder/wallnut.svg`,
    TALL_NUT: `/img/placeholder/tall-nut.svg`,
    ENDURIAN: `/img/placeholder/endurian.svg`,
    SWEET_POTATO: `/img/placeholder/sweet-potato.svg`,
    IRON_NUT: `/img/placeholder/iron-nut.svg`,
    PUMPKIN: `/img/placeholder/pumpkin.svg`,
    CHARD_GUARD: `/img/placeholder/chard-guard.svg`,
    CHOMPER: `/img/placeholder/chomper.svg`,
    BONK_CHOY: `/img/placeholder/bonk-choy.svg`,
    SUNFLOWER: `/img/placeholder/sunflower.svg`,
    TWIN_SUNFLOWER: `/img/placeholder/twin-sunflower.svg`,

    // NEW PLANTS
    COFFEE_BEAN: `/img/placeholder/coffee-bean.svg`,
    HYPNO_SHROOM: `/img/placeholder/hypno-shroom.svg`,
    BLOVER: `/img/placeholder/blover.svg`,
    UMBRELLA_LEAF: `/img/placeholder/umbrella-leaf.svg`,
    TORCHWOOD: `/img/placeholder/torchwood.svg`,

    // ZOMBIES — `sprite-*.png` are the original cut-out chibi sprites (art-src batches);
    // classes still on `.webp` are waiting for their art: FLAG (and IMP below).
    ZOMBIE: `/img/sprite-zombie.png`,
    CONEHEAD: `/img/sprite-conehead.png`,
    BUCKETHEAD: `/img/sprite-buckethead.png`,
    NEWSPAPER: `/img/sprite-newspaper.png`,
    SCREEN_DOOR: `/img/sprite-screen-door.png`,
    DIGGER: `/img/sprite-digger.png`,
    FOOTBALL: `/img/sprite-football.png`,
    POLE_VAULTER: `/img/sprite-pole-vaulter.png`,
    DISCO: `/img/sprite-disco.png`,
    BALLOON: `/img/sprite-balloon.png`,
    CATAPULT: `/img/sprite-catapult.png`,
    FLAG: `/img/sprite-flag.png`,

    // BOSS/ETC
    GARGANTUAR: `/img/sprite-gargantuar.png`,
    /**
     * The eight bosses that came after the Gargantuar. All of them shipped borrowing a sprite
     * from a unit they resembled, and each got its own key here rather than reaching for the
     * borrowed one directly — because the swap documented in art-src/ART-TODO.md is "point that
     * one entry in utils/icons.ts at the new file", and that is only true if the entry exists.
     * That paid off on 2026-08-05: retiring all eight was eight edits to this list and nothing
     * else. Reaching straight for ICONS.GARGANTUAR would have made it an edit to a balance table.
     *
     * Two SECOND STATES also exist as art and are not wired to anything yet:
     * sprite-armada-wreck.png (shot down) and sprite-sandreaver-mound.png (still burrowed).
     * Nothing reads Unit.isBurrowed for a sprite swap today.
     */
    IRONCART: `/img/sprite-ironcart.png`,
    CINDER_COLOSSUS: `/img/sprite-cinder-colossus.png`,
    ARMADA: `/img/sprite-armada.png`,
    SANDREAVER: `/img/sprite-sandreaver.png`,
    YETI: `/img/sprite-yeti.png`,
    HEADLINER: `/img/sprite-headliner.png`,
    CLOCKJAW: `/img/sprite-clockjaw.png`,
    VOLTMAW: `/img/sprite-voltmaw.png`,
    BLIGHTLORD: `/img/sprite-blightlord.png`,
    IMP: `/img/sprite-imp.png`,
    ROCK: `/img/sprite-rock.png`,
    GRAVE: `/img/sprite-grave.png`,
    MINE: `/img/placeholder/mine.svg`,
    CHERRY: `/img/placeholder/cherry.svg`,
    JALAPENO: `/img/placeholder/jalapeno.svg`
};
