
import React from 'react';
import { Unit, UnitClass, Skill, TileData, TerrainDefinition, UnitType } from '../types';
import { SQUAD_SIZE } from '../constants';
import { UNIT_SKILLS, DEFAULT_TERRAIN_DEFS } from '../constants';
import { Crosshair, Move, Shield, Zap, XCircle, Hourglass, ChevronsRight, ArrowUpCircle, Utensils, RotateCcw, Sun, Skull, Info, Mountain, Radar, Sword, ArrowRight, Play, UserPlus, MinusCircle, AlertCircle, Plus } from 'lucide-react';
import { formatGridPosition, isSunProducingSkill } from '../utils/gameLogic';
import { mobileSprite } from '../utils/platform';
import { useI18n } from '../i18n';

interface ActionPanelProps {
  selectedUnit: Unit | null;
  selectedTile: TileData | null;
  interactionMode: 'IDLE' | 'TARGETING' | 'ITEM_TARGETING' | 'MOVING' | 'EXECUTING' | 'PLACEMENT';
  selectedSkillId: string | null;
  terrainDefs?: Record<string, TerrainDefinition>;
  skillDefs?: Record<UnitClass, Skill[]>;
  /**
   * Skills for the selected unit specifically. A GRANT_ATTACK fusion gives one hero an
   * attack its class table knows nothing about, so this wins over `skillDefs` when present.
   */
  extraSkills?: Skill[];
  onActionSelect: (skillId: string) => void;
  onCancelAction: () => void;
  onEndTurn: () => void;
  onWait: () => void;
  onUndoMove: () => void;
  onStartBattle?: () => void;
  // NEW: Props for Roster Management
  rosterUnits?: Unit[];
  onSelectRosterUnit?: (unitId: string) => void;
  selectedRosterId?: string | null;
  /**
   * Sun currently banked this level. Gates skills that carry a `sunCost`.
   * Defaults to Infinity so the panel never locks a skill before App.tsx wires
   * the real value in.
   */
  currentSun?: number;
  /** Chrona's rewind: back to the start of this turn. Free, once per battle. */
  onResetTurn?: () => void;
  turnResetsLeft?: number;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ 
  selectedUnit,
  selectedTile,
  interactionMode, 
  selectedSkillId, 
  terrainDefs = DEFAULT_TERRAIN_DEFS,
  skillDefs = UNIT_SKILLS,
  extraSkills,
  onActionSelect,
  onCancelAction, 
  onEndTurn,
  onWait,
  onUndoMove,
  onStartBattle,
  rosterUnits = [],
  onSelectRosterUnit,
  selectedRosterId,
  currentSun = Infinity,
  onResetTurn,
  turnResetsLeft = 0
}) => {
  const { t } = useI18n();

  // Chrona's rewind sits directly above End Turn: the two turn-level controls live
  // together, and the pairing reads as "finish the turn — or take it back". Rendered
  // inside the same component so all three EndTurnButton mounts get it for free.
  const RewindTurnButton = () => {
      const spent = turnResetsLeft <= 0;
      const locked = interactionMode !== 'IDLE';
      return (
          <button
              onClick={onResetTurn}
              disabled={spent || locked || !onResetTurn}
              data-tut="reset-turn"
              title={t('Chrona rewinds the board to the start of this turn. Once per battle.')}
              className={`flex-1 lg:w-full py-2 px-2 lg:px-4 border rounded-lg flex items-center justify-center gap-1.5 lg:gap-2 transition-all
                  ${spent || locked
                      ? 'border-gray-700 text-gray-600 bg-[#0b0d14] cursor-not-allowed opacity-60'
                      : 'border-cyan-500/60 text-cyan-300 bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 hover:border-cyan-300 hover:text-white shadow-[0_0_12px_rgba(34,211,238,0.15)] active:scale-95 cursor-pointer'}`}
          >
              <RotateCcw size={14} className="shrink-0" />
              {/* Chữ chỉ hiện từ lg — dưới đó footer là MỘT hàng và mỗi px bề ngang
                  đều đang tranh nhau với nút End Turn. Icon + bộ đếm là đủ nghĩa. */}
              <span className="hidden lg:inline text-xs font-black uppercase tracking-[0.15em]">{t('Rewind Turn')}</span>
              <span className="text-[10px] font-mono opacity-80">{Math.max(0, turnResetsLeft)}/1</span>
          </button>
      );
  };

  // COMPACT END TURN BUTTON — dưới lg, Rewind và End Turn nằm CHUNG MỘT HÀNG:
  // xếp chồng như desktop thì hai nút này nuốt ~90px chiều cao của panel và danh
  // sách skill phía trên chỉ còn ló ra một mẩu sau thanh cuộn.
  const EndTurnButton = () => (
      <div className="flex lg:flex-col gap-1.5 lg:gap-2">
      <RewindTurnButton />
      <button
          onClick={onEndTurn}
          data-tut="end-turn"
          className="flex-[2] lg:w-full bg-gradient-to-r from-red-950 via-rose-900 to-red-950 hover:from-red-900 hover:to-rose-800 text-red-200 hover:text-white border border-red-500/60 hover:border-red-400 py-2 lg:py-2.5 px-3 lg:px-4 shadow-[0_0_15px_rgba(239,68,68,0.25)] active:scale-95 transition-all flex items-center justify-center gap-2 rounded-lg group cursor-pointer"
      >
          <span className="text-sm lg:text-base font-black uppercase tracking-[0.1em] lg:tracking-[0.2em] group-hover:drop-shadow whitespace-nowrap">{t('End Turn')}</span>
          <span className="keycap text-[10px] text-red-300 border-red-500/40 hidden md:inline">SPACE</span>
      </button>
      </div>
  );

  const StartBattleButton = ({ disabled }: { disabled: boolean }) => (
    <button 
        onClick={onStartBattle}
        data-tut="start-battle"
        disabled={disabled}
        className={`
            w-full py-3 lg:py-5 px-4 border-2 shadow-2xl active:scale-95 transition-all flex flex-col items-center justify-center gap-1 mt-auto rounded-xl cursor-pointer
            ${disabled ? 'bg-slate-900 border-slate-700 text-slate-500 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 hover:from-emerald-600 hover:to-green-500 text-white border-emerald-400 glow-green animate-pulse'}
        `}
    >
        <div className="flex items-center gap-2.5">
            <Play size={24} fill="currentColor" />
            <span className="text-lg lg:text-2xl font-black uppercase tracking-[0.1em] lg:tracking-[0.2em] drop-shadow-md">{t('Start Battle')}</span>
        </div>
        <span className="text-[10px] lg:text-xs uppercase tracking-widest opacity-80 font-bold">{disabled ? t('Check Deployment Limit') : t('Enemies will Approach')}</span>
    </button>
  );

  // --- PLACEMENT MODE HEADER ---
  if (interactionMode === 'PLACEMENT') {
      const deployedCount = rosterUnits.filter(u => u.position.x >= 0).length;
      // SQUAD_SIZE, not a 3 written here as well. Two places encoding one rule is how they
      // drift, and this panel is the one that refuses to let the battle start when they do.
      const MAX_DEPLOY = SQUAD_SIZE;
      const canStart = deployedCount > 0 && deployedCount <= MAX_DEPLOY;

      return (
        <div className="w-64 md:w-80 lg:w-96 cyber-panel border-l border-[#293245] flex flex-col h-full shadow-2xl relative z-30 font-pixel shrink-0 portrait:w-full portrait:h-[45%] portrait:border-l-0 portrait:border-t">
            {/* p-3/text-base below lg: at 375px of viewport height the padded header plus
                the Start Battle footer alone were taller than the panel, and the button's
                bottom edge left the screen. */}
            <div className="bg-[#121622] p-3 lg:p-5 border-b border-[#293245] text-center">
                <h2 className="text-base lg:text-xl text-amber-400 uppercase font-black tracking-widest mb-1.5 lg:mb-2 flex items-center justify-center gap-2">
                    <Zap size={20} className="text-amber-400 animate-bounce shrink-0" />
                    {t('Tactical Insertion')}
                </h2>
                <div className="flex justify-between items-center text-sm text-gray-300 border border-[#293245] p-2.5 rounded-lg bg-[#0b0d14]/80">
                    <span className="font-bold text-xs uppercase text-gray-400">{t('Deployed:')}</span>
                    <span className={`font-black text-xl ${deployedCount > MAX_DEPLOY ? 'text-red-400' : 'text-emerald-400'}`}>
                        {deployedCount} / {MAX_DEPLOY}
                    </span>
                </div>
                {deployedCount > MAX_DEPLOY && (
                    <div className="text-xs text-red-400 mt-2 font-bold uppercase flex items-center justify-center gap-1">
                        <AlertCircle size={12}/> {t('Max {max} Units Allowed!', { max: MAX_DEPLOY })}
                    </div>
                )}
            </div>
            
            <div className="flex-1 min-h-0 overflow-y-auto p-3 lg:p-4 space-y-3">
                <div className="text-xs text-sky-400 uppercase font-bold tracking-widest mb-2 flex items-center gap-1.5">
                    <Radar size={14} />
                    {t('Squad Roster')}
                </div>
                {rosterUnits.filter(u => u.type === UnitType.PLANT).map(unit => {
                    const isDeployed = unit.position.x >= 0;
                    const isSelected = selectedRosterId === unit.id;

                    return (
                        <div 
                            key={unit.id}
                            onClick={() => onSelectRosterUnit && onSelectRosterUnit(unit.id)}
                            className={`
                                flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all relative
                                ${isSelected ? 'border-amber-400 bg-amber-950/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]' : 'border-[#293245] bg-[#161a26] hover:border-sky-400 hover:bg-[#1d2334]'}
                            `}
                        >
                            <img src={mobileSprite(unit.imgUrl)} className="w-10 h-10 object-contain bg-[#0b0d14] rounded-lg border border-[#293245] p-1" alt={t(unit.class.replace(/_/g, ' '))} />
                            <div className="flex-1">
                                <div className="text-sm font-black text-white uppercase">{t(unit.class.replace(/_/g, ' '))}</div>
                                <div className="text-[11px] text-gray-400 uppercase font-medium">{t(unit.role)}</div>
                            </div>
                            
                            {isDeployed ? (
                                <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-bold bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-500/50">
                                    {t('ON FIELD')}
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold bg-black/40 px-2 py-1 rounded-md border border-gray-700">
                                    {t('BENCH')}
                                </div>
                            )}

                            {/* Sending a seedling out is a decision with a price, so the price
                                is on the card at the moment the decision is made — not buried
                                in a tooltip on a different screen two nodes later. */}
                            {!!unit.materialId && (
                                <div
                                    className={`absolute -bottom-2 left-3 px-1.5 text-[9px] font-bold uppercase tracking-wide rounded border
                                        ${isDeployed
                                            ? 'bg-amber-950 border-amber-600/70 text-amber-300'
                                            : 'bg-[#0b0d14] border-gray-700 text-gray-500'}`}
                                >
                                    {isDeployed
                                        ? t('-1 HP for this tour')
                                        : t('Left behind: no wear')}
                                </div>
                            )}

                            {isSelected && (
                                <div className="absolute right-2 top-2 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="p-2 lg:p-3 border-t border-[#293245] bg-[#0b0d14]">
                <StartBattleButton disabled={!canStart} />
            </div>
        </div>
      );
  }

  // --- 1. EMPTY STATE ---
  if (!selectedUnit && !selectedTile) {
    return (
        // Same width ladder as every other branch: the one time this said plain `w-96`
        // (and skipped shrink-0) the board jumped size whenever the selection emptied.
        <div className="w-64 md:w-80 lg:w-96 cyber-panel border-l border-[#293245] flex flex-col h-full shadow-2xl relative z-30 font-pixel shrink-0 portrait:w-full portrait:h-[45%] portrait:border-l-0 portrait:border-t">
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center text-gray-500 p-4 lg:p-8 text-center gap-3">
                <Info size={44} className="text-sky-400 opacity-40 animate-pulse shrink-0" />
                <div className="text-lg uppercase tracking-widest font-black text-gray-300">{t('System Idle')}</div>
                <p className="text-xs text-gray-400">{t('Select a Unit or Tile to view details.')}</p>
            </div>
            <div className="p-3 border-t border-[#293245] bg-[#0b0d14]">
                <EndTurnButton />
            </div>
        </div>
    );
  }

  // --- 2. TERRAIN INSPECTOR ---
  if (!selectedUnit && selectedTile) {
      const info = terrainDefs[selectedTile.terrain];
      const envInfo = selectedTile.environment !== 'NONE' ? terrainDefs[selectedTile.environment] : null;

      return (
        <div className="w-64 md:w-80 lg:w-96 cyber-panel border-l border-[#293245] flex flex-col h-full shadow-2xl relative z-30 font-pixel shrink-0 portrait:w-full portrait:h-[45%] portrait:border-l-0 portrait:border-t">
            <div className="bg-[#121622] p-5 border-b border-[#293245] flex items-center gap-4">
                 <div className="w-14 h-14 bg-[#0b0d14] border border-[#293245] rounded-xl flex items-center justify-center shadow-inner">
                     <Mountain size={28} className="text-sky-400" />
                 </div>
                 <div>
                     <h2 className="text-xl text-amber-400 font-black uppercase">{info?.name ? t(info.name) : ''}</h2>
                     <div className="text-sky-400 text-xs font-mono">{formatGridPosition(selectedTile.x, selectedTile.y)}</div>
                 </div>
            </div>

            <div className="p-4 lg:p-5 flex-1 min-h-0 overflow-y-auto space-y-4 lg:space-y-5">
                <div>
                    <h3 className="text-gray-400 uppercase text-xs font-bold mb-2 tracking-wider">{t('Terrain Properties')}</h3>
                    <p className="text-gray-200 text-sm leading-relaxed">{info?.description ? t(info.description) : ''}</p>
                    <div className="mt-3 flex gap-2">
                        {info?.isWalkable ?
                            <span className="px-2.5 py-1 bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 text-xs font-bold uppercase rounded-md">{t('Walkable')}</span> :
                            <span className="px-2.5 py-1 bg-red-950/60 text-red-300 border border-red-500/50 text-xs font-bold uppercase rounded-md">{t('Blocked')}</span>
                        }
                    </div>
                </div>

                {envInfo && (
                    <div className="bg-purple-950/40 border border-purple-500/40 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-1.5 text-purple-300 font-bold uppercase text-xs">
                            <Zap size={16} /> {t(envInfo.name)}
                        </div>
                        <p className="text-purple-200 text-xs">{t(envInfo.description)}</p>
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-[#293245] bg-[#0b0d14]">
                <EndTurnButton />
            </div>
        </div>
      );
  }

  // --- 3. UNIT INSPECTOR ---
  const isPlayer = !selectedUnit!.isEnemy;
  const skills = extraSkills && extraSkills.length > 0
      ? extraSkills
      : (skillDefs[selectedUnit!.class] || []);
  const isDone = selectedUnit!.hasAttacked; 
  const isDigesting = (selectedUnit!.digestingTurns || 0) > 0;
  const isStunned = !!selectedUnit!.statusEffects?.includes('STUN');
  const isFrozen = !!selectedUnit!.statusEffects?.includes('FREEZE');
  const isDormant = !!selectedUnit!.statusEffects?.includes('DORMANT');

  const blockedReason = isDormant ? t('Knocked out cold. Protect it — it cannot fight back.')
      : isStunned ? t('Stunned — cannot act this turn.')
      : isFrozen ? t('Frozen — cannot act this turn.')
      : isDone ? t('Already acted this turn.')
      : null;
  
  const canUndo = isPlayer && selectedUnit!.hasMoved && !selectedUnit!.hasAttacked && selectedUnit!.prevPosition !== undefined && interactionMode !== 'MOVING' && interactionMode !== 'EXECUTING';

  return (
    <div className="w-64 md:w-80 lg:w-96 cyber-panel border-l border-[#293245] flex flex-col h-full shadow-2xl relative z-30 font-pixel shrink-0 portrait:w-full portrait:h-[45%] portrait:border-l-0 portrait:border-t">
      
      {/* A. HEADER: PORTRAIT & BASIC INFO */}
      <div className={`p-3 lg:p-5 border-b border-[#293245] ${isPlayer ? 'bg-gradient-to-r from-emerald-950/60 to-slate-900/80' : 'bg-gradient-to-r from-red-950/60 to-slate-900/80'} flex gap-3 lg:gap-4 relative`}>
          {/* w-18/h-18 are NOT in this Tailwind build's spacing scale — they resolved to
              nothing, the box fell back to auto, and it grew to the sprite's natural 512px
              inside a 384px panel. overflow-hidden keeps any future oversized art contained. */}
          <div className="relative w-12 h-12 lg:w-16 lg:h-16 bg-[#0b0d14] border-2 border-white/20 rounded-xl shadow-inner shrink-0 overflow-hidden p-1">
              <img 
                 src={mobileSprite(selectedUnit!.imgUrl)}
                 className={`w-full h-full object-contain ${isDone ? 'grayscale opacity-60' : ''}`}
                 alt={t(selectedUnit!.class.replace(/_/g, ' '))}
              />
              <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center stroke-2 border shadow-md z-10 ${isPlayer ? 'bg-emerald-600 border-emerald-300' : 'bg-red-600 border-red-300'}`}>
                  {isPlayer ? (isDone ? <Hourglass size={13} className="text-white"/> : <Zap size={13} className="text-white"/>) : <Skull size={13} className="text-white"/>}
              </div>
          </div>
          <div className="flex-1 flex flex-col justify-center min-w-0">
              <h2 className={`text-xl font-black uppercase leading-tight truncate ${isPlayer ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t(selectedUnit!.class.replace(/_/g, ' '))}
              </h2>
              <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t(selectedUnit!.role)}</span>
                  <span className="text-xs bg-black/60 px-2 py-0.5 rounded-md text-gray-300 border border-gray-700 font-mono">{t('Lv {level}', { level: selectedUnit!.level })}</span>
              </div>
          </div>
      </div>

      {/* B. STATS GRID */}
      <div className="grid grid-cols-2 border-b border-[#293245] divide-x divide-[#293245] bg-[#121622]">
          <div className="p-1.5 lg:p-2.5 flex items-center gap-2 lg:gap-3 justify-center">
              <Shield size={18} className="text-red-400" />
              <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">{t('HP')}</span>
                  <span className="text-base lg:text-lg text-white font-black">{selectedUnit!.hp}/{selectedUnit!.maxHp}</span>
              </div>
          </div>
          <div className="p-1.5 lg:p-2.5 flex items-center gap-2 lg:gap-3 justify-center">
              <Move size={18} className="text-sky-400" />
              <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">{t('Move')}</span>
                  <span className="text-base lg:text-lg text-white font-black">{selectedUnit!.moveRange}</span>
              </div>
          </div>
      </div>

      {/* C. BODY CONTENT */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 lg:p-4 space-y-3.5 bg-[#0b0d14]">
          
          {/* ENEMY INTENT */}
          {!isPlayer && (
              <div className="bg-red-950/40 border border-red-500/40 p-3.5 rounded-xl shadow-inner">
                  <h3 className="text-red-400 uppercase font-black text-xs mb-1.5 flex items-center gap-2"><Skull size={15}/> {t('Enemy Intent')}</h3>
                  <div className="text-white text-sm font-medium leading-snug">
                      {selectedUnit!.intent?.type === 'ATTACK' ? (
                          <>{t('Attacking')} <span className="text-amber-400 font-bold">{formatGridPosition(selectedUnit!.intent.target?.x, selectedUnit!.intent.target?.y)}</span> {t('for')} <span className="text-red-400 font-bold">{t('{dmg} DMG', { dmg: selectedUnit!.intent.damage })}</span></>
                      ) : (
                          <span className="italic text-gray-400 text-xs">{selectedUnit!.intent?.description ? t(selectedUnit!.intent.description) : t('Idle')}</span>
                      )}
                  </div>
                  
                  {/* ENEMY TRAITS */}
                  <div className="mt-3 pt-3 border-t border-red-500/20">
                      <h4 className="text-red-300/80 uppercase font-bold text-[10px] tracking-wider mb-2">{t('Traits')}</h4>
                      <div className="flex flex-wrap gap-1.5">
                          {selectedUnit!.movementType === 'FLYING' && (
                              <span className="px-2 py-0.5 bg-red-900/50 border border-red-700/50 rounded-sm text-[10px] text-red-200 uppercase font-bold">{t('Flying')}</span>
                          )}
                          {selectedUnit!.movementType === 'TELEPORT' && (
                              <span className="px-2 py-0.5 bg-red-900/50 border border-red-700/50 rounded-sm text-[10px] text-red-200 uppercase font-bold">{t('Teleporting')}</span>
                          )}
                          {((selectedUnit as any).armor || 0) > 0 && (
                              <span className="px-2 py-0.5 bg-red-900/50 border border-red-700/50 rounded-sm text-[10px] text-red-200 uppercase font-bold">{t('Armor')} {((selectedUnit as any).armor)}</span>
                          )}
                          {selectedUnit!.immunities?.map(imm => (
                              <span key={imm} className="px-2 py-0.5 bg-red-900/50 border border-red-700/50 rounded-sm text-[10px] text-red-200 uppercase font-bold">
                                  {t('Immune: {imm}', { imm: t(imm) })}
                              </span>
                          ))}
                          {selectedUnit!.movementType === 'WALKING' && !((selectedUnit as any).armor) && (!selectedUnit!.immunities || selectedUnit!.immunities.length === 0) && (
                              <span className="text-[10px] text-red-400/50 italic">{t('No special traits')}</span>
                          )}
                      </div>
                  </div>
              </div>
          )}

          {/* PLAYER ACTIONS */}
          {isPlayer && (
              <>
                {canUndo && (
                    <button 
                        onClick={onUndoMove}
                        className="w-full py-2.5 bg-sky-950/70 hover:bg-sky-900 border border-sky-500 text-sky-200 uppercase font-bold text-xs tracking-widest transition-all flex items-center justify-center gap-2 rounded-lg shadow-lg animate-pulse mb-1 cursor-pointer"
                    >
                        <RotateCcw size={16} /> {t('Undo Move')}
                    </button>
                )}

                {blockedReason && !isDigesting && (
                    <div className="p-2.5 border border-amber-500/40 bg-amber-950/30 text-center rounded-lg text-amber-300 text-xs uppercase font-bold tracking-wide">
                        {blockedReason}
                    </div>
                )}

                {isDigesting ? (
                    <div className="p-5 border border-purple-500/50 bg-purple-950/30 text-center rounded-xl">
                        <Utensils size={36} className="mx-auto text-purple-400 mb-2 animate-bounce" />
                        <div className="text-purple-300 font-black text-base uppercase">{t('Digesting')}</div>
                        <div className="text-purple-300/70 text-xs mt-1">{t('{turns} turns remaining', { turns: selectedUnit!.digestingTurns! })}</div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {skills.map((skill, index) => {
                            const isActive = selectedSkillId === skill.id;
                            // A sun producer may reposition OR bank light, never both in one turn.
                            const isMoveLocked = !!selectedUnit?.hasMoved && isSunProducingSkill(skill);
                            const needsCharge = !!skill.requiresSunCharge && !((selectedUnit!.sunCharge || 0) > 0);
                            const sunCost = skill.sunCost || 0;
                            const cannotAfford = sunCost > 0 && sunCost > currentSun;
                            const isDisabled = isDone || isStunned || isFrozen || isDormant || isMoveLocked || needsCharge || cannotAfford || ((interactionMode === 'TARGETING' || interactionMode === 'ITEM_TARGETING') && !isActive) || interactionMode === 'MOVING' || interactionMode === 'EXECUTING';

                            const disabledReason = blockedReason
                                ? blockedReason
                                : cannotAfford
                                ? t('Need {cost} Sun (you have {have})', { cost: sunCost, have: Number.isFinite(currentSun) ? currentSun : 0 })
                                : needsCharge
                                    ? t('Needs a charge')
                                    : isMoveLocked
                                        ? t('Moving forfeits this turn\'s Sun.')
                                        : undefined;

                            const damageVal = skill.effects.find(e => e.type === 'DAMAGE')?.value || 0;
                            const sunVal = skill.effects.find(e => e.type === 'RESOURCE_GAIN')?.value;
                            const shieldVal = skill.effects.find(e => e.type === 'SHIELD')?.value;
                            const healVal = skill.effects.find(e => e.type === 'HEAL')?.value;
                            
                            let badge = null;
                            if (sunVal) {
                                badge = <span className="text-black bg-amber-400 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 leading-none shadow border border-amber-600">+{sunVal} <Sun size={9} fill="black"/></span>;
                            } else if (shieldVal) {
                                badge = <span className="text-white bg-sky-600 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 leading-none shadow border border-sky-700">+{shieldVal} <Shield size={9} fill="white"/></span>;
                            } else if (healVal) {
                                badge = <span className="text-white bg-emerald-600 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 leading-none shadow border border-emerald-700">+{healVal} <Plus size={9}/></span>;
                            } else if (damageVal > 0) {
                                badge = <span className="text-white bg-red-600 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded leading-none shadow border border-red-800">{t('{dmg} DMG', { dmg: damageVal })}</span>;
                            }

                            const primaryEffect = skill.effects.find(e => e.type !== 'DAMAGE' && e.type !== 'PIERCE_ATTACK' && e.type !== 'RESOURCE_GAIN' && e.type !== 'SHIELD' && e.type !== 'HEAL');

                            // Matches the SKILL_HOTKEYS order wired up in App.
                            const hotkeyLabel = ['Q', 'W', 'E'][index] ?? null;

                            return (
                                <button 
                                    key={skill.id}
                                    onClick={() => isActive ? onCancelAction() : onActionSelect(skill.id)}
                                    data-tut={`skill-${skill.id}`}
                                    disabled={isDisabled}
                                    title={disabledReason || t(skill.description)}
                                    className={`
                                        w-full text-left p-2.5 border transition-all relative group rounded-xl flex flex-col gap-1.5 cursor-pointer
                                        ${isActive 
                                            ? 'bg-amber-950/50 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                                            : 'bg-[#141824] border-[#293245] hover:border-sky-400 hover:bg-[#1a2030]'
                                        }
                                        ${isDisabled && !cannotAfford ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                                        ${cannotAfford ? 'opacity-70 cursor-not-allowed ring-1 ring-red-500/50' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-2 w-full">
                                        {/* Hotkey Keycap */}
                                        {hotkeyLabel && (
                                            <span className="keycap text-[10px] text-amber-300 border-amber-500/40 shrink-0">
                                                {hotkeyLabel}
                                            </span>
                                        )}

                                        <div className="flex items-center justify-center w-5 h-5 bg-[#0b0d14] rounded-md border border-[#293245] text-sky-400 shrink-0" title={t(skill.rangeType)}>
                                             {getIconForRange(skill.rangeType)}
                                        </div>
                                        
                                        <span className={`text-xs font-black uppercase truncate flex-1 ${isActive ? 'text-amber-400' : 'text-gray-100'}`}>{t(skill.name)}</span>

                                        {sunCost > 0 && (
                                            <span
                                                className={`
                                                    font-mono font-bold text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 leading-none shadow border
                                                    ${cannotAfford
                                                        ? 'bg-red-950/80 text-red-300 border-red-500'
                                                        : 'bg-black/60 text-amber-300 border-amber-500/50'}
                                                `}
                                                title={cannotAfford ? t('Need {cost} Sun', { cost: sunCost }) : t('Costs {cost} Sun', { cost: sunCost })}
                                            >
                                                <Sun size={9} className={cannotAfford ? 'text-red-300' : 'text-amber-300'} fill="currentColor" />
                                                {sunCost}
                                            </span>
                                        )}

                                        {badge}
                                    </div>

                                    <div className="flex flex-col pl-7">
                                         <div className="flex flex-wrap gap-1 mb-0.5">
                                             {primaryEffect && (
                                                 <span className="text-[8px] text-sky-300 uppercase bg-sky-950/60 px-1 py-0.5 rounded border border-sky-800/50">
                                                     {t(primaryEffect.type.replace(/_/g, ' '))}
                                                 </span>
                                             )}
                                             {cannotAfford && (
                                                <span className="text-[8px] text-red-300 uppercase bg-red-950/60 px-1 py-0.5 rounded border border-red-500/60 flex items-center gap-1">
                                                    <Sun size={8} /> {t('Need {cost} Sun', { cost: sunCost })}
                                                </span>
                                             )}
                                         </div>
                                         <span className={`text-[11px] text-gray-400 leading-tight ${isActive ? 'text-gray-200' : ''}`}>
                                            {t(skill.description)}
                                         </span>
                                    </div>
                                    
                                    {isActive && <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400 animate-pulse"><ArrowRight size={16} /></div>}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="flex gap-2 pt-1 mt-auto">
                    {!isDone && (
                        <button 
                            onClick={onWait}
                            disabled={interactionMode !== 'IDLE'}
                            className="flex-1 py-2 border border-dashed border-[#293245] text-gray-400 hover:text-white hover:border-sky-400 hover:bg-[#141824] uppercase font-bold text-xs transition-colors rounded-lg cursor-pointer"
                        >
                            {t('Wait')}
                        </button>
                    )}
                    
                    {(interactionMode === 'TARGETING' || interactionMode === 'ITEM_TARGETING') && (
                        <button 
                            onClick={onCancelAction} 
                            className="flex-1 py-2 bg-red-950/60 hover:bg-red-900/80 border border-red-500 text-red-200 uppercase font-bold text-xs transition-colors flex items-center justify-center gap-1.5 rounded-lg cursor-pointer"
                        >
                            <XCircle size={14} /> {t('Cancel')}
                        </button>
                    )}
                </div>
              </>
          )}
      </div>

      {/* D. FOOTER ACTIONS (End Turn) */}
      <div className="p-2 lg:p-3 border-t border-[#293245] bg-[#0b0d14]">
          <EndTurnButton />
      </div>

    </div>
  );
};

const getIconForRange = (type: string) => {
    switch (type) {
        case 'LINE': return <Crosshair size={12} />;
        case 'MELEE': return <Sword size={12} />;
        case 'ADJACENT': return <Zap size={12} />;
        case 'DASH': return <ChevronsRight size={12} />;
        case 'LOB': return <Radar size={12} />;
        case 'SELF': return <UserPlus size={12} />;
        default: return <Shield size={12} />;
    }
}
