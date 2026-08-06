# PROMPTS BẢN CẮT CẢNH (CUTSCENES) — HỘI THOẠI, GẶP NHAU & SAU ĐÁNH BOSS

> **File này được tổng hợp riêng** dành cho việc sinh ảnh các cảnh phim / cắt cảnh (Cutscenes) trong game:
> 1. **Cảnh Các Hero Gặp Nhau (Hero Encounters & Reunion)** — nền hội thoại tutorial
> 2. **Cảnh Sau Khi Đánh Gục Boss (Post-Boss Victory Scenes)**
> 3. **Cảnh Kết Chương (Stage Clear)**
> 4. **Cảnh Mở Màn (Act Intro)** — nền cho màn giới thiệu act
>
> 📌 **Tỷ lệ đề xuất**: 4:3 (Cinematic story panel) hoặc 16:9.
> 📌 **Đặc điểm**: Tranh kể chuyện điện ảnh (Cinematic Story Comic), không có viền thẻ bài (diorama), không dán chữ/bubble (game tự vẽ lời thoại).
>
> ---
>
> ## ⚙️ CODE ĐÃ SẴN SÀNG — THẢ FILE VÀO LÀ CHẠY
>
> Toàn bộ điểm chèn đã được nối vào game. Mỗi cảnh **tự kiểm tra ảnh của chính nó**: thiếu file
> thì cảnh đó im lặng không xảy ra, có file thì tự bật, **không cần sửa một dòng code nào**.
> Chỉ cần đặt đúng tên file vào `public/img/comic/`.
>
> Bảng tra tên file ↔ nơi dùng:
>
> | Nhóm | Bảng dữ liệu | Số ảnh |
> |---|---|---|
> | Nền hội thoại tutorial | `data/tutorialDialogues.ts` → `SCENE` | 8 |
> | Sau khi hạ boss | `data/cutscenes.ts` → `BOSS_CUTSCENES` | 9 |
> | Kết chương | `data/cutscenes.ts` → `STAGE_CUTSCENES` | 3 |
> | Mở màn act | `data/cutscenes.ts` → `ACT_INTRO_ART` | 10 |
>
> **Blightlord không có cảnh hạ boss** — kết truyện của hắn là `OutroComic` (8 panel, prompt nằm
> ở `ART-PROMPTS.md § outro`), và một tranh đơn đặt trước 8 panel chỉ là phần kết báo trước phần kết.
>
> **Lưu ý riêng cho nhóm "Mở màn act" và "Nền hội thoại"**: hai nhóm này bị làm tối và có chữ đè
> lên (ActIntro để `opacity-40`, hội thoại phủ `black/75`). Vẽ **bố cục thoáng ở giữa và dưới**,
> tránh chi tiết đắt tiền ở vùng đó — nó sẽ bị che.

---

## 🎨 KHỐI PHONG CÁCH BẮT BUỘC (Dán vào đầu MỌI Prompt cutscene)

```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration.
Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. 
The plant heroes are CHIBI DEFENDERS wearing full tactical gear and helmets with glowing visor slots — faces and mouth NEVER visible. 
Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm fiery/magma/glow accents. 
NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.
```

---

# 1 · CẢNH CÁC HERO GẶP NHAU (HERO ENCOUNTERS & REUNION)

### 1.1 Peaburst Cứu Sunbloom (`cutscene-hero-meet-sunspot.jpg`)
* **Thời điểm**: Màn 1 Tutorial — Peaburst tìm thấy Sunbloom kiệt sức giữa Quảng trường đổ nát.
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. The plant heroes are CHIBI DEFENDERS wearing full tactical gear and helmets with glowing visor slots — faces and mouth NEVER visible. Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm fiery/magma/glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

PROMPT: Low-angle dramatic scene in a dark ruined street. A small wounded solar-flower chibi soldier (Sunbloom) in scorched yellow tactical armor lies weakly against a pile of concrete rubble, her visor light flickering dimly. Standing over her defensively is a pea-shooter sniper soldier (Peaburst) in an olive-green tactical poncho and helmet, aiming a glowing green assault rifle into the surrounding dark fog where vague red zombie eyes glow. Warm amber sunlight rays break through the smoke, touching Sunbloom's hand.
```

---

### 1.2 Gặp Ironhusk Tại Khe Đá (`cutscene-hero-meet-ironhusk.jpg`)
* **Thời điểm**: Màn 4 Tutorial — Ironhusk cắm khiên bọc thép chặn lối đi.
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. The plant heroes are CHIBI DEFENDERS wearing full tactical gear and helmets with glowing visor slots — faces and mouth NEVER visible. Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm fiery/magma/glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

PROMPT: Heroic arrival scene at a narrow ravine in a ruined concrete highway. A heavy juggernaut walnut defender (Ironhusk) in massive cracked brown shell armor slams a giant metal riot shield deep into the fractured asphalt. Behind him stand the smaller Sunbloom and Peaburst looking up in awe. Dust and sparks fly from the shield's impact. The background shows a dark foggy city chasm. Rim lighting highlights Ironhusk's glowing blue visor and massive silhouette.
```

---

### 1.3 Xe Hàng Old Mulch (`cutscene-hero-meet-mulch.jpg`)
* **Thời điểm**: Màn 3 Tutorial / Shop — Lão gian thương Old Mulch mở kho hàng.
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. The plant heroes are CHIBI DEFENDERS wearing full tactical gear and helmets with glowing visor slots — faces and mouth NEVER visible. Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm fiery/magma/glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

PROMPT: Interior of a fortified, heavily armored supply truck wagon illuminated by warm hanging lantern light and neon glow. Old Mulch, a gnarled old veteran plant merchant wearing a leather apron and goggles, leans over a counter showing crates of glowing seed ammo, potato mines, and gear parts. Sunbloom and Peaburst stand in the foreground inspecting the tactical gear. Thick cigar smoke drifts across the scene. Rich details of weapons, gears, and gold coins on the counter.
```

---

### 1.4 Gõ Cửa Xưởng Chrona (`cutscene-hero-meet-chrona.jpg`)
* **Thời điểm**: Màn 5 Tutorial — Gặp cỗ máy thời gian Chrona.
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. The plant heroes are CHIBI DEFENDERS wearing full tactical gear and helmets with glowing visor slots — faces and mouth NEVER visible. Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm fiery/magma/glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

PROMPT: Mysterious clockwork workshop scene inside a dark underground vault. Chrona, a small dented chrome robot with a single bright cyan headlamp eye, floats above a glowing cyan holographic clockwork timeline map. The timeline projects floating golden gears and ticking temporal runes into the air. Peaburst and Ironhusk stand in shadow, watching the magical time projection with intense focus. Blue and teal ambient lighting with ticking gear aesthetics.
```

---

### 1.5 Hội Ngộ Bên Đống Lửa (`cutscene-hero-reunion-campfire.jpg`)
* **Thời điểm**: Màn 6 Tutorial / Campfire — Đội hình hợp nhất nghỉ ngơi bên lửa hồng.
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. The plant heroes are CHIBI DEFENDERS wearing full tactical gear and helmets with glowing visor slots — faces and mouth NEVER visible. Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm fiery/magma/glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

PROMPT: Emotional campfire night scene in the courtyard of a ruined fortress. A bright crackling bonfire sits in the center, casting warm orange firelight on the three plant heroes (Peaburst, Sunbloom, Ironhusk) who sit around it on stone blocks resting and cleaning their weapons. Small green seedlings sprout out of the warm ash around the fire. Deep indigo night sky above with glowing embers drifting up into the dark. Cozy, quiet camaraderie amidst war.
```

---

### 1.6 Nhìn Xuống Bản Đồ Tàn Tích (`cutscene-tut-map-rooftop.jpg`)
* **Thời điểm**: Mở bản đồ tutorial lần đầu — nối thẳng từ panel cuối của truyện mở đầu.
* ⚠️ Nền hội thoại: chừa khoảng trống ở giữa và dưới.
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. The plant heroes are CHIBI DEFENDERS wearing full tactical gear and helmets with glowing visor slots — faces and mouth NEVER visible. Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm fiery/magma/glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

COMPOSITION NOTE: wide establishing shot, keep the CENTRE and LOWER THIRD visually calm and uncluttered — dialogue UI is overlaid there.

PROMPT: Wide establishing shot from a high rooftop at dusk, seen from behind. The pea-shooter sniper (Peaburst) stands at the roof edge in silhouette, one arm raised pointing outward across a vast ruined cityscape. Below and ahead stretches a broken causeway of rubble islands linked by a single winding road, with tiny scattered campfires and faint amber signal lights marking waypoints along it. Far on the horizon a single ominous red glow marks something enormous waiting. Deep indigo sky, drifting ash, cold blue-grey ruins with warm pinpoint lights.
```

---

### 1.7 Những Hố Mộ Nứt Toác (`cutscene-tut-graves.jpg`)
* **Thời điểm**: Màn 2 Tutorial — Sunbloom hồi phục, mặt đất bắt đầu đẻ ra quái vật.
* ⚠️ Nền hội thoại: chừa khoảng trống ở giữa và dưới.
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. The plant heroes are CHIBI DEFENDERS wearing full tactical gear and helmets with glowing visor slots — faces and mouth NEVER visible. Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm fiery/magma/glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

COMPOSITION NOTE: wide establishing shot, keep the CENTRE and LOWER THIRD visually calm and uncluttered — dialogue UI is overlaid there.

PROMPT: A ruined suburban street at night where the asphalt has split open into several jagged black grave-pits, each exhaling a thin sickly green mist. Between the pits stand two small intact Greenspires with warm yellow light still glowing in their windows — the only warmth in the frame. The restored solar-flower soldier (Sunbloom) stands at the left edge, her golden aura reignited and casting long shadows across the broken road. Faint clawed hands begin to emerge from the nearest pit rim. Cold blue-green palette pierced by warm window light.
```

---

### 1.8 Mặt Đất Rên Siết (`cutscene-tut-gargantuar.jpg`)
* **Thời điểm**: Màn 7 Tutorial — trận đấu không thể thắng, trước cú nhảy thời gian.
* ⚠️ Nền hội thoại: chừa khoảng trống ở giữa và dưới.
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. The plant heroes are CHIBI DEFENDERS wearing full tactical gear and helmets with glowing visor slots — faces and mouth NEVER visible. Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm fiery/magma/glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

COMPOSITION NOTE: wide establishing shot, keep the CENTRE and LOWER THIRD visually calm and uncluttered — dialogue UI is overlaid there.

PROMPT: Extreme low-angle shot of a colossal Gravehulk zombie silhouette filling the upper half of the frame, backlit by a sickly green sky so it reads almost entirely as a black shape. It drags an enormous uprooted lamp-post like a club. At the very bottom of the frame, dwarfed to near-insignificance, the three tiny plant heroes stand in a defensive line, their visor lights pinpricks against the mass above. Dust shakes off cracked pavement; debris hangs mid-air from the tremor. Overwhelming scale, hopeless odds, solemn.
```

---

# 2 · CẢNH SAU KHU HẠ GỤC BOSS (POST-BOSS VICTORY SCENES)

### 2.1 Hạ Ironcart — Giải Phóng Goldacre (`cutscene-boss-clear-ironcart.jpg`)
* **Thời điểm**: Sau khi tiêu diệt Boss 1 (Ironcart).
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. The plant heroes are CHIBI DEFENDERS wearing full tactical gear and helmets with glowing visor slots — faces and mouth NEVER visible. Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm fiery/magma/glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

PROMPT: Victory scene after a fierce boss fight. The colossal armored war-train boss (Ironcart) lies derailed and smoking, its heavy steel wheels broken and glowing red-hot. In the foreground, the plant squad stands victorious atop a heap of scrap metal, raising their weapons as dawn light breaks over the liberated agricultural district (Goldacre). Black smoke billows into the sky.
```

---

### 2.2 Hạ Cinder Colossus — Hấp Thụ Nguyên Tố Lửa (`cutscene-boss-clear-cinder.jpg`)
* **Thời điểm**: Sau khi tiêu diệt Boss 2 (Cinder Colossus) — Mở khóa LỬA.
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. The plant heroes are CHIBI DEFENDERS wearing full tactical gear and helmets with glowing visor slots — faces and mouth NEVER visible. Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm fiery/magma/glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

PROMPT: Dramatic elemental reward scene. The gigantic lava monster (Cinder Colossus) crumbles into harmless grey ash and cooling magma rocks. Hovering above the ash pile is a radiant, flaming crimson-orange FIRE CORE crystal. Peaburst reaches out a gloved hand toward the floating fiery crystal, as bright orange flames envelop their rifle barrel, imbuing it with fire power. Intensely warm magma lighting and flying ember sparks.
```

---

### 2.3 Hạ The Armada — Tàu Bay Sụp Đổ (`cutscene-boss-clear-armada.jpg`)
* **Thời điểm**: Sau khi tiêu diệt Boss 3 (The Armada).
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. The plant heroes are CHIBI DEFENDERS wearing full tactical gear and helmets with glowing visor slots — faces and mouth NEVER visible. Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm fiery/magma/glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

PROMPT: Dramatic crash site victory scene at the harbour docks. The massive airborne zombie battleship (The Armada) has crashed into the shallow sea water, its massive propellers shattered and its iron hull cracked open. The plant heroes stand on the pier edge looking at the burning wreckage. Gusts of ocean wind clear the dark clouds, revealing a clear sky above.
```

---

### 2.4 Hạ Sandreaver — Bão Cát Nổ Tung (`cutscene-boss-clear-sandreaver.jpg`)
* **Thời điểm**: Sau khi tiêu diệt Boss 4 (Sandreaver).
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. The plant heroes are CHIBI DEFENDERS wearing full tactical gear and helmets with glowing visor slots — faces and mouth NEVER visible. Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm fiery/magma/glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

PROMPT: Desert victory scene in the Thornwaste ruins. The colossal subterranean sand-worm zombie (Sandreaver) has collapsed into the sand, dissolving into a massive mound of inert desert dust and broken spiky armor plates. The plant heroes plant their unit banners into the sand mound under a blazing desert sunset. Golden sand particles drift across the dramatic horizon.
```

---

### 2.5 Hạ Yeti — Hấp Thụ Nguyên Tố Băng (`cutscene-boss-clear-yeti.jpg`)
* **Thời điểm**: Sau khi tiêu diệt Boss 5 (Yeti) — Mở khóa BĂNG.
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. The plant heroes are CHIBI DEFENDERS wearing full tactical gear and helmets with glowing visor slots — faces and mouth NEVER visible. Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm fiery/magma/glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

PROMPT: Frozen victory scene in a snowy fortress gateway (Frostgate). The massive Ice Yeti boss shatters into thousands of glowing cyan ice shards. Floating in the center of the ice mist is a brilliant cyan-blue FROST CORE crystal. Ironhusk steps forward, receiving the icy crystal into his shield, which immediately coats in thick glacial armor spikes and glowing cyan frost aura. Cold cyan lighting and drifting blizzard mist.
```

---

### 2.6 Hạ Voltmaw — Hấp Thụ Nguyên Tố Điện (`cutscene-boss-clear-voltmaw.jpg`)
* **Thời điểm**: Sau khi tiêu diệt Boss 8 (Voltmaw) — Mở khóa ĐIỆN.
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. The plant heroes are CHIBI DEFENDERS wearing full tactical gear and helmets with glowing visor slots — faces and mouth NEVER visible. Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm fiery/magma/glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

PROMPT: High-tech power grid victory scene. The giant electric mechanical monster (Voltmaw) sparks violently and short-circuits in a pool of blue electricity. A pulsing yellow-white LIGHTNING CORE sphere hovers above the wreckage, crackling with arcs of lightning. Sunbloom absorbs the electrical core into her solar hands, causing electric lightning arcs to swirl around her body and crown. High voltage blue and yellow lighting.
```

---

### 2.7 Diệt Sạch Trùm Cuối Blightlord (`cutscene-boss-clear-blightlord.jpg`)
* **Thời điểm**: Sau khi đánh gục Blightlord tại The Breach.
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. The plant heroes are CHIBI DEFENDERS wearing full tactical gear and helmets with glowing visor slots — faces and mouth NEVER visible. Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm fiery/magma/glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

PROMPT: Climax ultimate victory scene at the dark portal crater (The Breach). The supreme undead commander (Blightlord) crumbles to dark dust, his shadowy staff shattering on the stone ground. The pitch-black portal behind him collapses in a burst of blinding white and green light. The three fully upgraded plant heroes stand shoulder to shoulder, back-lit by the dawn sun breaking through the dark clouds for the first time in years. Majestic, triumphant, and solemn.
```

> ⚠️ **Cảnh 2.7 hiện KHÔNG được code dùng.** Kết truyện của Blightlord là `OutroComic` (8 panel,
> prompt ở `ART-PROMPTS.md § outro`) — một tranh đơn đặt trước 8 panel chỉ là phần kết báo trước
> phần kết. Giữ prompt 2.7 lại làm tư liệu tham khảo cho panel đầu của outro.

---

### 2.8 Hạ Gravehulk — Verdant Reach (`cutscene-boss-clear-gargantuar.jpg`)
* **Thời điểm**: Sau khi hạ trùm Màn I-1 (Gravehulk) — Mở khóa hero **Chompzilla**.
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. The plant heroes are CHIBI DEFENDERS wearing full tactical gear and helmets with glowing visor slots — faces and mouth NEVER visible. Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm fiery/magma/glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

PROMPT: Victory scene in an overgrown forest clearing (Verdant Reach). The colossal Gravehulk lies face down and motionless across a crushed roadway, its uprooted lamp-post club broken in two beside it, one enormous fist still embedded in a fresh crater in the asphalt. Standing on its back is a hulking plant-devourer defender (Chompzilla) — a huge armoured green maw creature — rising into frame for the first time, backlit by shafts of morning sun through the canopy. The smaller heroes look up at it from the ground. Green-gold forest light, drifting spores, the sense of an ally almost too big to be safe.
```

---

### 2.9 Hạ The Headliner — Neon Rose (`cutscene-boss-clear-headliner.jpg`)
* **Thời điểm**: Sau khi hạ trùm Màn III-1 (The Headliner) — Mở khóa hero **Chardslam**.
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. The plant heroes are CHIBI DEFENDERS wearing full tactical gear and helmets with glowing visor slots — faces and mouth NEVER visible. Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm fiery/magma/glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

PROMPT: Victory scene on a shattered nightclub dance floor (Neon Rose). The flamboyant disco zombie boss (The Headliner) lies collapsed under a fallen mirror-ball, its shards scattered across the floor still throwing fractured pink and magenta light. The mind-controlled crowd of zombies has been HURLED outward in every direction — bodies mid-tumble against the walls and bar, flung away from the centre of the floor. At that centre stands a stout leaf-bladed guardian (Chardslam) in red-stemmed tactical armor, finishing an enormous two-armed sweeping throw, leaf-blades still extended. Dying neon signage, drifting smoke, sudden silence after noise.
```

---

### 2.10 Hạ Clockjaw — Old Quarter (`cutscene-boss-clear-clockjaw.jpg`)
* **Thời điểm**: Sau khi hạ trùm Màn III-2 (Clockjaw) — Mở khóa hero **Gourdward**.
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. The plant heroes are CHIBI DEFENDERS wearing full tactical gear and helmets with glowing visor slots — faces and mouth NEVER visible. Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm fiery/magma/glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

PROMPT: Victory scene in a narrow cobbled street of a ruined old town (Old Quarter), under a broken clock tower frozen at one time. The clockwork zombie boss (Clockjaw) has seized up mid-lunge, its brass gears spilling out and rolling across the cobbles, steam venting from its cracked jaw. Directly in front of it — not beside it — stands a heavy gourd guardian (Gourdward) with a deeply dented shield still raised, having absorbed the final blow head-on. Cracks radiate through the stones under his feet. Cold dawn light down the alley, brass and copper glints.
```

---

# 3 · CẢNH KẾT CHƯƠNG (STAGE CLEAR)

> Chiếu **sau** cảnh hạ trùm act 3, ngay trước khi run kết thúc. Cảnh hạ trùm nói về thứ vừa
> chết; cảnh này nói về **vùng đất phía sau nó**. Cần cảm giác toàn cảnh, tĩnh, hậu chiến —
> không xác quái, không chiến đấu.

### 3.1 Kết Chương I — Vành Đai Xanh (`cutscene-stage-1-greenbelt.jpg`)
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. Ruined post-apocalyptic atmosphere, cold blue-grey shadows contrasted with warm glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

PROMPT: Sweeping aerial panorama at golden hour over a recovering countryside: three small reclaimed settlements — a green forest reach, golden farmland with working windmills, and a kiln district whose chimneys are finally smokeless — linked by a repaired road with defensive banners planted along it. In the far distance, across a wide grey channel of water, a dark coastline is visible where scattered lights are going out one by one. Warm gold foreground giving way to cold blue distance. Peaceful, but plainly not finished.
```

---

### 3.2 Kết Chương II — Bờ Xa (`cutscene-stage-2-farshore.jpg`)
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. Ruined post-apocalyptic atmosphere, cold blue-grey shadows contrasted with warm glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

PROMPT: Sweeping panorama across three reclaimed frontier regions at dusk: a windswept harbour with repaired piers, a red thorn-choked desert with unit banners staked across the dunes, and a frozen fortress gate hung with icicles — all connected by a long convoy road with lanterns lit along it. On the horizon ahead, a vast dead neon megacity rises out of low fog, its towers dark except for a few sickly green glows deep inside. Cold teal and violet palette, the warm lantern chain leading the eye toward the city.
```

---

### 3.3 Kết Chương III — Thành Phố (`cutscene-stage-3-city.jpg`)
```
STYLE: painted cinematic story-comic panel, 4:3 ratio, dark tactical game cutscene illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded vector feel. Ruined post-apocalyptic neon city atmosphere, cold blue-grey shadows contrasted with warm glow accents. NO speech bubbles, NO text baked into the art. High detail, solemn military tone, epic scope.

PROMPT: Wide night panorama of a huge neon city with its lights coming back on district by district — a rose-pink entertainment quarter, an old stone quarter with a lit clock tower, and a power grid whose pylons are humming again. Green shoots and vines visibly reclaim the lower streets. But dead centre in the middle of the city a vast circular black crater pit gapes open, ringed by warning lights, untouched by the returning glow, a faint sick green haze rising from it. Beauty above, unfinished threat below.
```

---

# 4 · NỀN MỞ MÀN ACT (ACT INTRO BACKDROPS)

> ⚠️ **Đây là NỀN, không phải tranh chính.** Game phủ `opacity-40` + gradient tối lên trên, rồi
> vẽ tên thành phố, sprite trùm và nút bấm đè lên giữa khung. Vẽ **toàn cảnh địa danh, không
> nhân vật nào ở giữa khung** — vùng giữa sẽ bị che gần hết. **Không vẽ trùm vào đây**: game đã
> có sprite trùm riêng đứng trước nền này.

| # | File | Địa danh | Act |
|---|---|---|---|
| 4.1 | `cutscene-act-verdant-reach.jpg` | Verdant Reach | I-1 |
| 4.2 | `cutscene-act-goldacre.jpg` | Goldacre | I-2 |
| 4.3 | `cutscene-act-kiln-row.jpg` | Kiln Row | I-3 |
| 4.4 | `cutscene-act-windward.jpg` | Windward | II-1 |
| 4.5 | `cutscene-act-thornwaste.jpg` | Thornwaste | II-2 |
| 4.6 | `cutscene-act-frostgate.jpg` | Frostgate | II-3 |
| 4.7 | `cutscene-act-neon-rose.jpg` | Neon Rose | III-1 |
| 4.8 | `cutscene-act-old-quarter.jpg` | Old Quarter | III-2 |
| 4.9 | `cutscene-act-the-grid.jpg` | The Grid | III-3 |
| 4.10 | `cutscene-act-the-breach.jpg` | The Breach | Cuối |

**KHỐI PHONG CÁCH CHO CẢ MỤC 4** — dán vào đầu mỗi PROMPT bên dưới:

```
STYLE: painted cinematic establishing shot, 16:9 ratio, dark tactical game illustration. Moody dramatic lighting, strong silhouettes, painterly yet crisp cel-shaded feel. Ruined post-apocalyptic atmosphere, cold blue-grey shadows contrasted with warm glow accents. NO characters, NO creatures, NO speech bubbles, NO text baked into the art. Wide desolate landscape, epic scope.

COMPOSITION NOTE: this is a DARKENED BACKDROP behind UI text. Keep the CENTRE of the frame open and low-contrast; put all detail in the outer thirds and along the horizon.
```

* **4.1 Verdant Reach** — `PROMPT: Wide shot of an overgrown suburban valley swallowed by enormous mutated forest growth. Vines strangle collapsed Greenspires, giant fern canopies block out the sky, shafts of green-gold light break through the mist. Empty, ancient, oppressive scale.`
* **4.2 Goldacre** — `PROMPT: Wide shot of vast golden wheat farmland at dusk, cut through by a cratered highway. Broken grain silos and a toppled water tower on the horizon, scorch marks and shell holes across the fields. Warm amber sky, long shadows, ruined abundance.`
* **4.3 Kiln Row** — `PROMPT: Wide shot of an industrial brick-kiln and foundry district at night, rivers of glowing orange magma running through cracked ground between the furnace stacks. Heat haze, ember showers, heavy black smoke against a red-lit sky.`
* **4.4 Windward** — `PROMPT: Wide shot of a storm-battered coastal harbour, shattered piers and half-sunken cargo ships listing in grey water. Torn cargo balloons and airship rigging tangled in the dockside cranes. Cold slate-blue sea, driving wind, no birds.`
* **4.5 Thornwaste** — `PROMPT: Wide shot of red desert badlands where colossal black thorn spires erupt from the dunes. Bleached bones and half-buried ruins between them, sand streaming off the ridges in a hot wind. Harsh orange sky, deep purple shadow.`
* **4.6 Frostgate** — `PROMPT: Wide shot of a massive frozen fortress gateway carved into a glacier wall, its portcullis sealed behind a solid sheet of blue ice. Frozen banners, drifting blizzard, aurora glow above the ice cliffs. Cold cyan and white, near-monochrome.`
* **4.7 Neon Rose** — `PROMPT: Wide shot of a rain-soaked entertainment district at night, towering pink and magenta neon signage half-shattered and flickering. Wet reflective streets, fallen stage rigging and scattered mirror-ball shards. Saturated pink-violet glow against black.`
* **4.8 Old Quarter** — `PROMPT: Wide shot of a narrow cobblestone old-town district under fog, leaning stone townhouses and a great cracked clock tower frozen at one time. Brass gears and clockwork debris scattered through the streets. Muted sepia and slate, gaslight halos.`
* **4.9 The Grid** — `PROMPT: Wide shot of a vast electrical substation and pylon field at night, arcs of blue lightning jumping between damaged transformers. Cables torn loose and whipping, warning lamps strobing. Electric blue and cold white, everything else in silhouette.`
* **4.10 The Breach** — `PROMPT: Wide shot of an enormous circular crater torn into the heart of a dead city, a pitch-black portal churning at its base with sick green light bleeding upward. A ring of toppled skyscrapers leans inward toward it, debris hanging in the air. Apocalyptic, final, silent.`
