
import React from 'react';
import { TileData, Unit, Position, DamageEvent, TerrainDefinition, Projectile, VisualEffect } from '../types';
import { Tile } from './Tile';
import { UnitComponent } from './UnitComponent';
import { DamageOverlay } from './DamageOverlay';
import { EffectsLayer } from './EffectsLayer';
import { DEFAULT_TERRAIN_DEFS, ANIMATION_CONFIG, BOARD_TILT_DEG } from '../constants';
import { useI18n } from '../i18n';
import {
  ThreatMark,
  EnemyPathTile,
  computeEnemyPathTiles,
  computeBrainThreats,
  brainThiefIds,
  dedupePositions,
  findEnemyPathTile,
  sumThreatDamageAt,
} from '../utils/threat';
import { Brain, TriangleAlert } from 'lucide-react';

interface BoardProps {
  boardData: TileData[];
  units: Unit[];
  selectedUnitId: string | null;
  onTileClick: (pos: Position) => void;
  onTileHover?: (pos: Position | null) => void;
  hoveredTile?: Position | null; // NEW: Receive current hover state from App
  attackPath?: Position[];
  validMoveTiles: Position[];
  validTargetTiles: Position[];
  /** Tiles that will be hit next enemy turn. Build with computeThreatenedTiles(units). */
  threatenedTiles?: Position[];
  /** Per-attacker breakdown, so a threatened tile can print its incoming damage. */
  threatMarks?: ThreatMark[];
  /**
   * Telegraphed enemy walk routes. Omit it and the Board derives them from
   * `units` (intent.movePath / intent.moveTo) on its own.
   */
  enemyPathTiles?: EnemyPathTile[];
  /** Set false to hide the movement telegraph entirely (e.g. during placement). */
  showEnemyPaths?: boolean;
  upcomingSpawns: Position[];
  damageEvents: DamageEvent[];
  shake: boolean;
  terrainDefs?: Record<string, TerrainDefinition>;
  projectiles?: Projectile[];
  /** One-shot combat feedback (hit bursts, swings, knockback streaks). Cosmetic only. */
  effects?: VisualEffect[];
  skillRangeTiles?: Position[];
  /** Blast area of the item currently being aimed — follows the hovered tile. */
  itemAoeTiles?: Position[];
  previewPushDirection?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null;
  /** Tiles that shove travels. Drawn as one chevron per tile. */
  previewPushDistance?: number;
  interactionMode?: string;
  selectedRosterUnit?: Unit | null;
  /** Tiles the sector hazard will hit next turn. Telegraphed a full turn ahead. */
  hazardTiles?: Position[];
  /** One-line description of the pending hazard, shown as a banner. */
  hazardLabel?: string;
  /** Tiles the mission objective points at (house to protect, tile to hold, spawns to block). */
  missionTiles?: Position[];
}

export const Board: React.FC<BoardProps> = ({ 
  boardData, 
  units, 
  selectedUnitId, 
  onTileClick,
  onTileHover,
  hoveredTile,
  attackPath = [],
  validMoveTiles,
  validTargetTiles,
  threatenedTiles = [],
  threatMarks = [],
  enemyPathTiles,
  showEnemyPaths = true,
  upcomingSpawns = [],
  damageEvents,
  shake,
  terrainDefs = DEFAULT_TERRAIN_DEFS,
  projectiles = [],
  effects = [],
  skillRangeTiles = [],
  itemAoeTiles = [],
  previewPushDirection = null,
  previewPushDistance = 1,
  interactionMode,
  selectedRosterUnit,
  hazardTiles = [],
  hazardLabel = '',
  missionTiles = []
}) => {
  const { t } = useI18n();

  // Movement telegraph: use what the caller gave us, otherwise derive it from the units.
  const pathTiles = React.useMemo<EnemyPathTile[]>(() => {
    if (!showEnemyPaths) return [];
    return enemyPathTiles ?? computeEnemyPathTiles(units);
  }, [showEnemyPaths, enemyPathTiles, units]);

  // Brains that walk away next turn. Loudest telegraph on the board: losing every brain
  // ends the run, so this can never look like an ordinary move marker.
  const brainThreats = React.useMemo(
    () => (showEnemyPaths ? computeBrainThreats(units, boardData) : []),
    [showEnemyPaths, units, boardData]
  );
  const thiefIds = React.useMemo(() => brainThiefIds(brainThreats), [brainThreats]);
  // Two zombies can converge on the same house; the warning is per-tile, so draw it once.
  const brainThreatTiles = React.useMemo(
    () => dedupePositions(brainThreats.map(threat => threat.pos)),
    [brainThreats]
  );

  const isThreatened = (x: number, y: number) => threatenedTiles.some(t => t.x === x && t.y === y);
  const isValidMove = (x: number, y: number) => validMoveTiles.some(t => t.x === x && t.y === y);
  const isValidTarget = (x: number, y: number) => validTargetTiles.some(t => t.x === x && t.y === y);
  const isEnemySpawn = (x: number, y: number) => upcomingSpawns.some(t => t.x === x && t.y === y);
  const isInAttackPath = (x: number, y: number) => attackPath.some(t => t.x === x && t.y === y);
  const isInSkillRange = (x: number, y: number) => skillRangeTiles.some(t => t.x === x && t.y === y);
  const isInItemAoe = (x: number, y: number) => itemAoeTiles.some(t => t.x === x && t.y === y);

  const activeUnits = units.filter(u => u.position.x >= 0 && u.position.y >= 0);

  return (
    <div className={`relative w-full h-full flex items-center justify-center p-4 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        
        {/* Main Board Chassis Wrapper.
            The outer A–H / 1–8 coordinate strips are gone: they sat outside the tilted
            plane so they no longer lined up with the foreshortened columns, and every
            tile already prints its own coordinate. */}
        <div className="relative p-4 bg-[#0f131d] border border-[#293245] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] cyber-card flex flex-col items-center justify-center">

            {/* Footprint wrapper: reserves the PROJECTED bbox of the tilted board, not the
                full untilted square — otherwise the chassis shows dead bands above and
                below. Ratios are measured at 26° / 1400px perspective: projected height
                ≈ 0.95 × side, projected width ≈ 1.08 × side (the near edge flares out).
                Retune both if BOARD_TILT_DEG changes. */}
            <div
                className="relative"
                style={{
                    width: 'calc(min(76vh, 58vw) * 1.08)',
                    height: 'calc(min(76vh, 58vw) * 0.95)',
                }}
            >
                {/* Main Board Aspect Container.
                    Tilted into pseudo-2.5D: overflow must stay visible and transform-style
                    preserve-3d, or the units' counter-rotation would flatten back into the
                    ground plane. Click/hover hitboxes survive the transform untouched. */}
                <div
                    className="absolute left-1/2 top-1/2 w-[min(76vh,58vw)] h-[min(76vh,58vw)] bg-[#0b0d12] border-2 border-[#293245] shadow-2xl rounded-lg"
                    style={{
                        // -53% (not -50%) vertically: the projected shape hangs low in its
                        // layout box because the far edge forshortens toward center.
                        transform: `translate(-50%, -53%) perspective(1400px) rotateX(${BOARD_TILT_DEG}deg)`,
                        transformStyle: 'preserve-3d',
                    }}
                    onMouseLeave={() => onTileHover && onTileHover(null)}
                >
                {/* CRT Scanlines Overlay */}
                <div className="scanlines" />

                {/* LAYER 1: TERRAIN GRID */}
                <div className="absolute inset-0 grid grid-cols-8 gap-0 z-0">
                    {boardData.map((tile) => {
                        const isHovered = hoveredTile?.x === tile.x && hoveredTile?.y === tile.y;
                        
                        const isHoveredTarget = attackPath.length > 0 && 
                                                attackPath[attackPath.length - 1].x === tile.x && 
                                                attackPath[attackPath.length - 1].y === tile.y;
                        
                        const isPlacementZone = interactionMode === 'PLACEMENT'
                            && !!tile.isDeployZone
                            && terrainDefs?.[tile.terrain]?.isWalkable;
                        
                        const showGhost = isPlacementZone && selectedRosterUnit && isHovered;

                        const tileThreatened = isThreatened(tile.x, tile.y);
                        const incomingDamage = tileThreatened ? sumThreatDamageAt(threatMarks, tile.x, tile.y) : 0;
                        const pathTile = findEnemyPathTile(pathTiles, tile.x, tile.y);

                        return (
                        <div key={`${tile.x}-${tile.y}`} className="relative w-full h-full">
                            <Tile 
                                data={tile} 
                                terrainDefs={terrainDefs} 
                                isSelected={false}
                                isThreatened={tileThreatened}
                                threatDamage={incomingDamage}
                                isInEnemyPath={!!pathTile}
                                isEnemyPathDestination={!!pathTile?.isDestination}
                                isValidMove={isValidMove(tile.x, tile.y)}
                                isValidTarget={isValidTarget(tile.x, tile.y)}
                                isHovered={isHovered}
                                isInAttackPath={isInAttackPath(tile.x, tile.y)}
                                isEnemySpawn={isEnemySpawn(tile.x, tile.y)}
                                isInSkillRange={isInSkillRange(tile.x, tile.y)}
                                isInItemAoe={isInItemAoe(tile.x, tile.y)}
                                isPlacementZone={isPlacementZone}
                                pushDirection={isHoveredTarget ? previewPushDirection : null}
                                pushDistance={previewPushDistance}
                                ghostImgUrl={showGhost ? selectedRosterUnit?.imgUrl : undefined} 
                                onClick={() => onTileClick({ x: tile.x, y: tile.y })}
                                onMouseEnter={() => {
                                    (window as any).hoverX = tile.x;
                                    (window as any).hoverY = tile.y;
                                    onTileHover && onTileHover({ x: tile.x, y: tile.y });
                                }}
                            />
                        </div>
                    )})}
                </div>

                {/* LAYER 1.4: MISSION MARKERS */}
                {missionTiles.length > 0 && (
                    <div className="absolute inset-0 z-[4] pointer-events-none">
                        {missionTiles.map(t => (
                            <div
                                key={`ms-${t.x}-${t.y}`}
                                className="absolute w-[12.5%] h-[12.5%] border-[3px] border-amber-300 ring-2 ring-amber-400/50 ring-inset"
                                style={{ top: `${t.x * 12.5}%`, left: `${t.y * 12.5}%` }}
                            >
                                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-amber-300 rotate-45" />
                            </div>
                        ))}
                    </div>
                )}

                {/* LAYER 1.45: BRAIN THEFT WARNING — a zombie finishes its walk on this
                    house next turn and carries the brain off. Above the hazard layer on
                    purpose: nothing else on the board matters more. */}
                {brainThreatTiles.length > 0 && (
                    <div className="absolute inset-0 z-[6] pointer-events-none">
                        {brainThreatTiles.map(pos => (
                            <div
                                key={`bt-${pos.x}-${pos.y}`}
                                className="absolute w-[12.5%] h-[12.5%]"
                                style={{ top: `${pos.x * 12.5}%`, left: `${pos.y * 12.5}%` }}
                            >
                                {/* Solid alarm wash + hard frame */}
                                <div className="absolute inset-0 bg-red-600/45 animate-[pulse_0.7s_infinite]" />
                                <div className="absolute inset-0 border-[3px] border-red-400 shadow-[0_0_16px_rgba(239,68,68,0.9),inset_0_0_14px_rgba(239,68,68,0.7)]" />
                                {/* Expanding ring, so it reads even in peripheral vision */}
                                <div className="absolute inset-1 border-2 border-red-300 rounded-sm animate-ping" />
                                {/* Brain being taken */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Brain size={26} className="text-red-100 drop-shadow-[0_0_6px_black] animate-[pulse_0.7s_infinite]" />
                                </div>
                                <div className="absolute -top-1 -right-1 bg-red-600 border border-red-200 rounded-full p-[2px] shadow-lg">
                                    <TriangleAlert size={11} className="text-white" />
                                </div>
                            </div>
                        ))}

                        <div className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-red-950/95 border-2 border-red-400 text-red-100 text-sm font-pixel uppercase font-black tracking-wide whitespace-nowrap shadow-[0_0_20px_rgba(239,68,68,0.6)] rounded-md flex items-center gap-2 animate-[pulse_1.2s_infinite]">
                            <Brain size={16} className="text-red-300" />
                            {brainThreatTiles.length > 1
                                ? t('{count} brains will be taken next turn!', { count: brainThreatTiles.length })
                                : t('A zombie takes this brain next turn!')}
                        </div>
                    </div>
                )}

                {/* LAYER 1.5: SECTOR HAZARD TELEGRAPH */}
                {hazardTiles.length > 0 && (
                    <div className="absolute inset-0 z-[5] pointer-events-none">
                        {hazardTiles.map(t => (
                            <div
                                key={`hz-${t.x}-${t.y}`}
                                className="absolute w-[12.5%] h-[12.5%] border-2 border-dashed border-sky-400/80 bg-sky-500/20 animate-pulse"
                                style={{ top: `${t.x * 12.5}%`, left: `${t.y * 12.5}%` }}
                            />
                        ))}
                        {hazardLabel && (
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-sky-950/90 border border-sky-400 text-sky-200 text-xs font-pixel uppercase font-bold tracking-wide whitespace-nowrap shadow-lg rounded-md">
                                {t(hazardLabel)}
                            </div>
                        )}
                    </div>
                )}

                {/* LAYER 2: UNITS — every wrapper down to the sprite keeps preserve-3d
                    so the sprite's stand-upright counter-rotation composes with the
                    board tilt instead of being flattened. */}
                <div className="absolute inset-0 z-10 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
                    {activeUnits.map(unit => {
                        const isSelected = unit.id === selectedUnitId;
                        const top = unit.position.x * 12.5;
                        const left = unit.position.y * 12.5;

                        return (
                            <div
                                key={unit.id}
                                className="absolute w-[12.5%] h-[12.5%]"
                                style={{
                                    top: `${top}%`,
                                    left: `${left}%`,
                                    zIndex: isSelected ? 20 : 10,
                                    transformStyle: 'preserve-3d',
                                    transition: `top ${ANIMATION_CONFIG.MOVE_STEP_DURATION}ms linear, left ${ANIMATION_CONFIG.MOVE_STEP_DURATION}ms linear`
                                }}
                            >
                                <UnitComponent unit={unit} isSelected={isSelected} isBrainThief={thiefIds.has(unit.id)} />
                            </div>
                        );
                    })}
                </div>

                {/* LAYER 3: PROJECTILES */}
                <div className="absolute inset-0 z-30 pointer-events-none">
                    {projectiles.map(proj => {
                        const duration = proj.duration || 500;
                        return (
                        <div 
                            key={proj.id}
                            className="absolute w-[12.5%] h-[12.5%] flex items-center justify-center ease-linear"
                            style={{
                                left: `${proj.currentX}%`,
                                top: `${proj.currentY}%`,
                                transform: `translate(-50%, -50%) rotate(${proj.rotation}deg) scale(${proj.isLobbed ? 1.5 : 1})`,
                                transitionProperty: 'left, top',
                                transitionDuration: `${duration}ms`,
                                transitionTimingFunction: proj.isLobbed ? 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'linear'
                            }}
                        >
                            <div className={`
                                w-4 h-4 rounded-full shadow-lg stroke-2 border border-black
                                ${proj.type === 'PEA' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 
                                  proj.type === 'FROZEN_PEA' ? 'bg-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 
                                  proj.type === 'CORN' ? 'bg-amber-400 rounded-sm' : 
                                  proj.type === 'CABBAGE' ? 'bg-emerald-700 rounded-full' : 'bg-white'}
                            `}></div>
                        </div>
                    )})}
                </div>

                {/* LAYER 3.5: COMBAT EFFECTS — above the projectile that caused them,
                    below the damage number that explains them. */}
                <div className="absolute inset-0 z-[35] pointer-events-none">
                    <EffectsLayer effects={effects} />
                </div>

                {/* LAYER 4: DAMAGE NUMBERS */}
                <div className="absolute inset-0 z-40 pointer-events-none">
                    <DamageOverlay events={damageEvents} />
                </div>
                </div>
            </div>

        </div>

        <style>{`
            @keyframes shake {
                0%, 100% { transform: translate(0, 0); }
                10%, 30%, 50%, 70%, 90% { transform: translate(-4px, -1px); }
                20%, 40%, 60%, 80% { transform: translate(4px, 1px); }
            }
        `}</style>
    </div>
  );
};
