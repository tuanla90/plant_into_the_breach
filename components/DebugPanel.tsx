import React, { useEffect, useState } from 'react';
import { BossId, ElementId, HeroId, ItemDefinition, MapNode, UnlockState, WorldType } from '../types';
import { BOSSES } from '../data/unlocks';
import { HERO_DEFINITIONS } from '../data/heroes';
import { SQUAD_SIZE } from '../constants';
import { ELEMENTS, ELEMENT_DEFINITIONS } from '../utils/elements';
import { Bug, X, Unlock, RotateCcw, Swords, Skull, Crown, Coins, Heart, Sun, Trophy, Users, Backpack, Ban } from 'lucide-react';
import { useI18n } from '../i18n';

/** What "jump into a fight" needs. Mirrors the fields a real MapNode carries. */
export interface DebugJump {
    type: 'BATTLE' | 'ELITE' | 'BOSS';
    world: WorldType;
    /** Map layer 1-10. Drives enemy tiers, event tiers and the encounter budget. */
    depth: number;
    bossId?: BossId;
}

interface DebugPanelProps {
    unlocks: UnlockState | null;
    /** Heroes currently registered to the run, so the panel can say what it will deploy. */
    squad: HeroId[];
    onClose: () => void;
    onUnlockAll: () => void;
    onResetProgress: () => void;
    onJump: (jump: DebugJump) => void;
    onGrantCoin: () => void;
    onGrantSun: () => void;
    onHealSquad: () => void;
    /** Which heroes the jump will actually deploy if the run has no squad yet. */
    fallbackSquad: HeroId[];

    /** Đang ở trong trận — chỉ khi đó nút "thắng luôn" mới có nghĩa. */
    inCombat: boolean;
    /** Quét sạch địch và lật sang màn Chiến Thắng, đi đúng đường thưởng thường ngày. */
    onWinBattle: () => void;

    /** Nguyên tố đang gắn cho từng hero trong lượt chơi này. */
    heroElements: Partial<Record<HeroId, ElementId>>;
    /** Thay cả đội (kèm nguyên tố) mà KHÔNG sinh lại bản đồ. */
    onSetSquad: (heroIds: HeroId[], elements: Partial<Record<HeroId, ElementId>>) => void;

    /** Toàn bộ vật phẩm trong game, kể cả thứ save chưa mở khoá. */
    itemDefs: ItemDefinition[];
    /** Túi đồ hiện tại (mảng id, cho phép trùng — mỗi bản là một lần dùng). */
    inventory: string[];
    onSetInventory: (ids: string[]) => void;
}

const WORLDS: WorldType[] = ['GRASS', 'ICE', 'VOLCANO', 'DESERT'];
const TYPES: Array<{ id: DebugJump['type']; icon: React.ReactNode; label: string }> = [
    { id: 'BATTLE', icon: <Swords size={14} />, label: 'Skirmish' },
    { id: 'ELITE',  icon: <Skull size={14} />,  label: 'Elite Threat' },
    { id: 'BOSS',   icon: <Crown size={14} />,  label: 'Sector Boss' },
];

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex items-center gap-3">
        <span className="w-24 shrink-0 text-[10px] uppercase tracking-widest text-gray-500">{label}</span>
        <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
);

const Chip: React.FC<{ on: boolean; onClick: () => void; disabled?: boolean; title?: string; children: React.ReactNode }> = ({ on, onClick, disabled, title, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-widest transition-colors
            ${disabled ? 'border-[#1c1f27] text-gray-700 bg-black/40 cursor-not-allowed' : on
                ? 'border-fuchsia-400 text-fuchsia-200 bg-fuchsia-950'
                : 'border-[#2b303b] text-gray-400 bg-black/40 hover:border-gray-500 hover:text-gray-200'}`}
    >
        {children}
    </button>
);

/** Chữ ký ổn định của map nguyên tố, để so "nháp có khác đội thật không" mà không so sâu. */
const ELEMENT_SIGNATURE = (map: Partial<Record<HeroId, ElementId>>): string =>
    Object.entries(map).filter(([, v]) => !!v).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join('|');

/**
 * DEV CONSOLE. Opened with F9 from any screen, and only mounted when `import.meta.env.DEV`
 * is true — so it costs a shipped build nothing.
 *
 * The jump builds a SYNTHETIC MAP and then calls the ordinary `selectNode`, rather than
 * assembling a fight of its own. That is deliberate and is the whole reason it can be
 * trusted: depth is read off the map graph (`layerOfNode` counts distinct node rows), so a
 * debug fight that skipped the map would have to re-derive tiers, mission, hazard and Sun
 * by hand, and would drift from the real thing exactly when you most need it not to.
 */
export const DebugPanel: React.FC<DebugPanelProps> = ({
    unlocks, squad, onClose, onUnlockAll, onResetProgress, onJump,
    onGrantCoin, onGrantSun, onHealSquad, fallbackSquad,
    inCombat, onWinBattle, heroElements, onSetSquad,
    itemDefs, inventory, onSetInventory,
}) => {
    const { t } = useI18n();
    const [type, setType] = useState<DebugJump['type']>('BATTLE');
    const [world, setWorld] = useState<WorldType>('GRASS');
    const [depth, setDepth] = useState(1);
    const [bossId, setBossId] = useState<BossId>(BOSSES[0].id);

    const heroTotal = Object.keys(HERO_DEFINITIONS).length;
    const deploying = squad.length ? squad : fallbackSquad;

    /**
     * ĐỘI HÌNH NHÁP — chọn ở đây, chỉ đổi thật khi bấm "Đổi đội".
     *
     * Nháp chứ không sửa thẳng: đổi đội là dựng lại toàn bộ unit, làm điều đó sau MỖI cú
     * bấm chip nghĩa là đi từ đội A sang đội B phải nuốt hai lần thay quân dở dang.
     * Mở panel ra thì nháp bằng đội đang đánh, nên bấm nhầm không mất gì.
     */
    const roster = Object.keys(HERO_DEFINITIONS) as HeroId[];
    const [draftSquad, setDraftSquad] = useState<HeroId[]>(() => (squad.length ? squad : fallbackSquad).slice(0, SQUAD_SIZE));
    const [draftElements, setDraftElements] = useState<Partial<Record<HeroId, ElementId>>>(heroElements);
    // Panel sống suốt phiên (F9 chỉ ẩn/hiện), nên nháp phải bám theo đội thật mỗi lần đội
    // đổi ở nơi khác — không thì mở lại vẫn thấy đội của ba lần jump trước.
    useEffect(() => {
        setDraftSquad((squad.length ? squad : fallbackSquad).slice(0, SQUAD_SIZE));
        setDraftElements(heroElements);
        // squad.join: mảng dựng mới mỗi lần render, so bằng tham chiếu thì effect chạy vô tận.
    }, [squad.join(','), fallbackSquad.join(',')]);

    const toggleHero = (id: HeroId) => setDraftSquad(prev =>
        prev.includes(id)
            ? prev.filter(h => h !== id)
            : prev.length >= SQUAD_SIZE ? prev : [...prev, id]);

    const pickElement = (id: HeroId, element?: ElementId) => setDraftElements(prev => {
        if (!element) { const { [id]: _drop, ...rest } = prev; return rest; }
        return { ...prev, [id]: element };
    });

    const squadChanged = draftSquad.join(',') !== (squad.length ? squad : fallbackSquad).slice(0, SQUAD_SIZE).join(',')
        || ELEMENT_SIGNATURE(draftElements) !== ELEMENT_SIGNATURE(heroElements);

    /** Bao nhiêu bản của món này đang nằm trong túi. Túi cho phép trùng: mỗi bản một lần dùng. */
    const countOf = (id: string) => inventory.filter(i => i === id).length;

    return (
        <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 font-pixel">
            <div className="w-full max-w-[560px] my-auto bg-[#0f1117] border-2 border-fuchsia-600 rounded-lg shadow-[0_0_40px_rgba(192,38,211,0.25)]">

                <div className="flex items-center justify-between px-4 py-3 border-b border-fuchsia-900 bg-fuchsia-950/40">
                    <span className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-fuchsia-300">
                        <Bug size={16} /> {t('Debug Console')}
                    </span>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10">
                        <X size={16} />
                    </button>
                </div>

                {/* --- PROGRESS ------------------------------------------------------- */}
                <div className="p-4 border-b border-[#1c1f27] flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">{t('Progress')}</span>
                        <span className="text-[10px] font-mono text-gray-500">
                            {t('Heroes')} {unlocks?.heroes.length ?? 0}/{heroTotal}
                            {'  ·  '}
                            {t('Recipes')} {unlocks?.recipes.length ?? 0}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={onUnlockAll}
                            className="flex items-center gap-2 px-3 py-2 rounded border border-emerald-500 text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900 text-[11px] font-bold uppercase tracking-widest"
                        >
                            <Unlock size={13} /> {t('Unlock everything')}
                        </button>
                        <button
                            onClick={onResetProgress}
                            className="flex items-center gap-2 px-3 py-2 rounded border border-[#2b303b] text-gray-400 hover:text-red-200 hover:border-red-600 text-[11px] font-bold uppercase tracking-widest"
                        >
                            <RotateCcw size={13} /> {t('Reset progress')}
                        </button>
                    </div>
                    <p className="text-[10px] leading-snug text-gray-600 normal-case tracking-normal">
                        {t('Unlocking writes the real save, so the roster and the Archive both update. Reset puts it back to a new game.')}
                    </p>
                </div>

                {/* --- RUN RESOURCES -------------------------------------------------- */}
                <div className="p-4 border-b border-[#1c1f27] flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">{t('This run')}</span>
                    <div className="flex flex-wrap gap-2">
                        <Chip on={false} onClick={onGrantCoin}><Coins size={12} /> +500</Chip>
                        <Chip on={false} onClick={onGrantSun}><Sun size={12} /> +200</Chip>
                        <Chip on={false} onClick={onHealSquad}><Heart size={12} /> {t('Heal + revive squad')}</Chip>
                        {/* Chỉ sáng khi đang thực sự đánh nhau: ngoài trận thì không có trận
                            nào để thắng, và một nút bấm-không-làm-gì là nút gây nghi ngờ. */}
                        <Chip
                            on={false}
                            disabled={!inCombat}
                            onClick={onWinBattle}
                            title={inCombat ? t('Clears the board and opens the victory screen with the real rewards.') : t('Only inside a battle.')}
                        >
                            <Trophy size={12} /> {t('Win this battle')}
                        </Chip>
                    </div>
                </div>

                {/* --- ĐỘI HÌNH ------------------------------------------------------- */}
                <div className="p-4 border-b border-[#1c1f27] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                            <Users size={12} /> {t('Squad')}
                        </span>
                        <span className="text-[10px] font-mono text-gray-500">{draftSquad.length}/{SQUAD_SIZE}</span>
                    </div>

                    {/* Cả chín hero, kể cả hero save chưa mở khoá — panel này để THỬ, và thứ
                        đáng thử nhất thường là hero chưa tới lượt mở. */}
                    <div className="flex flex-wrap gap-1.5">
                        {roster.map(id => {
                            const picked = draftSquad.includes(id);
                            return (
                                <Chip
                                    key={id}
                                    on={picked}
                                    disabled={!picked && draftSquad.length >= SQUAD_SIZE}
                                    onClick={() => toggleHero(id)}
                                    title={unlocks?.heroes.includes(id) ? undefined : t('Locked in the save — usable here anyway.')}
                                >
                                    {t(HERO_DEFINITIONS[id].name)}
                                </Chip>
                            );
                        })}
                    </div>

                    {/* Nguyên tố cho từng hero ĐÃ chọn — đây là chỗ thử cộng hưởng (cả ba
                        cùng một nguyên tố) mà không phải chơi lại từ màn chọn hero. */}
                    {draftSquad.map(id => (
                        <div key={id} className="flex items-center gap-2">
                            <span className="w-28 shrink-0 truncate text-[10px] uppercase tracking-wider text-gray-400">
                                {t(HERO_DEFINITIONS[id].name)}
                            </span>
                            <div className="flex flex-wrap gap-1">
                                <Chip on={!draftElements[id]} onClick={() => pickElement(id, undefined)}>
                                    <Ban size={10} /> {t('Base')}
                                </Chip>
                                {ELEMENTS.map(el => (
                                    <Chip key={el} on={draftElements[id] === el} onClick={() => pickElement(id, el)}>
                                        {t(ELEMENT_DEFINITIONS[el].name)}
                                    </Chip>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onSetSquad(draftSquad, draftElements)}
                            disabled={draftSquad.length === 0 || !squadChanged}
                            className={`px-3 py-2 rounded border text-[11px] font-bold uppercase tracking-widest
                                ${draftSquad.length === 0 || !squadChanged
                                    ? 'border-[#1c1f27] text-gray-700 cursor-not-allowed'
                                    : 'border-sky-500 text-sky-200 bg-sky-950/60 hover:bg-sky-900'}`}
                        >
                            {t('Swap squad')}
                        </button>
                        <span className="text-[10px] text-gray-600 normal-case tracking-normal">
                            {t('Keeps the map and the run. Heroes come back at full health; from a battle it drops you on the map.')}
                        </span>
                    </div>
                </div>

                {/* --- TÚI ĐỒ ---------------------------------------------------------- */}
                <div className="p-4 border-b border-[#1c1f27] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                            <Backpack size={12} /> {t('Inventory')}
                        </span>
                        <button
                            onClick={() => onSetInventory([])}
                            disabled={inventory.length === 0}
                            className={`text-[10px] uppercase tracking-widest ${inventory.length === 0 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-500 hover:text-red-300'}`}
                        >
                            {t('Empty the bag')}
                        </button>
                    </div>
                    {/* Bấm = thêm một bản, bấm phải = bớt một bản. Túi cho phép trùng vì mỗi
                        bản là MỘT lần dùng — muốn thử combo "hai Anh Đào liên tiếp" thì phải
                        có hai bản, không phải một cái cờ bật/tắt. */}
                    <div className="flex flex-wrap gap-1.5">
                        {itemDefs.map(item => {
                            const n = countOf(item.id);
                            return (
                                <Chip
                                    key={item.id}
                                    on={n > 0}
                                    onClick={() => onSetInventory([...inventory, item.id])}
                                    title={t('Click adds one, right-click removes one.')}
                                >
                                    <span
                                        onContextMenu={e => {
                                            e.preventDefault();
                                            const at = inventory.lastIndexOf(item.id);
                                            if (at >= 0) onSetInventory(inventory.filter((_, i) => i !== at));
                                        }}
                                        className="flex items-center gap-1.5"
                                    >
                                        <img src={item.imgUrl} alt="" className="w-4 h-4 object-contain" />
                                        {t(item.name)}{n > 1 ? ` ×${n}` : ''}
                                    </span>
                                </Chip>
                            );
                        })}
                    </div>
                    <p className="text-[10px] leading-snug text-gray-600 normal-case tracking-normal">
                        {t('Relics do not exist in the game yet — when they do, they belong in this section.')}
                    </p>
                </div>

                {/* --- JUMP INTO A FIGHT ---------------------------------------------- */}
                <div className="p-4 flex flex-col gap-3">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">{t('Jump into a fight')}</span>

                    <Row label={t('Type')}>
                        {TYPES.map(o => (
                            <Chip key={o.id} on={type === o.id} onClick={() => setType(o.id)}>
                                {o.icon}{t(o.label)}
                            </Chip>
                        ))}
                    </Row>

                    <Row label={t('World')}>
                        {WORLDS.map(w => (
                            <Chip key={w} on={world === w} onClick={() => setWorld(w)}>{w}</Chip>
                        ))}
                    </Row>

                    {/* Depth IS the act: the generator builds ten layers and the sector seams
                        sit at 3 and 6, so this slider is what "which act" means today. */}
                    <Row label={t('Depth')}>
                        <input
                            type="range" min={1} max={10} value={depth}
                            onChange={e => setDepth(Number(e.target.value))}
                            className="w-40 accent-fuchsia-500"
                        />
                        <span className="text-[11px] font-mono text-fuchsia-300 w-16">
                            {t('Layer')} {depth}
                        </span>
                        <span className="text-[10px] text-gray-600 normal-case tracking-normal">
                            {depth <= 3 ? t('Act I') : depth <= 6 ? t('Act II') : t('Act III')}
                        </span>
                    </Row>

                    {type === 'BOSS' && (
                        <Row label={t('Boss')}>
                            <select
                                value={bossId}
                                onChange={e => setBossId(e.target.value as BossId)}
                                className="bg-black/60 border border-[#2b303b] rounded px-2 py-1 text-[11px] text-gray-200 max-w-[300px]"
                            >
                                {BOSSES.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.name} — {b.city}{b.hero ? ` (${HERO_DEFINITIONS[b.hero].name})` : ''}
                                    </option>
                                ))}
                            </select>
                        </Row>
                    )}

                    <div className="flex items-center gap-3 pt-1">
                        <button
                            onClick={() => onJump({ type, world, depth, bossId: type === 'BOSS' ? bossId : undefined })}
                            className="px-4 py-2 rounded bg-fuchsia-700 hover:bg-fuchsia-600 border-b-4 border-fuchsia-900 active:border-b-0 active:translate-y-1 text-white text-[11px] font-black uppercase tracking-widest"
                        >
                            {t('Enter fight')}
                        </button>
                        <span className="text-[10px] text-gray-500 normal-case tracking-normal">
                            {t('Deploying:')}{' '}
                            <span className="text-gray-300">{deploying.map(h => t(HERO_DEFINITIONS[h].name)).join(', ') || '—'}</span>
                        </span>
                    </div>
                    <p className="text-[10px] leading-snug text-gray-600 normal-case tracking-normal">
                        {t('The jump builds a throwaway map at that depth and enters the node normally, so tiers, mission and rewards behave exactly as in a real run.')}
                    </p>
                </div>

                <div className="px-4 py-2 border-t border-[#1c1f27] text-[10px] uppercase tracking-widest text-gray-600">
                    {t('F9 closes this')}
                </div>
            </div>
        </div>
    );
};

/**
 * The throwaway map a jump runs on. `layerOfNode` derives depth by counting DISTINCT node
 * rows and finding this node's index among them, so producing "layer N" means producing N
 * distinct rows — not setting a number. Hence a real little chain rather than a lone node.
 */
export const buildDebugMap = (jump: DebugJump): { nodes: MapNode[]; target: MapNode } => {
    const nodes: MapNode[] = [];
    for (let i = 1; i <= jump.depth; i++) {
        const last = i === jump.depth;
        nodes.push({
            id: `dbg-${i}`,
            x: 50,
            // Spread down the column the same way GENERATE_MAP does, so the rows are
            // distinct and ordered; only the count matters to layerOfNode.
            y: 90 - ((i - 1) * (80 / Math.max(1, jump.depth))),
            type: last ? jump.type : 'BATTLE',
            world: jump.world,
            status: last ? 'AVAILABLE' : 'COMPLETED',
            next: last ? [] : [`dbg-${i + 1}`],
            ...(last && jump.bossId ? { bossId: jump.bossId } : {}),
        });
    }
    return { nodes, target: nodes[nodes.length - 1] };
};
