# PLAN — Unique hoá ma trận fusion (bản rà soát để duyệt)

> **Cách dùng file:** mỗi mục có dòng `Trạng thái:` và `Góp ý:`. Sửa trực tiếp trong file:
> - `⬜ chờ duyệt` → đổi thành `✅ đồng ý` / `❌ bỏ` / `✏️ sửa` (viết ý vào dòng Góp ý).
> - Chưa có dòng code nào bị đụng — duyệt xong mới triển khai theo mục D.
> - **Khôi phục 2026-08-07:** bản này = góp ý vòng 1 của bạn + phản hồi `v2 (Claude)`, dựng lại sau sự cố file bị rollback. Nên `git add` + commit file này ngay để không mất lần nữa.
>
> Nguồn đối chiếu: `data/fusionRecipes.ts`, `utils/fusion.ts`, `types.ts`, `fusion-matrix.html`.

**Công thức rút từ cột MAT_PUMPKIN (cột duy nhất 9/9):** mỗi cột bán đúng **MỘT danh từ** (Pumpkin = "1 layer khiên"), mỗi ô chỉ đổi **TRIGGER** — mượn từ động từ lõi của hero. Trigger là identity của hero, mà 9 hero có 9 identity, nên ô tự unique:

| Hero | Trigger của layer |
|---|---|
| Sunbloom | khi Harvest |
| Peaburst | khi kill bằng Precision Blast |
| Snapmaw | khi bắt đầu tiêu hoá |
| Ironhusk | khi lẽ ra chết (1 lần/trận) |
| Cornova | khi ăn đòn đầu tiên |
| Reedwing | đầu trận |
| Thornshell | khi cast Provoke |
| Chardslam | khi slam chết mồi |
| Gourdward | khiên phát ra lan sang hàng xóm |

Mọi đề xuất bên dưới áp đúng công thức này cho 8 cột còn lại.

## 0. Hiện trạng đo theo cột (số effect type khác nhau / 9 ô)

| Material | Unique | Cụm trùng |
|---|---|---|
| MAT_PUMPKIN | **9/9** | — |
| MAT_CORN_MORTAR | 8/9 | `SKILL_STUN` ×2 |
| MAT_CHOMPER | 7/9 | `BLEED_ON_HIT` ×3 |
| MAT_CATTAIL | 7/9 | `MOVE_BONUS` ×3 |
| MAT_SPRING_ARM | 7/9 | `OVERWATCH_SHOT` ×2, `ON_HIT_PUSH` ×2 |
| MAT_WALLNUT | 6/9 | `BONUS_HP` ×2, `STEADFAST` ×2, `DAMAGE_REDUCTION` ×2 |
| MAT_SUNFLOWER | 5/9 | `SUN_ON_KILL` ×3, `SKILL_DISCOUNT` ×3 |
| MAT_PEASHOOTER | 5/9 | `DOUBLE_ATTACK` ×3, `ATTACK_RANGE_BONUS` ×3 |
| MAT_ENDURIAN | 5/9 | `TAUNT_ON_HIT` ×3, `RETALIATE_DAMAGE` ×3 |

Ngoài trùng-cột còn **1 trùng-HÀNG** (nặng hơn): hai ô của Chardslam giống hệt nhau → [C1.2].

Đích nếu duyệt hết: 8 cột đạt 9/9; MAT_WALLNUT theo [C8.v2] (9/9 hoặc 8/9 tuỳ lựa chọn Reedwing).

---

## A. Vấn đề độc lập với pass unique (sửa là đúng bất kể duyệt gì)

### [A1] fusion-matrix.html — 7 key sai chính tả → 7 ô render "Chưa rõ"

6 ô cột Spike Armor viết `MAT_SPIKE_ARMOR` (id đúng là `MAT_ENDURIAN`): dòng 707 (IRONHUSK), 718 (CORNOVA), 729 (REEDWING), 740 (THORNSHELL), 751 (CHARDSLAM), 762 (GOURDWARD). Cộng dòng 752: `CHARDSLAM:SPRING_ARM` thiếu tiền tố `MAT_`.

Hậu quả: 7 ô hiện fallback "Chưa rõ", trong đó có **2 ô SIG** (Bristling Armor, Grand Chard) — pills đếm 9 SIG nhưng bảng chỉ hiện 7.

- **Trạng thái:** ✅ đồng ý
- **Góp ý:** Sửa lại hết các id theo cú pháp MAT + tên loại cây gốc hoặc MAT + tên hero (Đồng nhất 1 cái thôi, nếu được thì tên HERO cho đỡ vi phạm bản quyền pvz)
- **v2 (Claude):** Chốt hướng `MAT_<HERO>`: `MAT_SUNBLOOM / MAT_PEABURST / MAT_SNAPMAW / MAT_IRONHUSK / MAT_CORNOVA / MAT_REEDWING / MAT_THORNSHELL / MAT_CHARDSLAM / MAT_GOURDWARD` — sạch bản quyền PvZ, và tự tài-liệu-hoá luật "mỗi gear là 2 trait của đúng một hero". Phạm vi thật KHÔNG chỉ HTML: `MaterialId` nằm trong `types.ts`, `data/materials.ts`, toàn bộ key `FUSION_RECIPES`, unlock/tutorial/shop nếu nhắc id, và **localStorage**: `pitb_progress_v1` lưu recipe đã học dạng `HERO:MATERIAL`, `pitb_run_v1` lưu mảng `fusions` — cần bảng map cũ→mới lúc load để không mất tiến trình người chơi (luật bất khả xâm phạm của persistence.ts). HTML tự đúng nhờ [A3]. Xếp thành đợt riêng, làm TRƯỚC [A3] để generator chạy một lần trên id cuối.

### [A2] fusion-matrix.html — ô lệch nội dung so với fusionRecipes.ts

1. `REEDWING:MAT_WALLNUT` (dòng 726): HTML ghi "+3 Máu tối đa (4→7 HP)" — TS là `DAMAGE_REDUCTION 1` ("Takes 1 less damage from every hit"). Hai bản kể hai hiệu ứng khác hẳn nhau. (Liên quan quyết định [C8] — có thể HTML mới là ý định đúng.)
2. `GOURDWARD:MAT_CATTAIL` (dòng 761): HTML ghi "Airborne Rind — Encase tạo cuồng phong đẩy lùi" (đó là hiệu ứng của Shockrind/`SKILL_REPEL`) — TS là "Rolling Rind" `ENCASE_RANGE` (cast xa hơn 2 ô).
3. Nhẹ: `SNAPMAW:MAT_PUMPKIN` HTML kể "mỗi kill cắn nuốt" — TS kể "lúc BẮT ĐẦU tiêu hoá"; cùng thời điểm trong thực tế nhưng nên thống nhất cách kể.

- **Trạng thái:** ✅ đồng ý
- **Góp ý:** Sửa A3 và chốt ở mục C là cái này tự giải
- **v2 (Claude):** Đúng — không sửa tay HTML nữa: [A3] sinh từ TS sau khi mục C ngã ngũ, ba chỗ lệch tự biến mất.


### [A3] fusion-matrix.html là bản chép tay thứ hai của data — sẽ tiếp tục trôi

Footer ghi "Data Synced 100% with data/fusionRecipes.ts" nhưng A1+A2 cho thấy đã lệch. Đề xuất: viết script nhỏ (node) đọc `FUSION_RECIPES` và sinh lại khối `const RECIPES = {...}` trong HTML (hoặc sinh nguyên file). Chạy tay khi cần, không cần đưa vào build.

- **Trạng thái:** ✅ đồng ý
- **Góp ý:**

### [A4] Description nói khác engine (4 chỗ trong fusionRecipes.ts)

1. **Catapult Rotor** (`CHARDSLAM:MAT_CATTAIL`, dòng 530): hứa "every shove, **toss**, and slam +1 tile" — nhưng TOSS là ném gương qua đầu tới ô `2·C − T` (`skillResolution.ts:682`), không phải trượt tile; `applyFusionToSkill` chỉ cộng distance cho PUSH/PULL (`fusion.ts:499`). Chữ "toss" trong desc là lời hứa suông → bỏ chữ "toss" (hoặc chấp nhận [C1.2] thì ô này thành bản +distance duy nhất, viết lại desc luôn).
2. **Spiked Bulwark** (`IRONHUSK:MAT_ENDURIAN`, dòng 304): hứa "Plate Slam deals **+1 extra damage** and reflects +1" — effect chỉ có `RETALIATE_DAMAGE 1`, không có nửa "+1 damage". Sửa desc, hoặc nếu duyệt [C7.3] thì viết lại toàn bộ.
3. **Iron Bulwark + Armored Chard** (dòng 286, 518): cả hai desc nói "reduces collision damage by **50%**" — engine thực tế cho STEADFAST **miễn 100%** damage va chạm (`actionBuilders.ts:142`, `turnManager.ts:394`, `skillResolution.ts:282`). Desc đang hứa THIẾU. Sửa desc về "miễn va chạm".
4. **Armored Chard** (dòng 518): desc không nhắc gì tới `-1 damage/hit` mà `STEADFAST value 1` đang cho anh ấy qua `gameLogic.ts:404`. Người chơi đang nhận một buff không được kể. (Nếu duyệt [C8.1] thì hết lệch — nửa -1/hit bị cắt đúng như desc.)

- **Trạng thái:** ✅ đồng ý
- **Góp ý:** Sửa lại description dựa trên engine
- **v2 (Claude):** Chốt: engine là chân lý, desc viết lại theo engine; ô nào mục C đổi hành vi thì desc viết theo hành vi MỚI trong cùng commit.

### [A5] types.ts — 4 effect type khai báo mà không recipe nào cấp, engine không resolve

`ARMOR_SHRED`, `NEEDLE_BURST`, `WIND_TAUNT`, `FLYER_REPEL` (types.ts:1089-1094): không xuất hiện trong `FUSION_RECIPES`, không có chỗ nào trong `utils/` đọc chúng. Đây đúng là lỗi "khai vocabulary rồi bỏ" mà comment RADIUS trong repo tự cảnh báo. Đề xuất:

- `WIND_TAUNT` → tái dùng cho [C7.2] (Reedwing).
- `FLYER_REPEL` → tái dùng cho [C4.2] (Reedwing).
- `NEEDLE_BURST`, `ARMOR_SHRED` → **xoá** (trừ khi bạn còn kế hoạch cho chúng — ghi vào Góp ý).

(Khác với nhóm trên: `ADJACENT_STRIKE`, `RETALIATE_FREEZE`, `SPIKE_TRAIL`... là mồ-côi-data nhưng engine VẪN resolve — giữ.)

- **Trạng thái:** ✅ đồng ý
- **Góp ý:** source of trust là engine
- **v2 (Claude):** Theo đúng nguyên tắc đó: type engine không resolve → xoá (`NEEDLE_BURST`, `ARMOR_SHRED`) hoặc cho sống lại bằng wiring thật (`WIND_TAUNT`, `FLYER_REPEL` ở [C7.2]/[C4.2]); type engine đang resolve thì giữ dù mồ-côi-data (`RETALIATE_FREEZE` để dành cho ICE element).

### [A6] WALL-NUT COLUMN RULE — comment và data đã lệch nhau

Comment luật cột (fusionRecipes.ts:73-77): melee mua `DAMAGE_REDUCTION`, ranged mua `BONUS_HP`. Data hiện tại phá luật ở 2 ô mà không ghi chú exception:

- `REEDWING` (ranged) nhận `DAMAGE_REDUCTION` thay vì `BONUS_HP` — và HTML lại ghi +3 HP (dấu vết ý định cũ?).
- `THORNSHELL` (melee) nhận `THORN_LUNGE` — không liên quan gì tới "chịu đòn".

Không sửa ngay — đây là đầu vào cho quyết định [C8]. Nêu ở đây để không quên cập nhật comment sau khi chốt.

- **Trạng thái:**
- **Góp ý:**
- **v2 (Claude):** Gộp vào [C8.v2] — luật cột được viết lại ở đó, mục này đóng theo.

### [A7] 14/81 Ô BÁN CHO NGƯỜI CHƠI MÀ ENGINE KHÔNG ĐỌC — phát hiện 2026-08-07, nặng nhất file này

Quét toàn repo: 56 `FusionEffectType` được `data/fusionRecipes.ts` cấp; **14 cái chỉ tồn tại ở đúng hai nơi — `types.ts` (khai) và `fusionRecipes.ts` (cấp). Không một dòng nào trong `utils/`, `hooks/`, `components/`, `App.tsx` đọc chúng.** Cả 14 ô đều gắn `live: true`, tức đang được bày bán, mua được, hiện trên thẻ bài — và **không làm gì cả**.

| Effect type | Ô | Hero × Gear |
|---|---|---|
| `BLEED_EXECUTION` | Executioner Pods | Reedwing × Chomper |
| `BLESS_RETALIATE` | Thorned Bloom | Sunbloom × Endurian |
| `DASH_DISTANCE` | Overdrive Charge | Ironhusk × Cattail |
| `DIGEST_MOVE` | Prowl Rotor | Snapmaw × Cattail |
| `DIGEST_RETALIATE` | Bristleback | Snapmaw × Endurian |
| `DIGEST_STEADFAST` | Anchored Gullet | Snapmaw × Spring Arm |
| `ENCASE_RANGE` | Rolling Rind | Gourdward × Cattail |
| `HARVEST_SHIELD` | Dawn Harvest | Sunbloom × Pumpkin |
| `LASER_NEEDLE` | Piercing Needles | Thornshell × Peashooter |
| `PROVOKE_SHIELD` | Warded Provoke | Thornshell × Pumpkin |
| `REACTIVE_SHIELD` | Reactive Cob Shell | Cornova × Pumpkin |
| `SHIELD_ON_DIGEST` | Warded Gut | Snapmaw × Pumpkin |
| `SHIELD_ON_SKILL_KILL` | Precision Shield | Peaburst × Pumpkin |
| `THORN_LUNGE` | Thorn Lunge | Thornshell × Wallnut |

**Không có dispatch chung để cứu.** `utils/fusion.ts:147` `applyFusion` chỉ special-case đúng `BONUS_HP` và `MOVE_BONUS`; mọi effect khác bắt buộc phải có một điểm đọc viết tay bằng `hasFusionEffect('LITERAL')` / `getFusionEffectValue('LITERAL')`. Không tồn tại bảng type→handler nào.

**Ba hệ quả phải chỉnh ngay trong file này:**

1. **Bảng "unique" ở mục 0 đang đếm TÊN, không đếm HÀNH VI.** Cột MAT_PUMPKIN được khen 9/9 — nhưng 5/9 ô của nó nằm trong bảng trên (Dawn Harvest, Warded Provoke, Reactive Cob Shell, Warded Gut, Precision Shield). Cột "chuẩn mực" mà cả pass này lấy làm công thức thực chất chỉ có 4 ô chạy thật.
2. **Mục C đang bảo vệ ô không tồn tại.** Các dòng "Giữ nguyên:" đã kê `THORN_LUNGE`, `DASH_DISTANCE`, `DIGEST_MOVE`, `DIGEST_RETALIATE`, `DIGEST_STEADFAST`, `ENCASE_RANGE`, `BLESS_RETALIATE`, `LASER_NEEDLE`, `BLEED_EXECUTION` như "ô đã ổn, đừng đụng". Chúng không ổn — chúng rỗng.
3. **Đây đúng là luật mục B bị phá 14 lần:** *"Không khai type trước khi wire (bài học RADIUS) — dùng `live: false` nếu cần land data trước."* Cả 14 ô đều `live: true`.

**Đề xuất:** tách thành **đợt 0 — làm TRƯỚC mọi thứ khác**, vì mọi đo đạc unique/cân bằng phía sau đều đứng trên số liệu sai chừng nào 14 ô này còn rỗng. Mỗi ô hai đường: **wire thật**, hoặc **hạ `live: false`** để nó biến khỏi shop cho tới khi có người viết. Không có đường thứ ba (giữ `live: true` không wire = bán hàng không có hàng).

- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

---

## B. Quy ước chung cho mọi đề xuất ở mục C

- Mỗi cụm trùng ×N: **giữ 1 ô làm "bản gốc"** (thường là ô SIG hoặc ô phẳng nhất), refract các ô còn lại. Ô giữ nguyên cũng liệt kê để bạn veto được lựa chọn "giữ bên nào".
- Type mới = 1 entry `types.ts` (kèm doc comment) + wiring tại đúng điểm resolve + entry `i18n/vi.ts`. **Không khai type trước khi wire** (bài học RADIUS) — dùng `live: false` nếu cần land data trước.
- Mọi đề xuất phải qua được các luật thành văn: STUN RULE, SUN ECONOMY RULE, RETALIATION RULE, VOLLEY CAP. Mục nào chạm luật đều có dòng "Luật".

---

## C. Đề xuất refract — từng tổ hợp

### C1. MAT_CORN_MORTAR — 8/9, gần chuẩn nhất (danh từ cột: "phát nổ / chấn động")

Giữ nguyên: Sunbloom `SKILL_AURA`, Peaburst `ARC_ATTACK`, Snapmaw `STUN_ON_FULL_HP`, Cornova `SKILL_SPLASH` (SIG), Reedwing `WING_MIDSHOT`, Thornshell `TAUNT_RADIUS`, **Ironhusk `SKILL_STUN` (Stun Charge — bản gốc của exception: 1 mục tiêu, theo cú tông, trả bằng Sol)**.

#### [C1.1] GOURDWARD × MAT_CORN_MORTAR — "Stun Shell"

- **Hiện tại:** `SKILL_STUN` — Encase stun mọi zombie trong vùng cast (fusionRecipes.ts:582).
- **Vấn đề:** trùng type với Stun Charge của Ironhusk (2/3 exception của STUN RULE chung một implementation).
- **Đề xuất:** đổi tên **"Payback Shell"**, type mới **`SHIELD_BREAK_STUN`** — layer do Encase tạo được đánh dấu; kẻ nào **đập vỡ** layer đó (đòn melee) bị STUN lượt kế. Mỗi layer 1 lần.
- **Vì sao hợp:** trigger dời từ "lúc bọc" sang "lúc vỡ" — vẫn là danh từ chấn-động của corn, nhưng gắn vào identity khiên của Gourdward; melee-only đồng bộ với tiền lệ Glass Rind ("hòn đá ném từ xa làm vỡ kính mà không chạm vào nó").
- **Luật:** STUN RULE — vẫn exception có giá, thậm chí đắt hơn bản cũ: 50 Sol + đứng trong đám + stun đến CHẬM một nhịp và địch phải tự đấm vỡ mới dính.
- **Wiring:** móc vỡ-layer đã có sẵn tại `turnManager.ts:836-847`; stamp cờ lên body lúc phát khiên theo đúng mẫu `shieldBarbed` (`skillResolution.ts:198`). Độ khó: **Vừa**.
- **Trạng thái:** ✅ đồng ý
- **Góp ý:**

#### [C1.2] CHARDSLAM × MAT_CORN_MORTAR — "Catapult Chard" (trùng HÀNG, ưu tiên cao nhất)

- **Hiện tại:** `PUSH_DISTANCE 1` — desc "Sweep throws 3 tiles instead of 2" (fusionRecipes.ts:524).
- **Vấn đề:** **giống hệt** `CHARDSLAM:MAT_CATTAIL` (Catapult Rotor, cũng `PUSH_DISTANCE 1`) — cùng một hero, hai món đồ, một hiệu ứng; engine áp toàn cục cho mọi PUSH/PULL nên desc "chỉ Sweep" cũng sai nốt; fuse cả hai thì stack +2 vì `getFusionEffectValue` cộng dồn.
- **Đề xuất:** đổi tên **"Blast Chard"**, type mới **`COLLISION_SPLASH`** — khi anh slam một body vào chướng ngại/body khác, **ô phía sau điểm va** (theo hướng đẩy) dính 1 damage. Corn = thuốc nổ gắn vào điểm chạm.
- **Vì sao hợp:** Chardslam 0-damage là hero; đây vẫn không phải "đánh có damage" — damage sinh ra từ VA CHẠM anh dàn dựng, khác `COLLISION_BONUS` (spring: +2 cho chính con bị slam) ở chỗ nó lan sang hàng xóm sau bức tường.
- **Luật:** khớp ghi chú BONUS_DAMAGE trong fusion.ts — không bolt số damage lên đòn của anh; số này nằm trên bảng, không trên skill card.
- **Wiring:** cùng site với `COLLISION_BONUS` (`skillResolution.ts:268-284` đã cộng phần thưởng va chạm cho hero). Độ khó: **Vừa**.
- **Phương án phụ (rẻ hơn):** `SKILL_PUSH_DISTANCE` — chỉ Sweep +1 đúng như desc hiện tại; nhưng vẫn na ná Catapult Rotor (tập con), unique yếu.
- **Trạng thái:** ✏️ Cần thảo luận
- **Góp ý:** Nếu ném gây va chạm thì 2 đối tượng mất thêm 1 máu (2 thay vì 1, giống kiểu ném kèm vụ nổ)
- **v2 (Claude) — phản biện:** Ý "va chạm thì cả hai +1" đụng đúng SIG của anh ấy: **Grand Chard** (`COLLISION_BONUS`, MAT_SPRING_ARM) đã bán trục đó — engine cộng bonus cho MỌI body trong danh sách va chạm (`plan.collided` gồm cả hai bên), tức "cả hai +2" đã tồn tại. Bản corn "cả hai +1" sẽ là bản-nhỏ-của-SIG ngay trong hàng — đúng lỗi PUSH_DISTANCE×2 mình đang diệt, và fuse cả hai thành "+3 mỗi va chạm" trên một trục duy nhất. Giữ fantasy "ném kèm vụ nổ" mà vẫn unique: **vụ nổ văng ra NGOÀI cặp va chạm** — cú ném gây va chạm thì mọi ENEMY đứng kề Ô VA CHẠM (trừ 2 body đã trả tiền va chạm) dính 1. Hai body: Grand Chard lo; đám đứng xem: Blast Chard lo. Overlay tô vùng nổ trước khi ném. Type `COLLISION_SPLASH` giữ, spec đổi thành vòng-kề-điểm-va.
Final: kịch bản max là 6 ô đúng ko
- **v3 (Claude) — trả lời:** Đúng, **6**. Và 6 không phải "trần hiếm gặp" — nó là con số CỐ ĐỊNH của mọi ca ném-thân-vào-thân. Hình học: thân bị ném (A) dừng ngay kề thân bị đâm (B), hai ô kề trực giao nhau. Vòng nổ = ô kề trực giao của CẢ HAI thân, trừ chính hai thân. A góp 3, B góp 3, và hai ô kề trực giao **không có hàng xóm chung nào** nên không bao giờ chồng lấn → luôn đúng 6.
  Ba ca biên chốt luôn cho khỏi hỏi lại lúc code:
  - **Ném vào TƯỜNG / đá / mép bàn:** chỉ MỘT thân trả tiền va chạm → vòng nổ **3 ô** quanh thân đó. Tường không phát nổ (nó không phải thân, không ăn damage, không có gì để văng).
  - **Ném xuống NƯỚC / hố:** không có va chạm → **không có nổ**. Nước nuốt gọn.
  - **Đếm KỀ TRỰC GIAO, không tính chéo.** Tính cả chéo thì con số nhảy lên **10** — quá tay cho một ô của hero 0-damage.
  Giữ nguyên "chỉ ENEMY dính": ally/Greenspire đứng trong vòng không sao. Đây là ưu đãi CÓ CHỦ ĐÍCH (anh là hero 0-damage, phải xài được trong đội hình chật), cố tình khác `BLESS_SHOCKWAVE` — ô đó đẩy cả người nhà và điều đó là tính năng. Muốn chặt hơn (nổ dính cả ally) thì nói một câu, tôi đổi.

### C2. MAT_CHOMPER — 7/9 (danh từ cột: "vết cắn / vết thương hở")

Giữ nguyên: Sunbloom `BLESS_POWER`, Snapmaw `DIGEST_REDUCTION` (SIG), Ironhusk `BONUS_DAMAGE`, Reedwing `BLEED_EXECUTION`, Thornshell `RETALIATE_BLEED`, Gourdward `BARBED_SHIELD`, **Peaburst `BLEED_ON_HIT` (Serrated Pea — bản phẳng làm gốc)**.

#### [C2.1] CORNOVA × MAT_CHOMPER — "Shrapnel Kernel"

- **Hiện tại:** `BLEED_ON_HIT` — đạn để lại bleed: đòn kế tiếp +1 rồi vết đóng (fusionRecipes.ts:338).
- **Vấn đề:** trùng Peaburst và Chardslam.
- **Đề xuất:** giữ tên, type mới **`BLEED_PERSIST`** — vết bleed do CÔ gây **không đóng lại**: mọi đòn sau đó lên mục tiêu đều +1 (không chỉ đòn kế tiếp), tới khi mục tiêu chết. Bleed từ nguồn khác giữ nguyên luật một-lần.
- **Vì sao hợp:** artillery đánh dấu mục tiêu lớn cho cả đội khoan vào — đúng vai mid-range của cô; Peaburst mark một nhát, Cornova mở toác.
- **Wiring:** chỗ tiêu mark bleed trong damage calc — thêm cờ "persistent" stamp theo nguồn (mẫu `blessPower`: stamp lên body bị dính lúc áp). Độ khó: **Thấp-Vừa**. Cân bằng: mạnh trên boss — đúng chủ đích, nhưng để mắt khi test.
- **Trạng thái:** ✏️ Cần thảo luận
- **Góp ý:** Skill gây ra 1 dame cho 4 ô xung quanh (nổ văng miếng)
- **v2 (Claude) — phản biện:** "Skill 1 damage cho 4 ô xung quanh" là đúng nguyên văn định nghĩa `SKILL_SPLASH` trong types.ts — chính là ô SIG của cô (Cob Howitzer, MAT_CORN_MORTAR): sẽ thành trùng-HÀNG với SIG. Giữ fantasy "nổ văng miếng" nhưng theo danh từ cột chomper (vết thương): **`SKILL_BLEED_SPLASH`** — Nova Shell văng mảnh: 4 ô quanh mục tiêu dính **BLEED** thay vì damage. Khác SIG (ring stun/slow), khác Serrated Pea (bleed một mục tiêu), và mở combo đội: Executioner Pods của Reedwing (+2 lên mục tiêu đang bleed) ăn cả vòng mảnh. Fuse cả corn + chomper: một phát Nova Shell = ring stun/slow + ring bleed — build "pháo mở toang" đúng nghĩa.
Final: okie, chảy máu hợp vai chomper hơn

#### [C2.2] CHARDSLAM × MAT_CHOMPER — "Rending Chard" (data honesty — hành vi KHÔNG đổi)

- **Hiện tại:** `BLEED_ON_HIT` — bleed theo cú ném (fusionRecipes.ts:512).
- **Vấn đề:** trùng type, nhưng engine vốn ĐÃ đối xử riêng: `applyFusionToSkill` gate bleed của anh qua `hasDamage || hasShove` (fusion.ts:380-384) — một special-case tồn tại chỉ vì type chưa nói thật.
- **Đề xuất:** giữ tên, type mới **`BLEED_ON_SHOVE`** — hành vi giữ nguyên 100%; `BLEED_ON_HIT` thu về gate `hasDamage` thuần.
- **Vì sao hợp:** cú ném là "đòn" của anh — type nói đúng điều desc và engine đã nói.
- **Wiring:** tách 1 clause có sẵn trong `applyFusionToSkill` — code còn GỌN đi. Độ khó: **Thấp**.
- **Trạng thái:** ✏️ Cần thảo luận
- **Góp ý:** mọi kẻ địch bị indirect dam từ việc push/pull/toss đều bị bleed (ném 2 kẻ địch vào nhau cả 2 đều bị trừ 1 máu + bleed)
- **v2 (Claude):** Chốt theo góp ý, spec: mọi ENEMY nhận damage VA CHẠM từ cú đẩy/kéo/ném của anh đều dính BLEED — ném 2 con vào nhau: cả hai -1 máu (va chạm sẵn có) + cả hai bleed ✓. Ném ra ô trống không va chạm = không bleed (chặt hơn bản hiện tại, đúng "đập vào mới toác"). Type `BLEED_ON_SHOVE` giữ, điểm móc chuyển sang site va chạm — cùng cụm wiring với [C1.2v2], làm chung một đợt.
Final: okie

### C3. MAT_CATTAIL — 7/9 (danh từ cột: "cơ động / cánh quạt")

Giữ nguyên: Peaburst `SKILL_DISARM`, Snapmaw `DIGEST_MOVE`, Ironhusk `DASH_DISTANCE`, Cornova `SMOKE_ON_HIT`, Chardslam `PUSH_DISTANCE` (thành duy nhất sau [C1.2]), Gourdward `ENCASE_RANGE`. **v2 theo góp ý [C3.2]: Thornshell GIỮ `MOVE_BONUS` (bản +1 phẳng duy nhất còn lại của cột), ô SIG của Reedwing đổi thành hit & run.**

#### [C3.1] SUNBLOOM × MAT_CATTAIL — "Sunchaser"

- **Hiện tại:** `MOVE_BONUS 1` — "+1 move, đi kịp đội hình" (fusionRecipes.ts:124).
- **Vấn đề:** trùng Reedwing và Thornshell.
- **Đề xuất:** giữ tên, type mới **`FOLLOW_STEP`** — 1 lần/lượt người chơi: khi một ally di chuyển RỜI ô kề Sunbloom, cô tự bước 1 ô về phía ô mới của ally (nếu ô đích trống, không hazard). Không tốn action.
- **Vì sao hợp:** "the battery keeps up with the squad" thành cơ chế đen-nghĩa-đen: cô không nhanh hơn — cô BÁM theo. Cơ động có điều kiện, đúng hero phải-được-hộ-tống.
- **Wiring:** móc sau resolve di chuyển của ally trong `useGameEngine`/App — bản auto không cần UI. Độ khó: **Vừa-Cao** (điểm móc mới trong luồng move). Phương án phụ nếu ngại: hoán đổi — Sunbloom giữ `MOVE_BONUS`, refract Thornshell + Reedwing (nhưng Reedwing là SIG, không nên đổi).
- **Trạng thái:** ✏️ Cần thảo luận
- **Góp ý:** Nếu start turn có ít nhất 1 đồng đội bên cạnh thì turn này cả 2 được + 1 move
- **v2 (Claude):** Theo góp ý — bỏ FOLLOW_STEP. **`CONVOY_AURA`** ("Sunchaser" giữ tên): đầu lượt người chơi, nếu Sunbloom kề ≥1 ally → Sunbloom VÀ mọi ally đang kề cô +1 move trong lượt này (buff tạm, xoá cuối lượt). Đúng "trạm sạc cấp điện cho đoàn xe". Giá tự cân: muốn ăn aura phải đứng dính chùm — đúng thứ AoE và lan điện trừng phạt. Nếu test thấy mạnh, nút vặn đầu tiên: chỉ 1 ally gần nhất thay vì tất cả. Wiring: hook đầu lượt + move calc đọc buff tạm (tiền lệ conditional-move: `DIGEST_MOVE`). Độ khó: Vừa-Cao.
Final:  okie

#### [C3.2] THORNSHELL × MAT_CATTAIL — "Windburr"

- **Hiện tại:** `MOVE_BONUS 1` — "+1 move để chọn vị trí Provoke" (fusionRecipes.ts:472).
- **Vấn đề:** trùng Reedwing và Sunbloom.
- **Đề xuất:** giữ tên, type mới **`PROVOKE_STEP`** — sau khi cast Provoke, được bước 1 ô miễn phí (chọn ô kề trống). Taunt xong tự đặt lại vị trí — "gai bay theo gió".
- **Vì sao hợp:** desc cũ tự khai mục đích ("cơ động ĐỂ Provoke") — vậy gắn thẳng bước chân vào cú Provoke; mua trải nghiệm "khiêu khích rồi rút về thế chịu đòn đẹp" thay vì +1 phẳng.
- **Wiring:** móc sau resolve skill; cần UI chọn ô (App đã có pattern chọn ô cho skill targeting). Độ khó: **Vừa**. Bản auto rẻ hơn: tự lùi về ô kề xa cụm enemy nhất.
- **Trạng thái:** ✏️ Cần thảo luận
- **Góp ý:** Giữ cộng 1 move, swap với công thức của Reedwing. Reedwing move cao giờ bắn xong được free 1 move -> hit & run
- **v2 (Claude):** Chốt swap: **Windburr giữ nguyên `MOVE_BONUS` +1 — ô này hết việc.** Đổi lại, ô SIG cattail của Reedwing (Overdrive Rotor) thành **`ATTACK_THEN_MOVE`** — sau khi tấn công, được bay thêm 1 ô miễn phí (được phép bỏ qua). "Herself, turned up" càng đúng: doctrine gunship. Cột hết trùng (MOVE_BONUS chỉ còn Thornshell). Wiring: CAO — phá pattern "unit hành động xong là khoá"; cần bước move phụ sau attack (UI re-enter move 1 ô). Vì diễn ra SAU khi attack đã commit nên không đụng hệ hoàn-tác-move. Đây là mảnh nền cho combo WIND_TAUNT [C7.2] như bạn chỉ ra — hai ô cùng một hệ móc di chuyển, làm chung đợt.
Final:  okie

### C4. MAT_SPRING_ARM — 7/9 (danh từ cột: "lực bật / xung lực")

Giữ nguyên: Sunbloom `BLESS_SHOCKWAVE`, Snapmaw `DIGEST_STEADFAST`, Ironhusk `PUSH_DISTANCE`, Chardslam `COLLISION_BONUS` (SIG), Gourdward `SKILL_REPEL`, **Peaburst `OVERWATCH_SHOT` (đường bắn thẳng là identity của cô — bản gốc)**, **Thornshell `ON_HIT_PUSH` (Sprung Thorn — cú swipe hất, melee push chuẩn)**.

#### [C4.1] CORNOVA × MAT_SPRING_ARM — "Overwatch Cob"

- **Hiện tại:** `OVERWATCH_SHOT` — bắn phục kích khi đồng đội hất quái vào tầm arc (fusionRecipes.ts:368).
- **Vấn đề:** trùng Peaburst (cùng implementation, chỉ khác tầm).
- **Đề xuất:** đổi tên **"Recoil Cob"**, type mới **`ON_HIT_PULL`** — đạn cối của cô **KÉO** mục tiêu 1 ô về phía cô. Lò xo hoạt động hai chiều.
- **Vì sao hợp:** displacement chiều ngược — độc nhất toàn matrix (chưa ô nào pull trên đòn thường). Chiến thuật: giật zombie ra khỏi mặt ally, kéo vào vùng Nova Shell, kéo mồi vào hazard phía trước nó.
- **Luật:** đối xứng hoàn toàn với `ON_HIT_PUSH` đã được chấp nhận — cùng mức đền (đẩy 1 ↔ kéo 1), `PULL` đã có trong vocab skill effect và `planPush` xử lý được.
- **Wiring:** thêm 1 rider trong `applyFusionToSkill` cạnh `ON_HIT_PUSH` (fusion.ts:362). Độ khó: **Thấp**.
- **Trạng thái:** ✅ đồng ý
- **Góp ý:** vậy cặp đôi cornova và pea có thể support nhau, cornova pull vào tầm, pea bắn phụ
- **v2 (Claude):** Combo bạn nêu chạy thật trên engine: `OVERWATCH_SHOT` kích theo "cú shove của đội" và PULL đi qua đúng `planPush` — Cornova kéo zombie vào hàng ngắm là Overwatch Pea của Peaburst nổ. Hai ô spring tự combo, không cần code thêm gì riêng.
Final: okie

#### [C4.2] REEDWING × MAT_SPRING_ARM — "Downwash"

- **Hiện tại:** `ON_HIT_PUSH 1` — rocket đẩy cả hai mục tiêu lùi 1 ô (fusionRecipes.ts:426).
- **Vấn đề:** trùng Thornshell.
- **Đề xuất:** giữ tên (tên đang rất hợp!), **tái dùng type `FLYER_REPEL`** (đã khai ở types.ts:1094, chưa wire — xem [A5]) — khi cô **kết thúc di chuyển**, mọi enemy kề ô đáp bị thổi lùi 1 ô (gió ép của rotor). 1 lần/lượt.
- **Vì sao hợp:** xung lực gắn vào việc BAY thay vì vào đạn — trigger là chuyện chỉ mình cô làm (đáp xuống giữa trận địa); giá là cô phải bay VÀO tiếp xúc bằng thân giấy.
- **Luật:** đẩy qua `planPush` chuẩn → va chạm vẫn tính damage như mọi cú đẩy; để mắt độ mạnh khi test (đẩy 4 hướng miễn phí mỗi lượt) — nếu lố, hạ xuống "chỉ đẩy enemy đứng cạnh Ô ĐÁP theo hướng ra xa cô".
- **Wiring:** móc cuối move của player. Độ khó: **Vừa**.
- **Trạng thái:** ✏️ Cần thảo luận
- **Góp ý:** Hiện tại move và attact bị tách biệt, move có thể hoàn tác. bạn có thể làm được chuẩn thì okie. Kịch bản khi đó là nếu reedwing có cả mat_corn và mat_spring và kẻ địch đang dạng chữ v thì bay đến đẩy lùi quái gần nhất thành hình chữ v, bắn 1 phát được cả 3
- **v2 (Claude):** Chuẩn hoá theo concern hoàn-tác: Downwash theo luật "thấy trước khi click" — mũi tên đẩy hiện NGAY TRONG overlay chọn ô đáp (như overlay skill); xác nhận một nước đi CÓ Downwash = nước đi khoá, không hoàn tác nữa (đúng luật đã áp cho cast skill); nước đi không chạm enemy nào thì hoàn tác như thường. Kịch bản chữ V chạy đúng: đáp cạnh đỉnh V → thổi con giữa lùi 1 → ba con thành hàng ngang → volley 2 nòng + Cluster Load (MAT_CORN, ô giữa) trúng cả 3. Combo 2 gear, cả hai đều là đồ chính chủ của cô — build đúng nghĩa.
Final: okie

### C5. MAT_SUNFLOWER — 5/9 (danh từ cột: "số lần cast skill mỗi trận" — GIỮ nguyên linh hồn A/B của cột)

Comment cột này tự hào "most disciplined column" — các đề xuất dưới **không phá** điều đó: mọi ô vẫn bán đúng một thứ là "thêm lượt cast", chỉ refract cơ chế chi trả. Giữ nguyên: Sunbloom `SUN_PER_TURN` (SIG), Snapmaw `SUN_WHILE_DIGESTING`, Ironhusk `SUN_ON_BLOCK_SPAWN`, **Peaburst `SUN_ON_KILL 10` (bản gốc nhánh A)**, **Cornova `SKILL_DISCOUNT 15` (bản gốc nhánh B)**.

#### [C5.1] REEDWING × MAT_SUNFLOWER — "Solar Rotor"

- **Hiện tại:** `SUN_ON_KILL 15` — desc "two barrels, two chances a turn" (fusionRecipes.ts:384).
- **Vấn đề:** trùng Peaburst/Chardslam — engine trả cho MỌI kill như nhau (`actionBuilders.ts:41`), ba ô chỉ khác value.
- **Đề xuất:** giữ tên, type mới **`SUN_ON_DOUBLE_KILL` 30** — lượt nào cô kết liễu **≥2 mạng** thì +30 Sol (1 lần/lượt). Kill đơn không trả gì.
- **Vì sao hợp:** double-kill là chuyện hai nòng của cô làm được đều đặn còn ai khác thì hãn hữu — trigger thuần identity; phần thưởng to hơn nhưng khó hơn.
- **Luật:** SUN ECONOMY RULE ✓ — vẫn trả cho "finishing something off", chỉ nâng ngưỡng.
- **Wiring:** đếm kill theo lượt tại site `SUN_ON_KILL` hiện có. Độ khó: **Vừa-Thấp**.
- **Trạng thái:** ✅ đồng ý
- **Góp ý:**

#### [C5.2] CHARDSLAM × MAT_SUNFLOWER — "Sunlit Chard" (data honesty)

- **Hiện tại:** `SUN_ON_KILL 15` — desc ĐÃ hứa "every zombie he shoves into water, rock or another body pays 15" (fusionRecipes.ts:500) nhưng engine trả cho mọi kill, kể cả không-va-chạm.
- **Đề xuất:** giữ tên, type mới **`SUN_ON_COLLISION_KILL` 20** — CHỈ kill mà nguyên nhân là va chạm/nước/hố do anh gây mới trả; nâng 15→20 vì điều kiện hẹp lại.
- **Vì sao hợp:** desc đã kể đúng từ đầu — đề xuất này bắt engine giữ lời. Slam-kill là động từ duy nhất của anh.
- **Wiring:** `planPush` đã trả danh sách `drowned`/`collided` và killer-credit qua cú đẩy đã tồn tại (`itemResolution.ts:118`) — chỉ thêm phân loại nguyên nhân tại site trả tiền. Độ khó: **Thấp-Vừa**.
- **Trạng thái:** ✅ đồng ý
- **Góp ý:**

#### [C5.3] THORNSHELL × MAT_SUNFLOWER — "Sunlit Thorn"

- **Hiện tại:** `SKILL_DISCOUNT 15` — Provoke rẻ hơn 15 Sol (fusionRecipes.ts:442).
- **Vấn đề:** trùng Cornova/Gourdward.
- **Đề xuất:** giữ tên, type mới **`TAUNT_REFUND` 5** — Provoke hoàn 5 Sol cho **mỗi enemy thực sự dính taunt**. Cast vào 3 con = hoàn 15 (bằng discount cũ), vào 5 con nhờ Bellowing Thorn = hoàn 25, cast trượt = trả đủ giá.
- **Vì sao hợp:** vẫn bán "số lần cast" nhưng giá theo CHẤT LƯỢNG cast — thưởng kỹ năng đặt Provoke, đúng hero chỉ mạnh khi địch đến với anh. Synergy nội hàng với Bellowing Thorn là chủ đích.
- **Luật:** SUN ECONOMY ✓ — không trả cho vung tay; trả cho việc gánh aggro cả đám.
- **Wiring:** đếm target dính taunt lúc resolve skill, refund tại chỗ. Độ khó: **Thấp**.
- **Trạng thái:** ✅ đồng ý
- **Góp ý:**

#### [C5.4] GOURDWARD × MAT_SUNFLOWER — "Sunlit Rind"

- **Hiện tại:** `SKILL_DISCOUNT 10` — Encase rẻ hơn 10 (fusionRecipes.ts:558).
- **Vấn đề:** trùng Cornova/Thornshell.
- **Đề xuất:** giữ tên, type mới **`SHIELD_REFUND` 10** — mỗi layer do anh phát ra bị **đập vỡ** hoàn 10 Sol. Khiên chặn được đòn thì khiên tự trả tiền khiên kế tiếp.
- **Vì sao hợp:** vẫn bán số-lần-cast; trigger là danh từ riêng của anh (khiên LÀM VIỆC mới được trả — khiên phát thừa không hoàn gì).
- **Wiring:** cùng móc vỡ-layer `turnManager.ts:836` + stamp "ai phát" theo mẫu `shieldBarbed`. Độ khó: **Vừa**. Ghi chú: nếu [C1.1] cũng duyệt, Gourdward có 3 fusion cùng móc "layer vỡ" (Glass Rind / Payback Shell / Sunlit Rind) — build "trừng phạt kẻ đập khiên" là identity nhất quán, coi là feature.
- **Trạng thái:** ✅ đồng ý
- **Góp ý:**

### C6. MAT_PEASHOOTER — 5/9 (danh từ cột: "khẩu súng — đòn bắn làm được gì")

Giữ nguyên: Sunbloom `GRANT_ATTACK`, Snapmaw `DIGEST_CLAW`, Thornshell `LASER_NEEDLE`, **Peaburst `DOUBLE_ATTACK` (Repeater — SIG)**, **Ironhusk `ATTACK_RANGE_BONUS` (Lance Bash — giữ push + thêm reach là điểm bán gốc)**.

#### [C6.1] CORNOVA × MAT_PEASHOOTER — "Twin Cob"

- **Hiện tại:** `DOUBLE_ATTACK 1` — viên phụ 1 damage vào cùng mục tiêu (fusionRecipes.ts:332).
- **Vấn đề:** trùng Peaburst (SIG của cô ấy) và Reedwing.
- **Đề xuất:** đổi tên **"Split Shell"**, type mới **`SPLIT_SHOT` 1** — viên phụ không bay vào mục tiêu mà **rơi xuống một ô kề mục tiêu có enemy** (ưu tiên theo hướng bắn; không có enemy kề thì không rơi).
- **Vì sao hợp:** mini-splash trên đòn THƯỜNG — em họ của SKILL_SPLASH (vốn skill-only) nhưng yếu hơn hẳn (1 dmg, 1 ô, cần enemy đứng cụm) nên không phá ranh giới "free splash every turn" mà types.ts cảnh giới; đúng nghề pháo phủ đầu cụm.
- **Wiring:** attack resolution — chọn ô phụ deterministic (không random). Độ khó: **Vừa**.
- **Trạng thái:** ✅ đồng ý 1 phần
- **Góp ý:** cần có cách để giảm tính random hoặc tăng tính minh bạch không thì vỡ cam kết của game
- **v2 (Claude):** Chốt zero-random: ô phụ CỐ ĐỊNH = ô ngay SAU mục tiêu theo trục bắn (không dò enemy, không ưu tiên, không đổi theo bàn cờ); overlay tô cả hai ô trước khi bắn; chỉ enemy đứng đó mới ăn 1, ally an toàn. Đọc được 100% trước khi click — cam kết perfect-information giữ nguyên.

Final: okie

#### [C6.2] REEDWING × MAT_PEASHOOTER — "Twin Pods"

- **Hiện tại:** `DOUBLE_ATTACK 1` — cả hai cánh bắn thêm loạt 1 damage (fusionRecipes.ts:390).
- **Vấn đề:** trùng Peaburst/Cornova.
- **Đề xuất:** đổi tên **"Focus Barrels"**, type mới **`FOCUS_BARRELS`** — khi chỉ **một** trong hai ô của cặp nòng có mục tiêu, nòng còn lại hội tụ vào đó: ô đó ăn **2 damage** thay vì 1. (Tự động, không cần UI chọn.)
- **Vì sao hợp:** đổi độ PHỦ lấy độ ĐẦM — đúng nghịch lý hai nòng của cô (hai ô cố định, nhiều khi chỉ trúng một); từ "bắn thêm" thành "bắn khôn".
- **Luật:** không đụng VOLLEY CAP (không nhân theo shot count — chỉ gộp hai nòng sẵn có).
- **Wiring:** attack resolution của wing guns. Độ khó: **Vừa**.
- **Trạng thái:** ✅ đồng ý 1 phần
- **Góp ý:** Đang trùng với relic độc bản, nếu là bắn thêm 2 ô chéo (ngay dưới 2 ô cuối của chữ L giống kiểu súng 2 bên bắn thành 1 hàng dọc thì sao)
- **v2 (Claude):** Bỏ FOCUS_BARRELS (đè relic độc bản như bạn nói). Theo hướng góp ý: **`EXTENDED_BARRELS`** — mỗi nòng bắn dài thêm 1 ô NGAY SAU ô gốc của nó theo trục bắn (mỗi bên thành cột 2 ô, tổng 4 ô; 2 ô mới ăn 1 damage). Hình học chính xác ("2 ô chéo dưới 2 ô cuối chữ L") tôi sẽ đối chiếu pattern thật của wing guns trong `data/heroes.ts` lúc implement — nếu khác hình dung, tôi vẽ sơ đồ ô đưa bạn duyệt TRƯỚC khi code. Overlay tô đủ 4 ô, không gì ẩn.

Final: okie

#### [C6.3] CHARDSLAM × MAT_PEASHOOTER — "Longarm Chard" (2 phương án, cần bạn chọn)

- **Hiện tại:** `ATTACK_RANGE_BONUS 1` — Vault Toss túm từ 2 ô (fusionRecipes.ts:506).
- **Vấn đề:** trùng Ironhusk/Gourdward.
- **Phương án (a) — táo bạo:** đổi tên **"Teamlift Chard"**, type mới **`TOSS_ALLY`** — Vault Toss được phép ném **đồng minh** (0 damage, không collision lên ally, đáp ô trống). Công cụ reposition đội hình đúng chất Into the Breach: quăng Ironhusk vào lỗ spawn, quăng Sunbloom thoát vây.
- **Phương án (b) — an toàn:** giữ nguyên `ATTACK_RANGE_BONUS` (lý lẽ "súng = tầm với" vẫn ổn), chấp nhận cột này 8/9.
- **Wiring (a):** targeting cho phép ally + nhánh resolve TOSS bỏ damage/collision với ally. Độ khó: **Cao** (đáng giá nhất danh sách về chiều sâu chiến thuật).
- **Trạng thái:** ✏️ Cần thảo luận
- **Góp ý:** thêm hẳn 1 đòn để dịch chuyển 4 đối tượng ở dấu cộng sang 1 chiều (thuận/ngược kim đồng hồ) để thành chữ X thì sao?
- **v2 (Claude):** Ý xoay dấu cộng RẤT hay — judo thuần, displacement thuần, đúng "0 damage là hero". Đánh giá thẳng: (1) đây là ô ít "súng" nhất cột Seed Gun — chấp nhận được vì hàng Chardslam vốn là ngoại lệ của mọi cột; (2) power: xoay cả ally lẫn enemy quanh mình, free → đề xuất là ACTION THAY THẾ (lượt đó chọn Vault Toss HOẶC Xoay, không phải cả hai); (3) chi phí CAO nhất danh sách: action mới + UI chọn chiều (2 nút thuận/ngược, tiền lệ granted-skill: `DIGEST_CLAW`) + resolve 4 body đồng thời. Spec: **`PLUS_ROTATE`** ("Roundhouse Chard") — 4 unit trên 4 ô kề (N/E/S/W) xoay 45° sang ô chéo theo chiều chọn; đích bị chiếm/không hợp lệ → unit đó đứng yên; xoay là DI CHUYỂN sạch, không phải đẩy → không collision damage; unit miễn PUSH (boss massive) không xoay. Xếp đợt cuối của pass.

Final: okie

#### [C6.4] GOURDWARD × MAT_PEASHOOTER — "Rind Pellet" (data honesty)

- **Hiện tại:** `ATTACK_RANGE_BONUS 3` — nhưng desc hứa hành vi line-seek: "fired down a row: shells the FIRST ally up to 4 tiles" (fusionRecipes.ts:564). Reinforce gốc là `MELEE 1` (heroes.ts:457) — +3 range trên MELEE nhiều khả năng cho chọn tự do trong tầm 4, KHÔNG phải bắn dọc hàng như lời hứa (cần đối chiếu targeting lúc implement).
- **Đề xuất:** giữ tên, type mới **`SHIELD_SHOT`** — Reinforce thành **LINE 4**: viên khiên bay dọc hàng, đậu vào unit ĐẦU TIÊN trên đường; là ally/Greenspire thì nhận layer, là enemy thì viên đạn hỏng. Đúng từng chữ desc, thêm friction đứng-hàng đúng vị game.
- **Vì sao hợp:** khẩu súng đúng nghĩa — bắn khiên như bắn đạn, có thể tắc nòng vì zombie chắn hàng.
- **Wiring:** đổi rangeType/targeting cho skill này khi carrier có effect (mẫu `ARC_ATTACK` đổi LINE→LOB đã có sẵn trong `applyFusionToSkill`). Độ khó: **Vừa**.
- **Trạng thái:** ✅ đồng ý 1 phần
- **Góp ý:** Gặp nhà hay gặp kẻ địch cũng phải tạo khiên (phạt cho hành vi làm sai)
- **v2 (Claude):** Chốt bản phạt theo góp ý: LINE 4, unit ĐẦU TIÊN trên đường NHẬN LAYER **bất kể phe** — ally/Greenspire: cứu đúng người; ENEMY chắn hàng: bạn vừa bọc giáp cho zombie, đội nhà phải đập vỡ lớp đó trước. Phạt sai tầm nhìn, zero random, đúng vị Into the Breach. Việc kỹ thuật kiểm lúc implement: layer trên unit ĐỊCH — `shield` là field generic trên Unit nên đường damage sẵn có, nhưng phải rà chỗ nào đang ngầm coi shield là của-ally (badge UI, AI intent tính damage).

Final: okie

### C7. MAT_ENDURIAN — 5/9 (danh từ cột: "chạm vào tôi/của tôi là trả giá")

Giữ nguyên: Sunbloom `BLESS_RETALIATE`, Snapmaw `DIGEST_RETALIATE`, Chardslam `RETALIATE_PUSH`, **Peaburst `TAUNT_ON_HIT` (Barbed Pea — bản phẳng làm gốc)**, **Thornshell `RETALIATE_DAMAGE` (Bristling Armor — SIG, exception 3-damage thành văn của RETALIATION RULE)**.

#### [C7.1] CORNOVA × MAT_ENDURIAN — "Barbed Cob"

- **Hiện tại:** `TAUNT_ON_HIT` — trúng đạn là phải quay sang đánh cô (fusionRecipes.ts:362).
- **Vấn đề:** trùng Peaburst/Reedwing.
- **Đề xuất:** đổi tên **"Limping Barb"**, type mới **`TAUNT_SLOW`** — mục tiêu trúng đạn bị taunt **và SLOW 1 lượt**: nó buộc phải đến, nhưng lê bước — cô có một nhịp để lùi và nạp arc.
- **Vì sao hợp:** taunt trên artillery vốn nghịch (kéo địch về phía thân giấy) — nửa slow biến nghịch lý thành kiting loop chủ động; gai găm vào chân đúng flavor durian.
- **Luật:** STUN RULE ✓ — slow chưa bao giờ bị cấm (tiền lệ `ON_HIT_SLOW`). Power-watch: 2 rider/đòn thường — nếu test thấy lố, hạ về "slow chỉ áp khi mục tiêu ĐANG bị taunt bởi cô".
- **Wiring:** rider composition tại chỗ resolve `TAUNT_ON_HIT` hiện có. Độ khó: **Thấp**.
- **Trạng thái:** Thảo luận
- **Góp ý:** Tạo ra mảnh đạn ở 4 phía kẻ địch nếu ô ở bên cạnh là ô trống, sau khi dính skill, dẫm vào thì mất 2 máu và biến mất luôn (bản yếu của item cây gai)
- **v2 (Claude):** Theo góp ý — bỏ TAUNT_SLOW. **`SKILL_SPIKE_SCATTER`** ("Caltrop Cob"): PAID skill của cô rải mảnh gai lên các ô TRỐNG kề mục tiêu (4 hướng); zombie dẫm vào: 2 damage, mảnh tan (một lần dùng). "Bản yếu của item Cây Gai" — chính xác, và vì thế RẺ: máy spike-field đang sống trong engine (`SPIKE_TILE` — item Spike Trap nuôi nó, type `SPIKE_TRAIL` giữ hộ đường resolve). Skill-only đúng tiền lệ SKILL_SPLASH/SMOKE (rải gai trên đòn free = bức tường miễn phí mỗi lượt — đúng thứ bị cấm). Combo nội đội: mọi cú đẩy của đội dúi zombie vào bãi gai của cô. Độ khó: Vừa-Thấp.
Final: okie


#### [C7.2] REEDWING × MAT_ENDURIAN — "Barbed Skids"

- **Hiện tại:** `TAUNT_ON_HIT` — desc tự khai chiêu: "và cô bay đi trước khi nó kịp đến" (fusionRecipes.ts:420).
- **Vấn đề:** trùng Peaburst/Cornova.
- **Đề xuất:** giữ tên, **tái dùng type `WIND_TAUNT`** (đã khai types.ts:1092, chưa wire — xem [A5]) — khi cô **rời ô kề** một enemy bằng di chuyển của mình, enemy đó bị TAUNT khoá vào cô đến hết lượt sau. Sà vào chọc, cất cánh, kéo cả con mồi rời khỏi ally.
- **Vì sao hợp:** desc cũ là một câu đùa ("nó ghét cô nhưng cô đã bay mất") — đề xuất biến câu đùa thành cơ chế: taunt sinh ra từ CÚ CẤT CÁNH, trigger thuần flight, không hero nào bắt chước được.
- **Wiring:** móc rời-adjacency trong move resolution (cùng vùng móc với [C4.2] — làm chung một lần cho rẻ). Độ khó: **Vừa**.
- **Trạng thái:** Thảo luận
- **Góp ý:** Kết hợp với cơ chế bonus 1 move sau khi bắn có thể tạo thành 1 chiến thuật hit & run thực sự
- **v2 (Claude):** Chốt spec như đề xuất, và đúng như bạn thấy: ghép [C3.2v2] thành vòng hit & run trọn vẹn — sà vào, bắn, free-move 1 ô rời adjacency → WIND_TAUNT kích → cả đàn bám theo cô, rời khỏi ally. Ba ô (Overdrive v2 + Downwash v2 + Barbed Skids v2) = một identity 3 mảnh, cùng một hệ móc di chuyển, làm chung đợt. (Đây cũng là ví dụ trực tiếp cho câu hỏi FUSION_SLOTS = 3 — xem mục E.)
Final: okie

#### [C7.3] IRONHUSK × MAT_ENDURIAN — "Spiked Bulwark" (2 phương án; (a) chi phí engine ≈ 0)

- **Hiện tại:** `RETALIATE_DAMAGE 1` — kèm desc hứa "+1 slam damage" không tồn tại (xem [A4.2]) (fusionRecipes.ts:304).
- **Vấn đề:** trùng Thornshell (SIG) và Gourdward.
- **Phương án (a) — khuyến nghị:** đổi tên **"Jamming Plate"**, **tái dùng type `RETALIATE_FREEZE`** — type mồ-côi-data nhưng engine ĐANG resolve sẵn (`turnManager.ts:1091-1105`): kẻ đánh melee vào cô lần đầu dính SLOW ("kẹt gai"), đang slow mà còn đánh tiếp thì kẹt cứng (STUN). Reskin flavor từ băng sang gai-kẹt-khớp — cơ chế giữ nguyên từng bit.
- **Phương án (b):** giữ `RETALIATE_DAMAGE 1`, chỉ sửa desc theo [A4.2], chấp nhận trùng với Thornshell.
- **Luật:** STUN RULE — two-step đã được types.ts biện hộ sẵn ("the same escalation the ICE element's retaliation uses"); không phải free-stun-mỗi-lượt.
- **Wiring (a):** 0 dòng engine — chỉ đổi recipe + desc + vi.ts. Độ khó: **Thấp nhất danh sách**.
- **Trạng thái:** Thảo luận
- **Góp ý:** Nếu zombile nào tấn công trong lượt này thì lượt sau không được di chuyển, phải ở lại tấn công tiếp (taut mạnh)
- **v2 (Claude):** Theo góp ý — bỏ cả (a) lẫn (b). **`RETALIATE_ROOT`** ("Jamming Plate"): zombie nào TẤN CÔNG cô trong lượt địch thì lượt kế tiếp KHÔNG ĐƯỢC di chuyển — vẫn được đánh (kẹt trên giáp, đứng lại mà đánh tiếp). Taunt vật lý, đúng chữ. STUN RULE ✓ đúng tinh thần: không ai mất lượt — con zombie vẫn hành động, chỉ là hành động vào cô, mà ăn đòn là nghề của cô (Sunstone Shield còn trả tiền cho việc đó). Wiring: status mới `ROOTED` (cấm move, cho attack) + `aiLogic` đọc nó (kẹt thì intent = đánh mục tiêu trong tầm). Độ khó: Vừa. `RETALIATE_FREEZE` để yên cho ICE element ([A5]: engine đang resolve). Desc gap [A4.2] tự giải khi viết lại desc ô này.
Final: okie

#### [C7.4] GOURDWARD × MAT_ENDURIAN — "Spined Rind"

- **Hiện tại:** `RETALIATE_DAMAGE 1` — "đi xuyên qua anh để tới người anh che thì đổ máu" (fusionRecipes.ts:594).
- **Vấn đề:** trùng Thornshell/Ironhusk — và desc gốc thực ra đang tả một ý HAY HƠN effect.
- **Đề xuất:** giữ tên, type mới **`WARD_RETALIATE` 1** — kẻ nào đánh melee vào một **ally đang mang layer đứng kề Gourdward** bị gai đâm 1. (Đánh chính anh thì… không — muốn gai bản thân, chọn hero khác; anh là hộ vệ.)
- **Vì sao hợp:** trả đòn THAY người được hộ — trigger bảo-kê là danh từ riêng của Gourdward, đúng triết lý "anh đáng giá bằng người anh đang che".
- **Luật:** RETALIATION RULE ✓ — durian ghép vẫn trả đúng 1; melee-only đồng bộ Glass Rind.
- **Wiring:** nhánh enemy-attack resolution: check layer + adjacency với Gourdward. Độ khó: **Vừa**.
- **Trạng thái:** Thảo luận
- **Góp ý:** Cấp cho bảo vệ phản 1
- **v2 (Claude):** Theo góp ý — đơn giản hơn bản của tôi và hay hơn: **`SHIELD_RETALIATE`** — ally đang mang layer DO GOURDWARD PHÁT phản 1 khi bị đánh melee, chừng nào layer còn. Bỏ điều kiện đứng-kề. Nó vần với `BLESS_RETALIATE` của Sunbloom cùng cột (buff-mang-gai: một bên qua blessing 1 lượt, một bên qua layer bền) — cố ý: hai support, hai vehicle, người chơi học một pattern dùng được hai nơi. Wiring: cờ theo layer đúng mẫu `shieldBarbed` (`shieldSpined`, chết cùng layer). Độ khó: Vừa-Thấp.
Final: okie

### C8. MAT_WALLNUT — 6/9, cột duy nhất tôi khuyên KHÔNG ép 100% (cần chọn phương án trước)

WALL-NUT COLUMN RULE (fusionRecipes.ts:73) là công cụ DẠY: người chơi học một lần "vỏ cứng đọc theo tầm đánh — melee giảm đòn, ranged thêm máu". Trùng type ở đây là luật, không phải lười. Nhưng data đã tự lệch luật 2 ô ([A6]) nên đằng nào cũng phải quyết:

#### [C8.PA1] Phương án 1 — GIỮ luật cột, sửa data về khớp luật (khuyến nghị ban đầu)

- `REEDWING:MAT_WALLNUT` → đổi `DAMAGE_REDUCTION 1` thành **`BONUS_HP 3`** (khớp luật ranged, khớp luôn bản HTML đang ghi 4→7 HP).
- `THORNSHELL:MAT_WALLNUT` (Thorn Lunge): chọn 1 — (i) giữ `THORN_LUNGE` như exception, BỔ SUNG ghi chú lý do vào comment luật (nó là "wall-nut bowling" — quả óc chó LĂN, cùng họ Rolling Charge); (ii) đổi về `DAMAGE_REDUCTION` cho thẳng luật (mất một ô thú vị).
- Cập nhật comment WALL-NUT RULE cho khớp data cuối.
- Kết quả unique: ~5-6/9 — chấp nhận, vì cột này bán SỰ DỄ ĐOÁN.

#### [C8.PA2] Phương án 2 — refract kiểu Pumpkin (danh từ "chịu đòn", 9 trigger)

Chỉ liệt kê để bạn cân: Sunbloom `START_SHIELDED` giữ / Peaburst `BONUS_HP 2` giữ / Snapmaw `ARMOR_WHILE_DIGESTING` giữ / Ironhusk `STEADFAST` giữ (SIG) / Cornova → mới `FLANK_PLATING` (-1 từ đòn của enemy KỀ BÊN — pháo sợ áp sát) / Reedwing → mới `EVASIVE` (đòn đầu tiên nhắm vào cô mỗi lượt địch -1) / Thornshell `THORN_LUNGE` giữ / Chardslam → [C8.1] / Gourdward `DAMAGE_REDUCTION` giữ (bản phẳng). Kết quả 9/9 nhưng người chơi mất quy tắc đọc-nhanh; 2 type mới cần wire vào `calculateDamage`.

- **Trạng thái:** Thảo luận
- **Góp ý:** Làm lại nguyên nhánh này. Sunbloom có vẻ ko hợp, nó giống phạm trù của gourdward hơn

#### [C8.v2] Redo toàn cột (thay cả PA1/PA2) — danh từ mới: "TẤM GIÁP — sống qua đòn, KHÔNG dây vào khiên"

Góp ý của bạn trúng một lỗi xuyên-cột tôi bỏ sót: `START_SHIELDED` của Sunbloom×WALLNUT trùng nguyên type với `REEDWING:MAT_PUMPKIN` (Dawn Pod Plating) — khiên/layer là danh từ ĐỘC QUYỀN của cột Pumpkin, cột giáp không được đụng vào. Cột mới — 9 kiểu "chịu đòn" theo cách từng hero bị đánh:

| Hero | Đề xuất | Ghi chú |
|---|---|---|
| Sunbloom | mới **`ESCORTED_REDUCTION`** — "Guarded Bloom": kề ≥1 ally thì -1 mọi đòn nhận | được hộ tống đúng cách = cứng; ăn rơ [C3.1v2] mà không trùng type | 
| Peaburst | giữ `BONUS_HP 2` | đệm máu tuyến sau — bản phẳng nhánh HP |
| Snapmaw | giữ `ARMOR_WHILE_DIGESTING` | da dày đúng cửa sổ yếu |
| Ironhusk | giữ `STEADFAST` (SIG) | bản-đầy-đủ độc quyền sau [C8.1v2] |
| Cornova | mới **`FLANK_PLATING`** — -1 damage từ enemy đứng KỀ cô | pháo sợ nhất bị áp sát; khác Peaburst (máu) và khác Gourdward (giảm mọi đòn) |
| Reedwing | mới **`EVASIVE`** — đòn ĐẦU TIÊN nhắm cô mỗi lượt địch -1 | khung bay lượn né loạt mở màn. Phương án giản dị thay thế: `BONUS_HP 3` (khớp HTML cũ) — nhưng trùng nhánh Peaburst → cột còn 8/9. **Cần bạn chọn.** |
| Thornshell | giữ `THORN_LUNGE` | exception có chú thích: quả óc chó LĂN — cùng họ Rolling Charge; ghi lý do vào comment luật |
| Chardslam | mới **`COLLISION_PLATING`** | chi tiết ở [C8.1v2] ngay dưới |
| Gourdward | giữ `DAMAGE_REDUCTION` | vỏ của người-phát-khiên: bản phẳng nhất cột |


Kết quả 9/9 (hoặc 8/9 nếu chọn Reedwing = BONUS_HP). Comment WALL-NUT COLUMN RULE viết lại thành "cột giáp đọc theo CÁCH từng hero bị đánh" — luật melee/ranged nhị phân cũ khai tử ([A6] đóng luôn tại đây).

- **Trạng thái:** ✅ CHỐT phương án **(iii)** — đổi trục cả cặp: Cornova `EMPLACED_PLATING` (không di chuyển → -1) / Reedwing `SLIPSTREAM_PLATING` (có di chuyển → -1). Câu hỏi "ép nốt Peaburst/Thornshell về danh từ -1" — **người chơi để nghĩ thêm, chưa chốt**.
- **Góp ý:** Reedwing: giảm dam tầm xa nhận vào. cận chiến vẫn bị
- **v3 (Claude) — đo roster trước khi chốt, và nó lòi ra lỗi ở ô Cornova:**

  Flavor "máy bay chống đạn, bị tóm thì toi" rất đúng vai. Nhưng bàn cờ không nuôi nổi nó — đếm thẳng trong `data/zombies.ts`: **12 loại zombie thường, đúng 1 con bắn xa** (Lobber, `attackRange: 3`); 11 con còn lại phải bước tới đấm. Trùm khá hơn: **3/10** có tầm (Ironcart 4, Blightlord 2, Armada 2). Nghĩa là `RANGED_PLATING` **ngủ đông gần hết run**, chỉ tỉnh ở vài trận — đúng định nghĩa "ô bẫy-mua" mà mục [E] đang lo.

  Và cùng con số đó tố ngược ô Cornova của chính tôi: nếu ~92% đòn là cận chiến thì `FLANK_PLATING` (-1 từ enemy kề) **giá trị thực gần bằng hệt** `DAMAGE_REDUCTION` phẳng của Gourdward — khác tên type, giống nhau khi chơi. Đó là unique-GIẢ, thứ cả pass này sinh ra để diệt. Nên cặp Cornova/Reedwing phải đổi TRỤC, không chỉ đổi một ô.

  **Ba đường, chọn một:**

  **(i) Giữ nguyên chữ của bạn** — `RANGED_PLATING`: -1 đòn tầm xa. Rẻ nhất về thiết kế, nhưng nhận trước: ô này chết ở 11/12 trận thường.

  **(ii) Giữ chữ, nâng liều** — `FLAK_PLATING`: **miễn HOÀN TOÀN** đòn tầm xa (về 0 — có tiền lệ, giáp mũ `Unit.armor` được phép về 0, xem `gameLogic.ts:416`). Hiếm nhưng QUYẾT ĐỊNH: cô thành đáp án phòng-không, Ironcart/Armada/Blightlord mất bài với cô và phải đổi mục tiêu. Cận chiến vẫn xé cô như giấy — đúng từng chữ bạn viết.

  **(iii) Đổi trục cho CẢ CẶP — khuyến nghị.** Bán "đứng yên hay bay" thay cho "melee hay ranged":
  - Cornova → `EMPLACED_PLATING` ("Dug-in Cob"): lượt nào cô **KHÔNG di chuyển** thì -1 mọi đòn nhận. Hạ chân chống — thưởng đúng nghề pháo.
  - Reedwing → `SLIPSTREAM_PLATING` ("Airframe"): lượt nào cô **CÓ di chuyển** thì -1 mọi đòn nhận. Đứng im là ăn đủ. "Cận chiến vẫn bị" giữ nguyên tinh thần, chỉ khác chỗ điều kiện nằm trong tay NGƯỜI CHƠI thay vì nằm ở roster địch.

  Vì sao (iii) mạnh nhất: hai nửa **cân giá trị thật** (cả hai luôn khả dụng, người chơi tự bật/tắt), zero RNG, mỗi nửa thưởng đúng doctrine của hero — pháo cắm chân, máy bay không bao giờ đứng yên. Nó cũng khớp bộ hit & run vừa chốt ([C3.2v2] + [C4.2v2] + [C7.2v2]): Reedwing đằng nào cũng buộc phải bay, giờ bay còn là giáp.

  **Chi phí kỹ thuật chênh hẳn — đây là lý lẽ nặng nhất:** `calculateDamage` (`gameLogic.ts:379`) **chỉ nhận `target`, không hề biết ai đánh**, và có **21 nơi gọi**. Lọc melee/ranged = bơm attacker qua cả 21 chỗ, tức sửa xương sống damage vì một ô. Còn "có/không di chuyển" đọc thẳng `target.hasMoved` **ngay dòng 403, cạnh `DAMAGE_REDUCTION` — 0 thay đổi chữ ký**. Điều kiện này cũng đã là từ vựng THÀNH VĂN của repo: `SUN_PER_TURN` gate đúng `!u.hasMoved` (`turnManager.ts:639`) kèm chú thích "bị đẩy không tính" — cùng một luật, người chơi học một lần dùng được hai chỗ.

  **Một câu hỏi kèm theo (trả lời luôn cho gọn):** sau (iii) thì cột giáp có **5 ô cùng bán "-1"** với 5 trigger khác nhau (Sunbloom kề-ally / Cornova đứng-yên / Reedwing có-bay / Snapmaw đang-tiêu-hoá / Gourdward phẳng), cộng 3 ô lệch danh từ (Peaburst máu, Ironhusk `STEADFAST` gói-ba, Thornshell `THORN_LUNGE`). Theo đúng **công thức Pumpkin** ở đầu file (một danh từ, chín trigger) thì đây là ĐÍCH chứ không phải lười — nhưng nó khác cột Pumpkin ở chỗ có 3 ngoại lệ. Bạn OK với 5+3 đó, hay muốn tôi ép nốt Peaburst/Thornshell về danh từ "-1"?

#### [C8.1] CHARDSLAM × MAT_WALLNUT — "Armored Chard" (nên làm ở CẢ HAI phương án)

- **Hiện tại:** `STEADFAST 1` — trùng nguyên bộ với Iron Bulwark của Ironhusk; desc lại chỉ kể nửa collision, giấu nửa -1/hit ([A4.4]).
- **Đề xuất:** type mới **`COLLISION_PLATING`** — miễn 100% damage va chạm + bịt hố spawn không mất máu, **KHÔNG** kèm -1/hit. Đúng từng chữ desc hiện tại ("collision specialist"), hết trùng SIG của Ironhusk, và Iron Bulwark lấy lại vị thế bản-đầy-đủ độc quyền.
- **Wiring:** tách nhánh trong `calculateDamage`/các site STEADFAST (subset của logic có sẵn). Độ khó: **Thấp**.
- **Trạng thái:** Thảo luận
- **Góp ý:** Thêm cơ chế miễn nhiễm thay đổi vị trí nữa (bất động minh vương)
- **v2 (Claude):** Chốt kèm "bất động minh vương": **`COLLISION_PLATING`** = miễn 100% damage va chạm + bịt hố spawn không mất máu + **miễn mọi dịch-chuyển cưỡng bức** (PUSH/PULL/TOSS không xê dịch được anh — người ném thì không ai ném được). Wiring: check fusion ngay trong `planPush` cạnh `immunities.includes('PUSH')` (không ghi vào body để khỏi migrate save). Lưu ý thiết kế: boss chuyên đẩy-hero mất bài với anh — feature, không phải bug; và anh đứng bịt hố thì không gì cạy ra được. Độ khó: Thấp.
Final: okie

---

## D. Sau khi bạn duyệt — thứ tự triển khai đề xuất

Bảng v2 — xếp lại theo VÙNG WIRING sau vòng góp ý (mỗi đợt một vùng móc, không nhảy qua lại):

| Đợt | Gồm | Tính chất |
|---|---|---|
| 1 | [A1v2] rename `MaterialId` → `MAT_<HERO>` + migration localStorage | đụng rộng nhưng máy móc, typecheck dẫn đường |
| 2 | [A3] script sinh HTML từ TS ([A1]/[A2] tự giải) | không đụng gameplay |
| 3 | [A4] desc theo engine + [C5.2] | data honesty, toàn việc Thấp |
| 4 | [C1.1] [C1.2v2] [C2.2v2] | vùng móc VA CHẠM + vỡ-layer |
| 5 | [C5.1] [C5.3] [C5.4] [C7.4v2] | kinh tế Sol + cờ-theo-layer |
| 6 | [C2.1v2] [C6.1v2] [C6.2v2] [C6.4v2] [C7.1v2] | đạn & vùng, overlay-first |
| 7 | [C4.1] [C7.3v2] | rider kéo + status ROOTED |
| 8 | **[E] mở `FUSION_SLOTS = 3`** | sau khi stack trùng đã chết (đợt 4) — xem mục E |
| 9 | [C3.1v2] [C3.2v2] [C4.2v2] [C7.2v2] | vùng móc DI CHUYỂN: convoy, hit & run, downwash, wind taunt |
| 10 | [C6.3v2] | xoay dấu cộng — nặng nhất, làm riêng |
| 11 | [C8.v2] [C8.1v2] [A5] [A6] | wall-nut redo + dọn types chết + viết lại comment luật + cập nhật DESIGN-fusion-matrix.md §9 |

Mỗi đợt: sửa `types.ts` + wiring + `data/fusionRecipes.ts` + `i18n/vi.ts` trong CÙNG commit (không khai type chờ sẵn — bài học RADIUS); chạy `npm run typecheck` + mở dev cho `tutorial.assert` tự chạy; đợt nào đổi hành vi thì viết lại desc EN/VI luôn; xong đợt chạy lại script [A3] cho HTML sống theo.

Đích cuối: 8 cột 9/9, MAT_WALLNUT 9/9 hoặc 8/9 theo lựa chọn Reedwing ở [C8.v2].

---

## E. Mở `FUSION_SLOTS` 2 → 3 — đánh giá

**Kết luận: NÊN mở, nhưng đúng thời điểm — xếp làm đợt 8, sau khi stack trùng đã bị diệt, và coi nó là một đợt CÂN BẰNG chứ không phải một lần đổi số.**

Vì sao nên:

1. **Chính code đã hứa.** `constants.ts:58`: *"2 while the material pool is 5; 3 once it reaches 7+"* — pool giờ là 9. Con số 2 là món nợ từ lúc pool phình, không phải một quyết định đang đứng.
2. **Pass unique này CẦN slot 3 để không tự bắn vào chân.** `DESIGN-fusion-matrix.md` §9.1 chỉ đúng chỗ hiểm: với 2 slot, ma trận là "9 cuộc thi 2-suất" và ô always-on gần như luôn thắng ô có-điều-kiện. Loạt v2 ở mục C đẻ thêm nhiều ô có-điều-kiện đẹp (convoy, double-kill, collision-kill, bãi gai, escorted, hit & run…) — ở 2 slot chúng thua suất trước các ô phẳng và thành bẫy-mua; **slot thứ 3 chính là "suất chơi conditional"** đặt cạnh 2 suất nền.
3. **Các identity 3 mảnh vừa thiết kế chỉ tồn tại ở slot 3.** Gourdward break-punish (Glass Rind + Payback Shell + Sunlit Rind v2), Reedwing hit & run (Overdrive v2 + Downwash v2 + Barbed Skids v2), Cornova ba-vòng (Cob Howitzer + Bleed Splash + Caltrop Cob). 2 slot thì các build này mãi thiếu một chân.
4. **Chi phí cơ khí ≈ 0.** FusionPanel render text + chip slot đều từ hằng số (`FusionPanel.tsx:269,312,450`), shop line/`canFuse`/persistence đều generic. Đổi một số, ngó layout 3 chip là xong.

Vì sao phải đợi và coi là đợt cân bằng:

1. **Thứ tự với stack trùng:** mở 3 hôm nay là Chardslam ăn ngay `PUSH_DISTANCE +2` (corn+cattail cộng dồn). Mở SAU đợt 4 thì slot 3 không còn gì bẩn để nhân đôi.
2. **§9.3 đã nerf Gourdward QUANH con số 2** — "Sunlit Rind + Stun Shell là một build hoàn chỉnh", cả bài toán giá Encase 60 / discount 10 giải trên tiền đề 2 slot. Ở 3 slot anh ấy gắn thêm Glass Rind/Greatrind lên trên → phải đo lại bảng "số lần cast/trận" của §9.3, nhất là khi các ô v2 của anh ấy cũng móc vào layer.
3. **+50% passive mỗi hero cuối run** — curve địch acts cuối có thể cần nhích; không đoán trước, mở rồi chơi vài run, chỉnh qua bảng balance (`pitb_balance_v1`) theo quy trình sẵn có.
4. Tiện thể: `DESIGN-fusion-matrix.md` §9.2 đang đếm trên MA TRẬN CŨ (Rotor Wing ×5 MOVE_BONUS…) — số hiện hành là bảng mục 0 file này; đợt 11 cập nhật §9 luôn cho khỏi hai-sổ-hai-số.

- **Trạng thái:** ✅ đồng ý — mở `FUSION_SLOTS = 3`, giữ vị trí đợt 8 (sau khi stack trùng chết ở đợt 4).
- **Góp ý:** okie

---

## F. MA TRẬN CHỐT — 81 ô sau toàn bộ vòng duyệt

> Bảng này là **spec triển khai**. Mọi ô đều đã qua `Final:` của người chơi (trừ 14 ô gắn ⚠ đang chờ
> [A7]). Tên id gear đã đổi theo [A1v2] — `MAT_<HERO CHỦ NHÂN>`, lấy từ `DESIGN-fusion-matrix.md` §4.
>
> **§F là bảng TRA NHANH.** Định nghĩa đầy đủ từng ô — trigger, hiệu ứng chính xác, ca biên, điểm móc —
> nằm ở **`PLAN-fusion-effects.md`** (81/81 ô, cộng 2 phụ lục: bảng quyết định [A7] và 24 type gom
> theo vùng wiring).

**Bảng đổi tên gear:** `MAT_SUNFLOWER→MAT_SUNBLOOM` · `MAT_PEASHOOTER→MAT_PEABURST` ·
`MAT_CHOMPER→MAT_SNAPMAW` · `MAT_WALLNUT→MAT_IRONHUSK` · `MAT_CORN_MORTAR→MAT_CORNOVA` ·
`MAT_CATTAIL→MAT_REEDWING` · `MAT_ENDURIAN→MAT_THORNSHELL` · `MAT_SPRING_ARM→MAT_CHARDSLAM` ·
`MAT_PUMPKIN→MAT_GOURDWARD`

Ký hiệu: **GIỮ** không đụng · **ĐỔI** viết mới trong pass này · **⚠** ô rỗng, chờ [A7] quyết
*wire thật* hay *hạ `live: false`*.

### F1 · MAT_SUNBLOOM (Sol Battery) — danh từ: *số lần bấm kỹ năng mỗi trận*

| Hero | Tên | Effect | |
|---|---|---|---|
| Sunbloom | Twin Sol Battery | `SUN_PER_TURN` 50 | GIỮ · SIG |
| Peaburst | Sunbeam Pea | `SUN_ON_KILL` 10 | GIỮ · gốc nhánh A |
| Snapmaw | Sunlit Gut | `SUN_WHILE_DIGESTING` 10 | GIỮ |
| Ironhusk | Sunstone Shield | `SUN_ON_BLOCK_SPAWN` 20 | GIỮ |
| Cornova | Sunlit Cob | `SKILL_DISCOUNT` 15 | GIỮ · gốc nhánh B |
| Reedwing | Solar Rotor | `SUN_ON_DOUBLE_KILL` 30 | ĐỔI [C5.1] |
| Thornshell | Sunlit Thorn | `TAUNT_REFUND` 5 | ĐỔI [C5.3] |
| Chardslam | Sunlit Chard | `SUN_ON_COLLISION_KILL` 20 | ĐỔI [C5.2] |
| Gourdward | Sunlit Rind | `SHIELD_REFUND` 10 | ĐỔI [C5.4] |

**9/9 · 0 ô rỗng.** Linh hồn A/B của cột giữ nguyên — mọi ô vẫn bán "thêm lượt cast", chỉ khác cách trả tiền.

### F2 · MAT_PEABURST (Seed Gun) — danh từ: *khẩu súng — đòn bắn làm được gì*

| Hero | Tên | Effect | |
|---|---|---|---|
| Sunbloom | Gunbloom | `GRANT_ATTACK` | GIỮ |
| Peaburst | Repeater | `DOUBLE_ATTACK` 1 | GIỮ · SIG |
| Snapmaw | Rending Claws | `DIGEST_CLAW` | GIỮ |
| Ironhusk | Lance Bash | `ATTACK_RANGE_BONUS` 1 | GIỮ · gốc |
| Cornova | Split Shell | `SPLIT_SHOT` 1 | ĐỔI [C6.1] · ô phụ **CỐ ĐỊNH** = ô ngay SAU mục tiêu theo trục bắn, zero random |
| Reedwing | *(tên chờ)* | `EXTENDED_BARRELS` | ĐỔI [C6.2] · ⚠ **nợ sơ đồ**: `WING_PAIR` là 8 ô knight, không phải hàng dọc — vẽ hình duyệt trước khi code |
| Thornshell | Piercing Needles | `LASER_NEEDLE` 2 | ⚠ [A7] |
| Chardslam | Roundhouse Chard | `PLUS_ROTATE` | ĐỔI [C6.3] · action **THAY THẾ** Vault Toss, không cộng thêm |
| Gourdward | Rind Pellet | `SHIELD_SHOT` | ĐỔI [C6.4] · LINE 4, unit ĐẦU TIÊN nhận layer **bất kể phe** |

**9/9 · 1 ô rỗng.**

### F3 · MAT_SNAPMAW (Steel Jaws) — danh từ: *vết thương hở*

| Hero | Tên | Effect | |
|---|---|---|---|
| Sunbloom | Fanged Blessing | `BLESS_POWER` 1 | GIỮ |
| Peaburst | Serrated Pea | `BLEED_ON_HIT` | GIỮ · gốc |
| Snapmaw | Double Jaw | `DIGEST_REDUCTION` 1 | GIỮ · SIG |
| Ironhusk | Fanged Bash | `BONUS_DAMAGE` 1 | GIỮ |
| Cornova | Shrapnel Kernel | `SKILL_BLEED_SPLASH` | ĐỔI [C2.1] · 4 ô quanh mục tiêu dính BLEED (không phải damage) |
| Reedwing | Executioner Pods | `BLEED_EXECUTION` 2 | ⚠ [A7] · **chân của combo 2**; khi wire phải chốt "+2 mỗi ô" hay "+2 một lần mỗi đòn" — `WING_PAIR` KHÔNG nằm dưới VOLLEY CAP nên bản mỗi-ô ra 15 damage |
| Thornshell | Rending Husk | `RETALIATE_BLEED` | GIỮ |
| Chardslam | Rending Chard | `BLEED_ON_SHOVE` | ĐỔI [C2.2] · mọi enemy nhận damage VA CHẠM từ đẩy/kéo/ném đều bleed; ném ra ô trống = không bleed |
| Gourdward | Glass Rind | `BARBED_SHIELD` | GIỮ |

**9/9 · 1 ô rỗng.**

### F4 · MAT_IRONHUSK (Armor Plate) — danh từ MỚI: *tấm giáp — sống qua đòn, KHÔNG dây vào khiên*

| Hero | Tên | Effect | |
|---|---|---|---|
| Sunbloom | Guarded Bloom | `ESCORTED_REDUCTION` | ĐỔI [C8.v2] · kề ≥1 ally → -1 mọi đòn |
| Peaburst | Armored Pea | `BONUS_HP` 2 | GIỮ |
| Snapmaw | Armored Jaws | `ARMOR_WHILE_DIGESTING` 1 | GIỮ |
| Ironhusk | Iron Bulwark | `STEADFAST` 1 | GIỮ · SIG · bản-đầy-đủ độc quyền sau [C8.1] |
| Cornova | Dug-in Cob | `EMPLACED_PLATING` | ĐỔI [C8.v3-(iii)] · lượt **KHÔNG** di chuyển → -1 |
| Reedwing | Airframe | `SLIPSTREAM_PLATING` | ĐỔI [C8.v3-(iii)] · lượt **CÓ** di chuyển → -1 |
| Thornshell | Thorn Lunge | `THORN_LUNGE` 1 | ⚠ [A7] |
| Chardslam | Unstoppable Chard | `COLLISION_PLATING` | ĐỔI [C8.1] · miễn damage va chạm + bịt hố + **miễn mọi dịch chuyển cưỡng bức** |
| Gourdward | Ironrind | `DAMAGE_REDUCTION` 1 | GIỮ · bản phẳng |

**9/9 · 1 ô rỗng.** `START_SHIELDED` đã rời cột này → hết trùng với Dawn Pod Plating; luật melee/ranged
nhị phân cũ (L5) khai tử, [A6] đóng tại đây. Cặp Cornova/Reedwing đọc bằng **một** predicate có sẵn
(`target.hasMoved`), 0 thay đổi chữ ký `calculateDamage`.

### F5 · MAT_CORNOVA (Corn Mortar) — danh từ: *phát nổ / chấn động*

| Hero | Tên | Effect | |
|---|---|---|---|
| Sunbloom | Solar Corona | `SKILL_AURA` | GIỮ |
| Peaburst | Mortar Pea | `ARC_ATTACK` | GIỮ |
| Snapmaw | Stun Fang | `STUN_ON_FULL_HP` | GIỮ · ngoại lệ STUN RULE #3 |
| Ironhusk | Stun Charge | `SKILL_STUN` | GIỮ · ngoại lệ STUN RULE #1 |
| Cornova | Cob Howitzer | `SKILL_SPLASH` | GIỮ · SIG |
| Reedwing | Cluster Load | `WING_MIDSHOT` | GIỮ |
| Thornshell | Bellowing Thorn | `TAUNT_RADIUS` 2 | GIỮ |
| Chardslam | Blast Chard | `COLLISION_SPLASH` | ĐỔI [C1.2] · vòng nổ kề TRỰC GIAO hai thân va chạm, **luôn đúng 6 ô**; tường 3 ô; nước 0 ô; chỉ ENEMY dính |
| Gourdward | Payback Shell | `SHIELD_BREAK_STUN` | ĐỔI [C1.1] · ngoại lệ STUN RULE #2, dời từ "lúc bọc" sang "lúc vỡ" |

**9/9 · 0 ô rỗng.** Cột duy nhất ngoài Sol Battery hoàn toàn sạch.

### F6 · MAT_REEDWING (Rotor Wing) — danh từ: *cơ động / cánh quạt*

| Hero | Tên | Effect | |
|---|---|---|---|
| Sunbloom | Sunchaser | `CONVOY_AURA` | ĐỔI [C3.1] · đầu lượt, kề ≥1 ally → cô VÀ mọi ally kề +1 move lượt này |
| Peaburst | Smokeline | `SKILL_DISARM` | GIỮ |
| Snapmaw | Prowl Rotor | `DIGEST_MOVE` 1 | ⚠ [A7] |
| Ironhusk | Overdrive Charge | `DASH_DISTANCE` 1 | ⚠ [A7] |
| Cornova | Ash Carriage | `SMOKE_ON_HIT` | GIỮ |
| Reedwing | Overdrive Rotor | `ATTACK_THEN_MOVE` | ĐỔI [C3.2] · SIG · bắn xong bay thêm 1 ô (được bỏ qua) |
| Thornshell | Windburr | `MOVE_BONUS` 1 | GIỮ · bản +1 phẳng **duy nhất** của cột |
| Chardslam | Catapult Rotor | `PUSH_DISTANCE` 1 | GIỮ · thành duy nhất sau [C1.2]; desc bỏ chữ "toss" [A4.1] |
| Gourdward | Rolling Rind | `ENCASE_RANGE` 1 | ⚠ [A7] |

**9/9 · 3 ô rỗng — cột hỏng nặng thứ hai sau Bunker Shell.**

### F7 · MAT_THORNSHELL (Spike Armor) — danh từ: *chạm vào tôi/của tôi là trả giá*

| Hero | Tên | Effect | |
|---|---|---|---|
| Sunbloom | Thorned Bloom | `BLESS_RETALIATE` | ⚠ [A7] |
| Peaburst | Barbed Pea | `TAUNT_ON_HIT` | GIỮ · gốc |
| Snapmaw | Bristleback | `DIGEST_RETALIATE` | ⚠ [A7] |
| Ironhusk | Jamming Plate | `RETALIATE_ROOT` | ĐỔI [C7.3] · zombie tấn công cô → lượt kế **không được di chuyển**, vẫn được đánh |
| Cornova | Caltrop Cob | `SKILL_SPIKE_SCATTER` | ĐỔI [C7.1] · PAID skill rải gai lên ô TRỐNG kề mục tiêu; dẫm 2 damage, tan |
| Reedwing | Barbed Skids | `WIND_TAUNT` | ĐỔI [C7.2] · tái dùng type đã khai; rời ô kề bằng move của mình → TAUNT |
| Thornshell | Bristling Armor | `RETALIATE_DAMAGE` (2→3) | GIỮ · SIG · ngoại lệ duy nhất của L3 |
| Chardslam | Thorned Chard | `RETALIATE_PUSH` | GIỮ |
| Gourdward | Spined Rind | `SHIELD_RETALIATE` | ĐỔI [C7.4] · ally mang layer DO ANH phát phản 1 khi bị đánh melee |

**9/9 · 2 ô rỗng.**

### F8 · MAT_CHARDSLAM (Spring Arm) — danh từ: *lực bật / xung lực*

| Hero | Tên | Effect | |
|---|---|---|---|
| Sunbloom | Kinetic Bloom | `BLESS_SHOCKWAVE` | GIỮ |
| Peaburst | Overwatch Pea | `OVERWATCH_SHOT` | GIỮ · gốc |
| Snapmaw | Anchored Gullet | `DIGEST_STEADFAST` | ⚠ [A7] |
| Ironhusk | Sprung Bash | `PUSH_DISTANCE` 1 | GIỮ |
| Cornova | Recoil Cob | `ON_HIT_PULL` | ĐỔI [C4.1] · đối xứng `ON_HIT_PUSH`; tự combo với Overwatch Pea, không cần code riêng |
| Reedwing | Downwash | `FLYER_REPEL` | ĐỔI [C4.2] · tái dùng type đã khai; kết thúc move → enemy kề ô đáp lùi 1. Mũi tên hiện trong overlay chọn ô đáp; xác nhận nước đi có Downwash = **khoá, không hoàn tác** |
| Thornshell | Sprung Thorn | `ON_HIT_PUSH` 1 | GIỮ |
| Chardslam | Grand Chard | `COLLISION_BONUS` 2 | GIỮ · SIG |
| Gourdward | Shockrind | `SKILL_REPEL` | GIỮ |

**9/9 · 1 ô rỗng.**

### F9 · MAT_GOURDWARD (Bunker Shell) — danh từ: *một layer khiên*

| Hero | Tên | Effect | |
|---|---|---|---|
| Sunbloom | Dawn Harvest | `HARVEST_SHIELD` 15 | ⚠ [A7] |
| Peaburst | Precision Shield | `SHIELD_ON_SKILL_KILL` 1 | ⚠ [A7] |
| Snapmaw | Warded Gut | `SHIELD_ON_DIGEST` 1 | ⚠ [A7] |
| Ironhusk | Bunker Plating | `LAST_STAND_SHIELD` | GIỮ |
| Cornova | Reactive Cob Shell | `REACTIVE_SHIELD` | ⚠ [A7] |
| Reedwing | Dawn Pod Plating | `START_SHIELDED` | GIỮ · hết trùng sau [C8.v2] |
| Thornshell | Warded Provoke | `PROVOKE_SHIELD` | ⚠ [A7] |
| Chardslam | Warded Chard | `SHIELD_ON_KILL` 1 | GIỮ |
| Gourdward | Greatrind | `SHIELD_SPREAD` | GIỮ · SIG |

**9/9 theo tên — nhưng chỉ 4/9 CHẠY.** Đây là cột mà mục 0 khen "9/9, cột chuẩn mực" và cả công thức
của pass này rút ra từ đó. Con số thật là **4**.

### F10 · Tổng kết

| | Số ô |
|---|---|
| GIỮ nguyên | **43** |
| ĐỔI trong pass này | **24** |
| ⚠ rỗng, chờ [A7] | **14** |
| | **81** |

Cả 9 cột đạt **9/9 theo type** — nhưng con số thật chỉ đúng sau khi [A7] xong.

**24 effect type phải viết** — 22 mới + 2 tái dùng type đã khai sẵn (`WIND_TAUNT`, `FLYER_REPEL`):

`SHIELD_BREAK_STUN` · `COLLISION_SPLASH` · `SKILL_BLEED_SPLASH` · `BLEED_ON_SHOVE` · `CONVOY_AURA` ·
`ATTACK_THEN_MOVE` · `ON_HIT_PULL` · `SUN_ON_DOUBLE_KILL` · `SUN_ON_COLLISION_KILL` · `TAUNT_REFUND` ·
`SHIELD_REFUND` · `SPLIT_SHOT` · `EXTENDED_BARRELS` · `PLUS_ROTATE` · `SHIELD_SHOT` ·
`SKILL_SPIKE_SCATTER` · `RETALIATE_ROOT` · `SHIELD_RETALIATE` · `ESCORTED_REDUCTION` ·
`EMPLACED_PLATING` · `SLIPSTREAM_PLATING` · `COLLISION_PLATING` — cộng `WIND_TAUNT` + `FLYER_REPEL`.

**2 type xoá** ([A5]): `NEEDLE_BURST` · `ARMOR_SHRED`. `RETALIATE_FREEZE` giữ lại cho ICE element
(engine đang resolve).

**Không type nào mất hết chủ** sau 24 lần đổi — đã rà từng cái: `START_SHIELDED` còn Reedwing,
`SUN_ON_KILL` còn Peaburst, `SKILL_DISCOUNT` còn Cornova, `DOUBLE_ATTACK` còn Peaburst,
`ATTACK_RANGE_BONUS` còn Ironhusk, `TAUNT_ON_HIT` còn Peaburst, `RETALIATE_DAMAGE` còn Thornshell,
`BLEED_ON_HIT` còn Peaburst, `MOVE_BONUS` còn Thornshell, `OVERWATCH_SHOT` còn Peaburst,
`ON_HIT_PUSH` còn Thornshell, `PUSH_DISTANCE` còn Ironhusk + Chardslam, `SKILL_STUN` còn Ironhusk,
`STEADFAST` còn Ironhusk, `BONUS_HP` còn Peaburst, `DAMAGE_REDUCTION` còn Gourdward.

### F11 · Ba việc còn nợ trước khi gõ dòng code đầu tiên

1. **[A7]** — 14 ô rỗng: *wire* hay *hạ `live: false`*. Chặn mọi phép đo phía sau. **Còn treo.**
2. ~~Sơ đồ ô Reedwing × MAT_PEABURST~~ — **XONG**, `PLAN-fusion-effects.md` **Phụ lục C**: 3 phương án
   có hình, khuyến nghị A (lấp 2 ô chéo kề). Chỉ còn chờ bạn chọn A/B/C.
3. ~~Luật cộng dồn `BLEED_EXECUTION`~~ — **XONG**, `PLAN-fusion-effects.md` **Phụ lục D**: luật cộng
   dồn 3 tầng cho toàn ma trận, và khuyến nghị "+2 **thay** +1, tiêu vết bleed" → ra đúng 7.

- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**
