
import React from 'react';
import { TileData, TerrainDefinition } from '../types';
import { TriangleAlert, Zap, CloudFog, Flame, Droplets, Snowflake, Crosshair, ChevronsRight, ArrowBigRight, Plus, Brain } from 'lucide-react';
import { DEFAULT_TERRAIN_DEFS } from '../constants';
import { formatGridPosition } from '../utils/gameLogic';

interface TileProps {
  data: TileData;
  terrainDefs?: Record<string, TerrainDefinition>; // Passed from parent
  isSelected: boolean;
  /** This tile will be hit on the enemy's next turn. */
  isThreatened: boolean;
  /** Total incoming damage on this tile, from computeThreatDetail. 0 hides the badge. */
  threatDamage?: number;
  /** An enemy intends to walk across this tile next turn. */
  isInEnemyPath?: boolean;
  /** …and this is where it stops. */
  isEnemyPathDestination?: boolean;
  isValidMove: boolean;
  isValidTarget: boolean;
  isHovered: boolean; // NEW: Explicit hover state from Board
  isInAttackPath: boolean;
  isInSkillRange: boolean;
  /** Inside the blast area of the item currently being aimed (follows the hovered tile). */
  isInItemAoe?: boolean;
  isEnemySpawn: boolean;
  isPlacementZone?: boolean;
  pushDirection?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null;
  /** How many tiles that shove covers. One chevron is drawn per tile. */
  pushDistance?: number;
  ghostImgUrl?: string;
  onClick: () => void;
  onMouseEnter: () => void; 
  children?: React.ReactNode;
}

export const Tile: React.FC<TileProps> = ({ 
  data, 
  terrainDefs = DEFAULT_TERRAIN_DEFS,
  isSelected,
  isThreatened,
  threatDamage = 0,
  isInEnemyPath = false,
  isEnemyPathDestination = false,
  isValidMove,
  isValidTarget,
  isHovered,
  isInAttackPath,
  isInSkillRange,
  isInItemAoe = false,
  isEnemySpawn,
  isPlacementZone,
  pushDirection,
  pushDistance = 1,
  ghostImgUrl,
  onClick, 
  onMouseEnter,
  children
}) => {
  const def = terrainDefs[data.terrain];
  const envDef = data.environment !== 'NONE' ? terrainDefs[data.environment] : null;

  const isAlt = (data.x + data.y) % 2 === 0;

  // --- Dynamic Base Style ---
  const bgStyle: any = {
      backgroundColor: def?.baseColor || '#000',
      backgroundImage: def?.textureUrl ? `url(${def.textureUrl})` : undefined,
      backgroundSize: 'cover',
  };
  
  // Checkerboard shading, so the grid stays countable at a glance. This used to be skipped
  // on textured tiles, which was fine while no terrain had a texture — now they all do, and
  // skipping it would flatten the board into one solid colour per terrain type.
  if (isAlt) {
      bgStyle.filter = 'brightness(1.1)';
  }

  // --- HOUSE ROW (y === HOUSE_COLUMN) ---
  // The win condition lives on these tiles, so they must never read as ordinary ground.
  const isHouse = !!data.isHouse;
  const hasBrain = isHouse && data.hasBrain !== false;
  if (isHouse) {
      // These are the neighbourhoods the squad is defending, so they read as a city block
      // rather than as coloured ground. Both textures are rooftops ONLY: the brain is drawn
      // once, by the overlay below. The old house-brain.svg had a brain baked into it and the
      // overlay drew another on top of it, which is how a 48px tile ended up carrying two
      // brains, two houses and two labels.
      bgStyle.backgroundImage = `url(/img/terrain/${hasBrain ? 'city-block' : 'house-empty'}.svg)`;
      bgStyle.backgroundColor = hasBrain ? '#2c1b3d' : '#1c1b1e';
      // No CSS filter here on purpose: it would desaturate the threat overlay drawn on top.
      bgStyle.filter = 'none';
  }

  // --- Hardcoded Special Effects Overlay ---
  let specialEffect = null;
  switch (data.terrain) {
    case 'WATER':
      specialEffect = (
        <div className="absolute inset-0 opacity-30 overflow-hidden pointer-events-none">
             <div className="w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#ffffff_10px,#ffffff_12px)] opacity-20 animate-[wave_3s_linear_infinite]"></div>
             <Droplets size={12} className="absolute bottom-1 right-1 text-white opacity-40 animate-bounce" />
        </div>
      );
      break;
    case 'LAVA':
      specialEffect = (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_80%)] opacity-40 animate-[pulse_2s_infinite]"></div>
            <div className="absolute bottom-0 w-full flex justify-center opacity-80">
                <Flame size={10} className="text-orange-400 animate-[bounce_1.2s_infinite] delay-100" />
            </div>
          </div>
      );
      break;
    case 'ICE':
      specialEffect = (
        <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_40%,rgba(255,255,255,0.4)_45%,transparent_50%)] bg-[length:200%_100%] animate-[shimmer_3s_infinite]"></div>
        </div>
      );
      break;
    case 'MOUNTAIN':
         specialEffect = (
            <div className="w-full h-full relative pointer-events-none">
                <div className="absolute inset-2 bg-black/20 rounded-lg"></div>
                <div className="absolute inset-3 bg-white/10 rounded-full blur-sm"></div>
            </div>
        );
        break;
  }

  // Determine push arrow rotation
  let pushRot = 0;
  if (pushDirection === 'DOWN') pushRot = 90;
  else if (pushDirection === 'UP') pushRot = -90;
  else if (pushDirection === 'LEFT') pushRot = 180;
  else if (pushDirection === 'RIGHT') pushRot = 0;

  return (
    <div 
      className={`w-full h-full relative cursor-pointer group transition-transform duration-100 active:translate-y-0.5 border-2 border-black/20`}
      style={bgStyle}
      onClick={onClick}
      // Anchor for the tutorial spotlight: it cuts its hole over this element.
      data-tut={`tile-${data.x}-${data.y}`}
      onMouseEnter={onMouseEnter}
    >
      {specialEffect}

      {/* 0.2 HOUSE / BRAIN — the objective. ONE glyph, one frame, one glow.
             This used to stack a baked-in texture, a filled house icon, a brain icon, a
             pulsing glow and a text label on a tile barely wider than a thumbnail, with the
             threat stripes and the grid label drawn over all of it. The state that has to
             survive a glance is binary — brain still here, or gone — so everything that was
             not carrying that distinction is gone. Colour does the loud half of the work
             (fuchsia = alive, dead grey = lost) and a single glyph does the rest. */}
      {isHouse && (
          <div className="absolute inset-0 z-0 pointer-events-none">
              {hasBrain ? (
                  <>
                      {/* Light in the windows: the only animated thing on the tile. */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_58%,rgba(217,70,239,0.30)_0%,transparent_72%)] animate-[pulse_3s_infinite]"></div>
                      <div className="absolute inset-0 border border-fuchsia-500/45"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                          <Brain
                              size={26}
                              strokeWidth={1.75}
                              className="text-pink-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]"
                          />
                      </div>
                  </>
              ) : (
                  /* Ransacked district: the lights are out and the frame is broken. No glyph —
                     an empty tile reading as empty IS the information. */
                  <>
                      <div className="absolute inset-0 bg-black/45"></div>
                      <div className="absolute inset-0 border border-dashed border-gray-600/50"></div>
                  </>
              )}
          </div>
      )}

      {/* 0. ENVIRONMENT VISUALS */}
      {data.environment === 'POWER_TILE' && (
          <div className="absolute inset-2 bg-purple-900/40 border-2 border-purple-400/80 flex items-center justify-center animate-pulse z-0 shadow-[0_0_10px_#a855f7]">
              <Zap size={16} className="text-purple-300 drop-shadow-md" />
          </div>
      )}
      {data.environment === 'SMOKE' && (
          <div className="absolute inset-[-4px] bg-gray-600/50 backdrop-blur-[1px] flex items-center justify-center z-20 pointer-events-none">
              <CloudFog size={28} className="text-gray-300 opacity-90 animate-pulse drop-shadow-lg" />
          </div>
      )}
      {data.environment === 'FIRE' && (
          <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="absolute inset-0 bg-red-600/20 animate-pulse"></div>
              <div className="absolute bottom-0 w-full flex justify-center gap-1">
                  <Flame size={20} className="text-red-500 animate-[bounce_0.8s_infinite] drop-shadow-lg" />
                  <Flame size={16} className="text-orange-400 animate-[bounce_1.1s_infinite] delay-100 drop-shadow-lg" />
                  <Flame size={18} className="text-yellow-400 animate-[bounce_0.9s_infinite] delay-75 drop-shadow-lg" />
              </div>
          </div>
      )}

      {/* 0.5 PLACEMENT ZONE INDICATOR & GHOST */}
      {isPlacementZone && (
          <>
            <div className="absolute inset-0 border-2 border-green-500/50 bg-green-500/10 z-10 animate-pulse flex items-center justify-center pointer-events-none">
                <div className="w-1 h-1 bg-green-400 rounded-full opacity-50"></div>
            </div>
            
            {/* GHOST UNIT PREVIEW */}
            {ghostImgUrl && isHovered && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none opacity-70 animate-pulse grayscale-[0.5]">
                    <img src={ghostImgUrl} className="w-[80%] h-[80%] object-contain" />
                </div>
            )}
          </>
      )}

      {/* 1. SELECTION */}
      {isSelected && (
        <>
           <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-300 z-30 animate-pulse"></div>
           <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-yellow-300 z-30 animate-pulse"></div>
           <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-300 z-30 animate-pulse"></div>
           <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-300 z-30 animate-pulse"></div>
           <div className="absolute inset-0 bg-yellow-400/10 z-10"></div>
        </>
      )}

      {/* 2. ENEMY SPAWN INDICATOR */}
      {isEnemySpawn && (
          <div className="absolute inset-0 flex items-center justify-center z-0">
               {/* Dirt mound the hand pushes through. */}
               <div className="absolute bottom-[14%] w-[62%] h-[9%] bg-[#3e2723] rounded-[100%] blur-[1px] z-0"></div>
               {/* A clawed hand breaking out of the ground. This used to be a Lucide glove
                   icon flipped upside down, which read as a mitten more than a grave. */}
               <img
                   src="./img/terrain/spawn-hole.svg"
                   alt=""
                   aria-hidden="true"
                   className="absolute inset-[8%] w-[84%] h-[84%] object-contain z-10
                              drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] animate-[spawnRise_2.2s_ease-in-out_infinite]"
               />
               {/* Warning Overlay */}
               <div className="absolute top-1 right-1 text-red-500 font-black text-[10px] animate-ping bg-black px-1 rounded">!</div>
               <div className="absolute inset-0 bg-red-900/30 border-2 border-red-500/50 animate-[pulse_1s_infinite]"></div>
          </div>
      )}

      {/* 2.35 SPINE FIELD — Thornquill's Spine Wall, laid across the tiles her shot crossed.
              It hurt everything that walked in from the day it was built and was drawn NOWHERE,
              which in a game that promises perfect information is worse than the damage being
              wrong: a zombie bled crossing an empty-looking square and read as a bug.

              A tile DECAL, not an object like the trap above: spines are part of the ground, and
              a unit standing on them has to stay readable, so this sits under the unit layer.
              The counter is the other half of the promise — a hazard on a clock is only a plan
              the player can make if they can see how long it lasts. */}
      {data.spikes && data.spikes.turns > 0 && (
          <div className="absolute inset-0 z-[5] pointer-events-none">
              <div
                  className="absolute inset-0 opacity-90"
                  style={{ backgroundImage: `url(/img/terrain/spikes.svg)`, backgroundSize: 'cover' }}
              />
              <div className="absolute inset-[3px] border border-emerald-400/40" />
              <span className="absolute bottom-0.5 right-1 text-[9px] leading-none font-bold text-emerald-300/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {data.spikes.turns}
              </span>
          </div>
      )}

      {/* 2.4 ARMED TRAP — a Potato Mine waiting for a footstep. Sits at unit z-level so it
              reads as a thing ON the board, not a tile decal; slight bob sells "armed". */}
      {data.trap && (
          <div className="absolute inset-0 flex items-end justify-center z-20 pointer-events-none">
              <img
                  src={data.trap.imgUrl}
                  alt=""
                  aria-hidden="true"
                  className="w-[70%] h-[70%] object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] animate-[pulse_1.4s_infinite]"
              />
          </div>
      )}

      {/* 2.5 ENEMY MOVEMENT TELEGRAPH — where zombies are walking next turn.
              Deliberately dimmer than the threat overlay: a route is not a hit. */}
      {isInEnemyPath && !isThreatened && !isValidTarget && (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
              <div className="absolute inset-[5px] border border-dashed border-amber-500/40"></div>
              {isEnemyPathDestination ? (
                  <>
                      <div className="absolute inset-[22%] border-2 border-amber-400/60 rounded-sm animate-[pulse_1.6s_infinite]"></div>
                      <ChevronsRight size={14} className="text-amber-400/70 rotate-180 drop-shadow-[0_0_3px_black]" />
                  </>
              ) : (
                  <div className="w-1.5 h-1.5 rotate-45 bg-amber-500/45 shadow-[0_0_4px_rgba(245,158,11,0.6)]"></div>
              )}
          </div>
      )}

      {/* 3. MOVEMENT RANGE — Fire Emblem style: a solid translucent blue tile with a
             crisp inner border, readable as one connected field.
             If the tile is also threatened, the warning stays on top: stepping here costs HP. */}
      {isValidMove && !isValidTarget && (
           <>
              <div className="absolute inset-0 pointer-events-none z-10 bg-sky-400/25 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.55),inset_0_0_10px_rgba(56,189,248,0.25)] group-hover:bg-sky-400/40 transition-colors"></div>
              {isThreatened && (
                  /* z-30 so the "moving here hurts" warning stays legible on top of the hazard stripes */
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                      <div className="relative flex items-center justify-center">
                          <div className="absolute w-7 h-7 rounded-full border-2 border-red-400/70 animate-ping"></div>
                          <div className="absolute w-6 h-6 rounded-full bg-black/60"></div>
                          <TriangleAlert
                              size={16}
                              className="relative text-red-300 drop-shadow-[0_0_4px_black] animate-[pulse_1s_infinite]"
                          />
                      </div>
                  </div>
              )}
           </>
      )}

      {/* 3.5 SKILL RANGE — FE's "attack range" field: a flat red wash over every tile the
             selected skill can reach, clearly dimmer than an actual valid target. */}
      {isInSkillRange && !isValidTarget && (
           <div className="absolute inset-0 pointer-events-none z-10 bg-red-500/15 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.35)]"></div>
      )}

      {/* 4. ATTACK PATH VISUALIZATION */}
      {isInAttackPath && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <div 
                className="absolute inset-0 opacity-40"
                style={{
                    background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239, 68, 68, 0.4) 10px, rgba(239, 68, 68, 0.4) 20px)',
                    animation: 'moveStripe 1s linear infinite'
                }}
              ></div>
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-red-500/50 shadow-[0_0_5px_red]"></div>
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-red-500/50 shadow-[0_0_5px_red]"></div>
          </div>
      )}

      {/* 5. TARGETING HINT - CLEANED UP */}
      {isValidTarget && (
          <div className={`absolute inset-0 z-30 transition-colors duration-100 ${isHovered ? 'bg-red-500/40' : 'bg-red-500/20'}`}>
              
              {/* Only show Borders if Hovered */}
              {isHovered && (
                  <div className="absolute inset-1 border-2 border-red-500 rounded-sm animate-pulse">
                      <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-red-200"></div>
                      <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-red-200"></div>
                      <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-red-200"></div>
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-red-200"></div>
                  </div>
              )}
              
              {/* Only show Icon if Hovered */}
              {isHovered && (
                  <div className="absolute inset-0 flex items-center justify-center">
                      {pushDirection ? (
                           <div className="flex items-center" style={{ transform: `rotate(${pushRot}deg)` }}>
                               {/* One chevron per tile travelled: a two-tile throw has to LOOK
                                   like two tiles, or the telegraph is lying about its reach. */}
                               {Array.from({ length: Math.max(1, pushDistance) }).map((_, i) => (
                                   <ArrowBigRight key={i} size={32} className="-ml-3 first:ml-0 text-yellow-400 drop-shadow-[0_0_4px_black] animate-[pulse_0.5s_infinite]" fill="currentColor" />
                               ))}
                           </div>
                      ) : (
                           <Crosshair size={32} className="text-white drop-shadow-[0_0_4px_black] animate-[spin_3s_linear_infinite]" />
                      )}
                  </div>
              )}
          </div>
      )}

      {/* 5.5 ITEM BLAST PREVIEW — every tile the aimed item will actually hit,
             following the cursor. Orange so it never reads as an enemy threat. */}
      {isInItemAoe && (
          <div className="absolute inset-0 z-30 pointer-events-none">
              <div className="absolute inset-0 bg-orange-500/35 shadow-[inset_0_0_0_1px_rgba(253,186,116,0.9),inset_0_0_10px_rgba(249,115,22,0.45)] animate-[pulse_0.9s_infinite]"></div>
              {isHovered && (
                  <div className="absolute inset-0 flex items-center justify-center">
                      <Crosshair size={26} className="text-orange-100 drop-shadow-[0_0_4px_black]" />
                  </div>
              )}
          </div>
      )}

      {/* 6. ENEMY THREAT — "this tile gets hit next turn".
             Red and loud, and visually distinct from the green move dots and the
             yellow skill-range wash. */}
      {isThreatened && (
           <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                {/* Hazard stripes */}
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        background: 'repeating-linear-gradient(45deg, transparent, transparent 7px, rgba(220,38,38,0.85) 7px, rgba(220,38,38,0.85) 14px)',
                        animation: 'moveStripe 1.2s linear infinite'
                    }}
                ></div>

                {/* Danger frame */}
                <div className="absolute inset-0 border-2 border-red-500/80 shadow-[inset_0_0_14px_rgba(239,68,68,0.55)] animate-[pulse_1.4s_infinite]"></div>
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-red-300"></div>
                <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-red-300"></div>
                <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-red-300"></div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-red-300"></div>

                {/* Incoming damage number */}
                {threatDamage > 0 && (
                    <div className="absolute top-0.5 right-0.5 flex items-center gap-0.5 bg-black/85 border border-red-500 px-1 py-[1px] rounded-sm shadow-[0_0_6px_rgba(0,0,0,0.9)]">
                        <TriangleAlert size={8} className="text-red-400" />
                        <span className="font-pixel text-[9px] leading-none text-red-200">-{threatDamage}</span>
                    </div>
                )}
           </div>
      )}

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/10 pointer-events-none transition-opacity z-20 mix-blend-overlay"></div>

      {children}

      <span className="absolute bottom-0.5 right-1 text-[8px] text-white/40 font-pixel select-none pointer-events-none z-0">
          {formatGridPosition(data.x, data.y)}
      </span>
      
      <style>{`
        /* The hand keeps clawing its way up and sinking back — a spawn tile that sits
           perfectly still stops registering as a threat after a couple of turns. */
        @keyframes spawnRise {
            0%, 100% { transform: translateY(12%) scale(0.92); opacity: 0.75; }
            50%      { transform: translateY(-4%) scale(1);    opacity: 1; }
        }
        @keyframes wave {
            0% { background-position: 0 0; }
            100% { background-position: 50px 50px; }
        }
        @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        @keyframes moveStripe {
            0% { background-position: 0 0; }
            100% { background-position: 28px 0; }
        }
      `}</style>
    </div>
  );
};
