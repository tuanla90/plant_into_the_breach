
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
    COLD_SNAP: `/img/hero-cold-snap.jpg`,
    KERNEL_PULT: `/img/hero-cobb.jpg`,
};

// Transparent-background board sprites (512x512 PNG, normalized: shared baseline and scale).
// Generated from the card art, cut out and aligned by scratchpad/make_sprites.py-style processing.
export const HERO_SPRITES = {
    GREEN_SHADOW: `/img/sprite-green-shadow.png`,
    WALL_KNIGHT: `/img/sprite-wall-knight.png`,
    SOLAR_FLARE: `/img/sprite-solar-flare.png`,
    CHOMPZILLA: `/img/sprite-chompzilla.png`,
    COLD_SNAP: `/img/sprite-cold-snap.png`,
    KERNEL_PULT: `/img/sprite-cobb.png`,
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
    COLD_SNAP: '#38bdf8',
    KERNEL_PULT: '#eab308',
};

// Plant / zombie art. ROCK and GRAVE stay inline SVG data URIs (no file needed).
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
    TALL_NUT: `/img/placeholder/tall-nut.svg`,
    ENDURIAN: `/img/placeholder/endurian.svg`,
    SWEET_POTATO: `/img/placeholder/sweet-potato.svg`,
    IRON_NUT: `/img/placeholder/iron-nut.svg`,
    PUMPKIN: `/img/placeholder/pumpkin.svg`,
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
    IMP: `/img/placeholder/imp.svg`,
    ROCK: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect x='2' y='4' width='12' height='10' rx='2' fill='%234b5563'/><path fill='%23374151' d='M4 6h4v2H4zM10 10h2v2h-2z'/></svg>`,
    GRAVE: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path fill='%231f2937' d='M4 12h8v3H4z'/><rect x='5' y='3' width='6' height='10' rx='2' fill='%236b7280'/><path fill='%23374151' d='M7 5h2v4H7zM6 7h4v1H6z'/></svg>`,
    MINE: `/img/placeholder/mine.svg`,
    CHERRY: `/img/placeholder/cherry.svg`,
    JALAPENO: `/img/placeholder/jalapeno.svg`
};
