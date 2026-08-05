# -*- coding: utf-8 -*-
"""Cut a character out of a white-background render and normalise it into a board sprite.

Every sprite in `public/img/` shares one geometry, and that shared geometry is the whole point:
the board draws them all in the same tile, so a unit whose feet sit ten pixels higher than its
neighbour's looks like it is floating. Measured off the existing set —

    512x512 canvas, content exactly 474px tall, bottom edge at y=493, centred horizontally

— which is what this reproduces. Anything wide enough to overflow the canvas at that height
(a rifle held out sideways) is scaled down by width instead, so it still fits.

BACKGROUND REMOVAL IS A FLOOD FILL FROM THE BORDER, not a global "delete white" threshold.
These renders have white *inside* them — eye glints, highlights on metal, the whites of a
painted marking — and a global threshold punches holes straight through the character. Only
white that is CONNECTED TO THE EDGE is background.

SKY THE FILL CANNOT REACH IS STILL SKY. A flood fill from the border takes everything outside
the character and nothing the character encloses — the triangle between an arm and a hip, the
gap inside a catapult frame, the daylight between two balloon ropes. Every one of those stayed
solid white and, on the game's near-black board, read as a paint spill. `fill_enclosed_sky`
takes them too; see the docstring there for how it tells a pocket of sky from a white sock.

Usage:
    python art-src/make_sprites.py "art-src/Hero Thornquill.jpeg" public/img/sprite-thornquill.png
    python art-src/make_sprites.py --all        # every mapping in JOBS below
    python art-src/make_sprites.py --repair     # re-cut sky out of the PNGs already in public/img
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'art-src'
OUT = ROOT / 'public' / 'img'

# Canvas geometry, measured off the sprites that already ship.
CANVAS = 512
CONTENT_H = 474
BOTTOM_Y = 493
MAX_W = 500          # leeway for a weapon held out sideways

# How close to white counts as background, per channel (0-255).
WHITE_TOL = 26
# Alpha below this after feathering is dropped entirely, so no grey fringe survives.
ALPHA_FLOOR = 8

# --- enclosed sky, and the two numbers that keep it from eating the artwork ----------------
# A white region the character encloses is only background if the character's own black
# linework is what encloses it. HOLE_DARK_RING is the share of the region's immediate border
# that has to be outline-dark before it is treated as sky.
HOLE_DARK_RING = 0.55
# Measured floor, not a guess. Two known highlights — the leaf glint on Solar Flare and the
# same glint on Wall Knight — sit at 41 and 43 px and pass every other test here, because a
# glint painted inside a shadow really is pure white ringed by dark. Nothing below 60 px
# survives a 512 -> 64 px board draw as more than a fraction of a pixel, so the floor costs
# nothing visible and buys back the only false positives in the set.
HOLE_MIN_AREA = 60
# Anti-aliasing between a sky pocket and the outline around it: light enough to be part of the
# background rather than part of the ink, and it has to go or the hole keeps a pale rim.
FRINGE_LUM = 210

JOBS = [
    # (source in art-src, destination in public/img)
    ('Hero Thornquill.jpeg', 'sprite-thornquill.png'),
    ('hero Thornhide.jpeg',  'sprite-thornhide.png'),
    ('Hero Chardwall.jpeg',  'sprite-chardwall.png'),
    ('hero Gourdward.jpeg',  'sprite-gourdward.png'),
    # NOTE the source filename typo: "catus". The destination spelling is the one that
    # matters — utils/icons.ts and MATERIAL_SPRITES both say cactus.
    ('gear-catus.jpeg',      'gear-cactus.png'),
    ('gear-endurian.jpeg',   'gear-endurian.png'),
    ('gear-chard.jpeg',      'gear-chard.png'),
    ('gear-pumpkin.jpeg',    'gear-pumpkin.png'),

    # The nine named bosses. They use the SAME 474px content height as an ordinary zombie —
    # sprite-gargantuar.png does too. A boss reads as big through the width and density of its
    # art, not by breaking the shared baseline, because the board draws every unit in one tile
    # and a taller sprite would simply overhang its neighbours.
    ('sprite-ironcart.jpeg',         'sprite-ironcart.png'),
    ('sprite-cinder-colossus.jpeg',  'sprite-cinder-colossus.png'),
    ('sprite-armada.jpeg',           'sprite-armada.png'),
    ('sprite-sandreaver.jpeg',       'sprite-sandreaver.png'),
    ('sprite-yeti.jpeg',             'sprite-yeti.png'),
    ('sprite-headliner.jpeg',        'sprite-headliner.png'),
    ('sprite-clockjaw.jpeg',         'sprite-clockjaw.png'),
    ('sprite-voltmaw.jpeg',          'sprite-voltmaw.png'),
    ('sprite-blightlord.jpeg',       'sprite-blightlord.png'),

    # Two SECOND STATES, not extra bosses: the Armada after it is shot down, and Sandreaver
    # while it is still underground. Nothing reads these yet — see the report.
    ('sprite-armada-wreck.jpeg',     'sprite-armada-wreck.png'),
    ('sprite-sandreaver-mound.jpeg', 'sprite-sandreaver-mound.png'),

    # Board props and small fry — the last three things a player still saw as placeholder art.
    ('Cracked_stone_tombstone_icon_202608050008.jpeg',    'sprite-grave.png'),
    ('Concrete_rubble_sitting_on_ground_202608050014.jpeg', 'sprite-rock.png'),
    ('Zombie_imp_toddler_waddling_202608050001.jpeg',     'sprite-imp.png'),
    # Replaces a dancer that looked rather too much like a specific real performer.
    ('Zombie_dancing_Michael_Jackson_o…_202608050009.jpeg', 'sprite-disco.png'),

    # GARGANTUAR, both states. The imp on its back is the tell: carrying one means healthy,
    # losing it means wounded — see SPRITE_VARIANTS in utils/icons.ts for why that is the
    # honest reading rather than "it has thrown its imp".
    ('Zombie_with_baby_on_back_202608050009.jpeg', 'sprite-gargantuar.png'),
    ('Zombie_with_baby_on_back_202608050013.jpeg', 'sprite-gargantuar-wounded.png'),
]


def cut_out(im: Image.Image) -> Image.Image:
    """RGBA copy of `im` with the border-connected white background made transparent."""
    rgb = np.asarray(im.convert('RGB')).astype(np.int16)
    near_white = (rgb > (255 - WHITE_TOL)).all(axis=2)

    # Keep only the white regions that touch the frame edge.
    labels, n = ndimage.label(near_white)
    if n:
        edge = np.concatenate([labels[0, :], labels[-1, :], labels[:, 0], labels[:, -1]])
        background_ids = set(int(v) for v in np.unique(edge) if v)
        background = np.isin(labels, list(background_ids))
    else:
        background = np.zeros_like(near_white)

    alpha = np.where(background, 0, 255).astype(np.uint8)
    out = im.convert('RGBA')
    a = Image.fromarray(alpha, mode='L')
    # One pixel of blur takes the jaggies off the cut without eating the black outline.
    a = a.filter(ImageFilter.GaussianBlur(0.6))
    a = a.point(lambda v: 0 if v < ALPHA_FLOOR else v)
    out.putalpha(a)
    return out


def fill_enclosed_sky(im: Image.Image) -> tuple[Image.Image, int]:
    """Punch out white the character ENCLOSES. Returns the image and how many pixels went.

    The border flood fill in `cut_out` is correct and incomplete: it can only reach white that
    is connected to the frame, so any pocket the silhouette closes around survives. On a white
    page nobody notices. On the board these sprites are drawn against, every pocket is a bright
    hole in the middle of a zombie.

    TELLING SKY FROM PAINT is the whole difficulty, because both are white. The test used here
    is what encloses it: these renders outline the character in near-black, so a pocket of
    background is fenced in by ink, while a highlight on metal or a white trouser leg sits in
    mid-tones. Measured across the shipped set that separates cleanly — pockets ring up at
    0.63-0.80 dark, the Cinder Colossus's glowing chest and the dancer's white suit at 0.27-0.50
    — with exactly two exceptions, both tiny, both handled by HOLE_MIN_AREA.

    Safe to run twice: a hole already transparent is no longer opaque white, so it is not found
    a second time.
    """
    a = np.asarray(im.convert('RGBA')).copy()
    rgb, alpha = a[..., :3].astype(np.int16), a[..., 3]
    opaque = alpha > 128
    lum = rgb.mean(axis=2)
    white = opaque & (rgb > (255 - WHITE_TOL)).all(axis=2)

    labels, n = ndimage.label(white)
    holes = np.zeros_like(white)
    for i in range(1, n + 1):
        comp = labels == i
        if comp.sum() < HOLE_MIN_AREA:
            continue
        ring = ndimage.binary_dilation(comp, iterations=2) & ~comp & opaque
        if not ring.any() or (lum[ring] < 100).mean() < HOLE_DARK_RING:
            continue
        holes |= comp
    if not holes.any():
        return im, 0

    # Take the anti-aliased rim with it, or the hole keeps a pale outline of itself.
    holes |= ndimage.binary_dilation(holes, iterations=1) & (lum > FRINGE_LUM) & opaque

    cut = alpha.astype(np.float32)
    cut[holes] = 0
    # Feather ONLY along the new edges. Blurring the whole alpha again would soften every cut
    # the sprite already had, a little more each time this is run.
    band = ndimage.binary_dilation(holes, iterations=2)
    cut[band] = ndimage.gaussian_filter(cut, 0.6)[band]
    cut[cut < ALPHA_FLOOR] = 0

    out = im.convert('RGBA')
    out.putalpha(Image.fromarray(cut.astype(np.uint8), mode='L'))
    return out, int(holes.sum())


def normalise(im: Image.Image) -> Image.Image:
    """Scale to the shared board geometry and place on a 512x512 transparent canvas."""
    bbox = im.split()[3].getbbox()
    if not bbox:
        raise SystemExit('nothing left after the cut-out — check WHITE_TOL')
    body = im.crop(bbox)
    w, h = body.size
    scale = min(CONTENT_H / h, MAX_W / w)
    body = body.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)

    canvas = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(body, ((CANVAS - body.size[0]) // 2, BOTTOM_Y - body.size[1]), body)
    return canvas


def run(src: Path, dst: Path) -> None:
    im = Image.open(src)
    cut, holes = fill_enclosed_sky(cut_out(im))
    sprite = normalise(cut)
    dst.parent.mkdir(parents=True, exist_ok=True)
    sprite.save(dst)
    bb = sprite.split()[3].getbbox()
    print(f'{dst.name:26} {sprite.size}  content={bb}  sky={holes:5}  <- {src.name}')


def repair(paths: list[Path]) -> None:
    """Re-cut enclosed sky out of sprites that already shipped.

    Not every PNG in `public/img` can be rebuilt from JOBS — the older art was cut before this
    script existed and some of its sources are gone — and those are exactly the ones carrying
    the biggest holes. Geometry is left alone: this only edits alpha, so a sprite the board is
    already lining up correctly stays lined up.
    """
    for p in sorted(paths):
        im = Image.open(p).convert('RGBA')
        out, holes = fill_enclosed_sky(im)
        if not holes:
            continue
        out.save(p)
        print(f'{p.name:30} sky removed = {holes:6} px')


if __name__ == '__main__':
    if len(sys.argv) == 2 and sys.argv[1] == '--all':
        for a, b in JOBS:
            run(SRC / a, OUT / b)
    elif len(sys.argv) == 2 and sys.argv[1] == '--repair':
        repair(list(OUT.glob('sprite-*.png')) + list(OUT.glob('gear-*.png'))
               + list(OUT.glob('item-*.png')))
    elif len(sys.argv) == 3:
        run(Path(sys.argv[1]), Path(sys.argv[2]))
    else:
        raise SystemExit(__doc__)
