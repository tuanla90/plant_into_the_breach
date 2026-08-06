# Gói mở khóa #6 — Cornova (Corn Mortar) + gear Corn

> **ĐÃ TRIỂN KHAI** (typecheck sạch). Đã làm đúng theo tài liệu này, trừ hai điểm:
> - `SKILL_SPLASH` được viết mới ngay trong gói này (không hoãn) — Cob Howitzer là công thức
>   chữ ký nên không thể để `live: false`.
> - Sunbloom × Corn dùng `ATTACK_RANGE_BONUS 2` (**Mortar Bloom**, 0 dòng code) thay cho
>   `HARVEST_ATTACK`: tầm xa hơn trả lời bài toán hộ tống của cô ấy trực tiếp hơn, và không
>   cần cơ chế mới. `HARVEST_ATTACK` để dành nếu sau này thấy thiếu.
>
> Còn thiếu: **art thật** (đang dùng `placeholder/kernel-pult.svg` cho cả 3 asset).
>
> Gói này **đứng trước** Emberwood/Ember Log
> (xem `PLAN-pack-6-emberwood.md`, giờ thành gói #7) vì rẻ hơn nhiều và vá đúng một
> ma sát người chơi đang chịu mỗi trận.
>
> Ma trận fusion: 5×5 = 25 → **6×6 = 36**, tức **11 công thức mới**.

---

## 1. Vì sao Corn không phải hero "lấp chỗ trống"

Ý tưởng ban đầu là "hero tầm trung giữa pea thường và pea băng". Nếu chỉ có vậy thì cô ấy đúng là
đồ lấp chỗ — nằm giữa hai hero về mọi chỉ số nghĩa là không có bản sắc nào.

Nhưng cô ấy có một thứ **không hero nào trong game có**: đường đạn vòng cầu.

### Ma sát mà game đang tạo ra mỗi trận

`getValidTargets` với `rangeType: 'LINE'` ([gameLogic.ts:543](utils/gameLogic.ts)):

```ts
if (obstacle) {
    if (isValidTargetUnit(obstacle)) targets.push({ x: tx, y: ty });
    if (!hasPierce) break;          // ← dừng ở unit ĐẦU TIÊN, kể cả cây nhà
}
```

Đồng đội không phải mục tiêu hợp lệ nên không bị bắn — nhưng đường đạn **tắt tại đó**.
Luật sprout ép bạn cắm Ironhusk chặn hành lang, và Ironhusk **bịt mắt Peaburst đứng sau lưng**.

`LOB` thì quét mọi ô trong tầm Manhattan và **bỏ qua hoàn toàn thứ nằm giữa**
([gameLogic.ts:505](utils/gameLogic.ts)).

Tệ hơn: **Lobber đã có sẵn đường vòng đó** — `boulder_lob`, tầm 3, 2 sát thương
([skills.ts:174](data/skills.ts)). Phe zombie bắn qua đầu tường của bạn được. Phe bạn thì chỉ có
Sunbloom, và phải trả 50 Sol. **Cornova là câu trả lời cho một vấn đề game đã tự tạo ra.**

Đó mới là bản sắc của cô ấy. Choáng chỉ là thứ hai.

---

## 2. Món quà: kỹ năng đã viết sẵn

`data/skills.ts:33-36` đã có nguyên bộ, đúng như hình dung:

```ts
[UnitClass.CORN_MORTAR]: [
  SkillFactory.createLobAttack('corn_toss',    'Corn Kernel',  4, 1, 'Lob corn over obstacles.'),
  SkillFactory.createLobAttack('nova_shell', 'Nova Shell', 4, 1, 'A concussive shell: immobilizes the target.',
                               [{ type: 'STUN' }]),
],
```

- `LOB` targeting: **chạy đủ** (targeting, path, preview)
- `STUN`: **chạy đủ** ([App.tsx:1094](App.tsx)), hết sau 1 lượt (`useGameEngine.ts:154`)
- `UnitClass.CORN_MORTAR`: đã có trong enum, đã có `UnitDefinition` (`plants.ts:155`), đã nằm trong `PLAYER_ROSTER`

**Chi phí engine cho hero này: 0 dòng.** Chỉ chép hai skill vào `HERO_DEFINITIONS` và gắn `sunCost` cho butter.
Đây là hero rẻ nhất có thể làm — rẻ hơn Emberwood rất nhiều (Emberwood cần P0 sửa ô lửa vĩnh viễn trước).

---

## 3. Cornova — bộ kỹ năng đề xuất

Tên: `HeroId` = `CORNOVA`. Tên hiển thị **Cornova** (ngắn, cùng nhịp với *Snapmaw*).
Dự phòng: *Butterlob*, *Popcob*, *Goldkernel*. Tên riêng **không dịch**.

```ts
CORNOVA: {
    id: 'CORNOVA',
    name: 'Cornova',
    baseClass: UnitClass.CORN_MORTAR,
    maxHp: 4, damage: 2, moveRange: 2,
    imgUrl: HERO_ICONS.CORN_MORTAR, boardImgUrl: HERO_SPRITES.CORNOVA,
    movementType: 'WALKING', immunities: [],
    basicAttack: {
        id: 'kp_corn_toss', name: 'Corn Kernel',
        description: 'Ném một hạt ngô theo đường vòng — bay qua đầu mọi thứ đứng chắn. Miễn phí.',
        // Hạ 3 → 2 sau vòng cân bằng đầu tiên: xem mục "Điều chỉnh sau khi chơi thử".
        rangeType: 'LOB', rangeValue: 2,
        effects: [{ type: 'DAMAGE', value: 2 }],
    },
    heroSkill: {
        id: 'kp_butter_splat', name: 'Nova Shell',
        description: 'Dính bơ một mục tiêu: mất trọn lượt kế tiếp.',
        rangeType: 'LOB', rangeValue: 3, sunCost: 50,
        effects: [{ type: 'DAMAGE', value: 1 }, { type: 'STUN' }],
    },
},
```

### Vì sao các con số này

| | Peaburst | Frostpod | **Cornova** |
|---|---|---|---|
| Đánh thường | LINE 8, 2 dmg | LINE 6, 1 dmg + chậm | **LOB 2, 2 dmg** |
| Bị đồng đội chặn | ✅ có | ✅ có | ❌ **không** |
| Máu / Di chuyển | 3 / 3 | 3 / 3 | **4 / 2** |
| Skill | xuyên 3 dmg @50 | xuyên hàng + chậm @50 | **choáng 1 mục tiêu @50** |

- **Tầm 2, di chuyển 2** là cái giá của đường vòng. Cô ấy phải bò lên gần, và bò chậm.
  Nếu cho cô tầm 6–8 thì Peaburst mất sạch lý do tồn tại.

### Điều chỉnh sau khi chơi thử — đánh thường 3 → 2

Bản đầu ship ở LOB 3 và nó quá mạnh, nhưng **không phải vì sát thương** (2, bằng Peaburst).
Vì **số mục tiêu hợp lệ**: LOB 3 phủ 24 ô bất kể vật cản, còn LINE chỉ chạm được unit đầu tiên
theo 4 hướng và chết ngay khi có đồng đội đứng chắn — thực chiến Peaburst thường có 1 mục tiêu
hoặc không có. Trong một game mà **~80% số lượt hành động là đánh thường**, khoảng chênh đó lớn
hơn mọi con số sát thương.

LOB 2 còn 12 ô. Cô phải đứng ngay sau tuyến mình đang bắn qua, với 4 máu — và đó cũng là thứ
làm *Hầm Bắp* (+3 máu) từ chỗ nhàm chán thành công thức đáng một slot.
**Đạn Nova giữ nguyên LOB 3**: skill trả tiền thì được phép là cái tay dài.
- **4 máu** vì cô đứng gần hơn hai pea kia.
- **2 sát thương** — bằng Peaburst. Cô ấy không phải "pea yếu hơn", cô ấy là pea **đổi tầm lấy góc bắn**.
- **Butter 50 Sol**: choáng mạnh hơn đẩy (Rolling Charge 25) và mạnh hơn làm chậm. Nếu chơi thử thấy
  yếu thì hạ 25, **đừng** tăng tầm.

---

## 4. Rào chắn bắt buộc: đừng giết Blizzard

Frostpod được viết rõ trong `heroes.ts`: *"She only ever SLOWS — a full freeze is what the Ice Grenade
fusion (Blizzard) unlocks."* `UPGRADE_SLOW_TO_FREEZE` là **công thức đỉnh** của cô ấy.

Cornova có choáng ngay từ đầu. Điều đó **không** làm hỏng Blizzard, vì:
- STUN vốn đã lấy được qua 4 công thức đang tồn tại (Ironhusk/Sunbloom/Snapmaw + Ice Grenade).
- Butter là **1 mục tiêu, tốn 50 Sol, mỗi lượt 1 lần**. Blizzard biến **mọi** đòn của Frostpod —
  kể cả skill xuyên cả hàng — thành choáng, **miễn phí, vĩnh viễn**. Hai thứ khác hạng.

**Luật cứng khi viết ma trận:** Cornova **không bao giờ** được nhận `ON_HIT_FREEZE` từ bất kỳ gear nào.
Choáng-mỗi-đòn-miễn-phí trên một hero bắn vòng cầu là mạnh hơn toàn bộ bộ kỹ năng của Frostpod.
Gear Ice Grenade trên Cornova phải là `ON_HIT_SLOW`, không hơn.

---

## 5. Gear đi kèm: Corn, không phải Melon

Melon (nổ lan) là gear tốt — nhưng để **gói sau**, vì hai lý do:

1. `SIGNATURE_MATERIAL` quy định mỗi hero biết sẵn công thức với **chính cây gốc của mình**
   (`unlocks.ts:74`). Ghép Cornova với Melon là phá luật đó ngay ở entry đầu tiên.
2. Skill **chưa có splash** — `const targets = [pos]` ([App.tsx:972](App.tsx)). Chỉ item mới nổ lan
   ([App.tsx:824](App.tsx)). Melon cần viết mới; Corn thì không.

```ts
MAT_CORN_MORTAR: {
    id: 'MAT_CORN_MORTAR',
    name: 'Corn Mortar',
    description: 'Cần bắn vòng cầu. Đạn không còn quan tâm thứ gì đứng chắn.',
    coinCost: 125,                      // giữa Steel Jaws 150 và Seed Gun 100
    imgUrl: MATERIAL_SPRITES.MAT_CORN_MORTAR,
    effect: { type: 'ARC_ATTACK' },     // type mới
    benchClass: UnitClass.CORN_MORTAR,
    benchStats: { maxHp: 4, damage: 1, moveRange: 3 },
},
```

**Trục mới: `ARC_ATTACK`** — đổi `rangeType` của đòn đánh từ `LINE` sang `LOB`.
Nối dây ~5 dòng trong `applyFusionToSkill` ([fusion.ts:207](utils/fusion.ts)), cạnh chỗ đã xử lý
`MELEE_REACH_TRADE`. Vì hàm đó dùng chung cho cả lúc tính ô hợp lệ lẫn lúc ra đòn, overlay ngắm bắn
tự động đúng theo.

Trục này **không trùng** với bất kỳ nguyên liệu nào đang có — và nó vá ma sát ở mục 1 cho cả roster,
không riêng Cornova.

---

## 6. Hàng ngang — Cornova × 5 gear cũ

> Điểm yếu lõi của Cornova: **(a)** tầm ngắn + chậm → dễ bị áp sát; **(b)** butter tốn 50 Sol nên không
> dùng mỗi lượt được; **(c)** 2 sát thương không dứt điểm được mục tiêu dày máu.

| Gear | Tên fusion | Hiệu ứng | Trả lời | Code |
|---|---|---|---|---|
| Sol Battery | **Dazzling Sol** | `SKILL_DISCOUNT 25` | (b) — butter còn 25 Sol, dùng được gần như mỗi lượt | ✅ đã có |
| Seed Gun | **Twin Cob** | `DOUBLE_ATTACK` | (c) — ném hai hạt, hoặc hai mục tiêu | ✅ đã có |
| Armor Plate | **Cob Bunker** | `BONUS_HP 3` | (a) — 7 máu, đứng gần được | ✅ đã có |
| Steel Jaws | **Cob Grinder** | `RETALIATE_DAMAGE 2` | (a) — ai áp sát thì trả giá | ✅ đã có |
| Ice Grenade | **Frost Nova** | `ON_HIT_SLOW` | (a) — giữ khoảng cách. **Không được là ON_HIT_FREEZE** (mục 4) | ✅ đã có |

**Cả 5 công thức chạy ngay, 0 dòng engine.**

---

## 7. Cột dọc — 5 hero cũ × gear Corn

Trục mặc định là `ARC_ATTACK`, nhưng đường vòng vô nghĩa với hero cận chiến — nên hai hero đó nhận
hiệu ứng vị bơ riêng. (Ma trận vốn viết tay theo từng cặp, nên đây là chuyện bình thường.)

| Hero | Tên fusion | Hiệu ứng | Trả lời điểm yếu | Code |
|---|---|---|---|---|
| Peaburst | **Mortar Pea** | `ARC_ATTACK` | Bị chính tường nhà chặn tầm bắn — giờ bắn qua đầu Ironhusk | ⚠️ type mới (~5 dòng) |
| Frostpod | **Arcing Frost** | `ARC_ATTACK` | Muốn làm chậm hàng sau nhưng hàng trước cản | ⚠️ dùng chung |
| Ironhusk | **Cob Turret** | `GRANT_ATTACK 0` | Chặn tốt mà không đóng góp — giờ có đòn tầm xa miễn phí | ✅ đã có |
| Snapmaw | **Numbed Hide** | `RETALIATE_FREEZE` | 2 lượt tiêu hoá đứng chịu trận — ai đánh cô lúc đó thì mất lượt | ✅ đã có |
| Sunbloom | **Kernel Battery** | `HARVEST_ATTACK 1` *(type mới)* | Harvest là lượt hoàn toàn bị động — giờ vừa thu Sol vừa bắn 1 hạt | ⚠️ ~10 dòng |

`Kernel Battery` có bản rẻ: `BONUS_HP 3` (0 dòng) nếu muốn hoãn.

---

## 8. Công thức chữ ký — Cornova × Corn

| Tên | Hiệu ứng |
|---|---|
| **Cob Howitzer** | Nova Shell nổ lan: choáng cả ô trúng và 2 ô kề |

Đây là chỗ nên **viết sẵn cơ chế splash cho skill** — chính đoạn code mà gear Melon sẽ cần ở gói sau.
Làm một lần, dùng hai lần. Chép từ vòng lặp bán kính của item ([App.tsx:824](App.tsx)), và overlay xem
trước vùng nổ (`isInItemAoe` trong `Tile.tsx`) đã dựng sẵn để tái dùng.

---

## 9. Tổng chi phí

| Việc | Ước lượng |
|---|---|
| Hero + 2 skill | **0 dòng engine** (đã có sẵn) |
| 5 công thức hàng ngang | **0 dòng** |
| 2 công thức cột dọc (Ironhusk, Snapmaw) | **0 dòng** |
| `ARC_ATTACK` | ~5 dòng, `utils/fusion.ts` |
| Splash cho skill (chữ ký) | ~15 dòng, `App.tsx` — dùng lại cho Melon sau |
| `HARVEST_ATTACK` *(tuỳ chọn)* | ~10 dòng |
| Data | `types.ts`, `heroes.ts`, `materials.ts`, `fusionRecipes.ts` (11 ô), `unlocks.ts`, `icons.ts` |
| i18n | ~35 chuỗi |
| Art | `hero-cobb.jpg`, `sprite-cornova.png`, `gear-corn-mortar.png` — 3 asset |

**7/11 công thức chạy được mà không đụng vào engine.** Có thể cầm Cornova đánh thử một run thật
trước khi vẽ bất kỳ asset nào — chỉ cần dùng tạm `/img/placeholder/kernel-pult.svg` đang có.

### Mở khoá
```ts
{ hero: 'CORNOVA', bossNumber: 3, city: 'Goldacre',
  hint: 'Goldacre giữ được nhờ bắn vòng qua đầu tường. Phá vây lần thứ ba, pháo thủ của họ sẽ theo bạn.' }
```

---

## 10. Lộ trình sau gói này

| # | Hero | Gear | Trục mới |
|---|---|---|---|
| 6 | **Cornova** (Corn Mortar) | **Corn** | Đường vòng — bắn qua đầu đồng đội |
| 7 | Emberwood (Ember Log) | Ember Log | Địa hình / cháy dai — xem `PLAN-pack-6-emberwood.md` |
| 8 | *(chưa chọn)* | **Melon** | Nổ lan — cơ chế splash đã viết sẵn từ Cob Howitzer |

Gear Melon ở gói 8 gần như **miễn phí về code** nếu Cob Howitzer làm đúng ở gói 6, và nó có ý nghĩa với
cả 6 hero (kể cả cận chiến) — khác với Corn chỉ thật sự đổi lối chơi cho 3 hero tầm xa.
