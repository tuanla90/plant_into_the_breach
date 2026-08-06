# PROMPTS ICON VẬT PHẨM (COMBAT ITEMS)

> Bộ icon vật phẩm dùng trong khay đồ (HUD), shop, camp, Vọng Ảnh Thời Gian và toast quà vùng đất.
> 6 icon đầu đã có art thật (`public/img/item-*.png`); file này là prompt cho **5 icon còn thiếu**,
> viết để đứng cạnh `item-cherry-bomb.png` mà không lệch tông: *cây cỏ được chế thành quân cụ* —
> outline đậm, cel-shade dày, phụ kiện thép đinh tán, lõi phát sáng.
>
> 📌 **Quy trình sau khi sinh ảnh** (giống mọi sprite khác — xem ART-TODO.md):
> 1. Sinh ảnh vuông, cắt nền trong suốt, lưu `public/img/item-<tên>.png` (512×512).
> 2. Trỏ đúng MỘT entry trong `utils/icons.ts` → `ITEM_SPRITES` sang file mới.
> 3. Không sửa gì khác.
>
> | Icon cần làm | File đích | Entry ITEM_SPRITES | Hiện đang dùng |
> |---|---|---|---|
> | Nấm Thôi Miên | `img/item-hypno-shroom.png` | `HYPNO_SHROOM` | placeholder svg |
> | Nấm Nam Châm | `img/item-magnet-shroom.png` | `MAGNET_SHROOM` | placeholder svg |
> | Lô Hội | `img/item-aloe.png` | `ALOE` | placeholder svg |
> | Nấm Nguyên Tử | `img/item-doom-shroom.png` | `DOOM_SHROOM` | placeholder svg |
> | Cỏ Gai | `img/item-spikeweed.png` | `SPIKEWEED` | mượn texture sàn `terrain/spikes.svg` |

---

## 🎨 KHỐI PHONG CÁCH BẮT BUỘC (dán vào đầu MỌI prompt icon vật phẩm)

```
STYLE: single game inventory item icon, 512x512, fully transparent background, one centered
object filling ~80% of the frame, three-quarter view. Bold clean dark outlines, rich
cel-shading with soft 3D volume, lit from the upper-left. Dark-tactical redesign of a cute
plant: a FRUIT/PLANT re-engineered as military ordnance — riveted gunmetal fittings, weathered
steel bands, glowing energy accents, pull-ring pins where it fits. Matches an existing set of
"plant grenade" icons (twin cherry bombs with cracked magma shells and riveted steel collars).
NO text, NO letters, NO background, NO ground shadow, NO faces, NO hands.
```

---

### `item-hypno-shroom.png` — Nấm Thôi Miên (65 Xu)
```
PROMPT: A sinister mushroom re-engineered as a psychic emitter: a plump mushroom cap painted
with a glowing hypnotic double-spiral in magenta and deep violet, the spiral faintly pulsing;
the stem is clamped in a riveted gunmetal collar sprouting two small antenna vanes, with thin
concentric ring-waves radiating outward from the cap to suggest mind control. Sickly mystical
mood. Accent color #e879f9.
```

### `item-magnet-shroom.png` — Nấm Nam Châm (50 Xu)
```
PROMPT: A mushroom re-engineered as an industrial electromagnet: the cap is a thick horseshoe
magnet in gunmetal grey with glowing cyan coil windings at both poles, mounted on a squat
organic mushroom stem bolted into a riveted steel base; small scraps of zombie gear — a dented
metal bucket, a bolt, a shard of helmet — levitate toward the poles along faint cyan magnetic
field arcs. Accent color #38bdf8.
```

### `item-aloe.png` — Lô Hội (50 Xu)
```
PROMPT: An aloe vera plant re-engineered as a battlefield medic kit: a cluster of thick spiky
aloe leaves rising from a riveted gunmetal canister pot with a carry handle, one leaf sliced
open and oozing a single large luminous emerald drop of healing gel; soft green restorative
glow around the drop, tiny steel clamps holding the cut leaf. Calm, clean, reassuring among
weapons. Accent color #4ade80.
```

### `item-doom-shroom.png` — Nấm Nguyên Tử (125 Xu)
```
PROMPT: A doom mushroom re-engineered as a nuclear warhead: a bulbous deep-purple mushroom cap
shaped like a bomb dome, wrapped in a hazard-striped steel band (yellow-black chevrons, no
letters), small vent fins on the sides; an ominous violet-white core glows through jagged
cracks in the cap, faint radiation shimmer and tiny floating spores around it. Heavy, dark,
menacing — visibly the most dangerous item in the set. Accent color #a855f7.
```

### `item-spikeweed.png` — Cỏ Gai (35 Xu)
```
PROMPT: A spikeweed re-engineered as a deployable caltrop trap: a compact coiled bundle of
organic thorned vines reinforced with steel barbs and riveted joints, folded like a throwable
bear-trap with a pull-ring pin on top; several thorn tips catch the light with sharp glints,
one vine slightly unsprung to show it is ready to snap open. Accent color #84cc16.
```
