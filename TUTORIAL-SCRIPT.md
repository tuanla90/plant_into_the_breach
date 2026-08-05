# Kịch bản tutorial — bản tổng hợp để sửa wording

> Sinh tự động từ mã nguồn. Đây là **mọi câu chữ người chơi đọc được** trong 7 bàn mở đầu,
> xếp đúng thứ tự họ gặp. Mỗi dòng kèm `file:dòng` để sửa thẳng.

---

## Bối cảnh — đọc phần này trước nếu bạn chưa quen dự án

### Trò chơi là gì

**Plant Heroes: Blightfall** — game chiến thuật theo lượt trên lưới 8×8, chơi kiểu roguelike:
mỗi lượt chơi (*run*) là một chuyến đi qua bản đồ phân nhánh, thua thì làm lại từ đầu, nhưng
một phần tiến trình được giữ lại giữa các lượt.

Luật lõi mượn từ *Into the Breach*: **địch báo trước đòn của chúng**. Mũi tên đỏ trên bàn cho
biết con zombie nào sắp cắn ai. Người chơi luôn nhìn thấy toàn bộ đòn sắp tới trước khi quyết
định — nên thua là do tính sai, không phải do xui.

Thứ phải bảo vệ là **NÃO**: những căn nhà trên bàn. Zombie không đuổi theo cây, chúng đi tới não.
Cả hành trình có 5 quả não; mất là mất vĩnh viễn, hết 5 quả là thua cả run.

Hai loại tiền, đừng lẫn:

- **Mặt Trời (Sun)** — dùng cho kỹ năng trong trận, đặt lại về 50 mỗi màn. Đây là *nhịp hành động*.
- **Xu (Coin)** — tiêu giữa các màn ở cửa hàng, tích luỹ suốt run. Đây là *tài sản*.

### Tutorial không phải một chế độ riêng

Giống *Plants vs Zombies* — màn 1-1 **chính là** tutorial. Ở đây cũng vậy: bảy node đầu là một
run thật, trên bản đồ thẳng không nhánh. Xu thật, não thật, mất mát thật. Không có gì được giả lập.

Ba nguyên tắc xuyên suốt:

1. **Sự hạn chế mới dạy được.** Bàn 1 chỉ cho một hero dùng được, nên không có lựa chọn sai để thử.
2. **Mỗi câu hướng dẫn là một dòng.** Trần 15 từ, kiểm lúc build. Câu dài hơn nghĩa là bàn chơi sai.
3. **Không có gì là giả.** Mất một quả não ở bàn 4 là mất thật.

### Mạch truyện — bốn bàn liền nhau là xương sống

Đây là chỗ dễ phá nhất khi sửa wording, vì bốn bàn này móc vào nhau:

| Bàn | Chuyện xảy ra | Bài học nó dạy |
|---|---|---|
| 2 | **Shadeleaf tử trận** (kịch bản ép chết, không tránh được) | mất hero là thật |
| 3 | Mua một Xạ Thủ Đậu ở xe hàng làm dự bị | cây dự bị = bảo hiểm |
| 4 | Cây đó ra trận, đứng vào đúng chỗ trống của Shadeleaf | dự bị thay được *vị trí*, không thay được *người* |
| 5 | Chrona hồi sinh Shadeleaf | hero mất rồi vẫn lấy lại được — có giá |

Người chơi **sống** cả bốn nhịp đó thay vì đọc mô tả. Nếu bạn sửa lời ở bàn 3 mà bỏ mất ý
"mua để dành cho lúc thiếu người", thì bàn 4 mất luôn ý nghĩa.

Bàn 7 **được thiết kế để thua**: Gargantuar 20 máu, không thể hạ. Chrona nhảy ngược thời gian,
và đó là cách game giải thích cơ chế roguelike — thua không phải kết thúc, thua là dữ liệu.
Lời thoại trước bàn 7 phải nói trước điều này, nếu không người chơi tưởng game lỗi.

### Nhân vật

| Tên | Là ai | Vai trong tutorial |
|---|---|---|
| **Shadeleaf** | Xạ thủ đậu. Người dẫn chuyện mở đầu | dạy di chuyển + bắn; chết ở bàn 2, về ở bàn 5 |
| **Sunspot** | Hoa hướng dương. Không đánh được, chỉ tạo Sun | bàn 1 cô là *thứ cần bảo vệ*, chưa phải quân cờ |
| **Ironhusk** | Quả óc chó. Chắn đường, đẩy lùi | nhận vai dẫn đầu sau khi Shadeleaf ngã |
| **Old Mulch** | Lão bán hàng | dạy cửa hàng: cây dự bị vs vật phẩm |
| **Chrona** | Cỗ máy thời gian | dạy sự kiện, hồi sinh, ghép cây, và cơ chế thua-làm-lại |

### Ba lớp chữ, hiện ở ba chỗ khác nhau

| Lớp | Hiện khi nào | Trông như thế nào |
|---|---|---|
| **Hội thoại** | trước khi vào node, bỏ qua được bằng một cú bấm | chân dung nhân vật hai bên, như visual novel |
| **Thẻ bản đồ** | khi rê chuột lên node | tên màn + một dòng mô tả + mục tiêu |
| **Lời hướng dẫn** | trong lúc chơi, từng bước một | hộp chữ nhỏ + vòng sáng chỉ vào đúng thứ phải bấm |

Lời hướng dẫn bị trần 15 từ vì nó nằm đè lên bàn chơi. Hội thoại thì không bị giới hạn — nó có cả màn hình.

## Trước khi sửa: có HAI loại text, sửa ở hai nơi khác nhau

| Loại | Viết bằng | Sửa ở đâu |
|---|---|---|
| **Hội thoại + hướng dẫn tutorial** | tiếng Việt trực tiếp | `data/tutorialDialogues.ts`, `data/tutorial.ts` — sửa tại chỗ |
| **Truyện mở đầu + sự kiện** | tiếng Anh, dịch qua từ điển | sửa bản Việt ở `i18n/vi.ts`; **đừng đổi chuỗi tiếng Anh** — nó là khoá tra cứu |

Đổi chuỗi tiếng Anh mà quên đổi khoá trong `vi.ts` thì câu đó lặng lẽ hiện ra tiếng Anh trong game.

## Ràng buộc khi sửa lời hướng dẫn (`note`)

- **Tối đa 15 từ mỗi câu.** `assertTutorial()` đếm lúc build và ném lỗi nếu vượt.
- Áp dụng cho **cả** bàn có đánh nhau (`battle.steps`) lẫn node cửa hàng / sự kiện / lửa trại (`node.steps`).
- Câu nào dài hơn thế thì bàn chơi sai, không phải câu sai — sửa bàn, đừng nới câu.
- Sau khi sửa, chạy `npm run dev` một lần: assertion chạy khi nạp module, sai là báo ngay trong console.
- Hội thoại (`data/tutorialDialogues.ts`) **không** bị giới hạn từ. Chỉ có luật mềm: 3–6 câu mỗi cảnh,
  và cảnh chạy TRƯỚC node nên tuyệt đối không được tiết lộ kết quả của bàn đó.

---

## 0. Truyện mở đầu (8 khung)

`components/IntroComic.tsx` giữ bản tiếng Anh; bản Việt nằm trong `i18n/vi.ts`.

| # | Tiếng Anh (khoá — giữ nguyên) | Tiếng Việt (sửa ở đây) | vi.ts |
|---|---|---|---|
| 1 | Neon Plaza. Just another quiet evening. | Quảng trường Neon. Một chiều thu êm đềm như chưa từng có giông bão. | `919` |
| 2 | Until every screen in the city screamed the same word. | Cho đến khi mọi màn hình thành phố cùng thét lên một tiếng gầm đỏ máu. | `920` |
| 3 | They did not come from the horizon. They came from below. | Chúng không giội xuống từ bầu trời. Chúng trồi lên từ ruột đất tối đen. | `921` |
| 4 | The plaza gate held for exactly four seconds. | Cánh cổng đại lộ đứng vững được vỏn vẹn bốn nhịp tim. | `922` |
| 5 | Three survived. None of them were soldiers. | Ba kẻ sống sót giữa tro tàn. Không một ai trong họ là chiến binh. | `923` |
| 6 | But someone had left the gear behind — as if they knew this day would come. | Nhưng ai đó đã bỏ lại đống vũ khí này — như thể chờ sẵn ngày tận thế. | `924` |
| 7 | Breathe in. Mask on. Shadeleaf walks out. | Siết chặt mặt nạ. Nạp viên đạn đầu tiên. Shadeleaf dấn bước vào đêm đen. | `925` |
| 8 | The city may be lost. The world is not. | Thành phố đã sụp đổ. Nhưng ngọn lửa hy vọng thì chưa. | `926` |

---

## 1. Mở bản đồ

Chạy một lần khi bản đồ tutorial hiện ra lần đầu. Bảng chú giải được ghim mở trong suốt đoạn này,
và các dòng có `highlight` sẽ làm sáng đúng ký hiệu đang được nhắc tới.

### Cảnh mở đầu

`data/tutorialDialogues.ts` — 5 câu

| Dòng | Nhân vật | Lời thoại |
|---|---|---|
| `57` | **Shadeleaf** | (Trỏ tay về phía dải tàn tích) Nhìn xem... Đây là tất cả những gì còn lại. Những chấm sáng tàn úa nối liền thành con đường độc đạo. Đã bước lên đây, chỉ có tiến, không có lùi. |
| `58` | **Shadeleaf** | Hãy nhìn kỹ từng dấu vết trên bản đồ: KIẾM THÉP là nơi máu rơi. TÚI VÀNG là trạm tiếp tế của lão già Old Mulch. MÁI LỀU là chút bình yên hiếm hoi để dưỡng thương. Còn DẤU HỎI... là định mệnh chưa báo trước. |
| `59` | **Shadeleaf** | Và VƯƠNG MIỆN ĐỎ rực ở cuối chân trời... chính là ác mộng đã xé nát Quảng trường Neon đêm đó. |
| `60` | **Shadeleaf** | Đêm tháo chạy... tôi đã để lạc mất họ. Nhưng tôi tin, ở đâu đó trong bóng tối này, đồng đội của chúng ta vẫn đang chiến đấu. |
| `61` | **Shadeleaf** | Dấn bước thôi. Tìm lại từng người một, gom góp chút tàn lực cuối cùng để giành lại thế giới này! |

---

## 2. Bàn 1 — Sân Trước

### Hội thoại trước màn

`data/tutorialDialogues.ts` — 5 câu

| Dòng | Nhân vật | Lời thoại |
|---|---|---|
| `65` | **Shadeleaf** | (Phủi lớp tro tàn, giật mình) Sunspot?! Cậu còn sống sao?! Cố lên, mở mắt ra nhìn tôi này! |
| `66` | **Sunspot** | (Mở mắt tiều tụy, thốt lên) ...Shadeleaf...? Là cậu thật sao... Đầu óc tôi quay cuồng quá... không còn chút sức lực nào để đứng dậy... |
| `67` | **Shadeleaf** | (Nắm chặt tay Sunspot, giơ súng che chắn) Nằm yên đó! Đã có tôi ở đây. Không kẻ nào được chạm vào cậu! |
| `68` | **Zombie** | (Tiếng gầm rú khàn đục trồi lên từ màn sương) Naõooo... thịt tươi... |
| `69` | **Shadeleaf** | Chúng ngửi thấy mùi sống rồi. Chỉ cần trụ vững ba lượt đấu — tôi sẽ dọn sạch lũ quái vật này! |

### Thẻ trên bản đồ

| Trường | Nội dung | Vị trí |
|---|---|---|
| Tên màn | Sân Trước | `data/tutorial.ts:347` |
| Mô tả ngắn | Sunspot kiệt sức giữa vòng vây. Hãy lấy thân mình che chở cho cô ấy. | `data/tutorial.ts:349` |
| Mục tiêu | Trụ vững qua 3 đợt tấn công sinh tử. | `data/tutorial.ts:393` |

### Lời hướng dẫn — 15 câu

| Dòng | Lượt | Câu | Từ |
|---|---|---|---|
| `404` | PLACEMENT | Trận địa vây sẵn rồi. Bấm Bắt Đầu Trận! | 9 |
| `405` | L1 | Bóng Shadeleaf đứng đó. Hãy bấm vào cô ấy. | 9 |
| `406` | L1 | Nạp Đậu Bắn Thường. Đòn này hoàn toàn miễn phí! | 10 |
| `407` | L1 | Mũi tên đỏ chỉ trúng target. Bắn nó ngay! | 9 |
| `408` | L1 | Lượt một an toàn. Bấm Kết Thúc Lượt. | 8 |
| `409` | L2 | Kẻ thù mới ở hàng trên. Bấm chọn Shadeleaf. | 9 |
| `410` | L2 | Đạn bắn thẳng hàng. Bước lên hàng của nó! | 9 |
| `411` | L2 | Thấy đường đạn rồi! Chọn Bắn Đậu ngay. | 8 |
| `412` | L2 | Chỉ định mục tiêu: Bấm vào con zombie. | 8 |
| `415` | L2 | Mục tiêu gục ngã! Bấm Kết Thúc Lượt. | 8 |
| `421` | L3 | Đợt cuối: hai tên nữa. Chọn Shadeleaf. | 7 |
| `422` | L3 | Giơ súng: Bắn Đậu. | 4 |
| `423` | L3 | Khóa mục tiêu: Bắn con hàng C! | 7 |
| `427` | L3 | Nhiệm vụ là SỐNG SÓT — không cần diệt sạch! | 10 |
| `428` | L3 | Tên hàng E không chạm nổi nhà. Kết thúc lượt! | 10 |

---

## 3. Bàn 2 — Cái Hố

### Hội thoại trước màn

`data/tutorialDialogues.ts` — 4 câu

| Dòng | Nhân vật | Lời thoại |
|---|---|---|
| `73` | **Sunspot** | (Gia tăng hào quang, gật đầu) Năng lượng đã hồi phục rồi! Lần này tôi sẽ không làm gánh nặng nữa! |
| `74` | **Shadeleaf** | Ghi nhớ này: Zombie không lang thang vô định. Chúng lao thẳng theo mùi hương của các CĂN NHÀ. |
| `75` | **Sunspot** | (Chỉ xuống đất) Nhìn kìa... mấy cái hố đen ngòm nứt nẻ kia là sao? |
| `76` | **Shadeleaf** | Nơi lòng đất thối rữa đẻ ra quái vật. Đứng đè lên miệng hố là khóa chặt đường sống của chúng. Đi thôi! |

### Thẻ trên bản đồ

| Trường | Nội dung | Vị trí |
|---|---|---|
| Tên màn | Cái Hố | `data/tutorial.ts:438` |
| Mô tả ngắn | Lũ quái tinh nhuệ tràn lên từ lòng đất. Bảo vệ mạch sống bằng mọi giá. | `data/tutorial.ts:444` |
| Mục tiêu | Sống sót qua 4 đợt cuồng phong. | `data/tutorial.ts:537` |

### Lời hướng dẫn — 25 câu

| Dòng | Lượt | Câu | Từ |
|---|---|---|---|
| `550` | PLACEMENT | Vị trí đã cố định. Bấm Bắt Đầu Trận! | 9 |
| `554` | L1 | Zombie xông vào hàng bạn. Bấm chọn Shadeleaf! | 8 |
| `555` | L1 | Chuẩn bị đạn: Bắn Đậu. | 5 |
| `556` | L1 | Nhắm chuẩn. Giữ nguyên hàng C! | 6 |
| `559` | L1 | Miệng hố đất rung lắc. Bấm chọn Sunspot! | 8 |
| `560` | L1 | Bước đè lên hố đất. Bịt lối chui! | 8 |
| `561` | L1 | Gió im lặng. Kết thúc lượt. | 6 |
| `564` | L2 | Miệng hố đã bịt kín. Bấm chọn Sunspot! | 8 |
| `565` | L2 | Thu Hoạch cần ĐỨNG YÊN. Giữ chặt miệng hố! | 9 |
| `566` | L2 | Kích hoạt năng lượng: Bấm vào Sunspot. | 7 |
| `567` | L2 | Tên gầy ngoài rìa. Bấm chọn Shadeleaf! | 7 |
| `568` | L2 | Sẵn sàng đạn: Bắn Đậu. | 5 |
| `569` | L2 | Khai hỏa! | 2 |
| `570` | L2 | Nạp đầy 50 Sun. Kết thúc lượt. | 7 |
| `577` | L3 | Sunspot kẹt lại rồi. Tiếp tục gom nắng! | 8 |
| `578` | L3 | Thu Hoạch năng lượng. | 4 |
| `579` | L3 | Chạm vào Sunspot. | 3 |
| `580` | L3 | Shadeleaf nghiến răng: "Dồn hết đạn cho tôi!" | 8 |
| `581` | L3 | Bắn Chuẩn Xác: 50 Sun, xuyên thủng toàn hàng! | 9 |
| `582` | L3 | Bắn dọc hàng C. Quét sạch cả bốn tên! | 9 |
| `583` | L3 | Màn đêm sụp xuống. Kết thúc lượt. | 7 |
| `595` | L4 | Bị bao vây ba phía. Shadeleaf không lùi! | 8 |
| `596` | L4 | Nạp phát đạn cuối: Bắn Đậu. | 6 |
| `597` | L4 | Bắn ngã thêm một tên! | 5 |
| `598` | L4 | Quân địch quá đông. Sunspot bất lực. Hãy thử! | 9 |

---

## 4. Bàn 3 — Xe Hàng

### Hội thoại trước màn

`data/tutorialDialogues.ts` — 6 câu

| Dòng | Nhân vật | Lời thoại |
|---|---|---|
| `80` | **Old Mulch** | (Rít một hơi thuốc rập rờn khói, nhìn quanh) HÀNG NÓNG ĐÂY! Hè hè... ơ kìa, sao đám nhóc lại thiếu mất một bóng người rồi? |
| `81` | **Sunspot** | (Gục đầu, nghẹn ngào) ...Shadeleaf... cô ấy đã ngã xuống để bảo vệ cháu... |
| `82` | **Old Mulch** | (Thở dài, nét mặt trầm xuống) Nghe chú dặn này nhóc. Cây dự bị không bao giờ thay thế được MỘT LINH HỒN — nhưng nó gánh được VỊ TRÍ. Trận chiến không chờ ai đau thương cả. |
| `83` | **Old Mulch** | Kệ trên là CÂY: thay người ra trận, sống sót thì lui về dưỡng sức. Nhưng chúng non lắm, mỗi đợt hít bụi độc là rụi một nấc máu. Kệ dưới là VẬT PHẨM: nổ một phát là tan thành mây khói. |
| `84` | **Sunspot** | Cháu... cháu tiêu hết chỗ Xu này để mua sạch đồ được không? |
| `85` | **Old Mulch** | ĐỪNG ngốc thế! Chặng đường phía trước còn dài lắm. Có những thứ sinh tử chỉ mua được bằng Xu tích trữ. Nhớ lấy lời lão già này! |

### Thẻ trên bản đồ

| Trường | Nội dung | Vị trí |
|---|---|---|
| Tên màn | Xe Hàng | `data/tutorial.ts:609` |
| Mô tả ngắn | Nỗi đau mất mát Shadeleaf. Mua trang bị lấp khoảng trống. | `data/tutorial.ts:611` |

### Lời hướng dẫn — 4 câu

| Dòng | Lượt | Câu | Từ |
|---|---|---|---|
| `622` | SHOP | Thành hàng trống chỗ. Mua một Xạ Thủ Đậu! | 9 |
| `623` | SHOP | Ghế dự bị còn chỗ. Mua thêm một Xạ Thủ! | 10 |
| `624` | SHOP | Kệ dưới là đồ một lần. Mua Mìn Khoai Tây! | 10 |
| `625` | SHOP | Giữ chặt túi Xu — bạn sẽ cần sau này! | 10 |

---

## 5. Bàn 4 — Hai Căn Nhà

### Hội thoại trước màn

`data/tutorialDialogues.ts` — 8 câu

| Dòng | Nhân vật | Lời thoại |
|---|---|---|
| `89` | **Sunspot** | (Bước đi trên tàn tích, ôm chậu cây dự bị vừa mua, nghẹn ngào) Shadeleaf mất rồi... một mình tôi làm sao tiếp tục hành trình này đây... |
| `90` | **Ironhusk** | (Bước ra từ hốc đá nứt, cắm phập tấm khiên thép xuống đất) Cô không đi một mình đâu, nhóc ạ. |
| `91` | **Sunspot** | (Giật mình ngước nhìn) Anh... anh là Ironhusk! Anh cũng thoát khỏi đợt tấn công ở Quảng trường sao?! |
| `92` | **Ironhusk** | (Gật đầu trầm lắng) Tôi đuổi theo tiếng súng từ Cái Hố, nhưng tiếc là... đến không kịp để cứu cô ấy. Từ giờ, tôi sẽ đi đầu — không một ai được phép ngã xuống nữa! |
| `93` | **Sunspot** | (Lau nước mắt, ánh mắt kiên định hơn) Cảm ơn anh... Nhưng nhìn kìa! Ba tên quái vật đang dồn vào hai căn nhà ở hai hướng... mình không thể cứu cả hai! |
| `94` | **Ironhusk** | Đúng vậy. Chiến trường đòi hỏi sự đánh đổi. Mỗi Căn Nhà mất đi là mất vĩnh viễn. Mất sạch 5 Căn Nhà — toàn bộ chiến dịch sụp đổ! |
| `95` | **Ironhusk** | Tấm khiên của tôi không hạ sát ai được, nhưng đòn ĐẨY lùi có thể chuyển hướng chúng. Hướng đẩy tính từ vị trí TÔI đứng — đứng sai góc là tự tay hất quái vào nhà! |
| `96` | **Sunspot** | Còn quả Mìn Khoai Tây mua từ xe hàng lão Mulch — gài xuống đất, kẻ nào giẫm lên sẽ nổ tung. Phải dành riêng cho con trâu nhất! |

### Thẻ trên bản đồ

| Trường | Nội dung | Vị trí |
|---|---|---|
| Tên màn | Hai Căn Nhà | `data/tutorial.ts:640` |
| Mô tả ngắn | Áp lực dồn nén từ hai ngả. Bạn buộc phải chọn thứ để hy sinh. | `data/tutorial.ts:642` |
| Mục tiêu | Quét sạch lực lượng quái vật. | `data/tutorial.ts:707` |

### Lời hướng dẫn — 42 câu

| Dòng | Lượt | Câu | Từ |
|---|---|---|---|
| `713` | PLACEMENT | Chiến sĩ dự bị lấp chỗ trống. Bắt Đầu Trận! | 10 |
| `716` | L1 | Hai căn nhà nguy ngập. Chia lửa ra! | 8 |
| `717` | L1 | Đội xô 4 máu rất trâu. Bấm Ironhusk! | 8 |
| `718` | L1 | Đứng DƯỚI nó — hướng đẩy tính từ bạn ra. | 10 |
| `719` | L1 | Vung khiên: Đập Khiên! | 4 |
| `720` | L1 | Hất văng nó khỏi hiên nhà! | 6 |
| `721` | L1 | Gài Mìn Khoai Tây chặn bước nó quay lại. | 9 |
| `722` | L1 | Đặt mìn vào đúng ô vừa hất ra. | 8 |
| `723` | L1 | Nhà dưới: Cửa Lưới 10 máu. Xạ Thủ, bắn! | 9 |
| `724` | L1 | Di chuyển xuống hàng F lấy góc bắn! | 8 |
| `725` | L1 | Bắn Đậu! | 2 |
| `726` | L1 | Khai hỏa! Nó mới chỉ trầy da. | 7 |
| `727` | L1 | Sunspot dồn lực cùng! Bấm chọn cô ấy. | 8 |
| `728` | L1 | Tiến sát lại cho đủ tầm thiêu đốt. | 8 |
| `729` | L1 | Thiêu Đốt — dồn sạch 50 Sun! | 7 |
| `730` | L1 | Phun lửa nướng nó! | 4 |
| `731` | L1 | Nó còn 4 máu. Kết thúc lượt! | 7 |
| `734` | L2 | Nó sát cửa rồi, bắn không kịp nữa! | 8 |
| `735` | L2 | Mất não là vĩnh viễn. Mất 5 quả: Thua! | 9 |
| `736` | L2 | Rút quân nhà dưới! Bấm chọn Xạ Thủ. | 8 |
| `737` | L2 | Về hàng D chặn lối zombie khác! | 7 |
| `738` | L2 | Bắn Đậu! | 2 |
| `739` | L2 | Bắn gục con hàng D! | 5 |
| `740` | L2 | Ironhusk lui về trung tâm. Chọn anh ấy! | 8 |
| `741` | L2 | Đứng đây để mai chặn cả hai ngả. | 8 |
| `742` | L2 | Sunspot tích nắng cho đòn quyết định. Chọn cô! | 9 |
| `743` | L2 | Thu Hoạch. | 2 |
| `744` | L2 | Chạm vào Sunspot. | 3 |
| `745` | L2 | Đành hy sinh nhà dưới. Kết thúc lượt. | 8 |
| `751` | L3 | Nhà dưới đổ... nhưng trận đánh chưa hết! | 8 |
| `752` | L3 | Con Đội Nón đến gần. Ironhusk chặn nó! | 8 |
| `753` | L3 | Đập Khiên! | 2 |
| `754` | L3 | Đập khiên hất nó vào làn đạn! | 7 |
| `755` | L3 | Nó dính đúng hàng F rồi. Chọn Xạ Thủ! | 9 |
| `756` | L3 | Bước xuống hàng F! | 4 |
| `757` | L3 | Bắn Đậu! | 2 |
| `758` | L3 | Xả đạn dứt điểm! | 4 |
| `759` | L3 | Zombie trồi từ mồ! Sunspot, đốt ngay! | 7 |
| `760` | L3 | Bước tới cho đủ tầm. | 5 |
| `761` | L3 | Thiêu Đốt! | 2 |
| `762` | L3 | Nướng cháy trước khi nó trồi lên! | 7 |
| `763` | L3 | Xong rồi! Căn nhà trên vẫn an toàn. | 8 |

---

## 6. Bàn 5 — Người Lạ Trên Đường

### Hội thoại trước màn

`data/tutorialDialogues.ts` — 5 câu

| Dòng | Nhân vật | Lời thoại |
|---|---|---|
| `100` | **Chrona** | (Tiếng bánh răng vang lên tích tắc, bóng dáng bí ẩn bước ra từ sương mù) TÍCH... TÍCH... Xin chào những kẻ sống sót. Ta là Chrona — kẻ nắm giữ những mảnh vỡ thời gian. |
| `101` | **Sunspot** | (Kinh ngạc) Thời gian...? Cô có thể đảo ngược quá khứ sao? |
| `102` | **Chrona** | Dòng thời gian này đang tan rữa. Nhưng trong lòng bàn tay ta, linh hồn đã mất của các người vẫn chưa hoàn toàn tan biến. Lại gần đây... |
| `103` | **Sunspot** | Đây là... một sự lựa chọn? Nếu chúng cháu chọn sai thì sao? |
| `104` | **Chrona** | Mỗi sự kiện đều hiện rõ cái giá phải trả và điều nhận lại. Hãy nhìn cho kỹ rồi quyết định. Thời gian không có nút quay lại đâu. |

### Thẻ trên bản đồ

| Trường | Nội dung | Vị trí |
|---|---|---|
| Tên màn | Người Lạ Trên Đường | `data/tutorial.ts:773` |
| Mô tả ngắn | Một bóng hình quen thuộc đứng chờ trong vòng xoay thời gian. | `data/tutorial.ts:775` |

### Lời hướng dẫn — 2 câu

| Dòng | Lượt | Câu | Từ |
|---|---|---|---|
| `781` | EVENT | Vòng xoay thời gian. Bấm chọn Hồi Sinh! | 8 |
| `782` | EVENT | Gọi người xưa trở lại: Chọn Shadeleaf! | 7 |

---

## 7. Bàn 6 — Lửa Trại

### Hội thoại trước màn

`data/tutorialDialogues.ts` — 6 câu

| Dòng | Nhân vật | Lời thoại |
|---|---|---|
| `108` | **Ironhusk** | (Đặt tảng đá lớn chặn gió, đốt lên đống lửa) Tạm nghỉ tại đây. Đống lửa này sẽ giữ ấm và xua đuổi bóng tối. |
| `109` | **Shadeleaf** | (Từ trong bước ra, xoa cổ tay) ...Tôi... tôi đã bỏ lỡ điều gì sao? |
| `110` | **Sunspot** | (Oà khóc chạy đến) SHADELEAF!! Cậu... cậu thực sự đã trở về từ cõi chết! |
| `111` | **Chrona** | Ghi chú kỹ thuật: Các chiến sĩ dự bị chỉ có thể HỢP NHẤT năng lượng tại những điểm nghỉ an toàn như thế này. Không ai có thể ghép tế bào giữa mưa đạn. |
| `112` | **Shadeleaf** | Hợp nhất... nghĩa là linh hồn cây dự bị sẽ hòa làm một với tôi? |
| `113` | **Chrona** | Chính xác. Nhưng ghép cần một cơ thể LÀNH LẶN. Cây bị thương phải ngủ một đêm bên lửa hồng mới đủ sức tiếp nhận sức mạnh mới. |

### Thẻ trên bản đồ

| Trường | Nội dung | Vị trí |
|---|---|---|
| Tên màn | Lửa Trại | `data/tutorial.ts:791` |
| Mô tả ngắn | Nơi trú ẩn bình yên. Nơi duy nhất để ghép nguồn sức mạnh mới. | `data/tutorial.ts:793` |

### Lời hướng dẫn — 4 câu

| Dòng | Lượt | Câu | Từ |
|---|---|---|---|
| `807` | CAMPFIRE | Bên đống lửa hồng. Nơi duy nhất ghép cây! | 9 |
| `813` | CAMPFIRE | Chọn người nhận sức mạnh: Shadeleaf tái sinh! | 8 |
| `814` | CAMPFIRE | Chọn cây dự bị cùng loại để hợp nhất. | 9 |
| `815` | CAMPFIRE | Ghép! Từ giờ đòn bắn thường nổ đôi! | 8 |

---

## 8. Bàn 7 — Kẻ Khổng Lồ

### Hội thoại trước màn

`data/tutorialDialogues.ts` — 6 câu

| Dòng | Nhân vật | Lời thoại |
|---|---|---|
| `117` | **Ironhusk** | (Cắm chặt khiên xuống đất) ...Mặt đất rên siết. Cả ngọn núi đang rung chuyển... Cảm nhận thấy không? |
| `118` | **Gargantuar** | (Tiếng gầm văng vẳng xé rách màng nhĩ) GRAAAAAAAAAAAAHHH! |
| `119` | **Shadeleaf** | (Giơ súng, tay run nhẹ) Hai mươi đơn vị sinh lực... Một quái vật khổng lồ... Chúng ta không thể hạ gục nó! |
| `120` | **Ironhusk** | Tấm khiên của tôi đẩy lùi được muôn loài... nhưng thân hình nó quá đồ sộ. Nó sẽ không lùi dẫu chỉ một bước! |
| `121` | **Chrona** | (Tiếng tích tắc dồn dập) Khi cái chết cận kề, ta sẽ KÍCH HOẠT VÒNG LẶP — tua ngược dòng thời gian về điểm khởi đầu. Thua cuộc không phải kết thúc. Thua cuộc là dữ liệu để sinh tồn! |
| `122` | **Ironhusk** | (Nghiến răng, giơ cao khiên) Vậy thì trước khi thời gian quay ngược... hãy cho gã khổng lồ này biết thế nào là sự kiên cường của chúng ta! |

### Thẻ trên bản đồ

| Trường | Nội dung | Vị trí |
|---|---|---|
| Tên màn | Kẻ Khổng Lồ | `data/tutorial.ts:831` |
| Mô tả ngắn | Trận chiến không thể chiến thắng. Hãy chiến đấu đến hơi thở cuối cùng. | `data/tutorial.ts:833` |
| Mục tiêu | Tiêu diệt quái vật. (Bạn chắc chắn sẽ thất bại). | `data/tutorial.ts:905` |

### Lời hướng dẫn — 33 câu

| Dòng | Lượt | Câu | Từ |
|---|---|---|---|
| `914` | PLACEMENT | Kẻ hủy diệt xuất hiện. Bắt Đầu Trận! | 8 |
| `916` | L1 | Nó rầm rộ vào hàng D. Chọn Shadeleaf! | 8 |
| `917` | L1 | Bắn Đậu! | 2 |
| `918` | L1 | Xả đạn từ xa. 20 máu — bào dần! | 9 |
| `919` | L1 | Ironhusk làm mồi nhử. Bấm chọn anh ấy! | 8 |
| `920` | L1 | Đi hàng C né làn đạn của Shadeleaf! | 8 |
| `921` | L1 | Sunspot tích nắng dồn đòn chí mạng. | 7 |
| `922` | L1 | Thu Hoạch. | 2 |
| `923` | L1 | Chạm vào Sunspot. | 3 |
| `924` | L1 | Dốc sức lượt đầu. Kết thúc lượt! | 7 |
| `929` | L2 | Nó đã đến sát Ironhusk. Chọn anh ấy! | 8 |
| `930` | L2 | Đập Khiên! | 2 |
| `931` | L2 | Đập mạnh vào sườn nó! | 5 |
| `932` | L2 | Nó quá đồ sộ, không lùi một bước! | 8 |
| `933` | L2 | Hai nhà sắp sụp. Chọn Shadeleaf dồn lực! | 8 |
| `934` | L2 | Bắn Chuẩn Xác! | 3 |
| `935` | L2 | Trút 50 Sun vào ngực nó! | 6 |
| `936` | L2 | Sunspot, tích thêm năng lượng! | 5 |
| `937` | L2 | Thu Hoạch. | 2 |
| `938` | L2 | Thu hoạch lần nữa. | 4 |
| `939` | L2 | Mạn tháo chạy! Kết thúc lượt. | 6 |
| `944` | L3 | Nó vào giữa sân. Dốc cạn sức lực! | 8 |
| `945` | L3 | Ironhusk áp sát bằng hàng C! | 6 |
| `946` | L3 | Đập Khiên! | 2 |
| `947` | L3 | Vung cú đập cuối! | 4 |
| `948` | L3 | Sunspot tung đòn cuối. Chọn cô ấy! | 7 |
| `949` | L3 | Thiêu Đốt — 50 Sun! | 5 |
| `950` | L3 | Nướng cháy nó! | 3 |
| `951` | L3 | Shadeleaf, trút nốt viên đạn cuối! | 6 |
| `952` | L3 | Bắn Đậu! | 2 |
| `953` | L3 | Tất cả đã dốc hết. Nó vẫn đứng! | 8 |
| `954` | L3 | Không thể cứu vãn. Thua là trắng tay! | 8 |
| `959` | L4 | Hết Sun, hết hy vọng. Nhìn nó tàn phá! | 9 |

---

## 9. Hai sự kiện tutorial đi qua

Bàn 5 mở `tut_revive`, bàn 6 mở `rest_site`. Cả hai viết bằng tiếng Anh trong `data/events.ts`
rồi dịch qua `i18n/vi.ts` — khác hẳn phần còn lại của tutorial.

| Trường | Tiếng Anh (khoá) | Tiếng Việt | vi.ts |
|---|---|---|---|
| title | The Roadside Medic | Người Cứu Thương Bên Đường | `886` |
| description | A figure waves you down from the verge, a crate of pots at her feet. "I heard you lost somebody. I can fix that — for a price." | Một vóc dáng phủ áo choàng vẫy tay từ lùm cây khô khốc, dưới chân là chiếc thùng gỗ chứa đầy mầm sống. "Ta nghe nói các người vừa mất đi một tri kỷ. Ta có thể kéo kẻ đó trở về... tất nhiên là phải có giá." | `887` |
| label | Revive a Hero | Hồi Sinh Hero | `757` |
| description | Bring one fallen hero back for the next level. Their fusions come back with them. | Đưa một chiến sĩ đã gục trở lại chiến trường. Năng lượng hợp nhất quay về cùng họ. | `784` |
| label | Walk On | Đi Tiếp | `888` |
| description | You keep the Coin. The gap in the squad stays where it is. | Giữ lại từng đồng Xu. Khoảng trống trong đội hình vẫn để ngỏ như một vết sẹo. | `889` |
| title | Campfire | Lửa Trại | `447` |
| description | A safe hollow, a bank of coals, and a few hours before the next push. | Một hốc đất lún kín gió, đống than hồng bập bùng cháy, trao cho cả đội vài giờ bình yên trước khi giông bão đợt tiến quân tới. | `783` |
| label | Revive a Hero | Hồi Sinh Hero | `757` |
| description | Bring one fallen hero back for the next level. Their fusions come back with them. | Đưa một chiến sĩ đã gục trở lại chiến trường. Năng lượng hợp nhất quay về cùng họ. | `784` |
| label | Sleep It Off | Ngủ Một Giấc | `878` |
| description | Bedrolls out, boots off. Wounds close by morning. | Trải túi ngủ bên đống lửa, cởi giáp. Đến hừng đông, những vết thương sâu liền sẹo. | `879` |
| label | Search the Packs | Lục Ba Lô | `760` |
| description | Turn out every pocket in the camp. | Lộn ngược từng góc túi trong trại để tìm kiếm chút nhu yếu phẩm sót lại. | `787` |

---

## Tổng

| | |
|---|---|
| Khung truyện mở đầu | 8 |
| Cảnh hội thoại | 8 (45 câu) |
| Bàn chơi | 7 |
| Lời hướng dẫn | 125 câu, dài nhất 10 từ (trần 15) |
| Chuỗi sự kiện | 14 |

Còn **5 từ** dư địa trước khi chạm trần. 0 câu đang ở mức 14–15 từ (in đậm trong bảng) — sửa những câu đó phải đếm lại.
