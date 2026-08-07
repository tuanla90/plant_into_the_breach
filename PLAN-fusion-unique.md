# PLAN — Unique hoá ma trận fusion (bản rà soát để duyệt)

> **Cách dùng file:** mỗi mục có dòng `Trạng thái:` và `Góp ý:`. Sửa trực tiếp trong file:
> - `⬜ chờ duyệt` → đổi thành `✅ đồng ý` / `❌ bỏ` / `✏️ sửa` (viết ý vào dòng Góp ý).
> - Chưa có dòng code nào bị đụng — duyệt xong mới triển khai theo mục D.
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

Đích nếu duyệt hết: 8 cột đạt 9/9; MAT_WALLNUT tuỳ phương án [C8] (giữ luật cột ≈ 6/9, refract kiểu Pumpkin = 9/9).

---

## A. Vấn đề độc lập với pass unique (sửa là đúng bất kể duyệt gì)

### [A1] fusion-matrix.html — 7 key sai chính tả → 7 ô render "Chưa rõ"

6 ô cột Spike Armor viết `MAT_SPIKE_ARMOR` (id đúng là `MAT_ENDURIAN`): dòng 707 (IRONHUSK), 718 (CORNOVA), 729 (REEDWING), 740 (THORNSHELL), 751 (CHARDSLAM), 762 (GOURDWARD). Cộng dòng 752: `CHARDSLAM:SPRING_ARM` thiếu tiền tố `MAT_`.

Hậu quả: 7 ô hiện fallback "Chưa rõ", trong đó có **2 ô SIG** (Bristling Armor, Grand Chard) — pills đếm 9 SIG nhưng bảng chỉ hiện 7.

- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

### [A2] fusion-matrix.html — ô lệch nội dung so với fusionRecipes.ts

1. `REEDWING:MAT_WALLNUT` (dòng 726): HTML ghi "+3 Máu tối đa (4→7 HP)" — TS là `DAMAGE_REDUCTION 1` ("Takes 1 less damage from every hit"). Hai bản kể hai hiệu ứng khác hẳn nhau. (Liên quan quyết định [C8] — có thể HTML mới là ý định đúng.)
2. `GOURDWARD:MAT_CATTAIL` (dòng 761): HTML ghi "Airborne Rind — Encase tạo cuồng phong đẩy lùi" (đó là hiệu ứng của Shockrind/`SKILL_REPEL`) — TS là "Rolling Rind" `ENCASE_RANGE` (cast xa hơn 2 ô).
3. Nhẹ: `SNAPMAW:MAT_PUMPKIN` HTML kể "mỗi kill cắn nuốt" — TS kể "lúc BẮT ĐẦU tiêu hoá"; cùng thời điểm trong thực tế nhưng nên thống nhất cách kể.

- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

### [A3] fusion-matrix.html là bản chép tay thứ hai của data — sẽ tiếp tục trôi

Footer ghi "Data Synced 100% with data/fusionRecipes.ts" nhưng A1+A2 cho thấy đã lệch. Đề xuất: viết script nhỏ (node) đọc `FUSION_RECIPES` và sinh lại khối `const RECIPES = {...}` trong HTML (hoặc sinh nguyên file). Chạy tay khi cần, không cần đưa vào build.

- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

### [A4] Description nói khác engine (4 chỗ trong fusionRecipes.ts)

1. **Catapult Rotor** (`CHARDSLAM:MAT_CATTAIL`, dòng 530): hứa "every shove, **toss**, and slam +1 tile" — nhưng TOSS là ném gương qua đầu tới ô `2·C − T` (`skillResolution.ts:682`), không phải trượt tile; `applyFusionToSkill` chỉ cộng distance cho PUSH/PULL (`fusion.ts:499`). Chữ "toss" trong desc là lời hứa suông → bỏ chữ "toss" (hoặc chấp nhận [C1.2] thì ô này thành bản +distance duy nhất, viết lại desc luôn).
2. **Spiked Bulwark** (`IRONHUSK:MAT_ENDURIAN`, dòng 304): hứa "Plate Slam deals **+1 extra damage** and reflects +1" — effect chỉ có `RETALIATE_DAMAGE 1`, không có nửa "+1 damage". Sửa desc, hoặc nếu duyệt [C7.3] thì viết lại toàn bộ.
3. **Iron Bulwark + Armored Chard** (dòng 286, 518): cả hai desc nói "reduces collision damage by **50%**" — engine thực tế cho STEADFAST **miễn 100%** damage va chạm (`actionBuilders.ts:142`, `turnManager.ts:394`, `skillResolution.ts:282`). Desc đang hứa THIẾU. Sửa desc về "miễn va chạm".
4. **Armored Chard** (dòng 518): desc không nhắc gì tới `-1 damage/hit` mà `STEADFAST value 1` đang cho anh ấy qua `gameLogic.ts:404`. Người chơi đang nhận một buff không được kể. (Nếu duyệt [C8.1] thì hết lệch — nửa -1/hit bị cắt đúng như desc.)

- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

### [A5] types.ts — 4 effect type khai báo mà không recipe nào cấp, engine không resolve

`ARMOR_SHRED`, `NEEDLE_BURST`, `WIND_TAUNT`, `FLYER_REPEL` (types.ts:1089-1094): không xuất hiện trong `FUSION_RECIPES`, không có chỗ nào trong `utils/` đọc chúng. Đây đúng là lỗi "khai vocabulary rồi bỏ" mà comment RADIUS trong repo tự cảnh báo. Đề xuất:

- `WIND_TAUNT` → tái dùng cho [C7.2] (Reedwing).
- `FLYER_REPEL` → tái dùng cho [C4.2] (Reedwing).
- `NEEDLE_BURST`, `ARMOR_SHRED` → **xoá** (trừ khi bạn còn kế hoạch cho chúng — ghi vào Góp ý).

(Khác với nhóm trên: `ADJACENT_STRIKE`, `RETALIATE_FREEZE`, `SPIKE_TRAIL`... là mồ-côi-data nhưng engine VẪN resolve — giữ, và [C7.3] tái dùng một cái.)

- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

### [A6] WALL-NUT COLUMN RULE — comment và data đã lệch nhau

Comment luật cột (fusionRecipes.ts:73-77): melee mua `DAMAGE_REDUCTION`, ranged mua `BONUS_HP`. Data hiện tại phá luật ở 2 ô mà không ghi chú exception:

- `REEDWING` (ranged) nhận `DAMAGE_REDUCTION` thay vì `BONUS_HP` — và HTML lại ghi +3 HP (dấu vết ý định cũ?).
- `THORNSHELL` (melee) nhận `THORN_LUNGE` — không liên quan gì tới "chịu đòn".

Không sửa ngay — đây là đầu vào cho quyết định [C8]. Nêu ở đây để không quên cập nhật comment sau khi chốt.

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
- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

#### [C1.2] CHARDSLAM × MAT_CORN_MORTAR — "Catapult Chard" (trùng HÀNG, ưu tiên cao nhất)

- **Hiện tại:** `PUSH_DISTANCE 1` — desc "Sweep throws 3 tiles instead of 2" (fusionRecipes.ts:524).
- **Vấn đề:** **giống hệt** `CHARDSLAM:MAT_CATTAIL` (Catapult Rotor, cũng `PUSH_DISTANCE 1`) — cùng một hero, hai món đồ, một hiệu ứng; engine áp toàn cục cho mọi PUSH/PULL nên desc "chỉ Sweep" cũng sai nốt; fuse cả hai thì stack +2 vì `getFusionEffectValue` cộng dồn.
- **Đề xuất:** đổi tên **"Blast Chard"**, type mới **`COLLISION_SPLASH`** — khi anh slam một body vào chướng ngại/body khác, **ô phía sau điểm va** (theo hướng đẩy) dính 1 damage. Corn = thuốc nổ gắn vào điểm chạm.
- **Vì sao hợp:** Chardslam 0-damage là hero; đây vẫn không phải "đánh có damage" — damage sinh ra từ VA CHẠM anh dàn dựng, khác `COLLISION_BONUS` (spring: +2 cho chính con bị slam) ở chỗ nó lan sang hàng xóm sau bức tường.
- **Luật:** khớp ghi chú BONUS_DAMAGE trong fusion.ts — không bolt số damage lên đòn của anh; số này nằm trên bảng, không trên skill card.
- **Wiring:** cùng site với `COLLISION_BONUS` (`skillResolution.ts:268-284` đã cộng phần thưởng va chạm cho hero). Độ khó: **Vừa**.
- **Phương án phụ (rẻ hơn):** `SKILL_PUSH_DISTANCE` — chỉ Sweep +1 đúng như desc hiện tại; nhưng vẫn na ná Catapult Rotor (tập con), unique yếu.
- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

### C2. MAT_CHOMPER — 7/9 (danh từ cột: "vết cắn / vết thương hở")

Giữ nguyên: Sunbloom `BLESS_POWER`, Snapmaw `DIGEST_REDUCTION` (SIG), Ironhusk `BONUS_DAMAGE`, Reedwing `BLEED_EXECUTION`, Thornshell `RETALIATE_BLEED`, Gourdward `BARBED_SHIELD`, **Peaburst `BLEED_ON_HIT` (Serrated Pea — bản phẳng làm gốc)**.

#### [C2.1] CORNOVA × MAT_CHOMPER — "Shrapnel Kernel"

- **Hiện tại:** `BLEED_ON_HIT` — đạn để lại bleed: đòn kế tiếp +1 rồi vết đóng (fusionRecipes.ts:338).
- **Vấn đề:** trùng Peaburst và Chardslam.
- **Đề xuất:** giữ tên, type mới **`BLEED_PERSIST`** — vết bleed do CÔ gây **không đóng lại**: mọi đòn sau đó lên mục tiêu đều +1 (không chỉ đòn kế tiếp), tới khi mục tiêu chết. Bleed từ nguồn khác giữ nguyên luật một-lần.
- **Vì sao hợp:** artillery đánh dấu mục tiêu lớn cho cả đội khoan vào — đúng vai mid-range của cô; Peaburst mark một nhát, Cornova mở toác.
- **Wiring:** chỗ tiêu mark bleed trong damage calc — thêm cờ "persistent" stamp theo nguồn (mẫu `blessPower`: stamp lên body bị dính lúc áp). Độ khó: **Thấp-Vừa**. Cân bằng: mạnh trên boss — đúng chủ đích, nhưng để mắt khi test.
- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

#### [C2.2] CHARDSLAM × MAT_CHOMPER — "Rending Chard" (data honesty — hành vi KHÔNG đổi)

- **Hiện tại:** `BLEED_ON_HIT` — bleed theo cú ném (fusionRecipes.ts:512).
- **Vấn đề:** trùng type, nhưng engine vốn ĐÃ đối xử riêng: `applyFusionToSkill` gate bleed của anh qua `hasDamage || hasShove` (fusion.ts:380-384) — một special-case tồn tại chỉ vì type chưa nói thật.
- **Đề xuất:** giữ tên, type mới **`BLEED_ON_SHOVE`** — hành vi giữ nguyên 100%; `BLEED_ON_HIT` thu về gate `hasDamage` thuần.
- **Vì sao hợp:** cú ném là "đòn" của anh — type nói đúng điều desc và engine đã nói.
- **Wiring:** tách 1 clause có sẵn trong `applyFusionToSkill` — code còn GỌN đi. Độ khó: **Thấp** (rẻ nhất danh sách cùng [C7.3]).
- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

### C3. MAT_CATTAIL — 7/9 (danh từ cột: "cơ động / cánh quạt")

Giữ nguyên: Peaburst `SKILL_DISARM`, Snapmaw `DIGEST_MOVE`, Ironhusk `DASH_DISTANCE`, Cornova `SMOKE_ON_HIT`, Chardslam `PUSH_DISTANCE` (thành duy nhất sau [C1.2]), Gourdward `ENCASE_RANGE`, **Reedwing `MOVE_BONUS` (Overdrive Rotor — SIG chính chủ, "herself, turned up")**.

#### [C3.1] SUNBLOOM × MAT_CATTAIL — "Sunchaser"

- **Hiện tại:** `MOVE_BONUS 1` — "+1 move, đi kịp đội hình" (fusionRecipes.ts:124).
- **Vấn đề:** trùng Reedwing và Thornshell.
- **Đề xuất:** giữ tên, type mới **`FOLLOW_STEP`** — 1 lần/lượt người chơi: khi một ally di chuyển RỜI ô kề Sunbloom, cô tự bước 1 ô về phía ô mới của ally (nếu ô đích trống, không hazard). Không tốn action.
- **Vì sao hợp:** "the battery keeps up with the squad" thành cơ chế đen-nghĩa-đen: cô không nhanh hơn — cô BÁM theo. Cơ động có điều kiện, đúng hero phải-được-hộ-tống.
- **Wiring:** móc sau resolve di chuyển của ally trong `useGameEngine`/App — bản auto không cần UI. Độ khó: **Vừa-Cao** (điểm móc mới trong luồng move). Phương án phụ nếu ngại: hoán đổi — Sunbloom giữ `MOVE_BONUS`, refract Thornshell + Reedwing (nhưng Reedwing là SIG, không nên đổi).
- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

#### [C3.2] THORNSHELL × MAT_CATTAIL — "Windburr"

- **Hiện tại:** `MOVE_BONUS 1` — "+1 move để chọn vị trí Provoke" (fusionRecipes.ts:472).
- **Vấn đề:** trùng Reedwing và Sunbloom.
- **Đề xuất:** giữ tên, type mới **`PROVOKE_STEP`** — sau khi cast Provoke, được bước 1 ô miễn phí (chọn ô kề trống). Taunt xong tự đặt lại vị trí — "gai bay theo gió".
- **Vì sao hợp:** desc cũ tự khai mục đích ("cơ động ĐỂ Provoke") — vậy gắn thẳng bước chân vào cú Provoke; mua trải nghiệm "khiêu khích rồi rút về thế chịu đòn đẹp" thay vì +1 phẳng.
- **Wiring:** móc sau resolve skill; cần UI chọn ô (App đã có pattern chọn ô cho skill targeting). Độ khó: **Vừa**. Bản auto rẻ hơn: tự lùi về ô kề xa cụm enemy nhất.
- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

### C4. MAT_SPRING_ARM — 7/9 (danh từ cột: "lực bật / xung lực")

Giữ nguyên: Sunbloom `BLESS_SHOCKWAVE`, Snapmaw `DIGEST_STEADFAST`, Ironhusk `PUSH_DISTANCE`, Chardslam `COLLISION_BONUS` (SIG), Gourdward `SKILL_REPEL`, **Peaburst `OVERWATCH_SHOT` (đường bắn thẳng là identity của cô — bản gốc)**, **Thornshell `ON_HIT_PUSH` (Sprung Thorn — cú swipe hất, melee push chuẩn)**.

#### [C4.1] CORNOVA × MAT_SPRING_ARM — "Overwatch Cob"

- **Hiện tại:** `OVERWATCH_SHOT` — bắn phục kích khi đồng đội hất quái vào tầm arc (fusionRecipes.ts:368).
- **Vấn đề:** trùng Peaburst (cùng implementation, chỉ khác tầm).
- **Đề xuất:** đổi tên **"Recoil Cob"**, type mới **`ON_HIT_PULL`** — đạn cối của cô **KÉO** mục tiêu 1 ô về phía cô. Lò xo hoạt động hai chiều.
- **Vì sao hợp:** displacement chiều ngược — độc nhất toàn matrix (chưa ô nào pull trên đòn thường). Chiến thuật: giật zombie ra khỏi mặt ally, kéo vào vùng Nova Shell, kéo mồi vào hazard phía trước nó.
- **Luật:** đối xứng hoàn toàn với `ON_HIT_PUSH` đã được chấp nhận — cùng mức đền (đẩy 1 ↔ kéo 1), `PULL` đã có trong vocab skill effect và `planPush` xử lý được.
- **Wiring:** thêm 1 rider trong `applyFusionToSkill` cạnh `ON_HIT_PUSH` (fusion.ts:362). Độ khó: **Thấp**.
- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

#### [C4.2] REEDWING × MAT_SPRING_ARM — "Downwash"

- **Hiện tại:** `ON_HIT_PUSH 1` — rocket đẩy cả hai mục tiêu lùi 1 ô (fusionRecipes.ts:426).
- **Vấn đề:** trùng Thornshell.
- **Đề xuất:** giữ tên (tên đang rất hợp!), **tái dùng type `FLYER_REPEL`** (đã khai ở types.ts:1094, chưa wire — xem [A5]) — khi cô **kết thúc di chuyển**, mọi enemy kề ô đáp bị thổi lùi 1 ô (gió ép của rotor). 1 lần/lượt.
- **Vì sao hợp:** xung lực gắn vào việc BAY thay vì vào đạn — trigger là chuyện chỉ mình cô làm (đáp xuống giữa trận địa); giá là cô phải bay VÀO tiếp xúc bằng thân giấy.
- **Luật:** đẩy qua `planPush` chuẩn → va chạm vẫn tính damage như mọi cú đẩy; để mắt độ mạnh khi test (đẩy 4 hướng miễn phí mỗi lượt) — nếu lố, hạ xuống "chỉ đẩy enemy đứng cạnh Ô ĐÁP theo hướng ra xa cô".
- **Wiring:** móc cuối move của player. Độ khó: **Vừa**.
- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

### C5. MAT_SUNFLOWER — 5/9 (danh từ cột: "số lần cast skill mỗi trận" — GIỮ nguyên linh hồn A/B của cột)

Comment cột này tự hào "most disciplined column" — các đề xuất dưới **không phá** điều đó: mọi ô vẫn bán đúng một thứ là "thêm lượt cast", chỉ refract cơ chế chi trả. Giữ nguyên: Sunbloom `SUN_PER_TURN` (SIG), Snapmaw `SUN_WHILE_DIGESTING`, Ironhusk `SUN_ON_BLOCK_SPAWN`, **Peaburst `SUN_ON_KILL 10` (bản gốc nhánh A)**, **Cornova `SKILL_DISCOUNT 15` (bản gốc nhánh B)**.

#### [C5.1] REEDWING × MAT_SUNFLOWER — "Solar Rotor"

- **Hiện tại:** `SUN_ON_KILL 15` — desc "two barrels, two chances a turn" (fusionRecipes.ts:384).
- **Vấn đề:** trùng Peaburst/Chardslam — engine trả cho MỌI kill như nhau (`actionBuilders.ts:41`), ba ô chỉ khác value.
- **Đề xuất:** giữ tên, type mới **`SUN_ON_DOUBLE_KILL` 30** — lượt nào cô kết liễu **≥2 mạng** thì +30 Sol (1 lần/lượt). Kill đơn không trả gì.
- **Vì sao hợp:** double-kill là chuyện hai nòng của cô làm được đều đặn còn ai khác thì hãn hữu — trigger thuần identity; phần thưởng to hơn nhưng khó hơn.
- **Luật:** SUN ECONOMY RULE ✓ — vẫn trả cho "finishing something off", chỉ nâng ngưỡng.
- **Wiring:** đếm kill theo lượt tại site `SUN_ON_KILL` hiện có. Độ khó: **Vừa-Thấp**.
- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

#### [C5.2] CHARDSLAM × MAT_SUNFLOWER — "Sunlit Chard" (data honesty)

- **Hiện tại:** `SUN_ON_KILL 15` — desc ĐÃ hứa "every zombie he shoves into water, rock or another body pays 15" (fusionRecipes.ts:500) nhưng engine trả cho mọi kill, kể cả không-va-chạm.
- **Đề xuất:** giữ tên, type mới **`SUN_ON_COLLISION_KILL` 20** — CHỈ kill mà nguyên nhân là va chạm/nước/hố do anh gây mới trả; nâng 15→20 vì điều kiện hẹp lại.
- **Vì sao hợp:** desc đã kể đúng từ đầu — đề xuất này bắt engine giữ lời. Slam-kill là động từ duy nhất của anh.
- **Wiring:** `planPush` đã trả danh sách `drowned`/`collided` và killer-credit qua cú đẩy đã tồn tại (`itemResolution.ts:118`) — chỉ thêm phân loại nguyên nhân tại site trả tiền. Độ khó: **Thấp-Vừa**.
- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

#### [C5.3] THORNSHELL × MAT_SUNFLOWER — "Sunlit Thorn"

- **Hiện tại:** `SKILL_DISCOUNT 15` — Provoke rẻ hơn 15 Sol (fusionRecipes.ts:442).
- **Vấn đề:** trùng Cornova/Gourdward.
- **Đề xuất:** giữ tên, type mới **`TAUNT_REFUND` 5** — Provoke hoàn 5 Sol cho **mỗi enemy thực sự dính taunt**. Cast vào 3 con = hoàn 15 (bằng discount cũ), vào 5 con nhờ Bellowing Thorn = hoàn 25, cast trượt = trả đủ giá.
- **Vì sao hợp:** vẫn bán "số lần cast" nhưng giá theo CHẤT LƯỢNG cast — thưởng kỹ năng đặt Provoke, đúng hero chỉ mạnh khi địch đến với anh. Synergy nội hàng với Bellowing Thorn là chủ đích.
- **Luật:** SUN ECONOMY ✓ — không trả cho vung tay; trả cho việc gánh aggro cả đám.
- **Wiring:** đếm target dính taunt lúc resolve skill, refund tại chỗ. Độ khó: **Thấp**.
- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

#### [C5.4] GOURDWARD × MAT_SUNFLOWER — "Sunlit Rind"

- **Hiện tại:** `SKILL_DISCOUNT 10` — Encase rẻ hơn 10 (fusionRecipes.ts:558).
- **Vấn đề:** trùng Cornova/Thornshell.
- **Đề xuất:** giữ tên, type mới **`SHIELD_REFUND` 10** — mỗi layer do anh phát ra bị **đập vỡ** hoàn 10 Sol. Khiên chặn được đòn thì khiên tự trả tiền khiên kế tiếp.
- **Vì sao hợp:** vẫn bán số-lần-cast; trigger là danh từ riêng của anh (khiên LÀM VIỆC mới được trả — khiên phát thừa không hoàn gì).
- **Wiring:** cùng móc vỡ-layer `turnManager.ts:836` + stamp "ai phát" theo mẫu `shieldBarbed`. Độ khó: **Vừa**. Ghi chú: nếu [C1.1] cũng duyệt, Gourdward có 3 fusion cùng móc "layer vỡ" (Glass Rind / Payback Shell / Sunlit Rind) — 2 slot nên tối đa mang 2; build "trừng phạt kẻ đập khiên" là identity nhất quán, coi là feature.
- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

### C6. MAT_PEASHOOTER — 5/9 (danh từ cột: "khẩu súng — đòn bắn làm được gì")

Giữ nguyên: Sunbloom `GRANT_ATTACK`, Snapmaw `DIGEST_CLAW`, Thornshell `LASER_NEEDLE`, **Peaburst `DOUBLE_ATTACK` (Repeater — SIG)**, **Ironhusk `ATTACK_RANGE_BONUS` (Lance Bash — giữ push + thêm reach là điểm bán gốc)**.

#### [C6.1] CORNOVA × MAT_PEASHOOTER — "Twin Cob"

- **Hiện tại:** `DOUBLE_ATTACK 1` — viên phụ 1 damage vào cùng mục tiêu (fusionRecipes.ts:332).
- **Vấn đề:** trùng Peaburst (SIG của cô ấy) và Reedwing.
- **Đề xuất:** đổi tên **"Split Shell"**, type mới **`SPLIT_SHOT` 1** — viên phụ không bay vào mục tiêu mà **rơi xuống một ô kề mục tiêu có enemy** (ưu tiên theo hướng bắn; không có enemy kề thì không rơi).
- **Vì sao hợp:** mini-splash trên đòn THƯỜNG — em họ của SKILL_SPLASH (vốn skill-only) nhưng yếu hơn hẳn (1 dmg, 1 ô, cần enemy đứng cụm) nên không phá ranh giới "free splash every turn" mà types.ts cảnh giới; đúng nghề pháo phủ đầu cụm.
- **Wiring:** attack resolution — chọn ô phụ deterministic (không random). Độ khó: **Vừa**.
- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

#### [C6.2] REEDWING × MAT_PEASHOOTER — "Twin Pods"

- **Hiện tại:** `DOUBLE_ATTACK 1` — cả hai cánh bắn thêm loạt 1 damage (fusionRecipes.ts:390).
- **Vấn đề:** trùng Peaburst/Cornova.
- **Đề xuất:** đổi tên **"Focus Barrels"**, type mới **`FOCUS_BARRELS`** — khi chỉ **một** trong hai ô của cặp nòng có mục tiêu, nòng còn lại hội tụ vào đó: ô đó ăn **2 damage** thay vì 1. (Tự động, không cần UI chọn.)
- **Vì sao hợp:** đổi độ PHỦ lấy độ ĐẦM — đúng nghịch lý hai nòng của cô (hai ô cố định, nhiều khi chỉ trúng một); từ "bắn thêm" thành "bắn khôn".
- **Luật:** không đụng VOLLEY CAP (không nhân theo shot count — chỉ gộp hai nòng sẵn có).
- **Wiring:** attack resolution của wing guns. Độ khó: **Vừa**.
- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

#### [C6.3] CHARDSLAM × MAT_PEASHOOTER — "Longarm Chard" (2 phương án, cần bạn chọn)

- **Hiện tại:** `ATTACK_RANGE_BONUS 1` — Vault Toss túm từ 2 ô (fusionRecipes.ts:506).
- **Vấn đề:** trùng Ironhusk/Gourdward.
- **Phương án (a) — táo bạo:** đổi tên **"Teamlift Chard"**, type mới **`TOSS_ALLY`** — Vault Toss được phép ném **đồng minh** (0 damage, không collision lên ally, đáp ô trống). Công cụ reposition đội hình đúng chất Into the Breach: quăng Ironhusk vào lỗ spawn, quăng Sunbloom thoát vây.
- **Phương án (b) — an toàn:** giữ nguyên `ATTACK_RANGE_BONUS` (lý lẽ "súng = tầm với" vẫn ổn), chấp nhận cột này 8/9.
- **Wiring (a):** targeting cho phép ally + nhánh resolve TOSS bỏ damage/collision với ally. Độ khó: **Cao** (đáng giá nhất danh sách về chiều sâu chiến thuật).
- **Trạng thái:** ⬜ chờ duyệt — chọn (a) / (b)
- **Góp ý:**

#### [C6.4] GOURDWARD × MAT_PEASHOOTER — "Rind Pellet" (data honesty)

- **Hiện tại:** `ATTACK_RANGE_BONUS 3` — nhưng desc hứa hành vi line-seek: "fired down a row: shells the FIRST ally up to 4 tiles" (fusionRecipes.ts:564). Reinforce gốc là `MELEE 1` (heroes.ts:457) — +3 range trên MELEE nhiều khả năng cho chọn tự do trong tầm 4, KHÔNG phải bắn dọc hàng như lời hứa (cần đối chiếu targeting lúc implement).
- **Đề xuất:** giữ tên, type mới **`SHIELD_SHOT`** — Reinforce thành **LINE 4**: viên khiên bay dọc hàng, đậu vào unit ĐẦU TIÊN trên đường; là ally/Greenspire thì nhận layer, là enemy thì viên đạn hỏng. Đúng từng chữ desc, thêm friction đứng-hàng đúng vị game.
- **Vì sao hợp:** khẩu súng đúng nghĩa — bắn khiên như bắn đạn, có thể tắc nòng vì zombie chắn hàng.
- **Wiring:** đổi rangeType/targeting cho skill này khi carrier có effect (mẫu `ARC_ATTACK` đổi LINE→LOB đã có sẵn trong `applyFusionToSkill`). Độ khó: **Vừa**.
- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

### C7. MAT_ENDURIAN — 5/9 (danh từ cột: "chạm vào tôi/của tôi là trả giá")

Giữ nguyên: Sunbloom `BLESS_RETALIATE`, Snapmaw `DIGEST_RETALIATE`, Chardslam `RETALIATE_PUSH`, **Peaburst `TAUNT_ON_HIT` (Barbed Pea — bản phẳng làm gốc)**, **Thornshell `RETALIATE_DAMAGE` (Bristling Armor — SIG, exception 3-damage thành văn của RETALIATION RULE)**.

#### [C7.1] CORNOVA × MAT_ENDURIAN — "Barbed Cob"

- **Hiện tại:** `TAUNT_ON_HIT` — trúng đạn là phải quay sang đánh cô (fusionRecipes.ts:362).
- **Vấn đề:** trùng Peaburst/Reedwing.
- **Đề xuất:** đổi tên **"Limping Barb"**, type mới **`TAUNT_SLOW`** — mục tiêu trúng đạn bị taunt **và SLOW 1 lượt**: nó buộc phải đến, nhưng lê bước — cô có một nhịp để lùi và nạp arc.
- **Vì sao hợp:** taunt trên artillery vốn nghịch (kéo địch về phía thân giấy) — nửa slow biến nghịch lý thành kiting loop chủ động; gai găm vào chân đúng flavor durian.
- **Luật:** STUN RULE ✓ — slow chưa bao giờ bị cấm (tiền lệ `ON_HIT_SLOW`). Power-watch: 2 rider/đòn thường — nếu test thấy lố, hạ về "slow chỉ áp khi mục tiêu ĐANG bị taunt bởi cô".
- **Wiring:** rider composition tại chỗ resolve `TAUNT_ON_HIT` hiện có. Độ khó: **Thấp**.
- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

#### [C7.2] REEDWING × MAT_ENDURIAN — "Barbed Skids"

- **Hiện tại:** `TAUNT_ON_HIT` — desc tự khai chiêu: "và cô bay đi trước khi nó kịp đến" (fusionRecipes.ts:420).
- **Vấn đề:** trùng Peaburst/Cornova.
- **Đề xuất:** giữ tên, **tái dùng type `WIND_TAUNT`** (đã khai types.ts:1092, chưa wire — xem [A5]) — khi cô **rời ô kề** một enemy bằng di chuyển của mình, enemy đó bị TAUNT khoá vào cô đến hết lượt sau. Sà vào chọc, cất cánh, kéo cả con mồi rời khỏi ally.
- **Vì sao hợp:** desc cũ là một câu đùa ("nó ghét cô nhưng cô đã bay mất") — đề xuất biến câu đùa thành cơ chế: taunt sinh ra từ CÚ CẤT CÁNH, trigger thuần flight, không hero nào bắt chước được.
- **Wiring:** móc rời-adjacency trong move resolution (cùng vùng móc với [C4.2] — làm chung một lần cho rẻ). Độ khó: **Vừa**.
- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

#### [C7.3] IRONHUSK × MAT_ENDURIAN — "Spiked Bulwark" (2 phương án; (a) chi phí engine ≈ 0)

- **Hiện tại:** `RETALIATE_DAMAGE 1` — kèm desc hứa "+1 slam damage" không tồn tại (xem [A4.2]) (fusionRecipes.ts:304).
- **Vấn đề:** trùng Thornshell (SIG) và Gourdward.
- **Phương án (a) — khuyến nghị:** đổi tên **"Jamming Plate"**, **tái dùng type `RETALIATE_FREEZE`** — type mồ-côi-data nhưng engine ĐANG resolve sẵn (`turnManager.ts:1091-1105`): kẻ đánh melee vào cô lần đầu dính SLOW ("kẹt gai"), đang slow mà còn đánh tiếp thì kẹt cứng (STUN). Reskin flavor từ băng sang gai-kẹt-khớp — cơ chế giữ nguyên từng bit.
- **Phương án (b):** giữ `RETALIATE_DAMAGE 1`, chỉ sửa desc theo [A4.2], chấp nhận trùng với Thornshell.
- **Luật:** STUN RULE — two-step đã được types.ts biện hộ sẵn ("the same escalation the ICE element's retaliation uses"); không phải free-stun-mỗi-lượt.
- **Wiring (a):** 0 dòng engine — chỉ đổi recipe + desc + vi.ts. Độ khó: **Thấp nhất danh sách**.
- **Trạng thái:** ⬜ chờ duyệt — chọn (a) / (b)
- **Góp ý:**

#### [C7.4] GOURDWARD × MAT_ENDURIAN — "Spined Rind"

- **Hiện tại:** `RETALIATE_DAMAGE 1` — "đi xuyên qua anh để tới người anh che thì đổ máu" (fusionRecipes.ts:594).
- **Vấn đề:** trùng Thornshell/Ironhusk — và desc gốc thực ra đang tả một ý HAY HƠN effect.
- **Đề xuất:** giữ tên, type mới **`WARD_RETALIATE` 1** — kẻ nào đánh melee vào một **ally đang mang layer đứng kề Gourdward** bị gai đâm 1. (Đánh chính anh thì… không — muốn gai bản thân, chọn hero khác; anh là hộ vệ.)
- **Vì sao hợp:** trả đòn THAY người được hộ — trigger bảo-kê là danh từ riêng của Gourdward, đúng triết lý "anh đáng giá bằng người anh đang che".
- **Luật:** RETALIATION RULE ✓ — durian ghép vẫn trả đúng 1; melee-only đồng bộ Glass Rind.
- **Wiring:** nhánh enemy-attack resolution: check layer + adjacency với Gourdward. Độ khó: **Vừa**.
- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

### C8. MAT_WALLNUT — 6/9, cột duy nhất tôi khuyên KHÔNG ép 100% (cần chọn phương án trước)

WALL-NUT COLUMN RULE (fusionRecipes.ts:73) là công cụ DẠY: người chơi học một lần "vỏ cứng đọc theo tầm đánh — melee giảm đòn, ranged thêm máu". Trùng type ở đây là luật, không phải lười. Nhưng data đã tự lệch luật 2 ô ([A6]) nên đằng nào cũng phải quyết:

#### [C8.PA1] Phương án 1 — GIỮ luật cột, sửa data về khớp luật (khuyến nghị)

- `REEDWING:MAT_WALLNUT` → đổi `DAMAGE_REDUCTION 1` thành **`BONUS_HP 3`** (khớp luật ranged, khớp luôn bản HTML đang ghi 4→7 HP).
- `THORNSHELL:MAT_WALLNUT` (Thorn Lunge): chọn 1 — (i) giữ `THORN_LUNGE` như exception, BỔ SUNG ghi chú lý do vào comment luật (nó là "wall-nut bowling" — quả óc chó LĂN, cùng họ Rolling Charge); (ii) đổi về `DAMAGE_REDUCTION` cho thẳng luật (mất một ô thú vị).
- Cập nhật comment WALL-NUT RULE cho khớp data cuối.
- Kết quả unique: ~5-6/9 — chấp nhận, vì cột này bán SỰ DỄ ĐOÁN.

#### [C8.PA2] Phương án 2 — refract kiểu Pumpkin (danh từ "chịu đòn", 9 trigger)

Chỉ liệt kê để bạn cân: Sunbloom `START_SHIELDED` giữ / Peaburst `BONUS_HP 2` giữ / Snapmaw `ARMOR_WHILE_DIGESTING` giữ / Ironhusk `STEADFAST` giữ (SIG) / Cornova → mới `FLANK_PLATING` (-1 từ đòn của enemy KỀ BÊN — pháo sợ áp sát) / Reedwing → mới `EVASIVE` (đòn đầu tiên nhắm vào cô mỗi lượt địch -1) / Thornshell `THORN_LUNGE` giữ / Chardslam → [C8.1] / Gourdward `DAMAGE_REDUCTION` giữ (bản phẳng). Kết quả 9/9 nhưng người chơi mất quy tắc đọc-nhanh; 2 type mới cần wire vào `calculateDamage`.

- **Trạng thái:** ⬜ chờ duyệt — chọn PA1 / PA2
- **Góp ý:**

#### [C8.1] CHARDSLAM × MAT_WALLNUT — "Armored Chard" (nên làm ở CẢ HAI phương án)

- **Hiện tại:** `STEADFAST 1` — trùng nguyên bộ với Iron Bulwark của Ironhusk; desc lại chỉ kể nửa collision, giấu nửa -1/hit ([A4.4]).
- **Đề xuất:** type mới **`COLLISION_PLATING`** — miễn 100% damage va chạm + bịt hố spawn không mất máu, **KHÔNG** kèm -1/hit. Đúng từng chữ desc hiện tại ("collision specialist"), hết trùng SIG của Ironhusk, và Iron Bulwark lấy lại vị thế bản-đầy-đủ độc quyền.
- **Wiring:** tách nhánh trong `calculateDamage`/các site STEADFAST (subset của logic có sẵn). Độ khó: **Thấp**.
- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

---

## D. Sau khi bạn duyệt — thứ tự triển khai đề xuất

| Đợt | Gồm | Tính chất |
|---|---|---|
| 1 | [A1] [A2] [A3] | Chỉ HTML, không đụng gameplay |
| 2 | [A4] + [C2.2] + [C5.2] + [C7.3a] + [C8.1] | Nhóm "data honesty" — hành vi giữ nguyên hoặc đổi đúng như desc đã hứa sẵn; toàn việc Thấp |
| 3 | [C1.1] [C1.2] | Corn thành cột 9/9 thứ hai + diệt trùng-hàng Chardslam |
| 4 | [C4.1] [C4.2] [C7.1] [C7.2] | Cụm rider + cặp móc di-chuyển của Reedwing (làm chung) |
| 5 | [C5.1] [C5.3] [C5.4] [C6.1] [C6.2] [C6.4] | Kinh tế Sol + khẩu súng |
| 6 | [C3.1] [C3.2] [C6.3a] | Các món cần UI/luồng move — nặng nhất |
| 7 | [C8.PA*] [A5] [A6] | Chốt wall-nut, dọn types chết, cập nhật comment luật |

Mỗi đợt: sửa `types.ts` + wiring + `data/fusionRecipes.ts` + `i18n/vi.ts` trong CÙNG commit (không khai type chờ sẵn — bài học RADIUS); chạy `npm run typecheck` + mở dev cho `tutorial.assert` tự chạy. Tổng nếu duyệt hết: ~15 type mới + 3 type tái dùng ([C7.3a] miễn phí wiring) + 2 type xoá.

Đích cuối: 8 cột 9/9 (81 ô, ~76-78 effect type phân biệt), MAT_WALLNUT theo phương án bạn chọn.
