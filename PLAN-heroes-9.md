# Chốt bộ 9 hero

> Bản đặc tả để dựng. Năm hero đầu **đã có trong code** (chỉ số dưới đây là chỉ số thật, kèm
> đề xuất chỉnh); bốn hero sau là thiết kế mới. **Chín người, hết — không có hero thứ 10.**
>
> Chín cây gốc của chín hero cũng chính là **chín gear**: mang ra trận làm quân dự bị, hoặc
> nướng vào hero làm nguyên liệu fusion. Chọn một, mất một.
>
> Cấu trúc tổng: `PLAN-progression.md`.

## Thang đo dùng để cân

Mọi con số dưới đây đo bằng bốn mốc này, không phải bằng cảm giác:

| Mốc | Số | Nguồn |
|---|---|---|
| Ngân sách Sol một trận | 50 + 25/lượt ≈ **225** cho **cả ba** hero | `constants.ts` |
| Tỉ lệ lượt dùng skill | **~20%** — 4,5 lần cast trên 21 lượt hành động | suy ra từ trên |
| Máu zombie | Zombie 2 · Scrapcap 3 · Pothelm 4 · Cửa Lưới/Linebreaker 5 · Gravehulk 16 | `data/zombies.ts` |
| Ngưỡng chí mạng | **2** giết Zombie/Bóng Bay · **3** giết Scrapcap · **4** giết Pothelm · **5** giết Cửa Lưới | |

> **~80% số lượt là đánh thường.** Nên đòn đánh thường mới là bản sắc của hero; skill chỉ là
> ngoại lệ. Mọi thiết kế dưới đây đặt trọng lượng ở đòn đánh thường.

---

# TẦM XA

## 1. Peaburst — *Seed Gun* — ĐÃ CÓ

| Máu | Sát thương | Di chuyển |
|---|---|---|
| 6 | 2 | 3 |

- **Bắn Đậu** — `LINE 8`, 2 sát thương. Miễn phí.
- **Bắn Chuẩn** — `LINE 4`, 3 sát thương + xuyên. **50 Sol**.

**Vai:** sát thương thẳng, tầm xa nhất bộ. Hero nhập môn.
**Điểm yếu lõi:** đòn đánh **dừng ở vật cản đầu tiên, kể cả cây nhà** — thực chiến cô thường
chỉ có 1–2 mục tiêu hợp lệ, có khi 0.

**Nguồn:** hero khởi đầu.

**Chốt: giữ nguyên.** Cô là mốc chuẩn của cả thang; đổi cô là đổi mọi thứ.

---

## 2. Cornova — *Corn Mortar* — ĐÃ CÓ

| Máu | Sát thương | Di chuyển |
|---|---|---|
| 8 | 2 | 2 |

- **Hạt Ngô** — `LOB 2`, 2 sát thương. Miễn phí. **Bay vòng qua mọi vật cản.**
- **Đạn Nova** — `LOB 3`, 1 sát thương + **choáng**. 50 Sol.

**Vai:** pháo binh tầm gần. Người duy nhất bắn được qua đầu tường nhà mình.
**Điểm yếu lõi:** tầm 2 và di chuyển 2 — phải bò lên sát tuyến với 4 máu.

**Nguồn:** hạ **Ironcart** (Goldacre) — con nã bạn từ ba ô suốt cả act.

**Chốt: giữ nguyên.** Đã qua một vòng cân bằng (LOB 3 → 2).

---

## 3. Thornquill — *Cactus* — MỚI

| Máu | Sát thương | Di chuyển |
|---|---|---|
| 6 | 1 | 2 |

- **Gai Xuyên** — `LINE 6`, 1 sát thương, **XUYÊN cả hàng**. Miễn phí.
- **Hàng Rào Gai** — `LINE 6`, 2 sát thương xuyên, và **các ô viên đạn đi qua mọc gai 2 lượt**
  (bất cứ ai bước vào chịu 1 sát thương). 50 Sol.

**Vai:** dọn đám đông xếp hàng — và là hero **địa hình** duy nhất trong bộ.
**Nguồn:** hạ **The Headliner** (Neon Rose), con trùm biến cả đám đông thành mối nguy.

**Vì sao 1 sát thương chứ không phải 2:** xuyên hàng **miễn phí** là thứ Peaburst phải trả 50
Sol mới có. Nếu Thornquill xuyên với 2 sát thương thì cô ấy là Peaburst phiên bản tốt hơn ở
mọi ô. Ở 1 sát thương, hai người trả lời hai câu hỏi khác nhau:

| Bàn cờ | Ai đúng |
|---|---|
| Một con Scrapcap 3 máu | **Peaburst** (2 dmg) — Thornquill cần 3 lượt |
| Bốn con Zombie 2 máu xếp hàng | **Thornquill** (4 ô × 1, hai lượt là sạch) |

**Điểm yếu lõi:** không dứt điểm được gì dày máu. Hàng fusion của cô phải xoay quanh **cộng sát
thương** hoặc **cộng số lần bắn**.

> Đây cũng là chỗ gắn luật **đối-không** nếu sau này làm (cận chiến không nhắm được `FLYING`).
> Hiện engine **không** có luật đó — tôi đã rà `getValidSkillTargets`, quân bay ai cũng bắn được.

---

# TẦM GẦN

## 4. Ironhusk — *Armor Plate* — ĐÃ CÓ

| Máu | Sát thương | Di chuyển |
|---|---|---|
| 10 | 1 | 2 |

- **Đập Khiên** — `MELEE 1`, 1 sát thương + **đẩy 1**. Miễn phí.
- **Càn Lăn** — `DASH 3`, 2 sát thương + đẩy. **35 Sol**. ✅ *(đã áp)*

**Vai:** chặn hành lang. Bắt buộc phải có vì luật mầm xoay quanh việc cản zombie.
**Nguồn:** hero khởi đầu.
**Điểm yếu lõi:** chặn tốt nhưng đóng góp ít.

**✅ Đã áp — giá Càn Lăn 25 → 35.** Đây là món hời nhất game — 2 sát thương + đẩy + lướt 3 ô,
trên thân 5 máu, giá **bằng nửa** mọi skill khác. Dồn cả 225 Sol cho riêng nó thì một mình
Ironhusk gây 14 sát thương + 7 cú đẩy, và cả đội không còn gì để tiêu. Thứ ghìm nó lại là lướt
= **rời vị trí chốt chặn**, nên 35 là đủ, không cần lên 50.

---

## 5. Snapmaw — *Steel Jaws* — ĐÃ CÓ

| Máu | Sát thương | Di chuyển |
|---|---|---|
| 8 | 2 | 3 |

- **Cắn** — `MELEE 1`, 2 sát thương. Miễn phí.
- **Nuốt Chửng** — `MELEE 1`, **7 sát thương**, **tiêu hoá 2 lượt**. **75 Sol**. ✅ *(đã áp)*

**Vai:** hành quyết mục tiêu dày máu.
**Nguồn:** hạ **Gravehulk** (Verdant Reach) — thứ to đến mức không đẩy nổi.
**Điểm yếu lõi:** hai lượt tiêu hoá hoàn toàn vô dụng.

**✅ Đã áp — và đổi cả bản chất, không chỉ cái giá.**

Giá 100 → 75 đúng như phân tích cũ: ở 100 nó **lỗ so với chính game**, vì 100 Sol mua được
**hai** phát Thiêu Nắng = 8 sát thương ở tầm 3 không kèm gì, còn Nuốt Chửng thì tầm 1 và cộng
2 lượt đứng không.

Nhưng thứ phải sửa trước cái giá là **`DAMAGE 999` → `DAMAGE 7`**. Con số ma cần một ngoại lệ
ma, và ngoại lệ mới là phần mục ruỗng: nó khoá theo `isMassive`, nên đúng ngày những con trùm
đầu tiên **cố ý không massive** được ship (để hai hero đẩy còn đất diễn), Nuốt Chửng xoá sổ
chúng bằng một nút bấm. Ngoại lệ giờ khoá theo `bossId`, và quan trọng hơn là **nó thôi gánh
việc nặng** — chặn một đòn 7 sát thương thì sai cũng không chết ai.

**Vì sao đúng 7:** đó là máu của thân xác dày nhất trong game mà không phải trùm — Cửa Lưới
hoặc Linebreaker ở màn **ELITE** (5 × 1,5). Nghĩa là Snapmaw vẫn nuốt trọn **mọi thứ không phải trùm**
trong một nhát, bản sắc không suy suyển, mà giờ nó là một con số biết gặp khiên, giáp và giảm
sát thương như mọi con số khác. Ở 5–6 thì đúng hai con elite đó sống sót — mà màn ELITE lại
chính là chỗ kỹ năng này mới có lãi.

Một tính chất rơi ra miễn phí: **tiêu hoá chỉ tính khi có xác** (`skillResolution` chỉ gắn
`digestingTurns` nếu action list có `UNIT_DIE`). Nên cắn trùm không giết được thì cũng **không
bị phạt 2 lượt** — cái giá chỉ thu khi phần thưởng đã trả.

---

## 6. Thornshell — *Spike Armor (sầu riêng)* — MỚI

| Máu | Sát thương | Di chuyển |
|---|---|---|
| 10 | 2 | 2 |

- **Gai Ngược** — `MELEE 1`, 2 sát thương. Miễn phí.
  **Bị động: kẻ nào đánh cận chiến vào Thornshell chịu 2 sát thương phản.**
- **Khiêu Khích** — mọi địch trong bán kính 3 **đổi mục tiêu sang Thornshell** ở lượt sau.
  50 Sol.

**Vai:** ép trận đấu diễn ra ở nơi mình chọn.

### Khiêu khích lấp một lỗ thật, không phải "thêm một tank"

Game có **ba loại quân được thiết kế riêng để đi vòng qua tường** — và chú thích trong
`data/zombies.ts` nói thẳng ra điều đó:

| Quân | Cách nó lách | Chú thích gốc trong code |
|---|---|---|
| Bóng Bay | bay qua tất cả | *"The answer to a turtled squad. It ignores walls, water and bodies entirely"* |
| Digger | `movementType: 'TELEPORT'` | trồi lên sau lưng |
| Catapult | `attackRange: 3` | *"Outranges every melee hero"* |

Với ba con này, **Ironhusk vô dụng hoàn toàn** — anh ta chỉ chặn được thứ chịu đi bộ vào mình.
Hiện tại cách duy nhất để xử chúng là giết, tức là quay về sát thương.

**Khiêu khích là câu trả lời thứ tư**, và là câu trả lời duy nhất hoạt động với cả ba: bay hay
độn thổ hay bắn xa cũng không thoát được việc *bị buộc phải đánh vào cái gai*.

**Phản đòn 2 sát thương** biến việc bị đánh thành nguồn sát thương — nên Khiêu Khích không chỉ
là phòng thủ, nó là **cách anh ta gây damage**. Bị bốn con vây đánh = 8 sát thương phản, không
tốn lượt nào.

**Điểm yếu lõi:** tự đi tấn công thì rất tệ — 2 sát thương, di chuyển 2, không đuổi kịp ai. Anh
ta chỉ mạnh khi **địch đến chỗ mình**. Hàng fusion phải xoay quanh **sống lâu hơn** và **phản
mạnh hơn**.

### Vì sao sầu riêng vào ghế này, chứ KHÔNG thay Snapmaw

Nếu sầu riêng **thay Snapmaw** thì mất công cụ duy nhất *xoá sổ một mục tiêu cụ thể*, và tổ cận
chiến còn lại đều là "trừng phạt kẻ tới gần mình".

Giữ Snapmaw thì được ba lối chơi khác hẳn nhau:

| Hero | Fantasy |
|---|---|
| **Ironhusk** | đứng yên, đẩy ra, **không cho ai qua** |
| **Snapmaw** | đi tới chỗ mối nguy lớn nhất và **xoá nó** |
| **Thornshell** | **kéo chúng về phía mình** rồi để chúng tự chảy máu |

**Nguồn:** hạ **Sandreaver** (Thornwaste) — con độn thổ trồi lên sau lưng tuyến của bạn. Khiêu
khích là thứ duy nhất nó không lách được: bay, độn thổ hay bắn xa cũng phải đánh vào cái gai.

---

# HỖ TRỢ

## 7. Sunbloom — *Sol Battery* — ĐÃ CÓ

| Máu | Sát thương | Di chuyển |
|---|---|---|
| 6 | 0 | 2 |

- **Thu Hoạch** — `SELF`, +25 Sol. Miễn phí, nhưng **tốn trọn lượt**.
- **Thiêu Nắng** — `LOB 3`, **4 sát thương**. 50 Sol. *(sát thương đơn mục tiêu cao nhất game)*

**Vai:** kinh tế Sol.
**Nguồn:** hero khởi đầu.
**Điểm yếu lõi:** không tự vệ được, phải hộ tống.

**⚠ Cần theo dõi: Thu Hoạch đã mất giá.** Từ khi có trợ cấp cố định `SUN_PER_TURN_INCOME = 25`,
Thu Hoạch cho +25 — **đúng bằng số cả đội vẫn nhận miễn phí**. Cô ấy giờ là *hệ số nhân* cho
khoản tiền vốn đã có, chứ không còn là nguồn tiền duy nhất. Chưa hỏng (25→50/lượt vẫn là gấp
đôi số lần cả đội bấm được skill), nhưng lý do tồn tại của cô đã mỏng đi một tầng. **Chưa sửa —
ghi lại để canh.**

---

## 8. Chardslam — *Spring Arm* — MỚI

| Máu | Sát thương | Di chuyển |
|---|---|---|
| 8 | **0** | 3 |

- **Hất Ngược** — `MELEE 1`, **0 sát thương, đẩy 2 ô**. Miễn phí.
- **Càn Quét** — đẩy **mọi địch kề** 2 ô. 50 Sol.

**Vai:** đổi vị trí thuần. Anh ta **không giết bằng sát thương, anh ta giết bằng địa hình.**
**Nguồn:** hạ **The Armada** (Windward) — hạm đội bay qua đầu mọi bức tường.

**Vì sao 0 sát thương:** đó là toàn bộ bản sắc. Đẩy 2 ô nghĩa là:

| Đẩy vào | Kết quả |
|---|---|
| Quân khác / núi / rìa bản đồ | **cả hai** chịu 1 sát thương *(luật va chạm)* |
| Nước | **chết ngay** (`DROWN`) |
| Dung nham | 1 sát thương + cháy |
| Chỗ trống | mua đứt một lượt — nó không tới được nhà |

Trên bản đồ **Windward (bờ biển)** — chính khu vực thả anh ta ra — mặt nước biến thành vũ khí.
Hạm đội bay qua đầu tường thì bạn **thôi xây tường và hất chúng xuống biển**.

**Điểm yếu lõi:** trên bàn cờ trống trơn, không nước không núi, anh ta gần như vô hại. Hàng
fusion phải cho anh **cách tự gây sát thương** hoặc **đẩy xa hơn**.

**Ironhusk ↔ Chardslam:** Ironhusk **chặn** (đứng yên, ai tới thì đẩy 1), Chardslam **ném đi**
(chủ động lao tới, hất 2). Hai câu trả lời khác hẳn nhau cho cùng bài toán hành lang.

---

## 9. Gourdward — *Bunker Shell* — MỚI

| Máu | Sát thương | Di chuyển |
|---|---|---|
| 8 | 1 | 3 |

- **Vỏ Bí** — `MELEE 1`, 1 sát thương. Miễn phí.
- **Bọc Giáp** — cho một đồng đội **5 khiên**. Khiên chặn sát thương trước máu và **không mất
  đi khi hết lượt**. 50 Sol. *(3 → 5 khi thang máu nhân đôi: khiên đo bằng thân xác nó che,
  và 5 là mức nuốt trọn một đòn trùm.)*

**Vai:** giữ cho hero sống sót — **trục duy nhất cả game chưa có ai làm.**
**Nguồn:** hạ **Clockjaw** (Old Quarter) — con hành động hai lần mỗi lượt, sát thương của nó không cách nào ngăn kịp.

### Không có gì hồi máu hay chắn máu trong trận

Tôi đã rà toàn bộ `data/`: **không một skill nào dùng `type: 'HEAL'`**. Hồi máu chỉ tồn tại ở
lửa trại, giữa các trận. Mà **máu giờ persist giữa các trận** — nghĩa là mỗi điểm máu mất đi
trong trận này là một khoản nợ mang sang trận sau.

Trong bối cảnh đó, một hero giữ máu cho đội **không phải là hỗ trợ nhàm chán, nó là kinh tế** —
đúng loại kinh tế mà Sunbloom không đụng tới.

### Vì sao khiên chứ không phải hồi máu

Vì trò chơi này được xây trên **telegraph**: mọi đòn đánh đều báo trước một lượt, vạch đỏ ghi
rõ sát thương. Nên "chắn trước đòn mà bảng báo đã chỉ ra" là **một quyết định đọc bàn cờ**;
"hồi lại máu đã mất" chỉ là dọn dẹp hậu quả.

Khiên thưởng cho việc nhìn trước. Hồi máu thưởng cho việc nhìn lại.

`SHIELD` và `unit.shield` **đã nối dây sẵn** trong engine (`calculateDamage` xử lý shieldDamage),
nên trục này gần như không tốn code.

**Điểm yếu lõi:** một mình anh ta không thắng được gì — 1 sát thương, không khống chế. Giá trị
của anh ta **bằng giá trị của người anh ta bảo vệ**.

---

# Đối chiếu cuối

| Class | Hero | Máu | Dmg | Move | Đánh thường | Skill |
|---|---|---|---|---|---|---|
| Xa | Peaburst | 6 | 2 | 3 | LINE 8 | xuyên 3 dmg @50 |
| Xa | Cornova | 8 | 2 | 2 | LOB 2 *(vòng)* | choáng @50 |
| Xa | Thornquill | 6 | 1 | 2 | LINE 6 *(xuyên)* | gai + địa hình @50 |
| Gần | Ironhusk | 10 | 1 | 2 | MELEE + đẩy 1 | lướt 3 @**35** |
| Gần | Snapmaw | 8 | 2 | 3 | MELEE | **7 dmg** @**75** |
| Gần | **Thornshell** | 10 | 2 | 2 | MELEE + **phản 2** | **khiêu khích** @50 |
| Hỗ | Sunbloom | 6 | 0 | 2 | +25 Sol | 4 dmg @50 |
| Hỗ | Chardslam | 8 | 0 | 3 | **đẩy 2** | đẩy vòng @50 |
| Hỗ | **Gourdward** | 8 | 1 | 3 | MELEE | **5 khiên** @50 |

**Máu:** 6·6·6·8·8·8·10·10 — dải hẹp, đúng ý: mất một hero là mất 1/3 đội, nên không ai được
mỏng manh quá.

> **Thang máu đã nhân đôi** so với bản nháp đầu (3/4/5 → 6/8/10), và **đã áp vào code**.
> Lý do đầy đủ nằm ở `PLAN-boards-bosses.md` mục 6; gọn lại: máu persist giữa các trận và
> element trừ máu tối đa, nên ở nền cũ một hero mang element chết vì **một** con Scrapcap.
> Giá element nhân đôi theo (**−2 máu tối đa**) nên tỉ lệ chịu đau giữ nguyên −20/−25/−33%.
> Sát thương hero và máu zombie **không đổi** — thời gian giết mọi thứ y hệt như cũ.

**Sát thương:** hai hero **0 sát thương** (Sunbloom, Chardslam) là cố ý — chúng chứng minh rằng
trong game này *sát thương không phải con đường duy nhất để thắng*.

**Ba giá skill: 35 · 50 · 75.** Với ngân sách 225 Sol/trận cho cả ba hero, đội "toàn 50" bấm
được ~4 lần cả trận. Đội có Ironhusk (35) bấm nhiều hơn nhưng mỗi lần nhẹ hơn. Đó là một quyết
định xây đội thật.

---

# Việc còn treo

| # | Việc | Ghi chú |
|---|---|---|
| 1 | ✅ Nuốt Chửng 999 → **7 dmg** @ **75 Sol**; ✅ Càn Lăn **25 → 35 Sol** | `data/heroes.ts` |
| 2 | Cơ chế mới cho 3 hero | Thornquill (xuyên ở **đánh thường**), Thornshell (**khiêu khích** + phản đòn), Chardslam (**đẩy 2 ô**) |
| 3 | `TAUNT` — ép `aiLogic` đổi mục tiêu | chưa có gì tương tự trong engine; đây là phần khó nhất |
| 4 | Đẩy 2 ô (`KNOCKBACK`) | bậc trên của `PUSH` đã có — phải kiểm va chạm dây chuyền |
| 5 | Hàng fusion cho 4 hero mới | 4 × 9 = 36 ô |
| 6 | Art: 4 hero × (gốc + 3 element) | **12 sprite mới** — làm sau khi chốt `HeroDefinition.forms` |
