import React, { useState } from 'react';
import { BossId, HeroId, MapNode, UnlockState, WorldType } from '../types';
import { BOSSES } from '../data/unlocks';
import { HERO_DEFINITIONS } from '../data/heroes';
import { Bug, X, Unlock, RotateCcw, Swords, Skull, Crown, Coins, Heart, Sun } from 'lucide-react';
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

const Chip: React.FC<{ on: boolean; onClick: () => void; children: React.ReactNode }> = ({ on, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-widest transition-colors
            ${on
                ? 'border-fuchsia-400 text-fuchsia-200 bg-fuchsia-950'
                : 'border-[#2b303b] text-gray-400 bg-black/40 hover:border-gray-500 hover:text-gray-200'}`}
    >
        {children}
    </button>
);

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
}) => {
    const { t } = useI18n();
    const [type, setType] = useState<DebugJump['type']>('BATTLE');
    const [world, setWorld] = useState<WorldType>('GRASS');
    const [depth, setDepth] = useState(1);
    const [bossId, setBossId] = useState<BossId>(BOSSES[0].id);

    const heroTotal = Object.keys(HERO_DEFINITIONS).length;
    const deploying = squad.length ? squad : fallbackSquad;

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
                    </div>
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
