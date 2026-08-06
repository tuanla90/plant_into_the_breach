# Art still to be made

33 tokens still render a generated placeholder from `public/img/placeholder/` — all of them
plants, zombies and board props. Most replaced artwork taken from the Plants vs. Zombies wiki;
the originals are parked in `art-src/removed-pvz-art/` for reference only and **must not go back
into `public/`**, since shipping them is what the rename of the game and its cast was meant to
get away from.

**Done on 2026-08-04:** the four pack-#7 heroes (Thornquill, Thornhide, Chardwall, Gourdward)
and their four fusion gears now have real art. They were rendered on white and cut out with
`art-src/make_sprites.py`, which also normalises them onto the shared board geometry — 512×512,
content 474px tall, bottom edge at y=493. Their eight placeholder SVGs are still on disk but
nothing references them any more.

**Done on 2026-08-05:** all nine remaining bosses got art. Retiring them was eight edits to
`utils/icons.ts` and nothing else — which is exactly what giving each boss its own ICONS key
bought, even while every one of them was borrowing another unit's sprite.

**Nothing a player sees is on placeholder art any more (2026-08-05).** `IMP`, `ROCK`, `GRAVE`
and the Disco dancer were the last four, and three boss second-states went in with them
(`SPRITE_VARIANTS`, utils/icons.ts). Everything still under `public/img/placeholder/` is a dead
entry: those classes live in `PLANT_DEFINITIONS` but never render, because heroes read
`HERO_SPRITES` and bench plants read `MATERIAL_SPRITES`.

**No longer true as of 2026-08-06 — five ITEM icons are visible placeholders again.** The
consumable roster grew (Hypno-shroom, Magnet-shroom, then Aloe and the Doom-shroom with the
sector-unlock system), and those four render a `public/img/placeholder/*.svg` in the item belt,
the shop shelf, the Chrono Echo offer and the sector-gift toast; Spikeweed additionally borrows
the FLOOR TEXTURE (`img/terrain/spikes.svg`) as its inventory icon. Prompts for all five are
ready in `ART-PROMPTS-ITEMS.md`, written to sit next to `item-cherry-bomb.png` — same
plant-as-ordnance icon language as the six item icons that already have real art.

The set has three silhouettes so the families stay tellable apart on a crowded board:
**disc** = a unit on the board, **crest** (peaked shield) = a hero, **cog** = fusion gear.

## How to retire a placeholder

1. Make the art. Match the existing board sprites: cut out, transparent background, roughly
   512×512, dark tactical chibi, lit from the upper left. `public/img/sprite-*.png` are the
   reference — a new plant should sit next to `sprite-conehead.png` without looking imported.
2. Save it as `public/img/<name>.png` using the same kebab-case name as the placeholder.
3. Point that one entry in `utils/icons.ts` at the new file.

Nothing else changes, so this can be done one unit at a time. The ring colour on each token
is the role the art should read as at a glance.

## The list

| Unit | Placeholder | Ring colour reads as |
| --- | --- | --- |
| Peashooter | `placeholder/peashooter.svg` | basic shooter |
| Snow Pea | `placeholder/snow-pea.svg` | ice shooter |
| Repeater | `placeholder/repeater.svg` | double shooter |
| Bloomerang | `placeholder/bloomerang.svg` | returning shot |
| Cactus | `placeholder/cactus.svg` | long-range shooter |
| Melon-pult | `placeholder/melon-pult.svg` | heavy lobber |
| Cabbage-pult | `placeholder/cabbage-pult.svg` | lobber |
| Kernel-pult | `placeholder/kernel-pult.svg` | stun lobber |
| Magnet Shroom | `placeholder/magnet-shroom.svg` | utility fungus |
| Sun Shroom | `placeholder/sun-shroom.svg` | sun producer |
| Scaredy Shroom | `placeholder/scaredy-shroom.svg` | fragile fungus |
| Wall-nut | `placeholder/wallnut.svg` | wall |
| Tall-nut | `placeholder/tall-nut.svg` | tall wall |
| Endurian | `placeholder/endurian.svg` | thorned wall |
| Sweet Potato | `placeholder/sweet-potato.svg` | taunt / puller |
| Iron Nut | `placeholder/iron-nut.svg` | armoured wall |
| Pumpkin | `placeholder/pumpkin.svg` | shell / armour |
| Chomper | `placeholder/chomper.svg` | melee devourer |
| Bonk Choy | `placeholder/bonk-choy.svg` | melee brawler |
| Sunflower | `placeholder/sunflower.svg` | sun producer |
| Twin Sunflower | `placeholder/twin-sunflower.svg` | double sun |
| Coffee Bean | `placeholder/coffee-bean.svg` | action refresh |
| Hypno Shroom | `placeholder/hypno-shroom.svg` | mind control |
| Umbrella Leaf | `placeholder/umbrella-leaf.svg` | anti-air / cover |
| Blover | `placeholder/blover.svg` | wind / push |
| Torchwood | `placeholder/torchwood.svg` | fire buff |
| Imp | `placeholder/imp.svg` | small zombie |
| Mine | `placeholder/mine.svg` | board hazard |
| Cherry Bomb | `placeholder/cherry.svg` | explosive |
| Jalapeno | `placeholder/jalapeno.svg` | fire line |
| Chard Guard | `placeholder/chard-guard.svg` | knockback defender |
| Rock | `placeholder/rock.svg` | inert obstacle |
| Grave | `placeholder/grave.svg` | digs up a zombie on a timer |

### Heroes (crest token) — ✅ DONE, art landed 2026-08-04

A hero token is doing two jobs at once — the portrait on the squad card and the sprite on the
board — so replacing one means either art that survives both crops, or splitting the entry in
`utils/icons.ts` into two files (`HERO_PORTRAITS` and `HERO_SPRITES` already point at the same
file per hero, which is where that split would go).

| Hero | Placeholder | Should read as |
| --- | --- | --- |
| Thornquill | `placeholder/hero-thornquill.svg` | Cactus — spines, piercing, long range |
| Thornhide | `placeholder/hero-thornhide.svg` | Endurian — spikes facing out, melee, retaliation |
| Chardwall | `placeholder/hero-chardwall.svg` | Chard Guard — rainbow chard, red stalk, leverage / knockback |
| Gourdward | `placeholder/hero-gourdward.svg` | Pumpkin — a hollow shell that armours somebody else |

### Fusion gear (cog token) — ✅ DONE, art landed 2026-08-04

These are the fusion materials, not units. The brief is "bio-mech walker": a small war machine
with a plant core driving it, which is why the token is a cog rather than a disc.

| Gear | Placeholder | Plant core |
| --- | --- | --- |
| Cactus gear | `placeholder/gear-cactus.svg` | Cactus |
| Endurian gear | `placeholder/gear-endurian.svg` | Endurian |
| Chard gear | `placeholder/gear-chard.svg` | Chard Guard |
| Pumpkin gear | `placeholder/gear-pumpkin.svg` | Pumpkin |

Regenerate every token: `node art-src/make_plant_placeholders.mjs`

## Also still on borrowed art

`data/events.ts` points at 16 `event-*.jpg` illustrations that were not audited in this pass.
Check their provenance before release — the `event-*.webp` versions removed alongside the
unit art came from the same wiki, so the `.jpg` ones deserve a look.
