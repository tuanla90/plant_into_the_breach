# Bàn chơi & Chín con trùm — bản đặc tả để dựng

> Bản này cụ thể hoá **mục 6 và mục 8** của `PLAN-progression.md` (9 act, 9 boss, `WorldType`
> 4 → **9**) thành thứ có thể gõ thẳng vào `data/maps.ts`, `data/hazards.ts`, `data/zombies.ts`
> và `data/unlocks.ts`. Kèm **mục 6: nâng nền máu hero**, thứ chạm vào `data/heroes.ts` và
> `PLAN-heroes-9.md`.
>
> Trạng thái: **kế hoạch**. Chưa dòng code nào.
>
> Mọi bàn cờ trong file này **đã được kiểm bằng đúng bộ luật của `assertTemplate`**
> (8×8, có H/D/S, không có hai nhà kề chéo, nhà nào cũng có đường đi tới từ ô spawn).
> **39/39 bàn 8×8 hợp lệ** (12 bàn thường ở mục 3 + 18 bàn pool mở rộng ở mục 3b + 9 sân đấu
> trùm; sân màn cuối 6×6 đứng ngoài luật đó).

---

## 0. Ba con số neo mọi thứ dưới đây

| Mốc | Số | Nguồn |
|---|---|---|
| Lượt mỗi trận | **7** | `BASE_MAX_TURNS` |
| Sát thương cả đội gây ra mỗi lượt | **~5–6** | 3 hero, đa số 2 dmg |
| Máu Gargantuar hiện tại | **16** | `data/zombies.ts` — kèm chú thích "10 gục sau hai lượt" |

Trong 7 lượt đội bắn ra ~40 sát thương, nhưng **không phải tất cả rơi vào trùm** — quái lính
vẫn tới, não vẫn phải giữ. Thực tế trùm nhận được **20–25**. Đó là lý do 16 máu của Gargantuar
là con số đúng cho act đầu, và là thang để suy ra tám con còn lại.

> **✅ Đã vá.** Trước đây `objectivesFor('BOSS')` trả `['SURVIVE_TURNS']`, nghĩa là trốn đủ 7
> lượt là "hạ boss" và nhận hero. Giờ node BOSS dùng **`SLAY_BOSS`**: kết thúc sớm khi trùm
> gục, và **thua nếu hết giờ mà nó còn sống**. Trùm được đánh dấu bằng `Unit.isBoss` (tách
> khỏi `isMassive`, vốn là luật "không nuốt/đóng băng/đẩy được" chứ không phải danh hiệu).
>
> Hai khoá cho cùng một cửa, vì "không còn trùm sống" và "chưa từng có trùm" là hai trạng thái
> trông giống hệt nhau: `buildMission` **từ chối** giao objective này cho đợt quân không có
> trùm, và cả `isMissionCompleteEarly` lẫn `isMissionSatisfied` đều đòi *đã từng có* trùm.
> Không có khoá thứ hai thì một bàn thiếu trùm sẽ tự thắng ngay lượt 1.
>
> **Ngân sách sát thương đã đo, không phải đoán:** bộ ba khởi đầu có trần lý thuyết **37 sát
> thương** trong 7 lượt (3/lượt đánh thường + 4 phát Thiêu Nắng từ ngân sách 225 Sun) so với
> **16 máu** của Gargantuar — dư **2,31 lần**. Kể cả khi chỉ trúng chưa tới một nửa thì trùm
> vẫn gục, nên objective này siết chặt chứ không chặn đường.

---

## 1. Chín act, chín vùng

| Stage | Act | Vùng | `WorldType` | Hazard | Boss | Trả về |
|---|---|---|---|---|---|---|
| **I — Vành Đai Xanh** | 1 | Verdant Reach | `GRASS` | — | **Gargantuar** | Maw |
| | 2 | Goldacre | `DESERT` | Runaway Cart | **Ironcart** | Cobb |
| | 3 | Kiln Row | `VOLCANO` | Lava Flow | **Cinder Colossus** | 🔥 LỬA |
| **II — Bờ Xa** | 1 | Windward | `COAST` *(mới)* | **Thuỷ Triều** *(mới)* | **The Armada** | Chardwall |
| | 2 | Thornwaste | `THORN` *(mới)* | **Màn Cát** *(mới)* | **Sandreaver** | Thornhide |
| | 3 | Frostgate | `ICE` *(có type, chưa có bàn)* | Wind Gust | **Yeti** | ❄️ BĂNG |
| **III — Thành Phố** | 1 | Neon Rose | `NEON` *(mới)* | **Đèn Quét** *(mới)* | **The Headliner** | Thornquill |
| | 2 | Old Quarter | `RUIN` *(mới)* | **Sập Nhà** *(mới)* | **Clockjaw** | Gourdward |
| | 3 | The Grid | `GRID` *(mới)* | **Quá Tải Lưới** *(mới)* | **Voltmaw** | ⚡ ĐIỆN |
| **Màn cuối** | — | The Breach | `RUIN` | — | **Blightlord** | *(chậu cây)* |

### Thành phố là HAI vùng, không phải một

Bản nháp đầu gộp Neon Rose và Old Quarter vào một `WorldType` duy nhất để giữ đúng con số
"4 → 8" trong `PLAN-progression.md`. Đó là tiết kiệm sai chỗ — và chính tôi đã ghi nó thành rủi
ro ở mục cuối: hai act chơi giống nhau thì stage III hụt hơi đúng chỗ đáng lẽ phải to nhất.

Tách ra thì thành phố kể được một câu chuyện mà không vùng nào khác kể được: **cùng một thành
phố, hai thời điểm.**

| | `NEON` — **Neon Rose** | `RUIN` — **Old Quarter** |
|---|---|---|
| Trạng thái | **Điện vẫn còn chạy.** Chưa/đang bị đánh | **Đã bị đánh xong.** Đổ nát |
| Địa hình | Đường bê tông thẳng (`c`), toà nhà nguyên vẹn xếp thành ô cờ (`#`), biển hiệu neon còn sáng (`*` = `POWER_TILE`, +1 sát thương) | Gạch vụn rải lệch (`#`), đường nứt (`c`), **không một ô điện nào** |
| Hình dạng bàn cờ | **Hành lang đều, đọc được.** Phố là phố | **Lệch lạc, không có tuyến nào thẳng** |
| Hazard | **Đèn Quét** — thành phố còn điện thì đèn còn quay, và nó chỉ mặt bạn cho đám đông | **Sập Nhà** — mái nhà rơi, và ô đó thành đống gạch **vĩnh viễn** |
| Bàn cờ theo thời gian | **không đổi** | **co lại từng lượt** |
| Con trùm | The Headliner — biến đám đông thành mối nguy | Clockjaw — đánh hai lần, không kite được |

Hai hazard là hai nửa của cùng một ý: ở Neon Rose thành phố **vẫn hoạt động và điều đó chống lại
bạn**; ở Old Quarter thành phố **đang sập xuống đầu bạn**. Và cặp bàn cờ đứng yên / bàn cờ co lại
là lý do hai con trùm ở đúng chỗ của chúng — Headliner cần chỗ cho đám đông tràn vào, Clockjaw
cần chỗ ngày càng chật để không ai chạy được.

**Chín `WorldType`, không phải tám.** Con số trong `PLAN-progression.md` là ước lượng, không phải
ràng buộc — và cái thứ chín này mua đứt một rủi ro đã ghi trong đó.

`ICE` đã tồn tại trong `WorldType` và trong `SECTOR_HAZARD` nhưng **`MAP_TEMPLATES` không có bàn
nào `world: 'ICE'`** — `pickTemplate` đang lặng lẽ rơi về toàn bộ pool. Mục 3 dưới đây vá chỗ đó.

### Vùng nào cắm vào layer nào

`sectorForLayer` hiện chia cứng 1–3 / 4–6 / 7–10. Với chín act thì nó phải đổi thành **một act
= một bản đồ 10 layer**, và vùng là thuộc tính của act chứ không phải của layer:

```ts
// utils/mapGenerator.ts
const WORLD_FOR_ACT: Record<ActId, WorldType> = { ... };
const sectorForLayer = (_layer: number, act: ActId): WorldType => WORLD_FOR_ACT[act];
```

Một act một vùng nghe có vẻ nghèo hơn "ba vùng mỗi run", nhưng nó **đúng hơn**: hazard là bài
học của act, và một bài học cần mười layer để dạy, không phải ba.

---

## 2. Năm hazard mới

Luật không đổi: **hazard luôn báo trước trọn một lượt** (`planHazard` đặt, `turnManager` xử ở
đầu lượt sau), chu kỳ 3 lượt.

| Vùng | Hazard | Nó làm gì | Dùng lại được gì |
|---|---|---|---|
| `COAST` | **`TIDE`** — Thuỷ Triều | Các ô bờ đánh dấu **hoá `WATER` một lượt**. Ai đứng đó mà không bay/lội → `DROWN`. Rút xuống thành `GRASS` lại. | `MODIFY_TERRAIN` đã có (`LAVA_FLOW` dùng nó), luật `DROWN` đã có |
| `THORN` | **`DUST_VEIL`** — Màn Cát | 4–5 ô thành `environment: 'SMOKE'` trong 2 lượt. `SMOKE` đã định nghĩa sẵn: *"Blinds units. Cancels attacks."* | `EnvironmentType.SMOKE` đã có trong `terrain.ts`, chỉ chưa ai đặt nó xuống |
| `NEON` | **`SPOTLIGHT`** — Đèn Quét | Một **dải ô** bị đèn quét qua. Ai đứng trong dải đó ở lượt sau bị **chỉ mặt**: mọi zombie đổi mục tiêu về đó, và nó **nhận thêm 1 sát thương mỗi đòn**. Không gây sát thương trực tiếp. | Dùng chung `TAUNTED`/`tauntedBy` với Thornhide và với Ánh Đèn của Headliner |
| `RUIN` | **`COLLAPSE`** — Sập Nhà | 2 ô đánh dấu: lượt sau **3 sát thương** lên thứ đứng đó, rồi ô **hoá `WALL` vĩnh viễn**. Bàn cờ co lại suốt trận | `MODIFY_TERRAIN` + `APPLY_DAMAGE`, cả hai đã có |
| `GRID` | **`SURGE`** — Quá Tải Lưới | **Mọi ô `POWER_TILE`** phóng điện: 1 sát thương + `STUN` lên thứ đứng trên, và **lan sang đơn vị kề ô đó**. | `POWER_TILE` đã có; phần lan dùng chung code với luật ĐIỆN |

### Vì sao năm cái này chứ không phải năm cái khác

Mỗi hazard phải **hỏi một câu khác nhau về vị trí**, nếu không nó chỉ là sát thương ngẫu nhiên:

| Hazard | Câu hỏi nó đặt ra |
|---|---|
| Wind Gust | *đứng chỗ nào thì bị thổi vào chỗ tốt?* — dịch chuyển |
| Lava Flow | *ô nào sắp thành không đứng được?* — cấm địa |
| Runaway Cart | *ai đang trên đường ray?* — hành lang |
| **Tide** | *bờ biển hôm nay ở đâu?* — **cấm địa có nhịp**, và là bẫy chết chứ không phải bẫy đau |
| **Dust Veil** | *ai sắp mất đòn đánh?* — **tắt hoả lực**, không đụng tới máu |
| **Spotlight** | *ai sắp trở thành cái đích?* — **đổi mục tiêu**, không đụng tới máu lẫn địa hình |
| **Collapse** | *ô nào sắp biến mất khỏi bàn cờ?* — **thu hẹp sân**, hiệu ứng duy nhất **không hoàn tác được** |
| **Surge** | *đội hình có ai đứng cạnh ai không?* — **phạt việc tụ lại**, dọn đường cho Voltmaw |

`Surge`, `Tide` và `Collapse` là ba cái **thay đổi cách chơi nhiều nhất**. `Collapse` đặc biệt:
nó là hazard duy nhất **để lại dấu vĩnh viễn** — hết trận thì bàn cờ đã khác lúc bắt đầu. Đó là
lý do nó thuộc về Old Quarter chứ không thuộc về đâu khác, và là lý do Clockjaw đứng ở đó.

---

## 3. Bàn chơi thường — mười hai bàn mới

Legend giữ nguyên của `data/maps.ts`, **thêm đúng hai ký tự**:

```
':'  →  'ICE'        (Ice Sheet — đã có trong DEFAULT_TERRAIN_DEFS, chưa có ký tự bản đồ)
'c'  →  'CONCRETE'   (mặt đường — cũng đã có sẵn, hiện chỉ 'H' dùng tới)
```

Không cần ký tự nào khác: `COAST` dùng `~`/`=` đã có, `THORN` dùng `^`, `NEON`/`RUIN` dùng
`#` + `c`, `GRID` dùng `*`.

> **⚠ Bê tông làm hỏng một objective, âm thầm.** `buildMission` chọn ô cho `HOLD_TILE` bằng
> `t.terrain === 'GRASS'` ([missions.ts:48](data/missions.ts)). Bàn thành phố gần như không có ô
> `GRASS` nào ngoài D/S, bàn băng cũng vậy — nên `HOLD_TILE` sẽ **lặng lẽ rơi về `SURVIVE_TURNS`**
> ở năm vùng mới. Sửa: đổi điều kiện thành "đi được và không phải `LAVA`", đọc từ `terrainDefs`.
> Một dòng, nhưng không sửa thì một phần ba số node ở stage II–III mất objective.

### COAST — Windward

Nước không còn là chướng ngại ở rìa bàn cờ; **nước là vũ khí**, và đây là vùng thả Chardwall ra.

```
coast_tide_line — "Ngấn Triều"
Một dải nước dọc chia đôi bàn cờ, hai cây cầu lệch nhau.
Hất một ô là xuống biển; hazard Thuỷ Triều nới dải đó rộng thêm mỗi ba lượt.

    H.DD~..S
    ..DD~.SS
    ..DD=..S
    H.DD~.SS
    ..DD~..S
    ..DD=.SS
    H.DD~..S
    ..DD~.SS
```

```
coast_broken_pier — "Cầu Tàu Gãy"
Nước rời rạc thành vũng, không thành tuyến. Không có hành lang nào để chốt —
phải chọn từng con mà hất, không hất được cả hàng.

    .HDD.~.S
    ..DD.~SS
    ..DD=..S
    ..DD.~.S
    .HDD.~SS
    ..DD...S
    ..DD~~SS
    .HDD~..S
```

### THORN — Thornwaste

Cát trống với những khối đá rời. **Đá là chỗ Sandreaver không trồi lên được** — đó là toàn bộ
ngữ pháp chiến thuật của vùng này, và nó dạy trước khi con trùm bắt bài.

```
thorn_spine_flats — "Đồng Gai"
Đá rải đều, không cụm nào che quá hai ô. Đứng cạnh đá thì an toàn một phía,
nhưng cũng mất một hướng để rút.

    H.DD..^S
    ..DD.^SS
    ..DD...S
    .HDD^..S
    ..DD..SS
    ..DD^^.S
    H.DD...S
    ..DD.^SS
```

```
thorn_the_sinks — "Vùng Sụt"
Hai cụm đá lớn ở trên và dưới, giữa trống hoác. Hành lang an toàn duy nhất
là chỗ Màn Cát hay phủ xuống nhất.

    .HDD...S
    ..DD^..S
    ..DD^.SS
    H.DD...S
    ..DD.^^S
    ..DD...S
    .HDD^..S
    ..DD..SS
```

### ICE — Frostgate

```
ice_glacier_steps — "Bậc Băng"
Băng thành từng bậc lệch. Wind Gust thổi dọc trục trận đấu, nên bậc băng
biến một cú thổi thành hai ô trượt.

    H.DD::.S
    ..DD:.SS
    ..DD...S
    .HDD::.S
    ..DD:.SS
    ..DD...S
    H.DD::.S
    ..DD..SS
```

```
ice_frozen_lake — "Hồ Đóng Băng"
Băng sát nước. Bị thổi trên băng thì trượt, trượt hết băng thì xuống nước.
Bàn nguy hiểm nhất của cả game với chính đội của bạn.

    .HDD:~.S
    ..DD:~SS
    ..DD::.S
    H.DD:~.S
    ..DD:~SS
    ..DD::.S
    .HDD:~.S
    ..DD..SS
```

> **Luật trượt băng chưa được cài.** `DEFAULT_TERRAIN_DEFS.ICE` ghi *"Slippery! Units slide"*
> nhưng không có code nào đọc nó. Nếu không muốn viết luật trượt thì `ICE` chỉ còn là màu sắc —
> chấp nhận được cho bản đầu, nhưng khi đó **bỏ `ice_frozen_lake`**, vì cả ý đồ của bàn đó nằm ở
> chuỗi *thổi → trượt → chết đuối*.

### NEON — Neon Rose *(thành phố còn điện)*

Toà nhà **nguyên vẹn**, xếp thẳng hàng: bàn cờ đọc được, hành lang đều, và mặt đường bê tông
chạy suốt từ trên xuống dưới. Biển hiệu neon (`*` = `POWER_TILE`, +1 sát thương) là **phần
thưởng thật** — thành phố còn điện thì điện đó dùng được. Nhưng cũng chính vì còn điện mà đèn
quét còn quay.

```
neon_boulevard — "Đại Lộ"
Một trục bê tông dọc suốt bàn cờ, các khối nhà chặn phía sau nó.
Đám đông buộc phải đi trên đại lộ — đúng hình hàng dọc mà một mũi gai xuyên qua hết.

    H.DDc#.S
    ..DDc#SS
    ..DDc..S
    .HDDc#.S
    ..DDc#SS
    ..DDc..S
    H.DDc#.S
    ..DDc.SS
```

```
neon_marquee — "Rạp Hát"
Ba biển hiệu neon nằm đúng trên trục bê tông: ba ô +1 sát thương,
và ba ô mà Đèn Quét thích chiếu vào nhất. Phần thưởng và cái bẫy là cùng một ô.

    .HDDc*.S
    ..DDc#SS
    ..DDc..S
    H.DDc*.S
    ..DDc#SS
    ..DDc..S
    .HDDc*.S
    ..DDc.SS
```

### RUIN — Old Quarter *(đã bị đánh, đổ nát)*

Cùng thành phố đó, sau khi mọi thứ đi qua. **Không một ô điện nào** — đèn tắt hết. Gạch vụn
(`#`) rải lệch chứ không thành hàng, nên **không có tuyến nào thẳng**: bàn cờ trông như một
`neon_boulevard` bị đập vỡ, và đó chính là ý.

Hazard Sập Nhà biến thêm ô thành gạch vụn mỗi ba lượt, **vĩnh viễn**. Nghĩa là bàn cờ ở lượt 7
chật hơn hẳn bàn cờ ở lượt 1 — và đó là toàn bộ lý do một con trùm đánh hai lần mỗi lượt đứng ở
vùng này.

```
ruin_collapsed_row — "Dãy Sập"
Dấu tích của một dãy nhà: cứ một ô còn một ô sập, lệch nhau.
Mọi tuyến đi đều phải rẽ, không tuyến nào chốt được trọn.

    H.DD#c.S
    ..DDc.SS
    ..DD#c.S
    .HDDc..S
    ..DD#c.S
    ..DDc.SS
    H.DD#c.S
    ..DDc..S
```

```
ruin_ash_yard — "Sân Tro"
Hai khối đổ nát lớn chặn ngang, giữa là sân trống.
Sân trống là chỗ duy nhất đánh nhau được — và cũng là chỗ mái nhà rơi xuống.

    .HDDc..S
    ..DD##.S
    ..DDc.SS
    H.DDc..S
    ..DD##.S
    ..DDc.SS
    .HDDc..S
    ..DDc.SS
```

### GRID — The Grid

Ô điện (`*` → `POWER_TILE`, +1 sát thương) vừa là **phần thưởng** vừa là **cái bẫy**: hazard
Quá Tải biến chính những ô đó thành nguồn giật.

```
grid_substation — "Trạm Biến Áp"
Ô điện rải rác, không ô nào kề ô nào. Đứng lên thì mạnh hơn,
nhưng cứ ba lượt lại phải rời đi.

    H.DD*..S
    ..DD..SS
    ..DD*..S
    .HDD..*S
    ..DD...S
    ..DD*.SS
    H.DD...S
    ..DD*.SS
```

```
grid_live_rails — "Đường Dây Sống"
Ô điện xếp thành hai cột liền mạch — cả một hàng phóng điện cùng lúc.
Cột tường ở giữa buộc phải đi qua một trong hai cột điện đó.

    .HDD.*.S
    ..DD.*SS
    ..DD.*.S
    H.DD#..S
    ..DD#.SS
    ..DD.*.S
    .HDD.*.S
    ..DD.*SS
```

---

## 3b. Pool mở rộng — 18 bàn nữa, ba bàn mỗi vùng

Hai bàn một vùng đủ để chứng minh ý đồ, không đủ để chơi mười layer mà không thấy lặp. Mục này
đưa sáu vùng mới lên **năm bàn mỗi vùng** (2 ở mục 3 + 3 dưới đây) — tổng **30 bàn thường**.

Cả 18 bàn đã qua **cùng bộ luật của `assertTemplate`**, chạy kiểm lại độc lập: 8×8 · ký tự hợp
legend · có H/D/S · không có hai nhà kề chéo · mọi nhà tới được từ ô spawn. **18/18 hợp lệ**,
cộng các phép đo riêng của từng vùng ghi bên dưới.

### COAST — Windward

```
coast_the_causeway — "The Causeway"
One strip of dry land crosses the bay, two tiles wide — everything on both sides has to walk it.

Mọi thứ dồn vào hai hàng giữa. Chardwall đứng trên đường đắp, hất 2 ô là ra biển — mỗi cú hất
một mạng trọn vẹn. Thuỷ Triều vặn ngược lại: ô bờ của đường đắp chính là ô bạn đang đứng.

    H.DD~~.S
    ..DD~~SS
    .HDD~~.S
    ..DD...S
    ..DD..SS
    H.DD~~.S
    ..DD~~SS
    .HDD~~.S
```

```
coast_lee_shore — "Lee Shore"
The sea sits behind the houses. The only drowning shove is the one that sends them the way
they wanted to go.

Biển nằm SAU LƯNG nhà, nên cú đẩy giết người là cú đẩy về phía tây — đúng hướng zombie muốn đi.
Bàn duy nhất trong pool bắt người chơi đẩy địch về phía não của chính mình.

    ~.DD...S
    ~.DD..SS
    ~HDD.~.S
    ~.DD.~.S
    ~.DD..SS
    ~HDD...S
    ~.DD..SS
    ~HDD...S
```

```
coast_estuary_mouth — "Estuary Mouth"
A river mouth fans wide at the spawn and pinches to nothing inland — the sea is worth a whole
kill on turn one and nothing on turn seven.

Giá trị một cú đẩy giảm dần theo lượt: hất sớm đổi được một mạng, hất muộn chỉ mua thời gian.
Cái nêm nước chọc tới tận hàng 3 nên không còn tuyến thẳng nào để chốt.

    H.DD..SS
    ..DD..~S
    ..DD.~~S
    .HDD~~~S
    ..DD.~~S
    H.DD..~S
    ..DD..SS
    .HDD..SS
```

### THORN — Thornwaste

Ba bàn phủ ba mật độ đá — **9 / 6 / 3 khối `^`** — vì số khối đá là núm vặn độ khó thật của
vùng: đá là ô duy nhất Sandreaver không trồi lên được.

```
thorn_stone_pens — "Stone Pens"                    (9 đá — mức dạy luật)
Rock alcoves with one mouth each — cover for everybody, and nobody left able to cover anybody.

Ba hốc đá, mỗi hốc một cửa. An toàn — nhưng `^` chặn cả đạn, nên ba người an toàn ở ba nơi và
không ai bắn đỡ cho ai được. Một đám Màn Cát đặt đúng cửa hốc là mất cả đòn đánh lẫn đường ra.

    H.DD...S
    ..DD^.^S
    ..DD.^.S
    H.DD...S
    ..DD.^.S
    ..DD^.^S
    H.DD..^S
    ..DD^.^S
```

```
thorn_leeward_shelf — "Leeward Shelf"              (6 đá — mức vừa)
The only rock sits a step from the spawn line — stand safe, or stand between the zombies and
the brains.

Đá dồn hết vào cột 5–6, tức sát cột spawn; nửa sân phía nhà trống trơn. Câu hỏi không phải
"đứng đâu cho an toàn" mà "an toàn đáng bao nhiêu ô đường về".

    .HDD...S
    ..DD..^S
    H.DD.^^S
    ..DD...S
    ..DD...S
    H.DD.^^S
    ..DD..^S
    .HDD...S
```

```
thorn_lone_shade — "Lone Shade"                    (3 đá — mức tổng duyệt)
One nook of rock in the whole waste, and it shades the top house only.

Đúng một ô Sandreaver không với tới, và nó chỉ che được cái nhà trên cùng. Đây là bản tổng
duyệt của `arena_sandreaver`: ai được ngồi đá, và hai người kia sống bằng cách không bao giờ
kết thúc lượt đứng chụm — đòn Trồi Lên nổ ra cả bốn ô kề.

    H.DD.^.S
    ..DD..^S
    ..DD.^.S
    H.DD...S
    ..DD...S
    .HDD...S
    ..DD...S
    H.DD...S
```

### ICE — Frostgate

Cả ba bàn **cố ý không có nước**: chuỗi *thổi → trượt → chết đuối* đã thuộc về `ice_frozen_lake`,
nên ở đây rủi ro tự sát dừng ở va chạm và mất não, không ở chết đuối.

> **Ba dữ kiện về `WIND_GUST` mà ba bàn này dựa vào — đã đối chiếu với code:** cú thổi **đẩy dây
> chuyền tới 3 thân**, mọi thân trong đống va chạm **ăn 1 sát thương**, và **địch bị thổi vào nhà
> còn não thì lấy não luôn** (`planPush` → `tookBrain`). Cờ `front.isEnemy` ngay cạnh đó là lý do
> cây bị thổi vào nhà thì KHÔNG ăn não — và đó là bản lề của `ice_the_doorstep`.

```
ice_frost_teeth — "Frost Teeth"
Rock teeth stud the ice at uneven heights — a gust that would move a body slams it into stone
instead.

Mỗi mỏm đá chặn gió cho CẢ hai hướng thổi: đứng đúng chỗ thì cú gust thành 1 sát thương va chạm
miễn phí lên đám marcher, thay vì đẩy chúng tiến thêm một ô.

    H.DD:^.S
    ..DD::SS
    ..DD.^.S
    .HDD::.S
    ..DD:^SS
    ..DD::.S
    H.DD.^.S
    ..DD::SS
```

```
ice_serac_lanes — "Serac Lanes"
Ice seracs cut the field into long lanes; the wind runs their length with nothing to stop it.

Bàn ngược của Frost Teeth: không gì chặn gió, cú thổi dịch cả làn một ô và dồn thân người thành
đống. Đổi làn giữa vùng giao tranh tốn nguyên một lượt, nên chọn làn là chọn cả trận.

    .HDD::.S
    ..DD::SS
    ..DD###S
    H.DD::.S
    ..DD::SS
    ..DD###S
    .HDD::.S
    ..DD::SS
```

```
ice_the_doorstep — "Doorstep"
Open ice runs straight to two doorsteps; the middle door has a rock against it, the others
have only you.

Nhà trên và nhà dưới mở thẳng ra băng: một cú gust thổi về phía nhà là marcher đứng cạnh **lấy
não mà không cần đánh**. Phản đòn là cắm cây lên thềm bê tông — cú thổi đẩy cây vào nhà, và cây
không ăn não được.

    HcDD:::S
    .cDD::SS
    ..DD:::S
    H^DD:::S
    .^DD::SS
    ..DD:::S
    HcDD:::S
    .cDD::SS
```

### NEON — Neon Rose

```
neon_city_block — "City Block"
Two intact blocks with a ring street around them — every way in runs through one of four lit
mouths.

Bốn cửa vào, và **bốn cửa đó chính là bốn ô điện** — vừa +1 sát thương vừa là chỗ Đèn Quét thích
chiếu nhất. Hai hàng giữa bị chặn cả hai đầu nên đám đông dồn xuống hai hàng ngang: đúng hình
hàng dọc mà Thornquill đọc được.

    H.DDc#cS
    ..DDc#cS
    ..DD*c*S
    .HDD#c#S
    ..DD#c#S
    ..DD*c*S
    H.DDc#cS
    ..DDc#cS
```

```
neon_rose_plaza — "Rose Plaza"
A walled square where the crowd collects, and two clean streets down the edges where it does not.

Quảng trường giữa bàn là chỗ duy nhất đánh nhau tử tế, nhưng hai hàng biên là phố thẳng chạy
thẳng vào ba nhà. Quảng trường không có lấy một ô nấp — đúng khoảng trống The Headliner cần để
Gọi Dàn Nhảy tràn vào.

    H.DDcccS
    ..DD###S
    ..DDc*cS
    .HDD..cS
    ..DDc..S
    H.DDc*cS
    ..DD###S
    H.DDcccS
```

```
neon_colonnade — "The Colonnade"
One pillar per row, evenly spaced — nothing is ever closed off, and no line ever runs the whole
way.

Bàn NEON duy nhất **không có chỗ nghẽn nào**: mỗi hàng đúng một cột trụ, ở y4/y5/y6 tuỳ hàng.
Phải chọn hàng chứ không chọn cửa — và cột trụ cũng là chỗ duy nhất né được ánh đèn sau khi đã
bị chỉ mặt.

    H.DD#ccS
    ..DD*#cS
    .HDDcc#S
    ..DD#c*S
    H.DDc#cS
    ..DD*c#S
    .HDD#ccS
    ..DDc#*S
```

### RUIN — Old Quarter

Không bàn nào có ô điện — luật cứng của vùng, đã kiểm bằng máy.

```
ruin_fault_line — "Fault Line"
A rubble seam slants down the board with breaks at uneven heights — no two approaches cross at
the same place.

Vết sạt là một bậc thang lệch, ba khe hở ở hàng 2, 5 và 7: tuyến trên ngắn, tuyến dưới vòng xa,
không tuyến nào thẳng. Với Clockjaw đánh hai lần một lượt, ba khe lệch nghĩa là không có vòng
nào kite được trọn.

    .HDDc.#S
    ..DDc.#S
    ..DD.c.S
    H.DD.#cS
    ..DD.#.S
    ..DDc..S
    H.DD#c.S
    ..DDc.SS
```

```
ruin_stagger — "The Stagger"
The rubble piles up against the spawn side in offset clumps, so the march arrives in ragged
waves instead of one line.

Gạch vụn nằm sát cột spawn và so le giữa cột 5 với cột 6, nên mỗi zombie mất một bước lệch khác
nhau và đám đông tới rời rạc. Bàn hỏi "chốt hoả lực ở đâu khi không đợt nào tới cùng lúc".

    ..DDc#.S
    .HDD..#S
    ..DDc#.S
    ..DD..cS
    H.DD.c.S
    ..DDc.#S
    ..DD.#.S
    .HDDc..S
```

```
ruin_last_tenement — "Last Tenement"        ⚠ bàn hung hãn nhất pool — xem cảnh báo dưới
One house still standing out in the debris field, rubble on its shoulder — the first thing the
march walks into.

Một căn nhà bị đẩy hẳn ra GIỮA bàn ở (3,4), gạch vụn che một vai nên nó chỉ hở ba mặt. Bàn hỏi
"cứu cái nhà lộ thiên hay bỏ nó để giữ ba nhà sau" — và đó cũng là ô mà khiên của Gourdward có
nghĩa nhất.

    ..DDc.SS
    .HDD.#.S
    ..DD#c.S
    ..DDH..S
    ..DD.c#S
    H.DD#..S
    ..DDc.#S
    .HDD.c.S
```

> **Hai cảnh báo trên `ruin_last_tenement` — cả hai đo được, không phải cảm giác:**
>
> 1. **Nhà (3,4) cách ô spawn đúng 3 ô.** `aiLogic.findGoal` chọn nhà có não GẦN NHẤT theo
>    Manhattan, nên mọi zombie ở nửa dưới bàn cờ bỏ ba nhà kia mà lao vào đúng nó — nó là cột thu
>    lôi. Một zombie di chuyển 3 đứng kề nó ngay lượt 1, và lấy não ở lượt 2 nếu không ai chắn.
>    Có thể đó chính là ý đồ ("bỏ hay giữ"), nhưng đây là bàn duy nhất trong 30 bàn có thể mất
>    một não ở lượt 2 — **phải chơi thử trước khi ship**.
> 2. **Sập Nhà bịt ô (6,1) + (7,2) thì nhà (7,1) không còn đường tới.** 1 cặp trong 1.485 cặp
>    (~0,07%); hai bàn RUIN kia sạch tuyệt đối (0/1.540 mỗi bàn). Hệ quả không phải "ván không
>    thắng nổi" mà ngược lại — cái não đó thành bất khả xâm phạm và đám zombie nhắm vào nó đứng
>    dậm chân tại chỗ. Vẫn phải vá, bằng đúng cái chặn đã ghi ở rủi ro số 5: `planHazard` không
>    được chọn ô là đường nối duy nhất.

### GRID — The Grid

Ba bàn phủ ba mức "nổ dây chuyền" của Quá Tải Lưới, đo bằng số ô điện và số cặp ô điện kề nhau
— vì `SURGE` bắn **mọi** ô `*` cùng một lúc:

| Bàn | ô điện | cặp kề 4 hướng | nghĩa là |
|---|---|---|---|
| `grid_meter_row` | 3 | **0** | bẫy đặt đúng chỗ, không nổ lan |
| `grid_stepdown` | 6 | **0** *(nhưng 4 cặp kề chéo)* | bẫy chồng ở khe giữa hai bậc |
| `grid_ring_main` | 8 | **8** | cả một vùng nổ cùng lúc |

```
grid_meter_row — "Meter Row"
One live tile on every doorstep — the best firing line on the board is the one square the grid
never lets go of.

Ba ô điện nằm ngay cạnh ba căn nhà: chỗ bắn dọc hàng ngon nhất bàn cờ, và cũng là chỗ ai cũng
phải đứng để giữ não. Với Voltmaw thì đó là ba ô nó với tới bất kể khoảng cách — tuyến phòng thủ
quen thuộc nhất lại là tuyến nó nhắm đầu tiên.

    H*DD...S
    ..DD.#SS
    ..DD...S
    H*DD..SS
    ..DD.#.S
    ..DD..SS
    H*DD...S
    ..DD.#SS
```

```
grid_stepdown — "Stepdown"
Two staircases of live tiles. No two touch — but every square beside a step is wired to two of
them.

Không ô điện nào kề ô nào theo 4 hướng, nên nhìn qua tưởng an toàn như `grid_substation`. Nhưng
chúng xếp chéo thành hai bậc thang, và chín ô thường nằm kề ít nhất hai ô điện: đứng vào đó là
ăn splash chồng.

    H.DD*..S
    ..DD.*.S
    .HDD..*S
    ..DD..SS
    ..DD..*S
    H.DD.*.S
    ..DD*..S
    .HDD..SS
```

```
grid_ring_main — "Ring Main"
A closed ring of live tiles around one dry square — the quietest tile on the board is wired on
all four sides.

Vòng điện khép kín là một cụm liền mạch 8 ô, nên Quá Tải biến cả khu giữa bàn cờ thành một quả
nổ duy nhất. Ô khô ở tâm vòng là ô thường duy nhất kề **bốn** ô điện cùng lúc — chỗ trú ẩn hiển
nhiên lại là chỗ chết nhất.

    .HDD...S
    ..DD.#SS
    H.DD***S
    ..DD*.*S
    ..DD***S
    H.DD..SS
    ..DD.#.S
    .HDD..SS
```

---

## 4. Sân đấu trùm — chín bàn riêng

Hiện `pickTemplate(world)` bốc ngẫu nhiên trong pool của vùng, kể cả cho node `BOSS`. Điều đó
làm hỏng mọi con trùm dưới đây: **cơ chế của trùm chỉ có nghĩa trên đúng địa hình của nó**
(Ironcart cần đường ray, The Armada cần biển, Voltmaw cần ô điện).

Cần thêm hai trường vào `MapTemplate`:

```ts
/** Bàn này chỉ dùng cho trận trùm — không bao giờ rơi vào node BATTLE/ELITE. */
arenaFor?: BossId;
/** Bàn không có ô nhà: luật não tự tắt (turnManager đã chặn bằng `length > 0`). */
noHouses?: boolean;
```

…và `pickTemplate` lọc `arenaFor` ra khỏi pool thường, `pickArena(bossId)` bốc riêng.
`assertTemplate` cần bỏ qua luật *"phải có H"* khi `noHouses` — đó là điều kiện tiên quyết của
màn cuối (`PLAN-progression.md` mục 7).

| Trùm | Sân | Ý đồ địa hình |
|---|---|---|
| Gargantuar | `arena_gargantuar` | Trống trơn. Không có gì để né sau — chỉ có việc dồn sát thương |
| Ironcart | `arena_ironcart` | Ba tuyến ray chạy suốt: nó đi đâu cũng được, bạn thì không |
| Cinder Colossus | `arena_cinder` | Dung nham mồi sẵn — nó sẽ nối chúng lại thành tường lửa |
| The Armada | `arena_armada` | Biển hai bên sườn: chỗ để **hất xác nó xuống** sau khi bắn rụng |
| Sandreaver | `arena_sandreaver` | Đá rời rác — ô an toàn duy nhất, và không đủ cho ba người |
| Yeti | `arena_yeti` | Băng phủ gần kín: đứng đâu cũng trượt được |
| The Headliner | `arena_headliner` | **Hai cột spawn kín** trên một đại lộ — đám đông là con trùm thật |
| Clockjaw | `arena_clockjaw` | Hẻm gạch vụn, và Sập Nhà bóp nó hẹp thêm mỗi ba lượt |
| Voltmaw | `arena_voltmaw` | Bốn cặp ô điện — bàn cờ chính là mạch điện của nó |

```
arena_gargantuar                    arena_ironcart                     arena_cinder
    H.DD...S                            H.DDTTTS                           H.DD.L.S
    ..DD...S                            ..DD...S                           ..DDL..S
    ..DD..SS                            ..DD..SS                           ..DD..SS
    .HDD...S                            .HDDTTTS                           .HDD.L.S
    ..DD...S                            ..DD...S                           ..DDL..S
    ..DD..SS                            ..DD..SS                           ..DD..SS
    H.DD...S                            H.DDTTTS                           H.DD.L.S
    ..DD...S                            ..DD...S                           ..DD...S

arena_armada                        arena_sandreaver                   arena_yeti
    H.DD~~.S                            H.DD^..S                           H.DD::.S
    ..DD~..S                            ..DD...S                           ..DD::.S
    ..DD..SS                            ..DD.^SS                           ..DD::SS
    .HDD~~.S                            .HDD...S                           .HDD::.S
    ..DD~..S                            ..DD^..S                           ..DD::.S
    ..DD..SS                            ..DD..SS                           ..DD::SS
    H.DD~~.S                            H.DD.^.S                           H.DD::.S
    ..DD...S                            ..DD...S                           ..DD::.S

arena_headliner  (NEON)             arena_clockjaw  (RUIN)             arena_voltmaw
    H.DDc.SS                            H.DD#c.S                           H.DD*.*S
    ..DDc.SS                            ..DDc..S                           ..DD...S
    ..DD*.SS                            ..DD#cSS                           ..DD*.*S
    .HDDc.SS                            .HDDc..S                           .HDD...S
    ..DDc.SS                            ..DD#c.S                           ..DD*.*S
    ..DD*.SS                            ..DDc..S                           ..DD...S
    H.DDc.SS                            H.DD#cSS                           H.DD*.*S
    ..DDc.SS                            ..DDc..S                           ..DD...S
```

`arena_headliner` là đại lộ mở với **hai cột spawn kín** — sân khấu, và khán giả tràn vào từ
hai bên. `arena_clockjaw` bắt đầu đã chật, và Sập Nhà đóng thêm hai ô mỗi ba lượt: đến lượt 6
thì không còn chỗ nào để lùi. Đó là cách địa hình nói hộ cơ chế của con trùm.

### Sân màn cuối — 6×6, không nhà

`PLAN-progression.md` mục 7 đã chốt: **map không ô nhà + mission `KILL_ALL` = trận đấu trùm
thuần**. Sân rush nhỏ hơn để mỗi trận gọn 4–5 lượt thay vì 7.

```
arena_breach — 6×6, noHouses: true      (cần assertTemplate chấp nhận bàn không H,
    ..DD..                               và materializeTemplate chấp nhận kích thước ≠ 8;
    .DD..S                               GRID_SIZE đang là hằng số toàn cục — xem mục 8)
    .DD..S
    .DD..S
    .DD..S
    ..DD..
```

---

## 5. Chín con trùm

Nguyên tắc giữ nguyên từ `PLAN-progression.md`: **trùm là mối đe doạ, phần thưởng là câu trả
lời cho chính nó.** Thêm ba luật tự đặt cho file này:

1. **Một con trùm = một giả định bị phá.** Không con nào "giống con trước nhưng nhiều máu hơn".
2. **Mọi thứ trùm làm đều telegraph trọn một lượt.** Không ngoại lệ — kể cả pha hai.
3. **Đổi pha ở 50% máu, và phải nhìn thấy được.** Người chơi phải đọc ra "nó vừa đổi luật".

---

### I-1 · **Gargantuar** — *Verdant Reach* — `GARGANTUAR` ✅ *(chạy được, cả pha 2)*

| Máu | Sát thương | Di chuyển | Tầm | Miễn nhiễm | |
|---|---|---|---|---|---|
| **16** | 5 | 2 | 1 | `PUSH`, `FREEZE` | `isMassive` |

**Đặc điểm — Không đẩy nổi.** Mọi công cụ khống chế của đội khởi đầu (đẩy 1 ô của Ironhusk,
choáng) đều trượt qua nó. Giả định bị phá: *"chặn được là an toàn"*.

| Kỹ năng | Telegraph | Hiệu ứng |
|---|---|---|
| **Nghiền** | ô mục tiêu đỏ, ghi 5 | 5 sát thương cận chiến. Trên nền máu mới (mục 6) nó **để hero mỏng nhất còn đúng 1 máu** — và vẫn giết đứt hero mang element |
| **Ném Imp** | ô đáp sáng, "Throwing Imp!" | Sinh một Imp (1 máu, di chuyển 4) **sau lưng tuyến**. Chỉ ném khi mục tiêu gần nhất xa hơn 4 ô |

**Pha 2 (≤8 máu) — Giậm Đất.** Ném **hai** Imp một lượt, ở hai phía đối diện của tuyến.

**Cách phá:** không có cách nào ngăn cú Nghiền — chỉ có cách **không đứng ở đó**. Đây là con
trùm dạy người chơi đọc telegraph và bỏ vị trí. Nó là bài kiểm tra đầu tiên, nên nó phạt bằng
*gần chết* chứ không bằng *chết* — trừ khi bạn đã bán 2 máu tối đa để lấy element.

**Trả về: Maw** — cái mồm nuốt được thứ lớn. *(`Nuốt Chửng` không đụng được `isMassive` — đó là
cố ý: phần thưởng không phải là nút xoá con trùm vừa rồi, mà là công cụ xoá mọi thứ dày máu sau nó.)*

**Engine:** đã chạy. AI riêng nằm trong `aiLogic.ts` (`GARGANTUAR SPECIAL AI`). Chỉ cần thêm
pha 2 và objective `SLAY_BOSS`.

---

### I-2 · **Ironcart** — *Goldacre* — `CATAPULT_LORD` ✅ *(chạy được)*

> Tên hiển thị trong `data/unlocks.ts` đang là *"Catapult Lord"*, `PLAN-progression.md` gọi nó
> là *Ironcart*. **Giữ id `CATAPULT_LORD`, đổi `name` thành `Ironcart`** — id đã nằm trong save.

| Máu | Sát thương | Di chuyển | Tầm | Miễn nhiễm |
|---|---|---|---|---|
| **18** | 3 | 3 *(chỉ trên ray)* | **4** | `PUSH` |

**Đặc điểm — Chạy trên ray.** Nó **chỉ đi được trên ô `RAIL`**, nhưng trên ray thì đi 3 ô và
không ai chặn được (đẩy không ăn). Ba tuyến ray chạy suốt sân đấu, nên nó luôn có chỗ để lùi.
Giả định bị phá: *"đứng đúng chỗ là an toàn"* — tầm 4 phủ gần nửa bàn cờ.

| Kỹ năng | Telegraph | Hiệu ứng |
|---|---|---|
| **Nã Đạn** | ô mục tiêu **+ 4 ô kề** đỏ | 3 sát thương lên ô chính, 1 lên bốn ô kề. Không cần đường thẳng — đạn bay vòng |
| **Lùi Ray** | mũi tên dọc ray | Chạy 3 ô dọc ray **sau khi bắn**. Nó không bao giờ ở chỗ bạn định đánh |

**Pha 2 (≤9 máu) — Nạp Kép.** Nã hai ô cùng lượt, mỗi ô 2 sát thương. Sát thương tổng tăng,
nhưng mỗi phát hết giết được hero — **đổi từ đe doạ mạng sang đe doạ đội hình**.

**Cách phá:** cắt ray. Đứng lên ô ray phía trước nó thì nó **không lùi qua được** (ô có quân
không đi qua). Hazard Runaway Cart của chính vùng đó cũng kéo nó — kéo về phía nhà, tức là về
phía bạn. Con trùm này dạy dùng hazard làm vũ khí.

**Trả về: Cobb** — khẩu cối bắn vòng, `LOB 2`. Cả act bị nã từ xa bằng đạn cong; giờ bạn có cái
duy nhất trong bộ chín người bắn được qua đầu tường nhà mình.

> **Đã dựng tới đâu:** unit (18 máu, 3 sát thương, tầm 4, miễn `PUSH`, `movementType: 'RAIL'`),
> **Nã Đạn** 3 ở tâm + 1 lên bốn ô kề (dùng `Intent.blast` chứ không đẻ cơ chế mới), và **Lùi Ray**.
>
> **`RAIL` là dây xích, không phải nâng cấp** — và điểm tinh tế là nó **chỉ siết khi unit đang
> ĐỨNG trên ray** (`isRailBound`). Ngoài ray nó đi bộ như mọi thứ khác, nếu không thì bốn trong
> mười ô spawn của sân đấu không kề ray sẽ biến nó thành pho tượng ngay lượt một.
>
> Luật phải cắm ở **hai** chỗ, không phải một: `isTilePassable` (đường `findPath` vẽ ra) **và**
> hàm `reachable()` riêng trong PHASE 4 — PHASE 4 không gọi `findPath`, nó tự tìm. Chỉ sửa một
> chỗ thì telegraph một đằng, bước chân một nẻo.
>
> **Sửa luôn sân đấu.** Bản cũ *(tôi viết)* chỉ có ba đoạn ray cụt 3 ô nằm hết ở nửa sân địch:
> `moveRange: 3` chưa bao giờ dùng hết một lượt, "Lùi Ray" không có chỗ lùi, và **cắt ray không
> tốn gì** vì người chơi không đứng lên được. Nay ray chạy `y=2..6`, chạm cột triển khai — nên
> chặn ray là một quyết định về vị trí. Ray vẫn dừng trước cột nhà, nó không bao giờ tới cửa.
>
> Đo thật: đứng sát hero → **lùi từ khoảng cách 0 lên 3**; đã ở cuối ray → **đứng yên** (đã xa
> nhất mà vẫn bắn tới); **cắm một cây lên ray ở giữa → đường lùi bị cắt, chỉ lùi được 1 ô**. Ô kề
> không phải ray thì bị chặn.
>
> ⚠ **Cách phá ghi ở trên là SAI so với code:** hazard Xe Goòng không bao giờ kéo được Ironcart,
> vì `turnManager` bỏ qua unit miễn `PUSH`. Tương tác thật đang tồn tại thì hay hơn: **đứng lên
> ray để cắt đường nó thì chính bạn bị xe goòng lôi mỗi ba lượt**. Đó vẫn là "dạy dùng hazard",
> chỉ là ở phía bên kia.

---

### I-3 · **Cinder Colossus** — *Kiln Row* — `CINDER_COLOSSUS` ✅ *(chạy được)*

| Máu | Sát thương | Di chuyển | Tầm | Miễn nhiễm |
|---|---|---|---|---|
| **20** | 3 | 2 | 1 | `BURN`, `FREEZE` |

**Đặc điểm — Vết Nung.** Mọi ô nó **bước qua** đều hoá `LAVA` vĩnh viễn. Và khi nó **đứng cạnh
ít nhất 2 ô lava**, nó **hồi 1 máu mỗi lượt**. Giả định bị phá: *"bàn cờ là hằng số"* — sân đấu
tự co lại quanh bạn.

| Kỹ năng | Telegraph | Hiệu ứng |
|---|---|---|
| **Phun Tro** | `LINE 3` đỏ | 3 sát thương, và **ba ô đó thành `FIRE`** (`EnvironmentType.FIRE`: 2 dmg + cháy) |
| **Nứt Vỏ** | vòng tròn quanh nó | 2 sát thương lên **mọi ô kề**, đẩy 1 ô ra ngoài. Dùng khi có ≥2 quân đứng sát |

**Pha 2 (≤10 máu) — Lõi Hở.** Vỏ nứt: **mất miễn nhiễm `FREEZE`**, nhưng mỗi lượt tự lan lava
sang một ô kề dù không di chuyển. Đây là **cửa sổ** — thưởng cho người chơi biết để dành công cụ
khống chế tới pha hai.

**Cách phá:** đừng đuổi theo nó. Ép nó đi vòng bằng cách chốt hành lang, và **giữ nó xa lava của
chính nó** để cắt hồi máu. Ironhusk đẩy 1 ô lần đầu tiên trong game trở thành công cụ **kinh tế**
chứ không phải phòng thủ.

**Trả về: 🔥 ELEMENT LỬA** — luật cháy 1 sát thương/lượt cho mọi hero, giá −1 máu tối đa.
`PLAN-pack-6-emberwood.md` đã là tài liệu thiết kế cho luật này (ô lửa, `fireTurns`).

> **Đã dựng tới đâu:** unit (20 máu, 3 sát thương, miễn `BURN`+`FREEZE`, **không** `isMassive`),
> **vệt lava**, **hồi máu khi đứng cạnh ≥2 ô lava**, và **pha 2 nứt vỏ** (mất miễn `FREEZE` ở
> nửa máu, chỉ một lần). Nó **không có `plan` hook** — bản sắc của nó là vệt lửa, không phải
> quyết định, nên nó đi và cắn theo AI thường.
>
> Hai chi tiết chốt lúc dựng:
> - **Ô nó RỜI KHỎI mới cháy, không phải ô nó bước vào.** Ô bước vào là chỗ người chơi sắp hất
>   nó tới; cho ô đó cháy là tính tiền cú hất hai lần.
> - **Hồi đúng 1 máu, và chỉ khi có ≥2 ô lava kề.** Đây không phải cuộc đua với thanh máu — nó
>   là lý do để tiêu một cú đẩy vào việc khác ngoài sát thương. Đẩy nó ra một ô là tắt vòi.
>
> **Engine đã có:** `MODIFY_TERRAIN` (dùng lại từ `LAVA_FLOW`) và `eventType: 'HEAL'` (đã nối
> dây sẵn trong `useGameEngine`, có chặn trần `maxHp`).

---

### II-1 · **The Armada** — *Windward* — `BALLOON_ARMADA` ✅ *(chạy được)*

| Máu | Sát thương | Di chuyển | Tầm | Miễn nhiễm |
|---|---|---|---|---|
| **22** | 2 | 3 | 2 | `DROWN` *(khi còn bay)*, `PUSH` *(khi còn bay)* |

**Đặc điểm — Ba khoang khí.** Nó là `FLYING`: tường, nước, thân quân — không thứ gì cản. Nhưng
nó mang **3 khoang khí**, và **mỗi lượt bị trúng đòn thì mất 1 khoang** *(mất 1 khoang mỗi lượt,
bất kể trúng mấy phát — nếu không thì Thornquill xuyên hàng bắn rụng nó trong một lượt)*.

**Khi hết khoang → nó rơi xuống ô đang đứng, thành `WALKING`, mất luôn miễn nhiễm `PUSH` và
`DROWN`.** Rơi trúng ô nước thì **chết ngay**.

Giả định bị phá: *"xây tường là đủ"*. Câu trả lời không phải là bắn nhiều hơn — mà là **bắn cho
nó xuống đất rồi hất nó ra biển**.

| Kỹ năng | Telegraph | Hiệu ứng |
|---|---|---|
| **Thả Bom** | ô mục tiêu + 4 ô kề | 2 sát thương diện. Bay qua đầu mọi thứ nên không có "chỗ trốn phía sau" |
| **Hạ Cánh Đội Hình** | hai ô đáp sáng | Thả **2 Balloon Zombie** *(đã có sẵn trong `data/zombies.ts`)* ngay sau tuyến của bạn |

**Pha 2 (rơi xuống đất) — Xác Tàu.** Di chuyển còn 1, sát thương lên 4, không thả quân nữa. Nó
biến từ *thứ không chạm được* thành *thứ chậm chạp và rất đau*. Và giờ nó đẩy được.

**Cách phá:** cả trận là hai bài toán nối nhau — **bắn rụng** rồi **đẩy xuống nước**. Sân đấu có
biển ở hai sườn đúng vì thế.

**Trả về: Chardwall** — 0 sát thương, đẩy 2 ô. Bạn vừa tự tay làm điều anh ta làm được mỗi lượt.

> **Đã dựng tới đâu:** unit (22 máu, `FLYING`, miễn `DROWN`+`PUSH` khi còn bay), **ba khoang
> khí**, **Thả Bom** (`blast` 5 ô), **Đổ Bộ** (2 Balloon Zombie sau lưng tuyến), và **cú rơi**.
>
> **Bộ đếm khoang đo bằng MỐC MÁU, không bằng cờ "đã bị đánh chưa".** Cờ thì phải có ai đó reset
> ở mọi đường đi mỗi lượt; sót một chỗ là tàu hoặc không bao giờ rơi hoặc rơi ngay. Mốc máu tự
> đúng — máu chỉ giảm, nên `hp < mark` chỉ đúng ở đúng những lượt có thứ gì lọt qua, **kể cả sát
> thương phát sinh trong lượt địch** (gai, spike, cháy, bom của chính lính nó) mà không cờ phía
> người chơi nào nhìn thấy.
>
> Đo thật: ba lượt bị đánh liên tiếp → 2 → 1 → 0 khoang rồi **rơi** (`WALKING`, move 1, dmg 4);
> **trúng hai phát trong một lượt vẫn chỉ mất một khoang**; lượt không bị đánh thì không mất gì.
> Rơi trúng ô nước → **chết đuối, trận kết thúc ngay** — dùng chung `survivesWater` với `planPush`,
> không có luật chết đuối thứ hai.
>
> Kèm một sửa engine chung: `onTurnEnd` giờ **được phép giết**. Hook không được mutate (caller sở
> hữu sim), nên `turnManager` tự đọc `UNIT_DIE` trong danh sách action trả về và hạ máu trong sim
> — nếu không thì `SLAY_BOSS` chấm thắng chậm mất trọn một lượt.

---

### II-2 · **Sandreaver** — *Thornwaste* — `SANDREAVER` ✅ *(chạy được)*

| Máu | Sát thương | Di chuyển | Tầm | Miễn nhiễm |
|---|---|---|---|---|
| **22** | 4 | 4 *(khi lặn)* | 1 | `PUSH` *(khi lặn)* |

**Đặc điểm — Lặn cát.** Nó luân phiên hai trạng thái, mỗi trạng thái trọn một lượt:

| Lượt | Trạng thái | |
|---|---|---|
| lẻ | **LẶN** — `isBurrowed`, **không thể bị nhắm tới**, di chuyển 4 xuyên qua mọi thứ | ô nó sẽ trồi lên **được đánh dấu ngay lúc lặn** |
| chẵn | **TRỒI** — hiện ra, 4 sát thương + đẩy 1 lên **cả bốn ô kề** | rồi lặn lại |

**Nó không trồi lên được dưới ô `MOUNTAIN`.** Đó là ô an toàn duy nhất trên sân — và sân chỉ có
ba khối đá, không đủ cho ba hero. Giả định bị phá: *"tuyến phòng thủ có mặt trước"*.

| Kỹ năng | Telegraph | Hiệu ứng |
|---|---|---|
| **Trồi Lên** | 4 ô kề của ô đánh dấu | 4 sát thương + đẩy 1 ra xa. Đây là đòn chính, không phải kỹ năng phụ |
| **Kéo Xuống Cát** | ô mục tiêu, biểu tượng xoáy | Hero mục tiêu **bị kéo xuống 1 lượt** — biến mất khỏi bàn, quay lại ở chỗ cũ, mất trọn lượt sau. Không sát thương |

**Pha 2 (≤11 máu) — Không Ngoi Lên Nữa.** Lặn liên tục hai lượt liền, ô trồi được đánh dấu sớm
hơn một lượt nhưng **đòn trồi lên tăng lên 5 sát thương**. Nhiều thời gian để né hơn, nhưng
trượt là chết.

**Cách phá:** `TAUNT`. Khiêu khích là thứ duy nhất **không phụ thuộc vào việc nó ở đâu** — nó có
thể trồi lên bất cứ đâu, nhưng không thể chọn đánh ai. Trước khi có Thornhide thì cách duy nhất
là giành ba ô đá và chấp nhận đội hình dồn cục.

**Trả về: Thornhide** — khiêu khích + phản 2 sát thương.

> **Đã dựng tới đâu:** unit (22 máu, `TELEPORT`, **không** miễn nhiễm gì), **Trồi Lên** (4 nhát ×
> 4 sát thương + đẩy 1, qua `strikes` nên gai phản lại từng nhát), **Kéo Xuống Cát**, và pha 2.
>
> **`getValidTargets` không tồn tại** — hàm thật tên `getValidSkillTargets`, và nó **không phải
> chốt chặn duy nhất**. Có **BẢY cửa**, không phải một:
> `getValidSkillTargets` · `getTempUnit` trong `planSkillActions` (xuyên hàng, nổ diện, tia lan,
> phát hai của Repeater, Blover — tất cả đi vòng qua cửa một) · `itemResolution` ×3 · `planPush`
> ×2 · **`isTilePassable`** · **`selectOrMove` trong `App.tsx`**.
>
> Hai cửa cuối là cái bẫy: thiếu `isTilePassable` thì thân đang lặn thành **lỗ đen trong tầm di
> chuyển của hero** — bức tường không nhìn thấy, không bắn được, không đi vòng được, mà lại còn
> di chuyển. Thiếu `selectOrMove` thì bấm vào ô cát là sidebar đọc ra máu con trùm.
> Cả bảy đi qua **một** helper `getSolidUnitAt`: *"cái gì ở đây mà bắn được, đi vào được, nổ
> được, đẩy được"* — khác hẳn `getUnitAt` là *"cái gì ở đây"*.
>
> **Không trồi lên được dưới đá là MIỄN PHÍ**: `MOUNTAIN` có `isWalkable: false` và `canStopOn`
> đã chặn sẵn. Không viết thêm luật địa hình nào.
>
> **Nhịp trong bảng trên là SAI và sẽ tạo ra trận không thắng nổi.** `bossClock` tăng ở đầu
> PHASE 4, nên "lặn lượt lẻ / trồi lượt chẵn" theo nghĩa đen khiến nó **lặn lại ngay trong lượt
> vừa trồi** — người chơi không có lượt nào nhìn thấy nó. Và pha 2 "lặn hai lượt liền" hạ cửa sổ
> bắn từ 4 xuống 3: trần sát thương act II là ~7/lượt × 3 = **21 < 22 máu**, tức **không thể
> thắng kể cả khi chơi hoàn hảo**. Bản đã dựng giữ **4 cửa sổ** (lượt 1, 3, 5, 7) và đổi pha 2
> thành **công bố hố sớm một lượt** — vành sáng hai lượt thay vì một, đổi lấy lượt Kéo Xuống Cát.
> Vẫn đúng chữ của kế hoạch: *"nhiều thời gian để né hơn, nhưng trượt là chết"*.
>
> **Lượt lặn không phải lượt chết** — `TAUNT` chạm được nó (khối taunt trong `skillResolution`
> duyệt thẳng `units`, không qua `getTempUnit`), gai và mìn nằm trên đường nó đi vẫn cắn, dung
> nham vẫn đốt, và bốn ô vành đã sáng số trọn một lượt. Thêm một điều: **đóng băng nó dưới đất
> thì nó trồi lên** — biến việc khống chế từ cái bẫy (mất thêm một lượt vô hình) thành phần
> thưởng.

---

### II-3 · **Yeti** — *Frostgate* — `YETI` ✅ *(chạy được)*

| Máu | Sát thương | Di chuyển | Tầm | Miễn nhiễm |
|---|---|---|---|---|
| **24** | 3 | 3 | 1 | `FREEZE` *(và chỉ `FREEZE` — không miễn `PUSH`, không miễn `BURN`)* |

**Đặc điểm — Hơi Lạnh.** Bất cứ quân nào **kết thúc lượt ở ô kề nó** đều bị `SLOW`. Không cần
telegraph vì nó không phải đòn đánh — nó là bán kính. Giả định bị phá: *"cận chiến là an toàn khi
nó chưa đánh"*.

| Kỹ năng | Telegraph | Hiệu ứng |
|---|---|---|
| **Đóng Băng** | ô mục tiêu xanh | `STUN` một hero trọn 1 lượt. Không sát thương |
| **Đập Băng** | ô mục tiêu đỏ, ghi 6 | 3 sát thương — **nhân đôi thành 6 nếu mục tiêu đang `STUN`/`FREEZE`**. Đúng bằng máu của hero mỏng nhất: combo hai lượt này **giết chết**, không phải làm bị thương |

**Đó là combo hai lượt, và nó nhìn thấy được.** Lượt 1 đóng băng, lượt 2 đập. Người chơi có trọn
một lượt để kéo nạn nhân ra… nhưng nạn nhân đang bị choáng, nên **phải có người khác giải quyết**
— bằng cách giết Yeti, chắn giữa, hay đẩy chính Yeti đi.

**Pha 2 (≤12 máu) — Bão Tuyết.** Mỗi lượt biến 2 ô thành `ICE`, và Hơi Lạnh nới lên bán kính 2.

**Cách phá:** không cho nó chạm ai. Nó **không miễn nhiễm `PUSH`** — đó là lỗ hổng cố ý: Ironhusk
và Chardwall biến cả trận thành trò đẩy con gấu ra xa. Con trùm duy nhất trong chín con mà đẩy
là câu trả lời chính.

**Trả về: ❄️ ELEMENT BĂNG.** Kit của `COLD_SNAP` đã ship chuyển thẳng thành luật này
(`PLAN-progression.md` mục 4.1), kèm migration save.

> **Đã dựng tới đâu:** unit (24 máu, 3 sát thương, chỉ miễn `FREEZE`), **Đóng Băng → Đập Băng**,
> **Hơi Lạnh** (bán kính 1, lên 2 ở nửa máu). Bỏ phần "biến 2 ô thành `ICE`" của pha 2 — `arena_yeti`
> vốn đã là băng nguyên bàn và **không code nào đọc `terrain === 'ICE'`**, nên đó là một no-op vẽ
> lên một no-op. Nói ra chứ không lặng lẽ cắt.
>
> **Nhân đôi đặt ở behaviour, KHÔNG ở `calculateDamage`** — và đây là chỗ dễ làm sai nhất. Số hiện
> trên ô lấy từ `Intent.damage`; nhân đôi lúc phân giải thì bàn cờ quảng cáo 3 rồi giáng 6, đúng
> thứ game này hứa không bao giờ làm. Lý do thứ hai là bán kính vụ nổ: `calculateDamage` là phễu
> **mọi** nguồn sát thương chảy qua, nên "đánh mạnh hơn lên mục tiêu bị giữ" đặt ở đó sẽ nhân đôi
> luôn combo đóng-băng-rồi-đánh của chính người chơi và mỗi nhịp lava dưới chân một thân bị choáng.
>
> **Ba thứ engine phải sửa, và hai trong số đó là lỗ có sẵn:**
> 1. `Intent.statusOnHit` — đòn địch trước giờ chỉ dịch được thanh máu.
> 2. **`NEW_TURN_RESET` xoá `STUN`/`SLOW` cho MỌI unit ở cuối lượt địch**, tức trạng thái địch vừa
>    gán lên hero bị xoá trong cùng loạt action. Nghĩa là **cả bầy zombie chưa từng cướp nổi một
>    lượt của hero**. Giờ nó chỉ xoá cho phía địch; phía người chơi hết hạn ở đầu `processTurn` kế
>    tiếp — **sau** PHASE 2 (để hero bị choáng vẫn mất thu nhập Sun của lượt đó) và **trước** PHASE 3
>    (để địch gắn được đòn mới).
> 3. **`getValidMoves` không đọc `SLOW`** — `SLOW` lên cây trước giờ hoàn toàn vô nghĩa. Đo lại sau
>    khi sửa: 22 ô → 4 ô.
>
> Món (2) cũng đang âm thầm vô hiệu hoá đòn choáng của Quá Tải (Voltmaw) vừa ráp xong.
>
> Thêm móc thứ tư **`hold`** vào `BOSS_HOOKS`: không có nó thì Yeti gắp hero xong rồi **đi tiếp về
> phía nhà**, và cú đập nó vừa bỏ một lượt ra chuẩn bị không bao giờ chốt được. Đo thật: lượt 1 gắp
> → đứng lại; lượt 2 đập 6 → choáng hết hạn → đi tiếp.

---

### III-1 · **The Headliner** — *Neon Rose* — `DISCO_ZOMBOSS` ✅ *(chạy được)*

| Máu | Sát thương | Di chuyển | Tầm | Miễn nhiễm |
|---|---|---|---|---|
| **20** | **1** | 3 | 1 | `STATUS` |

**Đặc điểm — Hào Quang.** Mọi zombie khác trên bàn nhận `ENRAGED` (+1 sát thương) **và +1 di
chuyển**. Bản thân nó gây 1 sát thương — gần như vô hại. Giả định bị phá: *"nhắm vào con to
nhất"*. Ở đây con nguy hiểm nhất là **con yếu nhất**, vì nó nhân đám đông lên.

| Kỹ năng | Telegraph | Hiệu ứng |
|---|---|---|
| **Gọi Dàn Nhảy** | bốn ô quanh nó sáng | Sinh **4 Basic Zombie** ở bốn ô kề. Mỗi 2 lượt |
| **Ánh Đèn** | một hero bị khoanh vòng sáng | **Mọi zombie đổi mục tiêu sang hero đó** ở lượt sau — khiêu khích ngược. Hero bị chỉ mặt trở thành cái đích của cả bàn cờ |

**Pha 2 (≤10 máu) — Encore.** Không gọi thêm quân nữa, nhưng **mọi zombie hành động thêm một
lần** mỗi lượt. Số lượng ngừng tăng, tốc độ thì tăng gấp đôi.

> **Đã dựng tới đâu:** unit (20 máu, 1 sát thương, miễn `STATUS`), hào quang, và **Gọi Dàn Nhảy
> mỗi hai lượt** — nhịp đọc từ `Unit.bossClock` chứ không từ lượt toàn cục, nên con trùm xuất
> hiện giữa trận vẫn đếm từ lượt một của chính nó. Hào quang **không cần status mới**: nó dùng
> chung `ENRAGED` với Cờ Xí (`AURA_SOURCES` trong turnManager PHASE 1.5).
> **Pha 2 (Encore) chưa làm** — nó cần `intents: Intent[]`, việc số 10.
> Nó **không** `isMassive`: một tay cầm micro thì phải đẩy được, nếu không thì Ironhusk và
> Chardwall bị xoá khỏi trận này.

**Cách phá:** ưu tiên mục tiêu, và dọn hàng. `arena_headliner` có **hai cột spawn kín** — đám
đông xếp thành hàng dọc, đúng hình dạng mà một đòn xuyên hàng đọc được.

**Trả về: Thornquill** — `LINE 6` xuyên cả hàng, miễn phí. Bạn vừa bị chôn dưới một đám đông xếp
hàng; giờ bạn có mũi gai đi hết cả hàng đó.

**Engine cần gì:** `ENRAGED` **đã chạy** (turnManager PHASE 1.5, Flag Zombie). Ánh Đèn dùng chung
đường ống với `TAUNTED` + `tauntedBy` của Thornhide, chỉ đảo chiều — **làm `TAUNT` một lần, hai
nơi dùng.**

---

### III-2 · **Clockjaw** — *Old Quarter* — `CLOCKJAW` ✅ *(chạy được)*

| Máu | Sát thương | Di chuyển | Tầm | Miễn nhiễm |
|---|---|---|---|---|
| **22** | 3 | 3 | 1 | `PUSH` |

**Đặc điểm — Hai kim.** Nó **hành động hai lần mỗi lượt**, và **cả hai đều được telegraph**: vạch
đỏ đậm cho hành động một, vạch mờ cho hành động hai. Giả định bị phá: *"telegraph cho tôi đủ thời
gian"*. Không — thông tin vẫn đủ, **thời gian thì không**.

| Kỹ năng | Telegraph | Hiệu ứng |
|---|---|---|
| **Kim Giây** | hai ô đỏ, một đậm một mờ | Đi rồi đánh, hoặc đánh hai mục tiêu khác nhau, trong cùng một lượt |
| **Lên Cót** | đồng hồ trên đầu | Bỏ lượt này để **lượt sau hành động ba lần**. Nó chỉ dùng khi bị ép xuống dưới 1/3 máu |

**Pha 2 (≤11 máu) — Vặn Ngược.** Hành động **ba lần**, nhưng sát thương giảm còn 2. Tổng sát
thương gần như không đổi (6 → 6) — cái đổi là **số quyết định bạn phải giải mỗi lượt**.

**Cách phá:** không có cách nào *ngăn* — chỉ có cách **hấp thụ**. Đây là con trùm duy nhất mà câu
trả lời không phải là vị trí hay khống chế. `arena_clockjaw` là hẻm hẹp đúng vì thế: kite không
được, buộc phải chịu đòn.

**Trả về: Gourdward** — 3 khiên cho một đồng đội, khiên không mất khi hết lượt. Thứ duy nhất
trong game chặn được sát thương *trước khi* nó xảy ra.

> **Đã dựng, và KHÔNG theo cách kế hoạch đề xuất.** Ý "`intents?: Intent[]` với `intent` là alias
> của `intents[0]`" **không chạy được trong TypeScript này**: codebase spread unit liên tục
> (`{...u, position}`), mà spread **đọc getter một lần rồi đóng băng thành giá trị thường** —
> alias chết im lặng; `structuredClone` (snapshot Tua Lại Lượt) còn vứt luôn prototype. Và có
> **13 điểm ghi `intent`**, trong đó ba điểm sẽ để lại nhát chém cũ trên con trùm vừa bị choáng.
>
> Thay bằng **`Intent.strikes?: AreaHit[]`** — dữ liệu nằm TRONG intent, không nằm cạnh nó trên
> `Unit`. Mọi điểm ghi đều thay cả object intent, nên không có trạng thái cũ nào sót lại.
>
> **Ranh giới với `blast` không phải số ô, mà là AI ĐƯỢC ĐÁP TRẢ.** `blast` là mặt đất bị đánh:
> bom, đạn, tia — không phản đòn. `strikes` là N đòn đầy đủ, mỗi đòn chạy trọn PHASE 3. Hệ quả
> hay nhất là thứ không ai thiết kế: **Thornhide phản đòn vào từng nhát** — 2 gai thành 4/lượt ở
> đây và 6 khi trùm vặn ngược, tức cả thanh 22 máu trong bốn lượt từ một hero đứng yên. Con trùm
> mà chiêu bài là "nhiều hành động hơn" bị hoá giải bởi đúng hero được trả công theo số hành động
> giáng vào mình — **và hero đó là phần thưởng của act ngay trước nó**.
>
> **Không cần UI mới**: `sumThreatDamageAt` vốn cộng dồn theo ô, nên hai nhát vào một thân tự in
> `-6`. Rủi ro số 3 của kế hoạch (telegraph hai lớp đọc không nổi) tự tan.
>
> Hai chỗ lệch bảng, cố ý: **miễn thêm `FREEZE`** (một lần `STUN` xoá trọn 6 sát thương ≈ 25%
> output cả trận — con trùm "không ngăn được" không thể bị một kỹ năng ngăn sạch hai lần; `SLOW`
> và `TAUNT` vẫn ăn), và **đội hộ tống 0 thay vì 4** (4 lính + 6/lượt = 12 vào bể máu 24 của đội,
> đội chết ở lượt 4 khi trùm còn ~7 máu — và trận này chưa có Gourdward, khiên là phần thưởng của
> chính nó). Số hộ tống rút thành bảng `BOSS_ESCORTS`.

---

### III-3 · **Voltmaw** — *The Grid* — `VOLTMAW` ✅ *(chạy được, trừ Nạp Lưới)*

| Máu | Sát thương | Di chuyển | Tầm | Miễn nhiễm |
|---|---|---|---|---|
| **26** | 3 | 2 | **∞ trên ô điện** | `PUSH`, `STATUS` |

**Đặc điểm — Dẫn Điện.** Bất cứ quân nào đứng trên `POWER_TILE` đều **nằm trong tầm của nó, bất
kể khoảng cách**. Ô điện cho +1 sát thương — nên bàn cờ này liên tục mời bạn đứng vào chỗ chết.
Giả định bị phá: *"khoảng cách là an toàn"*, và cùng lúc phá luôn *"phần thưởng địa hình là phần
thưởng"*.

| Kỹ năng | Telegraph | Hiệu ứng |
|---|---|---|
| **Phóng Xích** | mục tiêu + **mọi quân kề nó** đỏ | 3 sát thương lên mục tiêu, **lan sang mọi đơn vị kề** với 2, rồi lan tiếp một nấc với 1. Đội đứng sát nhau ăn trọn 6 |
| **Nạp Lưới** | ba ô sáng | Biến 3 ô thường thành `POWER_TILE`. Bàn cờ ngày càng nhiều dây |

**Pha 2 (≤13 máu) — Quá Tải.** **Mọi ô `POWER_TILE` nổ mỗi lượt**: 1 sát thương + `STUN` lên thứ
đứng trên. Chính nó cũng chịu — nó đứng trên lưới của mình. Đây là pha hai duy nhất trong chín
con **tự làm hại chính nó**, và nó biến trận cuối stage III thành cuộc đua xem ai chết trước.

**Cách phá:** **tách ra**. Bảy act vừa rồi dạy người chơi chốt hành lang, đứng sát nhau, che cho
Sunspot. Con này phạt đúng thói quen đó. Và mọi ô điện `Nạp Lưới` tạo ra là một ô **nó sẽ tự đứng
lên** ở pha hai.

**Trả về: ⚡ ELEMENT ĐIỆN** — lan một lần từ mục tiêu chính, ½ sát thương của hero (luật L3,
`PLAN-progression.md` mục 3).

> **Đã dựng tới đâu:** unit (26 máu, 3 sát thương, miễn `PUSH`+`STATUS`), **Dẫn Điện**,
> **Phóng Xích** 3/2/1, và **Quá Tải** ở nửa máu. **Nạp Lưới chưa làm** — nó cần một `Intent.type`
> mới (`TERRAIN`), và `arena_voltmaw` vốn đã có 8 ô điện nên trận vẫn dạy đủ bài học.
>
> Tia lan dùng chung `chainStep` (`utils/elements.ts`) với element ĐIỆN, đúng yêu cầu — hàm đó
> **trả về thân thể, không trả số**, nên mỗi nấc tự khai giá trị của mình và không thể kế thừa
> con số của ai. Sát thương 3/2/1 **suy ra từ chỉ số** (`damage - ring`, sàn 1) chứ không gõ tay
> ba lần: hào quang Cờ Xí cộng vào `damage` là cả ba nấc tự lên 4/3/2.
>
> **Nó tự làm mình đau mà không có một dòng code nào nói về Voltmaw** trong `turnManager`: danh
> sách nổ là các Ô, và nó đang đứng trên một ô. Đo thật ở 13/26 máu đứng trên ô điện — hero ăn 3
> từ đòn chính, **trùm ăn 1 từ lưới của chính mình**, và nó miễn choáng nên vẫn hành động: đúng
> cuộc đua mà pha 2 được thiết kế để tạo ra.

**Engine cần gì:** luật lan điện của trùm và luật lan của element **phải dùng chung một hàm** —
nếu viết hai lần thì con bug Melon-splash (`DAMAGE 999` lan 499) sẽ quay lại ở phía địch.

---

### MÀN CUỐI · **Blightlord** — *The Breach* — `BLIGHTLORD`

| Máu | Sát thương | Di chuyển | Tầm | Miễn nhiễm |
|---|---|---|---|---|
| **12 + 12 + 12** *(ba pha)* | 4 | 2 | 2 | `PUSH`, `STATUS`, `FREEZE`, `BURN` |

Không phải một con trùm với 36 máu — **ba con trùm nối nhau trên cùng một thân xác**, mỗi pha đổi
luật. Giữa hai pha nó **bất khả xâm phạm một lượt** và bàn cờ đổi hình.

| Pha | Tên | Luật |
|---|---|---|
| **1 — Đám Đông** | *Chúng Vẫn Còn Đây* | Mỗi lượt gọi lại **một con trùm đã hạ** dưới dạng bóng ma 4 máu, mang **đúng một** kỹ năng của con đó |
| **2 — Kẻ Cướp** | *Của Ngươi Là Của Ta* | **Vô hiệu hoá element của một hero** mỗi lượt (telegraph: hero đó xám đi). Nếu đội đồng nguyên tố thì cộng hưởng tắt theo |
| **3 — Ngược Dòng** | *Ta Đi Lùi Qua Thời Gian* | Cuối mỗi lượt nó **quay về vị trí và máu của đầu lượt trước** — hoàn tác đúng một lượt sát thương. **Chỉ dừng lại nếu lượt đó nó nhận ≥6 sát thương** |

**Pha 3 là câu hỏi cuối, và nó có đúng một câu trả lời:** dồn cả đội vào một lượt. Cả game dạy
chia sát thương ra cho khéo; trận cuối bắt bạn gộp lại. **Tua Lại Lượt của Chrona** (`PLAN-
progression.md` mục 3ter) là công cụ để thử ra con số đó mà không mất run — cỗ xe đi lùi thời
gian đấu với kẻ đi lùi thời gian, và đó là toàn bộ chủ đề của game gói trong một cơ chế.

**Trả về:** không gì cả. **Một chậu đất, một mầm xanh** (`PLAN-progression.md` mục 3quater).

---

## 6. Máu hero — nâng nền, và nâng luôn giá element

> Mục này **sửa `PLAN-heroes-9.md`**, không chỉ bổ sung nó. Bảng chỉ số cuối file đó phải đổi
> theo. Mọi con số sát thương của chín con trùm ở mục 5 **đã tính theo nền máu mới**.

### Vấn đề, bằng số

Hai luật đã chốt ở nơi khác cộng lại thành một chỗ hỏng:

1. **Máu persist giữa các trận** (`unitFactory.ts`: *"carried health, not a fresh body"*). Lửa
   trại hồi đầy, nhưng `MAX_LAYERS_BETWEEN_CAMPFIRES = 4` — nghĩa là **bốn trận liên tiếp trên
   cùng một thanh máu** là chuyện bình thường.
2. **Element trừ 1 máu tối đa** (`PLAN-progression.md` mục 3).

Đặt cạnh bảng sát thương thật của địch thì ra thế này:

| Hero | Máu | Mang element | Chết sau mấy đòn Conehead *(2 dmg)* | …ở màn ELITE *(3 dmg)* |
|---|---|---|---|---|
| Shadeleaf · Thornquill · Sunspot | 3 | **2** | **1 đòn** | **1 đòn** |
| Cobb · Maw · Chardwall · Gourdward | 4 | 3 | 2 | 1 |
| Ironhusk · Thornhide | 5 | 4 | 2 | 2 |

**Một hero mang element chết vì một con quái thường.** Không phải vì trùm, không phải vì đọc sai
telegraph — vì một con Conehead. Và vì máu mang sang trận sau, con số thật trong trận thứ ba của
một chặng còn tệ hơn cột này.

Ở nền máu đó, element không phải là *một lựa chọn có giá*. Nó là **một cái bẫy**.

### Đề xuất: nhân đôi máu, nhân đôi giá element

| Hero | Máu cũ | **Máu mới** | Mang element |
|---|---|---|---|
| Shadeleaf | 3 | **6** | 4 |
| Thornquill | 3 | **6** | 4 |
| Sunspot | 3 | **6** | 4 |
| Cobb | 4 | **8** | 6 |
| Maw | 4 | **8** | 6 |
| Chardwall | 4 | **8** | 6 |
| Gourdward | 4 | **8** | 6 |
| Ironhusk | 5 | **10** | 8 |
| Thornhide | 5 | **10** | 8 |

**Giá element: −1 → −2 máu tối đa.**

### Vì sao phải nâng giá element cùng lúc — nếu không thì nâng máu là phá hệ

`PLAN-progression.md` mục 3 dành cả một chương để chứng minh **tại sao giá phải là máu**: vì
−20% đến −33% là một khoản đau đều cho mọi hero, khác hẳn "−1 sát thương" (−100% với người này,
−0% với người kia). Nếu máu gấp đôi mà giá vẫn là −1 thì:

| | Giá cũ trên nền cũ | Giá −1 trên nền mới | **Giá −2 trên nền mới** |
|---|---|---|---|
| Hero 3 → 6 máu | −33% | −17% | **−33%** |
| Hero 4 → 8 máu | −25% | −13% | **−25%** |
| Hero 5 → 10 máu | −20% | −10% | **−20%** |

Cột phải **trùng khít cột trái**. Nhân đôi cả hai thì **tỉ lệ không đổi, vùng đệm tuyệt đối gấp
đôi** — lập luận của `PLAN-progression.md` giữ nguyên hiệu lực, chỉ có phần "một đòn là chết"
biến mất. Nếu giữ −1 thì element thành gần như miễn phí, và cái mục 3 đó tự mâu thuẫn.

Đội đồng nguyên tố giờ tốn **−6 máu toàn đội** thay vì −3. Vẫn là một quyết định thật.

### Cái gì KHÔNG đổi, và vì sao

| Giữ nguyên | Lý do |
|---|---|
| **Sát thương hero** | Máu zombie không đổi → **thời gian giết mọi thứ không đổi**. Cái tăng lên là vùng đệm, không phải tốc độ |
| **Máu zombie** | Nâng theo thì hoàn tác đúng thứ vừa sửa |
| **Phản đòn 2 của Thornhide** | Đo bằng máu zombie, không phải máu hero |
| **`BONUS_HP: 3`** | Trên nền 3 máu nó là **+100%** — món ghép mạnh nhất game một cách vô lý. Trên nền 6–10 nó thành +30…50%, tức là **tự nó được cân lại miễn phí** |

### Cái gì PHẢI đổi theo

| # | | Cũ | Mới | Vì sao |
|---|---|---|---|---|
| 1 | **Khiên `Encase` của Gourdward** | 3 | **5** | Trên thân 4 máu, 3 khiên là +75% máu. Trên thân 8 máu nó còn +37% — cả bản sắc của hero tụt xuống. 5 khiên = **chắn trọn một đòn trùm**, đúng việc anh ta sinh ra để làm |
| 2 | **Sát thương trùm** | — | xem mục 5 | Đã tính sẵn theo nền mới: trùm gây 2–5, tức **2–3 đòn mới hạ một hero**, thay vì 1 |
| 3 | **Hao mòn cây dự bị** | −1 máu/lần ra trận, trên thân 2–4 máu | giữ | Cây dự bị **cố ý mỏng manh** — đó là đồng hồ đếm ngược cho quyết định "ra trận hay đem ghép" (`PLAN-progression.md` mục 4.2). Nâng theo là xoá đồng hồ |

### Nó làm gì với con trùm đầu tiên

Gargantuar gây **5 sát thương** — con số đã qua chơi thử thật:

| | Nền cũ | Nền mới |
|---|---|---|
| Shadeleaf trúng một cú Nghiền | **chết** (3 máu) | **còn 1 máu** |
| Shadeleaf mang element trúng một cú | **chết** (2 máu) | **chết** (4 máu) |
| Ironhusk trúng một cú | chết ngắc ngoải (5 máu → 0) | còn 5 máu |

Đó chính xác là điều một cú đánh của trùm nên làm: **suýt giết**, chứ không phải giết. Và mang
element vẫn đủ để chết — nên element vẫn là rủi ro thật, không phải là quà.

Việc này **xoá luôn rủi ro số 4** ở mục cuối file (*"5 sát thương giết đứt mọi hero"*) mà không
phải động vào con số duy nhất trong game đã có dữ liệu thật.

### Hai thứ sẽ gãy khi đổi — cả hai đều gãy to tiếng

1. **`data/tutorial.assert.ts` sẽ ném lỗi ngay khi mở dev server.** Có một **cái chết theo kịch
   bản** trong tutorial, và file assert bắt buộc nó phải *không tránh được*:
   ```
   if (bite < hero.maxHp) throw ... "Boxed but alive is not a scripted death."
   ```
   Cái hộp đó hiện cắn đủ 3 máu. Với 6 máu thì nó **không giết được nữa**, và bộ assert sẽ nói
   thẳng ra điều đó. Phải **tăng số quân vây hoặc sát thương của ván kịch bản đó** cùng lúc với
   việc đổi máu — không phải sau.
2. **Save đang chơi dở (`pitb_run_v1`) sẽ có hero với `hp` cũ trên `maxHp` mới** — tỉnh dậy với
   3/6 máu và không hiểu vì sao. Migration: khi nạp run có `maxHp` khác định nghĩa hiện tại thì
   **hồi đầy**. Rẻ hơn nhân tỉ lệ, và về phía người chơi thì đó là món quà chứ không phải mất mát.

---

## 7. Bảng tổng — chín con, một trang

| # | Trùm | Vùng | Máu | Dmg | Giả định bị phá | Câu trả lời |
|---|---|---|---|---|---|---|
| I-1 | Gargantuar | Verdant Reach | 16 | 5 | chặn được là an toàn | **Maw** |
| I-2 | Ironcart | Goldacre | 18 | 3 | đứng đúng chỗ là an toàn | **Cobb** |
| I-3 | Cinder Colossus | Kiln Row | 20 | 3 | bàn cờ là hằng số | 🔥 **LỬA** |
| II-1 | The Armada | Windward | 22 | 2 | xây tường là đủ | **Chardwall** |
| II-2 | Sandreaver | Thornwaste | 22 | 4 | tuyến phòng thủ có mặt trước | **Thornhide** |
| II-3 | Yeti | Frostgate | 24 | 3 | nó chưa đánh thì còn an toàn | ❄️ **BĂNG** |
| III-1 | The Headliner | Neon Rose | 20 | 1 | nhắm con to nhất | **Thornquill** |
| III-2 | Clockjaw | Old Quarter | 22 | 3 | telegraph cho tôi đủ thời gian | **Gourdward** |
| III-3 | Voltmaw | The Grid | 26 | 3 | khoảng cách là an toàn | ⚡ **ĐIỆN** |
| — | Blightlord | The Breach | 12×3 | 4 | *(cả chín cái trên, lần lượt)* | 🌱 |

**Đường cong máu 16 → 26** chứ không phải 16 → 60: đội cũng lớn lên (fusion, element, gear), nên
số lượt cần để hạ trùm phải **giữ nguyên khoảng 4–5**, không phải tăng dần. Trùm khó hơn vì **luật
của nó**, không vì thanh máu — đó là bài học của Into the Breach và nó áp thẳng được vào đây.

**Chỉ có ba con miễn nhiễm `PUSH` trong chín con** (Ironcart, Clockjaw, Voltmaw). Cố ý: hai hero
đẩy (Ironhusk, Chardwall) phải có đất diễn ở 2/3 số trận trùm, nếu không thì cả một class thành
vô dụng đúng ở chỗ quan trọng nhất.

**Chỉ có một con miễn nhiễm `STATUS` toàn phần** (The Headliner, và Blightlord). `FREEZE`/`STUN`
mất tác dụng lên nhiều con, nhưng `SLOW` thì hầu như luôn ăn — đúng theo chú thích trong
`types.ts`: *"having one immunity blank both meant the Gargantuar shut off every control tool in
the game at once"*.

---

## 8. Trận trùm khác trận thường ở đâu

Hiện `buildEncounter` xử node `BOSS` bằng: sinh Gargantuar cứng + đúng 2 quái lính. Cần đổi ba chỗ:

| # | Việc | Ghi chú |
|---|---|---|
| 1 | `bossClassFor(bossId)` thay cho `UnitClass.GARGANTUAR` hardcode | 3 dòng |
| 2 | Số quái lính theo trùm, không phải hằng số 2 | Headliner cần **0** lính mở màn (nó tự gọi); Clockjaw cần 4 (hẻm phải chật); Gargantuar giữ 2 |
| 3 | `pickArena(bossId)` thay cho `pickTemplate(world)` | mục 4 |

**Quái lính tiếp viện trong trận trùm** nên theo chủ đề của trùm chứ không phải bảng roll chung:
Frostgate thả Cửa Lưới (miễn `STATUS`, hợp với chủ đề khống chế), The Grid thả Football (miễn
`PUSH`). Một bảng `Record<BossId, UnitClass[]>` là đủ, không cần hệ thống.

---

## 9. Việc phải làm — theo thứ tự

| # | Việc | Kích cỡ | Chặn cái gì |
|---|---|---|---|
| 1 | ✅ Objective **`SLAY_BOSS`** + `Unit.isBoss` | nhỏ | ~~chặn tất cả~~ — xong |
| — | *(mọi dòng ✅ dưới đây đã áp vào code và kiểm bằng app chạy thật)* | | |
| 2 | ✅ `pickArena` + `MapTemplate.arenaFor` + `generateBoard(world, boss)` | nhỏ | mọi con trùm |
| 3 | ✅ `':'`→ICE, `'c'`→CONCRETE + **43 bàn thường + 9 sân trùm** trong `data/maps.ts` | nhỏ | vùng ICE/COAST/THORN/NEON/RUIN/GRID |
| 3b | ✅ `HOLD_TILE` chọn ô theo `HOLDABLE_TERRAIN`, không theo `GRASS` | **1 dòng** | objective ở mọi vùng mới |
| 4 | ✅ `WorldType` 4 → **9** + `STAGE_SECTORS`/`stageForBosses` *(chuỗi sector theo số trùm đã hạ, không theo act)* | nhỏ | mục 1 |
| 5 | ✅ **Cả 5 hazard xong** *(chạy được)*. `TIDE` và `DUST_VEIL` không cần state mới trong `GameState`: dùng chung vòng đời của gai — bộ đếm nằm trên Ô (`TileData.smoke`, `TileData.flood`), già đi cạnh `simSpikes`, ghi ngược bằng `MODIFY_TERRAIN` | vừa | ~~vùng mới~~ — xong |
| 6 | ◐ `BossId` đã có **`VOLTMAW`** (đủ 10). `BOSSES` vẫn 7 dòng — chờ có unit trùm | nhỏ | bảng thưởng |
| 7 | ✅ **Bảng `BOSS_HOOKS`** (`plan`/`onMoved`/`onTurnEnd`) + `Unit.bossId` + `bossClassFor`; **3 trùm chạy được**: Gargantuar (pha 2), The Headliner (aura + gọi quân), Cinder Colossus (vệt lava, hồi máu, nứt vỏ) | vừa | — |
| 8 | `TAUNT` / `tauntedBy` — **dùng cho cả Thornhide và Ánh Đèn của Headliner** | vừa | Sandreaver, Headliner, Thornhide |
| 9 | `isBurrowed` thành luật thật (không nhắm được khi lặn) | vừa | Sandreaver |
| 10 | **`intents: Intent[]`** — nhiều hành động một lượt | **lớn** | Clockjaw, pha 2 của Headliner |
| 11 | ✅ `chainStep` trong `utils/elements.ts` — cả hai chỗ cũ đã chuyển sang dùng chung, repo còn **đúng một** vòng lan | vừa | Voltmaw, element ĐIỆN |
| 12 | ✅ Bàn 6×6 không nhà *(chạy được)* — **`GRID_SIZE` vẫn là hằng số**: vành `#` vẽ lòng 6×6 trong khung 8×8, và nhánh "hết não thì đuổi cây gần nhất" đã có sẵn trong `turnManager`. `MapTemplate.noHouses` chỉ để nới một dòng `assertTemplate` | ~~lớn~~ nhỏ | ~~màn cuối~~ — xong |
| 13 | ✅ **Blightlord ba pha** *(chạy được)* — `BOSS_HOOKS.BLIGHTLORD`, `Unit.invulnerable` (đọc ở `calculateDamage`), status `SEVERED` (cắt ở `skillCarriesElement`), `Intent.spawnHp` | vừa | ~~màn cuối~~ — xong |
| 15 | ✅ **Đồng hồ riêng cho node BOSS** *(chạy được)* — `BOSS_MAX_TURNS = 7`, `BREACH_MAX_TURNS = 9`. Ở 5 lượt cũ, đội **hoàn hảo** (10 dmg/lượt) vẫn thua Blightlord với trùm còn 6/36 máu — hai lượt tái hợp ăn mất 40% đồng hồ | nhỏ | trận cuối thắng được |
| 14 | ✅ **Objective `ESCORT_GEAR`** + cây hoang `isWild` *(chạy được)* — thùng đồ là mục tiêu NGANG HÀNG với nhà trong vòng chọn mục tiêu của bầy | vừa | — |

**Gói máu hero (mục 6) đi riêng — làm nguyên gói hoặc không làm:**

| # | Việc | Kích cỡ | Ghi chú |
|---|---|---|---|
| H1 | 9 dòng `maxHp` trong `data/heroes.ts` → 6/8/10 | nhỏ | |
| H2 | Giá element −1 → **−2 máu tối đa** | nhỏ | **bắt buộc đi kèm H1** — thiếu nó thì element gần như miễn phí |
| H3 | Khiên `Encase` 3 → **5** | nhỏ | 1 dòng, nếu không thì Gourdward mất bản sắc |
| H4 | **Chỉnh lại ván chết-theo-kịch-bản của tutorial** | vừa | `tutorial.assert.ts` **sẽ ném lỗi ngay khi mở dev** nếu không làm |
| H5 | Migration `pitb_run_v1`: `maxHp` lệch định nghĩa → hồi đầy | nhỏ | tránh hero tỉnh dậy 3/6 máu |
| H6 | Cập nhật bảng cuối `PLAN-heroes-9.md` | nhỏ | tài liệu, nhưng nó là bản đặc tả nên phải khớp |

Bốn việc đầu là **một buổi**, và sau chúng thì Gargantuar + Headliner + Ironcart chơi được ngay.
Gói H nên làm **trước** khi dựng con trùm thứ hai — mọi con số sát thương ở mục 5 đã tính theo
nền máu mới, nên dựng trùm trên nền cũ là dựng sai hai lần.
Việc số 10 và 12 nên để cuối: chúng đụng vào kiểu dữ liệu lõi.

---

## 10. Rủi ro

1. ~~**Chín con trùm là chín AI riêng.**~~ ✅ **Đã dựng trước khi có con thứ ba**, đúng như rủi
   ro này yêu cầu. `utils/bossBehaviours.ts` giữ `BOSS_BEHAVIOURS: Partial<Record<BossId,
   BossBehaviour>>`; `planEnemyIntent` tính sẵn các dữ kiện chung (đích, kẻ chắn đường, sát
   thương) rồi tra bảng theo `Unit.bossId`. Behaviour trả `null` = "lượt này không có gì đặc
   biệt" và rơi xuống thang AI thường — và đó phải là ca phổ biến, vì một con trùm bỏ qua luật
   nền **mọi lượt** thì không phải trùm, nó là đoạn cắt cảnh.
   Khối `GARGANTUAR SPECIAL AI` cũ đã dời sang đó nguyên vẹn; `aiLogic.ts` giờ không biết khái
   niệm trùm tồn tại.
   Bảng sau đó nở thành **`BOSS_HOOKS`** với ba móc — `plan` (quyết định), `onMoved` (hệ quả
   của việc đã đi), `onTurnEnd` (trạng thái bàn cờ). Cần thế vì **không phải nét nào của trùm
   cũng là một intent**: Cinder Colossus không *quyết định* để lại lava, đất cháy vì nó đã bước
   lên. Viết tự nhiên thì những thứ đó thành `if (unit.bossId === …)` nằm trong turnManager —
   đúng cái kiểu tản mát mà bảng này sinh ra để chặn. Giờ turnManager gọi bảng ở **đúng hai
   điểm** và không biết ai nằm trong đó.
2. **Pha 2 nhân đôi số cách một trận trùm diễn ra.** Chín con × hai pha = 18 hành vi phải cân.
   Nếu phải cắt, **cắt pha 2 của I-1, I-2, III-1** (ba con đơn giản nhất) và giữ pha 2 cho sáu
   con còn lại — pha 2 là thứ giữ cho trận không thành cuộc đục thanh máu.
3. **Telegraph hai hành động (Clockjaw) có thể đọc không nổi trên màn hình.** Vạch mờ/đậm là đề
   xuất, chưa thử. Nếu không đọc được thì phương án B: nó hành động một lần nhưng **mọi thứ
   nhân đôi** (đi 2× xa, đánh 2× mạnh) — dở hơn nhưng đọc được.
4. **Nhân đôi máu hero làm game dễ đi, và mục 6 cố ý không bù lại bằng cách nào cả.** Lập luận
   là: thứ tăng lên chỉ là **vùng đệm giữa hai lửa trại**, còn thời gian giết mọi thứ thì không
   đổi. Tôi tin lập luận đó, nhưng nó **chưa được chơi thử**. Nếu bốn trận liên tiếp hoá ra quá
   dễ thì núm vặn đúng là `MAX_LAYERS_BETWEEN_CAMPFIRES` (thưa lửa trại ra), **không phải** nâng
   sát thương địch — nâng sát thương địch là quay về đúng chỗ vừa sửa.
5. **`RUIN` là vùng duy nhất mà bàn cờ đổi vĩnh viễn giữa trận.** Sập Nhà có thể **bịt kín đường
   đi của zombie** hoặc **nhốt một hero** — `findUnreachableHouses` chỉ chạy lúc dựng bàn, không
   chạy lại sau khi địa hình đổi. Cần chặn ngay trong `planHazard`: **không bao giờ chọn ô làm
   sập nếu nó là ô duy nhất nối hai nửa bàn cờ.** Đây là chỗ dễ sinh ván không thắng nổi nhất
   trong cả file này.
6. **Chín `WorldType` là chín bảng màu và chín bộ art nền.** Con số vùng tăng thì chi phí art
   tăng theo tuyến tính, và `art-src/ART-TODO.md` vốn đã là hàng đợi dài. `NEON` và `RUIN` chia
   được phần lớn tài nguyên (cùng một thành phố, một bên còn đèn một bên tắt) — đó là lý do thực
   dụng thứ hai để tách chúng, ngoài lý do thiết kế.
