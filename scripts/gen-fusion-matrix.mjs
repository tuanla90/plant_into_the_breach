/**
 * SINH LẠI KHỐI DỮ LIỆU TRONG fusion-matrix.html TỪ NGUỒN THẬT.
 *
 * Vì sao có file này ([A3] trong PLAN-fusion-unique.md): fusion-matrix.html từng là **bản chép
 * tay thứ hai** của ma trận. Footer nó ghi "Data Synced 100%" trong khi thực tế đã trôi — 7 ô
 * dùng id sai (`MAT_SPIKE_ARMOR` không tồn tại) nên render ra "Chưa rõ", và 3 ô kể một hiệu ứng
 * khác hẳn TS. Hai bản chép tay thì luôn có một bản sai; đây là bản được sinh ra.
 *
 * Nguồn: `data/fusionRecipes.ts` (dữ liệu) + `data/materials.ts` (tên gear) + `i18n/vi.ts`
 * (bản dịch — HTML hiển thị tiếng Việt).
 *
 * Nó cũng KIỂM TOÁN luôn: mỗi effect type được quét khắp `utils/ hooks/ components/ App.tsx`;
 * type nào không nơi nào đọc thì ô đó bị đánh dấu `dead: true` và hiện cảnh báo trong bảng.
 * Đó đúng là phép đếm của [A7], chạy tự động thay vì rà tay.
 *
 * Chạy tay khi cần, KHÔNG nằm trong build:  node scripts/gen-fusion-matrix.mjs
 */
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const CACHE = path.join(ROOT, 'node_modules', '.cache', 'gen-fusion');
const HTML = path.join(ROOT, 'fusion-matrix.html');

/** Nạp một module TS thật bằng cách bundle qua esbuild rồi import — không cần runner TS. */
async function loadTs(entry, name) {
    const outfile = path.join(CACHE, `${name}.mjs`);
    await build({
        entryPoints: [path.join(ROOT, entry)],
        outfile, bundle: true, format: 'esm', platform: 'node',
        logLevel: 'silent', legalComments: 'none',
    });
    return import(pathToFileURL(outfile).href + `?t=${Date.now()}`);
}

/** Những nơi engine ĐỌC hiệu ứng. types.ts (khai) và fusionRecipes.ts (cấp) không tính. */
function engineSources() {
    const dirs = ['utils', 'hooks', 'components'];
    const files = [];
    for (const d of dirs) {
        const abs = path.join(ROOT, d);
        if (!fs.existsSync(abs)) continue;
        for (const f of fs.readdirSync(abs)) {
            if (/\.tsx?$/.test(f)) files.push(path.join(abs, f));
        }
    }
    for (const f of ['App.tsx', 'index.tsx']) {
        const abs = path.join(ROOT, f);
        if (fs.existsSync(abs)) files.push(abs);
    }
    return files.map(f => fs.readFileSync(f, 'utf8')).join('\n');
}

const [recipes, materials, i18n] = await Promise.all([
    loadTs('data/fusionRecipes.ts', 'recipes'),
    loadTs('data/materials.ts', 'materials'),
    loadTs('i18n/vi.ts', 'vi'),
]);

const FUSION_RECIPES = recipes.FUSION_RECIPES;
const MATERIAL_DEFINITIONS = materials.MATERIAL_DEFINITIONS;
const VI = i18n.vi ?? i18n.default ?? i18n.VI ?? {};
const tr = s => VI[s] ?? s;

const engine = engineSources();
const isRead = type => new RegExp(`['"\`]${type}['"\`]`).test(engine);

const heroIds = Object.keys(FUSION_RECIPES);
const matIds = Object.keys(MATERIAL_DEFINITIONS);

// --- kiểm toán [A7] ---
const usedTypes = new Set();
for (const h of heroIds) for (const m of matIds) usedTypes.add(FUSION_RECIPES[h][m].effect.type);
const deadTypes = new Set([...usedTypes].filter(t => !isRead(t)));

const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

/**
 * Emoji cho cột — thuần TRÌNH BÀY, không có trong `data/materials.ts` (ở đó gear dùng sprite
 * thật `imgUrl`). Để ở đây vì bảng HTML là công cụ đọc nhanh, không phải game.
 */
const GEAR_ICONS = {
    MAT_SUNBLOOM: '☀️', MAT_PEABURST: '🌱', MAT_SNAPMAW: '🦷',
    MAT_IRONHUSK: '🛡️', MAT_CORNOVA: '🌽', MAT_REEDWING: '🪶',
    MAT_THORNSHELL: '🌵', MAT_CHARDSLAM: '🦾', MAT_GOURDWARD: '🎃',
};

// --- kiểm toán bản dịch: chuỗi nào chưa có trong i18n/vi.ts ---
const untranslated = [];
const trAudit = (s, where) => { const v = VI[s]; if (v === undefined) untranslated.push(where); return v ?? s; };

// --- khối GEARS ---
const gearLines = matIds.map(id => {
    const d = MATERIAL_DEFINITIONS[id];
    const owner = id.replace(/^MAT_/, '');
    const ownerName = owner.charAt(0) + owner.slice(1).toLowerCase();
    return `        { id: '${id}', name: '${esc(tr(d.name))}', owner: '${ownerName}', icon: '${GEAR_ICONS[id] ?? '🔧'}' },`;
});

// --- khối RECIPES ---
const recipeLines = [];
for (const h of heroIds) {
    recipeLines.push(`        // ${h}`);
    for (const m of matIds) {
        const r = FUSION_RECIPES[h][m];
        const own = m === `MAT_${h}`;
        const dead = deadTypes.has(r.effect.type) || r.live === false;
        const flags = [own ? `type: 'SIG'` : `type: ''`, `effect: '${r.effect.type}'`];
        if (dead) flags.push('dead: true');
        recipeLines.push(
            `        '${h}:${m}': { ${flags.join(', ')}, title: '${esc(trAudit(r.name, `${h}:${m} (tên)`))}', desc: '${esc(trAudit(r.description, `${h}:${m} (mô tả)`))}' },`
        );
    }
    recipeLines.push('');
}
if (recipeLines.at(-1) === '') recipeLines.pop();

// --- ghép vào HTML, giữ nguyên line ending của file ---
let html = fs.readFileSync(HTML, 'utf8');
const EOL = html.includes('\r\n') ? '\r\n' : '\n';
const norm = html.split(/\r?\n/);

function splice(lines, startRe, endLine, body) {
    const s = lines.findIndex(l => startRe.test(l));
    if (s < 0) throw new Error(`không tìm thấy mốc ${startRe}`);
    let e = -1;
    for (let i = s + 1; i < lines.length; i++) if (lines[i] === endLine) { e = i; break; }
    if (e < 0) throw new Error(`không tìm thấy kết thúc "${endLine}" sau dòng ${s + 1}`);
    return [...lines.slice(0, s + 1), ...body, ...lines.slice(e)];
}

let out = splice(norm, /^\s*const GEARS = \[/, '    ];', gearLines);
out = splice(out, /^\s*const RECIPES = \{/, '    };', recipeLines);

fs.mkdirSync(CACHE, { recursive: true });
fs.writeFileSync(HTML, out.join(EOL), 'utf8');

console.log(`fusion-matrix.html đã sinh lại:`);
console.log(`  ${heroIds.length} hero × ${matIds.length} gear = ${heroIds.length * matIds.length} ô`);
console.log(`  ${usedTypes.size} effect type đang dùng`);
if (deadTypes.size) {
    console.log(`  ⚠ ${deadTypes.size} type KHÔNG có nơi nào trong engine đọc (bị đánh dấu dead trong bảng):`);
    for (const t of [...deadTypes].sort()) console.log(`      ${t}`);
} else {
    console.log(`  ✓ mọi type đều có ít nhất một nơi đọc`);
}
if (untranslated.length) {
    console.log(`  ⚠ ${untranslated.length}/${heroIds.length * matIds.length * 2} chuỗi CHƯA có trong i18n/vi.ts (bảng sẽ hiện tiếng Anh):`);
    for (const w of untranslated) console.log(`      ${w}`);
} else {
    console.log(`  ✓ 81 tên + 81 mô tả đều có bản dịch`);
}
