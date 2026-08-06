# PLAN — VÒNG LẶP MEGA MAN: TRÙM → SỨC MẠNH → TRÙM KẾ

> Trạng thái: **HAI QUYẾT ĐỊNH LỚN ĐÃ CHỐT (mục 3), phần còn lại là đề xuất, CHƯA TRIỂN KHAI.**
> Đọc kèm `PLAN-hero-zephyr.md` — bảng thưởng dưới đây tính THEO plan đó (Zephyr thay
> Thornquill; Chardwall dời từ Armada sang Headliner), vì hai ô ấy đổi đúng vào giữa chuỗi.

## 1 · Mega Man là HAI luật, không phải một

Cảm giác người chơi nhớ về Mega Man không đến từ "hạ trùm được đồ". Nó đến từ hai luật chạy cùng lúc:

- **R1 — VỌNG LẠI.** Món nhận được *là sức mạnh của chính con trùm vừa hạ*. Hạ Fire Man thì
  cầm được lửa. Đây là phần **cảm xúc**: người chơi thấy mình *đoạt* chứ không *được phát*.
- **R2 — CHÌA KHOÁ.** Món đó là **điểm yếu của con trùm KẾ TIẾP**. Đây là phần **cấu trúc**:
  nó biến thứ tự đi bàn thành một câu đố, và biến mỗi phần thưởng thành một câu "giờ đi đâu".

Thiếu R1 thì phần thưởng chỉ là nâng cấp. Thiếu R2 thì phần thưởng chỉ là chiến lợi phẩm —
đúng tình trạng của phần lớn game roguelite. **Game này đang có R1 khá tốt và R2 gần đủ, nhưng
chưa bao giờ NÓI ra luật nào trong hai luật đó** — đó mới là chỗ mất cảm giác.

Một khác biệt phải nêu thẳng, vì nó là gốc của mọi chỗ lệch bên dưới: `data/unlocks.ts` đang
chép nguyên tắc **"hero là CÂU TRẢ LỜI cho mối đe doạ nó gỡ"** (*"the hero it frees is the
ANSWER to the threat it is"*). Đó là luật **ngược chiều** với Mega Man: câu trả lời tới sau khi
ổ khoá đã mở. Ba hero đang được thiết kế theo luật ngược ấy (Thornhide, Gourdward, và
Thornquill đã nghỉ); phần còn lại của roster thì lại theo đúng R1 (Cobb, ba nguyên tố, và giờ
là Zephyr).

**Luật này đã được quyết định thay** (mục 3a): *mang sức mạnh của chính nó, và là câu trả lời
cho mối đe doạ KẾ TIẾP*. Bảng dưới là kiểm kê từng ô theo luật mới; ba ô chưa đạt R1 xử lý ở
mục 5.6.

## 2 · Kiểm kê chín hồi (đã áp plan Zephyr)

Số liệu đọc từ `data/zombies.ts`, `utils/bossBehaviours.ts`, `data/heroes.ts`.

| Hồi | Trùm — luận đề của nó | Thưởng | R1 vọng lại | R2 chìa cho hồi kế |
|---|---|---|---|---|
| I-1 | **Gargantuar** 16hp/5dmg, miễn PUSH + massive — *thứ đầu tiên không đẩy được* | Maw — Devour 7, xoá mọi thân dày trừ trùm | ✓ mồm khổng lồ đối mồm khổng lồ | ✗ **ĐỨT** — Maw cận chiến, Ironcart lùi trên ray và bắn tầm 4 |
| I-2 | **Ironcart** 18hp, ray, standoff tối đa, nổ lan 1 — *đứng đúng chỗ không còn đủ* | Cobb — LOB qua đầu quân mình, Butter Splat = mất trọn lượt | ✓✓ sách giáo khoa: đoạt chính khẩu pháo | ✓✓ lob qua biển dung nham của Cinder, stun chặn vệt lửa một lượt |
| I-3 | **Cinder Colossus** 20hp — *bàn cờ không phải hằng số*: đi tới đâu hoá lava tới đó, đứng giữa 2 lava thì hồi máu | **LỬA** | ✓✓ đoạt ngọn lửa | ✓✓ BURN tick trong LƯỢT ĐỊCH làm Armada rụng một túi khí **mà không tốn hành động nào** |
| II-1 | **Armada** 22hp, FLYING, 3 túi khí, rơi xuống thành xác 4dmg — *tường có mặt sau, trời có sàn* | **Zephyr** — bay, move 4, 4 máu | ✓✓ đoạt bầu trời | ✓ bay + move 4 = đội hình không còn "lòng" để Sandreaver trồi lên; nhưng 4 máu đứng cạnh cú nổ 4 là chết |
| II-2 | **Sandreaver** 22hp, TELEPORT, trồi lên giữa đội hình — *tuyến không còn mặt trước* | Thornhide — taunt 3 ô, phản đòn 2, thân 10 máu | ✗ đây là **câu trả lời cho chính nó** | ✓✓ taunt kéo Frost Grip của Yeti vào cái thân 10 máu, và mỗi cú đập trả 2 |
| II-3 | **Yeti** 24hp, miễn FREEZE — *cú giết mất hai lượt, và bạn được xem cả hai* | **BĂNG** | ✓✓ đoạt cái lạnh | ~ làm chậm đám đông Headliner; nhưng đám đông chết vì đòn diện rộng, không vì slow |
| III-1 | **Headliner** 20hp/1dmg, gọi 4 vũ công mỗi hai lượt — *đám đông mới là mối đe doạ* | **Chardwall** — Vault Toss + Sweep bốn phía | ~ hất bay cả đám | ✓ Clockjaw KHÔNG miễn PUSH: hất 2 ô mỗi lượt thì nó không chạm được ai |
| III-2 | **Clockjaw** 22hp, 2 đòn/lượt (3 khi kiệt) — *telegraph không cho bạn THỜI GIAN* | Gourdward — lớp chắn + miễn BURN/FREEZE/SHOCK | ✗ câu trả lời; **và sau khi đổi sang giáp-lớp thì Clockjaw thành khắc tinh của chính phần thưởng** (lớp chỉ chặn búa đầu) | ✓✓ miễn SHOCK vô điều kiện: arc điện của Voltmaw từ chối chọn anh (`bossBehaviours.ts:358`) |
| III-3 | **Voltmaw** 26hp — *khoảng cách không phải an toàn, ô trả tiền cho bạn là cái bẫy* | **ĐIỆN** | ✓✓ đoạt dòng điện | ✓ vào Vết Nứt |

**Điểm số: R1 năm ô đạt, hai ô mờ, hai ô ngược. R2 sáu ô đạt, một ô mờ, một ô ĐỨT.**
Chuỗi Mega Man gần như đã nằm sẵn trong dữ liệu — nó chỉ chưa bao giờ được tuyên bố, và đứt
đúng một mắt.

> Bảng trên là kiểm kê THEO LUẬT CŨ, giữ lại làm mốc so sánh. Hai ô được chấm lại ở mục 4 sau
> khi soi kỹ hơn: **II-3 (BĂNG → Headliner) thật ra là mắt MẠNH** — cộng hưởng băng đóng băng
> được con trùm (nó không miễn gì cả), và một lượt bị đóng băng là cả một đợt bốn vũ công không
> bao giờ được gọi. Ba ô R1 "mờ/ngược" đóng lại bằng cách đọc lại luận đề con trùm (5.6).

## 3 · CHỐT: chiến dịch thành TUYẾN TÍNH, và luật thưởng viết lại

Hai quyết định của tác giả, ghi lại nguyên văn ý:

> **(a)** Luật thưởng đổi từ *"hero được giải phóng là CÂU TRẢ LỜI cho mối đe doạ nó gỡ"*
> thành **"hero được giải phóng MANG SỨC MẠNH CỦA CHÍNH NÓ, và là câu trả lời cho mối đe doạ
> KẾ TIẾP"** — tức R1 + R2, đúng khuôn Mega Man.
>
> **(b)** Bỏ "vào hồi nào cũng được", chuyển thành **tuyến tính** — đổi lại được hai thứ: trật
> tự truyện/art cố định nên dựng được, và **giá trị chơi lại**: *lần 1 mở khoá hero A nhưng
> chưa dùng được ngay; gặp trùm 2 thua; quay về lấy A ra dùng.*

### 3.1 · Vòng lặp "mở khoá nhưng chưa dùng được ngay" ĐÃ CHẠY SẴN

Đây là phát hiện quan trọng nhất của cả plan, vì nó biến (b) từ *tính năng phải xây* thành
*tính năng phải mở khoá cho nhìn thấy*:

- **Một lượt chơi = TRỌN MỘT CHẶNG, không phải một hồi.** `completeLevel` phát hiện "trùm này
  là nút cuối bản đồ của hồi nó" rồi **sinh luôn bản đồ hồi kế và bắn `actIntro`**
  (`useGameProgression.ts:588-595`). Ba hồi nối nhau trong cùng một lượt chơi.
- **Đội hình chốt MỘT LẦN ở đầu lượt chơi** (`SQUAD_SELECT` → `handleStartGame`). Không có
  đường nào đổi đội giữa chừng.
- ⇒ Hero mở khoá ở trùm hồi 1 **rơi vào save ngay, nhưng đội hình cho hồi 2 đã chốt từ trước
  khi hồi 1 bắt đầu.** Người chơi gặp trùm hồi 2 bằng đội cũ, đúng như mô tả.
- ⇒ Thua → lượt chơi mới → màn chọn hero **đã có A** → mang A vào đánh lại đúng con trùm đó.

Nghĩa là kịch bản (b) không phải thứ phải viết. Thứ phải viết là **lý do người chơi tin rằng A
là câu trả lời** — tức R2 (mục 5) và phần hiển thị (mục 5.5). Không có hai thứ đó thì vòng lặp
vẫn chạy nhưng đọc ra là "thua vì yếu", không phải "thua vì thiếu chìa khoá".

### 3.2 · Tuyến tính hoá — sửa đúng một hàm

`StageSelectScreen.openAt` hiện là *"mọi hồi TRƯỚC NÓ TRONG CÙNG CHẶNG đã hạ"*, nên hồi 1 của
cả ba chặng mở sẵn từ đầu. Đổi thành **"mọi trùm đứng trước nó trong thứ tự bảng `BOSSES` đã
hạ"**. Bảng `BOSSES` vốn đã là thứ tự chiến dịch, và `nextUnbeatenBoss` — hàm trả về "con trùm
đầu tiên chưa hạ" — đã tồn tại, kèm chú thích tự nhận là **luật TẠM**. Tuyến tính hoá chỉ là
biến luật tạm đó thành luật thật.

Ba hệ quả phải chốt cùng lúc:

1. **Vào lại ở hồi CHƯA HẠ, không phải hồi 1.** `bossesBeaten` đã lưu vĩnh viễn, nên thua ở
   hồi 2 thì lượt sau vào thẳng hồi 2 — không bắt đánh lại hồi 1. Đây chính là thứ làm vòng
   lặp (b) chịu đựng được: thua một lần trả giá bằng một lần chọn lại đội, không phải bằng
   nguyên một chặng.
2. **Lời phản bác của chính repo được trả lời, không phải bị bỏ qua.** Chú thích hiện tại bảo
   vệ cấu trúc song song vì *"khoá chặng 2 sau chặng 1 sẽ khiến một lượt thua làm mất quyền
   vào nội dung người chơi đã tới được"*. Với luật (1) thì một lượt thua **không lấy đi gì
   cả** — hồi đó vẫn đứng đó, hồi đã hạ vẫn đã hạ. Phải viết lại đúng chú thích đó, không thì
   người sửa sau sẽ tưởng luật cũ bị vi phạm do sơ ý.
3. **Hồi đã hạ vẫn vào lại được** (hiện `openAt` không kiểm `done`). Giữ — đó là nơi mắt xích
   quay-lại ở 3.3 sống.

### 3.3 · Hình dạng chuỗi sau khi tuyến tính

Chín hồi thành một đường thẳng: I-1 → I-2 → I-3 → II-1 → II-2 → II-3 → III-1 → III-2 → III-3 →
Vết Nứt. R2 giờ là một dây liên tục, và **nguyên tố khép chặng chính là mắt nối hai chặng**
(LỬA khép chặng I là chìa vào Armada mở màn chặng II — đúng sẵn, mục 5.4).

**Mắt xích QUAY LẠI vẫn còn chỗ, và nó là phần thưởng chơi lại chứ không phải cửa khoá:**
BĂNG (II-3) là chìa cho Cinder (I-3) — con trùm ở chặng trước. Cầm BĂNG quay lại Kiln Row thì
Cinder có một pha hai người chơi chưa từng thấy. Luật này **đã viết trong code nhưng chết**
(mục 5.1) — sửa một từ là nó sống, và nó cho hồi đã-hạ một lý do tồn tại sau khi đã hạ.

## 4 · ĐỀ XUẤT CHỐT: **giữ nguyên thứ tự và bảng mapping hiện tại (hậu-Zephyr)**

Đây là kết luận sau khi thử xếp lại, không phải kết luận vì lười. Chuỗi tối ưu là:

| # | Trùm | Thưởng | R1 — mang sức mạnh của nó | R2 — chìa cho trùm kế |
|---|---|---|---|---|
| 1 | Gargantuar | **Maw** | mồm khổng lồ đối mồm khổng lồ | ⚠️ **GÃY** → sửa ở 5.2 |
| 2 | Ironcart | **Cobb** | đoạt chính khẩu pháo | lob qua biển lava + stun chặn vệt lửa |
| 3 | Cinder | **LỬA** | đoạt ngọn lửa | BURN tick trong lượt địch = một túi khí Armada, không tốn hành động |
| 4 | Armada | **Zephyr** | đoạt bầu trời | ⚠️ **MỜ** → sửa ở 5.3 |
| 5 | Sandreaver | **Thornhide** | nó chọn nơi trận đánh diễn ra — giờ anh chọn | taunt kéo Frost Grip vào thân 10 máu, mỗi cú đập trả 2 |
| 6 | Yeti | **BĂNG** | đoạt cái lạnh | **làm chậm hai lần = ĐÓNG BĂNG = Headliner mất lượt = cả một đợt bốn vũ công không bao giờ tới** |
| 7 | Headliner | **Chardwall** | nó không tự tay chạm vào ai; anh cũng vậy (`damage: 0`) | hất 2 ô mỗi lượt: con trùm ba-đòn-một-lượt không chạm được ai |
| 8 | Clockjaw | **Gourdward** | nó lấy nhiều hành động hơn phần mình — một Encase dựng bốn lớp | ward SHOCK: arc điện của Voltmaw từ chối chọn anh |
| 9 | Voltmaw | **ĐIỆN** | đoạt dòng điện | vào Vết Nứt |

**Ô số 6 là ô tôi chấm sai ở lượt kiểm trước** và phải sửa lại tại đây: Headliner **không có
miễn nhiễm nào** (`data/zombies.ts:199`) và **không nằm trong `MASSIVE_BOSSES`**. Cộng hưởng
BĂNG = *"làm chậm kẻ đã bị chậm thì nó đóng băng"*, mà đóng băng = mất lượt = **đợt triệu hồi
bốn vũ công của lượt đó không xảy ra**. Đó không phải mắt xích yếu, đó là mắt xích mạnh nhất
nửa sau chuỗi — và nó **không cần một dòng code nào**, chỉ cần được nói ra.

### 4.1 · Vì sao không xếp lại — hai phương án đã thử và chi phí của chúng

Ba thứ khoá cứng toàn bộ bài toán, phải nêu trước:

1. **Ba nguyên tố bị R1 ghim chặt vào ba con trùm** (LỬA↔Cinder, BĂNG↔Yeti, ĐIỆN↔Voltmaw), và
   cấu trúc "hồi 3 của mỗi chặng trả nguyên tố" ghim luôn chúng vào ba ô 3/6/9.
2. **Voltmaw phải đứng cuối** (26 máu, và Vết Nứt theo ngay sau) ⇒ ô 8 phải trả thứ trị được
   nó ⇒ ô 8 là Clockjaw (ward SHOCK). Ô 7 phải trả thứ trị được Clockjaw ⇒ Thornhide hoặc
   Chardwall.
3. **Maw là phần thưởng DUY NHẤT không thể làm chìa khoá bằng kỹ năng của mình** — Devour bị
   làm cùn trước trùm *một cách cố ý* (`skillResolution.ts`, và `heroes.ts` giải thích: "phần
   thưởng cho việc hạ Gargantuar là đao phủ cho lính dày, không phải chìa khoá bỏ qua tám trận
   sau"). Anh chỉ làm chìa được bằng **thân thể**: move 3 + cắn free + xoá sạch hộ vệ.

   > **Ràng buộc (3) đã được gỡ ở 5.2.b** (Devour làm lại: bỏ ngoại lệ + chảy máu dính trùm).
   > **Kết luận "không xếp lại" vẫn đứng** — và đây là chỗ phải nói rõ, không thì lần sau ai đó
   > sẽ mở lại bài toán tưởng là còn tự do. Maw sau khi vá là **burst cận chiến cần một cửa sổ
   > an toàn hai lượt**, mà bốn con trùm ở ô 5–8 đều trừng phạt đúng thứ đó: Yeti ghì rồi đập
   > kẻ bất lực, Clockjaw đánh 2–3 lần một lượt, Cinder biến ô anh đứng thành lava, Voltmaw
   > phóng điện qua ô anh đứng. Cửa sổ digest chỉ an toàn ở đúng MỘT nơi trong cả game: trong
   > vùng mù của một khẩu pháo bị chặn đường lùi. Ràng buộc (1) và (2) thì không đổi. Thứ tự
   > vẫn bị ghim.

**Phương án A — Gargantuar trả Thornhide, Sandreaver trả Maw.**
R1 mạnh hơn ở cả hai ô: "thứ không đẩy được" → hero không thể bị dời và trừng phạt mọi va chạm;
và kỹ năng của Maw *tên nội bộ đúng là* `burrow_strike`. R2 ô 1 cũng mạnh hơn hẳn: Provoke chạy
**trước mọi hành vi trùm** (chú thích trong `sandreaverMove` nói thẳng), nên nó kéo được Ironcart
rời khỏi thế đứng-xa — mắt gãy 1→2 biến mất.
**Nhưng** Maw dời tới ô 5 thì phải làm chìa cho **Yeti**: cận chiến lao vào con trùm giết bất kỳ
ai nó ghì, với kỹ năng vô dụng trước trùm — gãy nặng hơn chỗ vừa vá. Dời Maw đi đâu cũng thế:
mọi ô 5-8 đều là trùm mà Devour không đụng tới được. **Loại.**

**Phương án B — Sandreaver đứng ô 7 (thay Headliner).**
Thornhide→Clockjaw là mắt R2 mạnh nhất game (code viết sẵn: *"THORNHIDE ANSWERS EVERY BEAT"*).
**Nhưng** ô 6 khi đó phải trả một nguyên tố làm chìa cho Sandreaver: LỬA vô nghĩa với thứ ở dưới
đất, BĂNG không chặn được teleport. Đổi một mắt mạnh lấy một mắt chết. **Loại.**

⇒ Thứ tự hiện tại **là điểm cực trị**, không phải mặc định. Nó có đúng **một** mắt gãy và **một**
mắt mờ, cả hai đều nằm ở đầu chuỗi, và cả hai sửa được **tại con trùm** — rẻ hơn nhiều so với
xếp lại chín ô và kéo theo thành phố, sector, comic và bốn cutscene.

## 5 · Gãy ở đâu, sửa ở đó

Thứ tự và mapping giữ nguyên (mục 4), nên toàn bộ việc còn lại là vá **hai mắt** của chuỗi và
làm cho chuỗi **nhìn thấy được**. Cả hai bản vá đều nằm ở CON TRÙM, không ở hero: sửa hero là
sửa thứ người chơi cầm suốt chín trận, sửa trùm là sửa đúng một trận.

### 5.1 · Cinder chưa bao giờ miễn FREEZE — mắt xích "quay lại" là code chết

`utils/bossBehaviours.ts` (`cinderTurnEnd`) viết: *"At half health the shell splits: it loses
FREEZE immunity. A hard reward for a player who…"* và kiểm
`wounded(enemy) && enemy.immunities.includes('FREEZE')`.

Nhưng bảng lớp của nó là `immunities: ['BURN']` (`data/zombies.ts:215`), và **không nơi nào
trong repo thêm FREEZE cho Cinder** (đã grep cả `unitFactory`, `encounterBuilder`,
`BOSS_INITIAL_STATE`). Hệ quả kép:

- Nhánh phase-2 kia **chưa từng chạy một lần nào**.
- Cinder **đóng băng được từ lượt 1**, nên phần thưởng BĂNG không mở ra điều gì với nó cả.

**Sửa: thêm `'FREEZE'` vào `immunities` của `CINDER_COLOSSUS`.** Một từ. Đổi lại nhận đúng ba
thứ: đoạn code chết sống lại, phase-2 của trùm có nghĩa, và mắt xích quay-lại của mục 3 tự
thành hình — cầm BĂNG từ chặng II về, Cinder mất áo giáp ở nửa máu.

### 5.2 · Mắt xích đứt: Maw không phải chìa của Ironcart — vá HAI đầu

Ironcart `attackRange: 4`, đi trên ray, và `railStandoff` **luôn lùi tới ô xa nhất mà vẫn còn
người trong vòng cung**. Maw có move 3, cắn tầm 1, và Devour bị làm cùn trước trùm. Người chơi
cầm Maw đi đánh Ironcart không có thêm một công cụ nào.

Hai đầu đều phải vá, và chúng khớp vào nhau thành MỘT bài học chứ không phải hai bản sửa rời.

#### 5.2.a · Đầu con trùm: TẦM BẮN TỐI THIỂU

Pháo không bắn được thứ đứng sát mặt — `inArc` đổi từ `d <= reach` thành `d >= 2 && d <= reach`,
khoảng sáu dòng trong hook `ironcart`.

- Nó **hoàn thành đúng luận đề của chính con trùm** ("đứng đúng chỗ không còn đủ") bằng cách
  nói ra chỗ đúng là chỗ nào: **sát nó**. Con trùm vốn đã lùi mỗi lượt; giờ cú lùi ấy có nghĩa.
- Maw là hero cận chiến **nhanh nhất** (move 3) và là thứ duy nhất xoá sạch hộ vệ chắn đường vào.
- Không đụng luật nào khác: `aimShell` nguyên, telegraph nguyên.

⚠️ **Vùng mù KHÔNG tự nó an toàn, và đây là chỗ dễ hiểu sai nhất của cả bản vá.** Cart move 3
trên ray: cắn xong nó lùi ra tầm ≥2 rồi nã thẳng vào Maw đang bất lực. Thứ khoá nó lại đã có
sẵn và được ghi rõ trong repo — *"turnManager re-walks a boss path against live occupancy and
cuts it at the first blocked tile, which is the counterplay that makes Ironcart's retreat
blockable"* (`bossBehaviours.ts`, chú thích của `sandreaverMove`). Nên bài học đầy đủ là **CHẶN
RAY rồi mới cắn**: một thân thể đặt trên đường lùi + Maw áp sát = pháo không lùi được, không
bắn được, và ăn một cú cắn mỗi ba lượt. Đó là hình dạng đúng của trận này, và nó phải là câu
viết trong `hint`.

#### 5.2.b · Đầu Maw: DEVOUR làm lại — xoá ngoại lệ, digest trả mỗi lần, thêm chảy máu

Sự thật hiện tại, đọc từ code chứ không từ mô tả skill:

```ts
if (skill.id === 'burrow_strike' && (targetUnit.isMassive || targetUnit.bossId)) rawDmg = 1;
```

**Devour làm 1 sát thương lên trùm, giá 75 Sun** — và digest chỉ kích hoạt khi có `UNIT_DIE`,
tức trùm không chết thì cũng không phải trả downtime. Nút đắt nhất trong kit của Maw **không
tồn tại trong cả chín trận trùm**. Đó là lỗi lớn hơn mắt xích gãy.

**Ba thay đổi, và cả ba đều phải đi cùng nhau:**

1. **Xoá hẳn dòng ngoại lệ. GIỮ NGUYÊN 7, không nâng thành "số to".** Repo đã đi con đường đó:
   Devour từng là 999 — *"một cú giết tức thì đội lốt con số"* — nó cần một ngoại lệ ma thuật
   để sống sót, *"và ngoại lệ chính là phần bị mục"*. Chú thích hiện tại nói 7 khiến ngoại lệ
   *"thôi không còn chịu lực"*. Nâng số to trở lại là dựng lại đúng cái bẫy ấy ở tốc độ chậm.
   7 vẫn xoá sổ thân dày nhất phe thường và là 35% thanh máu một con trùm 20. Nếu chơi thử thấy
   mạnh quá thì núm vặn là **độ dài digest** hoặc **giá Sun**, tuyệt đối không phải một ngoại lệ
   mới — và **không phải hạ con số xuống 5**, xem bảng ngay dưới.

   **Mốc 7 đã tra lại trên bảng số HIỆN TẠI** (đợt "giáp là kim loại, và chỉ kim loại" đã đổi
   Conehead từ giáp sang máu, nên phải kiểm chứ không tin comment cũ). Giáp trừ thẳng mỗi cú
   đánh (`gameLogic.ts:373`), ELITE nhân máu 1.5:

   | Thân dày nhất phe thường | Máu + giáp | Raw cần để xoá sổ |
   |---|---|---|
   | Football ELITE | floor(4×1.5)=6 **+ giáp 1** | **7** ← mốc |
   | Disco / Flag ELITE | 6, không giáp | 6 |
   | Buckethead ELITE | 4 + giáp 1 | 5 |
   | Conehead ELITE | 4, không giáp *(giáp đã bị lấy đi, máu 2→3)* | 4 |

   Football giữ nguyên cả 4 máu lẫn giáp 1 qua đợt rework, nên **mốc 7 vẫn đúng từng đơn vị**.
   **Devour 5 làm gãy đúng cái mốc ấy**: 5 vào Football elite = 4 sau giáp, nó SỐNG. Maw thôi
   là đao phủ của thân dày nhất — mất đúng thứ con số này được suy ra để làm. Đổi lại chẳng mua
   được gì: 5 vào trùm 20 máu là 25% thay vì 35%. Muốn anh dùng được nhiều hơn thì vặn
   **downtime**, đó mới là đồng tiền đúng.

   Ăn theo miễn phí: `BLEEDING` cộng +1 **SAU bước trừ giáp** (plan Zephyr §8, cố ý như vậy để
   giáp không nuốt mất) — nên vết cắn của Maw tự nó là một công cụ xuyên giáp, nằm ngay cạnh
   Nấm Nam Châm trong cùng một khoảng thiết kế mà không giẫm lên nó (nam châm *lột hẳn* giáp,
   vết thương *lách qua* giáp đúng một cú).
2. **Digest trả mỗi lần bấm, nhưng ĐỘ DÀI theo việc đã xảy ra: nuốt trọn một thân = 2 lượt,
   chỉ ngoạm được một miếng = 1 lượt.**

   Bản nháp trước của mục này ghi "luôn 2 lượt" và **đó là định giá sai** — sửa lại ở đây sau
   khi tra `SUN_PER_TURN_INCOME = 25`: **75 Sun ĐÃ là ba lượt thu nhập nền**, tức giá Sun tự
   nó đã là nhịp ba lượt. Chồng thêm 2 lượt bất lực lên trên là thu tiền hai lần cho cùng một
   thứ.

   Nhưng bỏ hẳn downtime thì hỏng theo đường khác, và đây mới là lý do digest phải tồn tại:
   **Harvest của Sunspot là 50 Sun/lượt.** Đội có cô là đội nuôi được một cú Devour MỖI LƯỢT —
   7 sát thương/lượt từ một hero, 49 qua bảy lượt, hơn thanh máu của bất kỳ con trùm nào. Giá
   Sun là cái van co giãn theo đội hình; **digest là cái van duy nhất không co giãn.**

   1 lượt (thay vì 2) khi không giết được ai giữ đúng cả hai đầu: nhịp trùm thành một cú cắn
   mỗi hai lượt, và hành vi với lính thường **không đổi cảm giác** so với hôm nay. Fiction cũng
   thẳng: không ai tiêu hoá thứ mình chưa nuốt. Hai recipe đang chết trong trận trùm
   (`DIGEST_REDUCTION`, `ARMOR_WHILE_DIGESTING`) vẫn sống lại đúng tại đây.
3. **Devour gây `BLEEDING`.** `PLAN-hero-zephyr.md` §4 đã ghi gear Chomper = món A
   `BONUS_DAMAGE` (từ đòn thường) / **món B `BLEED_ON_HIT` (từ kỹ năng)** — mà món B theo định
   nghĩa của khung là *đặc điểm của KỸ NĂNG chủ nhân*, trong khi Devour hôm nay không gây chảy
   máu gì cả. Gear đang bán một đặc điểm chủ nhân không có. Và quyết định 13 của plan đó —
   **BLEEDING đi ngoài cửa miễn nhiễm `STATUS` nên dính cả trùm** — biến bleed thành cơ chế
   duy nhất trong game được thiết kế có chủ đích để ăn vào trùm. Đúng phương tiện.

**Hai đầu khớp lại:** áp sát → pháo mất tầm → cắn 7 + mở vết thương → hai lượt digest **an toàn
vì đang đứng trong vùng mù VÀ vì đường lùi của cart đã bị chặn**. Một bài học duy nhất, đọc
được ngay trên bàn cờ: *chui vào trong nòng và khoá đường lùi, khẩu pháo chỉ còn là bức tường.*

**R1 mạnh lên theo:** Gargantuar là **cú đánh đơn to nhất bàn cờ** (5 sát thương vào hero 6
máu). *"Giờ cú đánh to nhất là của bạn"* sắc hơn hẳn *"mồm to đối mồm to"*.

**Lỗ nó mở ra, phải chốt kèm:** recipe chữ ký `CHOMPZILLA:MAT_CHOMPER` (mỗi hero mở sẵn công
thức với cây gốc của mình, `SIGNATURE_MATERIAL`). Devour đã tự chảy máu thì fuse Maw với chính
Chomper thành **no-op**. Ô đó cần nghĩa mới — ứng viên: bleed lan sang **đòn cắn miễn phí**,
hoặc vết thương nặng gấp đôi (+2 thay vì +1).

**Kiểm lại khi code:** `utils/gameLogic.ts:111` cũng viện dẫn luật này (*"…never `isMassive`
(utils/skillResolution.ts caps burrow_strike the same way)"*) — điểm thứ hai đọc cùng một quy
tắc, phải rà cùng lúc. Và `isMassive` được gán cho **mọi Gargantuar, kể cả lính thường**
(`encounterBuilder.ts:105`), nên bỏ ngoại lệ nghĩa là Gargantuar thường cũng ăn 7 thay vì 1 —
đúng ý (16 máu, 7 không xoá sổ được nó), nhưng phải nói ra để lần cân bằng sau không giật mình.

Phương án thay thế đã cân nhắc và loại: **đổi thứ tự I-1/I-2** (Ironcart thành hồi mở màn, trả
Cobb; Gargantuar thành hồi 2). Chuỗi sẽ đẹp hơn một chút (Butter Splat ghim đứng Gargantuar —
nó chỉ miễn PUSH, **không** miễn STUN), nhưng đổi lại phải viết lại phần mở màn của cả game,
trong khi Gargantuar là con trùm dạy luật "có thứ không đẩy được" và luật đó phải tới trước.

### 5.3 · Mắt mờ: Zephyr → Sandreaver — ✅ ĐÃ TRIỂN KHAI

> Bản nháp đầu của mục này đề xuất *"`pickHole` không đếm unit BAY"* — tức biến "bay" thành
> một thuộc tính thụ động khắc chế burrow. **Đã loại**, và bản đã code thì hay hơn: khắc tinh
> là **một quyết định của người chơi**, không phải một dòng lý lịch của hero.

Sandreaver chấm ô trồi theo **số hero đứng kề** (`pickHole`) nên hố ngon nhất luôn nằm giữa đội
hình. Câu trả lời là **KHÓI**, hai tầng, dùng đúng một cửa `TileData.smoke`:

- **Phòng ngừa** — `pickHole` **bỏ qua ô đang có khói**. Rải khói trước khi nó lặn = đất cát từ
  chối, hố bị đẩy ra khỏi lòng đội hình. *(đã code, `bossBehaviours.ts`)*
- **Phản ứng** — hố được công bố **trọn một lượt trước**, nên quả bom thả ĐÚNG lên hố huỷ luôn
  cú nổ qua `blinded()`. *(đã sống sẵn, không sửa gì)*

Và cơ động là thứ nối hai tầng: nó teleport 4 ô, nên chỉ hero **move 4 + bay** mới bám kịp để
rải khói lên cái hố mới. Thêm một điều hợp lý mà không ai thiết kế ra: **không ô nước-mã nào kề
Zephyr**, nên vị trí bắn của cô luôn nằm NGOÀI vòng nổ 4 ô — hình học súng chính là thứ giữ cái
thân 4 máu sống sót trước đòn 4 sát thương.

**Bom Khói chỉnh lại theo: 5 ô/2 lượt → 2 ô/3 lượt.** Luật mù là ĐỐI XỨNG (`getValidSkillTargets`
chặn cả skill có `DAMAGE` của quân mình), nên tấm dấu cộng 5 ô rào chính tuyến của mình cũng
nhiều như rào địch. Ô thứ hai là ô kề **phía người ném** — mây luôn nằm giữa Zephyr và thứ cô
vừa làm mù, tức phủ đúng đường rút, đúng lời skill tự hứa.

**Và khói KHÔNG huỷ triệu hồi nữa** — `turnManager` từng chặn cả `ATTACK` lẫn `SPAWN`, trong khi
phía người chơi chỉ chặn skill có `DAMAGE`. **Hai bên đang không cùng một luật**, và hệ quả là
một quả bom 50 Sun tắt được đợt vũ công của Headliner — tức Zephyr thành lời giải cho cả hồi
III-1. Bỏ `SPAWN` khỏi cửa: bốn nguồn triệu hồi (Headliner, echo của Blightlord, imp toss của
Gargantuar, `summon_backup`) đều sống qua khói.

⚠️ **Bẫy đã ghi vào comment tại chỗ, đừng gỡ:** cửa mù phải khoá theo **loại intent**, không
bao giờ theo "intent nhắm ra ô khác". Đòn trồi của Sandreaver là `ATTACK` **nhắm vào chính ô nó
đứng** (`damage: 0`, vòng sát thương nằm trong `strikes`) — cách đọc kia sẽ cho đúng cú đánh mà
hazard này sinh ra để trị lọt qua, và không có gì trông giống lỗi cả.

**Đã đo (import thẳng module, không qua UI):**

| Tình huống | Kết quả |
|---|---|
| Zephyr (3,3) ném (3,5) | phủ (3,5) + (3,4) — ô thứ hai về phía cô ✓ |
| ném (1,3) | phủ (1,3) + (2,3) ✓ |
| ném chéo (4,4) | phủ (4,4) + (3,4) — hoà thì cắt theo thứ tự đọc ✓ |
| ba hero quanh (4,4), không khói | trồi đúng (4,4) — giữa đội hình |
| khói phủ (4,4) | né sang (3,3) — hố xấu hơn ✓ |
| khói phủ cả vành trong | đẩy ra (2,3), **vẫn trồi lên, không stall** ✓ |

### 5.4 · Ba mắt xích đang đúng nhưng là TÌNH CỜ — phải ghi thành luật

Một mắt xích không được viết ra là một mắt xích lần rebalance sau sẽ bị bẻ mà không ai biết:

1. **LỬA → Armada.** Armada rụng **một** túi khí mỗi LƯỢT nó ăn đòn, bất kể ăn mấy đòn
   (`armadaCellsLeft` đọc mốc HP, và chú thích nói rõ là tính cả sát thương nhận trong lượt
   ĐỊCH: gai, bãi gai, ô lava). BURN tick đúng trong lượt địch → **một vết cháy = một túi khí,
   không tốn hành động nào.** Đây là R2 hoàn hảo và hiện không có một dòng chữ nào nói về nó.
2. **Chardwall → Clockjaw.** Clockjaw không nằm trong `MASSIVE_BOSSES` nên hất được; Vault
   Toss/Sweep đẩy 2 ô là con trùm ba-đòn-một-lượt không chạm tới ai. Chưa ghi ở đâu.
3. **Gourdward → Voltmaw.** Đã ghi trong `PLAN-hero-zephyr.md` §6.3 — giữ nguyên, và nhấc câu
   đó lên thành `hint` của hồi để người chơi đọc được.

### 5.5 · Chuỗi phải NHÌN THẤY ĐƯỢC, không thì nó không tồn tại

Đây là phần quyết định "cảm giác Mega Man", và nó rẻ nhất trong cả plan.

Thẻ Hồi ở màn chọn chiến dịch **đã vẽ sẵn chân dung phần thưởng và nhãn MỞ KHOÁ**. Thêm đúng
một dòng dưới đó: **"chìa khoá cho: ‹tên trùm hồi kế›"**. Dữ liệu tự có — hồi kế là
`actsOfStage(stage)[act]`, phần thưởng là `boss.hero ?? boss.element`.

Và viết lại `hint` của chín trùm theo đúng khuôn hai vế:

> *«Nó làm X. Hạ nó, đoạt lấy X. Và X chính là thứ ‹trùm kế› không chịu nổi.»*

Hint hiện tại chỉ có vế một và vế hai. Vế ba là toàn bộ R2, và nó đang không tồn tại trong game
dưới bất kỳ hình thức nào — kể cả với ba mắt xích đã chạy đúng.

### 5.6 · Ba ô R1 chưa đạt — đóng bằng CHỮ, không bằng code

Sau khi chốt luật mới (3a), ba ô trong bảng mục 2 không đọc ra "mang sức mạnh của chính nó".
Cả ba đóng được bằng cách viết lại luận đề, **không đổi một dòng luật chơi nào** — và cách đọc
mới không phải là nguỵ biện, nó là cách đọc đúng hơn về chính con trùm:

| Ô | Cách đọc cũ (câu trả lời) | Cách đọc mới (mang sức mạnh của nó) |
|---|---|---|
| Sandreaver → **Thornhide** | "taunt là thứ nó không đào vòng qua được" | **Nó chọn nơi trận đánh diễn ra** — trồi lên đúng giữa đội hình bạn. Provoke là đúng quyền năng đó, đổi chủ: giờ *bạn* chọn chỗ, và mọi thứ trong 3 ô phải tới đó |
| Headliner → **Chardwall** | "một cây giáo xuyên cả hàng" (Thornquill, đã nghỉ) | **Nó không bao giờ tự tay chạm vào bạn** — nó biến kẻ khác thành mối đe doạ. Chardwall `damage: 0`: anh cũng không bao giờ tự tay gây một điểm sát thương nào, anh giết bằng chỗ kẻ địch rơi xuống. Hai kẻ thắng mà không đánh |
| Clockjaw → **Gourdward** | "động từ còn lại là ABSORB" (và sau đổi giáp-lớp thì sai — mục 6.1) | **Nó lấy nhiều hành động hơn phần của mình.** Encase mới (`PLAN-hero-zephyr.md` §6.3) là hình dấu cộng — *một* hành động dựng *bốn* lớp chắn. Cùng một tội, khác phe |

Phương án thay thế đã cân nhắc và **loại**: đảo Thornhide ↔ Gourdward (Clockjaw trả Thornhide —
"nó đánh hai lần, anh đánh trả mỗi lần" là R1 rất mạnh). Đổi lại mất hai thứ đắt hơn:
Sandreaver → Gourdward không vọng lại gì cả, và **mất mắt xích ward-SHOCK → Voltmaw** mà
`PLAN-hero-zephyr.md` §6.3 đã cố ý dựng. Một R1 mạnh không đáng đổi một R1 chết cộng một R2
mạnh.

## 6 · Hai chỗ lệch phải chốt trước khi viết chữ

1. **Hint của III-2 sẽ SAI sau khi đổi giáp-lớp.** Chú thích Clockjaw hiện viết act này trả
   Gourdward *"vì động từ còn lại là ABSORB và SPREAD"*. Nhưng `PLAN-hero-zephyr.md` §6.0 chốt
   giáp thành **lớp chắn chặn trọn một nguồn rồi vỡ**, và tự nhận: *"Lớp chỉ chặn búa ĐẦU —
   trùm đánh-hai-lần tự nhiên thành khắc tinh của lớp chắn."* Tức phần thưởng của Clockjaw là
   thứ Clockjaw khắc chế. Theo Mega Man thì không sai (vũ khí tới SAU con trùm), nhưng lời phải
   đổi: giá trị của Gourdward ở đây là **ward ba nguyên tố cho Voltmaw**, không phải lớp chắn.
2. **Hint của II-1 hứa dìm chết Armada** (*"take the hands that throw them into the sea"*) —
   viết cho Chardwall, mà Chardwall đã dời sang III-1. Bản thân Armada **miễn DROWN** khi còn
   bay và chỉ mất miễn nhiễm lúc rơi (`bossBehaviours.ts:1002-1015`), nên câu ấy vốn cũng chỉ
   đúng nửa. Plan Zephyr đã liệt việc viết lại hint này (§11) — chốt luôn nội dung mới theo
   khuôn ba vế của 5.4: *thổi bay túi khí ← LỬA từ chặng trước; đoạt lấy bầu trời ← Zephyr.*

## 7 · Chi phí

| Việc | File | Cỡ |
|---|---|---|
| **Viết lại luật thưởng (3a)** — "mang sức mạnh của nó + là chìa cho mối đe doạ kế" | `data/unlocks.ts` khối chú thích đầu file | đoạn văn |
| **Tuyến tính hoá (3.2)** — `openAt` đọc thứ tự bảng `BOSSES`; viết lại chú thích bảo vệ luật cũ; rail chặng 2/3 hiện khoá | `components/StageSelectScreen.tsx` (+ `data/unlocks.ts` nếu tách helper) | ~15 dòng |
| Cinder miễn FREEZE (5.1) | `data/zombies.ts` | một từ |
| Ironcart có tầm bắn tối thiểu (5.2.a) | `utils/bossBehaviours.ts` hook `ironcart` | ~6 dòng |
| **Devour: bỏ ngoại lệ trùm** (5.2.b) | `utils/skillResolution.ts:288` (+ rà `gameLogic.ts:111`) | xoá 1 dòng |
| **Devour: digest trả mỗi lần bấm** (5.2.b) | `utils/skillResolution.ts:809` — bỏ điều kiện `UNIT_DIE` | 1 dòng |
| **Devour gây `BLEEDING`** (5.2.b) | `data/heroes.ts` effects + đường `BLEEDING` của plan Zephyr §8 | 1 effect |
| Recipe chữ ký `CHOMPZILLA:MAT_CHOMPER` hết nghĩa (5.2.b) | `data/fusionRecipes.ts` | 1 ô |
| Viết lại khối chú thích định giá Devour (bản ghi thiết kế) | `data/heroes.ts` | đoạn văn |
| ✅ Sandreaver không trồi lên ô có khói (5.3) | `utils/bossBehaviours.ts` `pickHole` | XONG |
| ✅ Khói không huỷ `SPAWN` nữa (5.3) | `utils/turnManager.ts` cửa `blinded` | XONG |
| ✅ Bom Khói 5 ô/2 lượt → 2 ô/3 lượt (5.3) | `data/heroes.ts` + `skillResolution.ts` + `i18n/vi.ts` | XONG |
| Dòng "chìa khoá cho:" trên thẻ Hồi (5.5) | `components/StageSelectScreen.tsx` | ~10 dòng |
| Viết lại 9 `hint` theo khuôn ba vế (5.4, 5.5, 5.6, 6) | `data/unlocks.ts` + `i18n/vi.ts` | 9 cặp chuỗi |
| Chú thích luật cho ba mắt xích tình cờ (5.4) | `bossBehaviours.ts`, `heroes.ts` | chỉ comment |

Không đụng: cân bằng số, engine trận đánh, ma trận fusion, `roster.assert.ts`, và **không đụng
gì tới vòng lặp chơi lại** — nó đã chạy sẵn (3.1).

⚠️ **Kiểm tra bắt buộc khi tuyến tính hoá:** `roster.assert.ts` đang chứng minh lưới chiến dịch
đầy đủ (3 chặng × 3 hồi, một trùm một ô). Nếu thêm luật thứ tự thì assert nên chứng minh luôn
**dây chuyền R2 không có lỗ**: mỗi hồi (trừ hồi cuối) phải khai được "chìa cho hồi kế". Một
bảng `KEY_FOR: Record<BossId, BossId>` sinh từ thứ tự + assert là chỗ rẻ nhất để chuỗi này
không âm thầm đứt trong lần rebalance sau — đúng bài học của `nextUnbeatenBoss` "luật tạm sống
hai năm".

## 8 · Câu hỏi mở

1. **Tầm tối thiểu của Ironcart (5.2)** — chốt phương án này, hay chọn đổi thứ tự I-1/I-2?
   (Tuyến tính hoá làm câu này gấp hơn: khi không còn đường đi vòng, mắt xích đứt duy nhất
   trở thành bức tường của người chơi mới.)
2. **BĂNG → Cinder là mắt xích quay-lại chính thức?** Nếu có, `hint` của Yeti nên trỏ NGƯỢC
   về Kiln Row — điều chưa hồi nào trong game làm (mọi hint đều trỏ tới trước). Đây là lý do
   tồn tại của hồi đã-hạ sau khi tuyến tính hoá.
3. **Có cần mắt xích cho Zephyr → Sandreaver mạnh hơn không?** Hiện "đúng nhưng mờ", và Zephyr
   4 máu đứng cạnh cú nổ 4 sát thương thì chết. Ứng viên rẻ: Sandreaver **không trồi lên dưới
   ô có unit BAY** — một dòng trong `pickHole`, biến "bay" thành câu trả lời đọc được.
4. **BĂNG → Headliner là mắt xích yếu nhất còn sót** (làm chậm đám đông, nhưng đám đông chết
   vì đòn diện rộng). Sau tuyến tính hoá nó thành mắt xích BẮT BUỘC. Chấp nhận, hay cần một
   luật rẻ (vd: vũ công gọi lên trên ô băng thì trồi ra đã bị làm chậm sẵn)?
5. **Nghĩa mới cho ô `CHOMPZILLA:MAT_CHOMPER`** (5.2.b): bleed lan sang đòn cắn miễn phí, hay
   vết thương nặng gấp đôi (+2)? Ô này là công thức chữ ký — nó mở sẵn từ đầu, nên nó cũng là
   thứ người chơi mới gặp trước tiên.
6. **Devour 7 sau khi bỏ ngoại lệ có quá mạnh trong Vết Nứt không?** Chín trùm liên tiếp, và
   `ARMOR_WHILE_DIGESTING` giờ có nghĩa ở cả chín. Chơi thử trước khi vặn số.
7. **Nói thẳng chuỗi ra, hay để người chơi tự tìm?** Đề xuất: **nói** — thẻ Hồi đã là màn
   brief, và game xây trên perfect information; giấu chuỗi là đi ngược chính nó. Vòng lặp
   "thua rồi quay lại lấy A" (3.1) vẫn nguyên vẹn kể cả khi đã nói, vì cái người chơi thiếu ở
   lần một là **ĐỘI HÌNH ĐÃ CHỐT**, không phải thông tin.
