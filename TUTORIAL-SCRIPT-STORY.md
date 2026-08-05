# Kịch bản Tutorial Kể Chuyện — Plant Heroes: Blightfall

> **Phiên bản Đề xuất (Narrative & Dialogue-Driven Script)**
> 
> Bản thảo kịch bản tutorial được chuyển đổi toàn bộ sang **ngôn ngữ kể chuyện**, đậm chất điện ảnh và giàu thoại nhân vật.
> Giữ nguyên 100% khung cấu trúc logic, vị trí file mã nguồn (`file:dòng`), các ràng buộc kỹ thuật (như trần 15 từ cho `note` trong trận), và nhịp điệu 7 màn chơi mở đầu.

---

## Bối cảnh & Không khí Nghệ thuật

* **Shadeleaf**: Trầm tĩnh, quyết đoán, người gánh vác tuyến đầu nhưng mang nỗi đau của kẻ sống sót.
* **Sunspot**: Nhạy cảm, chan chứa hy vọng, từ một mầm sống yếu ớt dần trở thành trái tim năng lượng của đội.
* **Ironhusk**: Lạnh lùng, kiên cường như vách đá, từng trải, lấy bản thân làm lá chắn bảo vệ đồng đội.
* **Old Mulch**: Lão già gian thương lăn lộn sương gió, ăn nói tưng tưng nhưng từng trải và ngầm quan tâm hậu bối.
* **Chrona**: Cỗ máy thời gian huyền bí, giọng nói lạnh như kim khí xen lẫn tiếng tích tắc gõ nhịp số phận.
* **Người dẫn truyện (Narrator)**: Cung cấp những nét vẽ bối cảnh điện ảnh, khắc họa bầu không khí nghẹt thở của thành phố hậu tận thế.

---

## 0. Truyện mở đầu — Đêm Neon Sụp Đổ (8 Khung Comic)

`components/IntroComic.tsx` (Khoá gốc tiếng Anh) ↔ `i18n/vi.ts` (Sửa bản tiếng Việt tại các dòng từ 919 - 926)

| # | Khung hình | Tiếng Việt Truyền Thoại (Sửa ở `vi.ts`) | Dòng `vi.ts` |
|---|---|---|---|
| 1 | Quảng trường Neon rực rỡ dưới ánh hoàng hôn | Quảng trường Neon. Một chiều thu êm đềm như chưa từng có giông bão. | `919` |
| 2 | Các màn hình quảng cáo đồng loạt chuyển đỏ, phát tín hiệu thảm họa | Cho đến khi mọi màn hình thành phố cùng thét lên một tiếng gầm đỏ máu. | `920` |
| 3 | Mặt đất nứt nẻ, những bóng đen trồi lên từ lòng đất | Chúng không giội xuống từ bầu trời. Chúng trồi lên từ ruột đất tối đen. | `921` |
| 4 | Cánh cổng sắt kiên cố bị hất tung | Cánh cổng đại lộ đứng vững được vỏn vẹn bốn nhịp tim. | `922` |
| 5 | Ba bóng người tàn tơi đứng giữa đống đổ nát | Ba kẻ sống sót giữa tro tàn. Không một ai trong họ là chiến binh. | `923` |
| 6 | Thùng trang bị quân sự bọc thép nằm trần trụi giữa đường | Nhưng ai đó đã bỏ lại đống vũ khí này — như thể chờ sẵn ngày tận thế. | `924` |
| 7 | Shadeleaf bước lên, siết chặt khẩu súng đậu | Siết chặt mặt nạ. Nạp viên đạn đầu tiên. Shadeleaf dấn bước vào đêm đen. | `925` |
| 8 | Bầu trời rực cháy, con đường phía trước xa xăm | Thành phố đã sụp đổ. Nhưng ngọn lửa hy vọng thì chưa. | `926` |

---

## 1. Mở Bản Đồ — Điểm Sáng Trong Đêm

Chạy khi bản đồ chiến dịch hiện ra lần đầu tiên.

### Cảnh hội thoại mở màn map

`data/tutorialDialogues.ts` — Dòng 57-61

| Dòng | Nhân vật | Lời thoại Kể chuyện |
|---|---|---|
| `57` | **Shadeleaf** | *(Trỏ tay về phía dải tàn tích)* Nhìn xem... Đây là tất cả những gì còn lại. Những chấm sáng tàn úa nối liền thành con đường độc đạo. Đã bước lên đây, chỉ có tiến, không có lùi. |
| `58` | **Shadeleaf** | Hãy nhìn kỹ từng dấu vết trên bản đồ: **KIẾM THÉP** là nơi máu rơi. **TÚI VÀNG** là trạm tiếp tế của lão già Old Mulch. **MÁI LỀU** là chút bình yên hiếm hoi để dưỡng thương. Còn **DẤU HỎI**... là định mệnh chưa báo trước. |
| `59` | **Shadeleaf** | Và **VƯƠNG MIỆN ĐỎ** rực ở cuối chân trời... chính là ác mộng đã xé nát Quảng trường Neon đêm đó. |
| `60` | **Shadeleaf** | Đêm tháo chạy... tôi đã để lạc mất họ. Nhưng tôi tin, ở đâu đó trong bóng tối này, đồng đội của chúng ta vẫn đang chiến đấu. |
| `61` | **Shadeleaf** | Dấn bước thôi. Tìm lại từng người một, gom góp chút tàn lực cuối cùng để giành lại thế giới này! |

---

## 2. Bàn 1 — Sân Trước (Bản lề khởi đầu)

### Hội thoại trước trận

`data/tutorialDialogues.ts` — Dòng 65-68

| Dòng | Nhân vật | Lời thoại Kể chuyện |
|---|---|---|
| `65` | **Shadeleaf** | *(Phủi lớp tro tàn, giật mình)* Sunspot?! Cậu còn sống sao?! Cố lên, mở mắt ra nhìn tôi này! |
| `66` | **Sunspot** | *(Mở mắt tiều tụy, thốt lên)* ...Shadeleaf...? Là cậu thật sao... Đầu óc tôi quay cuồng quá... không còn chút sức lực nào để đứng dậy... |
| `67` | **Shadeleaf** | *(Nắm chặt tay Sunspot, giơ súng che chắn)* Nằm yên đó! Đã có tôi ở đây. Không kẻ nào được chạm vào cậu! |
| `68` | **Zombie** | *(Tiếng gầm rú khàn đục trồi lên từ màn sương)* Naõooo... thịt tươi... |
| `69` | **Shadeleaf** | Chúng ngửi thấy mùi sống rồi. Chỉ cần trụ vững ba lượt đấu — tôi sẽ dọn sạch lũ quái vật này! |

### Thẻ thông tin trên bản đồ

| Trường | Nội dung Kể chuyện | Vị trí file |
|---|---|---|
| Tên màn | Sân Trước | `data/tutorial.ts:347` |
| Mô tả ngắn | Sunspot kiệt sức giữa vòng vây. Hãy lấy thân mình che chở cho cô ấy. | `data/tutorial.ts:349` |
| Mục tiêu | Trụ vững qua 3 đợt tấn công sinh tử. | `data/tutorial.ts:393` |

### Lời hướng dẫn trong trận (`note` — Tối đa 15 từ)

| Dòng | Lượt | Lời hướng dẫn kịch tính (≤ 15 từ) | Số từ |
|---|---|---|---|
| `404` | PLACEMENT | Trận địa vây sẵn rồi. Bấm Bắt Đầu Trận! | 8 |
| `405` | L1 | Bóng Shadeleaf đứng đó. Hãy bấm vào cô ấy. | 9 |
| `406` | L1 | Nạp Đậu Bắn Thường. Đòn này hoàn toàn miễn phí! | 9 |
| `407` | L1 | Mũi tên đỏ chỉ trúng target. Bắn nó ngay! | 9 |
| `408` | L1 | Lượt một an toàn. Bấm Kết Thúc Lượt. | 7 |
| `409` | L2 | Kẻ thù mới ở hàng trên. Bấm chọn Shadeleaf. | 8 |
| `410` | L2 | Đạn bắn thẳng hàng. Bước lên hàng của nó! | 8 |
| `411` | L2 | Thấy đường đạn rồi! Chọn Bắn Đậu ngay. | 7 |
| `412` | L2 | Chỉ định mục tiêu: Bấm vào con zombie. | 7 |
| `415` | L2 | Mục tiêu gục ngã! Bấm Kết Thúc Lượt. | 7 |
| `421` | L3 | Đợt cuối: hai tên nữa. Chọn Shadeleaf. | 7 |
| `422` | L3 | Giơ súng: Bắn Đậu. | 4 |
| `423` | L3 | Khóa mục tiêu: Bắn con hàng C! | 6 |
| `427` | L3 | Nhiệm vụ là SỐNG SÓT — không cần diệt sạch! | 8 |
| `428` | L3 | Tên hàng E không chạm nổi nhà. Kết thúc lượt! | 9 |

---

## 3. Bàn 2 — Cái Hố (Bẫy Ngầm & Sự Hy Sinh)

### Hội thoại trước trận

`data/tutorialDialogues.ts` — Dòng 72-75

| Dòng | Nhân vật | Lời thoại Kể chuyện |
|---|---|---|
| `72` | **Sunspot** | *(Gia tăng hào quang, gật đầu)* Năng lượng đã hồi phục rồi! Lần này tôi sẽ không làm gánh nặng nữa! |
| `73` | **Shadeleaf** | Ghi nhớ này: Zombie không lang thang vô định. Chúng lao thẳng theo mùi hương của các CĂN NHÀ. |
| `74` | **Sunspot** | *(Chỉ xuống đất)* Nhìn kìa... mấy cái hố đen ngòm nứt nẻ kia là sao? |
| `75` | **Shadeleaf** | Nơi lòng đất thối rữa đẻ ra quái vật. Đứng đè lên miệng hố là khóa chặt đường sống của chúng. Đi thôi! |

### Thẻ thông tin trên bản đồ

| Trường | Nội dung Kể chuyện | Vị trí file |
|---|---|---|
| Tên màn | Cái Hố | `data/tutorial.ts:438` |
| Mô tả ngắn | Lũ quái tinh nhuệ tràn lên từ lòng đất. Bảo vệ mạch sống bằng mọi giá. | `data/tutorial.ts:444` |
| Mục tiêu | Sống sót qua 4 đợt cuồng phong. | `data/tutorial.ts:537` |

### Lời hướng dẫn trong trận (`note` — Tối đa 15 từ)

| Dòng | Lượt | Lời hướng dẫn kịch tính (≤ 15 từ) | Số từ |
|---|---|---|---|
| `550` | PLACEMENT | Vị trí đã cố định. Bấm Bắt Đầu Trận! | 8 |
| `554` | L1 | Zombie xông vào hàng bạn. Bấm chọn Shadeleaf! | 7 |
| `555` | L1 | Chuẩn bị đạn: Bắn Đậu. | 4 |
| `556` | L1 | Nhắm chuẩn. Giữ nguyên hàng C! | 5 |
| `559` | L1 | Miệng hố đất rung lắc. Bấm chọn Sunspot! | 7 |
| `560` | L1 | Bước đè lên hố đất. Bịt lối chui! | 7 |
| `561` | L1 | Gió im lặng. Kết thúc lượt. | 5 |
| `564` | L2 | Miệng hố đã bịt kín. Bấm chọn Sunspot! | 7 |
| `565` | L2 | Thu Hoạch cần ĐỨNG YÊN. Giữ chặt miệng hố! | 8 |
| `566` | L2 | Kích hoạt năng lượng: Bấm vào Sunspot. | 6 |
| `567` | L2 | Tên gầy ngoài rìa. Bấm chọn Shadeleaf! | 6 |
| `568` | L2 | Sẵn sàng đạn: Bắn Đậu. | 4 |
| `569` | L2 | Khai hỏa! | 2 |
| `570` | L2 | Nạp đầy 50 Sun. Kết thúc lượt. | 6 |
| `577` | L3 | Sunspot kẹt lại rồi. Tiếp tục gom nắng! | 7 |
| `578` | L3 | Thu Hoạch năng lượng. | 3 |
| `579` | L3 | Chạm vào Sunspot. | 3 |
| `580` | L3 | Shadeleaf nghiến răng: "Dồn hết đạn cho tôi!" | 7 |
| `581` | L3 | Bắn Chuẩn Xác: 50 Sun, xuyên thủng toàn hàng! | 8 |
| `582` | L3 | Bắn dọc hàng C. Quét sạch cả bốn tên! | 8 |
| `583` | L3 | Màn đêm sụp xuống. Kết thúc lượt. | 6 |
| `595` | L4 | Bị bao vây ba phía. Shadeleaf không lùi! | 7 |
| `596` | L4 | Nạp phát đạn cuối: Bắn Đậu. | 5 |
| `597` | L4 | Bắn ngã thêm một tên! | 4 |
| `598` | L4 | Quân địch quá đông. Sunspot bất lực. Hãy thử! | 8 |

---

## 4. Bàn 3 — Xe Hàng (Nỗi Đau & Hậu Phương)

### Hội thoại trước màn

`data/tutorialDialogues.ts` — Dòng 79-84

| Dòng | Nhân vật | Lời thoại Kể chuyện |
|---|---|---|
| `79` | **Old Mulch** | *(Rít một hơi thuốc rập rờn khói, nhìn quanh)* HÀNG NÓNG ĐÂY! Hè hè... ơ kìa, sao đám nhóc lại thiếu mất một bóng người rồi? |
| `80` | **Sunspot** | *(Gục đầu, nghẹn ngào)* ...Shadeleaf... cô ấy đã ngã xuống để bảo vệ cháu... |
| `81` | **Old Mulch** | *(Thở dài, nét mặt trầm xuống)* Nghe chú dặn này nhóc. Cây dự bị không bao giờ thay thế được MỘT LINH HỒN — nhưng nó gánh được VỊ TRÍ. Trận chiến không chờ ai đau thương cả. |
| `82` | **Old Mulch** | Kệ trên là **CÂY**: thay người ra trận, sống sót thì lui về dưỡng sức. Nhưng chúng non lắm, mỗi đợt hít bụi độc là rụi một nấc máu. Kệ dưới là **VẬT PHẨM**: nổ một phát là tan thành mây khói. |
| `83` | **Sunspot** | Cháu... cháu tiêu hết chỗ Xu này để mua sạch đồ được không? |
| `84` | **Old Mulch** | **ĐỪNG ngốc thế!** Chặng đường phía trước còn dài lắm. Có những thứ sinh tử chỉ mua được bằng Xu tích trữ. Nhớ lấy lời lão già này! |

### Thẻ thông tin trên bản đồ

| Trường | Nội dung Kể chuyện | Vị trí file |
|---|---|---|
| Tên màn | Xe Hàng | `data/tutorial.ts:609` |
| Mô tả ngắn | Nỗi đau mất mát Shadeleaf. Mua trang bị lấp khoảng trống. | `data/tutorial.ts:611` |

### Lời hướng dẫn cửa hàng (`note` — Tối đa 15 từ)

| Dòng | Lượt | Lời hướng dẫn kịch tính (≤ 15 từ) | Số từ |
|---|---|---|---|
| `622` | SHOP | Thành hàng trống chỗ. Mua một Xạ Thủ Đậu! | 8 |
| `623` | SHOP | Ghế dự bị còn chỗ. Mua thêm một Xạ Thủ! | 9 |
| `624` | SHOP | Kệ dưới là đồ một lần. Mua Mìn Khoai Tây! | 9 |
| `625` | SHOP | Giữ chặt túi Xu — bạn sẽ cần sau này! | 9 |

---

## 5. Bàn 4 — Hai Căn Nhà (Lựa Chọn Nghiệt Ngã)

### Hội thoại trước màn

`data/tutorialDialogues.ts` — Dòng 88-94

| Dòng | Nhân vật | Lời thoại Kể chuyện |
|---|---|---|
| `87` | **Sunspot** | *(Bước đi trên tàn tích, ôm chậu cây dự bị vừa mua, nghẹn ngào)* Shadeleaf mất rồi... một mình tôi làm sao tiếp tục hành trình này đây... |
| `88` | **Ironhusk** | *(Bước ra từ hốc đá nứt, cắm phập tấm khiên thép xuống đất)* Cô không đi một mình đâu, nhóc ạ. |
| `89` | **Sunspot** | *(Giật mình ngước nhìn)* Anh... anh là Ironhusk! Anh cũng thoát khỏi đợt tấn công ở Quảng trường sao?! |
| `90` | **Ironhusk** | *(Gật đầu trầm lắng)* Tôi đuổi theo tiếng súng từ Cái Hố, nhưng tiếc là... đến không kịp để cứu cô ấy. Từ giờ, tôi sẽ đi đầu — không một ai được phép ngã xuống nữa! |
| `91` | **Sunspot** | *(Lau nước mắt, ánh mắt kiên định hơn)* Cảm ơn anh... Nhưng nhìn kìa! Ba tên quái vật đang dồn vào hai căn nhà ở hai hướng... mình không thể cứu cả hai! |
| `92` | **Ironhusk** | Đúng vậy. Chiến trường đòi hỏi sự đánh đổi. Mỗi Căn Nhà mất đi là mất vĩnh viễn. Mất sạch 5 Căn Nhà — toàn bộ chiến dịch sụp đổ! |
| `93` | **Ironhusk** | Tấm khiên của tôi không hạ sát ai được, nhưng đòn ĐẨY lùi có thể chuyển hướng chúng. Hướng đẩy tính từ vị trí TÔI đứng — đứng sai góc là tự tay hất quái vào nhà! |
| `94` | **Sunspot** | Còn quả **Mìn Khoai Tây** mua từ xe hàng lão Mulch — gài xuống đất, kẻ nào giẫm lên sẽ nổ tung. Phải dành riêng cho con trâu nhất! |

### Thẻ thông tin trên bản đồ

| Trường | Nội dung Kể chuyện | Vị trí file |
|---|---|---|
| Tên màn | Hai Căn Nhà | `data/tutorial.ts:640` |
| Mô tả ngắn | Áp lực dồn nén từ hai ngả. Bạn buộc phải chọn thứ để hy sinh. | `data/tutorial.ts:642` |
| Mục tiêu | Quét sạch lực lượng quái vật. | `data/tutorial.ts:707` |

### Lời hướng dẫn trong trận (`note` — Tối đa 15 từ)

| Dòng | Lượt | Lời hướng dẫn kịch tính (≤ 15 từ) | Số từ |
|---|---|---|---|
| `713` | PLACEMENT | Chiến sĩ dự bị lấp chỗ trống. Bắt Đầu Trận! | 8 |
| `716` | L1 | Hai căn nhà nguy ngập. Chia lửa ra! | 7 |
| `717` | L1 | Đội xô 4 máu rất trâu. Bấm Ironhusk! | 7 |
| `718` | L1 | Đứng DƯỚI nó — hướng đẩy tính từ bạn ra. | 8 |
| `719` | L1 | Vung khiên: Đập Khiên! | 4 |
| `720` | L1 | Hất văng nó khỏi hiên nhà! | 5 |
| `721` | L1 | Gài Mìn Khoai Tây chặn bước nó quay lại. | 8 |
| `722` | L1 | Đặt mìn vào đúng ô vừa hất ra. | 7 |
| `723` | L1 | Nhà dưới: Cửa Lưới 10 máu. Xạ Thủ, bắn! | 8 |
| `724` | L1 | Di chuyển xuống hàng F lấy góc bắn! | 7 |
| `725` | L1 | Bắn Đậu! | 2 |
| `726` | L1 | Khai hỏa! Nó mới chỉ trầy da. | 6 |
| `727` | L1 | Sunspot dồn lực cùng! Bấm chọn cô ấy. | 7 |
| `728` | L1 | Tiến sát lại cho đủ tầm thiêu đốt. | 7 |
| `729` | L1 | Thiêu Đốt — dồn sạch 50 Sun! | 5 |
| `730` | L1 | Phun lửa nướng nó! | 3 |
| `731` | L1 | Nó còn 4 máu. Kết thúc lượt! | 6 |
| `734` | L2 | Nó sát cửa rồi, bắn không kịp nữa! | 7 |
| `735` | L2 | Mất não là vĩnh viễn. Mất 5 quả: Thua! | 8 |
| `736` | L2 | Rút quân nhà dưới! Bấm chọn Xạ Thủ. | 7 |
| `737` | L2 | Về hàng D chặn lối zombie khác! | 6 |
| `738` | L2 | Bắn Đậu! | 2 |
| `739` | L2 | Bắn gục con hàng D! | 4 |
| `740` | L2 | Ironhusk lui về trung tâm. Chọn anh ấy! | 7 |
| `741` | L2 | Đứng đây để mai chặn cả hai ngả. | 7 |
| `742` | L2 | Sunspot tích nắng cho đòn quyết định. Chọn cô! | 8 |
| `743` | L2 | Thu Hoạch. | 2 |
| `744` | L2 | Chạm vào Sunspot. | 3 |
| `745` | L2 | Đành hy sinh nhà dưới. Kết thúc lượt. | 7 |
| `751` | L3 | Nhà dưới đổ... nhưng trận đánh chưa hết! | 7 |
| `752` | L3 | Con Đội Nón đến gần. Ironhusk chặn nó! | 7 |
| `753` | L3 | Đập Khiên! | 2 |
| `754` | L3 | Đập khiên hất nó vào làn đạn! | 6 |
| `755` | L3 | Nó dính đúng hàng F rồi. Chọn Xạ Thủ! | 8 |
| `756` | L3 | Bước xuống hàng F! | 4 |
| `757` | L3 | Bắn Đậu! | 2 |
| `758` | L3 | Xả đạn dứt điểm! | 3 |
| `759` | L3 | Zombie trồi từ mồ! Sunspot, đốt ngay! | 6 |
| `760` | L3 | Bước tới cho đủ tầm. | 4 |
| `761` | L3 | Thiêu Đốt! | 2 |
| `762` | L3 | Nướng cháy trước khi nó trồi lên! | 6 |
| `763` | L3 | Xong rồi! Căn nhà trên vẫn an toàn. | 7 |

---

## 6. Bàn 5 — Người Lạ Trên Đường (Vòng Xoay Định Mệnh)

### Hội thoại trước màn

`data/tutorialDialogues.ts` — Dòng 97-101

| Dòng | Nhân vật | Lời thoại Kể chuyện |
|---|---|---|
| `97` | **Chrona** | *(Tiếng bánh răng vang lên tích tắc, bóng dáng bí ẩn bước ra từ sương mù)* TÍCH... TÍCH... Xin chào những kẻ sống sót. Ta là Chrona — kẻ nắm giữ những mảnh vỡ thời gian. |
| `98` | **Sunspot** | *(Kinh ngạc)* Thời gian...? Cô có thể đảo ngược quá khứ sao? |
| `99` | **Chrona** | Dòng thời gian này đang tan rữa. Nhưng trong lòng bàn tay ta, linh hồn đã mất của các người vẫn chưa hoàn toàn tan biến. Lại gần đây... |
| `100` | **Sunspot** | Đây là... một sự lựa chọn? Nếu chúng cháu chọn sai thì sao? |
| `101` | **Chrona** | Mỗi sự kiện đều hiện rõ cái giá phải trả và điều nhận lại. Hãy nhìn cho kỹ rồi quyết định. Thời gian không có nút quay lại đâu. |

### Thẻ thông tin trên bản đồ

| Trường | Nội dung Kể chuyện | Vị trí file |
|---|---|---|
| Tên màn | Người Lạ Trên Đường | `data/tutorial.ts:773` |
| Mô tả ngắn | Một bóng hình quen thuộc đứng chờ trong vòng xoay thời gian. | `data/tutorial.ts:775` |

### Lời hướng dẫn sự kiện (`note` — Tối đa 15 từ)

| Dòng | Lượt | Lời hướng dẫn kịch tính (≤ 15 từ) | Số từ |
|---|---|---|---|
| `781` | EVENT | Vòng xoay thời gian. Bấm chọn Hồi Sinh! | 7 |
| `782` | EVENT | Gọi người xưa trở lại: Chọn Shadeleaf! | 6 |

---

## 7. Bàn 6 — Lửa Trại (Hợp Nhất Sức Mạnh)

### Hội thoại trước màn

`data/tutorialDialogues.ts` — Dòng 105-110

| Dòng | Nhân vật | Lời thoại Kể chuyện |
|---|---|---|
| `105` | **Ironhusk** | *(Đặt tảng đá lớn chặn gió, đốt lên đống lửa)* Tạm nghỉ tại đây. Đống lửa này sẽ giữ ấm và xua đuổi bóng tối. |
| `106` | **Shadeleaf** | *(Từ trong bước ra, xoa cổ tay)* ...Tôi... tôi đã bỏ lỡ điều gì sao? |
| `107` | **Sunspot** | *(Oà khóc chạy đến)* SHADELEAF!! Cậu... cậu thực sự đã trở về từ cõi chết! |
| `108` | **Chrona** | Ghi chú kỹ thuật: Các chiến sĩ dự bị chỉ có thể HỢP NHẤT năng lượng tại những điểm nghỉ an toàn như thế này. Không ai có thể ghép tế bào giữa mưa đạn. |
| `109` | **Shadeleaf** | Hợp nhất... nghĩa là linh hồn cây dự bị sẽ hòa làm một với tôi? |
| `110` | **Chrona** | Chính xác. Nhưng ghép cần một cơ thể LÀNH LẶN. Cây bị thương phải ngủ một đêm bên lửa hồng mới đủ sức tiếp nhận sức mạnh mới. |

### Thẻ thông tin trên bản đồ

| Trường | Nội dung Kể chuyện | Vị trí file |
|---|---|---|
| Tên màn | Lửa Trại | `data/tutorial.ts:791` |
| Mô tả ngắn | Nơi trú ẩn bình yên. Nơi duy nhất để ghép nguồn sức mạnh mới. | `data/tutorial.ts:793` |

### Lời hướng dẫn lửa trại (`note` — Tối đa 15 từ)

| Dòng | Lượt | Lời hướng dẫn kịch tính (≤ 15 từ) | Số từ |
|---|---|---|---|
| `807` | CAMPFIRE | Bên đống lửa hồng. Nơi duy nhất ghép cây! | 8 |
| `813` | CAMPFIRE | Chọn người nhận sức mạnh: Shadeleaf tái sinh! | 7 |
| `814` | CAMPFIRE | Chọn cây dự bị cùng loại để hợp nhất. | 8 |
| `815` | CAMPFIRE | Ghép! Từ giờ đòn bắn thường nổ đôi! | 7 |

---

## 8. Bàn 7 — Kẻ Khổng Lồ (Vũ Điệu Tuyệt Vọng & Vòng Lặp)

### Hội thoại trước màn

`data/tutorialDialogues.ts` — Dòng 114-121

| Dòng | Nhân vật | Lời thoại Kể chuyện |
|---|---|---|
| `114` | **Ironhusk** | *(Cắm chặt khiên xuống đất)* ...Mặt đất rên siết. Cả ngọn núi đang rung chuyển... Cảm nhận thấy không? |
| `115` | **Gargantuar** | *(Tiếng gầm văng vẳng xé rách màng nhĩ)* GRAAAAAAAAAAAAHHH! |
| `116` | **Shadeleaf** | *(Giơ súng, tay run nhẹ)* Hai mươi đơn vị sinh lực... Một quái vật khổng lồ... Chúng ta không thể hạ gục nó! |
| `119` | **Ironhusk** | Tấm khiên của tôi đẩy lùi được muôn loài... nhưng thân hình nó quá đồ sộ. Nó sẽ không lùi dẫu chỉ một bước! |
| `120` | **Chrona** | *(Tiếng tích tắc dồn dập)* Khi cái chết cận kề, ta sẽ KÍCH HOẠT VÒNG LẶP — tua ngược dòng thời gian về điểm khởi đầu. Thua cuộc không phải kết thúc. Thua cuộc là dữ liệu để sinh tồn! |
| `121` | **Ironhusk** | *(Nghiến răng, giơ cao khiên)* Vậy thì trước khi thời gian quay ngược... hãy cho gã khổng lồ này biết thế nào là sự kiên cường của chúng ta! |

### Thẻ thông tin trên bản đồ

| Trường | Nội dung Kể chuyện | Vị trí file |
|---|---|---|
| Tên màn | Kẻ Khổng Lồ | `data/tutorial.ts:831` |
| Mô tả ngắn | Trận chiến không thể chiến thắng. Hãy chiến đấu đến hơi thở cuối cùng. | `data/tutorial.ts:833` |
| Mục tiêu | Tiêu diệt quái vật. (Bạn chắc chắn sẽ thất bại). | `data/tutorial.ts:905` |

### Lời hướng dẫn trong trận (`note` — Tối đa 15 từ)

| Dòng | Lượt | Lời hướng dẫn kịch tính (≤ 15 từ) | Số từ |
|---|---|---|---|
| `914` | PLACEMENT | Kẻ hủy diệt xuất hiện. Bắt Đầu Trận! | 7 |
| `916` | L1 | Nó rầm rộ vào hàng D. Chọn Shadeleaf! | 7 |
| `917` | L1 | Bắn Đậu! | 2 |
| `918` | L1 | Xả đạn từ xa. 20 máu — bào dần! | 7 |
| `919` | L1 | Ironhusk làm mồi nhử. Bấm chọn anh ấy! | 7 |
| `920` | L1 | Đi hàng C né làn đạn của Shadeleaf! | 7 |
| `921` | L1 | Sunspot tích nắng dồn đòn chí mạng. | 6 |
| `922` | L1 | Thu Hoạch. | 2 |
| `923` | L1 | Chạm vào Sunspot. | 3 |
| `924` | L1 | Dốc sức lượt đầu. Kết thúc lượt! | 6 |
| `929` | L2 | Nó đã đến sát Ironhusk. Chọn anh ấy! | 7 |
| `930` | L2 | Đập Khiên! | 2 |
| `931` | L2 | Đập mạnh vào sườn nó! | 4 |
| `932` | L2 | Nó quá đồ sộ, không lùi một bước! | 7 |
| `933` | L2 | Hai nhà sắp sụp. Chọn Shadeleaf dồn lực! | 7 |
| `934` | L2 | Bắn Chuẩn Xác! | 3 |
| `935` | L2 | Trút 50 Sun vào ngực nó! | 5 |
| `936` | L2 | Sunspot, tích thêm năng lượng! | 4 |
| `937` | L2 | Thu Hoạch. | 2 |
| `938` | L2 | Thu hoạch lần nữa. | 3 |
| `939` | L2 | Mạn tháo chạy! Kết thúc lượt. | 5 |
| `944` | L3 | Nó vào giữa sân. Dốc cạn sức lực! | 7 |
| `945` | L3 | Ironhusk áp sát bằng hàng C! | 5 |
| `946` | L3 | Đập Khiên! | 2 |
| `947` | L3 | Vung cú đập cuối! | 4 |
| `948` | L3 | Sunspot tung đòn cuối. Chọn cô ấy! | 6 |
| `949` | L3 | Thiêu Đốt — 50 Sun! | 4 |
| `950` | L3 | Nướng cháy nó! | 3 |
| `951` | L3 | Shadeleaf, trút nốt viên đạn cuối! | 5 |
| `952` | L3 | Bắn Đậu! | 2 |
| `953` | L3 | Tất cả đã dốc hết. Nó vẫn đứng! | 7 |
| `954` | L3 | Không thể cứu vãn. Thua là trắng tay! | 7 |
| `959` | L4 | Hết Sun, hết hy vọng. Nhìn nó tàn phá! | 8 |

---

## 9. Sự Kiện Hậu Phương — Truyền Thoại Sự Kiện

Viết lại bản dịch hiển thị tại `i18n/vi.ts` (Giữ nguyên Key tiếng Anh gốc trong `data/events.ts`).

| Trường | Tiếng Việt Truyền Thoại (Cập nhật `vi.ts`) | Dòng `vi.ts` |
|---|---|---|
| **Sự kiện 1** | **Người Cứu Thương Bên Đường** | `886` |
| *Mô tả* | Một vóc dáng phủ áo choàng vẫy tay từ lùm cây khô khốc, dưới chân là chiếc thùng gỗ chứa đầy mầm sống. "Ta nghe nói các người vừa mất đi một tri kỷ. Ta có thể kéo kẻ đó trở về... tất nhiên là phải có giá." | `887` |
| *Lựa chọn 1* | Hồi Sinh Hero (Đưa một chiến sĩ đã gục trở lại chiến trường. Năng lượng hợp nhất quay về cùng họ.) | `757` / `784` |
| *Lựa chọn 2* | Đi Tiếp (Giữ lại từng đồng Xu. Khoảng trống trong đội hình vẫn để ngỏ như một vết sẹo.) | `888` / `889` |
| **Sự kiện 2** | **Lửa Trại** | `447` |
| *Mô tả* | Một hốc đất lún kín gió, đống than hồng bập bùng cháy, trao cho cả đội vài giờ bình yên trước khi giông bão đợt tiến quân tới. | `783` |
| *Lựa chọn 1* | Hồi Sinh Hero (Hà hơi ấm tái sinh cho đồng đội đã ngã xuống.) | `757` / `784` |
| *Lựa chọn 2* | Ngủ Một Giấc (Trải túi ngủ bên đống lửa, cởi giáp. Đến hừng đông, những vết thương sâu liền sẹo.) | `878` / `879` |
| *Lựa chọn 3* | Lục Ba Lô (Lộn ngược từng góc túi trong trại để tìm kiếm chút nhu yếu phẩm sót lại.) | `760` / `787` |

---

## Bảng Tổng Kết So Sánh Quy Mô

| Hạng mục | Bản Gốc (`TUTORIAL-SCRIPT.md`) | Bản Kể Chuyện (`TUTORIAL-SCRIPT-STORY.md`) |
|---|---|---|
| Khung Truyện Comic | 8 Khung (Dịch thô) | 8 Khung (Điện ảnh & Truyền cảm hứng) |
| Cảnh Hội Thoại Mở Màn | 8 Cảnh (42 câu ngắn) | 8 Cảnh (Giàu tính cá tính nhân vật & kịch tính) |
| Bàn Chơi | 7 Màn | 7 Màn (Giữ nguyên cấu trúc gameplay) |
| Lời Hướng Dẫn (`note`) | 125 câu (Max 14 từ) | 125 câu (Hóa thân Narrator, Max 9 từ - Tuyệt đối an toàn trước trần 15 từ) |
| Chuỗi Sự Kiện | 14 Chuỗi | 14 Chuỗi (Văn phong giả tưởng hậu tận thế) |
