# Art still to be made

30 units currently render a generated placeholder token from `public/img/placeholder/`.
They replaced artwork taken from the Plants vs. Zombies wiki — the originals are parked in
`art-src/removed-pvz-art/` for reference only and **must not go back into `public/`**, since
shipping them is what the rename of the game and its cast was meant to get away from.

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

Regenerate every token: `node art-src/make_plant_placeholders.mjs`

## Also still on borrowed art

`data/events.ts` points at 16 `event-*.jpg` illustrations that were not audited in this pass.
Check their provenance before release — the `event-*.webp` versions removed alongside the
unit art came from the same wiki, so the `.jpg` ones deserve a look.
