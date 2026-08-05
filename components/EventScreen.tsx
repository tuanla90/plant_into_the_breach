import React, { useState } from 'react';
import { GameEvent, EventOption, EventEffect, EventOutcome, Unit, HeroId } from '../types';
import { ArrowRight, Coins, TriangleAlert, Plus, Minus, HelpCircle, Combine } from 'lucide-react';
import { COIN_REVIVE_HERO, BENCH_CAPACITY } from '../constants';
import { HERO_DEFINITIONS } from '../data/heroes';
import { useI18n } from '../i18n';
import { resolveEffects } from '../utils/eventRoll';

interface EventScreenProps {
    event: GameEvent;
    sun: number;
    units: Unit[];
    onResolve: (effects: EventEffect[]) => void;
    /** Coin purse. Everything an event charges is paid in Coin (DESIGN.md section 3). */
    coins?: number;
    /** Base plants currently benched — some options are paid with one of these. */
    benchCount?: number;
    /** Heroes knocked out this run and waiting to be revived (DESIGN.md section 2). */
    fallenHeroes?: HeroId[];
    /** Spends the Coin and queues the hero for the next level. */
    onReviveHero?: (heroId: HeroId) => void;
    /**
     * The revive option has been armed and the hero picker is showing.
     *
     * Lifted out because the tutorial overlay decides which control to open a hole over by
     * reading game state, and "the picker is up" is the only observable result of clicking
     * a revive option — every other event choice resolves by changing the screen.
     */
    onPickingChange?: (picking: boolean) => void;
    /**
     * Opens the fusion bench. Only the Campfire passes this (fusing is a rest-point
     * action, DESIGN.md) — when set, a fusion entry renders above the event's options,
     * styled as one of them, replacing the old floating corner button.
     */
    onOpenFusion?: () => void;
}

/** One consequence chip. Green = you get this, amber = you pay it, red = it costs you later. */
const OutcomeChip: React.FC<{ outcome: EventOutcome; t: (s: string) => string }> = ({ outcome, t }) => {
    const style = {
        GAIN: 'bg-emerald-950/70 border-emerald-600 text-emerald-300',
        COST: 'bg-amber-950/70 border-amber-600 text-amber-300',
        RISK: 'bg-red-950/70 border-red-600 text-red-300',
    }[outcome.kind];

    const Icon = outcome.kind === 'GAIN' ? Plus : outcome.kind === 'COST' ? Minus : TriangleAlert;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 border text-xs leading-tight ${style}`}>
            <Icon size={12} className="shrink-0" />
            {typeof outcome.chance === 'number' && (
                <b className="font-mono opacity-90">{Math.round(outcome.chance * 100)}%</b>
            )}
            {t(outcome.text)}
        </span>
    );
};

export const EventScreen: React.FC<EventScreenProps> = ({
    event,
    onResolve,
    coins = 0,
    benchCount = 0,
    fallenHeroes = [],
    onReviveHero,
    onPickingChange,
    onOpenFusion,
}) => {
    const { t } = useI18n();
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [resultMsg, setResultMsg] = useState<string | null>(null);
    /** Index of the revive option whose hero picker is open, or null. */
    const [pickingRevive, setPickingRevive] = useState<number | null>(null);
    const [imgFailed, setImgFailed] = useState(false);

    const isRevive = (opt: EventOption) => opt.effects.some(e => e.type === 'REVIVE_HERO');
    const canPayRevive = coins >= COIN_REVIVE_HERO;
    const hasFallen = fallenHeroes.length > 0;
    const reviveAvailable = hasFallen && canPayRevive && !!onReviveHero;

    /** Why an option is greyed out — shown in place of the outcome chips. */
    const blockedReason = (opt: EventOption): string | null => {
        if (isRevive(opt)) {
            if (!hasFallen) return t('The whole squad is standing. Nobody to revive.');
            if (!canPayRevive) return t('Not enough Coin — you need {amount} more.', { amount: COIN_REVIVE_HERO - coins });
            if (!onReviveHero) return t('Revival is unavailable here.');
            return null;
        }
        if (opt.req?.type === 'COIN' && coins < opt.req.value) {
            return t('Not enough Coin — you need {amount} more.', { amount: opt.req.value - coins });
        }
        if (opt.req?.type === 'BENCH' && benchCount < opt.req.value) {
            return t('Your bench is empty — nothing to trade.');
        }
        return null;
    };

    const resolveWithMessage = (index: number, effects: EventEffect[], msg: string) => {
        setSelectedOption(index);
        setPickingRevive(null);
        setResultMsg(msg);
        setTimeout(() => onResolve(effects), 1000);
    };

    /** What actually happened, read back off the RESOLVED effects so it can never drift. */
    const resultFor = (resolved: EventEffect[]): string => {
        const parts: string[] = [];
        resolved.forEach(e => {
            switch (e.type) {
                case 'GAIN_COIN': parts.push(t('+{value} Coin', { value: e.value })); break;
                case 'LOSE_COIN': parts.push(t('-{value} Coin', { value: e.value })); break;
                case 'GAIN_BRAIN': parts.push(t('+1 Brain')); break;
                case 'LOSE_BRAIN': parts.push(t('-1 Brain')); break;
                case 'GAIN_BENCH_PLANT': parts.push(t('A plant joins the bench')); break;
                case 'LOSE_BENCH_PLANT': parts.push(t('A bench plant is gone')); break;
                case 'GAIN_ITEM': parts.push(t('You found a new Item!')); break;
                case 'NEXT_BATTLE_MOD': parts.push(t('The next battle has changed')); break;
                case 'HEAL_SQUAD_FULL': parts.push(t('The squad wakes at full strength')); break;
                case 'NOTHING': parts.push(t('Nothing happened.')); break;
                default: break;
            }
        });
        return parts.length > 0 ? parts.join('  ·  ') : t('Nothing happened.');
    };

    const handleSelect = (index: number, opt: EventOption) => {
        if (blockedReason(opt)) return;

        // Revival is a two-step choice: first the option, then *which* hero comes back.
        if (isRevive(opt)) {
            if (!reviveAvailable) return;
            setPickingRevive(prev => {
                const next = prev === index ? null : index;
                onPickingChange?.(next !== null);
                return next;
            });
            return;
        }
        // One roll, one truth: the banner and the applied effects come from the same list.
        const rolled = resolveEffects(opt.effects);
        resolveWithMessage(index, rolled, resultFor(rolled));
    };

    const handleRevivePick = (index: number, opt: EventOption, heroId: HeroId) => {
        if (!reviveAvailable || !onReviveHero) return;
        onReviveHero(heroId);
        const name = HERO_DEFINITIONS[heroId]?.name || heroId;
        resolveWithMessage(index, opt.effects, t('{name} is back on their feet — fusions intact.', { name: t(name) }));
    };

    return (
        <div className="w-full h-full bg-[#0d0e11] flex items-center justify-center font-pixel relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1a1c21_0%,#000_100%)] z-0"></div>

            {/* EVENT CARD */}
            <div className="relative z-10 w-full max-w-4xl max-h-[92dvh] bg-[#1a1c21] border-2 border-gray-600 shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300">

                {/* IMAGE SIDE — art is optional; a missing file must not leave a broken frame. */}
                <div className="w-full md:w-1/3 bg-black relative border-b md:border-b-0 md:border-r border-gray-600 shrink-0 min-h-[120px]">
                    {imgFailed ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-700">
                            <HelpCircle size={48} />
                        </div>
                    ) : (
                        <img
                            src={event.imgUrl}
                            alt=""
                            onError={() => setImgFailed(true)}
                            className="w-full h-full object-cover opacity-80"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c21] to-transparent pointer-events-none"></div>
                </div>

                {/* CONTENT SIDE */}
                <div className="flex-1 p-8 flex flex-col min-w-0 overflow-y-auto">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <h2 className="text-3xl font-bold uppercase text-yellow-400 tracking-wider">{t(event.title)}</h2>
                        <div className="flex items-center gap-2 text-amber-300 text-lg shrink-0 border border-amber-800 px-3 py-1 bg-black/40">
                            <Coins size={18} /> {coins}
                        </div>
                    </div>

                    <p className="text-gray-300 text-lg leading-relaxed mb-6 border-l-4 border-gray-500 pl-4 italic">
                        "{t(event.description)}"
                    </p>

                    {/* OPTIONS */}
                    <div className="space-y-3 mt-auto">
                        {/* FUSION — a rest-point action, presented as one of the campfire's own
                            choices and bound by the same rule: one visit, one choice. Opening
                            the bench and fusing spends the rest (App resolves the event when
                            the panel closes after a fuse), so it disables like a sibling once
                            another option has been taken. */}
                        {onOpenFusion && (
                            <button
                                onClick={() => benchCount > 0 && selectedOption === null && onOpenFusion()}
                                data-tut="campfire-fuse"
                                disabled={benchCount === 0 || selectedOption !== null}
                                title={benchCount === 0 ? t('No base plants on the bench to fuse.') : undefined}
                                className={`
                                    w-full text-left p-4 border-2 transition-all group
                                    ${benchCount === 0 || selectedOption !== null
                                        ? 'bg-[#23262f] border-gray-700 opacity-50 cursor-not-allowed grayscale'
                                        : 'bg-[#23262f] border-fuchsia-700 hover:border-fuchsia-400'}
                                `}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-xl font-bold uppercase text-fuchsia-300 flex items-center gap-2">
                                        <Combine size={20} className="shrink-0" />
                                        {t('Fuse Plants')}
                                    </span>
                                    <span className="text-xs bg-black/50 border border-fuchsia-800 text-fuchsia-300 px-2 py-0.5 rounded shrink-0">
                                        {benchCount}/{BENCH_CAPACITY}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-400 group-hover:text-gray-200 mt-1">
                                    {benchCount === 0
                                        ? t('No base plants on the bench to fuse.')
                                        : t('Merge a bench plant into a hero.')}
                                </div>
                                {benchCount > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <OutcomeChip outcome={{ kind: 'GAIN', text: 'Fused hero is fully healed' }} t={t} />
                                        <OutcomeChip outcome={{ kind: 'COST', text: 'Spends the rest — no other option after' }} t={t} />
                                    </div>
                                )}
                            </button>
                        )}
                        {event.options.map((opt, idx) => {
                            const revive = isRevive(opt);
                            const reason = blockedReason(opt);
                            const isSelected = selectedOption === idx;
                            const isDisabled = selectedOption !== null && !isSelected;
                            const isPicking = pickingRevive === idx;

                            return (
                                <div key={idx}>
                                    <button
                                        onClick={() => !reason && !isDisabled && handleSelect(idx, opt)}
                                        disabled={!!reason || isDisabled}
                                        data-tut={`event-option-${idx}`}
                                        className={`
                                            w-full text-left p-4 border-2 transition-all group relative
                                            ${isSelected || isPicking ? 'bg-green-900/40 border-green-500' : 'bg-[#23262f] border-gray-700 hover:border-white'}
                                            ${reason ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                                        `}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xl font-bold uppercase text-white">{t(opt.label)}</span>
                                            {isSelected && <ArrowRight className="text-green-400 animate-pulse shrink-0" size={24} />}
                                        </div>

                                        <div className="text-sm text-gray-400 group-hover:text-gray-200 mt-1">
                                            {t(opt.description)}
                                        </div>

                                        {/* THE POINT OF THIS SCREEN: what you get, what it costs and what it
                                            risks — stated outright instead of hidden in the flavour text. */}
                                        {reason ? (
                                            <div className="text-sm text-red-300 mt-2">{reason}</div>
                                        ) : (
                                            opt.outcomes && opt.outcomes.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {opt.outcomes.map((o, i) => (
                                                        <OutcomeChip key={i} outcome={o} t={t} />
                                                    ))}
                                                </div>
                                            )
                                        )}
                                    </button>

                                    {/* HERO PICKER — only for the revive option, once it is armed */}
                                    {revive && isPicking && (
                                        <div className="mt-2 border-2 border-green-700 bg-[#14161b] p-3 animate-in fade-in duration-200">
                                            <div className="text-sm uppercase tracking-wider text-green-300 mb-1">
                                                {t('Who comes back?')}
                                            </div>
                                            <div className="text-sm text-gray-400 mb-3">
                                                {t('Fusions already merged into a hero are never lost when they fall — they are only suspended. Reviving restores the hero')} <em>{t('and')}</em> {t('every Coin already spent on their fusions.')}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {fallenHeroes.map(heroId => {
                                                    const def = HERO_DEFINITIONS[heroId];
                                                    return (
                                                        <button
                                                            key={heroId}
                                                            data-tut={`event-hero-${heroId}`}
                                                            onClick={() => handleRevivePick(idx, opt, heroId)}
                                                            className="flex items-center gap-2 px-3 py-2 bg-[#23262f] border-2 border-gray-700 hover:border-green-400 transition-colors"
                                                        >
                                                            {def?.imgUrl && (
                                                                <img
                                                                    src={def.imgUrl}
                                                                    alt={t(def?.name || heroId)}
                                                                    className="w-8 h-8 object-contain grayscale"
                                                                />
                                                            )}
                                                            <span className="text-sm text-white uppercase">
                                                                {t(def?.name || heroId)}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* RESULT OVERLAY */}
                    {resultMsg && (
                        <div className="absolute inset-0 bg-black/85 flex items-center justify-center animate-in fade-in duration-300 z-20">
                            <div className="text-center px-8">
                                <h3 className="text-2xl text-white font-bold mb-2 uppercase">{resultMsg}</h3>
                                <p className="text-gray-400 text-sm animate-pulse">{t('Proceeding...')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
