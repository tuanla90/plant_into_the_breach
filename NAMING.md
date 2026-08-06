# NAMING.md — Sổ đối chiếu tên (IP strip, 2026-08-06)

Toàn bộ tên hiển thị PvZ đã bị thay bằng tên gốc của dự án. **Tên mới là chuẩn** — đừng
đưa tên cũ quay lại bất kỳ chuỗi hiển thị nào (EN key lẫn giá trị VI). ID nội bộ
(HeroId, UnitClass, BossId, MaterialId, id item, id skill, tên file sprite) **đã đổi
xong ở Đợt 6** — save cũ được dịch tự động tại biên nạp qua `utils/idAliases.ts`.

Giọng đặt tên: từ ghép Anh ngữ ngắn, u tối, quen thuộc kiểu gear/quân sự (khớp Voltmaw,
Kiln Row, Blightfall có sẵn). Hero theo công thức *[thuộc tính/vũ khí] + [cây]*.

## Title & khái niệm lõi

| Cũ | Mới (EN key) | VI |
|---|---|---|
| Plant Heroes: Blightfall / Plants into the Breach | **Blightfall: The Last Garden** | giữ EN |
| Sun (tiền kỹ năng) | **Sol** | Sol |
| Brain / Não (vật phải bảo vệ) | **Sprout** | Mầm |
| House / Nhà (ô chứa) | **Greenspire** | Tháp Xanh |

## Heroes (cột "ID nội bộ" là ID CŨ lịch sử — Đợt 6 đã đổi ID theo tên mới)

| ID nội bộ (cũ) | Cũ | Mới |
|---|---|---|
| GREEN_SHADOW | Shadeleaf | **Peaburst** |
| WALL_KNIGHT | Ironhusk | Ironhusk (giữ) |
| SOLAR_FLARE | Sunspot | **Sunbloom** |
| CHOMPZILLA | Maw | **Snapmaw** |
| KERNEL_PULT | Cobb | **Cornova** |
| ZEPHYR | Zephyr | **Reedwing** |
| THORNHIDE | Thornhide | **Thornshell** |
| CHARDWALL | Chardwall | **Chardslam** |
| GOURDWARD | Gourdward | Gourdward (giữ) |

## Items

| Cũ | Mới | VI |
|---|---|---|
| Potato Mine | Seed Mine | Mìn Hạt |
| Cherry Bomb | Fire Grenade | Lựu Đạn Lửa |
| Jalapeno | Flame Strike | Hỏa Kích |
| Snow Pea | Ice Grenade | Lựu Đạn Băng |
| Coffee Bean | Stim Shot | Mũi Kích Chiến |
| Blover | Storm Fan | Quạt Bão |
| Spikeweed | Spike Trap | Bẫy Chông |
| Hypno-shroom | Brainwash Dart | Phi Tiêu Tẩy Não |
| Magnet-shroom | Magnet Pulse | Xung Nam Châm |
| Doom-shroom | Blight Core | Lõi Tàn Rụi |
| Aloe | Heal Kit | Túi Cứu Thương |

## Materials / cây lính (bench)

| Cũ | Mới | VI |
|---|---|---|
| Peashooter | Seed Gun | Súng Hạt |
| Sunflower | Sol Battery | Pin Sol |
| Twin Sunflower | Twin Sol Battery | Pin Sol Đôi |
| Chomper | Steel Jaws | Hàm Thép |
| Wall-nut | Armor Plate | Tấm Giáp |
| Kernel-pult | Corn Mortar | Cối Bắp |
| Cattail | Rotor Wing | Cánh Quạt |
| Endurian | Spike Armor | Giáp Gai |
| Chard Guard | Spring Arm | Tay Lò Xo |
| Pumpkin | Bunker Shell | Vỏ Boong-ke |
| Tall-nut | Tower Shield | Khiên Tháp |
| Melon-pult | Melon Mortar | Cối Dưa |
| Cabbage-pult | **ĐÃ GỠ KHỎI GAME** (đợt 3 — chưa từng có đường spawn) | — |
| Torchwood | Ember Log | Gỗ Đuốc |
| Umbrella Leaf | Parasol Leaf | Lá Ô Dù |
| Sun-shroom | Sol Cap | Nấm Sol |
| Scaredy-shroom | Shy Cap | (giữ VI cũ) |
| Bloomerang | Boomerang | Boomerang |
| Bonk Choy | Bok Boxer | Võ Sĩ Cải |
| Iron-nut | Iron Shell | (giữ VI cũ) |
| Pea-nut (fusion) | Turret Pea | — |
| Cob Cannon (fusion) | Cob Howitzer | Lựu Pháo Bắp |
| Pumpkin Shell (fusion) | Bunker Plating | Giáp Boong-ke |
| Spiked Endurian (fusion) | Bristling Armor | Giáp Tua Tủa |

Giữ nguyên vì là từ chung: Repeater, Cactus, Sweet Potato, Gear Crate, Cob Bunker,
Grand Chard, Melon Lob (tên skill).

## Zombies (bỏ hẳn hậu tố "Zombie" trong tên riêng)

| Cũ | Mới | VI |
|---|---|---|
| Zombie (thường) | Walker | Xác Lết |
| Conehead | Scrapcap | Xác Mũ Nhựa |
| Buckethead | Pothelm | Xác Nồi Sắt |
| Newspaper Zombie | Tatterguard | Xác Giấy Bồi |
| Screen Door Zombie | Doorbearer | Xác Khiêng Cửa |
| Digger Zombie | Miner | Xác Thợ Mỏ |
| Football Zombie | Linebreaker | Xác Húc |
| Pole Vaulter | Leaper | Xác Bật Nhảy |
| Disco Zombie | Dancer | Xác Vũ Công |
| Balloon Zombie | Floater | Xác Bay |
| Catapult Zombie | Lobber | Xác Pháo Dàn |
| Flag Zombie | Bannerman | Xác Cầm Cờ |
| Imp | Runt | Xác Còi |
| Gargantuar (boss) | **Gravehulk** | Cự Thi |

Boss còn lại đã original từ trước: The Headliner, Cinder Colossus, Voltmaw, Yeti,
Ironcart, Clockjaw, Blightlord, The Armada, Sandreaver.

## Ngoại lệ cố ý (KHÔNG đổi)

- `art-src/ART-PROMPTS*.md` nhắc "Plants vs Zombies" dưới dạng **ràng buộc phủ định**
  ("không được giống nhân vật PvZ") — giữ nguyên, đó là công cụ chống sao chép.
- Tài liệu PLAN-*/DESIGN.md nhắc PvZ như nguồn tham khảo lịch sử — hợp lệ.
- Chữ "zombie" viết thường trong mô tả (loài, không phải tên riêng) — giữ.
- `art-src/removed-pvz-art/` — kho tham khảo, không đụng.

## Phase 2

1. ✅ XONG (Đợt 6, cùng ngày): ID nội bộ + tên file sprite đã đổi toàn bộ; alias tại
   biên nạp save nằm trong `utils/idAliases.ts` (progress/run/balance đều được dịch).
2. ⬜ Key art StartMenu đang VẼ SẴN chữ "PLANT HEROES" trong tranh — cần vẽ lại
   (xem art-src/ART-TODO.md).

## Đợt 2 (cùng ngày) — tên skill/đòn đánh

| Cũ | Mới | VI |
|---|---|---|
| Basketball (Lobber) | Boulder Lob | Ném Đá Tảng |
| Telephone Smash (Gravehulk) | Tombstone Smash | Đập Bia Mộ |
| Sticky Goop (Steel Jaws) | Sap Snare | Nhựa Dính |
| Cone Smash (Scrapcap) | Scrap Smash | Đập Phế Liệu |
| Bucket Smash (Pothelm) | Pot Smash | Đập Nồi |
| Ice Pea (Ice Grenade) | Frost Shot | Phát Băng |
| Caffeine Boost (Stim Shot) | Stim Boost | Kích Chiến |
| Hypnotize (Brainwash Dart) | Brainwash | Tẩy Não |
| Tail Dart (Rotor Wing) | Rotor Dart | Phi Tiêu Xoay |
| Pea Shot — bản bench Seed Gun | Seed Shot | Bắn Hạt |
| Cabbage (skill) | Cabbage Toss | Ném Bắp Cải |
| Shelled Steel Jaws (fusion) | Armored Jaws | Hàm Bọc Giáp |

Hero Peaburst GIỮ "Pea Shot" làm nét riêng. (Ghi chú cũ về việc giữ họ "Butter" đã
hết hiệu lực — đợt 3 bên dưới chuyển toàn bộ sang nova/choáng theo yêu cầu.)

## Đợt 3 (cùng ngày) — họ "Butter" chuyển hẳn sang nova/choáng + gỡ Cabbage

| Cũ | Mới | VI |
|---|---|---|
| Butter Splat (skill Cornova + bench) | **Nova Shell** | Đạn Nova |
| Butter Fang (fusion Snapmaw) | Stun Fang | Nanh Choáng |
| Buttered Charge (fusion Ironhusk) | Stun Charge | Cú Húc Choáng |
| Buttered Sol (fusion Sunbloom) | Dazzling Sol | Sol Chói Lòa |
| Butter Shell (fusion Gourdward) | Stun Shell | Vỏ Choáng |
| Frostbutter (fusion) | Frost Nova | Nova Băng |
| Buttered Hide (đã retire, còn key) | Numbed Hide | Da Tê Choáng |

Mọi mô tả "trét bơ/buttered stiff" → "dội choáng/stunned stiff". ID nội bộ
`butter_splat`/`kp_butter_splat` giữ (Phase 2). **CABBAGE_PULT đã gỡ hoàn toàn khỏi
codebase** (enum + plants + skills + roles do phiên song song, đuôi projectile
'CABBAGE' + Board render + key vi do phiên này) — an toàn vì chưa từng có đường spawn,
không save nào chứa nó.

## Đợt 4 (cùng ngày) — một danh từ cây cho mỗi HÀNG hero

Luật mới, và nó là thứ làm ma trận fusion đọc được: **một ô chỉ được mang danh từ cây của
CHÍNH hero nhận, không bao giờ mượn cây của hero khác.** "Gourd Guard" nằm ở hàng Chardslam
là tên của Gourdward mọc nhầm chỗ — đó mới là chỗ loạn concept, chứ không phải bản thân chữ
"Chard" (Chard là cây của Chardslam, hợp lệ y như "Pea" ở hàng Peaburst).

Danh từ chính thức của từng hàng: Sunbloom → **Bloom** · Peaburst → **Pea** · Snapmaw →
**Maw/Jaws/Gut** · Ironhusk → **Bulwark/Bash** · Cornova → **Cob** · Reedwing →
**Wing/Rotor/Pod** · Thornshell → **Thorn/Husk** · Chardslam → **Chard** · Gourdward → **Rind**.

Tính từ chính thức của từng CỘT gear: Sol Battery → *Sunlit/Solar* · Seed Gun → *Twin/Longarm* ·
Steel Jaws → *Fanged/Serrated/Rending* · Armor Plate → *Armored/Iron* · Corn Mortar →
*Mortar/Cluster/Stun* · Rotor Wing → (tên riêng, đã hay sẵn) · Spike Armor → *Thorned/Barbed/
Spined* · Spring Arm → *Sprung/Kinetic/Overwatch* · Bunker Shell → *Warded/Plating*.

| Cũ | Mới | VI |
|---|---|---|
| Solar Pea (Sunbloom) | Gunbloom | Đóa Hoa Vũ Trang |
| Turret Pea | Armored Pea | Đậu Bọc Giáp |
| Gourd Sniper | Warded Pea | Đậu Hộ Giáp |
| Photosynthetic Gut | Sunlit Gut | Dạ Dày Nắng Rọi |
| Chard Gullet | Sprung Gullet | Họng Lò Xo |
| Gourd Gut | Warded Gut | Dạ Dày Hộ Giáp |
| Chard Bash | Sprung Bash | Cú Đập Lò Xo |
| Dazzling Sol | Sunlit Cob | Bắp Nắng Rọi |
| Cob Bunker | Armored Cob | Bắp Bọc Giáp |
| Durian Shot | Barbed Cob | Bắp Ngạnh Gai |
| Chard Recoil | Overwatch Cob | Bắp Yểm Trợ |
| Gourd Battery | Warded Cob | Bắp Hộ Giáp |
| Gourd Husk | Warded Husk | Vỏ Hộ Giáp |
| Shoving Thorn | Sprung Thorn | Gai Lò Xo |
| Sunlit Guard | Sunlit Chard | Cải Nắng Rọi |
| Rending Guard | Rending Chard | Cải Xé Thịt |
| Bulwark Chard | Armored Chard | Cải Bọc Giáp |
| Cob Catapult | Catapult Chard | Cải Máy Bắn |
| Thorned Guard | Thorned Chard | Cải Gai Nhọn |
| Gourd Guard | Warded Chard | Cải Hộ Giáp |
| Sunlit Shell | Sunlit Rind | Vỏ Nắng Rọi |
| Spined Shell | Spined Rind | Vỏ Tua Gai |
| Great Gourd | Greatrind | Đại Vỏ Bí |

Hai ghi chú sửa lại bảng "giữ nguyên vì là từ chung" ở đợt 1: **Cob Bunker** và **Grand Chard**
không cùng loại. *Grand Chard* nằm ở hàng Chardslam nên hợp lệ và được giữ; *Cob Bunker* nằm ở
hàng Cornova nhưng chữ "Bunker" nay là tên gear Bunker Shell (cột bí ngô), nên đổi để hai cột
khỏi lẫn nhau. Key VI cũ của 23 tên trên **vẫn còn trong `i18n/vi.ts` dưới dạng mồ côi** — vô
hại (không chuỗi nào tra tới), dọn ở Phase 2 cùng đợt đổi ID nội bộ.

**Cây hoang còn định nghĩa nhưng KHÔNG có đường spawn (ứng viên gỡ tiếp, chờ chốt):**
MELON_PULT, REPEATER, BOOMERANG (Bloomerang cũ), TALL_NUT, SWEET_POTATO, IRON_NUT,
BONK_CHOY, SUN_SHROOM, SCAREDY_SHROOM, UMBRELLA_LEAF, TORCHWOOD. Chỉ SNOW_PEA và
CACTUS còn sống (encounterBuilder + persistence). Lý do giữ danh sách này gọn: trần
thiết kế 9 hero / 9 material — mỗi cây thêm là workload nhân theo cấp số (fusion 9×9).

## Đợt 5 (cùng ngày) — nhổ nốt SNOW_PEA & CACTUS, dọn img

- **UnitClass.SNOW_PEA và UnitClass.CACTUS đã gỡ khỏi enum + plants + skills + roles +
  icons + projectile** ('FROZEN_PEA'/'MELON' rút khỏi kiểu đạn — chỉ còn PEA | CORN).
  Phiên song song đồng thời gỡ luôn WILD_POOL (tính năng cây hoang) khỏi encounterBuilder.
- ITEM "Ice Grenade" (id `snow_pea`) KHÔNG liên quan và vẫn sống — đừng nhầm.
- Đã xoá 22 file img không còn ai tham chiếu (kiểm bằng git grep từng tên file):
  toàn bộ placeholder cây chết + gear-snow-pea/gear-cactus (.png cả bản img/small/).
  Còn giữ: aloe/doom-shroom/hypno-shroom/magnet-shroom (item), cattail + gear-cattail
  (Reedwing), zephyr.svg (hero), cherry/jalapeno/mine.svg (đang được code tham chiếu).
- PLANT_DEFINITIONS giờ đúng 9 entry: 8 cây gốc hero + GEAR_CRATE.

## Đợt 6 (cùng ngày) — Phase 2: đổi toàn bộ ID nội bộ + tên file sprite

Bảng ánh xạ đầy đủ nằm trong `utils/idAliases.ts` (nguồn sự thật duy nhất). Tóm tắt:

- **HeroId**: GREEN_SHADOW→PEABURST, WALL_KNIGHT→IRONHUSK, SOLAR_FLARE→SUNBLOOM,
  CHOMPZILLA→SNAPMAW, KERNEL_PULT→CORNOVA, ZEPHYR→REEDWING, THORNHIDE→THORNSHELL,
  CHARDWALL→CHARDSLAM.
- **UnitClass cây**: PEASHOOTER→SEED_GUN, SUNFLOWER→SOL_BATTERY, WALLNUT→ARMOR_PLATE,
  CHOMPER→STEEL_JAWS, KERNEL_PULT→CORN_MORTAR, CATTAIL→ROTOR_WING, ENDURIAN→SPIKE_ARMOR,
  CHARD_GUARD→SPRING_ARM, PUMPKIN→BUNKER_SHELL.
- **UnitClass zombie**: BASIC_ZOMBIE→WALKER, CONEHEAD→SCRAPCAP, BUCKETHEAD→POTHELM,
  NEWSPAPER_ZOMBIE→TATTERGUARD, SCREEN_DOOR_ZOMBIE→DOORBEARER, DIGGER_ZOMBIE→MINER,
  FOOTBALL_ZOMBIE→LINEBREAKER, POLE_VAULTER→LEAPER, DISCO_ZOMBIE→DANCER,
  BALLOON_ZOMBIE→FLOATER, CATAPULT_ZOMBIE→LOBBER, FLAG_ZOMBIE→BANNERMAN, IMP→RUNT,
  GARGANTUAR→GRAVEHULK, DISCO_ZOMBOSS→HEADLINER.
- **BossId**: GARGANTUAR→GRAVEHULK, DISCO_ZOMBOSS→HEADLINER, CATAPULT_LORD→IRONCART,
  BALLOON_ARMADA→ARMADA.
- **MaterialId**: MAT_* đổi theo class mới (MAT_CORN→MAT_CORN_MORTAR, MAT_CHARD→MAT_SPRING_ARM…).
- **Item id**: potato_mine→seed_mine, cherry_bomb→fire_grenade, jalapeno→flame_strike,
  snow_pea→ice_grenade, coffee_bean→stim_shot, blover→storm_fan, spikeweed→spike_trap,
  hypno_shroom→brainwash_dart, magnet_shroom→magnet_pulse, doom_shroom→blight_core,
  aloe→heal_kit.
- **Skill id**: butter_splat→nova_shell (+kp_), basketball_lob→boulder_lob, imp_toss→runt_toss,
  cone_smash→scrap_smash, bucket_smash→pot_smash, goop→sap_snare, caffeine_boost→stim_boost.
- **File ảnh**: toàn bộ sprite-*/gear-*/item-* đổi theo tên mới (cả bản img/small/);
  hero-*.webp (chân dung PvZ Heroes cũ) đã không còn trong public/.

**Migration save**: `pitb_progress_v1` (heroes/bossesBeaten/recipes "HERO:MAT"),
`pitb_run_v1` (unit.class/heroId, inventory, heroElements, fallenHeroes, node.bossId) và
`pitb_balance_v1` (path "kind.id.field") đều được dịch id cũ→mới ngay sau JSON.parse,
TRƯỚC mọi filter — xem comment tại 3 điểm nạp. KHÔNG import idAliases vào logic game.

**Cảnh báo cho mọi phiên sau**: NAMING.md và art-src/ART-PROMPTS* bị LOẠI khỏi các đợt
sed (cột "Cũ" và ràng buộc phủ định phải giữ nguyên tên cũ) — đừng "sửa giùm".
