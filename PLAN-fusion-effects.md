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

### Underslung Pods *(tên đề xuất)* — Reedwing — `EXTENDED_BARRELS` — ĐỔI [C6.2] · **→ SƠ ĐỒ: Phụ lục C**
- **Ý định:** mỗi đòn bắn thêm **2 ô chéo kề** cô, mỗi bên thành một cột dọc 2 ô — tổng 4 ô, 2 ô mới ăn 1 damage.
- **Hình học đã giải** (chi tiết + 3 phương án + lý do chọn ở **Phụ lục C**): đòn của cô là
  `rangeType: 'WING_PAIR'`, 8 ô knight, bắn **2 ô mỗi lần** theo cặp có hướng. Phương án khuyến nghị
  lấp hai ô chéo `(x∓1, y∓1)` — vá đúng vùng chết quanh thân cô, và vì `inMelee` là Manhattan ≤ 1 nên
  **ô chéo là chỗ địch không đánh lại được**.
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
- **Luật cộng dồn — đã giải, chi tiết ở Phụ lục D.** Khuyến nghị: `BLEED_EXECUTION` **tiêu vết bleed
  y như một đòn thường, nhưng trả +2 THAY VÌ +1**. Ra đúng **7** như bạn tính, khớp chữ "3 damage
  total" đang in trên thẻ, và **không đẻ cap mới** — chỉ dùng cơ chế `bleedConsumed` đang chạy.

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

---

# Phụ lục C · SƠ ĐỒ — `WING_PAIR` và `EXTENDED_BARRELS` (trả nợ [C6.2])

## C.1 · Hình học hiện tại, lấy nguyên từ code

`utils/gameLogic.ts:744` — `WING_OFFSETS`, tám ô knight. **Quy ước trục của repo: `x` = HÀNG (xuống
là dương), `y` = CỘT (sang phải là dương).**

| Hướng ngắm | Cặp ô bắn |
|---|---|
| LÊN | `(x-2, y-1)` + `(x-2, y+1)` |
| XUỐNG | `(x+2, y-1)` + `(x+2, y+1)` |
| TRÁI | `(x-1, y-2)` + `(x+1, y-2)` |
| PHẢI | `(x-1, y+2)` + `(x+1, y+2)` |

Toàn bộ 8 ô cô **có thể** ngắm:

```
        .  X  .  X  .
        X  .  .  .  X
        .  .  Z  .  .          Z = Reedwing
        X  .  .  .  X          X = 8 ô knight
        .  X  .  X  .
```

**Quan trọng — mỗi đòn chỉ bắn HAI ô, không phải tám.** Người chơi ngắm một ô, engine tự thêm ô
sinh đôi cùng hướng (`wingTwin`, `gameLogic.ts:750`). Bắn hướng LÊN:

```
        .  X  .  X  .
        .  .  .  .  .
        .  .  Z  .  .
        .  .  .  .  .
        .  .  .  .  .
```

Ô **giữa** cặp — `(x-2, y)` khi bắn lên — là cái lỗ giữa hình, và **chỉ Cluster Load
(`WING_MIDSHOT`) mới lấp** (`wingMid`, `gameLogic.ts:765`):

```
        .  X  M  X  .          M = ô Cluster Load thêm vào
        .  .  .  .  .
        .  .  Z  .  .
```

## C.2 · Ba cách mở rộng — bạn chọn

Tất cả vẽ ở hướng bắn LÊN. `n` = ô mới do `EXTENDED_BARRELS` thêm.

**Phương án A — LẤP Ô CHÉO GẦN** *(khuyến nghị)*

```
        .  X  .  X  .          X = (x-2, y∓1)  ô knight gốc
        .  n  .  n  .          n = (x-1, y∓1)  ô chéo kề Z
        .  .  Z  .  .
```

Mỗi bên thành **một cột dọc 2 ô**. Ghép Cluster Load:

```
        .  X  M  X  .
        .  n  .  n  .          → 5 ô, đúng con số combo 2 của bạn
        .  .  Z  .  .
```

**Phương án B — ĐẨY RA XA THÊM**

```
        .  n  .  n  .          n = (x-3, y∓1)
        .  X  .  X  .
        .  .  .  .  .
        .  .  Z  .  .
```

**Phương án C — BANH NGANG**

```
        n  X  .  X  n          n = (x-2, y∓2)
        .  .  .  .  .
        .  .  Z  .  .
```

## C.3 · Vì sao khuyến nghị A

**① Khớp cả ba vế câu bạn viết ở [C6.2].** Bạn viết: *"bắn thêm 2 ô chéo (ngay dưới 2 ô cuối của chữ
L giống kiểu súng 2 bên bắn thành 1 hàng dọc"*.

| Vế bạn viết | A | B | C |
|---|---|---|---|
| "2 ô **chéo**" — `(x-1, y∓1)` đúng là hai ô chéo kề Z | ✅ | ❌ | ❌ |
| "**ngay dưới** 2 ô cuối của chữ L" — vào phía trong, gần Z | ✅ | ❌ (ra ngoài) | ❌ (sang ngang) |
| "súng 2 bên bắn thành **1 hàng dọc**" | ✅ | ✅ | ❌ |

**② A lấp VÙNG CHẾT, B chỉ kéo dài thứ cô đã dài nhất.** Hình knight có một lỗ hổng ngay quanh thân
cô: bất cứ thứ gì đứng sát đều **không bắn được**. Cô là hero 4 máu — thứ đứng sát cô là thứ nguy
hiểm nhất, mà lại đúng thứ cô bó tay. A vá đúng lỗ đó. B thì cộng tầm cho khẩu súng vốn đã với xa
nhất roster — ít giá trị hơn hẳn.

**③ Ô chéo là TÚI AN TOÀN — đây là chỗ hay nhất của A.** `inMelee` trong engine là **Manhattan ≤ 1**
(`turnManager.ts:826`), tức **đường chéo KHÔNG tính là kề**. Hệ quả: một zombie đứng chéo cô thì
**nó không đánh cô được** (phải bước sang ô trực giao trước), nhưng sau A thì **cô bắn được nó**.
Một ô bắn-mà-không-bị-bắn-lại, hợp đúng thân giấy.

**④ Không đụng bất kỳ luật nào.** Không nhân theo shot count (VOLLEY CAP không liên quan), không
random, overlay tô đủ 4–5 ô trước khi bấm.

**Lưu ý phải nói ra:** A **không** giúp vòng hit & run. `WIND_TAUNT` (Barbed Skids) kích khi cô rời ô
**kề** — mà kề là trực giao. Bắn chéo thì không dựng được taunt. Hai ô này phục vụ hai lối chơi khác
nhau, không cộng hưởng — đó là tính năng, không phải lỗi.

## C.4 · Chốt spec nếu bạn duyệt A

- **Type:** `EXTENDED_BARRELS`
- **Tên đề xuất:** **"Underslung Pods"** (Bệ Súng Dưới Cánh) — hoặc **"Close Pods"**. Bỏ tên "Twin
  Pods" cũ vì nó tả `DOUBLE_ATTACK`, không tả ô này.
- **Hiệu ứng:** mỗi đòn thường, ngoài cặp ô knight, bắn thêm **hai ô chéo kề** cùng phía hướng ngắm —
  `(x∓1, y∓1)` cho hướng dọc, `(x∓1, y∓1)` tương ứng cho hướng ngang. Hai ô mới ăn **1 damage**.
- **Ca biên:** ô mới ngoài bàn → bỏ qua ô đó, ô còn lại vẫn bắn. Ô mới có **ally** → xử lý y hệt ô
  knight gốc hiện đang xử lý ally (giữ nguyên luật sẵn có, không tạo ngoại lệ mới).
- **Wiring:** thêm hai offset vào cùng chỗ `wingTwin` được đọc — targeting overlay, resolver, path
  preview **dùng chung một hàm** (`gameLogic.ts:740` đã ghi rõ kỷ luật này). **Vừa.**

- **Trạng thái:** ⬜ chờ duyệt — chọn A / B / C
- **Góp ý:**

---

# Phụ lục D · LUẬT CỘNG DỒN

## D.1 · Vấn đề: ba con số cùng rơi vào một cú bắn

Khi Reedwing bắn một zombie **đang chảy máu**, có ba thứ cùng đòi cộng:

| | Nguồn | Giá trị |
|---|---|---|
| ① | **Damage in trên thẻ** | 1 mỗi ô |
| ② | **BLEED** (vết thương hở, tiêu hao) | +1, **một lần**, rồi vết tiêu |
| ③ | **`BLEED_EXECUTION`** (Executioner Pods) | +2 "khi mục tiêu đang bleeding" |

Cộng theo ba thứ tự khác nhau ra **7, 8, hoặc 16**. Chưa có luật nào trong repo nói cái nào đúng —
vì ô ③ **chưa từng được wire** ([A7]).

## D.2 · VOLLEY CAP làm gì — chính xác

`utils/fusion.ts:488`:

```
const volleyShots = effects.find(e => e.type === 'VOLLEY')?.value ?? 0;
if (volleyShots > 1) { ...kẹp mọi DAMAGE về đúng số in trên thẻ... }
```

Ba điều phải nắm:

1. **Cap khoá theo effect `VOLLEY`, không khoá theo số Ô bị trúng.** Nó tồn tại vì Precision Blast của
   Peaburst nhân damage-mỗi-phát với số phát, nên một cú +1 tới nơi thành +3.
2. **`WING_PAIR` là `rangeType`, KHÔNG phải effect `VOLLEY`** → **cap không bao giờ nổ cho Reedwing.**
   Đây không phải sơ suất: đòn cô bắn 2 ô **khác nhau**, mỗi ô một mục tiêu khác — không phải 2 phát
   dồn vào một thân.
3. **Cap chỉ kẹp `DAMAGE`.** Nó không biết gì về bleed, về rider, về bonus có điều kiện.

## D.3 · Tiền lệ THÀNH VĂN: buff thường trực áp MỖI Ô

`data/heroUpgrades.ts:91`, nâng cấp riêng của Reedwing (*Heavier Payload*, `BONUS_DAMAGE 1`):

> *"Damage is honest here: **WING_PAIR fires two cells, so +1 lands on both** — the same rule that
> makes Peaburst's identical upgrade lift her whole volley."*

Tức repo **đã chốt** rằng buff thường trực nhân theo số ô của cô, và gọi đó là "honest". Nên nếu
`BLEED_EXECUTION` được coi là buff thường trực, luật hiện hành sẽ tự cho ra **per-ô** — chứ không
phải một ngoại lệ ai đó bịa ra.

## D.4 · Luật cộng dồn đề xuất — BA TẦNG

| Tầng | Gồm | Cộng thế nào | Vì sao |
|---|---|---|---|
| **1 · Số ô** | `EXTENDED_BARRELS` · `WING_MIDSHOT` · `SPLIT_SHOT` · `DOUBLE_ATTACK` | thêm **ô**, mỗi ô ăn damage in trên thẻ | đây chính là món các ô này bán |
| **2 · Buff thường trực** | `BONUS_DAMAGE` · `BLESS_POWER` | **MỖI Ô** — tiền lệ *Heavier Payload* | bị VOLLEY CAP chặn **chỉ khi** skill có effect `VOLLEY` |
| **3 · Bonus có điều kiện TIÊU HAO** | `BLEED` · `BLEED_EXECUTION` | **MỘT LẦN mỗi đòn** | vì điều kiện **tự tiêu** sau lần đầu — không cần cap mới, chỉ cần đọc đúng |

Điểm mấu chốt của tầng 3: engine **đã** có cơ chế tiêu vết — `DamageResult.bleedConsumed`
(*"This instance spent the target's BLEEDING wound"*). Vết bleed bị **cú đánh đầu tiên** ăn mất. Nên
nếu `BLEED_EXECUTION` kiểm điều kiện "đang bleeding" **tại từng cú**, cú thứ hai trở đi nhìn vào thân
**đã hết bleed** → tự động không cộng. **Luật một-lần không phải cap thứ hai — nó là hệ quả của cơ
chế sẵn có.**

## D.5 · Bốn cách đọc, bốn con số — combo 2 của bạn

Bối cảnh: Reedwing damage 1 · `EXTENDED_BARRELS` + Cluster Load = **5 ô** · relic độc quyền dồn cả 5
phát vào **một** zombie **đang chảy máu**.

| Cách đọc | Phát 1 | Phát 2–5 | **Tổng** |
|---|---|---|---|
| ③ per-ô, đọc bleed **chụp trước loạt** | 1+1+2 = 4 | 1+2 = 3 (×4) | **16** |
| ③ per-ô, đọc bleed **sống** (phát 1 tiêu vết) | 1+1+2 = 4 | 1 (×4) | **8** |
| ③ một-lần, **CỘNG** với +1 của bleed | 5 + 1 + 2 | | **8** |
| **③ một-lần, +2 THAY THẾ +1 của bleed** *(khuyến nghị)* | 1+2 = 3 | 1 (×4) | **7** |

## D.6 · Khuyến nghị — và vì sao nó ra đúng số của bạn

**`BLEED_EXECUTION` = một cú kết liễu vết thương: nó TIÊU vết bleed y như một đòn thường, nhưng trả
+2 THAY VÌ +1.**

Ba thứ khớp cùng lúc, không phải trùng hợp:

1. **Khớp thẻ bài đang in.** Card viết *"+2 bonus damage (**3 damage total**) against targets currently
   suffering from Bleeding"*. 3 = 1 (base) + 2 (execution). Thẻ **không** cộng thêm +1 của bleed —
   đúng cách đọc "thay thế".
2. **Khớp con số bạn tính.** 5 + 2 = **7**.
3. **Không đẻ luật mới.** Không cần cap thứ hai. Chỉ dùng đúng cơ chế `bleedConsumed` đang chạy: vết
   bleed là **tài nguyên một lần**, ai tiêu trước thì được.

Kiểm lại ca **không có relic focus** (chơi thường, 2 ô, một zombie đang bleed đứng ở một ô):
- ô có zombie bleed: 1 + 2 = **3** ✓ đúng chữ "3 damage total" trên thẻ
- ô kia: 1

## D.7 · Ô nào khác bị luật này chạm

| Ô | Tầng | Hệ quả |
|---|---|---|
| *Heavier Payload* (nâng cấp Reedwing) | 2 | giữ nguyên +1 lên **cả hai** nòng — không đổi gì |
| *Fanged Blessing* `BLESS_POWER` | 2 | +1 lên **mỗi ô** của đòn được ban |
| *Fanged Bash* `BONUS_DAMAGE` | 2 | như cũ |
| *Serrated Pea* / *Rending Chard* (`BLEED_ON_HIT`, `BLEED_ON_SHOVE`) | 3 | **đặt** vết, không tiêu vết — không đụng luật này |
| *Shrapnel Kernel* `SKILL_BLEED_SPLASH` | 3 | đặt vết lên 4 ô; **combo có chủ đích**: Cornova rải vết, Reedwing kết liễu |
| *Repeater* `DOUBLE_ATTACK` | 1 | loạt thứ hai là **ô/phát mới**, mỗi phát tự đọc trạng thái bleed hiện tại |
| *Split Shell* `SPLIT_SHOT` | 1 | viên phụ là phát riêng, tầng 3 vẫn chỉ tính một lần cho cả đòn |
| *Cob Howitzer* `SKILL_SPLASH` | 1 | vành ngoài nửa sức — nhân theo ô, không nhân theo bonus tầng 3 |

- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

---

# Phụ lục E · BLEED VĨNH VIỄN — phân tích ưu / nhược / ảnh hưởng

Câu hỏi: **nếu vết bleed KHÔNG tiêu — mọi đòn sau đó đều +1, cho tới khi thân chết — thì sao?**

## E.1 · Cơ chế hiện tại, nguyên văn từ code

`utils/gameLogic.ts:460-467`:

```js
let bleedConsumed = false;
if (amount > 0
    && shieldDmg === 0 && currentShield === 0   // không có layer chắn giữa đòn và vết
    && target.statusEffects?.includes('BLEEDING')) {
    damageToDeal += 1;
    target.statusEffects = ...bỏ 'BLEEDING'...;
    bleedConsumed = true;
}
```

**Bốn tính chất, mỗi cái đều gánh việc** (comment trong code tự ghi ba, cái thứ tư ở §3 DESIGN):

1. **Cộng SAU giáp mũ** — "vết nằm dưới lớp giáp". Một cú đánh bị Pothelm clang về 0 vẫn ăn +1.
2. **Cộng SAU lớp chắn** — đòn bị layer nuốt thì không mang gì vào và **không tiêu vết**.
3. **Chỉ tính khi `amount > 0`** — sự kiện đánh dấu 0 damage (MISS, EMERGE) không kích, không tiêu.
4. **Xuyên miễn nhiễm STATUS** → **trùm vẫn chảy máu**. Và **không cộng dồn** (đánh dấu hai lần vẫn là một vết).

Tính chất 1 và 4 là thứ khiến "vĩnh viễn" nguy hiểm hơn nhiều so với cảm giác ban đầu.

## E.2 · ƯU ĐIỂM

**① Vá đúng lỗ §9.4 — bức tường giáp mũ.** Ba loại zombie có `armor: 1` (Pothelm, Doorbearer,
Linebreaker) và giáp mũ **được phép đưa một đòn về 0**. Reedwing damage 1 → cô vô hiệu hoàn toàn
trước chúng. Vì bleed cộng SAU giáp, một vết vĩnh viễn biến mọi phát của cô thành 1 damage thật,
mãi mãi. Đây là ưu điểm thật và lớn.

**② Biến bleed thành TÀI NGUYÊN ĐỘI, không phải rider cá nhân.** Một hero đánh dấu, cả đội hưởng, cả
trận. Đây đúng là loại "khoảnh khắc build" mà bạn muốn: Cornova rải vết → Reedwing kết liễu →
Peaburst dọn. Bản tiêu-một-lần hiện tại không tạo được cảm giác đó vì vết tan ngay sau đòn đầu.

**③ Cho ba hero 0-damage một cách đóng góp đọc được.** Chardslam (`BLEED_ON_SHOVE`) và Gourdward
(`BARBED_SHIELD`) không gây damage, nhưng vết họ đặt sẽ cộng dồn giá trị suốt trận thay vì bốc hơi.

**④ Trực giác hơn.** "Vết thương hở thì cứ chảy" dễ hiểu hơn "chảy đúng một đòn rồi tự lành".

## E.3 · NHƯỢC ĐIỂM

### ⚠ ① VOLLEY CAP KHÔNG NHÌN THẤY BLEED — đây là điểm nặng nhất

Hai con số nằm ở **hai tầng khác nhau của engine**:

- **VOLLEY CAP** chạy trong `applyFusionToSkill` (`fusion.ts:488`) — nó kẹp **giá trị `DAMAGE` trên
  effect của skill**, trước khi đòn được phát.
- **BLEED +1** cộng trong `calculateDamage` (`gameLogic.ts:464`) — **tại thời điểm gây damage, cho
  TỪNG instance**.

Cap **không bao giờ chạm tới** bleed. Hôm nay điều đó vô hại vì vết chỉ tiêu được một lần. Bỏ tiêu
hao đi thì bleed **lái xe tải qua đúng cái lỗ mà cap được dựng lên để bịt**:

| Precision Blast của Peaburst (VOLLEY 3 phát × 2) | Hôm nay | Bleed vĩnh viễn |
|---|---|---|
| Mục tiêu sạch | 6 | 6 |
| Mục tiêu đang bleed | 6 + 1 = **7** | (2+1) × 3 = **9** |

Cap được sinh ra chính vì "+1 dành cho đòn đơn tới nơi thành +3" (§9.3). Bleed vĩnh viễn tái tạo
đúng lỗi đó, ở một tầng cap không với tới.

### ⚠ ② Sập nguyên luật cộng dồn vừa chốt ở Phụ lục D

Luật "tầng 3 — bonus có điều kiện tiêu hao chỉ tính MỘT LẦN mỗi đòn" **không phải một quy tắc tôi
đặt ra** — nó là **hệ quả** của việc vết tự tiêu. Bỏ tiêu hao thì hệ quả biến mất, và
`BLEED_EXECUTION` (+2) nổ trên **mọi** instance:

| Reedwing 5 ô dồn vào 1 mục tiêu đang bleed | Tổng |
|---|---|
| Hôm nay (khuyến nghị Phụ lục D) | **7** |
| Bleed vĩnh viễn, không cap mới | 5 × (1+1+2) = **20** |

Muốn giữ 7 thì phải **viết một cap thứ hai bằng tay** — đúng thứ Phụ lục D vừa tránh được.

### ③ Xoá vĩnh viễn một trục thiết kế địch

Comment trong `calculateDamage` nói rõ giáp mũ **cố ý** được phép về 0: *"một Pothelm chặn đứng viên
đậu về ZERO là chủ đích — người chơi đang được bảo 'mang câu trả lời to hơn': đẩy nó, đốt nó, rải gai
đường nó'"*. Bleed vĩnh viễn **là** câu trả lời to hơn — nhưng là câu trả lời **một-lần-xong-mãi-mãi**,
mua bằng một ô fusion rẻ. Sau lượt 1, bài toán triage đó biến mất khỏi trận.

### ④ Toán trùm

Trùm 16–36 máu, và bleed **xuyên miễn nhiễm STATUS** nên trùm không chống được. Chỉ riêng Peaburst
dùng Precision Blast là +3/lượt. Trận trùm 6 lượt, cả đội đánh trúng ~4–5 instance/lượt →
**+24 tới +30 damage miễn phí**, tức gần trọn thanh máu của Blightlord (36), từ **một** vết đặt một lần.

### ⚠ ⑤ Hai ô THỤ ĐỘNG sẽ tự rải vết khắp bàn, miễn phí

Đây là chỗ tôi nghĩ dễ vỡ nhất và ít ai để ý:

- **Rending Husk** (Thornshell, `RETALIATE_BLEED`) — **mọi** zombie đánh anh bằng cận chiến đều dính
  vết. Không tốn action, tự chạy trong lượt địch. Mà **11/12 loại zombie thường đều là cận chiến**.
- **Glass Rind** (Gourdward, `BARBED_SHIELD`) — mọi kẻ đập vỡ layer đều dính vết. Cũng thụ động.

Với bleed tiêu-một-lần, hai ô này là "đánh dấu cho người khác kết liễu" — đúng liều. Với bleed vĩnh
viễn, tới lượt 3 **gần như cả bàn địch mang vết vĩnh viễn**, người chơi không tốn một action nào.
Đó không còn là một quyết định, đó là một trạng thái mặc định.

### ⑥ Snowball, không phải câu đố

Into the Breach bán **câu đố giải được trong một lượt với thông tin hoàn hảo**. Một dấu tích luỹ
vĩnh viễn đẩy trận về hình dạng "lượt 1 đặt dấu, các lượt sau bấm damage". Nói thẳng ra:
**bleed vĩnh viễn chính là Vulnerable của Slay the Spire.** Đó là cơ chế của thể loại
deckbuilder-scaling, không phải của tactics-puzzle. Không sai — nhưng phải chọn có ý thức.

### ⑦ Bảng cân bằng hiện có mất hiệu lực

Toàn bộ §9 của `DESIGN-fusion-matrix.md`, đường cong độ khó encounter, giá Sol — đều đo trên tiền đề
bleed tiêu một lần.

### ⑧ Nhiễu bảng (nhẹ nhưng thật)

Icon bleed hiện tại mang một thông tin **hành động được**: "đòn TIẾP THEO vào nó +1". Vĩnh viễn thì
icon thành "thứ này hơi mềm hơn, mãi mãi" — tới lượt 4 gần như con nào cũng đeo, và icon hết mang tin.

### ⑨ Làm HẸP build chứ không mở rộng

Với chính hai build Reedwing bạn thiết kế: bleed vĩnh viễn bơm thẳng cho **combo 2** (burst) và
không cho combo 1 (hit & run) gì cả. Kết quả là một build trội hẳn — ngược với mục tiêu "2 build khác
nhau cho một nhân vật".

## E.4 · Ảnh hưởng dây chuyền — từng ô cụ thể

| Ô | Vai | Ảnh hưởng nếu bleed vĩnh viễn |
|---|---|---|
| Serrated Pea (Peaburst) | đặt vết | mỗi phát của Repeater/Precision Blast đều +1 → **lỗ VOLLEY CAP** |
| Rending Husk (Thornshell) | đặt vết, **thụ động** | rải vết cả bàn miễn phí, 0 action — **hỏng nặng nhất** |
| Glass Rind (Gourdward) | đặt vết, **thụ động** | như trên, qua layer |
| Rending Chard (Chardslam) | đặt vết theo va chạm | ném 2 con vào nhau = 2 vết vĩnh viễn, mỗi lượt |
| Shrapnel Kernel (Cornova, MỚI) | đặt vết **4 ô một lúc** | một cú cast = tối đa 4 vết vĩnh viễn |
| **Executioner Pods (Reedwing, MỚI)** | **tiêu thụ vết** | +2 nổ trên **mọi** instance → 7 thành 20 |
| Underslung Pods / Split Shell / Repeater | tăng số instance | mỗi ô thêm vào là một lần +1 nữa |

Ba ô mới của pass này (Shrapnel Kernel, Executioner Pods, Underslung Pods) đều **khuếch đại** vấn đề —
chúng được thiết kế trên tiền đề vết tiêu một lần.

## E.5 · Năm biến thể — không phải chỉ có "có" hoặc "không"

| | Cơ chế | Giữ được gì | Mất gì |
|---|---|---|---|
| **A · Vĩnh viễn toàn cục** | mọi vết không tiêu | trọn ưu điểm §E.2 | trọn nhược điểm §E.3 |
| **B · Vĩnh viễn theo NGUỒN** | chỉ vết của **một** ô không tiêu (bản `BLEED_PERSIST` gốc ở [C2.1]) | cảm giác "đánh dấu mục tiêu lớn"; bán kính nổ gọn trong 1 ô | không vá được bức tường giáp cho cả đội |
| **C · Vĩnh viễn, nhưng MỘT LẦN mỗi đòn** | vết ở lại, nhưng chỉ **một instance** của mỗi đòn được +1 | ưu ①②③, **và giữ nguyên luật Phụ lục D** | vẫn có §E.3 ③④⑤ (thụ động, trùm, trục giáp) |
| **D · Vĩnh viễn CHỈ trên trùm / thân massive** | trash mob giữ luật cũ | trận trùm dài đúng chỗ cần dấu bền | không giải §9.4 (giáp mũ nằm ở trash mob) |
| **E · Bleed thành DoT** (1 HP/lượt) | không dính số instance | tự giới hạn, không đụng VOLLEY CAP | đè lên `BURN`/FIRE đã có; đổi bleed từ "khuếch đại" thành "đồng hồ" |

## E.6 · Khuyến nghị

**Nếu mục tiêu là cảm giác build:** chọn **C** (vĩnh viễn, một-lần-mỗi-đòn) **và** đồng thời hạ hai ô
thụ động xuống — `RETALIATE_BLEED` và `BARBED_SHIELD` đặt vết **tiêu-một-lần** như hôm nay, chỉ vết do
**hành động chủ động** mới vĩnh viễn. Như vậy:
- vết vĩnh viễn phải **trả bằng một action** → vẫn là quyết định;
- không đụng VOLLEY CAP (một lần mỗi đòn);
- luật Phụ lục D còn nguyên;
- giáp mũ vẫn bị vá, nhưng người chơi phải chủ động vá.

**Nếu muốn giữ trận đấu ở hình dạng câu đố ITB:** giữ nguyên bản tiêu-một-lần, và giải bài giáp mũ ở
chỗ khác — **Phá Boong-ke** (Cornova #8 trong `PLAN-relics-27.md`) dùng cờ `ignoresArmor` đã có sẵn,
là câu trả lời rẻ hơn và đúng lớp relic hơn.

**Không khuyến nghị A** — không phải vì nó yếu, mà vì nó **đòi ba việc sửa kèm** mà chưa ai tính giá:
cap thứ hai cho `BLEED_EXECUTION`, hạ hai ô thụ động, và đo lại toàn bộ §9.

- **Trạng thái:** ⬜ chờ duyệt — chọn A / B / C / D / E / giữ nguyên
- **Góp ý:**

---

# Phụ lục F · BLEED CỘNG DỒN (stack) — đề xuất của người chơi, và vì sao nó giải được bài toán

**Đề xuất:** bleed thành **số đếm**. Mỗi lần đặt = +1 stack. **Mỗi instance sát thương tiêu đúng 1
stack** và ăn +1. Nhiều nguồn bleed → nhiều stack → nhiều đòn liên tiếp cùng được +1. Thân mang 3
stack ăn một Precision Blast (3 phát) = tiêu sạch 3 stack, +3 damage.

## F.1 · Phát hiện nền — hôm nay bleed đang bị VỨT, và nó KHÔNG "tiêu một lần" như tôi viết ở Phụ lục E

Ba site đặt vết trong repo, **cả ba đều có cùng một cái chốt**:

| Site | Ô | Chốt |
|---|---|---|
| `skillResolution.ts:621` | Serrated Pea · Rending Chard · Shrapnel Kernel (mới) | `if (!targetUnit.statusEffects.includes('BLEEDING'))` |
| `turnManager.ts:847` | Glass Rind (`BARBED_SHIELD`) | `&& !enemy.statusEffects.includes('BLEEDING')` |
| `turnManager.ts:1134` | Rending Husk (`RETALIATE_BLEED`) | `&& !enemy.statusEffects.includes('BLEEDING')` |

**Đặt vết lên thân đang chảy máu = KHÔNG LÀM GÌ CẢ.** Lần đặt thứ hai bị vứt thẳng.

Hệ quả với build: **hôm nay càng nhiều nguồn bleed càng phản tác dụng.** Cornova rải vết 4 ô, rồi
Thornshell phản đòn lên đúng con đó → lần thứ hai mất trắng. Đúng thứ ngược với "cảm giác build" bạn
muốn — người chơi gom ba ô bleed và nhận về giá trị của một.

**Và một chỗ tôi viết sai ở Phụ lục E, sửa ở đây:** bleed **không** phải "tiêu một lần rồi hết". Site
đặt vết chạy **SAU** khi damage đã phân giải (`skillResolution.ts:620` gate bằng `!isDead`). Nên với
hero tự mang rider bleed, chu trình là **tiêu → đặt lại**:

> Lượt 1 Peaburst bắn thân sạch: 2 damage, đặt vết. Lượt 2: tiêu vết (+1) = **3 damage**, rồi **đặt
> lại vết**. Lượt 3: **3 damage**. Mãi mãi.

Tức **"bleed vĩnh viễn" đã tồn tại sẵn cho người tự đặt vết** — cái bị chặn chỉ là việc **người khác**
hưởng, và việc **nhiều nguồn** cộng lại. Đó mới là bài toán thật.

## F.2 · Vì sao stack KHÔNG phá VOLLEY CAP (khác hẳn "vĩnh viễn")

Đây là điểm quyết định, và bạn đúng khi tách hai thứ ra.

Cap được dựng lên để chặn **NHÂN một buff**: *"+1 dành cho đòn đơn tới nơi thành +3"* (`fusion.ts:474`).
Một buff, ba phát, ba lần hưởng — người chơi trả tiền **một lần**.

Stack **không nhân gì cả**. Nó là **cái ví**: mỗi stack là một tờ +1 mà ai đó đã **trả tiền để bỏ vào**,
và mỗi instance rút đúng một tờ. Ba phát rút được ba tờ **chỉ khi ví có ba tờ**.

| | Đội đặt vết 3 lần lên cùng một thân | Precision Blast (3 × 2) lên thân đó |
|---|---|---|
| **Hôm nay** | 2 lần sau **bị vứt** | 6 + 1 = **7** |
| **Vĩnh viễn** (Phụ lục E) | 1 cờ, không bao giờ tiêu | (2+1)×3 = **9** — và **9 mãi mãi**, mọi lần cast sau |
| **Stack (đề xuất)** | giữ đủ 3 | (2+1)×3 = **9**, rồi **thân sạch vết** |

Con số 9 giống nhau, **bản chất khác hẳn**: vĩnh viễn cho 9 *mỗi lượt, miễn phí*; stack cho 9 *một lần,
đổi bằng 3 lần đặt vết*. Tổng lợi ích của cả trận bị chặn cứng bằng **tổng số lần đội bỏ công đặt vết** —
tỷ lệ 1:1, không có số nhân ở đâu cả.

**Nói gọn: stack không tăng sức mạnh mỗi lần đặt vết — nó chỉ thôi VỨT ĐI những lần đặt thừa.**

## F.3 · ƯU ĐIỂM

**① Biến ba ô bleed từ phản-synergy thành synergy.** Đây là lý do mạnh nhất. Hôm nay gom Serrated Pea
+ Rending Husk + Shrapnel Kernel là tự giẫm chân. Sau đổi, đó là một **build**: nhiều nguồn nạp ví,
một hero rút. Đúng khoảnh khắc bạn đang tìm.

**② Chín trong mười nhược điểm ở Phụ lục E biến mất.** Không lỗ VOLLEY CAP (§F.2). Không snowball
(ví cạn là hết). Không xoá trục giáp mũ vĩnh viễn (mỗi stack chỉ vá được **một** đòn). Không cần cap
thứ hai. Bảng cân bằng §9 chỉ dịch chuyển theo lượng bleed **hiện đang bị vứt**, đo được, không phải
đoán.

**③ Vá bài giáp mũ ĐÚNG LIỀU.** Ba loại zombie `armor: 1` vẫn chặn được Reedwing — trừ đúng số đòn
bằng số stack đội chịu bỏ ra. Người chơi phải **mua** từng phát xuyên giáp, không được phát không.

**④ Hai ô thụ động hết nguy hiểm.** Rending Husk / Glass Rind vẫn nạp ví, nhưng mỗi stack chỉ đáng
đúng +1 và phải có người tới rút. Không còn cảnh "cả bàn địch mềm vĩnh viễn miễn phí" như bản A.

**⑤ Thông tin TỐT HƠN hiện nay, không tệ hơn.** Icon đeo số: *"bleed ×3"* = "ba đòn tiếp theo, mỗi
đòn +1". Đọc chính xác, cộng nhẩm được trước khi bấm, 0% RNG nguyên vẹn. Hôm nay icon chỉ nói được
"+1 đòn kế".

**⑥ Cho Executioner Pods một identity thật.** Theo luật Phụ lục D (+2 **thay** +1, tiêu một vết), ô
này thành **"cô rút mỗi tờ được gấp đôi"**: mỗi stack cô tiêu trả 2 thay vì 1. Cornova/Thornshell nạp
ví, Reedwing rút. Vẫn bị chặn bởi số stack — bounded.

## F.4 · RỦI RO CẦN CHẶN

**① ~~Ví phình vô hạn ở build rùa~~ — TÔI SAI, gạch bỏ.** Tôi từng viết: "gom 10 stack rồi dump một
lượt = +10 damage nổ một nhịp". **Không có nhịp nào cả.** Stack chỉ tiêu được **1 mỗi instance sát
thương**, mà một đội 3 hero chỉ tạo ra khoảng **1–5 instance mỗi lượt lên CÙNG một thân** (mỗi hero
một đòn; Reedwing bắn 2 ô nhưng là hai ô khác nhau nên thường chỉ 1 instance chạm mục tiêu đó;
Precision Blast là 3 instance nhưng tốn Sol và tốn lượt).

Gom 10 stack **không** cho phép dump 10 damage một lúc — nó cho +1 trên mười đòn tiếp theo, trải ra
2–4 lượt. **Tổng vẫn đúng 1:1 với số lần đặt vết**, chỉ là trả chậm. Đó không phải burst, đó là cái
kho. Và cái kho không tự sinh lời.

→ **Bỏ lý lẽ cân bằng cho cái trần.** Nếu vẫn muốn một con trần thì lý do duy nhất còn lại là **badge
giữ một chữ số** — đề xuất **trần 9**, thuần tuý cho gọn mắt. Cân bằng không cần nó: tốc độ tiêu vốn
đã ngang hoặc hơn tốc độ nạp (nạp tối đa ~2–3/lượt lên một thân, tiêu 1–5/lượt).

**② Có nên rơi theo lượt như Vulnerable của StS không?** Bạn hỏi đúng chỗ. **Tôi khuyên KHÔNG**, và
lý do là thể loại: đồng hồ đếm ngược bắt người chơi theo dõi một con số ẩn **cho từng thân địch** —
đúng thứ nhiễu mà game thông-tin-hoàn-hảo phải tránh. Trần 5 đã chặn được build rùa mà không thêm
đồng hồ nào. Nếu sau này thấy tempo ì, thêm decay là một dòng.

**③ Ô tự-đặt-vết vẫn tự nuôi.** Chu trình tiêu-rồi-đặt-lại ở §F.1 không đổi: Serrated Pea vẫn +1 mỗi
đòn lên cùng mục tiêu. Đó là hành vi **đang chạy hôm nay**, không phải cái đề xuất này đẻ ra — nhưng
nên ghi vào thẻ bài cho đúng, vì hiện thẻ không kể.

**④ Thứ tự trong một đòn nhiều instance.** Phải chốt: instance thứ n tiêu stack thứ n **trước** khi
rider đặt vết mới chạy (rider chạy sau toàn bộ resolution, `!isDead`). Nếu không sẽ có chuyện phát 1
đặt vết rồi phát 2 rút ngay chính nó — tự sinh tiền.

## F.5 · GIÁ ENGINE — rẻ hơn tưởng, và có một tin tốt

| Việc | Chỗ | Ghi chú |
|---|---|---|
| Đổi cờ thành số | `Unit.bleedStacks?: number` | **Không cần migration save** — `pitb_run_v1` **cố ý không lưu giữa trận** (CLAUDE.md), nên bleed chưa bao giờ sống qua một lần lưu |
| Tiêu 1 thay vì xoá sạch | `gameLogic.ts:464-466` | `damageToDeal += 1; bleedStacks -= 1` thay cho `filter(...)` |
| Bỏ chốt `!includes` | 3 site ở §F.1 | đổi thành `bleedStacks = min(cap, bleedStacks + 1)` |
| Hoàn vết khi Last Stand nuốt đòn | `gameLogic.ts:499` | `bleedStacks += 1` thay vì push lại cờ — logic sẵn có, chỉ đổi phép |
| UI đeo số | badge trạng thái | việc duy nhất **mới**, không phải sửa |

**Bốn tính chất load-bearing giữ nguyên 100%:** cộng sau giáp mũ · cộng sau lớp chắn · chỉ khi
`amount > 0` · xuyên miễn nhiễm STATUS. Không đụng cái nào.

Độ khó tổng: **Thấp-Vừa.** Rẻ hơn hẳn bản "vĩnh viễn" (bản đó đòi cap thứ hai + hạ hai ô thụ động +
đo lại §9).

## F.6 · KẾT LUẬN

Đề xuất này **tốt hơn cả ba phương án tôi đưa ở Phụ lục E**, vì nó đánh trúng nguyên nhân thật: vấn đề
chưa bao giờ là "vết tan quá nhanh", mà là **những lần đặt vết thừa đang bị vứt thẳng vào thùng rác**,
khiến build nhiều-nguồn-bleed tự phản mình.

**Chốt đề xuất:**
- ~~`BLEEDING` thành **stack**, **không** rơi theo lượt, trần **9**~~ → **GHI ĐÈ Ở [G.6③]:** trần **5**,
  **rơi 1 mỗi lượt**. Người chơi chốt vòng 3. Decay làm luôn việc chặn burst của máy kích hoạt bleed,
  nên đề nghị "trần cho máy kích hoạt" ở [G.3] rút lại.
- **Mỗi instance sát thương tiêu ĐÚNG 1 stack, ăn +1.** Không có chuyện một cú đánh tiêu sạch ví.
  Thân mang 3 stack ăn Precision Blast 3 phát: phát 1 tiêu 1 (+1), phát 2 tiêu 1 (+1), phát 3 tiêu 1
  (+1) → 9. Nếu chỉ có 2 stack: phát 1 và 2 được +1, **phát 3 ăn damage gốc**.
- `BLEED_EXECUTION` (Executioner Pods): mỗi stack **cô** tiêu trả **+2** thay vì +1 — giữ nguyên luật
  Phụ lục D, chỉ nhân theo số stack.
- Ba ô đặt vết bỏ chốt `!includes`, thay bằng cộng dồn.

## F.7 · UI — hiện ra hết, không giấu gì

Cam kết 0% RNG của game không chỉ là "không có xúc xắc", mà là **người chơi cộng nhẩm được kết quả
trước khi bấm**. Bleed thành stack thì có một con số mới, và con số đó **phải nhìn thấy được**:

**① Badge trên thân địch đeo SỐ.** Hiện tại `components/UnitComponent.tsx:34` chỉ đọc
`statusEffects?.includes('BLEEDING')` → ra một icon bật/tắt. Đổi thành icon **kèm số**: `🩸×3`. Đây là
việc UI **duy nhất thật sự mới** của cả đề xuất.

**② Overlay ngắm phải phân bổ ĐÚNG TỪNG PHÁT.** Đây mới là phần quan trọng, và là phần dễ làm ẩu.
Với đòn nhiều instance, số hiện trên mỗi ô/mỗi phát phải **đã trừ ví theo thứ tự**:

```
  Thân mang 2 stack, Peaburst ngắm Precision Blast (3 phát × 2):
      phát 1 →  3   (2 + 1, tiêu stack 1)
      phát 2 →  3   (2 + 1, tiêu stack 2)
      phát 3 →  2   (hết stack — damage gốc)
      tổng    →  8
```

Hiện **tổng 8**, không hiện "6 + bleed". Người chơi phải thấy ngay phát thứ ba yếu hơn hai phát đầu —
nếu không thì stack thứ ba trở thành thông tin ẩn, và đó đúng là thứ bạn nói *"ai lại giấu"*.

**③ Badge giảm dần theo từng phát khi animation chạy**, để mắt nối được số trên badge với số damage.

**④ Ghi vào thẻ bài.** Thẻ Serrated Pea / Rending Husk / Glass Rind / Shrapnel Kernel hiện chỉ nói
"để lại vết". Sau đổi phải nói rõ **"+1 stack"**, và Executioner Pods nói **"mỗi stack cô tiêu trả 2"**.

*(Ghi chú kỹ thuật: repo hiện **không có** cơ chế preview damage nào — tìm `predictedDamage` /
`damagePreview` / `forecast` đều ra rỗng. Nên mục ② không phải sửa một thứ có sẵn mà là **dựng mới**;
phải tính vào giá. Đây là chỗ duy nhất đội giá lên so với ước tính "Thấp-Vừa" ở §F.5 — nhưng nó là
thứ đằng nào cũng cần, vì `SPLIT_SHOT`, `EXTENDED_BARRELS` và `PLUS_ROTATE` đều đã hứa "overlay tô đủ
các ô trước khi bấm".)*

- **Trạng thái:** ⬜ chờ duyệt — trần 9 (chỉ để gọn badge) ổn chưa? Còn muốn hiện thêm gì trên overlay?
- **Góp ý:**

---

# Phụ lục G · VÒNG 3 — 25 góp ý, ghi lại + đối chiếu engine

Ghi ngày 2026-08-08. Đây là bản ghi vòng góp ý lớn nhất tới nay. **Các mục trong F1–F9 phía trên đã
cũ ở những ô có mặt dưới đây** — mục G là bản mới nhất.

## G.1 · Ba câu hỏi bạn hỏi — trả lời bằng code

### ① `SKILL_SPLASH` có gây mất máu xung quanh không? — **CÓ**

`skillResolution.ts:120-128`: kỹ năng **trả phí** của người mang effect thêm **4 ô trực giao** quanh
mục tiêu vào danh sách target. Line 308: vành ngoài ăn **nửa sức**, và stun mềm hạ thành chậm. Nên
Cob Howitzer đang là damage thật ra 4 ô kề, không phải chỉ hiệu ứng.

### ② Rending Chard — TOSS có tính không? Có "va chạm với đất" không? — **CÓ CẢ HAI**

`skillResolution.ts:717-722` có hẳn một khối tên **THE FALL**:

```js
// THE FALL: collision damage, not a DAMAGE effect — armour is bypassed like every slam,
// COLLISION_BONUS scales it (Grand Chard turns the 1 into 3), and a layer eats it whole.
const fall = 1 + getFusionEffectValue(caster, 'COLLISION_BONUS');
const r = calculateDamage(targetUnit, fall, false, true);   // ignoresArmor = true
```

Nên: cú ném **có** 1 damage tiếp đất, **là damage va chạm** (xuyên giáp mũ), `COLLISION_BONUS` nhân
nó lên, layer nuốt trọn, và nó **tiêu vết bleed** (`r.bleedConsumed`). → Theo spec `BLEED_ON_SHOVE`,
**cú ném CÓ dính bleed**.

**Nhưng một điều quan trọng khác:** cú ném **không bao giờ va vào thân khác**. Code kiểm `occupied` —
ô đích có người thì **cú ném không xảy ra gì cả**, thân đứng yên. Không có nhánh va-chạm-hai-thân cho
TOSS. (Điều này ảnh hưởng thẳng tới Blast Chard — xem G.3.)

### ③ (kèm theo) Đứng chặn hố spawn mất bao nhiêu máu? — **1, và `STEADFAST` miễn**

`turnManager.ts:441-447`: `painless = hasFusionEffect(occupant, 'STEADFAST')`, nếu không thì
`calculateDamage(occupant, 1, false)` — **giáp mũ vẫn áp** (khác damage va chạm).

## G.2 · PROVOKE vs TAUNTED — phát hiện lớn nhất vòng này

**Engine hôm nay chỉ có MỘT khái niệm, và nó đúng bằng định nghĩa PROVOKE của bạn.**

`aiLogic.ts:91-120`: thân mang `TAUNTED` + còn `tauntedBy` sống → **đi về phía người đó và đánh
người đó**. `heroes.ts:347` Provoke: *"Every enemy within 3 tiles must come for him next turn"*,
`effects: [{ type: 'TAUNT', value: 3 }]`.

Tức cái repo đang gọi là `TAUNTED` **chính là PROVOKE**. Nên:

**① Việc đổi tên là RENAME THUẦN, gần như miễn phí:**

| Hiện tại | Thành |
|---|---|
| status `TAUNTED` | `PROVOKED` |
| `Unit.tauntedBy` | `provokedBy` |
| effect `TAUNT` | `PROVOKE` |
| `TAUNT_ON_HIT` (Barbed Pea) | `PROVOKE_ON_HIT` |
| `TAUNT_RADIUS` (Bellowing Thorn) | `PROVOKE_RADIUS` |
| `TAUNT_REFUND` (Sunlit Thorn) | `PROVOKE_REFUND` |
| `WIND_TAUNT` (Barbed Skids) | `WIND_PROVOKE` ✅ đúng như bạn nói |
| Thorned Chard | **Provoke Chard** ✅ |

**② `TAUNTED` MỚI của bạn cần HƯỚNG MẶT — engine KHÔNG có.** *"kẻ thù quay mặt (kèm hướng tấn công)
về phía người đánh → khiến kẻ thù đánh hụt, thậm chí đánh lẫn nhau"* đòi ba thứ chưa tồn tại:
`Unit.facing`, đòn đánh phân giải **theo hướng mặt** thay vì theo mục tiêu, và AI biết mình đang bị
xoay. Đây là **khái niệm mới nặng nhất** trong cả pass — đúng lý do tôi đã loại relic *Bắn Lén*
(Peaburst #7) ở `PLAN-relics-27.md`.

→ **Đề nghị tách hai việc:** rename PROVOKE làm ngay (rẻ, và nó dọn sạch cách nói của cả ma trận);
`TAUNTED` mới xếp riêng thành một mục thiết kế của nó, đừng ghép vào pass fusion.

- **Trạng thái:** ⬜ chờ duyệt — đồng ý tách không?
- **Góp ý:**

## G.3 · 25 thay đổi, ghi theo cột

### Cột MAT_SUNBLOOM

**Twin Sol Battery** — đổi: **nhân đôi Sol của hành động tạo Sol** (thay `SUN_PER_TURN` thụ động).
⚠ **Cần bạn xác nhận một con số:** Harvest gốc là **50 Sol** (`heroes.ts:134`, kèm chú thích dài giải
thích vì sao 50 chứ không phải 25). Nhân đôi = **100**. Con số **30** bạn viết chỉ khớp nếu **Dawn
Harvest hạ sản lượng Harvest xuống 15** để đổi lấy layer (15 × 2 = 30). Đúng ý bạn không?

**Sunlit Gut** — đổi: giảm 1 lượt nhai thì **giảm 1 lượt ăn Sol**. Tức Double Jaw (`DIGEST_REDUCTION`)
và Sunlit Gut là **đánh đổi thật**, không phải cộng dồn. Tốt — hai ô cùng hàng thôi cộng hưởng miễn phí.

**Sunlit Chard** — đổi luật đơn giản hơn: **thân chết ở vị trí KHÁC vị trí ban đầu → +Sol.** Thay cho
"nguyên nhân là va chạm/nước/hố". Rẻ hơn nhiều: chỉ so hai toạ độ, không cần phân loại nguyên nhân.

### Cột MAT_PEABURST

**Split Shell** — bạn bắt đúng lỗi: Cornova bắn **vòng cung**, không có "trục bắn" nên không định
nghĩa được "ô sau lưng". Đổi thành: **thêm một viên phụ nếu có địch đứng cùng hàng dọc hoặc hàng
ngang với mục tiêu.** ⚠ Cần chốt tiếp: cùng hàng **kề** (1 ô) hay **cả hàng**? Nếu cả hàng thì phải
có luật chọn khi nhiều địch thoả — đề nghị **ô kề gần nhất theo thứ tự cố định (Bắc→Đông→Nam→Tây)**,
để zero-random và đọc được trên overlay.

**Piercing Needles** — đổi tên type `LASER_NEEDLE` → **`PIERCING_NEEDLE`**. Cơ chế: **bỏ đẩy lùi, thành
đâm xuyên thấu**. Việc đổi cận chiến → xạ thủ **để cho relic**, không làm ở lớp MAT. ✓ đúng hợp đồng 3 lớp.

**Roundhouse Chard** (`PLUS_ROTATE`) — **rút khỏi ma trận, chuyển sang relic** (đổi cơ chế chiến đấu).
Thay bằng: **thân bị ném có thêm một lượt NẢY** — di chuyển tiếp + mất thêm 1 máu khi chạm đất; hoặc
**1-1 máu + dừng lại** khi chạm thân/vật cản khác.
⚠ Cái này **mở ra đúng nhánh code đang thiếu**: TOSS hiện **không có** nhánh va chạm (G.1②). Cú nảy
sẽ là lần đầu tiên TOSS chạm được thân khác → phải viết mới, không tái dùng được `planPush`.

### Cột MAT_SNAPMAW

**Executioner Pods** — chốt: **1 điểm bleed đổi 2 máu thay vì 1.** ✓ (đúng luật Phụ lục D/F)

**Fanged Blessing → đổi hẳn cơ chế.** Phân tích của bạn đúng, và tôi xác nhận bằng code:
`heroes.ts:151` Solar Blessing = **+1 damage**; Fanged Blessing (`BLESS_POWER 1`) cộng thêm 1 → **+2**;
và `fusion.ts:462-464` áp nó bằng `effects.map(...)` lên **MỌI** effect DAMAGE → trên đòn 5 ô là **+10**.
**Đây đúng là cái lỗ tôi đã tìm thấy hai lần** (VOLLEY CAP không phủ `WING_PAIR`) — bạn tìm ra nó từ
hướng ngược lại, qua một hero khác.

| Trường hợp xấu nhất, 5 ô dồn 1 mục tiêu | Tổng |
|---|---|
| 5 stack + Fanged Blessing(+2) + Executioner | (1+2+2)×5 = **25** |
| 1 stack + Fanged Blessing(+2) + Executioner | 5 + 3×4 = **17** |
| 5 stack, Fanged Blessing đổi cơ chế | (1+2)×5 = **15** |

→ **Fanged Blessing mới: thân được ban phước có thể KÍCH HOẠT TOÀN BỘ bleed của mục tiêu trong một
đòn.** Không còn con số damage nào → hết nhân.

⚠ **Nhưng nó làm sống lại đúng cái lo "nuôi rùa" mà tôi vừa gạch bỏ ở [F.4①].** Tôi gạch nó vì stack
chỉ tiêu được 1 mỗi instance nên gom 10 stack không thành burst. **Máy kích hoạt toàn bộ chính là thứ
bẻ luật đó** — với nó, 10 stack = một cú +10 (hoặc +20 qua Executioner) trong MỘT instance. Bạn cũng
nhận ra ("là lỗi nuôi rùa..."), và dựa vào **"có limit turn"** để chấp nhận.
→ **Vấn đề: giới hạn lượt cho bleed CHƯA ĐƯỢC CHỐT.** Ở [F.6] tôi đề nghị **không** decay. Nếu máy
kích hoạt phụ thuộc vào decay để cân thì phải quyết decay trước. Ba lựa chọn:
  - **(a)** stack rơi 1 mỗi lượt → ví khó phình, badge phải hiện thêm đồng hồ;
  - **(b)** không decay, nhưng **máy kích hoạt có trần** (VD tiêu tối đa 3 stack một lần);
  - **(c)** không decay, không trần — chấp nhận burst như bạn nói.
  Tôi nghiêng **(b)**: giữ được thông tin sạch (không đồng hồ ẩn), chặn burst, và trần đọc thẳng trên thẻ.

**Anchored Gullet** — mở rộng: khi tung skill, **địch BỊ tiêu hoá → Maw bất động** (miễn push/pull);
**địch KHÔNG bị tiêu hoá → ĐỊCH bất động**. Hai võ sĩ nắm áo nhau. ✓ hay, và nó biến ô rỗng thành ô
có hai mặt.

### Cột MAT_IRONHUSK — ba tanker về một mối

**Thorn Lunge** — **rút khỏi ma trận, chuyển sang relic** (đổi cơ chế tấn công). Thay bằng: **miễn mất
máu khi chặn hố spawn; va chạm thì không mất máu và thân đâm vào MẤT 2 MÁU.**

Kết quả cả ba tanker khi ghép MAT_IRONHUSK — **cùng một nền, ba cái đuôi khác nhau**:

| Hero | Nền chung | Riêng |
|---|---|---|
| Ironhusk (`STEADFAST`) | miễn damage va chạm + miễn damage chặn hố | **−1 damage mọi nguồn** |
| Thornshell (mới) | ↑ | **phản 2 damage vào thứ va chạm vào anh** |
| Chardslam (`COLLISION_PLATING`) | ↑ | **miễn push/pull/toss** |

Đây là chỗ gọn nhất của cả vòng: vai tanker thành một chữ đọc được, ba biến thể đọc được. Wiring cũng
rẻ — `turnManager.ts:441` đã có sẵn cửa `painless = hasFusionEffect(occupant, 'STEADFAST')`, chỉ thêm
hai type nữa vào cùng chỗ.

### Cột MAT_CORNOVA

**Mortar Pea** — đổi: **thêm** khả năng bắn arc 4, **vẫn giữ** bắn thẳng 8. Tức không còn là "đổi hình"
mà là "thêm chế độ" — người chơi chọn mỗi lượt. ⚠ Cần UI chọn chế độ (2 nút), không phải đổi số.

**Blast Chard** — đơn giản hoá theo hình bạn vẽ:

```
[  ][oo][oo][  ]
[oo][xx][xx][oo]        xx = hai thân va chạm
[  ][oo][oo][  ]        oo = ô dính nổ
```

- Tâm nổ = **giữa hai thân va chạm**, không phải quanh từng thân.
- **CHỈ push/pull, KHÔNG toss.** (Khớp engine: TOSS không có nhánh va chạm — G.1②.)
- **Friendly fire — bom đạn không có mắt.** Đảo ngược spec cũ ("chỉ ENEMY dính"). Nhất quán với
  `BLESS_SHOCKWAVE`, ô cố ý đẩy cả người nhà.
- 8 ô dính nổ, hình cố định, zero random.

### Cột MAT_REEDWING

**Smokeline → Smoke Bullet** — bụi sinh ra **tại nơi viên đạn va chạm**, không phải nơi thân đáp.
⚠ Đây là **sửa lại L6** ("bụi rơi xuống chỗ thân đáp, không phải chỗ đất đi qua"). Luật L6 sinh ra để
chữa việc Smokeline phủ **cả làn đạn bay qua**. Bản mới phủ **một ô — ô trúng đạn** — nên **không phá
L6**, chỉ đọc lại: *"bụi ở nơi va chạm, không phải dọc đường bay"*. Cần sửa câu chữ L6 trong DESIGN.

**Ash Carriage** — tích hợp vào **skill**: 4 ô quanh điểm nổ có bụi. (Pháo để lại bụi — hợp lý, và
skill-only đúng tiền lệ `SKILL_SPLASH`.)

**Overdrive Rotor** — sửa: **không cộng thêm ô**, mà **cho đi nốt số ô CHƯA đi sau khi tấn công**.
Đi 2 → tấn công → còn 2 ô để đi. ✓ Sạch hơn hẳn bản cũ: không tặng thêm gì, chỉ bỏ luật "đánh xong là
khoá". Và nó tự cân bằng — muốn bay xa sau khi bắn thì phải bay ít trước khi bắn.

**Downwash** — sửa: chỉ áp dụng ở **ô CUỐI CÙNG** của lượt di chuyển. Nếu fuse cùng Overdrive Rotor
(đi → bắn → đi tiếp) thì **ô dừng lại để bắn KHÔNG kích Downwash**, chỉ ô cuối cùng mới kích. ✓ đúng,
nếu không thì hai ô fuse với nhau thành 2 lần đẩy một lượt.

**Rolling Rind** — sửa: Encase từ **SELF → range 1**, cast được lên ô bên cạnh, **vẫn bảo vệ cả
Gourdward lẫn ô đó**. Kịch bản đổi từ "bảo vệ mình + hàng sau" thành "bảo vệ mình + một tank nữa".

### Cột MAT_THORNSHELL

**Thorned Bloom** (`BLESS_RETALIATE`) — chốt: **cộng dồn phản đòn**. Đang phản 1 mà được ban phước →
**phản 2**. (Khác bản cũ "trao gai cho người chưa có".)

**Jamming Plate** — mở rộng: địch **vừa bị trói chân VỪA bắt buộc đánh Ironhusk**. Tức `RETALIATE_ROOT`
+ PROVOKE cưỡng bức. ✓ Đúng chữ "kẹt trên giáp": không đi được, và cũng không quay sang đánh ai khác.

**Barbed Skids** — `WIND_TAUNT` → **`WIND_PROVOKE`** ✓

**Thorned Chard → Provoke Chard** — thân bị ném **ghi hận**, lượt sau tìm đến hero trả thù. ✓ Đổi từ
`RETALIATE_PUSH` (phản đòn khi bị đánh) sang provoke-theo-cú-ném — hợp hero hơn hẳn.

### Cột MAT_CHARDSLAM

**Grand Chard** — đổi hẳn tầm: từ buff cá nhân thành **passive TOÀN BẢN ĐỒ** — mọi damage va chạm và
damage chặn hố **+1**. Kết quả: ném Zom A vào Zom B → **cả hai mất 2 máu**.
⚠ Cần biết: hiện `COLLISION_BONUS 2` chỉ áp cho va chạm **do anh gây ra**; bản mới áp cho **mọi** va
chạm trên bàn — kể cả va chạm địch tự gây, kể cả damage chặn hố mà **hero nhà đang chịu**. Đó có phải
ý bạn không? Nếu có thì đây là ô đầu tiên trong ma trận **có mặt trái**, cần ghi rõ trên thẻ.

### Cột MAT_GOURDWARD

**Greatrind** — sửa: skill thường **shield thêm một đối tượng nữa đằng sau**. (Thay `SHIELD_SPREAD`
"tràn sang mọi ai kề người nhận" bằng một luật hình học gọn: thêm đúng 1, ở phía sau.)

## G.4 · Phụ lục A / B / C — chốt của bạn

**Phụ lục A — "làm hết rồi bật".** ✅ Tức **wire cả 14 ô**, không hạ `live:false` ô nào. Ghi nhận. Lưu
ý: 5 trong số đó đã được vòng này **đổi cơ chế** (Piercing Needles, Thorn Lunge, Anchored Gullet,
Rolling Rind, Thorned Bloom) nên viết mới luôn, không wire theo mô tả cũ.

**Phụ lục B — bổ sung 3 nhóm việc:**

1. **Làm rõ PROVOKE vs TAUNT** → G.2.
2. **Bộ đếm bleed** → Phụ lục F + UI ở F.7.
3. **Dọn từ vựng dịch chuyển — chốt 5 type:**

| Type | Nghĩa |
|---|---|
| `push` / `pull` | dời thân theo trục, do hero gây |
| `toss` | ném qua đầu tới ô đối xứng `2·C − T` |
| `block_spawn` | đứng bịt hố lúc thân mới trồi lên |
| **damage va chạm** | = `push`/`pull` vào ô **CÓ thân** + `block_spawn` |
| **moved** | = `push`/`pull`/`toss` vào ô **KHÔNG có thân** |

⚠ Một chỗ lệch phải xử: theo bảng này thì **TOSS luôn là `moved`** (ô đích bắt buộc trống), nhưng
engine **vẫn tính 1 damage tiếp đất** cho nó (THE FALL, G.1②) và damage đó **là loại va chạm**
(`ignoresArmor: true`, `COLLISION_BONUS` nhân nó). Cần chọn: **THE FALL là va chạm** (giữ engine, sửa
bảng) hay **THE FALL là loại riêng** (sửa engine)? Việc này ảnh hưởng thẳng tới Rending Chard, Sunlit
Chard, Grand Chard và cú nảy mới của Chardslam.

**Phụ lục C — phương án A** ✅ (lấp 2 ô chéo kề). Chốt, không cần bàn thêm.

## G.5 · Tổng hợp việc phát sinh từ vòng 3

| Loại | Mục |
|---|---|
| **Rút khỏi ma trận → relic** | Roundhouse Chard (`PLUS_ROTATE`) · Thorn Lunge (đổi cơ chế đánh) · Piercing Needles nửa "melee→ranged" |
| **Khái niệm engine MỚI nặng** | `TAUNTED` có hướng mặt (G.2②) · nhánh va chạm cho TOSS (cú nảy) · chế độ bắn kép cho Mortar Pea |
| **Cần bạn chốt trước khi code** | số Harvest (50 hay 15?) · luật chọn ô của Split Shell · decay/trần cho máy kích hoạt bleed · Grand Chard có mặt trái không · THE FALL thuộc loại nào |
| **Sửa tài liệu luật** | L6 (bụi tại điểm va chạm) · L5 đã khai tử · rename TAUNT→PROVOKE toàn bộ |

- **Trạng thái:** ⬜ chờ duyệt vòng 3
- **Góp ý:**

## G.6 · Năm chốt của vòng 3 — và hệ quả từng cái

### ① Twin Sol × Dawn Harvest — ⚠ CÒN LỆCH MỘT SỐ, cần bạn xác nhận

Bạn viết `(25 − 10) × 2`. Cấu trúc thì chốt rồi: **Dawn Harvest trừ bớt sản lượng Harvest để đổi lấy
layer, rồi Twin Sol nhân đôi phần còn lại.** Nhưng con số gốc lệch:

**Harvest trong code là 50, không phải 25** (`heroes.ts:134`) — và nó có một chú thích dài giải thích
vì sao **đã từng là 25 rồi bị đổi lên 50**:

> *"50, not 25. At 25 she handed the squad exactly what `SUN_PER_TURN_INCOME` already pays it for
> free, so spending her whole turn bought nothing — the one hero who cannot attack was also the one
> whose action was worth nothing."*

Ba cách khớp, chọn một:

| | Cách | Kết quả |
|---|---|---|
| **(a)** | Giữ Harvest 50, Dawn Harvest trừ 10 | `(50−10)×2` = **80** Sol/lượt |
| **(b)** | Giữ Harvest 50, Dawn Harvest trừ **35** | `(50−35)×2` = **30** Sol/lượt — khớp con số 30 bạn nói ở vòng trước |
| **(c)** | Hạ Harvest về 25 (đảo lại quyết định cũ), trừ 10 | `(25−10)×2` = **30** |

⚠ **(c) đụng vào lý do đã thành văn.** Nếu hạ về 25 thì Harvest trần trụi lại trở về đúng chỗ mà chú
thích trên nói là hỏng — trừ khi `SUN_PER_TURN_INCOME` cũng đổi. **(b)** cho đúng con số 30 mà không
đụng gì cả: giá của cái layer đơn giản là đắt (35 Sol), điều đó hợp lý vì layer chặn TRỌN một nguồn.

**Tôi khuyến nghị (b).** Bạn chốt giúp.

### ② Split Shell — ~~cùng hàng VÀ cột~~ ⚠ **ĐÃ GHI ĐÈ Ở [G.8②]** — bản chốt là MỘT viên theo hướng C→T

Viên phụ kích khi có địch đứng **cùng hàng hoặc cùng cột với mục tiêu**, trong tầm kiểu `LINE` của
Peaburst. Hình là một dấu cộng mọc ra từ **mục tiêu**, không phải từ Cornova:

```
            [ ? ]
            [ ? ]
    [?][?][ X ][?][?]        X = mục tiêu chính
            [ ? ]            ? = ô viên phụ có thể rơi
            [ ? ]
```

⚠ **Còn một luật phải chốt: nhiều địch cùng thoả thì bắn con nào?** Bắt buộc phải cố định để giữ
zero-random. Đề nghị: **con GẦN mục tiêu nhất; hoà thì theo thứ tự cố định Bắc → Đông → Nam → Tây.**
Overlay tô ô đó trước khi bấm. Nếu bạn muốn luật khác (VD: con máu thấp nhất) thì nói, nhưng phải là
một luật đọc được, không phải "gần nhất theo cảm giác".

### ③ Bleed — trần 5 + decay 1 mỗi lượt ✅ (thay quyết định cũ ở F.6)

Chốt: **trần 5**, **rơi 1 mỗi lượt**. Ghi đè khuyến nghị "trần 9, không decay" của tôi ở [F.6].

**Hệ quả — và tôi thấy chốt này giải quyết luôn cái tôi lo:**

- **Máy kích hoạt bleed (Fanged Blessing mới) hết nguy hiểm.** Với decay + trần 5, ví không phình
  được: burst tối đa là 5 stack = +5 (hoặc +10 qua Executioner), và muốn có 5 stack thì phải nạp
  nhanh hơn tốc độ rơi. **Không cần thêm trần cho máy kích hoạt nữa** — phương án (b) tôi đề nghị ở
  G.3 rút lại, decay đã làm việc đó.
- **Bleed thành cơ chế TEMPO.** Nạp rồi phải tiêu ngay, không để dành. Hợp nhịp một game giải đố
  theo lượt hơn hẳn bản không-decay.
- **Badge phải hiện SỐ** (đã có ở F.7) — và vì số tự giảm mỗi lượt, người chơi đọc được "còn mấy lượt
  nữa là mất", không cần thêm đồng hồ riêng. Decay **là** đồng hồ, và nó hiện ngay trên con số.
- ⚠ **Phải chốt decay rơi lúc nào:** cuối lượt người chơi, hay cuối lượt địch (tức cuối vòng)? Đề nghị
  **cuối vòng** — để một vết đặt trong lượt địch (Rending Husk, Glass Rind) còn nguyên giá trị cho
  lượt người chơi kế tiếp. Nếu rơi cuối lượt người chơi thì hai ô thụ động đó bị thiệt một nhịp.

### ④ Grand Chard toàn bản đồ — chấp nhận mặt trái ✅

Chốt: passive **toàn bàn**, mọi damage va chạm và damage chặn hố **+1**, kể cả khi hero nhà chịu.
Lý lẽ của bạn đứng vững: ba tanker ghép MAT_IRONHUSK đều **miễn** hai loại damage đó, mà ba tanker
cũng đúng là người hay đi dẫm hố và hay bị làm thân push/pull nhất.

⚠ **Một việc wiring phải để ý:** hiện `COLLISION_BONUS` đọc từ **người gây ra cú đẩy**
(`skillResolution.ts:720`: `getFusionEffectValue(caster, 'COLLISION_BONUS')`). Thành passive toàn bàn
thì giá trị phải chuyển từ **per-caster** sang **per-board** — tức mọi site tính damage va chạm phải
hỏi "trong đội có ai mang ô này không", không hỏi "người đẩy có mang không". Đó là 4–5 điểm đọc chứ
không phải 1. Vẫn Thấp-Vừa, nhưng khác hình so với ô cũ.

**Mặt lợi ít ai để ý:** địch tự tông vào nhau cũng +1. Với một đội xoay quanh push/pull thì đây là
buff hai chiều, không chỉ một chiều.

### ⑤ THE FALL — sửa engine, mặt đất tính là va chạm ✅

Chốt: **mặt đất là một mặt va chạm.** Bảng 5 type ở G.4 cập nhật thành:

| Type | Nghĩa |
|---|---|
| `push` / `pull` | dời thân theo trục, do hero gây |
| `toss` | ném qua đầu tới ô đối xứng `2·C − T` |
| `block_spawn` | đứng bịt hố lúc thân mới trồi lên |
| **damage va chạm** | `push`/`pull` vào ô **CÓ thân** · `block_spawn` · **`toss` tiếp đất** |
| **moved** | `push`/`pull` vào ô **KHÔNG có thân** |

Engine vốn đã đối xử THE FALL như va chạm (`ignoresArmor: true`, `COLLISION_BONUS` nhân nó) — nên
đây là **hợp thức hoá cái đang chạy**, không phải viết mới. Việc thật chỉ là đặt tên và gom nó vào
cùng một cửa với hai loại kia.

**Hệ quả dây chuyền, đã rà:**

| Ô | Hệ quả |
|---|---|
| Rending Chard (`BLEED_ON_SHOVE`) | cú ném **có** dính bleed lúc tiếp đất ✓ |
| Sunlit Chard | thân chết vì tiếp đất tính là "chết ở vị trí khác" ✓ |
| Grand Chard | fall damage 1 → **2** (và toàn bàn) |
| Thornshell/Chardslam/Ironhusk × MAT_IRONHUSK | miễn luôn damage tiếp đất — **không ném được hero nhà cho đau nữa** |
| **Blast Chard** | **vẫn KHÔNG nổ khi toss** — không mâu thuẫn: tâm nổ định nghĩa là **điểm giữa HAI thân**, mà cú ném chỉ có một thân và mặt đất. Không có điểm giữa → không có nổ. |

## G.7 · Việc còn treo sau vòng 3

| # | Việc | Ai quyết |
|---|---|---|
| 1 | Số Harvest — chọn (a)/(b)/(c) ở G.6① | bạn |
| 2 | Split Shell — luật chọn ô khi nhiều địch thoả | bạn |
| 3 | Bleed decay rơi cuối lượt người chơi hay cuối vòng | bạn (tôi đề nghị cuối vòng) |
| 4 | `TAUNTED` có hướng mặt — tách ra khỏi pass fusion? | bạn (G.2②) |
| 5 | Rename `TAUNT` → `PROVOKE` toàn bộ — làm luôn hay đợt riêng | bạn |

- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

## G.8 · Chốt vòng 3b — và một ước tính của tôi bị lật ngược

### ① Twin Sol × Dawn Harvest — phương án (b) ✅ CHỐT

Harvest giữ **50**. Dawn Harvest trừ **35** để đổi lấy layer. Twin Sol nhân đôi phần còn lại:
`(50 − 35) × 2` = **30 Sol/lượt + 1 layer**. Không đụng chú thích 25→50 đã thành văn.

Ba trạng thái của Sunbloom, đọc thành bảng cho rõ:

| Cắm gì | Một lượt Harvest cho |
|---|---|
| không gì | 50 Sol |
| Twin Sol Battery | **100** Sol |
| Dawn Harvest | 15 Sol + **1 layer** |
| cả hai | **30** Sol + **1 layer** |

### ② Split Shell — ⚠ GHI ĐÈ [G.6②] ✅ CHỐT

Bỏ bản "dấu cộng quanh mục tiêu". Bản mới, đơn giản hơn hẳn: **đúng MỘT viên phụ, bay tiếp theo hướng
kẻ từ Cornova tới mục tiêu.**

- Bước hướng `d = ( sign(T.x − C.x), sign(T.y − C.y) )` — tám hướng, hoàn toàn xác định.
- Ô phụ = `T + d`.
- Không dò địch, không chọn, không hoà. Trúng gì thì trúng, ô trống thì thôi.

```
    C . . . . .          C = Cornova
    . . . . . .          T = mục tiêu chính
    . . T P . .          P = ô viên phụ (thẳng hàng → P nằm ngay sau T)
    . . . . . .

    C . . . . .          Lệch hàng → d là hướng chéo,
    . . . . . .          P vẫn nằm đúng trên đường kéo dài C→T
    . . T . . .
    . . . P . .
```

*"Có thể bắn chéo nhưng ủng hộ bắn thẳng"* — đúng như bạn nói: cơ chế chạy ở cả tám hướng, nhưng chỉ
khi Cornova đứng thẳng hàng/thẳng cột với mục tiêu thì ô phụ mới nằm ở chỗ đọc được và xếp đội hình
được. Người chơi tự học rằng đứng thẳng hàng là đứng đúng.

Và nó **giải luôn phản đối cũ của bạn**: trục không phải đường bay của viên đạn (vốn cong), mà là
đường hình học Cornova → mục tiêu. Đạn vẫn bay vòng cung, ô phụ vẫn xác định.

### ③ Bleed decay rơi **cuối vòng** ✅ CHỐT

Trần 5, rơi 1 mỗi vòng, rơi sau khi lượt địch kết thúc. Vết đặt trong lượt địch (Rending Husk, Glass
Rind) còn nguyên giá trị cho lượt người chơi kế tiếp.

### ④ TAUNTED — ⚠ TÔI ƯỚC TÍNH SAI Ở [G.2②], RẺ HƠN NHIỀU

Tôi từng viết TAUNTED mới là *"khái niệm mới nặng nhất trong cả pass"* vì cần `Unit.facing`, cần đòn
đánh phân giải theo hướng mặt. **Sai — engine đã có sẵn đúng cái cần.** Ba dòng code:

| Bằng chứng | Nghĩa |
|---|---|
| `aiLogic.ts:98` — `{ type: 'ATTACK', target: { ...taunter.position } }` | intent tấn công của địch mang một **Position**, không mang một unit |
| `turnManager.ts:809` — `blows = [{ pos: intent.target, ... }]` | đòn phân giải **theo Ô** |
| `turnManager.ts:814` — `const targetUnit = getUnitAt(at, simUnits);` | tra **bất kỳ unit nào** ở ô đó — **không lọc phe** |

Tức **địch đánh vào một Ô, và trúng bất cứ ai đang đứng đó, kể cả zombie khác.** Cơ chế "đánh hụt" và
"đánh lẫn nhau" **không cần viết mới** — chúng rơi ra sẵn từ kiến trúc.

**Spec `TAUNTED` mới:**
- Lúc dính taunt, thân địch **ghi nhớ Ô** người taunt đang đứng (`Unit.tauntedTile: Position`).
- Lượt sau, intent của nó bị ép thành `ATTACK` **vào đúng ô đó**, bất kể ai đang ở đó.
- Người taunt đã đi chỗ khác → đánh vào ô trống, **hụt**.
- Có zombie khác bị đẩy vào ô đó → **nó ăn đòn**.
- Không cần `Unit.facing`, không cần sửa phân giải đòn đánh, telegraph vốn đã vẽ ô mục tiêu.

**Giá: Thấp-Vừa**, không phải Cao. Không cần migration save (bleed/taunt chỉ sống trong trận,
`pitb_run_v1` cố ý không lưu giữa trận).

**Cách test bạn đề xuất — nhận, và nó là bài test hoàn hảo:** Provoke của Thornshell thành **hai
tầng**:

```
  kề anh (Manhattan ≤ 1)  →  TAUNTED  (khoá vào Ô anh đang đứng)
  xa hơn, trong tầm 3     →  PROVOKED (đi về phía anh, đánh anh)
```

Đúng cả về nghĩa lẫn về flavor: hét vào mặt kẻ đứng sát thì nó vung theo tiếng hét; hét với kẻ ở xa
thì nó chỉ biết lao tới. Và nó mở ra một câu đố thật:

> Thornshell Provoke → ba con kề anh khoá vào ô anh đứng → Chardslam đẩy một con thứ tư vào đúng ô
> đó rồi hất Thornshell ra → ba con đấm nhau.

Đó chính là loại nước đi Into the Breach tồn tại để bán. **Tách khỏi pass fusion như bạn nói, nhưng
xếp ngay sau nó, không phải "để sau" vô hạn** — vì nó rẻ và vì nó là nền cho `WIND_PROVOKE`,
`PROVOKE_ON_HIT`, Provoke Chard.

⚠ **Một câu phải chốt khi làm:** khoá vào **Ô** (chốt lúc taunt, đây là bản tôi vừa spec) hay khoá
vào **THÂN** (bám theo người taunt mỗi lượt)? Bản khoá-Ô mới tạo ra "đánh hụt / đánh lẫn nhau"; bản
khoá-Thân chỉ là PROVOKE mạnh hơn. **Khoá Ô** mới là thứ bạn mô tả.

### ⑤ Rename `TAUNT` → `PROVOKE` toàn bộ ✅ CHỐT, làm luôn

Đổi đồng loạt, và **`TAUNTED` được giải phóng để mang nghĩa mới ở ④**:

| Cũ | Mới |
|---|---|
| status `TAUNTED` | `PROVOKED` |
| `Unit.tauntedBy` | `provokedBy` |
| effect `TAUNT` | `PROVOKE` |
| `TAUNT_ON_HIT` (Barbed Pea) | `PROVOKE_ON_HIT` |
| `TAUNT_RADIUS` (Bellowing Thorn) | `PROVOKE_RADIUS` |
| `TAUNT_REFUND` (Sunlit Thorn) | `PROVOKE_REFUND` |
| `WIND_TAUNT` (Barbed Skids) | `WIND_PROVOKE` |
| Thorned Chard | **Provoke Chard** |
| *(để trống)* | **`TAUNTED` mới** = khoá ô, xem ④ |

Làm rename **trước**, rồi mới thêm `TAUNTED` mới — nếu làm ngược thì có một quãng hai chữ TAUNTED
mang hai nghĩa trong cùng một cây code, đúng loại lẫn lộn đã sinh ra pass này.

- **Trạng thái:** ⬜ chờ duyệt — chỉ còn câu "khoá Ô hay khoá Thân" ở ④
- **Góp ý:**
