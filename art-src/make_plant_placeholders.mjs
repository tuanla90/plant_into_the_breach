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

/** game-icons is organised by artist, so glyphs are found by basename across all folders. */
const glyphIndex = new Map();
for (const artist of readdirSync(SRC, { withFileTypes: true }).filter(d => d.isDirectory())) {
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
    return [...readFileSync(p, 'utf8').matchAll(/<path\b[^>]*\/>/g)]
        .map(m => m[0])
        .filter(s => !/d="M0 0h512v512H0z"/.test(s))
        .map(s => s.replace(/fill="[^"]*"/, '').replace('<path', '<path fill="currentColor"'))
        .join('');
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
    'mine':           ['#94a3b8', [['land-mine', 64, 64, 0.58]]],
    'cherry':         ['#ef4444', [['cluster-bomb', 64, 64, 0.60]]],
    'jalapeno':       ['#dc2626', [['chili-pepper', 64, 64, 0.60]]],
};

mkdirSync(OUT, { recursive: true });

let made = 0;
const failed = [];
for (const [name, [color, layers]] of Object.entries(UNITS)) {
    let body;
    try {
        body = layers.map(([glyph, x, y, scale]) => {
            const s = (128 / 512) * scale;
            return `<g transform="translate(${x} ${y}) scale(${s}) translate(-256 -256)">${glyphPaths(glyph)}</g>`;
        }).join('');
    } catch (e) {
        failed.push(`${name}: ${e.message}`);
        continue;
    }

    // Token: dark disc, coloured ring, glyph in the ring colour. The drop shadow keeps it
    // legible over both the pale terrains (ice, sand) and the dark ones (concrete, wall).
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">`
        + `<defs><filter id="s" x="-30%" y="-30%" width="160%" height="160%">`
        + `<feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.75"/>`
        + `</filter></defs>`
        + `<g filter="url(#s)">`
        + `<circle cx="64" cy="64" r="54" fill="#151821" fill-opacity="0.92"/>`
        + `<circle cx="64" cy="64" r="54" fill="none" stroke="${color}" stroke-width="5"/>`
        + `<g color="${color}">${body}</g>`
        + `</g></svg>`;

    writeFileSync(join(OUT, `${name}.svg`), svg);
    made++;
}

console.log(`${made} placeholder tokens -> public/img/placeholder/`);
if (failed.length) console.log('COULD NOT BUILD:\n  ' + failed.join('\n  '));
