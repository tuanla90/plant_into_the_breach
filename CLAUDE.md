# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Tài liệu dự án (DESIGN.md, PLAN-*.md) viết bằng tiếng Việt — trao đổi với người dùng bằng tiếng Việt.

## Lệnh

```bash
npm run dev        # Vite dev server, port 3000 (Claude Code preview dùng .claude/launch.json, port 3100)
npm run build      # build production vào dist/
npm run typecheck  # tsc --noEmit — chạy sau mỗi thay đổi; đây là "test" chính của repo
```

- **Không có test runner.** Kiểm chứng gồm hai tầng: `npm run typecheck`, và `data/tutorial.assert.ts` — bộ assertion + replay 7 màn tutorial, chỉ chạy ở chế độ dev (nạp từ `index.tsx` qua `import.meta.env.DEV`, mở app dev lên là nó tự chạy, lỗi hiện trong console).
- README.md là scaffold cũ của AI Studio — `GEMINI_API_KEY` trong `.env.local` không được dùng ở đâu cả, bỏ qua.

## Kiến trúc

React 19 + Vite + TypeScript, không dùng thư viện state/router nào. Alias `@/*` trỏ về gốc repo.

**Luồng chính:** `index.tsx` → `App.tsx` (~1.700 dòng) render màn hình theo `gameState.screen` (`START_MENU`, `TUTORIAL`, `SQUAD_SELECT`, `MAP`, `SHOP`, `EVENT`, `COMBAT`, `VICTORY`, `GAME_OVER`). App.tsx là orchestrator duy nhất; mọi màn hình trong `components/` là con của nó.

**Thứ tự khởi động quan trọng:** `initBalance()` được gọi ngay đầu `index.tsx`, TRƯỚC khi render — nó ghi các số liệu cân bằng (localStorage) đè lên các bảng dữ liệu module-level mà nửa codebase import trực tiếp. Không chuyển nó vào component/effect.

**Hai hook, hai vai trò** (`hooks/`):
- `useGameEngine` — state trong trận: board, units, projectiles, animation. Tốc độ/skip animation nằm trong ref để vòng lặp async đang chạy thấy thay đổi ngay (tránh stale closure — pattern lặp lại nhiều lần trong file này).
- `useGameProgression` — state của cả run: map, shop, event, unlock, fusion, hồi sinh hero.

**Logic thuần nằm trong `utils/`, tách khỏi React:**
- `turnManager.processTurn()` — mô phỏng thuần một lượt địch, trả về `TurnAction[]`; engine chỉ việc phát lại danh sách action đó thành animation. Sửa luật chơi ở đây, không sửa trong hook.
- `gameLogic.ts` (targeting/path/damage), `aiLogic.ts` (intent của địch), `fusion.ts`, `encounterBuilder.ts`, `unlockLogic.ts`, `unitFactory.ts`, `skillFactory.ts`/`skillResolution.ts`.

**Dữ liệu tĩnh trong `data/`:** heroes, plants, zombies, skills, fusionRecipes, unlocks, tutorial, missions... Thêm nội dung game = thêm entry vào các bảng này; `types.ts` và `constants.ts` giữ type + hằng số cân bằng (có chú thích lý do từng con số).

**Persistence — 3 vùng localStorage, đừng lẫn** (lý do ghi trong từng file):
- `utils/persistence.ts`: `pitb_config_v1` (config admin, xóa thoải mái) tách riêng khỏi `pitb_progress_v1` (**tiến trình mở khóa của người chơi — không được làm mất**).
- `utils/runPersistence.ts`: `pitb_run_v1` — snapshot run tại điểm an toàn (map/shop/event), cố ý KHÔNG lưu giữa trận.
- `utils/balance.ts`: `pitb_balance_v1` — chỉ lưu số (`path -> number`), không lưu object; đó là quyết định chống bug stale-data, đọc chú thích đầu file trước khi mở rộng.

**i18n:** chuỗi tiếng Anh trong code chính là key; `i18n/vi.ts` map EN → VI, thiếu key thì fallback tiếng Anh. Mọi chuỗi hiển thị phải đi qua `t()` và có entry trong `vi.ts`; giữ nguyên placeholder dạng `{cost}`.

## Tài liệu thiết kế

- `DESIGN.md` — thiết kế lõi (brain, hai loại tiền Sun/Coin, fusion, unlock). Đọc phần liên quan trước khi đổi luật chơi hay số cân bằng.
- `PLAN-pack-N-*.md` — mỗi gói mở khóa một file kế hoạch; file ghi rõ đã triển khai tới đâu và khác kế hoạch chỗ nào.
- `art-src/ART-TODO.md` — quy trình thay placeholder art (512×512, nền trong suốt, dark tactical chibi). **Art PvZ gốc trong `art-src/removed-pvz-art/` chỉ để tham khảo, tuyệt đối không đưa lại vào `public/`.**
- `CREDITS.md` — icon từ game-icons.net (CC BY 3.0): dùng icon mới thì thêm attribution vào đây.
