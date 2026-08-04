
# 🧠 Brainstorming: Plants into the Breach - Balance & Overhaul

Tài liệu này dùng để phân tích và đề xuất các thay đổi nhằm cân bằng lại game, bám sát nguyên tác PvZ hơn và tăng chiều sâu chiến thuật kiểu Into the Breach.

---

## 1. 💰 Cân bằng Kinh tế (Sun Economy)

**Vấn đề:** Sun quá nhiều, không tạo cảm giác khan hiếm. Cây nào cũng sinh ra Sun dễ dàng.
**Mục tiêu:** Sun là tài nguyên chiến lược, buộc người chơi phải đánh đổi giữa "Phát triển kinh tế" và "Phòng thủ".

### Đề xuất thay đổi:
*   **Giảm Starting Sun:** Giảm từ `350` xuống `150` hoặc `200`. Đủ mua 1-2 unit cơ bản hoặc 1 unit xịn.
*   **Cơ chế Sun Drop:**
    *   Loại bỏ việc tự động hồi Sun mỗi lượt.
    *   Sun chỉ rơi ra khi:
        1.  Hạ gục Zombie (Reward active).
        2.  Dùng kỹ năng của cây chuyên dụng (Sunflower).
        3.  Nhặt trên bản đồ (như Time Pod trong ItB).
*   **Rework Sunflower (Bám sát nguyên tác):**
    *   *Hiện tại:* Vừa đánh vừa hồi sun (OP).
    *   *Thay đổi:* Sunflower **KHÔNG tấn công**. Kỹ năng duy nhất là `Produce Sun` (Tốn 1 lượt hành động).
    *   *Hệ quả:* Người chơi phải bảo vệ Sunflower, tạo ra yếu tố "Escort mission" tự nhiên.
*   **Giá tiền (Cost):**
    *   Cây Tier 1 (Peashooter): `50-75 Sun`.
    *   Cây Tier 2 (Repeater, Chomper): `125-150 Sun`.
    *   Cây Tier 3 (Melon-pult): `200+ Sun`.

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
    *   **Conehead/Buckethead:** Chỉ là Basic + Giáp. Cơ chế giáp: Giảm 1 sát thương mỗi lần nhận đòn (Armor) thay vì chỉ cộng HP thuần.
    *   **Utility Zoms:**
        *   *Newspaper:* Tốc độ x2 khi mất giáp (Enraged).
        *   *Digger:* Bỏ qua tiền tuyến, đào ra sau lưng Plant (Nguy hiểm cho Sunflower).
        *   *Dancing/Disco:* Spawn thêm 4 Backup Dancer xung quanh mỗi 2 lượt -> Buộc phải dùng AoE.

---

## 3. 🌱 Làm lại Skill Cây trồng (Plant Abilities)

**Vấn đề:** Nhiều cây có skill na ná nhau (Damage + Effect). Wall-nut có skill "Bowling" không đúng nguyên tác lắm (đó là minigame).
**Mục tiêu:** Skill phải thể hiện đúng đặc tính cây.

### Đề xuất Rework cụ thể:

#### A. Nhóm Phòng thủ (Tanks)
*   **Wall-nut:**
    *   *Old:* Bowling (Dash + Push).
    *   *New:* **Harden** (Tự tạo Shield/Armor lớn). **Passive:** Bị Zom cắn thì Zom bị dừng lại (không đi tiếp được dù còn Move).
*   **Tall-nut:** Chặn các đơn vị bay hoặc nhảy (Pole Vaulter không qua được).

#### B. Nhóm Tấn công (Shooters)
*   **Peashooter:** Bắn thẳng. Đơn giản.
*   **Cactus:** Bắn xuyên (Pierce). Ưu tiên dùng khi Zom xếp hàng dọc.
*   **Split Pea (Mới):** Bắn 1 viên trước, 2 viên sau. Chuyên trị Digger Zombie.

#### C. Nhóm Kỹ thuật (Tactical)
*   **Chomper:**
    *   *Mechanic:* Instakill 1 Zom bên cạnh -> Sau đó rơi vào trạng thái **Digesting** (Không thể đánh/di chuyển trong 2 lượt).
    *   *Tactical:* Cần cây khác bảo vệ Chomper lúc đang ăn.
*   **Potato Mine:**
    *   *Mechanic:* Đặt xuống -> Turn sau mới nổ (Armed). Nếu Zom đạp lên lúc chưa Armed -> Mất cây.
    *   Damage cực lớn (5-10), AoE nhỏ.
*   **Squash (Mới):**
    *   Tấn công ô bên cạnh/cùng ô. Damage lớn. Tự hủy sau khi đánh (Consumable Unit).

---

## 4. 🧬 Hệ thống Tiến hóa (Evolution Tree)

**Vấn đề:** Hiện tại ít lựa chọn, chủ yếu là tăng chỉ số.
**Mục tiêu:** Tiến hóa thay đổi lối chơi (Class change).

### Cây phả hệ đề xuất:

1.  **Dòng Peashooter:**
    *   Base: `Peashooter`
    *   Evo A: `Repeater` (Dmg x2) -> `Gatling Pea` (Dmg x4, Stationary - Đứng yên).
    *   Evo B: `Snow Pea` (Slow) -> `Winter Melon` (AoE Slow + Dmg - Lai tạo).

2.  **Dòng Catapult (Pult):**
    *   Base: `Cabbage-pult` (Lob, Single target).
    *   Evo A: `Kernel-pult` (Chance to Stun/Butter). -> `Cob Cannon` (Global Range, Massive AoE, cần 2 ô đất).
    *   Evo B: `Melon-pult` (Heavy Dmg, AoE 3x3 hoặc Cross).

3.  **Dòng Sun Producer:**
    *   Base: `Sunflower`.
    *   Evo A: `Twin Sunflower` (Double Sun).
    *   Evo B: `Sun-shroom` (Rẻ hơn, ban đầu ít sun, sau lớn lên nhiều sun).
    *   Evo C: `Gloom-shroom` (Lai tạo với Fume-shroom? - AoE xung quanh).

4.  **Dòng Tank:**
    *   Base: `Wall-nut`.
    *   Evo A: `Tall-nut` (Nhiều máu hơn, chặn nhảy).
    *   Evo B: `Explode-o-nut` (Chết thì nổ).

---

## 5. Kế hoạch hành động (Action Plan)

Bạn muốn tôi bắt đầu sửa phần nào trước?

1.  **Refactor Economy:** Sửa lại `INITIAL_GAME_STATE`, giảm tiền, sửa Sunflower chỉ sinh Sun (bỏ Attack).
2.  **Rework Skills:** Sửa lại Wall-nut (Tank thuần), Chomper (Cơ chế Digesting), Potato Mine (Cơ chế Arming).
3.  **Spawn Logic:** Viết lại `turnManager` để spawn theo Wave định sẵn thay vì random.
