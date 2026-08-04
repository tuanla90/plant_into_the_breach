# Gói mở khóa #6 — Cobb (Kernel-pult) + gear Corn

> **ĐÃ TRIỂN KHAI** (typecheck sạch). Đã làm đúng theo tài liệu này, trừ hai điểm:
> - `SKILL_SPLASH` được viết mới ngay trong gói này (không hoãn) — Cob Cannon là công thức
>   chữ ký nên không thể để `live: false`.
> - Sunspot × Corn dùng `ATTACK_RANGE_BONUS 2` (**Mortar Bloom**, 0 dòng code) thay cho
>   `HARVEST_ATTACK`: tầm xa hơn trả lời bài toán hộ tống của cô ấy trực tiếp hơn, và không
>   cần cơ chế mới. `HARVEST_ATTACK` để dành nếu sau này thấy thiếu.
>
> Còn thiếu: **art thật** (đang dùng `placeholder/kernel-pult.svg` cho cả 3 asset).
>
> Gói này **đứng trước** Emberwood/Torchwood
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
Luật brain ép bạn cắm Ironhusk chặn hành lang, và Ironhusk **bịt mắt Shadeleaf đứng sau lưng**.

`LOB` thì quét mọi ô trong tầm Manhattan và **bỏ qua hoàn toàn thứ nằm giữa**
([gameLogic.ts:505](utils/gameLogic.ts)).

Tệ hơn: **Catapult Zombie đã có sẵn đường vòng đó** — `basketball_lob`, tầm 3, 2 sát thương
([skills.ts:174](data/skills.ts)). Phe zombie bắn qua đầu tường của bạn được. Phe bạn thì chỉ có
Sunspot, và phải trả 50 Sun. **Cobb là câu trả lời cho một vấn đề game đã tự tạo ra.**

Đó mới là bản sắc của cô ấy. Choáng chỉ là thứ hai.

---

## 2. Món quà: kỹ năng đã viết sẵn

`data/skills.ts:33-36` đã có nguyên bộ, đúng như hình dung:

```ts
[UnitClass.KERNEL_PULT]: [
  SkillFactory.createLobAttack('corn_toss',    'Corn Kernel',  4, 1, 'Lob corn over obstacles.'),
  SkillFactory.createLobAttack('butter_splat', 'Butter Splat', 4, 1, 'Immobilize enemy with butter.',
                               [{ type: 'STUN' }]),
],
```

- `LOB` targeting: **chạy đủ** (targeting, path, preview)
- `STUN`: **chạy đủ** ([App.tsx:1094](App.tsx)), hết sau 1 lượt (`useGameEngine.ts:154`)
- `UnitClass.KERNEL_PULT`: đã có trong enum, đã có `UnitDefinition` (`plants.ts:155`), đã nằm trong `PLAYER_ROSTER`

**Chi phí engine cho hero này: 0 dòng.** Chỉ chép hai skill vào `HERO_DEFINITIONS` và gắn `sunCost` cho butter.
Đây là hero rẻ nhất có thể làm — rẻ hơn Emberwood rất nhiều (Emberwood cần P0 sửa ô lửa vĩnh viễn trước).

---

## 3. Cobb — bộ kỹ năng đề xuất

Tên: `HeroId` = `KERNEL_PULT`. Tên hiển thị **Cobb** (ngắn, cùng nhịp với *Maw*).
Dự phòng: *Butterlob*, *Popcob*, *Goldkernel*. Tên riêng **không dịch**.

```ts
KERNEL_PULT: {
    id: 'KERNEL_PULT',
    name: 'Cobb',
    baseClass: UnitClass.KERNEL_PULT,
    maxHp: 4, damage: 2, moveRange: 2,
    imgUrl: HERO_ICONS.KERNEL_PULT, boardImgUrl: HERO_SPRITES.KERNEL_PULT,
    movementType: 'WALKING', immunities: [],
    basicAttack: {
        id: 'kp_corn_toss', name: 'Corn Kernel',
        description: 'Ném một hạt ngô theo đường vòng — bay qua đầu mọi thứ đứng chắn. Miễn phí.',
        // Hạ 3 → 2 sau vòng cân bằng đầu tiên: xem mục "Điều chỉnh sau khi chơi thử".
        rangeType: 'LOB', rangeValue: 2,
        effects: [{ type: 'DAMAGE', value: 2 }],
    },
    heroSkill: {
        id: 'kp_butter_splat', name: 'Butter Splat',
        description: 'Dính bơ một mục tiêu: mất trọn lượt kế tiếp.',
        rangeType: 'LOB', rangeValue: 3, sunCost: 50,
        effects: [{ type: 'DAMAGE', value: 1 }, { type: 'STUN' }],
    },
},
```

### Vì sao các con số này

| | Shadeleaf | Frostpod | **Cobb** |
|---|---|---|---|
| Đánh thường | LINE 8, 2 dmg | LINE 6, 1 dmg + chậm | **LOB 2, 2 dmg** |
| Bị đồng đội chặn | ✅ có | ✅ có | ❌ **không** |
| Máu / Di chuyển | 3 / 3 | 3 / 3 | **4 / 2** |
| Skill | xuyên 3 dmg @50 | xuyên hàng + chậm @50 | **choáng 1 mục tiêu @50** |

- **Tầm 2, di chuyển 2** là cái giá của đường vòng. Cô ấy phải bò lên gần, và bò chậm.
  Nếu cho cô tầm 6–8 thì Shadeleaf mất sạch lý do tồn tại.

### Điều chỉnh sau khi chơi thử — đánh thường 3 → 2

Bản đầu ship ở LOB 3 và nó quá mạnh, nhưng **không phải vì sát thương** (2, bằng Shadeleaf).
Vì **số mục tiêu hợp lệ**: LOB 3 phủ 24 ô bất kể vật cản, còn LINE chỉ chạm được unit đầu tiên
theo 4 hướng và chết ngay khi có đồng đội đứng chắn — thực chiến Shadeleaf thường có 1 mục tiêu
hoặc không có. Trong một game mà **~80% số lượt hành động là đánh thường**, khoảng chênh đó lớn
hơn mọi con số sát thương.

LOB 2 còn 12 ô. Cô phải đứng ngay sau tuyến mình đang bắn qua, với 4 máu — và đó cũng là thứ
làm *Hầm Bắp* (+3 máu) từ chỗ nhàm chán thành công thức đáng một slot.
**Ném Bơ giữ nguyên LOB 3**: skill trả tiền thì được phép là cái tay dài.
- **4 máu** vì cô đứng gần hơn hai pea kia.
- **2 sát thương** — bằng Shadeleaf. Cô ấy không phải "pea yếu hơn", cô ấy là pea **đổi tầm lấy góc bắn**.
- **Butter 50 Sun**: choáng mạnh hơn đẩy (Rolling Charge 25) và mạnh hơn làm chậm. Nếu chơi thử thấy
  yếu thì hạ 25, **đừng** tăng tầm.

---

## 4. Rào chắn bắt buộc: đừng giết Blizzard

Frostpod được viết rõ trong `heroes.ts`: *"She only ever SLOWS — a full freeze is what the Snow Pea
fusion (Blizzard) unlocks."* `UPGRADE_SLOW_TO_FREEZE` là **công thức đỉnh** của cô ấy.

Cobb có choáng ngay từ đầu. Điều đó **không** làm hỏng Blizzard, vì:
- STUN vốn đã lấy được qua 4 công thức đang tồn tại (Ironhusk/Sunspot/Maw + Snow Pea).
- Butter là **1 mục tiêu, tốn 50 Sun, mỗi lượt 1 lần**. Blizzard biến **mọi** đòn của Frostpod —
  kể cả skill xuyên cả hàng — thành choáng, **miễn phí, vĩnh viễn**. Hai thứ khác hạng.

**Luật cứng khi viết ma trận:** Cobb **không bao giờ** được nhận `ON_HIT_FREEZE` từ bất kỳ gear nào.
Choáng-mỗi-đòn-miễn-phí trên một hero bắn vòng cầu là mạnh hơn toàn bộ bộ kỹ năng của Frostpod.
Gear Snow Pea trên Cobb phải là `ON_HIT_SLOW`, không hơn.

---

## 5. Gear đi kèm: Corn, không phải Melon

Melon (nổ lan) là gear tốt — nhưng để **gói sau**, vì hai lý do:

1. `SIGNATURE_MATERIAL` quy định mỗi hero biết sẵn công thức với **chính cây gốc của mình**
   (`unlocks.ts:74`). Ghép Cobb với Melon là phá luật đó ngay ở entry đầu tiên.
2. Skill **chưa có splash** — `const targets = [pos]` ([App.tsx:972](App.tsx)). Chỉ item mới nổ lan
   ([App.tsx:824](App.tsx)). Melon cần viết mới; Corn thì không.

```ts
MAT_CORN: {
    id: 'MAT_CORN',
    name: 'Kernel-pult',
    description: 'Cần bắn vòng cầu. Đạn không còn quan tâm thứ gì đứng chắn.',
    coinCost: 125,                      // giữa Chomper 150 và Peashooter 100
    imgUrl: MATERIAL_SPRITES.MAT_CORN,
    effect: { type: 'ARC_ATTACK' },     // type mới
    benchClass: UnitClass.KERNEL_PULT,
    benchStats: { maxHp: 4, damage: 1, moveRange: 3 },
},
```

**Trục mới: `ARC_ATTACK`** — đổi `rangeType` của đòn đánh từ `LINE` sang `LOB`.
Nối dây ~5 dòng trong `applyFusionToSkill` ([fusion.ts:207](utils/fusion.ts)), cạnh chỗ đã xử lý
`MELEE_REACH_TRADE`. Vì hàm đó dùng chung cho cả lúc tính ô hợp lệ lẫn lúc ra đòn, overlay ngắm bắn
tự động đúng theo.

Trục này **không trùng** với bất kỳ nguyên liệu nào đang có — và nó vá ma sát ở mục 1 cho cả roster,
không riêng Cobb.

---

## 6. Hàng ngang — Cobb × 5 gear cũ

> Điểm yếu lõi của Cobb: **(a)** tầm ngắn + chậm → dễ bị áp sát; **(b)** butter tốn 50 Sun nên không
> dùng mỗi lượt được; **(c)** 2 sát thương không dứt điểm được mục tiêu dày máu.

| Gear | Tên fusion | Hiệu ứng | Trả lời | Code |
|---|---|---|---|---|
| Sunflower | **Buttered Sun** | `SKILL_DISCOUNT 25` | (b) — butter còn 25 Sun, dùng được gần như mỗi lượt | ✅ đã có |
| Peashooter | **Twin Cob** | `DOUBLE_ATTACK` | (c) — ném hai hạt, hoặc hai mục tiêu | ✅ đã có |
| Wall-nut | **Cob Bunker** | `BONUS_HP 3` | (a) — 7 máu, đứng gần được | ✅ đã có |
| Chomper | **Cob Grinder** | `RETALIATE_DAMAGE 2` | (a) — ai áp sát thì trả giá | ✅ đã có |
| Snow Pea | **Frostbutter** | `ON_HIT_SLOW` | (a) — giữ khoảng cách. **Không được là ON_HIT_FREEZE** (mục 4) | ✅ đã có |

**Cả 5 công thức chạy ngay, 0 dòng engine.**

---

## 7. Cột dọc — 5 hero cũ × gear Corn

Trục mặc định là `ARC_ATTACK`, nhưng đường vòng vô nghĩa với hero cận chiến — nên hai hero đó nhận
hiệu ứng vị bơ riêng. (Ma trận vốn viết tay theo từng cặp, nên đây là chuyện bình thường.)

| Hero | Tên fusion | Hiệu ứng | Trả lời điểm yếu | Code |
|---|---|---|---|---|
| Shadeleaf | **Mortar Pea** | `ARC_ATTACK` | Bị chính tường nhà chặn tầm bắn — giờ bắn qua đầu Ironhusk | ⚠️ type mới (~5 dòng) |
| Frostpod | **Arcing Frost** | `ARC_ATTACK` | Muốn làm chậm hàng sau nhưng hàng trước cản | ⚠️ dùng chung |
| Ironhusk | **Cob Turret** | `GRANT_ATTACK 0` | Chặn tốt mà không đóng góp — giờ có đòn tầm xa miễn phí | ✅ đã có |
| Maw | **Buttered Hide** | `RETALIATE_FREEZE` | 2 lượt tiêu hoá đứng chịu trận — ai đánh cô lúc đó thì mất lượt | ✅ đã có |
| Sunspot | **Kernel Battery** | `HARVEST_ATTACK 1` *(type mới)* | Harvest là lượt hoàn toàn bị động — giờ vừa thu Sun vừa bắn 1 hạt | ⚠️ ~10 dòng |

`Kernel Battery` có bản rẻ: `BONUS_HP 3` (0 dòng) nếu muốn hoãn.

---

## 8. Công thức chữ ký — Cobb × Corn

| Tên | Hiệu ứng |
|---|---|
| **Cob Cannon** | Butter Splat nổ lan: choáng cả ô trúng và 2 ô kề |

Đây là chỗ nên **viết sẵn cơ chế splash cho skill** — chính đoạn code mà gear Melon sẽ cần ở gói sau.
Làm một lần, dùng hai lần. Chép từ vòng lặp bán kính của item ([App.tsx:824](App.tsx)), và overlay xem
trước vùng nổ (`isInItemAoe` trong `Tile.tsx`) đã dựng sẵn để tái dùng.

---

## 9. Tổng chi phí

| Việc | Ước lượng |
|---|---|
| Hero + 2 skill | **0 dòng engine** (đã có sẵn) |
| 5 công thức hàng ngang | **0 dòng** |
| 2 công thức cột dọc (Ironhusk, Maw) | **0 dòng** |
| `ARC_ATTACK` | ~5 dòng, `utils/fusion.ts` |
| Splash cho skill (chữ ký) | ~15 dòng, `App.tsx` — dùng lại cho Melon sau |
| `HARVEST_ATTACK` *(tuỳ chọn)* | ~10 dòng |
| Data | `types.ts`, `heroes.ts`, `materials.ts`, `fusionRecipes.ts` (11 ô), `unlocks.ts`, `icons.ts` |
| i18n | ~35 chuỗi |
| Art | `hero-cobb.jpg`, `sprite-cobb.png`, `gear-corn.png` — 3 asset |

**7/11 công thức chạy được mà không đụng vào engine.** Có thể cầm Cobb đánh thử một run thật
trước khi vẽ bất kỳ asset nào — chỉ cần dùng tạm `/img/placeholder/kernel-pult.svg` đang có.

### Mở khoá
```ts
{ hero: 'KERNEL_PULT', bossNumber: 3, city: 'Goldacre',
  hint: 'Goldacre giữ được nhờ bắn vòng qua đầu tường. Phá vây lần thứ ba, pháo thủ của họ sẽ theo bạn.' }
```

---

## 10. Lộ trình sau gói này

| # | Hero | Gear | Trục mới |
|---|---|---|---|
| 6 | **Cobb** (Kernel-pult) | **Corn** | Đường vòng — bắn qua đầu đồng đội |
| 7 | Emberwood (Torchwood) | Torchwood | Địa hình / cháy dai — xem `PLAN-pack-6-emberwood.md` |
| 8 | *(chưa chọn)* | **Melon** | Nổ lan — cơ chế splash đã viết sẵn từ Cob Cannon |

Gear Melon ở gói 8 gần như **miễn phí về code** nếu Cob Cannon làm đúng ở gói 6, và nó có ý nghĩa với
cả 6 hero (kể cả cận chiến) — khác với Corn chỉ thật sự đổi lối chơi cho 3 hero tầm xa.
