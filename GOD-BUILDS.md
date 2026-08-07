# GOD-BUILDS — Sổ săn outlier (v2, 2026-08-08)

> **Bản v2 viết lại toàn bộ.** Bản nháp cũ (brainstorm AI) đã bị thay vì: (1) dẫn các "MAT"
> không tồn tại trong ma trận; (2) vi phạm hàng loạt luật thiết kế đã chốt (Sol-chỉ-từ-
> kill/harvest, STUN RULE, hồi-sinh-chỉ-ở-Tháp-Xanh, 0% RNG, không có extra-action); (3) bịa
> hệ "81 relic riêng từng hero" trong khi relic là pool 27 toàn đội. Phần ý tưởng còn cứu được
> đã triage ở **mục 5** — đừng chép lại các ý vi phạm từ git history.
>
> **Vai trò file này:** sổ săn outlier. Một entry hợp lệ phải có đủ 4 phần:
> **(a)** công thức lắp từ Ô THẬT (tên ô + effect type theo `PLAN-fusion-unique.md` F1–F9);
> **(b)** vì sao mạnh (cơ chế nhân, không phải cộng); **(c)** SỐ CẦN ĐO khi playtest;
> **(d)** VAN NERF — vặn đúng một chỗ nào nếu lố. Build không đủ 4 phần không được vào sổ.
>
> **Cảnh báo trạng thái:** ô trích theo bảng F là TRẠNG THÁI ĐÍCH của pass unique, KHÔNG chắc
> đã nằm trong code (14 ô còn treo [A7], nhiều type trong danh sách "24 type phải viết", và
> bảng F có thể bị các vòng duyệt sau lật — tiền lệ: [C6.3] Roundhouse/`PLUS_ROTATE` đã rút
> khỏi ma trận sang tầng relic, ô data vẫn là Longarm Chard). Trước khi ĐO một build: grep
> effect type trong `.ts` để chắc nó đã sống.
>
> Nguồn sự thật: `PLAN-fusion-unique.md` (ma trận sau pass unique — đang triển khai tới đợt 5),
> `utils/elements.ts` (element/resonance), `data/heroUpgrades.ts` (act upgrade),
> `PLAN-relics-27.md` (pool relic), `DESIGN.md` §4-6 (kinh tế Sol/Coin).

---

## 0. Không gian build THẬT — mọi entry phải nằm trong khung này

- **Fusion:** mỗi hero tối đa **3 slot**, chỉ chọn từ **9 ô của đúng hàng mình** (một ô/cột).
  Kinh tế cả run mua nổi **4–6 fusion cho cả squad 3 hero** (DESIGN §5) → một hero full 3 slot
  = ngốn gần trọn ngân sách, hai hero kia gần trắng. **Đây là van cân bằng tự nhiên số một:
  god build cá nhân luôn trả giá bằng độ mỏng của đội.**
- **Element:** chọn lúc lập đội, giá 2 maxHP/hero, mỗi thân một nguyên tố. **Resonance chỉ khi
  cả 3 cùng một nguyên tố** (`elements.ts`): ICE = slow chồng slow → đóng băng; FIRE = địch
  đang cháy chết → ô nó đứng bốc cháy; LIGHTNING = tia lan nhảy thêm 1 hop.
- **Relic:** pool 27 toàn đội (không phải đồ riêng hero). Các entry dưới ghi "khớp relic dạng X"
  — điền id cụ thể khi PLAN-relics-27 chốt.
- **Act upgrade:** VIGOR (+2 maxHP) / STRIDE (+1 move) / EDGE (nghề riêng), mỗi hero mỗi loại
  một lần, run-scoped (`heroUpgrades.ts`).
- **Luật không được xuyên thủng** (build nào "cần" phá là build bịa): Sol chỉ từ kill/harvest ·
  stun luôn có giá (3 ngoại lệ đã đánh số) · phản đòn 3 là độc quyền Thornshell tự đắp ·
  không extra-action/extra-turn · không né %/tàng hình · không hồi sinh trong trận.

Ký hiệu: `[F5·Chardslam]` = ô hàng Chardslam, cột F5 (MAT_CORNOVA) trong PLAN-fusion-unique.

---

## 1. Sáu god build kinh điển (một hero — 3 ô thật)

### 1.1 CHARDSLAM — "Bàn Bida" (build được pass unique thiết kế CHỦ ĐÍCH)

- **Lắp:** Grand Chard `COLLISION_BONUS 2` [F8·SIG] + Blast Chard `COLLISION_SPLASH` [F5] +
  Rending Chard `BLEED_ON_SHOVE` [F3].
- **Vì sao mạnh:** ba ô cùng móc vào MỘT sự kiện (va chạm khi ném/đẩy) nên chúng NHÂN nhau:
  mỗi cú Vault Toss trúng thân = damage va chạm +2, vòng nổ 6 ô trực giao (chỉ enemy), mọi nạn
  nhân va chạm dính bleed. Một cú ném vào giữa cụm ăn cả cụm.
- **Nhân thêm:** element LIGHTNING mono-squad (tia lan +1 hop) nếu đội có nguồn chain; relic
  dạng "kẻ địch dịch chuyển cưỡng bức chạm gai/bẫy" ([G3]/[G4] nếu duyệt). EDGE của Chardslam.
- **Đo:** damage kỳ vọng/1 lần Vault Toss so với skill cùng giá Sol của hero khác; số mục tiêu
  trung bình dính splash/trận. Ngưỡng nghi lố: cú ném đơn > 2× damage skill đơn cùng giá.
- **Van nerf theo thứ tự:** `COLLISION_BONUS` 2→1 → splash chỉ nổ khi cú va GIẾT mục tiêu →
  bleed chỉ dính thân bị ném, không dính thân bị đâm.

### 1.2 SNAPMAW — "Cối Xay" (xóa điểm yếu = định nghĩa của god build)

- **Lắp:** Double Jaw `DIGEST_REDUCTION 1` [F3·SIG] + Armored Jaws `ARMOR_WHILE_DIGESTING 1`
  [F4] + Warded Gut `SHIELD_ON_DIGEST 1` [F9].
- **Vì sao mạnh:** điểm yếu lore của Devour là "phế võ công 2 lượt khi tiêu hóa". Ba ô này
  cùng vá đúng chỗ đó: tiêu hóa còn 1 lượt, trong lượt đó có giáp + khiên. Điểm yếu gần như
  biến mất → Devour từ đòn tình huống thành nhịp đều mỗi 2 lượt.
- **Biến thể mở màn:** thay Warded Gut bằng Stun Fang `STUN_ON_FULL_HP` [F5] — khóa mục tiêu
  full-HP rồi nuốt (vẫn nằm trong ngoại lệ STUN RULE #3, không phá luật).
- **Đo:** số Devour/trận; % thời gian Snapmaw "bất khả xâm phạm" (đang tiêu hóa mà có giáp+khiên).
  Ngưỡng nghi lố: Devour ≥ 3 lần/trận thường.
- **Van nerf:** `SHIELD_ON_DIGEST` đổi thành chỉ lượt ĐẦU của tiêu hóa → `DIGEST_REDUCTION`
  đặt sàn tiêu hóa tối thiểu 2 lượt với mục tiêu ELITE/boss-line.

### 1.3 PEABURST — "Máy Phát Sol" (outlier KINH TẾ, nguy hiểm hơn outlier damage)

- **Lắp:** `SUN_ON_KILL` [F1] + `DOUBLE_ATTACK` [F2·SIG] + Precision Shield
  `SHIELD_ON_SKILL_KILL 1` [F9].
- **Vì sao mạnh:** Sol là VÍ CHUNG của đội. Đòn đôi tăng số kill/lượt; mỗi kill trả Sol; kill
  bằng skill còn trả thêm khiên. Nếu Sol thu/lượt của mình Peaburst vượt giá skill trung bình,
  cả đội skill-spam không giới hạn — outlier kinh tế phá game âm thầm hơn mọi con số damage.
- **Đo:** Sol thu ròng/trận của build này so với đường cơ sở (Sunbloom harvest thuần). Ngưỡng
  nghi lố: thu ròng > 1.5× đường cơ sở, hoặc trận thường kết thúc mà ví Sol còn dư > 50%.
- **Van nerf:** giá trị `SUN_ON_KILL` giảm bậc (không đụng luật kill-only — luật đúng, số sai) →
  `SHIELD_ON_SKILL_KILL` cap 1 lần/lượt.

### 1.4 IRONHUSK — "Tường Sống" (kiểm chứng van sprout-pathing)

- **Lắp:** Iron Bulwark `STEADFAST` [F4·SIG] + Jamming Plate `RETALIATE_ROOT` [F7] +
  Bunker Plating `LAST_STAND_SHIELD` [F9].
- **Vì sao mạnh:** đứng vào nút cổ chai trước Trạm Mầm: không bị xô, kẻ nào đánh cô lượt sau
  không di chuyển được (vẫn đánh được — đúng biên STUN RULE), chết hụt một lần mỗi trận vẫn
  đứng. Một thân chặn một cửa vĩnh viễn.
- **Vì sao có thể KHÔNG lố:** zombie nhắm sprout gần nhất, không nhắm cây — bầy sẽ vòng đường
  khác nếu còn đường. Build này chỉ gãy nếu map generator sinh chokepoint đơn — cái cần sửa khi
  đó là **map**, không phải ô fusion. Ghi rõ để đừng nerf nhầm van.
- **Đo:** % trận mà một mình Ironhusk giữ được một hướng trọn trận; phân phối theo layout map.
- **Van nerf (nếu thật sự cần):** `RETALIATE_ROOT` thêm nhịp nghỉ (không root cùng một mục tiêu
  2 lượt liên tiếp).

### 1.5 GOURDWARD — "Pháo Đài Trừng Phạt"

- **Lắp:** Greatrind `SHIELD_SPREAD` [F9·SIG] + Payback Shell `SHIELD_BREAK_STUN` [F5] +
  Glass Rind `BARBED_SHIELD` [F3].
- **Vì sao mạnh:** khiên anh phát lan sang hàng xóm; mọi khiên mang gai (phản khi bị đập);
  khiên vỡ → kẻ đập bị stun (ngoại lệ STUN RULE #2 — địch phải TỰ đấm vỡ mới dính, đúng luật).
  Squad đứng cụm → mỗi đòn zombie đánh vào cụm đều tự trả giá hai lần.
- **Nhân thêm:** element ICE mono (slow từ nguồn khác + slow nữa = băng) biến cụm thành bẫy đông
  cứng; Sunbloom Dawn Harvest `HARVEST_SHIELD` [F9·Sunbloom] chồng thêm nguồn khiên thứ hai.
- **Đo:** damage hấp thụ + phản/trận so với tổng HP bầy; tần suất stun từ Payback Shell.
  Ngưỡng nghi lố: bầy thường (không boss) không phá nổi cụm trong suốt trận ở act 2+.
- **Van nerf:** `SHIELD_SPREAD` chỉ lan lúc CAST (không lan khiên phát sinh từ nguồn khác) →
  `BARBED_SHIELD` phản 1 chỉ với đòn melee.

### 1.6 SUNBLOOM — "Nữ Hoàng Chúc Phúc" (kiểm luật cộng dồn bless)

- **Lắp:** Fanged Blessing `BLESS_POWER 1` [F3] + Kinetic Bloom `BLESS_SHOCKWAVE` [F8] +
  Solar Corona `SKILL_AURA` [F5] (biến thể cơ động: thay Corona bằng Sunchaser `CONVOY_AURA` [F6]).
- **Vì sao mạnh:** mọi ô cùng cắm vào một động từ (bless/aura), stack lên MỘT carry — thường là
  Chardslam 1.1 hoặc Snapmaw 1.2, tức god build này là **hệ số nhân cho god build khác**, không
  đứng một mình.
- **Đo:** delta damage của carry khi có/không Sunbloom build này; nếu bless đưa carry vượt
  ngưỡng one-shot elite thì vấn đề nằm ở luật CỘNG DỒN bless (định nghĩa một chỗ, như Phụ lục D
  của bleed), không nằm ở từng ô.
- **Van nerf:** bless không cộng dồn cùng loại — lấy giá trị cao nhất.

---

## 2. Combo cấp ĐỘI — resonance là chất keo

| Đội | Lắp | Vòng lặp | Đo |
|---|---|---|---|
| **Băng Vĩnh Cửu** (mono-ICE) | Gourdward 1.5 + Ironhusk 1.4 + nguồn slow (item Ice Grenade / Rolling Rind `ENCASE_RANGE`) | Resonance ICE: slow chồng slow = đóng băng → cụm pháo đài vừa đỡ vừa đông cứng kẻ đập | Số zombie bị băng/trận; nếu > nửa bầy: xét lại điều kiện "đã slow" |
| **Lưới Điện** (mono-LIGHTNING) | Peaburst 1.3 + Chardslam 1.1 + nguồn chain (element sét trên carry) | Resonance +1 hop cho MỌI tia lan (`chainStep` — một bản duy nhất, mỗi nơi gọi tự khai damage, xem elements.ts) | Tổng damage lan/trận; bug cũ "hop kế thừa 999" đã có rào, nhưng ĐO lại khi thêm nguồn chain mới |
| **Đất Cháy** (mono-FIRE) | Thornshell taunt (`TAUNT_RADIUS` [F5] / Bellowing Thorn) + Cornova `SKILL_SPLASH` + bleed nguồn bất kỳ | Resonance FIRE: địch cháy chết → ô bốc cháy; taunt kéo bầy đi QUA các ô đang cháy | Damage địa hình/trận; kiểm tương tác ô cháy × Trạm Mầm (không được đốt trạm) |

**Chú ý chung:** resonance đọc từ SQUAD ĐÃ CHỌN, không phải từ người còn sống (`resonanceOf`),
và Blightlord có SEVERED cắt resonance giữa trận cuối — mọi combo cấp đội mặc định yếu đi đúng
một nấc ở trận cuối. Đó là chủ đích, không phải bug.

---

## 3. Vì sao god build TỰ trả giá (đừng nerf trước khi đo)

1. **Ngân sách fusion 4–6/run:** full-build một hero = hai hero kia gần trắng. Sức mạnh tập
   trung, rủi ro tập trung — mất carry một trận là mất trận.
2. **Element trả trước 2 maxHP/hero** — mono-squad trả 6 maxHP để lấy resonance.
3. **Sprout-pathing:** zombie không nhắm hero — build "bất tử cá nhân" không tự thắng trận,
   vẫn phải đứng ĐÚNG Ô để chặn đường về trạm.
4. **SEVERED ở trận cuối** cắt keo resonance.

→ Quy trình khi playtest lộ outlier: kiểm 4 van trên trước; nếu build vẫn vượt ngưỡng đã ghi
trong entry của nó, vặn ĐÚNG van nerf ghi sẵn, một nấc một, đo lại. Cấm nerf ngoài danh sách van
(đổi luật chung để trị một build là cách phá 80 ô còn lại).

---

## 4. Quy trình cập nhật sổ

- Ô mới wire xong ([A7]) hoặc mục G nào được duyệt → rà xem nó có tạo cặp NHÂN với ô/relic nào
  không; có thì thêm entry đủ 4 phần (a)(b)(c)(d).
- Sau mỗi vòng playtest: điền số đo vào entry; entry ba vòng liên tiếp không chạm ngưỡng thì
  đánh dấu `ổn định`, thôi theo dõi.
- Con số cân bằng chỉnh qua `utils/balance.ts` (pitb_balance_v1) để playtest nhanh — đọc chú
  thích đầu file đó trước khi thêm path.

---

## 5. Triage bản nháp cũ — cứu được gì, vứt vì sao

### 5.1 Ý đã TỒN TẠI sẵn trong ma trận (bản nháp phát minh lại cái đã có)

| Ý cũ | Đã tồn tại là |
|---|---|
| "Ném khiên kiểu Captain America" | Rind Pellet `SHIELD_SHOT` [F2·Gourdward] — LINE 4, unit đầu tiên nhận layer bất kể phe |
| "Khiên vỡ nổ/trừng phạt" | Payback Shell `SHIELD_BREAK_STUN` [F5·Gourdward] |
| "Rải mìn/bãi chông" | Caltrop Cob `SKILL_SPIKE_SCATTER` [F7·Cornova] — bản đã thuần hóa (2 dmg, tan) |
| "Overwatch tự bắn" | Overwatch Pea `OVERWATCH_SHOT` [F8·Peaburst] |
| "Đứng cùng nhau cùng +giáp (Phalanx)" | Guarded Bloom `ESCORTED_REDUCTION` [F4·Sunbloom] (một nửa ý) |
| "Húc xong đi tiếp / bắn xong bay tiếp" | Overdrive Rotor `ATTACK_THEN_MOVE` [F6·Reedwing·SIG] |

### 5.2 Ý cứu được — route sang đúng hệ

| Ý cũ | Route |
|---|---|
| "Alley-Oop: ném quái qua đồng minh thì nó bắn miễn phí" | Trùng tinh thần **[G3] Bắn Đón** (PLAN-fusion-unique mục G) — dùng bản G3, có spec + cap sẵn |
| Các ý "giao kèo quỷ dữ / high-risk" | Ứng viên **[G4] relic nguyền rủa** — nhưng viết lại theo luật "đổi NHỊP không đổi SỐ" |
| "Scout Drone xem spawn lượt sau" | Không phải relic — đây là **UX/intent preview**, so với chuẩn ItB; đưa vào backlog UI |
| "Quái chết trên gai mọc cây gai mới" | Ứng viên relic pool 27, cần luật tan sau N lượt để khỏi phủ map |
| "Bắn từ sau lưng +damage (flank)" | Ý tưởng hệ mới (facing) — game hiện KHÔNG có facing; nếu muốn, là quyết định cấp DESIGN.md, không phải relic |

### 5.3 Vứt hẳn — vi phạm luật đã chốt (kèm luật bị phạm)

| Ý cũ | Phạm |
|---|---|
| Quang Hợp (Sol miễn phí đầu lượt) | Kinh tế Sol: chỉ kill/harvest |
| Flashbang stun 3×3, Shockwave stun vùng, Iron Maiden root vĩnh viễn, Suppressive cấm skill | STUN RULE (stun/root phải có giá, có nhịp nghỉ) |
| Solar Revival (hồi sinh giữa trận) | Hồi sinh chỉ ở Tháp Xanh — trụ cột lore + cơ chế (game_lore ch.2/4) |
| Extra Action / Extra Turn (Còi Hiệu Lệnh, Động Cơ Vĩnh Cửu, Overcharge) | Không có action economy cộng thêm — một lượt/unit là bất biến của mô phỏng |
| Smoke né 100%, tàng hình không thể bị target | 0% RNG + intent đọc được (MASTER-VISION) |
| Homing bỏ đường ngắm | Identity ngắm-theo-lưới |
| Teleport toàn map (Blood Scent, Sol Jets) | Chưa có hệ teleport; phá đọc-được-nước-đi. Nếu muốn, là quyết định DESIGN, không nhét qua relic |
| "1 hit chết boss" (Orbital Laser 15 dmg) | Trần damage đơn phát; boss là bài toán nhiều lượt theo thiết kế |
