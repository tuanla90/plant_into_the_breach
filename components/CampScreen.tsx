import React from 'react';
import { BenchPlant, ItemDefinition, HeroId, MaterialId, Unit, UnitType } from '../types';
import { Tent, Coins, Heart, Sprout, Atom, ArrowLeft, HeartPulse, Package } from 'lucide-react';
import { BENCH_CAPACITY, COIN_FUSE, COIN_HEAL_PER_HP, COIN_REPAIR_SEEDLING, COIN_REVIVE_HERO } from '../constants';
import { HERO_DEFINITIONS } from '../data/heroes';
import { getMaterial } from '../data/materials';
import { HERO_ACCENTS } from '../utils/icons';
import { useI18n } from '../i18n';

interface CampScreenProps {
    coins: number;
    /** The squad as it stands between battles — hurt heroes are the ones worth paying for. */
    units: Unit[];
    bench: BenchPlant[];
    fallenHeroes: HeroId[];
    /** This camp's item shelf. Rolled once on arrival, like a shop's. */
    items: ItemDefinition[];
    /** This camp's GEAR shelf — base plants for the bench, and the raw material of a graft. */
    gear: MaterialId[];
    /** True while at least one hero has something to graft onto. */
    canFuseHere: boolean;
    onHeal: (unitId: string) => void;
    onRepairSeedling: (benchId: string) => void;
    onRevive: (heroId: HeroId) => void;
    onBuyItem: (item: ItemDefinition) => void;
    /** `index` says WHICH card was bought — two cards can carry the same plant. */
    onBuyGear: (id: MaterialId, index: number) => void;
    onOpenFusion: () => void;
    onLeave: () => void;
}

/**
 * THE BREACH'S CAMP — five things worth money and never enough money for all five.
 *
 * This is the gauntlet's rest point and ONLY the gauntlet's: an ordinary stage run still stops
 * at the `rest_site` campfire, where three separate options sit side by side, you take exactly
 * one, and two of them are free. Those are two different questions and they deserve two
 * different screens.
 *
 *   A CAMPFIRE asks "what do you need most tonight?" — the cost is the two things you did not
 *   pick. That suits a run built out of ordinary battles with a shop in the middle of it.
 *
 *   A CAMP asks "what can you afford?" — nothing is exclusive and nothing is free. That suits
 *   the Breach, which has no shop node at all, ten boss fights in a row, and one of these after
 *   every single one of them. Each boss pays; this is the only place that payment can go.
 *
 * The prices are set against each other on purpose. Patching Ironhusk back to full is roughly a
 * revive; a revive is roughly a graft; a graft is two items. So what a player walks out of a
 * camp with is a statement about what they think the next boss is going to do to them.
 */
export const CampScreen: React.FC<CampScreenProps> = ({
    coins, units, bench, fallenHeroes, items, gear, canFuseHere,
    onHeal, onRepairSeedling, onRevive, onBuyItem, onBuyGear, onOpenFusion, onLeave,
}) => {
    const { t } = useI18n();
    const benchFull = bench.length >= BENCH_CAPACITY;

    const hurt = units.filter(u => u.type === UnitType.PLANT && u.hp < u.maxHp);
    const wornSeedlings = bench.filter(b => b.hp !== undefined && b.hp > 0);
    const healCost = (u: Unit) => (u.maxHp - u.hp) * COIN_HEAL_PER_HP;
    const afford = (n: number) => coins >= n;

    /** One priced row. Same shape for every service, so the eye compares prices, not layouts. */
    const row = (
        key: string,
        icon: React.ReactNode,
        accent: string,
        title: string,
        detail: string,
        cost: number,
        onBuy: () => void,
        tut?: string,
        /** Blocked for a reason that is not money — a full bench, say. */
        blocked = false,
    ) => {
        const ok = afford(cost) && !blocked;
        return (
            <button
                key={key}
                data-tut={tut}
                onClick={ok ? onBuy : undefined}
                disabled={!ok}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded border text-left transition-colors
                            ${ok ? 'hover:brightness-125' : 'opacity-45 cursor-not-allowed'}`}
                style={{ borderColor: ok ? `${accent}66` : '#20242c', background: ok ? `${accent}10` : '#0b0c0f' }}
            >
                <span className="shrink-0" style={{ color: ok ? accent : '#4b5563' }}>{icon}</span>
                <span className="min-w-0 flex-1 flex flex-col">
                    <span className="text-[11px] font-bold uppercase tracking-wide truncate"
                          style={{ color: ok ? '#e5e7eb' : '#6b7280' }}>
                        {title}
                    </span>
                    <span className="text-[10px] text-gray-500 normal-case tracking-normal truncate">{detail}</span>
                </span>
                <span className="shrink-0 flex items-center gap-1 text-[12px] font-black"
                      style={{ color: ok ? '#fcd34d' : '#4b5563' }}>
                    <Coins size={12} /> {cost}
                </span>
            </button>
        );
    };

    const panel = (icon: React.ReactNode, title: string, hint: string, body: React.ReactNode) => (
        <section className="flex-1 min-w-0 flex flex-col gap-2 rounded-lg border border-[#252a35] bg-[#0f1116] p-3">
            <header className="flex items-baseline gap-2 border-b border-[#20242c] pb-2">
                <span className="text-gray-400">{icon}</span>
                <h2 className="text-[12px] font-black uppercase tracking-widest text-gray-200">{title}</h2>
                <span className="ml-auto text-[9px] text-gray-600 normal-case tracking-normal truncate">{hint}</span>
            </header>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-0.5">
                {body}
            </div>
        </section>
    );

    const nothing = (msg: string) => (
        <p className="text-[10px] text-gray-600 normal-case tracking-normal py-2">{msg}</p>
    );

    return (
        <div className="w-full min-h-[100dvh] h-auto lg:h-[100dvh] bg-[#0d0e11] flex flex-col font-pixel text-white relative overflow-y-auto lg:overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_110%,#2a1a10_0%,#0d0e11_55%,#000_100%)]" />

            <div className="relative z-10 w-full min-h-full lg:h-full max-w-[1300px] mx-auto flex flex-col gap-3 px-5 py-4">

                <div className="flex items-end justify-between gap-4 border-b-2 border-amber-800/70 pb-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <Tent size={22} className="text-amber-400 shrink-0" />
                        <div className="min-w-0">
                            <h1 className="text-xl font-black uppercase tracking-widest text-amber-300 leading-none">
                                {t('Camp')}
                            </h1>
                            <p className="text-[11px] text-gray-500 normal-case tracking-normal">
                                {t('Coals, a kit bag and a workbench. Everything here has a price — spend it on what the next boss will do to you.')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="flex items-center gap-1.5 text-lg font-black text-amber-300">
                            <Coins size={18} /> {coins}
                        </span>
                        <button data-sfx="back"
                            onClick={onLeave}
                            className="h-10 px-4 flex items-center gap-2 border border-[#2b303b] rounded text-[11px] uppercase tracking-widest text-gray-400 hover:text-white hover:border-gray-500"
                        >
                            <ArrowLeft size={14} /> {t('Break Camp')}
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 flex gap-3">

                    {/* PATCH UP. Priced per point of damage, so a scratch is cheap and a hero
                        who nearly died is a real bill. */}
                    {panel(<HeartPulse size={14} />, t('Patch Up'), t('{n} Coin per point', { n: COIN_HEAL_PER_HP }),
                        <>
                            {hurt.length === 0 && wornSeedlings.length === 0 && nothing(t('Nobody is hurt.'))}
                            {hurt.map(u => row(
                                u.id,
                                <Heart size={16} />,
                                (u.heroId && HERO_ACCENTS[u.heroId]) || '#f87171',
                                u.heroId ? t(HERO_DEFINITIONS[u.heroId]?.name ?? u.name) : t(u.name),
                                t('{hp}/{max} HP', { hp: u.hp, max: u.maxHp }),
                                healCost(u),
                                () => onHeal(u.id),
                            ))}
                            {wornSeedlings.map(b => row(
                                b.id,
                                <Sprout size={16} />,
                                '#4ade80',
                                t(getMaterial(b.materialId)?.name ?? b.materialId),
                                t('Worn seedling — cannot be grafted until it is whole'),
                                COIN_REPAIR_SEEDLING,
                                () => onRepairSeedling(b.id),
                            ))}
                        </>
                    )}

                    {/* REVIVE + FUSE. Both are permanent, both compete for the same money. */}
                    {panel(<Atom size={14} />, t('Workbench'), t('Permanent changes'),
                        <>
                            {fallenHeroes.length === 0 && nothing(t('Nobody to bring back.'))}
                            {fallenHeroes.map(h => row(
                                h,
                                <Heart size={16} />,
                                HERO_ACCENTS[h] ?? '#f87171',
                                t(HERO_DEFINITIONS[h]?.name ?? h),
                                t('Fallen — returns with fusions intact'),
                                COIN_REVIVE_HERO,
                                () => onRevive(h),
                            ))}
                            {canFuseHere
                                ? row(
                                    'fuse',
                                    <Atom size={16} />,
                                    '#c084fc',
                                    t('Graft a bench plant'),
                                    t('Permanent. Costs the seedling as well as the Coin.'),
                                    COIN_FUSE,
                                    onOpenFusion,
                                    'campfire-fuse',
                                )
                                : nothing(t('No bench plant to graft.'))}
                        </>
                    )}

                    {/* GEAR. The Breach has no shop node, so this is the only place a bench
                        plant can be bought — and a bench plant is what a graft is made of, so
                        the two columns either side of this one both depend on it. */}
                    {panel(<Sprout size={14} />, t('Gear'), t('Bench {n}/{max}', { n: bench.length, max: BENCH_CAPACITY }),
                        <>
                            {gear.length === 0 && nothing(t('Nothing left on the rack.'))}
                            {gear.map((id, i) => {
                                const mat = getMaterial(id);
                                return row(
                                    `${id}-${i}`,
                                    mat?.imgUrl
                                        ? <img src={mat.imgUrl} alt="" className="w-6 h-6 object-contain" />
                                        : <Sprout size={16} />,
                                    '#4ade80',
                                    t(mat?.name ?? id),
                                    benchFull
                                        // Said on the row rather than hidden in a disabled state:
                                        // "cannot afford" and "nowhere to put it" are different
                                        // problems and only one of them is solved by winning.
                                        ? t('Bench is full')
                                        : t('Goes to the bench — a backup body, or fusion material'),
                                    mat?.coinCost ?? 0,
                                    () => onBuyGear(id, i),
                                    undefined,
                                    benchFull,
                                );
                            })}
                        </>
                    )}

                    {/* THE KIT BAG. The only consumables in the whole gauntlet. */}
                    {panel(<Package size={14} />, t('Kit Bag'), t('One-shot items'),
                        <>
                            {items.length === 0 && nothing(t('The bag is empty.'))}
                            {items.map((item, i) => row(
                                `${item.id}-${i}`,
                                <img src={item.imgUrl} alt="" className="w-6 h-6 object-contain" />,
                                '#38bdf8',
                                t(item.name),
                                t(item.description),
                                item.coinCost,
                                () => onBuyItem(item),
                                `shop-item-${item.id}`,
                            ))}
                        </>
                    )}
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #0f1012; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
            `}</style>
        </div>
    );
};
