# PLAN — Lọc 81 ý relic (GOD-BUILDS) xuống 27 (bản rà soát để duyệt)

> **Cách dùng file:** giống `PLAN-fusion-unique.md` — mỗi hero một bảng, bạn sửa cột **Kết** hoặc viết
> vào dòng `Góp ý:` dưới mỗi bảng. Chưa có dòng code nào bị đụng.
>
> Nguồn: `GOD-BUILDS.md` (81 ý, viết bởi người KHÔNG có quyền đọc repo) đối chiếu với
> `DESIGN-fusion-matrix.md` (7 luật L1–L7 + §6 mô hình lớp chắn + §9 cân bằng),
> `PLAN-fusion-unique.md` (các ô v2/v3 vừa chốt), và engine thật.

## 0. Thước đo — hợp đồng 3 lớp

Đề xuất, chưa chốt. Mọi phán quyết trong file này chạy trên thước này:

| Lớp | Bán gì | Dấu hiệu |
|---|---|---|
| **MAT** (fusion, 3 slot) | làm **sắc** vai sẵn có; cộng dồn; không đánh đổi | luôn có tác dụng, mua bằng Coin |
| **Relic** (3/hero) | **đổi vai**; luôn có mệnh đề "cấm/xóa X" | 81 ý trong GOD-BUILDS gần như ý nào cũng tự có mệnh đề này |
| **Element** | đổi **chất** damage, không đổi lượng | trả bằng 2 HP |

Ký hiệu cột **Kết**: ⭐ ứng viên đầu bảng · ✅ nhận được · 🟡 cân nhắc / cần quyết định hệ thống ·
🔁 trùng ô MAT vừa chốt · ❌ loại.

## 1. Sáu chỗ người viết ngoài trùng thẳng ô ta vừa chốt

Đây là phần đáng đọc trước. Một người không biết gì về repo mà rơi vào đúng 6 quyết định của
`PLAN-fusion-unique.md` — nghĩa là các cơ chế đó có sức hút tự nhiên, và cũng nghĩa là **ranh giới
MAT/relic đang mờ đúng ở 6 chỗ này**.

| GOD-BUILDS | Ô MAT vừa chốt | Ghi chú |
|---|---|---|
| Reedwing #5 Gió Thuận | [C3.1v2] `CONVOY_AURA` (Sunbloom × Cattail) | họ để trên **Reedwing** — "gió thuận từ cánh quạt" hợp hơn "cục pin" |
| Ironhusk #5 Bức Tường Bất Động | [C8.1v2] `COLLISION_PLATING` (Chardslam) | |
| Ironhusk #6 Phalanx | [C8.v2] `ESCORTED_REDUCTION` (Sunbloom) | |
| Thornshell #3 Thiết Nữ | [C7.3v2] `RETALIATE_ROOT` (Ironhusk) | họ để trên **Thornshell** — "ai đánh tôi thì dính vào tôi" là danh từ của anh |
| Gourdward #4 Khiên Gai Nhọn | [C7.4v2] `SHIELD_RETALIATE` (Gourdward) | trùng **cả hero lẫn cơ chế** |
| Gourdward #8 Lớp Vỏ Nặng Nề | cùng trục `COLLISION_PLATING` | |

**Cần bạn quyết:** hai chỗ (convoy, root) người ngoài đặt đúng hero hơn ta. Đổi hero cho ô MAT, hay
giữ ô MAT và bỏ ý relic tương ứng?

- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

---

## 2. Bảng 81 ý

### 2.1 PEABURST

| # | Relic | Giá engine | Vướng / ghi chú | Kết |
|---|---|---|---|---|
| 1 | Kính Ngắm Canh Gác | Thấp | dựng trên `OVERWATCH_SHOT` đang chạy; §7 ghi "chỉ nổ lượt phe mình" → tự phanh | ⭐ |
| 2 | Lõi Đạn Khổng Lồ | Vừa | rangeType mới; gần `LASER_NEEDLE` / pierce | 🟡 |
| 3 | Nòng Súng Phản Xạ | Cao | đường nảy phải telegraph được, nếu không là RNG cảm nhận | 🟡 |
| 4 | Đạn Laser Xuyên Thấu | Thấp | `PIERCE_ATTACK` có sẵn; 2→1→0 tự tắt | ✅ |
| 5 | Đạn Đóng Băng | Thấp-Vừa | ghi thẳng `moveRange` của thân địch | ✅ |
| 6 | Đạn Tự Bám | — | **xoá đường ngắm thẳng = xoá câu đố hình học của game** | ❌ |
| 7 | Bắn Lén | — | engine **không có hướng mặt** cho unit; phải dựng khái niệm mới | ❌ |
| 8 | Bắn Hoảng Loạn | Vừa | lấp đúng giới hạn §7 (overwatch không nổ trong lượt địch); phải qua RETALIATION RULE | ✅ |
| 9 | Đạn Áp Chế | Thấp | chồng `SKILL_DISARM`/bụi — vốn là ô Cattail của chính cô | 🟡 |

### 2.2 CORNOVA

| # | Relic | Giá engine | Vướng / ghi chú | Kết |
|---|---|---|---|---|
| 1 | Nòng Cưa Cụt | Vừa | role flip pháo→shotgun; mâu thuẫn `EMPLACED_PLATING` là **có chủ đích** | ⭐ |
| 2 | Bãi Mìn Sống | Thấp | `SPIKE_TILE` có sẵn; chồng nhẹ [C7.1v2] Caltrop Cob nhưng đúng phân lớp (MAT rải nhỏ, relic đổi vai) | ⭐ |
| 3 | Đạn Pháo Sinh Học | Vừa | `HEAL` là `EffectType` có sẵn — nhưng mở hồi máu cho hero là **quyết định hệ thống** | 🟡 |
| 4 | Bom Chùm | — | *"rơi **ngẫu nhiên** vào 4 ô"* — phá thẳng cam kết 0% RNG (MASTER-VISION §4) | ❌ |
| 5 | Đạn Choáng | — | stun cả vùng 3x3 = ngoại lệ STUN RULE thứ **4**, và là dạng vùng | ❌ |
| 6 | Bom Napalm | Thấp | FIRE + hazard đã có | ✅ |
| 7 | Màn Khói | Vừa | "né 100%" là khái niệm mới; bụi hiện tại là **cấm vung đòn**, không phải dodge | 🟡 |
| 8 | Phá Boong-ke | **Thấp nhất bảng** | cờ `ignoresArmor` đã nằm sẵn trong `calculateDamage`; giải đúng bài §9.4 (giáp mũ khoá mọi đòn 1 damage) | ⭐ |
| 9 | Lựu Đạn Xung Kích | Thấp | `GLOBAL_PUSH` có sẵn; toàn bàn nên phải có giá | ✅ |

### 2.3 REEDWING

| # | Relic | Giá engine | Vướng / ghi chú | Kết |
|---|---|---|---|---|
| 1 | Cánh Quạt Cắt Cỏ | Vừa | role flip ranged→melee AoE, có mệnh đề cấm | ✅ |
| 2 | Máy Bay Rải Thảm | — | vệt lửa **dọc đường bay** mở lại đúng lỗi **L6** đã đóng (Smokeline phủ đường đạn) | ❌ |
| 3 | Súng Ngắm Trên Không | Vừa | giải §9.4 bằng damage theo khoảng cách | ✅ |
| 4 | Ván Trượt Bay | — | cô đã là `movementType: 'FLYING'`; `gameLogic.ts:540` cho qua địa hình sẵn | ❌ |
| 5 | Gió Thuận | — | 🔁 [C3.1v2] `CONVOY_AURA` | 🔁 |
| 6 | Cú Lặn Cảm Tử | Thấp-Vừa | trigger chết, cơ chế đơn giản | ✅ |
| 7 | Nhiễu Sóng Radar | Vừa | `aiLogic` đọc thêm một điều kiện target — đúng **"support thả diều"** trong vision | ⭐ |
| 8 | Động Cơ Vĩnh Cửu | Thấp | `REFRESH_ACTION` là `EffectType` có sẵn; mạnh, phải có giá | ⭐ |
| 9 | Drone Trinh Sát | ? | cần kiểm game hiện telegraph spawn tới đâu trước khi định giá | 🟡 |

### 2.4 SNAPMAW

| # | Relic | Giá engine | Vướng / ghi chú | Kết |
|---|---|---|---|---|
| 1 | Dịch Vị Axit | Thấp-Vừa | đúng luật hàng của anh (mọi ô phải đánh vào cửa sổ tiêu hoá) | ✅ |
| 2 | Hơi Thở Máu | Vừa | teleport toàn bản đồ — cần giá nặng | 🟡 |
| 3 | Dạ Dày Thép | Thấp | snowball trong trận | ✅ |
| 4 | Khát Máu | Thấp | `HEAL` có sẵn — nhưng vẫn là quyết định hệ thống | 🟡 |
| 5 | Ngụy Trang | Cao | tàng hình = khái niệm AI mới toàn diện | 🟡 |
| 6 | Vồ Mồi | Vừa | skill nhảy 3 ô | ✅ |
| 7 | Tiếng Gầm Đe Dọa | Thấp | push đã có | ✅ |
| 8 | Nanh Độc | Thấp | BURN làm mẫu DoT; "vĩnh viễn không hết" rất mạnh với trùm | 🟡 |
| 9 | Xuyên Giáp | Thấp | trùng Cornova #8 — **chọn một hero**, đừng phát hai bản | 🟡 |

### 2.5 IRONHUSK

| # | Relic | Giá engine | Vướng / ghi chú | Kết |
|---|---|---|---|---|
| 1 | Cột Thu Lôi Di Động | Thấp-Vừa | `chainStep` có sẵn — ⚠ CLAUDE.md: **chỉ MỘT bản tia lan, đừng viết bản thứ ba** | ✅ |
| 2 | Xe Lu Bida | Thấp | `PUSH_DISTANCE` đẩy tới cực hạn, deterministic | ⭐ |
| 3 | Vệ Sĩ Thép | Vừa | redirect damage; đúng mastery tank | ✅ |
| 4 | Khiên Gai Nhọn | Vừa | damage khi **bước vào** ô kề — khác retaliate, không đụng L3/L4 | ✅ |
| 5 | Bức Tường Bất Động | — | 🔁 [C8.1v2] `COLLISION_PLATING` | 🔁 |
| 6 | Đội Hình Phalanx | — | 🔁 [C8.v2] `ESCORTED_REDUCTION` | 🔁 |
| 7 | Búa Phá Thành | Vừa | phá `Rock` (99 HP) vĩnh viễn | ✅ |
| 8 | Sóng Xung Kích | — | stun vùng cuối cú Charge = ngoại lệ STUN RULE thứ 4/5 | ❌ |
| 9 | Tiếng Rống Khiêu Khích | — | **LỖI SỰ THẬT: Ironhusk không có Provoke.** Kit anh là `Plate Slam` + `Rolling Charge`; Provoke là `th_provoke` của Thornshell | ❌ |

### 2.6 THORNSHELL

| # | Relic | Giá engine | Vướng / ghi chú | Kết |
|---|---|---|---|---|
| 1 | Rễ Hút Máu | Vừa | role flip tank→drain; hút máu = `HEAL` hệ thống | 🟡 |
| 2 | Gai Phân Hạch | Vừa | tích damage phản đã gánh rồi nổ — đúng identity anh, và là bộ đếm đọc được | ⭐ |
| 3 | Thiết Nữ | — | 🔁 [C7.3v2] `RETALIATE_ROOT` — **họ đặt đúng hero hơn ta** | 🔁 |
| 4 | Vỏ Cây Tái Sinh | Thấp | `HEAL` hệ thống | 🟡 |
| 5 | Bào Tử Độc | Thấp | mây/hazard có sẵn | ✅ |
| 6 | Vòng Tay Gai | Vừa | root có **tự trả giá** (khoá cả hai) — biến thể đẹp hơn root thuần | ✅ |
| 7 | Linh Hồn Phục Hận | — | **L3**: cột phản 1, anh ngoại lệ 2→3. ×2 thành 6 — phá trần thành văn | ❌ |
| 8 | Khiên Gương | Vừa | đúng **mẫu "relic gỡ cap"** §9.3 đã viết sẵn: bán lại hành vi **L4** đã cắt (phản đòn tầm xa), có giá | ⭐ |
| 9 | Cơn Giãy Chết | Thấp | nổ 8 hướng khi chết | ✅ |

### 2.7 SUNBLOOM

| # | Relic | Giá engine | Vướng / ghi chú | Kết |
|---|---|---|---|---|
| 1 | Lõi Kamikaze | Vừa | Sol làm đạn — hợp kinh tế của cô | ✅ |
| 2 | Thấu Kính Hội Tụ | Vừa | **đúng nguyên văn vision** (support → dmg dealer khi tích đủ Sol). §9.5 cấm cộng damage cho hero 0-damage **ở lớp MAT**; relic đổi vai là ngoại lệ được thiết kế | ⭐ |
| 3 | Ánh Sáng Phục Sinh | Cao | hồi sinh **trong trận** là cơ chế mới | 🟡 |
| 4 | Quang Hợp | — | trùng nguyên ô Sol Battery của chính cô (`SUN_PER_TURN 50`, Twin Sol Battery) | ❌ |
| 5 | Quá Tải Năng Lượng | Thấp | `REFRESH_ACTION` có sẵn; trả bằng 1 HP của ally — đánh đổi sạch | ⭐ |
| 6 | Bão Mặt Trời | Thấp | chồng bụi / `blinded()` | 🟡 |
| 7 | Sợi Dây Sinh Mệnh | Vừa | chia damage — tank ngược, tính toán được | ✅ |
| 8 | Phản Lực Ánh Sáng | Thấp | teleport trả bằng Sol — cơ động đi qua cửa kinh tế | ✅ |
| 9 | Hào Quang Thuần Khiết | Thấp-Vừa | aura giảm damage địch trong bán kính | ✅ |

### 2.8 GOURDWARD

| # | Relic | Giá engine | Vướng / ghi chú | Kết |
|---|---|---|---|---|
| 1 | Vỏ Bí Phát Nổ | Vừa | capstone cho bộ break-punish 3 mảnh đã dựng (Glass Rind + Payback Shell + Sunlit Rind) | ⭐ |
| 2 | Khiên Boomerang | Cao | đường nảy 3 mục tiêu, telegraph khó | 🟡 |
| 3 | Ngục Tù Chật Hẹp | Vừa | biến **hình phạt** của [C6.4v2] (lỡ bọc giáp cho địch) thành **công cụ chủ động** | ⭐ |
| 4 | Khiên Gai Nhọn | — | 🔁 [C7.4v2] `SHIELD_RETALIATE` — trùng cả hero | 🔁 |
| 5 | Khiên Nảy | Thấp-Vừa | chuyền layer sang ally | ✅ |
| 6 | Lô Cốt Di Động | — | 1 thanh khiên chung = **có SỐ**, phá §6.0 ("một lớp chặn trọn một nguồn rồi vỡ; không số, không dồn") | ❌ |
| 7 | Bí Ngô Trị Thương | — | *"khiên **hết hạn** mà chưa vỡ"* — trạng thái đó **không tồn tại**: layer chỉ chặn-rồi-vỡ | ❌ |
| 8 | Lớp Vỏ Nặng Nề | — | 🔁 trục `COLLISION_PLATING` | 🔁 |
| 9 | Khiên Tán Xạ | — | cần địch **bắn xa**: roster chỉ **1/12 zombie thường** có tầm → ô ngủ đông, đúng bẫy vừa loại ở [C8.v3] | ❌ |

### 2.9 CHARDSLAM

| # | Relic | Giá engine | Vướng / ghi chú | Kết |
|---|---|---|---|---|
| 1 | Đai Lưng Đô Vật | Vừa | cầm thân nhỏ đập thân lớn | ✅ |
| 2 | Bậc Thầy Nhu Đạo | Thấp-Vừa | hoán đổi vị trí: displacement thuần, 0 damage, 0 RNG — chất Into the Breach nhất bảng | ⭐ |
| 3 | Dư Chấn Cực Đại | Thấp | damage toàn bàn cho hero 0-damage — chỉ hợp lệ ở lớp relic, và phải là mệnh đề đánh đổi | 🟡 |
| 4 | Móc Neo Tiều Phu | Thấp | `PULL` có sẵn; ăn khớp [C4.1] Recoil Cob vừa chốt | ⭐ |
| 5 | Ném Chuyền Bóng | **Thấp nhất** | trigger "địch bị đội đẩy" **đang chạy sẵn** (cùng cửa với `OVERWATCH_SHOT`) | ⭐ |
| 6 | Lá Chắn Thịt | Vừa | xách thân địch đỡ đòn | ✅ |
| 7 | Cú Ném Trái Đất | Vừa | ⚠ luật trùm: chỉ 3/9 miễn `PUSH`, và `isMassive` **khác** miễn `PUSH` — đọc CLAUDE.md trước khi code | 🟡 |
| 8 | Đệm Lò Xo | Vừa | ally nhảy qua chướng ngại | ✅ |
| 9 | Hố Đen Bất Tận | Thấp-Vừa | `GLOBAL_PUSH` + `PULL` có sẵn | ✅ |

- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**

---

## 3. Tổng kết số

| | Số ý |
|---|---|
| ⭐ ứng viên đầu bảng | **16** |
| ✅ nhận được | 27 |
| 🟡 cân nhắc / chờ quyết định hệ thống | 22 |
| 🔁 trùng ô MAT vừa chốt | 6 |
| ❌ loại | 10 |

16 ⭐ + chọn thêm 11 từ nhóm ✅ là ra đúng **27** (3 relic × 9 hero). Nhưng đừng chốt bằng phép cộng:
mỗi hero phải đủ **3 vai khác nhau** theo vision, nên việc chọn là chọn theo hero chứ không theo điểm.

### Ba quyết định hệ thống chặn phía trên

Cả ba đều không phải quyết định của một relic — chốt xong mới lọc tiếp được:

1. **Có mở hồi máu cho hero không?** `HEAL` là `EffectType` có sẵn và trùm đang dùng, nên engine
   không chặn. 5 ý phụ thuộc câu này (Cornova #3, Snapmaw #4, Thornshell #1, #4, Sunbloom #3).
2. **Ranh giới MAT / relic ở 6 chỗ trùng** (mục 1) — và trong đó 2 chỗ người ngoài đặt đúng hero hơn.
3. **STUN RULE có nới lên 4–5 ngoại lệ không?** Nếu KHÔNG thì Cornova #5 và Ironhusk #8 chết luôn,
   khỏi cân.

- **Trạng thái:** ⬜ chờ duyệt
- **Góp ý:**
