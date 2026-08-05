# Credits

## Terrain textures

The tile textures in `public/img/terrain/` are built from [game-icons.net](https://game-icons.net)
glyphs by `art-src/make_terrain_textures.mjs`. The full source library lives in
`art-src/game-icons/` (4239 SVGs) — its own `license.txt` there names every contributor.

Licensed **CC BY 3.0**. Attribution is required, so this section must ship with the game.

| Terrain | Icon | Artist |
| --- | --- | --- |
| Lawn | high-grass | Delapouite |
| Water | waves | Lorc |
| Concrete | stone-path | Delapouite |
| Lava | lava | Sbed |
| Ice Sheet | snowflake-2 | Lorc |
| Sand | desert | Delapouite |
| Mountain | mountains | Lorc |
| Power Tile | energise | Lorc |
| Smoke Screen | dust-cloud | Lorc |
| Blaze | flame | Carl Olsen |
| Barrier | brick-wall | Delapouite |
| Bridge | packed-planks | Delapouite |
| Minecart Track | rail-road | Delapouite |
| House (with brain) | modern-city + brain | Delapouite, Lorc |
| House (emptied) | modern-city | Delapouite |

Artists: **Lorc** (lorcblog.blogspot.com), **Delapouite** (delapouite.com),
**Sbed** (opengameart.org/content/95-game-icons), **Carl Olsen** (twitter.com/unstoppableCarl).

## Placeholder unit tokens

Every token in `public/img/placeholder/` is built by `art-src/make_plant_placeholders.mjs` from
the same **CC BY 3.0** game-icons.net library, so the same attribution applies. The glyphs used,
grouped by artist:

| Artist | Icons |
| --- | --- |
| Delapouite | attached-shield, boomerang, cabbage, cactus, carnivorous-plant, chili-pepper, coffee-beans, corn, handheld-fan, hexagonal-nut, mecha-head, monstera-leaf, mushrooms, potato, pumpkin, shambling-zombie, shield-bash, sunflower, watermelon |
| Lorc | acorn, cluster-bomb, fist, land-mine, lever, magnet, shield-reflect, snowflake-2, spiked-shell, sprout, thorned-arrow, thorny-vine, umbrella, vortex |
| Carl Olsen | flame |

These are placeholders; each row disappears from this table as real art replaces the token that
used it, and the list is regenerated from the `UNITS`/`HEROES`/`GEAR` tables in that script.

## Audio

Everything in `public/audio/` is **CC0** — no attribution is required, but these people made
it and gave it away, so they are named here anyway. `art-src/install_audio.mjs` is the script
that selected and renamed the files; it documents which source file became which game sound.

| Pack | Author | Used for | License verified at |
| --- | --- | --- | --- |
| Bleeps and Bloops | Cosmo Myzrail Gorynych (CoMiGo) | combat, board events, stingers | comigo.itch.io/bleeps-n-bloops |
| Short Music Loops | Cosmo Myzrail Gorynych | the four music tracks (menu, prologue, map, combat) | comigo.itch.io/music-loops |
| Simple Jingles | Cosmo Myzrail Gorynych | victory stinger | comigo.itch.io/simple-jingles |
| Free Natural UI SFX | Cici Fyre | the UI click | cicifyre.itch.io/free-natural-sfx-pack |
| RPG Audio | Kenney Vleugels | coins, item use, the spike field | license file shipped in the pack |

Each of the itch.io pages above states **Creative Commons Zero v1.0 Universal** as the asset
license; that was checked directly rather than inferred from the mirror the files came from.

## Character and cover art

AI-generated for this project; sources kept in `art-src/`.
