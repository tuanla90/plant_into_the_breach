import React, { useState } from 'react';
import { HeroId, MaterialId, Skill, UnitClass, UnlockState } from '../types';
import { HERO_DEFINITIONS } from '../data/heroes';
import { ROLE_META, ROLE_ORDER, HeroRoleChip } from './HeroRoleChip';
import { MATERIAL_DEFINITIONS, STARTING_MATERIALS } from '../data/materials';
import { FUSION_RECIPES } from '../data/fusionRecipes';
import { recipeKey, unlockInfoFor, SIGNATURE_MATERIAL } from '../data/unlocks';
import { HERO_ACCENTS } from '../utils/icons';
import { useI18n } from '../i18n';
import {
    X, Lock, Heart, HandFist, Footprints,
    Sun, Swords, Sparkles, Check,
} from 'lucide-react';

/**
 * THE CODEX — the one place that answers "what exists, and what do I have".
 *
 * Nothing here is new information; every fact was already somewhere in the game. The problem
 * was that no single screen held any of it at once:
 *   - the hero picker shows locks, but never a recipe
 *   - the campfire fusion panel shows recipes, but only for the three plants on the bench,
 *     and only while standing at a campfire
 *   - the shop shows a fusion column, but only for the item currently on sale
 *
 * So the question a player actually asks between runs — "which pairings do I still not know?"
 * — had no answer anywhere. With thirty-six authored pairings and three known at the start,
 * that made the entire recipe economy invisible: bonus objectives paid out into a pool the
 * player could not see the shape of.
 *
 * Read-only by design. This screen never grants, never spends and never writes; it is the
 * reference, and every unlock still happens where it was earned.
 */

const prettyClass = (cls: UnitClass) =>
    cls.toString().toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

/** Every hero, in the order they are authored: the starting three, then unlock order. */
const ROSTER = Object.keys(HERO_DEFINITIONS) as HeroId[];

/**
 * Column order is DERIVED from the row order — each hero's signature material, in hero order.
 *
 * The matrix used to take its rows from the hero table and its columns from the material
 * table, and those two lists are ordered by different things. The result was a grid whose
 * six signature pairings sat scattered across it, so the one structural fact about the matrix
 * — every hero has exactly one plant it was grown from — was invisible. Deriving the columns
 * puts those six on the diagonal, and keeps them there when a pack adds a hero and a plant.
 *
 * Anything no hero signs (a material added ahead of its hero) is appended rather than dropped.
 */
const MATERIALS: MaterialId[] = (() => {
    const signatures = ROSTER.map(h => SIGNATURE_MATERIAL[h]).filter((m, i, all) => all.indexOf(m) === i);
    return [...signatures, ...STARTING_MATERIALS.filter(m => !signatures.includes(m))];
})();

// ---------------------------------------------------------------------------
// HEROES
// ---------------------------------------------------------------------------

const SkillLine: React.FC<{ skill: Skill; isSkill?: boolean }> = ({ skill, isSkill }) => {
    const { t } = useI18n();
    const cost = skill.sunCost ?? 0;
    const damage = skill.effects?.find(e => e.type === 'DAMAGE')?.value ?? 0;
    return (
        <div className={`flex flex-col gap-0.5 p-2 rounded border ${isSkill ? 'border-yellow-900/60 bg-yellow-950/30' : 'border-gray-800 bg-black/40'}`}>
            <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-200 truncate">
                    {isSkill ? <Sparkles size={11} className="text-yellow-400 shrink-0" /> : <Swords size={11} className="text-gray-400 shrink-0" />}
                    <span className="truncate">{t(skill.name)}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                    {damage > 0 && damage < 900 && (
                        <span className="flex items-center gap-1 text-[11px] font-black text-orange-400">
                            <HandFist size={10} /> {damage}
                        </span>
                    )}
                    {cost > 0 ? (
                        <span className="flex items-center gap-1 text-[11px] font-black text-yellow-400">
                            <Sun size={10} fill="currentColor" /> {cost}
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold uppercase text-green-400">{t('Free')}</span>
                    )}
                </span>
            </div>
            <p className="text-[11px] leading-tight text-gray-400 normal-case tracking-normal">{t(skill.description)}</p>
        </div>
    );
};

const HeroCard: React.FC<{ heroId: HeroId; owned: boolean; knownRecipes: number }> = ({ heroId, owned, knownRecipes }) => {
    const { t } = useI18n();
    const hero = HERO_DEFINITIONS[heroId];
    const accent = HERO_ACCENTS[heroId] ?? '#facc15';
    const info = owned ? undefined : unlockInfoFor(heroId);
    const sprite = hero.boardImgUrl ?? hero.imgUrl;

    return (
        <div
            className={`relative flex flex-col rounded-lg border-2 overflow-hidden min-h-[440px]
                ${owned ? 'bg-[#12141a] border-[#252a35]' : 'bg-[#0b0c0f] border-[#1e2128]'}`}
            style={owned ? { boxShadow: `inset 0 0 40px ${accent}11` } : undefined}
        >
            <div
                className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 50% 100%, ${accent}${owned ? '18' : '08'} 0%, transparent 65%)` }}
            />

            {/* Same veil as the hero picker, deliberately: the player has already learned to
                read it there, and a second visual language for "locked" would teach nothing. */}
            {!owned && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-end gap-2 px-4 pb-6
                                bg-gradient-to-t from-[#0b0c0f] via-[#0b0c0f]/85 to-[#0b0c0f]/45 pointer-events-none">
                    <Lock size={26} className="text-gray-500 mb-1" />
                    <div className="text-[11px] uppercase tracking-widest text-gray-500">{t('Locked')}</div>
                    {info && (
                        <>
                            <div className="text-sm font-bold uppercase tracking-wider text-center" style={{ color: accent }}>
                                {t(info.city)}
                            </div>
                            <p className="text-[11px] leading-snug text-gray-400 text-center normal-case tracking-normal">
                                {t(info.hint)}
                            </p>
                            <div className="mt-1 px-2 py-1 border border-[#2b303b] text-[10px] uppercase tracking-widest text-gray-400">
                                {t('Defeat {boss}', { boss: t(info.name) })}
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="relative flex-1 min-h-0 flex items-end justify-center pt-4 px-2">
                <img
                    src={sprite}
                    alt={hero.name}
                    className="relative z-10 max-h-[190px] w-auto object-contain object-bottom"
                    style={{
                        filter: owned
                            ? 'drop-shadow(0 10px 12px rgba(0,0,0,0.7))'
                            : 'brightness(0.18) grayscale(1) drop-shadow(0 10px 12px rgba(0,0,0,0.7))',
                    }}
                />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-1 px-3 pt-2">
                <div className="text-lg font-black uppercase tracking-widest leading-none text-center"
                     style={{ color: owned ? accent : '#6b7280' }}>
                    {t(hero.name)}
                </div>
                {/* Role first, plant second — same pairing and same chip as the squad
                    picker, so the two roster views cannot drift apart. */}
                <div className="flex items-center gap-1.5 max-w-full">
                    <HeroRoleChip role={hero.role} dim={!owned} />
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 truncate">{t(prettyClass(hero.baseClass))}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-[12px] font-mono font-bold">
                    <span className="flex items-center gap-1 text-red-400"><Heart size={12} fill="currentColor" />{hero.maxHp}</span>
                    <span className="flex items-center gap-1 text-orange-400"><HandFist size={12} />{hero.damage}</span>
                    <span className="flex items-center gap-1 text-sky-400"><Footprints size={12} />{hero.moveRange}</span>
                </div>
            </div>

            <div className="relative z-10 flex flex-col gap-1.5 p-3">
                <SkillLine skill={hero.basicAttack} />
                <SkillLine skill={hero.heroSkill} isSkill />
            </div>

            {/* The bridge between the two tabs: a hero is not just a portrait, it is six
                pairings, and this says how many of them you have. */}
            <div className="relative z-10 flex items-center justify-between px-3 py-2 border-t border-[#1c1f27] bg-black/40 text-[11px] uppercase tracking-widest">
                <span className="text-gray-500">{t('Recipes')}</span>
                <span className="font-black" style={{ color: knownRecipes > 0 ? accent : '#4b5563' }}>
                    {knownRecipes}/{MATERIALS.length}
                </span>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// RECIPES
// ---------------------------------------------------------------------------

interface CellSel { hero: HeroId; material: MaterialId }

export const RecipeMatrix: React.FC<{ unlocks: UnlockState }> = ({ unlocks }) => {
    const { t } = useI18n();
    const roster = ROSTER;
    const [sel, setSel] = useState<CellSel | null>(null);

    const known = (h: HeroId, m: MaterialId) => unlocks.recipes.includes(recipeKey(h, m));
    const owned = (h: HeroId) => unlocks.heroes.includes(h);

    const total = roster.length * MATERIALS.length;
    const learned = roster.reduce(
        (n, h) => n + MATERIALS.filter(m => known(h, m)).length, 0);

    const selRecipe = sel ? FUSION_RECIPES[sel.hero]?.[sel.material] : null;
    const selKnown = sel ? known(sel.hero, sel.material) : false;

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* PROGRESS */}
            <div className="shrink-0 px-6 py-3 border-b border-[#1c1f27] bg-[#0f1116] flex items-center gap-5">
                <span className="text-sm uppercase tracking-widest text-gray-400">{t('Recipes known')}</span>
                <span className="font-black text-emerald-400 text-lg">{learned}<span className="text-gray-600 text-sm">/{total}</span></span>
                <div className="flex-1 h-2 bg-[#1a1d24] rounded overflow-hidden max-w-xl">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(learned / total) * 100}%` }} />
                </div>
                <span className="text-[11px] text-gray-600 normal-case tracking-normal">
                    {t('Every commander level opens one more pairing.')}
                </span>
            </div>

            {/* MATRIX */}
            <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
                <table className="border-collapse min-w-full">
                    <thead>
                        <tr>
                            <th className="sticky left-0 top-0 z-30 bg-[#0f1116] border-b border-r border-[#1c1f27] w-44" />
                            {MATERIALS.map(m => {
                                const mat = MATERIAL_DEFINITIONS[m];
                                return (
                                    <th key={m}
                                        className="sticky top-0 z-20 bg-[#0f1116] border-b border-[#1c1f27] px-2 py-2 min-w-[150px]">
                                        <div className="flex flex-col items-center gap-1">
                                            <img src={mat.imgUrl} alt="" className="w-9 h-9 object-contain" />
                                            <span className="text-[11px] uppercase tracking-wider text-gray-300">{t(mat.name)}</span>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {roster.map(h => {
                            const hero = HERO_DEFINITIONS[h];
                            const accent = HERO_ACCENTS[h] ?? '#facc15';
                            const heroOwned = owned(h);
                            return (
                                <tr key={h}>
                                    {/* Row header: the hero. Sticky so a horizontal scroll never
                                        leaves a grid of unlabelled cells. */}
                                    <th className={`sticky left-0 z-10 border-r border-b border-[#1c1f27] px-3 py-2 text-left w-44
                                                    ${heroOwned ? 'bg-[#12141a]' : 'bg-[#0b0c0f]'}`}>
                                        <div className="flex items-center gap-2">
                                            <img src={hero.imgUrl} alt="" className="w-8 h-8 object-contain shrink-0"
                                                 style={heroOwned ? undefined : { filter: 'brightness(0.3) grayscale(1)' }} />
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold uppercase tracking-wider truncate"
                                                     style={{ color: heroOwned ? accent : '#4b5563' }}>
                                                    {t(hero.name)}
                                                </div>
                                                {!heroOwned && (
                                                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-gray-600">
                                                        <Lock size={9} /> {t('Locked')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </th>

                                    {MATERIALS.map(m => {
                                        const isKnown = known(h, m);
                                        const recipe = FUSION_RECIPES[h]?.[m];
                                        const isSel = sel?.hero === h && sel?.material === m;
                                        const isSignature = SIGNATURE_MATERIAL[h] === m;
                                        return (
                                            <td key={m} className="border-b border-l border-[#15171d] p-1 align-top">
                                                <button
                                                    onClick={() => setSel(isSel ? null : { hero: h, material: m })}
                                                    className={`w-full h-[62px] px-2 py-1.5 text-left rounded border transition-colors
                                                        ${isSel ? 'border-white bg-[#20242e]'
                                                            : isKnown ? 'border-[#2b3a30] bg-[#141b17] hover:bg-[#18211c]'
                                                            : heroOwned ? 'border-[#20242c] bg-[#0e1015] hover:bg-[#13161c]'
                                                            // Hero not owned: dimmer again. Two
                                                            // different reasons to be locked
                                                            // deserve two different weights.
                                                            : 'border-[#16181d] bg-[#0a0b0e] hover:bg-[#0e1014]'}`}
                                                >
                                                    {isKnown ? (
                                                        <>
                                                            <div className="flex items-center gap-1.5">
                                                                <Check size={11} className="text-emerald-500 shrink-0" />
                                                                <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-300 truncate">
                                                                    {t(recipe.name)}
                                                                </span>
                                                            </div>
                                                            <p className="mt-0.5 text-[10px] leading-tight text-gray-500 line-clamp-2 normal-case tracking-normal">
                                                                {t(recipe.description)}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <div className="h-full flex flex-col items-center justify-center gap-1">
                                                            <Lock size={13} className={heroOwned ? 'text-gray-600' : 'text-gray-800'} />
                                                            <span className={`text-[9px] uppercase tracking-widest ${heroOwned ? 'text-gray-600' : 'text-gray-800'}`}>
                                                                {heroOwned ? t('Unknown') : t('Hero locked')}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {isSignature && (
                                                        <div className="mt-0.5 text-[9px] uppercase tracking-widest text-amber-600/70">
                                                            {t('Own plant')}
                                                        </div>
                                                    )}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* DETAIL — a cell is 62px tall and the descriptions are a sentence long, so the
                grid can only ever show a clamped preview. This is where the whole line lives. */}
            {sel && selRecipe && (
                <div className="shrink-0 border-t-2 border-[#2b303b] bg-[#12141a] px-6 py-3 flex items-center gap-5">
                    <img src={HERO_DEFINITIONS[sel.hero].imgUrl} alt="" className="w-12 h-12 object-contain shrink-0" />
                    <span className="text-2xl text-gray-700 font-black">+</span>
                    <img src={MATERIAL_DEFINITIONS[sel.material].imgUrl} alt="" className="w-12 h-12 object-contain shrink-0" />
                    <div className="min-w-0 flex-1">
                        <div className="text-[11px] uppercase tracking-widest text-gray-500">
                            {t(HERO_DEFINITIONS[sel.hero].name)} + {t(MATERIAL_DEFINITIONS[sel.material].name)}
                        </div>
                        <div className={`text-base font-black uppercase tracking-wider ${selKnown ? 'text-emerald-300' : 'text-gray-500'}`}>
                            {selKnown ? t(selRecipe.name) : t('Recipe not learned yet')}
                        </div>
                        <p className="text-xs text-gray-400 normal-case tracking-normal">
                            {selKnown
                                ? t(selRecipe.description)
                                : owned(sel.hero)
                                    ? t('Level up to open more pairings.')
                                    : t('Unlock this hero first — its pairings come after.')}
                        </p>
                    </div>
                    <button onClick={() => setSel(null)} className="p-2 border border-[#2b303b] hover:bg-[#23262f] text-gray-500 shrink-0">
                        <X size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// MOUNTED BY THE ARCHIVE
// ---------------------------------------------------------------------------
//
// These two used to be tabs of a separate full-screen Codex, reachable from its own button
// on the main menu — next to the Tactical Archive button, which is also a reference the
// player reads between runs. Two adjacent buttons for "the book" is one book too many, so
// the Archive absorbed both and this file now exports the panels rather than a screen.

export const HeroGrid: React.FC<{ unlocks: UnlockState }> = ({ unlocks }) => {
    const { t } = useI18n();
    const recipesOfHero = (h: HeroId) =>
        MATERIALS.filter(m => unlocks.recipes.includes(recipeKey(h, m))).length;

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-6">
            {/* Grouped by role, exactly like the squad picker. A flat three-column grid was
                fine at six heroes and stops being fine at ten: 3+3+3+1 strands a single card
                on a row of its own, and more importantly a flat list never says the thing a
                player needs from this screen — that the roster is three thirds and a squad
                wants a spread. Three columns inside each group keeps 3-hero groups on one
                row at desktop widths. */}
            <div className="max-w-[1180px] mx-auto flex flex-col gap-5">
                {ROLE_ORDER.map(role => {
                    const group = ROSTER.filter(h => HERO_DEFINITIONS[h].role === role);
                    if (!group.length) return null;
                    const meta = ROLE_META[role];
                    const owned = group.filter(h => unlocks.heroes.includes(h)).length;
                    return (
                        <section key={role}>
                            <div className="flex items-center gap-3 mb-2">
                                <span
                                    className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-black uppercase tracking-widest border shrink-0"
                                    style={{ color: meta.color, borderColor: `${meta.color}66`, backgroundColor: `${meta.color}14` }}
                                >
                                    {meta.icon}{t(meta.label)}
                                </span>
                                <span className="text-[11px] text-gray-500 normal-case tracking-normal truncate">{t(meta.blurb)}</span>
                                <div className="h-px flex-1 bg-gray-800" />
                                <span className="text-[10px] font-mono text-gray-600 shrink-0">{owned}/{group.length}</span>
                            </div>
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {group.map(h => (
                                    <HeroCard
                                        key={h}
                                        heroId={h}
                                        owned={unlocks.heroes.includes(h)}
                                        knownRecipes={recipesOfHero(h)}
                                    />
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
};

/** Numbers the Archive prints on its tab chips. */
export const codexCounts = (unlocks: UnlockState) => ({
    heroesOwned: ROSTER.filter(h => unlocks.heroes.includes(h)).length,
    heroesTotal: ROSTER.length,
    recipesKnown: unlocks.recipes.length,
    recipesTotal: ROSTER.length * MATERIALS.length,
});
