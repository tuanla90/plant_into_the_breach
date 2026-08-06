# PLAN — REEDWING THAY THORNQUILL + LÀM LẠI NHÁNH SUPPORT

> Trạng thái: **ĐÃ TRIỂN KHAI ĐỦ 4 ĐỢT** (2026-08-06). Typecheck xanh, build xanh,
> `roster.assert` + `tutorial.assert` (replay đủ 7 bàn) xanh. Khoản treo `SHIELD_BONUS` đã
> chốt khi code: thay bằng `SHIELD_SPREAD` (lớp lan sang người đứng kề người nhận — ô *Great
> Gourd*). Khác plan một điểm, có ghi lý do tại chỗ: EDGE của Reedwing là `BONUS_DAMAGE` chứ
> không phải `MOVE_BONUS` (đề xuất cũ trùng STRIDE), và cột `MAT_CATTAIL` cấp `SKILL_DISARM`
> theo đúng khung thay vì bảng nháp `DUST_TRAIL` cũ. Còn thiếu duy nhất: ART thật cho
> `sprite-zephyr` / `gear-cattail` / `cattail` (đang chạy placeholder SVG).

## 1 · Việc cần làm

**(a) Thay hero.** Thornquill (xương rồng, RANGED) rời đội. Reedwing — phi công drone thân
Rotor Wing — vào thay. Bảng mở khóa đổi hai ô:

| Stage | Act | Trùm | Thành phố | Hero — CŨ | Hero — MỚI |
|---|---|---|---|---|---|
| II | 1 | The Armada | Windward | Chardslam | **Reedwing** ⟵ mới |
| III | 1 | The Headliner | Neon Rose | Thornquill | **Chardslam** ⟵ dời sang |

**(b) Khung gear hai-món** (mục 4) — mỗi gear là hai đặc điểm của đúng một hero.

**(c) Nhánh SUPPORT làm lại** (mục 6): Sunbloom bỏ skill sát thương lấy skill buff thuần;
Chardslam lấy skill hất-qua-đầu (push + pull); Gourdward thêm nội tại miễn nhiễm khi có giáp.

## 2 · Quyết định đã chốt

1. **Cây gốc: Rotor Wing**, không phải Storm Fan — Storm Fan đã tồn tại làm item (`GUST`,
   `utils/itemResolution.ts`), hero trùng tên là đụng hàng chức năng. Prompt art đã viết theo
   Rotor Wing (magenta, tai mèo, đạn pod).
2. **Reedwing bay thật** — `movementType: 'FLYING'`, đổi lại **máu thấp nhất roster**, và vẫn bị
   đánh bình thường khi có zombie đứng kề, bất kể đang lơ lửng trên ô gì.
3. **Gear: `MAT_CACTUS` → `MAT_CATTAIL`** — pool giữ đúng 10 gear.
4. **Đòn cơ bản của Reedwing: cặp nước-mã 4 hướng** (mục 5.2) — không phải cặp chéo kề.
5. **Kỹ năng phí của Reedwing: bom khói huỷ intent** — tái dùng cơ chế `DUST_VEIL` sẵn có (5.3).
6. **`MAT_CHOMPER` đổi trục sang chảy máu** (`BLEED_ON_HIT`) — hết trùng `RETALIATE_DAMAGE`
   với `MAT_ENDURIAN` (mục 8).
7. **Sunbloom**: Solar Blessing = **+1 Shield (tồn tại xuyên lượt, CÓ CAP) + +1 damage CHỈ
   trong lượt đó** — phải buff trước rồi mới đi nước đánh. Shield phải cap vì nó sống xuyên
   lượt, và vì buff giáp là nghề chính của Gourdward — Sunbloom không được giẫm. (Phương án
   thay nửa giáp: hồi 1 máu đã mất, không tăng max — cân nhắc ở 6.1.)
8. **Chardslam**: **Vault Toss là ĐÒN CƠ BẢN** (miễn phí), **ngã 1 sát thương**; zombie đáp
   đất **dính nguyên tố của anh** — đúng chữ luật L1 sẵn có (*"a Chardslam shove now lands a
   target that is both thrown and slowed"*), không cần cơ chế mới. Kỹ năng phí = đẩy lùi cả
   4 phía — tức **Sweep hiện tại giữ nguyên**. Backswing nghỉ.
9. **Gourdward**: đòn cơ bản = **bọc giáp cho bất cứ thứ gì đứng kề — kể cả NHÀ, cây, lính
   dự bị**; kỹ năng = bọc giáp mọi đồng minh trong hình dấu cộng; passive = **miễn nhiễm
   nguyên tố VÔ ĐIỀU KIỆN** (BURN / FREEZE / SHOCK). *(Con số "2 mỗi người" của bản giáp-số
   được thay bằng "mỗi người một lớp" khi chốt mô hình lớp chắn — quyết định 14.)*
   > **SỬA 2026-08-06 (đợt map lại fusion).** Ward vô điều kiện đã bị thu về **đúng MỘT
   > nguyên tố — nguyên tố anh được áp**. Lý do: miễn cả ba nghĩa là ô nguyên tố của anh
   > không còn gì để mua, nên phải bịa ra `elementSlot: 'NONE'` để giấu một cái quầy bán bẫy;
   > tức là ward tự ăn mất một hệ thống. Nay `elementalImmunities` (`utils/unitFactory`) lo
   > việc đó sẵn cho mọi carrier → ward tốn 0 dòng engine, ô nguyên tố thành lựa chọn thật ở
   > giá chuẩn −2 máu tối đa, và quyết định 11 mất phần ngoặc đơn ("Gourdward vẫn chặn").
   > Đổi lại: một act được bảo vệ thay vì ba. Chi tiết ở `DESIGN-fusion-matrix.md` §6.2.
10. **NHÀ: mô hình "unit 1 máu" là ĐÚNG — và engine đã nghĩ đúng như thế sẵn rồi.** Zombie
    không đi vào nhà; nó đứng KỀ một lượt, telegraph cú cắn (intent `ATTACK` nhắm nhà), lượt
    sau mới cắn — và Ở LẠI sau khi ăn (`turnManager.ts:697-717`, nguyên văn: *"the zombie
    stood beside the Greenspire for a full turn first"*, *"under ITB's rule… still standing
    there"*). Tức là: telegraph ✓ cửa sổ phòng thủ ✓ AI nhắm nhà ✓ — thứ THIẾU duy nhất là
    nhà có máu/giáp. → **Giữ nhà là tile, thêm `TileData.shield`, cắm vào đúng HAI điểm cắn**
    (`turnManager.ts:711` cắn kề · `gameLogic.ts:194` bị đẩy vào nhà). Hành vi ra đúng hệt
    unit-1-máu; "1 máu" là mô hình tư duy, không cần là mô hình dữ liệu — refactor
    nhà-thành-unit thật sẽ đụng ~40 điểm đọc `isHouse` / 12 file và mở hộp friendly-fire
    (cherry bomb nổ cạnh nhà?) mà không thêm hành vi nào.
11. **Sunbloom mang nguyên tố = CỤC PIN NGUYÊN TỐ.** Miễn nhiễm nguyên tố giữ cho bản thân
    (ELEMENT_IMMUNITY như mọi carrier); **Blessing CHO MƯỢN nguyên tố**: đồng minh được ban
    phước, các đòn đánh trong lượt đó mang nguyên tố của cô. Thay hoàn toàn phương án "chặn
    picker nguyên tố" cho cô. (Gourdward vẫn chặn — ward đã miễn cả ba, gắn nguyên tố lên anh
    là trả 2 máu cho thứ đã có.)
12. **`MAT_SNOW_PEA` BỎ HẲN** — 9 gear ↔ 9 hero, ma trận 9×9. Không còn gear mồ côi.
13. **BLEEDING dính cả trùm** — đi NGOÀI cửa miễn nhiễm `STATUS` (vết thương vật lý, không
    phải hiệu ứng điều khiển).
14. **GIÁP = LỚP CHẮN kiểu ItB, toàn hệ thống** (mục 6.0): một lớp chặn TRỌN một nguồn sát
    thương bất kỳ rồi vỡ; không số, không cộng dồn, không cap. Mọi nguồn giáp (Encase,
    Reinforce, Blessing, nhà, `SHIELD_ON_KILL`, `ARMOR_WHILE_DIGESTING`) phát cùng một thứ:
    MỘT lớp.
15. **Lớp vs các kiểu đòn**: **Devour của Snapmaw KHÔNG xé được lớp** — một cú nuốt là MỘT nguồn,
    lớp chặn trọn. **Loạt nhiều viên VƯỢT được** — mỗi viên là một nguồn riêng, viên đầu phá
    lớp, các viên sau vào (Precision Blast `VOLLEY 3` mất viên đầu, vào 2 viên;
    `DOUBLE_ATTACK` mất phát đầu). Ranh giới này KHỚP đúng ranh strikes/blast đã có trong
    engine (`turnManager.ts:720`: *"this intent is N SEPARATE BLOWS, not one blow with a
    footprint"*) — strikes ăn dần lớp, blast bị chặn trọn.
16. **Lớp và dịch chuyển — đúng shield ItB**: lớp chặn SÁT THƯƠNG, **không chặn DỊCH CHUYỂN**.
    Thân có lớp vẫn bị đẩy/kéo/hất; sát thương va chạm/ngã đi kèm bị lớp nuốt (lớp vỡ). Đòn
    bị lớp chặn thì mọi thứ đi kèm đòn đó (status, rider nguyên tố, vết BLEEDING) cũng không
    vào. Vault Toss theo cùng chuẩn ItB: **ô rơi bị chiếm = không cho ngắm**.
    *(Kèm theo: nguyên tố mượn xác nhận hai luật ở 6.1; chi phí re-script tutorial CHẤP NHẬN.)*

## 3 · Khảo sát engine — cái gì có sẵn, cái gì phải viết

### 3.1 Đã sống sẵn (tái dùng, không viết mới)

| Cơ chế | Bằng chứng | Dùng cho |
|---|---|---|
| `FLYING` đầy đủ (địa hình, thân thể, chết đuối) | `gameLogic.ts:422,453,101` | Reedwing |
| Huỷ-intent-vì-bụi: `blinded()` phát `MISS` | `turnManager.ts:669` — comment ghi đúng *"the dust arrived"* | Smoke Pod |
| `TileData.dust` + `environment: 'SMOKE'` (Tile.tsx vẽ được) | `types.ts:216,185` | Smoke Pod |
| Hình dấu cộng chuẩn của một đám bụi | `hazards.ts:234` (DUST_VEIL) | Smoke Pod |
| **`BUFF_STAT` phân giải được** (`stat: 'HP' \| 'DMG'`), và `getValidSkillTargets` **đã nhận nó là skill nhắm đồng minh** | `skillResolution.ts:206`, `gameLogic.ts:710`; bench Cactus có skill *Stretch* dùng nó | Sunbloom buff |
| **`PULL` phân giải được**, `PUSH_DISTANCE` cộng cho cả PULL | `skillResolution.ts:436-456`, `fusion.ts:364` | Chardslam |
| Skill nhắm đồng minh trả phí — tiền lệ nguyên vẹn | Encase của Gourdward (`SHIELD`, LOB 3) | Sunbloom buff |
| Miễn nhiễm bẩm sinh trên hero | Sunbloom `immunities: ['BURN']` (`heroes.ts:121`) | Gourdward ward |
| Từ vựng miễn nhiễm `BURN / FREEZE / SHOCK` | `types.ts:152` | Gourdward ward |
| Sát thương va chạm + `COLLISION_BONUS` | `planPush`, recipe *Grand Chard* | Cú hất của Chardslam |
| Storm Fan item lọc `isEnemy` → không thổi hero bay phe mình | `itemResolution.ts:230` | Reedwing |
| **Ăn mầm ĐÃ là đòn telegraph**: zombie đứng kề 1 lượt, intent `ATTACK` nhắm nhà, cắn ở lượt sau và Ở LẠI | `turnManager.ts:697-717`, `aiLogic.ts:13` | Giáp NHÀ — chỉ cần chặn đúng cú cắn |
| Đường đẩy-vào-nhà lấy mầm (cửa thứ hai của mầm) | `gameLogic.ts:194` | Giáp NHÀ — điểm cắm thứ hai |

### 3.2 Bẫy đã phát hiện

1. **`roster.assert.ts` bắt đúng 3 RANGED / 3 MELEE / 3 SUPPORT, tổng 9.** Reedwing bắt buộc
   `RANGED` (Thornquill cũng vậy).
2. **`RADIUS` là code chết** — có trong `SkillRangeType`, không skill nào dùng, không chỗ nào
   phân giải. Không dùng cho Reedwing (đúng vết xe `DROWN` mà repo tự cảnh báo).
3. **Thornquill là mốc cân bằng được viện dẫn ở 5 comment**: `bossBehaviours.ts:769` (trùm mất
   1 charge/lượt), `skillResolution.ts:526` (arc điện chỉ từ mục tiêu chính),
   `turnManager.ts:152` (gai xuyên giáp), `fusion.ts:334` + `:392`. **Chỉ sửa comment, không
   đổi luật.**
4. **Quỹ đạo đạn RANGED đã kín chỗ** — Peaburst `LINE`+`VOLLEY`, Cornova `LOB` (comment của Cornova
   nói thẳng "mọi đòn khác là LINE"). → Reedwing khác biệt ở **di chuyển + hình học nước mã**,
   không tranh quỹ đạo của ai.
5. **Miễn nhiễm là danh sách tĩnh, đọc rải ở ~33 điểm** (`immunities.includes` — 7 file).
   Ward gắn điều kiện "khi có giáp" sẽ cần helper thay cả 33 điểm — **đã tránh được**: ward
   chốt là vô điều kiện (quyết định 9), tức chỉ là phần tử trong mảng `immunities`, mọi điểm
   đọc tự đúng, không refactor gì.
6. **Chi phí lớn nhất của cả plan: kịch bản tutorial.** Sol Burn được script dùng ở **4 bàn**
   với số học chính xác (xem 6.1). Đổi skill Sunbloom = viết lại các bàn đó + assert của chúng.

### 3.3 Chi phí ma trận fusion

`FUSION_RECIPES` là `Record<HeroId, Record<MaterialId, …>>` đầy đủ — thiếu ô là lỗi biên dịch.
Khối lượng: 10 công thức Reedwing + 8 công thức cột `MAT_CATTAIL` + 4 công thức đổi theo trục
chảy máu (mục 8) + ~4 công thức vỡ theo rework support (6.1, 6.2) ≈ **~26 công thức viết tay.**

## 4 · KHUNG GEAR — mỗi gear là HAI MÓN từ MỘT hero

**Nguyên tắc:** fuse là *mang đặc điểm của một hero sang hero khác*. Mỗi gear có đúng hai món —
**món A** từ *đòn thường* của chủ nhân (chỉ số/thụ động), **món B** từ *kỹ năng* của chủ nhân
(đổi cách kỹ năng người nhận vận hành). Mỗi ô trong ma trận chọn món hợp hơn; ô nào cả hai đều
không hợp thì là ngoại lệ có ghi lý do (cột Cactus cũ cũng 6/9 + 3 ngoại lệ — ngoại lệ là bình
thường).

| Gear | Chủ nhân | Món A — từ đòn thường | Món B — từ kỹ năng |
|---|---|---|---|
| Seed Gun | Peaburst · *Pea Shot / Precision Blast* | bắn thẳng (`GRANT_ATTACK` cho ai không có) | `DOUBLE_ATTACK` |
| Corn | Cornova · *Corn Kernel / Nova Shell* | `ARC_ATTACK` | `SKILL_STUN` *(mới)* — kỹ năng phí được ghép STUN. Hợp lệ với STUN RULE: stun trả phí là "the paid, honest shape" |
| **Rotor Wing** | **Reedwing** · *Wing Guns / Smoke Pod* | `MOVE_BONUS` *(mới)* | `SKILL_DISARM` *(mới)* — kỹ năng phí để lại bụi tước đòn |
| Armor Plate | Ironhusk · *Shield Bash / Rolling Charge* | `BONUS_HP` | `DAMAGE_REDUCTION` |
| Steel Jaws | Snapmaw · *Bite / Devour* | `BONUS_DAMAGE` | `BLEED_ON_HIT` *(mới)* |
| Spike Armor | Thornshell · *Thorn Swipe / Provoke* | `RETALIATE_DAMAGE` | `TAUNT_RADIUS` (chỉ nghĩa với ai có taunt → các ô khác thường rơi về A hoặc ngoại lệ) |
| Sol Battery | Sunbloom · *Harvest / **Solar Blessing*** | `SUN_PER_TURN` · `SUN_ON_KILL` | `SKILL_BLESS` *(mới)* — kỹ năng phí xong còn ban +1 damage (lượt này) cho một đồng minh gần |
| Chard | Chardslam · ***Vault Toss / Sweep*** | `PUSH_DISTANCE` (đã cộng cho cả PULL sẵn; KHÔNG kéo giãn toss — điểm rơi toss là hình học cố định) | `SKILL_DISPLACE` *(mới)* — kỹ năng phí còn dời mục tiêu 1 ô, **đẩy ra hoặc kéo về, chọn lúc ngắm** |
| Bunker Shell | Gourdward · ***Reinforce / Encase*** | tự-giáp: `SHIELD_ON_KILL` (đã có, có cap) | `ELEMENT_WARD` *(mới)* — **miễn BURN + FREEZE + SHOCK**, áp thẳng vào `immunities` lúc fuse (đường ELEMENT_IMMUNITY sẵn có, zero refactor) |
| Ice Grenade | ⚠️ **KHÔNG CHỦ** (mục 9) | `ON_HIT_SLOW` | `ON_HIT_FREEZE` |

## 5 · Reedwing

### 5.1 Chỉ số

```
role: RANGED            baseClass: UnitClass.ROTOR_WING (thêm mới)
maxHp: 4                ← thấp nhất roster. Giá của cánh bay.
damage: 2               moveRange: 4   ← cao nhất roster
movementType: 'FLYING'  immunities: [] (miễn chết đuối tự có qua swims())
```

### 5.2 Đòn cơ bản — `Wing Guns`: cặp nước-mã theo 4 hướng

Chọn **1 trong 4 hướng**, bắn **2 ô nước-mã** hướng đó, `DAMAGE 2` mỗi ô. 8 ô quân mã chia
đúng thành 4 cặp: mỗi hướng tiến 2, tách ±1 hai bên — máy bay chúc mũi, hai tên lửa rời hai cánh.

```
        . X . X .          Hướng LÊN, Reedwing ở Z: (x-2, y-1) và (x-2, y+1)
        . . . . .
        . . Z . .          Lưu ý trục: trong repo x là HÀNG (dọc), y là CỘT (ngang)
        . . . . .          — xem gustDirection & maps.ts.
        . X . X .
```

| Hướng | Hai ô |
|---|---|
| Lên | `(x-2, y-1)` · `(x-2, y+1)` |
| Xuống | `(x+2, y-1)` · `(x+2, y+1)` |
| Trái | `(x-1, y-2)` · `(x+1, y-2)` |
| Phải | `(x-1, y+2)` · `(x+1, y+2)` |

- Hai ô cách nhau đúng 2 ô → **ăn cả hai phát là bài toán đội hình**; bay + move 4 là công cụ
  giải bài toán đó. Không ô nào kề Reedwing → cô luôn bắn từ ngoài tầm với của thứ cô bắn.
- Không cần `facing` (unit không có hướng mặt — đã kiểm): hướng là thứ người chơi chọn lúc bấm.
- Validator "hai nhà chéo nhau là hốc bất khả xâm phạm" (`maps.ts:1197`) **còn nguyên** — ô
  chéo kề không nằm trong 8 ô nước mã.

**Cần viết:** `SkillRangeType: 'WING_PAIR'`; nhánh trong `getSkillGeometry` (8 ô nước-mã);
`getValidSkillTargets`/`getSkillTargetPath` — chọn 1 ô thì **ô song sinh cùng hướng sáng theo**;
`skillResolution` phân giải cả cặp trong một hành động.

### 5.3 Kỹ năng phí — `Smoke Pod` (50 Sol)

Thả một quả khói; **mọi zombie kết thúc lượt trong khói không ra đòn được** — intent huỷ, hiện
`MISS`. Cơ chế là `DUST_VEIL` sẵn có (bảng 3.1); mắt xích thiếu duy nhất: `EffectType` mới
**`DUST_TILE`** sao y `SPIKE_TILE` (cái kia ghi `tile.spikes`, cái này ghi `tile.dust`).
Hình phủ: dấu cộng như hazard. Khói không sát thương, không chặn đường — mua *thời gian* (một
lượt rút lui), không mua *mạng*; không đụng STUN RULE vì không lấy lượt của zombie.

### 5.4 Dòng fusion của Reedwing — 10 công thức

Điểm yếu lõi: *4 máu, và muốn nổ đủ hai súng phải bay vào đúng một đội hình cụ thể* → dòng này
mua **sống sót, đường thoát, và cách ép đội hình**.

| Gear | Tên | Hiệu ứng | Vì sao |
|---|---|---|---|
| Sol Battery | **Solar Rotor** | `SUN_ON_KILL 15` | Hai súng = hai cơ hội kết liễu mỗi lượt |
| Seed Gun | **Twin Pods** | `DOUBLE_ATTACK 1` | Loạt thứ hai 1 sát thương — đúng khuôn đã hạ của Peaburst |
| Steel Jaws | **Grinder Pods** | `BLEED_ON_HIT` | Hai súng = **hai vết thương mỗi lượt** cho cả đội thu hoạch |
| Armor Plate | **Armored Fuselage** | `BONUS_HP 3` | 4 → 7. Mua thẳng vào điểm yếu lõi |
| Corn | **Cluster Load** | `SKILL_DISCOUNT 15` | NGOẠI LỆ: arc vô nghĩa với hình học cố định, `SKILL_STUN` ghép vào bom diện rộng thì quá mạnh → mua rẻ quả khói (đúng ngoại lệ Cornova×Cactus cũ) |
| **Rotor Wing** | **Overdrive Rotor** | `MOVE_BONUS 1` | Ô chữ ký: move 4 → 5, bay. Chính cô, vặn to lên |
| Spike Armor | **Barbed Skids** | `RETALIATE_PUSH` | Với hero 4 máu, đẩy kẻ chạm vào ra xa **là** đường thoát |
| Chard | **Downwash** | `ON_HIT_PUSH` | Gió cánh quạt: đẩy **cả hai ô** cùng lúc — chưa ai làm được |
| Bunker Shell | **Pod Plating** | `SHIELD_ON_KILL` | Kết liễu là dựng lớp chắn (6.0) — hero 4 máu tự mua bảo hiểm bằng chính hai khẩu súng |

*(9 công thức — cột Ice Grenade không còn tồn tại, quyết định 12.)*

## 6 · NHÁNH SUPPORT LÀM LẠI

> Ba hero support hiện chỉ trao *chỉ số*; ba gear của họ là ba ô "chưa có gì" trong khung.
> Sau mục này, ba support **nuôi lẫn nhau**: Sunbloom phát giáp+damage, Gourdward biến giáp
> thành miễn nhiễm, Chardslam quyết định vị trí — và mỗi gear có món B thật.

### 6.0 MÔ HÌNH GIÁP: LỚP CHẮN (kiểu ItB) thay cho GIÁP SỐ — **đã chốt theo ý 2**

Hai mô hình đặt cạnh nhau:

| | **Giáp số** (hiện tại: `shield: 5`, trừ dần) | **Lớp chắn** (ItB: 1 lớp, chặn TRỌN 1 nguồn sát thương bất kỳ, rồi vỡ) |
|---|---|---|
| Đọc bàn cờ | Phải làm toán: giáp 2, đòn 4 → lọt 2 | Nhị phân: có lớp = đòn kế bị hủy. Đọc một liếc mắt — đúng triết lý telegraph |
| Giá trị | Cố định ≤ số giáp | **Co giãn theo đòn nó chặn**: chặn nắm đấm 5 của Gravehulk = 5, chặn imp cắn 1 = 1 → kỹ năng nằm ở việc ĐỌC đòn to mà che, không ở việc đắp số |
| Xếp chồng | Cộng dồn vô hạn → phải đẻ ra cap (Blessing cap 2, Reinforce cap 3, nhà cap…) | **Không tồn tại khái niệm chồng** — có lớp rồi thì ban thêm là no-op. Cả cụm câu hỏi cap TAN BIẾN, kể cả bài rùa-đắp-giáp trận trùm không đồng hồ |
| Nhà | "mầm 1 máu + giáp N" — vẫn phải đếm | **"nhà có 1 lớp = đỡ đúng 1 cú cắn"** — khớp hoàn hảo mô hình unit-1-máu đã chốt |
| Đòn đánh nhiều lần | Giáp 5 đỡ được cả hai búa 2+2 của Clockjaw | Lớp chỉ chặn búa ĐẦU — trùm đánh-hai-lần tự nhiên thành khắc tinh của lớp chắn. Texture hay: đúng bài Clockjaw dạy |
| Sunbloom vs Gourdward | Phân vai bằng SỐ (cô vá 1-2, anh đắp 5) | Phân vai bằng ĐỘ PHỦ: ai cũng ban "một lớp" — nhưng Gourdward ban **diện rộng + cho cả NHÀ + miễn phí mỗi lượt**, Sunbloom chỉ ban kèm trong gói buff. Vai anh là coverage, vai cô là tempo |

**Chốt: chuyển toàn bộ hệ giáp sang LỚP CHẮN.** `Unit.shield` giữ kiểu số nhưng chỉ nhận 0/1
(save cũ mang giáp 5 → đọc là "có lớp" — migration một dòng); `calculateDamage`: có lớp và đòn
> 0 → đòn về 0, lớp vỡ, hiện icon vỡ.

**Ba khoản phải trả (nêu thẳng):**
1. **`SHIELD_BONUS` mất nghĩa** — "+1 cỡ giáp bạn phát" không tồn tại khi giáp không có cỡ.
   Mọi ô recipe đang cấp nó phải mang nghĩa mới (ứng viên: lớp của bạn chặn thêm cả cú ĐẨY /
   ban lớp lan sang 1 đồng minh kề). Liệt kê khi code — khoản treo duy nhất của plan.
2. **Ngữ nghĩa pierce — ĐÃ CHỐT (quyết định 15)**: một nguồn = chặn trọn (Devour KHÔNG xé
   được lớp); loạt nhiều viên = nhiều nguồn, viên đầu phá lớp viên sau vào (VOLLEY,
   DOUBLE_ATTACK). `isPiercing` chỉ còn nghĩa với số học cũ — với lớp, ranh giới là
   strikes/blast sẵn có của engine. Đối xứng đẹp hai phía: phe cây phá lớp bằng volley của
   Peaburst, phe zombie phá lớp bằng búa đôi của Clockjaw.
3. **Encase "2 mỗi người" quy về "mỗi người MỘT LỚP"** — giá trị của skill giờ nằm ở bề rộng
   dấu cộng, không ở con số. `ARMOR_WHILE_DIGESTING` của Snapmaw → "bắt đầu tiêu hoá là có lớp"
   (chặn trọn cú đầu trong cửa sổ bất lực — còn đúng chất hơn bản số). `SHIELD_ON_KILL` →
   "kết liễu là dựng lớp" (cap tự biến mất).

**Luật dịch chuyển (quyết định 16, đúng shield ItB):** lớp chặn sát thương, KHÔNG chặn dịch
chuyển — thân có lớp vẫn bị đẩy/kéo/hất, sát thương va chạm/ngã đi kèm bị lớp nuốt. Đòn bị
chặn thì status/rider/vết thương đi kèm cũng không vào.

### 6.1 Sunbloom — Sol Burn → `Solar Blessing` (buff thuần)

**Hiện tại:** Sol Burn — LOB 3, 50 Sol, `DAMAGE 4`. Là **nguồn sát thương duy nhất** của cô.

**Mới:** `Solar Blessing` — LOB 3, 50 Sol, nhắm đồng minh:
- **+1 LỚP CHẮN** (mô hình 6.0 — đã có lớp thì nửa này là no-op, không có gì để cap). Cố ý
  KHÔNG dùng `BUFF_STAT HP` (`migrateHeroHp` rebuild maxHp sau mỗi F5 — maxHp buff sẽ bị xoá
  lặng lẽ).
- **+1 damage CHỈ TRONG LƯỢT NÀY** — status mới `BLESSED`, **xoá ở cuối lượt người chơi**
  (trước phase địch). Hệ quả chiến thuật đúng như đã chốt: *buff trước, đánh sau* — ban phước
  cho ai đã đánh xong là ném 50 Sol đi.

Turn-scoped là bắt buộc chứ không phải lựa chọn: `units` sống xuyên trận cả run (hp persist là
thiết kế), trận trùm không đồng hồ — damage buff không decay sẽ cộng dồn vô hạn.

Phương án "hồi 1 máu đã mất" đã cân nhắc và **loại**: lớp chắn thắng cả về triết lý telegraph
(*"shields reward looking forward"*, `heroes.ts:373`) lẫn kinh tế — hp persist xuyên trận là
món nợ campfire/Coin tồn tại để trả, nguồn hồi trong trận sẽ rò thẳng vào đó.

**Chi phí lan — vẫn là mục đắt nhất plan:**
1. **Tutorial script 4 bàn dùng Sol Burn với số học chính xác** (`data/tutorial.ts:562, 618,
   736, 749, 980, 1018`): bàn hộp thư ("một Sol Burn thiếu 25"), bàn cửa (Sol Burn 3 xuyên
   giáp lượt 1), bàn trùm (pea 2 + blast 3 + pea 2 + 2 bash + **Sol Burn 4 = 13 vào 16 HP** —
   "Measured, so the defeat can never be mistaken for a misplay"). Re-script + assert. Bàn
   trùm còn **hay hơn về truyện**: cô không hại nổi Gravehulk, cô ban phước cho Ironhusk đập
   nó — và +1-trong-lượt dạy đúng bài *buff trước, đánh sau* ngay tại đó.
2. Recipe vỡ: *Winter Flare* ("Sol Burn slows…") và *Needle Bloom* (`SKILL_SPLASH` trên Sol
   Burn) — viết lại quanh Blessing (gợi ý: Winter Flare → `RETALIATE_FREEZE` bảo vệ cục pin;
   Needle Bloom → Blessing splash sang đồng minh kề ô mục tiêu).
3. Comment định giá Devour theo "TWO Sol Burns (8 damage…)" (`heroes.ts:176`) — neo lại.
4. Element rider trên skill nhắm đồng minh: tiền lệ Encase đã giải — kiểm một lần khi làm.

**Nguyên tố trên Sunbloom — CỤC PIN NGUYÊN TỐ (quyết định 11).** Cô giữ miễn nhiễm của
nguyên tố mình mang (ELEMENT_IMMUNITY chuẩn); **Blessing cho mượn lưỡi dao**: đồng minh được
ban phước, các đòn đánh **trong lượt đó** mang nguyên tố của cô. Luật kèm:
- `BLESSED` mang theo `element` của người ban; các điểm gắn rider (applyFusionToSkill /
  skillResolution đọc `caster.element`) đọc thêm nguyên tố mượn.
- **Nguyên tố riêng của ally THẮNG** — mượn chỉ lấp chỗ trống, không ghi đè, không chồng hai
  rider.
- **Mượn không kèm miễn nhiễm** (miễn nhiễm là da của carrier, không phải lưỡi dao) và
  **không tính vào resonance** — giữ hộp resonance đóng.
- Turn-scoped sẵn theo `BLESSED` → khoản vay tự đáo hạn, không có build cho-mượn-vĩnh-viễn.

Fire-Sunbloom bless Snapmaw đang đứng cạnh ba xác → Bite rực lửa. ICE-Sunbloom bless Peaburst →
volley 3 viên đạn băng. Đây là fantasy support mà nhánh này còn thiếu.

Gear Sol Battery món B: `SKILL_BLESS` — *kỹ năng phí của bạn xong còn ban +1 damage (lượt này)
cho một đồng minh trong 2 ô* (bản mượn-nguyên-tố là đặc quyền của Blessing chính chủ, không
đi theo gear — gear chỉ chuyển con số, không chuyển cục pin).

### 6.2 Chardslam — Vault Toss là ĐÒN CƠ BẢN, Sweep giữ nguyên làm kỹ năng

**Chốt:** Backswing nghỉ. Kit mới:
- **Đòn cơ bản `Vault Toss`** (miễn phí, MELEE 1): túm zombie kề, **hất qua đầu sang ô đối
  xứng** (`2·Z − T`), rơi xuống chịu **sát thương ngã 1** (CHỐT — quyết định 8), và **đáp đất
  dính nguyên tố của anh** nếu anh mang (luật L1 sẵn có, cùng đường statusOnHit với cú đẩy —
  không viết cơ chế mới).
- **Kỹ năng `Sweep`** (50 Sol, SELF radial `PUSH 2`) — **giữ nguyên như đang có.** "Đẩy lùi 4
  phía xung quanh" chính là nó; không viết gì mới cho slot này.

Luật của cú hất:
- **Sát thương ngã là sát thương VA CHẠM, không phải effect `DAMAGE`.** Identity "0 damage là
  hero" (`heroes.ts:348`, guard trong `utils/fusion.ts`) còn nguyên — thế giới gây đau, không
  phải đòn của anh. **Grand Chard (`COLLISION_BONUS 2`) sẵn có tự cộng cho cú ngã** — recipe cũ
  tự nâng đòn mới.
- Va chạm/môi trường **bỏ qua giáp mũ** theo luật hiện hành — Vault Toss là câu-trả-lời-to cho
  Pothelm mà game vẫn luôn đòi ("push it, burn it, spike its path").
- Điểm rơi phải **trống và trong bàn** — ô bị chiếm thì KHÔNG cho ngắm (CHỐT, quyết định 16 —
  đúng luật ném của ItB; nước được — đường chết đuối của `planPush` dùng lại). Đáp bằng phễu
  **`UNIT_MOVE`** để mìn/gai/bụi tự kích hoạt (`itemResolution.ts:111`).
- Miễn `PUSH` thì không túm được — cùng cửa kiểm với đẩy. Mục tiêu có lớp chắn: vẫn bay như
  thường, sát thương ngã bị lớp nuốt (quyết định 16 — hôm nay zombie chưa có nguồn lớp nào
  nên chỉ là luật dự phòng).
- Trục "push + pull" nằm trọn trong kit: **Sweep đẩy ra bốn phía, Vault Toss kéo qua thân sang
  bên kia.**

Ngã 1 (đã chốt) đặt anh ngang Ironhusk về số (bash 1 + đẩy) mà vẫn giữ trọn giá trị dịch
chuyển — ngã 2 sẽ mạnh hơn mọi đòn free khác vì vừa xuyên giáp vừa dịch chuyển toàn phần.
Grand Chard nâng lên 3 là phần thưởng có trả giá.

Recipe vỡ theo **Backswing** (Sweep sống nên *Bramble Guard* và nửa "sweep" của *Cob Catapult*
**thoát**): *Longarm Chard* ("Backswing reaches 2") → đổi thành tầm túm của Toss; nửa "swing"
trong mô tả *Cob Catapult* → sửa chữ. EDGE *Long Handle* (+1 tầm đòn cơ bản) tự nhiên thành
"túm từ xa 2 ô" — giữ được, chỉ sửa mô tả.

### 6.3 Gourdward — hộ vệ thuần: giáp cho VẠN VẬT, miễn nhiễm nguyên tố bẩm sinh

**Kit mới:**
- **Passive:** `immunities: ['BURN', 'FREEZE', 'SHOCK']` — **vô điều kiện, tĩnh**. Đúng mạch
  lore đã chốt: mở khóa ở Old Quarter (III-2), sau chương lửa (I) và chương băng (II), ngay
  trước trùm điện (Voltmaw III-3) — tấm giáp học từ hai chiến dịch để bước vào chiến dịch thứ
  ba. Tiền lệ: Sunbloom `['BURN']`. **Chi phí engine: BẰNG KHÔNG** — chỉ là phần tử mảng, cả
  ~33 điểm đọc `immunities.includes` tự đúng. (So với bản ward-theo-giáp trước: tiết kiệm
  nguyên cuộc refactor 17 điểm.)
- **Đòn cơ bản `Reinforce`** (miễn phí, kề 1 ô): **dựng MỘT LỚP CHẮN cho bất cứ thứ gì đồng
  minh đứng kề — hero, cây bench đã triển khai, và cả NHÀ.** Rind Bash nghỉ; `damage: 1` trên
  sheet về `0` — anh không còn đòn đánh nào.
- **Kỹ năng `Encase`** (50 Sol): **AoE hình dấu cộng** — mọi đồng minh trên ô anh đứng + 4 ô
  kề (kể cả anh) **mỗi người một lớp chắn** (mô hình 6.0 — "2 mỗi người" của bản giáp-số quy
  về đây; giá trị của skill là BỀ RỘNG, không phải con số). Comment "5 là để nuốt trọn một đòn
  boss" viết lại: một lớp giờ nuốt trọn *bất kỳ* đòn nào — kể cả đòn boss — nhưng chỉ một.

**GIÁP CHO NHÀ — mô hình "unit 1 máu", cài bằng hai điểm chặn (quyết định 10).**

Khảo sát chốt lại hộ chúng ta: hành vi mà mô hình unit-1-máu muốn có thì **engine đã có đủ** —
zombie không đi vào nhà, nó đứng KỀ một lượt, telegraph intent `ATTACK` nhắm nhà, cắn ở lượt
sau, và Ở LẠI sau khi ăn (`turnManager.ts:697-717`; AI nhắm nhà từ `aiLogic.ts:13`). Người
chơi đã luôn có cửa sổ một lượt để giết/đẩy/taunt nó. Thứ duy nhất thiếu: **nhà không có gì để
đỡ cú cắn.** Vậy:

- `TileData.shielded?: boolean` — **một lớp chắn của nhà** (mô hình 6.0 khớp tuyệt đối:
  "nhà = unit 1 máu, có thể đeo đúng 1 lớp").
- **Hai điểm chặn**, đúng hai cửa mầm bị lấy: cú cắn kề (`turnManager.ts:711`) và cú bị-đẩy-
  vào-nhà (`gameLogic.ts:194` — cửa này tồn tại làm giá của đòn đẩy ẩu, lớp cũng phải đỡ được
  nó). Có lớp → lớp vỡ, mầm KHÔNG mất, hiện icon vỡ; zombie vẫn đứng đó cắn tiếp — Reinforce
  lượt sau là cuộc giằng co 1-đổi-1 giữa Gourdward và con zombie đó, đúng nhịp tug-of-war ItB.
- `Tile.tsx` vẽ lớp trên nhà · `threat.ts` coi nhà-còn-lớp không phải "mầm sắp mất".
- **Không** refactor nhà thành unit thật: ~40 điểm đọc `isHouse` / 12 file sẽ phải re-route,
  và mở hộp friendly-fire (cherry bomb cạnh nhà, jalapeno cả hàng…) — trả giá lớn cho đúng
  không hành vi mới nào. "1 máu" là mô hình tư duy; dữ liệu vẫn là tile.

Bài "xếp giáp vô hạn trận trùm" chết theo mô hình lớp (6.0): một thân tối đa một lớp, mãi mãi
— Reinforce vào người đã có lớp là no-op, không cần bất kỳ cap nào.

**Nguyên tố trên support:** Sunbloom đã có lối thoát đẹp — cục pin cho mượn qua Blessing (6.1).
**Gourdward thì vẫn chặn picker**: ward đã miễn cả ba nguyên tố, kit không còn hành động nhắm
địch nào — gắn nguyên tố lên anh là trả 2 máu cho con số không, kép hai lần vô nghĩa.
(Chardslam thoát theo đúng chữ L1: cú hất 0-damage vẫn chở nguyên tố — giờ thành chốt ở cú
đáp đất của Vault Toss.)

Tam giác support sau chốt: **Sunbloom vá giáp lặt vặt + châm damage đúng lượt → Gourdward là
nguồn giáp chính và là người duy nhất che được NHÀ → Chardslam quyết định kẻ địch đứng đâu.**
Ba người, không ai có một đòn sát thương trực tiếp — nhánh support là nhánh *enabler* thuần.

Gear Bunker Shell: món A = tự-giáp `SHIELD_ON_KILL` (có cap, tiền lệ *Gourd Husk*); món B =
**`ELEMENT_WARD`** — miễn BURN/FREEZE/SHOCK, **áp thẳng vào `immunities` lúc fuse** (đường
ELEMENT_IMMUNITY sẵn có). So sánh giá: một nguyên tố = 2 maxHp đổi 1 miễn nhiễm + rider; ward
= một ô fusion đổi 3 miễn nhiễm không rider — một slot gear là giá thật, và hero row nào thấy
nó quá rẻ thì ô đó làm ngoại lệ.

## 7 · Cột `MAT_CATTAIL` — 8 hero còn lại

*Hai món: `MOVE_BONUS 1` và `SKILL_DISARM`. (Câu hỏi cũ "bụi có được dính đòn miễn phí không"
tự giải bằng khung: `SKILL_DISARM` chỉ tồn tại trên kỹ năng phí — đúng tiền lệ `SKILL_SPLASH`.)*

| Hero | Món | Tên | Vì sao |
|---|---|---|---|
| Sunbloom | `SKILL_DISARM` | **Ashveil** | Blessing kèm bụi quanh người được ban phước — che luôn kẻ được che |
| Peaburst | `SKILL_DISARM` | **Smokeline** | Precision Blast quét hàng nào, hàng đó không vung nổi đòn |
| Snapmaw | `MOVE_BONUS 1` | **Prowl Drive** | Phải áp sát mới cắn, tiêu hoá xong lại kẹt tại chỗ |
| Ironhusk | `MOVE_BONUS 1` | **Quick Bulwark** | Đến kịp hành lang cần chặn là toàn bộ việc của cô |
| Cornova | `MOVE_BONUS 1` | **Skid Carriage** | LOB 2 buộc đứng sát tuyến; thêm chân là thêm đường lui |
| Thornshell | `MOVE_BONUS 1` | **Windburr** | Chính chữ trong file: *"2 damage and move 2 catches nobody"* — cho anh chọn chỗ đặt bẫy khiêu khích |
| Chardslam | `SKILL_DISARM` | **Veilsweep** | Sweep: bốn ô vừa quét chìm trong bụi — bị hất văng xong còn không vung nổi đòn |
| Gourdward | `MOVE_BONUS 1` | **Rolling Rind** | Việc của anh là **tới kịp** người cần che; move 2 là thứ cản điều đó |

5 cơ động / 3 tước đòn; cả hai effect đều mới nên không thể trùng hàng với ai.

## 8 · `MAT_CHOMPER` — trục chảy máu (đã chốt)

`MAT_CHOMPER` và `MAT_ENDURIAN` hiện **trùng effect mặc định từng ký tự** (`RETALIATE_DAMAGE
2`), và 3/9 hero nhận đúng phản đòn từ Steel Jaws — chiếm trục của Spike Armor.

**`BLEED_ON_HIT`**: trúng đòn → `BLEEDING`; **đòn kế tiếp** giáng vào nó +1. Tiêu hao bởi đòn
kế (không đếm lượt), không cộng dồn.
- **+1 cộng SAU bước trừ giáp** trong `calculateDamage` (thứ tự hiện tại: reduction → giáp →
  khiên → máu) — cộng trước là giáp nuốt mất, gear vô dụng đúng với địch nó sinh ra để trị.
- Hơn xuyên-giáp vì: không thêm khái niệm "pierce" thứ tư (đã có `PIERCE_ATTACK` / `isPiercing`
  / `ignoresArmor` — ba thứ khác nhau); không xoá bài toán giáp (`gameLogic.ts:358`); mở lớp
  phối hợp cắn-rồi-thu-hoạch.
- `BLEEDING` đi đường status chuẩn về hiển thị (icon, telegraph) nhưng **KHÔNG qua cửa miễn
  nhiễm `STATUS` — trùm vẫn chảy máu** (CHỐT — quyết định 13). Nó là vết thương vật lý, không
  phải hiệu ứng điều khiển; một gear cả run mà nguội ở đúng chín trận đáng tiền nhất thì
  không đáng một ô. Điểm áp status phải rẽ nhánh riêng cho `BLEEDING` (các điểm
  `immunities.includes('STATUS')` trong skillResolution/turnManager bỏ qua nó).

| Hero | Cũ | Mới |
|---|---|---|
| Ironhusk | *Biting Wall* `RETALIATE_DAMAGE 2` | **Rending Bite** `BLEED_ON_HIT` |
| Cornova | *Cob Grinder* `RETALIATE_DAMAGE 2` | **Shrapnel Kernel** `BLEED_ON_HIT` |
| Chardslam | *Snapping Guard* `RETALIATE_DAMAGE 2` | **Rending Guard** `BLEED_ON_HIT` — ô đáng nhất: hero 0-damage giờ **đánh dấu để cả đội giết mạnh hơn**, lọt qua guard cấm-damage của anh một cách chính danh |
| Reedwing | *(mới)* | **Grinder Pods** `BLEED_ON_HIT` |
| `materials.ts` | `RETALIATE_DAMAGE 2` | `BLEED_ON_HIT` — hết trùng Spike Armor |

## 9 · `MAT_SNOW_PEA` — BỎ HẲN (đã chốt, quyết định 12)

Khung hai-món làm lộ: Ice Grenade không thuộc hero nào — Frostpod đã nghỉ, cái lạnh giờ là nguyên
tố BĂNG. Chốt: **xoá gear**, ma trận về **9 × 9 = 81**, mỗi gear một chủ, không ô mồ côi.

Việc kéo theo:
- `types.ts` `MaterialId` −`MAT_SNOW_PEA` · `data/materials.ts` xoá entry + rút khỏi
  `STARTING_MATERIALS` · `fusionRecipes.ts` xoá cả cột (9 công thức, gồm *Winter Flare* vốn
  đã phải viết lại theo Blessing — giờ khỏi) · comment "10×10" đầu file sửa thành 9×9.
- **`utils/persistence.ts` PHẢI lọc id chết khi load** — save cũ có `MAT_SNOW_PEA` trong
  `materials` và trong khóa recipe đã học (`parseRecipeKey`); id không còn definition mà lọt
  vào shop roll (`rollGear`) hay panel fusion là crash/thẻ trắng. File này đã có sẵn pattern
  lọc (bossesBeaten lọc theo `BOSSES`) — làm y vậy cho materials + recipes.
- Item **Ice Grenade** (`items.ts`, hiệu ứng FREEZE) là thứ KHÁC, không đụng — chỉ gear chết.
- `ON_HIT_FREEZE` vẫn sống trong engine (nguyên tố BĂNG dùng) — chỉ mất cửa vào từ gear.

## 10 · Sửa phần comic đã làm (bảng unlock mới làm sai 4 chỗ)

1. `art-src/ART-PROMPTS-CUTSCENES.md` §2.9 — prompt Headliner đang tả *Thornquill cầm giáo
   xuyên hàng* → đổi thành **Chardslam hất bay đám đông** (0 damage, đẩy — giờ thêm Vault Toss)
2. `data/cutscenes.ts` `HEADLINER` — caption *"One spine ran through all of them at once"*
   → viết lại theo Chardslam
3. `data/cutscenes.ts` `ARMADA` — caption *"took back the hands that threw it"* (viết
   cho Chardslam) → viết lại theo Reedwing chiếm không trung
4. `i18n/vi.ts` — bản dịch hai caption trên

Badge phần thưởng tự đúng (đọc `bossById().hero`).

## 11 · Danh sách file thay đổi

| File | Việc |
|---|---|
| `types.ts` | `HeroId` −THORNQUILL +REEDWING · `UnitClass` +ROTOR_WING · `MaterialId` MAT_CACTUS→MAT_CATTAIL · `SkillRangeType` +`WING_PAIR` · `EffectType` +`DUST_TILE` +`TOSS` · `FusionEffectType` +`MOVE_BONUS` +`SKILL_DISARM` +`SKILL_STUN` +`SKILL_BLESS` +`SKILL_DISPLACE` +`ELEMENT_WARD` +`BLEED_ON_HIT` · `StatusEffectType` +`BLEEDING` +`BLESSED` · **`TileData.shield?`** (giáp NHÀ) |
| `data/heroes.ts` | Khối THORNQUILL → REEDWING (5.1–5.3) · Sunbloom: Sol Burn → Solar Blessing · Chardslam: Backswing → Vault Toss (đòn cơ bản), giữ Sweep · Gourdward: Rind Bash → Reinforce, Encase → AoE dấu cộng, `immunities: ['BURN','FREEZE','SHOCK']`, `damage: 0` |
| `data/materials.ts` | MAT_CACTUS → MAT_CATTAIL (tên, effect `MOVE_BONUS`, benchClass) · MAT_CHOMPER effect → `BLEED_ON_HIT` |
| `data/fusionRecipes.ts` | ~26 công thức (3.3) + sửa comment đầu file (10×10 → 9×10, quy tắc dòng mới) + *Longarm Chard*, *Cob Catapult* (chữ "swing"), *Gourd Husk* & *Fanged Gourd* (Gourdward hết đòn đánh → SHIELD_ON_KILL/BONUS_DAMAGE trên anh thành vô nghĩa — ô mới quanh Reinforce/Encase) |
| `data/heroUpgrades.ts` | EDGE THORNQUILL → REEDWING (gợi ý `MOVE_BONUS`) · EDGE GOURDWARD *Hard Rind* (BONUS_DAMAGE) chết theo Rind Bash → đổi (gợi ý: Reinforce +1) · *Long Handle* của Chardslam giữ, sửa mô tả thành tầm túm |
| `data/unlocks.ts` | 2 dòng BOSSES (hero Armada + Headliner) · `HERO_MATERIAL` · viết lại `hint` hai trùm theo hero mới |
| `data/tutorial.ts` + `tutorial.assert.ts` | **Re-script các bàn dùng Sol Burn** (6.1) — mục đắt nhất |
| `utils/gameLogic.ts` | `WING_PAIR` targeting · **`calculateDamage`: hệ giáp số → LỚP CHẮN (6.0)** — có lớp là đòn về 0 và lớp vỡ; chốt tương tác pierce (12) · nhánh `BLEEDING` sau lớp · `planPush`/`tookBrain`: lớp NHÀ đỡ cú cắn |
| Hệ giáp — mọi consumer | `ARMOR_WHILE_DIGESTING` → lớp lúc bắt đầu tiêu hoá · `SHIELD_ON_KILL` → kết liễu dựng lớp (bỏ cap) · **mọi ô recipe `SHIELD_BONUS` cần nghĩa mới** (đã mất khái niệm "cỡ giáp") · save cũ shield N>0 → đọc là "có lớp" (persistence 1 dòng) |
| `utils/skillResolution.ts` | Phân giải cặp nước-mã · `DUST_TILE` (sao y `SPIKE_TILE`) · `TOSS` (điểm rơi, ngã = va chạm, UNIT_MOVE) · `BLESSED` apply · Encase AoE + Reinforce nhắm nhà |
| `utils/turnManager.ts` | Xoá `BLESSED` cuối lượt người chơi · tiêu hao `BLEEDING` · điểm `tookBrain` còn lại kiểm giáp nhà |
| `utils/{bossBehaviours,fusion}.ts` | Comment mốc Thornquill (3.2-3) · guard fusion cho kit mới của Chardslam/Sunbloom/Gourdward |
| `utils/threat.ts` | Nhà có giáp không còn báo "mầm sắp mất" trong overlay dự báo |
| `utils/icons.ts` | HERO_ICONS/SPRITES/ACCENTS (+`#e879f9` magenta) · icon status BLEEDING/BLESSED |
| `components/UnitComponent.tsx` + `components/Tile.tsx` | Icon 2 status mới · vẽ giáp NHÀ trên tile |
| `components/SquadSelectScreen.tsx` | Chặn picker nguyên tố với hero không có hành động nhắm địch (12.8) |
| `i18n/vi.ts` | Reedwing + 4 skill mới (Blessing/Toss/Reinforce/Encase-AoE) + ~26 recipe + upgrade + 2 hint + caption comic |
| `data/maps.ts` | Không sửa validator — nước mã không đụng hốc chéo kề |
| Art | `sprite-zephyr.png` (prompt có sẵn) · gear MAT_CATTAIL · bỏ sprite-thornquill khỏi public/ |

## 12 · Khoản treo duy nhất

Mọi câu hỏi thiết kế đã chốt (mục 2, quyết định 1–16). Còn đúng một khoản, cố ý dời sang lúc
code: **nghĩa mới cho từng ô `SHIELD_BONUS`** (mất khái niệm cỡ giáp — ứng viên: lớp của bạn
chặn thêm cả cú ĐẨY, hoặc lớp bạn dựng lan sang 1 đồng minh kề). Rà từng ô một khi đến lượt
file `fusionRecipes.ts`, vì nghĩa đúng phụ thuộc hàng hero cụ thể.

## 13 · Thứ tự triển khai đề xuất

Bốn đợt, mỗi đợt xanh (typecheck + assert) rồi mới sang đợt sau:

1. **Nền — hệ LỚP CHẮN (6.0)**: đổi `calculateDamage`, strikes/blast vs lớp, mọi consumer
   giáp cũ, save migration, icon. Đây là móng của mọi thứ sau; tutorial hiện tại KHÔNG dùng
   shield nên assert vẫn xanh được ở đợt này.
2. **Reedwing thay Thornquill (5)**: types, hero, `WING_PAIR`, `DUST_TILE`/Smoke Pod, gear
   `MAT_CATTAIL` + cột của nó, dòng fusion Reedwing, bỏ `MAT_SNOW_PEA` (9), trục chảy máu của
   `MAT_CHOMPER` (8), unlocks + hint + comment mốc, sửa comic (10).
3. **Support rework (6.1–6.3)**: ba kit mới, `BLESSED` + nguyên tố mượn, Vault Toss, lớp cho
   NHÀ, ward + chặn picker nguyên tố của Gourdward, EDGE upgrades mới.
4. **Tutorial re-script (6.1.1)**: các bàn dùng Sol Burn — làm CUỐI vì phụ thuộc kit Sunbloom
   mới; `tutorial.assert.ts` đỏ trong lúc làm đợt 3 là danh sách việc của đợt này.

## 14 · Kiểm chứng

- `npm run typecheck` — ma trận là `Record` đầy đủ, thiếu ô là lỗi biên dịch
- Mở app dev — `roster.assert.ts` (3/3/3, một trùm một hero, lưới campaign) và
  `tutorial.assert.ts` (**sẽ đỏ cho tới khi re-script xong 6.1 — chạy nó là danh sách việc**)
- Chơi thử: bàn có nước/dung nham cho `FLYING` (hero bay đầu tiên phe người chơi) · trận
  Voltmaw với Gourdward (miễn SHOCK: arc điện phải từ chối chọn anh làm hop —
  `bossBehaviours.ts:358` đọc mảng immunities, tự đúng) · một lượt Vault Toss xuống nước ·
  Reinforce lên NHÀ rồi để zombie tới cắn — mầm phải còn, lớp phải vỡ, lượt sau nó cắn tiếp ·
  Blessing sau khi đồng minh đã đánh — phải thấy rõ là phí (buff trước mới có giá) · một lớp
  chắn ăn trọn đòn 4-5 của boss (giá trị co giãn) NHƯNG thua búa thứ hai của Clockjaw — texture
  phải đọc được trên bàn · Precision Blast bắn mục tiêu có lớp: viên 1 phá lớp, viên 2–3 vào
  (quyết định 15) · đẩy/hất thân có lớp: vẫn văng, sát thương va chạm bị nuốt (quyết định 16)
