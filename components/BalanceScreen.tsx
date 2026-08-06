import React, { useMemo, useState } from 'react';
import { X, RotateCcw, Save, Search, SlidersHorizontal, Share2 } from 'lucide-react';
import {
    balanceFields, loadBalance, saveBalance, applyBalance, changedFields, exportBalance, importBalance,
    type BalanceConfig, type BalanceField,
} from '../utils/balance';
import { useI18n } from '../i18n';

/**
 * The stat-balancing screen. Every row is one number.
 *
 * It is GENERATED from `balanceFields()` rather than hand-written, which is the fix for what
 * killed the screen it replaces: that one listed its fields by hand and had drifted far
 * behind the data it claimed to edit — heroes, materials and half the Sol economy were
 * simply unreachable from it, while several fields it did show were silently discarded on
 * reload. Here a hero added tomorrow appears with no edit to this file.
 *
 * Every row shows current, authored default, and the delta. When you are balancing, the
 * question is never "what is this value" — it is "what have I already changed", which is
 * also why the CHANGED group is pinned to the top of the list.
 */
export const BalanceScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useI18n();
    const fields = useMemo(() => balanceFields(), []);
    const [config, setConfig] = useState<BalanceConfig>(loadBalance);
    const [query, setQuery] = useState('');
    const [group, setGroup] = useState<string>('__CHANGED__');
    const [saved, setSaved] = useState(false);

    const groups = useMemo(() => {
        const seen: string[] = [];
        fields.forEach(f => { if (!seen.includes(f.group)) seen.push(f.group); });
        return seen;
    }, [fields]);

    const changed = changedFields(config);
    const valueOf = (f: BalanceField) => config[f.path] ?? f.def;

    const setValue = (f: BalanceField, raw: string) => {
        setSaved(false);
        const n = Number(raw);
        setConfig(prev => {
            const next = { ...prev };
            // An empty or nonsense box means "no override", not zero — typing over a value
            // would otherwise briefly set the stat to 0 and rebuild the row from that.
            if (raw.trim() === '' || !Number.isFinite(n)) delete next[f.path];
            else next[f.path] = Math.min(f.max, Math.max(f.min, n));
            return next;
        });
    };

    const resetOne = (f: BalanceField) => {
        setSaved(false);
        setConfig(prev => { const next = { ...prev }; delete next[f.path]; return next; });
    };

    const resetGroup = (g: string) => {
        setSaved(false);
        setConfig(prev => {
            const next = { ...prev };
            fields.filter(f => f.group === g).forEach(f => delete next[f.path]);
            return next;
        });
    };

    const commit = () => {
        saveBalance(config);
        // Applied straight into the data tables so the NEXT battle is built from the new
        // numbers. Units already standing on a board keep the stats they were built with —
        // rewriting a fight in progress would desync hp against maxHp.
        applyBalance(config);
        setSaved(true);
    };

    // --- share a tuning pass ---
    const [transferOpen, setTransferOpen] = useState(false);
    const [transferText, setTransferText] = useState('');
    const [transferNote, setTransferNote] = useState<string | null>(null);

    const openTransfer = () => {
        setTransferText(exportBalance(config));
        setTransferNote(null);
        setTransferOpen(true);
    };

    const doImport = () => {
        const result = importBalance(transferText);
        if (!result) { setTransferNote(t('That is not valid JSON.')); return; }
        setConfig(result.config);
        setSaved(false);
        // Rejections are shown, never swallowed: a paste that quietly drops half its lines
        // leaves the player believing numbers are live that never took.
        setTransferNote(result.rejected.length
            ? `${t('Imported')} ${result.applied}. ${t('Skipped')}: ${result.rejected.join('; ')}`
            : `${t('Imported')} ${result.applied}. ${t('Press Save & Apply to use them.')}`);
    };

    const visible = (group === '__CHANGED__' ? changed : fields.filter(f => f.group === group))
        .filter(f => !query || (f.label + f.path).toLowerCase().includes(query.toLowerCase()));

    return (
        <div className="fixed inset-0 z-[80] bg-[#0b0d12] flex flex-col font-pixel text-white">
            {/* HEADER */}
            <div className="flex items-center justify-between gap-4 px-6 py-3 border-b-2 border-[#2b303b] bg-[#12141a]">
                <h1 className="flex items-center gap-3 text-xl uppercase tracking-widest text-emerald-400">
                    <SlidersHorizontal size={22} /> {t('Stat Balancing')}
                </h1>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-[#0b0d12] border border-[#2b303b] px-3 py-1.5">
                        <Search size={14} className="text-gray-500" />
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder={t('Search')}
                            className="bg-transparent outline-none text-sm w-44"
                        />
                    </div>
                    <button
                        onClick={commit}
                        className={`flex items-center gap-2 px-4 py-2 border-2 uppercase text-xs font-bold transition-colors
                            ${saved ? 'bg-emerald-900 border-emerald-600 text-emerald-200'
                                    : 'bg-emerald-700 border-emerald-400 hover:bg-emerald-600 text-white'}`}
                    >
                        <Save size={14} /> {saved ? t('Applied') : t('Save & Apply')}
                    </button>
                    <button
                        onClick={() => (transferOpen ? setTransferOpen(false) : openTransfer())}
                        title={t('Export / Import')}
                        className={`p-2 border-2 ${transferOpen ? 'bg-[#23262f] border-emerald-600' : 'border-[#2b303b] hover:bg-[#23262f]'}`}
                    >
                        <Share2 size={16} />
                    </button>
                    <button onClick={onClose} className="p-2 border-2 border-[#2b303b] hover:bg-[#23262f]">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* EXPORT / IMPORT — a balance pass is a short list of decisions, and until now it
                lived only in one browser's localStorage where nobody else could read it. */}
            {transferOpen && (
                <div className="px-6 py-3 border-b border-[#2b303b] bg-[#0f1116] flex flex-col gap-2">
                    <textarea
                        value={transferText}
                        onChange={e => { setTransferText(e.target.value); setTransferNote(null); }}
                        spellCheck={false}
                        className="w-full h-32 bg-[#0b0d12] border border-[#2b303b] p-2 text-xs font-mono outline-none resize-y normal-case tracking-normal"
                    />
                    <div className="flex items-center gap-3">
                        <button onClick={doImport}
                                className="px-4 py-1.5 border-2 border-sky-500 bg-sky-800 hover:bg-sky-700 uppercase text-xs font-bold">
                            {t('Import')}
                        </button>
                        <button onClick={() => { void navigator.clipboard?.writeText(transferText); setTransferNote(t('Copied.')); }}
                                className="px-4 py-1.5 border-2 border-[#2b303b] hover:bg-[#23262f] uppercase text-xs">
                            {t('Copy')}
                        </button>
                        {transferNote && (
                            <span className="text-xs text-gray-400 normal-case tracking-normal">{transferNote}</span>
                        )}
                    </div>
                </div>
            )}

            <div className="flex-1 min-h-0 flex">
                {/* GROUPS */}
                <div className="w-64 shrink-0 border-r border-[#2b303b] overflow-y-auto bg-[#0f1116]">
                    <button
                        onClick={() => setGroup('__CHANGED__')}
                        className={`w-full text-left px-4 py-3 text-sm uppercase tracking-wider border-b border-[#1c1f27]
                            ${group === '__CHANGED__' ? 'bg-[#1b2a22] text-emerald-300' : 'hover:bg-[#171a22] text-gray-400'}`}
                    >
                        {t('Changed')} <span className="float-right text-emerald-400">{changed.length}</span>
                    </button>
                    {groups.map(g => {
                        const n = fields.filter(f => f.group === g && config[f.path] !== undefined).length;
                        return (
                            <button
                                key={g}
                                onClick={() => setGroup(g)}
                                className={`w-full text-left px-4 py-2.5 text-sm border-b border-[#1c1f27] truncate
                                    ${group === g ? 'bg-[#1a1d26] text-white' : 'hover:bg-[#171a22] text-gray-400'}`}
                            >
                                {g}
                                {n > 0 && <span className="float-right text-emerald-400 text-xs">{n}</span>}
                            </button>
                        );
                    })}
                </div>

                {/* ROWS */}
                <div className="flex-1 min-w-0 overflow-y-auto">
                    {group !== '__CHANGED__' && (
                        <div className="flex items-center justify-between px-6 py-3 border-b border-[#1c1f27] bg-[#12141a]">
                            <span className="uppercase text-sm tracking-widest text-gray-400">{group}</span>
                            <button
                                onClick={() => resetGroup(group)}
                                className="flex items-center gap-2 px-3 py-1.5 border border-[#2b303b] text-xs uppercase hover:bg-[#23262f] text-gray-400"
                            >
                                <RotateCcw size={12} /> {t('Reset group')}
                            </button>
                        </div>
                    )}

                    {visible.length === 0 && (
                        <p className="px-6 py-10 text-center text-gray-600 text-sm normal-case tracking-normal">
                            {group === '__CHANGED__' ? t('Nothing has been changed yet.') : t('No matching stats.')}
                        </p>
                    )}

                    {visible.map(f => {
                        const v = valueOf(f);
                        const delta = v - f.def;
                        return (
                            <div key={f.path}
                                 className="flex items-center gap-4 px-6 py-2 border-b border-[#15171d] hover:bg-[#12141a]">
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm truncate">{t(f.label)}</div>
                                    <div className="text-[10px] text-gray-600 truncate normal-case tracking-normal">{f.path}</div>
                                </div>

                                <input
                                    type="number"
                                    value={config[f.path] ?? f.def}
                                    min={f.min} max={f.max}
                                    onChange={e => setValue(f, e.target.value)}
                                    className={`w-24 text-center bg-[#0b0d12] border-2 px-2 py-1.5 outline-none
                                        ${delta !== 0 ? 'border-emerald-500 text-emerald-300' : 'border-[#2b303b] text-white'}`}
                                />

                                <div className="w-28 text-right text-xs">
                                    <span className="text-gray-600">{t('default')} {f.def}</span>
                                    {delta !== 0 && (
                                        <span className={`ml-2 font-bold ${delta > 0 ? 'text-amber-400' : 'text-sky-400'}`}>
                                            {delta > 0 ? '+' : ''}{delta}
                                        </span>
                                    )}
                                </div>

                                <button
                                    onClick={() => resetOne(f)}
                                    disabled={delta === 0}
                                    title={t('Reset to default')}
                                    className={`p-1.5 border ${delta !== 0
                                        ? 'border-[#2b303b] hover:bg-[#23262f] text-gray-400'
                                        : 'border-transparent text-gray-800 cursor-default'}`}
                                >
                                    <RotateCcw size={13} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="px-6 py-2 border-t border-[#2b303b] bg-[#12141a] text-[11px] text-gray-500 normal-case tracking-normal">
                {t('Only numbers are stored. Values equal to the default are not saved, so re-tuning a default in code still reaches you. Units already on a board keep their stats until the next level.')}
            </div>
        </div>
    );
};
