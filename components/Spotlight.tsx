import React, { useLayoutEffect, useState } from 'react';
import { Leaf } from 'lucide-react';
import { useI18n } from '../i18n';

interface SpotlightProps {
    /** `data-tut` value of the element to cut a hole over. Omit for a note with no target. */
    focus?: string;
    note: string;
    /** Progress readout, e.g. 2/7. */
    index: number;
    total: number;
    /**
     * The board is mid-animation. The overlay disappears entirely for the duration — the
     * player is meant to WATCH the consequences of the click they just made, and a shade
     * over the payoff read as the game hiding its own feedback. Input stays safe without
     * it: tile clicks and End Turn are guarded against EXECUTING, and hotkeys are blocked
     * while a step is active.
     */
    busy?: boolean;
    /** Dismisses a note that has no target. Targeted steps clear themselves off the board. */
    onAdvance: () => void;
    onSkip: () => void;
}

interface Rect { top: number; left: number; width: number; height: number }

/**
 * HAND-HOLDING OVERLAY.
 *
 * The screen goes dark except for one cut-out, and only what is inside that cut-out can be
 * clicked. Everything else is genuinely unreachable, not merely dimmed — a new player cannot
 * wander off, and cannot be confused about what the game is asking for.
 *
 * The hole is built from FOUR dark rectangles fenced around the target rather than one
 * translucent sheet with a CSS mask. A masked sheet still swallows pointer events across its
 * whole area (the mask only affects painting), so the "hole" would look open and click like a
 * wall. Four rectangles leave the middle physically empty, so clicks land on the real button
 * underneath with no special handling at all.
 */
export const Spotlight: React.FC<SpotlightProps> = ({ focus, note, index, total, busy, onAdvance, onSkip }) => {
    const { t } = useI18n();
    const [rect, setRect] = useState<Rect | null>(null);

    /**
     * The target moves — the board resizes, a panel opens, a unit walks — so the hole is
     * re-measured continuously rather than once.
     *
     * On a timer, NOT requestAnimationFrame. rAF stops firing in a tab the browser is not
     * compositing, and a stalled measure leaves `rect` null, which renders the full-screen
     * shade with no opening at all: the player would be staring at a black screen that
     * refuses every click. A timer keeps running (throttled) in the background, so the worst
     * case is a hole that lags rather than a game that cannot be played.
     */
    useLayoutEffect(() => {
        if (!focus || busy) { setRect(null); return; }
        const measure = () => {
            const el = document.querySelector<HTMLElement>(`[data-tut="${focus}"]`);
            if (!el) { setRect(null); return; }
            const r = el.getBoundingClientRect();
            const pad = 6;
            const next = {
                top: r.top - pad, left: r.left - pad,
                width: r.width + pad * 2, height: r.height + pad * 2,
            };
            // Only re-render when it actually moved, or this repaints the whole app 10x a second.
            setRect(prev => (prev
                && Math.abs(prev.top - next.top) < 0.5
                && Math.abs(prev.left - next.left) < 0.5
                && Math.abs(prev.width - next.width) < 0.5
                && Math.abs(prev.height - next.height) < 0.5) ? prev : next);
        };
        measure();
        const id = window.setInterval(measure, 100);
        return () => window.clearInterval(id);
    }, [focus, busy]);

    // NOTHING here watches for clicks. A targeted step is retired by the caller the moment
    // the board shows the thing it asked for — the hero is selected, the skill is aimed, she
    // is standing on the tile. The click-watching version advanced on the click ITSELF, so a
    // click that did nothing (an illegal move, a misfire) still counted, and from then on
    // every lesson was one ahead of reality.

    // Mid-animation: nothing at all. The player watches the result of their click with a
    // clean screen; the overlay snaps back the instant the engine goes idle. (After the
    // hooks above, so the hook order never changes.)
    if (busy) return null;

    // /60: dark enough to read as "locked", light enough that the board stays visible —
    // at /80 the player was staring at a black screen with a hole in it. Whatever the
    // value, it must be a REAL Tailwind step: /78 silently produced rgba(0,0,0,0), an
    // overlay that blocked every click while looking like nothing was there at all.
    const shade = 'fixed bg-black/60 z-[90]';
    const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 0;

    // Park the note clear of the hole: below it normally, above it when the target is low.
    const noteTop = rect
        ? (rect.top > vh * 0.55 ? Math.max(12, rect.top - 96) : Math.min(vh - 110, rect.top + rect.height + 18))
        : vh * 0.5;

    return (
        <>
            {rect ? (
                <>
                    <div className={shade} style={{ top: 0, left: 0, width: '100vw', height: Math.max(0, rect.top) }} />
                    <div className={shade} style={{ top: rect.top + rect.height, left: 0, width: '100vw', height: Math.max(0, vh - rect.top - rect.height) }} />
                    <div className={shade} style={{ top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height }} />
                    <div className={shade} style={{ top: rect.top, left: rect.left + rect.width, width: Math.max(0, vw - rect.left - rect.width), height: rect.height }} />

                    {/* Ring around the opening. pointer-events-none so it never eats the click. */}
                    <div
                        className="fixed z-[92] pointer-events-none rounded-lg border-2 border-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.28),0_0_26px_rgba(16,185,129,0.65)] animate-pulse"
                        style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
                    />

                </>
            ) : focus ? (
                /* The step NAMES a target but it is not on screen: the script has fallen out
                   of sync with the game (e.g. a double-click deselected the hero, so the
                   skill button the next step points at never rendered). A blocking shade here
                   is a deadlock — the click that would bring the target back cannot land.
                   So this shade lets every click through; the moment the target exists, the
                   measurer finds it and the real hole (with blocking walls) snaps back.
                   Lighter than the blocking shade on purpose: this state means "waiting for
                   the target to come back" and must read as less locked, not more. */
                <div
                    className="fixed z-[90] pointer-events-none bg-black/40"
                    style={{ top: 0, left: 0, width: '100vw', height: '100vh' }}
                />
            ) : (
                /* Note with no target at all: intentional full-stop, dismissed via "Got it". */
                <div className={shade} style={{ top: 0, left: 0, width: '100vw', height: '100vh' }} />
            )}

            <div
                className="fixed z-[95] left-1/2 -translate-x-1/2 font-pixel"
                style={{ top: noteTop }}
            >
                <div className="flex items-center gap-3 px-5 py-3 bg-[#101a12]/97 border-2 border-emerald-500 rounded-lg shadow-[0_0_28px_rgba(16,185,129,0.35)] animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <Leaf size={20} className="text-emerald-400 shrink-0" />
                    <span className="text-emerald-50 text-base leading-tight max-w-[46ch]">{t(note)}</span>
                    <span className="text-[10px] font-mono text-emerald-600/80 shrink-0 tabular-nums">{index}/{total}</span>
                    {!focus && !busy && (
                        <button
                            onClick={onAdvance}
                            className="px-3 py-1 border border-emerald-500 text-emerald-200 hover:bg-emerald-900/60 text-xs uppercase font-bold rounded"
                        >
                            {t('Got it')}
                        </button>
                    )}
                </div>

                {/* Leaving the tutorial is its own labelled button, set apart from the note.
                    It used to be an X tucked into the corner of the card — which reads as
                    "close this tip" while actually ending the whole tutorial. A destructive
                    action must never wear the costume of a dismiss control. */}
                <div className="mt-2 flex justify-center">
                    <button
                        onClick={onSkip}
                        className="px-3 py-1.5 bg-[#14161b]/95 border border-gray-700 text-gray-500 hover:text-gray-200 hover:border-gray-500 text-[10px] uppercase tracking-widest rounded transition-colors"
                    >
                        {t('Skip the tutorial')}
                    </button>
                </div>
            </div>
        </>
    );
};
