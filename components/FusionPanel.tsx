import React, { useState, useEffect } from 'react';
import { BenchPlant, FusionEffectType, HeroId, MaterialId, Skill, Unit } from '../types';
import {
    FlaskConical, X, AlertTriangle, Sprout, Ban, Heart, HandFist, Footprints,
    Sun as Sol, Swords, Sparkles, Shield, ArrowRight,
} from 'lucide-react';
import { FUSION_SLOTS } from '../constants';
import { HERO_DEFINITIONS } from '../data/heroes';
import { getMaterial } from '../data/materials';
import { getRecipe } from '../data/fusionRecipes';
import { canFuse, applyFusion, applyFusionToSkill, getFusionEffectValue, hasFusionEffect, DIGEST_CLAW_SKILL } from '../utils/fusion';
import { ELEMENT_DEFINITIONS, ELEMENT_HP_COST } from '../utils/elements';
import { HERO_ACCENTS } from '../utils/icons';
import { ElementBadge } from './ElementBadge';
import { useI18n } from '../i18n';

interface FusionPanelProps {
    squad: Unit[];
    bench: BenchPlant[];
    /**
     * `benchId` matters: two seedlings of the same species can sit on the bench with
     * different wear, so a material id alone is ambiguous — the caller would pick the first
     * match, which may be the worn one the player deliberately did not select.
     */
    onFuse: (heroUnitId: string, materialId: MaterialId, benchId: string) => void;
    /**
     * Mirrors the panel's two selections outward.
     *
     * The tutorial overlay picks which control to open a hole over by reading state, and
     * "which hero is focused" / "which plant is selected" live only in here. Without them
     * the fusion lesson could point at the confirm button while it was still disabled.
     */
    onSelectionChange?: (sel: { heroId: HeroId | null; materialId: MaterialId | null }) => void;
    /** Recipes the save has learned. Omitted by scripted content, which never gates. */
    knownRecipes?: string[];
    onClose: () => void;
}

type Translate = (text: string, vars?: Record<string, string | number>) => string;

/** Category badge for a fusion effect — tells the player WHAT KIND of thing they are buying. */
const categoryOf = (type: FusionEffectType): { label: string; color: string } => {
    switch (type) {
        case 'GRANT_ATTACK':
        case 'DIGEST_CLAW':
            return { label: 'New active skill', color: '#4ade80' };
        case 'BONUS_HP':
        case 'BONUS_DAMAGE':
        case 'MOVE_BONUS':
            return { label: 'Stats', color: '#f59e0b' };
        case 'SUN_PER_TURN':
        case 'SUN_WHILE_DIGESTING':
        case 'SUN_ON_KILL':
        case 'SUN_ON_BLOCK_SPAWN':
        case 'SKILL_DISCOUNT':
            return { label: 'Economy', color: '#facc15' };
        case 'DOUBLE_ATTACK':
        case 'ON_HIT_PUSH':
        case 'ON_HIT_FREEZE':
        case 'ON_HIT_BURN':
        case 'ON_HIT_SLOW':
        case 'UPGRADE_SLOW_TO_FREEZE':
        case 'MELEE_REACH_TRADE':
        case 'ATTACK_RANGE_BONUS':
        case 'ARC_ATTACK':
        case 'SKILL_SPLASH':
        case 'SKILL_STUN':
        case 'SKILL_DISARM':
        case 'SKILL_AURA':
        case 'SKILL_REPEL':
        case 'BLEED_ON_HIT':
        case 'PROVOKE_ON_HIT':
        case 'STUN_ON_FULL_HP':
        case 'WING_MIDSHOT':
        case 'OVERWATCH_SHOT':
        case 'BLESS_POWER':
        case 'PUSH_DISTANCE':
        case 'COLLISION_BONUS':
        case 'PROVOKE_RADIUS':
        case 'ADJACENT_STRIKE':
            return { label: 'Attack upgrade', color: '#fb923c' };
        default:
            return { label: 'Passive', color: '#38bdf8' };
    }
};

const rangeText = (skill: Skill, t: Translate): string => {
    switch (skill.rangeType) {
        case 'MELEE': return t('Melee');
        case 'SELF': return t('Self');
        case 'LINE': return t('Line {n}', { n: skill.rangeValue });
        case 'LOB': return t('Lob {n}', { n: skill.rangeValue });
        case 'DASH': return t('Dash {n}', { n: skill.rangeValue });
        default: return String(skill.rangeType);
    }
};

interface SkillView {
    key: string;
    name: string;
    desc: string;
    /** Net Sol cost after SKILL_DISCOUNT — mirrors App's netCost formula. */
    cost: number;
    damage: number;
    rangeText: string;
    tags: string[];
    isHeroSkill: boolean;
}

/**
 * The hero's active skills AS THE COMBAT CODE WOULD RESOLVE THEM for this unit:
 * fusion grafts included via applyFusionToSkill, Sol discount included, plus the
 * granted Fused Shot when a GRANT_ATTACK fusion is present.
 */
const skillViewsOf = (unit: Unit, t: Translate): SkillView[] => {
    const def = unit.heroId ? HERO_DEFINITIONS[unit.heroId] : null;
    if (!def) return [];

    const views: SkillView[] = [];
    const pairs: Array<[string, Skill, boolean]> = [
        ['basic', def.basicAttack, false],
        ['hero', def.heroSkill, true],
    ];

    pairs.forEach(([key, skill, isHeroSkill]) => {
        const eff = applyFusionToSkill(skill, unit);
        const damage = eff.effects.find(e => e.type === 'DAMAGE')?.value ?? 0;
        const discount = isHeroSkill ? getFusionEffectValue(unit, 'SKILL_DISCOUNT') : 0;
        const cost = Math.max(0, (eff.sunCost ?? 0) - discount);

        const tags: string[] = [];
        if (key === 'basic' && hasFusionEffect(unit, 'DOUBLE_ATTACK')) tags.push(t('Fires twice'));
        eff.effects.forEach(e => {
            if (e.type === 'PIERCE_ATTACK') tags.push(t('Pierce'));
            if (e.type === 'PUSH') {
                // Snapping Pea drags the target in (ON_HIT_PUSH −1); everything else shoves.
                const pulls = getFusionEffectValue(unit, 'ON_HIT_PUSH') < 0 && !skill.effects.some(s => s.type === 'PUSH');
                tags.push(pulls ? t('Pull') : t('Knockback'));
            }
            if (e.type === 'STUN') tags.push(t('Freeze'));
            if (e.type === 'APPLY_BURN') tags.push(t('Burn'));
            if (e.type === 'APPLY_SLOW') tags.push(t('Slow'));
            if (e.type === 'RESOURCE_GAIN') tags.push(`+${e.value ?? 0} ${t('Sol')}`);
        });

        views.push({
            key,
            name: t(skill.name),
            desc: t(skill.description),
            cost, damage,
            rangeText: rangeText(eff, t),
            tags,
            isHeroSkill,
        });
    });

    // Mirrors the claw App builds in skillsFor() — same shared constant, so the card and the
    // button can never describe different weapons.
    if (hasFusionEffect(unit, 'DIGEST_CLAW')) {
        views.push({
            key: 'claw',
            name: t(DIGEST_CLAW_SKILL.name),
            desc: t(DIGEST_CLAW_SKILL.description),
            cost: 0,
            damage: DIGEST_CLAW_SKILL.effects.find(e => e.type === 'DAMAGE')?.value ?? 1,
            rangeText: t('Melee'),
            tags: [],
            isHeroSkill: false,
        });
    }

    // Mirrors the granted skill App builds in skillsFor(): LINE 6, 2 DMG, costs the effect value.
    if (hasFusionEffect(unit, 'GRANT_ATTACK')) {
        const cost = getFusionEffectValue(unit, 'GRANT_ATTACK');
        views.push({
            key: 'granted',
            name: t('Fused Shot'),
            desc: cost > 0
                ? t('A ranged shot granted by fusion. Costs {cost} Sol.', { cost })
                : t('A ranged shot granted by fusion. Free.'),
            cost,
            damage: 2,
            rangeText: t('Line {n}', { n: 6 }),
            tags: [],
            isHeroSkill: true,
        });
    }

    return views;
};

/** "2 → 4" when the fusion changes a number; plain value otherwise. */
const Diff: React.FC<{ before: number | string; after?: number | string; better?: boolean }> = ({ before, after, better = true }) => {
    if (after === undefined || after === before) return <>{before}</>;
    return (
        <span className="inline-flex items-center gap-1">
            <span className="text-gray-500 line-through">{before}</span>
            <span className={better ? 'text-green-400 font-black' : 'text-red-400 font-black'}>{after}</span>
        </span>
    );
};

/**
 * Fusion bench, campaign-select style (DESIGN.md section 6).
 *
 * One hero in focus at a time: material list on the left, the big sprite in the
 * middle, and on the right EVERYTHING the fusion changes — stats, every active
 * skill as combat would resolve it, and the passive list — each shown as
 * before → after while a plant is selected. The trade-off note stays put:
 * fusing consumes the plant forever.
 *
 * The hero's ELEMENT is shown everywhere the hero is (tabs, showcase, stats,
 * passives). It is not decoration here: the element rides every attack, so it is
 * the thing the graft lands on top of — Blizzard on an ICE hero is why fusion.ts
 * has an ordering rule at all — and it is already charged against max HP, which
 * is why the HP figure on this screen disagrees with the hero sheet.
 */
export const FusionPanel: React.FC<FusionPanelProps> = ({ squad, bench, onFuse, onClose, onSelectionChange, knownRecipes }) => {
    const { t } = useI18n();
    const heroes = squad.filter(u => u.isHero);

    const [focusedHeroId, setFocusedHeroId] = useState<string | null>(heroes[0]?.id ?? null);
    const [selectedBenchId, setSelectedBenchId] = useState<string | null>(null);

    const hero = heroes.find(h => h.id === focusedHeroId) ?? heroes[0] ?? null;
    const heroDef = hero?.heroId ? HERO_DEFINITIONS[hero.heroId] : null;
    const accent = (hero?.heroId && HERO_ACCENTS[hero.heroId]) || '#c084fc';

    const selectedPlant = bench.find(p => p.id === selectedBenchId) ?? null;
    const check = selectedPlant && hero ? canFuse(hero, selectedPlant.materialId, t, knownRecipes, selectedPlant) : null;
    const ready = !!(selectedPlant && hero && check?.ok);

    // The whole point of the screen: the unit as it IS vs as it WOULD BE.
    const simHero = ready && hero && selectedPlant ? applyFusion(hero, selectedPlant.materialId) : null;
    const before = hero ? skillViewsOf(hero, t) : [];
    const after = simHero ? skillViewsOf(simHero, t) : null;
    const previewRecipe = ready && hero && selectedPlant ? getRecipe(hero.heroId, selectedPlant.materialId) : null;

    // Report upward whenever either selection moves, including the initial hero the panel
    // focuses on its own — the overlay has to know about that one too.
    useEffect(() => {
        onSelectionChange?.({
            heroId: (hero?.heroId as HeroId | undefined) ?? null,
            materialId: selectedPlant?.materialId ?? null,
        });
    }, [hero?.heroId, selectedPlant?.materialId, onSelectionChange]);

    const fusionsOfHero = (unit: Unit) =>
        (unit.fusions ?? []).map(id => ({ id, mat: getMaterial(id), recipe: getRecipe(unit.heroId, id) }));

    const confirm = () => {
        if (!ready || !hero || !selectedPlant) return;
        onFuse(hero.id, selectedPlant.materialId, selectedPlant.id);
        setSelectedBenchId(null);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center font-pixel text-white p-4">
            <div className="w-full h-full max-w-[1700px] bg-[#101018] border-2 border-purple-700 shadow-2xl relative flex flex-col overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,#1d1530_0%,#101018_60%)] pointer-events-none"></div>

                {/* HEADER */}
                <div className="relative z-10 flex items-start justify-between border-b-2 border-purple-800 px-6 py-4 shrink-0">
                    <div>
                        <h1 className="text-2xl uppercase tracking-widest text-purple-300 flex items-center gap-3">
                            <FlaskConical size={26} /> {t('Fusion Bench')}
                        </h1>
                        <p className="text-xs text-gray-400 mt-1 leading-snug max-w-2xl">
                            {t("Fuse a base plant into a hero to grant it that plant's trait, permanently. Each hero holds {slots} fusions, and the same plant fuses into a given hero only once.", { slots: FUSION_SLOTS })}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 border-2 border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-300" title={t('Close')}>
                        <X size={18} />
                    </button>
                </div>

                {/* BODY: materials | showcase | details */}
                <div className="relative z-10 flex-1 min-h-0 flex">

                    {/* ---- LEFT: hero focus tabs + bench ---------------------------------- */}
                    {/* Width ladder, not a flat 340px: together with the 400px details column
                        the fixed pair overflowed any viewport under ~780px and the confirm
                        button was clipped clean off. */}
                    <div className="w-[220px] md:w-[260px] xl:w-[340px] shrink-0 border-r border-gray-800 flex flex-col min-h-0">
                        {/* Hero tabs */}
                        <div className="p-3 border-b border-gray-800 shrink-0">
                            <h3 className="text-[11px] uppercase font-bold tracking-widest text-gray-500 mb-2">{t('Heroes')}</h3>
                            <div className="flex gap-2">
                                {heroes.map(h => {
                                    const hAccent = (h.heroId && HERO_ACCENTS[h.heroId]) || '#c084fc';
                                    const hDef = h.heroId ? HERO_DEFINITIONS[h.heroId] : null;
                                    const isFocused = hero?.id === h.id;
                                    const used = (h.fusions ?? []).length;
                                    return (
                                        <button
                                            key={h.id}
                                            onClick={() => { setFocusedHeroId(h.id); }}
                                            data-tut={h.heroId ? `fusion-hero-${h.heroId}` : undefined}
                                            className={`flex-1 flex flex-col items-center gap-1 p-2 border-2 rounded transition-colors bg-black/40 ${isFocused ? '' : 'border-gray-700 hover:border-gray-500 opacity-70'}`}
                                            style={isFocused ? { borderColor: hAccent, boxShadow: `0 0 12px ${hAccent}33` } : undefined}
                                        >
                                            <img src={hDef?.boardImgUrl ?? h.imgUrl} className="w-12 h-12 object-contain" />
                                            <span className="text-[10px] font-bold uppercase truncate w-full text-center" style={{ color: isFocused ? hAccent : '#9ca3af' }}>
                                                {hDef ? t(hDef.name) : h.name}
                                            </span>
                                            {/* Slots used, and the element this hero already
                                                carries — the tab is the only place a hero the
                                                player is NOT focused on is visible, and which
                                                element they hold decides which plant is worth
                                                grafting onto which of them. */}
                                            <span className="flex items-center gap-1">
                                                <span className="text-[9px] text-gray-500">{used}/{FUSION_SLOTS}</span>
                                                {h.element && <ElementBadge element={h.element} size={9} />}
                                            </span>
                                        </button>
                                    );
                                })}
                                {heroes.length === 0 && (
                                    <div className="text-gray-500 italic text-sm text-center py-4 w-full">{t('No heroes in the squad.')}</div>
                                )}
                            </div>
                        </div>

                        {/* Bench materials */}
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3">
                            <h3 className="text-[11px] uppercase font-bold tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                                <Sprout size={12} className="text-green-400" /> {t('Bench')}
                            </h3>
                            <div className="flex flex-col gap-2">
                                {/* Fusable first. Two seedlings of the same species look
                                    identical here, and one of them may be worn down past
                                    grafting — leading with the ones that actually work keeps
                                    the disabled ones from reading as the offer. */}
                                {[...bench]
                                    // rank 0 = fusable, 1 = not; ascending puts the usable
                                    // ones on top. (Written as an explicit rank because the
                                    // inline boolean-subtraction version had its operands
                                    // the wrong way round and sorted the dead ones first.)
                                    .sort((a, c) => {
                                        const rank = (pl: BenchPlant) =>
                                            hero && canFuse(hero, pl.materialId, t, knownRecipes, pl).ok ? 0 : 1;
                                        return rank(a) - rank(c);
                                    })
                                    .map(plant => {
                                    const def = getMaterial(plant.materialId);
                                    if (!def || !hero) return null;
                                    const recipe = getRecipe(hero.heroId, plant.materialId);
                                    const result = canFuse(hero, plant.materialId, t, knownRecipes, plant);
                                    const worn = (plant.hp ?? def.benchStats.maxHp) < def.benchStats.maxHp;
                                    const isSelected = selectedBenchId === plant.id;

                                    return (
                                        <button
                                            key={plant.id}
                                            onClick={() => setSelectedBenchId(isSelected ? null : plant.id)}
                                            disabled={!result.ok}
                                            data-tut={`fusion-plant-${plant.materialId}`}
                                            className={`
                                                text-left p-2.5 border-2 transition-colors flex gap-2.5 rounded
                                                ${isSelected
                                                    ? 'border-green-400 bg-green-950/40'
                                                    : result.ok
                                                        ? 'border-gray-700 bg-black/40 hover:border-green-600'
                                                        : 'border-gray-800 bg-black/60 opacity-50 cursor-not-allowed'}
                                            `}
                                        >
                                            <div className="w-11 h-11 bg-black border border-gray-600 flex items-center justify-center shrink-0">
                                                <img src={def.imgUrl} className="w-9 h-9 object-contain" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-bold text-green-200 text-sm truncate">
                                                        {t(def.name)}
                                                        {worn && (
                                                            <span className="ml-2 text-[10px] font-mono text-amber-400/90">
                                                                {plant.hp}/{def.benchStats.maxHp}
                                                            </span>
                                                        )}
                                                    </span>
                                                    {recipe && (
                                                        <span
                                                            className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm shrink-0"
                                                            style={{ color: categoryOf(recipe.effect.type).color, border: `1px solid ${categoryOf(recipe.effect.type).color}55` }}
                                                        >
                                                            {t(categoryOf(recipe.effect.type).label)}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* What THIS plant does on THE FOCUSED hero — the pair is the recipe. */}
                                                {recipe ? (
                                                    <div className="text-[10px] leading-snug mt-0.5">
                                                        <span style={{ color: accent }} className="font-bold">{t(recipe.name)}</span>
                                                        <span className="text-gray-400"> — {t(recipe.description)}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-gray-400 leading-snug mt-0.5">{t(def.description)}</div>
                                                )}
                                                <div className="text-[9px] text-gray-500 mt-1">
                                                    {t('As a body: {hp} HP · {dmg} DMG', { hp: def.benchStats.maxHp, dmg: def.benchStats.damage })}
                                                </div>
                                                {!result.ok && (
                                                    <div className="flex items-start gap-1 mt-1 text-[9px] text-red-400 leading-snug">
                                                        <Ban size={9} className="mt-[1px] shrink-0" /> {result.reason}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                                {bench.length === 0 && (
                                    <div className="text-gray-500 italic text-sm text-center py-8 leading-snug">
                                        {t('The bench is empty. Buy base plants at the shop.')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ---- CENTER: the hero, big ------------------------------------------ */}
                    <div className="flex-1 min-w-0 relative flex flex-col items-center justify-end pb-4 overflow-hidden">
                        <div
                            className="absolute inset-x-0 bottom-0 h-3/4 pointer-events-none"
                            style={{ background: `radial-gradient(ellipse at 50% 100%, ${accent}20 0%, transparent 65%)` }}
                        ></div>

                        {hero && heroDef && (
                            <>
                                <img
                                    src={heroDef.boardImgUrl ?? hero.imgUrl}
                                    alt={heroDef.name}
                                    className="relative z-10 max-h-[62%] w-auto object-contain"
                                    style={{ filter: `drop-shadow(0 12px 16px rgba(0,0,0,0.8)) drop-shadow(0 0 18px ${accent}44)` }}
                                />
                                <div
                                    className="relative z-0 -mt-3 w-[46%] h-6 rounded-[100%] pointer-events-none"
                                    style={{ background: `radial-gradient(ellipse at center, ${accent}55 0%, transparent 70%)` }}
                                ></div>

                                <div className="relative z-10 flex flex-col items-center gap-1.5 mt-2">
                                    <div className="text-2xl font-black uppercase tracking-widest" style={{ color: accent }}>
                                        {t(heroDef.name)}
                                    </div>
                                    {/* The element rides every attack this hero makes, so it
                                        stacks with what is about to be grafted on — Blizzard on
                                        an ICE hero turns that permanent slow into a permanent
                                        stun. Planning a build blind to it is not planning. */}
                                    {hero.element && <ElementBadge element={hero.element} size={12} showName />}
                                    {/* Fusion slots */}
                                    <div className="flex gap-2 mt-1">
                                        {Array.from({ length: FUSION_SLOTS }).map((_, slot) => {
                                            const entry = fusionsOfHero(hero)[slot];
                                            const isPreviewSlot = !entry && ready && slot === (hero.fusions ?? []).length;
                                            return (
                                                <div
                                                    key={slot}
                                                    title={entry?.recipe ? `${t(entry.recipe.name)} — ${t(entry.recipe.description)}` : t('Empty fusion slot')}
                                                    className={`w-10 h-10 border-2 flex items-center justify-center rounded ${entry ? 'bg-purple-950/50' : 'border-dashed bg-black/40'}`}
                                                    style={{
                                                        borderColor: entry ? accent : isPreviewSlot ? '#4ade80' : '#4b5563',
                                                        boxShadow: isPreviewSlot ? '0 0 10px #4ade8055' : undefined,
                                                    }}
                                                >
                                                    {entry
                                                        ? <img src={entry.mat?.imgUrl} className="w-8 h-8 object-contain" />
                                                        : isPreviewSlot && selectedPlant
                                                            ? <img src={getMaterial(selectedPlant.materialId)?.imgUrl} className="w-8 h-8 object-contain opacity-60 animate-pulse" />
                                                            : <span className="text-[9px] text-gray-600 uppercase">{t('empty')}</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ---- RIGHT: everything the fusion touches --------------------------- */}
                    <div className="w-[240px] md:w-[300px] xl:w-[400px] shrink-0 border-l border-gray-800 flex flex-col min-h-0">
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">

                            {previewRecipe && selectedPlant && (
                                <div className="border-2 rounded p-3" style={{ borderColor: '#4ade80', background: '#052e1633' }}>
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-green-400 mb-1">
                                        <ArrowRight size={11} /> {t('After fusing {name}:', { name: t(getMaterial(selectedPlant.materialId)?.name ?? '') })}
                                    </div>
                                    <div className="text-sm font-black uppercase" style={{ color: categoryOf(previewRecipe.effect.type).color }}>
                                        {t(previewRecipe.name)}
                                    </div>
                                    <div className="text-[11px] text-gray-300 leading-snug mt-0.5">{t(previewRecipe.description)}</div>
                                    {!previewRecipe.live && (
                                        <div className="text-[10px] text-amber-400 mt-1">{t('Not wired into combat yet')}</div>
                                    )}
                                </div>
                            )}

                            {/* STATS */}
                            {hero && (
                                <div>
                                    <h3 className="text-[11px] uppercase font-bold tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                                        <Shield size={12} /> {t('Stats')}
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {/* The element's bill is already baked into maxHp, so this
                                            number disagrees with the hero sheet on its own. Say why,
                                            and read the figure from the constant — it moved 1 -> 2
                                            once already and a copy here would now be lying. */}
                                        <div
                                            className="bg-black/40 border border-gray-700 rounded p-2 flex flex-col items-center gap-1"
                                            title={hero.element ? t('-{n} max HP', { n: ELEMENT_HP_COST }) : undefined}
                                        >
                                            <Heart size={14} className="text-red-400" fill="currentColor" />
                                            <span className="text-sm font-black">
                                                {hero.hp}/<Diff before={hero.maxHp} after={simHero?.maxHp} />
                                            </span>
                                            <span className="text-[9px] uppercase text-gray-500">{t('HP')}</span>
                                        </div>
                                        <div className="bg-black/40 border border-gray-700 rounded p-2 flex flex-col items-center gap-1">
                                            <HandFist size={14} className="text-orange-400" />
                                            <span className="text-sm font-black">{hero.damage}</span>
                                            <span className="text-[9px] uppercase text-gray-500">{t('Damage')}</span>
                                        </div>
                                        <div className="bg-black/40 border border-gray-700 rounded p-2 flex flex-col items-center gap-1">
                                            <Footprints size={14} className="text-sky-400" />
                                            <span className="text-sm font-black">{hero.moveRange}</span>
                                            <span className="text-[9px] uppercase text-gray-500">{t('Move')}</span>
                                        </div>
                                    </div>
                                    {hero.element && (
                                        <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-gray-500">
                                            <ElementBadge element={hero.element} size={9} showName />
                                            <span>{t('-{n} max HP', { n: ELEMENT_HP_COST })}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ACTIVE SKILLS — before → after */}
                            {hero && (
                                <div>
                                    <h3 className="text-[11px] uppercase font-bold tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                                        <Swords size={12} /> {t('Active skills')}
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        {(after ?? before).map(view => {
                                            const prev = before.find(b => b.key === view.key);
                                            const isNew = !!after && !prev;
                                            const addedTags = prev ? view.tags.filter(tag => !prev.tags.includes(tag)) : view.tags;
                                            return (
                                                <div
                                                    key={view.key}
                                                    className="border rounded p-2.5 bg-black/40"
                                                    style={{ borderColor: isNew ? '#4ade80' : '#374151', boxShadow: isNew ? '0 0 10px #4ade8033' : undefined }}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-100 truncate">
                                                            {view.isHeroSkill ? <Sparkles size={11} className="text-yellow-400 shrink-0" /> : <Swords size={11} className="text-gray-400 shrink-0" />}
                                                            <span className="truncate">{view.name}</span>
                                                            {isNew && <span className="text-[9px] font-black px-1 rounded-sm bg-green-500 text-black shrink-0">{t('NEW')}</span>}
                                                        </span>
                                                        <span className="flex items-center gap-2 shrink-0 text-[11px] font-black">
                                                            {(view.damage > 0 || (prev && prev.damage > 0)) && (
                                                                <span className="flex items-center gap-1 text-orange-400">
                                                                    <HandFist size={10} /> <Diff before={prev?.damage ?? view.damage} after={after ? view.damage : undefined} />
                                                                </span>
                                                            )}
                                                            {(view.cost > 0 || (prev?.cost ?? 0) > 0) ? (
                                                                <span className="flex items-center gap-1 text-yellow-400">
                                                                    <Sol size={10} fill="currentColor" /> <Diff before={prev?.cost ?? view.cost} after={after ? view.cost : undefined} />
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold uppercase text-green-400">{t('Free')}</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-gray-800 text-gray-300 border border-gray-600">
                                                            {prev && prev.rangeText !== view.rangeText
                                                                ? <Diff before={prev.rangeText} after={view.rangeText} />
                                                                : view.rangeText}
                                                        </span>
                                                        {view.tags.map(tag => (
                                                            <span
                                                                key={tag}
                                                                className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm border ${addedTags.includes(tag)
                                                                    ? 'bg-green-950/60 text-green-300 border-green-500'
                                                                    : 'bg-gray-800 text-gray-300 border-gray-600'}`}
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                        {/* Tags the fusion REMOVES (e.g. Pea Lance trades the push away) */}
                                                        {prev && prev.tags.filter(tag => !view.tags.includes(tag)).map(tag => (
                                                            <span key={tag} className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-red-950/50 text-red-400 border border-red-800 line-through">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <p className="text-[10px] leading-snug text-gray-400 mt-1.5">{view.desc}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* PASSIVES & FUSIONS carried */}
                            {hero && (
                                <div>
                                    <h3 className="text-[11px] uppercase font-bold tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                                        <FlaskConical size={12} /> {t('Passives & fusions')}
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        {/* The element is a permanent rider on every attack, which
                                            makes it a passive in everything but name — and it is the
                                            one already on the hero when the grafts land on top of it.
                                            Listed first so the stack reads in the order it resolves. */}
                                        {hero.element && (
                                            <div className="border border-gray-700 rounded p-2.5 bg-black/40 flex gap-2.5">
                                                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                                    <ElementBadge element={hero.element} size={14} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold uppercase" style={{ color: ELEMENT_DEFINITIONS[hero.element].accent }}>
                                                            {t(ELEMENT_DEFINITIONS[hero.element].name)}
                                                        </span>
                                                        <span
                                                            className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm"
                                                            style={{ color: ELEMENT_DEFINITIONS[hero.element].accent, border: `1px solid ${ELEMENT_DEFINITIONS[hero.element].accent}55` }}
                                                        >
                                                            {t('Element')}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 leading-snug mt-0.5">
                                                        {t(ELEMENT_DEFINITIONS[hero.element].description)}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {fusionsOfHero(hero).map(({ id, mat, recipe }) => recipe && (
                                            <div key={id} className="border border-gray-700 rounded p-2.5 bg-black/40 flex gap-2.5">
                                                <img src={mat?.imgUrl} className="w-8 h-8 object-contain shrink-0" />
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold uppercase" style={{ color: accent }}>{t(recipe.name)}</span>
                                                        <span
                                                            className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm"
                                                            style={{ color: categoryOf(recipe.effect.type).color, border: `1px solid ${categoryOf(recipe.effect.type).color}55` }}
                                                        >
                                                            {t(categoryOf(recipe.effect.type).label)}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 leading-snug mt-0.5">{t(recipe.description)}</div>
                                                </div>
                                            </div>
                                        ))}
                                        {(hero.fusions ?? []).length === 0 && !previewRecipe && (
                                            <div className="text-[11px] text-gray-500 italic">{t('No fusions yet — pick a plant on the left.')}</div>
                                        )}
                                        {previewRecipe && selectedPlant && (
                                            <div className="border-2 border-dashed rounded p-2.5 flex gap-2.5" style={{ borderColor: '#4ade8088', background: '#052e1622' }}>
                                                <img src={getMaterial(selectedPlant.materialId)?.imgUrl} className="w-8 h-8 object-contain shrink-0" />
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold uppercase text-green-300">{t(previewRecipe.name)}</span>
                                                        <span className="text-[9px] font-black px-1 rounded-sm bg-green-500 text-black">{t('NEW')}</span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 leading-snug mt-0.5">{t(previewRecipe.description)}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* FOOTER: the trade-off + confirm */}
                <div className="relative z-10 border-t border-gray-800 px-6 py-3 flex items-center gap-4 shrink-0 bg-black/40">
                    <div className="flex items-start gap-2 text-[11px] text-red-200 leading-snug flex-1 min-w-0">
                        <AlertTriangle size={13} className="text-red-400 shrink-0 mt-[1px]" />
                        <span>
                            <span className="uppercase font-bold text-red-300">{t('This cannot be undone.')}</span>{' '}
                            {t('The plant is consumed by the fusion and leaves the bench for good — it will')}
                            <span className="text-red-300"> {t('never be available as a body')} </span>
                            {t("to fill a fallen hero's slot. Fusing everything means going in without insurance.")}
                        </span>
                    </div>
                    {check && !check.ok && (
                        <div className="text-[11px] text-red-400 shrink-0">{check.reason}</div>
                    )}
                    <button
                        onClick={confirm}
                        disabled={!ready}
                        data-tut="fusion-confirm"
                        className={`
                            px-6 py-2.5 border-2 uppercase font-bold tracking-widest text-sm shrink-0
                            ${ready
                                ? 'bg-purple-900 border-purple-400 hover:bg-purple-800 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'}
                        `}
                    >
                        {t('Fuse — Permanent')}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 border-2 border-gray-500 text-white uppercase tracking-widest font-bold text-sm shrink-0"
                    >
                        {t('Done')}
                    </button>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #0f1012; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
            `}</style>
        </div>
    );
};
