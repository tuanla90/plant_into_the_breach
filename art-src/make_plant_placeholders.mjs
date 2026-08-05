/**
 * Generates a stand-in token for every unit still drawn with Plants vs. Zombies wiki art.
 *
 * WHY THIS EXISTS: 29 units were still rendering artwork downloaded from the PvZ wiki. That
 * is a problem twice over — the board mixed those framed renders with the cut-out chibi
 * sprites the zombies use, and the whole point of renaming the game and its cast was to stop
 * depending on that IP. Renaming while shipping the original artwork achieves nothing.
 *
 * These are DELIBERATELY placeholders, not final art: a dark token, a coloured ring, and a
 * CC-BY game-icons glyph. They read as "piece not drawn yet" rather than as broken images,
 * they are internally consistent, and they carry the unit's role in the ring colour so the
 * board stays playable while the real art gets made one at a time.
 *
 * TO REPLACE ONE: drop `public/img/plant-<name>.png` (or .webp) in place and point the entry
 * in utils/icons.ts at it. Nothing else needs to change.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(import.meta.dirname, 'game-icons');
const OUT = join(import.meta.dirname, '..', 'public', 'img', 'placeholder');

/**
 * game-icons is organised by artist, so glyphs are found by basename across all folders.
 * `badges/` is skipped: those 59 files are pre-decorated 256-viewBox roundels, not plain
 * glyphs, and since the folder sorts first it would silently shadow a real glyph of the same
 * name (`leaf`, `cog`, `crown`...) with something this script's 512-space maths mis-renders.
 */
const glyphIndex = new Map();
for (const artist of readdirSync(SRC, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'badges')) {
    for (const f of readdirSync(join(SRC, artist.name))) {
        if (f.endsWith('.svg') && !glyphIndex.has(f.slice(0, -4))) {
            glyphIndex.set(f.slice(0, -4), join(SRC, artist.name, f));
        }
    }
}

/** The full-bleed black rect that opens every game-icons file is the background, not the art. */
const glyphPaths = (name) => {
    const p = glyphIndex.get(name);
    if (!p) throw new Error(`glyph not found: ${name}`);
    // Both `<path .../>` and `<path ...></path>` occur in the library; matching only the first
    // form silently yielded an empty glyph, which is why the throw below exists.
    const out = [...readFileSync(p, 'utf8').matchAll(/<path\b[^>]*?(?:\/>|><\/path>)/g)]
        .map(m => m[0])
        .filter(s => !/d="M0 0h512v512H0z"/.test(s))
        .map(s => s.replace(/fill="[^"]*"/, '').replace('<path', '<path fill="currentColor"'))
        .join('');
    if (!out) throw new Error(`glyph has no usable <path>: ${name}`);
    return out;
};

// name -> [ring colour, layers]. A layer is [glyph, x, y, scale, opacity].
// Colour carries the role: green shooters, amber lobbers, brown walls, yellow sun,
// magenta melee, cyan utility, red hostile.
const UNITS = {
    'peashooter':     ['#4ade80', [['sprout', 64, 68, 0.62]]],
    'snow-pea':       ['#7dd3fc', [['sprout', 58, 72, 0.58], ['snowflake-2', 92, 40, 0.26]]],
    'repeater':       ['#22c55e', [['sprout', 48, 70, 0.50], ['sprout', 84, 62, 0.50]]],
    'bloomerang':     ['#a3e635', [['boomerang', 64, 64, 0.66]]],
    'cactus':         ['#34d399', [['cactus', 64, 66, 0.64]]],
    'melon-pult':     ['#4ade80', [['watermelon', 64, 66, 0.62]]],
    'cabbage-pult':   ['#86efac', [['cabbage', 64, 66, 0.62]]],
    'kernel-pult':    ['#fbbf24', [['corn', 64, 64, 0.62]]],
    'magnet-shroom':  ['#c084fc', [['mushrooms', 58, 72, 0.56], ['magnet', 92, 40, 0.28]]],
    'sun-shroom':     ['#fcd34d', [['mushrooms', 58, 72, 0.56], ['sunflower', 92, 40, 0.28]]],
    'scaredy-shroom': ['#a78bfa', [['mushrooms', 64, 66, 0.60]]],
    'wallnut':        ['#b45309', [['acorn', 64, 66, 0.62]]],
    'tall-nut':       ['#92400e', [['acorn', 64, 62, 0.74]]],
    'endurian':       ['#f97316', [['acorn', 60, 70, 0.58], ['thorny-vine', 94, 40, 0.28]]],
    'sweet-potato':   ['#fb923c', [['potato', 64, 66, 0.62]]],
    'iron-nut':       ['#94a3b8', [['acorn', 58, 70, 0.58], ['hexagonal-nut', 94, 40, 0.28]]],
    'pumpkin':        ['#f97316', [['pumpkin', 64, 66, 0.62]]],
    'chomper':        ['#d946ef', [['carnivorous-plant', 64, 66, 0.66]]],
    'bonk-choy':      ['#22c55e', [['fist', 64, 64, 0.58]]],
    'sunflower':      ['#fcd34d', [['sunflower', 64, 66, 0.64]]],
    'twin-sunflower': ['#fbbf24', [['sunflower', 48, 70, 0.48], ['sunflower', 86, 58, 0.48]]],
    'coffee-bean':    ['#a16207', [['coffee-beans', 64, 64, 0.60]]],
    'hypno-shroom':   ['#e879f9', [['mushrooms', 58, 72, 0.56], ['vortex', 92, 40, 0.28]]],
    'blover':         ['#67e8f9', [['handheld-fan', 64, 64, 0.60]]],
    'umbrella-leaf':  ['#38bdf8', [['umbrella', 64, 64, 0.62]]],
    'torchwood':      ['#fb923c', [['flame', 64, 66, 0.60]]],
    'imp':            ['#ef4444', [['shambling-zombie', 64, 66, 0.62]]],
    // The two board obstacles. They were the last things in the game still drawn as inline
    // data-URI SVGs hand-written into utils/icons.ts — two crude rectangles that predate this
    // whole token set and sat on the board next to art made to a completely different brief.
    // Slate for the rock (inert, in the way) and enemy red for the grave (it is on a clock:
    // GRAVE_DIG_PERIOD digs a zombie up, so it is a threat, not scenery).
    'rock':           ['#94a3b8', [['stone-block', 64, 64, 0.62]]],
    'grave':          ['#ef4444', [['tombstone', 64, 64, 0.62]]],
    'mine':           ['#94a3b8', [['land-mine', 64, 64, 0.58]]],
    'cherry':         ['#ef4444', [['cluster-bomb', 64, 64, 0.60]]],
    'jalapeno':       ['#dc2626', [['chili-pepper', 64, 64, 0.60]]],
    // Chard Guard shipped with pack #6 and never had wiki art to remove; it is a placeholder
    // from birth. Lighter red than the hostile reds above so the ring still reads "defender".
    'chard-guard':    ['#f87171', [['monstera-leaf', 60, 70, 0.56], ['shield-bash', 94, 40, 0.26]]],
};

// Heroes get the CREST plate instead of the disc. A hero token is a card portrait and a board
// sprite at once, so it has to be tellable from the plant it commands at a glance — silhouette
// does that better than colour, which is already spoken for by the role legend above.
// Second glyph is the hero's mechanic, not their species.
const HEROES = {
    'hero-thornquill': ['#22c55e', [['cactus', 62, 68, 0.52], ['thorned-arrow', 94, 40, 0.24]]],
    'hero-thornhide':  ['#b45309', [['spiked-shell', 62, 68, 0.54], ['shield-reflect', 94, 40, 0.24]]],
    'hero-chardwall':  ['#ef4444', [['monstera-leaf', 62, 68, 0.54], ['lever', 94, 40, 0.24]]],
    'hero-gourdward':  ['#f97316', [['pumpkin', 62, 68, 0.52], ['attached-shield', 94, 40, 0.24]]],
};

// Fusion materials get the COG plate: they are war machines with a plant core driving them,
// so the plate carries the machine and the centre glyph carries which plant went into it.
// `mecha-head` repeats on all four on purpose — it is the "this is gear, not a unit" mark.
const GEAR = {
    'gear-cactus':   ['#22c55e', [['cactus', 60, 70, 0.50], ['mecha-head', 94, 40, 0.24]]],
    'gear-endurian': ['#b45309', [['spiked-shell', 60, 70, 0.50], ['mecha-head', 94, 40, 0.24]]],
    'gear-chard':    ['#ef4444', [['monstera-leaf', 60, 70, 0.50], ['mecha-head', 94, 40, 0.24]]],
    'gear-pumpkin':  ['#f97316', [['pumpkin', 60, 70, 0.50], ['mecha-head', 94, 40, 0.24]]],
};

/** Gear teeth, drawn as a closed polygon: outer flat, inner flat, repeat. */
const cogPath = (cx, cy, rOut, rIn, teeth) => {
    const pts = [];
    for (let i = 0; i < teeth; i++) {
        const p = (Math.PI * 2) / teeth;
        const a0 = i * p - Math.PI / 2;
        for (const [r, f] of [[rIn, 0], [rOut, 0.16], [rOut, 0.46], [rIn, 0.62]]) {
            const a = a0 + p * f;
            pts.push(`${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}`);
        }
    }
    return `M${pts.join(' L')} Z`;
};

const CREST = 'M64 10 L112 28 L112 66 C112 94 90 112 64 120 C38 112 16 94 16 66 L16 28 Z';

// Every plate is the same recipe — dark fill, coloured outline, a faint inner echo of the same
// outline — so the three families read as one set at a glance and differ only in silhouette.
const plate = (d, color, inner) =>
    `<path d="${d}" fill="#151821" fill-opacity="0.92"/>`
    + `<path d="${d}" fill="none" stroke="${color}" stroke-width="5" stroke-linejoin="round"/>`
    + inner;

const SHAPES = {
    disc: (color) =>
        `<circle cx="64" cy="64" r="54" fill="#151821" fill-opacity="0.92"/>`
        + `<circle cx="64" cy="64" r="54" fill="none" stroke="${color}" stroke-width="5"/>`,
    crest: (color) => plate(CREST, color,
        `<path d="${CREST}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"`
        + ` stroke-opacity="0.45" transform="translate(64 66) scale(0.84) translate(-64 -66)"/>`),
    cog: (color) => plate(cogPath(64, 64, 56, 46, 9), color,
        `<circle cx="64" cy="64" r="34" fill="none" stroke="${color}" stroke-width="2" stroke-opacity="0.45"/>`),
};

mkdirSync(OUT, { recursive: true });

const ALL = [
    ...Object.entries(UNITS).map(e => [...e, 'disc']),
    ...Object.entries(HEROES).map(e => [...e, 'crest']),
    ...Object.entries(GEAR).map(e => [...e, 'cog']),
];

let made = 0;
const failed = [];
for (const [name, [color, layers], shape] of ALL) {
    let body;
    try {
        body = layers.map(([glyph, x, y, scale, opacity]) => {
            const s = (128 / 512) * scale;
            const o = opacity === undefined ? '' : ` opacity="${opacity}"`;
            return `<g${o} transform="translate(${x} ${y}) scale(${s}) translate(-256 -256)">${glyphPaths(glyph)}</g>`;
        }).join('');
    } catch (e) {
        failed.push(`${name}: ${e.message}`);
        continue;
    }

    // Token: dark plate, coloured outline, glyph in the outline colour. The drop shadow keeps it
    // legible over both the pale terrains (ice, sand) and the dark ones (concrete, wall).
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">`
        + `<defs><filter id="s" x="-30%" y="-30%" width="160%" height="160%">`
        + `<feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.75"/>`
        + `</filter></defs>`
        + `<g filter="url(#s)">`
        + SHAPES[shape](color)
        + `<g color="${color}">${body}</g>`
        + `</g></svg>`;

    writeFileSync(join(OUT, `${name}.svg`), svg);
    made++;
}

console.log(`${made} placeholder tokens -> public/img/placeholder/`);
if (failed.length) console.log('COULD NOT BUILD:\n  ' + failed.join('\n  '));
