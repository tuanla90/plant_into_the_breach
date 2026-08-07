# TẦM NHÌN DỰ ÁN & ĐỊNH HƯỚNG MỸ THUẬT (MASTER VISION & STRATEGY)
*Dự án: Blightfall - The Last Garden (Biopunk Tactical Roguelite)*

Tài liệu này tổng hợp toàn bộ các quyết định chiến lược về Game Design, Art Direction, và Định hướng Thương mại nhằm biến Blightfall thành một sản phẩm Indie Premium chất lượng cao ($14.99) trên Steam.

---

## 1. BỐI CẢNH & CỐT TRUYỆN (LORE)
**Không dùng Cây Nhân Hóa (Tránh bản quyền PvZ).**
- **Thảm họa**: Thế giới sụp đổ bởi `The Blight` (Bệnh Đốm Tàn) - một loại nấm mốc hoại tử biến con người thành thây ma (Zombie thường, không phải quái khổng lồ).
- **Phe Ta (The Gardeners / Botanical Vanguard)**: Là **CON NGƯỜI (Đặc nhiệm sinh tồn)**. Họ khai thác một khu bảo tồn thực vật đột biến khổng lồ ("The Last Garden") để rèn áo giáp và vũ khí Sinh-Cơ khí (Biopunk). 
- **Tài nguyên (Sol)**: Không phải mặt trời rơi xuống đất. Sol là năng lượng quang hợp quý giá được thu thập thông qua các trạm Lò phản ứng (Sol Battery) đeo trên lưng Support (như Sunbloom) để vận hành vũ khí sinh học.

---

## 2. ĐỊNH HƯỚNG MỸ THUẬT (ART BIBLE)
Sự giao thoa hoàn hảo giữa **X-COM (Sci-fi) + Darkest Dungeon (Grimdark) + Pixel Art Chibi**.

### A. Phong cách Thiết kế (Style)
- **Tỷ lệ**: Chibi / Super Deformed (Tỷ lệ 3 - 3.5 Heads). Giúp hiển thị cực kỳ rõ ràng, dễ đọc trên lưới Grid 8x8.
- **Môi trường (Background)**: Đổ nát, u tối, bóng đen đậm đặc (Heavy Black Inking kiểu Darkest Dungeon).
- **Trang bị Hero**: Áo giáp quân sự tăm tối (Xám, Nâu, Xanh Úa) + Các bộ phận Thực vật khổng lồ làm khiên/giáp (Vỏ bí ngô, lá cây, dây leo) + **Mũ Visor Đặc nhiệm phát sáng rực rỡ** cắt ngang màn đêm.

### B. Bảng Màu Mã Hóa (Color Coding)
Mỗi Hero sở hữu một luồng sáng / màu sắc độc bản để dễ nhận diện:
1. **Peaburst** (Xạ thủ Ranged): Xanh Lục Dạ Quang (Neon Green).
2. **Cornova** (Pháo cối): Vàng Hổ Phách (Amber).
3. **Reedwing** (Không quân): Xanh Lơ / Lục Lam (Cyan / Teal).
4. **Snapmaw** (Cận chiến ăn thịt): Tím Đậm (Deep Purple).
5. **Thornshell** (Tank phản sát thương): Đỏ Máu (Crimson Red).
6. **Ironhusk** (Tank húc đẩy): Nâu Rỉ Sét (Rusty Brown).
7. **Sunbloom** (Hỗ trợ năng lượng): Vàng Tươi (Bright Yellow).
8. **Gourdward** (Hỗ trợ tạo khiên): Cam Rực (Vibrant Orange).
9. **Chardslam** (Hỗ trợ hất ném): Trắng Bạc (Silver / Pale White).

### C. Cơ chế Nguyên Tố & Vật phẩm (Elements & Gadgets)
- **Elemental Matrix**: Khi Hero cầm Nguyên Tố (Đổi 2 Máu), ngoại hình phải thay đổi. Giáp sẽ bốc cháy (Lửa), đóng băng (Băng), hoặc nổ điện (Điện) - thay đổi Sprite để tạo cảm giác thỏa mãn cho người chơi.
- **Relics/Items**: Thiết kế theo dạng "Botanical Engineering". Ví dụ: Lựu đạn Ớt Jalapeño trong ống kính, Radar cỏ 4 lá.

---

## 3. LỘ TRÌNH KỸ THUẬT & SẢN XUẤT (TECH & WORKFLOW)
### A. Engine (Godot vs React)
- Giữ React cho giai đoạn Prototype Logic (Vì Core Engine hiện tại bằng TS đã quá hoàn chỉnh và tách biệt).
- **Mục tiêu thương mại**: Nâng cấp lên **Godot** để làm đồ họa Isometric 2.5D, tích hợp Screen Shake, Particles (Juice), và tối ưu hóa cho nền tảng Console (Nintendo Switch). Mã nguồn TS có thể port sang C# của Godot dễ dàng.

### B. Tối Ưu Chi Phí Art bằng AI (Hybrid Workflow)
- Sử dụng AI (Midjourney/PixelLab/Stable Diffusion) để tạo ra **100% Concept Art, Background tĩnh, Icons, và Cutscene Cốt truyện (Truyện tranh tĩnh)**.
- Sử dụng AI để sinh ra Frame tĩnh (Base Sprite) đẹp nhất cho 9 Hero và Zombie.
- Thuê Animators/Pixel Artists (Junior/Freelancer) chỉ để làm khâu **"Clean up" (Dọn Pixel lỗi)** và **"Animation" (Làm hoạt ảnh 3-4 frames)** dựa trên ảnh gốc của AI. 
- $\rightarrow$ **Giảm 70-80% chi phí**, nhưng vẫn đảm bảo game chạy mượt, nhất quán và không bị coi là "Asset Flip".

---

## 4. CHIẾN LƯỢC THƯƠNG MẠI & BÁN HÀNG
- **Kênh Phân Phối**: Steam (Bắt buộc) & Nintendo Switch. Tuyệt đối không làm Mobile Free-to-play.
- **Mô Hình**: Premium Pay-to-play, dự kiến giá **$14.99**.
- **Lợi Thế Bán Hàng**: 
  1. Hỗ trợ Tiếng Trung Giản Thể (Tệp khách hàng trả tiền cao).
  2. Hình ảnh "Juicy" và gameplay đẩy/kéo mang tính GIF-able cao.
  3. Lối chơi "Giải đố 0% RNG" hoàn hảo không kén người.
- **Kịch Bản Mục Tiêu**: Đạt Kịch Bản 2 (Khá/Thành Công) $\rightarrow$ Yêu cầu bắt buộc là phải làm 1 bản **Demo chất lượng cho Steam Next Fest** và tích lũy được **~10.000 Wishlist** trước khi ra mắt.
