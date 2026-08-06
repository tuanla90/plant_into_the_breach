import { Unit, UnitClass } from '../types';
import { mobileSprite } from './platform';

// All game art is stored LOCALLY in `public/img/` and referenced by absolute path
// (`./img/<name>.<ext>`) — Vite serves `public/` at the site root.
//
// Why local instead of hotlinking: these images used to be hotlinked from
// static.wikia.nocookie.net (plus two other CDNs). That was fragile — corporate /
// MITM proxies block wiki hosts (plantsvszombies.wiki.gg and pvzfusion.wiki.gg were
// already blocked outright, and a proxy once broke 19 of 40 icons on a live machine),
// so the art silently vanished. Downloading the assets makes the game render offline
// and immune to whatever the network decides to block next.
//
// PLACEHOLDER ART: every entry under `./img/placeholder/` is a generated token, not final
// art. They replaced 30 images taken from the Plants vs. Zombies wiki. Keeping those made
// the rename of the game and its whole cast pointless — the artwork was still the original
// IP — and they clashed on the board with the cut-out chibi sprites the zombies use.
//
// Regenerate them with `node art-src/make_plant_placeholders.mjs`. To retire one, drop the
// real file into `public/img/` and repoint its entry below; nothing else needs to change,
// so the art can be replaced one unit at a time.
//
// To add art: save it under `public/img/` using the ICONS key lowercased in kebab-case
// (`ICE_GRENADE` -> `snow-pea`), with the `hero-` prefix for HERO_ICONS entries. These files
// are game assets and ARE committed.

// Hero art, used for the 3-hero squad: original AI-generated tactical hero cards.
// The old PvZ Heroes portraits (`hero-*.webp`) are GONE from public/ — original IP must
// never ship in the bundle (art-src/removed-pvz-art is the only archive). Transparent
// board sprites share the same files below until dedicated cut-outs land.
export const HERO_ICONS = {
    PEABURST: `./img/sprite-peaburst.png`,
    IRONHUSK: `./img/sprite-ironhusk.png`,
    SUNBLOOM: `./img/sprite-sunbloom.png`,
    SNAPMAW: `./img/sprite-snapmaw.png`,
    CORNOVA: `./img/sprite-cornova.png`,
    // Placeholder until the drone art lands (prompt in PLAN-hero-zephyr / the user's brief).
    REEDWING: `./img/placeholder/reedwing.svg`,
    THORNSHELL: `./img/sprite-thornshell.png`,
    CHARDSLAM: `./img/sprite-chardslam.png`,
    GOURDWARD: `./img/sprite-gourdward.png`,
};

// Transparent-background board sprites (512x512 PNG, normalized: shared baseline and scale).
// Generated from the card art, cut out and aligned by scratchpad/make_sprites.py-style processing.
export const HERO_SPRITES = {
    PEABURST: `./img/sprite-peaburst.png`,
    IRONHUSK: `./img/sprite-ironhusk.png`,
    SUNBLOOM: `./img/sprite-sunbloom.png`,
    SNAPMAW: `./img/sprite-snapmaw.png`,
    CORNOVA: `./img/sprite-cornova.png`,
    REEDWING: `./img/placeholder/reedwing.svg`,
    THORNSHELL: `./img/sprite-thornshell.png`,
    CHARDSLAM: `./img/sprite-chardslam.png`,
    GOURDWARD: `./img/sprite-gourdward.png`,
};

// Fusion-material art: bio-mech "gear" walkers (single-purpose war machines with a small
// plant core piloting them). Used by MATERIAL_DEFINITIONS only — the plain plant classes in
// ICONS below stay untouched because plants.ts shares them.
export const MATERIAL_SPRITES = {
    MAT_PEASHOOTER: `./img/gear-seed-gun.png`,
    MAT_SUNFLOWER: `./img/gear-sol-battery.png`,
    MAT_WALLNUT: `./img/gear-armor-plate.png`,
    MAT_CHOMPER: `./img/gear-steel-jaws.png`,
    MAT_CORN_MORTAR: `./img/gear-corn-mortar.png`,
    // The four gears belonging to the four newest heroes.
    MAT_CATTAIL: `./img/placeholder/gear-rotor-wing.svg`,
    MAT_ENDURIAN: `./img/gear-spike-armor.png`,
    MAT_SPRING_ARM: `./img/gear-spring-arm.png`,
    MAT_PUMPKIN: `./img/gear-bunker-shell.png`,
};

// Combat-item icons: handheld bio-mech consumables (pins, triggers, rip-cords), centered
// in-frame like inventory icons. data/items.ts points here.
export const ITEM_SPRITES = {
    SEED_MINE: `./img/item-seed-mine.png`,
    FIRE_GRENADE: `./img/item-fire-grenade.png`,
    FLAME_STRIKE: `./img/item-flame-strike.png`,
    ICE_GRENADE: `./img/item-ice-grenade.png`,
    STIM_SHOT: `./img/item-stim-shot.png`,
    STORM_FAN: `./img/item-storm-fan.png`,
    SPIKE_TRAP: `./img/terrain/spikes.svg`,
    BRAINWASH_DART: `./img/placeholder/brainwash-dart.svg`,
    MAGNET_PULSE: `./img/placeholder/magnet-pulse.svg`,
    HEAL_KIT: `./img/placeholder/heal-kit.svg`,
    BLIGHT_CORE: `./img/placeholder/blight-core.svg`,
};

// Neon accent per hero — mirrors the accent color baked into each hero's card art.
// Shared by every screen that showcases a hero (squad select, fusion bench, ...).
export const HERO_ACCENTS: Record<string, string> = {
    PEABURST: '#4ade80',
    IRONHUSK: '#f59e0b',
    SUNBLOOM: '#fb923c',
    SNAPMAW: '#d946ef',
    CORNOVA: '#eab308',
    REEDWING: '#e879f9',       // cattail magenta
    THORNSHELL: '#b45309',    // durian husk
    CHARDSLAM: '#ef4444',    // chard stem red
    GOURDWARD: '#f97316',    // pumpkin orange
};

// Plant / zombie art. ROCK and GRAVE used to be inline SVG data URIs written by hand here —
// two rectangles that predated the token set and looked it, sitting on the board beside art
// made to a different brief. They are generated tokens now like everything else.
/**
 * Sprites drawn facing RIGHT, which every renderer has to mirror.
 *
 * EMPTY, and that is the correct state: the whole zombie set marches leftward toward the lawn
 * and is now drawn that way, Gravehulk included — his art was redrawn facing left, so the
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
        src: `./img/sprite-sandreaver-mound.png`,
        note: 'burrowed — the tile it will erupt from',
    }],

    // Shot out of the sky. Mirrors `armadaWrecked` in utils/bossBehaviours.ts: the moment it
    // stops flying it stops being a flier for every rule too — it can be pushed, it can drown,
    // and a melee wall finally means something to it.
    [UnitClass.ARMADA]: [{
        when: u => u.movementType !== 'FLYING',
        src: `./img/sprite-armada-wreck.png`,
        note: 'grounded — no longer a flier for any rule',
    }],

    // The imp on its back is the tell. It is NOT "has thrown its imp" — the Gravehulk throws
    // imps repeatedly and nothing tracks a count — it is the shared boss phase line,
    // `hp <= floor(maxHp / 2)`, which is the moment its throw range drops from 4 to 2.
    // Losing the passenger is the most readable way to say "this thing changed".
    [UnitClass.GRAVEHULK]: [{
        when: u => u.hp <= Math.floor(u.maxHp / 2),
        src: `./img/sprite-gargantuar-wounded.png`,
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
        for (const v of variants) if (v.when(unit)) return mobileSprite(v.src);
    }
    // mobileSprite: trên cảm ứng trả bản 128px trong img/small/ — texture 512 cho ô
    // ~40px là thứ làm animation trận đánh giật trên điện thoại.
    return mobileSprite(unit.imgUrl);
};

export const ICONS = {
    // Chín thân cây + thùng GEAR_CRATE còn lại sau hai đợt dọn (data/plants.ts). Mười chín
    // cây PvZ đã bỏ; art placeholder/gear không còn ai trỏ tới cũng đã xoá khỏi public/img.
    SEED_GUN: `./img/gear-seed-gun.png`,
    ROTOR_WING: `./img/placeholder/rotor-wing.svg`,
    CORN_MORTAR: `./img/gear-corn-mortar.png`,
    ARMOR_PLATE: `./img/gear-armor-plate.png`,
    GEAR_CRATE: `./img/sprite-gear-crate.png`,
    SPIKE_ARMOR: `./img/gear-spike-armor.png`,
    BUNKER_SHELL: `./img/gear-bunker-shell.png`,
    SPRING_ARM: `./img/gear-spring-arm.png`,
    STEEL_JAWS: `./img/gear-steel-jaws.png`,
    SOL_BATTERY: `./img/gear-sol-battery.png`,

    // ZOMBIES — `sprite-*.png` are the original cut-out chibi sprites (art-src batches);
    // classes still on `.webp` are waiting for their art: BANNERMAN (and RUNT below).
    WALKER: `./img/sprite-walker.png`,
    SCRAPCAP: `./img/sprite-scrapcap.png`,
    POTHELM: `./img/sprite-pothelm.png`,
    TATTERGUARD: `./img/sprite-tatterguard.png`,
    DOORBEARER: `./img/sprite-doorbearer.png`,
    MINER: `./img/sprite-miner.png`,
    LINEBREAKER: `./img/sprite-linebreaker.png`,
    LEAPER: `./img/sprite-leaper.png`,
    DANCER: `./img/sprite-dancer.png`,
    FLOATER: `./img/sprite-floater.png`,
    LOBBER: `./img/sprite-lobber.png`,
    BANNERMAN: `./img/sprite-bannerman.png`,

    // BOSS/ETC
    GRAVEHULK: `./img/sprite-gravehulk.png`,
    /**
     * The eight bosses that came after the Gravehulk. All of them shipped borrowing a sprite
     * from a unit they resembled, and each got its own key here rather than reaching for the
     * borrowed one directly — because the swap documented in art-src/ART-TODO.md is "point that
     * one entry in utils/icons.ts at the new file", and that is only true if the entry exists.
     * That paid off on 2026-08-05: retiring all eight was eight edits to this list and nothing
     * else. Reaching straight for ICONS.GRAVEHULK would have made it an edit to a balance table.
     *
     * Two SECOND STATES also exist as art and are not wired to anything yet:
     * sprite-armada-wreck.png (shot down) and sprite-sandreaver-mound.png (still burrowed).
     * Nothing reads Unit.isBurrowed for a sprite swap today.
     */
    IRONCART: `./img/sprite-ironcart.png`,
    CINDER_COLOSSUS: `./img/sprite-cinder-colossus.png`,
    ARMADA: `./img/sprite-armada.png`,
    SANDREAVER: `./img/sprite-sandreaver.png`,
    YETI: `./img/sprite-yeti.png`,
    HEADLINER: `./img/sprite-headliner.png`,
    CLOCKJAW: `./img/sprite-clockjaw.png`,
    VOLTMAW: `./img/sprite-voltmaw.png`,
    BLIGHTLORD: `./img/sprite-blightlord.png`,
    RUNT: `./img/sprite-runt.png`,
    ROCK: `./img/sprite-rock.png`,
    GRAVE: `./img/sprite-grave.png`,
    MINE: `./img/placeholder/mine.svg`,
    CHERRY: `./img/placeholder/cherry.svg`,
    FLAME_STRIKE: `./img/placeholder/flame_strike.svg`
};
