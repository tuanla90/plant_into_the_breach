
import React from 'react';
import { GameState, ItemDefinition } from '../types';
import { Sun as Sol, Coins, Sprout, Users, Settings, Flag, FastForward, SkipForward, Target, Zap } from 'lucide-react';
import { useI18n } from '../i18n';
import { mobileSprite } from '../utils/platform';

interface HUDProps {
  gameState: GameState;
  itemDefs?: ItemDefinition[];
  onEndTurn: () => void;
  onToggleAdmin: () => void;
  onOpenSettings?: () => void;
  onSelectItem: (itemId: string) => void;
  onOpenSquad: () => void;
  onQuitRun: () => void;
  speed?: number;
  onToggleSpeed?: () => void;
  onSkipAnimation?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  gameState,
  itemDefs = [],
  onToggleAdmin,
  onOpenSettings,
  onSelectItem,
  onOpenSquad,
  onQuitRun,
  speed = 1,
  onToggleSpeed,
  onSkipAnimation
}) => {
  const { t } = useI18n();
  const playerItems = gameState.inventory.map(id => itemDefs.find(def => def.id === id)).filter(Boolean) as ItemDefinition[];

  const showQuit = gameState.screen !== 'START_MENU' && gameState.screen !== 'GAME_OVER' && gameState.screen !== 'VICTORY';
  const brainsMax = gameState.brainsMax || 0;
  const brainsLeft = Math.max(0, gameState.brainsRemaining ?? 0);
  const brainsCritical = brainsLeft <= 1;
  const isFast = speed > 1;

  return (
    // No fixed height and no absolutely-centred block: every cluster lives in normal flex
    // flow so narrow viewports squeeze (then hide labels) instead of stacking three groups
    // on top of one another. The mission objective drops to its own strip below lg.
    // pt-[env(safe-area-inset-top)] chỉ có tác dụng khi chạy PWA toàn màn hình trên
    // iPhone cầm dọc: ở đó trang vẽ tràn lên dưới tai thỏ (viewport-fit=cover), và
    // hàng Sol / Xu nằm khuất một nửa sau thanh trạng thái. Mọi nơi khác env()
    // trả 0 nên dòng này không đổi gì.
    <header className="w-full bg-[#0b0d14]/90 border-b border-[#293245] z-50 shadow-2xl shrink-0 relative backdrop-blur-md font-pixel select-none portrait:pt-[env(safe-area-inset-top,0px)]">
      {/* Glow Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-sky-400 to-amber-400 opacity-80" />

      {/* Màn dọc hẹp không đủ chỗ cho ba cụm trên một hàng — cho wrap: cụm nút
          rơi xuống hàng hai thay vì đè lên cụm giữa. h-auto để header nở theo. */}
      <div className="h-14 lg:h-16 portrait:h-auto portrait:flex-wrap portrait:justify-center portrait:py-1 flex items-center justify-between gap-2 lg:gap-4 px-2 sm:px-3 lg:px-5">

      {/* LEFT: Currencies & Item Belt */}
      <div className="flex items-center gap-1.5 lg:gap-3 min-w-0">

        {/* SUN ECONOMY */}
        <div
            className="h-10 flex items-center gap-1.5 lg:gap-2.5 px-2 lg:px-3 bg-gradient-to-r from-amber-950/60 to-yellow-950/40 border border-yellow-500/50 rounded-lg shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            title={t('Sol — spent on hero skills. Resets every level.')}
        >
             <div className="bg-yellow-900/60 p-1.5 rounded-full border border-yellow-400/60 shadow-inner">
                 <Sol size={18} className="text-yellow-300 fill-yellow-400 animate-spin-slow" />
             </div>
             <div className="flex flex-col leading-none">
                 <span className="hidden md:block text-[9px] uppercase tracking-widest text-amber-400 font-bold">{t('Sol')}</span>
                 <span className="text-lg lg:text-xl font-black text-yellow-300 tabular-nums drop-shadow">{gameState.sun}</span>
             </div>
        </div>

        {/* COIN PROGRESSION */}
        <div
            className="h-10 flex items-center gap-1.5 lg:gap-2.5 px-2 lg:px-3 bg-gradient-to-r from-cyan-950/60 to-slate-900/50 border border-cyan-500/40 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.15)]"
            title={t('Coin — spent between levels on plants, items and revives.')}
        >
             <div className="bg-cyan-900/50 p-1.5 rounded-md border border-cyan-400/50">
                 <Coins size={18} className="text-cyan-300" />
             </div>
             <div className="flex flex-col leading-none">
                 <span className="hidden md:block text-[9px] uppercase tracking-widest text-cyan-400 font-bold">{t('Coin')}</span>
                 <span className="text-lg lg:text-xl font-black text-cyan-200 tabular-nums">{gameState.coins}</span>
             </div>
        </div>

        {/* ITEM BELT */}
        <div className="h-10 px-2 lg:px-2.5 bg-[#121622]/80 border border-[#293245] rounded-lg flex items-center gap-1.5 shadow-inner">
             <span className="hidden xl:inline text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">{t('Items')}</span>
             {playerItems.map((item, index) => {
                 const isSelected = gameState.selectedItemId === item.id;
                 return (
                     <button
                        key={`${item.id}-${index}`}
                        onClick={() => onSelectItem(item.id)}
                        data-tut={`item-${item.id}`}
                        className={`
                            relative w-8 h-8 rounded border flex items-center justify-center transition-all duration-150
                            ${isSelected ? 'border-amber-400 bg-amber-950/80 scale-110 z-10 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'border-[#293245] bg-[#1a202c] hover:border-sky-400 hover:bg-[#252d3d]'}
                        `}
                        title={t(item.name)}
                     >
                         <img src={mobileSprite(item.imgUrl)} className="w-6 h-6 object-contain" alt={item.name} />
                     </button>
                 );
             })}
             {playerItems.length === 0 && <span className="text-[11px] text-gray-500 italic px-2">{t('Empty')}</span>}
        </div>

      </div>

      {/* CENTER: BRAINS DEFENSE BAR & MISSION OBJECTIVE */}
      <div className="flex items-center justify-center gap-2 lg:gap-4 min-w-0">

          <div
              className={`
                  shrink-0 flex items-center gap-2 lg:gap-3 px-2 lg:px-4 h-11 border-2 rounded-lg shadow-xl backdrop-blur-md transition-all
                  ${brainsCritical
                      ? 'bg-red-950/80 border-red-500 animate-threat shadow-[0_0_24px_rgba(239,68,68,0.6)]'
                      : 'bg-[#221028]/80 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.2)]'}
              `}
          >
              <Sprout
                  size={26}
                  className={brainsCritical ? 'text-red-400 fill-red-900 animate-bounce' : 'text-pink-300 fill-pink-900/60'}
              />
              <div className="flex flex-col leading-none">
                  <span className={`text-[9px] uppercase tracking-[0.2em] font-extrabold ${brainsCritical ? 'text-red-300' : 'text-pink-400'}`}>
                      {t('Sprouts')}
                  </span>
                  <div className="flex items-baseline gap-1">
                      <span className={`text-xl lg:text-2xl font-black tabular-nums leading-none ${brainsCritical ? 'text-red-400' : 'text-white'}`}>
                          {brainsLeft}
                      </span>
                      <span className="text-sm font-bold text-gray-500 leading-none">/{brainsMax}</span>
                  </div>
              </div>

              {/* Segmented Health Battery Pips (labels-first on tight screens: the count
                  is the signal, the battery is garnish) */}
              <div className="hidden md:flex gap-1 ml-1">
                  {Array.from({ length: brainsMax }).map((_, i) => (
                      <div
                          key={i}
                          className={`w-2.5 h-4 rounded-sm border ${i < brainsLeft
                              ? (brainsCritical ? 'bg-red-500 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-pink-500 border-pink-300 shadow-[0_0_6px_rgba(236,72,153,0.5)]')
                              : 'bg-gray-800/80 border-gray-700'}`}
                      />
                  ))}
              </div>
          </div>

          {brainsCritical && (
              <div className="hidden xl:block text-[11px] uppercase tracking-widest text-red-400 font-black max-w-[8rem] leading-tight animate-pulse">
                  {brainsLeft === 0 ? t('No sprouts left') : t('CRITICAL! Hold the line')}
              </div>
          )}

          {/* Turn Counter Badge */}
          <div className="shrink-0 flex flex-col items-center leading-none px-2 lg:px-3 py-1 bg-[#131722] border border-[#293245] rounded-md">
              <span className="text-[8px] uppercase tracking-[0.2em] text-sky-400 font-bold">{t('Turn')}</span>
              <span className="text-base font-black text-gray-200 tabular-nums">
                  {gameState.turn}
                  {/* A boss arena has no clock (utils/turnManager.ts, SLAY_BOSS). Showing
                      "3/5" there would promise a deadline that cannot arrive, and the
                      player would spend the fight racing something imaginary. */}
                  {gameState.mission?.objective !== 'SLAY_BOSS' && (
                      <span className="text-gray-500 text-xs">/{gameState.maxTurns}</span>
                  )}
              </span>
          </div>

          {/* Mission Objectives Badge — inline only at lg+; below that it moves to the
              strip under the bar, where a narrow screen gives it a full row to itself. */}
          {gameState.mission && (
              <div className="hidden lg:flex flex-col gap-0.5 border-l border-[#293245] pl-4 min-w-0 max-w-[11rem] xl:max-w-[26rem]">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <Target size={14} className="animate-pulse" />
                      <span className="text-[9px] uppercase tracking-[0.2em]">{t('Objective')}</span>
                  </div>
                  <div className="text-xs text-gray-200 leading-tight font-medium truncate xl:whitespace-normal" title={t(gameState.mission.description)}>
                      {t(gameState.mission.description)}
                  </div>

                  {/* Optional goals. Worthless if invisible: the player has to know a bonus
                      is in play, and how close it is, while there is still time to chase it. */}
                  {gameState.mission.bonuses.length > 0 && (
                      <div className="hidden xl:flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                          {gameState.mission.bonuses.map(bonus => {
                              const killGoal = bonus.type === 'KILL_COUNT' ? (bonus.count || 0) : 0;
                              const killed = gameState.mission!.zombiesKilled;
                              const done = bonus.type === 'KILL_COUNT' && killed >= killGoal;

                              return (
                                  <span
                                      key={bonus.type}
                                      className={`flex items-center gap-1 text-[10px] leading-tight ${done ? 'text-emerald-300' : 'text-gray-400'}`}
                                      title={t(bonus.description)}
                                  >
                                      <span className="flex items-center gap-0.5 font-bold text-amber-300/90">
                                          <Coins size={10} />+{bonus.coins}
                                      </span>
                                      <span className="uppercase tracking-wide">{t(bonus.description)}</span>
                                      {bonus.type === 'KILL_COUNT' && (
                                          <span className={`font-mono font-bold ${done ? 'text-emerald-300' : 'text-gray-300'}`}>
                                              ({killed}/{killGoal})
                                          </span>
                                      )}
                                  </span>
                              );
                          })}
                      </div>
                  )}
              </div>
          )}
      </div>

      {/* RIGHT: Controls & Settings */}
      <div className="flex gap-1 lg:gap-2 shrink-0">
         {/* FAST FORWARD (toggle) */}
         <button
             onClick={() => onToggleSpeed && onToggleSpeed()}
             disabled={!onToggleSpeed}
             className={`
                 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center border rounded-lg transition-all shadow-lg active:scale-95 cursor-pointer relative
                 ${isFast
                     ? 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                     : 'bg-[#181d2a] border-[#293245] text-gray-400 hover:text-white hover:border-sky-400'}
                 ${!onToggleSpeed ? 'opacity-40 cursor-not-allowed' : ''}
             `}
             title={isFast ? t('Fast forward ON ({speed}x) — click for normal speed', { speed }) : t('Fast forward animations')}
         >
             <FastForward size={18} fill={isFast ? 'currentColor' : 'none'} />
             {isFast && (
                 <span className="absolute -bottom-1 -right-1 text-[9px] font-black bg-amber-400 text-black px-1 rounded-sm leading-none">
                     {speed}x
                 </span>
             )}
         </button>

         {/* SKIP TURN ANIMATION */}
         <button
             onClick={() => onSkipAnimation && onSkipAnimation()}
             disabled={!onSkipAnimation}
             className={`
                 bg-[#181d2a] p-2 min-w-[40px] min-h-[40px] flex items-center justify-center border border-[#293245] text-gray-400 hover:text-white hover:border-sky-400 transition-all shadow-md active:scale-95 rounded-lg cursor-pointer
                 ${!onSkipAnimation ? 'opacity-40 cursor-not-allowed' : ''}
             `}
             title={t("Skip the rest of this turn's animation")}
         >
             <SkipForward size={18} />
         </button>

         {showQuit && (
             <button
                 onClick={onQuitRun}
                 className="bg-red-950/40 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center border border-red-800/60 text-red-400 hover:text-red-200 hover:border-red-500 transition-all shadow-md active:scale-95 rounded-lg cursor-pointer"
                 title={t('Abandon Run')}
             >
                 <Flag size={18} />
             </button>
         )}

         <button
             onClick={onOpenSquad}
             className="bg-[#181d2a] p-2 min-w-[40px] min-h-[40px] flex items-center justify-center border border-[#293245] text-emerald-400 hover:text-emerald-300 hover:border-emerald-500 transition-all shadow-md active:scale-95 rounded-lg cursor-pointer"
             title={t('View Squad')}
         >
             <Users size={18} />
         </button>
         <button
             onClick={() => onOpenSettings ? onOpenSettings() : onToggleAdmin()}
             className="bg-[#181d2a] p-2 min-w-[40px] min-h-[40px] flex items-center justify-center border border-[#293245] text-sky-400 hover:text-white hover:border-sky-400 transition-all shadow-md active:scale-95 rounded-lg cursor-pointer"
             title={t('Cài Đặt')}
         >
             <Settings size={18} />
         </button>
      </div>

      </div>

      {/* MISSION STRIP (< lg): one full-width line under the bar. Same information as the
          inline badge above, compressed to fit — description truncates, bonuses collapse
          to their coin value (+ kill counter), full text stays reachable via title. */}
      {gameState.mission && (
          <div className="lg:hidden flex items-center gap-2 px-3 pb-1 -mt-0.5 min-w-0">
              <Target size={12} className="text-amber-400 shrink-0" />
              <span
                  className="text-[11px] text-gray-200 leading-tight font-medium truncate min-w-0"
                  title={t(gameState.mission.description)}
              >
                  {t(gameState.mission.description)}
              </span>
              {gameState.mission.bonuses.map(bonus => {
                  const killGoal = bonus.type === 'KILL_COUNT' ? (bonus.count || 0) : 0;
                  const killed = gameState.mission!.zombiesKilled;
                  const done = bonus.type === 'KILL_COUNT' && killed >= killGoal;
                  return (
                      <span
                          key={bonus.type}
                          className={`shrink-0 flex items-center gap-0.5 text-[10px] font-bold ${done ? 'text-emerald-300' : 'text-amber-300/90'}`}
                          title={t(bonus.description)}
                      >
                          <Coins size={10} />+{bonus.coins}
                          {bonus.type === 'KILL_COUNT' && (
                              <span className="font-mono">({killed}/{killGoal})</span>
                          )}
                      </span>
                  );
              })}
          </div>
      )}

    </header>
  );
};

