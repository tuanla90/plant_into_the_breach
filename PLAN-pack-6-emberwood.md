# Gói mở khóa #7 — Emberwood + Ember Log

> **Đã dời xuống gói #7.** Gói #6 giờ là Cornova (Corn Mortar) — xem `PLAN-pack-6-cobb.md`:
> rẻ hơn hẳn (kỹ năng đã viết sẵn trong `data/skills.ts`) và vá đúng một ma sát người chơi
> đang chịu mỗi trận. Emberwood vẫn cần bước P0 sửa "ô lửa vĩnh viễn" ở mục 2 trước khi bắt đầu.
>
> Trạng thái: **đề xuất, chưa code**. Viết theo đúng luật của `DESIGN.md` mục 6–7:
> mỗi gói = **1 hero + 1 gear + 1 trục hiệu ứng mới**.
> Ma trận fusion đi từ 5×5 = 25 lên **6×6 = 36** → **11 công thức mới** phải viết.

---

## 1. Chọn gì, và vì sao

### Hero #6: **Emberwood** — `CAPTAIN_COMBUSTIBLE`, cây gốc `TORCHWOOD`
### Gear #6: **Ember Log** — `MAT_TORCHWOOD`, trục **địa hình / cháy dai**

Ba lý do, xếp theo sức nặng:

**1. Đây là lỗ hổng thiết kế lớn nhất còn lại.** Cả 5 hero hiện tại đều nhắm vào *unit*:
Peaburst bắn thẳng, Ironhusk chặn & đẩy, Sunbloom làm kinh tế, Snapmaw hành quyết, Frostpod khống chế.
**Không ai đụng vào cái bàn cờ.** Đó chính là thứ làm nên Into the Breach — và game đã có sẵn
ô lửa, ô dung nham, ô khói, mìn. Hero đốt ô là mảnh ghép còn thiếu, không phải hero thứ ba biết đánh cận chiến.

**2. Engine đã dựng sẵn phân nửa cho nó.** Không phải suy đoán — các thứ này đang nằm trong code:
- `APPLY_BURN` chạy đủ: status BURN + tick 1 sát thương/lượt (`App.tsx:1117`, `turnManager.ts:305`)
- Ô `FIRE`: 2 sát thương + bắt cháy ai đứng trên (`turnManager.ts:294`), có texture, có animation
- `ON_HIT_BURN` **đã nối dây sẵn** trong `applyFusionToSkill` (`fusion.ts:218`) — chưa recipe nào dùng
- `RETALIATE_BURN`, `FIRE_SPREAD`, `SWALLOW_EXPLODE` **đã khai báo sẵn trong `FusionEffectType`** và
  không recipe nào dùng. Ba cái tên đó chính là bóng ma của một Ember Log từng được lên kế hoạch.
- `utils/icons.ts:29` còn ghi chú: *"hero-captain-combustible.webp giữ lại cho khi Captain Combustible
  quay lại làm hero mở khóa"* (file thực tế đã mất, phải vẽ lại).

**3. DESIGN.md từng xếp Captain Combustible vào **bộ 5 khởi điểm** với vai "can thiệp địa hình"** (mục 7).
Bản ship đã thay bằng Cold Snap. Đây là lấy lại đúng món nợ đó, ở đúng chỗ của nó.

### Đã cân nhắc và loại
| Phương án | Lý do loại |
|---|---|
| Grass Knuckles (Bok Boxer) — theo lộ trình cũ trong DESIGN.md | Melee thứ ba. Ironhusk + Snapmaw đã phủ cận chiến. Trục "xuyên hàng" (Cactus) thì Peaburst đã có `PIERCE_ATTACK` sẵn trong skill |
| Spudow (Seed Mine) — bẫy | Rất hợp Into the Breach, nhưng Seed Mine **đang là item** (`items.ts`, effect `TRAP`). Biến nó thành hero sẽ giẫm chân lên item, phải thiết kế lại cả hai |
| Rose / Nightcap | Cần cơ chế mới hoàn toàn (thôi miên, tàng hình) — không tái dùng được gì |

**Spudow nên là gói #7**, sau khi item Seed Mine được đổi vai.

### Tên gọi
`HeroId` giữ đúng quy ước tên gốc PvZ Heroes: `CAPTAIN_COMBUSTIBLE`.
Tên hiển thị theo lối đặt tên thiên nhiên của roster (Peaburst, Ironhusk, Sunbloom, Snapmaw, Frostpod):

> **Emberwood** — đề xuất chính. Dự phòng: *Cinderbark*, *Scorchpine*, *Ashvein*.

Tên riêng **không dịch sang tiếng Việt** (đúng luật i18n đang áp dụng).

---

## 2. Việc phải làm TRƯỚC (P0) — ô lửa hiện đang **vĩnh viễn**

Không có chỗ nào trong code xoá `environment: 'FIRE'`. Đốt một ô là ô đó cháy đến hết trận.

Với hero hiện tại thì vô hại (chỉ skill `ignite` của một cây phụ tạo ra lửa). Với Emberwood thì
**vỡ game**: 50 Sol một lần là khoá vĩnh viễn một lối đi trước dãy nhà, và cuối trận cả bàn cờ là biển lửa.

**Phải làm trước khi làm hero:**

```ts
// types.ts — TileData
/** Số lượt còn cháy. Giảm mỗi lượt ở PHASE 2; về 0 thì environment trở lại 'NONE'. */
fireTurns?: number;
```
- `turnManager.ts` PHASE 2: sau khi tính sát thương lửa, `fireTurns -= 1`; hết thì `MODIFY_TERRAIN → NONE`
- `Tile.tsx`: 1 lượt cuối thì vẽ nhạt đi (báo trước lửa sắp tắt)
- Mặc định **2 lượt**. `ignite` sẵn có cũng dùng chung.

Ước lượng: ~40 dòng, 3 file. Đây cũng là điều kiện cần để `FIRE_SPREAD` không nuốt cả bàn cờ.

### Ghi chú cân bằng quan trọng
`aiLogic.ts` **không hề né ô nguy hiểm** (không có tham chiếu FIRE/LAVA nào trong file).
Và sát thương lửa tính ở PHASE 2 cho unit **đang đứng trên ô** — đi ngang qua giữa đường thì không dính.

Nghĩa là: lửa không phải sát thương chắc chắn, nó là **thuế đặt lên ô mà zombie sẽ dừng lại**.
Overlay "zombie sẽ đi qua đây" (`isInEnemyPath` / `isEnemyPathDestination`) đã có sẵn trên bàn cờ —
Emberwood chính là hero biến cái overlay đó thành hành động. Đó là fantasy Into the Breach thuần nhất
mà game này từng có.

---

## 3. Emberwood — bộ kỹ năng

```ts
CAPTAIN_COMBUSTIBLE: {
    id: 'CAPTAIN_COMBUSTIBLE',
    name: 'Emberwood',
    baseClass: UnitClass.TORCHWOOD,      // enum đã có sẵn
    maxHp: 4, damage: 1, moveRange: 2,
    imgUrl: HERO_ICONS.CAPTAIN_COMBUSTIBLE,
    boardImgUrl: HERO_SPRITES.CAPTAIN_COMBUSTIBLE,
    movementType: 'WALKING',
    immunities: ['BURN'],                // bắt buộc: phải đứng được trong lửa của chính mình
    basicAttack: {
        id: 'cc_ember_toss', name: 'Ember Toss',
        description: 'Ném than sang một ô gần. 1 sát thương và bắt cháy. Miễn phí.',
        rangeType: 'LOB', rangeValue: 3,
        effects: [{ type: 'DAMAGE', value: 1 }, { type: 'APPLY_BURN' }],
    },
    heroSkill: {
        id: 'cc_firebreak', name: 'Firebreak',
        description: 'Đốt một ô. Ai kết thúc lượt trên đó chịu 2 sát thương và bắt cháy.',
        rangeType: 'LOB', rangeValue: 3, sunCost: 50,
        effects: [{ type: 'TERRAIN_MOD' }],
    },
},
```

**Vì sao các con số này:**
- `damage 1` + burn: tổng 2 sát thương nhưng **trả góp**. Peaburst gây 2 ngay lập tức. Emberwood không
  bao giờ được là lựa chọn tốt hơn khi cần dứt điểm — đổi lại anh ta đánh trúng *chỗ*, không phải *người*.
- `moveRange 2`: chậm. Anh ta dựng vùng cấm rồi đứng giữ, không phải chạy khắp bàn.
- `maxHp 4`: dày hơn Peaburst/Sunbloom/Frostpod (3), mỏng hơn Ironhusk (5).
- `sunCost 50`: bằng Sol Burn của Sunbloom (4 sát thương **chắc chắn**). Firebreak yếu hơn khi tính ngay,
  mạnh hơn khi đọc đúng đường đi. Nếu chơi thử thấy yếu → hạ 25, **đừng** tăng sát thương ô lửa.

**Một dòng code chặn đường:** `App.tsx:1014` đang hardcode `if (skill.id === 'ignite')`.
Phải nới thành danh sách id hoặc tốt hơn là đọc `terrain/environment` từ chính effect.

---

## 4. Ember Log — gear mới

```ts
MAT_TORCHWOOD: {
    id: 'MAT_TORCHWOOD',
    name: 'Ember Log',
    description: 'Gỗ mồi. Cái gì đi qua nó cũng bốc cháy.',
    coinCost: 175,                        // ngang Ice Grenade; đúng bậc trong DESIGN.md
    imgUrl: MATERIAL_SPRITES.MAT_TORCHWOOD,
    effect: { type: 'ON_HIT_BURN' },      // fallback chung; hiệu ứng thật tra theo cặp
    benchClass: UnitClass.TORCHWOOD,
    benchStats: { maxHp: 3, damage: 1, moveRange: 2 },
},
```

Thêm vào `STARTING_MATERIALS` ngay — theo đúng luật hiện hành: **nguyên liệu không bị khoá, công thức mới bị khoá.**
Nghĩa là gear mới có tác dụng cho 5 hero cũ **ngay khi ra mắt**, không cần đợi mở được Emberwood.

`FUSION_SLOTS` giữ nguyên **2** (constants.ts ghi: lên 3 khi pool đạt 7+).

---

## 5. Hàng ngang — Emberwood × 5 gear cũ

> Luật của `fusionRecipes.ts`: mỗi fusion phải trả lời **điểm yếu lõi** của chính hero đó.
> Điểm yếu của Emberwood: **(a)** không dứt điểm được lượt này, **(b)** mỏng khi bị áp sát,
> **(c)** lửa không tự lan, **(d)** tiền Sol không tự sinh.

| Gear | Tên fusion | Hiệu ứng | Trả lời | Code |
|---|---|---|---|---|
| Seed Gun | **Flare Gun** | `DOUBLE_ATTACK` | (a) — hai mục tiêu cùng cháy, hoặc dồn 1 mục tiêu | ✅ đã có |
| Armor Plate | **Charwood** | `DAMAGE_REDUCTION 1` | (b) — đứng giữ vùng cấm mà không chết | ✅ đã có |
| Ice Grenade | **Scalding Mist** | `ON_HIT_SLOW` | (a) — làm chậm = **zombie đứng trong lửa lâu hơn** | ✅ đã có |
| Steel Jaws | **Backdraft** | `RETALIATE_BURN` | (b) — ai cắn anh ta thì bốc cháy | ⚠️ cần nối dây |
| Sol Battery | **Bonfire Bloom** | `SUN_PER_BURNING 15` *(type mới)* | (d) — kinh tế tỉ lệ thuận với số zombie đang cháy | ⚠️ type mới |

**Scalding Mist là mảnh ghép hay nhất của cả hàng** — làm chậm không phải để khống chế, mà để giữ mục
tiêu lại trong lửa thêm một lượt. Fire + ice ở đây cộng hưởng thật chứ không phải dán hai từ khoá vào nhau.

**Bonfire Bloom**: bản rẻ là `SUN_PER_TURN 15` (đã có sẵn, 0 dòng code) nhưng nhạt. Bản đúng —
"+15 Sol mỗi lượt **nếu có ít nhất một zombie đang cháy**" — cần một type mới, khoảng 8 dòng trong
`turnManager.ts` PHASE 2. Đáng làm: nó biến kinh tế của anh ta thành hệ quả của việc chơi giỏi.

---

## 6. Cột dọc — 5 hero cũ × Ember Log

| Hero | Tên fusion | Hiệu ứng | Trả lời điểm yếu | Code |
|---|---|---|---|---|
| Peaburst | **Fire Pea** | `ON_HIT_BURN` | Bắn suông không có đuôi — giờ mỗi phát để lại 1 sát thương trả góp | ✅ đã có |
| Frostpod | **Steam Shot** | `ON_HIT_BURN` | Cô ấy **không giết được gì** — cháy là cơ chế kết liễu đầu tiên cô có | ✅ đã có |
| Ironhusk | **Brazier Shield** | `RETALIATE_BURN` | Chặn tốt mà không đóng góp — giờ mỗi cú cắn vào tường phải trả giá | ⚠️ cần nối dây |
| Snapmaw | **Cinder Gullet** | `SWALLOW_EXPLODE` | 2 lượt tiêu hoá vô dụng — giờ mỗi cú nuốt nổ ra lửa quanh mình | ⚠️ cần nối dây |
| Sunbloom | **Solar Kiln** | `SKILL_LEAVES_FIRE` *(type mới)* | Không tự vệ được — Sol Burn giờ để lại ô lửa làm tường | ⚠️ type mới |

Hai dòng `ON_HIT_BURN` trùng nhau là **cố ý và đúng chuẩn ma trận hiện tại** (`SUN_ON_KILL` xuất hiện 2 lần,
`DOUBLE_ATTACK` 2 lần, `ON_HIT_FREEZE` 2 lần). Cùng một hiệu ứng nhưng đọc ra hai câu chuyện khác nhau:
với Peaburst là thêm đuôi sát thương, với Frostpod là **lần đầu tiên cô ấy tự kết liễu được mục tiêu**.

**Cinder Gullet** là công thức có tính chuyển hoá cao nhất cột này: Snapmaw hiện tại nuốt xong là đứng chịu trận
2 lượt. Cho cú nuốt nổ ra lửa quanh mình nghĩa là cửa sổ tiêu hoá **tự nó là một vùng cấm** — đúng
tinh thần "mọi fusion của Snapmaw phải đánh vào cửa sổ tiêu hoá" đã ghi trong file.

**Solar Kiln** bản rẻ: dùng `ON_HIT_BURN` (0 dòng code). Bản đúng cần type mới nhưng chỉ ~8 dòng, tái dùng
action `MODIFY_TERRAIN` đã có.

---

## 7. Công thức chữ ký — Emberwood × Ember Log

| Tên | Hiệu ứng | Ghi chú |
|---|---|---|
| **Wildfire Heart** | `FIRE_SPREAD` | Mỗi lượt, mỗi ô lửa lan sang **một** ô kề. Type đã khai báo sẵn, chưa nối dây |

`SIGNATURE_MATERIAL` = công thức hero **biết sẵn khi vừa mở khoá**. Nên cân nhắc:

- Đây là công thức mạnh nhất gói. Trao ngay lúc mở khoá là một cú nhảy sức mạnh lớn.
- **Nhưng** các signature hiện tại cũng không hề nhẹ (Peaburst + Seed Gun = Repeater = nhân đôi damage).
- Bắt buộc phải có rào chắn, nếu không cả bàn cờ sẽ cháy: **không lan vào ô nhà, ô spawn, và ô đang có
  cây đứng**; mỗi ô chỉ lan **một lần**; và `fireTurns` (mục 2) là cái phanh cuối.

Nếu thấy quá mạnh: đổi signature thành **"Firebreak đốt 2 ô thay vì 1"** và đẩy `FIRE_SPREAD` sang
phần thưởng nhiệm vụ phụ.

---

## 8. Cần code những gì

### Đã có sẵn, chỉ cần khai báo (0 dòng engine)
`DOUBLE_ATTACK` · `DAMAGE_REDUCTION` · `ON_HIT_SLOW` · `ON_HIT_BURN` ×3 → **6/11 công thức chạy ngay**

### Phải nối dây
| Việc | File | Ước lượng | Ghi chú |
|---|---|---|---|
| P0: ô lửa có hạn dùng | `types.ts`, `turnManager.ts`, `Tile.tsx` | ~40 dòng | **làm trước tiên** |
| Nới hardcode `skill.id === 'ignite'` | `App.tsx:1014` | ~3 dòng | chặn Firebreak |
| `RETALIATE_BURN` | `turnManager.ts:401` | ~10 dòng | chép nguyên `RETALIATE_FREEZE` kế bên, đổi STUN→BURN. Một lần làm, **hai công thức** dùng |
| `SWALLOW_EXPLODE` | `App.tsx` (chỗ `burrow_strike`) | ~15 dòng | đốt 4 ô kề sau khi nuốt |
| `FIRE_SPREAD` | `turnManager.ts` PHASE 2 | ~20 dòng | + rào chắn ở mục 7 |
| `SUN_PER_BURNING` *(tuỳ chọn)* | `turnManager.ts` PHASE 2 | ~8 dòng | có bản rẻ thay thế |
| `SKILL_LEAVES_FIRE` *(tuỳ chọn)* | `App.tsx` | ~8 dòng | có bản rẻ thay thế |

### Data — TypeScript sẽ tự bắt lỗi thiếu sót
Thêm `'CAPTAIN_COMBUSTIBLE'` vào `HeroId` và `'MAT_TORCHWOOD'` vào `MaterialId` sẽ làm
`FUSION_RECIPES: Record<HeroId, Record<MaterialId, FusionRecipe>>` **không compile được cho tới khi đủ 36 ô**.
Trình biên dịch chính là checklist — không thể quên ô nào.

| File | Sửa gì |
|---|---|
| `types.ts` | `HeroId`, `MaterialId`, 0–2 `FusionEffectType`, `TileData.fireTurns` |
| `data/heroes.ts` | 1 hero |
| `data/materials.ts` | 1 material + `STARTING_MATERIALS` |
| `data/fusionRecipes.ts` | **11 công thức** (5 hàng + 5 cột + 1 chữ ký) |
| `data/unlocks.ts` | `HERO_UNLOCKS` (boss #3) + `SIGNATURE_MATERIAL` |
| `utils/icons.ts` | 3 đường dẫn ảnh |
| `i18n/vi.ts` | ~40 chuỗi (tên + mô tả skill/fusion/thành phố) |

### Mở khoá
```ts
{ hero: 'CAPTAIN_COMBUSTIBLE', bossNumber: 3, city: 'Kiln Row',
  hint: 'Kiln Row tự đốt mình để chặn dịch. Phá vây lần thứ ba, người giữ lửa sẽ theo bạn.' }
```
(Đã có: Verdant Reach ở boss #1, Frostgate ở boss #2.)

### Art cần vẽ
| Asset | Kích thước | Ghi chú |
|---|---|---|
| `hero-captain-combustible.jpg` | thẻ hero | theo đúng bố cục 5 thẻ hiện có |
| `sprite-captain-combustible.png` | 512×512 trong suốt | cùng baseline & scale với 5 sprite kia |
| `gear-torchwood.png` | gear bio-mech | theo phong cách 5 gear hiện có |
| *(tuỳ chọn)* `portrait-emberwood.jpg` | 512×512 | chỉ cần nếu anh ta có thoại |

---

## 9. Rủi ro cần canh

1. **Lửa vĩnh viễn** — đã xử ở mục 2. Nếu bỏ qua bước này thì mọi thứ còn lại đều hỏng.
2. **Fire friendly-fire.** Ô lửa đốt cả cây. Emberwood miễn nhiễm, đồng đội thì không. Đây là **áp lực
   thiết kế tốt** (đặt lửa sai chỗ là tự chặn đường mình) nhưng cần overlay đọc được — ô lửa hiện đã có
   hiệu ứng riêng, nên coi như đủ.
3. **Lửa và ô nhà.** Phải chốt luật: lửa **không** được đốt ô nhà và **không** làm mất mầm.
   Chưa có cơ chế nào cho phép điều đó xảy ra, nhưng `FIRE_SPREAD` sẽ tạo ra nó nếu không chặn.
4. **AI không né lửa.** Hiện tại tốt (lửa thành thuế đường đi). Nếu sau này thêm né tránh vào `aiLogic`,
   Emberwood mất giá trị ngay — lúc đó lửa phải chuyển thành công cụ **lùa** thay vì gây sát thương.
5. **`ON_HIT_BURN` xuất hiện 3 lần trong ma trận.** Chấp nhận được (đã có tiền lệ), nhưng nếu chơi thử
   thấy nhàm thì Frostpod nên đổi sang một type riêng (ví dụ +2 sát thương lên mục tiêu đang cháy).

---

## 10. Thứ tự làm

1. **P0** — ô lửa có hạn dùng (mục 2). Không có nó thì không đo cân bằng được gì.
2. Nới hardcode `ignite` → Firebreak chạy được.
3. Data: hero + gear + 6 công thức **không cần code** → đã chơi thử được ngay.
4. `RETALIATE_BURN` (một lần, hai công thức).
5. `SWALLOW_EXPLODE`, `FIRE_SPREAD` + rào chắn.
6. Hai type tuỳ chọn, hoặc dùng bản rẻ và để dành.
7. Art + i18n.

Bước 1–3 đã đủ để cầm Emberwood đánh thử một run thật, trước khi bỏ công vẽ asset nào.
