# Blightfall: The Last Garden — Thiết kế lõi

Tài liệu này định nghĩa **luật chơi cốt lõi** và **hệ thống kinh tế**.
Khác với `brainstorm_balance.md` (bàn về cân bằng chỉ số), tài liệu này trả lời câu hỏi
*game này là gì* — nên nó được quyết trước, và mọi con số cân bằng đều suy ra từ đây.

---

## 0. Vấn đề đang phải sửa

Ở phiên bản hiện tại, chiến thuật tối ưu là **giấu một cây vào góc và bấm End Turn 7 lần**.

Đã kiểm chứng bằng playtest: không tấn công lần nào, kết thúc màn với ~20 zombie
đứng đầy bàn cờ và 2/3 cây đã chết, game vẫn báo "SECTOR SECURED".

Nguyên nhân là ba luật cộng lại:

- Thắng = sống sót hết số lượt
- Thua = chết **hết** cây
- Giết zombie không được thưởng gì

Hệ quả: mọi hành động đều là rủi ro thuần túy. 39 loại unit, 26 skill, shop, event,
hệ tiến hóa — tất cả nằm ngoài đường thắng.

Toàn bộ thiết kế dưới đây tồn tại để trả lời một câu hỏi:
**làm sao để người chơi buộc phải hành động?**

---

## 1. Điều kiện thắng thua: Sprout

Bỏ luật "sống sót N lượt". Thay bằng:

- Hàng trên cùng bàn cờ là **các ngôi nhà**, mỗi nhà chứa **1 sprout**
- Zombie đi về phía sprout gần nhất, **không** đi về phía cây gần nhất
- Cây trở thành **vật cản** trên đường đó — đúng bản chất PvZ
- Zombie chạm nhà → **mất 1 sprout**, zombie đó biến mất
- Số sprout được phép mất là **ngân sách của cả run**, không phải của từng màn
- Hết sprout → hết run

### Vì sao là sprout chứ không phải thanh máu nhà

Zombie trong PvZ đi tìm mầm. Cái tên tự giải thích luật chơi, không cần dạy người chơi.

### Vì sao ngân sách theo run chứ không theo màn

Đây là mô hình Power Grid của Into the Breach. Mất sprout **không** làm thua ngay,
nên "thả một con qua để cứu một hero" trở thành **nước đi hợp lệ có giá**, thay vì thảm họa.
Đó là thứ biến game từ "chơi hoàn hảo" thành **phân loại ưu tiên** — linh hồn của ItB.

Nó cũng tự động diệt lối chơi thụ động: bấm End Turn liên tục sẽ ăn mòn ngân sách sprout
qua từng màn, và bạn chết ở màn thứ ba.

**Số đề xuất: 5 sprout cho cả run.** Đủ để hy sinh có tính toán, không đủ để hy sinh bừa.

### Hai tầng, đừng lẫn

| Tầng | Là gì | Quyết định |
|---|---|---|
| Nhà trên bàn cờ | Vị trí cụ thể, cột nào đang bị đe dọa | Chiến thuật, trong màn |
| Ngân sách sprout | Con số toàn run | Chiến lược, giữa các màn |

---

## 2. Hero, cây cơ bản, và cái chết

### Hero

Squad gồm **3 hero**, lấy cảm hứng từ PvZ Heroes:

- Có một **đòn đánh thường miễn phí**
- Có một **skill hero tốn Sol**
- Là thứ duy nhất **nhận được fusion** (xem mục 6)

### Cây cơ bản — là hàng hóa, không phải trạng thái

Cây cơ bản **mua bằng Coin** giữa các màn. Mỗi cây mua về có **hai đường dùng loại trừ nhau**:

| Đường dùng | Nội dung |
|---|---|
| **Dự bị** | Giữ trên băng ghế. Nếu một hero ngã xuống, cây này lấp vào slot ở màn sau |
| **Nguyên liệu fusion** | Hợp vĩnh viễn vào một hero để hero mạnh lên — **thay cho việc mua chỉ số** |

Đây là điểm hay nhất của hệ thống: **một lần mua, hai công dụng, và bạn phải chọn.**
Mỗi lần mua là một câu hỏi thật — *bảo hiểm, hay sức mạnh?*

Cây cơ bản khi ra sân:

- Chỉ số gốc, **không có skill hero**, chỉ có đòn đánh thường miễn phí
- **Không nhận fusion** — nó không phải hero
- **Vẫn chặn đường zombie** — đây là giá trị chính của nó

### Hero chết thì sao

Hero chết **không tự động biến thành cây cơ bản**. Nó rời khỏi màn đang chơi.

- Màn hiện tại: bạn chơi tiếp với 2 unit. Không có gì lấp vào giữa trận
- Màn sau: nếu còn cây cơ bản trên băng ghế, bạn có thể đem nó ra lấp slot trống
- Hero được hồi sinh ở node nghỉ hoặc cuối chapter (xem bên dưới)

**Fusion đã hợp vào hero thì không mất.** Coin bạn đã đổ vào nó vẫn còn, chỉ bị treo
cho tới khi hồi sinh. Mất luôn thì một lượt sai xóa sạch nửa run, người chơi sẽ chơi co cụm.

### Hệ quả: bảo hiểm là một quyết định có thật

Vì cái chết **không** tặng bạn một cái xác miễn phí, việc đi mà không có dự bị
là một rủi ro bạn tự chọn nhận. Đó là áp lực chiến lược đọc được ngay:
*mình có đang chơi không bảo hiểm không?*

Ba van an toàn để nó không thành vòng xoáy chết:

1. Cây cơ bản rẻ — luôn mua nổi ít nhất một cái
2. Giá hồi sinh **rẻ hơn** một cây cơ bản hạng trung
3. Cuối mỗi chapter hồi sinh **miễn phí, tự động**

### Bản đồ hero ↔ cây gốc

PvZ Heroes có 11 hero phe cây. Roster hiện tại đã chứa gần hết các cây gốc:

| Hero | Cây gốc | Đã có trong `data/plants.ts` |
|---|---|---|
| Green Shadow | Seed Gun | ✓ |
| Solar Flare | Sol Battery | ✓ |
| Wall-Knight | Armor Plate | ✓ |
| Chompzilla | Steel Jaws | ✓ |
| Grass Knuckles | Bok Boxer | ✓ |
| Captain Combustible | Ember Log | ✓ |
| Nightcap | Shy Cap | ✓ |
| Rose | Brainwash Dart | ✓ |
| Beta-Carrotina | Sweet Potato | ✓ |
| Citron | Tower Shield | ✓ |
| Spudow | Seed Mine | đang là **item**, cần thêm |

10/11 đã tồn tại → concept này cần **rất ít nội dung mới**.

### Hồi sinh hero

| Nơi | Chi phí | Vai trò |
|---|---|---|
| **Node nghỉ** (Campfire) | Coin | Chủ động chọn, phải đánh đổi với mua cây và item |
| **Hết mỗi chapter** | Miễn phí, tự động | Lưới an toàn — run không bao giờ bị què vĩnh viễn |

**Luật bắt buộc cho map:** đảm bảo có Campfire trong mỗi ~3 tầng.
Hiện Campfire xuất hiện ngẫu nhiên ~10% (`utils/mapGenerator.ts`), nên hoàn toàn có thể
sinh ra run đi 7 tầng không gặp điểm nghỉ nào.

---

## 3. Nguyên tắc hai loại tiền

> **Sol quyết định lượt này bạn làm được gì. Coin quyết định squad của bạn là ai.**

Câu hỏi kiểm tra khi thêm thứ mới: nó thay đổi *khả năng trong một lượt*,
hay thay đổi *bản thân đội hình*? Vế đầu là Sol, vế sau là Coin.

**Không có thứ gì nằm ở cả hai. Không quy đổi qua lại.**
Đây là điểm mấu chốt để tránh bẫy "tiết kiệm luôn là lựa chọn đúng".

Cách gọi chính xác hơn: **Sol không phải tiền, Sol là kinh tế hành động.**
Nó là cơ chế biến ràng buộc "3 unit, nhiều mối đe dọa" của ItB thành một con số.

---

## 4. SUN — kinh tế trong trận

Dùng thang đo gốc của PvZ: **1 sun cơ bản = 25 điểm**.

### Nguồn thu

| Nguồn | Giá trị | Ghi chú |
|---|---|---|
| Khởi điểm mỗi màn | **50** | Bằng PvZ gốc. Đủ bật 1 skill bậc vừa ngay lượt 1 |
| Solar Flare — Harvest | **+25** / lượt | Skill **miễn phí**, nhưng tốn lượt hành động của unit |
| Hero có fusion Sol Battery | **+25** / lượt | Thụ động, không tốn lượt |
| Giết zombie | **+10 đến +15** | Theo độ cứng của zombie |

Việc thưởng giết zombie **không** chia hết cho 25 là cố ý: hai mạng zombie ≈ một sun cơ bản,
nên dọn bàn cờ cho cảm giác tiến triển từng chút, không phải bậc thang.

**Thu nhập điển hình mỗi lượt:**

| Giai đoạn | Nguồn | Tổng |
|---|---|---|
| Đầu màn (ít kill) | 25 + 1 kill | ~35–40 |
| Giữa màn | 25 + 2–3 kill | ~50–65 |
| Không có nguồn sinh Sol | 2–3 kill | ~25–40 |

### Chỗ tiêu — chỉ một thứ: kích hoạt skill hero

Bậc giá bám theo giá cây gốc của PvZ:

| Bậc | Giá | Vai trò | Tham chiếu PvZ |
|---|---|---|---|
| Rẻ | **25** | Tiện ích, đẩy/kéo 1 ô, sát thương nhỏ | Seed Mine 25 |
| Vừa | **50** | Skill đặc trưng của hero | Sol Battery / Armor Plate 50 |
| Nặng | **100** | Sát thương lớn, khống chế mạnh | Seed Gun 100 |
| Ultimate | **150–200** | Đổi cục diện bàn cờ | Fire Grenade 150 / Repeater 200 |

### Đường cong này tạo ra điều gì

- Mỗi lượt đủ tiền cho **khoảng 1 skill bậc vừa** → mỗi lượt là một câu hỏi:
  *bật skill cho ai trong ba hero?*
- Muốn dùng Ultimate phải **nhịn 2–3 lượt** → tích lũy có chủ đích
- Đầu màn chỉ với 50 sun → chỉ đủ bậc rẻ

### Luật

- **Reset về 0 khi hết màn.** Bắt buộc — nếu mang sang được, người chơi sẽ nhịn skill để dành,
  và bạn quay lại đúng lối chơi thụ động đang cần diệt
- Không mua được gì ngoài trận
- **Đánh thường luôn miễn phí** — không bao giờ có lượt không làm được gì

---

## 5. COIN — kinh tế giữa các màn

Thang đo theo đơn vị **10**, để không bao giờ nhìn nhầm sang Sol.

### Nguồn thu

| Nguồn | Giá trị |
|---|---|
| Hoàn thành màn | **+50** |
| Không mất sprout nào trong màn | **+25** |
| Node Elite | **+25** |
| Boss | **+100** |
| Event | thay đổi |

Dòng **thưởng theo sprout** là mắt xích nối mục tiêu vào tiến trình:
giữ sprout không chỉ để khỏi thua, mà còn để mạnh lên.
Chơi cẩu thả thì vừa mất sprout vừa nghèo — hai hình phạt cộng dồn.

### Chỗ tiêu

| Mục | Giá | Ghi chú |
|---|---|---|
| **Mua cây cơ bản** | **25–225** | Chỗ tiêu chính. Dùng làm dự bị **hoặc** nguyên liệu fusion |
| Item chiến đấu | 25–75 | Seed Mine 25 / Flame Strike 50 / Fire Grenade 75 |
| Power Plant | 50 | Một lượt kích hoạt skill không tốn Sol |
| **Hồi sinh hero** | **75** | Cố ý rẻ, phải luôn mua nổi |

### Shop: reroll và xem trước hiệu ứng

Shop bày **3 cây** mỗi lần ghé.

**Reroll** — đổi toàn bộ 3 cây, giá **tăng dần trong cùng một lượt ghé**
(10 → 20 → 30 → …), reset về 10 ở node shop kế tiếp.

Tăng dần là bắt buộc: giá cố định thì người chơi reroll vô hạn cho tới khi ra đúng cây,
và tính ngẫu nhiên của run biến mất. Tăng dần cho phép **săn có mục đích** nhưng bắt trả giá.

**Xem trước khi hover** — mỗi cây trong shop phải trả lời được ba câu, ngay trên tooltip:

| Dòng | Nội dung |
|---|---|
| Hiệu ứng | Cây này cho hero cái gì (một dòng, đọc là hiểu) |
| Trạng thái theo từng hero | `Green Shadow — đã có` / `Wall-Knight — còn 2 slot` / `Chompzilla — hết slot` |
| Nếu để dự bị | Chỉ số cơ bản khi nó ra sân thay hero đã ngã |

Dòng thứ hai là dòng quan trọng nhất — nó chặn đúng hai lỗi tốn tiền:
**mua trùng thứ hero đã có**, và **mua cho một hero đã hết slot**.

Không lọc bớt cây đã có ra khỏi shop. Cứ bày ra và **đánh dấu rõ** —
người chơi cần nhìn thấy để học hệ thống, và việc lọc ngầm sẽ làm shop
cảm giác bị dàn xếp.

### Giá cây cơ bản đã có sẵn trong code

`UnitDefinition.cost` trong `data/plants.ts` **đã được đặt theo đúng thang giá PvZ**
và đã phân bậc hợp lý. Chỉ cần đổi ý nghĩa của nó từ "ngân sách chọn squad" thành
**"giá Coin để mua cây này"**:

| Cây | `cost` hiện tại | Vai trò nguyên liệu |
|---|---|---|
| Sol Cap, Shy Cap | 25 | Rẻ, hiệu ứng nhỏ |
| Armor Plate, Sol Battery | 50 | Nền tảng |
| Sweet Potato, Magnet Pulse | 75 | |
| Seed Gun, Cabbage Sling, Storm Fan | 100 | Hạng trung |
| Bok Boxer, Tower Shield, Bunker Shell, Brainwash Dart | 125 | |
| Cactus, Steel Jaws | 150 | |
| Ember Log, Ice Grenade | 175 | Hạng nặng |
| Repeater | 200 | |
| Melon Mortar | 225 | Đắt nhất |

Không cần nghĩ lại bảng giá — nó đã đúng.

### Ngân sách cả run

~10 node × 50–75 coin ≈ **600–750 coin**.
Trừ item và hồi sinh, còn khoảng **400–500 cho fusion** → tương đương **4–6 lần hợp cây** mỗi run.

Với 3 hero × 3 slot = 9 slot khả dụng (bản đầu: 3 × 2 = 6), bạn **không bao giờ lấp đầy được**.
Đó là chủ đích: mỗi run là một build khác nhau, không có build tối ưu duy nhất.

---

## 6. Fusion — hệ thống tiến trình chính

### Bài học thật sự từ PvZ Fusion: ít cây gốc, nhiều kết quả

PvZ Fusion có **rất ít cây cơ bản**, nhưng mỗi lần hợp lại sinh ra một dạng cây mới,
và cây đã hợp còn hợp tiếp được — đó là cách nó có hơn 400 công thức từ một bộ cây nhỏ.

Sức mạnh nằm ở **tổ hợp**, không nằm ở số lượng cây gốc.
Đây là thứ đáng học, chứ không phải bản thân con số 400.

### Vì sao "chỉ hợp vào hero" là quyết định đúng về chi phí sản xuất

PvZ Fusion phải vẽ sprite riêng cho từng cây lai — hơn 400 hình, 400 cái tên, 400 mô tả.
Đó là khối lượng không thể kham nổi.

Hợp **vào hero** thì không cần: hero giữ nguyên hình dáng, chỉ **được power up bởi hiệu ứng**.
Số asset phải vẽ bằng **số nguyên liệu**, không phải số tổ hợp.

| | PvZ Fusion | Cách này |
|---|---|---|
| Nguyên liệu | ~20 cây gốc | **10 cây** |
| Kết quả khác nhau | 400+ công thức | 11 hero × C(10,3) = **1.320 build** |
| Sprite phải vẽ | 400+ | **21** (11 hero + 10 icon nguyên liệu) |

Nhiều biến thể hơn, với khoảng 5% khối lượng vẽ.
Đây là lý do quan trọng nhất để giữ ràng buộc "chỉ hợp vào hero" — không phải vì cân bằng,
mà vì nó là thứ duy nhất khiến hệ này làm nổi.

### Luật

- Diễn ra **giữa các màn** (node Shop / Campfire), không phải trong trận
- Hợp **một cây cơ bản** vào **một hero** → hero nhận vĩnh viễn đặc tính của cây đó
- Cây cơ bản **bị tiêu thụ**, không lấy lại được, không còn dùng làm dự bị
- Mỗi hero có tối đa **3 slot fusion** (bản đầu là 2 — xem mục 7)
- **Mỗi loại nguyên liệu chỉ hợp được một lần trên cùng một hero** — không cộng dồn.
  Cùng loại đó vẫn hợp được vào hero khác

Luật cuối làm hai việc: ép build phải đa dạng thay vì dồn hết vào một hiệu ứng,
và làm cho yêu cầu "không mua thừa, không mua trùng" của shop có nghĩa.

### Vì sao nó thay thế được việc mua chỉ số

Mua chỉ số là mua **con số**: "+1 sát thương" không đổi cách chơi, chỉ đổi tốc độ.
Fusion là mua **đặc tính**: "Green Shadow của mình gây đóng băng vì đã hợp một Ice Grenade vào"
— đó là một unit khác về bản chất.

Cùng một hero, hai người chơi sẽ xây ra hai thứ khác nhau.
Đó là điều mua chỉ số không bao giờ làm được.

### Pool nguyên liệu — 10 cây, mỗi cây một trục riêng

> Đây là trạng thái **đầy đủ**. Bản đầu chỉ ship 5 trong số này và mở khóa dần — xem mục 7.

Bộ nguyên liệu phải **nhỏ và dễ thuộc**. Nếu shop rút từ 26 loại thì người chơi
không bao giờ nhớ hết, và mọi lần reroll đều thành nhiễu.

Mười cây dưới đây phủ mười trục khác nhau, không cái nào trùng vai:

| Nguyên liệu | Giá | Hiệu ứng khi hợp vào hero | Trục |
|---|---|---|---|
| Armor Plate | 50 | +HP lớn | Chống chịu |
| Sol Battery | 50 | Thụ động +25 Sol/lượt | Kinh tế |
| Stim Shot | 75 | 1 lần/màn: hồi lại lượt hành động | Nhịp độ |
| Magnet Pulse | 100 | Đòn đánh kéo mục tiêu 1 ô | Kéo |
| Storm Fan | 100 | Đòn đánh đẩy mục tiêu 1 ô | Đẩy |
| Cactus | 150 | Đòn đánh xuyên qua hàng | Sát thương diện |
| Ice Grenade | 175 | Đòn đánh gây đóng băng | Khống chế |
| Ember Log | 175 | Đòn đánh gây cháy | Sát thương kéo dài |
| Repeater | 200 | Đánh thường **2 lần** | Sát thương dồn |
| Melon Mortar | 225 | Đòn đánh thành AoE nhỏ | Sát thương lan |

Giá lấy nguyên từ `UnitDefinition.cost` sẵn có — đã đúng thang PvZ và đã phân bậc hợp lý.

**Ba cây rẻ nhất là ba trục không gây sát thương** (chống chịu, kinh tế, nhịp độ).
Cố ý: người chơi mới sẽ mua chúng trước, và học được rằng fusion không chỉ để tăng damage.

### Số cây còn lại thì sao

26 cây hiện có được chia lại thành ba nhóm, không cây nào bị bỏ phí:

| Nhóm | Số lượng | Vai trò |
|---|---|---|
| Hình dạng gốc của hero | 11 | Seed Gun, Sol Battery, Armor Plate, Steel Jaws… |
| Nguyên liệu fusion | 10 | Bảng trên |
| Kho mở rộng | phần còn lại | Tower Shield, Iron Shell, Bunker Shell, Spike Armor, Boomerang, Corn Mortar, Cabbage Sling, Shy Cap, Sweet Potato, Parasol Leaf, Brainwash Dart, Sol Cap, Twin Sol Battery, Bok Boxer |

Ba nhóm **có giao nhau** — một cây vừa là hình dạng gốc của hero, vừa làm nguyên liệu được.
Sol Battery và Armor Plate là ví dụ: chúng là Solar Flare và Wall-Knight, đồng thời hợp được vào hero khác.

Nhóm ba **không đưa vào bản đầu**. Giữ lại làm nguồn mở rộng khi pool 10 cây
bắt đầu thấy lặp — thêm nguyên liệu là cách rẻ nhất để làm mới game về sau,
vì mỗi cây thêm vào nhân bội số build lên chứ không cộng.

### Công thức đặc biệt — để dành

Trong PvZ Fusion, một số cặp cho ra cây lai có tên riêng (Seed Gun + Armor Plate = Turret Pea).
Có thể thêm sau: vài cặp hero + nguyên liệu cho hiệu ứng vượt mức thông thường.
Đây là chỗ **duy nhất** đáng bỏ công vẽ sprite riêng, vì số lượng do bạn kiểm soát.
**Chưa làm ngay.**

### Bài học cân bằng từ chính cộng đồng game đó

> *"Người mới thấy hợp được là hợp hết — đó là sai lầm. Fusion tốn sun và sun đầu game rất quý.
> Hãy dùng cây gốc cho tới khi áp lực tăng, để dành nguyên liệu cho màn khó."*

Mechanic đó có đường cong chi phí lành mạnh. Giữ nguyên tinh thần:
**hợp sớm và hợp bừa phải là nước lỗ.** Ở đây điều đó tự đến từ luật
"cây đã hợp thì không còn làm dự bị được" — hợp hết nghĩa là đi không bảo hiểm.

### Titan Fusion — để dành

Gộp cả 3 hero thành một Titan duy nhất, chỉ dùng ở màn Boss. **Chưa đưa vào lộ trình.**

---

## 7. Mở khóa dần

### Nguyên tắc

Bản đầu chỉ có **5 hero + 5 nguyên liệu**. Mỗi lần mở khóa là một **gói**:
thêm 1 hero, thêm 1 nguyên liệu, thêm 1 hiệu ứng mới.

Hai lý do, cả hai đều quan trọng ngang nhau:

1. **Phạm vi.** 5+5 là một game hoàn chỉnh có thể chơi và cân bằng được.
   11+10 là thứ phải xây xong toàn bộ mới test được lần đầu — và gần như chắc chắn
   sẽ phát hiện thiết kế sai sau khi đã vẽ xong 21 asset.
2. **Onboarding.** Người chơi mới đối mặt 11 hero × 10 nguyên liệu sẽ không hiểu gì.
   5×5 học hết trong một run.

### Mỗi gói mở khóa nhân đôi chiều sâu, không cộng thêm

Vì hiệu ứng đến từ **tổ hợp**, thêm một nguyên liệu không phải là +1 lựa chọn:

| Hero / Nguyên liệu | Build mỗi hero | Tổng build | Tăng |
|---|---|---|---|
| 5 / 5 | 10 | **50** | — |
| 6 / 6 | 20 | **120** | ×2,40 |
| 7 / 7 | 35 | **245** | ×2,04 |
| 8 / 8 | 56 | **448** | ×1,83 |
| 9 / 9 | 84 | **756** | ×1,69 |
| 10 / 10 | 120 | **1.200** | ×1,59 |

Gói mở khóa đầu tiên **hơn gấp đôi** không gian build. Đó là phần thưởng
người chơi cảm nhận được ngay, không cần giải thích.

### Bộ khởi điểm — 5 hero

Năm hero phải phủ đủ các trục để bản đầu là một game trọn vẹn, không phải bản demo cắt xén:

| Hero | Cây gốc | Dạy người chơi điều gì |
|---|---|---|
| Green Shadow | Seed Gun | Bắn thẳng — hero nhập môn |
| Wall-Knight | Armor Plate | Chặn đường. **Bắt buộc phải có** vì luật sprout xoay quanh việc cản zombie |
| Solar Flare | Sol Battery | Vòng lặp kinh tế Sol |
| Chompzilla | Steel Jaws | Đánh đổi rủi ro — nuốt mạnh nhưng phải tiêu hóa |
| Captain Combustible | Ember Log | Can thiệp địa hình |

Chọn 3 trong 5 → đã có 10 tổ hợp squad ngay từ bản đầu.

### Bộ khởi điểm — 5 nguyên liệu

| Nguyên liệu | Giá | Hiệu ứng | Trục |
|---|---|---|---|
| Armor Plate | 50 | +HP lớn | Chống chịu |
| Sol Battery | 50 | Thụ động +25 Sol/lượt | Kinh tế |
| Storm Fan | 100 | Đòn đánh đẩy 1 ô | Đẩy lùi |
| Ice Grenade | 175 | Đòn đánh gây đóng băng | Khống chế |
| Repeater | 200 | Đánh thường 2 lần | Sát thương |

Storm Fan có mặt từ đầu là cố ý: với luật sprout, **đẩy lùi một ô là mua được một lượt**.
Người chơi cần học điều đó sớm, nếu không họ sẽ chỉ biết cộng damage.

Hai nguyên liệu đầu dùng lại đúng sprite của Wall-Knight và Solar Flare,
nên chi phí vẽ cho bản đầu thực tế chỉ khoảng **8 asset**.

### Lộ trình mở khóa

Mỗi gói ghép hero với một nguyên liệu bổ trợ cho chính lối chơi của hero đó:

| # | Hero mở khóa | Nguyên liệu kèm theo | Hiệu ứng mới |
|---|---|---|---|
| 6 | Grass Knuckles (Bok Boxer) | Cactus | Đòn đánh xuyên hàng |
| 7 | Nightcap (Shy Cap) | Stim Shot | 1 lần/màn: hồi lại lượt hành động |
| 8 | Rose (Brainwash Dart) | Magnet Pulse | Đòn đánh kéo mục tiêu 1 ô |
| 9 | Citron (Tower Shield) | Melon Mortar | Đòn đánh thành AoE nhỏ |
| 10 | Beta-Carrotina (Sweet Potato) | Ember Log *(dạng nguyên liệu)* | Đòn đánh gây cháy |
| 11 | Spudow (Seed Mine) | — | Capstone: mở **công thức đặc biệt** thay vì nguyên liệu mới |

Gói 11 lệch nhịp vì có 11 hero nhưng chỉ cần 10 nguyên liệu.
Dùng nó làm phần thưởng cuối: mở hệ công thức đặc biệt (hero + nguyên liệu cho hiệu ứng vượt mức),
đúng chỗ duy nhất đáng bỏ công vẽ sprite riêng.

### Điều kiện mở khóa — CẤP CHỈ HUY

**Đừng bắt phải thắng run mới được mở.** Người chơi mới sẽ thua vài run đầu,
và nếu thua không cho gì thì họ bỏ game trước khi thấy được chiều sâu.

Trước đây tiến trình đi qua **ba kênh riêng** — lớp sâu nhất trả công thức, trùm trả hero,
cứ 3 nhiệm vụ phụ trả thêm một công thức. Cả ba đều chạy, và **không cái nào nhìn thấy được**:
người chơi không trả lời nổi câu "còn bao xa nữa thì được thêm thứ gì". Giờ gộp thành **một
con số duy nhất**.

**Cấp chỉ huy** được trả bằng **kết quả của một lượt chơi**, chốt sổ khi run kết thúc — thắng
hay thua đều tính:

| Nguồn KN | Giá trị |
|---|---|
| Mỗi lớp bản đồ đi được | 10 |
| Mỗi nhiệm vụ phụ hoàn thành | 15 |
| Hạ trùm (thắng run) | 60 |
| Mỗi lớp vượt kỷ lục cũ của chính mình | +10 |

Cần để lên cấp `n → n+1`: **100 + 50×(n−1)** (100, 150, 200, 250…).

**Mỗi cấp mở 1 công thức fusion.** Các cấp có tên trong `HERO_UNLOCKS` mở thêm 1 hero
(kèm công thức cây gốc của hero đó): cấp 3 → Snapmaw, cấp 6 → Frostpod, cấp 9 → Cornova.

Nhịp thực tế: run đầu chết giữa chừng ≈ 1 cấp; run thắng gọn ≈ 1 cấp có dư. Thua vẫn tiến,
và đi sâu hơn lần trước thì tiến nhanh hơn — nhưng **không có kênh nào trả thưởng giữa run**
nữa: đúng một khoảnh khắc tiến trình rơi xuống, và một con số giải thích nó.

Số ở `data/unlocks.ts` (`XP_PER_*`, `xpForNextLevel`) — đó là toàn bộ núm vặn.

### Rủi ro cần canh: pool 5 quá nhỏ so với nhịp fusion

Ngân sách cho khoảng **4–6 lần fusion mỗi run**, mà bản đầu chỉ có **5 nguyên liệu**.
Nghĩa là mỗi run bạn gần như dùng hết pool → các run đầu dễ giống nhau.

Ba cách giảm nhẹ, nên làm cả ba:

1. Shop chỉ bày **3 cây ngẫu nhiên** — bạn không được chọn tự do trong cả 5
2. Reroll tốn coin và tăng giá dần — săn được nhưng phải trả giá
3. Ở bản 5 nguyên liệu, cân nhắc hạ xuống **2 slot fusion** mỗi hero,
   nâng lên 3 khi pool đạt 7–8

Điểm 3 là cách sạch nhất: giữ tỉ lệ giữa số slot và kích thước pool,
để tổ hợp luôn là lựa chọn thật chứ không phải "lấy hết những gì có".

### Hệ quả kỹ thuật: bắt buộc phải có save

Tiến trình mở khóa sống **xuyên qua nhiều run**, nên hệ lưu trữ không còn là tùy chọn.
Hiện `utils/persistence.ts` chỉ lưu config của Admin vào localStorage —
cần thêm một khối riêng cho tiến trình người chơi (hero đã mở, nguyên liệu đã mở, thống kê run).

Tách hai khối ra, đừng gộp: config Admin là dữ liệu phát triển, có thể xóa bất cứ lúc nào;
tiến trình mở khóa là dữ liệu người chơi, mất là mất niềm tin.

---

## 8. Bảng số tổng hợp

### Sol (thang 25 của PvZ) — trong trận, reset mỗi màn

| Mục | Giá trị |
|---|---|
| Khởi điểm mỗi màn | 50 |
| Nguồn sinh Sol / lượt | +15 … +50 |
| Giết zombie | +10 … +15 |
| Skill rẻ | 25 |
| Skill vừa | 50 |
| Skill nặng | 100 |
| Ultimate | 150–200 |
| Đánh thường | 0 |

### Coin (thang 10) — toàn run

| Mục | Giá trị |
|---|---|
| Hoàn thành màn | +50 |
| Không mất sprout | +25 |
| Elite | +25 |
| Boss | +100 |
| Mua cây cơ bản | 25–225 (theo `cost` sẵn có) |
| Item | 25–75 |
| Power Plant | 50 |
| Hồi sinh hero | 75 |

### Run

| Mục | Giá trị |
|---|---|
| Sprout cho cả run | 5 |
| Squad | 3 hero |
| Sức chứa băng ghế dự bị | 2 cây |
| Fusion thực tế mỗi run | 4–6 |
| Mật độ Campfire | ít nhất 1 mỗi 3 tầng |
| Hero bản đầu / tối đa | 5 / 11 |
| Nguyên liệu bản đầu / tối đa | 5 / 10 |
| Slot fusion mỗi hero | 2 (pool 5) → 3 (pool 7+) |
| Tổng build | 50 (bản đầu) → 1.200 (đầy đủ) |
| Cây bày trong shop | 3 |
| Giá reroll | 10 → 20 → 30 … (reset mỗi shop) |

> **Tất cả con số trên là điểm khởi đầu để tinh chỉnh.**
> Con số neo của Sol là **thu nhập mỗi lượt** — mọi giá skill tính ngược từ đó ra.
> Con số neo của Coin là **thu nhập mỗi màn** — nó quyết định số fusion mỗi run.

---

## 9. Cần đổi gì trong code

### Đã có sẵn, chỉ cần cắm dây

| Thứ | Ở đâu | Tình trạng |
|---|---|---|
| `coins`, `diamonds` | `types.ts` `GameState` | Khai báo rồi, **chưa từng được đọc hay ghi** |
| Giá cây theo thang PvZ | `UnitDefinition.cost` | Đã đúng, chỉ đổi ý nghĩa sang giá Coin |
| Gating skill theo tài nguyên | `requiresSunCharge` / `sunCharge` | Cơ chế hoàn chỉnh: kiểm tra, trừ, badge, disable nút |
| Hệ item | `data/items.ts`, `ShopScreen`, `ITEM_TARGETING` | Xong end-to-end, chỉ thiếu nguồn cấp |
| Event nghỉ chân | `rest_site` trong `useGameProgression.ts` | Thêm lựa chọn "hồi sinh hero" |
| Ô nguy hiểm | `isThreatened` trong `Board.tsx` | Có hàm vẽ, đang bị truyền mảng rỗng |

### Cần viết mới

- Ô **nhà / sprout** ở hàng trên + bộ đếm sprout toàn run
- Đổi mục tiêu của địch: sprout gần nhất thay vì cây gần nhất
  (`planEnemyIntent`, `turnManager` PHASE 4)
- `Skill.sunCost` thay cho `requiresSunCharge` dạng boolean
- `Unit.isHero`, và **băng ghế dự bị** (kho cây cơ bản đã mua)
- **Hệ fusion**: slot trên hero, bảng hiệu ứng, UI hợp cây
- Bỏ `upgradeCosts` / mua chỉ số — fusion thay thế hoàn toàn
- Tách hai ví: Sol trong trận (reset mỗi màn) / Coin toàn run
- Thưởng Sol khi giết zombie
- **Shop reroll** với giá tăng dần trong cùng lượt ghé
- **Tooltip nguyên liệu**: hiệu ứng + trạng thái slot theo từng hero + chỉ số khi làm dự bị
- **Hệ mở khóa + save tiến trình** — tách khỏi khối config Admin trong `persistence.ts`

### Thứ tự đề xuất

1. **Sprout + đổi mục tiêu của địch** — sửa lỗi "bấm End Turn là thắng".
   Không có bước này thì mọi cân bằng đều vô nghĩa
2. **Bật telegraph ô nguy hiểm** — rẻ, khung có sẵn, biến game thành puzzle
3. **Tách Sol / Coin + Sol rơi từ zombie** — nối kinh tế vào combat
4. **Hero chết + băng ghế dự bị + hồi sinh**
5. **Hệ fusion** — thay thế mua chỉ số
6. **Tua nhanh animation** — cuối màn đang mất 6–9 giây/lượt, sẽ chặn mọi vòng test cân bằng
7. Cân bằng chi tiết

Bước 5 là phần lớn nhất và nên làm sau khi 1–4 đã chạy, vì nó cần một vòng lặp
chơi-thử-chỉnh nhanh mới cân được.

---

## 10. Câu hỏi còn mở

- Có bao nhiêu nhà trên hàng trên? 8 (mỗi cột một nhà) hay ít hơn để tạo điểm nghẽn?
- Zombie chạm nhà thì biến mất, hay ở lại bàn cờ?
- Băng ghế dự bị chứa tối đa mấy cây? (Đề xuất 2 — đủ để có bảo hiểm, không đủ để tích trữ)
- Mốc mở khóa đặt ở chapter nào? Gói đầu nên đến sớm (run 2–3) để người chơi thấy hệ thống lớn dần
- Bản đầu 2 slot fusion có làm build cảm giác nông quá không?
- Chapter dài bao nhiêu node? Ảnh hưởng tới nhịp hồi sinh miễn phí
- Cây cơ bản ra sân có nhận buff từ hero khác không, hay hoàn toàn độc lập?

---

## Nguồn tham khảo

- [PvZ: Fusion Wiki](https://pvzfusion.wiki.gg/) — cơ chế fusion
- [Fusions — PVZ: Fusion Wiki (Fandom)](https://pvz-fusion.fandom.com/wiki/Fusions) — công thức, chuỗi fusion
- [Complete Beginner's Guide To PvZ Fusion](https://thepvzzfusion.com/complete-beginners-guide-to-pvz-fusion/) — chi phí, lời khuyên không hợp sớm
- [Plants vs. Zombies: Fusion — TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/PlantsvsZombiesFusion) — tổng quan
