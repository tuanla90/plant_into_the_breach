import React, { useState } from 'react';
import { BossId, ElementId, UnlockState } from '../types';
import { BOSSES, STAGES, actsOfStage } from '../data/unlocks';
import { BOSS_UNIT_CLASS } from '../data/bosses';
import { ZOMBIE_DEFINITIONS } from '../data/zombies';
import { HERO_DEFINITIONS } from '../data/heroes';
import { ELEMENT_DEFINITIONS } from '../utils/elements';
import { HERO_ACCENTS, facingFlip } from '../utils/icons';
import { ArrowLeft, Check, Crown, Lock, Skull, Snowflake, Flame, Zap, Swords, ChevronRight, Settings } from 'lucide-react';
import { useI18n } from '../i18n';

const ELEMENT_ICONS: Record<ElementId, React.ComponentType<{ size?: number }>> = {
    ICE: Snowflake,
    FIRE: Flame,
    LIGHTNING: Zap,
};

/**
 * THE ELEMENT, drawn as a prize rather than as a form field.
 *
 * Two acts of every stage pay a hero and show that hero's full sprite; the third pays an
 * element and used to show a small glyph in a grey ring. Side by side down one column that
 * read as "hero, hero, nothing much" — the act that hands the whole squad a permanent power
 * looked like the cheap one. It is a cut gem now, at the sprites' weight, and it carries the
 * element's own line of rules text: the thing being won is a RULE, and a flame icon cannot say
 * which rule. Same wording as the element badge on the hero cards, from ELEMENT_DEFINITIONS,
 * so the promise here and the effect there can never drift.
 */
const ElementCrest: React.FC<{ element: ElementId; accent: string; open: boolean }> = ({ element, accent, open }) => {
    const Icon = ELEMENT_ICONS[element];
    const dim = !open;
    return (
        <div className="relative w-[92px] h-[92px] shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
            {open && (
                <span className="absolute w-[70px] h-[70px] rounded-full blur-[16px] opacity-60"
                      style={{ background: accent }} />
            )}
            {/* Two rotated squares, one inside the other: a facet, and it reads as cut stone
                at 92px in a way a circle never does. */}
            <span className="absolute w-[62px] h-[62px] rotate-45 rounded-[10px] border-2"
                  style={{
                      borderColor: dim ? '#23272f' : accent,
                      background: dim
                          ? '#0d0f13'
                          : `linear-gradient(135deg, ${accent}55 0%, ${accent}14 55%, transparent 100%)`,
                      boxShadow: dim ? undefined : `0 0 18px ${accent}55, inset 0 0 14px ${accent}33`,
                  }} />
            <span className="absolute w-[44px] h-[44px] rotate-45 rounded-[6px] border"
                  style={{ borderColor: dim ? '#191d24' : `${accent}88` }} />
            <span className="relative" style={{ color: dim ? '#3f4653' : accent }}>
                <Icon size={30} />
            </span>
        </div>
    );
};

/**
 * The boss's own portrait, or nothing.
 *
 * All nine have their own sprite now, so this returns one every time — but the guard stays.
 * It exists because a boss with no art of its own borrows another unit's (that is what every
 * one of them did before their sprites landed), and the same picture on two of the nine cards
 * is worse than no picture: this screen exists to tell nine fights apart. The day a tenth boss
 * is added it will borrow too, and it should land on the skull plate rather than quietly
 * wearing the Gargantuar's face.
 */
const GARGANTUAR_ART = '/img/sprite-gargantuar.png';
const bossPortrait = (id: BossId): string | undefined => {
    const cls = BOSS_UNIT_CLASS[id];
    const art = cls ? (ZOMBIE_DEFINITIONS as any)[cls]?.imgUrl as string | undefined : undefined;
    if (!art) return undefined;
    if (art === GARGANTUAR_ART && id !== 'GARGANTUAR') return undefined;
    return art;
};

interface StageSelectScreenProps {
    unlocks: UnlockState | null;
    onBack: () => void;
    /** Start a run aimed at this act. */
    onSelectAct: (bossId: BossId) => void;
}

/**
 * THE CAMPAIGN, LAID OUT.
 *
 * PLAN-progression.md section 6 is a grid — three stages of three acts, each act a region
 * with one boss, each boss paying either a squadmate or an element — and until now that grid
 * existed only in the document. The player met it one node at a time with no way to see what
 * the shape was, which makes every unlock a surprise rather than a goal, the same problem the
 * locked hero cards were added to fix.
 *
 * Acts unlock in order, per stage: you may enter the first act of any stage you have reached,
 * and each act you clear opens the next. That is read from `unlocks.bossesBeaten` rather than
 * stored, so a save can never disagree with itself about where the player is.
 *
 * The Breach is shown as the capstone and stays locked until all nine are down — it is the
 * only cell whose requirement is the whole grid above it.
 */
export const StageSelectScreen: React.FC<StageSelectScreenProps> = ({ unlocks, onBack, onOpenSettings, onSelectAct }) => {
    const { t } = useI18n();
    const beaten = unlocks?.bossesBeaten ?? [];
    const done = (id: BossId) => beaten.includes(id);

    /**
     * ONE stage on screen at a time, picked from a rail down the left.
     *
     * Three acts is the whole page rather than a third of it, which is what buys the art its
     * size: nine cards competing for one screen is what forced them down to thumbnails in the
     * first place. The rail keeps the other two stages one click away and, more importantly,
     * keeps them VISIBLE — the campaign is still a shape the player can see, which was the
     * point of this screen, it is just no longer all rendered at once.
     *
     * Opens on the stage the player is actually on — the first with an act still standing —
     * rather than always stage 1, so a returning save lands where it left off. Read once into
     * state: after that the tab is the player's, and clearing an act does not yank the page
     * out from under the hand that just clicked it.
     */
    const [tab, setTab] = useState<number>(() => {
        const beatenNow = unlocks?.bossesBeaten ?? [];
        const next = STAGES.find(st => !actsOfStage(st.id).every(b => beatenNow.includes(b.id)));
        return next?.id ?? 0;   // everything down: open on The Breach, which is what is left
    });

    /**
     * An act is enterable when every act BEFORE it in its own stage is down. Stage 1 of every
     * stage is open from the start on purpose: locking stage 2 behind stage 1 would make a
     * lost run cost the player access to content they had already reached, and the run is the
     * difficulty curve here, not the menu.
     */
    const openAt = (stage: 1 | 2 | 3, act: 1 | 2 | 3) =>
        actsOfStage(stage).filter(b => b.act < act).every(b => done(b.id));

    const breach = BOSSES.find(b => b.stage === 0);
    const allDown = BOSSES.filter(b => b.stage !== 0).every(b => done(b.id));
    const clearedCount = BOSSES.filter(b => b.stage !== 0 && done(b.id)).length;

    return (
        <div className="w-full h-screen bg-[#0d0e11] flex flex-col font-pixel text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,#1a2130_0%,#0d0e11_55%,#000_100%)] z-0" />
            <div className="absolute top-0 w-full h-1 bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)] z-10" />

            <div className="z-10 w-full h-full flex flex-col px-6 pt-5 pb-5 gap-3 max-w-[1500px] mx-auto">

                {/* HEADER */}
                <div className="flex flex-wrap justify-between items-end gap-3 border-b border-gray-800 pb-3 shrink-0">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-widest">{t('Choose Your Campaign')}</h1>
                        <p className="text-gray-500 text-xs uppercase tracking-widest">
                            {t('Bosses down: {n}/{total}', { n: clearedCount, total: BOSSES.length - 1 })}
                            <span className="ml-3 text-gray-600 normal-case tracking-normal">
                                {t('Two acts free a squadmate. The third takes an element off the thing that closes the stage.')}
                            </span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button data-sfx="back"
                            onClick={onBack}
                            className="h-10 px-4 flex items-center gap-2 border border-[#2b303b] rounded text-[11px] uppercase tracking-widest text-gray-400 hover:text-white hover:border-gray-500"
                        >
                            <ArrowLeft size={14} /> {t('Back')}
                        </button>

                        {onOpenSettings && (
                            <button
                                onClick={onOpenSettings}
                                className="h-10 px-3 flex items-center justify-center border border-[#2b303b] rounded text-gray-400 hover:text-sky-400 hover:border-sky-500 transition-colors"
                                title={t('Cài Đặt')}
                            >
                                <Settings size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* RAIL on the left, one stage's three acts on the right. */}
                <div className="flex-1 min-h-0 flex gap-4">

                    {/* THE RAIL. Vertical because the tabs carry a name, a subtitle and a score
                        each — that is a row of text, and rows of text stack downwards. Across the
                        top they would have had to shed the subtitle, which is the only thing on
                        the tab that says what the stage is ABOUT. */}
                    <nav className="w-[188px] shrink-0 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1">
                        {STAGES.map(stage => {
                            const acts = actsOfStage(stage.id);
                            const cleared = acts.filter(b => done(b.id)).length;
                            const active = tab === stage.id;
                            return (
                                <button
                                    key={stage.id}
                                    onClick={() => setTab(stage.id)}
                                    /* flex-1 so the four tabs SHARE the column instead of
                                       stacking at the top with the Breach pinned to the floor
                                       and a hand-width of nothing between them. Four equal
                                       destinations is also the truth of the screen — the Breach
                                       is not a footnote under the stages, it is the fourth
                                       place you can go. */
                                    className={`relative text-left rounded border-l-4 border-y border-r px-3 py-2.5 flex flex-col justify-center gap-1
                                                flex-1 min-h-[92px]
                                                transition-all ${active ? '' : 'hover:brightness-150 opacity-70 hover:opacity-100'}`}
                                    style={{
                                        borderLeftColor: stage.accent,
                                        borderTopColor: active ? `${stage.accent}77` : '#1e2128',
                                        borderRightColor: active ? `${stage.accent}77` : '#1e2128',
                                        borderBottomColor: active ? `${stage.accent}77` : '#1e2128',
                                        backgroundColor: active ? `${stage.accent}1f` : '#0f1116',
                                    }}
                                >
                                    <span className="flex items-baseline gap-1.5">
                                        <span className="text-[9px] font-mono" style={{ color: stage.accent }}>
                                            {t('Stage {n}', { n: stage.id })}
                                        </span>
                                        <span className="ml-auto text-[9px] font-mono" style={{ color: cleared === acts.length ? '#34d399' : '#6b7280' }}>
                                            {cleared}/{acts.length}
                                        </span>
                                    </span>
                                    <span className="text-[12px] font-black uppercase tracking-widest leading-tight"
                                          style={{ color: active ? stage.accent : '#9ca3af' }}>
                                        {t(stage.name)}
                                    </span>
                                    <span className="text-[9px] text-gray-500 normal-case tracking-normal leading-snug line-clamp-2">
                                        {t(stage.subtitle)}
                                    </span>
                                    {/* Three pips per tab. An unselected stage still has to answer "how
                                        far did I get there", or moving the other two off-screen would
                                        cost the player the one fact they were carrying. */}
                                    <span className="flex items-center gap-1 pt-0.5">
                                        {acts.map(b => (
                                            <span key={b.id}
                                                className="w-2 h-2 rounded-full border"
                                                title={t(b.city)}
                                                style={{
                                                    borderColor: done(b.id) ? '#34d399' : `${stage.accent}66`,
                                                    background: done(b.id) ? '#34d399' : 'transparent',
                                                }} />
                                        ))}
                                    </span>
                                    {active && (
                                        <ChevronRight size={16} className="absolute -right-[9px] top-1/2 -translate-y-1/2"
                                                      style={{ color: stage.accent }} />
                                    )}
                                </button>
                            );
                        })}

                        {/* THE BREACH is the fourth TAB, not a launch button.
                            It used to start the run on the first click, which made it the only
                            destination on this screen you entered without being told what it
                            was — every act card states its boss, its reward and its terms first.
                            A locked cell that says nothing is a worse offence again: the player
                            could see it was shut and not what would open it. Selecting it now
                            opens the same kind of briefing the acts get, and the run starts from
                            a button inside that briefing. */}
                        {breach && (
                            <button
                                onClick={() => setTab(0)}
                                className={`relative text-left rounded border-l-4 border-y border-r px-3 py-2.5 flex flex-col justify-center gap-1
                                    flex-1 min-h-[92px] transition-all
                                    ${tab === 0
                                        ? 'border-l-red-500 border-red-800 bg-[#1f1116] shadow-[0_0_18px_rgba(220,38,38,0.22)]'
                                        : allDown
                                            ? 'border-l-red-500 border-red-900 bg-[#1a1014] opacity-70 hover:opacity-100 hover:border-red-400'
                                            : 'border-l-[#4b5563] border-[#1e2128] bg-[#0b0c0f] opacity-70 hover:opacity-100'}`}
                            >
                                <span className="flex items-center gap-1.5">
                                    <Crown size={13} className={allDown || tab === 0 ? 'text-red-400' : 'text-gray-500'} />
                                    <span className={`text-[12px] font-black uppercase tracking-widest ${allDown || tab === 0 ? 'text-red-300' : 'text-gray-500'}`}>
                                        {t(breach.city)}
                                    </span>
                                    <span className="ml-auto text-[9px] font-mono"
                                          style={{ color: allDown ? '#34d399' : '#6b7280' }}>
                                        {clearedCount}/{BOSSES.length - 1}
                                    </span>
                                </span>
                                <span className="text-[9px] normal-case tracking-normal leading-snug flex items-center gap-1"
                                      style={{ color: allDown ? '#fca5a5' : '#6b7280' }}>
                                    {allDown ? <Swords size={11} /> : <Lock size={11} />}
                                    {/* NOT t('Open') — that key is already the board's word for an
                                        empty tile ("Trống"), and reusing it here told the player the
                                        final fight was vacant. */}
                                    {allDown ? t('The way is open') : t('Beat all nine bosses')}
                                </span>
                                {tab === 0 && (
                                    <ChevronRight size={16} className="absolute -right-[9px] top-1/2 -translate-y-1/2 text-red-500" />
                                )}
                            </button>
                        )}
                    </nav>

                    {/* THE PANEL: three acts, and nothing else on the page. */}
                    <div className="flex-1 min-w-0 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-3">

                        {/* THE BREACH BRIEFING. Same three questions every act card answers —
                            what is in there, what it costs to get in, what you get — except
                            the entry price here is the whole grid above, so the nine are
                            listed by name and ticked off one at a time. A player who cannot
                            get in should still leave this tab knowing exactly which two
                            bosses are standing between them and it. */}
                        {tab === 0 && breach && (
                            <section className="flex-1 min-h-0 flex flex-col gap-3">
                                <div className="relative rounded-lg border-2 border-red-900/70 bg-[#150d11] overflow-hidden shrink-0">
                                    <div className="absolute inset-0 pointer-events-none"
                                         style={{ background: 'radial-gradient(120% 100% at 100% 40%, rgba(220,38,38,0.22) 0%, transparent 62%)' }} />
                                    <div className="relative z-10 flex items-stretch gap-4 p-4">
                                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                                            <span className="flex items-center gap-2">
                                                <Crown size={16} className="text-red-400" />
                                                <span className="text-xl font-black uppercase tracking-widest text-red-200">
                                                    {t(breach.city)}
                                                </span>
                                                <span className="text-[11px] font-bold uppercase tracking-widest text-red-400/80">
                                                    {t(breach.name)}
                                                </span>
                                            </span>
                                            <p className="text-[12px] leading-relaxed text-gray-300 normal-case tracking-normal max-w-[62ch]">
                                                {t(breach.hint)}
                                            </p>
                                            <span className="flex items-center gap-2 pt-1">
                                                <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                                    {t('Way in')}
                                                </span>
                                                <span className="flex-1 h-1.5 rounded-full bg-[#241419] overflow-hidden max-w-[240px]">
                                                    <span className="block h-full rounded-full transition-all"
                                                          style={{
                                                              width: `${(clearedCount / (BOSSES.length - 1)) * 100}%`,
                                                              background: allDown ? '#34d399' : '#ef4444',
                                                          }} />
                                                </span>
                                                <span className="text-[11px] font-mono"
                                                      style={{ color: allDown ? '#34d399' : '#f87171' }}>
                                                    {clearedCount}/{BOSSES.length - 1}
                                                </span>
                                            </span>
                                        </div>
                                        {bossPortrait(breach.id) && (
                                            <img src={bossPortrait(breach.id)} alt=""
                                                 className="h-[132px] w-auto object-contain shrink-0"
                                                 style={{
                                                     filter: allDown
                                                         ? 'drop-shadow(0 3px 8px rgba(0,0,0,0.85)) drop-shadow(0 0 12px rgba(248,113,113,0.5))'
                                                         : 'brightness(0.28) grayscale(0.85)',
                                                 }} />
                                        )}
                                    </div>
                                </div>

                                {/* THE NINE, by stage. A tick is a boss already down; the rest is
                                    the to-do list this tab exists to hand over. */}
                                <div className="flex-1 min-h-0 grid grid-cols-3 gap-3">
                                    {STAGES.map(stage => (
                                        <div key={stage.id}
                                             className="rounded-lg border bg-[#0f1116] p-2.5 flex flex-col gap-2"
                                             style={{ borderColor: `${stage.accent}44` }}>
                                            <span className="text-[10px] font-black uppercase tracking-widest"
                                                  style={{ color: stage.accent }}>
                                                {t(stage.name)}
                                            </span>
                                            {actsOfStage(stage.id).map(b => {
                                                const art = bossPortrait(b.id);
                                                const downed = done(b.id);
                                                return (
                                                    <button key={b.id}
                                                            onClick={() => setTab(stage.id)}
                                                            className="group/row flex-1 min-h-0 text-left flex items-center gap-2 rounded border px-2 py-1.5 transition-colors hover:border-gray-500"
                                                            style={{
                                                                borderColor: downed ? '#065f46' : '#20242c',
                                                                background: downed ? '#0d1a14' : '#0b0c0f',
                                                            }}>
                                                        {/* THE NINE FACES. A list of names is a list of names; this
                                                            screen is asking the player to recognise nine fights they
                                                            have had, and the art is what they actually remember.

                                                            Colour runs the OPPOSITE way to the act cards, on purpose.
                                                            There, bright means "you may go here". Here the question is
                                                            "who is still in my way", so a boss left standing keeps its
                                                            colours and a boss already down is greyed behind its tick —
                                                            what is lit is what is left. */}
                                                        {art ? (
                                                            <img src={art} alt=""
                                                                 className="h-[44px] w-[44px] object-contain shrink-0 transition-transform group-hover/row:scale-110"
                                                                 style={{
                                                                     filter: downed
                                                                         ? 'grayscale(1) brightness(0.45)'
                                                                         : 'drop-shadow(0 2px 4px rgba(0,0,0,0.8)) drop-shadow(0 0 6px rgba(248,113,113,0.35))',
                                                                 }} />
                                                        ) : (
                                                            <span className="h-[44px] w-[44px] shrink-0 flex items-center justify-center">
                                                                <Skull size={20} className="text-gray-700" />
                                                            </span>
                                                        )}
                                                        <span className="min-w-0 flex-1 flex flex-col">
                                                            <span className="text-[10px] font-bold uppercase tracking-wide truncate"
                                                                  style={{ color: downed ? '#6ee7b7' : '#e5e7eb' }}>
                                                                {t(b.name)}
                                                            </span>
                                                            <span className="text-[9px] text-gray-600 normal-case tracking-normal truncate">
                                                                {t(b.city)}
                                                            </span>
                                                        </span>
                                                        {downed
                                                            ? <Check size={13} className="text-emerald-400 shrink-0" />
                                                            : <Skull size={13} className="text-red-400/70 shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>

                                <button data-sfx={allDown ? 'confirm' : undefined}
                                        onClick={() => allDown && onSelectAct(breach.id)}
                                        disabled={!allDown}
                                        className={`shrink-0 h-12 rounded-lg border-2 flex items-center justify-center gap-2 text-[13px] font-black uppercase tracking-widest transition-all
                                            ${allDown
                                                ? 'border-red-500 bg-[#2a0f14] text-red-200 hover:bg-[#3a141b] shadow-[0_0_24px_rgba(220,38,38,0.28)]'
                                                : 'border-[#23272f] bg-[#0b0c0f] text-gray-600 cursor-not-allowed'}`}>
                                    {allDown ? <Swords size={16} /> : <Lock size={14} />}
                                    {allDown
                                        ? t('Enter The Breach')
                                        : t('{n} bosses still standing', { n: (BOSSES.length - 1) - clearedCount })}
                                </button>
                            </section>
                        )}

                        {STAGES.filter(stage => stage.id === tab).map(stage => {
                            const acts = actsOfStage(stage.id);
                            const cleared = acts.filter(b => done(b.id)).length;
                            return (
                                <section key={stage.id} className="flex-1 min-h-0 flex flex-col gap-3">
                                    <div
                                        className="flex items-baseline gap-2 px-3 py-2 rounded border shrink-0"
                                        style={{ borderColor: `${stage.accent}55`, backgroundColor: `${stage.accent}10` }}
                                    >
                                        <span className="text-[10px] font-mono" style={{ color: stage.accent }}>
                                            {t('Stage {n}', { n: stage.id })}
                                        </span>
                                        <span className="text-base font-black uppercase tracking-widest" style={{ color: stage.accent }}>
                                            {t(stage.name)}
                                        </span>
                                        <span className="text-[11px] text-gray-500 normal-case tracking-normal truncate">
                                            {t(stage.subtitle)}
                                        </span>
                                        <span className="ml-auto text-[10px] font-mono text-gray-600 shrink-0">{cleared}/{acts.length}</span>
                                    </div>

                                    {acts.map(boss => {
                                        const cleared = done(boss.id);
                                        const open = openAt(stage.id, boss.act);
                                        const hero = boss.hero ? HERO_DEFINITIONS[boss.hero] : undefined;
                                        const element = boss.element ? ELEMENT_DEFINITIONS[boss.element] : undefined;
                                        const rewardAccent = hero
                                            ? (HERO_ACCENTS[boss.hero!] ?? '#facc15')
                                            : (element?.accent ?? '#a3a3a3');
                                        const portrait = hero?.boardImgUrl ?? hero?.imgUrl;
                                        const bossArt = bossPortrait(boss.id);
                                        const bossFlip = facingFlip(BOSS_UNIT_CLASS[boss.id]);

                                        return (
                                            <button
                                                key={boss.id}
                                                onClick={() => open && onSelectAct(boss.id)}
                                                disabled={!open}
                                                /* flex-1 with a floor and a ceiling: three cards SHARE the
                                                   panel, so on a tall screen they grow into it instead of
                                                   leaving a hole, and on a short one they stop at 168 and the
                                                   panel scrolls rather than crushing the art. The ceiling is
                                                   there because past ~300px the pixel sprites are being blown
                                                   up rather than shown. */
                                                className={`group relative text-left rounded-lg border-2 overflow-hidden transition-all
                                                    flex items-stretch gap-3 pl-2 pr-2 py-2 flex-1 min-h-[168px] max-h-[300px]
                                                    ${!open
                                                        ? 'bg-[#0b0c0f] border-[#1e2128] cursor-not-allowed'
                                                        : cleared
                                                            ? 'bg-[#101a12] border-emerald-900 hover:border-emerald-500'
                                                            : 'bg-[#12141a] border-[#252a35] hover:border-gray-400'}`}
                                            >
                                                {/* A wash in the REWARD's colour, not the stage's: the row you are
                                                    scanning for is the one that hands over the thing you want, and
                                                    colour finds it faster than reading nine paragraphs does. */}
                                                {open && (
                                                    <div
                                                        className="absolute inset-0 pointer-events-none transition-opacity opacity-70 group-hover:opacity-100"
                                                        style={{ background: `radial-gradient(120% 90% at 100% 50%, ${rewardAccent}22 0%, transparent 60%)` }}
                                                    />
                                                )}

                                                {/* Act number as a spine down the left edge — it turns three
                                                    stacked cards into a numbered route at a glance. */}
                                                <div className="relative z-10 flex flex-col items-center justify-center shrink-0 w-5">
                                                    <span className="text-[8px] font-mono text-gray-600 leading-none">{t('Act')}</span>
                                                    <span className="text-lg font-black leading-none"
                                                          style={{ color: open ? stage.accent : '#3f4653' }}>
                                                        {boss.act}
                                                    </span>
                                                </div>

                                                {/* THE REWARD, on the LEFT, and the boss on the RIGHT — the same
                                                    way round as every board in the game, where plants hold the left
                                                    and zombies march in from the right. The card had them the other
                                                    way and it read backwards to anyone who had played a single
                                                    fight; flipped, it is a board in miniature and the mirrored boss
                                                    is facing the hero rather than away from him.

                                                    THE REWARD. Heroes have portraits; a stage-closing act pays an
                                                    element instead, so it gets the element's glyph in its colour. */}
                                                <div className="relative z-10 w-[150px] shrink-0 flex flex-col items-center justify-center gap-0.5 min-h-0">
                                                    {portrait ? (
                                                        <img
                                                            src={portrait}
                                                            alt=""
                                                            className="min-h-0 max-h-full w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                                                            style={{
                                                                filter: open
                                                                    ? `drop-shadow(0 3px 6px rgba(0,0,0,0.8)) drop-shadow(0 0 10px ${rewardAccent}66)`
                                                                    : 'brightness(0.2) grayscale(1)',
                                                            }}
                                                        />
                                                    ) : boss.element ? (
                                                        <ElementCrest element={boss.element} accent={rewardAccent} open={open} />
                                                    ) : (
                                                        <div
                                                            className="w-16 h-16 rounded-full flex items-center justify-center border-2"
                                                            style={{
                                                                color: open ? rewardAccent : '#3f4653',
                                                                borderColor: open ? `${rewardAccent}66` : '#23272f',
                                                                background: open ? `radial-gradient(circle, ${rewardAccent}22 0%, transparent 70%)` : undefined,
                                                            }}
                                                        >
                                                            <Crown size={28} />
                                                        </div>
                                                    )}
                                                    {/* "Fire" alone reads as a label on the picture. What is being
                                                        handed over is the ELEMENT — the same word the squad screen
                                                        uses for the thing you fit to a hero — so the reward says so. */}
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-center leading-tight truncate max-w-full"
                                                          style={{ color: open ? rewardAccent : '#4b5563' }}>
                                                        {hero
                                                            ? t(hero.name)
                                                            : element
                                                                ? t('{element} Element', { element: t(element.name) })
                                                                : '—'}
                                                    </span>
                                                    {/* What the element DOES, not just its name. A hero's sprite
                                                        argues for itself; a word like "Fire" does not. */}
                                                    {element && (
                                                        <span className="text-[8px] leading-tight text-center normal-case tracking-normal line-clamp-3 px-0.5"
                                                              style={{ color: open ? '#9ca3af' : '#3f4653' }}>
                                                            {t(element.description)}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* THE PAYOFF, stated as an arrow rather than a sentence: beat the
                                                    thing on the left, take the thing on the right. Cleared acts swap
                                                    the arrow for a tick, so "already mine" and "still to win" are the
                                                    same shape read at the same spot. */}
                                                <div className="relative z-10 shrink-0 flex flex-col items-center justify-center gap-0.5 px-0.5">
                                                    <span className="text-[7px] font-black uppercase tracking-widest leading-none"
                                                          style={{ color: cleared ? '#34d399' : open ? rewardAccent : '#3f4653' }}>
                                                        {cleared ? t('Owned') : t('Unlocks')}
                                                    </span>
                                                    {cleared
                                                        ? <Check size={16} className="text-emerald-400" />
                                                        : <ArrowLeft size={16} style={{ color: open ? rewardAccent : '#3f4653' }} />}
                                                </div>

                                                <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                                    <span className="text-[15px] font-black uppercase tracking-wider truncate"
                                                          style={{ color: open ? '#e5e7eb' : '#4b5563' }}>
                                                        {t(boss.city)}
                                                    </span>
                                                    <span className={`text-[12px] font-bold uppercase tracking-wide truncate ${open ? 'text-red-300' : 'text-gray-600'}`}>
                                                        {t(boss.name)}
                                                    </span>
                                                    <p className="text-[11px] leading-snug text-gray-400 normal-case tracking-normal line-clamp-4">
                                                        {t(boss.hint)}
                                                    </p>
                                                </div>

                                                {/* THE THREAT. Red plate, so the two portraits can never be
                                                    confused for each other at a glance. */}
                                                {/* Bigger than the reward on the other side, deliberately: the card
                                                    is asking "do you want to fight this", and the thing being fought
                                                    should be the loudest object on it. */}
                                                <div className="relative z-10 w-[208px] shrink-0 flex items-center justify-center min-h-0">
                                                    {bossArt ? (
                                                        <img
                                                            src={bossArt}
                                                            alt=""
                                                            className="min-h-0 max-h-full w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                                                            style={{
                                                                // Same mirror the board applies (utils/icons facingFlip):
                                                                // the Gargantuar is drawn facing right, and on this card
                                                                // that meant turning his back on the hero he is fighting.
                                                                transform: bossFlip.trim() || undefined,
                                                                filter: open
                                                                    ? 'drop-shadow(0 3px 6px rgba(0,0,0,0.8)) drop-shadow(0 0 8px rgba(248,113,113,0.45))'
                                                                    : 'brightness(0.2) grayscale(1)',
                                                            }}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="w-16 h-16 rounded-full flex items-center justify-center border-2"
                                                            style={{
                                                                color: open ? '#fca5a5' : '#3f4653',
                                                                borderColor: open ? '#7f1d1d' : '#23272f',
                                                                background: open ? 'radial-gradient(circle, rgba(248,113,113,0.16) 0%, transparent 70%)' : undefined,
                                                            }}
                                                        >
                                                            <Skull size={28} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* State, top-right, out of the text's way. */}
                                                <span className="absolute top-1.5 right-1.5 z-20">
                                                    {!open && <Lock size={12} className="text-gray-600" />}
                                                    {open && !cleared && <Swords size={12} className="text-gray-700 group-hover:text-white transition-colors" />}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </section>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #0f1012; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
            `}</style>
        </div>
    );
};
