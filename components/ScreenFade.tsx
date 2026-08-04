import React from 'react';

/**
 * A short wipe through black whenever the game changes screen.
 *
 * App renders screens as plain conditionals, so menu -> map -> combat were hard cuts: one
 * frame the board is absent, the next it is fully there. The eye reads that as a glitch
 * rather than a transition, and it was the most "unfinished" thing about moving around the
 * game.
 *
 * Done as one overlay rather than by fading each screen in, because screens mount at
 * different speeds (combat builds a board, the menu does not) and a per-screen fade-in would
 * show a half-built screen fading up. Covering the swap sidesteps that.
 *
 * IMPLEMENTATION NOTE — this deliberately has no state, no refs and no effect. The first
 * version drove the fade from `useEffect` + a two-deep `requestAnimationFrame` chain, with
 * a ref guarding against re-entry. That is a lot of moving parts for a fade, and every one
 * of them is a way for the overlay to get stuck opaque and cover the entire game: a
 * cancelled frame, a ref advanced before the work it guards, StrictMode's double invoke.
 *
 * Keying the element on `screen` remounts it, and remounting restarts a CSS animation. No
 * frame callbacks, no cleanup, nothing to double-invoke.
 *
 * The inline `opacity: 0` is a safety catch for the case where the animation is absent
 * entirely, so the element rests transparent instead of at its opaque `from` keyframe.
 *
 * It does NOT cover a *frozen* animation: one that is attached and "running" but not
 * advancing still outranks the inline style and paints solid black. That happens in a
 * backgrounded tab, which is measurable and looks alarming — but it is also a tab nobody is
 * looking at, and the animation finishes the moment compositing resumes. The reduced-motion
 * rule below removes the only case where a visible user could sit under it.
 */
export const ScreenFade: React.FC<{ screen: string; durationMs?: number }> = ({
    screen,
    durationMs = 220,
}) => (
    <>
        <div
            key={screen}
            aria-hidden="true"
            className="fixed inset-0 z-[95] bg-[#0b0d12] pointer-events-none"
            style={{ opacity: 0, animation: `screenFade ${durationMs}ms ease-out forwards` }}
        />
        {/* Outside the keyed element so the rule is not torn down and re-parsed every swap. */}
        <style>{`
            @keyframes screenFade { from { opacity: 1; } to { opacity: 0; } }
            /* No wipe for anyone who asked for less motion — and with the animation gone,
               the inline opacity: 0 takes over, so they get a plain cut rather than a
               black screen. */
            @media (prefers-reduced-motion: reduce) {
                @keyframes screenFade { from { opacity: 0; } to { opacity: 0; } }
            }
        `}</style>
    </>
);
