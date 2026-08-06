# Art still to be made

33 tokens still render a generated placeholder from `public/img/placeholder/` — all of them
plants, zombies and board props. Most replaced artwork taken from the Plants vs. Zombies wiki;
the originals are parked in `art-src/removed-pvz-art/` for reference only and **must not go back
into `public/`**, since shipping them is what the rename of the game and its cast was meant to
get away from.

**Done on 2026-08-04:** the four pack-#7 heroes (Thornquill, Thornshell, Chardslam, Gourdward)
and their four fusion gears now have real art. They were rendered on white and cut out with
`art-src/make_sprites.py`, which also normalises them onto the shared board geometry — 512×512,
content 474px tall, bottom edge at y=493. Their eight placeholder SVGs are still on disk but
nothing references them any more.

**Done on 2026-08-05:** all nine remaining bosses got art. Retiring them was eight edits to
`utils/icons.ts` and nothing else — which is exactly what giving each boss its own ICONS key
bought, even while every one of them was borrowing another unit's sprite.

**Nothing a player sees is on placeholder art any more (2026-08-05).** `RUNT`, `ROCK`, `GRAVE`
and the Disco dancer were the last four, and three boss second-states went in with them
(`SPRITE_VARIANTS`, utils/icons.ts). Everything still under `public/img/placeholder/` is a dead
entry: those classes live in `PLANT_DEFINITIONS` but never render, because heroes read
`HERO_SPRITES` and bench plants read `MATERIAL_SPRITES`.

**No longer true as of 2026-08-06 — five ITEM icons are visible placeholders again.** The
consumable roster grew (Brainwash Dart, Magnet Pulse, then Heal Kit and the Blight Core with the
sector-unlock system), and those four render a `public/img/placeholder/*.svg` in the item belt,
the shop shelf, the Chrono Echo offer and the sector-gift toast; Spike Trap additionally borrows
the FLOOR TEXTURE (`img/terrain/spikes.svg`) as its inventory icon. Prompts for all five are
ready in `ART-PROMPTS-ITEMS.md`, written to sit next to `item-fire-grenade.png` — same
plant-as-ordnance icon language as the six item icons that already have real art.

The set has three silhouettes so the families stay tellable apart on a crowded board:
**disc** = a unit on the board, **crest** (peaked shield) = a hero, **cog** = fusion gear.

## How to retire a placeholder

1. Make the art. Match the existing board sprites: cut out, transparent background, roughly
   512×512, dark tactical chibi, lit from the upper left. `public/img/sprite-*.png` are the
   reference — a new plant should sit next to `sprite-scrapcap.png` without looking imported.
2. Save it as `public/img/<name>.png` using the same kebab-case name as the placeholder.
3. Point that one entry in `utils/icons.ts` at the new file.

Nothing else changes, so this can be done one unit at a time. The ring colour on each token
is the role the art should read as at a glance.

## The list

| Unit | Placeholder | Ring colour reads as |
| --- | --- | --- |
| Seed Gun | `placeholder/peashooter.svg` | basic shooter |
| Ice Grenade | `placeholder/snow-pea.svg` | ice shooter |
| Repeater | `placeholder/repeater.svg` | double shooter |
| Boomerang | `placeholder/bloomerang.svg` | returning shot |
| Cactus | `placeholder/cactus.svg` | long-range shooter |
| Melon Mortar | `placeholder/melon-pult.svg` | heavy lobber |
| Cabbage Sling | `placeholder/cabbage-pult.svg` | lobber |
| Corn Mortar | `placeholder/kernel-pult.svg` | stun lobber |
| Magnet Pulse | `placeholder/magnet-pulse.svg` | utility fungus |
| Sol Cap | `placeholder/sun-shroom.svg` | sun producer |
| Shy Cap | `placeholder/scaredy-shroom.svg` | fragile fungus |
| Armor Plate | `placeholder/wallnut.svg` | wall |
| Tower Shield | `placeholder/tall-nut.svg` | tall wall |
| Spike Armor | `placeholder/endurian.svg` | thorned wall |
| Sweet Potato | `placeholder/sweet-potato.svg` | taunt / puller |
| Iron Shell | `placeholder/iron-nut.svg` | armoured wall |
| Bunker Shell | `placeholder/pumpkin.svg` | shell / armour |
| Steel Jaws | `placeholder/chomper.svg` | melee devourer |
| Bok Boxer | `placeholder/bonk-choy.svg` | melee brawler |
| Sol Battery | `placeholder/sunflower.svg` | sun producer |
| Twin Sol Battery | `placeholder/twin-sunflower.svg` | double sun |
| Stim Shot | `placeholder/coffee-bean.svg` | action refresh |
| Brainwash Dart | `placeholder/brainwash-dart.svg` | mind control |
| Parasol Leaf | `placeholder/umbrella-leaf.svg` | anti-air / cover |
| Storm Fan | `placeholder/blover.svg` | wind / push |
| Ember Log | `placeholder/torchwood.svg` | fire buff |
| Runt | `placeholder/imp.svg` | small zombie |
| Mine | `placeholder/mine.svg` | board hazard |
| Fire Grenade | `placeholder/cherry.svg` | explosive |
| Flame Strike | `placeholder/jalapeno.svg` | fire line |
| Spring Arm | `placeholder/chard-guard.svg` | knockback defender |
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
| Thornshell | `placeholder/hero-thornhide.svg` | Spike Armor — spikes facing out, melee, retaliation |
| Chardslam | `placeholder/hero-chardwall.svg` | Spring Arm — rainbow chard, red stalk, leverage / knockback |
| Gourdward | `placeholder/hero-gourdward.svg` | Bunker Shell — a hollow shell that armours somebody else |

### Fusion gear (cog token) — ✅ DONE, art landed 2026-08-04

These are the fusion materials, not units. The brief is "bio-mech walker": a small war machine
with a plant core driving it, which is why the token is a cog rather than a disc.

| Gear | Placeholder | Plant core |
| --- | --- | --- |
| Cactus gear | `placeholder/gear-cactus.svg` | Cactus |
| Spike Armor gear | `placeholder/gear-endurian.svg` | Spike Armor |
| Chard gear | `placeholder/gear-chard.svg` | Spring Arm |
| Bunker Shell gear | `placeholder/gear-pumpkin.svg` | Bunker Shell |

Regenerate every token: `node art-src/make_plant_placeholders.mjs`

## Also still on borrowed art

`data/events.ts` points at 16 `event-*.jpg` illustrations that were not audited in this pass.
Check their provenance before release — the `event-*.webp` versions removed alongside the
unit art came from the same wiki, so the `.jpg` ones deserve a look.

## 2026-08-06 — Đợt rename IP (xem NAMING.md ở gốc repo)

- Key art StartMenu (cover) đang VẼ SẴN tựa "PLANT HEROES" trong tranh — cần bản mới
  với tựa "BLIGHTFALL — The Last Garden". Trước khi có tranh mới, menu chỉ đúng khi
  không nạp cover (text logo đã đổi đúng).
- Sprite NHÀ (ô chứa mầm) giờ mang tên hiển thị "Greenspire / Tháp Xanh" — art nên
  chuyển hướng: tháp kính xanh phát sáng nuôi mầm, thay cho ngôi nhà ngoại ô.
- Tên hiển thị đổi hàng loạt nhưng TÊN FILE sprite giữ nguyên (đổi ở Phase 2 cùng ID).
