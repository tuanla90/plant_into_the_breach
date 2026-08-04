import React from 'react';
import { VisualEffect } from '../types';

/**
 * Combat feedback drawn over the board — hit bursts, swing arcs, muzzle flashes, the dirt a
 * zombie kicks up climbing out, and the streaks behind something being shoved.
 *
 * Everything here is CSS and inline SVG rather than image files. Three reasons: it recolours
 * with the palette instead of being baked in, it scales to any tile size without a second
 * asset, and the engine can hand each effect its own duration (fast-forward shortens them),
 * which a sprite sheet cannot do.
 *
 * STRUCTURAL RULE, and the reason for all the wrapper divs: a CSS animation that touches
 * `transform` REPLACES the element's static transform for the whole animation. So anything
 * placed with a transform (rotation, centring) gets an outer div holding the static
 * transform, and an inner div that animates. Collapsing those two would silently drop the
 * placement — every ray would fire at 0 degrees from the same point.
 *
 * The layer is `pointer-events-none` throughout: an effect that ate a click would make the
 * board feel broken during exactly the busiest moments.
 */

const COLORS = {
    // Warm neutral for ordinary hits, so it belongs to neither side's team colour.
    impact: '#fde68a',
    explosion: '#fb923c',
    slash: '#f8fafc',
    muzzle: '#fcd34d',
    push: '#7dd3fc',
    emerge: '#84cc16',
    drown: '#7dd3fc',
};

/** A line fired outward from the tile centre. Outer div aims it, inner div animates. */
const Ray: React.FC<{
    deg: number; length: string; thickness: number; color: string;
    animation: string; origin?: string;
}> = ({ deg, length, thickness, color, animation, origin = 'left center' }) => (
    <div className="absolute left-1/2 top-1/2"
         style={{ width: length, height: thickness, transformOrigin: origin, transform: `rotate(${deg}deg)` }}>
        <div style={{ width: '100%', height: '100%', borderRadius: thickness, background: color,
                      transformOrigin: origin, animation }} />
    </div>
);

const Impact: React.FC<{ ms: number }> = ({ ms }) => (
    <>
        <div className="absolute inset-[18%] rounded-full"
             style={{ border: `2px solid ${COLORS.impact}`, animation: `fxRing ${ms}ms ease-out forwards` }} />
        <div className="absolute inset-[34%] rounded-full"
             style={{ background: COLORS.impact, animation: `fxFlash ${ms * 0.6}ms ease-out forwards` }} />
        {/* Four sparks on the diagonals: enough to read as a burst, few enough to stay cheap. */}
        {[45, 135, 225, 315].map(deg => (
            <Ray key={deg} deg={deg} length="30%" thickness={2} color={COLORS.impact}
                 animation={`fxRay ${ms}ms ease-out forwards`} />
        ))}
    </>
);

const Explosion: React.FC<{ ms: number }> = ({ ms }) => (
    <>
        {/* The shockwave reaches past the tile — a heavy hit should feel like it spills over. */}
        <div className="absolute inset-[10%] rounded-full"
             style={{ border: `3px solid ${COLORS.explosion}`,
                      animation: `fxShock ${ms}ms cubic-bezier(0.2,0.8,0.3,1) forwards` }} />
        <div className="absolute inset-[25%] rounded-full blur-[3px]"
             style={{ background: `radial-gradient(circle, #fff 0%, ${COLORS.explosion} 45%, transparent 72%)`,
                      animation: `fxBoom ${ms}ms ease-out forwards` }} />
        {[0, 60, 120, 180, 240, 300].map(deg => (
            <Ray key={deg} deg={deg} length="42%" thickness={3} color={COLORS.explosion}
                 animation={`fxRay ${ms}ms ease-out forwards`} />
        ))}
    </>
);

const Slash: React.FC<{ ms: number; rotation: number }> = ({ ms, rotation }) => (
    <div className="absolute inset-0" style={{ transform: `rotate(${rotation}deg)` }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible">
            {/* An arc, not a straight line: a swing or a bite reads as a curve.
                pathLength=1 makes the dash maths independent of the curve's real length. */}
            <path d="M 18 82 Q 50 10 88 44" fill="none" stroke={COLORS.slash} strokeWidth="7"
                  strokeLinecap="round" pathLength={1}
                  style={{ animation: `fxSlash ${ms}ms cubic-bezier(0.3,0,0.2,1) forwards` }} />
        </svg>
    </div>
);

const Muzzle: React.FC<{ ms: number; rotation: number }> = ({ ms, rotation }) => (
    <div className="absolute inset-0" style={{ transform: `rotate(${rotation}deg)` }}>
        {/* Cone pointing along the shot, anchored at the shooter's centre. */}
        <div className="absolute left-1/2 top-1/2"
             style={{ width: '34%', height: '26%', transformOrigin: 'left center', transform: 'translateY(-50%)' }}>
            <div style={{
                width: '100%', height: '100%', transformOrigin: 'left center',
                background: `linear-gradient(90deg, ${COLORS.muzzle} 0%, transparent 100%)`,
                clipPath: 'polygon(0 50%, 100% 0, 100% 100%)',
                animation: `fxFlash ${ms}ms ease-out forwards`,
            }} />
        </div>
    </div>
);

const Push: React.FC<{ ms: number; rotation: number }> = ({ ms, rotation }) => (
    // Streaks trail BEHIND the direction of travel (hence the extra 180), which is what makes
    // it read as "shoved that way" rather than "something happened here".
    <div className="absolute inset-0" style={{ transform: `rotate(${rotation + 180}deg)` }}>
        {[-30, 0, 30].map((spread, i) => (
            <Ray key={spread} deg={spread} length="46%" thickness={3}
                 color={`linear-gradient(90deg, transparent, ${COLORS.push})`}
                 animation={`fxStreak ${ms}ms ease-out ${i * 40}ms forwards`} />
        ))}
    </div>
);

const Emerge: React.FC<{ ms: number }> = ({ ms }) => (
    <>
        {/* Ground splits open, then dirt is thrown up and outward. */}
        <div className="absolute left-1/2 bottom-[18%] rounded-[100%]"
             style={{ width: '62%', height: '18%', marginLeft: '-31%', background: '#000',
                      animation: `fxHole ${ms}ms ease-out forwards` }} />
        <div className="absolute inset-[12%] rounded-full"
             style={{ border: `2px solid ${COLORS.emerge}`, animation: `fxShock ${ms}ms ease-out forwards` }} />
        {[-60, -25, 25, 60].map((deg, i) => (
            <div key={deg} className="absolute left-1/2 bottom-[20%]"
                 style={{ width: 3, height: '32%', transformOrigin: 'bottom center', transform: `rotate(${deg}deg)` }}>
                <div style={{ width: '100%', height: '100%', borderRadius: 2, background: '#6b4423',
                              transformOrigin: 'bottom center',
                              animation: `fxDirt ${ms}ms cubic-bezier(0.2,0.7,0.4,1) ${i * 30}ms forwards` }} />
            </div>
        ))}
    </>
);

const Drown: React.FC<{ ms: number }> = ({ ms }) => (
    <>
        {/* Three rings spreading outward at staggered delays — the read is "something went
            under here", so the motion has to keep going after the sprite is already gone. */}
        {[0, 1, 2].map(i => (
            <div key={i} className="absolute inset-[26%] rounded-[100%]"
                 style={{
                     border: `2px solid ${COLORS.drown}`,
                     animation: `fxRipple ${ms}ms ease-out ${i * (ms * 0.18)}ms forwards`,
                 }} />
        ))}
        {/* Splash droplets thrown up out of the water. */}
        {[-55, -20, 20, 55].map((deg, i) => (
            <div key={deg} className="absolute left-1/2 top-1/2"
                 style={{ width: 4, height: '30%', transformOrigin: 'bottom center', transform: `rotate(${deg}deg)` }}>
                <div style={{ width: '100%', height: '100%', borderRadius: 4, background: COLORS.drown,
                              transformOrigin: 'bottom center',
                              animation: `fxSplash ${ms * 0.7}ms cubic-bezier(0.2,0.8,0.4,1) ${i * 25}ms forwards` }} />
            </div>
        ))}
        {/* The sprite sinking: a dark disc closing over where it stood. */}
        <div className="absolute inset-[34%] rounded-full"
             style={{ background: 'radial-gradient(circle, #0c4a6e 0%, #082f49 70%, transparent 100%)',
                      animation: `fxSink ${ms}ms ease-in forwards` }} />
    </>
);

export const EffectsLayer: React.FC<{ effects: VisualEffect[] }> = ({ effects }) => (
    <div className="absolute inset-0 pointer-events-none">
        {effects.map(fx => {
            const ms = fx.duration;
            const rot = fx.rotation || 0;
            return (
                <div
                    key={fx.id}
                    className="absolute w-[12.5%] h-[12.5%] pointer-events-none"
                    style={{ top: `${fx.x * 12.5}%`, left: `${fx.y * 12.5}%` }}
                >
                    {fx.type === 'IMPACT' && <Impact ms={ms} />}
                    {fx.type === 'EXPLOSION' && <Explosion ms={ms} />}
                    {fx.type === 'SLASH' && <Slash ms={ms} rotation={rot} />}
                    {fx.type === 'MUZZLE' && <Muzzle ms={ms} rotation={rot} />}
                    {fx.type === 'PUSH' && <Push ms={ms} rotation={rot} />}
                    {fx.type === 'EMERGE' && <Emerge ms={ms} />}
                    {fx.type === 'DROWN' && <Drown ms={ms} />}
                </div>
            );
        })}

        <style>{`
            @keyframes fxRing   { 0%   { transform: scale(0.3); opacity: 1; }
                                  100% { transform: scale(1.6); opacity: 0; } }
            @keyframes fxFlash  { 0%   { transform: scale(0.4); opacity: 1; }
                                  100% { transform: scale(1.3); opacity: 0; } }
            @keyframes fxRay    { 0%   { transform: scaleX(0.1); opacity: 1; }
                                  100% { transform: scaleX(1);   opacity: 0; } }
            @keyframes fxShock  { 0%   { transform: scale(0.2); opacity: 0.95; }
                                  100% { transform: scale(2.1); opacity: 0; } }
            @keyframes fxBoom   { 0%   { transform: scale(0.2);  opacity: 1; }
                                  55%  { transform: scale(1.35); opacity: 0.9; }
                                  100% { transform: scale(1.7);  opacity: 0; } }
            @keyframes fxSlash  { 0%   { stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 1; }
                                  55%  { stroke-dashoffset: 0; opacity: 1; }
                                  100% { stroke-dashoffset: 0; opacity: 0; } }
            @keyframes fxStreak { 0%   { transform: scaleX(0.2); opacity: 0; }
                                  35%  { opacity: 1; }
                                  100% { transform: scaleX(1);   opacity: 0; } }
            @keyframes fxHole   { 0%   { transform: scaleX(0.2); opacity: 0; }
                                  40%  { transform: scaleX(1);   opacity: 0.85; }
                                  100% { transform: scaleX(1);   opacity: 0; } }
            @keyframes fxRipple { 0%   { transform: scale(0.25); opacity: 0.95; }
                                  100% { transform: scale(2.2);  opacity: 0; } }
            @keyframes fxSplash { 0%   { transform: scaleY(0);   opacity: 1; }
                                  55%  { transform: scaleY(1);   opacity: 1; }
                                  100% { transform: scaleY(0.3) translateY(-25%); opacity: 0; } }
            /* Ends fully opaque and small: the water closes over it and stays closed. */
            @keyframes fxSink   { 0%   { transform: scale(0.2); opacity: 0; }
                                  45%  { transform: scale(1);   opacity: 0.9; }
                                  100% { transform: scale(0.15); opacity: 0; } }
            @keyframes fxDirt   { 0%   { transform: scaleY(0);   opacity: 1; }
                                  60%  { transform: scaleY(1);   opacity: 1; }
                                  100% { transform: scaleY(0.5) translateY(-30%); opacity: 0; } }
        `}</style>
    </div>
);
