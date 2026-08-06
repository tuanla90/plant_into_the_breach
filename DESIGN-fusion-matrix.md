# BẢN ĐỒ MA TRẬN FUSION — 9 HERO × 9 GEAR

> Tài liệu đọc, trích từ `data/fusionRecipes.ts` ngày 2026-08-06 (sau 4 đợt triển khai
> PLAN-hero-zephyr: hệ lớp chắn, Zephyr thay Thornquill, support rework, tutorial mới).
> Mọi tên ô và hiệu ứng ở đây là **trạng thái thật trong code**, không phải bản nháp.
> Mục 6 là **7 ô đề xuất map lại — CHƯA TRIỂN KHAI**, chờ chốt.

---

## 1 · Đọc ma trận này thế nào

Fusion là **mang đặc điểm của một hero sang hero khác**. Mỗi gear thuộc về đúng một hero, và
mang đúng **hai món** của người đó:

- **Món A** — lấy từ *đòn thường* của chủ nhân. Thường là chỉ số hoặc thụ động: máu, tốc độ,
  thu nắng, phản đòn.
- **Món B** — lấy từ *kỹ năng trả phí* của chủ nhân. Thường đổi **cách vận hành** kỹ năng hay
  đòn đánh của người nhận: thêm loạt, để lại bụi, gây chảy máu.

Mỗi ô trong ma trận **chọn một trong hai món**, tuỳ món nào hợp với hero nhận. Ô nào cả hai
món đều vô nghĩa (arc trên hero cận chiến, chảy máu trên hero không có đòn đánh...) thì thành
**ngoại lệ** — hợp lệ, nhưng phải có lý do ghi ngay cạnh recipe. Cột nào cũng có 1–3 ngoại lệ;
đó là điều bình thường, không phải lỗi khung.

Ký hiệu dùng trong tài liệu:

| Ký hiệu | Nghĩa |
|---|---|
| ⭑ | Ô **chữ ký chính chủ** — hero fuse chính cây của mình, "chính mình vặn to lên" |
| A | Đúng món A của gear |
| B | Đúng món B của gear |
| EX | Ngoại lệ có lý do — giữ nguyên |
| ❌ | **Lạc trục** — hiệu ứng vay từ cột khác không lý do → có đề xuất ở mục 6 |

---

## 2 · Từ vựng hiệu ứng

**Chỉ số & thụ động**

- `BONUS_HP` — cộng thẳng máu tối đa (và máu hiện tại lúc fuse). Sống qua F5 nhờ
  `migrateHeroHp` tính lại từ effect.
- `MOVE_BONUS` — cộng ô di chuyển, ghi thẳng vào thân như STRIDE. Trục **duy nhất chưa fusion
  nào từng đụng** trước Cattail.
- `DAMAGE_REDUCTION` — mỗi đòn nhận vào trừ 1, **không bao giờ xuống dưới 1** (hero không được
  phép bất tử; giáp mũ của zombie mới được quyền về 0).
- `STEADFAST` — gói ba-trong-một của tường: −1 sát thương nhận vào, phớt lờ sát thương va
  chạm, bịt lỗ trồi không mất máu.
- `SUN_PER_TURN` / `SUN_ON_KILL` / `SUN_ON_BLOCK_SPAWN` — ba cửa thu nắng. **SUN RULE**: nắng
  không bao giờ trả cho việc *chỉ đánh trúng* — phải kết liễu, phải đứng bịt lỗ, hoặc phải
  tiêu cả lượt (Harvest).
- `SKILL_DISCOUNT` — kỹ năng phí rẻ hơn 15. Xuất hiện ở nhiều cột như "món lấp chỗ" — đó
  chính là mùi cần rà (mục 6).

**Rider trên đòn đánh** (chỉ dính khi đòn có DAMAGE — trừ ghi chú riêng)

- `ON_HIT_PUSH` / `ON_HIT_SLOW` / `ON_HIT_BURN` / `ON_HIT_FREEZE` — đòn đánh kèm đẩy / chậm /
  cháy / băng. `ON_HIT_FREEZE` ngày nay chỉ còn nguyên tố BĂNG cấp — **STUN RULE** cấm mọi
  recipe mới phát stun miễn phí.
- `BLEED_ON_HIT` — đòn đánh (kể cả cú ném 0 sát thương của Chardwall — dính theo shove) để lại
  vết thương hở: **đòn kế tiếp vào thân đó +1, rồi vết tiêu**. Cộng **sau** bước trừ giáp mũ —
  Đội Xô không nuốt được gear này. Xuyên qua miễn nhiễm STATUS: **trùm vẫn chảy máu**. Không
  cộng dồn.
- `BONUS_DAMAGE` — +1 vào mọi effect DAMAGE. *Map chứ không append*: hero 0 sát thương
  (Chardwall) không thể bị gear bơm số damage từ bên hông.
- `DOUBLE_ATTACK` — đòn thường bắn thêm loạt thứ hai (1 sát thương); loạt overkill tự lăn sang
  thân kế tiếp trong làn.
- `ADJACENT_STRIKE` — cú vung miễn phí trúng **mọi** địch đứng kề, không chỉ mục tiêu ngắm.

**Rider trên kỹ năng trả phí** (không bao giờ dính đòn miễn phí — tiền lệ SKILL_SPLASH)

- `SKILL_SPLASH` — kỹ năng phí nổ lan 4 ô quanh mục tiêu, vành ngoài nửa sức (stun mềm thành
  chậm — đúng STUN RULE).
- `SKILL_DISARM` — kỹ năng phí để lại **bụi** trên vùng nó phủ: thứ gì kết thúc lượt trong bụi
  không vung nổi đòn (cùng một cơ chế với hazard DUST_VEIL, một người đọc duy nhất là
  `blinded()`). Với kỹ năng nhắm đồng minh (Blessing), bụi rơi thành **vành quanh người nhận,
  không rơi lên chính họ** — kẻo màn che thành còng tay.

**Phản ứng khi bị đánh**

- `RETALIATE_DAMAGE` — kẻ cận chiến đánh vào bị trả đòn (2, riêng Thornhide chính chủ +1 chồng
  lên nội tại).
- `RETALIATE_PUSH` — kẻ cận chiến đánh vào bị **hất lùi một ô**. Bản "đường thoát" của phản
  đòn — hợp hero mỏng.
- `BUTTER_RETALIATE` — riêng Maw: kẻ đầu tiên cắn cô mỗi lượt tiêu hoá bị **trét bơ đứng
  hình**. Bơ được phép ghim vì chỉ canh đúng cửa sổ bất lực.

**Kinh tế lớp chắn** (mô hình §6.0: một lớp chặn TRỌN một nguồn rồi vỡ, không số, không dồn)

- `SHIELD_ON_KILL` — kết liễu là dựng một lớp mới lên bản thân (đã có lớp thì thôi — lớp tự là
  trần của nó).
- `SHIELD_SPREAD` — lớp mình trao ra **tràn sang những ai đứng kề người nhận**. Thay chỗ
  `SHIELD_BONUS` cũ ("+2 cỡ giáp") vì lớp không còn cỡ để cộng.
- `ARMOR_WHILE_DIGESTING` — bắt đầu tiêu hoá là có lớp: cú đầu tiên trong cửa sổ bất lực bị
  chặn trọn, cửa sổ vẫn là cửa sổ.

**Đổi hình đòn đánh**

- `ARC_ATTACK` — đòn thẳng thành đòn cầu vồng (bay qua vật cản, tầm giảm nửa). Không áp lên
  skill xuyên (pierce cần đường đi).
- `ATTACK_RANGE_BONUS` — vươn xa thêm. Dùng ở 5 cột như "món lấp chỗ" thứ hai — đa số có lý
  do riêng tốt, xem từng ô.
- `PUSH_DISTANCE` — mọi cú đẩy/kéo đi xa thêm 1 ô (không kéo giãn Vault Toss — điểm rơi cú
  ném là hình học cố định).
- `COLLISION_BONUS` — thân bị mình dúi vào vật cản chịu thêm 2 (và cộng thẳng vào sát thương
  ngã của Vault Toss).
- `GRANT_ATTACK` — trao đòn bắn miễn phí 1 sát thương cho hero không có (hoặc mất) đòn đánh.
- `DIGEST_REDUCTION` — riêng Maw: tiêu hoá 1 lượt thay vì 2.
- `TAUNT_RADIUS` — tiếng khiêu khích vươn xa thêm 1 ô (chỉ nghĩa với ai có taunt).

---

## 3 · Chín gear — chủ nhân và hai món

| Gear | Chủ nhân | Món A (đòn thường) | Món B (kỹ năng) |
|---|---|---|---|
| Sunflower | Sunspot — *Harvest / Solar Blessing* | thu nắng (`SUN_*`) | ~~`SKILL_BLESS`~~ **chưa ô nào nhận** |
| Peashooter | Shadeleaf — *Pea Shot / Precision Blast* | `GRANT_ATTACK` | `DOUBLE_ATTACK` |
| Chomper | Maw — *Bite / Devour* | `BONUS_DAMAGE` | `BLEED_ON_HIT` |
| Wall-nut | Ironhusk — *Shield Bash / Rolling Charge* | `BONUS_HP` | `DAMAGE_REDUCTION` |
| Corn | Cobb — *Corn Kernel / Butter Splat* | `ARC_ATTACK` | `SKILL_STUN` *(sẽ thêm nếu chốt mục 6)* |
| Cattail | Zephyr — *Wing Guns / Smoke Pod* | `MOVE_BONUS` | `SKILL_DISARM` |
| Endurian | Thornhide — *Thorn Swipe / Provoke* | `RETALIATE_*` (họ phản đòn) | `TAUNT_RADIUS` |
| Chard | Chardwall — *Vault Toss / Sweep* | `PUSH_DISTANCE` | ~~`SKILL_DISPLACE`~~ **chưa ô nào nhận** |
| Pumpkin | Gourdward — *Reinforce / Encase* | `SHIELD_ON_KILL` | `ELEMENT_WARD` *(sẽ thêm nếu chốt mục 6)* |

Hai món B gạch ngang là món khung kẻ ra nhưng khi rà từng ô, **mọi ô của cột đó đều có chỗ
đứng tốt hơn**. Theo bài học `RADIUS` (một `SkillRangeType` từng được khai rồi bỏ mặc, không
ai phân giải), **không thêm type khi chưa có ô dùng** — khung ghi lại là đủ, ô tương lai muốn
nhận thì thêm lúc đó.

---

## 4 · Chín hàng hero — từng ô một

### 4.1 SUNSPOT (Solar Flare) — cục pin

Không có đòn đánh nào. Đòn thường là Harvest (+50 nắng, tốn cả lượt); kỹ năng là Solar
Blessing (lớp chắn + "+1 sát thương *trong lượt này*" + **cho mượn nguyên tố** của cô vào tay
trống). Điểm yếu lõi: *phải được hộ tống, và mọi thứ cô làm đều tiêu cả lượt*. Hàng của cô vì
thế mua **vũ khí, giáp, và đường thoát**.

| Gear | Ô | Hiệu ứng | Phân loại |
|---|---|---|---|
| Sunflower | **Twin Sunflower** — Harvest cho gấp đôi: +25 mỗi lần gom | `SUN_PER_TURN 25` | ⭑ chính chủ |
| Peashooter | **Solar Pea** — có đòn bắn miễn phí 1 sát thương, +10 nắng khi trúng | `GRANT_ATTACK` | A — đúng nghĩa "trao súng cho người tay không" |
| Chomper | **Hungry Bloom** — kỹ năng rẻ hơn 15 | `SKILL_DISCOUNT 15` | EX — cô không có đòn đánh nên cả A (damage) lẫn B (bleed) đều chết; hàm răng đọc thành "cơn đói → phép rẻ hơn" |
| Wall-nut | **Armored Bloom** — mỗi đòn nhận trừ 1 | `DAMAGE_REDUCTION 1` | B của Wall-nut — đúng khung |
| Corn | **Mortar Bloom** — Blessing vươn xa thêm 2 | `ATTACK_RANGE_BONUS 2` | EX — arc vô nghĩa trên skill nhắm bạn, stun càng không; "súng cối" đọc thành tầm ban phước |
| Cattail | **Ashveil** — Blessing phủ bụi VÀNH QUANH người được ban phước | `SKILL_DISARM` | B — món B của Cattail, và là ô hưởng luật "bụi né người nhận" |
| Endurian | **Thorned Bloom** — kẻ đánh cận chiến bị đâm 2 | `RETALIATE_DAMAGE 2` | A của Endurian |
| Chard | **Guarded Bloom** — kẻ đánh cận chiến bị hất lùi 1 ô | `RETALIATE_PUSH` | EX — đòn bẩy của Chard đọc thành *đường thoát* cho cục pin; thay ô Shoving Bloom chết theo Sun Burn |
| Pumpkin | **Gourd Bloom** — +3 máu tối đa | `BONUS_HP 3` | ❌ → mục 6.5 |

### 4.2 SHADELEAF (Green Shadow) — xạ thủ thuần

Pea Shot (LINE 8, 2 sát thương, miễn phí) + Precision Blast (volley 3 viên — **búa phá lớp
chắn của phe cây**: viên 1 vỡ lớp, viên 2–3 vào thịt). Hàng của cô đổi **viên đạn làm được
gì**.

| Gear | Ô | Hiệu ứng | Phân loại |
|---|---|---|---|
| Sunflower | **Sunbeam Pea** — phát kết liễu +15 nắng | `SUN_ON_KILL 15` | A |
| Peashooter | **Repeater** — viên thứ hai 1 sát thương, overkill lăn sang thân kế | `DOUBLE_ATTACK 1` | ⭑ chính chủ |
| Chomper | **Serrated Pea** — đạn để lại vết thương hở (+1 đòn kế) | `BLEED_ON_HIT` | B — đổi từ Vampire Pea vì mô hình lớp làm nó trùng Gourd Sniper cùng hàng |
| Wall-nut | **Pea-nut** — đạn hất mục tiêu lùi 1 ô | `ON_HIT_PUSH 1` | EX **có chủ đích** — cặp bài trùng với Sling Pea, thẻ ghi thẳng "take it with Pea-nut or Sling Pea"; kèm cả cái tên chơi chữ pea-NUT |
| Corn | **Mortar Pea** — đạn bay cầu vồng qua vật cản, tầm 4 | `ARC_ATTACK` | A |
| Cattail | **Smokeline** — Precision Blast phủ bụi cả làn nó xuyên qua | `SKILL_DISARM` | B |
| Endurian | **Spineguard** — kẻ cận chiến bị hất lùi *vào đúng tầm cô bắn* | `RETALIATE_PUSH` | EX — họ-phản-đòn, biến thể đẩy hợp thân mỏng |
| Chard | **Sling Pea** — mọi cú đẩy cô gây ra đi xa thêm 1 | `PUSH_DISTANCE 1` | A — nửa kia của cặp Pea-nut |
| Pumpkin | **Gourd Sniper** — kết liễu là dựng lớp | `SHIELD_ON_KILL 1` | A |

### 4.3 MAW (Chompzilla) — đao phủ có cửa sổ

Bite 2 + Devour (nuốt 7 — **một nguồn duy nhất nên KHÔNG xé được lớp chắn**, quyết định 15),
trả giá bằng 2 lượt tiêu hoá bất lực. Cả hàng của cô vá đúng cửa sổ đó.

| Gear | Ô | Hiệu ứng | Phân loại |
|---|---|---|---|
| Sunflower | **Photosynthetic Gut** — vừa nhai vừa quang hợp: +15/lượt | `SUN_PER_TURN 15` | A |
| Peashooter | **Spitter** — có bãi nhổ tầm ngắn, dùng được *cả khi đang tiêu hoá* | `GRANT_ATTACK` | A |
| Chomper | **Double Jaw** — tiêu hoá 1 lượt thay vì 2 | `DIGEST_REDUCTION 1` | ⭑ chính chủ |
| Wall-nut | **Shelled Chomper** — bắt đầu tiêu hoá sau một lớp chắn mới | `ARMOR_WHILE_DIGESTING` | EX — máu của Wall-nut đọc qua lăng kính cửa-sổ-bất-lực, còn đúng chất hơn bản số cũ |
| Corn | **Buttered Hide** — kẻ đầu tiên cắn cô mỗi lượt tiêu hoá bị trét bơ | `BUTTER_RETALIATE` | EX — *bơ là ngô*; ghim hợp lệ vì chỉ canh cửa sổ |
| Cattail | **Prowl Drive** — +1 di chuyển | `MOVE_BONUS 1` | A — phải tới được bữa ăn, ăn xong lại chôn chân |
| Endurian | **Bristleback** — cắn cô là nhận 2, xuyên suốt cả lúc tiêu hoá | `RETALIATE_DAMAGE 2` | A của Endurian |
| Chard | **Chard Gullet** — đánh cô là bị hất lùi 1 ô, tiêu hoá hay không | `RETALIATE_PUSH` | EX — đẩy kẻ tới cắn ra khỏi tầm trong cửa sổ |
| Pumpkin | **Gourd Gut** — mỗi mạng là một lớp | `SHIELD_ON_KILL 1` | A |

### 4.4 IRONHUSK (Wall Knight) — bức tường

Shield Bash 1 + đẩy, Rolling Charge lăn. Nghề: chặn hành lang, bịt lỗ trồi. Hàng của cô làm
**việc chặn tự trả lương**.

| Gear | Ô | Hiệu ứng | Phân loại |
|---|---|---|---|
| Sunflower | **Sunstone Shield** — đứng bịt lỗ trồi được trả 35 nắng | `SUN_ON_BLOCK_SPAWN 35` | EX đẹp nhất ma trận — nắng đo bằng đúng nghề của cô |
| Peashooter | **Spear Bash** — bash vươn 2 ô, giữ nguyên cú đẩy | `ATTACK_RANGE_BONUS 1` | EX — giáo trên tường: chọn hành lang từ xa hơn |
| Chomper | **Rending Bash** — bash để lại vết thương hở | `BLEED_ON_HIT` | B |
| Wall-nut | **Iron Bulwark** — −1 nhận vào, phớt lờ va chạm, bịt lỗ không đau | `STEADFAST 1` | ⭑ chính chủ |
| Corn | **Cob Turret** — có đòn bắn miễn phí | `GRANT_ATTACK` | ❌ → mục 6.2 |
| Cattail | **Quick Bulwark** — +1 di chuyển | `MOVE_BONUS 1` | A — đến kịp hành lang là toàn bộ công việc |
| Endurian | **Spiked Bulwark** — bash trúng mọi địch đứng kề | `ADJACENT_STRIKE` | ❌ → mục 6.3 |
| Chard | **Chard Bash** — mọi cú đẩy đi xa thêm 1 (bash lẫn charge) | `PUSH_DISTANCE 1` | A của Chard |
| Pumpkin | **Pumpkin Shell** — −1 nhận vào, +2 máu | `DAMAGE_REDUCTION 1` | ❌ → mục 6.6 |

### 4.5 COBB (Kernel-Pult) — pháo cầu vồng

Corn Kernel LOB 2 (đạn bay qua đầu tường nhà mình — thứ không LINE nào làm được), Butter
Splat ghim đơn mục tiêu. Cô đã **trả giá cho đường cầu vồng bằng tầm, nhịp và độ lì** — hàng
của cô mua lại đúng ba thứ đó.

| Gear | Ô | Hiệu ứng | Phân loại |
|---|---|---|---|
| Sunflower | **Buttered Sun** — Butter Splat rẻ hơn 15 | `SKILL_DISCOUNT 15` | ❌ → mục 6.1 |
| Peashooter | **Twin Cob** — hạt thứ hai nhẹ hơn, 1 sát thương | `DOUBLE_ATTACK 1` | B |
| Chomper | **Shrapnel Kernel** — hạt ngô để lại vết thương hở | `BLEED_ON_HIT` | B |
| Wall-nut | **Cob Bunker** — +3 máu: pháo phải đứng gần thì phải chịu được bị với tới | `BONUS_HP 3` | A |
| Corn | **Cob Cannon** — Butter Splat ghim mục tiêu chính, làm chậm vành xung quanh | `SKILL_SPLASH` | ⭑ chính chủ |
| Cattail | **Skid Carriage** — +1 di chuyển: thêm chân là thêm đường lui | `MOVE_BONUS 1` | A |
| Endurian | **Durian Shot** — +1 sát thương mọi thứ cô ném | `BONUS_DAMAGE 1` | ❌ → mục 6.4 |
| Chard | **Chard Recoil** — kẻ cận chiến chạm vào bị hất lùi | `RETALIATE_PUSH` | EX — độ giật của pháo: đường thoát cho khẩu đội đứng sát tuyến |
| Pumpkin | **Gourd Battery** — hạt kết liễu là dựng lớp | `SHIELD_ON_KILL 1` | A |

### 4.6 ZEPHYR (Cattail) — phi công giấy

Wing Guns nước-mã (2 ô × 2 sát thương — hai nguồn riêng, viên đầu phá lớp viên sau vào),
Smoke Pod. 4 máu, bay, move 4. Hàng của cô mua **sống sót, đường thoát, và cách giữ đội hình
địch đứng yên** — soạn trọn trong đợt 2, cả 9 ô đều đúng khung.

| Gear | Ô | Hiệu ứng | Phân loại |
|---|---|---|---|
| Sunflower | **Solar Rotor** — mỗi mạng +15 nắng, hai nòng là hai cơ hội mỗi lượt | `SUN_ON_KILL 15` | A |
| Peashooter | **Twin Pods** — cả hai cánh bắn loạt hai | `DOUBLE_ATTACK 1` | B |
| Chomper | **Grinder Pods** — cả HAI mục tiêu cùng chảy máu | `BLEED_ON_HIT` | B — hai vết thương mỗi lượt cho cả đội thu hoạch |
| Wall-nut | **Armored Fuselage** — 4 → 7 máu, đôi cánh thôi làm bằng giấy | `BONUS_HP 3` | A |
| Corn | **Cluster Load** — Smoke Pod rẻ hơn 15 | `SKILL_DISCOUNT 15` | EX có ghi lý do trong code: arc vô nghĩa với hình học cố định, stun diện rộng phạm STUN RULE |
| Cattail | **Overdrive Rotor** — move 5, đang bay. Chính cô, vặn to lên | `MOVE_BONUS 1` | ⭑ chính chủ |
| Endurian | **Barbed Skids** — kẻ chạm vào bị hất lùi: với khung 4 máu, cú hất LÀ đường thoát | `RETALIATE_PUSH` | A-họ |
| Chard | **Downwash** — rocket hất thứ nó trúng lùi 1 ô, cả hai ô cùng lúc | `ON_HIT_PUSH 1` | EX — đẩy 2 thân trong một hành động, chưa ai làm được |
| Pumpkin | **Pod Plating** — mạng hạ là lớp mới: bảo hiểm mua bằng chính họng súng | `SHIELD_ON_KILL 1` | A |

### 4.7 THORNHIDE (Endurian) — cột thu lôi

Thorn Swipe 2 + nội tại phản đòn, Provoke ép địch xông vào. *"2 damage và move 2 thì chẳng
tóm được ai"* — anh chỉ mạnh khi địch buộc phải đến. Hàng của anh làm anh **lì hơn, đau hơn
khi chạm, và gọi to hơn**.

| Gear | Ô | Hiệu ứng | Phân loại |
|---|---|---|---|
| Sunflower | **Sunlit Thorn** — Provoke rẻ hơn 15 | `SKILL_DISCOUNT 15` | EX — cả đầu ra của anh nằm ở tiếng gọi 50-nắng; nắng = gọi được nhiều hơn |
| Peashooter | **Twin Thorn** — cú quật giáng thêm lần hai | `DOUBLE_ATTACK 1` | B |
| Chomper | **Gnashing Husk** — cú quật miễn phí trúng MỌI địch đứng kề | `ADJACENT_STRIKE` | EX — hàm răng đọc thành cắn-cả-đám: chuẩn hero bị vây |
| Wall-nut | **Ironthorn** — +3 máu: 13, thân lớn nhất game, vì mọi thứ đều nhắm vào nó | `BONUS_HP 3` | A |
| Corn | **Reaching Thorn** — quật xa 2 ô | `ATTACK_RANGE_BONUS 1` | EX — arc/stun đều không đứng được trên kit anh; tầm quật là món thay |
| Cattail | **Windburr** — +1 di chuyển: giờ anh CHỌN nơi đặt lời khiêu khích | `MOVE_BONUS 1` | A — ô đáng giá nhất cột Cattail |
| Endurian | **Spiked Endurian** — phản 3 thay vì 2 | `RETALIATE_DAMAGE 1` | ⭑ chính chủ (+1 chồng nội tại) |
| Chard | **Far Provoke** — Provoke vươn 4 ô thay vì 3 | `TAUNT_RADIUS 1` | EX — đòn bẩy của Chard đọc thành *tiếng gọi đi xa hơn*; đây cũng là nơi món B "taunt" của Endurian thực sự sống |
| Pumpkin | **Gourd Husk** — kết liễu bằng cú quật là dựng lớp | `SHIELD_ON_KILL 1` | A |

### 4.8 CHARDWALL (Chard Guard) — người ném

Vault Toss (túm kề, hất qua vai sang ô đối xứng, ngã 1 — sát thương VA CHẠM, không phải số
damage) + Sweep (hất 4 phía). 0 sát thương là identity, có code chặn hẳn trong
`utils/fusion.ts`. Hàng của anh mua **hiểm địa, tầm với và sát thương dúi** — không bao giờ
một con số damage.

| Gear | Ô | Hiệu ứng | Phân loại |
|---|---|---|---|
| Sunflower | **Sunlit Guard** — mỗi zombie bị dúi chết vào nước/đá/thân khác +15 nắng | `SUN_ON_KILL 15` | A — nắng đo bằng va chạm, đúng nghề |
| Peashooter | **Longarm Chard** — túm từ 2 ô, khỏi bước vào tầm chạm | `ATTACK_RANGE_BONUS 1` | EX — GRANT thừa (có đòn), DOUBLE chết (0 damage); tầm túm là món thay. ⚠️ chữ thẻ còn nói "Backswing" — cần sửa thành Vault Toss |
| Chomper | **Rending Guard** — cú ném để lại vết thương hở | `BLEED_ON_HIT` | B — *ô đẹp nhất trục chảy máu*: hero không kết liễu được ai giờ ĐÁNH DẤU cho cả đội, lách qua cửa cấm-damage một cách chính danh |
| Wall-nut | **Bulwark Chard** — +3 máu: phải bước vào tầm chạm mới làm được việc | `BONUS_HP 3` | A |
| Corn | **Cob Catapult** — mọi cú hất đi xa thêm 1 | `PUSH_DISTANCE 1` | EX — "cánh tay ném" là chính mô tả của gear Corn; đòn bẩy chồng đòn bẩy. ⚠️ chữ thẻ còn nói "swing"/Backswing — cần sửa theo Sweep |
| Cattail | **Veilsweep** — 4 ô Sweep vừa quét chìm trong bụi: vừa văng vừa câm họng | `SKILL_DISARM` | B |
| Endurian | **Thorned Guard** — kẻ cận chiến bị hất lùi | `RETALIATE_PUSH` | A-họ |
| Chard | **Grand Chard** — thứ bị anh dúi vào vật cản chịu thêm 2 (ngã Vault Toss thành 3) | `COLLISION_BONUS 2` | ⭑ chính chủ |
| Pumpkin | **Gourd Guard** — −1 nhận vào | `DAMAGE_REDUCTION 1` | ❌ → mục 6.7 |

### 4.9 GOURDWARD (Pumpkin) — hộ vệ thuần

Reinforce (lớp cho bất cứ đồng minh nào đứng kề — **kể cả NHÀ**) + Encase (lớp cho mình và cả
vành dấu cộng) + nội tại miễn BURN/FREEZE/SHOCK. Không còn đòn đánh nào; không nhận nguyên tố
(elementSlot NONE). Anh đáng giá đúng bằng những gì anh che được.

| Gear | Ô | Hiệu ứng | Phân loại |
|---|---|---|---|
| Sunflower | **Sunlit Shell** — Encase rẻ hơn 15 | `SKILL_DISCOUNT 15` | EX — cùng logic Sunlit Thorn: đầu ra của anh là số lần bọc |
| Peashooter | **Pea Turret** — có đòn bắn miễn phí: người gác học được cách bắn trả | `GRANT_ATTACK` | A — câu chuyện "mua lại khẩu súng đã mất" |
| Chomper | **Fanged Rind** — cắn anh là nhận lại 2 | `RETALIATE_DAMAGE 2` | EX — không đòn đánh nên A/B của Chomper đều chết; hàm răng quay mặt ra ngoài |
| Wall-nut | **Ironrind** — +3 máu: lớp vỏ quanh đồng đội chỉ sống khi người mang nó còn sống | `BONUS_HP 3` | A |
| Corn | **Long Arm Shell** — Reinforce vươn 2 ô: bọc đồng minh và nhà từ xa | `ATTACK_RANGE_BONUS 1` | EX — cánh tay ném của ngô đọc thành tầm trao lớp |
| Cattail | **Rolling Rind** — +1 di chuyển: vỏ đáng giá bằng khả năng tới kịp | `MOVE_BONUS 1` | A |
| Endurian | **Spined Shell** — đánh anh là bị hất lùi: muốn xuyên qua anh phải trả bằng đất | `RETALIATE_PUSH` | A-họ |
| Chard | **Braced Shell** — −1 nhận vào, phớt lờ va chạm, bịt lỗ không đau | `STEADFAST 1` | EX — thân cải làm thanh giằng |
| Pumpkin | **Great Gourd** — lớp anh trao TRÀN sang những ai đứng kề người nhận | `SHIELD_SPREAD` | ⭑ chính chủ |

---

## 5 · Các luật xuyên suốt (áp lên mọi ô)

1. **STUN RULE** — không recipe nào phát stun miễn phí, chấm hết. Stun hợp lệ duy nhất là
   loại *trả phí* (Butter Splat 50 nắng) hoặc *canh cửa sổ* (Buttered Hide). Mọi on-hit lạnh
   đều là CHẬM, không bao giờ là băng.
2. **SUN ECONOMY RULE** — nắng không trả cho việc chỉ-đánh-trúng. Kết liễu, bịt lỗ, hoặc tiêu
   nguyên lượt.
3. **Lớp chắn không có số** — mọi nguồn giáp phát cùng một thứ: MỘT lớp. Vì thế mọi cap cũ
   biến mất, và `SHIELD_BONUS` ("+cỡ giáp") được thay bằng `SHIELD_SPREAD` (+độ phủ).
4. **Chảy máu cộng SAU giáp mũ** và **xuyên miễn nhiễm STATUS** — gear trị giáp không bị giáp
   nuốt, và không nguội ở chín trận trùm.
5. **BONUS_DAMAGE map chứ không append** — Chardwall và mọi hero 0-damage tương lai không thể
   bị bơm số từ bên hông.
6. **Rider kỹ năng không bao giờ chạm đòn miễn phí** (SKILL_SPLASH/SKILL_DISARM/SKILL_STUN
   tương lai) — disarm miễn phí mỗi lượt chính là hình dạng STUN RULE cấm.
7. **Thẻ bài không được nói dối** — mô tả in trên recipe phải là đúng thứ engine làm. Mọi lần
   đổi cơ chế trong 4 đợt vừa rồi đều kèm sửa chữ thẻ; hai chữ sót được liệt ở mục 7.

---

## 6 · BẢY Ô ĐỀ XUẤT MAP LẠI — *chưa triển khai, chờ chốt*

Nguyên tắc rà: một ô bị đánh ❌ khi hiệu ứng của nó **là món chữ ký của cột khác** mà không có
lý do ghi kèm — tức người chơi nhìn gear không đoán được mình sắp nhận gì.

**6.1 · Cobb × Sunflower** — *Buttered Sun* (`SKILL_DISCOUNT`) → **Golden Kernel**
(`SUN_ON_KILL 15`). Discount là món lấp chỗ thứ ba trong cột nắng; trục A của Sunflower là
thu nắng và Cobb kết liễu đủ nhiều để nó chảy. Hàng cô cũng đang không có ô kinh tế nào.

**6.2 · Ironhusk × Corn** — *Cob Turret* (`GRANT_ATTACK`) → **Butter Bash** (`SKILL_STUN`
*mới*): "Rolling Charge trét bơ thứ nó tông trúng." GRANT là món A của cột *Peashooter* — nằm
ở cột Corn là lạc. Bơ đúng chất ngô, đúng món B trong khung, và hợp STUN RULE vì chỉ dính kỹ
năng trả phí. (Đổi này lấy đi lựa chọn bắn-tầm-xa của cô — nếu bạn quý Cob Turret hơn, ô này
giữ được như EX, nhưng khi đó món B của Corn tiếp tục không có ô nào nhận.)

**6.3 · Ironhusk × Endurian** — *Spiked Bulwark* (`ADJACENT_STRIKE`) → cùng tên,
**`RETALIATE_DAMAGE 2`**: "Cắn tường thì chảy máu." ADJACENT_STRIKE là chất Chomper và
Gnashing Husk của Thornhide đã giữ nó; tường thì phản đòn — đó mới là Endurian.

**6.4 · Cobb × Endurian** — *Durian Shot* (`BONUS_DAMAGE`) → **Durian Husk**
(`RETALIATE_DAMAGE 2`). BONUS_DAMAGE là món A của cột *Chomper* — lạc cột. LOB 2 ép cô đứng
sát tuyến; vỏ sầu riêng là độ lì cô cần, đúng "mua lại durability" của hàng.

**6.5 · Sunspot × Pumpkin** — *Gourd Bloom* (`BONUS_HP`) → **Warded Bloom** (`ELEMENT_WARD`
*mới*): miễn BURN/FREEZE/SHOCK. BONUS_HP là món A của cột *Wall-nut*. Cục pin không thể bị
đóng băng hay giật cháy — lớp vỏ bí đọc thành tấm bùa, và cô vốn đã miễn BURN bẩm sinh nên
món này nối dài đúng người.

**6.6 · Ironhusk × Pumpkin** — *Pumpkin Shell* (`DAMAGE_REDUCTION`) → **Warded Bulwark**
(`ELEMENT_WARD`). DAMAGE_REDUCTION là món B của cột *Wall-nut* (cô đã có bản xịn hơn ở Iron
Bulwark ngay cạnh). Bức tường không thể bị BĂNG nhấc khỏi hành lang — "blocking pays" đúng
nghĩa đen, đặc biệt ở stage II.

**6.7 · Chardwall × Pumpkin** — *Gourd Guard* (`DAMAGE_REDUCTION`) → cùng tên,
**`SHIELD_ON_KILL 1`**. Anh giết bằng va chạm, và mỗi cú dúi chết người tự đắp lớp — ăn khớp
Sunlit Guard cùng hàng (cùng một cú ném trả cả nắng lẫn giáp là một build có chủ đích).

**Chi phí engine nếu chốt cả 7:**

- `SKILL_STUN` — một nhánh trong `applyFusionToSkill`, sao y cổng `SKILL_DISARM` (sunCost > 0
  && có damage → thêm STUN nếu chưa có). Rẻ.
- `ELEMENT_WARD` — ghi ba miễn nhiễm vào `immunities` lúc `applyFusion`, **và** gấp lại ở hai
  điểm rebuild (`buildHeroFromSnapshot`, `freshHero`) vì rebuild đọc lại def sẽ xoá mảng nếu
  chỉ ghi một lần. Hai điểm, đã định vị sẵn.
- 7 ô data + i18n + chạy lại `roster.assert`/`tutorial.assert` (không bàn tutorial nào dùng
  các ô này — kỳ vọng xanh ngay).

---

## 7 · Lỗi chữ phát hiện khi rà (sửa cùng đợt với mục 6)

1. **Longarm Chard** — "Backswing reaches 2 tiles…" → Backswing đã nghỉ; sửa thành tầm túm
   của Vault Toss.
2. **Cob Catapult** — "3 from the swing, 3 from the sweep" → nửa "swing" chết theo Backswing;
   chỉ còn Sweep ăn PUSH_DISTANCE.

---

## 8 · Trạng thái

- Ma trận 81 ô như mô tả ở mục 4 là **code đang chạy**, typecheck + build + 2 bộ assert xanh.
- Mục 6 (7 ô) và mục 7 (2 chữ) là **việc chờ chốt** — nói "làm mục 6" là triển khai trọn gói.
- Khung hai món ghi chuẩn tại `data/fusionRecipes.ts` (comment đầu file) và
  `PLAN-hero-zephyr.md` §4.
