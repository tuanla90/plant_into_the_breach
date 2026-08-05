
import React, { useState } from 'react';
import { Unit, UnitClass } from '../types';
import { Zap, Shield, Sun, Utensils, Flame, CloudFog, ArrowRight, Skull, Flag, Brain, Snowflake } from 'lucide-react';
import { ANIMATION_CONFIG, BOARD_TILT_DEG } from '../constants';
import { facingFlip, spriteFor } from '../utils/icons';
import { willAct } from '../utils/threat';
import { ElementBadge } from './ElementBadge';
import { useI18n } from '../i18n';

interface UnitComponentProps {
  unit: Unit;
  isSelected: boolean;
  /** This zombie walks off with a brain next turn — the board's highest-priority target. */
  isBrainThief?: boolean;
}

export const UnitComponent: React.FC<UnitComponentProps> = ({ unit, isSelected, isBrainThief = false }) => {
  const { t } = useI18n();
  const [imgError, setImgError] = useState(false);
  // Reset on a sprite swap: without this a single failed load would keep the skull fallback
  // for the rest of the fight, including for the phase-two art that might load perfectly.
  const shownSprite = spriteFor(unit);
  React.useEffect(() => { setImgError(false); }, [shownSprite]);

  const isSunflower = unit.class === UnitClass.SUNFLOWER || unit.class === UnitClass.TWIN_SUNFLOWER || unit.class === UnitClass.SUN_SHROOM;
  const isDigesting = (unit.digestingTurns || 0) > 0;
  const isGrave = unit.class === UnitClass.GRAVE;
  const isDying = unit.isDying;
  
  const hasBurn = unit.statusEffects?.includes('BURN');
  const hasStun = unit.statusEffects?.includes('STUN');
  const hasFreeze = unit.statusEffects?.includes('FREEZE');
  const isDormant = unit.statusEffects?.includes('DORMANT');
  // Buffed by a living Flag Zombie: +1 damage, +1 move until the herald is shot.
  const isEnraged = unit.statusEffects?.includes('ENRAGED');
  const isSpawning = unit.spawnDelay !== undefined;
  
  // New: Check if fully charged
  const isCharged = (unit.sunCharge || 0) > 0;

  // --- IDLE BREATHING ---
  // Between actions every unit was a completely still image, which reads as a paused game
  // rather than a waiting one. The bob goes on the <img>, NOT on the wrapper: the wrapper
  // already carries the lunge translate and the stand-upright rotation, and a CSS animation
  // touching `transform` would replace both.
  //
  // A negative delay derived from the unit id starts each one mid-cycle, so a row of zombies
  // breathes out of step instead of pulsing in unison like a marching band.
  let idleHash = 7;
  for (let i = 0; i < unit.id.length; i++) idleHash = (idleHash * 31 + unit.id.charCodeAt(i)) % 2400;
  const idlePhase = -idleHash;
  // Frozen and stunned units hold perfectly still — that stillness is the tell that the
  // crowd control landed, so animating through it would erase the feedback.
  const idles = !isDying && !isSpawning && !hasStun && !hasFreeze && !isDormant && !unit.isBurrowed;

  // Visual offsets for animation (Attack Lunge), composed with the pseudo-2.5D
  // stand-up rotation: the board plane is tilted BOARD_TILT_DEG away, so the sprite
  // counter-rotates around its feet (bottom edge) to stand upright, billboard-style.
  // The lunge translate must come first — it happens in the ground plane.
  const standUp = `rotateX(${-BOARD_TILT_DEG}deg)`;
  // The Gargantuar's art is drawn facing right; every other zombie in the set marches
  // left, toward the lawn. Mirror it on the WRAPPER, not the <img> — the idle-bob
  // animation owns the img's transform and would silently erase a flip put there.
  const flip = facingFlip(unit.class);
  const transformStyle: any = { transformOrigin: '50% 100%' };
  if (unit.visualOffset) {
      transformStyle.transform = `translate(${unit.visualOffset.y * 100}%, ${unit.visualOffset.x * 100}%) ${standUp}${flip}`;
      // Matches ATTACK_LUNGE_DURATION
      transformStyle.transition = `transform ${ANIMATION_CONFIG.ATTACK_LUNGE_DURATION}ms cubic-bezier(0.175, 0.885, 0.32, 1.275)`;
  } else {
      transformStyle.transform = (isSelected ? `${standUp} scale(1.1)` : standUp) + flip;
      transformStyle.transition = `transform 100ms ease-out`; // Quick return
  }

  // --- INTENT ARROW LOGIC ---
  // A stunned / dying / still-spawning unit will not act, so it must not telegraph.
  // Hypnotised zombies (isEnemy === false) fight for the player, so their stale intent is not a threat.
  // One predicate for "will it act", shared with the threat overlay (utils/threat.ts). The
  // inline copy that used to live here had drifted: no health check and no FREEZE, so a dead
  // or frozen zombie kept pointing at a target the overlay had already cleared.
  // `isSpawning` stays local — it is about this frame's animation, not about the rules.
  const telegraphs = willAct(unit) && !isSpawning;

  let intentArrow = null;
  if (unit.intent?.type === 'ATTACK' && unit.intent.target && telegraphs) {
       const dx = unit.intent.target.x - unit.position.x; 
       const dy = unit.intent.target.y - unit.position.y; 

       if (Math.abs(dx) + Math.abs(dy) === 1) {
           let rot = 0;
           let posClass = '';
           
           if (dx === 1) { rot = 90; posClass = '-bottom-5 left-1/2 -translate-x-1/2'; } // Down
           else if (dx === -1) { rot = -90; posClass = '-top-5 left-1/2 -translate-x-1/2'; } // Up
           else if (dy === 1) { rot = 0; posClass = '-right-5 top-1/2 -translate-y-1/2'; } // Right
           else if (dy === -1) { rot = 180; posClass = '-left-5 top-1/2 -translate-y-1/2'; } // Left

           intentArrow = (
               <div className={`absolute ${posClass} z-50 text-red-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] animate-[pulse_1s_infinite]`}>
                   <ArrowRight size={28} strokeWidth={4} style={{ transform: `rotate(${rot}deg)` }} />
               </div>
           );
       }
  } else if (unit.intent?.type === 'MOVE' && unit.intent.moveTo && telegraphs) {
       // MOVE telegraph: amber, deliberately calmer than the red attack arrow.
       const dest = unit.intent.moveTo;
       const movesAtAll = dest.x !== unit.position.x || dest.y !== unit.position.y;

       if (movesAtAll) {
           // Point at the first real step of the route when we have one, else straight at the goal.
           const firstStep = unit.intent.movePath?.find(
               p => p.x !== unit.position.x || p.y !== unit.position.y
           ) || dest;

           const dx = firstStep.x - unit.position.x;
           const dy = firstStep.y - unit.position.y;
           const distance = Math.abs(dest.x - unit.position.x) + Math.abs(dest.y - unit.position.y);

           let rot = 0;
           let posClass = '';
           if (Math.abs(dy) >= Math.abs(dx)) {
               if (dy > 0) { rot = 0; posClass = '-right-4 top-1/2 -translate-y-1/2'; }        // Right
               else { rot = 180; posClass = '-left-4 top-1/2 -translate-y-1/2'; }              // Left
           } else if (dx > 0) { rot = 90; posClass = '-bottom-4 left-1/2 -translate-x-1/2'; }  // Down
           else { rot = -90; posClass = '-top-4 left-1/2 -translate-x-1/2'; }                  // Up

           intentArrow = (
               <div className={`absolute ${posClass} z-40 flex items-center justify-center text-amber-400/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] animate-[pulse_1.6s_infinite]`}>
                   <ArrowRight size={20} strokeWidth={3} style={{ transform: `rotate(${rot}deg)` }} />
                   {distance > 1 && (
                       <span className="absolute -top-2 -right-1 font-pixel text-[8px] leading-none text-amber-200 bg-black/80 px-[2px] rounded-sm">
                           {distance}
                       </span>
                   )}
               </div>
           );
       }
  }

  return (
    <div className={`
        w-full h-full relative flex items-center justify-center pointer-events-none
        ${isDying ? 'animate-[die_0.5s_forwards]' : ''}
        ${isSpawning ? 'animate-[spawnPop_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)]' : ''}
    `} style={{ transformStyle: 'preserve-3d' }}>
        
        {/* --- SHADOW BASE --- */}
        {!isDying && !unit.isBurrowed && (
            <div className="absolute bottom-2 w-[60%] h-[15%] bg-black/50 rounded-[100%] blur-[2px]"></div>
        )}

        {/* --- CHARGE AURA (SUNFLOWER) --- */}
        {isSunflower && isCharged && !isDying && (
            <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-pulse blur-sm z-0 scale-125"></div>
        )}

        {/* --- MAIN UNIT SPRITE --- */}
        {!unit.isBurrowed && (
            <div 
                className={`
                    relative w-[90%] h-[90%] flex items-center justify-center z-10
                    ${isSelected ? 'drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : ''}
                    ${isDigesting ? 'animate-pulse' : ''}
                    ${unit.hasAttacked ? 'grayscale-[0.3]' : ''}
                `}
                style={transformStyle}
            >
                {imgError ? (
                    <div className="w-full h-full bg-gray-800 border-2 border-red-500 rounded flex items-center justify-center flex-col p-1 text-center">
                        <Skull size={16} className="text-red-500 mb-1" />
                        <span className="text-[8px] text-white leading-none font-bold uppercase">{unit.class.substring(0, 4)}</span>
                    </div>
                ) : (
                    <img 
                        // Not `unit.imgUrl` — a boss in its second phase is a different
                        // picture, and which one is a question about state, not about art
                        // (utils/icons.ts SPRITE_VARIANTS).
                        src={spriteFor(unit)}
                        alt={unit.class} 
                        referrerPolicy="no-referrer"
                        onError={() => setImgError(true)}
                        style={idles ? { animation: `idleBob 2.4s ease-in-out ${idlePhase}ms infinite` } : undefined}
                        className={`
                            w-full h-full object-contain rendering-pixelated
                            ${unit.isEnemy ? 'grayscale-[0.1]' : ''}
                            ${hasBurn ? 'sepia hue-rotate-[-30deg] saturate-200' : ''}
                            ${hasStun ? 'brightness-150 contrast-50 opacity-80' : ''}
                            ${hasFreeze ? 'brightness-125 saturate-50 hue-rotate-[170deg] drop-shadow-[0_0_5px_rgba(56,189,248,0.9)]' : ''}
                            ${isDormant ? 'grayscale brightness-75' : ''}
                            ${isEnraged ? 'saturate-150 drop-shadow-[0_0_4px_rgba(239,68,68,0.9)]' : ''}
                        `}
                    />
                )}
            </div>
        )}

        {/* --- DYNAMIC ELEMENTAL AURA OVERLAY --- */}
        {!isDying && unit.element === 'FIRE' && (
            <div className="absolute inset-0 rounded-full pointer-events-none z-10 border border-orange-500/80 shadow-[0_0_15px_rgba(249,115,22,0.85)] animate-pulse">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-yellow-300 rounded-full blur-[1px] animate-[bounce_1.2s_infinite]"></div>
                <div className="absolute -bottom-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full blur-[1px] animate-[ping_1.5s_infinite]"></div>
            </div>
        )}
        {!isDying && unit.element === 'ICE' && (
            <div className="absolute inset-0 rounded-full pointer-events-none z-10 border border-sky-400/80 shadow-[0_0_15px_rgba(56,189,248,0.9)] animate-pulse">
                <div className="absolute top-0 right-1 w-2 h-2 bg-sky-200 rotate-45 animate-ping opacity-75"></div>
            </div>
        )}
        {!isDying && unit.element === 'ELEC' && (
            <div className="absolute inset-0 rounded-full pointer-events-none z-10 border border-amber-300/80 shadow-[0_0_15px_rgba(250,204,21,0.9)] animate-[pulse_0.6s_infinite]">
                <div className="absolute -top-2 left-2 w-1 h-3 bg-yellow-300 rotate-12 blur-[0.5px]"></div>
                <div className="absolute -bottom-1 left-1/2 w-3 h-1 bg-cyan-300 -rotate-12 blur-[0.5px]"></div>
            </div>
        )}

        {/* --- CONTINUOUS STATUS EFFECTS OVERLAYS --- */}
        {!isDying && hasBurn && (
            <div className="absolute inset-0 pointer-events-none z-15 rounded-full bg-gradient-to-t from-orange-600/40 via-red-500/20 to-transparent animate-pulse border border-orange-500/50">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1">
                    <Flame size={14} className="text-orange-500 animate-bounce drop-shadow-[0_0_4px_rgba(249,115,22,1)]" />
                </div>
            </div>
        )}
        {!isDying && hasFreeze && (
            <div className="absolute inset-0 pointer-events-none z-15 rounded-md bg-sky-400/30 border-2 border-sky-300/80 shadow-[0_0_10px_rgba(56,189,248,0.8)] backdrop-blur-[1px]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Snowflake size={20} className="text-sky-100 animate-spin opacity-90 drop-shadow-[0_0_6px_rgba(56,189,248,1)]" />
                </div>
            </div>
        )}
        {!isDying && hasStun && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none z-30 animate-spin">
                <div className="flex gap-1">
                    <span className="text-yellow-300 text-xs font-bold drop-shadow-[0_0_3px_black]">★</span>
                    <span className="text-amber-400 text-xs font-bold drop-shadow-[0_0_3px_black]">★</span>
                </div>
            </div>
        )}

        {/* --- INTENT ARROW --- */}
        {intentArrow}

        {/* --- HP BAR --- */}
        {(!isGrave || unit.hp < unit.maxHp) && !isDying && (
            <div className="absolute bottom-0 w-[90%] h-1.5 bg-black/60 rounded-sm flex p-[1px] gap-[1px] z-20">
                {Array.from({ length: unit.maxHp }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`flex-1 rounded-[1px] ${i < unit.hp ? (unit.isEnemy ? 'bg-red-500' : 'bg-green-500') : 'bg-gray-700'}`}
                    ></div>
                ))}
            </div>
        )}

        {/* --- STATUS ICONS --- */}
        {!isDying && (
            <>
                {/* Status Effects */}
                <div className="absolute -top-2 left-0 flex flex-col gap-1 z-20">
                    {hasBurn && <Flame size={12} className="text-orange-500 animate-bounce" />}
                    {hasStun && <CloudFog size={12} className="text-gray-300 animate-pulse" />}
                    {hasFreeze && <Snowflake size={12} className="text-sky-300 animate-pulse" />}
                    {isDormant && <Skull size={12} className="text-gray-400" />}
                    {isEnraged && <Flag size={12} className="text-red-500 animate-pulse" />}
                    {isDigesting && <Utensils size={12} className="text-purple-500 animate-bounce" />}
                </div>

                {/* Brain thief: this one reaches a brain next turn. Kill it, block it, or push it. */}
                {isBrainThief && (
                    <>
                        <div className="absolute inset-0 rounded-full ring-2 ring-red-400 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-[pulse_0.7s_infinite] z-10 pointer-events-none"></div>
                        <div className="absolute -top-2 right-0 z-30 bg-red-600 border border-red-200 rounded-full p-[2px] shadow-lg animate-bounce">
                            <Brain size={11} className="text-white" />
                        </div>
                    </>
                )}

                {/* Charged Indicator (Icon) */}
                {isSunflower && isCharged && (
                     <div className="absolute top-0 right-0 animate-[spin_3s_linear_infinite] z-20">
                         <Sun size={16} className="text-yellow-300 fill-yellow-500 drop-shadow-[0_0_2px_black]" />
                     </div>
                )}

                {/* Element carried into the fight. Bottom-LEFT, and a bordered chip rather than
                    a bare glyph, because the status column above is bare glyphs in the SAME
                    two icons: a flame there means "burning", a flame here means "sets things
                    burning". Sharing a corner or a shape would invert the reading. */}
                {unit.element && (
                    <div className="absolute bottom-2 left-0 z-20">
                        <ElementBadge element={unit.element} size={9} />
                    </div>
                )}

                {/* Shield / Armor (from Harden-type skills, Pumpkin Shell, fusions) */}
                {(unit.shield || 0) > 0 && (
                     <div className="absolute bottom-2 right-0 z-20 flex items-center gap-[1px] bg-black/70 rounded-sm px-[2px] py-[1px] border border-sky-500/60">
                         <Shield size={10} className="text-sky-400" fill="currentColor" />
                         <span className="text-[9px] font-bold leading-none text-sky-200">{unit.shield}</span>
                     </div>
                )}

                {/* Helmet armour — permanent, so it must not look like a shield the player can
                    chew through: grey, not sky-blue, and it never counts down. Perfect
                    information: the rule "every hit loses N" has to be readable on the body. */}
                {(unit.armor || 0) > 0 && (unit.shield || 0) === 0 && (
                     <div title={t('Armor: every hit loses 1 damage. Fire and spikes ignore it.')}
                          className="absolute bottom-2 right-0 z-20 flex items-center gap-[1px] bg-black/70 rounded-sm px-[2px] py-[1px] border border-zinc-400/60">
                         <Shield size={10} className="text-zinc-300" />
                         <span className="text-[9px] font-bold leading-none text-zinc-200">{unit.armor}</span>
                     </div>
                )}
            </>
        )}

        <style>{`
            @keyframes die {
                0% { transform: scale(1); opacity: 1; filter: grayscale(0); }
                100% { transform: scale(0) translateY(10px); opacity: 0; filter: grayscale(1); }
            }
            /* Small on purpose. Anything bigger turns a tactics board into an aquarium. */
            @keyframes idleBob {
                0%, 100% { transform: translateY(0)    scale(1); }
                50%      { transform: translateY(-3.5%) scale(1.015); }
            }
            @keyframes spawnPop {
                0% { transform: scale(0); }
                80% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
        `}</style>
    </div>
  );
};
