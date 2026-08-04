# Downloaded asset packs

Source material only — nothing here is served to the browser. Copy what you use into
`public/img/` and credit it in `/CREDITS.md`.

## Why these and not kenney.nl

`kenney.nl` and `opengameart.org` both answer **HTTP 503 behind a corporate filter** on this
machine (the same class of block that made the game stop hotlinking wiki CDNs — see the note at
the top of `utils/icons.ts`). GitHub is reachable, so these packs came from GitHub mirrors
instead. To pull from Kenney directly you have to download it yourself off-network.

| Folder | Source | License |
| --- | --- | --- |
| Seasonal Tilesets | `ct-js/bundled-assets` (GrafxKid) | CC0 — `LICENSE.txt` included |
| Kenney's Splats | `ct-js/bundled-assets` | CC0 — `License.txt` included |
| Kenney's Game Icons | `ct-js/bundled-assets` | CC0 — `license.txt` included |
| Kenney's Generic Items | `ct-js/bundled-assets` | CC0 — `License.txt` included |
| Kenney's Particle Pack | `ct-js/bundled-assets` | CC0 by Kenney's blanket policy, but **this copy shipped without a license file** — verify at kenney.nl before commercial release |
| Superpowers medieval HUD | `sparklinlabs/superpowers-asset-packs` | CC0 1.0 — `LICENSE.txt` included |

`Flat Nature Assets` was in the same mirror and was **deliberately not kept**: no license file,
no named author. Not worth the risk.

## Not downloaded, but there and free

`ct-js/bundled-assets` also carries a `sounds/` tree (Kenney's RPG Sounds, Natural UI SFX,
music loops). The game has no audio layer yet, so pulling them in would have been dead weight.

## Style warning

These are pixel art. The unit and hero art in this project is soft-shaded AI illustration —
dropping a pixel tileset onto the board next to it reads as two different games. The safe uses
are the ones that do not sit beside a character sprite: splats and particles for hit FX, HUD
frames, item icons for the shop.

The terrain textures in `public/img/terrain/` avoid the clash a different way — they are
monochrome vector glyphs tinted by `TerrainDefinition.baseColor`, so they inherit the palette
instead of importing someone else's. See `../make_terrain_textures.mjs`.
