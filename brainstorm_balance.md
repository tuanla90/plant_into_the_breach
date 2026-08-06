
# 🧠 Brainstorming: Blightfall: The Last Garden - Balance & Overhaul

Tài liệu này dùng để phân tích và đề xuất các thay đổi nhằm cân bằng lại game, bám sát nguyên tác PvZ hơn và tăng chiều sâu chiến thuật kiểu Into the Breach.

---

## 1. 💰 Cân bằng Kinh tế (Sol Economy)

**Vấn đề:** Sol quá nhiều, không tạo cảm giác khan hiếm. Cây nào cũng sinh ra Sol dễ dàng.
**Mục tiêu:** Sol là tài nguyên chiến lược, buộc người chơi phải đánh đổi giữa "Phát triển kinh tế" và "Phòng thủ".

### Đề xuất thay đổi:
*   **Giảm Starting Sol:** Giảm từ `350` xuống `150` hoặc `200`. Đủ mua 1-2 unit cơ bản hoặc 1 unit xịn.
*   **Cơ chế Sol Drop:**
    *   Loại bỏ việc tự động hồi Sol mỗi lượt.
    *   Sol chỉ rơi ra khi:
        1.  Hạ gục Zombie (Reward active).
        2.  Dùng kỹ năng của cây chuyên dụng (Sol Battery).
        3.  Nhặt trên bản đồ (như Time Pod trong ItB).
*   **Rework Sol Battery (Bám sát nguyên tác):**
    *   *Hiện tại:* Vừa đánh vừa hồi sun (OP).
    *   *Thay đổi:* Sol Battery **KHÔNG tấn công**. Kỹ năng duy nhất là `Produce Sol` (Tốn 1 lượt hành động).
    *   *Hệ quả:* Người chơi phải bảo vệ Sol Battery, tạo ra yếu tố "Escort mission" tự nhiên.
*   **Giá tiền (Cost):**
    *   Cây Tier 1 (Seed Gun): `50-75 Sol`.
    *   Cây Tier 2 (Repeater, Steel Jaws): `125-150 Sol`.
    *   Cây Tier 3 (Melon Mortar): `200+ Sol`.

---

## 2. 🧟 Áp lực từ Zombies (Enemy Pressure)

**Vấn đề:** Zombie ra lẻ tẻ, dễ bị tiêu diệt, thiếu sức ép "tràn ngập" của PvZ.
**Mục tiêu:** Zombie phải đông, hoặc "trâu", hoặc có kỹ năng khó chịu buộc người chơi phải Push/Block thay vì chỉ Damage.

### Đề xuất thay đổi:
*   **Spawn Logic (Mô phỏng Vek Spawning):**
    *   Thay vì random mỗi lượt, hãy hiển thị **Spawn Points** (Mộ bia hoặc tay chui từ đất lên) trước 1 lượt. Nếu người chơi đứng lên đó -> Chặn spawn (nhưng mất máu chân/bị trói).
    *   **Wave System:**
        *   Turn 1: 2 Zom.
        *   Turn 2: 3 Zom.
        *   Turn 3: **Horde!** (4-5 Zom cùng lúc).
*   **Zombie Roles (Rõ ràng hơn):**
    *   **Basic:** Máu giấy, đi bộ. Dùng để lấy số lượng.
    *   **Scrapcap/Pothelm:** Chỉ là Basic + Giáp. Cơ chế giáp: Giảm 1 sát thương mỗi lần nhận đòn (Armor) thay vì chỉ cộng HP thuần.
    *   **Utility Zoms:**
        *   *Newspaper:* Tốc độ x2 khi mất giáp (Enraged).
        *   *Digger:* Bỏ qua tiền tuyến, đào ra sau lưng Plant (Nguy hiểm cho Sol Battery).
        *   *Dancing/Disco:* Spawn thêm 4 Backup Dancer xung quanh mỗi 2 lượt -> Buộc phải dùng AoE.

---

## 3. 🌱 Làm lại Skill Cây trồng (Plant Abilities)

**Vấn đề:** Nhiều cây có skill na ná nhau (Damage + Effect). Armor Plate có skill "Bowling" không đúng nguyên tác lắm (đó là minigame).
**Mục tiêu:** Skill phải thể hiện đúng đặc tính cây.

### Đề xuất Rework cụ thể:

#### A. Nhóm Phòng thủ (Tanks)
*   **Armor Plate:**
    *   *Old:* Bowling (Dash + Push).
    *   *New:* **Harden** (Tự tạo Shield/Armor lớn). **Passive:** Bị Zom cắn thì Zom bị dừng lại (không đi tiếp được dù còn Move).
*   **Tower Shield:** Chặn các đơn vị bay hoặc nhảy (Leaper không qua được).

#### B. Nhóm Tấn công (Shooters)
*   **Seed Gun:** Bắn thẳng. Đơn giản.
*   **Cactus:** Bắn xuyên (Pierce). Ưu tiên dùng khi Zom xếp hàng dọc.
*   **Split Pea (Mới):** Bắn 1 viên trước, 2 viên sau. Chuyên trị Miner.

#### C. Nhóm Kỹ thuật (Tactical)
*   **Steel Jaws:**
    *   *Mechanic:* Instakill 1 Zom bên cạnh -> Sau đó rơi vào trạng thái **Digesting** (Không thể đánh/di chuyển trong 2 lượt).
    *   *Tactical:* Cần cây khác bảo vệ Steel Jaws lúc đang ăn.
*   **Seed Mine:**
    *   *Mechanic:* Đặt xuống -> Turn sau mới nổ (Armed). Nếu Zom đạp lên lúc chưa Armed -> Mất cây.
    *   Damage cực lớn (5-10), AoE nhỏ.
*   **Squash (Mới):**
    *   Tấn công ô bên cạnh/cùng ô. Damage lớn. Tự hủy sau khi đánh (Consumable Unit).

---

## 4. 🧬 Hệ thống Tiến hóa (Evolution Tree)

**Vấn đề:** Hiện tại ít lựa chọn, chủ yếu là tăng chỉ số.
**Mục tiêu:** Tiến hóa thay đổi lối chơi (Class change).

### Cây phả hệ đề xuất:

1.  **Dòng Seed Gun:**
    *   Base: `Seed Gun`
    *   Evo A: `Repeater` (Dmg x2) -> `Gatling Pea` (Dmg x4, Stationary - Đứng yên).
    *   Evo B: `Ice Grenade` (Slow) -> `Winter Melon` (AoE Slow + Dmg - Lai tạo).

2.  **Dòng Catapult (Pult):**
    *   Base: `Cabbage Sling` (Lob, Single target).
    *   Evo A: `Corn Mortar` (Chance to Stun/Butter). -> `Cob Howitzer` (Global Range, Massive AoE, cần 2 ô đất).
    *   Evo B: `Melon Mortar` (Heavy Dmg, AoE 3x3 hoặc Cross).

3.  **Dòng Sol Producer:**
    *   Base: `Sol Battery`.
    *   Evo A: `Twin Sol Battery` (Double Sol).
    *   Evo B: `Sol Cap` (Rẻ hơn, ban đầu ít sun, sau lớn lên nhiều sun).
    *   Evo C: `Gloom-shroom` (Lai tạo với Fume-shroom? - AoE xung quanh).

4.  **Dòng Tank:**
    *   Base: `Armor Plate`.
    *   Evo A: `Tower Shield` (Nhiều máu hơn, chặn nhảy).
    *   Evo B: `Explode-o-nut` (Chết thì nổ).

---

## 5. Kế hoạch hành động (Action Plan)

Bạn muốn tôi bắt đầu sửa phần nào trước?

1.  **Refactor Economy:** Sửa lại `INITIAL_GAME_STATE`, giảm tiền, sửa Sol Battery chỉ sinh Sol (bỏ Attack).
2.  **Rework Skills:** Sửa lại Armor Plate (Tank thuần), Steel Jaws (Cơ chế Digesting), Seed Mine (Cơ chế Arming).
3.  **Spawn Logic:** Viết lại `turnManager` để spawn theo Wave định sẵn thay vì random.
