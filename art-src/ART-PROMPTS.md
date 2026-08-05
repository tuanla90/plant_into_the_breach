# Prompt sinh art — hero · gear · boss

> File này để dán thẳng vào công cụ sinh ảnh. Mỗi mục ghi rõ **tên file đích**, nên làm xong
> chỉ việc lưu đúng tên rồi trỏ một dòng trong `utils/icons.ts` — không đổi gì khác.
>
> Quy trình thay placeholder: `art-src/ART-TODO.md`. Danh sách còn thiếu: mục cuối file này.

## Hai luật không được phá

**1. Nhắc tới Plants vs. Zombies CHỈ dưới dạng PHỦ ĐỊNH.** Đây là chỗ bản đầu của file này viết
sai chiều: nó cấm tiệt. Nhưng prompt thật đã sinh ra Sunspot lại ghi *"Must NOT look like the
original Plants vs Zombies character"* — và đó là ràng buộc **tránh xa**, ngược hẳn với sao chép.
Nói ra để máy biết mà né còn hiệu quả hơn im lặng rồi để nó tự trôi về nguyên mẫu.

Cấm là cấm **đưa art gốc vào `public/`** — nó nằm trong `art-src/removed-pvz-art/` chỉ để tham
khảo, và đưa lại vào là xoá sạch ý nghĩa của việc đổi tên cả game lẫn dàn nhân vật. Prompt thì
mô tả **hình dáng và chức năng**, cộng một câu phủ định.

**2. Dán KHỐI PHONG CÁCH bên dưới vào MỌI prompt.** Sinh ảnh từng con một mà không có khối này
thì sau mười con sẽ ra mười phong cách khác nhau, và lỗi đó chỉ lộ ra khi xếp chúng cạnh nhau
trên bàn cờ — lúc đó phải làm lại từ đầu.

---

## KHỐI PHONG CÁCH (bắt buộc, dán vào mọi prompt)

Rút ra từ hai prompt thật đã sinh ra Cobb và Sunspot. Hero có khuôn đầy đủ riêng ở mục 1; khối
này là bản rút gọn cho **gear** và **boss**.

```
STYLE: chibi tactical trading-card illustration, square 1:1, dark military war-room diorama.
Subject stands on a hexagon-tiled diorama plinth with layered wood-and-steel edges, floating
holographic UI panels around it, thin corner brackets framing the card, blurred blue monitor
banks in the dark background.

Bold black ink outlines, flat cel shading, comic/vector game-art look, chunky readable
silhouette. Strong warm rim light from the upper left against a cold dark blue-black room.
Muted earthy base colours, HIGH CONTRAST, ONE saturated accent colour for eyes, trim and glow.

A SOLDIER FIRST, A PLANT SECOND: the armour plating is MADE OF the plant — its texture runs
across the plates — over ordinary tactical webbing, pouches and worn fabric.

Glowing visor-like eyes in the accent colour. NO round cartoon eyes, NO cute smile, no visible
plant face: a helmet, a mask or a wrapped face covering, always. Keep only the plant's core
silhouette and colours as inspiration; it must NOT look like the Plants vs Zombies character it
started from.

A few large shapes, never a texture of small ones — anything repeated more than about six times
(studs, spikes, rivets) becomes noise at 48 pixels. Not painterly, not airbrushed, no glossy
toy plastic. No watermark, no signature.
```

> **Phép thử duy nhất đáng tin:** đặt cạnh `public/img/sprite-cobb.png` và
> `public/img/sprite-conehead.png`. Lệch tỉ lệ, lệch độ dày nét, hay nhiều chi tiết hơn — là
> lệch, dù bản thân bức ảnh đẹp.

| Họ | Sinh ra | Ship vào game |
|---|---|---|
| **Hero** | thẻ 1:1 có nền + HUD | sprite cắt rời, nền trong suốt |
| **Gear (nguyên liệu)** | 512×512 | nền trong suốt — cỗ máy nhỏ có lõi thực vật lái |
| **Boss** | 512×512 | nền trong suốt — to hơn quân thường rõ rệt |

## Ra sai thì kéo cần nào

Ba bản prompt đầu của file này hỏng theo ba kiểu khác nhau. Ghi lại để không lặp lại.

| Triệu chứng | Nguyên nhân thật | Kéo cần |
|---|---|---|
| **Quá gai góc, như lính lùn thật** | prompt tả *"plant armoured with steel plate"* — **cây trước, lính sau**, nên máy vẽ một cục giáp | đảo trật tự: **"a chibi soldier built from X"**, cây là **vật liệu của giáp** |
| **Quá chibi, đầu bi thân que** | ép *"head is the widest shape"* + *"thin limbs"* + cắt hết đồ lính | bỏ luật "đầu rộng nhất"; giữ **đủ bộ đồ lính**, thân chắc, tay dày |
| **Mặt cây dễ thương** | thiếu lệnh chống-dễ-thương | **`NO round cartoon eyes, NO cute smile`** + luôn có mũ/mặt nạ, mắt là **khe visor phát sáng** |
| Nét như tranh vẽ kỹ | chữ *painterly / rendered* | **viền đen dày, tô phẳng** |
| Đứng đơ | không tả dáng | dáng **lệch trọng tâm, đang giữa động tác** |
| Bạc màu | "muted" bị hiểu thành nhợt | **nền tối trầm nhưng TƯƠNG PHẢN CAO** + một màu nhấn thật bão hoà |

> Chữ nào lặp lại thì máy nhân nó lên: tả "gai" ba lần sẽ nhận về một con nhím, cắt đồ lính đi
> sẽ nhận về một que kem. Nói **một lần, kèm số lượng**.

---

# 1 · HERO

Bốn hero còn thiếu art. Mẫu dưới đây **dựng lại từ hai prompt thật đã sinh ra Cobb và Sunspot** —
đó là nguồn chuẩn duy nhất, vì kết quả của chúng đang nằm trong `public/img/`.

### Quy trình: sinh THẺ, ship SPRITE

Art hiện có được sinh dưới dạng **thẻ vuông có nền** (bệ lục giác, phòng chỉ huy tối, panel
hologram, thanh HUD), rồi **cắt rời** thành sprite nền trong suốt cho bàn cờ. Cả hai đều tồn tại:
`hero-cobb.jpg` là thẻ, `sprite-cobb.png` là bản cắt.

Giữ đúng quy trình đó — nền tối và bệ diorama là thứ đẩy máy vẽ ra **rim light mạnh và bóng đổ
chắc**, và đó chính là cái làm sprite đọc được ở 48px. Sinh trên nền trắng trơn cho ra hình bẹt hơn.

| Bước | Ra cái gì | Dùng ở đâu |
|---|---|---|
| 1. Sinh bằng prompt dưới đây | thẻ 1:1 có nền + HUD | `hero-*.jpg` |
| 2. Cắt rời nhân vật, xoá nền | sprite nền trong suốt | `sprite-*.png` ← **thứ game vẽ ở mọi nơi** |

---

## KHUÔN CHUNG — dán y nguyên vào cả bốn prompt

```
STYLE (keep identical across all characters):
- Chibi tactical soldier trading card illustration, square 1:1.
- Full body, 3/4 view, chibi proportions (large head, short stocky body), single character
  centred, standing on a hexagon-tiled diorama plinth with layered wood-and-steel edges.
- Dark military sci-fi redesign: layered armour plating whose MATERIAL is the plant itself,
  over tactical webbing, pouches and worn fabric. A soldier first, a plant second.
- Bold black ink outlines, flat cel shading, comic/vector game-art look. Chunky readable
  silhouette. Strong warm rim light from the upper left against a cold dark blue-black room.
- Background: dark tactical command room, blurred monitor banks, floating holographic UI
  panels, thin corner brackets framing the card, subtle depth blur.

IMPORTANT — the face:
- Glowing visor-like eyes in the accent colour. NO round cartoon eyes, NO cute smile, no
  visible plant face. A helmet, a mask or a wrapped face covering, always.
- Keep only the plant's core silhouette and colours as inspiration. It must NOT look like the
  Plants vs Zombies character it started from.
```

> Khối `IMPORTANT` là cái cần chống-dễ-thương. Thiếu nó thì ép tỉ lệ chibi bao nhiêu cũng ra mặt
> cây cười toe — đúng lỗi của bản prompt trước.

**Thanh HUD** — mỗi hero một dòng, đặt ngang đầu thẻ, chữ in hoa nén:

```
HUD: thin bar across the top of the card in condensed uppercase type reading exactly
"<DÒNG CỦA HERO>". Small floating holo panels at the sides with tiny illegible technical
greeble.
```

> Chữ HUD **chỉ sống trên thẻ**. Sprite ship ra game là bản đã cắt, không có nó — nên chữ tiếng
> Anh nướng vào ảnh không bao giờ chạm tới giao diện tiếng Việt.

---

## 1.6 Thornquill — `hero-thornquill.jpg` → `sprite-thornquill.png`

| | |
|---|---|
| **Cây** Cactus · **Vai** tầm xa · **Accent** `#22c55e` |
| **Máu / Sát thương / Di chuyển** 6 · 1 · 2 |
| **Đánh thường** *Bắn Gai* — xuyên suốt cả hàng, miễn phí |
| **Kỹ năng** *Tường Gai* — bắn xuyên, để lại **gai trên mặt đất** 2 lượt |

```
CHARACTER: a lean chibi soldier built from cactus. Armour plates of thick ribbed cactus flesh
over dark tactical webbing, dotted with small areoles. Combat helmet with a swept-back crest of
FOUR OR FIVE long hardened spines like a plume — that crest is the silhouette signature.
Angular visor with glowing acid-GREEN eyes and a lower face wrap. Bandolier of long needle
rounds across the chest, spine quiver on the hip. Crouched low behind a long improvised
marksman rifle whose barrel is a single fused spine, one knee down, already sighting down it.

BASE: hex plinth of cracked desert hardpan and dry scrub, spent needle casings scattered, a low
sandbag rest under the rifle barrel.

PALETTE: cactus green, pale sage, sun-bleached tan, dark gunmetal, acid-green glow.

HUD: "UNIT ID: CTS-7  //  STATUS: OVERWATCH  //  AMMO: SPINE RAILS [06/06]"
```

## 1.7 Thornhide — `hero-thornhide.jpg` → `sprite-thornhide.png`

| | |
|---|---|
| **Cây** Endurian (sầu riêng) · **Vai** cận chiến · **Accent** `#b45309` |
| **Máu / Sát thương / Di chuyển** 10 · 2 · 2 |
| **Đánh thường** *Quật Gai* — **phản 2 sát thương** lên ai đánh cận chiến |
| **Kỹ năng** *Khiêu Khích* — mọi địch trong 3 ô buộc phải nhắm vào anh ta |

```
CHARACTER: a squat, enormously broad chibi assault trooper built from durian. Armour of thick
husk plate studded with a dozen BIG BLUNT SPIKES — largest across the pauldrons and the helmet
crown, few enough to count at a glance. Heavy visored helmet built into the husk, glowing
burnt-AMBER eyes deep under the brim, lower face wrapped. Full kit: gorget, chest rig, webbing
belt, knee pads, heavy boots, a tattered cloak. No neck, oversized armoured fists, no ranged
weapon at all. Leaning forward off one leg, one fist raised in a come-and-get-it beckon,
dented and scarred all over — this thing wins by BEING HIT.

BASE: hex plinth of churned mud and broken duckboard, splintered barricade stumps, deep boot
prints, a scatter of snapped-off spikes.

PALETTE: burnt husk brown, ochre, moss green, dark iron, amber glow.

HUD: "UNIT ID: EDR-8  //  STATUS: TAUNTING  //  ARMOR: THORN PLATE [100%]"
```

## 1.8 Chardwall — `hero-chardwall.jpg` → `sprite-chardwall.png`

| | |
|---|---|
| **Cây** Chard Guard (cải cầu vồng) · **Vai** khống chế vị trí · **Accent** `#ef4444` |
| **Máu / Sát thương / Di chuyển** 8 · **0** · 3 |
| **Đánh thường** *Vung Ngược* — **0 sát thương**, hất lùi 2 ô |
| **Kỹ năng** *Càn Quét* — hất mọi địch kề bên 2 ô cùng lúc |

```
CHARACTER: a broad-shouldered chibi riot guard built from rainbow chard. Armour of overlapping
dark-green crinkled leaf plates, with a thick vivid RED stalk running up the spine and branching
as glowing veins through every plate — that red vein network is the silhouette signature.
Helmet with a wide riot visor, glowing RED eye slit, lower face wrapped. Both oversized hands
grip huge padded paddle-shaped leaf shields built for SHOVING — NO blade, NO point, NO cutting
edge anywhere on this character, and no gun. Braced wide-legged, weight low, shoulder driving
forward mid-push.

BASE: hex plinth of wet dock boards at a waterline, one bollard, coiled rope, a scuff of skid
marks where something heavy was shoved off the edge.

PALETTE: deep chard green, crimson stalk red, wet slate, dark gunmetal, red glow.

HUD: "UNIT ID: CHG-9  //  STATUS: BRACED  //  FORCE: KINETIC RAM [02 TILES]"
```

## 1.9 Gourdward — `hero-gourdward.jpg` → `sprite-gourdward.png`

| | |
|---|---|
| **Cây** Pumpkin · **Vai** hỗ trợ · **Accent** `#f97316` |
| **Máu / Sát thương / Di chuyển** 8 · 1 · 3 |
| **Đánh thường** *Đập Vỏ Bí* — 1 sát thương |
| **Kỹ năng** *Bọc Giáp* — cho **đồng đội** 3 khiên, không mất khi hết lượt |

```
CHARACTER: a stocky chibi shield-bearer built from pumpkin. Armour of thick carved pumpkin rind
over tactical webbing. A hollow carved pumpkin over-shell is strapped on as a backpack, cracked
open down the front, warm ORANGE light spilling out of the cavity — that shell is the silhouette
signature. Helmet with a carved jack-o-lantern faceplate, glowing orange slits for eyes, no
mouth. SPARE cut rind plates racked on the back and hips, clearly meant to be handed to someone
else. Both arms held open and outward in a sheltering gesture, not a fighting one; a short
blunt rind cudgel hangs unused at the belt.

BASE: hex plinth of cracked concrete with a low barricade of stacked rind plates, one plate
half-fitted onto an empty allied marker beside him.

PALETTE: pumpkin orange, deep rind ochre, vine green, dark gunmetal, warm orange glow.

HUD: "UNIT ID: PMK-10  //  STATUS: SHIELDING  //  RIND: SPARE PLATES [03/03]"
```

---

## Năm hero đã có art

Chỉ dùng nếu muốn làm lại cả bộ. Chỉ số để đối chiếu.

| Hero | File | Máu/Dmg/Move | Bản sắc | Accent |
|---|---|---|---|---|
| Shadeleaf | `sprite-green-shadow.png` | 6 · 2 · 3 | xạ thủ đậu, bắn xa nhất bộ — đạn **dừng ở vật cản đầu tiên, kể cả cây nhà** | `#4ade80` |
| Ironhusk | `sprite-wall-knight.png` | 10 · 1 · 2 | tường chắn hành lang; cú đập là để **đẩy**, không phải để giết | `#f59e0b` |
| Sunspot | `sprite-solar-flare.png` | 6 · **0** · 2 | không tự vệ được, phải hộ tống; nuôi kinh tế Mặt Trời | `#fb923c` |
| Maw | `sprite-chompzilla.png` | 8 · 2 · 3 | nuốt trọn mục tiêu, rồi **đứng không 2 lượt tiêu hoá** | `#d946ef` |
| Cobb | `sprite-cobb.png` | 8 · 2 · 2 | máy ném ngô — người duy nhất **bắn vòng cầu qua đầu tường nhà mình** | `#eab308` |

---

# 2 · GEAR (nguyên liệu fusion)

**Không phải quân trên bàn cờ.** Đây là cỗ máy chiến tranh nhỏ có một lõi thực vật ngồi lái —
người chơi mang ra trận làm quân dự bị, hoặc nướng vào hero để ghép đặc tính.

**Khung hình — gear:**
```
FRAMING: single object cut-out, 512x512, fully transparent background. Three-quarter view.
A small one-purpose bio-mech walker: squat armoured chassis on short legs or treads, with a
living plant core visible in a glass or caged compartment at its centre. Machine on the
outside, plant on the inside. No character face, no background, no shadow.
```

### `gear-cactus.png`
```
Core: a cactus. The chassis is a spine launcher — a long rifled barrel and a hopper of loose
spines feeding into it, ammunition visible. Legs are braced like a tripod for a stationary
shot. Accent #22c55e.
```

### `gear-endurian.png`
```
Core: a durian. The chassis is a reactive armour shell — angled plates studded with outward
spikes, mounted on shock absorbers so the whole hull can slam outward. Built to be struck.
No weapon of its own. Accent #b45309.
```

### `gear-chard.png`
```
Core: a chard plant with a red stalk. The chassis is a piston ram — a wide flat pusher plate on
a hydraulic arm, coiled springs along the shaft. Blunt, no cutting edge anywhere. Heavy
counterweight at the rear. Accent #ef4444.
```

### `gear-pumpkin.png`
```
Core: a pumpkin. The chassis is a shield dispenser — a rack of curved carved shell plates on a
projecting arm that offers them outward, away from the machine. It armours what stands beside
it, not itself. Accent #f97316.
```

### Sáu gear đã có art
`gear-peashooter.png` · `gear-sunflower.png` · `gear-wallnut.png` · `gear-chomper.png` ·
`gear-corn.png` · `gear-snow-pea.png`

> ⚠ **`gear-snow-pea.png` đang treo.** Hero băng (Frostpod) đã bị gỡ khỏi roster để nhập vào
> **nguyên tố BĂNG**, nên gear Snow Pea giờ dư ra — 10 gear cho 9 hero — và `PLAN-progression.md`
> đề nghị bỏ hẳn vì nó trùng trục với nguyên tố băng. **Đừng đặt art mới cho nó trước khi chốt.**

---

# 3 · BOSS

Boss là **sprite bàn cờ**, không phải thẻ. Chúng phải to hơn quân thường rõ rệt và đọc được ngay
lập tức là "thứ này khác loại" — nhưng vẫn cùng một phong cách.

**Khung hình — boss:**
```
FRAMING: single character cut-out, 512x512, fully transparent background. Three-quarter view,
facing slightly left, feet on an invisible ground line at the bottom of the frame. Fills more of
the frame than an ordinary unit — imposing silhouette, readable as a boss from its outline alone.
No base, no shadow, no background.
```

Mọi boss đều là **zombie** — dùng chung ngôn ngữ tạo hình với `sprite-*.png` của zombie thường:
da xám xanh tái, quần áo rách, phần cơ thể lộ xương, và **thứ đồ vật nó mang theo mới là nhận
diện chính**.

> **Hai con cần HAI file**, vì chúng đổi trạng thái thật trong code chứ không phải đổi hiệu ứng:
> The Armada (bay → xác tàu) và Sandreaver (đứng → ụ cát). Nếu chỉ làm một file cho mỗi con thì
> bàn cờ sẽ nói dối đúng vào lượt cơ chế của chúng diễn ra.
>
> **Trỏ art vào code:** mỗi boss có sẵn một khoá riêng trong `utils/icons.ts` (`IRONCART`,
> `SANDREAVER`, `YETI`, …) đang mượn sprite của quân thường. Làm xong một con thì sửa **đúng một
> dòng** ở đó — không đụng `data/zombies.ts`.

---

## Stage I — The Green Belt

### `sprite-ironcart.png` — **Ironcart** *(Goldacre)*
Nã bạn từ **bốn ô**, và **chỉ đi được trên đường ray** — bắn xong thì lùi dọc ray.
```
A rail-borne siege engine. A hunched corpse harnessed into the frame of a scrap-built catapult
bolted to a MINECART on flanged steel rail wheels — the machine and the body share a chassis,
straps biting into dead shoulders. Torsion springs, a loaded throwing arm cocked back, a hopper
of debris. A brake lever and a coupling hook at each end, because it runs backwards as readily
as forwards. Small head, enormous machine. The silhouette must say ARTILLERY ON RAILS: no
steering, no legs doing the work, nothing that could leave the track. Accent: rust orange.
```
> **Đổi so với bản cũ:** bản cũ ghi *"rusted farm cart"*. Trong code nó là `movementType: 'RAIL'`
> — nó **chỉ vào được ô `RAIL`** và cách phá là cắm một cây lên ray để cắt đường lùi. Bánh xe
> nông trại lăn được mọi nơi thì mâu thuẫn với chính cơ chế đó.

### `sprite-cinder-colossus.png` — **Cinder Colossus** *(Kiln Row)* — trả nguyên tố **LỬA**
Đốt cháy mặt đất nó đi qua.
```
A kiln-bodied giant. Enormous slag-crusted zombie whose torso is a broken brick furnace, chest
cavity open and glowing white-hot from inside, cracks of molten light running through blackened
skin. Cinders trailing off its shoulders. Feet are heavy slag blocks that leave scorch marks.
Massive, slow, unstoppable. Accent: ember orange #f97316 from within the cracks.
```

## Stage II — The Far Shore

### `sprite-armada.png` — **The Armada** *(Windward)* — bay qua đầu mọi bức tường
Nó có **ba khoang khí**, mỗi lượt bị đánh mất một. Hết khoang thì **rơi**.
```
A flying flotilla zombie. EXACTLY THREE patched gas cells — three distinct, countable balloons
of different sizes roped together, not an indistinct cluster — carrying a small grinning zombie
in a slung canvas harness beneath. Sandbags, grappling hooks and cut rope ends dangle below. It
is entirely airborne: nothing in the silhouette touches the ground. Accent: pale sky blue
#38bdf8 on the balloon seams.
```
> **Ba, đếm được, là yêu cầu cơ chế chứ không phải thẩm mỹ.** Ba khoang khí là một cái đồng hồ
> đếm ngược ba lượt, và người chơi phải đọc được nó. Một chùm bóng mờ nhoè thì con số biến mất.

### `sprite-armada-wreck.png` — **The Armada, xác tàu** — ⚠ **asset thứ hai, chưa có trong bản cũ**
Sau khi hết khoang: `WALKING`, di chuyển 1, sát thương 4, và **đẩy được** — cú hất xuống biển
là cách kết liễu nó.
```
The same flotilla zombie, CRASHED. The three gas cells are burst and hanging in shredded
rubber rags off a bent frame; the canvas harness has become a dragging shell around a zombie
now standing on the ground, hunched under the weight of its own wreckage. One arm swings a
torn mooring hook as a club. Trailing rope and sandbags snagged behind it. Same character,
same palette, unmistakably the same unit after the fall — heavier, lower, angrier, and for the
first time touching the ground. Accent: pale sky blue #38bdf8, now dulled and torn.
```
> Cần asset riêng vì đây là **thay đổi trạng thái thật trong code**, không phải hiệu ứng: unit
> đổi `movementType`, mất miễn nhiễm, đổi chỉ số. Dùng lại sprite bay cho một thứ đang nằm dưới
> đất sẽ nói dối đúng cái điều trận đấu vừa dạy.

### `sprite-sandreaver.png` — **Sandreaver** *(Thornwaste)*
Độn thổ, trồi lên **sau lưng** tuyến phòng thủ của bạn.
```
A burrowing zombie. Lean, wiry corpse built for tunnelling: oversized clawed digging hands,
head wrapped in a dust-caked cowl, goggles opaque with grit. Body still half-clad in packed
sand and dry root matter as if it has just surfaced. Coiled forward crouch, low to the ground,
already aiming at somewhere behind you. Accent: dry sand ochre.
```

### `sprite-sandreaver-mound.png` — **Sandreaver, lúc đang lặn** — ⚠ **asset thứ hai, chưa có trong bản cũ**
Một lượt trong hai nó **ở dưới đất và không thể bị nhắm tới**, nhưng bốn ô quanh nó đã sáng số.
```
A sand mound, no creature visible. A low oval swell of disturbed dry sand pushed up from
beneath, cracked across the crown, a few dry roots and grit thrown clear around the rim. Faint
dust still settling. Read as GROUND, not as a body: no eyes, no limbs, nothing that suggests a
target. It must be obvious that something is under it and obvious that there is nothing to
shoot. Accent: dry sand ochre.
```
> Bắt buộc phải có. Trong code `isBurrowed` **ẩn hẳn sprite**, nên nếu không có ụ cát thì ô đó
> trông như đất trống — trong khi bốn ô quanh nó đang sáng đỏ. Người chơi sẽ thấy một lời cảnh
> báo không có tác giả, và đó là lý do người ta không tin telegraph nữa.

### `sprite-yeti.png` — **Yeti** *(Frostgate)* — trả nguyên tố **BĂNG**
Đóng băng mọi thứ ném vào nó.
```
A frost-locked hulk. Huge shaggy zombie sheathed in a rind of blue-white ice, frozen matted
fur, icicles hanging from its arms and jaw. Frost creeping outward from its footprints. One
shoulder encased in a solid block of ice. Breath visible as a cold plume. Accent: ice blue
#38bdf8 glowing from deep inside the ice rind.
```

## Stage III — The City

### `sprite-headliner.png` — **The Headliner** *(Neon Rose)*
Không bao giờ tự tay chạm vào bạn — nó biến **cả đám đông** thành mối nguy.
```
A stage-performer zombie. Wiry showman in a shredded sequinned jacket, one arm raised holding a
battered microphone up like a conductor's baton, the other sweeping outward to command an
unseen crowd. Cracked speaker stacks strapped to its back, cables trailing. Theatrical pose, no
weapon — the threat is what it makes OTHERS do. NOT a heavy: this one is slim enough that a
shove would move it. Accent: hot neon pink #f472b6 in the sequins and speaker glow.
```

### `sprite-clockjaw.png` — **Clockjaw** *(Old Quarter)*
Hành động **hai lần mỗi lượt** — sát thương của nó không cách nào ngăn kịp.
```
A clockwork zombie. Corpse rebuilt around an exposed brass clock mechanism in its open chest —
escapement, mainspring, gear train all visible and turning. Two sets of arms, offset, so it
always has one mid-swing while the other resets. Jaw is a hinged steel bear-trap driven by a
cam. Everything about it says SECOND ACTION. Accent: brass gold on the movement.
```

### `sprite-voltmaw.png` — **Voltmaw** *(The Grid)* — trả nguyên tố **ĐIỆN**
Cú giật của nó **lan suốt cả hàng** cùng lúc.
```
An electrical zombie. Corpse strung with scavenged power cabling and improvised capacitor
banks, copper contacts bolted through its arms, an arc gap crackling between two prongs where
its lower jaw should be. Live wires whip outward from its back, reaching for the next
conductor. Hunched and twitching under its own current. Accent: electric yellow #facc15
arcing between the contacts.
```

## The Breach

### `sprite-blightlord.png` — **Blightlord** *(The Breach)*
Kẻ đã đi ngược thời gian. Thứ cuối cùng còn đứng.
```
The final commander. Tall, upright, unhurried — the only zombie in the game with posture. A
long ragged coat of stitched flags and banners taken from every city that fell, each one a
different faded colour. Face hidden inside a deep hood; beneath it, no features, just a slow
green rot-light. One hand rests on a staff wound with dead vines. Everything about the
silhouette should read as AUTHORITY rather than hunger — this is the one that gave the orders.
Accent: sickly blight green.
```

### Boss đã có art
`sprite-gargantuar.png` — **Gargantuar** *(Verdant Reach)*, thứ đầu tiên to đến mức không đẩy nổi.

---

# Bảng kiểm — còn thiếu bao nhiêu

| Nhóm | Cần | Đã có | Còn thiếu |
|---|---|---|---|
| Hero | 9 | **9** | — ✅ |
| Gear | 10 | **10** | — ✅ |
| Boss | 9 | **9** | — ✅ |
| Quân, vật cản, trạng thái phụ | — | **tất cả** | — ✅ |
| Thùng đồ (`sprite-gear-crate.png`) | 1 | 0 | **1** — đang mượn Wall-nut, prompt ở mục Thùng Đồ |
| Truyện tranh KẾT (`outro-0*.jpg`) | 8 | 0 | **8** — màn hình đã dựng sẵn, prompt ở mục 4 |

> **Không còn art tạm nào người chơi nhìn thấy nữa** (2026-08-05). Ba mươi placeholder còn lại
> trong `public/img/placeholder/` là entry CHẾT — chúng thuộc các `PLANT_DEFINITIONS` không bao
> giờ được render, vì hero đọc `HERO_SPRITES` còn quân dự bị đọc `MATERIAL_SPRITES`.
>
> Blightlord cũng đã nối (2026-08-05): thêm `UnitClass.BLIGHTLORD` cùng định nghĩa thân xác, nên
> **không còn con trùm nào rơi về thân Gargantuar** nữa — trước đó trùm cuối game bị đánh dưới
> hình hài và 16 máu của Gargantuar.

Sau khi có file: lưu vào `public/img/`, rồi trỏ đúng một dòng trong `utils/icons.ts`
(`HERO_ICONS` / `HERO_SPRITES` / `MATERIAL_SPRITES` / `ICONS`). Không cần đổi gì khác — art thay
được từng con một, và đó chính là thứ đã cho phép nghỉ hưu chín boss chỉ bằng **tám dòng sửa**.

**Với hero, hai entry có thể trỏ hai file khác nhau** (`HERO_ICONS.X` → thẻ `.jpg`,
`HERO_SPRITES.X` → bản cắt `.png`) — năm hero cũ làm vậy. Bốn hero mới **trỏ cả hai vào cùng một
bản cắt**, vì chúng được render trên nền trắng nên không có bản thẻ. Game vẫn đúng: mọi nơi hiển
thị hero đều đọc `boardImgUrl ?? imgUrl`, chỉ hai thumbnail 32–48px trong Kho Lưu Trữ mới thực
sự đọc `HERO_ICONS`.

---

## Trạng thái phụ — đã nối (`SPRITE_VARIANTS` trong `utils/icons.ts`)

Ba con trùm đổi luật giữa trận, và trước 2026-08-05 cả ba đổi **vô hình**. Giờ art đổi theo, và
mỗi vị từ được viết để lật **đúng cùng điều kiện mà hành vi đọc** — sprite đổi sớm một lượt còn
tệ hơn không đổi, vì người chơi sẽ tin nó.

| Trùm | Đổi khi | Ảnh |
|---|---|---|
| **Sandreaver** | `isBurrowed` — đang dưới đất | `sprite-sandreaver-mound.png` |
| **The Armada** | `movementType !== 'FLYING'` — đã bị bắn rơi, hết là quân bay với mọi luật | `sprite-armada-wreck.png` |
| **Gargantuar** | `hp <= floor(maxHp / 2)` — mốc pha chung của mọi trùm, đúng lúc tầm ném tụt 4 → 2 | `sprite-gargantuar-wounded.png` |

> Gargantuar **không** phải "đã ném imp đi" — nó ném imp nhiều lần và không gì đếm cả. Con imp
> trên lưng là **dấu hiệu của máu**: còn cõng nghĩa là còn khoẻ.

Muốn thêm trạng thái cho con khác: thêm một dòng vào `SPRITE_VARIANTS`. Bảng đó là **tra cứu
thuần trên chính các trường của unit** — cố ý không nằm trong `utils/bossBehaviours.ts`, để câu
hỏi "lúc này nó trông thế nào" không bao giờ động được vào mô phỏng.

---

## Thùng Đồ — `sprite-gear-crate.png` ⚠ **asset mới (2026-08-05)**

Nhiệm vụ `ESCORT_GEAR`: nó đứng giữa bàn, 8 máu, không đi, không đánh, và **cả bầy zombie đi tới nó đúng
như đi tới một căn nhà**. Hiện đang mượn tạm sprite Wall-nut.
```
A battered wooden supply crate for a top-down tactics board. Weathered planks bound with rusted
iron bands, one corner splintered, a seed-and-leaf stencil stamped on the front in flaking paint.
A few green shoots pushing out through the gaps in the lid, so it reads as PLANT CARGO and not as
generic loot. It must read as an OBJECT, never as a creature: no face, no eyes, no limbs, nothing
that could be mistaken for a unit that acts. Squat and heavy — the silhouette should say "this
cannot move and cannot fight, and something wants to break it". Accent: warm amber on the stencil.
```
> **Không mặt, không mắt** là yêu cầu cơ chế chứ không phải thẩm mỹ: bấm vào nó thì thanh kỹ năng **trống rỗng**
> (`UNIT_SKILLS[GEAR_CRATE] = []`). Một cái thùng có mặt sẽ bị đọc là quân, và người chơi sẽ tưởng game hỏng.
>
> **Nối vào code:** một dòng ở `utils/icons.ts` (`GEAR_CRATE`), không đụng `data/plants.ts`.

---

# 4 · TRUYỆN TRANH KẾT (outro) — 8 trang ⚠ **cần art (2026-08-05)**

Màn kết đã **dựng sẵn và nối xong** (`components/OutroComic.tsx`): hạ Blightlord → màn Victory
(kèm Báo Cáo Trận Đánh) → bấm Tiếp Tục → truyện kết. Nó có **chốt tự gác**: game thử tải trang 1,
tải được mới hiện — nên chỉ cần **lưu đủ 8 file đúng tên vào `public/img/comic/`** là đoạn kết tự
bật, không phải sửa một dòng code nào.

**Đây KHÔNG phải phong cách thẻ bài.** Truyện dùng phong cách của 8 trang mở đầu
(`public/img/comic/comic-0*.jpg`) — tranh kể chuyện điện ảnh, ĐƯỢC PHÉP painterly. Phép thử: đặt
cạnh `comic-08-rooftop.jpg`; lệch chất liệu là lệch, vì hai truyện là hai trang của cùng một cuốn.

**KHỐI PHONG CÁCH — dán vào cả 8 prompt:**
```
STYLE: painted cinematic story-comic panel, roughly 4:3, same style as a dark game intro comic.
Moody dramatic lighting, strong silhouettes, painterly but clean. The three plant heroes wear
full tactical gear and masks — helmets and glowing visor eyes, faces NEVER visible. Zombies are
grey-green, ragged, mindless. The city is a ruined neon downtown, dawn light breaking for the
first time. NO speech bubbles, NO caption text baked into the art (the game renders all story
text); comic SFX lettering only where noted. Not cute, not gory — war-poster solemn.
```

> Chữ caption **do game vẽ** (đã dịch sẵn trong `i18n/vi.ts`) — đừng nướng chữ vào tranh, đúng
> luật cũ. Trang nào cũng bị crop `object-cover` theo chiều cao, nên **chủ thể đặt giữa khung**.

| # | File đích | Cảnh cần vẽ |
|---|---|---|
| 1 | `outro-01-fall.jpg` | *"Cây trượng chạm đất trước cả khi thân xác hắn kịp đổ."* |
| 2 | `outro-02-silence.jpg` | *"Lần đầu tiên kể từ đêm cống ngầm, thành phố im tiếng."* |
| 3 | `outro-03-recede.jpg` | *"Không còn kẻ ra lệnh, bầy xác chỉ là một cơn giông."* |
| 4 | `outro-04-banners.jpg` | *"Họ treo trả từng lá cờ về đúng nơi nó bị giật xuống."* |
| 5 | `outro-05-replant.jpg` | *"Quảng trường lại nứt toác — lần này, từ những hạt mầm."* |
| 6 | `outro-06-chrona.jpg` | *"Chrona vẫn giữ một bản sao của dòng thời gian."* |
| 7 | `outro-07-masks.jpg` | *"Những chiếc mặt nạ vẫn không tháo ra."* |
| 8 | `outro-08-plaza.jpg` | *"Quảng trường Neon. Một chiều thu êm đềm..."* — khép vòng về trang 1 truyện MỞ |

### `outro-01-fall.jpg`
```
The final blow, seen low from the ground. The Blightlord — tall hooded zombie commander in a
long ragged coat of stitched faded flags — collapsing to his knees, his vine-wound staff already
fallen flat in the foreground, its green rot-light guttering out. Behind him, out of focus, the
three small masked plant soldiers stand in battle stances, backlit by the first grey light of
dawn breaking between ruined towers. SFX lettering allowed: a single heavy "THOOM".
```

### `outro-02-silence.jpg`
```
A wide still shot of the ruined neon plaza the morning after: dropped zombie debris, cracked
asphalt, dead holo-billboards — and absolute stillness. One traffic light hangs and sways. Thin
morning mist. No figures at all, or the three tiny heroes far away seen from behind, lowering
their weapons. The panel is about SILENCE: huge empty space, soft cold light.
```

### `outro-03-recede.jpg`
```
The leaderless horde dissolving. A street seen from above at dawn: dozens of zombies shambling
AWAY from the camera in loose aimless drift, like litter blown down the road, some collapsing
where they stand. Wind-blown dust and papers stream the same direction. Nothing fights. The
threat is simply... weather, passing.
```

### `outro-04-banners.jpg`
```
Wide heroic shot: citizens and the three masked plant soldiers hoisting recovered flags back
onto broken flagpoles and building fronts around the plaza — each flag a different faded colour,
clearly taken back from the fallen commander's stitched coat, which lies discarded and empty on
the steps below. Warm morning light, the first colour returning to a grey city.
```

### `outro-05-replant.jpg`
```
Close, warm panel: cracked plaza concrete breaking open from BENEATH — green shoots and
seedlings pushing up through the fractures in a spreading line. A small masked plant soldier
kneels pressing seeds into the soil, pouches of seed packets on their webbing. Sunlight shafts
hit the sprouts. Life doing what the horde did in panel 3 of the intro — coming up from below,
but green.
```

### `outro-06-chrona.jpg`
```
Quiet interior panel: a small battered time-machine robot (boxy, headlamp eye, dented chrome)
parked in a dark garage workshop, powered down to a single softly pulsing indicator light — one
holographic timeline thread still archived above it like a bookmark. Tools and three empty
equipment racks in the background. Melancholy, warm-cold light mix. No text.
```

### `outro-07-masks.jpg`
```
Tight three-shot: the three plant soldiers side by side on a rooftop ledge at dawn, seen from
chest up, weapons slung, at rest for the first time — but every mask and visor still ON, visor
eyes glowing calmly. Wind moves a tattered scarf. Behind them the skyline is dark except for the
first windows lighting up. Solemn, not triumphant.
```

### `outro-08-plaza.jpg`
```
The full-circle final page, composed to MIRROR the intro's first panel: Neon Plaza restored at
dusk — neon signs relit, market stalls open, ordinary plant citizens strolling, children
running, and new trees growing where the barricades were. High wide angle, warm evening glow.
If the intro's plaza panel is available, match its camera angle deliberately. No text.
```

> **Nhạc & âm thanh còn thiếu (không phải việc của công cụ vẽ):**
> - **Track trận trùm** — `music-combat.mp3` đang gánh cả trận thường lẫn Blightlord. Prompt cho
>   công cụ sinh nhạc: *"dark orchestral-hybrid boss battle loop, 90–100 BPM, low brass ostinato,
>   military snare, pulsing synth bass, distorted guitar accents, builds every 8 bars, seamless
>   loop, 2–3 minutes, no vocals"* → lưu `public/audio/music-boss.mp3`, nối một dòng trong
>   `utils/audio.ts` + `App.tsx` (tôi nối được ngay khi có file).
> - **Tiếng LỬA** — gói CC0 hiện không có mẫu cháy phù hợp; đang im lặng có chủ đích (dùng zap
>   thì LỬA và ĐIỆN nghe giống nhau). Cần một mẫu *"short fire whoosh-ignite, 0.3–0.6s"*.

---

# 4 · HERO ELEMENTAL FORMS (ẢNH NGUYÊN TỐ MỚI)

> **Mục Đích**: Sinh ra avatar/sprite độc quyền khi Hero hấp thụ nguyên tố (Lửa/Băng/Điện). 
> **Quy trình**: Lưu ảnh thẻ có nền vào `public/img/hero-[tên]-fire.jpg`, sau đó cắt bỏ nền và lưu thành `public/img/sprite-[tên]-fire.png`.

Dưới đây là 3 mẫu prompt nguyên tố đại diện. Bạn hãy copy toàn bộ (bao gồm cả KHỐI PHONG CÁCH bắt buộc) vào công cụ sinh ảnh:

### `hero-shadeleaf-fire.jpg` (Shadeleaf Lửa)
```
STYLE: chibi tactical trading-card illustration, square 1:1, dark military war-room diorama.
Subject stands on a hexagon-tiled diorama plinth with layered wood-and-steel edges, floating holographic UI panels around it, thin corner brackets framing the card, blurred blue monitor banks in the dark background.
Bold black ink outlines, flat cel shading, comic/vector game-art look, chunky readable silhouette. Strong warm rim light from the upper left against a cold dark blue-black room. Muted earthy base colours, HIGH CONTRAST, ONE saturated accent colour for eyes, trim and glow.
A SOLDIER FIRST, A PLANT SECOND: the armour plating is MADE OF the plant — its texture runs across the plates — over ordinary tactical webbing, pouches and worn fabric. Glowing visor-like eyes in the accent colour. NO round cartoon eyes, NO cute smile, no visible plant face: a helmet, a mask or a wrapped face covering, always. Keep only the plant's core silhouette and colours as inspiration; it must NOT look like the Plants vs Zombies character it started from. A few large shapes, never a texture of small ones. Not painterly, not airbrushed, no glossy toy plastic. No watermark, no signature.

PROMPT: A chibi soldier built from a GREEN PEASHOOTER plant, modified for INCENDIARY FIRE COMBAT. The soldier wears heavy tactical gear, an olive-green poncho, and a smooth green helmet shaped like a peashooter's pod. The helmet has a bright glowing ORANGE-RED visor. The soldier holds a heavy assault rifle that has a flaming barrel and an orange magma-glow fuel tank attached. Wisps of flame and glowing embers rise from the gun and the soldier's shoulders. The accent glow colour is FIERY ORANGE.
```

### `hero-ironhusk-ice.jpg` (Ironhusk Băng)
```
STYLE: chibi tactical trading-card illustration, square 1:1, dark military war-room diorama.
Subject stands on a hexagon-tiled diorama plinth with layered wood-and-steel edges, floating holographic UI panels around it, thin corner brackets framing the card, blurred blue monitor banks in the dark background.
Bold black ink outlines, flat cel shading, comic/vector game-art look, chunky readable silhouette. Strong warm rim light from the upper left against a cold dark blue-black room. Muted earthy base colours, HIGH CONTRAST, ONE saturated accent colour for eyes, trim and glow.
A SOLDIER FIRST, A PLANT SECOND: the armour plating is MADE OF the plant — its texture runs across the plates — over ordinary tactical webbing, pouches and worn fabric. Glowing visor-like eyes in the accent colour. NO round cartoon eyes, NO cute smile, no visible plant face: a helmet, a mask or a wrapped face covering, always. Keep only the plant's core silhouette and colours as inspiration; it must NOT look like the Plants vs Zombies character it started from. A few large shapes, never a texture of small ones. Not painterly, not airbrushed, no glossy toy plastic. No watermark, no signature.

PROMPT: A stout chibi heavy-defender soldier built from a WALNUT plant, modified for CRYOGENIC ICE COMBAT. The soldier wears massive, bulky juggernaut armor made of cracked brown walnut-shell plates, heavily coated in thick jagged CYAN ICE crystals and frost. The soldier holds a massive riot shield covered in thick glacial ice spikes. The helmet is a heavy dome with a bright glowing CYAN-BLUE visor slot. Icy mist and frost particles drift off the armor. The accent glow colour is CYAN ICE BLUE.
```

### `hero-sunspot-elec.jpg` (Sunspot Điện)
```
STYLE: chibi tactical trading-card illustration, square 1:1, dark military war-room diorama.
Subject stands on a hexagon-tiled diorama plinth with layered wood-and-steel edges, floating holographic UI panels around it, thin corner brackets framing the card, blurred blue monitor banks in the dark background.
Bold black ink outlines, flat cel shading, comic/vector game-art look, chunky readable silhouette. Strong warm rim light from the upper left against a cold dark blue-black room. Muted earthy base colours, HIGH CONTRAST, ONE saturated accent colour for eyes, trim and glow.
A SOLDIER FIRST, A PLANT SECOND: the armour plating is MADE OF the plant — its texture runs across the plates — over ordinary tactical webbing, pouches and worn fabric. Glowing visor-like eyes in the accent colour. NO round cartoon eyes, NO cute smile, no visible plant face: a helmet, a mask or a wrapped face covering, always. Keep only the plant's core silhouette and colours as inspiration; it must NOT look like the Plants vs Zombies character it started from. A few large shapes, never a texture of small ones. Not painterly, not airbrushed, no glossy toy plastic. No watermark, no signature.

PROMPT: A small chibi support-engineer soldier built from a SUNFLOWER plant, modified for HIGH-VOLTAGE ELECTRIC COMBAT. The soldier wears yellow petal-like armored shoulder pads and a yellow domed helmet with a bright glowing ELECTRIC-BLUE visor. The soldier carries a heavy backpack generator crackling with yellow and cyan lightning arcs. Yellow and cyan plasma electricity surges through thick cables connecting the backpack to the soldier's gauntlets. High-voltage lightning sparks snap around the soldier. The accent glow colour is ELECTRIC YELLOW-CYAN.
```
