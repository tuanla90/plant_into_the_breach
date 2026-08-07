# BẢN ĐỒ MA TRẬN FUSION — 9 HERO × 9 GEAR

> Tài liệu đọc, trích từ `data/fusionRecipes.ts` **sau đợt map lại ngày 2026-08-06**.
> Mọi tên ô, hiệu ứng và con số ở đây là **trạng thái thật trong code đang chạy** — đã qua
> `npm run typecheck`, `npm run build`, `roster.assert` và `tutorial.assert`.
> Đợt map lại chạy **hai vòng** — 27 ô ở vòng một, 8 ô ở vòng hai — và danh sách đầy đủ nằm ở
> [mục 6](#6--đợt-map-lại-2026-08-06--đã-triển-khai). Không còn mục đề xuất nào chờ chốt.

---

## 1 · Đọc ma trận này thế nào

Fusion là **mang đặc điểm của một hero sang hero khác**. Mỗi gear thuộc về đúng một hero và
mang đúng **hai món** của người đó:

- **Món A** — lấy từ *đòn thường* của chủ nhân. Thường là chỉ số hoặc thụ động: máu, tốc độ,
  thu nắng, phản đòn.
- **Món B** — lấy từ *kỹ năng trả phí* của chủ nhân. Thường đổi **cách vận hành** kỹ năng hoặc
  đòn đánh của người nhận: thêm loạt, để lại bụi, gây chảy máu, ghim cứng.

Mỗi ô chọn một trong hai món, tuỳ món nào hợp với hero nhận. Ô nào cả hai món đều vô nghĩa
(vòng cung trên hero cận chiến, chảy máu trên hero không có đòn đánh…) thì là **ngoại lệ** —
hợp lệ, nhưng phải có lý do viết ngay cạnh recipe.

| Ký hiệu | Nghĩa |
|---|---|
| ⭑ | Ô **chữ ký chính chủ** — hero fuse chính cây của mình |
| A | Đúng món A của gear |
| B | Đúng món B của gear |
| EX | Ngoại lệ có lý do viết sẵn trong code |

---

## 2 · Bảy luật xuyên suốt

Đây là phần nên đọc trước khi sửa bất kỳ ô nào — chúng ràng buộc cả ma trận, và mỗi luật đều
sinh ra từ một lần sai đã xảy ra.

**L1 · SOL RULE — và cột Sol Battery bán ĐÚNG MỘT THỨ.** Sol không bao giờ trả cho việc *chỉ
đánh trúng*. Nhưng thứ cả cột bán thì chỉ có một: **hồi này hero được bấm kỹ năng bao nhiêu
lần** — và nó bán theo hai đường, đúng khung hai-món:

- **Món A — THÊM SOL**: `SUN_PER_TURN` (Sunbloom) · `SUN_ON_KILL` (Peaburst, Reedwing,
  Chardslam) · `SUN_WHILE_DIGESTING` (Snapmaw) · `SUN_ON_BLOCK_SPAWN` (Ironhusk). Mỗi cái gắn
  vào một việc hero đó **vốn đã làm**, nên luật "không trả cho việc vung đòn" vẫn nguyên.
- **Món B — RẺ KỸ NĂNG**: `SKILL_DISCOUNT` (Cornova, Thornshell, Gourdward). Dành riêng cho ba
  người mà **kỹ năng CHÍNH LÀ sản lượng**: giảm giá vô dụng với hero có nút phí tình huống, và
  quyết định với hero muốn bấm nó mọi lượt.

Năm A, ba B, một ô chữ ký. **Không ô nào trong cột này là ngoại lệ nữa** — trước đây bốn ô bị
gắn EX chỉ vì khung chưa nói ra được điều này.

**L2 · STUN RULE.** Không recipe nào phát stun *miễn phí, mỗi lượt, mãi mãi*. Có **ba ngoại lệ
có giá**, và cái giá chính là chỗ chúng khác hình dạng bị cấm:
- `SKILL_STUN` (*Stun Charge*) cưỡi **kỹ năng trả phí** — một cú ghim mỗi lần cast, mua bằng Sol.
- `SKILL_STUN` (*Stun Shell*) trên Bọc Giáp của Gourdward — ghim cả vành, nhưng là ngoại lệ
  **đắt nhất**: 0 sát thương, 8 máu, phải đứng giữa đám đông, hết một lượt và 50 Sol.
- `STUN_ON_FULL_HP` (*Stun Fang*) chỉ nổ trên thân **còn nguyên máu** → đúng **một lần cho
  mỗi con zombie, vĩnh viễn**; cắn lần hai gặp thân đã thương thì không có gì.

**L3 · RETALIATION RULE.** Sầu riêng ghép lên người khác **phản đúng 1**. Thornshell là ngoại lệ
duy nhất và là gear của chính anh: nội tại 2, *Bristling Armor* nâng lên 3. Trước đây cả cột
phản 2 — nghĩa là một cây 150 Coin ra sát thương nhiều hơn đòn đánh thật của phần lớn hero mà
không tốn lượt nào.

**L4 · PHẢN ĐÒN CHỈ TÍNH CẬN CHIẾN.** Mọi thẻ phản đòn đều viết "hits her **in melee**" và
engine trước đây **không hề kiểm tra** — Catapult nã từ 3 ô vẫn bị gai đâm. Giờ gai chỉ cắt thứ
chạm tới nó (`inMelee` trong `turnManager`). Địch tầm xa vẫn bị Khiêu Khích kéo tới, chỉ là
không chảy máu vì nó.

**L5 · CỘT WALL-NUT ĐỌC THEO TẦM.** Hero **cận chiến** mua `DAMAGE_REDUCTION` (bị tính trên
từng đòn nhỏ trong rất nhiều đòn); hero **tầm xa** mua `BONUS_HP` (hiếm khi bị đánh, nhưng đánh
là nặng — cần đệm sống qua một lượt tồi). Sunbloom không có đòn đánh nào nên đọc theo vế cận
chiến: cô bị *chạm tới*, và `BONUS_HP` thì cô đã có ở cột bí ngô.

**L6 · BỤI Ở NƠI VA CHẠM, KHÔNG PHẢI DỌC ĐƯỜNG BAY.** Luật này sinh ra để chữa *Smokeline*, thứ
từng phủ **cả làn viên đạn bay qua** và bịt luôn đường bắn của phe mình. Nội dung được giữ
nguyên; cái đã đổi là mốc.

*Bản đầu (đã nghỉ): "bụi rơi xuống chỗ thân ĐÁP".* Mốc đó chọn theo *Veilsweep* — ô từng phủ
vành đất mà zombie **vừa bị hất ra khỏi**, tức màn bụi tin cậy trượt đúng thứ nó nhắm. Ô đó
không còn trong ma trận, và mốc "chỗ đáp" theo nó mà đi.

*Bản đang chạy (chốt vòng 3): mốc là **ô VA CHẠM**.* Smoke Bullet nổ ngay chỗ nó trúng — thân bị
đẩy đi sau đó thì để lại đám mây phía sau, đúng vật lý của một viên đạn khói. Vẫn không phá tinh
thần gốc: bụi chỉ đọng ở những ô CÓ va chạm, không bao giờ trải dọc đường đạn. Không trúng ai thì
không có khói.

Hình bụi do từng ô quyết định, và cả hai đều **chỉ nằm trên kỹ năng trả phí** (lệnh cấm nhắm vào
tần suất, không nhắm vào chữ "bụi"): **Smoke Bullet** = đúng ô va chạm; **Ash Carriage** = bốn ô
**quanh** điểm nổ, chừa ô tâm — pháo bắn tro ra ngoài, còn ô tâm thì Nova Shell đã ghim rồi.

**L7 · THẺ KHÔNG ĐƯỢC NÓI DỐI.** `BONUS_DAMAGE` *map chứ không append* (hero 0 sát thương không
bị gear bơm số từ bên hông); rider nguyên tố **chỉ dán lên kỹ năng chạm được địch** (trước đây
Ơn Trên Sol và lớp vỏ của Gourdward về kèm `APPLY_BURN` trong danh sách hiệu ứng — không
bao giờ nổ, nhưng thẻ vẫn hứa đốt cháy chính đồng minh mình).

---

## 3 · Từ vựng hiệu ứng

**Chỉ số & thụ động**

| Hiệu ứng | Nghĩa |
|---|---|
| `BONUS_HP` | +máu tối đa (và máu hiện tại lúc fuse); sống qua F5 nhờ `migrateHeroHp` |
| `MOVE_BONUS` | +ô di chuyển, ghi thẳng vào thân như STRIDE |
| `DAMAGE_REDUCTION` | mỗi đòn nhận vào −1, **không bao giờ xuống dưới 1** |
| `STEADFAST` | gói ba-trong-một của tường: −1 sát thương, phớt va chạm, bịt lỗ không mất máu |
| `ARMOR_WHILE_DIGESTING` | −1 sát thương **chỉ khi đang tiêu hoá** (mọi đòn trong cửa sổ, không phải cú đầu) |
| `SUN_PER_TURN` · `SUN_ON_KILL` · `SUN_ON_BLOCK_SPAWN` · `SUN_WHILE_DIGESTING` | bốn cửa thu nắng, xem L1 |
| `SKILL_DISCOUNT` | kỹ năng phí rẻ hơn 15 |

**Rider trên đòn đánh** (chỉ dính khi đòn có DAMAGE, trừ ghi chú riêng)

| Hiệu ứng | Nghĩa |
|---|---|
| `BONUS_DAMAGE` | +1 vào mọi effect DAMAGE — *map*, không append (L7) |
| `DOUBLE_ATTACK` | đòn thường bắn loạt thứ hai (1 sát thương); loạt overkill lăn sang thân kế |
| `BLEED_ON_HIT` | để lại vết thương hở: **đòn kế tiếp +1 rồi vết tiêu**. Cộng **sau** giáp mũ (Đội Xô không nuốt được), xuyên miễn nhiễm STATUS (**trùm vẫn chảy máu**), không cộng dồn. Dính cả trên cú ném 0 sát thương của Chardslam |
| `TAUNT_ON_HIT` | thứ trúng đạn bị TAUNTED, chỉ về phía người bắn — miễn nhiễm STATUS từ chối |
| `STUN_ON_FULL_HP` | ghim thân **còn nguyên máu** (L2) |
| `ON_HIT_PUSH` · `ON_HIT_SLOW` · `ON_HIT_BURN` · `ON_HIT_FREEZE` | đòn kèm đẩy / chậm / cháy / băng |
| `ADJACENT_STRIKE` | *(mồ côi — không ô nào nhận, engine vẫn phân giải)* |
| `SMOKE_ON_HIT` | thân bị hero này **làm đau** đứng lại trong bụi: lượt sau không vung nổi đòn trừ khi nó bước ra khỏi đám mây. **MỘT ô, MỘT lượt** — đó là toàn bộ lý do một đòn miễn phí được phép mang nó, trong khi `SKILL_DISARM` (cả vùng, 2 lượt) thì không. Bụi huỷ MỘT CÚ VUNG, không huỷ lượt — zombie vẫn đi, vẫn telegraph, vẫn có thể bước ra. Ngang với `ON_HIT_PUSH`, thứ cũng chặn một đòn bằng cách dời thân đi |

**Rider trên kỹ năng trả phí** (không bao giờ dính đòn miễn phí — tiền lệ `SKILL_SPLASH`)

| Hiệu ứng | Nghĩa |
|---|---|
| `SKILL_SPLASH` | nổ lan 4 ô quanh mục tiêu, vành ngoài nửa sức (stun mềm thành chậm) |
| `SKILL_DISARM` | để lại **bụi** nơi thân thể đáp xuống (L6): thứ gì kết thúc lượt trong bụi không vung nổi đòn — cùng cơ chế hazard DUST_VEIL, một người đọc duy nhất là `blinded()` |
| `SKILL_STUN` | ghim thứ kỹ năng phí đánh trúng (L2). Cửa nhận cả kỹ năng **có DAMAGE** lẫn kỹ năng **lớp chắn** — vế thứ hai chỉ vì đúng một kit: Gourdward không có kỹ năng sát thương nào |
| `SKILL_AURA` | kỹ năng **buff đồng minh** phủ mọi đồng minh trong bán kính 2 ô (hình thoi "move range 2" = 12 ô). Chặn cứng: chỉ kỹ năng phí, và chỉ kỹ năng **không có DAMAGE** — nếu không thì đây là sát thương diện rộng đi cửa sau |
| `SKILL_REPEL` | kỹ năng **lớp chắn** trả phí thổi bật mọi địch đứng kề lùi một ô |
| `BLESS_SHOCKWAVE` | lời ban phước giáng xuống như sóng chấn: **mọi thứ** đứng kề thân được ban bị đẩy ra xa một ô — địch, đồng minh, và cả người ban nếu cô đứng sát. Đẩy người nhà là **tính năng**, không phải rò rỉ: tia sét lan giữa các thân **kề nhau**, nên đây là ô làm cả đội thôi đứng thành hàng. Một lần cast một sóng, tâm đúng ô người chơi ngắm (kể cả khi Vành Nhật Hoa đang ban cho cả tá người) |

**Phản ứng khi bị đánh** — tất cả đều chỉ tính cận chiến (L4)

| Hiệu ứng | Nghĩa |
|---|---|
| `RETALIATE_DAMAGE` | kẻ đánh vào ăn lại sát thương (1 với mọi hero, 2→3 với Thornshell — L3) |
| `RETALIATE_PUSH` | kẻ đánh vào bị **hất lùi một ô** — bản "đường thoát", hợp hero mỏng |
| `RETALIATE_BLEED` | kẻ đánh vào bị **chảy máu** — đánh dấu cho người khác kết liễu |
| `BARBED_SHIELD` | **lớp chắn mình trao ra là thuỷ tinh nhọn**: kẻ phá vỡ nó bị chảy máu. Cờ nằm trên *lớp* (`Unit.shieldBarbed`), viết cùng lúc với lớp, chết cùng lớp |

**Kinh tế lớp chắn** — mô hình §6.0: một lớp chặn **trọn** một nguồn rồi vỡ; không số, không dồn

| Hiệu ứng | Nghĩa |
|---|---|
| `SHIELD_ON_KILL` | kết liễu là dựng một lớp mới lên bản thân (đã có lớp thì thôi) |
| `SHIELD_SPREAD` | lớp mình trao ra **tràn sang những ai đứng kề người nhận** |
| `START_SHIELDED` | **bước vào trận đã có sẵn một lớp**. Áp trong `utils/unitFactory` — nơi mọi thân thể lên bàn cờ đều đi qua — nên đội tutorial kịch bản và đội roll thật dùng chung một cửa |
| `LAST_STAND_SHIELD` | **mỗi trận một lần**: cú đánh đáng lẽ kết liễu lại dựng lên một lớp, và lớp đó nuốt trọn cú đó. Cố ý KHÔNG phải `SHIELD_ON_KILL` — với một tanker thì lớp sẽ bật lại liên tục, tức là giáp đội lốt lớp chắn. Cờ `Unit.lastStandUsed` reset trong `unitFactory` mỗi trận, nếu không "mỗi trận một lần" âm thầm thành "mỗi run một lần" |
| `BLESS_POWER` | Ơn Trên Sol đáng thêm +1 sát thương nữa. Con số đóng dấu lên **thân được ban** (`Unit.blessPower`) vì lúc người đó vung đòn thì người ban đã ngoài tầm — cùng lý do với `blessedElement` |

**Đổi hình đòn đánh**

| Hiệu ứng | Nghĩa |
|---|---|
| `ARC_ATTACK` | đòn thẳng thành cầu vồng (bay qua vật cản, tầm giảm nửa); không áp lên skill xuyên |
| `ATTACK_RANGE_BONUS` | vươn xa thêm |
| `PUSH_DISTANCE` | mọi cú đẩy/kéo đi xa thêm 1 ô (không kéo giãn Vault Toss — điểm rơi là hình học cố định) |
| `COLLISION_BONUS` | thân bị mình dúi vào vật cản chịu thêm 2 (cộng cả vào sát thương ngã của Vault Toss) |
| `GRANT_ATTACK` | trao đòn bắn miễn phí cho hero không có đòn đánh |
| `DIGEST_CLAW` | trao **móng vuốt cận chiến 1 sát thương dùng được trong lúc tiêu hoá** — cửa duy nhất mở qua cửa sổ bất lực |
| `DIGEST_REDUCTION` | riêng Snapmaw: tiêu hoá 1 lượt thay vì 2 |
| `WING_MIDSHOT` | Song Pháo Cánh bắn thêm **ô nằm giữa cặp** — cả 4 hướng, một tên lửa thứ ba |
| `TAUNT_RADIUS` | tiếng khiêu khích vươn xa thêm |
| `OVERWATCH_SHOT` | **ô duy nhất trong ma trận nổ theo hành động của người khác**: địch nào bị *cả đội* đẩy đi mà nằm trong tầm bắn đều ăn một viên 1 sát thương, không tốn lượt của xạ thủ. Bắn bằng **đúng khẩu súng người đó đang cầm** — nên Peaburst cần hàng thông thoáng (LINE 8), còn Cornova thì **bay vòng cung** qua vật cản ở tầm 2 ô của cô. Chỉ nổ trong lượt của phe mình |

---

## 4 · Chín gear — chủ nhân và hai món

| Gear | Chủ nhân | Món A (đòn thường) | Món B (kỹ năng phí) |
|---|---|---|---|
| Sol Battery | Sunbloom — *Harvest / Solar Blessing* | thu nắng (`SUN_*`) | `BLESS_POWER` · `SKILL_AURA` |
| Seed Gun | Peaburst — *Pea Shot / Precision Blast* | bắn thẳng (`GRANT_ATTACK`, tầm) | `DOUBLE_ATTACK` |
| Steel Jaws | Snapmaw — *Bite / Devour* | `BONUS_DAMAGE` | `BLEED_ON_HIT` (và các biến thể phản đòn/lớp chắn) |
| Armor Plate | Ironhusk — *Shield Bash / Rolling Charge* | `BONUS_HP` (tầm xa) | `DAMAGE_REDUCTION` (cận chiến) — L5 |
| Corn Mortar | Cornova — *Corn Kernel / Nova Shell* | `ARC_ATTACK` · hình học · tầm | bơ: `SKILL_STUN` · `STUN_ON_FULL_HP` |
| Rotor Wing | Reedwing — *Wing Guns / Smoke Pod* | `MOVE_BONUS` | `SKILL_DISARM` |
| Spike Armor | Thornshell — *Thorn Swipe / Provoke* | `RETALIATE_*` | tiếng gọi: `TAUNT_RADIUS` · `TAUNT_ON_HIT` (cả ba hero tầm xa) |
| Spring Arm | Chardslam — *Vault Toss / Sweep* | `PUSH_DISTANCE` · `COLLISION_BONUS` · `ON_HIT_PUSH` | đòn bẩy: `SKILL_REPEL` · `BLESS_SHOCKWAVE` · `OVERWATCH_SHOT` |
| Bunker Shell | Gourdward — *Reinforce / Encase* | `SHIELD_ON_KILL` · `START_SHIELDED` · `LAST_STAND_SHIELD` | `SHIELD_SPREAD` |

Đợt map lại đã **lấp hai món B từng bỏ trống** (`SKILL_BLESS` và `SKILL_DISPLACE` trong bản
trước): cột nắng giờ có `BLESS_POWER` + `SKILL_AURA`, cột Spring Arm có `SKILL_REPEL` +
`BLESS_SHOCKWAVE` + `OVERWATCH_SHOT`. Không type nào được khai mà không có ô dùng — đó là bài
học `RADIUS`.

---

## 5 · Tám mươi mốt ô

### 5.1 SUNBLOOM — Sunbloom (Pin Sol)

*Harvest (50 nắng, tiêu cả lượt) + Solar Blessing (lớp chắn + 1 sát thương **chỉ trong lượt
này** + cho mượn nguyên tố).* Không đánh được ai. Điểm yếu lõi: **phải có người hộ tống**.

| Gear | Ô | Hiệu ứng | Loại |
|---|---|---|---|
| Sol Battery | **Twin Sol Battery** — Harvest ra hai mặt trời, +25/lượt | `SUN_PER_TURN 25` | ⭑ |
| Seed Gun | **Gunbloom** — có đòn bắn 1 sát thương, +10 nắng mỗi đòn trúng | `GRANT_ATTACK 0` | A |
| Steel Jaws | **Fanged Blessing** — Ơn Trên đáng +2 thay vì +1 | `BLESS_POWER 1` | B — nanh hướng vào *lời ban phước*, không vào kẻ địch: đầu ra duy nhất của cô là việc người được ban làm tiếp |
| Armor Plate | **Armored Bloom** — mỗi đòn −1 | `DAMAGE_REDUCTION 1` | B (L5) |
| Corn Mortar | **Solar Corona** — Ơn Trên phủ mọi đồng minh trong 2 ô | `SKILL_AURA` | B — tầm xa hơn trên buff đơn mục tiêu chỉ đổi *ai* nhận; cánh tay ném giờ rải luôn cả túi |
| Rotor Wing | **Sunchaser** — +1 di chuyển | `MOVE_BONUS 1` | A — bài toán hộ tống một nửa là bài toán bước chân; move 2 là thân chậm nhất bàn cờ |
| Spike Armor | **Thorned Bloom** — phản 1 | `RETALIATE_DAMAGE 1` | A (L3) |
| Spring Arm | **Kinetic Bloom** — lời ban phước thành sóng chấn: mọi thứ kề thân được ban bị đẩy ra một ô, kể cả chính cô | `BLESS_SHOCKWAVE` | B — đòn bẩy đọc thành **giãn đội hình**. Bản cũ (`RETALIATE_PUSH`) chỉ trả tiền SAU khi cô đã bị chạm tới; bản này là câu trả lời chủ động cho trùm sét lan |
| Bunker Shell | **Dawn Shell** — bước vào trận đã có sẵn một lớp chắn | `START_SHIELDED` | A — +3 máu là một con số, không phải câu trả lời: nó mua thêm hai nhát cắn, không mua đường thoát. Một LỚP thì cú đầu tiên chạm tới cô tốn của bầy đàn cả một lượt |

### 5.2 PEABURST — Peaburst (Đậu Bắn)

*Pea Shot (LINE 8, 2 sát thương) + Precision Blast (ba viên, viên overkill bay tiếp).*
Điểm yếu lõi: **xạ thủ thuần** — fusion đổi *đòn bắn làm được gì*.

| Gear | Ô | Hiệu ứng | Loại |
|---|---|---|---|
| Sol Battery | **Sunbeam Pea** — 15 nắng mỗi mạng kết liễu | `SUN_ON_KILL 15` | A (L1) |
| Seed Gun | **Repeater** — viên thứ hai 1 sát thương, overkill lăn sang thân kế | `DOUBLE_ATTACK 1` | ⭑ |
| Steel Jaws | **Serrated Pea** — đạn để lại vết thương | `BLEED_ON_HIT` | B |
| Armor Plate | **Armored Pea** — +3 máu (9 thay vì 6) | `BONUS_HP 3` | A (L5) |
| Corn Mortar | **Mortar Pea** — đạn bay vòng cung, tầm 4 | `ARC_ATTACK` | A |
| Rotor Wing | **Smokeline** — Phát Bắn Chuẩn Xác để bụi **đúng ô nó bắn trúng** | `SKILL_DISARM` | B (L6) |
| Spike Armor | **Barbed Pea** — thứ trúng đạn quay sang cô, lượt sau buộc xông tới | `TAUNT_ON_HIT` | B — nửa còn lại của sầu riêng: không phải gai, mà là **tiếng gọi**. Xạ thủ chọn được con nào ngừng đi tới nhà thì đáng hơn xạ thủ hất nó lùi một ô |
| Spring Arm | **Overwatch Pea** — địch bị đội đẩy vào làn ngắm ăn 1 sát thương | `OVERWATCH_SHOT` | B — đòn bẩy đọc thành **hoả lực yểm trợ**; muốn dùng phải có Chardslam/Ironhusk trong đội |
| Bunker Shell | **Warded Pea** — mỗi mạng kết liễu dựng một lớp | `SHIELD_ON_KILL 1` | A |

### 5.3 SNAPMAW — Snapmaw (Hàm Thép)

*Bite (2 sát thương) + Devour (7 sát thương, xoá sạch mọi thứ trừ trùm, **tiêu hoá 2 lượt**).*
Điểm yếu lõi: **bất lực trong lúc tiêu hoá** — cả hàng nhắm vào cửa sổ đó.

| Gear | Ô | Hiệu ứng | Loại |
|---|---|---|---|
| Sol Battery | **Sunlit Gut** — 25 nắng/lượt **chỉ khi đang nhai** | `SUN_WHILE_DIGESTING 25` | A (L1) — thẻ luôn viết "while she chews", engine trước đây trả mọi lượt |
| Seed Gun | **Rending Claws** — đang tiêu hoá vẫn cào kề bên 1 sát thương | `DIGEST_CLAW` | A — thay *Spitter*, ô mà thẻ hứa "dùng được khi đang tiêu hoá" còn cửa targeting từ chối thẳng |
| Steel Jaws | **Double Jaw** — tiêu hoá 1 lượt | `DIGEST_REDUCTION 1` | ⭑ |
| Armor Plate | **Armored Jaws** — −1 sát thương suốt lúc tiêu hoá | `ARMOR_WHILE_DIGESTING 1` | B (L5) — bản lớp chắn trùng với ô bí ngô của chính cô, nên quay về "da dày hơn" |
| Corn Mortar | **Stun Fang** — cắn thân **còn nguyên máu** thì ghim cứng | `STUN_ON_FULL_HP` | B (L2) |
| Rotor Wing | **Prowl Veil** — thứ bị cú cắn làm đau đứng lại trong bụi một lượt | `SMOKE_ON_HIT` | B — ô duy nhất trong hàng này từng **cãi lại luật của chính hàng**: mọi fusion của Snapmaw phải đánh vào *cửa sổ tiêu hoá*, mà thêm chân thì chẳng giúp gì cho hai lượt cô không hành động được. Bụi thì làm đúng việc đó |
| Spike Armor | **Bristleback** — phản 1, kể cả trong tiêu hoá | `RETALIATE_DAMAGE 1` | A (L3) |
| Spring Arm | **Sprung Gullet** — cú cắn hất thứ nó nhai lùi một ô | `ON_HIT_PUSH 1` | A — bản `RETALIATE_PUSH` trả tiền cho việc *bị cắn*, sai nửa của một hero mà vấn đề là hai lượt không hành động được. Trên CÚ CẮN thì nó là công cụ cô tự tiêu: nhai xong, ném con tiếp theo ra khỏi tầm với trước khi cửa sổ mở |
| Bunker Shell | **Warded Gut** — mỗi mạng dựng một lớp | `SHIELD_ON_KILL 1` | A |

### 5.4 IRONHUSK — Ironhusk (Tấm Giáp)

*Shield Bash (1 sát thương + đẩy) + Rolling Charge (lăn thẳng, 2 + đẩy, 35 nắng).*
Điểm yếu lõi: **chặn giỏi mà đóng góp ít** — cả hàng làm cho việc chặn có lãi.

| Gear | Ô | Hiệu ứng | Loại |
|---|---|---|---|
| Sol Battery | **Sunstone Shield** — bịt lỗ trồi được 35 nắng | `SUN_ON_BLOCK_SPAWN 35` | A (L1) — ô đẹp nhất cột: Sol đo bằng đúng nghề của cô |
| Seed Gun | **Spear Bash** — Đập Khiên vươn 1 ô mà vẫn đẩy | `ATTACK_RANGE_BONUS 1` | A |
| Steel Jaws | **Fanged Bash** — +1 sát thương mọi đòn | `BONUS_DAMAGE 1` | A — thay `BLEED_ON_HIT`, thứ đánh dấu cho *người khác* cash trên chính hero mà vấn đề là 1 sát thương của cô chẳng tới đâu |
| Armor Plate | **Iron Bulwark** — −1, phớt va chạm, bịt lỗ không đau | `STEADFAST 1` | ⭑ |
| Corn Mortar | **Stun Charge** — Cú Lăn trét bơ thứ nó tông | `SKILL_STUN` | B (L2) |
| Rotor Wing | **Quick Bulwark** — +1 di chuyển | `MOVE_BONUS 1` | A |
| Spike Armor | **Spiked Bulwark** — phản 1 | `RETALIATE_DAMAGE 1` | A (L3) — hero bị đánh nhiều nhất thì đầu ra nên nằm ở chỗ bị đánh |
| Spring Arm | **Sprung Bash** — mọi cú đẩy xa thêm 1 ô | `PUSH_DISTANCE 1` | A |
| Bunker Shell | **Bunker Plating** — mỗi trận một lần, cú đánh đáng lẽ kết liễu cô lại dựng lên một lớp | `LAST_STAND_SHIELD` | B — hết trùng trục với Iron Bulwark. `SHIELD_ON_KILL` là lựa chọn hiển nhiên và **sai**: với thân này thì lớp bật lại mỗi hai lượt, tức giáp đội lốt lớp chắn |

### 5.5 CORNOVA — Cornova (Bắp Ném)

*Corn Kernel (LOB 2) + Nova Shell (LOB 3, ghim 1 lượt).* Điểm yếu lõi: **vòng cung là miễn
phí, mọi thứ còn lại đều ngắn** — cả hàng mua lại tầm, nhịp và độ bền.

| Gear | Ô | Hiệu ứng | Loại |
|---|---|---|---|
| Sol Battery | **Sunlit Cob** — Đạn Nova rẻ hơn 15 | `SKILL_DISCOUNT 15` | B (L1) |
| Seed Gun | **Twin Cob** — hạt thứ hai 1 sát thương | `DOUBLE_ATTACK 1` | B |
| Steel Jaws | **Shrapnel Kernel** — hạt để lại vết thương | `BLEED_ON_HIT` | B |
| Armor Plate | **Armored Cob** — +3 máu | `BONUS_HP 3` | A (L5) |
| Corn Mortar | **Cob Howitzer** — Đạn Nova nổ lan, vành ngoài làm chậm | `SKILL_SPLASH` | ⭑ |
| Rotor Wing | **Ash Carriage** — thứ bị hạt ngô làm đau đứng lại trong bụi một lượt | `SMOKE_ON_HIT` | B — món B của cột rơi đúng vào **hero tầm xa**, vì phần thưởng "thân tôi bắn chẳng vung được" gần như vô giá trị với hero cận chiến (họ sắp bị đánh dù sao, riêng Thornshell còn *muốn* bị đánh) và quyết định với người bắn từ ngoài tầm tay |
| Spike Armor | **Barbed Cob** — thứ trúng hạt ngô quay sang cô | `TAUNT_ON_HIT` | B — cùng ô với Peaburst, và đọc y hệt trên khẩu pháo: cô là quân duy nhất với tới được con zombie cách Greenspire ba ô, nên cô được quyền quyết định nó đi về phía cô |
| Spring Arm | **Overwatch Cob** — địch bị đội đẩy vào tầm vòng cung ăn 1 sát thương | `OVERWATCH_SHOT` | B — cùng ô với Peaburst, khác đúng một chỗ và nó tự rơi ra: đạn yểm trợ bắn bằng khẩu súng cô đang cầm, nên của cô **bay vòng cung** (2 ô, kệ vật cản) còn của Peaburst cần hàng thông thoáng |
| Bunker Shell | **Warded Cob** — mỗi mạng dựng một lớp | `SHIELD_ON_KILL 1` | A |

### 5.6 REEDWING — Reedwing (Đuôi Mèo)

*Wing Guns (WING_PAIR, **1 sát thương mỗi ô × 2 ô**) + Smoke Pod (2 ô bụi, 3 lượt).*
4 máu, move 4, **BAY**. Điểm yếu lõi: **giấy có cánh** — phải bay vào đúng túi mà súng muốn.

> Đòn thường hạ từ 2 xuống **1 mỗi ô** trong đợt này. 2×2 = 4 sát thương miễn phí mỗi lượt là
> gấp đôi mọi đòn thường khác trong game. Ở mức 1, lượt miễn phí của cô đáng 2 — bằng Pea Shot
> — và thứ 4 máu thật sự mua là **hình dạng**: hai thân cùng lúc, chọn từ bất cứ đâu trên bàn.

| Gear | Ô | Hiệu ứng | Loại |
|---|---|---|---|
| Sol Battery | **Solar Rotor** — 15 nắng mỗi mạng, hai nòng hai cơ hội | `SUN_ON_KILL 15` | A |
| Seed Gun | **Twin Pods** — cả hai cánh bắn loạt thứ hai | `DOUBLE_ATTACK 1` | B |
| Steel Jaws | **Grinder Pods** — cả hai mục tiêu chảy máu | `BLEED_ON_HIT` | B |
| Armor Plate | **Armored Fuselage** — +3 máu (7 thay vì 4) | `BONUS_HP 3` | A (L5) |
| Corn Mortar | **Cluster Load** — tên lửa thứ ba vào **ô giữa cặp cánh** | `WING_MIDSHOT` | B — cánh tay ném đọc theo **hình học** chứ không theo tầm: hai ô cánh cách nhau đúng 2 ô nên luôn có một lỗ ở giữa. Chỉ có nghĩa với cô — không kit nào khác có lỗ của riêng mình |
| Rotor Wing | **Overdrive Rotor** — +1 di chuyển (move 5, đang bay) | `MOVE_BONUS 1` | ⭑ |
| Spike Armor | **Barbed Skids** — thứ trúng rocket quay sang cô, rồi cô bay đi | `TAUNT_ON_HIT` | B — `RETALIATE_PUSH` là cú hất mua SAU khi có thứ đã chạm tới khung 4 máu. Tiếng gọi là bản không bao giờ để nó tới nơi: kéo một thân về phía mình rồi lượt sau đơn giản là **không có mặt ở đó**. Cô là đơn vị duy nhất BAY, nên "lại đây" không tốn gì của cô và tốn của bầy đàn một quãng đường |
| Spring Arm | **Downwash** — rocket hất thứ nó trúng lùi một ô, cả hai ô | `ON_HIT_PUSH 1` | A |
| Bunker Shell | **Pod Plating** — mỗi mạng dựng một lớp | `SHIELD_ON_KILL 1` | A |

### 5.7 THORNSHELL — Thornshell (Sầu Riêng)

*Thorn Swipe (2 sát thương) + Provoke (mọi địch trong 3 ô phải tới).* **Nội tại phản 2.**
Điểm yếu lõi: **chỉ mạnh khi kẻ địch chịu tới chỗ anh** — move 2, 2 sát thương, tóm chẳng ai.

| Gear | Ô | Hiệu ứng | Loại |
|---|---|---|---|
| Sol Battery | **Sunlit Thorn** — Khiêu Khích rẻ hơn 15 | `SKILL_DISCOUNT 15` | B (L1) — đầu ra của anh là *số lần gọi được* |
| Seed Gun | **Twin Thorn** — quật thêm lần hai | `DOUBLE_ATTACK 1` | B |
| Steel Jaws | **Rending Husk** — kẻ đánh cận chiến bị **chảy máu** | `RETALIATE_BLEED` | B — thay `ADJACENT_STRIKE`, thứ trả tiền cho việc *tấn công* (nửa cố tình dở của hero này). Nanh quay ra ngoài: bốn thân bị kéo vào tiếp xúc, mỗi con rời đi mang sẵn dấu cho người khác kết liễu |
| Armor Plate | **Ironthorn** — −1 sát thương mỗi đòn | `DAMAGE_REDUCTION 1` | B (L5) — mọi thứ đều nhắm vào anh, nên trục tính-trên-từng-đòn mới đúng |
| Corn Mortar | **Bellowing Thorn** — Khiêu Khích vươn 5 ô thay vì 3 | `TAUNT_RADIUS 2` | B — cánh tay ném mang **tiếng gọi** thay vì cú vung; ở 5 ô nó với tới pháo binh và lũ bay vốn ngồi ngoài vòng 3 |
| Rotor Wing | **Windburr** — +1 di chuyển | `MOVE_BONUS 1` | A |
| Spike Armor | **Bristling Armor** — phản 3 thay vì 2 | `RETALIATE_DAMAGE 1` | ⭑ (L3, ngoại lệ chính chủ) |
| Spring Arm | **Sprung Thorn** — cú quét hất mục tiêu lùi một ô | `ON_HIT_PUSH 1` | A — trông như phản-synergy với taunt nhưng ngược lại: anh đứng giữa đám đông theo thiết kế, nên gần như mọi cú hất đều là một thân dúi vào thân khác |
| Bunker Shell | **Warded Husk** — mỗi mạng kết liễu dựng một lớp | `SHIELD_ON_KILL 1` | A |

### 5.8 CHARDSLAM — Chardslam (Cải Cầu Vồng)

*Vault Toss (miễn phí, tóm thân kề bên quăng qua đầu sang ô đối xứng, **1 sát thương ngã**) +
Sweep (hất mọi thứ kề bên 2 ô, 50 nắng).* **0 sát thương là hero, không phải lỗ hổng.**
Điểm yếu lõi: **bàn cờ trống trơn thì anh gần như vô hại**.

| Gear | Ô | Hiệu ứng | Loại |
|---|---|---|---|
| Sol Battery | **Sunlit Chard** — 15 nắng mỗi thân bị dúi chết | `SUN_ON_KILL 15` | A (L1) |
| Seed Gun | **Longarm Chard** — Quăng Vượt Đầu tóm từ 2 ô | `ATTACK_RANGE_BONUS 1` | A |
| Steel Jaws | **Rending Chard** — cú ném để lại vết thương | `BLEED_ON_HIT` | B — ô đẹp nhất trục chảy máu: hero không kết liễu nổi ai giờ đánh dấu cho cả đội. Chảy máu không phải con số sát thương nên qua được cửa duy nhất hàng này canh |
| Armor Plate | **Armored Chard** — −1 sát thương mỗi đòn | `DAMAGE_REDUCTION 1` | B (L5) |
| Corn Mortar | **Catapult Chard** — Quét Ngang hất 3 ô thay vì 2 | `PUSH_DISTANCE 1` | A |
| Rotor Wing | **Veilsweep** — bụi bốc lên **nơi thân đáp xuống** | `SKILL_DISARM` | B (L6) |
| Spike Armor | **Thorned Chard** — kẻ đánh cận chiến bị hất lùi | `RETALIATE_PUSH` | A |
| Spring Arm | **Grand Chard** — thân bị dúi vào vật cản chịu thêm 2 | `COLLISION_BONUS 2` | ⭑ |
| Bunker Shell | **Warded Chard** — mỗi thân dúi chết dựng một lớp | `SHIELD_ON_KILL 1` | A — anh **có** kết liễu: mỗi thân xuống nước/vào đá/vào thân khác đều là một mạng trong sổ (Sunlit Chard trả tiền đúng sự kiện đó) |

### 5.9 GOURDWARD — Gourdward (Vỏ Boong-ke)

*Reinforce (miễn phí, lớp chắn cho **bất cứ đồng minh nào kề bên — kể cả NHÀ**) + Encase (lớp
cho mình và cả vành dấu cộng).* Không đòn đánh nào. **Có ô nguyên tố, và ô đó chính là lớp
phòng hộ** (xem mục 6). Điểm yếu lõi: **đáng giá đúng bằng người anh đang che**.

| Gear | Ô | Hiệu ứng | Loại |
|---|---|---|---|
| Sol Battery | **Sunlit Rind** — Bọc Giáp rẻ hơn **10** | `SKILL_DISCOUNT 10` | B (L1) — ô discount duy nhất bị hạ giá trị, lý do ở §9.3 |
| Seed Gun | **Rind Pellet** — Gia Cố bắn đi như viên đạn: bọc đồng minh (hoặc nhà) đầu tiên trong 4 ô | `ATTACK_RANGE_BONUS 3` | A |
| Steel Jaws | **Glass Rind** — lớp chắn là thuỷ tinh nhọn, kẻ phá vỡ bị chảy máu | `BARBED_SHIELD` | B — nanh cắm vào **mặt duy nhất anh thật sự sở hữu**; cách hại người duy nhất của anh, và vẫn không phải cú vung |
| Armor Plate | **Ironrind** — −1 sát thương mỗi đòn | `DAMAGE_REDUCTION 1` | B (L5) |
| Corn Mortar | **Stun Shell** — Bọc Giáp trét bơ mọi zombie nó chạm tới | `SKILL_STUN` | B — hết trùng trục với Rind Pellet. Bơ là món B thật của cột bắp, và đây là kit duy nhất nó vừa: **ngoại lệ ĐẮT NHẤT** của STUN RULE — anh phải đứng GIỮA đám đông, 0 sát thương, 8 máu, hết một lượt và 50 Sol |
| Rotor Wing | **Rolling Rind** — +1 di chuyển | `MOVE_BONUS 1` | A |
| Spike Armor | **Spined Rind** — phản 1 | `RETALIATE_DAMAGE 1` | A (L3) |
| Spring Arm | **Shockrind** — Bọc Giáp thổi bật mọi địch kề bên lùi một ô | `SKILL_REPEL` | B — dựng vỏ là một *sự kiện*; đây cũng là thứ duy nhất cho nguyên tố của anh có chỗ cưỡi |
| Bunker Shell | **Greatrind** — lớp trao ra tràn sang người đứng kề người nhận | `SHIELD_SPREAD` | ⭑ |

---

## 6 · Đợt map lại 2026-08-06 — ĐÃ TRIỂN KHAI

### 6.1 · Đợt một (27 ô)

| Hero × Gear | Trước | Sau |
|---|---|---|
| Sunbloom × Steel Jaws | *Hungry Bloom* `SKILL_DISCOUNT` | **Fanged Blessing** `BLESS_POWER 1` |
| Sunbloom × Corn | *Mortar Bloom* `ATTACK_RANGE_BONUS 2` | **Solar Corona** `SKILL_AURA` |
| Sunbloom × Rotor Wing | *Ashveil* `SKILL_DISARM` | **Sunchaser** `MOVE_BONUS 1` |
| Sunbloom × Spike Armor | phản 2 | phản **1** |
| Peaburst × Armor Plate | *Armored Pea* `ON_HIT_PUSH` | `BONUS_HP 3` |
| Peaburst × Spike Armor | *Spineguard* `RETALIATE_PUSH` | **Barbed Pea** `TAUNT_ON_HIT` |
| Peaburst × Chard | *Sling Pea* `PUSH_DISTANCE` | **Overwatch Pea** `OVERWATCH_SHOT` |
| Snapmaw × Sol Battery | `SUN_PER_TURN 15` (mọi lượt) | `SUN_WHILE_DIGESTING 25` |
| Snapmaw × Seed Gun | *Spitter* `GRANT_ATTACK` | **Rending Claws** `DIGEST_CLAW` |
| Snapmaw × Armor Plate | lớp chắn lúc bắt đầu tiêu hoá | `ARMOR_WHILE_DIGESTING 1` (−1 suốt cửa sổ) |
| Snapmaw × Corn | *Numbed Hide* `BUTTER_RETALIATE` | **Stun Fang** `STUN_ON_FULL_HP` |
| Snapmaw × Spike Armor | phản 2 | phản **1** |
| Ironhusk × Steel Jaws | *Rending Bash* `BLEED_ON_HIT` | **Fanged Bash** `BONUS_DAMAGE 1` |
| Ironhusk × Corn | *Cob Turret* `GRANT_ATTACK` | **Stun Charge** `SKILL_STUN` |
| Ironhusk × Spike Armor | *Spiked Bulwark* `ADJACENT_STRIKE` | `RETALIATE_DAMAGE 1` |
| Reedwing × Corn | *Cluster Load* `SKILL_DISCOUNT` | **Cluster Load** `WING_MIDSHOT` |
| Thornshell × Steel Jaws | *Gnashing Husk* `ADJACENT_STRIKE` | **Rending Husk** `RETALIATE_BLEED` |
| Thornshell × Armor Plate | *Ironthorn* `BONUS_HP 3` | `DAMAGE_REDUCTION 1` |
| Thornshell × Corn | *Reaching Thorn* `ATTACK_RANGE_BONUS` | **Bellowing Thorn** `TAUNT_RADIUS 2` |
| Thornshell × Chard | *Far Provoke* `TAUNT_RADIUS 1` | **Sprung Thorn** `ON_HIT_PUSH 1` |
| Chardslam × Armor Plate | *Armored Chard* `BONUS_HP 3` | `DAMAGE_REDUCTION 1` |
| Chardslam × Bunker Shell | *Warded Chard* `DAMAGE_REDUCTION` | `SHIELD_ON_KILL 1` |
| Gourdward × Seed Gun | *Pea Turret* `GRANT_ATTACK` | **Rind Pellet** `ATTACK_RANGE_BONUS 3` |
| Gourdward × Steel Jaws | *Fanged Rind* phản 2 | **Glass Rind** `BARBED_SHIELD` |
| Gourdward × Armor Plate | *Ironrind* `BONUS_HP 3` | `DAMAGE_REDUCTION 1` |
| Gourdward × Spike Armor | *Spined Rind* `RETALIATE_PUSH` | `RETALIATE_DAMAGE 1` |
| Gourdward × Chard | *Braced Shell* `STEADFAST` | **Shockrind** `SKILL_REPEL` |

### 6.2 · Đợt hai (8 ô)

| Hero × Gear | Trước | Sau |
|---|---|---|
| Sunbloom × Spring Arm | *Guarded Bloom* `RETALIATE_PUSH` | **Kinetic Bloom** `BLESS_SHOCKWAVE` |
| Sunbloom × Bunker Shell | *Gourd Bloom* `BONUS_HP 3` | **Dawn Shell** `START_SHIELDED` |
| Snapmaw × Spring Arm | *Sprung Gullet* `RETALIATE_PUSH` | `ON_HIT_PUSH 1` |
| Ironhusk × Bunker Shell | *Bunker Plating* `DAMAGE_REDUCTION` | `LAST_STAND_SHIELD` |
| Cornova × Spike Armor | *Barbed Cob* `BONUS_DAMAGE 1` | `TAUNT_ON_HIT` |
| Cornova × Spring Arm | *Overwatch Cob* `RETALIATE_PUSH` | `OVERWATCH_SHOT` |
| Reedwing × Spike Armor | *Barbed Skids* `RETALIATE_PUSH` | `TAUNT_ON_HIT` |
| Gourdward × Corn Mortar | *Long Arm Shell* `ATTACK_RANGE_BONUS 1` | **Stun Shell** `SKILL_STUN` |

Đợt hai làm được ba việc ngoài tám ô:

- **Đóng cả hai chỗ còn mở** của đợt một (mục 7 cũ). Không hàng nào còn hai ô trùng trục.
- **Giảm mạnh số ô `RETALIATE_PUSH`**: từ 5 xuống đúng **1** (Thorned Chard của Chardslam). Nó là hiệu ứng "trả tiền SAU khi đã bị
  chạm tới", và trên phần lớn hero thì đó là nửa sai của bài toán — bốn ô đổi sang thứ ngăn
  không cho chuyện đó xảy ra (`TAUNT_ON_HIT` ×2, `BLESS_SHOCKWAVE`, `OVERWATCH_SHOT`), một ô
  chuyển cùng cú đẩy ấy sang **đòn đánh** (`ON_HIT_PUSH` của Snapmaw).
- **`TAUNT_ON_HIT` thành một trục thật của cột Spike Armor**: ba hero tầm xa (Peaburst,
  Cornova, Reedwing) đều nhận, và mỗi người dùng nó theo một cách khác nhau — Peaburst kéo
  con zombie ra khỏi đường tới Greenspire, Cornova với tới thứ ở xa 3 ô, Reedwing kéo về rồi
  **bay đi mất**.

### 6.3 · Đổi ngoài ma trận

**Reedwing — đòn thường 2 → 1 sát thương mỗi ô.** Hai nòng × 2 là 4 sát thương miễn phí mỗi
lượt, gấp đôi mọi hero khác. Chỉ số `damage` của cô cũng về 1 cho khớp (nó nuôi cả tia lan sét).

**Gourdward — lớp phòng hộ không còn miễn nhiễm cả ba nguyên tố.** Trước: `immunities:
['BURN','FREEZE','SHOCK']` cứng, cộng `elementSlot: 'NONE'` để giấu ô nguyên tố — vì một hero
đã miễn cả ba thì chẳng còn gì để mua, ô đó là cái quầy bán bẫy. Giờ **miễn nhiễm CHÍNH LÀ
nguyên tố anh chọn**: chọn LỬA thì không bị nướng, chọn BĂNG thì không bị đóng, chọn SÉT thì tia
không dẫn qua. `elementalImmunities` trong `utils/unitFactory` đã làm đúng việc đó cho mọi hero
từ khi có nguyên tố, nên cái ward này tốn **0 dòng engine** và ô nguyên tố thành lựa chọn thật
với giá chuẩn −2 máu tối đa. Đổi lại anh chỉ được bảo vệ bằng một act thay vì ba.
Trường `HeroDefinition.elementSlot` đã bị xoá — không hero nào dùng nữa (bài học `RADIUS`).

**Luật L4 (phản đòn chỉ cận chiến), L6 (bụi rơi chỗ đáp), L7 (rider nguyên tố).** Ba luật ở mục
2 đều là sửa engine trong đợt này, không phải mô tả cái sẵn có.

**`BUTTER_RETALIATE` bị xoá hẳn** (type + khối trong `turnManager` + set `butteredThisTurn`);
`STUN_ON_FULL_HP` thay chỗ. `ADJACENT_STRIKE` thành **mồ côi dữ liệu** — không ô nào nhận, engine
vẫn phân giải, giữ lại theo tiền lệ `SPIKE_TRAIL`.

---

## 7 · Chỗ còn mở

Không còn. Hai mục treo của đợt một đều đã đóng trong đợt hai:

- **Gourdward × Corn Mortar** hết trùng trục với *Rind Pellet* — bơ ghim thay cho +1 tầm.
- **Ironhusk × Bunker Shell** hết trùng trục với *Iron Bulwark* — lớp chắn phút chót thay cho −1
  sát thương. Đây cũng là ô mà `SHIELD_ON_KILL` (gợi ý cũ) **là lựa chọn sai**: trên một thân khó
  hạ như cô thì lớp sẽ bật lại mỗi hai lượt, tức là giáp đội lốt lớp chắn.

Một giới hạn cần biết chứ không phải lỗi: **`OVERWATCH_SHOT` chỉ nổ trong lượt của phe mình**
(cú đẩy do đội gây ra, phân giải trong `planSkillActions`). Địch bị đẩy trong lượt địch — phản
đòn `RETALIATE_PUSH`, cú tông của trùm — nằm ngoài, và thẻ bài viết đúng như vậy.

---

## 8 · Trạng thái

- 81/81 ô có recipe, **41 hiệu ứng khác nhau** đang được dùng.
- **Không còn ô EX nào.** Cả 81 ô đều xếp được vào khung hai-món (A/B) hoặc là ô chữ ký — bước cuối là luật cột Sol Battery ở L1, thuộc về 4 ô trước đây không biết đứng đâu.
- **Mỗi HÀNG một danh từ cây** (NAMING.md đợt 4): không ô nào còn đeo tên cây của hero khác.
- **Không hàng nào có hai ô trùng trục.**
- 15 `FusionEffectType` mới qua hai đợt, mỗi cái có ít nhất một ô nhận (bài học `RADIUS`).
- STUN RULE có **ba ngoại lệ có giá**, mỗi cái ghi rõ giá ngay trong `data/fusionRecipes.ts`.
- Kiểm chứng: `npm run typecheck` ✅ · `npm run build` ✅ · `roster.assert` ✅ ·
  `tutorial.assert` (replay 7 màn) ✅ · rà i18n đủ 81 tên + 81 mô tả ✅ · 23 ca logic chạy
  trực tiếp qua `planSkillActions` / `processTurn` / `calculateDamage` / `buildHeroFromSnapshot`
  trong trình duyệt ✅

---

## 9 · Đánh giá cân bằng (đo, không đoán)

Mọi con số dưới đây lấy từ code đang chạy, không phải ước lượng. Mục này viết ở vòng rà cân
bằng; **§9.3 và §9.4 đã được xử lý ngay trong cùng đợt** — phần "trước/sau" giữ lại vì lý do
của con số mới nằm ở chỗ con số cũ sai thế nào.

### 9.1 · Con số quyết định tất cả: `FUSION_SLOTS = 2`

Mỗi hero chỉ chọn **2 trong 9 ô**. Nghĩa là ma trận không phải "81 lựa chọn" mà là **9 cuộc
thi 2-suất, chạy song song**. Hệ quả trực tiếp: ô *always-on* gần như luôn thắng ô có điều kiện.

| Loại | Số ô | Nghĩa |
|---|---|---|
| Luôn có tác dụng | 63 | máu, giáp, tốc độ, rider trên đòn đánh, phản đòn |
| Cần **kết liễu** mới trả | 9 | `SHIELD_ON_KILL` ×6 · `SUN_ON_KILL` ×3 |
| Một lần mỗi trận | 2 | *Dawn Shell* · *Bunker Plating* |
| **Phụ thuộc ĐỘI HÌNH** | 2 | *Overwatch Pea* · *Overwatch Cob* — chết nếu đội không có ai đẩy |

Chỉ 2/81 ô phụ thuộc người khác. Đó là mức biến thiên lành mạnh: đủ để có một "build xoay
quanh" mà không biến ma trận thành xổ số.

### 9.2 · Độ đa dạng từng cột (số hiệu ứng khác nhau trên 9 ô)

| Cột | Distinct | Ghi chú |
|---|---|---|
| Corn Mortar | **8/9** | cột giàu nhất — mỗi hero nhận một thứ khác hẳn |
| Steel Jaws · Spring Arm | 6/9 | tốt |
| Sol Battery | 5/9 | 5 "thêm Sol" + 3 "rẻ kỹ năng" + 1 chữ ký — đúng khung (L1) |
| Seed Gun · Armor Plate · Bunker Shell | 4/9 | chấp nhận được, đều theo trục rõ |
| **Rotor Wing** | 3/9 | `MOVE_BONUS`×5 · `SKILL_DISARM`×2 · `SMOKE_ON_HIT`×2 — **đã sửa**, trước là 2/9 với `MOVE_BONUS`×7 |
| Spike Armor | 3/9 | `RETALIATE_DAMAGE`×5 · `TAUNT_ON_HIT`×3 · `RETALIATE_PUSH`×1 |

Rotor Wing từng là chỗ duy nhất một hiệu ứng chiếm 7/9 ô. Món B của cột (bụi) giờ đã xuống tới
**hai hero tầm xa** — Snapmaw theo luật riêng của hàng cô (mọi ô phải đánh vào cửa sổ tiêu hoá)
và Cornova theo luật của cột. Ba hero move-2 còn nhu cầu chân thật (Sunbloom hộ tống, Ironhusk
tới kịp hành lang, Thornshell "move 2 tóm chẳng ai") vẫn giữ `MOVE_BONUS`, và Reedwing giữ vì
đó là ô chữ ký — cô **đã có** bụi trong kit, cho thêm là thừa.

Spike Armor 3/9 là mức chấp nhận được chứ không phải lỗi: `RETALIATE_DAMAGE` và `TAUNT_ON_HIT`
là đúng hai món của gear, chia theo cận chiến / tầm xa.

### 9.3 · Ba chỗ mạnh nhất — và cái mạnh nhất đã bị hạ

**1. Gourdward = *Sunlit Rind* + *Stun Shell*. ĐÃ NERF.** Vì `FUSION_SLOTS = 2`, đúng hai ô này
LÀ một build hoàn chỉnh, và nó mua "bọc giáp cả đội + ghim mọi thứ đứng kề" với giá rẻ nhất
bảng. Hạ bằng **hai đòn bẩy cùng lúc**, vì một mình cái nào cũng không đủ:

| | Trước | Sau |
|---|---|---|
| Giá Encase | 50 | **60** |
| Discount ô Sunlit Rind | 15 | **10** |
| Giá thật mỗi lần cast | 35 | **50** |
| Số lần cast / trận 6 lượt (200 Sol) | 5 | **4** |
| Không cắm ô discount | 4 | **3** |

Encase là hiệu ứng trả phí **rộng nhất** game (bản thân + cả vành dấu cộng, mọi lần), nên phanh
đặt ở GIÁ chứ không ở độ rộng — độ rộng chính là hero. Hai ô discount còn lại **giữ nguyên 15**:
kỹ năng của Cornova và Thornshell chỉ chạm một mục tiêu, chúng chưa bao giờ là vấn đề.

**2. Peaburst = *Fanged Blessing* nhân ba. ĐÃ CAP.** `VOLLEY` nhân sát thương mỗi phát với số
phát, nên một cú +1 dành cho đòn đơn tới nơi thành +3 — và các buff cộng dồn: Heavier Peas (+1)
cộng Ơn Trên (+2) đưa Phát Bắn Chuẩn Xác từ 6 lên **12** trong một cú click. Giờ **mỗi phát của
một loạt bắn đúng con số thẻ in ra**, không gì nâng được:

| | Trước | Sau |
|---|---|---|
| Trần | 3 × 2 = 6 | 3 × 2 = 6 |
| + Ơn Trên (+2) | 3 × 4 = **12** | 3 × 2 = 6 |
| + `BONUS_DAMAGE` | 3 × 3 = 9 | 3 × 2 = 6 |
| Đòn thường Pea Shot (không cap) | 2 → 4 | 2 → **4** |

Cap nằm ở **PHÁT**, không ở tổng — thứ kỹ năng tồn tại để làm (ba phát không bao giờ phí viên
nào) không hề đụng tới. Và buff không chết: chúng dồn hết vào đòn thường của cô.
**Lối thoát bằng relic** (chưa dựng): cap được thiết kế để một relic hậu kỳ gỡ ra — "mạnh, có
ràng buộc" thay vì "mạnh". Khi relic tồn tại, chỗ gỡ là **một mệnh đề nữa trên đúng cái `if`
đó** trong `utils/fusion.ts`, không file nào khác động. Hôm nay **không khai sẵn cờ/type/field
nào** cho nó — codebase này đã bị đốt một lần vì từ vựng khai rồi bỏ mặc (`RADIUS`).

**3. Snapmaw = *Stun Fang*. GIỮ NGUYÊN.** Luật "một lần mỗi thân, vĩnh viễn" nghe chặt, nhưng
zombie mới liên tục đi vào bàn, nên thực chiến nó là "ghim con nào mới tới". Vẫn công bằng —
cận chiến, phải bước tới tận nơi — nhưng đừng nhầm rằng điều kiện đó siết nhiều.

### 9.4 · Reedwing vs giáp mũ

**Đòn thường Reedwing gây ĐÚNG 0 sát thương lên ba loại zombie.** Giáp mũ (`Unit.armor`) trừ
thẳng vào **từng nguồn sát thương một** và được phép về 0. Ở mức 1 sát thương mỗi ô, cô vô hiệu
hoàn toàn trước **Pothelm / Doorbearer / Linebreaker** (giáp 1) — trước khi hạ 2→1 thì còn ăn 1.

**Hướng đang làm (người chơi chốt): nếu chỉ có MỘT địch trong tầm thì phát bắn được 2 sát
thương.** Tức là bắn tập trung ăn 2, chia hai ô thì 1 mỗi bên — hình phạt/phần thưởng nằm ở
chính bài toán đội hình mà hero này tồn tại để giải. Lỗ giáp mũ đóng được ở ca tập trung
(2 − 1 = 1); ca chia hai ô vẫn 0 mỗi bên, và **đó là lựa chọn của người chơi chứ không còn là
điều bàn cờ áp lên**. Ghi lại để lần rà sau không tưởng đã hết.

### 9.5 · Hai luật nên viết ra trước khi ai đó phá

- **`SKILL_DISCOUNT` không được rơi xuống Ironhusk.** Kỹ năng cô giá 35 (rẻ nhất roster). Giảm
  15 là **−43%**: ngân sách 200 Sol nhảy từ 5 lần cast lên 10. Ba ô discount hiện tại nằm trên
  kỹ năng giá 50 (−30%) và 60 (−17%).
- **Không thêm ô nào cộng thẳng sát thương cho ba hero 0-damage** (Sunbloom, Chardslam,
  Gourdward). `BONUS_DAMAGE` đã *map chứ không append* nên engine tự chặn, nhưng luật cần nằm
  ở đây chứ không chỉ trong một comment.

### 9.6 · Kết luận

Sau vòng này: hai chỗ mạnh nhất đã hạ bằng số đo được, cột phẳng nhất đã có món B, và ô duy
nhất còn treo (Reedwing) đang được sửa ở phía kit chứ không phải phía fusion. **Không ô chết,
không ô hiển nhiên phải chọn.** Việc còn lại đáng theo dõi khi chơi thật: *Stun Fang* của
Snapmaw (§9.3), và liệu 4 lần cast Encase mỗi trận có còn quá nhiều không.
