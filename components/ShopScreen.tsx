import React, { useState } from 'react';
import { BenchPlant, ItemDefinition, MaterialId, Unit } from '../types';
import { ShoppingCart, Heart, Sun, ArrowLeft, Coins, RefreshCw, Sprout, AlertTriangle, Brain, Info } from 'lucide-react';
import { BENCH_CAPACITY, FUSION_SLOTS, shopRerollCost } from '../constants';
import { getMaterial } from '../data/materials';
import { canFuse, describeFusionForHero } from '../utils/fusion';
import { IS_COARSE_POINTER } from '../utils/platform';
import { useI18n } from '../i18n';

interface ShopScreenProps {
    sun: number;
    items: ItemDefinition[];
    units: Unit[];
    onBuyItem: (item: ItemDefinition) => void;
    onLeave: () => void;

    // --- Base plants, bought with Coin (DESIGN.md section 5) ---
    /** Coin wallet. Coin decides who your squad *is*; Sun decides what a turn can do. */
    coins?: number;
    /** The materials on offer this visit. Rerolled as a whole set. */
    offers?: MaterialId[];
    /** Rerolls already bought at this shop. Drives the escalating price. */
    rerollsUsed?: number;
    bench?: BenchPlant[];
    /** The squad, used to show per-hero fusion status on every offer. */
    squad?: Unit[];
    /**
     * `index` identifies WHICH card was bought. Two cards can carry the same material, and
     * a purchase takes that card off the shelf — without the index the wrong one would be
     * removed (harmless today, wrong the moment stock stops being interchangeable).
     */
    onBuyMaterial?: (id: MaterialId, index: number) => void;
    onReroll?: () => void;

    // --- Brain buy-back. Losing every brain on one board ends the run, so this is the
    //     only way back up — and it is priced to be a last resort, not a routine purchase.
    brainsRemaining?: number;
    brainsMax?: number;
    /** Coin price of the next brain. Escalates with each one already bought. */
    brainCost?: number;
    onBuyBrain?: () => void;
}

/**
 * COMPACT SHOP LAYOUT.
 *
 * Rules this screen follows after the readability pass:
 *  - Cards carry a NAME and a PRICE, nothing else. Every description, per-hero fusion
 *    status and stat line lives in the hover panel — read it when you want it, never
 *    pushed at you. (The material hover keeps the three DESIGN.md section 5 lines.)
 *  - The page is top-anchored (`items-start`), because a centered column taller than the
 *    viewport clips its own header above the scrollable area — the old layout's bug.
 *  - Hover panels open UPWARD from the bottom half of the card grid and never off-screen.
 */
export const ShopScreen: React.FC<ShopScreenProps> = ({
    sun,
    items,
    units,
    onBuyItem,
    onLeave,
    coins = 0,
    offers = [],
    rerollsUsed = 0,
    bench = [],
    squad = [],
    onBuyMaterial,
    onReroll,
    brainsRemaining = 0,
    brainsMax = 0,
    brainCost = 0,
    onBuyBrain,
}) => {
    const { t } = useI18n();

    /**
     * Thẻ nào đang MỞ bảng chi tiết, mở bằng cách BẤM.
     *
     * Mọi thứ đáng để cân nhắc trước khi tiêu Xu — vật liệu này làm gì, hero nào còn nhận
     * được nó, giữ lại ở khu dự bị thì đánh đấm ra sao — đều nằm trong bảng `group-hover`.
     * Trên điện thoại KHÔNG CÓ hover: cả ba dòng đó không có đường nào tới được, và thẻ chỉ
     * còn cái tên với cái giá. Bấm là cách duy nhất, nên dòng "xem chi tiết" thành một nút.
     * Hover vẫn giữ nguyên cho chuột — nó nhanh hơn và không tốn cú bấm nào.
     */
    const [openDetails, setOpenDetails] = useState<string | null>(null);
    const detailsHint = IS_COARSE_POINTER ? t('Tap for details') : t('Hover for details');

    // Shop services and items are all paid in Coin — Sun never leaves the battlefield
    // (DESIGN.md section 3). `sun` is shown in the header for reference only.
    const heroes = squad.filter(u => u.isHero);
    const rerollCost = shopRerollCost(rerollsUsed);
    const canAffordReroll = coins >= rerollCost;
    const benchFull = bench.length >= BENCH_CAPACITY;

    const brainsFull = brainsRemaining >= brainsMax;
    const canAffordBrain = coins >= brainCost;
    const canBuyBrain = !!onBuyBrain && !brainsFull && canAffordBrain;

    return (
        <div className="w-full h-full bg-[#111] flex justify-center items-start font-pixel text-white relative overflow-y-auto py-5 px-4">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-30 pointer-events-none"></div>

            <div className="w-full max-w-5xl z-10 flex flex-col gap-3">

                {/* Header — title, wallets, and the services that are one-line decisions. */}
                <div className="flex items-center justify-between gap-4 border-b-2 border-yellow-600 bg-[#1a1c21] px-5 py-3 shadow-xl">
                    <h1 className="text-2xl uppercase tracking-widest text-yellow-400 flex items-center gap-3 min-w-0">
                        <ShoppingCart size={26} className="shrink-0" /> <span className="truncate">{t("Old Mulch's Supply")}</span>
                    </h1>
                    <div className="flex items-center gap-5 text-lg shrink-0">
                        <div className="flex items-center gap-1.5" title={t('Sun — spent on hero skills. Resets every level.')}>
                            <Sun size={20} className="text-yellow-400" />
                            <span>{sun}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-300" title={t('Coin — spent between levels on plants, items and revives.')}>
                            <Coins size={20} />
                            <span>{coins}</span>
                        </div>
                    </div>
                </div>

                {/* Services strip: brain buy-back only.
                    Squad Repair used to sit here too, and it has been removed on purpose:
                    healing belongs to the Campfire ("Sleep It Off"), and a shop that also
                    sold health made the Campfire's main draw redundant while quietly
                    competing for the same Coin. A shop buys and sells things. Healing items
                    may show up on the shelves later; a service button will not. */}
                <div className="flex gap-3">
                    <div
                        className="flex-1 bg-[#1a1c21] border border-purple-800/60 px-4 py-3 shadow-lg flex items-center justify-between gap-3"
                        title={t('Lose every brain on one map and the run ends there. This is the only way back up.')}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <Brain size={22} className="text-purple-400 shrink-0" />
                            <span className="uppercase font-bold text-sm text-purple-300 truncate">{t('Spare Brain')}</span>
                            <Info size={12} className="text-gray-600 shrink-0" />
                            <span className={`text-sm font-bold shrink-0 ${brainsRemaining <= 1 ? 'text-red-400' : 'text-purple-300'}`}>
                                {brainsRemaining}<span className="text-gray-600">/{brainsMax}</span>
                            </span>
                        </div>
                        <button
                            onClick={onBuyBrain}
                            disabled={!canBuyBrain}
                            title={brainsFull
                                ? t('Your brain budget is already full.')
                                : t('Each brain costs more than the last: {cost} now, {next} after.', { cost: brainCost, next: brainCost + 75 })}
                            className={`
                                flex items-center gap-2 px-4 py-2 border-2 uppercase text-xs font-bold shrink-0
                                ${canBuyBrain
                                    ? 'bg-purple-900 border-purple-500 hover:bg-purple-800 text-white'
                                    : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'}
                            `}
                        >
                            {brainsFull ? t('Budget Full') : t('Buy Brain')}
                            {!brainsFull && <span className="flex items-center gap-1 text-amber-300"><Coins size={12} /> {brainCost}</span>}
                        </button>
                    </div>
                </div>

                {/* --- BASE PLANTS (Coin) ------------------------------------------------ */}
                <div className="bg-[#1a1c21] border border-gray-700 p-4 shadow-lg">
                    <div className="flex items-center justify-between border-b border-gray-700 pb-2 mb-3 gap-3">
                        <h3 className="text-base uppercase font-bold flex items-center gap-2 min-w-0">
                            <Sprout size={18} className="text-green-400 shrink-0" /> {t('Base Plants')}
                            <span
                                className="shrink-0 text-gray-600 hover:text-gray-300 cursor-help"
                                title={t('bench insurance, or fusion material — one or the other') + '. ' + t('Each hero holds {slots} fusions, and a material fuses in only once per hero.', { slots: FUSION_SLOTS })}
                            >
                                <Info size={13} />
                            </span>
                        </h3>
                        <div className="flex items-center gap-3 shrink-0">
                            <div className={`text-xs uppercase ${benchFull ? 'text-red-400' : 'text-gray-400'}`}>
                                {t('Bench {count}/{max}', { count: bench.length, max: BENCH_CAPACITY })}
                            </div>
                            <button
                                onClick={onReroll}
                                disabled={!canAffordReroll || !onReroll}
                                title={t('Rerolls get pricier at this shop: {cost} now, {next} next.', { cost: rerollCost, next: rerollCost + 10 })}
                                className={`
                                    flex items-center gap-2 px-3 py-1.5 border-2 uppercase text-xs font-bold
                                    ${canAffordReroll && onReroll
                                        ? 'bg-indigo-900 border-indigo-500 hover:bg-indigo-800 text-white'
                                        : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'}
                                `}
                            >
                                <RefreshCw size={12} /> {t('Reroll')}
                                <span className="flex items-center gap-1 text-amber-300"><Coins size={11} /> {rerollCost}</span>
                            </button>
                        </div>
                    </div>

                    {/* Màn dọc: một cột. Ba cột trên màn 390px cho mỗi thẻ 106px — ảnh cây
                        đã chiếm 56px, phần tên còn 40px, tức mọi tên cây đều bị cắt cụt và
                        nút Mua hẹp hơn ngón tay. */}
                    <div className="grid grid-cols-3 portrait:grid-cols-1 gap-3">
                        {offers.map((materialId, index) => {
                            const def = getMaterial(materialId);
                            if (!def) return null;

                            const detailKey = `mat-${materialId}-${index}`;
                            const detailsOpen = openDetails === detailKey;

                            const affordable = coins >= def.coinCost;
                            const buyable = affordable && !benchFull && !!onBuyMaterial;

                            const statuses = heroes.map(hero => ({
                                key: hero.id,
                                text: describeFusionForHero(hero, materialId, t),
                                ok: canFuse(hero, materialId).ok,
                                owned: (hero.fusions ?? []).includes(materialId),
                            }));
                            // Deliberately NOT filtered out of the shop — a material every hero
                            // already carries still shows up, flagged. Hiding it would make the
                            // shop feel rigged and the player would never learn the rule.
                            const ownedBySomeone = statuses.some(s => s.owned);
                            const noHeroCanTakeIt = statuses.length > 0 && statuses.every(s => !s.ok);

                            return (
                                <div
                                    key={`${materialId}-${index}`}
                                    className={`
                                        relative group flex flex-col p-2.5 bg-black/40 border transition-colors
                                        ${noHeroCanTakeIt ? 'border-red-800 hover:border-red-600' : 'border-gray-700 hover:border-green-500'}
                                    `}
                                >
                                    {noHeroCanTakeIt && (
                                        <div className="absolute top-1 right-1 flex items-center gap-1 px-1.5 py-0.5 bg-red-900/80 border border-red-600 text-[10px] uppercase text-red-200 z-10">
                                            <AlertTriangle size={9} /> {ownedBySomeone ? t('Already fused') : t('No slot')}
                                        </div>
                                    )}

                                    {/* Name + art only — everything else is in the hover panel. */}
                                    <div className="flex gap-2.5 items-center">
                                        <div className="w-14 h-14 bg-black flex items-center justify-center border border-gray-600 shrink-0">
                                            <img src={def.imgUrl} className="w-12 h-12 object-contain" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-green-200 text-sm truncate">{t(def.name)}</div>
                                            <button
                                                type="button"
                                                onClick={() => setOpenDetails(detailsOpen ? null : detailKey)}
                                                className={`text-[10px] flex items-center gap-1 mt-0.5 py-1 pr-2 transition-colors
                                                            ${detailsOpen ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                <Info size={10} /> {detailsHint}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => onBuyMaterial && onBuyMaterial(materialId, index)}
                                        disabled={!buyable}
                                        data-tut={`shop-plant-${materialId}`}
                                        className={`
                                            mt-2 w-full flex justify-between items-center px-3 py-1.5 border uppercase text-xs font-bold
                                            ${buyable
                                                ? 'bg-green-900 border-green-500 text-white hover:bg-green-800'
                                                : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'}
                                        `}
                                    >
                                        <span>{benchFull ? t('Bench Full') : t('Buy')}</span>
                                        <span className="flex items-center gap-1 text-amber-300">
                                            <Coins size={12} /> {def.coinCost}
                                        </span>
                                    </button>

                                    {/* --- Hover panel: the three lines DESIGN.md section 5 requires.
                                        Opens DOWNWARD (the grid sits near the top of the page) but is
                                        anchored inside the card column so it can never leave the page
                                        horizontally; z-50 floats it over the sections below. --- */}
                                    {/* Mở bằng chạm thì bảng phải ĂN cú chạm tiếp theo (và tự đóng):
                                        nó phủ lên hai thẻ dưới, mà pointer-events-none nghĩa là cú
                                        chạm "để tắt bảng" rơi thẳng xuống nút MUA của thẻ bị che —
                                        tiêu Xu vì một cú bấm người chơi tưởng là đóng. Chuột rê thì
                                        vẫn phải xuyên qua, không thì bảng tự cướp hover của chính nó. */}
                                    <div
                                        onClick={() => setOpenDetails(null)}
                                        className={`absolute z-50 left-0 right-0 top-full mt-1
                                                    ${detailsOpen ? 'block pointer-events-auto cursor-pointer' : 'hidden group-hover:block pointer-events-none'}`}
                                    >
                                        <div className="bg-[#0b0d10] border-2 border-yellow-600 p-3 shadow-2xl text-left space-y-2.5">
                                            {/* 1. What it gives a hero */}
                                            <div>
                                                <div className="text-[10px] uppercase text-yellow-500 tracking-widest mb-1">{t('Fused into a hero')}</div>
                                                <div className="text-xs text-gray-200 leading-snug">{t(def.description)}</div>
                                            </div>

                                            {/* 2. Per-hero status — the line that stops wasted Coin */}
                                            <div>
                                                <div className="text-[10px] uppercase text-yellow-500 tracking-widest mb-1">{t('Your squad')}</div>
                                                {statuses.length === 0 && (
                                                    <div className="text-xs text-gray-500 italic">{t('No heroes in the squad.')}</div>
                                                )}
                                                {statuses.map(status => (
                                                    <div
                                                        key={status.key}
                                                        className={`text-xs leading-snug ${status.ok ? 'text-green-300' : 'text-red-400'}`}
                                                    >
                                                        {t(status.text)}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* 3. What it is worth as a bench body instead */}
                                            <div>
                                                <div className="text-[10px] uppercase text-yellow-500 tracking-widest mb-1">{t('Kept on the bench')}</div>
                                                <div className="text-xs text-gray-300">
                                                    {t('{hp} HP · {dmg} DMG · {move} MOVE', { hp: def.benchStats.maxHp, dmg: def.benchStats.damage, move: def.benchStats.moveRange })}
                                                </div>
                                                <div className="text-[10px] text-gray-500 leading-snug mt-1">
                                                    {t("Fills a fallen hero's slot next level. No hero skill — it blocks and it hits.")}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {offers.length === 0 && (
                            <div className="text-gray-500 italic col-span-3 text-center py-6">
                                {t('No plants on offer.')}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- COMBAT ITEMS (Coin) ----------------------------------------------- */}
                <div className="bg-[#1a1c21] border border-gray-700 p-4 shadow-lg">
                    <h3 className="text-base uppercase font-bold mb-3 border-b border-gray-700 pb-2 flex items-center gap-2">
                        <Coins size={18} className="text-amber-300" /> {t('Combat Items')}
                        <span
                            className="text-gray-600 hover:text-gray-300 cursor-help"
                            title={t('bought with Coin between levels')}
                        >
                            <Info size={13} />
                        </span>
                    </h3>
                    <div className="grid grid-cols-2 portrait:grid-cols-1 gap-3">
                        {items.map(item => {
                            const affordable = coins >= item.coinCost;
                            const detailKey = `item-${item.id}`;
                            const detailsOpen = openDetails === detailKey;
                            return (
                                <div
                                    key={item.id}
                                    className="relative group flex gap-3 items-center p-2.5 bg-black/40 border border-gray-700 hover:border-yellow-500 transition-colors"
                                >
                                    <div className="w-12 h-12 bg-black flex items-center justify-center border border-gray-600 shrink-0">
                                        <img src={item.imgUrl} className="w-10 h-10 object-contain" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-yellow-200 text-sm truncate">{t(item.name)}</div>
                                        <button
                                            type="button"
                                            onClick={() => setOpenDetails(detailsOpen ? null : detailKey)}
                                            className={`text-[10px] flex items-center gap-1 mt-0.5 py-1 pr-2 transition-colors
                                                        ${detailsOpen ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            <Info size={10} /> {detailsHint}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => onBuyItem(item)}
                                        disabled={!affordable}
                                        data-tut={`shop-item-${item.id}`}
                                        className={`
                                            shrink-0 text-xs px-3 py-1.5 border uppercase flex items-center gap-2 font-bold
                                            ${affordable
                                                ? 'bg-yellow-700 border-yellow-500 text-white hover:bg-yellow-600'
                                                : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'}
                                        `}
                                    >
                                        {t('Buy')}
                                        <span className="flex items-center gap-1 text-amber-300"><Coins size={12} /> {item.coinCost}</span>
                                    </button>

                                    {/* Item description on hover — opens UPWARD: this section sits at
                                        the bottom of the page, downward would leave the viewport. */}
                                    <div
                                        onClick={() => setOpenDetails(null)}
                                        className={`absolute z-50 left-0 right-0 bottom-full mb-1
                                                    ${detailsOpen ? 'block pointer-events-auto cursor-pointer' : 'hidden group-hover:block pointer-events-none'}`}
                                    >
                                        <div className="bg-[#0b0d10] border-2 border-yellow-600 p-3 shadow-2xl">
                                            <div className="text-xs text-gray-200 leading-snug">{t(item.description)}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {items.length === 0 && <div className="text-gray-500 italic col-span-2 text-center py-6">{t('Sold Out')}</div>}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-start pb-2">
                    <button
                        onClick={onLeave}
                        data-tut="shop-leave"
                        className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 border-2 border-gray-500 text-white uppercase tracking-widest font-bold"
                    >
                        <ArrowLeft size={18} /> {t('Return to Map')}
                    </button>
                </div>
            </div>
        </div>
    );
};
