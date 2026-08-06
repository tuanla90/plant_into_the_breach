# Lộ trình tiến trình — 3 Stage · 9 Hero · 9 Gear · 3 Element

> Trạng thái: **kế hoạch**, trừ mục 5 (XP/cấp) đã áp vào code.
>
> Cấu trúc đã chốt:
> - **3 Stage**, mỗi Stage **3 boss**
> - 2 boss đầu mỗi Stage → **hero**; boss cuối Stage → **element (biến thể)**
> - 3 element: **BĂNG** (làm chậm) · **LỬA** (cháy dai) · **ĐIỆN** (đánh lan)
> - Element áp cho **mọi hero**, không riêng đậu
> - **Màn cuối** đứng riêng: đấu trùm liên hoàn, không có luật mầm

---

## 1. Phép tính khép kín

| | Số | |
|---|---|---|
| Stage | 3 | |
| Boss mỗi stage | 3 | 2 trả hero + 1 trả element |
| **Hero từ boss** | **6** | |
| Hero khởi đầu | 3 | Peaburst · Ironhusk · Sunbloom |
| **Tổng roster** | **9** | 3 class × 3 lựa chọn — **hết, không có thứ 10** |
| Gear | **9** | đúng 9 cây gốc của 9 hero |
| **Element** | **3** | mỗi stage một cái |
| **Cấu hình hero** | **36** | 9 × (gốc + 3 element) |
| **Ma trận fusion** | **81** | 9 × 9 |

Không thừa không thiếu. Và mỗi Stage kể một câu chuyện trọn vẹn: hai người gia nhập, rồi bạn
**cướp được sức mạnh của vùng đất đó**.

---

## 2. Chín hero, ba class

| Class | | | |
|---|---|---|---|
| **TẦM XA** | **Peaburst** *(Seed Gun)* | **Cornova** *(Corn Mortar)* | **Thornquill** *(Cactus)* |
| **TẦM GẦN** | **Ironhusk** *(Armor Plate)* | **Snapmaw** *(Steel Jaws)* | **Thornshell** *(Spike Armor — sầu riêng)* |
| **HỖ TRỢ** | **Sunbloom** *(Sol Battery)* | **Chardslam** *(Spring Arm)* | **Gourdward** *(Bunker Shell)* |

**Không có hero thứ 10.** Phần thưởng sau boss rush là một **kết truyện**, không phải một dòng
nữa trong bảng — xem mục 3quater.

Mỗi class 3 lựa chọn, đội 3 người → **84 tổ hợp roster**, nhân tiếp với element thành hàng
nghìn cấu hình. Đó là con số chơi lại thật, không phải con số quảng cáo.

### Vai trong từng class không trùng nhau

| Hero | Nó giải bài toán gì |
|---|---|
| Peaburst | sát thương thẳng, tầm xa nhất |
| Cornova | bắn vòng qua đầu tường + choáng |
| Thornquill | xuyên cả hàng (và là chỗ gắn luật đối-không nếu làm) |
| Ironhusk | chặn hành lang, đẩy 1 ô |
| Snapmaw | hành quyết mục tiêu dày máu |
| Thornshell | **khiêu khích** — ép địch phải đánh mình, và phản đòn kẻ nào chạm vào |
| Sunbloom | kinh tế Sol |
| Chardslam | hất ngược 2 ô — biến nước và núi thành vũ khí |
| Gourdward | **khiên** — chắn trước đòn mà bản telegraph đã báo |

---

## 3. Ba element — phải là LUẬT, không phải bộ kỹ năng riêng

Đây là điểm quyết định cả kế hoạch sống hay chết.

**Nếu mỗi element trên mỗi hero là một bộ kỹ năng viết tay** → 9 × 3 = **27 bộ kit** phải thiết
kế, cân bằng, viết mô tả và vẽ art. Không làm nổi.

**Nếu mỗi element là MỘT LUẬT áp lên bất kỳ hero nào** → **3 luật**. Toàn bộ 36 cấu hình sinh
ra miễn phí, và cái "đội toàn băng / toàn lửa / toàn điện" bạn muốn tự nó xuất hiện.

| Element | Luật | Giá |
|---|---|---|
| **BĂNG** | mọi đòn đánh **làm chậm** | **−1 máu tối đa** |
| **LỬA** | mọi đòn đánh **gây cháy** (1 sát thương/lượt) | **−1 máu tối đa** |
| **ĐIỆN** | mọi đòn đánh **lan sang 1 địch kề mục tiêu** (nửa sát thương) | **−1 máu tối đa** |

### Vì sao giá là MÁU chứ không phải sát thương

Bản nháp đầu tính giá bằng "−1 sát thương". Đối chiếu với chỉ số thật thì nó hỏng với **một
nửa roster**:

| Hero | Sát thương | Sau khi −1 |
|---|---|---|
| Peaburst · Snapmaw · Cornova | 2 | 1 |
| **Ironhusk** | **1** | **0** |
| **Sunbloom** | **0** | **0** |

Trừ một số cố định trên một nền chỉ chạy từ 0 đến 2 thì không phải là cái giá — nó là **−100%
với người này và −0% với người kia**. ("−1 tầm" của LỬA cũng cùng bệnh: Ironhusk và Snapmaw tầm 1.)

**Máu thì ai cũng có, và có nhiều:**

| Hero | Máu | Mang element |
|---|---|---|
| Ironhusk | 5 → 4 | −20% |
| Snapmaw · Cornova | 4 → 3 | −25% |
| Peaburst · Sunbloom | 3 → 2 | −33% |

Không ai về 0, ai cũng thấy đau. Và vì **máu persist giữa các trận**, −1 máu là khoản chi thật.
Đội đồng nguyên tố tốn −3 máu toàn đội — đúng giá cho phần cộng hưởng.

### Và đây là chỗ hay nhất của hệ

Ironhusk gây 1 sát thương vì **sát thương chưa bao giờ là việc của anh ta** — cú đập là để đẩy.
Gắn băng/lửa/điện lên một cú đập 1 damage thì bức tường từ chỗ chỉ biết chặn thành chỗ **mỗi
cú chạm đều để lại hậu quả**.

> **Element biến đổi mạnh nhất đúng ở những hero mà sát thương không phải điểm mạnh.**

Ô tưởng là hỏng lại là ô thú vị nhất. Cả ba element **đổi chiều chứ không nâng cấp** — bản gốc
giữ máu đầy, nên nó vẫn đúng ở những bàn mà sống sót quan trọng hơn hiệu ứng.

### Luật áp element — bốn dòng, không có ngoại lệ

Đối chiếu ba luật với **chín hero thật** thì lộ ra bốn ca cần chốt. Bốn dòng dưới đây xử hết,
và quan trọng là chúng **không phải bốn ngoại lệ** — chúng là cách phát biểu chính xác của
cùng ba luật.

#### L1 — Element bám vào ĐÒN ĐÁNH, không bám vào SÁT THƯƠNG

Hai hero có **0 sát thương** (Sunbloom, Chardslam). Nếu element phát biểu là "thêm hiệu ứng lên
sát thương" thì cả hai đứng ngoài hệ.

> **Element gắn thêm một hiệu ứng vào đòn đánh, bất kể đòn đó gây bao nhiêu sát thương.**

- Chardslam đẩy 0 sát thương + BĂNG → mục tiêu **bị đẩy và bị làm chậm**. Chạy tốt.
- Chardslam + LỬA → bị đẩy và bốc cháy. Chạy tốt.

#### L2 — Hero không có đòn đánh thì element áp lên SKILL

Sunbloom đánh thường là `SELF` (+25 Sol), không nhắm ai. Với cô, element áp lên **Thiêu Nắng**.
Đây là hero duy nhất rơi vào ca này.

#### L3 — ĐIỆN lan **một lần**, từ **mục tiêu chính**, sát thương = **½ chỉ số sát thương của HERO**

Ba cái bẫy, xử bằng đúng một câu:

| Bẫy | Nếu phát biểu ẩu | Với L3 |
|---|---|---|
| **Snapmaw + ĐIỆN** — Nuốt Chửng là `DAMAGE 999` | lan **499 sát thương** sang con bên cạnh *(đúng con bug Melon-splash đã bàn)* | Snapmaw damage 2 → lan **1**. Hết bẫy. |
| **Thornquill + ĐIỆN** — đòn thường xuyên cả hàng | 4 mục tiêu, mỗi con lan 1 = **8 mục tiêu miễn phí** | lan **một lần từ mục tiêu chính** → 4 xuyên + 1 lan |
| **Chardslam + ĐIỆN** — 0 sát thương | ½ của 0 = 0, ô chết | lan mang theo **cú đẩy** (L1), sát thương 0 — cú hất **dội sang con phía sau** |

Chardslam + ĐIỆN nhờ vậy lại thành ô hay nhất của anh ta: **một cú hất đẩy hai con**.

> Làm tròn **xuống, không có sàn tối thiểu**: hero 0–1 sát thương thì tia lan chỉ mang hiệu ứng,
> không mang sát thương. Đó là cố ý — nếu có sàn "tối thiểu 1" thì Chardslam tự nhiên có sát
> thương, phá vỡ bản sắc 0-damage của anh.

#### L4 — Element áp cho **mọi nguồn sát thương của hero, kể cả phản đòn**

Thornshell phản 2 sát thương lên kẻ đánh cận chiến vào mình. Element có áp lên đó không?

> **Có.** Element là thuộc tính của hero, không phải của một chiêu.

Và đây là ô mạnh nhất trong cả ma trận 27 ô: **Thornshell + BĂNG** = khiêu khích kéo cả bầy vào
mình, rồi **mọi con chạm vào anh ta đều bị làm chậm**. Nó xứng đáng mạnh — anh ta trả 1 máu tối
đa trên một thân xác mà công việc *chính là bị đánh*, và anh ta chỉ gây 2 sát thương, không đuổi
được ai.

**⚠ Cần chơi thử trước khi chốt.** Đây là ô duy nhất tôi không dám khẳng định bằng suy luận.

### Bảng đối chiếu 27 ô

| Hero | BĂNG | LỬA | ĐIỆN |
|---|---|---|---|
| Peaburst | chuẩn | chuẩn | chuẩn |
| Cornova | chồng với choáng của cô — vẫn ổn | chuẩn | chuẩn |
| Thornquill | xuyên + chậm cả hàng — **mạnh** | xuyên + cháy cả hàng — **mạnh** | L3: xuyên + lan 1, 0 sát thương |
| Ironhusk | đẩy + chậm — **rất hợp** | đẩy + cháy | đẩy, lan 0 sát thương |
| Snapmaw | trên cú cắn | trên cú cắn | L3: lan 1 |
| Thornshell | L4 — **ô mạnh nhất** | L4 — kẻ đánh mình thì bốc cháy | L4 — phản dội sang con kề |
| Sunbloom | L2 — Thiêu Nắng làm chậm | L2 — Thiêu Nắng đốt | L2 — Thiêu Nắng lan 0 |
| Chardslam | L1 — đẩy + chậm | L1 — đẩy + cháy | L1+L3 — **hất hai con** |
| Gourdward | chuẩn (yếu) | chuẩn (yếu) | chuẩn (yếu) |

Không ô nào chết. Ba ô của Gourdward nhạt — chấp nhận được, vì giá trị của anh ta nằm ở khiên
chứ không ở đòn đánh.

### Thưởng cho đội đồng nguyên tố

"Đội toàn băng" nên là **chiến thuật**, không chỉ là màu sắc. Đề xuất: 3/3 cùng element thì mở
một hiệu ứng cộng hưởng.

| Đội | Cộng hưởng gợi ý |
|---|---|
| Toàn BĂNG | địch bị làm chậm **hai lần liên tiếp** thì đóng băng hẳn |
| Toàn LỬA | ô có địch cháy chết sẽ **bốc lửa** |
| Toàn ĐIỆN | tia lan có thể **nhảy tiếp** một nấc nữa |

Đây là thứ biến 84 tổ hợp roster thành 84 tổ hợp *có lý do*.

---

## 3ter. Tua Lại Lượt — sức mạnh của cỗ xe, có sẵn từ đầu

**Stim Shot không còn là hero.** Ý tưởng đó tách thành hai đường, và cả hai đều KHÔNG phải
một nhân vật:

| | Là gì | Đi đâu |
|---|---|---|
| **Tua Lại Lượt** | tiện ích | **cỗ máy thời gian Chrona** — có sẵn từ đầu, 1 lần/trận |
| **Thêm hành động** | sức mạnh | **vật phẩm**, mua bằng Xu như Lựu Đạn Lửa / Mìn Hạt |

### Cái này KHÔNG phải thêm lore — nó là biến một câu đã có thành cơ chế

Trong `i18n/vi.ts` đã có sẵn, từ trước khi bàn tới chuyện này:

> *"Mỗi dòng thời gian thất thủ, Chrona lại mở một dòng khác. Cho tới khi có một dòng trụ vững."*

Đó **chính xác là nút Tua Lại**, viết bằng lời. Cỗ xe đã hứa điều đó với người chơi ở màn thua
rồi; giờ chỉ là để nó giữ lời ngay trong trận. Chrona vẫn là **cỗ máy, không phải hero** —
đúng vai cô đã đóng từ đầu.

### Vì sao miễn phí ngay từ đầu

Đây là game **thông tin hoàn hảo** — mọi đòn đánh báo trước một lượt kèm số sát thương, nghĩa
là **luôn tồn tại nước đi đúng**. Một game như thế mà phạt người chơi vì **bấm nhầm ô** thì đã
biến bài toán suy luận thành bài kiểm tra thao tác. Into the Breach cho Reset Turn từ nhiệm vụ
đầu tiên, và đó là lý do.

Nó cũng làm dịu luật khắc nghiệt nhất của game (mất sạch mầm trên một bàn = hết run) **mà không
làm luật đó yếu đi**: hoàn tác được một cú bấm nhầm, không hoàn tác được một kế hoạch tồi.

### Cài đặt: khả thi và rẻ

- State là object thuần, serialize được — `runPersistence.ts` đã lưu nguyên `gameState` +
  `units` xuống localStorage rồi dựng lại.
- Chụp ảnh đúng một mốc: ngay sau `NEW_TURN_RESET` (`turnManager.ts:765`).
- **Chụp SAU khi intent địch đã chốt** là điều cốt lõi: tua lại phải trả về *đúng bàn cờ đó*,
  không quay số lại. Tua lại mà intent đổi thì nó là máy đánh bạc, không phải nút hoàn tác.
- Chỉ bấm được khi `interactionMode === 'IDLE'`.

Ước lượng ~50 dòng + một nút HUD.

### Phần "thêm hành động" thì ĐÃ CÓ SẴN RỒI

`data/items.ts` đã có, không phải làm gì:

```ts
{ id: 'stim_shot', name: 'Stim Shot', coinCost: 100, effect: 'REFRESH',
  description: 'One hero that has already acted may move and act again this turn.' }
```

Và chú thích trong file gọi nó là *"thứ mạnh nhất trong hộp"* — đúng chỗ cho một hiệu ứng như
vậy: **mua được, dùng một lần, không phải một nhân vật đi theo bạn cả run.**

---

## 3quater. Phần thưởng sau boss rush — **một chậu cây**

Không phải hero. Không phải gear. Không phải chỉ số.

**Một chậu đất, một mầm xanh.** Thứ đầu tiên mọc lại sau tất cả.

Cả game là chuyện giữ mầm cho người khác — giữ những gì còn sót lại của một thế giới đã mất.
Phần thưởng cho việc đi hết chặng đường đó không nên là **thêm một công cụ để đánh nhau**, vì
đánh nhau đã xong rồi. Nó nên là **bằng chứng rằng việc giữ ấy có ý nghĩa**.

Gợi ý cách nó tồn tại trong game (rẻ, và không đụng vào cân bằng):

- Chậu cây **hiện trên màn hình chính** sau khi hoàn thành boss rush — mầm xanh giữa thành phố
  đổ nát ở key art.
- Nó **lớn dần** theo số lần bạn hoàn thành lại: mầm → cây con → cây có hoa.
- Không cho chỉ số nào. **Đó chính là điểm.**

Nếu sau này cần một phần thưởng *có cơ chế* cho người chơi hết nội dung, `DESIGN.md` mục 6 đã
để dành sẵn hai thứ: **công thức đặc biệt** và **Titan Fusion**. Chúng thuộc về New Game+, không
thuộc về cái chậu.

---

## 4. Hệ quả — ba thứ phải chấp nhận

### 4.1. Frostpod và Emberwood không còn là hero

Băng và lửa giờ là **element của mọi người**. Giữ thêm một hero chuyên băng là giữ lại đúng
phần lặp mà cả thiết kế này sinh ra để bỏ.

**Cái giá là nội dung đã ship:** `COLD_SNAP` đang có hero definition, 6 công thức fusion, sprite,
thẻ art và i18n. Chuyển đổi:

- **Kit của Frostpod → luật BĂNG.** Làm chậm mọi đòn, −1 sát thương: đó chính xác là cô ấy.
- **Art của Frostpod → sprite dạng Băng của Peaburst.** Không phí một nét vẽ nào.
- **`Blizzard` (chậm → đóng băng) → cộng hưởng đội toàn Băng.** Đúng chỗ hơn cả chỗ cũ.
- **Emberwood chưa dựng** nên không mất gì; `PLAN-pack-6-emberwood.md` trở thành tài liệu thiết
  kế cho **luật LỬA** (ô lửa, `fireTurns`, `RETALIATE_BURN`… vẫn dùng được nguyên).

Cần migration cho save cũ: hero `COLD_SNAP` và 6 công thức của cô phải map sang Peaburst +
element Băng, không được xoá trắng.

### 4.2. Ba gear trở nên thừa

Element đã ôm **làm chậm, cháy, đánh lan**. Nên Ice Grenade / Fire Pea / Lightning Reed không còn
chỗ trong pool gear — nếu giữ, người chơi sẽ hỏi "cái này khác gì element băng?".

Pool gear mới, 9 cây, không trục nào đụng element:

| # | Gear | Trục |
|---|---|---|
| 1 | Seed Gun | đánh thêm phát nữa |
| 2 | Armor Plate | +máu / chống chịu |
| 3 | Sol Battery | kinh tế |
| 4 | Steel Jaws | phản đòn / hành quyết |
| 5 | Corn Mortar | đường vòng (bỏ qua vật cản) |
| 6 | Cactus | xuyên hàng |
| 7 | Spring Arm | đẩy mạnh 2 ô |
| 8 | **Spike Armor** | **phản đòn gai** |
| 9 | **Bunker Shell** | **khiên** |

→ Ma trận **9 hero × 9 gear = 81 công thức**, trần cấp 81.

**Chín gear = đúng chín cây gốc của chín hero.** Không ngoại lệ, không cây mồ côi.

### Gear có hai công dụng, và chỉ được chọn một

Luật này **đã chạy trong code** (`BenchPlant` → `buildBenchUnit` / `applyFusion`):

| Dùng làm | Nghĩa là |
|---|---|
| **Quân dự bị** | mang ra trận như một unit thật — chặn zombie, đánh, lấp chỗ hero đã gục |
| **Nguyên liệu fusion** | nướng vĩnh viễn vào một hero để đổi lấy một đặc tính |

Chọn cái này là mất cái kia. Và vì cây ra trận **hao mòn 1 máu vĩnh viễn mỗi lần**, còn ghép
thì **cần cây còn lành** — sự hao mòn chính là đồng hồ đếm ngược cho quyết định đó.

**Việc phải làm:** `Spring Arm` chưa có trong `UnitClass` (0 kết quả trong `types.ts`). Mọi
gear đều phải triển khai được ra bàn cờ, nên nó cần một entry enum + `benchStats`.

### 4.3. Công thức fusion gắn với HERO, không gắn với dạng

Nếu Peaburst-Băng + Armor Plate là một công thức khác Peaburst-Lửa + Armor Plate thì ma trận thành
**36 × 9 = 324 ô**. Không đời nào viết nổi.

**Luật: fusion nằm trên hero, element nằm chồng lên.** Đổi element giữa stage **không** mất gear
đã hợp — nếu không, đổi element thành hình phạt và chẳng ai đổi.

---

## 5. XP và cấp — ĐÃ ÁP VÀO CODE

| | Cũ | Mới |
|---|---|---|
| Giá mỗi cấp | `100 + 50×(n−1)` | **250, cố định** |
| Công thức mỗi cấp | 1 | **1** *(là định nghĩa)* |
| Trần cấp | không | **`số hero × số gear`** |
| Thưởng lớn nhất | hạ trùm (60) | **qua một act (120)** |

**Trần = số cặp ghép tồn tại cho những gì bạn sở hữu.** 3 hero × 3 gear → trần 9; 4 × 4 → 16;
9 × 9 → 81. Vì 1 cấp = 1 công thức nên **cấp chính là số công thức đã biết** — luật đọc thẳng
ra từ Kho Lưu Trữ, không cần ai giải thích.

```
qua act 1 rồi chết      = 305 XP → 1,2 cấp
chết giữa act 2         = 330 XP → 1,3 cấp
TRỌN 3 act (1 stage)    = 710 XP → 2,8 cấp
```

XP vượt trần **không mất** — nó bung ra ngay khi hạ boss nới trần.

**Núm vặn:** `XP_PER_LEVEL`, `XP_PER_ACT`, `levelCapFor` trong `data/unlocks.ts`;
`RECIPES_PER_LEVEL` trong `utils/unlockLogic.ts`.

---

## 6. Chín con boss

Nguyên tắc ghép giữ nguyên: **boss là mối đe doạ, phần thưởng là câu trả lời cho chính nó.**

### STAGE I — **Vành Đai Xanh** *(quê nhà)*

| Act | Khu vực | Boss | Trả về |
|---|---|---|---|
| 1 | Verdant Reach | **Gravehulk** — to đến mức không đẩy nổi | **Snapmaw** — cái mồm nuốt được thứ lớn |
| 2 | Goldacre *(Wild West)* | **Ironcart** — nã bạn từ 3 ô, tường vô dụng | **Cornova** — khẩu cối bắn vòng |
| 3 | Kiln Row *(núi lửa)* | **Cinder Colossus** — đốt mặt đất nó đi qua | 🔥 **ELEMENT LỬA** |

### STAGE II — **Bờ Xa** *(bên kia mặt nước)*

| Act | Khu vực | Boss | Trả về |
|---|---|---|---|
| 1 | Windward *(bờ biển)* | **The Armada** — bay qua đầu tường | **Chardslam** — hất chúng xuống biển |
| 2 | Thornwaste *(sa mạc gai)* | **Sandreaver** — độn thổ, trồi lên **sau lưng** tuyến của bạn | **Thornshell** — khiêu khích: độn thổ cũng không thoát được việc bị ép đánh vào cái gai |
| 3 | Frostgate *(băng)* | **Yeti** — đóng băng mọi thứ | ❄️ **ELEMENT BĂNG** |

### STAGE III — **Thành Phố** *(nơi mọi thứ bắt đầu)*

| Act | Khu vực | Boss | Trả về |
|---|---|---|---|
| 1 | Neon Rose | **The Headliner** — biến **cả đám đông** thành mối nguy | **Thornquill** — mũi gai xuyên suốt cả hàng |
| 2 | Old Quarter | **Clockjaw** — hành động **hai lần mỗi lượt**, sát thương không cách nào ngăn kịp | **Gourdward** — không ngăn được thì **chắn**: 3 khiên |
| 3 | The Grid | **Voltmaw** — điện giật lan cả hàng | ⚡ **ELEMENT ĐIỆN** |

### MÀN CUỐI — **The Breach**

Đấu trùm liên hoàn, **không có luật mầm**: 9 boss cũ rồi tới **Blightlord**.

---

## 7. Màn cuối: engine đã đỡ sẵn gần hết

Luật thua theo mầm trong `turnManager.ts` **đã được chặn bằng `length > 0`**:

```ts
const housesOnScriptBoard = currentBoard.filter(t => t.isHouse);
if (housesOnScriptBoard.length > 0 && <hết mầm>) → GAME_OVER
```

Bàn cờ **không có ô nhà** thì luật mầm đơn giản không tồn tại. Không cần cờ mới. Cộng thêm
`KILL_ALL` đã là objective **duy nhất kết thúc sớm** khi bàn cờ sạch — đúng thứ một trận đấu
trùm cần.

**Trận đấu trùm thuần = map không ô nhà + mission `KILL_ALL`.**

### Cấu trúc kiểu Mega Man

```
CHỌN BOSS → đấu → TRẠM → chọn boss tiếp → đấu → TRẠM → … → BLIGHTLORD
```

- **Trạm dừng** giữa hai con trùm: **hồi máu · mua đồ · nâng cấp**. Dùng lại nguyên màn lửa
  trại và shop, không viết màn mới.
- **Người chơi chọn thứ tự** như Mega Man chọn robot master. Với hệ element thì **thứ tự boss
  chính là bài toán khắc chế**, nên đây là quyết định thật chứ không phải trang trí.
- **Tự resume, miễn phí:** `runPersistence` đã lưu tại `MAP`/`SHOP`/`EVENT`, mà trạm dừng là
  một trong số đó. Chuỗi dài vẫn chơi được qua nhiều buổi mà không phải viết gì thêm.

Ba việc nhỏ còn lại:

1. HUD giấu ô NÃO khi bàn cờ không có nhà.
2. Bỏ bonus `NO_BRAIN_LOST` (luôn đúng = tiền miễn phí).
3. **Máu hero giữa các trận trùm** — máu persist, nên chuỗi trùm với một thanh máu chung là
   **quyết định thiết kế**: trạm dừng hồi bao nhiêu chính là núm vặn độ khó của cả màn cuối.

### Rủi ro nhịp độ, tính bằng số

9 boss cũ + Blightlord = **10 trận**. Ở nhịp 7 lượt/trận là **70 lượt** cho một lần ngồi.

Cách xử: bàn cờ rush **nhỏ hơn (6×6), ít hoặc không quái lính** → mỗi trận ~4–5 lượt, còn ~50
lượt, chia bởi 9 trạm nghỉ. Nếu vẫn dài, bản đầu chỉ lấy **3 boss element + Blightlord**
(4 trận, 3 trạm) và để dành chuỗi 10 con làm chế độ *true rush* mở sau.

---

## 8. Việc phải làm

| # | Việc | Ghi chú |
|---|---|---|
| 1 | ✅ XP phẳng + 1 công thức/cấp + trần `hero × gear` | đã áp |
| 2 | ✅ `BossId` + bảng boss + hero trao lúc hạ boss | đã áp — **cần mở từ 7 lên 9 dòng** |
| 3 | **`HeroDefinition.forms`** — tầng element | **thay đổi kiểu dữ liệu lớn nhất; làm TRƯỚC khi vẽ art** |
| 4 | 3 luật element + 2 cách đọc (đánh / hỗ trợ) | ~3 hiệu ứng mới trong `applyFusionToSkill` |
| 5 | Retire `COLD_SNAP` → luật BĂNG + migration save | có mất mát, mục 4.1 |
| 6 | Pool gear 9 cây, bỏ Ice Grenade / Fire Pea | mục 4.2 |
| 7 | Cộng hưởng đội đồng nguyên tố | mục 3 |
| 8 | `WorldType` 4 → 8 khu vực | + hazard cho khu vực mới |
| 9 | 3 hero mới + 9 encounter boss + art | nặng nhất |
| 10 | Màn cuối `KILL_ALL` không nhà | mục 7 |

---

## 9. Rủi ro

1. **Element đồng nhất sẽ có ô nhạt.** Ba luật × chín hero = 27 ô, và không phải ô nào cũng
   thú vị. Chấp nhận vài ô "chỉ ổn" — nhưng **không ô nào được vô dụng**, xem mục 3.
2. **81 công thức vẫn là 81 dòng chữ.** Cộng 27 mô tả element. Chốt sớm: ô nhạt có cần tên
   riêng không, hay chỉ cần mô tả hiệu ứng?
3. **Cân bằng phình theo bình phương.** Hero thứ 9 phải cân với 9 gear **và** 3 element.
4. **Ma trận Kho Lưu Trữ 9 × 9 sẽ tràn màn hình.** `sticky` hàng/cột đã có, chỉ cần thu ô lại.
5. **Retire một hero đã ship là việc dễ làm hỏng save.** Viết migration trước, xoá sau.
