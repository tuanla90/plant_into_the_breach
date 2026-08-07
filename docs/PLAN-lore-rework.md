# PLAN — Đồng bộ lore v2 ↔ cơ chế game

Đi kèm `docs/game_lore.md` (v2). File này liệt kê các thay đổi CƠ CHẾ và NỘI DUNG cần
triển khai để game khớp lore, kèm hiện trạng code. Chưa có dòng code nào được sửa —
đây là spec chờ duyệt từng mục.

---

## §0. Định vị phe ta — Bio-Mech (quyết định cấp dự án)

**Chốt theo lore v2:** phe ta là **Bio-Mech** — cấu trúc thực vật lai cơ khí có linh hồn,
KHÔNG phải con người mặc giáp.

- Mâu thuẫn cần xử lý: `MASTER-VISION.md` §1 hiện ghi *"Phe Ta là CON NGƯỜI (Đặc nhiệm
  sinh tồn)"*. Cần sửa lại mục đó khi duyệt spec này.
- Vì sao an toàn về bản quyền: mối lo gốc của MASTER-VISION là "cây nhân hóa kiểu PvZ"
  (mặt cười, cây hoạt hình). Bio-Mech với mặt nạ phòng độc + áo choàng + mắt phát sáng
  là một design language khác hẳn — và **art đã ship đang vẽ đúng hướng này** (xem
  `art-src/`: "Chibi_soldier_made_of_corn", "Hooded_plant_sniper", "Frost_marksman").
  Tức là sửa MASTER-VISION cho khớp art + lore, không phải sửa art.
- Nhân vật đi cùng đoàn: cả 9 hero đều **đi cùng đoàn lữ hành** (lore: đoàn xe + Cỗ Tàu);
  màn chọn squad là chọn **ai ra trận**, không phải ai tồn tại. Sunbloom vì thế luôn có
  mặt để làm người kể chuyện + người thực hiện nghi thức hồi sinh, kể cả khi không được
  triển khai — cơ chế hồi sinh KHÔNG phụ thuộc việc Sunbloom nằm trong squad.

## §1. Hồi sinh — đổi từ 75 Coin sang 1 Sprout tại node nghỉ

Hiện trạng: hồi sinh giá `COIN_REVIVE_HERO = 75` tại campfire/camp (`constants.ts`,
`components/CampScreen.tsx`, DESIGN.md §2 "cố ý rẻ").

Đổi thành:
- Tại **node nghỉ (Tháp Xanh)**: hồi sinh = tiêu **1 sprout** từ ngân sách run (không tốn
  coin). Vẫn là 1-trong-3 lựa chọn loại trừ của node nghỉ (Ngủ / Hồi sinh / Hợp Trái).
- Sprout trở thành "tiền sinh mạng" thống nhất: zombie ăn nhà −1 sprout, hồi sinh −1
  sprout, hết sprout = hết run. Mua thêm ở shop (§2).
- **Camp của The Breach giữ nguyên giá Coin** — Breach không có luật sprout
  (`data/unlocks.ts` hint Blightlord: "no sprout rule"), nên ở đó sprout không tồn tại
  để mà tiêu.
- Lưới an toàn "cuối chapter hồi sinh miễn phí" (DESIGN §2) giữ nguyên — lore: cập bến
  miền đất mới, cả đoàn được Cỗ Tàu tái tạo.
- **Cân bằng cần canh:** ngân sách 5 sprout/run giờ gánh cả thua-nhà lẫn hồi sinh →
  cần playtest; có thể nâng ngân sách gốc lên 6, hoặc để nguyên 5 cho đau. Đề xuất:
  giữ 5, vì shop đã có van xả (§2).

File đụng tới (ước lượng): `constants.ts`, `hooks/useGameProgression.ts`,
`components/CampScreen.tsx` (tách nhánh campfire/camp), `components/EventScreen.tsx`
(event hồi sinh nếu có), i18n, DESIGN.md §2/§5.

## §2. Shop bán Sprout — giá "toàn bộ xu"

Mới hoàn toàn:
- Mỗi lần ghé shop, có **1 suất Mầm Sống** (mua tối đa 1/lần ghé).
- Giá = **toàn bộ coin đang có**, với **sàn tối thiểu** (đề xuất **100 coin** — dưới sàn
  thì nút khóa, "lão Mulch chê túi nhóc nhẹ quá").
- Vì sao không giá cố định (đúng lo ngại của chủ dự án): giá cố định rẻ → mỗi shop +1
  mầm, ngân sách sprout mất răng. Giá all-in tạo đúng thế lưỡng nan của lore: mua mạng
  là từ bỏ mọi kế hoạch mua cây/fusion của node đó — và người chơi giàu trả nhiều hơn
  người chơi nghèo, tự cân bằng.
- UI: dòng riêng trong ShopScreen, giá hiển thị = số coin hiện tại, tooltip câu của
  Mulch: "Đổ hết vào đây."

File: `components/ShopScreen.tsx`, `hooks/useGameProgression.ts`, i18n, DESIGN.md §5.

## §3. Blueprint — thay Cấp Chỉ Huy làm đơn vị mở công thức fusion

Hiện trạng: 1 level chỉ huy = 1 công thức; XP từ layer/objective/act
(`data/unlocks.ts` COMMANDER LEVEL block). Hero unlock qua boss — **giữ nguyên, đã khớp lore**.

Đổi thành:
- **+1 Blueprint mỗi lần đặt chân tới node nghỉ (Tháp Xanh)** — đếm cả những lần đến ở
  run thua (meta-progression, lưu trong `pitb_progress_v1`).
- 1 Blueprint = mở 1 công thức fusion (giữ nguyên UI chọn công thức hiện tại của level).
- Hệ XP/level chỉ huy **nghỉ hưu**; migration: level hiện có quy đổi 1:1 thành blueprint
  chưa tiêu (đừng làm mất tiến trình người chơi — `pitb_progress_v1` là vùng cấm mất).
- Trần vẫn tự sinh từ nội dung như `levelCapFor` (số cặp hero×material còn lại).
- Bonus objective hiện trả recipe (3 objective = 1 recipe) → **đổi sang trả Relic** (§4),
  hết vai trò trả recipe.
- **Cân bằng cần canh:** tần suất node nghỉ ~10%/map + luật "mỗi 3 tầng có campfire"
  (DESIGN §2) → ước 1–2 blueprint/run, chậm hơn 2–3 level/run hiện tại. Nếu đói, cho
  event/Tàn Cơ thưởng thêm blueprint lẻ.

File: `data/unlocks.ts`, `utils/persistence.ts` (migration), `hooks/useGameProgression.ts`,
màn hình hiển thị level (App/Codex), i18n, DESIGN.md §7.

## §4. Relic qua mission của Tàn Cơ

- Bonus objective / mission trong trận (`data/missions.ts`) được đóng khung lore là
  **Tàn Cơ giao việc** (xe cơ giới hỏng, AI tàn dư — tên EN đề xuất: **Derelict**).
- Hoàn thành mission → mở khoang chứa → **+1 Relic** (pool `PLAN-relics-27.md`).
- KHÔNG dùng chữ "Materials" cho các NPC này — Material là 9 thân cây nguyên liệu,
  thuật ngữ đã chiếm (`data/materials.ts`).

File: `data/missions.ts`, hệ relic (theo PLAN-relics-27), i18n.

## §5. Tutorial — dựng lại theo mạch lore chương 2

Nguyên tắc giữ: xương sống 4 bàn "mất hero là thật → dự bị là bảo hiểm → dự bị thay vị
trí không thay người → hồi sinh có giá" (TUTORIAL-SCRIPT.md) — mạch này KHỚP lore mới,
chỉ đổi vai và bối cảnh:

| Bàn | Cũ | Mới theo lore |
|---|---|---|
| 0 (intro comic) | Neon sụp đổ, 3 người thường | Bộ comic mới (§6) — hầm ngầm, vượt khe nứt, lạc Ironhusk |
| 1 | Peaburst bảo vệ Sunbloom kiệt sức | Giữ nguyên gameplay; thoại đổi: hai chị em vừa rơi xuống rìa Vành Đai Xanh, Sunbloom choáng sau cú vượt khe nứt, **Ironhusk mất tích** |
| 2 | Peaburst tử trận (ép chết) | Giữ — đây chính là "Peaburst đỡ đạn cho Sunbloom" của lore; thoại nói rõ: *không kịp hồi sinh vì đang bị săn đuổi, phải tới được Tháp Xanh* |
| 3 | Mua Súng Hạt ở xe Mulch làm dự bị | Giữ — Mulch xuất hiện lần đầu, giọng "lão thu gom" |
| 4 | Cây dự bị lấp chỗ Peaburst | Giữ + **Ironhusk trở lại tại bàn này**, tử thủ cạnh một **xe pháo đậu DORMANT** (cây hoang tỉnh khi hero đứng cạnh — dạy luôn cơ chế cây hoang) |
| 5 | Chrona hồi sinh Peaburst | **Sunbloom** thực hiện nghi thức tại Tháp Xanh đầu tiên (node nghỉ), Chrona chỉ *hướng dẫn*; chi phí 1 sprout hiển thị rõ |
| 6 | Dạy fusion | Giữ; đóng khung "trang Bản Thiết Kế đầu tiên chép được từ tháp" |
| 7 | Thua dàn dựng trước Gravehulk → timeline jump | Giữ nguyên — khớp lore sẵn; đặt tên màn: **Khu Khai Quật Hài Cốt** (act 1, đất của Gravehulk) |

Lưu ý kỹ thuật: bàn 5 hiện là bài học hồi sinh của Chrona — đổi người thực hiện chỉ là
thoại (`data/tutorialDialogues.ts` + TUTORIAL-SCRIPT-STORY.md), nhưng chi phí đổi từ coin
sang sprout thì phụ thuộc §1 làm trước. `data/tutorial.assert.ts` phải chạy lại sau mọi
chỉnh sửa bàn.

## §6. Intro comic mới — 8 khung (`components/IntroComic.tsx` + `i18n/vi.ts:919-926`)

| # | Khung hình | Lời dẫn (VI, đề xuất) |
|---|---|---|
| 1 | Bầu trời đen đặc Miasma trên thành phố chết; đàn xác lết lê bước | Thế giới không kết thúc bằng một tiếng nổ — nó mục rữa dần dưới màn sương Đốm Tàn. |
| 2 | Hầm ngầm; bàn tay Giáo sư chạm vỏ thép; đôi mắt quang học vừa bừng sáng | Trong hầm ngầm cuối cùng, một người cha già đánh thức trái tim ánh sáng cuối cùng. |
| 3 | Sunbloom ôm hộp ấp phát sáng; Giáo sư quỳ trước mặt | "Mỗi Mầm là một linh hồn. Không đồng xu nào định giá được sinh mạng." |
| 4 | Ba bóng dáng đeo mặt nạ, áo choàng rách, đứng trước khe nứt không gian xanh lơ của Chrona | Ba đứa con — ngọn giáo, tấm khiên, trái tim — bước vào vết rách giữa các thế giới. |
| 5 | Cơn bão không-thời-gian; bàn tay Ironhusk tuột khỏi tầm với, chìm vào sương | Cơn bão xé đội hình làm đôi. Tấm khiên biến mất trong màn sương. |
| 6 | Sunbloom và Peaburst rơi xuống vùng đất hoang, xa xa là hố khai quật lúc nhúc | Hai chị em rơi xuống rìa Vành Đai Xanh — nơi bầy đàn đang đào bới thứ gì đó dưới lòng đất. |
| 7 | Peaburst siết súng che cho Sunbloom; mắt cả hai rực sáng trong đêm | Ánh lò trong ngực họ xuyên thấu bóng tối — và gọi mọi con mắt đói khát về phía mình. |
| 8 | Con đường độc đạo hun hút về chân trời; một Tháp Xanh le lói rất xa | Con đường phía trước chỉ có một chiều. Nhưng ở cuối nó, vẫn còn ánh sáng. |

Khung 5 gieo lý do Ironhusk vắng mặt bàn 1–3 (khớp §5). Khung 8 gieo Tháp Xanh trước
khi người chơi gặp node nghỉ.

## §7. Thuật ngữ — chuẩn lại NAMING.md

| Thuật ngữ | Quyết định |
|---|---|
| **Tháp Xanh / Greenspire** | MỘT mạng lưới, hai cấp: **nhà trên bàn cờ** = trạm mầm tiền tiêu của mạng lưới (giữ tên Greenspire); **node nghỉ** = một Tháp Xanh trọn vẹn (đổi tên node "Campfire/Mái Lều" → "Tháp Xanh", icon tháp thay icon lều). Không cần rename code, chỉ đổi string hiển thị + icon |
| **The Blight / Đốm Tàn** | Tên bệnh chính thức (khớp title Blightfall). **Miasma** = màn sương bào tử, "hơi thở" của Blight — hai từ cùng tồn tại, không thay nhau |
| **Derelict / Tàn Cơ** | NPC giao mission (§4). Cấm dùng "Material" cho nghĩa này |
| **Blueprint / Bản Thiết Kế** | Đơn vị mở công thức fusion (§3) |
| **Cộng Hưởng / Resonance** | CHỈ dùng cho mono-element squad bonus (như `elements.ts`). Hồi kết của lore dùng "cân bằng tam nguyên" — không dùng chữ Cộng Hưởng |
| **Gilbert D. Holth / Blightlord** | Canon. Đảo chữ GILBERTDHOLTH = THEBLIGHTLORD đã kiểm đúng 13/13 ký tự — giữ nguyên chính tả tên, đừng "sửa lỗi" chữ D. |
| Old Mulch | "Lão thu gom" — gian thương tưng tưng NHƯNG lời thoại events đã ship (WABBY WABBO, taco van) vẫn hợp: xe tải chở tạp nham là chính lão. Chỉ thêm lớp "cựu kỹ thuật mạng tháp" khi cần |

## §8. Thứ tự triển khai đề xuất

1. **§7 thuật ngữ** (string + icon, rẻ, không đụng luật chơi) + sửa MASTER-VISION §1 (§0).
2. **§1 hồi sinh bằng sprout** — thay đổi luật lớn nhất, làm trước để §2/§5 dựa lên.
3. **§2 shop bán sprout** — van xả cho §1.
4. **§3 blueprint** + migration progress.
5. **§4 relic/mission** (có thể gộp với đợt PLAN-relics-27).
6. **§5 tutorial + §6 intro comic** — làm cuối, khi các luật bên dưới đã đứng yên,
   vì tutorial assert khóa theo luật thật.

Mỗi bước: `npm run typecheck` + mở dev cho `tutorial.assert.ts` tự chạy.

## §9. Câu hỏi còn mở

- Ngân sách sprout gốc giữ 5 hay nâng 6 khi hồi sinh cũng ăn sprout? (§1 — đề xuất giữ 5)
- Sàn giá sprout ở shop: 100 coin? (§2)
- Blueprint có nguồn phụ (event/Tàn Cơ) không, hay chỉ node nghỉ? (§3)
- Node nghỉ đổi icon lều → tháp: có cần art mới không (`art-src/ART-TODO.md`)?
