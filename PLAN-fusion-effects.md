# TỪ ĐIỂN 81 Ô FUSION — định nghĩa đầy đủ sau pass unique

> File này là bản **chi tiết** của `PLAN-fusion-unique.md` §F. §F là bảng tra nhanh (tên + type +
> giữ/đổi); file này định nghĩa **từng ô làm gì**, kích khi nào, ca biên ra sao, móc vào đâu.
>
> Đọc ký hiệu:
> - **GIỮ** — ô không đụng trong pass này. Định nghĩa lấy từ `DESIGN-fusion-matrix.md` §3, viết lại cho dễ đọc.
> - **ĐỔI** — ô viết mới. Có đủ *Trigger / Hiệu ứng / Ca biên / Luật / Wiring*.
> - **⚠ RỖNG** — engine không đọc type này. Ghi rõ **thẻ bài đang hứa gì** và **thực tế xảy ra gì** ([A7]).

---

## Ba khái niệm nền — đọc trước, vì 30 ô dưới đây dựa vào

**LAYER (lớp chắn).** Không phải thanh máu phụ. Một layer chặn **trọn vẹn một nguồn sát thương** —
bất kể nguồn đó 1 hay 9 damage — rồi **vỡ**. Không có số, không cộng dồn: đã có layer thì cấp thêm
không được gì. Đây là lý do các ô "khi layer vỡ" là một họ cơ chế riêng.

**BLEED (vết thương hở).** Đánh dấu lên thân địch. **Đòn TIẾP THEO** vào thân đó +1 damage, rồi dấu
tiêu. Cộng **sau** giáp mũ (nên Đội Xô không nuốt được), xuyên miễn nhiễm STATUS (**trùm vẫn chảy
máu**), không cộng dồn.

**VA CHẠM (collision).** Khi một thân bị đẩy/kéo/ném đâm vào thân khác hoặc vật cản, nó dừng lại và
**cả hai bên** ăn damage va chạm. Đây là động từ trung tâm của Chardslam và là điểm móc của 4 ô mới.

---

# F1 · MAT_SUNBLOOM (Sol Battery)

**Danh từ cột:** *hồi này hero được bấm kỹ năng bao nhiêu lần*. Cả 9 ô bán đúng thứ đó, chỉ khác
cách trả tiền: **nhánh A** = cho thêm Sol · **nhánh B** = làm kỹ năng rẻ đi.

### Twin Sol Battery — Sunbloom — `SUN_PER_TURN` 50 — GIỮ · SIG
Mỗi lượt tự sinh 50 Sol, **không tốn action**. Điều kiện duy nhất: lượt đó cô **không di chuyển**
(`turnManager.ts:639`). Bị địch ĐẨY thì không tính là di chuyển — cô vẫn nhận tiền.

### Sunbeam Pea — Peaburst — `SUN_ON_KILL` 10 — GIỮ · bản gốc nhánh A
Mỗi lần cô kết liễu một thân: +10 Sol. Mọi kiểu kill đều trả như nhau.

### Sunlit Gut — Snapmaw — `SUN_WHILE_DIGESTING` 10 — GIỮ
+10 Sol mỗi lượt, **chỉ trong 2 lượt anh đang nhai**. Cửa sổ bất lực chính là cái đồng hồ tính tiền.

### Sunstone Shield — Ironhusk — `SUN_ON_BLOCK_SPAWN` 20 — GIỮ
+20 Sol mỗi lượt cô đứng bịt một lỗ spawn. Trả tiền cho việc đứng đúng chỗ và ăn đòn.

### Sunlit Cob — Cornova — `SKILL_DISCOUNT` 15 — GIỮ · bản gốc nhánh B
Nova Shell rẻ đi 15 Sol mỗi lần cast. (Luật §9.5: discount **không được** rơi xuống Ironhusk — kỹ
năng cô giá 35, giảm 15 là −43%.)

### Solar Rotor — Reedwing — `SUN_ON_DOUBLE_KILL` 30 — ĐỔI [C5.1]
- **Trigger:** lượt nào cô kết liễu **≥2 thân**.
- **Hiệu ứng:** +30 Sol. **Một lần mỗi lượt** — giết 3 con vẫn 30.
- **Ca biên:** kill đơn trả **0**. Kill do Downwash đẩy vào tường cũng tính (vẫn là kill của cô).
- **Vì sao:** hai nòng bắn hai ô là chuyện chỉ mình cô làm được đều đặn. Trigger thuần identity.
- **Wiring:** đếm kill theo lượt tại site `SUN_ON_KILL` hiện có. **Vừa-Thấp.**

### Sunlit Thorn — Thornshell — `TAUNT_REFUND` 5 — ĐỔI [C5.3]
- **Trigger:** ngay khi cast Provoke xong.
- **Hiệu ứng:** hoàn **5 Sol cho MỖI enemy thực sự dính taunt**.
- **Ca biên:** cast vào 3 con = hoàn 15 (bằng discount cũ). Cast vào 5 con nhờ Bellowing Thorn = hoàn 25.
  **Cast trượt, không dính con nào = trả đủ giá, hoàn 0.**
- **Vì sao:** vẫn bán "số lần cast", nhưng giá theo **chất lượng** cast. Thưởng kỹ năng đặt Provoke.
- **Wiring:** đếm target dính taunt lúc resolve skill, hoàn tại chỗ. **Thấp.**

### Sunlit Chard — Chardslam — `SUN_ON_COLLISION_KILL` 20 — ĐỔI [C5.2]
- **Trigger:** một thân chết mà **nguyên nhân là va chạm / nước / hố do anh gây ra**.
- **Hiệu ứng:** +20 Sol.
- **Ca biên:** thân chết vì lý do khác (bleed tiêu, hazard cháy sẵn) → **0**. Đây là siết so với bản
  cũ (`SUN_ON_KILL 15` trả cho mọi kill) — đổi lại nâng 15→20 vì điều kiện hẹp.
- **Vì sao:** desc đã hứa đúng điều này từ đầu ("every zombie he shoves into water, rock or another
  body pays"). Ô này bắt engine giữ lời.
- **Wiring:** `planPush` đã trả sẵn danh sách `drowned`/`collided`; chỉ thêm phân loại nguyên nhân tại site trả tiền. **Thấp-Vừa.**

### Sunlit Rind — Gourdward — `SHIELD_REFUND` 10 — ĐỔI [C5.4]
- **Trigger:** một layer **do anh phát ra** bị **đập vỡ**.
- **Hiệu ứng:** hoàn 10 Sol.
- **Ca biên:** layer phát ra mà **không ai đánh vỡ** (hết trận, hoặc người mang chết) → **0**. Khiên
  phải LÀM VIỆC mới được trả.
- **Wiring:** móc vỡ-layer `turnManager.ts:836` + stamp "ai phát" theo đúng mẫu `shieldBarbed`. **Vừa.**

---

# F2 · MAT_PEABURST (Seed Gun)

**Danh từ cột:** *khẩu súng — đòn bắn làm được gì.*

### Gunbloom — Sunbloom — `GRANT_ATTACK` — GIỮ
Trao một đòn bắn miễn phí cho hero vốn **không có đòn đánh nào**. Cửa duy nhất để Sunbloom tự gây damage.

### Repeater — Peaburst — `DOUBLE_ATTACK` 1 — GIỮ · SIG
Đòn thường bắn thêm loạt thứ hai, 1 damage. Loạt thừa lăn sang thân kế tiếp nếu mục tiêu chết.

### Rending Claws — Snapmaw — `DIGEST_CLAW` — GIỮ
Trao **móng vuốt cận chiến 1 damage dùng được trong lúc đang tiêu hoá** — cửa duy nhất mở qua cửa sổ bất lực.

### Lance Bash — Ironhusk — `ATTACK_RANGE_BONUS` 1 — GIỮ · bản gốc
Plate Slam với tới xa thêm 1 ô. Vẫn giữ nguyên cú đẩy.

### Split Shell — Cornova — `SPLIT_SHOT` 1 — ĐỔI [C6.1]
- **Trigger:** mỗi đòn thường của cô.
- **Hiệu ứng:** viên phụ rơi xuống **ô ngay SAU mục tiêu theo trục bắn**, gây 1 damage.
- **Ca biên (chốt zero-random):** ô phụ **CỐ ĐỊNH theo hình học**, không dò tìm enemy, không ưu tiên,
  không đổi theo bàn cờ. Ô đó trống → không có gì xảy ra. Ô đó có **ally** → ally **an toàn**, viên
  phụ không nổ. Overlay tô **cả hai ô** trước khi bấm.
- **Vì sao:** mini-splash trên đòn **thường** — em họ yếu của `SKILL_SPLASH` (vốn chỉ có trên kỹ năng
  trả phí), 1 damage 1 ô, nên không phá ranh giới "free splash mỗi lượt".
- **Wiring:** attack resolution, chọn ô phụ deterministic. **Vừa.**

### *(tên chờ)* — Reedwing — `EXTENDED_BARRELS` — ĐỔI [C6.2] · ⚠ NỢ SƠ ĐỒ
- **Ý định:** mỗi nòng bắn dài thêm 1 ô, mỗi bên thành 2 ô — tổng 4 ô, 2 ô mới ăn 1 damage.
- **Vấn đề chưa giải:** đòn của cô là `rangeType: 'WING_PAIR'`, **8 ô knight** (`heroes.ts:282`),
  không phải hàng dọc. "Kéo dài thêm 1 ô" trên ô knight **không có nghĩa hiển nhiên** — phải định
  nghĩa trục. Tôi vẽ sơ đồ ô đưa bạn duyệt **trước khi** code.
- **Vì sao ô này tồn tại:** bản `FOCUS_BARRELS` (gộp hai nòng vào một mục tiêu) đã bị bạn loại vì đè
  relic độc quyền. Đây là hướng thay thế: đổi độ đầm lấy độ **phủ**.
- **Luật:** không đụng VOLLEY CAP (không nhân theo shot count).

### Piercing Needles — Thornshell — `LASER_NEEDLE` 2 — ⚠ RỖNG [A7]
- **Thẻ hứa:** gai bắn xuyên thành tia.
- **Thực tế:** `LASER_NEEDLE` chỉ tồn tại ở `types.ts` + `fusionRecipes.ts`. **Không dòng engine nào đọc. Mua xong không có gì xảy ra.**

### Roundhouse Chard — Chardslam — `PLUS_ROTATE` — ĐỔI [C6.3]
- **Trigger:** người chơi chọn action này. **THAY THẾ** Vault Toss lượt đó — không được làm cả hai.
- **Hiệu ứng:** 4 unit đứng trên 4 ô kề trực giao (Bắc/Đông/Nam/Tây) **xoay 45° sang ô chéo** theo
  chiều người chơi chọn (thuận / ngược kim đồng hồ). Dấu cộng thành chữ X.
- **Ca biên:** ô đích bị chiếm hoặc không hợp lệ → **unit đó đứng yên**, các unit khác vẫn xoay. Xoay
  là **DI CHUYỂN sạch, không phải đẩy** → **không có damage va chạm**. Unit miễn `PUSH` (trùm massive)
  **không xoay**. Xoay được **cả ally lẫn enemy**.
- **Vì sao:** judo thuần, displacement thuần, 0 damage — đúng chất hero. Đây là ô "ít súng nhất" của
  cột Seed Gun, chấp nhận được vì hàng Chardslam vốn là ngoại lệ của mọi cột.
- **Wiring:** action mới + UI chọn chiều (2 nút, theo tiền lệ granted-skill `DIGEST_CLAW`) + resolve
  4 thân đồng thời. **CAO — nặng nhất danh sách, làm riêng một đợt.**

### Rind Pellet — Gourdward — `SHIELD_SHOT` — ĐỔI [C6.4]
- **Trigger:** cast Reinforce.
- **Hiệu ứng:** đổi Reinforce từ `MELEE 1` thành **LINE 4** — viên khiên bay dọc hàng, đậu vào unit
  **ĐẦU TIÊN** trên đường.
- **Ca biên (bản phạt bạn chốt):** unit đầu tiên nhận layer **BẤT KỂ PHE**. Là ally/Greenspire → cứu
  đúng người. Là **ENEMY chắn hàng → bạn vừa bọc giáp cho zombie**, đội nhà phải đập vỡ lớp đó trước.
- **Vì sao:** khẩu súng đúng nghĩa — bắn khiên như bắn đạn, có thể tắc nòng. Phạt sai tầm nhìn, zero random.
- **Việc kỹ thuật phải kiểm lúc code:** layer trên thân ĐỊCH — `shield` là field generic trên `Unit`
  nên đường damage sẵn có, nhưng phải rà chỗ nào đang **ngầm coi shield là của-ally** (badge UI, AI
  intent tính damage). **Vừa.**

---

# F3 · MAT_SNAPMAW (Steel Jaws)

**Danh từ cột:** *vết cắn / vết thương hở.*

### Fanged Blessing — Sunbloom — `BLESS_POWER` 1 — GIỮ
Ơn Trên Sol (buff cô ban cho ally) đáng thêm +1 damage. Con số đóng dấu lên **thân được ban**, vì lúc
người đó vung đòn thì cô đã ngoài tầm.

### Serrated Pea — Peaburst — `BLEED_ON_HIT` — GIỮ · bản gốc
Đạn để lại vết bleed (xem định nghĩa BLEED ở đầu file).

### Double Jaw — Snapmaw — `DIGEST_REDUCTION` 1 — GIỮ · SIG
Tiêu hoá **1 lượt thay vì 2**. Cắt đôi cửa sổ bất lực — ô đắt giá nhất hàng anh.

### Fanged Bash — Ironhusk — `BONUS_DAMAGE` 1 — GIỮ
+1 vào mọi effect DAMAGE. **Map chứ không append** (L7) — hero 0 damage không bị gear bơm số từ bên hông.

### Shrapnel Kernel — Cornova — `SKILL_BLEED_SPLASH` — ĐỔI [C2.1]
- **Trigger:** cast Nova Shell (kỹ năng **trả phí**).
- **Hiệu ứng:** 4 ô quanh mục tiêu dính **BLEED** — **không phải damage**.
- **Ca biên:** khác `SKILL_SPLASH` (ô SIG của chính cô, gây damage + stun mềm) nên **không trùng hàng**.
  Khác Serrated Pea (bleed một mục tiêu) vì đây là **cả vòng**.
- **Vì sao:** "nổ văng miếng" theo đúng góp ý của bạn, nhưng dịch sang danh từ cột chomper (vết thương)
  thay vì damage.
- **Combo có chủ đích:** fuse cả corn + chomper → một phát Nova Shell = vòng stun/slow + vòng bleed.
- **Wiring:** rider trên skill trả phí. **Vừa-Thấp.**

### Executioner Pods — Reedwing — `BLEED_EXECUTION` 2 — ⚠ RỖNG [A7]
- **Thẻ hứa:** *"Wing guns deal +2 bonus damage (3 damage total) against targets currently suffering from Bleeding."*
- **Thực tế:** engine **không đọc** type này. Mua xong không có gì xảy ra.
- **Khi wire phải quyết một luật chưa có:** đòn của cô là `WING_PAIR` — **basic attack, KHÔNG nằm dưới
  VOLLEY CAP** (cap chỉ chặn skill có effect `VOLLEY`, `fusion.ts:488`). Nên "+2 mỗi ô" × 5 ô = **15
  damage**. Muốn ra **7** (5 + 2, như bạn tính) thì phải viết "+2 **một lần mỗi đòn**" — tức một cap thứ hai.

### Rending Husk — Thornshell — `RETALIATE_BLEED` — GIỮ
Kẻ đánh anh **bằng cận chiến** bị chảy máu. Đánh dấu cho người khác kết liễu.

### Rending Chard — Chardslam — `BLEED_ON_SHOVE` — ĐỔI [C2.2]
- **Trigger:** một enemy nhận **damage VA CHẠM** từ cú đẩy / kéo / ném của anh.
- **Hiệu ứng:** enemy đó dính BLEED.
- **Ca biên:** ném 2 con vào nhau → **cả hai** −1 máu (va chạm sẵn có) + **cả hai** bleed. Ném ra ô
  trống, không va chạm gì → **không bleed** (chặt hơn bản cũ — "đập vào mới toác").
- **Vì sao:** bản cũ dùng `BLEED_ON_HIT` và engine phải đặc-cách anh qua `hasDamage || hasShove`
  (`fusion.ts:380`) — một special-case tồn tại chỉ vì type chưa nói thật. Type mới nói thật, và
  `BLEED_ON_HIT` thu về gate `hasDamage` thuần → **code gọn đi**.
- **Wiring:** site va chạm (cùng cụm với Blast Chard). **Thấp.**

### Glass Rind — Gourdward — `BARBED_SHIELD` — GIỮ
**Lớp chắn anh trao ra là thuỷ tinh nhọn**: kẻ **đập vỡ** nó bị chảy máu. Cờ nằm trên *lớp*
(`Unit.shieldBarbed`), viết cùng lúc với lớp, chết cùng lớp. Chỉ tính cận chiến.

---

# F4 · MAT_IRONHUSK (Armor Plate)

**Danh từ cột (MỚI):** *tấm giáp — sống qua đòn.* **Không dây vào khiên** — layer là danh từ độc quyền
của cột Bunker Shell. Luật melee/ranged nhị phân cũ (L5) khai tử tại đây.

### Guarded Bloom — Sunbloom — `ESCORTED_REDUCTION` — ĐỔI [C8.v2]
- **Trigger:** thường trực, kiểm lúc cô nhận damage.
- **Hiệu ứng:** nếu **kề ≥1 ally** → mọi đòn nhận vào **−1**.
- **Ca biên:** không bao giờ đưa một đòn xuống dưới 1 (luật chung của giảm-damage fusion).
- **Vì sao:** thay `START_SHIELDED` cũ — ô đó trùng nguyên type với Dawn Pod Plating của Reedwing và
  lấn danh từ cột khiên. Bản mới: được hộ tống đúng cách = cứng. Ăn rơ với Sunchaser mà không trùng type.

### Armored Pea — Peaburst — `BONUS_HP` 2 — GIỮ
+2 máu tối đa (và máu hiện tại lúc fuse). Sống qua F5 nhờ `migrateHeroHp`.

### Armored Jaws — Snapmaw — `ARMOR_WHILE_DIGESTING` 1 — GIỮ
−1 damage **chỉ khi đang tiêu hoá** — mọi đòn trong cửa sổ, không phải riêng cú đầu.

### Iron Bulwark — Ironhusk — `STEADFAST` 1 — GIỮ · SIG
Gói **ba-trong-một** của tường: −1 damage · **miễn 100%** damage va chạm · bịt lỗ spawn không mất máu.
Sau [C8.1] đây là ô **duy nhất** có đủ cả ba.

### Dug-in Cob — Cornova — `EMPLACED_PLATING` — ĐỔI [C8.v3-(iii)]
- **Trigger:** lượt nào cô **KHÔNG di chuyển**.
- **Hiệu ứng:** mọi đòn nhận vào **−1** trong lượt địch kế tiếp.
- **Ca biên:** **bị ĐẨY không tính là di chuyển** — cô vẫn giữ giáp (cùng luật với `SUN_PER_TURN`,
  `turnManager.ts:633`). Điều kiện đọc `target.hasMoved`, nằm trong tay người chơi, zero RNG.
- **Vì sao:** hạ chân chống — thưởng đúng nghề pháo. Thay bản `FLANK_PLATING` (−1 từ enemy kề) vì
  ~92% đòn trên bàn là cận chiến → bản đó giá trị thực **gần bằng hệt** `DAMAGE_REDUCTION` phẳng của
  Gourdward, tức unique-giả.

### Airframe — Reedwing — `SLIPSTREAM_PLATING` — ĐỔI [C8.v3-(iii)]
- **Trigger:** lượt nào cô **CÓ di chuyển**.
- **Hiệu ứng:** mọi đòn nhận vào **−1**.
- **Ca biên:** đứng im là ăn đủ. Nửa đối xứng hoàn hảo của Dug-in Cob, dùng **cùng một** predicate.
- **Vì sao:** ý ban đầu của bạn là "giảm damage tầm xa, cận chiến vẫn bị" — nhưng roster chỉ có
  **1/12 zombie thường** bắn xa (Lobber) nên ô đó ngủ đông gần hết run. Bản này giữ tinh thần "máy bay
  không bao giờ đứng yên", nhưng điều kiện nằm ở **người chơi** thay vì ở roster địch.
- **Wiring (cho cả cặp):** đọc `target.hasMoved` ngay tại `gameLogic.ts:403`, cạnh `DAMAGE_REDUCTION`.
  **0 thay đổi chữ ký** — trong khi lọc melee/ranged sẽ phải bơm attacker qua **21 nơi gọi**.

### Thorn Lunge — Thornshell — `THORN_LUNGE` 1 — ⚠ RỖNG [A7]
- **Thẻ hứa:** *"Basic attack transforms into a 1-tile lunge charge towards the target."*
- **Thực tế:** engine không đọc. Đòn thường của anh không lướt gì cả.

### Unstoppable Chard — Chardslam — `COLLISION_PLATING` — ĐỔI [C8.1]
- **Hiệu ứng (ba vế):** ① miễn **100%** damage va chạm · ② bịt hố spawn **không mất máu** ·
  ③ **miễn mọi dịch chuyển cưỡng bức** — `PUSH` / `PULL` / `TOSS` không xê dịch được anh.
- **KHÔNG có** vế −1 damage/hit. Đó là điểm khác `STEADFAST`: Iron Bulwark giữ vị thế bản-đầy-đủ độc quyền.
- **Ca biên có chủ đích:** trùm chuyên đẩy-hero **mất bài** với anh — feature, không phải bug. Anh
  đứng bịt hố thì không gì cạy ra được.
- **Vì sao:** "bất động minh vương" theo góp ý của bạn — người ném thì không ai ném được.
- **Wiring:** check fusion ngay trong `planPush`, cạnh `immunities.includes('PUSH')`. **Không ghi vào
  body** để khỏi phải migrate save. **Thấp.**

### Ironrind — Gourdward — `DAMAGE_REDUCTION` 1 — GIỮ · bản phẳng
Mỗi đòn nhận vào −1, **không bao giờ xuống dưới 1**. Không điều kiện gì cả — đây là bản chuẩn để so
ba ô có-điều-kiện ở trên.

---

# F5 · MAT_CORNOVA (Corn Mortar)

**Danh từ cột:** *phát nổ / chấn động.*

### Solar Corona — Sunbloom — `SKILL_AURA` — GIỮ
Kỹ năng **buff đồng minh** phủ mọi ally trong bán kính 2 ô (hình thoi 12 ô). Chặn cứng: chỉ kỹ năng
phí, và chỉ kỹ năng **không có DAMAGE** — nếu không thì đây là sát thương diện rộng đi cửa sau.

### Mortar Pea — Peaburst — `ARC_ATTACK` — GIỮ
Đòn thẳng thành cầu vồng: bay qua vật cản, tầm giảm nửa. Không áp lên skill xuyên.

### Stun Fang — Snapmaw — `STUN_ON_FULL_HP` — GIỮ · ngoại lệ STUN RULE #3
Ghim thân **còn nguyên máu** → đúng **một lần cho mỗi con zombie, vĩnh viễn**. Cắn lần hai gặp thân
đã thương thì không có gì.

### Stun Charge — Ironhusk — `SKILL_STUN` — GIỮ · ngoại lệ STUN RULE #1
Ghim thứ mà **kỹ năng trả phí** đánh trúng. Một cú ghim mỗi lần cast, mua bằng Sol.

### Cob Howitzer — Cornova — `SKILL_SPLASH` — GIỮ · SIG
Nova Shell nổ lan 4 ô quanh mục tiêu, **vành ngoài nửa sức** (stun mềm thành chậm).

### Cluster Load — Reedwing — `WING_MIDSHOT` — GIỮ
Song Pháo Cánh bắn thêm **ô nằm giữa cặp** — cả 4 hướng, một tên lửa thứ ba.

### Bellowing Thorn — Thornshell — `TAUNT_RADIUS` 2 — GIỮ
Tiếng khiêu khích vươn xa thêm. (Cộng hưởng có chủ đích với Sunlit Thorn: taunt nhiều con hơn = hoàn nhiều Sol hơn.)

### Blast Chard — Chardslam — `COLLISION_SPLASH` — ĐỔI [C1.2]
- **Trigger:** cú đẩy/ném của anh gây **va chạm**.
- **Hiệu ứng:** mọi **ENEMY** đứng kề **trực giao** hai thân va chạm ăn **1 damage**. Hai thân va chạm
  không tính (chúng đã trả tiền va chạm rồi).
- **Ca biên — hình học chốt:**
  - **Thân → thân:** thân bị ném dừng ngay kề thân bị đâm. Hai ô kề trực giao **không có hàng xóm
    chung nào** → 3 + 3 = **luôn đúng 6 ô**.
  - **Thân → tường / đá / mép bàn:** chỉ MỘT thân trả tiền va chạm → vòng nổ **3 ô**. Tường không nổ.
  - **Thân → nước / hố:** không có va chạm → **không có nổ**. Nước nuốt gọn.
  - **Đếm trực giao, KHÔNG tính chéo** (tính chéo là 10 ô — quá tay cho hero 0 damage).
  - **Chỉ ENEMY dính.** Ally/Greenspire đứng trong vòng an toàn — ưu đãi có chủ đích vì anh phải xài
    được trong đội hình chật. (Cố ý khác `BLESS_SHOCKWAVE`, ô đó đẩy cả người nhà và đó là tính năng.)
- **Vì sao không phải "cả hai bên +1":** ý đó đụng đúng SIG của anh — Grand Chard (`COLLISION_BONUS`)
  đã cộng bonus cho **mọi** thân trong danh sách va chạm. Bản corn "cả hai +1" sẽ là bản-nhỏ-của-SIG
  ngay trong hàng. Vụ nổ văng **ra ngoài** cặp thì hai ô không giẫm chân nhau: hai thân do Grand Chard
  lo, đám đứng xem do Blast Chard lo.
- **Wiring:** cùng site với `COLLISION_BONUS` (`skillResolution.ts:268`). **Vừa.**

### Payback Shell — Gourdward — `SHIELD_BREAK_STUN` — ĐỔI [C1.1] · ngoại lệ STUN RULE #2
- **Trigger:** một layer do **Encase** tạo ra bị **đập vỡ** bằng đòn **cận chiến**.
- **Hiệu ứng:** kẻ đập vỡ bị **STUN** lượt kế. **Mỗi layer một lần.**
- **Ca biên:** melee-only, đồng bộ tiền lệ Glass Rind ("hòn đá ném từ xa làm vỡ kính mà không chạm vào nó").
- **Vì sao:** bản cũ (`SKILL_STUN`, stun ngay lúc cast) trùng implementation với Stun Charge của
  Ironhusk. Bản mới dời trigger từ **lúc bọc** sang **lúc vỡ** — vẫn là danh từ chấn-động của corn,
  nhưng gắn vào identity khiên.
- **Luật:** ngoại lệ STUN RULE **đắt hơn bản cũ**: 60 Sol + phải đứng giữa đám + stun đến **chậm một
  nhịp** và địch phải **tự đấm vỡ** mới dính.
- **Wiring:** móc vỡ-layer đã có sẵn `turnManager.ts:836`; stamp cờ lên body lúc phát khiên theo mẫu
  `shieldBarbed`. **Vừa.**

---

# F6 · MAT_REEDWING (Rotor Wing)

**Danh từ cột:** *cơ động / cánh quạt.*

### Sunchaser — Sunbloom — `CONVOY_AURA` — ĐỔI [C3.1]
- **Trigger:** **đầu lượt người chơi**, nếu cô đang kề ≥1 ally.
- **Hiệu ứng:** **cô VÀ mọi ally đang kề cô** được **+1 move** trong lượt này. Buff tạm, xoá cuối lượt.
- **Ca biên:** không kề ai → không có gì. Buff không cộng dồn qua lượt.
- **Vì sao:** "trạm sạc cấp điện cho đoàn xe". Giá tự cân: muốn ăn aura phải đứng dính chùm — đúng thứ
  mà AoE và tia lan điện trừng phạt.
- **Nút vặn đầu tiên nếu test thấy mạnh:** chỉ 1 ally gần nhất thay vì tất cả.
- **Wiring:** hook đầu lượt + move calc đọc buff tạm (tiền lệ conditional-move: `DIGEST_MOVE`). **Vừa-Cao.**

### Smokeline — Peaburst — `SKILL_DISARM` — GIỮ
Để lại **bụi** nơi thân thể **đáp xuống** (L6 — không phải nơi viên đạn bay qua). Thứ gì kết thúc lượt
trong bụi thì không vung nổi đòn.

### Prowl Rotor — Snapmaw — `DIGEST_MOVE` 1 — ⚠ RỖNG [A7]
- **Thẻ hứa:** vẫn di chuyển được trong lúc đang tiêu hoá.
- **Thực tế:** engine không đọc. Anh vẫn đứng chôn chân đủ 2 lượt.

### Overdrive Charge — Ironhusk — `DASH_DISTANCE` 1 — ⚠ RỖNG [A7]
- **Thẻ hứa:** Rolling Charge lao xa thêm 1 ô.
- **Thực tế:** engine không đọc.

### Ash Carriage — Cornova — `SMOKE_ON_HIT` — GIỮ
Thân bị cô **làm đau** đứng lại trong bụi: lượt sau không vung nổi đòn trừ khi nó bước ra khỏi đám mây.
**MỘT ô, MỘT lượt** — đó là toàn bộ lý do một đòn miễn phí được phép mang nó.

### Overdrive Rotor — Reedwing — `ATTACK_THEN_MOVE` — ĐỔI [C3.2] · SIG
- **Trigger:** ngay sau khi cô **tấn công**.
- **Hiệu ứng:** được bay thêm **1 ô miễn phí**. **Được phép bỏ qua.**
- **Ca biên:** vì diễn ra **SAU** khi attack đã commit nên **không đụng hệ hoàn-tác-move**.
- **Vì sao:** bạn chốt swap — Windburr của Thornshell giữ `MOVE_BONUS` phẳng, còn ô SIG của cô đổi
  thành hit & run. "Herself, turned up" càng đúng: doctrine gunship.
- **Bộ ba:** đây là mảnh 1 của identity hit & run — cùng Downwash (F8) và Barbed Skids (F7). Cả ba
  **chỉ tồn tại cùng lúc khi `FUSION_SLOTS = 3`**.
- **Wiring:** **CAO** — phá pattern "unit hành động xong là khoá"; cần bước move phụ sau attack.

### Windburr — Thornshell — `MOVE_BONUS` 1 — GIỮ
+1 ô di chuyển, ghi thẳng vào thân như STRIDE. Sau pass này là **bản +1 phẳng duy nhất** của cả cột.

### Catapult Rotor — Chardslam — `PUSH_DISTANCE` 1 — GIỮ
Mọi cú đẩy/kéo đi xa thêm 1 ô. **Không kéo giãn Vault Toss** — điểm rơi của cú ném là hình học cố định.
Desc phải **bỏ chữ "toss"** ([A4.1]) vì chữ đó là lời hứa suông. Sau [C1.2] đây là ô `PUSH_DISTANCE`
duy nhất của hàng anh → hết chuyện fuse hai ô thành +2.

### Rolling Rind — Gourdward — `ENCASE_RANGE` 1 — ⚠ RỖNG [A7]
- **Thẻ hứa:** cast Encase xa hơn 2 ô.
- **Thực tế:** engine không đọc. (Bản HTML còn kể một hiệu ứng thứ ba nữa — "Airborne Rind" — không
  khớp cả TS lẫn engine; [A3] sẽ xoá lệch này.)

---

# F7 · MAT_THORNSHELL (Spike Armor)

**Danh từ cột:** *chạm vào tôi / vào của tôi là trả giá.* **Mọi ô phản đòn chỉ tính CẬN CHIẾN** (L4).

### Thorned Bloom — Sunbloom — `BLESS_RETALIATE` — ⚠ RỖNG [A7]
- **Thẻ hứa:** ally được Ơn Trên Sol thì mang gai phản đòn.
- **Thực tế:** engine không đọc.

### Barbed Pea — Peaburst — `TAUNT_ON_HIT` — GIỮ · bản gốc
Thứ trúng đạn bị TAUNTED, chỉ về phía người bắn. Thân miễn nhiễm STATUS từ chối.

### Bristleback — Snapmaw — `DIGEST_RETALIATE` — ⚠ RỖNG [A7]
- **Thẻ hứa:** phản đòn trong lúc đang tiêu hoá.
- **Thực tế:** engine không đọc.

### Jamming Plate — Ironhusk — `RETALIATE_ROOT` — ĐỔI [C7.3]
- **Trigger:** một zombie **tấn công cô** trong lượt địch.
- **Hiệu ứng:** lượt kế tiếp nó **KHÔNG được di chuyển** — nhưng **vẫn được đánh**. Kẹt trên giáp, đứng
  lại mà đánh tiếp.
- **Ca biên:** trạng thái mới `ROOTED` (cấm move, cho attack). Khác STUN ở chỗ **không ai mất lượt**.
- **Luật:** STUN RULE ✓ đúng tinh thần — con zombie vẫn hành động, chỉ là hành động vào cô, mà ăn đòn
  là nghề của cô (Sunstone Shield còn trả tiền cho việc đó).
- **Vì sao:** taunt vật lý theo đúng chữ bạn viết. `RETALIATE_FREEZE` để yên cho ICE element (engine
  đang resolve type đó).
- **Wiring:** status `ROOTED` + `aiLogic` đọc nó (kẹt thì intent = đánh mục tiêu trong tầm). **Vừa.**

### Caltrop Cob — Cornova — `SKILL_SPIKE_SCATTER` — ĐỔI [C7.1]
- **Trigger:** cast Nova Shell (kỹ năng **trả phí** — không bao giờ dính đòn miễn phí).
- **Hiệu ứng:** rải mảnh gai lên các ô **TRỐNG** kề mục tiêu (4 hướng).
- **Ca biên:** zombie dẫm vào → **2 damage**, mảnh **tan** (một lần dùng). Ô có unit đứng sẵn → không
  rải. Là bản **yếu** của item Cây Gai — cố ý.
- **Vì sao skill-only:** rải gai trên đòn free = bức tường miễn phí mỗi lượt, đúng thứ bị cấm (tiền lệ
  `SKILL_SPLASH` / `SMOKE_ON_HIT`).
- **Combo nội đội:** mọi cú đẩy của đội dúi zombie vào bãi gai của cô.
- **Wiring:** máy spike-field **đang sống** trong engine (`SPIKE_TILE`, item Spike Trap nuôi nó). **Vừa-Thấp.**

### Barbed Skids — Reedwing — `WIND_TAUNT` — ĐỔI [C7.2] · *tái dùng type đã khai (`types.ts:1092`), chưa wire*
- **Trigger:** cô **rời ô kề** một enemy **bằng di chuyển của chính mình** (không phải bị đẩy).
- **Hiệu ứng:** enemy đó bị **TAUNT khoá vào cô** đến hết lượt sau.
- **Vì sao:** desc cũ là một câu đùa ("nó ghét cô nhưng cô đã bay mất"); ô mới biến câu đùa thành cơ
  chế. Taunt sinh ra từ **cú cất cánh** — trigger thuần flight, không hero nào bắt chước được.
- **Bộ ba hit & run:** sà vào → bắn → free-move 1 ô (Overdrive Rotor) rời adjacency → `WIND_TAUNT` kích
  → cả đàn bám theo cô, **rời khỏi ally**. Thêm ICE element thì đàn đó vừa đuổi vừa lê chân.
- **Wiring:** móc rời-adjacency trong move resolution — **cùng vùng móc với Downwash**, làm chung một lần. **Vừa.**

### Bristling Armor — Thornshell — `RETALIATE_DAMAGE` (2→3) — GIỮ · SIG
Kẻ đánh anh bằng cận chiến ăn lại **3** damage. **Ngoại lệ duy nhất của L3** (sầu riêng ghép lên người
khác phản đúng 1; nội tại anh là 2, ô này nâng lên 3).

### Thorned Chard — Chardslam — `RETALIATE_PUSH` — GIỮ
Kẻ đánh vào bị **hất lùi một ô** — bản "đường thoát", hợp hero mỏng.

### Spined Rind — Gourdward — `SHIELD_RETALIATE` — ĐỔI [C7.4]
- **Trigger:** một ally **đang mang layer do Gourdward phát** bị đánh **cận chiến**.
- **Hiệu ứng:** kẻ đánh ăn lại **1** damage. Kéo dài chừng nào layer còn.
- **Ca biên:** **không** bao gồm đánh vào chính anh — muốn gai bản thân thì chọn hero khác; anh là hộ vệ.
- **Vì sao:** trả đòn **thay người được hộ** — trigger bảo-kê là danh từ riêng của anh. Nó vần với
  `BLESS_RETALIATE` của Sunbloom cùng cột (buff-mang-gai): hai support, hai vehicle (một qua blessing
  1 lượt, một qua layer bền), người chơi học một pattern dùng được hai nơi.
- **Luật:** RETALIATION RULE ✓ đúng 1. Melee-only đồng bộ Glass Rind.
- **Wiring:** cờ theo layer đúng mẫu `shieldBarbed` (`shieldSpined`, chết cùng layer). **Vừa-Thấp.**

---

# F8 · MAT_CHARDSLAM (Spring Arm)

**Danh từ cột:** *lực bật / xung lực.*

### Kinetic Bloom — Sunbloom — `BLESS_SHOCKWAVE` — GIỮ
Lời ban phước giáng xuống như sóng chấn: **mọi thứ** kề thân được ban bị đẩy ra xa một ô — địch, ally,
và cả cô nếu đứng sát. **Đẩy người nhà là tính năng**: tia sét lan giữa các thân kề nhau, nên đây là ô
làm cả đội thôi đứng thành hàng.

### Overwatch Pea — Peaburst — `OVERWATCH_SHOT` — GIỮ · bản gốc
**Ô duy nhất trong ma trận nổ theo hành động của người khác**: địch nào bị **cả đội** đẩy đi mà nằm
trong tầm bắn đều ăn một viên 1 damage, không tốn lượt của xạ thủ. Bắn bằng **đúng khẩu súng người đó
đang cầm**. **Chỉ nổ trong lượt của phe mình** (§7).

### Anchored Gullet — Snapmaw — `DIGEST_STEADFAST` — ⚠ RỖNG [A7]
- **Thẻ hứa:** không bị đẩy trong lúc đang tiêu hoá.
- **Thực tế:** engine không đọc.

### Sprung Bash — Ironhusk — `PUSH_DISTANCE` 1 — GIỮ
Mọi cú đẩy/kéo của cô đi xa thêm 1 ô.

### Recoil Cob — Cornova — `ON_HIT_PULL` — ĐỔI [C4.1]
- **Trigger:** mỗi đòn thường của cô trúng đích.
- **Hiệu ứng:** **KÉO** mục tiêu **1 ô về phía cô**. Lò xo hoạt động hai chiều.
- **Ca biên:** đi qua đúng `planPush` như mọi cú đẩy → **va chạm vẫn tính damage** như thường.
- **Vì sao:** displacement **chiều ngược** — độc nhất toàn ma trận, chưa ô nào pull trên đòn thường.
  Chiến thuật: giật zombie ra khỏi mặt ally, kéo vào vùng Nova Shell, kéo mồi vào hazard phía trước nó.
- **Combo bạn chỉ ra, chạy thật không cần code thêm:** Cornova kéo zombie vào hàng ngắm → Overwatch Pea
  của Peaburst nổ (vì `OVERWATCH_SHOT` kích theo "cú shove của đội", và PULL đi qua đúng `planPush`).
- **Wiring:** thêm 1 rider cạnh `ON_HIT_PUSH` (`fusion.ts:362`). **Thấp.**

### Downwash — Reedwing — `FLYER_REPEL` — ĐỔI [C4.2] · *tái dùng type đã khai (`types.ts:1094`), chưa wire*
- **Trigger:** cô **kết thúc di chuyển**. **1 lần/lượt.**
- **Hiệu ứng:** mọi enemy kề ô đáp bị **thổi lùi 1 ô** (gió ép của rotor).
- **Ca biên — giải quyết đúng lo ngại hoàn-tác của bạn:** mũi tên đẩy hiện **NGAY TRONG overlay chọn ô
  đáp** (như overlay skill). Xác nhận một nước đi **CÓ** Downwash = nước đi **khoá, không hoàn tác nữa**
  (đúng luật đã áp cho cast skill). Nước đi không chạm enemy nào thì hoàn tác như thường.
- **Kịch bản chữ V bạn mô tả, chạy đúng:** đáp cạnh đỉnh V → thổi con giữa lùi 1 → ba con thành hàng
  ngang → volley 2 nòng + Cluster Load (ô giữa) trúng cả 3.
- **Nút vặn nếu test thấy lố:** hạ xuống "chỉ đẩy enemy đứng cạnh ô đáp theo hướng ra xa cô".
- **Wiring:** móc cuối move của player. **Vừa.**

### Sprung Thorn — Thornshell — `ON_HIT_PUSH` 1 — GIỮ
Cú swipe hất mục tiêu lùi 1 ô. Bản melee push chuẩn.

### Grand Chard — Chardslam — `COLLISION_BONUS` 2 — GIỮ · SIG
Thân bị anh dúi vào vật cản chịu **thêm 2**. Engine cộng cho **mọi** thân trong danh sách va chạm
(`plan.collided` gồm cả hai bên), và cộng cả vào sát thương ngã của Vault Toss.

### Shockrind — Gourdward — `SKILL_REPEL` — GIỮ
Kỹ năng lớp chắn trả phí thổi bật mọi địch đứng kề lùi một ô.

---

# F9 · MAT_GOURDWARD (Bunker Shell)

**Danh từ cột:** *một layer khiên.* Đây là cột được khen "9/9 chuẩn mực" và cả công thức của pass này
rút ra từ nó — **nhưng chỉ 4/9 ô thực sự chạy.**

### Dawn Harvest — Sunbloom — `HARVEST_SHIELD` 15 — ⚠ RỖNG [A7]
- **Thẻ hứa:** Harvest tạo layer.
- **Thực tế:** engine không đọc.

### Precision Shield — Peaburst — `SHIELD_ON_SKILL_KILL` 1 — ⚠ RỖNG [A7]
- **Thẻ hứa:** kill bằng Precision Blast thì dựng layer.
- **Thực tế:** engine không đọc.

### Warded Gut — Snapmaw — `SHIELD_ON_DIGEST` 1 — ⚠ RỖNG [A7]
- **Thẻ hứa:** bắt đầu tiêu hoá thì có layer.
- **Thực tế:** engine không đọc.

### Bunker Plating — Ironhusk — `LAST_STAND_SHIELD` — GIỮ · CHẠY
**Mỗi trận một lần**: cú đánh đáng lẽ kết liễu lại dựng lên một layer, và layer đó **nuốt trọn cú đó**.
Cố ý KHÔNG phải `SHIELD_ON_KILL` — với một tanker thì lớp sẽ bật lại liên tục, tức là giáp đội lốt lớp
chắn. Cờ `Unit.lastStandUsed` reset trong `unitFactory` **mỗi trận**.

### Reactive Cob Shell — Cornova — `REACTIVE_SHIELD` — ⚠ RỖNG [A7]
- **Thẻ hứa:** ăn đòn đầu tiên thì bật layer.
- **Thực tế:** engine không đọc.

### Dawn Pod Plating — Reedwing — `START_SHIELDED` — GIỮ · CHẠY
**Bước vào trận đã có sẵn một layer.** Áp trong `utils/unitFactory` — nơi mọi thân thể lên bàn cờ đều
đi qua — nên đội tutorial kịch bản và đội roll thật dùng chung một cửa. Sau [C8.v2] đây là ô
`START_SHIELDED` **duy nhất** (Sunbloom×Armor Plate đã nhường chỗ cho `ESCORTED_REDUCTION`).

### Warded Provoke — Thornshell — `PROVOKE_SHIELD` — ⚠ RỖNG [A7]
- **Thẻ hứa:** cast Provoke thì tự bọc layer.
- **Thực tế:** engine không đọc.

### Warded Chard — Chardslam — `SHIELD_ON_KILL` 1 — GIỮ · CHẠY
Kết liễu là dựng một layer mới lên bản thân (đã có layer thì thôi).

### Greatrind — Gourdward — `SHIELD_SPREAD` — GIỮ · SIG · CHẠY
Layer anh trao ra **tràn sang những ai đứng kề người nhận**.

---

# Phụ lục A · 14 ô rỗng — bảng quyết định [A7]

Mỗi ô hai đường, **không có đường thứ ba** (giữ `live: true` không wire = bán hàng không có hàng):

| Ô | Type | Đường 1: WIRE | Đường 2: `live:false` |
|---|---|---|---|
| Dawn Harvest | `HARVEST_SHIELD` | layer khi Harvest | tắt |
| Precision Shield | `SHIELD_ON_SKILL_KILL` | layer khi kill bằng skill | tắt |
| Thorned Bloom | `BLESS_RETALIATE` | gai theo blessing | tắt |
| Warded Gut | `SHIELD_ON_DIGEST` | layer khi bắt đầu nhai | tắt |
| Prowl Rotor | `DIGEST_MOVE` | move được khi đang nhai | tắt |
| Bristleback | `DIGEST_RETALIATE` | phản đòn khi đang nhai | tắt |
| Anchored Gullet | `DIGEST_STEADFAST` | miễn đẩy khi đang nhai | tắt |
| Overdrive Charge | `DASH_DISTANCE` | Rolling Charge xa thêm 1 | tắt |
| Reactive Cob Shell | `REACTIVE_SHIELD` | layer sau đòn đầu | tắt |
| Executioner Pods | `BLEED_EXECUTION` | **+ phải chốt luật cộng dồn** (7 hay 15) | tắt |
| Piercing Needles | `LASER_NEEDLE` | gai xuyên thành tia | tắt |
| Thorn Lunge | `THORN_LUNGE` | đòn thường thành lướt 1 ô | tắt |
| Warded Provoke | `PROVOKE_SHIELD` | layer khi cast Provoke | tắt |
| Rolling Rind | `ENCASE_RANGE` | Encase xa thêm 2 ô | tắt |

**Bốn ô của Snapmaw** (Warded Gut, Prowl Rotor, Bristleback, Anchored Gullet) đều rỗng — nghĩa là
**gần nửa hàng của anh không tồn tại**. Đáng cân nhắc riêng khi quyết.

- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

# Phụ lục B · 24 type phải viết, gom theo vùng móc

Xếp theo **vùng wiring** chứ không theo cột — mỗi đợt một vùng, không nhảy qua lại:

| Vùng móc | Type |
|---|---|
| **Va chạm** (`skillResolution` ~268, `planPush`) | `COLLISION_SPLASH` · `BLEED_ON_SHOVE` · `SUN_ON_COLLISION_KILL` · `COLLISION_PLATING` |
| **Vỡ layer** (`turnManager` ~836) | `SHIELD_BREAK_STUN` · `SHIELD_REFUND` · `SHIELD_RETALIATE` |
| **Rider trên đòn/skill** (`fusion.ts` ~362) | `ON_HIT_PULL` · `SPLIT_SHOT` · `SKILL_BLEED_SPLASH` · `SKILL_SPIKE_SCATTER` · `SHIELD_SHOT` · `EXTENDED_BARRELS` |
| **Damage calc** (`gameLogic.ts` ~403) | `ESCORTED_REDUCTION` · `EMPLACED_PLATING` · `SLIPSTREAM_PLATING` |
| **Di chuyển** (move resolution) | `CONVOY_AURA` · `ATTACK_THEN_MOVE` · `FLYER_REPEL` · `WIND_TAUNT` |
| **Kinh tế Sol** | `SUN_ON_DOUBLE_KILL` · `TAUNT_REFUND` |
| **Status mới** | `RETALIATE_ROOT` (trạng thái `ROOTED`) |
| **Action mới** | `PLUS_ROTATE` |

**2 type xoá** ([A5]): `NEEDLE_BURST` · `ARMOR_SHRED`. **Giữ** `RETALIATE_FREEZE` cho ICE element
(mồ-côi-data nhưng engine đang resolve).
